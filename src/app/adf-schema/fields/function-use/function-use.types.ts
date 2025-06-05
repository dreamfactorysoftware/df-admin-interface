/**
 * TypeScript type definitions for database function usage configuration
 * Compatible with React Hook Form and Zod validation for DreamFactory Admin Interface
 * 
 * Defines interfaces for function usage entries, dropdown options, form validation schemas,
 * and component props while maintaining compatibility with DreamFactory function usage API requirements.
 * 
 * @fileoverview Function Usage Type Definitions
 * @version 1.0.0
 * @since 2024-12-19
 */

import { ReactNode, ComponentType } from 'react';
import { z } from 'zod';
import { UseFormReturn, FieldErrors, Control } from 'react-hook-form';

// =============================================================================
// Core Function Usage Interfaces
// =============================================================================

/**
 * Supported database function types that can be applied to fields
 * Extends standard SQL functions with database-specific implementations
 */
export type DatabaseFunctionType =
  | 'aggregate'
  | 'string'
  | 'numeric'
  | 'date'
  | 'logical'
  | 'conversion'
  | 'custom';

/**
 * Database function categories for organizing function selections
 */
export type FunctionCategory =
  | 'math'
  | 'string'
  | 'date'
  | 'aggregate'
  | 'conditional'
  | 'conversion'
  | 'validation'
  | 'utility';

/**
 * Parameter data types supported by database functions
 */
export type FunctionParameterType =
  | 'string'
  | 'number'
  | 'boolean'
  | 'date'
  | 'datetime'
  | 'time'
  | 'json'
  | 'binary'
  | 'any';

/**
 * Function execution context for determining when the function should be applied
 */
export type FunctionExecutionContext =
  | 'pre_process'
  | 'post_process'
  | 'validation'
  | 'transform'
  | 'filter'
  | 'aggregate';

/**
 * Database function definition with metadata and parameter specifications
 */
export interface DatabaseFunction {
  /** Unique identifier for the function */
  id: string;
  /** Display name for the function */
  name: string;
  /** Function category for organization */
  category: FunctionCategory;
  /** Function type classification */
  type: DatabaseFunctionType;
  /** Detailed description of function behavior */
  description: string;
  /** SQL syntax template for the function */
  syntax: string;
  /** Function parameter definitions */
  parameters: FunctionParameter[];
  /** Return type of the function */
  returnType: FunctionParameterType;
  /** Database compatibility matrix */
  supportedDatabases: DatabaseDriver[];
  /** Example usage patterns */
  examples: FunctionExample[];
  /** Whether the function is deprecated */
  deprecated?: boolean;
  /** Alternative function recommendations */
  alternatives?: string[];
  /** Performance characteristics */
  performance?: FunctionPerformance;
}

/**
 * Database driver types supported by the application
 */
export type DatabaseDriver =
  | 'mysql'
  | 'postgresql'
  | 'sqlserver'
  | 'oracle'
  | 'mongodb'
  | 'snowflake'
  | 'sqlite'
  | 'mariadb';

/**
 * Function parameter definition with validation constraints
 */
export interface FunctionParameter {
  /** Parameter name */
  name: string;
  /** Parameter data type */
  type: FunctionParameterType;
  /** Whether the parameter is required */
  required: boolean;
  /** Default value if parameter is optional */
  defaultValue?: any;
  /** Parameter description and usage notes */
  description: string;
  /** Validation constraints for the parameter */
  validation?: ParameterValidation;
  /** Minimum value for numeric parameters */
  min?: number;
  /** Maximum value for numeric parameters */
  max?: number;
  /** Enumerated values for choice parameters */
  options?: string[];
  /** Regular expression pattern for string validation */
  pattern?: string;
}

/**
 * Parameter validation rules and constraints
 */
export interface ParameterValidation {
  /** Minimum length for string parameters */
  minLength?: number;
  /** Maximum length for string parameters */
  maxLength?: number;
  /** Regular expression for pattern validation */
  regex?: string;
  /** Custom validation function reference */
  customValidator?: string;
  /** Error message for validation failures */
  errorMessage?: string;
}

/**
 * Function usage example with sample input and output
 */
export interface FunctionExample {
  /** Example title or use case */
  title: string;
  /** Example description */
  description: string;
  /** Sample input parameters */
  input: Record<string, any>;
  /** Expected output value */
  output: any;
  /** SQL query example */
  sqlExample: string;
}

/**
 * Function performance characteristics and recommendations
 */
