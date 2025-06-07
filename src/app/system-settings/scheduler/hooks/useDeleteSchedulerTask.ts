/**
 * React Query mutation hook for scheduler task deletion
 * 
 * This hook implements optimistic updates with automatic rollback on failure,
 * providing immediate UI feedback while maintaining data consistency.
 * Replaces Angular service.delete() patterns with modern React Query mutations.
 * 
 * Features:
 * - Optimistic deletion with immediate UI feedback per Section 4.4.4.2
 * - Automatic rollback on deletion failure with error notification
 * - Cache invalidation for related scheduler queries
 * - Comprehensive error handling for deletion restrictions and permissions
 * - TypeScript type safety for deletion responses and error types per Section 3.1
 * - Confirmation workflow integration per UI patterns
 */

import { useMutation, useQueryClient, type UseMutationOptions } from '@tanstack/react-query';
import { apiClient, type ApiResponse } from '@/lib/api-client';
import { showNotification } from '@/lib/notifications';
import type { SchedulerTaskData } from '@/types/scheduler';

/**
 * Deletion response interface for type safety
 */
interface DeleteSchedulerTaskResponse {
  success: boolean;
  message?: string;
  deletedId: string;
}

/**
 * Enhanced error interface for scheduler deletion failures
 */
interface SchedulerDeletionError extends Error {
  code?: string;
  statusCode?: number;
  details?: {
    reason?: 'permission_denied' | 'task_running' | 'dependency_exists' | 'unknown';
    relatedTasks?: string[];
    requiredPermissions?: string[];
  };
}

/**
 * Hook options interface for customization
 */
interface UseDeleteSchedulerTaskOptions {
  onSuccess?: (data: DeleteSchedulerTaskResponse, taskId: string) => void;
  onError?: (error: SchedulerDeletionError, taskId: string) => void;
  onSettled?: (data: DeleteSchedulerTaskResponse | undefined, error: SchedulerDeletionError | null, taskId: string) => void;
  enableOptimisticUpdates?: boolean;
  showNotifications?: boolean;
}

/**
 * Query keys for cache management
 */
const SCHEDULER_QUERY_KEYS = {
  tasks: ['scheduler-tasks'] as const,
  task: (id: string) => ['scheduler-task', id] as const,
  taskLogs: (id: string) => ['scheduler-task-logs', id] as const,
} as const;

/**
 * React Query mutation hook for deleting scheduler tasks
 * 
 * Implements optimistic updates per Section 4.4.4.2 state management workflows:
 * 1. Immediately removes task from cache (optimistic update)
 * 2. Sends deletion request to server
 * 3. On success: confirms the optimistic update and shows success notification
 * 4. On failure: rolls back the optimistic update and shows error notification
 * 
 * @param options - Configuration options for the mutation
 * @returns React Query mutation object with enhanced state management
 */
