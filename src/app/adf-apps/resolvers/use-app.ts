/**
 * React Query-based custom hook for fetching individual AppType data.
 * 
 * Replaces the Angular edit-app.resolver.ts by implementing React Query useQuery
 * with intelligent caching and related data loading. Provides TTL configuration
 * with staleTime: 300s and cacheTime: 900s for optimal performance and data
 * freshness while maintaining DreamFactory API compatibility.
 * 
 * This hook transforms Angular ResolveFn patterns to React Query-powered 
 * data fetching with automatic background revalidation and cache responses
 * under 50ms per React/Next.js Integration Requirements.
 * 
 * @fileoverview Individual app data fetching hook for edit workflows
 * @version 1.0.0
 * @since React 19.0.0 / Next.js 15.1+
 */

import { useQuery, type UseQueryResult } from '@tanstack/react-query';
import { apiGet, API_ENDPOINTS } from '../../../lib/api-client';
import type { AppType, AppResourceResponse } from '../../../types/apps';
import type { GenericErrorResponse } from '../../../types/generic-http';

// ============================================================================
// Types and Interfaces
// ============================================================================

/**
 * Hook parameters for app data fetching
 */
export interface UseAppOptions {
  /** Application ID to fetch */
  id: number | string;
  /** Enable/disable the query */
  enabled?: boolean;
  /** Custom stale time override (default: 300s) */
  staleTime?: number;
  /** Custom cache time override (default: 900s) */
  cacheTime?: number;
}

/**
 * App query key factory for React Query caching
 * Supports intelligent cache invalidation and background synchronization
 */
export type AppDetailQueryKey = ['apps', 'detail', number | string];

/**
 * Hook return type with enhanced error handling
 */
export interface UseAppResult extends UseQueryResult<AppType, Error> {
  /** App data if successfully loaded */
  app?: AppType;
  /** Whether the app is currently being fetched */
  isLoading: boolean;
  /** Whether there was an error fetching the app */
  isError: boolean;
  /** Error object if the query failed */
  error: Error | null;
  /** Whether the app data is stale and being refetched in background */
  isRefetching: boolean;
}

// ============================================================================
// Query Key Factory
// ============================================================================

/**
 * Creates a standardized query key for app detail caching
 * 
 * @param id - Application ID for cache key generation
 * @returns Typed query key for React Query cache management
 */
export function createAppQueryKey(id: number | string): AppDetailQueryKey {
  return ['apps', 'detail', id];
}

// ============================================================================
// API Fetcher Function
// ============================================================================

/**
 * Fetches individual app data from DreamFactory API with related role information.
 * 
 * Maintains existing DreamFactory API compatibility by including:
 * - related: 'role_by_role_id' for role relationship loading
 * - fields: '*' for comprehensive field selection
 * 
 * @param id - Application ID to fetch
 * @returns Promise resolving to AppType data
 * @throws Error with DreamFactory API error details
 */
async function fetchAppById(id: number | string): Promise<AppType> {
  try {
    // Construct API endpoint with app ID
    const endpoint = `${API_ENDPOINTS.SYSTEM_APP}/${id}`;
    
    // Fetch app data with related role information and all fields
    // Maintains Angular resolver compatibility with same parameters
    const response = await apiGet<AppResourceResponse>(endpoint, {
      related: 'role_by_role_id',
      fields: '*',
      includeCacheControl: true,
    });
    
    // Extract app data from DreamFactory response format
    if (!response || typeof response !== 'object') {
      throw new Error('Invalid response format from API');
    }
    
    // Handle both direct app object and wrapped response formats
    const appData = 'resource' in response ? response.resource : response;
    
    if (!appData || typeof appData !== 'object') {
      throw new Error('No app data found in response');
    }
    
    return appData as AppType;
  } catch (error) {
    // Enhanced error handling with DreamFactory API error format support
    if (error instanceof Error) {
      let errorMessage = error.message;
      
      try {
        // Parse DreamFactory API error format
        const apiError = JSON.parse(error.message) as GenericErrorResponse;
        if (apiError.error) {
          errorMessage = apiError.error.message || errorMessage;
        }
      } catch {
        // Use original error message if not valid JSON
      }
      
      throw new Error(`Failed to fetch app: ${errorMessage}`);
    }
    
    throw new Error('An unexpected error occurred while fetching app data');
  }
}

// ============================================================================
// React Query Hook
// ============================================================================

