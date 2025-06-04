/**
 * Role Management Hook for React/Next.js Migration
 * 
 * Comprehensive role management operations with SWR-based data fetching for role
 * configurations, permissions, and access control rules. Provides CRUD operations
 * for roles with intelligent caching and automatic revalidation. Replaces Angular
 * role resolver patterns with React Query-powered data synchronization and cache management.
 * 
 * Features:
 * - SWR/React Query for intelligent caching and synchronization
 * - Cache hit responses under 50ms per React/Next.js Integration Requirements
 * - React Query mutations with optimistic updates per Section 4.3.2 Server State Management
 * - Type-safe configuration workflows per Section 5.2 Component Details
 * - Role-based access control with component-level access control per Section 4.5.4.2
 * - Comprehensive error handling and retry logic per Section 4.2 error handling
 * 
 * @author DreamFactory Admin Interface Team
 * @version React 19/Next.js 15.1 Migration
 */

import { useCallback, useMemo } from 'react'
import useSWR, { mutate } from 'swr'
import { useQuery, useMutation, useQueryClient, UseQueryOptions, UseMutationOptions } from '@tanstack/react-query'
import { apiClient } from '@/lib/api-client'
import {
  RoleType,
  RoleRow,
  RoleCreatePayload,
  RoleUpdatePayload,
  RoleListParams,
  RoleOperationResult,
  RoleBulkOperation,
  RoleHookOptions,
  RoleQueryState,
  RoleMutationState,
  RoleListResponse,
  RoleAccessControl,
  AccessLevel,
  RequesterLevel,
  RoleStatus,
  RoleCreatePayloadSchema,
  RoleUpdatePayloadSchema,
  RoleListParamsSchema,
  RoleBulkOperationSchema,
} from '@/types/role'
import {
  ApiListResponse,
  ApiCreateResponse,
  ApiUpdateResponse,
  ApiDeleteResponse,
  ApiErrorResponse,
  ApiRequestOptions,
} from '@/types/api'

// =============================================================================
// CONSTANTS AND CONFIGURATION
// =============================================================================

/**
 * Cache configuration constants for optimal performance
 * Ensures cache hit responses under 50ms per React/Next.js Integration Requirements
 */
const CACHE_CONFIG = {
  STALE_TIME: 5 * 60 * 1000, // 5 minutes - data considered fresh
  CACHE_TIME: 10 * 60 * 1000, // 10 minutes - data kept in cache
  REFETCH_INTERVAL: 30 * 1000, // 30 seconds - background refetch interval
  RETRY_ATTEMPTS: 3,
  RETRY_DELAY: 1000, // 1 second base delay with exponential backoff
} as const

/**
 * API endpoints for role management operations
 * Maintains compatibility with DreamFactory backend API structure
 */
const ROLE_ENDPOINTS = {
  ROLES: '/system/role',
  ROLE_BY_ID: (id: number) => `/system/role/${id}`,
  ROLE_ACCESS: (id: number) => `/system/role/${id}/role_service_access_by_role_id`,
  LOOKUP_KEYS: (id: number) => `/system/role/${id}/lookup_by_role_id`,
  BULK_OPERATIONS: '/system/role',
} as const

/**
 * Query keys for React Query cache management
 * Provides intelligent cache invalidation and revalidation
 */
const QUERY_KEYS = {
  ROLES: ['roles'] as const,
  ROLE_LIST: (params?: RoleListParams) => ['roles', 'list', params] as const,
  ROLE_DETAIL: (id: number) => ['roles', 'detail', id] as const,
  ROLE_ACCESS: (id: number) => ['roles', 'access', id] as const,
  ROLE_LOOKUP: (id: number) => ['roles', 'lookup', id] as const,
  ROLE_PERMISSIONS: (id: number) => ['roles', 'permissions', id] as const,
} as const

// =============================================================================
// UTILITY FUNCTIONS
// =============================================================================

/**
 * Fetcher function for SWR with error handling and retry logic
 * Implements comprehensive error handling per Section 4.2 error handling
 */
