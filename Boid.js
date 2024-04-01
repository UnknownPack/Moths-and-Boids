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
        this.acceleration = new THREE.Vector3();
        this.initBoidMesh();
    }
    
    update(){
        this.velocity.clampLength(0, this.maxSpeed);
        this.position.add(this.velocity);
        if (this.boidMesh) {
            //sets boid mesh position
            this.boidMesh.position.copy(this.position);
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
    
        const geometry = new THREE.SphereGeometry(0.5, 16, 16);
        const material = new THREE.MeshBasicMaterial({ color: 0x00ff00 });
        this.boidMesh = new THREE.Mesh(geometry, material);
        this.boidMesh.position.copy(this.position);
    }
    
    applyForce(force, deltaTime) {
        let inertiaFactor = 0.01; // Controls how quickly the object can change velocity, simulating inertia
        let smoothingFactor = 10000;
        const smoothedForce = force.clone().multiplyScalar(smoothingFactor);
    
        // Calculate the desired change in velocity, factoring in inertia
        const deltaV = smoothedForce.multiplyScalar(deltaTime * inertiaFactor);
    
        // Add the deltaV to the current velocity, adjusted by deltaTime to ensure frame rate independence
        this.velocity.add(deltaV);
    
        // Optional: Limit the velocity to maxSpeed to prevent it from increasing indefinitely
        this.velocity.clampLength(0, this.maxSpeed);
    
        // If you still want to use an easing function to smooth out the interpolation of the velocity change
        const targetVelocity = this.velocity.clone().add(deltaV);
        const interpolationFactor = easeInOut(Math.min(deltaTime, 1.0));
        this.velocity.lerp(targetVelocity, interpolationFactor);
    }
    
    

    randomMovement(){

    }
    
    attractionToLight(){
        const lightAttractionForce = new THREE.Vector3().subVectors(this.lightPoint, this.position);
        lightAttractionForce.multiplyScalar(this.lightAttraction); 
        return lightAttractionForce;
    }
    
    avoidanceBehaviour(obstacles){
        let avoidanceForce = new THREE.Vector3(); 
    
        for (let obstacle of obstacles) {  
            if (obstacle !== this) { 
                var distance = this.position.distanceTo(obstacle.position);  
                if (distance < this.searchRadius) {  
                    var direction = new THREE.Vector3().subVectors(this.position, obstacle.position).normalize(); 
                    avoidanceForce.add(direction);  
                }
            }
        }
    
      return avoidanceForce;  
    }
  } 

  function easeInOut(t) {
    if (t < 0.5) {
        return 2 * t * t;
    } else {
        return -1 + (4 - 2 * t) * t;
    }
}