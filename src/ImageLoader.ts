import { createElement, imageLoaded, setStyle, remove, assignEvent, isValidImageUrl } from './util';
import type { ViewerElements, EventRemover } from './types';

/**
 * ImageLoader - Handles image loading operations for ImageViewer
 * REFACTOR: Extract image loading logic from ImageViewer (Issue C3.1)
 *
 * Manages:
 * - Loading main and high-resolution images
 * - Race condition prevention with load counter
 * - Loader UI visibility
 * - Image load success/error callbacks
 * - Image element creation
 *
 * @example
 * ```typescript
 * const loader = new ImageLoader(
 *   elements,
 *   listeners,
 *   (loadId) => this._handleImageLoadSuccess(loadId),
 *   (loadId, error) => this._handleImageLoadError(loadId, error)
 * );
 *
 * const loadId = loader.load('image.jpg', 'image-hires.jpg');
 * ```
 */
export class ImageLoader {
  private loadCounter: number = 0;
  private activeLoads: Map<string, EventRemover> = new Map();
  private static readonly ALLOWED_PROTOCOLS = ['http:', 'https:', 'blob:'];

  constructor(
    private elements: Partial<ViewerElements>,
    private onLoadSuccess: (loadId: number) => void,
    private onLoadError: (loadId: number, error: Event | ErrorEvent) => void,
  ) {}

  /**
   * Loads an image with optional high-resolution version
   * Returns a load ID for race condition tracking
   *
   * @param imageSrc - Main image source URL
   * @param hiResImageSrc - Optional high-resolution image source
   * @returns Load operation ID
   *
   * @example
   * ```typescript
   * const loadId = loader.load('thumb.jpg', 'full.jpg');
   * ```
   */
  load(imageSrc: string, hiResImageSrc?: string): number {
    const { container } = this.elements;
    if (!container) {
      throw new Error('Container element not found');
    }

    // Cancel previous load operations
    this._cancelPreviousLoads();

    // Increment load counter for race condition tracking
    const loadId = ++this.loadCounter;

    const ivLoader = container.querySelector('.iv-loader');
    if (!ivLoader) {
      throw new Error('Loader element not found');
    }

    // Remove old images
    remove(container.querySelectorAll('.iv-snap-image, .iv-image'));

    // Validate image URL
    const safeImageSrc = this.sanitizeImageSrc(imageSrc);

    // Create image elements
    const { snapImage, image } = this._createImageElements(safeImageSrc);

    // Store image references
    this.elements.image = image;
    this.elements.snapImage = snapImage;

    // Show loader
    setStyle(ivLoader, { display: 'block' });

    // Hide image until loaded
    setStyle(image, { visibility: 'hidden' });

    // Set up load handlers
    const onImageLoad = () => {
      this._handleLoadSuccess(loadId, hiResImageSrc);
    };

    const onImageError = (e: Event | ErrorEvent) => {
      this._handleLoadError(loadId, e);
    };

    if (imageLoaded(image)) {
      onImageLoad();
    } else {
      const imageLoadRemover = assignEvent(image, 'load', onImageLoad);
      const imageErrorRemover = assignEvent(image, 'error', onImageError);

      this.activeLoads.set('imageLoad', imageLoadRemover);
      this.activeLoads.set('imageError', imageErrorRemover);
    }

    return loadId;
  }

  /**
   * Loads a high-resolution version of the image
   * Replaces the current image once loaded
   *
   * @param hiResImageSrc - High-resolution image URL
   *
   * @example
   * ```typescript
   * loader.loadHighRes('image-4k.jpg');
   * ```
   */
  loadHighRes(hiResImageSrc: string): void {
    const { imageWrap } = this.elements;
    if (!imageWrap) {
      throw new Error('Image wrap element not found');
    }
    const safeHiResSrc = this.sanitizeImageSrc(hiResImageSrc);

    const lowResImg = this.elements.image;
    if (!lowResImg) {
      throw new Error('Low-res image not found');
    }

    // Create high-res image
    const hiResImage = createElement({
      tagName: 'img',
      className: 'iv-image iv-large-image',
      src: safeHiResSrc,
      parent: imageWrap,
    });

    // Copy styles from low-res to high-res image
    const lowResStyles = window.getComputedStyle(lowResImg);
    setStyle(hiResImage, {
      width: lowResStyles.width,
      height: lowResStyles.height,
      left: lowResStyles.left,
      top: lowResStyles.top,
      maxWidth: lowResStyles.maxWidth,
      maxHeight: lowResStyles.maxHeight,
      visibility: lowResStyles.visibility,
    });

    const onHighResImageLoad = () => {
      // Remove low-res image and replace with high-res
      remove(lowResImg);
      this.elements.image = hiResImage as HTMLImageElement;
    };

    if (imageLoaded(hiResImage as HTMLImageElement)) {
      onHighResImageLoad();
    } else {
      const hiResLoadRemover = assignEvent(hiResImage, 'load', onHighResImageLoad);
      this.activeLoads.set('hiResImageLoad', hiResLoadRemover);
    }
  }

