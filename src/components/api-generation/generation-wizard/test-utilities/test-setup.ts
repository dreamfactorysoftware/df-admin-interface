/**
 * Vitest test configuration and setup utilities for the API generation wizard test suite.
 * 
 * Configures MSW server integration, React Query client setup, global test utilities, 
 * and mock providers for consistent testing environment across all wizard component tests.
 * 
 * Key Features:
 * - MSW server setup for API mocking during test execution per Section 4.4.2.2 Enhanced Testing Pipeline
 * - React Query test client configuration with query cache management for isolated testing
 * - Global test utilities and mock providers for wizard component testing environment
 * - Vitest configuration per Section 3.6 Development & Deployment requirements
 * 
 * Supports:
 * - F-006: API Documentation and Testing requiring MSW integration for comprehensive testing automation
 * - React/Next.js Integration Requirements for React Query and Zustand state management testing configuration
 * - Section 4.4.2.2 Enhanced Testing Pipeline requiring isolated frontend testing with mock service workers
 * - Vitest testing framework configuration with native TS support per Section 3.6 Development & Deployment
 */

import { beforeAll, afterEach, afterAll, vi, type MockedFunction } from 'vitest';
import { cleanup } from '@testing-library/react';
import { QueryClient, QueryCache, MutationCache } from '@tanstack/react-query';
import { setupServer } from 'msw/node';
import { HttpResponse, http, delay } from 'msw';

// Import types for wizard testing
import type {
  WizardState,
  DatabaseTable,
  EndpointConfiguration,
  GenerationResult,
  OpenAPISpec,
  WizardStep
} from '../types';

// =============================================================================
// MSW Server Configuration
// =============================================================================

/**
 * MSW handlers for wizard API endpoints
 * Provides realistic API mocking for development and testing scenarios
 */
