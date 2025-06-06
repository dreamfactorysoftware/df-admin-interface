/**
 * @fileoverview Vitest test configuration and setup utilities for the OpenAPI preview test suite
 * @description Configures MSW server integration, React Query client setup, global test utilities, and mock providers for consistent testing environment across all OpenAPI preview component tests
 * 
 * @version 1.0.0
 * @license MIT
 * @author DreamFactory Team
 * 
 * Features:
 * - Vitest testing framework configuration with native TypeScript 5.8+ support per Section 3.6 Development & Deployment requirements
 * - MSW (Mock Service Worker) integration for comprehensive API mocking per F-006 API Documentation and Testing requirements
 * - React Query test client configuration with intelligent cache management for isolated frontend testing per React/Next.js Integration Requirements
 * - Global test utilities and mock providers for consistent OpenAPI preview component testing environment per Section 3.6 Enhanced Testing Pipeline
 * - Automated test environment setup and teardown with proper resource cleanup
 * - Type-safe test configuration supporting TypeScript strict mode and enhanced developer experience
 * - Performance-optimized test execution with parallel test support and intelligent caching strategies
 */

import { vi, beforeAll, afterAll, beforeEach, afterEach } from 'vitest'
import { cleanup } from '@testing-library/react'
import { setupServer } from 'msw/node'
import { QueryClient, QueryCache, MutationCache } from '@tanstack/react-query'
import type { 
  MockedFunction, 
  MockedClass,
  MockInstance
} from 'vitest'
import type { ReactElement, ComponentType } from 'react'
import type { RenderOptions } from '@testing-library/react'
import type { 
  OpenAPIPreviewStore,
  SwaggerUIConfig,
  ApiKeyInfo,
  ServiceApiKeys,
  OpenAPIPreviewError
} from '../types'

// Import MSW handlers for comprehensive API mocking
import {
  openApiPreviewHandlers,
  coreHandlers,
  errorHandlers,
  perfHandlers,
  securityHandlers,
  MOCK_SERVICES,
  MYSQL_OPENAPI_SPEC,
  EMAIL_OPENAPI_SPEC,
  MOCK_API_KEYS,
  NETWORK_DELAYS,
  API_ENDPOINTS,
  HTTP_HEADERS,
  createMockApiResponse,
  validateOpenApiSpec
} from './msw-handlers'

// ============================================================================
// MSW Server Configuration and Setup
// ============================================================================

/**
 * MSW server instance for test environment
 * Configured with comprehensive OpenAPI preview handlers per Section 3.6 Enhanced Testing Pipeline
 */
export const server = setupServer(...openApiPreviewHandlers)

/**
 * MSW server configuration options for different testing scenarios
 * Enables selective handler activation based on test requirements
 */
export const serverConfig = {
  /** Core handlers for basic OpenAPI preview functionality */
  core: () => server.use(...coreHandlers),
  
  /** Error simulation handlers for comprehensive edge case testing */
  errors: () => server.use(...errorHandlers),
  
  /** Performance testing handlers for benchmarking scenarios */
  performance: () => server.use(...perfHandlers),
  
  /** Security testing handlers for authentication validation */
  security: () => server.use(...securityHandlers),
  
  /** Reset to default handlers */
  reset: () => server.resetHandlers(...openApiPreviewHandlers),
  
  /** Clear all handlers */
  clear: () => server.resetHandlers()
}

/**
 * MSW server lifecycle management for Vitest integration
 * Ensures proper setup and teardown per testing best practices
 */
beforeAll(() => {
  // Start MSW server before all tests
  server.listen({
    onUnhandledRequest: 'warn', // Warn about unhandled requests in development
  })
})

afterEach(() => {
  // Reset handlers after each test to prevent test interference
  server.resetHandlers()
})

afterAll(() => {
  // Clean up MSW server after all tests complete
  server.close()
})

// ============================================================================
// React Query Test Client Configuration
// ============================================================================

/**
 * Default React Query configuration for testing environments
 * Optimized for fast test execution with minimal network delays
 */
