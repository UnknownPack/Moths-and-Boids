import * as THREE from 'three';
import { Boid } from './Boid.js'; 
import { mothEater } from './mothEater.js';
import { spatialGrid } from './SpatialPartition.js'; 
import { OBJLoader } from './build/loaders/OBJLoader.js';
import { MTLLoader } from './build/loaders/MTLLoader.js';
import { GLTFLoader } from './build/loaders/GLTFLoader.js';

export class BoidManager {
    constructor(numberOfBoids, obstacles, velocity, maxSpeed, maxForce, searchRadius, lightAttraction, spawnRadius, scene) {
        this.numberOfBoids = numberOfBoids;
        this.scene = scene;
        this.boids = [];
        this.mothEaters = [];
        this.obstacles = obstacles;
        this.mothCount = this.numberOfBoids;
        this.velocity = velocity;
        this.maxSpeed = maxSpeed;
        this.maxForce = maxForce;
        this.searchRadius = searchRadius;
        this.lightPoint = null;
        this.lightAttraction = lightAttraction;
        this.spawnRadius = spawnRadius;
        this.minDistance_toLight = 1.5;
        this.targetMinDistance_toLight = this.getRandomInt(3, 10); // Initializing with a random target initially

        const gridSize = new THREE.Vector3(30, 30, 30);
        const cellSize = 0.5;
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
                }
            });
        }, null, (error) => {
            console.error('An error happened during GLTF loading:', error);
        });

        ///////////////////////////////////////////////////////////

        const mtlLoader = new MTLLoader();
        mtlLoader.load('models/mothEater/flyer/VAMP_BAT.MTL', (materials) => {
            materials.preload();

            const objLoader = new OBJLoader();
            objLoader.setMaterials(materials);
            objLoader.load('models/mothEater/flyer/VAMP_BAT.OBJ', (obj) => {
                obj.traverse((child) => {
                    if (child.isMesh) {
                        this.mothEaterOBJ = child.geometry;
                        this.mothEaterMAT = child.material; 
                        this.mothEaterMAT.color.set(0x000000);
                        
                    }
                });
            }, null, (error) => {
                console.error('An error happened during OBJ loading:', error);
            });
        }, null, (error) => {
            console.error('An error happened during MTL loading:', error);
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
            const boid = new Boid(spawnPosition, boidVelocity, this.maxSpeed, this.maxForce, this.searchRadius, this.lightPoint, this.lightAttraction, this.scene, this.mothGeometry, this.mothMaterial);

            this.boids.push(boid);
        }
    }

    updateBoids(deltaTime) { 
        var flyAway = false;
        this.grid.clear();
        for (const boid of this.boids) {
            this.grid.insertBoidAtPosition(boid, boid.givePos());
            let boidSpecialKey = this.grid._cellKey(boid.position.x, boid.position.y, boid.position.z);
            boid.updateSpatialKey(boidSpecialKey);
        } 

        for (const mothEater of this.mothEaters) {
            this.grid.insertBoidAtPosition(mothEater, mothEater.givePos());
            let mothEaterSpacialKey = this.grid._cellKey(mothEater.position.x, mothEater.position.y, mothEater.position.z);
            mothEater.updateSpatialKey(mothEaterSpacialKey);
        } 

        this.minDistance_toLight += (this.targetMinDistance_toLight - this.minDistance_toLight) * 0.1;  

        for (const boid of this.boids) {
            const spatialKey = boid.giveSpatialKey();
            const nearbyBoids = this.grid.getBoidsInAdjacentCellsByKey(spatialKey);

            const lightAttractionForce = boid.attractionToLight();
            const avoidanceForce = boid.avoidanceBehaviour(nearbyBoids); 
            let distanceToLight = boid.position.distanceTo(this.lightPoint);

            if (distanceToLight <= this.minDistance_toLight && !flyAway){
                flyAway = true;
            }
            if(distanceToLight>=7.5&& flyAway){
                flyAway = false;
            }
    
            if(flyAway == false){
                boid.applyForce(lightAttractionForce, deltaTime); 
            }
            else if (flyAway == true){ 
                let lightForce_Inverse = lightAttractionForce.multiplyScalar(-1);
                boid.applyForce(lightForce_Inverse, deltaTime);
            }
            boid.applyForce(avoidanceForce, deltaTime);

            boid.update();
            boid.boieRender();
        } 

        for (const mothEater of this.mothEaters){
            mothEater.update(deltaTime);
            if(!this.mothEaters.length === 0){
                decimate(mothEater.giveSpatialKey(), mothEater);
            }
        }


        if (Math.random() < 0.1) {  
            this.targetMinDistance_toLight = this.getRandomInt(3, 10);
        }
    }

    decimate(spatialKey, me) {
        if (this.grid.cells[spatialKey]) { 
            for (let i = this.grid.cells[spatialKey].length - 1; i >= 0; i--) {
                const boid = this.grid.cells[spatialKey][i];  
        
                if (boid !== me) { 
                    if (me.position.distanceTo(boid.position) <= me.eatRange) {
                        this.scene.remove(boid); 
                        boid.geometry.dispose();
                        boid.material.dispose(); 
                        this.grid.cells[spatialKey].splice(i, 1); // Remove boid from the cell array
                        console.log("ate a moth!");
                        const index = this.boids.indexOf(boid); // Also remove boid from the main boids array
                        if (index !== -1) {
                            this.boids.splice(index, 1);
                        }
        
                        console.log("Boid removed");
                    }
                }
            }
        }
    }

    spawnFlyer_mothEater(){ 
        let position = new THREE.Vector3(-5,this.lightPoint.y, 0);
        let endPos = new THREE.Vector3(5,this.lightPoint.y, 0);
        let eatRange = 3;  
        const newMothEater = new mothEater(position, position, endPos, 2, eatRange, this.mothEaterOBJ, this.mothEaterMAT, this.scene); 
        this.mothEaters.push(newMothEater);
    }

    giveMothCount(){
        return this.mothCount;
    }

    setMothCount(newMothCount){
        const previousMothCount = this.mothCount;
        this.mothCount = newMothCount;
        if(previousMothCount< this.mothCount){
            this.addMoreMoths(this.mothCount - previousMothCount);
        }
        else if (previousMothCount > this.mothCount){
            this.removeMoths(previousMothCount - this.mothCount);
        }
    }

    addMoreMoths(count) {
        for (let i = 0; i < count; i++) {
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
            const boid = new Boid(spawnPosition, boidVelocity, this.maxSpeed, this.maxForce, this.searchRadius, this.lightPoint, this.lightAttraction, this.scene, this.mothGeometry, this.mothMaterial);

            this.boids.push(boid);
        }
    }

    removeMoths(count) {
    for (let i = 0; i < count; i++) {
        if (this.boids.length != 0) {
            // Remove boid from the array
            const boidToRemove = this.boids.pop();

            // Remove boid from the scene if it exists
            if (boidToRemove && boidToRemove.boidMesh) {
                this.scene.remove(boidToRemove.boidMesh);

                // Dispose geometry and material if they exist
                if (boidToRemove.boidMesh.geometry) {
                    boidToRemove.boidMesh.geometry.dispose();
                } else {
                    console.warn('Boid geometry is undefined.');
                }

                if (boidToRemove.boidMesh.material) {
                    boidToRemove.boidMesh.material.dispose();
                } else {
                    console.warn('Boid material is undefined.');
                }

                // Remove boid from the spatial grid
                const spatialKey = boidToRemove.giveSpatialKey();
                if (this.grid.cells[spatialKey]) {
                    const index = this.grid.cells[spatialKey].indexOf(boidToRemove);
                    if (index !== -1) {
                        this.grid.cells[spatialKey].splice(index, 1);
                    }
                }

                console.log("Boid removed");
            } else {
                console.warn("Boid to remove is undefined or has no boidMesh.");
            }
        } else {
            console.warn("No more boids to remove.");
            break;
        }
    }
}

    
    
    

    setLightPoint(lightPoint) {   
        this.lightPoint = lightPoint;
        for (const boid of this.boids) {
            boid.setLightPoint(boidLightPoint);
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

    updateVelocity(velocity){
        this.velocity = velocity;
        for (const boid of this.boids) {
            boid.velocity = boid.velocity.normalize().multiplyScalar(velocity);
        }
    }

    updateLightAttraction(attraction){
        this.lightAttraction = attraction;
        for (const boid of this.boids) {
            boid.setLightAttraction(attraction);
        }
    }


}

 