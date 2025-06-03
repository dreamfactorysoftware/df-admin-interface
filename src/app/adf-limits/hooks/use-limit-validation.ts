/**
 * Comprehensive Rate Limit Validation Hook for React/Next.js Admin Interface
 * 
 * Provides dynamic Zod schema validation with React Hook Form integration, real-time validation
 * under 100ms, and comprehensive business logic validation for rate limiting configurations.
 * 
 * Features:
 * - Dynamic validation schemas based on limit type selection
 * - Real-time validation performance monitoring under 100ms requirement
 * - Conditional field validation (serviceId, roleId, userId, endpoint) based on limit type
 * - Comprehensive field validation with type-specific business rules
 * - Rate limit constraint validation and period combination logic
 * - Performance metrics tracking and compliance monitoring
 * - Error handling compatible with React Hook Form display patterns
 * 
 * @author DreamFactory Admin Interface Team
 * @version React 19/Next.js 15.1 Migration
 * @since 2024-12-19
 */

import { useMemo, useCallback, useRef, useEffect, useState } from 'react'
import { z, ZodSchema, ZodError } from 'zod'
import { useForm, UseFormReturn, FieldErrors, UseFormProps } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'

// Type imports from dependency files
import {
  LimitType,
  LimitCounter,
  CreateLimitFormData,
  EditLimitFormData,
  CreateLimitFormSchema,
  EditLimitFormSchema,
  ValidationPerformanceMetrics,
  LimitTableRowData
} from '../types'

// Form types from shared library
import {
  FormConfig,
  RealtimeValidationConfig,
  ValidationTimingConfig,
  FieldValidationConfig
} from '@/types/forms'

// =============================================================================
// PERFORMANCE MONITORING TYPES
// =============================================================================

/**
 * Validation performance tracking for real-time compliance monitoring
 */
interface ValidationPerformanceTracker {
  /** Start time for validation measurement */
  startTime: number
  /** End time for validation completion */
  endTime: number
  /** Field being validated */
  fieldName: string
  /** Validation result (success/failure) */
  result: 'success' | 'error'
  /** Validation duration in milliseconds */
  duration: number
}

/**
 * Real-time validation compliance metrics
 */
interface RealtimeValidationMetrics extends ValidationPerformanceMetrics {
  /** Current validation session ID */
  sessionId: string
  /** Validation performance history (last 50 validations) */
  performanceHistory: ValidationPerformanceTracker[]
  /** Fields that consistently exceed 100ms threshold */
  slowFields: Set<string>
  /** Overall validation health score (0-100) */
  healthScore: number
}

// =============================================================================
// DYNAMIC VALIDATION SCHEMA TYPES
// =============================================================================

/**
 * Context for dynamic validation schema generation
 */
interface ValidationContext {
  /** Current limit type selection */
  limitType: LimitType
  /** Form mode (create or edit) */
  mode: 'create' | 'edit'
  /** Current form values for cross-field validation */
  currentValues: Partial<CreateLimitFormData | EditLimitFormData>
  /** Available services for validation */
  availableServices?: Array<{ id: number; name: string }>
  /** Available roles for validation */
  availableRoles?: Array<{ id: number; name: string }>
  /** Available users for validation */
  availableUsers?: Array<{ id: number; name: string }>
}

/**
 * Dynamic validation rule configuration
 */
interface DynamicValidationRules {
  /** Field-specific validation schemas */
  fieldSchemas: Record<string, ZodSchema>
  /** Conditional field requirements */
  conditionalRequirements: ConditionalFieldRules
  /** Business logic validators */
  businessLogicValidators: BusinessLogicValidator[]
  /** Performance optimization settings */
  performanceConfig: ValidationPerformanceConfig
}

/**
 * Conditional field validation rules based on limit type
 */
interface ConditionalFieldRules {
  /** Required fields for each limit type */
  requiredFields: Record<LimitType, string[]>
  /** Optional fields for each limit type */
  optionalFields: Record<LimitType, string[]>
  /** Excluded fields for each limit type */
  excludedFields: Record<LimitType, string[]>
  /** Field dependency rules */
  dependencies: FieldDependency[]
}

/**
 * Field dependency configuration for cross-field validation
 */
