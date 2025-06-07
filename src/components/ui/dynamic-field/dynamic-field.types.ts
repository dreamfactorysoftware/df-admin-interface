/**
 * TypeScript type definitions for React Dynamic Field Component
 * 
 * Comprehensive type definitions for a flexible, reusable field component that supports
 * multiple input types, React Hook Form integration, Zod validation, accessibility compliance,
 * and dynamic configuration based on database schema requirements.
 * 
 * Supports all DreamFactory service configuration field types including database connections,
 * API generation configurations, and admin settings with full type safety.
 */

import { ReactNode, ComponentType, InputHTMLAttributes, TextareaHTMLAttributes, SelectHTMLAttributes } from 'react';
import { Control, FieldValues, RegisterOptions, UseFormRegister, FieldError } from 'react-hook-form';
import { z } from 'zod';
import { BaseComponent, SelectOption, ComponentVariant, ComponentSize } from '@/types/ui';
import { SchemaField, FieldValidation } from '@/types/schema';

// ============================================================================
// FIELD TYPE DEFINITIONS
// ============================================================================

/**
 * Supported dynamic field types for all DreamFactory configurations
 * Covers database connections, API generation, security settings, and admin configurations
 */
export type DynamicFieldType = 
  | 'string'              // Text input for names, labels, URLs
  | 'integer'             // Numeric input for ports, timeouts, counts
  | 'password'            // Password input with masking
  | 'text'                // Textarea for descriptions, scripts, JSON
  | 'boolean'             // Checkbox/toggle for enable/disable flags
  | 'picklist'            // Single select dropdown
  | 'multi_picklist'      // Multiple select dropdown
  | 'file_certificate'    // File upload for SSL certificates
  | 'file_certificate_api' // File upload with API validation
  | 'event_picklist';     // Autocomplete select with dynamic options

/**
 * Field value types corresponding to each field type
 * Ensures type safety when handling field values in forms
 */
export type DynamicFieldValue<T extends DynamicFieldType = DynamicFieldType> = 
  T extends 'string' ? string :
  T extends 'integer' ? number :
  T extends 'password' ? string :
  T extends 'text' ? string :
  T extends 'boolean' ? boolean :
  T extends 'picklist' ? string :
  T extends 'multi_picklist' ? string[] :
  T extends 'file_certificate' ? File | string | null :
  T extends 'file_certificate_api' ? File | string | null :
  T extends 'event_picklist' ? string :
  unknown;

/**
 * Union type for all possible field values
 */
export type AnyFieldValue = DynamicFieldValue<DynamicFieldType>;

// ============================================================================
// FIELD CONFIGURATION TYPES
// ============================================================================

/**
 * Base field configuration interface
 * Provides common properties for all field types
 */
export interface BaseFieldConfig {
  /** Unique field identifier */
  name: string;
  
  /** Field type determining input component and validation */
  type: DynamicFieldType;
  
  /** Human-readable field label */
  label: string;
  
  /** Optional field description for help text */
  description?: string;
  
  /** Placeholder text for input fields */
  placeholder?: string;
  
  /** Whether the field is required */
  required?: boolean;
  
  /** Whether the field is disabled */
  disabled?: boolean;
  
  /** Whether the field is read-only */
  readonly?: boolean;
  
  /** Whether the field is hidden */
  hidden?: boolean;
  
  /** Default value for the field */
  defaultValue?: AnyFieldValue;
  
  /** Field validation rules */
  validation?: FieldValidationConfig;
  
  /** Conditional logic for showing/hiding field */
  conditional?: ConditionalConfig;
  
  /** Field help text for accessibility */
  helpText?: string;
  
  /** Additional CSS classes */
  className?: string;
  
  /** Test identifier for testing */
  'data-testid'?: string;
}

/**
 * String field specific configuration
 */
export interface StringFieldConfig extends BaseFieldConfig {
  type: 'string';
  defaultValue?: string;
  
