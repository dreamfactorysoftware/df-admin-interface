/**
 * React Hook Form Configuration Types with Zod Schema Validation
 * 
 * Comprehensive form management types supporting React Hook Form 7.57.0 with Zod schema
 * validation, dynamic field generation, conditional logic, and form state management.
 * Provides real-time validation under 100ms with accessibility compliance.
 * 
 * @fileoverview Form types for React Hook Form + Zod integration with performance optimization
 * @version 1.0.0
 */

import { type ReactNode, type ComponentType, type ComponentProps } from 'react';
import { 
  type UseFormRegister, 
  type UseFormSetValue, 
  type UseFormGetValues, 
  type UseFormWatch, 
  type UseFormTrigger,
  type UseFormReset,
  type UseFormClearErrors,
  type UseFormSetError,
  type UseFormHandleSubmit,
  type UseFormReturn,
  type FieldError,
  type FieldErrors,
  type FieldValues,
  type Path,
  type PathValue,
  type RegisterOptions,
  type SubmitHandler,
  type SubmitErrorHandler,
  type Control,
  type Controller,
  type ValidationRule,
  type Validate
} from 'react-hook-form';
import { type ZodSchema, type ZodType, type ZodError, type infer as ZodInfer } from 'zod';
import { 
  type FormComponentProps, 
  type AccessibilityProps, 
  type ThemeProps, 
  type ValidationState,
  type SizeVariant,
  type ColorVariant,
  type LabelPosition
} from './ui';

/**
 * Enhanced form field validation error interface
 * Extends React Hook Form FieldError with additional context
 */
export interface FormFieldError extends FieldError {
  /** Field name that caused the error */
  field?: string;
  /** Error severity level */
  severity?: 'error' | 'warning' | 'info';
  /** Error code for internationalization */
  code?: string;
  /** Additional error context */
  context?: Record<string, any>;
  /** Timestamp when error occurred */
  timestamp?: Date;
}

/**
 * Enhanced validation state with performance tracking
 * Ensures real-time validation under 100ms requirement
 */
export interface EnhancedValidationState extends ValidationState {
  /** Validation performance metrics */
  validationTime?: number;
  /** Is field being validated */
  isValidating?: boolean;
  /** Has field been validated */
  hasBeenValidated?: boolean;
  /** Last validation timestamp */
  lastValidated?: Date;
  /** Debounced validation timeout ID */
  validationTimeoutId?: NodeJS.Timeout;
}

/**
 * Form field configuration interface for dynamic form generation
 * Supports database-driven form configurations
 */
export interface FormFieldConfig<TFieldValues extends FieldValues = FieldValues> {
  /** Unique field identifier */
  name: Path<TFieldValues>;
  /** Field type for rendering */
  type: FormFieldType;
  /** Field label */
  label: string;
  /** Field description/help text */
  description?: string;
  /** Placeholder text */
  placeholder?: string;
  /** Default value */
  defaultValue?: PathValue<TFieldValues, Path<TFieldValues>>;
  /** Field options for select/radio/checkbox fields */
  options?: Array<FormFieldOption>;
  /** Field validation rules */
  validation?: FormFieldValidation<TFieldValues>;
  /** Field visibility conditions */
  conditions?: FormFieldCondition<TFieldValues>[];
  /** Field UI properties */
  ui?: FormFieldUIConfig;
  /** Field accessibility properties */
  accessibility?: AccessibilityProps;
  /** Field data source for dynamic options */
  dataSource?: FormFieldDataSource;
  /** Field grouping information */
  group?: string;
  /** Field ordering priority */
  order?: number;
  /** Is field disabled */
  disabled?: boolean | ((values: TFieldValues) => boolean);
  /** Is field required */
  required?: boolean | ((values: TFieldValues) => boolean);
  /** Is field read-only */
  readOnly?: boolean | ((values: TFieldValues) => boolean);
}

/**
 * Supported form field types for dynamic generation
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
  | 'radio'
  | 'checkbox'
  | 'toggle'
  | 'date'
  | 'datetime'
  | 'time'
  | 'file'
  | 'hidden'
  | 'custom';

/**
 * Form field option interface for select/radio/checkbox fields
 */
export interface FormFieldOption {
  /** Option value */
  value: string | number | boolean;
  /** Option label */
  label: string;
  /** Option description */
  description?: string;
  /** Is option disabled */
  disabled?: boolean;
  /** Option icon */
  icon?: ReactNode;
  /** Option grouping */
  group?: string;
}

/**
 * Form field validation configuration with Zod integration
 */
