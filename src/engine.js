import * as THREE from 'three';
import { PointerLockControls } from 'three/addons/controls/PointerLockControls.js';

export class GameEngine {
    constructor() {
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0x70a1ff);
        this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 150);
        this.renderer = new THREE.WebGLRenderer({ antialias: false });
        
        this.controls = new PointerLockControls(this.camera, document.body);
        this.keys = {};
        this.raycaster = new THREE.Raycaster();
        this.collisionRaycaster = new THREE.Raycaster();
        this.loader = new THREE.TextureLoader();

        this.velocity = new THREE.Vector3();
        this.playerHeight = 1.7;
        this.chunks = new Map();
        this.chunkSize = 8;
        this.renderDistance = 2;
        this.currentWorld = null;
        this.savedChanges = {}; 
        this.selectedBlock = 'grass';
        this.canJump = false;
    }

    init() {
        this.renderer.setPixelRatio(1);
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        document.body.appendChild(this.renderer.domElement);
        this.scene.add(new THREE.AmbientLight(0xffffff, 1.0));

        // ТЕКСТУРИ
        const texNames = ['grass', 'stone', 'wood', 'leaves'];
        this.mats = {};
        texNames.forEach(name => {
            const t = this.loader.load(`./assets/${name}.png`);
            t.magFilter = t.minFilter = THREE.NearestFilter;
            this.mats[name] = new THREE.MeshLambertMaterial({ map: t });
        });

        this.createWorldMenu();

        document.addEventListener('keydown', (e) => this.keys[e.code] = true);
        document.addEventListener('keyup', (e) => this.keys[e.code] = false);
        
        document.addEventListener('mousedown', (e) => {
            if (this.controls.isLocked) this.interact(e.button === 0);
        });

        // Вибір блоків
        document.addEventListener('keydown', (e) => {
            if (e.code === 'Digit1') this.selectedBlock = 'grass';
            if (e.code === 'Digit2') this.selectedBlock = 'stone';
            if (e.code === 'Digit3') this.selectedBlock = 'wood';
        });

        this.animate();
    }

    createWorldMenu() {
        const menu = document.createElement('div');
        menu.id = 'world-menu';
        menu.style = `position:absolute;top:0;left:0;width:100%;height:100%;background:#1a1a1a;color:white;display:flex;flex-direction:column;align-items:center;z-index:200;padding:50px;font-family:monospace;`;
        
        const worlds = JSON.parse(localStorage.getItem('blockstream_worlds') || '[]');
        menu.innerHTML = `<h1 style="color:#4CAF50">BLOCKSTREAM: СЕРВЕРИ</h1>
            <div id="world-list" style="margin:20px;"></div>
            <input id="world-name" placeholder="Назва світу..." style="padding:10px;">
            <button id="create-btn" style="padding:10px; background:#4CAF50; color:white; border:none; cursor:pointer; margin-top:10px;">СТВОРИТИ</button>`;
        
        document.body.appendChild(menu);

        const list = document.getElementById('world-list');
        worlds.forEach(name => {
            const btn = document.createElement('button');
            btn.innerText = `Увійти: ${name}`;
            btn.style = "display:block; width:200px; padding:10px; margin:5px; cursor:pointer;";
            btn.onclick = () => this.startWorld(name);
            list.appendChild(btn);
        });

        document.getElementById('create-btn').onclick = () => {
            const name = document.getElementById('world-name').value;
            if(name && !worlds.includes(name)) {
                worlds.push(name);
                localStorage.setItem('blockstream_worlds', JSON.stringify(worlds));
                location.reload();
            }
        };
    }

    startWorld(name) {
        this.currentWorld = name;
        const data = JSON.parse(localStorage.getItem(`world_${name}`) || '{"changes":{}, "pos":{"x":4,"y":20,"z":4}}');
        this.savedChanges = data.changes;
        this.camera.position.set(data.pos.x, data.pos.y, data.pos.z);
        
        document.getElementById('world-menu').remove();
        this.updateChunks();
        this.controls.lock();
    }

    save() {
        if(!this.currentWorld) return;
        const data = {
            changes: this.savedChanges,
            pos: { x: this.camera.position.x, y: this.camera.position.y, z: this.camera.position.z }
        };
        localStorage.setItem(`world_${this.currentWorld}`, JSON.stringify(data));
    }

    createTree(x, y, z) {
        // Стовбур
        for (let i = 1; i <= 3; i++) this.addBlock(x, y + i, z, 'wood');
        // Листя
        for (let lx = -1; lx <= 1; lx++) {
            for (let lz = -1; lz <= 1; lz++) {
                this.addBlock(x + lx, y + 4, z + lz, 'leaves');
            }
        }
        this.addBlock(x, y + 5, z, 'leaves');
    }

    createChunk(cx, cz) {
        const key = `${cx},${cz}`;
        if (this.chunks.has(key)) return;

        for (let x = 0; x < this.chunkSize; x++) {
            for (let z = 0; z < this.chunkSize; z++) {
                const wx = cx * this.chunkSize + x;
                const wz = cz * this.chunkSize + z;
                const h = Math.floor(Math.abs(Math.sin(wx * 0.1) * Math.cos(wz * 0.1)) * 3) + 5;

                this.addBlock(wx, h, wz, 'grass');
                this.addBlock(wx, h - 1, wz, 'stone');

                // Фікс дерев: використовуємо фіксований шанс на основі координат
                const treeChance = Math.abs(Math.sin(wx * 12.34) * Math.cos(wz * 56.78));
                if (treeChance < 0.02) this.createTree(wx, h, wz);
            }
        }
        this.chunks.set(key, true);
    }

    addBlock(x, y, z, type) {
        const key = `${Math.round(x)},${Math.round(y)},${Math.round(z)}`;
        if (this.savedChanges[key] === 'air') return;
        const finalType = this.savedChanges[key] || type;

        const block = new THREE.Mesh(new THREE.BoxGeometry(1,1,1), this.mats[finalType]);
        block.position.set(x, y, z);
        block.name = "voxel";
        this.scene.add(block);
    }

    interact(isBreaking) {
        this.raycaster.setFromCamera(new THREE.Vector2(0, 0), this.camera);
        const intersects = this.raycaster.intersectObjects(this.scene.children);
        if (intersects.length > 0) {
            const obj = intersects[0].object;
            const p = obj.position;
            const key = `${Math.round(p.x)},${Math.round(p.y)},${Math.round(p.z)}`;

            if (isBreaking) {
                this.savedChanges[key] = 'air';
                this.scene.remove(obj);
            } else {
                const n = p.clone().add(intersects[0].face.normal);
                const newKey = `${Math.round(n.x)},${Math.round(n.y)},${Math.round(n.z)}`;
                this.savedChanges[newKey] = this.selectedBlock;
                this.addBlock(n.x, n.y, n.z, this.selectedBlock);
            }
            this.save();
        }
    }

    updateChunks() {
        if(!this.currentWorld) return;
        const pCX = Math.floor(this.camera.position.x / this.chunkSize);
        const pCZ = Math.floor(this.camera.position.z / this.chunkSize);
        for (let x = -this.renderDistance; x <= this.renderDistance; x++) {
            for (let z = -this.renderDistance; z <= this.renderDistance; z++) {
                this.createChunk(pCX + x, pCZ + z);
            }
        }
    }

    checkCollision(vector) {
        this.collisionRaycaster.set(this.camera.position, vector);
        const intersects = this.collisionRaycaster.intersectObjects(this.scene.children);
        return intersects.length > 0 && intersects[0].distance < 0.8;
    }

    animate() {
        requestAnimationFrame(() => this.animate());
        if (this.controls.isLocked) {
            const delta = 0.016;
            this.velocity.y -= 25.0 * delta;
            
            const dir = new THREE.Vector3();
            this.camera.getWorldDirection(dir); dir.y = 0; dir.normalize();
            const side = new THREE.Vector3().crossVectors(this.camera.up, dir).negate();

            if (this.keys['KeyW'] && !this.checkCollision(dir)) this.controls.moveForward(0.12);
            if (this.keys['KeyS'] && !this.checkCollision(dir.clone().negate())) this.controls.moveForward(-0.12);
            if (this.keys['KeyA'] && !this.checkCollision(side.clone().negate())) this.controls.moveRight(-0.12);
            if (this.keys['KeyD'] && !this.checkCollision(side)) this.controls.moveRight(0.12);

            this.camera.position.y += this.velocity.y * delta;

            const groundRay = new THREE.Raycaster(this.camera.position, new THREE.Vector3(0, -1, 0));
            const hits = groundRay.intersectObjects(this.scene.children);
            if (hits.length > 0 && hits[0].distance < this.playerHeight) {
                this.velocity.y = 0;
                this.camera.position.y += (this.playerHeight - hits[0].distance);
                this.canJump = true;
            } else { this.canJump = false; }

            if (this.keys['Space'] && this.canJump) this.velocity.y = 8;
            
            if (Math.abs(this.camera.position.x % 4) < 0.1) {
                this.updateChunks();
                this.save();
            }
        }
        this.renderer.render(this.scene, this.camera);
    }
}
