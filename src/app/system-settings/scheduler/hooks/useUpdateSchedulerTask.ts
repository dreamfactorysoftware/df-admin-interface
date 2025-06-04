'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { apiClient } from '@/lib/api-client';
import { showNotification } from '@/lib/notifications';
import type { 
  SchedulerTaskData, 
  UpdateSchedulePayload,
  SchedulerTaskResponse 
} from '@/types/scheduler';

/**
 * React Query mutation hook for updating scheduler tasks with optimistic updates
 * and intelligent cache management. Replaces Angular service.update() patterns
 * with modern React Query mutations, providing immediate user feedback and
 * automatic rollback on failure.
 * 
 * Features:
 * - Optimistic updates for immediate UI feedback
 * - Automatic rollback on failure
 * - Cache invalidation for both individual task and task list
 * - Field-specific validation error handling
 * - Success notification integration
 * - Navigation support
 * 
 * @example
 * ```tsx
 * const updateTaskMutation = useUpdateSchedulerTask();
 * 
 * const handleSubmit = (data: UpdateSchedulePayload) => {
 *   if (form.formState.isDirty) {
 *     updateTaskMutation.mutate({ 
 *       id: taskId, 
 *       payload: data 
 *     });
 *   }
 * };
 * ```
 */
export function useUpdateSchedulerTask() {
  const queryClient = useQueryClient();
  const router = useRouter();

  return useMutation({
    mutationFn: async ({ 
      id, 
      payload 
    }: { 
      id: number; 
      payload: UpdateSchedulePayload 
    }): Promise<SchedulerTaskResponse> => {
      return apiClient.put(`/api/v2/system/scheduler/${id}`, {
        body: payload,
        params: {
          fields: '*',
          related: 'task_log_by_task_id'
        }
      });
    },

    onMutate: async ({ id, payload }) => {
      // Cancel any outgoing refetches to prevent them from overwriting optimistic update
      await queryClient.cancelQueries({ queryKey: ['scheduler-tasks'] });
      await queryClient.cancelQueries({ queryKey: ['scheduler-task', id] });

      // Snapshot the previous values for rollback
      const previousTaskList = queryClient.getQueryData(['scheduler-tasks']);
      const previousTask = queryClient.getQueryData(['scheduler-task', id]);

      // Optimistically update individual task cache
      if (previousTask) {
        const optimisticTask: SchedulerTaskData = {
          ...(previousTask as SchedulerTaskData),
          ...payload,
          // Preserve system-managed fields
          lastModifiedDate: new Date().toISOString(),
        };

        queryClient.setQueryData(['scheduler-task', id], optimisticTask);
      }

      // Optimistically update task list cache
      if (previousTaskList) {
        const taskList = previousTaskList as { resource: SchedulerTaskData[] };
        const updatedList = {
          ...taskList,
          resource: taskList.resource.map((task) =>
            task.id === id
              ? {
                  ...task,
                  ...payload,
                  lastModifiedDate: new Date().toISOString(),
                }
              : task
          ),
        };

        queryClient.setQueryData(['scheduler-tasks'], updatedList);
      }

      // Return context for error handling
      return { previousTaskList, previousTask, id };
    },

    onError: (error, variables, context) => {
      // Rollback optimistic updates
      if (context?.previousTaskList) {
        queryClient.setQueryData(['scheduler-tasks'], context.previousTaskList);
      }
      if (context?.previousTask) {
        queryClient.setQueryData(['scheduler-task', context.id], context.previousTask);
      }

      // Handle different error types
      if (error instanceof Error) {
        let errorMessage = 'Failed to update scheduler task';
        
        try {
          // Parse API error response for field-specific validation errors
          const apiError = JSON.parse(error.message);
          
          if (apiError.error?.context?.resource?.[0]?.message) {
            // Handle validation errors from DreamFactory API
            errorMessage = apiError.error.context.resource[0].message;
          } else if (apiError.error?.message) {
            // Handle general API errors
            errorMessage = apiError.error.message;
          }
        } catch {
          // Fallback to default error handling
          console.error('Scheduler task update error:', error);
        }

        // Show error notification
        showNotification({
          type: 'error',
          title: 'Update Failed',
          message: errorMessage,
          duration: 5000,
        });
      }
    },

    onSuccess: (data, variables) => {
      // Update caches with server response
      queryClient.setQueryData(['scheduler-task', variables.id], data.resource);
      
      // Invalidate related queries to ensure consistency
      queryClient.invalidateQueries({ 
        queryKey: ['scheduler-tasks'],
        refetchType: 'active' 
      });

      // Show success notification
      showNotification({
        type: 'success',
        title: 'Task Updated',
        message: 'Scheduler task updated successfully',
        duration: 3000,
      });

      // Navigate back to scheduler list
      router.push('/system-settings/scheduler');
    },

    onSettled: (data, error, variables) => {
      // Ensure cache consistency regardless of success/failure
      queryClient.invalidateQueries({ 
        queryKey: ['scheduler-task', variables.id],
        refetchType: 'active' 
      });
    },

    // Retry configuration for transient failures
    retry: (failureCount, error) => {
      // Don't retry validation errors (400 status)
      if (error instanceof Error && error.message.includes('"status":400')) {
        return false;
      }
      
      // Retry up to 2 times for other errors with exponential backoff
      return failureCount < 2;
    },

    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
  });
}

