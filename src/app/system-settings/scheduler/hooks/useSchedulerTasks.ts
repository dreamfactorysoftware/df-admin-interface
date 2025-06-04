'use client';

import { useQuery, UseQueryResult } from '@tanstack/react-query';
import { useState, useCallback } from 'react';
import { SchedulerTaskData } from '@/types/scheduler';
import { GenericListResponse, RequestOptions } from '@/types/generic-http';
import { apiClient } from '@/lib/api-client';

/**
 * Query parameters for scheduler task list fetching
 */
export interface SchedulerTasksQueryParams {
  /** Number of items to return (pagination) */
  limit?: number;
  /** Number of items to skip (pagination) */
  offset?: number;
  /** Search filter for task names and descriptions */
  filter?: string;
  /** Additional query parameters */
  [key: string]: any;
}

/**
 * Hook return interface providing scheduler task data and operations
 */
export interface UseSchedulerTasksReturn {
  /** Scheduler task data array */
  data: SchedulerTaskData[] | undefined;
  /** Loading state indicator */
  isLoading: boolean;
  /** Error state information */
  error: Error | null;
  /** Background fetching indicator */
  isFetching: boolean;
  /** Data fetching success indicator */
  isSuccess: boolean;
  /** Data fetching error indicator */
  isError: boolean;
  /** Total count of scheduler tasks */
  totalCount: number;
  /** Function to refresh scheduler task data */
  refetch: () => Promise<UseQueryResult<GenericListResponse<SchedulerTaskData>>>;
  /** Function to invalidate and refetch data */
  invalidate: () => Promise<void>;
}

/**
 * Default query parameters following Angular implementation patterns
 */
const DEFAULT_PARAMS: SchedulerTasksQueryParams = {
  limit: 25,
  offset: 0,
  filter: '',
};

/**
 * React Query hook for scheduler task list management
 * 
 * Replaces Angular DfManageSchedulerTableComponent data fetching with modern server state management.
 * Implements intelligent caching, pagination, filtering, and background synchronization for scheduler 
 * task lists following TanStack React Query best practices.
 * 
 * Features:
 * - Intelligent caching with staleTime: 300 seconds for optimal performance
 * - Pagination support with limit/offset parameters matching Angular implementation
 * - Filtering support for task names and descriptions via search query
 * - Background refetching for real-time data synchronization
 * - Comprehensive error handling with retry capabilities
 * - TypeScript type safety with SchedulerTaskData interface
 * 
 * @param params - Query parameters for filtering and pagination
 * @returns Hook interface with data, loading states, and control functions
 * 
 * @example
 * ```tsx
 * const {
 *   data,
 *   isLoading,
 *   error,
 *   totalCount,
 *   refetch
 * } = useSchedulerTasks({
 *   limit: 25,
 *   offset: 0,
 *   filter: 'daily'
 * });
 * 
 * if (isLoading) return <LoadingSpinner />;
 * if (error) return <ErrorMessage error={error} onRetry={() => refetch()} />;
 * 
 * return (
 *   <SchedulerTaskTable 
 *     tasks={data || []}
 *     totalCount={totalCount}
 *   />
 * );
 * ```
 */
export function useSchedulerTasks(
  params: SchedulerTasksQueryParams = {}
): UseSchedulerTasksReturn {
  // Merge provided parameters with defaults
  const queryParams = { ...DEFAULT_PARAMS, ...params };
  
  // State for total count tracking
  const [totalCount, setTotalCount] = useState<number>(0);

  /**
   * Fetcher function for scheduler tasks API call
   * Implements RequestOptions pattern from Angular service
   */
  const fetchSchedulerTasks = useCallback(async (): Promise<GenericListResponse<SchedulerTaskData>> => {
    try {
      // Build request options matching Angular DfBaseCrudService.getAll() pattern
      const requestOptions: Partial<RequestOptions> = {
        limit: queryParams.limit || 25,
        offset: queryParams.offset || 0,
        filter: queryParams.filter || '',
        includeCount: true,
        showSpinner: false, // Handled by React Query loading states
        snackbarError: '', // Error handling managed by hook consumer
        refresh: false, // Managed by React Query cache
      };

      // Call API client with scheduler tasks endpoint
      // Matches Angular service pattern: this.service.getAll({ limit, offset, filter })
      const response = await apiClient.get<GenericListResponse<SchedulerTaskData>>(
        '/system/task',
        { params: requestOptions }
      );

      return response.data;
    } catch (error) {
      // Re-throw error for React Query error handling
      throw error instanceof Error ? error : new Error('Failed to fetch scheduler tasks');
    }
  }, [queryParams.limit, queryParams.offset, queryParams.filter]);

  /**
   * React Query configuration with intelligent caching
   * Implements React/Next.js Integration Requirements for data fetching
   */
  const queryResult = useQuery<GenericListResponse<SchedulerTaskData>, Error>({
    // Query key includes all parameters for proper cache invalidation
    // Following React Query patterns for parameterized queries
    queryKey: ['scheduler-tasks', queryParams],
    
    // Query function using our fetcher
    queryFn: fetchSchedulerTasks,
    
    // Caching configuration per Section 5.2 Component Details
    // staleTime: 300 seconds for optimal performance per React/Next.js Integration Requirements
    staleTime: 5 * 60 * 1000, // 300 seconds
    
    // cacheTime: 900 seconds per Section 5.2 caching requirements
    gcTime: 15 * 60 * 1000, // 900 seconds (formerly cacheTime in v4)
    
    // Background refetching enabled for real-time data synchronization per Section 4.3.2
    refetchOnWindowFocus: true,
    refetchOnMount: true,
    refetchOnReconnect: true,
    
    // Retry configuration for comprehensive error handling
    retry: (failureCount, error) => {
      // Don't retry on 4xx errors (client errors)
      if (error && 'status' in error && typeof error.status === 'number') {
        if (error.status >= 400 && error.status < 500) {
          return false;
        }
      }
      // Retry up to 3 times for network/server errors
      return failureCount < 3;
    },
    
    // Retry delay with exponential backoff
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
    
    // Enable background updates when data becomes stale
    refetchInterval: false, // Manual control via background refetching
    
    // Error handling configuration
    throwOnError: false, // Handle errors through hook interface
    
    // Success callback to update total count
    onSuccess: (data) => {
      if (data?.meta?.count !== undefined) {
        setTotalCount(data.meta.count);
      }
    },
  });

  /**
   * Invalidate function for manual cache invalidation
   * Provides optimistic updates preparation for CRUD operations per Section 4.4.4.2
   */
  const invalidate = useCallback(async (): Promise<void> => {
    // Use React Query's query client to invalidate related queries
    const queryClient = queryResult.refetch;
    await queryClient();
  }, [queryResult.refetch]);

  // Extract and transform query result data
  const transformedData = queryResult.data?.resource;

  /**
   * Return hook interface with all required states and functions
   * Matches Angular component expectations for loading, error, and data states
   */
  return {
    // Data state - scheduler task array from API response
    data: transformedData,
    
    // Loading states per React Query patterns
    isLoading: queryResult.isLoading,
    isFetching: queryResult.isFetching,
    isSuccess: queryResult.isSuccess,
    isError: queryResult.isError,
    
    // Error state with user-friendly error messages
    error: queryResult.error,
    
    // Total count for pagination
    totalCount,
    
    // Control functions
    refetch: queryResult.refetch,
    invalidate,
  };
}

/**
 * Export hook as default for convenient importing
 */
export default useSchedulerTasks;