/**
 * Comprehensive Zod validation schemas for database field configuration
 * Supports all field types, constraints, relationships, and validation rules
 * 
 * Integrates with React Hook Form for real-time field form validation with
 * dynamic control enabling/disabling based on field type selections.
 * 
 * Performance target: Real-time validation under 100ms per React/Next.js Integration Requirements
 * 
 * @module FieldValidationSchemas
 */

import { z } from 'zod'

// ============================================================================
// CORE FIELD TYPE DEFINITIONS
// ============================================================================

/**
 * Supported database field types enumeration
 * Based on DreamFactory field type specifications and database compatibility
 */
export const FieldTypeSchema = z.enum([
  'integer',
  'bigint', 
  'decimal',
  'float',
  'double',
  'string',
  'text',
  'boolean',
  'date',
  'datetime',
  'timestamp',
  'time',
  'binary',
  'json',
  'xml',
  'uuid',
  'enum',
  'set',
  'blob',
  'clob',
  'geometry',
  'point',
  'linestring',
  'polygon',
], {
  errorMap: () => ({ message: 'Please select a valid field type' }),
})

/**
 * Referential action types for foreign key constraints
 */
export const ReferentialActionSchema = z.enum([
  'CASCADE',
  'SET_NULL', 
  'RESTRICT',
  'NO_ACTION',
], {
  errorMap: () => ({ message: 'Please select a valid referential action' }),
})

/**
 * Field format options for display and validation
 */
export const FieldFormatSchema = z.enum([
  'none',
  'email',
  'url',
  'phone',
  'currency',
  'percentage',
  'date_iso',
  'datetime_iso',
  'time_12',
  'time_24',
], {
  errorMap: () => ({ message: 'Please select a valid field format' }),
})

// ============================================================================
// VALIDATION UTILITY SCHEMAS
// ============================================================================

/**
 * CSV validation schema for picklist fields
 * Validates comma-separated values with proper escaping and formatting
 */
export const csvValidationSchema = z
  .string()
  .refine(
    (value) => {
      if (!value || value.trim() === '') return true
      
      try {
        // Split by comma and validate each value
        const values = value.split(',').map(v => v.trim())
        
        // Check for empty values
        if (values.some(v => v === '')) {
          return false
        }
        
        // Check for duplicate values
        const uniqueValues = new Set(values.map(v => v.toLowerCase()))
        if (uniqueValues.size !== values.length) {
          return false
        }
        
        // Check each value is valid (no special characters that could break parsing)
        const validValueRegex = /^[a-zA-Z0-9\s\-_\.]+$/
        return values.every(v => validValueRegex.test(v))
        
      } catch {
        return false
      }
    },
    {
      message: 'Invalid CSV format. Use comma-separated values without duplicates or special characters.',
    }
  )

/**
 * JSON validation schema for complex field configuration
 * Validates well-formed JSON with error handling for malformed input
 */
export const jsonValidationSchema = z
  .string()
  .refine(
    (value) => {
      if (!value || value.trim() === '') return true
      try {
        JSON.parse(value)
        return true
      } catch {
        return false
      }
    },
    {
      message: 'Invalid JSON format. Please check syntax and try again.',
    }
  )

/**
 * Database function validation schema
 * Validates database function names and parameters
 */
export const dbFunctionSchema = z.object({
  function: z.string().min(1, 'Function name is required').max(64, 'Function name is too long'),
  use: z.array(z.string()).min(1, 'At least one usage context is required'),
})

/**
 * Field constraint validation schema
 */
export const fieldConstraintSchema = z.object({
  type: z.enum(['CHECK', 'UNIQUE', 'INDEX', 'DEFAULT']),
  definition: z.string().min(1, 'Constraint definition is required').max(500, 'Constraint definition is too long'),
  enabled: z.boolean().default(true),
})

// ============================================================================
// FIELD-TYPE-SPECIFIC VALIDATION SCHEMAS
// ============================================================================

/**
 * Numeric field validation schema (integer, bigint, decimal, float, double)
 */
