import {Component, ElementRef, HostListener, ViewChild} from '@angular/core';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent {
  title = 'pwa2048';
  windowSize: { width: number, height: number };

  constructor(private container: ElementRef) {
  }

  ngOnInit() {
    this.windowSize = {
      width: window.innerWidth,
      height: window.innerHeight
    };
    this.container.nativeElement.addEventListener("touchstart", (e)=>e.preventDefault());
    this.container.nativeElement.addEventListener("touchmove", (e)=>e.preventDefault());
  }

  @HostListener('window:resize', ['$event'])
  onResize(event) {
    this.windowSize = {
      width: window.innerWidth,
      height: window.innerHeight
    };
  }

  getCanvasSize(): Size {
    let size = Math.min(Math.min(
      Math.min(Math.max(this.windowSize.height * 0.7, 400), this.windowSize.height),
      Math.min(Math.max(this.windowSize.width * 0.7, 400), this.windowSize.width)
    ), this.windowSize.height * 0.69);

    return {
      width: size,
      height: size
    };
  }
}

interface Size {
  width: number,
  height: number
}
