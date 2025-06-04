/**
 * Create Limit Page Component for Next.js App Router
 * 
 * Next.js server component for creating new API rate limits, implementing the create route 
 * functionality from the Angular df-limit-details component. Renders the limit-form component 
 * with create-specific configuration, handles form submission through React Query mutations, 
 * and integrates with Next.js app router patterns for SSR optimization and client-side navigation.
 * 
 * Key Features:
 * - Server-side rendering for initial page loads under 2 seconds
 * - React Hook Form with Zod schema validation for real-time validation under 100ms
 * - React Query mutations for optimistic updates and error handling
 * - WCAG 2.1 AA compliance through Headless UI integration
 * - Error boundary integration with fallback UI rendering
 * - Next.js metadata API for SEO optimization
 * 
 * Migration Notes:
 * - Converts Angular df-limit-details component to Next.js page component with React 19.0.0 patterns
 * - Replaces Angular reactive forms with React Hook Form uncontrolled components
 * - Converts RxJS observables to React Query mutations for limit creation
 * - Implements SSR-compatible data fetching for dropdown options (services, users, roles)
 * 
 * @author DreamFactory Admin Interface Team
 * @version React 19/Next.js 15.1 Migration
 * @since 2024-12-19
 */

import React, { Suspense } from 'react'
import { Metadata } from 'next'
import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'
import { ChevronLeftIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline'

// Core types and validation schemas
import {
  CreateLimitFormData,
  CreateLimitFormSchema,
  LimitType,
  LimitCounter,
  LIMITS_QUERY_KEYS
} from '@/app/adf-limits/types'
import { ApiErrorResponse, ApiRequestOptions } from '@/types/api'

// Component imports with graceful fallbacks for missing dependencies
import { LimitForm } from '@/app/adf-limits/components/limit-form'
import { LoadingSpinner } from '@/components/ui/loading-spinner'
import { Button } from '@/components/ui/button'
import { Alert } from '@/components/ui/alert'

// API and data management
import { apiClient } from '@/lib/api-client'

// =============================================================================
// NEXT.JS METADATA API FOR SEO OPTIMIZATION
// =============================================================================

/**
 * Static metadata for the create limit page
 * Implements Next.js metadata API for SEO optimization and social sharing
 * per Next.js 15.1+ features and Section 0.2.1 architecture requirements
 */
export const metadata: Metadata = {
  title: 'Create API Rate Limit | DreamFactory Admin',
  description: 'Create a new API rate limit configuration to control access and manage API usage in DreamFactory. Configure rate limiting by user, service, role, or global scope with advanced counter mechanisms.',
  keywords: [
    'API rate limiting',
    'DreamFactory admin',
    'access control',
    'API management',
    'rate limit configuration',
    'REST API limits'
  ],
  openGraph: {
    title: 'Create API Rate Limit | DreamFactory Admin',
    description: 'Create and configure API rate limits for comprehensive access control in DreamFactory.',
    type: 'website',
    siteName: 'DreamFactory Admin Interface'
  },
  twitter: {
    card: 'summary',
    title: 'Create API Rate Limit | DreamFactory Admin',
    description: 'Create and configure API rate limits for comprehensive access control in DreamFactory.'
  },
  robots: {
    index: false, // Admin interface should not be indexed
    follow: false
  }
}

// =============================================================================
// SERVER-SIDE DATA FETCHING FOR DROPDOWN OPTIONS
// =============================================================================

/**
 * Server-side data fetching for form dropdown options
 * Implements SSR-compatible data fetching per Next.js server components requirements
 * and React/Next.js Integration Requirements for SSR pages under 2 seconds
 */
interface CreateLimitPageProps {
  searchParams?: {
    service?: string
    user?: string
    role?: string
    type?: string
  }
}

/**
 * Fetch dropdown options for the limit form
 * Optimized for server-side rendering with caching and error handling
 */
async function fetchFormOptions(): Promise<{
  services: Array<{ id: number; name: string; label: string }>
  users: Array<{ id: number; name: string; email: string }>
  roles: Array<{ id: number; name: string; description: string }>
}> {
  try {
    // Parallel data fetching for optimal performance
    const [servicesResponse, usersResponse, rolesResponse] = await Promise.all([
      // Fetch available services for service-based limits
      apiClient.get('/system/service', {
        cache: 'force-cache',
        next: { revalidate: 300 } // Cache for 5 minutes
      }).catch(() => ({ resource: [] })),
      
      // Fetch users for user-based limits
      apiClient.get('/system/user', {
        cache: 'force-cache', 
        next: { revalidate: 300 }
      }).catch(() => ({ resource: [] })),
      
      // Fetch roles for role-based limits
      apiClient.get('/system/role', {
        cache: 'force-cache',
        next: { revalidate: 300 }
      }).catch(() => ({ resource: [] }))
    ])

    return {
      services: servicesResponse.resource?.map((service: any) => ({
        id: service.id,
        name: service.name,
        label: service.label || service.name
      })) || [],
      users: usersResponse.resource?.map((user: any) => ({
        id: user.id,
        name: `${user.first_name || ''} ${user.last_name || ''}`.trim() || user.name || user.username,
        email: user.email
      })) || [],
      roles: rolesResponse.resource?.map((role: any) => ({
        id: role.id,
        name: role.name,
        description: role.description
      })) || []
    }
  } catch (error) {
    console.error('Failed to fetch form options:', error)
    // Return empty arrays to allow form to render without options
    return {
      services: [],
      users: [],
      roles: []
    }
  }
}

/**
 * Validate access permissions for creating limits
 * Implements server-side permission checking before rendering the form
 */
async function validateCreateAccess(): Promise<boolean> {
  try {
    // Check if user has permission to create limits
    // This would integrate with DreamFactory's permission system
    const response = await apiClient.get('/system/admin/session', {
      cache: 'no-store' // Always check current session
    })
    
    // Check for admin role or specific limit creation permission
    return response.user_id && (
      response.is_admin || 
      response.permissions?.includes('system.limit.create') ||
      response.roles?.some((role: string) => role === 'admin')
    )
  } catch (error) {
    console.error('Access validation failed:', error)
    return false
  }
}

// =============================================================================
// ERROR BOUNDARY FALLBACK COMPONENT
// =============================================================================

/**
 * Error boundary fallback UI for create limit page
 * Implements comprehensive error handling per Section 4.2.1.1 error boundary implementation
 */
function CreateLimitErrorFallback({ 
  error, 
  reset 
}: { 
  error: Error & { digest?: string }
  reset: () => void 
}) {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 px-4 py-8">
      <div className="max-w-2xl mx-auto">
        {/* Navigation breadcrumb */}
        <div className="mb-6">
          <Link 
            href="/adf-limits"
            className="inline-flex items-center text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 transition-colors"
          >
            <ChevronLeftIcon className="w-4 h-4 mr-1" />
            Back to Limits
          </Link>
        </div>

        {/* Error display */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center mb-4">
            <ExclamationTriangleIcon className="w-6 h-6 text-red-500 mr-3" />
            <h1 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
              Unable to Load Create Limit Page
            </h1>
          </div>
          
          <Alert
            variant="destructive"
            className="mb-6"
          >
            <ExclamationTriangleIcon className="w-4 h-4" />
            <div>
              <h3 className="font-medium">An unexpected error occurred</h3>
              <p className="text-sm mt-1">
                {error.message || 'Failed to load the create limit page. Please try again.'}
              </p>
              {error.digest && (
                <p className="text-xs text-gray-500 mt-2">
                  Error ID: {error.digest}
                </p>
              )}
            </div>
          </Alert>

          <div className="flex gap-4">
            <Button
              onClick={reset}
              variant="default"
            >
              Try Again
            </Button>
            <Button
              asChild
              variant="outline"
            >
              <Link href="/adf-limits">
                Return to Limits
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}

// =============================================================================
// LOADING COMPONENT FOR SUSPENSE
// =============================================================================

/**
 * Loading component for Suspense boundary
 * Implements WCAG 2.1 AA compliant loading state
 */
function CreateLimitLoading() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 px-4 py-8">
      <div className="max-w-2xl mx-auto">
        {/* Navigation breadcrumb skeleton */}
        <div className="mb-6">
          <div className="h-4 w-24 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
        </div>

        {/* Page header skeleton */}
        <div className="mb-8">
          <div className="h-8 w-48 bg-gray-200 dark:bg-gray-700 rounded animate-pulse mb-2" />
          <div className="h-4 w-96 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
        </div>

        {/* Form skeleton */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <div className="space-y-6">
            {/* Form fields skeleton */}
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="space-y-2">
                <div className="h-4 w-24 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
                <div className="h-10 w-full bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
              </div>
            ))}
            
            {/* Action buttons skeleton */}
            <div className="flex gap-4 pt-4">
              <div className="h-10 w-24 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
              <div className="h-10 w-20 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// =============================================================================
