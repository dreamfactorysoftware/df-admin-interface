/**
 * Comprehensive Zod validation schemas for database table management
 * 
 * This module provides type-safe validation for:
 * - Table creation and modification workflows
 * - Field relationships and constraints
 * - Schema integrity validation
 * - TanStack Table integration for large datasets
 * - React Hook Form integration with real-time validation under 100ms
 * 
 * Supports React/Next.js Integration Requirements and Schema Discovery feature F-002
 * per Section 2.1 Feature Catalog with comprehensive error handling per Section 4.2.2.3
 */

import { z } from 'zod';
import type { FieldType, ReferentialAction, ConstraintType, RelationshipType } from '../../../types/schema';

// ============================================================================
// CORE TABLE VALIDATION SCHEMAS
// ============================================================================

/**
 * Base table name validation with database naming conventions
 * Supports real-time validation under 100ms per React/Next.js Integration Requirements
 */
export const tableNameSchema = z
  .string()
  .min(1, 'Table name is required')
  .max(64, 'Table name must be less than 64 characters')
  .regex(
    /^[a-zA-Z_][a-zA-Z0-9_]*$/,
    'Table name must start with letter or underscore, followed by letters, numbers, or underscores'
  )
  .refine(
    (name) => !['table', 'index', 'view', 'select', 'insert', 'update', 'delete', 'drop', 'create', 'alter'].includes(name.toLowerCase()),
    'Table name cannot be a reserved SQL keyword'
  );

/**
 * Table label validation for display purposes
 */
export const tableLabelSchema = z
  .string()
  .min(1, 'Table label is required')
  .max(128, 'Table label must be less than 128 characters')
  .trim();

/**
 * Table description validation
 */
export const tableDescriptionSchema = z
  .string()
  .max(1000, 'Description must be less than 1000 characters')
  .trim()
  .optional();

/**
 * Table alias validation for API generation
 */
export const tableAliasSchema = z
  .string()
  .max(64, 'Alias must be less than 64 characters')
  .regex(
    /^[a-zA-Z_][a-zA-Z0-9_]*$/,
    'Alias must start with letter or underscore, followed by letters, numbers, or underscores'
  )
  .optional();

/**
 * Table plural form validation for REST API endpoints
 */
export const tablePluralSchema = z
  .string()
  .min(1, 'Plural form is required when specified')
  .max(128, 'Plural form must be less than 128 characters')
  .regex(
    /^[a-zA-Z_][a-zA-Z0-9_]*$/,
    'Plural form must start with letter or underscore, followed by letters, numbers, or underscores'
  )
  .optional();

// ============================================================================
// FIELD VALIDATION SCHEMAS
// ============================================================================

/**
 * Field name validation for table fields
 */
export const fieldNameSchema = z
  .string()
  .min(1, 'Field name is required')
  .max(64, 'Field name must be less than 64 characters')
  .regex(
    /^[a-zA-Z_][a-zA-Z0-9_]*$/,
    'Field name must start with letter or underscore, followed by letters, numbers, or underscores'
  )
  .refine(
    (name) => !['id', 'created_date', 'last_modified_date', 'created_by_id', 'last_modified_by_id'].includes(name.toLowerCase()) || 
    ['id', 'created_date', 'last_modified_date', 'created_by_id', 'last_modified_by_id'].includes(name.toLowerCase()),
    'Field name conflicts with system fields'
  );

/**
 * Field type validation schema
 */
export const fieldTypeSchema = z.enum([
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
  'polygon'
] as const);

/**
 * Field length validation for string and binary types
 */
export const fieldLengthSchema = z
  .number()
  .int('Length must be an integer')
  .min(1, 'Length must be greater than 0')
  .max(65535, 'Length cannot exceed 65535 characters')
  .optional();

/**
 * Field precision validation for numeric types
 */
export const fieldPrecisionSchema = z
  .number()
  .int('Precision must be an integer')
  .min(1, 'Precision must be greater than 0')
  .max(65, 'Precision cannot exceed 65 digits')
  .optional();

/**
 * Field scale validation for decimal types
 */
export const fieldScaleSchema = z
  .number()
  .int('Scale must be an integer')
  .min(0, 'Scale cannot be negative')
  .max(30, 'Scale cannot exceed 30 digits')
  .optional();

/**
 * Field default value validation
 */
