/**
 * Dynamic Limit Form Hook for React/Next.js Admin Interface
 * 
 * Provides comprehensive form state management with React Hook Form integration, dynamic field
 * control based on limit type selections, real-time validation under 100ms, and type-safe 
 * form handling that replaces Angular reactive forms patterns.
 * 
 * Features:
 * - React Hook Form with dynamic field management per React/Next.js Integration Requirements
 * - Real-time validation under 100ms per performance specifications
 * - Conditional field rendering based on limit type selection (serviceId, roleId, userId, endpoint)
 * - Type-safe form state management with comprehensive error handling
 * - Form control enabling/disabling logic replacing Angular FormBuilder patterns
 * - Dynamic form field management replacing Angular FormGroup.addControl/removeControl
 * - State management for conditional field visibility per existing Angular functionality
 * 
 * Replaces Angular reactive forms with modern React patterns while maintaining
 * all existing functionality and business logic requirements.
 * 
 * @author DreamFactory Admin Interface Team
 * @version React 19/Next.js 15.1 Migration
 * @since 2024-12-19
 */

import { useCallback, useMemo, useEffect, useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'

// Form and validation dependencies
import { 
  UseFormReturn, 
  FieldPath, 
  PathValue,
  useWatch
} from 'react-hook-form'

// Type imports from dependency files
import {
  LimitType,
  LimitCounter,
  CreateLimitFormData,
  EditLimitFormData,
  LimitTableRowData,
  CreateLimitFormState,
  EditLimitFormState,
  UseLimitFormReturn,
  ValidationPerformanceMetrics
} from '../types'

// Validation hook import
import useLimitValidation from './use-limit-validation'

// Form utilities and types
import {
  FormConfig,
  RealtimeValidationConfig,
  FormPerformanceConfig,
  FormAccessibilityConfig,
  FieldErrors
} from '@/types/forms'

// =============================================================================
// HOOK CONFIGURATION TYPES
// =============================================================================

/**
 * Configuration options for useLimitForm hook
 * 
 * Provides comprehensive configuration for form behavior, validation,
 * and integration with business logic requirements.
 */
interface UseLimitFormConfig {
  /** Form mode - create or edit */
  mode: 'create' | 'edit'
  /** Initial form data for editing existing limits */
  initialData?: Partial<LimitTableRowData>
  /** Enable real-time validation (default: true) */
  enableRealtimeValidation?: boolean
  /** Custom validation configuration */
  validationConfig?: Partial<RealtimeValidationConfig>
  /** Performance optimization settings */
  performanceConfig?: Partial<FormPerformanceConfig>
  /** Accessibility configuration */
  accessibilityConfig?: Partial<FormAccessibilityConfig>
  /** Form submission handler */
  onSubmit?: (data: CreateLimitFormData | EditLimitFormData) => Promise<void>
  /** Form submission success handler */
  onSuccess?: (data: CreateLimitFormData | EditLimitFormData) => void
  /** Form submission error handler */
  onError?: (error: any) => void
  /** Form cancellation handler */
  onCancel?: () => void
  /** Auto-save configuration */
  autoSave?: AutoSaveConfig
  /** Debug mode for development */
  debugMode?: boolean
}

/**
 * Auto-save configuration for form persistence
 */
interface AutoSaveConfig {
  /** Enable auto-save functionality */
  enabled: boolean
  /** Auto-save interval in milliseconds */
  intervalMs: number
  /** Storage key for persistence */
  storageKey: string
  /** Storage type */
  storageType: 'localStorage' | 'sessionStorage'
}

/**
 * Dynamic form field configuration based on limit type
 * 
 * Defines which fields should be visible, required, disabled, or hidden
 * based on the current limit type selection.
 */
interface DynamicFieldConfig {
  /** Fields that are visible for this limit type */
  visibleFields: Set<string>
  /** Fields that are required for this limit type */
  requiredFields: Set<string>
  /** Fields that are disabled for this limit type */
  disabledFields: Set<string>
  /** Fields that should be cleared when this limit type is selected */
  fieldsToReset: Set<string>
  /** Field default values for this limit type */
  defaultValues: Partial<CreateLimitFormData | EditLimitFormData>
}

/**
 * Form field visibility state management
 * 
 * Tracks the visibility and state of conditional fields based on
 * limit type selection and business logic requirements.
 */
interface FieldVisibilityState {
  /** Service field visibility and configuration */
  service: {
    visible: boolean
    required: boolean
    disabled: boolean
  }
  /** Role field visibility and configuration */
  role: {
    visible: boolean
    required: boolean
    disabled: boolean
  }
  /** User field visibility and configuration */
  user: {
    visible: boolean
    required: boolean
    disabled: boolean
  }
  /** Endpoint field visibility and configuration */
  endpoint: {
    visible: boolean
    required: boolean
    disabled: boolean
  }
  /** Active field configuration */
  active: {
    visible: boolean
    disabled: boolean
  }
  /** Metadata field configuration */
  metadata: {
    visible: boolean
    disabled: boolean
  }
}

/**
 * Form submission state management
 * 
 * Tracks form submission progress, errors, and success states
 * for comprehensive user feedback and error handling.
 */
interface FormSubmissionState {
  /** Form submission in progress */
  isSubmitting: boolean
  /** Submission attempt count */
  submitCount: number
  /** Last submission error */
  lastError: any | null
  /** Submission success timestamp */
  lastSuccessTime: Date | null
  /** Form has been successfully submitted */
  hasBeenSubmitted: boolean
  /** Submission performance metrics */
  submissionMetrics: SubmissionMetrics
}

/**
 * Submission performance metrics
 */
interface SubmissionMetrics {
  /** Average submission time in milliseconds */
  averageSubmissionTime: number
  /** Last submission time */
  lastSubmissionTime: number
  /** Failed submission count */
  failedSubmissionCount: number
  /** Total submission attempts */
  totalSubmissionAttempts: number
}

// =============================================================================
// FIELD CONFIGURATION UTILITIES
// =============================================================================

/**
 * Gets dynamic field configuration based on limit type
 * 
 * Implements the business logic for field visibility, requirements,
 * and state management based on limit type selection.
 */
const getDynamicFieldConfig = (limitType: LimitType): DynamicFieldConfig => {
  // Base configuration with common fields always visible
  const baseFields = new Set(['name', 'limitType', 'limitRate', 'limitCounter', 'active'])
  const baseRequired = new Set(['name', 'limitType', 'limitRate', 'limitCounter'])

  // Type-specific configurations mapping Angular reactive form patterns
  const typeConfigurations: Record<LimitType, Partial<DynamicFieldConfig>> = {
    [LimitType.USER]: {
      visibleFields: new Set([...baseFields, 'user', 'endpoint', 'metadata']),
      requiredFields: new Set([...baseRequired, 'user']),
      disabledFields: new Set(),
      fieldsToReset: new Set(['service', 'role']),
      defaultValues: {
        service: null,
        role: null,
        active: true
      }
    },
    [LimitType.SERVICE]: {
      visibleFields: new Set([...baseFields, 'service', 'endpoint', 'metadata']),
      requiredFields: new Set([...baseRequired, 'service']),
      disabledFields: new Set(),
      fieldsToReset: new Set(['user', 'role']),
      defaultValues: {
        user: null,
        role: null,
        active: true
      }
    },
    [LimitType.ROLE]: {
      visibleFields: new Set([...baseFields, 'role', 'endpoint', 'metadata']),
      requiredFields: new Set([...baseRequired, 'role']),
      disabledFields: new Set(),
      fieldsToReset: new Set(['user', 'service']),
      defaultValues: {
        user: null,
        service: null,
        active: true
      }
    },
    [LimitType.ENDPOINT]: {
      visibleFields: new Set([...baseFields, 'endpoint', 'service', 'role', 'user', 'metadata']),
      requiredFields: new Set([...baseRequired, 'endpoint']),
      disabledFields: new Set(),
      fieldsToReset: new Set(),
      defaultValues: {
        active: true
      }
    },
    [LimitType.GLOBAL]: {
      visibleFields: new Set([...baseFields, 'metadata']),
      requiredFields: baseRequired,
      disabledFields: new Set(['user', 'service', 'role', 'endpoint']),
      fieldsToReset: new Set(['user', 'service', 'role', 'endpoint']),
      defaultValues: {
        user: null,
        service: null,
        role: null,
        endpoint: '',
        active: true
      }
    },
    [LimitType.IP]: {
      visibleFields: new Set([...baseFields, 'metadata']),
      requiredFields: baseRequired,
      disabledFields: new Set(['user', 'service', 'role', 'endpoint']),
      fieldsToReset: new Set(['user', 'service', 'role', 'endpoint']),
      defaultValues: {
        user: null,
        service: null,
        role: null,
        endpoint: '',
        active: true
      }
    },
    [LimitType.CUSTOM]: {
      visibleFields: new Set([...baseFields, 'user', 'service', 'role', 'endpoint', 'metadata']),
      requiredFields: baseRequired,
      disabledFields: new Set(),
      fieldsToReset: new Set(),
      defaultValues: {
        active: true
      }
    }
  }

  const config = typeConfigurations[limitType]
  
  return {
    visibleFields: config?.visibleFields || baseFields,
    requiredFields: config?.requiredFields || baseRequired,
    disabledFields: config?.disabledFields || new Set(),
    fieldsToReset: config?.fieldsToReset || new Set(),
    defaultValues: config?.defaultValues || { active: true }
  }
}

/**
 * Calculates field visibility state based on limit type and business rules
 * 
 * Implements conditional field rendering logic that replaces Angular
 * form control enabling/disabling patterns.
 */
const calculateFieldVisibilityState = (
  limitType: LimitType,
  fieldConfig: DynamicFieldConfig
): FieldVisibilityState => {
  return {
    service: {
      visible: fieldConfig.visibleFields.has('service'),
      required: fieldConfig.requiredFields.has('service'),
      disabled: fieldConfig.disabledFields.has('service')
    },
    role: {
      visible: fieldConfig.visibleFields.has('role'),
      required: fieldConfig.requiredFields.has('role'),
      disabled: fieldConfig.disabledFields.has('role')
    },
    user: {
      visible: fieldConfig.visibleFields.has('user'),
      required: fieldConfig.requiredFields.has('user'),
      disabled: fieldConfig.disabledFields.has('user')
    },
    endpoint: {
      visible: fieldConfig.visibleFields.has('endpoint'),
      required: fieldConfig.requiredFields.has('endpoint'),
      disabled: fieldConfig.disabledFields.has('endpoint')
    },
    active: {
      visible: fieldConfig.visibleFields.has('active'),
      disabled: fieldConfig.disabledFields.has('active')
    },
    metadata: {
      visible: fieldConfig.visibleFields.has('metadata'),
      disabled: fieldConfig.disabledFields.has('metadata')
    }
  }
}

// =============================================================================
// PERFORMANCE MONITORING UTILITIES
// =============================================================================

/**
 * Creates initial performance metrics tracking state
 */
const createInitialMetrics = (): ValidationPerformanceMetrics => ({
  averageValidationTime: 0,
  maxValidationTime: 0,
  validationCount: 0,
  slowValidationCount: 0,
  realtimeComplianceRate: 100,
  lastValidationTime: new Date()
})

/**
 * Creates initial submission state
 */
const createInitialSubmissionState = (): FormSubmissionState => ({
  isSubmitting: false,
  submitCount: 0,
  lastError: null,
  lastSuccessTime: null,
  hasBeenSubmitted: false,
  submissionMetrics: {
    averageSubmissionTime: 0,
    lastSubmissionTime: 0,
    failedSubmissionCount: 0,
    totalSubmissionAttempts: 0
  }
})

// =============================================================================
// AUTO-SAVE IMPLEMENTATION
// =============================================================================

/**
 * Auto-save hook for form persistence
 * 
 * Provides automatic form data persistence to prevent data loss
 * during form completion with configurable intervals and storage.
 */
const useAutoSave = <T extends CreateLimitFormData | EditLimitFormData>(
  config: AutoSaveConfig,
  formValues: T,
  isValid: boolean
) => {
  const timeoutRef = useRef<NodeJS.Timeout>()

  const saveToStorage = useCallback((data: T) => {
    if (!config.enabled || !isValid) return

    try {
      const storage = config.storageType === 'localStorage' 
        ? localStorage 
        : sessionStorage
      
      storage.setItem(config.storageKey, JSON.stringify({
        data,
        timestamp: Date.now(),
        version: '1.0.0'
      }))
    } catch (error) {
      console.warn('Auto-save failed:', error)
    }
  }, [config, isValid])

  const loadFromStorage = useCallback((): T | null => {
    if (!config.enabled) return null

    try {
      const storage = config.storageType === 'localStorage' 
        ? localStorage 
        : sessionStorage
      
      const saved = storage.getItem(config.storageKey)
      if (!saved) return null

      const parsed = JSON.parse(saved)
      // Check if saved data is not too old (24 hours)
      if (Date.now() - parsed.timestamp > 24 * 60 * 60 * 1000) {
        storage.removeItem(config.storageKey)
        return null
      }

      return parsed.data
    } catch (error) {
      console.warn('Auto-load failed:', error)
      return null
    }
  }, [config])

  const clearStorage = useCallback(() => {
    if (!config.enabled) return

    try {
      const storage = config.storageType === 'localStorage' 
        ? localStorage 
        : sessionStorage
      
      storage.removeItem(config.storageKey)
    } catch (error) {
      console.warn('Auto-save clear failed:', error)
    }
  }, [config])

  // Auto-save effect
  useEffect(() => {
    if (!config.enabled) return

    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
    }

    timeoutRef.current = setTimeout(() => {
      saveToStorage(formValues)
    }, config.intervalMs)

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
    }
  }, [formValues, config.intervalMs, saveToStorage])

  return {
    loadFromStorage,
    clearStorage,
    saveToStorage
  }
}

