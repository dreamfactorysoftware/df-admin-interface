'use client';

/**
 * React Query-based custom hook for app list data fetching with advanced caching and filtering.
 * 
 * Replaces the Angular manage-apps.resolver.ts factory by implementing React Query useQuery 
 * with optional limit parameter support, comprehensive query parameter building, and intelligent 
 * cache management. Supports background synchronization and optimistic updates for app 
 * management workflows.
 * 
 * Features:
 * - Configurable limit parameter support with default value of 50
 * - React Query intelligent caching with TTL configuration (staleTime: 300s, cacheTime: 900s)
 * - Automatic background revalidation for real-time app list updates
 * - Transform Angular getAll method parameters to React Query select functions
 * - Maintains original query parameters for backend API compatibility
 * - Cache hit responses under 50ms performance target
 * - TanStack React Query 5.79.2 for complex server-state management
 * 
 * @fileoverview App list data fetching hook with React Query integration
 * @version 1.0.0
 * @since React 19.0.0 / Next.js 15.1+
 */

import { useQuery, useQueryClient, type UseQueryOptions } from '@tanstack/react-query';
import { useCallback, useMemo } from 'react';
import { API_ENDPOINTS, apiGet } from '../../../lib/api-client';
import type { 
  AppListResponse, 
  AppType, 
  AppQueryOptions,
  AppQueryKey,
  DEFAULT_APP_QUERY_OPTIONS
} from '../../../types/apps';
import type { ApiRequestOptions } from '../../../types/api';
import type { GenericListResponse } from '../../../types/generic-http';

// ============================================================================
// Hook Configuration Types
// ============================================================================

/**
 * Configuration options for the useApps hook
 * Extends React Query options with app-specific parameters
 */
export interface UseAppsOptions extends Omit<UseQueryOptions<AppListResponse, Error>, 'queryKey' | 'queryFn'> {
  /** Maximum number of apps to fetch (default: 50) */
  limit?: number;
  /** Include related role information (default: 'role_by_role_id') */
  related?: string;
  /** Field selection for response optimization (default: '*') */
  fields?: string;
  /** Sorting parameters (default: 'name') */
  sort?: string;
  /** Pagination offset (default: 0) */
  offset?: number;
  /** Filtering parameters */
  filter?: string;
  /** Include total count in response (default: true) */
  includeCount?: boolean;
  /** Force refresh/bypass cache (default: false) */
  refresh?: boolean;
  /** Additional query parameters */
  additionalParams?: Array<{ key: string; value: any }>;
  /** Additional request headers */
  additionalHeaders?: Array<{ key: string; value: any }>;
  /** Custom stale time override (default: 300s) */
  staleTime?: number;
  /** Custom cache time override (default: 900s) */
  cacheTime?: number;
  /** Custom refetch interval for background sync */
  refetchInterval?: number;
  /** Enable background refetching (default: true) */
  refetchInBackground?: boolean;
  /** Select function for data transformation */
  select?: (data: AppListResponse) => any;
}

/**
 * Return type for the useApps hook
 * Provides comprehensive app list state and actions
 */
export interface UseAppsResult<TData = AppListResponse> {
  /** App list data or transformed data if select function is provided */
  data: TData | undefined;
  /** Loading state */
  isLoading: boolean;
  /** Error state */
  error: Error | null;
  /** Initial loading state (first fetch) */
  isInitialLoading: boolean;
  /** Background fetching state */
  isFetching: boolean;
  /** Stale data indicator */
  isStale: boolean;
  /** Success state */
  isSuccess: boolean;
  /** Error state */
  isError: boolean;
  /** Refetch function for manual refresh */
  refetch: () => Promise<any>;
  /** Invalidate cache function */
  invalidate: () => Promise<void>;
  /** Update cache with new data */
  updateCache: (updater: (oldData: AppListResponse | undefined) => AppListResponse | undefined) => void;
  /** Query key for cache management */
  queryKey: AppQueryKey;
  /** Total count from pagination metadata */
  totalCount: number | undefined;
  /** Whether there are more pages available */
  hasNextPage: boolean | undefined;
  /** Whether there are previous pages available */
  hasPreviousPage: boolean | undefined;
}

// ============================================================================
// Hook Implementation
// ============================================================================

/**
 * React Query-based custom hook for app list data fetching.
 * 
 * Provides configurable app list data fetching with advanced caching, filtering,
 * and conditional parameter handling. Replaces Angular manage-apps.resolver.ts
 * with modern React patterns and intelligent cache management.
 * 
 * @param options - Configuration options for the hook
 * @returns App list data, loading states, and cache management functions
 * 
 * @example
 * ```tsx
 * // Basic usage with default options
 * const { data, isLoading, error } = useApps();
 * 
 * // With custom limit and related data
 * const { data, isLoading } = useApps({
 *   limit: 100,
 *   related: 'role_by_role_id',
 *   sort: 'created_date desc',
 * });
 * 
 * // With data transformation
 * const { data: activeApps } = useApps({
 *   select: (data) => data.resource.filter(app => app.isActive),
 * });
 * 
 * // With custom caching configuration
 * const { data } = useApps({
 *   staleTime: 600000, // 10 minutes
 *   cacheTime: 1800000, // 30 minutes
 *   refetchInterval: 60000, // 1 minute background sync
 * });
 * ```
 */