export const fieldDefaultValueSchema = z
  .union([
    z.string(),
    z.number(),
    z.boolean(),
    z.null(),
    z.literal('CURRENT_TIMESTAMP'),
    z.literal('NOW()'),
    z.literal('UUID()'),
    z.literal('AUTO_INCREMENT')
  ])
  .optional();

/**
 * Referential action validation for foreign key constraints
 */
export const referentialActionSchema = z.enum([
  'NO ACTION',
  'RESTRICT',
  'CASCADE',
  'SET NULL',
  'SET DEFAULT'
] as const);

// ============================================================================
// TABLE CREATION AND MODIFICATION SCHEMAS
// ============================================================================

/**
 * Table field definition schema for creation and modification
 * Integrates with React Hook Form for real-time validation
 */
export const tableFieldSchema = z.object({
  id: z.string().uuid('Invalid field ID format').optional(),
  name: fieldNameSchema,
  label: z.string().min(1, 'Field label is required').max(128, 'Field label too long'),
  description: z.string().max(500, 'Field description too long').optional(),
  alias: z.string().max(64, 'Field alias too long').optional(),
  
  // Data type configuration
  type: fieldTypeSchema,
  dbType: z.string().min(1, 'Database type is required'),
  length: fieldLengthSchema,
  precision: fieldPrecisionSchema,
  scale: fieldScaleSchema,
  defaultValue: fieldDefaultValueSchema,
  
  // Field constraints
  isNullable: z.boolean().default(true),
  allowNull: z.boolean().default(true),
  isPrimaryKey: z.boolean().default(false),
  isForeignKey: z.boolean().default(false),
  isUnique: z.boolean().default(false),
  isIndex: z.boolean().default(false),
  isAutoIncrement: z.boolean().default(false),
  isComputed: z.boolean().default(false).optional(),
  isVirtual: z.boolean().default(false),
  isAggregate: z.boolean().default(false),
  required: z.boolean().default(false),
  fixedLength: z.boolean().default(false),
  supportsMultibyte: z.boolean().default(true),
  
  // Foreign key reference configuration
  refTable: z.string().optional(),
  refField: z.string().optional(),
  refOnUpdate: referentialActionSchema.optional(),
  refOnDelete: referentialActionSchema.optional(),
  
  // Field validation rules
  validation: z.object({
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
    validateOnChange: z.boolean().default(true),
    validateOnBlur: z.boolean().default(true),
    debounceMs: z.number().min(0).max(1000).default(300),
  }).optional(),
  
  // UI display configuration
  hidden: z.boolean().default(false),
  format: z.object({
    mask: z.string().optional(),
    placeholder: z.string().optional(),
    prefix: z.string().optional(),
    suffix: z.string().optional(),
    uppercase: z.boolean().optional(),
    lowercase: z.boolean().optional(),
    capitalize: z.boolean().optional(),
    dateFormat: z.string().optional(),
    currencyCode: z.string().optional(),
    thousandsSeparator: z.string().optional(),
    decimalSeparator: z.string().optional(),
  }).optional(),
  
  // Picklist values for enum/set types
  picklist: z.array(z.string()).optional(),
})
.refine(
  (field) => {
    // Validate that foreign key fields have reference information
    if (field.isForeignKey) {
      return field.refTable && field.refField;
    }
    return true;
  },
  {
    message: 'Foreign key fields must specify reference table and field',
    path: ['refTable']
  }
)
.refine(
  (field) => {
    // Validate numeric constraints for numeric types
    const numericTypes = ['integer', 'bigint', 'decimal', 'float', 'double'];
    if (numericTypes.includes(field.type) && field.validation?.min !== undefined && field.validation?.max !== undefined) {
      return field.validation.min <= field.validation.max;
    }
    return true;
  },
  {
    message: 'Minimum value must be less than or equal to maximum value',
    path: ['validation', 'max']
  }
)
.refine(
  (field) => {
    // Validate precision and scale for decimal types
    if (field.type === 'decimal' && field.precision !== undefined && field.scale !== undefined) {
      return field.scale <= field.precision;
    }
    return true;
  },
  {
    message: 'Scale must be less than or equal to precision',
    path: ['scale']
  }
);

/**
 * Foreign key constraint schema for table relationships
 */
