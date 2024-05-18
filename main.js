import * as THREE from 'three';
import { OrbitControls } from './build/controls/OrbitControls.js';
import { EnvironmentGenerator } from './EnvironmentGenerator.js';
import { InteractionHandler } from './InteractionHandler.js';
import { BoidManager } from './BoidManager.js';
import { GLTFLoader } from './build/loaders/GLTFLoader.js';
import { GPUComputationRenderer } from './build/misc/GPUComputationRenderer.js';
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
let base;
let rope;
let lightbulb;
let lightPoint = new THREE.Vector3(0, 5, 3);
let transformAux1;

//let armMovement = 0;

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
  // DEBUGGING
  console.log(scene.children);
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
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
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
  controls.enableRotate = false;
  controls.enablePan = false;
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

let sky, sun, uniforms;
function initSky(){
  sky = new Sky();
	sky.scale.setScalar( 450); 
	scene.add( sky );
  sun = new THREE.Vector3();

  uniforms = sky.material.uniforms;
  renderer.toneMappingExposure = 0.4; // 0-1
  uniforms[ 'turbidity' ].value = 5; // 0-20
  uniforms[ 'rayleigh' ].value = 3; //0-4
	uniforms[ 'mieCoefficient' ].value = 0.033; // 0-0.1
	uniforms[ 'mieDirectionalG' ].value = 0.63; //0-1
  updateSky(0);
}

function updateSky(timeofDay){
  const azimuth = 30; 
  const elevation = timeofDay * 180; //0 - 180
  const phi = THREE.MathUtils.degToRad( 90 - elevation );
	const theta = THREE.MathUtils.degToRad( azimuth );
  sun.setFromSphericalCoords( 1, phi, theta );
  uniforms[ 'sunPosition' ].value.copy( sun );
  //renderer.toneMappingExposure = Math.max(0.1, 0.6);
}
function resetSky(){
  const elevation = 0; 
  const azimuth = 30; 
  const phi = THREE.MathUtils.degToRad( 90 - elevation );
	const theta = THREE.MathUtils.degToRad( azimuth );
  sun.setFromSphericalCoords( 1, phi, theta );
  uniforms[ 'sunPosition' ].value.copy( sun );
}



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
  const bulbRadius = 0.5;
  const pos = new THREE.Vector3(0, 0, 0);
  const quat = new THREE.Quaternion( 0, 0, 0, 1 );

  // create lamp group
  let fullLampGroup = new THREE.Group();
  fullLampGroup.position.x = -6;
  fullLampGroup.position.y = 4;
  fullLampGroup.position.z = 0;
  createLightBase(fullLampGroup, bulbRadius, quat);
  // light model
  lightbulb = makeBulbGroup();
    // creates a sphere as a temporary reference for light bulb interaction 
  // const lightbulb_geometry = new THREE.SphereGeometry(bulbRadius);
  // const lightbulb_material = new THREE.MeshPhongMaterial({ color: 0xfddc5c, transparent: true });
  // const lightbulb = new THREE.Mesh(lightbulb_geometry, lightbulb_material);
  lightbulb.position.y = pos.y;
  lightbulb.position.z = pos.z;
  lightbulb.scale.set(0.5, 0.5, 0.5);
  lightbulb.name = "lightbulb";

  //assign the light's position as the lightPoint that the boids will be attracted to
  lightPoint = fullLampGroup.position;
  boidManager.setLightPoint(lightPoint);

  // bulb physics 
  const bulbShape = new Ammo.btSphereShape(bulbRadius*0.5);
  bulbShape.setMargin(margin - 0.3);
  createRigidBody(lightbulb, bulbShape, bulbMass, pos, quat);
  lightbulb.userData.physicsBody.setFriction(0.5);


  let ropeSoftBody;
  const ropeNumSegments = 10;
  const ropeLength = 4;
  ropeSoftBody = createCable(lightbulb, ropeSoftBody, ropeNumSegments, ropeLength, fullLampGroup, bulbRadius);
}

