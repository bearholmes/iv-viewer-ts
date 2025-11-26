// Constants for zoom behavior
/** Zoom speed multiplier for mouse wheel interactions - higher values = faster zoom */
export const ZOOM_CONSTANT = 15;
/** Maximum accumulated mouse wheel deltas before allowing default scroll behavior */
export const MOUSE_WHEEL_COUNT = 5;

export const noop = (() => {}) as () => void;

/**
 * Easing function for smooth deceleration animations (ease-out quartic)
 * Creates a smooth slow-down effect, starting fast and ending slowly
 * Formula: -c * ((t/d - 1)^4 - 1) + b
 * @param currentTime - Current animation step/time
 * @param startValue - Initial value at start of animation
 * @param changedValue - Total change in value (target - start)
 * @param duration - Total duration in steps/time units
 * @returns Interpolated value at current time
 * @example
 * ```typescript
 * // Animate from 0 to 100 over 60 frames
 * for (let step = 0; step <= 60; step++) {
 *   const value = easeOutQuart(step, 0, 100, 60);
 *   console.log(value); // Smooth deceleration from 0 to 100
 * }
 * ```
 */
export function easeOutQuart(
  currentTime: number,
  startValue: number,
  changedValue: number,
  duration: number,
): number {
  currentTime /= duration;
  currentTime -= 1;
  return -changedValue * (currentTime * currentTime * currentTime * currentTime - 1) + startValue;
}

/**
 * Validates image URL to prevent XSS attacks via malicious protocols
 * Only allows http:, https:, and blob: protocols
 * @param url - URL to validate
 * @returns true if URL is safe to use, false otherwise
 * @security Prevents javascript:, data:text/html, and other XSS vectors
 * @example
 * ```typescript
 * isValidImageUrl('https://example.com/image.jpg') // true
 * isValidImageUrl('javascript:alert(1)') // false
 * isValidImageUrl('data:text/html,<script>alert(1)</script>') // false
 * ```
 */
export function isValidImageUrl(url: string | null | undefined): boolean {
  if (!url) return false;

  try {
    const parsed = new URL(url, window.location.href);
    const allowedProtocols = ['http:', 'https:', 'blob:'];
    return allowedProtocols.includes(parsed.protocol);
  } catch {
    return false;
  }
}

interface CreateElementOptions {
  tagName: string;
  id?: string;
  html?: string;
  /** Set to true only for static, trusted markup defined in source code */
  trustedHTML?: boolean;
  className?: string;
  src?: string;
  style?: Record<string, string>; // REFACTOR: Changed from string to object for consistency (Issue C3.8)
  child?: Node;
  parent: Node;
  insertBefore?: Node;
}

/**
 * Creates a DOM element with specified properties and inserts it into the DOM
 * @param options - Configuration object for element creation
 * @param options.tagName - HTML tag name (e.g., 'div', 'img')
 * @param options.id - Optional element ID
 * @param options.html - Optional inner HTML content (SECURITY: Only use with trusted static content!)
 * @param options.className - Optional CSS class names
 * @param options.src - Optional src attribute (for img elements, must be valid http/https/blob URL)
 * @param options.style - Optional inline CSS styles as object (e.g., { display: 'block', color: 'red' })
 * @param options.child - Optional child node to append
 * @param options.parent - Parent node to insert element into
 * @param options.insertBefore - Optional sibling node to insert before
 * @returns The created DOM element
 * @throws Error if image src URL has invalid protocol
 * @security innerHTML is used without sanitization - only pass trusted static HTML
 * @security Image URLs are validated to prevent XSS via javascript: or data: protocols
 */
export function createElement(options: CreateElementOptions) {
  const elem = document.createElement(options.tagName);
  if (options.id) elem.id = options.id;

  // SECURITY: Only allow innerHTML when explicitly marked as trusted static markup
  if (options.html) {
    if (!options.trustedHTML) {
      throw new Error('innerHTML requires trustedHTML=true to avoid XSS risks');
    }
    elem.innerHTML = options.html;
  }

  if (options.className) elem.className = options.className;

  // SECURITY FIX: Validate image URLs to prevent XSS
  if (options.src && elem instanceof HTMLImageElement) {
    if (!isValidImageUrl(options.src)) {
      throw new Error(`Invalid or unsafe image URL protocol: ${options.src}`);
    }
    elem.setAttribute('src', options.src);
  }

  // REFACTOR: Use setStyle() for consistent style handling (Issues C3.8, A1.10)
  if (options.style) setStyle(elem, options.style);
  if (options.child) elem.appendChild(options.child);

  // Insert before
  if (options.insertBefore) {
    options.parent.insertBefore(elem, options.insertBefore);

    // Standard append
  } else {
    options.parent.appendChild(elem);
  }

  return elem;
}