export const foreignKeyConstraintSchema = z.object({
  name: z.string().min(1, 'Constraint name is required').max(64, 'Constraint name too long'),
  field: fieldNameSchema,
  referencedTable: tableNameSchema,
  referencedField: fieldNameSchema,
  onDelete: referentialActionSchema.default('NO ACTION'),
  onUpdate: referentialActionSchema.default('NO ACTION'),
  deferrable: z.boolean().default(false),
  initiallyDeferred: z.boolean().default(false),
});

/**
 * Table index schema for performance optimization
 */
export const tableIndexSchema = z.object({
  name: z.string().min(1, 'Index name is required').max(64, 'Index name too long'),
  fields: z.array(fieldNameSchema).min(1, 'Index must include at least one field'),
  unique: z.boolean().default(false),
  type: z.enum([
    'btree',
    'hash',
    'gist',
    'gin',
    'brin',
    'spgist',
    'bitmap',
    'clustered',
    'nonclustered'
  ]).optional(),
  method: z.string().optional(),
  condition: z.string().optional(),
  partial: z.boolean().default(false),
  clustered: z.boolean().default(false),
  fillFactor: z.number().min(1).max(100).optional(),
});

/**
 * Table constraint schema for data integrity
 */
export const tableConstraintSchema = z.object({
  name: z.string().min(1, 'Constraint name is required').max(64, 'Constraint name too long'),
  type: z.enum([
    'check',
    'unique',
    'foreign_key',
    'primary_key',
    'default',
    'not_null',
    'exclude',
    'partial'
  ]),
  definition: z.string().min(1, 'Constraint definition is required'),
  fields: z.array(fieldNameSchema).min(1, 'Constraint must apply to at least one field'),
  condition: z.string().optional(),
  deferrable: z.boolean().default(false),
  initiallyDeferred: z.boolean().default(false),
});

/**
 * Table relationship schema for API generation
 */
export const tableRelationshipSchema = z.object({
  id: z.string().uuid('Invalid relationship ID format').optional(),
  alias: z.string().min(1, 'Relationship alias is required').max(64, 'Alias too long'),
  name: z.string().min(1, 'Relationship name is required').max(64, 'Name too long'),
  label: z.string().min(1, 'Relationship label is required').max(128, 'Label too long'),
  description: z.string().max(500, 'Description too long').optional(),
  
  // Relationship configuration
  type: z.enum([
    'belongs_to',
    'has_many',
    'has_one',
    'many_many',
    'polymorphic',
    'through'
  ]),
  field: fieldNameSchema,
  isVirtual: z.boolean().default(false),
  
  // Reference configuration
  refServiceId: z.number().int('Service ID must be an integer').min(1, 'Invalid service ID'),
  refTable: tableNameSchema,
  refField: fieldNameSchema,
  refOnUpdate: referentialActionSchema.optional(),
  refOnDelete: referentialActionSchema.optional(),
  
  // Junction table configuration for many-to-many relationships
  junctionServiceId: z.number().int().optional(),
  junctionTable: tableNameSchema.optional(),
  junctionField: fieldNameSchema.optional(),
  junctionRefField: fieldNameSchema.optional(),
  
  // Fetch behavior
  alwaysFetch: z.boolean().default(false),
  flatten: z.boolean().default(false),
  flattenDropPrefix: z.boolean().default(false),
})
.refine(
  (rel) => {
    // Validate many-to-many relationships have junction table information
    if (rel.type === 'many_many') {
      return rel.junctionTable && rel.junctionField && rel.junctionRefField;
    }
    return true;
  },
  {
    message: 'Many-to-many relationships must specify junction table configuration',
    path: ['junctionTable']
  }
);

// ============================================================================
// MAIN TABLE SCHEMAS
// ============================================================================

/**
 * Table creation schema with comprehensive validation
 * Supports React Hook Form integration and real-time validation under 100ms
 */
