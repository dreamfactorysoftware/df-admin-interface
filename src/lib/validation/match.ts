/**
 * @fileoverview Password matching validation utility for React Hook Form
 * 
 * This module provides cross-field validation for password confirmation fields using
 * Zod schema refinement patterns. Migrated from Angular matchValidator while maintaining
 * exact functionality and error structure for backward compatibility.
 * 
 * Key Features:
 * - Zod schema refinement for cross-field validation
 * - React Hook Form integration with watch() functionality
 * - TypeScript generics for flexible field name configuration
 * - Maintains { doesNotMatch: true } error structure
 * - Sub-100ms validation performance optimization
 * 
 * @version 1.0.0
 * @since React 19 / Next.js 15.1 migration
 * @see {@link https://github.com/dreamfactorysoftware/df-admin-interface/blob/main/src/app/shared/validators/match.validator.ts}
 */

import { z } from 'zod';
import type { 
  FieldValues, 
  Path, 
  UseFormWatch,
  FieldErrors,
  FieldPath
} from 'react-hook-form';
import type { 
  DoesNotMatchError,
  ValidationResult,
  ValidationSuccess,
  ValidationFailure,
  ValidationPerformanceMetrics,
  CrossFieldValidator,
  FieldValidator
} from './types';

// =============================================================================
// TYPE DEFINITIONS
// =============================================================================

/**
 * Configuration options for match validation with flexible field naming.
 * Supports various field matching scenarios beyond password confirmation.
 * 
 * @template TFieldValues - The form field values type
 */
export interface MatchValidationConfig<TFieldValues extends FieldValues = FieldValues> {
  /**
   * Primary field name to match against.
   * @example 'password' for password confirmation scenarios
   */
  readonly fieldToMatch: Path<TFieldValues>;
  
  /**
   * Target field name that should match the primary field.
   * @example 'confirmPassword' for password confirmation scenarios
   */
  readonly targetField: Path<TFieldValues>;
  
  /**
   * Custom error message for validation failure.
   * @default 'Fields do not match'
   */
  readonly errorMessage?: string;
  
  /**
   * Enable case-sensitive matching.
   * @default true
   */
  readonly caseSensitive?: boolean;
  
  /**
   * Trim whitespace before comparison.
   * @default false
   */
  readonly trimWhitespace?: boolean;
  
  /**
   * Enable validation performance tracking.
   * @default false
   */
  readonly trackPerformance?: boolean;
}

/**
 * Result type for match validation operations.
 * Maintains compatibility with existing error handling patterns.
 */
export type MatchValidationResult = ValidationResult<true, DoesNotMatchError>;

/**
 * Generic match validator function signature for type safety.
 * 
 * @template TFieldValues - The form field values type
 */
export type MatchValidator<TFieldValues extends FieldValues = FieldValues> = 
  CrossFieldValidator<TFieldValues, MatchValidationConfig<TFieldValues>>;

// =============================================================================
// ZOD SCHEMA REFINEMENT UTILITIES
// =============================================================================

/**
 * Creates a Zod schema refinement for cross-field matching validation.
 * Provides the primary integration point for schema-based validation.
 * 
 * @template TFieldValues - The form field values type
 * @param config - Match validation configuration
 * @returns Zod schema refinement function
 * 
 * @example
 * ```typescript
 * const passwordSchema = z.object({
 *   password: z.string().min(8),
 *   confirmPassword: z.string()
 * }).refine(...createMatchRefinement({
 *   fieldToMatch: 'password',
 *   targetField: 'confirmPassword'
 * }));
 * ```
 */
export function createMatchRefinement<TFieldValues extends FieldValues = FieldValues>(
  config: MatchValidationConfig<TFieldValues>
): [(data: TFieldValues) => boolean, { message: string; path: [Path<TFieldValues>] }] {
  const startTime = performance.now();
  
  const refinementFn = (data: TFieldValues): boolean => {
    const primaryValue = data[config.fieldToMatch];
    const targetValue = data[config.targetField];
    
    // Handle null/undefined values consistently
    if (primaryValue == null && targetValue == null) {
      return true;
    }
    
    if (primaryValue == null || targetValue == null) {
      return false;
    }
    
    // Convert to strings for comparison
    let primaryStr = String(primaryValue);
    let targetStr = String(targetValue);
    
    // Apply transformations if configured
    if (config.trimWhitespace) {
      primaryStr = primaryStr.trim();
      targetStr = targetStr.trim();
    }
    
    // Perform comparison based on case sensitivity
    if (config.caseSensitive === false) {
      return primaryStr.toLowerCase() === targetStr.toLowerCase();
    }
    
    return primaryStr === targetStr;
  };
  
  const refinementConfig = {
    message: config.errorMessage || 'Fields do not match',
    path: [config.targetField] as [Path<TFieldValues>]
  };
  
  // Performance tracking for optimization
  if (config.trackPerformance) {
    const endTime = performance.now();
    const duration = endTime - startTime;
    
    if (duration > 100) {
      console.warn(`Match validation refinement creation exceeded 100ms: ${duration}ms`);
    }
  }
  
  return [refinementFn, refinementConfig];
}

