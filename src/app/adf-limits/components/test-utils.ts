/**
 * Testing Utilities for ADF Limits Components
 * 
 * Provides comprehensive testing utilities including MSW request handlers for realistic API mocking,
 * React Query testing patterns, Zustand store mocking, and specialized data factories for limits
 * management testing scenarios. Replaces Angular TestBed patterns with React Testing Library
 * best practices per Section 3.2.5 development tools requirements.
 * 
 * Features:
 * - MSW handlers for browser and Node API mocking per Section 3.2.5 development tools
 * - React Query testing utilities for server state testing per Section 3.2.2 state management
 * - Zustand testing utilities for global state management testing per Section 3.2.2 state management
 * - React Testing Library custom render functions with providers per Section 7.1.2 testing configuration
 * - Comprehensive mock data generation for limits management scenarios per testing requirements
 * 
 * @author DreamFactory Admin Interface Team
 * @version React 19/Next.js 15.1 Migration
 * @since 2024-12-19
 */

import { http, HttpResponse } from 'msw'
import { QueryClient } from '@tanstack/react-query'
import { render, RenderOptions, screen } from '@testing-library/react'
import { userEvent } from '@testing-library/user-event'
import { ReactElement, ReactNode } from 'react'
import { 
  LimitTableRowData,
  LimitType,
  LimitCounter,
  CreateLimitFormData,
  EditLimitFormData,
  LimitMetadata,
  AlertConfiguration,
  LIMITS_QUERY_KEYS
} from '../types'
import {
  ApiListResponse,
  ApiCreateResponse,
  ApiUpdateResponse,
  ApiDeleteResponse,
  ApiErrorResponse,
  PaginationMeta,
  ApiRequestOptions
} from '@/types/api'

// =============================================================================
// MOCK DATA FACTORIES AND GENERATORS
// =============================================================================

/**
 * Factory for generating realistic limit table row data
 * 
 * Creates comprehensive test data with all required fields and optional metadata
 * for testing various limit management scenarios including user, service, and role-based limits.
 */
export const createMockLimit = (overrides: Partial<LimitTableRowData> = {}): LimitTableRowData => {
  const id = overrides.id ?? Math.floor(Math.random() * 1000) + 1
  const limitType = overrides.limitType ?? LimitType.ENDPOINT
  
  // Generate appropriate scope values based on limit type
  const getDefaultScopeValues = (type: LimitType) => {
    switch (type) {
      case LimitType.USER:
        return { user: Math.floor(Math.random() * 100) + 1, service: null, role: null }
      case LimitType.SERVICE:
        return { user: null, service: Math.floor(Math.random() * 50) + 1, role: null }
      case LimitType.ROLE:
        return { user: null, service: null, role: Math.floor(Math.random() * 20) + 1 }
      case LimitType.GLOBAL:
      case LimitType.IP:
        return { user: null, service: null, role: null }
      default:
        return { user: null, service: Math.floor(Math.random() * 50) + 1, role: null }
    }
  }

  const defaultScopeValues = getDefaultScopeValues(limitType)
  const now = new Date().toISOString()

  return {
    id,
    name: `Test Limit ${id}`,
    limitType,
    limitRate: '100/minute',
    limitCounter: LimitCounter.REQUEST,
    user: overrides.user !== undefined ? overrides.user : defaultScopeValues.user,
    service: overrides.service !== undefined ? overrides.service : defaultScopeValues.service,
    role: overrides.role !== undefined ? overrides.role : defaultScopeValues.role,
    active: true,
    createdAt: now,
    updatedAt: now,
    createdBy: 'test-user@example.com',
    metadata: {
      description: `Test limit for ${limitType}`,
      tags: ['test', 'automation'],
      priority: 5,
      customHeaders: {
        'X-Rate-Limit-Source': 'test-environment'
      },
      alertConfig: {
        enabled: true,
        warningThreshold: 80,
        criticalThreshold: 95,
        emailAddresses: ['admin@example.com']
      }
    },
    ...overrides
  }
}

/**
 * Factory for generating realistic pagination metadata
 * 
 * Creates pagination data with configurable parameters for testing
 * different list view scenarios and infinite scroll patterns.
 */
