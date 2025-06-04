import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-hot-toast';

/**
 * React Query mutation hook for deleting scheduler tasks with optimistic updates.
 * 
 * Provides immediate UI feedback by optimistically removing the task from the cache,
 * with automatic rollback on failure. Implements comprehensive error handling and
 * integrates with the notification system for user feedback.
 * 
 * @example
 * ```tsx
 * const deleteTask = useDeleteSchedulerTask();
 * 
 * const handleDelete = async (taskId: number) => {
 *   if (confirm('Are you sure you want to delete this task?')) {
 *     await deleteTask.mutateAsync(taskId);
 *   }
 * };
 * ```
 */
export function useDeleteSchedulerTask() {
  const queryClient = useQueryClient();

  return useMutation({
    /**
     * Mutation function that calls the API to delete a scheduler task
     */
    mutationFn: async (taskId: number): Promise<void> => {
      const response = await fetch(`/api/system/scheduler/${taskId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        
        // Handle specific error scenarios
        if (response.status === 403) {
          throw new Error('You do not have permission to delete this scheduler task.');
        }
        
        if (response.status === 404) {
          throw new Error('Scheduler task not found. It may have already been deleted.');
        }
        
        if (response.status === 409) {
          throw new Error('Cannot delete scheduler task. It may be currently running or have dependent tasks.');
        }

        throw new Error(
          errorData.error?.message || 
          `Failed to delete scheduler task. Server responded with status ${response.status}.`
        );
      }
    },

    /**
     * Optimistic update: immediately remove the task from cache before server response
     * This provides instant UI feedback to improve user experience
     */
    onMutate: async (taskId: number) => {
      // Cancel any in-flight queries for scheduler tasks to avoid conflicts
      await queryClient.cancelQueries({ queryKey: ['scheduler-tasks'] });
      
      // Get current scheduler tasks data from cache
      const previousTasks = queryClient.getQueryData(['scheduler-tasks']);
      
      // Optimistically remove the task from the cache
      queryClient.setQueryData(['scheduler-tasks'], (oldData: any) => {
        if (!oldData) return oldData;
        
        // Handle both direct array and paginated response structures
        if (Array.isArray(oldData)) {
          return oldData.filter((task: any) => task.id !== taskId);
        }
        
        // Handle paginated response structure (GenericListResponse)
        if (oldData.resource && Array.isArray(oldData.resource)) {
          return {
            ...oldData,
            resource: oldData.resource.filter((task: any) => task.id !== taskId),
            meta: {
              ...oldData.meta,
              count: Math.max(0, (oldData.meta?.count || 0) - 1),
            },
          };
        }
        
        return oldData;
      });

      // Also remove from individual task cache if it exists
      queryClient.removeQueries({ queryKey: ['scheduler-task', taskId] });
      
      // Return context for potential rollback
      return { previousTasks, taskId };
    },

    /**
     * Success handler: invalidate related queries and show success notification
     */
    onSuccess: (data, taskId) => {
      // Invalidate and refetch scheduler tasks to ensure cache consistency
      queryClient.invalidateQueries({ queryKey: ['scheduler-tasks'] });
      
      // Show success notification
      toast.success('Scheduler task deleted successfully.', {
        duration: 4000,
        position: 'top-right',
      });
    },

    /**
     * Error handler: rollback optimistic update and show error notification
     */
    onError: (error: Error, taskId: number, context) => {
      // Rollback the optimistic update
      if (context?.previousTasks) {
        queryClient.setQueryData(['scheduler-tasks'], context.previousTasks);
      }
      
      // Show error notification with specific error message
      toast.error(error.message || 'Failed to delete scheduler task. Please try again.', {
        duration: 6000,
        position: 'top-right',
      });
      
      // Log error for debugging in development
      if (process.env.NODE_ENV === 'development') {
        console.error('Delete scheduler task error:', error);
      }
    },

    /**
     * Cleanup handler: runs after both success and error scenarios
     */
    onSettled: () => {
      // Ensure scheduler tasks query is marked as stale for background refetch
      queryClient.invalidateQueries({ 
        queryKey: ['scheduler-tasks'],
        refetchType: 'inactive',
      });
    },

    // Retry configuration for transient failures
    retry: (failureCount, error) => {
      // Don't retry on permission errors or not found errors
      if (error.message.includes('permission') || error.message.includes('not found')) {
        return false;
      }
      
      // Don't retry on conflict errors (business logic restrictions)
      if (error.message.includes('Cannot delete')) {
        return false;
      }
      
      // Retry up to 2 times for other errors (network issues, etc.)
      return failureCount < 2;
    },

    // Retry delay with exponential backoff
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
  });
}

/**
 * Hook for deleting a scheduler task with confirmation dialog integration.
 * 
 * This is a convenience wrapper that includes confirmation logic and
 * integrates with common UI patterns.
 * 
 * @param confirmationMessage - Custom confirmation message (optional)
 * @returns Object with deleteTask function and mutation state
 * 
 * @example
 * ```tsx
 * const { deleteTask, isPending, error } = useDeleteSchedulerTaskWithConfirmation();
 * 
 * <Button 
 *   onClick={() => deleteTask(taskId)} 
 *   disabled={isPending}
 * >
 *   {isPending ? 'Deleting...' : 'Delete Task'}
 * </Button>
 * ```
 */
export function useDeleteSchedulerTaskWithConfirmation(
  confirmationMessage = 'Are you sure you want to delete this scheduler task? This action cannot be undone.'
) {
  const mutation = useDeleteSchedulerTask();

  const deleteTask = async (taskId: number) => {
    // Show confirmation dialog
    const confirmed = window.confirm(confirmationMessage);
    
    if (confirmed) {
      try {
        await mutation.mutateAsync(taskId);
      } catch (error) {
        // Error is already handled in the mutation's onError callback
        console.debug('Delete operation failed:', error);
      }
    }
  };

  return {
    deleteTask,
    isPending: mutation.isPending,
    error: mutation.error,
    isSuccess: mutation.isSuccess,
    reset: mutation.reset,
  };
}

// Export types for external usage
export type DeleteSchedulerTaskOptions = {
  /** Custom confirmation message for the deletion dialog */
  confirmationMessage?: string;
  /** Callback function called on successful deletion */
  onSuccess?: (taskId: number) => void;
  /** Callback function called on deletion error */
  onError?: (error: Error, taskId: number) => void;
};

/**
 * Advanced hook for scheduler task deletion with custom options and callbacks.
 * 
 * Provides maximum flexibility for complex deletion workflows while maintaining
 * the same optimistic update and error handling patterns.
 * 
 * @param options - Configuration options for the deletion behavior
 * @returns Mutation object with enhanced functionality
 */
export function useDeleteSchedulerTaskAdvanced(options: DeleteSchedulerTaskOptions = {}) {
  const baseMutation = useDeleteSchedulerTask();
  
  return {
    ...baseMutation,
    
    /**
     * Delete a scheduler task with custom options and confirmation
     */
    deleteWithConfirmation: async (taskId: number) => {
      const message = options.confirmationMessage || 
        'Are you sure you want to delete this scheduler task? This action cannot be undone.';
      
      const confirmed = window.confirm(message);
      
      if (confirmed) {
        try {
          await baseMutation.mutateAsync(taskId);
          options.onSuccess?.(taskId);
        } catch (error) {
          options.onError?.(error as Error, taskId);
          throw error;
        }
      }
    },
  };
}