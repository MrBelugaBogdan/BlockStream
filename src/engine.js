import * as THREE from 'three';

export class GameEngine {
    constructor() {
        this.scene = new THREE.Scene();
        this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
        this.renderer = new THREE.WebGLRenderer({ antialias: true });
    }

    init() {
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        document.body.appendChild(this.renderer.domElement);

        // Додаємо світло (як сонце)
        const light = new THREE.DirectionalLight(0xffffff, 1);
        light.position.set(5, 5, 5).normalize();
        this.scene.add(light);

        // Створюємо перший блок (Земля)
        const geometry = new THREE.BoxGeometry(1, 1, 1);
        const material = new THREE.MeshStandardMaterial({ color: 0x00ff00 }); // Зелений
        const cube = new THREE.Mesh(geometry, material);
        this.scene.add(cube);

        this.camera.position.z = 5;

        // Запуск циклу гри
        this.animate(cube);
    }

    animate(cube) {
        requestAnimationFrame(() => this.animate(cube));
        
        // Невелике обертання, щоб ми бачили, що це 3D
        cube.rotation.x += 0.01;
        cube.rotation.y += 0.01;

        this.renderer.render(this.scene, this.camera);
    }
}
