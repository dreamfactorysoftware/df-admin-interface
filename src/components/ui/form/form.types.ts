/**
 * Form Component Type Definitions
 * 
 * Comprehensive TypeScript interfaces for React Hook Form integration with
 * Zod schema validation, accessibility compliance, and theme support.
 * 
 * Supports React 19/Next.js 15.1+ with real-time validation under 100ms
 * performance requirements and WCAG 2.1 AA accessibility standards.
 * 
 * @fileoverview Form type definitions for DreamFactory Admin Interface
 * @version 1.0.0
 */

import { type ReactNode, type HTMLAttributes, type ComponentPropsWithoutRef, type FormEvent } from 'react';
import { 
  type UseFormReturn, 
  type FieldError, 
  type FieldValues, 
  type Path, 
  type PathValue,
  type UseFormProps,
  type SubmitHandler,
  type FieldPath,
  type Control,
  type RegisterOptions,
  type DeepRequired,
  type FieldErrorsImpl
} from 'react-hook-form';
import { type ZodSchema, type ZodType, type infer as ZodInfer } from 'zod';
import { type VariantProps } from 'class-variance-authority';

// Import base UI types for consistency
import { 
  type AccessibilityProps,
  type ThemeProps,
  type SizeVariant,
  type ColorVariant,
  type StateVariant,
  type BaseComponentProps,
  type ControlledProps,
  type FocusProps,
  type ResponsiveProps,
  type AnimationProps,
  type ValidationState,
  type LoadingState
} from '../../../types/ui';

/**
 * Core form validation schema types with Zod integration
 * Provides compile-time type safety and runtime validation
 */
export type FormSchema<T extends FieldValues = FieldValues> = ZodSchema<T>;

/**
 * Infer TypeScript types from Zod schema
 * Enables type-safe form data throughout the application
 */
export type InferFormSchema<T extends FormSchema> = ZodInfer<T>;

/**
 * Form validation modes for React Hook Form
 * Controls when validation occurs for optimal UX
 */
export type ValidationMode = 'onBlur' | 'onChange' | 'onSubmit' | 'onTouched' | 'all';

/**
 * Form revalidation modes for ongoing validation
 * Balances user experience with performance requirements
 */
export type RevalidateMode = 'onBlur' | 'onChange' | 'onSubmit';

/**
 * Form field types with comprehensive input support
 * Covers all DreamFactory database configuration scenarios
 */
export type FormFieldType = 
  | 'text'
  | 'email'
  | 'password'
  | 'number'
  | 'tel'
  | 'url'
  | 'search'
  | 'textarea'
  | 'select'
  | 'multiselect'
  | 'checkbox'
  | 'radio'
  | 'switch'
  | 'date'
  | 'datetime-local'
  | 'time'
  | 'file'
  | 'range'
  | 'color'
  | 'hidden';

/**
 * Form field variants for styling consistency
 * Integrates with class-variance-authority for dynamic styling
 */
export type FormFieldVariant = 
  | 'default'
  | 'filled'
  | 'outlined'
  | 'underlined'
  | 'ghost';

/**
 * Form layout configurations for responsive design
 * Supports complex database configuration forms
 */
export type FormLayout = 
  | 'vertical'
  | 'horizontal'
  | 'inline'
  | 'grid';

/**
 * Form spacing variants for consistent visual hierarchy
 */
export type FormSpacing = 
  | 'compact'
  | 'normal'
  | 'relaxed'
  | 'loose';

/**
 * Enhanced form configuration extending React Hook Form options
 * Includes Zod schema integration and DreamFactory-specific requirements
 */
