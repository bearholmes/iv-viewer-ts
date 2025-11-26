import { default as Slider } from './Slider';
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
export declare class SliderCoordinator {
    private snapSlider;
    private getImageDim;
    private getSnapImageDim;
    constructor(snapSlider: Slider, config: {
        getImageDim: () => {
            w: number;
            h: number;
        };
        getSnapImageDim: () => {
            w: number;
            h: number;
        };
    });
    /**
     * Notifies snap slider that image panning has started
     * Triggers snap slider's onStart callback to initialize state
     * @param event - Event that triggered the image pan start
     */
    notifyPanStart(event: Event): void;
    /**
     * Synchronizes snap slider position when image is moved
     * Converts image delta to snap slider delta using dimension ratios
     * REFACTOR: Uses updatePosition instead of creating dummy events (Issue A1.12)
     * @param imagePosition - Image movement delta and current position
     */
    syncSnapSliderPosition(imagePosition: {
        dx: number;
        dy: number;
        mx: number;
        my: number;
    }): void;
    /**
     * Gets reference to snap slider for momentum animation
     * This is needed because momentum animation updates snap slider directly
     * @returns The snap slider instance
     */
    getSnapSlider(): Slider;
}