export function useDeleteSchedulerTask(options: UseDeleteSchedulerTaskOptions = {}) {
  const queryClient = useQueryClient();
  
  const {
    onSuccess,
    onError,
    onSettled,
    enableOptimisticUpdates = true,
    showNotifications = true,
  } = options;

  return useMutation<DeleteSchedulerTaskResponse, SchedulerDeletionError, string>({
    mutationFn: async (taskId: string): Promise<DeleteSchedulerTaskResponse> => {
      try {
        // Execute deletion API call
        const response: ApiResponse<DeleteSchedulerTaskResponse> = await apiClient.delete(
          `/system/scheduler/${taskId}`,
          {
            retries: 1, // Single retry for deletion operations
            timeout: 15000, // 15 second timeout for deletion
          }
        );

        // Handle different response formats from DreamFactory API
        if (response.success || response.data?.success) {
          return {
            success: true,
            message: response.message || response.data?.message || 'Task deleted successfully',
            deletedId: taskId,
          };
        }

        // Handle API error responses
        throw new Error(response.error?.message || 'Failed to delete scheduler task');
      } catch (error) {
        // Enhanced error handling with specific error categorization
        const schedulerError = error as SchedulerDeletionError;
        
        // Categorize error based on HTTP status and message content
        if (schedulerError.message?.includes('permission') || schedulerError.message?.includes('unauthorized')) {
          schedulerError.code = 'PERMISSION_DENIED';
          schedulerError.details = {
            reason: 'permission_denied',
            requiredPermissions: ['scheduler.delete', 'system.admin'],
          };
        } else if (schedulerError.message?.includes('running') || schedulerError.message?.includes('active')) {
          schedulerError.code = 'TASK_RUNNING';
          schedulerError.details = {
            reason: 'task_running',
          };
        } else if (schedulerError.message?.includes('dependency') || schedulerError.message?.includes('reference')) {
          schedulerError.code = 'DEPENDENCY_EXISTS';
          schedulerError.details = {
            reason: 'dependency_exists',
          };
        } else {
          schedulerError.code = 'UNKNOWN_ERROR';
          schedulerError.details = {
            reason: 'unknown',
          };
        }

        throw schedulerError;
      }
    },

    onMutate: async (taskId: string) => {
      if (!enableOptimisticUpdates) return;

      // Cancel outgoing refetches to prevent race conditions
      await queryClient.cancelQueries({ queryKey: SCHEDULER_QUERY_KEYS.tasks });
      await queryClient.cancelQueries({ queryKey: SCHEDULER_QUERY_KEYS.task(taskId) });

      // Snapshot the previous value for rollback
      const previousTasks = queryClient.getQueryData<{ data: SchedulerTaskData[] }>(SCHEDULER_QUERY_KEYS.tasks);
      const previousTask = queryClient.getQueryData<SchedulerTaskData>(SCHEDULER_QUERY_KEYS.task(taskId));

      // Optimistically remove the task from the tasks list
      if (previousTasks?.data) {
        queryClient.setQueryData<{ data: SchedulerTaskData[] }>(
          SCHEDULER_QUERY_KEYS.tasks,
          {
            ...previousTasks,
            data: previousTasks.data.filter(task => task.id !== taskId),
          }
        );
      }

      // Remove individual task cache entry
      queryClient.removeQueries({ queryKey: SCHEDULER_QUERY_KEYS.task(taskId) });

      // Return context for rollback
      return { previousTasks, previousTask, taskId };
    },

    onError: (error: SchedulerDeletionError, taskId: string, context) => {
      // Rollback optimistic updates per Section 4.4.4.2
      if (enableOptimisticUpdates && context) {
        if (context.previousTasks) {
          queryClient.setQueryData(SCHEDULER_QUERY_KEYS.tasks, context.previousTasks);
        }
        if (context.previousTask) {
          queryClient.setQueryData(SCHEDULER_QUERY_KEYS.task(taskId), context.previousTask);
        }
      }

      // Show contextual error notifications per Section 4.2
      if (showNotifications) {
        const errorMessage = getErrorMessage(error);
        showNotification({
          type: 'error',
          title: 'Failed to Delete Task',
          message: errorMessage,
          duration: 8000, // Longer duration for error messages
          action: {
            label: 'Retry',
            onClick: () => {
              // Retry functionality can be implemented by the consuming component
            },
          },
        });
      }

      // Call custom error handler
      onError?.(error, taskId);
    },

    onSuccess: (data: DeleteSchedulerTaskResponse, taskId: string) => {
      // Show success notification
      if (showNotifications) {
        showNotification({
          type: 'success',
          title: 'Task Deleted',
          message: data.message || 'Scheduler task deleted successfully',
          duration: 4000,
        });
      }

      // Invalidate and refetch related queries to ensure consistency
      queryClient.invalidateQueries({ queryKey: SCHEDULER_QUERY_KEYS.tasks });
      queryClient.invalidateQueries({ queryKey: SCHEDULER_QUERY_KEYS.taskLogs(taskId) });
      
      // Remove the specific task from cache
      queryClient.removeQueries({ queryKey: SCHEDULER_QUERY_KEYS.task(taskId) });

      // Call custom success handler
      onSuccess?.(data, taskId);
    },

    onSettled: (data, error, taskId) => {
      // Always refetch tasks list to ensure consistency regardless of outcome
      queryClient.invalidateQueries({ queryKey: SCHEDULER_QUERY_KEYS.tasks });
      
      // Call custom settled handler
      onSettled?.(data, error, taskId);
    },

    // React Query mutation options
    retry: false, // Don't auto-retry deletions to prevent unintended data loss
    networkMode: 'online', // Only execute when online
  });
}

/**
 * Generate user-friendly error messages based on error type
 * Provides specific guidance for different failure scenarios per Section 4.2
 */
function getErrorMessage(error: SchedulerDeletionError): string {
  switch (error.details?.reason) {
    case 'permission_denied':
      return 'You don\'t have permission to delete this scheduler task. Contact your administrator to request the necessary permissions.';
    
    case 'task_running':
      return 'Cannot delete task while it is currently running. Please wait for the task to complete or stop it manually before deletion.';
    
    case 'dependency_exists':
      return 'Cannot delete task because other components depend on it. Please remove dependencies first and try again.';
    
    default:
      // Fallback to original error message with safety check
      return error.message || 'An unexpected error occurred while deleting the scheduler task. Please try again.';
  }
}

/**
 * Type-safe hook return interface for better developer experience
 */
export type UseDeleteSchedulerTaskReturn = ReturnType<typeof useDeleteSchedulerTask>;

/**
 * Export types for external use
 */
export type {
  DeleteSchedulerTaskResponse,
  SchedulerDeletionError,
  UseDeleteSchedulerTaskOptions,
};