export interface FormConfig<TFieldValues extends FieldValues = FieldValues> 
  extends Omit<UseFormProps<TFieldValues>, 'resolver'> {
  
  /** Zod validation schema for type-safe validation */
  schema?: FormSchema<TFieldValues>;
  
  /** Form validation mode - defaults to 'onBlur' for optimal UX */
  mode?: ValidationMode;
  
  /** Form revalidation mode - defaults to 'onChange' for real-time feedback */
  revalidateMode?: RevalidateMode;
  
  /** Enable/disable HTML5 validation */
  shouldUseNativeValidation?: boolean;
  
  /** Focus first error field on validation failure */
  shouldFocusError?: boolean;
  
  /** Custom error messages for field validation */
  errorMessages?: Record<string, string>;
  
  /** Form submission timeout in milliseconds */
  submitTimeout?: number;
  
  /** Reset form after successful submission */
  resetOnSubmit?: boolean;
  
  /** Persist form data in local storage */
  persistData?: boolean;
  
  /** Local storage key for form persistence */
  persistKey?: string;
}

/**
 * Form context value for provider pattern
 * Enables form state sharing across nested components
 */
export interface FormContextValue<TFieldValues extends FieldValues = FieldValues> {
  /** React Hook Form methods and state */
  form: UseFormReturn<TFieldValues>;
  
  /** Form configuration options */
  config: FormConfig<TFieldValues>;
  
  /** Form submission state */
  isSubmitting: boolean;
  
  /** Form validation state */
  isValid: boolean;
  
  /** Form dirty state (has user input) */
  isDirty: boolean;
  
  /** Form touched state (user has interacted) */
  isTouched: boolean;
  
  /** Global form error message */
  globalError?: string;
  
  /** Set global form error */
  setGlobalError: (error?: string) => void;
  
  /** Clear all form errors */
  clearErrors: () => void;
  
  /** Reset form to initial state */
  resetForm: () => void;
}

/**
 * Base form props extending HTML form attributes
 * Provides foundation for all form components
 */
export interface BaseFormProps<TFieldValues extends FieldValues = FieldValues> 
  extends Omit<HTMLAttributes<HTMLFormElement>, 'onSubmit' | 'children'> {
  
  /** Form content */
  children: ReactNode;
  
  /** Form submission handler with type-safe data */
  onSubmit: SubmitHandler<TFieldValues>;
  
  /** Form configuration */
  config?: FormConfig<TFieldValues>;
  
  /** Form layout variant */
  layout?: FormLayout;
  
  /** Form spacing variant */
  spacing?: FormSpacing;
  
  /** Show form loading state */
  loading?: boolean;
  
  /** Disable entire form */
  disabled?: boolean;
  
  /** Form validation schema */
  schema?: FormSchema<TFieldValues>;
  
  /** Custom CSS classes */
  className?: string;
  
  /** Test identifier */
  'data-testid'?: string;
}

/**
 * Form field configuration for dynamic form generation
 * Supports all DreamFactory database connection scenarios
 */
export interface FormFieldConfig<TFieldValues extends FieldValues = FieldValues> {
  /** Field unique identifier */
  id: string;
  
  /** Field name for form registration */
  name: Path<TFieldValues>;
  
  /** Field type determines input component */
  type: FormFieldType;
  
  /** Field display label */
  label: string;
  
  /** Field placeholder text */
  placeholder?: string;
  
  /** Field description or help text */
  description?: string;
  
  /** Field is required */
  required?: boolean;
  
  /** Field is disabled */
  disabled?: boolean;
  
  /** Field is read-only */
  readOnly?: boolean;
  
  /** Field default value */
  defaultValue?: PathValue<TFieldValues, Path<TFieldValues>>;
  
  /** Field validation rules */
  validation?: RegisterOptions<TFieldValues, Path<TFieldValues>>;
  
  /** Select/multiselect options */
  options?: Array<{
    value: string | number;
    label: string;
    disabled?: boolean;
    description?: string;
  }>;
  
  /** Field styling variant */
  variant?: FormFieldVariant;
  
  /** Field size */
  size?: SizeVariant;
  
  /** Conditional field visibility */
  condition?: (values: TFieldValues) => boolean;
  
  /** Field grid column span */
  colSpan?: number;
  
  /** Custom field component */
  component?: React.ComponentType<FormFieldProps<TFieldValues>>;
  
  /** Additional field props */
  props?: Record<string, any>;
}

