/**
 * Database Function Usage Configuration Types for React/Next.js Implementation
 * 
 * Comprehensive type definitions for database function usage workflows supporting:
 * - React Hook Form 7.57.0 with Zod schema validation
 * - Real-time validation under 100ms performance targets
 * - Type-safe configuration workflows for database function parameter management
 * - Component prop interfaces for React function usage form integration
 * - Dropdown option types for function selection and parameter configuration
 * - Validation rule types for function parameter constraints and usage patterns
 * 
 * Compatible with DreamFactory function usage API requirements and enterprise-scale
 * database function management with comprehensive error handling and validation.
 * 
 * @fileoverview Function usage type definitions for ADF Schema field management
 * @version 1.0.0
 * @since 2024-12-19
 */

import { z } from 'zod';
import { ReactNode, ComponentType } from 'react';
import { 
  UseFormReturn, 
  FieldPath, 
  FieldValues, 
  Control, 
  RegisterOptions,
  FieldError,
  UseControllerProps,
  FieldArrayWithId
} from 'react-hook-form';
import type { 
  BaseComponent, 
  ComponentVariant, 
  ComponentSize,
  FormFieldProps,
  DropdownOption 
} from '@/types/ui-components';
import type { ApiResponse, ValidationResponse } from '@/types/api-responses';
import type { 
  DatabaseField, 
  FieldDataType, 
  SchemaValidationRule 
} from '@/types/database-schema';

// ============================================================================
// CORE FUNCTION USAGE TYPES
// ============================================================================

/**
 * Database function usage methods supported by DreamFactory API
 * Maps to HTTP methods for REST API endpoint generation
 */
export type FunctionUseMethod = 
  | 'SELECT'   // GET operations - data retrieval
  | 'FILTER'   // GET with filtering - conditional data retrieval
  | 'INSERT'   // POST operations - data creation
  | 'UPDATE'   // PATCH operations - data modification
  | 'DELETE'   // DELETE operations - data removal
  | 'UPSERT';  // POST/PATCH hybrid - create or update

/**
 * Database function parameter types for validation and UI rendering
 * Supports all standard SQL data types with appropriate validation
 */
export type FunctionParameterType = 
  | 'string'
  | 'number'
  | 'integer'
  | 'boolean'
  | 'date'
  | 'datetime'
  | 'timestamp'
  | 'json'
  | 'uuid'
  | 'binary'
  | 'decimal'
  | 'float'
  | 'text'
  | 'enum'
  | 'array';

/**
 * Function usage validation constraint levels
 * Determines validation strictness and error handling behavior
 */
export type ValidationLevel = 'strict' | 'warning' | 'loose' | 'disabled';

/**
 * Core function usage entry interface
 * Represents a single database function configuration for field operations
 */
export interface FunctionUsageEntry {
  /** Unique identifier for this function usage entry */
  id?: string;
  /** Array of function usage methods this entry applies to */
  use: FunctionUseMethod[];
  /** Database function name or expression to execute */
  function: string;
  /** Function parameters with type validation */
  parameters?: FunctionParameter[];
  /** Validation rules for function execution */
  validation?: FunctionValidationRule[];
  /** Whether this function usage is active */
  enabled?: boolean;
  /** Custom validation message for errors */
  errorMessage?: string;
  /** Function description for documentation */
  description?: string;
  /** Creation timestamp */
  createdAt?: string;
  /** Last modification timestamp */
  updatedAt?: string;
}

/**
 * Database function parameter definition
 * Defines input parameters for function execution with type safety
 */
export interface FunctionParameter {
  /** Parameter name */
  name: string;
  /** Parameter data type */
  type: FunctionParameterType;
  /** Whether parameter is required */
  required: boolean;
  /** Default value if parameter not provided */
  defaultValue?: unknown;
  /** Parameter validation pattern */
  validation?: string;
  /** Parameter description */
  description?: string;
  /** Enumerated values for enum type parameters */
  enumValues?: string[];
  /** Minimum value for numeric parameters */
  minValue?: number;
  /** Maximum value for numeric parameters */
  maxValue?: number;
  /** Maximum length for string parameters */
  maxLength?: number;
  /** Parameter format specification */
  format?: string;
}

