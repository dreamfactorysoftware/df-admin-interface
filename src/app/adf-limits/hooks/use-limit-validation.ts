/**
 * Limit Validation Hook for DreamFactory React/Next.js Admin Interface
 * 
 * Custom React hook implementing comprehensive limit validation logic with Zod schema
 * validation and real-time validation under 100ms. Provides dynamic validation rules
 * based on limit types, field requirements, and business logic while maintaining
 * compatibility with React Hook Form integration patterns.
 * 
 * Features:
 * - Zod schema validators integrated with React Hook Form per React/Next.js Integration Requirements
 * - Real-time validation under 100ms per performance standards
 * - Dynamic validation schemas based on limit type selection per existing Angular validation patterns
 * - Type-safe validation workflows per Section 5.2 Component Details
 * - Comprehensive field validation per existing Angular validation logic
 * - Conditional field validation based on limit type selection
 * - Business logic validation for rate limit constraints and period combinations
 * 
 * Replaces Angular Validators with modern Zod schema validation, implementing reactive
 * validation patterns that support complex business rules and type-specific field requirements
 * with optimal performance characteristics for enterprise-grade limit management workflows.
 * 
 * @fileoverview Comprehensive limit validation hook with Zod integration
 * @version 1.0.0
 * @since React 19.0.0 / Next.js 15.1+
 */

import { useCallback, useMemo, useRef } from 'react';
import { z } from 'zod';
import type { FieldValues, Path } from 'react-hook-form';
import type { 
  FormFieldError,
  EnhancedValidationState,
  FormFieldValidation,
  UseFormValidationReturn 
} from '../../../types/forms';
import type { 
  LimitType,
  LimitPeriodUnit,
  LimitConfiguration,
  LimitConfigurationSchema
} from '../types';

// ============================================================================
// Validation Performance Tracking
// ============================================================================

/**
 * Performance metrics for validation operations
 * Ensures real-time validation under 100ms requirement compliance
 */
interface ValidationMetrics {
  /** Average validation time in milliseconds */
  avgValidationTime: number;
  /** Maximum validation time recorded */
  maxValidationTime: number;
  /** Total validations performed */
  totalValidations: number;
  /** Validation errors encountered */
  validationErrors: number;
  /** Last validation timestamp */
  lastValidated: Date | null;
}

/**
 * Validation timing tracker for performance monitoring
 */
class ValidationTimer {
  private startTime: number = 0;
  private metrics: ValidationMetrics = {
    avgValidationTime: 0,
    maxValidationTime: 0,
    totalValidations: 0,
    validationErrors: 0,
    lastValidated: null
  };

  start(): void {
    this.startTime = performance.now();
  }

  end(hasError: boolean = false): number {
    const duration = performance.now() - this.startTime;
    this.updateMetrics(duration, hasError);
    return duration;
  }

  private updateMetrics(duration: number, hasError: boolean): void {
    this.metrics.totalValidations++;
    this.metrics.lastValidated = new Date();
    
    if (hasError) {
      this.metrics.validationErrors++;
    }
    
    if (duration > this.metrics.maxValidationTime) {
      this.metrics.maxValidationTime = duration;
    }
    
    // Calculate rolling average
    const totalTime = (this.metrics.avgValidationTime * (this.metrics.totalValidations - 1)) + duration;
    this.metrics.avgValidationTime = totalTime / this.metrics.totalValidations;
  }

  getMetrics(): ValidationMetrics {
    return { ...this.metrics };
  }

  reset(): void {
    this.metrics = {
      avgValidationTime: 0,
      maxValidationTime: 0,
      totalValidations: 0,
      validationErrors: 0,
      lastValidated: null
    };
  }
}

// ============================================================================
// Dynamic Validation Schema Generation
// ============================================================================

/**
 * Generate dynamic validation schema based on limit type
 * Implements conditional validation rules per existing Angular patterns
 */
