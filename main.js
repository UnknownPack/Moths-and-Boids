import * as THREE from 'three';
import { OrbitControls } from './build/controls/OrbitControls.js';
import { EnvironmentGenerator } from './EnvironmentGenerator.js';
import { InteractionHandler } from './InteractionHandler.js';
import { BoidManager } from './BoidManager.js';
import { GLTFLoader } from './build/loaders/GLTFLoader.js';
import { Sky } from './build/environment/Sky.js';

//import { GUI } from './build/lil-gui.module.min.js';

import { GUI } from './build/controls/dat.gui.module.js';
import { AudioLoader, AudioListener, Audio } from 'three';

// GRAPHICS CONST
let camera, controls, renderer;
let scene = new THREE.Scene();
// PHYSICS CONST
const gravityConstant = -9.8;
let collisionConfiguration;
let dispatcher;
let broadphase;
let solver;
let softBodySolver;
let physicsWorld;
let tmpTrans;

const margin = 0.05;
const rigidBodies = [];
var environment;
let hinge;
let base;
let rope;
let lightbulb;
let isLightbulbThere = false, interactionHandlerDefined = false;
let lightPoint //= new THREE.Vector3(0, 5, 3);
let ropeSoftBody;
let transformAux1;


//let armMovement = 0;
// GUI Controls

let lightSettings = {
  brightness: 1.0,
  soundPlaying: true,
  totalDayTime:20
};

// Audio
let listener, sound, audioLoader, backgroundMusic;
let backgroundMusicVolume = 0.25; // Separate volume control for background music


let baseObject = null;
const STATE = { DISABLE_DEACTIVATION: 4 }
//let armMovement = 0;
let interactionHandler;

// GUI
// default controls
var houses = ['american', 'foresthouse'];
var gcontrols = {
  house: houses[getRandomInt(2)],
}

function getRandomInt(max) {
  return Math.floor(Math.random() * max);
}

// initialze physics environment
// Ensure Ammo.js is fully loaded and initialized
Ammo().then(function (AmmoLib) {
  Ammo = AmmoLib;

  init()
  animate()

}).catch(error => {
  console.error("Error initializing Ammo.js:", error);
});

function init() {
  initGraphics();
  initPhysics();
  createObjects();
  initInput();
  initSky();
  // DEBUGGING
  console.log(scene.children);

  initSound();
}


/*
function loadModel(model){
  if (currentModel) {
    scene.remove(currentModel);
  }
  switch(model){
    case 'american_style_house':
      environment.loadGLTFEnvironmentModel('models/american_style_house/scene.gltf');
      break;
    case 'forest_house':
      environment.loadGLTFEnvironmentModel('models/forest_house/scene.gltf');
      break;
  }
}*/


function initGraphics() {
  var ratio = window.innerWidth / window.innerHeight;

  //create a xyz axis
  const axesHelper = new THREE.AxesHelper(5);
  axesHelper.visible = false;
  if (scene != undefined) {
    scene.add(axesHelper);
  } else {
    init();
  }

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
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.setPixelRatio(window.devicePixelRatio * 0.5);
  //for sky 
  renderer.toneMapping = THREE.ACESFilmicToneMapping;

  document.body.appendChild(renderer.domElement);

  // Orbit Controls
  controls = new OrbitControls(camera, renderer.domElement);
  controls.enableRotate = false;
  controls.enablePan = false;
}

function updateLightSettings() {
  if (lightbulb) {
    lightbulb.children.forEach(child => {
      if (child.isPointLight) {
        child.intensity =lightSettings .brightness;
      }
      if (child.isMesh) {
        child.material.emissiveIntensity = lightSettings.brightness;
      }
    });
  }
  updateSoundVolume();
}

function updateSoundVolume() {
  if (sound) {
    sound.setVolume(lightSettings.brightness / 5);
  }
}

function updateBackgroundMusicVolume() {
  if (backgroundMusic) {
    backgroundMusic.setVolume(backgroundMusicVolume);
  }
}

function toggleSound() {
  if (sound) {
    if (lightSettings.soundPlaying) {
      sound.play();
    } else {
      sound.pause();
    }
  }
  if (backgroundMusic) {
    if (lightSettings.soundPlaying) {
      backgroundMusic.play();
    } else {
      backgroundMusic.pause();
    }
  }
}


function initSound() {
  listener = new AudioListener();
  camera.add(listener);

  sound = new Audio(listener);

  audioLoader = new AudioLoader();
  audioLoader.load('build/sounds/wings.mp3', function (buffer) {
    sound.setBuffer(buffer);
    sound.setLoop(true);
    sound.setVolume(lightSettings.brightness / 5);
    sound.play();
  });
  // Background music
  backgroundMusic = new Audio(listener);
  audioLoader.load('build/sounds/backgroundmusic.mp3', function (buffer) {
    backgroundMusic.setBuffer(buffer);
    backgroundMusic.setLoop(true);
    backgroundMusic.setVolume(backgroundMusicVolume);
    backgroundMusic.play();
  });
}

