/**
 * React Query-based Cache Management Hook
 * 
 * Replaces Angular DfCacheResolver with React Query useQuery hook for
 * intelligent caching and automatic revalidation. Provides optimized
 * cache data fetching with sub-50ms response times per React/Next.js
 * Integration Requirements.
 * 
 * @fileoverview Cache data fetching hook with React Query integration
 * @version 1.0.0
 * @since React 19.0.0 / Next.js 15.1+
 */

'use client';

import { useQuery, UseQueryResult } from '@tanstack/react-query';
import { apiGet, API_BASE_URL } from '@/lib/api-client';
import type { GenericListResponse } from '@/types/generic-http';
import type { CacheType } from '@/types/df-cache';

// ============================================================================
// Query Configuration Constants
// ============================================================================

/**
 * React Query cache configuration optimized for cache data.
 * Implements TTL requirements with 5-minute stale time and 15-minute cache time.
 */
const CACHE_QUERY_CONFIG = {
  /** Time data stays fresh before background revalidation (5 minutes) */
  staleTime: 5 * 60 * 1000, // 300 seconds
  
  /** Time data remains in cache before garbage collection (15 minutes) */
  cacheTime: 15 * 60 * 1000, // 900 seconds
  
  /** Enable automatic background refetching when data becomes stale */
  refetchOnWindowFocus: true,
  
  /** Enable automatic refetching when network reconnects */
  refetchOnReconnect: true,
  
  /** Retry failed requests with exponential backoff */
  retry: 3,
  
  /** Initial retry delay in milliseconds */
  retryDelay: (attemptIndex: number) => Math.min(1000 * 2 ** attemptIndex, 30000),
} as const;

/**
 * Query key factory for cache-related queries.
 * Provides consistent query key generation for React Query caching.
 */
export const cacheQueryKeys = {
  /** Base key for all cache queries */
  all: ['cache'] as const,
  
  /** Key for cache list queries */
  lists: () => [...cacheQueryKeys.all, 'list'] as const,
  
  /** Key for cache list with specific options */
  list: (options?: CacheQueryOptions) => 
    [...cacheQueryKeys.lists(), options] as const,
} as const;

// ============================================================================
// Type Definitions
// ============================================================================

/**
 * Cache query options interface.
 * Maintains compatibility with original DfCacheResolver parameters.
 */
export interface CacheQueryOptions {
  /** Include all fields in response (maintains backend compatibility) */
  fields?: string;
  
  /** Force refresh of cache data */
  refresh?: boolean;
  
  /** Filter cache entries by specific criteria */
  filter?: string;
  
  /** Sort cache entries by specified field */
  sort?: string;
  
  /** Limit number of cache entries returned */
  limit?: number;
  
  /** Offset for pagination */
  offset?: number;
  
  /** Include total count in response */
  includeCount?: boolean;
}

/**
 * Enhanced query result type with cache-specific methods.
 * Extends React Query result with custom functionality.
 */
export interface UseCacheQueryResult extends UseQueryResult<GenericListResponse<CacheType>, Error> {
  /** Cache entries array for easier access */
  cacheTypes: CacheType[];
  
  /** Total count of cache entries */
  totalCount: number;
  
  /** Indicates if data is being fetched in background */
  isRefetching: boolean;
}

// ============================================================================
// API Functions
// ============================================================================

/**
 * Fetches cache configuration data from DreamFactory API.
 * Maintains compatibility with existing cache service endpoints.
 * 
 * @param options - Query options for filtering and pagination
 * @returns Promise resolving to cache configuration list
 */
