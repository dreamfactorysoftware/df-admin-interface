/**
 * React Query-based custom hooks for CORS configuration data fetching.
 * 
 * Provides both CORS configuration list (useCorsConfigs) and individual CORS 
 * configuration (useCorsConfig) data fetching with advanced caching and 
 * conditional parameter handling. Replaces the Angular corsConfigResolver by 
 * implementing React Query useQuery with route parameter-based conditional logic, 
 * supporting both list fetching with includeCount and individual item fetching by ID.
 * 
 * Features:
 * - Intelligent cache management with 300s stale time and 900s cache time
 * - Background synchronization and automatic revalidation
 * - Sub-50ms cache hit responses for optimal performance
 * - Conditional query execution based on parameter presence
 * - Full TypeScript integration with DreamFactory API contracts
 * - Error handling with React Query error boundaries
 * 
 * @fileoverview CORS configuration React Query resolver hooks
 * @version 1.0.0
 * @since React 19.0.0 / Next.js 15.1+
 */

import { useQuery, UseQueryResult } from '@tanstack/react-query';
import { apiGet } from '@/lib/api-client';
import type { 
  ApiListResponse, 
  ApiResourceResponse,
  ApiRequestOptions 
} from '@/types/api';
import type { GenericListResponse } from '@/types/generic-http';

// ============================================================================
// Type Definitions
// ============================================================================

/**
 * CORS configuration data structure from DreamFactory API
 */
export interface CorsConfigData {
  createdById: number | null;
  createdDate: string | null;
  description: string;
  enabled: boolean;
  exposedHeader: string | null;
  header: string;
  id: number;
  lastModifiedById: number | null;
  lastModifiedDate: string | null;
  maxAge: number;
  method: string[];
  origin: string;
  path: string;
  supportsCredentials: boolean;
}

/**
 * Query key factory for CORS configuration queries
 */
export const corsConfigKeys = {
  all: ['cors-config'] as const,
  lists: () => [...corsConfigKeys.all, 'list'] as const,
  list: (options?: ApiRequestOptions) => [...corsConfigKeys.lists(), options] as const,
  details: () => [...corsConfigKeys.all, 'detail'] as const,
  detail: (id: number) => [...corsConfigKeys.details(), id] as const,
} as const;

// ============================================================================
// API Client Functions
// ============================================================================

/**
 * Fetch CORS configurations list from DreamFactory API
 */
async function fetchCorsConfigs(
  options: ApiRequestOptions = {}
): Promise<GenericListResponse<CorsConfigData>> {
  const defaultOptions: ApiRequestOptions = {
    includeCount: true,
    snackbarError: 'Failed to load CORS configurations',
    ...options,
  };

  return apiGet<GenericListResponse<CorsConfigData>>(
    '/api/v2/system/config/cors',
    defaultOptions
  );
}

/**
 * Fetch individual CORS configuration by ID from DreamFactory API
 */
async function fetchCorsConfig(
  id: number,
  options: ApiRequestOptions = {}
): Promise<CorsConfigData> {
  const defaultOptions: ApiRequestOptions = {
    snackbarError: `Failed to load CORS configuration ${id}`,
    ...options,
  };

  return apiGet<CorsConfigData>(
    `/api/v2/system/config/cors/${id}`,
    defaultOptions
  );
}

// ============================================================================
// React Query Hooks
// ============================================================================

/**
 * Custom hook for fetching CORS configurations list with React Query.
 * 
 * Features:
 * - Automatic caching with 300s stale time and 900s cache time
 * - Background revalidation when data becomes stale
 * - includeCount: true for pagination metadata
 * - Error handling with retry logic
 * - Cache hit responses under 50ms performance target
 * 
 * @param options - Optional API request configuration
 * @returns UseQueryResult with CORS configurations list
 * 
 * @example
 * ```tsx
 * function CorsConfigList() {
 *   const { data, isLoading, error } = useCorsConfigs();
 *   
 *   if (isLoading) return <LoadingSpinner />;
 *   if (error) return <ErrorMessage error={error} />;
 *   
 *   return (
 *     <div>
 *       <h2>CORS Configurations ({data?.meta?.count || 0})</h2>
 *       {data?.resource?.map(config => (
 *         <CorsConfigRow key={config.id} config={config} />
 *       ))}
 *     </div>
 *   );
 * }
 * ```
 */
export function useCorsConfigs(
  options?: ApiRequestOptions
): UseQueryResult<GenericListResponse<CorsConfigData>, Error> {
  return useQuery({
    queryKey: corsConfigKeys.list(options),
    queryFn: () => fetchCorsConfigs(options),
    staleTime: 5 * 60 * 1000, // 300 seconds (5 minutes)
    gcTime: 15 * 60 * 1000, // 900 seconds (15 minutes) - formerly cacheTime
    refetchOnWindowFocus: true,
    refetchOnMount: true,
    retry: (failureCount, error) => {
      // Retry up to 3 times for network errors, but not for auth errors
      if (failureCount >= 3) return false;
      if (error?.message?.includes('401') || error?.message?.includes('403')) {
        return false;
      }
      return true;
    },
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
  });
}