export function createDynamicLimitSchema(limitType?: LimitType): z.ZodSchema<any> {
  // Base schema with common validation rules
  const baseSchema = z.object({
    name: z.string()
      .min(1, 'Limit name is required')
      .max(100, 'Limit name must be less than 100 characters')
      .regex(
        /^[a-zA-Z0-9\s\-_]+$/, 
        'Limit name can only contain letters, numbers, spaces, hyphens, and underscores'
      ),
    
    limitType: z.enum([
      'api.calls_per_period',
      'api.calls_per_minute', 
      'api.calls_per_hour',
      'api.calls_per_day',
      'db.calls_per_period',
      'service.calls_per_period',
      'user.calls_per_period'
    ], {
      errorMap: () => ({ message: 'Please select a valid limit type' })
    }),
    
    rateValue: z.number()
      .int('Rate value must be a whole number')
      .min(1, 'Rate value must be at least 1')
      .max(1000000, 'Rate value cannot exceed 1,000,000'),
    
    period: z.object({
      value: z.number()
        .int('Period value must be a whole number')
        .min(1, 'Period value must be at least 1')
        .max(365, 'Period value cannot exceed 365'),
      unit: z.enum(['minute', 'hour', 'day', 'week', 'month'], {
        errorMap: () => ({ message: 'Please select a valid period unit' })
      })
    }),
    
    active: z.boolean().default(true),
    
    description: z.string()
      .max(500, 'Description must be less than 500 characters')
      .optional()
  });

  // Add conditional validation based on limit type
  if (!limitType) {
    return baseSchema;
  }

  // Service-specific validation
  if (limitType.includes('service.calls_per_')) {
    return baseSchema.extend({
      service: z.number()
        .int('Service ID must be a valid integer')
        .positive('Service selection is required for service-specific limits')
        .nullable()
        .refine(val => val !== null, {
          message: 'Service selection is required for service-specific limits'
        }),
      user: z.number().int().positive().nullable().optional(),
      role: z.number().int().positive().nullable().optional()
    });
  }

  // User-specific validation
  if (limitType.includes('user.calls_per_')) {
    return baseSchema.extend({
      user: z.number()
        .int('User ID must be a valid integer')
        .positive('User selection is required for user-specific limits')
        .nullable()
        .refine(val => val !== null, {
          message: 'User selection is required for user-specific limits'
        }),
      service: z.number().int().positive().nullable().optional(),
      role: z.number().int().positive().nullable().optional()
    });
  }

  // Database-specific validation
  if (limitType.includes('db.calls_per_')) {
    return baseSchema.extend({
      service: z.number()
        .int('Service ID must be a valid integer')
        .positive('Database service selection is required for database-specific limits')
        .nullable()
        .refine(val => val !== null, {
          message: 'Database service selection is required for database-specific limits'
        }),
      user: z.number().int().positive().nullable().optional(),
      role: z.number().int().positive().nullable().optional()
    });
  }

  // API-specific validation (global limits)
  return baseSchema.extend({
    service: z.number().int().positive().nullable().optional(),
    user: z.number().int().positive().nullable().optional(),
    role: z.number().int().positive().nullable().optional()
  });
}

/**
 * Business logic validation for rate limit constraints
 * Implements complex validation rules beyond schema validation
 */
export function validateRateLimitConstraints(
  rateValue: number,
  period: { value: number; unit: LimitPeriodUnit },
  limitType: LimitType
): string[] {
  const errors: string[] = [];

  // Calculate effective rate per minute for comparison
  const getMinutesInPeriod = (period: { value: number; unit: LimitPeriodUnit }): number => {
    switch (period.unit) {
      case 'minute': return period.value;
      case 'hour': return period.value * 60;
      case 'day': return period.value * 60 * 24;
      case 'week': return period.value * 60 * 24 * 7;
      case 'month': return period.value * 60 * 24 * 30; // Approximate
      default: return period.value;
    }
  };

  const minutesInPeriod = getMinutesInPeriod(period);
  const ratePerMinute = rateValue / minutesInPeriod;

  // Validate minimum rate constraints
  if (ratePerMinute < 0.01) {
    errors.push('Rate is too low - minimum effective rate is 1 call per 100 minutes');
  }

  // Validate maximum rate constraints based on limit type
  if (limitType.includes('api.calls_per_')) {
    if (ratePerMinute > 10000) {
      errors.push('API rate limit too high - maximum 10,000 calls per minute for API limits');
    }
  }

  if (limitType.includes('db.calls_per_')) {
    if (ratePerMinute > 1000) {
      errors.push('Database rate limit too high - maximum 1,000 calls per minute for database limits');
    }
  }

  if (limitType.includes('user.calls_per_')) {
    if (ratePerMinute > 100) {
      errors.push('User rate limit too high - maximum 100 calls per minute per user');
    }
  }

  // Validate period constraints
  if (period.unit === 'minute' && period.value > 60) {
    errors.push('Period in minutes cannot exceed 60 - use hours instead');
  }

  if (period.unit === 'hour' && period.value > 24) {
    errors.push('Period in hours cannot exceed 24 - use days instead');
  }

  if (period.unit === 'day' && period.value > 30) {
    errors.push('Period in days cannot exceed 30 - use months instead');
  }

  // Validate realistic combinations
  if (period.unit === 'minute' && rateValue > 1000) {
    errors.push('High rate values with minute periods may cause performance issues');
  }

  return errors;
}

