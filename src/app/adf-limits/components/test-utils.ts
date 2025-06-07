/**
 * ADF Limits Components Testing Utilities
 * 
 * Comprehensive MSW handlers, React Query testing utilities, and mock data factories
 * specifically for the limits management components. Provides realistic API mocking,
 * state management testing support, and custom render functions for isolated component testing.
 * 
 * Features:
 * - MSW handlers for all limits-related API endpoints
 * - React Query testing utilities with cache behavior mocking
 * - Zustand store mock providers for component testing isolation  
 * - React Testing Library wrapper functions with providers
 * - Comprehensive test data factories for limits, users, services, and roles
 * - Connection testing simulation and validation workflows
 * 
 * @fileoverview Testing utilities for adf-limits components
 * @version 1.0.0
 * @since React 19.0.0 / Next.js 15.1+
 */

import { rest, type RequestHandler } from 'msw';
import { render, type RenderOptions } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactElement, ReactNode } from 'react';
import { create } from 'zustand';
import { faker } from '@faker-js/faker';

import type {
  LimitTableRowData,
  LimitConfiguration,
  LimitUsageStats,
  LimitType,
  LimitCounterType,
  LimitPeriodUnit,
  LimitFormState,
  CreateLimitMutationVariables,
  UpdateLimitMutationVariables,
  DeleteLimitMutationVariables,
  BulkLimitMutationVariables
} from '../types';
import type {
  ApiListResponse,
  ApiResourceResponse,
  ApiErrorResponse,
  PaginationMeta
} from '../../../types/api';

// ============================================================================
// MOCK DATA FACTORIES
// ============================================================================

/**
 * Generate realistic mock limit data for testing
 * Creates comprehensive limit configurations with proper relationships
 */
export const mockLimitFactory = {
  /**
   * Create a single limit table row with realistic data
   */
  createLimit: (overrides: Partial<LimitTableRowData> = {}): LimitTableRowData => ({
    id: faker.number.int({ min: 1, max: 10000 }),
    name: faker.hacker.phrase().replace(/\s+/g, '_').toLowerCase(),
    limitType: faker.helpers.arrayElement([
      'api.calls_per_period',
      'api.calls_per_minute',
      'api.calls_per_hour',
      'api.calls_per_day',
      'db.calls_per_period',
      'service.calls_per_period',
      'user.calls_per_period'
    ] as LimitType[]),
    limitRate: `${faker.number.int({ min: 10, max: 10000 })} per ${faker.helpers.arrayElement(['minute', 'hour', 'day'])}`,
    limitCounter: faker.helpers.arrayElement([
      'api.calls_made',
      'db.calls_made',
      'service.calls_made',
      'user.calls_made'
    ] as LimitCounterType[]),
    user: Math.random() > 0.7 ? faker.number.int({ min: 1, max: 100 }) : null,
    service: Math.random() > 0.6 ? faker.number.int({ min: 1, max: 50 }) : null,
    role: Math.random() > 0.8 ? faker.number.int({ min: 1, max: 20 }) : null,
    active: faker.datatype.boolean(),
    description: Math.random() > 0.5 ? faker.lorem.sentence() : undefined,
    createdAt: faker.date.past().toISOString(),
    updatedAt: faker.date.recent().toISOString(),
    createdBy: faker.internet.userName(),
    currentUsage: faker.number.int({ min: 0, max: 1000 }),
    period: {
      value: faker.number.int({ min: 1, max: 24 }),
      unit: faker.helpers.arrayElement(['minute', 'hour', 'day', 'week', 'month'] as LimitPeriodUnit[])
    },
    ...overrides
  }),

  /**
   * Create multiple limits with different configurations
   */
  createLimits: (count: number = 10): LimitTableRowData[] => {
    return Array.from({ length: count }, () => mockLimitFactory.createLimit());
  },

  /**
   * Create a global API limit
   */
  createGlobalLimit: (overrides: Partial<LimitTableRowData> = {}): LimitTableRowData => 
    mockLimitFactory.createLimit({
      limitType: 'api.calls_per_hour',
      limitCounter: 'api.calls_made',
      user: null,
      service: null,
      role: null,
      name: 'global_api_limit',
      ...overrides
    }),

  /**
   * Create a user-specific limit
   */
  createUserLimit: (userId: number, overrides: Partial<LimitTableRowData> = {}): LimitTableRowData =>
    mockLimitFactory.createLimit({
      limitType: 'user.calls_per_period',
      limitCounter: 'user.calls_made',
      user: userId,
      service: null,
      role: null,
      name: `user_${userId}_limit`,
      ...overrides
    }),

  /**
   * Create a service-specific limit
   */
  createServiceLimit: (serviceId: number, overrides: Partial<LimitTableRowData> = {}): LimitTableRowData =>
    mockLimitFactory.createLimit({
      limitType: 'service.calls_per_period',
      limitCounter: 'service.calls_made',
      user: null,
      service: serviceId,
      role: null,
      name: `service_${serviceId}_limit`,
      ...overrides
    }),

  /**
   * Create a role-based limit
   */
  createRoleLimit: (roleId: number, overrides: Partial<LimitTableRowData> = {}): LimitTableRowData =>
    mockLimitFactory.createLimit({
      limitType: 'api.calls_per_period',
      limitCounter: 'api.calls_made',
      user: null,
      service: null,
      role: roleId,
      name: `role_${roleId}_limit`,
      ...overrides
    }),

  /**
   * Create usage statistics for a limit
   */
  createUsageStats: (limitId: number, overrides: Partial<LimitUsageStats> = {}): LimitUsageStats => ({
    limitId,
    currentUsage: faker.number.int({ min: 0, max: 1000 }),
    maxAllowed: faker.number.int({ min: 1000, max: 10000 }),
    usagePercentage: faker.number.float({ min: 0, max: 100, precision: 0.01 }),
    timeUntilReset: faker.number.int({ min: 0, max: 3600 }),
    violations: faker.number.int({ min: 0, max: 10 }),
    history: Array.from({ length: 7 }, (_, i) => ({
      period: faker.date.past({ days: i + 1 }).toISOString(),
      usage: faker.number.int({ min: 0, max: 1000 }),
      violations: faker.number.int({ min: 0, max: 5 })
    })),
    ...overrides
  })
};

