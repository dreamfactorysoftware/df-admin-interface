/**
 * TypeScript type definitions for the React Dynamic Field Component
 * 
 * This file provides comprehensive type definitions for the dynamic field component
 * that replaced Angular Input decorators with React Hook Form integration.
 * Supports all DreamFactory service configuration field types with Zod validation.
 * 
 * @fileoverview Dynamic field types supporting React Hook Form + Zod validation
 * @version 1.0.0
 * @since React 19/Next.js 15.1 migration
 */

import type { ReactNode, ComponentType, HTMLAttributes, AriaAttributes } from 'react';
import type { 
  UseFormRegister,
  FieldPath,
  FieldValues,
  Control,
  FieldError,
  RegisterOptions,
  ControllerProps 
} from 'react-hook-form';
import type { ZodSchema, ZodType } from 'zod';
import type { VariantProps } from 'class-variance-authority';

// ============================================================================
// Field Type Definitions
// ============================================================================

/**
 * Supported dynamic field types for DreamFactory service configuration
 * Migrated from Angular service types to React component types
 */
export type DynamicFieldType = 
  | 'string'              // Basic text input
  | 'integer'             // Numeric input with integer validation
  | 'password'            // Password input with masking
  | 'text'                // Textarea for longer content
  | 'boolean'             // Checkbox or toggle switch
  | 'picklist'            // Single select dropdown
  | 'multi_picklist'      // Multi-select dropdown
  | 'file_certificate'    // File upload for certificates
  | 'file_certificate_api' // API-based certificate handling
  | 'event_picklist';     // Autocomplete with event filtering

/**
 * Field value types supporting all variations of input data
 * Handles strings, numbers, booleans, files, and arrays
 */
export type DynamicFieldValue = 
  | string
  | number
  | boolean
  | File
  | File[]
  | string[]
  | null
  | undefined;

/**
 * File upload value types for certificate handling
 * Supports both File objects and file path strings
 */
export type FileValue = File | string | null;
export type MultiFileValue = File[] | string[] | null;

// ============================================================================
// Component Props Interfaces
// ============================================================================

/**
 * Base interface for dynamic field component props
 * Includes accessibility attributes and ARIA support
 */
export interface DynamicFieldBaseProps extends AriaAttributes {
  // Core field identification
  name: string;
  type: DynamicFieldType;
  
  // Display properties
  label?: string;
  placeholder?: string;
  description?: string;
  helpText?: string;
  
  // Validation and state
  required?: boolean;
  disabled?: boolean;
  readonly?: boolean;
  loading?: boolean;
  
  // Accessibility support
  'aria-label'?: string;
  'aria-describedby'?: string;
  'aria-invalid'?: boolean;
  'aria-required'?: boolean;
  
  // Styling and theme
  className?: string;
  variant?: ComponentVariant;
  size?: ComponentSize;
  
  // Test support
  'data-testid'?: string;
}

/**
 * React Hook Form compatible field registration props
 * Supports both controlled and uncontrolled component modes
 */
export interface DynamicFieldFormProps<TFieldValues extends FieldValues = FieldValues> {
  // React Hook Form integration
  control?: Control<TFieldValues>;
  register?: UseFormRegister<TFieldValues>;
  name: FieldPath<TFieldValues>;
  rules?: RegisterOptions<TFieldValues>;
  
  // Field state
  error?: FieldError;
  isDirty?: boolean;
  isTouched?: boolean;
  isValidating?: boolean;
  
  // Value handling for controlled mode
  value?: DynamicFieldValue;
  defaultValue?: DynamicFieldValue;
  onChange?: (value: DynamicFieldValue) => void;
  onBlur?: () => void;
}

/**
 * Configuration schema interface maintaining backward compatibility
 * with existing service definitions
 */
export interface ConfigSchema {
  // Field metadata
  name: string;
  type: DynamicFieldType;
  label?: string;
  description?: string;
  
