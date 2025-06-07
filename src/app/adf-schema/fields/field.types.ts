/**
 * Database Field Management Types for React/Next.js DreamFactory Admin Interface
 * 
 * Comprehensive TypeScript type definitions for database field management adapted for React patterns.
 * Defines interfaces for field schemas, form data structures, function usage patterns, and validation
 * rules compatible with React Hook Form, Zod validation, and API responses while maintaining 
 * compatibility with DreamFactory field schema requirements.
 * 
 * @fileoverview Field management types for database schema operations
 * @version 1.0.0
 * @since React 19.0.0 / Next.js 15.1+
 */

import { z } from 'zod';
import type { 
  UseFormReturn, 
  FieldValues, 
  Control, 
  FieldPath,
  FieldPathValue,
  FieldError
} from 'react-hook-form';
import type { ColumnDef } from '@tanstack/react-table';
import type { ReactNode } from 'react';

// Import related types for integration
import type { 
  ApiListResponse,
  ApiResourceResponse,
  ApiErrorResponse,
  PaginationMeta
} from '../../../types/api';
import type {
  DatabaseField,
  TableRelationship,
  DatabaseType
} from '../../../types/database';
import type {
  BaseComponent,
  ComponentVariant,
  ComponentSize,
  FormFieldComponent
} from '../../../types/ui';

// =============================================================================
// CORE FIELD TYPE DEFINITIONS
// =============================================================================

/**
 * Enhanced database schema field type migrated from Angular
 * Maintains compatibility with existing DreamFactory API while adding React features
 */
export interface DatabaseSchemaFieldType {
  // Core field identification
  /** Field name (database column name) */
  name: string;
  /** Display label for UI */
  label: string;
  /** Field alias for API operations */
  alias: string | null;
  /** Field description or comment */
  description: string | null;

  // Data type definitions
  /** DreamFactory field type (normalized) */
  type: FieldDataType;
  /** Native database type */
  dbType: string | null;
  /** Field length or maximum size */
  length: number | null;
  /** Numeric precision for decimal types */
  precision: number | null;
  /** Numeric scale for decimal types */
  scale: number;
  /** Fixed length string indicator */
  fixedLength: boolean;
  /** Supports multibyte characters */
  supportsMultibyte: boolean;

  // Constraints and properties
  /** Field is required (NOT NULL) */
  required: boolean;
  /** Field allows NULL values */
  allowNull: boolean;
  /** Field is primary key */
  isPrimaryKey: boolean;
  /** Field is foreign key */
  isForeignKey: boolean;
  /** Field has unique constraint */
  isUnique: boolean;
  /** Field is auto-increment */
  autoIncrement: boolean;
  /** Field is virtual/computed */
  isVirtual: boolean;
  /** Field is aggregate function result */
  isAggregate: boolean;

  // Default and validation
  /** Default value for field */
  default: string | null;
  /** Validation rules JSON string */
  validation: string | null;
  /** Picklist values (CSV format) */
  picklist: string | null;

  // Foreign key relationships
  /** Referenced table name */
  refTable: string | null;
  /** Referenced field name */
  refField: string | null;
  /** Foreign key ON DELETE action */
  refOnDelete: ReferentialAction | null;
  /** Foreign key ON UPDATE action */
  refOnUpdate: ReferentialAction | null;

  // Database functions
  /** Database function usage configurations */
  dbFunction: DbFunctionUse[] | null;

  // Native database metadata (usually null in admin interface)
  /** Native database field properties */
  native: any[] | null;
  /** Field values for enum types */
  value: any[];
}

/**
 * Database function usage configuration
 * Enhanced from Angular component with React integration
 */
export interface DbFunctionUse {
  /** SQL operations where function is applied */
  use: FunctionUseOperation[];
  /** Database function name or expression */
  function: string;
}

/**
 * Field data types supported by DreamFactory
 * Enhanced enumeration with additional database-specific types
 */