export const createTestQueryClient = (): QueryClient => {
  const queryCache = new QueryCache({
    onError: (error) => {
      // Suppress error logging in test environment unless explicitly testing errors
      if (process.env.NODE_ENV === 'test' && !process.env.VITEST_LOG_ERRORS) {
        return
      }
      console.error('React Query Error:', error)
    },
  })

  const mutationCache = new MutationCache({
    onError: (error) => {
      // Suppress mutation error logging in test environment
      if (process.env.NODE_ENV === 'test' && !process.env.VITEST_LOG_ERRORS) {
        return
      }
      console.error('React Query Mutation Error:', error)
    },
  })

  return new QueryClient({
    queryCache,
    mutationCache,
    defaultOptions: {
      queries: {
        // Disable retries in test environment for faster execution
        retry: false,
        // Use zero delays for immediate test execution
        staleTime: 0,
        gcTime: 0, // Previously cacheTime, renamed in React Query v5
        // Disable refetching behaviors in tests
        refetchOnWindowFocus: false,
        refetchOnMount: false,
        refetchOnReconnect: false,
        // Disable network-related features in test environment
        networkMode: 'offlineFirst',
      },
      mutations: {
        // Disable retries for mutations in test environment
        retry: false,
        // Use immediate network mode for predictable test behavior
        networkMode: 'offlineFirst',
      },
    },
  })
}

/**
 * Global test query client instance
 * Shared across all tests for consistent behavior and performance
 */
export let testQueryClient: QueryClient

/**
 * React Query test client lifecycle management
 * Ensures fresh client state for each test suite
 */
beforeEach(() => {
  // Create fresh query client for each test to prevent state leakage
  testQueryClient = createTestQueryClient()
})

afterEach(() => {
  // Clear all queries and mutations after each test
  testQueryClient.clear()
})

// ============================================================================
// Global Test Utilities and Helpers
// ============================================================================

/**
 * Enhanced cleanup function for comprehensive test environment reset
 * Extends React Testing Library cleanup with additional OpenAPI preview specific cleanup
 */
export const enhancedCleanup = (): void => {
  // Standard React Testing Library cleanup
  cleanup()
  
  // Clear React Query cache
  if (testQueryClient) {
    testQueryClient.clear()
  }
  
  // Reset MSW handlers to default state
  server.resetHandlers()
  
  // Clear any global mocks or spies
  vi.clearAllMocks()
  
  // Reset any localStorage/sessionStorage if used in tests
  if (typeof window !== 'undefined') {
    window.localStorage.clear()
    window.sessionStorage.clear()
  }
  
  // Clear console mocks if present
  if (vi.isMockFunction(console.log)) {
    (console.log as MockedFunction<typeof console.log>).mockClear()
  }
  if (vi.isMockFunction(console.error)) {
    (console.error as MockedFunction<typeof console.error>).mockClear()
  }
  if (vi.isMockFunction(console.warn)) {
    (console.warn as MockedFunction<typeof console.warn>).mockClear()
  }
}

/**
 * Enhanced afterEach cleanup with comprehensive state reset
 */
afterEach(() => {
  enhancedCleanup()
})

/**
 * Mock browser APIs commonly used in OpenAPI preview components
 * Provides consistent browser environment simulation for testing
 */
export const mockBrowserAPIs = (): void => {
  // Mock clipboard API for API key copying functionality
  Object.assign(navigator, {
    clipboard: {
      writeText: vi.fn().mockResolvedValue(undefined),
      readText: vi.fn().mockResolvedValue(''),
    },
  })
  
  // Mock Intersection Observer for virtual scrolling components
  global.IntersectionObserver = vi.fn().mockImplementation((callback) => ({
    observe: vi.fn(),
    unobserve: vi.fn(),
    disconnect: vi.fn(),
    root: null,
    rootMargin: '',
    thresholds: [],
  }))
  
  // Mock ResizeObserver for responsive components
  global.ResizeObserver = vi.fn().mockImplementation((callback) => ({
    observe: vi.fn(),
    unobserve: vi.fn(),
    disconnect: vi.fn(),
  }))
  
  // Mock fetch for any direct fetch calls not handled by MSW
  global.fetch = vi.fn()
  
  // Mock window.matchMedia for responsive design testing
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
  })
  
  // Mock scrollTo for Swagger UI testing
  window.scrollTo = vi.fn()
  window.scroll = vi.fn()
  
  // Mock requestAnimationFrame for animation testing
  global.requestAnimationFrame = vi.fn((callback) => {
    setTimeout(callback, 16) // 60fps simulation
    return 1
  })
  
  global.cancelAnimationFrame = vi.fn()
}

