import * as THREE from 'three';

export class landingSpace{
    constructor(position, radius){
        this.position = position;
        this.mesh = mesh;
        this.radiusToAttract = radius;

        this.landedMoths = [];
        this.rotationOfLanding = new THREE.Quaternion();
    }
}