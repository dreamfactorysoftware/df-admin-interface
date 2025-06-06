/**
 * Database Service Form Hooks
 * 
 * Custom React hooks for database service form management, wizard navigation, and data operations.
 * Implements React Hook Form integration with Zod validation, multi-step wizard state management,
 * dynamic schema-driven field generation, connection testing with SWR, and paywall access control.
 * Provides hooks for service creation, modification, and security configuration workflows.
 * 
 * @fileoverview Service form hooks with React Hook Form 7.52+, SWR, and React Query integration
 * @version 1.0.0
 * @since React 19.0.0, Next.js 15.1+, TypeScript 5.8+
 */

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useForm, useFormContext, UseFormReturn } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import useSWR, { mutate as swrMutate } from 'swr';
import { 
  useQuery, 
  useMutation, 
  useQueryClient,
  UseQueryResult,
  UseMutationResult
} from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { z } from 'zod';

// Internal imports
import { apiClient } from '../../../lib/api-client';
import type {
  ServiceFormData,
  ServiceFormInput,
  ServiceFormMode,
  ServiceFormSubmissionState,
  ServiceFormSubmissionResult,
  WizardStep,
  WizardNavigationState,
  WizardStepProgress,
  WizardStepValidationState,
  DynamicFieldConfig,
  PaywallModalState,
  PaywallFeatureAccess,
  PremiumServiceConfig,
  ServiceSecurityConfig,
  ServiceAdvancedConfig,
  UseServiceFormReturn,
  UseServiceFormWizardReturn,
  UseConnectionTestReturn,
  UsePaywallAccessReturn,
  UseDynamicFieldsReturn,
  ServiceFormSchema,
  ServiceTypeSelectionSchema,
  BasicServiceInfoSchema,
  ConnectionConfigSchema,
  SecurityConfigSchema,
  AdvancedConfigSchema,
  DEFAULT_WIZARD_STEPS,
  WIZARD_STEPS,
  WizardStepKey,
  ServiceTierAccess,
  FormFieldError
} from './service-form-types';
import type {
  DatabaseService,
  DatabaseConfig,
  DatabaseDriver,
  ConnectionTestResult,
  ConnectionTestStatus,
  ApiErrorResponse,
  DatabaseConnectionFormData,
  ServiceQueryParams
} from '../types';
import { useNotifications } from '../../../hooks/use-notifications';
import { useLoading } from '../../../hooks/use-loading';
import { useDebounce } from '../../../hooks/use-debounce';
import { usePaywall } from '../../../hooks/use-paywall';

// =============================================================================
// CONSTANTS AND CONFIGURATION
// =============================================================================

/**
 * SWR configuration for connection testing
 */
const CONNECTION_TEST_SWR_CONFIG = {
  revalidateOnFocus: false,
  revalidateOnReconnect: false,
  revalidateIfStale: false,
  dedupingInterval: 0, // No deduplication for testing
  errorRetryCount: 1,
  errorRetryInterval: 1000,
  focusThrottleInterval: 0,
} as const;

/**
 * React Query configuration for service operations
 */
const SERVICE_QUERY_CONFIG = {
  staleTime: 5 * 60 * 1000, // 5 minutes
  cacheTime: 10 * 60 * 1000, // 10 minutes
} as const;

/**
 * Form validation timing configuration
 */
const VALIDATION_CONFIG = {
  debounceMs: 300,
  realTimeValidation: true,
  validationMode: 'onChange' as const,
  reValidateMode: 'onChange' as const,
  shouldFocusError: true,
} as const;

/**
 * Wizard navigation configuration
 */
const WIZARD_CONFIG = {
  autoSave: true,
  autoSaveInterval: 30000, // 30 seconds
  validateOnStepChange: true,
  allowSkipOptionalSteps: true,
} as const;

// =============================================================================
// QUERY KEYS FOR REACT QUERY
// =============================================================================

/**
 * Query keys for service form operations
 */
export const ServiceFormQueryKeys = {
  all: ['service-form'] as const,
  services: () => [...ServiceFormQueryKeys.all, 'services'] as const,
  service: (id: number) => [...ServiceFormQueryKeys.services(), id] as const,
  connectionTest: (config: any) => [...ServiceFormQueryKeys.all, 'test', config] as const,
  serviceTypes: () => [...ServiceFormQueryKeys.all, 'types'] as const,
  fieldConfigs: (type: DatabaseDriver) => [...ServiceFormQueryKeys.all, 'fields', type] as const,
  paywall: (feature: string) => [...ServiceFormQueryKeys.all, 'paywall', feature] as const,
} as const;

// =============================================================================
// MAIN SERVICE FORM HOOK
// =============================================================================

/**
 * Primary service form hook with React Hook Form integration and Zod validation
 * Provides comprehensive form state management with type-safe validation
 */
