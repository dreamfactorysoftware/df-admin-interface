/**
 * Field Details Types - React/Next.js Migration
 * 
 * Enhanced type definitions supporting React Hook Form integration, Zod schema validation,
 * React Query operations, and Next.js route parameters for database field management.
 * 
 * @fileoverview Database field type definitions with React/Next.js integration
 * @version 2.0.0
 * @since React 19.0.0 / Next.js 15.1+
 */

import { z } from 'zod';
import { 
  UseFormReturn, 
  FieldValues, 
  Path, 
  PathValue,
  SubmitHandler,
  SubmitErrorHandler,
  FormState,
  FieldErrors,
  FieldError
} from 'react-hook-form';
import { 
  UseMutationResult, 
  UseQueryResult, 
  UseMutationOptions,
  UseQueryOptions,
  QueryKey,
  MutationFunction,
  QueryFunction
} from '@tanstack/react-query';
import { 
  ApiResponse,
  ApiResourceResponse,
  ApiListResponse,
  ApiErrorResponse,
  MutationOptions
} from '../../../types/api';

// ============================================================================
// Core Database Field Types
// ============================================================================

/**
 * Database function usage type for field configuration
 */
export interface DbFunctionUseType {
  /** Available function use cases */
  use: string[];
  /** Function name */
  function: string;
}

/**
 * Core database schema field type
 * Maintains compatibility with existing DreamFactory field structure
 */
export interface DatabaseSchemaFieldType {
  /** Field alias name */
  alias: string | null;
  /** Whether field allows null values */
  allowNull: boolean;
  /** Whether field auto-increments */
  autoIncrement: boolean;
  /** Database functions available for this field */
  dbFunction: DbFunctionUseType[] | null;
  /** Database-specific type */
  dbType: string | null;
  /** Field description */
  description: string | null;
  /** Default value */
  default: string | null;
  /** Whether field has fixed length */
  fixedLength: boolean;
  /** Whether field is an aggregate */
  isAggregate: boolean;
  /** Whether field is a foreign key */
  isForeignKey: boolean;
  /** Whether field is a primary key */
  isPrimaryKey: boolean;
  /** Whether field has unique constraint */
  isUnique: boolean;
  /** Whether field is virtual */
  isVirtual: boolean;
  /** Display label */
  label: string;
  /** Field length constraint */
  length: number | null;
  /** Field name */
  name: string;
  /** Native field properties */
  native: any[] | null;
  /** Picklist values for enum fields */
  picklist: string | null;
  /** Numeric precision */
  precision: number | null;
  /** Referenced field name for foreign keys */
  refField: string | null;
  /** Referenced table name for foreign keys */
  refTable: string | null;
  /** Foreign key delete action */
  refOnDelete: string | null;
  /** Foreign key update action */
  refOnUpdate: string | null;
  /** Whether field is required */
  required: boolean;
  /** Numeric scale */
  scale: number;
  /** Whether field supports multibyte characters */
  supportsMultibyte: boolean;
  /** Field data type */
  type: string;
  /** Validation rules */
  validation: string | null;
  /** Field value (for form state) */
  value: any[];
}

// ============================================================================
// Zod Schema Definitions for Form Validation
// ============================================================================

/**
 * Database function use schema for validation
 */
export const DbFunctionUseSchema = z.object({
  use: z.array(z.string()).min(1, 'At least one function use is required'),
  function: z.string().min(1, 'Function name is required'),
});

/**
 * Comprehensive Zod schema for database field validation
 * Provides runtime type checking integrated with React Hook Form
 */
export const DatabaseSchemaFieldSchema = z.object({
  alias: z.string().nullable(),
  allowNull: z.boolean(),
  autoIncrement: z.boolean(),
  dbFunction: z.array(DbFunctionUseSchema).nullable(),
  dbType: z.string().nullable(),
  description: z.string().nullable(),
  default: z.string().nullable(),
  fixedLength: z.boolean(),
  isAggregate: z.boolean(),
  isForeignKey: z.boolean(),
  isPrimaryKey: z.boolean(),
  isUnique: z.boolean(),
  isVirtual: z.boolean(),
  label: z.string().min(1, 'Field label is required'),
  length: z.number().int().positive().nullable(),
  name: z.string()
    .min(1, 'Field name is required')
    .regex(/^[a-zA-Z_][a-zA-Z0-9_]*$/, 'Field name must be a valid identifier'),
  native: z.array(z.any()).nullable(),
  picklist: z.string().nullable(),
  precision: z.number().int().positive().nullable(),
  refField: z.string().nullable(),
  refTable: z.string().nullable(),
  refOnDelete: z.enum(['CASCADE', 'SET NULL', 'RESTRICT', 'NO ACTION']).nullable(),
  refOnUpdate: z.enum(['CASCADE', 'SET NULL', 'RESTRICT', 'NO ACTION']).nullable(),
  required: z.boolean(),
  scale: z.number().int().min(0),
  supportsMultibyte: z.boolean(),
  type: z.string().min(1, 'Field type is required'),
  validation: z.string().nullable(),
  value: z.array(z.any()).default([]),
});

