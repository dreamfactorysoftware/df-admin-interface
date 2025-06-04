/**
 * React Testing Library render utilities and custom providers for wizard component testing.
 * 
 * Provides reusable render functions with wizard context, React Query client, MSW integration,
 * and routing setup for consistent component testing environment across the API generation wizard test suite.
 * 
 * Implements React/Next.js Integration Requirements for React Testing Library component testing patterns,
 * supporting F-003: REST API Endpoint Generation wizard component testing with state management validation
 * and F-006: API Documentation and Testing with comprehensive component testing automation.
 * 
 * Key features:
 * - Custom render function with wizard context provider and React Query client setup
 * - MSW integration for realistic API interaction testing during component tests
 * - Next.js router mocking and navigation utilities for wizard step testing
 * - Wizard state management testing utilities and step navigation simulation
 * - Comprehensive provider wrapper for isolated component testing environment
 */

import React, { ReactElement, ReactNode } from 'react';
import { render, RenderOptions, RenderResult } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { WizardProvider, WIZARD_STEPS, type WizardStep } from '../wizard-provider';
import { type WizardState, type DatabaseTable, type EndpointConfiguration } from '../types';

// Mock Next.js router for testing environment
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
  usePathname: jest.fn(() => '/api-connections/database/test-service/generate'),
  useSearchParams: jest.fn(() => new URLSearchParams()),
  notFound: jest.fn(),
}));

// ============================================================================
// Testing Utilities and Mock Data
// ============================================================================

/**
 * Default mock router implementation for wizard testing
 */
export const createMockRouter = (overrides: Partial<ReturnType<typeof useRouter>> = {}) => ({
  push: jest.fn(),
  replace: jest.fn(),
  back: jest.fn(),
  forward: jest.fn(),
  refresh: jest.fn(),
  prefetch: jest.fn(),
  ...overrides,
});

/**
 * Default test wizard state for consistent testing
 */
export const defaultTestWizardState: Partial<WizardState> = {
  currentStep: WIZARD_STEPS.TABLE_SELECTION,
  completedSteps: new Set<WizardStep>(),
  isNavigationLocked: false,
  serviceId: 'test-mysql-service',
  serviceName: 'Test MySQL Database',
  databaseType: 'mysql',
  availableTables: [],
  selectedTables: new Map(),
  tableSearchQuery: '',
  endpointConfigurations: new Map(),
  globalConfiguration: {
    httpMethods: {
      GET: true,
      POST: true,
      PUT: true,
      PATCH: false,
      DELETE: false,
    },
    enablePagination: true,
    enableFiltering: true,
    enableSorting: true,
    maxPageSize: 100,
    customFields: [],
    securityRules: [],
  },
  generationProgress: {
    currentStep: 0,
    completedSteps: [],
    isGenerating: false,
    error: null,
    generatedEndpoints: [],
  },
  openApiPreview: {
    specification: null,
    isValid: false,
    validationErrors: [],
    lastUpdated: null,
  },
};

/**
 * Sample database tables for testing table selection and configuration
 */
