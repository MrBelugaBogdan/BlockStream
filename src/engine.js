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
        this.canJump = false;
        this.playerHeight = 1.7;

        this.chunks = new Map();
        this.chunkSize = 8;
        this.renderDistance = 2; // Оптимально для телефонів
        
        this.blockGeo = new THREE.BoxGeometry(1, 1, 1);
        this.selectedBlock = 'grass';
    }

    init() {
        this.renderer.setPixelRatio(1);
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        document.body.appendChild(this.renderer.domElement);

        this.scene.add(new THREE.AmbientLight(0xffffff, 1.0));

        // ТЕКСТУРИ
        const grassTex = this.loader.load('./assets/grass.png');
        const stoneTex = this.loader.load('./assets/stone.png');
        const woodTex = this.loader.load('./assets/wood.png');
        const leavesTex = this.loader.load('./assets/leaves.png');

        [grassTex, stoneTex, woodTex, leavesTex].forEach(t => { 
            t.magFilter = THREE.NearestFilter; 
            t.minFilter = THREE.NearestFilter; 
        });

        this.mats = {
            grass: new THREE.MeshLambertMaterial({ map: grassTex }),
            stone: new THREE.MeshLambertMaterial({ map: stoneTex }),
            wood: new THREE.MeshLambertMaterial({ map: woodTex }),
            leaves: new THREE.MeshLambertMaterial({ map: leavesTex })
        };

        this.createMenu();
        this.updateChunks();

        document.addEventListener('keydown', (e) => {
            this.keys[e.code] = true;
            if (e.code === 'Digit1') this.selectedBlock = 'grass';
            if (e.code === 'Digit2') this.selectedBlock = 'stone';
            if (e.code === 'Digit3') this.selectedBlock = 'wood';
        });
        document.addEventListener('keyup', (e) => this.keys[e.code] = false);
        
        document.addEventListener('mousedown', (e) => {
            if (this.controls.isLocked) {
                this.interact(e.button === 0);
            }
        });

        this.camera.position.set(4, 20, 4);
        this.animate();
    }

    createMenu() {
        const menu = document.createElement('div');
        menu.id = 'main-menu';
        menu.style = `
            position: absolute; top: 0; left: 0; width: 100%; height: 100%;
            background: rgba(20, 20, 20, 0.9); display: flex; flex-direction: column;
            justify-content: center; align-items: center; z-index: 100;
            color: white; font-family: 'Courier New', Courier, monospace;
        `;
        menu.innerHTML = `
            <h1 style="font-size: 3rem; margin-bottom: 20px; color: #4CAF50;">BLOCKSTREAM</h1>
            <button id="start-btn" style="padding: 15px 50px; font-size: 24px; background: #4CAF50; color: white; border: none; cursor: pointer; border-radius: 5px;">ГРАТИ</button>
            <div style="margin-top: 30px; text-align: center; line-height: 1.6;">
                <p>WASD — Рух | Space — Стрибок</p>
                <p>ЛКМ — Ламати | ПКМ — Ставити</p>
                <p>1, 2, 3 — Вибір блоку</p>
            </div>
        `;
        document.body.appendChild(menu);

        document.getElementById('start-btn').onclick = () => {
            menu.style.display = 'none';
            this.controls.lock();
        };
    }

    createTree(x, y, z) {
        for (let i = 1; i <= 3; i++) {
            const log = new THREE.Mesh(this.blockGeo, this.mats.wood);
            log.position.set(x, y + i, z);
            log.name = "voxel";
            this.scene.add(log);
        }
        for (let lx = -1; lx <= 1; lx++) {
            for (let lz = -1; lz <= 1; lz++) {
                for (let ly = 4; ly <= 5; ly++) {
                    const leaf = new THREE.Mesh(this.blockGeo, this.mats.leaves);
                    leaf.position.set(x + lx, y + ly, z + lz);
                    leaf.name = "voxel";
                    this.scene.add(leaf);
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

                const grass = new THREE.Mesh(this.blockGeo, this.mats.grass);
                grass.position.set(wx, h, wz);
                grass.name = "voxel";
                this.scene.add(grass);

                for (let sy = 1; sy <= 2; sy++) {
                    const stone = new THREE.Mesh(this.blockGeo, this.mats.stone);
                    stone.position.set(wx, h - sy, wz);
                    stone.name = "voxel";
                    this.scene.add(stone);
                }

                if (Math.random() < 0.03) { 
                    this.createTree(wx, h, wz);
                }
            }
        }
        this.chunks.set(key, true);
    }

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

    interact(isBreaking) {
        this.raycaster.setFromCamera(new THREE.Vector2(0, 0), this.camera);
        const intersects = this.raycaster.intersectObjects(this.scene.children);
        if (intersects.length > 0 && intersects[0].object.name === "voxel") {
            if (isBreaking) {
                this.scene.remove(intersects[0].object);
            } else {
                const pos = intersects[0].object.position.clone().add(intersects[0].face.normal);
                const newBlock = new THREE.Mesh(this.blockGeo, this.mats[this.selectedBlock]);
                newBlock.position.copy(pos);
                newBlock.name = "voxel";
                this.scene.add(newBlock);
            }
        }
    }

    animate() {
        requestAnimationFrame(() => this.animate());

        if (this.controls.isLocked) {
            const delta = 0.016;
            this.velocity.y -= 25.0 * delta;

            const forward = new THREE.Vector3();
            this.camera.getWorldDirection(forward);
            forward.y = 0; forward.normalize();
            const right = new THREE.Vector3().crossVectors(this.camera.up, forward).negate();

            const speed = 0.15;
            if (this.keys['KeyW'] && !this.checkCollision(forward)) this.controls.moveForward(speed);
            if (this.keys['KeyS'] && !this.checkCollision(forward.clone().negate())) this.controls.moveForward(-speed);
            if (this.keys['KeyA'] && !this.checkCollision(right.clone().negate())) this.controls.moveRight(-speed);
            if (this.keys['KeyD'] && !this.checkCollision(right)) this.controls.moveRight(speed);

            this.camera.position.y += this.velocity.y * delta;

            const ray = new THREE.Raycaster(this.camera.position, new THREE.Vector3(0, -1, 0));
            const hits = ray.intersectObjects(this.scene.children);

            if (hits.length > 0 && hits[0].distance < this.playerHeight) {
                this.velocity.y = 0;
                this.camera.position.y += (this.playerHeight - hits[0].distance);
                this.canJump = true;
            } else {
                this.canJump = false;
            }

            if (this.keys['Space'] && this.canJump) this.velocity.y = 9;
            if (Math.abs(this.camera.position.x % 4) < 0.2 || Math.abs(this.camera.position.z % 4) < 0.2) this.updateChunks();
        }
        this.renderer.render(this.scene, this.camera);
    }
}