// =============================================================================
// MAIN HOOK IMPLEMENTATION
// =============================================================================

/**
 * Comprehensive limit form hook with dynamic field management
 * 
 * Provides complete form state management replacing Angular reactive forms
 * with React Hook Form integration, dynamic field control, real-time validation,
 * and type-safe form handling for limit configuration workflows.
 */
export function useLimitForm<T extends CreateLimitFormData | EditLimitFormData>(
  config: UseLimitFormConfig
): UseLimitFormReturn<T> {
  const {
    mode,
    initialData,
    enableRealtimeValidation = true,
    validationConfig = {
      enabled: true,
      debounceMs: 50,
      mode: 'onChange',
      reValidateMode: 'onChange',
      showValidationIndicators: true
    },
    performanceConfig = {
      uncontrolled: true,
      optimizeForLargeForms: false,
      fieldLevelSubscription: true,
      lazyValidation: false
    },
    accessibilityConfig = {
      screenReaderSupport: true,
      announceValidationErrors: true,
      keyboardNavigation: true,
      ariaLiveRegion: 'polite',
      focusManagement: {
        focusFirstError: true,
        focusNextOnSuccess: false,
        focusConditionalFields: true
      }
    },
    onSubmit,
    onSuccess,
    onError,
    onCancel,
    autoSave = {
      enabled: false,
      intervalMs: 30000,
      storageKey: `limit-form-${mode}`,
      storageType: 'sessionStorage'
    },
    debugMode = false
  } = config

  const router = useRouter()

  // Performance tracking state
  const [submissionState, setSubmissionState] = useState<FormSubmissionState>(
    createInitialSubmissionState
  )

  // Form validation and state management using validation hook
  const {
    form,
    validationSchema,
    values,
    errors,
    isValidating,
    isValid,
    isDirty,
    validateField,
    validateForm,
    getFieldError,
    clearFieldError,
    resetForm,
    metrics: validationMetrics,
    context: validationContext,
    updateContext
  } = useLimitValidation<T>({
    mode,
    initialData,
    realtimeConfig: validationConfig,
    performanceConfig: {
      trackPerformance: true,
      targetTime: 100,
      warningThreshold: 80,
      maxValidationTime: 200,
      enableCaching: true,
      cacheTtl: 5000
    },
    debugMode
  })

  // Watch form values for dynamic field management
  const watchedLimitType = useWatch({
    control: form.control,
    name: 'limitType' as any
  }) as LimitType

  // Auto-save functionality
  const { loadFromStorage, clearStorage, saveToStorage } = useAutoSave(
    autoSave,
    values,
    isValid
  )

  // Calculate dynamic field configuration based on limit type
  const fieldConfig = useMemo(() => {
    const limitType = watchedLimitType || LimitType.ENDPOINT
    return getDynamicFieldConfig(limitType)
  }, [watchedLimitType])

  // Calculate field visibility state
  const fieldVisibility = useMemo(() => {
    const limitType = watchedLimitType || LimitType.ENDPOINT
    return calculateFieldVisibilityState(limitType, fieldConfig)
  }, [watchedLimitType, fieldConfig])

  // Handle limit type change with field management
  const handleLimitTypeChange = useCallback((newLimitType: LimitType) => {
    const startTime = performance.now()

    try {
      // Get new field configuration
      const newFieldConfig = getDynamicFieldConfig(newLimitType)
      
      // Reset fields that should be cleared for the new type
      newFieldConfig.fieldsToReset.forEach(fieldName => {
        form.setValue(fieldName as any, null, { 
          shouldValidate: true,
          shouldDirty: true,
          shouldTouch: true
        })
      })

      // Apply default values for the new type
      Object.entries(newFieldConfig.defaultValues).forEach(([fieldName, value]) => {
        if (fieldName !== 'limitType') {
          form.setValue(fieldName as any, value, {
            shouldValidate: false,
            shouldDirty: false,
            shouldTouch: false
          })
        }
      })

      // Update validation context with new limit type
      updateContext({
        limitType: newLimitType,
        currentValues: { ...values, limitType: newLimitType }
      })

      // Clear errors for fields that are no longer visible
      Object.keys(errors).forEach(fieldName => {
        if (!newFieldConfig.visibleFields.has(fieldName)) {
          clearFieldError(fieldName as any)
        }
      })

      // Performance tracking
      const changeTime = performance.now() - startTime
      if (debugMode) {
        console.log(`Limit type change completed in ${changeTime}ms`)
      }

      // Show user feedback for successful type change
      if (changeTime < 100) {
        toast.success(`Limit type changed to ${newLimitType}`, {
          duration: 2000,
          position: 'top-right'
        })
      }

    } catch (error) {
      console.error('Error handling limit type change:', error)
      toast.error('Failed to update form fields', {
        duration: 3000,
        position: 'top-right'
      })
    }
  }, [form, values, errors, updateContext, clearFieldError, debugMode])

  // Watch for limit type changes
  useEffect(() => {
    if (watchedLimitType && watchedLimitType !== validationContext.limitType) {
      handleLimitTypeChange(watchedLimitType)
    }
  }, [watchedLimitType, validationContext.limitType, handleLimitTypeChange])

  // Form submission handler with comprehensive error handling
  const handleSubmit = useCallback(async (data: T) => {
    const submissionStartTime = performance.now()
    
    setSubmissionState(prev => ({
      ...prev,
      isSubmitting: true,
      submitCount: prev.submitCount + 1,
      lastError: null
    }))

    try {
      // Pre-submission validation
      const isFormValid = await validateForm()
      if (!isFormValid) {
        throw new Error('Form validation failed')
      }

      // Call external submission handler if provided
      if (onSubmit) {
        await onSubmit(data)
      }

      // Track successful submission
      const submissionTime = performance.now() - submissionStartTime
      
      setSubmissionState(prev => ({
        ...prev,
        isSubmitting: false,
        lastSuccessTime: new Date(),
        hasBeenSubmitted: true,
        submissionMetrics: {
          ...prev.submissionMetrics,
          averageSubmissionTime: prev.submissionMetrics.totalSubmissionAttempts === 0
            ? submissionTime
            : (prev.submissionMetrics.averageSubmissionTime * prev.submissionMetrics.totalSubmissionAttempts + submissionTime) 
              / (prev.submissionMetrics.totalSubmissionAttempts + 1),
          lastSubmissionTime: submissionTime,
          totalSubmissionAttempts: prev.submissionMetrics.totalSubmissionAttempts + 1
        }
      }))

      // Clear auto-saved data on successful submission
      clearStorage()

      // Call success handler
      if (onSuccess) {
        onSuccess(data)
      }

      // Show success notification
      toast.success(
        mode === 'create' ? 'Limit created successfully' : 'Limit updated successfully',
        {
          duration: 3000,
          position: 'top-right'
        }
      )

      // Performance logging
      if (debugMode) {
        console.log(`Form submission completed in ${submissionTime}ms`)
      }

    } catch (error) {
      // Track failed submission
      const submissionTime = performance.now() - submissionStartTime
      
      setSubmissionState(prev => ({
        ...prev,
        isSubmitting: false,
        lastError: error,
        submissionMetrics: {
          ...prev.submissionMetrics,
          failedSubmissionCount: prev.submissionMetrics.failedSubmissionCount + 1,
          totalSubmissionAttempts: prev.submissionMetrics.totalSubmissionAttempts + 1,
          lastSubmissionTime: submissionTime
        }
      }))

      // Call error handler
      if (onError) {
        onError(error)
      } else {
        // Default error handling
        console.error('Form submission error:', error)
        toast.error(
          error instanceof Error ? error.message : 'Failed to save limit configuration',
          {
            duration: 5000,
            position: 'top-right'
          }
        )
      }
    }
  }, [
    validateForm,
    onSubmit,
    onSuccess,
    onError,
    clearStorage,
    mode,
    debugMode
  ])

  // Form cancellation handler
  const handleCancel = useCallback(() => {
    // Clear auto-saved data
    clearStorage()
    
    // Reset form to initial state
    resetForm()
    
    // Call external cancel handler
    if (onCancel) {
      onCancel()
    } else {
      // Default cancellation behavior - navigate back
      router.back()
    }

    toast.info('Form cancelled', {
      duration: 2000,
      position: 'top-right'
    })
  }, [clearStorage, resetForm, onCancel, router])

  // Enhanced field value setter with validation and state management
  const setFieldValue = useCallback(<K extends keyof T>(
    fieldName: K,
    value: T[K],
    options: {
      shouldValidate?: boolean
      shouldDirty?: boolean
      shouldTouch?: boolean
    } = {}
  ) => {
    const {
      shouldValidate = true,
      shouldDirty = true,
      shouldTouch = true
    } = options

    form.setValue(fieldName as any, value, {
      shouldValidate,
      shouldDirty,
      shouldTouch
    })

    // Special handling for limit type changes
    if (fieldName === 'limitType' && value !== watchedLimitType) {
      handleLimitTypeChange(value as LimitType)
    }
  }, [form, watchedLimitType, handleLimitTypeChange])

  // Check if field is visible based on current configuration
  const isFieldVisible = useCallback((fieldName: keyof T): boolean => {
    const fieldNameStr = String(fieldName)
    return fieldConfig.visibleFields.has(fieldNameStr)
  }, [fieldConfig])

  // Check if field is required based on current configuration
  const isFieldRequired = useCallback((fieldName: keyof T): boolean => {
    const fieldNameStr = String(fieldName)
    return fieldConfig.requiredFields.has(fieldNameStr)
  }, [fieldConfig])

  // Check if field is disabled based on current configuration
  const isFieldDisabled = useCallback((fieldName: keyof T): boolean => {
    const fieldNameStr = String(fieldName)
    return fieldConfig.disabledFields.has(fieldNameStr)
  }, [fieldConfig])

  // Load auto-saved data on mount
  useEffect(() => {
    if (autoSave.enabled && mode === 'create' && !initialData) {
      const savedData = loadFromStorage()
      if (savedData) {
        Object.entries(savedData).forEach(([fieldName, value]) => {
          form.setValue(fieldName as any, value, {
            shouldValidate: false,
            shouldDirty: false,
            shouldTouch: false
          })
        })
        
        toast.info('Restored previously saved form data', {
          duration: 3000,
          position: 'top-right'
        })
      }
    }
  }, [autoSave.enabled, mode, initialData, loadFromStorage, form])

  // Performance monitoring and warnings
  useEffect(() => {
    const { realtimeComplianceRate, averageValidationTime } = validationMetrics
    
    if (realtimeComplianceRate < 90 && validationMetrics.validationCount > 10) {
      console.warn(
        `Validation performance below target: ${realtimeComplianceRate}% compliance, ` +
        `average time: ${averageValidationTime}ms`
      )
    }
  }, [validationMetrics])

  // Return comprehensive form state and methods
  return {
    // Core form instance and state
    form,
    validationSchema,
    values,
    errors,
    
    // Form state indicators
    isSubmitting: submissionState.isSubmitting,
    isValidating,
    isValid,
    isDirty,
    
    // Form interaction methods
    handleSubmit: form.handleSubmit(handleSubmit),
    handleReset: resetForm,
    handleCancel,
    
    // Field management methods
    setFieldValue,
    getFieldError,
    clearFieldError,
    validateField,
    
    // Dynamic field state queries
    isFieldVisible,
    isFieldRequired,
    isFieldDisabled,
    
    // Field visibility configuration
    fieldVisibility,
    
    // Current form configuration
    fieldConfig,
    
    // Performance metrics
    validationMetrics,
    
    // Submission state
    submissionState,
    
    // Auto-save methods
    autoSave: {
      save: () => saveToStorage(values),
      load: loadFromStorage,
      clear: clearStorage
    }
  } as UseLimitFormReturn<T>
}

