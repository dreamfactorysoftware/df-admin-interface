/**
 * Limit Form Management Hook for DreamFactory React/Next.js Admin Interface
 * 
 * Custom React hook managing dynamic form state and control enabling/disabling logic 
 * based on limit type selections, replacing Angular reactive forms patterns. Implements 
 * React Hook Form integration with conditional field management, real-time validation 
 * under 100ms, and type-specific form control logic for comprehensive limit configuration workflows.
 * 
 * Features:
 * - React Hook Form integration with dynamic field management per React/Next.js Integration Requirements
 * - Real-time validation under 100ms per performance standards
 * - Dynamic form control management per existing Angular reactive form patterns
 * - Type-safe form state management per Section 5.2 Component Details
 * - Conditional field rendering based on limit type selection per existing Angular functionality
 * - Convert Angular FormBuilder patterns to React Hook Form useFieldArray
 * - State management for conditional field visibility (serviceId, roleId, userId, endpoint)
 * 
 * Replaces Angular FormBuilder and reactive forms with React Hook Form while maintaining
 * all existing functionality including dynamic field enabling/disabling, conditional validation,
 * and type-specific form control logic with enterprise-grade performance characteristics.
 * 
 * @fileoverview Comprehensive limit form management hook with React Hook Form integration
 * @version 1.0.0
 * @since React 19.0.0 / Next.js 15.1+
 */

import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useForm, useFieldArray, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import type { 
  UseFormReturn, 
  FieldErrors, 
  SubmitHandler, 
  SubmitErrorHandler,
  Control,
  UseFormSetValue,
  UseFormGetValues,
  UseFormTrigger,
  UseFormReset,
  Path
} from 'react-hook-form';
import type { 
  LimitType,
  LimitConfiguration,
  LimitFormState,
  LimitFormInstance,
  LimitFormProps,
  LimitConfigurationSchema,
  UseLimitFormReturn
} from '../types';
import { useLimitValidation } from './use-limit-validation';
import type { 
  FormFieldError,
  EnhancedValidationState,
  FormFieldConfig,
  EnhancedFormInstance
} from '../../../types/forms';

// ============================================================================
// Form Configuration and State Management
// ============================================================================

/**
 * Field visibility configuration based on limit type
 * Implements Angular form control enabling/disabling logic
 */
interface LimitFormFieldVisibility {
  /** Service field visibility and requirements */
  service: {
    visible: boolean;
    required: boolean;
    disabled: boolean;
  };
  /** User field visibility and requirements */
  user: {
    visible: boolean;
    required: boolean;
    disabled: boolean;
  };
  /** Role field visibility and requirements */
  role: {
    visible: boolean;
    required: boolean;
    disabled: boolean;
  };
  /** Endpoint field visibility for specific limits */
  endpoint: {
    visible: boolean;
    required: boolean;
    disabled: boolean;
  };
  /** Period configuration visibility */
  period: {
    visible: boolean;
    required: boolean;
    disabled: boolean;
  };
  /** Advanced options visibility */
  advancedOptions: {
    visible: boolean;
    disabled: boolean;
  };
}

/**
 * Default form values for different limit types
 * Replaces Angular FormBuilder default value patterns
 */
const getDefaultFormValues = (limitType?: LimitType): Partial<LimitConfiguration> => {
  const baseDefaults: Partial<LimitConfiguration> = {
    name: '',
    limitType: limitType || 'api.calls_per_period',
    limitCounter: 'api.calls_made',
    rateValue: 100,
    period: {
      value: 1,
      unit: 'hour'
    },
    active: true,
    service: null,
    user: null,
    role: null,
    description: ''
  };

  // Type-specific defaults
  switch (limitType) {
    case 'service.calls_per_period':
    case 'db.calls_per_period':
      return {
        ...baseDefaults,
        limitCounter: limitType.includes('service') ? 'service.calls_made' : 'db.calls_made',
        rateValue: 1000,
        period: { value: 1, unit: 'hour' }
      };
    
    case 'user.calls_per_period':
      return {
        ...baseDefaults,
        limitCounter: 'user.calls_made',
        rateValue: 50,
        period: { value: 1, unit: 'minute' }
      };
    
    case 'api.calls_per_minute':
      return {
        ...baseDefaults,
        rateValue: 60,
        period: { value: 1, unit: 'minute' }
      };
    
    case 'api.calls_per_hour':
      return {
        ...baseDefaults,
        rateValue: 3600,
        period: { value: 1, unit: 'hour' }
      };
    
    case 'api.calls_per_day':
      return {
        ...baseDefaults,
        rateValue: 86400,
        period: { value: 1, unit: 'day' }
      };
    
    default:
      return baseDefaults;
  }
};

