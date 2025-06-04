/**
 * OpenAPI Preview Test Setup Utilities
 * 
 * Comprehensive Vitest test configuration and setup utilities for the OpenAPI preview test suite.
 * Configures MSW server integration, React Query client setup, global test utilities, and mock 
 * providers for consistent testing environment across all OpenAPI preview component tests.
 * 
 * This implementation follows Section 3.6 Development & Deployment requirements for Vitest testing
 * framework with native TypeScript support, MSW integration for comprehensive testing automation,
 * and React Query testing configuration for isolated frontend testing.
 * 
 * @fileoverview Vitest test configuration for OpenAPI preview testing suite
 * @version 1.0.0
 * @since React 19.0.0, Next.js 15.1.0, Vitest 2.1.0
 */

import { beforeAll, afterEach, afterAll, expect, vi, type MockInstance } from 'vitest';
import { cleanup } from '@testing-library/react';
import { setupServer } from 'msw/node';
import { QueryClient, QueryCache, MutationCache } from '@tanstack/react-query';
import type { ReactElement, ReactWrapper } from 'react';

// Import OpenAPI preview specific types and schemas
import type {
  OpenAPISpecification,
  OpenAPIPreviewProps,
  SwaggerUIConfig,
  ApiKeyInfo,
  ServiceInfo,
  ApiTestResult,
  ApiCallInfo,
  ValidationError,
} from '../types';

import {
  OpenAPISpecificationSchema,
  OpenAPIPreviewPropsSchema,
  SwaggerUIConfigSchema,
  ApiKeyInfoSchema,
  ServiceInfoSchema,
} from '../types';

// ============================================================================
// Mock Server Configuration
// ============================================================================

/**
 * OpenAPI preview specific MSW handlers
 * These handlers will be imported from the msw-handlers.ts file once it's created
 */
const openApiPreviewHandlers: any[] = [
  // Placeholder for handlers - will be replaced with actual imports
  // Example structure for future handlers:
  // rest.get('/api/v2/system/service/:serviceId/openapi', openApiSpecHandler),
  // rest.post('/api/v2/system/service/:serviceId/test', apiTestHandler),
  // rest.get('/api/v2/system/service/:serviceId/documentation', docsHandler),
];

/**
 * MSW server instance configured for OpenAPI preview testing
 * Provides realistic API mocking during test execution per Section 3.6 Enhanced Testing Pipeline
 */
export const mockServer = setupServer(...openApiPreviewHandlers);

/**
 * Global MSW server setup for OpenAPI preview tests
 * Initializes request interception before tests and ensures cleanup after completion
 */
export function setupMockServer(): void {
  beforeAll(() => {
    // Start MSW server to intercept network requests
    mockServer.listen({
      onUnhandledRequest: 'warn', // Warn about unhandled requests during development
    });
  });

  afterEach(() => {
    // Reset handlers after each test to ensure test isolation
    mockServer.resetHandlers();
  });

  afterAll(() => {
    // Close MSW server after all tests complete
    mockServer.close();
  });
}

// ============================================================================
// React Query Test Client Configuration
// ============================================================================

/**
 * Query cache configuration for OpenAPI preview testing
 * Provides isolated cache management for each test run
 */
function createTestQueryCache(): QueryCache {
  return new QueryCache({
    onError: (error) => {
      // Suppress console errors during testing unless specifically needed
      if (process.env.VITEST_LOG_LEVEL === 'verbose') {
        console.error('Query Cache Error:', error);
      }
    },
    onSuccess: (data) => {
      // Optional success logging for debugging
      if (process.env.VITEST_LOG_LEVEL === 'verbose') {
        console.log('Query Cache Success:', data);
      }
    },
  });
}

/**
 * Mutation cache configuration for OpenAPI preview testing
 * Handles API call mutations and testing scenarios
 */
