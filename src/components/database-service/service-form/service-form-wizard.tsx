'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useForm, FormProvider } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { 
  ChevronLeftIcon, 
  ChevronRightIcon, 
  CheckIcon,
  DatabaseIcon,
  CogIcon,
  ShieldCheckIcon,
  DocumentCheckIcon
} from '@heroicons/react/24/outline';
import { cn } from '@/lib/utils';

// Types and interfaces for service configuration
interface DatabaseServiceFormData {
  // Service Type Step
  serviceType: 'mysql' | 'postgresql' | 'oracle' | 'mongodb' | 'snowflake' | 'sqlserver' | 'sqlite';
  
  // Basic Details Step
  name: string;
  label?: string;
  description?: string;
  isActive: boolean;
  
  // Connection Configuration
  host: string;
  port?: number;
  database: string;
  username: string;
  password: string;
  
  // Advanced Options
  connectionString?: string;
  sslEnabled?: boolean;
  sslMode?: 'disable' | 'allow' | 'prefer' | 'require' | 'verify-ca' | 'verify-full';
  timezone?: string;
  charset?: string;
  
  // Pooling Configuration
  poolingEnabled?: boolean;
  minConnections?: number;
  maxConnections?: number;
  connectionTimeout?: number;
  
  // Security Configuration
  accessType: 'public' | 'private' | 'role-based';
  allowedRoles?: string[];
  allowedApps?: string[];
  requireApiKey?: boolean;
  enableAuditing?: boolean;
}

// Service type definitions with configuration schemas
const SERVICE_TYPES = [
  {
    id: 'mysql',
    name: 'MySQL',
    description: 'Connect to MySQL database servers',
    icon: DatabaseIcon,
    defaultPort: 3306,
    supportsSsl: true,
    supportsPooling: true,
  },
  {
    id: 'postgresql',
    name: 'PostgreSQL',
    description: 'Connect to PostgreSQL database servers',
    icon: DatabaseIcon,
    defaultPort: 5432,
    supportsSsl: true,
    supportsPooling: true,
  },
  {
    id: 'oracle',
    name: 'Oracle',
    description: 'Connect to Oracle database servers',
    icon: DatabaseIcon,
    defaultPort: 1521,
    supportsSsl: true,
    supportsPooling: true,
  },
  {
    id: 'mongodb',
    name: 'MongoDB',
    description: 'Connect to MongoDB NoSQL databases',
    icon: DatabaseIcon,
    defaultPort: 27017,
    supportsSsl: true,
    supportsPooling: false,
  },
  {
    id: 'snowflake',
    name: 'Snowflake',
    description: 'Connect to Snowflake cloud data warehouse',
    icon: DatabaseIcon,
    defaultPort: 443,
    supportsSsl: true,
    supportsPooling: true,
  },
  {
    id: 'sqlserver',
    name: 'SQL Server',
    description: 'Connect to Microsoft SQL Server databases',
    icon: DatabaseIcon,
    defaultPort: 1433,
    supportsSsl: true,
    supportsPooling: true,
  },
  {
    id: 'sqlite',
    name: 'SQLite',
    description: 'Connect to SQLite database files',
    icon: DatabaseIcon,
    defaultPort: null,
    supportsSsl: false,
    supportsPooling: false,
  },
] as const;