/**
 * Field creation schema with required fields only
 */
export const CreateFieldSchema = DatabaseSchemaFieldSchema.pick({
  name: true,
  type: true,
  label: true,
  allowNull: true,
  required: true,
  description: true,
  default: true,
  length: true,
  precision: true,
  scale: true,
});

/**
 * Field update schema with optional fields
 */
export const UpdateFieldSchema = DatabaseSchemaFieldSchema.partial().extend({
  name: z.string().min(1, 'Field name is required'),
});

/**
 * Bulk field operations schema
 */
export const BulkFieldOperationSchema = z.object({
  action: z.enum(['create', 'update', 'delete']),
  fields: z.array(DatabaseSchemaFieldSchema.partial().extend({
    name: z.string().min(1, 'Field name is required'),
  })),
});

// ============================================================================
// React Hook Form Integration Types
// ============================================================================

/**
 * Form data type for field creation and editing
 */
export type FieldFormData = z.infer<typeof CreateFieldSchema>;

/**
 * Form data type for field updates
 */
export type FieldUpdateFormData = z.infer<typeof UpdateFieldSchema>;

/**
 * Form data type for bulk operations
 */
export type BulkFieldFormData = z.infer<typeof BulkFieldOperationSchema>;

/**
 * Enhanced form state for field management with React Hook Form
 */
export interface FieldFormState extends FormState<FieldFormData> {
  /** Current field being edited */
  currentField?: DatabaseSchemaFieldType;
  /** Whether form is in creation mode */
  isCreating: boolean;
  /** Whether form is in editing mode */
  isEditing: boolean;
  /** Validation state for each field */
  fieldValidation: Record<keyof FieldFormData, {
    isValid: boolean;
    error?: FieldError;
    isDirty: boolean;
    isTouched: boolean;
  }>;
}

/**
 * React Hook Form return type for field management
 */
export type FieldFormReturn = UseFormReturn<FieldFormData> & {
  /** Enhanced form state */
  formState: FieldFormState;
  /** Submit handler with proper typing */
  onSubmit: SubmitHandler<FieldFormData>;
  /** Error handler with proper typing */
  onError: SubmitErrorHandler<FieldFormData>;
  /** Field validation helpers */
  validateField: (fieldName: Path<FieldFormData>, value: PathValue<FieldFormData, Path<FieldFormData>>) => Promise<boolean>;
  /** Reset form to initial state */
  resetForm: () => void;
  /** Load field data into form */
  loadField: (field: DatabaseSchemaFieldType) => void;
};

/**
 * Form configuration options for field management
 */
export interface FieldFormConfig {
  /** Default values for new fields */
  defaultValues?: Partial<FieldFormData>;
  /** Form mode */
  mode?: 'create' | 'edit' | 'view';
  /** Validation mode */
  validationMode?: 'onChange' | 'onBlur' | 'onSubmit';
  /** Re-validation mode */
  reValidateMode?: 'onChange' | 'onBlur' | 'onSubmit';
  /** Whether to focus first error field */
  shouldFocusError?: boolean;
  /** Custom validation schema */
  schema?: z.ZodSchema<any>;
}

// ============================================================================
// React Query Integration Types
// ============================================================================

/**
 * Query key factory for field-related queries
 */
export const fieldQueryKeys = {
  /** All field queries */
  all: ['fields'] as const,
  /** List queries */
  lists: () => [...fieldQueryKeys.all, 'list'] as const,
  /** List query for specific table */
  list: (tableId: string) => [...fieldQueryKeys.lists(), tableId] as const,
  /** Detail queries */
  details: () => [...fieldQueryKeys.all, 'detail'] as const,
  /** Detail query for specific field */
  detail: (tableId: string, fieldId: string) => [...fieldQueryKeys.details(), tableId, fieldId] as const,
  /** Schema queries */
  schemas: () => [...fieldQueryKeys.all, 'schema'] as const,
  /** Schema query for specific table */
  schema: (tableId: string) => [...fieldQueryKeys.schemas(), tableId] as const,
};

