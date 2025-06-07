/**
 * React Query hook for scheduler task management
 * 
 * Replaces Angular DfManageSchedulerTableComponent data fetching with modern
 * server state management using TanStack React Query. Implements intelligent
 * caching, pagination, filtering, and background synchronization for scheduler
 * task lists. Optimized for large datasets with configurable staleTime and
 * automatic revalidation patterns.
 * 
 * @fileoverview Scheduler task data fetching hook with React Query
 * @version 1.0.0
 * @since React 19.0.0 / Next.js 15.1+
 */

import { useQuery, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import type { 
  SchedulerTaskData, 
  SchedulerTaskListResponse,
  SchedulerTaskFilters,
  SchedulerTaskSort 
} from '@/types/scheduler';
import type { ApiResponse } from '@/lib/api-client';

/**
 * Query parameters for scheduler task requests
 * Supports pagination, filtering, and sorting per Angular implementation
 */
export interface SchedulerTaskQueryParams {
  /** Page limit for pagination (default: 25) */
  limit?: number;
  /** Page offset for pagination (default: 0) */
  offset?: number;
  /** Search term for task names and descriptions */
  search?: string;
  /** Filter parameters */
  filters?: SchedulerTaskFilters;
  /** Sort configuration */
  sort?: SchedulerTaskSort;
  /** Include related service data */
  related?: string;
  /** Specific fields to include in response */
  fields?: string;
}

/**
 * Hook options for useSchedulerTasks
 */
export interface UseSchedulerTasksOptions {
  /** Enable/disable automatic background refetching */
  enabled?: boolean;
  /** Override default stale time (300 seconds) */
  staleTime?: number;
  /** Override default cache time (900 seconds) */
  cacheTime?: number;
  /** Custom retry count for failed requests */
  retry?: number;
  /** Enable real-time updates via interval refetching */
  refetchInterval?: number | false;
}

/**
 * Query result interface extending React Query's standard result
 */
export interface UseSchedulerTasksResult {
  /** Scheduler task data array */
  data: SchedulerTaskData[] | undefined;
  /** Total count for pagination */
  total: number | undefined;
  /** Current page information */
  meta: {
    page: number;
    pageSize: number;
    totalPages: number;
    hasMore: boolean;
  } | undefined;
  /** Loading state for initial data fetch */
  isLoading: boolean;
  /** Loading state for background updates */
  isFetching: boolean;
  /** Error state with typed error information */
  error: Error | null;
  /** Is data stale and needs refetching */
  isStale: boolean;
  /** Manual refetch function */
  refetch: () => Promise<any>;
  /** Invalidate and refetch query */
  invalidate: () => Promise<void>;
}

/**
 * Build API endpoint URL with query parameters
 * Constructs proper DreamFactory API URL for scheduler tasks
 */
function buildSchedulerTasksEndpoint(params: SchedulerTaskQueryParams): string {
  const queryParams = new URLSearchParams();
  
  // Pagination parameters
  if (params.limit !== undefined) {
    queryParams.append('limit', params.limit.toString());
  }
  if (params.offset !== undefined) {
    queryParams.append('offset', params.offset.toString());
  }
  
  // Search functionality - searches in name and description fields
  if (params.search) {
    // DreamFactory filter format for OR search across multiple fields
    const searchFilter = `(name like "%${params.search}%") OR (description like "%${params.search}%")`;
    queryParams.append('filter', searchFilter);
  }
  
  // Additional filters
  if (params.filters) {
    const filterConditions: string[] = [];
    
    if (params.filters.isActive !== undefined) {
      filterConditions.push(`isActive=${params.filters.isActive}`);
    }
    if (params.filters.serviceId) {
      filterConditions.push(`serviceId="${params.filters.serviceId}"`);
    }
    if (params.filters.verb) {
      filterConditions.push(`verb="${params.filters.verb}"`);
    }
    if (params.filters.component) {
      filterConditions.push(`component like "%${params.filters.component}%"`);
    }
    
    if (filterConditions.length > 0) {
      const existingFilter = queryParams.get('filter');
      const combinedFilter = existingFilter 
        ? `(${existingFilter}) AND (${filterConditions.join(' AND ')})`
        : filterConditions.join(' AND ');
      queryParams.set('filter', combinedFilter);
    }
  }
  
  // Sorting
  if (params.sort) {
    const sortDirection = params.sort.direction === 'desc' ? '-' : '';
    queryParams.append('order', `${sortDirection}${params.sort.field}`);
  }
  
  // Related data inclusion (include service details)
  const related = params.related || 'serviceByServiceId';
  queryParams.append('related', related);
  
  // Field selection
  if (params.fields) {
    queryParams.append('fields', params.fields);
  }
  
  // Include count for pagination
  queryParams.append('include_count', 'true');
  
  const queryString = queryParams.toString();
  return `/system/scheduler${queryString ? `?${queryString}` : ''}`;
}

/**
 * Generate cache key for React Query
 * Creates consistent cache keys for optimal caching behavior
 */
function getQueryKey(params: SchedulerTaskQueryParams): (string | SchedulerTaskQueryParams)[] {
  return ['scheduler-tasks', params];
}

/**
 * Fetch scheduler tasks from DreamFactory API
 * Handles API response transformation and error handling
 */
async function fetchSchedulerTasks(
  params: SchedulerTaskQueryParams
): Promise<SchedulerTaskListResponse> {
  try {
    const endpoint = buildSchedulerTasksEndpoint(params);
    const response: ApiResponse<SchedulerTaskData[]> = await apiClient.get(endpoint, {
      // Enable retries for failed requests
      retries: 2,
      // 10 second timeout for scheduler operations
      timeout: 10000,
    });
    
    // Handle DreamFactory API response format
    const data = response.resource || response.data || [];
    const total = response.meta?.count || 0;
    
    // Calculate pagination metadata
    const limit = params.limit || 25;
    const offset = params.offset || 0;
    const page = Math.floor(offset / limit) + 1;
    const totalPages = Math.ceil(total / limit);
    const hasMore = offset + limit < total;
    
    return {
      data,
      total,
      page,
      pageSize: limit,
      hasMore,
    };
  } catch (error) {
    // Enhanced error handling with context
    const message = error instanceof Error ? error.message : 'Failed to fetch scheduler tasks';
    throw new Error(`Scheduler tasks fetch failed: ${message}`);
  }
}

/**
 * React Query hook for scheduler task management
 * 
 * Provides intelligent caching, background synchronization, and optimistic updates
 * for scheduler task data. Implements the patterns specified in Section 4.3.2 with
 * performance optimizations per React/Next.js Integration Requirements.
 * 
 * @param params - Query parameters for filtering, pagination, and sorting
 * @param options - Hook configuration options
 * @returns Query result with scheduler task data and metadata
 * 
 * @example
 * ```typescript
 * const { data, isLoading, error, refetch } = useSchedulerTasks({
 *   limit: 25,
 *   offset: 0,
 *   search: 'backup',
 *   filters: { isActive: true }
 * });
 * ```
 */
export function useSchedulerTasks(
  params: SchedulerTaskQueryParams = {},
  options: UseSchedulerTasksOptions = {}
): UseSchedulerTasksResult {
  const queryClient = useQueryClient();
  
  // Merge default parameters
  const queryParams: SchedulerTaskQueryParams = {
    limit: 25,
    offset: 0,
    ...params,
  };
  
  // Merge default options with performance optimizations
  const queryOptions = {
    enabled: true,
    // Cache for 5 minutes per React/Next.js Integration Requirements
    staleTime: 5 * 60 * 1000, // 300 seconds
    // Keep in cache for 15 minutes
    cacheTime: 15 * 60 * 1000, // 900 seconds
    // Retry failed requests with exponential backoff
    retry: 3,
    // Background refetch every 5 minutes for real-time synchronization
    refetchInterval: 5 * 60 * 1000, // 300 seconds
    // Enable background refetching when window regains focus
    refetchOnWindowFocus: true,
    // Enable background refetching when coming back online
    refetchOnReconnect: true,
    // Keep previous data while fetching new data
    keepPreviousData: true,
    ...options,
  };
  
  const query = useQuery({
    queryKey: getQueryKey(queryParams),
    queryFn: () => fetchSchedulerTasks(queryParams),
    ...queryOptions,
  });
  
  // Calculate metadata from response
  const meta = query.data ? {
    page: query.data.page || 1,
    pageSize: query.data.pageSize || queryParams.limit || 25,
    totalPages: Math.ceil((query.data.total || 0) / (queryParams.limit || 25)),
    hasMore: query.data.hasMore || false,
  } : undefined;
  
  // Invalidate function for manual cache invalidation
  const invalidate = async (): Promise<void> => {
    await queryClient.invalidateQueries({
      queryKey: ['scheduler-tasks'],
    });
  };
  
  return {
    data: query.data?.data,
    total: query.data?.total,
    meta,
    isLoading: query.isLoading,
    isFetching: query.isFetching,
    error: query.error as Error | null,
    isStale: query.isStale,
    refetch: query.refetch,
    invalidate,
  };
}

/**
 * Utility hook for invalidating scheduler task queries
 * Useful for triggering refetch after mutations
 */
export function useInvalidateSchedulerTasks() {
  const queryClient = useQueryClient();
  
  return async (): Promise<void> => {
    await queryClient.invalidateQueries({
      queryKey: ['scheduler-tasks'],
    });
  };
}

/**
 * Utility hook for prefetching scheduler tasks
 * Useful for performance optimization in navigation scenarios
 */
export function usePrefetchSchedulerTasks() {
  const queryClient = useQueryClient();
  
  return (params: SchedulerTaskQueryParams = {}): void => {
    const queryParams = { limit: 25, offset: 0, ...params };
    
    queryClient.prefetchQuery({
      queryKey: getQueryKey(queryParams),
      queryFn: () => fetchSchedulerTasks(queryParams),
      staleTime: 5 * 60 * 1000, // 5 minutes
    });
  };
}

// Export types for external use
export type { SchedulerTaskQueryParams, UseSchedulerTasksOptions, UseSchedulerTasksResult };