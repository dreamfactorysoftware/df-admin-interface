/**
 * Roles Management Hook for React/Next.js Migration
 * 
 * Comprehensive hook for role management operations including CRUD operations,
 * role listing, filtering, and caching using React Query. Replaces Angular
 * ROLE_SERVICE_TOKEN with modern React data fetching patterns.
 * 
 * @author DreamFactory Admin Interface Team
 * @version React 19/Next.js 15.1 Migration
 */

'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useCallback } from 'react'
import {
  RoleType,
  RoleRow,
  RoleCreatePayload,
  RoleUpdatePayload,
  RoleListParams,
  RoleListResponse,
  RoleOperationResult,
  RoleBulkOperation,
  RoleHookOptions,
  RoleQueryState,
  RoleMutationState,
} from '@/types/role'
import { apiClient } from '@/lib/api-client'
import { useNotifications } from '@/hooks/use-notifications'
import { useErrorHandler } from '@/hooks/use-error-handler'

// =============================================================================
// CONSTANTS AND CONFIGURATION
// =============================================================================

/**
 * Query keys for role-related React Query operations
 */
export const ROLE_QUERY_KEYS = {
  all: ['roles'] as const,
  lists: () => [...ROLE_QUERY_KEYS.all, 'list'] as const,
  list: (params?: RoleListParams) => [...ROLE_QUERY_KEYS.lists(), params] as const,
  details: () => [...ROLE_QUERY_KEYS.all, 'detail'] as const,
  detail: (id: number) => [...ROLE_QUERY_KEYS.details(), id] as const,
  count: () => [...ROLE_QUERY_KEYS.all, 'count'] as const,
}

/**
 * Default configuration for role operations
 */
const DEFAULT_CONFIG: RoleHookOptions = {
  staleTime: 5 * 60 * 1000, // 5 minutes
  cacheTime: 10 * 60 * 1000, // 10 minutes
  refetchOnMount: true,
  refetchOnWindowFocus: false,
  refetchOnReconnect: true,
  refetchInterval: false,
  retry: 3,
  retryDelay: 1000,
  enableOptimisticUpdates: true,
}

/**
 * Default list parameters
 */
const DEFAULT_LIST_PARAMS: RoleListParams = {
  limit: 25,
  offset: 0,
  order: 'asc',
  sort: 'name',
  includeInactive: true,
}

// =============================================================================
// API FUNCTIONS
// =============================================================================

/**
 * Fetch paginated list of roles
 */
async function fetchRoles(params: RoleListParams = {}): Promise<RoleListResponse<RoleType>> {
  const queryParams = new URLSearchParams()
  
  if (params.limit) queryParams.append('limit', params.limit.toString())
  if (params.offset) queryParams.append('offset', params.offset.toString())
  if (params.sort) queryParams.append('order', params.sort)
  if (params.order) queryParams.append('order_dir', params.order)
  if (params.search) queryParams.append('filter', `name contains "${params.search}"`)
  if (params.filter) queryParams.append('filter', params.filter)
  if (params.fields) {
    const fields = Array.isArray(params.fields) ? params.fields.join(',') : params.fields
    queryParams.append('fields', fields)
  }
  if (params.related) {
    const related = Array.isArray(params.related) ? params.related.join(',') : params.related
    queryParams.append('related', related)
  }

  const url = `/system/role${queryParams.toString() ? `?${queryParams.toString()}` : ''}`
  return apiClient.get(url)
}

/**
 * Fetch single role by ID
 */
async function fetchRole(id: number, fields?: string[]): Promise<RoleType> {
  const queryParams = new URLSearchParams()
  if (fields) {
    queryParams.append('fields', fields.join(','))
  }
  
  const url = `/system/role/${id}${queryParams.toString() ? `?${queryParams.toString()}` : ''}`
  return apiClient.get(url)
}

/**
 * Create new role
 */
