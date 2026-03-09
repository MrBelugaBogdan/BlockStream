import * as THREE from 'three';
import { World } from './world.js';
import { UI } from './ui.js';
import { PointerLockControls } from 'three/addons/controls/PointerLockControls.js';

export class GameEngine {
    constructor() {
        this.scene = new THREE.Scene();
        this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 150);
        this.renderer = new THREE.WebGLRenderer();
        this.controls = new PointerLockControls(this.camera, document.body);
        this.loader = new THREE.TextureLoader();
        
        this.inventory = ['grass', 'stone', 'wood', 'leaves'];
        this.selectedSlot = 0;
    }

    async init() {
        // Налаштування рендера...
        document.body.appendChild(this.renderer.domElement);
        
        // Завантаження матів...
        this.mats = this.loadMaterials();
        
        this.world = new World(this.scene, this.mats);
        UI.createHotbar(this.inventory, this.selectedSlot);
        
        // Подія вибору слотів
        document.addEventListener('keydown', (e) => {
            if (e.code.startsWith('Digit')) {
                this.selectedSlot = parseInt(e.code.replace('Digit', '')) - 1;
                UI.updateHotbar(this.selectedSlot);
            }
        });

        this.animate();
    }

    // ... інший код керування та анімації
}
