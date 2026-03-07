import * as THREE from 'three';

export class GameEngine {
    constructor() {
        this.projectName = "BlockStream";
        this.scene = new THREE.Scene();
        this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
        this.renderer = new THREE.WebGLRenderer({ antialias: true });
    }

    init() {
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        document.body.appendChild(this.renderer.domElement);

        // Додаємо світло (як у справжніх іграх)
        const light = new THREE.DirectionalLight(0xffffff, 1.2);
        light.position.set(5, 10, 7.5).normalize();
        this.scene.add(light);
        
        const ambientLight = new THREE.AmbientLight(0x404040); // М'яке підсвічування тіней
        this.scene.add(ambientLight);

        // Наш перший блок у BlockStream
        const geometry = new THREE.BoxGeometry(1, 1, 1);
        const material = new THREE.MeshStandardMaterial({ color: 0x228B22 }); // Колір трави
        this.cube = new THREE.Mesh(geometry, material);
        this.scene.add(this.cube);

        this.camera.position.z = 3;
        this.camera.position.y = 1;
        this.camera.lookAt(0, 0, 0);

        this.animate();
    }

    animate() {
        requestAnimationFrame(() => this.animate());
        
        if (this.cube) {
            this.cube.rotation.y += 0.01; // Обертаємо навколо осі
        }

        this.renderer.render(this.scene, this.camera);
    }
}