export const createMockPagination = (overrides: Partial<PaginationMeta> = {}): PaginationMeta => ({
  count: 25,
  limit: 25,
  offset: 0,
  total: 150,
  has_more: true,
  next_cursor: 'next-cursor-token',
  prev_cursor: null,
  ...overrides
})

/**
 * Factory for generating paginated limits list responses
 * 
 * Creates realistic API responses with multiple limit records and pagination metadata
 * for testing list components and infinite loading scenarios.
 */
export const createMockLimitsList = (
  count: number = 5,
  paginationOverrides: Partial<PaginationMeta> = {},
  limitOverrides: Partial<LimitTableRowData> = {}
): ApiListResponse<LimitTableRowData> => {
  const limits = Array.from({ length: count }, (_, index) =>
    createMockLimit({
      id: index + 1,
      name: `Limit ${index + 1}`,
      limitType: Object.values(LimitType)[index % Object.values(LimitType).length] as LimitType,
      limitCounter: Object.values(LimitCounter)[index % Object.values(LimitCounter).length] as LimitCounter,
      active: index % 2 === 0, // Alternate active/inactive
      ...limitOverrides
    })
  )

  return {
    resource: limits,
    meta: createMockPagination({
      count,
      total: Math.max(count, 150),
      ...paginationOverrides
    })
  }
}

/**
 * Factory for generating form data for limit creation/editing
 * 
 * Creates valid form data objects that can be used for testing
 * form submission, validation, and error handling scenarios.
 */
export const createMockFormData = (
  mode: 'create' | 'edit' = 'create',
  overrides: Partial<CreateLimitFormData | EditLimitFormData> = {}
): CreateLimitFormData | EditLimitFormData => {
  const baseData: CreateLimitFormData = {
    name: 'Test API Limit',
    limitType: LimitType.ENDPOINT,
    limitRate: '1000/hour',
    limitCounter: LimitCounter.SLIDING_WINDOW,
    service: 1,
    active: true,
    metadata: {
      description: 'Test limit for API endpoints',
      tags: ['api', 'production'],
      priority: 7,
      alertConfig: {
        enabled: true,
        warningThreshold: 75,
        criticalThreshold: 90,
        emailAddresses: ['ops@example.com']
      }
    },
    ...overrides
  }

  if (mode === 'edit') {
    return {
      id: 1,
      ...baseData,
      ...overrides
    } as EditLimitFormData
  }

  return baseData
}

/**
 * Factory for generating API error responses
 * 
 * Creates realistic error responses for testing error handling,
 * form validation, and user feedback scenarios.
 */
export const createMockError = (
  statusCode: number = 400,
  message: string = 'Validation failed',
  code: string = 'VALIDATION_ERROR'
): ApiErrorResponse => ({
  error: {
    code,
    message,
    status_code: statusCode as any,
    context: {
      error: [
        {
          field: 'name',
          code: 'REQUIRED',
          message: 'Limit name is required',
          value: ''
        },
        {
          field: 'limitRate',
          code: 'INVALID_FORMAT',
          message: 'Rate must be in format "number/timeunit"',
          value: 'invalid-rate'
        }
      ]
    },
    trace_id: `test-trace-${Date.now()}`,
    timestamp: new Date().toISOString()
  }
})

/**
 * Factory for generating realistic user, service, and role data
 * 
 * Creates related entity data for testing form dropdowns,
 * autocomplete components, and relationship scenarios.
 */
export const createMockRelatedData = () => ({
  users: Array.from({ length: 10 }, (_, index) => ({
    id: index + 1,
    name: `User ${index + 1}`,
    email: `user${index + 1}@example.com`,
    active: true
  })),
  services: Array.from({ length: 8 }, (_, index) => ({
    id: index + 1,
    name: `Service ${index + 1}`,
    type: ['mysql', 'postgresql', 'mongodb', 'redis'][index % 4],
    active: true
  })),
  roles: Array.from({ length: 5 }, (_, index) => ({
    id: index + 1,
    name: `Role ${index + 1}`,
    description: `Test role ${index + 1}`,
    permissions: ['read', 'write', 'delete'].slice(0, (index % 3) + 1)
  }))
})

