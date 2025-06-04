'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { apiClient } from '@/lib/api-client';
import { showNotification } from '@/lib/notifications';
import type { 
  SchedulerTaskData, 
  CreateSchedulePayload,
  SchedulerTaskResponse 
} from '@/types/scheduler';

/**
 * React Query mutation hook for creating scheduler tasks with optimistic updates
 * and comprehensive cache management. Replaces Angular service.create() patterns
 * with modern React Query mutations, providing immediate user feedback through
 * optimistic updates and automatic rollback on failure.
 * 
 * Features:
 * - Optimistic updates for immediate UI feedback
 * - Automatic rollback on failure
 * - Cache invalidation for scheduler task list
 * - Field-specific validation error handling
 * - Success notification integration
 * - Navigation support to scheduler list
 * - Comprehensive error handling with rollback capabilities
 * 
 * @example
 * ```tsx
 * const createTaskMutation = useCreateSchedulerTask();
 * 
 * const handleSubmit = (data: CreateSchedulePayload) => {
 *   if (form.formState.isDirty) {
 *     createTaskMutation.mutate(data);
 *   }
 * };
 * 
 * return (
 *   <Button 
 *     onClick={() => handleSubmit(formData)}
 *     disabled={createTaskMutation.isPending}
 *   >
 *     {createTaskMutation.isPending ? 'Creating...' : 'Create Task'}
 *   </Button>
 * );
 * ```
 */
export function useCreateSchedulerTask() {
  const queryClient = useQueryClient();
  const router = useRouter();

  return useMutation({
    mutationFn: async (payload: CreateSchedulePayload): Promise<SchedulerTaskResponse> => {
      return apiClient.post('/api/v2/system/scheduler', {
        body: { resource: [payload] },
        params: {
          fields: '*',
          related: 'task_log_by_task_id'
        }
      });
    },

    onMutate: async (payload: CreateSchedulePayload) => {
      // Cancel any outgoing refetches to prevent them from overwriting optimistic update
      await queryClient.cancelQueries({ queryKey: ['scheduler-tasks'] });

      // Snapshot the previous scheduler tasks for rollback
      const previousTaskList = queryClient.getQueryData(['scheduler-tasks']);

      // Create optimistic task object
      const optimisticTask: SchedulerTaskData = {
        // Generate temporary ID for optimistic update (will be replaced by server response)
        id: Date.now(), // Temporary ID using timestamp
        name: payload.name,
        description: payload.description || '',
        isActive: payload.isActive,
        serviceId: payload.serviceId,
        component: payload.component,
        frequency: payload.frequency,
        payload: payload.payload,
        verb: payload.verb,
        verbMask: payload.verbMask,
        serviceName: payload.serviceName,
        
        // System-managed fields (optimistically generated)
        createdDate: new Date().toISOString(),
        lastModifiedDate: new Date().toISOString(),
        createdById: 1, // Will be set by server
        lastModifiedById: null,
        
        // Related data (empty for new tasks)
        taskLogByTaskId: null,
        serviceByServiceId: {
          id: payload.service.id,
          name: payload.service.name,
          label: payload.service.label,
          description: payload.service.description,
          type: payload.service.type,
          isActive: true,
          config: null,
          host: null,
          baseUrl: null,
          nativeFormat: null,
          createdDate: '',
          lastModifiedDate: '',
          createdById: 1,
          lastModifiedById: null,
        },
      };

      // Optimistically add new task to the cache
      if (previousTaskList) {
        const taskList = previousTaskList as { resource: SchedulerTaskData[] };
        const updatedList = {
          ...taskList,
          resource: [optimisticTask, ...taskList.resource],
          meta: {
            ...taskList.meta,
            count: (taskList.meta?.count || 0) + 1,
          },
        };

        queryClient.setQueryData(['scheduler-tasks'], updatedList);
      } else {
        // If no existing data, create new list with optimistic task
        const newList = {
          resource: [optimisticTask],
          meta: {
            count: 1,
            schema: [],
          },
        };

        queryClient.setQueryData(['scheduler-tasks'], newList);
      }

      // Return context for error handling
      return { previousTaskList, optimisticTask };
    },

    onError: (error, variables, context) => {
      // Rollback optimistic update
      if (context?.previousTaskList) {
        queryClient.setQueryData(['scheduler-tasks'], context.previousTaskList);
      } else {
        // If there was no previous data, remove the optimistic entry
        queryClient.removeQueries({ queryKey: ['scheduler-tasks'] });
      }

      // Handle different error types with specific messaging
      if (error instanceof Error) {
        let errorMessage = 'Failed to create scheduler task';
        
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
          // Handle different error response formats
          if (error.message.includes('name')) {
            errorMessage = 'Task name is required or already exists';
          } else if (error.message.includes('serviceId')) {
            errorMessage = 'Please select a valid service';
          } else if (error.message.includes('component')) {
            errorMessage = 'Please select a valid component';
          } else if (error.message.includes('frequency')) {
            errorMessage = 'Please provide a valid frequency value';
          } else if (error.message.includes('permission')) {
            errorMessage = 'You do not have permission to create scheduler tasks';
          }
          
          console.error('Scheduler task creation error:', error);
        }

        // Show error notification matching Angular implementation patterns
        showNotification({
          type: 'error',
          title: 'Creation Failed',
          message: errorMessage,
          duration: 5000,
        });
      }
    },

    onSuccess: (data, variables) => {
      // Update cache with server response data
      const createdTask = data.resource[0];
      
      // Update the cache with the actual server response
      queryClient.setQueryData(['scheduler-tasks'], (oldData: any) => {
        if (!oldData) return data;
        
        // Replace optimistic task with real server response
        const updatedResource = oldData.resource.map((task: SchedulerTaskData) => {
          // Find the optimistic task by matching the payload data
          if (task.name === variables.name && 
              task.serviceId === variables.serviceId &&
              task.component === variables.component) {
            return createdTask;
          }
          return task;
        });
        
        return {
          ...oldData,
          resource: updatedResource,
        };
      });

      // Also cache the individual task for future detail views
      queryClient.setQueryData(['scheduler-task', createdTask.id], createdTask);

      // Invalidate related queries to ensure cache consistency
      queryClient.invalidateQueries({ 
        queryKey: ['scheduler-tasks'],
        refetchType: 'active' 
      });

      // Show success notification matching Angular implementation
      showNotification({
        type: 'success',
        title: 'Task Created',
        message: 'Scheduler task created successfully',
        duration: 3000,
      });

      // Navigate back to scheduler list per Angular implementation
      router.push('/system-settings/scheduler');
    },

    onSettled: (data, error, variables) => {
      // Ensure cache consistency regardless of success/failure
      queryClient.invalidateQueries({ 
        queryKey: ['scheduler-tasks'],
        refetchType: 'active' 
      });
    },

    // Retry configuration for transient failures
    retry: (failureCount, error) => {
      // Don't retry validation errors (400 status)
      if (error instanceof Error && error.message.includes('"status":400')) {
        return false;
      }
      
      // Don't retry permission errors
      if (error instanceof Error && error.message.includes('permission')) {
        return false;
      }
      
      // Don't retry duplicate name errors
      if (error instanceof Error && error.message.includes('already exists')) {
        return false;
      }
      
      // Retry up to 2 times for other errors (network issues, etc.)
      return failureCount < 2;
    },

    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
  });
}

