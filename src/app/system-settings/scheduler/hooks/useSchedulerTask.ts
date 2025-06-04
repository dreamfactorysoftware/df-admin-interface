import { useQuery } from '@tanstack/react-query'
import { apiClient } from '@/lib/api-client'
import type { SchedulerTaskData } from '@/types/scheduler'

/**
 * React Query hook for fetching individual scheduler task data
 * 
 * Replaces Angular ActivatedRoute.data subscription patterns with intelligent caching
 * and conditional fetching. Implements automatic background synchronization and 
 * comprehensive error handling for scheduler task details display and editing operations.
 * 
 * @param taskId - The ID of the scheduler task to fetch. When null/undefined, the query is disabled
 * @returns Query object with loading, error, and data states for component consumption
 */
export function useSchedulerTask(taskId: string | number | null | undefined) {
  return useQuery({
    // Unique query key for React Query cache management
    queryKey: ['scheduler-task', taskId] as const,
    
    // Query function with conditional execution
    queryFn: async () => {
      if (!taskId) {
        throw new Error('Task ID is required')
      }

      try {
        // Fetch scheduler task with related task log data
        // Matches Angular implementation: fields: '*', related: 'task_log_by_task_id'
        const response = await apiClient.get<SchedulerTaskData>(
          `/system/scheduler/${taskId}`,
          {
            params: {
              fields: '*',
              related: 'task_log_by_task_id'
            }
          }
        )

        return response.data
      } catch (error: any) {
        // Enhanced error handling with contextual messaging per Section 4.2
        if (error.response?.status === 404) {
          throw new Error(`Scheduler task with ID ${taskId} not found`)
        }
        
        if (error.response?.status === 403) {
          throw new Error('Access denied. You do not have permission to view this scheduler task')
        }
        
        if (error.response?.status >= 500) {
          throw new Error('Server error occurred while fetching scheduler task. Please try again later')
        }
        
        // Generic error handling for other cases
        throw new Error(
          error.response?.data?.error?.message || 
          error.message || 
          'Failed to fetch scheduler task'
        )
      }
    },

    // Conditional fetching - only enabled when valid task ID is provided
    enabled: Boolean(taskId),

    // Intelligent caching configuration per React/Next.js Integration Requirements
    staleTime: 5 * 60 * 1000, // 300 seconds (5 minutes)
    gcTime: 15 * 60 * 1000, // 15 minutes garbage collection time
    
    // Background revalidation for real-time data synchronization
    refetchOnWindowFocus: true,
    refetchOnReconnect: true,
    
    // Retry configuration for network resilience
    retry: (failureCount, error: any) => {
      // Don't retry on 404 or 403 errors
      if (error.response?.status === 404 || error.response?.status === 403) {
        return false
      }
      
      // Retry up to 3 times for other errors
      return failureCount < 3
    },
    
    // Retry delay with exponential backoff
    retryDelay: attemptIndex => Math.min(1000 * 2 ** attemptIndex, 30000),
  })
}

/**
 * Type definition for the hook's return value
 * Provides comprehensive state information for component consumption
 */
export type UseSchedulerTaskResult = ReturnType<typeof useSchedulerTask>