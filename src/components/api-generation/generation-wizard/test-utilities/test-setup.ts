/**
 * Vitest Test Configuration and Setup Utilities
 * 
 * Comprehensive test configuration for the API Generation Wizard test suite, providing
 * MSW server integration, React Query client setup, global test utilities, and mock
 * providers for consistent testing environment across all wizard component tests.
 * 
 * Implements Section 3.6 Development & Deployment Vitest testing framework requirements
 * with native TypeScript support and F-006 API Documentation and Testing MSW integration
 * for comprehensive testing automation per Section 4.4.2.2 Enhanced Testing Pipeline.
 * 
 * @fileoverview Test setup utilities for API generation wizard components
 * @version 1.0.0
 * @since Vitest 2.1.0, MSW 2.0+, React Query 5.0+
 */

import { afterAll, afterEach, beforeAll, beforeEach, vi } from 'vitest';
import { cleanup } from '@testing-library/react';
import { setupServer } from 'msw/node';
import { QueryClient, QueryCache, MutationCache } from '@tanstack/react-query';
import { createStore } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';

// Internal imports
import { apiGenerationWizardHandlers } from './msw-handlers';
import type { 
  WizardState, 
  WizardActions, 
  WizardStep,
  GenerationStatus,
  DatabaseTable,
  EndpointConfiguration,
  OpenAPISpec,
  GenerationResult
} from '../types';

// ============================================================================
// MSW SERVER CONFIGURATION
// ============================================================================

/**
 * Mock Service Worker server instance for API mocking during tests
 * Implements Section 4.4.2.2 Enhanced Testing Pipeline requirements
 */
export const server = setupServer(...apiGenerationWizardHandlers);

/**
 * MSW server lifecycle management for test isolation
 */
beforeAll(() => {
  // Start MSW server before all tests
  server.listen({
    onUnhandledRequest: 'warn', // Warn about unhandled requests in tests
  });
});

afterEach(() => {
  // Reset MSW handlers after each test to ensure isolation
  server.resetHandlers();
});

afterAll(() => {
  // Clean up MSW server after all tests
  server.close();
});

// ============================================================================
// REACT QUERY TEST CLIENT CONFIGURATION
// ============================================================================

/**
 * Query cache configuration for test isolation
 */
interface TestQueryCacheConfig {
  /** Enable cache persistence across tests */
  persistent?: boolean;
  /** Default stale time for test queries */
  defaultStaleTime?: number;
  /** Default cache time for test queries */
  defaultCacheTime?: number;
  /** Enable query debugging in tests */
  debug?: boolean;
}

/**
 * Create React Query test client with optimized configuration
 * Implements React/Next.js Integration Requirements for React Query testing
 * 
 * @param config - Optional configuration for test-specific query behavior
 * @returns Configured QueryClient instance for testing
 */
export function createTestQueryClient(config: TestQueryCacheConfig = {}): QueryClient {
  const {
    persistent = false,
    defaultStaleTime = 0, // No stale time in tests for predictable behavior
    defaultCacheTime = 1000 * 60 * 5, // 5 minutes cache time
    debug = false
  } = config;

  // Create query cache with test-specific configuration
  const queryCache = new QueryCache({
    onError: debug ? (error) => console.error('Query Error:', error) : undefined,
  });

  // Create mutation cache with test-specific configuration
  const mutationCache = new MutationCache({
    onError: debug ? (error) => console.error('Mutation Error:', error) : undefined,
  });

  const queryClient = new QueryClient({
    queryCache,
    mutationCache,
    defaultOptions: {
      queries: {
        // Disable retries in test environment for faster test execution
        retry: false,
        // Set stale time to 0 for predictable test behavior
        staleTime: defaultStaleTime,
        // Set cache time for test data persistence
        cacheTime: defaultCacheTime,
        // Disable background refetching in tests
        refetchOnMount: false,
        refetchOnWindowFocus: false,
        refetchOnReconnect: false,
        // Enable error throwing for easier test assertions
        useErrorBoundary: false,
      },
      mutations: {
        // Disable retries in test environment
        retry: false,
        // Enable error throwing for easier test assertions
        useErrorBoundary: false,
      },
    },
  });

  // Clear cache after each test if not persistent
  if (!persistent) {
    afterEach(() => {
      queryClient.clear();
    });
  }

  return queryClient;
}

