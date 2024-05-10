import * as THREE from 'three';

export class obstacle{

    constructor(position, scene){
        this.position=position
            
        const sphereGeometry = new THREE.SphereGeometry(1, 32, 32);
        const sphereMaterial = new THREE.MeshPhongMaterial({ color: 0xff0000 }); // Red color
        const sphere = new THREE.Mesh(sphereGeometry, sphereMaterial);
        scene.add(sphere);
        sphere.position.copy(this.position);

        // Create a red point light
        const pointLight = new THREE.PointLight(0xff0000, 1, 10); // Red color, intensity 1, distance 10
        scene.add(pointLight);

        // Position the point light at the center of the sphere
        sphere.add(pointLight); // Add the light as a child of the sphere
        pointLight.position.copy(this.position);

    }

    givePos(){
        return this.position;
    }

}