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
            
            // Update orientation to face the direction of velocity
            if (!this.velocity.equals(new THREE.Vector3(0, 0, 0))) {
                const currentDirection = new THREE.Vector3(0, 1, 0);
                const targetDirection = this.velocity.clone().normalize();
                const quaternionTarget = new THREE.Quaternion().setFromUnitVectors(currentDirection, targetDirection);
                this.boidMesh.quaternion.slerp(quaternionTarget, 0.1); // Adjust 0.1 to a suitable factor for your simulation speed
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
        // I'd reckon you can change the mesh of the moth here
        // I will use spheres to represent the moth
    
        this.boidMesh = new THREE.Mesh(geometry, material);
        this.boidMesh.scale.set(0.07, 0.07, 0.07);
        this.boidMesh.position.copy(this.position);
    } 
    
    applyForce(force, deltaTime) {
        let inertiaFactor = 0.001;
        let dampingFactor = 0.95;  // Reduce velocity by 5% each frame to add damping
        let smoothedForce = force.clone().multiplyScalar(10000000);
        let deltaV = smoothedForce.multiplyScalar(deltaTime * inertiaFactor);
        this.velocity.add(deltaV);
        this.velocity.multiplyScalar(dampingFactor); // Apply damping
        this.velocity.clampLength(0, this.maxSpeed);
    
        // Quaternion rotation to face velocity direction
        if (!this.velocity.equals(new THREE.Vector3(0, 0, 0))) {
            const currentDirection = new THREE.Vector3(0, 1, 0);
            const targetDirection = this.velocity.clone().normalize();
            const quaternionTarget = new THREE.Quaternion().setFromUnitVectors(currentDirection, targetDirection);
            this.boidMesh.quaternion.slerp(quaternionTarget, 0.1);
        }
    }
    
    
    
    randomRotation() {
        // Generate a new random direction vector
        let disperseValue = 15;
        let directionVector = new THREE.Vector3(
            this.getRandomInt(-disperseValue, disperseValue),
            this.getRandomInt(-disperseValue, disperseValue),
            this.getRandomInt(-disperseValue, disperseValue));
    
        return directionVector;
    }
    
    attractionToLight(){
        if (!this.lightPoint) return new THREE.Vector3(0, 0, 0); // Return a zero vector if lightPoint is not set
        const lightAttractionForce = new THREE.Vector3().subVectors(this.lightPoint, this.position);
        lightAttractionForce.multiplyScalar(this.lightAttraction);
    
        // Quaternion rotation towards light
        if (!lightAttractionForce.equals(new THREE.Vector3(0, 0, 0))) {
            const currentDirection = new THREE.Vector3(0, 0, -1);  // Assuming the forward direction
            const targetDirection = lightAttractionForce.clone().normalize();
            const quaternionTarget = new THREE.Quaternion().setFromUnitVectors(currentDirection, targetDirection);
            this.boidMesh.quaternion.slerp(quaternionTarget, 0.05); // Adjust the factor as needed
        }
    
        return lightAttractionForce;
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
        
        if (avoidanceForce.length() > maxAvoidanceForce) {
            avoidanceForce.normalize().multiplyScalar(maxAvoidanceForce);
        }
    
        // Quaternion rotation to lean back from obstacles
        if (!avoidanceForce.equals(new THREE.Vector3(0, 0, 0))) {
            const currentDirection = new THREE.Vector3(0, 0, 1);  // Assuming the backward direction
            const targetDirection = avoidanceForce.clone().normalize();
            const quaternionTarget = new THREE.Quaternion().setFromUnitVectors(currentDirection, targetDirection);
            this.boidMesh.quaternion.slerp(quaternionTarget, 0.05); // Adjust the factor as needed
        }
    
        return avoidanceForce;
    }
    

    updateSpatialKey(spatialKey){
        this.spatialKey = spatialKey;
    }

    giveSpatialKey(){
        return this.spatialKey;
    }   

    givePos(){
        return this.position;
    }
  } 

  function easeInOut(t) {
    if (t < 0.5) {
        return 2 * t * t;
    } else {
        return -1 + (4 - 2 * t) * t;
    }
}