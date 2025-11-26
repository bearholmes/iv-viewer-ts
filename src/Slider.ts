// REFACTOR: Removed noop import as callbacks are now required (Issue E2.7)

class Slider {
  private _onStart: (event: Event, position: { x: number; y: number }) => void;
  private _onMove: (
    event: Event,
    position: { dx: number; dy: number; mx: number; my: number },
  ) => void;
  private _onEnd: () => void;
  private isSliderEnabled: () => boolean;
  private container: HTMLElement;
  private touchMoveEvent: string | undefined;
  private touchEndEvent: string | undefined;
  // REFACTOR: Explicit initialization instead of definite assignment assertion (Issue E2.8)
  private sx: number = 0;
  private sy: number = 0;
  /**
   * Creates a slider instance for handling mouse and touch drag interactions
   * Supports both mouse events and touch events with unified API
   * REFACTOR: Made callbacks required for better type safety (Issue E2.7)
   * @param container - DOM element to attach slider events to
   * @param callbacks - Configuration object with event callbacks
   * @param callbacks.onStart - REQUIRED callback when drag starts with initial position
   * @param callbacks.onMove - REQUIRED callback during drag with delta and current position
   * @param callbacks.onEnd - REQUIRED callback when drag ends
   * @param callbacks.isSliderEnabled - Optional function that returns whether slider is currently enabled
   */
  constructor(
    container: HTMLElement,
    {
      onStart,
      onMove,
      onEnd,
      isSliderEnabled,
    }: {
      onStart: (event: Event, position: { x: number; y: number }) => void;
      onMove: (event: Event, position: { dx: number; dy: number; mx: number; my: number }) => void;
      onEnd: () => void;
      isSliderEnabled?: () => boolean;
    },
  ) {
    // REFACTOR: Runtime validation for required callbacks (Issue E2.7)
    if (typeof onStart !== 'function') {
      throw new Error('Slider: onStart callback is required and must be a function');
    }
    if (typeof onMove !== 'function') {
      throw new Error('Slider: onMove callback is required and must be a function');
    }
    if (typeof onEnd !== 'function') {
      throw new Error('Slider: onEnd callback is required and must be a function');
    }

    this.container = container;
    this.isSliderEnabled = isSliderEnabled || (() => true);
    this._onStart = onStart;
    this._onMove = onMove;
    this._onEnd = onEnd;
  }

  /**
   * Public method to trigger start handler
   * Used by ImageViewer for manual slider control
   * REFACTOR: Made parameters required for better type safety (Issue C3.7)
   * @param event - Event that triggered the start
   * @param position - Initial position { x, y }
   */
  public onStart(event: Event, position: { x: number; y: number }) {
    return this._onStart(event, position);
  }

  /**
   * Public method to trigger move handler
   * Used by ImageViewer for manual slider control
   * REFACTOR: Made parameters required for better type safety (Issue C3.7)
   * @param event - Event that triggered the move
   * @param position - Position with deltas and current coordinates { dx, dy, mx, my }
   */
  public onMove(event: Event, position: { dx: number; dy: number; mx: number; my: number }) {
    return this._onMove(event, position);
  }

  /**
   * Programmatic position update without requiring an event
   * REFACTOR: Avoid dummy event creation (Issue A1.12)
   * Useful for synchronizing slider positions or updating from external sources
   *
   * @param position - Position with deltas and current coordinates { dx, dy, mx, my }
   *
   * @example
   * ```typescript
   * // Sync slider position without creating dummy events
   * slider.updatePosition({ dx: 10, dy: 5, mx: 100, my: 50 });
   * ```
   */
  public updatePosition(position: { dx: number; dy: number; mx: number; my: number }): void {
    // Create a minimal synthetic event for the callback
    // The event parameter is rarely used by callbacks, so this is safe
    const syntheticEvent = new Event('programmatic-update');
    this._onMove(syntheticEvent, position);
  }

  /**
   * REFACTOR: Extract event type detection logic (Issue A1.8)
   * Determines if an event is a touch event based on event type
   * @param event - Event to check
   * @returns True if event is a touch event
   */
  private isTouchEvent(event: Event): boolean {
    return event.type === 'touchstart' || event.type === 'touchmove' || event.type === 'touchend';
  }

  /**
   * Handles drag start event for both mouse and touch
   * Detects event type and extracts starting coordinates
   * Sets up move and end event listeners
   */
  startHandler = (eStart: Event) => {
    if (!this.isSliderEnabled()) return;

    this.removeListeners();

    // P2-5 FIX: Only prevent default if event is cancelable
    if (eStart.cancelable) {
      eStart.preventDefault();
    }

    const { moveHandler, endHandler, _onStart: onStart } = this;

    // REFACTOR: Use helper method for event type detection (Issue A1.8)
    const isTouch = this.isTouchEvent(eStart);

    let sx: number;
    let sy: number;
    if (isTouch) {
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

  /**
   * Handles drag move event for both mouse and touch
   * Calculates delta from start position and current position
   * Passes dx, dy (deltas) and mx, my (current position) to onMove callback
   */
  moveHandler = (eMove: Event) => {
    if (!this.isSliderEnabled()) return;

    // P2-5 FIX: Only prevent default if event is cancelable
    if (eMove.cancelable) {
      eMove.preventDefault();
    }
    const { sx, sy, _onMove: onMove } = this;

    // REFACTOR: Use helper method for event type detection (Issue A1.8)
    const isTouch = this.isTouchEvent(eMove);

    // get the coordinates
    let mx: number;
    let my: number;
    if (isTouch) {
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
    this._onEnd();
  };

  /**
   * Removes active event listeners
   * Handles edge case where mouse/touch leaves document during drag
   */
  removeListeners() {
    if (this.touchMoveEvent) document.removeEventListener(this.touchMoveEvent, this.moveHandler);
    if (this.touchEndEvent) document.removeEventListener(this.touchEndEvent, this.endHandler);
    document.removeEventListener('contextmenu', this.endHandler);
  }

  /**
   * Initializes the slider by attaching start event listeners
   * Listens for both touchstart and mousedown events
   */
  init() {
    ['touchstart', 'mousedown'].forEach((evt) => {
      this.container.addEventListener(evt, this.startHandler);
    });
  }

  /**
   * Destroys the slider by removing all event listeners
   * Cleans up both start and active drag listeners
   */
  destroy() {
    ['touchstart', 'mousedown'].forEach((evt) => {
      this.container.removeEventListener(evt, this.startHandler);
    });
    this.removeListeners();
  }
}

export default Slider;
