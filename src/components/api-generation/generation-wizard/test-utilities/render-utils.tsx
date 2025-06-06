/**
 * @fileoverview React Testing Library Render Utilities for API Generation Wizard
 * 
 * Provides comprehensive testing utilities and custom providers for wizard component testing.
 * Implements reusable render functions with wizard context, React Query client, MSW integration,
 * and Next.js routing setup for consistent component testing environment across the API
 * generation wizard test suite.
 * 
 * Key Features:
 * - Custom render function with WizardProvider context and React Query client setup
 * - Next.js router mocking and navigation simulation utilities
 * - MSW integration helpers for realistic API interaction testing
 * - Wizard state management testing utilities and step navigation simulation
 * - Mock data factories for consistent test data generation
 * - Accessibility testing utilities supporting WCAG 2.1 AA compliance
 * 
 * Supports:
 * - F-003: REST API Endpoint Generation wizard component testing with state management validation
 * - F-006: API Documentation and Testing with comprehensive component testing automation
 * - React/Next.js Integration Requirements for React Testing Library component testing patterns
 * - Section 4.4.2.2 Enhanced Testing Pipeline requiring React component testing with Testing Library best practices
 * 
 * @module WizardRenderUtils
 * @version 1.0.0
 * @since React 19.0.0, Next.js 15.1+
 */

import React, { ReactElement, ReactNode } from 'react';
import { render, RenderOptions, RenderResult, screen, waitFor, within } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AppRouterContext } from 'next/dist/shared/lib/app-router-context.shared-runtime';
import { PathnameContext } from 'next/dist/shared/lib/hooks-client-context.shared-runtime';
import userEvent, { UserEvent } from '@testing-library/user-event';
import { vi, MockedFunction } from 'vitest';

// Internal imports
import { WizardProvider, useWizard } from '../wizard-provider';
import { 
  WizardState, 
  WizardStep, 
  WizardActions, 
  DatabaseTable, 
  EndpointConfiguration, 
  GenerationResult,
  OpenAPISpec,
  WizardStepInfo,
  TableSelectionData,
  EndpointConfigurationData,
  GenerationPreviewData,
  SecurityConfigurationData,
  ServiceSelectionData
} from '../types';
import { 
  createTestQueryClient,
  createMockWizardState,
  createMockDatabaseTable,
  createMockEndpointConfiguration,
  mswServer,
  testQueryClient
} from './test-setup';

// =============================================================================
// TYPES AND INTERFACES
// =============================================================================

/**
 * Enhanced render options for wizard component testing
 */
export interface WizardRenderOptions extends Omit<RenderOptions, 'wrapper'> {
  /** Initial wizard state for testing */
  initialWizardState?: Partial<WizardState>;
  
  /** Service name for wizard context */
  serviceName?: string;
  
  /** Custom React Query client */
  queryClient?: QueryClient;
  
  /** Initial route path for Next.js router */
  initialRoute?: string;
  
  /** Custom router implementation */
  router?: Partial<MockAppRouter>;
  
  /** Whether to suppress console errors during test */
  suppressErrors?: boolean;
  
  /** Additional providers to wrap around the component */
  additionalProviders?: React.FC<{ children: ReactNode }>[];
  
  /** Test user configuration */
  user?: {
    advanceTimers?: boolean;
    delay?: number | null;
  };
}

/**
 * Enhanced render result with wizard-specific utilities
 */
export interface WizardRenderResult extends RenderResult {
  /** User event instance for interactions */
  user: UserEvent;
  
  /** Mock router utilities */
  router: MockAppRouter;
  
  /** Query client instance */
  queryClient: QueryClient;
  
  /** Wizard state access utilities */
  wizard: {
    /** Get current wizard state */
    getState: () => WizardState;
    
    /** Get current wizard actions */
    getActions: () => WizardActions;
    
    /** Navigate to specific step */
    goToStep: (step: WizardStep) => Promise<void>;
    
    /** Trigger next step navigation */
    nextStep: () => Promise<void>;
    
    /** Trigger previous step navigation */
    previousStep: () => Promise<void>;
    
    /** Update wizard state */
    updateState: (updates: Partial<WizardState>) => void;
    
    /** Reset wizard to initial state */
    reset: () => void;
  };
  
