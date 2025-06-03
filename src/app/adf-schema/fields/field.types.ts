/**
 * @fileoverview Comprehensive TypeScript type definitions for database field management 
 * adapted for React patterns. Defines interfaces for field schemas, form data structures, 
 * function usage patterns, and validation rules compatible with React Hook Form, Zod 
 * validation, and API responses while maintaining compatibility with DreamFactory field 
 * schema requirements.
 * 
 * @version 1.0.0
 * @created 2024-12-28
 * 
 * Key Features:
 * - Type-safe configuration workflows per Section 5.2 Component Details
 * - React Hook Form with Zod schema validators for all user inputs
 * - TypeScript 5.8+ with enhanced template literal types and improved inference
 * - Strong typing for all field metadata and validation rules
 * - TanStack Table column definitions for field listing virtualization
 * - Next.js routing parameter types for dynamic field navigation
 */

import { z } from 'zod'
import type { FieldPath, FieldValues, UseFormReturn } from 'react-hook-form'
import type { ColumnDef } from '@tanstack/react-table'

// =============================================================================
// CORE DATABASE FIELD TYPES
// =============================================================================

/**
 * Enhanced DatabaseSchemaFieldType extracted from Angular implementation
 * with React Hook Form compatibility and improved type safety
 */
export interface DatabaseSchemaFieldType {
  /** Field alias for API generation */
  alias: string | null
  /** Whether field accepts NULL values */
  allowNull: boolean
  /** Auto-increment field flag */
  autoIncrement: boolean
  /** Database function usage configurations */
  dbFunction: DbFunctionUseType[] | null
  /** Database-specific type (e.g., VARCHAR, INT) */
  dbType: string | null
  /** Field description for documentation */
  description: string | null
  /** Default value for the field */
  default: string | number | boolean | null
  /** Fixed-length field flag */
  fixedLength: boolean
  /** Aggregate field flag for calculated values */
  isAggregate: boolean
  /** Foreign key relationship flag */
  isForeignKey: boolean
  /** Primary key flag */
  isPrimaryKey: boolean
  /** Unique constraint flag */
  isUnique: boolean
  /** Virtual field flag (computed/calculated) */
  isVirtual: boolean
  /** Display label for UI components */
  label: string
  /** Field length constraint */
  length: number | null
  /** Field name (database column name) */
  name: string
  /** Native database-specific properties */
  native: unknown[] | null
  /** Comma-separated picklist values */
  picklist: string | null
  /** Decimal precision for numeric fields */
  precision: number | null
  /** Referenced field name for foreign keys */
  refField: string | null
  /** Referenced table name for foreign keys */
  refTable: string | null
  /** ON DELETE action for foreign key constraints */
  refOnDelete: string | null
  /** ON UPDATE action for foreign key constraints */
  refOnUpdate: string | null
  /** Required field validation flag */
  required: boolean
  /** Decimal scale for numeric fields */
  scale: number
  /** Multi-byte character support flag */
  supportsMultibyte: boolean
  /** DreamFactory field type (string, integer, boolean, etc.) */
  type: DreamFactoryFieldType
  /** JSON validation rules string */
  validation: string | null
  /** Field value array for complex types */
  value: unknown[]
}

/**
 * Database function usage configuration for calculated fields
 */
export interface DbFunctionUseType {
  /** Array of usage contexts where function applies */
  use: string[]
  /** Database function name or expression */
  function: string
}

/**
 * DreamFactory supported field types with enhanced template literal types
 */
export type DreamFactoryFieldType =
  // String types
  | 'string'
  | 'text'
  | 'password'
  | 'email'
  | 'url'
  // Numeric types
  | 'integer'
  | 'bigint'
  | 'smallint'
  | 'decimal'
  | 'float'
  | 'double'
  | 'money'
  // Date/Time types
  | 'date'
  | 'time'
  | 'datetime'
  | 'timestamp'
  // Boolean types
  | 'boolean'
  // Binary types
  | 'binary'
  | 'varbinary'
  | 'blob'
  | 'medium_blob'
  | 'long_blob'
  // Reference types
  | 'reference'
  | 'user_id'
  | 'user_id_on_create'
  | 'user_id_on_update'
  | 'timestamp_on_create'
  | 'timestamp_on_update'

