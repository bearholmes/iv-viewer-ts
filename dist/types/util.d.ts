export declare const ZOOM_CONSTANT = 15;
export declare const MOUSE_WHEEL_COUNT = 5;
export declare const noop: Function;
export declare function easeOutQuart(currentTime: number, startValue: number, changedValue: number, duration: number): number;
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
export declare function createElement(options: CreateElementOptions): HTMLElement;
export declare function addClass(el: HTMLElement, className: string): void;
export declare function removeClass(el: HTMLElement, className: string): void;
export declare function imageLoaded(img: any): boolean;
export declare function toArray(list: Node | NodeList | HTMLCollectionOf<HTMLElement>): (HTMLCollectionOf<Element> | Element)[];
type AnyObject = {
    [key: string]: any;
};
export declare function assign(target: AnyObject, ...rest: AnyObject[]): AnyObject;
export declare function css(elements: any, properties: any): string | undefined;
export declare function removeCss(element: HTMLElement, property: string): void;
export declare function wrap(element: HTMLElement, { tag, className, id, style }: {
    tag?: string;
    className?: string;
    id?: string;
    style?: {
        display?: string;
        overflow?: string;
    };
}): HTMLElement;
export declare function unwrap(element: HTMLElement): void;
export declare function remove(elements: NodeListOf<Element>): void;
export declare function clamp(num: number, min: number, max: number): number;
export declare function assignEvent(element: HTMLElement, events: string | string[], handler: any): () => void;
export declare function getTouchPointsDistance(touches: TouchList): number;
export {};
