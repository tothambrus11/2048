import {MyMouseEvent} from "./MyMouseEvent";
import {Gesture, MouseGestures} from "./MouseGestures";

import {Observable, Subscriber} from "rxjs";
import * as p5 from "p5";
import {GameComponent} from "./game.component";

export interface GameControlEvent {
  name: "push-left" | "push-right" | "push-down" | "push-up",
  data?: any
}

export class GameControls {
  mouseGestures: MouseGestures;

  public controlEvent$: Observable<GameControlEvent>;
  public observer: Subscriber<GameControlEvent>;

  constructor(private p: p5, private mouseEvent$: Observable<MyMouseEvent>, private keyboardEvent$: Observable<KeyboardEvent>, gameComponent: GameComponent) {
    this.mouseGestures = new MouseGestures(p, mouseEvent$);

    this.controlEvent$ = new Observable((observer: Subscriber<GameControlEvent>) => {
      this.observer = observer;
    });

    this.mouseGestures.data$.subscribe((gesture: Gesture) => {
      if(gesture.from.y > gameComponent.height && gesture.from.x > 0 && gesture.from.x < gameComponent.width){
        return;
      }
      switch (gesture.name) {
        case "left":
          this.observer.next({name: "push-left"});
          break;
        case "right":
          this.observer.next({name: "push-right"});
          break;
        case "up":
          this.observer.next({name: "push-up"});
          break;
        case "down":
          this.observer.next({name: "push-down"});
          break;
      }
    });

    this.keyboardEvent$.subscribe((evt: KeyboardEvent) => {
      switch (evt.key) {
        case "ArrowLeft":
          this.observer.next({name: "push-left"});
          break;
        case "ArrowRight":
          this.observer.next({name: "push-right"});
          break;
        case "ArrowDown":
          this.observer.next({name: "push-down"});
          break;
        case "ArrowUp":
          this.observer.next({name: "push-up"});
          break;
      }
    });


  }
}
