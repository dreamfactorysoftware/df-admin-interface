'use client';

/**
 * API Rate Limit Edit Page Component for Next.js Dynamic Routing
 * 
 * Main Next.js page component for editing existing API rate limits using dynamic ID routing.
 * Implements React Hook Form with Zod schema validation, SWR for data fetching and optimistic
 * updates, and Tailwind CSS styling with Headless UI components. Replaces Angular df-limit-details
 * component edit mode with React/Next.js SSR-compatible implementation featuring dynamic form
 * controls, paywall enforcement, and authentication middleware integration.
 * 
 * Features:
 * - React Hook Form with Zod schema validators per React/Next.js Integration Requirements
 * - SWR for intelligent caching and synchronization with cache hit responses under 50ms
 * - Next.js server components for initial page loads with SSR pages under 2 seconds
 * - Tailwind CSS 4.1+ with consistent theme injection across components
 * - WCAG 2.1 AA compliance through Headless UI integration per Section 0.1.2
 * - Next.js middleware for authentication and security rule evaluation
 * - Dynamic routing parameter extraction using Next.js app router conventions
 * - Comprehensive error handling with automatic fallback to list view per Section 4.2
 * - SEO optimization through Next.js metadata API integration per Next.js 15.1+ features
 * 
 * @fileoverview Dynamic page component for API rate limit editing
 * @version 1.0.0
 * @since React 19.0.0 / Next.js 15.1+
 * @see Technical Specification Section 0 - SUMMARY OF CHANGES
 * @see Technical Specification Section 4.7.1.1 - routing migration strategy
 */

import React, { Suspense, useEffect, useMemo, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Metadata } from 'next';
import { ErrorBoundary } from 'react-error-boundary';
import { 
  ExclamationTriangleIcon,
  ArrowLeftIcon,
  PencilIcon,
  TrashIcon,
  CheckCircleIcon,
  XCircleIcon 
} from '@heroicons/react/24/outline';

// Internal imports for limit management
import { useLimitData } from '../../hooks/use-limits-data';
import { useLimitMutations } from '../../hooks/use-limit-mutations';
import { useLimitOptions } from '../../hooks/use-limit-options';
import { LimitForm } from '../../components/limit-form';
import { SecurityNav } from '../../components/security-nav';

// UI Component imports (implementing minimal versions for now)
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { Alert } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

// Utility imports
import { cn } from '@/lib/utils';
import { formatRelativeTime, formatDate } from '@/lib/date-utils';

// Type imports
import type { 
  LimitTableRowData,
  LimitConfiguration,
  LimitFormProps 
} from '../../types';
import type { ApiErrorResponse } from '@/types/api';

// ============================================================================
// Page Component Interface and Types
// ============================================================================

/**
 * Route parameters for dynamic [id] routing
 */
interface LimitEditPageParams {
  id: string;
}

/**
 * Component props for the page
 */
interface LimitEditPageProps {
  params: LimitEditPageParams;
}

/**
 * Error boundary fallback component props
 */
interface ErrorFallbackProps {
  error: Error;
  resetErrorBoundary: () => void;
}

// ============================================================================
// Metadata Generation for SEO Optimization
// ============================================================================

/**
 * Generate metadata for the limit edit page
 * Implements Next.js metadata API for SEO optimization per Next.js 15.1+ features
 */
