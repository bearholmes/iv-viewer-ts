import { EventManager } from './EventManager';
import { ImageViewerOptions, ViewerElements, Dimensions } from './types';
import { default as FullScreenViewer } from './FullScreen';
declare class ImageViewer {
    static defaults: ImageViewerOptions;
    static FullScreenViewer: typeof FullScreenViewer;
    private static readonly MOMENTUM_SAMPLE_INTERVAL_MS;
    private static readonly MOMENTUM_ANIMATION_FRAMES;
    private static readonly MOMENTUM_THRESHOLD_PX;
    private static readonly MOMENTUM_VELOCITY_FACTOR;
    private static readonly ZOOM_ANIMATION_FRAMES;
    private static readonly SNAP_VIEW_TIMEOUT_MS;
    private _elements;
    private _options;
    private _listeners;
    private _state;
    private _sliders;
    private _frames;
    private _images;
    private imageLoader;
    protected eventManager: EventManager;
    private dom;
    private interactionManager;
    /**
     * Creates a new ImageViewer instance
     * @param element - DOM element, CSS selector, or IMG element to initialize the viewer on
     * @param options - Configuration options (zoomValue, maxZoom, snapView, etc.)
     * @example
     * ```typescript
     * // Initialize on an image element
     * const viewer = new ImageViewer('#myImage', { maxZoom: 800 });
     *
     * // Initialize on a container with data attributes
     * const viewer = new ImageViewer(document.querySelector('.container'), {
     *   snapView: true,
     *   zoomOnMouseWheel: true
     * });
     * ```
     */
    constructor(element: string | HTMLElement, options?: {});
    get imageViewHtml(): string;
    /**
     * Returns callback data object passed to event listeners
     * Includes container, snapView, zoom values, and instance reference
     */
    get _callbackData(): {
        container: HTMLElement;
        snapView: HTMLElement;
        zoomValue: number;
        reachedMin: boolean;
        reachedMax: boolean;
        instance: ImageViewer;
    };
    protected _setZoomValue(value: number): void;
    protected _setLoaded(loaded: boolean): void;
    protected _setZooming(zooming: boolean): void;
    protected _setSnapViewVisible(visible: boolean): void;
    protected _setContainerDim(dim: Dimensions): void;
    protected _setImageDim(dim: Dimensions): void;
    protected _setSnapImageDim(dim: Dimensions): void;
    protected _setSnapHandleDim(dim: Dimensions): void;
    protected _setZoomSliderLength(length: number): void;
    protected _getElement<K extends keyof ViewerElements>(key: K): ViewerElements[K] | undefined;
    protected _setElement<K extends keyof ViewerElements>(key: K, element: ViewerElements[K] | undefined): void;
    private _getSlider;
    private _setSlider;
    private _destroySlider;
    private _validateImageUrl;
    private _setImageSources;
    private _getScrollPosition;
    private _getZoomStep;
    private _calculateMomentumDelta;
    private _shouldApplyMomentum;
    private _applyMomentumAnimation;
    _init(): void;
    /**
     * Initializes the main image slider with pan and momentum scrolling
     * REFACTOR: Uses SliderCoordinator to decouple sliders (Issue C3.5)
     * Tracks position history for momentum calculation and syncs with snap view
     */
    _initImageSlider(): void;
    /**
     * Initializes the snap view slider for dragging the snap handle
     * Handles boundary constraints and syncs with main image position
     */
    /**
     * REFACTOR: Calculate snap handle position bounds
     * @param startLeft - Starting left position
     * @param startTop - Starting top position
     * @param delta - Position delta from drag
     * @param snapHandleDim - Snap handle dimensions
     * @param snapImageDim - Snap image dimensions
     * @returns Clamped handle position
     */
    private _calculateSnapHandlePosition;
    /**
     * REFACTOR: Convert snap handle position to main image position
     * @param snapPosition - Snap handle position
     * @param imageCurrentDim - Current image dimensions
     * @param snapImageDim - Snap image dimensions
     * @returns Main image position
     */
    private _convertSnapToImagePosition;
    _initSnapSlider(): void;
    /**
     * Initializes the zoom slider control in the snap view
     * Maps slider position to zoom level between 100% and maxZoom
     */
    _initZoomSlider(): void;
    _initEvents(): void;
    _snapViewEvents(): void;
    _getImageCurrentDim(): {
        w: number;
        h: number;
    };
    /**
     * Loads the main image and optional high-resolution image
     * Shows loader, handles image load/error events, and triggers dimension calculation
     */
    /**
     * REFACTOR: Handle successful image load - called by ImageLoader (Issue C3.1)
     * Race condition checking is handled by ImageLoader, so this is only called for valid loads
     * @param _loadId - The load operation ID (unused, kept for interface compatibility)
     */
    private _handleImageLoadSuccess;
    /**
     * REFACTOR: Handle image load error - called by ImageLoader (Issue C3.1)
     * Race condition checking is handled by ImageLoader, so this is only called for valid loads
     * @param _loadId - The load operation ID (unused, kept for interface compatibility)
     * @param error - The error event
     */
    private _handleImageLoadError;
    /**
     * REFACTOR: Simplified image loading using ImageLoader (Issue C3.1)
     * ImageLoader handles: URL validation, element creation, event setup, race conditions
     * ImageViewer handles: state updates, snap view hiding
     */
    _loadImages(): void;
    /**
     * Calculates and stores dimensions for container, image, snap view, and zoom slider
     * Ensures image fits container while maintaining aspect ratio
     * Called after image load and on refresh
     * REFACTOR: Uses DimensionCalculator for dimension calculations (Issue C3.1/C3.4)
     */
    /**
     * REFACTOR: Main dimension calculation orchestrator (Issue C3.4/C3.1)
     * Coordinates calculation and application of all viewer dimensions
     * Now uses DimensionCalculator for cleaner separation of concerns
     */
    _calculateDimensions(): void;
    /**
     * Resets zoom to the initial zoomValue and centers the image
     * @param animate - Whether to animate the zoom transition (default: true)
     * @example
     * ```typescript
     * viewer.resetZoom(); // Animated reset
     * viewer.resetZoom(false); // Instant reset
     * ```
     */
    resetZoom(animate?: boolean): void;
    /**
     * Zooms the image to a specific percentage
     * REFACTOR: Simplified using ZoomAnimation helper (Issue A1.2/C3.3)
     * Animates over 16 frames using easeOutQuart easing
     * Automatically constrains image position to prevent showing empty space
     * @param perc - Zoom percentage (clamped between 100 and maxZoom)
     * @param point - Optional zoom center point {x, y} relative to container (defaults to center)
     * @example
     * ```typescript
     * viewer.zoom(200); // Zoom to 200% centered
     * viewer.zoom(300, { x: 100, y: 100 }); // Zoom to 300% at specific point
     * ```
     */
    zoom(perc: number, point?: {
        x: number;
        y: number;
    }): void;
    /**
     * Clears all active animation frames and intervals
     * Prevents multiple animations from running simultaneously
     */
    _clearFrames(): void;
    /**
     * Updates snap handle size and position based on current image dimensions
     * The snap handle represents the visible viewport area within the snap view
     * @param imgWidth - Current image width (optional, calculated if not provided)
     * @param imgHeight - Current image height (optional, calculated if not provided)
     * @param imgLeft - Current image left position (optional, calculated if not provided)
     * @param imgTop - Current image top position (optional, calculated if not provided)
     */
    _resizeSnapHandle(imgWidth: number, imgHeight: number, imgLeft: number, imgTop: number): void;
    /**
     * Shows the snap view (minimap) when zoomed in
     * Auto-hides after 1500ms unless noTimeout is true
     * @param noTimeout - If true, keeps snap view visible without auto-hide
     * @example
     * ```typescript
     * viewer.showSnapView(); // Shows for 1500ms
     * viewer.showSnapView(true); // Shows until manually hidden
     * ```
     */
    showSnapView(noTimeout?: boolean): void;
    /**
     * Hides the snap view (minimap)
     * @example
     * ```typescript
     * viewer.hideSnapView();
     * ```
     */
    hideSnapView(): void;
    /**
     * Recalculates dimensions and resets zoom
     * Useful after container resize or orientation change
     * @example
     * ```typescript
     * window.addEventListener('resize', () => viewer.refresh());
     * ```
     */
    refresh(): void;
    /**
     * Loads a new image into the viewer
     * @param imageSrc - URL of the image to load
     * @param hiResImageSrc - Optional URL of high-resolution version
     * @example
     * ```typescript
     * viewer.load('path/to/image.jpg');
     * viewer.load('thumb.jpg', 'fullsize.jpg');
     * ```
     */
    load(imageSrc: string, hiResImageSrc: string): void;
    /**
     * Destroys the viewer instance and cleans up all resources
     * Removes event listeners, sliders, frames, and DOM elements
     * Restores the original element state if it was an IMG tag
     * @example
     * ```typescript
     * viewer.destroy();
     * ```
     */
    destroy(): void;
}
export default ImageViewer;
