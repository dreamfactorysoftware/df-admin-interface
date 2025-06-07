/**
 * Field Management Hook
 * 
 * React Query-powered hook for database field CRUD operations with intelligent
 * caching, optimistic updates, and comprehensive error handling. Provides a
 * unified interface for field creation, editing, deletion, and data fetching.
 * 
 * Features:
 * - React Query integration with intelligent caching
 * - Optimistic updates for better UX
 * - Comprehensive error handling and retry logic
 * - Type-safe field operations
 * - Background refetching and cache invalidation
 * 
 * @author DreamFactory Admin Interface Team
 * @version React 19/Next.js 15.1 Migration
 */

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useCallback } from 'react'

// Type imports
import type {
  DatabaseSchemaFieldType,
  FieldFormData,
  fieldQueryKeys,
  CreateFieldMutationVariables,
  UpdateFieldMutationVariables,
  DeleteFieldMutationVariables,
  FieldQueryResult,
  FieldListQueryResult,
  CreateFieldMutationResult,
  UpdateFieldMutationResult,
  DeleteFieldMutationResult
} from '@/app/adf-schema/df-field-details/df-field-details.types'

// API client
import { apiClient } from '@/lib/api-client'

// =============================================================================
// API FUNCTIONS
// =============================================================================

/**
 * Fetch field details by name
 */
async function fetchField(
  serviceName: string,
  tableName: string,
  fieldName: string
): Promise<DatabaseSchemaFieldType> {
  const response = await apiClient.get(
    `/_schema/${serviceName}/_table/${tableName}/_field/${fieldName}`
  )
  return response
}

/**
 * Fetch all fields for a table
 */
async function fetchFields(
  serviceName: string,
  tableName: string
): Promise<DatabaseSchemaFieldType[]> {
  const response = await apiClient.get(
    `/_schema/${serviceName}/_table/${tableName}/_field`
  )
  return response.resource || []
}

/**
 * Create a new field
 */
async function createField(
  variables: CreateFieldMutationVariables
): Promise<DatabaseSchemaFieldType> {
  const { serviceName, tableName, fieldData } = variables
  
  const response = await apiClient.post(
    `/_schema/${serviceName}/_table/${tableName}/_field`,
    { resource: [fieldData] }
  )
  
  return response.resource?.[0] || fieldData
}

/**
 * Update an existing field
 */
async function updateField(
  variables: UpdateFieldMutationVariables
): Promise<DatabaseSchemaFieldType> {
  const { serviceName, tableName, fieldName, fieldData } = variables
  
  const response = await apiClient.post(
    `/_schema/${serviceName}/_table/${tableName}/_field/${fieldName}`,
    fieldData
  )
  
  return response
}

/**
 * Delete a field
 */
async function deleteField(
  variables: DeleteFieldMutationVariables
): Promise<void> {
  const { serviceName, tableName, fieldName } = variables
  
  await apiClient.post(
    `/_schema/${serviceName}/_table/${tableName}/_field/${fieldName}`,
    undefined,
    { method: 'DELETE' }
  )
}

// =============================================================================
// HOOK IMPLEMENTATION
// =============================================================================

/**
 * Field management hook interface
 */
export interface UseFieldManagementOptions {
  serviceName: string
  tableName: string
  fieldName?: string
  enabled?: boolean
}

/**
 * Field management hook return type
 */
export interface UseFieldManagementReturn {
  // Query results
  field: FieldQueryResult
  fields: FieldListQueryResult
  
  // Mutations
  createField: CreateFieldMutationResult
  updateField: UpdateFieldMutationResult
  deleteField: DeleteFieldMutationResult
  
  // Utility functions
  invalidateFields: () => Promise<void>
  refetchField: () => Promise<void>
  refetchFields: () => Promise<void>
  
  // Computed states
  isLoading: boolean
  isError: boolean
  hasError: boolean
}

/**
 * Main field management hook
 */
