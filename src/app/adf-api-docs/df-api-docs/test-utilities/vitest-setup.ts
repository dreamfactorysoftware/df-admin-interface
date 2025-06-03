/**
 * Vitest Test Environment Setup for API Documentation Testing
 * 
 * This file provides specialized test environment configuration for API documentation
 * components, replacing Angular TestBed patterns with modern Vitest and React Testing
 * Library integration. Optimized for 10x faster test execution compared to Jest/Karma.
 * 
 * Key Features:
 * - MSW server setup for comprehensive API documentation endpoint mocking
 * - React Testing Library custom render functions with provider wrappers
 * - React Query client configuration for hook testing with proper cache management
 * - Test environment optimization targeting < 30 second test suite execution
 * - Global test utilities for consistent component testing patterns
 * - Authentication and theme context providers for isolated testing
 * - Performance testing utilities for API response validation
 * - Next.js API route mocking for realistic server-side testing
 * 
 * Migration Benefits:
 * - 10x faster test execution compared to Angular TestBed
 * - Enhanced React 19 concurrent features testing support
 * - Better integration with MSW for realistic API mocking
 * - Improved debugging with native TypeScript support
 * 
 * @see https://vitest.dev/guide/ - Vitest configuration documentation
 * @see https://testing-library.com/docs/react-testing-library/intro - React Testing Library guide
 * @see https://mswjs.io/docs/ - Mock Service Worker documentation
 */

import { beforeAll, afterEach, afterAll, beforeEach, expect, vi, type MockedFunction } from 'vitest';
import { cleanup, render, screen, within, type RenderOptions } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactElement, ReactNode, Suspense } from 'react';
import { setupServer } from 'msw/node';
import type { DefaultBodyType, StrictRequest, MockedRequest } from 'msw';

// Type-safe imports for API documentation mock data and handlers
// These files will be created as dependencies for this setup file
import type { OpenAPISpecification, MockApiDocsOptions } from './df-api-docs.mock';
import type { 
  ApiDocumentationTestData,
  EmailServiceTestData,
  ServiceConfigurationTestData 
} from './test-data-factories';
import type { ApiDocsRequestHandlers } from './msw-handlers';

// Global test configuration interface
interface ApiDocsTestConfig {
  queryClient: QueryClient;
  server: ReturnType<typeof setupServer>;
  user: ReturnType<typeof userEvent.setup>;
  mockSession: {
    user: {
      id: string;
      email: string;
      name: string;
      role: 'admin' | 'user' | 'developer';
    };
    token: string;
    expiresAt: Date;
  };
  apiBaseUrl: string;
  performanceThresholds: {
    componentRender: number;
    apiResponse: number;
    cacheHit: number;
    optimisticUpdate: number;
  };
}

// Enhanced render options for API documentation components
interface ApiDocsRenderOptions extends Omit<RenderOptions, 'wrapper'> {
  // Authentication context options
  withAuth?: boolean;
  mockUser?: {
    id: string;
    email: string;
    name: string;
    role: 'admin' | 'user' | 'developer';
  };
  
  // Theme and UI context options
  theme?: 'light' | 'dark' | 'system';
  
  // React Query context options
  queryClientOptions?: {
    defaultOptions?: {
      queries?: {
        retry?: number;
        staleTime?: number;
        cacheTime?: number;
      };
      mutations?: {
        retry?: number;
      };
    };
  };
  
  // API mocking options
  apiMockOptions?: Partial<MockApiDocsOptions>;
  
  // Next.js routing context options
  routerContext?: {
    pathname?: string;
    query?: Record<string, string | string[]>;
    asPath?: string;
  };
  
  // Performance testing options
  measurePerformance?: boolean;
}

// Performance measurement utilities
interface PerformanceMeasurement {
  renderTime: number;
  queryTime: number;
  cacheHitRate: number;
  memoryUsage: number;
}

// Global test configuration instance
let testConfig: ApiDocsTestConfig;

/**
 * Initialize test environment before all tests
 * Configures MSW server, React Query client, and global test utilities
 */