export interface FormFieldValidation<TFieldValues extends FieldValues = FieldValues> {
  /** Zod schema for field validation */
  schema?: ZodType<any>;
  /** Custom validation function */
  validate?: Validate<PathValue<TFieldValues, Path<TFieldValues>>, TFieldValues>;
  /** Validation timing */
  timing?: 'onChange' | 'onBlur' | 'onSubmit' | 'debounced';
  /** Debounce delay in milliseconds (default: 300) */
  debounceMs?: number;
  /** Async validation function */
  asyncValidate?: (value: any, formValues: TFieldValues) => Promise<string | boolean>;
  /** Dependencies for validation */
  dependencies?: Path<TFieldValues>[];
}

/**
 * Form field conditional display/behavior configuration
 */
export interface FormFieldCondition<TFieldValues extends FieldValues = FieldValues> {
  /** Field to watch for condition */
  field: Path<TFieldValues>;
  /** Condition operator */
  operator: 'equals' | 'notEquals' | 'in' | 'notIn' | 'greaterThan' | 'lessThan' | 'contains';
  /** Expected value(s) */
  value: any | any[];
  /** Action to take when condition is met */
  action: 'show' | 'hide' | 'enable' | 'disable' | 'require' | 'optional';
}

/**
 * Form field UI configuration
 */
export interface FormFieldUIConfig extends ThemeProps {
  /** Field width */
  width?: 'full' | 'half' | 'third' | 'quarter' | number;
  /** Label position */
  labelPosition?: LabelPosition;
  /** Hide label (screen reader only) */
  hideLabel?: boolean;
  /** Custom CSS classes */
  className?: string;
  /** Custom container CSS classes */
  containerClassName?: string;
  /** Custom label CSS classes */
  labelClassName?: string;
  /** Prefix content */
  prefix?: ReactNode;
  /** Suffix content */
  suffix?: ReactNode;
  /** Field icon */
  icon?: ReactNode;
  /** Custom component to render field */
  component?: ComponentType<any>;
  /** Additional props for custom component */
  componentProps?: Record<string, any>;
}

/**
 * Form field data source for dynamic options
 */
export interface FormFieldDataSource {
  /** Data source type */
  type: 'static' | 'api' | 'function';
  /** API endpoint for fetching options */
  endpoint?: string;
  /** Function to fetch options */
  fetchFunction?: () => Promise<FormFieldOption[]>;
  /** Static options array */
  options?: FormFieldOption[];
  /** Data transformation function */
  transform?: (data: any) => FormFieldOption[];
  /** Cache duration in milliseconds */
  cacheDuration?: number;
  /** Dependency fields that trigger refetch */
  dependencies?: string[];
}

/**
 * Form schema configuration with Zod integration
 */
export interface FormSchema<TFieldValues extends FieldValues = FieldValues> {
  /** Zod schema for entire form */
  schema: ZodSchema<TFieldValues>;
  /** Field configurations */
  fields: FormFieldConfig<TFieldValues>[];
  /** Form metadata */
  metadata?: FormMetadata;
  /** Form layout configuration */
  layout?: FormLayoutConfig;
  /** Form submission configuration */
  submission?: FormSubmissionConfig<TFieldValues>;
  /** Form security configuration */
  security?: FormSecurityConfig;
}

/**
 * Form metadata interface
 */
export interface FormMetadata {
  /** Form title */
  title?: string;
  /** Form description */
  description?: string;
  /** Form version */
  version?: string;
  /** Form category */
  category?: string;
  /** Form tags */
  tags?: string[];
  /** Form creation date */
  createdAt?: Date;
  /** Form last modified date */
  updatedAt?: Date;
  /** Form author */
  author?: string;
}

/**
 * Form layout configuration
 */
export interface FormLayoutConfig {
  /** Layout type */
  type?: 'vertical' | 'horizontal' | 'grid' | 'wizard';
  /** Grid columns for grid layout */
  columns?: number;
  /** Responsive breakpoints */
  responsive?: {
    mobile?: number;
    tablet?: number;
    desktop?: number;
  };
  /** Section grouping */
  sections?: FormSection[];
  /** Field spacing */
  spacing?: 'compact' | 'normal' | 'relaxed';
}

/**
 * Form section for grouping fields
 */
export interface FormSection {
  /** Section identifier */
  id: string;
  /** Section title */
  title?: string;
  /** Section description */
  description?: string;
  /** Fields in this section */
  fields: string[];
  /** Section order */
  order?: number;
  /** Is section collapsible */
  collapsible?: boolean;
  /** Is section initially collapsed */
  defaultCollapsed?: boolean;
  /** Section visibility conditions */
  conditions?: FormFieldCondition[];
}

