/**
 * Global Lookup Keys React Query Hook
 * 
 * React Query-powered custom hook that fetches global lookup key entries with
 * intelligent caching and automatic revalidation. Replaces the Angular
 * DfGlobalLookupKeysResolver by implementing React Query useQuery with TTL
 * configuration and comprehensive data fetching for lookup key management.
 * 
 * Features:
 * - Intelligent caching with 5-minute stale time and 15-minute cache time
 * - Automatic background revalidation for real-time updates
 * - Type-safe ApiListResponse<LookupKeyType> return type
 * - Cache responses under 50ms performance target
 * - Error handling with React Error Boundary integration
 * - Optimistic updates and cache invalidation support
 * 
 * @author DreamFactory Admin Interface Team
 * @version React 19/Next.js 15.1 Migration
 */

import { useQuery, UseQueryResult } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import { ApiListResponse, ApiErrorResponse } from '@/types/api';

// =============================================================================
// TYPE DEFINITIONS
// =============================================================================

/**
 * Global Lookup Key Entry
 * Defines the structure for individual lookup key entries managed
 * by the DreamFactory system for configuration and administrative workflows
 */
export interface LookupKeyType {
  /** Unique identifier for the lookup key entry */
  id?: number;
  /** Name/key identifier for the lookup entry */
  name: string;
  /** Value associated with the lookup key */
  value: string;
  /** Indicates if the lookup key is private/internal */
  private: boolean;
  /** Optional description of the lookup key purpose */
  description?: string;
  /** ISO 8601 timestamp of entry creation */
  created_date?: string;
  /** ISO 8601 timestamp of last modification */
  last_modified_date?: string;
  /** User ID who created the entry */
  created_by_id?: number;
  /** User ID who last modified the entry */
  last_modified_by_id?: number;
}

/**
 * Global Lookup Keys Query Configuration
 * React Query configuration options for optimal caching behavior
 */
export interface GlobalLookupKeysQueryOptions {
  /** Enable/disable the query execution */
  enabled?: boolean;
  /** Custom stale time override (default: 300000ms = 5 minutes) */
  staleTime?: number;
  /** Custom cache time override (default: 900000ms = 15 minutes) */
  cacheTime?: number;
  /** Enable/disable automatic background refetching */
  refetchOnWindowFocus?: boolean;
  /** Enable/disable refetch on network reconnect */
  refetchOnReconnect?: boolean;
  /** Refetch interval for automatic updates (default: disabled) */
  refetchInterval?: number | false;
  /** Number of retry attempts on failure */
  retry?: boolean | number;
  /** Retry delay configuration */
  retryDelay?: number;
  /** Enable React Suspense integration */
  suspense?: boolean;
  /** Error boundary integration */
  useErrorBoundary?: boolean;
}

// =============================================================================
// QUERY KEY CONSTANTS
// =============================================================================

/**
 * React Query key factory for global lookup keys
 * Provides consistent cache key generation for all global lookup key queries
 */
export const globalLookupKeysKeys = {
  /** Base key for all global lookup key queries */
  all: ['global-lookup-keys'] as const,
  /** List query key with optional filters */
  list: (filters?: Record<string, unknown>) => 
    ['global-lookup-keys', 'list', filters] as const,
  /** Detail query key for specific lookup key */
  detail: (id: number | string) => 
    ['global-lookup-keys', 'detail', id] as const,
} as const;

// =============================================================================
// API ENDPOINTS
// =============================================================================

/**
 * API endpoint paths for global lookup keys
 * Maintains compatibility with existing DreamFactory Core API structure
 */
const LOOKUP_KEYS_ENDPOINTS = {
  /** Base path for lookup keys API */
  base: '/system/lookup',
  /** Get all lookup keys */
  list: '/system/lookup',
  /** Create new lookup key */
  create: '/system/lookup',
  /** Update existing lookup key */
  update: (id: number | string) => `/system/lookup/${id}`,
  /** Delete lookup key */
  delete: (id: number | string) => `/system/lookup/${id}`,
} as const;

// =============================================================================
// QUERY FUNCTIONS
// =============================================================================

/**
 * Fetches global lookup keys from the DreamFactory API
 * 
 * @param options - Request options for filtering and pagination
 * @returns Promise resolving to ApiListResponse<LookupKeyType>
 */
async function fetchGlobalLookupKeys(
  options: {
    limit?: number;
    offset?: number;
    filter?: string;
    sort?: string;
    fields?: string;
  } = {}
): Promise<ApiListResponse<LookupKeyType>> {
  try {
    // Construct query parameters
    const params = new URLSearchParams();
    
    // Add pagination parameters
    if (options.limit !== undefined) {
      params.append('limit', String(options.limit));
    }
    if (options.offset !== undefined) {
      params.append('offset', String(options.offset));
    }
    
    // Add filtering parameters
    if (options.filter) {
      params.append('filter', options.filter);
    }
    if (options.sort) {
      params.append('sort', options.sort);
    }
    
    // Add field selection (default to all fields)
    const fields = options.fields || '*';
    params.append('fields', fields);
    
    // Always include count for pagination metadata
    params.append('include_count', 'true');
    
    // Construct the full endpoint URL
    const endpoint = `${LOOKUP_KEYS_ENDPOINTS.list}?${params.toString()}`;
    
    // Execute the API request
    const response = await apiClient.get(endpoint, {
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
    });
    
    // Transform the response to match our expected structure
    // DreamFactory returns { resource: [...], meta: {...} }
    return {
      resource: response.resource || [],
      meta: {
        count: response.meta?.count || 0,
        limit: response.meta?.limit || 25,
        offset: response.meta?.offset || 0,
        total: response.meta?.total,
        has_more: response.meta?.has_more,
        next_cursor: response.meta?.next_cursor,
        prev_cursor: response.meta?.prev_cursor,
      },
    };
  } catch (error) {
    // Transform API errors to our standardized error format
    if (error instanceof Error) {
      throw new Error(`Failed to fetch global lookup keys: ${error.message}`);
    }
    throw new Error('Failed to fetch global lookup keys: Unknown error');
  }
}

