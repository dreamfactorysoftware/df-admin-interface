/**
 * API Security Components Test Utilities
 * 
 * Comprehensive testing utilities and MSW handlers specifically for API security components,
 * providing mock data generators, API response handlers, and reusable test setup functions.
 * Replaces Angular testing mocks with MSW-based API mocking for realistic component testing
 * scenarios across both limits and roles features.
 * 
 * Features:
 * - MSW request handlers for security operations
 * - React Testing Library wrapper functions with providers
 * - React Query testing utilities for cache behavior mocking
 * - Zustand store mock providers for component testing isolation
 * - Comprehensive test data factories for limits, roles, permissions, and users
 * - Dynamic MSW response generators for various testing scenarios
 * 
 * @fileoverview Test utilities for API security components
 * @version 1.0.0
 * @since React 19.0.0 / Next.js 15.1+
 */

import React, { type ReactElement } from 'react';
import { render, type RenderOptions } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { rest, type RequestHandler } from 'msw';
import { faker } from '@faker-js/faker';
import { create, type StoreApi } from 'zustand';

// Types
import type { 
  ApiListResponse, 
  ApiResourceResponse, 
  ApiErrorResponse, 
  ApiSuccessResponse,
  HttpMethod 
} from '@/types/api';
import type { 
  RoleType, 
  RoleWithRelations, 
  CreateRoleData, 
  UpdateRoleData,
  RoleServiceAccess,
  RoleLookup,
  RoleListItem,
  RolePermissionSummary,
  HttpVerb 
} from '@/types/role';

// ============================================================================
// TEST DATA FACTORIES
// ============================================================================

/**
 * Factory for generating mock role data
 * Creates realistic role instances with proper relationships and constraints
 */
export const createMockRole = (overrides: Partial<RoleType> = {}): RoleType => ({
  id: faker.number.int({ min: 1, max: 1000 }),
  name: faker.internet.username(),
  description: faker.lorem.sentence(),
  isActive: faker.datatype.boolean(),
  createdById: faker.number.int({ min: 1, max: 100 }),
  createdDate: faker.date.past().toISOString(),
  lastModifiedById: faker.number.int({ min: 1, max: 100 }),
  lastModifiedDate: faker.date.recent().toISOString(),
  lookupByRoleId: faker.helpers.multiple(() => faker.number.int({ min: 1, max: 50 }), { count: { min: 0, max: 5 } }),
  accessibleTabs: faker.helpers.multiple(() => faker.helpers.arrayElement([
    'dashboard', 'users', 'roles', 'services', 'schema', 'apps', 'limits'
  ]), { count: { min: 1, max: 4 } }),
  ...overrides,
});

/**
 * Factory for generating mock role service access configurations
 */
export const createMockRoleServiceAccess = (overrides: Partial<RoleServiceAccess> = {}): RoleServiceAccess => ({
  id: faker.number.int({ min: 1, max: 1000 }),
  roleId: faker.number.int({ min: 1, max: 100 }),
  serviceId: faker.number.int({ min: 1, max: 50 }),
  component: faker.helpers.maybe(() => faker.helpers.arrayElement(['_table', '_view', '_schema', '_openapi'])),
  verbMask: faker.helpers.arrayElement([1, 3, 7, 15, 31, 63, 127]), // Various HTTP verb combinations
  requestorType: faker.number.int({ min: 0, max: 3 }),
  filters: faker.helpers.maybe(() => `field1 = '${faker.lorem.word()}'`),
  filterOp: faker.helpers.maybe(() => faker.helpers.arrayElement(['AND', 'OR'])),
  ...overrides,
});

/**
 * Factory for generating mock role lookup configurations
 */
export const createMockRoleLookup = (overrides: Partial<RoleLookup> = {}): RoleLookup => ({
  id: faker.number.int({ min: 1, max: 1000 }),
  roleId: faker.number.int({ min: 1, max: 100 }),
  name: faker.database.column(),
  value: faker.lorem.word(),
  private: faker.datatype.boolean(),
  description: faker.helpers.maybe(() => faker.lorem.sentence()),
  ...overrides,
});

/**
 * Factory for generating complete role with relations
 */
