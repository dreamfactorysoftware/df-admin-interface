/**
 * Edit Rate Limit Client Component
 * 
 * Client-side component handling React Query data fetching, form state management,
 * and user interactions for editing rate limits. Implements optimistic updates,
 * comprehensive error handling, and real-time validation under 100ms.
 * 
 * @author DreamFactory Admin Interface Team
 * @version React 19/Next.js 15.1 Migration
 * @since 2024-12-19
 */

'use client'

import { useState, useCallback } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useRouter } from 'next/navigation'
import { useParams } from 'next/navigation'

import { LimitForm } from '../components/limit-form'
import { LoadingSpinner } from '@/components/ui/loading-spinner'
import { Alert } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { 
  LimitTableRowData,
  EditLimitFormData,
  LIMITS_QUERY_KEYS,
  type ApiErrorResponse
} from '../types'
import { apiClient } from '@/lib/api-client'
import type { ApiUpdateResponse } from '@/types/api'

// =============================================================================
// CLIENT COMPONENT PROPS
// =============================================================================

interface EditLimitPageClientProps {
  limitId: number
}

// =============================================================================
// CUSTOM HOOKS FOR DATA MANAGEMENT
// =============================================================================

/**
 * Custom hook for fetching limit data with React Query
 */
function useLimitData(limitId: number) {
  return useQuery<LimitTableRowData, ApiErrorResponse>({
    queryKey: LIMITS_QUERY_KEYS.detail(limitId),
    queryFn: async () => {
      const response = await apiClient.get(`/limits/${limitId}`)
      return response as LimitTableRowData
    },
    staleTime: 120000, // 2 minutes for detailed view
    cacheTime: 600000, // 10 minutes cache time
    retry: 2,
    refetchOnWindowFocus: true,
    enabled: !!limitId && limitId > 0
  })
}

/**
 * Custom hook for updating limit data with optimistic updates
 */
function useUpdateLimit(limitId: number) {
  const queryClient = useQueryClient()
  const router = useRouter()

  return useMutation<
    ApiUpdateResponse,
    ApiErrorResponse,
    EditLimitFormData,
    { previousData?: LimitTableRowData }
  >({
    mutationFn: async (formData: EditLimitFormData) => {
      const response = await apiClient.post(`/limits/${limitId}`, formData, {
        headers: {
          'X-HTTP-Method-Override': 'PUT',
          'Content-Type': 'application/json'
        }
      })
      return response as ApiUpdateResponse
    },

    // Optimistic update
    onMutate: async (newData) => {
      // Cancel outgoing queries to avoid conflicts
      await queryClient.cancelQueries({
        queryKey: LIMITS_QUERY_KEYS.detail(limitId)
      })

      // Snapshot previous value for rollback
      const previousData = queryClient.getQueryData<LimitTableRowData>(
        LIMITS_QUERY_KEYS.detail(limitId)
      )

      // Optimistically update the cache
      if (previousData) {
        queryClient.setQueryData<LimitTableRowData>(
          LIMITS_QUERY_KEYS.detail(limitId),
          {
            ...previousData,
            ...newData,
            updatedAt: new Date().toISOString()
          }
        )
      }

      return { previousData }
    },

    // Handle success
    onSuccess: (data, variables) => {
      // Invalidate and refetch limit lists to ensure consistency
      queryClient.invalidateQueries({
        queryKey: LIMITS_QUERY_KEYS.lists()
      })

      // Update the detail cache with server response
      queryClient.setQueryData<LimitTableRowData>(
        LIMITS_QUERY_KEYS.detail(limitId),
        (oldData) => oldData ? { ...oldData, ...variables, id: limitId } : undefined
      )

      // Navigate to limits list with success message
      router.push('/adf-limits?updated=' + encodeURIComponent(variables.name))
    },

    // Handle error with rollback
    onError: (error, variables, context) => {
      // Rollback optimistic update
      if (context?.previousData) {
        queryClient.setQueryData(
          LIMITS_QUERY_KEYS.detail(limitId),
          context.previousData
        )
      }

      console.error('Failed to update limit:', error)
    },

    // Final cleanup
    onSettled: () => {
      // Ensure we refetch the data to get the latest state
      queryClient.invalidateQueries({
        queryKey: LIMITS_QUERY_KEYS.detail(limitId)
      })
    },

    retry: 1,
    useErrorBoundary: false
  })
}

// =============================================================================
// MAIN CLIENT COMPONENT
// =============================================================================

/**
 * Edit Rate Limit Page Client Component
 * 
 * Handles client-side functionality including data fetching, form management,
 * and user interactions. Implements comprehensive error handling and loading
 * states with optimistic updates per React Query best practices.
 */
