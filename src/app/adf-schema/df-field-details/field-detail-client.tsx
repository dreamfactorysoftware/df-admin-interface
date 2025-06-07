/**
 * Field Detail Client Component
 * 
 * Client-side component that handles field data fetching, form state management,
 * and user interactions for the field details page. Separates client-side concerns
 * from the server component while maintaining type safety and performance.
 * 
 * Features:
 * - React Query-powered data fetching with intelligent caching
 * - Form submission with optimistic updates
 * - Error handling and loading states
 * - Navigation coordination with success/cancel flows
 * - Client-side state management for form interactions
 * 
 * @author DreamFactory Admin Interface Team
 * @version React 19/Next.js 15.1 Migration
 */

'use client'

import React, { useState, useCallback, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { 
  ExclamationTriangleIcon,
  CheckCircleIcon,
  ArrowPathIcon
} from '@heroicons/react/24/outline'

// Internal components
import { FieldForm } from './field-form'
import { LoadingSpinner } from '@/components/ui/loading'
import { Alert } from '@/components/ui/alert'

// Types and utilities
import type {
  DatabaseSchemaFieldType,
  FieldFormData,
  FieldFormSubmissionContext,
  FieldNavigationContext,
  FieldFormError,
  fieldQueryKeys,
  CreateFieldMutationVariables,
  UpdateFieldMutationVariables
} from './df-field-details.types'

// Hooks
import { useNotifications } from '@/hooks/use-notifications'
import { useLoading } from '@/hooks/use-loading'

// API client (placeholder - will need to be implemented)
import { apiClient } from '@/lib/api-client'

// =============================================================================
// API FUNCTIONS (Temporary implementation - will be moved to proper API client)
// =============================================================================

/**
 * Fetch field details for edit mode
 */
async function fetchFieldDetails(
  serviceName: string,
  tableName: string,
  fieldName: string
): Promise<DatabaseSchemaFieldType> {
  // TODO: Replace with actual API client implementation
  const response = await fetch(`/api/v2/_schema/${serviceName}/_table/${tableName}/_field/${fieldName}`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
  })

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Failed to fetch field details' }))
    throw new Error(error.message || 'Failed to fetch field details')
  }

  return response.json()
}

/**
 * Fetch available tables for foreign key references
 */
async function fetchAvailableTables(serviceName: string): Promise<Array<{ name: string; label: string }>> {
  // TODO: Replace with actual API client implementation
  const response = await fetch(`/api/v2/_schema/${serviceName}/_table`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
  })

  if (!response.ok) {
    throw new Error('Failed to fetch available tables')
  }

  const data = await response.json()
  return data.resource?.map((table: any) => ({
    name: table.name,
    label: table.label || table.name
  })) || []
}

/**
 * Fetch available fields for a specific table
 */
async function fetchAvailableFields(
  serviceName: string,
  tableName: string
): Promise<Array<{ name: string; label: string; type: string }>> {
  // TODO: Replace with actual API client implementation
  const response = await fetch(`/api/v2/_schema/${serviceName}/_table/${tableName}/_field`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
  })

  if (!response.ok) {
    throw new Error('Failed to fetch available fields')
  }

  const data = await response.json()
  return data.resource?.map((field: any) => ({
    name: field.name,
    label: field.label || field.name,
    type: field.type
  })) || []
}

/**
 * Create new field
 */
async function createField(variables: CreateFieldMutationVariables): Promise<DatabaseSchemaFieldType> {
  const { serviceName, tableName, fieldData } = variables
  
  // TODO: Replace with actual API client implementation
  const response = await fetch(`/api/v2/_schema/${serviceName}/_table/${tableName}/_field`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ resource: [fieldData] })
  })

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Failed to create field' }))
    throw new Error(error.message || 'Failed to create field')
  }

  const data = await response.json()
  return data.resource?.[0] || fieldData
}

/**
 * Update existing field
 */
