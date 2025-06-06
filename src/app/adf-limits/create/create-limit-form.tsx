/**
 * Client-side form component for creating API rate limits.
 * 
 * Implements React Hook Form with Zod schema validation, React Query mutations
 * for optimistic updates, and comprehensive error handling. Provides real-time
 * validation under 100ms and integrates with the limit-form component for
 * consistent form behavior across create/edit workflows.
 * 
 * @fileoverview Client-side create limit form component
 * @version 1.0.0
 * @since React 19.0.0 / Next.js 15.1+
 */

'use client';

import { useState, useCallback, useTransition, startTransition } from 'react';
import { useRouter } from 'next/navigation';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { apiPost } from '../../../lib/api-client';
import type { 
  LimitConfiguration,
  CreateLimitMutationVariables,
  CreateLimitMutation,
  LimitFormProps
} from '../types';
import type { 
  ApiErrorResponse,
  ApiResourceResponse 
} from '../../../types/api';

// Import the main form component
import { LimitForm } from '../components/limit-form';

// ============================================================================
// Component Props and Types
// ============================================================================

/**
 * Props for the CreateLimitForm component
 */
interface CreateLimitFormProps {
  /** Server-side fetched data for form initialization */
  initialData: {
    users: Array<{ id: number; name: string; email: string; active: boolean }>;
    services: Array<{ id: number; name: string; type: string; active: boolean; description?: string }>;
    roles: Array<{ id: number; name: string; description?: string; active: boolean }>;
  };
  
  /** Performance and metadata information */
  metadata: {
    usersCount: number;
    servicesCount: number;
    rolesCount: number;
    loadTime: number;
  };
}

/**
 * Form submission state for UI feedback
 */
interface SubmissionState {
  isSubmitting: boolean;
  error: ApiErrorResponse | null;
  lastAttempt: Date | null;
}

// ============================================================================
// API Mutation Functions
// ============================================================================

/**
 * Create limit API call with comprehensive error handling
 */
async function createLimit(data: LimitConfiguration): Promise<ApiResourceResponse<any>> {
  try {
    const response = await apiPost<CreateLimitMutation>('/system/limit', data, {
      snackbarSuccess: 'Rate limit created successfully',
      snackbarError: 'Failed to create rate limit'
    });
    
    return response;
  } catch (error) {
    // Enhanced error handling for different failure scenarios
    if (error instanceof Error) {
      try {
        const apiError: ApiErrorResponse = JSON.parse(error.message);
        throw apiError;
      } catch {
        // Non-API error
        throw {
          success: false,
          error: {
            code: 'CLIENT_ERROR',
            message: error.message || 'An unexpected error occurred',
            status_code: 500
          }
        } as ApiErrorResponse;
      }
    }
    
    throw error;
  }
}

// ============================================================================
// Main Component
// ============================================================================

/**
 * CreateLimitForm - Client Component for Limit Creation
 * 
 * Provides the interactive form interface with React Hook Form validation,
 * React Query mutations, and optimistic updates. Integrates with the shared
 * LimitForm component while handling create-specific logic and navigation.
 */