/**
 * Form field props for individual field components
 * Comprehensive interface supporting all field variations
 */
export interface FormFieldProps<TFieldValues extends FieldValues = FieldValues> 
  extends BaseComponentProps<HTMLInputElement>,
    AccessibilityProps,
    ThemeProps,
    FocusProps,
    ResponsiveProps,
    AnimationProps {
  
  /** Field configuration */
  field: FormFieldConfig<TFieldValues>;
  
  /** Form control instance */
  control: Control<TFieldValues>;
  
  /** Field error state */
  error?: FieldError;
  
  /** Field is dirty (modified) */
  isDirty?: boolean;
  
  /** Field is touched (focused) */
  isTouched?: boolean;
  
  /** Field is validating */
  isValidating?: boolean;
  
  /** Field value */
  value?: any;
  
  /** Field change handler */
  onChange?: (value: any) => void;
  
  /** Field blur handler */
  onBlur?: () => void;
  
  /** Field focus handler */
  onFocus?: () => void;
  
  /** Custom field renderer */
  render?: (props: any) => ReactNode;
}

/**
 * Form section configuration for grouped fields
 * Enables organized complex forms like database connections
 */
export interface FormSectionConfig {
  /** Section unique identifier */
  id: string;
  
  /** Section title */
  title: string;
  
  /** Section description */
  description?: string;
  
  /** Section is collapsible */
  collapsible?: boolean;
  
  /** Section is collapsed by default */
  defaultCollapsed?: boolean;
  
  /** Section fields */
  fields: FormFieldConfig[];
  
  /** Section styling variant */
  variant?: 'default' | 'card' | 'bordered' | 'ghost';
  
  /** Section conditional visibility */
  condition?: (values: any) => boolean;
}

/**
 * Form validation result for comprehensive error handling
 * Supports real-time validation requirements under 100ms
 */
export interface FormValidationResult {
  /** Validation passed */
  isValid: boolean;
  
  /** Field-level errors */
  errors: FieldErrorsImpl<FieldValues>;
  
  /** Global form errors */
  globalErrors?: string[];
  
  /** Validation warnings */
  warnings?: Record<string, string>;
  
  /** Validation timestamp */
  timestamp: number;
  
  /** Validation duration in milliseconds */
  duration: number;
}

/**
 * Form submission result for handling async operations
 * Supports DreamFactory API integration patterns
 */
export interface FormSubmissionResult<TResult = any> {
  /** Submission was successful */
  success: boolean;
  
  /** Submission result data */
  data?: TResult;
  
  /** Submission error */
  error?: string;
  
  /** Field-specific errors */
  fieldErrors?: Record<string, string>;
  
  /** Submission timestamp */
  timestamp: number;
  
  /** Submission duration in milliseconds */
  duration: number;
  
  /** Server response metadata */
  metadata?: Record<string, any>;
}

/**
 * Form state management for complex workflows
 * Integrates with Zustand for application state
 */
export interface FormState<TFieldValues extends FieldValues = FieldValues> {
  /** Current form values */
  values: TFieldValues;
  
  /** Form validation state */
  validation: ValidationState;
  
  /** Form loading state */
  loading: LoadingState;
  
  /** Form errors */
  errors: FieldErrorsImpl<TFieldValues>;
  
  /** Form warnings */
  warnings: Record<string, string>;
  
  /** Form is pristine (no user input) */
  isPristine: boolean;
  
  /** Form is submitting */
  isSubmitting: boolean;
  
  /** Form submission count */
  submitCount: number;
  
  /** Last submission result */
  lastSubmission?: FormSubmissionResult;
}

/**
 * Form actions for state management
 * Provides type-safe form operations
 */
export interface FormActions<TFieldValues extends FieldValues = FieldValues> {
  /** Update form values */
  updateValues: (values: Partial<TFieldValues>) => void;
  
  /** Set field value */
  setValue: <TField extends Path<TFieldValues>>(
    name: TField, 
    value: PathValue<TFieldValues, TField>
  ) => void;
  