/**
 * Type guard to check if form data should trigger a creation
 * Prevents creation when form is invalid or pristine, matching Angular behavior
 * 
 * @param formState - React Hook Form state object
 * @returns boolean indicating if creation should proceed
 */
export function shouldCreateTask(formState: { 
  isValid: boolean; 
  isDirty: boolean; 
}): boolean {
  return formState.isValid && formState.isDirty;
}

/**
 * Utility function to prepare create payload from form data
 * Transforms form values to match CreateSchedulePayload structure
 * matching Angular implementation patterns
 * 
 * @param formData - Form data object from React Hook Form
 * @param selectedService - Selected service object for payload assembly
 * @param componentOptions - Available component options for the service
 * @returns CreateSchedulePayload ready for API submission
 */
export function prepareCreatePayload(
  formData: any,
  selectedService: any,
  componentOptions: string[] = []
): CreateSchedulePayload {
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
    serviceName: selectedService?.name || '',
    service: {
      id: formData.serviceId,
      name: selectedService?.name || '',
      label: selectedService?.label || '',
      description: selectedService?.description || '',
      type: selectedService?.type || '',
      components: componentOptions,
    },
    verbMask: getVerbMask(formData.method),
    
    // System-managed fields (required for API compatibility)
    id: null, // Will be set by server
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

/**
 * Hook for creating a scheduler task with advanced configuration options.
 * 
 * Provides additional customization for success/error callbacks and navigation behavior.
 * 
 * @param options - Configuration options for the creation behavior
 * @returns Enhanced mutation object with additional functionality
 * 
 * @example
 * ```tsx
 * const { createTask, isPending } = useCreateSchedulerTaskAdvanced({
 *   onSuccess: (task) => console.log('Created task:', task),
 *   skipNavigation: false,
 * });
 * 
 * const handleCreate = async (formData: any) => {
 *   const payload = prepareCreatePayload(formData, selectedService, components);
 *   await createTask(payload);
 * };
 * ```
 */
export function useCreateSchedulerTaskAdvanced(options: {
  /** Callback function called on successful creation */
  onSuccess?: (task: SchedulerTaskData) => void;
  /** Callback function called on creation error */
  onError?: (error: Error) => void;
  /** Skip automatic navigation to scheduler list */
  skipNavigation?: boolean;
} = {}) {
  const baseMutation = useCreateSchedulerTask();
  const router = useRouter();
  
  return {
    ...baseMutation,
    
    /**
     * Create a scheduler task with custom options
     */
    createTask: async (payload: CreateSchedulePayload) => {
      try {
        const result = await baseMutation.mutateAsync(payload);
        const createdTask = result.resource[0];
        
        // Call custom success callback
        options.onSuccess?.(createdTask);
        
        // Handle navigation based on options
        if (!options.skipNavigation) {
          router.push('/system-settings/scheduler');
        }
        
        return createdTask;
      } catch (error) {
        // Call custom error callback
        options.onError?.(error as Error);
        throw error;
      }
    },
  };
}

// Export types for external usage
export type CreateSchedulerTaskOptions = {
  /** Callback function called on successful creation */
  onSuccess?: (task: SchedulerTaskData) => void;
  /** Callback function called on creation error */
  onError?: (error: Error) => void;
  /** Skip automatic navigation to scheduler list */
  skipNavigation?: boolean;
};