async function createRole(roleData: RoleCreatePayload): Promise<RoleType> {
  return apiClient.post('/system/role', roleData)
}

/**
 * Update existing role
 */
async function updateRole(roleData: RoleUpdatePayload): Promise<RoleType> {
  const { id, ...updateData } = roleData
  return apiClient.put(`/system/role/${id}`, updateData)
}

/**
 * Delete role by ID
 */
async function deleteRole(id: number): Promise<void> {
  return apiClient.delete(`/system/role/${id}`)
}

/**
 * Perform bulk operations on multiple roles
 */
async function bulkRoleOperation(operation: RoleBulkOperation): Promise<RoleOperationResult[]> {
  switch (operation.operation) {
    case 'delete':
      return Promise.all(
        operation.roleIds.map(async (id) => {
          try {
            await deleteRole(id)
            return { success: true, metadata: { operation: 'delete', affectedRows: 1, timestamp: new Date().toISOString() } }
          } catch (error) {
            return {
              success: false,
              error: {
                code: 'DELETE_FAILED',
                message: error instanceof Error ? error.message : 'Delete operation failed',
              },
              metadata: { operation: 'delete', affectedRows: 0, timestamp: new Date().toISOString() }
            }
          }
        })
      )
    
    case 'activate':
    case 'deactivate':
      const isActive = operation.operation === 'activate'
      return Promise.all(
        operation.roleIds.map(async (id) => {
          try {
            const role = await updateRole({ id, isActive })
            return {
              success: true,
              data: role,
              metadata: { operation: 'update', affectedRows: 1, timestamp: new Date().toISOString() }
            }
          } catch (error) {
            return {
              success: false,
              error: {
                code: 'UPDATE_FAILED',
                message: error instanceof Error ? error.message : 'Update operation failed',
              },
              metadata: { operation: 'update', affectedRows: 0, timestamp: new Date().toISOString() }
            }
          }
        })
      )
    
    case 'update':
      if (!operation.data) {
        throw new Error('Update data is required for bulk update operation')
      }
      return Promise.all(
        operation.roleIds.map(async (id) => {
          try {
            const role = await updateRole({ id, ...operation.data })
            return {
              success: true,
              data: role,
              metadata: { operation: 'update', affectedRows: 1, timestamp: new Date().toISOString() }
            }
          } catch (error) {
            return {
              success: false,
              error: {
                code: 'UPDATE_FAILED',
                message: error instanceof Error ? error.message : 'Update operation failed',
              },
              metadata: { operation: 'update', affectedRows: 0, timestamp: new Date().toISOString() }
            }
          }
        })
      )
    
    default:
      throw new Error(`Unsupported bulk operation: ${operation.operation}`)
  }
}

/**
 * Get role count with optional filters
 */
async function fetchRoleCount(filters?: string): Promise<number> {
  const queryParams = new URLSearchParams()
  queryParams.append('count_only', 'true')
  if (filters) queryParams.append('filter', filters)
  
  const response = await apiClient.get(`/system/role?${queryParams.toString()}`)
  return response.meta?.count || 0
}

// =============================================================================
// HOOK IMPLEMENTATIONS
// =============================================================================

/**
 * Hook for fetching paginated list of roles
 */
export function useRoles(
  params: RoleListParams = {},
  options: Partial<RoleHookOptions> = {}
): RoleQueryState<RoleListResponse<RoleType>> {
  const config = { ...DEFAULT_CONFIG, ...options }
  const mergedParams = { ...DEFAULT_LIST_PARAMS, ...params }
  const { handleError } = useErrorHandler()

  const query = useQuery({
    queryKey: ROLE_QUERY_KEYS.list(mergedParams),
    queryFn: () => fetchRoles(mergedParams),
    staleTime: config.staleTime,
    gcTime: config.cacheTime,
    refetchOnMount: config.refetchOnMount,
    refetchOnWindowFocus: config.refetchOnWindowFocus,
    refetchOnReconnect: config.refetchOnReconnect,
    refetchInterval: config.refetchInterval || false,
    retry: config.retry,
    retryDelay: config.retryDelay,
    onError: (error: Error) => {
      handleError(error, 'Failed to fetch roles')
      config.onError?.(error)
    },
  })

  return {
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
  }
}