export const createMockRoleWithRelations = (overrides: Partial<RoleWithRelations> = {}): RoleWithRelations => {
  const baseRole = createMockRole(overrides);
  return {
    ...baseRole,
    roleServiceAccessByRoleId: faker.helpers.multiple(
      () => createMockRoleServiceAccess({ roleId: baseRole.id }),
      { count: { min: 0, max: 8 } }
    ),
    lookupByRoleId: faker.helpers.multiple(
      () => createMockRoleLookup({ roleId: baseRole.id }),
      { count: { min: 0, max: 5 } }
    ),
    ...overrides,
  };
};

/**
 * Factory for generating role list items for table displays
 */
export const createMockRoleListItem = (overrides: Partial<RoleListItem> = {}): RoleListItem => ({
  id: faker.number.int({ min: 1, max: 1000 }),
  name: faker.internet.username(),
  description: faker.lorem.sentence(),
  isActive: faker.datatype.boolean(),
  userCount: faker.number.int({ min: 0, max: 50 }),
  serviceAccessCount: faker.number.int({ min: 0, max: 20 }),
  lastModifiedDate: faker.date.recent().toISOString(),
  ...overrides,
});

/**
 * Factory for generating role permission summaries
 */
export const createMockRolePermissionSummary = (overrides: Partial<RolePermissionSummary> = {}): RolePermissionSummary => ({
  roleId: faker.number.int({ min: 1, max: 100 }),
  serviceCount: faker.number.int({ min: 0, max: 20 }),
  fullAccessServices: faker.helpers.multiple(() => faker.helpers.arrayElement([
    'mysql', 'postgresql', 'mongodb', 'files', 'email'
  ]), { count: { min: 0, max: 5 } }),
  limitedAccessServices: faker.helpers.multiple(() => faker.helpers.arrayElement([
    'system', 'cache', 'cors', 'logs'
  ]), { count: { min: 0, max: 3 } }),
  lookupCount: faker.number.int({ min: 0, max: 10 }),
  isAdmin: faker.datatype.boolean({ probability: 0.2 }),
  ...overrides,
});

/**
 * Factory for generating limit data (placeholder for when limit types are available)
 */
export const createMockLimit = (overrides: any = {}): any => ({
  id: faker.number.int({ min: 1, max: 1000 }),
  name: faker.helpers.arrayElement(['Rate Limit', 'Request Limit', 'Data Limit', 'Connection Limit']),
  description: faker.lorem.sentence(),
  type: faker.helpers.arrayElement(['per_minute', 'per_hour', 'per_day', 'concurrent']),
  value: faker.number.int({ min: 10, max: 10000 }),
  isActive: faker.datatype.boolean(),
  roleId: faker.helpers.maybe(() => faker.number.int({ min: 1, max: 100 })),
  userId: faker.helpers.maybe(() => faker.number.int({ min: 1, max: 100 })),
  serviceId: faker.helpers.maybe(() => faker.number.int({ min: 1, max: 50 })),
  createdDate: faker.date.past().toISOString(),
  lastModifiedDate: faker.date.recent().toISOString(),
  ...overrides,
});

/**
 * Factory for generating permission data
 */
export const createMockPermission = (overrides: any = {}): any => ({
  id: faker.number.int({ min: 1, max: 1000 }),
  name: faker.helpers.arrayElement(['read', 'write', 'delete', 'admin', 'execute']),
  description: faker.lorem.sentence(),
  resource: faker.helpers.arrayElement(['users', 'roles', 'services', 'system', 'files']),
  action: faker.helpers.arrayElement(['GET', 'POST', 'PUT', 'DELETE', 'PATCH']),
  isDefault: faker.datatype.boolean({ probability: 0.3 }),
  ...overrides,
});

/**
 * Factory for generating user data for security context
 */
export const createMockUser = (overrides: any = {}): any => ({
  id: faker.number.int({ min: 1, max: 1000 }),
  name: faker.person.fullName(),
  email: faker.internet.email(),
  username: faker.internet.username(),
  isActive: faker.datatype.boolean(),
  roleIds: faker.helpers.multiple(() => faker.number.int({ min: 1, max: 100 }), { count: { min: 1, max: 3 } }),
  lastLoginDate: faker.helpers.maybe(() => faker.date.recent().toISOString()),
  createdDate: faker.date.past().toISOString(),
  lastModifiedDate: faker.date.recent().toISOString(),
  ...overrides,
});

// ============================================================================
// MSW REQUEST HANDLERS
// ============================================================================