/**
 * Query function type for field fetching
 */
export type FieldQueryFunction<T = DatabaseSchemaFieldType> = QueryFunction<T, QueryKey>;

/**
 * Query options for field list
 */
export type FieldListQueryOptions = UseQueryOptions<
  ApiListResponse<DatabaseSchemaFieldType>,
  ApiErrorResponse,
  ApiListResponse<DatabaseSchemaFieldType>,
  ReturnType<typeof fieldQueryKeys.list>
>;

/**
 * Query options for field detail
 */
export type FieldDetailQueryOptions = UseQueryOptions<
  ApiResourceResponse<DatabaseSchemaFieldType>,
  ApiErrorResponse,
  ApiResourceResponse<DatabaseSchemaFieldType>,
  ReturnType<typeof fieldQueryKeys.detail>
>;

/**
 * Query result type for field list
 */
export type FieldListQueryResult = UseQueryResult<
  ApiListResponse<DatabaseSchemaFieldType>,
  ApiErrorResponse
>;

/**
 * Query result type for field detail
 */
export type FieldDetailQueryResult = UseQueryResult<
  ApiResourceResponse<DatabaseSchemaFieldType>,
  ApiErrorResponse
>;

/**
 * Mutation function type for field operations
 */
export type FieldMutationFunction<TData, TVariables> = MutationFunction<TData, TVariables>;

/**
 * Field creation mutation options
 */
export type CreateFieldMutationOptions = UseMutationOptions<
  ApiResourceResponse<DatabaseSchemaFieldType>,
  ApiErrorResponse,
  { tableId: string; fieldData: FieldFormData }
>;

/**
 * Field update mutation options
 */
export type UpdateFieldMutationOptions = UseMutationOptions<
  ApiResourceResponse<DatabaseSchemaFieldType>,
  ApiErrorResponse,
  { tableId: string; fieldId: string; fieldData: FieldUpdateFormData }
>;

/**
 * Field deletion mutation options
 */
export type DeleteFieldMutationOptions = UseMutationOptions<
  ApiResponse<void>,
  ApiErrorResponse,
  { tableId: string; fieldId: string }
>;

/**
 * Bulk field operation mutation options
 */
export type BulkFieldMutationOptions = UseMutationOptions<
  ApiListResponse<DatabaseSchemaFieldType>,
  ApiErrorResponse,
  { tableId: string; operations: BulkFieldFormData }
>;

/**
 * Field creation mutation result
 */
export type CreateFieldMutationResult = UseMutationResult<
  ApiResourceResponse<DatabaseSchemaFieldType>,
  ApiErrorResponse,
  { tableId: string; fieldData: FieldFormData }
>;

/**
 * Field update mutation result
 */
export type UpdateFieldMutationResult = UseMutationResult<
  ApiResourceResponse<DatabaseSchemaFieldType>,
  ApiErrorResponse,
  { tableId: string; fieldId: string; fieldData: FieldUpdateFormData }
>;

/**
 * Field deletion mutation result
 */
export type DeleteFieldMutationResult = UseMutationResult<
  ApiResponse<void>,
  ApiErrorResponse,
  { tableId: string; fieldId: string }
>;

// ============================================================================
// Next.js Route Parameters and Form Submission Types
// ============================================================================

/**
 * Next.js route parameters for field pages
 */
export interface FieldRouteParams {
  /** Table ID from route */
  tableId: string;
  /** Field ID from route (optional for create) */
  fieldId?: string;
  /** Service ID for context */
  serviceId?: string;
}

/**
 * Next.js search parameters for field pages
 */
export interface FieldSearchParams {
  /** Tab selection */
  tab?: 'details' | 'relationships' | 'validation' | 'advanced';
  /** Filter fields */
  filter?: string;
  /** Sort order */
  sort?: 'name' | 'type' | 'created' | 'updated';
  /** Sort direction */
  order?: 'asc' | 'desc';
  /** Page number */
  page?: string;
  /** Items per page */
  limit?: string;
  /** Return URL after operation */
  returnUrl?: string;
}

