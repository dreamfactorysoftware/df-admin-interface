'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { useForm, useController } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'next/navigation';
import { z } from 'zod';
import { Tab } from '@headlessui/react';
import { 
  ChevronRightIcon, 
  ExclamationTriangleIcon,
  CheckCircleIcon,
  InformationCircleIcon 
} from '@heroicons/react/24/outline';

// Types and Hooks
import { 
  SchedulerTaskData, 
  CreateSchedulePayload, 
  UpdateSchedulePayload 
} from '@/types/scheduler';
import { Service } from '@/types/service';
import { useSchedulerTask } from '@/hooks/useSchedulerTask';
import { useCreateSchedulerTask } from '@/hooks/useCreateSchedulerTask';
import { useUpdateSchedulerTask } from '@/hooks/useUpdateSchedulerTask';
import { useServices } from '@/hooks/useServices';

// UI Components
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/toggle';
import { AceEditor } from '@/components/ui/ace-editor';

// Utilities
import { cn } from '@/lib/utils';
import { schedulerValidationSchema } from '@/lib/validations/scheduler';

// HTTP Methods configuration
const HTTP_METHODS = [
  { value: 'GET', label: 'GET' },
  { value: 'POST', label: 'POST' },
  { value: 'PUT', label: 'PUT' },
  { value: 'PATCH', label: 'PATCH' },
  { value: 'DELETE', label: 'DELETE' }
] as const;

// Zod validation schema for the scheduler form
const formSchema = z.object({
  name: z.string().min(1, 'Task name is required'),
  description: z.string().optional(),
  active: z.boolean().default(true),
  serviceId: z.number().min(1, 'Service selection is required'),
  component: z.string().min(1, 'Component selection is required'),
  method: z.enum(['GET', 'POST', 'PUT', 'PATCH', 'DELETE']).default('GET'),
  frequency: z.number().min(1, 'Frequency must be a positive number'),
  payload: z.string().optional().refine((val) => {
    if (!val || val.trim() === '') return true;
    try {
      JSON.parse(val);
      return true;
    } catch {
      return false;
    }
  }, 'Payload must be valid JSON')
});

type FormData = z.infer<typeof formSchema>;

interface SchedulerFormProps {
  taskId?: number;
  onSubmit?: (data: FormData) => void;
  onCancel?: () => void;
  className?: string;
}

