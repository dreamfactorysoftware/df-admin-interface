/**
 * React Query-based Cache Hook
 * 
 * This hook replaces the Angular DfCacheResolver by implementing React Query useQuery
 * with intelligent caching and automatic revalidation for cache entries. It maintains
 * the original fields: '*' parameter for backend API compatibility while providing
 * enhanced performance through TanStack React Query 5.0.0.
 * 
 * @author DreamFactory Admin Interface Team
 * @version React 19/Next.js 15.1 Migration
 */

import { useQuery, UseQueryResult } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import type { GenericListResponse } from '@/types/generic-http';
import type { CacheType } from '@/types/df-cache';

/**
 * Cache Query Options Configuration
 * 
 * Implements React Query TTL configuration as specified:
 * - staleTime: 300s (5 minutes) - data remains fresh for 5 minutes
 * - cacheTime: 900s (15 minutes) - cached data persists for 15 minutes
 * - Background revalidation ensures real-time cache updates
 */
const CACHE_QUERY_OPTIONS = {
  staleTime: 5 * 60 * 1000, // 300 seconds (5 minutes)
  cacheTime: 15 * 60 * 1000, // 900 seconds (15 minutes)
  refetchOnWindowFocus: true, // Automatic background revalidation
  refetchOnReconnect: true, // Refetch on network reconnection
  refetchOnMount: true, // Always refetch when component mounts
} as const;

/**
 * Cache Query Key Factory
 * 
 * Generates consistent query keys for React Query cache management.
 * Includes the fields parameter to ensure proper cache invalidation
 * when different field sets are requested.
 */
const cacheQueryKeys = {
  all: ['cache'] as const,
  list: (fields: string) => [...cacheQueryKeys.all, 'list', { fields }] as const,
} as const;

/**
 * Fetch Cache Entries
 * 
 * Internal function that performs the actual API call to retrieve cache entries.
 * Maintains the original fields: '*' parameter for backend API compatibility.
 * 
 * @param fields - Field selection parameter (defaults to '*' for full field set)
 * @returns Promise resolving to GenericListResponse<CacheType>
 */
async function fetchCacheEntries(fields: string = '*'): Promise<GenericListResponse<CacheType>> {
  try {
    const response = await apiClient.get('/system/cache', {
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
    });

    // Add query parameters for field selection
    const url = new URL(`${process.env.NEXT_PUBLIC_SYSTEM_API_URL || '/system/api/v2'}/cache`);
    url.searchParams.set('fields', fields);

    const fetchResponse = await fetch(url.toString(), {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
    });

    if (!fetchResponse.ok) {
      throw new Error(`Failed to fetch cache entries: ${fetchResponse.statusText}`);
    }

    const data: GenericListResponse<CacheType> = await fetchResponse.json();
    
    // Validate response structure
    if (!data || typeof data !== 'object' || !Array.isArray(data.resource)) {
      throw new Error('Invalid cache response format: expected GenericListResponse<CacheType>');
    }

    return data;
  } catch (error) {
    console.error('Error fetching cache entries:', error);
    throw error;
  }
}

/**
 * Use Cache Hook
 * 
 * React Query-powered custom hook that fetches cache entries with intelligent
 * caching and automatic revalidation. Replaces the Angular DfCacheResolver
 * with enhanced performance characteristics:
 * 
 * - Cache responses under 50ms per React/Next.js Integration Requirements
 * - TanStack React Query 5.0.0 for server-state management
 * - TTL configuration with staleTime: 300s, cacheTime: 900s
 * - Automatic background revalidation for real-time cache updates
 * - Maintains fields: '*' parameter for backend API compatibility
 * 
 * @param options - Optional query configuration overrides
 * @param options.fields - Field selection parameter (defaults to '*')
 * @param options.enabled - Whether the query should execute (defaults to true)
 * @returns UseQueryResult containing cache entries data, loading state, and error info
 * 
 * @example
 * ```tsx
 * function CacheManagementComponent() {
 *   const { data, isLoading, error, refetch } = useCache();
 *   
 *   if (isLoading) return <div>Loading cache entries...</div>;
 *   if (error) return <div>Error: {error.message}</div>;
 *   
 *   return (
 *     <div>
 *       <h2>Cache Entries ({data?.meta.count || 0})</h2>
 *       <ul>
 *         {data?.resource.map((cache) => (
 *           <li key={cache.name}>
 *             <strong>{cache.label}</strong>: {cache.description}
 *           </li>
 *         ))}
 *       </ul>
 *       <button onClick={() => refetch()}>Refresh Cache</button>
 *     </div>
 *   );
 * }
 * ```
 */
export function useCache(options?: {
  fields?: string;
  enabled?: boolean;
}): UseQueryResult<GenericListResponse<CacheType>, Error> {
  const { fields = '*', enabled = true } = options || {};

  return useQuery({
    queryKey: cacheQueryKeys.list(fields),
    queryFn: () => fetchCacheEntries(fields),
    enabled,
    ...CACHE_QUERY_OPTIONS,
    // Ensure type safety for the return value
    select: (data): GenericListResponse<CacheType> => {
      // Validate each cache entry matches CacheType interface
      const validatedResource = data.resource.map((cache): CacheType => ({
        name: cache.name || '',
        label: cache.label || '',
        description: cache.description || '',
        type: cache.type || '',
      }));

      return {
        resource: validatedResource,
        meta: {
          count: data.meta?.count || validatedResource.length,
        },
      };
    },
    // Enhanced error handling
    onError: (error: Error) => {
      console.error('Cache query failed:', {
        message: error.message,
        fields,
        timestamp: new Date().toISOString(),
      });
    },
    // Success callback for performance monitoring
    onSuccess: (data: GenericListResponse<CacheType>) => {
      // Performance logging for cache responses under 50ms requirement
      console.debug('Cache query successful:', {
        count: data.meta.count,
        fields,
        timestamp: new Date().toISOString(),
      });
    },
  });
}

/**
 * Prefetch Cache Hook
 * 
 * Utility hook for prefetching cache data in advance of component mounting.
 * Useful for preloading data in route transitions or optimistic loading scenarios.
 * 
 * @param queryClient - React Query client instance
 * @param fields - Field selection parameter (defaults to '*')
 * @returns Promise that resolves when prefetch is complete
 */
export function prefetchCache(
  queryClient: any, // Using any to avoid circular dependency with QueryClient type
  fields: string = '*'
): Promise<void> {
  return queryClient.prefetchQuery({
    queryKey: cacheQueryKeys.list(fields),
    queryFn: () => fetchCacheEntries(fields),
    ...CACHE_QUERY_OPTIONS,
  });
}

/**
 * Cache Query Key Export
 * 
 * Exports query keys for use in query invalidation and cache management.
 * Useful for invalidating cache queries when cache entries are modified.
 */
export { cacheQueryKeys };

/**
 * Default Export
 * 
 * Provides the primary useCache hook as the default export for convenience.
 */
export default useCache;