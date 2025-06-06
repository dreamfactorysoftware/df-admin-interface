/**
 * Mock Router Utilities for Testing
 * 
 * Provides comprehensive mocking utilities for Next.js router functionality
 * in the DreamFactory Admin Interface React/Next.js migration testing environment.
 * These utilities enable testing of components that depend on Next.js routing
 * without requiring a full Next.js application context.
 * 
 * Features:
 * - Next.js useRouter hook mocking
 * - Search params and pathname simulation
 * - Route parameter extraction
 * - Navigation history tracking
 * - Dynamic route testing support
 * - App Router compatibility
 * - Server component testing utilities
 * 
 * Compatibility:
 * - Next.js 15.1+ App Router
 * - React 19 server components
 * - Vitest testing framework
 * - React Testing Library integration
 */

import { vi, type MockedFunction } from 'vitest';
import type { AppRouterInstance } from 'next/dist/shared/lib/app-router-context.shared-runtime';

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

/**
 * Mock router configuration interface
 */
export interface MockRouterConfig {
  pathname?: string;
  query?: Record<string, string | string[]>;
  asPath?: string;
  route?: string;
  basePath?: string;
  locale?: string;
  locales?: string[];
  defaultLocale?: string;
  isReady?: boolean;
  isPreview?: boolean;
}

/**
 * Mock search params configuration
 */
export interface MockSearchParamsConfig {
  [key: string]: string | string[] | undefined;
}

/**
 * Mock router instance type
 */
export interface MockRouter {
  push: MockedFunction<any>;
  replace: MockedFunction<any>;
  prefetch: MockedFunction<any>;
  back: MockedFunction<any>;
  forward: MockedFunction<any>;
  refresh: MockedFunction<any>;
  pathname: string;
  query: Record<string, string | string[]>;
  asPath: string;
  route: string;
  basePath: string;
  locale?: string;
  locales?: string[];
  defaultLocale?: string;
  isReady: boolean;
  isPreview: boolean;
  events: {
    on: MockedFunction<any>;
    off: MockedFunction<any>;
    emit: MockedFunction<any>;
  };
}

/**
 * Navigation history entry
 */
export interface NavigationHistoryEntry {
  type: 'push' | 'replace' | 'back' | 'forward' | 'refresh';
  url?: string;
  options?: any;
  timestamp: number;
}

// ============================================================================
// GLOBAL MOCK STATE
// ============================================================================

/**
 * Global navigation history for testing
 */
let navigationHistory: NavigationHistoryEntry[] = [];

/**
 * Current mock router state
 */
let currentMockRouter: MockRouter | null = null;

// ============================================================================
// MOCK ROUTER CREATION
// ============================================================================

/**
 * Create a mock Next.js router instance
 * 
 * Provides a comprehensive mock of the Next.js router with all standard
 * methods and properties for testing component routing behavior.
 */
export const createMockRouter = (config: MockRouterConfig = {}): MockRouter => {
  const defaultConfig: Required<MockRouterConfig> = {
    pathname: '/',
    query: {},
    asPath: '/',
    route: '/',
    basePath: '',
    locale: 'en',
    locales: ['en'],
    defaultLocale: 'en',
    isReady: true,
    isPreview: false,
  };

  const routerConfig = { ...defaultConfig, ...config };

  // Create mock navigation functions with history tracking
  const push = vi.fn(async (url: string, as?: string, options?: any) => {
    navigationHistory.push({
      type: 'push',
      url,
      options,
      timestamp: Date.now(),
    });
    
    // Update current router state
    if (currentMockRouter) {
      const newUrl = new URL(url, 'http://localhost');
      currentMockRouter.pathname = newUrl.pathname;
      currentMockRouter.asPath = url;
      
      // Parse query parameters
      const query: Record<string, string | string[]> = {};
      newUrl.searchParams.forEach((value, key) => {
        if (query[key]) {
          // Convert to array if multiple values
          if (Array.isArray(query[key])) {
            (query[key] as string[]).push(value);
          } else {
            query[key] = [query[key] as string, value];
          }
        } else {
          query[key] = value;
        }
      });
      currentMockRouter.query = query;
    }
    
    return Promise.resolve(true);
  });

  const replace = vi.fn(async (url: string, as?: string, options?: any) => {
    navigationHistory.push({
      type: 'replace',
      url,
      options,
      timestamp: Date.now(),
    });
    
    // Update current router state similar to push
    if (currentMockRouter) {
      const newUrl = new URL(url, 'http://localhost');
      currentMockRouter.pathname = newUrl.pathname;
      currentMockRouter.asPath = url;
    }
    
    return Promise.resolve(true);
  });

  const prefetch = vi.fn(async (url: string, as?: string, options?: any) => {
    // Prefetch doesn't navigate, just simulate the call
    return Promise.resolve();
  });

  const back = vi.fn(() => {
    navigationHistory.push({
      type: 'back',
      timestamp: Date.now(),
    });
  });

  const forward = vi.fn(() => {
    navigationHistory.push({
      type: 'forward',
      timestamp: Date.now(),
    });
  });

  const refresh = vi.fn(() => {
    navigationHistory.push({
      type: 'refresh',
      timestamp: Date.now(),
    });
  });

  // Create mock events system
  const events = {
    on: vi.fn(),
    off: vi.fn(),
    emit: vi.fn(),
  };

  const mockRouter: MockRouter = {
    push,
    replace,
    prefetch,
    back,
    forward,
    refresh,
    pathname: routerConfig.pathname,
    query: routerConfig.query,
    asPath: routerConfig.asPath,
    route: routerConfig.route,
    basePath: routerConfig.basePath,
    locale: routerConfig.locale,
    locales: routerConfig.locales,
    defaultLocale: routerConfig.defaultLocale,
    isReady: routerConfig.isReady,
    isPreview: routerConfig.isPreview,
    events,
  };

  currentMockRouter = mockRouter;
  return mockRouter;
};

