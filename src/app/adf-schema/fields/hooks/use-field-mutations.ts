/**
 * @fileoverview Custom React hook implementing React Query mutations for field CRUD operations
 * with optimistic updates and intelligent cache invalidation. Provides create, update, and delete
 * functionality for database fields with comprehensive error handling and automatic cache
 * synchronization following DreamFactory API patterns.
 * 
 * Features:
 * - React Query mutations with optimistic updates per Section 4.3.2 Server State Management
 * - Comprehensive cache invalidation and synchronization per Section 4.3.2 mutation workflows
 * - Type-safe mutation operations per React/Next.js Integration Requirements
 * - API responses under 2 seconds per React/Next.js Integration Requirements
 * - Automatic rollback on mutation failure with error state management
 * - Success/error notifications integration for user feedback
 * 
 * @version 1.0.0
 * @created 2024-12-28
 * @author DreamFactory Admin Interface Team
 */

import { useMutation, useQueryClient } from '@tanstack/react-query'
import { z } from 'zod'
import { useCallback } from 'react'
import { useNotifications } from '../../../../hooks/use-notifications'
import { apiClient } from '../../../../lib/api-client'
import type {
  DatabaseSchemaFieldType,
  FieldFormData,
  FieldApiResponse,
  BulkFieldApiResponse,
  FieldRouteParams
} from '../field.types'

// =============================================================================
// ZOD VALIDATION SCHEMAS
// =============================================================================

/**
 * Zod schema for field creation validation
 * Ensures real-time validation under 100ms performance target
 */
const CreateFieldSchema = z.object({
  name: z.string()
    .min(1, 'Field name is required')
    .max(64, 'Field name must be 64 characters or less')
    .regex(/^[a-zA-Z][a-zA-Z0-9_]*$/, 'Field name must start with letter and contain only letters, numbers, and underscores'),
  
  alias: z.string()
    .max(64, 'Alias must be 64 characters or less')
    .nullable(),
  
  label: z.string()
    .min(1, 'Label is required')
    .max(255, 'Label must be 255 characters or less'),
  
  description: z.string()
    .max(1000, 'Description must be 1000 characters or less'),
  
  type: z.enum([
    'string', 'text', 'password', 'email', 'url',
    'integer', 'bigint', 'smallint', 'decimal', 'float', 'double', 'money',
    'date', 'time', 'datetime', 'timestamp',
    'boolean',
    'binary', 'varbinary', 'blob', 'medium_blob', 'long_blob',
    'reference', 'user_id', 'user_id_on_create', 'user_id_on_update',
    'timestamp_on_create', 'timestamp_on_update'
  ]),
  
  dbType: z.string()
    .min(1, 'Database type is required')
    .max(64, 'Database type must be 64 characters or less'),
  
  length: z.number()
    .int()
    .min(0)
    .max(65535)
    .nullable(),
  
  precision: z.number()
    .int()
    .min(0)
    .max(65)
    .nullable(),
  
  scale: z.number()
    .int()
    .min(0)
    .max(30)
    .default(0),
  
  default: z.union([
    z.string().max(255),
    z.number(),
    z.boolean(),
    z.null()
  ]).nullable(),
  
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
  
  refTable: z.string()
    .max(64, 'Reference table must be 64 characters or less')
    .nullable(),
  
  refField: z.string()
    .max(64, 'Reference field must be 64 characters or less')
    .nullable(),
  
  refOnDelete: z.enum(['CASCADE', 'SET NULL', 'RESTRICT', 'NO ACTION'])
    .nullable(),
  
  refOnUpdate: z.enum(['CASCADE', 'SET NULL', 'RESTRICT', 'NO ACTION'])
    .nullable(),
  
  picklist: z.string()
    .max(1000, 'Picklist must be 1000 characters or less')
    .nullable(),
  
  validation: z.string()
    .max(2000, 'Validation rules must be 2000 characters or less')
    .nullable(),
  
  dbFunction: z.array(z.object({
    use: z.array(z.string()),
    function: z.string()
  })).default([])
}).strict()

/**
 * Zod schema for field updates (partial validation)
 */
const UpdateFieldSchema = CreateFieldSchema.partial().extend({
  name: z.string()
    .min(1, 'Field name is required')
    .max(64, 'Field name must be 64 characters or less')
    .regex(/^[a-zA-Z][a-zA-Z0-9_]*$/, 'Field name must start with letter and contain only letters, numbers, and underscores')
})

