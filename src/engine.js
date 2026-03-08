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
        this.raycaster = new THREE.Raycaster(); // Для ламання блоків
        this.collisionRaycaster = new THREE.Raycaster(); // Для стін
        this.loader = new THREE.TextureLoader();

        this.velocity = new THREE.Vector3(); 
        this.canJump = false;
        this.playerHeight = 1.7; // Зріст гравця
    }

    init() {
        this.renderer.setPixelRatio(window.devicePixelRatio);
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        document.body.appendChild(this.renderer.domElement);

        this.scene.add(new THREE.AmbientLight(0xffffff, 0.8));
        const sun = new THREE.DirectionalLight(0xffffff, 1.0);
        sun.position.set(10, 20, 10);
        this.scene.add(sun);

        const grassTex = this.loader.load('./assets/grass.png');
        const stoneTex = this.loader.load('./assets/stone.png');
        [grassTex, stoneTex].forEach(t => { t.magFilter = THREE.NearestFilter; t.minFilter = THREE.NearestFilter; });

        this.createWorld(grassTex, stoneTex);

        document.addEventListener('keydown', (e) => this.keys[e.code] = true);
        document.addEventListener('keyup', (e) => this.keys[e.code] = false);
        document.addEventListener('mousedown', (e) => {
            if (this.controls.isLocked && e.button === 0) this.interact(); 
            else this.controls.lock();
        });

        this.camera.position.set(8, 10, 8);
        this.animate();
    }

    createWorld(grassTex, stoneTex) {
        const geometry = new THREE.BoxGeometry(1, 1, 1);
        const grassMat = new THREE.MeshStandardMaterial({ map: grassTex });
        const stoneMat = new THREE.MeshStandardMaterial({ map: stoneTex });

        for (let x = 0; x < 16; x++) {
            for (let z = 0; z < 16; z++) {
                const height = Math.floor(Math.random() * 2) + 2;
                for (let y = 0; y <= height; y++) {
                    const block = new THREE.Mesh(geometry, y === height ? grassMat : stoneMat);
                    block.position.set(x, y, z);
                    block.name = "voxel";
                    this.scene.add(block);
                }
            }
        }
    }

    interact() {
        this.raycaster.setFromCamera(new THREE.Vector2(0, 0), this.camera);
        const intersects = this.raycaster.intersectObjects(this.scene.children);
        if (intersects.length > 0) this.scene.remove(intersects[0].object);
    }

    // Перевірка, чи є блок у напрямку руху
    checkCollision(vector) {
        this.collisionRaycaster.set(this.camera.position, vector);
        const intersects = this.collisionRaycaster.intersectObjects(this.scene.children);
        return intersects.length > 0 && intersects[0].distance < 0.7;
    }

    animate() {
        requestAnimationFrame(() => this.animate());

        if (this.controls.isLocked) {
            const delta = 0.016;
            this.velocity.y -= 25.0 * delta; // Гравітація

            // Напрямки для перевірки колізій
            const forward = new THREE.Vector3();
            this.camera.getWorldDirection(forward);
            forward.y = 0; forward.normalize();

            const right = new THREE.Vector3().crossVectors(this.camera.up, forward).negate();

            // РУХ З ПЕРЕВІРКОЮ СТІН
            const speed = 0.12;
            if (this.keys['KeyW'] && !this.checkCollision(forward)) this.controls.moveForward(speed);
            if (this.keys['KeyS'] && !this.checkCollision(forward.clone().negate())) this.controls.moveForward(-speed);
            if (this.keys['KeyA'] && !this.checkCollision(right.clone().negate())) this.controls.moveRight(-speed);
            if (this.keys['KeyD'] && !this.checkCollision(right)) this.controls.moveRight(speed);

            this.camera.position.y += this.velocity.y * delta;

            // КОЛІЗІЯ З ПІДЛОГОЮ (Динамічна)
            const downRay = new THREE.Raycaster(this.camera.position, new THREE.Vector3(0, -1, 0));
            const groundHits = downRay.intersectObjects(this.scene.children);

            if (groundHits.length > 0 && groundHits[0].distance < this.playerHeight) {
                this.velocity.y = 0;
                this.camera.position.y += (this.playerHeight - groundHits[0].distance);
                this.canJump = true;
            } else {
                this.canJump = false;
            }

            if (this.keys['Space'] && this.canJump) {
                this.velocity.y = 9.0;
            }
        }

        this.renderer.render(this.scene, this.camera);
    }
}