/**
 * Database constraint types for enhanced validation
 */
export type DatabaseConstraintType =
  | 'primary_key'
  | 'foreign_key'
  | 'unique'
  | 'check'
  | 'not_null'
  | 'default'

// =============================================================================
// REACT HOOK FORM INTEGRATION TYPES
// =============================================================================

/**
 * React Hook Form compatible field configuration form data
 * Optimized for real-time validation under 100ms
 */
export interface FieldFormData {
  /** Basic field information */
  name: string
  alias: string
  label: string
  description: string
  
  /** Type configuration */
  type: DreamFactoryFieldType
  dbType: string
  
  /** Size constraints */
  length: number | null
  precision: number | null
  scale: number
  
  /** Default value */
  default: string | number | boolean | null
  
  /** Boolean flags */
  allowNull: boolean
  autoIncrement: boolean
  fixedLength: boolean
  isAggregate: boolean
  isForeignKey: boolean
  isPrimaryKey: boolean
  isUnique: boolean
  isVirtual: boolean
  required: boolean
  supportsMultibyte: boolean
  
  /** Reference configuration */
  refTable: string | null
  refField: string | null
  refOnDelete: string | null
  refOnUpdate: string | null
  
  /** Advanced configuration */
  picklist: string | null
  validation: string | null
  dbFunction: DbFunctionFormData[]
}

/**
 * Function usage form data for React Hook Form integration
 */
export interface DbFunctionFormData {
  /** Function usage contexts */
  use: string[]
  /** Database function expression */
  function: string
  /** Unique ID for form array management */
  id: string
}

/**
 * React Hook Form return type for field configuration
 */
export type FieldFormReturn = UseFormReturn<FieldFormData>

/**
 * Field paths for React Hook Form field references
 */
export type FieldFormPaths = FieldPath<FieldFormData>

// =============================================================================
// ZOD VALIDATION SCHEMA TYPES
// =============================================================================

/**
 * Zod schema type for field validation
 * Ensures real-time validation under 100ms performance target
 */
export type FieldValidationSchema = z.ZodType<FieldFormData>

/**
 * Database function usage Zod schema type
 */
export type DbFunctionValidationSchema = z.ZodType<DbFunctionFormData>

/**
 * Zod validation error context for enhanced error reporting
 */
export interface FieldValidationError {
  /** Field path where validation failed */
  path: string[]
  /** Error message */
  message: string
  /** Error code for programmatic handling */
  code: string
  /** Expected value type or format */
  expected?: string
  /** Received value that failed validation */
  received?: unknown
}

/**
 * Custom validation result type for async validation scenarios
 */
export interface AsyncValidationResult {
  /** Validation success flag */
  isValid: boolean
  /** Error details if validation failed */
  errors?: FieldValidationError[]
  /** Validation completion timestamp */
  timestamp: number
  /** Field name being validated */
  fieldName: string
}

// =============================================================================
// NEXT.JS ROUTING TYPES
// =============================================================================

/**
 * Next.js route parameters for field management pages
 */
export interface FieldRouteParams {
  /** Database service name */
  service: string
  /** Database name */
  database?: string
  /** Table name */
  table?: string
  /** Field ID for editing */
  fieldId?: string
}

/**
 * Next.js search parameters for field listing and filtering
 */
export interface FieldSearchParams {
  /** Current page number */
  page?: string
  /** Items per page */
  limit?: string
  /** Sort field name */
  sortBy?: string
  /** Sort direction */
  sortOrder?: 'asc' | 'desc'
  /** Search/filter query */
  search?: string
  /** Field type filter */
  type?: DreamFactoryFieldType
  /** Show only virtual fields */
  virtualOnly?: string
  /** Show only required fields */
  requiredOnly?: string
}

/**
 * Combined route context for field components
 */
export interface FieldRouteContext {
  /** Route parameters */
  params: FieldRouteParams
  /** Search parameters */
  searchParams: FieldSearchParams
}