function initPhysics() {
  // Physics configuration
  try {
    collisionConfiguration = new Ammo.btSoftBodyRigidBodyCollisionConfiguration();
    dispatcher = new Ammo.btCollisionDispatcher(collisionConfiguration);
    broadphase = new Ammo.btDbvtBroadphase();
    solver = new Ammo.btSequentialImpulseConstraintSolver();
    softBodySolver = new Ammo.btDefaultSoftBodySolver();
    physicsWorld = new Ammo.btSoftRigidDynamicsWorld(dispatcher, broadphase, solver, collisionConfiguration, softBodySolver);
    physicsWorld.setGravity(new Ammo.btVector3(0, gravityConstant, 0));
    physicsWorld.getWorldInfo().set_m_gravity(new Ammo.btVector3(0, gravityConstant, 0));
    transformAux1 = new Ammo.btTransform();
  } catch (e) {
    console.error("Error during physics initialization:", e);
  }
}


let sky, sun, uniforms, moon;
function initSky(){

  sky = new Sky();
  sky.scale.setScalar(450);
  scene.add(sky);
  sun = new THREE.Vector3();
  moon = new THREE.Vector3();

  uniforms = sky.material.uniforms;
  renderer.toneMappingExposure = 0.3; // 0-1
  uniforms[ 'turbidity' ].value = 5; // 0-20
  uniforms[ 'rayleigh' ].value = 3; //0-4
	uniforms[ 'mieCoefficient' ].value = 0.033; // 0-0.1
	uniforms[ 'mieDirectionalG' ].value = 0.63; //0-1
  updateSky(0);
}

function updateSky(timeofDay){
  const azimuth = 30; 
  const elevation = timeofDay* 2 * 180; //0 - 180
  const phi = THREE.MathUtils.degToRad( 90 - elevation );
	const theta = THREE.MathUtils.degToRad( azimuth );
  sun.setFromSphericalCoords( 1, phi, theta );
  uniforms[ 'sunPosition' ].value.copy( sun );

  const moonElevation = (timeofDay + 0.5) % 1 * 2 * 180; 
  const moonPhi = THREE.MathUtils.degToRad(90 - moonElevation);
  const moonTheta = THREE.MathUtils.degToRad(azimuth);
  moon.setFromSphericalCoords(1, moonPhi, moonTheta);
  uniforms['moonPosition'].value.copy(moon);


  if(timeofDay > 0.5 && timeofDay < 1){
    uniforms[ 'rayleigh' ].value = 0.1;
    renderer.toneMappingExposure = 0.3;
  }else if (timeofDay > 0.85){
    renderer.toneMappingExposure = 0.4;
  }
}
function resetSky(){
  uniforms[ 'rayleigh' ].value = 0.3;
  renderer.toneMappingExposure = 0.3;
  const elevation = 0; 
  const azimuth = 30; 
  const phi = THREE.MathUtils.degToRad( 90 - elevation );
	const theta = THREE.MathUtils.degToRad( azimuth );
  sun.setFromSphericalCoords( 1, phi, theta );
  uniforms[ 'sunPosition' ].value.copy( sun );

  const moonElevation = 0; 
  const moonPhi = THREE.MathUtils.degToRad(90 - moonElevation);
  const moonTheta = THREE.MathUtils.degToRad(azimuth);
  moon.setFromSphericalCoords(1, moonPhi, moonTheta);
  uniforms['moonPosition'].value.copy(moon);

  renderer.toneMappingExposure = 0.4; // 0-1
  uniforms['turbidity'].value = 5; // 0-20
  uniforms['rayleigh'].value = 3; //0-4
  uniforms['mieCoefficient'].value = 0.033; // 0-0.1
  uniforms['mieDirectionalG'].value = 0.63; //0-1
  updateSky(0);
}