interface FieldDependency {
  /** Source field that triggers validation */
  sourceField: string
  /** Target fields affected by source field changes */
  targetFields: string[]
  /** Validation rule based on source field value */
  rule: (sourceValue: any, targetValues: Record<string, any>) => string | undefined
}

/**
 * Business logic validator function signature
 */
type BusinessLogicValidator = (
  values: Partial<CreateLimitFormData | EditLimitFormData>,
  context: ValidationContext
) => Record<string, string> | undefined

/**
 * Validation performance configuration
 */
interface ValidationPerformanceConfig {
  /** Enable performance tracking */
  trackPerformance: boolean
  /** Target validation time in milliseconds */
  targetTime: number
  /** Performance warning threshold */
  warningThreshold: number
  /** Maximum allowed validation time */
  maxValidationTime: number
  /** Enable validation caching */
  enableCaching: boolean
  /** Cache TTL in milliseconds */
  cacheTtl: number
}

// =============================================================================
// HOOK CONFIGURATION AND RETURN TYPES
// =============================================================================

/**
 * Configuration options for useLimitValidation hook
 */
interface UseLimitValidationConfig {
  /** Form mode (create or edit) */
  mode: 'create' | 'edit'
  /** Initial form data */
  initialData?: Partial<LimitTableRowData>
  /** Real-time validation configuration */
  realtimeConfig?: Partial<RealtimeValidationConfig>
  /** Performance monitoring configuration */
  performanceConfig?: Partial<ValidationPerformanceConfig>
  /** Available data for validation context */
  context?: Partial<ValidationContext>
  /** Custom validation rules */
  customValidators?: BusinessLogicValidator[]
  /** Enable debug mode for development */
  debugMode?: boolean
}

/**
 * Return type for useLimitValidation hook
 */
interface UseLimitValidationReturn<T extends CreateLimitFormData | EditLimitFormData> {
  /** React Hook Form instance with validation */
  form: UseFormReturn<T>
  /** Current validation schema */
  validationSchema: ZodSchema<T>
  /** Current form values */
  values: T
  /** Form validation errors */
  errors: FieldErrors<T>
  /** Validation state indicators */
  isValidating: boolean
  /** Form is valid and ready for submission */
  isValid: boolean
  /** Form has been modified */
  isDirty: boolean
  /** Validate specific field manually */
  validateField: (fieldName: keyof T) => Promise<boolean>
  /** Validate entire form manually */
  validateForm: () => Promise<boolean>
  /** Get validation error for specific field */
  getFieldError: (fieldName: keyof T) => string | undefined
  /** Clear validation error for specific field */
  clearFieldError: (fieldName: keyof T) => void
  /** Reset form to initial state */
  resetForm: () => void
  /** Performance metrics */
  metrics: RealtimeValidationMetrics
  /** Current validation context */
  context: ValidationContext
  /** Update validation context */
  updateContext: (updates: Partial<ValidationContext>) => void
}

// =============================================================================
// VALIDATION SCHEMA BUILDERS
// =============================================================================

/**
 * Creates dynamic validation schema based on limit type and context
 */
const createDynamicValidationSchema = (
  context: ValidationContext,
  performanceConfig: ValidationPerformanceConfig
): ZodSchema => {
  const { limitType, mode, currentValues } = context

  // Base schema selection based on mode
  const baseSchema = mode === 'create' ? CreateLimitFormSchema : EditLimitFormSchema

  // Dynamic field requirements based on limit type
  const fieldRequirements = getFieldRequirements(limitType)
  
  // Create conditional schema modifications
  return baseSchema.superRefine((data, ctx) => {
    const validationStartTime = performance.now()

    try {
      // Validate conditional field requirements
      validateConditionalFields(data, fieldRequirements, ctx)
      
      // Validate business logic rules
      validateBusinessLogic(data, context, ctx)
      
      // Validate rate limit constraints
      validateRateLimitConstraints(data, ctx)
      
      // Check performance compliance
      const validationTime = performance.now() - validationStartTime
      if (validationTime > performanceConfig.targetTime) {
        console.warn(`Validation exceeded target time: ${validationTime}ms`)
      }
    } catch (error) {
      console.error('Validation error:', error)
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Validation error occurred',
        path: ['general']
      })
    }
  })
}