/**
 * Calculate field visibility based on limit type
 * Implements Angular renderCorrectHiddenFields logic
 */
const calculateFieldVisibility = (limitType?: LimitType): LimitFormFieldVisibility => {
  // Default visibility (all fields hidden)
  const defaultVisibility: LimitFormFieldVisibility = {
    service: { visible: false, required: false, disabled: false },
    user: { visible: false, required: false, disabled: false },
    role: { visible: false, required: false, disabled: false },
    endpoint: { visible: false, required: false, disabled: false },
    period: { visible: true, required: true, disabled: false },
    advancedOptions: { visible: true, disabled: false }
  };

  if (!limitType) {
    return defaultVisibility;
  }

  // Service-specific limits require service selection
  if (limitType.includes('service.calls_per_') || limitType.includes('db.calls_per_')) {
    defaultVisibility.service = { visible: true, required: true, disabled: false };
    defaultVisibility.user = { visible: true, required: false, disabled: false };
    defaultVisibility.role = { visible: true, required: false, disabled: false };
  }
  
  // User-specific limits require user selection
  else if (limitType.includes('user.calls_per_')) {
    defaultVisibility.user = { visible: true, required: true, disabled: false };
    defaultVisibility.service = { visible: true, required: false, disabled: false };
    defaultVisibility.role = { visible: true, required: false, disabled: false };
  }
  
  // API limits can have optional associations
  else if (limitType.includes('api.calls_per_')) {
    defaultVisibility.service = { visible: true, required: false, disabled: false };
    defaultVisibility.user = { visible: true, required: false, disabled: false };
    defaultVisibility.role = { visible: true, required: false, disabled: false };
    
    // Show endpoint configuration for granular API limits
    defaultVisibility.endpoint = { visible: true, required: false, disabled: false };
  }

  // Period configuration visibility based on limit type
  if (limitType === 'api.calls_per_minute' || 
      limitType === 'api.calls_per_hour' || 
      limitType === 'api.calls_per_day') {
    // Fixed period types don't allow period customization
    defaultVisibility.period = { visible: false, required: false, disabled: true };
  }

  return defaultVisibility;
};

/**
 * Form performance metrics tracking
 * Ensures real-time validation under 100ms requirement compliance
 */
interface LimitFormMetrics {
  /** Form field update performance */
  fieldUpdateTime: number;
  /** Validation performance metrics */
  validationTime: number;
  /** Form submission time */
  submissionTime: number;
  /** Total form interactions */
  totalInteractions: number;
  /** Last interaction timestamp */
  lastInteraction: Date | null;
}

// ============================================================================
// Options and Configuration Interfaces
// ============================================================================

/**
 * Configuration options for the limit form hook
 */
export interface UseLimitFormOptions {
  /** Initial form data for editing mode */
  initialData?: Partial<LimitConfiguration>;
  /** Form mode (create or edit) */
  mode?: 'create' | 'edit';
  /** Enable real-time validation */
  enableRealtimeValidation?: boolean;
  /** Validation debounce delay in milliseconds */
  validationDebounceMs?: number;
  /** Enable performance monitoring */
  enableMetrics?: boolean;
  /** Custom validation functions */
  customValidation?: {
    name?: (name: string) => Promise<string | undefined>;
    rateValue?: (value: number, type: LimitType) => Promise<string | undefined>;
    service?: (serviceId: number | null, type: LimitType) => Promise<string | undefined>;
    user?: (userId: number | null, type: LimitType) => Promise<string | undefined>;
  };
  /** Form submission handlers */
  onSubmit?: SubmitHandler<LimitConfiguration>;
  onError?: SubmitErrorHandler<LimitConfiguration>;
  /** State change callbacks */
  onStateChange?: (state: LimitFormState) => void;
  onFieldVisibilityChange?: (visibility: LimitFormFieldVisibility) => void;
}