  /** Set field error */
  setError: (name: Path<TFieldValues>, error: FieldError) => void;
  
  /** Clear field error */
  clearError: (name: Path<TFieldValues>) => void;
  
  /** Trigger field validation */
  validateField: (name: Path<TFieldValues>) => Promise<boolean>;
  
  /** Trigger form validation */
  validateForm: () => Promise<FormValidationResult>;
  
  /** Submit form */
  submitForm: () => Promise<FormSubmissionResult>;
  
  /** Reset form */
  resetForm: () => void;
  
  /** Set form loading state */
  setLoading: (loading: boolean, message?: string) => void;
}

/**
 * Form hook return type for custom form hooks
 * Provides complete form management interface
 */
export interface UseFormResult<TFieldValues extends FieldValues = FieldValues> {
  /** React Hook Form instance */
  form: UseFormReturn<TFieldValues>;
  
  /** Form state */
  state: FormState<TFieldValues>;
  
  /** Form actions */
  actions: FormActions<TFieldValues>;
  
  /** Form validation result */
  validation: FormValidationResult;
  
  /** Form configuration */
  config: FormConfig<TFieldValues>;
}

/**
 * Dynamic form configuration for runtime form generation
 * Supports database connection wizard and API generation workflows
 */
export interface DynamicFormConfig<TFieldValues extends FieldValues = FieldValues> {
  /** Form unique identifier */
  id: string;
  
  /** Form title */
  title: string;
  
  /** Form description */
  description?: string;
  
  /** Form sections */
  sections: FormSectionConfig[];
  
  /** Form validation schema */
  schema: FormSchema<TFieldValues>;
  
  /** Form layout */
  layout?: FormLayout;
  
  /** Form styling variant */
  variant?: 'default' | 'wizard' | 'dialog' | 'inline';
  
  /** Form navigation (for wizards) */
  navigation?: {
    showSteps: boolean;
    allowSkip: boolean;
    confirmOnExit: boolean;
  };
  
  /** Form actions configuration */
  actions?: {
    submitText?: string;
    cancelText?: string;
    resetText?: string;
    showReset?: boolean;
    showCancel?: boolean;
  };
}

/**
 * Form field registry for dynamic component resolution
 * Enables custom field type implementations
 */
export interface FormFieldRegistry {
  /** Register custom field type */
  register: (type: string, component: React.ComponentType<FormFieldProps>) => void;
  
  /** Get field component by type */
  get: (type: FormFieldType) => React.ComponentType<FormFieldProps> | undefined;
  
  /** Check if field type is registered */
  has: (type: FormFieldType) => boolean;
  
  /** Unregister field type */
  unregister: (type: FormFieldType) => void;
  
  /** Get all registered field types */
  getTypes: () => FormFieldType[];
}

/**
 * Form validation context for custom validators
 * Supports complex business logic validation
 */
export interface FormValidationContext<TFieldValues extends FieldValues = FieldValues> {
  /** Current form values */
  values: TFieldValues;
  
  /** Form configuration */
  config: FormConfig<TFieldValues>;
  
  /** Validation mode */
  mode: ValidationMode;
  
  /** Field being validated */
  field?: Path<TFieldValues>;
  
  /** Validation trigger */
  trigger: 'change' | 'blur' | 'submit' | 'manual';
  
  /** Abort validation signal */
  signal?: AbortSignal;
}

/**
 * Custom validator function type
 * Enables async validation with performance requirements
 */
export type FormValidator<TFieldValues extends FieldValues = FieldValues> = (
  context: FormValidationContext<TFieldValues>
) => Promise<FormValidationResult> | FormValidationResult;

/**
 * Form theme configuration for consistent styling
 * Integrates with Tailwind CSS and design system
 */
export interface FormThemeConfig {
  /** Form container styles */
  container: {
    base: string;
    variants: Record<string, string>;
  };
  
  /** Field wrapper styles */
  field: {
    base: string;
    variants: Record<FormFieldVariant, string>;
    sizes: Record<SizeVariant, string>;
    states: Record<StateVariant, string>;
  };
  
