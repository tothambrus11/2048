import {Component, Input, OnInit, OnChanges, SimpleChanges, ViewChild, ElementRef, HostListener} from '@angular/core';
import * as P5 from "p5";
import {Observable, Subscriber} from "rxjs";
import {MyMouseEvent} from "./MyMouseEvent";
import {GameControls} from "./GameControls";

@Component({
  selector: 'game',
  templateUrl: './game.component.html',
  styleUrls: ['./game.component.scss']
})
export class GameComponent implements OnInit, OnChanges {

  private p;

  @Input()
  width: number;

  @Input()
  height: number;

  @ViewChild("gameContainer", {static: false}) gameContainer;

  private gameControls: GameControls;

  mouseObservable: Observable<MyMouseEvent>;
  mouseObserver: Subscriber<MyMouseEvent>;

  keyboardObservable: Observable<KeyboardEvent>;
  keyboardObserver: Subscriber<KeyboardEvent>;

  constructor(private elRef: ElementRef) {
    this.keyboardObservable = new Observable<KeyboardEvent>((observer) => {
      this.keyboardObserver = observer;
    });
    this.mouseObservable = new Observable<MyMouseEvent>((observer) => {
      this.mouseObserver = observer;
    });
  }

  ngOnInit() {
    console.log(this.elRef.nativeElement);
    this.p = new P5((p: P5) => {
      p.setup = () => {
        p.createCanvas(this.width, this.height);

        this.gameControls = new GameControls(this.p, this.mouseObservable, this.keyboardObservable);

        this.gameControls.controlEvent$.subscribe(((value) => {
          p.background(0);
          switch (value.name) {
            case "push-left":
              p.rect(0, 0, p.width / 3, p.height);
              break;
            case "push-right":
              p.rect(2 * p.width / 3, 0, p.width / 3, p.height);
              break;
            case "push-down":
              p.rect(0, 2 * p.height / 3,  p.width, p.height/3);
              break;
            case "push-up":
              p.rect(0, 0, p.width, p.height / 3);
              break;

          }
          console.log(value);
        }));
      };
      p.draw = () => {

      };

      p.touchStarted = () => {
        this.mouseObserver.next({
          type: "mouseDown"
        })
      };

      p.mousePressed = () => {
        this.mouseObserver.next({
          type: "mouseDown"
        })
      };

      p.touchEnded = () => {
        this.mouseObserver.next({
          type: "mouseUp"
        })
      };


    }, this.elRef.nativeElement.querySelector("#game-container"));
  }

  @HostListener('document:keydown', ['$event'])
  onKeyDown(event: KeyboardEvent) {
    this.keyboardObserver.next(event);
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes.width.previousValue != changes.width.currentValue || changes.height.previousValue != changes.height.currentValue) {
      if (this.p) {
        this.p.resizeCanvas(this.width, this.height);
      }
    }
  }
}