export type FieldDataType =
  // Core types
  | 'id'
  | 'string'
  | 'integer'
  | 'text'
  | 'boolean'
  | 'binary'
  | 'float'
  | 'double'
  | 'decimal'
  
  // Date/time types
  | 'datetime'
  | 'date'
  | 'time'
  | 'timestamp'
  | 'timestamp_on_create'
  | 'timestamp_on_update'
  
  // User-related types
  | 'user_id'
  | 'user_id_on_create'
  | 'user_id_on_update'
  
  // Advanced types
  | 'reference'
  | 'json'
  | 'xml'
  | 'uuid'
  | 'blob'
  | 'clob'
  | 'geometry'
  | 'point'
  | 'linestring'
  | 'polygon'
  | 'enum'
  | 'set';

/**
 * SQL function usage operations
 * Maps to HTTP methods and database operations
 */
export type FunctionUseOperation = 
  | 'SELECT'  // GET operations
  | 'FILTER'  // GET with filtering
  | 'INSERT'  // POST operations  
  | 'UPDATE'; // PATCH/PUT operations

/**
 * Foreign key referential actions
 * Standard SQL referential integrity actions
 */
export type ReferentialAction = 
  | 'CASCADE'
  | 'SET NULL'
  | 'RESTRICT'
  | 'NO ACTION'
  | 'SET DEFAULT';

// =============================================================================
// REACT HOOK FORM INTEGRATION TYPES
// =============================================================================

/**
 * React Hook Form data structure for field configuration
 * Optimized for real-time validation under 100ms
 */
export interface FieldFormData {
  // Basic field information
  name: string;
  label: string;
  alias?: string;
  description?: string;
  
  // Type configuration
  typeSelection: 'manual' | 'predefined';
  type: FieldDataType;
  dbType?: string;
  manualType?: string;
  
  // Size and precision
  length?: number;
  precision?: number;
  scale?: number;
  fixedLength: boolean;
  supportsMultibyte: boolean;
  
  // Constraints
  required: boolean;
  allowNull: boolean;
  isPrimaryKey: boolean;
  isForeignKey: boolean;
  isUnique: boolean;
  autoIncrement: boolean;
  isVirtual: boolean;
  isAggregate: boolean;
  
  // Default value and validation
  default?: string;
  hasDefaultValue: boolean;
  
  // Validation configuration
  enableValidation: boolean;
  validationRules?: FieldValidationConfig;
  
  // Picklist configuration
  enablePicklist: boolean;
  picklistType: 'csv' | 'json';
  picklistValues?: string;
  picklistOptions?: string[];
  
  // Foreign key configuration
  referenceTable?: string;
  referenceField?: string;
  onDeleteAction: ReferentialAction;
  onUpdateAction: ReferentialAction;
  
  // Database functions
  enableDbFunctions: boolean;
  dbFunctions: FieldDbFunctionFormData[];
}

/**
 * Database function form data structure
 * React Hook Form compatible with array fields
 */
export interface FieldDbFunctionFormData {
  id: string; // Unique identifier for React keys
  use: FunctionUseOperation[];
  function: string;
  enabled: boolean;
}

/**
 * Field validation configuration for React Hook Form
 * Integrates with Zod schema validation
 */
export interface FieldValidationConfig {
  // String validation
  minLength?: number;
  maxLength?: number;
  pattern?: string;
  format?: 'email' | 'url' | 'phone' | 'custom';
  
  // Numeric validation
  min?: number;
  max?: number;
  multipleOf?: number;
  
  // Date validation
  minDate?: string;
  maxDate?: string;
  
  // Custom validation
  customRule?: string;
  customMessage?: string;
  
  // Validation behavior
  validateOnChange: boolean;
  validateOnBlur: boolean;
  debounceMs: number;
}

/**
 * React Hook Form type-safe form interface
 * Provides complete type safety for field configuration
 */
export type FieldFormMethods = UseFormReturn<FieldFormData>;

