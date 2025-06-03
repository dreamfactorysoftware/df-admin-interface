/**
 * React Query-based CORS Configuration Hooks
 * 
 * Replaces Angular corsConfigResolver with React Query useQuery hooks providing
 * intelligent caching and conditional parameter handling for CORS configuration
 * data fetching. Supports both list fetching (useCorsConfigs) and individual
 * CORS configuration fetching (useCorsConfig) with advanced cache management
 * and background synchronization.
 * 
 * Features:
 * - Cache hit responses under 50ms per React/Next.js Integration Requirements
 * - TanStack React Query 5.0.0 for complex conditional server-state management
 * - TTL configuration (staleTime: 300s, cacheTime: 900s) with automatic background revalidation
 * - Conditional queries based on optional ID parameter
 * - Maintains backend API compatibility with includeCount: true for list requests
 * 
 * @author DreamFactory Admin Interface Team
 * @version React 19/Next.js 15.1 Migration
 */

import { useQuery, UseQueryResult } from '@tanstack/react-query';
import { apiClient } from '../../../lib/api-client';
import { GenericListResponse } from '../../../types/generic-http';
import { CorsConfigData } from '../../../types/config';

// =============================================================================
// QUERY KEYS AND CACHE CONFIGURATION
// =============================================================================

/**
 * Query key factory for CORS configuration queries
 * Provides centralized key management for cache invalidation and dependency tracking
 */
export const corsConfigKeys = {
  /** Base key for all CORS configuration queries */
  all: ['cors-config'] as const,
  
  /** Key for CORS configuration list queries */
  lists: () => [...corsConfigKeys.all, 'list'] as const,
  
  /** Key for CORS configuration list with includeCount parameter */
  list: (includeCount = true) => [...corsConfigKeys.lists(), { includeCount }] as const,
  
  /** Key for individual CORS configuration detail queries */
  details: () => [...corsConfigKeys.all, 'detail'] as const,
  
  /** Key for specific CORS configuration by ID */
  detail: (id: string | number) => [...corsConfigKeys.details(), id] as const,
};

/**
 * Cache configuration constants per React/Next.js Integration Requirements
 * - staleTime: 300s (5 minutes) - data considered fresh
 * - gcTime: 900s (15 minutes) - cache retention time
 * - Enables background revalidation for optimal UX
 */
const CACHE_CONFIG = {
  staleTime: 5 * 60 * 1000, // 300 seconds
  gcTime: 15 * 60 * 1000,   // 900 seconds (React Query 5.0 uses gcTime instead of cacheTime)
  refetchOnWindowFocus: false,
  refetchOnReconnect: true,
  retry: 3,
  retryDelay: (attemptIndex: number) => Math.min(1000 * 2 ** attemptIndex, 30000),
} as const;

// =============================================================================
// API ENDPOINTS AND CONFIGURATION
// =============================================================================

/**
 * CORS configuration API endpoints
 * Maintains compatibility with existing DreamFactory Core API structure
 */
const CORS_API_BASE = '/system/cors';

/**
 * Fetches CORS configuration list from the API
 * @param includeCount - Whether to include total count in response metadata
 * @returns Promise resolving to paginated list of CORS configurations
 */
async function fetchCorsConfigs(includeCount: boolean = true): Promise<GenericListResponse<CorsConfigData>> {
  const params = new URLSearchParams();
  if (includeCount) {
    params.append('include_count', 'true');
  }
  
  const url = `${CORS_API_BASE}${params.toString() ? `?${params.toString()}` : ''}`;
  return apiClient.get(url);
}

/**
 * Fetches individual CORS configuration by ID
 * @param id - CORS configuration identifier
 * @returns Promise resolving to CORS configuration data
 */
async function fetchCorsConfig(id: string | number): Promise<CorsConfigData> {
  return apiClient.get(`${CORS_API_BASE}/${id}`);
}

// =============================================================================
// REACT QUERY HOOKS
// =============================================================================

/**
 * Hook for fetching paginated list of CORS configurations
 * 
 * Provides intelligent caching with sub-50ms cache hit responses and automatic
 * background revalidation. Maintains backend compatibility with includeCount
 * parameter for pagination metadata.
 * 
 * @param options - Query configuration options
 * @param options.includeCount - Include total count in response metadata (default: true)
 * @param options.enabled - Whether to enable the query (default: true)
 * @returns UseQueryResult containing CORS configurations list and metadata
 * 
 * @example
 * ```tsx
 * const { data, isLoading, error } = useCorsConfigs({
 *   includeCount: true,
 *   enabled: true
 * });
 * 
 * if (isLoading) return <LoadingSpinner />;
 * if (error) return <ErrorMessage error={error} />;
 * 
 * return (
 *   <div>
 *     <p>Total: {data?.meta.count}</p>
 *     {data?.resource.map(config => (
 *       <CorsConfigItem key={config.id} config={config} />
 *     ))}
 *   </div>
 * );
 * ```
 */
