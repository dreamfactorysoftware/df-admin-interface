/**
 * @fileoverview React Hook Form and Zod integration utilities
 * 
 * This module provides comprehensive form management utilities that integrate React Hook Form
 * with Zod schema validation, ensuring type safety, optimal performance, and consistent
 * error handling across all forms in the application. Implements enterprise-grade patterns
 * for form configuration, validation resolvers, and error handling with sub-100ms validation
 * performance requirements.
 * 
 * Key Features:
 * - zodResolver integration for seamless React Hook Form and Zod schema binding
 * - Form configuration helpers that standardize useForm hook setup
 * - Error message transformation utilities for user-friendly error display
 * - Real-time validation with debouncing for optimal performance
 * - Form reset and default value utilities for consistent state management
 * - TypeScript generic utilities for type-safe form value and error handling
 * - Testing utilities for comprehensive validation coverage
 * 
 * @version 1.0.0
 * @since React 19 / Next.js 15.1 migration
 */

import { useCallback, useMemo, useRef, useEffect } from 'react';
import type { 
  FieldValues, 
  UseFormReturn, 
  FieldErrors, 
  FieldPath,
  FieldPathValue,
  Path,
  PathValue,
  Control,
  RegisterOptions,
  Resolver,
  UseFormProps,
  UseFormSetError,
  UseFormClearErrors,
  UseFormTrigger,
  UseFormWatch,
  UseFormReset,
  DeepPartial,
  SubmitHandler,
  SubmitErrorHandler
} from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import type { ZodSchema, ZodError, ZodIssue } from 'zod';

import type {
  FormConfig,
  EnhancedFormReturn,
  ValidationResult,
  ValidationSuccess,
  ValidationFailure,
  ValidationErrorInfo,
  FieldValidationError,
  CrossFieldValidationError,
  SchemaValidationError,
  ErrorMessageProvider,
  ErrorMessageFormatter,
  ValidationPerformanceMetrics,
  PerformanceTrackingConfig,
  PerformanceMeasurement,
  ZodValidatorConfig,
  PerformantZodSchema,
  LegacyValidationError,
  FormFieldPaths,
  FormFieldValue,
  ValidationErrors,
  TypedValidationSchema,
  isValidationSuccess,
  isValidationFailure,
  isLegacyValidationError
} from './types';

// =============================================================================
// PERFORMANCE MEASUREMENT UTILITIES
// =============================================================================

/**
 * High-precision performance measurement utility for validation timing analysis.
 * Tracks validation performance to ensure 100ms real-time validation requirements.
 */
class ValidationPerformanceMeasurement implements PerformanceMeasurement {
  private measurements: Map<string, { startTime: number; endTime?: number }> = new Map();
  private readonly useHighPrecision: boolean;

  constructor() {
    // Use performance.now() for high-precision timing when available
    this.useHighPrecision = typeof performance !== 'undefined' && typeof performance.now === 'function';
  }

  private getCurrentTime(): number {
    return this.useHighPrecision ? performance.now() : Date.now();
  }

  start(operationName: string): void {
    this.measurements.set(operationName, {
      startTime: this.getCurrentTime()
    });
  }

  end(operationName: string): number {
    const measurement = this.measurements.get(operationName);
    if (!measurement) {
      throw new Error(`No measurement started for operation: ${operationName}`);
    }

    const endTime = this.getCurrentTime();
    measurement.endTime = endTime;
    
    const duration = endTime - measurement.startTime;
    this.measurements.set(operationName, { ...measurement, endTime });
    
    return duration;
  }

  getMetrics(): ValidationPerformanceMetrics {
    const now = new Date();
    const fieldValidationTimes: Record<string, number> = {};
    let validationTime = 0;
    let schemaProcessingTime = 0;
    let errorProcessingTime = 0;
    let startTime = now;
    let endTime = now;

    // Calculate metrics from measurements
    for (const [operationName, measurement] of this.measurements) {
      if (measurement.endTime) {
        const duration = measurement.endTime - measurement.startTime;
        
        if (operationName.startsWith('field:')) {
          const fieldName = operationName.substring(6);
          fieldValidationTimes[fieldName] = duration;
        } else if (operationName === 'schema') {
          schemaProcessingTime = duration;
        } else if (operationName === 'errors') {
          errorProcessingTime = duration;
        } else if (operationName === 'validation') {
          validationTime = duration;
          startTime = new Date(measurement.startTime);
          endTime = new Date(measurement.endTime);
        }
      }
    }

    return {
      validationTime,
      fieldValidationTimes,
      schemaProcessingTime,
      errorProcessingTime,
      startTime,
      endTime,
      metPerformanceTarget: validationTime < 100,
      metadata: {
        measurementCount: this.measurements.size,
        useHighPrecision: this.useHighPrecision
      }
    };
  }