export const tableCreationSchema = z.object({
  // Basic table information
  name: tableNameSchema,
  label: tableLabelSchema,
  description: tableDescriptionSchema,
  schema: z.string().max(64, 'Schema name too long').optional(),
  alias: tableAliasSchema,
  plural: tablePluralSchema,
  isView: z.boolean().default(false),
  
  // Table fields
  fields: z.array(tableFieldSchema)
    .min(1, 'Table must have at least one field')
    .max(1000, 'Table cannot have more than 1000 fields'),
  
  // Primary key configuration
  primaryKey: z.array(fieldNameSchema)
    .min(1, 'Table must have a primary key')
    .max(16, 'Primary key cannot have more than 16 fields'),
  
  // Constraints and relationships
  foreignKeys: z.array(foreignKeyConstraintSchema).default([]),
  indexes: z.array(tableIndexSchema).default([]),
  constraints: z.array(tableConstraintSchema).default([]),
  related: z.array(tableRelationshipSchema).default([]),
  
  // Table metadata
  nameField: fieldNameSchema.optional(),
  collation: z.string().max(64, 'Collation name too long').optional(),
  engine: z.string().max(32, 'Engine name too long').optional(),
  
  // API configuration
  apiEnabled: z.boolean().default(true),
  access: z.number().int().min(0).max(31).default(31), // Binary permission flags
})
.refine(
  (table) => {
    // Validate that primary key fields exist in the table
    const fieldNames = table.fields.map(f => f.name);
    return table.primaryKey.every(pk => fieldNames.includes(pk));
  },
  {
    message: 'Primary key fields must exist in the table',
    path: ['primaryKey']
  }
)
.refine(
  (table) => {
    // Validate that foreign key fields exist in the table
    const fieldNames = table.fields.map(f => f.name);
    return table.foreignKeys.every(fk => fieldNames.includes(fk.field));
  },
  {
    message: 'Foreign key fields must exist in the table',
    path: ['foreignKeys']
  }
)
.refine(
  (table) => {
    // Validate that index fields exist in the table
    const fieldNames = table.fields.map(f => f.name);
    return table.indexes.every(idx => idx.fields.every(field => fieldNames.includes(field)));
  },
  {
    message: 'Index fields must exist in the table',
    path: ['indexes']
  }
)
.refine(
  (table) => {
    // Validate field name uniqueness
    const fieldNames = table.fields.map(f => f.name.toLowerCase());
    return fieldNames.length === new Set(fieldNames).size;
  },
  {
    message: 'Field names must be unique within the table',
    path: ['fields']
  }
)
.refine(
  (table) => {
    // Validate that only one auto-increment field exists
    const autoIncrementFields = table.fields.filter(f => f.isAutoIncrement);
    return autoIncrementFields.length <= 1;
  },
  {
    message: 'Table can have at most one auto-increment field',
    path: ['fields']
  }
)
.refine(
  (table) => {
    // Validate that auto-increment fields are part of primary key
    const autoIncrementFields = table.fields.filter(f => f.isAutoIncrement);
    if (autoIncrementFields.length > 0) {
      return autoIncrementFields.every(f => table.primaryKey.includes(f.name));
    }
    return true;
  },
  {
    message: 'Auto-increment fields must be part of the primary key',
    path: ['fields']
  }
);

/**
 * Table modification schema for updating existing tables
 * Extends creation schema with additional validation for modifications
 */
export const tableModificationSchema = tableCreationSchema.extend({
  id: z.string().uuid('Invalid table ID format'),
  originalName: tableNameSchema.optional(), // For tracking renames
  
  // Modification metadata
  lastModified: z.string().datetime('Invalid datetime format').optional(),
  modificationReason: z.string().max(500, 'Modification reason too long').optional(),
  
  // Field modifications
  addedFields: z.array(tableFieldSchema).default([]),
  modifiedFields: z.array(tableFieldSchema).default([]),
  removedFields: z.array(z.string().uuid()).default([]),
  
  // Constraint modifications
  addedConstraints: z.array(tableConstraintSchema).default([]),
  modifiedConstraints: z.array(tableConstraintSchema).default([]),
  removedConstraints: z.array(z.string()).default([]),
  
  // Index modifications
  addedIndexes: z.array(tableIndexSchema).default([]),
  modifiedIndexes: z.array(tableIndexSchema).default([]),
  removedIndexes: z.array(z.string()).default([]),
  
  // Relationship modifications
  addedRelationships: z.array(tableRelationshipSchema).default([]),
  modifiedRelationships: z.array(tableRelationshipSchema).default([]),
  removedRelationships: z.array(z.string().uuid()).default([]),
})
.refine(
  (table) => {
    // Validate that primary key changes don't break existing relationships
    // This would require additional context about existing relationships
    return true; // Placeholder for complex validation
  },
  {
    message: 'Primary key changes may break existing relationships',
    path: ['primaryKey']
  }
)
.refine(
  (table) => {
    // Validate that field removals don't break constraints
    const remainingFields = table.fields.filter(f => !table.removedFields.includes(f.id || ''));
    const remainingFieldNames = remainingFields.map(f => f.name);
    
    return table.constraints.every(constraint => 
      constraint.fields.every(field => remainingFieldNames.includes(field))
    );
  },
  {
    message: 'Cannot remove fields that are used in constraints',
    path: ['removedFields']
  }
);