  /** Utility functions for testing */
  utils: {
    /** Wait for wizard state to update */
    waitForStateUpdate: (predicate: (state: WizardState) => boolean, timeout?: number) => Promise<void>;
    
    /** Wait for loading to complete */
    waitForLoading: (timeout?: number) => Promise<void>;
    
    /** Wait for queries to complete */
    waitForQueries: (timeout?: number) => Promise<void>;
    
    /** Simulate API response delay */
    simulateApiDelay: (ms?: number) => Promise<void>;
    
    /** Validate accessibility compliance */
    validateAccessibility: () => void;
  };
}

/**
 * Mock Next.js App Router interface
 */
export interface MockAppRouter {
  /** Current pathname */
  pathname: string;
  
  /** Navigation function */
  push: MockedFunction<(href: string, options?: any) => void>;
  
  /** Replace function */
  replace: MockedFunction<(href: string, options?: any) => void>;
  
  /** Go back function */
  back: MockedFunction<() => void>;
  
  /** Go forward function */
  forward: MockedFunction<() => void>;
  
  /** Refresh function */
  refresh: MockedFunction<() => void>;
  
  /** Prefetch function */
  prefetch: MockedFunction<(href: string) => Promise<void>>;
  
  /** Set pathname for testing */
  setPathname: (path: string) => void;
  
  /** Get navigation history */
  getHistory: () => string[];
  
  /** Clear navigation history */
  clearHistory: () => void;
}

/**
 * Test wizard data factory options
 */
export interface WizardTestDataOptions {
  /** Number of mock tables to generate */
  tableCount?: number;
  
  /** Service name to use */
  serviceName?: string;
  
  /** Whether to include complex table relationships */
  includeRelationships?: boolean;
  
  /** Whether to include endpoint configurations */
  includeEndpointConfigs?: boolean;
  
  /** Current wizard step */
  currentStep?: WizardStep;
  
  /** Whether to include generated OpenAPI spec */
  includeGeneratedSpec?: boolean;
}

/**
 * Step navigation test utilities
 */
export interface StepNavigationUtils {
  /** Click next button and wait for navigation */
  clickNext: () => Promise<void>;
  
  /** Click previous button and wait for navigation */
  clickPrevious: () => Promise<void>;
  
  /** Click step indicator and wait for navigation */
  clickStep: (step: WizardStep) => Promise<void>;
  
  /** Verify current step is active */
  expectCurrentStep: (step: WizardStep) => void;
  
  /** Verify step can be navigated to */
  expectStepAccessible: (step: WizardStep) => void;
  
  /** Verify step is completed */
  expectStepCompleted: (step: WizardStep) => void;
  
  /** Get all step indicators */
  getStepIndicators: () => HTMLElement[];
  
  /** Get step progress percentage */
  getProgress: () => number;
}

// =============================================================================
// MOCK ROUTER IMPLEMENTATION
// =============================================================================

/**
 * Creates a mock Next.js App Router for testing
 */
function createMockRouter(initialRoute = '/'): MockAppRouter {
  let currentPathname = initialRoute;
  const history: string[] = [initialRoute];
  
  const mockRouter: MockAppRouter = {
    pathname: currentPathname,
    push: vi.fn((href: string) => {
      currentPathname = href;
      history.push(href);
      mockRouter.pathname = href;
    }),
    replace: vi.fn((href: string) => {
      currentPathname = href;
      if (history.length > 0) {
        history[history.length - 1] = href;
      } else {
        history.push(href);
      }
      mockRouter.pathname = href;
    }),
    back: vi.fn(() => {
      if (history.length > 1) {
        history.pop();
        currentPathname = history[history.length - 1];
        mockRouter.pathname = currentPathname;
      }
    }),
    forward: vi.fn(() => {
      // Mock implementation - in real tests you might track forward history
    }),
    refresh: vi.fn(),
    prefetch: vi.fn().mockResolvedValue(undefined),
    setPathname: (path: string) => {
      currentPathname = path;
      mockRouter.pathname = path;
    },
    getHistory: () => [...history],
    clearHistory: () => {
      history.length = 0;
      history.push(initialRoute);
      currentPathname = initialRoute;
      mockRouter.pathname = initialRoute;
    }
  };
  
  return mockRouter;
}

