/**
 * Form Component - React Hook Form Wrapper with Zod Validation
 * 
 * Comprehensive form component that integrates React Hook Form with Zod validation,
 * providing enterprise-grade form handling with real-time validation, accessibility
 * compliance, and seamless theme integration for DreamFactory Admin Interface.
 * 
 * Key Features:
 * - React Hook Form 7.52+ integration with TypeScript 5.8+ type safety
 * - Zod schema validation with real-time feedback under 100ms
 * - WCAG 2.1 AA accessibility compliance with proper ARIA attributes
 * - Zustand theme management integration for consistent styling
 * - Async form submission with loading states and error handling
 * - Form reset and validation methods via ref forwarding
 * - Context provider for child component access to form state
 * - Error boundary patterns for robust error handling
 * - Progressive enhancement and graceful degradation
 * 
 * @fileoverview Form wrapper component for DreamFactory Admin Interface
 * @version 1.0.0
 * @since React 19.0.0, Next.js 15.1+, TypeScript 5.8+
 */

'use client';

import React, { 
  forwardRef, 
  useImperativeHandle, 
  useRef, 
  useState, 
  useCallback, 
  useMemo,
  useEffect,
  createContext,
  useContext
} from 'react';
import { 
  useForm, 
  FormProvider,
  FieldValues,
  UseFormReturn,
  SubmitHandler,
  SubmitErrorHandler 
} from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { cva, type VariantProps } from 'class-variance-authority';
import { useTheme } from '@/hooks/use-theme';
import type {
  FormProps,
  FormContextValue,
  FormValidationState,
  FormSubmissionResult,
  FormFieldValidationResult,
  FormErrorBoundaryProps,
  FormErrorBoundaryState,
  FormPerformanceMetrics
} from './form.types';
import type { 
  BaseComponent, 
  ComponentVariant, 
  ComponentSize,
  LoadingState 
} from '@/types/ui';

// ============================================================================
// FORM STYLING VARIANTS WITH CVA
// ============================================================================

/**
 * Form container styling variants with Tailwind CSS classes
 * Supports theme integration and responsive design
 */