/**
 * Zod schema for field deletion validation
 */
const DeleteFieldSchema = z.object({
  fieldName: z.string().min(1, 'Field name is required'),
  confirmDeletion: z.boolean().refine(val => val === true, 'Deletion must be confirmed')
}).strict()

// =============================================================================
// MUTATION INPUT TYPES
// =============================================================================

/**
 * Input for creating a new field
 */
export interface CreateFieldInput {
  serviceName: string
  tableName: string
  fieldData: FieldFormData
}

/**
 * Input for updating an existing field
 */
export interface UpdateFieldInput {
  serviceName: string
  tableName: string
  fieldName: string
  fieldData: Partial<FieldFormData>
}

/**
 * Input for deleting a field
 */
export interface DeleteFieldInput {
  serviceName: string
  tableName: string
  fieldName: string
  confirmDeletion: boolean
}

/**
 * Input for bulk field operations
 */
export interface BulkFieldInput {
  serviceName: string
  tableName: string
  operations: Array<{
    type: 'create' | 'update' | 'delete'
    fieldName?: string
    fieldData?: FieldFormData | Partial<FieldFormData>
  }>
}

// =============================================================================
// CACHE KEY UTILITIES
// =============================================================================

/**
 * Generate cache keys for field-related queries
 */
const getCacheKeys = (serviceName: string, tableName?: string, fieldName?: string) => ({
  // Field list keys
  fieldList: ['fields', serviceName, tableName] as const,
  fieldListAll: ['fields', serviceName] as const,
  
  // Individual field keys
  field: fieldName ? ['field', serviceName, tableName, fieldName] as const : null,
  fieldDetail: (name: string) => ['field', serviceName, tableName, name] as const,
  
  // Related cache keys for invalidation
  tableSchema: ['table-schema', serviceName, tableName] as const,
  tableSchemaAll: ['table-schema', serviceName] as const,
  serviceSchema: ['service-schema', serviceName] as const,
  
  // Field metadata keys
  fieldTypes: ['field-types', serviceName] as const,
  fieldConstraints: ['field-constraints', serviceName, tableName] as const,
  
  // Relationship keys
  relationships: ['relationships', serviceName, tableName] as const,
  relationshipsAll: ['relationships', serviceName] as const
})

// =============================================================================
// API FUNCTIONS
// =============================================================================

/**
 * Create a new database field
 */
const createField = async (input: CreateFieldInput): Promise<DatabaseSchemaFieldType> => {
  // Validate input data
  const validatedData = CreateFieldSchema.parse(input.fieldData)
  
  // Transform form data to API format
  const apiData = {
    ...validatedData,
    // Ensure proper boolean conversion
    allow_null: validatedData.allowNull,
    auto_increment: validatedData.autoIncrement,
    fixed_length: validatedData.fixedLength,
    is_aggregate: validatedData.isAggregate,
    is_foreign_key: validatedData.isForeignKey,
    is_primary_key: validatedData.isPrimaryKey,
    is_unique: validatedData.isUnique,
    is_virtual: validatedData.isVirtual,
    supports_multibyte: validatedData.supportsMultibyte,
    db_type: validatedData.dbType,
    db_function: validatedData.dbFunction,
    ref_table: validatedData.refTable,
    ref_field: validatedData.refField,
    ref_on_delete: validatedData.refOnDelete,
    ref_on_update: validatedData.refOnUpdate
  }
  
  const response = await apiClient.post(
    `/${input.serviceName}/_schema/${input.tableName}/_field`,
    apiData
  ) as FieldApiResponse
  
  if (!response.success || !response.data) {
    throw new Error(response.error?.message || 'Failed to create field')
  }
  
  return response.data
}

/**
 * Update an existing database field
 */
