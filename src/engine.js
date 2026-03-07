// BlockStream Engine — Повне ядро зі світлом та генерацією світу
class GameEngine {
    constructor() {
        this.scene = new THREE.Scene();
        // Налаштування камери: кут огляду 75 градусів
        this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
        this.renderer = new THREE.WebGLRenderer({ antialias: true });
        
        // Колір фону (небо)
        this.scene.background = new THREE.Color(0x87CEEB); 
    }

    init() {
        // Налаштування розміру гри на весь екран
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        document.body.appendChild(this.renderer.domElement);

        // --- ОСВІТЛЕННЯ ---
        // Сонце (світить збоку і зверху)
        const sunLight = new THREE.DirectionalLight(0xffffff, 1.2);
        sunLight.position.set(10, 20, 10);
        this.scene.add(sunLight);
        
        // М'яке світло (щоб тіні не були повністю чорними)
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.4);
        this.scene.add(ambientLight);

        // --- ГЕНЕРАЦІЯ СВІТУ ---
        const geometry = new THREE.BoxGeometry(1, 1, 1);
        const material = new THREE.MeshStandardMaterial({ color: 0x228B22 }); // Зелений колір трави

        // Створюємо платформу 10x10 блоків
        for (let x = 0; x < 10; x++) {
            for (let z = 0; z < 10; z++) {
                const block = new THREE.Mesh(geometry, material);
                block.position.set(x, 0, z); // Розміщуємо блок у просторі
                this.scene.add(block);
            }
        }

        //