export function useServiceForm(
  mode: ServiceFormMode = 'create',
  initialData?: Partial<ServiceFormData>,
  options?: {
    enableRealTimeValidation?: boolean;
    customValidation?: (data: ServiceFormInput) => Promise<Record<string, string> | undefined>;
    onSubmit?: (data: ServiceFormInput) => void | Promise<void>;
    onError?: (errors: Record<string, any>) => void;
  }
): UseServiceFormReturn {
  const { addNotification } = useNotifications();
  const { setLoading } = useLoading();
  const router = useRouter();
  
  // Form configuration with Zod resolver
  const form = useForm<ServiceFormInput>({
    resolver: zodResolver(ServiceFormSchema),
    defaultValues: {
      name: '',
      label: '',
      description: '',
      type: 'mysql',
      config: {
        driver: 'mysql',
        host: '',
        port: 3306,
        database: '',
        username: '',
        password: '',
        ssl: {
          enabled: false,
        },
        pooling: {
          min: 0,
          max: 10,
        },
      },
      is_active: true,
      requiresPremium: false,
      tierAccess: 'free',
      ...initialData,
    },
    mode: options?.enableRealTimeValidation !== false ? VALIDATION_CONFIG.validationMode : 'onSubmit',
    reValidateMode: VALIDATION_CONFIG.reValidateMode,
    shouldFocusError: VALIDATION_CONFIG.shouldFocusError,
  });

  const {
    handleSubmit,
    reset,
    formState: { errors, isValid, isDirty, isSubmitting, touchedFields, dirtyFields, submitCount },
    trigger,
    clearErrors,
  } = form;

  // Debounced validation for real-time feedback
  const debouncedTrigger = useDebounce(
    useCallback(() => {
      if (options?.enableRealTimeValidation !== false && isDirty) {
        trigger();
      }
    }, [trigger, isDirty, options?.enableRealTimeValidation]),
    VALIDATION_CONFIG.debounceMs
  );

  // Effect for real-time validation
  useEffect(() => {
    if (options?.enableRealTimeValidation !== false) {
      debouncedTrigger();
    }
  }, [debouncedTrigger, options?.enableRealTimeValidation]);

  // Service creation/update mutation
  const queryClient = useQueryClient();
  const serviceMutation = useMutation({
    mutationFn: async (data: ServiceFormInput) => {
      setLoading(true);
      try {
        // Apply custom validation if provided
        if (options?.customValidation) {
          const customErrors = await options.customValidation(data);
          if (customErrors && Object.keys(customErrors).length > 0) {
            throw new Error('Custom validation failed');
          }
        }

        const endpoint = mode === 'create' 
          ? '/system/service'
          : `/system/service/${initialData?.name}`;
        
        const method = mode === 'create' ? 'post' : 'patch';
        const response = await apiClient[method]<DatabaseService>(endpoint, data);
        
        if (!response.data && !response.resource) {
          throw new Error('Invalid response from server');
        }

        return response.data || response.resource;
      } finally {
        setLoading(false);
      }
    },
    onSuccess: (service: DatabaseService) => {
      // Invalidate related queries
      queryClient.invalidateQueries({ queryKey: ServiceFormQueryKeys.services() });
      queryClient.invalidateQueries({ queryKey: ServiceFormQueryKeys.service(service.id) });
      
      addNotification({
        type: 'success',
        title: mode === 'create' ? 'Service Created' : 'Service Updated',
        message: `Database service "${service.label || service.name}" has been ${mode === 'create' ? 'created' : 'updated'} successfully.`,
      });

      // Call external success handler
      if (options?.onSubmit) {
        options.onSubmit(form.getValues());
      }
    },
    onError: (error: Error) => {
      const errorMessage = error.message || 'An unexpected error occurred';
      
      addNotification({
        type: 'error',
        title: mode === 'create' ? 'Service Creation Failed' : 'Service Update Failed',
        message: errorMessage,
      });

      // Call external error handler
      if (options?.onError) {
        options.onError({ submit: errorMessage });
      }
    },
  });

  // Form submission handler
  const submitForm = useCallback(async (onSuccess?: (data: ServiceFormInput) => void) => {
    return handleSubmit(async (data) => {
      try {
        await serviceMutation.mutateAsync(data);
        if (onSuccess) {
          onSuccess(data);
        }
      } catch (error) {
        // Error handling is done in mutation onError
        console.error('Form submission error:', error);
      }
    })();
  }, [handleSubmit, serviceMutation]);

  // Form reset handler
  const resetForm = useCallback((data?: Partial<ServiceFormInput>) => {
    reset({
      ...form.formState.defaultValues,
      ...data,
    });
    clearErrors();
  }, [reset, clearErrors, form.formState.defaultValues]);

  // Form validation handler
  const validateForm = useCallback(async (): Promise<boolean> => {
    return trigger();
  }, [trigger]);

  return {
    ...form,
    submitForm,
    resetForm,
    validateForm,
    isValid,
    isDirty,
    isSubmitting: isSubmitting || serviceMutation.isPending,
    submitCount,
    errors,
    touchedFields,
    dirtyFields,
  };
}

// =============================================================================
// SERVICE FORM WIZARD HOOK
// =============================================================================

/**
 * Multi-step wizard hook for service creation workflow
 * Manages wizard navigation, step validation, and progress tracking
 */
