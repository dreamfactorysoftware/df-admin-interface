/**
 * Storage Path Validation Hook for Script Editor
 * 
 * React hook for managing storage path validation logic and form control integration.
 * Handles dynamic validation requirements where storage path becomes required when a 
 * storage service is selected, replicating the Angular component's FormControl 
 * validation patterns with React Hook Form.
 * 
 * Key features:
 * - Dynamic validation where storagePath becomes required when storageServiceId is selected
 * - Automatic form field reset behavior when storage service selection changes
 * - Real-time validation under 100ms requirement per React/Next.js integration standards
 * - Integration with Zod schema validation for type-safe form validation patterns
 * - Comprehensive error state management with user-friendly validation messages
 * 
 * @fileoverview Storage validation hook for React Hook Form integration
 * @version 1.0.0
 * @since React 19.0.0 / Next.js 15.1+
 */

import { useCallback, useEffect, useMemo, useRef } from 'react';
import { 
  type UseFormSetValue, 
  type UseFormClearErrors, 
  type UseFormSetError, 
  type UseFormTrigger,
  type UseFormWatch,
  type FieldErrors,
  type FieldValues,
  type Path
} from 'react-hook-form';
import { z } from 'zod';
import type { 
  EnhancedValidationState, 
  FormFieldValidation,
  FormFieldError 
} from '@/types/forms';
import type { StorageService } from '../types';

/**
 * Storage validation configuration interface
 */
export interface StorageValidationConfig {
  /** Enable real-time validation (default: true) */
  realTimeValidation?: boolean;
  /** Validation debounce delay in milliseconds (default: 100) */
  debounceMs?: number;
  /** Custom validation messages */
  messages?: {
    storagePathRequired?: string;
    storagePathInvalid?: string;
    storageServiceRequired?: string;
  };
  /** Maximum path length validation */
  maxPathLength?: number;
  /** Allow empty path when no storage service selected */
  allowEmptyPath?: boolean;
}

/**
 * Storage validation form fields interface
 */
export interface StorageValidationFields extends FieldValues {
  /** Storage service ID field */
  storageServiceId: string | null;
  /** Storage path field */
  storagePath: string;
}

/**
 * Storage validation return interface
 */
export interface UseStorageValidationReturn<T extends StorageValidationFields = StorageValidationFields> {
  /** Validation schema for storage fields */
  validationSchema: z.ZodObject<{
    storageServiceId: z.ZodNullable<z.ZodString>;
    storagePath: z.ZodString;
  }>;
  
  /** Validate storage path field manually */
  validateStoragePath: () => Promise<boolean>;
  
  /** Check if storage path is required based on service selection */
  isStoragePathRequired: boolean;
  
  /** Current validation state for storage path */
  storagePathValidationState: EnhancedValidationState;
  
  /** Handle storage service change with automatic validation */
  handleStorageServiceChange: (serviceId: string | null) => void;
  
  /** Handle storage path change with validation */
  handleStoragePathChange: (path: string) => void;
  
  /** Get storage validation error messages */
  getValidationErrors: () => {
    storageServiceId?: FormFieldError;
    storagePath?: FormFieldError;
  };
  
  /** Reset storage validation state */
  resetValidation: () => void;
  
  /** Current validation performance metrics */
  validationMetrics: {
    lastValidationTime: number;
    averageValidationTime: number;
    totalValidations: number;
  };
}

/**
 * Storage path validation hook implementation
 * 
 * Provides dynamic validation logic where storage path becomes required when
 * a storage service is selected. Integrates with React Hook Form patterns
 * and maintains compatibility with the original Angular component behavior.
 * 
 * @param params Hook configuration parameters
 * @returns Storage validation utilities and state
 */
