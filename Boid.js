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
        this.run = false;
        this.runDistance = 1;
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
        this.boidMesh.scale.set(0.1,0.1,0.1);
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

    
    
    attractionToLight() {
        let lightAttractionForce;  
    
        if (!this.lightPoint) return new THREE.Vector3(0, 0, 0);  
    
        if (this.lightAttraction > 0) {
            lightAttractionForce = new THREE.Vector3().subVectors(this.lightPoint, this.position);
            lightAttractionForce.normalize().multiplyScalar(this.lightAttraction).normalize();


            
            // Quaternion rotation towards light
            if (!lightAttractionForce.equals(new THREE.Vector3(0, 0, 0))) {
                const currentDirection = new THREE.Vector3(0, 0, -1);  // Assuming the forward direction
                const targetDirection = lightAttractionForce.clone().normalize();
                const quaternionTarget = new THREE.Quaternion().setFromUnitVectors(currentDirection, targetDirection);
                this.boidMesh.quaternion.slerp(quaternionTarget, (0.05*0.05)); // Adjust the factor as needed
            }
        } 
        
        else if (this.lightAttraction <= 0) {
            lightAttractionForce = new THREE.Vector3(
                this.getRandomFloat(0.01, 1), 
                this.getRandomFloat(0.01, 1), 
                this.getRandomFloat(0.01, 1)
            ).normalize().multiplyScalar(this.maxSpeed); // Example scalar to control the magnitude
        }
    
        return lightAttractionForce;
    }
    
    
    avoidanceBehaviour(obstacles) {
    let sumDirections = new THREE.Vector3();
    let count = 0;  // Counter for obstacles within search radius

    for (let obstacle of obstacles) {
        if (obstacle !== this) {
            var distance = this.position.distanceTo(obstacle.position);
            if (distance < this.searchRadius) {
                var direction = new THREE.Vector3().subVectors(this.position, obstacle.position);
                let weight = 1 - (distance / this.searchRadius);  // Normalized weight
                sumDirections.add(direction.multiplyScalar(weight));
                count++;
            }
        }
    }

    if (count > 0) {
        let avoidanceForce = sumDirections.divideScalar(count);  // Calculate the average direction
        avoidanceForce.negate();  // Get the opposite direction

        // Normalize and apply the max avoidance force if the avoidanceForce vector is not zero
        if (!avoidanceForce.equals(new THREE.Vector3(0, 0, 0))) {
            if (avoidanceForce.length() > this.maxAvoidanceForce) {
                avoidanceForce.normalize().multiplyScalar(this.maxAvoidanceForce);
            }

            // Quaternion rotation to lean back from obstacles
            const currentDirection = new THREE.Vector3(0, 0, 1);  // Assuming the forward direction is z
            const targetDirection = avoidanceForce.clone().normalize();
            const quaternionTarget = new THREE.Quaternion().setFromUnitVectors(currentDirection, targetDirection);
            this.boidMesh.quaternion.slerp(quaternionTarget, 0.05); // Adjust the factor as needed
        }

        return avoidanceForce;
    }
    else if(count == 0){
        //console.log("no count");
    }
    else{
        //console.log("no avoidance force");
    }

    return new THREE.Vector3(); // Return zero vector if no obstacles within range
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
}