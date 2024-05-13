import * as THREE from 'three';
import { OrbitControls } from './build/controls/OrbitControls.js';
import { EnvironmentGenerator } from './EnvironmentGenerator.js';
import { InteractionHandler } from './InteractionHandler.js';
import { BoidManager } from './BoidManager.js';
import { GLTFLoader } from './build/loaders/GLTFLoader.js';
import {GPUComputationRenderer} from './build/misc/GPUComputationRenderer.js';
import { Sky } from './build/environment/Sky.js';

// GRAPHICS CONST
let camera, controls, renderer;
let scene = new THREE.Scene();
// PHYSICS CONST
const gravityConstant = - 9.8;
let collisionConfiguration;
let dispatcher;
let broadphase;
let solver;
let softBodySolver;
let physicsWorld;

const margin = 0.05;
const rigidBodies = [];
let hinge;
let rope;
let transformAux1;

let armMovement = 0;

let lightPoint_position = new THREE.Vector3(0, 0, 3);

// Inits physics environment
Ammo().then(function (AmmoLib) {

  Ammo = AmmoLib;

  init();
  animate();
  //requestAnimationFrame(MyUpdateLoop);

});

function init() {

  initGraphics();
  initPhysics();
  createObjects();
  initInput();
  initSky();
}

function initGraphics() {
  var ratio = window.innerWidth / window.innerHeight;
  //create the perspective camera
  camera = new THREE.PerspectiveCamera(45, ratio, 0.1, 1000);
  camera.position.set(0, 0, 100);
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
  //renderer.shadowMap.enabled = true;
  //renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.setPixelRatio(window.devicePixelRatio * 0.5); 
  //for sky 
  renderer.toneMapping = THREE.ACESFilmicToneMapping;

  document.body.appendChild(renderer.domElement);

  //////////////
  // ORBIT CONTROLS //
  //////////////

  // move mouse and: left   click to rotate,
  //                 middle click to zoom,
  //                 right  click to pan
  // add the new control and link to the current camera to transform its position
  controls = new OrbitControls(camera, renderer.domElement);
}

function initPhysics() {

  // Physics configuration

  collisionConfiguration = new Ammo.btSoftBodyRigidBodyCollisionConfiguration();
  dispatcher = new Ammo.btCollisionDispatcher(collisionConfiguration);
  broadphase = new Ammo.btDbvtBroadphase();
  solver = new Ammo.btSequentialImpulseConstraintSolver();
  softBodySolver = new Ammo.btDefaultSoftBodySolver();
  physicsWorld = new Ammo.btSoftRigidDynamicsWorld(dispatcher, broadphase, solver, collisionConfiguration, softBodySolver);
  physicsWorld.setGravity(new Ammo.btVector3(0, gravityConstant, 0));
  physicsWorld.getWorldInfo().set_m_gravity(new Ammo.btVector3(0, gravityConstant, 0));

  transformAux1 = new Ammo.btTransform();

}
let sky, sun, elevation, azimuth, phi, theta, uniforms;
function initSky(){
  sky = new Sky();
	sky.scale.setScalar( 450000 );
	scene.add( sky );
  sun = new THREE.Vector3();

  uniforms = sky.material.uniforms;
  renderer.toneMappingExposure = 0.2; // 0-1
  uniforms[ 'turbidity' ].value = 0; // 0-20
  uniforms[ 'rayleigh' ].value = 0.147; //0-4
	uniforms[ 'mieCoefficient' ].value = 0.023; // 0-0.1
	uniforms[ 'mieDirectionalG' ].value = 0.7; //0-1

  updateSky(0);
}
function updateSky(time){
  const elevation = 2 + 60 * Math.sin(Math.PI * time); // 0-90
  const azimuth = 2* 180 * time; //-180 - 180
  const phi = THREE.MathUtils.degToRad( 90 - elevation );
	const theta = THREE.MathUtils.degToRad( azimuth );
  sun.setFromSphericalCoords( 1, phi, theta );
  uniforms[ 'sunPosition' ].value.copy( sun );
  renderer.toneMappingExposure += time/10;

}
function resetSky(){
  const elevation = 0; // 0-90
  const azimuth = -180; //-180 - 180
  const phi = THREE.MathUtils.degToRad( 90 - elevation );
	const theta = THREE.MathUtils.degToRad( azimuth );
  sun.setFromSphericalCoords( 1, phi, theta );
  uniforms[ 'sunPosition' ].value.copy( sun );
  renderer.toneMappingExposure = 0.2; // 0-1
}

