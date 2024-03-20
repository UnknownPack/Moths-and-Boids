import * as THREE from 'three';

export class EnvironmentGenerator{
    constructor(scene) {
        this.scene = scene;

        this.material_ground = new THREE.MeshPhongMaterial({
            color: 0xD2B48C,
            flatShading: true,
            side: THREE.DoubleSide,
        }); 
        this.geometry_ground = new THREE.PlaneGeometry(1, 1, 32, 32);
    }
    generateGround(width,height){
        var ground = new THREE.Mesh(this.geometry_ground,this.material_ground);
        ground.scale.set(width, height);
        ground.rotation.x = Math.PI/2;
        ground.position.y = -1;
        this.scene.add(ground);
    }
    generateEnvironment(){

    }
    clear(){

    }
}