// ============================================================================
// TANSTACK TABLE INTEGRATION SCHEMAS
// ============================================================================

/**
 * Table filtering schema for TanStack Table integration
 * Supports large dataset handling with 1000+ tables per Section 5.2 Component Details
 */
export const tableFilterSchema = z.object({
  // Text search
  search: z.string().max(255, 'Search term too long').optional(),
  
  // Filter by table properties
  tableType: z.enum(['table', 'view', 'both']).default('both'),
  apiEnabled: z.boolean().optional(),
  hasRelationships: z.boolean().optional(),
  hasPrimaryKey: z.boolean().optional(),
  hasIndexes: z.boolean().optional(),
  
  // Filter by field properties
  fieldCount: z.object({
    min: z.number().int().min(0).optional(),
    max: z.number().int().min(0).optional(),
  }).optional(),
  
  // Filter by data types
  containsFieldTypes: z.array(fieldTypeSchema).optional(),
  
  // Filter by constraints
  hasConstraints: z.boolean().optional(),
  constraintTypes: z.array(z.enum([
    'check',
    'unique',
    'foreign_key',
    'primary_key',
    'default',
    'not_null',
    'exclude',
    'partial'
  ])).optional(),
  
  // Date filters
  createdAfter: z.string().datetime().optional(),
  createdBefore: z.string().datetime().optional(),
  modifiedAfter: z.string().datetime().optional(),
  modifiedBefore: z.string().datetime().optional(),
  
  // Schema filters
  schemas: z.array(z.string()).optional(),
  engines: z.array(z.string()).optional(),
})
.refine(
  (filter) => {
    // Validate field count range
    if (filter.fieldCount?.min !== undefined && filter.fieldCount?.max !== undefined) {
      return filter.fieldCount.min <= filter.fieldCount.max;
    }
    return true;
  },
  {
    message: 'Minimum field count must be less than or equal to maximum',
    path: ['fieldCount', 'max']
  }
)
.refine(
  (filter) => {
    // Validate date ranges
    if (filter.createdAfter && filter.createdBefore) {
      return new Date(filter.createdAfter) <= new Date(filter.createdBefore);
    }
    return true;
  },
  {
    message: 'Created after date must be before created before date',
    path: ['createdBefore']
  }
)
.refine(
  (filter) => {
    // Validate modification date ranges
    if (filter.modifiedAfter && filter.modifiedBefore) {
      return new Date(filter.modifiedAfter) <= new Date(filter.modifiedBefore);
    }
    return true;
  },
  {
    message: 'Modified after date must be before modified before date',
    path: ['modifiedBefore']
  }
);

/**
 * Table sorting schema for TanStack Table
 */
export const tableSortingSchema = z.object({
  field: z.enum([
    'name',
    'label',
    'description',
    'fieldCount',
    'relationshipCount',
    'indexCount',
    'constraintCount',
    'rowCount',
    'estimatedSize',
    'lastModified',
    'apiEnabled',
    'engine',
    'collation'
  ]),
  direction: z.enum(['asc', 'desc']).default('asc'),
});

/**
 * Table pagination schema for virtual scrolling
 */
export const tablePaginationSchema = z.object({
  page: z.number().int().min(0).default(0),
  pageSize: z.number().int().min(10).max(1000).default(50),
  offset: z.number().int().min(0).optional(),
  cursor: z.string().optional(),
  
  // Virtual scrolling configuration
  virtualScrolling: z.object({
    enabled: z.boolean().default(true),
    estimatedRowHeight: z.number().min(20).max(200).default(40),
    overscan: z.number().int().min(1).max(100).default(10),
    scrollingDelay: z.number().min(0).max(1000).default(150),
  }).optional(),
});

/**
 * Complete table query schema combining filtering, sorting, and pagination
 * Optimized for TanStack Table with virtual scrolling support
 */
