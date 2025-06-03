/**
 * Enhanced type definitions for database field management in React/Next.js DreamFactory Admin Interface
 * 
 * Provides comprehensive TypeScript types for database field configuration, form validation,
 * React Query integration, and Next.js routing. Supports React Hook Form with Zod schema
 * validation for type-safe field management workflows.
 * 
 * @author DreamFactory Admin Interface Team
 * @version React 19/Next.js 15.1 Migration
 */

import { z } from 'zod'
import type { 
  UseFormReturn, 
  FieldValues, 
  Control, 
  FieldErrors,
  SubmitHandler,
  DefaultValues 
} from 'react-hook-form'
import type { 
  UseMutationResult, 
  UseQueryResult,
  MutationOptions,
  QueryOptions 
} from '@tanstack/react-query'
import type { 
  ApiSuccessResponse, 
  ApiErrorResponse, 
  ApiCreateResponse, 
  ApiUpdateResponse,
  ValidationError 
} from '@/types/api'

// =============================================================================
// CORE DATABASE FIELD TYPES
// =============================================================================

/**
 * Database function configuration type for field-level functions
 */
export type DbFunctionUseType = {
  use: string[]
  function: string
}

/**
 * Enhanced database schema field type with React Query integration support
 * Maintains compatibility with existing DreamFactory field structures
 */
export interface DatabaseSchemaFieldType {
  alias: string | null
  allowNull: boolean
  autoIncrement: boolean
  dbFunction: DbFunctionUseType[] | null
  dbType: string | null
  description: string | null
  default: string | null
  fixedLength: boolean
  isAggregate: boolean
  isForeignKey: boolean
  isPrimaryKey: boolean
  isUnique: boolean
  isVirtual: boolean
  label: string
  length: number | null
  name: string
  native: [] | null
  picklist: string | null
  precision: number | null
  refField: string | null
  refTable: string | null
  refOnDelete: string | null
  refOnUpdate: string | null
  required: boolean
  scale: number
  supportsMultibyte: boolean
  type: string
  validation: string | null
  value: []
}

/**
 * Field type options supported by DreamFactory
 */
export const FIELD_TYPES = [
  'id',
  'string',
  'text',
  'integer',
  'bigint',
  'decimal',
  'float',
  'double',
  'boolean',
  'date',
  'datetime',
  'time',
  'timestamp',
  'json',
  'binary',
  'reference'
] as const

export type FieldType = typeof FIELD_TYPES[number]

/**
 * Reference constraint actions for foreign key relationships
 */
export const REFERENCE_ACTIONS = [
  'NO ACTION',
  'CASCADE',
  'SET NULL',
  'SET DEFAULT',
  'RESTRICT'
] as const

export type ReferenceAction = typeof REFERENCE_ACTIONS[number]

// =============================================================================
// REACT HOOK FORM INTEGRATION TYPES
// =============================================================================

/**
 * Form data structure for field creation/editing with React Hook Form
 * Optimized for controlled form inputs with real-time validation
 */
export interface FieldFormData {
  // Basic field information
  name: string
  label: string
  type: FieldType
  description: string | null
  
  // Field constraints
  required: boolean
  allowNull: boolean
  isUnique: boolean
  isPrimaryKey: boolean
  autoIncrement: boolean
  
  // Type-specific attributes
  length: number | null
  precision: number | null
  scale: number
  fixedLength: boolean
  supportsMultibyte: boolean
  
  // Default values and validation
  default: string | null
  validation: string | null
  picklist: string | null
  
  // Reference/relationship configuration
  isForeignKey: boolean
  refTable: string | null
  refField: string | null
  refOnDelete: ReferenceAction | null
  refOnUpdate: ReferenceAction | null
  
  // Advanced attributes
  isVirtual: boolean
  isAggregate: boolean
  alias: string | null
  dbType: string | null
  
  // Database functions
  dbFunction: DbFunctionUseType[] | null
}

/**
 * React Hook Form configuration type with enhanced validation
 */