  /** Input mask for formatted input */
  mask?: string;
  
  /** Text transformation */
  transform?: TextTransform;
  
  /** Input mode for mobile keyboards */
  inputMode?: 'text' | 'email' | 'url' | 'tel' | 'search';
  
  /** Auto-complete attribute */
  autoComplete?: string;
  
  /** Spell check */
  spellCheck?: boolean;
  
  /** Maximum length */
  maxLength?: number;
  
  /** Minimum length */
  minLength?: number;
}

/**
 * Integer field specific configuration
 */
export interface IntegerFieldConfig extends BaseFieldConfig {
  type: 'integer';
  defaultValue?: number;
  
  /** Minimum value */
  min?: number;
  
  /** Maximum value */
  max?: number;
  
  /** Step increment */
  step?: number;
  
  /** Number formatting options */
  formatting?: NumberFormatting;
  
  /** Show spinner controls */
  showSpinner?: boolean;
}

/**
 * Password field specific configuration
 */
export interface PasswordFieldConfig extends BaseFieldConfig {
  type: 'password';
  defaultValue?: string;
  
  /** Show/hide password toggle */
  showToggle?: boolean;
  
  /** Password strength indicator */
  showStrength?: boolean;
  
  /** Password requirements */
  requirements?: PasswordRequirements;
  
  /** Auto-generate password option */
  allowGenerate?: boolean;
}

/**
 * Text field (textarea) specific configuration
 */
export interface TextFieldConfig extends BaseFieldConfig {
  type: 'text';
  defaultValue?: string;
  
  /** Number of visible rows */
  rows?: number;
  
  /** Resize behavior */
  resize?: 'none' | 'both' | 'horizontal' | 'vertical';
  
  /** Syntax highlighting for code */
  syntax?: CodeSyntax;
  
  /** Auto-expand to content */
  autoExpand?: boolean;
  
  /** Rich text editor */
  richText?: boolean;
}

/**
 * Boolean field specific configuration
 */
export interface BooleanFieldConfig extends BaseFieldConfig {
  type: 'boolean';
  defaultValue?: boolean;
  
  /** Display style */
  variant?: 'checkbox' | 'switch' | 'toggle';
  
  /** Label position */
  labelPosition?: 'left' | 'right' | 'top' | 'bottom';
  
  /** True/false labels */
  labels?: {
    true: string;
    false: string;
  };
}

/**
 * Picklist (single select) field specific configuration
 */
export interface PicklistFieldConfig extends BaseFieldConfig {
  type: 'picklist';
  defaultValue?: string;
  
  /** Available options */
  options: SelectOption[];
  
  /** Allow custom values */
  allowCustom?: boolean;
  
  /** Search functionality */
  searchable?: boolean;
  
  /** Clear selection option */
  clearable?: boolean;
  
  /** Option groups */
  grouped?: boolean;
  
  /** Remote data source */
  remote?: RemoteDataConfig;
}

/**
 * Multi-picklist (multiple select) field specific configuration
 */
export interface MultiPicklistFieldConfig extends BaseFieldConfig {
  type: 'multi_picklist';
  defaultValue?: string[];
  
  /** Available options */
  options: SelectOption[];
  
  /** Maximum selections */
  maxSelections?: number;
  
  /** Search functionality */
  searchable?: boolean;
  
  /** Tag display style */
  tagStyle?: 'chips' | 'badges' | 'list';
  
  /** Allow custom values */
  allowCustom?: boolean;
  
  /** Remote data source */
  remote?: RemoteDataConfig;
}

/**
 * File certificate field specific configuration
 */
export interface FileCertificateFieldConfig extends BaseFieldConfig {
  type: 'file_certificate';
  defaultValue?: File | string | null;
  
  /** Accepted file types */
  accept?: string;
  
  /** Maximum file size in bytes */
  maxSize?: number;
  
  /** File validation */
  fileValidation?: FileValidationConfig;
  
