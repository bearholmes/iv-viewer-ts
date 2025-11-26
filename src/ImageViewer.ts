import { getStyle, setStyle, parseStyleFloat, isValidImageUrl, clamp } from './util';

import { ZoomAnimation, type ZoomBounds } from './ZoomAnimation';
import { DimensionCalculator } from './DimensionCalculator';
import { MomentumCalculator } from './MomentumCalculator';
import { SliderCoordinator } from './SliderCoordinator';
import { ViewerHTMLTemplates } from './ViewerHTMLTemplates';
import { ImageLoader } from './ImageLoader';
import { EventManager } from './EventManager';
import { ImageViewerDOM } from './ImageViewerDOM';
import { InteractionManager } from './InteractionManager';

import type {
  ImageViewerOptions,
  ViewerElements,
  ViewerState,
  ImageViewerListeners,
  AnimationFrames,
  Dimensions,
} from './types';

import Slider from './Slider';
import FullScreenViewer from './FullScreen';

// Extend HTMLElement interface to include custom _imageViewer property
export interface HTMLElementWithViewer extends HTMLElement {
  _imageViewer?: ImageViewer | null;
}

class ImageViewer {
  static defaults: ImageViewerOptions;
  static FullScreenViewer: typeof FullScreenViewer;

  // REFACTOR: Extract magic constants for better maintainability
  private static readonly MOMENTUM_SAMPLE_INTERVAL_MS = 50;
  private static readonly MOMENTUM_ANIMATION_FRAMES = 60;
  private static readonly MOMENTUM_THRESHOLD_PX = 30;
  private static readonly MOMENTUM_VELOCITY_FACTOR = 1 / 3;
  private static readonly ZOOM_ANIMATION_FRAMES = 16;
  private static readonly SNAP_VIEW_TIMEOUT_MS = 1500;

  private _elements: ViewerElements; // REFACTOR: Changed from protected to private (Issue E2.1)
  private _options: Required<ImageViewerOptions>;
  private _listeners: ImageViewerListeners;
  private _state: ViewerState;
  private _sliders: {
    snapSlider?: Slider;
    imageSlider?: Slider;
    zoomSlider?: Slider;
  };
  private _frames: Partial<AnimationFrames>;
  private _images: { hiResImageSrc?: string; imageSrc?: string };
  private imageLoader: ImageLoader; // REFACTOR: Extract image loading logic (Issue C3.1)
  protected eventManager: EventManager; // REFACTOR: Centralized event management (Issue A1.5, Phase 6.1)
  private dom: ImageViewerDOM; // REFACTOR: Extract DOM management logic (Issue C3.1, Phase 8)
  private interactionManager: InteractionManager; // REFACTOR: Extract interaction logic (Phase 7)

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
  constructor(element: string | HTMLElement, options = {}) {
    this._options = { ...ImageViewer.defaults, ...options } as Required<ImageViewerOptions>;

    // REFACTOR: Use ImageViewerDOM for DOM initialization (Phase 8)
    this.dom = new ImageViewerDOM();
    const { domElement, imageSrc, hiResImageSrc, elements } = this.dom.initialize(
      element,
      ViewerHTMLTemplates.createViewerHTML(this._options.hasZoomButtons),
      (url, context) => this._validateImageUrl(url, context as 'main' | 'hiRes'),
    );

    // Store element references
    this._elements = elements as ViewerElements;

    // P3-5 FIX: Explicit null checking pattern for optional properties
    this._listeners =
      this._options.listeners !== undefined && this._options.listeners !== null
        ? this._options.listeners
        : {};

    // container for all timeout and frames
    this._frames = {};

    // container for all sliders
    this._sliders = {};

    // maintain current state
    this._state = {
      zoomValue: this._options.zoomValue,
      loaded: false,
      imageDim: { w: 0, h: 0 },
      containerDim: { w: 0, h: 0 },
      snapImageDim: { w: 0, h: 0 },
      zooming: false,
      snapViewVisible: false,
      zoomSliderLength: 0,
      snapHandleDim: { w: 0, h: 0 },
    };

    this._images = {
      imageSrc,
      hiResImageSrc,
    };

    // REFACTOR: Initialize ImageLoader for handling image loading operations (Issue C3.1)
    this.imageLoader = new ImageLoader(
      this._elements,
      (loadId) => this._handleImageLoadSuccess(loadId),
      (loadId, error) => this._handleImageLoadError(loadId, error),
      () => this._handleHighResLoaded(),
    );

    // REFACTOR: Initialize EventManager for centralized event management (Issue A1.5)
    this.eventManager = new EventManager();

    // REFACTOR: Initialize InteractionManager for gesture handling (Phase 7)
    this.interactionManager = new InteractionManager(
      {
        imageWrap: this._elements.imageWrap!,
        container: this._elements.container!,
      },
      this.eventManager,
      {
        zoomOnMouseWheel: this._options.zoomOnMouseWheel,
        zoomValue: this._options.zoomValue,
        maxZoom: this._options.maxZoom,
      },
      {
        getState: () => ({
          loaded: this._state.loaded ?? false,
          zoomValue: this._state.zoomValue ?? 100,
          zooming: this._state.zooming ?? false,
        }),
        setZooming: (zooming) => this._setZooming(zooming),
        clearFrames: () => this._clearFrames(),
        zoom: (value, point) => this.zoom(value, point),
        resetZoom: () => this.resetZoom(),
        showSnapView: () => this.showSnapView(),
        getSlider: (key) => this._getSlider(key as 'imageSlider' | 'snapSlider' | 'zoomSlider'),
        getScrollPosition: () => this._getScrollPosition(),
      },
    );

    this._init();

    if (imageSrc) {
      this._loadImages();
    }

    // store reference of imageViewer in domElement
    (domElement as HTMLElementWithViewer)._imageViewer = this;
  }

