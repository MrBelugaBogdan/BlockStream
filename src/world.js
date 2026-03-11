import * as THREE from 'three';

export class World {
    constructor(scene, mats) {
        this.scene = scene;
        this.mats = mats;
        this.chunks = new Map();
        this.chunkSize = 8;
        this.savedChanges = {};
        this.blockGeo = new THREE.BoxGeometry(1, 1, 1);
    }

    addBlock(x, y, z, type) {
        const key = `${Math.round(x)},${Math.round(y)},${Math.round(z)}`;
        if (this.savedChanges[key] === 'air') return;
        
        if (this.scene.getObjectByName(key)) return;

        const finalType = this.savedChanges[key] || type;
        const block = new THREE.Mesh(this.blockGeo, this.mats[finalType]);
        block.position.set(x, y, z);
        block.name = key;
        this.scene.add(block);
    }

    createTree(x, y, z) {
        for (let i = 1; i <= 3; i++) this.addBlock(x, y + i, z, 'wood');
        for (let lx = -1; lx <= 1; lx++) {
            for (let lz = -1; lz <= 1; lz++) {
                this.addBlock(x + lx, y + 4, z + lz, 'leaves');
            }
        }
        this.addBlock(x, y + 5, z, 'leaves');
    }

    generateChunk(cx, cz) {
        const key = `${cx},${cz}`;
        if (this.chunks.has(key)) return;

        for (let x = 0; x < this.chunkSize; x++) {
            for (let z = 0; z < this.chunkSize; z++) {
                const wx = cx * this.chunkSize + x;
                const wz = cz * this.chunkSize + z;
                const h = Math.floor(Math.abs(Math.sin(wx * 0.1) * Math.cos(wz * 0.1)) * 3) + 5;

                this.addBlock(wx, h, wz, 'grass');
                this.addBlock(wx, h - 1, wz, 'stone');

                const treeSeed = Math.abs(Math.sin(wx * 12.3) * Math.cos(wz * 45.6));
                if (treeSeed < 0.02) this.createTree(wx, h, wz);
            }
        }
        this.chunks.set(key, true);
    }
}