export const wizardApiHandlers = [
  // Database service schema discovery
  http.get('/api/v2/:serviceName/_schema', async ({ params, request }) => {
    const { serviceName } = params;
    const url = new URL(request.url);
    const includeFields = url.searchParams.get('include_fields') === 'true';
    
    await delay(100); // Simulate realistic API response time
    
    const mockTables: DatabaseTable[] = [
      {
        name: 'users',
        label: 'User Accounts',
        description: 'System user account information',
        schema: 'public',
        rowCount: 1250,
        fields: [
          {
            name: 'id',
            dbType: 'integer',
            type: 'integer' as const,
            isNullable: false,
            isPrimaryKey: true,
            isForeignKey: false,
            isUnique: true,
            isAutoIncrement: true,
            description: 'Unique user identifier'
          },
          {
            name: 'email',
            dbType: 'varchar',
            type: 'string' as const,
            length: 255,
            isNullable: false,
            isPrimaryKey: false,
            isForeignKey: false,
            isUnique: true,
            description: 'User email address'
          },
          {
            name: 'created_at',
            dbType: 'timestamp',
            type: 'timestamp' as const,
            isNullable: false,
            isPrimaryKey: false,
            isForeignKey: false,
            isUnique: false,
            description: 'Account creation timestamp'
          }
        ],
        primaryKey: ['id'],
        foreignKeys: [],
        selected: false,
        expanded: false,
        hasExistingAPI: false
      },
      {
        name: 'orders',
        label: 'Customer Orders',
        description: 'E-commerce order transactions',
        schema: 'public',
        rowCount: 5678,
        fields: [
          {
            name: 'id',
            dbType: 'integer',
            type: 'integer' as const,
            isNullable: false,
            isPrimaryKey: true,
            isForeignKey: false,
            isUnique: true,
            isAutoIncrement: true,
            description: 'Unique order identifier'
          },
          {
            name: 'user_id',
            dbType: 'integer',
            type: 'integer' as const,
            isNullable: false,
            isPrimaryKey: false,
            isForeignKey: true,
            isUnique: false,
            description: 'Reference to user account'
          },
          {
            name: 'total_amount',
            dbType: 'decimal',
            type: 'decimal' as const,
            precision: 10,
            scale: 2,
            isNullable: false,
            isPrimaryKey: false,
            isForeignKey: false,
            isUnique: false,
            description: 'Order total amount'
          }
        ],
        primaryKey: ['id'],
        foreignKeys: [
          {
            name: 'fk_orders_user_id',
            field: 'user_id',
            referencedTable: 'users',
            referencedField: 'id',
            onDelete: 'CASCADE' as const,
            onUpdate: 'CASCADE' as const
          }
        ],
        selected: false,
        expanded: false,
        hasExistingAPI: false
      }
    ];
    
    return HttpResponse.json({
      resource: mockTables
    });
  }),

  // OpenAPI preview generation
  http.post('/api/preview/openapi/:serviceId', async ({ params, request }) => {
    const { serviceId } = params;
    const payload = await request.json() as any;
    
    await delay(200); // Simulate preview generation time
    
    const mockOpenAPISpec: OpenAPISpec = {
      openapi: '3.0.3',
      info: {
        title: `${payload.serviceName || 'Database'} API`,
        version: '1.0.0',
        description: 'Auto-generated REST API for database operations'
      },
      servers: [
        {
          url: `http://localhost:80/api/v2/${serviceId}`,
          description: 'Development server'
        }
      ],
      paths: {
        '/users': {
          get: {
            operationId: 'getUsers',
            summary: 'Get all users',
            tags: ['Users'],
            parameters: [
              {
                name: 'limit',
                in: 'query',
                description: 'Maximum number of records to return',
                required: false,
                schema: { type: 'integer', minimum: 1, maximum: 1000, default: 100 }
              }
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
                          items: { $ref: '#/components/schemas/User' }
                        }
                      }
                    }
                  }
                }
              }
            }
          },
          post: {
            operationId: 'createUser',
            summary: 'Create new user',
            tags: ['Users'],
            requestBody: {
              required: true,
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/UserInput' }
                }
              }
            },
            responses: {
              '201': {
                description: 'User created successfully',
                content: {
                  'application/json': {
                    schema: { $ref: '#/components/schemas/User' }
                  }
                }
              }
            }
          }
        }
      },
      components: {
        schemas: {
          User: {
            type: 'object',
            properties: {
              id: { type: 'integer', description: 'Unique user identifier' },
              email: { type: 'string', format: 'email', description: 'User email address' },
              created_at: { type: 'string', format: 'date-time', description: 'Account creation timestamp' }
            },
            required: ['id', 'email', 'created_at']
          },
          UserInput: {
            type: 'object',
            properties: {
              email: { type: 'string', format: 'email', description: 'User email address' }
            },
            required: ['email']
          }
        },
        securitySchemes: {
          ApiKeyAuth: {
            type: 'apiKey',
            in: 'header',
            name: 'X-DreamFactory-API-Key'
          }
        }
      },
      security: [
        { ApiKeyAuth: [] }
      ],
      tags: [
        {
          name: 'Users',
          description: 'User account operations'
        }
      ]
    };
    
    return HttpResponse.json(mockOpenAPISpec);
  }),

  // API generation execution
  http.post('/api/v2/system/service/:serviceId/generate', async ({ params, request }) => {
    const { serviceId } = params;
    const payload = await request.json() as any;
    
    // Simulate generation progress with multiple steps
    await delay(500);
    
    const generationResult: GenerationResult = {
      success: true,
      serviceId: parseInt(serviceId as string, 10),
      endpointUrls: [
        `/api/v2/${serviceId}/users`,
        `/api/v2/${serviceId}/orders`
      ],
      openApiSpec: payload.openApiSpec,
      statistics: {
        tablesProcessed: payload.tables.length,
        endpointsGenerated: payload.tables.length * 5, // 5 methods per table
        schemasCreated: payload.tables.length * 2, // Input and output schemas
        generationDuration: 1250,
        specificationSize: 15420
      },
      warnings: [],
      timestamp: new Date()
    };
    
    return HttpResponse.json(generationResult);
  }),

  // Database connection testing
  http.post('/api/v2/system/service/:serviceId/test', async ({ params }) => {
    await delay(300); // Simulate connection test time
    
    return HttpResponse.json({
      success: true,
      message: 'Database connection successful',
      latency: 45
    });
  }),

  // Error scenarios for testing
  http.get('/api/v2/test-service-error/_schema', () => {
    return HttpResponse.json(
      {
        error: {
          code: 500,
          message: 'Database connection failed',
          details: 'Unable to connect to the specified database server'
        }
      },
      { status: 500 }
    );
  }),

  http.post('/api/preview/openapi/test-preview-error', () => {
    return HttpResponse.json(
      {
        error: {
          code: 422,
          message: 'Invalid configuration',
          details: 'Selected tables contain unsupported field types'
        }
      },
      { status: 422 }
    );
  })
];