export default function SchedulerForm({ 
  taskId, 
  onSubmit: onSubmitProp, 
  onCancel: onCancelProp,
  className 
}: SchedulerFormProps) {
  const router = useRouter();
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [componentOptions, setComponentOptions] = useState<string[]>([]);
  const [log, setLog] = useState<string>('');
  const [selectedTab, setSelectedTab] = useState(0);

  // React Query hooks for data fetching and mutations
  const { data: services = [], isLoading: servicesLoading } = useServices();
  const { data: existingTask, isLoading: taskLoading } = useSchedulerTask(taskId);
  const createMutation = useCreateSchedulerTask();
  const updateMutation = useUpdateSchedulerTask();

  // React Hook Form setup
  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      description: '',
      active: true,
      serviceId: 0,
      component: '',
      method: 'GET',
      frequency: 1,
      payload: ''
    }
  });

  const { control, handleSubmit, watch, setValue, reset, formState: { errors, isSubmitting } } = form;

  // Watch form fields for reactive updates
  const watchedMethod = watch('method');
  const watchedServiceId = watch('serviceId');
  const watchedPayload = watch('payload');

  // Show/hide payload field based on HTTP method
  const showPayloadField = watchedMethod !== 'GET';

  // Fetch component options when service changes
  const fetchComponentOptions = useCallback(async (serviceId: number) => {
    if (!serviceId) {
      setComponentOptions([]);
      return;
    }

    const service = services.find(s => s.id === serviceId);
    if (!service) {
      setComponentOptions([]);
      return;
    }

    setSelectedService(service);

    try {
      // Mock API call - in real implementation, this would fetch from the service
      // This simulates the getServiceAccessList method from the Angular component
      const response = await fetch(`/api/services/${service.name}?as_access_list=true`);
      if (response.ok) {
        const data = await response.json();
        setComponentOptions(data.resource || []);
      } else {
        setComponentOptions([]);
      }
    } catch (error) {
      console.error('Failed to fetch component options:', error);
      setComponentOptions([]);
    }
  }, [services]);

  // Load existing task data when editing
  useEffect(() => {
    if (existingTask) {
      const taskData = existingTask as SchedulerTaskData;
      
      reset({
        name: taskData.name,
        description: taskData.description || '',
        active: taskData.isActive,
        serviceId: taskData.serviceId,
        component: taskData.component,
        method: taskData.verb as any,
        frequency: taskData.frequency,
        payload: taskData.payload || ''
      });

      // Set log content
      setLog(taskData.taskLogByTaskId?.content || '');

      // Fetch component options for the selected service
      if (taskData.serviceId) {
        fetchComponentOptions(taskData.serviceId);
      }
    }
  }, [existingTask, reset, fetchComponentOptions]);

  // Fetch component options when service selection changes
  useEffect(() => {
    if (watchedServiceId) {
      fetchComponentOptions(watchedServiceId);
      // Reset component selection when service changes
      setValue('component', '');
    }
  }, [watchedServiceId, fetchComponentOptions, setValue]);

  // Helper function to get verb mask
  const getVerbMask = (verb: string): number => {
    switch (verb) {
      case 'GET': return 1;
      case 'POST': return 2;
      case 'PUT': return 4;
      case 'PATCH': return 8;
      case 'DELETE': return 16;
      default: return 1;
    }
  };

  // Form submission handler
  const onSubmit = async (data: FormData) => {
    if (!selectedService) return;

    try {
      const basePayload = {
        component: data.component,
        description: data.description || null,
        frequency: data.frequency,
        isActive: data.active,
        name: data.name,
        payload: showPayloadField ? data.payload || null : null,
        serviceId: data.serviceId,
        serviceName: selectedService.name,
        verb: data.method,
        service: {
          id: data.serviceId,
          name: selectedService.name,
          label: selectedService.label,
          description: selectedService.description,
          type: selectedService.type,
          components: componentOptions,
        },
        verbMask: getVerbMask(data.method),
      };

      if (taskId && existingTask) {
        // Update existing task
        const updatePayload: UpdateSchedulePayload = {
          ...basePayload,
          id: taskId,
          lastModifiedDate: existingTask.lastModifiedDate,
          lastModifiedById: existingTask.lastModifiedById,
          hasLog: !!existingTask.taskLogByTaskId,
          createdDate: existingTask.createdDate,
          createdById: existingTask.createdById,
          taskLogByTaskId: existingTask.taskLogByTaskId
        };
        
        await updateMutation.mutateAsync({ id: taskId, data: updatePayload });
      } else {
        // Create new task
        const createPayload: CreateSchedulePayload = {
          ...basePayload,
          id: null
        };
        
        await createMutation.mutateAsync(createPayload);
      }

      // Handle success
      if (onSubmitProp) {
        onSubmitProp(data);
      } else {
        router.push('/system-settings/scheduler');
      }
    } catch (error) {
      console.error('Form submission error:', error);
      // Error handling would be done by the mutation hooks with toast notifications
    }
  };

  const handleCancel = () => {
    if (onCancelProp) {
      onCancelProp();
    } else {
      router.push('/system-settings/scheduler');
    }
  };

  // Loading state
  if (taskLoading || servicesLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin h-8 w-8 border-2 border-primary-500 border-t-transparent rounded-full" />
        <span className="ml-2 text-sm text-gray-600 dark:text-gray-400">Loading...</span>
      </div>
    );
  }

  return (
    <div className={cn("w-full max-w-4xl mx-auto", className)}>
      <Tab.Group selectedIndex={selectedTab} onChange={setSelectedTab}>
        <Tab.List className="flex space-x-1 rounded-xl bg-gray-100 dark:bg-gray-800 p-1 mb-6">
          <Tab
            className={({ selected }) =>
              cn(
                'w-full rounded-lg py-2.5 text-sm font-medium leading-5',
                'ring-white ring-opacity-60 ring-offset-2 ring-offset-blue-400 focus:outline-none focus:ring-2',
                selected
                  ? 'bg-white dark:bg-gray-700 text-blue-700 dark:text-blue-300 shadow'
                  : 'text-gray-600 dark:text-gray-400 hover:bg-white/[0.12] hover:text-gray-800 dark:hover:text-gray-200'
              )
            }
          >
            Basic
          </Tab>
          <Tab
            className={({ selected }) =>
              cn(
                'w-full rounded-lg py-2.5 text-sm font-medium leading-5',
                'ring-white ring-opacity-60 ring-offset-2 ring-offset-blue-400 focus:outline-none focus:ring-2',
                selected
                  ? 'bg-white dark:bg-gray-700 text-blue-700 dark:text-blue-300 shadow'
                  : 'text-gray-600 dark:text-gray-400 hover:bg-white/[0.12] hover:text-gray-800 dark:hover:text-gray-200'
              )
            }
          >
            Log
          </Tab>
        </Tab.List>

        <Tab.Panels>
          {/* Basic Tab */}
          <Tab.Panel className="rounded-xl bg-white dark:bg-gray-800 p-6 shadow-sm border border-gray-200 dark:border-gray-700">
            <div className="mb-6">
              <h4 className="text-lg font-medium text-gray-900 dark:text-gray-100">
                Task Configuration
              </h4>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                Configure the scheduler task settings and execution parameters.
              </p>
            </div>

            <Form {...form}>
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Task Name */}
                  <FormField
                    control={control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Task Name *</FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="Enter task name" 
                            {...field} 
                            aria-describedby={errors.name ? "name-error" : undefined}
                          />
                        </FormControl>
                        <FormMessage id="name-error" />
                      </FormItem>
                    )}
                  />

                  {/* Active Toggle */}
                  <FormField
                    control={control}
                    name="active"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                        <div className="space-y-0.5">
                          <FormLabel className="text-base">Active</FormLabel>
                          <div className="text-sm text-gray-600 dark:text-gray-400">
                            Enable or disable this scheduled task
                          </div>
                        </div>
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                            aria-describedby="active-description"
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                </div>

                {/* Description */}
                <FormField
                  control={control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Description</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Optional task description"
                          className="min-h-[80px]"
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Service Selection */}
                  <FormField
                    control={control}
                    name="serviceId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Service *</FormLabel>
                        <Select 
                          onValueChange={(value) => field.onChange(parseInt(value))}
                          value={field.value?.toString()}
                        >
                          <FormControl>
                            <SelectTrigger>
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

                  {/* Component Selection */}
                  <FormField
                    control={control}
                    name="component"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Component *</FormLabel>
                        <Select 
                          onValueChange={field.onChange}
                          value={field.value}
                          disabled={!watchedServiceId || componentOptions.length === 0}
                        >
                          <FormControl>
                            <SelectTrigger>
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
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* HTTP Method */}
                  <FormField
                    control={control}
                    name="method"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>HTTP Method *</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select HTTP method" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {HTTP_METHODS.map((method) => (
                              <SelectItem key={method.value} value={method.value}>
                                <span className={cn(
                                  "font-mono text-xs px-2 py-1 rounded",
                                  method.value === 'GET' && "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
                                  method.value === 'POST' && "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
                                  method.value === 'PUT' && "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
                                  method.value === 'PATCH' && "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200",
                                  method.value === 'DELETE' && "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
                                )}>
                                  {method.label}
                                </span>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Frequency */}
                  <FormField
                    control={control}
                    name="frequency"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Frequency (seconds) *</FormLabel>
                        <FormControl>
                          <Input 
                            type="number"
                            min="1"
                            placeholder="Enter frequency in seconds"
                            {...field}
                            onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {/* Payload Field - Conditional */}
                {showPayloadField && (
                  <FormField
                    control={control}
                    name="payload"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>
                          JSON Payload
                          <span className="text-sm text-gray-500 ml-2">(Optional)</span>
                        </FormLabel>
                        <FormControl>
                          <div className="relative">
                            <AceEditor
                              mode="json"
                              theme="github"
                              value={field.value || ''}
                              onChange={field.onChange}
                              placeholder="Enter JSON payload..."
                              className="min-h-[120px] border rounded-md"
                              setOptions={{
                                useWorker: false,
                                showLineNumbers: true,
                                tabSize: 2,
                              }}
                            />
                          </div>
                        </FormControl>
                        <FormMessage />
                        {field.value && (
                          <div className="text-xs text-gray-500 mt-1">
                            <InformationCircleIcon className="inline w-3 h-3 mr-1" />
                            Payload will be sent as JSON in the request body
                          </div>
                        )}
                      </FormItem>
                    )}
                  />
                )}

                {/* Form Actions */}
                <div className="flex items-center justify-end space-x-4 pt-6 border-t border-gray-200 dark:border-gray-700">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleCancel}
                    disabled={isSubmitting}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={isSubmitting}
                    className="min-w-[100px]"
                  >
                    {isSubmitting ? (
                      <div className="flex items-center">
                        <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full mr-2" />
                        Saving...
                      </div>
                    ) : (
                      <>
                        <CheckCircleIcon className="w-4 h-4 mr-2" />
                        {taskId ? 'Update' : 'Create'} Task
                      </>
                    )}
                  </Button>
                </div>
              </form>
            </Form>
          </Tab.Panel>

          {/* Log Tab */}
          <Tab.Panel className="rounded-xl bg-white dark:bg-gray-800 p-6 shadow-sm border border-gray-200 dark:border-gray-700">
            <div className="mb-6">
              <h4 className="text-lg font-medium text-gray-900 dark:text-gray-100">
                Task Execution Log
              </h4>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                View the execution history and logs for this scheduled task.
              </p>
            </div>

            {existingTask?.taskLogByTaskId ? (
              <div className="space-y-4">
                <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      Status Code:
                    </span>
                    <span className={cn(
                      "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium",
                      existingTask.taskLogByTaskId.statusCode >= 200 && existingTask.taskLogByTaskId.statusCode < 300
                        ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                        : "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
                    )}>
                      {existingTask.taskLogByTaskId.statusCode}
                    </span>
                  </div>
                  <div className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                    Last executed: {new Date(existingTask.taskLogByTaskId.lastModifiedDate).toLocaleString()}
                  </div>
                </div>

                <div className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
                  <AceEditor
                    mode="text"
                    theme="github"
                    value={log}
                    readOnly={true}
                    className="min-h-[300px]"
                    setOptions={{
                      useWorker: false,
                      showLineNumbers: true,
                      showGutter: true,
                      highlightActiveLine: false,
                      showPrintMargin: false,
                    }}
                  />
                </div>
              </div>
            ) : (
              <div className="text-center py-12">
                <ExclamationTriangleIcon className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-gray-100">
                  No execution logs
                </h3>
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                  This task hasn't been executed yet or logs are not available.
                </p>
              </div>
            )}

            <div className="flex justify-end pt-6 border-t border-gray-200 dark:border-gray-700">
              <Button
                type="button"
                variant="outline"
                onClick={handleCancel}
              >
                Go Back
              </Button>
            </div>
          </Tab.Panel>
        </Tab.Panels>
      </Tab.Group>
    </div>
  );
}