// Validation schema using Zod
const createServiceFormSchema = (currentStep: number) => {
  const baseSchema = z.object({
    // Service Type (Step 1)
    serviceType: z.enum(['mysql', 'postgresql', 'oracle', 'mongodb', 'snowflake', 'sqlserver', 'sqlite']),
    
    // Basic Details (Step 2)
    name: currentStep >= 2 ? z.string().min(1, 'Service name is required').max(50, 'Name must be 50 characters or less') : z.string().optional(),
    label: z.string().max(100, 'Label must be 100 characters or less').optional(),
    description: z.string().max(500, 'Description must be 500 characters or less').optional(),
    isActive: z.boolean().default(true),
    
    // Connection Configuration (Step 2)
    host: currentStep >= 2 ? z.string().min(1, 'Host is required') : z.string().optional(),
    port: z.number().min(1).max(65535).optional(),
    database: currentStep >= 2 ? z.string().min(1, 'Database name is required') : z.string().optional(),
    username: currentStep >= 2 ? z.string().min(1, 'Username is required') : z.string().optional(),
    password: currentStep >= 2 ? z.string().min(1, 'Password is required') : z.string().optional(),
    
    // Advanced Options (Step 3)
    connectionString: z.string().optional(),
    sslEnabled: z.boolean().optional(),
    sslMode: z.enum(['disable', 'allow', 'prefer', 'require', 'verify-ca', 'verify-full']).optional(),
    timezone: z.string().optional(),
    charset: z.string().optional(),
    
    // Pooling Configuration (Step 3)
    poolingEnabled: z.boolean().optional(),
    minConnections: z.number().min(1).max(100).optional(),
    maxConnections: z.number().min(1).max(100).optional(),
    connectionTimeout: z.number().min(1000).max(300000).optional(),
    
    // Security Configuration (Step 4)
    accessType: z.enum(['public', 'private', 'role-based']).default('public'),
    allowedRoles: z.array(z.string()).optional(),
    allowedApps: z.array(z.string()).optional(),
    requireApiKey: z.boolean().optional(),
    enableAuditing: z.boolean().optional(),
  });

  return baseSchema;
};

// Wizard step configuration
const WIZARD_STEPS = [
  {
    id: 1,
    title: 'Service Type',
    description: 'Select the type of database service to create',
    icon: DatabaseIcon,
  },
  {
    id: 2,
    title: 'Basic Details',
    description: 'Configure connection details and service information',
    icon: CogIcon,
  },
  {
    id: 3,
    title: 'Advanced Options',
    description: 'Configure advanced connection and pooling settings',
    icon: DocumentCheckIcon,
  },
  {
    id: 4,
    title: 'Security',
    description: 'Configure access control and security settings',
    icon: ShieldCheckIcon,
  },
];

interface ServiceFormWizardProps {
  onSubmit: (data: DatabaseServiceFormData) => void;
  onCancel: () => void;
  initialData?: Partial<DatabaseServiceFormData>;
  isLoading?: boolean;
  mode: 'create' | 'edit';
}