/**
 * Function validation rule definition
 * Defines custom validation logic for function usage
 */
export interface FunctionValidationRule {
  /** Rule identifier */
  id: string;
  /** Validation rule type */
  type: 'required' | 'pattern' | 'range' | 'custom' | 'dependency';
  /** Rule condition expression */
  condition: string;
  /** Error message when rule fails */
  message: string;
  /** Validation level for this rule */
  level: ValidationLevel;
  /** Whether rule is active */
  enabled: boolean;
  /** Dependencies on other parameters */
  dependencies?: string[];
}

// ============================================================================
// DROPDOWN OPTION TYPES
// ============================================================================

/**
 * Function usage dropdown option for UI selection
 * Provides user-friendly interface for function method selection
 */
export interface FunctionUseDropdownOption extends DropdownOption<FunctionUseMethod> {
  /** Display name for the function usage method */
  name: string;
  /** Function usage method value */
  value: FunctionUseMethod;
  /** HTTP method mapping for API generation */
  httpMethod: 'GET' | 'POST' | 'PATCH' | 'PUT' | 'DELETE';
  /** Description of when to use this method */
  description: string;
  /** Whether this option is available for current field type */
  available: boolean;
  /** Icon name for UI display */
  icon?: string;
  /** CSS class for styling */
  className?: string;
}

/**
 * Function parameter type dropdown option
 * Used for parameter type selection in function configuration
 */
export interface ParameterTypeDropdownOption extends DropdownOption<FunctionParameterType> {
  /** Display name for parameter type */
  name: string;
  /** Parameter type value */
  value: FunctionParameterType;
  /** Type category for grouping */
  category: 'primitive' | 'composite' | 'special';
  /** Default validation pattern */
  defaultValidation?: string;
  /** Compatible field data types */
  compatibleTypes: FieldDataType[];
  /** Example value for documentation */
  example?: string;
}

/**
 * Pre-defined function dropdown option
 * Common database functions available for selection
 */
export interface PredefinedFunctionOption extends DropdownOption<string> {
  /** Function name */
  name: string;
  /** Function expression template */
  value: string;
  /** Function category */
  category: 'string' | 'numeric' | 'date' | 'aggregate' | 'custom';
  /** Function description */
  description: string;
  /** Required parameters */
  parameters: Omit<FunctionParameter, 'name'>[];
  /** Supported database types */
  supportedDatabases: string[];
  /** Example usage */
  example: string;
  /** Performance impact level */
  performanceImpact: 'low' | 'medium' | 'high';
}

// ============================================================================
// ZOD VALIDATION SCHEMAS
// ============================================================================

/**
 * Zod schema for function parameter validation
 * Ensures type safety and runtime validation for function parameters
 */
export const functionParameterSchema = z.object({
  name: z.string()
    .min(1, 'Parameter name is required')
    .max(100, 'Parameter name must be less than 100 characters')
    .regex(/^[a-zA-Z_][a-zA-Z0-9_]*$/, 'Parameter name must be a valid identifier'),
  type: z.enum([
    'string', 'number', 'integer', 'boolean', 'date', 'datetime', 
    'timestamp', 'json', 'uuid', 'binary', 'decimal', 'float', 
    'text', 'enum', 'array'
  ]),
  required: z.boolean().default(false),
  defaultValue: z.unknown().optional(),
  validation: z.string().optional(),
  description: z.string().max(500, 'Description must be less than 500 characters').optional(),
  enumValues: z.array(z.string()).optional(),
  minValue: z.number().optional(),
  maxValue: z.number().optional(),
  maxLength: z.number().min(1).max(65535).optional(),
  format: z.string().optional()
}).refine((data) => {
  // Enum type must have enum values
  if (data.type === 'enum') {
    return data.enumValues && data.enumValues.length > 0;
  }
  return true;
}, {
  message: 'Enum type parameters must define enumValues',
  path: ['enumValues']
}).refine((data) => {
  // Numeric types can have min/max validation
  if (['number', 'integer', 'decimal', 'float'].includes(data.type)) {
    if (data.minValue !== undefined && data.maxValue !== undefined) {
      return data.minValue <= data.maxValue;
    }
  }
  return true;
}, {
  message: 'Minimum value must be less than or equal to maximum value',
  path: ['maxValue']
});

