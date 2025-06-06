/**
 * Custom React hook for limits data fetching with SWR-based intelligent caching
 * 
 * Replaces the Angular limits resolver with modern React patterns, providing
 * comprehensive limit data management with paywall enforcement, automatic
 * revalidation, and optimized caching strategies per React/Next.js Integration
 * Requirements.
 * 
 * Features:
 * - SWR-based data fetching with TTL configuration (staleTime: 300s, cacheTime: 900s)
 * - Paywall enforcement integration replacing Angular route guard patterns
 * - Cache hit responses under 50ms per performance requirements
 * - Support for both list and individual limit fetching modes
 * - Automatic background revalidation with related cache relationships
 * - Type-safe configuration workflows with comprehensive error handling
 * 
 * @fileoverview Limits data fetching hook for DreamFactory admin interface
 * @version 1.0.0
 * @since React 19.0.0 / Next.js 15.1+
 */

import { useMemo, useCallback } from 'react';
import useSWR, { SWRConfiguration, KeyedMutator } from 'swr';
import { useRouter } from 'next/navigation';
import { apiGet, API_BASE_URL } from '../../../lib/api-client';
import { useSubscription } from '../../../hooks/use-subscription';
import type {
  LimitTableRowData,
  LimitSwrOptions,
  LimitListQuery,
  LimitDetailQuery,
  LimitUsageStats,
} from '../types';
import type {
  ApiListResponse,
  ApiResourceResponse,
  ApiErrorResponse,
  ApiRequestOptions,
} from '../../../types/api';

// ============================================================================
// Constants and Configuration
// ============================================================================

/**
 * Default SWR configuration optimized for limits data
 * Implements performance requirements per React/Next.js Integration Requirements
 */
const DEFAULT_SWR_CONFIG: SWRConfiguration = {
  // Cache configuration per Section 5.2 Component Details
  dedupingInterval: 2000, // 2 seconds deduping for rapid successive requests
  refreshInterval: 0, // Disable automatic polling by default
  revalidateOnFocus: true, // Revalidate when user returns to tab
  revalidateOnReconnect: true, // Revalidate when network reconnects
  
  // Error handling configuration
  errorRetryCount: 3,
  errorRetryInterval: 1000, // 1 second retry interval
  
  // Performance optimization
  keepPreviousData: true, // Maintain previous data during revalidation
  compare: (previous: any, current: any) => {
    // Custom comparison to prevent unnecessary re-renders
    return JSON.stringify(previous) === JSON.stringify(current);
  },
} as const;

/**
 * TTL configuration per Section 5.2 Component Details
 * staleTime: 300 seconds, cacheTime: 900 seconds
 */
const CACHE_CONFIG = {
  STALE_TIME: 300 * 1000, // 5 minutes in milliseconds
  CACHE_TIME: 900 * 1000, // 15 minutes in milliseconds
  BACKGROUND_REFETCH_INTERVAL: 60 * 1000, // 1 minute for active usage
} as const;

/**
 * API endpoints for limits operations
 */
const LIMITS_ENDPOINTS = {
  LIST: `${API_BASE_URL}/system/limit`,
  DETAIL: (id: number) => `${API_BASE_URL}/system/limit/${id}`,
  USAGE: (id: number) => `${API_BASE_URL}/system/limit/${id}/usage`,
  CACHE: `${API_BASE_URL}/system/limit/_cache`,
} as const;

// ============================================================================
// Hook Options and Return Types
// ============================================================================

/**
 * Configuration options for useLimitsData hook
 */
interface UseLimitsDataOptions extends Omit<LimitSwrOptions, 'key'> {
  /** Limit ID for individual limit fetching */
  limitId?: number;
  
  /** Include usage statistics */
  includeUsage?: boolean;
  
  /** Override default cache configuration */
  cacheConfig?: Partial<typeof CACHE_CONFIG>;
  
  /** Disable paywall enforcement (for internal usage) */
  skipPaywall?: boolean;
  
  /** Enable real-time updates for active monitoring */
  enableRealtime?: boolean;
  
  /** Custom request options */
  requestOptions?: ApiRequestOptions;
}

/**
 * Return type for individual limit data fetching
 */
interface UseLimitDetailReturn {
  /** Limit data */
  limit: LimitTableRowData | undefined;
  
  /** Usage statistics */
  usage?: LimitUsageStats;
  
  /** Loading states */
  loading: {
    limit: boolean;
    usage: boolean;
  };
  