// ============================================================================
// SEARCH PARAMS MOCKING
// ============================================================================

/**
 * Create mock search params for testing
 * 
 * Simulates the Next.js useSearchParams hook functionality
 * for testing components that depend on URL search parameters.
 */
export const createMockSearchParams = (params: MockSearchParamsConfig = {}): URLSearchParams => {
  const searchParams = new URLSearchParams();
  
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined) {
      if (Array.isArray(value)) {
        value.forEach(v => searchParams.append(key, v));
      } else {
        searchParams.set(key, value);
      }
    }
  });
  
  return searchParams;
};

/**
 * Create mock pathname for testing
 * 
 * Simulates the Next.js usePathname hook functionality
 */
export const createMockPathname = (pathname: string = '/'): string => {
  return pathname;
};

/**
 * Create mock params for dynamic routes
 * 
 * Simulates the Next.js useParams hook functionality for
 * testing components with dynamic route parameters.
 */
export const createMockParams = (params: Record<string, string | string[]> = {}): Record<string, string | string[]> => {
  return params;
};

// ============================================================================
// APP ROUTER MOCKING
// ============================================================================

/**
 * Create mock App Router instance
 * 
 * Provides mocking for the Next.js 15.1+ App Router functionality
 * including server component navigation methods.
 */
export const createMockAppRouter = (config: MockRouterConfig = {}): AppRouterInstance => {
  const mockRouter = createMockRouter(config);
  
  return {
    push: mockRouter.push,
    replace: mockRouter.replace,
    prefetch: mockRouter.prefetch,
    back: mockRouter.back,
    forward: mockRouter.forward,
    refresh: mockRouter.refresh,
  } as AppRouterInstance;
};

// ============================================================================
// HOOK MOCKING UTILITIES
// ============================================================================

/**
 * Mock the useRouter hook
 * 
 * Sets up comprehensive mocking for the Next.js useRouter hook
 * with customizable router configuration.
 */
export const mockUseRouter = (config: MockRouterConfig = {}) => {
  const mockRouter = createMockRouter(config);
  
  vi.mock('next/navigation', async () => {
    const actual = await vi.importActual('next/navigation');
    return {
      ...actual,
      useRouter: vi.fn(() => mockRouter),
    };
  });
  
  return mockRouter;
};

/**
 * Mock the useSearchParams hook
 * 
 * Sets up mocking for the Next.js useSearchParams hook
 * with customizable search parameters.
 */
export const mockUseSearchParams = (params: MockSearchParamsConfig = {}) => {
  const mockSearchParams = createMockSearchParams(params);
  
  vi.mock('next/navigation', async () => {
    const actual = await vi.importActual('next/navigation');
    return {
      ...actual,
      useSearchParams: vi.fn(() => mockSearchParams),
    };
  });
  
  return mockSearchParams;
};

/**
 * Mock the usePathname hook
 * 
 * Sets up mocking for the Next.js usePathname hook
 * with customizable pathname value.
 */
export const mockUsePathname = (pathname: string = '/') => {
  vi.mock('next/navigation', async () => {
    const actual = await vi.importActual('next/navigation');
    return {
      ...actual,
      usePathname: vi.fn(() => pathname),
    };
  });
  
  return pathname;
};

/**
 * Mock the useParams hook
 * 
 * Sets up mocking for the Next.js useParams hook
 * with customizable route parameters.
 */
export const mockUseParams = (params: Record<string, string | string[]> = {}) => {
  vi.mock('next/navigation', async () => {
    const actual = await vi.importActual('next/navigation');
    return {
      ...actual,
      useParams: vi.fn(() => params),
    };
  });
  
  return params;
};