  /** Upload progress display */
  showProgress?: boolean;
  
  /** Preview functionality */
  allowPreview?: boolean;
  
  /** Drag and drop */
  dragDrop?: boolean;
}

/**
 * File certificate API field specific configuration
 */
export interface FileCertificateApiFieldConfig extends BaseFieldConfig {
  type: 'file_certificate_api';
  defaultValue?: File | string | null;
  
  /** API validation endpoint */
  validationEndpoint?: string;
  
  /** Accepted file types */
  accept?: string;
  
  /** Maximum file size in bytes */
  maxSize?: number;
  
  /** File validation */
  fileValidation?: FileValidationConfig;
  
  /** Upload progress display */
  showProgress?: boolean;
  
  /** Real-time validation */
  realtimeValidation?: boolean;
  
  /** Certificate parsing */
  parseCertificate?: boolean;
}

/**
 * Event picklist field specific configuration
 */
export interface EventPicklistFieldConfig extends BaseFieldConfig {
  type: 'event_picklist';
  defaultValue?: string;
  
  /** Event data source configuration */
  eventSource: EventSourceConfig;
  
  /** Search functionality */
  searchable?: boolean;
  
  /** Minimum characters to trigger search */
  minSearchLength?: number;
  
  /** Search debounce delay */
  searchDelay?: number;
  
  /** Custom option renderer */
  optionRenderer?: ComponentType<{ option: EventOption }>;
  
  /** Group events by category */
  groupBy?: string;
  
  /** Filter configuration */
  filters?: EventFilter[];
}

/**
 * Union type for all field configurations
 */
export type FieldConfig = 
  | StringFieldConfig
  | IntegerFieldConfig
  | PasswordFieldConfig
  | TextFieldConfig
  | BooleanFieldConfig
  | PicklistFieldConfig
  | MultiPicklistFieldConfig
  | FileCertificateFieldConfig
  | FileCertificateApiFieldConfig
  | EventPicklistFieldConfig;

// ============================================================================
// COMPONENT PROPS INTERFACES
// ============================================================================

/**
 * Base dynamic field component props
 * Supports both controlled and uncontrolled modes
 */
export interface BaseDynamicFieldProps extends BaseComponent {
  /** Field configuration */
  config: FieldConfig;
  
  /** Field value (controlled mode) */
  value?: AnyFieldValue;
  
  /** Change handler (controlled mode) */
  onChange?: (value: AnyFieldValue) => void;
  
  /** Blur handler */
  onBlur?: (event: React.FocusEvent) => void;
  
  /** Focus handler */
  onFocus?: (event: React.FocusEvent) => void;
  
  /** Error state */
  error?: string | FieldError;
  
  /** Component size */
  size?: ComponentSize;
  
  /** Component variant */
  variant?: ComponentVariant;
  
  /** Full width */
  fullWidth?: boolean;
}

/**
 * React Hook Form integration props
 */
export interface ReactHookFormProps<T extends FieldValues = FieldValues> {
  /** React Hook Form control object */
  control?: Control<T>;
  
  /** React Hook Form register function */
  register?: UseFormRegister<T>;
  
  /** Field registration options */
  registerOptions?: RegisterOptions<T>;
  
  /** Form field name */
  name?: string;
}

/**
 * Accessibility props for WCAG 2.1 AA compliance
 */
export interface AccessibilityProps {
  /** ARIA label */
  'aria-label'?: string;
  
  /** ARIA described by */
  'aria-describedby'?: string;
  
  /** ARIA labelled by */
  'aria-labelledby'?: string;
  
  /** ARIA required */
  'aria-required'?: boolean;
  
  /** ARIA invalid */
  'aria-invalid'?: boolean;
  
  /** ARIA expanded (for select fields) */
  'aria-expanded'?: boolean;
  
  /** ARIA owns (for select fields) */
  'aria-owns'?: string;
  
