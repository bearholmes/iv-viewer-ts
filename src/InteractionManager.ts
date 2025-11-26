import { getTouchPointsDistance, ZOOM_CONSTANT, MOUSE_WHEEL_COUNT } from './util';
import type { EventManager } from './EventManager';
import type Slider from './Slider';

/**
 * InteractionManager - User interaction handling for ImageViewer
 * Manages pinch zoom, wheel zoom, and double-tap zoom gestures
 *
 * Phase 7: Extracted from ImageViewer to separate interaction logic
 */

interface InteractionElements {
  imageWrap: HTMLElement;
  container: HTMLElement;
}

interface InteractionOptions {
  zoomOnMouseWheel: boolean;
  zoomValue: number;
  maxZoom: number;
}

interface InteractionCallbacks {
  getState: () => { loaded: boolean; zoomValue: number; zooming: boolean };
  setZooming: (zooming: boolean) => void;
  clearFrames: () => void;
  zoom: (value: number, point?: { x: number; y: number }) => void;
  resetZoom: () => void;
  showSnapView: () => void;
  getSlider: (key: string) => Slider | undefined;
  getScrollPosition: () => { x: number; y: number };
}

export class InteractionManager {
  // REFACTOR: Extract magic constants for better maintainability
  private static readonly DOUBLE_TAP_INTERVAL_MS = 500;
  private static readonly DOUBLE_TAP_DISTANCE_PX = 50;
  private static readonly DOUBLE_TAP_ZOOM_LEVEL = 200;

  constructor(
    private elements: InteractionElements,
    private eventManager: EventManager,
    private options: InteractionOptions,
    private callbacks: InteractionCallbacks
  ) {}

  /**
   * Set up all interaction handlers
   */
  setupInteractions(): void {
    this.setupPinchZoom();
    this.setupWheelZoom();
    this.setupDoubleTap();
  }

  /**
   * Enables pinch-to-zoom gesture on touch devices
   * Calculates zoom based on distance between two touch points
   */
  setupPinchZoom(): void {
    const { imageWrap, container } = this.elements;

    const onPinchStart = (eStart: TouchEvent) => {
      const { loaded, zoomValue: startZoomValue } = this.callbacks.getState();

      if (!loaded) return;

      const touch0 = eStart.touches[0];
      const touch1 = eStart.touches[1];

      if (!(touch0 && touch1)) {
        return;
      }

      this.callbacks.setZooming(true);

      const contOffset = container.getBoundingClientRect();

      // find distance between two touch points
      const startDist = getTouchPointsDistance(eStart.touches);

      const scroll = this.callbacks.getScrollPosition();

      // Calculate the center point for zoom
      const center = this.calculatePinchCenter(touch0, touch1, contOffset, scroll);

      const moveListener = (eMove: TouchEvent) => {
        const newDist = getTouchPointsDistance(eMove.touches);

        // Calculate new zoom value based on distance change
        const zoomValue = this.calculatePinchZoom(startZoomValue, startDist, newDist);

        this.callbacks.zoom(zoomValue, center);
      };

      const endListener = (eEnd: TouchEvent) => {
        this.eventManager.off('pinchMove');
        this.eventManager.off('pinchEnd');
        this.callbacks.setZooming(false);
        // properly resume move event if one finger remains
        if (eEnd.touches.length === 1) {
          this.callbacks.getSlider('imageSlider')?.startHandler(eEnd);
        }
      };

      // Remove old pinch events if already assigned
      this.eventManager.off('pinchMove');
      this.eventManager.off('pinchEnd');

      // Register dynamic pinch events
      this.eventManager.on('pinchMove', document, 'touchmove', moveListener as EventListener);
      this.eventManager.on('pinchEnd', document, 'touchend', endListener as EventListener);
    };

    this.eventManager.on('pinchStart', imageWrap, 'touchstart', onPinchStart as EventListener);
  }

