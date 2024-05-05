import * as THREE from 'three';
import { DragControls } from './build/controls/DragControls.js';

export class InteractionHandler{

    constructor(camera, renderer, orbitControls){
        this.draggedObjects = [];
        this.camera = camera;
        this.renderer = renderer;
        this.orbitControls = orbitControls;
        const controls = new DragControls(this.draggedObjects, camera, renderer.domElement);
        
        controls.addEventListener( 'dragstart', ( event ) => {
            this.orbitControls.enabled = false;
            // TODO add an animated cable swing
            if (event.object.material && event.object.material.emissive) {
                event.object.material.emissive.set(0xaaaaaa);
            }
            console.log("Drag start");
        } );
        /*
        controls.addEventListener( 'drag', function ( event ) {
            // TODO add physics (latent) to the cable swing
            event.object.material.emissive.set( 0x000000 );
        } ); */
        
        controls.addEventListener( 'dragend', ( event ) => {
            this.orbitControls.enabled = true;
            // TODO add an animated cable swing          
            if (event.object.material && event.object.material.emissive) {
                event.object.material.emissive.set( 0x000000 );
            }
            console.log("Drag end");
        } ); 
    }

    addDragObject(objectToDrag) {
        this.draggedObjects.push(objectToDrag);
    }
    
}