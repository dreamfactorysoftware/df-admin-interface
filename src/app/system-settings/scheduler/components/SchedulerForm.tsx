'use client';

import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useRouter } from 'next/navigation';
import { Tab } from '@headlessui/react';
import dynamic from 'next/dynamic';

// Hooks for data fetching and mutations
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
import { Toggle } from '@/components/ui/toggle';

// Types
import { SchedulerTaskData, SchedulerTaskPayload } from '@/types/scheduler';
import { Service } from '@/types/service';

// Utilities
import { cn } from '@/lib/utils';

// Dynamic imports for heavy components
const AceEditor = dynamic(() => import('@/components/ui/ace-editor'), { 
  ssr: false,
  loading: () => <div className="h-32 bg-gray-50 animate-pulse rounded-md" />
});

/**
 * Zod validation schema for scheduler form
 * Provides comprehensive validation with real-time feedback
 */
const schedulerFormSchema = z.object({
  name: z.string()
    .min(1, 'Task name is required')
    .max(64, 'Task name must be 64 characters or less')
    .regex(/^[a-zA-Z0-9_\-\s]+$/, 'Task name can only contain letters, numbers, spaces, hyphens, and underscores'),
  
  description: z.string()
    .max(255, 'Description must be 255 characters or less')
    .optional(),
  
  isActive: z.boolean()
    .default(true),
  
  serviceId: z.string()
    .min(1, 'Service selection is required'),
  
  component: z.string()
    .min(1, 'Component selection is required'),
  
  verb: z.enum(['GET', 'POST', 'PUT', 'PATCH', 'DELETE'])
    .default('GET'),
  
  frequency: z.number()
    .min(1, 'Frequency must be at least 1 second')
    .max(86400, 'Frequency cannot exceed 24 hours (86400 seconds)'),
  
  payload: z.string()
    .optional()
    .refine((value) => {
      if (!value || value.trim() === '') return true;
      try {
        JSON.parse(value);
        return true;
      } catch {
        return false;
      }
    }, 'Payload must be valid JSON')
});

type SchedulerFormData = z.infer<typeof schedulerFormSchema>;

/**
 * HTTP verbs configuration for verb picker
 */
const HTTP_VERBS = [
  { value: 'GET', label: 'GET', color: 'bg-blue-100 text-blue-800' },
  { value: 'POST', label: 'POST', color: 'bg-green-100 text-green-800' },
  { value: 'PUT', label: 'PUT', color: 'bg-yellow-100 text-yellow-800' },
  { value: 'PATCH', label: 'PATCH', color: 'bg-purple-100 text-purple-800' },
  { value: 'DELETE', label: 'DELETE', color: 'bg-red-100 text-red-800' },
] as const;

interface SchedulerFormProps {
  /** Task ID for edit mode, undefined for create mode */
  taskId?: string;
  /** Callback function called when form is successfully submitted */
  onSuccess?: (task: SchedulerTaskData) => void;
  /** Callback function called when form is cancelled */
  onCancel?: () => void;
}

/**
 * SchedulerForm component for creating and editing scheduler tasks
 * 
 * This React component replaces the Angular DfSchedulerDetailsComponent,
 * implementing React Hook Form with Zod validation, Tailwind CSS styling,
 * and comprehensive accessibility features.
 * 
 * Features:
 * - Supports both create and edit modes
 * - Real-time form validation with Zod schema
 * - Service and component dropdown population via React Query
 * - JSON payload editing with syntax highlighting
 * - HTTP method selection with conditional payload field
 * - Tabbed interface for Basic and Log information
 * - Optimistic updates with rollback on failure
 * - Responsive design and keyboard navigation
 */
