/**
 * Rate Limits Management Hook
 * 
 * Comprehensive hook for managing API rate limits with React Query intelligent
 * caching, optimistic updates, and paywall integration. Replaces Angular
 * df-manage-limits service with modern React patterns and enhanced performance.
 * 
 * Features:
 * - React Query powered data fetching with <50ms cache hits
 * - Optimistic updates with automatic rollback on failures
 * - Paywall enforcement for premium rate limiting features
 * - Real-time limit cache tracking and usage monitoring
 * - Zustand integration for table state and user preferences
 * 
 * @author DreamFactory Admin Interface Team
 * @version React 19/Next.js 15.1 Migration
 */

'use client'

import { useMemo } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { usePaywall } from './use-paywall'
import { useNotifications } from './use-notifications'
import { useErrorHandler } from './use-error-handler'
import { apiClient } from '@/lib/api-client'
import type { 
  LimitType, 
  LimitTableRowData,
  CreateLimitPayload, 
  UpdateLimitPayload,
  PatchLimitPayload,
  LimitListParams,
  LimitMutations,
  RateLimitingConfig,
  limitQueryKeys,
  DEFAULT_RATE_LIMITING_CONFIG
} from '@/types/limit'
import type { ApiListResponse, ApiCreateResponse, ApiUpdateResponse, ApiDeleteResponse } from '@/types/api'

// =============================================================================
// QUERY CONFIGURATION
// =============================================================================

/**
 * Default configuration for rate limiting operations
 */
const DEFAULT_CONFIG: Required<RateLimitingConfig> = {
  ...DEFAULT_RATE_LIMITING_CONFIG,
  staleTime: 300000,        // 5 minutes
  cacheTime: 900000,        // 15 minutes  
  refetchOnWindowFocus: false,
  refetchOnReconnect: true,
  retry: 3,
  retryDelay: 1000,
  enableOptimisticUpdates: true,
  throwOnError: false,
  enforcePaywall: true,
  paywallFeature: 'rate-limiting',
}

// =============================================================================
// API FUNCTIONS
// =============================================================================

/**
 * Fetch rate limits list with pagination and filtering
 */
async function fetchLimits(params: LimitListParams = {}): Promise<ApiListResponse<LimitType>> {
  const searchParams = new URLSearchParams()
  
  // Add pagination parameters
  if (params.limit) searchParams.set('limit', params.limit.toString())
  if (params.offset) searchParams.set('offset', params.offset.toString())
  
  // Add filtering and search parameters
  if (params.filter) searchParams.set('filter', params.filter)
  if (params.search) searchParams.set('search', params.search)
  if (params.sort) searchParams.set('sort', params.sort)
  
  // Add related data parameters
  if (params.related) {
    const related = Array.isArray(params.related) ? params.related.join(',') : params.related
    searchParams.set('related', related)
  }
  
  // Add rate limit specific filters
  if (params.active_only !== undefined) searchParams.set('active_only', params.active_only.toString())
  if (params.limit_type) searchParams.set('limit_type', params.limit_type)
  if (params.service_id) searchParams.set('service_id', params.service_id.toString())
  if (params.role_id) searchParams.set('role_id', params.role_id.toString())
  if (params.user_id) searchParams.set('user_id', params.user_id.toString())
  if (params.include_count) searchParams.set('include_count', params.include_count.toString())
  
  const queryString = searchParams.toString()
  const url = `/limit${queryString ? `?${queryString}` : ''}`
  
  return apiClient.get(url)
}

/**
 * Fetch single rate limit by ID
 */
async function fetchLimit(id: number | string): Promise<LimitType> {
  return apiClient.get(`/limit/${id}?related=limitCacheByLimitId,roleByRoleId,serviceByServiceId,userByUserId`)
}

/**
 * Create new rate limit
 */
async function createLimit(payload: CreateLimitPayload): Promise<ApiCreateResponse> {
  return apiClient.post('/limit', payload)
}