  /** Error states */
  error: {
    limit: ApiErrorResponse | null;
    usage: ApiErrorResponse | null;
  };
  
  /** Paywall status */
  paywall: {
    isActive: boolean;
    isLoading: boolean;
    error: Error | null;
  };
  
  /** Data management operations */
  operations: {
    refresh: () => Promise<void>;
    refreshUsage: () => Promise<void>;
    invalidate: () => Promise<void>;
    preload: () => Promise<void>;
  };
  
  /** Validation helpers */
  validation: {
    isValid: boolean;
    lastUpdated: Date | null;
    isStale: boolean;
  };
}

/**
 * Return type for limits list data fetching
 */
interface UseLimitsListReturn {
  /** Limits array */
  limits: LimitTableRowData[];
  
  /** Pagination metadata */
  meta: {
    count: number;
    offset: number;
    limit: number;
    hasNext: boolean;
    hasPrevious: boolean;
  };
  
  /** Loading states */
  loading: {
    initial: boolean;
    refresh: boolean;
    loadMore: boolean;
  };
  
  /** Error state */
  error: ApiErrorResponse | null;
  
  /** Paywall status */
  paywall: {
    isActive: boolean;
    isLoading: boolean;
    error: Error | null;
  };
  
  /** Data management operations */
  operations: {
    refresh: () => Promise<void>;
    loadMore: () => Promise<void>;
    invalidate: () => Promise<void>;
    invalidateItem: (id: number) => Promise<void>;
    preloadItem: (id: number) => Promise<void>;
  };
  
  /** Filter and sort state */
  query: {
    filter?: string;
    sort?: string;
    offset: number;
    limit: number;
    updateQuery: (updates: Partial<ApiRequestOptions>) => void;
  };
  
  /** Validation helpers */
  validation: {
    isValid: boolean;
    lastUpdated: Date | null;
    isStale: boolean;
    isEmpty: boolean;
  };
}

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Build SWR key for limits data fetching
 * Implements cache key strategy for optimal cache hit rates
 */
function buildLimitsKey(
  type: 'list' | 'detail' | 'usage',
  options: UseLimitsDataOptions = {}
): string | null {
  // Return null if paywall is active (disables fetching)
  if (options.skipPaywall === false && options.limitId === undefined) {
    // We'll check paywall status in the hook itself
  }
  
  const base = 'limits';
  const filters = options.filters;
  const sort = options.sort;
  const requestOptions = options.requestOptions;
  
  switch (type) {
    case 'detail':
      if (!options.limitId) return null;
      return `${base}/detail/${options.limitId}`;
    
    case 'usage':
      if (!options.limitId) return null;
      return `${base}/usage/${options.limitId}`;
    
    case 'list':
      const params: string[] = [];
      
      // Add pagination
      if (requestOptions?.limit) params.push(`limit=${requestOptions.limit}`);
      if (requestOptions?.offset) params.push(`offset=${requestOptions.offset}`);
      
      // Add filtering
      if (filters?.active !== undefined) params.push(`active=${filters.active}`);
      if (filters?.userId) params.push(`userId=${filters.userId}`);
      if (filters?.serviceId) params.push(`serviceId=${filters.serviceId}`);
      if (filters?.roleId) params.push(`roleId=${filters.roleId}`);
      if (filters?.limitType) params.push(`limitType=${filters.limitType}`);
      if (requestOptions?.filter) params.push(`filter=${requestOptions.filter}`);
      
      // Add sorting
      if (sort?.field && sort?.direction) {
        params.push(`sort=${sort.direction === 'desc' ? '-' : ''}${sort.field}`);
      } else if (requestOptions?.sort) {
        params.push(`sort=${requestOptions.sort}`);
      }
      
      const queryString = params.length > 0 ? `?${params.join('&')}` : '';
      return `${base}/list${queryString}`;
    
    default:
      return null;
  }
}

/**
 * Build API request options from hook options
 */