function createTestMutationCache(): MutationCache {
  return new MutationCache({
    onError: (error) => {
      // Suppress console errors during testing unless specifically needed
      if (process.env.VITEST_LOG_LEVEL === 'verbose') {
        console.error('Mutation Cache Error:', error);
      }
    },
    onSuccess: (data) => {
      // Optional success logging for debugging
      if (process.env.VITEST_LOG_LEVEL === 'verbose') {
        console.log('Mutation Cache Success:', data);
      }
    },
  });
}

/**
 * Creates a fresh React Query client for each test
 * Ensures test isolation and prevents cache pollution between tests
 */
export function createTestQueryClient(): QueryClient {
  return new QueryClient({
    queryCache: createTestQueryCache(),
    mutationCache: createTestMutationCache(),
    defaultOptions: {
      queries: {
        // Disable retries during testing for faster execution
        retry: false,
        // Disable cache persistence during testing
        gcTime: 0,
        staleTime: 0,
        // Disable background refetching during testing
        refetchOnWindowFocus: false,
        refetchOnMount: false,
        refetchOnReconnect: false,
      },
      mutations: {
        // Disable retries during testing
        retry: false,
        // Clear cache immediately after mutations
        gcTime: 0,
      },
    },
    logger: {
      // Suppress query client logs during testing unless verbose mode
      log: process.env.VITEST_LOG_LEVEL === 'verbose' ? console.log : () => {},
      warn: process.env.VITEST_LOG_LEVEL === 'verbose' ? console.warn : () => {},
      error: process.env.VITEST_LOG_LEVEL === 'verbose' ? console.error : () => {},
    },
  });
}

/**
 * Global React Query client instance for test utilities
 * Shared across all OpenAPI preview tests for consistency
 */
let globalTestQueryClient: QueryClient;

/**
 * Gets or creates the global test query client
 * Ensures singleton pattern for test query client management
 */
export function getTestQueryClient(): QueryClient {
  if (!globalTestQueryClient) {
    globalTestQueryClient = createTestQueryClient();
  }
  return globalTestQueryClient;
}

/**
 * Resets the global test query client
 * Used between test suites to ensure complete isolation
 */
export function resetTestQueryClient(): void {
  if (globalTestQueryClient) {
    globalTestQueryClient.clear();
    globalTestQueryClient.getQueryCache().clear();
    globalTestQueryClient.getMutationCache().clear();
  }
  globalTestQueryClient = createTestQueryClient();
}

// ============================================================================
// Mock Data Factories
// ============================================================================

/**
 * Creates a mock OpenAPI specification for testing
 * Provides realistic test data for OpenAPI preview components
 */
