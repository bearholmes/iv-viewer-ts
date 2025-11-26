import { ViewerElements } from './types';
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
export declare class ImageLoader {
    private elements;
    private onLoadSuccess;
    private onLoadError;
    private loadCounter;
    private activeLoads;
    constructor(elements: Partial<ViewerElements>, onLoadSuccess: (loadId: number) => void, onLoadError: (loadId: number, error: Event | ErrorEvent) => void);
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
    load(imageSrc: string, hiResImageSrc?: string): number;
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
    loadHighRes(hiResImageSrc: string): void;
    /**
     * Cancels all active load operations
     * Used during cleanup or when loading new images
     *
     * @example
     * ```typescript
     * loader.destroy();
     * ```
     */
    destroy(): void;
    /**
     * Creates snap and main image elements
     * @private
     */
    private _createImageElements;
    /**
     * Handles successful image load
     * @private
     */
    private _handleLoadSuccess;
    /**
     * Handles image load error
     * @private
     */
    private _handleLoadError;
    /**
     * Cancels all previous load operations
     * @private
     */
    private _cancelPreviousLoads;
}
