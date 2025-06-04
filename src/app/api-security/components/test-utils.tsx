/**
 * Testing Utilities for API Security Components
 * 
 * Provides comprehensive testing utilities specifically for API security components
 * including MSW handlers, mock data generators, and reusable test setup functions.
 * Replaces Angular testing mocks with MSW-based API mocking for realistic component
 * testing scenarios across both limits and roles features.
 * 
 * @author DreamFactory Admin Interface Team
 * @version React 19/Next.js 15.1 Migration
 */

import React from 'react'
import { render, renderHook, RenderOptions, RenderHookOptions } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { http, HttpResponse } from 'msw'
import { setupServer } from 'msw/node'
import { create } from 'zustand'
import type { ReactElement, ReactNode } from 'react'

// Import types from the shared type definitions
import type {
  ApiListResponse,
  ApiCreateResponse,
  ApiUpdateResponse,
  ApiDeleteResponse,
  ApiErrorResponse,
  HttpStatusCode,
  PaginationMeta,
} from '../../../types/api'
import type {
  RoleType,
  RoleCreatePayload,
  RoleUpdatePayload,
  RoleServiceAccessType,
  RolePermission,
  RoleListParams,
  AccessLevel,
  RequesterLevel,
} from '../../../types/role'
import type {
  LimitType,
  CreateLimitPayload,
  UpdateLimitPayload,
  CacheLimitType,
  LimitTableRowData,
  LimitListParams,
  RATE_LIMIT_PERIODS,
  RATE_LIMIT_TYPES,
} from '../../../types/limit'

// =============================================================================
// MOCK DATA FACTORIES
// =============================================================================

/**
 * Generate a mock cache limit entry
 */
export function createMockCacheLimit(overrides: Partial<CacheLimitType> = {}): CacheLimitType {
  return {
    id: Math.floor(Math.random() * 1000) + 1,
    key: `instance.user:${Math.floor(Math.random() * 100)}.minute`,
    max: Math.floor(Math.random() * 1000) + 10,
    attempts: Math.floor(Math.random() * 50),
    remaining: Math.floor(Math.random() * 950) + 50,
    reset_time: new Date(Date.now() + 60000).toISOString(),
    window_start: new Date(Date.now() - 30000).toISOString(),
    ...overrides,
  }
}

/**
 * Generate a mock rate limit configuration
 */
export function createMockLimit(overrides: Partial<LimitType> = {}): LimitType {
  const id = Math.floor(Math.random() * 1000) + 1
  const type = overrides.type || 'api'
  const period = overrides.period || 'minute'
  const rate = overrides.rate || Math.floor(Math.random() * 1000) + 10
  
  return {
    id,
    name: `Test Limit ${id}`,
    description: `Generated test limit for ${type}`,
    isActive: true,
    rate,
    period,
    type,
    endpoint: type === 'endpoint' ? '/api/v2/test' : null,
    verb: type === 'endpoint' ? 'GET' : null,
    serviceId: type === 'service' ? Math.floor(Math.random() * 10) + 1 : null,
    roleId: type === 'role' ? Math.floor(Math.random() * 10) + 1 : null,
    userId: type === 'user' ? Math.floor(Math.random() * 100) + 1 : null,
    keyText: `${type}.${period}`,
    createdDate: new Date(Date.now() - 86400000).toISOString(),
    lastModifiedDate: new Date().toISOString(),
    limitCacheByLimitId: [createMockCacheLimit({ id, max: rate })],
    roleByRoleId: null,
    serviceByServiceId: null,
    userByUserId: null,
    ...overrides,
  }
}

/**
 * Generate a mock limit table row
 */