export function createMockOpenAPISpec(overrides: Partial<OpenAPISpecification> = {}): OpenAPISpecification {
  const mockSpec: OpenAPISpecification = {
    openapi: '3.0.3',
    info: {
      title: 'Test Database API',
      description: 'Test API generated for database service testing',
      version: '1.0.0',
      'x-dreamfactory-service': 'test-db-service',
      'x-dreamfactory-generated': new Date().toISOString(),
    },
    servers: [
      {
        url: 'http://localhost:3000/api/v2',
        description: 'Test Development Server',
      },
    ],
    paths: {
      '/test-db-service/users': {
        get: {
          tags: ['Users'],
          summary: 'Get all users',
          description: 'Retrieve a list of all users from the database',
          operationId: 'getUsers',
          parameters: [
            {
              name: 'limit',
              in: 'query',
              description: 'Maximum number of records to return',
              required: false,
              schema: { type: 'integer', minimum: 1, maximum: 1000, default: 25 },
            },
            {
              name: 'offset',
              in: 'query',
              description: 'Number of records to skip',
              required: false,
              schema: { type: 'integer', minimum: 0, default: 0 },
            },
          ],
          responses: {
            '200': {
              description: 'Successful response',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      resource: {
                        type: 'array',
                        items: {
                          type: 'object',
                          properties: {
                            id: { type: 'integer' },
                            name: { type: 'string' },
                            email: { type: 'string', format: 'email' },
                            created_at: { type: 'string', format: 'date-time' },
                          },
                        },
                      },
                      meta: {
                        type: 'object',
                        properties: {
                          count: { type: 'integer' },
                          total_count: { type: 'integer' },
                        },
                      },
                    },
                  },
                },
              },
            },
            '400': {
              description: 'Bad Request',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      error: {
                        type: 'object',
                        properties: {
                          code: { type: 'integer' },
                          message: { type: 'string' },
                        },
                      },
                    },
                  },
                },
              },
            },
          },
          'x-dreamfactory-verb': 'GET',
          'x-dreamfactory-table': 'users',
          'x-dreamfactory-cache': true,
        },
        post: {
          tags: ['Users'],
          summary: 'Create new user',
          description: 'Create a new user record in the database',
          operationId: 'createUser',
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['name', 'email'],
                  properties: {
                    name: { type: 'string', minLength: 1, maxLength: 255 },
                    email: { type: 'string', format: 'email', maxLength: 255 },
                    password: { type: 'string', minLength: 8 },
                  },
                },
              },
            },
          },
          responses: {
            '201': {
              description: 'User created successfully',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      id: { type: 'integer' },
                      name: { type: 'string' },
                      email: { type: 'string' },
                      created_at: { type: 'string', format: 'date-time' },
                    },
                  },
                },
              },
            },
            '422': {
              description: 'Validation Error',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      error: {
                        type: 'object',
                        properties: {
                          code: { type: 'integer' },
                          message: { type: 'string' },
                          details: {
                            type: 'array',
                            items: {
                              type: 'object',
                              properties: {
                                field: { type: 'string' },
                                message: { type: 'string' },
                              },
                            },
                          },
                        },
                      },
                    },
                  },
                },
              },
            },
          },
          'x-dreamfactory-verb': 'POST',
          'x-dreamfactory-table': 'users',
        },
      },
    },
    components: {
      securitySchemes: {
        'X-DreamFactory-Api-Key': {
          type: 'apiKey',
          name: 'X-DreamFactory-Api-Key',
          in: 'header',
          description: 'DreamFactory API Key for authentication',
        },
        'X-DreamFactory-Session-Token': {
          type: 'apiKey',
          name: 'X-DreamFactory-Session-Token',
          in: 'header',
          description: 'DreamFactory Session Token for user authentication',
        },
      },
    },
    security: [
      { 'X-DreamFactory-Api-Key': [] },
      { 'X-DreamFactory-Session-Token': [] },
    ],
    tags: [
      {
        name: 'Users',
        description: 'User management operations',
      },
    ],
    ...overrides,
  };

  // Validate the mock spec against the schema
  const validation = OpenAPISpecificationSchema.safeParse(mockSpec);
  if (!validation.success) {
    throw new Error(`Invalid mock OpenAPI specification: ${validation.error.message}`);
  }

  return mockSpec;
}

/**
 * Creates mock API key information for testing
 * Provides realistic API key data for authentication testing
 */
export function createMockApiKey(overrides: Partial<ApiKeyInfo> = {}): ApiKeyInfo {
  const mockApiKey: ApiKeyInfo = {
    id: 'test-api-key-123',
    name: 'Test API Key',
    key: 'df-test-key-abcd1234567890efgh',
    sessionToken: 'test-session-token-xyz789',
    createdAt: new Date().toISOString(),
    expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // 24 hours from now
    permissions: [
      {
        resource: 'test-db-service/*',
        actions: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
      },
      {
        resource: 'system/service/*',
        actions: ['GET'],
      },
    ],
    isActive: true,
    lastUsed: new Date().toISOString(),
    usageCount: 42,
    rateLimit: {
      requestsPerMinute: 100,
      requestsPerHour: 1000,
      requestsPerDay: 10000,
      burstLimit: 20,
    },
    ...overrides,
  };

  // Validate the mock API key against the schema
  const validation = ApiKeyInfoSchema.safeParse(mockApiKey);
  if (!validation.success) {
    throw new Error(`Invalid mock API key: ${validation.error.message}`);
  }

  return mockApiKey;
}