/**
 * Gets field requirements based on limit type
 */
const getFieldRequirements = (limitType: LimitType): ConditionalFieldRules => {
  const baseRequired = ['name', 'limitType', 'limitRate', 'limitCounter']
  
  const typeSpecificRules: Record<LimitType, { required: string[]; optional: string[]; excluded: string[] }> = {
    [LimitType.USER]: {
      required: [...baseRequired, 'user'],
      optional: ['endpoint'],
      excluded: ['service', 'role']
    },
    [LimitType.SERVICE]: {
      required: [...baseRequired, 'service'],
      optional: ['endpoint'],
      excluded: ['user', 'role']
    },
    [LimitType.ROLE]: {
      required: [...baseRequired, 'role'],
      optional: ['endpoint'],
      excluded: ['user', 'service']
    },
    [LimitType.ENDPOINT]: {
      required: [...baseRequired, 'endpoint'],
      optional: ['service', 'role', 'user'],
      excluded: []
    },
    [LimitType.GLOBAL]: {
      required: [...baseRequired],
      optional: [],
      excluded: ['user', 'service', 'role', 'endpoint']
    },
    [LimitType.IP]: {
      required: [...baseRequired],
      optional: [],
      excluded: ['user', 'service', 'role', 'endpoint']
    },
    [LimitType.CUSTOM]: {
      required: [...baseRequired],
      optional: ['user', 'service', 'role', 'endpoint'],
      excluded: []
    }
  }

  const rules = typeSpecificRules[limitType]
  
  return {
    requiredFields: { [limitType]: rules.required },
    optionalFields: { [limitType]: rules.optional },
    excludedFields: { [limitType]: rules.excluded },
    dependencies: createFieldDependencies(limitType)
  } as ConditionalFieldRules
}

/**
 * Creates field dependency rules for cross-field validation
 */
const createFieldDependencies = (limitType: LimitType): FieldDependency[] => {
  const dependencies: FieldDependency[] = []

  // Limit type dependent validations
  dependencies.push({
    sourceField: 'limitType',
    targetFields: ['user', 'service', 'role', 'endpoint'],
    rule: (limitTypeValue: LimitType, targetValues: Record<string, any>) => {
      const requirements = getFieldRequirements(limitTypeValue)
      const required = requirements.requiredFields[limitTypeValue] || []
      
      for (const field of required) {
        if (field !== 'limitType' && !targetValues[field]) {
          return `${field} is required for ${limitTypeValue} limits`
        }
      }
      return undefined
    }
  })

  // Rate and period validation dependency
  dependencies.push({
    sourceField: 'limitRate',
    targetFields: ['limitCounter'],
    rule: (rateValue: string, targetValues: Record<string, any>) => {
      if (!rateValue) return undefined
      
      const rateParts = rateValue.split('/')
      if (rateParts.length !== 2) return 'Invalid rate format'
      
      const [rate, period] = rateParts
      const rateNumber = parseInt(rate, 10)
      
      // Validate rate number
      if (isNaN(rateNumber) || rateNumber <= 0) {
        return 'Rate must be a positive number'
      }
      
      // Validate period
      const validPeriods = ['second', 'minute', 'hour', 'day']
      if (!validPeriods.includes(period)) {
        return 'Period must be one of: second, minute, hour, day'
      }
      
      // Business logic: validate sensible rate limits
      const counterType = targetValues.limitCounter
      if (counterType === LimitCounter.TOKEN_BUCKET && period === 'second' && rateNumber > 1000) {
        return 'Token bucket limits over 1000/second may impact performance'
      }
      
      return undefined
    }
  })

  return dependencies
}

/**
 * Validates conditional field requirements based on limit type
 */
const validateConditionalFields = (
  data: any,
  requirements: ConditionalFieldRules,
  ctx: z.RefinementCtx
): void => {
  const limitType = data.limitType as LimitType
  const requiredFields = requirements.requiredFields[limitType] || []
  const excludedFields = requirements.excludedFields[limitType] || []

  // Check required fields
  for (const field of requiredFields) {
    if (!data[field] || (typeof data[field] === 'string' && data[field].trim() === '')) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: `${field} is required for ${limitType} limits`,
        path: [field]
      })
    }
  }

  // Check excluded fields (should be empty/null)
  for (const field of excludedFields) {
    if (data[field] !== null && data[field] !== undefined && data[field] !== '') {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: `${field} is not applicable for ${limitType} limits`,
        path: [field]
      })
    }
  }
}

