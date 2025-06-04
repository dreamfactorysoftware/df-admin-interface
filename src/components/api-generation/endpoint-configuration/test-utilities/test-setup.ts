/**
 * @fileoverview Vitest test configuration and setup utilities for the endpoint configuration test suite.
 * Configures MSW server integration, React Query client setup, global test utilities, and mock providers
 * for consistent testing environment across all endpoint configuration component tests.
 * 
 * This file implements:
 * - MSW server setup for API mocking during test execution per Section 2.4 Implementation Considerations
 * - React Query test client configuration with query cache management for isolated testing
 * - Global test utilities and mock providers for endpoint configuration components
 * - Vitest testing framework configuration with native TypeScript support per Section 3.6
 * 
 * Performance Requirements:
 * - Test suite execution < 30 seconds with Vitest parallel execution
 * - Real-time validation under 100ms for endpoint configuration testing
 * - 90%+ test coverage targets per F-006 API Documentation and Testing requirements
 * 
 * @version 1.0.0
 * @since 2024-12-19
 */

import { vi } from 'vitest';
import { QueryClient } from '@tanstack/react-query';
import { setupServer } from 'msw/node';
import { HttpResponse, http } from 'msw';
import { cleanup } from '@testing-library/react';
import { afterEach, beforeAll, afterAll, beforeEach } from 'vitest';

// Types for endpoint configuration testing
interface EndpointConfigTestContext {
  queryClient: QueryClient;
  mockServer: ReturnType<typeof setupServer>;
  resetMocks: () => void;
  clearCache: () => void;
}

interface TestEndpointConfig {
  method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  path: string;
  parameters: TestParameter[];
  security: TestSecurityScheme[];
  responses: Record<string, TestResponse>;
  validation: TestValidationRules;
}

interface TestParameter {
  name: string;
  in: 'query' | 'path' | 'header' | 'body';
  type: 'string' | 'number' | 'boolean' | 'array' | 'object';
  required: boolean;
  description?: string;
  schema?: Record<string, any>;
}

interface TestSecurityScheme {
  type: 'apiKey' | 'http' | 'oauth2' | 'openIdConnect';
  scheme?: string;
  name?: string;
  in?: 'query' | 'header' | 'cookie';
}

interface TestResponse {
  description: string;
  content: Record<string, { schema: Record<string, any> }>;
}

interface TestValidationRules {
  required: string[];
  properties: Record<string, any>;
  additionalProperties?: boolean;
}

/**
 * Default MSW handlers for endpoint configuration API endpoints
 * Provides realistic mock responses for development and testing
 */
const defaultHandlers = [
  // Endpoint configuration creation
  http.post('/api/v2/system/services/:serviceId/endpoints', ({ request, params }) => {
    return HttpResponse.json({
      success: true,
      data: {
        id: 'endpoint-123',
        serviceId: params.serviceId,
        method: 'GET',
        path: '/test-endpoint',
        parameters: [],
        security: [],
        responses: {
          '200': {
            description: 'Success Response',
            content: {
              'application/json': {
                schema: { type: 'object', properties: { success: { type: 'boolean' } } }
              }
            }
          }
        },
        validation: {
          required: [],
          properties: {}
        },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
    }, { status: 201 });
  }),

  // Endpoint configuration retrieval
  http.get('/api/v2/system/services/:serviceId/endpoints/:endpointId', ({ params }) => {
    return HttpResponse.json({
      success: true,
      data: {
        id: params.endpointId,
        serviceId: params.serviceId,
        method: 'GET',
        path: '/test-endpoint',
        parameters: [
          {
            name: 'id',
            in: 'path',
            type: 'string',
            required: true,
            description: 'Resource identifier'
          }
        ],
        security: [
          {
            type: 'apiKey',
            name: 'X-DreamFactory-API-Key',
            in: 'header'
          }
        ],
        responses: {
          '200': {
            description: 'Success Response',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean' },
                    data: { type: 'object' }
                  }
                }
              }
            }
          },
          '404': {
            description: 'Resource not found',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    error: { type: 'string' },
                    code: { type: 'integer' }
                  }
                }
              }
            }
          }
        },
        validation: {
          required: ['id'],
          properties: {
            id: { type: 'string', minLength: 1 }
          }
        },
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z'
      }
    });
  }),

  // Endpoint configuration update
  http.put('/api/v2/system/services/:serviceId/endpoints/:endpointId', ({ request, params }) => {
    return HttpResponse.json({
      success: true,
      data: {
        id: params.endpointId,
        serviceId: params.serviceId,
        updatedAt: new Date().toISOString()
      }
    });
  }),

  // Endpoint configuration deletion
  http.delete('/api/v2/system/services/:serviceId/endpoints/:endpointId', ({ params }) => {
    return HttpResponse.json({
      success: true,
      data: {
        id: params.endpointId,
        deleted: true
      }
    });
  }),

  // Endpoint validation
  http.post('/api/v2/system/services/:serviceId/endpoints/:endpointId/validate', ({ request, params }) => {
    return HttpResponse.json({
      success: true,
      data: {
        valid: true,
        errors: [],
        warnings: []
      }
    });
  }),

  // OpenAPI specification generation
  http.get('/api/v2/system/services/:serviceId/openapi', ({ params }) => {
    return HttpResponse.json({
      openapi: '3.0.0',
      info: {
        title: `Service ${params.serviceId} API`,
        version: '1.0.0',
        description: 'Generated API documentation'
      },
      servers: [
        { url: '/api/v2', description: 'DreamFactory API Server' }
      ],
      paths: {},
      components: {
        securitySchemes: {
          ApiKeyAuth: {
            type: 'apiKey',
            in: 'header',
            name: 'X-DreamFactory-API-Key'
          }
        }
      }
    });
  }),

  // Security schemes endpoint
  http.get('/api/v2/system/security-schemes', () => {
    return HttpResponse.json({
      success: true,
      data: [
        {
          id: 'api-key',
          name: 'API Key Authentication',
          type: 'apiKey',
          in: 'header',
          keyName: 'X-DreamFactory-API-Key'
        },
        {
          id: 'basic-auth',
          name: 'Basic Authentication',
          type: 'http',
          scheme: 'basic'
        },
        {
          id: 'bearer-token',
          name: 'Bearer Token',
          type: 'http',
          scheme: 'bearer'
        }
      ]
    });
  }),

  // HTTP methods endpoint
  http.get('/api/v2/system/http-methods', () => {
    return HttpResponse.json({
      success: true,
      data: [
        { method: 'GET', description: 'Retrieve resources' },
        { method: 'POST', description: 'Create new resources' },
        { method: 'PUT', description: 'Update existing resources' },
        { method: 'PATCH', description: 'Partially update resources' },
        { method: 'DELETE', description: 'Delete resources' }
      ]
    });
  }),

  // Parameter types endpoint
  http.get('/api/v2/system/parameter-types', () => {
    return HttpResponse.json({
      success: true,
      data: [
        { type: 'string', description: 'Text value' },
        { type: 'number', description: 'Numeric value' },
        { type: 'integer', description: 'Integer value' },
        { type: 'boolean', description: 'Boolean value' },
        { type: 'array', description: 'Array of values' },
        { type: 'object', description: 'Object with properties' }
      ]
    });
  })
];

