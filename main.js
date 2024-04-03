import * as THREE from 'three';
import { OrbitControls } from './build/controls/OrbitControls.js';
import { EnvironmentGenerator } from './EnvironmentGenerator.js';
import { InteractionHandler } from './InteractionHandler.js';
import { BoidManager } from './BoidManager.js';

// GRAPHICS CONST
let camera, controls, scene, renderer;
// PHYSICS CONST
const margin = 0.05;

// Inits physics environment
Ammo().then(function (AmmoLib) {

  Ammo = AmmoLib;

  init();
  animate();

});

function init() {

  initGraphics();
  initPhysics();
  createObjects();
  initInput();

}

function initGraphics() {
  scene = new THREE.Scene();
  var ratio = window.innerWidth / window.innerHeight;
  //create the perspective camera
  //for parameters see https://threejs.org/docs/#api/cameras/PerspectiveCamera
  camera = new THREE.PerspectiveCamera(45, ratio, 0.1, 1000);
  camera.position.set(0, 0, 15);
  camera.lookAt(0, 0, 1);

  // Creates lightning environment
  var ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
  scene.add(ambientLight);
  var directionalLight = new THREE.DirectionalLight(0xffffff, 1);
  directionalLight.position.set(0, 30, 0);
  scene.add(directionalLight);

  // Creates the renderer
  renderer = new THREE.WebGLRenderer();
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  document.body.appendChild(renderer.domElement);

  //////////////
  // CONTROLS //
  //////////////

  // move mouse and: left   click to rotate,
  //                 middle click to zoom,
  //                 right  click to pan
  // add the new control and link to the current camera to transform its position

  controls = new OrbitControls(camera, renderer.domElement);
}

function createObjects() {
  // ENVIRONMENT
  // Generates the environment
  var environment = new EnvironmentGenerator(scene);
  //environment.generateGround(100,100);

  var filepath = 'models/american_style_house/scene.gltf';
  var filepath2 = 'models/forest_house/scene.gltf';
  environment.loadGLTFEnvironmentModel(filepath);
  var filepath3 = 'models/Campfire.obj';
  //environment.loadOBJEnvironmentModel(filepath2);

  // LIGHTBULB
  const pos = new THREE.Vector3();
  const quat = new THREE.Quaternion();
  const bulbMass = 1.2;
  const bulbRadius = 0.6;
  // TODO change to light model
  // creates a sphere as a temporary reference for light bulb interaction 
  const lightbulb_geometry = new THREE.SphereGeometry(bulbRadius);
  const lightbulb_material = new THREE.MeshPhongMaterial({ color: 0xfddc5c, transparent: true });
  const lightbulb = new THREE.Mesh(lightbulb_geometry, lightbulb_material);
  lightbulb.name = "lightbulb";
  lightbulb.position.y = 1;
  lightbulb.position.z = 3;
  const bulbShape = new Ammo.btSphereShape(bulbRadius);
  bulbShape.setMargin(margin);
  createRigidBody(lightbulb, bulbShape, bulbMass, pos, quat);
  lightbulb.userData.physicsBody.setFriction(0.5);


  // creates the pointlight of the swinging light
  const light = new THREE.PointLight(0xfddc5c, 1, 100);
  lightbulb.add(light);

  // Makes lightbulb draggable
  const interactionHandler = new InteractionHandler(camera, renderer);
  interactionHandler.addDragObject(lightbulb);
  scene.add(lightbulb);

  // ROPE
  // creates rope graphic object
  let rope;
  const ropeNumSegments = 10;
  const ropeLength = 4;
  const ropeMass = 3;
  const ropePos = lightbulb.position;
  ropePos.y += bulbRadius;

  const segmentLength = ropeLength / ropeNumSegments;
  const ropeGeometry = new THREE.BufferGeometry();
  const ropeMaterial = new THREE.LineBasicMaterial({ color: 0xffffff });
  const ropePositions = [];
  const ropeIndices = [];

  for (let i = 0; i < ropeNumSegments + 1; i++) {

    ropePositions.push(ropePos.x, ropePos.y + i * segmentLength, ropePos.z);

  }

  for (let i = 0; i < ropeNumSegments; i++) {

    ropeIndices.push(i, i + 1);

  }

  ropeGeometry.setIndex(new THREE.BufferAttribute(new Uint16Array(ropeIndices), 1));
  ropeGeometry.setAttribute('position', new THREE.BufferAttribute(new Float32Array(ropePositions), 3));
  ropeGeometry.computeBoundingSphere();
  rope = new THREE.LineSegments(ropeGeometry, ropeMaterial);
  rope.castShadow = true;
  rope.receiveShadow = true;
  scene.add(rope);
}