export interface FunctionPerformance {
  /** Relative performance rating (1-5) */
  rating: number;
  /** Performance notes and recommendations */
  notes: string;
  /** Optimal use cases */
  optimalFor: string[];
  /** Performance warnings */
  warnings?: string[];
}

// =============================================================================
// Function Usage Configuration
// =============================================================================

/**
 * Function usage entry representing applied function configuration
 */
export interface FunctionUsageEntry {
  /** Unique identifier for the usage entry */
  id: string;
  /** Referenced function definition */
  functionId: string;
  /** Function display name */
  functionName: string;
  /** Target field name where function is applied */
  fieldName: string;
  /** Function execution context */
  context: FunctionExecutionContext;
  /** Parameter values for the function */
  parameters: Record<string, any>;
  /** Whether the function usage is active */
  enabled: boolean;
  /** Function usage priority/order */
  order: number;
  /** Additional configuration options */
  options?: FunctionUsageOptions;
  /** Validation status */
  validation?: ValidationStatus;
  /** Function usage metadata */
  metadata?: FunctionUsageMetadata;
}

/**
 * Additional configuration options for function usage
 */
export interface FunctionUsageOptions {
  /** Error handling strategy */
  errorHandling: 'ignore' | 'skip' | 'fail' | 'default';
  /** Default value on error */
  defaultOnError?: any;
  /** Cache function results */
  cacheResults?: boolean;
  /** Cache duration in seconds */
  cacheDuration?: number;
  /** Debug mode for function execution */
  debug?: boolean;
}

/**
 * Validation status for function usage entry
 */
export interface ValidationStatus {
  /** Whether the configuration is valid */
  isValid: boolean;
  /** Validation error messages */
  errors: string[];
  /** Validation warnings */
  warnings: string[];
  /** Last validation timestamp */
  lastValidated: string;
}

/**
 * Metadata for function usage tracking and auditing
 */
export interface FunctionUsageMetadata {
  /** Creation timestamp */
  createdAt: string;
  /** Last modification timestamp */
  updatedAt: string;
  /** User who created the entry */
  createdBy?: string;
  /** User who last modified the entry */
  updatedBy?: string;
  /** Usage statistics */
  usage?: UsageStatistics;
}

/**
 * Usage statistics for function performance monitoring
 */
export interface UsageStatistics {
  /** Total execution count */
  executionCount: number;
  /** Average execution time in milliseconds */
  averageExecutionTime: number;
  /** Error count */
  errorCount: number;
  /** Last execution timestamp */
  lastExecuted?: string;
}

// =============================================================================
// Dropdown and Selection Options
// =============================================================================

/**
 * Function selection option for dropdown components
 */
export interface FunctionSelectOption {
  /** Function identifier */
  value: string;
  /** Display label */
  label: string;
  /** Function description */
  description: string;
  /** Function category */
  category: FunctionCategory;
  /** Icon component for visual representation */
  icon?: ComponentType<{ className?: string }>;
  /** Whether the option is disabled */
  disabled?: boolean;
  /** Additional metadata */
  metadata?: {
    returnType: FunctionParameterType;
    parameterCount: number;
    supportedDatabases: DatabaseDriver[];
  };
}

/**
 * Function category option for category filtering
 */
export interface CategorySelectOption {
  /** Category identifier */
  value: FunctionCategory;
  /** Display label */
  label: string;
  /** Category description */
  description: string;
  /** Function count in category */
  functionCount: number;
  /** Category color for UI theming */
  color?: string;
}

/**
 * Parameter type option for parameter configuration
 */
export interface ParameterTypeOption {
  /** Parameter type identifier */
  value: FunctionParameterType;
  /** Display label */
  label: string;
  /** Type description */
  description: string;
  /** Default validation rules */
  defaultValidation?: ParameterValidation;
}

/**
 * Execution context option for context selection
 */
export interface ExecutionContextOption {
  /** Context identifier */
  value: FunctionExecutionContext;
  /** Display label */
  label: string;
  /** Context description */
  description: string;
  /** Performance impact indicator */
  performanceImpact: 'low' | 'medium' | 'high';
}

// =============================================================================
// Form Data and Validation Schemas
// =============================================================================

/**
 * Function usage form data structure for React Hook Form
 */
export interface FunctionUsageFormData {
  /** Selected function identifier */
  functionId: string;
  /** Target field name */
  fieldName: string;
  /** Execution context */
  context: FunctionExecutionContext;
  /** Function parameters as key-value pairs */
  parameters: Record<string, any>;
  /** Function usage options */
  options: FunctionUsageOptions;
  /** Whether the function is enabled */
  enabled: boolean;
  /** Function execution order */
  order: number;
}

