import * as THREE from 'three';

export class mothEater{

    constructor(position, startPos, endPos, speed, eatRange, geometry, material, scene){
        this.position = position;
        this.startPos = startPos;
        this.endPos = endPos;
        this.speed = speed;
        this.spatialKey = null; 
        this.eatRange = eatRange;

        this.mesh = new THREE.Mesh(geometry, material);
        this.mesh.position.copy(this.startPos);
        this.mesh.scale.set(30, 30, 30);
        this.mesh.rotation.set( 0, Math.PI / 2, 0); 
        this.scene = scene;
        this.scene.add(this.mesh) 
        this.finished  = false;
    }

    update(deltaTime){
        console.log(this.mesh.position);
        let direction = new THREE.Vector3().subVectors(this.endPos, this.startPos).normalize();   
        this.managePosition(direction, deltaTime)
        if(this.position.distanceTo(this.endPos)>= 0.05){
            this.finished = true;
        }
    } 
    
    managePosition(direction, deltaTime){
        let distanceToMove = this.speed * deltaTime;
        // Calculate new position
        const newPosition = new THREE.Vector3().copy(this.position).add(direction.multiplyScalar(distanceToMove));
        
        if (newPosition.distanceTo(this.startPos) >= this.startPos.distanceTo(this.endPos)) {
            newPosition.copy(this.endPos); // Snap to the end position if it's reached or passed
            if(this.mesh !=null) this.scene.remove(this.mesh); 
            if (this.mesh.material) this.mesh.material.dispose();
            if (this.mesh.geometry) this.mesh.geometry.dispose(); 
        }
        
        this.position.copy(newPosition);
        this.mesh.position.copy(newPosition);  
    } 

    givePos(){
        return this.position;
    }
    giveState(){
        return this.finished;
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