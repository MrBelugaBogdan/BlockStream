import * as THREE from 'three';
import { World } from './world.js';
import { UI } from './ui.js';
import { PointerLockControls } from 'three/addons/controls/PointerLockControls.js';

export class GameEngine {
    constructor() {
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0x70a1ff);
        this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 150);
        this.renderer = new THREE.WebGLRenderer({ antialias: false });
        
        this.controls = new PointerLockControls(this.camera, document.body);
        this.keys = {};
        this.loader = new THREE.TextureLoader();

        this.velocity = new THREE.Vector3();
        this.playerHeight = 1.7;
        this.inventory = ['grass', 'stone', 'wood', 'leaves'];
        this.selectedSlot = 0;
    }

    // ТА САМА ФУНКЦІЯ, ЯКОЇ НЕ ВИСТАЧАЛО
    loadMaterials() {
        const mats = {};
        this.inventory.forEach(name => {
            const t = this.loader.load(`./assets/${name}.png`);
            t.magFilter = t.minFilter = THREE.NearestFilter;
            mats[name] = new THREE.MeshLambertMaterial({ map: t });
        });
        return mats;
    }

    async init() {
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        document.body.appendChild(this.renderer.domElement);
        this.scene.add(new THREE.AmbientLight(0xffffff, 1.0));

        this.mats = this.loadMaterials(); // Тепер вона працює!
        this.world = new World(this.scene, this.mats);
        
        // Початкове завантаження світу
        this.camera.position.set(4, 20, 4);
        this.world.generateChunk(0, 0);

        UI.createHotbar(this.inventory, this.selectedSlot);

        document.addEventListener('keydown', (e) => {
            this.keys[e.code] = true;
            if (e.code.startsWith('Digit')) {
                this.selectedSlot = (parseInt(e.code.replace('Digit', '')) - 1) % this.inventory.length;
                UI.updateHotbar(this.selectedSlot);
            }
        });
        document.addEventListener('keyup', (e) => this.keys[e.code] = false);

        this.animate();
    }

    animate() {
        requestAnimationFrame(() => this.animate());
        if (this.controls.isLocked) {
            // Проста логіка руху для тесту
            if (this.keys['KeyW']) this.controls.moveForward(0.1);
            if (this.keys['KeyS']) this.controls.moveForward(-0.1);
            if (this.keys['KeyA']) this.controls.moveRight(-0.1);
            if (this.keys['KeyD']) this.controls.moveRight(0.1);
        }
        this.renderer.render(this.scene, this.camera);
    }
}