/**
 * Validates business logic rules for rate limiting
 */
const validateBusinessLogic = (
  data: any,
  context: ValidationContext,
  ctx: z.RefinementCtx
): void => {
  // Validate rate limit value constraints
  if (data.limitRate) {
    const rateParts = data.limitRate.split('/')
    if (rateParts.length === 2) {
      const [rate, period] = rateParts
      const rateNumber = parseInt(rate, 10)
      
      // Business rule: minimum viable rate limits
      if (period === 'second' && rateNumber < 1) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Rate limits per second must be at least 1',
          path: ['limitRate']
        })
      }
      
      // Business rule: maximum reasonable rate limits
      if (period === 'day' && rateNumber > 1000000) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Rate limits per day should not exceed 1,000,000',
          path: ['limitRate']
        })
      }
      
      // Business rule: counter type compatibility
      if (data.limitCounter === LimitCounter.LEAKY_BUCKET && period === 'second' && rateNumber > 100) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Leaky bucket counters are optimized for rates under 100/second',
          path: ['limitCounter']
        })
      }
    }
  }

  // Validate limit name uniqueness context
  if (data.name && context.mode === 'create') {
    // Note: This would typically check against existing limits
    // Implementation would integrate with React Query to check duplicates
    const reservedNames = ['system', 'admin', 'default', 'global']
    if (reservedNames.includes(data.name.toLowerCase())) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Limit name conflicts with reserved system names',
        path: ['name']
      })
    }
  }
}

/**
 * Validates rate limit constraints and combinations
 */
const validateRateLimitConstraints = (data: any, ctx: z.RefinementCtx): void => {
  // Validate counter type and rate period combinations
  if (data.limitCounter && data.limitRate) {
    const rateParts = data.limitRate.split('/')
    if (rateParts.length === 2) {
      const [, period] = rateParts
      const counter = data.limitCounter as LimitCounter
      
      // Constraint: Token bucket works best with longer periods
      if (counter === LimitCounter.TOKEN_BUCKET && period === 'second') {
        // This is a warning, not an error
        console.warn('Token bucket counters are more effective with minute or hour periods')
      }
      
      // Constraint: Fixed window requires appropriate periods
      if (counter === LimitCounter.FIXED_WINDOW && !['minute', 'hour', 'day'].includes(period)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Fixed window counters require periods of minute, hour, or day',
          path: ['limitCounter']
        })
      }
      
      // Constraint: Sliding window performance considerations
      if (counter === LimitCounter.SLIDING_WINDOW && period === 'second') {
        console.warn('Sliding window counters with second periods may impact performance')
      }
    }
  }

  // Validate scope combinations
  const hasUserScope = data.user !== null && data.user !== undefined
  const hasServiceScope = data.service !== null && data.service !== undefined
  const hasRoleScope = data.role !== null && data.role !== undefined
  const hasEndpointScope = data.endpoint && data.endpoint.trim() !== ''

  // Business rule: avoid overly broad limits
  if (hasUserScope && hasServiceScope && hasRoleScope && hasEndpointScope) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'Limit scope is too restrictive - consider simplifying',
      path: ['general']
    })
  }
}

// =============================================================================
// PERFORMANCE MONITORING UTILITIES
// =============================================================================

/**
 * Creates performance tracker for validation monitoring
 */
const createPerformanceTracker = (): RealtimeValidationMetrics => {
  const sessionId = `validation_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`
  
  return {
    sessionId,
    averageValidationTime: 0,
    maxValidationTime: 0,
    validationCount: 0,
    slowValidationCount: 0,
    realtimeComplianceRate: 100,
    lastValidationTime: new Date(),
    performanceHistory: [],
    slowFields: new Set(),
    healthScore: 100
  }
}

/**
 * Updates performance metrics with new validation timing
 */