/**
 * Creates mock service information for testing
 * Provides realistic service data for database service testing
 */
export function createMockServiceInfo(overrides: Partial<ServiceInfo> = {}): ServiceInfo {
  const mockService: ServiceInfo = {
    id: 1,
    name: 'test-db-service',
    label: 'Test Database Service',
    description: 'Test database service for unit testing',
    type: 'mysql',
    isActive: true,
    mutable: true,
    deletable: true,
    createdDate: new Date().toISOString(),
    lastModifiedDate: new Date().toISOString(),
    config: {
      host: 'localhost',
      port: 3306,
      database: 'test_db',
      username: 'test_user',
      password: '********',
      generateDocs: true,
      includeExamples: true,
      authenticationRequired: true,
      corsEnabled: true,
      cacheEnabled: true,
      rateLimitEnabled: false,
    },
    apiDocumentation: {
      hasDocumentation: true,
      documentationUrl: '/api-docs/test-db-service',
      swaggerUrl: '/api-docs/test-db-service/swagger.json',
      lastGenerated: new Date().toISOString(),
      version: '1.0.0',
      endpointCount: 24,
    },
    openApiSpec: createMockOpenAPISpec(),
    endpoints: [
      {
        path: '/test-db-service/users',
        method: 'GET',
        operationId: 'getUsers',
        summary: 'Get all users',
        description: 'Retrieve a list of all users from the database',
        tags: ['Users'],
        authenticated: true,
        deprecated: false,
      },
      {
        path: '/test-db-service/users',
        method: 'POST',
        operationId: 'createUser',
        summary: 'Create new user',
        description: 'Create a new user record in the database',
        tags: ['Users'],
        authenticated: true,
        deprecated: false,
      },
    ],
    health: {
      status: 'healthy',
      lastChecked: new Date().toISOString(),
      responseTime: 45,
      uptime: 99.99,
      errorRate: 0.001,
      details: {
        connectionPool: 'healthy',
        diskSpace: 'sufficient',
        memoryUsage: 'normal',
      },
    },
    ...overrides,
  };

  // Validate the mock service info against the schema
  const validation = ServiceInfoSchema.safeParse(mockService);
  if (!validation.success) {
    throw new Error(`Invalid mock service info: ${validation.error.message}`);
  }

  return mockService;
}

/**
 * Creates mock API test result for testing
 * Provides realistic test result data for API testing scenarios
 */
export function createMockApiTestResult(overrides: Partial<ApiTestResult> = {}): ApiTestResult {
  const mockRequest: ApiCallInfo = {
    id: 'test-call-123',
    timestamp: new Date().toISOString(),
    method: 'GET',
    url: 'http://localhost:3000/api/v2/test-db-service/users',
    headers: {
      'Content-Type': 'application/json',
      'X-DreamFactory-Api-Key': 'df-test-key-abcd1234567890efgh',
      'Accept': 'application/json',
    },
    status: 'success',
  };

  const mockResult: ApiTestResult = {
    success: true,
    duration: 234,
    request: mockRequest,
    response: {
      statusCode: 200,
      statusText: 'OK',
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
        'X-DreamFactory-Request-Id': 'req-abc123',
        'X-RateLimit-Remaining': '99',
      },
      body: {
        resource: [
          {
            id: 1,
            name: 'John Doe',
            email: 'john.doe@example.com',
            created_at: '2024-01-01T00:00:00Z',
          },
          {
            id: 2,
            name: 'Jane Smith',
            email: 'jane.smith@example.com',
            created_at: '2024-01-02T00:00:00Z',
          },
        ],
        meta: {
          count: 2,
          total_count: 2,
        },
      },
      size: 156,
      contentType: 'application/json',
    },
    performanceMetrics: {
      dnsLookup: 12,
      tcpConnect: 23,
      tlsHandshake: 45,
      timeToFirstByte: 89,
      contentDownload: 65,
      totalTime: 234,
    },
    ...overrides,
  };

  return mockResult;
}

