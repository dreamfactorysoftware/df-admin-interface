/**
 * Role Management Types for React/Next.js Migration
 * 
 * Comprehensive type definitions for role management operations including
 * role configurations, permissions, access control rules, and data structures
 * for the DreamFactory Admin Interface React migration.
 * 
 * @author DreamFactory Admin Interface Team
 * @version React 19/Next.js 15.1 Migration
 */

import { z } from 'zod'

// =============================================================================
// CORE ROLE DATA STRUCTURES
// =============================================================================

/**
 * Role table row representation for list displays
 * Simplified interface for role listing components
 */
export interface RoleRow {
  id: number
  name: string
  description: string
  active: boolean
}

/**
 * Complete role entity type for CRUD operations
 * Maintains compatibility with DreamFactory backend API
 */
export interface RoleType {
  id: number
  name: string
  description: string
  isActive: boolean
  createdById: number
  createdDate: string
  lastModifiedById: number
  lastModifiedDate: string
  lookupByRoleId: number[]
  accessibleTabs?: Array<string>
  
  // Extended properties for role management
  roleServiceAccessByRoleId?: RoleServiceAccessType[]
  permissions?: RolePermission[]
  userCount?: number
  lastUsed?: string
}

/**
 * Role creation payload for API requests
 * Subset of RoleType for new role creation
 */
export interface RoleCreatePayload {
  name: string
  description: string
  isActive: boolean
  lookupByRoleId?: number[]
  accessibleTabs?: Array<string>
  roleServiceAccessByRoleId?: Omit<RoleServiceAccessType, 'id' | 'roleId'>[]
}

/**
 * Role update payload for API requests
 * Includes ID and allows partial updates
 */
export interface RoleUpdatePayload extends Partial<RoleCreatePayload> {
  id: number
}

// =============================================================================
// ROLE SERVICE ACCESS CONFIGURATION
// =============================================================================

/**
 * Service access configuration for roles
 * Defines which services a role can access and with what permissions
 */
export interface RoleServiceAccessType {
  id?: number
  roleId: number
  serviceId: number
  serviceName: string
  component: string
  access: number // Bitmask for permissions
  requester: number // Bitmask for requester permissions
  filters?: RoleAccessFilter[]
  
  // Extended properties for access management
  description?: string
  isActive?: boolean
  createdDate?: string
  lastModifiedDate?: string
}

/**
 * Advanced filter configuration for role access
 * Allows granular control over data access
 */
export interface RoleAccessFilter {
  name: string
  operator: 'eq' | 'ne' | 'gt' | 'lt' | 'gte' | 'lte' | 'in' | 'not_in' | 'like' | 'not_like'
  value: string | number | boolean | Array<string | number>
  conjunction?: 'and' | 'or'
}

/**
 * Permission configuration for role-based access control
 * Defines specific permissions for resources
 */
export interface RolePermission {
  id?: number
  roleId: number
  resource: string
  action: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE' | 'OPTIONS' | 'HEAD'
  allow: boolean
  conditions?: Record<string, unknown>
  
  // Extended properties
  description?: string
  priority?: number
  isActive?: boolean
}

// =============================================================================
// ACCESS CONTROL ENUMS AND CONSTANTS
// =============================================================================

/**
 * Standard access levels for role permissions
 * Bitmask values for granular permission control
 */
export enum AccessLevel {
  NONE = 0,
  READ = 1,
  CREATE = 2,
  UPDATE = 4,
  DELETE = 8,
  ADMIN = 15, // All permissions
}

/**
 * Requester permission levels
 * Controls who can make requests on behalf of others
 */
export enum RequesterLevel {
  NONE = 0,
  SELF = 1,
  OTHERS = 2,
  ALL = 3,
}

/**
 * Role status enumeration for filtering and management
 */
export enum RoleStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  PENDING = 'pending',
  SUSPENDED = 'suspended',
}

// =============================================================================
// ROLE MANAGEMENT OPERATION TYPES
// =============================================================================

/**
 * Role list query parameters for filtering and pagination
 * Supports comprehensive role filtering and sorting
 */
export interface RoleListParams {
  limit?: number
  offset?: number
  sort?: string
  order?: 'asc' | 'desc'
  search?: string
  filter?: string
  status?: RoleStatus[]
  includeInactive?: boolean
  related?: string | string[]
  fields?: string | string[]
  
