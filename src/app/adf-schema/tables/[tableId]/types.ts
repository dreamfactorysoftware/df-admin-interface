/**
 * Table Details Types - React/Next.js Implementation
 * 
 * TypeScript type definitions for table details functionality, including interfaces for 
 * table metadata, field definitions, relationships, and form data structures. Provides 
 * strong typing for React Hook Form integration and API response handling throughout 
 * the table management workflow.
 * 
 * Enhanced with TypeScript 5.8+ strict type safety, React Hook Form compatibility,
 * Zod schema validation, and optimized for React Query caching patterns.
 * 
 * @fileoverview Table details types for schema management with React/Next.js integration
 * @version 1.0.0
 */

import { z } from 'zod';
import type { UseFormReturn, FieldValues, Control, Path } from 'react-hook-form';
import type { UseQueryResult, UseMutationResult } from '@tanstack/react-query';
import type { FieldType, FieldValidation, ReferentialAction } from '../../../types/schema';
import type { ApiResponse, PaginatedResponse } from '../../../types/api';

// ============================================================================
// CORE TABLE TYPES
// ============================================================================

/**
 * Enhanced table details interface with React/Next.js compatibility
 * Migrated from Angular TableDetailsType with additional metadata
 */
export interface TableDetails {
  /** Unique table identifier */
  id: string;
  /** Table name in database */
  name: string;
  /** Display label for UI */
  label: string;
  /** Optional alias for queries */
  alias?: string;
  /** Table description */
  description?: string;
  /** Plural form for API endpoints */
  plural: string;
  /** Whether this is a view or table */
  isView: boolean;
  /** Primary key field names */
  primaryKey: string[];
  /** Field used for display names */
  nameField?: string;
  /** Table fields/columns */
  fields: TableField[];
  /** Related table relationships */
  relationships: TableRelationship[];
  /** Table constraints */
  constraints: TableConstraint[];
  /** Access level permissions */
  access: number;
  /** Raw database metadata */
  native: Record<string, any>[];
  
  // Additional metadata for React Query caching
  /** Service ID this table belongs to */
  serviceId: number;
  /** Service name */
  serviceName: string;
  /** Last modified timestamp */
  lastModified?: string;
  /** Estimated row count */
  rowCount?: number;
  /** Table size estimate */
  estimatedSize?: string;
  
  // UI state management
  /** Loading state for async operations */
  isLoading?: boolean;
  /** Error state */
  error?: string;
  /** Cache key for React Query */
  cacheKey?: string;
}

/**
 * Enhanced table field interface with validation and React Hook Form support
 * Migrated from Angular TableField with additional type safety
 */
export interface TableField {
  /** Unique field identifier */
  id: string;
  /** Field name in database */
  name: string;
  /** Display label for UI */
  label: string;
  /** Optional alias for queries */
  alias?: string;
  /** Field description */
  description?: string;
  
  // Data type information
  /** Normalized field type */
  type: FieldType;
  /** Database-specific type */
  dbType: string;
  /** Field length constraint */
  length?: number;
  /** Numeric precision */
  precision?: number;
  /** Numeric scale */
  scale?: number;
  /** Default value */
  defaultValue?: any;
  
  // Field constraints and properties
  /** Whether field is required */
  required: boolean;
  /** Whether field allows NULL */
  allowNull: boolean;
  /** Fixed length string */
  fixedLength: boolean;
  /** Supports multibyte characters */
  supportsMultibyte: boolean;
  /** Auto-increment field */
  autoIncrement: boolean;
  /** Part of primary key */
  isPrimaryKey: boolean;
  /** Has unique constraint */
  isUnique: boolean;
  /** Has database index */
  isIndex: boolean;
  /** Is foreign key */
  isForeignKey: boolean;
  /** Virtual/computed field */
  isVirtual: boolean;
  /** Aggregate field */
  isAggregate: boolean;
  