/**
 * MSW server instance for Node.js testing environment
 * Configured for Vitest test execution with comprehensive API mocking
 */
export const mswServer = setupServer(...wizardApiHandlers);

// =============================================================================
// React Query Test Configuration
// =============================================================================

/**
 * Creates a fresh React Query client for each test
 * Ensures isolated testing with clean cache state
 */
export function createTestQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: {
        // Disable retries for faster test execution
        retry: false,
        // Disable automatic refetching in tests
        refetchOnWindowFocus: false,
        refetchOnMount: false,
        refetchOnReconnect: false,
        // Set shorter stale time for testing
        staleTime: 0,
        // Disable cache time for immediate garbage collection
        gcTime: 0,
      },
      mutations: {
        // Disable retry for mutations in tests
        retry: false,
      },
    },
    queryCache: new QueryCache({
      onError: (error) => {
        // Suppress React Query errors in tests unless explicitly testing error scenarios
        if (process.env.NODE_ENV === 'test' && !process.env.TEST_ERROR_LOGGING) {
          return;
        }
        console.error('React Query Error:', error);
      },
    }),
    mutationCache: new MutationCache({
      onError: (error) => {
        // Suppress React Query mutation errors in tests
        if (process.env.NODE_ENV === 'test' && !process.env.TEST_ERROR_LOGGING) {
          return;
        }
        console.error('React Query Mutation Error:', error);
      },
    }),
  });
}

/**
 * Global test query client instance
 * Recreated before each test for isolation
 */
export let testQueryClient: QueryClient;

// =============================================================================
// Mock Data Factories
// =============================================================================

/**
 * Creates mock wizard state for testing
 */
export function createMockWizardState(overrides: Partial<WizardState> = {}): WizardState {
  return {
    currentStep: 'table-selection' as WizardStep,
    loading: false,
    error: undefined,
    generationStatus: 'idle' as const,
    serviceName: 'test-service',
    availableTables: [],
    selectedTables: [],
    endpointConfigurations: [],
    generatedSpec: undefined,
    generationProgress: 0,
    generationResult: undefined,
    validationErrors: {},
    ...overrides
  };
}

/**
 * Creates mock database table for testing
 */
export function createMockDatabaseTable(overrides: Partial<DatabaseTable> = {}): DatabaseTable {
  return {
    name: 'test_table',
    label: 'Test Table',
    description: 'A test table for unit testing',
    schema: 'public',
    rowCount: 100,
    fields: [
      {
        name: 'id',
        dbType: 'integer',
        type: 'integer' as const,
        isNullable: false,
        isPrimaryKey: true,
        isForeignKey: false,
        isUnique: true,
        isAutoIncrement: true,
        description: 'Primary key'
      },
      {
        name: 'name',
        dbType: 'varchar',
        type: 'string' as const,
        length: 255,
        isNullable: false,
        isPrimaryKey: false,
        isForeignKey: false,
        isUnique: false,
        description: 'Name field'
      }
    ],
    primaryKey: ['id'],
    foreignKeys: [],
    selected: false,
    expanded: false,
    hasExistingAPI: false,
    ...overrides
  };
}

/**
 * Creates mock endpoint configuration for testing
 */
