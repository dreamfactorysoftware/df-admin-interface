/**
 * React Hook for Storage Path Validation Logic
 * 
 * Manages storage path validation logic and form control integration for the script editor.
 * Handles the dynamic validation requirements where storage path becomes required when a 
 * storage service is selected, replicating the Angular component's FormControl validation 
 * patterns with React Hook Form.
 * 
 * Key Features:
 * - Dynamic validation rules based on storage service selection
 * - Real-time validation feedback under 100ms requirement
 * - Automatic form field reset behavior on service changes
 * - TypeScript 5.8+ strict typing with Zod schema integration
 * - React Hook Form integration with error state management
 * 
 * @fileoverview Storage validation hook for script editor form integration
 * @version 1.0.0
 */

import { useCallback, useEffect, useMemo } from 'react';
import { type UseFormReturn, type FieldValues, type Path } from 'react-hook-form';
import { z } from 'zod';
import { 
  type ScriptEditorFormData, 
  type StorageService,
  type StoragePathValidation 
} from '../types';

// =============================================================================
// TYPE DEFINITIONS
// =============================================================================

/**
 * Configuration options for the useStorageValidation hook
 */
export interface UseStorageValidationConfig {
  /** React Hook Form instance for form integration */
  form: UseFormReturn<ScriptEditorFormData>;
  /** Available storage services for validation context */
  storageServices?: StorageService[];
  /** Custom validation rules for storage paths */
  pathValidation?: StoragePathValidation;
  /** Debounce time for validation in milliseconds (default: 100ms) */
  debounceTime?: number;
  /** Enable real-time validation (default: true) */
  realTimeValidation?: boolean;
  /** Custom error messages */
  errorMessages?: {
    pathRequired?: string;
    pathInvalid?: string;
    serviceRequired?: string;
  };
}

/**
 * Validation result interface for storage path validation
 */
export interface StorageValidationResult {
  /** Whether the storage path is valid */
  isValid: boolean;
  /** Validation error message if invalid */
  error?: string;
  /** Validation error code for programmatic handling */
  errorCode?: StorageValidationErrorCode;
}

/**
 * Storage validation error codes for specific error handling
 */
export type StorageValidationErrorCode = 
  | 'STORAGE_PATH_REQUIRED'
  | 'STORAGE_PATH_INVALID'
  | 'STORAGE_PATH_TOO_LONG'
  | 'STORAGE_PATH_TOO_SHORT'
  | 'STORAGE_PATH_FORBIDDEN_PATTERN'
  | 'STORAGE_SERVICE_REQUIRED';

/**
 * Return type for the useStorageValidation hook
 */
export interface UseStorageValidationReturn {
  /** Current validation state for storage path */
  validationState: {
    isValid: boolean;
    error?: string;
    errorCode?: StorageValidationErrorCode;
    isDirty: boolean;
    isTouched: boolean;
  };
  
  /** Validation utilities and methods */
  validation: {
    /** Validate storage path based on current service selection */
    validateStoragePath: (path?: string, serviceId?: string) => StorageValidationResult;
    /** Clear validation errors */
    clearValidationErrors: () => void;
    /** Reset form fields related to storage */
    resetStorageFields: () => void;
    /** Check if storage path is required based on service selection */
    isStoragePathRequired: () => boolean;
  };
  
  /** Form field state management */
  fieldState: {
    /** Whether storage path field should be enabled */
    isStoragePathEnabled: boolean;
    /** Whether storage path field should be required */
    isStoragePathRequired: boolean;
    /** Current storage service selection */
    selectedServiceId?: string;
    /** Current storage path value */
    storagePath?: string;
  };
  
  /** Event handlers for form integration */
  handlers: {
    /** Handle storage service selection change */
    onStorageServiceChange: (serviceId: string | null) => void;
    /** Handle storage path change */
    onStoragePathChange: (path: string) => void;
    /** Handle form field focus events */
    onFieldFocus: (fieldName: 'storageServiceId' | 'storagePath') => void;
    /** Handle form field blur events */
    onFieldBlur: (fieldName: 'storageServiceId' | 'storagePath') => void;
  };
}

