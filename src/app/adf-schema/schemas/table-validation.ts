/**
 * @fileoverview Zod validation schemas for database table management
 * 
 * Provides comprehensive validation for table creation, modification, and configuration forms.
 * Supports React Hook Form integration with type-safe validation for table metadata,
 * field relationships, constraints, and schema integrity.
 * 
 * @version 1.0.0
 * @since React 19/Next.js 15.1 migration
 */

import { z } from 'zod';

// =============================================================================
// COMMON VALIDATION PATTERNS
// =============================================================================

/**
 * Database identifier validation pattern
 * Enforces valid SQL identifier naming conventions
 */
const databaseIdentifierSchema = z
  .string()
  .min(1, 'Name is required')
  .max(64, 'Name must be less than 64 characters')
  .regex(
    /^[a-zA-Z_][a-zA-Z0-9_]*$/,
    'Name must start with a letter or underscore and contain only letters, numbers, and underscores'
  );

/**
 * Optional database identifier validation
 */
const optionalDatabaseIdentifierSchema = z
  .string()
  .max(64, 'Name must be less than 64 characters')
  .regex(
    /^[a-zA-Z_][a-zA-Z0-9_]*$/,
    'Name must start with a letter or underscore and contain only letters, numbers, and underscores'
  )
  .optional()
  .or(z.literal(''));

/**
 * Human-readable label validation
 */
const labelSchema = z
  .string()
  .min(1, 'Label is required')
  .max(255, 'Label must be less than 255 characters')
  .trim();

/**
 * Optional description validation
 */
const descriptionSchema = z
  .string()
  .max(1000, 'Description must be less than 1000 characters')
  .optional()
  .or(z.literal(''));

/**
 * CSV string validation for bulk operations
 * Migrated from Angular CsvValidator pattern
 */
const csvStringSchema = z
  .string()
  .regex(
    /^\w+(?:\s*,\s*\w+)*$/,
    'Must be comma-separated words (letters, numbers, underscores only)'
  )
  .optional()
  .or(z.literal(''));

// =============================================================================
// TABLE FIELD VALIDATION SCHEMAS
// =============================================================================

/**
 * Database field types supported by DreamFactory
 */
const fieldTypeSchema = z.enum([
  'id',
  'string',
  'text',
  'integer',
  'float',
  'double',
  'decimal',
  'boolean',
  'binary',
  'date',
  'datetime',
  'time',
  'timestamp',
  'reference',
  'user_id',
  'user_id_on_create',
  'user_id_on_update',
  'timestamp_on_create',
  'timestamp_on_update'
], {
  errorMap: () => ({ message: 'Please select a valid field type' })
});

/**
 * Validation schema for field validation rules (JSON)
 */
const fieldValidationSchema = z
  .string()
  .optional()
  .refine(
    (val) => {
      if (!val || val.trim() === '') return true;
      try {
        JSON.parse(val);
        return true;
      } catch {
        return false;
      }
    },
    { message: 'Must be valid JSON or empty' }
  );

/**
 * Validation schema for individual table field configuration
 * Based on TableField interface from existing codebase
 */