// =============================================================================
// WIZARD TEST DATA FACTORIES
// =============================================================================

/**
 * Creates comprehensive mock wizard state for testing
 */
export function createWizardTestData(options: WizardTestDataOptions = {}): WizardState {
  const {
    tableCount = 3,
    serviceName = 'test-database-service',
    includeRelationships = true,
    includeEndpointConfigs = true,
    currentStep = 'table-selection',
    includeGeneratedSpec = false
  } = options;
  
  // Generate mock tables
  const availableTables: DatabaseTable[] = Array.from({ length: tableCount }, (_, index) => 
    createMockDatabaseTable({
      name: `table_${index + 1}`,
      label: `Table ${index + 1}`,
      description: `Mock table ${index + 1} for testing`,
      rowCount: 100 * (index + 1),
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
        },
        {
          name: 'created_at',
          dbType: 'timestamp',
          type: 'timestamp' as const,
          isNullable: false,
          isPrimaryKey: false,
          isForeignKey: false,
          isUnique: false,
          description: 'Creation timestamp'
        },
        ...(includeRelationships && index > 0 ? [{
          name: `table_${index}_id`,
          dbType: 'integer',
          type: 'integer' as const,
          isNullable: true,
          isPrimaryKey: false,
          isForeignKey: true,
          isUnique: false,
          description: `Reference to table ${index}`
        }] : [])
      ],
      primaryKey: ['id'],
      foreignKeys: includeRelationships && index > 0 ? [{
        name: `fk_table_${index + 1}_table_${index}`,
        field: `table_${index}_id`,
        referencedTable: `table_${index}`,
        referencedField: 'id',
        onDelete: 'CASCADE' as const,
        onUpdate: 'CASCADE' as const
      }] : []
    })
  );
  
  // Select first two tables by default
  const selectedTables = availableTables.slice(0, Math.min(2, tableCount));
  
  // Generate endpoint configurations if requested
  const endpointConfigurations: EndpointConfiguration[] = includeEndpointConfigs 
    ? selectedTables.map(table => createMockEndpointConfiguration({
        tableName: table.name,
        basePath: `/${table.name.toLowerCase()}`,
        enabledMethods: ['GET', 'POST', 'PUT', 'DELETE'] as const
      }))
    : [];
  
  // Generate mock OpenAPI spec if requested
  const generatedSpec: OpenAPISpec | undefined = includeGeneratedSpec ? {
    openapi: '3.0.3',
    info: {
      title: `${serviceName} API`,
      version: '1.0.0',
      description: 'Mock API specification for testing'
    },
    servers: [{
      url: `http://localhost/api/v2/${serviceName}`,
      description: 'Test server'
    }],
    paths: selectedTables.reduce((paths, table) => {
      paths[`/${table.name}`] = {
        get: {
          operationId: `get${table.name}`,
          summary: `Get ${table.label}`,
          tags: [table.name],
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
                        items: { $ref: `#/components/schemas/${table.name}` }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      };
      return paths;
    }, {} as any),
    components: {
      schemas: selectedTables.reduce((schemas, table) => {
        schemas[table.name] = {
          type: 'object',
          properties: table.fields.reduce((props, field) => {
            props[field.name] = {
              type: field.type === 'integer' ? 'integer' : 'string',
              description: field.description || field.name
            };
            return props;
          }, {} as any),
          required: table.fields.filter(f => !f.isNullable).map(f => f.name)
        };
        return schemas;
      }, {} as any),
      securitySchemes: {
        ApiKeyAuth: {
          type: 'apiKey' as const,
          in: 'header' as const,
          name: 'X-DreamFactory-API-Key'
        }
      }
    },
    security: [{ ApiKeyAuth: [] }],
    tags: selectedTables.map(table => ({
      name: table.name,
      description: table.description || `${table.label} operations`
    }))
  } : undefined;
  
  return createMockWizardState({
    currentStep,
    serviceName,
    availableTables,
    selectedTables,
    endpointConfigurations,
    generatedSpec,
    generationStatus: includeGeneratedSpec ? 'completed' as const : 'idle' as const
  });
}