const updateField = async (input: UpdateFieldInput): Promise<DatabaseSchemaFieldType> => {
  // Validate input data
  const validatedData = UpdateFieldSchema.parse(input.fieldData)
  
  // Transform form data to API format (only changed fields)
  const apiData: any = {}
  
  // Map React form field names to API field names
  const fieldMapping: Record<string, string> = {
    allowNull: 'allow_null',
    autoIncrement: 'auto_increment',
    fixedLength: 'fixed_length',
    isAggregate: 'is_aggregate',
    isForeignKey: 'is_foreign_key',
    isPrimaryKey: 'is_primary_key',
    isUnique: 'is_unique',
    isVirtual: 'is_virtual',
    supportsMultibyte: 'supports_multibyte',
    dbType: 'db_type',
    dbFunction: 'db_function',
    refTable: 'ref_table',
    refField: 'ref_field',
    refOnDelete: 'ref_on_delete',
    refOnUpdate: 'ref_on_update'
  }
  
  // Transform only the provided fields
  Object.entries(validatedData).forEach(([key, value]) => {
    const apiKey = fieldMapping[key] || key
    apiData[apiKey] = value
  })
  
  const response = await apiClient.post(
    `/${input.serviceName}/_schema/${input.tableName}/_field/${input.fieldName}`,
    apiData
  ) as FieldApiResponse
  
  if (!response.success || !response.data) {
    throw new Error(response.error?.message || 'Failed to update field')
  }
  
  return response.data
}

/**
 * Delete a database field
 */
const deleteField = async (input: DeleteFieldInput): Promise<void> => {
  // Validate input
  const validatedInput = DeleteFieldSchema.parse({
    fieldName: input.fieldName,
    confirmDeletion: input.confirmDeletion
  })
  
  const response = await apiClient.delete?.(
    `/${input.serviceName}/_schema/${input.tableName}/_field/${validatedInput.fieldName}`
  ) as FieldApiResponse
  
  if (!response?.success) {
    throw new Error(response?.error?.message || 'Failed to delete field')
  }
}

/**
 * Perform bulk field operations
 */
const bulkFieldOperations = async (input: BulkFieldInput): Promise<BulkFieldApiResponse> => {
  const response = await apiClient.post(
    `/${input.serviceName}/_schema/${input.tableName}/_field/_bulk`,
    { operations: input.operations }
  ) as BulkFieldApiResponse
  
  if (!response.success) {
    throw new Error('Bulk field operations failed')
  }
  
  return response
}

// =============================================================================
// MUTATION HOOK
// =============================================================================

/**
 * Hook return interface
 */
export interface UseFieldMutationsReturn {
  // Create field mutation
  createField: {
    mutate: (input: CreateFieldInput) => void
    mutateAsync: (input: CreateFieldInput) => Promise<DatabaseSchemaFieldType>
    isLoading: boolean
    isError: boolean
    error: Error | null
    isSuccess: boolean
    data: DatabaseSchemaFieldType | undefined
    reset: () => void
  }
  
  // Update field mutation
  updateField: {
    mutate: (input: UpdateFieldInput) => void
    mutateAsync: (input: UpdateFieldInput) => Promise<DatabaseSchemaFieldType>
    isLoading: boolean
    isError: boolean
    error: Error | null
    isSuccess: boolean
    data: DatabaseSchemaFieldType | undefined
    reset: () => void
  }
  
  // Delete field mutation
  deleteField: {
    mutate: (input: DeleteFieldInput) => void
    mutateAsync: (input: DeleteFieldInput) => Promise<void>
    isLoading: boolean
    isError: boolean
    error: Error | null
    isSuccess: boolean
    data: void | undefined
    reset: () => void
  }
  
  // Bulk operations mutation
  bulkOperations: {
    mutate: (input: BulkFieldInput) => void
    mutateAsync: (input: BulkFieldInput) => Promise<BulkFieldApiResponse>
    isLoading: boolean
    isError: boolean
    error: Error | null
    isSuccess: boolean
    data: BulkFieldApiResponse | undefined
    reset: () => void
  }
  
  // Utility methods
  isAnyLoading: boolean
  resetAllMutations: () => void
}