/**
 * Generate mock dependent data for form testing
 */
export const mockDependentDataFactory = {
  /**
   * Create mock users for limit assignment
   */
  createUsers: (count: number = 5) => Array.from({ length: count }, (_, i) => ({
    id: i + 1,
    name: faker.person.fullName(),
    email: faker.internet.email(),
    username: faker.internet.userName(),
    active: faker.datatype.boolean(),
    role: faker.helpers.arrayElement(['user', 'admin', 'developer'])
  })),

  /**
   * Create mock services for limit assignment
   */
  createServices: (count: number = 5) => Array.from({ length: count }, (_, i) => ({
    id: i + 1,
    name: `${faker.hacker.noun()}_service`,
    type: faker.helpers.arrayElement(['mysql', 'postgresql', 'mongodb', 'sqlsrv', 'oracle']),
    label: faker.company.name(),
    description: faker.lorem.sentence(),
    active: faker.datatype.boolean(),
    config: {
      host: faker.internet.ip(),
      port: faker.number.int({ min: 1000, max: 9999 }),
      database: faker.database.mongodbObjectId()
    }
  })),

  /**
   * Create mock roles for limit assignment
   */
  createRoles: (count: number = 5) => Array.from({ length: count }, (_, i) => ({
    id: i + 1,
    name: faker.hacker.noun().toLowerCase(),
    description: faker.lorem.sentence(),
    active: faker.datatype.boolean(),
    default_app_id: faker.number.int({ min: 1, max: 10 }),
    role_service_access_by_service_id: {}
  }))
};

// ============================================================================
// MSW HANDLERS FOR LIMITS API
// ============================================================================

/**
 * API base URL for DreamFactory endpoints
 */
const API_BASE = '/api/v2';
const SYSTEM_API_BASE = `${API_BASE}/system`;

/**
 * MSW handlers for limits management API endpoints
 * Provides realistic API behavior for all CRUD operations
 */
