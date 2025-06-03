/**
 * Form Types and Interfaces for React Hook Form with Zod Validation
 * 
 * This module provides comprehensive type definitions for form management using React Hook Form 7.57.0
 * with Zod schema validation. It supports dynamic field generation, conditional logic, real-time
 * validation under 100ms, and full accessibility compliance.
 * 
 * @version 1.0.0
 * @since 2024-12-19
 */

import { ReactNode, ComponentType } from 'react';
import { 
  UseFormProps, 
  UseFormReturn, 
  FieldValues, 
  Path, 
  PathValue,
  FieldError,
  RegisterOptions,
  FieldPath
} from 'react-hook-form';
import { z, ZodSchema, ZodError } from 'zod';

// =============================================================================
// CORE FORM CONFIGURATION TYPES
// =============================================================================

/**
 * Base configuration for React Hook Form initialization
 * Provides type-safe configuration with Zod schema integration
 */
export interface FormConfig<T extends FieldValues = FieldValues> extends UseFormProps<T> {
  /** Zod schema for validation */
  schema?: ZodSchema<T>;
  /** Form identifier for tracking and testing */
  formId: string;
  /** Form title for accessibility and UI */
  title?: string;
  /** Form description for context */
  description?: string;
  /** Real-time validation configuration */
  realtimeValidation?: RealtimeValidationConfig;
  /** Performance optimization settings */
  performance?: FormPerformanceConfig;
  /** Accessibility configuration */
  accessibility?: FormAccessibilityConfig;
}

/**
 * Real-time validation configuration
 * Ensures validation responses under 100ms requirement
 */
export interface RealtimeValidationConfig {
  /** Enable real-time validation (default: true) */
  enabled: boolean;
  /** Debounce delay in milliseconds (default: 50ms) */
  debounceMs: number;
  /** Validation mode for real-time updates */
  mode: 'onChange' | 'onBlur' | 'onTouched' | 'all';
  /** Re-validation mode for error correction */
  reValidateMode: 'onChange' | 'onBlur' | 'onSubmit';
  /** Show validation indicators during processing */
  showValidationIndicators: boolean;
}

/**
 * Performance optimization configuration
 * Minimizes re-renders while maintaining reactivity
 */
export interface FormPerformanceConfig {
  /** Use uncontrolled components (default: true) */
  uncontrolled: boolean;
  /** Optimize for large forms (100+ fields) */
  optimizeForLargeForms: boolean;
  /** Enable field-level subscription optimization */
  fieldLevelSubscription: boolean;
  /** Lazy validation for non-critical fields */
  lazyValidation: boolean;
}

/**
 * Accessibility configuration for WCAG 2.1 AA compliance
 */
export interface FormAccessibilityConfig {
  /** Enable screen reader support */
  screenReaderSupport: boolean;
  /** Announce validation errors */
  announceValidationErrors: boolean;
  /** Enable keyboard navigation */
  keyboardNavigation: boolean;
  /** ARIA live region for dynamic updates */
  ariaLiveRegion: 'off' | 'polite' | 'assertive';
  /** Focus management for form interactions */
  focusManagement: FocusManagementConfig;
}

/**
 * Focus management configuration
 */
export interface FocusManagementConfig {
  /** Focus first error field on validation failure */
  focusFirstError: boolean;
  /** Focus next field on successful input */
  focusNextOnSuccess: boolean;
  /** Focus management for conditional fields */
  focusConditionalFields: boolean;
}

// =============================================================================
// FORM FIELD TYPES AND DEFINITIONS
// =============================================================================

/**
 * Comprehensive form field type enumeration
 * Supports all HTML5 input types plus custom DreamFactory-specific types
 */
export type FormFieldType =
  // Standard HTML5 input types
  | 'text'
  | 'password'
  | 'email'
  | 'url'
  | 'tel'
  | 'search'
  | 'number'
  | 'range'
  | 'date'
  | 'datetime-local'
  | 'time'
  | 'month'
  | 'week'
  | 'color'
  | 'file'
  | 'hidden'
  // Form control types
  | 'textarea'
  | 'select'
  | 'multiselect'
  | 'checkbox'
  | 'radio'
  | 'switch'
  | 'toggle'
  // Advanced input types
  | 'json'
  | 'code'
  | 'markdown'
  | 'wysiwyg'
  | 'tags'
  | 'rating'
  | 'slider'
  | 'button-group'
  // Database-specific types
  | 'connection-string'
  | 'database-type'
  | 'table-selector'
  | 'field-mapping'
  | 'query-builder'
  // Custom component types
  | 'custom';