/**
 * Base URL for DreamFactory API endpoints
 */
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api/v2';

/**
 * Helper function to create paginated list responses
 */
const createPaginatedResponse = <T>(
  items: T[],
  page: number = 0,
  limit: number = 25
): ApiListResponse<T> => {
  const start = page * limit;
  const end = start + limit;
  const paginatedItems = items.slice(start, end);
  
  return {
    resource: paginatedItems,
    meta: {
      count: items.length,
      offset: start,
      limit,
      has_next: end < items.length,
      has_previous: page > 0,
      page_count: Math.ceil(items.length / limit),
      links: {
        first: `${API_BASE_URL}/system/role?limit=${limit}&offset=0`,
        last: `${API_BASE_URL}/system/role?limit=${limit}&offset=${Math.floor(items.length / limit) * limit}`,
        ...(end < items.length && { next: `${API_BASE_URL}/system/role?limit=${limit}&offset=${end}` }),
        ...(page > 0 && { previous: `${API_BASE_URL}/system/role?limit=${limit}&offset=${Math.max(0, start - limit)}` }),
      },
    },
    timestamp: new Date().toISOString(),
    request_id: faker.string.uuid(),
  };
};

/**
 * Helper function to create single resource responses
 */
const createResourceResponse = <T>(resource: T): ApiResourceResponse<T> => ({
  resource,
  timestamp: new Date().toISOString(),
  request_id: faker.string.uuid(),
});

/**
 * Helper function to create error responses
 */
const createErrorResponse = (
  code: string,
  message: string,
  statusCode: number = 400,
  context?: any
): ApiErrorResponse => ({
  success: false,
  error: {
    code,
    message,
    status_code: statusCode,
    context,
    stack: process.env.NODE_ENV === 'development' ? new Error().stack : undefined,
  },
  timestamp: new Date().toISOString(),
  request_id: faker.string.uuid(),
});

/**
 * In-memory data store for MSW handlers
 * Simulates database state during testing
 */
class MockDataStore {
  private roles: Map<number, RoleWithRelations> = new Map();
  private limits: Map<number, any> = new Map();
  private users: Map<number, any> = new Map();
  private permissions: Map<number, any> = new Map();
  
  constructor() {
    this.seedInitialData();
  }
  
  private seedInitialData() {
    // Create initial roles
    for (let i = 1; i <= 10; i++) {
      const role = createMockRoleWithRelations({ id: i });
      this.roles.set(i, role);
    }
    
    // Create initial limits
    for (let i = 1; i <= 15; i++) {
      const limit = createMockLimit({ id: i });
      this.limits.set(i, limit);
    }
    
    // Create initial users
    for (let i = 1; i <= 20; i++) {
      const user = createMockUser({ id: i });
      this.users.set(i, user);
    }
    
    // Create initial permissions
    for (let i = 1; i <= 25; i++) {
      const permission = createMockPermission({ id: i });
      this.permissions.set(i, permission);
    }
  }
  
  // Role operations
  getRoles(): RoleWithRelations[] {
    return Array.from(this.roles.values());
  }
  
  getRole(id: number): RoleWithRelations | undefined {
    return this.roles.get(id);
  }
  
  createRole(data: CreateRoleData): RoleWithRelations {
    const id = Math.max(...this.roles.keys()) + 1;
    const role = createMockRoleWithRelations({
      id,
      ...data,
      createdDate: new Date().toISOString(),
      lastModifiedDate: new Date().toISOString(),
      createdById: 1, // Current user ID
      lastModifiedById: 1,
    });
    this.roles.set(id, role);
    return role;
  }
  
  updateRole(id: number, data: Partial<UpdateRoleData>): RoleWithRelations | undefined {
    const role = this.roles.get(id);
    if (!role) return undefined;
    
    const updatedRole = {
      ...role,
      ...data,
      lastModifiedDate: new Date().toISOString(),
      lastModifiedById: 1, // Current user ID
    };
    this.roles.set(id, updatedRole);
    return updatedRole;
  }
  
  deleteRole(id: number): boolean {
    return this.roles.delete(id);
  }
  
  // Limit operations
  getLimits(): any[] {
    return Array.from(this.limits.values());
  }
  
  getLimit(id: number): any | undefined {
    return this.limits.get(id);
  }
  