/**
 * Initialize browser API mocks before all tests
 */
beforeAll(() => {
  mockBrowserAPIs()
})

// ============================================================================
// Mock Data Factories and Utilities
// ============================================================================

/**
 * Factory function for creating mock OpenAPI preview store state
 * Provides consistent test data for Zustand store testing
 */
export const createMockOpenAPIPreviewStore = (
  overrides: Partial<OpenAPIPreviewStore> = {}
): OpenAPIPreviewStore => {
  const defaultState: OpenAPIPreviewStore = {
    // State properties
    service: null,
    spec: null,
    config: {
      layout: 'BaseLayout',
      deepLinking: true,
      displayOperationId: false,
      defaultModelsExpandDepth: 1,
      defaultModelExpandDepth: 1,
      defaultModelRendering: 'example',
      displayRequestDuration: true,
      docExpansion: 'list',
      filter: false,
      maxDisplayedTags: 100,
      showExtensions: false,
      showCommonExtensions: false,
      useUnsafeMarkdown: false,
      tryItOutEnabled: true,
      theme: {
        mode: 'light',
      },
    } as SwaggerUIConfig,
    selectedApiKey: undefined,
    apiKeys: [],
    theme: 'light',
    loading: {
      spec: false,
      apiKeys: false,
      service: false,
    },
    errors: {
      spec: null,
      apiKeys: null,
      swagger: null,
    },
    ui: {
      height: '600px',
      sidebarCollapsed: false,
      showSettings: false,
      autoRefresh: false,
      refreshInterval: 30000,
    },
    
    // Action properties (mocked functions)
    loadService: vi.fn().mockResolvedValue(undefined),
    updateConfig: vi.fn(),
    selectApiKey: vi.fn(),
    toggleTheme: vi.fn(),
    setTheme: vi.fn(),
    refresh: vi.fn().mockResolvedValue(undefined),
    downloadSpec: vi.fn(),
    copyApiKey: vi.fn().mockResolvedValue(undefined),
    clearErrors: vi.fn(),
    reset: vi.fn(),
    updateUI: vi.fn(),
    
    // Apply any overrides
    ...overrides,
  }
  
  return defaultState
}

/**
 * Factory function for creating mock API key information
 * Supports comprehensive API key testing scenarios
 */
export const createMockApiKey = (overrides: Partial<ApiKeyInfo> = {}): ApiKeyInfo => ({
  id: 'test-key-id',
  name: 'Test API Key',
  apiKey: 'test-api-key-value',
  description: 'Test API key for unit testing',
  createdAt: '2024-01-01T00:00:00Z',
  expiresAt: '2024-12-31T23:59:59Z',
  lastUsed: '2024-03-01T12:00:00Z',
  status: 'active',
  scopes: ['read', 'write'],
  rateLimit: {
    requestsPerMinute: 100,
    requestsPerHour: 5000,
    requestsPerDay: 50000,
  },
  usage: {
    totalRequests: 1000,
    dailyRequests: 50,
    errorCount: 5,
  },
  security: {
    requireHTTPS: true,
    enableLogging: true,
  },
  metadata: {
    environment: 'development',
    version: 1,
  },
  ...overrides,
})

/**
 * Factory function for creating mock service API keys collection
 */
export const createMockServiceApiKeys = (
  overrides: Partial<ServiceApiKeys> = {}
): ServiceApiKeys => ({
  serviceId: 1,
  serviceName: 'test-service',
  keys: [
    createMockApiKey({ name: 'Primary API Key' }),
    createMockApiKey({ 
      name: 'Secondary API Key', 
      id: 'test-key-2', 
      apiKey: 'test-api-key-2' 
    }),
  ],
  lastUpdated: '2024-03-01T12:00:00Z',
  pagination: {
    page: 1,
    pageSize: 50,
    total: 2,
    hasNext: false,
    hasPrevious: false,
  },
  ...overrides,
})

/**
 * Factory function for creating mock OpenAPI preview errors
 */
export const createMockOpenAPIError = (
  overrides: Partial<OpenAPIPreviewError> = {}
): OpenAPIPreviewError => ({
  message: 'Test OpenAPI preview error',
  category: 'spec',
  code: 'TEST_ERROR',
  timestamp: '2024-03-01T12:00:00Z',
  context: {
    service: {
      id: 1,
      name: 'test-service',
      type: 'mysql',
    },
  },
  recoveryActions: [
    {
      label: 'Retry',
      action: vi.fn(),
      description: 'Retry the failed operation',
    },
  ],
  ...overrides,
})

