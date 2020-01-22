import * as p5 from "p5";
import {Observable, Subscriber} from "rxjs";
import {MyMouseEvent} from "./MyMouseEvent";

export interface Gesture {
  name: "left" | "right" | "down" | "up"
}

export class MouseGestures {

  private readonly firstPos: p5.Vector;
  private readonly secondPos: p5.Vector;

  public data$: Observable<Gesture>;
  private observer: Subscriber<Gesture>;

  constructor(private p: p5, private mouseEvent$: Observable<MyMouseEvent>) {
    this.firstPos = p.createVector(0, 0);
    this.secondPos = p.createVector(0, 0);

    this.data$ = new Observable<Gesture>((observer: Subscriber<Gesture>) => {
      this.observer = observer;
    });

    mouseEvent$.subscribe((mouseEvent) => {
      switch (mouseEvent.type) {
        case "mouseDown":
          this.firstPos.set(this.p.mouseX, this.p.mouseY);
          break;

        case "mouseUp":
          this.secondPos.set(this.p.mouseX, this.p.mouseY);

          let diff = this.secondPos.copy().sub(this.firstPos);

          if (diff.mag() > 20) {
            if (diff.x >= Math.abs(diff.y)) {
              this.observer.next({name: "right"});
            } else if (-diff.x >= Math.abs(diff.y)) {
              this.observer.next({name: "left"});
            } else if (diff.y >= Math.abs(diff.x)) {
              this.observer.next({name: "down"});
            } else if (-diff.y >= Math.abs(diff.x)) {
              this.observer.next({name: "up"});
            }
          }
          break;
      }
    });
  }

}

