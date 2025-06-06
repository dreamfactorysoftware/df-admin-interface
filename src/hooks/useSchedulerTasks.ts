/**
 * Scheduler Tasks React Query Hook
 * 
 * Provides data fetching, caching, and synchronization for scheduler tasks
 * using React Query. Replaces Angular RxJS observables with modern React patterns.
 * Supports filtering, pagination, and real-time updates with optimistic UI.
 */

'use client';

import { useQuery, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import type { 
  SchedulerTaskData, 
  SchedulerTaskListResponse, 
  SchedulerTaskFilters, 
  SchedulerTaskSort 
} from '@/types/scheduler';

export interface UseSchedulerTasksOptions {
  /**
   * Current page number (1-based)
   */
  page?: number;
  /**
   * Number of items per page
   */
  pageSize?: number;
  /**
   * Search query for filtering tasks
   */
  search?: string;
  /**
   * Additional filters
   */
  filters?: SchedulerTaskFilters;
  /**
   * Sort configuration
   */
  sort?: SchedulerTaskSort;
  /**
   * Whether to enable the query
   */
  enabled?: boolean;
  /**
   * Stale time in milliseconds
   */
  staleTime?: number;
  /**
   * Cache time in milliseconds
   */
  cacheTime?: number;
}

export interface UseSchedulerTasksReturn {
  /**
   * Scheduler tasks data
   */
  data: SchedulerTaskData[];
  /**
   * Total count of tasks
   */
  total: number;
  /**
   * Current page
   */
  page: number;
  /**
   * Page size
   */
  pageSize: number;
  /**
   * Whether there are more pages
   */
  hasMore: boolean;
  /**
   * Loading state
   */
  isLoading: boolean;
  /**
   * Error state
   */
  isError: boolean;
  /**
   * Error object
   */
  error: Error | null;
  /**
   * Whether data is being fetched in background
   */
  isFetching: boolean;
  /**
   * Whether data is stale
   */
  isStale: boolean;
  /**
   * Refetch function
   */
  refetch: () => Promise<any>;
  /**
   * Invalidate cache and refetch
   */
  invalidate: () => Promise<void>;
}

/**
 * Build query parameters for API request
 */
const buildQueryParams = (options: UseSchedulerTasksOptions) => {
  const params = new URLSearchParams();
  
  // Pagination
  if (options.page) {
    params.set('offset', ((options.page - 1) * (options.pageSize || 25)).toString());
  }
  if (options.pageSize) {
    params.set('limit', options.pageSize.toString());
  }
  
  // Search and filters
  const filterConditions: string[] = [];
  
  if (options.search) {
    filterConditions.push(`(name like "%${options.search}%" or description like "%${options.search}%")`);
  }
  
  if (options.filters?.name) {
    filterConditions.push(`name like "%${options.filters.name}%"`);
  }
  
  if (options.filters?.isActive !== undefined) {
    filterConditions.push(`isActive = ${options.filters.isActive ? 1 : 0}`);
  }
  
  if (options.filters?.serviceId) {
    filterConditions.push(`serviceId = "${options.filters.serviceId}"`);
  }
  
  if (options.filters?.verb) {
    filterConditions.push(`verb = "${options.filters.verb}"`);
  }
  
  if (options.filters?.component) {
    filterConditions.push(`component like "%${options.filters.component}%"`);
  }
  
  if (filterConditions.length > 0) {
    params.set('filter', filterConditions.join(' and '));
  }
  
  // Sorting
  if (options.sort) {
    params.set('order', `${options.sort.field} ${options.sort.direction}`);
  }
  
  // Include related data
  params.set('related', 'serviceByServiceId,taskLogByTaskId');
  
  return params.toString();
};

/**
 * React Query key factory for scheduler tasks
 */
export const schedulerTasksKeys = {
  all: ['schedulerTasks'] as const,
  lists: () => [...schedulerTasksKeys.all, 'list'] as const,
  list: (params: string) => [...schedulerTasksKeys.lists(), params] as const,
  details: () => [...schedulerTasksKeys.all, 'detail'] as const,
  detail: (id: string) => [...schedulerTasksKeys.details(), id] as const,
};

/**
 * Fetch scheduler tasks from API
 */
const fetchSchedulerTasks = async (options: UseSchedulerTasksOptions): Promise<SchedulerTaskListResponse> => {
  const queryParams = buildQueryParams(options);
  const endpoint = `/system/scheduler${queryParams ? `?${queryParams}` : ''}`;
  
  const response = await apiClient.get<{ resource: SchedulerTaskData[]; meta: { count: number } }>(endpoint);
  
  if (!response.resource && !response.data) {
    throw new Error('Invalid response format from scheduler API');
  }
  
  const data = response.resource || response.data || [];
  const meta = (response as any).meta || {};
  
  return {
    data: Array.isArray(data) ? data : [],
    total: meta.count || 0,
    page: options.page || 1,
    pageSize: options.pageSize || 25,
    hasMore: data.length === (options.pageSize || 25),
  };
};

/**
 * Hook for fetching scheduler tasks with React Query
 */
export const useSchedulerTasks = (options: UseSchedulerTasksOptions = {}): UseSchedulerTasksReturn => {
  const queryClient = useQueryClient();
  
  const {
    page = 1,
    pageSize = 25,
    search = '',
    filters,
    sort,
    enabled = true,
    staleTime = 5 * 60 * 1000, // 5 minutes
    cacheTime = 10 * 60 * 1000, // 10 minutes
  } = options;
  
  const queryParams = buildQueryParams({ page, pageSize, search, filters, sort });
  const queryKey = schedulerTasksKeys.list(queryParams);
  
  const {
    data,
    isLoading,
    isError,
    error,
    isFetching,
    isStale,
    refetch,
  } = useQuery({
    queryKey,
    queryFn: () => fetchSchedulerTasks({ page, pageSize, search, filters, sort }),
    enabled,
    staleTime,
    cacheTime,
    keepPreviousData: true, // Keep previous data while fetching new page
    refetchOnWindowFocus: false,
    refetchOnMount: true,
    refetchOnReconnect: true,
  });
  
  const invalidate = async () => {
    await queryClient.invalidateQueries({ queryKey: schedulerTasksKeys.lists() });
  };
  
  return {
    data: data?.data || [],
    total: data?.total || 0,
    page: data?.page || page,
    pageSize: data?.pageSize || pageSize,
    hasMore: data?.hasMore || false,
    isLoading,
    isError,
    error: error as Error | null,
    isFetching,
    isStale,
    refetch,
    invalidate,
  };
};

/**
 * Hook for prefetching next page of scheduler tasks
 */
export const usePrefetchSchedulerTasks = () => {
  const queryClient = useQueryClient();
  
  return (options: UseSchedulerTasksOptions) => {
    const queryParams = buildQueryParams(options);
    const queryKey = schedulerTasksKeys.list(queryParams);
    
    queryClient.prefetchQuery({
      queryKey,
      queryFn: () => fetchSchedulerTasks(options),
      staleTime: 5 * 60 * 1000,
    });
  };
};

export default useSchedulerTasks;