/**
 * Creates a test-specific React Query client with optimized settings for testing
 * Disables retries, reduces query stale time, and enables silent error handling
 */
export function createTestQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: {
        // Disable retries in tests for faster execution
        retry: false,
        // Reduce stale time for immediate cache invalidation testing
        staleTime: 0,
        // Disable garbage collection delay for immediate cleanup
        gcTime: 0,
        // Disable network refetch on window focus for consistent test behavior
        refetchOnWindowFocus: false,
        // Disable automatic background refetching
        refetchOnMount: false,
        refetchOnReconnect: false,
        // Enable error boundaries for comprehensive error testing
        throwOnError: false,
        // Reduce retry delay for faster test execution
        retryDelay: () => 10,
      },
      mutations: {
        // Disable retries for mutations in tests
        retry: false,
        // Reduce retry delay for faster test execution
        retryDelay: () => 10,
        // Enable error boundaries for mutation error testing
        throwOnError: false,
      },
    },
    // Disable logging in tests to reduce noise
    logger: {
      log: vi.fn(),
      warn: vi.fn(),
      error: vi.fn(),
    },
  });
}

/**
 * Creates MSW server instance with default handlers for endpoint configuration testing
 * Includes comprehensive API mocking for all endpoint configuration workflows
 */
export function createTestServer(additionalHandlers: Parameters<typeof setupServer>[0][] = []) {
  return setupServer(...defaultHandlers, ...additionalHandlers);
}

/**
 * Global test context for endpoint configuration component testing
 * Provides access to query client, MSW server, and utility functions
 */
let testContext: EndpointConfigTestContext;

/**
 * Initializes the test environment with MSW server and React Query client
 * Called before all tests in the endpoint configuration test suite
 */
export function setupTestEnvironment(): EndpointConfigTestContext {
  const queryClient = createTestQueryClient();
  const mockServer = createTestServer();

  testContext = {
    queryClient,
    mockServer,
    resetMocks: () => {
      vi.clearAllMocks();
      queryClient.clear();
      mockServer.resetHandlers();
    },
    clearCache: () => {
      queryClient.clear();
      queryClient.getQueryCache().clear();
      queryClient.getMutationCache().clear();
    }
  };

  return testContext;
}

/**
 * Cleans up the test environment after all tests complete
 * Stops MSW server and clears all mocks and caches
 */
export function teardownTestEnvironment(): void {
  if (testContext) {
    testContext.mockServer.close();
    testContext.queryClient.clear();
    vi.clearAllMocks();
  }
}

/**
 * Resets test state between individual tests
 * Clears query cache, resets mock handlers, and clears all mocks
 */
export function resetTestState(): void {
  if (testContext) {
    testContext.resetMocks();
    testContext.clearCache();
  }
  cleanup();
}

/**
 * Creates a mock endpoint configuration for testing
 * Provides realistic test data with configurable properties
 */
