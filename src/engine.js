class GameEngine {
    constructor() {
        this.scene = new THREE.Scene();
        this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
        this.renderer = new THREE.WebGLRenderer({ antialias: true });
        this.scene.background = new THREE.Color(0x87CEEB);
        
        this.keys = {};
        this.raycaster = new THREE.Raycaster(); // Наш "лазер" для ламання блоків
        this.mouse = new THREE.Vector2(0, 0); // Центр екрану
    }

    init() {
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        document.body.appendChild(this.renderer.domElement);

        // Світло
        const sunLight = new THREE.DirectionalLight(0xffffff, 1.2);
        sunLight.position.set(10, 20, 10);
        this.scene.add(sunLight);
        this.scene.add(new THREE.AmbientLight(0xffffff, 0.4));

        // Створення платформи
        const geometry = new THREE.BoxGeometry(1, 1, 1);
        const material = new THREE.MeshStandardMaterial({ color: 0x228B22 });

        for (let x = 0; x < 10; x++) {
            for (let z = 0; z < 10; z++) {
                const block = new THREE.Mesh(geometry, material);
                block.position.set(x, 0, z);
                this.scene.add(block);
            }
        }

        this.camera.position.set(5, 2, 10);

        // Керування клавішами
        window.addEventListener('keydown', (e) => this.keys[e.code] = true);
        window.addEventListener('keyup', (e) => this.keys[e.code] = false);

        // --- ЛАМАННЯ БЛОКІВ ПО КЛІКУ ---
        window.addEventListener('mousedown', (e) => {
            if (e.button === 0) { // Ліва кнопка миші
                this.breakBlock();
            }
        });

        this.animate();
    }

    breakBlock() {
        // Стріляємо лазером з камери вперед
        this.raycaster.setFromCamera(this.mouse, this.camera);
        
        // Перевіряємо, чи перетинає лазер якісь об'єкти
        const intersects = this.raycaster.intersectObjects(this.scene.children);

        if (intersects.length > 0) {
            const object = intersects[0].object;
            // Видаляємо тільки меші (блоки), а не світло
            if (object instanceof THREE.Mesh) {
                this.scene.remove(object);
                console.log("Блок зламано!");
            }
        }
    }

    animate() {
        requestAnimationFrame(() => this.animate());

        const speed = 0.1;
        if (this.keys['KeyW']) this.camera.position.z -= speed;
        if (this.keys['KeyS']) this.camera.position.z += speed;
        if (this.keys['KeyA']) this.camera.position.x -= speed;
        if (this.keys['KeyD']) this.camera.position.x += speed;

        this.renderer.render(this.scene, this.camera);
    }
}
window.GameEngine = GameEngine;