export interface FieldFormConfig extends UseFormReturn<FieldFormData> {
  control: Control<FieldFormData>
  formState: {
    errors: FieldErrors<FieldFormData>
    isValid: boolean
    isSubmitting: boolean
    isDirty: boolean
    dirtyFields: Partial<Record<keyof FieldFormData, boolean>>
    touchedFields: Partial<Record<keyof FieldFormData, boolean>>
  }
  handleSubmit: (onSubmit: SubmitHandler<FieldFormData>) => (e?: React.BaseSyntheticEvent) => Promise<void>
  reset: (values?: DefaultValues<FieldFormData>) => void
  setValue: (name: keyof FieldFormData, value: any, options?: { shouldValidate?: boolean }) => void
  getValues: (name?: keyof FieldFormData) => any
  watch: (name?: keyof FieldFormData) => any
}

/**
 * Field form submission context for React Query mutations
 */
export interface FieldFormSubmissionContext {
  serviceName: string
  tableName: string
  fieldName?: string // For edit mode
  isEditMode: boolean
  previousData?: DatabaseSchemaFieldType
}

// =============================================================================
// ZOD VALIDATION SCHEMAS
// =============================================================================

/**
 * Zod schema for database function configuration
 */
export const DbFunctionUseTypeSchema = z.object({
  use: z.array(z.string()),
  function: z.string().min(1, 'Function name is required')
})

/**
 * Comprehensive Zod schema for field form validation
 * Implements real-time validation with conditional rules based on field type
 */
export const FieldFormDataSchema = z.object({
  // Basic field information - required fields
  name: z.string()
    .min(1, 'Field name is required')
    .max(64, 'Field name must be 64 characters or less')
    .regex(/^[a-zA-Z][a-zA-Z0-9_]*$/, 'Field name must start with a letter and contain only letters, numbers, and underscores'),
  
  label: z.string()
    .min(1, 'Field label is required')
    .max(255, 'Field label must be 255 characters or less'),
  
  type: z.enum(FIELD_TYPES, {
    errorMap: () => ({ message: 'Please select a valid field type' })
  }),
  
  description: z.string().max(1000, 'Description must be 1000 characters or less').nullable(),
  
  // Field constraints
  required: z.boolean(),
  allowNull: z.boolean(),
  isUnique: z.boolean(),
  isPrimaryKey: z.boolean(),
  autoIncrement: z.boolean(),
  
  // Type-specific attributes with conditional validation
  length: z.number()
    .int('Length must be a whole number')
    .min(1, 'Length must be greater than 0')
    .max(65535, 'Length cannot exceed 65535')
    .nullable(),
  
  precision: z.number()
    .int('Precision must be a whole number')
    .min(1, 'Precision must be greater than 0')
    .max(65, 'Precision cannot exceed 65')
    .nullable(),
  
  scale: z.number()
    .int('Scale must be a whole number')
    .min(0, 'Scale cannot be negative')
    .max(30, 'Scale cannot exceed 30')
    .default(0),
  
  fixedLength: z.boolean(),
  supportsMultibyte: z.boolean(),
  
  // Default values and validation
  default: z.string().nullable(),
  validation: z.string().nullable(),
  picklist: z.string().nullable(),
  
  // Reference/relationship configuration
  isForeignKey: z.boolean(),
  refTable: z.string().min(1, 'Reference table is required').nullable(),
  refField: z.string().min(1, 'Reference field is required').nullable(),
  refOnDelete: z.enum(REFERENCE_ACTIONS).nullable(),
  refOnUpdate: z.enum(REFERENCE_ACTIONS).nullable(),
  
  // Advanced attributes
  isVirtual: z.boolean(),
  isAggregate: z.boolean(),
  alias: z.string().max(64, 'Alias must be 64 characters or less').nullable(),
  dbType: z.string().max(255, 'Database type must be 255 characters or less').nullable(),
  
  // Database functions
  dbFunction: z.array(DbFunctionUseTypeSchema).nullable()
})
.refine((data) => {
  // Conditional validation: auto increment requires integer type and primary key
  if (data.autoIncrement && (data.type !== 'integer' && data.type !== 'bigint')) {
    return false
  }
  return true
}, {
  message: 'Auto increment can only be enabled for integer or bigint fields',
  path: ['autoIncrement']
})
.refine((data) => {
  // Conditional validation: auto increment requires primary key
  if (data.autoIncrement && !data.isPrimaryKey) {
    return false
  }
  return true
}, {
  message: 'Auto increment requires the field to be a primary key',
  path: ['autoIncrement']
})
.refine((data) => {
  // Conditional validation: foreign key requires reference table and field
  if (data.isForeignKey && (!data.refTable || !data.refField)) {
    return false
  }
  return true
}, {
  message: 'Foreign key requires both reference table and field',
  path: ['refTable']
})
.refine((data) => {
  // Conditional validation: primary key cannot allow null
  if (data.isPrimaryKey && data.allowNull) {
    return false
  }
  return true
}, {
  message: 'Primary key fields cannot allow null values',
  path: ['allowNull']
})
.refine((data) => {
  // Conditional validation: required fields cannot allow null
  if (data.required && data.allowNull) {
    return false
  }
  return true
}, {
  message: 'Required fields cannot allow null values',
  path: ['allowNull']
})
.refine((data) => {
  // Conditional validation: precision/scale validation for decimal types
  if ((data.type === 'decimal' || data.type === 'float' || data.type === 'double') && data.precision && data.scale > data.precision) {
    return false
  }
  return true
}, {
  message: 'Scale cannot be greater than precision',
  path: ['scale']
})