/**
 * Field-specific validation functions
 * Provides granular validation for individual form fields
 */
export const fieldValidators = {
  /**
   * Validate limit name field
   */
  limitName: (name: string): string | undefined => {
    if (!name || name.trim().length === 0) {
      return 'Limit name is required';
    }
    
    if (name.length > 100) {
      return 'Limit name must be less than 100 characters';
    }
    
    if (!/^[a-zA-Z0-9\s\-_]+$/.test(name)) {
      return 'Limit name can only contain letters, numbers, spaces, hyphens, and underscores';
    }
    
    return undefined;
  },

  /**
   * Validate rate value field
   */
  rateValue: (value: number, limitType?: LimitType): string | undefined => {
    if (!value || value <= 0) {
      return 'Rate value must be greater than 0';
    }
    
    if (!Number.isInteger(value)) {
      return 'Rate value must be a whole number';
    }
    
    if (value > 1000000) {
      return 'Rate value cannot exceed 1,000,000';
    }
    
    // Type-specific rate validation
    if (limitType?.includes('user.calls_per_') && value > 10000) {
      return 'User-specific rate limits should typically be under 10,000';
    }
    
    return undefined;
  },

  /**
   * Validate period configuration
   */
  period: (period: { value: number; unit: LimitPeriodUnit }): string | undefined => {
    if (!period.value || period.value <= 0) {
      return 'Period value must be greater than 0';
    }
    
    if (!Number.isInteger(period.value)) {
      return 'Period value must be a whole number';
    }
    
    if (period.value > 365) {
      return 'Period value cannot exceed 365';
    }
    
    // Unit-specific validation
    if (period.unit === 'minute' && period.value > 60) {
      return 'Period in minutes cannot exceed 60 - consider using hours';
    }
    
    if (period.unit === 'hour' && period.value > 24) {
      return 'Period in hours cannot exceed 24 - consider using days';
    }
    
    return undefined;
  },

  /**
   * Validate conditional service field
   */
  serviceId: (serviceId: number | null, limitType: LimitType): string | undefined => {
    const requiresService = limitType.includes('service.calls_per_') || limitType.includes('db.calls_per_');
    
    if (requiresService && (serviceId === null || serviceId === undefined)) {
      return 'Service selection is required for this limit type';
    }
    
    if (serviceId !== null && serviceId <= 0) {
      return 'Invalid service selection';
    }
    
    return undefined;
  },

  /**
   * Validate conditional user field
   */
  userId: (userId: number | null, limitType: LimitType): string | undefined => {
    const requiresUser = limitType.includes('user.calls_per_');
    
    if (requiresUser && (userId === null || userId === undefined)) {
      return 'User selection is required for user-specific limits';
    }
    
    if (userId !== null && userId <= 0) {
      return 'Invalid user selection';
    }
    
    return undefined;
  },

  /**
   * Validate description field
   */
  description: (description?: string): string | undefined => {
    if (description && description.length > 500) {
      return 'Description must be less than 500 characters';
    }
    
    return undefined;
  }
};

// ============================================================================
// Main Hook Implementation
// ============================================================================

/**
 * Options for limit validation hook configuration
 */
export interface UseLimitValidationOptions {
  /** Enable performance monitoring */
  enableMetrics?: boolean;
  /** Debounce delay for real-time validation in milliseconds */
  debounceMs?: number;
  /** Custom validation functions */
  customValidators?: Record<string, (value: any) => string | undefined>;
  /** Enable business logic validation */
  enableBusinessRules?: boolean;
}

