import * as THREE from 'three';
import { DragControls } from './build/controls/DragControls.js';

export class InteractionHandler{

    constructor(camera, renderer){
        this.draggedObjects = [];
        this.camera = camera;
        this.renderer = renderer;
        const controls = new DragControls(this.draggedObjects, camera, renderer.domElement);
        /*
        controls.addEventListener( 'dragstart', function ( event ) {
            // TODO add an animated cable swing
            event.object.material.emissive.set( 0xaaaaaa );
        
        } );

        controls.addEventListener( 'darg', function ( event ) {
        
            // TODO add physics (latent) to the cable swing
            event.object.material.emissive.set( 0x000000 );
        
        } );
        
        controls.addEventListener( 'dragend', function ( event ) {
        
            // TODO add an animated cable swing
            event.object.material.emissive.set( 0x000000 );
        
        } ); */
    }

    addDragObject(objectToDrag) {
        this.draggedObjects.push(objectToDrag);
    }
    
}