export function createMockEndpointConfig(overrides: Partial<TestEndpointConfig> = {}): TestEndpointConfig {
  return {
    method: 'GET',
    path: '/test-endpoint',
    parameters: [
      {
        name: 'id',
        in: 'path',
        type: 'string',
        required: true,
        description: 'Resource identifier'
      },
      {
        name: 'limit',
        in: 'query',
        type: 'number',
        required: false,
        description: 'Maximum number of results to return'
      }
    ],
    security: [
      {
        type: 'apiKey',
        name: 'X-DreamFactory-API-Key',
        in: 'header'
      }
    ],
    responses: {
      '200': {
        description: 'Success Response',
        content: {
          'application/json': {
            schema: {
              type: 'object',
              properties: {
                success: { type: 'boolean' },
                data: { type: 'object' }
              }
            }
          }
        }
      },
      '400': {
        description: 'Bad Request',
        content: {
          'application/json': {
            schema: {
              type: 'object',
              properties: {
                error: { type: 'string' },
                code: { type: 'integer' }
              }
            }
          }
        }
      }
    },
    validation: {
      required: ['id'],
      properties: {
        id: { type: 'string', minLength: 1 },
        limit: { type: 'number', minimum: 1, maximum: 100 }
      }
    },
    ...overrides
  };
}

/**
 * Creates mock parameter data for endpoint configuration testing
 * Supports all parameter types and locations
 */
export function createMockParameter(overrides: Partial<TestParameter> = {}): TestParameter {
  return {
    name: 'testParam',
    in: 'query',
    type: 'string',
    required: false,
    description: 'Test parameter for endpoint configuration',
    ...overrides
  };
}

/**
 * Creates mock security scheme data for endpoint configuration testing
 * Supports all security scheme types defined in OpenAPI 3.0
 */
export function createMockSecurityScheme(overrides: Partial<TestSecurityScheme> = {}): TestSecurityScheme {
  return {
    type: 'apiKey',
    name: 'X-API-Key',
    in: 'header',
    ...overrides
  };
}

/**
 * Creates mock response data for endpoint configuration testing
 * Includes realistic content types and schemas
 */
export function createMockResponse(overrides: Partial<TestResponse> = {}): TestResponse {
  return {
    description: 'Test response',
    content: {
      'application/json': {
        schema: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            data: { type: 'object' }
          }
        }
      }
    },
    ...overrides
  };
}

/**
 * Creates mock validation rules for endpoint configuration testing
 * Supports comprehensive validation scenarios
 */
export function createMockValidationRules(overrides: Partial<TestValidationRules> = {}): TestValidationRules {
  return {
    required: ['id'],
    properties: {
      id: { type: 'string', minLength: 1 }
    },
    additionalProperties: false,
    ...overrides
  };
}

/**
 * Global test setup and teardown configuration
 * Integrates with Vitest lifecycle hooks for automatic test environment management
 */

// Setup test environment before all tests
beforeAll(() => {
  const context = setupTestEnvironment();
  
  // Start MSW server with quiet logging for test output clarity
  context.mockServer.listen({
    onUnhandledRequest: 'warn'
  });
  
  // Configure console mocking for cleaner test output
  Object.defineProperty(window, 'console', {
    value: {
      ...console,
      // Silent info/debug logs in tests unless explicitly needed
      info: vi.fn(),
      debug: vi.fn(),
      // Keep error and warn for debugging test failures
      error: console.error,
      warn: console.warn,
      log: console.log
    }
  });
});

// Reset test state after each test
afterEach(() => {
  resetTestState();
});

// Cleanup test environment after all tests
afterAll(() => {
  teardownTestEnvironment();
});

// Export test context getter for use in individual tests
export function getTestContext(): EndpointConfigTestContext {
  if (!testContext) {
    throw new Error('Test context not initialized. Make sure setupTestEnvironment() is called.');
  }
  return testContext;
}

/**
 * Utility function to wait for React Query mutations to complete
 * Useful for testing async operations with proper cleanup
 */
export async function waitForMutationToComplete(queryClient: QueryClient, timeout = 5000): Promise<void> {
  const startTime = Date.now();
  
  while (queryClient.isMutating() > 0) {
    if (Date.now() - startTime > timeout) {
      throw new Error(`Mutation did not complete within ${timeout}ms`);
    }
    await new Promise(resolve => setTimeout(resolve, 10));
  }
}

/**
 * Utility function to wait for all queries to settle
 * Ensures consistent test state before assertions
 */
export async function waitForQueriesToSettle(queryClient: QueryClient, timeout = 5000): Promise<void> {
  const startTime = Date.now();
  
  while (queryClient.isFetching() > 0) {
    if (Date.now() - startTime > timeout) {
      throw new Error(`Queries did not settle within ${timeout}ms`);
    }
    await new Promise(resolve => setTimeout(resolve, 10));
  }
}

// Export types for use in test files
export type {
  EndpointConfigTestContext,
  TestEndpointConfig,
  TestParameter,
  TestSecurityScheme,
  TestResponse,
  TestValidationRules
};