// =============================================================================
// MSW REQUEST HANDLERS FOR API MOCKING
// =============================================================================

/**
 * Base URL for DreamFactory API endpoints
 */
const API_BASE_URL = 'http://localhost:3000/api/v2'

/**
 * MSW handlers for limits CRUD operations
 * 
 * Provides realistic API responses for all limits management operations
 * including listing, creating, updating, deleting, and status toggling.
 * Includes proper error scenarios and edge cases for comprehensive testing.
 */
export const limitsHandlers = [
  // GET /api/v2/system/limits - List all limits with filtering and pagination
  http.get(`${API_BASE_URL}/system/limits`, ({ request }) => {
    const url = new URL(request.url)
    const limit = parseInt(url.searchParams.get('limit') || '25')
    const offset = parseInt(url.searchParams.get('offset') || '0')
    const filter = url.searchParams.get('filter')
    const search = url.searchParams.get('search')
    const sort = url.searchParams.get('sort')

    // Simulate filtering
    let limits = createMockLimitsList(50).resource
    
    if (search) {
      limits = limits.filter(limit => 
        limit.name.toLowerCase().includes(search.toLowerCase())
      )
    }

    if (filter) {
      // Simulate simple filter parsing (e.g., "active=true", "limitType=USER")
      const [field, value] = filter.split('=')
      if (field && value) {
        limits = limits.filter(limit => {
          const fieldValue = (limit as any)[field]
          return fieldValue?.toString().toLowerCase() === value.toLowerCase()
        })
      }
    }

    // Apply sorting
    if (sort) {
      const [field, direction = 'asc'] = sort.split(',')
      limits.sort((a, b) => {
        const aValue = (a as any)[field]
        const bValue = (b as any)[field]
        const multiplier = direction === 'desc' ? -1 : 1
        return aValue < bValue ? -1 * multiplier : aValue > bValue ? 1 * multiplier : 0
      })
    }

    // Apply pagination
    const paginatedLimits = limits.slice(offset, offset + limit)

    return HttpResponse.json({
      resource: paginatedLimits,
      meta: {
        count: paginatedLimits.length,
        limit,
        offset,
        total: limits.length,
        has_more: offset + limit < limits.length,
        next_cursor: offset + limit < limits.length ? `cursor-${offset + limit}` : null,
        prev_cursor: offset > 0 ? `cursor-${Math.max(0, offset - limit)}` : null
      }
    })
  }),

  // GET /api/v2/system/limits/:id - Get specific limit details
  http.get(`${API_BASE_URL}/system/limits/:id`, ({ params }) => {
    const id = parseInt(params.id as string)
    
    if (id === 999) {
      // Test error scenario
      return HttpResponse.json(
        createMockError(404, 'Limit not found', 'NOT_FOUND'),
        { status: 404 }
      )
    }

    return HttpResponse.json(createMockLimit({ id }))
  }),

  // POST /api/v2/system/limits - Create new limit
  http.post(`${API_BASE_URL}/system/limits`, async ({ request }) => {
    const body = await request.json() as CreateLimitFormData

    // Simulate validation errors
    if (body.name === 'invalid-name') {
      return HttpResponse.json(
        createMockError(422, 'Validation failed', 'VALIDATION_ERROR'),
        { status: 422 }
      )
    }

    // Simulate duplicate name error
    if (body.name === 'duplicate-limit') {
      return HttpResponse.json(
        createMockError(409, 'Limit name already exists', 'DUPLICATE_NAME'),
        { status: 409 }
      )
    }

    // Simulate successful creation
    const newId = Math.floor(Math.random() * 1000) + 100
    return HttpResponse.json({ id: newId } as ApiCreateResponse, { status: 201 })
  }),

  // PUT /api/v2/system/limits/:id - Update existing limit
  http.put(`${API_BASE_URL}/system/limits/:id`, async ({ params, request }) => {
    const id = parseInt(params.id as string)
    const body = await request.json() as EditLimitFormData

    // Simulate not found error
    if (id === 999) {
      return HttpResponse.json(
        createMockError(404, 'Limit not found', 'NOT_FOUND'),
        { status: 404 }
      )
    }

    // Simulate validation errors
    if (body.name === 'invalid-name') {
      return HttpResponse.json(
        createMockError(422, 'Validation failed', 'VALIDATION_ERROR'),
        { status: 422 }
      )
    }

    // Simulate successful update
    return HttpResponse.json({ 
      id, 
      updated_at: new Date().toISOString() 
    } as ApiUpdateResponse)
  }),

  // DELETE /api/v2/system/limits/:id - Delete limit
  http.delete(`${API_BASE_URL}/system/limits/:id`, ({ params }) => {
    const id = parseInt(params.id as string)

    // Simulate not found error
    if (id === 999) {
      return HttpResponse.json(
        createMockError(404, 'Limit not found', 'NOT_FOUND'),
        { status: 404 }
      )
    }

    // Simulate dependency error
    if (id === 888) {
      return HttpResponse.json(
        createMockError(409, 'Cannot delete limit: active sessions exist', 'DEPENDENCY_EXISTS'),
        { status: 409 }
      )
    }

    // Simulate successful deletion
    return HttpResponse.json({ 
      id, 
      success: true,
      deleted_at: new Date().toISOString() 
    } as ApiDeleteResponse)
  }),

  // PATCH /api/v2/system/limits/:id/toggle - Toggle limit active status
  http.patch(`${API_BASE_URL}/system/limits/:id/toggle`, ({ params }) => {
    const id = parseInt(params.id as string)

    if (id === 999) {
      return HttpResponse.json(
        createMockError(404, 'Limit not found', 'NOT_FOUND'),
        { status: 404 }
      )
    }

    return HttpResponse.json({ 
      id, 
      updated_at: new Date().toISOString() 
    } as ApiUpdateResponse)
  }),

  // GET /api/v2/system/users - Get users for form dropdowns
  http.get(`${API_BASE_URL}/system/users`, () => {
    const relatedData = createMockRelatedData()
    return HttpResponse.json({
      resource: relatedData.users,
      meta: createMockPagination({ count: relatedData.users.length, total: relatedData.users.length })
    })
  }),

  // GET /api/v2/services - Get services for form dropdowns
  http.get(`${API_BASE_URL}/services`, () => {
    const relatedData = createMockRelatedData()
    return HttpResponse.json({
      resource: relatedData.services,
      meta: createMockPagination({ count: relatedData.services.length, total: relatedData.services.length })
    })
  }),

  // GET /api/v2/system/roles - Get roles for form dropdowns
  http.get(`${API_BASE_URL}/system/roles`, () => {
    const relatedData = createMockRelatedData()
    return HttpResponse.json({
      resource: relatedData.roles,
      meta: createMockPagination({ count: relatedData.roles.length, total: relatedData.roles.length })
    })
  })
]

