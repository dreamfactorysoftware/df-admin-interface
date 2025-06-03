'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Tab } from '@headlessui/react';
import { 
  ExclamationTriangleIcon,
  InformationCircleIcon,
  CheckCircleIcon,
  XMarkIcon 
} from '@heroicons/react/24/outline';

// Types (would typically come from src/types/scheduler.ts)
interface SchedulerTaskData {
  id: number;
  name: string;
  description: string;
  isActive: boolean;
  serviceId: number;
  component: string;
  frequency: number;
  payload: string | null;
  createdDate: string;
  lastModifiedDate: string;
  createdById: number;
  lastModifiedById: number | null;
  verb: string;
  verbMask: number;
  taskLogByTaskId: {
    taskId: number;
    statusCode: number;
    lastModifiedDate: string;
    createdDate: string;
    content: string;
  } | null;
  serviceByServiceId: Service;
}

interface Service {
  id: number;
  name: string;
  label: string;
  description: string;
  isActive: boolean;
  type: string;
  mutable: boolean;
  deletable: boolean;
  createdDate: string;
  lastModifiedDate: string;
  createdById: number | null;
  lastModifiedById: number | null;
  config: any;
  serviceDocByServiceId: number | null;
  refresh: boolean;
}

interface CreateSchedulePayload {
  component: string;
  description: string | null;
  frequency: number;
  id: number | null;
  isActive: boolean;
  name: string;
  payload: string | null;
  service: {
    id: number;
    name: string;
    label: string;
    description: string;
    type: string;
    components: string[];
  };
  serviceId: number;
  serviceName: string;
  verb: string;
  verbMask: number;
}

interface UpdateSchedulePayload extends CreateSchedulePayload {
  createdById: number;
  createdDate: string;
  hasLog: boolean;
  lastModifiedById: number | null;
  lastModifiedDate: string;
}

// Zod validation schema
const schedulerFormSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  description: z.string().optional(),
  active: z.boolean(),
  serviceId: z.number().min(1, 'Service is required'),
  component: z.string().min(1, 'Component is required'),
  method: z.enum(['GET', 'POST', 'PUT', 'PATCH', 'DELETE']),
  frequency: z.number().min(0).optional(),
  payload: z.string().optional().refine(
    (value) => {
      if (!value || value.trim() === '') return true;
      try {
        JSON.parse(value);
        return true;
      } catch {
        return false;
      }
    },
    { message: 'Payload must be valid JSON' }
  ),
});

type SchedulerFormData = z.infer<typeof schedulerFormSchema>;

// Custom Alert Component
interface AlertProps {
  type: 'error' | 'warning' | 'success' | 'info';
  message: string;
  onClose: () => void;
}

const Alert: React.FC<AlertProps> = ({ type, message, onClose }) => {
  const iconMap = {
    error: XMarkIcon,
    warning: ExclamationTriangleIcon,
    success: CheckCircleIcon,
    info: InformationCircleIcon,
  };

  const colorMap = {
    error: 'bg-red-50 border-red-200 text-red-800',
    warning: 'bg-yellow-50 border-yellow-200 text-yellow-800',
    success: 'bg-green-50 border-green-200 text-green-800',
    info: 'bg-blue-50 border-blue-200 text-blue-800',
  };

  const IconComponent = iconMap[type];

  return (
    <div className={`border rounded-md p-4 mb-4 ${colorMap[type]}`}>
      <div className="flex">
        <div className="flex-shrink-0">
          <IconComponent className="h-5 w-5" aria-hidden="true" />
        </div>
        <div className="ml-3 flex-1">
          <p className="text-sm font-medium">{message}</p>
        </div>
        <div className="ml-auto pl-3">
          <div className="-mx-1.5 -my-1.5">
            <button
              type="button"
              className="inline-flex rounded-md p-1.5 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-red-50 focus:ring-red-600"
              onClick={onClose}
            >
              <span className="sr-only">Dismiss</span>
              <XMarkIcon className="h-5 w-5" aria-hidden="true" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// Custom Input Components
interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
  required?: boolean;
}

const Input: React.FC<InputProps> = ({ label, error, required, className, ...props }) => (
  <div className="space-y-2">
    <label className="block text-sm font-medium text-gray-900 dark:text-gray-100">
      {label}
      {required && <span className="text-red-500 ml-1">*</span>}
    </label>
    <input
      className={`block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-primary-600 sm:text-sm sm:leading-6 dark:bg-gray-800 dark:text-gray-100 dark:ring-gray-600 ${
        error ? 'ring-red-300 focus:ring-red-500' : ''
      } ${className || ''}`}
      {...props}
    />
    {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}
  </div>
);

interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label: string;
  error?: string;
  required?: boolean;
}

