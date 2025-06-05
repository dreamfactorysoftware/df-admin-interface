'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useSWR, useSWRConfig } from 'swr';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  ChevronLeftIcon, 
  ChevronRightIcon, 
  ExclamationCircleIcon,
  CheckCircleIcon,
  CogIcon,
  DatabaseIcon,
  CloudIcon,
  CodeBracketIcon,
  DocumentIcon,
  UserGroupIcon,
  MagnifyingGlassIcon
} from '@heroicons/react/24/outline';
import { 
  Dialog, 
  Transition, 
  RadioGroup,
  Switch,
  Combobox,
  Disclosure
} from '@headlessui/react';
import { Fragment } from 'react';
import { cn } from '@/lib/utils';
import { api } from '@/lib/api-client';
import { 
  ServiceType, 
  ConfigSchema, 
  ServiceFormData,
  DatabaseImages,
  SecurityConfig
} from '@/types/service';

// Zod validation schemas
const serviceFormSchema = z.object({
  type: z.string().min(1, 'Service type is required'),
  name: z.string()
    .min(1, 'Service name is required')
    .regex(/^[a-zA-Z0-9_-]+$/, 'Service name can only contain letters, numbers, underscores, and hyphens'),
  label: z.string().optional(),
  description: z.string().optional(),
  isActive: z.boolean().default(true),
  config: z.record(z.any()).optional(),
  service_doc_by_service_id: z.object({
    format: z.number().optional(),
    content: z.string().optional(),
  }).optional(),
});

const securityConfigSchema = z.object({
  accessType: z.enum(['all', 'schema', 'tables', 'procedures', 'functions']),
  accessLevel: z.enum(['read', 'write', 'full']),
  component: z.string().min(1, 'Component selection is required'),
});

type ServiceFormValues = z.infer<typeof serviceFormSchema>;
type SecurityConfigValues = z.infer<typeof securityConfigSchema>;

// Step definitions
const STEPS = [
  { id: 'type', title: 'Service Type', description: 'Select your database type' },
  { id: 'details', title: 'Service Details', description: 'Configure service information' },
  { id: 'options', title: 'Service Options', description: 'Set connection parameters' },
  { id: 'security', title: 'Security Configuration', description: 'Configure access controls' },
] as const;

type StepId = typeof STEPS[number]['id'];

