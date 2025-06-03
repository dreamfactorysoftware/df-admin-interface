/**
 * React Query Mutations Hook for Rate Limit CRUD Operations
 * 
 * Custom React hook implementing React Query mutations for limit CRUD operations with optimistic updates
 * and intelligent cache invalidation. Provides create, update, and delete functionality for database limits
 * with comprehensive error handling and automatic cache synchronization following DreamFactory API patterns
 * and performance requirements.
 * 
 * Features:
 * - Type-safe mutation operations with payload assembly logic per React/Next.js Integration Requirements
 * - Optimistic updates for immediate UI feedback with automatic rollback on failure
 * - Comprehensive cache invalidation and synchronization per Section 4.3.2 mutation workflows
 * - API responses under 2 seconds per React/Next.js Integration Requirements
 * - Error handling with automatic rollback per Section 4.3.2 error handling patterns
 * - Success/error notifications integration for user feedback per existing Angular snackbar patterns
 * - Intelligent cache management for related queries (limit lists, limit cache)
 * 
 * Replaces Angular DfBaseCrudService create/update methods with React Query mutations per Section 3.2.2
 * state management while maintaining complete functionality and improving performance characteristics.
 * 
 * @author DreamFactory Admin Interface Team
 * @version React 19/Next.js 15.1 Migration
 * @since 2024-12-19
 * 
 * @example
 * ```tsx
 * const {
 *   createLimit,
 *   updateLimit,
 *   deleteLimit,
 *   toggleLimitStatus,
 *   isLoading,
 *   error
 * } = useLimitMutations();
 * 
 * // Create new limit with optimistic update
 * await createLimit.mutateAsync({
 *   name: 'API Rate Limit',
 *   limitType: LimitType.SERVICE,
 *   limitRate: '100/minute',
 *   limitCounter: LimitCounter.REQUEST,
 *   service: 1,
 *   active: true
 * });
 * 
 * // Update existing limit
 * await updateLimit.mutateAsync({
 *   id: 1,
 *   name: 'Updated API Rate Limit',
 *   limitRate: '200/minute'
 * });
 * 
 * // Delete limit with confirmation
 * await deleteLimit.mutateAsync(1);
 * 
 * // Toggle limit status
 * await toggleLimitStatus.mutateAsync({
 *   id: 1,
 *   active: false
 * });
 * ```
 */

import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useCallback, useMemo } from 'react'
import {
  CreateLimitFormData,
  EditLimitFormData,
  LimitTableRowData,
  LIMITS_QUERY_KEYS,
  CreateLimitMutationResult,
  UpdateLimitMutationResult,
  DeleteLimitMutationResult,
  ToggleLimitMutationResult,
  type LimitsCacheInvalidationFilters
} from '@/app/adf-limits/types'
import {
  ApiCreateResponse,
  ApiUpdateResponse,
  ApiDeleteResponse,
  ApiErrorResponse,
  ApiListResponse,
  ApiRequestOptions,
  type PaginationMeta
} from '@/types/api'
import { useNotifications } from '@/hooks/use-notifications'
import { apiClient } from '@/lib/api-client'

// =============================================================================
// TYPES AND INTERFACES
// =============================================================================

/**
 * Context data for optimistic updates and rollback operations
 */
interface OptimisticContext {
  previousData?: LimitTableRowData
  previousList?: LimitTableRowData[]
  tempId?: string
  snapshot?: {
    listCache: Record<string, ApiListResponse<LimitTableRowData>>
    detailCache: Record<string, LimitTableRowData>
  }
}

/**
 * Toggle limit status payload
 */
interface ToggleLimitStatusPayload {
  id: number
  active: boolean
}

/**
 * Mutation performance metrics for monitoring
 */
interface MutationMetrics {
  startTime: number
  endTime?: number
  duration?: number
  operation: 'create' | 'update' | 'delete' | 'toggle'
  success: boolean
  errorCode?: string
}