  // Cache control
  refresh?: boolean
  staleTime?: number
}

/**
 * Role management operation result
 * Standardized response format for role operations
 */
export interface RoleOperationResult<T = RoleType> {
  success: boolean
  data?: T
  error?: {
    code: string
    message: string
    details?: Record<string, unknown>
  }
  metadata?: {
    timestamp: string
    operation: 'create' | 'read' | 'update' | 'delete' | 'list'
    affectedRows?: number
  }
}

/**
 * Bulk role operation payload
 * Supports batch operations on multiple roles
 */
export interface RoleBulkOperation {
  operation: 'activate' | 'deactivate' | 'delete' | 'update'
  roleIds: number[]
  data?: Partial<RoleUpdatePayload>
  confirm?: boolean
}

// =============================================================================
// HOOK CONFIGURATION TYPES
// =============================================================================

/**
 * Configuration options for role management hooks
 * Customizes behavior of role data fetching and mutations
 */
export interface RoleHookOptions {
  // Cache configuration
  staleTime?: number
  cacheTime?: number
  refetchOnMount?: boolean
  refetchOnWindowFocus?: boolean
  refetchOnReconnect?: boolean
  refetchInterval?: number
  
  // Error handling
  retry?: boolean | number
  retryDelay?: number
  onError?: (error: Error) => void
  
  // Optimistic updates
  enableOptimisticUpdates?: boolean
  onMutate?: (variables: unknown) => void
  onSuccess?: (data: unknown) => void
  onSettled?: (data: unknown, error: Error | null) => void
  
  // Related data fetching
  includeRelated?: boolean
  relatedQueries?: string[]
  prefetchRelated?: boolean
}

/**
 * Role query state for hook return values
 * Provides comprehensive state information for components
 */
export interface RoleQueryState<T = RoleType> {
  data?: T
  isLoading: boolean
  isError: boolean
  error?: Error
  isSuccess: boolean
  isFetching: boolean
  isStale: boolean
  dataUpdatedAt: number
  errorUpdatedAt: number
  failureCount: number
  refetch: () => Promise<T>
  remove: () => void
}

/**
 * Role mutation state for CRUD operations
 * Provides state management for role modifications
 */
export interface RoleMutationState<TData = unknown, TVariables = unknown> {
  mutate: (variables: TVariables) => void
  mutateAsync: (variables: TVariables) => Promise<TData>
  isLoading: boolean
  isError: boolean
  isSuccess: boolean
  error?: Error
  data?: TData
  reset: () => void
  
  // Status tracking
  status: 'idle' | 'loading' | 'success' | 'error'
  submittedAt?: number
  variables?: TVariables
}

// =============================================================================
// ZOD VALIDATION SCHEMAS
// =============================================================================

/**
 * Zod schema for access filter validation
 */
export const RoleAccessFilterSchema = z.object({
  name: z.string().min(1, 'Filter name is required'),
  operator: z.enum(['eq', 'ne', 'gt', 'lt', 'gte', 'lte', 'in', 'not_in', 'like', 'not_like']),
  value: z.union([
    z.string(),
    z.number(),
    z.boolean(),
    z.array(z.union([z.string(), z.number()]))
  ]),
  conjunction: z.enum(['and', 'or']).optional(),
})

/**
 * Zod schema for role service access configuration
 */
export const RoleServiceAccessSchema = z.object({
  id: z.number().optional(),
  roleId: z.number().min(1, 'Role ID is required'),
  serviceId: z.number().min(1, 'Service ID is required'),
  serviceName: z.string().min(1, 'Service name is required'),
  component: z.string().min(1, 'Component is required'),
  access: z.number().min(0).max(15, 'Invalid access level'),
  requester: z.number().min(0).max(3, 'Invalid requester level'),
  filters: z.array(RoleAccessFilterSchema).optional(),
  description: z.string().optional(),
  isActive: z.boolean().optional(),
})

/**
 * Zod schema for role permission validation
 */
export const RolePermissionSchema = z.object({
  id: z.number().optional(),
  roleId: z.number().min(1, 'Role ID is required'),
  resource: z.string().min(1, 'Resource is required'),
  action: z.enum(['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS', 'HEAD']),
  allow: z.boolean(),
  conditions: z.record(z.unknown()).optional(),
  description: z.string().optional(),
  priority: z.number().optional(),
  isActive: z.boolean().optional(),
})