const updatePerformanceMetrics = (
  metrics: RealtimeValidationMetrics,
  tracker: ValidationPerformanceTracker
): RealtimeValidationMetrics => {
  const { duration, fieldName, result } = tracker
  
  // Update basic metrics
  const newValidationCount = metrics.validationCount + 1
  const newTotalTime = (metrics.averageValidationTime * metrics.validationCount) + duration
  const newAverageTime = newTotalTime / newValidationCount
  const newMaxTime = Math.max(metrics.maxValidationTime, duration)
  
  // Track slow validations
  const isSlowValidation = duration > 100
  const newSlowCount = metrics.slowValidationCount + (isSlowValidation ? 1 : 0)
  
  // Update slow fields tracking
  const updatedSlowFields = new Set(metrics.slowFields)
  if (isSlowValidation) {
    updatedSlowFields.add(fieldName)
  } else if (duration < 50) {
    // Remove from slow fields if consistently fast
    updatedSlowFields.delete(fieldName)
  }
  
  // Calculate compliance rate
  const newComplianceRate = ((newValidationCount - newSlowCount) / newValidationCount) * 100
  
  // Update performance history (keep last 50)
  const updatedHistory = [...metrics.performanceHistory, tracker].slice(-50)
  
  // Calculate health score (weighted average of compliance and speed)
  const speedScore = Math.max(0, 100 - (newAverageTime - 50)) // Optimal at 50ms
  const complianceScore = newComplianceRate
  const healthScore = (speedScore * 0.4) + (complianceScore * 0.6)
  
  return {
    ...metrics,
    averageValidationTime: newAverageTime,
    maxValidationTime: newMaxTime,
    validationCount: newValidationCount,
    slowValidationCount: newSlowCount,
    realtimeComplianceRate: newComplianceRate,
    lastValidationTime: new Date(),
    performanceHistory: updatedHistory,
    slowFields: updatedSlowFields,
    healthScore: Math.round(healthScore)
  }
}

// =============================================================================
// MAIN HOOK IMPLEMENTATION
// =============================================================================

/**
 * Comprehensive rate limit validation hook with real-time performance monitoring
 * 
 * Provides dynamic Zod schema validation with React Hook Form integration,
 * ensuring validation responses under 100ms while maintaining type safety
 * and comprehensive business logic validation.
 */
