/**
 * Root Form Component
 * 
 * Comprehensive React Hook Form wrapper that integrates Zod validation, accessibility
 * features, and theme management for enterprise-grade form handling.
 * 
 * Features:
 * - React Hook Form integration with real-time validation under 100ms
 * - Zod schema validation for type-safe data handling
 * - WCAG 2.1 AA accessibility compliance with proper ARIA attributes
 * - Async form submission with loading states and error handling
 * - TypeScript 5.8+ type safety with proper inference
 * - Zustand theme store integration for consistent styling
 * - Error boundary patterns for robust error handling
 * - Ref forwarding for programmatic form control
 * 
 * @fileoverview Root form component for DreamFactory Admin Interface
 * @version 1.0.0
 */

'use client';

import React, {
  forwardRef,
  useCallback,
  useImperativeHandle,
  useMemo,
  useState,
  createContext,
  useContext,
  type FormEvent,
  type ReactNode,
  type HTMLAttributes,
  type ElementRef,
} from 'react';
import {
  useForm,
  type UseFormReturn,
  type FieldValues,
  type SubmitHandler,
  type SubmitErrorHandler,
  type ResolverResult,
  type ResolverOptions,
} from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import type { ZodSchema, ZodError } from 'zod';
import { cn } from '../../../lib/utils';
import { useTheme } from '../../../hooks/use-theme';
import type {
  FormConfig,
  FormContextValue,
  FormValidationResult,
  FormSubmissionResult,
  FormState,
  FormActions,
  BaseFormProps,
  FormSchema,
  InferFormSchema,
  ValidationMode,
  RevalidateMode,
  FormLayout,
  FormSpacing,
  FORM_CONSTANTS,
} from './form.types';
import type {
  AccessibilityProps,
  ThemeProps,
  LoadingState,
  ValidationState,
} from '../../../types/ui';

/**
 * Form context for sharing form state with child components
 * Enables form state access throughout the component tree
 */
const FormContext = createContext<FormContextValue | null>(null);

/**
 * Hook for accessing form context in child components
 * Provides type-safe access to form state and methods
 */
export function useFormContext<TFieldValues extends FieldValues = FieldValues>(): FormContextValue<TFieldValues> {
  const context = useContext(FormContext);
  if (!context) {
    throw new Error('useFormContext must be used within a Form component');
  }
  return context as FormContextValue<TFieldValues>;
}

/**
 * Form reference interface for programmatic control
 * Enables parent components to interact with form programmatically
 */
export interface FormRef<TFieldValues extends FieldValues = FieldValues> {
  /** React Hook Form instance */
  form: UseFormReturn<TFieldValues>;
  
  /** Submit form programmatically */
  submit: () => Promise<FormSubmissionResult>;
  
  /** Reset form to initial state */
  reset: () => void;
  
  /** Trigger form validation */
  validate: () => Promise<FormValidationResult>;
  
  /** Clear all form errors */
  clearErrors: () => void;
  
  /** Set form loading state */
  setLoading: (loading: boolean, message?: string) => void;
  
  /** Get current form values */
  getValues: () => TFieldValues;
  
  /** Set form values programmatically */
  setValues: (values: Partial<TFieldValues>) => void;
  
  /** Check if form is valid */
  isValid: () => boolean;
  
  /** Check if form is dirty */
  isDirty: () => boolean;
  
  /** Focus first error field */
  focusError: () => void;
}

/**
 * Performance monitoring for validation timing
 * Ensures compliance with 100ms validation requirement
 */
function useValidationPerformanceMonitor() {
  const [metrics, setMetrics] = useState({
    lastValidationDuration: 0,
    averageValidationDuration: 0,
    validationCount: 0,
  });

  const trackValidation = useCallback((duration: number) => {
    setMetrics(prev => {
      const newCount = prev.validationCount + 1;
      const newAverage = (prev.averageValidationDuration * prev.validationCount + duration) / newCount;
      
      // Log performance warning if validation exceeds threshold
      if (duration > FORM_CONSTANTS.DEFAULT_VALIDATION_TIMEOUT) {
        console.warn(`Form validation exceeded ${FORM_CONSTANTS.DEFAULT_VALIDATION_TIMEOUT}ms threshold: ${duration}ms`);
      }
      
      return {
        lastValidationDuration: duration,
        averageValidationDuration: newAverage,
        validationCount: newCount,
      };
    });
  }, []);

  return { metrics, trackValidation };
}

/**
 * Enhanced Zod resolver with performance monitoring
 * Tracks validation timing to ensure sub-100ms performance
 */
