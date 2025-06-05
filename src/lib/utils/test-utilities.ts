/**
 * @fileoverview Vitest test configuration utilities and mock data for React component testing.
 * 
 * This module provides comprehensive testing utilities that replace Angular TestBed configuration
 * with modern React testing patterns using Vitest, React Testing Library, and MSW. It enables
 * standardized test setup with MSW mocking, authentication context, and mock table metadata
 * for schema testing scenarios while maintaining 90%+ code coverage targets.
 * 
 * Key Features:
 * - Vitest + React Testing Library integration
 * - MSW (Mock Service Worker) for realistic API mocking
 * - Next.js router context mocking 
 * - Authentication state management for testing
 * - Comprehensive mock data for DreamFactory schema entities
 * - React Hook Form and TanStack React Query test utilities
 * - Accessibility testing helpers with WCAG 2.1 AA compliance
 * 
 * @version 1.0.0
 * @author DreamFactory Team
 */

import { ReactElement, ReactNode } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, RenderOptions } from '@testing-library/react';
import { vi, MockedFunction } from 'vitest';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';

// =============================================================================
// TYPE DEFINITIONS
// =============================================================================

/**
 * Configuration options for test setup replacing Angular TestBed module configuration
 */
export interface TestConfig {
  /** Query client for TanStack React Query testing */
  queryClient?: QueryClient;
  /** Mock router parameters for Next.js routing */
  routerMock?: Partial<NextRouterMock>;
  /** Authentication context state for testing */
  authState?: MockAuthState;
  /** Theme context for testing UI variations */
  theme?: 'light' | 'dark';
  /** Locale for internationalization testing */
  locale?: string;
  /** Custom providers to wrap components */
  providers?: React.ComponentType<{ children: ReactNode }>[];
  /** MSW server setup options */
  mswOptions?: MSWSetupOptions;
}

/**
 * Next.js router mock configuration replacing Angular ActivatedRoute mocking
 */
export interface NextRouterMock {
  push: MockedFunction<any>;
  replace: MockedFunction<any>;
  prefetch: MockedFunction<any>;
  back: MockedFunction<any>;
  forward: MockedFunction<any>;
  refresh: MockedFunction<any>;
  pathname: string;
  query: Record<string, string | string[]>;
  searchParams: URLSearchParams;
  asPath: string;
}

/**
 * Authentication state mock replacing Angular AuthService testing
 */
export interface MockAuthState {
  isAuthenticated: boolean;
  user: {
    id: number;
    email: string;
    firstName: string;
    lastName: string;
    role: string;
    permissions: string[];
  } | null;
  session: {
    token: string;
    expiresAt: Date;
  } | null;
}

/**
 * MSW setup options for API mocking configuration
 */
export interface MSWSetupOptions {
  /** Enable/disable MSW for this test */
  enabled?: boolean;
  /** Custom handlers to add */
  handlers?: any[];
  /** API base URL override */
  baseUrl?: string;
  /** Authentication token for mock requests */
  authToken?: string;
}

/**
 * Custom render options extending React Testing Library
 */
export interface CustomRenderOptions extends Omit<RenderOptions, 'wrapper'> {
  testConfig?: TestConfig;
}

// =============================================================================
// MOCK DATA - MAINTAINING BACKWARD COMPATIBILITY
// =============================================================================

/**
 * Mock table details data structure maintained for backward compatibility with existing tests.
 * This structure represents a complete database table schema with fields, relationships,
 * and constraints as returned by DreamFactory schema discovery API.
 */
