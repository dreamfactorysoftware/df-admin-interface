/**
 * @fileoverview TypeScript type definitions for the validation system
 * 
 * This module provides comprehensive type safety for all validation operations
 * while supporting React Hook Form integration and Zod schema inference patterns.
 * Maintains compatibility with existing Angular validation error patterns while
 * enabling modern React/TypeScript validation workflows.
 * 
 * @version 1.0.0
 * @since React 19 / Next.js 15.1 migration
 */

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
  Resolver
} from 'react-hook-form';
import type { ZodSchema, ZodType, ZodTypeDef, infer as ZodInfer } from 'zod';

// =============================================================================
// LEGACY ANGULAR VALIDATION ERROR PATTERNS
// =============================================================================

/**
 * Angular-compatible validation error object for field matching validation.
 * Maintains exact structure from matchValidator for backward compatibility.
 * 
 * @see {@link https://github.com/dreamfactorysoftware/df-admin-interface/blob/main/src/app/shared/validators/match.validator.ts}
 */
export interface DoesNotMatchError {
  readonly doesNotMatch: true;
}

/**
 * Angular-compatible validation error object for unique name validation in arrays.
 * Maintains exact structure from uniqueNameValidator for backward compatibility.
 * 
 * @see {@link https://github.com/dreamfactorysoftware/df-admin-interface/blob/main/src/app/shared/validators/unique-name.validator.ts}
 */
export interface NotUniqueError {
  readonly notUnique: true;
}

/**
 * Angular-compatible validation error object for JSON syntax validation.
 * Maintains exact structure from JsonValidator for backward compatibility.
 * 
 * @see {@link https://github.com/dreamfactorysoftware/df-admin-interface/blob/main/src/app/shared/validators/json.validator.ts}
 */
export interface JsonInvalidError {
  readonly jsonInvalid: true;
}

/**
 * Union type of all legacy Angular validation error patterns.
 * Preserves existing error handling while enabling type-safe validation.
 */
export type LegacyValidationError = 
  | DoesNotMatchError 
  | NotUniqueError 
  | JsonInvalidError;

// =============================================================================
// ZOD SCHEMA INTEGRATION TYPES
// =============================================================================

/**
 * Type utility for extracting inferred types from Zod schemas.
 * Provides compile-time type inference for form values based on validation schemas.
 * 
 * @template T - The Zod schema type
 * 
 * @example
 * ```typescript
 * const userSchema = z.object({
 *   name: z.string(),
 *   email: z.string().email()
 * });
 * 
 * type UserFormData = ZodInferredType<typeof userSchema>;
 * // Results in: { name: string; email: string }
 * ```
 */
export type ZodInferredType<T extends ZodType<any, any, any>> = ZodInfer<T>;

/**
 * Enhanced Zod schema type that includes runtime validation performance metadata.
 * Extends base Zod schemas with validation timing requirements per Section 3.2.3.
 * 
 * @template TOutput - The output type after successful validation
 * @template TDef - The Zod schema definition type
 * @template TInput - The input type before validation
 */
export interface PerformantZodSchema<
  TOutput = any,
  TDef extends ZodTypeDef = ZodTypeDef,
  TInput = TOutput
> extends ZodType<TOutput, TDef, TInput> {
  /**
   * Maximum allowed validation time in milliseconds.
   * Must be under 100ms per real-time validation requirements.
   */
  readonly maxValidationTime: 100;
  
  /**
   * Schema complexity indicator for performance optimization.
   * Higher values may require debouncing or async validation.
   */
  readonly complexityScore: 'low' | 'medium' | 'high';
}

/**
 * Configuration options for Zod schema validators in React Hook Form context.
 * Optimizes validation performance while maintaining comprehensive error handling.
 */
export interface ZodValidatorConfig {
  /**
   * Schema to use for validation with performance constraints.
   */
  readonly schema: PerformantZodSchema;
  
