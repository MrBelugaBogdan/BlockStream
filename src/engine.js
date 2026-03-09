import * as THREE from 'three';
import { World } from './world.js';
import { UI } from './ui.js';
import { Physics } from './physics.js';
import { PointerLockControls } from 'three/addons/controls/PointerLockControls.js';

export class GameEngine {
    constructor() {
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0x70a1ff);
        this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 150);
        this.renderer = new THREE.WebGLRenderer({ antialias: false });
        this.controls = new PointerLockControls(this.camera, document.body);
        this.keys = {};
        this.inventory = ['grass', 'stone', 'wood', 'leaves'];
        this.selectedSlot = 0;
        this.physics = new Physics(1.7);
    }

    loadMaterials() {
        const mats = {};
        this.inventory.forEach(name => {
            const t = new THREE.TextureLoader().load(`./assets/${name}.png`);
            t.magFilter = t.minFilter = THREE.NearestFilter;
            mats[name] = new THREE.MeshLambertMaterial({ map: t });
        });
        return mats;
    }

    async init() {
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        document.body.appendChild(this.renderer.domElement);
        this.scene.add(new THREE.AmbientLight(0xffffff, 1.0));

        this.mats = this.loadMaterials();
        this.world = new World(this.scene, this.mats);
        
        // ВАЖЛИВО: Ставимо камеру вище, щоб не провалитися крізь землю
        this.camera.position.set(4, 25, 4);

        UI.createHotbar(this.inventory, this.selectedSlot);

        document.addEventListener('keydown', (e) => {
            this.keys[e.code] = true;
            if (e.code.startsWith('Digit')) {
                this.selectedSlot = (parseInt(e.code.replace('Digit', '')) - 1) % this.inventory.length;
                UI.updateHotbar(this.selectedSlot);
            }
        });
        document.addEventListener('keyup', (e) => this.keys[e.code] = false);

        // Початкова генерація
        this.world.generateChunk(0, 0);
        this.animate();
    }

    animate() {
        requestAnimationFrame(() => this.animate());
        if (this.controls.isLocked) {
            this.physics.update(this.camera, this.scene, this.keys, this.controls, 0.016);
            
            // Генерація чанків навколо гравця
            const cx = Math.floor(this.camera.position.x / 8);
            const cz = Math.floor(this.camera.position.z / 8);
            this.world.generateChunk(cx, cz);
        }
        this.renderer.render(this.scene, this.camera);
    }
}
