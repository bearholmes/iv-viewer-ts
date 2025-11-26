import { createElement, setStyle, remove, removeCss } from './util';
import ImageViewer from './ImageViewer';

// REFACTOR: Extract hardcoded CSS selectors to constants (Issue A1.9)
const FULLSCREEN_SELECTORS = {
  FULLSCREEN: 'iv-fullscreen',
  CONTAINER: 'iv-fullscreen-container',
  CLOSE_BTN: 'iv-fullscreen-close',
} as const;

const fullScreenHtml = `
  <div class="${FULLSCREEN_SELECTORS.CONTAINER}"></div>
  <div class="${FULLSCREEN_SELECTORS.CLOSE_BTN}"></div>
`;

class FullScreenViewer extends ImageViewer {
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
  constructor(options = {}) {
    const fullScreenElem = createElement({
      tagName: 'div',
      className: FULLSCREEN_SELECTORS.FULLSCREEN,
      html: fullScreenHtml,
      parent: document.body,
    });

    const container = fullScreenElem.querySelector(
      `.${FULLSCREEN_SELECTORS.CONTAINER}`
    ) as HTMLElement;
    if (!container) {
      throw new Error('Fullscreen container element not found');
    }

    // call the ImageViewer constructor
    super(container, { ...options, refreshOnResize: false });

    // add fullScreenElem on element list (use accessor method - Issue E2.1)
    this._setElement('fullScreen', fullScreenElem);

    this._initFullScreenEvents();
  }
  _initFullScreenEvents() {
    const fullScreen = this._getElement('fullScreen');
    if (!fullScreen) {
      throw new Error('Fullscreen element not initialized');
    }
    const closeBtn = fullScreen.querySelector(`.${FULLSCREEN_SELECTORS.CLOSE_BTN}`) as HTMLElement;
    if (!closeBtn) {
      throw new Error('Fullscreen close button not found');
    }

    // REFACTOR: Use EventManager for close button event (Phase 6.1)
    this.eventManager.on('onCloseBtnClick', closeBtn, 'click', this.hide as EventListener);
  }
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
  show(imageSrc: string, hiResImageSrc: string) {
    // show the element (use accessor method - Issue E2.1, use setStyle - Issue A1.10)
    const fullScreen = this._getElement('fullScreen');
    if (fullScreen) {
      setStyle(fullScreen, { display: 'block' });
    }

    // if image source is provide load image source
    if (imageSrc) {
      this.load(imageSrc, hiResImageSrc);
    }

    // REFACTOR: Use EventManager for window resize event (Phase 6.1)
    // Note: This replaces any existing onWindowResize from ImageViewer
    this.eventManager.on('onWindowResize', window, 'resize', () => this.refresh());

    // disable scroll on html (use setStyle - Issue A1.10)
    const htmlElem = document.querySelector('html');
    if (htmlElem) {
      setStyle(htmlElem as HTMLElement, { overflow: 'hidden' });
    }
  }
  /**
   * Hides the fullscreen viewer
   * Re-enables page scrolling and removes window resize handler
   * @example
   * ```typescript
   * viewer.hide();
   * ```
   */
  hide = () => {
    // hide the fullscreen (use accessor method - Issue E2.1, use setStyle - Issue A1.10)
    const fullScreen = this._getElement('fullScreen');
    if (fullScreen) {
      setStyle(fullScreen, { display: 'none' });
    }

    // enable scroll
    const htmlElem = document.querySelector('html');
    if (htmlElem) {
      removeCss(htmlElem as HTMLElement, 'overflow');
    }

    // REFACTOR: Use EventManager to remove window resize event (Phase 6.1)
    this.eventManager.off('onWindowResize');
  };
  /**
   * Destroys the fullscreen viewer and removes it from the DOM
   * Calls parent ImageViewer destroy method first
   * @example
   * ```typescript
   * viewer.destroy();
   * ```
   */
  destroy() {
    // get fullScreen element (use accessor method - Issue E2.1)
    const fullScreen = this._getElement('fullScreen');

    // destroy image viewer
    super.destroy();

    // remove the element
    if (fullScreen) {
      remove(fullScreen);
    }
  }
}

export default FullScreenViewer;