  // Foreign key relationships
  /** Referenced table name */
  refTable?: string;
  /** Referenced field name */
  refField?: string;
  /** ON UPDATE action */
  refOnUpdate?: ReferentialAction;
  /** ON DELETE action */
  refOnDelete?: ReferentialAction;
  
  // Field validation and constraints
  /** Validation rules */
  validation?: TableFieldValidation;
  /** Picklist values */
  picklist?: string[];
  /** Database function usage */
  dbFunction?: DbFunctionUse[];
  
  // Raw database metadata
  /** Native database metadata */
  native: Record<string, any>[];
  
  // UI and form integration
  /** Hidden in UI */
  hidden?: boolean;
  /** Field order in forms */
  order?: number;
}

/**
 * Database function usage information
 */
export interface DbFunctionUse {
  /** Function usage types */
  use: string[];
  /** Function name */
  function: string;
}

/**
 * Enhanced field validation with React Hook Form compatibility
 */
export interface TableFieldValidation extends FieldValidation {
  /** Not empty validation */
  notEmpty?: ValidationRule;
  /** Email format validation */
  email?: ValidationRule;
  /** Picklist validation */
  picklist?: ValidationRule;
  /** Custom validation functions */
  custom?: ValidationRule[];
}

/**
 * Validation rule structure
 */
export interface ValidationRule {
  /** Error message on validation failure */
  onFail: string;
  /** Additional validation parameters */
  params?: Record<string, any>;
}

/**
 * Table relationship interface (previously TableRelated)
 * Enhanced for React Query and type safety
 */
export interface TableRelationship {
  /** Unique relationship identifier */
  id: string;
  /** Relationship name */
  name: string;
  /** Display label */
  label: string;
  /** Optional alias */
  alias?: string;
  /** Relationship description */
  description?: string;
  /** Relationship type */
  type: RelationshipType;
  /** Local field name */
  field: string;
  /** Is virtual relationship */
  isVirtual: boolean;
  
  // Referenced table information
  /** Referenced service ID */
  refServiceId: number;
  /** Referenced table name */
  refTable: string;
  /** Referenced field name */
  refField: string;
  /** ON UPDATE action */
  refOnUpdate: ReferentialAction;
  /** ON DELETE action */
  refOnDelete: ReferentialAction;
  
  // Many-to-many junction table
  /** Junction service ID */
  junctionServiceId?: number;
  /** Junction table name */
  junctionTable?: string;
  /** Junction local field */
  junctionField?: string;
  /** Junction reference field */
  junctionRefField?: string;
  
  // Fetching behavior
  /** Always fetch related data */
  alwaysFetch: boolean;
  /** Flatten related data */
  flatten: boolean;
  /** Drop prefix when flattening */
  flattenDropPrefix: boolean;
  
  // Raw database metadata
  /** Native database metadata */
  native: Record<string, any>[];
}

/**
 * Relationship type enumeration
 */
export type RelationshipType = 
  | 'belongs_to'
  | 'has_one'
  | 'has_many'
  | 'many_many'
  | 'has_one_through'
  | 'has_many_through';

/**
 * Table constraint interface
 */
export interface TableConstraint {
  /** Constraint name */
  name: string;
  /** Constraint type */
  type: ConstraintType;
  /** Constraint definition */
  definition: string;
  /** Fields involved in constraint */
  fields: string[];
  /** Constraint metadata */
  metadata?: Record<string, any>;
}

/**
 * Constraint type enumeration
 */
export type ConstraintType = 
  | 'primary_key'
  | 'foreign_key'
  | 'unique'
  | 'check'
  | 'not_null'
  | 'default';

// ============================================================================
// FORM DATA TYPES
// ============================================================================

/**
 * Table form data structure for React Hook Form
 * Optimized for real-time validation under 100ms
 */
