import * as THREE from 'three';

export class Boid{
    constructor(position, velocity, maxSpeed, maxForce, searchRadius, lightPoint, lightAttraction, scene) { 
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
        this.initBoidMesh();
        this.initBoundingSphere();
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
    
    initBoidMesh() {
        // I'd reckon you can change the mesh of the moth here
        // I will use spheres to represent the moth
    
        const geometry = new THREE.SphereGeometry(0.1, 16, 16);
        const material = new THREE.MeshBasicMaterial({ color: 0x00ff00 });
        this.boidMesh = new THREE.Mesh(geometry, material);
        this.boidMesh.position.copy(this.position);
    }

    initBoundingSphere() {
        // this will be the volume upon which collision detection checks will be made
        let sphereRadius = this.searchRadius * 2; 
        this.boundingSphere = new THREE.Sphere(this.position.clone(), sphereRadius);
    }
    
    applyForce(force, deltaTime) {
        let inertiaFactor = 0.001; // Controls how quickly the object can change velocity, simulating inertia
        let smoothingFactor = 10000000;
        const smoothedForce = force.clone().multiplyScalar(smoothingFactor);
    
        // Calculate the desired change in velocity, factoring in inertia
        const deltaV = smoothedForce.multiplyScalar(deltaTime * inertiaFactor);
    
        // Shuffle the axes to apply forces in random order
        const axes = ['x', 'y', 'z'].sort(() => Math.random() - 0.5);
    
        // Apply the deltaV component by component in the randomized order
        axes.forEach(axis => {
            let targetVelocity = new THREE.Vector3();
            targetVelocity.copy(this.velocity);
    
            // Apply the change to the current axis
            targetVelocity[axis] += deltaV[axis];
    
            // Limit the velocity on this axis to prevent it from increasing indefinitely
            targetVelocity[axis] = Math.min(Math.max(targetVelocity[axis], -this.maxSpeed), this.maxSpeed);
    
            // Smooth out the interpolation of the velocity change for this axis
            const interpolationFactor = easeInOut(Math.min(deltaTime, 1.0));
            this.velocity[axis] += (targetVelocity[axis] - this.velocity[axis]) * interpolationFactor;
        });
    
        // Ensure the total velocity doesn't exceed maxSpeed
        this.velocity.clampLength(0, this.maxSpeed);
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