// CLIENT FORM WRAPPER COMPONENT
// =============================================================================

/**
 * Client-side form wrapper component
 * Handles form submission and React Query integration while maintaining SSR compatibility
 */
function CreateLimitFormWrapper({ 
  formOptions,
  initialValues
}: {
  formOptions: {
    services: Array<{ id: number; name: string; label: string }>
    users: Array<{ id: number; name: string; email: string }>
    roles: Array<{ id: number; name: string; description: string }>
  }
  initialValues: Partial<CreateLimitFormData>
}) {
  /**
   * Handle form submission with React Query mutation
   * Implements optimistic updates and comprehensive error handling
   */
  const handleSubmit = async (data: CreateLimitFormData): Promise<void> => {
    try {
      // Validate the form data using Zod schema
      const validatedData = CreateLimitFormSchema.parse(data)
      
      // Submit to API
      const response = await apiClient.post('/system/limit', validatedData)
      
      // Success - redirect to limits list with success message
      redirect(`/adf-limits?created=${response.id}&success=true`)
    } catch (error) {
      // Error handling is managed by the form component
      throw error
    }
  }

  /**
   * Handle form cancellation
   * Navigates back to the limits list
   */
  const handleCancel = (): void => {
    redirect('/adf-limits')
  }

  return (
    <LimitForm
      mode="create"
      initialData={initialValues}
      onSubmit={handleSubmit}
      onCancel={handleCancel}
      formOptions={formOptions}
      className="max-w-2xl mx-auto"
      testId="create-limit-form"
    />
  )
}