// ============================================================================
// NAVIGATION TESTING UTILITIES
// ============================================================================

/**
 * Get navigation history for testing
 * 
 * Returns the complete navigation history for assertions
 * in integration tests.
 */
export const getNavigationHistory = (): NavigationHistoryEntry[] => {
  return [...navigationHistory];
};

/**
 * Clear navigation history
 * 
 * Resets the navigation history for clean test isolation.
 */
export const clearNavigationHistory = (): void => {
  navigationHistory = [];
};

/**
 * Get last navigation entry
 * 
 * Returns the most recent navigation action for testing.
 */
export const getLastNavigation = (): NavigationHistoryEntry | undefined => {
  return navigationHistory[navigationHistory.length - 1];
};

/**
 * Assert navigation occurred
 * 
 * Helper function to assert that a specific navigation action occurred.
 */
export const assertNavigationOccurred = (
  type: NavigationHistoryEntry['type'],
  url?: string
): boolean => {
  const lastNav = getLastNavigation();
  if (!lastNav || lastNav.type !== type) {
    return false;
  }
  
  if (url && lastNav.url !== url) {
    return false;
  }
  
  return true;
};

/**
 * Wait for navigation to complete
 * 
 * Helper function for async navigation testing.
 */
export const waitForNavigation = async (timeout: number = 1000): Promise<NavigationHistoryEntry> => {
  const startTime = Date.now();
  const initialCount = navigationHistory.length;
  
  return new Promise((resolve, reject) => {
    const checkInterval = setInterval(() => {
      if (navigationHistory.length > initialCount) {
        clearInterval(checkInterval);
        resolve(getLastNavigation()!);
      } else if (Date.now() - startTime > timeout) {
        clearInterval(checkInterval);
        reject(new Error('Navigation timeout'));
      }
    }, 10);
  });
};

// ============================================================================
// ROUTE TESTING UTILITIES
// ============================================================================

/**
 * Create mock route context
 * 
 * Sets up a complete route context for testing components
 * that depend on route information.
 */
export const createMockRouteContext = (config: {
  pathname?: string;
  searchParams?: MockSearchParamsConfig;
  params?: Record<string, string | string[]>;
}) => {
  const { pathname = '/', searchParams = {}, params = {} } = config;
  
  return {
    router: createMockRouter({ pathname }),
    searchParams: createMockSearchParams(searchParams),
    pathname,
    params,
  };
};

/**
 * Mock dynamic route scenarios
 * 
 * Provides common dynamic route testing scenarios
 * for comprehensive route testing.
 */
export const createDynamicRouteScenarios = () => {
  return {
    // Single dynamic parameter
    userProfile: createMockRouteContext({
      pathname: '/users/[id]',
      params: { id: '123' },
    }),
    
    // Multiple dynamic parameters
    nestedResource: createMockRouteContext({
      pathname: '/api/[service]/[resource]',
      params: { service: 'database', resource: 'users' },
    }),
    
    // Catch-all route
    apiCatchAll: createMockRouteContext({
      pathname: '/api/[...slug]',
      params: { slug: ['v2', 'system', 'cors'] },
    }),
    
    // Optional catch-all route
    optionalCatchAll: createMockRouteContext({
      pathname: '/docs/[[...slug]]',
      params: { slug: ['getting-started'] },
    }),
    
    // Route with search params
    corsManagement: createMockRouteContext({
      pathname: '/adf-config/df-cors',
      searchParams: { page: '1', limit: '25', filter: 'enabled' },
    }),
    
    // Edit route scenario
    corsEdit: createMockRouteContext({
      pathname: '/adf-config/df-cors/[id]',
      params: { id: '123' },
      searchParams: { mode: 'edit' },
    }),
  };
};

// ============================================================================
// CLEANUP UTILITIES
// ============================================================================

/**
 * Reset all router mocks
 * 
 * Cleans up all router mocks and resets state for test isolation.
 */
export const resetRouterMocks = (): void => {
  clearNavigationHistory();
  currentMockRouter = null;
  vi.clearAllMocks();
};

/**
 * Restore router mocks
 * 
 * Restores original Next.js router functionality after testing.
 */
export const restoreRouterMocks = (): void => {
  resetRouterMocks();
  vi.restoreAllMocks();
};

// ============================================================================
// EXPORTS
// ============================================================================

export default {
  createMockRouter,
  createMockSearchParams,
  createMockPathname,
  createMockParams,
  createMockAppRouter,
  mockUseRouter,
  mockUseSearchParams,
  mockUsePathname,
  mockUseParams,
  getNavigationHistory,
  clearNavigationHistory,
  getLastNavigation,
  assertNavigationOccurred,
  waitForNavigation,
  createMockRouteContext,
  createDynamicRouteScenarios,
  resetRouterMocks,
  restoreRouterMocks,
};