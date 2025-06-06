/**
 * React Query mutation hook for creating scheduler tasks
 * 
 * Replaces Angular service.create() patterns with modern React Query mutations,
 * implementing optimistic updates for immediate UI feedback and comprehensive
 * error handling with automatic rollback on failure. Provides intelligent
 * cache management and integration with the notification system.
 * 
 * Features:
 * - Optimistic updates with automatic rollback on failure
 * - Automatic cache invalidation for scheduler task list
 * - Field-specific validation error handling
 * - Success notification integration with navigation
 * - Comprehensive TypeScript type safety
 * - Form pristine state validation
 */

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { apiClient } from '@/lib/api-client';
import { showSuccess, showError } from '@/lib/notifications';
import { SchedulerTaskData } from '@/types/scheduler';

/**
 * Create scheduler task payload type
 * Matches the Angular CreateSchedulePayload structure for compatibility
 */
export interface CreateSchedulePayload {
  /** Component path */
  component: string;
  
  /** Task description (can be null) */
  description: string | null;
  
  /** Execution frequency in seconds */
  frequency: number;
  
  /** Task ID (null for creation) */
  id: number | null;
  
  /** Whether the task is active */
  isActive: boolean;
  
  /** Task name */
  name: string;
  
  /** Optional payload data as JSON string */
  payload: string | null;
  
  /** Service details object */
  service: {
    id: number;
    name: string;
    label: string;
    description: string;
    type: string;
    components: string[];
  };
  
  /** Service ID for the task */
  serviceId: number;
  
  /** Service name */
  serviceName: string;
  
  /** HTTP verb */
  verb: string;
  
  /** Verb mask for permissions */
  verbMask: number;
}

/**
 * Create scheduler task mutation variables
 */
interface CreateSchedulerTaskVariables {
  /** Create payload data */
  data: CreateSchedulePayload;
  
  /** Whether the form is pristine (prevents creation if true) */
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
 * React Query mutation hook for creating scheduler tasks
 * 
 * Implements optimistic updates following Section 4.4.4.2 state management
 * workflows with automatic rollback on failure and comprehensive error handling.
 * 
 * @returns Mutation object with create function and state
 */
export function useCreateSchedulerTask() {
  const queryClient = useQueryClient();
  const router = useRouter();

  return useMutation({
    /**
     * Mutation function that creates a scheduler task
     */
    mutationFn: async ({ data, isPristine }: CreateSchedulerTaskVariables) => {
      // Prevent creation when form is pristine matching Angular behavior
      if (isPristine) {
        throw new Error('No changes to save - form is pristine');
      }

      // Call DreamFactory API to create the scheduler task
      // Using the same structure as Angular implementation
      const response = await apiClient.post<SchedulerTaskData>(
        '/system/scheduler',
        { resource: [data] },
        {
          headers: {
            'X-DreamFactory-Fields': '*',
            'X-DreamFactory-Related': 'task_log_by_task_id',
          },
        }
      );

      // Handle both data and resource response formats
      const createdTask = response.data || response.resource;
      
      if (!createdTask) {
        throw new Error('Invalid response from server');
      }

      // Return the first item if it's an array, or the task directly
      return Array.isArray(createdTask) ? createdTask[0] : createdTask;
    },

    /**
     * Optimistic update implementation
     * Updates cache immediately for instant UI feedback
     */
    onMutate: async ({ data }) => {
      // Cancel outgoing refetches to prevent optimistic updates from being overwritten
      await queryClient.cancelQueries({ queryKey: ['scheduler-tasks'] });

      // Snapshot the previous task list for rollback
      const previousTasks = queryClient.getQueryData<SchedulerTaskData[]>(['scheduler-tasks']);

      // Create optimistic task data with temporary ID
      const tempId = Date.now(); // Temporary ID for optimistic update
      const optimisticTask: SchedulerTaskData = {
        id: tempId.toString(),
        name: data.name,
        description: data.description || '',
        isActive: data.isActive,
        serviceId: data.serviceId,
        component: data.component,
        frequency: data.frequency,
        payload: data.payload,
        verb: data.verb,
        createdDate: new Date().toISOString(),
        lastModifiedDate: new Date().toISOString(),
        createdByUserId: undefined, // Will be set by server
        lastModifiedByUserId: undefined,
        serviceByServiceId: {
          id: data.service.id.toString(),
          name: data.service.name,
          type: data.service.type,
          label: data.service.label,
        },
        taskLogByTaskId: null, // New tasks have no logs initially
      };

      // Optimistically add task to the list
      if (previousTasks) {
        const updatedTasks = [optimisticTask, ...previousTasks];
        queryClient.setQueryData(['scheduler-tasks'], updatedTasks);
      } else {
        // If no previous tasks, create new array with optimistic task
        queryClient.setQueryData(['scheduler-tasks'], [optimisticTask]);
      }

      // Return context with previous values for potential rollback
      return { previousTasks, optimisticTaskId: tempId };
    },

    /**
     * Success handler with notification, cache management, and navigation
     */
    onSuccess: (createdTask, variables, context) => {
      // Show success notification matching Angular snackbar pattern
      showSuccess(
        'Task Created',
        `Scheduler task "${createdTask.name}" has been created successfully.`
      );

      // Replace optimistic task with actual server response in task list
      queryClient.setQueryData<SchedulerTaskData[]>(
        ['scheduler-tasks'],
        (oldTasks) => {
          if (!oldTasks) return [createdTask];
          
          // Replace optimistic task with real task from server
          return oldTasks.map(task =>
            task.id === context?.optimisticTaskId?.toString() ? createdTask : task
          );
        }
      );

      // Add individual task cache entry
      queryClient.setQueryData(['scheduler-task', createdTask.id], createdTask);

      // Invalidate queries to ensure consistency
      queryClient.invalidateQueries({ queryKey: ['scheduler-tasks'] });

      // Navigate to scheduler list on success (matching Angular behavior)
      router.push('/system-settings/scheduler');
    },

    /**
     * Error handler with rollback and validation error processing
     */
    onError: (error: any, variables, context) => {
      // Rollback optimistic updates
      if (context?.previousTasks !== undefined) {
        queryClient.setQueryData(['scheduler-tasks'], context.previousTasks);
      } else {
        // If no previous tasks existed, clear the optimistic task
        queryClient.setQueryData(['scheduler-tasks'], []);
      }

      // Process validation errors from API response
      const apiError = error as ApiErrorResponse;
      let errorMessage = 'Failed to create scheduler task';
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
          'Please make changes before creating the scheduler task.'
        );
        return;
      }

      // Show error notification with specific message
      showError(
        'Creation Failed',
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
export type { CreateSchedulePayload, CreateSchedulerTaskVariables };