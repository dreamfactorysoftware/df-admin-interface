/**
 * Vitest Setup Configuration
 * 
 * This file replaces setup-jest.ts from the Angular implementation and configures
 * the testing environment for React 19/Next.js 15.1 with enhanced performance
 * and modern testing utilities.
 * 
 * Key Features:
 * - MSW (Mock Service Worker) for realistic API mocking
 * - React Testing Library with custom render utilities
 * - Enhanced React 19 testing support with concurrent features
 * - Tailwind CSS class mocking for component tests
 * - Global test environment setup with DOM cleanup
 * - TypeScript 5.8+ support with zero configuration overhead
 * 
 * Performance Target: < 30 seconds for complete unit test suite execution
 * Coverage Target: 90%+ code coverage
 */

import { beforeAll, afterEach, afterAll, expect, vi } from 'vitest';
import { cleanup } from '@testing-library/react';
import '@testing-library/jest-dom';

// Import MSW server for API mocking
// Note: This assumes src/test/mocks/server.ts exports a configured MSW server
// with handlers for DreamFactory API endpoints
import { server } from './mocks/server';

// Global test environment setup
beforeAll(() => {
  // Start MSW server before all tests
  // Ensures realistic API mocking for all database service interactions
  server.listen({
    onUnhandledRequest: 'warn', // Warn about unmocked requests during development
  });

  // Configure global fetch mock for Node.js environment
  // This ensures Next.js API routes and SWR/React Query work in tests
  global.fetch = vi.fn();

  // Mock browser APIs that may not be available in test environment
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: vi.fn().mockImplementation((query) => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: vi.fn(), // deprecated
      removeListener: vi.fn(), // deprecated
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    })),
  });

  // Mock IntersectionObserver for components using it (e.g., virtual scrolling)
  global.IntersectionObserver = vi.fn().mockImplementation(() => ({
    observe: vi.fn(),
    unobserve: vi.fn(),
    disconnect: vi.fn(),
  }));

  // Mock ResizeObserver for responsive components
  global.ResizeObserver = vi.fn().mockImplementation(() => ({
    observe: vi.fn(),
    unobserve: vi.fn(),
    disconnect: vi.fn(),
  }));

  // Mock Web Worker for background processing in schema discovery
  global.Worker = vi.fn().mockImplementation(() => ({
    postMessage: vi.fn(),
    terminate: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
  }));

  // Mock localStorage and sessionStorage for authentication tests
  Object.defineProperty(window, 'localStorage', {
    value: {
      getItem: vi.fn(() => null),
      setItem: vi.fn(() => null),
      removeItem: vi.fn(() => null),
      clear: vi.fn(() => null),
    },
    writable: true,
  });

  Object.defineProperty(window, 'sessionStorage', {
    value: {
      getItem: vi.fn(() => null),
      setItem: vi.fn(() => null),
      removeItem: vi.fn(() => null),
      clear: vi.fn(() => null),
    },
    writable: true,
  });

  // Mock crypto.randomUUID for ID generation in tests
  Object.defineProperty(global, 'crypto', {
    value: {
      randomUUID: vi.fn(() => 'mock-uuid-123'),
      getRandomValues: vi.fn((arr) => arr.map(() => Math.floor(Math.random() * 256))),
    },
    writable: true,
  });

  // Mock URL and URLSearchParams for Next.js routing tests
  global.URL = URL;
  global.URLSearchParams = URLSearchParams;

  // Mock console methods for cleaner test output
  // Only mock error and warn to catch actual issues
  global.console = {
    ...console,
    error: vi.fn(),
    warn: vi.fn(),
  };
});

// Clean up after each test to ensure test isolation
afterEach(() => {
  // Clean up React Testing Library rendered components
  cleanup();

  // Reset all MSW request handlers to default state
  server.resetHandlers();

  // Clear all mocks to prevent test interference
  vi.clearAllMocks();

  // Reset localStorage and sessionStorage
  (window.localStorage.clear as any).mockClear();
  (window.sessionStorage.clear as any).mockClear();

  // Reset fetch mock
  (global.fetch as any).mockClear();
});

// Clean up after all tests
afterAll(() => {
  // Stop MSW server
  server.close();

  // Restore all mocks to original implementations
  vi.restoreAllMocks();
});