/**
 * Zod schema for function validation rule
 * Validates custom validation rules for function execution
 */
export const functionValidationRuleSchema = z.object({
  id: z.string().min(1, 'Rule ID is required'),
  type: z.enum(['required', 'pattern', 'range', 'custom', 'dependency']),
  condition: z.string().min(1, 'Validation condition is required'),
  message: z.string().min(1, 'Error message is required').max(200),
  level: z.enum(['strict', 'warning', 'loose', 'disabled']).default('strict'),
  enabled: z.boolean().default(true),
  dependencies: z.array(z.string()).optional()
});

/**
 * Zod schema for function usage entry validation
 * Comprehensive validation for function usage configuration
 */
export const functionUsageEntrySchema = z.object({
  id: z.string().optional(),
  use: z.array(z.enum(['SELECT', 'FILTER', 'INSERT', 'UPDATE', 'DELETE', 'UPSERT']))
    .min(1, 'At least one usage method must be selected')
    .max(6, 'Cannot select more than 6 usage methods'),
  function: z.string()
    .min(1, 'Function name or expression is required')
    .max(1000, 'Function expression must be less than 1000 characters')
    .refine((val) => {
      // Basic SQL injection protection
      const dangerousPatterns = [
        /;\s*(drop|delete|truncate|alter)\s+/i,
        /union\s+select/i,
        /--/,
        /\/\*/
      ];
      return !dangerousPatterns.some(pattern => pattern.test(val));
    }, {
      message: 'Function expression contains potentially dangerous SQL patterns'
    }),
  parameters: z.array(functionParameterSchema).optional(),
  validation: z.array(functionValidationRuleSchema).optional(),
  enabled: z.boolean().default(true),
  errorMessage: z.string().max(500, 'Error message must be less than 500 characters').optional(),
  description: z.string().max(1000, 'Description must be less than 1000 characters').optional(),
  createdAt: z.string().datetime().optional(),
  updatedAt: z.string().datetime().optional()
}).refine((data) => {
  // Validate that parameters referenced in validation rules exist
  if (data.parameters && data.validation) {
    const parameterNames = data.parameters.map(p => p.name);
    const referencedParams = data.validation.flatMap(v => v.dependencies || []);
    return referencedParams.every(param => parameterNames.includes(param));
  }
  return true;
}, {
  message: 'Validation rules reference non-existent parameters',
  path: ['validation']
});

/**
 * Zod schema for function usage array validation
 * Validates complete function usage configuration for a database field
 */
export const functionUsageArraySchema = z.array(functionUsageEntrySchema)
  .max(20, 'Cannot define more than 20 function usage entries per field')
  .refine((entries) => {
    // Check for duplicate function usage methods within the same function
    const usageGroups = new Map<string, Set<FunctionUseMethod>>();
    
    for (const entry of entries) {
      const key = entry.function;
      if (!usageGroups.has(key)) {
        usageGroups.set(key, new Set());
      }
      
      const existingMethods = usageGroups.get(key)!;
      for (const method of entry.use) {
        if (existingMethods.has(method)) {
          return false;
        }
        existingMethods.add(method);
      }
    }
    return true;
  }, {
    message: 'Duplicate function usage methods detected for the same function'
  });

// ============================================================================
// FORM INTEGRATION TYPES
// ============================================================================

/**
 * React Hook Form field array item type for function usage
 * Integrates with React Hook Form's useFieldArray hook
 */
export type FunctionUsageFieldArray = FieldArrayWithId<
  { dbFunction: FunctionUsageEntry[] },
  'dbFunction',
  'id'
>;

/**
 * Function usage form data structure
 * Complete form data including function usage array and metadata
 */
