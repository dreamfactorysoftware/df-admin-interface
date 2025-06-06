/**
 * React Query mutation hook for updating scheduler tasks
 * 
 * Replaces Angular service.update() patterns with modern React Query mutations,
 * implementing optimistic updates for immediate UI feedback and comprehensive
 * error handling with automatic rollback on failure. Provides intelligent
 * cache management and integration with the notification system.
 * 
 * Features:
 * - Optimistic updates with automatic rollback on failure
 * - Intelligent cache invalidation for both individual task and task list
 * - Field-specific validation error handling
 * - Success notification integration
 * - Comprehensive TypeScript type safety
 * - Form pristine state validation
 */

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import { showSuccess, showError } from '@/lib/notifications';
import { SchedulerTaskData } from '@/types/scheduler';

/**
 * Update scheduler task payload type
 * Matches the Angular UpdateSchedulePayload structure for compatibility
 */
export interface UpdateSchedulePayload {
  /** Task name */
  name: string;
  
  /** Task description */
  description: string | null;
  
  /** Whether the task is active */
  isActive: boolean;
  
  /** Service ID for the task */
  serviceId: number;
  
  /** Component path */
  component: string;
  
  /** HTTP verb */
  verb: string;
  
  /** Execution frequency in seconds */
  frequency: number;
  
  /** Optional payload data as JSON string */
  payload: string | null;
  
  /** Service name */
  serviceName: string;
  
  /** Verb mask for permissions */
  verbMask: number;
  
  /** Service details */
  service: {
    id: number;
    name: string;
    label: string;
    description: string;
    type: string;
    components: string[];
  };
  
  /** Audit fields from existing task */
  createdById: number;
  createdDate: string;
  hasLog: boolean;
  lastModifiedById: number | null;
  lastModifiedDate: string;
  
  /** Task ID being updated */
  id: number;
  
  /** Related task log data */
  taskLogByTaskId?: {
    taskId: number;
    statusCode: number;
    lastModifiedDate: string;
    createdDate: string;
    content: string;
  } | null;
}

/**
 * Update scheduler task mutation variables
 */
interface UpdateSchedulerTaskVariables {
  /** Task ID to update */
  taskId: string;
  
  /** Update payload data */
  data: UpdateSchedulePayload;
  
  /** Whether the form is pristine (prevents update if true) */
  isPristine?: boolean;
}

/**
 * API error response structure for validation errors
 */
interface ApiErrorResponse {
  error?: {
    message?: string;
    context?: {
      resource?: Array<{
        message: string;
        field?: string;
      }>;
    };
  };
}

/**
 * Validation error mapping interface
 */
interface ValidationErrors {
  [fieldName: string]: string;
}

/**
 * React Query mutation hook for updating scheduler tasks
 * 
 * Implements optimistic updates following Section 4.4.4.2 state management
 * workflows with automatic rollback on failure and comprehensive error handling.
 * 
 * @returns Mutation object with update function and state
 */