  createLimit(data: any): any {
    const id = Math.max(...this.limits.keys()) + 1;
    const limit = createMockLimit({
      id,
      ...data,
      createdDate: new Date().toISOString(),
      lastModifiedDate: new Date().toISOString(),
    });
    this.limits.set(id, limit);
    return limit;
  }
  
  updateLimit(id: number, data: any): any | undefined {
    const limit = this.limits.get(id);
    if (!limit) return undefined;
    
    const updatedLimit = {
      ...limit,
      ...data,
      lastModifiedDate: new Date().toISOString(),
    };
    this.limits.set(id, updatedLimit);
    return updatedLimit;
  }
  
  deleteLimit(id: number): boolean {
    return this.limits.delete(id);
  }
  
  // User operations
  getUsers(): any[] {
    return Array.from(this.users.values());
  }
  
  getUser(id: number): any | undefined {
    return this.users.get(id);
  }
  
  // Permission operations
  getPermissions(): any[] {
    return Array.from(this.permissions.values());
  }
  
  getPermission(id: number): any | undefined {
    return this.permissions.get(id);
  }
  
  // Utility methods
  reset() {
    this.roles.clear();
    this.limits.clear();
    this.users.clear();
    this.permissions.clear();
    this.seedInitialData();
  }
  
  clear() {
    this.roles.clear();
    this.limits.clear();
    this.users.clear();
    this.permissions.clear();
  }
}

// Global mock data store instance
const mockDataStore = new MockDataStore();

/**
 * MSW request handlers for role management operations
 */
export const roleHandlers: RequestHandler[] = [
  // Get roles list with pagination and filtering
  rest.get(`${API_BASE_URL}/system/role`, (req, res, ctx) => {
    const url = new URL(req.url);
    const limit = parseInt(url.searchParams.get('limit') || '25');
    const offset = parseInt(url.searchParams.get('offset') || '0');
    const filter = url.searchParams.get('filter');
    const sort = url.searchParams.get('sort');
    const includeCount = url.searchParams.get('includeCount') === 'true';
    
    let roles = mockDataStore.getRoles();
    
    // Apply filtering
    if (filter) {
      const filterLower = filter.toLowerCase();
      roles = roles.filter(role => 
        role.name.toLowerCase().includes(filterLower) ||
        role.description.toLowerCase().includes(filterLower)
      );
    }
    
    // Apply sorting
    if (sort) {
      const [field, direction = 'asc'] = sort.split(' ');
      roles.sort((a, b) => {
        const aVal = (a as any)[field];
        const bVal = (b as any)[field];
        const comparison = aVal < bVal ? -1 : aVal > bVal ? 1 : 0;
        return direction === 'desc' ? -comparison : comparison;
      });
    }
    
    const page = Math.floor(offset / limit);
    const response = createPaginatedResponse(roles, page, limit);
    
    return res(ctx.status(200), ctx.json(response));
  }),
  
  // Get single role by ID
  rest.get(`${API_BASE_URL}/system/role/:id`, (req, res, ctx) => {
    const id = parseInt(req.params.id as string);
    const role = mockDataStore.getRole(id);
    
    if (!role) {
      return res(
        ctx.status(404),
        ctx.json(createErrorResponse('ROLE_NOT_FOUND', `Role with ID ${id} not found`, 404))
      );
    }
    
    return res(ctx.status(200), ctx.json(createResourceResponse(role)));
  }),
  
  // Create new role
  rest.post(`${API_BASE_URL}/system/role`, async (req, res, ctx) => {
    try {
      const roleData = await req.json() as CreateRoleData;
      
      // Validate required fields
      if (!roleData.name || !roleData.description) {
        return res(
          ctx.status(400),
          ctx.json(createErrorResponse(
            'VALIDATION_ERROR',
            'Name and description are required',
            400,
            { errors: { name: ['Name is required'], description: ['Description is required'] } }
          ))
        );
      }
      
      // Check for duplicate name
      const existingRoles = mockDataStore.getRoles();
      if (existingRoles.some(role => role.name === roleData.name)) {
        return res(
          ctx.status(409),
          ctx.json(createErrorResponse(
            'DUPLICATE_ROLE_NAME',
            `Role with name '${roleData.name}' already exists`,
            409
          ))
        );
      }
      
      const newRole = mockDataStore.createRole(roleData);
      return res(ctx.status(201), ctx.json(createResourceResponse(newRole)));
    } catch (error) {
      return res(
        ctx.status(400),
        ctx.json(createErrorResponse('INVALID_JSON', 'Invalid JSON in request body', 400))
      );
    }
  }),
  
  // Update existing role
  rest.put(`${API_BASE_URL}/system/role/:id`, async (req, res, ctx) => {
    try {
      const id = parseInt(req.params.id as string);
      const updateData = await req.json() as Partial<UpdateRoleData>;
      
      const updatedRole = mockDataStore.updateRole(id, updateData);
      
      if (!updatedRole) {
        return res(
          ctx.status(404),
          ctx.json(createErrorResponse('ROLE_NOT_FOUND', `Role with ID ${id} not found`, 404))
        );
      }
      
      return res(ctx.status(200), ctx.json(createResourceResponse(updatedRole)));
    } catch (error) {
      return res(
        ctx.status(400),
        ctx.json(createErrorResponse('INVALID_JSON', 'Invalid JSON in request body', 400))
      );
    }
  }),
  
  // Delete role
  rest.delete(`${API_BASE_URL}/system/role/:id`, (req, res, ctx) => {
    const id = parseInt(req.params.id as string);
    const deleted = mockDataStore.deleteRole(id);
    
    if (!deleted) {
      return res(
        ctx.status(404),
        ctx.json(createErrorResponse('ROLE_NOT_FOUND', `Role with ID ${id} not found`, 404))
      );
    }
    
    const response: ApiSuccessResponse = {
      success: true,
      message: `Role with ID ${id} deleted successfully`,
      timestamp: new Date().toISOString(),
      request_id: faker.string.uuid(),
    };
    
    return res(ctx.status(200), ctx.json(response));
  }),
];