export function useCorsConfigs(options: {
  includeCount?: boolean;
  enabled?: boolean;
} = {}): UseQueryResult<GenericListResponse<CorsConfigData>, Error> {
  const { includeCount = true, enabled = true } = options;

  return useQuery({
    queryKey: corsConfigKeys.list(includeCount),
    queryFn: () => fetchCorsConfigs(includeCount),
    enabled,
    ...CACHE_CONFIG,
    meta: {
      description: 'Fetch paginated CORS configuration list with intelligent caching',
    },
  });
}

/**
 * Hook for fetching individual CORS configuration by ID
 * 
 * Implements conditional query logic based on ID parameter presence. Provides
 * optimized caching with automatic background synchronization and error handling.
 * Cache hits respond under 50ms per performance requirements.
 * 
 * @param id - CORS configuration identifier (optional)
 * @param options - Query configuration options
 * @param options.enabled - Override query enabled state (default: auto-enabled when ID exists)
 * @returns UseQueryResult containing individual CORS configuration data
 * 
 * @example
 * ```tsx
 * // Conditional fetching based on route parameter
 * const { id } = useParams();
 * const { data, isLoading, error } = useCorsConfig(id);
 * 
 * if (!id) return <CorsConfigList />;
 * if (isLoading) return <LoadingSpinner />;
 * if (error) return <ErrorMessage error={error} />;
 * 
 * return <CorsConfigDetail config={data} />;
 * ```
 * 
 * @example
 * ```tsx
 * // Explicit control with custom enabled state
 * const { data } = useCorsConfig('123', {
 *   enabled: userHasPermission && !!selectedId
 * });
 * ```
 */
export function useCorsConfig(
  id?: string | number | null,
  options: {
    enabled?: boolean;
  } = {}
): UseQueryResult<CorsConfigData, Error> {
  const { enabled } = options;
  
  // Automatically enable query when ID exists, unless explicitly overridden
  const isEnabled = enabled !== undefined ? enabled : Boolean(id);
  
  return useQuery({
    queryKey: corsConfigKeys.detail(id!),
    queryFn: () => fetchCorsConfig(id!),
    enabled: isEnabled && Boolean(id),
    ...CACHE_CONFIG,
    meta: {
      description: `Fetch CORS configuration detail for ID: ${id}`,
    },
  });
}

// =============================================================================
// UTILITY FUNCTIONS AND CACHE MANAGEMENT
// =============================================================================

/**
 * Pre-built query options for common use cases
 * Provides standardized configurations for different scenarios
 */
export const corsConfigQueryOptions = {
  /**
   * Standard list query options with count
   */
  list: (includeCount = true) => ({
    queryKey: corsConfigKeys.list(includeCount),
    queryFn: () => fetchCorsConfigs(includeCount),
    ...CACHE_CONFIG,
  }),

  /**
   * Standard detail query options
   */
  detail: (id: string | number) => ({
    queryKey: corsConfigKeys.detail(id),
    queryFn: () => fetchCorsConfig(id),
    ...CACHE_CONFIG,
  }),

  /**
   * Optimized options for server-side rendering
   * Reduces cache time for SSR scenarios
   */
  ssr: {
    list: (includeCount = true) => ({
      ...corsConfigQueryOptions.list(includeCount),
      staleTime: 60 * 1000, // 1 minute for SSR
      gcTime: 5 * 60 * 1000, // 5 minutes for SSR
    }),
    detail: (id: string | number) => ({
      ...corsConfigQueryOptions.detail(id),
      staleTime: 60 * 1000, // 1 minute for SSR
      gcTime: 5 * 60 * 1000, // 5 minutes for SSR
    }),
  },
} as const;

/**
 * Type definitions for enhanced type safety
 */
export type CorsConfigsQueryResult = UseQueryResult<GenericListResponse<CorsConfigData>, Error>;
export type CorsConfigQueryResult = UseQueryResult<CorsConfigData, Error>;

/**
 * Export query keys for external cache invalidation
 * Useful for mutations and cache management in other components
 */
export { corsConfigKeys as corsConfigQueryKeys };

/**
 * Cache invalidation helpers
 * Provides utilities for manual cache management when needed
 * 
 * @example
 * ```tsx
 * import { useQueryClient } from '@tanstack/react-query';
 * import { corsConfigQueryKeys } from './use-cors-config';
 * 
 * const queryClient = useQueryClient();
 * 
 * // Invalidate all CORS config queries
 * queryClient.invalidateQueries({ queryKey: corsConfigQueryKeys.all });
 * 
 * // Invalidate specific CORS config
 * queryClient.invalidateQueries({ queryKey: corsConfigQueryKeys.detail(id) });
 * ```
 */
export const corsConfigCacheUtils = {
  keys: corsConfigKeys,
  config: CACHE_CONFIG,
} as const;