/**
 * Zod schema for function usage form validation
 * Provides runtime type checking and validation for form submissions
 */
export const functionUsageFormSchema = z.object({
  functionId: z
    .string()
    .min(1, 'Function selection is required')
    .refine((val) => val.length > 0, 'Please select a valid function'),
  
  fieldName: z
    .string()
    .min(1, 'Field name is required')
    .max(255, 'Field name must be less than 255 characters')
    .regex(/^[a-zA-Z_][a-zA-Z0-9_]*$/, 'Field name must be a valid identifier'),
  
  context: z.nativeEnum({
    pre_process: 'pre_process',
    post_process: 'post_process',
    validation: 'validation',
    transform: 'transform',
    filter: 'filter',
    aggregate: 'aggregate'
  } as const),
  
  parameters: z
    .record(z.any())
    .refine((params) => {
      // Custom validation logic for parameters based on function definition
      return Object.keys(params).length >= 0;
    }, 'Invalid parameter configuration'),
  
  options: z.object({
    errorHandling: z.enum(['ignore', 'skip', 'fail', 'default']),
    defaultOnError: z.any().optional(),
    cacheResults: z.boolean().optional(),
    cacheDuration: z.number().min(0).max(86400).optional(), // Max 24 hours
    debug: z.boolean().optional()
  }),
  
  enabled: z.boolean(),
  
  order: z
    .number()
    .int()
    .min(0)
    .max(999)
});

/**
 * Inferred TypeScript type from Zod schema
 */
export type FunctionUsageFormSchema = z.infer<typeof functionUsageFormSchema>;

/**
 * Zod schema for function parameter validation
 */
export const functionParameterSchema = z.object({
  name: z.string().min(1, 'Parameter name is required'),
  value: z.any(),
  type: z.enum(['string', 'number', 'boolean', 'date', 'datetime', 'time', 'json', 'binary', 'any']),
  required: z.boolean(),
  validation: z.object({
    minLength: z.number().optional(),
    maxLength: z.number().optional(),
    regex: z.string().optional(),
    customValidator: z.string().optional(),
    errorMessage: z.string().optional()
  }).optional()
});

/**
 * Validation schema for function search and filtering
 */
export const functionSearchSchema = z.object({
  searchTerm: z.string().optional(),
  category: z.enum(['math', 'string', 'date', 'aggregate', 'conditional', 'conversion', 'validation', 'utility']).optional(),
  supportedDatabase: z.enum(['mysql', 'postgresql', 'sqlserver', 'oracle', 'mongodb', 'snowflake', 'sqlite', 'mariadb']).optional(),
  returnType: z.enum(['string', 'number', 'boolean', 'date', 'datetime', 'time', 'json', 'binary', 'any']).optional()
});

export type FunctionSearchSchema = z.infer<typeof functionSearchSchema>;

// =============================================================================
// Component Props and UI Interfaces
// =============================================================================

/**
 * Base component props following established UI patterns
 */
export interface BaseComponentProps {
  /** Unique component identifier */
  id?: string;
  /** CSS class names */
  className?: string;
  /** Component children */
  children?: ReactNode;
  /** Component variant */
  variant?: ComponentVariant;
  /** Component size */
  size?: ComponentSize;
  /** Disabled state */
  disabled?: boolean;
  /** Loading state */
  loading?: boolean;
  /** Test identifier */
  'data-testid'?: string;
}

/**
 * Component variant types
 */
export type ComponentVariant =
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

/**
 * Function usage form component props
 */
export interface FunctionUsageFormProps extends BaseComponentProps {
  /** Initial form data */
  initialData?: Partial<FunctionUsageFormData>;
  /** Available functions for selection */
  availableFunctions: DatabaseFunction[];
  /** Target field information */
  fieldInfo: {
    name: string;
    type: string;
    nullable: boolean;
  };
  /** Form submission handler */
  onSubmit: (data: FunctionUsageFormData) => Promise<void>;
  /** Form cancellation handler */
  onCancel?: () => void;
  /** Form validation handler */
  onValidate?: (data: Partial<FunctionUsageFormData>) => Promise<ValidationStatus>;
  /** Read-only mode */
  readOnly?: boolean;
  /** Show advanced options */
  showAdvancedOptions?: boolean;
}

/**
 * Function selector component props
 */