/*
function initNightSky(){
  float theta = acos( direction.y ); // elevation --> y-axis, [-pi/2, pi/2]
  float phi = atan( direction.z, direction.x ); // azimuth --> x-axis [-pi/2, pi/2]
  vec2 uv = vec2( phi, theta ) / vec2( 2.0 * pi, pi ) + vec2( 0.5, 0.0 );
  vec3 L0 = vec3( 0.1 ) * Fex; explaine the code for nightsky
}*/



function createObjects() {

  // ENVIRONMENT
  var environment = new EnvironmentGenerator(scene);
  environment.loadGLTFEnvironmentModel('models/american_style_house/scene.gltf');
  environment.loadGLTFEnvironmentModel('models/low_poly_wood_fence_on_grass/scene.gltf');
  environment.loadGLTFEnvironmentModel('models/stylized_bush/scene.gltf');
  //environment.loadGLTFEnvironmentModel('models/forest_house/scene.gltf');
  //environment.loadOBJEnvironmentModel('models/Campfire.obj');

  // LIGHTBULB
  const bulbMass = 10;
  const bulbRadius = 0.6;
  const pos = new THREE.Vector3(0, 0, bulbRadius);
  const quat = new THREE.Quaternion();
  // TODO change to light model
  const loader = new GLTFLoader().setPath('models/ceilling_lamp/');
    loader.load('scene.gltf', (gltf) => {
    const mesh = gltf.scene;
    mesh.position.set(0, 3, 3);
    mesh.scale.set(0.2, 0.2, 0.2);
    scene.add(mesh);
  } );
  // creates a sphere as a temporary reference for light bulb interaction 
  const lightbulb_geometry = new THREE.SphereGeometry(bulbRadius);
  const lightbulb_material = new THREE.MeshPhongMaterial({ color: 0xfddc5c, transparent: true });
  const lightbulb = new THREE.Mesh(lightbulb_geometry, lightbulb_material);
  lightbulb.name = "lightbulb";
  lightbulb.position.y = pos.y;
  lightbulb.position.z = pos.z;

  //assign the light's position as the lightPoint that the boids will be attracted to
  lightPoint_position = lightbulb.position;

  const bulbShape = new Ammo.btSphereShape(bulbRadius);
  bulbShape.setMargin(margin);
  createRigidBody(lightbulb, bulbShape, bulbMass, pos, quat);
  lightbulb.userData.physicsBody.setFriction(0.5);

  // creates the pointlight of the swinging light
  const light = new THREE.PointLight(0xfddc5c, 1, 100);
  lightbulb.add(light);

  // ROPE
  // creates rope graphic object
  const ropeNumSegments = 10;
  const ropeLength = 4;
  const ropeMass = 5;
  const ropePos = lightbulb.position;
  ropePos.y = bulbRadius - 1;

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
  rope.add(lightbulb)


  // LIGHT BASE
  let baseMass = 0;
  const baseMaterial = new THREE.MeshPhongMaterial({ color: 0xffddff });
  const base = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.2, 0,2), baseMaterial);
  base.position.x = lightbulb.position.x;
  base.position.y = 4;
  base.position.z = 3; 
  base.castShadow = true;
  base.receiveShadow = true;
  base.add(rope);
  const baseShape = new Ammo.btBoxShape(bulbRadius);
  baseShape.setMargin(margin);
  createRigidBody(base, baseShape, baseMass, base.position, quat);
  base.userData.physicsBody.setFriction(0.5);

  // Makes base draggable
  const interactionHandler = new InteractionHandler(camera, renderer, controls);
  interactionHandler.addDragObject(base);
  scene.add(base)

  // Rope physic object
  const softBodyHelpers = new Ammo.btSoftBodyHelpers();
  const ropeStart = new Ammo.btVector3(ropePos.x, ropePos.y, ropePos.z);
  const ropeEnd = new Ammo.btVector3(ropePos.x, ropePos.y + ropeLength, ropePos.z);
  const ropeSoftBody = softBodyHelpers.CreateRope(physicsWorld.getWorldInfo(), ropeStart, ropeEnd, ropeNumSegments - 1, 0);
  const sbConfig = ropeSoftBody.get_m_cfg();
  sbConfig.set_viterations(10);
  sbConfig.set_piterations(10);
  ropeSoftBody.setTotalMass(ropeMass, false);
  Ammo.castObject(ropeSoftBody, Ammo.btCollisionObject).getCollisionShape().setMargin(margin * 3);
  physicsWorld.addSoftBody(ropeSoftBody, 1, - 1);
  rope.userData.physicsBody = ropeSoftBody;
  // Disable deactivation
  ropeSoftBody.setActivationState(4);

  // Glue the rope extremes to the ball and the arm
  const influence = 1;
  ropeSoftBody.appendAnchor(0, lightbulb.userData.physicsBody, true, influence);
  ropeSoftBody.appendAnchor(10, ropeNumSegments, base.userData.physicsBody, true, influence);

  // Hinge constraint to move the arm
  // const pivotA = new Ammo.btVector3(0, ropePos.y * 0.5, 0);
  //const pivotB = new Ammo.btVector3(0, - 0.2, - armLength * 0.5);
  // const axis = new Ammo.btVector3(0, 1, 0);
  // hinge = new Ammo.btHingeConstraint(pylon.userData.physicsBody, arm.userData.physicsBody, pivotA, pivotB, axis, axis, true);
  // physicsWorld.addConstraint(hinge, true);
}