/**
 * Field form component props interface
 * Extends base form field component with field-specific features
 */
export interface FieldFormComponentProps extends FormFieldComponent {
  /** Form methods from React Hook Form */
  form: FieldFormMethods;
  /** Field being edited (null for new fields) */
  field?: DatabaseSchemaFieldType | null;
  /** Available reference tables for foreign keys */
  referenceTables: TableReference[];
  /** Database type for type-specific features */
  databaseType: DatabaseType;
  /** Loading state for async operations */
  loading?: boolean;
  /** Form submission handler */
  onSubmit: (data: FieldFormData) => Promise<void>;
  /** Form cancellation handler */
  onCancel: () => void;
}

/**
 * Table reference information for foreign key configuration
 */
export interface TableReference {
  /** Table name */
  name: string;
  /** Table display label */
  label: string;
  /** Available fields in the table */
  fields: DatabaseSchemaFieldType[];
  /** Table schema (for multi-schema databases) */
  schema?: string;
}

// =============================================================================
// ZOD VALIDATION SCHEMAS
// =============================================================================

/**
 * Field name validation schema
 * Ensures valid database identifier format
 */
export const FieldNameSchema = z
  .string()
  .min(1, 'Field name is required')
  .max(64, 'Field name must be 64 characters or less')
  .regex(
    /^[a-zA-Z][a-zA-Z0-9_]*$/,
    'Field name must start with a letter and contain only letters, numbers, and underscores'
  )
  .refine(
    (name) => !['id', 'created_date', 'last_modified_date'].includes(name.toLowerCase()),
    'Field name conflicts with system reserved words'
  );

/**
 * Field label validation schema
 */
export const FieldLabelSchema = z
  .string()
  .min(1, 'Field label is required')
  .max(255, 'Field label must be 255 characters or less')
  .trim();

/**
 * Field type validation schema
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
  'timestamp',
  'timestamp_on_create',
  'timestamp_on_update',
  'user_id',
  'user_id_on_create',
  'user_id_on_update',
  'reference',
  'json',
  'xml',
  'uuid',
  'blob',
  'clob',
  'geometry',
  'point',
  'linestring',
  'polygon',
  'enum',
  'set'
], {
  errorMap: () => ({ message: 'Please select a valid field type' })
});

/**
 * Database function use validation schema
 */
export const DbFunctionUseSchema = z.object({
  id: z.string().uuid(),
  use: z
    .array(z.enum(['SELECT', 'FILTER', 'INSERT', 'UPDATE']))
    .min(1, 'At least one operation must be selected'),
  function: z
    .string()
    .min(1, 'Function expression is required')
    .max(1000, 'Function expression is too long'),
  enabled: z.boolean().default(true)
}).strict();

/**
 * Field validation rules schema for real-time validation
 */
export const FieldValidationConfigSchema = z.object({
  // String validation
  minLength: z.number().min(0).max(65535).optional(),
  maxLength: z.number().min(1).max(65535).optional(),
  pattern: z.string().max(500).optional(),
  format: z.enum(['email', 'url', 'phone', 'custom']).optional(),
  
  // Numeric validation
  min: z.number().optional(),
  max: z.number().optional(),
  multipleOf: z.number().positive().optional(),
  
  // Date validation
  minDate: z.string().datetime().optional(),
  maxDate: z.string().datetime().optional(),
  
  // Custom validation
  customRule: z.string().max(2000).optional(),
  customMessage: z.string().max(255).optional(),
  
  // Validation behavior
  validateOnChange: z.boolean().default(true),
  validateOnBlur: z.boolean().default(true),
  debounceMs: z.number().min(0).max(1000).default(100)
}).strict().refine(
  (data) => !data.maxLength || !data.minLength || data.maxLength >= data.minLength,
  {
    message: 'Maximum length must be greater than or equal to minimum length',
    path: ['maxLength']
  }
).refine(
  (data) => !data.max || !data.min || data.max >= data.min,
  {
    message: 'Maximum value must be greater than or equal to minimum value',
    path: ['max']
  }
);