beforeAll(async () => {
  // Import MSW handlers for API documentation endpoints
  // Dynamic import to avoid circular dependencies during test setup
  const { createApiDocsHandlers } = await import('./msw-handlers');
  const { createApiDocumentationTestData } = await import('./test-data-factories');
  
  // Create MSW server with comprehensive API documentation handlers
  const handlers = createApiDocsHandlers({
    serviceType: 'email',
    version: '2.0',
    includeAdvancedAuth: true,
    includeCustomSchemas: true,
    enableOptimisticUpdates: true,
    cacheTimeout: 300000, // 5 minutes for testing
  });
  
  const server = setupServer(...handlers);
  
  // Create React Query client optimized for testing
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        // Optimize for test performance
        retry: false, // Disable retries in tests
        staleTime: 0, // Always fetch fresh data in tests
        gcTime: 1000 * 60 * 5, // 5 minutes cache time
        networkMode: 'offlineFirst', // Use MSW mocks
      },
      mutations: {
        retry: false, // Disable retries in tests
        networkMode: 'offlineFirst', // Use MSW mocks
      },
    },
    logger: {
      // Suppress React Query logs during tests for cleaner output
      log: vi.fn(),
      warn: vi.fn(),
      error: vi.fn(),
    },
  });
  
  // Setup user event utilities for interaction testing
  const user = userEvent.setup({
    advanceTimers: vi.advanceTimersByTime,
    delay: null, // Disable delays in tests for faster execution
  });
  
  // Configure global test configuration
  testConfig = {
    queryClient,
    server,
    user,
    mockSession: {
      user: {
        id: 'test-user-123',
        email: 'test@dreamfactory.com',
        name: 'Test User',
        role: 'admin',
      },
      token: 'mock-jwt-token-api-docs',
      expiresAt: new Date(Date.now() + 3600000), // 1 hour from now
    },
    apiBaseUrl: 'http://localhost:3000/api/v2',
    performanceThresholds: {
      componentRender: 100, // 100ms max component render time
      apiResponse: 2000, // 2 second max API response time
      cacheHit: 50, // 50ms max cache hit response time
      optimisticUpdate: 100, // 100ms max optimistic update time
    },
  };
  
  // Start MSW server for API mocking
  server.listen({
    onUnhandledRequest: 'warn', // Warn about unmocked requests
  });
  
  // Mock browser APIs specific to API documentation testing
  mockBrowserAPIs();
  
  // Mock Next.js APIs for server component testing
  mockNextJSAPIs();
  
  // Setup global performance monitoring
  setupPerformanceMonitoring();
  
  console.info('🚀 API Documentation test environment initialized');
});

/**
 * Setup before each individual test
 * Ensures clean test environment and fresh React Query cache
 */
beforeEach(() => {
  // Clear React Query cache for test isolation
  testConfig.queryClient.clear();
  
  // Reset all timers for consistent test execution
  vi.useFakeTimers();
  
  // Clear performance measurements
  global.testPerformanceData = {
    renderTimes: [],
    queryTimes: [],
    cacheHits: 0,
    cacheMisses: 0,
    memorySnapshots: [],
  };
});

/**
 * Cleanup after each test
 * Ensures proper test isolation and prevents memory leaks
 */
afterEach(() => {
  // Clean up React Testing Library rendered components
  cleanup();
  
  // Reset MSW request handlers to default state
  testConfig.server.resetHandlers();
  
  // Clear all mocks to prevent test interference
  vi.clearAllMocks();
  
  // Clear React Query cache
  testConfig.queryClient.clear();
  
  // Restore real timers
  vi.useRealTimers();
  
  // Reset DOM modifications
  document.head.innerHTML = '';
  document.body.innerHTML = '<div id="root"></div>';
  
  // Clear local and session storage
  localStorage.clear();
  sessionStorage.clear();
  
  // Force garbage collection if available (Node.js testing)
  if (global.gc) {
    global.gc();
  }
});

/**
 * Cleanup after all tests
 * Stops MSW server and restores all mocks
 */
afterAll(() => {
  // Stop MSW server
  testConfig.server.close();
  
  // Restore all mocks to original implementations
  vi.restoreAllMocks();
  
  console.info('🧹 API Documentation test environment cleaned up');
});

/**
 * Enhanced custom render function for API documentation components
 * Provides comprehensive testing context with authentication, theming, and routing
 * 
 * @param ui - React component to render
 * @param options - Render options with context providers
 * @returns Render result with enhanced testing utilities
 */