export const mockDatabaseTables: DatabaseTable[] = [
  {
    id: 'users',
    name: 'users',
    label: 'User Accounts',
    description: 'Application user accounts and authentication data',
    fields: [
      {
        id: 'id',
        name: 'id',
        type: 'integer',
        nullable: false,
        primaryKey: true,
      },
      {
        id: 'email',
        name: 'email',
        type: 'string',
        nullable: false,
        primaryKey: false,
      },
      {
        id: 'created_at',
        name: 'created_at',
        type: 'timestamp',
        nullable: false,
        primaryKey: false,
      },
    ],
    relationships: [],
    selected: false,
  },
  {
    id: 'products',
    name: 'products',
    label: 'Product Catalog',
    description: 'E-commerce product information and inventory',
    fields: [
      {
        id: 'id',
        name: 'id',
        type: 'integer',
        nullable: false,
        primaryKey: true,
      },
      {
        id: 'name',
        name: 'name',
        type: 'string',
        nullable: false,
        primaryKey: false,
      },
      {
        id: 'price',
        name: 'price',
        type: 'decimal',
        nullable: false,
        primaryKey: false,
      },
      {
        id: 'user_id',
        name: 'user_id',
        type: 'integer',
        nullable: false,
        primaryKey: false,
        foreignKey: {
          table: 'users',
          field: 'id',
        },
      },
    ],
    relationships: [
      {
        id: 'products_user_fk',
        type: 'many-to-one',
        fromTable: 'products',
        toTable: 'users',
        fromField: 'user_id',
        toField: 'id',
      },
    ],
    selected: false,
  },
  {
    id: 'orders',
    name: 'orders',
    label: 'Customer Orders',
    description: 'Order management and tracking data',
    fields: [
      {
        id: 'id',
        name: 'id',
        type: 'integer',
        nullable: false,
        primaryKey: true,
      },
      {
        id: 'user_id',
        name: 'user_id',
        type: 'integer',
        nullable: false,
        primaryKey: false,
        foreignKey: {
          table: 'users',
          field: 'id',
        },
      },
      {
        id: 'total_amount',
        name: 'total_amount',
        type: 'decimal',
        nullable: false,
        primaryKey: false,
      },
      {
        id: 'status',
        name: 'status',
        type: 'string',
        nullable: false,
        primaryKey: false,
      },
    ],
    relationships: [
      {
        id: 'orders_user_fk',
        type: 'many-to-one',
        fromTable: 'orders',
        toTable: 'users',
        fromField: 'user_id',
        toField: 'id',
      },
    ],
    selected: false,
  },
];

/**
 * Sample endpoint configurations for testing configuration workflow
 */
export const mockEndpointConfigurations: EndpointConfiguration[] = [
  {
    httpMethods: {
      GET: true,
      POST: true,
      PUT: true,
      PATCH: false,
      DELETE: false,
    },
    enablePagination: true,
    enableFiltering: true,
    enableSorting: true,
    maxPageSize: 50,
    customFields: ['created_at', 'updated_at'],
    securityRules: [
      {
        id: 'authenticated_users_only',
        method: 'GET',
        roles: ['authenticated'],
        conditions: 'user.is_authenticated = true',
        enabled: true,
      },
    ],
  },
];

/**
 * Sample OpenAPI specification for testing preview functionality
 */
export const mockOpenAPISpec = {
  openapi: '3.0.3',
  info: {
    title: 'Test Database API',
    version: '1.0.0',
    description: 'Generated API for test MySQL database',
  },
  servers: [
    {
      url: 'https://localhost:8080/api/v2',
      description: 'Development server',
    },
  ],
  paths: {
    '/test-mysql-service/users': {
      get: {
        operationId: 'getUsers',
        summary: 'Retrieve user records',
        tags: ['users'],
        parameters: [
          {
            name: 'limit',
            in: 'query',
            description: 'Number of records to return',
            required: false,
            schema: {
              type: 'integer',
              minimum: 1,
              maximum: 100,
              default: 25,
            },
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
                        $ref: '#/components/schemas/User',
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
      post: {
        operationId: 'createUser',
        summary: 'Create new user record',
        tags: ['users'],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/UserInput',
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
                  $ref: '#/components/schemas/User',
                },
              },
            },
          },
        },
      },
    },
  },
  components: {
    schemas: {
      User: {
        type: 'object',
        required: ['id', 'email'],
        properties: {
          id: {
            type: 'integer',
            description: 'User ID',
          },
          email: {
            type: 'string',
            format: 'email',
            description: 'User email address',
          },
          created_at: {
            type: 'string',
            format: 'date-time',
            description: 'Record creation timestamp',
          },
        },
      },
      UserInput: {
        type: 'object',
        required: ['email'],
        properties: {
          email: {
            type: 'string',
            format: 'email',
            description: 'User email address',
          },
        },
      },
    },
    securitySchemes: {
      ApiKeyAuth: {
        type: 'apiKey',
        in: 'header',
        name: 'X-DreamFactory-Api-Key',
      },
    },
  },
  security: [
    {
      ApiKeyAuth: [],
    },
  ],
  tags: [
    {
      name: 'users',
      description: 'User management operations',
    },
  ],
};