/**
 * Hook for fetching a single role by ID
 */
export function useRole(
  id: number,
  fields?: string[],
  options: Partial<RoleHookOptions> = {}
): RoleQueryState<RoleType> {
  const config = { ...DEFAULT_CONFIG, ...options }
  const { handleError } = useErrorHandler()

  const query = useQuery({
    queryKey: ROLE_QUERY_KEYS.detail(id),
    queryFn: () => fetchRole(id, fields),
    enabled: !!id,
    staleTime: config.staleTime,
    gcTime: config.cacheTime,
    refetchOnMount: config.refetchOnMount,
    refetchOnWindowFocus: config.refetchOnWindowFocus,
    refetchOnReconnect: config.refetchOnReconnect,
    retry: config.retry,
    retryDelay: config.retryDelay,
    onError: (error: Error) => {
      handleError(error, `Failed to fetch role ${id}`)
      config.onError?.(error)
    },
  })

  return {
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
  }
}

/**
 * Hook for role count
 */
export function useRoleCount(
  filters?: string,
  options: Partial<RoleHookOptions> = {}
): RoleQueryState<number> {
  const config = { ...DEFAULT_CONFIG, ...options }
  const { handleError } = useErrorHandler()

  const query = useQuery({
    queryKey: ROLE_QUERY_KEYS.count(),
    queryFn: () => fetchRoleCount(filters),
    staleTime: config.staleTime,
    gcTime: config.cacheTime,
    refetchOnMount: config.refetchOnMount,
    refetchOnWindowFocus: config.refetchOnWindowFocus,
    onError: (error: Error) => {
      handleError(error, 'Failed to fetch role count')
      config.onError?.(error)
    },
  })

  return {
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
  }
}

/**
 * Hook for creating new roles
 */
export function useCreateRole(
  options: Partial<RoleHookOptions> = {}
): RoleMutationState<RoleType, RoleCreatePayload> {
  const queryClient = useQueryClient()
  const { addNotification } = useNotifications()
  const { handleError } = useErrorHandler()
  const config = { ...DEFAULT_CONFIG, ...options }

  const mutation = useMutation({
    mutationFn: createRole,
    onMutate: async (newRole) => {
      config.onMutate?.(newRole)
      
      if (config.enableOptimisticUpdates) {
        // Cancel any outgoing refetches
        await queryClient.cancelQueries({ queryKey: ROLE_QUERY_KEYS.lists() })
        
        // Snapshot the previous value
        const previousRoles = queryClient.getQueryData(ROLE_QUERY_KEYS.lists())
        
        // Optimistically update the cache
        queryClient.setQueriesData(
          { queryKey: ROLE_QUERY_KEYS.lists() },
          (old: RoleListResponse<RoleType> | undefined) => {
            if (!old) return old
            
            const optimisticRole: RoleType = {
              id: Date.now(), // Temporary ID
              name: newRole.name,
              description: newRole.description || '',
              isActive: newRole.isActive,
              createdById: 0,
              createdDate: new Date().toISOString(),
              lastModifiedById: 0,
              lastModifiedDate: new Date().toISOString(),
              lookupByRoleId: newRole.lookupByRoleId || [],
              accessibleTabs: newRole.accessibleTabs,
              roleServiceAccessByRoleId: newRole.roleServiceAccessByRoleId,
            }
            
            return {
              ...old,
              resource: [optimisticRole, ...old.resource],
              meta: {
                ...old.meta,
                count: old.meta.count + 1,
              },
            }
          }
        )
        
        return { previousRoles }
      }
    },
    onError: (error, newRole, context) => {
      // Rollback optimistic update
      if (config.enableOptimisticUpdates && context?.previousRoles) {
        queryClient.setQueryData(ROLE_QUERY_KEYS.lists(), context.previousRoles)
      }
      
      const errorMessage = error instanceof Error ? error.message : 'Failed to create role'
      handleError(error, errorMessage)
      addNotification({
        type: 'error',
        title: 'Creation Failed',
        message: errorMessage,
      })
    },
    onSuccess: (data, variables) => {
      // Invalidate and refetch role queries
      queryClient.invalidateQueries({ queryKey: ROLE_QUERY_KEYS.all })
      
      addNotification({
        type: 'success',
        title: 'Role Created',
        message: `Role "${data.name}" has been created successfully.`,
      })
      
      config.onSuccess?.(data, variables)
    },
    onSettled: (data, error, variables) => {
      config.onSettled?.(data, error, variables)
    },
  })

  return {
    mutate: mutation.mutate,
    mutateAsync: mutation.mutateAsync,
    isLoading: mutation.isPending,
    isError: mutation.isError,
    isSuccess: mutation.isSuccess,
    error: mutation.error,
    data: mutation.data,
    reset: mutation.reset,
    status: mutation.status,
    submittedAt: mutation.submittedAt,
    variables: mutation.variables,
  }
}