export const mockTableDetailsData = {
  alias: 'test-table',
  name: 'test-table',
  label: 'label',
  description: 'desc',
  native: [],
  plural: 'labels',
  is_view: false,
  primary_key: ['ja'],
  name_field: null,
  field: [
    {
      alias: 'isActive',
      name: 'active',
      label: 'active',
      description: null,
      native: [],
      type: 'boolean',
      db_type: 'tinyint(1)',
      length: 1,
      precision: null,
      scale: null,
      default: true,
      required: false,
      allow_null: false,
      fixed_length: false,
      supports_multibyte: false,
      auto_increment: false,
      is_primary_key: false,
      is_unique: false,
      is_index: false,
      is_foreign_key: false,
      ref_table: null,
      ref_field: null,
      ref_on_update: null,
      ref_on_delete: null,
      picklist: null,
      validation: ['{"success": false}'],
      db_function: [
        {
          use: ['SELECT', 'FILTER'],
          function: 'upper(fieldname)',
        },
        {
          use: ['UPDATE'],
          function: 'max(fieldname)',
        },
      ],
      is_virtual: false,
      is_aggregate: false,
    },
    {
      alias: 'test',
      name: 'another',
      label: 'Another',
      description: 'test',
      native: [],
      type: 'integer',
      db_type: 'int(11)',
      length: 11,
      precision: null,
      scale: null,
      default: 0,
      required: false,
      allow_null: true,
      fixed_length: false,
      supports_multibyte: false,
      auto_increment: false,
      is_primary_key: false,
      is_unique: false,
      is_index: false,
      is_foreign_key: false,
      ref_table: null,
      ref_field: null,
      ref_on_update: null,
      ref_on_delete: null,
      picklist: ['1', '2', '3'],
      validation: null,
      db_function: null,
      is_virtual: false,
      is_aggregate: false,
    },
    {
      alias: '',
      name: 'game',
      label: 'game',
      description: null,
      native: [],
      type: 'user_id',
      db_type: 'int(11)',
      length: 11,
      precision: null,
      scale: null,
      default: null,
      required: true,
      allow_null: false,
      fixed_length: false,
      supports_multibyte: false,
      auto_increment: false,
      is_primary_key: false,
      is_unique: true,
      is_index: false,
      is_foreign_key: false,
      ref_table: null,
      ref_field: null,
      ref_on_update: null,
      ref_on_delete: null,
      picklist: null,
      validation: null,
      db_function: [
        {
          use: ['filter', 'insert'],
          function: 'upper(fieldname)',
        },
        {
          use: ['select', 'filter', 'insert', 'update'],
          function: 'upper(fieldname)',
        },
        {
          use: ['update'],
          function: 'upper(fieldname)',
        },
      ],
      is_virtual: false,
      is_aggregate: false,
    },
    {
      alias: null,
      name: 'ja',
      label: 'Ja',
      description: null,
      native: [],
      type: 'id',
      db_type: 'int(11)',
      length: 11,
      precision: null,
      scale: null,
      default: null,
      required: false,
      allow_null: false,
      fixed_length: false,
      supports_multibyte: false,
      auto_increment: true,
      is_primary_key: true,
      is_unique: true,
      is_index: false,
      is_foreign_key: false,
      ref_table: null,
      ref_field: null,
      ref_on_update: null,
      ref_on_delete: null,
      picklist: null,
      validation: null,
      db_function: null,
      is_virtual: false,
      is_aggregate: false,
    },
  ],
  related: [
    {
      alias: 'test-relationship',
      name: 'app_by_is_active',
      label: 'label-test-relationship',
      description: null,
      native: [],
      type: 'has_one',
      field: 'active',
      is_virtual: true,
      ref_service_id: 45,
      ref_table: 'app',
      ref_field: 'is_active',
      ref_on_update: null,
      ref_on_delete: null,
      junction_service_id: null,
      junction_table: null,
      junction_field: null,
      junction_ref_field: null,
      always_fetch: false,
      flatten: false,
      flatten_drop_prefix: false,
    },
  ],
  constraints: {
    primary: {
      constraint_type: 'PRIMARY KEY',
      constraint_schema: 'dreamfactory',
      constraint_name: 'PRIMARY',
      table_schema: 'dreamfactory',
      table_name: 'test-table',
      column_name: 'ja',
      referenced_table_schema: null,
      referenced_table_name: null,
      referenced_column_name: null,
      update_rule: null,
      delete_rule: null,
    },
    game: {
      constraint_type: 'UNIQUE',
      constraint_schema: 'dreamfactory',
      constraint_name: 'game',
      table_schema: 'dreamfactory',
      table_name: 'test-table',
      column_name: 'game',
      referenced_table_schema: null,
      referenced_table_name: null,
      referenced_column_name: null,
      update_rule: null,
      delete_rule: null,
    },
    undx_dreamfactory_test_table_game: {
      constraint_type: 'UNIQUE',
      constraint_schema: 'dreamfactory',
      constraint_name: 'undx_dreamfactory_test-table_game',
      table_schema: 'dreamfactory',
      table_name: 'test-table',
      column_name: 'game',
      referenced_table_schema: null,
      referenced_table_name: null,
      referenced_column_name: null,
      update_rule: null,
      delete_rule: null,
    },
    undx_dreamfactory_test_table_ja: {
      constraint_type: 'UNIQUE',
      constraint_schema: 'dreamfactory',
      constraint_name: 'undx_dreamfactory_test-table_ja',
      table_schema: 'dreamfactory',
      table_name: 'test-table',
      column_name: 'ja',
      referenced_table_schema: null,
      referenced_table_name: null,
      referenced_column_name: null,
      update_rule: null,
      delete_rule: null,
    },
  },
  access: 31,
} as const;