export function useApps<TData = AppListResponse>(
  options: UseAppsOptions = {}
): UseAppsResult<TData> {
  const queryClient = useQueryClient();

  // Extract hook-specific options from React Query options
  const {
    limit = DEFAULT_APP_QUERY_OPTIONS.limit,
    related = DEFAULT_APP_QUERY_OPTIONS.related,
    fields = DEFAULT_APP_QUERY_OPTIONS.fields,
    sort = DEFAULT_APP_QUERY_OPTIONS.sort,
    offset = DEFAULT_APP_QUERY_OPTIONS.offset,
    filter = DEFAULT_APP_QUERY_OPTIONS.filter,
    includeCount = DEFAULT_APP_QUERY_OPTIONS.includeCount,
    refresh = DEFAULT_APP_QUERY_OPTIONS.refresh,
    additionalParams,
    additionalHeaders,
    staleTime = 5 * 60 * 1000, // 5 minutes (300s)
    cacheTime = 15 * 60 * 1000, // 15 minutes (900s)
    refetchInterval,
    refetchInBackground = true,
    select,
    enabled = true,
    ...reactQueryOptions
  } = options;

  // Build query parameters for API request
  const queryParams = useMemo((): AppQueryOptions => ({
    related,
    fields,
    limit,
    offset,
    sort,
    filter: filter || undefined,
    includeCount,
    refresh,
  }), [related, fields, limit, offset, sort, filter, includeCount, refresh]);

  // Build query key for React Query caching
  const queryKey = useMemo((): AppQueryKey => [
    'apps',
    'list',
    queryParams,
  ], [queryParams]);

  // Build API request options
  const apiOptions = useMemo((): ApiRequestOptions => ({
    related: queryParams.related,
    fields: queryParams.fields,
    limit: queryParams.limit,
    offset: queryParams.offset,
    sort: queryParams.sort,
    filter: queryParams.filter,
    includeCount: queryParams.includeCount,
    refresh: queryParams.refresh,
    additionalParams,
    additionalHeaders,
  }), [queryParams, additionalParams, additionalHeaders]);

  // Query function for fetching app list data
  const queryFn = useCallback(async (): Promise<AppListResponse> => {
    try {
      // Use the API client to fetch app list data
      const response = await apiGet<GenericListResponse<AppType>>(
        API_ENDPOINTS.SYSTEM_APP,
        apiOptions
      );

      // Transform legacy response format to modern format if needed
      const appListResponse: AppListResponse = {
        resource: response.resource || [],
        meta: {
          count: response.meta?.count || 0,
          offset: queryParams.offset || 0,
          limit: queryParams.limit || 50,
          has_next: response.meta ? 
            (response.meta.count > (queryParams.offset || 0) + (queryParams.limit || 50)) : 
            false,
          has_previous: (queryParams.offset || 0) > 0,
        },
      };

      return appListResponse;
    } catch (error) {
      // Enhanced error handling for React Query
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('Failed to fetch app list data');
    }
  }, [apiOptions, queryParams.offset, queryParams.limit]);

  // React Query hook with enhanced configuration
  const queryResult = useQuery({
    queryKey,
    queryFn,
    enabled,
    staleTime,
    cacheTime,
    refetchOnWindowFocus: false, // Optimize for app performance
    refetchOnReconnect: true,
    refetchOnMount: true,
    refetchInterval: refetchInBackground ? refetchInterval : false,
    refetchIntervalInBackground: refetchInBackground,
    retry: (failureCount, error) => {
      // Custom retry logic for different error types
      if (error?.message.includes('401') || error?.message.includes('403')) {
        return false; // Don't retry auth errors
      }
      return failureCount < 3;
    },
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
    select,
    ...reactQueryOptions,
  });

  // Cache management functions
  const invalidate = useCallback(async (): Promise<void> => {
    await queryClient.invalidateQueries({ queryKey: ['apps'] });
  }, [queryClient]);

  const updateCache = useCallback((
    updater: (oldData: AppListResponse | undefined) => AppListResponse | undefined
  ): void => {
    queryClient.setQueryData(queryKey, updater);
  }, [queryClient, queryKey]);

  // Extract pagination metadata
  const totalCount = useMemo(() => {
    return queryResult.data?.meta?.count;
  }, [queryResult.data?.meta?.count]);

  const hasNextPage = useMemo(() => {
    return queryResult.data?.meta?.has_next;
  }, [queryResult.data?.meta?.has_next]);

  const hasPreviousPage = useMemo(() => {
    return queryResult.data?.meta?.has_previous;
  }, [queryResult.data?.meta?.has_previous]);

  // Return comprehensive hook result
  return {
    data: queryResult.data,
    isLoading: queryResult.isLoading,
    error: queryResult.error,
    isInitialLoading: queryResult.isInitialLoading,
    isFetching: queryResult.isFetching,
    isStale: queryResult.isStale,
    isSuccess: queryResult.isSuccess,
    isError: queryResult.isError,
    refetch: queryResult.refetch,
    invalidate,
    updateCache,
    queryKey,
    totalCount,
    hasNextPage,
    hasPreviousPage,
  };
}

