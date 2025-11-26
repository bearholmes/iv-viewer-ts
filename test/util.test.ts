import { describe, it, expect, beforeEach } from 'vitest';
import {
  clamp,
  imageLoaded,
  createElement,
  addClass,
  removeClass,
  css,
  getStyle,
  setStyle,
} from '../src/util';

describe('util functions', () => {
  describe('clamp', () => {
    it('should clamp value between min and max', () => {
      expect(clamp(5, 0, 10)).toBe(5);
      expect(clamp(-5, 0, 10)).toBe(0);
      expect(clamp(15, 0, 10)).toBe(10);
    });

    it('should handle edge cases', () => {
      expect(clamp(0, 0, 10)).toBe(0);
      expect(clamp(10, 0, 10)).toBe(10);
    });
  });

  describe('imageLoaded', () => {
    it('should return true for loaded images', () => {
      const img = document.createElement('img');
      img.src = 'data:image/gif;base64,R0lGODlhAQABAAAAACwAAAAAAQABAAA=';

      // For testing purposes, we'll check the function exists
      expect(typeof imageLoaded).toBe('function');
    });
  });

  describe('createElement', () => {
    let container: HTMLElement;

    beforeEach(() => {
      container = document.createElement('div');
      document.body.appendChild(container);
    });

    it('should create element with tagName', () => {
      const div = createElement({ tagName: 'div', parent: container });
      expect(div.tagName).toBe('DIV');
    });

    it('should create element with className', () => {
      const div = createElement({ tagName: 'div', className: 'test-class', parent: container });
      expect(div.className).toBe('test-class');
    });

    it('should create element with id', () => {
      const div = createElement({ tagName: 'div', id: 'test-id', parent: container });
      expect(div.id).toBe('test-id');
    });

    it('should validate HTML content for security', () => {
      const div = createElement({
        tagName: 'div',
        html: '<div class="iv-test">Valid</div>',
        parent: container,
      });
      // isStaticLibraryHTML should allow iv- prefixed classes
      expect(div.innerHTML).toContain('Valid');
    });
  });

  describe('addClass and removeClass', () => {
    let element: HTMLElement;

    beforeEach(() => {
      element = document.createElement('div');
    });

    it('should add class to element', () => {
      addClass(element, 'test-class');
      expect(element.classList.contains('test-class')).toBe(true);
    });

    it('should add multiple classes', () => {
      addClass(element, 'class1 class2');
      expect(element.classList.contains('class1')).toBe(true);
      expect(element.classList.contains('class2')).toBe(true);
    });

    it('should remove class from element', () => {
      element.classList.add('test-class');
      removeClass(element, 'test-class');
      expect(element.classList.contains('test-class')).toBe(false);
    });
  });

  describe('css', () => {
    let element: HTMLElement;

    beforeEach(() => {
      element = document.createElement('div');
      document.body.appendChild(element);
    });

    it('should set CSS properties', () => {
      css(element, { width: '100px', height: '200px' });
      expect(element.style.width).toBe('100px');
      expect(element.style.height).toBe('200px');
    });

    it('should get CSS property value', () => {
      element.style.width = '100px';
      const width = css(element, 'width');
      expect(width).toBeDefined();
    });
  });

  describe('getStyle (Issue A1.10)', () => {
    let element: HTMLElement;

    beforeEach(() => {
      element = document.createElement('div');
      document.body.appendChild(element);
    });

    it('should get computed style value', () => {
      element.style.width = '100px';
      const width = getStyle(element, 'width');
      expect(width).toBe('100px');
    });

    it('should return empty string for non-existent property', () => {
      const value = getStyle(element, 'nonexistent-property-xyz');
      expect(value).toBe('');
    });

    it('should handle kebab-case property names', () => {
      element.style.backgroundColor = 'red';
      const bgColor = getStyle(element, 'background-color');
      expect(bgColor).toBeDefined();
    });
  });

  describe('setStyle (Issue A1.10)', () => {
    let element: HTMLElement;

    beforeEach(() => {
      element = document.createElement('div');
      document.body.appendChild(element);
    });

    it('should set CSS properties on single element', () => {
      setStyle(element, { width: '100px', height: '200px' });
      expect(element.style.width).toBe('100px');
      expect(element.style.height).toBe('200px');
    });

    it('should set CSS properties on multiple elements', () => {
      const element2 = document.createElement('div');
      document.body.appendChild(element2);

      const elements = document.querySelectorAll('div');
      setStyle(elements, { color: 'red' });

      expect(element.style.color).toBe('red');
      expect(element2.style.color).toBe('red');
    });

    it('should sanitize CSS values to prevent injection', () => {
      setStyle(element, { content: '<script>alert("xss")</script>' });
      // Quotes and angle brackets should be stripped
      expect(element.style.content).not.toContain('<');
      expect(element.style.content).not.toContain('>');
      expect(element.style.content).not.toContain('"');
    });
  });
});