export const tableFieldSchema = z.object({
  name: databaseIdentifierSchema,
  alias: optionalDatabaseIdentifierSchema,
  label: labelSchema,
  description: descriptionSchema,
  type: fieldTypeSchema,
  dbType: z.string().optional(),
  length: z.number().int().min(0).max(65535).optional(),
  precision: z.number().int().min(0).max(65).optional(),
  scale: z.number().int().min(0).max(30).optional(),
  default: z.string().optional(),
  required: z.boolean().default(false),
  allowNull: z.boolean().default(true),
  fixedLength: z.boolean().default(false),
  supportsMultibyte: z.boolean().default(true),
  autoIncrement: z.boolean().default(false),
  isPrimaryKey: z.boolean().default(false),
  isUnique: z.boolean().default(false),
  isIndex: z.boolean().default(false),
  isForeignKey: z.boolean().default(false),
  refTable: optionalDatabaseIdentifierSchema,
  refField: optionalDatabaseIdentifierSchema,
  refOnUpdate: z.enum(['CASCADE', 'SET NULL', 'RESTRICT', 'NO ACTION']).optional(),
  refOnDelete: z.enum(['CASCADE', 'SET NULL', 'RESTRICT', 'NO ACTION']).optional(),
  picklist: csvStringSchema,
  validation: fieldValidationSchema,
  dbFunction: z.string().optional(),
  isVirtual: z.boolean().default(false),
  isAggregate: z.boolean().default(false)
}).superRefine((data, ctx) => {
  // Conditional validation for foreign key relationships
  if (data.isForeignKey) {
    if (!data.refTable || data.refTable.trim() === '') {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Reference table is required for foreign key fields',
        path: ['refTable']
      });
    }
    if (!data.refField || data.refField.trim() === '') {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Reference field is required for foreign key fields',
        path: ['refField']
      });
    }
  }

  // Length validation for string types
  if (['string', 'text'].includes(data.type) && data.fixedLength && !data.length) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'Length is required for fixed-length string fields',
      path: ['length']
    });
  }

  // Precision/scale validation for decimal types
  if (['decimal', 'float', 'double'].includes(data.type)) {
    if (data.scale && !data.precision) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Precision is required when scale is specified',
        path: ['precision']
      });
    }
    if (data.scale && data.precision && data.scale > data.precision) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Scale cannot be greater than precision',
        path: ['scale']
      });
    }
  }
});

// =============================================================================
// TABLE RELATIONSHIP VALIDATION SCHEMAS
// =============================================================================

/**
 * Relationship types supported by DreamFactory
 */
const relationshipTypeSchema = z.enum([
  'belongs_to',
  'has_one',
  'has_many',
  'many_many'
], {
  errorMap: () => ({ message: 'Please select a valid relationship type' })
});

/**
 * Validation schema for table relationships
 * Based on TableRelated interface from existing codebase
 */
export const tableRelationshipSchema = z.object({
  name: databaseIdentifierSchema,
  alias: optionalDatabaseIdentifierSchema,
  label: labelSchema,
  description: descriptionSchema,
  type: relationshipTypeSchema,
  field: databaseIdentifierSchema,
  isVirtual: z.boolean().default(false),
  refServiceID: z.number().int().min(1, 'Reference service is required'),
  refTable: databaseIdentifierSchema,
  refField: databaseIdentifierSchema,
  refOnUpdate: z.enum(['CASCADE', 'SET NULL', 'RESTRICT', 'NO ACTION']).default('RESTRICT'),
  refOnDelete: z.enum(['CASCADE', 'SET NULL', 'RESTRICT', 'NO ACTION']).default('RESTRICT'),
  junctionServiceID: z.number().int().min(1).optional(),
  junctionTable: optionalDatabaseIdentifierSchema,
  junctionField: optionalDatabaseIdentifierSchema,
  junctionRefField: optionalDatabaseIdentifierSchema,
  alwaysFetch: z.boolean().default(false),
  flatten: z.boolean().default(false),
  flattenDropPrefix: z.boolean().default(false)
}).superRefine((data, ctx) => {
  // Conditional validation for many-to-many relationships
  if (data.type === 'many_many') {
    if (!data.junctionTable || data.junctionTable.trim() === '') {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Junction table is required for many-to-many relationships',
        path: ['junctionTable']
      });
    }
    if (!data.junctionField || data.junctionField.trim() === '') {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Junction field is required for many-to-many relationships',
        path: ['junctionField']
      });
    }
    if (!data.junctionRefField || data.junctionRefField.trim() === '') {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Junction reference field is required for many-to-many relationships',
        path: ['junctionRefField']
      });
    }
  }
});

// =============================================================================
// TABLE METADATA VALIDATION SCHEMAS
// =============================================================================