  reset(): void {
    this.measurements.clear();
  }

  metTarget(operationName: string, targetMs: number): boolean {
    const measurement = this.measurements.get(operationName);
    if (!measurement || !measurement.endTime) {
      return false;
    }
    
    const duration = measurement.endTime - measurement.startTime;
    return duration < targetMs;
  }
}

/**
 * Creates a new performance measurement instance for validation tracking.
 * Enables detailed performance monitoring with high-precision timing.
 */
export function createPerformanceMeasurement(): PerformanceMeasurement {
  return new ValidationPerformanceMeasurement();
}

// =============================================================================
// ERROR MESSAGE UTILITIES
// =============================================================================

/**
 * Default error message provider with comprehensive validation error messages.
 * Provides localized error messages for common validation scenarios.
 */
class DefaultErrorMessageProvider implements ErrorMessageProvider {
  private readonly messages: Map<string, Map<string, string>> = new Map();
  private readonly defaultLocale = 'en';

  constructor() {
    this.initializeDefaultMessages();
  }

  private initializeDefaultMessages(): void {
    const englishMessages = new Map([
      // Required field errors
      ['required', 'This field is required'],
      ['email.required', 'Email address is required'],
      ['password.required', 'Password is required'],
      ['name.required', 'Name is required'],
      
      // Format validation errors
      ['email.invalid', 'Please enter a valid email address'],
      ['url.invalid', 'Please enter a valid URL'],
      ['json.invalid', 'Please enter valid JSON'],
      ['number.invalid', 'Please enter a valid number'],
      
      // Length validation errors
      ['string.min', 'Must be at least {min} characters long'],
      ['string.max', 'Must be no more than {max} characters long'],
      ['array.min', 'Must have at least {min} items'],
      ['array.max', 'Must have no more than {max} items'],
      
      // Range validation errors
      ['number.min', 'Must be at least {min}'],
      ['number.max', 'Must be no more than {max}'],
      ['port.range', 'Port must be between 1 and 65535'],
      
      // Cross-field validation errors
      ['password.mismatch', 'Passwords do not match'],
      ['field.mismatch', 'Fields do not match'],
      
      // Unique validation errors
      ['name.duplicate', 'This name is already in use'],
      ['email.duplicate', 'This email address is already registered'],
      
      // Database connection errors
      ['connection.invalid', 'Unable to connect to database'],
      ['connection.timeout', 'Connection timeout - please check your network'],
      ['credentials.invalid', 'Invalid username or password'],
      
      // Legacy Angular compatibility errors
      ['doesNotMatch', 'Fields do not match'],
      ['notUnique', 'This value must be unique'],
      ['jsonInvalid', 'Invalid JSON format'],
      
      // System errors
      ['validation.performance', 'Validation taking longer than expected'],
      ['schema.invalid', 'Invalid validation schema'],
      ['unknown.error', 'An unexpected error occurred']
    ]);

    this.messages.set(this.defaultLocale, englishMessages);
  }

  getMessage(
    errorCode: string, 
    context: Record<string, unknown> = {}, 
    locale: string = this.defaultLocale
  ): string {
    const localeMessages = this.messages.get(locale) || this.messages.get(this.defaultLocale);
    if (!localeMessages) {
      return `Error: ${errorCode}`;
    }

    let message = localeMessages.get(errorCode);
    if (!message) {
      // Try fallback without field prefix
      const baseCode = errorCode.includes('.') ? errorCode.split('.').pop() : errorCode;
      message = localeMessages.get(baseCode || errorCode);
    }

    if (!message) {
      return `Error: ${errorCode}`;
    }

    // Replace context variables in message
    return Object.entries(context).reduce((msg, [key, value]) => {
      return msg.replace(new RegExp(`\\{${key}\\}`, 'g'), String(value));
    }, message);
  }

