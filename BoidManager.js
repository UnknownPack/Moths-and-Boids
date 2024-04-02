import * as THREE from 'three';
import { Boid } from './Boid.js'; 

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

        //SPAITIAL PARTION
        const gridSize = new THREE.Vector3(100, 100, 100); // Dimensions of the grid
        const cellSize = 10; // Length of each side of a cubic cell
        this.grid = new spatialGrid(gridSize, cellSize);

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

  export class spatialGrid{
    // Initialize the grid with dimensions and cell size.
    constructor(gridSize, cellSize) {
        this.gridSize = gridSize; // Dimensions of the grid in 3D space.
        this.cellSize = cellSize; // Length of each side of a cubic cell.
        this.cells = {}; // Stores objects with a cell coordinate key.
        // Calculate the number of cells needed along each axis.
        this.dimensions = {
            x: Math.ceil(gridSize.x / cellSize),
            y: Math.ceil(gridSize.y / cellSize),
            z: Math.ceil(gridSize.z / cellSize)
        };
    }

    // Generate a string key based on cell coordinates for identifying cells.
    _cellKey(x, y, z) {
        return `${x}_${y}_${z}`;
    }

    insertBoidAtPosition(boid, position) {
        // Calculate the cell indices based on the position.
        const x = Math.floor(position.x / this.cellSize);
        const y = Math.floor(position.y / this.cellSize);
        const z = Math.floor(position.z / this.cellSize);
    
        // Generate the cell's unique key.
        const key = this._cellKey(x, y, z);
    
        // Initialize the cell's array if it doesn't already exist.
        if (!this.cells[key]) {
            this.cells[key] = [];
        }
    
        // Add the boid to the cell.
        this.cells[key].push(boid);
    
        // Additionally, set the boid's spatialKey to the cell key for easy reference.
        boid.updateSpatialKey(key);
    }

    getBoidsInAdjacentCellsByKey(spatialKey) {
        // Initialize an array to hold all nearby boids
        let nearbyBoids = [];
    
        // Parse the spatialKey to get x, y, z indices of the cell
        const [x, y, z] = spatialKey.split("_").map(Number);
    
        // Iterate over the target cell and its adjacent cells in all directions
        for (let i = -1; i <= 1; i++) {
            for (let j = -1; j <= 1; j++) {
                for (let k = -1; k <= 1; k++) {
                    // Calculate the key for the current adjacent cell
                    const adjacentKey = this._cellKey(x + i, y + j, z + k);
                    
                    // If the cell exists, add its boids to the nearbyBoids array
                    if (this.cells[adjacentKey]) {
                        nearbyBoids = nearbyBoids.concat(this.cells[adjacentKey]);
                    }
                }
            }
        }
    
        // Return the aggregated list of boids from the adjacent cells
        return nearbyBoids;
    }

    clear() {
        // Reset the cells object, effectively clearing the grid.
        this.cells = {};
    }
  }

 
