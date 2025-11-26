/**
 * Vitest global test setup
 * Runs before all test files
 */

// Add any global test setup here
// For example, custom matchers, global mocks, etc.

// Mock window.matchMedia if needed
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: (query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: () => {}, // deprecated
    removeListener: () => {}, // deprecated
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => false,
  }),
});
