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
        this.savedChanges = {}; // Тут зберігаємо зміни блоків { "x,y,z": "type" }
    }

    init() {
        this.renderer.setPixelRatio(1);
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        document.body.appendChild(this.renderer.domElement);
        this.scene.add(new THREE.AmbientLight(0xffffff, 1.0));

        // Завантаження текстур (додай свої wood.png, leaves.png і т.д.)
        const texNames = ['grass', 'stone', 'wood', 'leaves'];
        this.mats = {};
        texNames.forEach(name => {
            const t = this.loader.load(`./assets/${name}.png`);
            t.magFilter = t.minFilter = THREE.NearestFilter;
            this.mats[name] = new THREE.MeshLambertMaterial({ map: t });
        });

        this.createWorldMenu(); // Запускаємо вибір серверів

        document.addEventListener('keydown', (e) => {
            this.keys[e.code] = true;
            if (e.code === 'Digit1') this.selectedBlock = 'grass';
            if (e.code === 'Digit2') this.selectedBlock = 'stone';
            if (e.code === 'Digit3') this.selectedBlock = 'wood';
        });
        document.addEventListener('keyup', (e) => this.keys[e.code] = false);
        
        document.addEventListener('mousedown', (e) => {
            if (this.controls.isLocked) this.interact(e.button === 0);
        });

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
        container.innerHTML = `<h1>BLOCKSTREAM: СЕРВЕРИ</h1>`;
        
        const list = document.createElement('div');
        list.style = "width:300px; max-height:400px; overflow-y:auto; margin:20px;";
        
        worlds.forEach(name => {
            const btn = document.createElement('button');
            btn.innerText = `Увійти: ${name}`;
            btn.style = "width:100%; padding:10px; margin:5px; cursor:pointer; background:#4CAF50; color:white; border:none;";
            btn.onclick = () => this.startWorld(name);
            list.appendChild(btn);
        });

        const input = document.createElement('input');
        input.placeholder = "Назва нового світу...";
        input.style = "padding:10px; width:200px;";
        
        const createBtn = document.createElement('button');
        createBtn.innerText = "СТВОРИТИ СВІТ";
        createBtn.style = "padding:10px; background:white; cursor:pointer;";
        createBtn.onclick = () => {
            if(input.value) {
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
        this.savedChanges = JSON.parse(localStorage.getItem(`world_${name}`) || '{}');
        document.getElementById('world-menu').remove();
        
        // Початкова позиція
        this.camera.position.set(4, 20, 4);
        this.updateChunks();
        this.controls.lock();
    }

    save() {
        if(this.currentWorld) {
            localStorage.setItem(`world_${this.currentWorld}`, JSON.stringify(this.savedChanges));
        }
    }

    createChunk(cx, cz) {
        const key = `${cx},${cz}`;
        if (this.chunks.has(key)) return;

        for (let x = 0; x < this.chunkSize; x++) {
            for (let z = 0; z < this.chunkSize; z++) {
                const wx = cx * this.chunkSize + x;
                const wz = cz * this.chunkSize + z;
                
                // Перевірка збережених змін
                const h = Math.floor(Math.abs(Math.sin(wx * 0.1) * Math.cos(wz * 0.1)) * 4) + 5;
                
                // Якщо блок було видалено або замінено - логіка тут (спрощено)
                this.addBlock(wx, h, wz, 'grass');
                this.addBlock(wx, h-1, wz, 'stone');
            }
        }
        this.chunks.set(key, true);
    }

    addBlock(x, y, z, type) {
        const blockKey = `${x},${y},${z}`;
        if (this.savedChanges[blockKey] === 'air') return;
        
        const finalType = this.savedChanges[blockKey] || type;
        const block = new THREE.Mesh(new THREE.BoxGeometry(1,1,1), this.mats[finalType]);
        block.position.set(x, y, z);
        block.name = "voxel";
        block.userData = { type: finalType };
        this.scene.add(block);
    }

    interact(isBreaking) {
        this.raycaster.setFromCamera(new THREE.Vector2(0, 0), this.camera);
        const intersects = this.raycaster.intersectObjects(this.scene.children);
        if (intersects.length > 0) {
            const obj = intersects[0].object;
            const pos = obj.position;
            const blockKey = `${pos.x},${pos.y},${pos.z}`;

            if (isBreaking) {
                this.savedChanges[blockKey] = 'air';
                this.scene.remove(obj);
            } else {
                const newPos = pos.clone().add(intersects[0].face.normal);
                const newKey = `${newPos.x},${newPos.y},${newPos.z}`;
                this.savedChanges[newKey] = this.selectedBlock;
                this.addBlock(newPos.x, newPos.y, newPos.z, this.selectedBlock);
            }
            this.save(); // Зберігаємо після кожного кліку
        }
    }

    // Решта методів (animate, updateChunks, checkCollision) залишаються як у попередньому коді
    updateChunks() {
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
        return intersects.length > 0 && intersects[0].distance < 1.0;
    }

    animate() {
        requestAnimationFrame(() => this.animate());
        if (this.controls.isLocked) {
            const delta = 0.016;
            this.velocity.y -= 25.0 * delta;
            
            const forward = new THREE.Vector3();
            this.camera.getWorldDirection(forward); forward.y = 0; forward.normalize();
            const right = new THREE.Vector3().crossVectors(this.camera.up, forward).negate();

            if (this.keys['KeyW'] && !this.checkCollision(forward)) this.controls.moveForward(0.15);
            if (this.keys['KeyS'] && !this.checkCollision(forward.clone().negate())) this.controls.moveForward(-0.15);
            if (this.keys['KeyA'] && !this.checkCollision(right.clone().negate())) this.controls.moveRight(-0.15);
            if (this.keys['KeyD'] && !this.checkCollision(right)) this.controls.moveRight(0.15);

            this.camera.position.y += this.velocity.y * delta;
            const ray = new THREE.Raycaster(this.camera.position, new THREE.Vector3(0, -1, 0));
            const hits = ray.intersectObjects(this.scene.children);
            if (hits.length > 0 && hits[0].distance < this.playerHeight) {
                this.velocity.y = 0;
                this.camera.position.y += (this.playerHeight - hits[0].distance);
                this.canJump = true;
            } else { this.canJump = false; }
            if (this.keys['Space'] && this.canJump) this.velocity.y = 9;
            this.updateChunks();
        }
        this.renderer.render(this.scene, this.camera);
    }
}