export const numericFieldValidationSchema = z.object({
  // Core properties
  name: z.string()
    .min(1, 'Field name is required')
    .max(128, 'Field name must be less than 128 characters')
    .regex(/^[a-zA-Z][a-zA-Z0-9_]*$/, 'Field name must start with a letter and contain only letters, numbers, and underscores'),
  
  label: z.string()
    .min(1, 'Field label is required')
    .max(255, 'Field label is too long'),
  
  description: z.string()
    .max(500, 'Description is too long')
    .optional(),
  
  type: z.enum(['integer', 'bigint', 'decimal', 'float', 'double']),
  
  // Numeric-specific properties
  length: z.number()
    .int('Length must be an integer')
    .min(1, 'Length must be at least 1')
    .max(65, 'Length cannot exceed 65')
    .optional(),
  
  precision: z.number()
    .int('Precision must be an integer')
    .min(1, 'Precision must be at least 1')
    .max(65, 'Precision cannot exceed 65')
    .optional(),
  
  scale: z.number()
    .int('Scale must be an integer')
    .min(0, 'Scale cannot be negative')
    .max(30, 'Scale cannot exceed 30')
    .optional(),
  
  // Constraints
  isNullable: z.boolean().default(true),
  isPrimaryKey: z.boolean().default(false),
  isUnique: z.boolean().default(false),
  isAutoIncrement: z.boolean().default(false),
  
  // Default value
  defaultValue: z.union([
    z.number(),
    z.string().max(255, 'Default value is too long'),
    z.null(),
  ]).optional(),
  
  // Validation rules
  minValue: z.number().optional(),
  maxValue: z.number().optional(),
})
.refine((data) => {
  // Validate precision/scale relationship for decimal types
  if ((data.type === 'decimal' || data.type === 'float' || data.type === 'double') && data.scale && data.precision) {
    return data.scale <= data.precision
  }
  return true
}, {
  message: 'Scale cannot be greater than precision',
  path: ['scale'],
})
.refine((data) => {
  // Validate min/max value relationship
  if (data.minValue !== undefined && data.maxValue !== undefined) {
    return data.minValue <= data.maxValue
  }
  return true
}, {
  message: 'Minimum value cannot be greater than maximum value',
  path: ['maxValue'],
})

/**
 * String field validation schema (string, text)
 */
export const stringFieldValidationSchema = z.object({
  // Core properties
  name: z.string()
    .min(1, 'Field name is required')
    .max(128, 'Field name must be less than 128 characters')
    .regex(/^[a-zA-Z][a-zA-Z0-9_]*$/, 'Field name must start with a letter and contain only letters, numbers, and underscores'),
  
  label: z.string()
    .min(1, 'Field label is required')
    .max(255, 'Field label is too long'),
  
  description: z.string()
    .max(500, 'Description is too long')
    .optional(),
  
  type: z.enum(['string', 'text']),
  
  // String-specific properties
  length: z.number()
    .int('Length must be an integer')
    .min(1, 'Length must be at least 1')
    .max(65535, 'Length cannot exceed 65535')
    .optional(),
  
  fixedLength: z.boolean().default(false),
  supportsMultibyte: z.boolean().default(true),
  
  // Format and validation
  format: FieldFormatSchema.optional(),
  
  // Constraints
  isNullable: z.boolean().default(true),
  isPrimaryKey: z.boolean().default(false),
  isUnique: z.boolean().default(false),
  
  // Default value
  defaultValue: z.string()
    .max(255, 'Default value is too long')
    .optional(),
  
  // Validation rules
  minLength: z.number()
    .int('Minimum length must be an integer')
    .min(0, 'Minimum length cannot be negative')
    .optional(),
  
  maxLength: z.number()
    .int('Maximum length must be an integer')
    .min(1, 'Maximum length must be at least 1')
    .optional(),
  
  pattern: z.string()
    .max(255, 'Pattern is too long')
    .optional(),
  
  // Picklist support
  isPicklist: z.boolean().default(false),
  picklistValues: csvValidationSchema.optional(),
})
.refine((data) => {
  // Validate min/max length relationship
  if (data.minLength !== undefined && data.maxLength !== undefined) {
    return data.minLength <= data.maxLength
  }
  return true
}, {
  message: 'Minimum length cannot be greater than maximum length',
  path: ['maxLength'],
})
.refine((data) => {
  // Validate picklist values when picklist is enabled
  if (data.isPicklist && (!data.picklistValues || data.picklistValues.trim() === '')) {
    return false
  }
  return true
}, {
  message: 'Picklist values are required when picklist is enabled',
  path: ['picklistValues'],
})
.refine((data) => {
  // Validate regex pattern if provided
  if (data.pattern) {
    try {
      new RegExp(data.pattern)
      return true
    } catch {
      return false
    }
  }
  return true
}, {
  message: 'Invalid regular expression pattern',
  path: ['pattern'],
})