export const limitsApiHandlers: RequestHandler[] = [
  // Get limits list with pagination and filtering
  rest.get(`${SYSTEM_API_BASE}/limit`, (req, res, ctx) => {
    const url = new URL(req.url);
    const offset = parseInt(url.searchParams.get('offset') || '0');
    const limit = parseInt(url.searchParams.get('limit') || '25');
    const filter = url.searchParams.get('filter');
    const sort = url.searchParams.get('sort');
    const activeOnly = url.searchParams.get('active');
    const userId = url.searchParams.get('user_id');
    const serviceId = url.searchParams.get('service_id');
    const roleId = url.searchParams.get('role_id');

    // Generate base data
    let limits = mockLimitFactory.createLimits(50);

    // Apply filters
    if (activeOnly === 'true') {
      limits = limits.filter(limit => limit.active);
    }
    if (userId) {
      limits = limits.filter(limit => limit.user === parseInt(userId));
    }
    if (serviceId) {
      limits = limits.filter(limit => limit.service === parseInt(serviceId));
    }
    if (roleId) {
      limits = limits.filter(limit => limit.role === parseInt(roleId));
    }
    if (filter) {
      const filterLower = filter.toLowerCase();
      limits = limits.filter(limit => 
        limit.name.toLowerCase().includes(filterLower) ||
        limit.limitType.includes(filterLower) ||
        (limit.description && limit.description.toLowerCase().includes(filterLower))
      );
    }

    // Apply sorting
    if (sort) {
      const [field, direction = 'asc'] = sort.split(',');
      limits.sort((a, b) => {
        const aVal = (a as any)[field];
        const bVal = (b as any)[field];
        const comparison = aVal < bVal ? -1 : aVal > bVal ? 1 : 0;
        return direction === 'desc' ? -comparison : comparison;
      });
    }

    // Apply pagination
    const total = limits.length;
    const paginatedLimits = limits.slice(offset, offset + limit);

    const response: ApiListResponse<LimitTableRowData> = {
      resource: paginatedLimits,
      meta: {
        count: total,
        offset,
        limit,
        has_next: offset + limit < total,
        has_previous: offset > 0,
        page_count: Math.ceil(total / limit),
        links: {
          first: `${SYSTEM_API_BASE}/limit?offset=0&limit=${limit}`,
          last: `${SYSTEM_API_BASE}/limit?offset=${Math.floor((total - 1) / limit) * limit}&limit=${limit}`,
          ...(offset + limit < total && {
            next: `${SYSTEM_API_BASE}/limit?offset=${offset + limit}&limit=${limit}`
          }),
          ...(offset > 0 && {
            previous: `${SYSTEM_API_BASE}/limit?offset=${Math.max(0, offset - limit)}&limit=${limit}`
          })
        }
      },
      timestamp: new Date().toISOString()
    };

    return res(ctx.status(200), ctx.json(response));
  }),

  // Get single limit by ID
  rest.get(`${SYSTEM_API_BASE}/limit/:id`, (req, res, ctx) => {
    const { id } = req.params;
    const limitId = parseInt(id as string);

    const limit = mockLimitFactory.createLimit({ id: limitId });

    const response: ApiResourceResponse<LimitTableRowData> = {
      resource: limit,
      timestamp: new Date().toISOString()
    };

    return res(ctx.status(200), ctx.json(response));
  }),

  // Create new limit
  rest.post(`${SYSTEM_API_BASE}/limit`, async (req, res, ctx) => {
    const data = await req.json() as CreateLimitMutationVariables;
    
    // Simulate validation delay
    await new Promise(resolve => setTimeout(resolve, 500));

    // Create new limit with generated ID
    const newLimit = mockLimitFactory.createLimit({
      ...data.data,
      id: faker.number.int({ min: 10001, max: 99999 }),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      createdBy: 'test_user'
    });

    const response: ApiResourceResponse<LimitTableRowData> = {
      resource: newLimit,
      timestamp: new Date().toISOString()
    };

    return res(ctx.status(201), ctx.json(response));
  }),

  // Update existing limit
  rest.put(`${SYSTEM_API_BASE}/limit/:id`, async (req, res, ctx) => {
    const { id } = req.params;
    const data = await req.json() as UpdateLimitMutationVariables;
    
    // Simulate validation delay
    await new Promise(resolve => setTimeout(resolve, 300));

    const limitId = parseInt(id as string);
    const updatedLimit = mockLimitFactory.createLimit({
      ...data.data,
      id: limitId,
      updatedAt: new Date().toISOString()
    });

    const response: ApiResourceResponse<LimitTableRowData> = {
      resource: updatedLimit,
      timestamp: new Date().toISOString()
    };

    return res(ctx.status(200), ctx.json(response));
  }),

  // Delete limit
  rest.delete(`${SYSTEM_API_BASE}/limit/:id`, async (req, res, ctx) => {
    const { id } = req.params;
    
    // Simulate deletion delay
    await new Promise(resolve => setTimeout(resolve, 200));

    return res(ctx.status(200), ctx.json({
      success: true,
      message: `Limit ${id} deleted successfully`,
      timestamp: new Date().toISOString()
    }));
  }),

  // Bulk operations
  rest.patch(`${SYSTEM_API_BASE}/limit`, async (req, res, ctx) => {
    const data = await req.json() as BulkLimitMutationVariables;
    
    // Simulate bulk operation delay
    await new Promise(resolve => setTimeout(resolve, 1000));

    const results = data.limitIds.map(id => ({
      id,
      success: Math.random() > 0.1, // 90% success rate
      error: Math.random() > 0.9 ? 'Random test error' : undefined
    }));

    return res(ctx.status(200), ctx.json({
      success: true,
      message: `Bulk ${data.operation} completed`,
      results,
      timestamp: new Date().toISOString()
    }));
  }),

  // Get limit usage statistics
  rest.get(`${SYSTEM_API_BASE}/limit/:id/usage`, (req, res, ctx) => {
    const { id } = req.params;
    const limitId = parseInt(id as string);

    const usageStats = mockLimitFactory.createUsageStats(limitId);

    const response: ApiResourceResponse<LimitUsageStats> = {
      resource: usageStats,
      timestamp: new Date().toISOString()
    };

    return res(ctx.status(200), ctx.json(response));
  }),

  // Test service connection for service limits
  rest.post(`${SYSTEM_API_BASE}/service/:serviceId/test`, async (req, res, ctx) => {
    const { serviceId } = req.params;
    
    // Simulate connection test delay
    await new Promise(resolve => setTimeout(resolve, 2000));

    // 90% success rate for connection tests
    const success = Math.random() > 0.1;

    if (success) {
      return res(ctx.status(200), ctx.json({
        success: true,
        message: `Connection to service ${serviceId} successful`,
        timestamp: new Date().toISOString()
      }));
    } else {
      const errorResponse: ApiErrorResponse = {
        success: false,
        error: {
          code: 'CONNECTION_FAILED',
          message: 'Failed to connect to database service',
          status_code: 400,
          context: {
            service_id: serviceId,
            details: 'Connection timeout after 30 seconds'
          }
        },
        timestamp: new Date().toISOString()
      };
      return res(ctx.status(400), ctx.json(errorResponse));
    }
  }),

  // Get dependent data for forms
  rest.get(`${SYSTEM_API_BASE}/user`, (req, res, ctx) => {
    const users = mockDependentDataFactory.createUsers(20);
    const response: ApiListResponse<any> = {
      resource: users,
      meta: { count: users.length, offset: 0, limit: users.length },
      timestamp: new Date().toISOString()
    };
    return res(ctx.status(200), ctx.json(response));
  }),

  rest.get(`${SYSTEM_API_BASE}/service`, (req, res, ctx) => {
    const services = mockDependentDataFactory.createServices(15);
    const response: ApiListResponse<any> = {
      resource: services,
      meta: { count: services.length, offset: 0, limit: services.length },
      timestamp: new Date().toISOString()
    };
    return res(ctx.status(200), ctx.json(response));
  }),

  rest.get(`${SYSTEM_API_BASE}/role`, (req, res, ctx) => {
    const roles = mockDependentDataFactory.createRoles(10);
    const response: ApiListResponse<any> = {
      resource: roles,
      meta: { count: roles.length, offset: 0, limit: roles.length },
      timestamp: new Date().toISOString()
    };
    return res(ctx.status(200), ctx.json(response));
  })
];