/**
 * Complete field form data validation schema
 * Provides comprehensive validation for all field configuration options
 */
export const FieldFormDataSchema = z.object({
  // Basic information
  name: FieldNameSchema,
  label: FieldLabelSchema,
  alias: z.string().max(64).optional(),
  description: z.string().max(1000).optional(),
  
  // Type configuration
  typeSelection: z.enum(['manual', 'predefined']),
  type: FieldTypeSchema,
  dbType: z.string().max(100).optional(),
  manualType: z.string().max(100).optional(),
  
  // Size and precision
  length: z.number().min(1).max(2147483647).optional(),
  precision: z.number().min(1).max(65).optional(),
  scale: z.number().min(0).max(30).default(0),
  fixedLength: z.boolean().default(false),
  supportsMultibyte: z.boolean().default(false),
  
  // Constraints
  required: z.boolean().default(false),
  allowNull: z.boolean().default(true),
  isPrimaryKey: z.boolean().default(false),
  isForeignKey: z.boolean().default(false),
  isUnique: z.boolean().default(false),
  autoIncrement: z.boolean().default(false),
  isVirtual: z.boolean().default(false),
  isAggregate: z.boolean().default(false),
  
  // Default value
  default: z.string().max(2000).optional(),
  hasDefaultValue: z.boolean().default(false),
  
  // Validation
  enableValidation: z.boolean().default(false),
  validationRules: FieldValidationConfigSchema.optional(),
  
  // Picklist
  enablePicklist: z.boolean().default(false),
  picklistType: z.enum(['csv', 'json']).default('csv'),
  picklistValues: z.string().max(10000).optional(),
  picklistOptions: z.array(z.string()).optional(),
  
  // Foreign key
  referenceTable: z.string().max(64).optional(),
  referenceField: z.string().max(64).optional(),
  onDeleteAction: z.enum(['CASCADE', 'SET NULL', 'RESTRICT', 'NO ACTION', 'SET DEFAULT']).default('RESTRICT'),
  onUpdateAction: z.enum(['CASCADE', 'SET NULL', 'RESTRICT', 'NO ACTION', 'SET DEFAULT']).default('RESTRICT'),
  
  // Database functions
  enableDbFunctions: z.boolean().default(false),
  dbFunctions: z.array(DbFunctionUseSchema).default([])
}).strict()
.refine(
  (data) => data.typeSelection !== 'manual' || !!data.manualType,
  {
    message: 'Manual type must be specified when using manual type selection',
    path: ['manualType']
  }
)
.refine(
  (data) => !data.hasDefaultValue || !!data.default,
  {
    message: 'Default value must be provided when enabled',
    path: ['default']
  }
)
.refine(
  (data) => !data.enableValidation || !!data.validationRules,
  {
    message: 'Validation rules must be configured when validation is enabled',
    path: ['validationRules']
  }
)
.refine(
  (data) => !data.enablePicklist || !!data.picklistValues,
  {
    message: 'Picklist values must be provided when picklist is enabled',
    path: ['picklistValues']
  }
)
.refine(
  (data) => !data.isForeignKey || (!!data.referenceTable && !!data.referenceField),
  {
    message: 'Reference table and field must be specified for foreign keys',
    path: ['referenceTable']
  }
)
.refine(
  (data) => !data.isPrimaryKey || !data.allowNull,
  {
    message: 'Primary key fields cannot allow null values',
    path: ['allowNull']
  }
);

// =============================================================================
// API RESPONSE TYPES
// =============================================================================

/**
 * Field list API response type
 * Compatible with DreamFactory schema discovery endpoints
 */
export type FieldListResponse = ApiListResponse<DatabaseSchemaFieldType>;

/**
 * Single field API response type
 */
export type FieldResponse = ApiResourceResponse<DatabaseSchemaFieldType>;