function makeBulbGroup() {
  var yTranslation = 1.2;

  var group = new THREE.Group();
  const intensity = 3.0;
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
  bulbLight.position.set(0, -1+yTranslation, 0);
  bulbLight.castShadow = true;

  var d = 200;

  bulbLight.shadow.camera.left = -d;
  bulbLight.shadow.camera.right = d;
  bulbLight.shadow.camera.top = d;
  bulbLight.shadow.camera.bottom = -d;

  bulbLight.shadow.camera.far = 100;

  //stem
  var bulbStem = new THREE.CylinderGeometry(0.5, 0.65, 0.55, 32);
  var stemMat = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    emissive: 0xffffee,
    emissiveIntensity: intensity,
    metalness: 0.8,
    roughness: 0
  });

  var bStem = new THREE.Mesh(bulbStem, stemMat);
  bStem.position.set(0, -0.1+yTranslation, 0);
  bStem.castShadow = true;
  bStem.receiveShadow = true;

  //plug main
  var bulbPlug = new THREE.CylinderGeometry(0.52, 0.52, 1.2, 32);

  var plugMat = new THREE.MeshStandardMaterial({
    color: 0x807d7a
  });

  var plug = new THREE.Mesh(bulbPlug, plugMat);
  plug.position.set(0, 0.2+yTranslation, 0);
  plug.receiveShadow = true;
  plug.castShadow = true;

  //plug top
  var topGeo = new THREE.CylinderGeometry(0.25, 0.3, 0.2, 32);

  var topMat = new THREE.MeshStandardMaterial({
    color: 0xe8d905
  });
  var plugTop = new THREE.Mesh(topGeo, topMat);
  plugTop.position.set(0, 0.75+yTranslation, 0);
  plugTop.receiveShadow = true;
  plugTop.castShadow = true;

  //plug rings
  var ringGeo = new THREE.TorusGeometry(0.52, 0.04, 4, 100);

  var ringMat = new THREE.MeshStandardMaterial({
    color: 0x807d7a
  });

  var ringY = 0.33;
  for (var i = 0; i < 3; i++) {
    var ring = new THREE.Mesh(ringGeo, ringMat);
    ring.rotation.x = -Math.PI / 2;
    ring.position.set(0, ringY+yTranslation, 0);
    group.add(ring);

    ringY += 0.15;
  }

  //top ring
  var topRingGeo = new THREE.TorusGeometry(0.49, 0.05, 16, 100);

  var topRing = new THREE.Mesh(topRingGeo, ringMat);
  topRing.position.set(0, 0.75+yTranslation, 0);
  topRing.rotation.x = -Math.PI / 2;

  //bottom ring
  var botRingGeo = new THREE.TorusGeometry(0.5, 0.05, 16, 100);

  var botRing = new THREE.Mesh(botRingGeo, ringMat);
  botRing.position.set(0, 0.15+yTranslation, 0);
  botRing.rotation.x = -Math.PI / 2;

  //add to group
  group.add(bStem);
  group.add(bulbLight);
  group.add(plug);
  group.add(plugTop);
  group.add(botRing);
  group.add(topRing);

  // group position
  group.position.x = 0;
  group.position.y = 0;
  group.position.z = 0;

  return group;
}

function createCable(lightbulb, ropeSoftBody, ropeNumSegments, ropeLength, group, bulbRadius) {
  // ROPE
  // creates rope graphic object
  const ropeMass = 5;
  const ropePos = (lightbulb.position);
  ropePos.x = 0;
  ropePos.y = 5 - ropeLength;
  ropePos.z = 0;

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
  group.add(lightbulb);
  group.add(rope);
  group.add(base);
  scene.add(group);

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
  physicsWorld.addSoftBody(ropeSoftBody, 1, - 1);
  rope.userData.physicsBody = ropeSoftBody;

  // Disable deactivation
  ropeSoftBody.setActivationState(4);

  // Hinge constraint to move the arm
  // const pivotA = new Ammo.btVector3(0, ropePos.y * 0.5, 0);
  // const pivotB = new Ammo.btVector3(0, - 0.2, - armLength * 0.5);
  // const axis = new Ammo.btVector3(0, 1, 0);
  // hinge = new Ammo.btHingeConstraint(pylon.userData.physicsBody, arm.userData.physicsBody, pivotA, pivotB, axis, axis, true);
  // physicsWorld.addConstraint(hinge, true);

    // Glue the rope extremes to the ball and the arm
    const influence = 1;
    ropeSoftBody.appendAnchor(0, lightbulb.userData.physicsBody, true, influence);
    ropeSoftBody.appendAnchor(ropeNumSegments, base.userData.physicsBody, true, influence);

  return ropeSoftBody;
}

function createLightBase(group, bulbRadius, quat) {
  // LIGHT BASE
  let baseMass = 0;
  const baseMaterial = new THREE.MeshPhongMaterial({ color: 0xA9A9A9 });
  base = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.2, 0.2, 32), baseMaterial);
  base.position.x = 0;
  base.position.y = 5;
  base.position.z = 0;
  base.castShadow = true;
  base.receiveShadow = true;
  const baseShape = new Ammo.btBoxShape(bulbRadius);
  baseShape.setMargin(margin);
  createRigidBody(base, baseShape, baseMass, base.position, quat);
  base.userData.physicsBody.setFriction(0.5);

  // Makes base draggable
  const interactionHandler = new InteractionHandler(camera, renderer);
  interactionHandler.addDragObject(group);
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
  const totalDayTime = 5; //24seconds
  const timeOfDay = (elapsedTime % totalDayTime) / totalDayTime; // 0-1
  if(elapsedTime >= totalDayTime){
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

const numberOfBoids = 1000;
const obstacles = [];
const velocity = 0.5;
const maxSpeed = 0.1;
const maxForce = 0.1;
const searchRadius = 7;
const lightAttraction = 20;
const spawnRadius = 30;
const boidManager = new BoidManager(numberOfBoids, obstacles, velocity, maxSpeed, maxForce, searchRadius, lightAttraction, spawnRadius, scene);
boidManager.setLightPoint(lightPoint);

//final update loop
let clock = new THREE.Clock();
var deltaTime;

var MyUpdateLoop = function () {
  deltaTime = clock.getDelta();
  CreateScene();
  //TODO update physics
  for (let i = 0; i < scene.children.length; i++) {
    if (lightbulb != null) {
      updatePhysics(deltaTime);
    }
  }
  //render()
  renderer.render(scene, camera);

  //boidManager.setLightPoint(lightPoint);
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