/**
 * MSW request handlers for limit management operations
 */
export const limitHandlers: RequestHandler[] = [
  // Get limits list
  rest.get(`${API_BASE_URL}/system/limit`, (req, res, ctx) => {
    const url = new URL(req.url);
    const limit = parseInt(url.searchParams.get('limit') || '25');
    const offset = parseInt(url.searchParams.get('offset') || '0');
    const filter = url.searchParams.get('filter');
    
    let limits = mockDataStore.getLimits();
    
    // Apply filtering
    if (filter) {
      const filterLower = filter.toLowerCase();
      limits = limits.filter(limit => 
        limit.name.toLowerCase().includes(filterLower) ||
        limit.description.toLowerCase().includes(filterLower)
      );
    }
    
    const page = Math.floor(offset / limit);
    const response = createPaginatedResponse(limits, page, limit);
    
    return res(ctx.status(200), ctx.json(response));
  }),
  
  // Get single limit by ID
  rest.get(`${API_BASE_URL}/system/limit/:id`, (req, res, ctx) => {
    const id = parseInt(req.params.id as string);
    const limit = mockDataStore.getLimit(id);
    
    if (!limit) {
      return res(
        ctx.status(404),
        ctx.json(createErrorResponse('LIMIT_NOT_FOUND', `Limit with ID ${id} not found`, 404))
      );
    }
    
    return res(ctx.status(200), ctx.json(createResourceResponse(limit)));
  }),
  
  // Create new limit
  rest.post(`${API_BASE_URL}/system/limit`, async (req, res, ctx) => {
    try {
      const limitData = await req.json();
      const newLimit = mockDataStore.createLimit(limitData);
      return res(ctx.status(201), ctx.json(createResourceResponse(newLimit)));
    } catch (error) {
      return res(
        ctx.status(400),
        ctx.json(createErrorResponse('INVALID_JSON', 'Invalid JSON in request body', 400))
      );
    }
  }),
  
  // Update existing limit
  rest.put(`${API_BASE_URL}/system/limit/:id`, async (req, res, ctx) => {
    try {
      const id = parseInt(req.params.id as string);
      const updateData = await req.json();
      
      const updatedLimit = mockDataStore.updateLimit(id, updateData);
      
      if (!updatedLimit) {
        return res(
          ctx.status(404),
          ctx.json(createErrorResponse('LIMIT_NOT_FOUND', `Limit with ID ${id} not found`, 404))
        );
      }
      
      return res(ctx.status(200), ctx.json(createResourceResponse(updatedLimit)));
    } catch (error) {
      return res(
        ctx.status(400),
        ctx.json(createErrorResponse('INVALID_JSON', 'Invalid JSON in request body', 400))
      );
    }
  }),
  
  // Delete limit
  rest.delete(`${API_BASE_URL}/system/limit/:id`, (req, res, ctx) => {
    const id = parseInt(req.params.id as string);
    const deleted = mockDataStore.deleteLimit(id);
    
    if (!deleted) {
      return res(
        ctx.status(404),
        ctx.json(createErrorResponse('LIMIT_NOT_FOUND', `Limit with ID ${id} not found`, 404))
      );
    }
    
    const response: ApiSuccessResponse = {
      success: true,
      message: `Limit with ID ${id} deleted successfully`,
      timestamp: new Date().toISOString(),
      request_id: faker.string.uuid(),
    };
    
    return res(ctx.status(200), ctx.json(response));
  }),
];

