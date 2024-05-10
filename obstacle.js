import * as THREE from 'three';

export class obstacle {

    constructor(position, scene) {
        this.position = position;
        this.scene = scene;
        this.spatialKey = '';
        this.lightPoint = null

        const sphereGeometry = new THREE.SphereGeometry(0.5, 32, 32);
        const sphereMaterial = new THREE.MeshPhongMaterial({ color: 0xff0000 });
        const sphere = new THREE.Mesh(sphereGeometry, sphereMaterial);
        sphere.position.copy(this.position);
        this.scene.add(sphere);

        // Simplify light addition
        const pointLight = new THREE.PointLight(0xff0000, 1, 10);
        sphere.add(pointLight); // Add the light as a child of the sphere
    }

    givePos() {
        return this.position.clone();
    }

    updateSpatialKey(spatialKey){
        this.spatialKey = spatialKey;
    } 

    giveSpatialKey(){
        return this.spatialKey;
    }   

    setLightPoint(point){
        this.lightPoint = point;
    }
}