export function useStorageValidation<T extends StorageValidationFields = StorageValidationFields>({
  watch,
  setValue,
  clearErrors,
  setError,
  trigger,
  errors = {},
  storageServices = [],
  config = {}
}: {
  /** React Hook Form watch function */
  watch: UseFormWatch<T>;
  /** React Hook Form setValue function */
  setValue: UseFormSetValue<T>;
  /** React Hook Form clearErrors function */
  clearErrors: UseFormClearErrors<T>;
  /** React Hook Form setError function */
  setError: UseFormSetError<T>;
  /** React Hook Form trigger function */
  trigger: UseFormTrigger<T>;
  /** Current form errors */
  errors?: FieldErrors<T>;
  /** Available storage services */
  storageServices?: StorageService[];
  /** Validation configuration */
  config?: StorageValidationConfig;
}): UseStorageValidationReturn<T> {
  
  // Configuration with defaults
  const validationConfig = useMemo<Required<StorageValidationConfig>>(() => ({
    realTimeValidation: true,
    debounceMs: 100,
    maxPathLength: 500,
    allowEmptyPath: true,
    messages: {
      storagePathRequired: 'Storage path is required when a storage service is selected',
      storagePathInvalid: 'Please enter a valid storage path',
      storageServiceRequired: 'Please select a storage service'
    },
    ...config
  }), [config]);

  // Performance tracking
  const validationMetrics = useRef({
    lastValidationTime: 0,
    totalValidationTime: 0,
    totalValidations: 0,
    validationHistory: [] as number[]
  });

  // Debounce timeout reference
  const debounceTimeoutRef = useRef<NodeJS.Timeout>();

  // Watch form fields
  const storageServiceId = watch('storageServiceId' as Path<T>);
  const storagePath = watch('storagePath' as Path<T>);

  // Determine if storage path is required
  const isStoragePathRequired = useMemo(() => {
    return Boolean(storageServiceId && storageServiceId.trim() !== '');
  }, [storageServiceId]);

  // Create dynamic validation schema based on storage service selection
  const validationSchema = useMemo(() => {
    const baseSchema = z.object({
      storageServiceId: z.string().nullable(),
      storagePath: z.string()
    });

    // If storage service is selected, make path required
    if (isStoragePathRequired) {
      return baseSchema.extend({
        storagePath: z
          .string()
          .min(1, validationConfig.messages.storagePathRequired)
          .max(
            validationConfig.maxPathLength, 
            `Storage path must be less than ${validationConfig.maxPathLength} characters`
          )
          .refine(
            (path) => {
              // Basic path validation - no leading/trailing spaces, valid characters
              const trimmedPath = path.trim();
              if (trimmedPath !== path) return false;
              
              // Check for invalid characters (adjust as needed for your storage system)
              const invalidChars = /[<>:"|?*\x00-\x1f]/;
              return !invalidChars.test(path);
            },
            {
              message: validationConfig.messages.storagePathInvalid
            }
          )
      });
    }

    // If no storage service selected, path can be empty
    return baseSchema.extend({
      storagePath: validationConfig.allowEmptyPath 
        ? z.string().optional().or(z.literal(''))
        : z.string().min(1, validationConfig.messages.storagePathRequired)
    });
  }, [isStoragePathRequired, validationConfig]);

  // Get current validation state for storage path
  const storagePathValidationState = useMemo<EnhancedValidationState>(() => {
    const error = errors['storagePath' as keyof T] as FormFieldError | undefined;
    const hasError = Boolean(error);
    const isValidating = false; // Could be enhanced with async validation state
    
    return {
      isValid: !hasError,
      isDirty: Boolean(storagePath && storagePath !== ''),
      isTouched: Boolean(storagePath !== undefined),
      error: error?.message,
      validationTime: validationMetrics.current.lastValidationTime,
      isValidating,
      hasBeenValidated: validationMetrics.current.totalValidations > 0,
      lastValidated: validationMetrics.current.totalValidations > 0 
        ? new Date() 
        : undefined
    };
  }, [errors, storagePath, validationMetrics.current]);

  /**
   * Validate storage path field with performance tracking
   */
  const validateStoragePath = useCallback(async (): Promise<boolean> => {
    const startTime = performance.now();
    
    try {
      const result = await trigger('storagePath' as Path<T>);
      
      // Track validation performance
      const validationTime = performance.now() - startTime;
      validationMetrics.current.lastValidationTime = validationTime;
      validationMetrics.current.totalValidationTime += validationTime;
      validationMetrics.current.totalValidations += 1;
      validationMetrics.current.validationHistory.push(validationTime);
      
      // Keep only last 10 validation times for average calculation
      if (validationMetrics.current.validationHistory.length > 10) {
        validationMetrics.current.validationHistory.shift();
      }
      
      return result;
    } catch (error) {
      console.error('Storage path validation error:', error);
      return false;
    }
  }, [trigger]);

  /**
   * Handle storage service change with automatic path reset and validation
   * Replicates the Angular component's storageServiceId.valueChanges behavior
   */
  const handleStorageServiceChange = useCallback((serviceId: string | null) => {
    // Clear any existing debounce
    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current);
    }

    // Update storage service ID
    setValue('storageServiceId' as Path<T>, serviceId as any);

    // Reset storage path when service changes (matches Angular behavior)
    setValue('storagePath' as Path<T>, '' as any);
    
    // Clear any existing storage path errors
    clearErrors('storagePath' as Path<T>);

    // Validate after state update if real-time validation is enabled
    if (validationConfig.realTimeValidation) {
      debounceTimeoutRef.current = setTimeout(() => {
        validateStoragePath();
      }, validationConfig.debounceMs);
    }
  }, [setValue, clearErrors, validateStoragePath, validationConfig]);

  /**
   * Handle storage path change with debounced validation
   */
  const handleStoragePathChange = useCallback((path: string) => {
    // Clear any existing debounce
    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current);
    }

    // Update path value
    setValue('storagePath' as Path<T>, path as any);

    // Debounced validation
    if (validationConfig.realTimeValidation) {
      debounceTimeoutRef.current = setTimeout(() => {
        validateStoragePath();
      }, validationConfig.debounceMs);
    }
  }, [setValue, validateStoragePath, validationConfig]);

  /**
   * Get formatted validation error messages
   */
  const getValidationErrors = useCallback(() => {
    const storageServiceError = errors['storageServiceId' as keyof T] as FormFieldError | undefined;
    const storagePathError = errors['storagePath' as keyof T] as FormFieldError | undefined;

    return {
      storageServiceId: storageServiceError ? {
        ...storageServiceError,
        severity: 'error' as const,
        field: 'storageServiceId',
        timestamp: new Date()
      } : undefined,
      storagePath: storagePathError ? {
        ...storagePathError,
        severity: 'error' as const,
        field: 'storagePath',
        timestamp: new Date()
      } : undefined
    };
  }, [errors]);

  /**
   * Reset validation state and clear errors
   */
  const resetValidation = useCallback(() => {
    clearErrors(['storageServiceId' as Path<T>, 'storagePath' as Path<T>]);
    
    // Reset performance metrics
    validationMetrics.current = {
      lastValidationTime: 0,
      totalValidationTime: 0,
      totalValidations: 0,
      validationHistory: []
    };
    
    // Clear any pending debounce
    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current);
    }
  }, [clearErrors]);

  // Calculate average validation time
  const averageValidationTime = useMemo(() => {
    const { validationHistory } = validationMetrics.current;
    if (validationHistory.length === 0) return 0;
    
    return validationHistory.reduce((sum, time) => sum + time, 0) / validationHistory.length;
  }, [validationMetrics.current.validationHistory]);

  // Effect to handle automatic validation when storage service selection changes
  // Replicates the Angular component's ngOnInit and valueChanges subscription behavior
  useEffect(() => {
    // If storage service is selected on mount, ensure path validation is applied
    if (storageServiceId && !storagePath) {
      // This matches the Angular behavior: if service is selected, path validation is required
      if (validationConfig.realTimeValidation) {
        const timeoutId = setTimeout(() => {
          validateStoragePath();
        }, validationConfig.debounceMs);
        
        return () => clearTimeout(timeoutId);
      }
    }
  }, [storageServiceId, storagePath, validateStoragePath, validationConfig]);

  // Cleanup debounce on unmount
  useEffect(() => {
    return () => {
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current);
      }
    };
  }, []);

  return {
    validationSchema,
    validateStoragePath,
    isStoragePathRequired,
    storagePathValidationState,
    handleStorageServiceChange,
    handleStoragePathChange,
    getValidationErrors,
    resetValidation,
    validationMetrics: {
      lastValidationTime: validationMetrics.current.lastValidationTime,
      averageValidationTime,
      totalValidations: validationMetrics.current.totalValidations
    }
  };
}

export default useStorageValidation;