/**
 * Creates mock validation errors for testing
 * Provides realistic validation error data for error handling testing
 */
export function createMockValidationErrors(count: number = 2): ValidationError[] {
  const errors: ValidationError[] = [];

  for (let i = 0; i < count; i++) {
    errors.push({
      path: `field_${i + 1}`,
      message: `Validation error for field ${i + 1}`,
      code: `VALIDATION_ERROR_${i + 1}`,
      severity: i === 0 ? 'error' : 'warning',
      line: i + 1,
      column: (i + 1) * 10,
    });
  }

  return errors;
}

// ============================================================================
// Test Environment Setup
// ============================================================================

/**
 * Global test environment setup for OpenAPI preview tests
 * Configures DOM cleanup, error handling, and test isolation
 */
export function setupTestEnvironment(): void {
  // Setup MSW server
  setupMockServer();

  // Configure React Testing Library cleanup
  afterEach(() => {
    cleanup();
    resetTestQueryClient();
  });

  // Configure global error handling for tests
  beforeAll(() => {
    // Mock console methods to avoid noise during tests unless verbose
    if (process.env.VITEST_LOG_LEVEL !== 'verbose') {
      vi.stubGlobal('console', {
        log: vi.fn(),
        warn: vi.fn(),
        error: vi.fn(),
        debug: vi.fn(),
        info: vi.fn(),
      });
    }

    // Mock window.matchMedia for responsive design testing
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: vi.fn().mockImplementation((query) => ({
        matches: false,
        media: query,
        onchange: null,
        addListener: vi.fn(), // Deprecated
        removeListener: vi.fn(), // Deprecated
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
      })),
    });

    // Mock ResizeObserver for virtual scrolling components
    global.ResizeObserver = vi.fn().mockImplementation(() => ({
      observe: vi.fn(),
      unobserve: vi.fn(),
      disconnect: vi.fn(),
    }));

    // Mock IntersectionObserver for lazy loading components
    global.IntersectionObserver = vi.fn().mockImplementation(() => ({
      observe: vi.fn(),
      unobserve: vi.fn(),
      disconnect: vi.fn(),
    }));

    // Mock fetch for components that might bypass MSW
    global.fetch = vi.fn();

    // Mock localStorage and sessionStorage
    const mockStorage = {
      getItem: vi.fn(),
      setItem: vi.fn(),
      removeItem: vi.fn(),
      clear: vi.fn(),
      length: 0,
      key: vi.fn(),
    };

    Object.defineProperty(window, 'localStorage', {
      value: mockStorage,
    });

    Object.defineProperty(window, 'sessionStorage', {
      value: mockStorage,
    });
  });

  // Reset all mocks after each test
  afterEach(() => {
    vi.restoreAllMocks();
  });
}

// ============================================================================
// Test Utility Functions
// ============================================================================

/**
 * Waits for React Query to settle all pending queries
 * Ensures that all async operations complete before assertions
 */
export async function waitForQueriesToSettle(queryClient: QueryClient = getTestQueryClient()): Promise<void> {
  await queryClient.refetchQueries();
  await new Promise((resolve) => setTimeout(resolve, 0));
}

/**
 * Waits for specific time duration in tests
 * Useful for testing loading states and transitions
 */