/**
 * React Query-based hook for fetching individual app data with intelligent caching.
 * 
 * Replaces Angular edit-app.resolver.ts with React Query-powered data fetching
 * that provides automatic background revalidation, cache responses under 50ms,
 * and optimistic UI updates for enhanced user experience.
 * 
 * Key Features:
 * - TTL configuration with staleTime: 300s, cacheTime: 900s
 * - Automatic background revalidation for data freshness
 * - Intelligent error handling with DreamFactory API compatibility
 * - Type-safe AppType return type with role relationship data
 * - Cache hit responses under 50ms per performance requirements
 * 
 * @param options - Hook configuration options including app ID and cache settings
 * @returns Query result with app data, loading states, and error handling
 * 
 * @example
 * ```tsx
 * function EditAppPage({ params }: { params: { id: string } }) {
 *   const { app, isLoading, isError, error } = useApp({
 *     id: params.id,
 *     enabled: !!params.id
 *   });
 * 
 *   if (isLoading) return <LoadingSpinner />;
 *   if (isError) return <ErrorMessage error={error} />;
 *   if (!app) return <NotFound />;
 * 
 *   return <AppEditForm app={app} />;
 * }
 * ```
 */
export function useApp(options: UseAppOptions): UseAppResult {
  const { 
    id, 
    enabled = true, 
    staleTime = 5 * 60 * 1000, // 300 seconds (5 minutes)
    cacheTime = 15 * 60 * 1000 // 900 seconds (15 minutes)
  } = options;

  // Validate app ID parameter
  const isValidId = id !== undefined && id !== null && id !== '';
  const queryEnabled = enabled && isValidId;

  // React Query implementation with TanStack React Query 5.79.2
  const query = useQuery({
    // Query key for cache management and invalidation
    queryKey: createAppQueryKey(id),
    
    // Fetcher function with DreamFactory API integration
    queryFn: () => fetchAppById(id),
    
    // Enable query only when ID is valid and enabled is true
    enabled: queryEnabled,
    
    // TTL configuration for intelligent caching
    staleTime, // Data considered fresh for 5 minutes
    cacheTime, // Cache kept for 15 minutes after component unmount
    
    // Background refetching configuration
    refetchOnWindowFocus: true, // Refetch when window regains focus
    refetchOnReconnect: true,   // Refetch when network reconnects
    refetchOnMount: 'always',   // Always check for updates on mount
    
    // Retry configuration for enhanced reliability
    retry: (failureCount, error) => {
      // Don't retry on 404 errors (app not found)
      if (error.message.includes('404') || error.message.includes('not found')) {
        return false;
      }
      // Retry up to 3 times for other errors with exponential backoff
      return failureCount < 3;
    },
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
    
    // Error handling configuration
    throwOnError: false, // Handle errors through error state instead of throwing
    
    // Select function for data transformation if needed
    select: (data: AppType) => {
      // Ensure role relationship data is properly structured
      if (data.roleByRoleId) {
        return {
          ...data,
          roleByRoleId: {
            ...data.roleByRoleId,
            // Ensure boolean conversion for isActive field
            isActive: Boolean(data.roleByRoleId.isActive),
          }
        };
      }
      return data;
    },
  });

  // Enhanced return object with convenience properties
  return {
    ...query,
    app: query.data,
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
    isRefetching: query.isFetching && !query.isLoading,
  };
}

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Prefetch app data for performance optimization.
 * 
 * Useful for prefetching app data when user hovers over edit links
 * or when navigating to app detail pages for improved perceived performance.
 * 
 * @param queryClient - React Query client instance
 * @param id - Application ID to prefetch
 * @param options - Optional cache configuration
 */
export async function prefetchApp(
  queryClient: any, // QueryClient type from @tanstack/react-query
  id: number | string,
  options: Partial<UseAppOptions> = {}
): Promise<void> {
  const {
    staleTime = 5 * 60 * 1000,
    cacheTime = 15 * 60 * 1000
  } = options;

  await queryClient.prefetchQuery({
    queryKey: createAppQueryKey(id),
    queryFn: () => fetchAppById(id),
    staleTime,
    cacheTime,
  });
}

/**
 * Invalidate app cache for real-time updates.
 * 
 * Call this function after successful app mutations to ensure
 * the UI reflects the latest data immediately.
 * 
 * @param queryClient - React Query client instance
 * @param id - Application ID to invalidate (optional, invalidates all if not provided)
 */
export async function invalidateAppCache(
  queryClient: any, // QueryClient type from @tanstack/react-query
  id?: number | string
): Promise<void> {
  if (id) {
    // Invalidate specific app cache
    await queryClient.invalidateQueries({
      queryKey: createAppQueryKey(id),
    });
  } else {
    // Invalidate all app-related caches
    await queryClient.invalidateQueries({
      queryKey: ['apps'],
    });
  }
}

// ============================================================================
// Default Export
// ============================================================================

export default useApp;