import { z } from 'zod';

/**
 * Comprehensive Zod validation schemas for database field configuration
 * Supports all field types, constraints, relationships, and validation rules
 * Integrates with React Hook Form for real-time field form validation
 */

// ==============================================================================
// Field Type Enumerations
// ==============================================================================

/**
 * Supported database field types matching the Angular implementation
 */
export const FieldTypeSchema = z.enum([
  'id',
  'string',
  'integer', 
  'text',
  'boolean',
  'binary',
  'float',
  'double',
  'decimal',
  'datetime',
  'date',
  'time',
  'reference',
  'user_id',
  'user_id_on_create',
  'user_id_on_update',
  'timestamp',
  'timestamp_on_create',
  'timestamp_on_update',
], {
  errorMap: () => ({ message: 'Please select a valid field type' })
});

/**
 * Database types that support length constraints
 */
const TYPES_WITH_LENGTH = ['string', 'text', 'binary'] as const;

/**
 * Database types that support precision and scale constraints
 */
const TYPES_WITH_PRECISION = ['decimal', 'float', 'double'] as const;

/**
 * Database types that support reference relationships
 */
const REFERENCE_TYPES = ['reference'] as const;

/**
 * Database types that are automatically managed timestamps
 */
const TIMESTAMP_TYPES = ['timestamp', 'timestamp_on_create', 'timestamp_on_update'] as const;

/**
 * Database types that are automatically managed user IDs
 */
const USER_ID_TYPES = ['user_id', 'user_id_on_create', 'user_id_on_update'] as const;

// ==============================================================================
// Database Function Validation
// ==============================================================================

/**
 * Validation schema for database function usage
 * Matches the DbFunctionUseType from Angular implementation
 */
export const DbFunctionUseSchema = z.object({
  use: z.array(z.string().min(1, 'Function use type is required')).min(1, 'At least one use type is required'),
  function: z.string().min(1, 'Function name is required').max(255, 'Function name must be less than 255 characters')
});

/**
 * Array of database function usages
 */
export const DbFunctionArraySchema = z.array(DbFunctionUseSchema).optional().nullable();

// ==============================================================================
// JSON Validation Schema
// ==============================================================================

/**
 * JSON validation schema that validates JSON string format
 * Replaces the Angular JsonValidator function
 */
export const JsonStringSchema = z.string().optional().nullable().refine(
  (value) => {
    if (!value || value.trim().length === 0) {
      return true; // Empty values are valid
    }
    try {
      JSON.parse(value);
      return true;
    } catch {
      return false;
    }
  },
  {
    message: 'Please enter valid JSON format'
  }
);

// ==============================================================================
// CSV Validation Schema  
// ==============================================================================

/**
 * CSV validation schema that validates comma-separated word lists
 * Replaces the Angular CsvValidator function using the same regex pattern
 */
export const CsvStringSchema = z.string().optional().nullable().refine(
  (value) => {
    if (!value || value.trim().length === 0) {
      return true; // Empty values are valid
    }
    const csvRegex = /^\w+(?:\s*,\s*\w+)*$/;
    return csvRegex.test(value);
  },
  {
    message: 'Please enter comma-separated words (letters, numbers, underscores only)'
  }
);

// ==============================================================================
// Core Field Configuration Schema
// ==============================================================================

/**
 * Base field configuration schema without conditional validation
 */
const BaseFieldSchema = z.object({
  // Required fields
  name: z.string()
    .min(1, 'Field name is required')
    .max(255, 'Field name must be less than 255 characters')
    .regex(/^[a-zA-Z_][a-zA-Z0-9_]*$/, 'Field name must start with letter or underscore and contain only letters, numbers, and underscores'),
  
  label: z.string()
    .min(1, 'Field label is required')
    .max(255, 'Field label must be less than 255 characters'),
  
  type: FieldTypeSchema,

  // Optional basic fields
  alias: z.string().max(255, 'Alias must be less than 255 characters').optional().nullable(),
  description: z.string().max(1000, 'Description must be less than 1000 characters').optional().nullable(),
  dbType: z.string().max(100, 'Database type must be less than 100 characters').optional().nullable(),
  default: z.string().max(500, 'Default value must be less than 500 characters').optional().nullable(),

  // Numeric constraints (conditional validation applied later)
  length: z.number().int().min(0).max(65535).optional().nullable(),
  precision: z.number().int().min(0).max(65).optional().nullable(),
  scale: z.number().int().min(0).max(30).optional().nullable(),

  // Boolean flags
  allowNull: z.boolean().default(true),
  autoIncrement: z.boolean().default(false),
  fixedLength: z.boolean().default(false),
  isAggregate: z.boolean().default(false),
  isForeignKey: z.boolean().default(false),
  isPrimaryKey: z.boolean().default(false),
  isUnique: z.boolean().default(false),
  isVirtual: z.boolean().default(false),
  required: z.boolean().default(false),
  supportsMultibyte: z.boolean().default(false),

  // Reference relationship fields (conditional validation applied later)
  refTable: z.string().max(255, 'Reference table name must be less than 255 characters').optional().nullable(),
  refField: z.string().max(255, 'Reference field name must be less than 255 characters').optional().nullable(),
  refOnDelete: z.enum(['CASCADE', 'SET NULL', 'RESTRICT', 'NO ACTION']).optional().nullable(),
  refOnUpdate: z.enum(['CASCADE', 'SET NULL', 'RESTRICT', 'NO ACTION']).optional().nullable(),

  // Complex configuration fields
  validation: JsonStringSchema,
  picklist: CsvStringSchema,
  
  // Database functions
  dbFunction: DbFunctionArraySchema,

  // System fields (typically read-only)
  native: z.array(z.any()).optional().nullable(),
  value: z.array(z.any()).default([])
});