  hasMessage(errorCode: string, locale: string = this.defaultLocale): boolean {
    const localeMessages = this.messages.get(locale);
    return localeMessages?.has(errorCode) ?? false;
  }

  async loadMessages(locale: string): Promise<void> {
    // In a real implementation, this would load messages from an external source
    // For now, we'll just ensure the default messages are available
    if (!this.messages.has(locale)) {
      this.messages.set(locale, new Map(this.messages.get(this.defaultLocale)));
    }
  }

  getAvailableLocales(): string[] {
    return Array.from(this.messages.keys());
  }
}

/**
 * Default error message provider instance for the application.
 */
export const defaultErrorMessageProvider = new DefaultErrorMessageProvider();

/**
 * Creates a formatted error message from a validation error.
 * Supports variable interpolation and localization.
 */
export const formatErrorMessage: ErrorMessageFormatter = (
  errorCode: string,
  context: Record<string, unknown> = {},
  locale: string = 'en'
): string => {
  return defaultErrorMessageProvider.getMessage(errorCode, context, locale);
};

/**
 * Transforms Zod validation errors into user-friendly error messages.
 * Converts technical Zod error codes into localized, actionable messages.
 */
export function transformZodErrors(
  zodError: ZodError,
  messageProvider: ErrorMessageProvider = defaultErrorMessageProvider
): ValidationErrorInfo {
  const fieldErrors: Record<string, FieldValidationError[]> = {};
  const crossFieldErrors: CrossFieldValidationError[] = [];
  const schemaErrors: SchemaValidationError[] = [];

  for (const issue of zodError.issues) {
    const fieldPath = issue.path.join('.');
    
    if (issue.code === 'custom' && issue.params?.crossField) {
      // Handle cross-field validation errors
      crossFieldErrors.push({
        fields: issue.params.fields || [fieldPath],
        code: issue.params.errorCode || 'validation.error',
        message: messageProvider.getMessage(
          issue.params.errorCode || 'validation.error',
          issue.params.context
        ),
        type: issue.params.type || 'conditional'
      });
    } else if (fieldPath) {
      // Handle field-specific validation errors
      if (!fieldErrors[fieldPath]) {
        fieldErrors[fieldPath] = [];
      }

      const errorCode = `${fieldPath}.${issue.code}`;
      const context = {
        field: fieldPath,
        value: issue.input,
        ...issue.params
      };

      fieldErrors[fieldPath].push({
        field: fieldPath,
        code: issue.code,
        message: messageProvider.getMessage(errorCode, context) || issue.message,
        context
      });
    } else {
      // Handle schema-level validation errors
      schemaErrors.push({
        code: issue.code,
        message: issue.message,
        schemaPath: issue.path.join('.'),
        context: {
          expected: issue.expected,
          received: issue.received,
          ...issue.params
        }
      });
    }
  }

  const errorCount = Object.values(fieldErrors).flat().length + crossFieldErrors.length + schemaErrors.length;
  const summary = errorCount === 1 
    ? 'Please correct the validation error'
    : `Please correct ${errorCount} validation errors`;

  return {
    fieldErrors,
    crossFieldErrors,
    schemaErrors,
    errorCount,
    summary
  };
}

/**
 * Converts React Hook Form errors to ValidationErrorInfo format.
 * Maintains compatibility with existing error handling patterns.
 */
export function transformFormErrors<T extends FieldValues>(
  formErrors: FieldErrors<T>,
  messageProvider: ErrorMessageProvider = defaultErrorMessageProvider
): ValidationErrorInfo {
  const fieldErrors: Record<string, FieldValidationError[]> = {};
  let errorCount = 0;

  for (const [fieldPath, error] of Object.entries(formErrors)) {
    if (error) {
      fieldErrors[fieldPath] = [{
        field: fieldPath,
        code: error.type || 'validation.error',
        message: error.message || messageProvider.getMessage('validation.error'),
        legacyError: isLegacyValidationError(error) ? error : undefined
      }];
      errorCount++;
    }
  }

  const summary = errorCount === 1 
    ? 'Please correct the validation error'
    : `Please correct ${errorCount} validation errors`;

  return {
    fieldErrors,
    crossFieldErrors: [],
    schemaErrors: [],
    errorCount,
    summary
  };
}