/**
 * Creates a complete Zod schema with match validation for common password scenarios.
 * Provides a ready-to-use schema for password confirmation forms.
 * 
 * @param passwordFieldName - Name of the password field (default: 'password')
 * @param confirmFieldName - Name of the confirmation field (default: 'confirmPassword')
 * @param passwordMinLength - Minimum password length (default: 8)
 * @returns Complete Zod schema with password matching validation
 * 
 * @example
 * ```typescript
 * const schema = createPasswordMatchSchema();
 * const { register, handleSubmit } = useForm({
 *   resolver: zodResolver(schema)
 * });
 * ```
 */
export function createPasswordMatchSchema(
  passwordFieldName: string = 'password',
  confirmFieldName: string = 'confirmPassword',
  passwordMinLength: number = 8
) {
  const baseSchema = z.object({
    [passwordFieldName]: z.string()
      .min(passwordMinLength, `Password must be at least ${passwordMinLength} characters`)
      .regex(
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).*$/,
        'Password must contain at least one lowercase letter, one uppercase letter, and one number'
      ),
    [confirmFieldName]: z.string()
  });
  
  return baseSchema.refine(
    (data) => data[passwordFieldName] === data[confirmFieldName],
    {
      message: 'Password confirmation does not match',
      path: [confirmFieldName]
    }
  );
}

// =============================================================================
// REACT HOOK FORM INTEGRATION UTILITIES
// =============================================================================

/**
 * Creates a React Hook Form custom validation function using watch() for real-time updates.
 * Provides the primary integration for React Hook Form's validation system.
 * 
 * @template TFieldValues - The form field values type
 * @param watch - React Hook Form watch function from useForm()
 * @param config - Match validation configuration
 * @returns Validation function compatible with React Hook Form
 * 
 * @example
 * ```typescript
 * const { register, watch, formState: { errors } } = useForm();
 * const validateConfirmPassword = createMatchValidator(watch, {
 *   fieldToMatch: 'password',
 *   targetField: 'confirmPassword'
 * });
 * 
 * <input
 *   {...register('confirmPassword', {
 *     validate: validateConfirmPassword
 *   })}
 * />
 * ```
 */
export function createMatchValidator<TFieldValues extends FieldValues = FieldValues>(
  watch: UseFormWatch<TFieldValues>,
  config: MatchValidationConfig<TFieldValues>
): FieldValidator<string> {
  return (value: string): MatchValidationResult => {
    const startTime = performance.now();
    
    try {
      // Get the value of the field to match using watch()
      const matchingValue = watch(config.fieldToMatch);
      
      // Handle empty/null values consistently with Angular behavior
      if (value == null && matchingValue == null) {
        return createValidationSuccess(true, startTime);
      }
      
      if (value == null || matchingValue == null) {
        return createValidationFailure(startTime);
      }
      
      // Convert to strings for comparison
      let currentStr = String(value);
      let matchingStr = String(matchingValue);
      
      // Apply transformations if configured
      if (config.trimWhitespace) {
        currentStr = currentStr.trim();
        matchingStr = matchingStr.trim();
      }
      
      // Perform comparison based on case sensitivity
      const isMatch = config.caseSensitive === false
        ? currentStr.toLowerCase() === matchingStr.toLowerCase()
        : currentStr === matchingStr;
      
      return isMatch 
        ? createValidationSuccess(true, startTime)
        : createValidationFailure(startTime);
        
    } catch (error) {
      console.error('Match validation error:', error);
      return createValidationFailure(startTime);
    }
  };
}

