import * as THREE from 'three';
//import { OrbitControls } from './build/controls/OrbitControls.js';
import { EnvironmentGenerator } from './EnvironmentGenerator.js';
import { InteractionHandler } from './InteractionHandler.js';


var scene = new THREE.Scene( );
var ratio = window.innerWidth/window.innerHeight;
//create the perspective camera
//for parameters see https://threejs.org/docs/#api/cameras/PerspectiveCamera
var camera = new THREE.PerspectiveCamera(45,ratio,0.1,1000);
camera.position.set(0,0,15);
camera.lookAt(0,0,1);

// Creates lightning environment
var ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
scene.add(ambientLight);
var directionalLight = new THREE.DirectionalLight(0xffffff, 1);
directionalLight.position.set(0,30,0);
scene.add(directionalLight);

// Creates the renderer
var renderer = new THREE.WebGLRenderer( );
renderer.setSize(window.innerWidth,window.innerHeight);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
document.body.appendChild(renderer.domElement );

// Generates the environment
var environment = new EnvironmentGenerator(scene);
//environment.generateGround(100,100);
var filepath = 'models/american_style_house/scene.gltf';
var filepath2 = 'models/forest_house/scene.gltf';
environment.loadGLTFEnvironmentModel(filepath);
var filepath3 = 'models/Campfire.obj';
//environment.loadOBJEnvironmentModel(filepath2);

// TODO change to light source

// creates a cube as a temporary reference for interaction 
const cube_geometry = new THREE.BoxGeometry();
const cube_material = new THREE.MeshPhongMaterial({ color: 0xff0000, transparent: true });
const cube = new THREE.Mesh(cube_geometry, cube_material);
cube.position.y = 2;

// Makes cube draggable
const interactionHandler = new InteractionHandler(camera, renderer);
interactionHandler.addDragObject(cube);
scene.add(cube);


function ClearScene()
{
  for (let i = scene.children.length - 1; i >= 0; i--)
    if(scene.children[i].type == "Mesh")
        scene.remove(scene.children[i]);
}

function CreateTransfMatrices()
{
}

function CreateScene()
{
  CreateTransfMatrices();

  //create a xyz axis
  const axesHelper = new THREE.AxesHelper( 5 );
  scene.add( axesHelper );
}

//////////////
// CONTROLS //
//////////////

// move mouse and: left   click to rotate,
//                 middle click to zoom,
//                 right  click to pan
// add the new control and link to the current camera to transform its position

// var controls = new OrbitControls( camera, renderer.domElement );

//final update loop
var MyUpdateLoop = function ( )
{
//ClearScene(); 

CreateScene();

renderer.render(scene,camera);

// controls.update();

requestAnimationFrame(MyUpdateLoop);

};

requestAnimationFrame(MyUpdateLoop);

//keyboard functions, change parameters values
function handleKeyDown(event) {
  if (event.keyCode === 39)
  {
    ClearScene();
    n++;
    CreateScene();
  }
  if (event.keyCode === 37)
  {
    ClearScene();
    n--;
    n=Math.max(n,5);
    CreateScene();
  }
  if (event.keyCode === 32)
  {
    reverse=!reverse;
  }
}

//add keyboard listener
window.addEventListener('keydown', handleKeyDown, false);

//this fucntion is called when the window is resized
var MyResize = function ( )
{
var width = window.innerWidth;
var height = window.innerHeight;
renderer.setSize(width,height);
camera.aspect = width/height;
camera.updateProjectionMatrix();
renderer.render(scene,camera);
};

//link the resize of the window to the update of the camera
window.addEventListener( 'resize', MyResize);