/**
 * Boolean field validation schema
 */
export const booleanFieldValidationSchema = z.object({
  // Core properties
  name: z.string()
    .min(1, 'Field name is required')
    .max(128, 'Field name must be less than 128 characters')
    .regex(/^[a-zA-Z][a-zA-Z0-9_]*$/, 'Field name must start with a letter and contain only letters, numbers, and underscores'),
  
  label: z.string()
    .min(1, 'Field label is required')
    .max(255, 'Field label is too long'),
  
  description: z.string()
    .max(500, 'Description is too long')
    .optional(),
  
  type: z.literal('boolean'),
  
  // Constraints
  isNullable: z.boolean().default(true),
  isPrimaryKey: z.boolean().default(false),
  
  // Default value
  defaultValue: z.union([
    z.boolean(),
    z.enum(['true', 'false', '1', '0']),
    z.null(),
  ]).optional(),
  
  // Display options
  trueLabel: z.string().max(50, 'True label is too long').default('Yes'),
  falseLabel: z.string().max(50, 'False label is too long').default('No'),
})

/**
 * Date/time field validation schema (date, datetime, timestamp, time)
 */
export const dateTimeFieldValidationSchema = z.object({
  // Core properties
  name: z.string()
    .min(1, 'Field name is required')
    .max(128, 'Field name must be less than 128 characters')
    .regex(/^[a-zA-Z][a-zA-Z0-9_]*$/, 'Field name must start with a letter and contain only letters, numbers, and underscores'),
  
  label: z.string()
    .min(1, 'Field label is required')
    .max(255, 'Field label is too long'),
  
  description: z.string()
    .max(500, 'Description is too long')
    .optional(),
  
  type: z.enum(['date', 'datetime', 'timestamp', 'time']),
  
  // Date/time-specific properties
  format: z.enum(['date_iso', 'datetime_iso', 'time_12', 'time_24']).optional(),
  timezone: z.string().max(50, 'Timezone is too long').optional(),
  
  // Constraints
  isNullable: z.boolean().default(true),
  isPrimaryKey: z.boolean().default(false),
  isUnique: z.boolean().default(false),
  
  // Auto-timestamp options
  updateOnChange: z.boolean().default(false),
  setOnCreate: z.boolean().default(false),
  
  // Default value
  defaultValue: z.union([
    z.string().datetime(),
    z.enum(['CURRENT_TIMESTAMP', 'NOW()', 'CURRENT_DATE', 'CURRENT_TIME']),
    z.null(),
  ]).optional(),
  
  // Validation rules
  minDate: z.string().datetime().optional(),
  maxDate: z.string().datetime().optional(),
})
.refine((data) => {
  // Validate min/max date relationship
  if (data.minDate && data.maxDate) {
    return new Date(data.minDate) <= new Date(data.maxDate)
  }
  return true
}, {
  message: 'Minimum date cannot be after maximum date',
  path: ['maxDate'],
})

/**
 * Binary field validation schema (binary, blob, clob)
 */
