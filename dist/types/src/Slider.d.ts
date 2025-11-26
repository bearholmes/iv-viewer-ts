declare class Slider {
    private _onStart;
    private _onMove;
    private _onEnd;
    private isSliderEnabled;
    private container;
    private touchMoveEvent;
    private touchEndEvent;
    private sx;
    private sy;
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
    constructor(container: HTMLElement, { onStart, onMove, onEnd, isSliderEnabled, }: {
        onStart: (event: Event, position: {
            x: number;
            y: number;
        }) => void;
        onMove: (event: Event, position: {
            dx: number;
            dy: number;
            mx: number;
            my: number;
        }) => void;
        onEnd: () => void;
        isSliderEnabled?: () => boolean;
    });
    /**
     * Public method to trigger start handler
     * Used by ImageViewer for manual slider control
     * REFACTOR: Made parameters required for better type safety (Issue C3.7)
     * @param event - Event that triggered the start
     * @param position - Initial position { x, y }
     */
    onStart(event: Event, position: {
        x: number;
        y: number;
    }): void;
    /**
     * Public method to trigger move handler
     * Used by ImageViewer for manual slider control
     * REFACTOR: Made parameters required for better type safety (Issue C3.7)
     * @param event - Event that triggered the move
     * @param position - Position with deltas and current coordinates { dx, dy, mx, my }
     */
    onMove(event: Event, position: {
        dx: number;
        dy: number;
        mx: number;
        my: number;
    }): void;
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
    updatePosition(position: {
        dx: number;
        dy: number;
        mx: number;
        my: number;
    }): void;
    /**
     * REFACTOR: Extract event type detection logic (Issue A1.8)
     * Determines if an event is a touch event based on event type
     * @param event - Event to check
     * @returns True if event is a touch event
     */
    private isTouchEvent;
    /**
     * Handles drag start event for both mouse and touch
     * Detects event type and extracts starting coordinates
     * Sets up move and end event listeners
     */
    startHandler: (eStart: Event) => void;
    /**
     * Handles drag move event for both mouse and touch
     * Calculates delta from start position and current position
     * Passes dx, dy (deltas) and mx, my (current position) to onMove callback
     */
    moveHandler: (eMove: Event) => void;
    endHandler: () => void;
    /**
     * Removes active event listeners
     * Handles edge case where mouse/touch leaves document during drag
     */
    removeListeners(): void;
    /**
     * Initializes the slider by attaching start event listeners
     * Listens for both touchstart and mousedown events
     */
    init(): void;
    /**
     * Destroys the slider by removing all event listeners
     * Cleans up both start and active drag listeners
     */
    destroy(): void;
}
export default Slider;