function initInput() {
  // create new raycaster to track position of mouse
  var mouse = new THREE.Vector2;
  var raycaster = new THREE.Raycaster();
  var selectedObj = false;
}

function ClearScene() {
  for (let i = scene.children.length - 1; i >= 0; i--)
    if (scene.children[i].type == "Mesh")
      scene.remove(scene.children[i]);
}

function CreateTransfMatrices() {
}

function CreateScene() {
  CreateTransfMatrices();

  //create a xyz axis
  const axesHelper = new THREE.AxesHelper(5);
  scene.add(axesHelper);
}

// create a rigidbody for phaysics application
function createRigidBody(threeObject, physicsShape, mass, pos, quat) {

  threeObject.position.copy(pos);
  threeObject.quaternion.copy(quat);

  const transform = new Ammo.btTransform();
  transform.setIdentity();
  transform.setOrigin(new Ammo.btVector3(pos.x, pos.y, pos.z));
  transform.setRotation(new Ammo.btQuaternion(quat.x, quat.y, quat.z, quat.w));
  const motionState = new Ammo.btDefaultMotionState(transform);

  const localInertia = new Ammo.btVector3(0, 0, 0);
  physicsShape.calculateLocalInertia(mass, localInertia);

  const rbInfo = new Ammo.btRigidBodyConstructionInfo(mass, motionState, physicsShape, localInertia);
  const body = new Ammo.btRigidBody(rbInfo);

  threeObject.userData.physicsBody = body;

  scene.add(threeObject);

  if (mass > 0) {

    rigidBodies.push(threeObject);

    // Disable deactivation
    body.setActivationState(4);

  }

  physicsWorld.addRigidBody(body);

}

// If click on cube, drag cube, otherwise change view
function onDocumentMouseDown(event) {
  mouse.x = (event.clientX / renderer.domElement.clientWidth) * 2 - 1;
  mouse.y = - (event.clientY / renderer.domElement.clientHeight) * 2 + 1;
  raycaster.setFromCamera(mouse, camera);

  var intersects = raycaster.intersectObjects(scene.children, false);

  if (intersects.length > 0 && (intersects[0].object.name == "lightbulb")) {
    selectedObj = true;
    controls.enabled = false;
  }
}
function onDocumentMouseUp(event) {
  if (selectedObj) {
    selectedObj = false;
    controls.enabled = true;
  }
}
document.addEventListener('mousedown', onDocumentMouseDown, false);
document.addEventListener('mouseup', onDocumentMouseUp, false);

//////////////
//  Boids   //
//////////////

// Create boid manager
//these paramters can be changed
const numberOfBoids = 1000;
const obstacles = [];
const velocity = 0.1;
const maxSpeed = 0.1;
const maxForce = 0.1;
const searchRadius = 3;
// change lightPoint Vector3 to lightbulb
const lightPoint = new THREE.Vector3(0, 15, 0);
const lightAttraction = 100;
const spawnRadius = 10;
const boidManager = new BoidManager(numberOfBoids, obstacles, velocity, maxSpeed, maxForce, searchRadius, lightAttraction, spawnRadius, scene);

//final update loop
var clock = new THREE.Clock();
var MyUpdateLoop = function () {
  CreateScene();
  renderer.render(scene, camera);
  var deltaTime = clock.getDelta();
  //insert in method bellow, another method that returns the position of the light
  boidManager.setLightPoint(lightPoint);
  boidManager.updateBoids(deltaTime);


  //controls.update(); 

  requestAnimationFrame(MyUpdateLoop);
};

requestAnimationFrame(MyUpdateLoop);

//keyboard functions, change parameters values
function handleKeyDown(event) {
  if (event.keyCode === 39) {
    ClearScene();
    n++;
    CreateScene();
  }
  if (event.keyCode === 37) {
    ClearScene();
    n--;
    n = Math.max(n, 5);
    CreateScene();
  }
  if (event.keyCode === 32) {
    reverse = !reverse;
  }
}

//add keyboard listener
window.addEventListener('keydown', handleKeyDown, false);

//this fucntion is called when the window is resized
var MyResize = function () {
  var width = window.innerWidth;
  var height = window.innerHeight;
  renderer.setSize(width, height);
  camera.aspect = width / height;
  camera.updateProjectionMatrix();
  renderer.render(scene, camera);
};

//link the resize of the window to the update of the camera
window.addEventListener('resize', MyResize);