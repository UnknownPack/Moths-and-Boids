import * as THREE from 'three';
import { Boid } from './Boid.js'; 
import { spatialGrid } from './SpatialPartition.js'; 
import { OBJLoader } from './build/loaders/OBJLoader.js';
import { MTLLoader } from './build/loaders/MTLLoader.js';
import { GLTFLoader } from './build/loaders/GLTFLoader.js';
  export class BoidManager {
      constructor(numberOfBoids, obstacles, velocity, maxSpeed, maxForce, searchRadius, lightAttraction, spawnRadius, scene) {
          this.numberOfBoids = numberOfBoids;
          this.scene = scene;  
          this.boids = [];  
          this.otherObjects = [];
          this.obstacles = obstacles;
    
          this.velocity = velocity; 
          this.maxSpeed = maxSpeed; 
          this.maxForce = maxForce; 
          this.searchRadius = searchRadius; 
          this.lightPoint = null;  
          this.lightAttraction = lightAttraction; 
          this.spawnRadius = spawnRadius;
          this.minDistance_toLight = 5;
          
           

        //SPAITIAL PARTION
        const gridSize = new THREE.Vector3(20, 20, 20);  
        const cellSize = 2;  
        this.grid = new spatialGrid(gridSize, cellSize);

        const gltfLoader = new GLTFLoader();
        gltfLoader.load('./models/Moth/moth.gltf', (gltf) => {
            gltf.scene.traverse((child) => {
                if (child.isMesh) {
                    child.material = new THREE.MeshPhongMaterial({
                        color: 0x808080   // You can customize the material properties
                    });
                    this.mothGeometry = child.geometry;
                    this.mothMaterial = child.material;
                    this.makeBoids();  // Initialize the boids once the model is loaded
                }
            });
        }, null, (error) => {
            console.error('An error happened during GLTF loading:', error);
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

        let searhR = this.getRandomInt(-this.searchRadius, this.searchRadius)
        

          const boid = new Boid(spawnPosition, boidVelocity, this.maxSpeed, 
                                  this.maxForce, searhR, 
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
            const spatialKey = boid.giveSpatialKey();  
            const nearbyBoids = this.grid.getBoidsInAdjacentCellsByKey(spatialKey);

            var lightAttractionForce = boid.attractionToLight();
            var avoidanceForce = boid.avoidanceBehaviour(nearbyBoids); 
            if(boid.position.distanceTo(this.lightPoint) > this.minDistance_toLight){
              boid.applyForce(lightAttractionForce, deltaTime);
            } 
            boid.applyForce(avoidanceForce, deltaTime); 
    
            boid.update();
            boid.boieRender();
          }

          for (const obj of this.otherObjects){
            this.grid.insertBoidAtPosition(obj,obj.position);
          }
    
      }

      

    setLightPoint(lightPoint){
        this.lightPoint = lightPoint; 
        this.boids.forEach(boid => {
            boid.lightPoint = lightPoint;
        });
    }

    addObjectToGrid(object){
      this.otherObjects.add(object);
    }
    
    
    getRandomInt(min, max) {
      return Math.floor(Math.random() * (max - min + 1)) + min;
    }
    
    getRandomFloat(min, max) {
      return Math.random() * (max - min) + min;
    }
  }

 