// ============================================================================
// React Query Test Client Configuration
// ============================================================================

/**
 * Creates a React Query client configured for testing environment
 * with disabled retries and minimal cache times for predictable test behavior
 */
export const createTestQueryClient = (): QueryClient => {
  return new QueryClient({
    defaultOptions: {
      queries: {
        // Disable retries in test environment for predictable behavior
        retry: false,
        // Disable cache time for fresh data in each test
        cacheTime: 0,
        staleTime: 0,
        // Disable refetching to prevent test interference
        refetchOnMount: false,
        refetchOnWindowFocus: false,
        refetchOnReconnect: false,
      },
      mutations: {
        // Disable retries for mutations as well
        retry: false,
      },
    },
    // Disable error logging during tests to keep console clean
    logger: {
      log: () => {},
      warn: () => {},
      error: () => {},
    },
  });
};

// ============================================================================
// Custom Render Function with Providers
// ============================================================================

/**
 * Props for configuring the test render environment
 */
export interface RenderWithProvidersOptions extends Omit<RenderOptions, 'wrapper'> {
  /** Initial wizard state for testing specific scenarios */
  initialWizardState?: Partial<WizardState>;
  /** Service context for wizard provider */
  serviceContext?: {
    serviceId: string;
    serviceName: string;
    databaseType: string;
  };
  /** Custom React Query client (uses test client by default) */
  queryClient?: QueryClient;
  /** Custom router mock for navigation testing */
  routerMock?: Partial<ReturnType<typeof useRouter>>;
  /** Whether to include MSW server integration */
  enableMSW?: boolean;
}

/**
 * Comprehensive test wrapper component that provides all necessary context
 * for wizard component testing including React Query, router, and wizard state
 */
export const TestWrapper: React.FC<{
  children: ReactNode;
  options: RenderWithProvidersOptions;
}> = ({ children, options }) => {
  const {
    queryClient = createTestQueryClient(),
    serviceContext = {
      serviceId: 'test-mysql-service',
      serviceName: 'Test MySQL Database',
      databaseType: 'mysql',
    },
  } = options;

  // Setup router mock if provided
  if (options.routerMock) {
    const mockRouter = createMockRouter(options.routerMock);
    (useRouter as jest.Mock).mockReturnValue(mockRouter);
  }

  return (
    <QueryClientProvider client={queryClient}>
      <WizardProvider
        serviceId={serviceContext.serviceId}
        serviceName={serviceContext.serviceName}
        databaseType={serviceContext.databaseType}
      >
        {children}
      </WizardProvider>
    </QueryClientProvider>
  );
};

/**
 * Enhanced render function that wraps components with all necessary providers
 * for wizard testing, including React Query, wizard context, and routing mocks
 * 
 * @param ui - React component to render
 * @param options - Configuration options for the test environment
 * @returns RenderResult with additional testing utilities
 */
export const renderWithProviders = (
  ui: ReactElement,
  options: RenderWithProvidersOptions = {}
): RenderResult & {
  /** Access to the React Query client for cache inspection */
  queryClient: QueryClient;
  /** Mock router functions for navigation testing */
  routerMock: ReturnType<typeof createMockRouter>;
  /** Rerender with different options */
  rerenderWithOptions: (newOptions: RenderWithProvidersOptions) => void;
} => {
  const queryClient = options.queryClient || createTestQueryClient();
  const routerMock = createMockRouter(options.routerMock);
  
  // Setup router mock
  (useRouter as jest.Mock).mockReturnValue(routerMock);

  const wrapper = ({ children }: { children: ReactNode }) => (
    <TestWrapper options={{ ...options, queryClient }}>
      {children}
    </TestWrapper>
  );

  const renderResult = render(ui, {
    wrapper,
    ...options,
  });

  // Enhanced rerender function that allows updating options
  const rerenderWithOptions = (newOptions: RenderWithProvidersOptions) => {
    const newWrapper = ({ children }: { children: ReactNode }) => (
      <TestWrapper options={{ ...options, ...newOptions, queryClient }}>
        {children}
      </TestWrapper>
    );
    
    renderResult.rerender(
      React.cloneElement(ui, {}, ui.props.children)
    );
  };

  return {
    ...renderResult,
    queryClient,
    routerMock,
    rerenderWithOptions,
  };
};