/**
 * Hook return interface with comprehensive mutation operations
 */
interface UseLimitMutationsReturn {
  // Mutation results with React Query integration
  createLimit: CreateLimitMutationResult
  updateLimit: UpdateLimitMutationResult
  deleteLimit: DeleteLimitMutationResult
  toggleLimitStatus: ToggleLimitMutationResult
  
  // Aggregate loading and error states
  isLoading: boolean
  error: ApiErrorResponse | null
  
  // Performance and debugging information
  lastMutation: MutationMetrics | null
  mutationCount: number
  
  // Utility methods for advanced scenarios
  invalidateQueries: () => Promise<void>
  resetMutationState: () => void
}

// =============================================================================
// API FUNCTIONS
// =============================================================================

/**
 * Create a new rate limit via DreamFactory API
 * 
 * @param data - Rate limit creation data
 * @returns Promise resolving to creation response
 */
async function createLimitApi(data: CreateLimitFormData): Promise<ApiCreateResponse> {
  const payload = {
    name: data.name,
    limit_type: data.limitType,
    limit_rate: data.limitRate,
    limit_counter: data.limitCounter,
    user_id: data.user || null,
    service_id: data.service || null,
    role_id: data.role || null,
    active: data.active ?? true,
    metadata: data.metadata || null
  }

  const response = await apiClient.post('/limits', payload)
  return response
}

/**
 * Update an existing rate limit via DreamFactory API
 * 
 * @param data - Rate limit update data
 * @returns Promise resolving to update response
 */
async function updateLimitApi(data: EditLimitFormData): Promise<ApiUpdateResponse> {
  const { id, ...updateData } = data
  
  const payload = {
    name: updateData.name,
    limit_type: updateData.limitType,
    limit_rate: updateData.limitRate,
    limit_counter: updateData.limitCounter,
    user_id: updateData.user || null,
    service_id: updateData.service || null,
    role_id: updateData.role || null,
    active: updateData.active ?? true,
    metadata: updateData.metadata || null
  }

  const response = await apiClient.put(`/limits/${id}`, payload)
  return response
}

/**
 * Delete a rate limit via DreamFactory API
 * 
 * @param id - Rate limit ID to delete
 * @returns Promise resolving to deletion response
 */
async function deleteLimitApi(id: number): Promise<ApiDeleteResponse> {
  const response = await apiClient.delete(`/limits/${id}`)
  return response
}

/**
 * Toggle rate limit active status via DreamFactory API
 * 
 * @param payload - Toggle status payload
 * @returns Promise resolving to update response
 */
async function toggleLimitStatusApi(payload: ToggleLimitStatusPayload): Promise<ApiUpdateResponse> {
  const response = await apiClient.patch(`/limits/${payload.id}`, {
    active: payload.active
  })
  return response
}

// =============================================================================
// CACHE MANAGEMENT UTILITIES
// =============================================================================

/**
 * Generate cache invalidation filters for comprehensive cache management
 * 
 * @param queryClient - React Query client instance
 * @returns Cache invalidation filters
 */
function createCacheInvalidationFilters(queryClient: ReturnType<typeof useQueryClient>): LimitsCacheInvalidationFilters {
  return {
    all: {
      queryKey: LIMITS_QUERY_KEYS.all,
      exact: false
    },
    lists: {
      queryKey: LIMITS_QUERY_KEYS.lists(),
      exact: false
    },
    detail: (id: number) => ({
      queryKey: LIMITS_QUERY_KEYS.detail(id),
      exact: true
    }),
    related: (id: number) => ({
      queryKey: LIMITS_QUERY_KEYS.related(id),
      exact: false
    })
  }
}

/**
 * Optimistically update limit list cache with new or updated item
 * 
 * @param queryClient - React Query client instance
 * @param limitData - Limit data to add or update
 * @param operation - Type of operation (create, update, delete)
 */
