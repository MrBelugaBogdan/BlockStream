import * as THREE from 'three';
import { PointerLockControls } from 'three/addons/controls/PointerLockControls.js';

export class GameEngine {
    constructor() {
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0x70a1ff);
        this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 100);
        this.renderer = new THREE.WebGLRenderer({ antialias: false });
        
        this.controls = new PointerLockControls(this.camera, document.body);
        this.keys = {};
        this.raycaster = new THREE.Raycaster();
        this.loader = new THREE.TextureLoader();

        this.velocity = new THREE.Vector3();
        this.canJump = false;
        this.playerHeight = 1.7;

        this.chunks = new Map(); // Зберігаємо блоки тут
        this.chunkSize = 8; // Менші чанки для кращої пам'яті
        this.renderDistance = 2; 
        
        this.blockGeo = new THREE.BoxGeometry(1, 1, 1);
        this.selectedBlock = 'grass';
    }

    init() {
        this.renderer.setPixelRatio(1);
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        document.body.appendChild(this.renderer.domElement);

        this.scene.add(new THREE.AmbientLight(0xffffff, 1.0));

        const grassTex = this.loader.load('./assets/grass.png');
        const stoneTex = this.loader.load('./assets/stone.png');
        [grassTex, stoneTex].forEach(t => { t.magFilter = THREE.NearestFilter; t.minFilter = THREE.NearestFilter; });

        this.mats = {
            grass: new THREE.MeshLambertMaterial({ map: grassTex }),
            stone: new THREE.MeshLambertMaterial({ map: stoneTex })
        };

        this.updateChunks();

        document.addEventListener('keydown', (e) => {
            this.keys[e.code] = true;
            if (e.code === 'Digit1') this.selectedBlock = 'grass';
            if (e.code === 'Digit2') this.selectedBlock = 'stone';
        });
        document.addEventListener('keyup', (e) => this.keys[e.code] = false);
        
        document.addEventListener('mousedown', (e) => {
            if (this.controls.isLocked) {
                this.interact(e.button === 0); // true для ЛКМ (ламати), false для ПКМ (ставити)
            } else {
                this.controls.lock();
            }
        });

        this.camera.position.set(4, 15, 4);
        this.animate();
    }

    createChunk(cx, cz) {
        const key = `${cx},${cz}`;
        if (this.chunks.has(key)) return;

        const blocks = [];
        for (let x = 0; x < this.chunkSize; x++) {
            for (let z = 0; z < this.chunkSize; z++) {
                const wx = cx * this.chunkSize + x;
                const wz = cz * this.chunkSize + z;
                
                // Генерація ландшафту
                const h = Math.floor(Math.abs(Math.sin(wx * 0.2) * Math.cos(wz * 0.2)) * 4) + 5;

                // Тільки видимий шар
                const block = new THREE.Mesh(this.blockGeo, this.mats.grass);
                block.position.set(wx, h, wz);
                block.name = "voxel";
                this.scene.add(block);
                blocks.push(block);
            }
        }
        this.chunks.set(key, blocks);
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

    interact(isBreaking) {
        this.raycaster.setFromCamera(new THREE.Vector2(0, 0), this.camera);
        const intersects = this.raycaster.intersectObjects(this.scene.children);

        if (intersects.length > 0) {
            const hit = intersects[0];
            if (hit.object.name === "voxel") {
                if (isBreaking) {
                    this.scene.remove(hit.object);
                } else {
                    const pos = hit.object.position.clone().add(hit.face.normal);
                    const newBlock = new THREE.Mesh(this.blockGeo, this.mats[this.selectedBlock]);
                    newBlock.position.copy(pos);
                    newBlock.name = "voxel";
                    this.scene.add(newBlock);
                }
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

            // РЕАЛЬНА КОЛІЗІЯ (Down Ray)
            const ray = new THREE.Raycaster(this.camera.position, new THREE.Vector3(0, -1, 0));
            const hits = ray.intersectObjects(this.scene.children);

            if (hits.length > 0 && hits[0].distance < this.playerHeight) {
                this.velocity.y = 0;
                this.camera.position.y += (this.playerHeight - hits[0].distance);
                this.canJump = true;
            } else {
                this.canJump = false;
            }

            if (this.keys['Space'] && this.canJump) this.velocity.y = 9;

            // Оновлюємо чанки кожні 4 блоки руху
            if (Math.floor(this.camera.position.x) % 4 === 0) this.updateChunks();
        }
        this.renderer.render(this.scene, this.camera);
    }
}
