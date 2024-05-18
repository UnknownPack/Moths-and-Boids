import * as THREE from 'three';

export class Boid{
    constructor(position, velocity, maxSpeed, maxForce, searchRadius, lightPoint, lightAttraction, scene, geometry, material) { 
        this.position = position; 
        this.velocity = velocity; 
        var quaternion = new THREE.Quaternion(0,0,0);
        this.maxSpeed = maxSpeed; 
        this.maxForce = maxForce; 
        this.lightPoint = lightPoint;  
        this.lightAttraction = lightAttraction;
        this.searchRadius = searchRadius; 
        this.scene = scene;
        this.boidMesh = null;  
        this.boundingSphere = null;
        this.spatialKey = '';
        this.initBoidMesh(geometry, material); 
    }
    
    update() {
        this.velocity.clampLength(0, this.maxSpeed);
        this.position.add(this.velocity);
    
        if (this.boidMesh) {
            this.boidMesh.position.copy(this.position); 
            if (!this.velocity.equals(new THREE.Vector3(0, 0, 0))) {
                const currentDirection = new THREE.Vector3(0, 1, 0);
                const targetDirection = this.velocity.clone().normalize();
                const quaternionTarget = new THREE.Quaternion().setFromUnitVectors(currentDirection, targetDirection);
                this.boidMesh.quaternion.slerp(quaternionTarget, 0.1);  
            }
        }
    
        if (this.boundingSphere) {
            this.boundingSphere.center.copy(this.position);
        }
    }
    

    
    boieRender(){ 
        if (this.boidMesh && !this.scene.getObjectById(this.boidMesh.id)) { 
            this.scene.add(this.boidMesh);
        }
    }
    
    initBoidMesh(geometry, material) { 
        this.boidMesh = new THREE.Mesh(geometry, material);
        this.boidMesh.scale.set(0.1,0.1,0.1);
        this.boidMesh.position.copy(this.position);
    } 
    
    applyForce(force, deltaTime) {
        let inertiaFactor = 0.01;
        let dampingFactor = 0.90;  
        let smoothedForce = force.clone().multiplyScalar(10);
        let deltaV = smoothedForce.multiplyScalar(deltaTime * inertiaFactor);
        this.velocity.add(deltaV);
        this.velocity.multiplyScalar(dampingFactor);  
        this.velocity.clampLength(0, this.maxSpeed); 
        if (!this.velocity.equals(new THREE.Vector3(0, 0, 0))) {
            const currentDirection = new THREE.Vector3(0, 1, 0);
            const targetDirection = this.velocity.clone().normalize();
            const quaternionTarget = new THREE.Quaternion().setFromUnitVectors(currentDirection, targetDirection);
            this.boidMesh.quaternion.slerp(quaternionTarget, 0.1);
        }
    }
    
    
    randomRotation() { 
        let disperseValue = 15;
        let directionVector = new THREE.Vector3(
            this.getRandomInt(-disperseValue, disperseValue),
            this.getRandomInt(-disperseValue, disperseValue),
            this.getRandomInt(-disperseValue, disperseValue));
    
        return directionVector;
    }

    
    
    attractionToLight() {
        let lightAttractionForce = new THREE.Vector3(0, 0, 0);
    
        if (!this.lightPoint) return lightAttractionForce;
    
        if (this.lightAttraction > 0) {
            lightAttractionForce = new THREE.Vector3().subVectors(this.lightPoint, this.position);
            lightAttractionForce.multiplyScalar(this.lightAttraction * 0.1);  

            if (!lightAttractionForce.equals(new THREE.Vector3(0, 0, 0))) {
                const currentDirection = new THREE.Vector3(0, 0, -1);  
                const targetDirection = lightAttractionForce.clone().normalize();
                const quaternionTarget = new THREE.Quaternion().setFromUnitVectors(currentDirection, targetDirection);
                this.boidMesh.quaternion.slerp(quaternionTarget, 0.0025); 
            }
        } else {
            lightAttractionForce = new THREE.Vector3(
                this.getRandomFloat(0.01, 1), 
                this.getRandomFloat(0.01, 1), 
                this.getRandomFloat(0.01, 1)
            ).normalize().multiplyScalar(this.maxSpeed);  
        } 
        const leftForce = this.leftForce_forOrbit(); 
        const combinedForce = lightAttractionForce.add(leftForce);
    
        return combinedForce;
    }
    
    
    leftForce_forOrbit() {
        if (!this.lightPoint) return new THREE.Vector3(0, 0, 0);
    
        const distanceToLight = this.position.distanceTo(this.lightPoint); 
        const leftForceMagnitude = Math.max(this.lightAttraction / (distanceToLight + 1), 0.1);  
        const leftDirection = new THREE.Vector3(-1, 0, 0).applyQuaternion(this.boidMesh.quaternion).normalize();        
        const leftForce = leftDirection.multiplyScalar(leftForceMagnitude);
    
        return leftForce;
    }
    
    
    
    avoidanceBehaviour(obstacles) {
        let avoidanceForce = new THREE.Vector3();
        const maxAvoidanceForce = 0.05;
    
        for (let obstacle of obstacles) {  
            if (obstacle !== this) { 
                var distance = this.position.distanceTo(obstacle.position);  
                if (distance < this.searchRadius) {  
                    var direction = new THREE.Vector3().subVectors(this.position, obstacle.position).normalize(); 
                    avoidanceForce.add(direction);  
                }
            }
        }
        /*
        if (avoidanceForce.length() > maxAvoidanceForce) {
            avoidanceForce.normalize().multiplyScalar(maxAvoidanceForce);
        }
        */
    
        // Quaternion rotation to lean back from obstacles
        if (!avoidanceForce.equals(new THREE.Vector3(0, 0, 0))) {
            const currentDirection = new THREE.Vector3(0, 0, 1);  // Assuming the backward direction
            const targetDirection = avoidanceForce.clone().normalize();
            const quaternionTarget = new THREE.Quaternion().setFromUnitVectors(currentDirection, targetDirection);
            this.boidMesh.quaternion.slerp(quaternionTarget, 0.05); // Adjust the factor as needed
        }
    
        return avoidanceForce;
    }



    setLightPoint(point){
        this.lightPoint = point;
    }
    

    updateSpatialKey(spatialKey){
        this.spatialKey = spatialKey;
    }

    giveLightPoint(){
        return this.lightPoint;
    }

    giveSpatialKey(){
        return this.spatialKey;
    }   

    givePos(){
        return this.position;
    }

    getRandomInt(min, max) {
        return Math.floor(Math.random() * (max - min + 1)) + min;
      }
      
      getRandomFloat(min, max) {
        return Math.random() * (max - min) + min;
      }
  } 

  function easeInOut(t) {
    if (t < 0.5) {
        return 2 * t * t;
    } else {
        return -1 + (4 - 2 * t) * t;
    }

    function* test() {
        console.log('Hello!');
        var x = yield;
        console.log('First I got: ' + x);
        var y = yield;
        console.log('Then I got: ' + y);
    }
}