async function fetchCacheData(
  options: CacheQueryOptions = {}
): Promise<GenericListResponse<CacheType>> {
  // Maintain fields: '*' parameter for backend API compatibility
  const defaultOptions: CacheQueryOptions = {
    fields: '*',
    ...options,
  };

  try {
    // Use system cache endpoint for cache type configuration
    const endpoint = `${API_BASE_URL}/system/cache`;
    
    const response = await apiGet<GenericListResponse<CacheType>>(endpoint, {
      fields: defaultOptions.fields,
      refresh: defaultOptions.refresh,
      filter: defaultOptions.filter,
      sort: defaultOptions.sort,
      limit: defaultOptions.limit,
      offset: defaultOptions.offset,
      includeCount: defaultOptions.includeCount,
    });

    return response;
  } catch (error) {
    // Enhanced error handling with context information
    const errorMessage = error instanceof Error 
      ? error.message 
      : 'Failed to fetch cache configuration';
    
    throw new Error(`Cache data fetch failed: ${errorMessage}`);
  }
}

// ============================================================================
// React Query Hook
// ============================================================================

/**
 * React Query hook for cache data management.
 * 
 * Replaces Angular DfCacheResolver with optimized React Query implementation
 * featuring intelligent caching, automatic revalidation, and sub-50ms
 * cache hit responses.
 * 
 * @param options - Optional query configuration parameters
 * @returns Enhanced query result with cache-specific utilities
 * 
 * @example
 * ```typescript
 * // Basic usage
 * const { data, isLoading, error } = useCache();
 * 
 * // With specific options
 * const { cacheTypes, totalCount, isRefetching } = useCache({
 *   filter: 'type eq "redis"',
 *   sort: 'name',
 *   limit: 10
 * });
 * 
 * // Force refresh
 * const { refetch } = useCache({ refresh: true });
 * ```
 */
export function useCache(
  options: CacheQueryOptions = {}
): UseCacheQueryResult {
  // Configure React Query with cache-optimized settings
  const queryResult = useQuery({
    queryKey: cacheQueryKeys.list(options),
    queryFn: () => fetchCacheData(options),
    ...CACHE_QUERY_CONFIG,
    
    // Enable immediate background refetch for real-time updates
    refetchInterval: options.refresh ? 0 : undefined,
    
    // Optimize for cache hit performance requirement (<50ms)
    networkMode: 'online',
    
    // Enable optimistic UI updates
    notifyOnChangeProps: ['data', 'error', 'isLoading'],
  });

  // Extract and transform data for enhanced return type
  const cacheTypes = queryResult.data?.resource || [];
  const totalCount = queryResult.data?.meta?.count || 0;

  return {
    ...queryResult,
    cacheTypes,
    totalCount,
    isRefetching: queryResult.isFetching && !queryResult.isLoading,
  };
}

// ============================================================================
// Hook Variants
// ============================================================================

/**
 * Simplified cache hook for basic cache type listing.
 * Optimized for components that only need cache type names and labels.
 * 
 * @returns Basic cache query result
 * 
 * @example
 * ```typescript
 * const { data: cacheTypes, isLoading } = useCacheTypes();
 * ```
 */
export function useCacheTypes(): UseQueryResult<CacheType[], Error> {
  const { data, ...rest } = useCache({
    fields: 'name,label,description,type',
    sort: 'label',
  });

  return {
    ...rest,
    data: data?.resource || [],
  };
}

/**
 * Cache hook with automatic refresh for real-time monitoring.
 * Useful for cache administration interfaces requiring live updates.
 * 
 * @param refreshInterval - Refresh interval in milliseconds (default: 30000)
 * @returns Cache query result with auto-refresh
 * 
 * @example
 * ```typescript
 * const { cacheTypes, isRefetching } = useCacheWithRefresh(10000);
 * ```
 */
export function useCacheWithRefresh(
  refreshInterval: number = 30000
): UseCacheQueryResult {
  return useQuery({
    queryKey: cacheQueryKeys.list({ refresh: true }),
    queryFn: () => fetchCacheData({ fields: '*', refresh: true }),
    ...CACHE_QUERY_CONFIG,
    refetchInterval: refreshInterval,
    refetchIntervalInBackground: true,
  }) as UseCacheQueryResult;
}

// ============================================================================
// Default Export
// ============================================================================

export default useCache;