export function createMockLimitTableRow(overrides: Partial<LimitTableRowData> = {}): LimitTableRowData {
  const id = Math.floor(Math.random() * 1000) + 1
  const type = overrides.limitType || 'api'
  const rate = Math.floor(Math.random() * 1000) + 10
  const period = 'minute'
  
  return {
    id,
    name: `Test Limit ${id}`,
    limitType: type,
    limitRate: `${rate} / ${period}`,
    limitCounter: `${Math.floor(Math.random() * rate)} / ${rate}`,
    user: type === 'user' ? Math.floor(Math.random() * 100) + 1 : null,
    service: type === 'service' ? Math.floor(Math.random() * 10) + 1 : null,
    role: type === 'role' ? Math.floor(Math.random() * 10) + 1 : null,
    active: true,
    description: `Generated test limit`,
    period,
    endpoint: type === 'endpoint' ? '/api/v2/test' : undefined,
    verb: type === 'endpoint' ? 'GET' : undefined,
    createdDate: new Date().toISOString(),
    lastModifiedDate: new Date().toISOString(),
    ...overrides,
  }
}

/**
 * Generate a mock role service access configuration
 */
export function createMockRoleServiceAccess(overrides: Partial<RoleServiceAccessType> = {}): RoleServiceAccessType {
  return {
    id: Math.floor(Math.random() * 1000) + 1,
    roleId: Math.floor(Math.random() * 10) + 1,
    serviceId: Math.floor(Math.random() * 10) + 1,
    serviceName: `test-service-${Math.floor(Math.random() * 10)}`,
    component: `component_${Math.floor(Math.random() * 100)}`,
    access: AccessLevel.READ | AccessLevel.CREATE, // Bitmask for read and create
    requester: RequesterLevel.SELF,
    filters: [],
    description: 'Test service access configuration',
    isActive: true,
    createdDate: new Date().toISOString(),
    lastModifiedDate: new Date().toISOString(),
    ...overrides,
  }
}

/**
 * Generate a mock role permission
 */
export function createMockRolePermission(overrides: Partial<RolePermission> = {}): RolePermission {
  return {
    id: Math.floor(Math.random() * 1000) + 1,
    roleId: Math.floor(Math.random() * 10) + 1,
    resource: `resource_${Math.floor(Math.random() * 100)}`,
    action: 'GET',
    allow: true,
    conditions: {},
    description: 'Test role permission',
    priority: 1,
    isActive: true,
    ...overrides,
  }
}

/**
 * Generate a mock role configuration
 */
export function createMockRole(overrides: Partial<RoleType> = {}): RoleType {
  const id = Math.floor(Math.random() * 1000) + 1
  
  return {
    id,
    name: `Test Role ${id}`,
    description: `Generated test role for testing purposes`,
    isActive: true,
    createdById: 1,
    createdDate: new Date(Date.now() - 86400000).toISOString(),
    lastModifiedById: 1,
    lastModifiedDate: new Date().toISOString(),
    lookupByRoleId: [],
    accessibleTabs: ['tab1', 'tab2'],
    roleServiceAccessByRoleId: [createMockRoleServiceAccess({ roleId: id })],
    permissions: [createMockRolePermission({ roleId: id })],
    userCount: Math.floor(Math.random() * 50),
    lastUsed: new Date(Date.now() - 3600000).toISOString(),
    ...overrides,
  }
}

/**
 * Generate mock pagination metadata
 */
export function createMockPagination(overrides: Partial<PaginationMeta> = {}): PaginationMeta {
  const count = overrides.count || 25
  const total = overrides.total || 150
  
  return {
    count,
    limit: 25,
    offset: 0,
    total,
    has_more: count < total,
    next_cursor: count < total ? 'next_cursor_token' : undefined,
    prev_cursor: undefined,
    ...overrides,
  }
}

/**
 * Generate a mock error response
 */