// method to add class
export function addClass(el: HTMLElement, className: string): void {
  const classNameAry = className.split(' ');

  if (classNameAry.length > 1) {
    classNameAry.forEach((classItem) => addClass(el, classItem));
  } else if (el.classList) {
    el.classList.add(className);
  } else {
    el.className += ` ${className}`;
  }
}

// method to remove class
export function removeClass(el: HTMLElement, className: string): void {
  const classNameAry = className.split(' ');

  if (classNameAry.length > 1) {
    classNameAry.forEach((classItem) => removeClass(el, classItem));
  } else if (el.classList) {
    el.classList.remove(className);
  } else {
    // P3-2 FIX: Simplified regex - className is always a single class at this point
    el.className = el.className.replace(new RegExp(`(^|\\s)${className}(\\s|$)`, 'g'), ' ').trim();
  }
}

// function to check if image is loaded
export function imageLoaded(img: HTMLImageElement): boolean {
  return img.complete && (typeof img.naturalWidth === 'undefined' || img.naturalWidth !== 0);
}

export function toArray(
  list: Node | NodeList | HTMLCollectionOf<HTMLElement>,
): (HTMLCollectionOf<Element> | Element)[] {
  if (list instanceof HTMLElement) {
    return [list];
  } else if (list instanceof NodeList || list instanceof HTMLCollection) {
    return Array.prototype.slice.call(list);
  } else {
    return [];
  }
}

type ObjectWithStringKeys = Record<string, string | number | boolean | object | null | undefined>;
export function assign(
  target: ObjectWithStringKeys,
  ...rest: ObjectWithStringKeys[]
): ObjectWithStringKeys {
  rest.forEach((obj) => {
    Object.keys(obj).forEach((key) => {
      target[key] = obj[key];
    });
  });
  return target;
}

/**
 * Gets the computed style value of a CSS property from an element
 * REFACTOR: Extracted from css() for single responsibility (Issue A1.10)
 * @param element - Element to get style from
 * @param property - CSS property name (kebab-case or camelCase)
 * @returns The computed style value, or empty string if not found
 * @example
 * ```typescript
 * const width = getStyle(element, 'width'); // "100px"
 * const bgColor = getStyle(element, 'background-color'); // "rgb(255, 0, 0)"
 * ```
 */
export function getStyle(element: Element, property: string): string {
  const styles = window.getComputedStyle(element);
  // Try kebab-case first (e.g., 'border-radius')
  const value = styles.getPropertyValue(property);
  if (value) return value;
  // Fallback: access as property directly (e.g., 'width', 'height')
  type StyleKey = keyof CSSStyleDeclaration;
  if (property in styles) {
    const propValue = styles[property as StyleKey];
    return typeof propValue === 'string' ? propValue : String(propValue);
  }
  return '';
}

/**
 * Parses a CSS style property value as a float number
 * REFACTOR: Consistent parseFloat helper with fallback (Issue A1.13)
 * @param element - Element to read style from
 * @param property - CSS property name
 * @param defaultValue - Value to return if parsing fails (default: 0)
 * @returns Parsed float value or default value
 * @example
 * ```typescript
 * const left = parseStyleFloat(element, 'left'); // 100 (from "100px")
 * const top = parseStyleFloat(element, 'top', 50); // 50 if not set
 * ```
 */
export function parseStyleFloat(element: HTMLElement, property: string, defaultValue = 0): number {
  const value = getStyle(element, property);
  const parsed = parseFloat(value);
  return isNaN(parsed) ? defaultValue : parsed;
}

/**
 * Sets CSS styles on one or more HTML elements
 * REFACTOR: Extracted from css() for single responsibility (Issue A1.10)
 * @param elements - Single element, NodeList, or HTMLCollection to style
 * @param properties - CSS properties as key-value pairs
 * @security Sanitizes CSS values to prevent CSS injection attacks
 * @example
 * ```typescript
 * setStyle(element, { width: '100px', display: 'block' });
 * setStyle(document.querySelectorAll('.item'), { color: 'red' });
 * ```
 */
