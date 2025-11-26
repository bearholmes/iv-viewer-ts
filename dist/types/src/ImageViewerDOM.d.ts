import { ViewerElements } from './types';
/**
 * ImageViewerDOM - DOM structure management for ImageViewer
 *
 * Handles all DOM-related operations:
 * - Container finding and creation
 * - HTML structure generation
 * - Element reference management
 * - DOM cleanup
 */
export declare class ImageViewerDOM {
    private elements;
    /**
     * Initialize DOM from an element or selector
     * @param element - CSS selector or HTMLElement
     * @param imageViewHtml - HTML template for the viewer structure
     * @param validateImageUrl - Function to validate image URLs
     * @returns Initial setup data (container, domElement, image sources)
     */
    initialize(element: string | HTMLElement, imageViewHtml: string, validateImageUrl: (url: string | null | undefined, context: string) => string | null): {
        container: HTMLElement;
        domElement: HTMLElement;
        imageSrc?: string;
        hiResImageSrc?: string;
        elements: Partial<ViewerElements>;
    };
    /**
     * Get all current element references
     */
    getElements(): Partial<ViewerElements>;
    /**
     * Get a specific element
     */
    getElement<K extends keyof ViewerElements>(key: K): ViewerElements[K] | undefined;
    /**
     * Set a specific element
     */
    setElement<K extends keyof ViewerElements>(key: K, element: ViewerElements[K] | undefined): void;
    /**
     * Cleanup DOM when destroying viewer
     */
    destroy(domElement: HTMLElement, container: HTMLElement): void;
    /**
     * Resolve element from string selector or HTMLElement
     */
    private _resolveElement;
    /**
     * Process IMG element - extract sources and create container
     */
    private _processImgElement;
    /**
     * Extract image sources from container element attributes
     */
    private _extractImageSourcesFromContainer;
    /**
     * Create viewer DOM structure
     */
    private _createStructure;
}