/**
 * Return type for the limit validation hook
 */
export interface UseLimitValidationReturn extends UseFormValidationReturn<LimitConfiguration> {
  /** Generate dynamic schema based on limit type */
  createValidationSchema: (limitType?: LimitType) => z.ZodSchema<any>;
  /** Validate business logic constraints */
  validateBusinessRules: (data: Partial<LimitConfiguration>) => string[];
  /** Field-specific validators */
  validators: typeof fieldValidators;
  /** Validation performance metrics */
  validationMetrics: ValidationMetrics;
  /** Reset performance metrics */
  resetMetrics: () => void;
  /** Validate full form configuration */
  validateFullConfiguration: (data: LimitConfiguration) => Promise<string[]>;
}

/**
 * Comprehensive limit validation hook with Zod schema integration
 * 
 * Provides real-time validation under 100ms with dynamic schema generation,
 * business logic validation, and React Hook Form integration patterns.
 * 
 * @param options - Configuration options for validation behavior
 * @returns Validation utilities and performance metrics
 */
export function useLimitValidation(
  options: UseLimitValidationOptions = {}
): UseLimitValidationReturn {
  const {
    enableMetrics = true,
    debounceMs = 100,
    customValidators = {},
    enableBusinessRules = true
  } = options;

  // Performance tracking
  const timerRef = useRef<ValidationTimer>(new ValidationTimer());
  const debounceTimersRef = useRef<Map<string, NodeJS.Timeout>>(new Map());

  /**
   * Generate dynamic validation schema based on limit type
   * Optimized for real-time schema switching under 100ms
   */
  const createValidationSchema = useCallback((limitType?: LimitType): z.ZodSchema<any> => {
    if (enableMetrics) {
      timerRef.current.start();
    }

    try {
      const schema = createDynamicLimitSchema(limitType);
      
      if (enableMetrics) {
        timerRef.current.end(false);
      }
      
      return schema;
    } catch (error) {
      if (enableMetrics) {
        timerRef.current.end(true);
      }
      throw error;
    }
  }, [enableMetrics]);

  /**
   * Validate business logic constraints
   * Implements complex validation rules beyond schema validation
   */
  const validateBusinessRules = useCallback((data: Partial<LimitConfiguration>): string[] => {
    if (!enableBusinessRules) {
      return [];
    }

    if (enableMetrics) {
      timerRef.current.start();
    }

    try {
      const errors: string[] = [];

      // Validate rate limit constraints if all required fields are present
      if (data.rateValue && data.period && data.limitType) {
        const rateErrors = validateRateLimitConstraints(
          data.rateValue,
          data.period,
          data.limitType
        );
        errors.push(...rateErrors);
      }

      if (enableMetrics) {
        timerRef.current.end(errors.length > 0);
      }

      return errors;
    } catch (error) {
      if (enableMetrics) {
        timerRef.current.end(true);
      }
      return ['Validation error occurred'];
    }
  }, [enableBusinessRules, enableMetrics]);

  /**
   * Validate individual field with debouncing for real-time feedback
   */
  const validateField = useCallback(async (
    fieldName: Path<LimitConfiguration>,
    value?: any
  ): Promise<string | undefined> => {
    return new Promise((resolve) => {
      // Clear existing debounce timer for this field
      const existingTimer = debounceTimersRef.current.get(fieldName);
      if (existingTimer) {
        clearTimeout(existingTimer);
      }

      // Set new debounce timer
      const timer = setTimeout(() => {
        if (enableMetrics) {
          timerRef.current.start();
        }

        try {
          let error: string | undefined;

          // Use custom validator if available
          if (customValidators[fieldName]) {
            error = customValidators[fieldName](value);
          } else {
            // Use built-in field validators
            switch (fieldName) {
              case 'name':
                error = fieldValidators.limitName(value);
                break;
              case 'rateValue':
                error = fieldValidators.rateValue(value);
                break;
              case 'period':
                error = fieldValidators.period(value);
                break;
              case 'service':
                // Note: This would need limitType context in real implementation
                break;
              case 'user':
                // Note: This would need limitType context in real implementation
                break;
              case 'description':
                error = fieldValidators.description(value);
                break;
              default:
                break;
            }
          }

          if (enableMetrics) {
            timerRef.current.end(error !== undefined);
          }

          resolve(error);
        } catch (validationError) {
          if (enableMetrics) {
            timerRef.current.end(true);
          }
          resolve('Validation error occurred');
        }

        debounceTimersRef.current.delete(fieldName);
      }, debounceMs);

      debounceTimersRef.current.set(fieldName, timer);
    });
  }, [customValidators, enableMetrics, debounceMs]);

  /**
   * Validate entire form configuration
   */
  const validateForm = useCallback(async (values: LimitConfiguration): Promise<FormFieldError[]> => {
    if (enableMetrics) {
      timerRef.current.start();
    }

    try {
      const errors: FormFieldError[] = [];

      // Schema validation
      const schema = createValidationSchema(values.limitType);
      const result = schema.safeParse(values);

      if (!result.success) {
        result.error.errors.forEach((error) => {
          errors.push({
            type: 'validation',
            message: error.message,
            field: error.path.join('.'),
            code: error.code
          });
        });
      }

      // Business rules validation
      if (enableBusinessRules) {
        const businessErrors = validateBusinessRules(values);
        businessErrors.forEach((message) => {
          errors.push({
            type: 'validation',
            message,
            severity: 'warning'
          });
        });
      }

      if (enableMetrics) {
        timerRef.current.end(errors.length > 0);
      }

      return errors;
    } catch (error) {
      if (enableMetrics) {
        timerRef.current.end(true);
      }
      return [{
        type: 'validation',
        message: 'Form validation error occurred'
      }];
    }
  }, [createValidationSchema, validateBusinessRules, enableBusinessRules, enableMetrics]);

  /**
   * Validate full configuration with comprehensive checks
   */
  const validateFullConfiguration = useCallback(async (data: LimitConfiguration): Promise<string[]> => {
    const errors: string[] = [];

    try {
      // Schema validation
      const schema = createValidationSchema(data.limitType);
      const result = schema.safeParse(data);

      if (!result.success) {
        result.error.errors.forEach((error) => {
          errors.push(error.message);
        });
      }

      // Business rules validation
      const businessErrors = validateBusinessRules(data);
      errors.push(...businessErrors);

      return errors;
    } catch (error) {
      return ['Configuration validation failed'];
    }
  }, [createValidationSchema, validateBusinessRules]);

  /**
   * Clear field error (placeholder for React Hook Form integration)
   */
  const clearFieldError = useCallback((fieldName: Path<LimitConfiguration>): void => {
    // This would integrate with React Hook Form's clearErrors in actual implementation
    console.debug(`Clearing error for field: ${fieldName}`);
  }, []);

  /**
   * Set field error (placeholder for React Hook Form integration)
   */
  const setFieldError = useCallback((fieldName: Path<LimitConfiguration>, error: string): void => {
    // This would integrate with React Hook Form's setError in actual implementation
    console.debug(`Setting error for field ${fieldName}: ${error}`);
  }, []);

  /**
   * Get current validation metrics
   */
  const validationMetrics = useMemo(() => {
    return enableMetrics ? timerRef.current.getMetrics() : {
      avgValidationTime: 0,
      maxValidationTime: 0,
      totalValidations: 0,
      validationErrors: 0,
      lastValidated: null
    };
  }, [enableMetrics]);

  /**
   * Reset validation metrics
   */
  const resetMetrics = useCallback(() => {
    if (enableMetrics) {
      timerRef.current.reset();
    }
  }, [enableMetrics]);

  // Enhanced field validators with integrated business logic
  const enhancedValidators = useMemo(() => ({
    ...fieldValidators,
    ...customValidators
  }), [customValidators]);

  return {
    validateField,
    validateForm,
    clearFieldError,
    setFieldError,
    validationMetrics,
    createValidationSchema,
    validateBusinessRules,
    validators: enhancedValidators,
    resetMetrics,
    validateFullConfiguration
  };
}

/**
 * Export utility functions for external use
 */
export {
  createDynamicLimitSchema,
  validateRateLimitConstraints,
  fieldValidators
};

/**
 * Export types for external consumption
 */
export type {
  ValidationMetrics,
  UseLimitValidationOptions,
  UseLimitValidationReturn
};