const Textarea: React.FC<TextareaProps> = ({ label, error, required, className, ...props }) => (
  <div className="space-y-2">
    <label className="block text-sm font-medium text-gray-900 dark:text-gray-100">
      {label}
      {required && <span className="text-red-500 ml-1">*</span>}
    </label>
    <textarea
      className={`block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-primary-600 sm:text-sm sm:leading-6 dark:bg-gray-800 dark:text-gray-100 dark:ring-gray-600 ${
        error ? 'ring-red-300 focus:ring-red-500' : ''
      } ${className || ''}`}
      {...props}
    />
    {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}
  </div>
);

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label: string;
  error?: string;
  required?: boolean;
  options: Array<{ value: string | number; label: string }>;
}

const Select: React.FC<SelectProps> = ({ label, error, required, options, className, ...props }) => (
  <div className="space-y-2">
    <label className="block text-sm font-medium text-gray-900 dark:text-gray-100">
      {label}
      {required && <span className="text-red-500 ml-1">*</span>}
    </label>
    <select
      className={`block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-inset focus:ring-primary-600 sm:text-sm sm:leading-6 dark:bg-gray-800 dark:text-gray-100 dark:ring-gray-600 ${
        error ? 'ring-red-300 focus:ring-red-500' : ''
      } ${className || ''}`}
      {...props}
    >
      <option value="">Select an option</option>
      {options.map((option) => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </select>
    {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}
  </div>
);

interface SwitchProps {
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  error?: string;
}

const Switch: React.FC<SwitchProps> = ({ label, checked, onChange, error }) => (
  <div className="space-y-2">
    <div className="flex items-center">
      <button
        type="button"
        className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-primary-600 focus:ring-offset-2 ${
          checked ? 'bg-primary-600' : 'bg-gray-200 dark:bg-gray-700'
        }`}
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
      >
        <span className="sr-only">{label}</span>
        <span
          aria-hidden="true"
          className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
            checked ? 'translate-x-5' : 'translate-x-0'
          }`}
        />
      </button>
      <span className="ml-3 text-sm font-medium text-gray-900 dark:text-gray-100">{label}</span>
    </div>
    {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}
  </div>
);

// ACE Editor Component (simplified for now)
interface AceEditorProps {
  value: string;
  readonly?: boolean;
  className?: string;
}

const AceEditor: React.FC<AceEditorProps> = ({ value, readonly = false, className }) => (
  <div className={`border rounded-md ${className || ''}`}>
    <pre className="p-4 text-sm bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100 whitespace-pre-wrap overflow-auto max-h-96">
      {value || 'No content available'}
    </pre>
  </div>
);

// Button Component
interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
}

const Button: React.FC<ButtonProps> = ({ 
  children, 
  variant = 'primary', 
  size = 'md', 
  loading = false, 
  className,
  disabled,
  ...props 
}) => {
  const baseClasses = 'font-medium rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed';
  
  const variantClasses = {
    primary: 'bg-primary-600 text-white hover:bg-primary-700 focus:ring-primary-500',
    secondary: 'bg-gray-600 text-white hover:bg-gray-700 focus:ring-gray-500',
    danger: 'bg-red-600 text-white hover:bg-red-700 focus:ring-red-500',
  };

  const sizeClasses = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2 text-sm',
    lg: 'px-6 py-3 text-base',
  };

  return (
    <button
      className={`${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]} ${className || ''}`}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? (
        <div className="flex items-center">
          <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          Loading...
        </div>
      ) : (
        children
      )}
    </button>
  );
};

