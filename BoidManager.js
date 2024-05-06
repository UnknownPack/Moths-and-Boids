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
        this.obstacles = obstacles;

        this.velocity = velocity;
        this.maxSpeed = maxSpeed;
        this.maxForce = maxForce;
        this.searchRadius = searchRadius;
        this.lightPoint = null;
        this.lightAttraction = lightAttraction;
        this.spawnRadius = spawnRadius;
        this.minDistance_toLight = 5;
        this.targetMinDistance_toLight = this.getRandomInt(3, 10); // Initializing with a random target initially

        const gridSize = new THREE.Vector3(30, 30, 30);
        const cellSize = 4;
        this.grid = new spatialGrid(gridSize, cellSize);

        const gltfLoader = new GLTFLoader();
        gltfLoader.load('./models/Moth/moth.gltf', (gltf) => {
            gltf.scene.traverse((child) => {
                if (child.isMesh) {
                    child.material = new THREE.MeshPhongMaterial({
                        color: 0x808080
                    });
                    this.mothGeometry = child.geometry;
                    this.mothMaterial = child.material;
                    this.makeBoids();
                }
            });
        }, null, (error) => {
            console.error('An error happened during GLTF loading:', error);
        });
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
        console.log(this.lightPoint);
        this.grid.clear();
        for (const boid of this.boids) {
            this.grid.insertBoidAtPosition(boid, boid.givePos());
        }

        // Update the minDistance_toLight to interpolate towards the targetMinDistance_toLight
        this.minDistance_toLight += (this.targetMinDistance_toLight - this.minDistance_toLight) * 0.1; // Interpolation rate of 10%

        for (const boid of this.boids) {
            const spatialKey = boid.giveSpatialKey();
            const nearbyBoids = this.grid.getBoidsInAdjacentCellsByKey(spatialKey);

            const lightAttractionForce = boid.attractionToLight();
            const avoidanceForce = boid.avoidanceBehaviour(nearbyBoids);
            const randomMovement = new THREE.Vector3(
                this.getRandomFloat(0.01, 1),
                this.getRandomFloat(0.01, 1),
                this.getRandomFloat(0.01, 1)
            ).normalize().multiplyScalar(0.1);

            const distanceToLight = boid.position.distanceTo(this.lightPoint);

            if (distanceToLight > this.minDistance_toLight) {
                boid.applyForce(lightAttractionForce, deltaTime);
            } else if (distanceToLight <= this.minDistance_toLight) {
                const repulsionForce = lightAttractionForce.clone().negate();
                boid.applyForce(repulsionForce, deltaTime);
            }
            boid.applyForce(avoidanceForce, deltaTime);

            boid.update();
            boid.boieRender();
        }

        // Optionally update targetMinDistance_toLight randomly at some intervals
        if (Math.random() < 0.1) { // 10% chance to update the target distance every update
            this.targetMinDistance_toLight = this.getRandomInt(3, 10);
        }
    }

    setLightPoint(lightPoint) {
        this.lightPoint = lightPoint;
        for (const boid of this.boids) {
            boid.setLightPoint(lightPoint);
        }
    }

    addObjectToGrid(object) {
        this.otherObjects.add(object);
    }

    getRandomInt(min, max) {
        return Math.floor(Math.random() * (max - min + 1)) + min;
    }

    getRandomFloat(min, max) {
        return Math.random() * (max - min) + min;
    }
}

 