/**
 * Type inference from Zod schema for form validation
 */
export type FieldFormValidation = z.infer<typeof FieldFormDataSchema>

/**
 * Zod schema for database schema field type (API response)
 */
export const DatabaseSchemaFieldTypeSchema = z.object({
  alias: z.string().nullable(),
  allowNull: z.boolean(),
  autoIncrement: z.boolean(),
  dbFunction: z.array(DbFunctionUseTypeSchema).nullable(),
  dbType: z.string().nullable(),
  description: z.string().nullable(),
  default: z.string().nullable(),
  fixedLength: z.boolean(),
  isAggregate: z.boolean(),
  isForeignKey: z.boolean(),
  isPrimaryKey: z.boolean(),
  isUnique: z.boolean(),
  isVirtual: z.boolean(),
  label: z.string(),
  length: z.number().nullable(),
  name: z.string(),
  native: z.array(z.unknown()).nullable(),
  picklist: z.string().nullable(),
  precision: z.number().nullable(),
  refField: z.string().nullable(),
  refTable: z.string().nullable(),
  refOnDelete: z.string().nullable(),
  refOnUpdate: z.string().nullable(),
  required: z.boolean(),
  scale: z.number(),
  supportsMultibyte: z.boolean(),
  type: z.string(),
  validation: z.string().nullable(),
  value: z.array(z.unknown())
})

// =============================================================================
// REACT QUERY INTEGRATION TYPES
// =============================================================================

/**
 * React Query key factory for field-related queries
 */
export const fieldQueryKeys = {
  all: ['fields'] as const,
  lists: () => [...fieldQueryKeys.all, 'list'] as const,
  list: (serviceName: string, tableName: string) => 
    [...fieldQueryKeys.lists(), serviceName, tableName] as const,
  details: () => [...fieldQueryKeys.all, 'detail'] as const,
  detail: (serviceName: string, tableName: string, fieldName: string) => 
    [...fieldQueryKeys.details(), serviceName, tableName, fieldName] as const,
  schema: (serviceName: string, tableName: string) => 
    [...fieldQueryKeys.all, 'schema', serviceName, tableName] as const
}

/**
 * Field creation mutation variables
 */
export interface CreateFieldMutationVariables {
  serviceName: string
  tableName: string
  fieldData: FieldFormData
}

/**
 * Field update mutation variables
 */
export interface UpdateFieldMutationVariables {
  serviceName: string
  tableName: string
  fieldName: string
  fieldData: Partial<FieldFormData>
}

/**
 * Field deletion mutation variables
 */
export interface DeleteFieldMutationVariables {
  serviceName: string
  tableName: string
  fieldName: string
}

/**
 * Field query variables for fetching field details
 */
export interface FieldQueryVariables {
  serviceName: string
  tableName: string
  fieldName?: string
}

/**
 * Enhanced field query result with React Query integration
 */
export type FieldQueryResult = UseQueryResult<DatabaseSchemaFieldType, ApiErrorResponse>

/**
 * Enhanced field list query result
 */
export type FieldListQueryResult = UseQueryResult<DatabaseSchemaFieldType[], ApiErrorResponse>

/**
 * Field creation mutation result with optimistic updates
 */