/**
 * Zod schema for role creation payload validation
 */
export const RoleCreatePayloadSchema = z.object({
  name: z.string()
    .min(1, 'Role name is required')
    .max(100, 'Role name must be less than 100 characters')
    .regex(/^[a-zA-Z0-9_\-\s]+$/, 'Role name can only contain letters, numbers, spaces, hyphens, and underscores'),
  description: z.string()
    .max(255, 'Description must be less than 255 characters')
    .optional(),
  isActive: z.boolean().default(true),
  lookupByRoleId: z.array(z.number()).optional(),
  accessibleTabs: z.array(z.string()).optional(),
  roleServiceAccessByRoleId: z.array(RoleServiceAccessSchema.omit({ id: true, roleId: true })).optional(),
})

/**
 * Zod schema for role update payload validation
 */
export const RoleUpdatePayloadSchema = RoleCreatePayloadSchema.partial().extend({
  id: z.number().min(1, 'Role ID is required'),
})

/**
 * Zod schema for role list parameters validation
 */
export const RoleListParamsSchema = z.object({
  limit: z.number().min(1).max(1000).optional(),
  offset: z.number().min(0).optional(),
  sort: z.string().optional(),
  order: z.enum(['asc', 'desc']).optional(),
  search: z.string().optional(),
  filter: z.string().optional(),
  status: z.array(z.nativeEnum(RoleStatus)).optional(),
  includeInactive: z.boolean().optional(),
  related: z.union([z.string(), z.array(z.string())]).optional(),
  fields: z.union([z.string(), z.array(z.string())]).optional(),
  refresh: z.boolean().optional(),
  staleTime: z.number().min(0).optional(),
})

/**
 * Zod schema for bulk operation validation
 */
export const RoleBulkOperationSchema = z.object({
  operation: z.enum(['activate', 'deactivate', 'delete', 'update']),
  roleIds: z.array(z.number().min(1)).min(1, 'At least one role ID is required'),
  data: RoleUpdatePayloadSchema.partial().optional(),
  confirm: z.boolean().optional(),
})

// =============================================================================
// TYPE UTILITIES AND HELPERS
// =============================================================================

/**
 * Extract role ID type from role entities
 */
export type RoleId = RoleType['id']

/**
 * Create role list response type
 */
export type RoleListResponse<T = RoleType> = {
  resource: T[]
  meta: {
    count: number
    limit: number
    offset: number
    total?: number
  }
}

/**
 * Role form data type for form components
 */
export type RoleFormData = z.infer<typeof RoleCreatePayloadSchema>

/**
 * Role update form data type
 */
export type RoleUpdateFormData = z.infer<typeof RoleUpdatePayloadSchema>

/**
 * Role list query parameters type
 */
export type RoleListQueryParams = z.infer<typeof RoleListParamsSchema>

/**
 * Bulk operation parameters type
 */
export type RoleBulkOperationParams = z.infer<typeof RoleBulkOperationSchema>

/**
 * Role access control utility type
 * Extracts permission information for component-level access control
 */
export type RoleAccessControl = {
  canRead: boolean
  canCreate: boolean
  canUpdate: boolean
  canDelete: boolean
  canAdmin: boolean
  hasAccess: (resource: string, action: string) => boolean
  getPermissions: (resource?: string) => RolePermission[]
}

// =============================================================================
// EXPORTS
// =============================================================================

export type {
  // Core types
  RoleRow,
  RoleType,
  RoleCreatePayload,
  RoleUpdatePayload,
  
  // Service access types
  RoleServiceAccessType,
  RoleAccessFilter,
  RolePermission,
  
  // Operation types
  RoleListParams,
  RoleOperationResult,
  RoleBulkOperation,
  
  // Hook types
  RoleHookOptions,
  RoleQueryState,
  RoleMutationState,
  
  // Utility types
  RoleId,
  RoleListResponse,
  RoleFormData,
  RoleUpdateFormData,
  RoleListQueryParams,
  RoleBulkOperationParams,
  RoleAccessControl,
}

export {
  // Enums
  AccessLevel,
  RequesterLevel,
  RoleStatus,
  
  // Validation schemas
  RoleAccessFilterSchema,
  RoleServiceAccessSchema,
  RolePermissionSchema,
  RoleCreatePayloadSchema,
  RoleUpdatePayloadSchema,
  RoleListParamsSchema,
  RoleBulkOperationSchema,
}