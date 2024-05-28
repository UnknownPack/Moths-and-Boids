import * as THREE from 'three';
import { DragControls } from './build/controls/DragControls.js';

export class InteractionHandler {

    constructor(camera, renderer) {
        this.draggedObjects = [];
        this.camera = camera;
        this.renderer = renderer;
        const controls = new DragControls(this.draggedObjects, camera, renderer.domElement);
        this.moveDirection = { left: 0, right: 0, forward: 0, back: 0 };
        this.dragDirection = 0;
        this.currentXPosition = 0;
        this.lastXPosition = 0;
        controls.transformGroup = false;

        controls.addEventListener('dragstart', (event) => {
            
        });
        /*
        controls.addEventListener( 'drag', function ( event ) {
            // TODO add physics (latent) to the cable swing
            event.object.material.emissive.set( 0x000000 );
        } ); */

        controls.addEventListener('dragend', (event) => {
            this.currentXPosition = this.draggedObjects[0].position.x;
        });
    }

    addDragObject(objectToDrag) {
        this.draggedObjects.push(objectToDrag);
    }

    moveBall() {
        let object = this.draggedObjects[0];

        let scalingFactor = 42;

        let moveX = this.currentXPosition;
        let moveZ = 0;
        let moveY = 0;

        if (moveX == 0) return;

        let resultantImpulse = new Ammo.btVector3(moveX*scalingFactor, moveY, moveZ);

        let physicsBody = object.userData.physicsBody;

        physicsBody.setLinearVelocity(resultantImpulse);
        this.currentXPosition = 0;
    }

}