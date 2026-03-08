import * as THREE from 'three';
import { PointerLockControls } from 'three/addons/controls/PointerLockControls.js';

export class GameEngine {
    constructor() {
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0x70a1ff); // Небо
        this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
        this.renderer = new THREE.WebGLRenderer({ antialias: true });
        
        this.controls = new PointerLockControls(this.camera, document.body);
        this.keys = {};
        this.raycaster = new THREE.Raycaster();
        this.loader = new THREE.TextureLoader();

        // ФІЗИКА
        this.velocity = new THREE.Vector3(); 
        this.canJump = false;
    }

    init() {
        this.renderer.setPixelRatio(window.devicePixelRatio);
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        document.body.appendChild(this.renderer.domElement);

        // Світло
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.8);
        this.scene.add(ambientLight);
        const sun = new THREE.DirectionalLight(0xffffff, 1.0);
        sun.position.set(10, 20, 10);
        this.scene.add(sun);

        // Завантаження твоїх текстур з папки assets
        const grassTex = this.loader.load('./assets/grass.png');
        const stoneTex = this.loader.load('./assets/stone.png');

        // Робимо пікселі чіткими (Pixel Art style)
        [grassTex, stoneTex].forEach(t => {
            t.magFilter = THREE.NearestFilter;
            t.minFilter = THREE.NearestFilter;
        });

        this.createWorld(grassTex, stoneTex);

        // Обробка клавіш та миші
        document.addEventListener('keydown', (e) => this.keys[e.code] = true);
        document.addEventListener('keyup', (e) => this.keys[e.code] = false);
        
        document.addEventListener('click', () => {
            if (this.controls.isLocked) {
                this.interact(true); // Лівий клік — ламаємо блок
            } else {
                this.controls.lock(); 
            }
        });

        this.camera.position.set(8, 10, 20);
        this.animate();
    }

    createWorld(grassTex, stoneTex) {
        const geometry = new THREE.BoxGeometry(1, 1, 1);
        const grassMat = new THREE.MeshStandardMaterial({ map: grassTex });
        const stoneMat = new THREE.MeshStandardMaterial({ map: stoneTex });

        for (let x = 0; x < 16; x++) {
            for (let z = 0; z < 16; z++) {
                const height = Math.floor(Math.random() * 2) + 2;
                for (let y = 0; y <= height; y++) {
                    const block = new THREE.Mesh(geometry, y === height ? grassMat : stoneMat);
                    block.position.set(x, y, z);
                    block.name = "voxel";
                    this.scene.add(block);
                }
            }
        }
    }

    interact(isBreaking) {
        this.raycaster.setFromCamera(new THREE.Vector2(0, 0), this.camera);
        const intersects = this.raycaster.intersectObjects(this.scene.children);

        if (intersects.length > 0) {
            const hit = intersects[0];
            if (hit.object.name === "voxel" && isBreaking) {
                this.scene.remove(hit.object);
            }
        }
    }

    animate() {
        requestAnimationFrame(() => this.animate());

        if (this.controls.isLocked) {
            const time = 0.016; // Приблизно 60 FPS
            
            // Гравітація (падіння)
            this.velocity.y -= 25.0 * time; 

            // Рух WASD
            const speed = 0.15;
            if (this.keys['KeyW']) this.controls.moveForward(speed);
            if (this.keys['KeyS']) this.controls.moveForward(-speed);
            if (this.keys['KeyA']) this.controls.moveRight(-speed);
            if (this.keys['KeyD']) this.controls.moveRight(speed);

            // Застосовуємо вертикальну швидкість
            this.camera.position.y += this.velocity.y * time;

            // Проста колізія з підлогою (висота 4 блоки)
            if (this.camera.position.y < 4) {
                this.velocity.y = 0;
                this.camera.position.y = 4;
                this.canJump = true;
            }

            // Стрибок на Space
            if (this.keys['Space'] && this.canJump) {
                this.velocity.y = 8.0; 
                this.canJump = false;
            }
        }

        this.renderer.render(this.scene, this.camera);
    }
}