export function useUpdateSchedulerTask() {
  const queryClient = useQueryClient();

  return useMutation({
    /**
     * Mutation function that updates a scheduler task
     */
    mutationFn: async ({ taskId, data, isPristine }: UpdateSchedulerTaskVariables) => {
      // Prevent updates when form is pristine matching Angular behavior
      if (isPristine) {
        throw new Error('No changes to save - form is pristine');
      }

      // Call DreamFactory API to update the scheduler task
      const response = await apiClient.put<SchedulerTaskData>(
        `/system/scheduler/${taskId}`,
        data,
        {
          headers: {
            'X-DreamFactory-Fields': '*',
            'X-DreamFactory-Related': 'task_log_by_task_id',
          },
        }
      );

      if (!response.data && !response.resource) {
        throw new Error('Invalid response from server');
      }

      return response.data || response.resource;
    },

    /**
     * Optimistic update implementation
     * Updates cache immediately for instant UI feedback
     */
    onMutate: async ({ taskId, data }) => {
      // Cancel outgoing refetches to prevent optimistic updates from being overwritten
      await queryClient.cancelQueries({ queryKey: ['scheduler-task', taskId] });
      await queryClient.cancelQueries({ queryKey: ['scheduler-tasks'] });

      // Snapshot the previous values for rollback
      const previousTask = queryClient.getQueryData<SchedulerTaskData>(['scheduler-task', taskId]);
      const previousTasks = queryClient.getQueryData<SchedulerTaskData[]>(['scheduler-tasks']);

      // Create optimistic task data
      const optimisticTask: SchedulerTaskData = {
        id: parseInt(taskId),
        name: data.name,
        description: data.description || '',
        isActive: data.isActive,
        serviceId: data.serviceId,
        component: data.component,
        frequency: data.frequency,
        payload: data.payload,
        createdDate: data.createdDate,
        lastModifiedDate: new Date().toISOString(),
        createdById: data.createdById,
        lastModifiedById: data.lastModifiedById,
        verb: data.verb,
        verbMask: data.verbMask,
        taskLogByTaskId: data.taskLogByTaskId || null,
        serviceByServiceId: {
          id: data.service.id.toString(),
          name: data.service.name,
          type: data.service.type,
          label: data.service.label,
        },
      };

      // Optimistically update individual task cache
      queryClient.setQueryData(['scheduler-task', taskId], optimisticTask);

      // Optimistically update task list cache
      if (previousTasks) {
        const updatedTasks = previousTasks.map(task =>
          task.id.toString() === taskId ? optimisticTask : task
        );
        queryClient.setQueryData(['scheduler-tasks'], updatedTasks);
      }

      // Return context with previous values for potential rollback
      return { previousTask, previousTasks };
    },

    /**
     * Success handler with notification and cache management
     */
    onSuccess: (updatedTask, { taskId }) => {
      // Show success notification matching Angular snackbar pattern
      showSuccess(
        'Task Updated',
        `Scheduler task "${updatedTask.name}" has been updated successfully.`
      );

      // Update caches with actual server response
      queryClient.setQueryData(['scheduler-task', taskId], updatedTask);

      // Update task in the tasks list with server response
      queryClient.setQueryData<SchedulerTaskData[]>(
        ['scheduler-tasks'],
        (oldTasks) => {
          if (!oldTasks) return oldTasks;
          return oldTasks.map(task =>
            task.id.toString() === taskId ? updatedTask : task
          );
        }
      );

      // Invalidate related queries to ensure consistency
      queryClient.invalidateQueries({ queryKey: ['scheduler-tasks'] });
      queryClient.invalidateQueries({ queryKey: ['scheduler-task', taskId] });
    },

    /**
     * Error handler with rollback and validation error processing
     */
    onError: (error: any, { taskId }, context) => {
      // Rollback optimistic updates
      if (context?.previousTask) {
        queryClient.setQueryData(['scheduler-task', taskId], context.previousTask);
      }
      if (context?.previousTasks) {
        queryClient.setQueryData(['scheduler-tasks'], context.previousTasks);
      }

      // Process validation errors from API response
      const apiError = error as ApiErrorResponse;
      let errorMessage = 'Failed to update scheduler task';
      let validationErrors: ValidationErrors = {};

      // Extract field-specific validation errors matching Angular implementation
      if (apiError.error?.context?.resource?.[0]) {
        const resourceError = apiError.error.context.resource[0];
        errorMessage = resourceError.message || errorMessage;
        
        if (resourceError.field) {
          validationErrors[resourceError.field] = resourceError.message;
        }
      } else if (apiError.error?.message) {
        errorMessage = apiError.error.message;
      } else if (error.message) {
        errorMessage = error.message;
      }

      // Handle form pristine state error
      if (error.message?.includes('pristine')) {
        showError(
          'No Changes',
          'Please make changes before saving the scheduler task.'
        );
        return;
      }

      // Show error notification with specific message
      showError(
        'Update Failed',
        errorMessage
      );

      // Log validation errors for debugging
      if (Object.keys(validationErrors).length > 0) {
        console.error('Scheduler task validation errors:', validationErrors);
      }
    },

    /**
     * Cleanup handler - always runs after mutation completes
     */
    onSettled: () => {
      // Ensure caches are in sync after mutation completion
      queryClient.invalidateQueries({ queryKey: ['scheduler-tasks'] });
    },

    /**
     * Retry configuration for failed mutations
     */
    retry: (failureCount, error: any) => {
      // Don't retry validation errors or client errors
      if (error.message?.includes('pristine') || 
          error.status === 400 || 
          error.status === 422) {
        return false;
      }
      
      // Retry network errors up to 2 times with exponential backoff
      return failureCount < 2;
    },

    /**
     * Retry delay with exponential backoff
     */
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
  });
}

/**
 * Export type definitions for external use
 */
export type { UpdateSchedulePayload, UpdateSchedulerTaskVariables };