export const binaryFieldValidationSchema = z.object({
  // Core properties
  name: z.string()
    .min(1, 'Field name is required')
    .max(128, 'Field name must be less than 128 characters')
    .regex(/^[a-zA-Z][a-zA-Z0-9_]*$/, 'Field name must start with a letter and contain only letters, numbers, and underscores'),
  
  label: z.string()
    .min(1, 'Field label is required')
    .max(255, 'Field label is too long'),
  
  description: z.string()
    .max(500, 'Description is too long')
    .optional(),
  
  type: z.enum(['binary', 'blob', 'clob']),
  
  // Binary-specific properties
  maxSize: z.number()
    .int('Maximum size must be an integer')
    .min(1, 'Maximum size must be at least 1 byte')
    .max(4294967295, 'Maximum size cannot exceed 4GB')
    .optional(),
  
  allowedMimeTypes: csvValidationSchema.optional(),
  
  // Constraints
  isNullable: z.boolean().default(true),
  
  // Storage options
  storeExternally: z.boolean().default(false),
  compressData: z.boolean().default(false),
})

/**
 * JSON/XML field validation schema
 */
export const jsonXmlFieldValidationSchema = z.object({
  // Core properties
  name: z.string()
    .min(1, 'Field name is required')
    .max(128, 'Field name must be less than 128 characters')
    .regex(/^[a-zA-Z][a-zA-Z0-9_]*$/, 'Field name must start with a letter and contain only letters, numbers, and underscores'),
  
  label: z.string()
    .min(1, 'Field label is required')
    .max(255, 'Field label is too long'),
  
  description: z.string()
    .max(500, 'Description is too long')
    .optional(),
  
  type: z.enum(['json', 'xml']),
  
  // Constraints
  isNullable: z.boolean().default(true),
  
  // Validation schema
  validationSchema: jsonValidationSchema.optional(),
  
  // Default value (must be valid JSON/XML)
  defaultValue: z.string()
    .max(10000, 'Default value is too long')
    .optional(),
})
.refine((data) => {
  // Validate default value is valid JSON if type is json
  if (data.type === 'json' && data.defaultValue) {
    try {
      JSON.parse(data.defaultValue)
      return true
    } catch {
      return false
    }
  }
  return true
}, {
  message: 'Default value must be valid JSON',
  path: ['defaultValue'],
})

/**
 * UUID field validation schema
 */
export const uuidFieldValidationSchema = z.object({
  // Core properties
  name: z.string()
    .min(1, 'Field name is required')
    .max(128, 'Field name must be less than 128 characters')
    .regex(/^[a-zA-Z][a-zA-Z0-9_]*$/, 'Field name must start with a letter and contain only letters, numbers, and underscores'),
  
  label: z.string()
    .min(1, 'Field label is required')
    .max(255, 'Field label is too long'),
  
  description: z.string()
    .max(500, 'Description is too long')
    .optional(),
  
  type: z.literal('uuid'),
  
  // Constraints
  isNullable: z.boolean().default(true),
  isPrimaryKey: z.boolean().default(false),
  isUnique: z.boolean().default(true),
  
  // UUID options
  autoGenerate: z.boolean().default(true),
  uuidVersion: z.enum(['1', '4']).default('4'),
  
  // Default value (must be valid UUID format)
  defaultValue: z.string()
    .uuid('Default value must be a valid UUID')
    .optional(),
})

/**
 * Enum/Set field validation schema
 */
