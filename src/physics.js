import * as THREE from 'three';

export class Physics {
    constructor(playerHeight) {
        this.velocity = new THREE.Vector3();
        this.playerHeight = playerHeight;
        this.canJump = false;
        this.raycaster = new THREE.Raycaster();
    }

    update(camera, scene, keys, controls, delta) {
        this.velocity.y -= 25.0 * delta;

        if (keys['KeyW']) controls.moveForward(0.12);
        if (keys['KeyS']) controls.moveForward(-0.12);
        if (keys['KeyA']) controls.moveRight(-0.12);
        if (keys['KeyD']) controls.moveRight(0.12);

        camera.position.y += this.velocity.y * delta;

        this.raycaster.set(camera.position, new THREE.Vector3(0, -1, 0));
        const hits = this.raycaster.intersectObjects(scene.children);
        
        if (hits.length > 0) {
            const hitDist = hits[0].distance;
            // Тільки низькі перешкоди дозволяють піднятися
            if (hitDist < this.playerHeight && hitDist > this.playerHeight - 0.6) {
                this.velocity.y = 0;
                camera.position.y += (this.playerHeight - hitDist);
                this.canJump = true;
            } else if (hitDist < this.playerHeight - 0.6) {
                this.velocity.y = 0;
            }
        } else {
            this.canJump = false;
        }

        if (keys['Space'] && this.canJump) this.velocity.y = 9;
    }
}
