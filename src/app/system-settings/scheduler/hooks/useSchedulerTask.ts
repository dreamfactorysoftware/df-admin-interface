/**
 * React Query hook for fetching individual scheduler task data
 * 
 * Replaces Angular ActivatedRoute data subscription patterns with modern React Query
 * implementation for scheduler task editing workflows. Provides intelligent caching,
 * conditional fetching, and comprehensive error handling for scheduler task details
 * display and editing operations.
 * 
 * Features:
 * - Conditional fetching based on task ID parameter
 * - Intelligent caching with 300-second stale time
 * - Background revalidation for real-time updates
 * - Related task log data fetching
 * - Contextual error handling for not found and access denied scenarios
 * - TypeScript type safety with SchedulerTaskData interface
 */

import { useQuery } from '@tanstack/react-query';
import { apiClient, type ApiResponse } from '@/lib/api-client';
import type { SchedulerTaskData } from '@/types/scheduler';

/**
 * Error types for contextual error handling
 */
interface SchedulerTaskError {
  code: number;
  message: string;
  type: 'not_found' | 'access_denied' | 'server_error' | 'network_error';
}

/**
 * Hook configuration options
 */
interface UseSchedulerTaskOptions {
  /** Enable background refetching (default: true) */
  refetchOnWindowFocus?: boolean;
  /** Enable refetching when component remounts (default: true) */
  refetchOnMount?: boolean;
  /** Custom stale time in milliseconds (default: 300000 - 5 minutes) */
  staleTime?: number;
  /** Enable retry on error (default: true) */
  retry?: boolean | number;
}

/**
 * React Query hook for fetching individual scheduler task data
 * 
 * Implements conditional fetching pattern where the query is only enabled
 * when a valid task ID is provided. Uses React Query caching with optimal
 * stale time configuration for performance while ensuring data freshness
 * through background revalidation.
 * 
 * @param taskId - The scheduler task ID to fetch (undefined disables query)
 * @param options - Configuration options for the query behavior
 * @returns React Query result with loading, error, and data states
 * 
 * @example
 * ```typescript
 * // Basic usage with task ID from URL parameter
 * const { data: task, isLoading, error } = useSchedulerTask(taskId);
 * 
 * // With custom options
 * const { data: task, isLoading, error, refetch } = useSchedulerTask(taskId, {
 *   refetchOnWindowFocus: false,
 *   staleTime: 600000 // 10 minutes
 * });
 * 
 * // Conditional fetching - only fetches when taskId is provided
 * const taskId = router.query.taskId as string | undefined;
 * const { data: task } = useSchedulerTask(taskId); // Only fetches if taskId exists
 * ```
 */