/**
 * Creates a React Hook Form validation rule object for easy integration.
 * Simplifies the usage pattern for common validation scenarios.
 * 
 * @template TFieldValues - The form field values type
 * @param watch - React Hook Form watch function
 * @param fieldToMatch - Name of the field to match against
 * @param errorMessage - Custom error message (optional)
 * @returns React Hook Form validation rules object
 * 
 * @example
 * ```typescript
 * const { register, watch } = useForm();
 * 
 * <input
 *   {...register('confirmPassword', 
 *     createMatchValidationRules(watch, 'password', 'Passwords must match')
 *   )}
 * />
 * ```
 */
export function createMatchValidationRules<TFieldValues extends FieldValues = FieldValues>(
  watch: UseFormWatch<TFieldValues>,
  fieldToMatch: Path<TFieldValues>,
  errorMessage?: string
) {
  const config: MatchValidationConfig<TFieldValues> = {
    fieldToMatch,
    targetField: fieldToMatch, // This will be overridden by the field being validated
    errorMessage
  };
  
  const validator = createMatchValidator(watch, config);
  
  return {
    validate: {
      match: (value: string) => {
        const result = validator(value);
        return result.success || (errorMessage || 'Fields do not match');
      }
    }
  };
}

// =============================================================================
// LEGACY COMPATIBILITY UTILITIES
// =============================================================================

/**
 * Creates a validation function that maintains exact Angular matchValidator behavior.
 * Provides seamless migration path from Angular reactive forms.
 * 
 * @template TFieldValues - The form field values type
 * @param fieldToMatch - Name of the field to match against (same as Angular)
 * @returns Validation function that returns { doesNotMatch: true } on failure
 * 
 * @example
 * ```typescript
 * // Direct replacement for Angular matchValidator usage
 * const { register, watch } = useForm();
 * const matchPasswordValidator = matchValidator('password');
 * 
 * <input
 *   {...register('confirmPassword', {
 *     validate: (value) => {
 *       const result = matchPasswordValidator(value, watch);
 *       return result === null || result;
 *     }
 *   })}
 * />
 * ```
 */
export function matchValidator<TFieldValues extends FieldValues = FieldValues>(
  fieldToMatch: Path<TFieldValues>
) {
  return (value: string, watch: UseFormWatch<TFieldValues>): DoesNotMatchError | null => {
    const startTime = performance.now();
    
    try {
      const matchingValue = watch(fieldToMatch);
      
      // Exact Angular behavior: return null if values match
      if (value === matchingValue) {
        return null;
      }
      
      // Return exact Angular error structure
      return { doesNotMatch: true };
      
    } catch (error) {
      console.error('Legacy match validation error:', error);
      return { doesNotMatch: true };
    } finally {
      // Performance tracking for optimization
      const endTime = performance.now();
      const duration = endTime - startTime;
      
      if (duration > 100) {
        console.warn(`Match validation exceeded 100ms: ${duration}ms`);
      }
    }
  };
}

/**
 * Utility function to check if an error is a match validation error.
 * Enables type-safe error handling in components.
 * 
 * @param error - Error object to check
 * @returns True if the error is a DoesNotMatchError
 * 
 * @example
 * ```typescript
 * if (isMatchError(errors.confirmPassword)) {
 *   // Handle match validation error specifically
 *   console.log('Passwords do not match');
 * }
 * ```
 */
export function isMatchError(error: unknown): error is DoesNotMatchError {
  return (
    typeof error === 'object' &&
    error !== null &&
    'doesNotMatch' in error &&
    (error as DoesNotMatchError).doesNotMatch === true
  );
}

// =============================================================================
// PERFORMANCE OPTIMIZATION UTILITIES
// =============================================================================

/**
 * Creates a debounced match validator for high-frequency validation scenarios.
 * Optimizes performance for real-time validation requirements.
 * 
 * @template TFieldValues - The form field values type
 * @param watch - React Hook Form watch function
 * @param config - Match validation configuration
 * @param debounceMs - Debounce delay in milliseconds (default: 300)
 * @returns Debounced validation function
 * 
 * @example
 * ```typescript
 * const debouncedValidator = createDebouncedMatchValidator(
 *   watch, 
 *   { fieldToMatch: 'password', targetField: 'confirmPassword' },
 *   200
 * );
 * ```
 */
