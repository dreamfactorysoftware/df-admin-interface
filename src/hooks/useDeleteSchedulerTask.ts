/**
 * Delete Scheduler Task React Query Mutation Hook
 * 
 * Provides optimistic updates and cache invalidation for scheduler task deletion.
 * Replaces Angular CRUD service with React Query mutations for better UX.
 * Includes error handling, rollback capabilities, and toast notifications.
 */

'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import { schedulerTasksKeys } from './useSchedulerTasks';
import type { SchedulerTaskData } from '@/types/scheduler';

export interface DeleteSchedulerTaskOptions {
  /**
   * Scheduler task ID to delete
   */
  taskId: string;
  /**
   * Whether to show success notification
   */
  showSuccessNotification?: boolean;
  /**
   * Whether to show error notification
   */
  showErrorNotification?: boolean;
  /**
   * Custom success message
   */
  successMessage?: string;
  /**
   * Custom error message
   */
  errorMessage?: string;
}

export interface UseDeleteSchedulerTaskReturn {
  /**
   * Mutation function to delete a task
   */
  deleteTask: (options: DeleteSchedulerTaskOptions) => Promise<void>;
  /**
   * Whether the deletion is in progress
   */
  isLoading: boolean;
  /**
   * Whether the last deletion failed
   */
  isError: boolean;
  /**
   * Error from the last deletion attempt
   */
  error: Error | null;
  /**
   * Whether the last deletion was successful
   */
  isSuccess: boolean;
  /**
   * Reset the mutation state
   */
  reset: () => void;
}

/**
 * Delete scheduler task via API
 */
const deleteSchedulerTask = async (taskId: string): Promise<void> => {
  const response = await apiClient.delete(`/system/scheduler/${taskId}`);
  
  if (!response.success && response.error) {
    throw new Error(response.error.message || 'Failed to delete scheduler task');
  }
};

/**
 * Hook for deleting scheduler tasks with optimistic updates
 */
export const useDeleteSchedulerTask = (): UseDeleteSchedulerTaskReturn => {
  const queryClient = useQueryClient();
  
  const mutation = useMutation({
    mutationFn: deleteSchedulerTask,
    
    // Optimistic update: remove the task from cache immediately
    onMutate: async (taskId: string) => {
      // Cancel any outgoing refetches to avoid overwriting optimistic update
      await queryClient.cancelQueries({ queryKey: schedulerTasksKeys.lists() });
      
      // Snapshot the previous value for rollback
      const previousTasks = queryClient.getQueriesData({
        queryKey: schedulerTasksKeys.lists(),
      });
      
      // Optimistically remove the task from all cached queries
      queryClient.setQueriesData(
        { queryKey: schedulerTasksKeys.lists() },
        (oldData: any) => {
          if (!oldData?.data) return oldData;
          
          return {
            ...oldData,
            data: oldData.data.filter((task: SchedulerTaskData) => task.id !== taskId),
            total: Math.max(0, (oldData.total || 0) - 1),
          };
        }
      );
      
      return { previousTasks };
    },
    
    // On success, invalidate queries to ensure fresh data
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: schedulerTasksKeys.lists() });
    },
    
    // On error, rollback the optimistic update
    onError: (error, taskId, context) => {
      // Restore the previous cache state
      if (context?.previousTasks) {
        context.previousTasks.forEach(([queryKey, data]) => {
          queryClient.setQueryData(queryKey, data);
        });
      }
    },
    
    // Always refetch after mutation settles (success or error)
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: schedulerTasksKeys.lists() });
    },
  });
  
  const deleteTask = async (options: DeleteSchedulerTaskOptions): Promise<void> => {
    try {
      await mutation.mutateAsync(options.taskId);
      
      // Show success notification if enabled
      if (options.showSuccessNotification !== false) {
        // In a real app, this would use a toast notification service
        console.log(options.successMessage || 'Scheduler task deleted successfully');
      }
    } catch (error) {
      // Show error notification if enabled
      if (options.showErrorNotification !== false) {
        console.error(options.errorMessage || 'Failed to delete scheduler task', error);
      }
      throw error; // Re-throw for caller to handle
    }
  };
  
  return {
    deleteTask,
    isLoading: mutation.isLoading,
    isError: mutation.isError,
    error: mutation.error as Error | null,
    isSuccess: mutation.isSuccess,
    reset: mutation.reset,
  };
};

/**
 * Hook for batch deleting multiple scheduler tasks
 */
export interface UseBatchDeleteSchedulerTasksReturn {
  /**
   * Mutation function to delete multiple tasks
   */
  batchDeleteTasks: (taskIds: string[]) => Promise<void>;
  /**
   * Whether the deletion is in progress
   */
  isLoading: boolean;
  /**
   * Whether the last deletion failed
   */
  isError: boolean;
  /**
   * Error from the last deletion attempt
   */
  error: Error | null;
  /**
   * Whether the last deletion was successful
   */
  isSuccess: boolean;
  /**
   * Progress information for batch deletion
   */
  progress: {
    completed: number;
    total: number;
    current?: string;
  };
  /**
   * Reset the mutation state
   */
  reset: () => void;
}

export const useBatchDeleteSchedulerTasks = (): UseBatchDeleteSchedulerTasksReturn => {
  const queryClient = useQueryClient();
  const singleDelete = useDeleteSchedulerTask();
  
  const mutation = useMutation({
    mutationFn: async (taskIds: string[]) => {
      const results = [];
      for (let i = 0; i < taskIds.length; i++) {
        const taskId = taskIds[i];
        try {
          await deleteSchedulerTask(taskId);
          results.push({ taskId, success: true });
        } catch (error) {
          results.push({ taskId, success: false, error });
        }
      }
      
      const failed = results.filter(r => !r.success);
      if (failed.length > 0) {
        throw new Error(`Failed to delete ${failed.length} of ${taskIds.length} tasks`);
      }
      
      return results;
    },
    
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: schedulerTasksKeys.lists() });
    },
  });
  
  const batchDeleteTasks = async (taskIds: string[]): Promise<void> => {
    await mutation.mutateAsync(taskIds);
  };
  
  return {
    batchDeleteTasks,
    isLoading: mutation.isLoading,
    isError: mutation.isError,
    error: mutation.error as Error | null,
    isSuccess: mutation.isSuccess,
    progress: {
      completed: 0, // This would be tracked in the mutation function
      total: 0,
    },
    reset: mutation.reset,
  };
};

export default useDeleteSchedulerTask;