/**
 * Additional mock data for comprehensive testing scenarios
 */
export const mockDatabaseService = {
  id: 1,
  name: 'test-db',
  label: 'Test Database',
  description: 'Test database service for development',
  type: 'mysql',
  is_active: true,
  config: {
    host: 'localhost',
    port: 3306,
    database: 'test_db',
    username: 'test_user',
    password: '***',
    charset: 'utf8mb4',
    collation: 'utf8mb4_unicode_ci',
    strict: true,
  },
  service_doc_by_service_id: {
    content: 'API documentation content',
    format: 'html',
  },
  created_date: '2024-01-01T00:00:00Z',
  last_modified_date: '2024-01-01T00:00:00Z',
  created_by_id: 1,
  last_modified_by_id: 1,
} as const;

export const mockSchemaData = {
  tables: [
    {
      name: 'users',
      label: 'Users',
      description: 'User accounts table',
      field_count: 5,
      record_count: 100,
      is_view: false,
    },
    {
      name: 'products',
      label: 'Products',
      description: 'Product catalog table',
      field_count: 8,
      record_count: 250,
      is_view: false,
    },
  ],
  views: [
    {
      name: 'user_summary',
      label: 'User Summary',
      description: 'Summary view of user data',
      field_count: 3,
      record_count: 100,
      is_view: true,
    },
  ],
} as const;

// =============================================================================
// MOCK FUNCTIONS AND FACTORIES
// =============================================================================

/**
 * Creates a default Next.js router mock replacing Angular ActivatedRoute mocking
 */
export const createMockRouter = (overrides: Partial<NextRouterMock> = {}): NextRouterMock => ({
  push: vi.fn().mockResolvedValue(true),
  replace: vi.fn().mockResolvedValue(true),
  prefetch: vi.fn().mockResolvedValue(undefined),
  back: vi.fn(),
  forward: vi.fn(),
  refresh: vi.fn(),
  pathname: '/',
  query: {},
  searchParams: new URLSearchParams(),
  asPath: '/',
  ...overrides,
});

/**
 * Creates a default authentication state mock
 */
export const createMockAuthState = (overrides: Partial<MockAuthState> = {}): MockAuthState => ({
  isAuthenticated: true,
  user: {
    id: 1,
    email: 'test@example.com',
    firstName: 'Test',
    lastName: 'User',
    role: 'admin',
    permissions: ['database:read', 'database:write', 'schema:read'],
  },
  session: {
    token: 'mock-jwt-token',
    expiresAt: new Date(Date.now() + 3600000), // 1 hour from now
  },
  ...overrides,
});

/**
 * Creates a fresh QueryClient instance for testing with optimal configuration
 */
export const createTestQueryClient = (): QueryClient => {
  return new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        gcTime: 0,
        staleTime: 0,
      },
      mutations: {
        retry: false,
      },
    },
  });
};

// =============================================================================
// MOCK SETUP FUNCTIONS
// =============================================================================

/**
 * Sets up Next.js router mocks replacing Angular ActivatedRoute testing patterns
 */
export const setupNextRouterMocks = (routerMock: NextRouterMock = createMockRouter()): void => {
  vi.mock('next/navigation', () => ({
    useRouter: vi.fn(() => ({
      push: routerMock.push,
      replace: routerMock.replace,
      prefetch: routerMock.prefetch,
      back: routerMock.back,
      forward: routerMock.forward,
      refresh: routerMock.refresh,
    })),
    usePathname: vi.fn(() => routerMock.pathname),
    useSearchParams: vi.fn(() => routerMock.searchParams),
    useParams: vi.fn(() => routerMock.query),
  }));
};