/**
 * MSW request handlers for user management operations
 */
export const userHandlers: RequestHandler[] = [
  // Get users list
  rest.get(`${API_BASE_URL}/system/user`, (req, res, ctx) => {
    const url = new URL(req.url);
    const limit = parseInt(url.searchParams.get('limit') || '25');
    const offset = parseInt(url.searchParams.get('offset') || '0');
    
    const users = mockDataStore.getUsers();
    const page = Math.floor(offset / limit);
    const response = createPaginatedResponse(users, page, limit);
    
    return res(ctx.status(200), ctx.json(response));
  }),
  
  // Get single user by ID
  rest.get(`${API_BASE_URL}/system/user/:id`, (req, res, ctx) => {
    const id = parseInt(req.params.id as string);
    const user = mockDataStore.getUser(id);
    
    if (!user) {
      return res(
        ctx.status(404),
        ctx.json(createErrorResponse('USER_NOT_FOUND', `User with ID ${id} not found`, 404))
      );
    }
    
    return res(ctx.status(200), ctx.json(createResourceResponse(user)));
  }),
];

/**
 * MSW request handlers for permission operations
 */
export const permissionHandlers: RequestHandler[] = [
  // Get permissions list
  rest.get(`${API_BASE_URL}/system/permission`, (req, res, ctx) => {
    const permissions = mockDataStore.getPermissions();
    const response = createPaginatedResponse(permissions, 0, permissions.length);
    return res(ctx.status(200), ctx.json(response));
  }),
];

/**
 * MSW request handlers for security statistics
 */
export const securityStatsHandlers: RequestHandler[] = [
  // Get security statistics
  rest.get(`${API_BASE_URL}/system/stats/security`, (req, res, ctx) => {
    const roles = mockDataStore.getRoles();
    const limits = mockDataStore.getLimits();
    const users = mockDataStore.getUsers();
    
    const stats = {
      totalRoles: roles.length,
      activeRoles: roles.filter(role => role.isActive).length,
      totalLimits: limits.length,
      activeLimits: limits.filter(limit => limit.isActive).length,
      totalUsers: users.length,
      activeUsers: users.filter(user => user.isActive).length,
      recentViolations: faker.number.int({ min: 0, max: 10 }),
      securityScore: faker.number.int({ min: 75, max: 100 }),
      lastUpdated: new Date().toISOString(),
    };
    
    return res(ctx.status(200), ctx.json(createResourceResponse(stats)));
  }),
];

// ============================================================================
// COMPLETE HANDLER COLLECTION
// ============================================================================

/**
 * Complete collection of MSW handlers for API security components
 */
export const apiSecurityHandlers: RequestHandler[] = [
  ...roleHandlers,
  ...limitHandlers,
  ...userHandlers,
  ...permissionHandlers,
  ...securityStatsHandlers,
];

// ============================================================================
// REACT QUERY TESTING UTILITIES
// ============================================================================

/**
 * Creates a new QueryClient instance for testing
 * Configured with appropriate defaults for test scenarios
 */
export const createTestQueryClient = () => {
  return new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        cacheTime: 0,
        staleTime: 0,
        refetchOnWindowFocus: false,
        refetchOnReconnect: false,
      },
      mutations: {
        retry: false,
      },
    },
    logger: {
      log: () => {},
      warn: () => {},
      error: () => {},
    },
  });
};

/**
 * Wrapper component that provides React Query client for testing
 */
export const QueryClientWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const queryClient = createTestQueryClient();
  return (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
};

// ============================================================================
// ZUSTAND TESTING UTILITIES
// ============================================================================