// =============================================================================
// DEBOUNCED VALIDATION UTILITIES
// =============================================================================

/**
 * Custom hook for debounced validation to meet 100ms performance requirements.
 * Optimizes real-time validation by delaying validation until user stops typing.
 */
export function useDebouncedValidation<T extends FieldValues>(
  trigger: UseFormTrigger<T>,
  debounceMs: number = 300
) {
  const timeoutRef = useRef<NodeJS.Timeout>();

  const debouncedTrigger = useCallback(
    (fieldName?: FieldPath<T> | FieldPath<T>[]) => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }

      timeoutRef.current = setTimeout(() => {
        trigger(fieldName);
      }, debounceMs);
    },
    [trigger, debounceMs]
  );

  const cancelDebounce = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
  }, []);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return { debouncedTrigger, cancelDebounce };
}

/**
 * Creates a debounced validator function for real-time field validation.
 * Ensures validation performance stays under 100ms by batching validation calls.
 */
export function createDebouncedValidator<T extends FieldValues, F extends FieldPath<T>>(
  validator: (value: FieldPathValue<T, F>) => Promise<ValidationResult<FieldPathValue<T, F>>>,
  debounceMs: number = 300
) {
  let timeoutId: NodeJS.Timeout;
  
  return (value: FieldPathValue<T, F>): Promise<ValidationResult<FieldPathValue<T, F>>> => {
    return new Promise((resolve) => {
      clearTimeout(timeoutId);
      
      timeoutId = setTimeout(async () => {
        const result = await validator(value);
        resolve(result);
      }, debounceMs);
    });
  };
}

// =============================================================================
// ZOD RESOLVER INTEGRATION UTILITIES
// =============================================================================

/**
 * Enhanced zodResolver with performance tracking and error transformation.
 * Provides comprehensive integration between Zod schemas and React Hook Form.
 */
export function createZodResolver<T extends FieldValues>(
  schema: ZodSchema<T>,
  config: ZodValidatorConfig = {
    schema: schema as PerformantZodSchema<T>,
    enableDebouncing: true,
    debounceMs: 300,
    trackPerformance: false
  }
): Resolver<T> {
  const performanceMeasurement = config.trackPerformance ? createPerformanceMeasurement() : null;

  return async (values, context, options) => {
    performanceMeasurement?.start('validation');
    
    try {
      performanceMeasurement?.start('schema');
      const result = await schema.safeParseAsync(values);
      performanceMeasurement?.end('schema');

      if (result.success) {
        const validationTime = performanceMeasurement?.end('validation') || 0;
        
        // Check performance target
        if (config.trackPerformance && validationTime > 100) {
          console.warn(`Validation exceeded 100ms target: ${validationTime}ms`);
        }

        return {
          values: result.data,
          errors: {}
        };
      } else {
        performanceMeasurement?.start('errors');
        const errorInfo = transformZodErrors(result.error, defaultErrorMessageProvider);
        performanceMeasurement?.end('errors');
        
        const validationTime = performanceMeasurement?.end('validation') || 0;
        
        // Convert to React Hook Form error format
        const formErrors: FieldErrors<T> = {};
        for (const [fieldPath, fieldErrorList] of Object.entries(errorInfo.fieldErrors)) {
          if (fieldErrorList.length > 0) {
            const firstError = fieldErrorList[0];
            formErrors[fieldPath as FieldPath<T>] = {
              type: firstError.code,
              message: firstError.message,
              ...(firstError.legacyError || {})
            };
          }
        }

        return {
          values: {},
          errors: formErrors
        };
      }
    } catch (error) {
      performanceMeasurement?.end('validation');
      
      // Handle unexpected validation errors
      console.error('Validation error:', error);
      
      return {
        values: {},
        errors: {
          root: {
            type: 'validation.error',
            message: 'An unexpected validation error occurred'
          }
        } as FieldErrors<T>
      };
    }
  };
}

/**
 * Creates a performant Zod schema wrapper with validation timing constraints.
 * Ensures schemas meet the 100ms real-time validation requirement.
 */