/**
 * Sets up MSW server for API mocking during tests
 */
export const setupMSWServer = (options: MSWSetupOptions = {}): void => {
  const { enabled = true, handlers = [], baseUrl = 'http://localhost:3000' } = options;
  
  if (!enabled) return;

  // MSW server setup will be handled by the global test setup
  // This function provides a standardized interface for test-specific configuration
  global.__MSW_OPTIONS__ = {
    baseUrl,
    handlers,
    authToken: options.authToken || 'mock-token',
  };
};

/**
 * Sets up authentication mocks for testing components that require auth context
 */
export const setupAuthMocks = (authState: MockAuthState = createMockAuthState()): void => {
  vi.mock('../auth/session', () => ({
    getSession: vi.fn().mockResolvedValue(authState.session),
    isAuthenticated: vi.fn().mockReturnValue(authState.isAuthenticated),
    getCurrentUser: vi.fn().mockResolvedValue(authState.user),
  }));
};

// =============================================================================
// TEST CONFIGURATION FACTORY
// =============================================================================

/**
 * Creates standardized test configuration replacing Angular TestBed setup.
 * This function provides a comprehensive testing environment with all necessary
 * providers and mocks for React component testing with Vitest.
 * 
 * @param component - React component to test (replaces Angular componentName)
 * @param testConfig - Test configuration options
 * @returns Test configuration object with providers and mocks
 * 
 * @example
 * ```typescript
 * // Basic component testing
 * const config = createTestConfig(DatabaseServiceList, {
 *   authState: createMockAuthState({ isAuthenticated: true }),
 *   routerMock: createMockRouter({ pathname: '/api-connections/database' })
 * });
 * 
 * // Testing with custom query client
 * const queryClient = createTestQueryClient();
 * const config = createTestConfig(SchemaDiscovery, {
 *   queryClient,
 *   mswOptions: { enabled: true, authToken: 'custom-token' }
 * });
 * ```
 */
export const createTestConfig = (
  component: React.ComponentType<any>,
  testConfig: TestConfig = {}
): {
  component: React.ComponentType<any>;
  queryClient: QueryClient;
  routerMock: NextRouterMock;
  authState: MockAuthState;
  providers: React.ComponentType<{ children: ReactNode }>[];
  setup: () => void;
  cleanup: () => void;
} => {
  const {
    queryClient = createTestQueryClient(),
    routerMock = createMockRouter(),
    authState = createMockAuthState(),
    theme = 'light',
    locale = 'en',
    providers = [],
    mswOptions = { enabled: true },
  } = testConfig;

  // Setup function to initialize all mocks and providers
  const setup = (): void => {
    setupNextRouterMocks(routerMock);
    setupAuthMocks(authState);
    setupMSWServer(mswOptions);
  };

  // Cleanup function to reset mocks after tests
  const cleanup = (): void => {
    vi.clearAllMocks();
    queryClient.clear();
  };

  // Base providers that wrap components for testing
  const baseProviders = [
    ({ children }: { children: ReactNode }) => (
      <QueryClientProvider client={queryClient}>
        {children}
      </QueryClientProvider>
    ),
    ...providers,
  ];

  return {
    component,
    queryClient,
    routerMock,
    authState,
    providers: baseProviders,
    setup,
    cleanup,
  };
};

// =============================================================================
// CUSTOM RENDER UTILITIES
// =============================================================================

/**
 * Custom render function that wraps components with all necessary providers.
 * This replaces Angular TestBed.configureTestingModule() and TestBed.createComponent().
 * 
 * @param ui - React element to render
 * @param options - Render options including test configuration
 * @returns Enhanced render result with custom utilities
 * 
 * @example
 * ```typescript
 * // Basic component rendering
 * const { getByRole, queryByText } = renderWithProviders(
 *   <DatabaseServiceForm onSubmit={mockSubmit} />
 * );
 * 
 * // Rendering with custom test configuration
 * const { getByRole, queryClient } = renderWithProviders(
 *   <SchemaDiscovery serviceId="test-db" />,
 *   {
 *     testConfig: {
 *       authState: createMockAuthState({ isAuthenticated: false }),
 *       routerMock: createMockRouter({ pathname: '/login' })
 *     }
 *   }
 * );
 * ```
 */