export interface TableFormData {
  /** Table name (required, unique) */
  name: string;
  /** Display label */
  label: string;
  /** Optional alias */
  alias?: string;
  /** Table description */
  description?: string;
  /** Plural form */
  plural: string;
  /** Name field selection */
  nameField?: string;
  /** Access level */
  access: number;
  /** Whether table is active */
  isActive: boolean;
}

/**
 * Field form data structure for field editing
 */
export interface FieldFormData {
  /** Field name */
  name: string;
  /** Display label */
  label: string;
  /** Optional alias */
  alias?: string;
  /** Field description */
  description?: string;
  /** Field type */
  type: FieldType;
  /** Database type */
  dbType: string;
  /** Field length */
  length?: number;
  /** Numeric precision */
  precision?: number;
  /** Numeric scale */
  scale?: number;
  /** Default value */
  defaultValue?: string;
  /** Required field */
  required: boolean;
  /** Allow NULL values */
  allowNull: boolean;
  /** Auto-increment */
  autoIncrement: boolean;
  /** Primary key */
  isPrimaryKey: boolean;
  /** Unique constraint */
  isUnique: boolean;
  /** Database index */
  isIndex: boolean;
  /** Virtual field */
  isVirtual: boolean;
  /** Aggregate field */
  isAggregate: boolean;
  /** Picklist values */
  picklist?: string[];
  /** Validation rules */
  validation?: Record<string, any>;
}

/**
 * Relationship form data structure
 */
export interface RelationshipFormData {
  /** Relationship name */
  name: string;
  /** Display label */
  label: string;
  /** Optional alias */
  alias?: string;
  /** Relationship description */
  description?: string;
  /** Relationship type */
  type: RelationshipType;
  /** Local field */
  field: string;
  /** Referenced service */
  refServiceId: number;
  /** Referenced table */
  refTable: string;
  /** Referenced field */
  refField: string;
  /** ON UPDATE action */
  refOnUpdate: ReferentialAction;
  /** ON DELETE action */
  refOnDelete: ReferentialAction;
  /** Always fetch */
  alwaysFetch: boolean;
  /** Flatten data */
  flatten: boolean;
  /** Drop prefix */
  flattenDropPrefix: boolean;
}

// ============================================================================
// REACT HOOK FORM TYPES
// ============================================================================

/**
 * Table form return type with enhanced type safety
 */
export type TableFormReturn = UseFormReturn<TableFormData>;

/**
 * Field form return type
 */
export type FieldFormReturn = UseFormReturn<FieldFormData>;

/**
 * Relationship form return type
 */
export type RelationshipFormReturn = UseFormReturn<RelationshipFormData>;

/**
 * Form control type for table forms
 */
export type TableFormControl = Control<TableFormData>;

/**
 * Form field path type for table forms
 */
export type TableFormPath = Path<TableFormData>;

// ============================================================================
// API RESPONSE TYPES
// ============================================================================

/**
 * Table details API response
 */
export type TableDetailsResponse = ApiResponse<TableDetails>;

/**
 * Table list API response with pagination
 */
export type TableListResponse = PaginatedResponse<TableSummary>;

/**
 * Field list API response
 */
export type FieldListResponse = ApiResponse<TableField[]>;

/**
 * Relationship list API response
 */
export type RelationshipListResponse = ApiResponse<TableRelationship[]>;

/**
 * Table summary for list views
 */
export interface TableSummary {
  /** Table ID */
  id: string;
  /** Table name */
  name: string;
  /** Display label */
  label: string;
  /** Table description */
  description?: string;
  /** Is view */
  isView: boolean;
  /** Field count */
  fieldCount: number;
  /** Relationship count */
  relationshipCount: number;
  /** Last modified */
  lastModified?: string;
}

// ============================================================================
// REACT QUERY TYPES
// ============================================================================

/**
 * Table details query result
 */
export type TableDetailsQuery = UseQueryResult<TableDetails, Error>;

/**
 * Table list query result
 */
export type TableListQuery = UseQueryResult<TableSummary[], Error>;