export function useServiceFormWizard(
  steps: WizardStep[] = DEFAULT_WIZARD_STEPS,
  options?: {
    initialStep?: number;
    enableStepValidation?: boolean;
    allowSkipOptionalSteps?: boolean;
    onStepChange?: (step: number) => void;
    onSubmit?: (data: ServiceFormInput) => void | Promise<void>;
    onCancel?: () => void;
  }
): UseServiceFormWizardReturn {
  const { addNotification } = useNotifications();
  const form = useFormContext<ServiceFormInput>();
  
  // Wizard state
  const [currentStep, setCurrentStep] = useState(options?.initialStep || 0);
  const [completedSteps, setCompletedSteps] = useState<Set<number>>(new Set());
  const [validationStates, setValidationStates] = useState<Map<number, WizardStepValidationState>>(new Map());
  const [stepData, setStepData] = useState<Map<number, any>>(new Map());

  // Auto-save functionality
  const autoSaveInterval = useRef<NodeJS.Timeout>();
  
  useEffect(() => {
    if (WIZARD_CONFIG.autoSave) {
      autoSaveInterval.current = setInterval(() => {
        const currentData = form?.getValues();
        if (currentData) {
          setStepData(prev => new Map(prev.set(currentStep, currentData)));
        }
      }, WIZARD_CONFIG.autoSaveInterval);
    }

    return () => {
      if (autoSaveInterval.current) {
        clearInterval(autoSaveInterval.current);
      }
    };
  }, [currentStep, form]);

  // Navigation state calculation
  const navigation = useMemo((): WizardNavigationState => {
    const totalSteps = steps.length;
    const canNavigateNext = currentStep < totalSteps - 1 && 
      (!WIZARD_CONFIG.validateOnStepChange || validationStates.get(currentStep) === 'valid' || 
       (steps[currentStep]?.optional && WIZARD_CONFIG.allowSkipOptionalSteps));
    const canNavigatePrevious = currentStep > 0;
    const isLastStep = currentStep === totalSteps - 1;
    const isFirstStep = currentStep === 0;

    return {
      currentStep,
      totalSteps,
      completedSteps,
      validationStates,
      canNavigateNext,
      canNavigatePrevious,
      isLastStep,
      isFirstStep,
    };
  }, [currentStep, steps.length, completedSteps, validationStates]);

  // Progress calculation
  const progress = useMemo((): WizardStepProgress[] => {
    return steps.map((step, index) => ({
      stepId: step.id,
      stepIndex: index,
      isActive: index === currentStep,
      isCompleted: completedSteps.has(index),
      isValid: validationStates.get(index) === 'valid',
      hasError: validationStates.get(index) === 'invalid',
      completedAt: completedSteps.has(index) ? new Date().toISOString() : undefined,
    }));
  }, [steps, currentStep, completedSteps, validationStates]);

  // Step validation
  const validateStep = useCallback(async (stepIndex: number): Promise<boolean> => {
    const step = steps[stepIndex];
    if (!step || !form) return true;

    setValidationStates(prev => new Map(prev.set(stepIndex, 'pending')));

    try {
      if (step.validationSchema) {
        const formData = form.getValues();
        const stepFields = step.fields.reduce((acc, fieldName) => {
          const value = form.getValues(fieldName as any);
          if (value !== undefined) {
            acc[fieldName] = value;
          }
          return acc;
        }, {} as any);

        await step.validationSchema.parseAsync(stepFields);
      }

      // Trigger React Hook Form validation for step fields
      const isValid = await form.trigger(step.fields as any);
      
      if (isValid) {
        setValidationStates(prev => new Map(prev.set(stepIndex, 'valid')));
        return true;
      } else {
        setValidationStates(prev => new Map(prev.set(stepIndex, 'invalid')));
        return false;
      }
    } catch (error) {
      setValidationStates(prev => new Map(prev.set(stepIndex, 'invalid')));
      return false;
    }
  }, [steps, form]);

  // Current step validation
  const validateCurrentStep = useCallback(async (): Promise<boolean> => {
    return validateStep(currentStep);
  }, [validateStep, currentStep]);

  // All steps validation
  const validateAllSteps = useCallback(async (): Promise<boolean> => {
    const results = await Promise.all(
      steps.map((_, index) => validateStep(index))
    );
    return results.every(result => result);
  }, [validateStep, steps]);

  // Navigation methods
  const goToStep = useCallback(async (stepIndex: number): Promise<boolean> => {
    if (stepIndex < 0 || stepIndex >= steps.length) return false;

    // Validate current step before navigation if enabled
    if (WIZARD_CONFIG.validateOnStepChange && stepIndex > currentStep) {
      const isCurrentStepValid = await validateCurrentStep();
      if (!isCurrentStepValid && !steps[currentStep]?.optional) {
        addNotification({
          type: 'warning',
          title: 'Step Validation Failed',
          message: 'Please complete the current step before proceeding.',
        });
        return false;
      }
    }

    // Save current step data
    const currentData = form?.getValues();
    if (currentData) {
      setStepData(prev => new Map(prev.set(currentStep, currentData)));
    }

    setCurrentStep(stepIndex);
    
    if (options?.onStepChange) {
      options.onStepChange(stepIndex);
    }

    return true;
  }, [currentStep, steps, validateCurrentStep, form, addNotification, options]);

  const goToNextStep = useCallback(async (): Promise<boolean> => {
    if (currentStep < steps.length - 1) {
      const success = await goToStep(currentStep + 1);
      if (success) {
        setCompletedSteps(prev => new Set(prev.add(currentStep)));
      }
      return success;
    }
    return false;
  }, [currentStep, steps.length, goToStep]);

  const goToPreviousStep = useCallback((): void => {
    if (currentStep > 0) {
      goToStep(currentStep - 1);
    }
  }, [currentStep, goToStep]);

  const goToFirstStep = useCallback((): void => {
    goToStep(0);
  }, [goToStep]);

  const goToLastStep = useCallback((): void => {
    goToStep(steps.length - 1);
  }, [goToStep, steps.length]);

  // Step management
  const completeStep = useCallback((stepIndex: number): void => {
    setCompletedSteps(prev => new Set(prev.add(stepIndex)));
    setValidationStates(prev => new Map(prev.set(stepIndex, 'valid')));
  }, []);

  const skipStep = useCallback((stepIndex: number): void => {
    if (steps[stepIndex]?.optional) {
      setValidationStates(prev => new Map(prev.set(stepIndex, 'skipped')));
      setCompletedSteps(prev => new Set(prev.add(stepIndex)));
    }
  }, [steps]);

  const resetStep = useCallback((stepIndex: number): void => {
    setCompletedSteps(prev => {
      const newSet = new Set(prev);
      newSet.delete(stepIndex);
      return newSet;
    });
    setValidationStates(prev => {
      const newMap = new Map(prev);
      newMap.delete(stepIndex);
      return newMap;
    });
    setStepData(prev => {
      const newMap = new Map(prev);
      newMap.delete(stepIndex);
      return newMap;
    });
  }, []);

  // Data management
  const getStepData = useCallback((stepIndex: number): any => {
    return stepData.get(stepIndex);
  }, [stepData]);

  const setStepDataValue = useCallback((stepIndex: number, data: any): void => {
    setStepData(prev => new Map(prev.set(stepIndex, data)));
  }, []);

  const getAllData = useCallback((): ServiceFormInput => {
    return form?.getValues() || {} as ServiceFormInput;
  }, [form]);

  const resetAllData = useCallback((): void => {
    form?.reset();
    setStepData(new Map());
    setCompletedSteps(new Set());
    setValidationStates(new Map());
    setCurrentStep(0);
  }, [form]);

  // Wizard submission
  const submitWizard = useCallback(async (): Promise<void> => {
    const isAllValid = await validateAllSteps();
    
    if (!isAllValid) {
      addNotification({
        type: 'error',
        title: 'Validation Failed',
        message: 'Please complete all required steps before submitting.',
      });
      return;
    }

    const finalData = getAllData();
    
    if (options?.onSubmit) {
      await options.onSubmit(finalData);
    }
  }, [validateAllSteps, getAllData, addNotification, options]);

  // State flags
  const canNavigateNext = navigation.canNavigateNext;
  const canNavigatePrevious = navigation.canNavigatePrevious;
  const isFirstStep = navigation.isFirstStep;
  const isLastStep = navigation.isLastStep;
  const isCompleted = completedSteps.size === steps.length;

  return {
    currentStep,
    navigation,
    progress,
    goToStep,
    goToNextStep,
    goToPreviousStep,
    goToFirstStep,
    goToLastStep,
    validateCurrentStep,
    validateAllSteps,
    validateStep,
    completeStep,
    skipStep,
    resetStep,
    getStepData,
    setStepData: setStepDataValue,
    getAllData,
    resetAllData,
    submitWizard,
    canNavigateNext,
    canNavigatePrevious,
    isFirstStep,
    isLastStep,
    isCompleted,
  };
}