// Enhanced expect matchers for React Testing Library
expect.extend({
  // Custom matcher for testing Tailwind CSS classes
  toHaveClass: (received, expected) => {
    const pass = received.classList.contains(expected);
    return {
      pass,
      message: () =>
        pass
          ? `Expected element not to have class "${expected}"`
          : `Expected element to have class "${expected}"`,
    };
  },

  // Custom matcher for testing data attributes
  toHaveDataAttribute: (received, attribute, value) => {
    const actualValue = received.getAttribute(`data-${attribute}`);
    const pass = value === undefined ? actualValue !== null : actualValue === value;
    return {
      pass,
      message: () =>
        pass
          ? `Expected element not to have data-${attribute}="${value}"`
          : `Expected element to have data-${attribute}="${value}", but got "${actualValue}"`,
    };
  },
});

// Mock Tailwind CSS for component tests
// This ensures CSS classes don't cause test failures
vi.mock('tailwindcss', () => ({
  default: vi.fn(),
}));

// Mock Next.js router for component tests
vi.mock('next/router', () => ({
  useRouter: vi.fn(() => ({
    push: vi.fn(),
    replace: vi.fn(),
    back: vi.fn(),
    forward: vi.fn(),
    refresh: vi.fn(),
    prefetch: vi.fn(),
    pathname: '/',
    query: {},
    asPath: '/',
    route: '/',
    events: {
      on: vi.fn(),
      off: vi.fn(),
      emit: vi.fn(),
    },
  })),
}));

// Mock Next.js navigation for app router
vi.mock('next/navigation', () => ({
  useRouter: vi.fn(() => ({
    push: vi.fn(),
    replace: vi.fn(),
    back: vi.fn(),
    forward: vi.fn(),
    refresh: vi.fn(),
    prefetch: vi.fn(),
  })),
  usePathname: vi.fn(() => '/'),
  useSearchParams: vi.fn(() => new URLSearchParams()),
  useParams: vi.fn(() => ({})),
}));

// Mock Next.js Image component for performance tests
vi.mock('next/image', () => ({
  default: vi.fn(({ src, alt, ...props }) => ({
    // Return a simple img element for testing
    type: 'img',
    props: { src, alt, ...props },
  })),
}));

// Mock Zustand store for state management tests
vi.mock('zustand', () => ({
  create: vi.fn((fn) => {
    const store = fn(() => ({}), () => ({}));
    return () => store;
  }),
}));

// Global test utilities and configuration
global.testConfig = {
  // API base URL for tests
  apiBaseUrl: 'http://localhost:3000/api',
  
  // Database connection test timeout
  connectionTimeout: 5000,
  
  // Mock user session for authenticated tests
  mockSession: {
    user: {
      id: '1',
      email: 'test@dreamfactory.com',
      name: 'Test User',
      role: 'admin',
    },
    token: 'mock-jwt-token',
    expiresAt: new Date(Date.now() + 3600000), // 1 hour from now
  },
  
  // Mock database services for testing
  mockDatabaseServices: [
    {
      id: '1',
      name: 'mysql-test',
      type: 'mysql',
      config: {
        host: 'localhost',
        port: 3306,
        database: 'test_db',
        username: 'test_user',
      },
    },
    {
      id: '2',
      name: 'postgresql-test',
      type: 'postgresql', 
      config: {
        host: 'localhost',
        port: 5432,
        database: 'test_db',
        username: 'test_user',
      },
    },
  ],
};

// React 19 specific test configuration
// Configure React testing for concurrent features and server components
global.React = require('react');

// Enable React 19 concurrent features for testing
if (typeof window !== 'undefined') {
  window.React = global.React;
}

// Configure Vitest with React Testing Library optimizations
// This ensures fast test execution with proper cleanup
declare global {
  var testConfig: {
    apiBaseUrl: string;
    connectionTimeout: number;
    mockSession: {
      user: {
        id: string;
        email: string;
        name: string;
        role: string;
      };
      token: string;
      expiresAt: Date;
    };
    mockDatabaseServices: Array<{
      id: string;
      name: string;
      type: string;
      config: Record<string, any>;
    }>;
  };

  namespace Vi {
    interface ExpectStatic {
      toHaveClass(expected: string): any;
      toHaveDataAttribute(attribute: string, value?: string): any;
    }
  }
}

// Export test configuration for use in test files
export { server };
export type { MockSession, MockDatabaseService } from './utils/test-utils';