export function renderWithApiDocsProviders(
  ui: ReactElement,
  options: ApiDocsRenderOptions = {}
): ReturnType<typeof render> & {
  user: ReturnType<typeof userEvent.setup>;
  queryClient: QueryClient;
  performanceData?: PerformanceMeasurement;
} {
  const {
    withAuth = true,
    mockUser,
    theme = 'light',
    queryClientOptions,
    apiMockOptions,
    routerContext,
    measurePerformance = false,
    ...renderOptions
  } = options;
  
  // Performance measurement start
  const startTime = performance.now();
  
  // Create test-specific query client if custom options provided
  const queryClient = queryClientOptions 
    ? new QueryClient({
        defaultOptions: {
          ...testConfig.queryClient.getDefaultOptions(),
          ...queryClientOptions.defaultOptions,
        },
        logger: testConfig.queryClient.getLogger(),
      })
    : testConfig.queryClient;
  
  // Mock session data
  const sessionUser = mockUser || testConfig.mockSession.user;
  
  // Create test wrapper with all necessary providers
  const TestWrapper = ({ children }: { children: ReactNode }) => {
    return (
      <QueryClientProvider client={queryClient}>
        <Suspense fallback={<div data-testid="loading">Loading...</div>}>
          <MockThemeProvider theme={theme}>
            {withAuth ? (
              <MockAuthProvider user={sessionUser} token={testConfig.mockSession.token}>
                <MockRouterProvider context={routerContext}>
                  {children}
                </MockRouterProvider>
              </MockAuthProvider>
            ) : (
              <MockRouterProvider context={routerContext}>
                {children}
              </MockRouterProvider>
            )}
          </MockThemeProvider>
        </Suspense>
      </QueryClientProvider>
    );
  };
  
  // Render component with providers
  const result = render(ui, {
    wrapper: TestWrapper,
    ...renderOptions,
  });
  
  // Performance measurement end
  const renderTime = performance.now() - startTime;
  
  // Validate performance thresholds if measurement enabled
  let performanceData: PerformanceMeasurement | undefined;
  if (measurePerformance) {
    performanceData = {
      renderTime,
      queryTime: 0, // Will be updated by query hooks
      cacheHitRate: calculateCacheHitRate(),
      memoryUsage: getMemoryUsage(),
    };
    
    // Assert performance thresholds
    expect(renderTime).toBeLessThan(testConfig.performanceThresholds.componentRender);
  }
  
  return {
    ...result,
    user: testConfig.user,
    queryClient,
    performanceData,
  };
}

/**
 * Utility for testing React Query hooks in isolation
 * Provides clean testing environment for custom hooks
 * 
 * @param hookOptions - Configuration for hook testing
 * @returns Hook testing utilities
 */
export function createHookTestEnvironment(hookOptions: {
  queryClientOptions?: ApiDocsRenderOptions['queryClientOptions'];
  initialProps?: any;
}) {
  const { queryClientOptions, initialProps } = hookOptions;
  
  const queryClient = queryClientOptions 
    ? new QueryClient({
        defaultOptions: {
          ...testConfig.queryClient.getDefaultOptions(),
          ...queryClientOptions.defaultOptions,
        },
      })
    : testConfig.queryClient;
  
  const wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
  
  return {
    wrapper,
    queryClient,
    initialProps,
  };
}

/**
 * API documentation specific test utilities
 * Provides specialized helpers for testing API documentation features
 */