  /**
   * Enable debouncing for real-time validation to meet 100ms requirement.
   * @default true
   */
  readonly enableDebouncing?: boolean;
  
  /**
   * Debounce delay in milliseconds for real-time validation.
   * @default 300
   */
  readonly debounceMs?: number;
  
  /**
   * Custom error message mapping for localized user feedback.
   */
  readonly errorMap?: Record<string, string>;
  
  /**
   * Enable validation performance tracking for optimization.
   * @default false
   */
  readonly trackPerformance?: boolean;
}

// =============================================================================
// VALIDATION RESULT TYPES
// =============================================================================

/**
 * Comprehensive validation result with success/failure states and detailed error information.
 * Supports both synchronous and asynchronous validation patterns.
 * 
 * @template TData - The validated data type on success
 * @template TError - The error type on failure
 */
export type ValidationResult<TData = unknown, TError = ValidationErrorInfo> = 
  | ValidationSuccess<TData>
  | ValidationFailure<TError>;

/**
 * Successful validation result with validated data and performance metrics.
 * 
 * @template TData - The type of the successfully validated data
 */
export interface ValidationSuccess<TData = unknown> {
  readonly success: true;
  readonly data: TData;
  readonly errors: null;
  readonly performance: ValidationPerformanceMetrics;
  readonly timestamp: Date;
}

/**
 * Failed validation result with comprehensive error information and user feedback.
 * 
 * @template TError - The type of error information
 */
export interface ValidationFailure<TError = ValidationErrorInfo> {
  readonly success: false;
  readonly data: null;
  readonly errors: TError;
  readonly performance: ValidationPerformanceMetrics;
  readonly timestamp: Date;
}

/**
 * Detailed validation error information with field-level precision.
 * Supports both legacy Angular error patterns and modern Zod error structures.
 */
export interface ValidationErrorInfo {
  /**
   * Field-specific errors mapped by field path.
   */
  readonly fieldErrors: Record<string, FieldValidationError[]>;
  
  /**
   * Cross-field validation errors that affect multiple fields.
   */
  readonly crossFieldErrors: CrossFieldValidationError[];
  
  /**
   * Schema-level validation errors for structural validation failures.
   */
  readonly schemaErrors: SchemaValidationError[];
  
  /**
   * Total number of validation errors across all fields.
   */
  readonly errorCount: number;
  
  /**
   * User-friendly error summary for display purposes.
   */
  readonly summary: string;
}

/**
 * Individual field validation error with legacy Angular compatibility.
 * Maintains existing error patterns while providing enhanced error context.
 */
export interface FieldValidationError {
  /**
   * Field path that failed validation.
   */
  readonly field: string;
  
  /**
   * Error code for programmatic handling.
   */
  readonly code: string;
  
  /**
   * User-friendly error message for display.
   */
  readonly message: string;
  
  /**
   * Legacy Angular error object for backward compatibility.
   */
  readonly legacyError?: LegacyValidationError;
  
  /**
   * Additional error context for debugging.
   */
  readonly context?: Record<string, unknown>;
}

/**
 * Cross-field validation error for validating relationships between fields.
 * Supports scenarios like password confirmation and conditional field validation.
 */
export interface CrossFieldValidationError {
  /**
   * Array of field paths involved in the cross-field validation.
   */
  readonly fields: string[];
  
  /**
   * Error code for programmatic handling.
   */
  readonly code: string;
  
  /**
   * User-friendly error message for display.
   */
  readonly message: string;
  
  /**
   * The type of cross-field validation that failed.
   */
  readonly type: 'match' | 'conditional' | 'dependent' | 'exclusive';
}

/**
 * Schema-level validation error for structural validation failures.
 * Handles errors that affect the entire form or data structure.
 */
export interface SchemaValidationError {
  /**
   * Error code for programmatic handling.
   */
  readonly code: string;
  
  /**
   * User-friendly error message for display.
   */
  readonly message: string;
  
  /**
   * The path in the schema where validation failed.
   */
  readonly schemaPath: string;
  
