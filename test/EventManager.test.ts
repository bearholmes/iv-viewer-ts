import { describe, it, expect, beforeEach, vi } from 'vitest';
import { EventManager } from '../src/EventManager';

describe('EventManager', () => {
  let eventManager: EventManager;
  let mockElement: HTMLElement;

  beforeEach(() => {
    eventManager = new EventManager();
    mockElement = document.createElement('div');
    document.body.appendChild(mockElement);
  });

  afterEach(() => {
    eventManager.destroy();
    document.body.removeChild(mockElement);
  });

  describe('on()', () => {
    it('should register a single event listener', () => {
      const handler = vi.fn();

      eventManager.on('testEvent', mockElement, 'click', handler);

      expect(eventManager.count()).toBe(1);
      expect(eventManager.has('testEvent')).toBe(true);
    });

    it('should trigger registered event handler', () => {
      const handler = vi.fn();

      eventManager.on('testEvent', mockElement, 'click', handler);
      mockElement.click();

      expect(handler).toHaveBeenCalledTimes(1);
    });

    it('should register multiple event types', () => {
      const handler = vi.fn();

      eventManager.on('multiEvent', mockElement, ['click', 'mousedown'], handler);

      mockElement.click();
      mockElement.dispatchEvent(new MouseEvent('mousedown'));

      expect(handler).toHaveBeenCalledTimes(2);
    });

    it('should replace existing listener with same name', () => {
      const handler1 = vi.fn();
      const handler2 = vi.fn();

      eventManager.on('testEvent', mockElement, 'click', handler1);
      eventManager.on('testEvent', mockElement, 'click', handler2);

      expect(eventManager.count()).toBe(1);

      mockElement.click();

      expect(handler1).toHaveBeenCalledTimes(0);
      expect(handler2).toHaveBeenCalledTimes(1);
    });

    it('should return a cleanup function', () => {
      const handler = vi.fn();

      const cleanup = eventManager.on('testEvent', mockElement, 'click', handler);

      expect(typeof cleanup).toBe('function');

      cleanup();
      mockElement.click();

      expect(handler).toHaveBeenCalledTimes(0);
    });
  });

  describe('off()', () => {
    it('should remove a registered event listener', () => {
      const handler = vi.fn();

      eventManager.on('testEvent', mockElement, 'click', handler);
      const result = eventManager.off('testEvent');

      expect(result).toBe(true);
      expect(eventManager.count()).toBe(0);
      expect(eventManager.has('testEvent')).toBe(false);

      mockElement.click();
      expect(handler).toHaveBeenCalledTimes(0);
    });

    it('should return false when removing non-existent listener', () => {
      const result = eventManager.off('nonExistent');

      expect(result).toBe(false);
    });

    it('should handle multiple removals gracefully', () => {
      const handler = vi.fn();

      eventManager.on('testEvent', mockElement, 'click', handler);
      eventManager.off('testEvent');
      const result = eventManager.off('testEvent');

      expect(result).toBe(false);
    });
  });

  describe('destroy()', () => {
    it('should remove all registered event listeners', () => {
      const handler1 = vi.fn();
      const handler2 = vi.fn();
      const handler3 = vi.fn();

      eventManager.on('event1', mockElement, 'click', handler1);
      eventManager.on('event2', mockElement, 'mousedown', handler2);
      eventManager.on('event3', mockElement, 'mouseup', handler3);

      expect(eventManager.count()).toBe(3);

      eventManager.destroy();

      expect(eventManager.count()).toBe(0);

      mockElement.click();
      mockElement.dispatchEvent(new MouseEvent('mousedown'));
      mockElement.dispatchEvent(new MouseEvent('mouseup'));

      expect(handler1).toHaveBeenCalledTimes(0);
      expect(handler2).toHaveBeenCalledTimes(0);
      expect(handler3).toHaveBeenCalledTimes(0);
    });

    it('should handle destroy on empty manager', () => {
      expect(() => {
        eventManager.destroy();
      }).not.toThrow();
    });

    it('should allow re-registration after destroy', () => {
      const handler = vi.fn();

      eventManager.on('testEvent', mockElement, 'click', handler);
      eventManager.destroy();
      eventManager.on('testEvent', mockElement, 'click', handler);

      expect(eventManager.count()).toBe(1);

      mockElement.click();
      expect(handler).toHaveBeenCalledTimes(1);
    });
  });

  describe('count()', () => {
    it('should return 0 for new EventManager', () => {
      expect(eventManager.count()).toBe(0);
    });

    it('should return correct count after adding events', () => {
      const handler = vi.fn();

      eventManager.on('event1', mockElement, 'click', handler);
      expect(eventManager.count()).toBe(1);

      eventManager.on('event2', mockElement, 'mousedown', handler);
      expect(eventManager.count()).toBe(2);

      eventManager.on('event3', mockElement, 'mouseup', handler);
      expect(eventManager.count()).toBe(3);
    });

    it('should return correct count after removing events', () => {
      const handler = vi.fn();

      eventManager.on('event1', mockElement, 'click', handler);
      eventManager.on('event2', mockElement, 'mousedown', handler);
      eventManager.on('event3', mockElement, 'mouseup', handler);

      eventManager.off('event2');
      expect(eventManager.count()).toBe(2);

      eventManager.off('event1');
      expect(eventManager.count()).toBe(1);

      eventManager.off('event3');
      expect(eventManager.count()).toBe(0);
    });
  });

  describe('has()', () => {
    it('should return false for non-existent event', () => {
      expect(eventManager.has('nonExistent')).toBe(false);
    });

    it('should return true for registered event', () => {
      const handler = vi.fn();

      eventManager.on('testEvent', mockElement, 'click', handler);

      expect(eventManager.has('testEvent')).toBe(true);
    });

    it('should return false after removing event', () => {
      const handler = vi.fn();

      eventManager.on('testEvent', mockElement, 'click', handler);
      eventManager.off('testEvent');

      expect(eventManager.has('testEvent')).toBe(false);
    });
  });

  describe('getNames()', () => {
    it('should return empty array for new EventManager', () => {
      expect(eventManager.getNames()).toEqual([]);
    });

    it('should return all registered event names', () => {
      const handler = vi.fn();

      eventManager.on('event1', mockElement, 'click', handler);
      eventManager.on('event2', mockElement, 'mousedown', handler);
      eventManager.on('event3', mockElement, 'mouseup', handler);

      const names = eventManager.getNames();

      expect(names).toHaveLength(3);
      expect(names).toContain('event1');
      expect(names).toContain('event2');
      expect(names).toContain('event3');
    });

    it('should update names after adding/removing events', () => {
      const handler = vi.fn();

      eventManager.on('event1', mockElement, 'click', handler);
      eventManager.on('event2', mockElement, 'mousedown', handler);

      expect(eventManager.getNames()).toEqual(['event1', 'event2']);

      eventManager.off('event1');

      expect(eventManager.getNames()).toEqual(['event2']);
    });
  });

  describe('Memory leak prevention', () => {
    it('should prevent memory leaks by cleaning up all events', () => {
      const handler = vi.fn();

      // Register many events
      for (let i = 0; i < 100; i++) {
        eventManager.on(`event${i}`, mockElement, 'click', handler);
      }

      expect(eventManager.count()).toBe(100);

      // Destroy should clean up all events
      eventManager.destroy();

      expect(eventManager.count()).toBe(0);
      expect(eventManager.getNames()).toEqual([]);
    });

    it('should handle replacing events without leaking', () => {
      const handler1 = vi.fn();
      const handler2 = vi.fn();

      // Replace same event multiple times
      for (let i = 0; i < 10; i++) {
        eventManager.on('testEvent', mockElement, 'click', i % 2 === 0 ? handler1 : handler2);
      }

      // Should only have 1 event registered (last one)
      expect(eventManager.count()).toBe(1);

      mockElement.click();

      // Only the last handler should be called
      expect(handler2).toHaveBeenCalledTimes(1);
      expect(handler1).toHaveBeenCalledTimes(0);
    });
  });

  describe('Window events', () => {
    it('should handle window events', () => {
      const handler = vi.fn();

      eventManager.on('windowResize', window, 'resize', handler);

      window.dispatchEvent(new Event('resize'));

      expect(handler).toHaveBeenCalledTimes(1);

      eventManager.off('windowResize');

      window.dispatchEvent(new Event('resize'));

      expect(handler).toHaveBeenCalledTimes(1);
    });
  });
});