const createRoleFetcher = (endpoint: string, options?: ApiRequestOptions) => {
  return async (): Promise<any> => {
    try {
      const response = await apiClient.get(endpoint, {
        headers: {
          'Content-Type': 'application/json',
          ...options?.headers,
        },
        ...options,
      })
      return response
    } catch (error) {
      // Enhanced error handling with categorization
      if (error instanceof Error) {
        const apiError: ApiErrorResponse = {
          error: {
            code: 'FETCH_ERROR',
            message: error.message,
            status_code: 500,
            context: endpoint,
            timestamp: new Date().toISOString(),
          },
        }
        throw apiError
      }
      throw error
    }
  }
}

/**
 * Transforms role data for display purposes
 * Converts RoleType to RoleRow for table components
 */
const transformRoleForDisplay = (role: RoleType): RoleRow => ({
  id: role.id,
  name: role.name,
  description: role.description,
  active: role.isActive,
})

/**
 * Validates role permissions for component-level access control
 * Implements role-based access control per Section 4.5.4.2 Component-Level Access Control
 */
const createAccessControl = (role?: RoleType): RoleAccessControl => {
  const permissions = role?.permissions || []
  
  return {
    canRead: permissions.some(p => p.action === 'GET' && p.allow),
    canCreate: permissions.some(p => p.action === 'POST' && p.allow),
    canUpdate: permissions.some(p => p.action === 'PUT' && p.allow),
    canDelete: permissions.some(p => p.action === 'DELETE' && p.allow),
    canAdmin: permissions.some(p => p.action === 'DELETE' && p.action === 'PUT' && p.action === 'POST' && p.allow),
    
    hasAccess: (resource: string, action: string) => {
      return permissions.some(p => 
        p.resource === resource && 
        p.action === action && 
        p.allow
      )
    },
    
    getPermissions: (resource?: string) => {
      return resource 
        ? permissions.filter(p => p.resource === resource)
        : permissions
    },
  }
}

// =============================================================================
// CORE ROLE MANAGEMENT HOOKS
// =============================================================================

/**
 * Hook for fetching a list of roles with intelligent caching
 * Replaces Angular rolesResolver patterns with SWR-based data fetching
 * per Section 3.2.4 HTTP client architecture
 */
export function useRoleList(
  params?: RoleListParams,
  options?: RoleHookOptions
): RoleQueryState<RoleListResponse<RoleType>> & {
  roles: RoleType[]
  rolesForDisplay: RoleRow[]
  totalCount: number
  hasMore: boolean
  refetch: () => Promise<RoleListResponse<RoleType>>
} {
  // Validate and normalize parameters
  const validatedParams = useMemo(() => {
    try {
      return params ? RoleListParamsSchema.parse(params) : {}
    } catch (error) {
      console.warn('Invalid role list parameters:', error)
      return {}
    }
  }, [params])

  // Configure query options with performance optimization
  const queryOptions: UseQueryOptions<RoleListResponse<RoleType>, ApiErrorResponse> = {
    queryKey: QUERY_KEYS.ROLE_LIST(validatedParams),
    queryFn: async () => {
      const endpoint = ROLE_ENDPOINTS.ROLES
      const requestOptions: ApiRequestOptions = {
        ...validatedParams,
        related: validatedParams.related || 'lookup_by_role_id',
        sort: validatedParams.sort || 'name',
      }
      
      const response = await apiClient.get(endpoint, { params: requestOptions })
      return response as RoleListResponse<RoleType>
    },
    staleTime: options?.staleTime || CACHE_CONFIG.STALE_TIME,
    cacheTime: options?.cacheTime || CACHE_CONFIG.CACHE_TIME,
    refetchOnMount: options?.refetchOnMount ?? true,
    refetchOnWindowFocus: options?.refetchOnWindowFocus ?? false,
    refetchOnReconnect: options?.refetchOnReconnect ?? true,
    refetchInterval: options?.refetchInterval || CACHE_CONFIG.REFETCH_INTERVAL,
    retry: options?.retry ?? CACHE_CONFIG.RETRY_ATTEMPTS,
    retryDelay: options?.retryDelay || CACHE_CONFIG.RETRY_DELAY,
    enabled: true,
    onError: options?.onError,
  }

  const query = useQuery(queryOptions)

  // Transform data for component consumption
  const transformedData = useMemo(() => {
    const roles = query.data?.resource || []
    const rolesForDisplay = roles.map(transformRoleForDisplay)
    const totalCount = query.data?.meta?.total || roles.length
    const hasMore = query.data?.meta?.count === query.data?.meta?.limit
    
    return {
      roles,
      rolesForDisplay,
      totalCount,
      hasMore,
    }
  }, [query.data])

  return {
    // Query state
    data: query.data,
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
    isSuccess: query.isSuccess,
    isFetching: query.isFetching,
    isStale: query.isStale,
    dataUpdatedAt: query.dataUpdatedAt,
    errorUpdatedAt: query.errorUpdatedAt,
    failureCount: query.failureCount,
    refetch: query.refetch,
    remove: query.remove,
    
    // Transformed data
    ...transformedData,
  }
}