// ==============================================================================
// Conditional Field Validation Schema
// ==============================================================================

/**
 * Main field validation schema with conditional logic based on field type
 * Implements dynamic control enabling/disabling per Section 5.2 Component Details
 */
export const FieldValidationSchema = BaseFieldSchema.superRefine((data, ctx) => {
  const { type, length, precision, scale, refTable, refField, isVirtual, isForeignKey } = data;

  // Length validation for string/text/binary types
  if (TYPES_WITH_LENGTH.includes(type as any)) {
    if (!isVirtual && length !== null && length !== undefined && length <= 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['length'],
        message: 'Length must be greater than 0 for string, text, and binary fields'
      });
    }
  } else {
    // Clear length for non-supported types
    if (length !== null && length !== undefined) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['length'],
        message: 'Length is not applicable for this field type'
      });
    }
  }

  // Precision and scale validation for decimal/float/double types
  if (TYPES_WITH_PRECISION.includes(type as any)) {
    if (!isVirtual) {
      if (precision !== null && precision !== undefined) {
        if (precision <= 0) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: ['precision'],
            message: 'Precision must be greater than 0 for decimal, float, and double fields'
          });
        }
        
        if (scale !== null && scale !== undefined) {
          if (scale < 0) {
            ctx.addIssue({
              code: z.ZodIssueCode.custom,
              path: ['scale'],
              message: 'Scale must be 0 or greater'
            });
          }
          
          if (scale > precision) {
            ctx.addIssue({
              code: z.ZodIssueCode.custom,
              path: ['scale'],
              message: 'Scale cannot be greater than precision'
            });
          }
        }
      }
    }
  } else {
    // Clear precision/scale for non-supported types
    if (precision !== null && precision !== undefined) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['precision'],
        message: 'Precision is not applicable for this field type'
      });
    }
    if (scale !== null && scale !== undefined) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['scale'],  
        message: 'Scale is not applicable for this field type'
      });
    }
  }

  // Reference field validation for reference types
  if (REFERENCE_TYPES.includes(type as any) || isForeignKey) {
    if (!isVirtual) {
      if (!refTable || refTable.trim().length === 0) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['refTable'],
          message: 'Reference table is required for reference fields'
        });
      }
      
      if (!refField || refField.trim().length === 0) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['refField'],
          message: 'Reference field is required for reference fields'
        });
      }
    }
  } else {
    // Clear reference fields for non-reference types
    if (refTable !== null && refTable !== undefined && refTable.trim().length > 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['refTable'],
        message: 'Reference table is not applicable for this field type'
      });
    }
    if (refField !== null && refField !== undefined && refField.trim().length > 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['refField'],
        message: 'Reference field is not applicable for this field type'
      });
    }
  }

  // Virtual field constraints
  if (isVirtual) {
    // Virtual fields cannot be primary keys
    if (data.isPrimaryKey) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['isPrimaryKey'],
        message: 'Virtual fields cannot be primary keys'
      });
    }
    
    // Virtual fields cannot have auto increment
    if (data.autoIncrement) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['autoIncrement'],
        message: 'Virtual fields cannot have auto increment'
      });
    }
  }

  // Primary key constraints
  if (data.isPrimaryKey) {
    // Primary keys cannot allow null
    if (data.allowNull) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['allowNull'],
        message: 'Primary keys cannot allow null values'
      });
    }
  }

  // Auto increment constraints
  if (data.autoIncrement) {
    // Auto increment fields must be numeric
    if (!['id', 'integer'].includes(type)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['autoIncrement'],
        message: 'Auto increment is only applicable to ID and integer fields'
      });
    }
    
    // Auto increment fields cannot allow null
    if (data.allowNull) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['allowNull'],
        message: 'Auto increment fields cannot allow null values'
      });
    }
  }

  // Timestamp field constraints
  if (TIMESTAMP_TYPES.includes(type as any)) {
    // Timestamp fields should not have custom defaults
    if (data.default !== null && data.default !== undefined && data.default.trim().length > 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['default'],
        message: 'Timestamp fields automatically manage their values and should not have custom defaults'
      });
    }
  }

  // User ID field constraints
  if (USER_ID_TYPES.includes(type as any)) {
    // User ID fields should not have custom defaults
    if (data.default !== null && data.default !== undefined && data.default.trim().length > 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['default'],
        message: 'User ID fields automatically manage their values and should not have custom defaults'
      });
    }
  }
});