// ============================================================================
// REACT QUERY TESTING UTILITIES
// ============================================================================

/**
 * Create a test QueryClient with optimized settings for testing
 */
export const createTestQueryClient = () => {
  return new QueryClient({
    defaultOptions: {
      queries: {
        // Disable retries in tests
        retry: false,
        // Disable cache time for immediate garbage collection
        cacheTime: 0,
        // Disable background refetching
        refetchOnWindowFocus: false,
        refetchOnMount: false,
        refetchOnReconnect: false,
        // Set stale time to 0 for predictable testing
        staleTime: 0
      },
      mutations: {
        // Disable retries in tests
        retry: false
      }
    },
    // Suppress error logging in tests
    logger: {
      log: () => {},
      warn: () => {},
      error: () => {}
    }
  });
};

/**
 * React Query test utilities for server state testing
 */
export const reactQueryTestUtils = {
  /**
   * Create a QueryClient with cached limits data
   */
  createQueryClientWithLimitsData: (limits: LimitTableRowData[] = []) => {
    const queryClient = createTestQueryClient();
    
    // Pre-populate cache with limits data
    queryClient.setQueryData(['limits'], {
      resource: limits,
      meta: { count: limits.length, offset: 0, limit: limits.length }
    } as ApiListResponse<LimitTableRowData>);

    return queryClient;
  },

  /**
   * Create a QueryClient with specific limit data
   */
  createQueryClientWithLimit: (limit: LimitTableRowData) => {
    const queryClient = createTestQueryClient();
    
    // Pre-populate cache with single limit
    queryClient.setQueryData(['limit', limit.id], {
      resource: limit
    } as ApiResourceResponse<LimitTableRowData>);

    return queryClient;
  },

  /**
   * Create a QueryClient with usage statistics
   */
  createQueryClientWithUsageStats: (limitId: number, stats: LimitUsageStats) => {
    const queryClient = createTestQueryClient();
    
    queryClient.setQueryData(['limit', limitId, 'usage'], {
      resource: stats
    } as ApiResourceResponse<LimitUsageStats>);

    return queryClient;
  },

  /**
   * Clear all React Query caches
   */
  clearAllCaches: (queryClient: QueryClient) => {
    queryClient.clear();
  },

  /**
   * Get cached data from QueryClient
   */
  getCachedData: <T>(queryClient: QueryClient, queryKey: any[]): T | undefined => {
    return queryClient.getQueryData<T>(queryKey);
  },

  /**
   * Set cache data in QueryClient
   */
  setCachedData: <T>(queryClient: QueryClient, queryKey: any[], data: T) => {
    queryClient.setQueryData<T>(queryKey, data);
  },

  /**
   * Invalidate specific queries
   */
  invalidateQueries: async (queryClient: QueryClient, queryKey: any[]) => {
    await queryClient.invalidateQueries({ queryKey });
  }
};