export function createDebouncedMatchValidator<TFieldValues extends FieldValues = FieldValues>(
  watch: UseFormWatch<TFieldValues>,
  config: MatchValidationConfig<TFieldValues>,
  debounceMs: number = 300
): FieldValidator<string> {
  let timeoutId: NodeJS.Timeout | null = null;
  const baseValidator = createMatchValidator(watch, config);
  
  return (value: string): Promise<MatchValidationResult> => {
    return new Promise((resolve) => {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
      
      timeoutId = setTimeout(() => {
        const result = baseValidator(value);
        resolve(result);
      }, debounceMs);
    });
  };
}

/**
 * Bulk validation utility for multiple match validations.
 * Optimizes performance when validating multiple field pairs simultaneously.
 * 
 * @template TFieldValues - The form field values type
 * @param values - Form values object
 * @param configs - Array of match validation configurations
 * @returns Map of field names to validation results
 * 
 * @example
 * ```typescript
 * const results = validateMultipleMatches(formValues, [
 *   { fieldToMatch: 'password', targetField: 'confirmPassword' },
 *   { fieldToMatch: 'email', targetField: 'confirmEmail' }
 * ]);
 * ```
 */
export function validateMultipleMatches<TFieldValues extends FieldValues = FieldValues>(
  values: TFieldValues,
  configs: MatchValidationConfig<TFieldValues>[]
): Map<Path<TFieldValues>, MatchValidationResult> {
  const startTime = performance.now();
  const results = new Map<Path<TFieldValues>, MatchValidationResult>();
  
  for (const config of configs) {
    const primaryValue = values[config.fieldToMatch];
    const targetValue = values[config.targetField];
    
    const isMatch = primaryValue === targetValue;
    const result = isMatch 
      ? createValidationSuccess(true, startTime)
      : createValidationFailure(startTime);
    
    results.set(config.targetField, result);
  }
  
  const endTime = performance.now();
  const duration = endTime - startTime;
  
  if (duration > 100) {
    console.warn(`Bulk match validation exceeded 100ms: ${duration}ms for ${configs.length} validations`);
  }
  
  return results;
}

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

/**
 * Creates a validation success result with performance metrics.
 * 
 * @param data - Validation result data
 * @param startTime - Validation start time for performance tracking
 * @returns Validation success result
 */
function createValidationSuccess(data: true, startTime: number): ValidationSuccess<true> {
  const endTime = performance.now();
  
  return {
    success: true,
    data,
    errors: null,
    performance: createPerformanceMetrics(startTime, endTime),
    timestamp: new Date()
  };
}

/**
 * Creates a validation failure result with performance metrics.
 * 
 * @param startTime - Validation start time for performance tracking
 * @returns Validation failure result
 */
function createValidationFailure(startTime: number): ValidationFailure<DoesNotMatchError> {
  const endTime = performance.now();
  
  return {
    success: false,
    data: null,
    errors: { doesNotMatch: true },
    performance: createPerformanceMetrics(startTime, endTime),
    timestamp: new Date()
  };
}

/**
 * Creates performance metrics for validation tracking.
 * 
 * @param startTime - Validation start time
 * @param endTime - Validation end time
 * @returns Performance metrics object
 */
function createPerformanceMetrics(startTime: number, endTime: number): ValidationPerformanceMetrics {
  const validationTime = endTime - startTime;
  
  return {
    validationTime,
    fieldValidationTimes: { 'match': validationTime },
    schemaProcessingTime: 0,
    errorProcessingTime: 0,
    startTime: new Date(startTime),
    endTime: new Date(endTime),
    metPerformanceTarget: validationTime < 100,
    metadata: {
      validationType: 'match',
      implementation: 'react-hook-form'
    }
  };
}

// =============================================================================
// EXPORTS
// =============================================================================

export type {
  MatchValidationConfig,
  MatchValidationResult,
  MatchValidator
};

/**
 * Default export for common password confirmation scenario.
 * Provides the most frequently used validation pattern.
 */
export default {
  /**
   * Create match validator for React Hook Form integration.
   */
  createValidator: createMatchValidator,
  
  /**
   * Create Zod schema refinement for schema-based validation.
   */
  createRefinement: createMatchRefinement,
  
  /**
   * Create password matching schema for common use cases.
   */
  createPasswordSchema: createPasswordMatchSchema,
  
  /**
   * Legacy Angular compatibility function.
   */
  matchValidator,
  
  /**
   * Type guard for match validation errors.
   */
  isMatchError,
  
  /**
   * Validation rule helper for React Hook Form.
   */
  createValidationRules: createMatchValidationRules
};