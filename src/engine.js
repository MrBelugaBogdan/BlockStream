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
        this.loader = new THREE.TextureLoader();

        // ФІЗИКА ГРАВЦЯ
        this.velocity = new THREE.Vector3(); 
        this.canJump = false;
        this.playerHeight = 1.8; // Твій зріст у блоках
    }

    init() {
        this.renderer.setPixelRatio(window.devicePixelRatio);
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        document.body.appendChild(this.renderer.domElement);

        const ambientLight = new THREE.AmbientLight(0xffffff, 0.8);
        this.scene.add(ambientLight);
        const sun = new THREE.DirectionalLight(0xffffff, 1.0);
        sun.position.set(10, 20, 10);
        this.scene.add(sun);

        const grassTex = this.loader.load('./assets/grass.png');
        const stoneTex = this.loader.load('./assets/stone.png');

        [grassTex, stoneTex].forEach(t => {
            t.magFilter = THREE.NearestFilter;
            t.minFilter = THREE.NearestFilter;
        });

        this.createWorld(grassTex, stoneTex);

        document.addEventListener('keydown', (e) => this.keys[e.code] = true);
        document.addEventListener('keyup', (e) => this.keys[e.code] = false);
        
        document.addEventListener('click', () => {
            if (this.controls.isLocked) {
                this.interact(true); 
            } else {
                this.controls.lock(); 
            }
        });

        // Початкова позиція (над землею)
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

    interact(isBreaking) {
        this.raycaster.setFromCamera(new THREE.Vector2(0, 0), this.camera);
        const intersects = this.raycaster.intersectObjects(this.scene.children);
        if (intersects.length > 0 && isBreaking) {
            this.scene.remove(intersects[0].object);
        }
    }

    animate() {
        requestAnimationFrame(() => this.animate());

        if (this.controls.isLocked) {
            const delta = 0.016; // 60 FPS
            
            // ГРАВІТАЦІЯ
            this.velocity.y -= 25.0 * delta; 

            // РУХ (Тільки по горизонталі, без польоту вгору поглядом)
            const speed = 0.12;
            if (this.keys['KeyW']) this.controls.moveForward(speed);
            if (this.keys['KeyS']) this.controls.moveForward(-speed);
            if (this.keys['KeyA']) this.controls.moveRight(-speed);
            if (this.keys['KeyD']) this.controls.moveRight(speed);

            // ЗАСТОСУВАННЯ ПАДІННЯ
            this.camera.position.y += this.velocity.y * delta;

            // КОЛІЗІЯ З ПІДЛОГОЮ (Тут магія!)
            // Ми беремо висоту блоків (приблизно 4) + твій зріст
            if (this.camera.position.y < 5.5) { 
                this.velocity.y = 0;
                this.camera.position.y = 5.5;
                this.canJump = true;
            }

            // СТРИБОК
            if (this.keys['Space'] && this.canJump) {
                this.velocity.y = 10.0; // Сила стрибка
                this.canJump = false;
            }
        }

        this.renderer.render(this.scene, this.camera);
    }
}