function createParalellepiped(sx, sy, sz, mass, pos, quat, material) {
  const threeObject = new THREE.Mesh(new THREE.BoxGeometry(sx, sy, sz, 1, 1, 1), material);
  const shape = new Ammo.btBoxShape(new Ammo.btVector3(sx * 0.5, sy * 0.5, sz * 0.5));
  shape.setMargin(margin);

  createRigidBody(threeObject, shape, mass, pos, quat);

  return threeObject;
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
  if (scene != undefined) {
    scene.add(axesHelper);
  } else {
    init();
  }
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

let lastSkyUpdate = 0;
const updateInterval = 1000;
let elapsedTime = 0;
function animate() {
  requestAnimationFrame(animate);
  if (scene != undefined) {
    requestAnimationFrame(MyUpdateLoop);
  }
  const now = performance.now();
  const delta = clock.getDelta();
  elapsedTime += delta;
  const totalDayTime = 300;
  const timeOfDay = (elapsedTime % totalDayTime) / totalDayTime;
  if(elapsedTime >= totalDayTime){
    resetSky();
    elapsedTime %= totalDayTime;
    console.log("a new day");
  }

  if (now - lastSkyUpdate > updateInterval) {
    updateSky(timeOfDay);
    lastSkyUpdate = now; 
  }
  renderer.render(scene, camera);
}

function updatePhysics(deltaTime) {

  // Step world
  physicsWorld.stepSimulation(deltaTime, 10);

  // Update rope
  const softBody = rope.userData.physicsBody;
  const ropePositions = rope.geometry.attributes.position.array;
  const numVerts = ropePositions.length / 3;
  const nodes = softBody.get_m_nodes();
  let indexFloat = 0;

  for (let i = 0; i < numVerts; i++) {

    const node = nodes.at(i);
    const nodePos = node.get_m_x();
    ropePositions[indexFloat++] = nodePos.x();
    ropePositions[indexFloat++] = nodePos.y();
    ropePositions[indexFloat++] = nodePos.z();

  }

  rope.geometry.attributes.position.needsUpdate = true;

  // Update rigid bodies
  for (let i = 0, il = rigidBodies.length; i < il; i++) {

    const objThree = rigidBodies[i];
    const objPhys = objThree.userData.physicsBody;
    const ms = objPhys.getMotionState();
    if (ms) {

      ms.getWorldTransform(transformAux1);
      const p = transformAux1.getOrigin();
      const q = transformAux1.getRotation();
      objThree.position.set(p.x(), p.y(), p.z());
      objThree.quaternion.set(q.x(), q.y(), q.z(), q.w());

    }

  }

}


//////////////
//GPUCompute//
//////////////
/*
function initComputeRenderer() {
  const gpuCompute = new GPUComputationRenderer( 1024, 1024, renderer );
  const dtPosition = gpuCompute.createTexture();
  const dtVelocity = gpuCompute.createTexture();
  fillPositionTexture( dtPosition );
  fillVelocityTexture( dtVelocity );

  velocityVariable = gpuCompute.addVariable( 'textureVelocity', document.getElementById( 'fragmentShaderVelocity' ).textContent, dtVelocity );
	positionVariable = gpuCompute.addVariable( 'texturePosition', document.getElementById( 'fragmentShaderPosition' ).textContent, dtPosition );

  gpuCompute.setVariableDependencies( velocityVariable, [ positionVariable, velocityVariable ] );
	gpuCompute.setVariableDependencies( positionVariable, [ positionVariable, velocityVariable ] );

  positionUniforms = positionVariable.material.uniforms;
  velocityUniforms = velocityVariable.material.uniforms;

  positionUniforms[ 'time' ] = { value: 0.0 };
  positionUniforms[ 'delta' ] = { value: 0.0 };
  velocityUniforms[ 'time' ] = { value: 1.0 };
  velocityUniforms[ 'delta' ] = { value: 0.0 };
  velocityUniforms[ 'testing' ] = { value: 1.0 };
  velocityUniforms[ 'separationDistance' ] = { value: 1.0 };
  velocityUniforms[ 'alignmentDistance' ] = { value: 1.0 };
  velocityUniforms[ 'cohesionDistance' ] = { value: 1.0 };
  velocityUniforms[ 'freedomFactor' ] = { value: 1.0 };
  velocityUniforms[ 'predator' ] = { value: new THREE.Vector3() };
  velocityVariable.material.defines.BOUNDS = BOUNDS.toFixed( 2 );
}
*/

//////////////
//  Boids   //
//////////////



// Create boid manager
//these paramters can be changed

const numberOfBoids = 100;
const obstacles = [];
const velocity = 0.5;
const maxSpeed = 0.1;
const maxForce = 0.1;
const searchRadius = 2;
// change lightPoint Vector3 to lightbulb 
const lightPoint = lightPoint_position;
const lightAttraction = 50;
const spawnRadius = 10;
const boidManager = new BoidManager(numberOfBoids, obstacles, velocity, maxSpeed, maxForce, searchRadius, lightAttraction, spawnRadius, scene);

//final update loop
let clock = new THREE.Clock();
var deltaTime; 
var MyUpdateLoop = function () { 
  //console.log( lightPoint_position);
  deltaTime = clock.getDelta();
  CreateScene();
  updatePhysics(deltaTime);

  renderer.render(scene, camera);

  //insert in method bellow, another method that returns the position of the light
  boidManager.setLightPoint(lightPoint_position);


  boidManager.updateBoids(deltaTime);

  // - Orbit Controls - 
  //controls.update();

  //requestAnimationFrame(MyUpdateLoop);
};

//requestAnimationFrame(MyUpdateLoop);

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