export function createMockEndpointConfiguration(overrides: Partial<EndpointConfiguration> = {}): EndpointConfiguration {
  return {
    tableName: 'test_table',
    basePath: '/test-table',
    enabledMethods: ['GET', 'POST', 'PUT', 'DELETE'] as const,
    methodConfigurations: {
      GET: {
        enabled: true,
        parameters: [],
        responseSchema: {
          includedFields: ['id', 'name'],
          excludedFields: [],
          includeMetadata: true,
          formatOptions: {
            includeNulls: false,
            flattenNested: false,
            fieldTransforms: {}
          }
        },
        description: 'Get records',
        tags: ['test_table']
      },
      POST: {
        enabled: true,
        parameters: [],
        requestSchema: {
          contentType: 'application/json',
          requiredFields: ['name'],
          optionalFields: [],
          fieldValidations: {},
          includeAllFields: false,
          excludedFields: ['id']
        },
        responseSchema: {
          includedFields: ['id', 'name'],
          excludedFields: [],
          includeMetadata: true,
          formatOptions: {
            includeNulls: false,
            flattenNested: false,
            fieldTransforms: {}
          }
        },
        description: 'Create record',
        tags: ['test_table']
      },
      PUT: {
        enabled: true,
        parameters: [],
        requestSchema: {
          contentType: 'application/json',
          requiredFields: ['name'],
          optionalFields: [],
          fieldValidations: {},
          includeAllFields: false,
          excludedFields: []
        },
        responseSchema: {
          includedFields: ['id', 'name'],
          excludedFields: [],
          includeMetadata: true,
          formatOptions: {
            includeNulls: false,
            flattenNested: false,
            fieldTransforms: {}
          }
        },
        description: 'Update record',
        tags: ['test_table']
      },
      PATCH: {
        enabled: false,
        parameters: [],
        responseSchema: {
          includedFields: [],
          excludedFields: [],
          includeMetadata: false,
          formatOptions: {
            includeNulls: false,
            flattenNested: false,
            fieldTransforms: {}
          }
        },
        description: 'Partial update',
        tags: ['test_table']
      },
      DELETE: {
        enabled: true,
        parameters: [],
        responseSchema: {
          includedFields: ['id'],
          excludedFields: [],
          includeMetadata: true,
          formatOptions: {
            includeNulls: false,
            flattenNested: false,
            fieldTransforms: {}
          }
        },
        description: 'Delete record',
        tags: ['test_table']
      }
    },
    security: {
      requireAuth: true,
      requiredRoles: ['user'],
      apiKeyPermissions: [],
      rateLimiting: {
        requestsPerMinute: 60,
        requestsPerHour: 1000,
        requestsPerDay: 10000,
        burstAllowance: 5
      }
    },
    customParameters: [],
    enabled: true,
    ...overrides
  };
}

// =============================================================================
// Test Utilities
// =============================================================================

/**
 * Waits for React Query to complete all pending operations
 * Useful for ensuring data fetching is complete in tests
 */
export async function waitForQueryToComplete(queryClient: QueryClient, timeout = 5000): Promise<void> {
  const startTime = Date.now();
  
  while (queryClient.isFetching() > 0 || queryClient.isMutating() > 0) {
    if (Date.now() - startTime > timeout) {
      throw new Error('Timeout waiting for queries to complete');
    }
    await new Promise(resolve => setTimeout(resolve, 10));
  }
}

/**
 * Clears all React Query cache data
 * Ensures clean state between tests
 */
export function clearQueryCache(queryClient: QueryClient): void {
  queryClient.clear();
  queryClient.getQueryCache().clear();
  queryClient.getMutationCache().clear();
}

/**
 * Simulates network latency for testing loading states
 */
export function withNetworkLatency(ms = 100): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Creates a spy on console methods for testing error scenarios
 */
export function createConsoleSpy(): {
  error: MockedFunction<typeof console.error>;
  warn: MockedFunction<typeof console.warn>;
  log: MockedFunction<typeof console.log>;
  restore: () => void;
} {
  const originalError = console.error;
  const originalWarn = console.warn;
  const originalLog = console.log;
  
  const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
  const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
  const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
  
  return {
    error: errorSpy,
    warn: warnSpy,
    log: logSpy,
    restore: () => {
      console.error = originalError;
      console.warn = originalWarn;
      console.log = originalLog;
      errorSpy.mockRestore();
      warnSpy.mockRestore();
      logSpy.mockRestore();
    }
  };
}

/**
 * Validates that required DOM accessibility attributes are present
 * Supports WCAG 2.1 AA compliance testing
 */