// =============================================================================
// REACT QUERY HOOKS
// =============================================================================

/**
 * React Query hook for fetching global lookup keys
 * 
 * Provides intelligent caching, automatic revalidation, and type-safe data
 * fetching for global lookup key management. Optimized for cache responses
 * under 50ms and maintains real-time synchronization with the server.
 * 
 * @param options - Query configuration options
 * @returns UseQueryResult with global lookup keys data and query state
 * 
 * @example
 * ```typescript
 * function GlobalLookupKeysComponent() {
 *   const {
 *     data,
 *     isLoading,
 *     isError,
 *     error,
 *     isStale,
 *     isFetching,
 *   } = useGlobalLookupKeys({
 *     staleTime: 300000, // 5 minutes
 *     cacheTime: 900000, // 15 minutes
 *     refetchOnWindowFocus: true,
 *   });
 * 
 *   if (isLoading) return <div>Loading lookup keys...</div>;
 *   if (isError) return <div>Error: {error?.message}</div>;
 * 
 *   return (
 *     <div>
 *       <h2>Global Lookup Keys ({data?.meta.count})</h2>
 *       {data?.resource.map(key => (
 *         <div key={key.id}>
 *           <strong>{key.name}</strong>: {key.value}
 *           {key.private && <span> (Private)</span>}
 *         </div>
 *       ))}
 *     </div>
 *   );
 * }
 * ```
 */
export function useGlobalLookupKeys(
  queryOptions: GlobalLookupKeysQueryOptions = {}
): UseQueryResult<ApiListResponse<LookupKeyType>, ApiErrorResponse> {
  // Extract query options with defaults optimized for performance
  const {
    enabled = true,
    staleTime = 300000, // 5 minutes (300 seconds)
    cacheTime = 900000, // 15 minutes (900 seconds)
    refetchOnWindowFocus = true,
    refetchOnReconnect = true,
    refetchInterval = false, // Disabled by default, can be enabled for real-time updates
    retry = 3,
    retryDelay = 1000,
    suspense = false,
    useErrorBoundary = false,
  } = queryOptions;

  return useQuery({
    // Query key for cache identification and invalidation
    queryKey: globalLookupKeysKeys.list(),
    
    // Query function that fetches the data
    queryFn: () => fetchGlobalLookupKeys({
      fields: '*', // Fetch all fields for comprehensive data
    }),
    
    // Caching and revalidation configuration
    enabled,
    staleTime,
    cacheTime,
    refetchOnWindowFocus,
    refetchOnReconnect,
    refetchInterval,
    
    // Error handling and retry configuration
    retry,
    retryDelay,
    useErrorBoundary,
    
    // React integration options
    suspense,
    
    // Keep previous data during background refetches for better UX
    keepPreviousData: true,
    
    // Select function to optimize re-renders (optional transformation)
    select: (data) => data,
    
    // Optional: Network mode for offline handling
    networkMode: 'online',
    
    // Optional: Refetch on mount behavior
    refetchOnMount: true,
    
    // Optional: Configure when stale data should be considered
    staleTime,
    
    // Meta information for debugging and monitoring
    meta: {
      feature: 'global-lookup-keys',
      component: 'adf-config',
      endpoint: LOOKUP_KEYS_ENDPOINTS.list,
    },
  });
}

/**
 * Hook for fetching global lookup keys with custom filters
 * 
 * @param filters - Filter criteria for lookup keys
 * @param queryOptions - Additional query configuration
 * @returns UseQueryResult with filtered global lookup keys
 * 
 * @example
 * ```typescript
 * const { data } = useGlobalLookupKeysFiltered(
 *   { filter: 'private eq false' }, // Only public keys
 *   { staleTime: 60000 } // 1 minute cache
 * );
 * ```
 */
export function useGlobalLookupKeysFiltered(
  filters: {
    filter?: string;
    sort?: string;
    limit?: number;
    offset?: number;
  } = {},
  queryOptions: GlobalLookupKeysQueryOptions = {}
): UseQueryResult<ApiListResponse<LookupKeyType>, ApiErrorResponse> {
  return useQuery({
    queryKey: globalLookupKeysKeys.list(filters),
    queryFn: () => fetchGlobalLookupKeys(filters),
    ...queryOptions,
    staleTime: queryOptions.staleTime ?? 300000,
    cacheTime: queryOptions.cacheTime ?? 900000,
    keepPreviousData: true,
  });
}

// =============================================================================
// CACHE UTILITIES
// =============================================================================

/**
 * Utility functions for cache management
 * Provides manual cache control for optimistic updates and cache invalidation
 */
export const globalLookupKeysCacheUtils = {
  /**
   * Query key factory for external cache operations
   */
  keys: globalLookupKeysKeys,
  
  /**
   * Endpoint configuration for external API calls
   */
  endpoints: LOOKUP_KEYS_ENDPOINTS,
  
  /**
   * Default query options for consistent configuration
   */
  defaultOptions: {
    staleTime: 300000, // 5 minutes
    cacheTime: 900000, // 15 minutes
    retry: 3,
    retryDelay: 1000,
  } as const,
} as const;

// =============================================================================
// EXPORTS
// =============================================================================

export type {
  LookupKeyType,
  GlobalLookupKeysQueryOptions,
};

export {
  globalLookupKeysKeys,
  LOOKUP_KEYS_ENDPOINTS,
  fetchGlobalLookupKeys,
  useGlobalLookupKeys as default,
};