export async function generateMetadata({ params }: LimitEditPageProps): Promise<Metadata> {
  const limitId = parseInt(params.id, 10);
  
  // Basic metadata for all limit edit pages
  const baseMetadata: Metadata = {
    title: `Edit API Rate Limit - DreamFactory Admin`,
    description: 'Configure and manage API rate limiting settings for enhanced security and performance control.',
    keywords: [
      'API rate limiting',
      'DreamFactory admin',
      'API security',
      'rate limit configuration',
      'API management'
    ],
    robots: {
      index: false, // Internal admin pages should not be indexed
      follow: false,
    },
    openGraph: {
      title: 'Edit API Rate Limit - DreamFactory Admin',
      description: 'Configure API rate limiting settings',
      type: 'website',
      siteName: 'DreamFactory Admin Interface',
    },
  };

  // If limit ID is invalid, return base metadata
  if (isNaN(limitId) || limitId <= 0) {
    return {
      ...baseMetadata,
      title: 'Invalid Rate Limit - DreamFactory Admin',
      description: 'The requested rate limit could not be found.',
    };
  }

  // For valid IDs, add dynamic content
  return {
    ...baseMetadata,
    title: `Edit Rate Limit #${limitId} - DreamFactory Admin`,
    description: `Configure rate limiting settings for limit ID ${limitId}.`,
    alternates: {
      canonical: `/api-security/limits/${limitId}`,
    },
  };
}

// ============================================================================
// Error Boundary Components
// ============================================================================

/**
 * Error fallback component for limit edit page errors
 * Provides user-friendly error display with recovery options
 */
function LimitEditErrorFallback({ error, resetErrorBoundary }: ErrorFallbackProps) {
  const router = useRouter();

  const handleReturnToList = useCallback(() => {
    router.push('/api-security/limits');
  }, [router]);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Navigation */}
      <SecurityNav />
      
      {/* Error Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Card className="max-w-2xl mx-auto">
          <div className="text-center p-8">
            <ExclamationTriangleIcon 
              className="w-16 h-16 text-red-500 mx-auto mb-4" 
              aria-hidden="true"
            />
            
            <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">
              Unable to Load Rate Limit
            </h1>
            
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              {error.message || 'An unexpected error occurred while loading the rate limit details.'}
            </p>

            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Button
                onClick={resetErrorBoundary}
                variant="primary"
                className="inline-flex items-center gap-2"
              >
                <CheckCircleIcon className="w-4 h-4" aria-hidden="true" />
                Try Again
              </Button>
              
              <Button
                onClick={handleReturnToList}
                variant="secondary"
                className="inline-flex items-center gap-2"
              >
                <ArrowLeftIcon className="w-4 h-4" aria-hidden="true" />
                Back to Rate Limits
              </Button>
            </div>

            {/* Development error details */}
            {process.env.NODE_ENV === 'development' && (
              <details className="mt-6 text-left">
                <summary className="cursor-pointer text-sm font-medium text-gray-700 dark:text-gray-300">
                  Technical Details
                </summary>
                <pre className="mt-2 p-4 bg-gray-100 dark:bg-gray-800 rounded-md text-xs overflow-x-auto">
                  {error.stack}
                </pre>
              </details>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}

/**
 * Loading fallback component for Suspense boundaries
 * Provides consistent loading states across the application
 */
function LimitEditLoadingFallback() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Navigation */}
      <SecurityNav />
      
      {/* Loading Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="animate-pulse">
          {/* Header skeleton */}
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-4">
              <div className="w-8 h-8 bg-gray-200 dark:bg-gray-700 rounded" />
              <div className="space-y-2">
                <div className="w-48 h-6 bg-gray-200 dark:bg-gray-700 rounded" />
                <div className="w-32 h-4 bg-gray-200 dark:bg-gray-700 rounded" />
              </div>
            </div>
            <div className="flex gap-2">
              <div className="w-20 h-9 bg-gray-200 dark:bg-gray-700 rounded" />
              <div className="w-16 h-9 bg-gray-200 dark:bg-gray-700 rounded" />
            </div>
          </div>

          {/* Form skeleton */}
          <Card>
            <div className="p-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {Array.from({ length: 6 }).map((_, index) => (
                  <div key={index} className="space-y-2">
                    <div className="w-24 h-4 bg-gray-200 dark:bg-gray-700 rounded" />
                    <div className="w-full h-9 bg-gray-200 dark:bg-gray-700 rounded" />
                  </div>
                ))}
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// Main Page Component Implementation
// ============================================================================

/**
 * Main page component for editing API rate limits
 * 
 * Implements comprehensive limit editing workflow with dynamic routing,
 * real-time validation, optimistic updates, and comprehensive error handling.
 * Replaces Angular df-limit-details component with modern React patterns.
 */