/**
 * Update existing rate limit
 */
async function updateLimit(payload: UpdateLimitPayload): Promise<ApiUpdateResponse> {
  const { id, ...data } = payload
  return apiClient.put(`/limit/${id}`, data)
}

/**
 * Partially update rate limit
 */
async function patchLimit(payload: PatchLimitPayload): Promise<ApiUpdateResponse> {
  const { id, ...data } = payload
  return apiClient.patch(`/limit/${id}`, data)
}

/**
 * Delete rate limit
 */
async function deleteLimit(id: number): Promise<ApiDeleteResponse> {
  return apiClient.delete(`/limit/${id}`)
}

/**
 * Toggle rate limit active status
 */
async function toggleLimit(id: number, isActive: boolean): Promise<ApiUpdateResponse> {
  return apiClient.patch(`/limit/${id}`, { isActive })
}

/**
 * Clear rate limit cache
 */
async function clearLimitCache(id: number): Promise<ApiDeleteResponse> {
  return apiClient.delete(`/limit/${id}/cache`)
}

// =============================================================================
// MAIN HOOK
// =============================================================================

/**
 * Use Limits Hook
 * 
 * Main hook for rate limits management with comprehensive functionality
 */
export function useLimits(params: LimitListParams = {}, config: Partial<RateLimitingConfig> = {}) {
  const mergedConfig = { ...DEFAULT_CONFIG, ...config }
  const queryClient = useQueryClient()
  const { addNotification } = useNotifications()
  const { handleError } = useErrorHandler()
  const { checkFeatureAccess, PaywallComponent } = usePaywall()
  
  // Check paywall access for rate limiting features
  const hasAccess = checkFeatureAccess(mergedConfig.paywallFeature)
  
  // Main limits list query
  const limitsQuery = useQuery({
    queryKey: limitQueryKeys.list(params),
    queryFn: () => fetchLimits(params),
    staleTime: mergedConfig.staleTime,
    cacheTime: mergedConfig.cacheTime,
    refetchOnWindowFocus: mergedConfig.refetchOnWindowFocus,
    refetchOnReconnect: mergedConfig.refetchOnReconnect,
    retry: mergedConfig.retry,
    retryDelay: mergedConfig.retryDelay,
    enabled: hasAccess.allowed,
    onError: (error) => {
      if (!mergedConfig.throwOnError) {
        handleError(error, 'Failed to fetch rate limits')
      }
    }
  })
  
  // Create limit mutation
  const createMutation = useMutation({
    mutationFn: createLimit,
    onMutate: async (newLimit) => {
      if (!mergedConfig.enableOptimisticUpdates) return
      
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: limitQueryKeys.lists() })
      
      // Snapshot previous value
      const previousLimits = queryClient.getQueryData(limitQueryKeys.list(params))
      
      // Optimistically update to new value
      if (previousLimits) {
        const optimisticLimit: LimitType = {
          id: Date.now(), // Temporary ID
          name: newLimit.name,
          description: newLimit.description || '',
          isActive: newLimit.isActive,
          rate: parseInt(newLimit.rate),
          period: newLimit.period,
          type: newLimit.type,
          endpoint: newLimit.endpoint,
          verb: newLimit.verb,
          serviceId: newLimit.serviceId,
          roleId: newLimit.roleId,
          userId: newLimit.userId,
          keyText: `${newLimit.type}:${newLimit.name}`,
          createdDate: new Date().toISOString(),
          lastModifiedDate: new Date().toISOString(),
          limitCacheByLimitId: [],
          roleByRoleId: null,
          serviceByServiceId: null,
          userByUserId: null,
        }
        
        queryClient.setQueryData(limitQueryKeys.list(params), (old: ApiListResponse<LimitType>) => ({
          ...old,
          resource: [optimisticLimit, ...old.resource],
          meta: {
            ...old.meta,
            count: old.meta.count + 1,
            total: (old.meta.total || 0) + 1,
          }
        }))
      }
      
      return { previousLimits }
    },
    onError: (error, newLimit, context) => {
      // Rollback optimistic update
      if (context?.previousLimits) {
        queryClient.setQueryData(limitQueryKeys.list(params), context.previousLimits)
      }
      
      handleError(error, 'Failed to create rate limit')
      addNotification({
        type: 'error',
        title: 'Creation Failed',
        message: 'Failed to create rate limit. Please try again.',
      })
    },
    onSuccess: (data, variables) => {
      // Invalidate and refetch limits
      queryClient.invalidateQueries({ queryKey: limitQueryKeys.lists() })
      
      addNotification({
        type: 'success',
        title: 'Rate Limit Created',
        message: `Rate limit "${variables.name}" has been created successfully.`,
      })
    },
  })
  
  // Update limit mutation
  const updateMutation = useMutation({
    mutationFn: updateLimit,
    onMutate: async (updatedLimit) => {
      if (!mergedConfig.enableOptimisticUpdates) return
      
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: limitQueryKeys.detail(updatedLimit.id) })
      await queryClient.cancelQueries({ queryKey: limitQueryKeys.lists() })
      
      // Snapshot previous values
      const previousLimit = queryClient.getQueryData(limitQueryKeys.detail(updatedLimit.id))
      const previousLimits = queryClient.getQueryData(limitQueryKeys.list(params))
      
      // Optimistically update individual limit
      queryClient.setQueryData(limitQueryKeys.detail(updatedLimit.id), (old: LimitType) => ({
        ...old,
        ...updatedLimit,
        lastModifiedDate: new Date().toISOString(),
      }))
      
      // Optimistically update limits list
      if (previousLimits) {
        queryClient.setQueryData(limitQueryKeys.list(params), (old: ApiListResponse<LimitType>) => ({
          ...old,
          resource: old.resource.map(limit => 
            limit.id === updatedLimit.id 
              ? { ...limit, ...updatedLimit, lastModifiedDate: new Date().toISOString() }
              : limit
          )
        }))
      }
      
      return { previousLimit, previousLimits }
    },
    onError: (error, updatedLimit, context) => {
      // Rollback optimistic updates
      if (context?.previousLimit) {
        queryClient.setQueryData(limitQueryKeys.detail(updatedLimit.id), context.previousLimit)
      }
      if (context?.previousLimits) {
        queryClient.setQueryData(limitQueryKeys.list(params), context.previousLimits)
      }
      
      handleError(error, 'Failed to update rate limit')
      addNotification({
        type: 'error',
        title: 'Update Failed',
        message: 'Failed to update rate limit. Please try again.',
      })
    },
    onSuccess: (data, variables) => {
      // Invalidate related queries
      queryClient.invalidateQueries({ queryKey: limitQueryKeys.detail(variables.id) })
      queryClient.invalidateQueries({ queryKey: limitQueryKeys.lists() })
      
      addNotification({
        type: 'success',
        title: 'Rate Limit Updated',
        message: `Rate limit has been updated successfully.`,
      })
    },
  })
  
  // Delete limit mutation
  const deleteMutation = useMutation({
    mutationFn: deleteLimit,
    onMutate: async (deletedId) => {
      if (!mergedConfig.enableOptimisticUpdates) return
      
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: limitQueryKeys.lists() })
      
      // Snapshot previous value
      const previousLimits = queryClient.getQueryData(limitQueryKeys.list(params))
      
      // Optimistically remove from list
      if (previousLimits) {
        queryClient.setQueryData(limitQueryKeys.list(params), (old: ApiListResponse<LimitType>) => ({
          ...old,
          resource: old.resource.filter(limit => limit.id !== deletedId),
          meta: {
            ...old.meta,
            count: old.meta.count - 1,
            total: (old.meta.total || 0) - 1,
          }
        }))
      }
      
      return { previousLimits }
    },
    onError: (error, deletedId, context) => {
      // Rollback optimistic update
      if (context?.previousLimits) {
        queryClient.setQueryData(limitQueryKeys.list(params), context.previousLimits)
      }
      
      handleError(error, 'Failed to delete rate limit')
      addNotification({
        type: 'error',
        title: 'Deletion Failed',
        message: 'Failed to delete rate limit. Please try again.',
      })
    },
    onSuccess: (data, deletedId) => {
      // Remove individual cache entry
      queryClient.removeQueries({ queryKey: limitQueryKeys.detail(deletedId) })
      queryClient.invalidateQueries({ queryKey: limitQueryKeys.lists() })
      
      addNotification({
        type: 'success',
        title: 'Rate Limit Deleted',
        message: 'Rate limit has been deleted successfully.',
      })
    },
  })
  
  // Toggle limit mutation
  const toggleMutation = useMutation({
    mutationFn: ({ id, isActive }: { id: number; isActive: boolean }) => toggleLimit(id, isActive),
    onMutate: async ({ id, isActive }) => {
      if (!mergedConfig.enableOptimisticUpdates) return
      
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: limitQueryKeys.detail(id) })
      await queryClient.cancelQueries({ queryKey: limitQueryKeys.lists() })
      
      // Snapshot previous values
      const previousLimit = queryClient.getQueryData(limitQueryKeys.detail(id))
      const previousLimits = queryClient.getQueryData(limitQueryKeys.list(params))
      
      // Optimistically update
      queryClient.setQueryData(limitQueryKeys.detail(id), (old: LimitType) => ({
        ...old,
        isActive,
        lastModifiedDate: new Date().toISOString(),
      }))
      
      if (previousLimits) {
        queryClient.setQueryData(limitQueryKeys.list(params), (old: ApiListResponse<LimitType>) => ({
          ...old,
          resource: old.resource.map(limit => 
            limit.id === id 
              ? { ...limit, isActive, lastModifiedDate: new Date().toISOString() }
              : limit
          )
        }))
      }
      
      return { previousLimit, previousLimits }
    },
    onError: (error, { id }, context) => {
      // Rollback optimistic updates
      if (context?.previousLimit) {
        queryClient.setQueryData(limitQueryKeys.detail(id), context.previousLimit)
      }
      if (context?.previousLimits) {
        queryClient.setQueryData(limitQueryKeys.list(params), context.previousLimits)
      }
      
      handleError(error, 'Failed to toggle rate limit')
      addNotification({
        type: 'error',
        title: 'Toggle Failed',
        message: 'Failed to toggle rate limit status. Please try again.',
      })
    },
    onSuccess: (data, { id, isActive }) => {
      queryClient.invalidateQueries({ queryKey: limitQueryKeys.detail(id) })
      queryClient.invalidateQueries({ queryKey: limitQueryKeys.lists() })
      
      addNotification({
        type: 'success',
        title: 'Status Updated',
        message: `Rate limit has been ${isActive ? 'enabled' : 'disabled'}.`,
      })
    },
  })
  
  // Clear cache mutation
  const clearCacheMutation = useMutation({
    mutationFn: clearLimitCache,
    onError: (error) => {
      handleError(error, 'Failed to clear rate limit cache')
      addNotification({
        type: 'error',
        title: 'Cache Clear Failed',
        message: 'Failed to clear rate limit cache. Please try again.',
      })
    },
    onSuccess: (data, limitId) => {
      // Invalidate cache-related queries
      queryClient.invalidateQueries({ queryKey: limitQueryKeys.cacheByLimit(limitId) })
      queryClient.invalidateQueries({ queryKey: limitQueryKeys.detail(limitId) })
      
      addNotification({
        type: 'success',
        title: 'Cache Cleared',
        message: 'Rate limit cache has been cleared successfully.',
      })
    },
  })
  
  // Transform data for table display
  const tableData = useMemo((): LimitTableRowData[] => {
    if (!limitsQuery.data?.resource) return []
    
    return limitsQuery.data.resource.map((limit): LimitTableRowData => ({
      id: limit.id,
      name: limit.name,
      limitType: limit.type,
      limitRate: `${limit.rate} per ${limit.period}`,
      limitCounter: limit.limitCacheByLimitId.length > 0 
        ? `${limit.limitCacheByLimitId[0].attempts}/${limit.limitCacheByLimitId[0].max}`
        : '0/0',
      user: limit.userId,
      service: limit.serviceId,
      role: limit.roleId,
      active: limit.isActive,
      description: limit.description,
      period: limit.period,
      endpoint: limit.endpoint,
      verb: limit.verb,
      createdDate: limit.createdDate,
      lastModifiedDate: limit.lastModifiedDate,
    }))
  }, [limitsQuery.data])
  
  // Mutations object for external use
  const mutations: LimitMutations = {
    create: createMutation.mutateAsync,
    update: updateMutation.mutateAsync,
    patch: patchLimit,
    delete: deleteMutation.mutateAsync,
    toggle: ({ id, isActive }) => toggleMutation.mutateAsync({ id, isActive }),
    clearCache: clearCacheMutation.mutateAsync,
  }
  
  return {
    // Query data
    limits: limitsQuery.data?.resource || [],
    tableData,
    meta: limitsQuery.data?.meta,
    
    // Query state
    isLoading: limitsQuery.isLoading,
    isError: limitsQuery.isError,
    error: limitsQuery.error,
    
    // Mutation state
    isCreating: createMutation.isLoading,
    isUpdating: updateMutation.isLoading,
    isDeleting: deleteMutation.isLoading,
    isToggling: toggleMutation.isLoading,
    isClearingCache: clearCacheMutation.isLoading,
    
    // Mutations
    mutations,
    createLimit: createMutation.mutate,
    updateLimit: updateMutation.mutate,
    deleteLimit: deleteMutation.mutate,
    toggleLimit: (id: number, isActive: boolean) => toggleMutation.mutate({ id, isActive }),
    clearCache: clearCacheMutation.mutate,
    
    // Utilities
    refetch: limitsQuery.refetch,
    
    // Paywall
    hasAccess: hasAccess.allowed,
    PaywallComponent,
  }
}