export const enumSetFieldValidationSchema = z.object({
  // Core properties
  name: z.string()
    .min(1, 'Field name is required')
    .max(128, 'Field name must be less than 128 characters')
    .regex(/^[a-zA-Z][a-zA-Z0-9_]*$/, 'Field name must start with a letter and contain only letters, numbers, and underscores'),
  
  label: z.string()
    .min(1, 'Field label is required')
    .max(255, 'Field label is too long'),
  
  description: z.string()
    .max(500, 'Description is too long')
    .optional(),
  
  type: z.enum(['enum', 'set']),
  
  // Enum/Set values
  values: csvValidationSchema,
  
  // Constraints
  isNullable: z.boolean().default(true),
  isPrimaryKey: z.boolean().default(false),
  
  // Default value
  defaultValue: z.string()
    .max(255, 'Default value is too long')
    .optional(),
  
  // Set-specific options
  allowMultiple: z.boolean().default(false),
  maxSelections: z.number()
    .int('Maximum selections must be an integer')
    .min(1, 'Maximum selections must be at least 1')
    .optional(),
})
.refine((data) => {
  // Ensure allowMultiple is only used with 'set' type
  if (data.allowMultiple && data.type !== 'set') {
    return false
  }
  return true
}, {
  message: 'Multiple selections are only allowed for SET type fields',
  path: ['allowMultiple'],
})
.refine((data) => {
  // Validate default value is in the values list
  if (data.defaultValue && data.values) {
    const values = data.values.split(',').map(v => v.trim())
    return values.includes(data.defaultValue)
  }
  return true
}, {
  message: 'Default value must be one of the defined values',
  path: ['defaultValue'],
})

/**
 * Geometry field validation schema (geometry, point, linestring, polygon)
 */
export const geometryFieldValidationSchema = z.object({
  // Core properties
  name: z.string()
    .min(1, 'Field name is required')
    .max(128, 'Field name must be less than 128 characters')
    .regex(/^[a-zA-Z][a-zA-Z0-9_]*$/, 'Field name must start with a letter and contain only letters, numbers, and underscores'),
  
  label: z.string()
    .min(1, 'Field label is required')
    .max(255, 'Field label is too long'),
  
  description: z.string()
    .max(500, 'Description is too long')
    .optional(),
  
  type: z.enum(['geometry', 'point', 'linestring', 'polygon']),
  
  // Geometry-specific properties
  srid: z.number()
    .int('SRID must be an integer')
    .min(0, 'SRID cannot be negative')
    .default(4326), // WGS84
  
  dimensions: z.enum(['2D', '3D', '4D']).default('2D'),
  
  // Constraints
  isNullable: z.boolean().default(true),
  isIndexed: z.boolean().default(true),
  
  // Validation rules
  allowEmptyGeometry: z.boolean().default(true),
})

// ============================================================================
// FOREIGN KEY AND RELATIONSHIP SCHEMAS
// ============================================================================

/**
 * Foreign key relationship validation schema
 */
export const foreignKeyValidationSchema = z.object({
  // Core foreign key properties
  isEnabled: z.boolean().default(false),
  
  // Referenced table and field
  refTable: z.string()
    .min(1, 'Referenced table is required')
    .max(128, 'Referenced table name is too long')
    .regex(/^[a-zA-Z][a-zA-Z0-9_]*$/, 'Referenced table name must start with a letter and contain only letters, numbers, and underscores'),
  
  refField: z.string()
    .min(1, 'Referenced field is required')
    .max(128, 'Referenced field name is too long')
    .regex(/^[a-zA-Z][a-zA-Z0-9_]*$/, 'Referenced field name must start with a letter and contain only letters, numbers, and underscores'),
  
  // Referential actions
  onUpdate: ReferentialActionSchema.default('CASCADE'),
  onDelete: ReferentialActionSchema.default('RESTRICT'),
  
  // Constraint naming
  constraintName: z.string()
    .max(128, 'Constraint name is too long')
    .regex(/^[a-zA-Z][a-zA-Z0-9_]*$/, 'Constraint name must start with a letter and contain only letters, numbers, and underscores')
    .optional(),
})

/**
 * Function usage validation schema
 */
export const functionUsageValidationSchema = z.object({
  // Core function properties
  isEnabled: z.boolean().default(false),
  
  // Function definition
  functions: z.array(dbFunctionSchema).optional(),
  
  // Function context
  applyOnInsert: z.boolean().default(false),
  applyOnUpdate: z.boolean().default(false),
  applyOnSelect: z.boolean().default(false),
})

// ============================================================================
// COMPREHENSIVE FIELD VALIDATION SCHEMA
// ============================================================================

/**
 * Base field properties shared across all field types
 */