/**
 * Type guard to check if form data should trigger an update
 * Prevents updates when form is pristine, matching Angular behavior
 * 
 * @param formState - React Hook Form state object
 * @returns boolean indicating if update should proceed
 */
export function shouldUpdateTask(formState: { isDirty: boolean }): boolean {
  return formState.isDirty;
}

/**
 * Utility function to prepare update payload from form data
 * Transforms form values to match UpdateSchedulePayload structure
 * 
 * @param formData - Form data object
 * @param existingTask - Current task data for preserving system fields
 * @returns UpdateSchedulePayload ready for API submission
 */
export function prepareUpdatePayload(
  formData: any,
  existingTask: SchedulerTaskData
): UpdateSchedulePayload {
  return {
    // Form-managed fields
    name: formData.name,
    description: formData.description || null,
    isActive: formData.active,
    serviceId: formData.serviceId,
    component: formData.component,
    frequency: formData.frequency,
    verb: formData.method,
    payload: formData.payload || null,
    
    // Service-related fields
    serviceName: existingTask.serviceByServiceId?.name || '',
    service: {
      id: formData.serviceId,
      name: existingTask.serviceByServiceId?.name || '',
      label: existingTask.serviceByServiceId?.label || '',
      description: existingTask.serviceByServiceId?.description || '',
      type: existingTask.serviceByServiceId?.type || '',
      components: [], // Will be populated by service selection
    },
    verbMask: getVerbMask(formData.method),
    
    // System-managed fields (preserved from existing task)
    id: existingTask.id,
    createdDate: existingTask.createdDate,
    createdById: existingTask.createdById,
    lastModifiedDate: existingTask.lastModifiedDate,
    lastModifiedById: existingTask.lastModifiedById,
    hasLog: !!existingTask.taskLogByTaskId,
    taskLogByTaskId: existingTask.taskLogByTaskId,
  };
}

/**
 * Helper function to convert HTTP verb to numeric mask
 * Matches Angular implementation for API compatibility
 * 
 * @param verb - HTTP verb string
 * @returns Numeric verb mask
 */
function getVerbMask(verb: string): number {
  switch (verb.toUpperCase()) {
    case 'GET':
      return 1;
    case 'POST':
      return 2;
    case 'PUT':
      return 4;
    case 'PATCH':
      return 8;
    case 'DELETE':
      return 16;
    default:
      return 1;
  }
}