  /**
   * Additional error context for debugging.
   */
  readonly context?: Record<string, unknown>;
}

// =============================================================================
// REACT HOOK FORM INTEGRATION TYPES
// =============================================================================

/**
 * Enhanced form configuration for React Hook Form with Zod integration.
 * Provides type-safe form setup with validation resolvers and performance optimization.
 * 
 * @template TFieldValues - The form field values type
 * @template TContext - Additional form context type
 */
export interface FormConfig<
  TFieldValues extends FieldValues = FieldValues,
  TContext = any
> {
  /**
   * Zod schema for form validation with performance constraints.
   */
  readonly schema: PerformantZodSchema<TFieldValues>;
  
  /**
   * Default values for form initialization.
   */
  readonly defaultValues?: Partial<TFieldValues>;
  
  /**
   * Form validation mode for optimal user experience.
   * @default 'onTouched'
   */
  readonly mode?: 'onSubmit' | 'onBlur' | 'onChange' | 'onTouched' | 'all';
  
  /**
   * Re-validation mode after successful submission.
   * @default 'onChange'
   */
  readonly reValidateMode?: 'onSubmit' | 'onBlur' | 'onChange';
  
  /**
   * Additional form context for validation and processing.
   */
  readonly context?: TContext;
  
  /**
   * Custom resolver for advanced validation scenarios.
   */
  readonly resolver?: Resolver<TFieldValues, TContext>;
  
  /**
   * Enable validation performance tracking.
   * @default false
   */
  readonly trackPerformance?: boolean;
}

/**
 * Enhanced React Hook Form return type with validation performance tracking.
 * Extends the standard useForm return with additional validation utilities.
 * 
 * @template TFieldValues - The form field values type
 * @template TContext - Additional form context type
 */
export interface EnhancedFormReturn<
  TFieldValues extends FieldValues = FieldValues,
  TContext = any
> extends UseFormReturn<TFieldValues, TContext> {
  /**
   * Validation performance metrics for optimization.
   */
  readonly performance: ValidationPerformanceMetrics;
  
  /**
   * Utility to validate a single field with performance tracking.
   */
  readonly validateField: <TName extends FieldPath<TFieldValues>>(
    name: TName,
    options?: { trackPerformance?: boolean }
  ) => Promise<ValidationResult<FieldPathValue<TFieldValues, TName>>>;
  
  /**
   * Utility to validate all fields with batch performance tracking.
   */
  readonly validateAllFields: (
    options?: { trackPerformance?: boolean }
  ) => Promise<ValidationResult<TFieldValues>>;
}

// =============================================================================
// GENERIC VALIDATION UTILITIES
// =============================================================================

/**
 * Generic field validator function with performance constraints.
 * Supports both synchronous and asynchronous validation patterns.
 * 
 * @template TValue - The type of value being validated
 * @template TContext - Additional validation context type
 */
export type FieldValidator<TValue = any, TContext = any> = (
  value: TValue,
  context?: TContext
) => ValidationResult<TValue> | Promise<ValidationResult<TValue>>;

/**
 * Generic cross-field validator for validating relationships between fields.
 * Enables complex validation scenarios like conditional field requirements.
 * 
 * @template TFieldValues - The form field values type
 * @template TContext - Additional validation context type
 */
export type CrossFieldValidator<
  TFieldValues extends FieldValues = FieldValues,
  TContext = any
> = (
  values: TFieldValues,
  context?: TContext
) => ValidationResult<TFieldValues> | Promise<ValidationResult<TFieldValues>>;

/**
 * Configuration for array field validation with unique constraint checking.
 * Supports dynamic form arrays with duplicate prevention.
 * 
 * @template TItem - The type of array item
 */
export interface ArrayValidationConfig<TItem = any> {
  /**
   * Field name to check for uniqueness within the array.
   * @default 'name'
   */
  readonly uniqueField?: keyof TItem;
  