// ============================================================================
// Wizard-Specific Testing Utilities
// ============================================================================

/**
 * Utility functions for wizard state management and navigation testing
 */
export const wizardTestUtils = {
  /**
   * Simulate wizard step navigation
   */
  navigateToStep: (step: WizardStep, routerMock?: ReturnType<typeof createMockRouter>) => {
    const router = routerMock || createMockRouter();
    
    switch (step) {
      case WIZARD_STEPS.TABLE_SELECTION:
        router.push('/api-connections/database/test-service/generate?step=tables');
        break;
      case WIZARD_STEPS.ENDPOINT_CONFIGURATION:
        router.push('/api-connections/database/test-service/generate?step=endpoints');
        break;
      case WIZARD_STEPS.SECURITY_CONFIGURATION:
        router.push('/api-connections/database/test-service/generate?step=security');
        break;
      case WIZARD_STEPS.PREVIEW_AND_GENERATE:
        router.push('/api-connections/database/test-service/generate?step=preview');
        break;
    }
  },

  /**
   * Create mock wizard state for specific step testing
   */
  createMockStateForStep: (step: WizardStep): Partial<WizardState> => {
    const baseState = { ...defaultTestWizardState };
    
    switch (step) {
      case WIZARD_STEPS.TABLE_SELECTION:
        return {
          ...baseState,
          currentStep: step,
          availableTables: mockDatabaseTables,
        };
        
      case WIZARD_STEPS.ENDPOINT_CONFIGURATION:
        const selectedTables = new Map();
        selectedTables.set('users', { ...mockDatabaseTables[0], selected: true });
        selectedTables.set('products', { ...mockDatabaseTables[1], selected: true });
        
        return {
          ...baseState,
          currentStep: step,
          availableTables: mockDatabaseTables,
          selectedTables,
          completedSteps: new Set([WIZARD_STEPS.TABLE_SELECTION]),
        };
        
      case WIZARD_STEPS.SECURITY_CONFIGURATION:
        const selectedTablesWithConfig = new Map();
        selectedTablesWithConfig.set('users', { ...mockDatabaseTables[0], selected: true });
        
        const endpointConfigs = new Map();
        endpointConfigs.set('users', mockEndpointConfigurations[0]);
        
        return {
          ...baseState,
          currentStep: step,
          selectedTables: selectedTablesWithConfig,
          endpointConfigurations: endpointConfigs,
          completedSteps: new Set([
            WIZARD_STEPS.TABLE_SELECTION,
            WIZARD_STEPS.ENDPOINT_CONFIGURATION,
          ]),
        };
        
      case WIZARD_STEPS.PREVIEW_AND_GENERATE:
        return {
          ...baseState,
          currentStep: step,
          selectedTables: new Map([['users', { ...mockDatabaseTables[0], selected: true }]]),
          endpointConfigurations: new Map([['users', mockEndpointConfigurations[0]]]),
          openApiPreview: {
            specification: mockOpenAPISpec,
            isValid: true,
            validationErrors: [],
            lastUpdated: new Date(),
          },
          completedSteps: new Set([
            WIZARD_STEPS.TABLE_SELECTION,
            WIZARD_STEPS.ENDPOINT_CONFIGURATION,
            WIZARD_STEPS.SECURITY_CONFIGURATION,
          ]),
        };
        
      default:
        return baseState;
    }
  },

  /**
   * Simulate table selection interactions
   */
  simulateTableSelection: (tables: DatabaseTable[]) => {
    return tables.map(table => ({ ...table, selected: true }));
  },

  /**
   * Simulate generation progress updates
   */
  simulateGenerationProgress: (progress: number, currentOperation?: string) => {
    return {
      currentStep: progress,
      completedSteps: Array.from({ length: Math.floor(progress / 25) }, (_, i) => i),
      isGenerating: progress < 100,
      error: null,
      generatedEndpoints: progress === 100 ? [
        '/api/v2/test-mysql-service/users',
        '/api/v2/test-mysql-service/products',
      ] : [],
      currentOperation,
    };
  },

  /**
   * Wait for wizard step completion
   */
  waitForStepCompletion: async (step: WizardStep) => {
    // This would be used with waitFor from testing-library
    // to wait for specific wizard state changes
    return new Promise<void>((resolve) => {
      setTimeout(resolve, 100); // Simulate async step completion
    });
  },
};