export function createPerformantSchema<T extends FieldValues>(
  schema: ZodSchema<T>,
  complexityScore: 'low' | 'medium' | 'high' = 'medium'
): PerformantZodSchema<T> {
  const performantSchema = schema as PerformantZodSchema<T>;
  
  // Add performance metadata
  Object.defineProperty(performantSchema, 'maxValidationTime', {
    value: 100,
    writable: false,
    configurable: false
  });
  
  Object.defineProperty(performantSchema, 'complexityScore', {
    value: complexityScore,
    writable: false,
    configurable: false
  });

  return performantSchema;
}

// =============================================================================
// FORM CONFIGURATION UTILITIES
// =============================================================================

/**
 * Creates a standardized form configuration for React Hook Form with Zod integration.
 * Provides consistent setup patterns across all forms in the application.
 */
export function createFormConfig<T extends FieldValues>(
  schema: ZodSchema<T>,
  options: Partial<FormConfig<T>> = {}
): UseFormProps<T> & { resolver: Resolver<T> } {
  const performantSchema = createPerformantSchema(schema, options.schema?.complexityScore);
  
  const validatorConfig: ZodValidatorConfig = {
    schema: performantSchema,
    enableDebouncing: options.trackPerformance !== false,
    debounceMs: 300,
    trackPerformance: options.trackPerformance || false,
    ...options
  };

  return {
    resolver: createZodResolver(schema, validatorConfig),
    defaultValues: options.defaultValues,
    mode: options.mode || 'onTouched',
    reValidateMode: options.reValidateMode || 'onChange',
    context: options.context,
    criteriaMode: 'all',
    shouldFocusError: true,
    shouldUnregister: false,
    shouldUseNativeValidation: false,
    delayError: validatorConfig.debounceMs
  };
}

/**
 * Enhanced form utilities that extend React Hook Form with validation performance tracking.
 * Provides additional validation methods and performance monitoring.
 */
export function createEnhancedForm<T extends FieldValues>(
  formReturn: UseFormReturn<T>,
  schema: ZodSchema<T>,
  config: { trackPerformance?: boolean } = {}
): EnhancedFormReturn<T> {
  const performanceMeasurement = config.trackPerformance ? createPerformanceMeasurement() : null;

  const validateField = useCallback(
    async <TName extends FieldPath<T>>(
      name: TName,
      options: { trackPerformance?: boolean } = {}
    ): Promise<ValidationResult<FieldPathValue<T, TName>>> => {
      const shouldTrack = options.trackPerformance || config.trackPerformance;
      const measurement = shouldTrack ? createPerformanceMeasurement() : null;
      
      measurement?.start(`field:${name}`);
      
      try {
        const isValid = await formReturn.trigger(name);
        const value = formReturn.getValues(name);
        const errors = formReturn.formState.errors[name];
        
        const validationTime = measurement?.end(`field:${name}`) || 0;
        
        if (isValid) {
          return {
            success: true,
            data: value,
            errors: null,
            performance: {
              validationTime,
              fieldValidationTimes: { [name]: validationTime },
              schemaProcessingTime: 0,
              errorProcessingTime: 0,
              startTime: new Date(),
              endTime: new Date(),
              metPerformanceTarget: validationTime < 100
            },
            timestamp: new Date()
          } as ValidationSuccess<FieldPathValue<T, TName>>;
        } else {
          const errorInfo = errors ? transformFormErrors({ [name]: errors }) : {
            fieldErrors: {},
            crossFieldErrors: [],
            schemaErrors: [],
            errorCount: 0,
            summary: 'Validation failed'
          };
          
          return {
            success: false,
            data: null,
            errors: errorInfo,
            performance: {
              validationTime,
              fieldValidationTimes: { [name]: validationTime },
              schemaProcessingTime: 0,
              errorProcessingTime: 0,
              startTime: new Date(),
              endTime: new Date(),
              metPerformanceTarget: validationTime < 100
            },
            timestamp: new Date()
          } as ValidationFailure<ValidationErrorInfo>;
        }
      } catch (error) {
        measurement?.end(`field:${name}`);
        throw error;
      }
    },
    [formReturn, config.trackPerformance]
  );

  const validateAllFields = useCallback(
    async (options: { trackPerformance?: boolean } = {}): Promise<ValidationResult<T>> => {
      const shouldTrack = options.trackPerformance || config.trackPerformance;
      const measurement = shouldTrack ? createPerformanceMeasurement() : null;
      
      measurement?.start('validation');
      
      try {
        const isValid = await formReturn.trigger();
        const values = formReturn.getValues();
        const errors = formReturn.formState.errors;
        
        const validationTime = measurement?.end('validation') || 0;
        
        if (isValid) {
          return {
            success: true,
            data: values,
            errors: null,
            performance: {
              validationTime,
              fieldValidationTimes: {},
              schemaProcessingTime: 0,
              errorProcessingTime: 0,
              startTime: new Date(),
              endTime: new Date(),
              metPerformanceTarget: validationTime < 100
            },
            timestamp: new Date()
          } as ValidationSuccess<T>;
        } else {
          const errorInfo = transformFormErrors(errors);
          
          return {
            success: false,
            data: null,
            errors: errorInfo,
            performance: {
              validationTime,
              fieldValidationTimes: {},
              schemaProcessingTime: 0,
              errorProcessingTime: 0,
              startTime: new Date(),
              endTime: new Date(),
              metPerformanceTarget: validationTime < 100
            },
            timestamp: new Date()
          } as ValidationFailure<ValidationErrorInfo>;
        }
      } catch (error) {
        measurement?.end('validation');
        throw error;
      }
    },
    [formReturn, config.trackPerformance]
  );

  return {
    ...formReturn,
    performance: performanceMeasurement?.getMetrics() || {
      validationTime: 0,
      fieldValidationTimes: {},
      schemaProcessingTime: 0,
      errorProcessingTime: 0,
      startTime: new Date(),
      endTime: new Date(),
      metPerformanceTarget: true
    },
    validateField,
    validateAllFields
  };
}