/**
 * Base form field configuration
 * Provides common properties for all field types
 */
export interface BaseFormField {
  /** Unique field identifier */
  id: string;
  /** Field name for form data binding */
  name: string;
  /** Field type determines rendering and validation */
  type: FormFieldType;
  /** Display label for the field */
  label: string;
  /** Placeholder text for input guidance */
  placeholder?: string;
  /** Help text or description */
  description?: string;
  /** Field is required for form submission */
  required?: boolean;
  /** Field is disabled (non-interactive) */
  disabled?: boolean;
  /** Field is read-only (display value only) */
  readonly?: boolean;
  /** Field is hidden from UI */
  hidden?: boolean;
  /** Default value for the field */
  defaultValue?: any;
  /** Field validation configuration */
  validation?: FieldValidationConfig;
  /** Conditional display logic */
  conditional?: ConditionalLogic;
  /** Field layout and styling configuration */
  layout?: FieldLayoutConfig;
  /** Accessibility configuration */
  accessibility?: FieldAccessibilityConfig;
  /** Performance optimization settings */
  performance?: FieldPerformanceConfig;
}

/**
 * Enhanced form field with specific type configurations
 */
export interface FormField extends BaseFormField {
  /** Type-specific configuration */
  config?: FieldTypeConfig;
  /** Field-specific event handlers */
  handlers?: FieldEventHandlers;
  /** Integration with other form fields */
  integration?: FieldIntegrationConfig;
}

/**
 * Field validation configuration using Zod schema patterns
 */
export interface FieldValidationConfig {
  /** Zod schema for field validation */
  schema?: ZodSchema;
  /** Custom validation rules */
  rules?: RegisterOptions;
  /** Validation timing configuration */
  timing?: ValidationTimingConfig;
  /** Error message customization */
  errorMessages?: FieldErrorMessages;
  /** Cross-field validation dependencies */
  dependencies?: string[];
  /** Validation transformation functions */
  transforms?: FieldTransforms;
}

/**
 * Validation timing configuration for performance optimization
 */
export interface ValidationTimingConfig {
  /** Validate on field change (default: true) */
  onChange: boolean;
  /** Validate on field blur (default: true) */
  onBlur: boolean;
  /** Validate on form submission (default: true) */
  onSubmit: boolean;
  /** Debounce validation delay in milliseconds */
  debounce: number;
  /** Async validation support */
  async: boolean;
}

/**
 * Custom error messages for comprehensive user feedback
 */
export interface FieldErrorMessages {
  /** Required field error message */
  required?: string;
  /** Invalid format error message */
  invalid?: string;
  /** Minimum length error message */
  minLength?: string;
  /** Maximum length error message */
  maxLength?: string;
  /** Pattern mismatch error message */
  pattern?: string;
  /** Custom validation error messages */
  custom?: Record<string, string>;
}

/**
 * Field transformation functions for data processing
 */
export interface FieldTransforms {
  /** Transform input value before validation */
  input?: (value: any) => any;
  /** Transform output value before submission */
  output?: (value: any) => any;
  /** Format value for display */
  display?: (value: any) => string;
  /** Parse value from display format */
  parse?: (value: string) => any;
}

// =============================================================================
// CONDITIONAL LOGIC AND DYNAMIC FORMS
// =============================================================================

/**
 * Conditional logic for dynamic form behavior
 * Supports complex conditional field showing/hiding and validation
 */
export interface ConditionalLogic {
  /** Conditions that must be met */
  conditions: FieldCondition[];
  /** Logical operator for multiple conditions */
  operator: 'AND' | 'OR';
  /** Action to take when conditions are met */
  action: ConditionalAction;
  /** Action parameters */
  actionParams?: Record<string, any>;
}

/**
 * Individual field condition for conditional logic
 */
export interface FieldCondition {
  /** Target field name */
  field: string;
  /** Comparison operator */
  operator: ComparisonOperator;
  /** Comparison value */
  value: any;
  /** Condition weight for complex logic */
  weight?: number;
}

/**
 * Comparison operators for conditional logic
 */