export const baseFieldSchema = z.object({
  // Identification
  id: z.string().optional(),
  name: z.string()
    .min(1, 'Field name is required')
    .max(128, 'Field name must be less than 128 characters')
    .regex(/^[a-zA-Z][a-zA-Z0-9_]*$/, 'Field name must start with a letter and contain only letters, numbers, and underscores'),
  
  label: z.string()
    .min(1, 'Field label is required')
    .max(255, 'Field label is too long'),
  
  description: z.string()
    .max(500, 'Description is too long')
    .optional(),
  
  alias: z.string()
    .max(128, 'Alias is too long')
    .regex(/^[a-zA-Z][a-zA-Z0-9_]*$/, 'Alias must start with a letter and contain only letters, numbers, and underscores')
    .optional(),
  
  // Field type
  type: FieldTypeSchema,
  
  // Common constraints
  isNullable: z.boolean().default(true),
  isPrimaryKey: z.boolean().default(false),
  isUnique: z.boolean().default(false),
  isIndex: z.boolean().default(false),
  isVirtual: z.boolean().default(false),
  isComputed: z.boolean().default(false),
  
  // Display options
  hidden: z.boolean().default(false),
  
  // Relationships and functions
  foreignKey: foreignKeyValidationSchema.optional(),
  functionUsage: functionUsageValidationSchema.optional(),
  
  // Additional constraints
  constraints: z.array(fieldConstraintSchema).optional(),
})

/**
 * Main field validation schema with conditional validation
 * Based on field type selection, different validation rules apply
 */
export const fieldValidationSchema = z.discriminatedUnion('type', [
  numericFieldValidationSchema,
  stringFieldValidationSchema,
  booleanFieldValidationSchema,
  dateTimeFieldValidationSchema,
  binaryFieldValidationSchema,
  jsonXmlFieldValidationSchema,
  uuidFieldValidationSchema,
  enumSetFieldValidationSchema,
  geometryFieldValidationSchema,
])

/**
 * Field array validation schema for table management
 * Ensures unique field names and at least one primary key if required
 */
export const fieldArrayValidationSchema = z
  .array(fieldValidationSchema)
  .min(1, 'At least one field is required')
  .refine(
    (fields) => {
      // Check for unique field names
      const names = fields.map(f => f.name.toLowerCase())
      return names.length === new Set(names).size
    },
    {
      message: 'Field names must be unique',
    }
  )
  .refine(
    (fields) => {
      // Check for unique aliases
      const aliases = fields
        .map(f => f.alias?.toLowerCase())
        .filter(Boolean)
      return aliases.length === new Set(aliases).size
    },
    {
      message: 'Field aliases must be unique',
    }
  )

// ============================================================================
// FORM-SPECIFIC VALIDATION SCHEMAS
// ============================================================================

/**
 * Field creation form validation schema
 * Used for React Hook Form integration with real-time validation
 */
export const fieldCreationFormSchema = fieldValidationSchema.extend({
  // Form-specific properties
  tableName: z.string()
    .min(1, 'Table name is required')
    .max(128, 'Table name is too long'),
  
  serviceId: z.number()
    .int('Service ID must be an integer')
    .positive('Service ID must be positive'),
  
  // Form state
  isDirty: z.boolean().default(false),
  isSubmitting: z.boolean().default(false),
})

/**
 * Field update form validation schema
 * Allows partial updates with optional field ID
 */
export const fieldUpdateFormSchema = fieldCreationFormSchema.partial().extend({
  id: z.string().min(1, 'Field ID is required'),
  name: z.string()
    .min(1, 'Field name is required')
    .max(128, 'Field name must be less than 128 characters')
    .regex(/^[a-zA-Z][a-zA-Z0-9_]*$/, 'Field name must start with a letter and contain only letters, numbers, and underscores'),
})

/**
 * Bulk field operations validation schema
 */
export const bulkFieldOperationSchema = z.object({
  operation: z.enum(['create', 'update', 'delete']),
  fields: z.array(fieldValidationSchema.partial()).min(1, 'At least one field is required'),
  tableName: z.string().min(1, 'Table name is required'),
  serviceId: z.number().int().positive('Service ID must be positive'),
})