/**
 * Validation schema for table creation
 * Based on TableDetailsType interface from existing codebase
 */
export const createTableSchema = z.object({
  name: databaseIdentifierSchema,
  alias: optionalDatabaseIdentifierSchema,
  label: labelSchema,
  plural: z.string().min(1, 'Plural form is required').max(255, 'Plural form must be less than 255 characters'),
  description: descriptionSchema,
  nameField: optionalDatabaseIdentifierSchema,
  fields: z.array(tableFieldSchema).min(1, 'At least one field is required'),
  relationships: z.array(tableRelationshipSchema).optional().default([])
}).superRefine((data, ctx) => {
  // Validate that at least one field is marked as primary key
  const hasPrimaryKey = data.fields.some(field => field.isPrimaryKey);
  if (!hasPrimaryKey) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'At least one field must be marked as a primary key',
      path: ['fields']
    });
  }

  // Validate unique field names
  const fieldNames = data.fields.map(field => field.name.toLowerCase());
  const duplicateFields = fieldNames.filter((name, index) => fieldNames.indexOf(name) !== index);
  if (duplicateFields.length > 0) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: `Duplicate field names: ${duplicateFields.join(', ')}`,
      path: ['fields']
    });
  }

  // Validate unique relationship names
  const relationshipNames = data.relationships.map(rel => rel.name.toLowerCase());
  const duplicateRelationships = relationshipNames.filter((name, index) => relationshipNames.indexOf(name) !== index);
  if (duplicateRelationships.length > 0) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: `Duplicate relationship names: ${duplicateRelationships.join(', ')}`,
      path: ['relationships']
    });
  }
});

/**
 * Validation schema for table modification
 * Excludes name field which cannot be changed after creation
 */
export const updateTableSchema = createTableSchema.omit({ name: true });

/**
 * Validation schema for table metadata only (without fields/relationships)
 */
export const tableMetadataSchema = z.object({
  name: databaseIdentifierSchema,
  alias: optionalDatabaseIdentifierSchema,
  label: labelSchema,
  plural: z.string().min(1, 'Plural form is required').max(255, 'Plural form must be less than 255 characters'),
  description: descriptionSchema,
  nameField: optionalDatabaseIdentifierSchema
});

/**
 * Validation schema for updating table metadata only
 */
export const updateTableMetadataSchema = tableMetadataSchema.omit({ name: true });

// =============================================================================
// TABLE FILTERING AND SEARCH SCHEMAS
// =============================================================================

/**
 * Sort direction for table operations
 */
const sortDirectionSchema = z.enum(['asc', 'desc'], {
  errorMap: () => ({ message: 'Sort direction must be ascending or descending' })
});

/**
 * Validation schema for table filtering and search operations
 * Supports TanStack Table integration requirements
 */
export const tableFilterSchema = z.object({
  search: z.string().max(255, 'Search term must be less than 255 characters').optional(),
  sortBy: z.string().optional(),
  sortDirection: sortDirectionSchema.optional(),
  page: z.number().int().min(1, 'Page must be greater than 0').default(1),
  pageSize: z.number().int().min(1).max(1000, 'Page size must be between 1 and 1000').default(25),
  filters: z.record(z.string(), z.string()).optional().default({})
});

/**
 * Validation schema for bulk table operations
 */
export const bulkTableOperationSchema = z.object({
  tableIds: z.array(z.string().min(1)).min(1, 'At least one table must be selected'),
  operation: z.enum(['delete', 'export', 'backup'], {
    errorMap: () => ({ message: 'Please select a valid operation' })
  }),
  confirmDeletion: z.boolean().optional()
}).superRefine((data, ctx) => {
  // Require confirmation for delete operations
  if (data.operation === 'delete' && !data.confirmDeletion) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'Deletion confirmation is required',
      path: ['confirmDeletion']
    });
  }
});

// =============================================================================
// SCHEMA INTEGRITY VALIDATION
// =============================================================================