async function updateField(variables: UpdateFieldMutationVariables): Promise<DatabaseSchemaFieldType> {
  const { serviceName, tableName, fieldName, fieldData } = variables
  
  // TODO: Replace with actual API client implementation
  const response = await fetch(`/api/v2/_schema/${serviceName}/_table/${tableName}/_field/${fieldName}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(fieldData)
  })

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Failed to update field' }))
    throw new Error(error.message || 'Failed to update field')
  }

  return response.json()
}

// =============================================================================
// COMPONENT INTERFACES
// =============================================================================

interface FieldDetailClientComponentProps {
  context: FieldFormSubmissionContext
  navigationContext: FieldNavigationContext
  returnUrl?: string
}

// =============================================================================
// MAIN CLIENT COMPONENT
// =============================================================================

export function FieldDetailClientComponent({
  context,
  navigationContext,
  returnUrl
}: FieldDetailClientComponentProps) {
  // =============================================================================
  // HOOKS AND STATE
  // =============================================================================
  
  const router = useRouter()
  const queryClient = useQueryClient()
  const { addNotification } = useNotifications()
  const { setLoading } = useLoading()
  
  const [selectedRefTable, setSelectedRefTable] = useState<string | null>(null)
  const [formError, setFormError] = useState<FieldFormError | null>(null)
  
  const { serviceName, tableName, fieldName, isEditMode } = context

  // =============================================================================
  // REACT QUERY HOOKS
  // =============================================================================

  // Fetch field details for edit mode
  const fieldQuery = useQuery({
    queryKey: fieldQueryKeys.detail(serviceName, tableName, fieldName || ''),
    queryFn: () => fetchFieldDetails(serviceName, tableName, fieldName!),
    enabled: isEditMode && Boolean(fieldName),
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: (failureCount, error) => {
      // Don't retry on 404s
      if (error instanceof Error && error.message.includes('404')) {
        return false
      }
      return failureCount < 3
    }
  })

  // Fetch available tables for foreign key references
  const tablesQuery = useQuery({
    queryKey: ['tables', serviceName],
    queryFn: () => fetchAvailableTables(serviceName),
    staleTime: 10 * 60 * 1000, // 10 minutes
    retry: 2
  })

  // Fetch available fields for selected reference table
  const fieldsQuery = useQuery({
    queryKey: ['table-fields', serviceName, selectedRefTable],
    queryFn: () => fetchAvailableFields(serviceName, selectedRefTable!),
    enabled: Boolean(selectedRefTable),
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: 2
  })

  // Create field mutation
  const createMutation = useMutation({
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
      
      setFormError({
        type: 'server',
        message: error instanceof Error ? error.message : 'Failed to create field',
        timestamp: new Date()
      })
    },
    onSuccess: (data, variables) => {
      // Invalidate related queries
      queryClient.invalidateQueries({ 
        queryKey: fieldQueryKeys.list(serviceName, tableName) 
      })
      queryClient.invalidateQueries({ 
        queryKey: fieldQueryKeys.schema(serviceName, tableName) 
      })
      
      addNotification({
        type: 'success',
        title: 'Field Created',
        message: `Field "${variables.fieldData.name}" has been created successfully.`
      })
    }
  })

  // Update field mutation
  const updateMutation = useMutation({
    mutationFn: updateField,
    onMutate: async (variables) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ 
        queryKey: fieldQueryKeys.detail(serviceName, tableName, fieldName!) 
      })

      // Snapshot the previous value
      const previousField = queryClient.getQueryData(
        fieldQueryKeys.detail(serviceName, tableName, fieldName!)
      )

      // Optimistically update the cache
      queryClient.setQueryData(
        fieldQueryKeys.detail(serviceName, tableName, fieldName!),
        (old: DatabaseSchemaFieldType | undefined) => ({
          ...old,
          ...variables.fieldData
        } as DatabaseSchemaFieldType)
      )

      return { previousField }
    },
    onError: (error, variables, context) => {
      // Rollback on error
      if (context?.previousField) {
        queryClient.setQueryData(
          fieldQueryKeys.detail(serviceName, tableName, fieldName!),
          context.previousField
        )
      }
      
      setFormError({
        type: 'server',
        message: error instanceof Error ? error.message : 'Failed to update field',
        timestamp: new Date()
      })
    },
    onSuccess: (data, variables) => {
      // Invalidate related queries
      queryClient.invalidateQueries({ 
        queryKey: fieldQueryKeys.list(serviceName, tableName) 
      })
      queryClient.invalidateQueries({ 
        queryKey: fieldQueryKeys.schema(serviceName, tableName) 
      })
      
      addNotification({
        type: 'success',
        title: 'Field Updated',
        message: `Field "${fieldName}" has been updated successfully.`
      })
    }
  })

  // =============================================================================
  // COMPUTED VALUES
  // =============================================================================

  const isLoading = fieldQuery.isLoading || createMutation.isPending || updateMutation.isPending
  const hasError = fieldQuery.isError || Boolean(formError)
  const availableTables = tablesQuery.data || []
  const availableFields = fieldsQuery.data || []

  // =============================================================================
  // FORM HANDLERS
  // =============================================================================

  const handleFormSubmit = useCallback(async (formData: FieldFormData) => {
    try {
      setFormError(null)
      setLoading(true)

      if (isEditMode && fieldName) {
        await updateMutation.mutateAsync({
          serviceName,
          tableName,
          fieldName,
          fieldData: formData
        })
      } else {
        await createMutation.mutateAsync({
          serviceName,
          tableName,
          fieldData: formData
        })
      }

      // Navigate back on success
      const backUrl = returnUrl || `/adf-schema/${serviceName}/${tableName}`
      router.push(backUrl)
      
    } catch (error) {
      console.error('Form submission error:', error)
      // Error handling is done in mutation onError callbacks
    } finally {
      setLoading(false)
    }
  }, [
    isEditMode,
    fieldName,
    serviceName,
    tableName,
    returnUrl,
    updateMutation,
    createMutation,
    router,
    setLoading
  ])

  const handleFormCancel = useCallback(() => {
    const backUrl = returnUrl || `/adf-schema/${serviceName}/${tableName}`
    router.push(backUrl)
  }, [router, returnUrl, serviceName, tableName])

  const handleTableChange = useCallback((tableName: string) => {
    setSelectedRefTable(tableName)
  }, [])

  // =============================================================================
  // ERROR HANDLING
  // =============================================================================

  // Handle field not found in edit mode
  if (isEditMode && fieldQuery.isError) {
    const error = fieldQuery.error
    if (error instanceof Error && error.message.includes('404')) {
      return (
        <div className="min-h-[400px] flex items-center justify-center">
          <Alert
            variant="error"
            title="Field Not Found"
            message={`Field "${fieldName}" was not found in table "${tableName}".`}
            actions={[
              {
                label: 'Back to Table',
                onClick: handleFormCancel,
                variant: 'outline'
              }
            ]}
            icon={ExclamationTriangleIcon}
          />
        </div>
      )
    }
  }

  // Handle loading state
  if (isEditMode && fieldQuery.isLoading) {
    return (
      <div className="min-h-[400px] flex items-center justify-center">
        <LoadingSpinner size="lg" message="Loading field details..." />
      </div>
    )
  }

  // Handle tables loading error
  if (tablesQuery.isError) {
    return (
      <div className="min-h-[400px] flex items-center justify-center">
        <Alert
          variant="error"
          title="Failed to Load Data"
          message="Unable to load table information required for field configuration."
          actions={[
            {
              label: 'Retry',
              onClick: () => tablesQuery.refetch(),
              variant: 'outline',
              icon: ArrowPathIcon
            },
            {
              label: 'Back to Table',
              onClick: handleFormCancel,
              variant: 'outline'
            }
          ]}
          icon={ExclamationTriangleIcon}
        />
      </div>
    )
  }

  // =============================================================================
  // RENDER
  // =============================================================================

  return (
    <div className="space-y-6">
      {/* Form Error Display */}
      {formError && (
        <Alert
          variant="error"
          title="Form Error"
          message={formError.message}
          onDismiss={() => setFormError(null)}
          icon={ExclamationTriangleIcon}
        />
      )}

      {/* Success State for Mutations */}
      {(createMutation.isSuccess || updateMutation.isSuccess) && (
        <Alert
          variant="success"
          title={isEditMode ? "Field Updated" : "Field Created"}
          message={`Field has been ${isEditMode ? 'updated' : 'created'} successfully.`}
          icon={CheckCircleIcon}
        />
      )}

      {/* Field Form */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm">
        <FieldForm
          initialData={fieldQuery.data}
          context={context}
          onSubmit={handleFormSubmit}
          onCancel={handleFormCancel}
          isLoading={isLoading}
          availableTables={availableTables}
          availableFields={availableFields}
          onTableChange={handleTableChange}
          error={formError}
          isSuccess={createMutation.isSuccess || updateMutation.isSuccess}
          validationMode="onChange"
        />
      </div>
    </div>
  )
}

// =============================================================================
// EXPORTS
// =============================================================================

export default FieldDetailClientComponent
export type { FieldDetailClientComponentProps }