// Main page component
export default function CreateServicePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const queryClient = useQueryClient();
  const { mutate } = useSWRConfig();

  // State management
  const [currentStep, setCurrentStep] = useState<StepId>('type');
  const [isPaywallOpen, setIsPaywallOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showAdvancedOptions, setShowAdvancedOptions] = useState(false);
  const [createdServiceId, setCreatedServiceId] = useState<number | null>(null);
  const [isSecurityConfigVisible, setIsSecurityConfigVisible] = useState(false);

  // Form initialization
  const serviceForm = useForm<ServiceFormValues>({
    resolver: zodResolver(serviceFormSchema),
    defaultValues: {
      type: '',
      name: '',
      label: '',
      description: '',
      isActive: true,
      config: {},
    },
    mode: 'onChange',
  });

  const securityForm = useForm<SecurityConfigValues>({
    resolver: zodResolver(securityConfigSchema),
    defaultValues: {
      accessType: 'all',
      accessLevel: 'full',
      component: '*',
    },
    mode: 'onChange',
  });

  // Data fetching hooks
  const { data: serviceTypes, error: serviceTypesError } = useQuery({
    queryKey: ['service-types'],
    queryFn: () => api.get('/api/v2/system/service_type'),
    staleTime: 5 * 60 * 1000, // 5 minutes
    cacheTime: 15 * 60 * 1000, // 15 minutes
  });

  const { data: databaseImages } = useSWR<DatabaseImages[]>(
    '/assets/img/databaseImages.json',
    () => fetch('/assets/img/databaseImages.json').then(res => res.json()),
    { 
      revalidateOnFocus: false,
      dedupingInterval: 24 * 60 * 60 * 1000, // 24 hours
    }
  );

  const { data: systemConfig } = useQuery({
    queryKey: ['system-config'],
    queryFn: () => api.get('/api/v2/system/environment'),
    staleTime: 10 * 60 * 1000, // 10 minutes
  });

  // Watch form values for dynamic behavior
  const selectedType = serviceForm.watch('type');
  const serviceName = serviceForm.watch('name');

  // Get configuration schema for selected service type
  const configSchema = React.useMemo(() => {
    if (!selectedType || !serviceTypes) return [];
    const serviceType = serviceTypes.resource?.find((st: ServiceType) => st.name === selectedType);
    return serviceType?.configSchema || [];
  }, [selectedType, serviceTypes]);

  // Categorize fields for database services
  const { basicFields, advancedFields, hasStandardFields } = React.useMemo(() => {
    if (!configSchema.length) return { basicFields: [], advancedFields: [], hasStandardFields: false };

    const standardFieldNames = ['host', 'port', 'database', 'username', 'password'];
    const fieldNames = configSchema.map((field: ConfigSchema) => field.name.toLowerCase());
    const matchingFields = standardFieldNames.filter(name => fieldNames.includes(name));
    const hasStandardFields = matchingFields.length >= 3;

    if (!hasStandardFields) {
      return { basicFields: configSchema, advancedFields: [], hasStandardFields: false };
    }

    const basicFields = configSchema.filter((field: ConfigSchema) => 
      standardFieldNames.includes(field.name.toLowerCase())
    );
    const advancedFields = configSchema.filter((field: ConfigSchema) => 
      !standardFieldNames.includes(field.name.toLowerCase())
    );

    return { basicFields, advancedFields, hasStandardFields };
  }, [configSchema]);

  // License and paywall logic
  const isDatabase = searchParams?.get('category') === 'Database';
  const licenseType = systemConfig?.platform?.license;
  
  const { availableTypes, restrictedTypes } = React.useMemo(() => {
    if (!serviceTypes?.resource) return { availableTypes: [], restrictedTypes: [] };
    
    const allTypes = serviceTypes.resource.filter((st: ServiceType) => 
      st.name.toLowerCase() !== 'python'
    );

    // Premium service filtering based on license
    const goldServices = ['oracle', 'snowflake', 'mongodb_atlas'];
    const silverServices = ['postgresql', 'sqlserver'];

    let availableTypes = allTypes;
    let restrictedTypes: ServiceType[] = [];

    if (isDatabase) {
      if (licenseType === 'SILVER') {
        restrictedTypes = allTypes.filter((st: ServiceType) => goldServices.includes(st.name));
        availableTypes = allTypes.filter((st: ServiceType) => !goldServices.includes(st.name));
      } else if (licenseType === 'OPEN SOURCE') {
        restrictedTypes = allTypes.filter((st: ServiceType) => 
          goldServices.includes(st.name) || silverServices.includes(st.name)
        );
        availableTypes = allTypes.filter((st: ServiceType) => 
          !goldServices.includes(st.name) && !silverServices.includes(st.name)
        );
      }
    }

    return { availableTypes, restrictedTypes };
  }, [serviceTypes, licenseType, isDatabase]);

  // Filter service types based on search
  const filteredServiceTypes = React.useMemo(() => {
    if (!searchQuery) return availableTypes;
    return availableTypes.filter((type: ServiceType) =>
      type.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
      type.name.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [availableTypes, searchQuery]);

  // Auto-populate label based on type selection for database services
  React.useEffect(() => {
    if (isDatabase && selectedType) {
      serviceForm.setValue('label', selectedType);
    }
  }, [selectedType, isDatabase, serviceForm]);

  // Initialize configuration fields when type changes
  React.useEffect(() => {
    if (selectedType && configSchema.length > 0) {
      const configDefaults: Record<string, any> = {};
      configSchema.forEach((field: ConfigSchema) => {
        configDefaults[field.name] = field.default || '';
      });
      serviceForm.setValue('config', configDefaults);
    }
  }, [selectedType, configSchema, serviceForm]);

  // Connection testing mutation
  const connectionTestMutation = useMutation({
    mutationFn: async (serviceName: string) => {
      return api.get(`/${serviceName}/_table`);
    },
    onSuccess: () => {
      // Connection test successful
    },
    onError: (error: any) => {
      throw new Error('Database connection failed. Please check your connection details.');
    },
  });

  // Service creation mutation
  const createServiceMutation = useMutation({
    mutationFn: async (data: ServiceFormValues) => {
      const payload = {
        resource: [{ ...data, is_active: data.isActive }]
      };
      return api.post('/api/v2/system/service', payload);
    },
    onSuccess: (response: any) => {
      const serviceId = response.resource?.[0]?.id;
      if (serviceId) {
        setCreatedServiceId(serviceId);
        queryClient.invalidateQueries({ queryKey: ['services'] });
      }
    },
  });

  // Security configuration mutation
  const securityConfigMutation = useMutation({
    mutationFn: async ({ serviceId, config }: { serviceId: number; config: SecurityConfigValues }) => {
      const roleName = `${serviceName}_auto_role`;
      
      // Create role
      const rolePayload = {
        resource: [{
          name: roleName,
          description: `Auto-generated role for service ${serviceName}`,
          is_active: true,
          role_service_access_by_role_id: [{
            service_id: serviceId,
            component: config.component,
            verb_mask: getVerbMask(config.accessLevel),
            requestor_mask: 3,
            filters: [],
            filter_op: 'AND',
          }],
          user_to_app_to_role_by_role_id: [],
        }]
      };

      const roleResponse = await api.post('/api/v2/system/role', rolePayload);
      const roleId = roleResponse.resource[0].id;

      // Create app
      const appPayload = {
        resource: [{
          name: `${serviceName}_app`,
          description: `Auto-generated app for service ${serviceName}`,
          type: '0',
          role_id: roleId,
          is_active: true,
          url: null,
          storage_service_id: null,
          storage_container: null,
          path: null,
        }]
      };

      const appResponse = await api.post('/api/v2/system/app?fields=*&related=role_by_role_id', appPayload);
      return appResponse.resource[0];
    },
    onSuccess: (appData: any) => {
      // Copy API key to clipboard
      if (navigator.clipboard && appData.api_key) {
        navigator.clipboard.writeText(appData.api_key).catch(() => {
          console.warn('Failed to copy API key to clipboard');
        });
      }
      
      // Navigate to API docs
      const formattedName = formatServiceName(serviceName);
      router.push(`/api-connections/api-docs/${formattedName}`);
    },
  });

  // Utility functions
  const formatServiceName = useCallback((name: string): string => {
    return name.toLowerCase().replace(/\s+/g, '').replace(/[^a-z0-9_-]/g, '');
  }, []);

  const getVerbMask = useCallback((level: string): number => {
    switch (level) {
      case 'read': return 1; // GET
      case 'write': return 7; // GET + POST + PUT/PATCH
      case 'full': return 15; // All permissions
      default: return 0;
    }
  }, []);

  const getServiceIcon = useCallback((type: string) => {
    if (isDatabase) return DatabaseIcon;
    if (type.includes('script')) return CodeBracketIcon;
    if (type.includes('file')) return DocumentIcon;
    if (type.includes('ldap') || type.includes('auth')) return UserGroupIcon;
    return CloudIcon;
  }, [isDatabase]);

  const getBackgroundImage = useCallback((typeLabel: string) => {
    const image = databaseImages?.find(img => img.label === typeLabel);
    return image?.src || '';
  }, [databaseImages]);

  // Step navigation
  const nextStep = useCallback(() => {
    const currentIndex = STEPS.findIndex(step => step.id === currentStep);
    if (currentIndex < STEPS.length - 1) {
      setCurrentStep(STEPS[currentIndex + 1].id);
    }
  }, [currentStep]);

  const prevStep = useCallback(() => {
    const currentIndex = STEPS.findIndex(step => step.id === currentStep);
    if (currentIndex > 0) {
      setCurrentStep(STEPS[currentIndex - 1].id);
    }
  }, [currentStep]);

  const goToStep = useCallback((stepId: StepId) => {
    setCurrentStep(stepId);
  }, []);

  // Form submission handlers
  const handleServiceSubmit = async (continueToSecurity: boolean = false) => {
    const formData = serviceForm.getValues();
    const formattedName = formatServiceName(formData.name);
    
    try {
      // Validate service name
      if (!formData.type || !formData.name) {
        throw new Error('Service type and name are required');
      }

      // Update form with formatted name
      serviceForm.setValue('name', formattedName);
      
      // Create service
      const response = await createServiceMutation.mutateAsync({
        ...formData,
        name: formattedName,
      });

      if (isDatabase && !continueToSecurity) {
        // Test database connection
        try {
          await connectionTestMutation.mutateAsync(formattedName);
        } catch (error) {
          // If connection fails, delete the service
          if (response.resource?.[0]?.id) {
            await api.delete(`/api/v2/system/service/${response.resource[0].id}`);
          }
          throw error;
        }
      }

      if (continueToSecurity) {
        setIsSecurityConfigVisible(true);
        nextStep();
      } else {
        // Navigate to API docs
        router.push(`/api-connections/api-docs/${formattedName}`);
      }
    } catch (error: any) {
      console.error('Service creation failed:', error);
      throw error;
    }
  };

  const handleSecuritySubmit = async () => {
    if (!createdServiceId) {
      throw new Error('No service ID available for security configuration');
    }

    const securityData = securityForm.getValues();
    await securityConfigMutation.mutateAsync({
      serviceId: createdServiceId,
      config: securityData,
    });
  };

  // Check if current step is valid
  const isStepValid = useCallback((stepId: StepId): boolean => {
    switch (stepId) {
      case 'type':
        return !!selectedType;
      case 'details':
        return !!(serviceName && selectedType);
      case 'options':
        return serviceForm.formState.isValid;
      case 'security':
        return securityForm.formState.isValid;
      default:
        return false;
    }
  }, [selectedType, serviceName, serviceForm.formState.isValid, securityForm.formState.isValid]);

  // Check if subscription is required for selected type
  const subscriptionRequired = selectedType && configSchema.length === 0;

  if (serviceTypesError) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <ExclamationCircleIcon className="mx-auto h-12 w-12 text-red-500" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">Failed to load service types</h3>
          <p className="mt-1 text-sm text-gray-500">Please try refreshing the page.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                Create Database Service
              </h1>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                Configure a new database service connection
              </p>
            </div>
            <button
              onClick={() => router.back()}
              className="inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600"
            >
              <ChevronLeftIcon className="h-4 w-4 mr-2" />
              Back
            </button>
          </div>
        </div>
      </div>

      {/* Step indicator */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="flex space-x-8" aria-label="Progress">
            {STEPS.map((step, index) => {
              const isCurrent = step.id === currentStep;
              const isCompleted = STEPS.findIndex(s => s.id === currentStep) > index;
              const isValid = isStepValid(step.id);

              return (
                <button
                  key={step.id}
                  onClick={() => goToStep(step.id)}
                  disabled={!isValid && !isCompleted && !isCurrent}
                  className={cn(
                    'py-4 px-1 border-b-2 font-medium text-sm',
                    isCurrent
                      ? 'border-indigo-500 text-indigo-600 dark:text-indigo-400'
                      : isCompleted
                      ? 'border-green-500 text-green-600 dark:text-green-400'
                      : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-300 dark:hover:border-gray-600',
                    (!isValid && !isCompleted && !isCurrent) && 'opacity-50 cursor-not-allowed'
                  )}
                >
                  <div className="flex items-center">
                    <span className={cn(
                      'flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-xs mr-3',
                      isCurrent
                        ? 'bg-indigo-600 text-white'
                        : isCompleted
                        ? 'bg-green-600 text-white'
                        : 'bg-gray-300 text-gray-600 dark:bg-gray-600 dark:text-gray-300'
                    )}>
                      {isCompleted ? (
                        <CheckCircleIcon className="h-4 w-4" />
                      ) : (
                        index + 1
                      )}
                    </span>
                    <div className="text-left">
                      <div>{step.title}</div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">
                        {step.description}
                      </div>
                    </div>
                  </div>
                </button>
              );
            })}
          </nav>
        </div>
      </div>

      {/* Main content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white dark:bg-gray-800 shadow rounded-lg">
          <div className="px-6 py-8">
            {/* Service Type Selection */}
            {currentStep === 'type' && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                    Search for your Service Type to get started
                  </h2>
                  <div className="relative">
                    <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <input
                      type="text"
                      placeholder="SQL, AWS, MongoDB, etc."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10 block w-full border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-white"
                    />
                  </div>
                </div>

                <Controller
                  name="type"
                  control={serviceForm.control}
                  render={({ field }) => (
                    <RadioGroup value={field.value} onChange={field.onChange}>
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        {filteredServiceTypes.map((type: ServiceType) => {
                          const IconComponent = getServiceIcon(type.name);
                          return (
                            <RadioGroup.Option
                              key={type.name}
                              value={type.name}
                              className={({ checked }) =>
                                cn(
                                  'relative rounded-lg border p-4 cursor-pointer focus:outline-none',
                                  checked
                                    ? 'border-indigo-500 ring-2 ring-indigo-500'
                                    : 'border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500'
                                )
                              }
                            >
                              {({ checked }) => (
                                <div className="flex flex-col items-center space-y-3">
                                  {getBackgroundImage(type.name) ? (
                                    <img
                                      src={getBackgroundImage(type.name)}
                                      alt={type.label}
                                      className="h-12 w-12 object-contain"
                                    />
                                  ) : (
                                    <IconComponent className="h-12 w-12 text-gray-400" />
                                  )}
                                  <div className="text-center">
                                    <h3 className="text-sm font-medium text-gray-900 dark:text-white">
                                      {type.label}
                                    </h3>
                                  </div>
                                  <div
                                    className={cn(
                                      'absolute top-2 right-2 h-4 w-4 rounded-full',
                                      checked ? 'bg-indigo-600' : 'bg-gray-300 dark:bg-gray-600'
                                    )}
                                  >
                                    {checked && (
                                      <CheckCircleIcon className="h-4 w-4 text-white" />
                                    )}
                                  </div>
                                </div>
                              )}
                            </RadioGroup.Option>
                          );
                        })}
                      </div>
                    </RadioGroup>
                  )}
                />

                {/* Restricted Services */}
                {restrictedTypes.length > 0 && (
                  <div className="space-y-4">
                    <h3 className="text-sm font-medium text-gray-900 dark:text-white">
                      Premium Services (Subscription Required)
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                      {restrictedTypes.map((type: ServiceType) => {
                        const IconComponent = getServiceIcon(type.name);
                        return (
                          <div
                            key={type.name}
                            className="relative rounded-lg border border-gray-300 dark:border-gray-600 p-4 opacity-50"
                          >
                            <div className="flex flex-col items-center space-y-3">
                              {getBackgroundImage(type.name) ? (
                                <img
                                  src={getBackgroundImage(type.name)}
                                  alt={type.label}
                                  className="h-12 w-12 object-contain"
                                />
                              ) : (
                                <IconComponent className="h-12 w-12 text-gray-400" />
                              )}
                              <div className="text-center">
                                <h3 className="text-sm font-medium text-gray-900 dark:text-white">
                                  {type.label}
                                </h3>
                              </div>
                              <button
                                onClick={() => setIsPaywallOpen(true)}
                                className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-75 rounded-lg"
                              >
                                <span className="text-white text-sm font-medium">
                                  Unlock Now
                                </span>
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                <div className="flex justify-end">
                  <button
                    onClick={nextStep}
                    disabled={!selectedType}
                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Next
                    <ChevronRightIcon className="ml-2 h-4 w-4" />
                  </button>
                </div>
              </div>
            )}

            {/* Service Details */}
            {currentStep === 'details' && !subscriptionRequired && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
                    Service Details
                  </h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Service Name *
                      </label>
                      <input
                        {...serviceForm.register('name')}
                        type="text"
                        className="block w-full border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-white"
                      />
                      {serviceForm.formState.errors.name && (
                        <p className="mt-1 text-sm text-red-600">
                          {serviceForm.formState.errors.name.message}
                        </p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Label
                      </label>
                      <input
                        {...serviceForm.register('label')}
                        type="text"
                        className="block w-full border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-white"
                      />
                    </div>

                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Description
                      </label>
                      <textarea
                        {...serviceForm.register('description')}
                        rows={3}
                        className="block w-full border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-white"
                      />
                    </div>

                    <div className="md:col-span-2">
                      <Controller
                        name="isActive"
                        control={serviceForm.control}
                        render={({ field }) => (
                          <div className="flex items-center">
                            <Switch
                              checked={field.value}
                              onChange={field.onChange}
                              className={cn(
                                field.value ? 'bg-indigo-600' : 'bg-gray-200 dark:bg-gray-700',
                                'relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2'
                              )}
                            >
                              <span
                                className={cn(
                                  field.value ? 'translate-x-5' : 'translate-x-0',
                                  'pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out'
                                )}
                              />
                            </Switch>
                            <span className="ml-3 text-sm font-medium text-gray-700 dark:text-gray-300">
                              Active
                            </span>
                          </div>
                        )}
                      />
                    </div>
                  </div>
                </div>

                <div className="flex justify-between">
                  <button
                    onClick={prevStep}
                    className="inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600"
                  >
                    <ChevronLeftIcon className="mr-2 h-4 w-4" />
                    Back
                  </button>
                  <button
                    onClick={nextStep}
                    disabled={!serviceName}
                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Next
                    <ChevronRightIcon className="ml-2 h-4 w-4" />
                  </button>
                </div>
              </div>
            )}

            {/* Service Options */}
            {currentStep === 'options' && !subscriptionRequired && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
                    Service Options
                  </h2>
                  
                  {/* Basic Fields */}
                  {basicFields.length > 0 && (
                    <div className="space-y-4 mb-6">
                      <h3 className="text-md font-medium text-gray-900 dark:text-white">
                        Connection Settings
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {basicFields.map((field: ConfigSchema) => (
                          <div key={field.name}>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                              {field.label || field.name}
                              {field.required && ' *'}
                            </label>
                            <Controller
                              name={`config.${field.name}`}
                              control={serviceForm.control}
                              rules={{ required: field.required }}
                              render={({ field: formField }) => {
                                if (field.type === 'password') {
                                  return (
                                    <input
                                      {...formField}
                                      type="password"
                                      className="block w-full border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-white"
                                    />
                                  );
                                }
                                if (field.type === 'integer') {
                                  return (
                                    <input
                                      {...formField}
                                      type="number"
                                      className="block w-full border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-white"
                                    />
                                  );
                                }
                                if (field.type === 'boolean') {
                                  return (
                                    <Switch
                                      checked={formField.value}
                                      onChange={formField.onChange}
                                      className={cn(
                                        formField.value ? 'bg-indigo-600' : 'bg-gray-200 dark:bg-gray-700',
                                        'relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2'
                                      )}
                                    >
                                      <span
                                        className={cn(
                                          formField.value ? 'translate-x-5' : 'translate-x-0',
                                          'pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out'
                                        )}
                                      />
                                    </Switch>
                                  );
                                }
                                if (field.type === 'picklist' && field.values) {
                                  return (
                                    <select
                                      {...formField}
                                      className="block w-full border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-white"
                                    >
                                      <option value="">Select...</option>
                                      {field.values.map((value: any) => (
                                        <option key={value.value || value} value={value.value || value}>
                                          {value.label || value}
                                        </option>
                                      ))}
                                    </select>
                                  );
                                }
                                return (
                                  <input
                                    {...formField}
                                    type="text"
                                    className="block w-full border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-white"
                                  />
                                );
                              }}
                            />
                            {field.description && (
                              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                                {field.description}
                              </p>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Advanced Fields */}
                  {advancedFields.length > 0 && (
                    <Disclosure>
                      {({ open }) => (
                        <>
                          <Disclosure.Button className="flex w-full justify-between rounded-lg bg-gray-100 dark:bg-gray-700 px-4 py-2 text-left text-sm font-medium text-gray-900 dark:text-white hover:bg-gray-200 dark:hover:bg-gray-600 focus:outline-none focus-visible:ring focus-visible:ring-indigo-500 focus-visible:ring-opacity-75">
                            <span>Advanced Options</span>
                            <ChevronRightIcon
                              className={cn(
                                open ? 'rotate-90 transform' : '',
                                'h-5 w-5 text-gray-500'
                              )}
                            />
                          </Disclosure.Button>
                          <Disclosure.Panel className="px-4 pt-4 pb-2">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              {advancedFields.map((field: ConfigSchema) => (
                                <div key={field.name}>
                                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                    {field.label || field.name}
                                    {field.required && ' *'}
                                  </label>
                                  <Controller
                                    name={`config.${field.name}`}
                                    control={serviceForm.control}
                                    rules={{ required: field.required }}
                                    render={({ field: formField }) => {
                                      // Similar field rendering logic as basic fields
                                      if (field.type === 'password') {
                                        return (
                                          <input
                                            {...formField}
                                            type="password"
                                            className="block w-full border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-white"
                                          />
                                        );
                                      }
                                      if (field.type === 'integer') {
                                        return (
                                          <input
                                            {...formField}
                                            type="number"
                                            className="block w-full border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-white"
                                          />
                                        );
                                      }
                                      return (
                                        <input
                                          {...formField}
                                          type="text"
                                          className="block w-full border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-white"
                                        />
                                      );
                                    }}
                                  />
                                  {field.description && (
                                    <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                                      {field.description}
                                    </p>
                                  )}
                                </div>
                              ))}
                            </div>
                          </Disclosure.Panel>
                        </>
                      )}
                    </Disclosure>
                  )}
                </div>

                <div className="flex justify-between">
                  <button
                    onClick={prevStep}
                    className="inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600"
                  >
                    <ChevronLeftIcon className="mr-2 h-4 w-4" />
                    Back
                  </button>
                  <div className="space-x-4">
                    <button
                      onClick={() => handleServiceSubmit(true)}
                      disabled={!serviceForm.formState.isValid || createServiceMutation.isPending}
                      className="inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <CogIcon className="mr-2 h-4 w-4" />
                      Security Config
                    </button>
                    <button
                      onClick={() => handleServiceSubmit(false)}
                      disabled={!serviceForm.formState.isValid || createServiceMutation.isPending}
                      className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {createServiceMutation.isPending ? 'Creating...' : 'Create & Test'}
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Security Configuration */}
            {currentStep === 'security' && isSecurityConfigVisible && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
                    Security Configuration
                  </h2>
                  <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-md p-4 mb-6">
                    <p className="text-sm text-blue-700 dark:text-blue-300">
                      For more granular security options over your API, check out the{' '}
                      <button 
                        className="underline hover:no-underline"
                        onClick={() => router.push('/api-security/roles')}
                      >
                        Role Based Access
                      </button>
                      {' '}section.
                    </p>
                  </div>

                  <Controller
                    name="accessType"
                    control={securityForm.control}
                    render={({ field }) => (
                      <RadioGroup value={field.value} onChange={field.onChange}>
                        <RadioGroup.Label className="text-base font-medium text-gray-900 dark:text-white mb-4">
                          Access Type
                        </RadioGroup.Label>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                          {[
                            { value: 'all', title: 'Full Access', description: 'Grant complete access to all database components' },
                            { value: 'schema', title: 'Schema Access', description: 'Configure access to specific database schemas' },
                            { value: 'tables', title: 'Tables Access', description: 'Manage access to individual database tables' },
                            { value: 'procedures', title: 'Stored Procedures', description: 'Control access to stored procedures' },
                            { value: 'functions', title: 'Functions', description: 'Set access levels for database functions' },
                          ].map((option) => (
                            <RadioGroup.Option
                              key={option.value}
                              value={option.value}
                              className={({ checked }) =>
                                cn(
                                  'relative rounded-lg border p-4 cursor-pointer focus:outline-none',
                                  checked
                                    ? 'border-indigo-500 ring-2 ring-indigo-500'
                                    : 'border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500'
                                )
                              }
                            >
                              {({ checked }) => (
                                <div>
                                  <div className="flex items-center justify-between">
                                    <h3 className="text-sm font-medium text-gray-900 dark:text-white">
                                      {option.title}
                                    </h3>
                                    <div
                                      className={cn(
                                        'h-4 w-4 rounded-full',
                                        checked ? 'bg-indigo-600' : 'bg-gray-300 dark:bg-gray-600'
                                      )}
                                    >
                                      {checked && (
                                        <CheckCircleIcon className="h-4 w-4 text-white" />
                                      )}
                                    </div>
                                  </div>
                                  <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                                    {option.description}
                                  </p>
                                </div>
                              )}
                            </RadioGroup.Option>
                          ))}
                        </div>
                      </RadioGroup>
                    )}
                  />

                  {/* Access Level Selection */}
                  <div className="mt-6">
                    <Controller
                      name="accessLevel"
                      control={securityForm.control}
                      render={({ field }) => (
                        <RadioGroup value={field.value} onChange={field.onChange}>
                          <RadioGroup.Label className="text-base font-medium text-gray-900 dark:text-white mb-4">
                            Access Level
                          </RadioGroup.Label>
                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                            {[
                              { value: 'read', title: 'Read Only', description: 'View access to data' },
                              { value: 'write', title: 'Read & Write', description: 'View and modify data' },
                              { value: 'full', title: 'Full Access', description: 'Complete control over data' },
                            ].map((option) => (
                              <RadioGroup.Option
                                key={option.value}
                                value={option.value}
                                className={({ checked }) =>
                                  cn(
                                    'relative rounded-lg border p-4 cursor-pointer focus:outline-none',
                                    checked
                                      ? 'border-indigo-500 ring-2 ring-indigo-500'
                                      : 'border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500'
                                  )
                                }
                              >
                                {({ checked }) => (
                                  <div>
                                    <div className="flex items-center justify-between">
                                      <h3 className="text-sm font-medium text-gray-900 dark:text-white">
                                        {option.title}
                                      </h3>
                                      <div
                                        className={cn(
                                          'h-4 w-4 rounded-full',
                                          checked ? 'bg-indigo-600' : 'bg-gray-300 dark:bg-gray-600'
                                        )}
                                      >
                                        {checked && (
                                          <CheckCircleIcon className="h-4 w-4 text-white" />
                                        )}
                                      </div>
                                    </div>
                                    <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                                      {option.description}
                                    </p>
                                  </div>
                                )}
                              </RadioGroup.Option>
                            ))}
                          </div>
                        </RadioGroup>
                      )}
                    />
                  </div>
                </div>

                <div className="flex justify-between">
                  <button
                    onClick={prevStep}
                    className="inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600"
                  >
                    <ChevronLeftIcon className="mr-2 h-4 w-4" />
                    Back
                  </button>
                  <button
                    onClick={handleSecuritySubmit}
                    disabled={!securityForm.formState.isValid || securityConfigMutation.isPending}
                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {securityConfigMutation.isPending ? 'Applying...' : 'Apply Security Configuration'}
                  </button>
                </div>
              </div>
            )}

            {/* Subscription Required */}
            {subscriptionRequired && (
              <div className="text-center py-12">
                <ExclamationCircleIcon className="mx-auto h-12 w-12 text-yellow-500" />
                <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">
                  Premium Service
                </h3>
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                  This service requires a premium subscription to configure.
                </p>
                <div className="mt-6">
                  <button
                    onClick={() => setIsPaywallOpen(true)}
                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                  >
                    Unlock Now
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Paywall Modal */}
      <Transition appear show={isPaywallOpen} as={Fragment}>
        <Dialog as="div" className="relative z-10" onClose={setIsPaywallOpen}>
          <Transition.Child
            as={Fragment}
            enter="ease-out duration-300"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="ease-in duration-200"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <div className="fixed inset-0 bg-black bg-opacity-25" />
          </Transition.Child>

          <div className="fixed inset-0 overflow-y-auto">
            <div className="flex min-h-full items-center justify-center p-4 text-center">
              <Transition.Child
                as={Fragment}
                enter="ease-out duration-300"
                enterFrom="opacity-0 scale-95"
                enterTo="opacity-100 scale-100"
                leave="ease-in duration-200"
                leaveFrom="opacity-100 scale-100"
                leaveTo="opacity-0 scale-95"
              >
                <Dialog.Panel className="w-full max-w-2xl transform overflow-hidden rounded-2xl bg-white dark:bg-gray-800 p-6 text-left align-middle shadow-xl transition-all">
                  <Dialog.Title
                    as="h3"
                    className="text-lg font-medium leading-6 text-gray-900 dark:text-white text-center mb-4"
                  >
                    Unlock Service
                  </Dialog.Title>
                  
                  <div className="space-y-4">
                    <div>
                      <h4 className="text-base font-medium text-gray-900 dark:text-white mb-2">
                        Premium Features Available
                      </h4>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        Upgrade your plan to access this premium database service and unlock advanced features.
                      </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <h5 className="font-medium text-gray-900 dark:text-white">Hosted Trial</h5>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          Schedule a demo to see all features in action.
                        </p>
                      </div>
                      <div>
                        <h5 className="font-medium text-gray-900 dark:text-white">Learn More</h5>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          Discover what you can gain with premium access.
                        </p>
                      </div>
                    </div>

                    <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
                      <h5 className="font-medium text-gray-900 dark:text-white mb-2">Contact Us</h5>
                      <div className="flex flex-col sm:flex-row gap-4 text-sm">
                        <a
                          href="tel:+1 415-993-5877"
                          className="text-indigo-600 hover:text-indigo-500"
                        >
                          Phone: +1 415-993-5877
                        </a>
                        <a
                          href="mailto:info@dreamfactory.com"
                          className="text-indigo-600 hover:text-indigo-500"
                        >
                          Email: info@dreamfactory.com
                        </a>
                      </div>
                    </div>
                  </div>

                  <div className="mt-6 flex justify-end space-x-3">
                    <button
                      type="button"
                      className="inline-flex justify-center rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2"
                      onClick={() => setIsPaywallOpen(false)}
                    >
                      Close
                    </button>
                    <button
                      type="button"
                      className="inline-flex justify-center rounded-md border border-transparent bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2"
                      onClick={() => {
                        window.open('https://calendly.com/dreamfactory-platform/unlock-all-features', '_blank');
                      }}
                    >
                      Schedule Demo
                    </button>
                  </div>
                </Dialog.Panel>
              </Transition.Child>
            </div>
          </div>
        </Dialog>
      </Transition>
    </div>
  );
}