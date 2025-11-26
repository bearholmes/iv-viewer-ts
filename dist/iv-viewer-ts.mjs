var __defProp = Object.defineProperty;
var __defProps = Object.defineProperties;
var __getOwnPropDescs = Object.getOwnPropertyDescriptors;
var __getOwnPropSymbols = Object.getOwnPropertySymbols;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __propIsEnum = Object.prototype.propertyIsEnumerable;
var __defNormalProp = (obj, key, value) => key in obj ? __defProp(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
var __spreadValues = (a, b) => {
  for (var prop in b || (b = {}))
    if (__hasOwnProp.call(b, prop))
      __defNormalProp(a, prop, b[prop]);
  if (__getOwnPropSymbols)
    for (var prop of __getOwnPropSymbols(b)) {
      if (__propIsEnum.call(b, prop))
        __defNormalProp(a, prop, b[prop]);
    }
  return a;
};
var __spreadProps = (a, b) => __defProps(a, __getOwnPropDescs(b));
var __publicField = (obj, key, value) => __defNormalProp(obj, typeof key !== "symbol" ? key + "" : key, value);
const ZOOM_CONSTANT = 15;
const MOUSE_WHEEL_COUNT = 5;
function easeOutQuart(currentTime, startValue, changedValue, duration) {
  currentTime /= duration;
  currentTime -= 1;
  return -changedValue * (currentTime * currentTime * currentTime * currentTime - 1) + startValue;
}
function isValidImageUrl(url) {
  if (!url) return false;
  try {
    const parsed = new URL(url, window.location.href);
    const allowedProtocols = ["http:", "https:", "blob:"];
    return allowedProtocols.includes(parsed.protocol);
  } catch (e) {
    return false;
  }
}
function createElement(options) {
  const elem = document.createElement(options.tagName);
  if (options.id) elem.id = options.id;
  if (options.html) {
    if (!options.trustedHTML) {
      throw new Error("innerHTML requires trustedHTML=true to avoid XSS risks");
    }
    elem.innerHTML = options.html;
  }
  if (options.className) elem.className = options.className;
  if (options.src && elem instanceof HTMLImageElement) {
    if (!isValidImageUrl(options.src)) {
      throw new Error(`Invalid or unsafe image URL protocol: ${options.src}`);
    }
    elem.setAttribute("src", options.src);
  }
  if (options.style) setStyle(elem, options.style);
  if (options.child) elem.appendChild(options.child);
  if (options.insertBefore) {
    options.parent.insertBefore(elem, options.insertBefore);
  } else {
    options.parent.appendChild(elem);
  }
  return elem;
}
function addClass(el, className) {
  const classNameAry = className.split(" ");
  if (classNameAry.length > 1) {
    classNameAry.forEach((classItem) => addClass(el, classItem));
  } else if (el.classList) {
    el.classList.add(className);
  } else {
    el.className += ` ${className}`;
  }
}
function removeClass(el, className) {
  const classNameAry = className.split(" ");
  if (classNameAry.length > 1) {
    classNameAry.forEach((classItem) => removeClass(el, classItem));
  } else if (el.classList) {
    el.classList.remove(className);
  } else {
    el.className = el.className.replace(new RegExp(`(^|\\s)${className}(\\s|$)`, "g"), " ").trim();
  }
}
function imageLoaded(img) {
  return img.complete && (typeof img.naturalWidth === "undefined" || img.naturalWidth !== 0);
}
function toArray(list) {
  if (list instanceof HTMLElement) {
    return [list];
  } else if (list instanceof NodeList || list instanceof HTMLCollection) {
    return Array.prototype.slice.call(list);
  } else {
    return [];
  }
}
function getStyle(element, property) {
  const styles = window.getComputedStyle(element);
  const value = styles.getPropertyValue(property);
  if (value) return value;
  if (property in styles) {
    const propValue = styles[property];
    return typeof propValue === "string" ? propValue : String(propValue);
  }
  return "";
}
function parseStyleFloat(element, property, defaultValue = 0) {
  const value = getStyle(element, property);
  const parsed = parseFloat(value);
  return isNaN(parsed) ? defaultValue : parsed;
}
function setStyle(elements, properties) {
  const elmArray = toArray(elements);
  elmArray.forEach((element) => {
    if (element instanceof HTMLElement) {
      Object.keys(properties).forEach((key) => {
        const value = properties[key];
        const stringValue = String(value);
        const lower = stringValue.toLowerCase();
        if (lower.includes("javascript:") || lower.includes("expression(")) {
          throw new Error("Blocked unsafe CSS value");
        }
        const sanitizedValue = stringValue.replace(/[<>'"]/g, "");
        element.style.setProperty(key, sanitizedValue);
      });
    }
  });
}
function removeCss(element, property) {
  element.style.removeProperty(property);
}
function wrap(element, {
  tag = "div",
  className,
  id,
  style
}) {
  const wrapper = document.createElement(tag);
  wrapper.className = className;
  if (id) wrapper.id = id;
  if (style) {
    if (style.display) wrapper.style.display = style.display;
    if (style.overflow) wrapper.style.overflow = style.overflow;
  }
  const parentNode = element.parentNode;
  if (!parentNode) {
    throw new Error("element does not have a parent node");
  }
  parentNode.insertBefore(wrapper, element);
  parentNode.removeChild(element);
  wrapper.appendChild(element);
  return wrapper;
}
function unwrap(element) {
  var _a, _b;
  const parent = element.parentNode;
  if (parent && parent !== document.body) {
    (_a = parent.parentNode) == null ? void 0 : _a.insertBefore(element, parent);
    (_b = parent.parentNode) == null ? void 0 : _b.removeChild(parent);
  }
}
function remove(elements) {
  const elmArray = toArray(elements);
  elmArray.forEach((element) => {
    if (element instanceof Element && element.parentNode) {
      element.parentNode.removeChild(element);
    }
  });
}
function clamp(num, min, max) {
  return Math.min(Math.max(num, min), max);
}
function assignEvent(element, events, handler) {
  const eventList = Array.isArray(events) ? events : [events];
  eventList.forEach((event) => element.addEventListener(event, handler));
  return () => {
    eventList.forEach((event) => element.removeEventListener(event, handler));
  };
}
function getTouchPointsDistance(touches) {
  const touch0 = touches[0];
  const touch1 = touches[1];
  return Math.sqrt(
    Math.pow(touch1.pageX - touch0.pageX, 2) + Math.pow(touch1.pageY - touch0.pageY, 2)
  );
}
class ZoomAnimation {
  constructor(config) {
    __publicField(this, "currentZoom");
    __publicField(this, "targetZoom");
    __publicField(this, "currentLeft");
    __publicField(this, "currentTop");
    __publicField(this, "zoomPoint");
    __publicField(this, "imageDim");
    __publicField(this, "bounds");
    __publicField(this, "totalFrames");
    this.currentZoom = config.currentZoom;
    this.targetZoom = config.targetZoom;
    this.currentLeft = config.currentLeft;
    this.currentTop = config.currentTop;
    this.zoomPoint = config.zoomPoint;
    this.imageDim = config.imageDim;
    this.bounds = config.bounds;
    this.totalFrames = config.totalFrames;
  }
  /**
   * Calculates zoom frame data for a specific animation step
   * Uses easeOutQuart easing for smooth deceleration
   * @param step - Current animation step (0 to totalFrames)
   * @returns Frame data with zoom level and constrained position
   */
  getFrame(step) {
    const tickZoom = easeOutQuart(
      step,
      this.currentZoom,
      this.targetZoom - this.currentZoom,
      this.totalFrames
    );
    const width = this.imageDim.w * tickZoom / 100;
    const height = this.imageDim.h * tickZoom / 100;
    const position = this.calculatePosition(tickZoom);
    const constrainedPosition = this.constrainToBounds(position, width, height);
    return {
      zoom: tickZoom,
      width,
      height,
      left: constrainedPosition.left,
      top: constrainedPosition.top
    };
  }
  /**
   * Calculates new image position to keep zoom point fixed during zoom
   * Uses ratio-based calculation: newPos = -((point - currentPos) * ratio - point)
   * @param tickZoom - Current zoom level for this frame
   * @returns Unconstrained position
   */
  calculatePosition(tickZoom) {
    const ratio = tickZoom / this.currentZoom;
    const left = -((this.zoomPoint.x - this.currentLeft) * ratio - this.zoomPoint.x);
    const top = -((this.zoomPoint.y - this.currentTop) * ratio - this.zoomPoint.y);
    return { left, top };
  }
  /**
   * Constrains position to prevent showing empty space around image
   * Ensures image covers container when zoomed in
   * @param position - Unconstrained position from calculatePosition
   * @param width - Image width at current zoom
   * @param height - Image height at current zoom
   * @returns Constrained position
   */
  constrainToBounds(position, width, height) {
    let { left, top } = position;
    const { baseLeft, baseTop, baseRight, baseBottom } = this.bounds;
    left = Math.min(left, baseLeft);
    top = Math.min(top, baseTop);
    if (left + width < baseRight) {
      left = baseRight - width;
    }
    if (top + height < baseBottom) {
      top = baseBottom - height;
    }
    return { left, top };
  }
}
class DimensionCalculator {
  /**
   * Calculate fitted image dimensions that fit within container while maintaining aspect ratio
   * @param containerDim - Container dimensions
   * @param naturalWidth - Natural width of the image
   * @param naturalHeight - Natural height of the image
   * @returns Calculated image dimensions that fit within container
   */
  static calculateFittedImageDimensions(containerDim, naturalWidth, naturalHeight) {
    const ratio = naturalWidth / naturalHeight;
    const imgWidth = naturalWidth > naturalHeight && containerDim.h >= containerDim.w || ratio * containerDim.h > containerDim.w ? containerDim.w : ratio * containerDim.h;
    return {
      w: imgWidth,
      h: imgWidth / ratio
    };
  }
  /**
   * Calculate snap image dimensions that fit within snap view while maintaining aspect ratio
   * @param imageDim - Full image dimensions
   * @param snapViewDim - Snap view container dimensions
   * @returns Calculated snap image dimensions
   */
  static calculateSnapImageDimensions(imageDim, snapViewDim) {
    const snapWidth = imageDim.w > imageDim.h ? snapViewDim.w : imageDim.w * snapViewDim.h / imageDim.h;
    const snapHeight = imageDim.h > imageDim.w ? snapViewDim.h : imageDim.h * snapViewDim.w / imageDim.w;
    return {
      w: snapWidth,
      h: snapHeight
    };
  }
  /**
   * Calculate all dimensions needed for the image viewer
   * @param params - Calculation parameters
   * @returns Calculated dimensions for image and snap image
   */
  static calculateAllDimensions(params) {
    const { containerDim, naturalWidth, naturalHeight, snapViewDim } = params;
    const imageDim = this.calculateFittedImageDimensions(containerDim, naturalWidth, naturalHeight);
    const snapImageDim = this.calculateSnapImageDimensions(imageDim, snapViewDim);
    return {
      imageDim,
      snapImageDim
    };
  }
  /**
   * Calculate snap handle dimensions based on container and image dimensions
   * @param containerDim - Container dimensions
   * @param imageDim - Current image dimensions (may be zoomed)
   * @param snapImageDim - Snap image dimensions
   * @returns Snap handle dimensions
   */
  static calculateSnapHandleDimensions(containerDim, imageDim, snapImageDim) {
    const handleWidth = imageDim.w !== 0 ? snapImageDim.w * containerDim.w / imageDim.w : containerDim.w;
    const handleHeight = imageDim.h !== 0 ? snapImageDim.h * containerDim.h / imageDim.h : containerDim.h;
    return {
      w: handleWidth,
      h: handleHeight
    };
  }
}
class MomentumCalculator {
  /**
   * Calculate momentum delta from position samples
   * @param positions - Array of position samples [oldest, newest]
   * @returns Delta between positions
   */
  static calculateDelta(positions) {
    if (positions.length < 2) {
      return { xDiff: 0, yDiff: 0 };
    }
    return {
      xDiff: positions[1].x - positions[0].x,
      yDiff: positions[1].y - positions[0].y
    };
  }
  /**
   * Check if momentum threshold is exceeded
   * @param xDiff - X axis movement delta
   * @param yDiff - Y axis movement delta
   * @param thresholdPx - Threshold in pixels
   * @returns True if momentum should be applied
   */
  static shouldApplyMomentum(xDiff, yDiff, thresholdPx) {
    return Math.abs(xDiff) > thresholdPx || Math.abs(yDiff) > thresholdPx;
  }
  /**
   * Calculate position for a momentum animation frame
   * @param step - Current animation step (1-based)
   * @param startPos - Starting position {dx, dy}
   * @param delta - Momentum delta {xDiff, yDiff}
   * @param config - Momentum configuration
   * @returns Calculated frame data
   */
  static calculateMomentumFrame(step, startPos, delta, config) {
    const { xDiff, yDiff } = delta;
    const { velocityFactor, animationFrames } = config;
    const xOffset = easeOutQuart(
      step,
      xDiff * velocityFactor,
      -xDiff * velocityFactor,
      animationFrames
    );
    const yOffset = easeOutQuart(
      step,
      yDiff * velocityFactor,
      -yDiff * velocityFactor,
      animationFrames
    );
    return {
      positionX: startPos.dx + xOffset,
      positionY: startPos.dy + yOffset,
      shouldContinue: step < animationFrames
    };
  }
  /**
   * Convert image position to snap slider coordinates
   * @param position - Image position {x, y}
   * @param imageDim - Image dimensions
   * @param snapImageDim - Snap image dimensions
   * @returns Snap slider coordinates
   */
  static convertToSnapCoordinates(position, imageDim, snapImageDim) {
    const dx = imageDim.w !== 0 ? -(position.x * snapImageDim.w) / imageDim.w : 0;
    const dy = imageDim.h !== 0 ? -(position.y * snapImageDim.h) / imageDim.h : 0;
    return { dx, dy };
  }
}
class SliderCoordinator {
  constructor(snapSlider, config) {
    __publicField(this, "snapSlider");
    __publicField(this, "getImageDim");
    __publicField(this, "getSnapImageDim");
    this.snapSlider = snapSlider;
    this.getImageDim = config.getImageDim;
    this.getSnapImageDim = config.getSnapImageDim;
  }
  /**
   * Notifies snap slider that image panning has started
   * Triggers snap slider's onStart callback to initialize state
   * @param event - Event that triggered the image pan start
   */
  notifyPanStart(event) {
    this.snapSlider.onStart(event, { x: 0, y: 0 });
  }
  /**
   * Synchronizes snap slider position when image is moved
   * Converts image delta to snap slider delta using dimension ratios
   * REFACTOR: Uses updatePosition instead of creating dummy events (Issue A1.12)
   * @param imagePosition - Image movement delta and current position
   */
  syncSnapSliderPosition(imagePosition) {
    const imageDim = this.getImageDim();
    const snapImageDim = this.getSnapImageDim();
    const dx = imageDim.w !== 0 ? -imagePosition.dx * snapImageDim.w / imageDim.w : 0;
    const dy = imageDim.h !== 0 ? -imagePosition.dy * snapImageDim.h / imageDim.h : 0;
    this.snapSlider.updatePosition({
      dx,
      dy,
      mx: 0,
      // Mouse position not relevant for sync
      my: 0
    });
  }
  /**
   * Gets reference to snap slider for momentum animation
   * This is needed because momentum animation updates snap slider directly
   * @returns The snap slider instance
   */
  getSnapSlider() {
    return this.snapSlider;
  }
}
class ViewerHTMLTemplates {
  /**
   * Creates the zoom-in button HTML
   * Only generated if hasZoomButtons option is true
   *
   * @param hasZoomButtons - Whether to create the button
   * @returns HTML string for zoom-in button or empty string
   *
   * @example
   * ```typescript
   * const btn = ViewerHTMLTemplates.createZoomInButton(true);
   * // '<div class="iv-button-zoom--in" role="button"></div>'
   * ```
   */
  static createZoomInButton(hasZoomButtons) {
    return hasZoomButtons ? `<div class="iv-button-zoom--in" role="button"></div>` : "";
  }
  /**
   * Creates the zoom-out button HTML
   * Only generated if hasZoomButtons option is true
   *
   * @param hasZoomButtons - Whether to create the button
   * @returns HTML string for zoom-out button or empty string
   *
   * @example
   * ```typescript
   * const btn = ViewerHTMLTemplates.createZoomOutButton(true);
   * // '<div class="iv-button-zoom--out" role="button"></div>'
   * ```
   */
  static createZoomOutButton(hasZoomButtons) {
    return hasZoomButtons ? `<div class="iv-button-zoom--out" role="button"></div>` : "";
  }
  /**
   * Creates the complete image viewer HTML structure
   * Includes loader, snap view, zoom controls, and image container
   *
   * @param hasZoomButtons - Whether to include zoom in/out buttons
   * @returns Complete HTML string for the viewer
   *
   * @example
   * ```typescript
   * const html = ViewerHTMLTemplates.createViewerHTML(true);
   * container.innerHTML = html;
   * ```
   */
  static createViewerHTML(hasZoomButtons) {
    const zoomInBtn = this.createZoomInButton(hasZoomButtons);
    const zoomOutBtn = this.createZoomOutButton(hasZoomButtons);
    const zoomActionsClass = hasZoomButtons ? "iv-zoom-actions--has-buttons" : "";
    return `
  <div class="iv-loader"></div>
  <div class="iv-snap-view">
    <div class="iv-snap-image-wrap">
      <div class="iv-snap-handle"></div>
    </div>
    <div class="iv-zoom-actions ${zoomActionsClass}">
      ${zoomInBtn}
      <div class="iv-zoom-slider">
        <div class="iv-zoom-handle"></div>
      </div>
      ${zoomOutBtn}
    </div>
  </div>
  <div class="iv-image-view" >
    <div class="iv-image-wrap" ></div>
  </div>
`;
  }
}
const _ImageLoader = class _ImageLoader {
  constructor(elements, onLoadSuccess, onLoadError) {
    __publicField(this, "loadCounter", 0);
    __publicField(this, "activeLoads", /* @__PURE__ */ new Map());
    this.elements = elements;
    this.onLoadSuccess = onLoadSuccess;
    this.onLoadError = onLoadError;
  }
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
  load(imageSrc, hiResImageSrc) {
    const { container } = this.elements;
    if (!container) {
      throw new Error("Container element not found");
    }
    this._cancelPreviousLoads();
    const loadId = ++this.loadCounter;
    const ivLoader = container.querySelector(".iv-loader");
    if (!ivLoader) {
      throw new Error("Loader element not found");
    }
    remove(container.querySelectorAll(".iv-snap-image, .iv-image"));
    const safeImageSrc = this.sanitizeImageSrc(imageSrc);
    const { snapImage, image } = this._createImageElements(safeImageSrc);
    this.elements.image = image;
    this.elements.snapImage = snapImage;
    setStyle(ivLoader, { display: "block" });
    setStyle(image, { visibility: "hidden" });
    const onImageLoad = () => {
      this._handleLoadSuccess(loadId, hiResImageSrc);
    };
    const onImageError = (e) => {
      this._handleLoadError(loadId, e);
    };
    if (imageLoaded(image)) {
      onImageLoad();
    } else {
      const imageLoadRemover = assignEvent(image, "load", onImageLoad);
      const imageErrorRemover = assignEvent(image, "error", onImageError);
      this.activeLoads.set("imageLoad", imageLoadRemover);
      this.activeLoads.set("imageError", imageErrorRemover);
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
  loadHighRes(hiResImageSrc) {
    const { imageWrap } = this.elements;
    if (!imageWrap) {
      throw new Error("Image wrap element not found");
    }
    const safeHiResSrc = this.sanitizeImageSrc(hiResImageSrc);
    const lowResImg = this.elements.image;
    if (!lowResImg) {
      throw new Error("Low-res image not found");
    }
    const hiResImage = createElement({
      tagName: "img",
      className: "iv-image iv-large-image",
      src: safeHiResSrc,
      parent: imageWrap
    });
    const lowResStyles = window.getComputedStyle(lowResImg);
    setStyle(hiResImage, {
      width: lowResStyles.width,
      height: lowResStyles.height,
      left: lowResStyles.left,
      top: lowResStyles.top,
      maxWidth: lowResStyles.maxWidth,
      maxHeight: lowResStyles.maxHeight,
      visibility: lowResStyles.visibility
    });
    const onHighResImageLoad = () => {
      remove(lowResImg);
      this.elements.image = hiResImage;
    };
    if (imageLoaded(hiResImage)) {
      onHighResImageLoad();
    } else {
      const hiResLoadRemover = assignEvent(hiResImage, "load", onHighResImageLoad);
      this.activeLoads.set("hiResImageLoad", hiResLoadRemover);
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
  destroy() {
    this._cancelPreviousLoads();
  }
  /**
   * Creates snap and main image elements
   * @private
   */
  _createImageElements(imageSrc) {
    const safeSrc = this.sanitizeImageSrc(imageSrc);
    const { snapImageWrap, imageWrap } = this.elements;
    if (!snapImageWrap || !imageWrap) {
      throw new Error("Image wrap elements not found");
    }
    const firstChild = snapImageWrap.firstChild;
    const snapImage = createElement(__spreadProps(__spreadValues({
      tagName: "img",
      className: "iv-snap-image"
    }, firstChild ? { insertBefore: firstChild } : {}), {
      parent: snapImageWrap
    }));
    snapImage.setAttribute("src", safeSrc);
    const image = createElement({
      tagName: "img",
      className: "iv-image iv-small-image",
      parent: imageWrap
    });
    image.setAttribute("src", safeSrc);
    return { snapImage, image };
  }
  /**
   * Validates and normalizes image URLs to allowed protocols.
   * Throws if the URL is unsafe.
   */
  sanitizeImageSrc(src) {
    if (!isValidImageUrl(src)) {
      throw new Error(`Invalid or unsafe image URL: ${src}`);
    }
    const parsed = new URL(src, window.location.href);
    if (!_ImageLoader.ALLOWED_PROTOCOLS.includes(parsed.protocol)) {
      throw new Error(`Invalid or unsafe image URL protocol: ${src}`);
    }
    return parsed.href;
  }
  /**
   * Handles successful image load
   * @private
   */
  _handleLoadSuccess(loadId, hiResImageSrc) {
    if (loadId !== this.loadCounter) {
      return;
    }
    const { container } = this.elements;
    if (!container) return;
    const ivLoader = container.querySelector(".iv-loader");
    const image = this.elements.image;
    if (ivLoader) {
      setStyle(ivLoader, { display: "none" });
    }
    if (image) {
      setStyle(image, { visibility: "visible" });
    }
    if (hiResImageSrc) {
      this.loadHighRes(hiResImageSrc);
    }
    this.onLoadSuccess(loadId);
  }
  /**
   * Handles image load error
   * @private
   */
  _handleLoadError(loadId, error) {
    if (loadId !== this.loadCounter) {
      return;
    }
    const { container } = this.elements;
    if (!container) return;
    const ivLoader = container.querySelector(".iv-loader");
    if (ivLoader) {
      setStyle(ivLoader, { display: "none" });
    }
    this.onLoadError(loadId, error);
  }
  /**
   * Cancels all previous load operations
   * @private
   */
  _cancelPreviousLoads() {
    this.activeLoads.forEach((remover) => remover());
    this.activeLoads.clear();
  }
};
__publicField(_ImageLoader, "ALLOWED_PROTOCOLS", ["http:", "https:", "blob:"]);
let ImageLoader = _ImageLoader;
class EventManager {
  constructor() {
    __publicField(this, "listeners", /* @__PURE__ */ new Map());
  }
  /**
   * Registers an event listener with a name for later reference
   * Automatically removes any existing listener with the same name
   *
   * @param name - Unique identifier for this event listener
   * @param target - Element or window to attach event to
   * @param eventType - Event type(s) to listen for
   * @param handler - Event handler function
   * @returns Cleanup function to remove the event listener
   *
   * @example
   * ```typescript
   * eventManager.on('resize', window, 'resize', () => console.log('resized'));
   * eventManager.on('clicks', button, ['click', 'touchend'], handleClick);
   * ```
   */
  on(name, target, eventType, handler) {
    this.off(name);
    const removeListener = assignEvent(target, eventType, handler);
    this.listeners.set(name, removeListener);
    return removeListener;
  }
  /**
   * Removes a specific event listener by name
   *
   * @param name - Name of the event listener to remove
   * @returns true if listener was found and removed, false otherwise
   *
   * @example
   * ```typescript
   * eventManager.off('windowResize');
   * ```
   */
  off(name) {
    const listener = this.listeners.get(name);
    if (listener) {
      listener();
      this.listeners.delete(name);
      return true;
    }
    return false;
  }
  /**
   * Removes all registered event listeners
   * Should be called when destroying the component
   *
   * @example
   * ```typescript
   * eventManager.destroy();
   * ```
   */
  destroy() {
    this.listeners.forEach((listener) => listener());
    this.listeners.clear();
  }
  /**
   * Gets the number of active event listeners
   *
   * @returns Number of registered listeners
   *
   * @example
   * ```typescript
   * console.log(`Active listeners: ${eventManager.count()}`);
   * ```
   */
  count() {
    return this.listeners.size;
  }
  /**
   * Checks if a specific event listener is registered
   *
   * @param name - Name of the event listener to check
   * @returns true if listener exists, false otherwise
   *
   * @example
   * ```typescript
   * if (eventManager.has('windowResize')) {
   *   console.log('Resize listener is active');
   * }
   * ```
   */
  has(name) {
    return this.listeners.has(name);
  }
  /**
   * Gets all registered event listener names
   *
   * @returns Array of event listener names
   *
   * @example
   * ```typescript
   * const names = eventManager.getNames();
   * console.log('Active events:', names);
   * ```
   */
  getNames() {
    return Array.from(this.listeners.keys());
  }
}
class ImageViewerDOM {
  constructor() {
    __publicField(this, "elements", {});
  }
  /**
   * Initialize DOM from an element or selector
   * @param element - CSS selector or HTMLElement
   * @param imageViewHtml - HTML template for the viewer structure
   * @param validateImageUrl - Function to validate image URLs
   * @returns Initial setup data (container, domElement, image sources)
   */
  initialize(element, imageViewHtml, validateImageUrl) {
    const domElement = this._resolveElement(element);
    if (domElement._imageViewer) {
      throw new Error("An image viewer is already being initiated on the element.");
    }
    let container;
    let imageSrc;
    let hiResImageSrc;
    if (domElement.tagName === "IMG") {
      const result = this._processImgElement(domElement, validateImageUrl);
      container = result.container;
      imageSrc = result.imageSrc;
      hiResImageSrc = result.hiResImageSrc;
    } else {
      container = domElement;
      const sources = this._extractImageSourcesFromContainer(domElement, validateImageUrl);
      imageSrc = sources.imageSrc;
      hiResImageSrc = sources.hiResImageSrc;
    }
    this.elements = { container, domElement };
    this._createStructure(container, imageViewHtml);
    return {
      container,
      domElement,
      imageSrc,
      hiResImageSrc,
      elements: this.elements
    };
  }
  /**
   * Get all current element references
   */
  getElements() {
    return this.elements;
  }
  /**
   * Get a specific element
   */
  getElement(key) {
    return this.elements[key];
  }
  /**
   * Set a specific element
   */
  setElement(key, element) {
    this.elements[key] = element;
  }
  /**
   * Cleanup DOM when destroying viewer
   */
  destroy(domElement, container) {
    const ivWrap = container.querySelector(".iv-wrap");
    if (ivWrap) {
      remove(ivWrap);
    }
    removeClass(container, "iv-container");
    if (domElement !== container) {
      unwrap(domElement);
    }
  }
  /**
   * Resolve element from string selector or HTMLElement
   */
  _resolveElement(element) {
    if (typeof element === "string") {
      const foundElement = document.querySelector(element);
      if (!foundElement) {
        throw new Error(`Element not found: ${element}`);
      }
      return foundElement;
    }
    return element;
  }
  /**
   * Process IMG element - extract sources and create container
   */
  _processImgElement(imgElement, validateImageUrl) {
    const rawSrc = imgElement.src;
    const rawHiResSrc = imgElement.getAttribute("high-res-src") || imgElement.getAttribute("data-high-res-src");
    const imageSrc = validateImageUrl(rawSrc, "main");
    const hiResImageSrc = validateImageUrl(rawHiResSrc, "hiRes");
    if (!imageSrc) {
      throw new Error("Invalid or unsafe image URL protocol");
    }
    const container = wrap(imgElement, {
      className: "iv-container iv-image-mode",
      style: { display: "inline-block", overflow: "hidden" }
    });
    setStyle(imgElement, {
      opacity: "0",
      position: "relative",
      "z-index": "-1"
    });
    return { container, imageSrc, hiResImageSrc };
  }
  /**
   * Extract image sources from container element attributes
   */
  _extractImageSourcesFromContainer(containerElement, validateImageUrl) {
    const rawSrc = containerElement.getAttribute("src") || containerElement.getAttribute("data-src");
    const rawHiResSrc = containerElement.getAttribute("high-res-src") || containerElement.getAttribute("data-high-res-src");
    const imageSrc = validateImageUrl(rawSrc, "main");
    const hiResImageSrc = validateImageUrl(rawHiResSrc, "hiRes");
    return { imageSrc, hiResImageSrc };
  }
  /**
   * Create viewer DOM structure
   */
  _createStructure(container, imageViewHtml) {
    createElement({
      tagName: "div",
      className: "iv-wrap",
      html: imageViewHtml,
      trustedHTML: true,
      parent: container
    });
    addClass(container, "iv-container");
    if (getStyle(container, "position") === "static") {
      setStyle(container, { position: "relative" });
    }
    const snapView = container.querySelector(".iv-snap-view");
    const snapImageWrap = container.querySelector(".iv-snap-image-wrap");
    const imageWrap = container.querySelector(".iv-image-wrap");
    const snapHandle = container.querySelector(".iv-snap-handle");
    const zoomHandle = container.querySelector(".iv-zoom-handle");
    const zoomIn = container.querySelector(".iv-button-zoom--in");
    const zoomOut = container.querySelector(".iv-button-zoom--out");
    if (!snapView || !snapImageWrap || !imageWrap || !snapHandle || !zoomHandle) {
      throw new Error("Required viewer elements not found in container");
    }
    this.elements = __spreadProps(__spreadValues({}, this.elements), {
      snapView,
      snapImageWrap,
      imageWrap,
      snapHandle,
      zoomHandle,
      zoomIn: zoomIn || void 0,
      zoomOut: zoomOut || void 0
    });
  }
}
const _InteractionManager = class _InteractionManager {
  constructor(elements, eventManager, options, callbacks) {
    this.elements = elements;
    this.eventManager = eventManager;
    this.options = options;
    this.callbacks = callbacks;
  }
  /**
   * Set up all interaction handlers
   */
  setupInteractions() {
    this.setupPinchZoom();
    this.setupWheelZoom();
    this.setupDoubleTap();
  }
  /**
   * Enables pinch-to-zoom gesture on touch devices
   * Calculates zoom based on distance between two touch points
   */
  setupPinchZoom() {
    const { imageWrap, container } = this.elements;
    const onPinchStart = (eStart) => {
      const { loaded, zoomValue: startZoomValue } = this.callbacks.getState();
      if (!loaded) return;
      const touch0 = eStart.touches[0];
      const touch1 = eStart.touches[1];
      if (!(touch0 && touch1)) {
        return;
      }
      this.callbacks.setZooming(true);
      const contOffset = container.getBoundingClientRect();
      const startDist = getTouchPointsDistance(eStart.touches);
      const scroll = this.callbacks.getScrollPosition();
      const center = this.calculatePinchCenter(touch0, touch1, contOffset, scroll);
      const moveListener = (eMove) => {
        const newDist = getTouchPointsDistance(eMove.touches);
        const zoomValue = this.calculatePinchZoom(startZoomValue, startDist, newDist);
        this.callbacks.zoom(zoomValue, center);
      };
      const endListener = (eEnd) => {
        var _a;
        this.eventManager.off("pinchMove");
        this.eventManager.off("pinchEnd");
        this.callbacks.setZooming(false);
        if (eEnd.touches.length === 1) {
          (_a = this.callbacks.getSlider("imageSlider")) == null ? void 0 : _a.startHandler(eEnd);
        }
      };
      this.eventManager.off("pinchMove");
      this.eventManager.off("pinchEnd");
      this.eventManager.on("pinchMove", document, "touchmove", moveListener);
      this.eventManager.on("pinchEnd", document, "touchend", endListener);
    };
    this.eventManager.on("pinchStart", imageWrap, "touchstart", onPinchStart);
  }
  /**
   * Enables mouse wheel zoom functionality
   * Uses ZOOM_CONSTANT (15) for zoom speed and MOUSE_WHEEL_COUNT (5) to prevent excessive zooming
   */
  setupWheelZoom() {
    const { container, imageWrap } = this.elements;
    let changedDelta = 0;
    const onMouseWheel = (e) => {
      const { loaded, zoomValue } = this.callbacks.getState();
      if (!this.options.zoomOnMouseWheel || !loaded) return;
      this.callbacks.clearFrames();
      const delta = this.normalizeWheelDelta(e);
      const newZoomValue = zoomValue * (100 + delta * ZOOM_CONSTANT) / 100;
      if (!(newZoomValue >= 100 && newZoomValue <= this.options.maxZoom)) {
        changedDelta += Math.abs(delta);
      } else {
        changedDelta = 0;
      }
      e.preventDefault();
      if (changedDelta > MOUSE_WHEEL_COUNT) return;
      const contOffset = container.getBoundingClientRect();
      const position = this.getMousePositionRelativeToContainer(e, contOffset);
      this.callbacks.zoom(newZoomValue, position);
      this.callbacks.showSnapView();
    };
    this.eventManager.on("wheelZoom", imageWrap, "wheel", onMouseWheel);
  }
  /**
   * Enables double-click/tap to zoom functionality
   * Detects double clicks within 500ms and 50px distance threshold
   * Toggles between base zoom and 200% zoom
   */
  setupDoubleTap() {
    const { imageWrap } = this.elements;
    let touchTime = 0;
    let point;
    const onDoubleTap = (e) => {
      const { zoomValue } = this.callbacks.getState();
      if (touchTime === 0) {
        touchTime = Date.now();
        point = {
          x: e.pageX,
          y: e.pageY
        };
      } else if (Date.now() - touchTime < _InteractionManager.DOUBLE_TAP_INTERVAL_MS && Math.abs(e.pageX - point.x) < _InteractionManager.DOUBLE_TAP_DISTANCE_PX && Math.abs(e.pageY - point.y) < _InteractionManager.DOUBLE_TAP_DISTANCE_PX) {
        if (zoomValue === this.options.zoomValue) {
          this.callbacks.zoom(_InteractionManager.DOUBLE_TAP_ZOOM_LEVEL);
        } else {
          this.callbacks.resetZoom();
        }
        touchTime = 0;
      } else {
        touchTime = 0;
      }
    };
    this.eventManager.on("doubleTapClick", imageWrap, "click", onDoubleTap);
  }
  /**
   * Cleanup all interaction handlers
   * Note: EventManager.destroy() will handle event cleanup
   */
  destroy() {
  }
  // Private helper methods
  /**
   * Calculate the center point between two touch points
   */
  calculatePinchCenter(touch0, touch1, containerOffset, scroll) {
    return {
      x: (touch1.pageX + touch0.pageX) / 2 - (containerOffset.left + scroll.x),
      y: (touch1.pageY + touch0.pageY) / 2 - (containerOffset.top + scroll.y)
    };
  }
  /**
   * Calculate zoom value based on pinch distance change
   */
  calculatePinchZoom(startZoomValue, startDist, currentDist) {
    return startZoomValue + (currentDist - startDist) / 2;
  }
  /**
   * Normalize wheel delta across browsers
   */
  normalizeWheelDelta(e) {
    const legacyEvent = e;
    return Math.max(-1, Math.min(1, legacyEvent.wheelDelta || -e.detail || -e.deltaY));
  }
  /**
   * Calculate mouse position relative to container
   */
  getMousePositionRelativeToContainer(e, containerOffset) {
    const scroll = this.callbacks.getScrollPosition();
    return {
      x: e.pageX - (containerOffset.left + scroll.x),
      y: e.pageY - (containerOffset.top + scroll.y)
    };
  }
};
// REFACTOR: Extract magic constants for better maintainability
__publicField(_InteractionManager, "DOUBLE_TAP_INTERVAL_MS", 500);
__publicField(_InteractionManager, "DOUBLE_TAP_DISTANCE_PX", 50);
__publicField(_InteractionManager, "DOUBLE_TAP_ZOOM_LEVEL", 200);
let InteractionManager = _InteractionManager;
class Slider {
  /**
   * Creates a slider instance for handling mouse and touch drag interactions
   * Supports both mouse events and touch events with unified API
   * REFACTOR: Made callbacks required for better type safety (Issue E2.7)
   * @param container - DOM element to attach slider events to
   * @param callbacks - Configuration object with event callbacks
   * @param callbacks.onStart - REQUIRED callback when drag starts with initial position
   * @param callbacks.onMove - REQUIRED callback during drag with delta and current position
   * @param callbacks.onEnd - REQUIRED callback when drag ends
   * @param callbacks.isSliderEnabled - Optional function that returns whether slider is currently enabled
   */
  constructor(container, {
    onStart,
    onMove,
    onEnd,
    isSliderEnabled
  }) {
    __publicField(this, "_onStart");
    __publicField(this, "_onMove");
    __publicField(this, "_onEnd");
    __publicField(this, "isSliderEnabled");
    __publicField(this, "container");
    __publicField(this, "touchMoveEvent");
    __publicField(this, "touchEndEvent");
    // REFACTOR: Explicit initialization instead of definite assignment assertion (Issue E2.8)
    __publicField(this, "sx", 0);
    __publicField(this, "sy", 0);
    /**
     * Handles drag start event for both mouse and touch
     * Detects event type and extracts starting coordinates
     * Sets up move and end event listeners
     */
    __publicField(this, "startHandler", (eStart) => {
      if (!this.isSliderEnabled()) return;
      this.removeListeners();
      if (eStart.cancelable) {
        eStart.preventDefault();
      }
      const { moveHandler, endHandler, _onStart: onStart } = this;
      const isTouch = this.isTouchEvent(eStart);
      let sx;
      let sy;
      if (isTouch) {
        const touchEvent = eStart;
        this.touchMoveEvent = "touchmove";
        this.touchEndEvent = "touchend";
        sx = touchEvent.touches[0].clientX;
        sy = touchEvent.touches[0].clientY;
      } else {
        const mouseEvent = eStart;
        this.touchMoveEvent = "mousemove";
        this.touchEndEvent = "mouseup";
        sx = mouseEvent.clientX;
        sy = mouseEvent.clientY;
      }
      this.sx = sx;
      this.sy = sy;
      onStart(eStart, {
        x: this.sx,
        y: this.sy
      });
      document.addEventListener(this.touchMoveEvent, moveHandler);
      document.addEventListener(this.touchEndEvent, endHandler);
      document.addEventListener("contextmenu", endHandler);
    });
    /**
     * Handles drag move event for both mouse and touch
     * Calculates delta from start position and current position
     * Passes dx, dy (deltas) and mx, my (current position) to onMove callback
     */
    __publicField(this, "moveHandler", (eMove) => {
      if (!this.isSliderEnabled()) return;
      if (eMove.cancelable) {
        eMove.preventDefault();
      }
      const { sx, sy, _onMove: onMove } = this;
      const isTouch = this.isTouchEvent(eMove);
      let mx;
      let my;
      if (isTouch) {
        const touchEvent = eMove;
        mx = touchEvent.touches[0].clientX;
        my = touchEvent.touches[0].clientY;
      } else {
        const mouseEvent = eMove;
        mx = mouseEvent.clientX;
        my = mouseEvent.clientY;
      }
      onMove(eMove, {
        dx: mx - sx,
        dy: my - sy,
        mx,
        my
      });
    });
    __publicField(this, "endHandler", () => {
      if (!this.isSliderEnabled()) return;
      this.removeListeners();
      this._onEnd();
    });
    if (typeof onStart !== "function") {
      throw new Error("Slider: onStart callback is required and must be a function");
    }
    if (typeof onMove !== "function") {
      throw new Error("Slider: onMove callback is required and must be a function");
    }
    if (typeof onEnd !== "function") {
      throw new Error("Slider: onEnd callback is required and must be a function");
    }
    this.container = container;
    this.isSliderEnabled = isSliderEnabled || (() => true);
    this._onStart = onStart;
    this._onMove = onMove;
    this._onEnd = onEnd;
  }
  /**
   * Public method to trigger start handler
   * Used by ImageViewer for manual slider control
   * REFACTOR: Made parameters required for better type safety (Issue C3.7)
   * @param event - Event that triggered the start
   * @param position - Initial position { x, y }
   */
  onStart(event, position) {
    return this._onStart(event, position);
  }
  /**
   * Public method to trigger move handler
   * Used by ImageViewer for manual slider control
   * REFACTOR: Made parameters required for better type safety (Issue C3.7)
   * @param event - Event that triggered the move
   * @param position - Position with deltas and current coordinates { dx, dy, mx, my }
   */
  onMove(event, position) {
    return this._onMove(event, position);
  }
  /**
   * Programmatic position update without requiring an event
   * REFACTOR: Avoid dummy event creation (Issue A1.12)
   * Useful for synchronizing slider positions or updating from external sources
   *
   * @param position - Position with deltas and current coordinates { dx, dy, mx, my }
   *
   * @example
   * ```typescript
   * // Sync slider position without creating dummy events
   * slider.updatePosition({ dx: 10, dy: 5, mx: 100, my: 50 });
   * ```
   */
  updatePosition(position) {
    const syntheticEvent = new Event("programmatic-update");
    this._onMove(syntheticEvent, position);
  }
  /**
   * REFACTOR: Extract event type detection logic (Issue A1.8)
   * Determines if an event is a touch event based on event type
   * @param event - Event to check
   * @returns True if event is a touch event
   */
  isTouchEvent(event) {
    return event.type === "touchstart" || event.type === "touchmove" || event.type === "touchend";
  }
  /**
   * Removes active event listeners
   * Handles edge case where mouse/touch leaves document during drag
   */
  removeListeners() {
    if (this.touchMoveEvent) document.removeEventListener(this.touchMoveEvent, this.moveHandler);
    if (this.touchEndEvent) document.removeEventListener(this.touchEndEvent, this.endHandler);
    document.removeEventListener("contextmenu", this.endHandler);
  }
  /**
   * Initializes the slider by attaching start event listeners
   * Listens for both touchstart and mousedown events
   */
  init() {
    ["touchstart", "mousedown"].forEach((evt) => {
      this.container.addEventListener(evt, this.startHandler);
    });
  }
  /**
   * Destroys the slider by removing all event listeners
   * Cleans up both start and active drag listeners
   */
  destroy() {
    ["touchstart", "mousedown"].forEach((evt) => {
      this.container.removeEventListener(evt, this.startHandler);
    });
    this.removeListeners();
  }
}
const _ImageViewer = class _ImageViewer {
  // REFACTOR: Extract interaction logic (Phase 7)
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
  constructor(element, options = {}) {
    __publicField(this, "_elements");
    // REFACTOR: Changed from protected to private (Issue E2.1)
    __publicField(this, "_options");
    __publicField(this, "_listeners");
    __publicField(this, "_state");
    __publicField(this, "_sliders");
    __publicField(this, "_frames");
    __publicField(this, "_images");
    __publicField(this, "imageLoader");
    // REFACTOR: Extract image loading logic (Issue C3.1)
    __publicField(this, "eventManager");
    // REFACTOR: Centralized event management (Issue A1.5, Phase 6.1)
    __publicField(this, "dom");
    // REFACTOR: Extract DOM management logic (Issue C3.1, Phase 8)
    __publicField(this, "interactionManager");
    this._options = __spreadValues(__spreadValues({}, _ImageViewer.defaults), options);
    this.dom = new ImageViewerDOM();
    const { domElement, imageSrc, hiResImageSrc, elements } = this.dom.initialize(
      element,
      ViewerHTMLTemplates.createViewerHTML(this._options.hasZoomButtons),
      (url, context) => this._validateImageUrl(url, context)
    );
    this._elements = elements;
    this._listeners = this._options.listeners !== void 0 && this._options.listeners !== null ? this._options.listeners : {};
    this._frames = {};
    this._sliders = {};
    this._state = {
      zoomValue: this._options.zoomValue,
      loaded: false,
      imageDim: { w: 0, h: 0 },
      containerDim: { w: 0, h: 0 },
      snapImageDim: { w: 0, h: 0 },
      zooming: false,
      snapViewVisible: false,
      zoomSliderLength: 0,
      snapHandleDim: { w: 0, h: 0 }
    };
    this._images = {
      imageSrc,
      hiResImageSrc
    };
    this.imageLoader = new ImageLoader(
      this._elements,
      (loadId) => this._handleImageLoadSuccess(loadId),
      (loadId, error) => this._handleImageLoadError(loadId, error)
    );
    this.eventManager = new EventManager();
    this.interactionManager = new InteractionManager(
      {
        imageWrap: this._elements.imageWrap,
        container: this._elements.container
      },
      this.eventManager,
      {
        zoomOnMouseWheel: this._options.zoomOnMouseWheel,
        zoomValue: this._options.zoomValue,
        maxZoom: this._options.maxZoom
      },
      {
        getState: () => {
          var _a, _b, _c;
          return {
            loaded: (_a = this._state.loaded) != null ? _a : false,
            zoomValue: (_b = this._state.zoomValue) != null ? _b : 100,
            zooming: (_c = this._state.zooming) != null ? _c : false
          };
        },
        setZooming: (zooming) => this._setZooming(zooming),
        clearFrames: () => this._clearFrames(),
        zoom: (value, point) => this.zoom(value, point),
        resetZoom: () => this.resetZoom(),
        showSnapView: () => this.showSnapView(),
        getSlider: (key) => this._getSlider(key),
        getScrollPosition: () => this._getScrollPosition()
      }
    );
    this._init();
    if (imageSrc) {
      this._loadImages();
    }
    domElement._imageViewer = this;
  }
  // REFACTOR: HTML generation moved to ViewerHTMLTemplates (Issue C3.1)
  get imageViewHtml() {
    return ViewerHTMLTemplates.createViewerHTML(this._options.hasZoomButtons);
  }
  /**
   * Returns callback data object passed to event listeners
   * Includes container, snapView, zoom values, and instance reference
   */
  get _callbackData() {
    if (!this._elements.container || !this._elements.snapView) {
      throw new Error("ImageViewer elements not initialized. Cannot get callback data.");
    }
    return {
      container: this._elements.container,
      snapView: this._elements.snapView,
      zoomValue: this._state.zoomValue,
      reachedMin: Math.round(this._state.zoomValue) === this._options.zoomValue,
      reachedMax: Math.round(this._state.zoomValue) === this._options.maxZoom,
      instance: this
    };
  }
  // REFACTOR: State setter methods for better encapsulation (Issue E2.4)
  // These methods centralize state modifications for easier tracking and validation
  _setZoomValue(value) {
    this._state.zoomValue = value;
  }
  _setLoaded(loaded) {
    this._state.loaded = loaded;
  }
  _setZooming(zooming) {
    this._state.zooming = zooming;
  }
  _setSnapViewVisible(visible) {
    this._state.snapViewVisible = visible;
  }
  _setContainerDim(dim) {
    this._state.containerDim = dim;
  }
  _setImageDim(dim) {
    this._state.imageDim = dim;
  }
  _setSnapImageDim(dim) {
    this._state.snapImageDim = dim;
  }
  _setSnapHandleDim(dim) {
    this._state.snapHandleDim = dim;
  }
  _setZoomSliderLength(length) {
    this._state.zoomSliderLength = length;
  }
  // REFACTOR: Element and event accessor methods for better encapsulation (Issues E2.1, E2.2)
  // These methods provide controlled access to internal elements and events for subclasses
  _getElement(key) {
    return this._elements[key];
  }
  _setElement(key, element) {
    this._elements[key] = element;
  }
  // REFACTOR: Slider accessor methods for better encapsulation (Issue E2.5)
  // These methods provide controlled access to slider instances
  _getSlider(key) {
    return this._sliders[key];
  }
  _setSlider(key, slider) {
    this._sliders[key] = slider;
  }
  _destroySlider(key) {
    const slider = this._sliders[key];
    if (slider) {
      slider.destroy();
      this._sliders[key] = void 0;
    }
  }
  // REFACTOR: Extract duplicated URL validation logic (Issue A1.4)
  _validateImageUrl(url, urlType = "main") {
    if (!url) return null;
    if (!isValidImageUrl(url)) {
      const typeLabel = urlType === "hiRes" ? "high-res " : "";
      throw new Error(`Invalid or unsafe ${typeLabel}image URL: ${url}`);
    }
    return url;
  }
  // REFACTOR: Images object structure validation (Issue E2.10)
  _setImageSources(sources) {
    var _a, _b;
    const validatedImageSrc = this._validateImageUrl((_a = sources.imageSrc) != null ? _a : null, "main");
    const validatedHiResImageSrc = this._validateImageUrl((_b = sources.hiResImageSrc) != null ? _b : null, "hiRes");
    this._images = {
      imageSrc: validatedImageSrc != null ? validatedImageSrc : void 0,
      hiResImageSrc: validatedHiResImageSrc != null ? validatedHiResImageSrc : void 0
    };
  }
  // REFACTOR: Extract duplicated scroll position logic (Issue A1.6)
  _getScrollPosition() {
    return {
      x: window.pageXOffset || window.scrollX || 0,
      y: window.pageYOffset || window.scrollY || 0
    };
  }
  // REFACTOR: Extract duplicated zoom step retrieval (Issue A1.7)
  _getZoomStep() {
    return this._options.zoomStep !== void 0 && this._options.zoomStep !== null ? this._options.zoomStep : 50;
  }
  // REFACTOR: Extract momentum calculation logic (Issue A1.3)
  // These methods centralize momentum tracking and animation for better testability
  // REFACTOR: Momentum calculation methods moved to MomentumCalculator (Issue C3.1/A1.3)
  _calculateMomentumDelta(positions) {
    return MomentumCalculator.calculateDelta(positions);
  }
  _shouldApplyMomentum(xDiff, yDiff) {
    return MomentumCalculator.shouldApplyMomentum(xDiff, yDiff, _ImageViewer.MOMENTUM_THRESHOLD_PX);
  }
  // REFACTOR: Momentum animation using MomentumCalculator (Issue C3.1/A1.3)
  _applyMomentumAnimation(xDiff, yDiff, currentPos, imageCurrentDim, snapImageDim, snapSlider) {
    let step = 1;
    let cumulativeX = 0;
    let cumulativeY = 0;
    const config = {
      thresholdPx: _ImageViewer.MOMENTUM_THRESHOLD_PX,
      velocityFactor: _ImageViewer.MOMENTUM_VELOCITY_FACTOR,
      animationFrames: _ImageViewer.MOMENTUM_ANIMATION_FRAMES
    };
    const momentum = () => {
      const frame = MomentumCalculator.calculateMomentumFrame(
        step,
        { dx: cumulativeX, dy: cumulativeY },
        { xDiff, yDiff },
        config
      );
      if (frame.shouldContinue) {
        this._frames.sliderMomentumFrame = requestAnimationFrame(momentum);
      }
      cumulativeX = frame.positionX;
      cumulativeY = frame.positionY;
      const finalPosX = currentPos.dx + cumulativeX;
      const finalPosY = currentPos.dy + cumulativeY;
      const snapCoords = MomentumCalculator.convertToSnapCoordinates(
        { x: finalPosX, y: finalPosY },
        imageCurrentDim,
        snapImageDim
      );
      snapSlider.updatePosition({
        dx: snapCoords.dx,
        dy: snapCoords.dy,
        mx: 0,
        my: 0
      });
      step++;
    };
    momentum();
  }
  _init() {
    this._initImageSlider();
    this._initSnapSlider();
    this._initZoomSlider();
    this.interactionManager.setupInteractions();
    this._initEvents();
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
    let positions;
    let currentPos;
    const sliderCoordinator = new SliderCoordinator(this._getSlider("snapSlider"), {
      getImageDim: () => this._getImageCurrentDim(),
      getSnapImageDim: () => this._state.snapImageDim
    });
    const imageSlider = new Slider(imageWrap, {
      isSliderEnabled: () => {
        const { loaded, zooming, zoomValue } = this._state;
        return loaded && !zooming && zoomValue > 100;
      },
      onStart: (event, position) => {
        this._clearFrames();
        sliderCoordinator.notifyPanStart(event);
        positions = [position, position];
        currentPos = void 0;
        let lastSampleTime = performance.now();
        const sampleInterval = _ImageViewer.MOMENTUM_SAMPLE_INTERVAL_MS;
        const trackPosition = (currentTime) => {
          if (currentTime - lastSampleTime >= sampleInterval) {
            if (currentPos) {
              positions.shift();
              positions.push({
                x: currentPos.mx,
                y: currentPos.my
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
        sliderCoordinator.syncSnapSliderPosition(position);
      },
      onEnd: () => {
        const { snapImageDim } = this._state;
        const imageCurrentDim = this._getImageCurrentDim();
        this._clearFrames();
        const { xDiff, yDiff } = this._calculateMomentumDelta(positions);
        if (this._shouldApplyMomentum(xDiff, yDiff)) {
          const snapSlider = sliderCoordinator.getSnapSlider();
          this._applyMomentumAnimation(
            xDiff,
            yDiff,
            currentPos,
            imageCurrentDim,
            snapImageDim,
            snapSlider
          );
        }
      }
    });
    imageSlider.init();
    this._setSlider("imageSlider", imageSlider);
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
  _calculateSnapHandlePosition(startLeft, startTop, delta, snapHandleDim, snapImageDim) {
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
  _convertSnapToImagePosition(snapPosition, imageCurrentDim, snapImageDim) {
    const left = snapImageDim.w !== 0 ? -snapPosition.left * imageCurrentDim.w / snapImageDim.w : 0;
    const top = snapImageDim.h !== 0 ? -snapPosition.top * imageCurrentDim.h / snapImageDim.h : 0;
    return { left, top };
  }
  _initSnapSlider() {
    const { snapHandle } = this._elements;
    let startHandleTop;
    let startHandleLeft;
    const snapSlider = new Slider(snapHandle, {
      isSliderEnabled: () => {
        return this._state.loaded;
      },
      onStart: () => {
        const { slideMomentumCheck, sliderMomentumFrame } = this._frames;
        startHandleTop = parseStyleFloat(snapHandle, "top");
        startHandleLeft = parseStyleFloat(snapHandle, "left");
        if (slideMomentumCheck) clearInterval(slideMomentumCheck);
        if (typeof sliderMomentumFrame === "number") {
          cancelAnimationFrame(sliderMomentumFrame);
        }
      },
      onMove: (_, position) => {
        const { snapHandleDim, snapImageDim } = this._state;
        const { image } = this._elements;
        const imageCurrentDim = this._getImageCurrentDim();
        if (!snapHandleDim) return;
        const handlePos = this._calculateSnapHandlePosition(
          startHandleLeft,
          startHandleTop,
          position,
          snapHandleDim,
          snapImageDim
        );
        const imagePos = this._convertSnapToImagePosition(handlePos, imageCurrentDim, snapImageDim);
        setStyle(snapHandle, {
          left: `${handlePos.left}px`,
          top: `${handlePos.top}px`
        });
        setStyle(image, {
          left: `${imagePos.left}px`,
          top: `${imagePos.top}px`
        });
      },
      // REFACTOR: onEnd callback is now required (Issue E2.7)
      onEnd: () => {
      }
    });
    snapSlider.init();
    this._setSlider("snapSlider", snapSlider);
  }
  /**
   * Initializes the zoom slider control in the snap view
   * Maps slider position to zoom level between 100% and maxZoom
   */
  _initZoomSlider() {
    const { snapView, zoomHandle } = this._elements;
    const sliderElm = snapView.querySelector(".iv-zoom-slider");
    if (!sliderElm) {
      throw new Error("Zoom slider element not found");
    }
    let leftOffset, handleWidth;
    const zoomSlider = new Slider(sliderElm, {
      isSliderEnabled: () => {
        return this._state.loaded;
      },
      onStart: (eStart, position) => {
        const { zoomSlider: slider } = this._sliders;
        const scroll = this._getScrollPosition();
        leftOffset = sliderElm.getBoundingClientRect().left + scroll.x;
        handleWidth = parseInt(getStyle(zoomHandle, "width"), 10);
        slider.onMove(eStart, { dx: 0, dy: 0, mx: position.x, my: position.y });
      },
      onMove: (e) => {
        const { maxZoom } = this._options;
        const { zoomSliderLength } = this._state;
        let pageX;
        if (e instanceof MouseEvent) {
          pageX = e.pageX;
        } else if (e instanceof TouchEvent) {
          pageX = e.touches[0].pageX;
        } else {
          return;
        }
        if (!zoomSliderLength) return;
        const newLeft = clamp(pageX - leftOffset - handleWidth / 2, 0, zoomSliderLength);
        const zoomValue = 100 + (maxZoom - 100) * newLeft / zoomSliderLength;
        this.zoom(zoomValue);
      },
      // REFACTOR: onEnd callback is now required (Issue E2.7)
      onEnd: () => {
      }
    });
    zoomSlider.init();
    this._setSlider("zoomSlider", zoomSlider);
  }
  _initEvents() {
    this._snapViewEvents();
    if (this._options.refreshOnResize) {
      this.eventManager.on("windowResize", window, "resize", () => this.refresh());
    }
  }
  _snapViewEvents() {
    const { imageWrap, snapView } = this._elements;
    this.eventManager.on("snapViewOnMouseMove", imageWrap, ["touchmove", "mousemove"], () => {
      this.showSnapView();
    });
    this.eventManager.on("mouseEnterSnapView", snapView, ["mouseenter", "touchstart"], () => {
      this._setSnapViewVisible(false);
      this.showSnapView(true);
    });
    this.eventManager.on("mouseLeaveSnapView", snapView, ["mouseleave", "touchend"], () => {
      this._setSnapViewVisible(false);
      this.showSnapView();
    });
    if (!this._options.hasZoomButtons) {
      return;
    }
    const { zoomOut, zoomIn } = this._elements;
    this.eventManager.on("zoomInClick", zoomIn, ["click"], () => {
      const zoomStep = this._getZoomStep();
      this.zoom(this._state.zoomValue + zoomStep);
    });
    this.eventManager.on("zoomOutClick", zoomOut, ["click"], () => {
      const zoomStep = this._getZoomStep();
      this.zoom(this._state.zoomValue - zoomStep);
    });
  }
  _getImageCurrentDim() {
    const { zoomValue, imageDim } = this._state;
    return {
      w: imageDim.w * (zoomValue / 100),
      h: imageDim.h * (zoomValue / 100)
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
  _handleImageLoadSuccess(_loadId) {
    const { hiResImageSrc } = this._images;
    if (hiResImageSrc) {
      this.imageLoader.loadHighRes(hiResImageSrc);
    }
    this._setLoaded(true);
    this._calculateDimensions();
    if (this._listeners.onImageLoaded) {
      this._listeners.onImageLoaded(this._callbackData);
    }
    this.resetZoom();
  }
  /**
   * REFACTOR: Handle image load error - called by ImageLoader (Issue C3.1)
   * Race condition checking is handled by ImageLoader, so this is only called for valid loads
   * @param _loadId - The load operation ID (unused, kept for interface compatibility)
   * @param error - The error event
   */
  _handleImageLoadError(_loadId, error) {
    if (this._listeners.onImageError) {
      this._listeners.onImageError(error);
    }
  }
  /**
   * REFACTOR: Simplified image loading using ImageLoader (Issue C3.1)
   * ImageLoader handles: URL validation, element creation, event setup, race conditions
   * ImageViewer handles: state updates, snap view hiding
   */
  _loadImages() {
    const { imageSrc, hiResImageSrc } = this._images;
    if (!imageSrc) {
      throw new Error("No image source provided");
    }
    this._setLoaded(false);
    this.hideSnapView();
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
    const imageWidth = parseInt(getStyle(image, "width"), 10);
    const imageHeight = parseInt(getStyle(image, "height"), 10);
    const contWidth = parseInt(getStyle(container, "width"), 10);
    const contHeight = parseInt(getStyle(container, "height"), 10);
    this._setContainerDim({ w: contWidth, h: contHeight });
    const imgOriginWidth = image.naturalWidth || imageWidth;
    const imgOriginHeight = image.naturalHeight || imageHeight;
    const imageDim = DimensionCalculator.calculateFittedImageDimensions(
      { w: contWidth, h: contHeight },
      imgOriginWidth,
      imgOriginHeight
    );
    this._setImageDim(imageDim);
    setStyle(image, {
      width: `${imageDim.w}px`,
      height: `${imageDim.h}px`,
      left: `${(contWidth - imageDim.w) / 2}px`,
      top: `${(contHeight - imageDim.h) / 2}px`,
      maxWidth: "none",
      maxHeight: "none"
    });
    const snapViewDim = {
      w: snapView.clientWidth,
      h: snapView.clientHeight
    };
    const snapDim = DimensionCalculator.calculateSnapImageDimensions(imageDim, snapViewDim);
    this._setSnapImageDim(snapDim);
    setStyle(snapImage, {
      width: `${snapDim.w}px`,
      height: `${snapDim.h}px`
    });
    const zoomSliderElem = snapView.querySelector(".iv-zoom-slider");
    if (!zoomSliderElem) {
      throw new Error("Zoom slider element not found");
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
  zoom(perc, point) {
    const { _options, _elements, _state } = this;
    const { zoomValue: curPerc, imageDim, containerDim, zoomSliderLength } = _state;
    const { image, zoomHandle } = _elements;
    const { maxZoom } = _options;
    perc = Math.round(Math.max(100, perc));
    perc = Math.min(maxZoom, perc);
    const zoomPoint = point !== void 0 && point !== null ? point : {
      x: containerDim.w / 2,
      y: containerDim.h / 2
    };
    const curLeft = parseStyleFloat(image, "left");
    const curTop = parseStyleFloat(image, "top");
    this._clearFrames();
    const bounds = {
      baseLeft: (containerDim.w - imageDim.w) / 2,
      baseTop: (containerDim.h - imageDim.h) / 2,
      baseRight: containerDim.w - (containerDim.w - imageDim.w) / 2,
      baseBottom: containerDim.h - (containerDim.h - imageDim.h) / 2
    };
    const animation = new ZoomAnimation({
      currentZoom: curPerc,
      targetZoom: perc,
      currentLeft: curLeft,
      currentTop: curTop,
      zoomPoint,
      imageDim,
      bounds,
      totalFrames: _ImageViewer.ZOOM_ANIMATION_FRAMES
    });
    let step = 0;
    const animateFrame = () => {
      step++;
      if (step < _ImageViewer.ZOOM_ANIMATION_FRAMES) {
        this._frames.zoomFrame = requestAnimationFrame(animateFrame);
      }
      const frame = animation.getFrame(step);
      setStyle(image, {
        width: `${frame.width}px`,
        height: `${frame.height}px`,
        left: `${frame.left}px`,
        top: `${frame.top}px`
      });
      this._setZoomValue(frame.zoom);
      this._resizeSnapHandle(frame.width, frame.height, frame.left, frame.top);
      setStyle(zoomHandle, {
        left: `${(frame.zoom - 100) * (zoomSliderLength || 0) / (maxZoom - 100)}px`
      });
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
  _clearFrames() {
    const { slideMomentumCheck, sliderMomentumFrame, zoomFrame, snapViewTimeout } = this._frames;
    if (typeof slideMomentumCheck === "number") {
      cancelAnimationFrame(slideMomentumCheck);
    }
    if (typeof sliderMomentumFrame === "number") {
      cancelAnimationFrame(sliderMomentumFrame);
    }
    if (typeof zoomFrame === "number") {
      cancelAnimationFrame(zoomFrame);
    }
    if (typeof snapViewTimeout === "number") {
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
  _resizeSnapHandle(imgWidth, imgHeight, imgLeft, imgTop) {
    const { _elements, _state } = this;
    const { snapHandle, image } = _elements;
    const { imageDim, containerDim, zoomValue, snapImageDim } = _state;
    const imageWidth = imgWidth || imageDim.w * zoomValue / 100;
    const imageHeight = imgHeight || imageDim.h * zoomValue / 100;
    const imageLeft = imgLeft || parseStyleFloat(image, "left");
    const imageTop = imgTop || parseStyleFloat(image, "top");
    const left = imageWidth !== 0 ? -imageLeft * snapImageDim.w / imageWidth : 0;
    const top = imageHeight !== 0 ? -imageTop * snapImageDim.h / imageHeight : 0;
    const handleWidth = imageWidth !== 0 ? containerDim.w * snapImageDim.w / imageWidth : 0;
    const handleHeight = imageHeight !== 0 ? containerDim.h * snapImageDim.h / imageHeight : 0;
    setStyle(snapHandle, {
      top: `${top}px`,
      left: `${left}px`,
      width: `${handleWidth}px`,
      height: `${handleHeight}px`
    });
    this._setSnapHandleDim({
      w: handleWidth,
      h: handleHeight
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
  showSnapView(noTimeout) {
    const { snapViewVisible, zoomValue, loaded } = this._state;
    const { snapView } = this._elements;
    if (!this._options.snapView) return;
    if (snapViewVisible || zoomValue <= 100 || !loaded) return;
    clearTimeout(this._frames.snapViewTimeout);
    this._setSnapViewVisible(true);
    setStyle(snapView, { opacity: "1", "pointer-events": "inherit" });
    if (!noTimeout) {
      this._frames.snapViewTimeout = setTimeout(
        () => this.hideSnapView(),
        _ImageViewer.SNAP_VIEW_TIMEOUT_MS
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
  hideSnapView() {
    const { snapView } = this._elements;
    setStyle(snapView, { opacity: "0", "pointer-events": "none" });
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
  refresh() {
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
  load(imageSrc, hiResImageSrc) {
    try {
      this._setImageSources({ imageSrc, hiResImageSrc });
      this._loadImages();
    } catch (error) {
      console.error("ImageViewer: Failed to load image", error);
      if (this._listeners.onImageError) {
        const errorEvent = new ErrorEvent("error", {
          error: error instanceof Error ? error : new Error(String(error)),
          message: error instanceof Error ? error.message : String(error)
        });
        this._listeners.onImageError(errorEvent);
      }
      throw error;
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
    try {
      const { container, domElement } = this._elements;
      this._destroySlider("imageSlider");
      this._destroySlider("snapSlider");
      this._destroySlider("zoomSlider");
      this.imageLoader.destroy();
      this.interactionManager.destroy();
      this.eventManager.destroy();
      this._clearFrames();
      this.dom.destroy(domElement, container);
      domElement._imageViewer = null;
      if (this._listeners.onDestroy) {
        this._listeners.onDestroy();
      }
    } catch (error) {
      console.error("ImageViewer: Error during destroy", error);
    }
  }
};
__publicField(_ImageViewer, "defaults");
__publicField(_ImageViewer, "FullScreenViewer");
// REFACTOR: Extract magic constants for better maintainability
__publicField(_ImageViewer, "MOMENTUM_SAMPLE_INTERVAL_MS", 50);
__publicField(_ImageViewer, "MOMENTUM_ANIMATION_FRAMES", 60);
__publicField(_ImageViewer, "MOMENTUM_THRESHOLD_PX", 30);
__publicField(_ImageViewer, "MOMENTUM_VELOCITY_FACTOR", 1 / 3);
__publicField(_ImageViewer, "ZOOM_ANIMATION_FRAMES", 16);
__publicField(_ImageViewer, "SNAP_VIEW_TIMEOUT_MS", 1500);
let ImageViewer = _ImageViewer;
ImageViewer.defaults = {
  zoomValue: 100,
  snapView: true,
  maxZoom: 500,
  refreshOnResize: true,
  zoomOnMouseWheel: true,
  hasZoomButtons: false,
  zoomStep: 50,
  listeners: {
    onInit: void 0,
    onDestroy: void 0,
    onImageLoaded: void 0,
    onZoomChange: void 0,
    onImageError: void 0
  }
};
const FULLSCREEN_SELECTORS = {
  FULLSCREEN: "iv-fullscreen",
  CONTAINER: "iv-fullscreen-container",
  CLOSE_BTN: "iv-fullscreen-close"
};
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
      tagName: "div",
      className: FULLSCREEN_SELECTORS.FULLSCREEN,
      html: fullScreenHtml,
      trustedHTML: true,
      parent: document.body
    });
    const container = fullScreenElem.querySelector(
      `.${FULLSCREEN_SELECTORS.CONTAINER}`
    );
    if (!container) {
      throw new Error("Fullscreen container element not found");
    }
    super(container, __spreadProps(__spreadValues({}, options), { refreshOnResize: false }));
    /**
     * Hides the fullscreen viewer
     * Re-enables page scrolling and removes window resize handler
     * @example
     * ```typescript
     * viewer.hide();
     * ```
     */
    __publicField(this, "hide", () => {
      const fullScreen = this._getElement("fullScreen");
      if (fullScreen) {
        setStyle(fullScreen, { display: "none" });
      }
      const htmlElem = document.querySelector("html");
      if (htmlElem) {
        removeCss(htmlElem, "overflow");
      }
      this.eventManager.off("onWindowResize");
    });
    this._setElement("fullScreen", fullScreenElem);
    this._initFullScreenEvents();
  }
  _initFullScreenEvents() {
    const fullScreen = this._getElement("fullScreen");
    if (!fullScreen) {
      throw new Error("Fullscreen element not initialized");
    }
    const closeBtn = fullScreen.querySelector(`.${FULLSCREEN_SELECTORS.CLOSE_BTN}`);
    if (!closeBtn) {
      throw new Error("Fullscreen close button not found");
    }
    this.eventManager.on("onCloseBtnClick", closeBtn, "click", this.hide);
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
  show(imageSrc, hiResImageSrc) {
    const fullScreen = this._getElement("fullScreen");
    if (fullScreen) {
      setStyle(fullScreen, { display: "block" });
    }
    if (imageSrc) {
      this.load(imageSrc, hiResImageSrc);
    }
    this.eventManager.on("onWindowResize", window, "resize", () => this.refresh());
    const htmlElem = document.querySelector("html");
    if (htmlElem) {
      setStyle(htmlElem, { overflow: "hidden" });
    }
  }
  /**
   * Destroys the fullscreen viewer and removes it from the DOM
   * Calls parent ImageViewer destroy method first
   * @example
   * ```typescript
   * viewer.destroy();
   * ```
   */
  destroy() {
    const fullScreen = this._getElement("fullScreen");
    super.destroy();
    if (fullScreen) {
      remove(fullScreen);
    }
  }
}
export {
  FullScreenViewer,
  ImageViewer,
  ImageViewer as default
};
//# sourceMappingURL=iv-viewer-ts.mjs.map
