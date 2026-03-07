// Створюємо багато блоків (платформа 10 на 10)
        const geometry = new THREE.BoxGeometry(1, 1, 1);
        const material = new THREE.MeshStandardMaterial({ color: 0x228B22 });

        for (let x = 0; x < 10; x++) {
            for (let z = 0; z < 10; z++) {
                const cube = new THREE.Mesh(geometry, material);
                cube.position.set(x, 0, z); // Розставляємо куби по сітці
                this.scene.add(cube);
            }
        }

        this.camera.position.set(5, 5, 12); // Відсуваємо камеру, щоб бачити все
        this.camera.lookAt(5, 0, 5);