// =============================================================================
// DYNAMIC FORM FIELDS HOOK
// =============================================================================

/**
 * Dynamic form fields hook for schema-driven field generation
 * Manages field configurations, visibility, and conditional logic
 */
export function useServiceFormFields(
  serviceType: DatabaseDriver,
  options?: {
    enableConditionalLogic?: boolean;
    enableAsyncValidation?: boolean;
    customFields?: Record<string, any>;
  }
): UseDynamicFieldsReturn {
  const form = useFormContext<ServiceFormInput>();
  const watchedValues = form?.watch();

  // Fetch field configurations for service type
  const { data: fieldConfigs = [], error } = useQuery({
    queryKey: ServiceFormQueryKeys.fieldConfigs(serviceType),
    queryFn: async () => {
      // This would fetch dynamic field configurations from the backend
      // For now, return default configurations based on service type
      return getDefaultFieldConfigs(serviceType);
    },
    enabled: !!serviceType,
    ...SERVICE_QUERY_CONFIG,
  });

  // Field state management
  const [fieldVisibility, setFieldVisibility] = useState<Map<string, boolean>>(new Map());
  const [fieldDisabled, setFieldDisabled] = useState<Map<string, boolean>>(new Map());
  const [fieldRequired, setFieldRequired] = useState<Map<string, boolean>>(new Map());

  // Get field configuration
  const getFieldConfig = useCallback((fieldName: string): DynamicFieldConfig | undefined => {
    return fieldConfigs.find(field => field.name === fieldName);
  }, [fieldConfigs]);

  // Update field configuration
  const updateFieldConfig = useCallback((fieldName: string, config: Partial<DynamicFieldConfig>): void => {
    // This would update field configuration in state or backend
    console.log('Updating field config:', fieldName, config);
  }, []);

  // Field state getters
  const getFieldVisibility = useCallback((fieldName: string): boolean => {
    return fieldVisibility.get(fieldName) ?? true;
  }, [fieldVisibility]);

  const getFieldDisabled = useCallback((fieldName: string): boolean => {
    return fieldDisabled.get(fieldName) ?? false;
  }, [fieldDisabled]);

  const getFieldRequired = useCallback((fieldName: string): boolean => {
    const config = getFieldConfig(fieldName);
    return fieldRequired.get(fieldName) ?? config?.required ?? false;
  }, [fieldRequired, getFieldConfig]);

  // Conditional logic evaluation
  const evaluateConditions = useCallback((fieldName: string): boolean => {
    if (!options?.enableConditionalLogic) return true;

    const config = getFieldConfig(fieldName);
    if (!config?.conditional) return true;

    const { conditions, operator } = config.conditional;
    
    const results = conditions.map(condition => {
      const fieldValue = form?.getValues(condition.field as any);
      return evaluateCondition(fieldValue, condition);
    });

    return operator === 'AND' ? results.every(Boolean) : results.some(Boolean);
  }, [options?.enableConditionalLogic, getFieldConfig, form]);

  // Apply conditional logic
  const applyConditionalLogic = useCallback((): void => {
    if (!options?.enableConditionalLogic || !watchedValues) return;

    fieldConfigs.forEach(field => {
      if (field.conditional) {
        const shouldShow = evaluateConditions(field.name);
        setFieldVisibility(prev => new Map(prev.set(field.name, shouldShow)));
      }
    });
  }, [options?.enableConditionalLogic, watchedValues, fieldConfigs, evaluateConditions]);

  // Apply conditional logic when form values change
  useEffect(() => {
    applyConditionalLogic();
  }, [applyConditionalLogic]);

  // Field dependencies
  const getDependentFields = useCallback((fieldName: string): string[] => {
    const config = getFieldConfig(fieldName);
    return config?.affects || [];
  }, [getFieldConfig]);

  const getFieldDependencies = useCallback((fieldName: string): string[] => {
    const config = getFieldConfig(fieldName);
    return config?.dependsOn || [];
  }, [getFieldConfig]);

  const refreshDependentFields = useCallback((fieldName: string): void => {
    const dependentFields = getDependentFields(fieldName);
    dependentFields.forEach(dependentField => {
      applyConditionalLogic();
    });
  }, [getDependentFields, applyConditionalLogic]);

  // Field validation
  const validateField = useCallback(async (fieldName: string, value: any): Promise<string | undefined> => {
    const config = getFieldConfig(fieldName);
    if (!config?.validation) return undefined;

    const { validation } = config;

    // Custom validator
    if (validation.customValidator) {
      return validation.customValidator(value, form?.getValues());
    }

    // Async validator
    if (validation.asyncValidator && options?.enableAsyncValidation) {
      return validation.asyncValidator(value, form?.getValues());
    }

    return undefined;
  }, [getFieldConfig, form, options?.enableAsyncValidation]);

  const validateAllFields = useCallback(async (): Promise<Record<string, string>> => {
    const errors: Record<string, string> = {};
    const formData = form?.getValues();

    if (!formData) return errors;

    for (const field of fieldConfigs) {
      const value = formData[field.name as keyof ServiceFormInput];
      const error = await validateField(field.name, value);
      if (error) {
        errors[field.name] = error;
      }
    }

    return errors;
  }, [fieldConfigs, form, validateField]);

  return {
    fields: fieldConfigs,
    getFieldConfig,
    updateFieldConfig,
    getFieldVisibility,
    getFieldDisabled,
    getFieldRequired,
    evaluateConditions,
    applyConditionalLogic,
    getDependentFields,
    getFieldDependencies,
    refreshDependentFields,
    validateField,
    validateAllFields,
  };
}

