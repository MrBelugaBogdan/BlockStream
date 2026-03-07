// BlockStream Engine Core
class GameEngine {
    constructor() {
        this.scene = new THREE.Scene();
        this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
        this.renderer = new THREE.WebGLRenderer({ antialias: true });
        this.scene.background = new THREE.Color(0x87CEEB); 
    }

    init() {
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        document.body.appendChild(this.renderer.domElement);

        const sunLight = new THREE.DirectionalLight(0xffffff, 1.2);
        sunLight.position.set(10, 20, 10);
        this.scene.add(sunLight);
        this.scene.add(new THREE.AmbientLight(0xffffff, 0.4));

        const geometry = new THREE.BoxGeometry(1, 1, 1);
        const material = new THREE.MeshStandardMaterial({ color: 0x228B22 });

        for (let x = 0; x < 10; x++) {
            for (let z = 0; z < 10; z++) {
                const block = new THREE.Mesh(geometry, material);
                block.position.set(x, 0, z);
                this.scene.add(block);
            }
        }

        this.camera.position.set(12, 8, 15);
        this.camera.lookAt(5, 0, 5);

        this.animate();
    }

    animate() {
        requestAnimationFrame(() => this.animate());
        this.renderer.render(this.scene, this.camera);
    }
}

// КРИТИЧНО ВАЖЛИВО: цей рядок має бути останнім!
window.GameEngine = GameEngine;