/**
 * Table update mutation result
 */
export type TableUpdateMutation = UseMutationResult<
  TableDetails,
  Error,
  { tableId: string; data: Partial<TableFormData> }
>;

/**
 * Field update mutation result
 */
export type FieldUpdateMutation = UseMutationResult<
  TableField,
  Error,
  { tableId: string; fieldId: string; data: Partial<FieldFormData> }
>;

/**
 * Relationship update mutation result
 */
export type RelationshipUpdateMutation = UseMutationResult<
  TableRelationship,
  Error,
  { tableId: string; relationshipId: string; data: Partial<RelationshipFormData> }
>;

// ============================================================================
// ZOD VALIDATION SCHEMAS
// ============================================================================

/**
 * Zod schema for table form validation
 * Ensures real-time validation under 100ms requirement
 */
export const TableFormSchema = z.object({
  name: z.string()
    .min(1, 'Table name is required')
    .max(64, 'Table name must be 64 characters or less')
    .regex(/^[a-zA-Z][a-zA-Z0-9_]*$/, 'Table name must start with letter and contain only letters, numbers, and underscores'),
  label: z.string()
    .min(1, 'Label is required')
    .max(255, 'Label must be 255 characters or less'),
  alias: z.string()
    .max(64, 'Alias must be 64 characters or less')
    .optional(),
  description: z.string()
    .max(1000, 'Description must be 1000 characters or less')
    .optional(),
  plural: z.string()
    .min(1, 'Plural form is required')
    .max(64, 'Plural form must be 64 characters or less'),
  nameField: z.string()
    .optional(),
  access: z.number()
    .int()
    .min(0)
    .max(31),
  isActive: z.boolean()
}).strict();

/**
 * Zod schema for field form validation
 */
export const FieldFormSchema = z.object({
  name: z.string()
    .min(1, 'Field name is required')
    .max(64, 'Field name must be 64 characters or less')
    .regex(/^[a-zA-Z][a-zA-Z0-9_]*$/, 'Field name must start with letter and contain only letters, numbers, and underscores'),
  label: z.string()
    .min(1, 'Label is required')
    .max(255, 'Label must be 255 characters or less'),
  alias: z.string()
    .max(64, 'Alias must be 64 characters or less')
    .optional(),
  description: z.string()
    .max(1000, 'Description must be 1000 characters or less')
    .optional(),
  type: z.enum([
    'integer', 'bigint', 'decimal', 'float', 'double',
    'string', 'text', 'boolean', 'date', 'datetime', 
    'timestamp', 'time', 'binary', 'json', 'xml', 
    'uuid', 'enum', 'set'
  ]),
  dbType: z.string().min(1, 'Database type is required'),
  length: z.number().int().positive().optional(),
  precision: z.number().int().positive().optional(),
  scale: z.number().int().nonnegative().optional(),
  defaultValue: z.string().optional(),
  required: z.boolean(),
  allowNull: z.boolean(),
  autoIncrement: z.boolean(),
  isPrimaryKey: z.boolean(),
  isUnique: z.boolean(),
  isIndex: z.boolean(),
  isVirtual: z.boolean(),
  isAggregate: z.boolean(),
  picklist: z.array(z.string()).optional(),
  validation: z.record(z.any()).optional()
}).strict();

/**
 * Zod schema for relationship form validation
 */
