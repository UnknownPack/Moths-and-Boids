import * as THREE from 'three';
import { PLYLoader } from './build/loaders/PLYLoader.js';
import {GLTFLoader} from './build/loaders/GLTFLoader.js';
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

    loadGLTFEnvironmentModel(){
    var loader = new GLTFLoader();
    loader.load('models/american_style_house/scene.gltf', (gltf) => {
        //var material = new THREE.MeshPhongMaterial();
        var houseMesh = gltf.scene;

        var boundingBox = new THREE.Box3().setFromObject(houseMesh);
        var center = boundingBox.getCenter(new THREE.Vector3());
        var size = boundingBox.getSize(new THREE.Vector3());

        var sca = new THREE.Matrix4();
        var tra = new THREE.Matrix4();
        var rot = new THREE.Matrix4();
        var combined = new THREE.Matrix4();

        sca.makeScale(10/size.length(),10/size.length(),10/size.length());
        tra.makeTranslation (-center.x,-center.y,-center.z);
        rot.makeRotationY(270*Math.PI/180);
        combined.multiply(rot);
        combined.multiply(sca);     
        combined.multiply(tra);
        houseMesh.applyMatrix4(combined);
        
        this.scene.add(houseMesh);
    });

    }

    loadPLYEnvironmentModel(){
    //MESH LOADING
    var loader = new PLYLoader();
    var mesh = null;
    loader.load('models/pieta.ply', ( geometry )=>{
        var material = new THREE.MeshPhongMaterial();
        material.color= new THREE.Color(0.8,1,1);
        material.wireframe=false;
        material.shininess=100;

        geometry.computeVertexNormals();
        mesh = new THREE.Mesh( geometry, material );

        geometry.computeBoundingBox();

        var center = new THREE.Vector3();
        var size = new THREE.Vector3();
        geometry.boundingBox.getCenter(center);
        geometry.boundingBox.getSize(size);
        var min = geometry.boundingBox.min;

        var sca = new THREE.Matrix4();
        var tra = new THREE.Matrix4();
        var combined = new THREE.Matrix4();

        sca.makeScale(20/size.length(),20/size.length(),20/size.length());
        tra.makeTranslation (-center.x,-center.y,-center.z);
        combined.multiply(sca);
        combined.multiply(tra);

        mesh.applyMatrix4(combined);

        this.scene.add( mesh );
    });
    }


    clear(){

    }
}