export type ComparisonOperator =
  | 'equals'
  | 'notEquals'
  | 'contains'
  | 'notContains'
  | 'startsWith'
  | 'endsWith'
  | 'greaterThan'
  | 'lessThan'
  | 'greaterThanOrEqual'
  | 'lessThanOrEqual'
  | 'in'
  | 'notIn'
  | 'isEmpty'
  | 'isNotEmpty'
  | 'isNull'
  | 'isNotNull'
  | 'matches'
  | 'doesNotMatch';

/**
 * Actions that can be taken based on conditional logic
 */
export type ConditionalAction =
  | 'show'
  | 'hide'
  | 'enable'
  | 'disable'
  | 'require'
  | 'optional'
  | 'focus'
  | 'clear'
  | 'setValue'
  | 'transform'
  | 'validate'
  | 'reset';

// =============================================================================
// FORM STATE MANAGEMENT
// =============================================================================

/**
 * Enhanced form state with React Hook Form integration
 */
export interface FormState<T extends FieldValues = FieldValues> {
  /** React Hook Form instance */
  form: UseFormReturn<T>;
  /** Current form values */
  values: T;
  /** Form validation errors */
  errors: FieldErrors<T>;
  /** Form submission state */
  isSubmitting: boolean;
  /** Form validation state */
  isValidating: boolean;
  /** Form has been submitted */
  isSubmitted: boolean;
  /** Form has been touched */
  isDirty: boolean;
  /** Form is valid */
  isValid: boolean;
  /** Loading state for async operations */
  isLoading: boolean;
  /** Form submission attempt count */
  submitCount: number;
  /** Field-level states */
  fieldStates: FieldStates<T>;
}

/**
 * Field-level state tracking
 */
export type FieldStates<T extends FieldValues> = {
  [K in Path<T>]: FieldState;
};

/**
 * Individual field state
 */
export interface FieldState {
  /** Field has been touched */
  isTouched: boolean;
  /** Field has been modified */
  isDirty: boolean;
  /** Field is currently validating */
  isValidating: boolean;
  /** Field validation error */
  error?: FieldError;
  /** Field is disabled */
  isDisabled: boolean;
  /** Field is visible */
  isVisible: boolean;
  /** Field focus state */
  isFocused: boolean;
}

/**
 * Form submission configuration and handlers
 */
export interface FormSubmissionConfig<T extends FieldValues = FieldValues> {
  /** Submission handler function */
  onSubmit: (data: T) => void | Promise<void>;
  /** Submission error handler */
  onError?: (errors: FieldErrors<T>) => void;
  /** Pre-submission validation */
  onBeforeSubmit?: (data: T) => boolean | Promise<boolean>;
  /** Post-submission success handler */
  onSuccess?: (data: T) => void;
  /** Form reset after successful submission */
  resetOnSuccess?: boolean;
  /** Submission configuration */
  submission?: SubmissionOptions;
}

/**
 * Submission options for API integration
 */
export interface SubmissionOptions {
  /** HTTP method for submission */
  method: 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  /** API endpoint URL */
  url: string;
  /** Request headers */
  headers?: Record<string, string>;
  /** Request timeout in milliseconds */
  timeout?: number;
  /** Retry configuration */
  retry?: RetryConfig;
  /** Data transformation before submission */
  transform?: DataTransformConfig;
}

/**
 * Retry configuration for failed submissions
 */
export interface RetryConfig {
  /** Maximum retry attempts */
  maxAttempts: number;
  /** Delay between retries in milliseconds */
  delayMs: number;
  /** Exponential backoff multiplier */
  backoffMultiplier: number;
  /** Conditions for retry */
  retryOn?: (error: any) => boolean;
}

/**
 * Data transformation configuration
 */
export interface DataTransformConfig {
  /** Fields to include in submission */
  include?: string[];
  /** Fields to exclude from submission */
  exclude?: string[];
  /** Field name mapping */
  fieldMapping?: Record<string, string>;
  /** Custom transformation functions */
  transforms?: Record<string, (value: any) => any>;
  /** Flatten nested objects */
  flatten?: boolean;
  /** Remove empty values */
  removeEmpty?: boolean;
}

// =============================================================================
// FIELD TYPE-SPECIFIC CONFIGURATIONS
// =============================================================================

/**
 * Type-specific configuration for different field types
 */