  /** ARIA activedescendant (for select fields) */
  'aria-activedescendant'?: string;
  
  /** Tab index */
  tabIndex?: number;
  
  /** Role */
  role?: string;
}

/**
 * Complete dynamic field component props
 */
export interface DynamicFieldProps<T extends FieldValues = FieldValues> 
  extends BaseDynamicFieldProps, ReactHookFormProps<T>, AccessibilityProps {
  
  /** Theme configuration */
  theme?: FieldThemeConfig;
  
  /** Custom components */
  components?: CustomComponentOverrides;
  
  /** Event handlers */
  onValidate?: (value: AnyFieldValue) => string | undefined;
  
  /** Custom validation */
  customValidation?: (value: AnyFieldValue) => boolean | string;
  
  /** Loading state */
  loading?: boolean;
  
  /** Debug mode */
  debug?: boolean;
}

// ============================================================================
// SUPPORTING TYPE DEFINITIONS
// ============================================================================

/**
 * Text transformation options
 */
export type TextTransform = 
  | 'none'
  | 'uppercase'
  | 'lowercase'
  | 'capitalize'
  | 'titlecase';

/**
 * Number formatting configuration
 */
export interface NumberFormatting {
  /** Locale for formatting */
  locale?: string;
  
  /** Use thousand separators */
  useGrouping?: boolean;
  
  /** Minimum fraction digits */
  minimumFractionDigits?: number;
  
  /** Maximum fraction digits */
  maximumFractionDigits?: number;
  
  /** Currency formatting */
  currency?: string;
  
  /** Percentage formatting */
  percentage?: boolean;
}

/**
 * Password requirements configuration
 */
export interface PasswordRequirements {
  /** Minimum length */
  minLength?: number;
  
  /** Require uppercase */
  requireUppercase?: boolean;
  
  /** Require lowercase */
  requireLowercase?: boolean;
  
  /** Require numbers */
  requireNumbers?: boolean;
  
  /** Require special characters */
  requireSpecial?: boolean;
  
  /** Forbidden patterns */
  forbiddenPatterns?: string[];
  
  /** Custom validation function */
  customValidator?: (password: string) => string | undefined;
}

/**
 * Code syntax highlighting options
 */
export type CodeSyntax = 
  | 'javascript'
  | 'typescript'
  | 'json'
  | 'sql'
  | 'php'
  | 'python'
  | 'xml'
  | 'yaml'
  | 'markdown'
  | 'text';

/**
 * Remote data configuration for select fields
 */
export interface RemoteDataConfig {
  /** API endpoint URL */
  url: string;
  
  /** HTTP method */
  method?: 'GET' | 'POST';
  
  /** Request headers */
  headers?: Record<string, string>;
  
  /** Request body (for POST) */
  body?: any;
  
  /** Response data path */
  dataPath?: string;
  
  /** Option value path */
  valuePath?: string;
  
  /** Option label path */
  labelPath?: string;
  
  /** Search parameter name */
  searchParam?: string;
  
  /** Cache duration in seconds */
  cacheDuration?: number;
}

/**
 * File validation configuration
 */
export interface FileValidationConfig {
  /** Allowed MIME types */
  allowedTypes?: string[];
  
  /** Maximum file size in bytes */
  maxSize?: number;
  
  /** Minimum file size in bytes */
  minSize?: number;
  
  /** Custom validation function */
  customValidator?: (file: File) => string | undefined;
  
  /** Virus scanning */
  virusScan?: boolean;
  
  /** Image validation (for image files) */
  imageValidation?: {
    maxWidth?: number;
    maxHeight?: number;
    minWidth?: number;
    minHeight?: number;
    aspectRatio?: number;
  };
}

/**
 * Event source configuration
 */
export interface EventSourceConfig {
  /** Service name */
  serviceName?: string;
  
  /** Table name */
  tableName?: string;
  
  /** API endpoint */
  endpoint?: string;
  
