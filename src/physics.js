import * as THREE from 'three';

export class Physics {
    constructor(playerHeight) {
        this.velocity = new THREE.Vector3();
        this.playerHeight = playerHeight;
        this.canJump = false;
        this.raycaster = new THREE.Raycaster();
    }

    update(camera, scene, keys, controls, delta) {
        // Жорстка гравітація
        this.velocity.y -= 28.0 * delta; 

        if (keys['KeyW']) controls.moveForward(0.12);
        if (keys['KeyS']) controls.moveForward(-0.12);
        if (keys['KeyA']) controls.moveRight(-0.12);
        if (keys['KeyD']) controls.moveRight(0.12);

        camera.position.y += this.velocity.y * delta;

        // Промінь вниз для перевірки підлоги
        this.raycaster.set(camera.position, new THREE.Vector3(0, -1, 0));
        const hits = this.raycaster.intersectObjects(scene.children);
        
        if (hits.length > 0) {
            const hitDist = hits[0].distance;
            // Якщо ноги нижче рівня землі — виштовхуємо вгору
            if (hitDist < this.playerHeight) {
                this.velocity.y = 0;
                camera.position.y += (this.playerHeight - hitDist);
                this.canJump = true;
            }
        } else {
            this.canJump = false;
        }

        // Захист від падіння в безодню
        if (camera.position.y < -20) {
            camera.position.set(4, 30, 4);
            this.velocity.y = 0;
        }

        // Стрибок (тільки якщо торкаємося землі)
        if (keys['Space'] && this.canJump) {
            this.velocity.y = 11;
            this.canJump = false;
        }
    }
}
