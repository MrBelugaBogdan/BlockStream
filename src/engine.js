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
        this.raycaster = new THREE.Raycaster();
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

    init() {
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        document.body.appendChild(this.renderer.domElement);
        this.scene.add(new THREE.AmbientLight(0xffffff, 0.8));
        this.mats = this.loadMaterials();
        this.world = new World(this.scene, this.mats);

        UI.createMainMenu((config) => this.startWorld(config));

        document.addEventListener('keydown', (e) => {
            this.keys[e.code] = true;
            if (e.code.startsWith('Digit')) {
                this.selectedSlot = (parseInt(e.code.replace('Digit', '')) - 1) % this.inventory.length;
                UI.updateHotbar(this.selectedSlot);
            }
        });
        document.addEventListener('keyup', (e) => this.keys[e.code] = false);
        document.addEventListener('mousedown', (e) => {
            if (this.controls.isLocked) this.interact(e.button === 0);
        });

        this.animate();
    }

    startWorld(config) {
        this.currentWorld = config.name;
        this.gameMode = config.mode;
        const data = JSON.parse(localStorage.getItem(`world_save_${config.name}`) || '{"changes":{}, "pos":{"x":4,"y":30,"z":4}}');
        this.world.savedChanges = data.changes;
        this.camera.position.set(data.pos.x, data.pos.y, data.pos.z);
        UI.createHotbar(this.inventory, this.selectedSlot, this.gameMode);
    }

    interact(isBreaking) {
        this.raycaster.setFromCamera(new THREE.Vector2(0, 0), this.camera);
        const intersects = this.raycaster.intersectObjects(this.scene.children);
        if (intersects.length > 0) {
            const obj = intersects[0].object;
            const p = obj.position;
            const key = `${p.x},${p.y},${p.z}`;
            if (isBreaking) {
                this.world.savedChanges[key] = 'air';
                this.scene.remove(obj);
            } else {
                const n = p.clone().add(intersects[0].face.normal);
                const type = this.inventory[this.selectedSlot];
                this.world.savedChanges[`${Math.round(n.x)},${Math.round(n.y)},${Math.round(n.z)}`] = type;
                this.world.addBlock(n.x, n.y, n.z, type);
            }
            this.save();
        }
    }

    save() {
        if (!this.currentWorld) return;
        localStorage.setItem(`world_save_${this.currentWorld}`, JSON.stringify({
            changes: this.world.savedChanges,
            pos: { x: this.camera.position.x, y: this.camera.position.y, z: this.camera.position.z }
        }));
    }

    animate() {
        requestAnimationFrame(() => this.animate());
        if (this.controls.isLocked) {
            this.physics.update(this.camera, this.scene, this.keys, this.controls, 0.016);
            const pCX = Math.floor(this.camera.position.x / 8);
            const pCZ = Math.floor(this.camera.position.z / 8);
            for(let x = -2; x <= 2; x++) {
                for(let z = -2; z <= 2; z++) this.world.generateChunk(pCX + x, pCZ + z);
            }
        }
        this.renderer.render(this.scene, this.camera);
    }
}