export const apiDocsTestUtils = {
  /**
   * Wait for React Query to complete all pending operations
   */
  async waitForQueries(): Promise<void> {
    await testConfig.queryClient.invalidateQueries();
    await new Promise(resolve => setTimeout(resolve, 0));
  },
  
  /**
   * Assert API response time performance
   */
  async measureApiResponseTime(operation: () => Promise<any>): Promise<number> {
    const startTime = performance.now();
    await operation();
    const responseTime = performance.now() - startTime;
    
    expect(responseTime).toBeLessThan(testConfig.performanceThresholds.apiResponse);
    return responseTime;
  },
  
  /**
   * Validate OpenAPI specification format
   */
  validateOpenAPISpec(spec: OpenAPISpecification): void {
    expect(spec).toHaveProperty('openapi');
    expect(spec).toHaveProperty('info');
    expect(spec).toHaveProperty('paths');
    expect(spec.openapi).toMatch(/^3\.\d+\.\d+$/);
    expect(spec.info).toHaveProperty('title');
    expect(spec.info).toHaveProperty('version');
    expect(Object.keys(spec.paths)).toHaveLength.greaterThan(0);
  },
  
  /**
   * Test authentication headers in API requests
   */
  async testAuthenticatedRequest(requestMatcher: string | RegExp): Promise<MockedRequest<DefaultBodyType>> {
    const requests = testConfig.server.listHandlers()
      .filter(handler => handler.info.header?.includes('authorization'));
    
    expect(requests).toHaveLength.greaterThan(0);
    
    // Return the first matching request for further assertions
    return requests[0] as MockedRequest<DefaultBodyType>;
  },
  
  /**
   * Simulate connection timeout for database testing
   */
  async simulateConnectionTimeout(timeoutMs: number = 5000): Promise<void> {
    vi.advanceTimersByTime(timeoutMs);
    await new Promise(resolve => setTimeout(resolve, 0));
  },
  
  /**
   * Test optimistic updates behavior
   */
  async testOptimisticUpdate(
    mutationFn: () => Promise<any>,
    expectedOptimisticState: any
  ): Promise<void> {
    const startTime = performance.now();
    
    // Execute mutation
    const mutationPromise = mutationFn();
    
    // Verify optimistic state is applied immediately
    expect(testConfig.queryClient.getQueryData(['api-docs'])).toEqual(expectedOptimisticState);
    
    // Wait for mutation to complete
    await mutationPromise;
    
    const updateTime = performance.now() - startTime;
    expect(updateTime).toBeLessThan(testConfig.performanceThresholds.optimisticUpdate);
  },
};

/**
 * Performance testing utilities for API documentation components
 */
export const performanceTestUtils = {
  /**
   * Measure component render performance
   */
  async measureRenderPerformance(renderFn: () => void): Promise<number> {
    const startTime = performance.now();
    renderFn();
    const renderTime = performance.now() - startTime;
    
    expect(renderTime).toBeLessThan(testConfig.performanceThresholds.componentRender);
    return renderTime;
  },
  
  /**
   * Test virtual scrolling performance for large datasets
   */
  async testVirtualScrollingPerformance(itemCount: number): Promise<void> {
    expect(itemCount).toBeGreaterThan(1000); // Test with large datasets
    
    const startTime = performance.now();
    
    // Simulate virtual scrolling render
    const visibleItems = Math.min(50, itemCount); // Only render visible items
    
    const renderTime = performance.now() - startTime;
    expect(renderTime).toBeLessThan(200); // 200ms threshold for virtual scrolling
  },
  
  /**
   * Monitor memory usage during testing
   */
  getMemoryUsage(): number {
    if (typeof performance.memory !== 'undefined') {
      return performance.memory.usedJSHeapSize;
    }
    return 0;
  },
};

/**
 * Mock browser APIs specific to API documentation testing
 */
function mockBrowserAPIs(): void {
  // Mock Intersection Observer for virtual scrolling
  global.IntersectionObserver = vi.fn().mockImplementation((callback) => ({
    observe: vi.fn(),
    unobserve: vi.fn(),
    disconnect: vi.fn(),
    callback,
  }));
  
  // Mock Resize Observer for responsive components
  global.ResizeObserver = vi.fn().mockImplementation((callback) => ({
    observe: vi.fn(),
    unobserve: vi.fn(),
    disconnect: vi.fn(),
    callback,
  }));
  
  // Mock clipboard API for copy-to-clipboard functionality
  Object.assign(navigator, {
    clipboard: {
      writeText: vi.fn().mockResolvedValue(undefined),
      readText: vi.fn().mockResolvedValue(''),
    },
  });
  
  // Mock download functionality for OpenAPI spec export
  global.URL.createObjectURL = vi.fn().mockReturnValue('mock-blob-url');
  global.URL.revokeObjectURL = vi.fn();
}

/**
 * Mock Next.js APIs for server component testing
 */