export type FieldTypeConfig =
  | TextFieldConfig
  | NumberFieldConfig
  | SelectFieldConfig
  | FileFieldConfig
  | DateFieldConfig
  | JsonFieldConfig
  | DatabaseFieldConfig
  | CustomFieldConfig;

/**
 * Text field configuration
 */
export interface TextFieldConfig {
  /** Minimum length */
  minLength?: number;
  /** Maximum length */
  maxLength?: number;
  /** RegExp pattern for validation */
  pattern?: string;
  /** Text transformation */
  transform?: TextTransform;
  /** Auto-complete configuration */
  autoComplete?: string;
  /** Spell check enabled */
  spellCheck?: boolean;
}

/**
 * Number field configuration
 */
export interface NumberFieldConfig {
  /** Minimum value */
  min?: number;
  /** Maximum value */
  max?: number;
  /** Step value for increments */
  step?: number;
  /** Number format configuration */
  format?: NumberFormatConfig;
  /** Allow decimal values */
  allowDecimal?: boolean;
  /** Thousand separator */
  thousandSeparator?: string;
  /** Decimal separator */
  decimalSeparator?: string;
}

/**
 * Select field configuration
 */
export interface SelectFieldConfig {
  /** Available options */
  options: SelectOption[];
  /** Allow multiple selections */
  multiple?: boolean;
  /** Enable search/filter */
  searchable?: boolean;
  /** Allow clearing selection */
  clearable?: boolean;
  /** Allow creating new options */
  creatable?: boolean;
  /** Async option loading */
  asyncOptions?: AsyncOptionsConfig;
  /** Option grouping */
  groupBy?: string;
}

/**
 * File field configuration
 */
export interface FileFieldConfig {
  /** Accepted file types */
  accept?: string[];
  /** Allow multiple files */
  multiple?: boolean;
  /** Maximum file size in bytes */
  maxSize?: number;
  /** Maximum number of files */
  maxFiles?: number;
  /** File upload endpoint */
  uploadUrl?: string;
  /** Preview configuration */
  preview?: FilePreviewConfig;
}

/**
 * Date field configuration
 */
export interface DateFieldConfig {
  /** Date format string */
  format?: string;
  /** Minimum date */
  minDate?: Date | string;
  /** Maximum date */
  maxDate?: Date | string;
  /** Disabled dates */
  disabledDates?: Date[] | string[];
  /** Show time picker */
  showTime?: boolean;
  /** Timezone configuration */
  timezone?: string;
}

/**
 * JSON field configuration
 */
export interface JsonFieldConfig {
  /** JSON schema for validation */
  schema?: ZodSchema;
  /** Pretty print JSON */
  prettyPrint?: boolean;
  /** Syntax highlighting */
  syntaxHighlighting?: boolean;
  /** Code editor theme */
  theme?: string;
  /** Auto-format on blur */
  autoFormat?: boolean;
}

/**
 * Database-specific field configuration
 */
export interface DatabaseFieldConfig {
  /** Database connection for data loading */
  connection?: string;
  /** SQL query for options */
  query?: string;
  /** Cached data configuration */
  cache?: CacheConfig;
  /** Real-time data updates */
  realtime?: boolean;
}

/**
 * Custom field configuration
 */
export interface CustomFieldConfig {
  /** Custom component type */
  component: ComponentType<any>;
  /** Component props */
  props?: Record<string, any>;
  /** Custom validation */
  customValidation?: (value: any) => string | undefined;
  /** Custom rendering */
  render?: (field: FormField) => ReactNode;
}

// =============================================================================
// UTILITY TYPES AND INTERFACES
// =============================================================================

/**
 * Select option interface
 */
export interface SelectOption {
  /** Option value */
  value: string | number | boolean;
  /** Display label */
  label: string;
  /** Option description */
  description?: string;
  /** Option icon */
  icon?: ComponentType<{ className?: string }>;
  /** Option is disabled */
  disabled?: boolean;
  /** Option group */
  group?: string;
  /** Additional metadata */
  metadata?: Record<string, any>;
}

/**
 * Async options configuration
 */
export interface AsyncOptionsConfig {
  /** Options loading function */
  loadOptions: (inputValue: string) => Promise<SelectOption[]>;
  /** Default options to show */
  defaultOptions?: SelectOption[] | boolean;
  /** Cache loaded options */
  cacheOptions?: boolean;
  /** Loading debounce delay */
  loadingDebounce?: number;
}

/**
 * File preview configuration
 */