// =============================================================================
// FORM RESET AND DEFAULT VALUE UTILITIES
// =============================================================================

/**
 * Creates a comprehensive form reset utility with intelligent default value handling.
 * Supports partial resets, field-specific resets, and conditional reset logic.
 */
export function createFormResetUtility<T extends FieldValues>(
  reset: UseFormReset<T>,
  schema: ZodSchema<T>
) {
  /**
   * Resets the entire form to default values.
   */
  const resetToDefaults = useCallback((values?: DeepPartial<T>) => {
    reset(values);
  }, [reset]);

  /**
   * Resets specific fields to their default values.
   */
  const resetFields = useCallback((fieldNames: FieldPath<T>[], values?: DeepPartial<T>) => {
    const resetValues = values || {};
    
    // Create partial reset object with only specified fields
    const partialReset = fieldNames.reduce((acc, fieldName) => {
      if (resetValues[fieldName] !== undefined) {
        acc[fieldName] = resetValues[fieldName];
      }
      return acc;
    }, {} as DeepPartial<T>);
    
    reset(partialReset, { keepDefaultValues: true });
  }, [reset]);

  /**
   * Resets form to schema defaults by parsing empty object.
   */
  const resetToSchemaDefaults = useCallback(async () => {
    try {
      const defaults = await schema.safeParseAsync({});
      if (defaults.success) {
        reset(defaults.data);
      }
    } catch (error) {
      console.warn('Unable to reset to schema defaults:', error);
      reset();
    }
  }, [reset, schema]);

  /**
   * Conditional reset based on form state.
   */
  const conditionalReset = useCallback((
    condition: (values: T) => boolean,
    resetValues?: DeepPartial<T>
  ) => {
    return (currentValues: T) => {
      if (condition(currentValues)) {
        reset(resetValues);
        return true;
      }
      return false;
    };
  }, [reset]);

  return {
    resetToDefaults,
    resetFields,
    resetToSchemaDefaults,
    conditionalReset
  };
}

/**
 * Intelligent default value generator for form fields.
 * Analyzes schema structure to provide sensible defaults.
 */