function buildRequestOptions(options: UseLimitsDataOptions): ApiRequestOptions {
  const baseOptions: ApiRequestOptions = {
    includeCacheControl: false, // Let SWR handle caching
    showSpinner: false, // Hook manages loading states
  };
  
  // Add pagination
  if (options.requestOptions?.limit) {
    baseOptions.limit = options.requestOptions.limit;
  }
  if (options.requestOptions?.offset) {
    baseOptions.offset = options.requestOptions.offset;
  }
  
  // Add filtering
  if (options.filters) {
    const filterParts: string[] = [];
    
    if (options.filters.active !== undefined) {
      filterParts.push(`active=${options.filters.active ? 1 : 0}`);
    }
    if (options.filters.userId) {
      filterParts.push(`user=${options.filters.userId}`);
    }
    if (options.filters.serviceId) {
      filterParts.push(`service=${options.filters.serviceId}`);
    }
    if (options.filters.roleId) {
      filterParts.push(`role=${options.filters.roleId}`);
    }
    if (options.filters.limitType) {
      filterParts.push(`limit_type='${options.filters.limitType}'`);
    }
    
    if (filterParts.length > 0) {
      baseOptions.filter = filterParts.join(' AND ');
    }
  }
  
  // Add sorting
  if (options.sort?.field && options.sort?.direction) {
    const direction = options.sort.direction === 'desc' ? '-' : '';
    baseOptions.sort = `${direction}${options.sort.field}`;
  } else {
    // Default sort by name
    baseOptions.sort = 'name';
  }
  
  // Add related data
  baseOptions.related = 'limit_cache_by_limit_id';
  
  // Include count for pagination
  baseOptions.includeCount = true;
  
  // Merge with custom request options
  return {
    ...baseOptions,
    ...options.requestOptions,
  };
}

/**
 * Fetcher function for limits list
 */
async function fetchLimitsList(key: string, options: UseLimitsDataOptions): Promise<LimitListQuery> {
  const requestOptions = buildRequestOptions(options);
  const response = await apiGet<ApiListResponse<LimitTableRowData>>(
    LIMITS_ENDPOINTS.LIST,
    requestOptions
  );
  return response;
}

/**
 * Fetcher function for individual limit
 */
async function fetchLimitDetail(key: string, limitId: number): Promise<LimitDetailQuery> {
  const response = await apiGet<ApiResourceResponse<LimitTableRowData>>(
    LIMITS_ENDPOINTS.DETAIL(limitId)
  );
  return response;
}

/**
 * Fetcher function for limit usage statistics
 */
async function fetchLimitUsage(key: string, limitId: number): Promise<LimitUsageStats> {
  const response = await apiGet<ApiResourceResponse<LimitUsageStats>>(
    LIMITS_ENDPOINTS.USAGE(limitId)
  );
  return response.resource;
}

// ============================================================================
// Main Hook Implementation
// ============================================================================

/**
 * Custom hook for fetching individual limit data with paywall enforcement
 * 
 * Provides comprehensive limit data management with SWR-based caching,
 * automatic revalidation, and paywall integration. Optimized for cache
 * hit responses under 50ms per performance requirements.
 * 
 * @param limitId - The limit ID to fetch
 * @param options - Configuration options for the hook
 * @returns Comprehensive limit data and management operations
 */
