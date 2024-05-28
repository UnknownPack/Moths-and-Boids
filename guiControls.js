import { GUI } from './build/lil-gui.module.min.js';

export default class ControlsUI {
    constructor(){
        const gui = new GUI ({width: 350});
        const controller = {
            a : 10
        }
        gui.add(controller, 'a', 0.0, 20.0, 0.1);
        
    }
}