// =============================================================================
// CONVENIENCE HOOKS FOR SPECIFIC MODES
// =============================================================================

/**
 * Convenience hook for creating new limits
 * 
 * Pre-configured for create mode with optimized defaults
 * and streamlined API for limit creation workflows.
 */
export function useCreateLimitForm(
  config: Omit<UseLimitFormConfig, 'mode' | 'initialData'> & {
    initialData?: Partial<CreateLimitFormData>
  }
) {
  return useLimitForm<CreateLimitFormData>({
    ...config,
    mode: 'create',
    initialData: config.initialData || {
      limitType: LimitType.ENDPOINT,
      limitCounter: LimitCounter.REQUEST,
      active: true
    }
  })
}

/**
 * Convenience hook for editing existing limits
 * 
 * Pre-configured for edit mode with validation for existing
 * limit data and optimized update workflows.
 */
export function useEditLimitForm(
  limitData: LimitTableRowData,
  config: Omit<UseLimitFormConfig, 'mode' | 'initialData'>
) {
  return useLimitForm<EditLimitFormData>({
    ...config,
    mode: 'edit',
    initialData: {
      id: limitData.id,
      name: limitData.name,
      limitType: limitData.limitType,
      limitRate: limitData.limitRate,
      limitCounter: limitData.limitCounter,
      user: limitData.user,
      service: limitData.service,
      role: limitData.role,
      active: limitData.active,
      metadata: limitData.metadata
    }
  })
}