/**
 * Form submission configuration
 */
export interface FormSubmissionConfig<TFieldValues extends FieldValues = FieldValues> {
  /** Submit URL */
  url?: string;
  /** HTTP method */
  method?: 'POST' | 'PUT' | 'PATCH';
  /** Transform data before submission */
  transform?: (data: TFieldValues) => any;
  /** Success callback */
  onSuccess?: (data: TFieldValues, response: any) => void;
  /** Error callback */
  onError?: (errors: FieldErrors<TFieldValues>, data: TFieldValues) => void;
  /** Loading state callback */
  onLoading?: (isLoading: boolean) => void;
  /** Enable optimistic updates */
  optimistic?: boolean;
  /** Retry configuration */
  retry?: {
    attempts: number;
    delay: number;
    backoff?: 'linear' | 'exponential';
  };
}

/**
 * Form security configuration
 */
export interface FormSecurityConfig {
  /** Enable CSRF protection */
  csrfProtection?: boolean;
  /** Sanitize inputs */
  sanitizeInputs?: boolean;
  /** Rate limiting */
  rateLimit?: {
    maxAttempts: number;
    windowMs: number;
  };
  /** Content Security Policy */
  csp?: string[];
  /** Field encryption */
  encryption?: {
    fields: string[];
    algorithm: string;
  };
}

/**
 * Enhanced React Hook Form instance with Zod integration
 */
export interface EnhancedFormInstance<TFieldValues extends FieldValues = FieldValues> 
  extends UseFormReturn<TFieldValues> {
  /** Zod schema for validation */
  schema: ZodSchema<TFieldValues>;
  /** Field configurations */
  fieldConfigs: Map<Path<TFieldValues>, FormFieldConfig<TFieldValues>>;
  /** Dynamic field generation */
  generateField: (config: FormFieldConfig<TFieldValues>) => ReactNode;
  /** Conditional field visibility */
  isFieldVisible: (fieldName: Path<TFieldValues>) => boolean;
  /** Field validation state */
  getFieldValidationState: (fieldName: Path<TFieldValues>) => EnhancedValidationState;
  /** Async validation trigger */
  validateAsync: (fieldName?: Path<TFieldValues>) => Promise<boolean>;
  /** Form submission with loading state */
  submitAsync: SubmitHandler<TFieldValues>;
  /** Reset form with new schema */
  resetWithSchema: (schema: ZodSchema<TFieldValues>, defaultValues?: Partial<TFieldValues>) => void;
}

/**
 * Form context interface for provider pattern
 */
export interface FormContextValue<TFieldValues extends FieldValues = FieldValues> {
  /** Form instance */
  form: EnhancedFormInstance<TFieldValues>;
  /** Form schema */
  schema: FormSchema<TFieldValues>;
  /** Current form data */
  data: TFieldValues;
  /** Form submission state */
  isSubmitting: boolean;
  /** Form validation state */
  isValid: boolean;
  /** Form dirty state */
  isDirty: boolean;
  /** Form touched state */
  isTouched: boolean;
  /** Form errors */
  errors: FieldErrors<TFieldValues>;
  /** Performance metrics */
  metrics: FormPerformanceMetrics;
}

/**
 * Form performance metrics for monitoring
 */
export interface FormPerformanceMetrics {
  /** Average validation time in milliseconds */
  avgValidationTime: number;
  /** Maximum validation time in milliseconds */
  maxValidationTime: number;
  /** Total validations performed */
  totalValidations: number;
  /** Validation errors encountered */
  validationErrors: number;
  /** Form render count */
  renderCount: number;
  /** First input time */
  firstInputTime?: Date;
  /** Last submission time */
  lastSubmissionTime?: Date;
}

/**
 * Dynamic form generator props
 */
export interface DynamicFormProps<TFieldValues extends FieldValues = FieldValues> {
  /** Form schema */
  schema: FormSchema<TFieldValues>;
  /** Initial form values */
  defaultValues?: Partial<TFieldValues>;
  /** Form submission handler */
  onSubmit: SubmitHandler<TFieldValues>;
  /** Form error handler */
  onError?: SubmitErrorHandler<TFieldValues>;
  /** Loading state */
  loading?: boolean;
  /** Disabled state */
  disabled?: boolean;
  /** Form ID for accessibility */
  id?: string;
  /** Additional form props */
  formProps?: ComponentProps<'form'>;
  /** Custom field renderers */
  fieldRenderers?: Partial<Record<FormFieldType, ComponentType<any>>>;
  /** Form theme */
  theme?: ThemeProps;
  /** Performance monitoring callback */
  onPerformanceUpdate?: (metrics: FormPerformanceMetrics) => void;
}