/**
 * Default test query client instance
 * Used across all wizard component tests for consistent behavior
 */
export const testQueryClient = createTestQueryClient();

// ============================================================================
// ZUSTAND TEST STORE CONFIGURATION
// ============================================================================

/**
 * Create test instance of wizard Zustand store
 * Implements React/Next.js Integration Requirements for Zustand state management testing
 * 
 * @param initialState - Optional initial state for test scenarios
 * @returns Test store instance with isolated state
 */
export function createTestWizardStore(initialState?: Partial<WizardState>) {
  // Define default test state
  const defaultTestState: WizardState = {
    currentStep: WizardStep.TABLE_SELECTION,
    loading: false,
    error: undefined,
    generationStatus: GenerationStatus.IDLE,
    serviceName: 'test-service',
    availableTables: [],
    selectedTables: [],
    endpointConfigurations: [],
    generatedSpec: undefined,
    generationProgress: 0,
    generationResult: undefined,
    validationErrors: {},
    ...initialState
  };

  // Create store with test state
  const useTestStore = createStore<WizardState & WizardActions>()(
    subscribeWithSelector((set, get) => ({
      ...defaultTestState,

      // Navigation actions
      nextStep: vi.fn(async (): Promise<boolean> => {
        const currentStepIndex = Object.values(WizardStep).indexOf(get().currentStep);
        const nextStepIndex = currentStepIndex + 1;
        const nextStep = Object.values(WizardStep)[nextStepIndex];
        
        if (nextStep) {
          set({ currentStep: nextStep });
          return true;
        }
        return false;
      }),

      previousStep: vi.fn((): void => {
        const currentStepIndex = Object.values(WizardStep).indexOf(get().currentStep);
        const prevStepIndex = currentStepIndex - 1;
        const prevStep = Object.values(WizardStep)[prevStepIndex];
        
        if (prevStep) {
          set({ currentStep: prevStep });
        }
      }),

      goToStep: vi.fn((step: WizardStep): void => {
        set({ currentStep: step });
      }),

      // State management actions
      reset: vi.fn((): void => {
        set({ ...defaultTestState });
      }),

      updateState: vi.fn((updates: Partial<WizardState>): void => {
        set((state) => ({ ...state, ...updates }));
      }),

      // Validation actions
      validateCurrentStep: vi.fn(async (): Promise<boolean> => {
        const state = get();
        
        // Mock validation logic for tests
        switch (state.currentStep) {
          case WizardStep.TABLE_SELECTION:
            return state.selectedTables.length > 0;
          case WizardStep.ENDPOINT_CONFIGURATION:
            return state.endpointConfigurations.length > 0;
          case WizardStep.GENERATION_PREVIEW:
            return !!state.generatedSpec;
          default:
            return true;
        }
      }),
    }))
  );

  return useTestStore;
}

// ============================================================================
// REACT TESTING LIBRARY CONFIGURATION
// ============================================================================

/**
 * Global test cleanup after each test
 * Ensures DOM cleanup and prevents test interference
 */
afterEach(() => {
  cleanup();
});

// ============================================================================
// MOCK PROVIDERS AND WRAPPERS
// ============================================================================

import React from 'react';
import { QueryClientProvider } from '@tanstack/react-query';
import { WizardProvider } from '../wizard-provider';

/**
 * Props for test wrapper components
 */
interface TestWrapperProps {
  /** Child components to wrap */
  children: React.ReactNode;
  /** Custom query client for specific test scenarios */
  queryClient?: QueryClient;
  /** Initial wizard state for testing */
  initialWizardState?: Partial<WizardState>;
  /** Service name for wizard context */
  serviceName?: string;
}

