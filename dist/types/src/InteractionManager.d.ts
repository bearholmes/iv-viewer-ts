import { EventManager } from './EventManager';
/**
 * InteractionManager - User interaction handling for ImageViewer
 * Manages pinch zoom, wheel zoom, and double-tap zoom gestures
 *
 * Phase 7: Extracted from ImageViewer to separate interaction logic
 */
interface InteractionElements {
    imageWrap: HTMLElement;
    container: HTMLElement;
}
interface InteractionOptions {
    zoomOnMouseWheel: boolean;
    zoomValue: number;
    maxZoom: number;
}
interface InteractionCallbacks {
    getState: () => {
        loaded: boolean;
        zoomValue: number;
        zooming: boolean;
    };
    setZooming: (zooming: boolean) => void;
    clearFrames: () => void;
    zoom: (value: number, point?: {
        x: number;
        y: number;
    }) => void;
    resetZoom: () => void;
    showSnapView: () => void;
    getSlider: (key: string) => any;
    getScrollPosition: () => {
        x: number;
        y: number;
    };
}
export declare class InteractionManager {
    private elements;
    private eventManager;
    private options;
    private callbacks;
    private static readonly DOUBLE_TAP_INTERVAL_MS;
    private static readonly DOUBLE_TAP_DISTANCE_PX;
    private static readonly DOUBLE_TAP_ZOOM_LEVEL;
    constructor(elements: InteractionElements, eventManager: EventManager, options: InteractionOptions, callbacks: InteractionCallbacks);
    /**
     * Set up all interaction handlers
     */
    setupInteractions(): void;
    /**
     * Enables pinch-to-zoom gesture on touch devices
     * Calculates zoom based on distance between two touch points
     */
    setupPinchZoom(): void;
    /**
     * Enables mouse wheel zoom functionality
     * Uses ZOOM_CONSTANT (15) for zoom speed and MOUSE_WHEEL_COUNT (5) to prevent excessive zooming
     */
    setupWheelZoom(): void;
    /**
     * Enables double-click/tap to zoom functionality
     * Detects double clicks within 500ms and 50px distance threshold
     * Toggles between base zoom and 200% zoom
     */
    setupDoubleTap(): void;
    /**
     * Cleanup all interaction handlers
     * Note: EventManager.destroy() will handle event cleanup
     */
    destroy(): void;
    /**
     * Calculate the center point between two touch points
     */
    private calculatePinchCenter;
    /**
     * Calculate zoom value based on pinch distance change
     */
    private calculatePinchZoom;
    /**
     * Normalize wheel delta across browsers
     */
    private normalizeWheelDelta;
    /**
     * Calculate mouse position relative to container
     */
    private getMousePositionRelativeToContainer;
}
export {};