/**
 * Hook for fetching individual role details with related data
 * Replaces Angular roleResolver patterns with SWR-based data fetching
 * per Section 3.2.4 HTTP client architecture
 */
export function useRoleDetail(
  id?: number,
  options?: RoleHookOptions & {
    includeAccess?: boolean
    includeLookup?: boolean
    includePermissions?: boolean
  }
): RoleQueryState<RoleType> & {
  role: RoleType | undefined
  accessControl: RoleAccessControl
  serviceAccess: any[]
  lookupKeys: number[]
} {
  // Configure query options with conditional fetching
  const queryOptions: UseQueryOptions<RoleType, ApiErrorResponse> = {
    queryKey: QUERY_KEYS.ROLE_DETAIL(id!),
    queryFn: async () => {
      if (!id) {
        throw new Error('Role ID is required')
      }
      
      const endpoint = ROLE_ENDPOINTS.ROLE_BY_ID(id)
      const relatedQueries = []
      
      if (options?.includeAccess !== false) {
        relatedQueries.push('role_service_access_by_role_id')
      }
      if (options?.includeLookup !== false) {
        relatedQueries.push('lookup_by_role_id')
      }
      
      const requestOptions: ApiRequestOptions = {
        related: relatedQueries.join(','),
        additionalParams: [
          { key: 'accessible_tabs', value: true }
        ],
      }
      
      const response = await apiClient.get(endpoint, { params: requestOptions })
      return response as RoleType
    },
    enabled: !!id,
    staleTime: options?.staleTime || CACHE_CONFIG.STALE_TIME,
    cacheTime: options?.cacheTime || CACHE_CONFIG.CACHE_TIME,
    refetchOnMount: options?.refetchOnMount ?? true,
    refetchOnWindowFocus: options?.refetchOnWindowFocus ?? false,
    refetchOnReconnect: options?.refetchOnReconnect ?? true,
    retry: options?.retry ?? CACHE_CONFIG.RETRY_ATTEMPTS,
    retryDelay: options?.retryDelay || CACHE_CONFIG.RETRY_DELAY,
    onError: options?.onError,
  }

  const query = useQuery(queryOptions)

  // Transform data for component consumption
  const transformedData = useMemo(() => {
    const role = query.data
    const accessControl = createAccessControl(role)
    const serviceAccess = role?.roleServiceAccessByRoleId || []
    const lookupKeys = role?.lookupByRoleId || []
    
    return {
      role,
      accessControl,
      serviceAccess,
      lookupKeys,
    }
  }, [query.data])

  return {
    // Query state
    data: query.data,
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
    isSuccess: query.isSuccess,
    isFetching: query.isFetching,
    isStale: query.isStale,
    dataUpdatedAt: query.dataUpdatedAt,
    errorUpdatedAt: query.errorUpdatedAt,
    failureCount: query.failureCount,
    refetch: query.refetch,
    remove: query.remove,
    
    // Transformed data
    ...transformedData,
  }
}

// =============================================================================
// ROLE CRUD MUTATION HOOKS
// =============================================================================

/**
 * Hook for creating new roles with optimistic updates
 * Implements React Query mutations per Section 4.3.2 mutation workflows
 */
