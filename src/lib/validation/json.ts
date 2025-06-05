/**
 * @fileoverview JSON validation utility migrated from Angular JsonValidator to Zod schema pattern
 * 
 * This module provides runtime JSON parsing validation for form inputs with comprehensive error 
 * handling and type safety. Maintains the original functionality of validating JSON syntax while 
 * integrating with React Hook Form patterns and achieving sub-100ms validation performance.
 * 
 * Key features:
 * - Zod schema-based JSON syntax validation
 * - TypeScript type inference for parsed JSON values
 * - React Hook Form integration with proper error handling
 * - Performance optimization for real-time validation under 100ms
 * - Empty string bypass behavior (maintains Angular JsonValidator compatibility)
 * - Comprehensive error message localization support
 * 
 * @version 1.0.0
 * @since React 19 / Next.js 15.1 migration
 * @see {@link https://github.com/dreamfactorysoftware/df-admin-interface/blob/main/src/app/shared/validators/json.validator.ts}
 */

import { z } from 'zod';
import type { 
  JsonInvalidError, 
  PerformantZodSchema,
  ZodValidatorConfig,
  ValidationResult,
  ValidationSuccess,
  ValidationFailure,
  ValidationPerformanceMetrics,
  ErrorMessageFormatter
} from './types';

// =============================================================================
// PERFORMANCE TRACKING UTILITIES
// =============================================================================

/**
 * High-precision performance measurement for validation operations.
 * Tracks validation timing to ensure 100ms real-time validation requirements.
 */
class ValidationPerformanceTracker {
  private readonly startTime: number;
  private fieldStartTimes: Map<string, number> = new Map();

  constructor() {
    this.startTime = performance.now();
  }

  /**
   * Mark the start of a field validation operation.
   * @param fieldName - Name of the field being validated
   */
  markFieldStart(fieldName: string): void {
    this.fieldStartTimes.set(fieldName, performance.now());
  }

  /**
   * Mark the end of a field validation operation and return duration.
   * @param fieldName - Name of the field that completed validation
   * @returns Validation duration in milliseconds
   */
  markFieldEnd(fieldName: string): number {
    const startTime = this.fieldStartTimes.get(fieldName);
    if (!startTime) {
      return 0;
    }
    
    const duration = performance.now() - startTime;
    this.fieldStartTimes.delete(fieldName);
    return duration;
  }

  /**
   * Generate comprehensive performance metrics for validation operation.
   * @param fieldValidationTimes - Map of field names to validation times
   * @returns Complete performance metrics object
   */
  generateMetrics(fieldValidationTimes: Record<string, number> = {}): ValidationPerformanceMetrics {
    const endTime = performance.now();
    const totalValidationTime = endTime - this.startTime;
    
    return {
      validationTime: totalValidationTime,
      fieldValidationTimes,
      schemaProcessingTime: totalValidationTime * 0.1, // Estimate schema processing overhead
      errorProcessingTime: totalValidationTime * 0.05, // Estimate error processing overhead
      startTime: new Date(Date.now() - totalValidationTime),
      endTime: new Date(),
      metPerformanceTarget: totalValidationTime < 100,
      metadata: {
        fieldCount: Object.keys(fieldValidationTimes).length,
        averageFieldTime: Object.values(fieldValidationTimes).length > 0 
          ? Object.values(fieldValidationTimes).reduce((a, b) => a + b, 0) / Object.values(fieldValidationTimes).length 
          : 0
      }
    };
  }
}

// =============================================================================
// ERROR MESSAGE LOCALIZATION
// =============================================================================

/**
 * Default error messages for JSON validation with localization support.
 * Maintains consistency with existing Angular validation error patterns.
 */
