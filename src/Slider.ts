import { noop } from './util';

class Slider {
   private onStart: any;
   private onMove: any;
   private onEnd: any;
   private isSliderEnabled: any;
   private container: any;
   private touchMoveEvent: string | undefined;
   private touchEndEvent: string |undefined;
   private sx!: number;
   private sy!: number;
  constructor (container: any, {
    onStart, onMove, onEnd, isSliderEnabled,
  }: {
    onStart?:(x: any, y: { x: number; y: number }) => void;
    onMove?: (x: any, y: { dx: number; dy: number; mx: number; my: number }) => void;
    onEnd?: () => void;
    isSliderEnabled?: any;
  }) {
    this.container = container;
    this.isSliderEnabled = isSliderEnabled;
    this.onStart = onStart || noop;
    this.onMove = onMove || noop;
    this.onEnd = onEnd || noop;
  }

  startHandler = (eStart: Event) => {
    if (!this.isSliderEnabled()) return;

    this.removeListeners();

    eStart.preventDefault();

    const { moveHandler, endHandler, onStart } = this;

    const isTouchEvent = eStart.type === 'touchstart' || eStart.type === 'touchend';

    let sx: number;
    let sy: number;
    if (isTouchEvent) {
      const touchEvent = eStart as TouchEvent; // Cast to TouchEvent type
      this.touchMoveEvent = 'touchmove';
      this.touchEndEvent = 'touchend';
      sx = touchEvent.touches[0].clientX;
      sy = touchEvent.touches[0].clientY;
    } else {
      const mouseEvent = eStart as MouseEvent; // Cast to MouseEvent type
      this.touchMoveEvent = 'mousemove';
      this.touchEndEvent = 'mouseup';
      sx = mouseEvent.clientX;
      sy = mouseEvent.clientY;
    }
    this.sx = sx;
    this.sy = sy;

    onStart(eStart, {
      x: this.sx,
      y: this.sy,
    });

    // add listeners
    document.addEventListener(this.touchMoveEvent, moveHandler);
    document.addEventListener(this.touchEndEvent, endHandler);
    /*
      add end handler in context menu as well.
      As mouseup event is not trigger on context menu open
      https://bugs.chromium.org/p/chromium/issues/detail?id=506801
    */
    document.addEventListener('contextmenu', endHandler);
  };

  moveHandler = (eMove: Event) => {
    if (!this.isSliderEnabled()) return;

    eMove.preventDefault();
    const { sx, sy, onMove } = this;

    const isTouchEvent = this.touchMoveEvent === 'touchmove';

    // get the coordinates
    let mx:number;
    let my:number;
    if (isTouchEvent) {
      const touchEvent = eMove as TouchEvent; // Cast to TouchEvent type
      mx = touchEvent.touches[0].clientX;
      my = touchEvent.touches[0].clientY;
    } else {
      const mouseEvent = eMove as MouseEvent; // Cast to MouseEvent type
      mx = mouseEvent.clientX;
      my = mouseEvent.clientY;
    }


    onMove(eMove, {
      dx: mx - sx,
      dy: my - sy,
      mx,
      my,
    });
  };

  endHandler = () => {
    if (!this.isSliderEnabled()) return;
    this.removeListeners();
    this.onEnd();
  };

  // remove previous events if it's not removed
  // - Case when while sliding mouse moved out of document and released there
  removeListeners () {
    if (this.touchMoveEvent) document.removeEventListener(this.touchMoveEvent, this.moveHandler);
    if (this.touchEndEvent) document.removeEventListener(this.touchEndEvent, this.endHandler);
    document.removeEventListener('contextmenu', this.endHandler);
  }

  init () {
    ['touchstart', 'mousedown'].forEach((evt) => {
      this.container.addEventListener(evt, this.startHandler);
    });
  }

  destroy () {
    ['touchstart', 'mousedown'].forEach((evt) => {
      this.container.removeEventListener(evt, this.startHandler);
    });
    this.removeListeners();
  }
}

export default Slider;
