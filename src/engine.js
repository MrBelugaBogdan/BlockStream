import * as THREE from 'three';
import { PointerLockControls } from 'three/addons/controls/PointerLockControls.js';

export class GameEngine {
    constructor() {
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0x70a1ff);
        this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
        this.renderer = new THREE.WebGLRenderer({ antialias: true });
        
        this.controls = new PointerLockControls(this.camera, document.body);
        this.keys = {};
        this.raycaster = new THREE.Raycaster();
        this.loader = new THREE.TextureLoader();
    }

    init() {
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        document.body.appendChild(this.renderer.domElement);

        const light = new THREE.DirectionalLight(0xffffff, 1);
        light.position.set(10, 20, 10);
        this.scene.add(light);
        this.scene.add(new THREE.AmbientLight(0xffffff, 0.5));

        // Шляхи до твоїх текстур (завантаж їх у папку assets на GitHub)
        const grassTex = this.loader.load('./assets/grass.png');
        const stoneTex = this.loader.load('./assets/stone.png');

        // Налаштування, щоб текстури не були розмитими (піксель-арт стиль)
        [grassTex, stoneTex].forEach(t => {
            t.magFilter = THREE.NearestFilter;
            t.minFilter = THREE.NearestFilter;
        });

        this.createWorld(grassTex, stoneTex);

        // Події
        document.addEventListener('keydown', (e) => this.keys[e.code] = true);
        document.addEventListener('keyup', (e) => this.keys[e.code] = false);
        document.addEventListener('click', () => {
            if (this.controls.isLocked) {
                this.breakBlock();
            } else {
                this.controls.lock();
            }
        });

        this.camera.position.set(8, 5, 20);
        this.animate();
    }

    createWorld(grassTex, stoneTex) {
        const geometry = new THREE.BoxGeometry(1, 1, 1);
        const grassMat = new THREE.MeshStandardMaterial({ map: grassTex });
        const stoneMat = new THREE.MeshStandardMaterial({ map: stoneTex });

        for (let x = 0; x < 16; x++) {
            for (let z = 0; z < 16; z++) {
                const h = Math.floor(Math.random() * 2) + 2;
                for (let y = 0; y <= h; y++) {
                    const block = new THREE.Mesh(geometry, y === h ? grassMat : stoneMat);
                    block.position.set(x, y, z);
                    block.name = "voxel";
                    this.scene.add(block);
                }
            }
        }
    }

    breakBlock() {
        this.raycaster.setFromCamera(new THREE.Vector2(0, 0), this.camera);
        const intersects = this.raycaster.intersectObjects(this.scene.children);
        if (intersects.length > 0 && intersects[0].object.name === "voxel") {
            this.scene.remove(intersects[0].object);
        }
    }

    animate() {
        requestAnimationFrame(() => this.animate());
        if (this.controls.isLocked) {
            const s = 0.15;
            if (this.keys['KeyW']) this.controls.moveForward(s);
            if (this.keys['KeyS']) this.controls.moveForward(-s);
            if (this.keys['KeyA']) this.controls.moveRight(-s);
            if (this.keys['KeyD']) this.controls.moveRight(s);
        }
        this.renderer.render(this.scene, this.camera);
    }
}