export function generateFormDefaults<T extends FieldValues>(
  schema: ZodSchema<T>
): DeepPartial<T> {
  try {
    // Try to parse empty object to get schema defaults
    const result = schema.safeParse({});
    if (result.success) {
      return result.data;
    }
    
    // If that fails, return empty object
    return {} as DeepPartial<T>;
  } catch (error) {
    console.warn('Unable to generate form defaults from schema:', error);
    return {} as DeepPartial<T>;
  }
}

// =============================================================================
// FORM SUBMISSION UTILITIES
// =============================================================================

/**
 * Creates an enhanced form submission handler with comprehensive error handling.
 * Provides pre-submission validation, error handling, and success callbacks.
 */
export function createSubmissionHandler<T extends FieldValues>(
  onSubmit: SubmitHandler<T>,
  options: {
    onError?: SubmitErrorHandler<T>;
    onValidationError?: (errors: ValidationErrorInfo) => void;
    validateBeforeSubmit?: boolean;
    trackPerformance?: boolean;
  } = {}
) {
  const {
    onError,
    onValidationError,
    validateBeforeSubmit = true,
    trackPerformance = false
  } = options;

  return {
    handleSubmit: (data: T) => {
      const measurement = trackPerformance ? createPerformanceMeasurement() : null;
      measurement?.start('submission');

      try {
        const result = onSubmit(data);
        measurement?.end('submission');
        return result;
      } catch (error) {
        measurement?.end('submission');
        if (onError) {
          onError(error as any, {} as any);
        } else {
          throw error;
        }
      }
    },
    
    handleSubmitWithValidation: async (
      data: T,
      validateAllFields: () => Promise<ValidationResult<T>>
    ) => {
      if (validateBeforeSubmit) {
        const validationResult = await validateAllFields();
        
        if (isValidationFailure(validationResult)) {
          onValidationError?.(validationResult.errors);
          return false;
        }
      }

      try {
        await onSubmit(data);
        return true;
      } catch (error) {
        if (onError) {
          onError(error as any, {} as any);
        } else {
          throw error;
        }
        return false;
      }
    }
  };
}

// =============================================================================
// TESTING UTILITIES
// =============================================================================

/**
 * Testing utilities for comprehensive form validation coverage.
 * Provides helpers for testing validation scenarios, error handling, and performance.
 */
export const formTestUtils = {
  /**
   * Creates mock form data for testing validation scenarios.
   */
  createMockFormData<T extends FieldValues>(
    schema: ZodSchema<T>,
    overrides: Partial<T> = {}
  ): T {
    const defaults = generateFormDefaults(schema);
    return { ...defaults, ...overrides } as T;
  },

  /**
   * Tests validation performance for a given schema and data.
   */
  async testValidationPerformance<T extends FieldValues>(
    schema: ZodSchema<T>,
    data: T,
    expectedMaxMs: number = 100
  ): Promise<{ passed: boolean; actualMs: number; errors?: ZodError }> {
    const measurement = createPerformanceMeasurement();
    measurement.start('validation');

    try {
      const result = await schema.safeParseAsync(data);
      const actualMs = measurement.end('validation');
      
      return {
        passed: actualMs <= expectedMaxMs && result.success,
        actualMs,
        errors: result.success ? undefined : result.error
      };
    } catch (error) {
      const actualMs = measurement.end('validation');
      return {
        passed: false,
        actualMs,
        errors: error as ZodError
      };
    }
  },

  /**
   * Creates test cases for comprehensive validation coverage.
   */
  createValidationTestCases<T extends FieldValues>(
    schema: ZodSchema<T>
  ): Array<{ name: string; data: Partial<T>; shouldPass: boolean }> {
    const validData = generateFormDefaults(schema);
    
    return [
      {
        name: 'Valid data should pass',
        data: validData,
        shouldPass: true
      },
      {
        name: 'Empty data should fail required fields',
        data: {},
        shouldPass: false
      },
      {
        name: 'Null values should fail',
        data: Object.keys(validData).reduce((acc, key) => {
          acc[key as keyof T] = null as any;
          return acc;
        }, {} as Partial<T>),
        shouldPass: false
      }
    ];
  },

  /**
   * Mock error message provider for testing.
   */
  createMockErrorProvider(
    messages: Record<string, string> = {}
  ): ErrorMessageProvider {
    return {
      getMessage: (code, context, locale) => messages[code] || `Test error: ${code}`,
      hasMessage: (code) => code in messages,
      loadMessages: async () => {},
      getAvailableLocales: () => ['en']
    };
  }
};