// ==============================================================================
// Type Inference and Exports
// ==============================================================================

/**
 * Inferred TypeScript type from the field validation schema
 * Provides type safety for React Hook Form integration
 */
export type FieldFormData = z.infer<typeof FieldValidationSchema>;

/**
 * Utility schema for validating field names in bulk operations
 */
export const FieldNameSchema = z.string()
  .min(1, 'Field name is required')
  .max(255, 'Field name must be less than 255 characters')
  .regex(/^[a-zA-Z_][a-zA-Z0-9_]*$/, 'Field name must start with letter or underscore and contain only letters, numbers, and underscores');

/**
 * Schema for validating arrays of field names
 */
export const FieldNamesArraySchema = z.array(FieldNameSchema).min(1, 'At least one field name is required');

/**
 * Schema for field creation with minimal required fields
 */
export const CreateFieldSchema = FieldValidationSchema.pick({
  name: true,
  label: true,
  type: true
}).extend({
  // Override to make label optional for creation
  label: z.string().optional().default('')
});

/**
 * Schema for field update operations (name is typically immutable)
 */
export const UpdateFieldSchema = FieldValidationSchema.omit({ name: true });

/**
 * Helper function to get field type-specific validation rules
 * Used for dynamic form control enabling/disabling in React components
 */
export function getFieldTypeCapabilities(fieldType: z.infer<typeof FieldTypeSchema>) {
  return {
    supportsLength: TYPES_WITH_LENGTH.includes(fieldType as any),
    supportsPrecision: TYPES_WITH_PRECISION.includes(fieldType as any),
    isReference: REFERENCE_TYPES.includes(fieldType as any),
    isTimestamp: TIMESTAMP_TYPES.includes(fieldType as any),
    isUserId: USER_ID_TYPES.includes(fieldType as any),
    isAutoManaged: TIMESTAMP_TYPES.includes(fieldType as any) || USER_ID_TYPES.includes(fieldType as any),
  };
}

/**
 * Validation schema for bulk field operations
 */
export const BulkFieldOperationSchema = z.object({
  operation: z.enum(['create', 'update', 'delete']),
  fields: z.array(FieldValidationSchema),
  options: z.object({
    validateReferences: z.boolean().default(true),
    createIndexes: z.boolean().default(false),
    preserveData: z.boolean().default(true)
  }).optional()
});

// ==============================================================================
// Error Message Utilities
// ==============================================================================

/**
 * Custom error messages for field validation
 * Provides consistent error messaging across all schema components
 */
export const FieldValidationMessages = {
  name: {
    required: 'Field name is required',
    invalid: 'Field name must start with letter or underscore and contain only letters, numbers, and underscores',
    maxLength: 'Field name must be less than 255 characters'
  },
  label: {
    required: 'Field label is required',
    maxLength: 'Field label must be less than 255 characters'
  },
  type: {
    required: 'Field type is required',
    invalid: 'Please select a valid field type'
  },
  length: {
    required: 'Length is required for string, text, and binary fields',
    positive: 'Length must be greater than 0',
    notApplicable: 'Length is not applicable for this field type'
  },
  precision: {
    required: 'Precision is required for decimal, float, and double fields',
    positive: 'Precision must be greater than 0',
    notApplicable: 'Precision is not applicable for this field type'
  },
  scale: {
    nonNegative: 'Scale must be 0 or greater',
    maxPrecision: 'Scale cannot be greater than precision',
    notApplicable: 'Scale is not applicable for this field type'
  },
  reference: {
    tableRequired: 'Reference table is required for reference fields',
    fieldRequired: 'Reference field is required for reference fields',
    notApplicable: 'Reference fields are not applicable for this field type'
  },
  constraints: {
    virtualPrimaryKey: 'Virtual fields cannot be primary keys',
    virtualAutoIncrement: 'Virtual fields cannot have auto increment',
    primaryKeyNull: 'Primary keys cannot allow null values',
    autoIncrementType: 'Auto increment is only applicable to ID and integer fields',
    autoIncrementNull: 'Auto increment fields cannot allow null values',
    timestampDefault: 'Timestamp fields automatically manage their values and should not have custom defaults',
    userIdDefault: 'User ID fields automatically manage their values and should not have custom defaults'
  },
  json: {
    invalid: 'Please enter valid JSON format'
  },
  csv: {
    invalid: 'Please enter comma-separated words (letters, numbers, underscores only)'
  }
} as const;