/**
 * Custom React hook implementing React Query mutations for field CRUD operations
 * with optimistic updates and intelligent cache invalidation. Provides create, update,
 * and delete functionality for database fields with comprehensive error handling and
 * automatic cache synchronization following DreamFactory API patterns.
 * 
 * @example
 * ```tsx
 * const {
 *   createField,
 *   updateField,
 *   deleteField,
 *   bulkOperations,
 *   isAnyLoading
 * } = useFieldMutations()
 * 
 * // Create a new field
 * createField.mutate({
 *   serviceName: 'mysql_db',
 *   tableName: 'users',
 *   fieldData: {
 *     name: 'email',
 *     type: 'email',
 *     required: true,
 *     label: 'Email Address'
 *   }
 * })
 * 
 * // Update an existing field
 * updateField.mutate({
 *   serviceName: 'mysql_db',
 *   tableName: 'users',
 *   fieldName: 'email',
 *   fieldData: {
 *     required: false,
 *     description: 'User email address (optional)'
 *   }
 * })
 * 
 * // Delete a field
 * deleteField.mutate({
 *   serviceName: 'mysql_db',
 *   tableName: 'users',
 *   fieldName: 'old_field',
 *   confirmDeletion: true
 * })
 * ```
 */
export function useFieldMutations(): UseFieldMutationsReturn {
  const queryClient = useQueryClient()
  const { success, error: showError } = useNotifications()
  
  /**
   * Comprehensive cache invalidation helper
   */
  const invalidateRelatedCaches = useCallback(async (
    serviceName: string,
    tableName?: string,
    fieldName?: string
  ) => {
    const cacheKeys = getCacheKeys(serviceName, tableName, fieldName)
    
    // Invalidate all related queries
    await Promise.all([
      // Field-specific caches
      queryClient.invalidateQueries({ queryKey: cacheKeys.fieldList }),
      queryClient.invalidateQueries({ queryKey: cacheKeys.fieldListAll }),
      
      // Table schema caches (fields affect table structure)
      queryClient.invalidateQueries({ queryKey: cacheKeys.tableSchema }),
      queryClient.invalidateQueries({ queryKey: cacheKeys.tableSchemaAll }),
      
      // Service schema caches
      queryClient.invalidateQueries({ queryKey: cacheKeys.serviceSchema }),
      
      // Field metadata caches
      queryClient.invalidateQueries({ queryKey: cacheKeys.fieldTypes }),
      queryClient.invalidateQueries({ queryKey: cacheKeys.fieldConstraints }),
      
      // Relationship caches (field changes can affect relationships)
      queryClient.invalidateQueries({ queryKey: cacheKeys.relationships }),
      queryClient.invalidateQueries({ queryKey: cacheKeys.relationshipsAll })
    ])
    
    // Refetch field list to get fresh data
    if (tableName) {
      await queryClient.refetchQueries({ queryKey: cacheKeys.fieldList })
    }
  }, [queryClient])
  
  /**
   * Create field mutation with optimistic updates
   */
  const createFieldMutation = useMutation({
    mutationFn: createField,
    
    onMutate: async (input: CreateFieldInput) => {
      const cacheKeys = getCacheKeys(input.serviceName, input.tableName)
      
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: cacheKeys.fieldList })
      
      // Snapshot previous value for rollback
      const previousFields = queryClient.getQueryData<DatabaseSchemaFieldType[]>(cacheKeys.fieldList)
      
      // Optimistically update field list
      if (previousFields) {
        const optimisticField: DatabaseSchemaFieldType = {
          ...input.fieldData,
          // Map form data to API structure
          allowNull: input.fieldData.allowNull,
          autoIncrement: input.fieldData.autoIncrement,
          dbFunction: input.fieldData.dbFunction,
          dbType: input.fieldData.dbType,
          default: input.fieldData.default,
          description: input.fieldData.description,
          fixedLength: input.fieldData.fixedLength,
          isAggregate: input.fieldData.isAggregate,
          isForeignKey: input.fieldData.isForeignKey,
          isPrimaryKey: input.fieldData.isPrimaryKey,
          isUnique: input.fieldData.isUnique,
          isVirtual: input.fieldData.isVirtual,
          label: input.fieldData.label,
          length: input.fieldData.length,
          name: input.fieldData.name,
          native: null,
          picklist: input.fieldData.picklist,
          precision: input.fieldData.precision,
          refField: input.fieldData.refField,
          refOnDelete: input.fieldData.refOnDelete,
          refOnUpdate: input.fieldData.refOnUpdate,
          refTable: input.fieldData.refTable,
          required: input.fieldData.required,
          scale: input.fieldData.scale,
          supportsMultibyte: input.fieldData.supportsMultibyte,
          type: input.fieldData.type,
          validation: input.fieldData.validation,
          value: [],
          alias: input.fieldData.alias
        }
        
        queryClient.setQueryData<DatabaseSchemaFieldType[]>(
          cacheKeys.fieldList,
          [...previousFields, optimisticField]
        )
      }
      
      // Return context for rollback
      return { previousFields, cacheKeys }
    },
    
    onError: (err, input, context) => {
      // Rollback optimistic updates
      if (context?.previousFields && context?.cacheKeys) {
        queryClient.setQueryData(context.cacheKeys.fieldList, context.previousFields)
      }
      
      // Show error notification
      showError(
        err instanceof Error ? err.message : 'Failed to create field',
        'Field Creation Error'
      )
    },
    
    onSuccess: (data, input) => {
      // Show success notification
      success(
        `Field "${data.name}" created successfully`,
        'Field Created'
      )
      
      // Invalidate and refetch related caches
      invalidateRelatedCaches(input.serviceName, input.tableName, data.name)
    }
  })
  
  /**
   * Update field mutation with optimistic updates
   */
  const updateFieldMutation = useMutation({
    mutationFn: updateField,
    
    onMutate: async (input: UpdateFieldInput) => {
      const cacheKeys = getCacheKeys(input.serviceName, input.tableName, input.fieldName)
      
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: cacheKeys.fieldList })
      if (cacheKeys.field) {
        await queryClient.cancelQueries({ queryKey: cacheKeys.field })
      }
      
      // Snapshot previous values
      const previousFields = queryClient.getQueryData<DatabaseSchemaFieldType[]>(cacheKeys.fieldList)
      const previousField = cacheKeys.field 
        ? queryClient.getQueryData<DatabaseSchemaFieldType>(cacheKeys.field)
        : null
      
      // Optimistically update field list
      if (previousFields) {
        const updatedFields = previousFields.map(field => {
          if (field.name === input.fieldName) {
            return {
              ...field,
              ...input.fieldData,
              // Ensure proper field mapping
              allowNull: input.fieldData.allowNull ?? field.allowNull,
              autoIncrement: input.fieldData.autoIncrement ?? field.autoIncrement,
              dbType: input.fieldData.dbType ?? field.dbType,
              description: input.fieldData.description ?? field.description,
              label: input.fieldData.label ?? field.label,
              required: input.fieldData.required ?? field.required
            }
          }
          return field
        })
        
        queryClient.setQueryData<DatabaseSchemaFieldType[]>(cacheKeys.fieldList, updatedFields)
      }
      
      // Optimistically update individual field cache
      if (previousField && cacheKeys.field) {
        const updatedField = {
          ...previousField,
          ...input.fieldData
        }
        queryClient.setQueryData<DatabaseSchemaFieldType>(cacheKeys.field, updatedField)
      }
      
      return { previousFields, previousField, cacheKeys }
    },
    
    onError: (err, input, context) => {
      // Rollback optimistic updates
      if (context?.previousFields && context?.cacheKeys) {
        queryClient.setQueryData(context.cacheKeys.fieldList, context.previousFields)
      }
      if (context?.previousField && context?.cacheKeys.field) {
        queryClient.setQueryData(context.cacheKeys.field, context.previousField)
      }
      
      // Show error notification
      showError(
        err instanceof Error ? err.message : 'Failed to update field',
        'Field Update Error'
      )
    },
    
    onSuccess: (data, input) => {
      // Show success notification
      success(
        `Field "${data.name}" updated successfully`,
        'Field Updated'
      )
      
      // Invalidate and refetch related caches
      invalidateRelatedCaches(input.serviceName, input.tableName, data.name)
    }
  })
  
  /**
   * Delete field mutation with optimistic updates
   */
  const deleteFieldMutation = useMutation({
    mutationFn: deleteField,
    
    onMutate: async (input: DeleteFieldInput) => {
      const cacheKeys = getCacheKeys(input.serviceName, input.tableName, input.fieldName)
      
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: cacheKeys.fieldList })
      
      // Snapshot previous value
      const previousFields = queryClient.getQueryData<DatabaseSchemaFieldType[]>(cacheKeys.fieldList)
      
      // Optimistically remove field from list
      if (previousFields) {
        const updatedFields = previousFields.filter(field => field.name !== input.fieldName)
        queryClient.setQueryData<DatabaseSchemaFieldType[]>(cacheKeys.fieldList, updatedFields)
      }
      
      // Remove individual field cache
      if (cacheKeys.field) {
        queryClient.removeQueries({ queryKey: cacheKeys.field })
      }
      
      return { previousFields, cacheKeys }
    },
    
    onError: (err, input, context) => {
      // Rollback optimistic updates
      if (context?.previousFields && context?.cacheKeys) {
        queryClient.setQueryData(context.cacheKeys.fieldList, context.previousFields)
      }
      
      // Show error notification
      showError(
        err instanceof Error ? err.message : 'Failed to delete field',
        'Field Deletion Error'
      )
    },
    
    onSuccess: (data, input) => {
      // Show success notification
      success(
        `Field "${input.fieldName}" deleted successfully`,
        'Field Deleted'
      )
      
      // Invalidate and refetch related caches
      invalidateRelatedCaches(input.serviceName, input.tableName)
    }
  })
  
  /**
   * Bulk operations mutation
   */
  const bulkOperationsMutation = useMutation({
    mutationFn: bulkFieldOperations,
    
    onSuccess: (data, input) => {
      // Show detailed success/error notifications
      if (data.successful.length > 0) {
        success(
          `Successfully processed ${data.successful.length} field operation(s)`,
          'Bulk Operations Complete'
        )
      }
      
      if (data.failed.length > 0) {
        data.failed.forEach(failure => {
          showError(
            `Failed to process field "${failure.fieldName}": ${failure.error}`,
            'Bulk Operation Error'
          )
        })
      }
      
      // Invalidate all related caches
      invalidateRelatedCaches(input.serviceName, input.tableName)
    },
    
    onError: (err) => {
      showError(
        err instanceof Error ? err.message : 'Bulk operations failed',
        'Bulk Operations Error'
      )
    }
  })
  
  /**
   * Reset all mutations
   */
  const resetAllMutations = useCallback(() => {
    createFieldMutation.reset()
    updateFieldMutation.reset()
    deleteFieldMutation.reset()
    bulkOperationsMutation.reset()
  }, [createFieldMutation, updateFieldMutation, deleteFieldMutation, bulkOperationsMutation])
  
  return {
    createField: {
      mutate: createFieldMutation.mutate,
      mutateAsync: createFieldMutation.mutateAsync,
      isLoading: createFieldMutation.isPending,
      isError: createFieldMutation.isError,
      error: createFieldMutation.error,
      isSuccess: createFieldMutation.isSuccess,
      data: createFieldMutation.data,
      reset: createFieldMutation.reset
    },
    
    updateField: {
      mutate: updateFieldMutation.mutate,
      mutateAsync: updateFieldMutation.mutateAsync,
      isLoading: updateFieldMutation.isPending,
      isError: updateFieldMutation.isError,
      error: updateFieldMutation.error,
      isSuccess: updateFieldMutation.isSuccess,
      data: updateFieldMutation.data,
      reset: updateFieldMutation.reset
    },
    
    deleteField: {
      mutate: deleteFieldMutation.mutate,
      mutateAsync: deleteFieldMutation.mutateAsync,
      isLoading: deleteFieldMutation.isPending,
      isError: deleteFieldMutation.isError,
      error: deleteFieldMutation.error,
      isSuccess: deleteFieldMutation.isSuccess,
      data: deleteFieldMutation.data,
      reset: deleteFieldMutation.reset
    },
    
    bulkOperations: {
      mutate: bulkOperationsMutation.mutate,
      mutateAsync: bulkOperationsMutation.mutateAsync,
      isLoading: bulkOperationsMutation.isPending,
      isError: bulkOperationsMutation.isError,
      error: bulkOperationsMutation.error,
      isSuccess: bulkOperationsMutation.isSuccess,
      data: bulkOperationsMutation.data,
      reset: bulkOperationsMutation.reset
    },
    
    isAnyLoading: createFieldMutation.isPending || 
                  updateFieldMutation.isPending || 
                  deleteFieldMutation.isPending || 
                  bulkOperationsMutation.isPending,
    
    resetAllMutations
  }
}

/**
 * Export types for external use
 */
export type {
  CreateFieldInput,
  UpdateFieldInput,
  DeleteFieldInput,
  BulkFieldInput,
  UseFieldMutationsReturn
}