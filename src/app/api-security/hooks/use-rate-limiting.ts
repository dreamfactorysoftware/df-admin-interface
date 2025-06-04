/**
 * Rate Limiting Operations Hook
 * 
 * Custom React hook implementing API rate limiting operations with SWR-based
 * data fetching and intelligent caching. Manages limit configurations,
 * enforcement rules, and paywall integration while providing CRUD operations
 * for rate limit management.
 * 
 * Replaces Angular limits resolver and service patterns with React Query-powered
 * data synchronization and cache management.
 * 
 * @author DreamFactory Admin Interface Team
 * @version React 19/Next.js 15.1 Migration
 */

import { useCallback, useMemo } from 'react'
import useSWR, { useSWRConfig } from 'swr'
import useSWRMutation from 'swr/mutation'
import { apiClient } from '@/lib/api-client'
import { useRateLimitingSubscription } from '@/hooks/use-subscription'
import type {
  LimitType,
  LimitTableRowData,
  CreateLimitPayload,
  UpdateLimitPayload,
  PatchLimitPayload,
  LimitListParams,
  CacheLimitType,
  RateLimitingConfig,
  limitQueryKeys,
  DEFAULT_RATE_LIMITING_CONFIG,
} from '@/types/limit'
import type {
  ApiListResponse,
  ApiCreateResponse,
  ApiUpdateResponse,
  ApiDeleteResponse,
  ApiErrorResponse,
} from '@/types/api'

// =============================================================================
// HOOK CONFIGURATION
// =============================================================================

/**
 * SWR configuration optimized for rate limiting operations
 */
const getSWRConfig = (config: RateLimitingConfig) => ({
  revalidateOnFocus: config.refetchOnWindowFocus,
  revalidateOnReconnect: config.refetchOnReconnect,
  refreshInterval: 0, // Manual refresh only for admin operations
  dedupingInterval: 2000, // Prevent duplicate requests within 2 seconds
  errorRetryCount: config.retry === true ? 3 : (config.retry as number || 0),
  errorRetryInterval: config.retryDelay,
  shouldRetryOnError: (error: any) => {
    // Don't retry on client errors (4xx) except 408, 429
    if (error?.status >= 400 && error?.status < 500) {
      return error.status === 408 || error.status === 429
    }
    return true
  },
  // Cache configuration to meet performance requirements
  use: [
    // Add cache hit timing middleware
    (useSWRNext: any) => (key: any, fetcher: any, config: any) => {
      const startTime = performance.now()
      const swr = useSWRNext(key, fetcher, config)
      
      // Log cache hit performance for monitoring
      if (!swr.isLoading && swr.data) {
        const duration = performance.now() - startTime
        if (duration > 50) {
          console.warn(`Cache hit exceeded 50ms requirement: ${duration}ms for key:`, key)
        }
      }
      
      return swr
    }
  ],
})

// =============================================================================
// API FETCHERS
// =============================================================================

/**
 * Fetch paginated list of rate limits
 */
const fetchLimitList = async (params: LimitListParams): Promise<ApiListResponse<LimitType>> => {
  const searchParams = new URLSearchParams()
  
  // Add pagination parameters
  if (params.limit) searchParams.set('limit', params.limit.toString())
  if (params.offset) searchParams.set('offset', params.offset.toString())
  
  // Add sorting and filtering
  if (params.sort) searchParams.set('sort', params.sort)
  if (params.filter) searchParams.set('filter', params.filter)
  if (params.search) searchParams.set('search', params.search)
  
  // Add relationships
  if (params.related) {
    const related = Array.isArray(params.related) ? params.related.join(',') : params.related
    searchParams.set('related', related)
  }
  
  // Add count flag
  if (params.include_count) searchParams.set('include_count', 'true')
  
  // Add rate limiting specific filters
  if (params.active_only) searchParams.set('filter', '(isActive=1)')
  if (params.limit_type) searchParams.set('filter', `(type='${params.limit_type}')`)
  if (params.service_id) searchParams.set('filter', `(serviceId=${params.service_id})`)
  if (params.role_id) searchParams.set('filter', `(roleId=${params.role_id})`)
  if (params.user_id) searchParams.set('filter', `(userId=${params.user_id})`)

  const url = `/limits${searchParams.toString() ? `?${searchParams.toString()}` : ''}`
  
  try {
    const response = await apiClient.get(url)
    
    // Validate response time requirement (under 2 seconds)
    const startTime = Date.now()
    const endTime = Date.now()
    if (endTime - startTime > 2000) {
      console.warn(`API response exceeded 2s requirement: ${endTime - startTime}ms`)
    }
    
    return response
  } catch (error: any) {
    throw new Error(`Failed to fetch limits: ${error.message}`)
  }
}