export function useLimitValidation<T extends CreateLimitFormData | EditLimitFormData>(
  config: UseLimitValidationConfig
): UseLimitValidationReturn<T> {
  // Configuration with defaults
  const {
    mode,
    initialData,
    realtimeConfig = {
      enabled: true,
      debounceMs: 50,
      mode: 'onChange',
      reValidateMode: 'onChange',
      showValidationIndicators: true
    },
    performanceConfig = {
      trackPerformance: true,
      targetTime: 100,
      warningThreshold: 80,
      maxValidationTime: 200,
      enableCaching: true,
      cacheTtl: 5000
    },
    context: contextOverrides = {},
    customValidators = [],
    debugMode = false
  } = config

  // Performance tracking state
  const [metrics, setMetrics] = useState<RealtimeValidationMetrics>(createPerformanceTracker)
  const validationCache = useRef<Map<string, { result: any; timestamp: number }>>(new Map())
  const currentValidation = useRef<number>(0)

  // Validation context state
  const [validationContext, setValidationContext] = useState<ValidationContext>(() => ({
    limitType: initialData?.limitType || LimitType.ENDPOINT,
    mode,
    currentValues: initialData || {},
    ...contextOverrides
  }))

  // Create dynamic validation schema based on current context
  const validationSchema = useMemo(() => {
    const startTime = performance.now()
    
    try {
      const schema = createDynamicValidationSchema(validationContext, performanceConfig)
      
      if (debugMode) {
        const schemaCreationTime = performance.now() - startTime
        console.log(`Schema creation time: ${schemaCreationTime}ms`)
      }
      
      return schema as ZodSchema<T>
    } catch (error) {
      console.error('Error creating validation schema:', error)
      // Fallback to base schema
      return (mode === 'create' ? CreateLimitFormSchema : EditLimitFormSchema) as ZodSchema<T>
    }
  }, [validationContext, performanceConfig, mode, debugMode])

  // React Hook Form configuration with Zod resolver
  const formConfig: UseFormProps<T> = {
    resolver: zodResolver(validationSchema),
    mode: realtimeConfig.mode,
    reValidateMode: realtimeConfig.reValidateMode,
    defaultValues: initialData as T,
    criteriaMode: 'all',
    shouldFocusError: true,
    shouldUnregister: false,
    shouldUseNativeValidation: false
  }

  // Initialize React Hook Form
  const form = useForm<T>(formConfig)
  const { watch, formState, trigger, setError, clearErrors, reset } = form
  const { errors, isValidating, isValid, isDirty } = formState

  // Watch all form values for context updates
  const watchedValues = watch()

  // Update validation context when form values change
  useEffect(() => {
    const limitType = watchedValues.limitType as LimitType
    if (limitType && limitType !== validationContext.limitType) {
      setValidationContext(prev => ({
        ...prev,
        limitType,
        currentValues: watchedValues
      }))
    }
  }, [watchedValues, validationContext.limitType])

  // Performance-optimized validation function
  const performValidation = useCallback(async (
    fieldName: keyof T,
    value: any
  ): Promise<boolean> => {
    const validationId = ++currentValidation.current
    const startTime = performance.now()

    try {
      // Check cache first if enabled
      if (performanceConfig.enableCaching) {
        const cacheKey = `${fieldName}_${JSON.stringify(value)}`
        const cached = validationCache.current.get(cacheKey)
        
        if (cached && (Date.now() - cached.timestamp) < performanceConfig.cacheTtl) {
          if (debugMode) {
            console.log(`Using cached validation for ${String(fieldName)}`)
          }
          return cached.result
        }
      }

      // Perform validation
      const result = await trigger(fieldName as any)
      const endTime = performance.now()
      const duration = endTime - startTime

      // Update performance metrics
      const tracker: ValidationPerformanceTracker = {
        startTime,
        endTime,
        fieldName: String(fieldName),
        result: result ? 'success' : 'error',
        duration
      }

      setMetrics(prevMetrics => updatePerformanceMetrics(prevMetrics, tracker))

      // Cache result if enabled
      if (performanceConfig.enableCaching) {
        const cacheKey = `${fieldName}_${JSON.stringify(value)}`
        validationCache.current.set(cacheKey, {
          result,
          timestamp: Date.now()
        })
      }

      // Performance warnings
      if (duration > performanceConfig.warningThreshold) {
        console.warn(`Validation for ${String(fieldName)} took ${duration}ms (target: ${performanceConfig.targetTime}ms)`)
      }

      if (debugMode) {
        console.log(`Validation for ${String(fieldName)}: ${duration}ms, result: ${result}`)
      }

      return result
    } catch (error) {
      const endTime = performance.now()
      const duration = endTime - startTime

      console.error(`Validation error for ${String(fieldName)}:`, error)

      // Track failed validation
      const tracker: ValidationPerformanceTracker = {
        startTime,
        endTime,
        fieldName: String(fieldName),
        result: 'error',
        duration
      }

      setMetrics(prevMetrics => updatePerformanceMetrics(prevMetrics, tracker))
      
      return false
    }
  }, [trigger, performanceConfig, debugMode])

  // Validate specific field
  const validateField = useCallback(async (fieldName: keyof T): Promise<boolean> => {
    const value = watchedValues[fieldName as keyof typeof watchedValues]
    return performValidation(fieldName, value)
  }, [performValidation, watchedValues])

  // Validate entire form
  const validateForm = useCallback(async (): Promise<boolean> => {
    const startTime = performance.now()
    
    try {
      const result = await trigger()
      const duration = performance.now() - startTime

      if (debugMode) {
        console.log(`Full form validation: ${duration}ms, result: ${result}`)
      }

      // Track full form validation
      const tracker: ValidationPerformanceTracker = {
        startTime,
        endTime: performance.now(),
        fieldName: 'form',
        result: result ? 'success' : 'error',
        duration
      }

      setMetrics(prevMetrics => updatePerformanceMetrics(prevMetrics, tracker))

      return result
    } catch (error) {
      console.error('Form validation error:', error)
      return false
    }
  }, [trigger, debugMode])

  // Get field error message
  const getFieldError = useCallback((fieldName: keyof T): string | undefined => {
    const error = errors[fieldName as keyof typeof errors]
    return error?.message as string
  }, [errors])

  // Clear specific field error
  const clearFieldError = useCallback((fieldName: keyof T) => {
    clearErrors(fieldName as any)
  }, [clearErrors])

  // Reset form to initial state
  const resetForm = useCallback(() => {
    reset(initialData as T)
    setValidationContext(prev => ({
      ...prev,
      currentValues: initialData || {}
    }))
    // Clear performance metrics
    setMetrics(createPerformanceTracker())
    validationCache.current.clear()
  }, [reset, initialData])

  // Update validation context
  const updateContext = useCallback((updates: Partial<ValidationContext>) => {
    setValidationContext(prev => ({ ...prev, ...updates }))
  }, [])

  // Clear validation cache when schema changes
  useEffect(() => {
    validationCache.current.clear()
  }, [validationSchema])

  // Performance monitoring warnings
  useEffect(() => {
    if (metrics.realtimeComplianceRate < 90 && metrics.validationCount > 10) {
      console.warn(`Validation performance below target: ${metrics.realtimeComplianceRate}% compliance`)
    }
    
    if (metrics.healthScore < 70 && metrics.validationCount > 10) {
      console.warn(`Validation health score low: ${metrics.healthScore}/100`)
    }
  }, [metrics])

  return {
    form,
    validationSchema,
    values: watchedValues as T,
    errors,
    isValidating,
    isValid,
    isDirty,
    validateField,
    validateForm,
    getFieldError,
    clearFieldError,
    resetForm,
    metrics,
    context: validationContext,
    updateContext
  }
}