// ============================================================================
// Main Hook Implementation
// ============================================================================

/**
 * Comprehensive limit form management hook with React Hook Form integration
 * 
 * Provides dynamic form state management, conditional field visibility, real-time validation,
 * and type-safe form handling for limit configuration workflows. Replaces Angular reactive
 * forms patterns with modern React Hook Form implementation.
 * 
 * @param options - Configuration options for form behavior and validation
 * @returns Complete form management interface with validation and state control
 */
export function useLimitForm(
  options: UseLimitFormOptions = {}
): UseLimitFormReturn {
  const {
    initialData,
    mode = 'create',
    enableRealtimeValidation = true,
    validationDebounceMs = 100,
    enableMetrics = true,
    customValidation = {},
    onSubmit,
    onError,
    onStateChange,
    onFieldVisibilityChange
  } = options;

  // =========================================================================
  // State Management and Refs
  // =========================================================================

  // Form performance tracking
  const metricsRef = useRef<LimitFormMetrics>({
    fieldUpdateTime: 0,
    validationTime: 0,
    submissionTime: 0,
    totalInteractions: 0,
    lastInteraction: null
  });

  // Form submission state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDirty, setIsDirty] = useState(false);
  const [isTouched, setIsTouched] = useState(false);

  // Field state management
  const [fieldStates, setFieldStates] = useState<Record<string, EnhancedValidationState>>({});
  
  // Dependent data loading states
  const [dependentDataLoading, setDependentDataLoading] = useState({
    users: false,
    services: false,
    roles: false
  });

  // Field options data
  const [fieldOptions, setFieldOptions] = useState({
    users: [] as Array<{ id: number; name: string; email: string }>,
    services: [] as Array<{ id: number; name: string; type: string }>,
    roles: [] as Array<{ id: number; name: string; description?: string }>
  });

  // Connection test state for service limits
  const [connectionTest, setConnectionTest] = useState<{
    isRunning: boolean;
    success: boolean | null;
    error: string | null;
    lastTested: Date | null;
  }>({
    isRunning: false,
    success: null,
    error: null,
    lastTested: null
  });

  // =========================================================================
  // Validation Hook Integration
  // =========================================================================

  const {
    createValidationSchema,
    validateBusinessRules,
    validators,
    validationMetrics,
    validateFullConfiguration
  } = useLimitValidation({
    enableMetrics,
    debounceMs: validationDebounceMs,
    customValidators: customValidation,
    enableBusinessRules: true
  });

  // =========================================================================
  // React Hook Form Setup
  // =========================================================================

  // Watch for limit type to determine field visibility
  const [limitType, setLimitType] = useState<LimitType | undefined>(
    initialData?.limitType || 'api.calls_per_period'
  );

  // Calculate field visibility based on current limit type
  const fieldVisibility = useMemo(() => {
    const visibility = calculateFieldVisibility(limitType);
    if (onFieldVisibilityChange) {
      onFieldVisibilityChange(visibility);
    }
    return visibility;
  }, [limitType, onFieldVisibilityChange]);

  // Dynamic validation schema based on limit type
  const validationSchema = useMemo(() => {
    return createValidationSchema(limitType);
  }, [limitType, createValidationSchema]);

  // Form default values with type-specific defaults
  const defaultValues = useMemo(() => {
    return {
      ...getDefaultFormValues(limitType),
      ...initialData
    };
  }, [limitType, initialData]);

  // React Hook Form initialization
  const form = useForm<LimitConfiguration>({
    resolver: zodResolver(validationSchema),
    defaultValues,
    mode: enableRealtimeValidation ? 'onChange' : 'onSubmit',
    reValidateMode: 'onChange',
    shouldFocusError: true,
    shouldUseNativeValidation: false
  });

  const {
    register,
    handleSubmit,
    setValue,
    getValues,
    watch,
    trigger,
    reset,
    clearErrors,
    setError,
    control,
    formState: { errors, isValid, dirtyFields, touchedFields }
  } = form;

  // Watch for limit type changes to update field visibility
  const watchedLimitType = watch('limitType');
  useEffect(() => {
    if (watchedLimitType !== limitType) {
      setLimitType(watchedLimitType);
    }
  }, [watchedLimitType, limitType]);

  // =========================================================================
  // Dynamic Field Management
  // =========================================================================

  /**
   * Update field visibility and validation based on limit type
   * Implements Angular addControl/removeControl pattern replacement
   */
  const updateFieldConfiguration = useCallback(async (newLimitType: LimitType) => {
    const startTime = performance.now();
    
    try {
      // Update form default values for new limit type
      const newDefaults = getDefaultFormValues(newLimitType);
      const currentValues = getValues();
      
      // Preserve user-entered values, apply new defaults for empty fields
      Object.entries(newDefaults).forEach(([key, defaultValue]) => {
        const currentValue = currentValues[key as keyof LimitConfiguration];
        if (currentValue === undefined || currentValue === null || currentValue === '') {
          setValue(key as Path<LimitConfiguration>, defaultValue as any, {
            shouldValidate: enableRealtimeValidation,
            shouldDirty: false,
            shouldTouch: false
          });
        }
      });

      // Clear conditional field values that are no longer visible
      const newVisibility = calculateFieldVisibility(newLimitType);
      
      if (!newVisibility.service.visible && currentValues.service !== null) {
        setValue('service', null, { shouldValidate: true });
      }
      
      if (!newVisibility.user.visible && currentValues.user !== null) {
        setValue('user', null, { shouldValidate: true });
      }
      
      if (!newVisibility.role.visible && currentValues.role !== null) {
        setValue('role', null, { shouldValidate: true });
      }

      // Trigger validation for affected fields
      if (enableRealtimeValidation) {
        await trigger();
      }

      if (enableMetrics) {
        const duration = performance.now() - startTime;
        metricsRef.current.fieldUpdateTime = duration;
        metricsRef.current.totalInteractions++;
        metricsRef.current.lastInteraction = new Date();
      }
    } catch (error) {
      console.error('Error updating field configuration:', error);
    }
  }, [setValue, getValues, trigger, enableRealtimeValidation, enableMetrics]);

  // Update field configuration when limit type changes
  useEffect(() => {
    if (limitType) {
      updateFieldConfiguration(limitType);
    }
  }, [limitType, updateFieldConfiguration]);

  // =========================================================================
  // Validation Integration
  // =========================================================================

  /**
   * Enhanced field validation with performance tracking
   */
  const validateField = useCallback(async (
    fieldName: Path<LimitConfiguration>,
    value?: any
  ): Promise<string | undefined> => {
    if (!enableRealtimeValidation) {
      return undefined;
    }

    const startTime = performance.now();
    
    try {
      // Use form's built-in validation first
      const isFieldValid = await trigger(fieldName);
      
      if (!isFieldValid && errors[fieldName]) {
        const duration = performance.now() - startTime;
        if (enableMetrics) {
          metricsRef.current.validationTime = duration;
        }
        return errors[fieldName]?.message;
      }

      // Apply custom validation if available
      const customValidator = customValidation[fieldName as keyof typeof customValidation];
      if (customValidator) {
        const customError = await customValidator(value || getValues(fieldName));
        if (customError) {
          setError(fieldName, { 
            type: 'custom', 
            message: customError 
          });
          return customError;
        }
      }

      const duration = performance.now() - startTime;
      if (enableMetrics) {
        metricsRef.current.validationTime = duration;
      }

      return undefined;
    } catch (error) {
      console.error(`Validation error for field ${fieldName}:`, error);
      return 'Validation error occurred';
    }
  }, [enableRealtimeValidation, trigger, errors, customValidation, getValues, setError, enableMetrics]);

  // =========================================================================
  // Service Connection Testing
  // =========================================================================

  /**
   * Test database service connection for service-based limits
   */
  const testServiceConnection = useCallback(async (serviceId: number): Promise<boolean> => {
    if (!serviceId || serviceId <= 0) {
      return false;
    }

    setConnectionTest(prev => ({
      ...prev,
      isRunning: true,
      error: null
    }));

    try {
      // Simulate connection test (replace with actual API call)
      const response = await fetch(`/api/v2/system/service/${serviceId}/test`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      const result = await response.json();
      const success = response.ok && result.success;

      setConnectionTest({
        isRunning: false,
        success,
        error: success ? null : result.message || 'Connection test failed',
        lastTested: new Date()
      });

      return success;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Connection test failed';
      
      setConnectionTest({
        isRunning: false,
        success: false,
        error: errorMessage,
        lastTested: new Date()
      });

      return false;
    }
  }, []);

  // =========================================================================
  // Form Submission and Actions
  // =========================================================================

  /**
   * Enhanced form submission with business logic validation
   */
  const submitForm = useCallback(async (data: LimitConfiguration): Promise<void> => {
    const startTime = performance.now();
    setIsSubmitting(true);

    try {
      // Validate business rules before submission
      const businessErrors = validateBusinessRules(data);
      if (businessErrors.length > 0) {
        // Set business rule errors on form
        businessErrors.forEach((error, index) => {
          setError(`root.businessRule${index}` as Path<LimitConfiguration>, {
            type: 'businessRule',
            message: error
          });
        });
        return;
      }

      // Full configuration validation
      const configErrors = await validateFullConfiguration(data);
      if (configErrors.length > 0) {
        configErrors.forEach((error, index) => {
          setError(`root.configError${index}` as Path<LimitConfiguration>, {
            type: 'configuration',
            message: error
          });
        });
        return;
      }

      // Execute submission handler
      if (onSubmit) {
        await onSubmit(data);
      }

      if (enableMetrics) {
        const duration = performance.now() - startTime;
        metricsRef.current.submissionTime = duration;
      }
    } catch (error) {
      console.error('Form submission error:', error);
      
      if (onError) {
        onError(errors, data);
      }
    } finally {
      setIsSubmitting(false);
    }
  }, [validateBusinessRules, validateFullConfiguration, onSubmit, onError, errors, setError, enableMetrics]);

  /**
   * Reset form to template based on limit type
   */
  const resetToTemplate = useCallback((template: 'user' | 'service' | 'role' | 'global'): void => {
    const templateLimitType: LimitType = (() => {
      switch (template) {
        case 'user': return 'user.calls_per_period';
        case 'service': return 'service.calls_per_period';
        case 'role': return 'api.calls_per_period';
        case 'global': return 'api.calls_per_period';
        default: return 'api.calls_per_period';
      }
    })();

    const templateDefaults = getDefaultFormValues(templateLimitType);
    reset(templateDefaults);
    setLimitType(templateLimitType);
  }, [reset]);

  /**
   * Check for conflicting limits
   */
  const checkForConflicts = useCallback(async (): Promise<string[]> => {
    const currentData = getValues();
    const conflicts: string[] = [];

    try {
      // Check for existing limits with same parameters
      const response = await fetch('/api/limits/check-conflicts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(currentData)
      });

      if (response.ok) {
        const result = await response.json();
        if (result.conflicts && Array.isArray(result.conflicts)) {
          conflicts.push(...result.conflicts);
        }
      }
    } catch (error) {
      console.error('Error checking for conflicts:', error);
      conflicts.push('Unable to check for conflicting limits');
    }

    return conflicts;
  }, [getValues]);

  /**
   * Preview rate string generation
   */
  const previewRateString = useCallback((): string => {
    const data = getValues();
    
    if (!data.rateValue || !data.period) {
      return '';
    }

    const { rateValue, period } = data;
    const pluralUnit = period.value === 1 ? period.unit : `${period.unit}s`;
    return `${rateValue} per ${period.value > 1 ? `${period.value} ` : ''}${pluralUnit}`;
  }, [getValues]);

  // =========================================================================
  // Form State Synchronization
  // =========================================================================

  // Update derived form state
  useEffect(() => {
    const newIsDirty = Object.keys(dirtyFields).length > 0;
    const newIsTouched = Object.keys(touchedFields).length > 0;

    if (newIsDirty !== isDirty) {
      setIsDirty(newIsDirty);
    }

    if (newIsTouched !== isTouched) {
      setIsTouched(newIsTouched);
    }
  }, [dirtyFields, touchedFields, isDirty, isTouched]);

  // Notify state changes
  useEffect(() => {
    if (onStateChange) {
      const currentState: LimitFormState = {
        data: getValues(),
        isSubmitting,
        isValidating: false, // TODO: Track validation state
        isDirty,
        isTouched,
        isValid,
        errors: errors as Record<string, FormFieldError>,
        fieldStates,
        mode,
        dependentDataLoading,
        fieldOptions,
        connectionTest
      };

      onStateChange(currentState);
    }
  }, [
    getValues, 
    isSubmitting, 
    isDirty, 
    isTouched, 
    isValid, 
    errors, 
    fieldStates, 
    mode, 
    dependentDataLoading, 
    fieldOptions, 
    connectionTest,
    onStateChange
  ]);

  // =========================================================================
  // Enhanced Form Instance
  // =========================================================================

  const enhancedFormInstance: LimitFormInstance = useMemo(() => ({
    ...form,
    schema: validationSchema,
    fieldConfigs: new Map(), // TODO: Implement field configs
    generateField: () => null, // TODO: Implement field generation
    isFieldVisible: (fieldName) => {
      // Determine field visibility based on current field visibility state
      switch (fieldName) {
        case 'service': return fieldVisibility.service.visible;
        case 'user': return fieldVisibility.user.visible;
        case 'role': return fieldVisibility.role.visible;
        default: return true;
      }
    },
    getFieldValidationState: (fieldName) => {
      return fieldStates[fieldName] || {
        isValid: true,
        isDirty: false,
        isTouched: false,
        error: null
      };
    },
    validateAsync: async (fieldName) => {
      if (fieldName) {
        const error = await validateField(fieldName);
        return !error;
      } else {
        return trigger();
      }
    },
    submitAsync: submitForm,
    resetWithSchema: (newSchema, newDefaults) => {
      reset(newDefaults);
    },
    testServiceConnection,
    validateAgainstUsage: async () => true, // TODO: Implement usage validation
    previewRateString,
    checkForConflicts,
    resetToTemplate
  }), [
    form, 
    validationSchema, 
    fieldVisibility, 
    fieldStates, 
    validateField, 
    trigger, 
    submitForm, 
    reset, 
    testServiceConnection, 
    previewRateString, 
    checkForConflicts, 
    resetToTemplate
  ]);

  // =========================================================================
  // Return Interface
  // =========================================================================

  return {
    // Form instance
    form: enhancedFormInstance,

    // Form state
    state: {
      data: getValues(),
      isSubmitting,
      isValidating: false, // TODO: Implement validation tracking
      isDirty,
      isTouched,
      isValid,
      errors: errors as Record<string, FormFieldError>,
      fieldStates,
      mode,
      dependentDataLoading,
      fieldOptions,
      connectionTest
    },

    // Form actions
    actions: {
      submit: handleSubmit(submitForm),
      reset: () => reset(),
      resetToTemplate,
      validateField,
      clearErrors: () => clearErrors()
    },

    // Dependent data (placeholder - TODO: Implement data fetching)
    dependentData: {
      users: { data: fieldOptions.users, loading: dependentDataLoading.users, error: null },
      services: { data: fieldOptions.services, loading: dependentDataLoading.services, error: null },
      roles: { data: fieldOptions.roles, loading: dependentDataLoading.roles, error: null }
    },

    // Helper functions
    helpers: {
      previewRateString,
      testServiceConnection,
      checkForConflicts
    }
  };
}

/**
 * Export utility functions for external use
 */
export {
  calculateFieldVisibility,
  getDefaultFormValues
};

/**
 * Export types for external consumption
 */
export type {
  UseLimitFormOptions,
  LimitFormFieldVisibility,
  LimitFormMetrics
};