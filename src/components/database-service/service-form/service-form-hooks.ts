/**
 * Database Service Form Hooks
 * 
 * Custom React hooks for database service form management, wizard navigation, and data operations.
 * Implements React Hook Form integration with Zod validation, multi-step wizard state management,
 * dynamic schema-driven field generation, connection testing with SWR, and paywall access control.
 * Provides hooks for service creation, modification, and security configuration workflows.
 * 
 * @fileoverview Comprehensive hooks for database service form management
 * @version 1.0.0
 * @since 2024-01-01
 */

import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useForm, UseFormReturn, UseFormProps, FormState, FieldValues } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import useSWR, { mutate } from 'swr';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';

import type {
  DatabaseService,
  DatabaseConfig,
  ServiceType,
  ConfigSchema,
  DatabaseConnectionInput,
  ConnectionTestResult,
  ConnectionTestStatus,
  DatabaseDriver,
  ServiceTier,
  DatabaseConnectionSchema,
  ConnectionTestSchema,
  DatabaseServiceQueryKeys,
  ApiErrorResponse,
  GenericListResponse,
  DatabaseServiceCreateInput,
  DatabaseServiceUpdateInput,
} from '../types';

// =============================================================================
// HOOK CONFIGURATION TYPES
// =============================================================================

/**
 * Service form configuration interface
 */
export interface ServiceFormConfig {
  mode: 'create' | 'edit' | 'view';
  initialData?: DatabaseService | null;
  onSuccess?: (service: DatabaseService) => void;
  onError?: (error: ApiErrorResponse) => void;
  onCancel?: () => void;
  autoSave?: boolean;
  validationMode?: 'onSubmit' | 'onBlur' | 'onChange' | 'onTouched' | 'all';
  reValidateMode?: 'onSubmit' | 'onBlur' | 'onChange' | 'onTouched' | 'all';
}

/**
 * Wizard step configuration interface
 */
export interface WizardStepConfig {
  id: string;
  title: string;
  description?: string;
  fields: string[];
  validation?: z.ZodSchema;
  skipCondition?: (data: any) => boolean;
  optional?: boolean;
}

/**
 * Form field configuration interface for dynamic field generation
 */
export interface FormFieldConfig extends ConfigSchema {
  hidden?: boolean;
  readonly?: boolean;
  conditional?: {
    field: string;
    value: any;
    operator?: 'equals' | 'notEquals' | 'contains' | 'notContains';
  };
  groupId?: string;
  order?: number;
}

/**
 * Connection test configuration interface
 */
export interface ConnectionTestConfig {
  autoTest?: boolean;
  timeout?: number;
  retryCount?: number;
  retryDelay?: number;
  showDetails?: boolean;
  onSuccess?: (result: ConnectionTestResult) => void;
  onError?: (error: ApiErrorResponse) => void;
}

/**
 * Paywall configuration interface
 */
export interface PaywallConfig {
  tier: ServiceTier;
  requiredTier: ServiceTier;
  blockAccess?: boolean;
  showUpgrade?: boolean;
  onUpgrade?: () => void;
  customMessage?: string;
}

/**
 * Security configuration interface
 */
export interface SecurityConfig {
  enableRoleCreation?: boolean;
  enableAppCreation?: boolean;
  defaultRoles?: string[];
  defaultApps?: string[];
  customPermissions?: string[];
}

// =============================================================================
// MAIN SERVICE FORM HOOK
// =============================================================================

/**
 * Main service form hook with React Hook Form integration and Zod validation
 * Provides type-safe form handling with real-time validation under 100ms per integration requirements
 */