// =============================================================================
// CONNECTION TEST HOOK
// =============================================================================

/**
 * Connection test hook with SWR for real-time testing and caching
 * Provides connection testing functionality with retry logic and status tracking
 */
export function useServiceConnectionTest(
  config?: DatabaseConnectionFormData,
  options?: {
    autoTest?: boolean;
    testOnConfigChange?: boolean;
    debounceDelay?: number;
    maxRetries?: number;
    retryDelay?: number;
  }
): UseConnectionTestReturn {
  const { addNotification } = useNotifications();
  const [status, setStatus] = useState<ConnectionTestStatus>('idle');
  const [retryCount, setRetryCount] = useState(0);
  const [lastTested, setLastTested] = useState<string | null>(null);

  // Debounced config for auto-testing
  const debouncedConfig = useDebounce(config, options?.debounceDelay || 1000);

  // SWR for connection testing
  const {
    data: result,
    error,
    isLoading,
    mutate,
  } = useSWR(
    config && (options?.autoTest || options?.testOnConfigChange) ? 
      ServiceFormQueryKeys.connectionTest(debouncedConfig) : null,
    async () => {
      if (!debouncedConfig) return null;
      
      setStatus('testing');
      
      try {
        const response = await apiClient.post<ConnectionTestResult>('/system/service/_test', {
          config: debouncedConfig,
        });
        
        if (!response.data && !response.resource) {
          throw new Error('Invalid response from server');
        }

        const testResult = response.data || response.resource;
        setStatus(testResult.success ? 'success' : 'error');
        setLastTested(new Date().toISOString());
        setRetryCount(0);
        
        return testResult;
      } catch (error) {
        setStatus('error');
        throw error;
      }
    },
    {
      ...CONNECTION_TEST_SWR_CONFIG,
      onError: (error) => {
        setStatus('error');
        console.error('Connection test failed:', error);
      },
    }
  );

  // Manual test connection function
  const testConnection = useCallback(async (testConfig?: DatabaseConnectionFormData): Promise<ConnectionTestResult> => {
    const configToTest = testConfig || config;
    
    if (!configToTest) {
      throw new Error('No configuration provided for testing');
    }

    setStatus('testing');
    setRetryCount(0);

    try {
      const response = await apiClient.post<ConnectionTestResult>('/system/service/_test', {
        config: configToTest,
      });

      if (!response.data && !response.resource) {
        throw new Error('Invalid response from server');
      }

      const testResult = response.data || response.resource;
      setStatus(testResult.success ? 'success' : 'error');
      setLastTested(new Date().toISOString());

      if (testResult.success) {
        addNotification({
          type: 'success',
          title: 'Connection Successful',
          message: 'Database connection test completed successfully.',
        });
      } else {
        addNotification({
          type: 'error',
          title: 'Connection Failed',
          message: testResult.message || 'Connection test failed.',
        });
      }

      // Update SWR cache
      mutate(testResult, false);

      return testResult;
    } catch (error) {
      setStatus('error');
      const errorMessage = error instanceof Error ? error.message : 'Connection test failed';
      
      addNotification({
        type: 'error',
        title: 'Connection Test Error',
        message: errorMessage,
      });

      throw error;
    }
  }, [config, addNotification, mutate]);

  // Retry test function
  const retryTest = useCallback(async (): Promise<ConnectionTestResult> => {
    const maxRetries = options?.maxRetries || 3;
    
    if (retryCount >= maxRetries) {
      throw new Error('Maximum retry attempts exceeded');
    }

    setRetryCount(prev => prev + 1);
    
    // Wait for retry delay
    if (options?.retryDelay) {
      await new Promise(resolve => setTimeout(resolve, options.retryDelay));
    }

    return testConnection();
  }, [retryCount, options?.maxRetries, options?.retryDelay, testConnection]);

  // Reset test function
  const resetTest = useCallback((): void => {
    setStatus('idle');
    setRetryCount(0);
    setLastTested(null);
    mutate(null, false);
  }, [mutate]);

  return {
    testConnection,
    result,
    status,
    isLoading,
    error: error as ApiErrorResponse | null,
    lastTested,
    retryCount,
    resetTest,
    retryTest,
  };
}

