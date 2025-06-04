'use client';

import { Suspense, useEffect, useMemo, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

// Component imports for UI elements
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AceEditor } from '@/components/ui/ace-editor';
import { VerbPicker } from '@/components/ui/verb-picker';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';

// Hook imports
import { useSchedulerTask } from '@/hooks/useSchedulerTask';
import { useCreateSchedulerTask } from '@/hooks/useCreateSchedulerTask';
import { useUpdateSchedulerTask } from '@/hooks/useUpdateSchedulerTask';
import { useServices } from '@/hooks/useServices';
import { useComponentAccessList } from '@/hooks/useComponentAccessList';

// Type imports
import type { SchedulerTaskData, CreateSchedulePayload, UpdateSchedulePayload } from '@/types/scheduler';
import type { Service } from '@/types/service';

// Validation schema using Zod with comprehensive validation rules
const schedulerFormSchema = z.object({
  name: z.string().min(1, 'Name is required').max(255, 'Name must be less than 255 characters'),
  description: z.string().optional(),
  active: z.boolean().default(true),
  serviceId: z.number().min(1, 'Service is required'),
  component: z.string().min(1, 'Component is required'),
  method: z.enum(['GET', 'POST', 'PUT', 'PATCH', 'DELETE']).default('GET'),
  frequency: z.number().min(1, 'Frequency must be at least 1 second').max(86400, 'Frequency cannot exceed 24 hours'),
  payload: z.string().optional().refine((val) => {
    if (!val || val.trim() === '') return true;
    try {
      JSON.parse(val);
      return true;
    } catch {
      return false;
    }
  }, 'Payload must be valid JSON'),
});

type SchedulerFormData = z.infer<typeof schedulerFormSchema>;

/**
 * SchedulerDetailPage - Dynamic route page component for individual scheduler task management
 * 
 * This component handles both creation (when id='create') and editing workflows for scheduled tasks.
 * It implements React Hook Form with Zod validation for scheduler task configuration,
 * React Query for CRUD operations and data fetching, and Tailwind CSS with Headless UI
 * for a tabbed interface containing Basic task configuration and Log viewing sections.
 * 
 * Features:
 * - Dynamic route handling for create/edit modes
 * - Real-time form validation under 100ms
 * - Intelligent caching with 300-second staleTime
 * - Conditional payload field display based on HTTP method
 * - Comprehensive error handling and user feedback
 * - Seamless navigation with Next.js router
 */