const formVariants = cva(
  // Base styles with accessibility and performance optimizations
  [
    'relative',
    'w-full',
    'transition-colors',
    'duration-150',
    'ease-in-out',
    'focus-within:outline-none',
    'will-change-contents', // Performance optimization for form updates
  ],
  {
    variants: {
      variant: {
        default: [
          'space-y-6',
          'p-0',
        ],
        inline: [
          'flex',
          'flex-wrap',
          'items-end',
          'gap-4',
          'p-0',
        ],
        card: [
          'bg-white',
          'dark:bg-gray-900',
          'border',
          'border-gray-200',
          'dark:border-gray-700',
          'rounded-lg',
          'shadow-sm',
          'p-6',
          'space-y-6',
        ],
        modal: [
          'bg-white',
          'dark:bg-gray-900',
          'p-6',
          'space-y-6',
          'max-h-[80vh]',
          'overflow-y-auto',
        ],
        wizard: [
          'space-y-8',
          'p-6',
        ],
        settings: [
          'space-y-8',
          'p-0',
        ],
        'database-config': [
          'bg-white',
          'dark:bg-gray-900',
          'border',
          'border-gray-200',
          'dark:border-gray-700',
          'rounded-lg',
          'p-6',
          'space-y-8',
        ],
        'api-generation': [
          'space-y-6',
          'p-4',
        ],
      },
      size: {
        xs: 'text-xs',
        sm: 'text-sm',
        md: 'text-base',
        lg: 'text-lg',
        xl: 'text-xl',
      },
      fullWidth: {
        true: 'w-full',
        false: 'w-auto',
      },
      loading: {
        true: [
          'pointer-events-none',
          'opacity-50',
          'cursor-wait',
        ],
        false: '',
      },
      disabled: {
        true: [
          'pointer-events-none',
          'opacity-50',
          'cursor-not-allowed',
        ],
        false: '',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'md',
      fullWidth: true,
      loading: false,
      disabled: false,
    },
  }
);

/**
 * Form error summary styling for accessibility announcements
 */
const errorSummaryVariants = cva(
  [
    'mb-4',
    'p-4',
    'border',
    'rounded-md',
    'focus:outline-none',
    'focus:ring-2',
    'focus:ring-offset-2',
  ],
  {
    variants: {
      variant: {
        default: [
          'bg-red-50',
          'dark:bg-red-900/20',
          'border-red-200',
          'dark:border-red-800',
          'text-red-800',
          'dark:text-red-200',
          'focus:ring-red-500',
        ],
        minimal: [
          'bg-transparent',
          'border-red-300',
          'dark:border-red-700',
          'text-red-700',
          'dark:text-red-300',
          'focus:ring-red-500',
        ],
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  }
);

// ============================================================================
// FORM CONTEXT IMPLEMENTATION
// ============================================================================

/**
 * Form context for sharing form state with child components
 * Provides comprehensive form utilities and validation state
 */
const FormContext = createContext<FormContextValue | null>(null);

/**
 * Custom hook to access form context with error handling
 * Ensures components are used within a form provider
 */
export function useFormContext<TFieldValues extends FieldValues = FieldValues>(): FormContextValue<TFieldValues> {
  const context = useContext(FormContext);
  
  if (!context) {
    throw new Error(
      'useFormContext must be used within a Form component. ' +
      'Make sure your component is wrapped with a <Form> component.'
    );
  }
  
  return context as FormContextValue<TFieldValues>;
}

// ============================================================================
// PERFORMANCE MONITORING UTILITIES
// ============================================================================

/**
 * Performance monitoring hook for form validation timing
 * Tracks validation performance to ensure <100ms requirement
 */
function usePerformanceMonitoring(): {
  measureValidation: <T>(operation: () => T, fieldName?: string) => T;
  getMetrics: () => FormPerformanceMetrics;
  resetMetrics: () => void;
} {
  const metricsRef = useRef<FormPerformanceMetrics>({
    renderTime: 0,
    validationTime: 0,
    submissionTime: 0,
    fieldRenderTimes: {},
    fieldValidationTimes: {},
    estimatedMemoryUsage: 0,
    componentCount: 0,
    interactionCount: 0,
    errorCount: 0,
    validationCount: 0,
  });

  const measureValidation = useCallback(<T>(operation: () => T, fieldName?: string): T => {
    const startTime = performance.now();
    const result = operation();
    const endTime = performance.now();
    const duration = endTime - startTime;

    // Update metrics
    metricsRef.current.validationTime = duration;
    metricsRef.current.validationCount += 1;
    
    if (fieldName) {
      metricsRef.current.fieldValidationTimes[fieldName] = duration;
    }

    // Performance warning if validation exceeds requirement
    if (duration > 100) {
      console.warn(
        `Form validation exceeded 100ms requirement: ${duration.toFixed(2)}ms` +
        (fieldName ? ` for field "${fieldName}"` : '')
      );
    }

    return result;
  }, []);

  const getMetrics = useCallback((): FormPerformanceMetrics => {
    return { ...metricsRef.current };
  }, []);

  const resetMetrics = useCallback((): void => {
    metricsRef.current = {
      renderTime: 0,
      validationTime: 0,
      submissionTime: 0,
      fieldRenderTimes: {},
      fieldValidationTimes: {},
      estimatedMemoryUsage: 0,
      componentCount: 0,
      interactionCount: 0,
      errorCount: 0,
      validationCount: 0,
    };
  }, []);

  return { measureValidation, getMetrics, resetMetrics };
}

// ============================================================================
// ERROR BOUNDARY COMPONENT
// ============================================================================

/**
 * Form-specific error boundary for graceful error handling
 * Provides fallback UI and error recovery mechanisms
 */
class FormErrorBoundary extends React.Component<
  FormErrorBoundaryProps,
  FormErrorBoundaryState
> {
  constructor(props: FormErrorBoundaryProps) {
    super(props);
    this.state = { 
      hasError: false,
      retry: this.retry.bind(this)
    };
  }

  static getDerivedStateFromError(error: Error): Partial<FormErrorBoundaryState> {
    return { 
      hasError: true, 
      error,
    };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    this.setState({ errorInfo });
    this.props.onError?.(error, errorInfo);
    
    // Log error for monitoring
    console.error('Form Error Boundary caught an error:', error, errorInfo);
  }

  retry = () => {
    this.setState({ 
      hasError: false, 
      error: undefined, 
      errorInfo: undefined 
    });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return <this.props.fallback {...this.state} />;
      }

      return (
        <div 
          className="p-6 border border-red-200 dark:border-red-800 rounded-lg bg-red-50 dark:bg-red-900/20"
          role="alert"
          aria-live="assertive"
        >
          <h3 className="text-lg font-medium text-red-800 dark:text-red-200 mb-2">
            Form Error
          </h3>
          <p className="text-red-700 dark:text-red-300 mb-4">
            An error occurred while processing the form. Please try again.
          </p>
          <button
            type="button"
            onClick={this.retry}
            className="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
          >
            Retry
          </button>
          {process.env.NODE_ENV === 'development' && this.state.error && (
            <details className="mt-4">
              <summary className="cursor-pointer text-sm text-red-600 dark:text-red-400">
                Error Details (Development)
              </summary>
              <pre className="mt-2 text-xs text-red-600 dark:text-red-400 overflow-auto">
                {this.state.error.toString()}
                {this.state.errorInfo?.componentStack}
              </pre>
            </details>
          )}
        </div>
      );
    }

    return this.props.children;
  }
}

// ============================================================================
// FORM VALIDATION UTILITIES
// ============================================================================

/**
 * Accessibility announcement utility for screen readers
 * Provides live region updates for form validation feedback
 */
function useAccessibilityAnnouncements() {
  const [liveRegionContent, setLiveRegionContent] = useState<string>('');

  const announceError = useCallback((message: string) => {
    setLiveRegionContent(`Error: ${message}`);
    
    // Clear after announcement to allow repeated announcements
    setTimeout(() => setLiveRegionContent(''), 1000);
  }, []);

  const announceSuccess = useCallback((message: string) => {
    setLiveRegionContent(`Success: ${message}`);
    setTimeout(() => setLiveRegionContent(''), 1000);
  }, []);

  const announceValidation = useCallback((fieldName: string, isValid: boolean) => {
    const message = isValid 
      ? `${fieldName} is valid` 
      : `${fieldName} has validation errors`;
    setLiveRegionContent(message);
    setTimeout(() => setLiveRegionContent(''), 1000);
  }, []);

  return {
    liveRegionContent,
    announceError,
    announceSuccess,
    announceValidation,
  };
}

// ============================================================================
// MAIN FORM COMPONENT
// ============================================================================

/**
 * Form component interface for imperative operations
 */
export interface FormRef<TFieldValues extends FieldValues = FieldValues> {
  /** Submit the form programmatically */
  submit: () => Promise<void>;
  
  /** Reset the form to default values */
  reset: (values?: Partial<TFieldValues>) => void;
  
  /** Validate the entire form */
  validate: () => Promise<boolean>;
  
  /** Validate a specific field */
  validateField: (fieldName: keyof TFieldValues) => Promise<boolean>;
  
  /** Clear all form errors */
  clearErrors: () => void;
  
  /** Set a field error manually */
  setError: (fieldName: keyof TFieldValues, error: { message: string }) => void;
  
  /** Get current form values */
  getValues: () => TFieldValues;
  
  /** Set form values */
  setValues: (values: Partial<TFieldValues>) => void;
  
  /** Focus on the first field with an error */
  focusFirstError: () => void;
  
  /** Get form validation state */
  getValidationState: () => FormValidationState<TFieldValues>;
  
  /** Get performance metrics */
  getPerformanceMetrics: () => FormPerformanceMetrics;
}

/**
 * Main Form Component with React Hook Form Integration
 * 
 * @template TFieldValues - Type definition for form field values
 */
export const Form = forwardRef<FormRef, FormProps>(function Form<
  TFieldValues extends FieldValues = FieldValues
>(
  {
    children,
    className,
    schema,
    mode = 'onSubmit',
    reValidateMode = 'onChange',
    criteriaMode = 'firstError',
    shouldFocusError = true,
    shouldUnregister = false,
    shouldUseNativeValidation = false,
    delayError = 100,
    onSubmit,
    onInvalidSubmit,
    onChange,
    onReset,
    layout,
    spacing,
    variant = 'default',
    size = 'md',
    fullWidth = true,
    disabled = false,
    readonly = false,
    loading = false,
    error,
    submitError,
    sections = [],
    collapsible = false,
    defaultExpanded = true,
    providers,
    'aria-label': ariaLabel,
    'aria-describedby': ariaDescribedBy,
    'aria-labelledby': ariaLabelledBy,
    'aria-busy': ariaBusy,
    'data-testid': dataTestId,
    ...restProps
  }: FormProps<TFieldValues>,
  ref
) {
  // ============================================================================
  // HOOKS AND STATE MANAGEMENT
  // ============================================================================

  const { resolvedTheme } = useTheme();
  const { measureValidation, getMetrics, resetMetrics } = usePerformanceMonitoring();
  const { 
    liveRegionContent, 
    announceError, 
    announceSuccess, 
    announceValidation 
  } = useAccessibilityAnnouncements();

  // Form submission and loading state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submissionError, setSubmissionError] = useState<string | null>(null);
  const [submissionSuccess, setSubmissionSuccess] = useState<string | null>(null);

  // Performance tracking
  const renderStartTime = useRef(performance.now());

  // Form configuration with Zod integration
  const formMethods = useForm<TFieldValues>({
    mode,
    reValidateMode,
    criteriaMode,
    shouldFocusError,
    shouldUnregister,
    shouldUseNativeValidation,
    delayError,
    resolver: schema ? zodResolver(schema) : undefined,
  });

  const {
    handleSubmit,
    reset,
    trigger,
    clearErrors,
    setError,
    getValues,
    setValue,
    formState,
    control,
    register,
    watch,
  } = formMethods;

  // ============================================================================
  // FORM VALIDATION AND SUBMISSION LOGIC
  // ============================================================================

  /**
   * Enhanced form submission handler with error boundary and loading states
   */
  const handleFormSubmit: SubmitHandler<TFieldValues> = useCallback(async (data) => {
    const submissionStartTime = performance.now();
    
    try {
      setIsSubmitting(true);
      setSubmissionError(null);
      setSubmissionSuccess(null);

      // Call the onSubmit handler
      if (onSubmit) {
        await onSubmit(data);
        
        setSubmissionSuccess('Form submitted successfully');
        announceSuccess('Form submitted successfully');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'An error occurred while submitting the form';
      setSubmissionError(errorMessage);
      announceError(errorMessage);
      
      console.error('Form submission error:', error);
    } finally {
      setIsSubmitting(false);
      
      // Track submission performance
      const submissionTime = performance.now() - submissionStartTime;
      if (submissionTime > 2000) {
        console.warn(`Form submission exceeded 2s requirement: ${submissionTime.toFixed(2)}ms`);
      }
    }
  }, [onSubmit, announceError, announceSuccess]);

  /**
   * Enhanced invalid submission handler with accessibility announcements
   */
  const handleInvalidSubmit: SubmitErrorHandler<TFieldValues> = useCallback((errors) => {
    const errorCount = Object.keys(errors).length;
    const errorMessage = `Form has ${errorCount} validation ${errorCount === 1 ? 'error' : 'errors'}`;
    
    announceError(errorMessage);
    
    if (onInvalidSubmit) {
      onInvalidSubmit(errors);
    }

    // Focus on first error field if configured
    if (shouldFocusError) {
      const firstErrorField = Object.keys(errors)[0];
      if (firstErrorField) {
        const element = document.querySelector(`[name="${firstErrorField}"]`) as HTMLElement;
        element?.focus();
      }
    }
  }, [onInvalidSubmit, shouldFocusError, announceError]);

  /**
   * Enhanced field validation with performance monitoring
   */
  const validateField = useCallback(async (fieldName: keyof TFieldValues): Promise<boolean> => {
    return measureValidation(async () => {
      const result = await trigger(fieldName as any);
      announceValidation(String(fieldName), result);
      return result;
    }, String(fieldName));
  }, [trigger, measureValidation, announceValidation]);

  /**
   * Enhanced form validation with comprehensive error tracking
   */
  const validateForm = useCallback(async (): Promise<boolean> => {
    return measureValidation(async () => {
      const result = await trigger();
      
      if (!result) {
        const errorCount = Object.keys(formState.errors).length;
        announceError(`Form validation failed with ${errorCount} errors`);
      }
      
      return result;
    });
  }, [trigger, formState.errors, measureValidation, announceError]);

  // ============================================================================
  // IMPERATIVE FORM METHODS VIA REF
  // ============================================================================

  useImperativeHandle(ref, () => ({
    submit: async () => {
      await handleSubmit(handleFormSubmit)();
    },
    
    reset: (values?: Partial<TFieldValues>) => {
      reset(values as any);
      setSubmissionError(null);
      setSubmissionSuccess(null);
      onReset?.();
    },
    
    validate: validateForm,
    validateField,
    
    clearErrors: () => {
      clearErrors();
      setSubmissionError(null);
    },
    
    setError: (fieldName: keyof TFieldValues, error: { message: string }) => {
      setError(fieldName as any, error);
    },
    
    getValues,
    
    setValues: (values: Partial<TFieldValues>) => {
      Object.entries(values).forEach(([key, value]) => {
        setValue(key as any, value);
      });
    },
    
    focusFirstError: () => {
      const firstErrorField = Object.keys(formState.errors)[0];
      if (firstErrorField) {
        const element = document.querySelector(`[name="${firstErrorField}"]`) as HTMLElement;
        element?.focus();
      }
    },
    
    getValidationState: (): FormValidationState<TFieldValues> => ({
      isValid: formState.isValid,
      isValidating: formState.isValidating,
      errors: formState.errors,
      fieldStates: {}, // Would be populated with detailed field validation results
      lastValidation: new Date(),
      validationCount: getMetrics().validationCount,
      averageValidationTime: getMetrics().validationTime,
      isSubmitting,
      isSubmitted: formState.isSubmitted,
      submitCount: formState.submitCount,
      errorSummary: {
        totalErrors: Object.keys(formState.errors).length,
        fieldErrors: Object.keys(formState.errors).length,
        zodErrors: 0,
        asyncErrors: 0,
        customErrors: 0,
        criticalErrors: [],
        warningErrors: [],
        infoErrors: [],
        errorListId: `form-errors-${Math.random().toString(36).substr(2, 9)}`,
        focusOnFirstError: shouldFocusError,
        announceErrors: true,
      },
    }),
    
    getPerformanceMetrics: getMetrics,
  }), [
    handleSubmit,
    handleFormSubmit,
    reset,
    onReset,
    validateForm,
    validateField,
    clearErrors,
    setError,
    getValues,
    setValue,
    formState,
    shouldFocusError,
    isSubmitting,
    getMetrics,
  ]);

  // ============================================================================
  // FORM CONTEXT VALUE CONSTRUCTION
  // ============================================================================

  const contextValue: FormContextValue<TFieldValues> = useMemo(() => ({
    // Form state
    formState,
    validationState: {
      isValid: formState.isValid,
      isValidating: formState.isValidating,
      errors: formState.errors,
      fieldStates: {},
      lastValidation: new Date(),
      validationCount: getMetrics().validationCount,
      averageValidationTime: getMetrics().validationTime,
      isSubmitting,
      isSubmitted: formState.isSubmitted,
      submitCount: formState.submitCount,
      errorSummary: {
        totalErrors: Object.keys(formState.errors).length,
        fieldErrors: Object.keys(formState.errors).length,
        zodErrors: 0,
        asyncErrors: 0,
        customErrors: 0,
        criticalErrors: [],
        warningErrors: [],
        infoErrors: [],
        errorListId: `form-errors-${Math.random().toString(36).substr(2, 9)}`,
        focusOnFirstError: shouldFocusError,
        announceErrors: true,
      },
    },
    loadingState: {
      isLoading: loading || isSubmitting,
      loadingMessage: isSubmitting ? 'Submitting form...' : undefined,
    } as LoadingState,

    // Form methods
    register,
    control,
    handleSubmit,
    watch,
    setValue,
    getValues,
    trigger,
    reset,

    // Enhanced methods
    validateField: async (fieldName) => {
      const isValid = await validateField(fieldName);
      return {
        isValid,
        validatedAt: new Date(),
        validationType: 'sync',
        validationDuration: getMetrics().validationTime,
        isDirty: formState.dirtyFields[fieldName] || false,
        isTouched: formState.touchedFields[fieldName] || false,
        isValidating: false,
      } as FormFieldValidationResult;
    },
    
    validateForm: async () => {
      const isValid = await validateForm();
      return {
        isValid,
        isValidating: false,
        errors: formState.errors,
        fieldStates: {},
        lastValidation: new Date(),
        validationCount: getMetrics().validationCount,
        averageValidationTime: getMetrics().validationTime,
        isSubmitting,
        isSubmitted: formState.isSubmitted,
        submitCount: formState.submitCount,
        errorSummary: {
          totalErrors: Object.keys(formState.errors).length,
          fieldErrors: Object.keys(formState.errors).length,
          zodErrors: 0,
          asyncErrors: 0,
          customErrors: 0,
          criticalErrors: [],
          warningErrors: [],
          infoErrors: [],
          errorListId: `form-errors-${Math.random().toString(36).substr(2, 9)}`,
          focusOnFirstError: shouldFocusError,
          announceErrors: true,
        },
      };
    },
    
    clearErrors: () => {
      clearErrors();
      setSubmissionError(null);
    },
    
    setFieldError: (fieldName, error) => {
      setError(fieldName as any, error);
    },

    // Section management (would be implemented for complex forms)
    sections,
    expandSection: () => {},
    collapseSection: () => {},
    toggleSection: () => {},

    // Progressive disclosure (would be implemented for wizard forms)
    currentStep: 0,
    totalSteps: 1,
    nextStep: () => {},
    previousStep: () => {},
    goToStep: () => {},

    // Utility methods
    isDirty: (fieldName) => fieldName ? formState.dirtyFields[fieldName] || false : formState.isDirty,
    isTouched: (fieldName) => fieldName ? formState.touchedFields[fieldName] || false : Object.keys(formState.touchedFields).length > 0,
    isValid: (fieldName) => fieldName ? !formState.errors[fieldName] : formState.isValid,
    hasErrors: (fieldName) => fieldName ? !!formState.errors[fieldName] : Object.keys(formState.errors).length > 0,

    // Event handlers
    onFieldChange: (fieldName, value) => {
      setValue(fieldName as any, value);
      onChange?.(getValues());
    },
    onFieldBlur: () => {},
    onFieldFocus: () => {},

    // Accessibility
    announceError,
    focusField: (fieldName) => {
      const element = document.querySelector(`[name="${String(fieldName)}"]`) as HTMLElement;
      element?.focus();
    },
    getFieldDescribedBy: (fieldName) => `${String(fieldName)}-error ${String(fieldName)}-hint`,
  }), [
    formState,
    loading,
    isSubmitting,
    register,
    control,
    handleSubmit,
    watch,
    setValue,
    getValues,
    trigger,
    reset,
    validateField,
    validateForm,
    clearErrors,
    setError,
    sections,
    shouldFocusError,
    getMetrics,
    onChange,
    announceError,
  ]);

  // ============================================================================
  // STYLING AND VARIANT COMPUTATION
  // ============================================================================

  const formClasses = useMemo(() => 
    formVariants({
      variant,
      size,
      fullWidth,
      loading: loading || isSubmitting,
      disabled: disabled || readonly,
      className,
    }),
    [variant, size, fullWidth, loading, isSubmitting, disabled, readonly, className]
  );

  // ============================================================================
  // ERROR DISPLAY COMPONENT
  // ============================================================================

  const ErrorSummary = useCallback(() => {
    const hasErrors = Object.keys(formState.errors).length > 0 || submitError || error;
    
    if (!hasErrors) return null;

    const errorMessages = [
      ...(error ? [error] : []),
      ...(submitError ? [submitError] : []),
      ...Object.values(formState.errors).map(err => err?.message).filter(Boolean),
    ];

    return (
      <div
        className={errorSummaryVariants({ variant: 'default' })}
        role="alert"
        aria-live="polite"
        aria-atomic="true"
        tabIndex={-1}
        id="form-error-summary"
      >
        <h3 className="text-sm font-medium mb-2">
          {errorMessages.length === 1 ? 'There is 1 error:' : `There are ${errorMessages.length} errors:`}
        </h3>
        <ul className="list-disc list-inside space-y-1">
          {errorMessages.map((message, index) => (
            <li key={index} className="text-sm">
              {message}
            </li>
          ))}
        </ul>
      </div>
    );
  }, [formState.errors, submitError, error]);

  // ============================================================================
  // PERFORMANCE MONITORING EFFECT
  // ============================================================================

  useEffect(() => {
    const renderTime = performance.now() - renderStartTime.current;
    if (renderTime > 16) { // 60fps threshold
      console.warn(`Form render exceeded 16ms: ${renderTime.toFixed(2)}ms`);
    }
  });

  // ============================================================================
  // FORM ELEMENT RENDERING
  // ============================================================================

  return (
    <FormErrorBoundary
      onError={(error, errorInfo) => {
        console.error('Form Error Boundary:', error, errorInfo);
      }}
    >
      <FormProvider {...formMethods}>
        <FormContext.Provider value={contextValue}>
          <form
            className={formClasses}
            onSubmit={handleSubmit(handleFormSubmit, handleInvalidSubmit)}
            noValidate
            aria-label={ariaLabel}
            aria-describedby={ariaDescribedBy}
            aria-labelledby={ariaLabelledBy}
            aria-busy={ariaBusy || loading || isSubmitting}
            data-testid={dataTestId || 'form'}
            {...restProps}
          >
            {/* Error Summary for Accessibility */}
            <ErrorSummary />

            {/* Success Message */}
            {submissionSuccess && (
              <div
                className="mb-4 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-md"
                role="status"
                aria-live="polite"
              >
                <p className="text-sm text-green-800 dark:text-green-200">
                  {submissionSuccess}
                </p>
              </div>
            )}

            {/* Form Content */}
            {children}

            {/* Screen Reader Live Region for Announcements */}
            <div
              className="sr-only"
              aria-live="assertive"
              aria-atomic="true"
              role="status"
            >
              {liveRegionContent}
            </div>
          </form>
        </FormContext.Provider>
      </FormProvider>
    </FormErrorBoundary>
  );
}) as <TFieldValues extends FieldValues = FieldValues>(
  props: FormProps<TFieldValues> & { ref?: React.Ref<FormRef<TFieldValues>> }
) => React.ReactElement;

// ============================================================================
// ADDITIONAL UTILITY COMPONENTS
// ============================================================================

/**
 * Form Loading Overlay Component
 * Provides visual feedback during form submission
 */
export const FormLoadingOverlay: React.FC<{
  loading: boolean;
  message?: string;
}> = ({ loading, message = 'Processing...' }) => {
  if (!loading) return null;

  return (
    <div
      className="absolute inset-0 bg-white/80 dark:bg-gray-900/80 flex items-center justify-center z-50 rounded-md"
      role="status"
      aria-live="polite"
      aria-label={message}
    >
      <div className="flex items-center space-x-3">
        <div className="animate-spin rounded-full h-5 w-5 border-2 border-primary-500 border-t-transparent" />
        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
          {message}
        </span>
      </div>
    </div>
  );
};

// ============================================================================
// TYPE EXPORTS AND UTILITY EXPORTS
// ============================================================================

export type { FormRef, FormProps };
export { useFormContext, FormErrorBoundary };

// Default export for convenience
export default Form;