  /**
   * Custom comparison function for uniqueness checking.
   */
  readonly compareFunction?: (a: TItem, b: TItem) => boolean;
  
  /**
   * Minimum number of items required in the array.
   */
  readonly minItems?: number;
  
  /**
   * Maximum number of items allowed in the array.
   */
  readonly maxItems?: number;
  
  /**
   * Enable performance tracking for array validation.
   * @default false
   */
  readonly trackPerformance?: boolean;
}

// =============================================================================
// ERROR MESSAGE AND LOCALIZATION TYPES
// =============================================================================

/**
 * Localized error message configuration for consistent user feedback.
 * Supports internationalization and context-aware error messaging.
 */
export interface ErrorMessageConfig {
  /**
   * Default error messages for common validation failures.
   */
  readonly defaultMessages: Record<string, string>;
  
  /**
   * Field-specific error message overrides.
   */
  readonly fieldMessages?: Record<string, Record<string, string>>;
  
  /**
   * Current locale for error message display.
   * @default 'en'
   */
  readonly locale?: string;
  
  /**
   * Fallback locale if message not found in current locale.
   * @default 'en'
   */
  readonly fallbackLocale?: string;
}

/**
 * Error message formatter function for dynamic error text generation.
 * Enables context-aware error messages with variable interpolation.
 * 
 * @param errorCode - The validation error code
 * @param context - Additional context for error message generation
 * @param locale - Target locale for error message
 * @returns Formatted error message string
 */
export type ErrorMessageFormatter = (
  errorCode: string,
  context?: Record<string, unknown>,
  locale?: string
) => string;

/**
 * Error message provider interface for centralized error message management.
 * Supports dynamic loading and caching of localized error messages.
 */
export interface ErrorMessageProvider {
  /**
   * Get localized error message for the specified error code.
   */
  getMessage(
    errorCode: string, 
    context?: Record<string, unknown>, 
    locale?: string
  ): string;
  
  /**
   * Check if error message exists for the specified error code and locale.
   */
  hasMessage(errorCode: string, locale?: string): boolean;
  
  /**
   * Load error messages for the specified locale.
   */
  loadMessages(locale: string): Promise<void>;
  
  /**
   * Get all available locales for error messages.
   */
  getAvailableLocales(): string[];
}

// =============================================================================
// VALIDATION PERFORMANCE TYPES
// =============================================================================

/**
 * Comprehensive validation performance metrics for optimization and monitoring.
 * Tracks validation timing to ensure 100ms real-time validation requirements.
 */
export interface ValidationPerformanceMetrics {
  /**
   * Total validation time in milliseconds.
   * Must be under 100ms per real-time validation requirements.
   */
  readonly validationTime: number;
  
  /**
   * Individual field validation times for performance analysis.
   */
  readonly fieldValidationTimes: Record<string, number>;
  
  /**
   * Schema parsing and compilation time.
   */
  readonly schemaProcessingTime: number;
  
  /**
   * Error message generation and formatting time.
   */
  readonly errorProcessingTime: number;
  
  /**
   * Timestamp when validation started.
   */
  readonly startTime: Date;
  
  /**
   * Timestamp when validation completed.
   */
  readonly endTime: Date;
  
  /**
   * Whether validation met the 100ms performance requirement.
   */
  readonly metPerformanceTarget: boolean;
  
  /**
   * Additional performance metadata for debugging.
   */
  readonly metadata?: Record<string, unknown>;
}

/**
 * Performance tracking configuration for validation optimization.
 * Enables detailed performance monitoring and alerting.
 */
export interface PerformanceTrackingConfig {
  /**
   * Enable detailed performance tracking.
   * @default false
   */
  readonly enabled: boolean;
  
  /**
   * Performance threshold in milliseconds for warnings.
   * @default 80
   */
  readonly warningThreshold: number;
  
  /**
   * Performance threshold in milliseconds for errors.
   * @default 100
   */
  readonly errorThreshold: number;
  
