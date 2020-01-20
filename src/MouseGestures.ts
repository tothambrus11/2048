import {EventEmitter} from "./EventEmitter";
import * as p5 from "p5";

export interface Gesture {
    name: string
}

export class MouseGestures extends EventEmitter {

    private readonly firstPos: p5.Vector;
    private readonly secondPos: p5.Vector;

    constructor(private p: p5) {
        super();
        this.firstPos = p.createVector(0, 0);
        this.secondPos = p.createVector(0, 0);
    }

    onMouseDown() {
        this.firstPos.set(this.p.mouseX, this.p.mouseY);
    }

    onMouseUp() {
        this.secondPos.set(this.p.mouseX, this.p.mouseY);

        let diff = this.secondPos.copy().sub(this.firstPos);
        //background(255);
        if (diff.mag() > 20) {
            if (diff.x >= Math.abs(diff.y)) {
                this.emit("gesture", {name: "right"})
            } else if (-diff.x >= Math.abs(diff.y)) {
                this.emit("gesture", {name: "left"})
            } else if (diff.y >= Math.abs(diff.x)) {
                this.emit("gesture", {name: "down"})
            } else if (-diff.y >= Math.abs(diff.x)) {
                this.emit("gesture", {name: "up"})
            }
        }
    }

}