/**
 * Mock store factory for Zustand stores
 */
export const createMockStore = <T>(initialState: T): StoreApi<T> => {
  return create(() => initialState);
};

/**
 * Mock security store for testing security components
 */
export const createMockSecurityStore = (initialState?: any) => {
  const defaultState = {
    selectedRole: null,
    selectedLimit: null,
    securityStats: {
      totalRoles: 10,
      activeRoles: 8,
      totalLimits: 15,
      activeLimits: 12,
      recentViolations: 3,
    },
    isLoading: false,
    error: null,
    setSelectedRole: (role: any) => {},
    setSelectedLimit: (limit: any) => {},
    updateSecurityStats: (stats: any) => {},
    setLoading: (loading: boolean) => {},
    setError: (error: any) => {},
  };
  
  return createMockStore({
    ...defaultState,
    ...initialState,
  });
};

// ============================================================================
// REACT TESTING LIBRARY UTILITIES
// ============================================================================

/**
 * All providers wrapper for comprehensive testing setup
 */
interface AllProvidersProps {
  children: React.ReactNode;
  queryClient?: QueryClient;
  securityStore?: any;
}

export const AllProviders: React.FC<AllProvidersProps> = ({
  children,
  queryClient,
  securityStore,
}) => {
  const testQueryClient = queryClient || createTestQueryClient();
  
  return (
    <QueryClientProvider client={testQueryClient}>
      {children}
    </QueryClientProvider>
  );
};

/**
 * Custom render function with providers
 */
interface CustomRenderOptions extends Omit<RenderOptions, 'wrapper'> {
  queryClient?: QueryClient;
  securityStore?: any;
}

export const renderWithProviders = (
  ui: ReactElement,
  options?: CustomRenderOptions
) => {
  const { queryClient, securityStore, ...renderOptions } = options || {};
  
  const Wrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
    <AllProviders queryClient={queryClient} securityStore={securityStore}>
      {children}
    </AllProviders>
  );
  
  return render(ui, { wrapper: Wrapper, ...renderOptions });
};

/**
 * Utility for testing React Query hooks in isolation
 */
export const renderHookWithProviders = <T,>(
  hook: () => T,
  options?: {
    queryClient?: QueryClient;
    securityStore?: any;
  }
) => {
  const { queryClient, securityStore } = options || {};
  
  const wrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
    <AllProviders queryClient={queryClient} securityStore={securityStore}>
      {children}
    </AllProviders>
  );
  
  return { wrapper };
};

// ============================================================================
// TESTING SCENARIO HELPERS
// ============================================================================

/**
 * Creates error scenarios for testing error handling
 */
export const createErrorScenarios = {
  networkError: () => {
    return rest.get(`${API_BASE_URL}/*`, (req, res, ctx) => {
      return res.networkError('Network connection failed');
    });
  },
  
  serverError: (message: string = 'Internal server error') => {
    return rest.get(`${API_BASE_URL}/*`, (req, res, ctx) => {
      return res(
        ctx.status(500),
        ctx.json(createErrorResponse('INTERNAL_ERROR', message, 500))
      );
    });
  },
  
  validationError: (field: string, message: string) => {
    return rest.post(`${API_BASE_URL}/*`, (req, res, ctx) => {
      return res(
        ctx.status(422),
        ctx.json(createErrorResponse(
          'VALIDATION_ERROR',
          'Validation failed',
          422,
          { errors: { [field]: [message] } }
        ))
      );
    });
  },
  
  authenticationError: () => {
    return rest.get(`${API_BASE_URL}/*`, (req, res, ctx) => {
      return res(
        ctx.status(401),
        ctx.json(createErrorResponse('UNAUTHORIZED', 'Authentication required', 401))
      );
    });
  },
  
  authorizationError: () => {
    return rest.get(`${API_BASE_URL}/*`, (req, res, ctx) => {
      return res(
        ctx.status(403),
        ctx.json(createErrorResponse('FORBIDDEN', 'Insufficient permissions', 403))
      );
    });
  },
};

/**
 * Creates loading scenarios for testing loading states
 */
export const createLoadingScenarios = {
  slowResponse: (delay: number = 2000) => {
    return rest.get(`${API_BASE_URL}/*`, (req, res, ctx) => {
      return res(ctx.delay(delay), ctx.status(200), ctx.json({}));
    });
  },
  
  timeoutResponse: () => {
    return rest.get(`${API_BASE_URL}/*`, (req, res, ctx) => {
      return res(ctx.delay('infinite'));
    });
  },
};