/**
 * Fetch single rate limit by ID
 */
const fetchLimitDetail = async (id: number | string): Promise<LimitType> => {
  try {
    const response = await apiClient.get(`/limits/${id}?related=limit_cache_by_limit_id,user_by_user_id,role_by_role_id,service_by_service_id`)
    return response
  } catch (error: any) {
    throw new Error(`Failed to fetch limit ${id}: ${error.message}`)
  }
}

/**
 * Fetch cache entries for a specific limit
 */
const fetchLimitCache = async (limitId: number): Promise<CacheLimitType[]> => {
  try {
    const response = await apiClient.get(`/limits/${limitId}/cache`)
    return Array.isArray(response) ? response : response.resource || []
  } catch (error: any) {
    throw new Error(`Failed to fetch cache for limit ${limitId}: ${error.message}`)
  }
}

// =============================================================================
// MUTATION FUNCTIONS
// =============================================================================

/**
 * Create new rate limit
 */
const createLimit = async (url: string, { arg }: { arg: CreateLimitPayload }): Promise<ApiCreateResponse> => {
  try {
    const response = await apiClient.post('/limits', arg)
    return response
  } catch (error: any) {
    throw new Error(`Failed to create limit: ${error.message}`)
  }
}

/**
 * Update existing rate limit
 */
const updateLimit = async (url: string, { arg }: { arg: UpdateLimitPayload }): Promise<ApiUpdateResponse> => {
  try {
    const { id, ...updateData } = arg
    const response = await apiClient.post(`/limits/${id}`, updateData)
    return response
  } catch (error: any) {
    throw new Error(`Failed to update limit ${arg.id}: ${error.message}`)
  }
}

/**
 * Patch rate limit (partial update)
 */
const patchLimit = async (url: string, { arg }: { arg: PatchLimitPayload }): Promise<ApiUpdateResponse> => {
  try {
    const { id, ...patchData } = arg
    const response = await apiClient.post(`/limits/${id}`, patchData)
    return response
  } catch (error: any) {
    throw new Error(`Failed to patch limit ${arg.id}: ${error.message}`)
  }
}

/**
 * Delete rate limit
 */
const deleteLimit = async (url: string, { arg }: { arg: number }): Promise<ApiDeleteResponse> => {
  try {
    const response = await apiClient.post(`/limits/${arg}`, { _method: 'DELETE' })
    return { ...response, id: arg }
  } catch (error: any) {
    throw new Error(`Failed to delete limit ${arg}: ${error.message}`)
  }
}

/**
 * Toggle rate limit active status
 */
const toggleLimit = async (url: string, { arg }: { arg: { id: number; isActive: boolean } }): Promise<ApiUpdateResponse> => {
  try {
    const response = await apiClient.post(`/limits/${arg.id}`, { 
      isActive: arg.isActive,
      lastModifiedDate: new Date().toISOString(),
    })
    return response
  } catch (error: any) {
    throw new Error(`Failed to toggle limit ${arg.id}: ${error.message}`)
  }
}

/**
 * Clear rate limit cache
 */
const clearLimitCache = async (url: string, { arg }: { arg: number }): Promise<ApiDeleteResponse> => {
  try {
    const response = await apiClient.post(`/limits/${arg}/cache`, { _method: 'DELETE' })
    return { ...response, id: arg }
  } catch (error: any) {
    throw new Error(`Failed to clear cache for limit ${arg}: ${error.message}`)
  }
}

// =============================================================================
// MAIN HOOK
// =============================================================================