export function useCreateRole(
  options?: UseMutationOptions<ApiCreateResponse, ApiErrorResponse, RoleCreatePayload> & RoleHookOptions
): RoleMutationState<ApiCreateResponse, RoleCreatePayload> & {
  createRole: (data: RoleCreatePayload) => Promise<ApiCreateResponse>
} {
  const queryClient = useQueryClient()

  const mutation = useMutation({
    mutationFn: async (data: RoleCreatePayload) => {
      // Validate payload
      const validatedData = RoleCreatePayloadSchema.parse(data)
      
      const response = await apiClient.post(ROLE_ENDPOINTS.ROLES, validatedData)
      return response as ApiCreateResponse
    },
    
    // Optimistic update implementation
    onMutate: async (newRole) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: QUERY_KEYS.ROLES })
      
      // Snapshot previous value
      const previousRoles = queryClient.getQueryData(QUERY_KEYS.ROLE_LIST())
      
      // Optimistically update cache
      if (previousRoles && options?.enableOptimisticUpdates !== false) {
        const optimisticRole: RoleType = {
          id: Date.now(), // Temporary ID
          name: newRole.name,
          description: newRole.description,
          isActive: newRole.isActive,
          createdById: 0,
          createdDate: new Date().toISOString(),
          lastModifiedById: 0,
          lastModifiedDate: new Date().toISOString(),
          lookupByRoleId: newRole.lookupByRoleId || [],
          accessibleTabs: newRole.accessibleTabs,
        }
        
        queryClient.setQueryData(QUERY_KEYS.ROLE_LIST(), (old: any) => ({
          ...old,
          resource: [...(old?.resource || []), optimisticRole],
          meta: {
            ...old?.meta,
            count: (old?.meta?.count || 0) + 1,
            total: (old?.meta?.total || 0) + 1,
          },
        }))
      }
      
      // Custom onMutate callback
      options?.onMutate?.(newRole)
      
      return { previousRoles }
    },
    
    onError: (err, newRole, context) => {
      // Rollback optimistic update
      if (context?.previousRoles) {
        queryClient.setQueryData(QUERY_KEYS.ROLE_LIST(), context.previousRoles)
      }
      
      options?.onError?.(err)
    },
    
    onSuccess: (data, variables) => {
      // Invalidate and refetch role queries
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.ROLES })
      
      options?.onSuccess?.(data, variables, undefined)
    },
    
    onSettled: (data, error, variables) => {
      options?.onSettled?.(data, error, variables, undefined)
    },
  })

  return {
    mutate: mutation.mutate,
    mutateAsync: mutation.mutateAsync,
    isLoading: mutation.isLoading,
    isError: mutation.isError,
    isSuccess: mutation.isSuccess,
    error: mutation.error,
    data: mutation.data,
    reset: mutation.reset,
    status: mutation.status,
    submittedAt: mutation.submittedAt,
    variables: mutation.variables,
    createRole: mutation.mutateAsync,
  }
}

/**
 * Hook for updating existing roles with optimistic updates
 * Implements React Query mutations per Section 4.3.2 mutation workflows
 */
export function useUpdateRole(
  options?: UseMutationOptions<ApiUpdateResponse, ApiErrorResponse, RoleUpdatePayload> & RoleHookOptions
): RoleMutationState<ApiUpdateResponse, RoleUpdatePayload> & {
  updateRole: (data: RoleUpdatePayload) => Promise<ApiUpdateResponse>
} {
  const queryClient = useQueryClient()

  const mutation = useMutation({
    mutationFn: async (data: RoleUpdatePayload) => {
      // Validate payload
      const validatedData = RoleUpdatePayloadSchema.parse(data)
      
      const endpoint = ROLE_ENDPOINTS.ROLE_BY_ID(validatedData.id)
      const response = await apiClient.put(endpoint, validatedData)
      return response as ApiUpdateResponse
    },
    
    // Optimistic update implementation
    onMutate: async (updatedRole) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: QUERY_KEYS.ROLE_DETAIL(updatedRole.id) })
      await queryClient.cancelQueries({ queryKey: QUERY_KEYS.ROLE_LIST() })
      
      // Snapshot previous values
      const previousRole = queryClient.getQueryData(QUERY_KEYS.ROLE_DETAIL(updatedRole.id))
      const previousRoles = queryClient.getQueryData(QUERY_KEYS.ROLE_LIST())
      
      // Optimistically update individual role cache
      if (previousRole && options?.enableOptimisticUpdates !== false) {
        queryClient.setQueryData(QUERY_KEYS.ROLE_DETAIL(updatedRole.id), (old: RoleType) => ({
          ...old,
          ...updatedRole,
          lastModifiedDate: new Date().toISOString(),
        }))
      }
      
      // Optimistically update role list cache
      if (previousRoles && options?.enableOptimisticUpdates !== false) {
        queryClient.setQueryData(QUERY_KEYS.ROLE_LIST(), (old: any) => ({
          ...old,
          resource: old?.resource?.map((role: RoleType) =>
            role.id === updatedRole.id
              ? { ...role, ...updatedRole, lastModifiedDate: new Date().toISOString() }
              : role
          ) || [],
        }))
      }
      
      // Custom onMutate callback
      options?.onMutate?.(updatedRole)
      
      return { previousRole, previousRoles }
    },
    
    onError: (err, updatedRole, context) => {
      // Rollback optimistic updates
      if (context?.previousRole) {
        queryClient.setQueryData(QUERY_KEYS.ROLE_DETAIL(updatedRole.id), context.previousRole)
      }
      if (context?.previousRoles) {
        queryClient.setQueryData(QUERY_KEYS.ROLE_LIST(), context.previousRoles)
      }
      
      options?.onError?.(err)
    },
    
    onSuccess: (data, variables) => {
      // Invalidate and refetch affected queries
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.ROLE_DETAIL(variables.id) })
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.ROLES })
      
      options?.onSuccess?.(data, variables, undefined)
    },
    
    onSettled: (data, error, variables) => {
      options?.onSettled?.(data, error, variables, undefined)
    },
  })

  return {
    mutate: mutation.mutate,
    mutateAsync: mutation.mutateAsync,
    isLoading: mutation.isLoading,
    isError: mutation.isError,
    isSuccess: mutation.isSuccess,
    error: mutation.error,
    data: mutation.data,
    reset: mutation.reset,
    status: mutation.status,
    submittedAt: mutation.submittedAt,
    variables: mutation.variables,
    updateRole: mutation.mutateAsync,
  }
}