// =============================================================================
// TANSTACK TABLE INTEGRATION TYPES
// =============================================================================

/**
 * Field table row data for TanStack Table virtualization
 * Optimized for 1000+ field listings
 */
export interface FieldTableRow {
  /** Unique field identifier */
  id: string
  /** Field name */
  name: string
  /** Field alias */
  alias: string
  /** Field type */
  type: DreamFactoryFieldType
  /** Database type */
  dbType: string
  /** Virtual field flag */
  isVirtual: boolean
  /** Aggregate field flag */
  isAggregate: boolean
  /** Required field flag */
  required: boolean
  /** Constraint summary string */
  constraints: string
  /** Primary key indicator */
  isPrimaryKey: boolean
  /** Foreign key indicator */
  isForeignKey: boolean
  /** Reference table name */
  refTable?: string
  /** Field length */
  length?: number
  /** Default value */
  default?: string | number | boolean
}

/**
 * TanStack Table column definition type for field listing
 */
export type FieldTableColumn = ColumnDef<FieldTableRow>

/**
 * Field table configuration for customizable displays
 */
export interface FieldTableConfig {
  /** Visible columns */
  columns: FieldTableColumn[]
  /** Enable virtualization for large datasets */
  enableVirtualization: boolean
  /** Page size for pagination */
  pageSize: number
  /** Enable sorting */
  enableSorting: boolean
  /** Enable filtering */
  enableFiltering: boolean
  /** Enable column resizing */
  enableColumnResizing: boolean
}

/**
 * Field table state for component management
 */
export interface FieldTableState {
  /** Current page index */
  pageIndex: number
  /** Page size */
  pageSize: number
  /** Sort configuration */
  sorting: Array<{
    id: string
    desc: boolean
  }>
  /** Filter values */
  columnFilters: Array<{
    id: string
    value: unknown
  }>
  /** Column visibility */
  columnVisibility: Record<string, boolean>
}

// =============================================================================
// FUNCTION USAGE REACT COMPONENT TYPES
// =============================================================================

/**
 * Props for the React function usage component
 */
export interface FunctionUseComponentProps {
  /** Form control reference */
  control: FieldFormReturn['control']
  /** Field name for the function array */
  name: 'dbFunction'
  /** Available functions dropdown options */
  functionOptions: FunctionOption[]
  /** Available usage contexts */
  usageOptions: UsageOption[]
  /** Show as accordion/expandable section */
  showAccordion?: boolean
  /** Component disabled state */
  disabled?: boolean
  /** Maximum number of functions allowed */
  maxFunctions?: number
}

/**
 * Function dropdown option
 */
export interface FunctionOption {
  /** Function value */
  value: string
  /** Display label */
  label: string
  /** Function description */
  description?: string
  /** Function category */
  category?: string
  /** SQL example */
  example?: string
}

/**
 * Usage context option
 */
export interface UsageOption {
  /** Usage value */
  value: string
  /** Display label */
  label: string
  /** Usage description */
  description?: string
}

/**
 * Function usage table row for component display
 */
export interface FunctionUseTableRow {
  /** Unique identifier */
  id: string
  /** Selected usage contexts */
  use: string[]
  /** Function expression */
  function: string
  /** Row index for form array management */
  index: number
}

// =============================================================================
// API RESPONSE TYPES
// =============================================================================

/**
 * API response for field CRUD operations
 */
export interface FieldApiResponse {
  /** Operation success flag */
  success: boolean
  /** Response message */
  message?: string
  /** Field data */
  data?: DatabaseSchemaFieldType
  /** Error details if operation failed */
  error?: {
    code: string
    message: string
    details?: unknown
  }
  /** Response metadata */
  meta?: {
    timestamp: number
    requestId: string
  }
}

/**
 * Bulk field operations response
 */
export interface BulkFieldApiResponse {
  /** Overall operation success */
  success: boolean
  /** Successfully processed fields */
  successful: string[]
  /** Failed field operations */
  failed: Array<{
    fieldName: string
    error: string
  }>
  /** Response message */
  message?: string
}