// =============================================================================
// REACT QUERY TESTING UTILITIES
// =============================================================================

/**
 * Creates a test-specific React Query client with optimized settings
 * 
 * Provides a clean QueryClient instance for each test with disabled
 * retries, logging, and caching to ensure predictable test behavior.
 */
export const createTestQueryClient = (): QueryClient => {
  return new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        cacheTime: 0,
        staleTime: 0,
        refetchOnWindowFocus: false,
        refetchOnReconnect: false,
        refetchOnMount: false
      },
      mutations: {
        retry: false,
        cacheTime: 0
      }
    },
    logger: {
      log: () => {},
      warn: () => {},
      error: () => {}
    }
  })
}

/**
 * Utilities for testing React Query cache behavior
 * 
 * Provides helpers for inspecting query cache, triggering invalidations,
 * and testing optimistic updates in limit management scenarios.
 */
export const queryTestUtils = {
  /**
   * Get cached data for limits list query
   */
  getLimitsListCache: (queryClient: QueryClient, params?: ApiRequestOptions) => {
    return queryClient.getQueryData(LIMITS_QUERY_KEYS.list(params))
  },

  /**
   * Get cached data for specific limit detail query
   */
  getLimitDetailCache: (queryClient: QueryClient, id: number) => {
    return queryClient.getQueryData(LIMITS_QUERY_KEYS.detail(id))
  },

  /**
   * Invalidate all limits-related queries
   */
  invalidateAllLimitsQueries: async (queryClient: QueryClient) => {
    await queryClient.invalidateQueries({ queryKey: LIMITS_QUERY_KEYS.all })
  },

  /**
   * Set optimistic data for limit creation
   */
  setOptimisticLimit: (queryClient: QueryClient, tempLimit: LimitTableRowData) => {
    queryClient.setQueryData(LIMITS_QUERY_KEYS.detail(tempLimit.id), tempLimit)
  },

  /**
   * Remove optimistic data and rollback
   */
  rollbackOptimisticLimit: (queryClient: QueryClient, limitId: number) => {
    queryClient.removeQueries({ queryKey: LIMITS_QUERY_KEYS.detail(limitId) })
  },

  /**
   * Simulate query success with custom data
   */
  mockQuerySuccess: (queryClient: QueryClient, queryKey: any[], data: any) => {
    queryClient.setQueryData(queryKey, data)
  },

  /**
   * Simulate query error
   */
  mockQueryError: (queryClient: QueryClient, queryKey: any[], error: ApiErrorResponse) => {
    queryClient.setQueryState(queryKey, {
      status: 'error',
      error,
      data: undefined,
      dataUpdatedAt: 0,
      errorUpdatedAt: Date.now()
    })
  },

  /**
   * Wait for all queries to settle (useful for async testing)
   */
  waitForQueries: async (queryClient: QueryClient) => {
    await queryClient.getQueryCache().getAll().map(query => query.fetch())
  }
}

