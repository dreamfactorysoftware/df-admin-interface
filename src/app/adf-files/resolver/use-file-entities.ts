/**
 * React Query-based custom hook for fetching file entity collections.
 * 
 * Replaces the Angular entitiesResolver by implementing React Query useQuery
 * with intelligent caching and automatic revalidation for file list operations.
 * Provides type-safe Files response while maintaining the original type-based 
 * filtering parameters for different file service types.
 * 
 * @fileoverview File entities fetching hook with TanStack React Query
 * @version 1.0.0
 * @since React 19.0.0 / Next.js 15.1+
 */

import { useQuery, type UseQueryResult } from '@tanstack/react-query';
import { apiGet } from '../../../lib/api-client';
import type { Files } from '../../../types/files';

// ============================================================================
// Type Definitions
// ============================================================================

/**
 * Hook configuration options for file entities fetching
 */
export interface UseFileEntitiesOptions {
  /** Enable/disable the query execution */
  enabled?: boolean;
  /** Custom stale time override in milliseconds */
  staleTime?: number;
  /** Custom cache time override in milliseconds */
  cacheTime?: number;
  /** Additional query options for specialized use cases */
  refetchOnWindowFocus?: boolean;
  /** Retry configuration for failed requests */
  retry?: number | boolean;
}

/**
 * Hook parameters for file entities fetching
 */
export interface UseFileEntitiesParams {
  /** File service type for filtering entities */
  type: string;
  /** Additional hook configuration options */
  options?: UseFileEntitiesOptions;
}

// ============================================================================
// React Query Configuration Constants
// ============================================================================

/**
 * Default caching configuration for file entities
 * Implements React/Next.js Integration Requirements:
 * - Cache hit responses under 50ms
 * - Intelligent caching with TTL configuration
 */
const DEFAULT_QUERY_CONFIG = {
  /** Data considered fresh for 5 minutes (300 seconds) */
  staleTime: 5 * 60 * 1000,
  /** Data cached for 15 minutes (900 seconds) */
  cacheTime: 15 * 60 * 1000,
  /** Enable background refetching for real-time updates */
  refetchOnWindowFocus: true,
  /** Retry failed requests up to 3 times */
  retry: 3,
  /** Enable automatic background revalidation */
  refetchOnMount: true,
} as const;

// ============================================================================
// Query Key Factory
// ============================================================================

/**
 * Generate consistent query keys for file entities
 * Ensures proper cache invalidation and data synchronization
 */
export const fileEntitiesQueryKeys = {
  /** Base key for all file entities queries */
  all: ['file-entities'] as const,
  /** Key for specific file type entities */
  byType: (type: string) => [...fileEntitiesQueryKeys.all, 'type', type] as const,
} as const;

// ============================================================================
// API Fetcher Function
// ============================================================================

/**
 * Fetch file entities from the API
 * Implements the core API call that replaces Angular's crudService.get(type)
 * 
 * @param type - File service type for entity filtering
 * @returns Promise resolving to Files response
 */
async function fetchFileEntities(type: string): Promise<Files> {
  try {
    // Use the modern API client to fetch file entities
    // This replaces the Angular DI BASE_SERVICE_TOKEN injection pattern
    const response = await apiGet<Files>(type, {
      // Enable cache control headers for optimal performance
      includeCacheControl: true,
      // Show loading indicator during fetch
      showSpinner: true,
      // Configure success/error notifications
      snackbarError: 'Failed to load file entities',
    });
    
    return response;
  } catch (error) {
    // Enhanced error handling with context information
    const errorMessage = error instanceof Error 
      ? error.message 
      : 'Unknown error occurred while fetching file entities';
    
    throw new Error(`File entities fetch failed for type "${type}": ${errorMessage}`);
  }
}

// ============================================================================
// Main Hook Implementation
// ============================================================================