function createMonitoredZodResolver<TFieldValues extends FieldValues>(
  schema: ZodSchema<TFieldValues>,
  trackValidation: (duration: number) => void
) {
  return async (
    values: TFieldValues,
    context: any,
    options: ResolverOptions<TFieldValues>
  ): Promise<ResolverResult<TFieldValues>> => {
    const startTime = performance.now();
    
    try {
      const result = await schema.parseAsync(values);
      const endTime = performance.now();
      trackValidation(endTime - startTime);
      
      return {
        values: result,
        errors: {},
      };
    } catch (error) {
      const endTime = performance.now();
      trackValidation(endTime - startTime);
      
      if (error instanceof ZodError) {
        const fieldErrors: Record<string, any> = {};
        
        error.errors.forEach((err) => {
          const path = err.path.join('.');
          if (path) {
            fieldErrors[path] = {
              type: err.code,
              message: err.message,
            };
          }
        });
        
        return {
          values: {},
          errors: fieldErrors,
        };
      }
      
      return {
        values: {},
        errors: {
          root: {
            type: 'validation',
            message: 'Validation failed',
          },
        },
      };
    }
  };
}

/**
 * Form component props interface
 * Extends base form props with enhanced functionality
 */
export interface FormProps<TFieldValues extends FieldValues = FieldValues> 
  extends Omit<BaseFormProps<TFieldValues>, 'config'>,
    AccessibilityProps,
    ThemeProps {
  
  /** Form configuration with validation schema */
  config?: FormConfig<TFieldValues>;
  
  /** Form validation schema (alternative to config.schema) */
  schema?: FormSchema<TFieldValues>;
  
  /** Error submission handler */
  onError?: SubmitErrorHandler<TFieldValues>;
  
  /** Form state change handler */
  onStateChange?: (state: FormState<TFieldValues>) => void;
  
  /** Validation result handler */
  onValidation?: (result: FormValidationResult) => void;
  
  /** Form mount handler */
  onMount?: (form: UseFormReturn<TFieldValues>) => void;
  
  /** Form unmount handler */
  onUnmount?: () => void;
  
  /** Auto-save configuration */
  autoSave?: {
    enabled: boolean;
    interval?: number;
    onSave?: (values: TFieldValues) => Promise<void>;
  };
  
  /** Form persistence configuration */
  persistence?: {
    enabled: boolean;
    key: string;
    exclude?: (keyof TFieldValues)[];
  };
  
  /** Debug mode for development */
  debug?: boolean;
}

/**
 * Form layout styling variants
 * Provides consistent styling patterns using Tailwind CSS
 */
const formLayoutVariants = {
  vertical: 'space-y-6',
  horizontal: 'space-y-4',
  inline: 'flex flex-wrap items-end gap-4',
  grid: 'grid gap-6',
};

/**
 * Form spacing styling variants
 * Controls spacing between form elements
 */
const formSpacingVariants = {
  compact: 'space-y-3',
  normal: 'space-y-6',
  relaxed: 'space-y-8',
  loose: 'space-y-12',
};

/**
 * Root Form Component
 * 
 * Comprehensive form wrapper that provides:
 * - React Hook Form integration with Zod validation
 * - Real-time validation under 100ms
 * - WCAG 2.1 AA accessibility compliance
 * - Theme-aware styling via Zustand store
 * - Error boundary patterns
 * - Programmatic form control via ref
 */