// =============================================================================
// ZUSTAND TESTING UTILITIES
// =============================================================================

/**
 * Mock Zustand store utilities for testing global state management
 * 
 * Provides utilities for creating mock stores, testing state updates,
 * and isolating component tests from global state dependencies.
 */
export const zustandTestUtils = {
  /**
   * Create a mock store with initial state
   */
  createMockStore: <T>(initialState: T) => {
    let state = initialState
    const listeners = new Set<() => void>()

    return {
      getState: () => state,
      setState: (updater: (state: T) => T | Partial<T>) => {
        const newState = typeof updater === 'function' ? updater(state) : updater
        state = { ...state, ...newState }
        listeners.forEach(listener => listener())
      },
      subscribe: (listener: () => void) => {
        listeners.add(listener)
        return () => listeners.delete(listener)
      },
      destroy: () => {
        listeners.clear()
      }
    }
  },

  /**
   * Mock authentication store for testing
   */
  createMockAuthStore: (overrides: any = {}) => {
    return zustandTestUtils.createMockStore({
      user: {
        id: 1,
        email: 'test@example.com',
        name: 'Test User',
        roles: ['admin']
      },
      isAuthenticated: true,
      permissions: ['limits:read', 'limits:write', 'limits:delete'],
      login: vi.fn(),
      logout: vi.fn(),
      checkPermission: vi.fn((permission: string) => true),
      ...overrides
    })
  },

  /**
   * Mock UI store for testing theme, sidebar, etc.
   */
  createMockUIStore: (overrides: any = {}) => {
    return zustandTestUtils.createMockStore({
      theme: 'light',
      sidebarCollapsed: false,
      notifications: [],
      setTheme: vi.fn(),
      toggleSidebar: vi.fn(),
      addNotification: vi.fn(),
      removeNotification: vi.fn(),
      ...overrides
    })
  }
}

// =============================================================================
// REACT TESTING LIBRARY CUSTOM RENDER UTILITIES
// =============================================================================

/**
 * Custom render options extending React Testing Library RenderOptions
 * 
 * Provides configuration for testing providers, initial state,
 * and component-specific testing requirements.
 */
interface CustomRenderOptions extends Omit<RenderOptions, 'wrapper'> {
  /**
   * Initial React Query data to pre-populate cache
   */
  initialQueryData?: Record<string, any>
  
  /**
   * Mock authentication state
   */
  authState?: any
  
  /**
   * Mock UI state (theme, sidebar, etc.)
   */
  uiState?: any
  
  /**
   * Mock router state for Next.js navigation
   */
  routerState?: {
    pathname?: string
    query?: Record<string, string>
    asPath?: string
  }
  
  /**
   * Custom user event configuration
   */
  userEventOptions?: Parameters<typeof userEvent.setup>[0]
}