// =============================================================================
// VALIDATION SCHEMAS
// =============================================================================

/**
 * Dynamic Zod schema for storage path validation
 * Creates a validation schema that adapts based on storage service selection
 */
const createStoragePathSchema = (
  storageServiceId?: string,
  pathValidation?: StoragePathValidation,
  errorMessages?: UseStorageValidationConfig['errorMessages']
) => {
  // Base storage path schema
  let pathSchema = z.string();
  
  // Apply conditional required validation based on service selection
  if (storageServiceId) {
    pathSchema = pathSchema
      .min(1, errorMessages?.pathRequired || 'Storage path is required when a storage service is selected');
    
    // Apply additional validation rules if provided
    if (pathValidation) {
      // Minimum length validation
      if (pathValidation.minLength) {
        pathSchema = pathSchema.min(
          pathValidation.minLength,
          `Storage path must be at least ${pathValidation.minLength} characters`
        );
      }
      
      // Maximum length validation
      if (pathValidation.maxLength) {
        pathSchema = pathSchema.max(
          pathValidation.maxLength,
          `Storage path must be less than ${pathValidation.maxLength} characters`
        );
      }
      
      // Pattern validation
      if (pathValidation.allowedPatterns?.length) {
        pathSchema = pathSchema.refine(
          (path) => pathValidation.allowedPatterns!.some(pattern => 
            new RegExp(pattern).test(path)
          ),
          {
            message: errorMessages?.pathInvalid || 'Storage path format is invalid'
          }
        );
      }
      
      // Forbidden pattern validation
      if (pathValidation.forbiddenPatterns?.length) {
        pathSchema = pathSchema.refine(
          (path) => !pathValidation.forbiddenPatterns!.some(pattern => 
            new RegExp(pattern).test(path)
          ),
          {
            message: 'Storage path contains forbidden characters or patterns'
          }
        );
      }
    }
  } else {
    // Optional when no service is selected
    pathSchema = pathSchema.optional();
  }
  
  return pathSchema;
};

// =============================================================================
// MAIN HOOK IMPLEMENTATION
// =============================================================================

/**
 * Custom React hook for managing storage path validation logic and form control integration
 * 
 * This hook implements the dynamic validation requirements where storage path becomes required
 * when a storage service is selected, replicating the Angular component's FormControl validation
 * patterns with React Hook Form integration.
 * 
 * @param config - Configuration options for the hook
 * @returns Hook return object with validation state and utilities
 * 
 * @example
 * ```tsx
 * const form = useForm<ScriptEditorFormData>({
 *   resolver: zodResolver(ScriptEditorFormSchema),
 *   mode: 'onChange',
 *   defaultValues: {
 *     content: '',
 *     storageServiceId: '',
 *     storagePath: ''
 *   }
 * });
 * 
 * const storageValidation = useStorageValidation({
 *   form,
 *   storageServices,
 *   realTimeValidation: true,
 *   debounceTime: 100
 * });
 * 
 * // Use in component
 * const { validationState, handlers, fieldState } = storageValidation;
 * ```
 */
