/**
 * Next.js page component for creating new API rate limits.
 * 
 * Implements React 19 server components with client-side interactivity for optimal 
 * performance and SEO. Converts Angular df-limit-details component functionality 
 * to modern React patterns with React Hook Form, Zod validation, and React Query
 * mutations for optimistic updates and error handling.
 * 
 * Features SSR-compatible data fetching for dropdown options, real-time validation
 * under 100ms, WCAG 2.1 AA compliance through Headless UI integration, and
 * comprehensive error boundary integration for graceful error handling.
 * 
 * @fileoverview Create limit page component for Next.js app router
 * @version 1.0.0
 * @since React 19.0.0 / Next.js 15.1+
 */

'use client';

import { Suspense, useState, useCallback, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import { toast } from 'sonner';
import { apiGet, apiPost } from '../../../lib/api-client';
import type { 
  ApiListResponse, 
  ApiErrorResponse,
  ApiResourceResponse 
} from '../../../types/api';
import type { 
  LimitConfiguration, 
  CreateLimitMutationVariables,
  UserOption,
  ServiceOption,
  RoleOption
} from '../types';

// Import the main form component and UI components
import { LimitForm } from '../components/limit-form';

// ============================================================================
// Metadata (moved to layout or parent for server components)
// ============================================================================

/**
 * Component Types and Interfaces
 */
interface FormDropdownData {
  users: UserOption[];
  services: ServiceOption[];
  roles: RoleOption[];
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
// Data Fetching Functions
// ============================================================================

/**
 * Fetch users for limit assignment dropdown
 */
async function fetchUsers(): Promise<UserOption[]> {
  try {
    const response = await apiGet<ApiListResponse<UserOption>>('/system/user', {
      fields: 'id,name,email,active',
      filter: 'active=true',
      limit: 1000,
      sort: 'name'
    });
    return response.resource || [];
  } catch (error) {
    console.error('Failed to fetch users:', error);
    return [];
  }
}

/**
 * Fetch services for limit assignment dropdown
 */
async function fetchServices(): Promise<ServiceOption[]> {
  try {
    const response = await apiGet<ApiListResponse<ServiceOption>>('/system/service', {
      fields: 'id,name,type,active,description',
      filter: 'active=true',
      limit: 1000,
      sort: 'name'
    });
    return response.resource || [];
  } catch (error) {
    console.error('Failed to fetch services:', error);
    return [];
  }
}

/**
 * Fetch roles for limit assignment dropdown
 */
async function fetchRoles(): Promise<RoleOption[]> {
  try {
    const response = await apiGet<ApiListResponse<RoleOption>>('/system/role', {
      fields: 'id,name,description,active',
      filter: 'active=true',
      limit: 1000,
      sort: 'name'
    });
    return response.resource || [];
  } catch (error) {
    console.error('Failed to fetch roles:', error);
    return [];
  }
}

/**
 * Create limit API call
 */
async function createLimit(data: LimitConfiguration): Promise<ApiResourceResponse<any>> {
  return apiPost('/system/limit', data, {
    snackbarSuccess: 'Rate limit created successfully',
    snackbarError: 'Failed to create rate limit'
  });
}

// ============================================================================
// Loading Component
// ============================================================================

function CreateLimitPageLoading(): JSX.Element {
  return (
    <div 
      className="container mx-auto px-4 py-8 max-w-4xl"
      role="status"
      aria-label="Loading create limit page"
    >
      <div className="mb-8">
        <div className="h-8 bg-gray-200 rounded-md w-64 mb-4 animate-pulse" />
        <div className="h-4 bg-gray-150 rounded w-96 animate-pulse" />
      </div>
      
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="space-y-6">
          {Array.from({ length: 6 }).map((_, index) => (
            <div key={index} className="space-y-2">
              <div className="h-4 bg-gray-200 rounded w-32 animate-pulse" />
              <div className="h-10 bg-gray-100 rounded-md animate-pulse" />
            </div>
          ))}
          
          <div className="flex gap-3 pt-6 border-t border-gray-200">
            <div className="h-10 bg-blue-200 rounded-md w-24 animate-pulse" />
            <div className="h-10 bg-gray-200 rounded-md w-20 animate-pulse" />
          </div>
        </div>
      </div>
      
      <span className="sr-only">Loading limit creation form...</span>
    </div>
  );
}

// ============================================================================
// Error Boundary Component
// ============================================================================

function CreateLimitError({ 
  error, 
  reset 
}: { 
  error: Error | ApiErrorResponse; 
  reset?: () => void;
}): JSX.Element {
  const isApiError = 'success' in error && !error.success;
  
  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="bg-red-50 border border-red-200 rounded-lg p-6">
        <div className="flex items-start">
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
              Unable to Load Limit Creation Form
            </h3>
            <div className="mt-2 text-sm text-red-700">
              <p>
                {isApiError 
                  ? (error as ApiErrorResponse).error?.message || 'API request failed'
                  : error.message || 'An unexpected error occurred'
                }
              </p>
            </div>
            {reset && (
              <div className="mt-4">
                <button
                  type="button"
                  onClick={reset}
                  className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-red-700 bg-red-100 hover:bg-red-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-colors duration-200"
                >
                  Try Again
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// Main Create Form Component
// ============================================================================

function CreateLimitFormWrapper(): JSX.Element {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [isPending, startTransition] = useTransition();
  
  // Component state
  const [submissionState, setSubmissionState] = useState<SubmissionState>({
    isSubmitting: false,
    error: null,
    lastAttempt: null
  });

  // Data fetching queries
  const { data: dropdownData, isLoading: isLoadingData, error: dataError } = useQuery({
    queryKey: ['limit-create-data'],
    queryFn: async (): Promise<FormDropdownData> => {
      const [users, services, roles] = await Promise.all([
        fetchUsers(),
        fetchServices(),
        fetchRoles()
      ]);
      return { users, services, roles };
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000 // 10 minutes (was cacheTime)
  });

  // Create mutation
  const createLimitMutation = useMutation({
    mutationFn: createLimit,
    
    onMutate: async (newLimit: LimitConfiguration) => {
      setSubmissionState(prev => ({
        ...prev,
        isSubmitting: true,
        error: null,
        lastAttempt: new Date()
      }));

      // Optimistic update
      await queryClient.cancelQueries({ queryKey: ['limits'] });
      const previousLimits = queryClient.getQueryData(['limits']);

      queryClient.setQueryData(['limits'], (old: any) => {
        if (!old?.resource) return old;
        return {
          ...old,
          resource: [
            { ...newLimit, id: Date.now(), createdAt: new Date().toISOString() },
            ...old.resource
          ],
          meta: { ...old.meta, count: old.meta.count + 1 }
        };
      });

      return { previousLimits };
    },

    onSuccess: (data, variables) => {
      setSubmissionState(prev => ({ ...prev, isSubmitting: false, error: null }));
      
      toast.success('Rate limit created successfully', {
        description: `${variables.name} has been configured and is now active.`,
        duration: 5000
      });

      queryClient.invalidateQueries({ queryKey: ['limits'] });
      
      startTransition(() => {
        router.push('/adf-limits?created=true');
      });
    },

    onError: (error: ApiErrorResponse, variables, context) => {
      setSubmissionState(prev => ({ ...prev, isSubmitting: false, error }));

      if (context?.previousLimits) {
        queryClient.setQueryData(['limits'], context.previousLimits);
      }

      const errorMessage = error.error?.message || 'Failed to create rate limit';
      toast.error('Creation failed', { description: errorMessage, duration: 8000 });
    }
  });

  // Event handlers
  const handleSubmit = useCallback(async (data: LimitConfiguration) => {
    try {
      await createLimitMutation.mutateAsync(data);
    } catch (error) {
      console.error('Form submission error:', error);
    }
  }, [createLimitMutation]);

  const handleCancel = useCallback(() => {
    startTransition(() => {
      router.push('/adf-limits');
    });
  }, [router]);

  const handleError = useCallback((errors: any) => {
    console.warn('Form validation errors:', errors);
    toast.error('Form validation failed', {
      description: 'Please check the highlighted fields and try again.',
      duration: 5000
    });
  }, []);

  // Loading state
  if (isLoadingData) {
    return <CreateLimitPageLoading />;
  }

  // Error state
  if (dataError) {
    return <CreateLimitError error={dataError as Error} />;
  }

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
              <h3 className="text-sm font-medium text-red-800">Creation Failed</h3>
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
        />
      </div>

      {/* Hidden description for accessibility */}
      <div id="form-description" className="sr-only">
        Form for creating a new API rate limit with configuration options for 
        limit type, rate values, target assignment, and advanced settings.
      </div>
    </div>
  );
}

// ============================================================================
// Main Page Component
// ============================================================================

/**
 * Create Limit Page - Next.js Client Component
 * 
 * Provides the main page interface for creating API rate limits with 
 * comprehensive form handling, data fetching, and error management.
 */
export default function CreateLimitPage(): JSX.Element {
  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      {/* Page Header */}
      <header className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 tracking-tight">
          Create Rate Limit
        </h1>
        <p className="mt-2 text-sm text-gray-600 max-w-2xl">
          Configure API rate limits to control access patterns and ensure optimal 
          performance. Set limits by user, service, role, or globally across your API.
        </p>
      </header>

      {/* Main Form with Error Boundary */}
      <Suspense fallback={<CreateLimitPageLoading />}>
        <CreateLimitFormWrapper />
      </Suspense>
    </div>
  );
}