function createObjects() {
  // ENVIRONMENT

  var environment = new EnvironmentGenerator(scene, gcontrols.house);
  //environment.loadGLTFEnvironmentModel('models/american_style_house/scene.gltf');
  //environment.loadGLTFEnvironmentModel('models/low_poly_wood_fence_on_grass/scene.gltf');
  //environment.loadGLTFEnvironmentModel('models/stylized_bush/scene.gltf');
  //environment.loadGLTFEnvironmentModel('models/forest_house/scene.gltf');

  // LIGHTBULB
  const bulbMass = 12;
  const bulbRadius = 0.5;
  const pos = new THREE.Vector3(0, 5.5, 0);
  const quat = new THREE.Quaternion(0, 0, 0, 1);

  // light model
  lightbulb = makeBulbGroup();
  lightbulb.position.y = pos.y;
  lightbulb.position.z = pos.z;
  lightbulb.scale.set(0.5, 0.5, 0.5);
  lightbulb.name = "lightbulb";


  // BASE
  base = createLightBase(quat);
  scene.add(base);

  // assign the light's position as the lightPoint that the boids will be attracted to
  lightPoint = base.position;
  lightPoint.setY(lightPoint.y - 2);
  boidManager.setLightPoint(lightPoint);

  // create bulb physics 
  const bulbShape = new Ammo.btSphereShape(bulbRadius);
  bulbShape.setMargin(margin);
  createRigidBody(lightbulb, bulbShape, bulbMass, pos, quat);
  lightbulb.userData.physicsBody.setFriction(0.5);
  scene.add(lightbulb);

  // create cable/rope
  createCable(lightbulb, base);


  // Makes base draggable
  interactionHandler = new InteractionHandler(camera, renderer);
  interactionHandlerDefined = true;
  interactionHandler.addDragObject(base);
}

// returns lightbulb group
function makeBulbGroup() {
  var yTranslation = 1.2;

  let transparentMaterial = new THREE.MeshBasicMaterial()
  transparentMaterial.transparent = true;
  let group = new THREE.Mesh(new THREE.SphereGeometry(0.1), transparentMaterial);
  const intensity = lightSettings.brightness;
  //main bulb
  var bulbGeometry = new THREE.SphereGeometry(1, 32, 32);
  var bulbLight = new THREE.PointLight(0xffee88, 1, 100, 2);
  var bulbMat = new THREE.MeshStandardMaterial({
    emissive: 0xffffee,
    emissiveIntensity: intensity,
    color: 0xffffee,
    roughness: 0.2
  });

  bulbLight.add(new THREE.Mesh(bulbGeometry, bulbMat));
  bulbLight.position.set(0, -1 + yTranslation, 0);
  bulbLight.castShadow = true;

  var d = 200;

  bulbLight.shadow.camera.left = -d;
  bulbLight.shadow.camera.right = d;
  bulbLight.shadow.camera.top = d;
  bulbLight.shadow.camera.bottom = -d;
  bulbLight.shadow.camera.far = 1000;

  bulbLight.name = "bulbLight";
  group.add(bulbLight);
  return group;
}

function createCable(lightbulb, base) {
  // The rope
  // Rope graphic object
  const ropeNumSegments = 10;
  const ropeLength = 4;
  const ropeMass = 12;
  const ropePos = new THREE.Vector3(0.0, 6.0, 0.0);
  //ropePos.y += bulbRadius;

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

  // Rope physic object
  const softBodyHelpers = new Ammo.btSoftBodyHelpers();
  const ropeStart = new Ammo.btVector3(ropePos.x, ropePos.y, ropePos.z);
  const ropeEnd = new Ammo.btVector3(ropePos.x, ropePos.y + ropeLength, ropePos.z);
  ropeSoftBody = softBodyHelpers.CreateRope(physicsWorld.getWorldInfo(), ropeStart, ropeEnd, ropeNumSegments - 1, 0);
  const sbConfig = ropeSoftBody.get_m_cfg();
  sbConfig.set_viterations(10);
  sbConfig.set_piterations(10);
  ropeSoftBody.setTotalMass(ropeMass, false);
  Ammo.castObject(ropeSoftBody, Ammo.btCollisionObject).getCollisionShape().setMargin(margin * 3);
  physicsWorld.addSoftBody(ropeSoftBody, 1, -1);
  rope.userData.physicsBody = ropeSoftBody;
  // Disable deactivation
  ropeSoftBody.setActivationState(4);

  // Hinge constraint to move the arm
  const armLength = 2;
  const pivotA = new Ammo.btVector3(0, ropePos.y * 0.5, 0);
  const pivotB = new Ammo.btVector3(0, - 0.2, - armLength * 0.5);
  const axis = new Ammo.btVector3(0, 1, 0);
  //hinge = new Ammo.btHingeConstraint(pylon.userData.physicsBody, arm.userData.physicsBody, pivotA, pivotB, axis, axis, true);
  //physicsWorld.addConstraint(hinge, true);

  // Glue the rope extremes to the ball and the arm
  const influence = 1;
  ropeSoftBody.appendAnchor(0, lightbulb.userData.physicsBody, true, influence);
  ropeSoftBody.appendAnchor(ropeNumSegments, base.userData.physicsBody, true, influence);

  //affectedObjects.push(rope);
  isLightbulbThere = true;
  scene.add(rope);

}