export const tableQuerySchema = z.object({
  serviceName: z.string().min(1, 'Service name is required'),
  serviceId: z.number().int().min(1, 'Invalid service ID'),
  
  // Query parameters
  filter: tableFilterSchema.default({}),
  sort: z.array(tableSortingSchema).default([]),
  pagination: tablePaginationSchema.default({}),
  
  // Performance optimization
  includeMetadata: z.boolean().default(true),
  includeRowCounts: z.boolean().default(false),
  includeRelationships: z.boolean().default(true),
  includeIndexes: z.boolean().default(true),
  includeConstraints: z.boolean().default(true),
  
  // Caching configuration
  cacheKey: z.string().optional(),
  cacheTTL: z.number().int().min(0).max(3600).default(300), // 5 minutes default
  backgroundRefresh: z.boolean().default(true),
});

// ============================================================================
// SCHEMA INTEGRITY VALIDATION
// ============================================================================

/**
 * Schema integrity validation schema for table modifications
 * Ensures database consistency and prevents breaking changes
 */
export const schemaIntegrityValidationSchema = z.object({
  // Tables being validated
  tables: z.array(tableModificationSchema),
  
  // Validation context
  serviceName: z.string().min(1, 'Service name is required'),
  serviceId: z.number().int().min(1, 'Invalid service ID'),
  databaseType: z.enum(['mysql', 'postgresql', 'oracle', 'mongodb', 'snowflake']),
  
  // Validation options
  validateReferences: z.boolean().default(true),
  validateConstraints: z.boolean().default(true),
  validateIndexes: z.boolean().default(true),
  validateRelationships: z.boolean().default(true),
  allowBreakingChanges: z.boolean().default(false),
  
  // Dependency validation
  checkCircularReferences: z.boolean().default(true),
  checkOrphanedReferences: z.boolean().default(true),
  checkDuplicateConstraints: z.boolean().default(true),
  checkNameConflicts: z.boolean().default(true),
  
  // Performance validation
  maxTableCount: z.number().int().min(1).max(10000).default(1000),
  maxFieldCountPerTable: z.number().int().min(1).max(1000).default(500),
  maxIndexCountPerTable: z.number().int().min(0).max(100).default(50),
  maxConstraintCountPerTable: z.number().int().min(0).max(100).default(50),
});

/**
 * Validation result schema for schema integrity checks
 */
export const validationResultSchema = z.object({
  isValid: z.boolean(),
  errors: z.array(z.object({
    type: z.enum([
      'naming_conflict',
      'circular_reference',
      'orphaned_reference',
      'invalid_constraint',
      'missing_field',
      'breaking_change',
      'performance_concern',
      'database_specific'
    ]),
    severity: z.enum(['error', 'warning', 'info']),
    message: z.string(),
    details: z.string().optional(),
    tableName: z.string().optional(),
    fieldName: z.string().optional(),
    constraintName: z.string().optional(),
    indexName: z.string().optional(),
    relationshipName: z.string().optional(),
    suggestion: z.string().optional(),
    code: z.string().optional(),
  })),
  warnings: z.array(z.object({
    type: z.string(),
    message: z.string(),
    details: z.string().optional(),
    suggestion: z.string().optional(),
  })),
  performance: z.object({
    estimatedImpact: z.enum(['low', 'medium', 'high']),
    recommendations: z.array(z.string()),
    metrics: z.object({
      totalTables: z.number().int(),
      totalFields: z.number().int(),
      totalIndexes: z.number().int(),
      totalConstraints: z.number().int(),
      totalRelationships: z.number().int(),
      complexityScore: z.number().min(0).max(100),
    }),
  }),
  compatibility: z.object({
    databaseSpecific: z.array(z.object({
      database: z.string(),
      supported: z.boolean(),
      limitations: z.array(z.string()),
      alternatives: z.array(z.string()),
    })),
  }),
});

// ============================================================================
// FORM INTEGRATION SCHEMAS
// ============================================================================

/**
 * React Hook Form configuration schema for table forms
 * Supports real-time validation under 100ms per React/Next.js Integration Requirements
 */
