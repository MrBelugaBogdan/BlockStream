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
        this.collisionRaycaster = new THREE.Raycaster();
        this.loader = new THREE.TextureLoader();

        this.velocity = new THREE.Vector3(); 
        this.canJump = false;
        this.playerHeight = 1.7;
        
        this.selectedBlock = 'grass';
        this.materials = {};
        
        // СИСТЕМА СВІТЛА
        this.sunAngle = Math.PI / 4;
        this.flashlight = new THREE.PointLight(0xffffff, 50, 20);
        this.flashlight.visible = false;

        // ДАНІ СВІТУ (Чанки)
        this.chunks = {};
        this.chunkSize = 16;
        this.renderDistance = 2; // Скільки чанків навколо бачимо
    }

    init() {
        this.renderer.setPixelRatio(window.devicePixelRatio);
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        document.body.appendChild(this.renderer.domElement);

        this.scene.add(new THREE.AmbientLight(0xffffff, 0.5));
        this.sun = new THREE.DirectionalLight(0xffffff, 1.0);
        this.scene.add(this.sun);
        this.scene.add(this.flashlight);

        const grassTex = this.loader.load('./assets/grass.png');
        const stoneTex = this.loader.load('./assets/stone.png');
        [grassTex, stoneTex].forEach(t => { t.magFilter = THREE.NearestFilter; t.minFilter = THREE.NearestFilter; });

        this.materials = {
            grass: new THREE.MeshStandardMaterial({ map: grassTex }),
            stone: new THREE.MeshStandardMaterial({ map: stoneTex })
        };

        // Початкова генерація чанків навколо гравця
        this.updateChunks();

        document.addEventListener('keydown', (e) => {
            this.keys[e.code] = true;
            if (e.code === 'KeyL') this.flashlight.visible = !this.flashlight.visible;
            if (e.code === 'Digit1') this.selectedBlock = 'grass';
            if (e.code === 'Digit2') this.selectedBlock = 'stone';
        });
        document.addEventListener('keyup', (e) => this.keys[e.code] = false);
        
        document.addEventListener('mousedown', (e) => {
            if (this.controls.isLocked) {
                if (e.button === 0) this.interact(true);
                if (e.button === 2) this.interact(false);
            } else {
                this.controls.lock();
            }
        });

        this.camera.position.set(8, 15, 8);
        this.animate();
    }

    // Створення чанка в певних координатах
    createChunk(cx, cz) {
        const key = `${cx},${cz}`;
        if (this.chunks[key]) return;

        const group = new THREE.Group();
        const geometry = new THREE.BoxGeometry(1, 1, 1);

        for (let x = 0; x < this.chunkSize; x++) {
            for (let z = 0; z < this.chunkSize; z++) {
                // Псевдо-випадкова висота на основі координат (щоб світ був однаковим при поверненні)
                const nx = (cx * this.chunkSize + x) * 0.1;
                const nz = (cz * this.chunkSize + z) * 0.1;
                const height = Math.floor(Math.abs(Math.sin(nx) * Math.cos(nz)) * 4) + 2;

                for (let y = 0; y <= height; y++) {
                    const block = new THREE.Mesh(geometry, y === height ? this.materials.grass : this.materials.stone);
                    block.position.set(cx * this.chunkSize + x, y, cz * this.chunkSize + z);
                    block.name = "voxel";
                    group.add(block);
                }
            }
        }
        this.scene.add(group);
        this.chunks[key] = group;
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

    interact(isBreaking) {
        this.raycaster.setFromCamera(new THREE.Vector2(0, 0), this.camera);
        const intersects = this.raycaster.intersectObjects(this.scene.children, true);

        if (intersects.length > 0) {
            const hit = intersects[0];
            if (hit.object.name === "voxel") {
                if (isBreaking) {
                    hit.object.parent.remove(hit.object);
                } else {
                    const pos = hit.object.position.clone().add(hit.face.normal);
                    const newBlock = new THREE.Mesh(new THREE.BoxGeometry(1, 1, 1), this.materials[this.selectedBlock]);
                    newBlock.position.copy(pos);
                    newBlock.name = "voxel";
                    hit.object.parent.add(newBlock);
                }
            }
        }
    }

    checkCollision(vector) {
        this.collisionRaycaster.set(this.camera.position, vector);
        const intersects = this.collisionRaycaster.intersectObjects(this.scene.children, true);
        return intersects.length > 0 && intersects[0].distance < 0.7;
    }

    animate() {
        requestAnimationFrame(() => this.animate());

        if (this.controls.isLocked) {
            const delta = 0.016;
            
            // День і ніч
            this.sunAngle += 0.001;
            this.sun.position.set(Math.cos(this.sunAngle) * 50, Math.sin(this.sunAngle) * 50, 20);
            const skyIntensity = Math.max(0.1, Math.sin(this.sunAngle));
            this.scene.background.setHSL(0.6, 0.5, skyIntensity * 0.5 + 0.1);

            this.flashlight.position.copy(this.camera.position);

            this.velocity.y -= 25.0 * delta;
            const forward = new THREE.Vector3();
            this.camera.getWorldDirection(forward);
            forward.y = 0; forward.normalize();
            const right = new THREE.Vector3().crossVectors(this.camera.up, forward).negate();

            const speed = 0.12;
            if (this.keys['KeyW'] && !this.checkCollision(forward)) this.controls.moveForward(speed);
            if (this.keys['KeyS'] && !this.checkCollision(forward.clone().negate())) this.controls.moveForward(-speed);
            if (this.keys['KeyA'] && !this.checkCollision(right.clone().negate())) this.controls.moveRight(-speed);
            if (this.keys['KeyD'] && !this.checkCollision(right)) this.controls.moveRight(speed);

            this.camera.position.y += this.velocity.y * delta;

            const downRay = new THREE.Raycaster(this.camera.position, new THREE.Vector3(0, -1, 0));
            const groundHits = downRay.intersectObjects(this.scene.children, true);

            if (groundHits.length > 0 && groundHits[0].distance < this.playerHeight) {
                this.velocity.y = 0;
                this.camera.position.y += (this.playerHeight - groundHits[0].distance);
                this.canJump = true;
            } else {
                this.canJump = false;
            }

            if (this.keys['Space'] && this.canJump) this.velocity.y = 9.0;

            // Оновлюємо чанки при русі
            if (Math.abs(this.camera.position.x % 16) < 0.5 || Math.abs(this.camera.position.z % 16) < 0.5) {
                this.updateChunks();
            }
        }
        this.renderer.render(this.scene, this.camera);
    }
}