/**
 * Creates mock service selection data
 */
export function createMockServiceSelectionData(overrides: Partial<ServiceSelectionData> = {}): ServiceSelectionData {
  return {
    selectedService: {
      id: 1,
      name: 'test-database',
      label: 'Test Database',
      description: 'Mock database service for testing',
      type: 'mysql',
      is_active: true,
      config: {
        host: 'localhost',
        port: 3306,
        database: 'test_db',
        username: 'test_user'
      },
      created_date: '2024-01-01T00:00:00Z',
      last_modified_date: '2024-01-01T00:00:00Z'
    },
    availableServices: [
      {
        id: 1,
        name: 'test-database',
        label: 'Test Database',
        description: 'Mock database service for testing',
        type: 'mysql',
        is_active: true,
        config: {},
        created_date: '2024-01-01T00:00:00Z',
        last_modified_date: '2024-01-01T00:00:00Z'
      },
      {
        id: 2,
        name: 'test-postgres',
        label: 'Test PostgreSQL',
        description: 'Mock PostgreSQL service for testing',
        type: 'postgresql',
        is_active: true,
        config: {},
        created_date: '2024-01-01T00:00:00Z',
        last_modified_date: '2024-01-01T00:00:00Z'
      }
    ],
    loading: false,
    error: null,
    connectionTest: null,
    testingConnection: false,
    filter: {
      activeOnly: true,
      recentFirst: true
    },
    createNewService: false,
    newServiceConfig: null,
    ...overrides
  };
}

/**
 * Creates mock table selection data
 */
export function createMockTableSelectionData(overrides: Partial<TableSelectionData> = {}): TableSelectionData {
  const availableTables = [
    createMockDatabaseTable({ name: 'users', label: 'Users', rowCount: 1250 }),
    createMockDatabaseTable({ name: 'orders', label: 'Orders', rowCount: 5678 }),
    createMockDatabaseTable({ name: 'products', label: 'Products', rowCount: 892 })
  ];
  
  return {
    availableTables,
    selectedTables: [],
    loading: false,
    error: null,
    lastDiscovered: new Date().toISOString(),
    filter: {
      searchTerm: '',
      primaryKeyOnly: false,
      foreignKeyOnly: false,
      hideSystemTables: true,
      hideEmptyTables: false,
      minRowCount: undefined,
      maxRowCount: undefined,
      categories: [],
      tags: []
    },
    bulkSelection: {
      selectAll: false,
      selectAllFields: false,
      bulkOperationInProgress: false
    },
    tableMetadata: new Map(),
    refreshing: false,
    totalTables: availableTables.length,
    pagination: {
      currentPage: 1,
      pageSize: 50,
      totalItems: availableTables.length,
      totalPages: 1,
      hasNextPage: false,
      hasPreviousPage: false
    },
    ...overrides
  };
}

// =============================================================================
// PROVIDER WRAPPER COMPONENT
// =============================================================================

/**
 * Test provider wrapper with all necessary contexts
 */
interface TestProvidersProps {
  children: ReactNode;
  queryClient: QueryClient;
  router: MockAppRouter;
  initialWizardState?: Partial<WizardState>;
  serviceName: string;
}

function TestProviders({ 
  children, 
  queryClient, 
  router, 
  initialWizardState,
  serviceName 
}: TestProvidersProps) {
  return (
    <QueryClientProvider client={queryClient}>
      <AppRouterContext.Provider value={router}>
        <PathnameContext.Provider value={router.pathname}>
          <WizardProvider 
            serviceName={serviceName} 
            initialState={initialWizardState}
          >
            {children}
          </WizardProvider>
        </PathnameContext.Provider>
      </AppRouterContext.Provider>
    </QueryClientProvider>
  );
}