/**
 * Comprehensive test wrapper providing all necessary providers
 * Implements comprehensive testing environment per Section 4.4.2.2
 * 
 * @param props - Test wrapper configuration
 * @returns React component with all required providers
 */
export const TestWrapper: React.FC<TestWrapperProps> = ({
  children,
  queryClient = testQueryClient,
  initialWizardState,
  serviceName = 'test-service'
}) => {
  return (
    <QueryClientProvider client={queryClient}>
      <WizardProvider 
        serviceName={serviceName}
        initialState={initialWizardState}
      >
        {children}
      </WizardProvider>
    </QueryClientProvider>
  );
};

/**
 * Simplified wrapper for testing components that only need React Query
 * 
 * @param props - Query wrapper configuration
 * @returns React component with React Query provider only
 */
export const QueryWrapper: React.FC<Pick<TestWrapperProps, 'children' | 'queryClient'>> = ({
  children,
  queryClient = testQueryClient
}) => {
  return (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
};

// ============================================================================
// TEST UTILITIES AND HELPERS
// ============================================================================

/**
 * Wait for React Query to settle (no queries or mutations in flight)
 * Useful for testing async operations with React Query
 * 
 * @param queryClient - Query client to check for settled state
 * @param timeout - Maximum time to wait in milliseconds
 * @returns Promise that resolves when all queries are settled
 */
export async function waitForQueryClient(
  queryClient: QueryClient = testQueryClient,
  timeout: number = 5000
): Promise<void> {
  return new Promise((resolve, reject) => {
    const timeoutId = setTimeout(() => {
      reject(new Error(`Query client did not settle within ${timeout}ms`));
    }, timeout);

    const checkSettled = () => {
      const isFetching = queryClient.isFetching();
      const isMutating = queryClient.isMutating();
      
      if (isFetching === 0 && isMutating === 0) {
        clearTimeout(timeoutId);
        resolve();
      } else {
        setTimeout(checkSettled, 10);
      }
    };

    checkSettled();
  });
}

/**
 * Create mock database tables for testing table selection functionality
 * 
 * @param count - Number of mock tables to create
 * @returns Array of mock database table objects
 */
export function createMockTables(count: number = 3): DatabaseTable[] {
  return Array.from({ length: count }, (_, index) => ({
    name: `table_${index + 1}`,
    label: `Table ${index + 1}`,
    description: `Mock table ${index + 1} for testing`,
    schema: 'public',
    rowCount: Math.floor(Math.random() * 10000),
    fields: [
      {
        name: 'id',
        dbType: 'INT AUTO_INCREMENT',
        type: 'integer',
        isNullable: false,
        isPrimaryKey: true,
        isForeignKey: false,
        isUnique: true,
        isAutoIncrement: true,
        description: 'Primary key'
      },
      {
        name: 'name',
        dbType: 'VARCHAR(255)',
        type: 'string',
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
    hasExistingAPI: false
  }));
}

/**
 * Create mock endpoint configuration for testing endpoint setup
 * 
 * @param tableName - Name of the table for the endpoint
 * @returns Mock endpoint configuration object
 */
export function createMockEndpointConfiguration(tableName: string): EndpointConfiguration {
  return {
    tableName,
    basePath: `/${tableName.toLowerCase()}`,
    enabledMethods: ['GET', 'POST', 'PUT', 'DELETE'],
    methodConfigurations: {},
    security: {
      requireAuth: false,
      requiredRoles: [],
      apiKeyPermissions: []
    },
    customParameters: [],
    enabled: true
  };
}

/**
 * Create mock OpenAPI specification for testing preview functionality
 * 
 * @param serviceName - Name of the service
 * @param tables - Array of table names to include
 * @returns Mock OpenAPI specification object
 */
export function createMockOpenAPISpec(serviceName: string, tables: string[] = []): OpenAPISpec {
  const paths: Record<string, any> = {};
  
  tables.forEach(tableName => {
    paths[`/api/v2/${serviceName}/_table/${tableName}`] = {
      get: {
        operationId: `get${tableName}List`,
        summary: `Get ${tableName} records`,
        responses: { '200': { description: 'Success' } }
      },
      post: {
        operationId: `create${tableName}`,
        summary: `Create ${tableName} record`,
        responses: { '201': { description: 'Created' } }
      }
    };
  });

  return {
    openapi: '3.0.3',
    info: {
      title: `${serviceName} API`,
      version: '1.0.0',
      description: `Mock API for ${serviceName}`
    },
    servers: [
      {
        url: `http://localhost:3000/api/v2/${serviceName}`,
        description: 'Test server'
      }
    ],
    paths,
    components: {
      schemas: {},
      securitySchemes: {
        ApiKeyAuth: {
          type: 'apiKey',
          in: 'header',
          name: 'X-DreamFactory-API-Key'
        }
      }
    },
    security: [{ ApiKeyAuth: [] }],
    tags: tables.map(table => ({ name: table, description: `${table} operations` }))
  };
}

/**
 * Create mock generation result for testing completion functionality
 * 
 * @param serviceName - Name of the generated service
 * @param endpoints - Array of endpoint URLs generated
 * @returns Mock generation result object
 */
export function createMockGenerationResult(
  serviceName: string, 
  endpoints: string[] = []
): GenerationResult {
  return {
    success: true,
    serviceId: Math.floor(Math.random() * 1000) + 1,
    endpointUrls: endpoints,
    openApiSpec: createMockOpenAPISpec(serviceName, ['users', 'orders']),
    statistics: {
      tablesProcessed: Math.floor(endpoints.length / 5),
      endpointsGenerated: endpoints.length,
      schemasCreated: Math.floor(endpoints.length / 2),
      generationDuration: Math.floor(Math.random() * 5000) + 1000,
      specificationSize: Math.floor(Math.random() * 50000) + 10000
    },
    warnings: [],
    timestamp: new Date()
  };
}

// ============================================================================
// MSW TEST UTILITIES
// ============================================================================

/**
 * Override MSW handler for specific test scenarios
 * 
 * @param path - API path to override
 * @param method - HTTP method to override
 * @param response - Custom response for the handler
 */
export function overrideMSWHandler(
  path: string, 
  method: 'GET' | 'POST' | 'PUT' | 'DELETE', 
  response: any
): void {
  const { http, HttpResponse } = require('msw');
  
  const handler = http[method.toLowerCase() as 'get' | 'post' | 'put' | 'delete'](
    path, 
    () => HttpResponse.json(response)
  );
  
  server.use(handler);
}

/**
 * Simulate network error for testing error handling
 * 
 * @param path - API path to simulate error for
 * @param method - HTTP method to simulate error for
 * @param status - HTTP status code for the error
 * @param message - Error message
 */
export function simulateNetworkError(
  path: string,
  method: 'GET' | 'POST' | 'PUT' | 'DELETE',
  status: number = 500,
  message: string = 'Network error'
): void {
  const { http, HttpResponse } = require('msw');
  
  const handler = http[method.toLowerCase() as 'get' | 'post' | 'put' | 'delete'](
    path,
    () => HttpResponse.json({ error: { message, status } }, { status })
  );
  
  server.use(handler);
}

/**
 * Reset all MSW handlers to their default state
 * Useful for test cleanup and isolation
 */
export function resetMSWHandlers(): void {
  server.resetHandlers(...apiGenerationWizardHandlers);
}

// ============================================================================
// VITEST CONFIGURATION EXTENSIONS
// ============================================================================

/**
 * Custom Vitest matchers for wizard-specific testing
 */
declare global {
  namespace Vi {
    interface AsymmetricMatchersContaining {
      toBeValidWizardStep(): void;
      toHaveValidEndpointConfiguration(): void;
      toHaveValidOpenAPISpec(): void;
    }
  }
}

/**
 * Extend Vitest with custom matchers for wizard testing
 */
export function setupWizardMatchers(): void {
  expect.extend({
    toBeValidWizardStep(received: unknown) {
      const validSteps = Object.values(WizardStep);
      const pass = validSteps.includes(received as WizardStep);
      
      return {
        pass,
        message: () => pass
          ? `Expected ${received} not to be a valid wizard step`
          : `Expected ${received} to be a valid wizard step. Valid steps: ${validSteps.join(', ')}`
      };
    },

    toHaveValidEndpointConfiguration(received: EndpointConfiguration) {
      const hasTableName = typeof received.tableName === 'string' && received.tableName.length > 0;
      const hasBasePath = typeof received.basePath === 'string' && received.basePath.length > 0;
      const hasEnabledMethods = Array.isArray(received.enabledMethods) && received.enabledMethods.length > 0;
      
      const pass = hasTableName && hasBasePath && hasEnabledMethods;
      
      return {
        pass,
        message: () => pass
          ? `Expected endpoint configuration to be invalid`
          : `Expected endpoint configuration to be valid. Missing: ${[
              !hasTableName && 'tableName',
              !hasBasePath && 'basePath',
              !hasEnabledMethods && 'enabledMethods'
            ].filter(Boolean).join(', ')}`
      };
    },

    toHaveValidOpenAPISpec(received: OpenAPISpec) {
      const hasOpenAPIVersion = typeof received.openapi === 'string';
      const hasInfo = received.info && typeof received.info.title === 'string';
      const hasPaths = received.paths && typeof received.paths === 'object';
      
      const pass = hasOpenAPIVersion && hasInfo && hasPaths;
      
      return {
        pass,
        message: () => pass
          ? `Expected OpenAPI spec to be invalid`
          : `Expected OpenAPI spec to be valid. Missing: ${[
              !hasOpenAPIVersion && 'openapi version',
              !hasInfo && 'info object',
              !hasPaths && 'paths object'
            ].filter(Boolean).join(', ')}`
      };
    }
  });
}

// ============================================================================
// GLOBAL TEST SETUP
// ============================================================================

/**
 * Initialize global test setup
 * Called automatically when this module is imported
 */
function initializeTestSetup(): void {
  // Setup custom matchers
  setupWizardMatchers();
  
  // Configure global test environment
  vi.stubGlobal('crypto', {
    randomUUID: () => 'test-uuid-' + Math.random().toString(36).substring(2)
  });
  
  // Mock console methods in test environment to reduce noise
  const originalError = console.error;
  beforeEach(() => {
    console.error = vi.fn();
  });
  
  afterEach(() => {
    console.error = originalError;
  });
  
  // Global error handler for unhandled promise rejections
  process.on('unhandledRejection', (reason) => {
    console.error('Unhandled promise rejection in test:', reason);
  });
}

// Initialize test setup
initializeTestSetup();

// ============================================================================
// EXPORTS
// ============================================================================

// Export all test utilities for use in wizard component tests
export {
  // MSW utilities
  server as mswServer,
  overrideMSWHandler,
  simulateNetworkError,
  resetMSWHandlers,
  
  // React Query utilities
  createTestQueryClient,
  testQueryClient,
  waitForQueryClient,
  
  // Zustand utilities
  createTestWizardStore,
  
  // React Testing Library wrappers
  TestWrapper,
  QueryWrapper,
  
  // Mock data creators
  createMockTables,
  createMockEndpointConfiguration,
  createMockOpenAPISpec,
  createMockGenerationResult,
  
  // Vitest extensions
  setupWizardMatchers
};

// Default export for convenient importing
export default {
  server,
  testQueryClient,
  TestWrapper,
  QueryWrapper,
  createTestWizardStore,
  createMockTables,
  createMockEndpointConfiguration,
  createMockOpenAPISpec,
  createMockGenerationResult,
  waitForQueryClient,
  overrideMSWHandler,
  simulateNetworkError,
  resetMSWHandlers,
  setupWizardMatchers
};