// ============================================================================
// DYNAMIC VALIDATION HELPERS
// ============================================================================

/**
 * Creates field type-specific validation schema
 * Enables dynamic control enabling/disabling based on field type selection
 */
export const createFieldTypeValidationSchema = (fieldType: string) => {
  switch (fieldType) {
    case 'integer':
    case 'bigint':
    case 'decimal':
    case 'float':
    case 'double':
      return numericFieldValidationSchema
    
    case 'string':
    case 'text':
      return stringFieldValidationSchema
    
    case 'boolean':
      return booleanFieldValidationSchema
    
    case 'date':
    case 'datetime':
    case 'timestamp':
    case 'time':
      return dateTimeFieldValidationSchema
    
    case 'binary':
    case 'blob':
    case 'clob':
      return binaryFieldValidationSchema
    
    case 'json':
    case 'xml':
      return jsonXmlFieldValidationSchema
    
    case 'uuid':
      return uuidFieldValidationSchema
    
    case 'enum':
    case 'set':
      return enumSetFieldValidationSchema
    
    case 'geometry':
    case 'point':
    case 'linestring':
    case 'polygon':
      return geometryFieldValidationSchema
    
    default:
      return baseFieldSchema
  }
}

/**
 * Field-type-specific property enablement configuration
 * Used for dynamic control enabling/disabling in React Hook Form
 */
export const getFieldTypeEnabledProperties = (fieldType: string) => {
  const baseProperties = ['name', 'label', 'description', 'type', 'isNullable', 'isPrimaryKey']
  
  const typeSpecificProperties: Record<string, string[]> = {
    integer: [...baseProperties, 'length', 'isUnique', 'isAutoIncrement', 'defaultValue', 'minValue', 'maxValue'],
    bigint: [...baseProperties, 'length', 'isUnique', 'isAutoIncrement', 'defaultValue', 'minValue', 'maxValue'],
    decimal: [...baseProperties, 'precision', 'scale', 'isUnique', 'defaultValue', 'minValue', 'maxValue'],
    float: [...baseProperties, 'precision', 'scale', 'isUnique', 'defaultValue', 'minValue', 'maxValue'],
    double: [...baseProperties, 'precision', 'scale', 'isUnique', 'defaultValue', 'minValue', 'maxValue'],
    string: [...baseProperties, 'length', 'isUnique', 'format', 'defaultValue', 'minLength', 'maxLength', 'pattern', 'isPicklist', 'picklistValues'],
    text: [...baseProperties, 'length', 'format', 'defaultValue', 'minLength', 'maxLength', 'pattern'],
    boolean: [...baseProperties, 'defaultValue', 'trueLabel', 'falseLabel'],
    date: [...baseProperties, 'isUnique', 'format', 'timezone', 'defaultValue', 'minDate', 'maxDate', 'setOnCreate'],
    datetime: [...baseProperties, 'isUnique', 'format', 'timezone', 'defaultValue', 'minDate', 'maxDate', 'setOnCreate', 'updateOnChange'],
    timestamp: [...baseProperties, 'isUnique', 'format', 'timezone', 'defaultValue', 'minDate', 'maxDate', 'setOnCreate', 'updateOnChange'],
    time: [...baseProperties, 'format', 'defaultValue'],
    binary: [...baseProperties, 'maxSize', 'allowedMimeTypes', 'storeExternally', 'compressData'],
    blob: [...baseProperties, 'maxSize', 'storeExternally', 'compressData'],
    clob: [...baseProperties, 'maxSize', 'storeExternally', 'compressData'],
    json: [...baseProperties, 'validationSchema', 'defaultValue'],
    xml: [...baseProperties, 'validationSchema', 'defaultValue'],
    uuid: [...baseProperties, 'isUnique', 'autoGenerate', 'uuidVersion', 'defaultValue'],
    enum: [...baseProperties, 'values', 'defaultValue'],
    set: [...baseProperties, 'values', 'defaultValue', 'allowMultiple', 'maxSelections'],
    geometry: [...baseProperties, 'srid', 'dimensions', 'isIndexed', 'allowEmptyGeometry'],
    point: [...baseProperties, 'srid', 'dimensions', 'isIndexed', 'allowEmptyGeometry'],
    linestring: [...baseProperties, 'srid', 'dimensions', 'isIndexed', 'allowEmptyGeometry'],
    polygon: [...baseProperties, 'srid', 'dimensions', 'isIndexed', 'allowEmptyGeometry'],
  }
  
  return typeSpecificProperties[fieldType] || baseProperties
}