/**
 * Creates pagination scenarios for testing pagination components
 */
export const createPaginationScenarios = {
  emptyResult: () => {
    return rest.get(`${API_BASE_URL}/system/role`, (req, res, ctx) => {
      return res(ctx.status(200), ctx.json(createPaginatedResponse([], 0, 25)));
    });
  },
  
  singlePage: (count: number = 10) => {
    const roles = Array.from({ length: count }, (_, i) => createMockRole({ id: i + 1 }));
    return rest.get(`${API_BASE_URL}/system/role`, (req, res, ctx) => {
      return res(ctx.status(200), ctx.json(createPaginatedResponse(roles, 0, 25)));
    });
  },
  
  multiplePages: (totalCount: number = 100, pageSize: number = 25) => {
    return rest.get(`${API_BASE_URL}/system/role`, (req, res, ctx) => {
      const url = new URL(req.url);
      const offset = parseInt(url.searchParams.get('offset') || '0');
      const limit = parseInt(url.searchParams.get('limit') || '25');
      const page = Math.floor(offset / limit);
      
      const roles = Array.from({ length: totalCount }, (_, i) => createMockRole({ id: i + 1 }));
      return res(ctx.status(200), ctx.json(createPaginatedResponse(roles, page, limit)));
    });
  },
};

// ============================================================================
// DATA STORE UTILITIES
// ============================================================================

/**
 * Utilities for managing the mock data store during tests
 */
export const dataStoreUtils = {
  /**
   * Reset the data store to initial state
   */
  reset: () => {
    mockDataStore.reset();
  },
  
  /**
   * Clear all data from the store
   */
  clear: () => {
    mockDataStore.clear();
  },
  
  /**
   * Seed the store with specific data
   */
  seedRoles: (roles: RoleWithRelations[]) => {
    mockDataStore.clear();
    roles.forEach(role => {
      mockDataStore.createRole(role);
    });
  },
  
  seedLimits: (limits: any[]) => {
    mockDataStore.clear();
    limits.forEach(limit => {
      mockDataStore.createLimit(limit);
    });
  },
  
  /**
   * Get current data for assertions
   */
  getCurrentRoles: () => mockDataStore.getRoles(),
  getCurrentLimits: () => mockDataStore.getLimits(),
  getCurrentUsers: () => mockDataStore.getUsers(),
  
  /**
   * Create specific test scenarios
   */
  createEmptyState: () => {
    mockDataStore.clear();
  },
  
  createMinimalState: () => {
    mockDataStore.clear();
    mockDataStore.createRole(createMockRole({ name: 'Admin', isActive: true }));
    mockDataStore.createLimit(createMockLimit({ name: 'Default Limit', isActive: true }));
  },
};

// ============================================================================
// EXPORTS
// ============================================================================

// Export everything for easy importing
export {
  // Handlers
  roleHandlers,
  limitHandlers,
  userHandlers,
  permissionHandlers,
  securityStatsHandlers,
  
  // Test utilities
  QueryClientWrapper,
  renderWithProviders,
  renderHookWithProviders,
  createTestQueryClient,
  createMockStore,
  createMockSecurityStore,
  
  // Data factories
  createMockRole,
  createMockRoleWithRelations,
  createMockRoleListItem,
  createMockRoleServiceAccess,
  createMockRoleLookup,
  createMockRolePermissionSummary,
  createMockLimit,
  createMockPermission,
  createMockUser,
  
  // Scenario helpers
  createErrorScenarios,
  createLoadingScenarios,
  createPaginationScenarios,
  
  // Response helpers
  createPaginatedResponse,
  createResourceResponse,
  createErrorResponse,
  
  // Data store
  dataStoreUtils,
};

// Default export
export default {
  handlers: apiSecurityHandlers,
  factories: {
    createMockRole,
    createMockRoleWithRelations,
    createMockLimit,
    createMockUser,
    createMockPermission,
  },
  utilities: {
    renderWithProviders,
    createTestQueryClient,
    dataStoreUtils,
  },
  scenarios: {
    errors: createErrorScenarios,
    loading: createLoadingScenarios,
    pagination: createPaginationScenarios,
  },
};