/**
 * Hook for updating existing roles
 */
export function useUpdateRole(
  options: Partial<RoleHookOptions> = {}
): RoleMutationState<RoleType, RoleUpdatePayload> {
  const queryClient = useQueryClient()
  const { addNotification } = useNotifications()
  const { handleError } = useErrorHandler()
  const config = { ...DEFAULT_CONFIG, ...options }

  const mutation = useMutation({
    mutationFn: updateRole,
    onMutate: async (updatedRole) => {
      config.onMutate?.(updatedRole)
      
      if (config.enableOptimisticUpdates) {
        // Cancel any outgoing refetches
        await queryClient.cancelQueries({ queryKey: ROLE_QUERY_KEYS.detail(updatedRole.id) })
        await queryClient.cancelQueries({ queryKey: ROLE_QUERY_KEYS.lists() })
        
        // Snapshot the previous values
        const previousRole = queryClient.getQueryData(ROLE_QUERY_KEYS.detail(updatedRole.id))
        const previousRoles = queryClient.getQueryData(ROLE_QUERY_KEYS.lists())
        
        // Optimistically update the role detail
        queryClient.setQueryData(
          ROLE_QUERY_KEYS.detail(updatedRole.id),
          (old: RoleType | undefined) => {
            if (!old) return old
            return { ...old, ...updatedRole, lastModifiedDate: new Date().toISOString() }
          }
        )
        
        // Optimistically update the role in lists
        queryClient.setQueriesData(
          { queryKey: ROLE_QUERY_KEYS.lists() },
          (old: RoleListResponse<RoleType> | undefined) => {
            if (!old) return old
            
            return {
              ...old,
              resource: old.resource.map(role =>
                role.id === updatedRole.id
                  ? { ...role, ...updatedRole, lastModifiedDate: new Date().toISOString() }
                  : role
              ),
            }
          }
        )
        
        return { previousRole, previousRoles }
      }
    },
    onError: (error, updatedRole, context) => {
      // Rollback optimistic updates
      if (config.enableOptimisticUpdates && context) {
        if (context.previousRole) {
          queryClient.setQueryData(ROLE_QUERY_KEYS.detail(updatedRole.id), context.previousRole)
        }
        if (context.previousRoles) {
          queryClient.setQueryData(ROLE_QUERY_KEYS.lists(), context.previousRoles)
        }
      }
      
      const errorMessage = error instanceof Error ? error.message : 'Failed to update role'
      handleError(error, errorMessage)
      addNotification({
        type: 'error',
        title: 'Update Failed',
        message: errorMessage,
      })
    },
    onSuccess: (data, variables) => {
      // Invalidate related queries
      queryClient.invalidateQueries({ queryKey: ROLE_QUERY_KEYS.detail(variables.id) })
      queryClient.invalidateQueries({ queryKey: ROLE_QUERY_KEYS.lists() })
      
      addNotification({
        type: 'success',
        title: 'Role Updated',
        message: `Role "${data.name}" has been updated successfully.`,
      })
      
      config.onSuccess?.(data, variables)
    },
    onSettled: (data, error, variables) => {
      config.onSettled?.(data, error, variables)
    },
  })

  return {
    mutate: mutation.mutate,
    mutateAsync: mutation.mutateAsync,
    isLoading: mutation.isPending,
    isError: mutation.isError,
    isSuccess: mutation.isSuccess,
    error: mutation.error,
    data: mutation.data,
    reset: mutation.reset,
    status: mutation.status,
    submittedAt: mutation.submittedAt,
    variables: mutation.variables,
  }
}