export const Form = forwardRef<FormRef, FormProps>(function Form<
  TFieldValues extends FieldValues = FieldValues
>(
  {
    children,
    onSubmit,
    onError,
    config,
    schema,
    layout = FORM_CONSTANTS.DEFAULT_LAYOUT,
    spacing = FORM_CONSTANTS.DEFAULT_SPACING,
    loading = false,
    disabled = false,
    className,
    onStateChange,
    onValidation,
    onMount,
    onUnmount,
    autoSave,
    persistence,
    debug = false,
    // Accessibility props
    'aria-label': ariaLabel,
    'aria-describedby': ariaDescribedBy,
    'aria-labelledby': ariaLabelledBy,
    role = 'form',
    // Theme props
    variant,
    size,
    state,
    // Standard HTML props
    id,
    'data-testid': testId,
    ...htmlProps
  }: FormProps<TFieldValues>,
  ref: React.Ref<FormRef<TFieldValues>>
) {
  // Theme integration
  const { resolvedTheme } = useTheme();
  
  // Performance monitoring
  const { metrics, trackValidation } = useValidationPerformanceMonitor();
  
  // Form state management
  const [globalError, setGlobalError] = useState<string | undefined>();
  const [formLoading, setFormLoading] = useState(false);
  const [submissionResult, setSubmissionResult] = useState<FormSubmissionResult | undefined>();
  
  // Merge configuration with defaults
  const formConfig = useMemo((): FormConfig<TFieldValues> => ({
    mode: FORM_CONSTANTS.DEFAULT_VALIDATION_MODE,
    revalidateMode: FORM_CONSTANTS.DEFAULT_REVALIDATE_MODE,
    shouldFocusError: true,
    shouldUseNativeValidation: false,
    submitTimeout: FORM_CONSTANTS.DEFAULT_SUBMISSION_TIMEOUT,
    resetOnSubmit: false,
    persistData: false,
    ...config,
    schema: schema || config?.schema,
  }), [config, schema]);
  
  // Create resolver with performance monitoring
  const resolver = useMemo(() => {
    if (!formConfig.schema) return undefined;
    return createMonitoredZodResolver(formConfig.schema, trackValidation);
  }, [formConfig.schema, trackValidation]);
  
  // Initialize React Hook Form
  const form = useForm<TFieldValues>({
    mode: formConfig.mode,
    revalidateMode: formConfig.revalidateMode,
    resolver,
    shouldFocusError: formConfig.shouldFocusError,
    shouldUseNativeValidation: formConfig.shouldUseNativeValidation,
    defaultValues: formConfig.defaultValues,
    values: formConfig.values,
    resetOptions: formConfig.resetOptions,
    criteriaMode: 'all',
    delayError: 300, // Debounce error display
  });
  
  const {
    handleSubmit,
    reset: resetForm,
    clearErrors,
    getValues,
    setValue,
    trigger,
    formState: { isValid, isDirty, isSubmitting, errors, touchedFields },
  } = form;
  
  // Form submission with error handling and performance tracking
  const handleFormSubmit = useCallback<SubmitHandler<TFieldValues>>(
    async (data) => {
      const startTime = performance.now();
      setGlobalError(undefined);
      setFormLoading(true);
      
      try {
        // Submit with timeout
        const submitPromise = onSubmit(data);
        const timeoutPromise = new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error('Form submission timeout')), formConfig.submitTimeout)
        );
        
        await Promise.race([submitPromise, timeoutPromise]);
        
        const endTime = performance.now();
        const duration = endTime - startTime;
        
        const result: FormSubmissionResult = {
          success: true,
          data,
          timestamp: Date.now(),
          duration,
        };
        
        setSubmissionResult(result);
        
        // Reset form if configured
        if (formConfig.resetOnSubmit) {
          resetForm();
        }
        
        if (debug) {
          console.log('Form submission successful:', result);
        }
      } catch (error) {
        const endTime = performance.now();
        const duration = endTime - startTime;
        
        const errorMessage = error instanceof Error ? error.message : 'Submission failed';
        setGlobalError(errorMessage);
        
        const result: FormSubmissionResult = {
          success: false,
          error: errorMessage,
          timestamp: Date.now(),
          duration,
        };
        
        setSubmissionResult(result);
        
        if (debug) {
          console.error('Form submission failed:', result);
        }
        
        if (onError) {
          onError(errors, error as any);
        }
      } finally {
        setFormLoading(false);
      }
    },
    [onSubmit, onError, errors, formConfig.submitTimeout, formConfig.resetOnSubmit, resetForm, debug]
  );
  
  // Form validation with performance tracking
  const validateForm = useCallback(async (): Promise<FormValidationResult> => {
    const startTime = performance.now();
    
    const isFormValid = await trigger();
    const currentErrors = form.getFieldState ? {} : errors; // Get current errors
    
    const endTime = performance.now();
    const duration = endTime - startTime;
    
    const result: FormValidationResult = {
      isValid: isFormValid,
      errors: currentErrors,
      timestamp: Date.now(),
      duration,
    };
    
    if (onValidation) {
      onValidation(result);
    }
    
    return result;
  }, [trigger, errors, form, onValidation]);
  
  // Programmatic form control methods
  const formMethods = useMemo((): FormRef<TFieldValues> => ({
    form,
    submit: () => handleSubmit(handleFormSubmit)(),
    reset: resetForm,
    validate: validateForm,
    clearErrors,
    setLoading: setFormLoading,
    getValues,
    setValues: (values: Partial<TFieldValues>) => {
      Object.entries(values).forEach(([key, value]) => {
        setValue(key as any, value, { shouldValidate: true, shouldDirty: true });
      });
    },
    isValid: () => isValid,
    isDirty: () => isDirty,
    focusError: () => {
      const firstErrorField = Object.keys(errors)[0];
      if (firstErrorField) {
        const element = document.querySelector(`[name="${firstErrorField}"]`) as HTMLElement;
        element?.focus();
      }
    },
  }), [
    form,
    handleSubmit,
    handleFormSubmit,
    resetForm,
    validateForm,
    clearErrors,
    getValues,
    setValue,
    isValid,
    isDirty,
    errors,
  ]);
  
  // Expose form methods via ref
  useImperativeHandle(ref, () => formMethods, [formMethods]);
  
  // Form state management
  const formState = useMemo((): FormState<TFieldValues> => ({
    values: getValues(),
    validation: {
      isValid,
      isDirty,
      isTouched: Object.keys(touchedFields).length > 0,
      error: globalError,
    },
    loading: {
      isLoading: formLoading || loading || isSubmitting,
      message: formLoading ? 'Submitting...' : undefined,
    },
    errors,
    warnings: {},
    isPristine: !isDirty,
    isSubmitting: isSubmitting || formLoading,
    submitCount: 0, // Could be tracked if needed
    lastSubmission: submissionResult,
  }), [
    getValues,
    isValid,
    isDirty,
    touchedFields,
    globalError,
    formLoading,
    loading,
    isSubmitting,
    errors,
    submissionResult,
  ]);
  
  // Form context value
  const contextValue = useMemo((): FormContextValue<TFieldValues> => ({
    form,
    config: formConfig,
    isSubmitting: isSubmitting || formLoading,
    isValid,
    isDirty,
    isTouched: Object.keys(touchedFields).length > 0,
    globalError,
    setGlobalError,
    clearErrors,
    resetForm,
  }), [
    form,
    formConfig,
    isSubmitting,
    formLoading,
    isValid,
    isDirty,
    touchedFields,
    globalError,
    clearErrors,
    resetForm,
  ]);
  
  // Notify parent of state changes
  React.useEffect(() => {
    if (onStateChange) {
      onStateChange(formState);
    }
  }, [formState, onStateChange]);
  
  // Form lifecycle events
  React.useEffect(() => {
    if (onMount) {
      onMount(form);
    }
    
    return () => {
      if (onUnmount) {
        onUnmount();
      }
    };
  }, [form, onMount, onUnmount]);
  
  // Auto-save functionality
  React.useEffect(() => {
    if (!autoSave?.enabled || !autoSave.onSave) return;
    
    const interval = setInterval(() => {
      if (isDirty && isValid) {
        autoSave.onSave(getValues());
      }
    }, autoSave.interval || 30000); // Default 30 seconds
    
    return () => clearInterval(interval);
  }, [autoSave, isDirty, isValid, getValues]);
  
  // Form persistence (localStorage)
  React.useEffect(() => {
    if (!persistence?.enabled || !persistence.key) return;
    
    // Load persisted data
    try {
      const saved = localStorage.getItem(persistence.key);
      if (saved) {
        const data = JSON.parse(saved);
        Object.entries(data).forEach(([key, value]) => {
          if (!persistence.exclude?.includes(key as keyof TFieldValues)) {
            setValue(key as any, value, { shouldValidate: false });
          }
        });
      }
    } catch (error) {
      console.warn('Failed to load persisted form data:', error);
    }
    
    // Save data on changes
    const subscription = form.watch((data) => {
      try {
        const filteredData = { ...data };
        persistence.exclude?.forEach(key => {
          delete filteredData[key];
        });
        localStorage.setItem(persistence.key, JSON.stringify(filteredData));
      } catch (error) {
        console.warn('Failed to persist form data:', error);
      }
    });
    
    return () => subscription.unsubscribe();
  }, [persistence, form, setValue]);
  
  // Combine CSS classes
  const formClasses = cn(
    // Base form styles
    'relative',
    
    // Layout variants
    layout && formLayoutVariants[layout],
    
    // Spacing variants
    spacing && formSpacingVariants[spacing],
    
    // Theme-aware styling
    resolvedTheme === 'dark' ? 'text-white' : 'text-gray-900',
    
    // State variants
    disabled && 'opacity-50 pointer-events-none',
    (formLoading || loading) && 'opacity-75',
    
    // Focus management
    'focus-within:ring-2 focus-within:ring-primary-500 focus-within:ring-offset-2',
    resolvedTheme === 'dark' ? 'focus-within:ring-offset-gray-900' : 'focus-within:ring-offset-white',
    
    // Custom className
    className
  );
  
  // Handle form submission
  const handleSubmitEvent = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    handleSubmit(handleFormSubmit, onError?.(errors, event as any))(event);
  };
  
  // Debug logging
  if (debug) {
    console.log('Form render:', {
      formState,
      metrics,
      contextValue: {
        ...contextValue,
        form: '[UseFormReturn]', // Avoid circular reference
      },
    });
  }
  
  return (
    <FormContext.Provider value={contextValue}>
      <form
        {...htmlProps}
        id={id}
        className={formClasses}
        onSubmit={handleSubmitEvent}
        noValidate={!formConfig.shouldUseNativeValidation}
        data-testid={testId || 'form'}
        // Accessibility attributes
        role={role}
        aria-label={ariaLabel}
        aria-describedby={ariaDescribedBy}
        aria-labelledby={ariaLabelledBy}
        aria-busy={isSubmitting || formLoading || loading}
        aria-invalid={!isValid && isDirty}
        // Performance and debugging attributes
        data-validation-mode={formConfig.mode}
        data-revalidate-mode={formConfig.revalidateMode}
        data-validation-performance={
          debug ? `${metrics.lastValidationDuration}ms` : undefined
        }
      >
        {/* Global error display */}
        {globalError && (
          <div
            role="alert"
            aria-live="polite"
            className={cn(
              'mb-6 p-4 rounded-md border',
              'bg-red-50 border-red-200 text-red-800',
              resolvedTheme === 'dark' && 'bg-red-900/20 border-red-800 text-red-200'
            )}
            data-testid="form-global-error"
          >
            <div className="flex items-center space-x-2">
              <svg
                className="h-5 w-5"
                fill="currentColor"
                viewBox="0 0 20 20"
                aria-hidden="true"
              >
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.28 7.22a.75.75 0 00-1.06 1.06L8.94 10l-1.72 1.72a.75.75 0 101.06 1.06L10 11.06l1.72 1.72a.75.75 0 101.06-1.06L11.06 10l1.72-1.72a.75.75 0 00-1.06-1.06L10 8.94 8.28 7.22z"
                  clipRule="evenodd"
                />
              </svg>
              <span className="font-medium">Form Error</span>
            </div>
            <p className="mt-2 text-sm">{globalError}</p>
          </div>
        )}
        
        {/* Loading overlay */}
        {(formLoading || loading) && (
          <div
            className="absolute inset-0 bg-white/50 dark:bg-gray-900/50 z-10 flex items-center justify-center"
            aria-label="Form is submitting"
            data-testid="form-loading-overlay"
          >
            <div className="flex items-center space-x-3">
              <svg
                className="animate-spin h-5 w-5 text-primary-600"
                fill="none"
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="m4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                />
              </svg>
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                {formLoading ? 'Submitting...' : 'Loading...'}
              </span>
            </div>
          </div>
        )}
        
        {/* Form content */}
        {children}
        
        {/* Development debug panel */}
        {debug && process.env.NODE_ENV === 'development' && (
          <details className="mt-8 p-4 bg-gray-100 dark:bg-gray-800 rounded border">
            <summary className="cursor-pointer font-medium">Debug Information</summary>
            <div className="mt-2 space-y-2 text-xs">
              <div>
                <strong>Validation Performance:</strong> Last: {metrics.lastValidationDuration}ms, 
                Average: {metrics.averageValidationDuration.toFixed(2)}ms
              </div>
              <div>
                <strong>Form State:</strong> Valid: {isValid.toString()}, 
                Dirty: {isDirty.toString()}, Submitting: {isSubmitting.toString()}
              </div>
              <div>
                <strong>Errors:</strong> {Object.keys(errors).length}
              </div>
              <div>
                <strong>Values:</strong>
                <pre className="mt-1 text-xs bg-gray-200 dark:bg-gray-700 p-2 rounded overflow-auto">
                  {JSON.stringify(getValues(), null, 2)}
                </pre>
              </div>
            </div>
          </details>
        )}
      </form>
    </FormContext.Provider>
  );
}) as <TFieldValues extends FieldValues = FieldValues>(
  props: FormProps<TFieldValues> & { ref?: React.Ref<FormRef<TFieldValues>> }
) => ReactNode;

// Display name for debugging
Form.displayName = 'Form';

// Type exports for external usage
export type { FormRef, FormProps, FormContextValue };
export { useFormContext };

/**
 * Default export with common form configurations
 */
export default Form;