  /** Filter parameters */
  filters?: Record<string, any>;
  
  /** Search fields */
  searchFields?: string[];
  
  /** Sort configuration */
  sort?: {
    field: string;
    direction: 'asc' | 'desc';
  };
  
  /** Pagination */
  pagination?: {
    limit: number;
    offset?: number;
  };
}

/**
 * Event option interface
 */
export interface EventOption extends SelectOption {
  /** Event category */
  category?: string;
  
  /** Event type */
  eventType?: string;
  
  /** Event metadata */
  metadata?: Record<string, any>;
  
  /** Event parameters */
  parameters?: Array<{
    name: string;
    type: string;
    required: boolean;
  }>;
}

/**
 * Event filter configuration
 */
export interface EventFilter {
  /** Filter field */
  field: string;
  
  /** Filter operator */
  operator: 'equals' | 'contains' | 'startsWith' | 'in';
  
  /** Filter value */
  value: any;
  
  /** Filter label */
  label?: string;
}

/**
 * Field validation configuration
 */
export interface FieldValidationConfig extends FieldValidation {
  /** Async validation function */
  asyncValidator?: (value: AnyFieldValue) => Promise<string | undefined>;
  
  /** Cross-field validation */
  dependsOn?: string[];
  
  /** Validation trigger */
  trigger?: 'change' | 'blur' | 'submit';
  
  /** Debounce delay for async validation */
  debounce?: number;
}

/**
 * Conditional logic configuration
 */
export interface ConditionalConfig {
  /** Conditions to evaluate */
  conditions: Array<{
    /** Field to check */
    field: string;
    
    /** Comparison operator */
    operator: 'equals' | 'notEquals' | 'contains' | 'isEmpty' | 'isNotEmpty';
    
    /** Value to compare against */
    value: any;
  }>;
  
  /** Logic operator */
  logic?: 'AND' | 'OR';
  
  /** Action to take when conditions are met */
  action: 'show' | 'hide' | 'enable' | 'disable' | 'require';
  
  /** Animation settings */
  animation?: {
    duration: number;
    easing: string;
  };
}

/**
 * Field theme configuration
 */
export interface FieldThemeConfig {
  /** Primary color */
  primaryColor?: string;
  
  /** Error color */
  errorColor?: string;
  
  /** Success color */
  successColor?: string;
  
  /** Border radius */
  borderRadius?: string;
  
  /** Focus ring configuration */
  focusRing?: {
    color: string;
    width: string;
    offset: string;
  };
  
  /** Custom CSS variables */
  cssVariables?: Record<string, string>;
}

/**
 * Custom component overrides
 */
export interface CustomComponentOverrides {
  /** Custom input component */
  Input?: ComponentType<any>;
  
  /** Custom textarea component */
  Textarea?: ComponentType<any>;
  
  /** Custom select component */
  Select?: ComponentType<any>;
  
  /** Custom checkbox component */
  Checkbox?: ComponentType<any>;
  
  /** Custom file upload component */
  FileUpload?: ComponentType<any>;
  
  /** Custom label component */
  Label?: ComponentType<any>;
  
  /** Custom error message component */
  ErrorMessage?: ComponentType<any>;
  
  /** Custom help text component */
  HelpText?: ComponentType<any>;
}

// ============================================================================
// SCHEMA INTEGRATION TYPES
// ============================================================================

/**
 * Configuration schema interface for backward compatibility
 * Maintains compatibility with existing DreamFactory service definitions
 */
export interface ConfigSchema {
  /** Schema version */
  version: string;
  
  /** Schema title */
  title: string;
  
  /** Schema description */
  description?: string;
  
  /** Field definitions */
  fields: FieldConfig[];
  
  /** Field groups */
  groups?: Array<{
    id: string;
    title: string;
    description?: string;
    fields: string[];
    collapsible?: boolean;
    defaultExpanded?: boolean;
  }>;
  