// ============================================================================
// ZUSTAND TESTING UTILITIES
// ============================================================================

/**
 * Mock Zustand store for limits management
 */
export const createMockLimitsStore = (initialState: Partial<any> = {}) => {
  return create<any>()((set, get) => ({
    // Default state
    limits: [],
    selectedLimitIds: [],
    filters: {
      active: undefined,
      search: '',
      limitType: undefined
    },
    pagination: {
      offset: 0,
      limit: 25
    },
    loading: {
      list: false,
      create: false,
      update: false,
      delete: false
    },
    errors: {
      list: null,
      create: null,
      update: null,
      delete: null
    },

    // Actions
    setLimits: (limits: LimitTableRowData[]) => set({ limits }),
    setSelectedLimitIds: (ids: number[]) => set({ selectedLimitIds: ids }),
    setFilters: (filters: any) => set((state: any) => ({ 
      filters: { ...state.filters, ...filters } 
    })),
    setPagination: (pagination: any) => set((state: any) => ({ 
      pagination: { ...state.pagination, ...pagination } 
    })),
    setLoading: (loading: any) => set((state: any) => ({ 
      loading: { ...state.loading, ...loading } 
    })),
    setErrors: (errors: any) => set((state: any) => ({ 
      errors: { ...state.errors, ...errors } 
    })),
    clearSelection: () => set({ selectedLimitIds: [] }),
    clearErrors: () => set({ 
      errors: { list: null, create: null, update: null, delete: null } 
    }),

    // Override with initial state
    ...initialState
  }));
};

/**
 * Zustand testing utilities for state management testing
 */