function updateListCacheOptimistically(
  queryClient: ReturnType<typeof useQueryClient>,
  limitData: Partial<LimitTableRowData>,
  operation: 'create' | 'update' | 'delete'
): void {
  const listQueryKeys = queryClient.getQueryCache().findAll({
    queryKey: LIMITS_QUERY_KEYS.lists(),
    exact: false
  })

  listQueryKeys.forEach((query) => {
    const currentData = query.state.data as ApiListResponse<LimitTableRowData> | undefined
    if (!currentData) return

    let updatedResource: LimitTableRowData[]

    switch (operation) {
      case 'create':
        // Add new item to the beginning of the list
        const newItem: LimitTableRowData = {
          id: Date.now(), // Temporary ID for optimistic update
          name: limitData.name || '',
          limitType: limitData.limitType!,
          limitRate: limitData.limitRate || '',
          limitCounter: limitData.limitCounter!,
          user: limitData.user || null,
          service: limitData.service || null,
          role: limitData.role || null,
          active: limitData.active ?? true,
          createdAt: new Date().toISOString(),
          metadata: limitData.metadata
        }
        updatedResource = [newItem, ...currentData.resource]
        break

      case 'update':
        updatedResource = currentData.resource.map(item =>
          item.id === limitData.id
            ? { ...item, ...limitData, updatedAt: new Date().toISOString() }
            : item
        )
        break

      case 'delete':
        updatedResource = currentData.resource.filter(item => item.id !== limitData.id)
        break

      default:
        return
    }

    // Update pagination metadata
    const updatedMeta: PaginationMeta = {
      ...currentData.meta,
      count: updatedResource.length,
      total: operation === 'create' 
        ? (currentData.meta.total || 0) + 1
        : operation === 'delete'
        ? Math.max((currentData.meta.total || 0) - 1, 0)
        : currentData.meta.total
    }

    queryClient.setQueryData(query.queryKey, {
      resource: updatedResource,
      meta: updatedMeta
    })
  })
}

/**
 * Create snapshot of current cache state for rollback purposes
 * 
 * @param queryClient - React Query client instance
 * @param limitId - Optional limit ID for targeted snapshot
 * @returns Cache snapshot
 */
function createCacheSnapshot(
  queryClient: ReturnType<typeof useQueryClient>,
  limitId?: number
): OptimisticContext['snapshot'] {
  const listQueries = queryClient.getQueryCache().findAll({
    queryKey: LIMITS_QUERY_KEYS.lists(),
    exact: false
  })

  const listCache: Record<string, ApiListResponse<LimitTableRowData>> = {}
  const detailCache: Record<string, LimitTableRowData> = {}

  // Capture list cache
  listQueries.forEach((query) => {
    const data = query.state.data as ApiListResponse<LimitTableRowData> | undefined
    if (data) {
      listCache[JSON.stringify(query.queryKey)] = data
    }
  })

  // Capture detail cache (specific or all)
  if (limitId) {
    const detailQuery = queryClient.getQueryCache().find({
      queryKey: LIMITS_QUERY_KEYS.detail(limitId),
      exact: true
    })
    
    if (detailQuery?.state.data) {
      detailCache[limitId.toString()] = detailQuery.state.data as LimitTableRowData
    }
  } else {
    const detailQueries = queryClient.getQueryCache().findAll({
      queryKey: LIMITS_QUERY_KEYS.details(),
      exact: false
    })

    detailQueries.forEach((query) => {
      const data = query.state.data as LimitTableRowData | undefined
      if (data && data.id) {
        detailCache[data.id.toString()] = data
      }
    })
  }

  return { listCache, detailCache }
}

/**
 * Restore cache state from snapshot for rollback operations
 * 
 * @param queryClient - React Query client instance
 * @param snapshot - Cache snapshot to restore
 */
