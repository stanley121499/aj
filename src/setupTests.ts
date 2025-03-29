// jest-dom adds custom jest matchers for asserting on DOM nodes.
// allows you to do things like:
// expect(element).toHaveTextContent(/react/i)
// learn more: https://github.com/testing-library/jest-dom
import "@testing-library/jest-dom";
import { server } from "./mocks/server";

// Polyfill for TextEncoder/TextDecoder
const { TextEncoder, TextDecoder } = require("util");
global.TextEncoder = TextEncoder;
global.TextDecoder = TextDecoder;

// Mock window.matchMedia
Object.defineProperty(window, "matchMedia", {
  writable: true,
  value: jest.fn().mockImplementation((query) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(),
    removeListener: jest.fn(),
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
});

// Mock ResizeObserver
class ResizeObserverMock {
  observe(element: Element): void {
    // Mock implementation
    if (element) {
      // Do nothing, just prevent element from being unused
    }
  }

  unobserve(element: Element): void {
    // Mock implementation
    if (element) {
      // Do nothing, just prevent element from being unused
    }
  }

  disconnect(): void {
    // Mock implementation
    // Nothing to do here
  }
}

// Mock IntersectionObserver
class IntersectionObserverMock {
  readonly root: Element | null;
  readonly rootMargin: string;
  readonly thresholds: ReadonlyArray<number>;

  constructor(
    callback: IntersectionObserverCallback,
    options?: IntersectionObserverInit
  ) {
    this.root = options?.root ?? null;
    this.rootMargin = options?.rootMargin ?? "0px";
    this.thresholds = options?.threshold ? 
      Array.isArray(options.threshold) ? options.threshold : [options.threshold] 
      : [0];
  }

  observe(element: Element): void {
    // Mock implementation
    if (element) {
      // Do nothing, just prevent element from being unused
    }
  }

  unobserve(element: Element): void {
    // Mock implementation
    if (element) {
      // Do nothing, just prevent element from being unused
    }
  }

  disconnect(): void {
    // Mock implementation
    // Nothing to do here
  }
}

// Establish API mocking before all tests
beforeAll(() => server.listen());

// Reset any request handlers that we may add during the tests,
// so they don't affect other tests.
afterEach(() => {
  server.resetHandlers();
  jest.clearAllMocks();
});

// Clean up after the tests are finished.
afterAll(() => server.close());

// Mock Supabase
jest.mock("@supabase/supabase-js", () => ({
  createClient: jest.fn(() => ({
    from: jest.fn(() => ({
      select: jest.fn().mockReturnThis(),
      insert: jest.fn().mockReturnThis(),
      update: jest.fn().mockReturnThis(),
      delete: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      single: jest.fn().mockReturnThis(),
      order: jest.fn().mockReturnThis(),
    })),
    auth: {
      signIn: jest.fn(),
      signOut: jest.fn(),
      onAuthStateChange: jest.fn(),
    },
  })),
}));
