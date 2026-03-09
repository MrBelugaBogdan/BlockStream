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
    }

    init() {
        this.renderer.setPixelRatio(1);
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        document.body.appendChild(this.renderer.domElement);
        this.scene.add(new THREE.AmbientLight(0xffffff, 1.0));

        // ТЕКСТУРИ (Переконайся, що файли є в /assets/)
        const texNames = ['grass', 'stone', 'wood', 'leaves'];
        this.mats = {};
        texNames.forEach(name => {
            const t = this.loader.load(`./assets/${name}.png`, undefined, undefined, () => {
                console.error(`Не вдалося завантажити текстуру: ${name}`);
            });
            t.magFilter = t.minFilter = THREE.NearestFilter;
            this.mats[name] = new THREE.MeshLambertMaterial({ map: t });
        });

        this.createWorldMenu();
        this.animate();
    }

    createWorldMenu() {
        const menu = document.createElement('div');
        menu.id = 'world-menu';
        menu.style = `position:absolute;top:0;left:0;width:100%;height:100%;background:#1a1a1a;color:white;display:flex;flex-direction:column;align-items:center;z-index:200;padding:50px;font-family:monospace;`;
        this.renderWorldList(menu);
        document.body.appendChild(menu);
    }

    renderWorldList(container) {
        const worlds = JSON.parse(localStorage.getItem('blockstream_worlds') || '[]');
        container.innerHTML = `<h1 style="color:#4CAF50">BLOCKSTREAM: СЕРВЕРИ</h1>`;
        
        const list = document.createElement('div');
        list.style = "width:320px; max-height:300px; overflow-y:auto; margin:20px; border:1px solid #444; padding:10px;";
        
        worlds.forEach(name => {
            const row = document.createElement('div');
            row.style = "display:flex; margin-bottom:5px;";
            const btn = document.createElement('button');
            btn.innerText = `Увійти: ${name}`;
            btn.style = "flex-grow:1; padding:10px; cursor:pointer; background:#4CAF50; color:white; border:none;";
            btn.onclick = () => this.startWorld(name);
            row.appendChild(btn);
            list.appendChild(row);
        });

        const input = document.createElement('input');
        input.placeholder = "Назва нового світу...";
        input.style = "padding:10px; width:200px; border:none;";
        
        const createBtn = document.createElement('button');
        createBtn.innerText = "СТВОРИТИ";
        createBtn.style = "padding:10px; background:#4CAF50; color:white; border:none; cursor:pointer; margin-left:5px;";
        createBtn.onclick = () => {
            if(input.value && !worlds.includes(input.value)) {
                worlds.push(input.value);
                localStorage.setItem('blockstream_worlds', JSON.stringify(worlds));
                this.renderWorldList(container);
            }
        };

        container.appendChild(list);
        container.appendChild(input);
        container.appendChild(createBtn);
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
        if(this.currentWorld) {
            const data = {
                changes: this.savedChanges,
                pos: { x: this.camera.position.x, y: this.camera.position.y, z: this.camera.position.z }
            };
            localStorage.setItem(`world_${this.currentWorld}`, JSON.stringify(data));
        }
    }

    createTree(x, y, z) {
        const treeKey = `tree_${x}_${z}`;
        // Якщо це дерево вже було "зрубане" (збережено як air), не малюємо його
        for (let i = 1; i <= 3; i++) this.addBlock(x, y + i, z, 'wood', true);
        for (let lx = -1; lx <= 1; lx++) {
            for (let lz = -1; lz <= 1; lz++) {
                for (let ly = 4; ly <= 5; ly++) {
                    this.addBlock(x + lx, y + ly, z + lz, 'leaves', true);
                }
            }
        }
    }

    createChunk(cx, cz) {
        const key = `${cx},${cz}`;
        if (this.chunks.has(key)) return;

        for (let x = 0; x < this.chunkSize; x++) {
            for (let z = 0; z < this.chunkSize; z++) {
                const wx = cx * this.chunkSize + x;
                const wz = cz * this.chunkSize + z;
                
                const h = Math.floor(Math.abs(Math.sin(wx * 0.1) * Math.cos(wz * 0.1)) * 4) + 5;
                
                // Основні блоки ландшафту
                this.addBlock(wx, h, wz, 'grass', true);
                this.addBlock(wx, h - 1, wz, 'stone', true);

                // Дерева (генеруємо тільки якщо немає збережених змін у цій точці)
                const treeChance = Math.abs(Math.sin(wx * 123.45) * Math.cos(wz * 543.21));
                if (treeChance < 0.02) {
                    this.createTree(wx, h, wz);
                }
            }
        }
        this.chunks.set(key, true);
    }

    addBlock(x, y, z, defaultType, isAuto) {
        const blockKey = `${Math.round(x)},${Math.round(y)},${Math.round(z)}`;
        const saved = this.savedChanges[blockKey];
        
        if (saved === 'air') return;
        const type = saved || defaultType;

        const block = new THREE.Mesh(new THREE.BoxGeometry(1,1,1), this.mats[type]);
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
            
            if (isBreaking) {
                this.savedChanges[`${p.x},${p.y},${p.z}`] = 'air';
                this.scene.remove(obj);
            } else {
                const n = obj.position.clone().add(intersects[0].face.normal);
                const newKey = `${n.x},${n.y},${n.z}`;
                this.savedChanges[newKey] = this.selectedBlock;
                this.addBlock(n.x, n.y, n.z, this.selectedBlock, false);
            }
            this.save();
        }
    }

    updateChunks() {
        const pCX = Math.floor(this.camera.position.x / this.chunkSize);
        const pCZ = Math.floor(this.camera.position.z / this.chunkSize);
        for (let x = -this.renderDistance; x <= this.renderDistance; x++) {
            for (let z = -this.renderDistance; z <= this.renderDistance; z++) {
                this.createChunk(pCX + x, pCZ + z);
            }
        }
        this.save(); // Зберігаємо позицію при пересуванні
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

            if (this.keys['KeyW'] && !this.checkCollision(dir)) this.controls.moveForward(0.15);
            if (this.keys['KeyS'] && !this.checkCollision(dir.clone().negate())) this.controls.moveForward(-0.15);
            if (this.keys['KeyA'] && !this.checkCollision(side.clone().negate())) this.controls.moveRight(-0.15);
            if (this.keys['KeyD'] && !this.checkCollision(side)) this.controls.moveRight(0.15);

            this.camera.position.y += this.velocity.y * delta;
            const ray = new THREE.Raycaster(this.camera.position, new THREE.Vector3(0, -1, 0));
            const hits = ray.intersectObjects(this.scene.children);
            
            if (hits.length > 0 && hits[0].distance < this.playerHeight) {
                this.velocity.y = 0;
                this.camera.position.y += (this.playerHeight - hits[0].distance);
                this.canJump = true;
            } else { this.canJump = false; }
            
            if (this.keys['Space'] && this.canJump) this.velocity.y = 9;
            
            if (Math.floor(this.camera.position.x) % 4 === 0) this.updateChunks();
        }
        this.renderer.render(this.scene, this.camera);
    }
}
