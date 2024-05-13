import * as THREE from 'three';
import { BoidManager } from './BoidManager.js';
import { GUI } from "../lib/dat.gui.module.js";

export default class ControlsUI {
    constructor(scene, lightbulb, boidManager) {
        this.gui = new GUI({ width: 350 });

        // Light intensity control
        const lightFolder = this.gui.addFolder('Light Controls');
        lightFolder.add(lightbulb.children[0], 'intensity', 0, 2, 0.01).name('Light Intensity').onChange(value => {
            // Update light intensity
            lightbulb.children[0].intensity = value;
        });

        // Boid intensity control
        const boidFolder = this.gui.addFolder('Moth Controls');
        const mothControl = boidFolder.add({mothCount: boidManager.numberOfBoids}, 'mothCount', 0, 300, 1).name('Number of Moths').onChange(value => {
            this.updateBoidCount(boidManager, value);
        });

        lightFolder.open();
        boidFolder.open();
    }

    updateBoidCount(boidManager, newCount) {
        const currentCount = boidManager.boids.length;
        if (newCount > currentCount) {
            // Add boids
            for (let i = currentCount; i < newCount; i++) {
                boidManager.makeBoid(); // Assuming a function to make and add a single boid
            }
        } else if (newCount < currentCount) {
            // Remove boids
            boidManager.boids.splice(newCount, currentCount - newCount);
        }
        boidManager.numberOfBoids = newCount; // Update the count after adding/removing
    }
}