/**
 * Form field component props interface
 */
export interface FormFieldProps<TFieldValues extends FieldValues = FieldValues> 
  extends FormComponentProps, ThemeProps {
  /** Field configuration */
  config: FormFieldConfig<TFieldValues>;
  /** Form register function */
  register: UseFormRegister<TFieldValues>;
  /** Form control */
  control?: Control<TFieldValues>;
  /** Field error */
  error?: FormFieldError;
  /** Field validation state */
  validationState?: EnhancedValidationState;
  /** Form watch function */
  watch?: UseFormWatch<TFieldValues>;
  /** Form setValue function */
  setValue?: UseFormSetValue<TFieldValues>;
  /** Form trigger function */
  trigger?: UseFormTrigger<TFieldValues>;
  /** Field value */
  value?: PathValue<TFieldValues, Path<TFieldValues>>;
  /** Change handler */
  onChange?: (value: any) => void;
  /** Blur handler */
  onBlur?: () => void;
  /** Focus handler */
  onFocus?: () => void;
}

/**
 * Form wizard configuration for multi-step forms
 */
export interface FormWizardConfig<TFieldValues extends FieldValues = FieldValues> {
  /** Wizard steps */
  steps: FormWizardStep<TFieldValues>[];
  /** Current step index */
  currentStep: number;
  /** Navigation configuration */
  navigation?: FormWizardNavigation;
  /** Validation strategy */
  validation?: 'onStepChange' | 'onSubmit' | 'realtime';
  /** Progress tracking */
  progress?: FormWizardProgress;
}

/**
 * Form wizard step configuration
 */
export interface FormWizardStep<TFieldValues extends FieldValues = FieldValues> {
  /** Step identifier */
  id: string;
  /** Step title */
  title: string;
  /** Step description */
  description?: string;
  /** Fields in this step */
  fields: Path<TFieldValues>[];
  /** Step validation schema */
  schema?: ZodSchema<Partial<TFieldValues>>;
  /** Step completion requirements */
  completion?: FormStepCompletion<TFieldValues>;
  /** Is step optional */
  optional?: boolean;
  /** Skip step conditions */
  skipConditions?: FormFieldCondition<TFieldValues>[];
}

/**
 * Form wizard navigation configuration
 */
export interface FormWizardNavigation {
  /** Show navigation buttons */
  showButtons?: boolean;
  /** Show progress bar */
  showProgress?: boolean;
  /** Show step numbers */
  showStepNumbers?: boolean;
  /** Allow step clicking */
  allowStepNavigation?: boolean;
  /** Custom button labels */
  buttonLabels?: {
    previous?: string;
    next?: string;
    submit?: string;
    cancel?: string;
  };
}

/**
 * Form wizard progress tracking
 */
export interface FormWizardProgress {
  /** Progress calculation method */
  method?: 'steps' | 'fields' | 'weighted';
  /** Field weights for weighted progress */
  fieldWeights?: Record<string, number>;
  /** Show percentage */
  showPercentage?: boolean;
  /** Show remaining steps */
  showRemaining?: boolean;
}

/**
 * Form step completion requirements
 */
export interface FormStepCompletion<TFieldValues extends FieldValues = FieldValues> {
  /** Required fields for completion */
  requiredFields?: Path<TFieldValues>[];
  /** Custom completion validator */
  validator?: (values: Partial<TFieldValues>) => boolean | string;
  /** Async completion validator */
  asyncValidator?: (values: Partial<TFieldValues>) => Promise<boolean | string>;
}

/**
 * Form validation hook return type
 */
export interface UseFormValidationReturn<TFieldValues extends FieldValues = FieldValues> {
  /** Validate field */
  validateField: (fieldName: Path<TFieldValues>, value?: any) => Promise<string | undefined>;
  /** Validate form */
  validateForm: (values: TFieldValues) => Promise<FieldErrors<TFieldValues>>;
  /** Clear field error */
  clearFieldError: (fieldName: Path<TFieldValues>) => void;
  /** Set field error */
  setFieldError: (fieldName: Path<TFieldValues>, error: string) => void;
  /** Validation performance metrics */
  validationMetrics: FormPerformanceMetrics;
}

/**
 * Form data transformation utilities
 */