/**
 * Custom hook for rate limiting operations
 * 
 * Provides comprehensive rate limiting functionality including:
 * - Paywall enforcement integration
 * - SWR-based data fetching with intelligent caching
 * - CRUD operations with optimistic updates
 * - Cache management and invalidation
 * - Error handling and retry logic
 * 
 * @param config - Optional configuration for caching and behavior
 * @returns Rate limiting operations and state
 */
export function useRateLimiting(config: Partial<RateLimitingConfig> = {}) {
  const fullConfig = { ...DEFAULT_RATE_LIMITING_CONFIG, ...config }
  const { mutate } = useSWRConfig()
  
  // Integrate paywall enforcement
  const subscription = useRateLimitingSubscription()
  const { paywallStatus, isFeatureLocked, isLoading: isSubscriptionLoading } = subscription

  // Determine if paywall should block operations
  const isPaywallBlocked = useMemo(() => {
    return fullConfig.enforcePaywall && (isFeatureLocked || paywallStatus.isLocked)
  }, [fullConfig.enforcePaywall, isFeatureLocked, paywallStatus.isLocked])

  // =============================================================================
  // DATA FETCHING HOOKS
  // =============================================================================

  /**
   * Fetch paginated list of rate limits
   */
  const useLimitList = useCallback((params: LimitListParams = {}) => {
    const queryKey = ['limits', 'list', params]
    
    return useSWR(
      isPaywallBlocked ? null : queryKey,
      () => isPaywallBlocked ? Promise.resolve({ resource: [], meta: { count: 0, limit: 0, offset: 0 } }) : fetchLimitList(params),
      {
        ...getSWRConfig(fullConfig),
        // Custom cache configuration for list operations
        refreshInterval: fullConfig.staleTime, // Auto-refresh based on stale time
        onError: (error) => {
          console.error('Failed to fetch limit list:', error)
          if (fullConfig.throwOnError) throw error
        },
      }
    )
  }, [isPaywallBlocked, fullConfig])

  /**
   * Fetch single rate limit by ID
   */
  const useLimitDetail = useCallback((id: number | string | null) => {
    const queryKey = id ? ['limits', 'detail', id] : null
    
    return useSWR(
      isPaywallBlocked || !id ? null : queryKey,
      () => isPaywallBlocked || !id ? Promise.resolve(null) : fetchLimitDetail(id),
      {
        ...getSWRConfig(fullConfig),
        onError: (error) => {
          console.error(`Failed to fetch limit ${id}:`, error)
          if (fullConfig.throwOnError) throw error
        },
      }
    )
  }, [isPaywallBlocked, fullConfig])

  /**
   * Fetch cache entries for a specific limit
   */
  const useLimitCache = useCallback((limitId: number | null) => {
    const queryKey = limitId ? ['limits', 'cache', limitId] : null
    
    return useSWR(
      isPaywallBlocked || !limitId ? null : queryKey,
      () => isPaywallBlocked || !limitId ? Promise.resolve([]) : fetchLimitCache(limitId),
      {
        ...getSWRConfig(fullConfig),
        refreshInterval: 30000, // Refresh cache data every 30 seconds
        onError: (error) => {
          console.error(`Failed to fetch cache for limit ${limitId}:`, error)
          if (fullConfig.throwOnError) throw error
        },
      }
    )
  }, [isPaywallBlocked, fullConfig])

  // =============================================================================
  // MUTATION HOOKS
  // =============================================================================

  /**
   * Create new rate limit
   */
  const useCreateLimit = useSWRMutation('limits:create', createLimit, {
    onSuccess: async (result, key, config) => {
      // Invalidate and refetch limit lists
      await mutate(
        (key) => Array.isArray(key) && key[0] === 'limits' && key[1] === 'list',
        undefined,
        { revalidate: true }
      )
      
      console.log('Successfully created limit:', result.id)
    },
    onError: (error) => {
      console.error('Failed to create limit:', error)
      if (fullConfig.throwOnError) throw error
    },
  })

  /**
   * Update existing rate limit
   */
  const useUpdateLimit = useSWRMutation('limits:update', updateLimit, {
    optimisticData: fullConfig.enableOptimisticUpdates ? (current, { arg }) => {
      // Optimistic update for detail view
      if (current && typeof current === 'object' && 'id' in current) {
        return { ...current, ...arg, lastModifiedDate: new Date().toISOString() }
      }
      return current
    } : undefined,
    onSuccess: async (result, key, config) => {
      const limitId = config.arg.id
      
      // Invalidate specific limit detail
      await mutate(['limits', 'detail', limitId])
      
      // Invalidate and refetch limit lists
      await mutate(
        (key) => Array.isArray(key) && key[0] === 'limits' && key[1] === 'list',
        undefined,
        { revalidate: true }
      )
      
      console.log('Successfully updated limit:', limitId)
    },
    onError: (error) => {
      console.error('Failed to update limit:', error)
      if (fullConfig.throwOnError) throw error
    },
    rollbackOnError: fullConfig.enableOptimisticUpdates,
  })

  /**
   * Patch rate limit (partial update)
   */
  const usePatchLimit = useSWRMutation('limits:patch', patchLimit, {
    optimisticData: fullConfig.enableOptimisticUpdates ? (current, { arg }) => {
      // Optimistic update for detail view
      if (current && typeof current === 'object' && 'id' in current) {
        return { ...current, ...arg, lastModifiedDate: new Date().toISOString() }
      }
      return current
    } : undefined,
    onSuccess: async (result, key, config) => {
      const limitId = config.arg.id
      
      // Invalidate specific limit detail
      await mutate(['limits', 'detail', limitId])
      
      // Invalidate and refetch limit lists
      await mutate(
        (key) => Array.isArray(key) && key[0] === 'limits' && key[1] === 'list',
        undefined,
        { revalidate: true }
      )
      
      console.log('Successfully patched limit:', limitId)
    },
    onError: (error) => {
      console.error('Failed to patch limit:', error)
      if (fullConfig.throwOnError) throw error
    },
    rollbackOnError: fullConfig.enableOptimisticUpdates,
  })

  /**
   * Delete rate limit
   */
  const useDeleteLimit = useSWRMutation('limits:delete', deleteLimit, {
    onSuccess: async (result, key, config) => {
      const limitId = config.arg
      
      // Remove from cache
      await mutate(['limits', 'detail', limitId], undefined, { revalidate: false })
      await mutate(['limits', 'cache', limitId], undefined, { revalidate: false })
      
      // Invalidate and refetch limit lists
      await mutate(
        (key) => Array.isArray(key) && key[0] === 'limits' && key[1] === 'list',
        undefined,
        { revalidate: true }
      )
      
      console.log('Successfully deleted limit:', limitId)
    },
    onError: (error) => {
      console.error('Failed to delete limit:', error)
      if (fullConfig.throwOnError) throw error
    },
  })

  /**
   * Toggle rate limit active status
   */
  const useToggleLimit = useSWRMutation('limits:toggle', toggleLimit, {
    optimisticData: fullConfig.enableOptimisticUpdates ? (current, { arg }) => {
      // Optimistic update for detail view
      if (current && typeof current === 'object' && 'id' in current) {
        return { ...current, isActive: arg.isActive, lastModifiedDate: new Date().toISOString() }
      }
      return current
    } : undefined,
    onSuccess: async (result, key, config) => {
      const limitId = config.arg.id
      
      // Invalidate specific limit detail
      await mutate(['limits', 'detail', limitId])
      
      // Invalidate and refetch limit lists
      await mutate(
        (key) => Array.isArray(key) && key[0] === 'limits' && key[1] === 'list',
        undefined,
        { revalidate: true }
      )
      
      console.log('Successfully toggled limit:', limitId, 'to', config.arg.isActive)
    },
    onError: (error) => {
      console.error('Failed to toggle limit:', error)
      if (fullConfig.throwOnError) throw error
    },
    rollbackOnError: fullConfig.enableOptimisticUpdates,
  })

  /**
   * Clear rate limit cache
   */
  const useClearLimitCache = useSWRMutation('limits:clearCache', clearLimitCache, {
    onSuccess: async (result, key, config) => {
      const limitId = config.arg
      
      // Invalidate cache data
      await mutate(['limits', 'cache', limitId])
      
      console.log('Successfully cleared cache for limit:', limitId)
    },
    onError: (error) => {
      console.error('Failed to clear limit cache:', error)
      if (fullConfig.throwOnError) throw error
    },
  })

  // =============================================================================
  // UTILITY FUNCTIONS
  // =============================================================================

  /**
   * Transform limit data for table display
   */
  const transformToTableRow = useCallback((limit: LimitType): LimitTableRowData => {
    return {
      id: limit.id,
      name: limit.name,
      limitType: limit.type,
      limitRate: `${limit.rate} per ${limit.period}`,
      limitCounter: limit.keyText || `${limit.type}:${limit.id}`,
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
    }
  }, [])

  /**
   * Refresh all limit-related caches
   */
  const refreshAll = useCallback(async () => {
    await mutate(
      (key) => Array.isArray(key) && key[0] === 'limits',
      undefined,
      { revalidate: true }
    )
  }, [mutate])

  /**
   * Invalidate specific limit cache
   */
  const invalidateLimit = useCallback(async (limitId: number) => {
    await mutate(['limits', 'detail', limitId])
    await mutate(['limits', 'cache', limitId])
  }, [mutate])

  // =============================================================================
  // RETURN VALUE
  // =============================================================================

  return {
    // Subscription and paywall state
    subscription,
    paywallStatus,
    isFeatureLocked,
    isPaywallBlocked,
    isSubscriptionLoading,

    // Data fetching hooks
    useLimitList,
    useLimitDetail,
    useLimitCache,

    // Mutation hooks
    useCreateLimit,
    useUpdateLimit,
    usePatchLimit,
    useDeleteLimit,
    useToggleLimit,
    useClearLimitCache,

    // Utility functions
    transformToTableRow,
    refreshAll,
    invalidateLimit,

    // Configuration
    config: fullConfig,

    // Query key factory for external use
    queryKeys: limitQueryKeys,

    // Legacy resolver compatibility
    limitsResolver: isPaywallBlocked 
      ? () => Promise.resolve('paywall')
      : (params: LimitListParams = {}) => fetchLimitList(params),
  }
}

