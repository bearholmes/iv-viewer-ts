import {
  createElement,
  addClass,
  wrap,
  setStyle,
  getStyle,
  removeClass,
  remove,
  unwrap,
} from './util';
import type { HTMLElementWithViewer } from './ImageViewer';
import type { ViewerElements } from './types';

/**
 * ImageViewerDOM - DOM structure management for ImageViewer
 *
 * Handles all DOM-related operations:
 * - Container finding and creation
 * - HTML structure generation
 * - Element reference management
 * - DOM cleanup
 */
export class ImageViewerDOM {
  private elements: Partial<ViewerElements> = {};

  /**
   * Initialize DOM from an element or selector
   * @param element - CSS selector or HTMLElement
   * @param imageViewHtml - HTML template for the viewer structure
   * @param validateImageUrl - Function to validate image URLs
   * @returns Initial setup data (container, domElement, image sources)
   */
  initialize(
    element: string | HTMLElement,
    imageViewHtml: string,
    validateImageUrl: (url: string | null | undefined, context: string) => string | null,
  ): {
    container: HTMLElement;
    domElement: HTMLElement;
    imageSrc?: string;
    hiResImageSrc?: string;
    elements: Partial<ViewerElements>;
  } {
    // Resolve element
    const domElement = this._resolveElement(element);

    // Check if viewer already initialized
    if ((domElement as HTMLElementWithViewer)._imageViewer) {
      throw new Error('An image viewer is already being initiated on the element.');
    }

    let container: HTMLElement;
    let imageSrc: string | undefined;
    let hiResImageSrc: string | undefined;

    // Handle IMG element vs container element
    if (domElement.tagName === 'IMG') {
      const result = this._processImgElement(domElement as HTMLImageElement, validateImageUrl);
      container = result.container;
      imageSrc = result.imageSrc;
      hiResImageSrc = result.hiResImageSrc;
    } else {
      container = domElement;
      const sources = this._extractImageSourcesFromContainer(domElement, validateImageUrl);
      imageSrc = sources.imageSrc;
      hiResImageSrc = sources.hiResImageSrc;
    }

    // Store initial elements
    this.elements = { container, domElement };

    // Create DOM structure
    this._createStructure(container, imageViewHtml);

    return {
      container,
      domElement,
      imageSrc,
      hiResImageSrc,
      elements: this.elements,
    };
  }

  /**
   * Get all current element references
   */
  getElements(): Partial<ViewerElements> {
    return this.elements;
  }

  /**
   * Get a specific element
   */
  getElement<K extends keyof ViewerElements>(key: K): ViewerElements[K] | undefined {
    return this.elements[key] as ViewerElements[K] | undefined;
  }

  /**
   * Set a specific element
   */
  setElement<K extends keyof ViewerElements>(key: K, element: ViewerElements[K] | undefined): void {
    this.elements[key] = element;
  }

  /**
   * Cleanup DOM when destroying viewer
   */
  destroy(domElement: HTMLElement, container: HTMLElement): void {
    // Remove viewer HTML structure
    const ivWrap = container.querySelector('.iv-wrap');
    if (ivWrap) {
      remove(ivWrap);
    }

    // Remove container class
    removeClass(container, 'iv-container');

    // Unwrap if container was created from IMG element
    if (domElement !== container) {
      unwrap(domElement);
    }
  }

  /**
   * Resolve element from string selector or HTMLElement
   */
  private _resolveElement(element: string | HTMLElement): HTMLElement {
    if (typeof element === 'string') {
      const foundElement = document.querySelector(element);
      if (!foundElement) {
        throw new Error(`Element not found: ${element}`);
      }
      return foundElement as HTMLElement;
    }
    return element;
  }

  /**
   * Process IMG element - extract sources and create container
   */
  private _processImgElement(
    imgElement: HTMLImageElement,
    validateImageUrl: (url: string | null | undefined, context: string) => string | null,
  ): {
    container: HTMLElement;
    imageSrc: string | undefined;
    hiResImageSrc: string | undefined;
  } {
    const rawSrc = imgElement.src;
    const rawHiResSrc =
      imgElement.getAttribute('high-res-src') || imgElement.getAttribute('data-high-res-src');

    // Validate image URLs
    const imageSrc = validateImageUrl(rawSrc, 'main');
    const hiResImageSrc = validateImageUrl(rawHiResSrc, 'hiRes');

    if (!imageSrc) {
      throw new Error('Invalid or unsafe image URL protocol');
    }

    // Wrap the image with container
    const container = wrap(imgElement, {
      className: 'iv-container iv-image-mode',
      style: { display: 'inline-block', overflow: 'hidden' },
    });

    // Hide original image
    setStyle(imgElement, {
      opacity: '0',
      position: 'relative',
      'z-index': '-1',
    });

    return { container, imageSrc, hiResImageSrc };
  }

  /**
   * Extract image sources from container element attributes
   */
  private _extractImageSourcesFromContainer(
    containerElement: HTMLElement,
    validateImageUrl: (url: string | null | undefined, context: string) => string | null,
  ): {
    imageSrc: string | undefined;
    hiResImageSrc: string | undefined;
  } {
    const rawSrc =
      containerElement.getAttribute('src') || containerElement.getAttribute('data-src');
    const rawHiResSrc =
      containerElement.getAttribute('high-res-src') ||
      containerElement.getAttribute('data-high-res-src');

    // Validate image URLs
    const imageSrc = validateImageUrl(rawSrc, 'main');
    const hiResImageSrc = validateImageUrl(rawHiResSrc, 'hiRes');

    return { imageSrc, hiResImageSrc };
  }

  /**
   * Create viewer DOM structure
   */
  private _createStructure(container: HTMLElement, imageViewHtml: string): void {
    // Add viewer layout
    createElement({
      tagName: 'div',
      className: 'iv-wrap',
      html: imageViewHtml,
      trustedHTML: true,
      parent: container,
    });

    // Add container class
    addClass(container, 'iv-container');

    // Position container relatively if static
    if (getStyle(container, 'position') === 'static') {
      setStyle(container, { position: 'relative' });
    }

    // Query and store element references
    const snapView = container.querySelector('.iv-snap-view') as HTMLElement;
    const snapImageWrap = container.querySelector('.iv-snap-image-wrap') as HTMLElement;
    const imageWrap = container.querySelector('.iv-image-wrap') as HTMLElement;
    const snapHandle = container.querySelector('.iv-snap-handle') as HTMLElement;
    const zoomHandle = container.querySelector('.iv-zoom-handle') as HTMLElement;
    const zoomIn = container.querySelector('.iv-button-zoom--in') as HTMLElement | null;
    const zoomOut = container.querySelector('.iv-button-zoom--out') as HTMLElement | null;

    if (!snapView || !snapImageWrap || !imageWrap || !snapHandle || !zoomHandle) {
      throw new Error('Required viewer elements not found in container');
    }

    // Store element references
    this.elements = {
      ...this.elements,
      snapView,
      snapImageWrap,
      imageWrap,
      snapHandle,
      zoomHandle,
      zoomIn: zoomIn || undefined,
      zoomOut: zoomOut || undefined,
    };
  }
}
