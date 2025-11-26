import { easeOutQuart } from './util';

/**
 * Zoom animation frame result
 * Contains calculated zoom level and position for a single animation frame
 */
export interface ZoomFrame {
  /** Current zoom percentage for this frame */
  zoom: number;
  /** Image width in pixels at current zoom */
  width: number;
  /** Image height in pixels at current zoom */
  height: number;
  /** Left position constrained to bounds */
  left: number;
  /** Top position constrained to bounds */
  top: number;
}

/**
 * Bounding box constraints for zoom positioning
 */
export interface ZoomBounds {
  /** Base left position (centered at 100% zoom) */
  baseLeft: number;
  /** Base top position (centered at 100% zoom) */
  baseTop: number;
  /** Right boundary (container width - baseLeft) */
  baseRight: number;
  /** Bottom boundary (container height - baseTop) */
  baseBottom: number;
}

/**
 * Encapsulates zoom animation calculation logic
 * REFACTOR: Extracted from ImageViewer.zoom() for better separation (Issue A1.2/C3.3)
 *
 * Handles:
 * - Eased interpolation between zoom levels
 * - Position calculation to keep zoom point fixed
 * - Boundary constraint to prevent showing empty space
 *
 * @example
 * ```typescript
 * const animation = new ZoomAnimation({
 *   currentZoom: 100,
 *   targetZoom: 200,
 *   currentLeft: 50,
 *   currentTop: 50,
 *   zoomPoint: { x: 400, y: 300 },
 *   imageDim: { w: 800, h: 600 },
 *   bounds: { baseLeft: 100, baseTop: 50, baseRight: 900, baseBottom: 650 },
 *   totalFrames: 16
 * });
 *
 * // Get frame data for each animation step
 * const frame = animation.getFrame(5);
 * // frame = { zoom: 150, width: 1200, height: 900, left: 25, top: 25 }
 * ```
 */
export class ZoomAnimation {
  private readonly currentZoom: number;
  private readonly targetZoom: number;
  private readonly currentLeft: number;
  private readonly currentTop: number;
  private readonly zoomPoint: { x: number; y: number };
  private readonly imageDim: { w: number; h: number };
  private readonly bounds: ZoomBounds;
  private readonly totalFrames: number;

  constructor(config: {
    currentZoom: number;
    targetZoom: number;
    currentLeft: number;
    currentTop: number;
    zoomPoint: { x: number; y: number };
    imageDim: { w: number; h: number };
    bounds: ZoomBounds;
    totalFrames: number;
  }) {
    this.currentZoom = config.currentZoom;
    this.targetZoom = config.targetZoom;
    this.currentLeft = config.currentLeft;
    this.currentTop = config.currentTop;
    this.zoomPoint = config.zoomPoint;
    this.imageDim = config.imageDim;
    this.bounds = config.bounds;
    this.totalFrames = config.totalFrames;
  }

  /**
   * Calculates zoom frame data for a specific animation step
   * Uses easeOutQuart easing for smooth deceleration
   * @param step - Current animation step (0 to totalFrames)
   * @returns Frame data with zoom level and constrained position
   */
  getFrame(step: number): ZoomFrame {
    // Calculate interpolated zoom using easing function
    const tickZoom = easeOutQuart(
      step,
      this.currentZoom,
      this.targetZoom - this.currentZoom,
      this.totalFrames
    );

    // Calculate new dimensions at target zoom
    const width = (this.imageDim.w * tickZoom) / 100;
    const height = (this.imageDim.h * tickZoom) / 100;

    // Calculate position to keep zoom point fixed
    const position = this.calculatePosition(tickZoom);

    // Constrain position to prevent showing empty space
    const constrainedPosition = this.constrainToBounds(position, width, height);

    return {
      zoom: tickZoom,
      width,
      height,
      left: constrainedPosition.left,
      top: constrainedPosition.top,
    };
  }

  /**
   * Calculates new image position to keep zoom point fixed during zoom
   * Uses ratio-based calculation: newPos = -((point - currentPos) * ratio - point)
   * @param tickZoom - Current zoom level for this frame
   * @returns Unconstrained position
   */
  private calculatePosition(tickZoom: number): { left: number; top: number } {
    const ratio = tickZoom / this.currentZoom;

    const left = -((this.zoomPoint.x - this.currentLeft) * ratio - this.zoomPoint.x);
    const top = -((this.zoomPoint.y - this.currentTop) * ratio - this.zoomPoint.y);

    return { left, top };
  }

  /**
   * Constrains position to prevent showing empty space around image
   * Ensures image covers container when zoomed in
   * @param position - Unconstrained position from calculatePosition
   * @param width - Image width at current zoom
   * @param height - Image height at current zoom
   * @returns Constrained position
   */
  private constrainToBounds(
    position: { left: number; top: number },
    width: number,
    height: number
  ): { left: number; top: number } {
    let { left, top } = position;
    const { baseLeft, baseTop, baseRight, baseBottom } = this.bounds;

    // Constrain left and top (prevent image from moving too far right/down)
    left = Math.min(left, baseLeft);
    top = Math.min(top, baseTop);

    // Constrain right edge (prevent showing empty space on right)
    if (left + width < baseRight) {
      left = baseRight - width;
    }

    // Constrain bottom edge (prevent showing empty space on bottom)
    if (top + height < baseBottom) {
      top = baseBottom - height;
    }

    return { left, top };
  }
}
