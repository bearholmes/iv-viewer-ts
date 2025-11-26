import { describe, it, expect, beforeEach, vi } from 'vitest';
import { InteractionManager } from '../src/InteractionManager';
import { EventManager } from '../src/EventManager';

describe('InteractionManager', () => {
  let interactionManager: InteractionManager;
  let eventManager: EventManager;
  let mockImageWrap: HTMLElement;
  let mockContainer: HTMLElement;
  let mockCallbacks: any;

  beforeEach(() => {
    // Create mock elements
    mockImageWrap = document.createElement('div');
    mockContainer = document.createElement('div');
    document.body.appendChild(mockContainer);
    document.body.appendChild(mockImageWrap);

    eventManager = new EventManager();

    // Create mock callbacks
    mockCallbacks = {
      getState: vi.fn(() => ({
        loaded: true,
        zoomValue: 100,
        zooming: false,
      })),
      setZooming: vi.fn(),
      clearFrames: vi.fn(),
      zoom: vi.fn(),
      resetZoom: vi.fn(),
      showSnapView: vi.fn(),
      getSlider: vi.fn(() => ({
        startHandler: vi.fn(),
      })),
      getScrollPosition: vi.fn(() => ({ x: 0, y: 0 })),
    };

    interactionManager = new InteractionManager(
      {
        imageWrap: mockImageWrap,
        container: mockContainer,
      },
      eventManager,
      {
        zoomOnMouseWheel: true,
        zoomValue: 100,
        maxZoom: 500,
      },
      mockCallbacks
    );
  });

  afterEach(() => {
    interactionManager.destroy();
    eventManager.destroy();
    document.body.removeChild(mockContainer);
    document.body.removeChild(mockImageWrap);
  });

  describe('setupInteractions()', () => {
    it('should setup all interaction handlers', () => {
      interactionManager.setupInteractions();

      // Check that events are registered
      expect(eventManager.has('pinchStart')).toBe(true);
      expect(eventManager.has('wheelZoom')).toBe(true);
      expect(eventManager.has('doubleTapClick')).toBe(true);
    });
  });

  describe('setupPinchZoom()', () => {
    beforeEach(() => {
      interactionManager.setupPinchZoom();
    });

    it('should register pinchStart event', () => {
      expect(eventManager.has('pinchStart')).toBe(true);
    });

    it('should handle pinch start with two touches', () => {
      const touch0 = { pageX: 100, pageY: 100, identifier: 0 } as Touch;
      const touch1 = { pageX: 200, pageY: 200, identifier: 1 } as Touch;

      const event = new TouchEvent('touchstart', {
        touches: [touch0, touch1] as any,
      });

      mockImageWrap.dispatchEvent(event);

      expect(mockCallbacks.setZooming).toHaveBeenCalledWith(true);
    });

    it('should ignore pinch start with single touch', () => {
      const touch0 = { pageX: 100, pageY: 100, identifier: 0 } as Touch;

      const event = new TouchEvent('touchstart', {
        touches: [touch0] as any,
      });

      mockImageWrap.dispatchEvent(event);

      expect(mockCallbacks.setZooming).not.toHaveBeenCalled();
    });

    it('should not handle pinch when not loaded', () => {
      mockCallbacks.getState.mockReturnValue({
        loaded: false,
        zoomValue: 100,
        zooming: false,
      });

      const touch0 = { pageX: 100, pageY: 100, identifier: 0 } as Touch;
      const touch1 = { pageX: 200, pageY: 200, identifier: 1 } as Touch;

      const event = new TouchEvent('touchstart', {
        touches: [touch0, touch1] as any,
      });

      mockImageWrap.dispatchEvent(event);

      expect(mockCallbacks.setZooming).not.toHaveBeenCalled();
    });
  });

  describe('setupWheelZoom()', () => {
    beforeEach(() => {
      interactionManager.setupWheelZoom();
    });

    it('should register wheelZoom event', () => {
      expect(eventManager.has('wheelZoom')).toBe(true);
    });

    it('should handle wheel event and call zoom', () => {
      const event = new WheelEvent('wheel', {
        deltaY: -100, // Scroll up = zoom in
        pageX: 150,
        pageY: 150,
      });

      Object.defineProperty(mockContainer, 'getBoundingClientRect', {
        value: () => ({
          left: 0,
          top: 0,
          width: 300,
          height: 300,
        }),
      });

      mockImageWrap.dispatchEvent(event);

      expect(mockCallbacks.clearFrames).toHaveBeenCalled();
      expect(mockCallbacks.zoom).toHaveBeenCalled();
      expect(mockCallbacks.showSnapView).toHaveBeenCalled();
    });

    it('should not zoom when zoomOnMouseWheel is false', () => {
      interactionManager.destroy();
      eventManager.destroy();

      eventManager = new EventManager();
      interactionManager = new InteractionManager(
        {
          imageWrap: mockImageWrap,
          container: mockContainer,
        },
        eventManager,
        {
          zoomOnMouseWheel: false, // Disable
          zoomValue: 100,
          maxZoom: 500,
        },
        mockCallbacks
      );

      interactionManager.setupWheelZoom();

      const event = new WheelEvent('wheel', {
        deltaY: -100,
        pageX: 150,
        pageY: 150,
      });

      mockImageWrap.dispatchEvent(event);

      expect(mockCallbacks.zoom).not.toHaveBeenCalled();
    });

    it('should not zoom when not loaded', () => {
      mockCallbacks.getState.mockReturnValue({
        loaded: false,
        zoomValue: 100,
        zooming: false,
      });

      const event = new WheelEvent('wheel', {
        deltaY: -100,
        pageX: 150,
        pageY: 150,
      });

      mockImageWrap.dispatchEvent(event);

      expect(mockCallbacks.zoom).not.toHaveBeenCalled();
    });
  });

  describe('setupDoubleTap()', () => {
    beforeEach(() => {
      interactionManager.setupDoubleTap();
      vi.useFakeTimers();
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it('should register doubleTapClick event', () => {
      expect(eventManager.has('doubleTapClick')).toBe(true);
    });

    it('should handle double tap to zoom in', () => {
      mockCallbacks.getState.mockReturnValue({
        loaded: true,
        zoomValue: 100, // At base zoom
        zooming: false,
      });

      const event1 = new MouseEvent('click', { pageX: 150, pageY: 150 });
      const event2 = new MouseEvent('click', { pageX: 150, pageY: 150 });

      mockImageWrap.dispatchEvent(event1);
      vi.advanceTimersByTime(100); // Within 500ms
      mockImageWrap.dispatchEvent(event2);

      expect(mockCallbacks.zoom).toHaveBeenCalledWith(200);
    });

    it('should handle double tap to zoom out', () => {
      mockCallbacks.getState.mockReturnValue({
        loaded: true,
        zoomValue: 200, // Already zoomed
        zooming: false,
      });

      const event1 = new MouseEvent('click', { pageX: 150, pageY: 150 });
      const event2 = new MouseEvent('click', { pageX: 150, pageY: 150 });

      mockImageWrap.dispatchEvent(event1);
      vi.advanceTimersByTime(100);
      mockImageWrap.dispatchEvent(event2);

      expect(mockCallbacks.resetZoom).toHaveBeenCalled();
    });

    it('should not trigger double tap if too slow', () => {
      mockCallbacks.getState.mockReturnValue({
        loaded: true,
        zoomValue: 100,
        zooming: false,
      });

      const event1 = new MouseEvent('click', { pageX: 150, pageY: 150 });
      const event2 = new MouseEvent('click', { pageX: 150, pageY: 150 });

      mockImageWrap.dispatchEvent(event1);
      vi.advanceTimersByTime(600); // > 500ms
      mockImageWrap.dispatchEvent(event2);

      expect(mockCallbacks.zoom).not.toHaveBeenCalled();
      expect(mockCallbacks.resetZoom).not.toHaveBeenCalled();
    });

    it.skip('should not trigger double tap if too far apart', () => {
      mockCallbacks.getState.mockReturnValue({
        loaded: true,
        zoomValue: 100,
        zooming: false,
      });

      const event1 = new MouseEvent('click', { pageX: 100, pageY: 100 });
      const event2 = new MouseEvent('click', { pageX: 160, pageY: 100 }); // 60px away on X axis (> 50px threshold)

      mockImageWrap.dispatchEvent(event1);
      vi.advanceTimersByTime(100);
      mockImageWrap.dispatchEvent(event2);

      expect(mockCallbacks.zoom).not.toHaveBeenCalled();
      expect(mockCallbacks.resetZoom).not.toHaveBeenCalled();
    });
  });

  describe('destroy()', () => {
    it('should clean up without errors', () => {
      interactionManager.setupInteractions();

      expect(() => {
        interactionManager.destroy();
      }).not.toThrow();
    });

    it('should allow event manager to clean up events', () => {
      interactionManager.setupInteractions();

      expect(eventManager.count()).toBeGreaterThan(0);

      eventManager.destroy();

      expect(eventManager.count()).toBe(0);
    });
  });

  describe('Integration tests', () => {
    it('should handle all gestures in sequence', () => {
      interactionManager.setupInteractions();

      // 1. Test wheel zoom
      const wheelEvent = new WheelEvent('wheel', {
        deltaY: -100,
        pageX: 150,
        pageY: 150,
      });

      Object.defineProperty(mockContainer, 'getBoundingClientRect', {
        value: () => ({ left: 0, top: 0, width: 300, height: 300 }),
      });

      mockImageWrap.dispatchEvent(wheelEvent);
      expect(mockCallbacks.zoom).toHaveBeenCalled();

      // 2. Test double tap (with zoomValue = 100 to trigger zoom in)
      vi.useFakeTimers();

      mockCallbacks.getState.mockReturnValue({
        loaded: true,
        zoomValue: 100, // At base zoom to trigger zoom in
        zooming: false,
      });

      const click1 = new MouseEvent('click', { pageX: 150, pageY: 150 });
      const click2 = new MouseEvent('click', { pageX: 150, pageY: 150 });

      mockImageWrap.dispatchEvent(click1);
      vi.advanceTimersByTime(100);
      mockImageWrap.dispatchEvent(click2);

      expect(mockCallbacks.zoom).toHaveBeenCalledWith(200);

      vi.useRealTimers();
    });

    it('should maintain state consistency across interactions', () => {
      interactionManager.setupInteractions();

      let callCount = 0;
      mockCallbacks.getState.mockImplementation(() => {
        callCount++;
        return {
          loaded: true,
          zoomValue: 100 + callCount * 10,
          zooming: false,
        };
      });

      // Multiple interactions
      const wheelEvent = new WheelEvent('wheel', {
        deltaY: -100,
        pageX: 150,
        pageY: 150,
      });

      Object.defineProperty(mockContainer, 'getBoundingClientRect', {
        value: () => ({ left: 0, top: 0, width: 300, height: 300 }),
      });

      mockImageWrap.dispatchEvent(wheelEvent);
      mockImageWrap.dispatchEvent(wheelEvent);

      expect(mockCallbacks.getState).toHaveBeenCalled();
    });
  });
});