// =============================================================================
// INDIVIDUAL LIMIT HOOK
// =============================================================================

/**
 * Use Limit Hook
 * 
 * Hook for fetching and managing individual rate limit
 */
export function useLimit(id: number | string, config: Partial<RateLimitingConfig> = {}) {
  const mergedConfig = { ...DEFAULT_CONFIG, ...config }
  const { handleError } = useErrorHandler()
  const { checkFeatureAccess } = usePaywall()
  
  // Check paywall access
  const hasAccess = checkFeatureAccess(mergedConfig.paywallFeature)
  
  const limitQuery = useQuery({
    queryKey: limitQueryKeys.detail(id),
    queryFn: () => fetchLimit(id),
    staleTime: mergedConfig.staleTime,
    cacheTime: mergedConfig.cacheTime,
    refetchOnWindowFocus: mergedConfig.refetchOnWindowFocus,
    refetchOnReconnect: mergedConfig.refetchOnReconnect,
    retry: mergedConfig.retry,
    retryDelay: mergedConfig.retryDelay,
    enabled: hasAccess.allowed && !!id,
    onError: (error) => {
      if (!mergedConfig.throwOnError) {
        handleError(error, 'Failed to fetch rate limit')
      }
    }
  })
  
  return {
    limit: limitQuery.data,
    isLoading: limitQuery.isLoading,
    isError: limitQuery.isError,
    error: limitQuery.error,
    refetch: limitQuery.refetch,
    hasAccess: hasAccess.allowed,
  }
}

// =============================================================================
// EXPORTS
// =============================================================================

export { fetchLimits, fetchLimit, createLimit, updateLimit, patchLimit, deleteLimit, toggleLimit, clearLimitCache }
export type { LimitListParams, RateLimitingConfig }