  /** Form layout */
  layout?: {
    type: 'single' | 'two-column' | 'grid';
    spacing?: ComponentSize;
    responsive?: boolean;
  };
  
  /** Validation schema */
  validation?: z.ZodSchema;
  
  /** Default values */
  defaults?: Record<string, AnyFieldValue>;
  
  /** Metadata */
  metadata?: Record<string, any>;
}

/**
 * Schema field mapping for database schema integration
 */
export interface SchemaFieldMapping {
  /** Original schema field */
  schemaField: SchemaField;
  
  /** Dynamic field configuration */
  fieldConfig: FieldConfig;
  
  /** Mapping rules */
  mappingRules: {
    /** Type conversion rules */
    typeMapping: Record<string, DynamicFieldType>;
    
    /** Default value conversion */
    defaultValueMapping?: (value: any) => AnyFieldValue;
    
    /** Validation mapping */
    validationMapping?: (validation: FieldValidation) => FieldValidationConfig;
  };
}

// ============================================================================
// ZOD VALIDATION SCHEMAS
// ============================================================================

/**
 * Zod schema for field validation configuration
 */
export const FieldValidationConfigSchema = z.object({
  required: z.boolean().optional(),
  minLength: z.number().min(0).optional(),
  maxLength: z.number().min(1).optional(),
  pattern: z.string().optional(),
  min: z.number().optional(),
  max: z.number().optional(),
  enum: z.array(z.string()).optional(),
  format: z.string().optional(),
  customValidator: z.string().optional(),
  messages: z.object({
    required: z.string().optional(),
    minLength: z.string().optional(),
    maxLength: z.string().optional(),
    pattern: z.string().optional(),
    min: z.string().optional(),
    max: z.string().optional(),
    format: z.string().optional(),
    custom: z.string().optional(),
  }).optional(),
  validateOnChange: z.boolean().optional(),
  validateOnBlur: z.boolean().optional(),
  debounceMs: z.number().min(0).optional(),
  asyncValidator: z.function().optional(),
  dependsOn: z.array(z.string()).optional(),
  trigger: z.enum(['change', 'blur', 'submit']).optional(),
  debounce: z.number().min(0).optional(),
});

/**
 * Zod schema for base field configuration
 */
export const BaseFieldConfigSchema = z.object({
  name: z.string().min(1),
  type: z.enum(['string', 'integer', 'password', 'text', 'boolean', 'picklist', 'multi_picklist', 'file_certificate', 'file_certificate_api', 'event_picklist']),
  label: z.string().min(1),
  description: z.string().optional(),
  placeholder: z.string().optional(),
  required: z.boolean().optional(),
  disabled: z.boolean().optional(),
  readonly: z.boolean().optional(),
  hidden: z.boolean().optional(),
  defaultValue: z.any().optional(),
  validation: FieldValidationConfigSchema.optional(),
  conditional: z.object({
    conditions: z.array(z.object({
      field: z.string(),
      operator: z.enum(['equals', 'notEquals', 'contains', 'isEmpty', 'isNotEmpty']),
      value: z.any(),
    })),
    logic: z.enum(['AND', 'OR']).optional(),
    action: z.enum(['show', 'hide', 'enable', 'disable', 'require']),
    animation: z.object({
      duration: z.number(),
      easing: z.string(),
    }).optional(),
  }).optional(),
  helpText: z.string().optional(),
  className: z.string().optional(),
  'data-testid': z.string().optional(),
});

/**
 * Zod schema for complete configuration schema
 */