// =============================================================================
// PAYWALL ACCESS HOOK
// =============================================================================

/**
 * Paywall access hook for managing premium service access control
 * Integrates with licensing system and manages paywall modal state
 */
export function useServiceFormPaywall(
  serviceType?: DatabaseDriver
): UsePaywallAccessReturn {
  const paywall = usePaywall();
  const [modalState, setModalState] = useState<PaywallModalState>({
    isOpen: false,
    requiredTier: 'free',
    currentTier: 'free',
  });

  // Check feature access
  const checkFeatureAccess = useCallback((feature: string): PaywallFeatureAccess => {
    // This would integrate with the actual paywall service
    return {
      id: feature,
      name: feature,
      description: `Access to ${feature} feature`,
      requiredTier: 'premium',
      isAvailable: paywall.isFeatureAvailable(feature),
      reason: paywall.isFeatureAvailable(feature) ? undefined : 'Premium feature',
    };
  }, [paywall]);

  // Check service access
  const checkServiceAccess = useCallback((type: DatabaseDriver): boolean => {
    return paywall.checkServiceAccess(type);
  }, [paywall]);

  // Check if feature is available
  const isFeatureAvailable = useCallback((feature: string): boolean => {
    return paywall.isFeatureAvailable(feature);
  }, [paywall]);

  // Modal management
  const openPaywallModal = useCallback((config: Partial<PaywallModalState>): void => {
    setModalState(prev => ({
      ...prev,
      ...config,
      isOpen: true,
    }));
  }, []);

  const closePaywallModal = useCallback((): void => {
    setModalState(prev => ({
      ...prev,
      isOpen: false,
    }));
  }, []);

  // Tier management
  const currentTier = paywall.currentTier;

  const upgradeToTier = useCallback(async (tier: ServiceTierAccess): Promise<void> => {
    return paywall.upgradeToTier(tier);
  }, [paywall]);

  const startTrial = useCallback(async (type: DatabaseDriver): Promise<void> => {
    return paywall.startTrial(type);
  }, [paywall]);

  // Premium configuration
  const getPremiumConfig = useCallback((type: DatabaseDriver): PremiumServiceConfig | null => {
    return paywall.getPremiumConfig(type);
  }, [paywall]);

  const getUpgradeUrl = useCallback((tier: ServiceTierAccess): string => {
    return paywall.getUpgradeUrl(tier);
  }, [paywall]);

  const getContactSalesUrl = useCallback((type: DatabaseDriver): string => {
    return paywall.getContactSalesUrl(type);
  }, [paywall]);

  return {
    checkFeatureAccess,
    checkServiceAccess,
    isFeatureAvailable,
    modalState,
    openPaywallModal,
    closePaywallModal,
    currentTier,
    upgradeToTier,
    startTrial,
    getPremiumConfig,
    getUpgradeUrl,
    getContactSalesUrl,
  };
}

// =============================================================================
// SERVICE FORM SECURITY HOOK
// =============================================================================

/**
 * Security configuration hook for service access control and permissions
 * Manages security settings, role creation, and access control workflows
 */
