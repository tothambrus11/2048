import {Component, Input, OnInit, OnChanges, SimpleChanges, ViewChild, ElementRef, HostListener} from '@angular/core';
import * as P5 from "p5";
import {Observable, Subscriber} from "rxjs";
import {MyMouseEvent} from "./MyMouseEvent";
import {GameControlEvent, GameControls} from "./GameControls";

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

  @Input()
  colNum: number;

  @Input()
  accentColor: number[];

  @Input()
  backgroundColor: number[];

  map: number[][];

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
        let fontName = getComputedStyle(document.body).getPropertyValue("--base-font").split(",")[0];
        fontName = fontName.substr(2, fontName.length - 3);
        p.textFont(fontName);

        this.gameControls = new GameControls(this.p, this.mouseObservable, this.keyboardObservable);

        this.startGame(this.colNum);

        this.gameControls.controlEvent$.subscribe(((value) => {

          let oldMap = this.map;
          this.map = this.move(this.map, value);

          if (this.mapChanged(this.map, oldMap)) {
            this.map = this.addRandomNumber(this.map);
          }
          else if(!this.canMove(this.map)){
            alert("GAMEOVER");
          }


          console.log(value);
        }));
      };
      p.draw = () => {
        this.drawState(p);
      };

      p.touchStarted = () => {
        if (this.mouseObserver) {
          this.mouseObserver.next({
            type: "mouseDown"
          })
        }
      };

      p.mousePressed = () => {
        if (this.mouseObserver) {
          this.mouseObserver.next({
            type: "mouseDown"
          })
        }
      };

      p.touchEnded = () => {
        if (this.mouseObserver) {
          this.mouseObserver.next({
            type: "mouseUp"
          })
        }
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

  startGame(size: number) {
    this.map = [];
    for (let i = 0; i < size; i++) {
      this.map.push([]);
      for (let j = 0; j < size; j++) {
        this.map[i].push(0);
      }
    }

    this.map = this.addRandomNumber(this.map);
    this.map = this.addRandomNumber(this.map);

  }

  getFreeTiles(map: number[][]): { row: number, column: number }[] {
    let freeTiles: { row: number, column: number }[] = [];
    map.forEach((row, rowNum) => {
      row.forEach((tile, colNum) => {
        if (tile === 0) freeTiles.push({row: rowNum, column: colNum})
      })
    });
    return freeTiles;
  }

  addRandomNumber(_map: number[][]): number[][] {
    let tile = this.getRandomFreeTile(_map);
    let value = Math.random() < 0.9 ? 2 : 4;
    let map = JSON.parse(JSON.stringify(_map));
    map[tile.row][tile.column] = value;
    return map;
  }

  getRandomFreeTile(map: number[][]) {
    let freeTiles = this.getFreeTiles(map);
    let index = Math.floor(Math.random() * freeTiles.length);
    return freeTiles[index];
  }

  move(map: number[][], event: GameControlEvent): number[][] {
    switch (event.name) {
      case "push-left":
        return this.slideLeftMap(map);
      case "push-right":
        return this.rotateMatrix(
          this.slideLeftMap(
            this.rotateMatrix(map, 2)
          ), -2);
      case "push-up":
        return this.rotateMatrix(
          this.slideLeftMap(
            this.rotateMatrix(map, 1)
          ), -1);
      case "push-down":
        return this.rotateMatrix(
          this.slideLeftMap(
            this.rotateMatrix(map, -1)
          ), 1);
    }
  }

  slideLeftMap(_map: number[][]): number[][] {
    let map = JSON.parse(JSON.stringify(_map)); // Clone map;
    for (let i = 0; i < map.length; i++) {
      map[i] = this.combineNumbers(this.slideLeftNumber(map[i]));
    }
    return map;
  }

  rotateMatrix<T>(matrix: T[][], deltaDir): T[][] {
    deltaDir = (deltaDir + 4) % 4;

    let newMatrix: T[][] = matrix;
    for (let rotationCount = 0; rotationCount < deltaDir; rotationCount++) {
      newMatrix = this.rotateMatrix90Deg(newMatrix);
    }

    return newMatrix;
  }

  mapChanged(map1, map2): boolean {
    if (!Array.isArray(map1) && !Array.isArray(map2)) {
      return map1 !== map2;
    }

    if (map1.length !== map2.length) {
      return true;
    }

    for (let i = 0, len = map1.length; i < len; i++) {
      if (this.mapChanged(map1[i], map2[i])) {
        return true;
      }
    }
    return false;
  }

  /**
   * N*N matrix
   * @param oldMatrix
   */
  rotateMatrix90Deg<T>(oldMatrix: T[][]): T[][] {
    return oldMatrix[0].map(function (col, i) {
      return oldMatrix.map(function (row) {
        return row[oldMatrix.length - 1 - i];
      });
    });
  }

  slideLeftNumber(array: number[]): number[] {
    let array2 = array.filter(value => value != 0);
    while (array2.length < array.length) array2.push(0);
    return array2;
  }

  combineNumbers(_array: number[]): number[] {
    let array = [..._array]; // Tömb klónozása
    let array2 = [];

    let a = 0;
    for (let i = 0; i < array.length; i++) {
      if (array[i] === 0) continue;

      if (i < array.length) {
        if (array[i] === array[i + 1]) {
          array2.push(array[i] * 2);
          array[i] = 0;
          array[i + 1] = 0;
          a++;
        } else {
          array2.push(array[i]);
        }
      } else { // Utolsó elem (már tuti nem 0)
        array2.push(array[i]);
      }

    }
    while (array2.length < _array.length) array2.push(0);

    return array2;
  }

  drawState(p: P5) {
    p.background(this.backgroundColor);

    p.push();
    p.translate(0.1 * this.unit, 0.1 * this.unit);

    for (let i = 0; i < this.map.length; i++) {
      for (let j = 0; j < this.map[0].length; j++) {
        if (this.map[i][j] !== 0) {
          const log = Math.log2(this.map[i][j]);
          p.noStroke();

          p.fill(70 , 66 + log*40, 245);
          //p.stroke(255, 0, 0);
          //p.strokeWeight(1);
          p.rect(j * this.unit, i * this.unit, this.unit * 0.8, this.unit * 0.8);

          p.fill(this.backgroundColor);
          p.textSize(this.unit * 0.25);

          p.textAlign(p.CENTER, p.CENTER);
          p.text(this.map[i][j], (j + 0.05) * this.unit, i * this.unit, this.unit * 0.8, this.unit * 0.8);
        }
        else{
          p.fill([255,255,255,10]);
          p.rect(j * this.unit, i * this.unit, this.unit * 0.8, this.unit * 0.8);
        }

      }
    }
    p.pop();
  }

  get unit(): number {
    return this.p.width / this.colNum;
  }

  private canMove(map: number[][]) : boolean{
    let oldMap = map;
    let tempMap;

    tempMap = this.move(oldMap, {name: "push-left"});
    if(this.mapChanged(oldMap, tempMap)) return true;

    tempMap = this.move(oldMap, {name: "push-right"});
    if(this.mapChanged(oldMap, tempMap)) return true;

    tempMap = this.move(oldMap, {name: "push-up"});
    if(this.mapChanged(oldMap, tempMap)) return true;

    tempMap = this.move(oldMap, {name: "push-down"});
    return this.mapChanged(oldMap, tempMap);



  }
}