export interface FunctionUsageFormData {
  /** Array of function usage entries */
  dbFunction: FunctionUsageEntry[];
  /** Field ID this function usage applies to */
  fieldId?: string;
  /** Form validation state */
  isValid?: boolean;
  /** Form dirty state */
  isDirty?: boolean;
  /** Last validation timestamp */
  lastValidated?: string;
}

/**
 * Function usage form configuration
 * Configuration options for React Hook Form initialization
 */
export interface FunctionUsageFormConfig {
  /** Form identifier */
  formId: string;
  /** Default function usage entries */
  defaultValues?: Partial<FunctionUsageFormData>;
  /** Validation schema */
  schema: typeof functionUsageArraySchema;
  /** Real-time validation enabled */
  realtimeValidation: boolean;
  /** Validation debounce delay (ms) */
  validationDelay: number;
  /** Maximum function usage entries allowed */
  maxEntries: number;
  /** Available dropdown options */
  dropdownOptions: {
    functionUse: FunctionUseDropdownOption[];
    parameterTypes: ParameterTypeDropdownOption[];
    predefinedFunctions: PredefinedFunctionOption[];
  };
}

/**
 * Function usage form context
 * React context for sharing form state across components
 */
export interface FunctionUsageFormContext {
  /** React Hook Form instance */
  form: UseFormReturn<FunctionUsageFormData>;
  /** Form configuration */
  config: FunctionUsageFormConfig;
  /** Form submission handler */
  onSubmit: (data: FunctionUsageFormData) => Promise<void> | void;
  /** Form reset handler */
  onReset: () => void;
  /** Add new function usage entry */
  addEntry: () => void;
  /** Remove function usage entry */
  removeEntry: (index: number) => void;
  /** Validate function expression */
  validateFunction: (expression: string) => Promise<ValidationResponse>;
  /** Get available functions for field type */
  getAvailableFunctions: (fieldType: FieldDataType) => PredefinedFunctionOption[];
}

// ============================================================================
// COMPONENT PROP INTERFACES
// ============================================================================

/**
 * Function usage component base props
 * Common props for all function usage related components
 */
export interface FunctionUsageBaseProps extends BaseComponent {
  /** Field data for context */
  field?: DatabaseField;
  /** Whether component is read-only */
  readonly?: boolean;
  /** Show accordion wrapper */
  showAccordion?: boolean;
  /** Compact display mode */
  compact?: boolean;
  /** Show advanced options */
  showAdvanced?: boolean;
}

/**
 * Function usage table component props
 * Props for the main function usage table component
 */
export interface FunctionUsageTableProps extends FunctionUsageBaseProps {
  /** Form control for function usage array */
  control: Control<FunctionUsageFormData>;
  /** Field name for the function usage array */
  name: FieldPath<FunctionUsageFormData>;
  /** Available dropdown options */
  options: {
    functionUse: FunctionUseDropdownOption[];
    parameterTypes: ParameterTypeDropdownOption[];
    predefinedFunctions: PredefinedFunctionOption[];
  };
  /** Custom validation function */
  customValidation?: (entry: FunctionUsageEntry) => string | undefined;
  /** Callback when entry is added */
  onEntryAdd?: (entry: FunctionUsageEntry) => void;
  /** Callback when entry is removed */
  onEntryRemove?: (index: number, entry: FunctionUsageEntry) => void;
  /** Callback when entry is validated */
  onEntryValidate?: (index: number, isValid: boolean) => void;
}

/**
 * Function usage entry form props
 * Props for individual function usage entry form
 */
export interface FunctionUsageEntryFormProps extends FunctionUsageBaseProps {
  /** Entry index in the array */
  index: number;
  /** Form control */
  control: Control<FunctionUsageFormData>;
  /** Available options for dropdowns */
  options: FunctionUsageFormConfig['dropdownOptions'];
  /** Remove entry handler */
  onRemove: () => void;
  /** Move entry up handler */
  onMoveUp?: () => void;
  /** Move entry down handler */
  onMoveDown?: () => void;
  /** Duplicate entry handler */
  onDuplicate?: () => void;
  /** Show reorder controls */
  showReorderControls?: boolean;
}