// =============================================================================
// EXPORT UTILITIES FOR TESTING AND INTEGRATION
// =============================================================================

/**
 * Utility function to create validation context for testing
 */
export const createValidationContext = (
  limitType: LimitType,
  mode: 'create' | 'edit' = 'create',
  additionalContext: Partial<ValidationContext> = {}
): ValidationContext => ({
  limitType,
  mode,
  currentValues: {},
  ...additionalContext
})

/**
 * Utility function to validate rate limit format
 */
export const validateRateLimitFormat = (rateString: string): boolean => {
  const rateRegex = /^\d+\/(second|minute|hour|day)$/
  return rateRegex.test(rateString)
}

/**
 * Utility function to check if validation meets performance requirements
 */
export const isPerformanceCompliant = (metrics: RealtimeValidationMetrics): boolean => {
  return metrics.realtimeComplianceRate >= 90 && metrics.averageValidationTime <= 100
}

/**
 * Utility function to get validation suggestions based on limit type
 */
export const getValidationSuggestions = (limitType: LimitType): string[] => {
  const suggestions: Record<LimitType, string[]> = {
    [LimitType.USER]: [
      'User-based limits apply to specific user accounts',
      'Consider endpoint restrictions for granular control',
      'Monitor user activity patterns for optimal rates'
    ],
    [LimitType.SERVICE]: [
      'Service-based limits apply to entire database services',
      'Use for broad API protection across all endpoints',
      'Consider role-based limits for user-specific controls'
    ],
    [LimitType.ROLE]: [
      'Role-based limits apply to all users with assigned roles',
      'Effective for managing user groups',
      'Combine with endpoint limits for fine-grained control'
    ],
    [LimitType.ENDPOINT]: [
      'Endpoint-based limits apply to specific API routes',
      'Most granular control option available',
      'Monitor endpoint performance for rate optimization'
    ],
    [LimitType.GLOBAL]: [
      'Global limits apply to all API requests',
      'Use for system-wide protection',
      'Set conservative rates to prevent overload'
    ],
    [LimitType.IP]: [
      'IP-based limits apply to client IP addresses',
      'Effective against abuse from specific sources',
      'Consider proxy and CDN implications'
    ],
    [LimitType.CUSTOM]: [
      'Custom limits allow flexible rule combinations',
      'Define specific criteria for rate limiting',
      'Test thoroughly before production deployment'
    ]
  }

  return suggestions[limitType] || []
}

/**
 * Default hook export
 */
export default useLimitValidation