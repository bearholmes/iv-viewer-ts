/** Zoom speed multiplier for mouse wheel interactions - higher values = faster zoom */
export declare const ZOOM_CONSTANT = 15;
/** Maximum accumulated mouse wheel deltas before allowing default scroll behavior */
export declare const MOUSE_WHEEL_COUNT = 5;
export declare const noop: () => void;
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
export declare function easeOutQuart(currentTime: number, startValue: number, changedValue: number, duration: number): number;
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
export declare function isValidImageUrl(url: string | null | undefined): boolean;
interface CreateElementOptions {
    tagName: string;
    id?: string;
    html?: string;
    /** Set to true only for static, trusted markup defined in source code */
    trustedHTML?: boolean;
    className?: string;
    src?: string;
    style?: Record<string, string>;
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
export declare function createElement(options: CreateElementOptions): HTMLElement;
export declare function addClass(el: HTMLElement, className: string): void;
export declare function removeClass(el: HTMLElement, className: string): void;
export declare function imageLoaded(img: HTMLImageElement): boolean;
export declare function toArray(list: Node | NodeList | HTMLCollectionOf<HTMLElement>): (HTMLCollectionOf<Element> | Element)[];
type ObjectWithStringKeys = Record<string, string | number | boolean | object | null | undefined>;
export declare function assign(target: ObjectWithStringKeys, ...rest: ObjectWithStringKeys[]): ObjectWithStringKeys;
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
export declare function getStyle(element: Element, property: string): string;
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
export declare function parseStyleFloat(element: HTMLElement, property: string, defaultValue?: number): number;
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
export declare function setStyle(elements: Node | NodeList | HTMLCollectionOf<HTMLElement>, properties: Record<string, string>): void;
/**
 * @deprecated Use getStyle() or setStyle() instead for better type safety and clarity
 * Legacy function that handles both getting and setting CSS properties
 * REFACTOR: Kept for backward compatibility, delegates to getStyle/setStyle (Issue A1.10)
 */
export declare function css(elements: Node | NodeList | HTMLCollectionOf<HTMLElement>, properties: string | Record<string, string>): string | undefined;
export declare function removeCss(element: HTMLElement, property: string): void;
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
export declare function wrap(element: HTMLElement, { tag, className, id, style, }: {
    tag?: string;
    className?: string;
    id?: string;
    style?: {
        display?: string;
        overflow?: string;
    };
}): HTMLElement;
export declare function unwrap(element: HTMLElement): void;
export declare function remove(elements: NodeListOf<Element> | Element | HTMLElement): void;
export declare function clamp(num: number, min: number, max: number): number;
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
export declare function assignEvent<K extends keyof HTMLElementEventMap>(element: EventTarget, events: K | K[], handler: (event: HTMLElementEventMap[K]) => void): () => void;
export declare function assignEvent(element: EventTarget, events: string | string[], handler: EventListener): () => void;
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
export declare function getTouchPointsDistance(touches: TouchList): number;
export {};