/**
 * Hook for deleting roles with optimistic updates
 * Implements React Query mutations per Section 4.3.2 mutation workflows
 */
export function useDeleteRole(
  options?: UseMutationOptions<ApiDeleteResponse, ApiErrorResponse, number> & RoleHookOptions
): RoleMutationState<ApiDeleteResponse, number> & {
  deleteRole: (id: number) => Promise<ApiDeleteResponse>
} {
  const queryClient = useQueryClient()

  const mutation = useMutation({
    mutationFn: async (id: number) => {
      const endpoint = ROLE_ENDPOINTS.ROLE_BY_ID(id)
      const response = await apiClient.delete(endpoint)
      return response as ApiDeleteResponse
    },
    
    // Optimistic update implementation
    onMutate: async (roleId) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: QUERY_KEYS.ROLE_DETAIL(roleId) })
      await queryClient.cancelQueries({ queryKey: QUERY_KEYS.ROLE_LIST() })
      
      // Snapshot previous values
      const previousRole = queryClient.getQueryData(QUERY_KEYS.ROLE_DETAIL(roleId))
      const previousRoles = queryClient.getQueryData(QUERY_KEYS.ROLE_LIST())
      
      // Optimistically remove from cache
      if (options?.enableOptimisticUpdates !== false) {
        queryClient.removeQueries({ queryKey: QUERY_KEYS.ROLE_DETAIL(roleId) })
        
        queryClient.setQueryData(QUERY_KEYS.ROLE_LIST(), (old: any) => ({
          ...old,
          resource: old?.resource?.filter((role: RoleType) => role.id !== roleId) || [],
          meta: {
            ...old?.meta,
            count: Math.max(0, (old?.meta?.count || 1) - 1),
            total: Math.max(0, (old?.meta?.total || 1) - 1),
          },
        }))
      }
      
      // Custom onMutate callback
      options?.onMutate?.(roleId)
      
      return { previousRole, previousRoles }
    },
    
    onError: (err, roleId, context) => {
      // Rollback optimistic updates
      if (context?.previousRole) {
        queryClient.setQueryData(QUERY_KEYS.ROLE_DETAIL(roleId), context.previousRole)
      }
      if (context?.previousRoles) {
        queryClient.setQueryData(QUERY_KEYS.ROLE_LIST(), context.previousRoles)
      }
      
      options?.onError?.(err)
    },
    
    onSuccess: (data, variables) => {
      // Clean up and invalidate related queries
      queryClient.removeQueries({ queryKey: QUERY_KEYS.ROLE_DETAIL(variables) })
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.ROLES })
      
      options?.onSuccess?.(data, variables, undefined)
    },
    
    onSettled: (data, error, variables) => {
      options?.onSettled?.(data, error, variables, undefined)
    },
  })

  return {
    mutate: mutation.mutate,
    mutateAsync: mutation.mutateAsync,
    isLoading: mutation.isLoading,
    isError: mutation.isError,
    isSuccess: mutation.isSuccess,
    error: mutation.error,
    data: mutation.data,
    reset: mutation.reset,
    status: mutation.status,
    submittedAt: mutation.submittedAt,
    variables: mutation.variables,
    deleteRole: mutation.mutateAsync,
  }
}