/**
 * Creates a test wrapper with all necessary providers
 * 
 * Provides React Query, authentication, theme, and router contexts
 * for comprehensive component testing in isolation.
 */
const createTestWrapper = (options: CustomRenderOptions = {}) => {
  const {
    initialQueryData,
    authState,
    uiState,
    routerState,
    userEventOptions
  } = options

  const queryClient = createTestQueryClient()

  // Pre-populate query cache if provided
  if (initialQueryData) {
    Object.entries(initialQueryData).forEach(([key, data]) => {
      queryClient.setQueryData(JSON.parse(key), data)
    })
  }

  // Create mock stores
  const mockAuthStore = zustandTestUtils.createMockAuthStore(authState)
  const mockUIStore = zustandTestUtils.createMockUIStore(uiState)

  // Test wrapper component
  const TestWrapper = ({ children }: { children: ReactNode }) => {
    return (
      <QueryClientProvider client={queryClient}>
        <AuthProvider store={mockAuthStore}>
          <UIProvider store={mockUIStore}>
            <RouterProvider state={routerState}>
              <ThemeProvider>
                {children}
              </ThemeProvider>
            </RouterProvider>
          </UIProvider>
        </AuthProvider>
      </QueryClientProvider>
    )
  }

  return {
    TestWrapper,
    queryClient,
    authStore: mockAuthStore,
    uiStore: mockUIStore,
    user: userEvent.setup(userEventOptions)
  }
}

/**
 * Enhanced render function with provider setup
 * 
 * Renders components with all necessary testing contexts and returns
 * additional utilities for interacting with stores and query cache.
 */
export const renderWithProviders = (
  ui: ReactElement,
  options: CustomRenderOptions = {}
) => {
  const { TestWrapper, queryClient, authStore, uiStore, user } = createTestWrapper(options)

  const renderResult = render(ui, {
    wrapper: TestWrapper,
    ...options
  })

  return {
    ...renderResult,
    queryClient,
    authStore,
    uiStore,
    user,
    
    // Convenience methods for common testing patterns
    rerender: (newUi: ReactElement) => renderResult.rerender(newUi),
    
    // Query utilities bound to this render's query client
    queryUtils: {
      ...queryTestUtils,
      client: queryClient
    }
  }
}

/**
 * Specialized render function for form components
 * 
 * Pre-configures common form testing scenarios including validation,
 * submission, and error handling with appropriate mock data.
 */
export const renderLimitForm = (
  ui: ReactElement,
  options: CustomRenderOptions & {
    formMode?: 'create' | 'edit'
    initialFormData?: Partial<CreateLimitFormData | EditLimitFormData>
    validationErrors?: Record<string, string>
  } = {}
) => {
  const { formMode = 'create', initialFormData, validationErrors } = options

  // Pre-populate related data cache
  const relatedData = createMockRelatedData()
  const initialQueryData = {
    '["users","list"]': { resource: relatedData.users, meta: createMockPagination() },
    '["services","list"]': { resource: relatedData.services, meta: createMockPagination() },
    '["roles","list"]': { resource: relatedData.roles, meta: createMockPagination() }
  }

  if (formMode === 'edit' && initialFormData?.id) {
    initialQueryData[`["limits","detail",${initialFormData.id}]`] = createMockLimit(initialFormData)
  }

  return renderWithProviders(ui, {
    ...options,
    initialQueryData
  })
}

/**
 * Specialized render function for list components
 * 
 * Pre-configures list testing scenarios with pagination, filtering,
 * and selection capabilities with appropriate mock data.
 */
export const renderLimitsList = (
  ui: ReactElement,
  options: CustomRenderOptions & {
    limitsCount?: number
    initialFilters?: ApiRequestOptions
    selectedIds?: number[]
  } = {}
) => {
  const { limitsCount = 10, initialFilters, selectedIds = [] } = options

  // Pre-populate limits list cache
  const mockLimitsList = createMockLimitsList(limitsCount)
  const initialQueryData = {
    [`["limits","list",${JSON.stringify(initialFilters || {})}]`]: mockLimitsList
  }

  return renderWithProviders(ui, {
    ...options,
    initialQueryData
  })
}

// =============================================================================
// SPECIALIZED TESTING UTILITIES
// =============================================================================