function createLightBase(quat) {
  // LIGHT BASE
  let baseMass = 0;
  let baseMaterial = new THREE.MeshPhongMaterial();
  baseMaterial.color = new THREE.Color(0xffffff);
  base = baseObject = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.2, 0.2, 32), baseMaterial);
  base.position.x = 0;
  base.position.y = 12;
  base.position.z = 0;
  base.castShadow = true;
  base.receiveShadow = true;
  base.name = "base";

  //Ammojs Section
  let transform = new Ammo.btTransform();
  transform.setIdentity();
  transform.setOrigin(new Ammo.btVector3(base.position.x, base.position.y, base.position.z));
  transform.setRotation(new Ammo.btQuaternion(quat.x, quat.y, quat.z, quat.w));
  let motionState = new Ammo.btDefaultMotionState(transform);

  const baseShape = new Ammo.btBoxShape(new Ammo.btVector3(0.2, 0.2, 0.2));
  baseShape.setMargin(margin);
  createRigidBody(base, baseShape, baseMass, base.position, quat);
  base.userData.physicsBody.setFriction(0.5);

  return base;
}

//input event listeners
function initInput() {
  // Ensure resume of the audio context
  const resumeAudio = () => {
    if (listener.context.state === 'suspended') {
      listener.context.resume();
    }
  };
  document.addEventListener('click', resumeAudio);
  document.addEventListener('touchstart', resumeAudio);
}

function ClearScene() {
  for (let i = scene.children.length - 1; i >= 0; i--)
    if (scene.children[i].type == "Mesh")
      scene.remove(scene.children[i]);
}

function CreateTransfMatrices() { }

function CreateScene() {
  CreateTransfMatrices();
}

// create a rigidbody for physics application
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
  body.setFriction(4);

  physicsWorld.addRigidBody(body);
  threeObject.userData.physicsBody = body;
  //scene.add(threeObject);

  if (mass > 0) {
    rigidBodies.push(threeObject);

    // Disable deactivation
    body.setActivationState(STATE.DISABLE_DEACTIVATION);

  } else {
    body.setActivationState(STATE.DISABLE_DEACTIVATION);
  }

}

let lastSkyUpdate = 0;
let updateInterval = 10;
let elapsedTime = 0;

function animate() {
  requestAnimationFrame(animate);
  if (scene != undefined) {
    requestAnimationFrame(MyUpdateLoop);
  }
  const now = performance.now();
  const delta = clock.getDelta();
  elapsedTime += delta;
  //const totalDayTime = 5; //24seconds
  const totalDayTime = lightSettings.totalDayTime;
  const timeOfDay = (elapsedTime % totalDayTime) / totalDayTime; // 0-1
  if (elapsedTime >= totalDayTime) {
    resetSky();
    elapsedTime = 0;
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
  //physicsWorld.stepSimulation(deltaTime,1, 10);
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
//these parameters can be changed

const numberOfBoids = 1500;
const obstacles = [];
const velocity = 0.5;
const maxSpeed = 0.1;
const maxForce = 0.1;
const searchRadius = 4;
const lightAttraction = 20;
const spawnRadius = 30;
const boidManager = new BoidManager(numberOfBoids, obstacles, velocity, maxSpeed, maxForce, searchRadius, lightAttraction, spawnRadius, scene);
boidManager.setLightPoint(lightPoint);


//final update loop
let clock = new THREE.Clock();
var deltaTime;

var MyUpdateLoop = function () {
  deltaTime = clock.getDelta();
  if (interactionHandlerDefined) {
    interactionHandler.moveBall();
  }
  CreateScene();
  for (let i = 0; i < scene.children.length; i++) {
    if (isLightbulbThere) {
      updatePhysics(deltaTime);
    }
  }
  //render()
  renderer.render(scene, camera);

  boidManager.updateBoids(deltaTime);

  // Inside your init function or wherever appropriate

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

//this function is called when the window is resized
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

// initializes GUI

const gui = new dat.GUI();

// Add a dropdown control for selecting house types

gui.add(gcontrols, 'house', houses).name('House').listen()
  .onChange(function (newValue) {
    environment.houseMesh = environment.loadNewHouse(newValue);
  });

gui.add(lightSettings, 'brightness', 0, 10).name('Light Brightness').onChange(updateLightSettings);
gui.add(lightSettings, 'totalDayTime', 5, 60, 1).name('totalDayTime').onChange();
gui.add(lightSettings, 'soundPlaying').name('Sound Play/Pause').onChange(toggleSound);
gui.add({volume: backgroundMusicVolume}, 'volume', 0, 1).name('Music').onChange(function (value) {
  backgroundMusicVolume = value;
  updateBackgroundMusicVolume();
});

gui.open();