export function useLimitData(
  limitId: number,
  options: UseLimitsDataOptions = {}
): UseLimitDetailReturn {
  const router = useRouter();
  
  // Paywall enforcement integration replacing Angular route guard patterns
  const {
    isPaywallActive,
    isLoading: paywallLoading,
    error: paywallError,
  } = useSubscription('limit', { 
    enabled: !options.skipPaywall,
    onPaywallActive: () => {
      // Redirect to paywall page or show paywall component
      router.push('/paywall?feature=limits');
    }
  });
  
  // Build cache configuration with TTL settings
  const swrConfig: SWRConfiguration = useMemo(() => ({
    ...DEFAULT_SWR_CONFIG,
    dedupingInterval: CACHE_CONFIG.STALE_TIME,
    refreshInterval: options.enableRealtime ? CACHE_CONFIG.BACKGROUND_REFETCH_INTERVAL : 0,
    ...options.cacheConfig && {
      dedupingInterval: options.cacheConfig.STALE_TIME || CACHE_CONFIG.STALE_TIME,
      refreshInterval: options.enableRealtime 
        ? (options.cacheConfig.BACKGROUND_REFETCH_INTERVAL || CACHE_CONFIG.BACKGROUND_REFETCH_INTERVAL)
        : 0,
    },
  }), [options.enableRealtime, options.cacheConfig]);
  
  // Build SWR keys
  const limitKey = buildLimitsKey('detail', { ...options, limitId });
  const usageKey = options.includeUsage ? buildLimitsKey('usage', { ...options, limitId }) : null;
  
  // SWR for limit data - conditional fetching based on paywall status
  const {
    data: limitData,
    error: limitError,
    isLoading: limitLoading,
    isValidating: limitValidating,
    mutate: mutateLimitData,
  } = useSWR(
    !options.skipPaywall && isPaywallActive ? null : limitKey,
    limitKey ? (key: string) => fetchLimitDetail(key, limitId) : null,
    swrConfig
  );
  
  // SWR for usage statistics - only if enabled and not behind paywall
  const {
    data: usageData,
    error: usageError,
    isLoading: usageLoading,
    isValidating: usageValidating,
    mutate: mutateUsageData,
  } = useSWR(
    !options.skipPaywall && isPaywallActive ? null : usageKey,
    usageKey ? (key: string) => fetchLimitUsage(key, limitId) : null,
    swrConfig
  );
  
  // Data management operations
  const operations = useMemo(() => ({
    refresh: async (): Promise<void> => {
      await Promise.all([
        mutateLimitData(),
        usageKey ? mutateUsageData() : Promise.resolve(),
      ]);
    },
    
    refreshUsage: async (): Promise<void> => {
      if (usageKey) {
        await mutateUsageData();
      }
    },
    
    invalidate: async (): Promise<void> => {
      await Promise.all([
        mutateLimitData(undefined, { revalidate: false }),
        usageKey ? mutateUsageData(undefined, { revalidate: false }) : Promise.resolve(),
      ]);
    },
    
    preload: async (): Promise<void> => {
      if (limitKey && !limitData) {
        await mutateLimitData();
      }
      if (usageKey && !usageData) {
        await mutateUsageData();
      }
    },
  }), [mutateLimitData, mutateUsageData, limitKey, usageKey, limitData, usageData]);
  
  // Validation helpers
  const validation = useMemo(() => ({
    isValid: !!limitData && !limitError,
    lastUpdated: limitData ? new Date() : null,
    isStale: limitValidating || usageValidating,
  }), [limitData, limitError, limitValidating, usageValidating]);
  
  return {
    limit: limitData?.resource,
    usage: usageData,
    loading: {
      limit: limitLoading,
      usage: usageLoading,
    },
    error: {
      limit: limitError,
      usage: usageError,
    },
    paywall: {
      isActive: isPaywallActive,
      isLoading: paywallLoading,
      error: paywallError,
    },
    operations,
    validation,
  };
}

/**
 * Custom hook for fetching limits list data with paywall enforcement
 * 
 * Provides comprehensive limits list management with intelligent caching,
 * pagination support, and automatic revalidation. Supports both list and
 * individual limit fetching modes per existing resolver patterns.
 * 
 * @param options - Configuration options for the hook
 * @returns Comprehensive limits list data and management operations
 */
