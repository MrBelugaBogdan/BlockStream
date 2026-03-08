import * as THREE from 'three';
import { PointerLockControls } from 'three/addons/controls/PointerLockControls.js';

export class GameEngine {
    constructor() {
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0x70a1ff);
        // Зменшуємо дальність промальовування для економії пам'яті
        this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 300);
        this.renderer = new THREE.WebGLRenderer({ antialias: false }); 
        
        this.controls = new PointerLockControls(this.camera, document.body);
        this.keys = {};
        this.loader = new THREE.TextureLoader();

        this.velocity = new THREE.Vector3(); 
        this.playerHeight = 1.8;
        
        this.chunks = {};
        this.chunkSize = 16;
        this.renderDistance = 1; // 1 чанк навколо — ідеально для слабких телефонів
    }

    init() {
        // Вимикаємо високу чіткість для швидкості на мобільних
        this.renderer.setPixelRatio(1);
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        document.body.appendChild(this.renderer.domElement);

        this.scene.add(new THREE.AmbientLight(0xffffff, 1.0));

        const grassTex = this.loader.load('./assets/grass.png');
        const stoneTex = this.loader.load('./assets/stone.png');
        
        [grassTex, stoneTex].forEach(t => { 
            t.magFilter = THREE.NearestFilter; 
            t.minFilter = THREE.NearestFilter; 
        });

        this.mats = {
            grass: new THREE.MeshLambertMaterial({ map: grassTex }),
            stone: new THREE.MeshLambertMaterial({ map: stoneTex })
        };

        this.updateChunks();

        document.addEventListener('keydown', (e) => this.keys[e.code] = true);
        document.addEventListener('keyup', (e) => this.keys[e.code] = false);
        document.addEventListener('click', () => this.controls.lock());

        this.camera.position.set(8, 25, 8);
        this.animate();
    }

    createChunk(cx, cz) {
        const key = `${cx},${cz}`;
        if (this.chunks[key]) return;

        const count = this.chunkSize * this.chunkSize;
        // Правильне створення InstancedMesh
        const grassMesh = new THREE.InstancedMesh(new THREE.BoxGeometry(1, 1, 1), this.mats.grass, count);
        const stoneMesh = new THREE.InstancedMesh(new THREE.BoxGeometry(1, 1, 1), this.mats.stone, count);

        const matrix = new THREE.Matrix4();
        let gIdx = 0;
        let sIdx = 0;

        for (let x = 0; x < this.chunkSize; x++) {
            for (let z = 0; z < this.chunkSize; z++) {
                const worldX = cx * this.chunkSize + x;
                const worldZ = cz * this.chunkSize + z;
                
                // Генерація ландшафту (як у MultiCraft)
                const h = Math.floor(Math.abs(Math.sin(worldX * 0.1) * Math.cos(worldZ * 0.1)) * 5) + 10;

                // Трава зверху
                matrix.setPosition(worldX, h, worldZ);
                grassMesh.setMatrixAt(gIdx++, matrix);

                // Тільки ОДИН шар каменю під травою для економії FPS
                matrix.setPosition(worldX, h - 1, worldZ);
                stoneMesh.setMatrixAt(sIdx++, matrix);
            }
        }

        this.scene.add(grassMesh);
        this.scene.add(stoneMesh);
        this.chunks[key] = { grassMesh, stoneMesh };
    }

    updateChunks() {
        const pCX = Math.floor(this.camera.position.x / this.chunkSize);
        const pCZ = Math.floor(this.camera.position.z / this.chunkSize);

        for (let x = -this.renderDistance; x <= this.renderDistance; x++) {
            for (let z = -this.renderDistance; z <= this.renderDistance; z++) {
                this.createChunk(pCX + x, pCZ + z);
            }
        }
    }

    animate() {
        requestAnimationFrame(() => this.animate());

        if (this.controls.isLocked) {
            const delta = 0.016;
            this.velocity.y -= 25.0 * delta;

            const speed = 0.15;
            if (this.keys['KeyW']) this.controls.moveForward(speed);
            if (this.keys['KeyS']) this.controls.moveForward(-speed);
            if (this.keys['KeyA']) this.controls.moveRight(-speed);
            if (this.keys['KeyD']) this.controls.moveRight(speed);

            this.camera.position.y += this.velocity.y * delta;

            // Спрощена "швидка" колізія з підлогою
            if (this.camera.position.y < 16) {
                this.velocity.y = 0;
                this.camera.position.y = 16;
                if (this.keys['Space']) this.velocity.y = 9;
            }

            // Перевіряємо чанки тільки при переході межі
            if (Math.floor(this.camera.position.x) % 16 === 0) {
                this.updateChunks();
            }
        }
        this.renderer.render(this.scene, this.camera);
    }
}