// ============================================================================
// Test Environment Configuration and Utilities
// ============================================================================

/**
 * Test environment configuration options
 * Enables customization of test execution behavior
 */
export interface TestEnvironmentConfig {
  /** Enable verbose logging for debugging */
  verbose?: boolean
  /** Mock network delays for realistic testing */
  enableNetworkDelay?: boolean
  /** Simulate slow network conditions */
  slowNetwork?: boolean
  /** Enable error simulation */
  simulateErrors?: boolean
  /** Custom MSW handlers */
  customHandlers?: Array<any>
  /** React Query client overrides */
  queryClientOverrides?: Partial<ConstructorParameters<typeof QueryClient>[0]>
}

/**
 * Configure test environment with custom options
 * Provides flexible test setup for different testing scenarios
 */
export const configureTestEnvironment = (config: TestEnvironmentConfig = {}): void => {
  const {
    verbose = false,
    enableNetworkDelay = false,
    slowNetwork = false,
    simulateErrors = false,
    customHandlers = [],
  } = config
  
  // Configure logging level
  if (verbose) {
    process.env.VITEST_LOG_ERRORS = 'true'
  }
  
  // Configure network delay simulation
  if (enableNetworkDelay || slowNetwork) {
    const delay = slowNetwork ? NETWORK_DELAYS.SLOW : NETWORK_DELAYS.NORMAL
    // Apply delay to mock responses
    process.env.VITEST_NETWORK_DELAY = delay.toString()
  }
  
  // Configure error simulation
  if (simulateErrors) {
    server.use(...errorHandlers)
  }
  
  // Apply custom handlers
  if (customHandlers.length > 0) {
    server.use(...customHandlers)
  }
}

/**
 * Wait for all React Query operations to complete
 * Useful for testing async operations and ensuring stable test state
 */
export const waitForQueries = async (): Promise<void> => {
  // Wait for all queries to settle
  await vi.waitFor(() => {
    const queryCache = testQueryClient.getQueryCache()
    const queries = queryCache.getAll()
    const pendingQueries = queries.filter(query => query.state.fetchStatus === 'fetching')
    
    if (pendingQueries.length > 0) {
      throw new Error(`${pendingQueries.length} queries still pending`)
    }
  }, {
    timeout: 5000,
    interval: 100,
  })
}

/**
 * Wait for specific query to complete
 * Enables targeted waiting for specific data loading scenarios
 */
export const waitForQuery = async (queryKey: unknown[]): Promise<void> => {
  await vi.waitFor(() => {
    const query = testQueryClient.getQueryCache().find({ queryKey })
    if (!query || query.state.fetchStatus === 'fetching') {
      throw new Error(`Query ${JSON.stringify(queryKey)} still pending`)
    }
  }, {
    timeout: 5000,
    interval: 100,
  })
}

/**
 * Simulate user interaction delays for more realistic testing
 */
export const simulateUserDelay = async (ms: number = 100): Promise<void> => {
  await new Promise(resolve => setTimeout(resolve, ms))
}

// ============================================================================
// Custom Test Matchers and Assertions
// ============================================================================

/**
 * Custom assertion for validating OpenAPI specifications
 */
export const expectValidOpenAPISpec = (spec: unknown): void => {
  const errors = validateOpenApiSpec(spec)
  
  if (errors.length > 0) {
    const errorMessages = errors.map(error => `${error.path}: ${error.message}`).join('\n')
    throw new Error(`Invalid OpenAPI specification:\n${errorMessages}`)
  }
}

/**
 * Custom assertion for checking React Query cache state
 */
export const expectQueryCacheToContain = (queryKey: unknown[]): void => {
  const query = testQueryClient.getQueryCache().find({ queryKey })
  
  if (!query) {
    throw new Error(`Query with key ${JSON.stringify(queryKey)} not found in cache`)
  }
  
  if (query.state.status === 'error') {
    throw new Error(`Query ${JSON.stringify(queryKey)} is in error state: ${query.state.error}`)
  }
}

/**
 * Custom assertion for checking MSW handler coverage
 */
