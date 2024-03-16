import * as THREE from 'three';

class Boid{

    constructor(position, velocity, maxSpeed, maxForce, searchRadius, attractionPoint, attractionForce) {
        this.position = position; 
        this.velocity = velocity; 
        this.maxSpeed = maxSpeed; 
        this.maxForce = maxForce; 
        this.attractionPoint = attractionPoint; 
        this.attractionForce = attractionForce;
        this.searchRadius = searchRadius; 
    }

    attract_To_Light(){

    }

    avoidance_Behaviour(){
        
    }
}