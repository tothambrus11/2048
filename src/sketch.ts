import {Gesture, MouseGestures} from "./MouseGestures";
import * as P5 from "p5";

let mouseGestureDetector: MouseGestures;

let p = new P5((p) => {
    /**
     * SETUP ***********************************************************************************************************
     */
    p.setup = () => {
        p.createCanvas(p.windowWidth, p.windowHeight);

        mouseGestureDetector = new MouseGestures(p);
        mouseGestureDetector.on("gesture", (gesture: Gesture) => {
            console.log(gesture);
        });
    };

    p.windowResized = () => p.resizeCanvas(p.windowWidth, p.windowHeight);

    /**
     * DRAW ************************************************************************************************************
     */
    p.draw = () => {
        p.line(0, 0, 800, 800);
        p.line(0, 800, 800, 0);
    };

    p.touchStarted = () => {
        mouseGestureDetector.onMouseDown();
    };

    p.mousePressed = () => {
        mouseGestureDetector.onMouseDown();
    };

    p.touchEnded = () => {
        mouseGestureDetector.onMouseUp();
    }
});