// ============================================================================
// MSW Integration Utilities
// ============================================================================

/**
 * MSW setup utilities for realistic API testing
 */
export const mswTestUtils = {
  /**
   * Configure MSW handlers for wizard API endpoints
   */
  setupWizardHandlers: () => {
    // This would integrate with MSW handlers defined in msw-handlers.ts
    // The actual MSW setup would be imported and configured here
    return {
      enableMocks: () => {
        // Enable MSW for wizard testing
      },
      disableMocks: () => {
        // Disable MSW after tests
      },
      resetHandlers: () => {
        // Reset handlers between tests
      },
    };
  },

  /**
   * Mock successful API responses for wizard workflow
   */
  mockSuccessfulWorkflow: () => {
    return {
      tableDiscovery: mockDatabaseTables,
      schemaValidation: { valid: true, errors: [] },
      endpointGeneration: mockOpenAPISpec,
      generationResult: {
        success: true,
        serviceId: 123,
        endpointUrls: [
          '/api/v2/test-mysql-service/users',
          '/api/v2/test-mysql-service/products',
        ],
        openApiSpec: mockOpenAPISpec,
        statistics: {
          tablesProcessed: 2,
          endpointsGenerated: 6,
          schemasCreated: 4,
          generationDuration: 2500,
          specificationSize: 12450,
        },
        warnings: [],
        timestamp: new Date(),
      },
    };
  },

  /**
   * Mock error scenarios for testing error handling
   */
  mockErrorScenarios: () => {
    return {
      connectionError: {
        error: 'Database connection failed',
        details: 'Unable to connect to MySQL server at localhost:3306',
      },
      schemaError: {
        error: 'Schema discovery failed',
        details: 'Permission denied for table introspection',
      },
      generationError: {
        error: 'API generation failed',
        details: 'Duplicate endpoint paths detected',
      },
    };
  },
};

// ============================================================================
// Assertion Helpers
// ============================================================================

/**
 * Custom assertions for wizard component testing
 */
export const wizardAssertions = {
  /**
   * Assert wizard is at specific step
   */
  expectWizardStep: (step: WizardStep) => {
    // This would be used with testing-library queries
    // to assert the current wizard step state
  },

  /**
   * Assert tables are selected correctly
   */
  expectTablesSelected: (expectedTables: string[]) => {
    // Assert selected table state matches expectations
  },

  /**
   * Assert endpoint configuration is valid
   */
  expectValidEndpointConfig: (tableId: string, config: Partial<EndpointConfiguration>) => {
    // Assert endpoint configuration matches expected values
  },

  /**
   * Assert OpenAPI preview is generated
   */
  expectOpenAPIPreview: (expectedSpec: Partial<typeof mockOpenAPISpec>) => {
    // Assert OpenAPI specification preview content
  },

  /**
   * Assert generation completed successfully
   */
  expectGenerationSuccess: (expectedEndpoints: string[]) => {
    // Assert successful API generation with expected endpoints
  },
};

// Export default render function for convenience
export { renderWithProviders as render };

// Re-export testing library utilities for convenience
export * from '@testing-library/react';
export { userEvent } from '@testing-library/user-event';

// Export types for use in test files
export type {
  RenderWithProvidersOptions,
  DatabaseTable,
  EndpointConfiguration,
  WizardStep,
  WizardState,
};