/**
 * Field creation/update request payload
 */
export interface FieldCreateRequest {
  /** Service name */
  service: string;
  /** Table name */
  table: string;
  /** Field configuration */
  field: Partial<DatabaseSchemaFieldType>;
}

/**
 * Field update request payload
 */
export interface FieldUpdateRequest extends FieldCreateRequest {
  /** Original field name (for field renames) */
  originalName?: string;
}

/**
 * Batch field operations request
 */
export interface FieldBatchRequest {
  /** Service name */
  service: string;
  /** Table name */
  table: string;
  /** Fields to create/update */
  fields: Partial<DatabaseSchemaFieldType>[];
  /** Whether to drop missing fields */
  dropMissing?: boolean;
}

// =============================================================================
// NEXT.JS ROUTING TYPES
// =============================================================================

/**
 * Page parameters for field management routes
 * Provides type safety for Next.js dynamic routes
 */
export interface FieldPageParams {
  /** Service name from route */
  service: string;
  /** Table name from route */
  table: string;
  /** Field name for editing (optional) */
  fieldId?: string;
}

/**
 * Search parameters for field listing
 */
export interface FieldSearchParams {
  /** Search query for field names */
  search?: string;
  /** Filter by field type */
  type?: FieldDataType;
  /** Filter by constraint type */
  constraint?: 'primary' | 'foreign' | 'unique' | 'required';
  /** Sorting column */
  sort?: 'name' | 'type' | 'required' | 'created';
  /** Sort direction */
  order?: 'asc' | 'desc';
  /** Page number for pagination */
  page?: string;
  /** Items per page */
  limit?: string;
}

/**
 * Next.js route configuration for field management
 */
export interface FieldRouteConfig {
  /** Base path for field routes */
  basePath: string;
  /** Dynamic parameters */
  params: FieldPageParams;
  /** Search parameters */
  searchParams: FieldSearchParams;
}

// =============================================================================
// TANSTACK TABLE INTEGRATION TYPES
// =============================================================================

/**
 * Table column configuration for field listing
 * Optimized for TanStack Table with virtualization support
 */
export interface FieldTableColumn {
  /** Column identifier */
  id: keyof DatabaseSchemaFieldType | 'actions';
  /** Column display name */
  header: string;
  /** Column accessor function or key */
  accessorKey?: keyof DatabaseSchemaFieldType;
  /** Custom cell renderer */
  cell?: (props: { row: { original: DatabaseSchemaFieldType } }) => ReactNode;
  /** Whether column is sortable */
  enableSorting?: boolean;
  /** Whether column is filterable */
  enableColumnFilter?: boolean;
  /** Column width for virtualization */
  size?: number;
  /** Minimum column width */
  minSize?: number;
  /** Maximum column width */
  maxSize?: number;
}

/**
 * Field table data structure for TanStack Table
 * Includes virtual scrolling metadata
 */
export interface FieldTableData {
  /** Field data rows */
  rows: DatabaseSchemaFieldType[];
  /** Total row count for pagination */
  totalRows: number;
  /** Virtual scrolling configuration */
  virtualConfig: {
    /** Estimated row height in pixels */
    estimateSize: number;
    /** Overscan count for smooth scrolling */
    overscan: number;
  };
  /** Loading state indicators */
  loading: {
    /** Initial data loading */
    isLoading: boolean;
    /** Fetching next page */
    isFetchingNextPage: boolean;
    /** Background refresh */
    isRefreshing: boolean;
  };
  /** Error state */
  error?: ApiErrorResponse;
}

/**
 * TanStack Table column definitions for field management
 * Pre-configured columns with sorting, filtering, and virtualization
 */