  // Validation rules
  required?: boolean;
  validation?: FieldValidationSchema;
  
  // Field-specific configuration
  options?: SelectOption[];
  multiple?: boolean;
  searchable?: boolean;
  
  // File upload specific
  accept?: string;
  maxSize?: number;
  maxFiles?: number;
  
  // Event autocomplete specific
  eventSource?: string;
  filterProperty?: string;
  displayProperty?: string;
  
  // Layout and styling
  grid?: GridConfig;
  conditional?: ConditionalConfig;
  formatting?: FieldFormatting;
}

// ============================================================================
// Field-Specific Props
// ============================================================================

/**
 * Text input field props (string, password types)
 */
export interface TextFieldProps extends DynamicFieldBaseProps {
  type: 'string' | 'password';
  minLength?: number;
  maxLength?: number;
  pattern?: string;
  autoComplete?: string;
  autoFocus?: boolean;
}

/**
 * Numeric input field props (integer type)
 */
export interface NumberFieldProps extends DynamicFieldBaseProps {
  type: 'integer';
  min?: number;
  max?: number;
  step?: number;
  precision?: number;
}

/**
 * Textarea field props (text type)
 */
export interface TextAreaFieldProps extends DynamicFieldBaseProps {
  type: 'text';
  rows?: number;
  cols?: number;
  resize?: 'none' | 'both' | 'horizontal' | 'vertical';
  autoResize?: boolean;
}

/**
 * Boolean field props (boolean type)
 */
export interface BooleanFieldProps extends DynamicFieldBaseProps {
  type: 'boolean';
  displayAs?: 'checkbox' | 'switch' | 'toggle';
  checkedLabel?: string;
  uncheckedLabel?: string;
}

/**
 * Select field props (picklist, multi_picklist types)
 */
export interface SelectFieldProps extends DynamicFieldBaseProps {
  type: 'picklist' | 'multi_picklist';
  options: SelectOption[];
  multiple?: boolean;
  searchable?: boolean;
  clearable?: boolean;
  loading?: boolean;
  loadingMessage?: string;
  noOptionsMessage?: string;
  placeholder?: string;
}

/**
 * File upload field props (file_certificate, file_certificate_api types)
 */
export interface FileFieldProps extends DynamicFieldBaseProps {
  type: 'file_certificate' | 'file_certificate_api';
  accept?: string;
  multiple?: boolean;
  maxSize?: number;
  maxFiles?: number;
  showPreview?: boolean;
  allowedExtensions?: string[];
  uploadEndpoint?: string;
  onFileValidation?: (file: File) => Promise<boolean>;
}

/**
 * Event autocomplete field props (event_picklist type)
 */
export interface EventFieldProps extends DynamicFieldBaseProps {
  type: 'event_picklist';
  eventSource: string;
  filterProperty?: string;
  displayProperty?: string;
  searchThreshold?: number;
  debounceMs?: number;
  maxResults?: number;
  onSearch?: (query: string) => Promise<EventOption[]>;
  onSelection?: (option: EventOption) => void;
}

// ============================================================================
// Supporting Type Definitions
// ============================================================================

/**
 * Select option interface for dropdown fields
 */
export interface SelectOption {
  value: string | number;
  label: string;
  description?: string;
  icon?: ComponentType<{ className?: string }>;
  disabled?: boolean;
  group?: string;
  metadata?: Record<string, unknown>;
}

/**
 * Event data structures for autocomplete functionality
 */
export interface EventOption {
  id: string | number;
  label: string;
  value: string;
  description?: string;
  category?: string;
  metadata?: Record<string, unknown>;
  isSelectable?: boolean;
}

/**
 * Event autocomplete response structure
 */
export interface EventSearchResponse {
  options: EventOption[];
  hasMore?: boolean;
  total?: number;
  query?: string;
}

/**
 * Component variant types for styling
 */
