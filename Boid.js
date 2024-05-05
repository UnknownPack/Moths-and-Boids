import * as THREE from 'three';

export class Boid{
    constructor(position, velocity, maxSpeed, maxForce, searchRadius, lightPoint, lightAttraction, scene, geometry, material) { 
        this.position = position; 
        this.velocity = velocity; 
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
    
    update(){
        this.velocity.clampLength(0, this.maxSpeed);
        this.position.add(this.velocity);
        if (this.boidMesh) {
            //sets boid mesh position
            this.boidMesh.position.copy(this.position);
        }
        if (this.boundingSphere) {
            this.boundingSphere.center.copy(this.position);
        }
    }
    
    boieRender(){
        //checks if boidMesh is not null and if this mesh is not already in the scene
        if (this.boidMesh && !this.scene.getObjectById(this.boidMesh.id)) {
            //if both are true, it adds the boid mesh to the scene
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
        let inertiaFactor = 0.001; // Controls how quickly the object can change velocity, simulating inertia
        let smoothingFactor = 10000000;
        const smoothedForce = force.clone().multiplyScalar(smoothingFactor); 
        const deltaV = smoothedForce.multiplyScalar(deltaTime * inertiaFactor); 
        const axes = ['x', 'y', 'z'].sort(() => Math.random() - 0.5);
    
        // Calculate target velocity after applying the deltaV
        let targetVelocity = new THREE.Vector3().copy(this.velocity);
        axes.forEach(axis => {
            targetVelocity[axis] += deltaV[axis];
        });
    
        // Clamp the targetVelocity to prevent it from exceeding maxSpeed
        targetVelocity.clampLength(0, this.maxSpeed); 
        const interpolationFactor = easeInOut(Math.min(deltaTime, 1.0));
        this.velocity.lerp(targetVelocity, interpolationFactor);
    
        // Quaternion rotation
        if (!this.velocity.equals(new THREE.Vector3(0, 0, 0))) { // Ensure the velocity is not zero
            const currentDirection = new THREE.Vector3(0, 1, 0); // Assuming the boid's forward is along y-axis initially
            const targetDirection = this.velocity.clone().normalize();
    
            const quaternionCurrent = new THREE.Quaternion().setFromUnitVectors(currentDirection, this.boidMesh.quaternion);
            const quaternionTarget = new THREE.Quaternion().setFromUnitVectors(currentDirection, targetDirection);
    
            // Slerp from the current quaternion to the target quaternion
            this.boidMesh.quaternion.slerp(quaternionTarget, interpolationFactor);
        }
    }
    
    

    randomMovement(){

    }
    
    attractionToLight(){
        if (!this.lightPoint) return new THREE.Vector3(0, 0, 0); // Return a zero vector if lightPoint is not set
        const lightAttractionForce = new THREE.Vector3().subVectors(this.lightPoint, this.position);
        lightAttractionForce.multiplyScalar(this.lightAttraction); 
        return lightAttractionForce;
    }
    
    avoidanceBehaviour(obstacles) {
        let avoidanceForce = new THREE.Vector3();
        // Define a maximum magnitude for the avoidance force
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