export interface FunctionSelectorProps extends BaseComponentProps {
  /** Available functions */
  functions: DatabaseFunction[];
  /** Selected function ID */
  value?: string;
  /** Selection change handler */
  onChange: (functionId: string) => void;
  /** Function search and filtering */
  searchable?: boolean;
  /** Category filtering */
  showCategories?: boolean;
  /** Database compatibility filtering */
  filterByDatabase?: DatabaseDriver;
  /** Placeholder text */
  placeholder?: string;
  /** Error state */
  error?: string;
}

/**
 * Function parameter editor component props
 */
export interface FunctionParameterEditorProps extends BaseComponentProps {
  /** Function definition */
  functionDef: DatabaseFunction;
  /** Current parameter values */
  values: Record<string, any>;
  /** Parameter change handler */
  onChange: (parameters: Record<string, any>) => void;
  /** Parameter validation errors */
  errors?: FieldErrors<Record<string, any>>;
  /** Form control for React Hook Form integration */
  control?: Control<any>;
  /** Show parameter descriptions */
  showDescriptions?: boolean;
}

/**
 * Function usage list component props
 */
export interface FunctionUsageListProps extends BaseComponentProps {
  /** List of function usage entries */
  usageEntries: FunctionUsageEntry[];
  /** Function definitions lookup */
  functionDefinitions: Record<string, DatabaseFunction>;
  /** Entry selection handler */
  onSelectEntry?: (entry: FunctionUsageEntry) => void;
  /** Entry edit handler */
  onEditEntry?: (entry: FunctionUsageEntry) => void;
  /** Entry delete handler */
  onDeleteEntry?: (entryId: string) => void;
  /** Entry reorder handler */
  onReorderEntries?: (entries: FunctionUsageEntry[]) => void;
  /** Show usage statistics */
  showStatistics?: boolean;
  /** Allow drag and drop reordering */
  enableReordering?: boolean;
}

/**
 * Function preview component props
 */
export interface FunctionPreviewProps extends BaseComponentProps {
  /** Function definition */
  functionDef: DatabaseFunction;
  /** Parameter values for preview */
  parameters: Record<string, any>;
  /** Sample input data */
  sampleData?: any;
  /** Preview execution handler */
  onExecutePreview?: (params: Record<string, any>) => Promise<any>;
  /** Show SQL syntax */
  showSyntax?: boolean;
  /** Show examples */
  showExamples?: boolean;
}

// =============================================================================
// API Response and Request Types
// =============================================================================

/**
 * API response wrapper for function usage operations
 */
export interface FunctionUsageApiResponse<T = any> {
  /** Operation success status */
  success: boolean;
  /** Response data */
  data?: T;
  /** Error message if operation failed */
  error?: string;
  /** Additional metadata */
  metadata?: {
    timestamp: string;
    requestId: string;
    version: string;
  };
}

/**
 * Function usage list API response
 */
export interface FunctionUsageListResponse extends FunctionUsageApiResponse<{
  /** Function usage entries */
  entries: FunctionUsageEntry[];
  /** Total count */
  total: number;
  /** Pagination info */
  pagination?: {
    page: number;
    pageSize: number;
    totalPages: number;
  };
}> {}

/**
 * Available functions API response
 */
export interface AvailableFunctionsResponse extends FunctionUsageApiResponse<{
  /** Available functions */
  functions: DatabaseFunction[];
  /** Functions grouped by category */
  categories: Record<FunctionCategory, DatabaseFunction[]>;
}> {}

/**
 * Function usage creation/update request
 */
export interface FunctionUsageRequest {
  /** Function usage configuration */
  usage: Omit<FunctionUsageEntry, 'id' | 'validation' | 'metadata'>;
  /** Validation options */
  validateOnly?: boolean;
}

/**
 * Function validation request
 */
export interface FunctionValidationRequest {
  /** Function ID to validate */
  functionId: string;
  /** Parameter values */
  parameters: Record<string, any>;
  /** Target field context */
  fieldContext: {
    name: string;
    type: string;
    nullable: boolean;
  };
}

/**
 * Function validation response
 */
export interface FunctionValidationResponse extends FunctionUsageApiResponse<ValidationStatus> {}

// =============================================================================
// Hook Return Types
// =============================================================================

/**
 * Function usage form hook return type
 */