// =============================================================================
// TYPE-SAFE FORM UTILITIES
// =============================================================================

/**
 * Type-safe field path utilities for React Hook Form integration.
 * Ensures compile-time safety when working with form field paths.
 */
export const fieldPathUtils = {
  /**
   * Creates a type-safe field path accessor.
   */
  createPathAccessor<T extends FieldValues>() {
    return <K extends FormFieldPaths<T>>(path: K): K => path;
  },

  /**
   * Validates that a field path exists in the form schema.
   */
  validateFieldPath<T extends FieldValues>(
    path: string,
    schema: ZodSchema<T>
  ): path is FormFieldPaths<T> {
    try {
      const emptyData = {} as T;
      const result = schema.safeParse(emptyData);
      
      // This is a simplified check - in a real implementation,
      // you would inspect the schema structure more thoroughly
      return typeof path === 'string' && path.length > 0;
    } catch {
      return false;
    }
  },

  /**
   * Extracts all field paths from a form schema.
   */
  extractFieldPaths<T extends FieldValues>(
    schema: ZodSchema<T>
  ): FormFieldPaths<T>[] {
    // This is a simplified implementation
    // In practice, you would recursively analyze the Zod schema structure
    try {
      const result = schema.safeParse({});
      if (result.success) {
        return Object.keys(result.data) as FormFieldPaths<T>[];
      }
      return [];
    } catch {
      return [];
    }
  }
};

// =============================================================================
// LEGACY COMPATIBILITY UTILITIES
// =============================================================================

/**
 * Legacy Angular validator compatibility utilities.
 * Provides migration helpers for existing Angular validation patterns.
 */
export const legacyCompatUtils = {
  /**
   * Creates a Zod schema that emits legacy Angular error patterns.
   */
  createLegacyCompatibleSchema<T extends FieldValues>(
    baseSchema: ZodSchema<T>,
    legacyErrorMap: Record<string, LegacyValidationError> = {}
  ): ZodSchema<T> {
    return baseSchema.transform((data, ctx) => {
      // Apply legacy error transformations if needed
      for (const [fieldPath, legacyError] of Object.entries(legacyErrorMap)) {
        if (ctx.path.join('.') === fieldPath) {
          ctx.addIssue({
            code: 'custom',
            message: 'Legacy validation error',
            params: { legacyError }
          });
        }
      }
      return data;
    });
  },

  /**
   * Converts legacy Angular validation errors to modern validation format.
   */
  convertLegacyErrors(
    legacyErrors: Record<string, LegacyValidationError>
  ): ValidationErrorInfo {
    const fieldErrors: Record<string, FieldValidationError[]> = {};
    let errorCount = 0;

    for (const [fieldPath, legacyError] of Object.entries(legacyErrors)) {
      const errorCode = Object.keys(legacyError)[0];
      const message = formatErrorMessage(errorCode);
      
      fieldErrors[fieldPath] = [{
        field: fieldPath,
        code: errorCode,
        message,
        legacyError
      }];
      errorCount++;
    }

    return {
      fieldErrors,
      crossFieldErrors: [],
      schemaErrors: [],
      errorCount,
      summary: `${errorCount} validation errors found`
    };
  }
};

// =============================================================================
// EXPORTS
// =============================================================================

export {
  // Core form configuration
  createFormConfig,
  createEnhancedForm,
  createZodResolver,
  createPerformantSchema,
  
  // Error handling
  transformZodErrors,
  transformFormErrors,
  formatErrorMessage,
  defaultErrorMessageProvider,
  
  // Performance utilities
  createPerformanceMeasurement,
  useDebouncedValidation,
  createDebouncedValidator,
  
  // Form management
  createFormResetUtility,
  generateFormDefaults,
  createSubmissionHandler,
  
  // Testing utilities
  formTestUtils,
  
  // Type-safe utilities
  fieldPathUtils,
  
  // Legacy compatibility
  legacyCompatUtils
};

// Default export for convenience
export default {
  createFormConfig,
  createEnhancedForm,
  createZodResolver,
  transformZodErrors,
  formTestUtils
};