const DEFAULT_ERROR_MESSAGES = {
  en: {
    jsonInvalid: 'Please enter valid JSON syntax.',
    jsonParseError: 'Invalid JSON: {error}',
    jsonEmpty: 'JSON content cannot be empty when required.',
    jsonTooLarge: 'JSON content exceeds maximum size limit.',
    jsonSyntaxError: 'JSON syntax error at position {position}: {message}'
  },
  es: {
    jsonInvalid: 'Por favor, introduce una sintaxis JSON válida.',
    jsonParseError: 'JSON inválido: {error}',
    jsonEmpty: 'El contenido JSON no puede estar vacío cuando es requerido.',
    jsonTooLarge: 'El contenido JSON excede el límite de tamaño máximo.',
    jsonSyntaxError: 'Error de sintaxis JSON en la posición {position}: {message}'
  },
  fr: {
    jsonInvalid: 'Veuillez saisir une syntaxe JSON valide.',
    jsonParseError: 'JSON invalide : {error}',
    jsonEmpty: 'Le contenu JSON ne peut pas être vide lorsqu\'il est requis.',
    jsonTooLarge: 'Le contenu JSON dépasse la limite de taille maximale.',
    jsonSyntaxError: 'Erreur de syntaxe JSON à la position {position} : {message}'
  }
} as const;

/**
 * Error message formatter with variable interpolation and localization support.
 * Provides context-aware error messages for better user experience.
 */
export const formatJsonErrorMessage: ErrorMessageFormatter = (
  errorCode: string,
  context: Record<string, unknown> = {},
  locale: string = 'en'
): string => {
  const messages = DEFAULT_ERROR_MESSAGES[locale as keyof typeof DEFAULT_ERROR_MESSAGES] || DEFAULT_ERROR_MESSAGES.en;
  let message = messages[errorCode as keyof typeof messages] || messages.jsonInvalid;
  
  // Replace variable placeholders with context values
  Object.entries(context).forEach(([key, value]) => {
    message = message.replace(new RegExp(`\\{${key}\\}`, 'g'), String(value));
  });
  
  return message;
};

// =============================================================================
// CORE JSON VALIDATION SCHEMAS
// =============================================================================

/**
 * Base Zod schema for JSON string validation with performance optimization.
 * Implements the core JSON parsing logic from Angular JsonValidator while
 * providing enhanced error handling and type safety.
 */
const createBaseJsonSchema = (config: Partial<ZodValidatorConfig> = {}) => {
  const performanceTracker = new ValidationPerformanceTracker();
  
  return z.string()
    .transform((value, ctx) => {
      performanceTracker.markFieldStart('json-validation');
      
      try {
        // Maintain Angular JsonValidator behavior: empty string bypass
        if (value.length === 0) {
          const validationTime = performanceTracker.markFieldEnd('json-validation');
          
          // Check performance requirement (must be under 100ms)
          if (validationTime >= 100 && config.trackPerformance) {
            console.warn(`JSON validation exceeded 100ms threshold: ${validationTime}ms`);
          }
          
          return null; // Empty string is valid (same as Angular validator)
        }
        
        // Attempt JSON parsing with performance tracking
        const parsed = JSON.parse(value);
        const validationTime = performanceTracker.markFieldEnd('json-validation');
        
        // Performance monitoring
        if (validationTime >= 100 && config.trackPerformance) {
          console.warn(`JSON validation exceeded 100ms threshold: ${validationTime}ms`);
        }
        
        return parsed;
      } catch (error) {
        const validationTime = performanceTracker.markFieldEnd('json-validation');
        
        // Create detailed error context for user feedback
        const errorContext = {
          error: error instanceof Error ? error.message : 'Unknown parsing error',
          position: extractJsonErrorPosition(error),
          message: error instanceof Error ? error.message : 'Invalid JSON syntax'
        };
        
        // Add legacy Angular validation error for backward compatibility
        const legacyError: JsonInvalidError = { jsonInvalid: true };
        
        // Generate localized error message
        const errorMessage = config.errorMap?.jsonInvalid || 
          formatJsonErrorMessage('jsonInvalid', errorContext, 'en');
        
        // Performance monitoring for error cases
        if (validationTime >= 100 && config.trackPerformance) {
          console.warn(`JSON validation (with error) exceeded 100ms threshold: ${validationTime}ms`);
        }
        
        // Add Zod issue with legacy error compatibility
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: errorMessage,
          params: {
            legacy: legacyError,
            context: errorContext,
            performance: {
              validationTime,
              metTarget: validationTime < 100
            }
          }
        });
        
        return z.NEVER; // Validation failure
      }
    });
};