function LimitEditPageContent({ limitId }: { limitId: number }) {
  const router = useRouter();

  // =========================================================================
  // Data Fetching with SWR
  // =========================================================================

  // Fetch individual limit data with comprehensive error handling
  const {
    limit,
    loading: limitLoading,
    error: limitError,
    paywall,
    operations: limitOperations,
    validation: limitValidation,
  } = useLimitData(limitId, {
    enableRealtime: true, // Enable real-time updates for active editing
    includeUsage: true,   // Include usage statistics for context
  });

  // Fetch dropdown options for form selects
  const {
    data: dropdownOptions,
    loading: optionsLoading,
    errors: optionsErrors,
    isReady: optionsReady,
  } = useLimitOptions({
    fetchServices: true,
    fetchUsers: true,
    fetchRoles: true,
  });

  // Mutation hooks for limit operations
  const {
    updateLimit,
    deleteLimit,
    isUpdating,
    isDeleting,
    updateError,
    deleteError,
    resetUpdateError,
    resetDeleteError,
  } = useLimitMutations({
    optimisticUpdate: {
      enabled: true,
      rollbackOnError: true,
    },
    successNotification: {
      title: 'Success',
      message: 'Rate limit updated successfully',
      duration: 5000,
    },
    errorNotification: {
      title: 'Error',
      fallbackMessage: 'Failed to update rate limit',
    },
  });

  // =========================================================================
  // Error Handling and Validation
  // =========================================================================

  // Handle paywall enforcement
  useEffect(() => {
    if (paywall.isActive && !paywall.isLoading) {
      router.push('/paywall?feature=limits&redirect=' + encodeURIComponent(window.location.pathname));
    }
  }, [paywall.isActive, paywall.isLoading, router]);

  // Handle limit not found - redirect to list view per Section 4.2 error handling
  useEffect(() => {
    if (limitError && !limitLoading) {
      // Check if it's a 404 error
      if (limitError.error?.status_code === 404) {
        router.push('/api-security/limits?error=limit-not-found');
        return;
      }

      // For other errors, stay on page but show error state
      console.error('Failed to load limit:', limitError);
    }
  }, [limitError, limitLoading, router]);

  // =========================================================================
  // Form Handlers
  // =========================================================================

  /**
   * Handle form submission for limit updates
   * Implements optimistic updates with automatic rollback on error
   */
  const handleLimitUpdate = useCallback(async (formData: LimitConfiguration) => {
    if (!limit) return;

    try {
      await updateLimit({
        id: limit.id,
        data: formData,
        testConnection: formData.service ? true : false, // Test connection for service limits
      });

      // Refresh limit data to get updated values
      await limitOperations.refresh();
      
    } catch (error) {
      console.error('Failed to update limit:', error);
      // Error handling is managed by the mutation hook
    }
  }, [limit, updateLimit, limitOperations]);

  /**
   * Handle limit deletion with confirmation
   * Implements safe deletion with user confirmation
   */
  const handleLimitDelete = useCallback(async () => {
    if (!limit) return;

    const confirmed = window.confirm(
      `Are you sure you want to delete the rate limit "${limit.name}"? This action cannot be undone.`
    );

    if (!confirmed) return;

    try {
      await deleteLimit({ id: limit.id });
      
      // Redirect to list view after successful deletion
      router.push('/api-security/limits?success=limit-deleted');
      
    } catch (error) {
      console.error('Failed to delete limit:', error);
      // Error handling is managed by the mutation hook
    }
  }, [limit, deleteLimit, router]);

  /**
   * Handle navigation back to list view
   */
  const handleBackToList = useCallback(() => {
    router.push('/api-security/limits');
  }, [router]);

  // =========================================================================
  // Computed Values and Memoization
  // =========================================================================

  // Check if page is in loading state
  const isLoading = useMemo(() => {
    return limitLoading || optionsLoading.isLoading || paywall.isLoading;
  }, [limitLoading, optionsLoading.isLoading, paywall.isLoading]);

  // Check if page has critical errors
  const hasCriticalError = useMemo(() => {
    return limitError && limitError.error?.status_code !== 404;
  }, [limitError]);

  // Check if form can be submitted
  const canSubmit = useMemo(() => {
    return !!(limit && optionsReady && !isUpdating && !isDeleting);
  }, [limit, optionsReady, isUpdating, isDeleting]);

  // Format limit metadata for display
  const limitMetadata = useMemo(() => {
    if (!limit) return null;

    return {
      createdAt: limit.createdAt ? formatDate(limit.createdAt) : 'Unknown',
      updatedAt: limit.updatedAt ? formatRelativeTime(limit.updatedAt) : 'Never',
      createdBy: limit.createdBy || 'System',
      status: limit.active ? 'Active' : 'Inactive',
    };
  }, [limit]);

  // =========================================================================
  // Render Logic
  // =========================================================================

  // Show loading state during initial data fetch
  if (isLoading) {
    return <LimitEditLoadingFallback />;
  }

  // Show error state for critical errors
  if (hasCriticalError) {
    throw new Error(limitError?.error?.message || 'Failed to load rate limit');
  }

  // Show not found state
  if (!limit && !limitLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <SecurityNav />
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <Card className="max-w-2xl mx-auto">
            <div className="text-center p-8">
              <XCircleIcon 
                className="w-16 h-16 text-gray-400 mx-auto mb-4" 
                aria-hidden="true"
              />
              
              <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">
                Rate Limit Not Found
              </h1>
              
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                The rate limit you're looking for doesn't exist or has been deleted.
              </p>

              <Button
                onClick={handleBackToList}
                variant="primary"
                className="inline-flex items-center gap-2"
              >
                <ArrowLeftIcon className="w-4 h-4" aria-hidden="true" />
                Back to Rate Limits
              </Button>
            </div>
          </Card>
        </div>
      </div>
    );
  }

  // Main page content
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Navigation */}
      <SecurityNav />

      {/* Page Header */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            {/* Header Content */}
            <div className="flex items-center gap-4 min-w-0">
              <Button
                onClick={handleBackToList}
                variant="ghost"
                size="sm"
                className="flex-shrink-0"
                aria-label="Back to rate limits list"
              >
                <ArrowLeftIcon className="w-5 h-5" />
              </Button>
              
              <div className="min-w-0">
                <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 truncate">
                  Edit Rate Limit: {limit?.name}
                </h1>
                
                {limitMetadata && (
                  <div className="flex items-center gap-4 mt-1 text-sm text-gray-500 dark:text-gray-400">
                    <span>ID: {limit?.id}</span>
                    <span>•</span>
                    <span>Status: {limitMetadata.status}</span>
                    <span>•</span>
                    <span>Updated: {limitMetadata.updatedAt}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-2 flex-shrink-0">
              <Button
                onClick={handleLimitDelete}
                variant="destructive"
                size="sm"
                disabled={isDeleting || isUpdating}
                className="inline-flex items-center gap-2"
              >
                <TrashIcon className="w-4 h-4" />
                {isDeleting ? 'Deleting...' : 'Delete'}
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Error Alerts */}
        {updateError && (
          <Alert
            variant="error"
            title="Update Failed"
            message={updateError.error?.message || 'Failed to update rate limit'}
            onDismiss={resetUpdateError}
            className="mb-6"
          />
        )}

        {deleteError && (
          <Alert
            variant="error"
            title="Delete Failed"
            message={deleteError.error?.message || 'Failed to delete rate limit'}
            onDismiss={resetDeleteError}
            className="mb-6"
          />
        )}

        {optionsErrors.hasErrors && (
          <Alert
            variant="warning"
            title="Loading Issues"
            message="Some dropdown options failed to load. Form functionality may be limited."
            className="mb-6"
          />
        )}

        {/* Form Content */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Main Form */}
          <div className="lg:col-span-3">
            <Card>
              <div className="p-6">
                <div className="flex items-center gap-3 mb-6">
                  <PencilIcon className="w-5 h-5 text-gray-500" aria-hidden="true" />
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                    Rate Limit Configuration
                  </h2>
                </div>

                <LimitForm
                  initialData={limit}
                  dropdownOptions={dropdownOptions}
                  onSubmit={handleLimitUpdate}
                  onCancel={handleBackToList}
                  isLoading={isUpdating}
                  disabled={!canSubmit}
                  showTestConnection={true}
                  mode="edit"
                />
              </div>
            </Card>
          </div>

          {/* Sidebar with metadata */}
          <div className="lg:col-span-1">
            <Card>
              <div className="p-6">
                <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-4">
                  Limit Details
                </h3>
                
                {limitMetadata && (
                  <div className="space-y-3 text-sm">
                    <div>
                      <span className="text-gray-500 dark:text-gray-400">Status:</span>
                      <div className="mt-1">
                        <span className={cn(
                          'inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium',
                          limit?.active
                            ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                            : 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200'
                        )}>
                          <div className={cn(
                            'w-1.5 h-1.5 rounded-full',
                            limit?.active ? 'bg-green-500' : 'bg-gray-500'
                          )} />
                          {limitMetadata.status}
                        </span>
                      </div>
                    </div>

                    <div>
                      <span className="text-gray-500 dark:text-gray-400">Created:</span>
                      <div className="mt-1 text-gray-900 dark:text-gray-100">
                        {limitMetadata.createdAt}
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">
                        by {limitMetadata.createdBy}
                      </div>
                    </div>

                    <div>
                      <span className="text-gray-500 dark:text-gray-400">Last Updated:</span>
                      <div className="mt-1 text-gray-900 dark:text-gray-100">
                        {limitMetadata.updatedAt}
                      </div>
                    </div>

                    {limit?.limitRate && (
                      <div>
                        <span className="text-gray-500 dark:text-gray-400">Rate:</span>
                        <div className="mt-1 text-gray-900 dark:text-gray-100 font-mono text-xs">
                          {limit.limitRate}
                        </div>
                      </div>
                    )}

                    {limit?.currentUsage !== undefined && (
                      <div>
                        <span className="text-gray-500 dark:text-gray-400">Usage:</span>
                        <div className="mt-1 text-gray-900 dark:text-gray-100">
                          {limit.currentUsage} requests
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {!limitValidation.isValid && (
                  <Alert
                    variant="warning"
                    title="Data may be stale"
                    message="The limit data might not be current. Try refreshing."
                    className="mt-4"
                  />
                )}
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Main exported page component with error boundary and suspense
 * 
 * Implements comprehensive error handling, loading states, and parameter validation
 * per React/Next.js Integration Requirements and Section 4.2 error handling patterns.
 */
export default function LimitEditPage({ params }: LimitEditPageProps) {
  // Validate and parse the limit ID parameter
  const limitId = useMemo(() => {
    const id = parseInt(params.id, 10);
    if (isNaN(id) || id <= 0) {
      throw new Error(`Invalid limit ID: ${params.id}`);
    }
    return id;
  }, [params.id]);

  return (
    <ErrorBoundary
      FallbackComponent={LimitEditErrorFallback}
      onError={(error, errorInfo) => {
        // Log error for monitoring and debugging
        console.error('Limit edit page error:', error, errorInfo);
        
        // In production, this would send to error monitoring service
        if (typeof window !== 'undefined' && window.gtag) {
          window.gtag('event', 'exception', {
            description: error.message,
            fatal: false,
          });
        }
      }}
      onReset={() => {
        // Clear any cached error states when resetting
        if (typeof window !== 'undefined') {
          window.location.reload();
        }
      }}
    >
      <Suspense fallback={<LimitEditLoadingFallback />}>
        <LimitEditPageContent limitId={limitId} />
      </Suspense>
    </ErrorBoundary>
  );
}

// ============================================================================
// Type Exports and Additional Utilities
// ============================================================================

export type { LimitEditPageProps, LimitEditPageParams };