export const ConfigSchemaSchema = z.object({
  version: z.string(),
  title: z.string().min(1),
  description: z.string().optional(),
  fields: z.array(z.any()), // Will be refined based on specific field types
  groups: z.array(z.object({
    id: z.string(),
    title: z.string(),
    description: z.string().optional(),
    fields: z.array(z.string()),
    collapsible: z.boolean().optional(),
    defaultExpanded: z.boolean().optional(),
  })).optional(),
  layout: z.object({
    type: z.enum(['single', 'two-column', 'grid']),
    spacing: z.enum(['xs', 'sm', 'md', 'lg', 'xl']).optional(),
    responsive: z.boolean().optional(),
  }).optional(),
  validation: z.any().optional(), // ZodSchema
  defaults: z.record(z.any()).optional(),
  metadata: z.record(z.any()).optional(),
});

// ============================================================================
// UTILITY TYPES
// ============================================================================

/**
 * Extract field configuration by type
 */
export type ExtractFieldConfig<T extends DynamicFieldType> = 
  T extends 'string' ? StringFieldConfig :
  T extends 'integer' ? IntegerFieldConfig :
  T extends 'password' ? PasswordFieldConfig :
  T extends 'text' ? TextFieldConfig :
  T extends 'boolean' ? BooleanFieldConfig :
  T extends 'picklist' ? PicklistFieldConfig :
  T extends 'multi_picklist' ? MultiPicklistFieldConfig :
  T extends 'file_certificate' ? FileCertificateFieldConfig :
  T extends 'file_certificate_api' ? FileCertificateApiFieldConfig :
  T extends 'event_picklist' ? EventPicklistFieldConfig :
  never;

/**
 * Type-safe field value getter
 */
export type FieldValueGetter<T extends DynamicFieldType> = (config: ExtractFieldConfig<T>) => DynamicFieldValue<T>;

/**
 * Type-safe field value setter
 */
export type FieldValueSetter<T extends DynamicFieldType> = (
  config: ExtractFieldConfig<T>, 
  value: DynamicFieldValue<T>
) => void;

/**
 * Field change event type
 */
export interface FieldChangeEvent<T extends DynamicFieldType = DynamicFieldType> {
  /** Field name */
  name: string;
  
  /** Field type */
  type: T;
  
  /** New value */
  value: DynamicFieldValue<T>;
  
  /** Previous value */
  previousValue?: DynamicFieldValue<T>;
  
  /** Validation result */
  isValid: boolean;
  
  /** Validation error */
  error?: string;
}

/**
 * Type guard to check field type
 */
export const isFieldType = <T extends DynamicFieldType>(
  config: FieldConfig,
  type: T
): config is ExtractFieldConfig<T> => {
  return config.type === type;
};

/**
 * Type guard to check if field supports multiple values
 */
export const isMultiValueField = (type: DynamicFieldType): boolean => {
  return type === 'multi_picklist';
};

/**
 * Type guard to check if field supports file upload
 */
export const isFileField = (type: DynamicFieldType): boolean => {
  return type === 'file_certificate' || type === 'file_certificate_api';
};

/**
 * Type guard to check if field supports remote data
 */
export const isRemoteField = (type: DynamicFieldType): boolean => {
  return type === 'picklist' || type === 'multi_picklist' || type === 'event_picklist';
};

// ============================================================================
// EXPORT TYPES
// ============================================================================

export type {
  // Main interfaces
  DynamicFieldProps,
  FieldConfig,
  ConfigSchema,
  
  // Field configurations
  StringFieldConfig,
  IntegerFieldConfig,
  PasswordFieldConfig,
  TextFieldConfig,
  BooleanFieldConfig,
  PicklistFieldConfig,
  MultiPicklistFieldConfig,
  FileCertificateFieldConfig,
  FileCertificateApiFieldConfig,
  EventPicklistFieldConfig,
  
  // Supporting types
  FieldValidationConfig,
  ConditionalConfig,
  EventSourceConfig,
  EventOption,
  RemoteDataConfig,
  FileValidationConfig,
  
  // React Hook Form integration
  ReactHookFormProps,
  AccessibilityProps,
  
  // Utility types
  ExtractFieldConfig,
  FieldChangeEvent,
  FieldValueGetter,
  FieldValueSetter,
};