export const fieldTableColumns: ColumnDef<DatabaseSchemaFieldType>[] = [
  {
    id: 'name',
    header: 'Field Name',
    accessorKey: 'name',
    enableSorting: true,
    enableColumnFilter: true,
    size: 200,
    minSize: 150,
    maxSize: 300
  },
  {
    id: 'label',
    header: 'Label',
    accessorKey: 'label',
    enableSorting: true,
    enableColumnFilter: true,
    size: 200,
    minSize: 150,
    maxSize: 300
  },
  {
    id: 'type',
    header: 'Type',
    accessorKey: 'type',
    enableSorting: true,
    enableColumnFilter: true,
    size: 120,
    minSize: 100,
    maxSize: 150
  },
  {
    id: 'required',
    header: 'Required',
    accessorKey: 'required',
    enableSorting: true,
    enableColumnFilter: true,
    size: 100,
    minSize: 80,
    maxSize: 120
  },
  {
    id: 'isPrimaryKey',
    header: 'Primary Key',
    accessorKey: 'isPrimaryKey',
    enableSorting: true,
    enableColumnFilter: true,
    size: 100,
    minSize: 80,
    maxSize: 120
  },
  {
    id: 'isForeignKey',
    header: 'Foreign Key',
    accessorKey: 'isForeignKey',
    enableSorting: true,
    enableColumnFilter: true,
    size: 100,
    minSize: 80,
    maxSize: 120
  },
  {
    id: 'actions',
    header: 'Actions',
    size: 120,
    minSize: 100,
    maxSize: 150,
    enableSorting: false,
    enableColumnFilter: false
  }
];

// =============================================================================
// UTILITY TYPES AND CONSTANTS
// =============================================================================

/**
 * Field type dropdown options for form selection
 * Migrated from Angular component with enhanced categorization
 */
export const FIELD_TYPE_OPTIONS: { 
  label: string; 
  value: FieldDataType | 'manual'; 
  category: string;
  description: string;
}[] = [
  // Core types
  { label: 'I will manually enter a type', value: 'manual', category: 'Custom', description: 'Define a custom database-specific type' },
  { label: 'ID (Auto-increment)', value: 'id', category: 'Core', description: 'Auto-incrementing primary key' },
  { label: 'String', value: 'string', category: 'Core', description: 'Variable-length text field' },
  { label: 'Integer', value: 'integer', category: 'Core', description: 'Whole number field' },
  { label: 'Text', value: 'text', category: 'Core', description: 'Large text content' },
  { label: 'Boolean', value: 'boolean', category: 'Core', description: 'True/false value' },
  { label: 'Binary', value: 'binary', category: 'Core', description: 'Binary data storage' },
  
  // Numeric types
  { label: 'Float', value: 'float', category: 'Numeric', description: 'Single precision floating point' },
  { label: 'Double', value: 'double', category: 'Numeric', description: 'Double precision floating point' },
  { label: 'Decimal', value: 'decimal', category: 'Numeric', description: 'Fixed precision decimal' },
  
  // Date/time types
  { label: 'DateTime', value: 'datetime', category: 'Date/Time', description: 'Date and time value' },
  { label: 'Date', value: 'date', category: 'Date/Time', description: 'Date only value' },
  { label: 'Time', value: 'time', category: 'Date/Time', description: 'Time only value' },
  { label: 'Timestamp', value: 'timestamp', category: 'Date/Time', description: 'Unix timestamp' },
  { label: 'Timestamp (On Create)', value: 'timestamp_on_create', category: 'Date/Time', description: 'Automatically set on record creation' },
  { label: 'Timestamp (On Update)', value: 'timestamp_on_update', category: 'Date/Time', description: 'Automatically set on record update' },
  
  // User-related types
  { label: 'User ID', value: 'user_id', category: 'User', description: 'Reference to user ID' },
  { label: 'User ID (On Create)', value: 'user_id_on_create', category: 'User', description: 'Set to current user on creation' },
  { label: 'User ID (On Update)', value: 'user_id_on_update', category: 'User', description: 'Set to current user on update' },
  
  // Reference and advanced types
  { label: 'Reference', value: 'reference', category: 'Relationships', description: 'Foreign key reference' },
  { label: 'JSON', value: 'json', category: 'Advanced', description: 'JSON document storage' },
  { label: 'XML', value: 'xml', category: 'Advanced', description: 'XML document storage' },
  { label: 'UUID', value: 'uuid', category: 'Advanced', description: 'Universally unique identifier' }
];