/**
 * Hook for deleting roles
 */
export function useDeleteRole(
  options: Partial<RoleHookOptions> = {}
): RoleMutationState<void, number> {
  const queryClient = useQueryClient()
  const { addNotification } = useNotifications()
  const { handleError } = useErrorHandler()
  const config = { ...DEFAULT_CONFIG, ...options }

  const mutation = useMutation({
    mutationFn: deleteRole,
    onMutate: async (roleId) => {
      config.onMutate?.(roleId)
      
      if (config.enableOptimisticUpdates) {
        // Cancel any outgoing refetches
        await queryClient.cancelQueries({ queryKey: ROLE_QUERY_KEYS.lists() })
        
        // Snapshot the previous value
        const previousRoles = queryClient.getQueryData(ROLE_QUERY_KEYS.lists())
        
        // Get role name for notification
        const roleToDelete = queryClient.getQueryData<RoleType>(ROLE_QUERY_KEYS.detail(roleId))
        
        // Optimistically remove the role from lists
        queryClient.setQueriesData(
          { queryKey: ROLE_QUERY_KEYS.lists() },
          (old: RoleListResponse<RoleType> | undefined) => {
            if (!old) return old
            
            return {
              ...old,
              resource: old.resource.filter(role => role.id !== roleId),
              meta: {
                ...old.meta,
                count: Math.max(0, old.meta.count - 1),
              },
            }
          }
        )
        
        return { previousRoles, roleName: roleToDelete?.name }
      }
    },
    onError: (error, roleId, context) => {
      // Rollback optimistic update
      if (config.enableOptimisticUpdates && context?.previousRoles) {
        queryClient.setQueryData(ROLE_QUERY_KEYS.lists(), context.previousRoles)
      }
      
      const errorMessage = error instanceof Error ? error.message : 'Failed to delete role'
      handleError(error, errorMessage)
      addNotification({
        type: 'error',
        title: 'Deletion Failed',
        message: errorMessage,
      })
    },
    onSuccess: (data, roleId, context) => {
      // Remove the specific role from cache and invalidate lists
      queryClient.removeQueries({ queryKey: ROLE_QUERY_KEYS.detail(roleId) })
      queryClient.invalidateQueries({ queryKey: ROLE_QUERY_KEYS.lists() })
      
      addNotification({
        type: 'success',
        title: 'Role Deleted',
        message: `Role ${context?.roleName ? `"${context.roleName}"` : ''} has been deleted successfully.`,
      })
      
      config.onSuccess?.(data, roleId)
    },
    onSettled: (data, error, variables) => {
      config.onSettled?.(data, error, variables)
    },
  })

  return {
    mutate: mutation.mutate,
    mutateAsync: mutation.mutateAsync,
    isLoading: mutation.isPending,
    isError: mutation.isError,
    isSuccess: mutation.isSuccess,
    error: mutation.error,
    data: mutation.data,
    reset: mutation.reset,
    status: mutation.status,
    submittedAt: mutation.submittedAt,
    variables: mutation.variables,
  }
}