/**
 * Performance-optimized field validation function
 * Ensures validation completes under 100ms performance target
 */
export const validateFieldProperty = <T>(
  fieldType: string,
  property: string,
  value: T
): string | undefined => {
  try {
    const schema = createFieldTypeValidationSchema(fieldType)
    const propertySchema = (schema.shape as any)[property]
    
    if (!propertySchema) {
      return undefined
    }
    
    propertySchema.parse(value)
    return undefined
  } catch (error) {
    if (error instanceof z.ZodError) {
      return error.errors[0]?.message
    }
    return 'Validation error occurred'
  }
}

// ============================================================================
// TYPE EXPORTS FOR REACT HOOK FORM INTEGRATION
// ============================================================================

export type FieldValidationFormData = z.infer<typeof fieldValidationSchema>
export type FieldCreationFormData = z.infer<typeof fieldCreationFormSchema>
export type FieldUpdateFormData = z.infer<typeof fieldUpdateFormSchema>
export type BulkFieldOperationData = z.infer<typeof bulkFieldOperationSchema>
export type ForeignKeyValidationData = z.infer<typeof foreignKeyValidationSchema>
export type FunctionUsageValidationData = z.infer<typeof functionUsageValidationSchema>

// Field type-specific form data types
export type NumericFieldFormData = z.infer<typeof numericFieldValidationSchema>
export type StringFieldFormData = z.infer<typeof stringFieldValidationSchema>
export type BooleanFieldFormData = z.infer<typeof booleanFieldValidationSchema>
export type DateTimeFieldFormData = z.infer<typeof dateTimeFieldValidationSchema>
export type BinaryFieldFormData = z.infer<typeof binaryFieldValidationSchema>
export type JsonXmlFieldFormData = z.infer<typeof jsonXmlFieldValidationSchema>
export type UuidFieldFormData = z.infer<typeof uuidFieldValidationSchema>
export type EnumSetFieldFormData = z.infer<typeof enumSetFieldValidationSchema>
export type GeometryFieldFormData = z.infer<typeof geometryFieldValidationSchema>

/**
 * React Hook Form resolver factory for field validation
 * Provides real-time validation with comprehensive error handling
 */
export const createFieldFormResolver = <T>(schema: z.ZodSchema<T>) => {
  return async (data: any) => {
    try {
      const result = await schema.parseAsync(data)
      return { values: result, errors: {} }
    } catch (error) {
      if (error instanceof z.ZodError) {
        const formErrors: Record<string, { message: string }> = {}
        error.errors.forEach((err) => {
          const path = err.path.join('.')
          formErrors[path] = { message: err.message }
        })
        return { values: {}, errors: formErrors }
      }
      throw error
    }
  }
}

/**
 * Field validation middleware for Next.js API routes
 * Provides server-side validation with comprehensive error handling
 */
export const validateFieldApiPayload = async <T>(
  schema: z.ZodSchema<T>,
  payload: any
): Promise<{ success: true; data: T } | { success: false; errors: Array<{ field: string; message: string }> }> => {
  try {
    const data = await schema.parseAsync(payload)
    return { success: true, data }
  } catch (error) {
    if (error instanceof z.ZodError) {
      const errors = error.errors.map((err) => ({
        field: err.path.join('.'),
        message: err.message,
      }))
      return { success: false, errors }
    }
    return {
      success: false,
      errors: [{ field: 'general', message: 'Field validation failed' }],
    }
  }
}