// =============================================================================
// BULK OPERATIONS AND UTILITY HOOKS
// =============================================================================

/**
 * Hook for bulk role operations with optimistic updates
 * Supports batch operations on multiple roles
 */
export function useBulkRoleOperations(
  options?: UseMutationOptions<ApiUpdateResponse[], ApiErrorResponse, RoleBulkOperation> & RoleHookOptions
) {
  const queryClient = useQueryClient()

  const mutation = useMutation({
    mutationFn: async (operation: RoleBulkOperation) => {
      // Validate operation
      const validatedOperation = RoleBulkOperationSchema.parse(operation)
      
      const promises = validatedOperation.roleIds.map(async (id) => {
        const endpoint = ROLE_ENDPOINTS.ROLE_BY_ID(id)
        
        switch (validatedOperation.operation) {
          case 'activate':
            return apiClient.put(endpoint, { id, isActive: true })
          case 'deactivate':
            return apiClient.put(endpoint, { id, isActive: false })
          case 'delete':
            return apiClient.delete(endpoint)
          case 'update':
            return apiClient.put(endpoint, { id, ...validatedOperation.data })
          default:
            throw new Error(`Unsupported operation: ${validatedOperation.operation}`)
        }
      })
      
      return Promise.all(promises)
    },
    
    onSuccess: () => {
      // Invalidate all role-related queries
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.ROLES })
    },
    
    onError: options?.onError,
  })

  return mutation
}

/**
 * Hook for invalidating role caches manually
 * Provides manual cache control for component-level cache management
 */
export function useRoleCacheControl() {
  const queryClient = useQueryClient()

  const invalidateAll = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: QUERY_KEYS.ROLES })
  }, [queryClient])

  const invalidateList = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: QUERY_KEYS.ROLE_LIST() })
  }, [queryClient])

  const invalidateRole = useCallback((id: number) => {
    queryClient.invalidateQueries({ queryKey: QUERY_KEYS.ROLE_DETAIL(id) })
  }, [queryClient])

  const clearCache = useCallback(() => {
    queryClient.removeQueries({ queryKey: QUERY_KEYS.ROLES })
  }, [queryClient])

  const prefetchRole = useCallback(async (id: number) => {
    await queryClient.prefetchQuery({
      queryKey: QUERY_KEYS.ROLE_DETAIL(id),
      queryFn: () => createRoleFetcher(ROLE_ENDPOINTS.ROLE_BY_ID(id))(),
      staleTime: CACHE_CONFIG.STALE_TIME,
    })
  }, [queryClient])

  return {
    invalidateAll,
    invalidateList,
    invalidateRole,
    clearCache,
    prefetchRole,
  }
}

// =============================================================================
// SWR-BASED HOOKS FOR SPECIFIC USE CASES
// =============================================================================

/**
 * SWR-based hook for real-time role status monitoring
 * Provides stale-while-revalidate caching for frequently updated data
 */
export function useRoleStatusSWR(id?: number, options?: { refreshInterval?: number }) {
  const endpoint = id ? ROLE_ENDPOINTS.ROLE_BY_ID(id) : null
  
  const { data, error, isLoading, mutate: revalidate } = useSWR(
    endpoint,
    createRoleFetcher(endpoint!, { fields: 'id,name,isActive,lastModifiedDate' }),
    {
      refreshInterval: options?.refreshInterval || 10000, // 10 seconds
      revalidateOnFocus: true,
      revalidateOnReconnect: true,
      dedupingInterval: 2000, // 2 seconds
      errorRetryCount: CACHE_CONFIG.RETRY_ATTEMPTS,
      errorRetryInterval: CACHE_CONFIG.RETRY_DELAY,
    }
  )

  return {
    role: data as RoleType | undefined,
    isLoading,
    isError: !!error,
    error,
    revalidate,
  }
}

/**
 * SWR-based hook for role search with debouncing
 * Optimized for search and filter operations with minimal API calls
 */