/**
 * Hook for bulk role operations
 */
export function useBulkRoleOperation(
  options: Partial<RoleHookOptions> = {}
): RoleMutationState<RoleOperationResult[], RoleBulkOperation> {
  const queryClient = useQueryClient()
  const { addNotification } = useNotifications()
  const { handleError } = useErrorHandler()
  const config = { ...DEFAULT_CONFIG, ...options }

  const mutation = useMutation({
    mutationFn: bulkRoleOperation,
    onMutate: async (operation) => {
      config.onMutate?.(operation)
    },
    onError: (error, operation) => {
      const errorMessage = error instanceof Error ? error.message : 'Bulk operation failed'
      handleError(error, errorMessage)
      addNotification({
        type: 'error',
        title: 'Bulk Operation Failed',
        message: errorMessage,
      })
    },
    onSuccess: (results, operation) => {
      // Invalidate all role queries
      queryClient.invalidateQueries({ queryKey: ROLE_QUERY_KEYS.all })
      
      const successCount = results.filter(r => r.success).length
      const failureCount = results.filter(r => !r.success).length
      
      if (successCount > 0) {
        addNotification({
          type: 'success',
          title: 'Bulk Operation Completed',
          message: `${successCount} role(s) ${operation.operation}${operation.operation.endsWith('e') ? 'd' : 'ed'} successfully.`,
        })
      }
      
      if (failureCount > 0) {
        addNotification({
          type: 'warning',
          title: 'Partial Success',
          message: `${failureCount} role(s) failed to ${operation.operation}. Please check individual results.`,
        })
      }
      
      config.onSuccess?.(results, operation)
    },
    onSettled: (data, error, variables) => {
      config.onSettled?.(data, error, variables)
    },
  })

  return {
    mutate: mutation.mutate,
    mutateAsync: mutation.mutateAsync,
    isLoading: mutation.isPending,
    isError: mutation.isError,
    isSuccess: mutation.isSuccess,
    error: mutation.error,
    data: mutation.data,
    reset: mutation.reset,
    status: mutation.status,
    submittedAt: mutation.submittedAt,
    variables: mutation.variables,
  }
}

// =============================================================================
// UTILITY FUNCTIONS
// =============================================================================

/**
 * Transform RoleType[] to RoleRow[] for table display
 */
export function mapRolesToTableRows(roles: RoleType[]): RoleRow[] {
  return roles.map((role: RoleType) => ({
    id: role.id,
    name: role.name,
    description: role.description || '',
    active: role.isActive,
  }))
}

/**
 * Prefetch role data for better performance
 */
export function usePrefetchRole() {
  const queryClient = useQueryClient()

  const prefetchRole = useCallback(
    (id: number) => {
      queryClient.prefetchQuery({
        queryKey: ROLE_QUERY_KEYS.detail(id),
        queryFn: () => fetchRole(id),
        staleTime: DEFAULT_CONFIG.staleTime,
      })
    },
    [queryClient]
  )

  const prefetchRoles = useCallback(
    (params: RoleListParams = {}) => {
      queryClient.prefetchQuery({
        queryKey: ROLE_QUERY_KEYS.list(params),
        queryFn: () => fetchRoles(params),
        staleTime: DEFAULT_CONFIG.staleTime,
      })
    },
    [queryClient]
  )

  return { prefetchRole, prefetchRoles }
}

// =============================================================================
// EXPORTS
// =============================================================================

export type {
  RoleType,
  RoleRow,
  RoleCreatePayload,
  RoleUpdatePayload,
  RoleListParams,
  RoleListResponse,
  RoleOperationResult,
  RoleBulkOperation,
  RoleHookOptions,
  RoleQueryState,
  RoleMutationState,
}