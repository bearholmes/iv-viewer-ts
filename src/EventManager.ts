import { assignEvent } from './util';
import type { EventRemover } from './types';

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
export class EventManager {
  private listeners: Map<string, EventRemover> = new Map();

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
  on(
    name: string,
    target: EventTarget,
    eventType: string | string[],
    handler: EventListener
  ): EventRemover {
    // Remove existing listener with same name if present
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
  off(name: string): boolean {
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
  destroy(): void {
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
  count(): number {
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
  has(name: string): boolean {
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
  getNames(): string[] {
    return Array.from(this.listeners.keys());
  }
}