/**
 * Next.js page props for field detail pages
 */
export interface FieldPageProps {
  /** Route parameters */
  params: FieldRouteParams;
  /** Search parameters */
  searchParams: FieldSearchParams;
}

/**
 * Form submission context for Next.js server actions
 */
export interface FieldFormSubmissionContext {
  /** Form data being submitted */
  data: FieldFormData | FieldUpdateFormData;
  /** Current route parameters */
  params: FieldRouteParams;
  /** User authentication context */
  user?: {
    id: string;
    roles: string[];
    permissions: string[];
  };
  /** Request metadata */
  request: {
    /** Request ID for tracing */
    id: string;
    /** Request timestamp */
    timestamp: string;
    /** User agent */
    userAgent?: string;
  };
}

/**
 * Server action result for field operations
 */
export interface FieldServerActionResult<T = any> {
  /** Operation success status */
  success: boolean;
  /** Result data (on success) */
  data?: T;
  /** Error information (on failure) */
  error?: {
    code: string;
    message: string;
    field?: string;
    details?: Record<string, any>;
  };
  /** Redirect URL after operation */
  redirect?: string;
  /** Toast message to display */
  toast?: {
    type: 'success' | 'error' | 'warning' | 'info';
    title: string;
    message: string;
  };
}

/**
 * Next.js server action function type for field operations
 */
export type FieldServerAction<TInput, TOutput> = (
  data: TInput,
  context: FieldFormSubmissionContext
) => Promise<FieldServerActionResult<TOutput>>;

/**
 * Typed server action for field creation
 */
export type CreateFieldServerAction = FieldServerAction<
  FieldFormData,
  DatabaseSchemaFieldType
>;

/**
 * Typed server action for field updates
 */
export type UpdateFieldServerAction = FieldServerAction<
  FieldUpdateFormData,
  DatabaseSchemaFieldType
>;

/**
 * Typed server action for field deletion
 */
export type DeleteFieldServerAction = FieldServerAction<
  { fieldId: string },
  void
>;

// ============================================================================
// Enhanced Type Utilities
// ============================================================================

/**
 * Extract field type from API response
 */
export type ExtractFieldType<T> = T extends ApiResourceResponse<infer U>
  ? U extends DatabaseSchemaFieldType
    ? U
    : never
  : T extends ApiListResponse<infer U>
    ? U extends DatabaseSchemaFieldType
      ? U
      : never
    : never;

/**
 * Field type union for different operation contexts
 */
export type FieldOperationType = 'create' | 'update' | 'delete' | 'view';

/**
 * Context-aware field type
 */
export type ContextualFieldType<T extends FieldOperationType> = 
  T extends 'create' 
    ? FieldFormData
    : T extends 'update'
      ? FieldUpdateFormData  
      : T extends 'delete'
        ? Pick<DatabaseSchemaFieldType, 'name' | 'type'>
        : DatabaseSchemaFieldType;

/**
 * Form validation state for specific operations
 */
export type FieldValidationState<T extends FieldOperationType> = {
  [K in keyof ContextualFieldType<T>]: {
    isValid: boolean;
    error?: string;
    isValidating: boolean;
  };
};

/**
 * Type guard to check if field is valid
 */
export function isValidField(field: any): field is DatabaseSchemaFieldType {
  return (
    typeof field === 'object' &&
    field !== null &&
    typeof field.name === 'string' &&
    typeof field.type === 'string' &&
    typeof field.label === 'string'
  );
}

/**
 * Type guard to check if form data is for creation
 */
export function isCreateFormData(data: any): data is FieldFormData {
  return (
    typeof data === 'object' &&
    data !== null &&
    typeof data.name === 'string' &&
    typeof data.type === 'string' &&
    typeof data.label === 'string'
  );
}

/**
 * Type guard to check if form data is for update
 */
export function isUpdateFormData(data: any): data is FieldUpdateFormData {
  return (
    typeof data === 'object' &&
    data !== null &&
    typeof data.name === 'string'
  );
}

// ============================================================================
// Export Legacy Types for Compatibility
// ============================================================================

/**
 * @deprecated Use DatabaseSchemaFieldType instead
 */
export type DatabaseSchemaFieldType_Legacy = DatabaseSchemaFieldType;

/**
 * @deprecated Use DbFunctionUseType instead
 */
export type DbFunctionUseType_Legacy = DbFunctionUseType;