  /**
   * Enables mouse wheel zoom functionality
   * Uses ZOOM_CONSTANT (15) for zoom speed and MOUSE_WHEEL_COUNT (5) to prevent excessive zooming
   */
  setupWheelZoom(): void {
    const { container, imageWrap } = this.elements;

    let changedDelta = 0;

    const onMouseWheel = (e: WheelEvent) => {
      const { loaded, zoomValue } = this.callbacks.getState();

      if (!this.options.zoomOnMouseWheel || !loaded) return;

      // clear all animation frame and interval
      this.callbacks.clearFrames();

      // Get normalized wheel delta
      const delta = this.normalizeWheelDelta(e);

      const newZoomValue = (zoomValue * (100 + delta * ZOOM_CONSTANT)) / 100;

      if (!(newZoomValue >= 100 && newZoomValue <= this.options.maxZoom)) {
        changedDelta += Math.abs(delta);
      } else {
        changedDelta = 0;
      }

      e.preventDefault();

      if (changedDelta > MOUSE_WHEEL_COUNT) return;

      const contOffset = container.getBoundingClientRect();

      // Calculate mouse position relative to container
      const position = this.getMousePositionRelativeToContainer(e, contOffset);

      this.callbacks.zoom(newZoomValue, position);

      // show the snap viewer
      this.callbacks.showSnapView();
    };

    this.eventManager.on('wheelZoom', imageWrap, 'wheel', onMouseWheel as EventListener);
  }

  /**
   * Enables double-click/tap to zoom functionality
   * Detects double clicks within 500ms and 50px distance threshold
   * Toggles between base zoom and 200% zoom
   */
  setupDoubleTap(): void {
    const { imageWrap } = this.elements;

    let touchTime = 0;
    let point: { x: number; y: number };

    const onDoubleTap = (e: MouseEvent) => {
      const { zoomValue } = this.callbacks.getState();

      if (touchTime === 0) {
        touchTime = Date.now();
        point = {
          x: e.pageX,
          y: e.pageY,
        };
      } else if (
        Date.now() - touchTime < InteractionManager.DOUBLE_TAP_INTERVAL_MS &&
        Math.abs(e.pageX - point.x) < InteractionManager.DOUBLE_TAP_DISTANCE_PX &&
        Math.abs(e.pageY - point.y) < InteractionManager.DOUBLE_TAP_DISTANCE_PX
      ) {
        if (zoomValue === this.options.zoomValue) {
          this.callbacks.zoom(InteractionManager.DOUBLE_TAP_ZOOM_LEVEL);
        } else {
          this.callbacks.resetZoom();
        }
        touchTime = 0;
      } else {
        touchTime = 0;
      }
    };

    this.eventManager.on('doubleTapClick', imageWrap, 'click', onDoubleTap as EventListener);
  }

  /**
   * Cleanup all interaction handlers
   * Note: EventManager.destroy() will handle event cleanup
   */
  destroy(): void {
    // Events are managed by EventManager and will be cleaned up when it's destroyed
    // No additional cleanup needed here
  }

  // Private helper methods

  /**
   * Calculate the center point between two touch points
   */
  private calculatePinchCenter(
    touch0: Touch,
    touch1: Touch,
    containerOffset: DOMRect,
    scroll: { x: number; y: number }
  ): { x: number; y: number } {
    return {
      x: (touch1.pageX + touch0.pageX) / 2 - (containerOffset.left + scroll.x),
      y: (touch1.pageY + touch0.pageY) / 2 - (containerOffset.top + scroll.y),
    };
  }

  /**
   * Calculate zoom value based on pinch distance change
   */
  private calculatePinchZoom(
    startZoomValue: number,
    startDist: number,
    currentDist: number
  ): number {
    return startZoomValue + (currentDist - startDist) / 2;
  }

  /**
   * Normalize wheel delta across browsers
   */
  private normalizeWheelDelta(e: WheelEvent): number {
    // P2-2 FIX: Type-safe cross-browser wheel delta
    // Legacy browsers used wheelDelta (IE) and detail (Firefox, deprecated)
    const legacyEvent = e as WheelEvent & { wheelDelta?: number };
    return Math.max(-1, Math.min(1, legacyEvent.wheelDelta || -e.detail || -e.deltaY));
  }

  /**
   * Calculate mouse position relative to container
   */
  private getMousePositionRelativeToContainer(
    e: { pageX: number; pageY: number },
    containerOffset: DOMRect
  ): { x: number; y: number } {
    const scroll = this.callbacks.getScrollPosition();
    return {
      x: e.pageX - (containerOffset.left + scroll.x),
      y: e.pageY - (containerOffset.top + scroll.y),
    };
  }
}
