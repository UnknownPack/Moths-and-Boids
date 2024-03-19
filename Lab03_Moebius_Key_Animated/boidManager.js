import Boid from './boids';  

class BoidManager {
    
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

            const boid = new Boid(spawnPosition, this.velocity, this.maxSpeed, 
                                    this.maxForce, this.searchRadius, 
                                    this.lightPoint, this.lightAttraction, this.scene);

            this.boids.push(boid);
        }
    }

    update() {
        for (const boid of this.boids) {
            this.obstacles.push(boid);
        }

        for (const boid of this.boids) {
            const lightAttractionForce = boid.attractionToLight();
            const avoidanceForce = boid.avoidanceBehaviour(this.obstacles);
            boid.update();
        }
    }

    render() { 
        for (const boid of this.boids) {
            boid.render();
        }
    }

    getRandomInt(min, max) {
        return Math.floor(Math.random() * (max - min + 1)) + min;
    }


}
export default BoidManager;