import * as THREE from 'three';
import { PointerLockControls } from 'three/addons/controls/PointerLockControls.js';

export class GameEngine {
    constructor() {
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0x70a1ff); // Колір неба
        this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
        this.renderer = new THREE.WebGLRenderer({ antialias: true });
        
        this.controls = new PointerLockControls(this.camera, document.body);
        this.keys = {};
        this.raycaster = new THREE.Raycaster();
        this.moveSpeed = 0.15;
    }

    init() {
        this.renderer.setPixelRatio(window.devicePixelRatio);
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        document.body.appendChild(this.renderer.domElement);

        // Потужне освітлення
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
        this.scene.add(ambientLight);

        const sun = new THREE.DirectionalLight(0xffffff, 1.0);
        sun.position.set(50, 100, 50);
        this.scene.add(sun);

        // Генерація початкового ландшафту
        this.createWorld();

        // Події
        document.addEventListener('keydown', (e) => this.keys[e.code] = true);
        document.addEventListener('keyup', (e) => this.keys[e.code] = false);
        document.addEventListener('click', () => { if(!this.controls.isLocked) this.controls.lock(); });

        this.camera.position.set(8, 5, 20);
        this.animate();
    }

    createWorld() {
        const geometry = new THREE.BoxGeometry(1, 1, 1);
        const material = new THREE.MeshStandardMaterial({ color: 0x55efc4 });

        // Створюємо масив 16x16 (основа чанка)
        for (let x = 0; x < 16; x++) {
            for (let z = 0; z < 16; z++) {
                const height = Math.floor(Math.random() * 3); // Невелика нерівність
                for(let y = 0; y <= height; y++) {
                    const block = new THREE.Mesh(geometry, material);
                    block.position.set(x, y, z);
                    this.scene.add(block);
                }
            }
        }
    }

    animate() {
        requestAnimationFrame(() => this.animate());

        if (this.controls.isLocked) {
            if (this.keys['KeyW']) this.controls.moveForward(this.moveSpeed);
            if (this.keys['KeyS']) this.controls.moveForward(-this.moveSpeed);
            if (this.keys['KeyA']) this.controls.moveRight(-this.moveSpeed);
            if (this.keys['KeyD']) this.controls.moveRight(this.moveSpeed);
        }

        this.renderer.render(this.scene, this.camera);
    }
}
