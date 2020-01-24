import {Component, ElementRef, HostListener, Input, OnChanges, OnInit, SimpleChanges, ViewChild} from '@angular/core';
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
  gridSize: number;

  @Input()
  accentColor: number[];

  @Input()
  backgroundColor: number[];

  previousMap: number[][];
  map: number[][];

  @ViewChild("gameContainer", {static: false}) gameContainer;

  private gameControls: GameControls;
  isAnimating: boolean = false;
  animationDuration: number = 600;
  animationStart: number;
  animations: Animation[];

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

        (document as any).fonts.ready.then(() => {
          p.textFont(fontName);
        });

        this.gameControls = new GameControls(this.p, this.mouseObservable, this.keyboardObservable);

        this.startGame(this.gridSize);

        if (1 != 1) {
          setInterval(() => {
            const moves = ["push-left", "push-right", "push-down", "push-up"];
            this.gameControls.observer.next({
                // @ts-ignore
                name: moves[Math.floor(Math.random() * 4)]
              }
            )
          }, 1);
        }

        this.gameControls.controlEvent$.subscribe((value) => {
          if (!this.isAnimating) {
            this.previousMap = JSON.parse(JSON.stringify(this.map));

            let newWorld = this.move(this.map, value, true);

            if (this.mapChanged(newWorld.map, this.map)) {
              let randomTile = this.getRandomTileToAdd(newWorld.map);
              newWorld.map[randomTile.pos.row][randomTile.pos.column] = randomTile.value;
              newWorld.animations.push({pos: randomTile.pos, type: "appear", value: randomTile.value});
              this.map = newWorld.map;
              this.animations = newWorld.animations;
              this.animationStart = p.millis();
              this.isAnimating = true;


            } else if (!this.canMove(this.map)) {
              this.isAnimating = false;
              alert("GAMEOVER");
            }
            console.log(value);
          }
        })
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
    this.isAnimating = false;
    this.previousMap = null;

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

  getFreeTiles(map: number[][]): Position[] {
    let freeTiles: Position[] = [];
    map.forEach((row, rowNum) => {
      row.forEach((tile, colNum) => {
        if (tile === 0) freeTiles.push({row: rowNum, column: colNum})
      })
    });
    return freeTiles;
  }

  addRandomNumber(_map: number[][]): number[][] {
    let rndTile = this.getRandomTileToAdd(_map);
    let newMap = JSON.parse(JSON.stringify(_map));
    newMap[rndTile.pos.row][rndTile.pos.column] = rndTile.value;

    return newMap;
  }

  getRandomTileToAdd(_map: number[][]) {
    return {
      value: Math.random() < 0.9 ? 2 : 4,
      pos: this.getRandomFreeTile(_map)
    }
  }

  getRandomFreeTile(map: number[][]) {
    let freeTiles = this.getFreeTiles(map);
    let index = Math.floor(Math.random() * freeTiles.length);
    return freeTiles[index];
  }

  move(map: number[][], event: GameControlEvent, calculateAnimations: boolean): { map: number[][], animations?: Animation[] } {
    let world: { map: number[][], animations: Animation[] };

    switch (event.name) {
      case "push-left":
        return this.slideLeftMap(map, 0, calculateAnimations);
      case "push-right":
        world = this.slideLeftMap(
          this.rotateMatrix(map, 2),
          2,
          calculateAnimations
        );
        world.map = this.rotateMatrix(world.map, -2);
        return world;
      case "push-up":
        world = this.slideLeftMap(
          this.rotateMatrix(map, 1),
          1,
          calculateAnimations
        );
        world.map = this.rotateMatrix(world.map, -1);
        return world;
      case "push-down":
        world = this.slideLeftMap(
          this.rotateMatrix(map, -1),
          -1,
          calculateAnimations
        );
        world.map = this.rotateMatrix(world.map, 1);
        return world;
    }
  }

  slideLeftMap(_map: number[][], dir: number, calculateAnimations: boolean): { map: number[][], animations: Animation[] } {
    let map = JSON.parse(JSON.stringify(_map)); // Clone map;

    let twoDAnimations: Animation[] = [];
    for (let rowNum = 0; rowNum < map.length; rowNum++) {
      let rowAnimationState = this.slideRow(map[rowNum]);
      map[rowNum] = rowAnimationState.row;

      if (calculateAnimations) {
        let animations: Animation[] = rowAnimationState.animations;
        // Convert to the actual 2D position
        for (let i = 0; i < animations.length; i++) {
          animations[i].from = this.getActualPosition(rowNum, dir, animations[i].from as number);
          animations[i].to = this.getActualPosition(rowNum, dir, animations[i].to as number);
        }
        twoDAnimations = twoDAnimations.concat(animations);

      }
    }

    if (calculateAnimations) {
      console.log("===== ANIMATIONS =====");
      console.log(twoDAnimations);
    }

    return {map, animations: twoDAnimations};
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

  slideLeft(row: number[]): RowAnimationState {
    let animations: Animation[] = [];
    let slidedRow = [];

    for (let i = 0; i < row.length; i++) {
      if (row[i]) {
        const anim: Animation = {from: i, to: slidedRow.length, type: "move", value: row[i]};
        if (anim.from != anim.to) {
          animations.push(anim);
        }
        slidedRow.push(row[i]);
      }
    }

    while (slidedRow.length < row.length) slidedRow.push(0);
    return {row: slidedRow, animations};
  }

  slideRow(row: number[]): RowAnimationState {
    let afterSlide = this.slideLeft(row);
    let afterCombine = this.combineNumbers(afterSlide.row);

    console.log("AfterCombine:");
    console.log(afterCombine.animations);
    let animations: Animation[] = this.combineAnimations(afterSlide.animations, afterCombine.animations);

    return {animations: animations, row: afterCombine.row}
  }

  combineAnimations(animations1: Animation[], animations2: Animation[]): Animation[] {
    let animations: Animation[] = [];

    let concatenated = animations1.concat(animations2).filter(a => a.from != a.to);

    let animsToMerge: number[][] = [];

    for (let i = 0; i < animations1.length; i++) {
      for (let j = animations1.length; j < concatenated.length; j++) {
        if (concatenated[i].to == concatenated[j].from && concatenated[i].to == concatenated[j].from) {
          animsToMerge.push([i, j])
        }
      }
    }

    let animsToAdd: Animation[] = [];
    for (let i = 0; i < animsToMerge.length; i++) {
      animsToAdd.push({
        type: "move",
        from: concatenated[animsToMerge[i][0]].from,
        to: concatenated[animsToMerge[i][1]].to,
        value: concatenated[animsToMerge[i][0]].value
      });

      concatenated[animsToMerge[i][0]] = null;
      concatenated[animsToMerge[i][1]] = null;
    }

    animsToAdd.forEach(value => concatenated.push(value));
    return concatenated.filter(a => !!a);
  }

  easeAnimation(from: Position, to: Position, t): Position {
    let p = this.p;
    let p1 = p.createVector(from.column, from.row);
    let p2 = p.createVector(to.column, to.row);
    let diff = P5.Vector.sub(p2, p1);
    diff.mult(this.ease(t, 4));

    let result = p1.copy().add(diff);
    return {row: result.y, column: result.x}
  }

  ease(p: number, g: number): number {
    if (p < 0.5)
      return 0.5 * Math.pow(2 * p, g);
    else
      return 1 - 0.5 * Math.pow(2 * (1 - p), g);
  }

  combineNumbers(_array: number[]): RowAnimationState {
    let animations: Animation[] = [];
    let array = [..._array]; // Tömb klónozása
    let array2 = [];

    for (let i = 0; i < array.length; i++) {
      if (array[i] === 0) continue;

      if (i < array.length) {
        if (array[i] === array[i + 1]) {
          // ANIMATE(i, i+1) => array2.length
          let anim1: Animation = {from: i, to: array2.length, type: "move", value: array[i]};
          let anim2: Animation = {from: i + 1, to: array2.length, type: "move", value: array[i + 1]};
          animations.push(anim1);
          animations.push(anim2);

          // Do actual stuff
          array2.push(array[i] * 2);
          array[i] = 0;
          array[i + 1] = 0;
        } else {
          // ANIMATE(i) => array2.length
          let anim: Animation = {from: i, to: array2.length, type: "move", value: array[i]};
          animations.push(anim);

          // Do actual stuff
          array2.push(array[i]);
        }
      } else { // Utolsó elem (már tuti nem 0)
        // ANIMATE(i) => array2.length
        let anim: Animation = {from: i, to: array2.length, type: "move", value: array[i]};
        animations.push(anim);

        // Do actual stuff
        array2.push(array[i]);

      }

    }
    while (array2.length < _array.length) array2.push(0);

    animations.filter(a => a.from !== a.to);
    return {row: array2, animations};
  }

  getActualPosition(rowNum: number, _dir: number, colNum: number): Position {
    const dir = (_dir + 4) % 4;

    switch (dir) {
      case 0:
        return {row: rowNum, column: colNum};
      case 1:
        return {row: colNum, column: this.gridSize - 1 - rowNum};
      case 2:
        return {row: this.gridSize - 1 - rowNum, column: this.gridSize - 1 - colNum};
      case 3:
        return {row: this.gridSize - 1 - colNum, column: rowNum};
    }

  }

  drawTile(position: Position, value, action?: string) {
    let p = this.p;

    if (value !== 0) {
      p.noStroke();
      p.colorMode(p.HSL);
      const log = Math.log2(value);

      p.fill(165 + (log / this.maxNumberLog) * 90, 0.3 * 255, ((log / this.maxNumberLog)) * 50 + 20);
      p.rect(position.column * this.unit, position.row * this.unit, this.unit * 0.8, this.unit * 0.8);

      p.colorMode(p.RGB);

      p.fill(this.backgroundColor);
      p.textSize(this.unit * 0.25);

      p.textAlign(p.CENTER, p.CENTER);
      p.text(value, (position.column + 0.05) * this.unit, position.row * this.unit, this.unit * 0.8, this.unit * 0.8);
    } else {
      p.noStroke();
      p.fill([0, 0, 0, 20]);
      p.rect(position.column * this.unit, position.row * this.unit, this.unit * 0.8, this.unit * 0.8);
    }
  }

  drawState(p: P5) {
    p.background(this.backgroundColor);

    p.push();
    p.translate(0.1 * this.unit, 0.1 * this.unit);

    if (this.isAnimating) {
      for (let i = 0; i < this.previousMap.length; i++) {
        for (let j = 0; j < this.previousMap[i].length; j++) {

          let found = false;
          for (const anim of this.animations) {
            if (anim.type == "move") {
              if ((anim.from as Position).row == i && (anim.from as Position).column == j) {
                found = true;
                break;
              }
            }
          }
          if (!found) {
            this.drawTile({row: i, column: j}, this.previousMap[i][j]);
          }
          else{
            this.drawTile({row: i, column: j}, 0);
          }
        }
      }

      let movingAnimations = this.animations.filter((a) => a.type == "move");

      movingAnimations.forEach((anim: Animation) => {
        p.stroke(0, 0, 0, 30);
        p.strokeWeight(50);
        p.line(this.unit * ((anim.from as Position).column + 0.4), this.unit * ((anim.from as Position).row + 0.4), this.unit * ((anim.to as Position).column + 0.4), this.unit * ((anim.to as Position).row + 0.4));
      });

      movingAnimations.forEach((anim: Animation) => {
        let animatedPos = this.easeAnimation(anim.from as Position, anim.to as Position, (p.millis() - this.animationStart) / this.animationDuration);
        this.drawTile(animatedPos, anim.value);
      });

      if (this.animationStart + this.animationDuration < p.millis()) {
        console.log("ANIMSTART: " + this.animationStart + " MILLIS: " + p.millis());
        this.isAnimating = false;
        this.animations = [];
      }

    } else {
      for (let i = 0; i < this.map.length; i++) {
        for (let j = 0; j < this.map[0].length; j++) {
          this.drawTile({row: i, column: j}, this.map[i][j]);
        }
      }
    }
    p.pop();
  }

  get unit(): number {
    return this.p.width / this.gridSize;
  }

  private canMove(map: number[][]): boolean {
    let oldMap = map;
    let tempMap: number[][];

    tempMap = this.move(oldMap, {name: "push-left"}, false).map;
    if (this.mapChanged(oldMap, tempMap)) return true;

    tempMap = this.move(oldMap, {name: "push-right"}, false).map;
    if (this.mapChanged(oldMap, tempMap)) return true;

    tempMap = this.move(oldMap, {name: "push-up"}, false).map;
    if (this.mapChanged(oldMap, tempMap)) return true;

    tempMap = this.move(oldMap, {name: "push-down"}, false).map;
    return this.mapChanged(oldMap, tempMap);
  }

  get maxNumberLog() {
    return this.gridSize * this.gridSize + 1;
  }
}

interface Animation {
  type: "appear" | "move"
  from?: number | Position
  to?: number | Position
  pos?: Position,
  value: number
}

interface RowAnimationState {
  animations: Animation[]
  row: number[]
}

interface Position {
  row: number,
  column: number
}
