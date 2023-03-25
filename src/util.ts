// constants
export const ZOOM_CONSTANT = 15; // increase or decrease value for zoom on mouse wheel
export const MOUSE_WHEEL_COUNT = 5; // A mouse delta after which it should stop preventing default behaviour of mouse wheel

export const noop = new Function();

// ease out method
/*
    t : current time,
    b : intial value,
    c : changed value,
    d : duration
*/
export function easeOutQuart (
  currentTime: number,
  startValue: number,
  changedValue: number,
  duration: number,
): number {
  currentTime /= duration;
  currentTime -= 1;
  return (
    -changedValue *
      (currentTime * currentTime * currentTime * currentTime - 1) +
      startValue
  );
}

interface CreateElementOptions {
  tagName: string;
  id?: string;
  html?: string;
  className?: string;
  src?: string;
  style?: string;
  child?: Node;
  parent: Node;
  insertBefore?: Node;
}

export function createElement (options: CreateElementOptions) {
  const elem = document.createElement(options.tagName);
  if (options.id) elem.id = options.id;
  if (options.html) elem.innerHTML = options.html;
  if (options.className) elem.className = options.className;
  if (options.src && elem instanceof HTMLImageElement) {
    const escapedSrc = encodeURIComponent(options.src);
    elem.setAttribute('src', escapedSrc);
  }
  if (options.style) elem.style.cssText = options.style;
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
export function addClass (el: HTMLElement, className: string): void {
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
export function removeClass (el: HTMLElement, className: string): void {
  const classNameAry = className.split(' ');

  if (classNameAry.length > 1) {
    classNameAry.forEach((classItem) => removeClass(el, classItem));
  } else if (el.classList) {
    el.classList.remove(className);
  } else {
    el.className = el.className.replace(
      new RegExp(`(^|\\b)${className.split(' ').join('|')}(\\b|$)`, 'gi'),
      ' ',
    );
  }
}

// function to check if image is loaded
export function imageLoaded (img: any): boolean {
  return (
    img.complete &&
      (typeof img.naturalWidth === 'undefined' || img.naturalWidth !== 0)
  );
}

export function toArray(list: Node | NodeList | HTMLCollectionOf<HTMLElement>): (HTMLCollectionOf<Element> | Element)[] {
  if (list instanceof HTMLElement) {
    return [list];
  } else if (list instanceof NodeList || list instanceof HTMLCollection) {
    return Array.prototype.slice.call(list);
  } else {
    return [];
  }
}




type AnyObject = { [key: string]: any };
export function assign (target: AnyObject, ...rest: AnyObject[]): AnyObject {
  rest.forEach((obj) => {
    Object.keys(obj).forEach((key) => {
      target[key] = obj[key];
    });
  });
  return target;
}

//Node | NodeList | HTMLCollectionOf<HTMLElement>
export function css(elements: any, properties: any): string | undefined {
  const elmArray = toArray(elements);

  if (typeof properties === 'string') {
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    return window.getComputedStyle(<Element>elmArray[0])[properties];
  }

  elmArray.forEach((element) => {
    Object.keys(properties).forEach((key:any) => {
      (element as HTMLElement).style[key] = properties[key];
    });
  });

  return undefined;
}



export function removeCss(element: HTMLElement, property: string): void {
  element.style.removeProperty(property);
}

export function wrap(element: HTMLElement, { tag = 'div', className, id, style }: { tag?: string, className?: string, id?: string, style?: { display?: string, overflow?: string } }): HTMLElement {
  const wrapper = document.createElement(tag);
  if (className) wrapper.className = className;
  if (id) wrapper.id = id;
  if(style) {
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

export function remove(elements: NodeListOf<Element>): void {
  const elmArray = toArray(elements);
  elmArray.forEach((element : any) => {
    if (element.parentNode) {
      element.parentNode.removeChild(element);
    }
  });
}

export function clamp(num: number, min: number, max: number): number {
  return Math.min(Math.max(num, min), max);
}

export function assignEvent(
    element: HTMLElement,
    events: string | string[],
    handler: any,
): () => void {
  const eventList = Array.isArray(events) ? events : [events];
  eventList.forEach((event) => element.addEventListener(event, handler));

  return () => {
    eventList.forEach((event) => element.removeEventListener(event, handler));
  };
}

export function getTouchPointsDistance(touches: TouchList): number {
  const touch0 = touches[0];
  const touch1 = touches[1];
  return Math.sqrt(
      Math.pow(touch1.pageX - touch0.pageX, 2) +
      Math.pow(touch1.pageY - touch0.pageY, 2),
  );
}