export default function SchedulerForm({ taskId, onSuccess, onCancel }: SchedulerFormProps) {
  const router = useRouter();
  const isEditMode = Boolean(taskId);
  
  // State for component management
  const [selectedServiceId, setSelectedServiceId] = useState<string>('');
  const [componentOptions, setComponentOptions] = useState<string[]>([]);
  const [isLoadingComponents, setIsLoadingComponents] = useState(false);
  const [selectedTab, setSelectedTab] = useState(0);
  const [alertMessage, setAlertMessage] = useState<string>('');
  const [alertType, setAlertType] = useState<'success' | 'error' | 'info'>('info');
  const [showAlert, setShowAlert] = useState(false);

  // Data fetching hooks
  const { data: services, isLoading: isLoadingServices } = useServices();
  const { data: taskData, isLoading: isLoadingTask } = useSchedulerTask(taskId!, {
    enabled: isEditMode
  });

  // Mutation hooks for create/update operations
  const createSchedulerTask = useCreateSchedulerTask();
  const updateSchedulerTask = useUpdateSchedulerTask();

  // Form configuration with Zod validation
  const form = useForm<SchedulerFormData>({
    resolver: zodResolver(schedulerFormSchema),
    defaultValues: {
      name: '',
      description: '',
      isActive: true,
      serviceId: '',
      component: '',
      verb: 'GET',
      frequency: 60,
      payload: ''
    },
    mode: 'onChange' // Enable real-time validation
  });

  const { control, handleSubmit, watch, setValue, formState: { errors, isValid, isDirty } } = form;
  
  // Watch form values for conditional logic
  const watchedServiceId = watch('serviceId');
  const watchedVerb = watch('verb');
  const showPayloadField = watchedVerb !== 'GET';

  /**
   * Fetches component options for the selected service
   */
  const fetchComponentOptions = useCallback(async (serviceId: string) => {
    if (!serviceId || !services) return;
    
    const service = services.find(s => s.id === serviceId);
    if (!service) return;

    setIsLoadingComponents(true);
    try {
      // Simulated API call - replace with actual service call
      // This would typically call an API to get the service's access list
      const response = await fetch(`/api/v2/${service.name}?as_access_list=true`);
      if (response.ok) {
        const data = await response.json();
        setComponentOptions(data.resource || []);
      }
    } catch (error) {
      console.error('Failed to fetch component options:', error);
      setComponentOptions([]);
    } finally {
      setIsLoadingComponents(false);
    }
  }, [services]);

  /**
   * Effect to populate form with existing task data in edit mode
   */
  useEffect(() => {
    if (isEditMode && taskData) {
      setValue('name', taskData.name);
      setValue('description', taskData.description || '');
      setValue('isActive', taskData.isActive);
      setValue('serviceId', taskData.serviceId);
      setValue('component', taskData.component);
      setValue('verb', taskData.verb as any);
      setValue('frequency', taskData.frequency);
      
      if (taskData.payload && taskData.verb !== 'GET') {
        setValue('payload', typeof taskData.payload === 'string' 
          ? taskData.payload 
          : JSON.stringify(taskData.payload, null, 2)
        );
      }

      setSelectedServiceId(taskData.serviceId);
    }
  }, [isEditMode, taskData, setValue]);

  /**
   * Effect to fetch component options when service changes
   */
  useEffect(() => {
    if (watchedServiceId) {
      setSelectedServiceId(watchedServiceId);
      fetchComponentOptions(watchedServiceId);
      
      // Reset component selection when service changes
      if (watchedServiceId !== selectedServiceId) {
        setValue('component', '');
      }
    }
  }, [watchedServiceId, selectedServiceId, fetchComponentOptions, setValue]);

  /**
   * Effect to clear payload when switching to GET method
   */
  useEffect(() => {
    if (watchedVerb === 'GET') {
      setValue('payload', '');
    }
  }, [watchedVerb, setValue]);

  /**
   * Displays alert message with auto-dismiss
   */
  const showAlertMessage = useCallback((type: 'success' | 'error' | 'info', message: string) => {
    setAlertType(type);
    setAlertMessage(message);
    setShowAlert(true);
    
    // Auto-dismiss success messages after 3 seconds
    if (type === 'success') {
      setTimeout(() => setShowAlert(false), 3000);
    }
  }, []);

  /**
   * Handles form submission for both create and update modes
   */
  const onSubmit = async (data: SchedulerFormData) => {
    if (!isValid || !isDirty) return;

    try {
      const selectedService = services?.find(s => s.id === data.serviceId);
      if (!selectedService) {
        showAlertMessage('error', 'Selected service not found');
        return;
      }

      // Prepare payload for API
      const payload: SchedulerTaskPayload = {
        name: data.name,
        description: data.description,
        isActive: data.isActive,
        serviceId: data.serviceId,
        component: data.component,
        verb: data.verb,
        frequency: data.frequency,
        payload: data.payload && data.payload.trim() 
          ? JSON.parse(data.payload) 
          : undefined
      };

      if (isEditMode && taskId) {
        // Update existing task with optimistic updates
        await updateSchedulerTask.mutateAsync({
          id: taskId,
          data: payload
        });
        showAlertMessage('success', 'Scheduler task updated successfully');
      } else {
        // Create new task
        const newTask = await createSchedulerTask.mutateAsync(payload);
        showAlertMessage('success', 'Scheduler task created successfully');
        onSuccess?.(newTask);
      }

      // Navigate back to scheduler list
      setTimeout(() => {
        router.push('/system-settings/scheduler');
      }, 1000);

    } catch (error: any) {
      const errorMessage = error?.message || 'Failed to save scheduler task';
      showAlertMessage('error', errorMessage);
    }
  };

  /**
   * Handles form cancellation
   */
  const handleCancel = useCallback(() => {
    onCancel?.();
    router.push('/system-settings/scheduler');
  }, [onCancel, router]);

  /**
   * Gets the verb picker button styling based on selected value
   */
  const getVerbStyling = (verb: string) => {
    const config = HTTP_VERBS.find(v => v.value === verb);
    return config?.color || 'bg-gray-100 text-gray-800';
  };

  /**
   * Formats execution log content for display
   */
  const formatLogContent = useMemo(() => {
    if (!taskData?.taskLogByTaskId?.content) return 'No execution logs available';
    
    try {
      const parsed = JSON.parse(taskData.taskLogByTaskId.content);
      return JSON.stringify(parsed, null, 2);
    } catch {
      return taskData.taskLogByTaskId.content;
    }
  }, [taskData?.taskLogByTaskId?.content]);

  // Loading state for edit mode
  if (isEditMode && isLoadingTask) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-4xl mx-auto p-6 space-y-6">
      {/* Alert Component */}
      {showAlert && (
        <div 
          className={cn(
            "p-4 rounded-md border-l-4",
            alertType === 'success' && "bg-green-50 border-green-400 text-green-700",
            alertType === 'error' && "bg-red-50 border-red-400 text-red-700",
            alertType === 'info' && "bg-blue-50 border-blue-400 text-blue-700"
          )}
          role="alert"
          aria-live="polite"
        >
          <div className="flex justify-between items-center">
            <span>{alertMessage}</span>
            <button
              onClick={() => setShowAlert(false)}
              className="text-current opacity-70 hover:opacity-100"
              aria-label="Dismiss alert"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      )}

      {/* Tab Navigation */}
      <Tab.Group selectedIndex={selectedTab} onChange={setSelectedTab}>
        <Tab.List className="flex space-x-1 rounded-xl bg-blue-900/20 p-1">
          <Tab
            className={({ selected }) =>
              cn(
                "w-full rounded-lg py-2.5 text-sm font-medium leading-5",
                "ring-white ring-opacity-60 ring-offset-2 ring-offset-blue-400 focus:outline-none focus:ring-2",
                selected
                  ? "bg-white shadow text-blue-700"
                  : "text-blue-100 hover:bg-white/[0.12] hover:text-white"
              )
            }
          >
            Basic
          </Tab>
          {isEditMode && (
            <Tab
              className={({ selected }) =>
                cn(
                  "w-full rounded-lg py-2.5 text-sm font-medium leading-5",
                  "ring-white ring-opacity-60 ring-offset-2 ring-offset-blue-400 focus:outline-none focus:ring-2",
                  selected
                    ? "bg-white shadow text-blue-700"
                    : "text-blue-100 hover:bg-white/[0.12] hover:text-white"
                )
              }
            >
              Log
            </Tab>
          )}
        </Tab.List>

        <Tab.Panels className="mt-6">
          {/* Basic Tab */}
          <Tab.Panel 
            className={cn(
              "rounded-xl bg-white p-6",
              "ring-white ring-opacity-60 ring-offset-2 ring-offset-blue-400 focus:outline-none focus:ring-2"
            )}
          >
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-gray-900">
                {isEditMode ? 'Edit Scheduler Task' : 'Create New Scheduler Task'}
              </h3>
              <p className="text-sm text-gray-600">
                Configure the task details and execution parameters
              </p>
            </div>

            <Form {...form}>
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                {/* First Row: Name and Active Toggle */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <FormField
                    control={control}
                    name="name"
                    render={({ field }) => (
                      <FormItem className="md:col-span-2">
                        <FormLabel>Task Name *</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="Enter task name"
                            {...field}
                            aria-describedby="name-error"
                            className="transition-colors duration-200"
                          />
                        </FormControl>
                        <FormMessage id="name-error" />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={control}
                    name="isActive"
                    render={({ field }) => (
                      <FormItem className="flex flex-col justify-end">
                        <FormLabel>Status</FormLabel>
                        <FormControl>
                          <div className="flex items-center space-x-2">
                            <Toggle
                              pressed={field.value}
                              onPressedChange={field.onChange}
                              aria-label="Toggle task active status"
                              className="data-[state=on]:bg-green-600"
                            />
                            <span className="text-sm text-gray-600">
                              {field.value ? 'Active' : 'Inactive'}
                            </span>
                          </div>
                        </FormControl>
                        <FormMessage />
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
                          placeholder="Enter task description (optional)"
                          className="min-h-[80px] resize-none"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Second Row: Service and Component */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <FormField
                    control={control}
                    name="serviceId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Service *</FormLabel>
                        <FormControl>
                          <Select value={field.value} onValueChange={field.onChange}>
                            <SelectTrigger>
                              <SelectValue placeholder="Select a service" />
                            </SelectTrigger>
                            <SelectContent>
                              {isLoadingServices ? (
                                <SelectItem value="loading" disabled>
                                  Loading services...
                                </SelectItem>
                              ) : (
                                services?.map((service) => (
                                  <SelectItem key={service.id} value={service.id}>
                                    {service.name}
                                  </SelectItem>
                                ))
                              )}
                            </SelectContent>
                          </Select>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={control}
                    name="component"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Component *</FormLabel>
                        <FormControl>
                          <Select 
                            value={field.value} 
                            onValueChange={field.onChange}
                            disabled={!selectedServiceId || isLoadingComponents}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder={
                                !selectedServiceId 
                                  ? "Select a service first" 
                                  : isLoadingComponents 
                                    ? "Loading components..."
                                    : "Select a component"
                              } />
                            </SelectTrigger>
                            <SelectContent>
                              {componentOptions.map((component) => (
                                <SelectItem key={component} value={component}>
                                  {component}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {/* Third Row: HTTP Verb and Frequency */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <FormField
                    control={control}
                    name="verb"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>HTTP Method *</FormLabel>
                        <FormControl>
                          <Select value={field.value} onValueChange={field.onChange}>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {HTTP_VERBS.map((verb) => (
                                <SelectItem key={verb.value} value={verb.value}>
                                  <div className="flex items-center space-x-2">
                                    <span className={cn(
                                      "px-2 py-1 rounded text-xs font-medium",
                                      verb.color
                                    )}>
                                      {verb.label}
                                    </span>
                                  </div>
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

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
                            max="86400"
                            placeholder="60"
                            {...field}
                            onChange={(e) => field.onChange(Number(e.target.value))}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {/* Conditional Payload Field */}
                {showPayloadField && (
                  <FormField
                    control={control}
                    name="payload"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>JSON Payload</FormLabel>
                        <FormControl>
                          <div className="border rounded-md">
                            <AceEditor
                              mode="json"
                              theme="github"
                              value={field.value || ''}
                              onChange={field.onChange}
                              width="100%"
                              height="200px"
                              setOptions={{
                                enableBasicAutocompletion: true,
                                enableLiveAutocompletion: true,
                                enableSnippets: true,
                                showLineNumbers: true,
                                tabSize: 2,
                                fontSize: 14
                              }}
                              editorProps={{ $blockScrolling: true }}
                            />
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}

                {/* Action Buttons */}
                <div className="flex justify-end space-x-4 pt-6 border-t">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleCancel}
                    className="min-w-[100px]"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={!isValid || !isDirty || createSchedulerTask.isPending || updateSchedulerTask.isPending}
                    className="min-w-[100px]"
                  >
                    {createSchedulerTask.isPending || updateSchedulerTask.isPending ? (
                      <div className="flex items-center space-x-2">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                        <span>Saving...</span>
                      </div>
                    ) : (
                      isEditMode ? 'Update Task' : 'Create Task'
                    )}
                  </Button>
                </div>
              </form>
            </Form>
          </Tab.Panel>

          {/* Log Tab (only visible in edit mode) */}
          {isEditMode && (
            <Tab.Panel 
              className={cn(
                "rounded-xl bg-white p-6",
                "ring-white ring-opacity-60 ring-offset-2 ring-offset-blue-400 focus:outline-none focus:ring-2"
              )}
            >
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    Execution Log
                  </h3>
                  <p className="text-sm text-gray-600">
                    View the latest execution results for this task
                  </p>
                </div>

                {/* Status Information */}
                {taskData?.taskLogByTaskId && (
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                      <div>
                        <span className="font-medium text-gray-700">Status Code:</span>
                        <span className={cn(
                          "ml-2 px-2 py-1 rounded text-xs font-medium",
                          taskData.taskLogByTaskId.statusCode < 300 
                            ? "bg-green-100 text-green-800"
                            : taskData.taskLogByTaskId.statusCode < 400
                              ? "bg-yellow-100 text-yellow-800"
                              : "bg-red-100 text-red-800"
                        )}>
                          {taskData.taskLogByTaskId.statusCode}
                        </span>
                      </div>
                      <div>
                        <span className="font-medium text-gray-700">Start Time:</span>
                        <span className="ml-2 text-gray-600">
                          {new Date(taskData.taskLogByTaskId.startTime).toLocaleString()}
                        </span>
                      </div>
                      <div>
                        <span className="font-medium text-gray-700">Duration:</span>
                        <span className="ml-2 text-gray-600">
                          {taskData.taskLogByTaskId.duration || 'N/A'}ms
                        </span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Log Content */}
                <div className="border rounded-md">
                  <AceEditor
                    mode="json"
                    theme="github"
                    value={formatLogContent}
                    readOnly
                    width="100%"
                    height="300px"
                    setOptions={{
                      showLineNumbers: true,
                      tabSize: 2,
                      fontSize: 14,
                      wrap: true
                    }}
                    editorProps={{ $blockScrolling: true }}
                  />
                </div>

                {/* Back Button */}
                <div className="flex justify-end pt-4 border-t">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleCancel}
                  >
                    Go Back
                  </Button>
                </div>
              </div>
            </Tab.Panel>
          )}
        </Tab.Panels>
      </Tab.Group>
    </div>
  );
}