/**
 * Performance testing utilities for validating response times
 * 
 * Measures component rendering performance and interaction timing
 * to ensure compliance with sub-100ms validation requirements.
 */
export const performanceTestUtils = {
  /**
   * Measure component render time
   */
  measureRenderTime: async (renderFn: () => Promise<any> | any) => {
    const startTime = performance.now()
    await renderFn()
    const endTime = performance.now()
    return endTime - startTime
  },

  /**
   * Measure form validation time
   */
  measureValidationTime: async (
    formElement: HTMLFormElement,
    triggerValidation: () => Promise<void> | void
  ) => {
    const startTime = performance.now()
    await triggerValidation()
    const endTime = performance.now()
    return endTime - startTime
  },

  /**
   * Ensure validation meets 100ms requirement
   */
  expectValidationUnder100ms: async (validationFn: () => Promise<void> | void) => {
    const time = await performanceTestUtils.measureValidationTime(
      document.createElement('form'),
      validationFn
    )
    expect(time).toBeLessThan(100)
  }
}

/**
 * Accessibility testing utilities for WCAG 2.1 AA compliance
 * 
 * Provides helpers for testing keyboard navigation, screen reader
 * compatibility, and focus management in limits components.
 */
export const accessibilityTestUtils = {
  /**
   * Test keyboard navigation through form fields
   */
  testKeyboardNavigation: async (user: ReturnType<typeof userEvent.setup>) => {
    // Tab through all focusable elements
    await user.tab()
    const firstFocused = document.activeElement
    
    // Continue tabbing to test navigation
    await user.tab()
    const secondFocused = document.activeElement
    
    expect(firstFocused).not.toBe(secondFocused)
    return { firstFocused, secondFocused }
  },

  /**
   * Test escape key handling for modals and dialogs
   */
  testEscapeKeyHandling: async (user: ReturnType<typeof userEvent.setup>) => {
    await user.keyboard('{Escape}')
  },

  /**
   * Test ARIA labels and descriptions
   */
  testAriaLabels: (element: HTMLElement) => {
    const ariaLabel = element.getAttribute('aria-label')
    const ariaLabelledBy = element.getAttribute('aria-labelledby')
    const ariaDescribedBy = element.getAttribute('aria-describedby')
    
    expect(ariaLabel || ariaLabelledBy).toBeTruthy()
    return { ariaLabel, ariaLabelledBy, ariaDescribedBy }
  },

  /**
   * Test focus management in dynamic content
   */
  testFocusManagement: (expectedFocusedElement: HTMLElement) => {
    expect(document.activeElement).toBe(expectedFocusedElement)
  }
}

/**
 * Error testing utilities for comprehensive error scenario coverage
 * 
 * Provides helpers for testing various error conditions, validation
 * failures, and error recovery mechanisms in limits management.
 */
export const errorTestUtils = {
  /**
   * Test form validation error display
   */
  expectValidationError: (fieldName: string, errorMessage: string) => {
    const errorElement = screen.getByText(errorMessage)
    expect(errorElement).toBeInTheDocument()
    
    // Check if error is associated with correct field
    const fieldElement = screen.getByRole('textbox', { name: new RegExp(fieldName, 'i') })
    expect(fieldElement).toHaveAttribute('aria-invalid', 'true')
  },

  /**
   * Test API error handling and user feedback
   */
  expectApiError: (errorMessage: string) => {
    const errorElement = screen.getByRole('alert')
    expect(errorElement).toHaveTextContent(errorMessage)
  },

  /**
   * Test network error scenarios
   */
  simulateNetworkError: () => {
    // This would be used with MSW to simulate network failures
    return createMockError(500, 'Network error', 'NETWORK_ERROR')
  }
}

// =============================================================================
// TYPE EXPORTS FOR EXTERNAL USE
// =============================================================================

export type {
  CustomRenderOptions
}

/**
 * Re-export testing utilities for convenience
 */
export {
  screen,
  userEvent,
  vi,
  expect,
  describe,
  it,
  beforeEach,
  afterEach,
  beforeAll,
  afterAll
} from 'vitest'

export { waitFor, waitForElementToBeRemoved } from '@testing-library/react'