export function useStorageValidation(
  config: UseStorageValidationConfig
): UseStorageValidationReturn {
  const {
    form,
    storageServices = [],
    pathValidation,
    debounceTime = 100,
    realTimeValidation = true,
    errorMessages
  } = config;
  
  // Extract form methods and state
  const { 
    watch, 
    setValue, 
    setError, 
    clearErrors, 
    formState: { errors, touchedFields, dirtyFields },
    trigger,
    resetField
  } = form;
  
  // Watch form field values for reactive validation
  const storageServiceId = watch('storageServiceId');
  const storagePath = watch('storagePath');
  
  // =============================================================================
  // VALIDATION LOGIC
  // =============================================================================
  
  /**
   * Validates storage path based on current service selection and custom rules
   */
  const validateStoragePath = useCallback((
    path?: string, 
    serviceId?: string
  ): StorageValidationResult => {
    const currentPath = path ?? storagePath;
    const currentServiceId = serviceId ?? storageServiceId;
    
    try {
      // Create dynamic schema based on current service selection
      const schema = createStoragePathSchema(currentServiceId, pathValidation, errorMessages);
      
      // Validate the path
      schema.parse(currentPath);
      
      // Apply custom validation if provided
      if (pathValidation?.customValidator && currentPath && currentServiceId) {
        const selectedService = storageServices.find(s => s.id === currentServiceId);
        if (selectedService) {
          const customError = pathValidation.customValidator(currentPath, selectedService.type);
          if (customError) {
            return {
              isValid: false,
              error: customError,
              errorCode: 'STORAGE_PATH_INVALID'
            };
          }
        }
      }
      
      return { isValid: true };
    } catch (error) {
      if (error instanceof z.ZodError) {
        const firstError = error.errors[0];
        return {
          isValid: false,
          error: firstError.message,
          errorCode: getErrorCodeFromMessage(firstError.message)
        };
      }
      
      return {
        isValid: false,
        error: 'Storage path validation failed',
        errorCode: 'STORAGE_PATH_INVALID'
      };
    }
  }, [storagePath, storageServiceId, pathValidation, errorMessages, storageServices]);
  
  /**
   * Maps validation error messages to specific error codes
   */
  const getErrorCodeFromMessage = useCallback((message: string): StorageValidationErrorCode => {
    if (message.includes('required')) return 'STORAGE_PATH_REQUIRED';
    if (message.includes('at least')) return 'STORAGE_PATH_TOO_SHORT';
    if (message.includes('less than')) return 'STORAGE_PATH_TOO_LONG';
    if (message.includes('forbidden')) return 'STORAGE_PATH_FORBIDDEN_PATTERN';
    return 'STORAGE_PATH_INVALID';
  }, []);
  
  /**
   * Determines if storage path is required based on service selection
   */
  const isStoragePathRequired = useCallback((): boolean => {
    return Boolean(storageServiceId && storageServiceId.trim().length > 0);
  }, [storageServiceId]);
  
  /**
   * Clears validation errors for storage fields
   */
  const clearValidationErrors = useCallback(() => {
    clearErrors(['storageServiceId', 'storagePath']);
  }, [clearErrors]);
  
  /**
   * Resets storage-related form fields
   */
  const resetStorageFields = useCallback(() => {
    resetField('storagePath');
    clearValidationErrors();
  }, [resetField, clearValidationErrors]);
  
  // =============================================================================
  // EVENT HANDLERS
  // =============================================================================
  
  /**
   * Handles storage service selection change
   * Implements the Angular component's valueChanges subscription logic
   */
  const onStorageServiceChange = useCallback((serviceId: string | null) => {
    // Reset storage path when service changes (replicating Angular behavior)
    resetField('storagePath');
    
    // Update the service ID
    setValue('storageServiceId', serviceId || '', { shouldValidate: realTimeValidation });
    
    // Clear any existing errors
    clearErrors('storagePath');
    
    // Trigger validation if real-time validation is enabled
    if (realTimeValidation && serviceId) {
      // Use setTimeout to ensure validation happens after state updates
      setTimeout(() => {
        trigger('storagePath');
      }, debounceTime);
    }
  }, [resetField, setValue, clearErrors, trigger, realTimeValidation, debounceTime]);
  
  /**
   * Handles storage path change with debounced validation
   */
  const onStoragePathChange = useCallback((path: string) => {
    setValue('storagePath', path, { shouldValidate: realTimeValidation });
    
    if (realTimeValidation) {
      // Debounced validation to meet 100ms requirement
      setTimeout(() => {
        const validationResult = validateStoragePath(path);
        if (!validationResult.isValid && validationResult.error) {
          setError('storagePath', {
            type: 'validation',
            message: validationResult.error
          });
        } else {
          clearErrors('storagePath');
        }
      }, debounceTime);
    }
  }, [setValue, validateStoragePath, setError, clearErrors, realTimeValidation, debounceTime]);
  
  /**
   * Handles field focus events for accessibility and UX
   */
  const onFieldFocus = useCallback((fieldName: 'storageServiceId' | 'storagePath') => {
    // Clear errors on focus to improve UX
    clearErrors(fieldName);
  }, [clearErrors]);
  
  /**
   * Handles field blur events for validation triggers
   */
  const onFieldBlur = useCallback((fieldName: 'storageServiceId' | 'storagePath') => {
    // Trigger validation on blur
    trigger(fieldName);
  }, [trigger]);
  
  // =============================================================================
  // EFFECTS
  // =============================================================================
  
  /**
   * Effect to handle storage service changes and apply validation
   * Replicates the Angular component's ngOnInit and valueChanges logic
   */
  useEffect(() => {
    // Apply initial validation if storage service is already selected
    if (storageServiceId) {
      // Add required validation to storage path
      if (realTimeValidation) {
        trigger('storagePath');
      }
    } else {
      // Clear storage path validation errors when no service is selected
      clearErrors('storagePath');
    }
  }, [storageServiceId, trigger, clearErrors, realTimeValidation]);
  
  /**
   * Effect for real-time storage path validation
   */
  useEffect(() => {
    if (realTimeValidation && storagePath !== undefined) {
      const timeoutId = setTimeout(() => {
        const validationResult = validateStoragePath();
        if (!validationResult.isValid && validationResult.error) {
          setError('storagePath', {
            type: 'validation',
            message: validationResult.error
          });
        } else if (validationResult.isValid && errors.storagePath) {
          clearErrors('storagePath');
        }
      }, debounceTime);
      
      return () => clearTimeout(timeoutId);
    }
  }, [storagePath, validateStoragePath, setError, clearErrors, errors.storagePath, realTimeValidation, debounceTime]);
  
  // =============================================================================
  // COMPUTED VALUES
  // =============================================================================
  
  /**
   * Current validation state for storage path
   */
  const validationState = useMemo(() => {
    const result = validateStoragePath();
    return {
      isValid: result.isValid,
      error: result.error,
      errorCode: result.errorCode,
      isDirty: Boolean(dirtyFields.storagePath),
      isTouched: Boolean(touchedFields.storagePath)
    };
  }, [validateStoragePath, dirtyFields.storagePath, touchedFields.storagePath]);
  
  /**
   * Form field state information
   */
  const fieldState = useMemo(() => ({
    isStoragePathEnabled: true, // Always enabled for user interaction
    isStoragePathRequired: isStoragePathRequired(),
    selectedServiceId: storageServiceId,
    storagePath
  }), [storageServiceId, storagePath, isStoragePathRequired]);
  
  /**
   * Event handlers object for component integration
   */
  const handlers = useMemo(() => ({
    onStorageServiceChange,
    onStoragePathChange,
    onFieldFocus,
    onFieldBlur
  }), [onStorageServiceChange, onStoragePathChange, onFieldFocus, onFieldBlur]);
  
  /**
   * Validation utilities object
   */
  const validation = useMemo(() => ({
    validateStoragePath,
    clearValidationErrors,
    resetStorageFields,
    isStoragePathRequired
  }), [validateStoragePath, clearValidationErrors, resetStorageFields, isStoragePathRequired]);
  
  // =============================================================================
  // RETURN HOOK INTERFACE
  // =============================================================================
  
  return {
    validationState,
    validation,
    fieldState,
    handlers
  };
}

// =============================================================================
// EXPORTS
// =============================================================================

export default useStorageValidation;

export type {
  UseStorageValidationConfig,
  UseStorageValidationReturn,
  StorageValidationResult,
  StorageValidationErrorCode
};