export function useServiceFormSecurity(
  initialConfig?: ServiceSecurityConfig
) {
  const { addNotification } = useNotifications();
  const queryClient = useQueryClient();

  // Security configuration state
  const [securityConfig, setSecurityConfig] = useState<ServiceSecurityConfig>(
    initialConfig || {
      accessType: 'public',
      requireHttps: true,
      corsEnabled: false,
    }
  );

  // Role creation mutation
  const createRoleMutation = useMutation({
    mutationFn: async (roleData: any) => {
      const response = await apiClient.post('/system/role', roleData);
      return response.data || response.resource;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['roles'] });
      addNotification({
        type: 'success',
        title: 'Role Created',
        message: 'Security role has been created successfully.',
      });
    },
    onError: (error: Error) => {
      addNotification({
        type: 'error',
        title: 'Role Creation Failed',
        message: error.message || 'Failed to create security role.',
      });
    },
  });

  // Update security configuration
  const updateSecurityConfig = useCallback((updates: Partial<ServiceSecurityConfig>): void => {
    setSecurityConfig(prev => ({ ...prev, ...updates }));
  }, []);

  // Validate security configuration
  const validateSecurityConfig = useCallback((): string[] => {
    const errors: string[] = [];

    if (securityConfig.accessType === 'role-based' && (!securityConfig.roles || securityConfig.roles.length === 0)) {
      errors.push('At least one role must be specified for role-based access');
    }

    if (securityConfig.rateLimiting?.enabled && !securityConfig.rateLimiting.requestsPerMinute) {
      errors.push('Request limit must be specified when rate limiting is enabled');
    }

    if (securityConfig.corsEnabled && (!securityConfig.corsOrigins || securityConfig.corsOrigins.length === 0)) {
      errors.push('CORS origins must be specified when CORS is enabled');
    }

    return errors;
  }, [securityConfig]);

  // Create security role
  const createRole = useCallback(async (roleData: any): Promise<void> => {
    await createRoleMutation.mutateAsync(roleData);
  }, [createRoleMutation]);

  return {
    securityConfig,
    updateSecurityConfig,
    validateSecurityConfig,
    createRole,
    isCreatingRole: createRoleMutation.isPending,
  };
}

// =============================================================================
// SERVICE FORM SUBMISSION HOOK
// =============================================================================

/**
 * Form submission hook for handling validation, API integration, and optimistic updates
 * Provides comprehensive submission workflow with error handling and progress tracking
 */
export function useServiceFormSubmission(
  mode: ServiceFormMode,
  options?: {
    enableOptimisticUpdates?: boolean;
    redirectOnSuccess?: string;
    onSuccess?: (service: DatabaseService) => void;
    onError?: (error: Error) => void;
  }
) {
  const { addNotification } = useNotifications();
  const { setLoading } = useLoading();
  const router = useRouter();
  const queryClient = useQueryClient();

  const [submissionState, setSubmissionState] = useState<ServiceFormSubmissionState>('idle');

  // Main submission mutation
  const submissionMutation = useMutation({
    mutationFn: async (data: ServiceFormInput): Promise<DatabaseService> => {
      setSubmissionState('submitting');
      
      const endpoint = mode === 'create' 
        ? '/system/service'
        : `/system/service/${data.name}`;
      
      const method = mode === 'create' ? 'post' : 'patch';
      
      const response = await apiClient[method]<DatabaseService>(endpoint, data);
      
      if (!response.data && !response.resource) {
        throw new Error('Invalid response from server');
      }

      return response.data || response.resource;
    },
    onMutate: async (data: ServiceFormInput) => {
      if (options?.enableOptimisticUpdates && mode === 'create') {
        // Cancel outgoing queries
        await queryClient.cancelQueries({ queryKey: ServiceFormQueryKeys.services() });

        // Snapshot previous value
        const previousServices = queryClient.getQueryData(ServiceFormQueryKeys.services());

        // Optimistically update cache
        queryClient.setQueryData(ServiceFormQueryKeys.services(), (old: any) => {
          const optimisticService: DatabaseService = {
            id: Date.now(), // Temporary ID
            name: data.name,
            label: data.label || data.name,
            description: data.description || '',
            type: data.type,
            config: data.config,
            is_active: data.is_active ?? true,
            created_date: new Date().toISOString(),
            last_modified_date: new Date().toISOString(),
            // Add other required fields with defaults
          } as DatabaseService;

          return old ? [...old, optimisticService] : [optimisticService];
        });

        return { previousServices };
      }
    },
    onSuccess: (service: DatabaseService) => {
      setSubmissionState('success');
      
      // Invalidate and refetch queries
      queryClient.invalidateQueries({ queryKey: ServiceFormQueryKeys.services() });
      queryClient.invalidateQueries({ queryKey: ServiceFormQueryKeys.service(service.id) });

      addNotification({
        type: 'success',
        title: mode === 'create' ? 'Service Created' : 'Service Updated',
        message: `Database service "${service.label || service.name}" has been ${mode === 'create' ? 'created' : 'updated'} successfully.`,
      });

      // Handle navigation
      if (options?.redirectOnSuccess) {
        router.push(options.redirectOnSuccess);
      }

      // Call success callback
      if (options?.onSuccess) {
        options.onSuccess(service);
      }

      // Reset state after delay
      setTimeout(() => setSubmissionState('idle'), 2000);
    },
    onError: (error: Error, _variables, context) => {
      setSubmissionState('error');

      // Rollback optimistic update
      if (context?.previousServices) {
        queryClient.setQueryData(ServiceFormQueryKeys.services(), context.previousServices);
      }

      addNotification({
        type: 'error',
        title: mode === 'create' ? 'Service Creation Failed' : 'Service Update Failed',
        message: error.message || 'An unexpected error occurred.',
      });

      // Call error callback
      if (options?.onError) {
        options.onError(error);
      }

      // Reset state after delay
      setTimeout(() => setSubmissionState('idle'), 2000);
    },
    onSettled: () => {
      setLoading(false);
    },
  });

  // Submit function
  const submitForm = useCallback(async (data: ServiceFormInput): Promise<ServiceFormSubmissionResult> => {
    setLoading(true);
    
    try {
      const service = await submissionMutation.mutateAsync(data);
      
      return {
        success: true,
        service,
        redirectUrl: options?.redirectOnSuccess,
      };
    } catch (error) {
      return {
        success: false,
        errors: [{
          field: 'submit',
          message: error instanceof Error ? error.message : 'Submission failed',
          type: 'submit',
        }],
      };
    }
  }, [submissionMutation, setLoading, options?.redirectOnSuccess]);

  return {
    submitForm,
    submissionState,
    isSubmitting: submissionMutation.isPending,
    error: submissionMutation.error,
  };
}