// =============================================================================
// UTILITY FUNCTIONS FOR EXTERNAL USE
// =============================================================================

/**
 * Utility function to validate limit rate format
 * 
 * Provides standalone validation for rate limit strings
 * compatible with DreamFactory rate limiting formats.
 */
export const validateLimitRateFormat = (rate: string): boolean => {
  const rateRegex = /^\d+\/(second|minute|hour|day)$/
  return rateRegex.test(rate)
}

/**
 * Utility function to get suggested rate limits based on limit type
 * 
 * Provides intelligent default suggestions for rate limits
 * based on limit type and common usage patterns.
 */
export const getSuggestedRateLimits = (limitType: LimitType): string[] => {
  const suggestions: Record<LimitType, string[]> = {
    [LimitType.USER]: ['100/minute', '1000/hour', '10000/day'],
    [LimitType.SERVICE]: ['1000/minute', '10000/hour', '100000/day'],
    [LimitType.ROLE]: ['500/minute', '5000/hour', '50000/day'],
    [LimitType.ENDPOINT]: ['50/minute', '500/hour', '5000/day'],
    [LimitType.GLOBAL]: ['10000/minute', '100000/hour', '1000000/day'],
    [LimitType.IP]: ['20/minute', '200/hour', '2000/day'],
    [LimitType.CUSTOM]: ['100/minute', '1000/hour', '10000/day']
  }

  return suggestions[limitType] || suggestions[LimitType.ENDPOINT]
}