export const tableFormConfigSchema = z.object({
  // Form mode
  mode: z.enum(['create', 'edit', 'clone', 'view']),
  
  // Validation configuration
  validateOnChange: z.boolean().default(true),
  validateOnBlur: z.boolean().default(true),
  validateOnSubmit: z.boolean().default(true),
  reValidateMode: z.enum(['onChange', 'onBlur', 'onSubmit']).default('onChange'),
  
  // Performance optimization
  debounceMs: z.number().min(0).max(1000).default(300),
  shouldFocusError: z.boolean().default(true),
  shouldUnregister: z.boolean().default(false),
  shouldUseNativeValidation: z.boolean().default(false),
  
  // Field configuration
  defaultValues: z.record(z.any()).optional(),
  requiredFields: z.array(z.string()).default([]),
  readOnlyFields: z.array(z.string()).default([]),
  hiddenFields: z.array(z.string()).default([]),
  
  // Conditional logic
  conditionalFields: z.array(z.object({
    field: z.string(),
    condition: z.string(),
    action: z.enum(['show', 'hide', 'require', 'disable']),
    dependsOn: z.array(z.string()),
  })).default([]),
  
  // Validation groups
  validationGroups: z.array(z.object({
    name: z.string(),
    fields: z.array(z.string()),
    validator: z.string(),
    message: z.string(),
  })).default([]),
  
  // Auto-save configuration
  autoSave: z.object({
    enabled: z.boolean().default(false),
    debounceMs: z.number().min(1000).max(30000).default(5000),
    excludeFields: z.array(z.string()).default([]),
  }).optional(),
});

/**
 * Table form submission schema
 */
export const tableFormSubmissionSchema = z.object({
  action: z.enum(['create', 'update', 'delete', 'validate']),
  data: z.union([
    tableCreationSchema,
    tableModificationSchema,
    z.object({ id: z.string().uuid() }) // For delete operations
  ]),
  
  // Submission options
  validateBeforeSubmit: z.boolean().default(true),
  optimisticUpdate: z.boolean().default(true),
  skipIntegrityCheck: z.boolean().default(false),
  
  // Metadata
  submittedBy: z.string().optional(),
  submissionReason: z.string().max(500).optional(),
  tags: z.array(z.string()).default([]),
});

// ============================================================================
// TYPE EXPORTS AND UTILITIES
// ============================================================================

/**
 * Inferred TypeScript types from Zod schemas
 * Provides compile-time type safety for React components
 */
export type TableCreationFormData = z.infer<typeof tableCreationSchema>;
export type TableModificationFormData = z.infer<typeof tableModificationSchema>;
export type TableFieldFormData = z.infer<typeof tableFieldSchema>;
export type TableRelationshipFormData = z.infer<typeof tableRelationshipSchema>;
export type ForeignKeyConstraintFormData = z.infer<typeof foreignKeyConstraintSchema>;
export type TableIndexFormData = z.infer<typeof tableIndexSchema>;
export type TableConstraintFormData = z.infer<typeof tableConstraintSchema>;
export type TableFilterFormData = z.infer<typeof tableFilterSchema>;
export type TableSortingFormData = z.infer<typeof tableSortingSchema>;
export type TablePaginationFormData = z.infer<typeof tablePaginationSchema>;
export type TableQueryFormData = z.infer<typeof tableQuerySchema>;
export type SchemaIntegrityValidationFormData = z.infer<typeof schemaIntegrityValidationSchema>;
export type ValidationResultData = z.infer<typeof validationResultSchema>;
export type TableFormConfigData = z.infer<typeof tableFormConfigSchema>;
export type TableFormSubmissionData = z.infer<typeof tableFormSubmissionSchema>;

/**
 * Validation utility functions for React Hook Form integration
 */