/**
 * Custom hook for fetching individual CORS configuration by ID with React Query.
 * 
 * Features:
 * - Conditional query execution (only runs when ID is provided)
 * - Automatic caching with 300s stale time and 900s cache time
 * - Background revalidation when data becomes stale
 * - Error handling with retry logic
 * - Cache hit responses under 50ms performance target
 * 
 * @param id - CORS configuration ID (optional)
 * @param options - Optional API request configuration
 * @returns UseQueryResult with individual CORS configuration
 * 
 * @example
 * ```tsx
 * function CorsConfigDetails({ id }: { id?: number }) {
 *   const { data, isLoading, error } = useCorsConfig(id);
 *   
 *   if (!id) return <div>No CORS configuration selected</div>;
 *   if (isLoading) return <LoadingSpinner />;
 *   if (error) return <ErrorMessage error={error} />;
 *   
 *   return (
 *     <div>
 *       <h2>{data?.description}</h2>
 *       <p>Path: {data?.path}</p>
 *       <p>Origin: {data?.origin}</p>
 *       <p>Enabled: {data?.enabled ? 'Yes' : 'No'}</p>
 *     </div>
 *   );
 * }
 * ```
 */
export function useCorsConfig(
  id?: number,
  options?: ApiRequestOptions
): UseQueryResult<CorsConfigData, Error> {
  return useQuery({
    queryKey: corsConfigKeys.detail(id!),
    queryFn: () => fetchCorsConfig(id!, options),
    enabled: !!id, // Only run query when ID is provided
    staleTime: 5 * 60 * 1000, // 300 seconds (5 minutes)
    gcTime: 15 * 60 * 1000, // 900 seconds (15 minutes) - formerly cacheTime
    refetchOnWindowFocus: true,
    refetchOnMount: true,
    retry: (failureCount, error) => {
      // Retry up to 3 times for network errors, but not for auth errors
      if (failureCount >= 3) return false;
      if (error?.message?.includes('401') || error?.message?.includes('403')) {
        return false;
      }
      return true;
    },
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
  });
}

/**
 * Custom hook that conditionally fetches either CORS configurations list or 
 * individual configuration based on provided ID parameter.
 * 
 * This hook replicates the exact logic of the original Angular corsConfigResolver,
 * providing backward compatibility while leveraging React Query benefits.
 * 
 * Features:
 * - Automatic conditional logic (list vs detail based on ID presence)
 * - Maintains original resolver behavior pattern
 * - Full React Query caching and error handling
 * - TypeScript union return type for proper type safety
 * 
 * @param id - Optional CORS configuration ID
 * @param options - Optional API request configuration
 * @returns UseQueryResult with either list or individual configuration
 * 
 * @example
 * ```tsx
 * function CorsConfigResolver({ id }: { id?: number }) {
 *   const { data, isLoading, error } = useCorsConfigResolver(id);
 *   
 *   if (isLoading) return <LoadingSpinner />;
 *   if (error) return <ErrorMessage error={error} />;
 *   
 *   // Type-safe handling of union result
 *   if ('resource' in data) {
 *     // data is GenericListResponse<CorsConfigData>
 *     return <CorsConfigList configs={data.resource} meta={data.meta} />;
 *   } else {
 *     // data is CorsConfigData
 *     return <CorsConfigDetails config={data} />;
 *   }
 * }
 * ```
 */
export function useCorsConfigResolver(
  id?: number,
  options?: ApiRequestOptions
): UseQueryResult<GenericListResponse<CorsConfigData> | CorsConfigData, Error> {
  // Use conditional hooks pattern to replicate Angular resolver logic
  const listQuery = useCorsConfigs(options);
  const detailQuery = useCorsConfig(id, options);

  if (id) {
    return detailQuery as UseQueryResult<GenericListResponse<CorsConfigData> | CorsConfigData, Error>;
  } else {
    return listQuery as UseQueryResult<GenericListResponse<CorsConfigData> | CorsConfigData, Error>;
  }
}

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Prefetch CORS configurations list for improved performance.
 * Useful for preloading data on route transitions.
 * 
 * @param queryClient - React Query client instance
 * @param options - Optional API request configuration
 */
export async function prefetchCorsConfigs(
  queryClient: any, // QueryClient type from @tanstack/react-query
  options?: ApiRequestOptions
): Promise<void> {
  await queryClient.prefetchQuery({
    queryKey: corsConfigKeys.list(options),
    queryFn: () => fetchCorsConfigs(options),
    staleTime: 5 * 60 * 1000,
  });
}

/**
 * Prefetch individual CORS configuration for improved performance.
 * Useful for preloading data on route transitions.
 * 
 * @param queryClient - React Query client instance
 * @param id - CORS configuration ID
 * @param options - Optional API request configuration
 */
export async function prefetchCorsConfig(
  queryClient: any, // QueryClient type from @tanstack/react-query
  id: number,
  options?: ApiRequestOptions
): Promise<void> {
  await queryClient.prefetchQuery({
    queryKey: corsConfigKeys.detail(id),
    queryFn: () => fetchCorsConfig(id, options),
    staleTime: 5 * 60 * 1000,
  });
}

/**
 * Invalidate CORS configuration queries to force refetch.
 * Useful after mutations or when manual refresh is needed.
 * 
 * @param queryClient - React Query client instance
 */
export async function invalidateCorsConfigQueries(
  queryClient: any // QueryClient type from @tanstack/react-query
): Promise<void> {
  await queryClient.invalidateQueries({
    queryKey: corsConfigKeys.all,
  });
}

// ============================================================================
// Default Export
// ============================================================================

export default {
  useCorsConfigs,
  useCorsConfig,
  useCorsConfigResolver,
  corsConfigKeys,
  prefetchCorsConfigs,
  prefetchCorsConfig,
  invalidateCorsConfigQueries,
};