export interface FilePreviewConfig {
  /** Show file preview */
  enabled: boolean;
  /** Preview size */
  size?: 'sm' | 'md' | 'lg';
  /** Allowed preview types */
  types?: string[];
  /** Preview thumbnail generation */
  thumbnails?: boolean;
}

/**
 * Number format configuration
 */
export interface NumberFormatConfig {
  /** Locale for number formatting */
  locale?: string;
  /** Currency code for currency formatting */
  currency?: string;
  /** Minimum fraction digits */
  minimumFractionDigits?: number;
  /** Maximum fraction digits */
  maximumFractionDigits?: number;
  /** Use grouping separator */
  useGrouping?: boolean;
}

/**
 * Cache configuration for data loading
 */
export interface CacheConfig {
  /** Enable caching */
  enabled: boolean;
  /** Cache TTL in milliseconds */
  ttl?: number;
  /** Cache key generation */
  keyGenerator?: (params: any) => string;
  /** Cache storage type */
  storage?: 'memory' | 'localStorage' | 'sessionStorage';
}

/**
 * Text transformation options
 */
export type TextTransform =
  | 'none'
  | 'uppercase'
  | 'lowercase'
  | 'capitalize'
  | 'camelCase'
  | 'pascalCase'
  | 'kebabCase'
  | 'snakeCase'
  | 'trim'
  | 'normalize';

/**
 * Field layout configuration
 */
export interface FieldLayoutConfig {
  /** Grid column span */
  span?: number;
  /** Grid column offset */
  offset?: number;
  /** Field order in layout */
  order?: number;
  /** Responsive breakpoints */
  responsive?: ResponsiveLayoutConfig;
  /** Field grouping */
  group?: string;
  /** Field section */
  section?: string;
}

/**
 * Responsive layout configuration
 */
export interface ResponsiveLayoutConfig {
  /** Small screens */
  sm?: LayoutBreakpoint;
  /** Medium screens */
  md?: LayoutBreakpoint;
  /** Large screens */
  lg?: LayoutBreakpoint;
  /** Extra large screens */
  xl?: LayoutBreakpoint;
}

/**
 * Layout breakpoint configuration
 */
export interface LayoutBreakpoint {
  /** Column span */
  span?: number;
  /** Column offset */
  offset?: number;
  /** Field order */
  order?: number;
  /** Hide field at this breakpoint */
  hidden?: boolean;
}

/**
 * Field accessibility configuration
 */
export interface FieldAccessibilityConfig {
  /** ARIA label */
  ariaLabel?: string;
  /** ARIA described by */
  ariaDescribedBy?: string;
  /** ARIA required */
  ariaRequired?: boolean;
  /** ARIA invalid */
  ariaInvalid?: boolean;
  /** Tab index */
  tabIndex?: number;
  /** Screen reader only text */
  srOnly?: string;
}

/**
 * Field performance configuration
 */
export interface FieldPerformanceConfig {
  /** Lazy loading for expensive fields */
  lazy?: boolean;
  /** Virtual scrolling for large option lists */
  virtual?: boolean;
  /** Debounce input changes */
  debounce?: number;
  /** Memo field rendering */
  memo?: boolean;
}

/**
 * Field event handlers
 */
export interface FieldEventHandlers {
  /** Value change handler */
  onChange?: (value: any, name: string) => void;
  /** Field blur handler */
  onBlur?: (name: string) => void;
  /** Field focus handler */
  onFocus?: (name: string) => void;
  /** Key press handler */
  onKeyPress?: (event: KeyboardEvent, name: string) => void;
  /** Custom event handlers */
  custom?: Record<string, (event: any, name: string) => void>;
}

/**
 * Field integration configuration
 */
export interface FieldIntegrationConfig {
  /** Sync with other fields */
  syncWith?: string[];
  /** Watch other field changes */
  watchFields?: string[];
  /** Trigger validation of other fields */
  triggerValidation?: string[];
  /** Update dependent fields */
  updateDependents?: FieldDependencyConfig[];
}

/**
 * Field dependency configuration
 */
export interface FieldDependencyConfig {
  /** Target field name */
  field: string;
  /** Update trigger */
  trigger: DependencyTrigger;
  /** Update function */
  update: (sourceValue: any, targetValue: any) => any;
}

/**
 * Dependency trigger types
 */