export function EditLimitPageClient({ limitId }: EditLimitPageClientProps) {
  const router = useRouter()
  const params = useParams()
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)

  // Data fetching with React Query
  const {
    data: limitData,
    isLoading,
    isError,
    error,
    refetch
  } = useLimitData(limitId)

  // Update mutation with optimistic updates
  const updateMutation = useUpdateLimit(limitId)

  // Form submission handler
  const handleSubmit = useCallback(async (formData: EditLimitFormData) => {
    try {
      await updateMutation.mutateAsync(formData)
    } catch (error) {
      // Error is handled in the mutation's onError callback
      console.error('Form submission error:', error)
    }
  }, [updateMutation])

  // Handle form cancellation
  const handleCancel = useCallback(() => {
    router.push('/adf-limits')
  }, [router])

  // Handle navigation back to list
  const handleBackToList = useCallback(() => {
    router.push('/adf-limits')
  }, [router])

  // Loading state
  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <Button 
            variant="outline" 
            onClick={handleBackToList}
            disabled
          >
            ← Back to Limits
          </Button>
        </div>
        
        <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
          <LoadingSpinner size="lg" />
          <div className="text-center space-y-2">
            <p className="text-lg font-medium text-gray-900 dark:text-gray-100">
              Loading Rate Limit Configuration
            </p>
            <p className="text-gray-600 dark:text-gray-400">
              Fetching limit details and validation rules...
            </p>
          </div>
        </div>
      </div>
    )
  }

  // Error state with retry options
  if (isError || !limitData) {
    const errorMessage = error?.error?.message || 'Failed to load rate limit data'
    const isNotFound = error?.error?.status_code === 404
    
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <Button 
            variant="outline" 
            onClick={handleBackToList}
          >
            ← Back to Limits
          </Button>
        </div>

        <Alert
          variant="destructive"
          title={isNotFound ? "Rate Limit Not Found" : "Failed to Load Rate Limit"}
          className="mb-6"
        >
          <p className="mb-4">
            {isNotFound 
              ? `No rate limit found with ID ${limitId}. It may have been deleted or you may not have permission to view it.`
              : errorMessage
            }
          </p>
          <div className="flex flex-col sm:flex-row gap-3">
            {!isNotFound && (
              <Button 
                variant="outline"
                onClick={() => refetch()}
                disabled={isLoading}
              >
                {isLoading ? 'Retrying...' : 'Try Again'}
              </Button>
            )}
            <Button 
              variant={isNotFound ? "default" : "outline"}
              onClick={handleBackToList}
            >
              {isNotFound ? 'View All Limits' : 'Go Back'}
            </Button>
          </div>
        </Alert>
      </div>
    )
  }

  // Main render with form
  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <Button 
            variant="outline" 
            onClick={handleBackToList}
            className="mb-2"
          >
            ← Back to Limits
          </Button>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            Edit Rate Limit
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Modify the configuration for "{limitData.name}" rate limit
          </p>
        </div>
        
        <div className="flex items-center space-x-2">
          <div className="text-sm text-gray-500 dark:text-gray-400">
            ID: {limitId}
          </div>
          {limitData.active ? (
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
              Active
            </span>
          ) : (
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200">
              Inactive
            </span>
          )}
        </div>
      </div>

      {/* Submission Error Alert */}
      {updateMutation.isError && updateMutation.error && (
        <Alert
          variant="destructive"
          title="Failed to Update Rate Limit"
          className="mb-4"
        >
          <p>
            {updateMutation.error.error?.message || 'An unexpected error occurred while updating the rate limit.'}
          </p>
          {updateMutation.error.error?.context && (
            <details className="mt-2">
              <summary className="cursor-pointer text-sm font-medium">
                Technical Details
              </summary>
              <pre className="mt-2 text-xs bg-red-50 dark:bg-red-900/20 p-2 rounded overflow-auto">
                {JSON.stringify(updateMutation.error.error.context, null, 2)}
              </pre>
            </details>
          )}
        </Alert>
      )}

      {/* Success Message for Optimistic Updates */}
      {updateMutation.isLoading && (
        <Alert
          variant="default"
          title="Updating Rate Limit"
          className="mb-4"
        >
          <div className="flex items-center space-x-2">
            <LoadingSpinner size="sm" />
            <span>Saving changes...</span>
          </div>
        </Alert>
      )}

      {/* Limit Form Component */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
        <LimitForm
          mode="edit"
          initialData={limitData}
          onSubmit={handleSubmit}
          onCancel={handleCancel}
          loading={updateMutation.isLoading}
          error={updateMutation.error}
          showAdvancedOptions={true}
          className="space-y-6"
          testId={`edit-limit-form-${limitId}`}
        />
      </div>

      {/* Last Updated Information */}
      {limitData.updatedAt && (
        <div className="text-sm text-gray-500 dark:text-gray-400 text-center">
          Last updated: {new Date(limitData.updatedAt).toLocaleString()}
          {limitData.createdBy && ` by ${limitData.createdBy}`}
        </div>
      )}
    </div>
  )
}