export function createMockError(overrides: Partial<ApiErrorResponse['error']> = {}): ApiErrorResponse {
  return {
    error: {
      code: 'TEST_ERROR',
      message: 'A test error occurred',
      status_code: 400,
      context: 'Test context',
      trace_id: `trace_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date().toISOString(),
      ...overrides,
    },
  }
}

// =============================================================================
// MOCK DATA COLLECTIONS
// =============================================================================

/**
 * Pre-generated mock data collections for consistent testing
 */
export const mockData = {
  limits: Array.from({ length: 10 }, () => createMockLimit()),
  limitTableRows: Array.from({ length: 10 }, () => createMockLimitTableRow()),
  roles: Array.from({ length: 8 }, () => createMockRole()),
  serviceAccess: Array.from({ length: 15 }, () => createMockRoleServiceAccess()),
  permissions: Array.from({ length: 20 }, () => createMockRolePermission()),
  cacheEntries: Array.from({ length: 12 }, () => createMockCacheLimit()),
}

// =============================================================================
// MSW REQUEST HANDLERS
// =============================================================================

/**
 * Rate limiting API handlers for MSW
 */
export const limitHandlers = [
  // Get all limits
  http.get('/api/v2/system/limit', ({ request }) => {
    const url = new URL(request.url)
    const limit = parseInt(url.searchParams.get('limit') || '25')
    const offset = parseInt(url.searchParams.get('offset') || '0')
    const search = url.searchParams.get('search')
    
    let filteredLimits = [...mockData.limits]
    
    // Apply search filter
    if (search) {
      filteredLimits = filteredLimits.filter(limit => 
        limit.name.toLowerCase().includes(search.toLowerCase()) ||
        limit.description.toLowerCase().includes(search.toLowerCase())
      )
    }
    
    // Apply pagination
    const paginatedLimits = filteredLimits.slice(offset, offset + limit)
    
    const response: ApiListResponse<LimitType> = {
      resource: paginatedLimits,
      meta: createMockPagination({
        count: paginatedLimits.length,
        limit,
        offset,
        total: filteredLimits.length,
      })
    }
    
    return HttpResponse.json(response)
  }),

  // Get single limit
  http.get('/api/v2/system/limit/:id', ({ params }) => {
    const id = parseInt(params.id as string)
    const limit = mockData.limits.find(l => l.id === id)
    
    if (!limit) {
      return HttpResponse.json(
        createMockError({ code: 'LIMIT_NOT_FOUND', message: 'Limit not found', status_code: 404 }),
        { status: 404 }
      )
    }
    
    return HttpResponse.json({ resource: limit })
  }),

  // Create new limit
  http.post('/api/v2/system/limit', async ({ request }) => {
    const payload = await request.json() as CreateLimitPayload
    const newLimit = createMockLimit({
      name: payload.name,
      description: payload.description,
      type: payload.type,
      rate: parseInt(payload.rate),
      period: payload.period,
      isActive: payload.isActive,
      endpoint: payload.endpoint,
      verb: payload.verb,
      serviceId: payload.serviceId,
      roleId: payload.roleId,
      userId: payload.userId,
    })
    
    mockData.limits.push(newLimit)
    
    const response: ApiCreateResponse = { id: newLimit.id }
    return HttpResponse.json(response, { status: 201 })
  }),

  // Update limit
  http.put('/api/v2/system/limit/:id', async ({ params, request }) => {
    const id = parseInt(params.id as string)
    const payload = await request.json() as UpdateLimitPayload
    const limitIndex = mockData.limits.findIndex(l => l.id === id)
    
    if (limitIndex === -1) {
      return HttpResponse.json(
        createMockError({ code: 'LIMIT_NOT_FOUND', message: 'Limit not found', status_code: 404 }),
        { status: 404 }
      )
    }
    
    mockData.limits[limitIndex] = {
      ...mockData.limits[limitIndex],
      ...payload,
      lastModifiedDate: new Date().toISOString(),
    }
    
    const response: ApiUpdateResponse = { id, updated_at: new Date().toISOString() }
    return HttpResponse.json(response)
  }),

  // Delete limit
  http.delete('/api/v2/system/limit/:id', ({ params }) => {
    const id = parseInt(params.id as string)
    const limitIndex = mockData.limits.findIndex(l => l.id === id)
    
    if (limitIndex === -1) {
      return HttpResponse.json(
        createMockError({ code: 'LIMIT_NOT_FOUND', message: 'Limit not found', status_code: 404 }),
        { status: 404 }
      )
    }
    
    mockData.limits.splice(limitIndex, 1)
    
    const response: ApiDeleteResponse = { 
      success: true,
      id,
      deleted_at: new Date().toISOString() 
    }
    return HttpResponse.json(response)
  }),

  // Clear limit cache
  http.delete('/api/v2/system/limit/:id/cache', ({ params }) => {
    const id = parseInt(params.id as string)
    const limit = mockData.limits.find(l => l.id === id)
    
    if (!limit) {
      return HttpResponse.json(
        createMockError({ code: 'LIMIT_NOT_FOUND', message: 'Limit not found', status_code: 404 }),
        { status: 404 }
      )
    }
    
    // Reset cache counters
    limit.limitCacheByLimitId.forEach(cache => {
      cache.attempts = 0
      cache.remaining = cache.max
      cache.window_start = new Date().toISOString()
      cache.reset_time = new Date(Date.now() + 60000).toISOString()
    })
    
    const response: ApiDeleteResponse = { 
      success: true,
      id,
      deleted_at: new Date().toISOString() 
    }
    return HttpResponse.json(response)
  }),
]

/**
 * Role management API handlers for MSW
 */
export const roleHandlers = [
  // Get all roles
  http.get('/api/v2/system/role', ({ request }) => {
    const url = new URL(request.url)
    const limit = parseInt(url.searchParams.get('limit') || '25')
    const offset = parseInt(url.searchParams.get('offset') || '0')
    const search = url.searchParams.get('search')
    const related = url.searchParams.get('related')
    
    let filteredRoles = [...mockData.roles]
    
    // Apply search filter
    if (search) {
      filteredRoles = filteredRoles.filter(role => 
        role.name.toLowerCase().includes(search.toLowerCase()) ||
        role.description.toLowerCase().includes(search.toLowerCase())
      )
    }
    
    // Apply pagination
    const paginatedRoles = filteredRoles.slice(offset, offset + limit)
    
    // Include related data if requested
    if (related?.includes('roleServiceAccessByRoleId')) {
      paginatedRoles.forEach(role => {
        role.roleServiceAccessByRoleId = mockData.serviceAccess.filter(sa => sa.roleId === role.id)
      })
    }
    
    const response: ApiListResponse<RoleType> = {
      resource: paginatedRoles,
      meta: createMockPagination({
        count: paginatedRoles.length,
        limit,
        offset,
        total: filteredRoles.length,
      })
    }
    
    return HttpResponse.json(response)
  }),

  // Get single role
  http.get('/api/v2/system/role/:id', ({ params, request }) => {
    const id = parseInt(params.id as string)
    const url = new URL(request.url)
    const related = url.searchParams.get('related')
    
    const role = mockData.roles.find(r => r.id === id)
    
    if (!role) {
      return HttpResponse.json(
        createMockError({ code: 'ROLE_NOT_FOUND', message: 'Role not found', status_code: 404 }),
        { status: 404 }
      )
    }
    
    // Include related data if requested
    const roleWithRelated = { ...role }
    if (related?.includes('roleServiceAccessByRoleId')) {
      roleWithRelated.roleServiceAccessByRoleId = mockData.serviceAccess.filter(sa => sa.roleId === role.id)
    }
    if (related?.includes('permissions')) {
      roleWithRelated.permissions = mockData.permissions.filter(p => p.roleId === role.id)
    }
    
    return HttpResponse.json({ resource: roleWithRelated })
  }),

  // Create new role
  http.post('/api/v2/system/role', async ({ request }) => {
    const payload = await request.json() as RoleCreatePayload
    const newRole = createMockRole({
      name: payload.name,
      description: payload.description,
      isActive: payload.isActive,
      lookupByRoleId: payload.lookupByRoleId || [],
      accessibleTabs: payload.accessibleTabs || [],
    })
    
    // Handle service access configurations
    if (payload.roleServiceAccessByRoleId) {
      payload.roleServiceAccessByRoleId.forEach(accessConfig => {
        const serviceAccess = createMockRoleServiceAccess({
          ...accessConfig,
          roleId: newRole.id,
        })
        mockData.serviceAccess.push(serviceAccess)
      })
    }
    
    mockData.roles.push(newRole)
    
    const response: ApiCreateResponse = { id: newRole.id }
    return HttpResponse.json(response, { status: 201 })
  }),

  // Update role
  http.put('/api/v2/system/role/:id', async ({ params, request }) => {
    const id = parseInt(params.id as string)
    const payload = await request.json() as RoleUpdatePayload
    const roleIndex = mockData.roles.findIndex(r => r.id === id)
    
    if (roleIndex === -1) {
      return HttpResponse.json(
        createMockError({ code: 'ROLE_NOT_FOUND', message: 'Role not found', status_code: 404 }),
        { status: 404 }
      )
    }
    
    mockData.roles[roleIndex] = {
      ...mockData.roles[roleIndex],
      ...payload,
      id, // Ensure ID doesn't change
      lastModifiedDate: new Date().toISOString(),
    }
    
    const response: ApiUpdateResponse = { id, updated_at: new Date().toISOString() }
    return HttpResponse.json(response)
  }),

  // Delete role
  http.delete('/api/v2/system/role/:id', ({ params }) => {
    const id = parseInt(params.id as string)
    const roleIndex = mockData.roles.findIndex(r => r.id === id)
    
    if (roleIndex === -1) {
      return HttpResponse.json(
        createMockError({ code: 'ROLE_NOT_FOUND', message: 'Role not found', status_code: 404 }),
        { status: 404 }
      )
    }
    
    // Remove role and related data
    mockData.roles.splice(roleIndex, 1)
    mockData.serviceAccess.splice(0, mockData.serviceAccess.length, 
      ...mockData.serviceAccess.filter(sa => sa.roleId !== id)
    )
    mockData.permissions.splice(0, mockData.permissions.length,
      ...mockData.permissions.filter(p => p.roleId !== id)
    )
    
    const response: ApiDeleteResponse = { 
      success: true,
      id,
      deleted_at: new Date().toISOString() 
    }
    return HttpResponse.json(response)
  }),

  // Get services for role access configuration
  http.get('/api/v2/system/service', () => {
    const services = [
      { id: 1, name: 'api_docs', label: 'Live API Docs', type: 'swagger', is_active: true },
      { id: 2, name: 'db', label: 'Local SQL Database', type: 'sqlite', is_active: true },
      { id: 3, name: 'email', label: 'Local Email Service', type: 'local_email', is_active: true },
      { id: 4, name: 'files', label: 'Local File Storage', type: 'local_file', is_active: true },
      { id: 5, name: 'logs', label: 'Log Files', type: 'log', is_active: true },
    ]
    
    return HttpResponse.json({ resource: services })
  }),

  // Get service components for a specific service
  http.get('/api/v2/:serviceName/_schema', ({ params }) => {
    const serviceName = params.serviceName as string
    
    // Mock schema response with different components based on service
    const components = serviceName === 'db' 
      ? ['table1', 'table2', 'table3', '_schema/', '_proc/']
      : ['component1/', 'component2/', '_schema/']
    
    const response = {
      resource: components.map(name => ({ name, access: ['GET', 'POST', 'PUT', 'DELETE'] }))
    }
    
    return HttpResponse.json(response)
  }),
]

/**
 * All API security handlers combined
 */
export const apiSecurityHandlers = [
  ...limitHandlers,
  ...roleHandlers,
]

// =============================================================================
// TESTING UTILITIES FOR STATE MANAGEMENT
// =============================================================================

/**
 * Create a fresh QueryClient for testing
 */
export function createTestQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        cacheTime: Infinity,
        staleTime: Infinity,
      },
    },
  })
}

/**
 * Mock Zustand store for testing
 */
interface TestAppStore {
  theme: 'light' | 'dark' | 'system'
  sidebarCollapsed: boolean
  globalLoading: boolean
  preferences: {
    defaultDatabaseType: string
    tablePageSize: number
    autoRefreshSchemas: boolean
    showAdvancedOptions: boolean
  }
  setTheme: (theme: 'light' | 'dark' | 'system') => void
  setSidebarCollapsed: (collapsed: boolean) => void
  setGlobalLoading: (loading: boolean) => void
  updatePreferences: (preferences: Partial<TestAppStore['preferences']>) => void
}

export const createMockAppStore = () => create<TestAppStore>((set, get) => ({
  theme: 'light',
  sidebarCollapsed: false,
  globalLoading: false,
  preferences: {
    defaultDatabaseType: 'mysql',
    tablePageSize: 25,
    autoRefreshSchemas: true,
    showAdvancedOptions: false,
  },
  setTheme: (theme) => set({ theme }),
  setSidebarCollapsed: (collapsed) => set({ sidebarCollapsed: collapsed }),
  setGlobalLoading: (loading) => set({ globalLoading: loading }),
  updatePreferences: (newPreferences) => 
    set({ preferences: { ...get().preferences, ...newPreferences } }),
}))

// =============================================================================
// CUSTOM RENDER FUNCTIONS WITH PROVIDERS
// =============================================================================

/**
 * Props for the test providers wrapper
 */
interface TestProvidersProps {
  children: ReactNode
  queryClient?: QueryClient
  initialEntries?: string[]
}

/**
 * Test providers wrapper component
 */
function TestProviders({ children, queryClient }: TestProvidersProps) {
  const testQueryClient = queryClient || createTestQueryClient()
  
  return (
    <QueryClientProvider client={testQueryClient}>
      {children}
    </QueryClientProvider>
  )
}

/**
 * Custom render function with all necessary providers
 */
export function renderWithProviders(
  ui: ReactElement,
  options: RenderOptions & {
    queryClient?: QueryClient
    initialEntries?: string[]
  } = {}
) {
  const { queryClient, initialEntries, ...renderOptions } = options
  
  function Wrapper({ children }: { children: ReactNode }) {
    return (
      <TestProviders queryClient={queryClient} initialEntries={initialEntries}>
        {children}
      </TestProviders>
    )
  }
  
  return {
    ...render(ui, { wrapper: Wrapper, ...renderOptions }),
    queryClient: queryClient || createTestQueryClient(),
  }
}

/**
 * Custom render hook function with providers
 */
export function renderHookWithProviders<TProps, TResult>(
  callback: (props: TProps) => TResult,
  options: RenderHookOptions<TProps> & {
    queryClient?: QueryClient
    initialEntries?: string[]
  } = {}
) {
  const { queryClient, initialEntries, ...renderHookOptions } = options
  
  function Wrapper({ children }: { children: ReactNode }) {
    return (
      <TestProviders queryClient={queryClient} initialEntries={initialEntries}>
        {children}
      </TestProviders>
    )
  }
  
  return {
    ...renderHook(callback, { wrapper: Wrapper, ...renderHookOptions }),
    queryClient: queryClient || createTestQueryClient(),
  }
}

// =============================================================================
// REACT QUERY TESTING UTILITIES
// =============================================================================

/**
 * Wait for React Query to settle (no more pending queries/mutations)
 */
export async function waitForQueryToSettle(queryClient: QueryClient, timeout = 5000): Promise<void> {
  return new Promise((resolve, reject) => {
    const timeoutId = setTimeout(() => {
      reject(new Error(`Query did not settle within ${timeout}ms`))
    }, timeout)
    
    const checkForSettlement = () => {
      const queryCache = queryClient.getQueryCache()
      const mutationCache = queryClient.getMutationCache()
      
      const pendingQueries = queryCache.getAll().filter(query => query.state.isFetching)
      const pendingMutations = mutationCache.getAll().filter(mutation => mutation.state.isPending)
      
      if (pendingQueries.length === 0 && pendingMutations.length === 0) {
        clearTimeout(timeoutId)
        resolve()
      } else {
        setTimeout(checkForSettlement, 10)
      }
    }
    
    checkForSettlement()
  })
}

/**
 * Mock successful query response
 */
export function mockQuerySuccess<T>(queryClient: QueryClient, queryKey: string[], data: T): void {
  queryClient.setQueryData(queryKey, data)
}

/**
 * Mock query error response
 */
export function mockQueryError(queryClient: QueryClient, queryKey: string[], error: Error): void {
  queryClient.setQueryData(queryKey, undefined)
  queryClient.setQueryState(queryKey, {
    status: 'error',
    error,
    data: undefined,
    dataUpdatedAt: 0,
    errorUpdatedAt: Date.now(),
    fetchFailureCount: 1,
    fetchFailureReason: error,
    fetchStatus: 'idle',
    isInvalidated: false,
  })
}

/**
 * Clear all queries and mutations from the query client
 */
export function clearQueryClient(queryClient: QueryClient): void {
  queryClient.clear()
}

// =============================================================================
// MSW SERVER SETUP FOR TESTS
// =============================================================================

/**
 * Setup MSW server for Node.js testing environment
 */
export const setupTestServer = () => {
  return setupServer(...apiSecurityHandlers)
}

// =============================================================================
// ACCESSIBILITY TESTING UTILITIES
// =============================================================================

/**
 * Common accessibility test cases for security components
 */
export const a11yTestCases = {
  formLabels: 'All form inputs should have associated labels',
  buttonText: 'All buttons should have descriptive text or aria-label',
  tableHeaders: 'Tables should have proper headers and captions',
  errorMessages: 'Error messages should be associated with form fields',
  focusManagement: 'Focus should be managed appropriately for modals and navigation',
  keyboardNavigation: 'All interactive elements should be keyboard accessible',
  colorContrast: 'Text should meet WCAG color contrast requirements',
  semanticHeadings: 'Heading hierarchy should be semantic and proper',
}

// =============================================================================
// PERFORMANCE TESTING UTILITIES
// =============================================================================

/**
 * Performance benchmarking utility for testing component render times
 */
export function measureRenderTime<T>(renderFn: () => T): { result: T; renderTime: number } {
  const startTime = performance.now()
  const result = renderFn()
  const endTime = performance.now()
  
  return {
    result,
    renderTime: endTime - startTime,
  }
}

/**
 * Assert that a render operation completes within the specified time
 */
export function assertRenderTimeUnder(maxTime: number, renderFn: () => unknown): void {
  const { renderTime } = measureRenderTime(renderFn)
  
  if (renderTime > maxTime) {
    throw new Error(`Render time ${renderTime}ms exceeded maximum allowed time ${maxTime}ms`)
  }
}

// =============================================================================
// EXPORTS
// =============================================================================

export {
  // Mock data factories
  createMockLimit,
  createMockLimitTableRow,
  createMockRole,
  createMockRoleServiceAccess,
  createMockRolePermission,
  createMockCacheLimit,
  createMockPagination,
  createMockError,
  
  // Mock data collections
  mockData,
  
  // MSW handlers
  limitHandlers,
  roleHandlers,
  apiSecurityHandlers,
  
  // Testing utilities
  createTestQueryClient,
  createMockAppStore,
  
  // React Query testing
  waitForQueryToSettle,
  mockQuerySuccess,
  mockQueryError,
  clearQueryClient,
  
  // Accessibility testing
  a11yTestCases,
  
  // Performance testing
  measureRenderTime,
  assertRenderTimeUnder,
}

// Default export for convenience
export default {
  renderWithProviders,
  renderHookWithProviders,
  setupTestServer,
  mockData,
  apiSecurityHandlers,
  createTestQueryClient,
  createMockAppStore,
}