export type ComponentVariant = 
  | 'default'
  | 'primary'
  | 'secondary'
  | 'success'
  | 'warning'
  | 'error'
  | 'ghost'
  | 'outline';

/**
 * Component size types
 */
export type ComponentSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl';

// ============================================================================
// Validation Schema Types
// ============================================================================

/**
 * Zod validation schema types for runtime type checking
 */
export interface FieldValidationSchema {
  schema?: ZodType<any>;
  required?: boolean;
  minLength?: number;
  maxLength?: number;
  min?: number;
  max?: number;
  pattern?: RegExp;
  custom?: (value: any) => boolean | string;
  messages?: ValidationMessages;
}

/**
 * Validation error messages
 */
export interface ValidationMessages {
  required?: string;
  minLength?: string;
  maxLength?: string;
  min?: string;
  max?: string;
  pattern?: string;
  custom?: string;
  invalid?: string;
}

// ============================================================================
// Layout and Styling Types
// ============================================================================

/**
 * Grid configuration for responsive layouts
 */
export interface GridConfig {
  xs?: number;
  sm?: number;
  md?: number;
  lg?: number;
  xl?: number;
  offset?: {
    xs?: number;
    sm?: number;
    md?: number;
    lg?: number;
    xl?: number;
  };
}

/**
 * Conditional field logic configuration
 */
export interface ConditionalConfig {
  conditions: FieldCondition[];
  operator: 'AND' | 'OR';
  action: ConditionalAction;
}

/**
 * Field condition for conditional logic
 */
export interface FieldCondition {
  field: string;
  operator: ComparisonOperator;
  value: any;
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
  | 'isEmpty'
  | 'isNotEmpty';

/**
 * Conditional actions
 */
export type ConditionalAction = 
  | 'show'
  | 'hide'
  | 'enable'
  | 'disable'
  | 'require'
  | 'optional';

/**
 * Field formatting options
 */
export interface FieldFormatting {
  mask?: string;
  transform?: TextTransform;
  prefix?: string;
  suffix?: string;
  currency?: CurrencyConfig;
  number?: NumberConfig;
  date?: DateConfig;
}

/**
 * Text transformation options
 */
export type TextTransform = 
  | 'uppercase'
  | 'lowercase'
  | 'capitalize'
  | 'camelCase'
  | 'pascalCase'
  | 'kebabCase'
  | 'snakeCase';

/**
 * Currency formatting configuration
 */
export interface CurrencyConfig {
  currency: string;
  locale?: string;
  minimumFractionDigits?: number;
  maximumFractionDigits?: number;
}

/**
 * Number formatting configuration
 */
export interface NumberConfig {
  locale?: string;
  minimumIntegerDigits?: number;
  minimumFractionDigits?: number;
  maximumFractionDigits?: number;
  useGrouping?: boolean;
}

/**
 * Date formatting configuration
 */
export interface DateConfig {
  format: string;
  locale?: string;
  timezone?: string;
  minDate?: string;
  maxDate?: string;
}

// ============================================================================
// Theme and Accessibility Interfaces
// ============================================================================

/**
 * Theme configuration for dynamic fields
 */
export interface DynamicFieldTheme {
  colors: {
    primary: string;
    secondary: string;
    success: string;
    warning: string;
    error: string;
    background: string;
    surface: string;
    text: string;
    muted: string;
  };
  spacing: {
    xs: string;
    sm: string;
    md: string;
    lg: string;
    xl: string;
  };
  borderRadius: {
    sm: string;
    md: string;
    lg: string;
  };
  typography: {
    fontSize: Record<ComponentSize, string>;
    fontWeight: {
      normal: string;
      medium: string;
      semibold: string;
      bold: string;
    };
  };
}

/**
 * Accessibility configuration
 */
export interface AccessibilityConfig {
  // Screen reader support
  announceChanges?: boolean;
  announceErrors?: boolean;
  
