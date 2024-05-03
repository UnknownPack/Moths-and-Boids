import * as THREE from 'three';

export class mothEater{

    constructor(position, quaternion, scale, eatRate, eatRange, grid, geometry, material, scene){
        this.position = position;
        this.quaternion = quaternion;
        this.targetQuaternion = null;
        this.scale = scale;
        this.spatialKey = null;

        this.eatRate = eatRate;
        this.eatRange = eatRange;

        this.grid = grid;
        this.mesh = (geometry, material);
        this.scene = scene;
        this.scene.add(this.mesh);
    }

    update(deltaTime){

    }

    meal(){

    }
    
    updateSpatialKey(spatialKey){
        this.spatialKey = spatialKey;
    }

    giveSpatialKey(){
        return this.spatialKey;
    }   

    getRandomInt(min, max) {
        return Math.floor(Math.random() * (max - min + 1)) + min;
    }
      
      getRandomFloat(min, max) {
        return Math.random() * (max - min) + min;
    }
}