// =============================================================================
// MAIN RENDER FUNCTION
// =============================================================================

/**
 * Enhanced render function for wizard components
 * 
 * Provides comprehensive testing setup with wizard context, React Query client,
 * Next.js router mocking, and MSW integration for realistic component testing.
 * 
 * @param ui - React component to render
 * @param options - Enhanced render options with wizard-specific configuration
 * @returns Enhanced render result with wizard testing utilities
 */
export function renderWizard(
  ui: ReactElement,
  options: WizardRenderOptions = {}
): WizardRenderResult {
  const {
    initialWizardState,
    serviceName = 'test-service',
    queryClient = createTestQueryClient(),
    initialRoute = '/api-connections/database/test-service/generate',
    router: customRouter,
    suppressErrors = true,
    additionalProviders = [],
    user: userOptions = {},
    ...renderOptions
  } = options;
  
  // Create mock router
  const router = customRouter || createMockRouter(initialRoute);
  
  // Set up error suppression if requested
  let originalError: typeof console.error;
  if (suppressErrors) {
    originalError = console.error;
    console.error = vi.fn();
  }
  
  // Create user event instance
  const user = userEvent.setup({
    advanceTimers: userOptions.advanceTimers,
    delay: userOptions.delay
  });
  
  // Compose all providers
  const AllProviders = ({ children }: { children: ReactNode }) => {
    let wrapped = (
      <TestProviders
        queryClient={queryClient}
        router={router}
        initialWizardState={initialWizardState}
        serviceName={serviceName}
      >
        {children}
      </TestProviders>
    );
    
    // Apply additional providers from outside to inside
    for (const Provider of additionalProviders.reverse()) {
      wrapped = <Provider>{wrapped}</Provider>;
    }
    
    return wrapped;
  };
  
  // Render component with providers
  const renderResult = render(ui, {
    wrapper: AllProviders,
    ...renderOptions
  });
  
  // Create wizard state access utilities
  let currentWizardState: WizardState;
  let currentWizardActions: WizardActions;
  
  // Helper component to capture wizard context
  function WizardContextCapture() {
    const { state, actions } = useWizard();
    currentWizardState = state;
    currentWizardActions = actions;
    return null;
  }
  
  // Render the context capture component to get current state
  render(<WizardContextCapture />, { wrapper: AllProviders });
  
  // Create wizard utilities
  const wizard = {
    getState: () => currentWizardState,
    getActions: () => currentWizardActions,
    
    goToStep: async (step: WizardStep) => {
      currentWizardActions.goToStep(step);
      await waitFor(() => {
        render(<WizardContextCapture />, { wrapper: AllProviders });
        expect(currentWizardState.currentStep).toBe(step);
      });
    },
    
    nextStep: async () => {
      const success = await currentWizardActions.nextStep();
      if (success) {
        await waitFor(() => {
          render(<WizardContextCapture />, { wrapper: AllProviders });
          // State should have changed
        });
      }
    },
    
    previousStep: () => {
      currentWizardActions.previousStep();
      render(<WizardContextCapture />, { wrapper: AllProviders });
    },
    
    updateState: (updates: Partial<WizardState>) => {
      currentWizardActions.updateState(updates);
      render(<WizardContextCapture />, { wrapper: AllProviders });
    },
    
    reset: () => {
      currentWizardActions.reset();
      render(<WizardContextCapture />, { wrapper: AllProviders });
    }
  };
  
  // Create utility functions
  const utils = {
    waitForStateUpdate: async (predicate: (state: WizardState) => boolean, timeout = 5000) => {
      await waitFor(
        () => {
          render(<WizardContextCapture />, { wrapper: AllProviders });
          expect(predicate(currentWizardState)).toBe(true);
        },
        { timeout }
      );
    },
    
    waitForLoading: async (timeout = 5000) => {
      await waitFor(
        () => {
          render(<WizardContextCapture />, { wrapper: AllProviders });
          expect(currentWizardState.loading).toBe(false);
        },
        { timeout }
      );
    },
    
    waitForQueries: async (timeout = 5000) => {
      await waitFor(
        () => {
          expect(queryClient.isFetching()).toBe(0);
          expect(queryClient.isMutating()).toBe(0);
        },
        { timeout }
      );
    },
    
    simulateApiDelay: async (ms = 100) => {
      await new Promise(resolve => setTimeout(resolve, ms));
    },
    
    validateAccessibility: () => {
      // Check for required ARIA attributes on interactive elements
      const interactiveElements = renderResult.container.querySelectorAll(
        'button, input, select, textarea, [role="button"], [role="tab"]'
      );
      
      interactiveElements.forEach((element) => {
        if (element.tagName === 'BUTTON' && !element.getAttribute('aria-label') && !element.textContent?.trim()) {
          throw new Error('Button elements must have accessible names');
        }
        
        if (['INPUT', 'SELECT', 'TEXTAREA'].includes(element.tagName)) {
          const id = element.getAttribute('id');
          const ariaLabel = element.getAttribute('aria-label');
          const ariaLabelledBy = element.getAttribute('aria-labelledby');
          
          if (!ariaLabel && !ariaLabelledBy && (!id || !renderResult.container.querySelector(`label[for="${id}"]`))) {
            throw new Error('Form controls must have associated labels');
          }
        }
      });
    }
  };
  
  // Clean up error suppression
  const cleanup = renderResult.unmount;
  renderResult.unmount = () => {
    if (suppressErrors && originalError) {
      console.error = originalError;
    }
    cleanup();
  };
  
  return {
    ...renderResult,
    user,
    router,
    queryClient,
    wizard,
    utils
  };
}