export const RelationshipFormSchema = z.object({
  name: z.string()
    .min(1, 'Relationship name is required')
    .max(64, 'Relationship name must be 64 characters or less')
    .regex(/^[a-zA-Z][a-zA-Z0-9_]*$/, 'Relationship name must start with letter and contain only letters, numbers, and underscores'),
  label: z.string()
    .min(1, 'Label is required')
    .max(255, 'Label must be 255 characters or less'),
  alias: z.string()
    .max(64, 'Alias must be 64 characters or less')
    .optional(),
  description: z.string()
    .max(1000, 'Description must be 1000 characters or less')
    .optional(),
  type: z.enum([
    'belongs_to', 'has_one', 'has_many', 'many_many',
    'has_one_through', 'has_many_through'
  ]),
  field: z.string().min(1, 'Local field is required'),
  refServiceId: z.number().int().positive(),
  refTable: z.string().min(1, 'Referenced table is required'),
  refField: z.string().min(1, 'Referenced field is required'),
  refOnUpdate: z.enum(['NO ACTION', 'RESTRICT', 'CASCADE', 'SET NULL', 'SET DEFAULT']),
  refOnDelete: z.enum(['NO ACTION', 'RESTRICT', 'CASCADE', 'SET NULL', 'SET DEFAULT']),
  alwaysFetch: z.boolean(),
  flatten: z.boolean(),
  flattenDropPrefix: z.boolean()
}).strict();

// ============================================================================
// TYPE INFERENCE FROM ZOD SCHEMAS
// ============================================================================

/**
 * Type inference from Zod schema for table form
 */
export type TableFormDataInferred = z.infer<typeof TableFormSchema>;

/**
 * Type inference from Zod schema for field form
 */
export type FieldFormDataInferred = z.infer<typeof FieldFormSchema>;

/**
 * Type inference from Zod schema for relationship form
 */
export type RelationshipFormDataInferred = z.infer<typeof RelationshipFormSchema>;

// ============================================================================
// UTILITY TYPES
// ============================================================================

/**
 * Table editing mode
 */
export type TableEditMode = 'create' | 'edit' | 'view';

/**
 * Field editing mode
 */
export type FieldEditMode = 'create' | 'edit' | 'view';

/**
 * Relationship editing mode
 */
export type RelationshipEditMode = 'create' | 'edit' | 'view';

/**
 * Table view type for UI rendering
 */
export type TableViewType = 'form' | 'json' | 'fields' | 'relationships';

/**
 * Field display row for table rendering
 */
export interface FieldDisplayRow {
  /** Field name */
  name: string;
  /** Field alias */
  alias: string;
  /** Field type */
  type: string;
  /** Is virtual */
  isVirtual: boolean;
  /** Is aggregate */
  isAggregate: boolean;
  /** Is required */
  required: boolean;
  /** Constraint summary */
  constraints: string;
}

/**
 * Relationship display row for table rendering
 */
export interface RelationshipDisplayRow {
  /** Relationship name */
  name: string;
  /** Relationship alias */
  alias: string;
  /** Relationship type */
  type: string;
  /** Is virtual */
  isVirtual: boolean;
  /** Referenced table */
  refTable: string;
  /** Referenced field */
  refField: string;
}

/**
 * Table row for list display
 */
export interface TableDisplayRow {
  /** Table ID */
  id: string;
  /** Table name */
  name: string;
  /** Display label */
  label: string;
  /** Description */
  description?: string;
  /** Is view */
  isView: boolean;
  /** Field count */
  fieldCount: number;
  /** Relationship count */
  relationshipCount: number;
}

// ============================================================================
// ERROR TYPES
// ============================================================================

/**
 * Table operation error
 */
export interface TableOperationError extends Error {
  /** Error code */
  code: string;
  /** Field-specific errors */
  fieldErrors?: Record<string, string>;
  /** Operation that failed */
  operation: 'create' | 'read' | 'update' | 'delete';
  /** Additional context */
  context?: Record<string, any>;
}

/**
 * Validation error for forms
 */
export interface FormValidationError extends Error {
  /** Field name */
  field: string;
  /** Validation rule that failed */
  rule: string;
  /** Error value */
  value: any;
}

// Export all types for convenient imports
export type {
  TableDetails,
  TableField,
  TableRelationship,
  TableConstraint,
  TableFormData,
  FieldFormData,
  RelationshipFormData,
  TableSummary,
  FieldDisplayRow,
  RelationshipDisplayRow,
  TableDisplayRow
};