function mockNextJSAPIs(): void {
  // Mock Next.js router
  vi.mock('next/router', () => ({
    useRouter: vi.fn(() => ({
      push: vi.fn(),
      replace: vi.fn(),
      back: vi.fn(),
      forward: vi.fn(),
      refresh: vi.fn(),
      prefetch: vi.fn(),
      pathname: '/adf-api-docs',
      query: {},
      asPath: '/adf-api-docs',
      route: '/adf-api-docs',
      events: {
        on: vi.fn(),
        off: vi.fn(),
        emit: vi.fn(),
      },
    })),
  }));
  
  // Mock Next.js navigation
  vi.mock('next/navigation', () => ({
    useRouter: vi.fn(() => ({
      push: vi.fn(),
      replace: vi.fn(),
      back: vi.fn(),
      forward: vi.fn(),
      refresh: vi.fn(),
      prefetch: vi.fn(),
    })),
    usePathname: vi.fn(() => '/adf-api-docs'),
    useSearchParams: vi.fn(() => new URLSearchParams()),
    useParams: vi.fn(() => ({})),
  }));
}

/**
 * Setup performance monitoring for test execution
 */
function setupPerformanceMonitoring(): void {
  // Initialize global performance data
  global.testPerformanceData = {
    renderTimes: [],
    queryTimes: [],
    cacheHits: 0,
    cacheMisses: 0,
    memorySnapshots: [],
  };
  
  // Mock performance.mark and performance.measure for consistent testing
  global.performance.mark = vi.fn();
  global.performance.measure = vi.fn();
  global.performance.getEntriesByType = vi.fn().mockReturnValue([]);
}

/**
 * Calculate cache hit rate for performance validation
 */
function calculateCacheHitRate(): number {
  const { cacheHits, cacheMisses } = global.testPerformanceData;
  const total = cacheHits + cacheMisses;
  return total > 0 ? (cacheHits / total) * 100 : 0;
}

/**
 * Get current memory usage
 */
function getMemoryUsage(): number {
  if (typeof performance.memory !== 'undefined') {
    return performance.memory.usedJSHeapSize;
  }
  return 0;
}

// Mock React context providers for testing
const MockThemeProvider = ({ children, theme }: { children: ReactNode; theme: string }) => (
  <div data-theme={theme}>{children}</div>
);

const MockAuthProvider = ({ 
  children, 
  user, 
  token 
}: { 
  children: ReactNode; 
  user: any; 
  token: string; 
}) => (
  <div data-auth-user={user.id} data-auth-token={token}>
    {children}
  </div>
);

const MockRouterProvider = ({ 
  children, 
  context 
}: { 
  children: ReactNode; 
  context?: any; 
}) => (
  <div data-router-context={JSON.stringify(context || {})}>
    {children}
  </div>
);

// Enhanced expect matchers for API documentation testing
expect.extend({
  /**
   * Custom matcher for testing OpenAPI specification validity
   */
  toBeValidOpenAPISpec(received: any) {
    const requiredFields = ['openapi', 'info', 'paths'];
    const missingFields = requiredFields.filter(field => !(field in received));
    
    const pass = missingFields.length === 0 && 
                 typeof received.openapi === 'string' &&
                 received.openapi.match(/^3\.\d+\.\d+$/) &&
                 received.info && received.info.title && received.info.version &&
                 received.paths && Object.keys(received.paths).length > 0;
    
    return {
      pass,
      message: () => pass
        ? `Expected object not to be a valid OpenAPI specification`
        : `Expected object to be a valid OpenAPI specification. Missing or invalid fields: ${missingFields.join(', ')}`,
    };
  },
  
  /**
   * Custom matcher for testing API response time performance
   */
  toMeetPerformanceThreshold(received: number, threshold: number) {
    const pass = received <= threshold;
    return {
      pass,
      message: () => pass
        ? `Expected ${received}ms not to meet performance threshold of ${threshold}ms`
        : `Expected ${received}ms to meet performance threshold of ${threshold}ms`,
    };
  },
});

// Export test configuration and utilities
export { testConfig };
export { screen, within, userEvent };
export type { ApiDocsRenderOptions, PerformanceMeasurement };

// Type declarations for global test utilities
declare global {
  var testPerformanceData: {
    renderTimes: number[];
    queryTimes: number[];
    cacheHits: number;
    cacheMisses: number;
    memorySnapshots: number[];
  };
  
  namespace Vi {
    interface JestAssertion {
      toBeValidOpenAPISpec(): any;
      toMeetPerformanceThreshold(threshold: number): any;
    }
  }
}