// API functions (would typically come from hooks or lib files)
const apiClient = {
  async getServices(): Promise<Service[]> {
    // Mock API call - would use actual API client
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve([
          {
            id: 1,
            name: 'mysql-service',
            label: 'MySQL Database',
            description: 'MySQL database service',
            isActive: true,
            type: 'mysql',
            mutable: true,
            deletable: true,
            createdDate: new Date().toISOString(),
            lastModifiedDate: new Date().toISOString(),
            createdById: 1,
            lastModifiedById: 1,
            config: {},
            serviceDocByServiceId: null,
            refresh: false,
          },
        ]);
      }, 100);
    });
  },

  async getServiceComponents(serviceName: string): Promise<string[]> {
    // Mock API call
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve(['users', 'products', 'orders', 'categories']);
      }, 100);
    });
  },

  async getSchedulerTask(id: string): Promise<SchedulerTaskData | null> {
    // Mock API call
    return new Promise((resolve) => {
      setTimeout(() => {
        if (id === 'new') {
          resolve(null);
        } else {
          resolve({
            id: parseInt(id),
            name: 'Test Task',
            description: 'Test task description',
            isActive: true,
            serviceId: 1,
            component: 'users',
            frequency: 60,
            payload: null,
            createdDate: new Date().toISOString(),
            lastModifiedDate: new Date().toISOString(),
            createdById: 1,
            lastModifiedById: 1,
            verb: 'GET',
            verbMask: 1,
            taskLogByTaskId: {
              taskId: parseInt(id),
              statusCode: 200,
              lastModifiedDate: new Date().toISOString(),
              createdDate: new Date().toISOString(),
              content: 'Task executed successfully',
            },
            serviceByServiceId: {
              id: 1,
              name: 'mysql-service',
              label: 'MySQL Database',
              description: 'MySQL database service',
              isActive: true,
              type: 'mysql',
              mutable: true,
              deletable: true,
              createdDate: new Date().toISOString(),
              lastModifiedDate: new Date().toISOString(),
              createdById: 1,
              lastModifiedById: 1,
              config: {},
              serviceDocByServiceId: null,
              refresh: false,
            },
          });
        }
      }, 100);
    });
  },

  async createSchedulerTask(payload: CreateSchedulePayload): Promise<SchedulerTaskData> {
    // Mock API call
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({
          id: Math.floor(Math.random() * 1000),
          name: payload.name,
          description: payload.description || '',
          isActive: payload.isActive,
          serviceId: payload.serviceId,
          component: payload.component,
          frequency: payload.frequency,
          payload: payload.payload,
          createdDate: new Date().toISOString(),
          lastModifiedDate: new Date().toISOString(),
          createdById: 1,
          lastModifiedById: 1,
          verb: payload.verb,
          verbMask: payload.verbMask,
          taskLogByTaskId: null,
          serviceByServiceId: {
            id: 1,
            name: 'mysql-service',
            label: 'MySQL Database',
            description: 'MySQL database service',
            isActive: true,
            type: 'mysql',
            mutable: true,
            deletable: true,
            createdDate: new Date().toISOString(),
            lastModifiedDate: new Date().toISOString(),
            createdById: 1,
            lastModifiedById: 1,
            config: {},
            serviceDocByServiceId: null,
            refresh: false,
          },
        });
      }, 1000);
    });
  },

  async updateSchedulerTask(id: number, payload: UpdateSchedulePayload): Promise<SchedulerTaskData> {
    // Mock API call
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({
          id,
          name: payload.name,
          description: payload.description || '',
          isActive: payload.isActive,
          serviceId: payload.serviceId,
          component: payload.component,
          frequency: payload.frequency,
          payload: payload.payload,
          createdDate: payload.createdDate,
          lastModifiedDate: new Date().toISOString(),
          createdById: payload.createdById,
          lastModifiedById: 1,
          verb: payload.verb,
          verbMask: payload.verbMask,
          taskLogByTaskId: null,
          serviceByServiceId: {
            id: 1,
            name: 'mysql-service',
            label: 'MySQL Database',
            description: 'MySQL database service',
            isActive: true,
            type: 'mysql',
            mutable: true,
            deletable: true,
            createdDate: new Date().toISOString(),
            lastModifiedDate: new Date().toISOString(),
            createdById: 1,
            lastModifiedById: 1,
            config: {},
            serviceDocByServiceId: null,
            refresh: false,
          },
        });
      }, 1000);
    });
  },
};