export const zustandTestUtils = {
  /**
   * Create a mock store with limits data
   */
  createStoreWithLimits: (limits: LimitTableRowData[]) => {
    return createMockLimitsStore({ limits });
  },

  /**
   * Create a mock store with loading states
   */
  createStoreWithLoading: (loadingStates: Record<string, boolean>) => {
    return createMockLimitsStore({ 
      loading: { list: false, create: false, update: false, delete: false, ...loadingStates }
    });
  },

  /**
   * Create a mock store with error states
   */
  createStoreWithErrors: (errors: Record<string, any>) => {
    return createMockLimitsStore({ 
      errors: { list: null, create: null, update: null, delete: null, ...errors }
    });
  },

  /**
   * Create a mock store with selected items
   */
  createStoreWithSelection: (selectedIds: number[]) => {
    return createMockLimitsStore({ selectedLimitIds: selectedIds });
  },

  /**
   * Create a mock store with filters applied
   */
  createStoreWithFilters: (filters: any) => {
    return createMockLimitsStore({ 
      filters: { active: undefined, search: '', limitType: undefined, ...filters }
    });
  }
};

// ============================================================================
// REACT TESTING LIBRARY UTILITIES
// ============================================================================

/**
 * Custom render options with providers
 */
interface CustomRenderOptions extends Omit<RenderOptions, 'wrapper'> {
  /** Custom QueryClient for React Query */
  queryClient?: QueryClient;
  /** Custom Zustand store */
  store?: any;
  /** Initial route for router */
  initialRoute?: string;
  /** Mock user session */
  user?: any;
}

/**
 * Create a wrapper component with all necessary providers
 */
const createWrapper = ({
  queryClient = createTestQueryClient(),
  store,
  initialRoute = '/',
  user
}: CustomRenderOptions = {}) => {
  return ({ children }: { children: ReactNode }) => {
    return (
      <QueryClientProvider client={queryClient}>
        {children}
      </QueryClientProvider>
    );
  };
};

/**
 * Custom render function with providers for component testing
 */
export const renderWithProviders = (
  ui: ReactElement,
  options: CustomRenderOptions = {}
) => {
  const { queryClient, store, initialRoute, user, ...renderOptions } = options;

  const Wrapper = createWrapper({ queryClient, store, initialRoute, user });

  return {
    ...render(ui, { wrapper: Wrapper, ...renderOptions }),
    // Return utilities for further testing
    queryClient: queryClient || createTestQueryClient(),
    store: store || createMockLimitsStore()
  };
};

/**
 * Render with pre-loaded limits data
 */
export const renderWithLimitsData = (
  ui: ReactElement,
  limits: LimitTableRowData[] = [],
  options: CustomRenderOptions = {}
) => {
  const queryClient = reactQueryTestUtils.createQueryClientWithLimitsData(limits);
  const store = zustandTestUtils.createStoreWithLimits(limits);

  return renderWithProviders(ui, { 
    queryClient, 
    store, 
    ...options 
  });
};

/**
 * Render with loading state
 */
export const renderWithLoadingState = (
  ui: ReactElement,
  loadingStates: Record<string, boolean> = { list: true },
  options: CustomRenderOptions = {}
) => {
  const store = zustandTestUtils.createStoreWithLoading(loadingStates);

  return renderWithProviders(ui, { 
    store, 
    ...options 
  });
};

/**
 * Render with error state
 */
export const renderWithErrorState = (
  ui: ReactElement,
  errors: Record<string, any> = { list: new Error('Test error') },
  options: CustomRenderOptions = {}
) => {
  const store = zustandTestUtils.createStoreWithErrors(errors);

  return renderWithProviders(ui, { 
    store, 
    ...options 
  });
};

// ============================================================================
// FORM TESTING UTILITIES
// ============================================================================

/**
 * Mock form state factory for testing form components
 */