export function useServiceForm(config: ServiceFormConfig) {
  const {
    mode,
    initialData,
    onSuccess,
    onError,
    onCancel,
    autoSave = false,
    validationMode = 'onBlur',
    reValidateMode = 'onChange',
  } = config;

  // Form initialization with React Hook Form 7.52+
  const form = useForm<DatabaseConnectionInput>({
    resolver: zodResolver(DatabaseConnectionSchema),
    defaultValues: initialData ? {
      name: initialData.name,
      label: initialData.label,
      description: initialData.description || '',
      type: initialData.type,
      config: initialData.config,
      is_active: initialData.is_active,
    } : {
      name: '',
      label: '',
      description: '',
      type: 'mysql' as DatabaseDriver,
      config: {
        driver: 'mysql' as DatabaseDriver,
        host: '',
        port: 3306,
        database: '',
        username: '',
        password: '',
      },
      is_active: true,
    },
    mode: validationMode,
    reValidateMode,
    shouldFocusError: true,
    shouldUnregister: false,
  });

  const {
    register,
    handleSubmit,
    formState,
    control,
    watch,
    setValue,
    getValues,
    trigger,
    reset,
    clearErrors,
    setError,
  } = form;

  // Auto-save functionality
  const autoSaveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const watchedValues = watch();

  useEffect(() => {
    if (autoSave && mode === 'edit' && initialData) {
      if (autoSaveTimeoutRef.current) {
        clearTimeout(autoSaveTimeoutRef.current);
      }

      autoSaveTimeoutRef.current = setTimeout(() => {
        const currentValues = getValues();
        if (JSON.stringify(currentValues) !== JSON.stringify(initialData)) {
          handleAutoSave(currentValues);
        }
      }, 2000); // 2 second debounce
    }

    return () => {
      if (autoSaveTimeoutRef.current) {
        clearTimeout(autoSaveTimeoutRef.current);
      }
    };
  }, [watchedValues, autoSave, mode, initialData]);

  // Auto-save mutation
  const { mutate: autoSaveMutate } = useMutation({
    mutationFn: async (data: DatabaseConnectionInput) => {
      if (!initialData) return;
      // Auto-save API call would go here
      const response = await fetch(`/api/services/${initialData.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error('Auto-save failed');
      return response.json();
    },
    onError: () => {
      // Silent fail for auto-save
      console.warn('Auto-save failed');
    },
  });

  const handleAutoSave = useCallback(
    (data: DatabaseConnectionInput) => {
      autoSaveMutate(data);
    },
    [autoSaveMutate]
  );

  // Form validation with performance optimization
  const validateForm = useCallback(
    async (data?: DatabaseConnectionInput) => {
      const values = data || getValues();
      try {
        await DatabaseConnectionSchema.parseAsync(values);
        return true;
      } catch (error) {
        if (error instanceof z.ZodError) {
          error.errors.forEach((err) => {
            const path = err.path.join('.');
            setError(path as any, {
              type: 'validation',
              message: err.message,
            });
          });
        }
        return false;
      }
    },
    [getValues, setError]
  );

  // Form reset with type safety
  const resetForm = useCallback(
    (data?: DatabaseService | null) => {
      const resetData = data || initialData;
      if (resetData) {
        reset({
          name: resetData.name,
          label: resetData.label,
          description: resetData.description || '',
          type: resetData.type,
          config: resetData.config,
          is_active: resetData.is_active,
        });
      } else {
        reset();
      }
      clearErrors();
    },
    [reset, clearErrors, initialData]
  );

  // Field update with validation
  const updateField = useCallback(
    async (fieldName: string, value: any, validate = true) => {
      setValue(fieldName as any, value, {
        shouldValidate: validate,
        shouldDirty: true,
        shouldTouch: true,
      });

      if (validate) {
        await trigger(fieldName as any);
      }
    },
    [setValue, trigger]
  );

  // Get field value with type safety
  const getFieldValue = useCallback(
    (fieldName: string) => {
      return getValues(fieldName as any);
    },
    [getValues]
  );

  // Check if form has changes
  const hasChanges = useMemo(() => {
    if (!initialData) return formState.isDirty;
    
    const currentValues = getValues();
    return JSON.stringify(currentValues) !== JSON.stringify({
      name: initialData.name,
      label: initialData.label,
      description: initialData.description || '',
      type: initialData.type,
      config: initialData.config,
      is_active: initialData.is_active,
    });
  }, [formState.isDirty, getValues, initialData]);

  return {
    // Form instance
    form,
    
    // Form methods
    register,
    handleSubmit,
    control,
    formState,
    
    // Custom methods
    validateForm,
    resetForm,
    updateField,
    getFieldValue,
    
    // State
    hasChanges,
    isValid: formState.isValid,
    isSubmitting: formState.isSubmitting,
    errors: formState.errors,
    
    // Configuration
    mode,
    initialData,
    
    // Callbacks
    onSuccess,
    onError,
    onCancel,
  };
}

// =============================================================================
// WIZARD NAVIGATION HOOK
// =============================================================================

/**
 * Multi-step wizard navigation and state management hook
 * Manages wizard flow for database service creation workflow
 */
export function useServiceFormWizard(steps: WizardStepConfig[], form: UseFormReturn<DatabaseConnectionInput>) {
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [completedSteps, setCompletedSteps] = useState<Set<number>>(new Set());
  const [visitedSteps, setVisitedSteps] = useState<Set<number>>(new Set([0]));

  const currentStep = steps[currentStepIndex];
  const isFirstStep = currentStepIndex === 0;
  const isLastStep = currentStepIndex === steps.length - 1;

  // Get available steps (non-skipped)
  const availableSteps = useMemo(() => {
    const formData = form.getValues();
    return steps.filter((step, index) => {
      if (!step.skipCondition) return true;
      return !step.skipCondition(formData);
    });
  }, [steps, form]);

  // Validate current step
  const validateCurrentStep = useCallback(async () => {
    const stepFields = currentStep.fields;
    const isValid = await form.trigger(stepFields as any);
    
    if (isValid && currentStep.validation) {
      try {
        const formData = form.getValues();
        const stepData = stepFields.reduce((acc, field) => {
          acc[field] = formData[field as keyof DatabaseConnectionInput];
          return acc;
        }, {} as any);
        
        await currentStep.validation.parseAsync(stepData);
        return true;
      } catch (error) {
        if (error instanceof z.ZodError) {
          error.errors.forEach((err) => {
            const path = err.path.join('.');
            form.setError(path as any, {
              type: 'validation',
              message: err.message,
            });
          });
        }
        return false;
      }
    }
    
    return isValid;
  }, [currentStep, form]);

  // Navigate to next step
  const nextStep = useCallback(async () => {
    const isValid = await validateCurrentStep();
    
    if (isValid && !isLastStep) {
      const nextIndex = currentStepIndex + 1;
      setCurrentStepIndex(nextIndex);
      setCompletedSteps(prev => new Set([...prev, currentStepIndex]));
      setVisitedSteps(prev => new Set([...prev, nextIndex]));
    }
    
    return isValid;
  }, [validateCurrentStep, isLastStep, currentStepIndex]);

  // Navigate to previous step
  const previousStep = useCallback(() => {
    if (!isFirstStep) {
      setCurrentStepIndex(currentStepIndex - 1);
    }
  }, [isFirstStep, currentStepIndex]);

  // Navigate to specific step
  const goToStep = useCallback(async (stepIndex: number) => {
    if (stepIndex < 0 || stepIndex >= steps.length) return false;
    
    // If going forward, validate all steps in between
    if (stepIndex > currentStepIndex) {
      for (let i = currentStepIndex; i < stepIndex; i++) {
        setCurrentStepIndex(i);
        const isValid = await validateCurrentStep();
        if (!isValid && !steps[i].optional) {
          setCurrentStepIndex(currentStepIndex);
          return false;
        }
        setCompletedSteps(prev => new Set([...prev, i]));
      }
    }
    
    setCurrentStepIndex(stepIndex);
    setVisitedSteps(prev => new Set([...prev, stepIndex]));
    return true;
  }, [steps, currentStepIndex, validateCurrentStep]);

  // Check if step is accessible
  const isStepAccessible = useCallback((stepIndex: number) => {
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

  // Get step progress
  const getProgress = useCallback(() => {
    const requiredSteps = steps.filter(step => !step.optional).length;
    const completedRequiredSteps = Array.from(completedSteps).filter(
      index => !steps[index].optional
    ).length;
    
    return {
      current: currentStepIndex + 1,
      total: steps.length,
      completed: completedSteps.size,
      percentage: Math.round((completedRequiredSteps / requiredSteps) * 100),
    };
  }, [steps, currentStepIndex, completedSteps]);

  // Reset wizard
  const resetWizard = useCallback(() => {
    setCurrentStepIndex(0);
    setCompletedSteps(new Set());
    setVisitedSteps(new Set([0]));
  }, []);

  return {
    // Current state
    currentStep,
    currentStepIndex,
    availableSteps,
    
    // Navigation state
    isFirstStep,
    isLastStep,
    canGoNext: !isLastStep,
    canGoPrevious: !isFirstStep,
    
    // Step states
    completedSteps,
    visitedSteps,
    
    // Navigation methods
    nextStep,
    previousStep,
    goToStep,
    
    // Utility methods
    validateCurrentStep,
    isStepAccessible,
    getProgress,
    resetWizard,
  };
}

// =============================================================================
// DYNAMIC FORM FIELDS HOOK
// =============================================================================

/**
 * Dynamic form field generation hook based on service configuration schemas
 * Generates type-safe form fields from database service configuration schemas
 */
export function useServiceFormFields(
  serviceType: ServiceType | null,
  formValues: DatabaseConnectionInput,
  options: {
    grouping?: boolean;
    filtering?: boolean;
    conditionalLogic?: boolean;
  } = {}
) {
  const { grouping = true, filtering = true, conditionalLogic = true } = options;

  // Generate field configurations from service type schema
  const fieldConfigs = useMemo(() => {
    if (!serviceType?.configSchema) return [];

    return serviceType.configSchema.map((schema, index): FormFieldConfig => ({
      ...schema,
      order: index,
      groupId: grouping ? schema.name.split('.')[0] : undefined,
    }));
  }, [serviceType, grouping]);

  // Filter fields based on conditional logic
  const visibleFields = useMemo(() => {
    if (!conditionalLogic) return fieldConfigs;

    return fieldConfigs.filter((field) => {
      if (!field.conditional) return true;

      const { field: conditionField, value: conditionValue, operator = 'equals' } = field.conditional;
      const currentValue = formValues[conditionField as keyof DatabaseConnectionInput];

      switch (operator) {
        case 'equals':
          return currentValue === conditionValue;
        case 'notEquals':
          return currentValue !== conditionValue;
        case 'contains':
          return String(currentValue).includes(String(conditionValue));
        case 'notContains':
          return !String(currentValue).includes(String(conditionValue));
        default:
          return true;
      }
    });
  }, [fieldConfigs, formValues, conditionalLogic]);

  // Group fields by groupId
  const groupedFields = useMemo(() => {
    if (!grouping) return { default: visibleFields };

    return visibleFields.reduce((groups, field) => {
      const groupId = field.groupId || 'default';
      if (!groups[groupId]) {
        groups[groupId] = [];
      }
      groups[groupId].push(field);
      return groups;
    }, {} as Record<string, FormFieldConfig[]>);
  }, [visibleFields, grouping]);

  // Get field by name
  const getField = useCallback(
    (fieldName: string) => {
      return fieldConfigs.find(field => field.name === fieldName);
    },
    [fieldConfigs]
  );

  // Get fields by group
  const getFieldsByGroup = useCallback(
    (groupId: string) => {
      return groupedFields[groupId] || [];
    },
    [groupedFields]
  );

  // Get required fields
  const requiredFields = useMemo(() => {
    return visibleFields.filter(field => field.required);
  }, [visibleFields]);

  // Get optional fields
  const optionalFields = useMemo(() => {
    return visibleFields.filter(field => !field.required);
  }, [visibleFields]);

  // Get field default value
  const getFieldDefaultValue = useCallback(
    (field: FormFieldConfig) => {
      if (field.default !== undefined) return field.default;
      
      switch (field.type) {
        case 'string':
        case 'text':
        case 'password':
          return '';
        case 'integer':
          return 0;
        case 'boolean':
          return false;
        case 'array':
          return [];
        case 'object':
          return {};
        case 'picklist':
        case 'multi_picklist':
          return field.multiple ? [] : '';
        default:
          return null;
      }
    },
    []
  );

  // Generate Zod schema for dynamic validation
  const generateValidationSchema = useCallback(() => {
    const schemaObject: Record<string, z.ZodTypeAny> = {};

    visibleFields.forEach((field) => {
      let fieldSchema: z.ZodTypeAny;

      switch (field.type) {
        case 'string':
        case 'text':
        case 'password':
          fieldSchema = z.string();
          if (field.minLength) fieldSchema = (fieldSchema as z.ZodString).min(field.minLength);
          if (field.maxLength) fieldSchema = (fieldSchema as z.ZodString).max(field.maxLength);
          break;
        case 'integer':
          fieldSchema = z.number().int();
          if (field.min !== undefined) fieldSchema = (fieldSchema as z.ZodNumber).min(field.min);
          if (field.max !== undefined) fieldSchema = (fieldSchema as z.ZodNumber).max(field.max);
          break;
        case 'boolean':
          fieldSchema = z.boolean();
          break;
        case 'array':
          fieldSchema = z.array(z.any());
          break;
        case 'object':
          fieldSchema = z.object({});
          break;
        case 'picklist':
          if (field.values && field.values.length > 0) {
            fieldSchema = z.enum(field.values as [string, ...string[]]);
          } else {
            fieldSchema = z.string();
          }
          break;
        case 'multi_picklist':
          if (field.values && field.values.length > 0) {
            fieldSchema = z.array(z.enum(field.values as [string, ...string[]]));
          } else {
            fieldSchema = z.array(z.string());
          }
          break;
        default:
          fieldSchema = z.any();
      }

      if (!field.required) {
        fieldSchema = fieldSchema.optional();
      }

      schemaObject[field.name] = fieldSchema;
    });

    return z.object(schemaObject);
  }, [visibleFields]);

  return {
    // Field configurations
    fieldConfigs,
    visibleFields,
    groupedFields,
    
    // Field categories
    requiredFields,
    optionalFields,
    
    // Utility methods
    getField,
    getFieldsByGroup,
    getFieldDefaultValue,
    generateValidationSchema,
    
    // Metadata
    totalFields: fieldConfigs.length,
    visibleFieldsCount: visibleFields.length,
    groupsCount: Object.keys(groupedFields).length,
  };
}

// =============================================================================
// CONNECTION TEST HOOK
// =============================================================================

/**
 * Connection testing hook with SWR for real-time validation
 * Provides database connection testing with caching and performance optimization
 */
export function useServiceConnectionTest(
  config: DatabaseConfig | null,
  options: ConnectionTestConfig = {}
) {
  const {
    autoTest = false,
    timeout = 10000,
    retryCount = 2,
    retryDelay = 1000,
    showDetails = true,
    onSuccess,
    onError,
  } = options;

  const [isManualTesting, setIsManualTesting] = useState(false);
  const [lastTestedConfig, setLastTestedConfig] = useState<string | null>(null);

  // Generate cache key for SWR
  const cacheKey = useMemo(() => {
    if (!config) return null;
    const configString = JSON.stringify(config);
    return ['connection-test', configString];
  }, [config]);

  // SWR configuration for connection testing with intelligent caching
  const swrConfig = useMemo(() => ({
    revalidateOnFocus: false,
    revalidateOnReconnect: false,
    shouldRetryOnError: false,
    dedupingInterval: 5000, // 5 seconds deduplication
    refreshInterval: autoTest ? 30000 : 0, // Auto-refresh if enabled
    errorRetryCount: retryCount,
    errorRetryInterval: retryDelay,
    onSuccess: (data: ConnectionTestResult) => {
      setIsManualTesting(false);
      if (onSuccess) onSuccess(data);
    },
    onError: (error: ApiErrorResponse) => {
      setIsManualTesting(false);
      if (onError) onError(error);
    },
  }), [autoTest, retryCount, retryDelay, onSuccess, onError]);

  // Connection test fetcher function
  const connectionTestFetcher = useCallback(
    async ([, configString]: [string, string]) => {
      const testConfig = JSON.parse(configString) as DatabaseConfig;
      
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeout);

      try {
        const response = await fetch('/api/services/connection-test', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ config: testConfig }),
          signal: controller.signal,
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error?.message || 'Connection test failed');
        }

        const result: ConnectionTestResult = await response.json();
        setLastTestedConfig(configString);
        return result;
      } catch (error) {
        clearTimeout(timeoutId);
        if (error instanceof Error && error.name === 'AbortError') {
          throw new Error('Connection test timed out');
        }
        throw error;
      }
    },
    [timeout]
  );

  // Use SWR for connection testing with caching
  const {
    data: result,
    error,
    isLoading,
    mutate: revalidate,
  } = useSWR(
    cacheKey,
    connectionTestFetcher,
    swrConfig
  );

  // Manual connection test function
  const testConnection = useCallback(
    async (testConfig?: DatabaseConfig) => {
      const configToTest = testConfig || config;
      if (!configToTest) {
        throw new Error('No configuration provided for testing');
      }

      setIsManualTesting(true);
      const configString = JSON.stringify(configToTest);
      
      try {
        // Update cache key if different config
        if (configString !== lastTestedConfig) {
          setLastTestedConfig(configString);
          await mutate(['connection-test', configString], undefined, {
            revalidate: true,
          });
        } else {
          await revalidate();
        }
      } catch (error) {
        setIsManualTesting(false);
        throw error;
      }
    },
    [config, lastTestedConfig, revalidate]
  );

  // Get connection status
  const status: ConnectionTestStatus = useMemo(() => {
    if (isLoading || isManualTesting) return 'testing';
    if (error) return 'error';
    if (result?.success) return 'success';
    if (result && !result.success) return 'error';
    return 'idle';
  }, [isLoading, isManualTesting, error, result]);

  // Check if current config has been tested
  const hasBeenTested = useMemo(() => {
    if (!config) return false;
    const configString = JSON.stringify(config);
    return configString === lastTestedConfig;
  }, [config, lastTestedConfig]);

  // Clear test results
  const clearResults = useCallback(() => {
    setLastTestedConfig(null);
    setIsManualTesting(false);
    if (cacheKey) {
      mutate(cacheKey, undefined, { revalidate: false });
    }
  }, [cacheKey]);

  return {
    // Test results
    result,
    error,
    status,
    
    // State
    isLoading: isLoading || isManualTesting,
    isManualTesting,
    hasBeenTested,
    
    // Methods
    testConnection,
    clearResults,
    revalidate,
    
    // Configuration
    config,
    autoTest,
    showDetails,
  };
}

// =============================================================================
// PAYWALL ACCESS CONTROL HOOK
// =============================================================================

/**
 * Paywall access control hook for premium service management
 * Manages premium service access control and paywall state
 */
export function useServiceFormPaywall(
  serviceType: ServiceType | null,
  currentTier: ServiceTier = 'core'
) {
  const [showPaywall, setShowPaywall] = useState(false);
  const [paywallMessage, setPaywallMessage] = useState<string | null>(null);

  // Check if service requires upgrade
  const requiresUpgrade = useMemo(() => {
    if (!serviceType?.tier) return false;
    
    const tierLevels: Record<ServiceTier, number> = {
      core: 0,
      silver: 1,
      gold: 2,
    };
    
    return tierLevels[serviceType.tier] > tierLevels[currentTier];
  }, [serviceType, currentTier]);

  // Get required tier for service
  const requiredTier = useMemo(() => {
    return serviceType?.tier || 'core';
  }, [serviceType]);

  // Check access permission
  const hasAccess = useMemo(() => {
    return !requiresUpgrade;
  }, [requiresUpgrade]);

  // Show paywall modal
  const triggerPaywall = useCallback((customMessage?: string) => {
    setPaywallMessage(customMessage || `This ${serviceType?.name} service requires a ${requiredTier} tier subscription.`);
    setShowPaywall(true);
  }, [serviceType, requiredTier]);

  // Hide paywall modal
  const hidePaywall = useCallback(() => {
    setShowPaywall(false);
    setPaywallMessage(null);
  }, []);

  // Handle upgrade action
  const handleUpgrade = useCallback(() => {
    hidePaywall();
    // Navigate to upgrade page or trigger upgrade flow
    window.open('/upgrade', '_blank');
  }, [hidePaywall]);

  // Get tier display information
  const getTierInfo = useCallback((tier: ServiceTier) => {
    const tierInfo = {
      core: {
        name: 'Core',
        features: ['Basic database connections', 'Standard API generation'],
        color: 'gray',
      },
      silver: {
        name: 'Silver',
        features: ['Advanced databases', 'Enhanced security', 'Priority support'],
        color: 'blue',
      },
      gold: {
        name: 'Gold',
        features: ['Enterprise databases', 'Advanced analytics', '24/7 support'],
        color: 'yellow',
      },
    };
    
    return tierInfo[tier];
  }, []);

  // Get upgrade benefits
  const getUpgradeBenefits = useCallback(() => {
    if (!requiresUpgrade) return [];
    
    const benefits = [];
    const requiredTierInfo = getTierInfo(requiredTier);
    
    benefits.push(`Access to ${serviceType?.name} database service`);
    benefits.push(...requiredTierInfo.features);
    
    return benefits;
  }, [requiresUpgrade, requiredTier, serviceType, getTierInfo]);

  return {
    // Access state
    hasAccess,
    requiresUpgrade,
    requiredTier,
    currentTier,
    
    // Paywall state
    showPaywall,
    paywallMessage,
    
    // Methods
    triggerPaywall,
    hidePaywall,
    handleUpgrade,
    getTierInfo,
    getUpgradeBenefits,
    
    // Service info
    serviceType,
  };
}

// =============================================================================
// SECURITY CONFIGURATION HOOK
// =============================================================================

/**
 * Security configuration workflow hook
 * Manages security configuration including role and app creation
 */
export function useServiceFormSecurity(
  serviceData: DatabaseConnectionInput | null,
  config: SecurityConfig = {}
) {
  const {
    enableRoleCreation = true,
    enableAppCreation = true,
    defaultRoles = ['user', 'admin'],
    defaultApps = ['web', 'mobile'],
    customPermissions = [],
  } = config;

  const [selectedRoles, setSelectedRoles] = useState<string[]>(defaultRoles);
  const [selectedApps, setSelectedApps] = useState<string[]>(defaultApps);
  const [customRoles, setCustomRoles] = useState<string[]>([]);
  const [customApps, setCustomApps] = useState<string[]>([]);
  const [permissions, setPermissions] = useState<Record<string, string[]>>({});

  // Available permissions based on service type
  const availablePermissions = useMemo(() => {
    const basePermissions = [
      'GET',
      'POST',
      'PUT',
      'PATCH',
      'DELETE',
    ];
    
    return [...basePermissions, ...customPermissions];
  }, [customPermissions]);

  // Add custom role
  const addCustomRole = useCallback((roleName: string) => {
    if (!customRoles.includes(roleName)) {
      setCustomRoles(prev => [...prev, roleName]);
      setSelectedRoles(prev => [...prev, roleName]);
    }
  }, [customRoles]);

  // Remove custom role
  const removeCustomRole = useCallback((roleName: string) => {
    setCustomRoles(prev => prev.filter(role => role !== roleName));
    setSelectedRoles(prev => prev.filter(role => role !== roleName));
    setPermissions(prev => {
      const updated = { ...prev };
      delete updated[roleName];
      return updated;
    });
  }, []);

  // Add custom app
  const addCustomApp = useCallback((appName: string) => {
    if (!customApps.includes(appName)) {
      setCustomApps(prev => [...prev, appName]);
      setSelectedApps(prev => [...prev, appName]);
    }
  }, [customApps]);

  // Remove custom app
  const removeCustomApp = useCallback((appName: string) => {
    setCustomApps(prev => prev.filter(app => app !== appName));
    setSelectedApps(prev => prev.filter(app => app !== appName));
  }, []);

  // Update role permissions
  const updateRolePermissions = useCallback((roleName: string, rolePermissions: string[]) => {
    setPermissions(prev => ({
      ...prev,
      [roleName]: rolePermissions,
    }));
  }, []);

  // Toggle role selection
  const toggleRole = useCallback((roleName: string) => {
    setSelectedRoles(prev => 
      prev.includes(roleName)
        ? prev.filter(role => role !== roleName)
        : [...prev, roleName]
    );
  }, []);

  // Toggle app selection
  const toggleApp = useCallback((appName: string) => {
    setSelectedApps(prev => 
      prev.includes(appName)
        ? prev.filter(app => app !== appName)
        : [...prev, appName]
    );
  }, []);

  // Generate security configuration
  const generateSecurityConfig = useCallback(() => {
    return {
      roles: selectedRoles.map(role => ({
        name: role,
        permissions: permissions[role] || [],
        isCustom: customRoles.includes(role),
      })),
      apps: selectedApps.map(app => ({
        name: app,
        isCustom: customApps.includes(app),
      })),
      serviceAccess: serviceData ? {
        serviceName: serviceData.name,
        endpoints: availablePermissions,
      } : null,
    };
  }, [selectedRoles, selectedApps, permissions, customRoles, customApps, serviceData, availablePermissions]);

  // Validate security configuration
  const validateSecurityConfig = useCallback(() => {
    const errors: string[] = [];
    
    if (selectedRoles.length === 0) {
      errors.push('At least one role must be selected');
    }
    
    if (selectedApps.length === 0) {
      errors.push('At least one app must be selected');
    }
    
    selectedRoles.forEach(role => {
      if (!permissions[role] || permissions[role].length === 0) {
        errors.push(`Role "${role}" must have at least one permission`);
      }
    });
    
    return {
      isValid: errors.length === 0,
      errors,
    };
  }, [selectedRoles, selectedApps, permissions]);

  // Reset security configuration
  const resetSecurityConfig = useCallback(() => {
    setSelectedRoles(defaultRoles);
    setSelectedApps(defaultApps);
    setCustomRoles([]);
    setCustomApps([]);
    setPermissions({});
  }, [defaultRoles, defaultApps]);

  return {
    // Role management
    selectedRoles,
    customRoles,
    addCustomRole,
    removeCustomRole,
    toggleRole,
    
    // App management
    selectedApps,
    customApps,
    addCustomApp,
    removeCustomApp,
    toggleApp,
    
    // Permissions
    permissions,
    availablePermissions,
    updateRolePermissions,
    
    // Configuration
    generateSecurityConfig,
    validateSecurityConfig,
    resetSecurityConfig,
    
    // Settings
    enableRoleCreation,
    enableAppCreation,
    serviceData,
  };
}

// =============================================================================
// FORM SUBMISSION HOOK
// =============================================================================

/**
 * Form submission hook with React Query integration
 * Handles form submission, validation, and API integration with optimistic updates
 */
export function useServiceFormSubmission(
  mode: 'create' | 'edit',
  serviceId?: number
) {
  const router = useRouter();
  const queryClient = useQueryClient();

  // Create service mutation
  const createServiceMutation = useMutation({
    mutationFn: async (data: DatabaseConnectionInput): Promise<DatabaseService> => {
      const response = await fetch('/api/services', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error?.message || 'Failed to create service');
      }

      return response.json();
    },
    onMutate: async (newService) => {
      // Cancel outgoing queries
      await queryClient.cancelQueries({ queryKey: DatabaseServiceQueryKeys.lists() });

      // Snapshot previous value
      const previousServices = queryClient.getQueryData(DatabaseServiceQueryKeys.lists());

      // Optimistically update
      queryClient.setQueryData(DatabaseServiceQueryKeys.lists(), (old: DatabaseService[] = []) => [
        ...old,
        {
          ...newService,
          id: Date.now(), // Temporary ID
          created_date: new Date().toISOString(),
          last_modified_date: new Date().toISOString(),
          created_by_id: null,
          last_modified_by_id: null,
          mutable: true,
          deletable: true,
        } as DatabaseService,
      ]);

      return { previousServices };
    },
    onError: (error, newService, context) => {
      // Rollback optimistic update
      if (context?.previousServices) {
        queryClient.setQueryData(DatabaseServiceQueryKeys.lists(), context.previousServices);
      }
    },
    onSuccess: (data) => {
      // Invalidate and refetch
      queryClient.invalidateQueries({ queryKey: DatabaseServiceQueryKeys.lists() });
      queryClient.setQueryData(DatabaseServiceQueryKeys.detail(data.id), data);
    },
  });

  // Update service mutation
  const updateServiceMutation = useMutation({
    mutationFn: async (data: DatabaseConnectionInput): Promise<DatabaseService> => {
      if (!serviceId) throw new Error('Service ID is required for updates');

      const response = await fetch(`/api/services/${serviceId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error?.message || 'Failed to update service');
      }

      return response.json();
    },
    onMutate: async (updatedService) => {
      if (!serviceId) return;

      // Cancel outgoing queries
      await queryClient.cancelQueries({ queryKey: DatabaseServiceQueryKeys.detail(serviceId) });
      await queryClient.cancelQueries({ queryKey: DatabaseServiceQueryKeys.lists() });

      // Snapshot previous values
      const previousService = queryClient.getQueryData(DatabaseServiceQueryKeys.detail(serviceId));
      const previousServices = queryClient.getQueryData(DatabaseServiceQueryKeys.lists());

      // Optimistically update single service
      queryClient.setQueryData(DatabaseServiceQueryKeys.detail(serviceId), (old: DatabaseService) => ({
        ...old,
        ...updatedService,
        last_modified_date: new Date().toISOString(),
      }));

      // Optimistically update service list
      queryClient.setQueryData(DatabaseServiceQueryKeys.lists(), (old: DatabaseService[] = []) =>
        old.map(service =>
          service.id === serviceId
            ? { ...service, ...updatedService, last_modified_date: new Date().toISOString() }
            : service
        )
      );

      return { previousService, previousServices };
    },
    onError: (error, updatedService, context) => {
      if (!serviceId) return;

      // Rollback optimistic updates
      if (context?.previousService) {
        queryClient.setQueryData(DatabaseServiceQueryKeys.detail(serviceId), context.previousService);
      }
      if (context?.previousServices) {
        queryClient.setQueryData(DatabaseServiceQueryKeys.lists(), context.previousServices);
      }
    },
    onSuccess: (data) => {
      // Invalidate and refetch
      queryClient.invalidateQueries({ queryKey: DatabaseServiceQueryKeys.lists() });
      queryClient.setQueryData(DatabaseServiceQueryKeys.detail(data.id), data);
    },
  });

  // Submit form with appropriate mutation
  const submitForm = useCallback(
    async (data: DatabaseConnectionInput, options?: {
      onSuccess?: (service: DatabaseService) => void;
      onError?: (error: Error) => void;
      redirect?: boolean;
    }) => {
      try {
        let result: DatabaseService;

        if (mode === 'create') {
          result = await createServiceMutation.mutateAsync(data);
        } else {
          result = await updateServiceMutation.mutateAsync(data);
        }

        // Handle success callback
        if (options?.onSuccess) {
          options.onSuccess(result);
        }

        // Handle redirect
        if (options?.redirect !== false) {
          router.push(`/api-connections/database/${result.name}`);
        }

        return result;
      } catch (error) {
        // Handle error callback
        if (options?.onError && error instanceof Error) {
          options.onError(error);
        }
        throw error;
      }
    },
    [mode, createServiceMutation, updateServiceMutation, router]
  );

  // Get submission state
  const isSubmitting = createServiceMutation.isPending || updateServiceMutation.isPending;
  const error = createServiceMutation.error || updateServiceMutation.error;

  return {
    // Submission methods
    submitForm,
    
    // Mutation objects
    createServiceMutation,
    updateServiceMutation,
    
    // State
    isSubmitting,
    error,
    
    // Configuration
    mode,
    serviceId,
  };
}

// =============================================================================
// EXPORTS
// =============================================================================

export type {
  ServiceFormConfig,
  WizardStepConfig,
  FormFieldConfig,
  ConnectionTestConfig,
  PaywallConfig,
  SecurityConfig,
};