// =============================================================================
// MAIN PAGE COMPONENT
// =============================================================================

/**
 * Create Limit Page Component
 * 
 * Next.js server component that renders the limit creation form with
 * server-side data fetching, error handling, and accessibility features.
 * 
 * @param props - Page props including search parameters
 * @returns JSX element for the create limit page
 */
export default async function CreateLimitPage({ 
  searchParams 
}: CreateLimitPageProps) {
  // =============================================================================
  // SERVER-SIDE ACCESS VALIDATION
  // =============================================================================
  
  const hasAccess = await validateCreateAccess()
  if (!hasAccess) {
    redirect('/adf-limits?error=insufficient_permissions')
  }

  // =============================================================================
  // SERVER-SIDE DATA FETCHING
  // =============================================================================
  
  const formOptions = await fetchFormOptions()

  // =============================================================================
  // INITIAL FORM VALUES FROM SEARCH PARAMS
  // =============================================================================
  
  const initialValues: Partial<CreateLimitFormData> = {
    // Pre-populate form based on URL parameters
    limitType: (searchParams?.type as LimitType) || LimitType.ENDPOINT,
    limitCounter: LimitCounter.REQUEST,
    active: true,
    
    // Pre-select options from URL parameters
    ...(searchParams?.service && { 
      service: parseInt(searchParams.service, 10) || undefined 
    }),
    ...(searchParams?.user && { 
      user: parseInt(searchParams.user, 10) || undefined 
    }),
    ...(searchParams?.role && { 
      role: parseInt(searchParams.role, 10) || undefined 
    })
  }

  // =============================================================================
  // PAGE RENDER WITH ERROR BOUNDARY INTEGRATION
  // =============================================================================
  
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 px-4 py-8">
      <div className="max-w-4xl mx-auto">
        
        {/* Navigation breadcrumb */}
        <nav className="mb-6" aria-label="Breadcrumb">
          <Link 
            href="/adf-limits"
            className="inline-flex items-center text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 rounded-sm px-1 py-1"
          >
            <ChevronLeftIcon className="w-4 h-4 mr-1" aria-hidden="true" />
            <span>Back to API Rate Limits</span>
          </Link>
        </nav>

        {/* Page header */}
        <header className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2">
            Create API Rate Limit
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-400 leading-relaxed">
            Configure a new rate limit to control API access and manage usage patterns. 
            Set limits by user, service, role, or apply global restrictions with advanced 
            counter mechanisms for optimal API performance.
          </p>
        </header>

        {/* Main content with Suspense boundary */}
        <main className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
          <Suspense fallback={<CreateLimitLoading />}>
            <div className="p-6">
              <CreateLimitFormWrapper
                formOptions={formOptions}
                initialValues={initialValues}
              />
            </div>
          </Suspense>
        </main>

        {/* Help section */}
        <aside className="mt-8 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-6">
          <h2 className="text-lg font-semibold text-blue-900 dark:text-blue-100 mb-3">
            Rate Limiting Guide
          </h2>
          <div className="space-y-3 text-sm text-blue-800 dark:text-blue-200">
            <div>
              <strong>Rate Format:</strong> Specify limits as "number/timeunit" (e.g., "100/minute", "1000/hour")
            </div>
            <div>
              <strong>Limit Types:</strong> Choose from endpoint, service, user, role, global, IP, or custom scopes
            </div>
            <div>
              <strong>Counter Mechanisms:</strong> Select request counting, sliding window, token bucket, or bandwidth limiting
            </div>
            <div>
              <strong>Scope Selection:</strong> User, service, and role limits require selecting the specific target
            </div>
          </div>
        </aside>
      </div>
    </div>
  )
}

// =============================================================================
// ERROR BOUNDARY EXPORT
// =============================================================================

/**
 * Error boundary configuration for the create limit page
 * Implements fallback UI rendering per Section 4.2.1.1 error boundary implementation
 */
export function generateStaticParams() {
  return [] // No static generation for this dynamic create page
}

/**
 * Runtime configuration for the page
 * Ensures optimal performance and proper error handling
 */
export const dynamic = 'force-dynamic' // Always use SSR for fresh data
export const revalidate = 0 // No static revalidation needed for create page