  // Keyboard navigation
  keyboardNavigable?: boolean;
  tabIndex?: number;
  
  // Focus management
  autoFocus?: boolean;
  focusOnError?: boolean;
  
  // ARIA attributes
  role?: string;
  ariaLabel?: string;
  ariaDescribedBy?: string;
  ariaLabelledBy?: string;
  
  // High contrast support
  highContrastMode?: boolean;
  
  // Reduced motion support
  respectReducedMotion?: boolean;
}

// ============================================================================
// Component Union Types
// ============================================================================

/**
 * Union type for all dynamic field props based on type
 */
export type DynamicFieldProps<TFieldValues extends FieldValues = FieldValues> = 
  & DynamicFieldFormProps<TFieldValues>
  & (
    | TextFieldProps
    | NumberFieldProps
    | TextAreaFieldProps
    | BooleanFieldProps
    | SelectFieldProps
    | FileFieldProps
    | EventFieldProps
  );

/**
 * Dynamic field component ref interface
 */
export interface DynamicFieldRef {
  focus: () => void;
  blur: () => void;
  clear: () => void;
  validate: () => Promise<boolean>;
  getValue: () => DynamicFieldValue;
  setValue: (value: DynamicFieldValue) => void;
}

// ============================================================================
// Event Handler Types
// ============================================================================

/**
 * Field event handlers
 */
export interface DynamicFieldEventHandlers {
  onChange?: (value: DynamicFieldValue, name: string) => void;
  onBlur?: (event: FocusEvent, name: string) => void;
  onFocus?: (event: FocusEvent, name: string) => void;
  onKeyDown?: (event: KeyboardEvent, name: string) => void;
  onKeyUp?: (event: KeyboardEvent, name: string) => void;
  onValidation?: (isValid: boolean, errors: string[], name: string) => void;
}

/**
 * File upload event handlers
 */
export interface FileUploadEventHandlers {
  onFileSelect?: (files: File[]) => void;
  onFileRemove?: (file: File | string) => void;
  onFileError?: (error: FileUploadError) => void;
  onUploadProgress?: (progress: number) => void;
  onUploadComplete?: (result: FileUploadResult) => void;
}

/**
 * File upload error structure
 */
export interface FileUploadError {
  code: string;
  message: string;
  file?: File;
  details?: Record<string, unknown>;
}

/**
 * File upload result structure
 */
export interface FileUploadResult {
  success: boolean;
  file: File;
  url?: string;
  metadata?: Record<string, unknown>;
}

// ============================================================================
// Utility Types
// ============================================================================

/**
 * Extract field value type based on field type
 */
export type ExtractFieldValue<T extends DynamicFieldType> = 
  T extends 'string' | 'password' | 'text' ? string :
  T extends 'integer' ? number :
  T extends 'boolean' ? boolean :
  T extends 'picklist' | 'event_picklist' ? string :
  T extends 'multi_picklist' ? string[] :
  T extends 'file_certificate' ? FileValue :
  T extends 'file_certificate_api' ? FileValue :
  never;

/**
 * Make certain properties required
 */
export type RequiredProps<T, K extends keyof T> = T & Required<Pick<T, K>>;

/**
 * Partial configuration for optional field setup
 */
export type PartialConfig<T> = Partial<T> & Pick<T, 'name' | 'type'>;

// ============================================================================
// Default Export Type
// ============================================================================

/**
 * Main dynamic field component type export
 */
export interface DynamicFieldComponent<TFieldValues extends FieldValues = FieldValues> {
  (props: DynamicFieldProps<TFieldValues>): JSX.Element;
  displayName?: string;
}

// Re-export commonly used React Hook Form types for convenience
export type {
  UseFormRegister,
  Control,
  FieldError,
  FieldValues,
  FieldPath,
  RegisterOptions,
  ControllerProps
} from 'react-hook-form';

// Re-export Zod types for validation
export type { ZodSchema, ZodType } from 'zod';