/**
 * Extract position information from JSON parsing errors for better user feedback.
 * Attempts to parse position data from JSON.parse error messages.
 * 
 * @param error - The JSON parsing error
 * @returns Position information or 'unknown' if not extractable
 */
const extractJsonErrorPosition = (error: unknown): string => {
  if (!(error instanceof Error)) {
    return 'unknown';
  }
  
  // Try to extract position from common JSON error message patterns
  const positionMatch = error.message.match(/at position (\d+)/i) ||
                       error.message.match(/column (\d+)/i) ||
                       error.message.match(/line (\d+)/i);
  
  return positionMatch ? positionMatch[1] : 'unknown';
};

// =============================================================================
// TYPED JSON VALIDATION SCHEMAS
// =============================================================================

/**
 * Generic JSON validation schema with TypeScript type inference.
 * Provides compile-time type safety for JSON parsing results.
 * 
 * @template T - Expected type of the parsed JSON value
 * @param config - Validation configuration options
 * @returns Zod schema with performance constraints and type inference
 */
export const createTypedJsonSchema = <T = unknown>(
  config: Partial<ZodValidatorConfig> = {}
): PerformantZodSchema<T | null> => {
  const baseSchema = createBaseJsonSchema(config);
  
  return Object.assign(baseSchema, {
    maxValidationTime: 100 as const,
    complexityScore: 'low' as const
  }) as PerformantZodSchema<T | null>;
};

/**
 * Standard JSON validation schema that maintains Angular JsonValidator behavior.
 * Validates JSON syntax and returns parsed value or null for empty strings.
 * 
 * **Performance**: Optimized for sub-100ms validation to meet real-time requirements.
 * **Compatibility**: Maintains exact Angular JsonValidator logic and error patterns.
 * **Type Safety**: Provides compile-time type inference for parsed JSON values.
 * 
 * @example
 * ```typescript
 * // Basic usage with React Hook Form
 * const form = useForm({
 *   resolver: zodResolver(z.object({
 *     config: jsonSchema
 *   }))
 * });
 * 
 * // With typed JSON parsing
 * const typedSchema = z.object({
 *   settings: typedJsonSchema<{ theme: string; debug: boolean }>()
 * });
 * ```
 */
export const jsonSchema = createTypedJsonSchema();

/**
 * Typed JSON validation schema for specific object types.
 * Provides compile-time type safety for expected JSON structures.
 * 
 * @template T - Expected type of the parsed JSON value
 * @returns Zod schema with type inference for parsed JSON
 */
export const typedJsonSchema = <T = unknown>() => createTypedJsonSchema<T>();

/**
 * JSON array validation schema for validating JSON strings that should parse to arrays.
 * Includes additional validation to ensure the parsed value is an array.
 * 
 * @template T - Expected type of array elements
 * @param config - Validation configuration options
 * @returns Zod schema that validates JSON arrays
 */
export const jsonArraySchema = <T = unknown>(
  config: Partial<ZodValidatorConfig> = {}
): PerformantZodSchema<T[] | null> => {
  const baseSchema = createBaseJsonSchema(config);
  
  const arraySchema = baseSchema.refine(
    (value) => value === null || Array.isArray(value),
    {
      message: config.errorMap?.jsonArrayRequired || 'JSON must parse to an array',
      params: {
        legacy: { jsonInvalid: true } as JsonInvalidError
      }
    }
  );
  
  return Object.assign(arraySchema, {
    maxValidationTime: 100 as const,
    complexityScore: 'medium' as const
  }) as PerformantZodSchema<T[] | null>;
};

/**
 * JSON object validation schema for validating JSON strings that should parse to objects.
 * Includes additional validation to ensure the parsed value is an object.
 * 
 * @template T - Expected type of the parsed object
 * @param config - Validation configuration options
 * @returns Zod schema that validates JSON objects
 */
export const jsonObjectSchema = <T extends Record<string, unknown> = Record<string, unknown>>(
  config: Partial<ZodValidatorConfig> = {}
): PerformantZodSchema<T | null> => {
  const baseSchema = createBaseJsonSchema(config);
  
  const objectSchema = baseSchema.refine(
    (value) => value === null || (typeof value === 'object' && value !== null && !Array.isArray(value)),
    {
      message: config.errorMap?.jsonObjectRequired || 'JSON must parse to an object',
      params: {
        legacy: { jsonInvalid: true } as JsonInvalidError
      }
    }
  );
  
  return Object.assign(objectSchema, {
    maxValidationTime: 100 as const,
    complexityScore: 'medium' as const
  }) as PerformantZodSchema<T | null>;
};