// =============================================================================
// STEP NAVIGATION UTILITIES
// =============================================================================

/**
 * Creates step navigation utilities for wizard testing
 */
export function createStepNavigationUtils(renderResult: WizardRenderResult): StepNavigationUtils {
  const { user, wizard, utils } = renderResult;
  
  return {
    clickNext: async () => {
      const nextButton = screen.getByRole('button', { name: /next|continue|proceed/i });
      await user.click(nextButton);
      await utils.waitForStateUpdate(state => !state.loading);
    },
    
    clickPrevious: async () => {
      const prevButton = screen.getByRole('button', { name: /previous|back/i });
      await user.click(prevButton);
      await utils.waitForStateUpdate(state => !state.loading);
    },
    
    clickStep: async (step: WizardStep) => {
      const stepButton = screen.getByRole('button', { name: new RegExp(step.replace('-', ' '), 'i') });
      await user.click(stepButton);
      await utils.waitForStateUpdate(state => state.currentStep === step);
    },
    
    expectCurrentStep: (step: WizardStep) => {
      const state = wizard.getState();
      expect(state.currentStep).toBe(step);
      
      // Verify UI reflects current step
      const activeStepElement = screen.getByRole('button', { 
        name: new RegExp(step.replace('-', ' '), 'i'),
        current: true
      });
      expect(activeStepElement).toBeInTheDocument();
    },
    
    expectStepAccessible: (step: WizardStep) => {
      const stepButton = screen.getByRole('button', { name: new RegExp(step.replace('-', ' '), 'i') });
      expect(stepButton).toBeEnabled();
      expect(stepButton).not.toHaveAttribute('aria-disabled', 'true');
    },
    
    expectStepCompleted: (step: WizardStep) => {
      const stepElement = screen.getByRole('button', { name: new RegExp(step.replace('-', ' '), 'i') });
      expect(stepElement).toHaveAttribute('data-completed', 'true');
      // Look for completion indicator (checkmark, etc.)
      expect(within(stepElement).getByLabelText(/completed|done|finished/i)).toBeInTheDocument();
    },
    
    getStepIndicators: () => {
      return screen.getAllByRole('button', { name: /table selection|endpoint configuration|generation preview/i });
    },
    
    getProgress: () => {
      const progressBar = screen.getByRole('progressbar');
      const ariaNow = progressBar.getAttribute('aria-valuenow');
      return ariaNow ? parseInt(ariaNow, 10) : 0;
    }
  };
}