export interface FormDataTransformer<TInput = any, TOutput = any> {
  /** Transform data before validation */
  beforeValidation?: (data: TInput) => TInput;
  /** Transform data after validation */
  afterValidation?: (data: TInput) => TOutput;
  /** Transform data before submission */
  beforeSubmission?: (data: TOutput) => any;
  /** Transform response data */
  onResponse?: (response: any) => any;
}

/**
 * Form accessibility configuration
 */
export interface FormAccessibilityConfig extends AccessibilityProps {
  /** Form landmarks */
  landmarks?: {
    form?: string;
    errors?: string;
    submit?: string;
  };
  /** Error announcement */
  errorAnnouncement?: {
    strategy?: 'immediate' | 'polite' | 'assertive';
    template?: string;
  };
  /** Focus management */
  focusManagement?: {
    autoFocusFirst?: boolean;
    focusErrorOnSubmit?: boolean;
    trapFocus?: boolean;
  };
  /** Screen reader optimizations */
  screenReader?: {
    announceProgress?: boolean;
    announceValidation?: boolean;
    announceNavigation?: boolean;
  };
}

/**
 * Type-safe form configuration builder
 */
export type FormConfigBuilder<TFieldValues extends FieldValues = FieldValues> = {
  /** Add field to form */
  field: <K extends Path<TFieldValues>>(
    name: K,
    config: Omit<FormFieldConfig<TFieldValues>, 'name'>
  ) => FormConfigBuilder<TFieldValues>;
  /** Set form schema */
  schema: (schema: ZodSchema<TFieldValues>) => FormConfigBuilder<TFieldValues>;
  /** Set form metadata */
  metadata: (metadata: FormMetadata) => FormConfigBuilder<TFieldValues>;
  /** Set form layout */
  layout: (layout: FormLayoutConfig) => FormConfigBuilder<TFieldValues>;
  /** Build final form schema */
  build: () => FormSchema<TFieldValues>;
};

/**
 * Database-specific form field types for DreamFactory
 */
export type DatabaseFieldType = 
  | 'varchar'
  | 'text'
  | 'integer'
  | 'bigint'
  | 'decimal'
  | 'float'
  | 'boolean'
  | 'date'
  | 'datetime'
  | 'timestamp'
  | 'json'
  | 'binary'
  | 'uuid';

/**
 * Database connection form configuration
 */
export interface DatabaseConnectionFormConfig {
  /** Database type */
  type: 'mysql' | 'postgresql' | 'mongodb' | 'oracle' | 'snowflake' | 'sqlite';
  /** Connection fields specific to database type */
  fields: DatabaseConnectionField[];
  /** Connection test configuration */
  testConnection?: {
    endpoint: string;
    timeout: number;
    retries: number;
  };
  /** Advanced options */
  advanced?: DatabaseAdvancedOptions;
}

/**
 * Database connection field configuration
 */
export interface DatabaseConnectionField extends FormFieldConfig {
  /** Database-specific field properties */
  database?: {
    /** Field mapping to database parameter */
    parameter: string;
    /** Default value for database type */
    defaultValue?: any;
    /** Field dependencies */
    dependsOn?: string[];
    /** Validation against database constraints */
    constraints?: DatabaseFieldConstraints;
  };
}

/**
 * Database field constraints
 */
export interface DatabaseFieldConstraints {
  /** Minimum value */
  min?: number;
  /** Maximum value */
  max?: number;
  /** Allowed values */
  enum?: any[];
  /** Pattern validation */
  pattern?: RegExp;
  /** Custom validation */
  custom?: (value: any, context: any) => boolean | string;
}

/**
 * Database advanced options
 */
export interface DatabaseAdvancedOptions {
  /** SSL configuration */
  ssl?: boolean;
  /** Connection pooling */
  pooling?: {
    min: number;
    max: number;
    idle: number;
  };
  /** Timeout settings */
  timeout?: {
    connection: number;
    query: number;
  };
  /** Character set */
  charset?: string;
  /** Timezone */
  timezone?: string;
}

/**
 * Export all form-related types for external consumption
 */
export type {
  UseFormRegister,
  UseFormSetValue,
  UseFormGetValues,
  UseFormWatch,
  UseFormTrigger,
  UseFormReset,
  UseFormClearErrors,
  UseFormSetError,
  UseFormHandleSubmit,
  UseFormReturn,
  FieldError,
  FieldErrors,
  FieldValues,
  Path,
  PathValue,
  RegisterOptions,
  SubmitHandler,
  SubmitErrorHandler,
  Control,
  ValidationRule,
  Validate,
  ZodSchema,
  ZodType,
  ZodError,
  ZodInfer
} from './forms';