// =============================================================================
// REACT HOOK FORM INTEGRATION UTILITIES
// =============================================================================

/**
 * Validation result wrapper for React Hook Form integration.
 * Converts Zod validation results to the comprehensive ValidationResult type.
 * 
 * @template T - Type of the validated data
 * @param zodResult - Zod validation result
 * @param performanceMetrics - Performance tracking data
 * @returns Structured validation result with success/failure states
 */
export const createValidationResult = <T>(
  zodResult: z.SafeParseReturnType<string, T>,
  performanceMetrics: ValidationPerformanceMetrics
): ValidationResult<T> => {
  if (zodResult.success) {
    return {
      success: true,
      data: zodResult.data,
      errors: null,
      performance: performanceMetrics,
      timestamp: new Date()
    } as ValidationSuccess<T>;
  } else {
    return {
      success: false,
      data: null,
      errors: {
        fieldErrors: {
          json: zodResult.error.errors.map(err => ({
            field: 'json',
            code: err.code,
            message: err.message,
            legacyError: err.params?.legacy,
            context: err.params?.context
          }))
        },
        crossFieldErrors: [],
        schemaErrors: [],
        errorCount: zodResult.error.errors.length,
        summary: zodResult.error.errors[0]?.message || 'JSON validation failed'
      },
      performance: performanceMetrics,
      timestamp: new Date()
    } as ValidationFailure;
  }
};

/**
 * Validate JSON string with comprehensive error handling and performance tracking.
 * Provides a direct validation function for non-schema use cases.
 * 
 * @template T - Expected type of the parsed JSON value
 * @param jsonString - JSON string to validate
 * @param config - Validation configuration options
 * @returns Promise resolving to validation result with performance metrics
 * 
 * @example
 * ```typescript
 * // Basic JSON validation
 * const result = await validateJsonString('{"valid": true}');
 * if (result.success) {
 *   console.log('Parsed:', result.data);
 * } else {
 *   console.error('Validation failed:', result.errors.summary);
 * }
 * 
 * // Typed JSON validation
 * interface Config { theme: string; debug: boolean; }
 * const typedResult = await validateJsonString<Config>('{"theme": "dark", "debug": false}');
 * ```
 */
export const validateJsonString = async <T = unknown>(
  jsonString: string,
  config: Partial<ZodValidatorConfig> = {}
): Promise<ValidationResult<T | null>> => {
  const performanceTracker = new ValidationPerformanceTracker();
  const schema = createTypedJsonSchema<T>(config);
  
  performanceTracker.markFieldStart('json-validation');
  const zodResult = schema.safeParse(jsonString);
  const validationTime = performanceTracker.markFieldEnd('json-validation');
  
  const performanceMetrics = performanceTracker.generateMetrics({
    'json-validation': validationTime
  });
  
  return createValidationResult(zodResult, performanceMetrics);
};

/**
 * Create a React Hook Form compatible validator function for JSON fields.
 * Integrates with useForm validation pipeline while maintaining performance requirements.
 * 
 * @template T - Expected type of the parsed JSON value
 * @param config - Validation configuration options
 * @returns Validator function compatible with React Hook Form
 * 
 * @example
 * ```typescript
 * const form = useForm({
 *   defaultValues: { config: '' },
 *   resolver: zodResolver(z.object({
 *     config: jsonSchema
 *   }))
 * });
 * 
 * // Or for custom validation
 * const jsonValidator = createJsonValidator<{ theme: string }>({
 *   errorMap: { jsonInvalid: 'Configuration must be valid JSON' }
 * });
 * ```
 */
export const createJsonValidator = <T = unknown>(
  config: Partial<ZodValidatorConfig> = {}
) => {
  return createTypedJsonSchema<T>(config);
};

// =============================================================================
// PERFORMANCE OPTIMIZATION UTILITIES
// =============================================================================