export function CreateLimitForm({ 
  initialData, 
  metadata 
}: CreateLimitFormProps): JSX.Element {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [isPending, startTransition] = useTransition();
  
  // Component state for submission tracking
  const [submissionState, setSubmissionState] = useState<SubmissionState>({
    isSubmitting: false,
    error: null,
    lastAttempt: null
  });

  // React Query mutation for limit creation
  const createLimitMutation = useMutation({
    mutationFn: createLimit,
    
    // Optimistic update configuration
    onMutate: async (newLimit: LimitConfiguration) => {
      setSubmissionState(prev => ({
        ...prev,
        isSubmitting: true,
        error: null,
        lastAttempt: new Date()
      }));

      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['limits'] });

      // Snapshot the previous value
      const previousLimits = queryClient.getQueryData(['limits']);

      // Optimistically update the cache (if limits list is cached)
      queryClient.setQueryData(['limits'], (old: any) => {
        if (!old?.resource) return old;
        
        return {
          ...old,
          resource: [
            {
              ...newLimit,
              id: Date.now(), // Temporary ID
              createdAt: new Date().toISOString(),
              active: true
            },
            ...old.resource
          ],
          meta: {
            ...old.meta,
            count: old.meta.count + 1
          }
        };
      });

      return { previousLimits };
    },

    // Success handler
    onSuccess: (data, variables, context) => {
      setSubmissionState(prev => ({
        ...prev,
        isSubmitting: false,
        error: null
      }));

      // Show success notification
      toast.success('Rate limit created successfully', {
        description: `${variables.name} has been configured and is now active.`,
        duration: 5000
      });

      // Invalidate and refetch limits data
      queryClient.invalidateQueries({ queryKey: ['limits'] });
      queryClient.invalidateQueries({ queryKey: ['limits', 'stats'] });

      // Navigate to the limits list with success state
      startTransition(() => {
        router.push('/adf-limits?created=true');
      });
    },

    // Error handler
    onError: (error: ApiErrorResponse, variables, context) => {
      setSubmissionState(prev => ({
        ...prev,
        isSubmitting: false,
        error
      }));

      // Rollback optimistic update
      if (context?.previousLimits) {
        queryClient.setQueryData(['limits'], context.previousLimits);
      }

      // Show error notification
      const errorMessage = error.error?.message || 'Failed to create rate limit';
      toast.error('Creation failed', {
        description: errorMessage,
        duration: 8000
      });

      // Log error for debugging
      console.error('Failed to create limit:', error);
    }
  });

  // ============================================================================
  // Event Handlers
  // ============================================================================

  /**
   * Handle form submission with validation and error handling
   */
  const handleSubmit = useCallback(async (data: LimitConfiguration) => {
    try {
      // Validate required fields one more time
      if (!data.name?.trim()) {
        throw new Error('Limit name is required');
      }

      if (!data.rateValue || data.rateValue <= 0) {
        throw new Error('Rate value must be greater than 0');
      }

      if (!data.period?.value || data.period.value <= 0) {
        throw new Error('Period value must be greater than 0');
      }

      // Execute the mutation
      await createLimitMutation.mutateAsync(data);
    } catch (error) {
      console.error('Form submission error:', error);
      
      // Handle validation errors differently from API errors
      if (error instanceof Error && !error.message.includes('API')) {
        setSubmissionState(prev => ({
          ...prev,
          error: {
            success: false,
            error: {
              code: 'VALIDATION_ERROR',
              message: error.message,
              status_code: 400
            }
          }
        }));
      }
    }
  }, [createLimitMutation]);

  /**
   * Handle form cancellation with navigation
   */
  const handleCancel = useCallback(() => {
    startTransition(() => {
      router.push('/adf-limits');
    });
  }, [router]);

  /**
   * Handle form errors (validation failures)
   */
  const handleError = useCallback((errors: any) => {
    console.warn('Form validation errors:', errors);
    
    // Show validation error notification
    toast.error('Form validation failed', {
      description: 'Please check the highlighted fields and try again.',
      duration: 5000
    });
  }, []);

  // ============================================================================
  // Render Component
  // ============================================================================

  const isLoading = submissionState.isSubmitting || isPending || createLimitMutation.isPending;

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200">
      {/* Form Header */}
      <div className="px-6 py-4 border-b border-gray-200">
        <h2 className="text-lg font-semibold text-gray-900">
          Rate Limit Configuration
        </h2>
        <p className="mt-1 text-sm text-gray-600">
          Configure the parameters for your new API rate limit. All fields marked with * are required.
        </p>
      </div>

      {/* Error Display */}
      {submissionState.error && (
        <div className="mx-6 mt-4 p-4 bg-red-50 border border-red-200 rounded-md">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg 
                className="h-5 w-5 text-red-400" 
                viewBox="0 0 20 20" 
                fill="currentColor"
                aria-hidden="true"
              >
                <path 
                  fillRule="evenodd" 
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.28 7.22a.75.75 0 00-1.06 1.06L8.94 10l-1.72 1.72a.75.75 0 101.06 1.06L10 11.06l1.72 1.72a.75.75 0 101.06-1.06L11.06 10l1.72-1.72a.75.75 0 00-1.06-1.06L10 8.94 8.28 7.22z" 
                  clipRule="evenodd" 
                />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">
                Creation Failed
              </h3>
              <div className="mt-2 text-sm text-red-700">
                <p>{submissionState.error.error?.message}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Main Form */}
      <div className="p-6">
        <LimitForm
          onSubmit={handleSubmit}
          onError={handleError}
          onCancel={handleCancel}
          loading={isLoading}
          disabled={isLoading}
          enableConnectionTest={true}
          hideAdvancedOptions={false}
          className="space-y-6"
          variant="detailed"
          aria-label="Create rate limit form"
          aria-describedby="form-description"
          // Pass server-side data as field options
          initialFieldOptions={{
            users: initialData.users.map(user => ({
              id: user.id,
              name: user.name,
              email: user.email
            })),
            services: initialData.services.map(service => ({
              id: service.id,
              name: service.name,
              type: service.type
            })),
            roles: initialData.roles.map(role => ({
              id: role.id,
              name: role.name,
              description: role.description
            }))
          }}
        />
      </div>

      {/* Hidden description for accessibility */}
      <div id="form-description" className="sr-only">
        Form for creating a new API rate limit with configuration options for 
        limit type, rate values, target assignment, and advanced settings.
      </div>

      {/* Development Information */}
      {process.env.NODE_ENV === 'development' && (
        <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 text-xs text-gray-500">
          <details>
            <summary className="cursor-pointer font-medium">Form State Debug</summary>
            <dl className="mt-2 grid grid-cols-2 gap-x-4 gap-y-1">
              <dt>Submission State:</dt>
              <dd>{isLoading ? 'Loading' : 'Ready'}</dd>
              <dt>Last Attempt:</dt>
              <dd>{submissionState.lastAttempt?.toLocaleTimeString() || 'None'}</dd>
              <dt>Available Users:</dt>
              <dd>{initialData.users.length}</dd>
              <dt>Available Services:</dt>
              <dd>{initialData.services.length}</dd>
              <dt>Available Roles:</dt>
              <dd>{initialData.roles.length}</dd>
            </dl>
          </details>
        </div>
      )}
    </div>
  );
}

export default CreateLimitForm;