/**
 * Custom hook for fetching file entity collections with React Query.
 * 
 * Transforms Angular ResolveFn entitiesResolver to React Query useQuery hook
 * per Section 4.7.1.2 interceptor to middleware migration architecture.
 * Replaces Angular DI BASE_SERVICE_TOKEN injection with React Query-powered 
 * API client per Section 3.2.2 state management architecture.
 * 
 * Features:
 * - Intelligent caching with TTL configuration (staleTime: 300s, cacheTime: 900s)
 * - Automatic background revalidation for real-time file entity updates
 * - Type-safe Files response with Services and ServiceTypes
 * - Performance optimized for cache hit responses under 50ms
 * 
 * @param params - Hook parameters containing type and options
 * @returns React Query result with file entities data, loading, and error states
 * 
 * @example
 * ```typescript
 * // Basic usage for file service entities
 * const { data: fileEntities, isLoading, error } = useFileEntities({
 *   type: 'files'
 * });
 * 
 * // With custom options
 * const { data: logEntities } = useFileEntities({
 *   type: 'logs',
 *   options: {
 *     enabled: true,
 *     staleTime: 60000, // 1 minute
 *     retry: 1
 *   }
 * });
 * 
 * // Access services and service types
 * if (fileEntities) {
 *   console.log('Available services:', fileEntities.services);
 *   console.log('Service types:', fileEntities.serviceTypes);
 * }
 * ```
 */
export function useFileEntities({
  type,
  options = {}
}: UseFileEntitiesParams): UseQueryResult<Files, Error> {
  // Merge user options with defaults
  const queryConfig = {
    ...DEFAULT_QUERY_CONFIG,
    ...options,
  };
  
  // Execute React Query with intelligent caching
  return useQuery({
    // Generate consistent query key for caching
    queryKey: fileEntitiesQueryKeys.byType(type),
    
    // Fetch function with error handling
    queryFn: () => fetchFileEntities(type),
    
    // Enable query only when type is provided and enabled option is true
    enabled: Boolean(type) && (queryConfig.enabled ?? true),
    
    // Caching configuration per React/Next.js Integration Requirements
    staleTime: queryConfig.staleTime,
    cacheTime: queryConfig.cacheTime,
    
    // Background synchronization for real-time updates
    refetchOnWindowFocus: queryConfig.refetchOnWindowFocus,
    refetchOnMount: queryConfig.refetchOnMount,
    
    // Error handling configuration
    retry: queryConfig.retry,
    
    // Ensure data consistency and prevent race conditions
    refetchOnReconnect: true,
    
    // Performance optimization: return previous data while refetching
    keepPreviousData: true,
    
    // Data transformation and validation
    select: (data: Files) => {
      // Ensure data structure integrity
      return {
        services: data.services || [],
        serviceTypes: data.serviceTypes || [],
      };
    },
    
    // Error boundary integration
    useErrorBoundary: (error: Error) => {
      // Only use error boundary for critical errors
      return error.message.includes('network') || error.message.includes('authentication');
    },
    
    // Development debugging
    meta: {
      entityType: 'file-entities',
      serviceType: type,
    },
  });
}

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Prefetch file entities for improved performance
 * Useful for preloading data on route navigation or user interactions
 * 
 * @param queryClient - TanStack Query client instance
 * @param type - File service type to prefetch
 * @param options - Optional prefetch configuration
 */
export async function prefetchFileEntities(
  queryClient: any, // QueryClient type from @tanstack/react-query
  type: string,
  options: UseFileEntitiesOptions = {}
): Promise<void> {
  const queryConfig = {
    ...DEFAULT_QUERY_CONFIG,
    ...options,
  };
  
  await queryClient.prefetchQuery({
    queryKey: fileEntitiesQueryKeys.byType(type),
    queryFn: () => fetchFileEntities(type),
    staleTime: queryConfig.staleTime,
    cacheTime: queryConfig.cacheTime,
  });
}

/**
 * Invalidate file entities cache
 * Triggers refetch of file entities data when needed
 * 
 * @param queryClient - TanStack Query client instance
 * @param type - Optional specific type to invalidate, or all if not provided
 */
export async function invalidateFileEntities(
  queryClient: any, // QueryClient type from @tanstack/react-query
  type?: string
): Promise<void> {
  if (type) {
    await queryClient.invalidateQueries({
      queryKey: fileEntitiesQueryKeys.byType(type),
    });
  } else {
    await queryClient.invalidateQueries({
      queryKey: fileEntitiesQueryKeys.all,
    });
  }
}

// ============================================================================
// Default Export
// ============================================================================

export default useFileEntities;