export type DependencyTrigger =
  | 'onChange'
  | 'onBlur'
  | 'onFocus'
  | 'onMount'
  | 'onUnmount'
  | 'conditional';

// =============================================================================
// FORM BUILDER AND DYNAMIC GENERATION
// =============================================================================

/**
 * Dynamic form schema for database-driven form generation
 */
export interface DynamicFormSchema {
  /** Schema identifier */
  id: string;
  /** Schema version */
  version: string;
  /** Form metadata */
  metadata: FormMetadata;
  /** Form fields */
  fields: FormField[];
  /** Form layout */
  layout: FormLayoutConfig;
  /** Form validation */
  validation: FormValidationSchema;
  /** Form submission */
  submission: FormSubmissionConfig;
  /** Form styling */
  styling?: FormStylingConfig;
}

/**
 * Form metadata
 */
export interface FormMetadata {
  /** Form title */
  title: string;
  /** Form description */
  description?: string;
  /** Form category */
  category?: string;
  /** Form tags */
  tags?: string[];
  /** Created date */
  createdAt: string;
  /** Last modified date */
  modifiedAt: string;
  /** Author information */
  author?: string;
  /** Form version */
  version: string;
}

/**
 * Form layout configuration
 */
export interface FormLayoutConfig {
  /** Layout type */
  type: FormLayoutType;
  /** Number of columns */
  columns?: number;
  /** Gap between fields */
  gap?: string;
  /** Form sections */
  sections?: FormSection[];
  /** Responsive configuration */
  responsive?: boolean;
}

/**
 * Form layout types
 */
export type FormLayoutType =
  | 'single-column'
  | 'two-column'
  | 'grid'
  | 'tabs'
  | 'accordion'
  | 'wizard'
  | 'inline'
  | 'stack';

/**
 * Form section configuration
 */
export interface FormSection {
  /** Section identifier */
  id: string;
  /** Section title */
  title: string;
  /** Section description */
  description?: string;
  /** Fields in this section */
  fields: string[];
  /** Section is collapsible */
  collapsible?: boolean;
  /** Section is collapsed by default */
  collapsed?: boolean;
  /** Section order */
  order?: number;
  /** Section conditional logic */
  conditional?: ConditionalLogic;
}

/**
 * Form validation schema
 */
export interface FormValidationSchema {
  /** Field validation rules */
  fields: Record<string, FieldValidationConfig>;
  /** Cross-field validation */
  crossField?: CrossFieldValidation[];
  /** Form-level validation */
  form?: FormLevelValidation;
  /** Validation groups */
  groups?: ValidationGroup[];
}

/**
 * Cross-field validation
 */
export interface CrossFieldValidation {
  /** Validation identifier */
  id: string;
  /** Fields involved in validation */
  fields: string[];
  /** Validation function */
  validator: (values: Record<string, any>) => string | undefined;
  /** Error message */
  message: string;
  /** Validation trigger */
  trigger: ValidationTrigger;
}

/**
 * Form-level validation
 */
export interface FormLevelValidation {
  /** Custom validation function */
  validator: (values: FieldValues) => Record<string, string> | undefined;
  /** Validation trigger */
  trigger: ValidationTrigger;
  /** Async validation support */
  async?: boolean;
}

/**
 * Validation group configuration
 */
export interface ValidationGroup {
  /** Group identifier */
  id: string;
  /** Group name */
  name: string;
  /** Fields in this group */
  fields: string[];
  /** Group validation rules */
  rules: FieldValidationConfig;
  /** Group is required */
  required: boolean;
}

/**
 * Validation trigger types
 */
export type ValidationTrigger =
  | 'onChange'
  | 'onBlur'
  | 'onSubmit'
  | 'onMount'
  | 'manual'
  | 'debounced';

/**
 * Form styling configuration
 */
export interface FormStylingConfig {
  /** Form theme */
  theme?: FormTheme;
  /** Component size */
  size?: ComponentSize;
  /** Color scheme */
  colorScheme?: 'light' | 'dark' | 'auto';
  /** Border style */
  borders?: boolean;
  /** Shadow effects */
  shadows?: boolean;
  /** Border radius */
  rounded?: boolean;
  /** Custom CSS classes */
  className?: string;
  /** Custom CSS styles */
  style?: Record<string, string>;
}

/**
 * Form theme options
 */
export type FormTheme =
  | 'default'
  | 'minimal'
  | 'card'
  | 'inline'
  | 'floating'
  | 'outline'
  | 'filled'
  | 'underline';