export interface UseFunctionUsageFormReturn {
  /** React Hook Form instance */
  form: UseFormReturn<FunctionUsageFormData>;
  /** Form submission handler */
  handleSubmit: (data: FunctionUsageFormData) => Promise<void>;
  /** Form reset handler */
  resetForm: () => void;
  /** Validation status */
  validation: ValidationStatus | null;
  /** Loading state */
  isLoading: boolean;
  /** Available functions */
  availableFunctions: DatabaseFunction[];
  /** Selected function definition */
  selectedFunction: DatabaseFunction | null;
}

/**
 * Function usage management hook return type
 */
export interface UseFunctionUsageReturn {
  /** Function usage entries */
  entries: FunctionUsageEntry[];
  /** Loading state */
  isLoading: boolean;
  /** Error state */
  error: string | null;
  /** Add new function usage */
  addUsage: (usage: Omit<FunctionUsageEntry, 'id'>) => Promise<void>;
  /** Update existing function usage */
  updateUsage: (id: string, usage: Partial<FunctionUsageEntry>) => Promise<void>;
  /** Delete function usage */
  deleteUsage: (id: string) => Promise<void>;
  /** Reorder function usage entries */
  reorderUsage: (entries: FunctionUsageEntry[]) => Promise<void>;
  /** Validate function usage */
  validateUsage: (usage: FunctionUsageEntry) => Promise<ValidationStatus>;
  /** Refresh entries */
  refresh: () => Promise<void>;
}

// =============================================================================
// Utility Types
// =============================================================================

/**
 * Function usage filter criteria
 */
export interface FunctionUsageFilter {
  /** Filter by field name */
  fieldName?: string;
  /** Filter by function category */
  category?: FunctionCategory;
  /** Filter by execution context */
  context?: FunctionExecutionContext;
  /** Filter by enabled status */
  enabled?: boolean;
  /** Search term for function names */
  searchTerm?: string;
}

/**
 * Function usage sort criteria
 */
export interface FunctionUsageSort {
  /** Sort field */
  field: keyof FunctionUsageEntry;
  /** Sort direction */
  direction: 'asc' | 'desc';
}

/**
 * Function usage pagination
 */
export interface FunctionUsagePagination {
  /** Current page (1-based) */
  page: number;
  /** Items per page */
  pageSize: number;
  /** Total items */
  total: number;
}

/**
 * Type guard for function usage entry
 */
export const isFunctionUsageEntry = (obj: any): obj is FunctionUsageEntry => {
  return (
    typeof obj === 'object' &&
    obj !== null &&
    typeof obj.id === 'string' &&
    typeof obj.functionId === 'string' &&
    typeof obj.fieldName === 'string' &&
    typeof obj.context === 'string' &&
    typeof obj.parameters === 'object' &&
    typeof obj.enabled === 'boolean' &&
    typeof obj.order === 'number'
  );
};

/**
 * Type guard for database function
 */
export const isDatabaseFunction = (obj: any): obj is DatabaseFunction => {
  return (
    typeof obj === 'object' &&
    obj !== null &&
    typeof obj.id === 'string' &&
    typeof obj.name === 'string' &&
    typeof obj.category === 'string' &&
    typeof obj.type === 'string' &&
    Array.isArray(obj.parameters) &&
    Array.isArray(obj.supportedDatabases)
  );
};

// =============================================================================
// Default Values and Constants
// =============================================================================

/**
 * Default function usage options
 */
export const DEFAULT_FUNCTION_OPTIONS: FunctionUsageOptions = {
  errorHandling: 'fail',
  cacheResults: false,
  debug: false
};

/**
 * Default form data for new function usage
 */
export const DEFAULT_FUNCTION_USAGE_FORM: Partial<FunctionUsageFormData> = {
  context: 'pre_process',
  parameters: {},
  options: DEFAULT_FUNCTION_OPTIONS,
  enabled: true,
  order: 0
};

/**
 * Function category labels for UI display
 */
export const FUNCTION_CATEGORY_LABELS: Record<FunctionCategory, string> = {
  math: 'Mathematical Functions',
  string: 'String Functions',
  date: 'Date & Time Functions',
  aggregate: 'Aggregate Functions',
  conditional: 'Conditional Functions',
  conversion: 'Type Conversion Functions',
  validation: 'Validation Functions',
  utility: 'Utility Functions'
};

/**
 * Execution context labels for UI display
 */
export const EXECUTION_CONTEXT_LABELS: Record<FunctionExecutionContext, string> = {
  pre_process: 'Pre-Processing',
  post_process: 'Post-Processing',
  validation: 'Validation',
  transform: 'Data Transformation',
  filter: 'Filtering',
  aggregate: 'Aggregation'
};