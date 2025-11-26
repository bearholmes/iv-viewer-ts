import { EventRemover } from './types';
/**
 * EventManager - Centralized event management
 * REFACTOR: Extract event management logic from ImageViewer (Issue MED-1, A1.5)
 *
 * Manages all event listeners with automatic cleanup and tracking
 * Prevents memory leaks by ensuring all events are properly removed
 *
 * @example
 * ```typescript
 * const eventManager = new EventManager();
 *
 * // Register an event
 * eventManager.on('windowResize', window, 'resize', () => this.refresh());
 *
 * // Remove a specific event
 * eventManager.off('windowResize');
 *
 * // Clean up all events
 * eventManager.destroy();
 * ```
 */
export declare class EventManager {
    private listeners;
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
    on(name: string, target: EventTarget, eventType: string | string[], handler: EventListener): EventRemover;
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
    off(name: string): boolean;
    /**
     * Removes all registered event listeners
     * Should be called when destroying the component
     *
     * @example
     * ```typescript
     * eventManager.destroy();
     * ```
     */
    destroy(): void;
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
    count(): number;
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
    has(name: string): boolean;
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
    getNames(): string[];
}
