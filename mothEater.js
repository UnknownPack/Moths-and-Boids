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
        this.scene = scene;
        this.scene.add(this.mesh)

        this.finished  = false;
    }

    update(deltaTime){
        let direction = new THREE.Vector3().subVectors(this.endPos, this.startPos).normalize();   
        this.managePosition(direction, deltaTime)
        this.manageRotation(direction, deltaTime);
        if(this.position.distanceTo(this.endPos)>= 0.05){
            this.finished = true;
        }
    } 
    
    managePosition(direction, deltaTime){
        let distanceToMove = this.speed * deltaTime;
        // Calculate new position
        const newPosition = new THREE.Vector3().copy(this.position).add(direction.multiplyScalar(distanceToMove));
        
        // Check if the new position has reached or passed the end position
        /*
        if (newPosition.distanceTo(this.startPos) >= this.startPos.distanceTo(this.endPos)) {
            newPosition.copy(this.endPos); // Snap to the end position if it's reached or passed
        }
        */
        this.position.copy(newPosition);
        this.mesh.position.copy(newPosition);  
    }

    manageRotation(direction, deltaTime){
    // Calculate the quaternion to make the object face the direction it is moving
    let targetQuaternion = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 0, 1),direction);
    // Smoothly interpolate the current quaternion to the target quaternion
    this.quaternion.slerp(targetQuaternion, deltaTime * this.speed);
    this.mesh.quaternion.copy(this.quaternion);
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