  /**
   * Cancels all active load operations
   * Used during cleanup or when loading new images
   *
   * @example
   * ```typescript
   * loader.destroy();
   * ```
   */
  destroy(): void {
    this._cancelPreviousLoads();
  }

  /**
   * Creates snap and main image elements
   * @private
   */
  private _createImageElements(imageSrc: string): {
    snapImage: HTMLElement;
    image: HTMLImageElement;
  } {
    // Defense in depth: validate again before assigning src to DOM elements
    const safeSrc = this.sanitizeImageSrc(imageSrc);

    const { snapImageWrap, imageWrap } = this.elements;
    if (!snapImageWrap || !imageWrap) {
      throw new Error('Image wrap elements not found');
    }

    // Create snap view image
    const firstChild = snapImageWrap.firstChild;
    const snapImage = createElement({
      tagName: 'img',
      className: 'iv-snap-image',
      ...(firstChild ? { insertBefore: firstChild } : {}),
      parent: snapImageWrap,
    });
    (snapImage as HTMLImageElement).setAttribute('src', safeSrc);

    // Create main image
    const image = createElement({
      tagName: 'img',
      className: 'iv-image iv-small-image',
      parent: imageWrap,
    });
    (image as HTMLImageElement).setAttribute('src', safeSrc);

    return { snapImage, image: image as HTMLImageElement };
  }

  /**
   * Validates and normalizes image URLs to allowed protocols.
   * Throws if the URL is unsafe.
   */
  private sanitizeImageSrc(src: string): string {
    if (!isValidImageUrl(src)) {
      throw new Error(`Invalid or unsafe image URL: ${src}`);
    }
    const parsed = new URL(src, window.location.href);
    if (!ImageLoader.ALLOWED_PROTOCOLS.includes(parsed.protocol)) {
      throw new Error(`Invalid or unsafe image URL protocol: ${src}`);
    }
    return parsed.href;
  }

  /**
   * Handles successful image load
   * @private
   */
  private _handleLoadSuccess(loadId: number, hiResImageSrc?: string): void {
    // Ignore callbacks from superseded loads
    if (loadId !== this.loadCounter) {
      return;
    }

    const { container } = this.elements;
    if (!container) return;

    const ivLoader = container.querySelector('.iv-loader');
    const image = this.elements.image;

    // Hide loader and show image
    if (ivLoader) {
      setStyle(ivLoader, { display: 'none' });
    }
    if (image) {
      setStyle(image, { visibility: 'visible' });
    }

    // Load high-res if provided
    if (hiResImageSrc) {
      this.loadHighRes(hiResImageSrc);
    }

    // Notify success
    this.onLoadSuccess(loadId);
  }

  /**
   * Handles image load error
   * @private
   */
  private _handleLoadError(loadId: number, error: Event | ErrorEvent): void {
    // Ignore callbacks from superseded loads
    if (loadId !== this.loadCounter) {
      return;
    }

    const { container } = this.elements;
    if (!container) return;

    const ivLoader = container.querySelector('.iv-loader');
    if (ivLoader) {
      setStyle(ivLoader, { display: 'none' });
    }

    // Notify error
    this.onLoadError(loadId, error);
  }

  /**
   * Cancels all previous load operations
   * @private
   */
  private _cancelPreviousLoads(): void {
    this.activeLoads.forEach((remover) => remover());
    this.activeLoads.clear();
  }
}