/**
 * Component size options
 */
export type ComponentSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl';

// =============================================================================
// ERROR HANDLING AND MESSAGING
// =============================================================================

/**
 * Enhanced field errors with accessibility support
 */
export type FieldErrors<T extends FieldValues> = {
  [K in Path<T>]?: FieldError & {
    /** Error accessibility configuration */
    accessibility?: ErrorAccessibilityConfig;
    /** Error display configuration */
    display?: ErrorDisplayConfig;
    /** Error recovery suggestions */
    recovery?: ErrorRecoveryConfig;
  };
};

/**
 * Error accessibility configuration
 */
export interface ErrorAccessibilityConfig {
  /** Announce error to screen readers */
  announce?: boolean;
  /** ARIA live region type */
  liveRegion?: 'polite' | 'assertive';
  /** Error role for screen readers */
  role?: 'alert' | 'status';
  /** Focus error field on display */
  focusField?: boolean;
}

/**
 * Error display configuration
 */
export interface ErrorDisplayConfig {
  /** Error display position */
  position?: 'top' | 'bottom' | 'inline' | 'tooltip';
  /** Error animation */
  animation?: 'fadeIn' | 'slideIn' | 'shake' | 'none';
  /** Error icon */
  icon?: boolean;
  /** Error color theme */
  colorTheme?: 'error' | 'warning' | 'info';
}

/**
 * Error recovery configuration
 */
export interface ErrorRecoveryConfig {
  /** Suggested fix action */
  suggestion?: string;
  /** Auto-fix function */
  autoFix?: (value: any) => any;
  /** Help documentation link */
  helpLink?: string;
  /** Contact support option */
  supportContact?: boolean;
}

// =============================================================================
// DATABASE-SPECIFIC FORM TYPES
// =============================================================================

/**
 * Database connection form schema
 * Specialized form for database service configuration
 */
export interface DatabaseConnectionFormSchema extends DynamicFormSchema {
  /** Database type-specific configuration */
  databaseConfig: DatabaseTypeConfig;
  /** Connection test configuration */
  connectionTest: ConnectionTestConfig;
  /** Advanced options */
  advancedOptions: DatabaseAdvancedOptions;
}

/**
 * Database type configuration
 */
export interface DatabaseTypeConfig {
  /** Supported database types */
  supportedTypes: DatabaseType[];
  /** Type-specific field mappings */
  typeFieldMappings: Record<DatabaseType, string[]>;
  /** Default configurations per type */
  defaultConfigs: Record<DatabaseType, Record<string, any>>;
  /** Validation schemas per type */
  validationSchemas: Record<DatabaseType, ZodSchema>;
}

/**
 * Database types supported by DreamFactory
 */
export type DatabaseType =
  | 'mysql'
  | 'postgresql'
  | 'sqlserver'
  | 'oracle'
  | 'mongodb'
  | 'snowflake'
  | 'sqlite'
  | 'mariadb'
  | 'cassandra'
  | 'dynamodb';

/**
 * Connection test configuration
 */
export interface ConnectionTestConfig {
  /** Enable connection testing */
  enabled: boolean;
  /** Test timeout in milliseconds */
  timeout: number;
  /** Test query to execute */
  testQuery?: string;
  /** Expected test result */
  expectedResult?: any;
  /** Auto-test on field changes */
  autoTest: boolean;
  /** Test result display */
  displayResult: boolean;
}

/**
 * Database advanced options
 */
export interface DatabaseAdvancedOptions {
  /** SSL configuration fields */
  sslFields: string[];
  /** Connection pooling fields */
  poolingFields: string[];
  /** Security configuration fields */
  securityFields: string[];
  /** Performance tuning fields */
  performanceFields: string[];
  /** Custom options */
  customFields: FormField[];
}

// =============================================================================
// FORM HOOK INTEGRATION TYPES
// =============================================================================

/**
 * Enhanced form hook return type
 * Extends React Hook Form with additional functionality
 */
export interface EnhancedFormReturn<T extends FieldValues = FieldValues>
  extends UseFormReturn<T> {
  /** Form configuration */
  config: FormConfig<T>;
  /** Form state helpers */
  state: FormStateHelpers<T>;
  /** Field management helpers */
  fields: FieldHelpers<T>;
  /** Validation helpers */
  validation: ValidationHelpers<T>;
  /** Submission helpers */
  submission: SubmissionHelpers<T>;
  /** Performance monitoring */
  performance: PerformanceHelpers;
}

