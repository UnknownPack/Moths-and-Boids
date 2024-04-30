import * as THREE from 'three';
import { Boid } from './Boid.js'; 
import { spatialGrid } from './SpatialPartition.js'; 
import { OBJLoader } from './build/loaders/OBJLoader.js';
import { MTLLoader } from './build/loaders/MTLLoader.js';

  export class BoidManager {
      constructor(numberOfBoids, obstacles, velocity, maxSpeed, maxForce, searchRadius, lightAttraction, spawnRadius, scene) {
          this.numberOfBoids = numberOfBoids;
          this.scene = scene;  
          this.boids = [];  
          this.obstacles = obstacles;
    
          this.velocity = velocity; 
          this.maxSpeed = maxSpeed; 
          this.maxForce = maxForce; 
          this.searchRadius = searchRadius; 
          this.lightPoint = null;  
          this.lightAttraction = lightAttraction; 
          this.spawnRadius = spawnRadius;
          
           

        //SPAITIAL PARTION
        const gridSize = new THREE.Vector3(100, 100, 100); // Dimensions of the grid
        const cellSize = 10; // Length of each side of a cubic cell
        this.grid = new spatialGrid(gridSize, cellSize);

        //loading of model and materials
        const mtlLoader = new MTLLoader();
        mtlLoader.load('./models/Moth/texas_moth/moth.mtl', (materials) => {
            materials.preload();
            const objLoader = new OBJLoader();
            objLoader.setMaterials(materials);
            objLoader.load('./models/Moth/texas_moth/moth.obj', (object) => {
                object.traverse((child) => {
                    if (child.isMesh) {
                        child.material = new THREE.MeshPhongMaterial({
                            color: 0x808080  // Optional: Set a default color or use loaded materials
                        });
                        this.mothGeometry = child.geometry;
                        this.mothMaterial = child.material;
                        this.makeBoids(); // Ensure this is called only after the geometry and materials are fully prepared
                    }
                });
            }, null, (error) => {
                console.error('An error happened during OBJ loading:', error);
            });
        });
      }

      makeBoids(){
        for (let i = 0; i < this.numberOfBoids; i++) {
          let spawnPosition = new THREE.Vector3(
            this.getRandomInt(-this.spawnRadius, this.spawnRadius), 
            this.getRandomInt(-this.spawnRadius, this.spawnRadius), 
            this.getRandomInt(-this.spawnRadius, this.spawnRadius));

            const boidVelocity = new THREE.Vector3(
            this.getRandomFloat(-this.velocity, this.velocity),
            this.getRandomFloat(-this.velocity, this.velocity),
            this.getRandomFloat(-this.velocity, this.velocity)
        ).normalize().multiplyScalar(this.maxSpeed);

          const boid = new Boid(spawnPosition, boidVelocity, this.maxSpeed, 
                                  this.maxForce, this.searchRadius, 
                                  this.lightPoint, this.lightAttraction, this.scene, this.mothGeometry, this.mothMaterial);

          this.boids.push(boid);
      }  
      }

    
      updateBoids(deltaTime) {  
        this.grid.clear();
        for (const boid of this.boids) {
          this.grid.insertBoidAtPosition(boid,boid.givePos());
          } 

          for (const boid of this.boids) {
            const spatialKey = boid.giveSpatialKey(); // Assuming such a method exists to calculate the key from position.
            const nearbyBoids = this.grid.getBoidsInAdjacentCellsByKey(spatialKey);

            var lightAttractionForce = boid.attractionToLight();
            var avoidanceForce = boid.avoidanceBehaviour(nearbyBoids);
    
            //change value of 10 if you want
            if(boid.position.distanceTo(this.lightPoint) > 10){
              boid.applyForce(lightAttractionForce, deltaTime);
            } 
            boid.applyForce(avoidanceForce, deltaTime); 
    
            boid.update();
            boid.boieRender();
          }
    
      }

      

      setLightPoint(lightPoint){
        this.lightPoint = lightPoint;
        // Update lightPoint for each boid
        this.boids.forEach(boid => {
            boid.lightPoint = lightPoint;
        });
    }
    
    
        getRandomInt(min, max) {
            return Math.floor(Math.random() * (max - min + 1)) + min;
        }
    
        getRandomFloat(min, max) {
        return Math.random() * (max - min) + min;
    }
  }

 