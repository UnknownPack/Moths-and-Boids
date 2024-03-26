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
    
    applyForce(force) {
      // Assume mass = 1 for simplicity
        let smoothingFactor = 0.1;
        const smoothedForce = force.clone().multiplyScalar(smoothingFactor);
        this.velocity.add(smoothedForce);
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