/**
 * Form state helpers
 */
export interface FormStateHelpers<T extends FieldValues> {
  /** Check if form has any errors */
  hasErrors: () => boolean;
  /** Get all field values */
  getAllValues: () => T;
  /** Reset form to initial state */
  resetForm: () => void;
  /** Clear all errors */
  clearErrors: () => void;
  /** Check if form is ready for submission */
  isSubmittable: () => boolean;
}

/**
 * Field management helpers
 */
export interface FieldHelpers<T extends FieldValues> {
  /** Get field configuration */
  getFieldConfig: (name: FieldPath<T>) => FormField | undefined;
  /** Set field value with validation */
  setFieldValue: (name: FieldPath<T>, value: PathValue<T, FieldPath<T>>) => void;
  /** Get field error */
  getFieldError: (name: FieldPath<T>) => FieldError | undefined;
  /** Clear field error */
  clearFieldError: (name: FieldPath<T>) => void;
  /** Focus field */
  focusField: (name: FieldPath<T>) => void;
  /** Check field visibility */
  isFieldVisible: (name: FieldPath<T>) => boolean;
}

/**
 * Validation helpers
 */
export interface ValidationHelpers<T extends FieldValues> {
  /** Validate specific field */
  validateField: (name: FieldPath<T>) => Promise<boolean>;
  /** Validate form */
  validateForm: () => Promise<boolean>;
  /** Get validation errors */
  getValidationErrors: () => FieldErrors<T>;
  /** Check if validation is in progress */
  isValidating: () => boolean;
}

/**
 * Submission helpers
 */
export interface SubmissionHelpers<T extends FieldValues> {
  /** Submit form with validation */
  submitForm: () => Promise<void>;
  /** Submit form without validation */
  submitFormUnsafe: () => Promise<void>;
  /** Check submission state */
  isSubmitting: () => boolean;
  /** Get submission errors */
  getSubmissionErrors: () => any;
}

/**
 * Performance monitoring helpers
 */
export interface PerformanceHelpers {
  /** Get validation performance metrics */
  getValidationMetrics: () => ValidationMetrics;
  /** Get render performance metrics */
  getRenderMetrics: () => RenderMetrics;
  /** Reset performance metrics */
  resetMetrics: () => void;
}

/**
 * Validation performance metrics
 */
export interface ValidationMetrics {
  /** Average validation time in milliseconds */
  averageValidationTime: number;
  /** Maximum validation time */
  maxValidationTime: number;
  /** Total validation count */
  validationCount: number;
  /** Failed validation count */
  failedValidationCount: number;
  /** Real-time validation compliance (< 100ms) */
  realtimeCompliance: number;
}

/**
 * Render performance metrics
 */
export interface RenderMetrics {
  /** Total render count */
  renderCount: number;
  /** Average render time */
  averageRenderTime: number;
  /** Re-render triggers */
  rerenderTriggers: string[];
  /** Performance score (0-100) */
  performanceScore: number;
}

// =============================================================================
// EXPORT TYPES FOR LIBRARY INTEGRATION
// =============================================================================

/**
 * Main form configuration export
 * Primary interface for form creation and management
 */
export type {
  FormConfig as UseFormConfig,
  FormField as FormFieldDefinition,
  FormState as FormStateType,
  EnhancedFormReturn as FormHook,
  DynamicFormSchema as FormSchema,
  DatabaseConnectionFormSchema as DatabaseFormSchema,
};

/**
 * Validation-specific exports
 */
export type {
  FieldValidationConfig as FieldValidation,
  FormValidationSchema as FormValidation,
  ValidationHelpers as FormValidationHelpers,
  RealtimeValidationConfig as RealtimeValidation,
};

/**
 * Conditional logic exports
 */
export type {
  ConditionalLogic as FieldConditionalLogic,
  FieldCondition as ConditionalRule,
  ComparisonOperator as ConditionalOperator,
  ConditionalAction as ConditionalActionType,
};

/**
 * Accessibility exports
 */
export type {
  FormAccessibilityConfig as FormAccessibility,
  FieldAccessibilityConfig as FieldAccessibility,
  ErrorAccessibilityConfig as ErrorAccessibility,
};