export type CreateFieldMutationResult = UseMutationResult<
  ApiCreateResponse,
  ApiErrorResponse,
  CreateFieldMutationVariables,
  {
    previousFields?: DatabaseSchemaFieldType[]
    newField?: DatabaseSchemaFieldType
  }
>

/**
 * Field update mutation result with optimistic updates
 */
export type UpdateFieldMutationResult = UseMutationResult<
  ApiUpdateResponse,
  ApiErrorResponse,
  UpdateFieldMutationVariables,
  {
    previousField?: DatabaseSchemaFieldType
    updatedField?: DatabaseSchemaFieldType
  }
>

/**
 * Field deletion mutation result
 */
export type DeleteFieldMutationResult = UseMutationResult<
  ApiSuccessResponse,
  ApiErrorResponse,
  DeleteFieldMutationVariables,
  {
    previousFields?: DatabaseSchemaFieldType[]
  }
>

/**
 * Field mutation configuration options
 */
export interface FieldMutationOptions {
  onSuccess?: (data: any, variables: any, context: any) => Promise<void> | void
  onError?: (error: ApiErrorResponse, variables: any, context: any) => Promise<void> | void
  onSettled?: (data: any, error: ApiErrorResponse | null, variables: any, context: any) => Promise<void> | void
  retry?: boolean | number
  retryDelay?: number
  useErrorBoundary?: boolean
}

// =============================================================================
// NEXT.JS ROUTE PARAMETER TYPES
// =============================================================================

/**
 * Next.js route parameters for field detail pages
 */
export interface FieldDetailRouteParams {
  params: {
    service: string    // Database service name
    table: string      // Table name
    fieldId?: string   // Field name for edit mode (optional for create mode)
  }
  searchParams: {
    mode?: 'create' | 'edit'
    tab?: 'basic' | 'constraints' | 'relationships' | 'functions'
    returnUrl?: string
  }
}

/**
 * Type-safe route parameter extraction
 */
export type FieldRouteParams = FieldDetailRouteParams['params']
export type FieldSearchParams = FieldDetailRouteParams['searchParams']

/**
 * Static generation parameters for field pages
 */
export interface FieldStaticParams {
  service: string
  table: string
  fieldId: string
}

/**
 * Server component props for field detail page
 */
export interface FieldDetailPageProps {
  params: FieldRouteParams
  searchParams: FieldSearchParams
}

/**
 * Field navigation context for breadcrumbs and navigation
 */
export interface FieldNavigationContext {
  serviceName: string
  tableName: string
  fieldName?: string
  isEditMode: boolean
  previousUrl?: string
  nextUrl?: string
}

// =============================================================================
// FORM FIELD CONFIGURATION TYPES
// =============================================================================

/**
 * Dynamic field configuration based on field type
 * Controls which form controls are enabled/disabled
 */
export interface FieldTypeConfiguration {
  supportsLength: boolean
  supportsPrecision: boolean
  supportsScale: boolean
  supportsDefault: boolean
  supportsAutoIncrement: boolean
  supportsUnique: boolean
  supportsForeignKey: boolean
  requiredProperties: (keyof FieldFormData)[]
  disabledProperties: (keyof FieldFormData)[]
}

/**
 * Field type configuration mapping
 */
export type FieldTypeConfigurationMap = Record<FieldType, FieldTypeConfiguration>

/**
 * Form field visibility and behavior configuration
 */
export interface FormFieldConfig {
  visible: boolean
  enabled: boolean
  required: boolean
  placeholder?: string
  helpText?: string
  validationRules?: z.ZodSchema
}

/**
 * Dynamic form configuration based on field type and state
 */
export type FormConfiguration = Record<keyof FieldFormData, FormFieldConfig>

// =============================================================================
// ERROR HANDLING AND VALIDATION TYPES
// =============================================================================

/**
 * Field validation error with enhanced context
 */
export interface FieldValidationError extends ValidationError {
  field: keyof FieldFormData
  code: string
  message: string
  value?: unknown
  dependencies?: (keyof FieldFormData)[]
  suggestions?: string[]
}

/**
 * Form submission error context
 */
export interface FieldFormError {
  type: 'validation' | 'network' | 'server' | 'unknown'
  message: string
  field?: keyof FieldFormData
  errors?: FieldValidationError[]
  retry?: () => void
  timestamp: Date
}

/**
 * Field operation success response
 */