/**
 * Function use operation options for database functions
 */
export const FUNCTION_USE_OPTIONS: {
  label: string;
  value: FunctionUseOperation;
  description: string;
  httpMethod: string;
}[] = [
  { 
    label: 'SELECT (GET)', 
    value: 'SELECT', 
    description: 'Apply function during SELECT operations',
    httpMethod: 'GET'
  },
  { 
    label: 'FILTER (GET)', 
    value: 'FILTER', 
    description: 'Apply function during filtering operations',
    httpMethod: 'GET'
  },
  { 
    label: 'INSERT (POST)', 
    value: 'INSERT', 
    description: 'Apply function during INSERT operations',
    httpMethod: 'POST'
  },
  { 
    label: 'UPDATE (PATCH)', 
    value: 'UPDATE', 
    description: 'Apply function during UPDATE operations',
    httpMethod: 'PATCH'
  }
];

/**
 * Referential action options for foreign key constraints
 */
export const REFERENTIAL_ACTION_OPTIONS: {
  label: string;
  value: ReferentialAction;
  description: string;
}[] = [
  { 
    label: 'CASCADE', 
    value: 'CASCADE', 
    description: 'Automatically update/delete related records' 
  },
  { 
    label: 'SET NULL', 
    value: 'SET NULL', 
    description: 'Set foreign key field to NULL' 
  },
  { 
    label: 'RESTRICT', 
    value: 'RESTRICT', 
    description: 'Prevent update/delete if related records exist' 
  },
  { 
    label: 'NO ACTION', 
    value: 'NO ACTION', 
    description: 'No action taken on related records' 
  },
  { 
    label: 'SET DEFAULT', 
    value: 'SET DEFAULT', 
    description: 'Set foreign key field to default value' 
  }
];

/**
 * Default field configuration values
 * Used for form initialization and field creation
 */
export const DEFAULT_FIELD_CONFIG: Partial<FieldFormData> = {
  typeSelection: 'predefined',
  type: 'string',
  fixedLength: false,
  supportsMultibyte: false,
  required: false,
  allowNull: true,
  isPrimaryKey: false,
  isForeignKey: false,
  isUnique: false,
  autoIncrement: false,
  isVirtual: false,
  isAggregate: false,
  hasDefaultValue: false,
  enableValidation: false,
  enablePicklist: false,
  picklistType: 'csv',
  onDeleteAction: 'RESTRICT',
  onUpdateAction: 'RESTRICT',
  enableDbFunctions: false,
  dbFunctions: [],
  scale: 0
};

/**
 * Export all types for external consumption
 * Provides convenient access to all field-related types
 */
export type {
  // Core types
  DatabaseSchemaFieldType,
  DbFunctionUse,
  FieldDataType,
  FunctionUseOperation,
  ReferentialAction,
  
  // Form types
  FieldFormData,
  FieldDbFunctionFormData,
  FieldValidationConfig,
  FieldFormMethods,
  FieldFormComponentProps,
  TableReference,
  
  // API types
  FieldListResponse,
  FieldResponse,
  FieldCreateRequest,
  FieldUpdateRequest,
  FieldBatchRequest,
  
  // Routing types
  FieldPageParams,
  FieldSearchParams,
  FieldRouteConfig,
  
  // Table types
  FieldTableColumn,
  FieldTableData
};

/**
 * Validation schema exports for external use
 */
export {
  FieldNameSchema,
  FieldLabelSchema,
  FieldTypeSchema,
  DbFunctionUseSchema,
  FieldValidationConfigSchema,
  FieldFormDataSchema
};