export function validateAccessibility(element: Element): void {
  // Check for required ARIA attributes
  const interactiveElements = element.querySelectorAll('button, input, select, textarea, [role="button"], [role="tab"]');
  
  interactiveElements.forEach((el) => {
    // Buttons should have accessible names
    if (el.tagName === 'BUTTON' && !el.getAttribute('aria-label') && !el.textContent?.trim()) {
      throw new Error('Button elements must have accessible names (aria-label or text content)');
    }
    
    // Form controls should have labels
    if (['INPUT', 'SELECT', 'TEXTAREA'].includes(el.tagName)) {
      const id = el.getAttribute('id');
      const ariaLabelledBy = el.getAttribute('aria-labelledby');
      const ariaLabel = el.getAttribute('aria-label');
      
      if (!ariaLabel && !ariaLabelledBy && (!id || !element.querySelector(`label[for="${id}"]`))) {
        throw new Error('Form controls must have associated labels');
      }
    }
  });
  
  // Check for proper heading hierarchy
  const headings = Array.from(element.querySelectorAll('h1, h2, h3, h4, h5, h6'));
  if (headings.length > 1) {
    for (let i = 1; i < headings.length; i++) {
      const currentLevel = parseInt(headings[i].tagName[1], 10);
      const previousLevel = parseInt(headings[i - 1].tagName[1], 10);
      
      if (currentLevel > previousLevel + 1) {
        throw new Error('Heading levels should not skip (e.g., h1 to h3 without h2)');
      }
    }
  }
}

// =============================================================================
// Global Test Setup and Teardown
// =============================================================================

/**
 * Global test setup - runs once before all tests
 */
beforeAll(() => {
  // Start MSW server
  mswServer.listen({
    onUnhandledRequest: 'warn'
  });
  
  // Suppress console warnings for cleaner test output
  const originalWarn = console.warn;
  console.warn = (...args: any[]) => {
    // Suppress specific React warnings that are not relevant to tests
    const message = args[0];
    if (
      typeof message === 'string' &&
      (message.includes('Warning: ReactDOM.render is deprecated') ||
       message.includes('Warning: componentWillMount has been renamed') ||
       message.includes('Warning: componentWillReceiveProps has been renamed'))
    ) {
      return;
    }
    originalWarn(...args);
  };
});

/**
 * Setup before each test
 */
beforeAll(() => {
  // Create fresh query client for each test
  testQueryClient = createTestQueryClient();
});

/**
 * Cleanup after each test
 */
afterEach(() => {
  // Clean up React Testing Library
  cleanup();
  
  // Reset MSW handlers to default state
  mswServer.resetHandlers();
  
  // Clear React Query cache
  if (testQueryClient) {
    clearQueryCache(testQueryClient);
  }
  
  // Clear all mocks
  vi.clearAllMocks();
  
  // Reset any modified environment variables
  delete process.env.TEST_ERROR_LOGGING;
});

/**
 * Global test teardown - runs once after all tests
 */
afterAll(() => {
  // Stop MSW server
  mswServer.close();
  
  // Final cleanup of query client
  if (testQueryClient) {
    testQueryClient.clear();
  }
});

// =============================================================================
// Type Exports for Test Files
// =============================================================================

export type { MockedFunction } from 'vitest';
export type {
  WizardState,
  DatabaseTable,
  EndpointConfiguration,
  GenerationResult,
  OpenAPISpec,
  WizardStep
} from '../types';

/**
 * Test configuration interface for customizing test behavior
 */
export interface TestConfig {
  /** Whether to enable error logging in React Query */
  enableErrorLogging?: boolean;
  /** Custom MSW handlers to add to the server */
  additionalHandlers?: any[];
  /** Custom query client options */
  queryClientOptions?: Parameters<typeof QueryClient>[0];
  /** Whether to suppress console warnings */
  suppressWarnings?: boolean;
}

/**
 * Configures test environment with custom options
 */
export function configureTest(config: TestConfig = {}): void {
  if (config.enableErrorLogging) {
    process.env.TEST_ERROR_LOGGING = 'true';
  }
  
  if (config.additionalHandlers?.length) {
    mswServer.use(...config.additionalHandlers);
  }
  
  if (config.queryClientOptions && testQueryClient) {
    // Create new client with custom options
    testQueryClient = new QueryClient({
      ...createTestQueryClient().getDefaultOptions(),
      ...config.queryClientOptions
    });
  }
}

/**
 * Default export providing all test utilities in a single object
 */
const testSetup = {
  // MSW utilities
  mswServer,
  wizardApiHandlers,
  
  // React Query utilities
  createTestQueryClient,
  testQueryClient,
  waitForQueryToComplete,
  clearQueryCache,
  
  // Mock data factories
  createMockWizardState,
  createMockDatabaseTable,
  createMockEndpointConfiguration,
  
  // Test utilities
  withNetworkLatency,
  createConsoleSpy,
  validateAccessibility,
  configureTest,
  
  // Type exports
  TestConfig
} as const;

export default testSetup;