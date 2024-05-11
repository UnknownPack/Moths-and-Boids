import * as THREE from 'three';
import { Boid } from './Boid.js'; 
import { spatialGrid } from './SpatialPartition.js'; 
import { OBJLoader } from './build/loaders/OBJLoader.js';
import { MTLLoader } from './build/loaders/MTLLoader.js';
import { GLTFLoader } from './build/loaders/GLTFLoader.js';
import { obstacle } from './obstacle.js'; 


export class BoidManager {
    constructor(numberOfBoids, velocity, maxSpeed, maxForce, searchRadius, lightAttraction, spawnRadius, scene) {
        this.numberOfBoids = numberOfBoids;
        this.scene = scene;
        this.boids = [];
        this.obstacles = [];
        this.velocity = velocity;
        this.maxSpeed = maxSpeed;
        this.maxForce = maxForce;
        this.searchRadius = searchRadius;
        this.lightPoint = null;
        this.lightAttraction = lightAttraction;
        this.spawnRadius = spawnRadius;
        this.minDistance_toLight = 2.5;
        this.targetMinDistance_toLight = this.getRandomInt(3, 10); // Initializing with a random target initially

        const gridSize = new THREE.Vector3(30, 30, 30);
        const cellSize = 3;
        this.grid = new spatialGrid(gridSize, cellSize);

        const gltfLoader = new GLTFLoader();
        gltfLoader.load('./models/Moth/mothfast.gltf', (gltf) => {
            gltf.scene.traverse((child) => {
                if (child.isMesh) {
                    child.material = new THREE.MeshPhongMaterial({
                        color: 0x808080
                    });
                    this.mothGeometry = child.geometry;
                    this.mothMaterial = child.material;
                    this.makeBoids();
                    //this.initializeObstacles();
                }
            });
        }, null, (error) => {
            console.error('An error happened during GLTF loading:', error);
        });
        
    }

    initializeObstacles() {
        const num_OfObstacles = 15;
        for (let i = 0; i < num_OfObstacles; i++) {
            let pos = new THREE.Vector3(this.getRandomFloat(-7, 7), this.getRandomFloat(-7, 7), this.getRandomFloat(-7, 7));
            let newObstacle = new obstacle(pos, this.scene);
            this.obstacles.push(newObstacle);
            this.grid.insertBoidAtPosition(newObstacle, newObstacle.givePos());
        }
    }

    makeBoids() {
        for (let i = 0; i < this.numberOfBoids; i++) {
            let spawnPosition = new THREE.Vector3(
                this.getRandomInt(-this.spawnRadius, this.spawnRadius),
                this.getRandomInt(-this.spawnRadius, this.spawnRadius),
                this.getRandomInt(-this.spawnRadius, this.spawnRadius)
            );

            const boidVelocity = new THREE.Vector3(
                this.getRandomFloat(-this.velocity, this.velocity),
                this.getRandomFloat(-this.velocity, this.velocity),
                this.getRandomFloat(-this.velocity, this.velocity)
            ).normalize().multiplyScalar(this.maxSpeed);

            let searhR = this.getRandomInt(-this.searchRadius, this.searchRadius)

            const boid = new Boid(spawnPosition, boidVelocity, this.maxSpeed, this.maxForce, searhR, this.lightPoint, this.lightAttraction, this.scene, this.mothGeometry, this.mothMaterial);

            this.boids.push(boid);
        }
    }

    updateBoids(deltaTime) {
        //console.log(this.lightPoint);
        this.grid.clear();
        for (const boid of this.boids) {
            this.grid.insertBoidAtPosition(boid, boid.givePos());
        }

        // Update the minDistance_toLight to interpolate towards the targetMinDistance_toLight
        this.minDistance_toLight += (this.targetMinDistance_toLight - this.minDistance_toLight) * 0.1; // Interpolation rate of 10%

        for (const boid of this.boids) {
            const position =boid.givePos();
            const xIndex = Math.floor(position.x / this.grid.cellSize);
                const yIndex = Math.floor(position.y / this.grid.cellSize);
                const zIndex = Math.floor(position.z / this.grid.cellSize);

                // Generate the spatial key using the indices
                const spatialKey = this.grid._cellKey(xIndex, yIndex, zIndex);
            const nearbyBoids = this.grid.getBoidsInAdjacentCellsByKey(spatialKey);

            const lightAttractionForce = boid.attractionToLight();
            const avoidanceForce = boid.avoidanceBehaviour(nearbyBoids);
            console.log(avoidanceForce);
            const randomMovement = new THREE.Vector3(
                this.getRandomFloat(0.01, 1),
                this.getRandomFloat(0.01, 1),
                this.getRandomFloat(0.01, 1)
            ).normalize().multiplyScalar(0.1);

            const distanceToLight = boid.position.distanceTo(this.lightPoint);
            if (distanceToLight > this.minDistance_toLight) {
                if (!boid.run) {
                    boid.applyForce(lightAttractionForce, deltaTime);
                }
            } else {
                if (!boid.run) {
                    boid.run = true;
                    var repulsionForce = lightAttractionForce.clone().negate();
                    repulsionForce.x+= getRandomFloat(-2, 2);
                    repulsionForce.y+= getRandomFloat(-2, 2);
                    repulsionForce.z+= getRandomFloat(-2, 2);
                    boid.runDistance = boid.position.clone().add(repulsionForce); // Update the target run distance
                    boid.applyForce(repulsionForce, deltaTime)
                }
            }
    
            if (boid.position.distanceTo(this.lightPoint) < 7) {
                boid.run = false; // Reset running state when close to the run distance
            }

            boid.update();
            boid.boieRender();
        }

        // Optionally update targetMinDistance_toLight randomly at some intervals
        if (Math.random() < 0.1) { // 10% chance to update the target distance every update
            this.targetMinDistance_toLight = this.getRandomInt(3, 10);
        }

        for (const obstacle of this.obstacles){
            this.grid.insertBoidAtPosition(obstacle, obstacle.position);
        }
        console.log(this.obstacles.length);
    }
    

    

    setLightPoint(lightPoint) {   
        this.lightPoint = lightPoint;
        for (const boid of this.boids) {
            //var x = this.getRandomFloat(0, 3);
            //var y = this.getRandomFloat(0, 3);
            //var z = this.getRandomFloat(0, 3);
            //var futurePower = new Vector3(x, y, z);
            ///var boidLightPoint = lightPoint.copy();  
            //boidLightPoint.add(futurePower);  
            //this.lightPoint
            boid.setLightPoint(lightPoint);
        }
    }

    getLightPoint(){
        return this.lightPoint;
    }

    setObstacleList(obstacles){
        this.obstacles = obstacles;
    }

    insertObstacle(obj){
        this.grid.insertBoidAtPosition(obj, obj.position)
    }

    getRandomInt(min, max) {
        return Math.floor(Math.random() * (max - min + 1)) + min;
    }

    getRandomFloat(min, max) {
        return Math.random() * (max - min) + min;
    }
}

 