export default function ServiceFormWizard({
  onSubmit,
  onCancel,
  initialData,
  isLoading = false,
  mode = 'create',
}: ServiceFormWizardProps) {
  const [currentStep, setCurrentStep] = useState(1);
  const [completedSteps, setCompletedSteps] = useState<Set<number>>(new Set());

  // Initialize form with React Hook Form and Zod validation
  const form = useForm<DatabaseServiceFormData>({
    resolver: zodResolver(createServiceFormSchema(currentStep)),
    mode: 'onChange',
    defaultValues: {
      serviceType: 'mysql',
      name: '',
      label: '',
      description: '',
      isActive: true,
      host: '',
      port: undefined,
      database: '',
      username: '',
      password: '',
      connectionString: '',
      sslEnabled: false,
      sslMode: 'prefer',
      timezone: 'UTC',
      charset: 'utf8mb4',
      poolingEnabled: true,
      minConnections: 1,
      maxConnections: 10,
      connectionTimeout: 30000,
      accessType: 'public',
      allowedRoles: [],
      allowedApps: [],
      requireApiKey: false,
      enableAuditing: false,
      ...initialData,
    },
  });

  const { watch, trigger, getValues, setValue } = form;
  const selectedServiceType = watch('serviceType');

  // Update default port when service type changes
  useEffect(() => {
    const serviceTypeConfig = SERVICE_TYPES.find(type => type.id === selectedServiceType);
    if (serviceTypeConfig?.defaultPort && !getValues('port')) {
      setValue('port', serviceTypeConfig.defaultPort);
    }
  }, [selectedServiceType, setValue, getValues]);

  // Validate current step before proceeding
  const validateCurrentStep = async (): Promise<boolean> => {
    const fieldsToValidate = getFieldsForStep(currentStep);
    const result = await trigger(fieldsToValidate);
    return result;
  };

  // Get fields that need validation for current step
  const getFieldsForStep = (step: number): (keyof DatabaseServiceFormData)[] => {
    switch (step) {
      case 1:
        return ['serviceType'];
      case 2:
        return ['name', 'host', 'database', 'username', 'password'];
      case 3:
        return []; // Advanced options are all optional
      case 4:
        return ['accessType']; // Security step validation
      default:
        return [];
    }
  };

  // Navigate to next step
  const handleNext = useCallback(async () => {
    const isValid = await validateCurrentStep();
    if (isValid && currentStep < WIZARD_STEPS.length) {
      setCompletedSteps(prev => new Set([...prev, currentStep]));
      setCurrentStep(prev => prev + 1);
    }
  }, [currentStep, validateCurrentStep]);

  // Navigate to previous step
  const handlePrevious = useCallback(() => {
    if (currentStep > 1) {
      setCurrentStep(prev => prev - 1);
    }
  }, [currentStep]);

  // Navigate directly to a specific step
  const handleStepClick = useCallback(async (stepNumber: number) => {
    if (stepNumber < currentStep || completedSteps.has(stepNumber)) {
      setCurrentStep(stepNumber);
    } else if (stepNumber === currentStep + 1) {
      await handleNext();
    }
  }, [currentStep, completedSteps, handleNext]);

  // Handle form submission
  const handleSubmit = async (data: DatabaseServiceFormData) => {
    const isValid = await validateCurrentStep();
    if (isValid) {
      onSubmit(data);
    }
  };

  // Render step indicator
  const StepIndicator = () => (
    <div className="flex items-center justify-between mb-8">
      {WIZARD_STEPS.map((step, index) => {
        const isCompleted = completedSteps.has(step.id);
        const isCurrent = currentStep === step.id;
        const isAccessible = step.id <= currentStep || completedSteps.has(step.id);

        return (
          <React.Fragment key={step.id}>
            <button
              type="button"
              onClick={() => handleStepClick(step.id)}
              disabled={!isAccessible}
              className={cn(
                'flex flex-col items-center space-y-2 transition-colors duration-200',
                isAccessible ? 'cursor-pointer hover:text-primary-600' : 'cursor-not-allowed opacity-50'
              )}
            >
              <div
                className={cn(
                  'flex items-center justify-center w-10 h-10 rounded-full border-2 transition-colors duration-200',
                  isCompleted
                    ? 'bg-primary-600 border-primary-600 text-white'
                    : isCurrent
                    ? 'border-primary-600 text-primary-600 bg-white'
                    : 'border-gray-300 text-gray-400 bg-white'
                )}
              >
                {isCompleted ? (
                  <CheckIcon className="w-6 h-6" />
                ) : (
                  <step.icon className="w-6 h-6" />
                )}
              </div>
              <div className="text-center">
                <div
                  className={cn(
                    'text-sm font-medium',
                    isCurrent ? 'text-primary-600' : isCompleted ? 'text-gray-900' : 'text-gray-500'
                  )}
                >
                  {step.title}
                </div>
                <div className="text-xs text-gray-500 max-w-20 leading-tight">
                  {step.description}
                </div>
              </div>
            </button>
            {index < WIZARD_STEPS.length - 1 && (
              <div
                className={cn(
                  'flex-1 h-0.5 mx-4 transition-colors duration-200',
                  completedSteps.has(step.id) ? 'bg-primary-600' : 'bg-gray-200'
                )}
              />
            )}
          </React.Fragment>
        );
      })}
    </div>
  );

  // Render service type selection step
  const ServiceTypeStep = () => (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-900">Select Database Type</h2>
        <p className="mt-2 text-gray-600">
          Choose the type of database you want to connect to
        </p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {SERVICE_TYPES.map((serviceType) => {
          const isSelected = selectedServiceType === serviceType.id;
          
          return (
            <button
              key={serviceType.id}
              type="button"
              onClick={() => setValue('serviceType', serviceType.id as any)}
              className={cn(
                'relative p-6 rounded-lg border-2 transition-all duration-200 text-left hover:shadow-md',
                isSelected
                  ? 'border-primary-600 bg-primary-50 shadow-md'
                  : 'border-gray-200 bg-white hover:border-gray-300'
              )}
            >
              <div className="flex items-start space-x-4">
                <div
                  className={cn(
                    'flex-shrink-0 w-12 h-12 rounded-lg flex items-center justify-center',
                    isSelected ? 'bg-primary-600 text-white' : 'bg-gray-100 text-gray-600'
                  )}
                >
                  <serviceType.icon className="w-6 h-6" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3
                    className={cn(
                      'text-lg font-semibold',
                      isSelected ? 'text-primary-900' : 'text-gray-900'
                    )}
                  >
                    {serviceType.name}
                  </h3>
                  <p
                    className={cn(
                      'text-sm mt-1',
                      isSelected ? 'text-primary-700' : 'text-gray-600'
                    )}
                  >
                    {serviceType.description}
                  </p>
                  {serviceType.defaultPort && (
                    <p className="text-xs text-gray-500 mt-2">
                      Default port: {serviceType.defaultPort}
                    </p>
                  )}
                </div>
              </div>
              
              {isSelected && (
                <div className="absolute top-4 right-4">
                  <div className="w-6 h-6 bg-primary-600 rounded-full flex items-center justify-center">
                    <CheckIcon className="w-4 h-4 text-white" />
                  </div>
                </div>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );

  // Render basic details step
  const BasicDetailsStep = () => (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-900">Basic Details</h2>
        <p className="mt-2 text-gray-600">
          Configure your {SERVICE_TYPES.find(t => t.id === selectedServiceType)?.name} connection
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Service Information */}
        <div className="space-y-4">
          <h3 className="text-lg font-medium text-gray-900">Service Information</h3>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Service Name *
            </label>
            <input
              {...form.register('name')}
              type="text"
              className={cn(
                'w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500',
                form.formState.errors.name ? 'border-red-300' : 'border-gray-300'
              )}
              placeholder="Enter service name"
            />
            {form.formState.errors.name && (
              <p className="mt-1 text-sm text-red-600">{form.formState.errors.name.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Label
            </label>
            <input
              {...form.register('label')}
              type="text"
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              placeholder="Enter display label"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description
            </label>
            <textarea
              {...form.register('description')}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              placeholder="Enter service description"
            />
          </div>

          <div className="flex items-center">
            <input
              {...form.register('isActive')}
              type="checkbox"
              className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
            />
            <label className="ml-2 block text-sm text-gray-900">
              Service is active
            </label>
          </div>
        </div>

        {/* Connection Configuration */}
        <div className="space-y-4">
          <h3 className="text-lg font-medium text-gray-900">Connection Details</h3>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Host *
            </label>
            <input
              {...form.register('host')}
              type="text"
              className={cn(
                'w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500',
                form.formState.errors.host ? 'border-red-300' : 'border-gray-300'
              )}
              placeholder="localhost"
            />
            {form.formState.errors.host && (
              <p className="mt-1 text-sm text-red-600">{form.formState.errors.host.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Port
            </label>
            <input
              {...form.register('port', { valueAsNumber: true })}
              type="number"
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              placeholder={SERVICE_TYPES.find(t => t.id === selectedServiceType)?.defaultPort?.toString()}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Database *
            </label>
            <input
              {...form.register('database')}
              type="text"
              className={cn(
                'w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500',
                form.formState.errors.database ? 'border-red-300' : 'border-gray-300'
              )}
              placeholder="Enter database name"
            />
            {form.formState.errors.database && (
              <p className="mt-1 text-sm text-red-600">{form.formState.errors.database.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Username *
            </label>
            <input
              {...form.register('username')}
              type="text"
              className={cn(
                'w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500',
                form.formState.errors.username ? 'border-red-300' : 'border-gray-300'
              )}
              placeholder="Enter username"
            />
            {form.formState.errors.username && (
              <p className="mt-1 text-sm text-red-600">{form.formState.errors.username.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Password *
            </label>
            <input
              {...form.register('password')}
              type="password"
              className={cn(
                'w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500',
                form.formState.errors.password ? 'border-red-300' : 'border-gray-300'
              )}
              placeholder="Enter password"
            />
            {form.formState.errors.password && (
              <p className="mt-1 text-sm text-red-600">{form.formState.errors.password.message}</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );

  // Render advanced options step
  const AdvancedOptionsStep = () => {
    const serviceTypeConfig = SERVICE_TYPES.find(t => t.id === selectedServiceType);
    
    return (
      <div className="space-y-6">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900">Advanced Options</h2>
          <p className="mt-2 text-gray-600">
            Configure advanced connection and performance settings
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Connection Options */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-gray-900">Connection Options</h3>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Connection String
              </label>
              <textarea
                {...form.register('connectionString')}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                placeholder="Optional: Override with custom connection string"
              />
              <p className="mt-1 text-xs text-gray-500">
                Leave empty to use individual connection parameters
              </p>
            </div>

            {serviceTypeConfig?.supportsSsl && (
              <>
                <div className="flex items-center">
                  <input
                    {...form.register('sslEnabled')}
                    type="checkbox"
                    className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                  />
                  <label className="ml-2 block text-sm text-gray-900">
                    Enable SSL/TLS
                  </label>
                </div>

                {watch('sslEnabled') && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      SSL Mode
                    </label>
                    <select
                      {...form.register('sslMode')}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    >
                      <option value="disable">Disable</option>
                      <option value="allow">Allow</option>
                      <option value="prefer">Prefer</option>
                      <option value="require">Require</option>
                      <option value="verify-ca">Verify CA</option>
                      <option value="verify-full">Verify Full</option>
                    </select>
                  </div>
                )}
              </>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Timezone
              </label>
              <input
                {...form.register('timezone')}
                type="text"
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                placeholder="UTC"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Character Set
              </label>
              <input
                {...form.register('charset')}
                type="text"
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                placeholder="utf8mb4"
              />
            </div>
          </div>

          {/* Connection Pooling */}
          {serviceTypeConfig?.supportsPooling && (
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-gray-900">Connection Pooling</h3>
              
              <div className="flex items-center">
                <input
                  {...form.register('poolingEnabled')}
                  type="checkbox"
                  className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                />
                <label className="ml-2 block text-sm text-gray-900">
                  Enable connection pooling
                </label>
              </div>

              {watch('poolingEnabled') && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Minimum Connections
                    </label>
                    <input
                      {...form.register('minConnections', { valueAsNumber: true })}
                      type="number"
                      min="1"
                      max="100"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                      placeholder="1"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Maximum Connections
                    </label>
                    <input
                      {...form.register('maxConnections', { valueAsNumber: true })}
                      type="number"
                      min="1"
                      max="100"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                      placeholder="10"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Connection Timeout (ms)
                    </label>
                    <input
                      {...form.register('connectionTimeout', { valueAsNumber: true })}
                      type="number"
                      min="1000"
                      max="300000"
                      step="1000"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                      placeholder="30000"
                    />
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      </div>
    );
  };

  // Render security configuration step
  const SecurityStep = () => (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-900">Security Configuration</h2>
        <p className="mt-2 text-gray-600">
          Configure access control and security settings for your service
        </p>
      </div>

      <div className="space-y-6">
        {/* Access Type */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-3">
            Access Type
          </label>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[
              { 
                value: 'public', 
                title: 'Public Access', 
                description: 'Anyone with API access can use this service' 
              },
              { 
                value: 'private', 
                title: 'Private Access', 
                description: 'Only authenticated users can access this service' 
              },
              { 
                value: 'role-based', 
                title: 'Role-Based Access', 
                description: 'Only users with specific roles can access' 
              },
            ].map((option) => {
              const isSelected = watch('accessType') === option.value;
              
              return (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => setValue('accessType', option.value as any)}
                  className={cn(
                    'p-4 border-2 rounded-lg text-left transition-all duration-200',
                    isSelected
                      ? 'border-primary-600 bg-primary-50'
                      : 'border-gray-200 bg-white hover:border-gray-300'
                  )}
                >
                  <h4
                    className={cn(
                      'font-medium text-sm',
                      isSelected ? 'text-primary-900' : 'text-gray-900'
                    )}
                  >
                    {option.title}
                  </h4>
                  <p
                    className={cn(
                      'text-xs mt-1',
                      isSelected ? 'text-primary-700' : 'text-gray-600'
                    )}
                  >
                    {option.description}
                  </p>
                </button>
              );
            })}
          </div>
        </div>

        {/* Role-based Access Configuration */}
        {watch('accessType') === 'role-based' && (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Allowed Roles
              </label>
              <input
                type="text"
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                placeholder="Enter comma-separated role names"
                onChange={(e) => {
                  const roles = e.target.value.split(',').map(r => r.trim()).filter(Boolean);
                  setValue('allowedRoles', roles);
                }}
              />
              <p className="mt-1 text-xs text-gray-500">
                Enter role names separated by commas
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Allowed Applications
              </label>
              <input
                type="text"
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                placeholder="Enter comma-separated app names"
                onChange={(e) => {
                  const apps = e.target.value.split(',').map(a => a.trim()).filter(Boolean);
                  setValue('allowedApps', apps);
                }}
              />
              <p className="mt-1 text-xs text-gray-500">
                Enter application names separated by commas
              </p>
            </div>
          </div>
        )}

        {/* Additional Security Options */}
        <div className="space-y-4">
          <h3 className="text-lg font-medium text-gray-900">Additional Security Options</h3>
          
          <div className="flex items-center">
            <input
              {...form.register('requireApiKey')}
              type="checkbox"
              className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
            />
            <label className="ml-2 block text-sm text-gray-900">
              Require API key for all requests
            </label>
          </div>

          <div className="flex items-center">
            <input
              {...form.register('enableAuditing')}
              type="checkbox"
              className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
            />
            <label className="ml-2 block text-sm text-gray-900">
              Enable audit logging for this service
            </label>
          </div>
        </div>
      </div>
    </div>
  );

  // Render current step content
  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return <ServiceTypeStep />;
      case 2:
        return <BasicDetailsStep />;
      case 3:
        return <AdvancedOptionsStep />;
      case 4:
        return <SecurityStep />;
      default:
        return null;
    }
  };

  return (
    <div className="max-w-6xl mx-auto p-6 bg-white rounded-lg shadow-lg">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">
          {mode === 'create' ? 'Create Database Service' : 'Edit Database Service'}
        </h1>
        <p className="mt-2 text-gray-600">
          Follow the steps below to configure your database service connection
        </p>
      </div>

      <FormProvider {...form}>
        <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-8">
          {/* Step Indicator */}
          <StepIndicator />

          {/* Step Content */}
          <div className="min-h-96">
            {renderStepContent()}
          </div>

          {/* Navigation Buttons */}
          <div className="flex items-center justify-between pt-6 border-t border-gray-200">
            <button
              type="button"
              onClick={onCancel}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
            >
              Cancel
            </button>

            <div className="flex items-center space-x-3">
              {currentStep > 1 && (
                <button
                  type="button"
                  onClick={handlePrevious}
                  className="flex items-center px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                >
                  <ChevronLeftIcon className="w-4 h-4 mr-1" />
                  Previous
                </button>
              )}

              {currentStep < WIZARD_STEPS.length ? (
                <button
                  type="button"
                  onClick={handleNext}
                  disabled={isLoading}
                  className="flex items-center px-4 py-2 text-sm font-medium text-white bg-primary-600 border border-transparent rounded-md shadow-sm hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Next
                  <ChevronRightIcon className="w-4 h-4 ml-1" />
                </button>
              ) : (
                <button
                  type="submit"
                  disabled={isLoading}
                  className="flex items-center px-6 py-2 text-sm font-medium text-white bg-primary-600 border border-transparent rounded-md shadow-sm hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoading ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      {mode === 'create' ? 'Creating...' : 'Saving...'}
                    </>
                  ) : (
                    mode === 'create' ? 'Create Service' : 'Save Changes'
                  )}
                </button>
              )}
            </div>
          </div>
        </form>
      </FormProvider>
    </div>
  );
}