// =============================================================================
// UTILITY TYPES
// =============================================================================

/**
 * Field creation context with validation
 */
export interface FieldCreationContext {
  /** Parent table name */
  tableName: string
  /** Service name */
  serviceName: string
  /** Available field types for the database */
  availableTypes: DreamFactoryFieldType[]
  /** Existing field names for uniqueness validation */
  existingFieldNames: string[]
  /** Database constraints and limitations */
  constraints: {
    maxFieldNameLength: number
    maxLabelLength: number
    supportedConstraints: DatabaseConstraintType[]
  }
}

/**
 * Field update context with change tracking
 */
export interface FieldUpdateContext extends FieldCreationContext {
  /** Original field data for comparison */
  originalField: DatabaseSchemaFieldType
  /** Fields that have been modified */
  modifiedFields: (keyof DatabaseSchemaFieldType)[]
  /** Whether field rename is allowed */
  allowRename: boolean
}

/**
 * Utility type for extracting field paths with dot notation
 */
export type DeepFieldPath<T> = T extends object
  ? {
      [K in keyof T]: K extends string
        ? T[K] extends object
          ? `${K}` | `${K}.${DeepFieldPath<T[K]>}`
          : `${K}`
        : never
    }[keyof T]
  : never

/**
 * Type-safe field access helper
 */
export type FieldValue<T, P extends DeepFieldPath<T>> = P extends `${infer K}.${infer Rest}`
  ? K extends keyof T
    ? Rest extends DeepFieldPath<T[K]>
      ? FieldValue<T[K], Rest>
      : never
    : never
  : P extends keyof T
  ? T[P]
  : never

// =============================================================================
// FORM STEP WIZARD TYPES
// =============================================================================

/**
 * Field creation wizard step type
 */
export type FieldWizardStep = 
  | 'basic'
  | 'type'
  | 'constraints'
  | 'reference'
  | 'advanced'
  | 'review'

/**
 * Field wizard state management
 */
export interface FieldWizardState {
  /** Current step */
  currentStep: FieldWizardStep
  /** Completed steps */
  completedSteps: FieldWizardStep[]
  /** Step validation status */
  stepValidation: Record<FieldWizardStep, boolean>
  /** Form data */
  formData: Partial<FieldFormData>
  /** Wizard configuration */
  config: {
    allowStepSkip: boolean
    showProgress: boolean
    enableAutoSave: boolean
  }
}

/**
 * Field wizard step component props
 */
export interface FieldWizardStepProps {
  /** Form control */
  form: FieldFormReturn
  /** Current wizard state */
  wizardState: FieldWizardState
  /** Step navigation functions */
  navigation: {
    nextStep: () => void
    previousStep: () => void
    goToStep: (step: FieldWizardStep) => void
  }
  /** Field creation context */
  context: FieldCreationContext
}

// =============================================================================
// EXPORTS
// =============================================================================

/**
 * Default export combining all field types for convenient importing
 */
export type {
  // Core types
  DatabaseSchemaFieldType as FieldType,
  DbFunctionUseType as FunctionUse,
  DreamFactoryFieldType as FieldValueType,
  
  // Form types
  FieldFormData as FormData,
  FieldFormReturn as FormReturn,
  
  // Validation types
  FieldValidationSchema as ValidationSchema,
  AsyncValidationResult as ValidationResult,
  
  // Table types
  FieldTableRow as TableRow,
  FieldTableColumn as TableColumn,
  FieldTableState as TableState,
  
  // Route types
  FieldRouteParams as RouteParams,
  FieldSearchParams as SearchParams,
  FieldRouteContext as RouteContext,
  
  // API types
  FieldApiResponse as ApiResponse,
  BulkFieldApiResponse as BulkApiResponse,
  
  // Context types
  FieldCreationContext as CreationContext,
  FieldUpdateContext as UpdateContext,
  
  // Wizard types
  FieldWizardStep as WizardStep,
  FieldWizardState as WizardState,
  FieldWizardStepProps as WizardStepProps,
}