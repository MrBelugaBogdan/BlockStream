import * as THREE from 'three';
import { World } from './world.js';
import { UI } from './ui.js';
import { Physics } from './physics.js';
import { PointerLockControls } from 'three/addons/controls/PointerLockControls.js';

export class GameEngine {
    constructor() {
        this.scene = new THREE.Scene();
        this.camera = new THREE.PerspectiveCamera(75, window.innerWidth/window.innerHeight, 0.1, 150);
        this.renderer = new THREE.WebGLRenderer({ antialias: false });
        this.controls = new PointerLockControls(this.camera, document.body);
        this.keys = {};
        this.inventoryItems = ['grass', 'stone', 'wood', 'leaves'];
        this.selectedSlot = 0;
        this.physics = new Physics(1.7);
        this.raycaster = new THREE.Raycaster();
        
        // Для видобування
        this.miningTimer = 0;
        this.miningTarget = null;
        this.isMouseDown = false;
    }

    init() {
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        document.body.appendChild(this.renderer.domElement);
        this.scene.add(new THREE.AmbientLight(0xffffff, 0.9));
        this.mats = this.loadMaterials();
        this.world = new World(this.scene, this.mats);
        this.scene.background = new THREE.Color(0x70a1ff);

        UI.createMainMenu((config) => this.startWorld(config));

        document.addEventListener('keydown', (e) => {
            this.keys[e.code] = true;
            if (e.code.startsWith('Digit')) {
                this.selectedSlot = (parseInt(e.code.replace('Digit', '')) - 1) % 4;
                this.updateUI();
            }
        });
        document.addEventListener('keyup', (e) => this.keys[e.code] = false);
        
        document.addEventListener('mousedown', (e) => {
            if (!this.controls.isLocked) return;
            this.isMouseDown = true;
            if (e.button === 2) this.placeBlock(); // Права кнопка - ставити
        });

        document.addEventListener('mouseup', () => {
            this.isMouseDown = false;
            this.miningTimer = 0;
            this.miningTarget = null;
        });

        this.animate();
    }

    loadMaterials() {
        const mats = {};
        this.inventoryItems.forEach(name => {
            const t = new THREE.TextureLoader().load(`./assets/${name}.png`);
            t.magFilter = THREE.NearestFilter;
            mats[name] = new THREE.MeshLambertMaterial({ map: t });
        });
        return mats;
    }

    startWorld(config) {
        this.currentWorld = config.name;
        this.gameMode = config.mode;
        const saved = JSON.parse(localStorage.getItem(`wsave_${config.name}`) || 'null');
        this.playerData = saved ? saved.player : { health: 10, inventory: {grass: 10, stone: 10, wood: 5, leaves: 5} };
        this.world.savedChanges = saved ? saved.changes : {};
        this.camera.position.set(4, 30, 4);
        this.updateUI();
    }

    updateUI() {
        UI.createHotbar(this.inventoryItems, this.selectedSlot, this.playerData.health, this);
    }

    mineBlock() {
        this.raycaster.setFromCamera(new THREE.Vector2(0, 0), this.camera);
        const intersects = this.raycaster.intersectObjects(this.scene.children);
        
        if (intersects.length > 0) {
            const obj = intersects[0].object;
            
            if (this.gameMode === 'creative') {
                this.breakBlock(obj);
            } else {
                // Виживання: затискання
                if (this.miningTarget !== obj) {
                    this.miningTarget = obj;
                    this.miningTimer = 0;
                }
                this.miningTimer += 0.016;
                if (this.miningTimer > 0.5) { // 0.5 сек на блок
                    this.breakBlock(obj);
                    this.miningTimer = 0;
                }
            }
        }
    }

    breakBlock(obj) {
        const type = obj.material.map.image.src.split('/').pop().split('.')[0];
        if (this.gameMode === 'survival') {
            this.playerData.inventory[type] = (this.playerData.inventory[type] || 0) + 1;
        }
        this.world.savedChanges[`${obj.position.x},${obj.position.y},${obj.position.z}`] = 'air';
        this.scene.remove(obj);
        this.updateUI();
        this.save();
    }

    placeBlock() {
        this.raycaster.setFromCamera(new THREE.Vector2(0, 0), this.camera);
        const intersects = this.raycaster.intersectObjects(this.scene.children);
        if (intersects.length > 0) {
            const type = this.inventoryItems[this.selectedSlot];
            if (this.gameMode === 'survival' && this.playerData.inventory[type] <= 0) return;
            
            const n = intersects[0].object.position.clone().add(intersects[0].face.normal);
            this.world.addBlock(n.x, n.y, n.z, type);
            this.world.savedChanges[`${Math.round(n.x)},${Math.round(n.y)},${Math.round(n.z)}`] = type;
            
            if (this.gameMode === 'survival') this.playerData.inventory[type]--;
            this.updateUI();
            this.save();
        }
    }

    takeDamage(amount) {
        if (this.gameMode === 'creative') return;
        this.playerData.health -= amount;
        if (this.playerData.health <= 0) { alert("DEAD!"); location.reload(); }
        this.updateUI();
        this.save();
    }

    save() {
        localStorage.setItem(`wsave_${this.currentWorld}`, JSON.stringify({
            changes: this.world.savedChanges,
            player: this.playerData
        }));
    }

    animate() {
        requestAnimationFrame(() => this.animate());
        if (this.controls.isLocked) {
            this.physics.update(this.camera, this.scene, this.keys, this.controls, 0.016, this);
            if (this.isMouseDown) this.mineBlock(); // Видобування при затисканні
            
            const pCX = Math.floor(this.camera.position.x / 8);
            const pCZ = Math.floor(this.camera.position.z / 8);
            for(let x = -2; x <= 2; x++) {
                for(let z = -2; z <= 2; z++) this.world.generateChunk(pCX+x, pCZ+z);
            }
        }
        this.renderer.render(this.scene, this.camera);
    }
}