// Main Page Component
export default function SchedulerDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const queryClient = useQueryClient();
  
  const [alert, setAlert] = useState<{ type: 'error' | 'warning' | 'success' | 'info'; message: string } | null>(null);
  const [selectedTab, setSelectedTab] = useState(0);
  
  const taskId = params.id as string;
  const isNewTask = taskId === 'create';

  // React Hook Form setup
  const {
    control,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isSubmitting, isDirty },
    reset,
  } = useForm<SchedulerFormData>({
    resolver: zodResolver(schedulerFormSchema),
    defaultValues: {
      name: '',
      description: '',
      active: true,
      serviceId: 0,
      component: '',
      method: 'GET',
      frequency: undefined,
      payload: '',
    },
  });

  const watchMethod = watch('method');
  const watchServiceId = watch('serviceId');

  // Queries
  const {
    data: services = [],
    isLoading: servicesLoading,
  } = useQuery({
    queryKey: ['services'],
    queryFn: apiClient.getServices,
  });

  const {
    data: components = [],
    isLoading: componentsLoading,
  } = useQuery({
    queryKey: ['service-components', watchServiceId],
    queryFn: () => {
      const service = services.find(s => s.id === watchServiceId);
      return service ? apiClient.getServiceComponents(service.name) : Promise.resolve([]);
    },
    enabled: watchServiceId > 0,
  });

  const {
    data: schedulerTask,
    isLoading: taskLoading,
  } = useQuery({
    queryKey: ['scheduler-task', taskId],
    queryFn: () => apiClient.getSchedulerTask(taskId),
    enabled: !isNewTask,
  });

  // Mutations
  const createMutation = useMutation({
    mutationFn: apiClient.createSchedulerTask,
    onSuccess: () => {
      setAlert({ type: 'success', message: 'Scheduler task created successfully' });
      queryClient.invalidateQueries({ queryKey: ['scheduler-tasks'] });
      setTimeout(() => {
        router.push('/system-settings/scheduler');
      }, 1500);
    },
    onError: (error: any) => {
      setAlert({ 
        type: 'error', 
        message: error?.message || 'Failed to create scheduler task' 
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: UpdateSchedulePayload }) =>
      apiClient.updateSchedulerTask(id, payload),
    onSuccess: () => {
      setAlert({ type: 'success', message: 'Scheduler task updated successfully' });
      queryClient.invalidateQueries({ queryKey: ['scheduler-tasks'] });
      queryClient.invalidateQueries({ queryKey: ['scheduler-task', taskId] });
      setTimeout(() => {
        router.push('/system-settings/scheduler');
      }, 1500);
    },
    onError: (error: any) => {
      setAlert({ 
        type: 'error', 
        message: error?.message || 'Failed to update scheduler task' 
      });
    },
  });

  // Effect to populate form when editing
  useEffect(() => {
    if (schedulerTask) {
      reset({
        name: schedulerTask.name,
        description: schedulerTask.description,
        active: schedulerTask.isActive,
        serviceId: schedulerTask.serviceId,
        component: schedulerTask.component,
        method: schedulerTask.verb as any,
        frequency: schedulerTask.frequency,
        payload: schedulerTask.payload || '',
      });
    }
  }, [schedulerTask, reset]);

  // Effect to handle payload field visibility
  useEffect(() => {
    if (watchMethod === 'GET') {
      setValue('payload', '');
    }
  }, [watchMethod, setValue]);

  // Helper functions
  const getVerbMask = useCallback((verb: string): number => {
    const verbMap: Record<string, number> = {
      GET: 1,
      POST: 2,
      PUT: 4,
      PATCH: 8,
      DELETE: 16,
    };
    return verbMap[verb] || 1;
  }, []);

  const assemblePayload = useCallback((data: SchedulerFormData): CreateSchedulePayload | UpdateSchedulePayload => {
    const selectedService = services.find(s => s.id === data.serviceId);
    
    if (!selectedService) {
      throw new Error('Selected service not found');
    }

    const basePayload: CreateSchedulePayload = {
      component: data.component,
      description: data.description || null,
      frequency: data.frequency || 0,
      id: null,
      isActive: data.active,
      name: data.name,
      payload: data.payload || null,
      service: {
        id: selectedService.id,
        name: selectedService.name,
        label: selectedService.label,
        description: selectedService.description,
        type: selectedService.type,
        components: components,
      },
      serviceId: data.serviceId,
      serviceName: selectedService.name,
      verb: data.method,
      verbMask: getVerbMask(data.method),
    };

    if (schedulerTask) {
      return {
        ...basePayload,
        createdById: schedulerTask.createdById,
        createdDate: schedulerTask.createdDate,
        hasLog: !!schedulerTask.taskLogByTaskId,
        lastModifiedById: schedulerTask.lastModifiedById,
        lastModifiedDate: schedulerTask.lastModifiedDate,
      } as UpdateSchedulePayload;
    }

    return basePayload;
  }, [services, components, schedulerTask, getVerbMask]);

  // Form submission
  const onSubmit = async (data: SchedulerFormData) => {
    try {
      const payload = assemblePayload(data);
      
      if (isNewTask) {
        await createMutation.mutateAsync(payload as CreateSchedulePayload);
      } else if (schedulerTask) {
        await updateMutation.mutateAsync({
          id: schedulerTask.id,
          payload: payload as UpdateSchedulePayload,
        });
      }
    } catch (error: any) {
      setAlert({ 
        type: 'error', 
        message: error?.message || 'Failed to save scheduler task' 
      });
    }
  };

  const onCancel = () => {
    router.push('/system-settings/scheduler');
  };

  // Loading state
  if (taskLoading || servicesLoading) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  const isLoading = createMutation.isPending || updateMutation.isPending;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        {/* Alert */}
        {alert && (
          <Alert
            type={alert.type}
            message={alert.message}
            onClose={() => setAlert(null)}
          />
        )}

        {/* Tabs */}
        <Tab.Group selectedIndex={selectedTab} onChange={setSelectedTab}>
          <Tab.List className="flex space-x-1 rounded-xl bg-primary-900/20 p-1 mb-6">
            <Tab className={({ selected }) =>
              `w-full rounded-lg py-2.5 text-sm font-medium leading-5 transition-all duration-200 ${
                selected
                  ? 'bg-white dark:bg-gray-800 text-primary-700 dark:text-primary-400 shadow'
                  : 'text-primary-600 dark:text-primary-300 hover:bg-white/[0.12] hover:text-primary-700'
              }`
            }>
              Basic
            </Tab>
            {!isNewTask && (
              <Tab className={({ selected }) =>
                `w-full rounded-lg py-2.5 text-sm font-medium leading-5 transition-all duration-200 ${
                  selected
                    ? 'bg-white dark:bg-gray-800 text-primary-700 dark:text-primary-400 shadow'
                    : 'text-primary-600 dark:text-primary-300 hover:bg-white/[0.12] hover:text-primary-700'
                }`
              }>
                Log
              </Tab>
            )}
          </Tab.List>

          <Tab.Panels>
            {/* Basic Tab */}
            <Tab.Panel className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
              <h4 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-6">
                Task Overview
              </h4>

              <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Name */}
                  <Controller
                    name="name"
                    control={control}
                    render={({ field }) => (
                      <Input
                        {...field}
                        label="Name"
                        placeholder="Task name"
                        required
                        error={errors.name?.message}
                      />
                    )}
                  />

                  {/* Active Toggle */}
                  <Controller
                    name="active"
                    control={control}
                    render={({ field: { value, onChange } }) => (
                      <Switch
                        label="Active"
                        checked={value}
                        onChange={onChange}
                        error={errors.active?.message}
                      />
                    )}
                  />
                </div>

                {/* Description */}
                <Controller
                  name="description"
                  control={control}
                  render={({ field }) => (
                    <Textarea
                      {...field}
                      label="Description"
                      placeholder="Task description"
                      rows={3}
                      error={errors.description?.message}
                    />
                  )}
                />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Service */}
                  <Controller
                    name="serviceId"
                    control={control}
                    render={({ field: { value, onChange } }) => (
                      <Select
                        label="Service"
                        value={value}
                        onChange={(e) => onChange(parseInt(e.target.value) || 0)}
                        required
                        options={services.map(service => ({
                          value: service.id,
                          label: service.name,
                        }))}
                        error={errors.serviceId?.message}
                      />
                    )}
                  />

                  {/* Component */}
                  {components.length > 0 && (
                    <Controller
                      name="component"
                      control={control}
                      render={({ field }) => (
                        <Select
                          {...field}
                          label="Component"
                          required
                          options={components.map(component => ({
                            value: component,
                            label: component,
                          }))}
                          error={errors.component?.message}
                          disabled={componentsLoading}
                        />
                      )}
                    />
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Frequency */}
                  <Controller
                    name="frequency"
                    control={control}
                    render={({ field: { value, onChange } }) => (
                      <Input
                        label="Frequency"
                        type="number"
                        min="0"
                        value={value || ''}
                        onChange={(e) => onChange(e.target.value ? parseInt(e.target.value) : undefined)}
                        error={errors.frequency?.message}
                      />
                    )}
                  />

                  {/* Method */}
                  <Controller
                    name="method"
                    control={control}
                    render={({ field }) => (
                      <Select
                        {...field}
                        label="Method"
                        required
                        options={[
                          { value: 'GET', label: 'GET' },
                          { value: 'POST', label: 'POST' },
                          { value: 'PUT', label: 'PUT' },
                          { value: 'PATCH', label: 'PATCH' },
                          { value: 'DELETE', label: 'DELETE' },
                        ]}
                        error={errors.method?.message}
                      />
                    )}
                  />
                </div>

                {/* Payload (only for non-GET methods) */}
                {watchMethod !== 'GET' && (
                  <Controller
                    name="payload"
                    control={control}
                    render={({ field }) => (
                      <Textarea
                        {...field}
                        label="Payload"
                        placeholder="JSON payload"
                        rows={4}
                        error={errors.payload?.message}
                      />
                    )}
                  />
                )}

                {/* Action Buttons */}
                <div className="flex justify-end space-x-4 pt-6">
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={onCancel}
                    disabled={isLoading}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    loading={isLoading}
                    disabled={!isDirty}
                  >
                    Save
                  </Button>
                </div>
              </form>
            </Tab.Panel>

            {/* Log Tab */}
            {!isNewTask && (
              <Tab.Panel className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
                <div className="space-y-4">
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Status Code: {schedulerTask?.taskLogByTaskId?.statusCode || 'N/A'}
                  </p>
                  
                  <AceEditor
                    value={schedulerTask?.taskLogByTaskId?.content || ''}
                    readonly
                    className="w-full"
                  />
                  
                  <div className="flex justify-end">
                    <Button
                      type="button"
                      variant="secondary"
                      onClick={onCancel}
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
    </div>
  );
}