// ============================================================================
// Specialized Hook Variants
// ============================================================================

/**
 * Hook for fetching active apps only
 * Pre-configured with filter for active applications
 */
export function useActiveApps<TData = AppListResponse>(
  options: Omit<UseAppsOptions, 'filter'> = {}
): UseAppsResult<TData> {
  return useApps<TData>({
    ...options,
    filter: 'is_active=1',
  });
}

/**
 * Hook for fetching apps with pagination
 * Optimized for table/grid components with virtual scrolling
 */
export function useAppsPaginated(
  page: number = 0,
  pageSize: number = 50,
  options: Omit<UseAppsOptions, 'limit' | 'offset'> = {}
): UseAppsResult & {
  page: number;
  pageSize: number;
  totalPages: number | undefined;
} {
  const result = useApps({
    ...options,
    limit: pageSize,
    offset: page * pageSize,
  });

  const totalPages = useMemo(() => {
    if (result.totalCount && pageSize > 0) {
      return Math.ceil(result.totalCount / pageSize);
    }
    return undefined;
  }, [result.totalCount, pageSize]);

  return {
    ...result,
    page,
    pageSize,
    totalPages,
  };
}

/**
 * Hook for fetching apps with real-time updates
 * Configured with aggressive background refetching for live data
 */
export function useAppsRealtime<TData = AppListResponse>(
  options: UseAppsOptions = {}
): UseAppsResult<TData> {
  return useApps<TData>({
    ...options,
    refetchInterval: 30000, // 30 seconds
    refetchInBackground: true,
    staleTime: 10000, // 10 seconds
  });
}

// ============================================================================
// Cache Management Utilities
// ============================================================================

/**
 * Utility function to invalidate all app-related queries
 * Useful for cache management after mutations
 */
export function invalidateAppQueries(queryClient: ReturnType<typeof useQueryClient>): Promise<void> {
  return queryClient.invalidateQueries({ queryKey: ['apps'] });
}

/**
 * Utility function to prefetch app list data
 * Useful for performance optimization in route transitions
 */
export function prefetchApps(
  queryClient: ReturnType<typeof useQueryClient>,
  options: UseAppsOptions = {}
): Promise<void> {
  const queryParams: AppQueryOptions = {
    related: options.related || DEFAULT_APP_QUERY_OPTIONS.related,
    fields: options.fields || DEFAULT_APP_QUERY_OPTIONS.fields,
    limit: options.limit || DEFAULT_APP_QUERY_OPTIONS.limit,
    offset: options.offset || DEFAULT_APP_QUERY_OPTIONS.offset,
    sort: options.sort || DEFAULT_APP_QUERY_OPTIONS.sort,
    filter: options.filter || DEFAULT_APP_QUERY_OPTIONS.filter,
    includeCount: options.includeCount ?? DEFAULT_APP_QUERY_OPTIONS.includeCount,
    refresh: options.refresh || DEFAULT_APP_QUERY_OPTIONS.refresh,
  };

  const queryKey: AppQueryKey = ['apps', 'list', queryParams];

  return queryClient.prefetchQuery({
    queryKey,
    queryFn: async () => {
      const apiOptions: ApiRequestOptions = {
        related: queryParams.related,
        fields: queryParams.fields,
        limit: queryParams.limit,
        offset: queryParams.offset,
        sort: queryParams.sort,
        filter: queryParams.filter,
        includeCount: queryParams.includeCount,
        refresh: queryParams.refresh,
      };

      const response = await apiGet<GenericListResponse<AppType>>(
        API_ENDPOINTS.SYSTEM_APP,
        apiOptions
      );

      const appListResponse: AppListResponse = {
        resource: response.resource || [],
        meta: {
          count: response.meta?.count || 0,
          offset: queryParams.offset || 0,
          limit: queryParams.limit || 50,
          has_next: response.meta ? 
            (response.meta.count > (queryParams.offset || 0) + (queryParams.limit || 50)) : 
            false,
          has_previous: (queryParams.offset || 0) > 0,
        },
      };

      return appListResponse;
    },
    staleTime: options.staleTime || 5 * 60 * 1000,
    cacheTime: options.cacheTime || 15 * 60 * 1000,
  });
}

// ============================================================================
// Default Export
// ============================================================================

export default useApps;