/**
 * Utility function to get compatible counter types for limit types
 * 
 * Provides recommended counter types based on limit type
 * and performance characteristics.
 */
export const getCompatibleCounterTypes = (limitType: LimitType): LimitCounter[] => {
  const compatibility: Record<LimitType, LimitCounter[]> = {
    [LimitType.USER]: [
      LimitCounter.REQUEST,
      LimitCounter.SLIDING_WINDOW,
      LimitCounter.TOKEN_BUCKET
    ],
    [LimitType.SERVICE]: [
      LimitCounter.REQUEST,
      LimitCounter.FIXED_WINDOW,
      LimitCounter.SLIDING_WINDOW
    ],
    [LimitType.ROLE]: [
      LimitCounter.REQUEST,
      LimitCounter.SLIDING_WINDOW,
      LimitCounter.TOKEN_BUCKET
    ],
    [LimitType.ENDPOINT]: [
      LimitCounter.REQUEST,
      LimitCounter.LEAKY_BUCKET,
      LimitCounter.TOKEN_BUCKET
    ],
    [LimitType.GLOBAL]: [
      LimitCounter.FIXED_WINDOW,
      LimitCounter.SLIDING_WINDOW,
      LimitCounter.BANDWIDTH
    ],
    [LimitType.IP]: [
      LimitCounter.SLIDING_WINDOW,
      LimitCounter.LEAKY_BUCKET,
      LimitCounter.TOKEN_BUCKET
    ],
    [LimitType.CUSTOM]: [
      LimitCounter.REQUEST,
      LimitCounter.SLIDING_WINDOW,
      LimitCounter.TOKEN_BUCKET,
      LimitCounter.LEAKY_BUCKET
    ]
  }

  return compatibility[limitType] || [LimitCounter.REQUEST]
}

/**
 * Default export for the main hook
 */
export default useLimitForm