import type Slider from './Slider';

/**
 * Coordinates synchronization between image slider and snap slider
 * REFACTOR: Extracted to decouple sliders from directly calling each other (Issue C3.5)
 *
 * The image slider moves the main image, and the snap slider (minimap) needs to stay in sync.
 * Previously, the image slider directly called snap slider methods, creating tight coupling.
 * This coordinator acts as a mediator, handling the synchronization logic.
 *
 * @example
 * ```typescript
 * const coordinator = new SliderCoordinator(snapSlider, {
 *   getImageDim: () => this._getImageCurrentDim(),
 *   getSnapImageDim: () => this._state.snapImageDim
 * });
 *
 * // In image slider onMove callback
 * coordinator.syncSnapSliderPosition(position);
 * ```
 */
export class SliderCoordinator {
  private snapSlider: Slider;
  private getImageDim: () => { w: number; h: number };
  private getSnapImageDim: () => { w: number; h: number };

  constructor(
    snapSlider: Slider,
    config: {
      getImageDim: () => { w: number; h: number };
      getSnapImageDim: () => { w: number; h: number };
    },
  ) {
    this.snapSlider = snapSlider;
    this.getImageDim = config.getImageDim;
    this.getSnapImageDim = config.getSnapImageDim;
  }

  /**
   * Notifies snap slider that image panning has started
   * Triggers snap slider's onStart callback to initialize state
   * @param event - Event that triggered the image pan start
   */
  notifyPanStart(event: Event): void {
    // Notify snap slider with dummy position (just to trigger initialization)
    this.snapSlider.onStart(event, { x: 0, y: 0 });
  }

  /**
   * Synchronizes snap slider position when image is moved
   * Converts image delta to snap slider delta using dimension ratios
   * REFACTOR: Uses updatePosition instead of creating dummy events (Issue A1.12)
   * @param imagePosition - Image movement delta and current position
   */
  syncSnapSliderPosition(imagePosition: { dx: number; dy: number; mx: number; my: number }): void {
    const imageDim = this.getImageDim();
    const snapImageDim = this.getSnapImageDim();

    // Convert image delta to snap slider delta using dimension ratio
    // Snap slider moves in opposite direction (when image moves right, snap moves left)
    const dx = imageDim.w !== 0 ? (-imagePosition.dx * snapImageDim.w) / imageDim.w : 0;
    const dy = imageDim.h !== 0 ? (-imagePosition.dy * snapImageDim.h) / imageDim.h : 0;

    // Update snap slider with converted position (no dummy event needed)
    this.snapSlider.updatePosition({
      dx,
      dy,
      mx: 0, // Mouse position not relevant for sync
      my: 0,
    });
  }

  /**
   * Gets reference to snap slider for momentum animation
   * This is needed because momentum animation updates snap slider directly
   * @returns The snap slider instance
   */
  getSnapSlider(): Slider {
    return this.snapSlider;
  }
}
