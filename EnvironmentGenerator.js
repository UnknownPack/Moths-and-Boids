import * as THREE from 'three';
import { PLYLoader } from './build/loaders/PLYLoader.js';
import { GLTFLoader } from './build/loaders/GLTFLoader.js';
import { OBJLoader } from './build/loaders/OBJLoader.js';
import { Sky } from './build/environment/Sky.js';
//import { ShaderChunk} from './build/shaders/ShaderChunk.js';

export class EnvironmentGenerator {
    constructor(scene, house) {
        this.scene = scene;
        this.material_ground = new THREE.MeshPhongMaterial({
            color: 0xD2B48C,
            flatShading: true,
            side: THREE.DoubleSide,
        });
        this.geometry_ground = new THREE.PlaneGeometry(1, 1, 32, 32);
        this.houseMesh = null;
        this.loadNewHouse(house);
    }

    generateGround(width, height) {
        var ground = new THREE.Mesh(this.geometry_ground, this.material_ground);
        ground.scale.set(width, height);
        ground.rotation.x = Math.PI / 2;
        ground.position.y = -1;
        this.scene.add(ground);
    }
    /*
        generateSky(scene){       
            let sky = new Sky();
            sky.scale.setScalar( 450000 );
            this.scene.add(sky);
        }*/

    loadOBJEnvironmentModel(filePath) {
        var loader = new OBJLoader();
        loader.load(filePath, (obj) => {
            this.scene.add(obj);
            obj.traverse(function (child) {
                if (child instanceof THREE.Mesh) {
                    console.log(child);
                    //flame,flame1,flame4,flame5,flame6
                    //log,log1,log2,log4
                    //rock1,2,3,4,5,6,7,8,9,10,11,12,13
                }
            });
        });
    }

    loadNewHouse(house) {
        if (this.houseMesh) {
            console.log("REMOVE " + this.houseMesh);
            this.scene.remove(this.houseMesh);
            this.houseMesh.traverse((child) => {
                if (child.isMesh) {
                    child.geometry.dispose();
                    child.material.dispose();
                }
            });
            console.log("removed old house");
            this.houseMesh = null;
        }

        let filePath = 'models/american_style_house/scene.gltf';
        if (house === 'foresthouse') {
            filePath = 'models/forest_house/scene.gltf'
        }

        // Load the new house and set it to this.houseMesh
        this.loadGLTFEnvironmentModel(filePath).then((houseMesh) => {
            this.houseMesh = houseMesh;
        });
    }

    loadGLTFEnvironmentModel(filePath) {
        return new Promise((resolve, reject) => {
            const loader = new GLTFLoader();
            loader.load(filePath, (gltf) => {
                const houseMesh = gltf.scene;

                const boundingBox = new THREE.Box3().setFromObject(houseMesh);
                const center = boundingBox.getCenter(new THREE.Vector3());
                const size = boundingBox.getSize(new THREE.Vector3());

                const sca = new THREE.Matrix4();
                const tra = new THREE.Matrix4();
                const rot = new THREE.Matrix4();
                const combined = new THREE.Matrix4();

                tra.makeTranslation(-center.x - 150, -center.y + 80, -center.z);
                if (filePath === 'models/american_style_house/scene.gltf') {
                    sca.makeScale(150 / size.length(), 150 / size.length(), 150 / size.length());
                    tra.makeTranslation(-center.x - 150, -center.y + 80, -center.z);
                    rot.makeRotationY(270 * Math.PI / 180);
                    combined.multiply(rot);
            
                    this.loadGLTFEnvironmentModel('models/low_poly_wood_fence_on_grass/scene.gltf');
                    this.loadGLTFEnvironmentModel('models/stylized_bush/scene.gltf');

                } else if(filePath == 'models/forest_house/scene.gltf'){
                    sca.makeScale(200/size.length(),200/size.length(),200/size.length());           
                    rot.makeRotationY(90*Math.PI/180);
                    tra.makeTranslation (-center.x,-center.y,-center.z);
                    tra.makeTranslation(0.050,-0.030,0.01);
                    combined.multiply(rot);
                    console.log("forest");
                    gltf.scene.traverse(function (child) {
                        if (child.isMesh && child.material instanceof THREE.MeshBasicMaterial) {
                            child.material = new THREE.MeshPhongMaterial({
                                color: child.material.color,
                                map: child.material.map,  // Preserve the texture if any
                                opacity: child.material.opacity,
                                transparent: child.material.transparent
                            });
                            child.castShadow = true;
                            child.receiveShadow = true;
                        }
                    });
                } else if(filePath == 'models/low_poly_wood_fence_on_grass/scene.gltf'){
                    sca.makeScale(300/size.length(),300/size.length(),300/size.length());
                    tra.makeTranslation (-center.x,-center.y-10,-center.z-50);
        
                } else if(filePath == 'models/stylized_bush/scene.gltf'){
                    sca.makeScale(25/size.length(),25/size.length(),25/size.length());
                    tra.makeTranslation (-center.x-5,-1.7,-center.z);
                }

                combined.multiply(sca);
                combined.multiply(tra);
                houseMesh.applyMatrix4(combined);
                this.scene.add(houseMesh);

                resolve(houseMesh);
            }, undefined, (error) => {
                reject(error);
            });
        });
    }

    loadPLYEnvironmentModel() {
        var loader = new PLYLoader();
        var mesh = null;
        loader.load('models/pieta.ply', (geometry) => {
            var material = new THREE.MeshPhongMaterial();
            material.color = new THREE.Color(0.8, 1, 1);
            material.wireframe = false;
            material.shininess = 100;

            geometry.computeVertexNormals();
            mesh = new THREE.Mesh(geometry, material);

            geometry.computeBoundingBox();

            var center = new THREE.Vector3();
            var size = new THREE.Vector3();
            geometry.boundingBox.getCenter(center);
            geometry.boundingBox.getSize(size);
            var min = geometry.boundingBox.min;

            var sca = new THREE.Matrix4();
            var tra = new THREE.Matrix4();
            var combined = new THREE.Matrix4();

            sca.makeScale(20 / size.length(), 20 / size.length(), 20 / size.length());
            tra.makeTranslation(-center.x, -center.y, -center.z);
            combined.multiply(sca);
            combined.multiply(tra);

            mesh.applyMatrix4(combined);

            this.scene.add(mesh);
        });
    }


    clear() {

    }
}