/**
 * Debounced JSON validation for real-time form inputs.
 * Reduces validation frequency to maintain 100ms performance target during rapid typing.
 * 
 * @param validationFn - The validation function to debounce
 * @param delay - Debounce delay in milliseconds (default: 300ms)
 * @returns Debounced validation function
 */
export const createDebouncedJsonValidator = <T>(
  validationFn: (value: string) => Promise<ValidationResult<T>>,
  delay: number = 300
) => {
  let timeoutId: NodeJS.Timeout;
  let latestValue: string;
  
  return (value: string): Promise<ValidationResult<T>> => {
    latestValue = value;
    
    return new Promise((resolve) => {
      clearTimeout(timeoutId);
      
      timeoutId = setTimeout(async () => {
        // Only validate if the value hasn't changed since timeout was set
        if (value === latestValue) {
          const result = await validationFn(value);
          resolve(result);
        }
      }, delay);
    });
  };
};

/**
 * Check if validation meets the 100ms performance requirement.
 * Utility function for performance monitoring and optimization.
 * 
 * @param metrics - Validation performance metrics
 * @returns True if validation met the performance target
 */
export const meetsPerformanceTarget = (metrics: ValidationPerformanceMetrics): boolean => {
  return metrics.metPerformanceTarget && metrics.validationTime < 100;
};

// =============================================================================
// TESTING UTILITIES
// =============================================================================

/**
 * Test utilities for JSON validation testing with comprehensive coverage.
 * Provides helpers for testing various JSON validation scenarios.
 */
export const testUtils = {
  /**
   * Generate test cases for JSON validation scenarios.
   * @returns Array of test cases with expected results
   */
  generateTestCases: () => [
    { input: '', expected: { success: true, data: null } },
    { input: '{}', expected: { success: true, data: {} } },
    { input: '[]', expected: { success: true, data: [] } },
    { input: '"string"', expected: { success: true, data: 'string' } },
    { input: '123', expected: { success: true, data: 123 } },
    { input: 'true', expected: { success: true, data: true } },
    { input: 'null', expected: { success: true, data: null } },
    { input: '{invalid}', expected: { success: false } },
    { input: '[invalid', expected: { success: false } },
    { input: 'undefined', expected: { success: false } },
    { input: '{trailing,}', expected: { success: false } }
  ],
  
  /**
   * Mock performance metrics for testing.
   * @param overrides - Performance metric overrides
   * @returns Mock performance metrics object
   */
  createMockPerformanceMetrics: (overrides: Partial<ValidationPerformanceMetrics> = {}): ValidationPerformanceMetrics => ({
    validationTime: 25,
    fieldValidationTimes: { json: 25 },
    schemaProcessingTime: 2.5,
    errorProcessingTime: 1.25,
    startTime: new Date(),
    endTime: new Date(),
    metPerformanceTarget: true,
    metadata: { fieldCount: 1, averageFieldTime: 25 },
    ...overrides
  }),
  
  /**
   * Assert that validation result contains legacy Angular error compatibility.
   * @param result - Validation result to check
   * @returns True if result contains legacy error compatibility
   */
  hasLegacyErrorCompatibility: (result: ValidationResult<unknown>): boolean => {
    if (result.success) return true;
    
    return result.errors.fieldErrors.json?.some(
      error => error.legacyError && 'jsonInvalid' in error.legacyError
    ) || false;
  }
};

// =============================================================================
// EXPORTS
// =============================================================================

// Primary validation schemas
export { 
  jsonSchema as default,
  typedJsonSchema,
  jsonArraySchema,
  jsonObjectSchema,
  createTypedJsonSchema,
  createJsonValidator
};

// Validation utilities
export {
  validateJsonString,
  createValidationResult,
  createDebouncedJsonValidator,
  meetsPerformanceTarget
};

// Error handling and localization
export {
  formatJsonErrorMessage,
  DEFAULT_ERROR_MESSAGES
};

// Testing and performance utilities
export {
  testUtils,
  ValidationPerformanceTracker
};

// Re-export relevant types for convenience
export type {
  JsonInvalidError,
  PerformantZodSchema,
  ZodValidatorConfig,
  ValidationResult,
  ValidationSuccess,
  ValidationFailure,
  ValidationPerformanceMetrics
} from './types';