export const TableValidationUtils = {
  /**
   * Validates table name uniqueness within a service
   */
  createUniqueTableNameValidator: (existingTables: string[], currentTable?: string) => 
    z.string().refine(
      (name) => {
        const lowerName = name.toLowerCase();
        const existingLowerNames = existingTables.map(t => t.toLowerCase());
        const currentLowerName = currentTable?.toLowerCase();
        
        return !existingLowerNames.includes(lowerName) || lowerName === currentLowerName;
      },
      { message: 'Table name must be unique within the service' }
    ),

  /**
   * Validates field name uniqueness within a table
   */
  createUniqueFieldNameValidator: (existingFields: string[], currentField?: string) =>
    z.string().refine(
      (name) => {
        const lowerName = name.toLowerCase();
        const existingLowerNames = existingFields.map(f => f.toLowerCase());
        const currentLowerName = currentField?.toLowerCase();
        
        return !existingLowerNames.includes(lowerName) || lowerName === currentLowerName;
      },
      { message: 'Field name must be unique within the table' }
    ),

  /**
   * Validates constraint name uniqueness within a table
   */
  createUniqueConstraintNameValidator: (existingConstraints: string[], currentConstraint?: string) =>
    z.string().refine(
      (name) => {
        const lowerName = name.toLowerCase();
        const existingLowerNames = existingConstraints.map(c => c.toLowerCase());
        const currentLowerName = currentConstraint?.toLowerCase();
        
        return !existingLowerNames.includes(lowerName) || lowerName === currentLowerName;
      },
      { message: 'Constraint name must be unique within the table' }
    ),

  /**
   * Validates index name uniqueness within a table
   */
  createUniqueIndexNameValidator: (existingIndexes: string[], currentIndex?: string) =>
    z.string().refine(
      (name) => {
        const lowerName = name.toLowerCase();
        const existingLowerNames = existingIndexes.map(i => i.toLowerCase());
        const currentLowerName = currentIndex?.toLowerCase();
        
        return !existingLowerNames.includes(lowerName) || lowerName === currentLowerName;
      },
      { message: 'Index name must be unique within the table' }
    ),

  /**
   * Creates a conditional validator based on field dependencies
   */
  createConditionalValidator: <T>(condition: (data: T) => boolean, schema: z.ZodSchema<any>) =>
    z.any().superRefine((data, ctx) => {
      if (condition(data)) {
        const result = schema.safeParse(data);
        if (!result.success) {
          result.error.issues.forEach(issue => {
            ctx.addIssue(issue);
          });
        }
      }
    }),

  /**
   * Validates database-specific constraints and limitations
   */
  createDatabaseSpecificValidator: (databaseType: string) => {
    const validators: Record<string, z.ZodSchema<any>> = {
      mysql: tableFieldSchema.refine(
        (field) => {
          // MySQL-specific validations
          if (field.type === 'string' && field.length && field.length > 65535) {
            return false;
          }
          return true;
        },
        { message: 'MySQL VARCHAR fields cannot exceed 65535 characters' }
      ),
      postgresql: tableFieldSchema.refine(
        (field) => {
          // PostgreSQL-specific validations
          if (field.type === 'decimal' && field.precision && field.precision > 1000) {
            return false;
          }
          return true;
        },
        { message: 'PostgreSQL DECIMAL precision cannot exceed 1000 digits' }
      ),
      // Add more database-specific validators as needed
    };
    
    return validators[databaseType] || z.any();
  },
};

/**
 * Default form configurations for different table management scenarios
 */
export const DefaultTableFormConfigs = {
  creation: {
    mode: 'create' as const,
    validateOnChange: true,
    validateOnBlur: true,
    debounceMs: 300,
    requiredFields: ['name', 'label', 'fields', 'primaryKey'],
    defaultValues: {
      isView: false,
      apiEnabled: true,
      access: 31,
      fields: [],
      foreignKeys: [],
      indexes: [],
      constraints: [],
      related: [],
    },
  },
  
  modification: {
    mode: 'edit' as const,
    validateOnChange: true,
    validateOnBlur: true,
    debounceMs: 300,
    requiredFields: ['name', 'label', 'fields', 'primaryKey'],
    readOnlyFields: ['id'],
    autoSave: {
      enabled: true,
      debounceMs: 5000,
      excludeFields: ['id', 'lastModified'],
    },
  },
  
  filtering: {
    validateOnChange: true,
    validateOnBlur: false,
    debounceMs: 500,
    defaultValues: {
      tableType: 'both' as const,
      search: '',
    },
  },
  
  pagination: {
    validateOnChange: false,
    validateOnBlur: false,
    debounceMs: 0,
    defaultValues: {
      page: 0,
      pageSize: 50,
      virtualScrolling: {
        enabled: true,
        estimatedRowHeight: 40,
        overscan: 10,
        scrollingDelay: 150,
      },
    },
  },
} as const;

/**
 * Error message translations for internationalization support
 */
export const TableValidationErrorMessages = {
  en: {
    required: 'This field is required',
    tooShort: 'Value is too short',
    tooLong: 'Value is too long',
    invalidFormat: 'Invalid format',
    uniqueViolation: 'Value must be unique',
    referenceNotFound: 'Referenced item not found',
    circularReference: 'Circular reference detected',
    invalidConstraint: 'Invalid constraint definition',
    breakingChange: 'This change may break existing functionality',
    performanceConcern: 'This configuration may impact performance',
  },
  // Add more languages as needed
} as const;