/**
 * Validation schema for schema integrity checks
 * Ensures table modifications maintain data consistency
 */
export const schemaIntegritySchema = z.object({
  checkConstraints: z.boolean().default(true),
  checkReferences: z.boolean().default(true),
  allowDataLoss: z.boolean().default(false),
  backupBeforeChange: z.boolean().default(true),
  validateExistingData: z.boolean().default(true)
});

/**
 * Validation schema for table alteration operations
 */
export const alterTableSchema = z.object({
  tableName: databaseIdentifierSchema,
  operation: z.enum(['add_field', 'modify_field', 'drop_field', 'add_relationship', 'modify_relationship', 'drop_relationship']),
  fieldChanges: z.array(tableFieldSchema).optional(),
  relationshipChanges: z.array(tableRelationshipSchema).optional(),
  integrityChecks: schemaIntegritySchema.optional().default({
    checkConstraints: true,
    checkReferences: true,
    allowDataLoss: false,
    backupBeforeChange: true,
    validateExistingData: true
  })
}).superRefine((data, ctx) => {
  // Validate that appropriate changes are provided based on operation
  const fieldOps = ['add_field', 'modify_field', 'drop_field'];
  const relationshipOps = ['add_relationship', 'modify_relationship', 'drop_relationship'];

  if (fieldOps.includes(data.operation) && (!data.fieldChanges || data.fieldChanges.length === 0)) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'Field changes are required for field operations',
      path: ['fieldChanges']
    });
  }

  if (relationshipOps.includes(data.operation) && (!data.relationshipChanges || data.relationshipChanges.length === 0)) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'Relationship changes are required for relationship operations',
      path: ['relationshipChanges']
    });
  }
});

// =============================================================================
// TYPE EXPORTS FOR REACT HOOK FORM INTEGRATION
// =============================================================================

/**
 * TypeScript types inferred from Zod schemas for React Hook Form integration
 */
export type TableFieldFormData = z.infer<typeof tableFieldSchema>;
export type TableRelationshipFormData = z.infer<typeof tableRelationshipSchema>;
export type CreateTableFormData = z.infer<typeof createTableSchema>;
export type UpdateTableFormData = z.infer<typeof updateTableSchema>;
export type TableMetadataFormData = z.infer<typeof tableMetadataSchema>;
export type UpdateTableMetadataFormData = z.infer<typeof updateTableMetadataSchema>;
export type TableFilterFormData = z.infer<typeof tableFilterSchema>;
export type BulkTableOperationFormData = z.infer<typeof bulkTableOperationSchema>;
export type SchemaIntegrityFormData = z.infer<typeof schemaIntegritySchema>;
export type AlterTableFormData = z.infer<typeof alterTableSchema>;

// =============================================================================
// DEFAULT VALUES FOR FORM INITIALIZATION
// =============================================================================

/**
 * Default values for table field creation
 */
export const defaultTableField: Partial<TableFieldFormData> = {
  required: false,
  allowNull: true,
  fixedLength: false,
  supportsMultibyte: true,
  autoIncrement: false,
  isPrimaryKey: false,
  isUnique: false,
  isIndex: false,
  isForeignKey: false,
  isVirtual: false,
  isAggregate: false
};

/**
 * Default values for table relationship creation
 */
export const defaultTableRelationship: Partial<TableRelationshipFormData> = {
  isVirtual: false,
  refOnUpdate: 'RESTRICT',
  refOnDelete: 'RESTRICT',
  alwaysFetch: false,
  flatten: false,
  flattenDropPrefix: false
};

/**
 * Default values for table filtering
 */
export const defaultTableFilter: TableFilterFormData = {
  page: 1,
  pageSize: 25,
  filters: {}
};

/**
 * Default values for schema integrity checks
 */
export const defaultSchemaIntegrity: SchemaIntegrityFormData = {
  checkConstraints: true,
  checkReferences: true,
  allowDataLoss: false,
  backupBeforeChange: true,
  validateExistingData: true
};