/**
 * Function parameter form props
 * Props for function parameter configuration form
 */
export interface FunctionParameterFormProps extends BaseComponent {
  /** Function entry index */
  entryIndex: number;
  /** Parameter index */
  parameterIndex: number;
  /** Form control */
  control: Control<FunctionUsageFormData>;
  /** Available parameter type options */
  parameterTypes: ParameterTypeDropdownOption[];
  /** Remove parameter handler */
  onRemove: () => void;
}

/**
 * Function validation rule form props
 * Props for validation rule configuration form
 */
export interface FunctionValidationRuleFormProps extends BaseComponent {
  /** Function entry index */
  entryIndex: number;
  /** Validation rule index */
  ruleIndex: number;
  /** Form control */
  control: Control<FunctionUsageFormData>;
  /** Available parameters for dependency selection */
  availableParameters: string[];
  /** Remove rule handler */
  onRemove: () => void;
}

// ============================================================================
// API INTEGRATION TYPES
// ============================================================================

/**
 * Function usage API request payload
 * Request structure for saving function usage configuration
 */
export interface FunctionUsageApiRequest {
  /** Field ID */
  fieldId: string;
  /** Service name */
  serviceName: string;
  /** Schema name */
  schemaName?: string;
  /** Table name */
  tableName: string;
  /** Function usage entries */
  functionUsage: FunctionUsageEntry[];
}

/**
 * Function usage API response
 * Response structure from function usage operations
 */
export interface FunctionUsageApiResponse extends ApiResponse<FunctionUsageEntry[]> {
  /** Validation results */
  validation?: {
    /** Overall validation status */
    isValid: boolean;
    /** Entry-specific validation results */
    entries: Array<{
      index: number;
      isValid: boolean;
      errors: string[];
      warnings: string[];
    }>;
  };
  /** Performance metrics */
  performance?: {
    /** Validation duration (ms) */
    validationDuration: number;
    /** Estimated runtime impact */
    runtimeImpact: 'low' | 'medium' | 'high';
  };
}

/**
 * Function validation API request
 * Request for validating function expressions
 */
export interface FunctionValidationRequest {
  /** Function expression to validate */
  expression: string;
  /** Target database service */
  serviceName: string;
  /** Field context for validation */
  fieldContext: {
    tableName: string;
    fieldName: string;
    fieldType: FieldDataType;
  };
  /** Function parameters */
  parameters?: FunctionParameter[];
}

/**
 * Function validation API response
 * Response from function expression validation
 */
export interface FunctionValidationApiResponse extends ValidationResponse {
  /** Suggested corrections */
  suggestions?: string[];
  /** Performance implications */
  performance?: {
    estimatedExecutionTime: number;
    indexUsage: 'optimal' | 'suboptimal' | 'none';
    recommendations: string[];
  };
  /** Compatible usage methods */
  compatibleMethods?: FunctionUseMethod[];
}

// ============================================================================
// DEFAULT VALUES AND CONSTANTS
// ============================================================================

/**
 * Default function usage dropdown options
 * Standard options available for all database types
 */
export const DEFAULT_FUNCTION_USE_OPTIONS: FunctionUseDropdownOption[] = [
  {
    name: 'SELECT (GET)',
    value: 'SELECT',
    httpMethod: 'GET',
    description: 'Apply function during data retrieval operations',
    available: true,
    icon: 'eye',
    className: 'text-blue-600'
  },
  {
    name: 'FILTER (GET)',
    value: 'FILTER',
    httpMethod: 'GET',
    description: 'Use function for filtering conditions in queries',
    available: true,
    icon: 'filter',
    className: 'text-green-600'
  },
  {
    name: 'INSERT (POST)',
    value: 'INSERT',
    httpMethod: 'POST',
    description: 'Execute function during record creation',
    available: true,
    icon: 'plus',
    className: 'text-purple-600'
  },
  {
    name: 'UPDATE (PATCH)',
    value: 'UPDATE',
    httpMethod: 'PATCH',
    description: 'Apply function during record updates',
    available: true,
    icon: 'edit',
    className: 'text-orange-600'
  }
];