function restoreCacheFromSnapshot(
  queryClient: ReturnType<typeof useQueryClient>,
  snapshot: OptimisticContext['snapshot']
): void {
  if (!snapshot) return

  // Restore list cache
  Object.entries(snapshot.listCache).forEach(([queryKeyStr, data]) => {
    try {
      const queryKey = JSON.parse(queryKeyStr)
      queryClient.setQueryData(queryKey, data)
    } catch (error) {
      console.warn('Failed to restore list cache entry:', error)
    }
  })

  // Restore detail cache
  Object.entries(snapshot.detailCache).forEach(([limitId, data]) => {
    const id = parseInt(limitId, 10)
    if (!isNaN(id)) {
      queryClient.setQueryData(LIMITS_QUERY_KEYS.detail(id), data)
    }
  })
}

// =============================================================================
// MAIN HOOK IMPLEMENTATION
// =============================================================================

/**
 * Custom hook for rate limit mutations with React Query integration
 * 
 * Provides comprehensive CRUD operations for rate limits with optimistic updates,
 * intelligent cache invalidation, error handling, and user feedback integration.
 * Replaces Angular DfBaseCrudService patterns with modern React Query mutations
 * while maintaining full functionality and improving performance characteristics.
 * 
 * @returns Hook interface with mutation operations and state
 */
