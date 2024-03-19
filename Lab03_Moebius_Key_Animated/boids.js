import * as THREE from 'three';

class Boid{

    constructor(position, velocity, maxSpeed, maxForce, searchRadius, lightPoint, lightAttraction) {
        this.position = position; 
        this.velocity = velocity; 
        this.maxSpeed = maxSpeed; 
        this.maxForce = maxForce; 
        this.lightPoint = lightPoint;  
        this.lightAttraction = lightAttraction;
        this.searchRadius = searchRadius; 
    }

    update(){
        
    }

    render(){
        
    }


    attractionToLight(){

    }

    avoidanceBehaviour(){
        let avoidanceForce = new THREE.Vector3();
    }

}