export const renderWithProviders = (
  ui: ReactElement,
  options: CustomRenderOptions = {}
): ReturnType<typeof render> & {
  queryClient: QueryClient;
  routerMock: NextRouterMock;
  authState: MockAuthState;
} => {
  const { testConfig = {}, ...renderOptions } = options;
  
  const config = createTestConfig(() => null, testConfig);
  
  // Execute setup
  config.setup();

  // Create wrapper with all providers
  const Wrapper = ({ children }: { children: ReactNode }) => {
    return config.providers.reduce(
      (acc, Provider) => <Provider>{acc}</Provider>,
      children as ReactElement
    );
  };

  const renderResult = render(ui, {
    wrapper: Wrapper,
    ...renderOptions,
  });

  return {
    ...renderResult,
    queryClient: config.queryClient,
    routerMock: config.routerMock,
    authState: config.authState,
  };
};

/**
 * Render function specifically for testing forms with React Hook Form
 */
export const renderFormWithProviders = (
  ui: ReactElement,
  options: CustomRenderOptions = {}
): ReturnType<typeof renderWithProviders> => {
  return renderWithProviders(ui, {
    ...options,
    testConfig: {
      ...options.testConfig,
      // Add form-specific providers if needed
    },
  });
};

/**
 * Render function specifically for testing components with TanStack React Query
 */
export const renderWithQuery = (
  ui: ReactElement,
  queryClient?: QueryClient,
  options: Omit<CustomRenderOptions, 'testConfig'> = {}
): ReturnType<typeof renderWithProviders> => {
  return renderWithProviders(ui, {
    ...options,
    testConfig: {
      queryClient: queryClient || createTestQueryClient(),
    },
  });
};

// =============================================================================
// UTILITY FUNCTIONS FOR COMMON TEST SCENARIOS
// =============================================================================

/**
 * Waits for React Query to finish all pending operations
 */
export const waitForQueryToFinish = async (queryClient: QueryClient): Promise<void> => {
  await queryClient.refetchQueries();
  // Wait for any pending queries to settle
  await new Promise(resolve => setTimeout(resolve, 0));
};

/**
 * Simulates user authentication for testing protected components
 */
export const simulateAuthentication = (authState: Partial<MockAuthState> = {}): void => {
  const fullAuthState = createMockAuthState(authState);
  setupAuthMocks(fullAuthState);
};

/**
 * Simulates navigation for testing router-dependent components
 */
export const simulateNavigation = (pathname: string, query: Record<string, string> = {}): void => {
  const routerMock = createMockRouter({
    pathname,
    query,
    searchParams: new URLSearchParams(query),
  });
  setupNextRouterMocks(routerMock);
};

/**
 * Helper function to test form validation scenarios
 */
export const createFormValidationTest = (
  fieldName: string,
  invalidValue: any,
  expectedErrorMessage: string
) => {
  return {
    fieldName,
    invalidValue,
    expectedErrorMessage,
    testName: `should show error for invalid ${fieldName}`,
  };
};

/**
 * Helper function to create accessibility test configurations
 */
export const createA11yTestConfig = (): Partial<TestConfig> => ({
  theme: 'light', // Test with default theme
  locale: 'en',
  // Additional a11y-specific configuration can be added here
});

// =============================================================================
// EXPORT ALL UTILITIES
// =============================================================================

export default {
  // Main configuration functions
  createTestConfig,
  renderWithProviders,
  renderFormWithProviders,
  renderWithQuery,
  
  // Mock factories
  createMockRouter,
  createMockAuthState,
  createTestQueryClient,
  
  // Setup functions
  setupNextRouterMocks,
  setupMSWServer,
  setupAuthMocks,
  
  // Mock data
  mockTableDetailsData,
  mockDatabaseService,
  mockSchemaData,
  
  // Utility functions
  waitForQueryToFinish,
  simulateAuthentication,
  simulateNavigation,
  createFormValidationTest,
  createA11yTestConfig,
};