// =============================================================================
// SPECIALIZED HOOKS
// =============================================================================

/**
 * Hook for managing rate limits table
 */
export function useRateLimitingTable(params: LimitListParams = {}) {
  const rateLimiting = useRateLimiting()
  const { useLimitList, transformToTableRow, isPaywallBlocked } = rateLimiting
  
  // Default parameters for table view
  const tableParams = {
    limit: 25,
    sort: 'name',
    related: 'limit_cache_by_limit_id',
    include_count: true,
    ...params,
  }
  
  const limitList = useLimitList(tableParams)
  
  // Transform data for table display
  const tableData = useMemo(() => {
    if (!limitList.data?.resource) return []
    return limitList.data.resource.map(transformToTableRow)
  }, [limitList.data, transformToTableRow])
  
  return {
    ...rateLimiting,
    tableData,
    pagination: limitList.data?.meta,
    isLoading: limitList.isLoading,
    error: limitList.error,
    refetch: limitList.mutate,
  }
}

/**
 * Hook for rate limit detail management
 */
export function useRateLimitingDetail(limitId: number | string | null) {
  const rateLimiting = useRateLimiting()
  const { useLimitDetail, useLimitCache, isPaywallBlocked } = rateLimiting
  
  const limitDetail = useLimitDetail(limitId)
  const limitCache = useLimitCache(limitId ? Number(limitId) : null)
  
  return {
    ...rateLimiting,
    limit: limitDetail.data,
    cache: limitCache.data,
    isLoading: limitDetail.isLoading || limitCache.isLoading,
    error: limitDetail.error || limitCache.error,
    refetch: async () => {
      await limitDetail.mutate()
      await limitCache.mutate()
    },
  }
}

// =============================================================================
// EXPORTS
// =============================================================================

export type { RateLimitingConfig, LimitListParams }
export { DEFAULT_RATE_LIMITING_CONFIG }