export function useRoleSearchSWR(searchTerm?: string, options?: { debounceMs?: number }) {
  const endpoint = searchTerm 
    ? `${ROLE_ENDPOINTS.ROLES}?search=${encodeURIComponent(searchTerm)}&limit=10`
    : null

  const { data, error, isLoading } = useSWR(
    endpoint,
    createRoleFetcher(endpoint!),
    {
      dedupingInterval: options?.debounceMs || 500,
      revalidateOnFocus: false,
      errorRetryCount: 1,
    }
  )

  return {
    results: (data as RoleListResponse<RoleType>)?.resource || [],
    isLoading,
    isError: !!error,
    error,
  }
}

// =============================================================================
// COMPOSITE HOOKS FOR COMMON WORKFLOWS
// =============================================================================

/**
 * Composite hook for complete role management workflow
 * Combines list, detail, and mutation hooks for full functionality
 */
export function useRoleManagement(options?: RoleHookOptions) {
  const roleList = useRoleList(undefined, options)
  const createRole = useCreateRole(options)
  const updateRole = useUpdateRole(options)
  const deleteRole = useDeleteRole(options)
  const bulkOperations = useBulkRoleOperations(options)
  const cacheControl = useRoleCacheControl()

  return {
    // List operations
    ...roleList,
    
    // CRUD operations
    createRole: createRole.createRole,
    updateRole: updateRole.updateRole,
    deleteRole: deleteRole.deleteRole,
    
    // Bulk operations
    bulkOperations: bulkOperations.mutateAsync,
    
    // Cache control
    ...cacheControl,
    
    // Loading states
    isCreating: createRole.isLoading,
    isUpdating: updateRole.isLoading,
    isDeleting: deleteRole.isLoading,
    isBulkOperating: bulkOperations.isLoading,
    
    // Error states
    createError: createRole.error,
    updateError: updateRole.error,
    deleteError: deleteRole.error,
    bulkError: bulkOperations.error,
  }
}

/**
 * Hook specifically for role detail pages with comprehensive data fetching
 * Implements related data fetching per existing resolver functionality
 */
export function useRoleDetailPage(id?: number, options?: RoleHookOptions) {
  const roleDetail = useRoleDetail(id, {
    includeAccess: true,
    includeLookup: true,
    includePermissions: true,
    ...options,
  })
  
  const updateRole = useUpdateRole(options)
  const deleteRole = useDeleteRole(options)

  // Additional queries for related data
  const { data: serviceAccess } = useQuery({
    queryKey: QUERY_KEYS.ROLE_ACCESS(id!),
    queryFn: () => createRoleFetcher(ROLE_ENDPOINTS.ROLE_ACCESS(id!))(),
    enabled: !!id,
    staleTime: CACHE_CONFIG.STALE_TIME,
  })

  const { data: lookupKeys } = useQuery({
    queryKey: QUERY_KEYS.ROLE_LOOKUP(id!),
    queryFn: () => createRoleFetcher(ROLE_ENDPOINTS.LOOKUP_KEYS(id!))(),
    enabled: !!id,
    staleTime: CACHE_CONFIG.STALE_TIME,
  })

  return {
    ...roleDetail,
    
    // Extended data
    serviceAccess: serviceAccess || roleDetail.serviceAccess,
    lookupKeys: lookupKeys || roleDetail.lookupKeys,
    
    // Mutations
    updateRole: updateRole.updateRole,
    deleteRole: deleteRole.deleteRole,
    
    // Loading states
    isUpdating: updateRole.isLoading,
    isDeleting: deleteRole.isLoading,
    
    // Error states
    updateError: updateRole.error,
    deleteError: deleteRole.error,
  }
}

// =============================================================================
// EXPORTS
// =============================================================================

export {
  // Main hooks
  useRoleList,
  useRoleDetail,
  useCreateRole,
  useUpdateRole,
  useDeleteRole,
  useBulkRoleOperations,
  useRoleCacheControl,
  
  // SWR hooks
  useRoleStatusSWR,
  useRoleSearchSWR,
  
  // Composite hooks
  useRoleManagement,
  useRoleDetailPage,
  
  // Utilities
  transformRoleForDisplay,
  createAccessControl,
  QUERY_KEYS,
  ROLE_ENDPOINTS,
  CACHE_CONFIG,
}