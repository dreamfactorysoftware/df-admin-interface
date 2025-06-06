/**
 * Service Form Wizard Component
 * 
 * React multi-step wizard component for database service creation that migrates Angular mat-stepper 
 * functionality to React. Implements comprehensive step-by-step service configuration workflow
 * including service type selection, basic details, connection parameters, security configuration,
 * and advanced options using React Hook Form with Zod validation.
 * 
 * Features:
 * - Multi-step wizard navigation with progress tracking
 * - Dynamic form field generation based on service schemas  
 * - Real-time validation under 100ms per integration requirements
 * - Security configuration with role and app creation
 * - Support for all database types (MySQL, PostgreSQL, Oracle, MongoDB, Snowflake)
 * - Tailwind CSS 4.1+ styling with Headless UI 2.0+ accessibility
 * - Step validation and conditional navigation
 * - Form state persistence across steps
 * 
 * @fileoverview Multi-step wizard for database service form management
 * @version 1.0.0
 * @since 2024-01-01
 */

import React, { useState, useCallback, useMemo, useEffect, Fragment } from 'react';
import { useForm, FormProvider } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { 
  CheckIcon, 
  ExclamationTriangleIcon,
  InformationCircleIcon,
  ChevronLeftIcon, 
  ChevronRightIcon,
  DatabaseIcon,
  CogIcon,
  ShieldCheckIcon,
  AdjustmentsHorizontalIcon,
  EyeIcon,
  PlayIcon
} from '@heroicons/react/24/outline';
import { Tab } from '@headlessui/react';

import { Button } from '@/components/ui/button';
import { ServiceFormFields } from './service-form-fields';
import type {
  ServiceFormInput,
  ServiceFormWizardProps,
  WizardStep,
  WizardNavigationState,
  WizardStepProgress,
  WizardStepValidationState,
  ServiceFormMode,
  ServiceFormData,
  ServiceTypeSelectionInput,
  BasicServiceInfoInput,
  ConnectionConfigInput,
  SecurityConfigInput,
  AdvancedConfigInput,
  DynamicFieldConfig,
  ServiceTierAccess,
  DatabaseDriver,
  ServiceType,
  BaseComponentProps
} from './service-form-types';
import {
  ServiceFormSchema,
  ServiceTypeSelectionSchema,
  BasicServiceInfoSchema,
  ConnectionConfigSchema,
  SecurityConfigSchema,
  AdvancedConfigSchema,
  WIZARD_STEPS,
  DEFAULT_WIZARD_STEPS
} from './service-form-types';
import {
  useServiceForm,
  useServiceFormWizard,
  useServiceFormFields,
  useServiceConnectionTest,
  useServiceFormPaywall,
  useServiceFormSecurity,
  useServiceFormSubmission
} from './service-form-hooks';
import { cn } from '@/lib/utils';

// =============================================================================
// WIZARD STEP CONFIGURATIONS
// =============================================================================

/**
 * Service type selector component with grid layout
 */
interface ServiceTypeSelectorProps {
  selectedType?: DatabaseDriver | null;
  onTypeSelect: (type: DatabaseDriver, serviceType: ServiceType) => void;
  showDescriptions?: boolean;
  enablePaywall?: boolean;
  currentTier?: ServiceTierAccess;
}