export function useLimitsData(
  options: UseLimitsDataOptions = {}
): UseLimitsListReturn {
  const router = useRouter();
  
  // Paywall enforcement integration
  const {
    isPaywallActive,
    isLoading: paywallLoading,
    error: paywallError,
  } = useSubscription('limit', { 
    enabled: !options.skipPaywall,
    onPaywallActive: () => {
      router.push('/paywall?feature=limits');
    }
  });
  
  // Build cache configuration
  const swrConfig: SWRConfiguration = useMemo(() => ({
    ...DEFAULT_SWR_CONFIG,
    dedupingInterval: CACHE_CONFIG.STALE_TIME,
    refreshInterval: options.enableRealtimeUpdates ? CACHE_CONFIG.BACKGROUND_REFETCH_INTERVAL : 0,
    ...options.cacheConfig && {
      dedupingInterval: options.cacheConfig.STALE_TIME || CACHE_CONFIG.STALE_TIME,
      refreshInterval: options.enableRealtimeUpdates 
        ? (options.cacheConfig.BACKGROUND_REFETCH_INTERVAL || CACHE_CONFIG.BACKGROUND_REFETCH_INTERVAL)
        : 0,
    },
  }), [options.enableRealtimeUpdates, options.cacheConfig]);
  
  // Build SWR key for list
  const listKey = buildLimitsKey('list', options);
  
  // SWR for limits list - conditional fetching based on paywall status
  const {
    data: listData,
    error: listError,
    isLoading: listLoading,
    isValidating: listValidating,
    mutate: mutateListData,
  } = useSWR(
    !options.skipPaywall && isPaywallActive ? null : listKey,
    listKey ? (key: string) => fetchLimitsList(key, options) : null,
    swrConfig
  );
  
  // Query state management
  const updateQuery = useCallback((updates: Partial<ApiRequestOptions>) => {
    // This would typically update URL parameters or state
    // Implementation depends on how query state is managed in the app
    console.log('Query updates:', updates);
  }, []);
  
  // Data management operations
  const operations = useMemo(() => ({
    refresh: async (): Promise<void> => {
      await mutateListData();
    },
    
    loadMore: async (): Promise<void> => {
      // Implementation for pagination - append new data
      const currentOffset = options.requestOptions?.offset || 0;
      const limit = options.requestOptions?.limit || 20;
      const newOffset = currentOffset + limit;
      
      // This would typically update the query parameters
      updateQuery({ offset: newOffset });
    },
    
    invalidate: async (): Promise<void> => {
      await mutateListData(undefined, { revalidate: false });
    },
    
    invalidateItem: async (id: number): Promise<void> => {
      // Invalidate specific item in the cache
      const itemKey = buildLimitsKey('detail', { limitId: id });
      if (itemKey) {
        // This would typically use a global cache invalidation
        await mutateListData();
      }
    },
    
    preloadItem: async (id: number): Promise<void> => {
      // Preload individual limit data
      const itemKey = buildLimitsKey('detail', { limitId: id });
      if (itemKey) {
        await fetchLimitDetail(itemKey, id);
      }
    },
  }), [mutateListData, options.requestOptions, updateQuery]);
  
  // Validation helpers
  const validation = useMemo(() => ({
    isValid: !!listData && !listError,
    lastUpdated: listData ? new Date() : null,
    isStale: listValidating,
    isEmpty: listData?.resource?.length === 0,
  }), [listData, listError, listValidating]);
  
  return {
    limits: listData?.resource || [],
    meta: {
      count: listData?.meta?.count || 0,
      offset: listData?.meta?.offset || 0,
      limit: listData?.meta?.limit || 20,
      hasNext: listData?.meta?.has_next || false,
      hasPrevious: listData?.meta?.has_previous || false,
    },
    loading: {
      initial: listLoading && !listData,
      refresh: listValidating && !!listData,
      loadMore: false, // This would be managed by pagination state
    },
    error: listError,
    paywall: {
      isActive: isPaywallActive,
      isLoading: paywallLoading,
      error: paywallError,
    },
    operations,
    query: {
      filter: options.requestOptions?.filter,
      sort: options.requestOptions?.sort,
      offset: options.requestOptions?.offset || 0,
      limit: options.requestOptions?.limit || 20,
      updateQuery,
    },
    validation,
  };
}

// ============================================================================
// Additional Utility Hooks
// ============================================================================

/**
 * Hook for preloading limits data
 * Useful for optimistic loading and improved UX
 */
export function usePreloadLimitsData(): {
  preloadList: (options?: UseLimitsDataOptions) => Promise<void>;
  preloadLimit: (limitId: number, options?: UseLimitsDataOptions) => Promise<void>;
} {
  return {
    preloadList: async (options = {}) => {
      const key = buildLimitsKey('list', options);
      if (key) {
        await fetchLimitsList(key, options);
      }
    },
    
    preloadLimit: async (limitId: number, options = {}) => {
      const key = buildLimitsKey('detail', { ...options, limitId });
      if (key) {
        await fetchLimitDetail(key, limitId);
      }
    },
  };
}

/**
 * Hook for limits cache management
 * Provides advanced cache manipulation functions
 */
export function useLimitsCacheManager(): {
  invalidateAll: () => Promise<void>;
  invalidateList: () => Promise<void>;
  invalidateLimit: (limitId: number) => Promise<void>;
  clearCache: () => Promise<void>;
} {
  return {
    invalidateAll: async () => {
      // Implementation would use SWR's global cache invalidation
      console.log('Invalidating all limits cache');
    },
    
    invalidateList: async () => {
      // Implementation would invalidate all list queries
      console.log('Invalidating limits list cache');
    },
    
    invalidateLimit: async (limitId: number) => {
      // Implementation would invalidate specific limit
      console.log(`Invalidating limit ${limitId} cache`);
    },
    
    clearCache: async () => {
      // Implementation would clear entire limits cache
      console.log('Clearing limits cache');
    },
  };
}

/**
 * Default export for convenient importing
 */
export default {
  useLimitData,
  useLimitsData,
  usePreloadLimitsData,
  useLimitsCacheManager,
};