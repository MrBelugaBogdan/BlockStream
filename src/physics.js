import * as THREE from 'three';

export class Physics {
    constructor(playerHeight) {
        this.velocity = new THREE.Vector3();
        this.playerHeight = playerHeight;
        this.canJump = false;
        this.raycaster = new THREE.Raycaster();
    }

    update(camera, scene, keys, controls, delta) {
        this.velocity.y -= 25.0 * delta; // Гравітація

        const dir = new THREE.Vector3();
        camera.getWorldDirection(dir); dir.y = 0; dir.normalize();
        const side = new THREE.Vector3().crossVectors(camera.up, dir).negate();

        if (keys['KeyW']) controls.moveForward(0.12);
        if (keys['KeyS']) controls.moveForward(-0.12);
        if (keys['KeyA']) controls.moveRight(-0.12);
        if (keys['KeyD']) controls.moveRight(0.12);

        camera.position.y += this.velocity.y * delta;

        // Колізія з підлогою
        this.raycaster.set(camera.position, new THREE.Vector3(0, -1, 0));
        const hits = this.raycaster.intersectObjects(scene.children);
        
        if (hits.length > 0 && hits[0].distance < this.playerHeight) {
            this.velocity.y = 0;
            camera.position.y += (this.playerHeight - hits[0].distance);
            this.canJump = true;
        } else {
            this.canJump = false;
        }

        if (keys['Space'] && this.canJump) this.velocity.y = 9;
    }
}