const ServiceTypeSelector: React.FC<ServiceTypeSelectorProps> = ({
  selectedType,
  onTypeSelect,
  showDescriptions = true,
  enablePaywall = true,
  currentTier = 'free'
}) => {
  // Mock service types - in real implementation, this would come from API
  const serviceTypes: ServiceType[] = useMemo(() => [
    {
      id: 'mysql',
      name: 'MySQL',
      driver: 'mysql',
      description: 'Popular open-source relational database',
      icon: 'database',
      category: 'SQL',
      tier: 'free',
      features: ['ACID transactions', 'High performance', 'Scalable'],
      configSchema: []
    },
    {
      id: 'postgresql',
      name: 'PostgreSQL', 
      driver: 'pgsql',
      description: 'Advanced open-source relational database',
      icon: 'database',
      category: 'SQL',
      tier: 'free',
      features: ['Advanced SQL features', 'JSON support', 'Extensible'],
      configSchema: []
    },
    {
      id: 'oracle',
      name: 'Oracle Database',
      driver: 'oracle',
      description: 'Enterprise-grade relational database',
      icon: 'database',
      category: 'Enterprise SQL',
      tier: 'premium',
      features: ['Enterprise features', 'High availability', 'Advanced security'],
      configSchema: []
    },
    {
      id: 'mongodb',
      name: 'MongoDB',
      driver: 'mongodb',
      description: 'Leading NoSQL document database',
      icon: 'database',
      category: 'NoSQL',
      tier: 'basic',
      features: ['Document storage', 'Flexible schema', 'Horizontal scaling'],
      configSchema: []
    },
    {
      id: 'snowflake',
      name: 'Snowflake',
      driver: 'snowflake',
      description: 'Cloud-native data warehouse',
      icon: 'database',
      category: 'Cloud',
      tier: 'premium',
      features: ['Cloud-native', 'Data sharing', 'Elastic scaling'],
      configSchema: []
    },
    {
      id: 'sqlserver',
      name: 'SQL Server',
      driver: 'sqlsrv',
      description: 'Microsoft SQL Server database',
      icon: 'database',
      category: 'Enterprise SQL',
      tier: 'basic',
      features: ['Windows integration', 'Business intelligence', 'Enterprise tools'],
      configSchema: []
    }
  ], []);

  const getTierColor = useCallback((tier: ServiceTierAccess) => {
    switch (tier) {
      case 'free': return 'text-green-600 bg-green-50';
      case 'basic': return 'text-blue-600 bg-blue-50';
      case 'premium': return 'text-purple-600 bg-purple-50';
      case 'enterprise': return 'text-amber-600 bg-amber-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  }, []);

  const isAccessible = useCallback((tier: ServiceTierAccess) => {
    const tierLevels = { free: 0, basic: 1, premium: 2, enterprise: 3 };
    return tierLevels[currentTier] >= tierLevels[tier];
  }, [currentTier]);

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
          Choose Database Type
        </h3>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Select the type of database you want to connect to your API
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {serviceTypes.map((serviceType) => {
          const accessible = isAccessible(serviceType.tier);
          const selected = selectedType === serviceType.driver;
          
          return (
            <button
              key={serviceType.id}
              type="button"
              onClick={() => accessible && onTypeSelect(serviceType.driver, serviceType)}
              disabled={!accessible}
              className={cn(
                'relative p-6 rounded-lg border-2 transition-all duration-200',
                'focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2',
                'text-left hover:shadow-md',
                selected
                  ? 'border-primary-500 bg-primary-50 shadow-md dark:bg-primary-900/20'
                  : 'border-gray-200 bg-white hover:border-gray-300 dark:border-gray-700 dark:bg-gray-800',
                !accessible && 'opacity-60 cursor-not-allowed hover:shadow-none'
              )}
            >
              {/* Selection indicator */}
              {selected && (
                <div className="absolute top-2 right-2">
                  <CheckIcon className="h-5 w-5 text-primary-600" />
                </div>
              )}

              {/* Service tier badge */}
              <div className="absolute top-2 left-2">
                <span className={cn(
                  'inline-flex items-center px-2 py-1 rounded-full text-xs font-medium',
                  getTierColor(serviceType.tier)
                )}>
                  {serviceType.tier}
                </span>
              </div>

              {/* Service icon and name */}
              <div className="flex items-center space-x-3 mt-6 mb-3">
                <DatabaseIcon className="h-8 w-8 text-gray-400" />
                <div>
                  <h4 className="font-semibold text-gray-900 dark:text-gray-100">
                    {serviceType.name}
                  </h4>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {serviceType.category}
                  </p>
                </div>
              </div>

              {/* Description */}
              {showDescriptions && (
                <p className="text-sm text-gray-600 dark:text-gray-300 mb-3">
                  {serviceType.description}
                </p>
              )}

              {/* Features */}
              <div className="space-y-1">
                {serviceType.features.slice(0, 2).map((feature, index) => (
                  <div key={index} className="flex items-center space-x-2">
                    <CheckIcon className="h-3 w-3 text-green-500 flex-shrink-0" />
                    <span className="text-xs text-gray-600 dark:text-gray-400">
                      {feature}
                    </span>
                  </div>
                ))}
              </div>

              {/* Upgrade indicator for inaccessible tiers */}
              {!accessible && (
                <div className="absolute inset-0 flex items-center justify-center bg-white/80 dark:bg-gray-800/80 rounded-lg">
                  <div className="text-center">
                    <ShieldCheckIcon className="h-6 w-6 text-amber-500 mx-auto mb-1" />
                    <p className="text-xs font-medium text-gray-900 dark:text-gray-100">
                      Upgrade Required
                    </p>
                  </div>
                </div>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
};

/**
 * Wizard step navigation component
 */
interface WizardNavigationProps {
  steps: WizardStep[];
  currentStep: number;
  completedSteps: Set<number>;
  onStepClick: (stepIndex: number) => void;
  canNavigate: (stepIndex: number) => boolean;
  showProgress?: boolean;
}

const WizardNavigation: React.FC<WizardNavigationProps> = ({
  steps,
  currentStep,
  completedSteps,
  onStepClick,
  canNavigate,
  showProgress = true
}) => {
  const getStepIcon = useCallback((step: WizardStep, index: number) => {
    switch (step.id) {
      case WIZARD_STEPS.SERVICE_TYPE:
        return DatabaseIcon;
      case WIZARD_STEPS.BASIC_INFO:
        return InformationCircleIcon;
      case WIZARD_STEPS.CONNECTION_CONFIG:
        return CogIcon;
      case WIZARD_STEPS.SECURITY_CONFIG:
        return ShieldCheckIcon;
      case WIZARD_STEPS.ADVANCED_CONFIG:
        return AdjustmentsHorizontalIcon;
      default:
        return InformationCircleIcon;
    }
  }, []);

  const getStepStatus = useCallback((index: number) => {
    if (completedSteps.has(index)) return 'completed';
    if (index === currentStep) return 'current';
    if (canNavigate(index)) return 'available';
    return 'disabled';
  }, [completedSteps, currentStep, canNavigate]);

  const progress = useMemo(() => {
    const completedCount = completedSteps.size;
    const totalSteps = steps.length;
    return Math.round((completedCount / totalSteps) * 100);
  }, [completedSteps.size, steps.length]);

  return (
    <div className="space-y-6">
      {/* Progress bar */}
      {showProgress && (
        <div className="space-y-2">
          <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400">
            <span>Progress</span>
            <span>{progress}% complete</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2 dark:bg-gray-700">
            <div 
              className="bg-primary-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      )}

      {/* Step indicators */}
      <nav className="space-y-2">
        {steps.map((step, index) => {
          const status = getStepStatus(index);
          const Icon = getStepIcon(step, index);
          
          return (
            <button
              key={step.id}
              type="button"
              onClick={() => canNavigate(index) && onStepClick(index)}
              disabled={!canNavigate(index)}
              className={cn(
                'w-full flex items-center space-x-3 p-3 rounded-lg text-left transition-all',
                'focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2',
                status === 'current' && 'bg-primary-50 border border-primary-200 dark:bg-primary-900/20 dark:border-primary-800',
                status === 'completed' && 'bg-green-50 border border-green-200 dark:bg-green-900/20 dark:border-green-800',
                status === 'available' && 'hover:bg-gray-50 border border-transparent dark:hover:bg-gray-800',
                status === 'disabled' && 'opacity-50 cursor-not-allowed'
              )}
            >
              {/* Step icon */}
              <div className={cn(
                'flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center',
                status === 'current' && 'bg-primary-600 text-white',
                status === 'completed' && 'bg-green-600 text-white',
                status === 'available' && 'bg-gray-200 text-gray-600 dark:bg-gray-700 dark:text-gray-400',
                status === 'disabled' && 'bg-gray-100 text-gray-400 dark:bg-gray-800'
              )}>
                {status === 'completed' ? (
                  <CheckIcon className="w-4 h-4" />
                ) : (
                  <Icon className="w-4 h-4" />
                )}
              </div>

              {/* Step content */}
              <div className="flex-1 min-w-0">
                <p className={cn(
                  'text-sm font-medium truncate',
                  status === 'current' && 'text-primary-900 dark:text-primary-100',
                  status === 'completed' && 'text-green-900 dark:text-green-100',
                  status === 'available' && 'text-gray-900 dark:text-gray-100',
                  status === 'disabled' && 'text-gray-500 dark:text-gray-400'
                )}>
                  {step.title}
                </p>
                {step.description && (
                  <p className={cn(
                    'text-xs truncate',
                    status === 'current' && 'text-primary-700 dark:text-primary-300',
                    status === 'completed' && 'text-green-700 dark:text-green-300',
                    status === 'available' && 'text-gray-500 dark:text-gray-400',
                    status === 'disabled' && 'text-gray-400 dark:text-gray-500'
                  )}>
                    {step.description}
                  </p>
                )}
              </div>

              {/* Step indicator */}
              <div className="flex-shrink-0">
                <span className={cn(
                  'inline-flex items-center justify-center w-6 h-6 text-xs font-medium rounded-full',
                  status === 'current' && 'bg-primary-100 text-primary-800 dark:bg-primary-800 dark:text-primary-200',
                  status === 'completed' && 'bg-green-100 text-green-800 dark:bg-green-800 dark:text-green-200',
                  status === 'available' && 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300',
                  status === 'disabled' && 'bg-gray-50 text-gray-400 dark:bg-gray-800'
                )}>
                  {index + 1}
                </span>
              </div>
            </button>
          );
        })}
      </nav>
    </div>
  );
};

// =============================================================================
// MAIN WIZARD COMPONENT
// =============================================================================

/**
 * Service Form Wizard Props interface
 */
export interface ServiceFormWizardComponentProps extends BaseComponentProps {
  mode?: ServiceFormMode;
  serviceId?: number;
  initialData?: Partial<ServiceFormData>;
  onSubmit?: (data: ServiceFormInput) => void | Promise<void>;
  onCancel?: () => void;
  onStepChange?: (step: number) => void;
  steps?: WizardStep[];
  enableStepValidation?: boolean;
  allowSkipOptionalSteps?: boolean;
  showProgress?: boolean;
  showStepIndicator?: boolean;
  submitButtonText?: string;
  cancelButtonText?: string;
  previousButtonText?: string;
  nextButtonText?: string;
  enablePaywall?: boolean;
  currentTier?: ServiceTierAccess;
  redirectOnSuccess?: string;
  redirectOnCancel?: string;
}

/**
 * Service Form Wizard Component
 * 
 * Main component implementing multi-step wizard for database service creation.
 * Migrates Angular mat-stepper functionality to React with enhanced features.
 */
export const ServiceFormWizard: React.FC<ServiceFormWizardComponentProps> = ({
  mode = 'create',
  serviceId,
  initialData,
  onSubmit,
  onCancel,
  onStepChange,
  steps = DEFAULT_WIZARD_STEPS,
  enableStepValidation = true,
  allowSkipOptionalSteps = true,
  showProgress = true,
  showStepIndicator = true,
  submitButtonText = 'Create Service',
  cancelButtonText = 'Cancel',
  previousButtonText = 'Previous',
  nextButtonText = 'Next',
  enablePaywall = true,
  currentTier = 'free',
  redirectOnSuccess,
  redirectOnCancel,
  className,
  ...props
}) => {
  // Form state management with React Hook Form
  const form = useForm<ServiceFormInput>({
    resolver: zodResolver(ServiceFormSchema),
    defaultValues: {
      name: initialData?.name || '',
      label: initialData?.label || '',
      description: initialData?.description || '',
      type: initialData?.type || 'mysql',
      config: {
        driver: initialData?.config?.driver || 'mysql',
        host: initialData?.config?.host || '',
        port: initialData?.config?.port || 3306,
        database: initialData?.config?.database || '',
        username: initialData?.config?.username || '',
        password: initialData?.config?.password || '',
        ssl: {
          enabled: false,
          verify: true,
          mode: 'prefer'
        },
        pooling: {
          min: 2,
          max: 10,
          acquireTimeoutMillis: 60000,
          createTimeoutMillis: 30000,
          destroyTimeoutMillis: 5000,
          idleTimeoutMillis: 300000
        }
      },
      is_active: initialData?.is_active ?? true,
      security: {
        accessType: 'private',
        requireHttps: true,
        corsEnabled: false,
        rateLimiting: {
          enabled: false,
          requestsPerMinute: 60,
          requestsPerHour: 1000
        },
        authentication: {
          type: 'api-key',
          sessionTimeout: 60
        }
      },
      advanced: {
        caching: {
          enabled: false,
          strategy: 'memory',
          ttl: 300
        },
        logging: {
          enabled: true,
          level: 'info',
          destination: 'console'
        },
        monitoring: {
          enabled: false,
          healthCheckInterval: 30
        }
      }
    },
    mode: 'onBlur',
    reValidateMode: 'onChange'
  });

  const { watch, trigger, getValues, formState } = form;
  const watchedValues = watch();

  // Wizard navigation state
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [completedSteps, setCompletedSteps] = useState<Set<number>>(new Set());
  const [visitedSteps, setVisitedSteps] = useState<Set<number>>(new Set([0]));
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form submission handling
  const { submitForm } = useServiceFormSubmission(mode, serviceId);

  // Current step information
  const currentStep = steps[currentStepIndex];
  const isFirstStep = currentStepIndex === 0;
  const isLastStep = currentStepIndex === steps.length - 1;

  // Step validation
  const validateCurrentStep = useCallback(async () => {
    if (!enableStepValidation) return true;

    const stepFields = currentStep.fields;
    let isValid = true;

    // Validate individual fields
    for (const field of stepFields) {
      const fieldValid = await trigger(field as any);
      if (!fieldValid) isValid = false;
    }

    // Validate with step schema if provided
    if (currentStep.validationSchema && isValid) {
      try {
        const formData = getValues();
        const stepData = stepFields.reduce((acc, field) => {
          const value = formData[field as keyof ServiceFormInput];
          if (value !== undefined) {
            acc[field] = value;
          }
          return acc;
        }, {} as any);

        await currentStep.validationSchema.parseAsync(stepData);
      } catch (error) {
        if (error instanceof z.ZodError) {
          // Set form errors
          error.errors.forEach((err) => {
            const path = err.path.join('.');
            form.setError(path as any, {
              type: 'validation',
              message: err.message,
            });
          });
          isValid = false;
        }
      }
    }

    return isValid;
  }, [currentStep, enableStepValidation, trigger, getValues, form]);

  // Navigation handlers
  const goToStep = useCallback(async (stepIndex: number) => {
    if (stepIndex < 0 || stepIndex >= steps.length) return false;

    // If going forward, validate current step
    if (stepIndex > currentStepIndex) {
      const isValid = await validateCurrentStep();
      if (!isValid && !currentStep.optional) return false;
      
      if (isValid) {
        setCompletedSteps(prev => new Set([...prev, currentStepIndex]));
      }
    }

    setCurrentStepIndex(stepIndex);
    setVisitedSteps(prev => new Set([...prev, stepIndex]));
    
    if (onStepChange) {
      onStepChange(stepIndex);
    }

    return true;
  }, [currentStepIndex, validateCurrentStep, currentStep, onStepChange, steps.length]);

  const goToNextStep = useCallback(async () => {
    if (isLastStep) return false;
    return await goToStep(currentStepIndex + 1);
  }, [isLastStep, goToStep, currentStepIndex]);

  const goToPreviousStep = useCallback(() => {
    if (isFirstStep) return false;
    return goToStep(currentStepIndex - 1);
  }, [isFirstStep, goToStep, currentStepIndex]);

  // Step accessibility check
  const canNavigateToStep = useCallback((stepIndex: number) => {
    if (stepIndex <= currentStepIndex) return true;
    if (visitedSteps.has(stepIndex)) return true;
    
    // Check if all previous required steps are completed
    for (let i = 0; i < stepIndex; i++) {
      if (!steps[i].optional && !completedSteps.has(i)) {
        return false;
      }
    }
    
    return true;
  }, [currentStepIndex, visitedSteps, completedSteps, steps]);

  // Form submission
  const handleSubmit = useCallback(async () => {
    setIsSubmitting(true);
    
    try {
      // Validate all steps
      const isValid = await trigger();
      if (!isValid) {
        setIsSubmitting(false);
        return;
      }

      const formData = getValues();
      
      if (onSubmit) {
        await onSubmit(formData);
      } else {
        await submitForm(formData, {
          redirect: !!redirectOnSuccess,
          onSuccess: (service) => {
            console.log('Service created successfully:', service);
          }
        });
      }
    } catch (error) {
      console.error('Form submission failed:', error);
    } finally {
      setIsSubmitting(false);
    }
  }, [trigger, getValues, onSubmit, submitForm, redirectOnSuccess]);

  // Cancel handler
  const handleCancel = useCallback(() => {
    if (onCancel) {
      onCancel();
    } else if (redirectOnCancel) {
      window.location.href = redirectOnCancel;
    }
  }, [onCancel, redirectOnCancel]);

  // Dynamic field generation for current step
  const stepFields: DynamicFieldConfig[] = useMemo(() => {
    const fields: DynamicFieldConfig[] = [];
    
    switch (currentStep.id) {
      case WIZARD_STEPS.SERVICE_TYPE:
        // Service type selection is handled by custom component
        break;
        
      case WIZARD_STEPS.BASIC_INFO:
        fields.push(
          {
            id: 'name',
            name: 'name',
            type: 'text',
            label: 'Service Name',
            placeholder: 'my_database_service',
            description: 'Unique identifier for your database service',
            required: true,
            validation: {
              required: true,
              minLength: 1,
              maxLength: 64,
              pattern: '^[a-zA-Z][a-zA-Z0-9_-]*$'
            },
            transform: 'snakeCase',
            section: 'basic',
            order: 1
          },
          {
            id: 'label',
            name: 'label',
            type: 'text',
            label: 'Display Label',
            placeholder: 'My Database Service',
            description: 'Human-readable name for your service',
            required: true,
            validation: {
              required: true,
              minLength: 1,
              maxLength: 255
            },
            section: 'basic',
            order: 2
          },
          {
            id: 'description',
            name: 'description',
            type: 'textarea',
            label: 'Description',
            placeholder: 'Describe what this database service will be used for...',
            description: 'Optional description for documentation purposes',
            required: false,
            validation: {
              maxLength: 1024
            },
            section: 'basic',
            order: 3
          }
        );
        break;
        
      case WIZARD_STEPS.CONNECTION_CONFIG:
        fields.push(
          {
            id: 'config.host',
            name: 'config.host',
            type: 'text',
            label: 'Host',
            placeholder: 'localhost',
            description: 'Database server hostname or IP address',
            required: true,
            validation: {
              required: true,
              minLength: 1,
              maxLength: 255
            },
            section: 'connection',
            order: 1
          },
          {
            id: 'config.port',
            name: 'config.port',
            type: 'number',
            label: 'Port',
            placeholder: '3306',
            description: 'Database server port number',
            required: false,
            validation: {
              min: 1,
              max: 65535
            },
            section: 'connection',
            order: 2
          },
          {
            id: 'config.database',
            name: 'config.database',
            type: 'text',
            label: 'Database Name',
            placeholder: 'my_database',
            description: 'Name of the database to connect to',
            required: true,
            validation: {
              required: true,
              minLength: 1,
              maxLength: 64
            },
            section: 'connection',
            order: 3
          },
          {
            id: 'config.username',
            name: 'config.username',
            type: 'text',
            label: 'Username',
            placeholder: 'db_user',
            description: 'Database username for authentication',
            required: true,
            validation: {
              required: true,
              minLength: 1,
              maxLength: 64
            },
            section: 'connection',
            order: 4
          },
          {
            id: 'config.password',
            name: 'config.password',
            type: 'password',
            label: 'Password',
            placeholder: '••••••••',
            description: 'Database password for authentication',
            required: false,
            validation: {
              maxLength: 255
            },
            section: 'connection',
            order: 5
          }
        );
        break;
        
      case WIZARD_STEPS.SECURITY_CONFIG:
        fields.push(
          {
            id: 'security.accessType',
            name: 'security.accessType',
            type: 'select',
            label: 'Access Type',
            description: 'How the service can be accessed',
            required: true,
            options: [
              { value: 'public', label: 'Public', description: 'Anyone can access' },
              { value: 'private', label: 'Private', description: 'Restricted access' },
              { value: 'role-based', label: 'Role-based', description: 'Access by roles' },
              { value: 'api-key', label: 'API Key', description: 'Requires API key' }
            ],
            section: 'security',
            order: 1
          },
          {
            id: 'security.requireHttps',
            name: 'security.requireHttps',
            type: 'checkbox',
            label: 'Require HTTPS',
            description: 'Force all connections to use HTTPS',
            required: false,
            section: 'security',
            order: 2
          },
          {
            id: 'security.corsEnabled',
            name: 'security.corsEnabled',
            type: 'checkbox',
            label: 'Enable CORS',
            description: 'Allow cross-origin requests',
            required: false,
            section: 'security',
            order: 3
          }
        );
        break;
        
      case WIZARD_STEPS.ADVANCED_CONFIG:
        fields.push(
          {
            id: 'advanced.caching.enabled',
            name: 'advanced.caching.enabled',
            type: 'checkbox',
            label: 'Enable Caching',
            description: 'Cache database queries for better performance',
            required: false,
            section: 'caching',
            order: 1
          },
          {
            id: 'advanced.logging.enabled',
            name: 'advanced.logging.enabled',
            type: 'checkbox',
            label: 'Enable Logging',
            description: 'Log database operations for monitoring',
            required: false,
            section: 'logging',
            order: 2
          },
          {
            id: 'advanced.monitoring.enabled',
            name: 'advanced.monitoring.enabled',
            type: 'checkbox',
            label: 'Enable Monitoring',
            description: 'Monitor service health and performance',
            required: false,
            section: 'monitoring',
            order: 3
          }
        );
        break;
    }
    
    return fields;
  }, [currentStep.id]);

  // Service type selection handler
  const handleServiceTypeSelect = useCallback((driver: DatabaseDriver, serviceType: ServiceType) => {
    form.setValue('type', driver);
    form.setValue('config.driver', driver);
    
    // Set default port based on database type
    const defaultPorts: Record<DatabaseDriver, number> = {
      mysql: 3306,
      pgsql: 5432,
      oracle: 1521,
      mongodb: 27017,
      snowflake: 443,
      sqlsrv: 1433,
      sqlite: 0,
      ibmdb2: 50000,
      informix: 9088,
      sqlanywhere: 2638,
      memsql: 3306,
      salesforce_db: 443,
      hana: 30015,
      apache_hive: 10000,
      databricks: 443,
      dremio: 31010
    };
    
    form.setValue('config.port', defaultPorts[driver] || 3306);
  }, [form]);

  return (
    <div className={cn('service-form-wizard', className)} {...props}>
      <FormProvider {...form}>
        <div className="max-w-6xl mx-auto">
          <div className="bg-white dark:bg-gray-900 rounded-lg shadow-lg overflow-hidden">
            <div className="flex">
              {/* Sidebar Navigation */}
              {showStepIndicator && (
                <div className="w-80 bg-gray-50 dark:bg-gray-800 p-6 border-r border-gray-200 dark:border-gray-700">
                  <WizardNavigation
                    steps={steps}
                    currentStep={currentStepIndex}
                    completedSteps={completedSteps}
                    onStepClick={goToStep}
                    canNavigate={canNavigateToStep}
                    showProgress={showProgress}
                  />
                </div>
              )}

              {/* Main Content */}
              <div className="flex-1">
                <div className="p-8">
                  {/* Step Header */}
                  <div className="mb-8">
                    <div className="flex items-center space-x-3 mb-4">
                      <div className="flex-shrink-0 w-10 h-10 bg-primary-100 rounded-lg flex items-center justify-center dark:bg-primary-900">
                        <span className="text-primary-600 font-semibold dark:text-primary-400">
                          {currentStepIndex + 1}
                        </span>
                      </div>
                      <div>
                        <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                          {currentStep.title}
                        </h2>
                        {currentStep.description && (
                          <p className="text-gray-600 dark:text-gray-400 mt-1">
                            {currentStep.description}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Progress indicator for mobile */}
                    {!showStepIndicator && showProgress && (
                      <div className="mb-6">
                        <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400 mb-2">
                          <span>Step {currentStepIndex + 1} of {steps.length}</span>
                          <span>{Math.round(((currentStepIndex + 1) / steps.length) * 100)}%</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2 dark:bg-gray-700">
                          <div 
                            className="bg-primary-600 h-2 rounded-full transition-all duration-300"
                            style={{ width: `${((currentStepIndex + 1) / steps.length) * 100}%` }}
                          />
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Step Content */}
                  <div className="mb-8">
                    {currentStep.id === WIZARD_STEPS.SERVICE_TYPE ? (
                      <ServiceTypeSelector
                        selectedType={watchedValues.type}
                        onTypeSelect={handleServiceTypeSelect}
                        currentTier={currentTier}
                        enablePaywall={enablePaywall}
                      />
                    ) : (
                      <ServiceFormFields
                        fields={stepFields}
                        control={form.control}
                        register={form.register}
                        watch={form.watch}
                        setValue={form.setValue}
                        trigger={form.trigger}
                        errors={formState.errors}
                        isSubmitting={isSubmitting}
                        enableConditionalLogic={true}
                        layout="single"
                        showFieldGroups={true}
                      />
                    )}
                  </div>

                  {/* Step Actions */}
                  <div className="flex items-center justify-between pt-6 border-t border-gray-200 dark:border-gray-700">
                    <div>
                      {!isFirstStep && (
                        <Button
                          type="button"
                          variant="outline"
                          onClick={goToPreviousStep}
                          disabled={isSubmitting}
                          className="inline-flex items-center"
                        >
                          <ChevronLeftIcon className="w-4 h-4 mr-2" />
                          {previousButtonText}
                        </Button>
                      )}
                    </div>

                    <div className="flex items-center space-x-3">
                      <Button
                        type="button"
                        variant="ghost"
                        onClick={handleCancel}
                        disabled={isSubmitting}
                      >
                        {cancelButtonText}
                      </Button>

                      {isLastStep ? (
                        <Button
                          type="button"
                          onClick={handleSubmit}
                          disabled={isSubmitting}
                          className="inline-flex items-center"
                        >
                          {isSubmitting ? (
                            <>
                              <div className="w-4 h-4 mr-2 border-2 border-white border-t-transparent rounded-full animate-spin" />
                              Creating...
                            </>
                          ) : (
                            <>
                              <PlayIcon className="w-4 h-4 mr-2" />
                              {submitButtonText}
                            </>
                          )}
                        </Button>
                      ) : (
                        <Button
                          type="button"
                          onClick={goToNextStep}
                          disabled={isSubmitting}
                          className="inline-flex items-center"
                        >
                          {nextButtonText}
                          <ChevronRightIcon className="w-4 h-4 ml-2" />
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </FormProvider>
    </div>
  );
};

export default ServiceFormWizard;