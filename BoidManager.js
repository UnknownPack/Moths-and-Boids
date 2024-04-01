import * as THREE from 'three';
import { Boid } from './Boid.js';

  export class BoidManager {
      constructor(numberOfBoids, obstacles, velocity, maxSpeed, maxForce, searchRadius, lightPoint, lightAttraction, spawnRadius, scene) {
          this.numberOfBoids = numberOfBoids;
          this.scene = scene;  
          this.boids = [];  
          this.obstacles = obstacles;
    
          this.velocity = velocity; 
          this.maxSpeed = maxSpeed; 
          this.maxForce = maxForce; 
          this.searchRadius = searchRadius; 
          this.lightPoint = lightPoint;  
          this.lightAttraction = lightAttraction; 
          this.spawnRadius = spawnRadius;
          
          for (let i = 0; i < this.numberOfBoids; i++) {
              let spawnPosition = new THREE.Vector3(
                this.getRandomInt(-this.spawnRadius, this.spawnRadius), 
                this.getRandomInt(-this.spawnRadius, this.spawnRadius), 
                this.getRandomInt(-this.spawnRadius, this.spawnRadius));
    
                const boidVelocity = new THREE.Vector3(
                this.getRandomFloat(-velocity, velocity),
                this.getRandomFloat(-velocity, velocity),
                this.getRandomFloat(-velocity, velocity)
            ).normalize().multiplyScalar(maxSpeed);
    
              const boid = new Boid(spawnPosition, boidVelocity, this.maxSpeed, 
                                      this.maxForce, this.searchRadius, 
                                      this.lightPoint, this.lightAttraction, this.scene);
    
              this.boids.push(boid);
          }  
      }
    
      updateBoids(deltaTime) { 
        for (const boid of this.boids) {
              this.obstacles.push(boid);
          }
    
          for (const boid of this.boids) {
            var lightAttractionForce = boid.attractionToLight();
            var avoidanceForce = boid.avoidanceBehaviour(this.obstacles);
    
            //change value of 10 if you want
            if(boid.position.distanceTo(this.lightPoint) > 25){
              boid.applyForce(lightAttractionForce, deltaTime);
            } 
            boid.applyForce(avoidanceForce, deltaTime); 
    
            boid.update();
            boid.boieRender();
          }
    
      }
    
        getRandomInt(min, max) {
            return Math.floor(Math.random() * (max - min + 1)) + min;
        }
    
        getRandomFloat(min, max) {
        return Math.random() * (max - min) + min;
    }
  }
 