export function waitFor(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Creates a mock function with typed return value
 * Provides better TypeScript support for mock functions
 */
export function createMockFunction<T extends (...args: any[]) => any>(
  implementation?: T
): MockInstance<Parameters<T>, ReturnType<T>> {
  return vi.fn(implementation);
}

/**
 * Asserts that a value matches a Zod schema
 * Provides runtime type validation during tests
 */
export function expectToMatchSchema<T>(value: unknown, schema: any): asserts value is T {
  const result = schema.safeParse(value);
  if (!result.success) {
    throw new Error(`Value does not match schema: ${result.error.message}`);
  }
}

/**
 * Creates a spy on a specific object method
 * Useful for monitoring method calls during tests
 */
export function createMethodSpy<T extends object, K extends keyof T>(
  object: T,
  methodName: K
): MockInstance {
  return vi.spyOn(object, methodName);
}

// ============================================================================
// Performance Testing Utilities
// ============================================================================

/**
 * Measures the execution time of a function
 * Useful for performance testing and benchmarking
 */
export async function measureExecutionTime<T>(
  fn: () => Promise<T> | T
): Promise<{ result: T; duration: number }> {
  const startTime = performance.now();
  const result = await fn();
  const endTime = performance.now();
  const duration = endTime - startTime;

  return { result, duration };
}

/**
 * Asserts that an operation completes within a specified time limit
 * Ensures performance requirements are met during testing
 */
export async function expectToCompleteWithin<T>(
  fn: () => Promise<T> | T,
  maxDuration: number
): Promise<T> {
  const { result, duration } = await measureExecutionTime(fn);
  
  expect(duration).toBeLessThanOrEqual(maxDuration);
  
  return result;
}

// ============================================================================
// Accessibility Testing Utilities
// ============================================================================

/**
 * Mock for axe-core accessibility testing
 * Provides accessibility validation during component testing
 */
export const mockAxeCore = {
  run: vi.fn().mockResolvedValue({
    violations: [],
    passes: [],
    incomplete: [],
    inapplicable: [],
  }),
  configure: vi.fn(),
  reset: vi.fn(),
};

/**
 * Validates accessibility compliance for a component
 * Ensures WCAG 2.1 AA compliance during testing
 */
export async function expectToBeAccessible(element: Element): Promise<void> {
  const results = await mockAxeCore.run(element);
  expect(results.violations).toHaveLength(0);
}

// ============================================================================
// Export Configuration
// ============================================================================

/**
 * Default test configuration for OpenAPI preview tests
 * Provides standardized settings for consistent testing
 */
export const defaultTestConfig = {
  // React Query configuration
  queryClient: {
    retry: false,
    gcTime: 0,
    staleTime: 0,
    refetchOnWindowFocus: false,
  },
  
  // MSW configuration
  msw: {
    onUnhandledRequest: 'warn' as const,
  },
  
  // Performance thresholds (in milliseconds)
  performance: {
    maxRenderTime: 100,
    maxQueryTime: 1000,
    maxApiCallTime: 2000,
  },
  
  // Accessibility configuration
  accessibility: {
    level: 'AA' as const,
    tags: ['wcag2a', 'wcag2aa'],
  },
} as const;

// Export all utilities and configurations
export * from '../types';
export {
  // Test environment setup
  setupTestEnvironment,
  
  // MSW server utilities
  mockServer,
  setupMockServer,
  
  // React Query utilities
  createTestQueryClient,
  getTestQueryClient,
  resetTestQueryClient,
  waitForQueriesToSettle,
  
  // Mock data factories
  createMockOpenAPISpec,
  createMockApiKey,
  createMockServiceInfo,
  createMockApiTestResult,
  createMockValidationErrors,
  
  // Test utilities
  waitFor,
  createMockFunction,
  expectToMatchSchema,
  createMethodSpy,
  
  // Performance utilities
  measureExecutionTime,
  expectToCompleteWithin,
  
  // Accessibility utilities
  mockAxeCore,
  expectToBeAccessible,
  
  // Configuration
  defaultTestConfig,
};

/**
 * Auto-setup for OpenAPI preview tests
 * Automatically configures the test environment when this module is imported
 */
setupTestEnvironment();