// =============================================================================
// MSW TESTING UTILITIES
// =============================================================================

/**
 * MSW testing utilities for wizard component tests
 */
export const mswUtils = {
  /**
   * Simulate API error for testing error states
   */
  simulateApiError: (endpoint: string, status: number, message: string) => {
    mswServer.use(
      // @ts-ignore - MSW types
      window.msw.http.get(endpoint, () => {
        return new Response(JSON.stringify({ error: { message } }), { status });
      })
    );
  },
  
  /**
   * Simulate slow API response for testing loading states
   */
  simulateSlowResponse: (endpoint: string, delay: number) => {
    mswServer.use(
      // @ts-ignore - MSW types
      window.msw.http.get(endpoint, async () => {
        await new Promise(resolve => setTimeout(resolve, delay));
        return new Response(JSON.stringify({ resource: [] }));
      })
    );
  },
  
  /**
   * Reset MSW handlers to default state
   */
  resetHandlers: () => {
    mswServer.resetHandlers();
  },
  
  /**
   * Get request history for verification
   */
  getRequestHistory: () => {
    // This would need to be implemented based on your MSW setup
    // You might need to track requests in a global variable
    return [];
  }
};

// =============================================================================
// ACCESSIBILITY TESTING UTILITIES
// =============================================================================

/**
 * Comprehensive accessibility validation for wizard components
 */
export function validateWizardAccessibility(container: HTMLElement): void {
  // Check for proper heading hierarchy
  const headings = Array.from(container.querySelectorAll('h1, h2, h3, h4, h5, h6'));
  
  if (headings.length > 1) {
    for (let i = 1; i < headings.length; i++) {
      const currentLevel = parseInt(headings[i].tagName[1], 10);
      const previousLevel = parseInt(headings[i - 1].tagName[1], 10);
      
      if (currentLevel > previousLevel + 1) {
        throw new Error(`Heading hierarchy violation: ${headings[i - 1].tagName} followed by ${headings[i].tagName}`);
      }
    }
  }
  
  // Check for proper ARIA landmarks
  const main = container.querySelector('main, [role="main"]');
  if (!main && container.querySelector('form, [role="form"]')) {
    console.warn('Consider wrapping form content in a main landmark');
  }
  
  // Check for proper focus management
  const focusableElements = container.querySelectorAll(
    'button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
  );
  
  if (focusableElements.length === 0) {
    console.warn('No focusable elements found - ensure interactive content is keyboard accessible');
  }
  
  // Check for proper error announcements
  const errorElements = container.querySelectorAll('[role="alert"], [aria-live="assertive"]');
  const errorMessages = container.querySelectorAll('.error, [data-error], .invalid');
  
  if (errorMessages.length > 0 && errorElements.length === 0) {
    console.warn('Error messages found but no ARIA live regions for screen reader announcements');
  }
  
  // Check for proper loading announcements
  const loadingElements = container.querySelectorAll('[role="status"], [aria-live="polite"]');
  const spinners = container.querySelectorAll('[data-loading], .spinner, .loading');
  
  if (spinners.length > 0 && loadingElements.length === 0) {
    console.warn('Loading indicators found but no ARIA live regions for screen reader announcements');
  }
}

// =============================================================================
// CONVENIENCE EXPORTS
// =============================================================================

/**
 * Default export with all utilities
 */
const wizardRenderUtils = {
  renderWizard,
  createWizardTestData,
  createMockServiceSelectionData,
  createMockTableSelectionData,
  createStepNavigationUtils,
  validateWizardAccessibility,
  mswUtils,
  createMockRouter
} as const;

export default wizardRenderUtils;

// Export all utilities for named imports
export {
  renderWizard as render,
  createWizardTestData as createTestData,
  createStepNavigationUtils as createStepUtils,
  validateWizardAccessibility as validateA11y,
  mswUtils
};

// Export types for external use
export type {
  WizardRenderOptions,
  WizardRenderResult,
  MockAppRouter,
  WizardTestDataOptions,
  StepNavigationUtils
};