  // REFACTOR: HTML generation moved to ViewerHTMLTemplates (Issue C3.1)
  get imageViewHtml() {
    return ViewerHTMLTemplates.createViewerHTML(this._options.hasZoomButtons);
  }

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
  } {
    // P3-1 FIX: Add null checking for elements that might not be initialized
    if (!this._elements.container || !this._elements.snapView) {
      throw new Error('ImageViewer elements not initialized. Cannot get callback data.');
    }

    return {
      container: this._elements.container,
      snapView: this._elements.snapView,
      zoomValue: this._state.zoomValue,
      reachedMin: Math.round(this._state.zoomValue) === this._options.zoomValue,
      reachedMax: Math.round(this._state.zoomValue) === this._options.maxZoom,
      instance: this,
    };
  }

  // REFACTOR: State setter methods for better encapsulation (Issue E2.4)
  // These methods centralize state modifications for easier tracking and validation

  protected _setZoomValue(value: number): void {
    this._state.zoomValue = value;
  }

  protected _setLoaded(loaded: boolean): void {
    this._state.loaded = loaded;
  }

  protected _setZooming(zooming: boolean): void {
    this._state.zooming = zooming;
  }

  protected _setSnapViewVisible(visible: boolean): void {
    this._state.snapViewVisible = visible;
  }

  protected _setContainerDim(dim: Dimensions): void {
    this._state.containerDim = dim;
  }

  protected _setImageDim(dim: Dimensions): void {
    this._state.imageDim = dim;
  }

  protected _setSnapImageDim(dim: Dimensions): void {
    this._state.snapImageDim = dim;
  }

  protected _setSnapHandleDim(dim: Dimensions): void {
    this._state.snapHandleDim = dim;
  }

  protected _setZoomSliderLength(length: number): void {
    this._state.zoomSliderLength = length;
  }

  // REFACTOR: Element and event accessor methods for better encapsulation (Issues E2.1, E2.2)
  // These methods provide controlled access to internal elements and events for subclasses

  protected _getElement<K extends keyof ViewerElements>(key: K): ViewerElements[K] | undefined {
    return this._elements[key] as ViewerElements[K] | undefined;
  }

  protected _setElement<K extends keyof ViewerElements>(
    key: K,
    element: ViewerElements[K] | undefined,
  ): void {
    this._elements[key] = element;
  }

  // REFACTOR: Slider accessor methods for better encapsulation (Issue E2.5)
  // These methods provide controlled access to slider instances

  private _getSlider<K extends keyof typeof this._sliders>(key: K): (typeof this._sliders)[K] {
    return this._sliders[key];
  }

  private _setSlider<K extends keyof typeof this._sliders>(
    key: K,
    slider: (typeof this._sliders)[K],
  ): void {
    this._sliders[key] = slider;
  }

  private _destroySlider(key: 'imageSlider' | 'snapSlider' | 'zoomSlider'): void {
    const slider = this._sliders[key];
    if (slider) {
      slider.destroy();
      this._sliders[key] = undefined;
    }
  }

  // REFACTOR: Extract duplicated URL validation logic (Issue A1.4)
  private _validateImageUrl(
    url: string | null | undefined,
    urlType: 'main' | 'hiRes' = 'main',
  ): string | null {
    if (!url) return null;

    if (!isValidImageUrl(url)) {
      const typeLabel = urlType === 'hiRes' ? 'high-res ' : '';
      throw new Error(`Invalid or unsafe ${typeLabel}image URL: ${url}`);
    }

    return url;
  }

  // REFACTOR: Images object structure validation (Issue E2.10)
  private _setImageSources(sources: {
    imageSrc?: string | null;
    hiResImageSrc?: string | null;
  }): void {
    // Validate image sources before setting
    const validatedImageSrc = this._validateImageUrl(sources.imageSrc ?? null, 'main');
    const validatedHiResImageSrc = this._validateImageUrl(sources.hiResImageSrc ?? null, 'hiRes');

    this._images = {
      imageSrc: validatedImageSrc ?? undefined,
      hiResImageSrc: validatedHiResImageSrc ?? undefined,
    };
  }

  // REFACTOR: Extract duplicated scroll position logic (Issue A1.6)
  private _getScrollPosition(): { x: number; y: number } {
    return {
      x: window.pageXOffset || window.scrollX || 0,
      y: window.pageYOffset || window.scrollY || 0,
    };
  }

  // REFACTOR: Extract duplicated zoom step retrieval (Issue A1.7)
  private _getZoomStep(): number {
    return this._options.zoomStep !== undefined && this._options.zoomStep !== null
      ? this._options.zoomStep
      : 50;
  }

  // REFACTOR: Extract momentum calculation logic (Issue A1.3)
  // These methods centralize momentum tracking and animation for better testability

  // REFACTOR: Momentum calculation methods moved to MomentumCalculator (Issue C3.1/A1.3)
  private _calculateMomentumDelta(positions: Array<{ x: number; y: number }>): {
    xDiff: number;
    yDiff: number;
  } {
    return MomentumCalculator.calculateDelta(positions);
  }

  private _shouldApplyMomentum(xDiff: number, yDiff: number): boolean {
    return MomentumCalculator.shouldApplyMomentum(xDiff, yDiff, ImageViewer.MOMENTUM_THRESHOLD_PX);
  }

  // REFACTOR: Momentum animation using MomentumCalculator (Issue C3.1/A1.3)
  private _applyMomentumAnimation(
    xDiff: number,
    yDiff: number,
    currentPos: { dx: number; dy: number },
    imageCurrentDim: { w: number; h: number },
    snapImageDim: { w: number; h: number },
    snapSlider: Slider,
  ): void {
    let step = 1;
    let cumulativeX = 0;
    let cumulativeY = 0;

    const config = {
      thresholdPx: ImageViewer.MOMENTUM_THRESHOLD_PX,
      velocityFactor: ImageViewer.MOMENTUM_VELOCITY_FACTOR,
      animationFrames: ImageViewer.MOMENTUM_ANIMATION_FRAMES,
    };

    const momentum = () => {
      // Calculate frame position using MomentumCalculator
      const frame = MomentumCalculator.calculateMomentumFrame(
        step,
        { dx: cumulativeX, dy: cumulativeY },
        { xDiff, yDiff },
        config,
      );

      if (frame.shouldContinue) {
        this._frames.sliderMomentumFrame = requestAnimationFrame(momentum);
      }

      // Update cumulative positions
      cumulativeX = frame.positionX;
      cumulativeY = frame.positionY;

      const finalPosX = currentPos.dx + cumulativeX;
      const finalPosY = currentPos.dy + cumulativeY;

      // Convert to snap coordinates using MomentumCalculator
      const snapCoords = MomentumCalculator.convertToSnapCoordinates(
        { x: finalPosX, y: finalPosY },
        imageCurrentDim,
        snapImageDim,
      );

      // REFACTOR: Use updatePosition instead of dummy event (Issue A1.12)
      snapSlider.updatePosition({
        dx: snapCoords.dx,
        dy: snapCoords.dy,
        mx: 0,
        my: 0,
      });

      step++;
    };

    momentum();
  }

  _init() {
    // REFACTOR: DOM initialization now handled by ImageViewerDOM (Phase 8)

    // initialize slider
    this._initSnapSlider();
    this._initImageSlider();
    this._initZoomSlider();

    // REFACTOR: Setup interactions using InteractionManager (Phase 7)
    this.interactionManager.setupInteractions();

    // initialize events
    this._initEvents();

    // Trigger onInit callback
    if (this._listeners.onInit) {
      this._listeners.onInit(this._callbackData);
    }
  }

  /**
   * Initializes the main image slider with pan and momentum scrolling
   * REFACTOR: Uses SliderCoordinator to decouple sliders (Issue C3.5)
   * Tracks position history for momentum calculation and syncs with snap view
   */
  _initImageSlider() {
    const { _elements } = this;

    const { imageWrap } = _elements;

    if (!imageWrap) {
      throw new Error('imageWrap element not found');
    }

    let positions: { x: number; y: number }[];
    let currentPos: { dx: number; dy: number; mx: number; my: number } | undefined;

    // REFACTOR: Create coordinator to handle image/snap slider synchronization (Issue C3.5)
    const sliderCoordinator = new SliderCoordinator(this._getSlider('snapSlider'), {
      getImageDim: () => this._getImageCurrentDim(),
      getSnapImageDim: () => this._state.snapImageDim,
    });

    /* Add slide interaction to image */
    const imageSlider = new Slider(imageWrap, {
      isSliderEnabled: () => {
        const { loaded, zooming, zoomValue } = this._state;
        return loaded && !zooming && zoomValue > 100;
      },
      onStart: (event, position) => {
        // clear all animation frame and interval
        this._clearFrames();

        // REFACTOR: Use coordinator instead of direct snap slider access (Issue C3.5)
        sliderCoordinator.notifyPanStart(event);

        // reset positions
        positions = [position, position];
        currentPos = undefined;

        // P2-4 FIX: Use requestAnimationFrame instead of setInterval for better performance
        // Track position for momentum calculation
        let lastSampleTime = performance.now();
        const sampleInterval = ImageViewer.MOMENTUM_SAMPLE_INTERVAL_MS;

        const trackPosition = (currentTime: number) => {
          if (currentTime - lastSampleTime >= sampleInterval) {
            if (currentPos) {
              positions.shift();
              positions.push({
                x: currentPos.mx,
                y: currentPos.my,
              });
            }
            lastSampleTime = currentTime;
          }
          this._frames.slideMomentumCheck = requestAnimationFrame(trackPosition);
        };

        this._frames.slideMomentumCheck = requestAnimationFrame(trackPosition);
      },
      onMove: (_e, position) => {
        currentPos = position;

        // REFACTOR: Use coordinator to sync snap slider (Issue C3.5)
        sliderCoordinator.syncSnapSliderPosition(position);
      },
      onEnd: () => {
        const { snapImageDim } = this._state;
        const imageCurrentDim = this._getImageCurrentDim();

        // clear all animation frame and interval
        this._clearFrames();

        // Calculate momentum delta (use helper - Issue A1.3)
        const { xDiff, yDiff } = this._calculateMomentumDelta(positions);

        // Apply momentum animation if threshold exceeded (use helper - Issue A1.3)
        if (this._shouldApplyMomentum(xDiff, yDiff)) {
          // REFACTOR: Get snap slider through coordinator (Issue C3.5)
          const snapSlider = sliderCoordinator.getSnapSlider();
          this._applyMomentumAnimation(
            xDiff,
            yDiff,
            currentPos,
            imageCurrentDim,
            snapImageDim,
            snapSlider,
          );
        }
      },
    });

    imageSlider.init();

    this._setSlider('imageSlider', imageSlider);
  }

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
  private _calculateSnapHandlePosition(
    startLeft: number,
    startTop: number,
    delta: { dx: number; dy: number },
    snapHandleDim: { w: number; h: number },
    snapImageDim: { w: number; h: number },
  ): { left: number; top: number } {
    // BUG-1 FIX: Correct boundary logic for snap handle positioning
    // Handle can move within the snap image bounds
    const maxLeft = snapImageDim.w - snapHandleDim.w;
    const maxTop = snapImageDim.h - snapHandleDim.h;
    const minLeft = 0;
    const minTop = 0;

    const left = clamp(startLeft + delta.dx, minLeft, maxLeft);
    const top = clamp(startTop + delta.dy, minTop, maxTop);

    return { left, top };
  }

  /**
   * REFACTOR: Convert snap handle position to main image position
   * @param snapPosition - Snap handle position
   * @param imageCurrentDim - Current image dimensions
   * @param snapImageDim - Snap image dimensions
   * @returns Main image position
   */
  private _convertSnapToImagePosition(
    snapPosition: { left: number; top: number },
    imageCurrentDim: { w: number; h: number },
    snapImageDim: { w: number; h: number },
  ): { left: number; top: number } {
    // P2-6 FIX: Prevent division by zero
    const left =
      snapImageDim.w !== 0 ? (-snapPosition.left * imageCurrentDim.w) / snapImageDim.w : 0;
    const top = snapImageDim.h !== 0 ? (-snapPosition.top * imageCurrentDim.h) / snapImageDim.h : 0;

    return { left, top };
  }

  _initSnapSlider() {
    const { snapHandle } = this._elements;

    let startHandleTop: number;
    let startHandleLeft: number;

    const snapSlider = new Slider(snapHandle, {
      isSliderEnabled: () => {
        return this._state.loaded;
      },
      onStart: () => {
        const { slideMomentumCheck, sliderMomentumFrame } = this._frames;

        // P2-7 FIX: Add fallback for parseFloat to prevent NaN (use getStyle - Issue A1.10)
        startHandleTop = parseStyleFloat(snapHandle, 'top');
        startHandleLeft = parseStyleFloat(snapHandle, 'left');

        // stop momentum on image
        if (slideMomentumCheck) clearInterval(slideMomentumCheck);
        if (typeof sliderMomentumFrame === 'number') {
          cancelAnimationFrame(sliderMomentumFrame);
        }
      },
      onMove: (_, position) => {
        const { snapHandleDim, snapImageDim } = this._state;
        const { image } = this._elements;

        const imageCurrentDim = this._getImageCurrentDim();

        if (!snapHandleDim) return;

        // Calculate snap handle position with boundary constraints (use helper)
        const handlePos = this._calculateSnapHandlePosition(
          startHandleLeft,
          startHandleTop,
          position,
          snapHandleDim,
          snapImageDim,
        );

        // Convert snap position to main image position (use helper)
        const imagePos = this._convertSnapToImagePosition(handlePos, imageCurrentDim, snapImageDim);

        // Update snap handle position
        setStyle(snapHandle, {
          left: `${handlePos.left}px`,
          top: `${handlePos.top}px`,
        });

        // Update main image position
        setStyle(image, {
          left: `${imagePos.left}px`,
          top: `${imagePos.top}px`,
        });
      },
      // REFACTOR: onEnd callback is now required (Issue E2.7)
      onEnd: () => {
        // No action needed on drag end for snap slider
      },
    });

    snapSlider.init();

    this._setSlider('snapSlider', snapSlider);
  }

  /**
   * Initializes the zoom slider control in the snap view
   * Maps slider position to zoom level between 100% and maxZoom
   */
  _initZoomSlider() {
    const { snapView, zoomHandle } = this._elements;

    // zoom in zoom out using zoom handle
    const sliderElm = snapView.querySelector('.iv-zoom-slider') as HTMLElement;
    if (!sliderElm) {
      throw new Error('Zoom slider element not found');
    }

    let leftOffset: number, handleWidth: number;

    // on zoom slider we have to follow the mouse and set the handle to its position.
    const zoomSlider = new Slider(sliderElm, {
      isSliderEnabled: () => {
        return this._state.loaded;
      },
      onStart: (eStart, position) => {
        const { zoomSlider: slider } = this._sliders;

        // P2-1 FIX: Use modern scroll position API (use helper - Issue A1.6)
        const scroll = this._getScrollPosition();
        leftOffset = sliderElm.getBoundingClientRect().left + scroll.x;
        handleWidth = parseInt(getStyle(zoomHandle, 'width'), 10);

        // REFACTOR: Pass required position parameter to slider.onMove (Issue C3.7)
        // Move handle to current mouse position with zero delta (just started)
        slider.onMove(eStart, { dx: 0, dy: 0, mx: position.x, my: position.y });
      },
      onMove: (e) => {
        const { maxZoom } = this._options;
        const { zoomSliderLength } = this._state;

        let pageX: number;
        if (e instanceof MouseEvent) {
          pageX = e.pageX;
        } else if (e instanceof TouchEvent) {
          pageX = e.touches[0].pageX;
        } else {
          return;
        }

        if (!zoomSliderLength) return;
        const newLeft = clamp(pageX - leftOffset - handleWidth / 2, 0, zoomSliderLength);
        const zoomValue = 100 + ((maxZoom - 100) * newLeft) / zoomSliderLength;

        this.zoom(zoomValue);
      },
      // REFACTOR: onEnd callback is now required (Issue E2.7)
      onEnd: () => {
        // No action needed on drag end for zoom slider
      },
    });

    zoomSlider.init();
    this._setSlider('zoomSlider', zoomSlider);
  }

  _initEvents() {
    this._snapViewEvents();

    // REFACTOR: Use EventManager for window resize event (Issue A1.5)
    if (this._options.refreshOnResize) {
      this.eventManager.on('windowResize', window, 'resize', () => this.refresh());
    }
  }

  _snapViewEvents() {
    const { imageWrap, snapView } = this._elements;

    // REFACTOR: Use EventManager for snap view mouse move event (Issue A1.5)
    this.eventManager.on('snapViewOnMouseMove', imageWrap, ['touchmove', 'mousemove'], () => {
      this.showSnapView();
    });

    // REFACTOR: Use EventManager for snap view mouse enter event (Issue A1.5)
    this.eventManager.on('mouseEnterSnapView', snapView, ['mouseenter', 'touchstart'], () => {
      this._setSnapViewVisible(false);
      this.showSnapView(true);
    });

    // REFACTOR: Use EventManager for snap view mouse leave event (Issue A1.5)
    this.eventManager.on('mouseLeaveSnapView', snapView, ['mouseleave', 'touchend'], () => {
      this._setSnapViewVisible(false);
      this.showSnapView();
    });

    if (!this._options.hasZoomButtons) {
      return;
    }
    const { zoomOut, zoomIn } = this._elements;

    // REFACTOR: Use EventManager for zoom button events (Issue A1.5)
    this.eventManager.on('zoomInClick', zoomIn, ['click'], () => {
      // P3-5 FIX: Explicit null checking with numeric default (use helper - Issue A1.7)
      const zoomStep = this._getZoomStep();
      this.zoom(this._state.zoomValue + zoomStep);
    });

    this.eventManager.on('zoomOutClick', zoomOut, ['click'], () => {
      // P3-5 FIX: Explicit null checking with numeric default (use helper - Issue A1.7)
      const zoomStep = this._getZoomStep();
      this.zoom(this._state.zoomValue - zoomStep);
    });
  }

  _getImageCurrentDim() {
    const { zoomValue, imageDim } = this._state;
    return {
      w: imageDim.w * (zoomValue / 100),
      h: imageDim.h * (zoomValue / 100),
    };
  }

  /**
   * Loads the main image and optional high-resolution image
   * Shows loader, handles image load/error events, and triggers dimension calculation
   */
  /**
   * REFACTOR: Handle successful image load - called by ImageLoader (Issue C3.1)
   * Race condition checking is handled by ImageLoader, so this is only called for valid loads
   * @param _loadId - The load operation ID (unused, kept for interface compatibility)
   */
  private _handleImageLoadSuccess(_loadId: number): void {
    const { hiResImageSrc } = this._images;

    // Load high resolution image if provided
    if (hiResImageSrc) {
      this.imageLoader.loadHighRes(hiResImageSrc);
    }

    // Set loaded flag and calculate dimensions
    this._setLoaded(true);
    this._calculateDimensions();

    // Dispatch image load event
    if (this._listeners.onImageLoaded) {
      this._listeners.onImageLoaded(this._callbackData);
    }

    // Reset the zoom
    this.resetZoom();
  }

  /**
   * REFACTOR: Handle image load error - called by ImageLoader (Issue C3.1)
   * Race condition checking is handled by ImageLoader, so this is only called for valid loads
   * @param _loadId - The load operation ID (unused, kept for interface compatibility)
   * @param error - The error event
   */
  private _handleImageLoadError(_loadId: number, error: Event | ErrorEvent): void {
    if (this._listeners.onImageError) {
      this._listeners.onImageError(error);
    }
  }

  /**
   * Handle high-resolution image load complete
   * Recalculates dimensions with the correct image size
   */
  private _handleHighResLoaded(): void {
    this._calculateDimensions();
    this.resetZoom(false); // Reset without animation
  }

  /**
   * REFACTOR: Simplified image loading using ImageLoader (Issue C3.1)
   * ImageLoader handles: URL validation, element creation, event setup, race conditions
   * ImageViewer handles: state updates, snap view hiding
   */
  _loadImages() {
    const { imageSrc, hiResImageSrc } = this._images;

    if (!imageSrc) {
      throw new Error('No image source provided');
    }

    // Reset state
    this._setLoaded(false);
    this.hideSnapView();

    // REFACTOR: Delegate image loading to ImageLoader (Issue C3.1)
    // ImageLoader handles all loading logic including race conditions, validation, and UI
    this.imageLoader.load(imageSrc, hiResImageSrc);
  }

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
  _calculateDimensions() {
    const { image, container, snapView, snapImage, zoomHandle } = this._elements;

    // Get current element dimensions
    const imageWidth = parseInt(getStyle(image, 'width'), 10);
    const imageHeight = parseInt(getStyle(image, 'height'), 10);
    const contWidth = parseInt(getStyle(container, 'width'), 10);
    const contHeight = parseInt(getStyle(container, 'height'), 10);

    // Update container dimensions in state
    this._setContainerDim({ w: contWidth, h: contHeight });

    // Get natural image dimensions
    const imgOriginWidth = (image as HTMLImageElement).naturalWidth || imageWidth;
    const imgOriginHeight = (image as HTMLImageElement).naturalHeight || imageHeight;

    // Calculate fitted image dimensions (use DimensionCalculator - Issue C3.1/C3.4)
    const imageDim = DimensionCalculator.calculateFittedImageDimensions(
      { w: contWidth, h: contHeight },
      imgOriginWidth,
      imgOriginHeight,
    );
    this._setImageDim(imageDim);

    // Apply image dimensions and center it
    setStyle(image, {
      width: `${imageDim.w}px`,
      height: `${imageDim.h}px`,
      left: `${(contWidth - imageDim.w) / 2}px`,
      top: `${(contHeight - imageDim.h) / 2}px`,
      maxWidth: 'none',
      maxHeight: 'none',
    });

    // Calculate snap view dimensions (use DimensionCalculator - Issue C3.1/C3.4)
    const snapViewDim = {
      w: snapView.clientWidth,
      h: snapView.clientHeight,
    };
    const snapDim = DimensionCalculator.calculateSnapImageDimensions(imageDim, snapViewDim);
    this._setSnapImageDim(snapDim);

    // Apply snap image dimensions
    setStyle(snapImage, {
      width: `${snapDim.w}px`,
      height: `${snapDim.h}px`,
    });

    // Calculate zoom slider length
    const zoomSliderElem = snapView.querySelector('.iv-zoom-slider');
    if (!zoomSliderElem) {
      throw new Error('Zoom slider element not found');
    }
    const zoomSlider = zoomSliderElem.clientWidth;
    this._setZoomSliderLength(zoomSlider - zoomHandle.offsetWidth);
  }

  /**
   * Resets zoom to the initial zoomValue and centers the image
   * @param animate - Whether to animate the zoom transition (default: true)
   * @example
   * ```typescript
   * viewer.resetZoom(); // Animated reset
   * viewer.resetZoom(false); // Instant reset
   * ```
   */
  resetZoom(animate = true) {
    const { zoomValue } = this._options;

    if (!animate) {
      this._setZoomValue(zoomValue);
    }

    this.zoom(zoomValue);
  }

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
  zoom(perc: number, point?: { x: number; y: number }): void {
    const { _options, _elements, _state } = this;
    const { zoomValue: curPerc, imageDim, containerDim, zoomSliderLength } = _state;
    const { image, zoomHandle } = _elements;
    const { maxZoom } = _options;

    // Normalize parameters
    perc = Math.round(Math.max(100, perc));
    perc = Math.min(maxZoom, perc);

    // P3-5 FIX: Explicit null checking for optional parameter
    const zoomPoint =
      point !== undefined && point !== null
        ? point
        : {
            x: containerDim.w / 2,
            y: containerDim.h / 2,
          };

    // P2-7 FIX: Add fallback for parseFloat to prevent NaN (use getStyle - Issue A1.10)
    const curLeft = parseStyleFloat(image, 'left');
    const curTop = parseStyleFloat(image, 'top');

    // Clear any panning frames
    this._clearFrames();

    // Calculate bounds for position constraints
    const bounds: ZoomBounds = {
      baseLeft: (containerDim.w - imageDim.w) / 2,
      baseTop: (containerDim.h - imageDim.h) / 2,
      baseRight: containerDim.w - (containerDim.w - imageDim.w) / 2,
      baseBottom: containerDim.h - (containerDim.h - imageDim.h) / 2,
    };

    // Create animation helper (Issue A1.2/C3.3)
    const animation = new ZoomAnimation({
      currentZoom: curPerc,
      targetZoom: perc,
      currentLeft: curLeft,
      currentTop: curTop,
      zoomPoint,
      imageDim,
      bounds,
      totalFrames: ImageViewer.ZOOM_ANIMATION_FRAMES,
    });

    // Animate zoom for smooth transition
    let step = 0;
    const animateFrame = () => {
      step++;

      if (step < ImageViewer.ZOOM_ANIMATION_FRAMES) {
        this._frames.zoomFrame = requestAnimationFrame(animateFrame);
      }

      // Get calculated frame data from animation helper
      const frame = animation.getFrame(step);

      // Update image styles
      setStyle(image, {
        width: `${frame.width}px`,
        height: `${frame.height}px`,
        left: `${frame.left}px`,
        top: `${frame.top}px`,
      });

      // Update state
      this._setZoomValue(frame.zoom);

      // Update snap handle to match new image size/position
      this._resizeSnapHandle(frame.width, frame.height, frame.left, frame.top);

      // Update zoom slider handle position
      setStyle(zoomHandle, {
        left: `${((frame.zoom - 100) * (zoomSliderLength || 0)) / (maxZoom - 100)}px`,
      });

      // Dispatch zoom changed event
      if (this._listeners.onZoomChange) {
        this._listeners.onZoomChange(this._callbackData);
      }
    };

    animateFrame();
  }

  /**
   * Clears all active animation frames and intervals
   * Prevents multiple animations from running simultaneously
   */
  _clearFrames(): void {
    const { slideMomentumCheck, sliderMomentumFrame, zoomFrame, snapViewTimeout } = this._frames;

    // P2-4 FIX: slideMomentumCheck now uses requestAnimationFrame
    if (typeof slideMomentumCheck === 'number') {
      cancelAnimationFrame(slideMomentumCheck);
    }
    if (typeof sliderMomentumFrame === 'number') {
      cancelAnimationFrame(sliderMomentumFrame);
    }
    if (typeof zoomFrame === 'number') {
      cancelAnimationFrame(zoomFrame);
    }
    // MEMORY LEAK FIX: Clear snapView timeout to prevent callbacks after destroy
    if (typeof snapViewTimeout === 'number') {
      clearTimeout(snapViewTimeout);
    }
  }

  /**
   * Updates snap handle size and position based on current image dimensions
   * The snap handle represents the visible viewport area within the snap view
   * @param imgWidth - Current image width (optional, calculated if not provided)
   * @param imgHeight - Current image height (optional, calculated if not provided)
   * @param imgLeft - Current image left position (optional, calculated if not provided)
   * @param imgTop - Current image top position (optional, calculated if not provided)
   */
  _resizeSnapHandle(imgWidth: number, imgHeight: number, imgLeft: number, imgTop: number): void {
    const { _elements, _state } = this;
    const { snapHandle, image } = _elements;
    const { imageDim, containerDim, zoomValue, snapImageDim } = _state;

    const imageWidth = imgWidth || (imageDim.w * zoomValue) / 100;
    const imageHeight = imgHeight || (imageDim.h * zoomValue) / 100;
    // P2-7 FIX: Add fallback for parseFloat to prevent NaN (use getStyle - Issue A1.10)
    const imageLeft = imgLeft || parseStyleFloat(image, 'left');
    const imageTop = imgTop || parseStyleFloat(image, 'top');

    // P2-6 FIX: Prevent division by zero
    const left = imageWidth !== 0 ? (-imageLeft * snapImageDim.w) / imageWidth : 0;
    const top = imageHeight !== 0 ? (-imageTop * snapImageDim.h) / imageHeight : 0;

    const handleWidth = imageWidth !== 0 ? (containerDim.w * snapImageDim.w) / imageWidth : 0;
    const handleHeight = imageHeight !== 0 ? (containerDim.h * snapImageDim.h) / imageHeight : 0;

    setStyle(snapHandle, {
      top: `${top}px`,
      left: `${left}px`,
      width: `${handleWidth}px`,
      height: `${handleHeight}px`,
    });

    this._setSnapHandleDim({
      w: handleWidth,
      h: handleHeight,
    });
  }

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
  showSnapView(noTimeout?: boolean): void {
    const { snapViewVisible, zoomValue, loaded } = this._state;
    const { snapView } = this._elements;

    if (!this._options.snapView) return;

    if (snapViewVisible || zoomValue <= 100 || !loaded) return;

    clearTimeout(this._frames.snapViewTimeout);

    this._setSnapViewVisible(true);

    setStyle(snapView, { opacity: '1', 'pointer-events': 'inherit' });

    if (!noTimeout) {
      // Auto-hide snap view after timeout
      this._frames.snapViewTimeout = setTimeout(
        () => this.hideSnapView(),
        ImageViewer.SNAP_VIEW_TIMEOUT_MS,
      );
    }
  }

  /**
   * Hides the snap view (minimap)
   * @example
   * ```typescript
   * viewer.hideSnapView();
   * ```
   */
  hideSnapView(): void {
    const { snapView } = this._elements;
    setStyle(snapView, { opacity: '0', 'pointer-events': 'none' });
    this._setSnapViewVisible(false);
  }

  /**
   * Recalculates dimensions and resets zoom
   * Useful after container resize or orientation change
   * @example
   * ```typescript
   * window.addEventListener('resize', () => viewer.refresh());
   * ```
   */
  refresh(): void {
    this._calculateDimensions();
    this.resetZoom();
  }

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
  load(imageSrc: string, hiResImageSrc: string) {
    // P3-4 FIX: Add error handling for image loading
    try {
      // REFACTOR: Use _setImageSources for validation and assignment (Issue E2.10)
      this._setImageSources({ imageSrc, hiResImageSrc });

      this._loadImages();
    } catch (error) {
      console.error('ImageViewer: Failed to load image', error);
      if (this._listeners.onImageError) {
        // Create an ErrorEvent for the callback
        const errorEvent = new ErrorEvent('error', {
          error: error instanceof Error ? error : new Error(String(error)),
          message: error instanceof Error ? error.message : String(error),
        });
        this._listeners.onImageError(errorEvent);
      }
      throw error; // Re-throw to let callers handle it
    }
  }

  /**
   * Destroys the viewer instance and cleans up all resources
   * Removes event listeners, sliders, frames, and DOM elements
   * Restores the original element state if it was an IMG tag
   * @example
   * ```typescript
   * viewer.destroy();
   * ```
   */
  destroy() {
    // P3-4 FIX: Add error handling for cleanup operations
    try {
      const { container, domElement } = this._elements;

      // destroy all the sliders (use helper - Issue E2.5)
      this._destroySlider('imageSlider');
      this._destroySlider('snapSlider');
      this._destroySlider('zoomSlider');

      // REFACTOR: Destroy ImageLoader to cancel any pending loads (Issue C3.1)
      this.imageLoader.destroy();

      // REFACTOR: Destroy InteractionManager (Phase 7)
      this.interactionManager.destroy();

      // REFACTOR: Destroy EventManager to remove all managed events (Issue A1.5, Phase 6)
      // All events now managed by EventManager (including FullScreen and InteractionManager)
      this.eventManager.destroy();

      // clear all the frames
      this._clearFrames();

      // REFACTOR: Use ImageViewerDOM for DOM cleanup (Phase 8)
      this.dom.destroy(domElement, container);

      // remove imageViewer reference from dom element
      (domElement as HTMLElementWithViewer)._imageViewer = null;

      if (this._listeners.onDestroy) {
        this._listeners.onDestroy();
      }
    } catch (error) {
      console.error('ImageViewer: Error during destroy', error);
      // Don't re-throw - we want destroy to always complete
    }
  }
}

ImageViewer.defaults = {
  zoomValue: 100,
  snapView: true,
  maxZoom: 500,
  refreshOnResize: true,
  zoomOnMouseWheel: true,
  hasZoomButtons: false,
  zoomStep: 50,
  listeners: {
    onInit: undefined,
    onDestroy: undefined,
    onImageLoaded: undefined,
    onZoomChange: undefined,
    onImageError: undefined,
  },
};

export default ImageViewer;