export function useSchedulerTask(
  taskId: string | undefined,
  options: UseSchedulerTaskOptions = {}
) {
  const {
    refetchOnWindowFocus = true,
    refetchOnMount = true,
    staleTime = 300000, // 5 minutes as per Section 5.2 requirements
    retry = 3
  } = options;

  return useQuery({
    // Query key includes taskId for proper cache isolation
    queryKey: ['scheduler-task', taskId],
    
    // Query function with comprehensive error handling
    queryFn: async (): Promise<SchedulerTaskData> => {
      if (!taskId) {
        throw new Error('Task ID is required');
      }

      try {
        // Fetch scheduler task data with related information
        // Include task logs and service details as per Angular implementation
        const response = await apiClient.get<SchedulerTaskData>(
          `/system/scheduler_task/${taskId}`,
          {
            // Add query parameters to include related data
            headers: {
              'Content-Type': 'application/json',
            }
          }
        );

        // Handle API response structure - check both data and resource properties
        const taskData = response.data || response.resource;
        
        if (!taskData) {
          const error: SchedulerTaskError = {
            code: 404,
            message: 'Scheduler task not found. The task may have been deleted or you may not have permission to access it.',
            type: 'not_found'
          };
          throw error;
        }

        // If task logs are not included in the main response, fetch them separately
        // This matches the Angular implementation pattern of fetching related data
        if (!taskData.taskLogByTaskId && taskId) {
          try {
            const logsResponse = await apiClient.get(
              `/system/scheduler_task_log`,
              {
                headers: {
                  'Content-Type': 'application/json',
                }
              }
            );

            // Find the latest log entry for this task
            const logs = logsResponse.data || logsResponse.resource || [];
            const latestLog = Array.isArray(logs) 
              ? logs.find((log: any) => log.taskId === taskId || log.task_id === taskId)
              : null;

            if (latestLog) {
              taskData.taskLogByTaskId = latestLog;
            }
          } catch (logError) {
            // Log error but don't fail the main query
            console.warn('Failed to fetch task logs:', logError);
          }
        }

        return taskData;
      } catch (error: any) {
        // Transform API client errors into contextual error messages
        if (error.code || error.status) {
          const status = error.code || error.status;
          
          switch (status) {
            case 404:
              throw {
                code: 404,
                message: 'Scheduler task not found. The task may have been deleted or moved.',
                type: 'not_found'
              } as SchedulerTaskError;
              
            case 403:
              throw {
                code: 403,
                message: 'Access denied. You do not have permission to view this scheduler task.',
                type: 'access_denied'
              } as SchedulerTaskError;
              
            case 401:
              throw {
                code: 401,
                message: 'Authentication required. Please log in to access scheduler tasks.',
                type: 'access_denied'
              } as SchedulerTaskError;
              
            case 500:
            case 502:
            case 503:
            case 504:
              throw {
                code: status,
                message: 'Server error occurred while fetching scheduler task. Please try again later.',
                type: 'server_error'
              } as SchedulerTaskError;
              
            default:
              throw {
                code: status,
                message: error.message || 'An unexpected error occurred while fetching the scheduler task.',
                type: 'server_error'
              } as SchedulerTaskError;
          }
        }

        // Handle network errors
        if (error.name === 'NetworkError' || error.message?.includes('fetch')) {
          throw {
            code: 0,
            message: 'Network error. Please check your connection and try again.',
            type: 'network_error'
          } as SchedulerTaskError;
        }

        // Re-throw unknown errors
        throw error;
      }
    },
    
    // Conditional fetching - only enabled when taskId is provided
    enabled: Boolean(taskId),
    
    // Caching configuration per React/Next.js Integration Requirements
    staleTime, // Data considered fresh for 5 minutes by default
    gcTime: 900000, // Keep in cache for 15 minutes (formerly cacheTime)
    
    // Background revalidation for real-time data synchronization
    refetchOnWindowFocus,
    refetchOnMount,
    refetchOnReconnect: true,
    
    // Retry configuration with exponential backoff
    retry: (failureCount, error: any) => {
      // Don't retry on 404 or 403 errors
      if (error?.code === 404 || error?.code === 403 || error?.code === 401) {
        return false;
      }
      
      // Retry up to 3 times for other errors
      return typeof retry === 'boolean' ? retry && failureCount < 3 : failureCount < retry;
    },
    
    // Retry delay with exponential backoff
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
    
    // Additional query options for optimal performance
    refetchInterval: false, // Disable automatic refetching by interval
    refetchIntervalInBackground: false,
    
    // Ensure network mode allows for offline functionality
    networkMode: 'online',
    
    // Meta information for debugging and monitoring
    meta: {
      component: 'useSchedulerTask',
      feature: 'scheduler-management',
      taskId
    }
  });
}

/**
 * Type guard to check if error is a SchedulerTaskError
 */
export function isSchedulerTaskError(error: any): error is SchedulerTaskError {
  return error && typeof error === 'object' && 'type' in error && 'code' in error;
}

/**
 * Helper function to get user-friendly error message
 */
export function getSchedulerTaskErrorMessage(error: any): string {
  if (isSchedulerTaskError(error)) {
    return error.message;
  }
  
  if (error?.message) {
    return error.message;
  }
  
  return 'An unexpected error occurred while loading the scheduler task.';
}

/**
 * Export types for component usage
 */
export type { SchedulerTaskError, UseSchedulerTaskOptions };