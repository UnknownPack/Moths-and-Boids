import * as THREE from 'three';

export class spiderWeb{
    constructor(position, material, geometry, maxCatch){
        this.position = position;
        this.mesh = mesh;
        this.caughtMoths = [];
        this.maxCatch = maxCatch;

        this.geometry = geometry;
        this.material = material;
    }

    addMoth(boid, list){
        if(this.caughtMoths<this.maxCatch){
            list.remove(boid);
            this.caughtMoths(boid);
        } 
    }
}