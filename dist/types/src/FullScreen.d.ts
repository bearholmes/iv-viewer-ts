import { default as ImageViewer } from './ImageViewer';
declare class FullScreenViewer extends ImageViewer {
    /**
     * Creates a fullscreen image viewer instance
     * Extends ImageViewer with fullscreen-specific functionality and close button
     * @param options - Configuration options passed to ImageViewer constructor
     * @example
     * ```typescript
     * const viewer = new FullScreenViewer({ maxZoom: 800 });
     * viewer.show('path/to/image.jpg');
     * ```
     */
    constructor(options?: {});
    _initFullScreenEvents(): void;
    /**
     * Shows the fullscreen viewer with an image
     * Disables page scrolling and adds window resize handler
     * @param imageSrc - URL of the image to display
     * @param hiResImageSrc - Optional URL of high-resolution version
     * @example
     * ```typescript
     * viewer.show('image.jpg', 'image-hd.jpg');
     * ```
     */
    show(imageSrc: string, hiResImageSrc: string): void;
    /**
     * Hides the fullscreen viewer
     * Re-enables page scrolling and removes window resize handler
     * @example
     * ```typescript
     * viewer.hide();
     * ```
     */
    hide: () => void;
    /**
     * Destroys the fullscreen viewer and removes it from the DOM
     * Calls parent ImageViewer destroy method first
     * @example
     * ```typescript
     * viewer.destroy();
     * ```
     */
    destroy(): void;
}
export default FullScreenViewer;