export function useLimitMutations(): UseLimitMutationsReturn {
  const queryClient = useQueryClient()
  const { success, error: showError } = useNotifications()
  
  // Performance and debugging state
  const [lastMutation, setLastMutation] = useState<MutationMetrics | null>(null)
  const [mutationCount, setMutationCount] = useState(0)

  // Cache invalidation filters
  const cacheFilters = useMemo(
    () => createCacheInvalidationFilters(queryClient),
    [queryClient]
  )

  // Utility function to track mutation metrics
  const trackMutationMetrics = useCallback((
    operation: MutationMetrics['operation'],
    success: boolean,
    startTime: number,
    errorCode?: string
  ) => {
    const endTime = Date.now()
    const metrics: MutationMetrics = {
      startTime,
      endTime,
      duration: endTime - startTime,
      operation,
      success,
      errorCode
    }
    
    setLastMutation(metrics)
    setMutationCount(prev => prev + 1)
    
    // Log performance metrics for monitoring
    if (metrics.duration && metrics.duration > 2000) {
      console.warn(`Slow ${operation} mutation detected:`, metrics)
    }
  }, [])

  // =============================================================================
  // CREATE LIMIT MUTATION
  // =============================================================================

  const createLimit: CreateLimitMutationResult = useMutation({
    mutationFn: createLimitApi,
    
    onMutate: async (variables: CreateLimitFormData): Promise<OptimisticContext> => {
      const startTime = Date.now()
      
      // Cancel outgoing queries to prevent conflicts
      await queryClient.cancelQueries({
        queryKey: LIMITS_QUERY_KEYS.all
      })

      // Snapshot current cache state
      const snapshot = createCacheSnapshot(queryClient)
      
      // Generate temporary ID for optimistic update
      const tempId = `temp-${Date.now()}`
      
      // Optimistically update the cache
      updateListCacheOptimistically(queryClient, variables, 'create')
      
      return { tempId, snapshot }
    },

    onSuccess: async (
      data: ApiCreateResponse,
      variables: CreateLimitFormData,
      context: OptimisticContext | undefined
    ) => {
      const startTime = context?.snapshot ? Date.now() : Date.now()
      
      try {
        // Show success notification
        success(`Rate limit "${variables.name}" created successfully`)
        
        // Invalidate and refetch related queries
        await queryClient.invalidateQueries(cacheFilters.lists)
        await queryClient.invalidateQueries(cacheFilters.all)
        
        // Update detail cache if the new item is being viewed
        if (data.id) {
          queryClient.setQueryData(
            LIMITS_QUERY_KEYS.detail(Number(data.id)),
            {
              ...variables,
              id: Number(data.id),
              createdAt: new Date().toISOString()
            } as LimitTableRowData
          )
        }
        
        trackMutationMetrics('create', true, startTime)
      } catch (error) {
        console.error('Error in create limit success handler:', error)
        showError('Failed to update cache after creating limit')
      }
    },

    onError: (
      error: ApiErrorResponse,
      variables: CreateLimitFormData,
      context: OptimisticContext | undefined
    ) => {
      const startTime = context?.snapshot ? Date.now() : Date.now()
      
      // Rollback optimistic updates
      if (context?.snapshot) {
        restoreCacheFromSnapshot(queryClient, context.snapshot)
      }
      
      // Show error notification
      showError(
        error.error?.message || 'Failed to create rate limit',
        'Creation Error'
      )
      
      trackMutationMetrics('create', false, startTime, error.error?.code)
    },

    onSettled: () => {
      // Ensure cache consistency regardless of outcome
      queryClient.refetchQueries({
        queryKey: LIMITS_QUERY_KEYS.lists(),
        exact: false
      })
    },

    retry: 1,
    useErrorBoundary: false
  })

  // =============================================================================
  // UPDATE LIMIT MUTATION
  // =============================================================================

  const updateLimit: UpdateLimitMutationResult = useMutation({
    mutationFn: updateLimitApi,
    
    onMutate: async (variables: EditLimitFormData): Promise<OptimisticContext> => {
      const startTime = Date.now()
      
      // Cancel outgoing queries
      await queryClient.cancelQueries({
        queryKey: LIMITS_QUERY_KEYS.detail(variables.id)
      })
      await queryClient.cancelQueries({
        queryKey: LIMITS_QUERY_KEYS.lists()
      })

      // Snapshot current state
      const previousData = queryClient.getQueryData(
        LIMITS_QUERY_KEYS.detail(variables.id)
      ) as LimitTableRowData | undefined
      
      const snapshot = createCacheSnapshot(queryClient, variables.id)
      
      // Optimistically update detail cache
      if (previousData) {
        const optimisticData: LimitTableRowData = {
          ...previousData,
          ...variables,
          updatedAt: new Date().toISOString()
        }
        
        queryClient.setQueryData(
          LIMITS_QUERY_KEYS.detail(variables.id),
          optimisticData
        )
      }
      
      // Optimistically update list cache
      updateListCacheOptimistically(queryClient, variables, 'update')
      
      return { previousData, snapshot }
    },

    onSuccess: async (
      data: ApiUpdateResponse,
      variables: EditLimitFormData,
      context: OptimisticContext | undefined
    ) => {
      const startTime = Date.now()
      
      try {
        // Show success notification
        success(`Rate limit "${variables.name}" updated successfully`)
        
        // Invalidate related queries for fresh data
        await queryClient.invalidateQueries(cacheFilters.detail(variables.id))
        await queryClient.invalidateQueries(cacheFilters.lists)
        await queryClient.invalidateQueries(cacheFilters.related(variables.id))
        
        trackMutationMetrics('update', true, startTime)
      } catch (error) {
        console.error('Error in update limit success handler:', error)
        showError('Failed to update cache after modifying limit')
      }
    },

    onError: (
      error: ApiErrorResponse,
      variables: EditLimitFormData,
      context: OptimisticContext | undefined
    ) => {
      const startTime = Date.now()
      
      // Rollback optimistic updates
      if (context?.snapshot) {
        restoreCacheFromSnapshot(queryClient, context.snapshot)
      } else if (context?.previousData) {
        // Fallback to individual restoration
        queryClient.setQueryData(
          LIMITS_QUERY_KEYS.detail(variables.id),
          context.previousData
        )
      }
      
      // Show error notification
      showError(
        error.error?.message || 'Failed to update rate limit',
        'Update Error'
      )
      
      trackMutationMetrics('update', false, startTime, error.error?.code)
    },

    onSettled: (data, error, variables) => {
      // Ensure data consistency
      queryClient.refetchQueries({
        queryKey: LIMITS_QUERY_KEYS.detail(variables.id),
        exact: true
      })
    },

    retry: 1,
    useErrorBoundary: false
  })

  // =============================================================================
  // DELETE LIMIT MUTATION
  // =============================================================================

  const deleteLimit: DeleteLimitMutationResult = useMutation({
    mutationFn: deleteLimitApi,
    
    onMutate: async (limitId: number): Promise<OptimisticContext> => {
      const startTime = Date.now()
      
      // Cancel outgoing queries
      await queryClient.cancelQueries({
        queryKey: LIMITS_QUERY_KEYS.detail(limitId)
      })
      await queryClient.cancelQueries({
        queryKey: LIMITS_QUERY_KEYS.lists()
      })

      // Capture current state
      const previousData = queryClient.getQueryData(
        LIMITS_QUERY_KEYS.detail(limitId)
      ) as LimitTableRowData | undefined
      
      const snapshot = createCacheSnapshot(queryClient, limitId)
      
      // Optimistically remove from caches
      queryClient.removeQueries({
        queryKey: LIMITS_QUERY_KEYS.detail(limitId),
        exact: true
      })
      
      updateListCacheOptimistically(queryClient, { id: limitId }, 'delete')
      
      return { previousData, snapshot }
    },

    onSuccess: async (
      data: ApiDeleteResponse,
      limitId: number,
      context: OptimisticContext | undefined
    ) => {
      const startTime = Date.now()
      
      try {
        const limitName = context?.previousData?.name || 'Rate limit'
        
        // Show success notification
        success(`${limitName} deleted successfully`)
        
        // Clean up all related queries
        await queryClient.invalidateQueries(cacheFilters.lists)
        await queryClient.invalidateQueries(cacheFilters.related(limitId))
        
        // Remove from query cache permanently
        queryClient.removeQueries({
          queryKey: LIMITS_QUERY_KEYS.detail(limitId),
          exact: true
        })
        
        trackMutationMetrics('delete', true, startTime)
      } catch (error) {
        console.error('Error in delete limit success handler:', error)
        showError('Failed to update cache after deleting limit')
      }
    },

    onError: (
      error: ApiErrorResponse,
      limitId: number,
      context: OptimisticContext | undefined
    ) => {
      const startTime = Date.now()
      
      // Rollback deletion
      if (context?.snapshot) {
        restoreCacheFromSnapshot(queryClient, context.snapshot)
      } else if (context?.previousData) {
        // Restore individual item
        queryClient.setQueryData(
          LIMITS_QUERY_KEYS.detail(limitId),
          context.previousData
        )
      }
      
      // Show error notification
      const limitName = context?.previousData?.name || 'rate limit'
      showError(
        error.error?.message || `Failed to delete ${limitName}`,
        'Deletion Error'
      )
      
      trackMutationMetrics('delete', false, startTime, error.error?.code)
    },

    onSettled: (data, error, limitId) => {
      // Refresh list queries to ensure consistency
      queryClient.refetchQueries({
        queryKey: LIMITS_QUERY_KEYS.lists(),
        exact: false
      })
    },

    retry: 1,
    useErrorBoundary: false
  })

  // =============================================================================
  // TOGGLE LIMIT STATUS MUTATION
  // =============================================================================

  const toggleLimitStatus: ToggleLimitMutationResult = useMutation({
    mutationFn: toggleLimitStatusApi,
    
    onMutate: async (variables: ToggleLimitStatusPayload): Promise<OptimisticContext> => {
      const startTime = Date.now()
      
      // Cancel related queries
      await queryClient.cancelQueries({
        queryKey: LIMITS_QUERY_KEYS.detail(variables.id)
      })

      // Capture current state
      const previousData = queryClient.getQueryData(
        LIMITS_QUERY_KEYS.detail(variables.id)
      ) as LimitTableRowData | undefined
      
      const snapshot = createCacheSnapshot(queryClient, variables.id)
      
      // Optimistically update status
      if (previousData) {
        const optimisticData: LimitTableRowData = {
          ...previousData,
          active: variables.active,
          updatedAt: new Date().toISOString()
        }
        
        queryClient.setQueryData(
          LIMITS_QUERY_KEYS.detail(variables.id),
          optimisticData
        )
        
        // Update in list cache as well
        updateListCacheOptimistically(queryClient, optimisticData, 'update')
      }
      
      return { previousData, snapshot }
    },

    onSuccess: async (
      data: ApiUpdateResponse,
      variables: ToggleLimitStatusPayload,
      context: OptimisticContext | undefined
    ) => {
      const startTime = Date.now()
      
      try {
        const limitName = context?.previousData?.name || 'Rate limit'
        const status = variables.active ? 'enabled' : 'disabled'
        
        // Show success notification
        success(`${limitName} ${status} successfully`)
        
        // Invalidate caches for fresh data
        await queryClient.invalidateQueries(cacheFilters.detail(variables.id))
        await queryClient.invalidateQueries(cacheFilters.lists)
        
        trackMutationMetrics('toggle', true, startTime)
      } catch (error) {
        console.error('Error in toggle limit status success handler:', error)
        showError('Failed to update cache after toggling limit status')
      }
    },

    onError: (
      error: ApiErrorResponse,
      variables: ToggleLimitStatusPayload,
      context: OptimisticContext | undefined
    ) => {
      const startTime = Date.now()
      
      // Rollback status change
      if (context?.snapshot) {
        restoreCacheFromSnapshot(queryClient, context.snapshot)
      } else if (context?.previousData) {
        queryClient.setQueryData(
          LIMITS_QUERY_KEYS.detail(variables.id),
          context.previousData
        )
      }
      
      // Show error notification
      const limitName = context?.previousData?.name || 'rate limit'
      const action = variables.active ? 'enable' : 'disable'
      showError(
        error.error?.message || `Failed to ${action} ${limitName}`,
        'Status Change Error'
      )
      
      trackMutationMetrics('toggle', false, startTime, error.error?.code)
    },

    onSettled: (data, error, variables) => {
      // Ensure consistency
      queryClient.refetchQueries({
        queryKey: LIMITS_QUERY_KEYS.detail(variables.id),
        exact: true
      })
    },

    retry: 1,
    useErrorBoundary: false
  })

  // =============================================================================
  // UTILITY METHODS
  // =============================================================================

  /**
   * Manually invalidate all limit-related queries
   */
  const invalidateQueries = useCallback(async (): Promise<void> => {
    await queryClient.invalidateQueries(cacheFilters.all)
  }, [queryClient, cacheFilters])

  /**
   * Reset mutation state and metrics
   */
  const resetMutationState = useCallback((): void => {
    setLastMutation(null)
    setMutationCount(0)
  }, [])

  // =============================================================================
  // AGGREGATE STATE COMPUTATION
  // =============================================================================

  const isLoading = useMemo(() => 
    createLimit.isPending || 
    updateLimit.isPending || 
    deleteLimit.isPending || 
    toggleLimitStatus.isPending,
    [createLimit.isPending, updateLimit.isPending, deleteLimit.isPending, toggleLimitStatus.isPending]
  )

  const error = useMemo(() => 
    createLimit.error || 
    updateLimit.error || 
    deleteLimit.error || 
    toggleLimitStatus.error,
    [createLimit.error, updateLimit.error, deleteLimit.error, toggleLimitStatus.error]
  )

  // =============================================================================
  // RETURN HOOK INTERFACE
  // =============================================================================

  return {
    // Mutation operations
    createLimit,
    updateLimit,
    deleteLimit,
    toggleLimitStatus,
    
    // Aggregate state
    isLoading,
    error,
    
    // Performance metrics
    lastMutation,
    mutationCount,
    
    // Utility methods
    invalidateQueries,
    resetMutationState
  }
}

/**
 * Export hook for external use
 */
export default useLimitMutations

/**
 * Export types for external use
 */
export type {
  UseLimitMutationsReturn,
  OptimisticContext,
  ToggleLimitStatusPayload,
  MutationMetrics
}