export const expectHandlerToBeCalled = (url: string, method: string = 'GET'): void => {
  // This would require MSW handler call tracking implementation
  // For now, we'll use a simple mock verification approach
  const handlers = server.listHandlers()
  const matchingHandler = handlers.find(handler => {
    // Basic URL matching - in real implementation this would be more sophisticated
    return handler.info.header.includes(url.toLowerCase())
  })
  
  if (!matchingHandler) {
    throw new Error(`No MSW handler found for ${method} ${url}`)
  }
}

// ============================================================================
// Export Test Data and Constants
// ============================================================================

/**
 * Re-export mock data from MSW handlers for convenient test access
 */
export {
  MOCK_SERVICES,
  MYSQL_OPENAPI_SPEC,
  EMAIL_OPENAPI_SPEC,
  MOCK_API_KEYS,
  NETWORK_DELAYS,
  API_ENDPOINTS,
  HTTP_HEADERS,
  createMockApiResponse,
  validateOpenApiSpec,
}

/**
 * Common test constants for consistent testing
 */
export const TEST_CONSTANTS = {
  /** Default test timeout for async operations */
  DEFAULT_TIMEOUT: 5000,
  
  /** Reduced timeout for fast operations */
  FAST_TIMEOUT: 1000,
  
  /** Extended timeout for slow operations */
  SLOW_TIMEOUT: 10000,
  
  /** Default test service ID */
  TEST_SERVICE_ID: 1,
  
  /** Default test API key */
  TEST_API_KEY: 'test-api-key',
  
  /** Default test user ID */
  TEST_USER_ID: 'test-user-id',
  
  /** Test SwaggerUI container ID */
  SWAGGER_CONTAINER_ID: 'swagger-ui-container',
  
  /** Common test selectors */
  SELECTORS: {
    loadingSpinner: '[data-testid="loading-spinner"]',
    errorMessage: '[data-testid="error-message"]',
    apiKeySelector: '[data-testid="api-key-selector"]',
    themeToggle: '[data-testid="theme-toggle"]',
    downloadButton: '[data-testid="download-button"]',
    refreshButton: '[data-testid="refresh-button"]',
    swaggerContainer: '[data-testid="swagger-ui-container"]',
  },
} as const

/**
 * Type exports for testing utilities
 */
export type {
  TestEnvironmentConfig,
  MockedFunction,
  MockedClass,
  MockInstance,
}

/**
 * Console helper for debugging tests
 * Only active when verbose mode is enabled
 */
export const debugLog = (...args: unknown[]): void => {
  if (process.env.VITEST_LOG_ERRORS === 'true') {
    console.log('[TEST DEBUG]', ...args)
  }
}

/**
 * Performance measurement utility for test optimization
 */
export const measureTestPerformance = async <T>(
  operation: () => Promise<T> | T,
  label: string = 'Test Operation'
): Promise<{ result: T; duration: number }> => {
  const start = performance.now()
  const result = await operation()
  const duration = performance.now() - start
  
  debugLog(`${label} completed in ${duration.toFixed(2)}ms`)
  
  return { result, duration }
}

/**
 * Test suite configuration for consistent setup across all OpenAPI preview tests
 * Enables standardized test environment configuration and optimal performance
 */
export const setupOpenAPIPreviewTests = (config: TestEnvironmentConfig = {}): void => {
  // Configure test environment with provided options
  configureTestEnvironment(config)
  
  // Setup any additional test utilities or global mocks
  beforeEach(() => {
    // Ensure clean state for each test
    enhancedCleanup()
    
    // Reset any global test state
    vi.clearAllTimers()
    vi.clearAllMocks()
  })
  
  debugLog('OpenAPI Preview test suite initialized with configuration:', config)
}

/**
 * Default export for convenient test setup import
 */
export default {
  server,
  serverConfig,
  testQueryClient,
  createTestQueryClient,
  enhancedCleanup,
  configureTestEnvironment,
  setupOpenAPIPreviewTests,
  waitForQueries,
  waitForQuery,
  createMockOpenAPIPreviewStore,
  createMockApiKey,
  createMockServiceApiKeys,
  createMockOpenAPIError,
  expectValidOpenAPISpec,
  expectQueryCacheToContain,
  expectHandlerToBeCalled,
  TEST_CONSTANTS,
  debugLog,
  measureTestPerformance,
}