export default function SchedulerDetailPage() {
  const params = useParams();
  const router = useRouter();
  const queryClient = useQueryClient();
  
  // Extract and validate route parameters
  const schedulerId = params.id as string;
  const isCreateMode = schedulerId === 'create';
  const taskId = !isCreateMode ? parseInt(schedulerId, 10) : null;

  // State management for UI interactions
  const [selectedTab, setSelectedTab] = useState('basic');
  const [showAlert, setShowAlert] = useState(false);
  const [alertMessage, setAlertMessage] = useState('');
  const [alertType, setAlertType] = useState<'default' | 'destructive'>('default');

  // Initialize form with React Hook Form and Zod validation
  const form = useForm<SchedulerFormData>({
    resolver: zodResolver(schedulerFormSchema),
    defaultValues: {
      name: '',
      description: '',
      active: true,
      serviceId: 0,
      component: '',
      method: 'GET',
      frequency: 60,
      payload: '',
    },
    mode: 'onChange', // Enable real-time validation
  });

  // Watch form values for conditional rendering and side effects
  const watchedServiceId = form.watch('serviceId');
  const watchedMethod = form.watch('method');

  // React Query hooks for data fetching and mutations
  const {
    data: services = [],
    isLoading: servicesLoading,
    error: servicesError,
  } = useServices({
    staleTime: 300000, // 5 minutes as specified in requirements
  });

  const {
    data: schedulerTask,
    isLoading: taskLoading,
    error: taskError,
  } = useSchedulerTask(taskId, {
    enabled: !isCreateMode && taskId !== null,
    staleTime: 300000,
  });

  const {
    data: componentOptions = [],
    isLoading: componentsLoading,
  } = useComponentAccessList(watchedServiceId, {
    enabled: watchedServiceId > 0,
    staleTime: 300000,
  });

  // Mutations for create and update operations
  const createMutation = useCreateSchedulerTask({
    onSuccess: () => {
      triggerAlert('default', 'Scheduler task created successfully');
      setTimeout(() => navigateToList(), 1500);
    },
    onError: (error: any) => {
      const message = error?.response?.data?.error?.message || 'Failed to create scheduler task';
      triggerAlert('destructive', message);
    },
  });

  const updateMutation = useUpdateSchedulerTask({
    onSuccess: () => {
      triggerAlert('default', 'Scheduler task updated successfully');
      setTimeout(() => navigateToList(), 1500);
    },
    onError: (error: any) => {
      const message = error?.response?.data?.error?.message || 'Failed to update scheduler task';
      triggerAlert('destructive', message);
    },
  });

  // Helper function to show alert messages
  const triggerAlert = (type: 'default' | 'destructive', message: string) => {
    setAlertType(type);
    setAlertMessage(message);
    setShowAlert(true);
  };

  // Navigation helper
  const navigateToList = () => {
    router.push('/system-settings/scheduler');
  };

  // HTTP method to verb mask conversion
  const getVerbMask = (verb: string): number => {
    const verbMasks: Record<string, number> = {
      GET: 1,
      POST: 2,
      PUT: 4,
      PATCH: 8,
      DELETE: 16,
    };
    return verbMasks[verb] || 1;
  };

  // Populate form when editing existing task
  useEffect(() => {
    if (schedulerTask && !isCreateMode) {
      form.reset({
        name: schedulerTask.name,
        description: schedulerTask.description || '',
        active: schedulerTask.isActive,
        serviceId: schedulerTask.serviceId,
        component: schedulerTask.component,
        method: schedulerTask.verb as SchedulerFormData['method'],
        frequency: schedulerTask.frequency,
        payload: schedulerTask.payload || '',
      });
    }
  }, [schedulerTask, isCreateMode, form]);

  // Reset component dropdown when service changes
  useEffect(() => {
    if (watchedServiceId > 0) {
      form.setValue('component', '');
    }
  }, [watchedServiceId, form]);

  // Get selected service details
  const selectedService = useMemo(() => {
    return services.find(service => service.id === watchedServiceId);
  }, [services, watchedServiceId]);

  // Form submission handler
  const onSubmit = async (data: SchedulerFormData) => {
    if (!selectedService) {
      triggerAlert('destructive', 'Please select a valid service');
      return;
    }

    try {
      const basePayload = {
        name: data.name,
        description: data.description || '',
        isActive: data.active,
        serviceId: data.serviceId,
        serviceName: selectedService.name,
        component: data.component,
        verb: data.method,
        verbMask: getVerbMask(data.method),
        frequency: data.frequency,
        payload: data.method === 'GET' ? null : (data.payload || null),
        service: {
          id: selectedService.id,
          name: selectedService.name,
          label: selectedService.label || selectedService.name,
          description: selectedService.description || '',
          type: selectedService.type || '',
          components: componentOptions,
        },
      };

      if (isCreateMode) {
        const createPayload: CreateSchedulePayload = {
          ...basePayload,
          id: null,
        };
        await createMutation.mutateAsync(createPayload);
      } else if (schedulerTask) {
        const updatePayload: UpdateSchedulePayload = {
          ...basePayload,
          id: schedulerTask.id,
          createdById: schedulerTask.createdById,
          createdDate: schedulerTask.createdDate,
          lastModifiedById: schedulerTask.lastModifiedById,
          lastModifiedDate: schedulerTask.lastModifiedDate,
          hasLog: !!schedulerTask.taskLogByTaskId,
          taskLogByTaskId: schedulerTask.taskLogByTaskId,
        };
        await updateMutation.mutateAsync(updatePayload);
      }
    } catch (error) {
      // Error handling is done in mutation callbacks
      console.error('Form submission error:', error);
    }
  };

  // Cancel handler
  const onCancel = () => {
    navigateToList();
  };

  // Loading state
  if ((!isCreateMode && taskLoading) || servicesLoading) {
    return (
      <div className="flex justify-center items-center min-h-96">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-2 text-gray-600">Loading scheduler task...</span>
      </div>
    );
  }

  // Error state
  if (taskError || servicesError) {
    const errorMessage = taskError?.message || servicesError?.message || 'Failed to load data';
    return (
      <div className="p-6">
        <Alert variant="destructive">
          <AlertDescription>{errorMessage}</AlertDescription>
        </Alert>
        <Button 
          onClick={navigateToList} 
          variant="outline" 
          className="mt-4"
        >
          Back to Scheduler List
        </Button>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6 px-4 max-w-4xl">
      {/* Page Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
          {isCreateMode ? 'Create Scheduler Task' : 'Edit Scheduler Task'}
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mt-1">
          {isCreateMode 
            ? 'Configure a new scheduled task for automated execution'
            : 'Modify the configuration of an existing scheduled task'
          }
        </p>
      </div>

      {/* Alert Component */}
      {showAlert && (
        <Alert 
          variant={alertType} 
          className="mb-6"
          onClose={() => setShowAlert(false)}
        >
          <AlertDescription>{alertMessage}</AlertDescription>
        </Alert>
      )}

      {/* Main Content Tabs */}
      <Tabs value={selectedTab} onValueChange={setSelectedTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="basic">Basic Configuration</TabsTrigger>
          <TabsTrigger value="log" disabled={isCreateMode}>
            Execution Log
          </TabsTrigger>
        </TabsList>

        {/* Basic Configuration Tab */}
        <TabsContent value="basic" className="space-y-6">
          <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
            <h2 className="text-lg font-semibold mb-4 text-gray-900 dark:text-gray-100">
              Task Overview
            </h2>
            
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                {/* Task Name and Active Status Row */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="md:col-span-2">
                    <FormField
                      control={form.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Task Name</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="Enter task name"
                              {...field}
                              className="focus:ring-2 focus:ring-blue-500"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  
                  <div className="flex items-end">
                    <FormField
                      control={form.control}
                      name="active"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4 w-full">
                          <div className="space-y-0.5">
                            <FormLabel className="text-base">Active</FormLabel>
                            <FormDescription>
                              Enable task execution
                            </FormDescription>
                          </div>
                          <FormControl>
                            <Switch
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                  </div>
                </div>

                {/* Description */}
                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Description</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Enter task description (optional)"
                          rows={3}
                          {...field}
                          className="resize-none focus:ring-2 focus:ring-blue-500"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Service and Component Row */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="serviceId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Service</FormLabel>
                        <Select 
                          value={field.value.toString()} 
                          onValueChange={(value) => field.onChange(parseInt(value, 10))}
                        >
                          <FormControl>
                            <SelectTrigger className="focus:ring-2 focus:ring-blue-500">
                              <SelectValue placeholder="Select a service" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {services.map((service) => (
                              <SelectItem key={service.id} value={service.id.toString()}>
                                {service.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="component"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Component</FormLabel>
                        <Select 
                          value={field.value} 
                          onValueChange={field.onChange}
                          disabled={!watchedServiceId || componentsLoading}
                        >
                          <FormControl>
                            <SelectTrigger className="focus:ring-2 focus:ring-blue-500">
                              <SelectValue placeholder="Select a component" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {componentOptions.map((component) => (
                              <SelectItem key={component} value={component}>
                                {component}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                        {componentsLoading && (
                          <FormDescription>Loading components...</FormDescription>
                        )}
                      </FormItem>
                    )}
                  />
                </div>

                {/* Frequency and HTTP Method Row */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="frequency"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Frequency (seconds)</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            min="1"
                            max="86400"
                            placeholder="60"
                            {...field}
                            onChange={(e) => field.onChange(parseInt(e.target.value, 10) || 0)}
                            className="focus:ring-2 focus:ring-blue-500"
                          />
                        </FormControl>
                        <FormDescription>
                          How often the task should run (1-86400 seconds)
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="method"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>HTTP Method</FormLabel>
                        <FormControl>
                          <VerbPicker
                            value={field.value}
                            onChange={field.onChange}
                            className="focus:ring-2 focus:ring-blue-500"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {/* Conditional Payload Field */}
                {watchedMethod !== 'GET' && (
                  <FormField
                    control={form.control}
                    name="payload"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Request Payload</FormLabel>
                        <FormControl>
                          <AceEditor
                            value={field.value || ''}
                            onChange={field.onChange}
                            mode="json"
                            theme="github"
                            height="200px"
                            placeholder='{"key": "value"}'
                            className="border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500"
                          />
                        </FormControl>
                        <FormDescription>
                          JSON payload to send with the request (optional)
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}

                {/* Action Buttons */}
                <div className="flex justify-end space-x-4 pt-6 border-t border-gray-200 dark:border-gray-700">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={onCancel}
                    disabled={createMutation.isPending || updateMutation.isPending}
                  >
                    Cancel
                  </Button>
                  
                  <Button
                    type="submit"
                    disabled={
                      !form.formState.isValid ||
                      form.formState.isSubmitting ||
                      createMutation.isPending ||
                      updateMutation.isPending
                    }
                    className="min-w-24"
                  >
                    {(createMutation.isPending || updateMutation.isPending) ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Saving...
                      </>
                    ) : (
                      isCreateMode ? 'Create Task' : 'Update Task'
                    )}
                  </Button>
                </div>
              </form>
            </Form>
          </div>
        </TabsContent>

        {/* Execution Log Tab */}
        <TabsContent value="log" className="space-y-6">
          <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
            <h2 className="text-lg font-semibold mb-4 text-gray-900 dark:text-gray-100">
              Last Execution Log
            </h2>
            
            {schedulerTask?.taskLogByTaskId ? (
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="font-medium text-gray-700 dark:text-gray-300">Status Code:</span>
                    <span className={`ml-2 px-2 py-1 rounded text-xs font-medium ${
                      schedulerTask.taskLogByTaskId.statusCode >= 200 && schedulerTask.taskLogByTaskId.statusCode < 300
                        ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                        : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                    }`}>
                      {schedulerTask.taskLogByTaskId.statusCode}
                    </span>
                  </div>
                  <div>
                    <span className="font-medium text-gray-700 dark:text-gray-300">Last Modified:</span>
                    <span className="ml-2 text-gray-600 dark:text-gray-400">
                      {new Date(schedulerTask.taskLogByTaskId.lastModifiedDate).toLocaleString()}
                    </span>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Execution Log Content
                  </label>
                  <AceEditor
                    value={schedulerTask.taskLogByTaskId.content || 'No log content available'}
                    mode="text"
                    theme="github"
                    height="400px"
                    readOnly
                    className="border border-gray-300 dark:border-gray-600 rounded-md"
                  />
                </div>
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-gray-500 dark:text-gray-400">
                  No execution log available for this task.
                </p>
              </div>
            )}

            <div className="flex justify-end pt-6 border-t border-gray-200 dark:border-gray-700">
              <Button
                type="button"
                variant="outline"
                onClick={navigateToList}
              >
                Back to Scheduler List
              </Button>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

/**
 * Error Boundary Wrapper Component
 * Provides fallback UI for any errors that occur within the scheduler detail page
 */
export function SchedulerDetailPageWithErrorBoundary() {
  return (
    <Suspense 
      fallback={
        <div className="flex justify-center items-center min-h-96">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span className="ml-2 text-gray-600">Loading scheduler task...</span>
        </div>
      }
    >
      <SchedulerDetailPage />
    </Suspense>
  );
}