// =============================================================================
// UTILITY FUNCTIONS
// =============================================================================

/**
 * Get default field configurations for a database type
 */
function getDefaultFieldConfigs(serviceType: DatabaseDriver): DynamicFieldConfig[] {
  const baseFields: DynamicFieldConfig[] = [
    {
      id: 'name',
      name: 'name',
      type: 'text',
      label: 'Service Name',
      required: true,
      placeholder: 'Enter unique service name',
      validation: {
        required: true,
        minLength: 1,
        maxLength: 64,
        pattern: '^[a-zA-Z][a-zA-Z0-9_-]*$',
      },
    },
    {
      id: 'label',
      name: 'label',
      type: 'text',
      label: 'Display Label',
      required: true,
      placeholder: 'Enter display label',
      validation: {
        required: true,
        maxLength: 255,
      },
    },
    {
      id: 'description',
      name: 'description',
      type: 'textarea',
      label: 'Description',
      placeholder: 'Enter service description (optional)',
      validation: {
        maxLength: 1024,
      },
    },
    {
      id: 'host',
      name: 'config.host',
      type: 'text',
      label: 'Host',
      required: true,
      placeholder: 'Enter database host',
      validation: {
        required: true,
        maxLength: 255,
      },
    },
    {
      id: 'port',
      name: 'config.port',
      type: 'number',
      label: 'Port',
      placeholder: 'Enter port number',
      validation: {
        min: 1,
        max: 65535,
      },
    },
    {
      id: 'database',
      name: 'config.database',
      type: 'text',
      label: 'Database Name',
      required: true,
      placeholder: 'Enter database name',
      validation: {
        required: true,
        maxLength: 64,
      },
    },
    {
      id: 'username',
      name: 'config.username',
      type: 'text',
      label: 'Username',
      required: true,
      placeholder: 'Enter username',
      validation: {
        required: true,
        maxLength: 64,
      },
    },
    {
      id: 'password',
      name: 'config.password',
      type: 'password',
      label: 'Password',
      required: true,
      placeholder: 'Enter password',
      validation: {
        required: true,
        maxLength: 255,
      },
    },
  ];

  // Add service-specific fields
  switch (serviceType) {
    case 'mysql':
      baseFields.push({
        id: 'charset',
        name: 'config.charset',
        type: 'select',
        label: 'Character Set',
        options: [
          { value: 'utf8', label: 'UTF-8' },
          { value: 'utf8mb4', label: 'UTF-8 MB4' },
          { value: 'latin1', label: 'Latin1' },
        ],
        defaultValue: 'utf8mb4',
      });
      break;
    
    case 'postgresql':
      baseFields.push({
        id: 'schema',
        name: 'config.schema',
        type: 'text',
        label: 'Schema',
        placeholder: 'public',
        defaultValue: 'public',
      });
      break;
    
    case 'mongodb':
      // Remove port validation for MongoDB (optional)
      const portField = baseFields.find(f => f.id === 'port');
      if (portField) {
        portField.required = false;
        portField.defaultValue = 27017;
      }
      break;
  }

  return baseFields;
}

/**
 * Evaluate a single condition for conditional logic
 */
function evaluateCondition(value: any, condition: any): boolean {
  const { operator, value: conditionValue } = condition;

  switch (operator) {
    case 'equals':
      return value === conditionValue;
    case 'notEquals':
      return value !== conditionValue;
    case 'contains':
      return typeof value === 'string' && value.includes(conditionValue);
    case 'notContains':
      return typeof value === 'string' && !value.includes(conditionValue);
    case 'isEmpty':
      return !value || (typeof value === 'string' && value.trim() === '');
    case 'isNotEmpty':
      return !!value && (typeof value !== 'string' || value.trim() !== '');
    case 'greaterThan':
      return typeof value === 'number' && value > conditionValue;
    case 'lessThan':
      return typeof value === 'number' && value < conditionValue;
    case 'oneOf':
      return Array.isArray(conditionValue) && conditionValue.includes(value);
    case 'noneOf':
      return Array.isArray(conditionValue) && !conditionValue.includes(value);
    default:
      return true;
  }
}

// =============================================================================
// EXPORTS
// =============================================================================

export {
  useServiceForm,
  useServiceFormWizard,
  useServiceFormFields,
  useServiceConnectionTest,
  useServiceFormPaywall,
  useServiceFormSecurity,
  useServiceFormSubmission,
  ServiceFormQueryKeys,
};

export type {
  UseServiceFormReturn,
  UseServiceFormWizardReturn,
  UseDynamicFieldsReturn,
  UseConnectionTestReturn,
  UsePaywallAccessReturn,
};