import {Component, HostListener} from '@angular/core';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent {
  title = 'pwa2048';
  windowSize: { width: number, height: number };

  ngOnInit() {
    this.windowSize = {
      width: window.innerWidth,
      height: window.innerHeight
    };
  }

  @HostListener('window:resize', ['$event'])
  onResize(event) {
    this.windowSize = {
      width: window.innerWidth,
      height: window.innerHeight
    };
  }

  getCanvasSize(): Size {
    let size = Math.min(
      Math.min(Math.max(this.windowSize.height * 0.7, 400), this.windowSize.height),
      Math.min(Math.max(this.windowSize.width * 0.7, 400), this.windowSize.width)
    );

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