export function useFieldManagement({
  serviceName,
  tableName,
  fieldName,
  enabled = true
}: UseFieldManagementOptions): UseFieldManagementReturn {
  const queryClient = useQueryClient()
  
  // =============================================================================
  // QUERIES
  // =============================================================================
  
  // Fetch single field details
  const field = useQuery({
    queryKey: fieldQueryKeys.detail(serviceName, tableName, fieldName || ''),
    queryFn: () => fetchField(serviceName, tableName, fieldName!),
    enabled: enabled && Boolean(fieldName),
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: (failureCount, error) => {
      // Don't retry on 404s
      if (error instanceof Error && error.message.includes('404')) {
        return false
      }
      return failureCount < 3
    }
  }) as FieldQueryResult
  
  // Fetch all fields for the table
  const fields = useQuery({
    queryKey: fieldQueryKeys.list(serviceName, tableName),
    queryFn: () => fetchFields(serviceName, tableName),
    enabled,
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: 2
  }) as FieldListQueryResult
  
  // =============================================================================
  // MUTATIONS
  // =============================================================================
  
  // Create field mutation
  const createFieldMutation = useMutation({
    mutationFn: createField,
    onMutate: async (variables) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ 
        queryKey: fieldQueryKeys.list(serviceName, tableName) 
      })

      // Snapshot the previous value
      const previousFields = queryClient.getQueryData(
        fieldQueryKeys.list(serviceName, tableName)
      )

      // Optimistically update the cache
      queryClient.setQueryData(
        fieldQueryKeys.list(serviceName, tableName),
        (old: DatabaseSchemaFieldType[] | undefined) => {
          const newField = { ...variables.fieldData } as DatabaseSchemaFieldType
          return old ? [...old, newField] : [newField]
        }
      )

      return { previousFields }
    },
    onError: (error, variables, context) => {
      // Rollback on error
      if (context?.previousFields) {
        queryClient.setQueryData(
          fieldQueryKeys.list(serviceName, tableName),
          context.previousFields
        )
      }
    },
    onSuccess: () => {
      // Invalidate related queries
      queryClient.invalidateQueries({ 
        queryKey: fieldQueryKeys.list(serviceName, tableName) 
      })
      queryClient.invalidateQueries({ 
        queryKey: fieldQueryKeys.schema(serviceName, tableName) 
      })
    }
  }) as CreateFieldMutationResult
  
  // Update field mutation
  const updateFieldMutation = useMutation({
    mutationFn: updateField,
    onMutate: async (variables) => {
      const { fieldName: targetFieldName } = variables
      
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ 
        queryKey: fieldQueryKeys.detail(serviceName, tableName, targetFieldName) 
      })

      // Snapshot the previous value
      const previousField = queryClient.getQueryData(
        fieldQueryKeys.detail(serviceName, tableName, targetFieldName)
      )

      // Optimistically update the cache
      queryClient.setQueryData(
        fieldQueryKeys.detail(serviceName, tableName, targetFieldName),
        (old: DatabaseSchemaFieldType | undefined) => ({
          ...old,
          ...variables.fieldData
        } as DatabaseSchemaFieldType)
      )

      return { previousField }
    },
    onError: (error, variables, context) => {
      const { fieldName: targetFieldName } = variables
      
      // Rollback on error
      if (context?.previousField) {
        queryClient.setQueryData(
          fieldQueryKeys.detail(serviceName, tableName, targetFieldName),
          context.previousField
        )
      }
    },
    onSuccess: (data, variables) => {
      const { fieldName: targetFieldName } = variables
      
      // Invalidate related queries
      queryClient.invalidateQueries({ 
        queryKey: fieldQueryKeys.list(serviceName, tableName) 
      })
      queryClient.invalidateQueries({ 
        queryKey: fieldQueryKeys.detail(serviceName, tableName, targetFieldName) 
      })
      queryClient.invalidateQueries({ 
        queryKey: fieldQueryKeys.schema(serviceName, tableName) 
      })
    }
  }) as UpdateFieldMutationResult
  
  // Delete field mutation
  const deleteFieldMutation = useMutation({
    mutationFn: deleteField,
    onMutate: async (variables) => {
      const { fieldName: targetFieldName } = variables
      
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ 
        queryKey: fieldQueryKeys.list(serviceName, tableName) 
      })

      // Snapshot the previous value
      const previousFields = queryClient.getQueryData(
        fieldQueryKeys.list(serviceName, tableName)
      )

      // Optimistically remove from cache
      queryClient.setQueryData(
        fieldQueryKeys.list(serviceName, tableName),
        (old: DatabaseSchemaFieldType[] | undefined) => {
          return old?.filter(field => field.name !== targetFieldName) || []
        }
      )

      return { previousFields }
    },
    onError: (error, variables, context) => {
      // Rollback on error
      if (context?.previousFields) {
        queryClient.setQueryData(
          fieldQueryKeys.list(serviceName, tableName),
          context.previousFields
        )
      }
    },
    onSuccess: (data, variables) => {
      const { fieldName: targetFieldName } = variables
      
      // Invalidate related queries
      queryClient.invalidateQueries({ 
        queryKey: fieldQueryKeys.list(serviceName, tableName) 
      })
      queryClient.removeQueries({ 
        queryKey: fieldQueryKeys.detail(serviceName, tableName, targetFieldName) 
      })
      queryClient.invalidateQueries({ 
        queryKey: fieldQueryKeys.schema(serviceName, tableName) 
      })
    }
  }) as DeleteFieldMutationResult
  
  // =============================================================================
  // UTILITY FUNCTIONS
  // =============================================================================
  
  const invalidateFields = useCallback(async () => {
    await queryClient.invalidateQueries({ 
      queryKey: fieldQueryKeys.list(serviceName, tableName) 
    })
  }, [queryClient, serviceName, tableName])
  
  const refetchField = useCallback(async () => {
    if (fieldName) {
      await field.refetch()
    }
  }, [field, fieldName])
  
  const refetchFields = useCallback(async () => {
    await fields.refetch()
  }, [fields])
  
  // =============================================================================
  // COMPUTED STATES
  // =============================================================================
  
  const isLoading = field.isLoading || 
                   fields.isLoading || 
                   createFieldMutation.isPending || 
                   updateFieldMutation.isPending || 
                   deleteFieldMutation.isPending
  
  const isError = field.isError || fields.isError
  
  const hasError = isError || 
                  createFieldMutation.isError || 
                  updateFieldMutation.isError || 
                  deleteFieldMutation.isError
  
  // =============================================================================
  // RETURN HOOK INTERFACE
  // =============================================================================
  
  return {
    // Query results
    field,
    fields,
    
    // Mutations
    createField: createFieldMutation,
    updateField: updateFieldMutation,
    deleteField: deleteFieldMutation,
    
    // Utility functions
    invalidateFields,
    refetchField,
    refetchFields,
    
    // Computed states
    isLoading,
    isError,
    hasError
  }
}

// =============================================================================
// EXPORTS
// =============================================================================

export default useFieldManagement
export type { 
  UseFieldManagementOptions, 
  UseFieldManagementReturn 
}