export function setStyle(
  elements: Node | NodeList | HTMLCollectionOf<HTMLElement>,
  properties: Record<string, string>,
): void {
  const elmArray = toArray(elements);

  elmArray.forEach((element) => {
    if (element instanceof HTMLElement) {
      Object.keys(properties).forEach((key: string) => {
        const value = properties[key];
        const stringValue = String(value);

        // SECURITY: Block obvious scriptable CSS payloads
        const lower = stringValue.toLowerCase();
        if (lower.includes('javascript:') || lower.includes('expression(')) {
          throw new Error('Blocked unsafe CSS value');
        }

        // Basic sanitization to strip angle/quote characters from inline CSS values
        const sanitizedValue = stringValue.replace(/[<>'"]/g, '');

        // Use direct property assignment for camelCase compatibility
        (element.style as any)[key] = sanitizedValue;
      });
    }
  });
}

//Node | NodeList | HTMLCollectionOf<HTMLElement>
/**
 * @deprecated Use getStyle() or setStyle() instead for better type safety and clarity
 * Legacy function that handles both getting and setting CSS properties
 * REFACTOR: Kept for backward compatibility, delegates to getStyle/setStyle (Issue A1.10)
 */
export function css(
  elements: Node | NodeList | HTMLCollectionOf<HTMLElement>,
  properties: string | Record<string, string>,
): string | undefined {
  if (typeof properties === 'string') {
    // GET operation - delegate to getStyle
    const elmArray = toArray(elements);
    const element = elmArray[0];
    if (element instanceof Element) {
      return getStyle(element, properties);
    }
    return undefined;
  }

  // SET operation - delegate to setStyle
  setStyle(elements, properties);
  return undefined;
}

export function removeCss(element: HTMLElement, property: string): void {
  element.style.removeProperty(property);
}

/**
 * Wraps an element with a new parent element
 * Replaces the element in the DOM tree with a wrapper containing the element
 * @param element - Element to wrap
 * @param options - Wrapper configuration
 * @param options.tag - HTML tag for wrapper (default: 'div')
 * @param options.className - Optional CSS class for wrapper
 * @param options.id - Optional ID for wrapper
 * @param options.style - Optional inline styles for wrapper
 * @returns The wrapper element
 * @throws Error if element has no parent node
 */
export function wrap(
  element: HTMLElement,
  {
    tag = 'div',
    className,
    id,
    style,
  }: {
    tag?: string;
    className?: string;
    id?: string;
    style?: { display?: string; overflow?: string };
  },
): HTMLElement {
  const wrapper = document.createElement(tag);
  if (className) wrapper.className = className;
  if (id) wrapper.id = id;
  if (style) {
    if (style.display) wrapper.style.display = style.display;
    if (style.overflow) wrapper.style.overflow = style.overflow;
  }

  const parentNode = element.parentNode;
  if (!parentNode) {
    throw new Error('element does not have a parent node');
  }
  parentNode.insertBefore(wrapper, element);
  parentNode.removeChild(element);
  wrapper.appendChild(element);
  return wrapper;
}

export function unwrap(element: HTMLElement) {
  const parent = element.parentNode as HTMLElement;

  if (parent && parent !== document.body) {
    parent.parentNode?.insertBefore(element, parent);
    parent.parentNode?.removeChild(parent);
  }
}

export function remove(elements: NodeListOf<Element> | Element | HTMLElement): void {
  const elmArray = toArray(elements);
  elmArray.forEach((element: Element | HTMLCollectionOf<Element>) => {
    if (element instanceof Element && element.parentNode) {
      element.parentNode.removeChild(element);
    }
  });
}

export function clamp(num: number, min: number, max: number): number {
  return Math.min(Math.max(num, min), max);
}

/**
 * Attaches event listener(s) to an element and returns a cleanup function
 * Supports attaching multiple event types with a single handler
 * @param element - DOM element to attach events to (can be Window, Document, or HTMLElement)
 * @param events - Event name or array of event names (e.g., 'click' or ['touchstart', 'mousedown'])
 * @param handler - Event handler function
 * @returns Cleanup function that removes all attached event listeners
 * @example
 * ```typescript
 * const removeListener = assignEvent(button, ['click', 'touchend'], handleClick);
 * // Later: removeListener(); // Removes both event listeners
 * ```
 */
export function assignEvent<K extends keyof HTMLElementEventMap>(
  element: EventTarget,
  events: K | K[],
  handler: (event: HTMLElementEventMap[K]) => void,
): () => void;
export function assignEvent(
  element: EventTarget,
  events: string | string[],
  handler: EventListener,
): () => void;
export function assignEvent(
  element: EventTarget,
  events: string | string[],
  handler: EventListener,
): () => void {
  const eventList = Array.isArray(events) ? events : [events];

  // Use passive: false for wheel events to allow preventDefault
  const options: AddEventListenerOptions | undefined = eventList.some((e) => e === 'wheel')
    ? { passive: false }
    : undefined;

  eventList.forEach((event) => element.addEventListener(event, handler, options));

  return () => {
    eventList.forEach((event) => element.removeEventListener(event, handler));
  };
}

/**
 * Calculates Euclidean distance between two touch points
 * Used for pinch-to-zoom gesture detection
 * @param touches - TouchList containing at least 2 touch points
 * @returns Distance in pixels between first two touch points
 * @example
 * ```typescript
 * element.addEventListener('touchmove', (e) => {
 *   if (e.touches.length === 2) {
 *     const distance = getTouchPointsDistance(e.touches);
 *     console.log('Pinch distance:', distance);
 *   }
 * });
 * ```
 */
export function getTouchPointsDistance(touches: TouchList): number {
  const touch0 = touches[0];
  const touch1 = touches[1];
  return Math.sqrt(
    Math.pow(touch1.pageX - touch0.pageX, 2) + Math.pow(touch1.pageY - touch0.pageY, 2),
  );
}