/**
 * Default parameter type options
 * Available parameter types for function configuration
 */
export const DEFAULT_PARAMETER_TYPE_OPTIONS: ParameterTypeDropdownOption[] = [
  {
    name: 'String',
    value: 'string',
    category: 'primitive',
    defaultValidation: '^.+$',
    compatibleTypes: ['varchar', 'char', 'text', 'string'],
    example: 'example text'
  },
  {
    name: 'Number',
    value: 'number',
    category: 'primitive',
    defaultValidation: '^[0-9]+(\\.[0-9]+)?$',
    compatibleTypes: ['int', 'float', 'double', 'decimal', 'numeric'],
    example: '123.45'
  },
  {
    name: 'Integer',
    value: 'integer',
    category: 'primitive',
    defaultValidation: '^[0-9]+$',
    compatibleTypes: ['int', 'bigint', 'smallint', 'tinyint'],
    example: '42'
  },
  {
    name: 'Boolean',
    value: 'boolean',
    category: 'primitive',
    compatibleTypes: ['boolean', 'bit', 'tinyint'],
    example: 'true'
  },
  {
    name: 'Date',
    value: 'date',
    category: 'primitive',
    defaultValidation: '^\\d{4}-\\d{2}-\\d{2}$',
    compatibleTypes: ['date'],
    example: '2024-12-19'
  },
  {
    name: 'DateTime',
    value: 'datetime',
    category: 'primitive',
    defaultValidation: '^\\d{4}-\\d{2}-\\d{2}T\\d{2}:\\d{2}:\\d{2}',
    compatibleTypes: ['datetime', 'timestamp'],
    example: '2024-12-19T10:30:00'
  },
  {
    name: 'JSON',
    value: 'json',
    category: 'composite',
    compatibleTypes: ['json', 'jsonb', 'text'],
    example: '{"key": "value"}'
  },
  {
    name: 'UUID',
    value: 'uuid',
    category: 'special',
    defaultValidation: '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$',
    compatibleTypes: ['uuid', 'char', 'varchar'],
    example: '123e4567-e89b-12d3-a456-426614174000'
  }
];

/**
 * Default validation configuration
 * Standard validation settings for function usage forms
 */
export const DEFAULT_VALIDATION_CONFIG = {
  debounceMs: 50,
  maxEntries: 20,
  maxParametersPerFunction: 10,
  maxValidationRulesPerFunction: 5,
  performanceThresholds: {
    validationTimeout: 5000,
    maxFunctionLength: 1000,
    maxParameterLength: 100
  }
} as const;

// ============================================================================
// TYPE EXPORTS
// ============================================================================

export type {
  // Core types
  FunctionUsageEntry,
  FunctionParameter,
  FunctionValidationRule,
  FunctionUseMethod,
  FunctionParameterType,
  ValidationLevel,
  
  // Dropdown types
  FunctionUseDropdownOption,
  ParameterTypeDropdownOption,
  PredefinedFunctionOption,
  
  // Form types
  FunctionUsageFieldArray,
  FunctionUsageFormData,
  FunctionUsageFormConfig,
  FunctionUsageFormContext,
  
  // Component prop types
  FunctionUsageBaseProps,
  FunctionUsageTableProps,
  FunctionUsageEntryFormProps,
  FunctionParameterFormProps,
  FunctionValidationRuleFormProps,
  
  // API types
  FunctionUsageApiRequest,
  FunctionUsageApiResponse,
  FunctionValidationRequest,
  FunctionValidationApiResponse
};

// Schema exports
export {
  functionParameterSchema,
  functionValidationRuleSchema,
  functionUsageEntrySchema,
  functionUsageArraySchema
};

// Default exports
export {
  DEFAULT_FUNCTION_USE_OPTIONS,
  DEFAULT_PARAMETER_TYPE_OPTIONS,
  DEFAULT_VALIDATION_CONFIG
};