  /**
   * Callback function for performance threshold violations.
   */
  readonly onThresholdViolation?: (metrics: ValidationPerformanceMetrics) => void;
  
  /**
   * Include detailed field-level timing information.
   * @default true
   */
  readonly includeFieldTiming: boolean;
  
  /**
   * Sample rate for performance tracking (0.0 to 1.0).
   * @default 1.0
   */
  readonly sampleRate: number;
}

/**
 * Performance measurement utility for validation timing analysis.
 * Provides high-precision timing measurements for validation optimization.
 */
export interface PerformanceMeasurement {
  /**
   * Start performance measurement for validation operation.
   */
  start(operationName: string): void;
  
  /**
   * End performance measurement and return metrics.
   */
  end(operationName: string): number;
  
  /**
   * Get current performance metrics for all measured operations.
   */
  getMetrics(): ValidationPerformanceMetrics;
  
  /**
   * Reset all performance measurements.
   */
  reset(): void;
  
  /**
   * Check if operation met performance target.
   */
  metTarget(operationName: string, targetMs: number): boolean;
}

// =============================================================================
// UTILITY TYPES FOR TYPE SAFETY
// =============================================================================

/**
 * Utility type to extract field paths from a form values type.
 * Enables type-safe field validation and error handling.
 * 
 * @template T - The form values type
 */
export type FormFieldPaths<T extends FieldValues> = Path<T>;

/**
 * Utility type to extract field value type for a given field path.
 * Provides compile-time type safety for field value operations.
 * 
 * @template T - The form values type
 * @template P - The field path
 */
export type FormFieldValue<T extends FieldValues, P extends Path<T>> = PathValue<T, P>;

/**
 * Utility type to create validation error objects with proper typing.
 * Ensures type safety when creating validation errors for specific fields.
 * 
 * @template T - The form values type
 */
export type ValidationErrors<T extends FieldValues> = Partial<
  Record<FormFieldPaths<T>, FieldValidationError[]>
>;

/**
 * Utility type for creating type-safe validation schemas.
 * Ensures schema output type matches form values type.
 * 
 * @template T - The form values type
 */
export type TypedValidationSchema<T extends FieldValues> = ZodSchema<T>;

/**
 * Utility type for validation function signatures with proper typing.
 * Ensures validation functions accept and return properly typed values.
 * 
 * @template T - The form values type
 * @template F - The specific field type
 */
export type TypedFieldValidator<T extends FieldValues, F extends FormFieldPaths<T>> = (
  value: FormFieldValue<T, F>,
  allValues?: T
) => ValidationResult<FormFieldValue<T, F>>;

// =============================================================================
// TYPE GUARDS AND ASSERTIONS
// =============================================================================

/**
 * Type guard to check if a validation result represents success.
 * Enables type-safe handling of validation results.
 * 
 * @param result - The validation result to check
 * @returns True if the result represents successful validation
 */
export const isValidationSuccess = <TData, TError>(
  result: ValidationResult<TData, TError>
): result is ValidationSuccess<TData> => {
  return result.success === true;
};

/**
 * Type guard to check if a validation result represents failure.
 * Enables type-safe handling of validation errors.
 * 
 * @param result - The validation result to check
 * @returns True if the result represents failed validation
 */
export const isValidationFailure = <TData, TError>(
  result: ValidationResult<TData, TError>
): result is ValidationFailure<TError> => {
  return result.success === false;
};

/**
 * Type guard to check if an error object is a legacy Angular validation error.
 * Enables backward compatibility with existing error handling patterns.
 * 
 * @param error - The error object to check
 * @returns True if the error is a legacy Angular validation error
 */
export const isLegacyValidationError = (
  error: unknown
): error is LegacyValidationError => {
  return (
    typeof error === 'object' &&
    error !== null &&
    (
      'doesNotMatch' in error ||
      'notUnique' in error ||
      'jsonInvalid' in error
    )
  );
};