export const mockFormStateFactory = {
  /**
   * Create a default form state
   */
  createFormState: (overrides: Partial<LimitFormState> = {}): LimitFormState => ({
    data: {},
    isSubmitting: false,
    isValidating: false,
    isDirty: false,
    isTouched: false,
    isValid: true,
    errors: {},
    fieldStates: {},
    mode: 'create',
    dependentDataLoading: {
      users: false,
      services: false,
      roles: false
    },
    fieldOptions: {
      users: mockDependentDataFactory.createUsers(),
      services: mockDependentDataFactory.createServices(),
      roles: mockDependentDataFactory.createRoles()
    },
    ...overrides
  }),

  /**
   * Create form state with validation errors
   */
  createFormStateWithErrors: (errors: Record<string, any>): LimitFormState => 
    mockFormStateFactory.createFormState({
      isValid: false,
      errors,
      fieldStates: Object.keys(errors).reduce((acc, key) => ({
        ...acc,
        [key]: { hasError: true, error: errors[key], touched: true }
      }), {})
    }),

  /**
   * Create form state with loading dependent data
   */
  createFormStateWithLoading: (): LimitFormState => 
    mockFormStateFactory.createFormState({
      dependentDataLoading: {
        users: true,
        services: true,
        roles: true
      },
      fieldOptions: {
        users: [],
        services: [],
        roles: []
      }
    }),

  /**
   * Create form state for editing
   */
  createEditFormState: (limit: LimitTableRowData): LimitFormState => 
    mockFormStateFactory.createFormState({
      mode: 'edit',
      data: limit,
      isDirty: false,
      isTouched: false
    })
};

/**
 * Test scenario builders for common testing patterns
 */
export const testScenarios = {
  /**
   * Empty limits list scenario
   */
  emptyLimitsList: () => ({
    limits: [],
    loading: false,
    error: null
  }),

  /**
   * Populated limits list scenario
   */
  populatedLimitsList: (count: number = 10) => ({
    limits: mockLimitFactory.createLimits(count),
    loading: false,
    error: null
  }),

  /**
   * Loading limits list scenario
   */
  loadingLimitsList: () => ({
    limits: [],
    loading: true,
    error: null
  }),

  /**
   * Error loading limits scenario
   */
  errorLimitsList: (error: string = 'Failed to load limits') => ({
    limits: [],
    loading: false,
    error: new Error(error)
  }),

  /**
   * Form submission scenarios
   */
  formSubmissionSuccess: () => ({
    isSubmitting: false,
    errors: {},
    lastSubmissionSuccess: true
  }),

  formSubmissionError: (errors: Record<string, string>) => ({
    isSubmitting: false,
    errors,
    lastSubmissionSuccess: false
  }),

  formSubmissionLoading: () => ({
    isSubmitting: true,
    errors: {},
    lastSubmissionSuccess: null
  })
};

// ============================================================================
// INTEGRATION TEST UTILITIES
// ============================================================================

/**
 * Utilities for integration testing with MSW
 */
export const integrationTestUtils = {
  /**
   * Wait for React Query to settle
   */
  waitForQueryToSettle: async (queryClient: QueryClient) => {
    await new Promise(resolve => {
      const unsubscribe = queryClient.getQueryCache().subscribe(() => {
        if (queryClient.isFetching() === 0) {
          unsubscribe();
          resolve(void 0);
        }
      });
    });
  },

  /**
   * Trigger a mutation and wait for completion
   */
  triggerMutationAndWait: async (queryClient: QueryClient, mutationFn: () => Promise<any>) => {
    const promise = mutationFn();
    await integrationTestUtils.waitForQueryToSettle(queryClient);
    return promise;
  },

  /**
   * Setup MSW handlers for a test scenario
   */
  setupHandlersForScenario: (scenario: 'success' | 'error' | 'loading', handlers: RequestHandler[]) => {
    // This would be used with MSW's server.use() in individual tests
    return handlers;
  }
};

// ============================================================================
// EXPORTS
// ============================================================================

// Export all utilities for easy importing
export {
  // Mock factories
  mockLimitFactory,
  mockDependentDataFactory,
  mockFormStateFactory,
  
  // MSW handlers
  limitsApiHandlers,
  
  // React Query utilities
  createTestQueryClient,
  reactQueryTestUtils,
  
  // Zustand utilities
  createMockLimitsStore,
  zustandTestUtils,
  
  // Testing Library utilities
  renderWithProviders,
  renderWithLimitsData,
  renderWithLoadingState,
  renderWithErrorState,
  
  // Test scenarios
  testScenarios,
  
  // Integration utilities
  integrationTestUtils
};

// Default export provides the most commonly used handlers
export default limitsApiHandlers;