  /** Label styles */
  label: {
    base: string;
    variants: Record<string, string>;
    required: string;
  };
  
  /** Input styles */
  input: {
    base: string;
    variants: Record<FormFieldVariant, string>;
    sizes: Record<SizeVariant, string>;
    states: Record<StateVariant, string>;
  };
  
  /** Error message styles */
  error: {
    base: string;
    variants: Record<string, string>;
  };
  
  /** Helper text styles */
  helper: {
    base: string;
    variants: Record<string, string>;
  };
  
  /** Section styles */
  section: {
    base: string;
    variants: Record<string, string>;
  };
}

/**
 * Form accessibility configuration
 * Ensures WCAG 2.1 AA compliance throughout the form system
 */
export interface FormAccessibilityConfig {
  /** Announce form validation results */
  announceValidation: boolean;
  
  /** Auto-focus first error field */
  focusErrorField: boolean;
  
  /** Error announcement delay (ms) */
  errorAnnouncementDelay: number;
  
  /** Success announcement message */
  successAnnouncement?: string;
  
  /** Error announcement message template */
  errorAnnouncementTemplate?: string;
  
  /** Keyboard navigation configuration */
  keyboard: {
    submitOnEnter: boolean;
    resetOnEscape: boolean;
    navigateWithArrows: boolean;
  };
  
  /** Screen reader optimizations */
  screenReader: {
    describedByIds: boolean;
    labelledByIds: boolean;
    liveRegions: boolean;
  };
}

/**
 * Form performance monitoring configuration
 * Tracks validation and submission performance metrics
 */
export interface FormPerformanceConfig {
  /** Enable performance monitoring */
  enabled: boolean;
  
  /** Validation performance threshold (ms) */
  validationThreshold: number;
  
  /** Submission performance threshold (ms) */
  submissionThreshold: number;
  
  /** Performance metrics callback */
  onMetrics?: (metrics: FormPerformanceMetrics) => void;
}

/**
 * Form performance metrics
 * Monitors compliance with 100ms validation requirement
 */
export interface FormPerformanceMetrics {
  /** Validation metrics */
  validation: {
    duration: number;
    fieldCount: number;
    errorCount: number;
    timestamp: number;
  };
  
  /** Submission metrics */
  submission: {
    duration: number;
    success: boolean;
    retryCount: number;
    timestamp: number;
  };
  
  /** Render metrics */
  render: {
    componentCount: number;
    rerenderCount: number;
    initialRenderTime: number;
  };
}

/**
 * Export all form-related types for comprehensive type coverage
 */
export type {
  // Core React Hook Form types re-exported for convenience
  UseFormReturn,
  FieldError,
  FieldValues,
  Path,
  PathValue,
  SubmitHandler,
  Control,
  RegisterOptions,
  
  // Zod types re-exported for validation
  ZodSchema,
  ZodType,
  ZodInfer,
  
  // Class variance authority for styling
  VariantProps,
};

/**
 * Form constants for consistent behavior
 */
export const FORM_CONSTANTS = {
  /** Default validation timeout (ms) */
  DEFAULT_VALIDATION_TIMEOUT: 100,
  
  /** Default submission timeout (ms) */
  DEFAULT_SUBMISSION_TIMEOUT: 30000,
  
  /** Default debounce delay for onChange validation (ms) */
  DEFAULT_DEBOUNCE_DELAY: 300,
  
  /** Maximum form field count for performance */
  MAX_FIELD_COUNT: 100,
  
  /** Default form spacing */
  DEFAULT_SPACING: 'normal' as FormSpacing,
  
  /** Default form layout */
  DEFAULT_LAYOUT: 'vertical' as FormLayout,
  
  /** Default validation mode */
  DEFAULT_VALIDATION_MODE: 'onBlur' as ValidationMode,
  
  /** Default revalidation mode */
  DEFAULT_REVALIDATE_MODE: 'onChange' as RevalidateMode,
} as const;