export interface FieldOperationSuccess {
  type: 'create' | 'update' | 'delete'
  fieldName: string
  tableName: string
  serviceName: string
  message: string
  timestamp: Date
}

// =============================================================================
// UTILITY TYPES AND EXPORTS
// =============================================================================

/**
 * Extract field form data from database field type
 */
export type FieldFormDataFromDatabaseField = Pick<DatabaseSchemaFieldType, 
  | 'name' | 'label' | 'type' | 'description' | 'required' | 'allowNull' 
  | 'isUnique' | 'isPrimaryKey' | 'autoIncrement' | 'length' | 'precision' 
  | 'scale' | 'fixedLength' | 'supportsMultibyte' | 'default' | 'validation'
  | 'picklist' | 'isForeignKey' | 'refTable' | 'refField' | 'refOnDelete'
  | 'refOnUpdate' | 'isVirtual' | 'isAggregate' | 'alias' | 'dbType' | 'dbFunction'
>

/**
 * Create field form default values from database field
 */
export const createFieldFormDefaults = (field?: DatabaseSchemaFieldType): DefaultValues<FieldFormData> => {
  if (!field) {
    return {
      name: '',
      label: '',
      type: 'string',
      description: null,
      required: false,
      allowNull: true,
      isUnique: false,
      isPrimaryKey: false,
      autoIncrement: false,
      length: null,
      precision: null,
      scale: 0,
      fixedLength: false,
      supportsMultibyte: false,
      default: null,
      validation: null,
      picklist: null,
      isForeignKey: false,
      refTable: null,
      refField: null,
      refOnDelete: null,
      refOnUpdate: null,
      isVirtual: false,
      isAggregate: false,
      alias: null,
      dbType: null,
      dbFunction: null
    }
  }

  return {
    name: field.name,
    label: field.label,
    type: field.type as FieldType,
    description: field.description,
    required: field.required,
    allowNull: field.allowNull,
    isUnique: field.isUnique,
    isPrimaryKey: field.isPrimaryKey,
    autoIncrement: field.autoIncrement,
    length: field.length,
    precision: field.precision,
    scale: field.scale,
    fixedLength: field.fixedLength,
    supportsMultibyte: field.supportsMultibyte,
    default: field.default,
    validation: field.validation,
    picklist: field.picklist,
    isForeignKey: field.isForeignKey,
    refTable: field.refTable,
    refField: field.refField,
    refOnDelete: field.refOnDelete as ReferenceAction | null,
    refOnUpdate: field.refOnUpdate as ReferenceAction | null,
    isVirtual: field.isVirtual,
    isAggregate: field.isAggregate,
    alias: field.alias,
    dbType: field.dbType,
    dbFunction: field.dbFunction
  }
}

// =============================================================================
// EXPORTS
// =============================================================================

export type {
  // Core types
  DatabaseSchemaFieldType,
  DbFunctionUseType,
  FieldType,
  ReferenceAction,
  
  // Form types
  FieldFormData,
  FieldFormConfig,
  FieldFormSubmissionContext,
  FieldFormValidation,
  
  // React Query types
  FieldQueryResult,
  FieldListQueryResult,
  CreateFieldMutationResult,
  UpdateFieldMutationResult,
  DeleteFieldMutationResult,
  CreateFieldMutationVariables,
  UpdateFieldMutationVariables,
  DeleteFieldMutationVariables,
  FieldQueryVariables,
  FieldMutationOptions,
  
  // Next.js types
  FieldDetailRouteParams,
  FieldRouteParams,
  FieldSearchParams,
  FieldStaticParams,
  FieldDetailPageProps,
  FieldNavigationContext,
  
  // Configuration types
  FieldTypeConfiguration,
  FieldTypeConfigurationMap,
  FormFieldConfig,
  FormConfiguration,
  
  // Error handling types
  FieldValidationError,
  FieldFormError,
  FieldOperationSuccess,
  
  // Utility types
  FieldFormDataFromDatabaseField
}

export {
  // Constants
  FIELD_TYPES,
  REFERENCE_ACTIONS,
  
  // Schemas
  FieldFormDataSchema,
  DatabaseSchemaFieldTypeSchema,
  DbFunctionUseTypeSchema,
  
  // Query keys
  fieldQueryKeys,
  
  // Utilities
  createFieldFormDefaults
}