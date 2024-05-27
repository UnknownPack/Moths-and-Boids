import { GUI } from './build/lil-gui.module.min.js';

export default class ControlsUI {
    constructor(){
        const gui = new GUI ({width: 350});
        const controller = {
            totalDayTime : 10,
            a : 10
        }
        //gui.add(controller, 'a', 0.0, 20.0, 0.1);
        gui.add(controller, 'totalDayTime', 5, 60, 1);
    }
}