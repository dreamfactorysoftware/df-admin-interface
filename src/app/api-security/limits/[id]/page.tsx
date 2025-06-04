/**
 * API Security Limits Edit Page
 * 
 * Next.js dynamic page component for editing existing API rate limits using React Hook Form
 * with Zod schema validation, SWR for data fetching and optimistic updates, and Tailwind CSS
 * styling with Headless UI components. Replaces Angular df-limit-details component edit mode
 * with React/Next.js SSR-compatible implementation.
 * 
 * Features:
 * - React Hook Form with Zod schema validators for real-time validation under 100ms
 * - SWR/React Query for intelligent caching with cache hit responses under 50ms
 * - Next.js server components for initial page loads with SSR pages under 2 seconds
 * - Tailwind CSS 4.1+ with consistent theme injection across components
 * - WCAG 2.1 AA compliance maintained through Headless UI integration
 * - Next.js middleware for authentication and security rule evaluation
 * - Dynamic routing parameter extraction using Next.js app router conventions
 * - Comprehensive error handling with automatic fallback to list view
 * - Next.js metadata API integration for SEO optimization in edit workflows
 * 
 * @author DreamFactory Admin Interface Team
 * @version React 19/Next.js 15.1 Migration
 * @since 2024-12-19
 */

import React, { Suspense } from 'react'
import { Metadata } from 'next'
import { notFound, redirect } from 'next/navigation'
import dynamic from 'next/dynamic'

// Client component import for dynamic rendering
const LimitEditClient = dynamic(() => import('./limit-edit-client'), {
  loading: () => <LimitEditLoadingSkeleton />,
  ssr: false
})

// =============================================================================
// TYPES AND INTERFACES
// =============================================================================

/**
 * Page component props with Next.js routing parameters
 */
interface LimitEditPageProps {
  params: {
    id: string
  }
  searchParams?: {
    [key: string]: string | string[] | undefined
  }
}

/**
 * Parsed limit ID with validation
 */
interface ValidatedLimitId {
  id: number
  isValid: boolean
  error?: string
}

// =============================================================================
// SERVER-SIDE UTILITIES
// =============================================================================

/**
 * Validate and parse the limit ID parameter
 * 
 * @param idParam - The ID parameter from the URL
 * @returns Validated limit ID object
 */
function validateLimitId(idParam: string): ValidatedLimitId {
  // Check if ID is numeric
  const numericId = parseInt(idParam, 10)
  
  if (isNaN(numericId)) {
    return {
      id: 0,
      isValid: false,
      error: 'Invalid limit ID format. ID must be a number.'
    }
  }
  
  // Check if ID is positive
  if (numericId <= 0) {
    return {
      id: numericId,
      isValid: false,
      error: 'Invalid limit ID. ID must be a positive number.'
    }
  }
  
  // Check reasonable bounds (assuming max 10 million limits)
  if (numericId > 10000000) {
    return {
      id: numericId,
      isValid: false,
      error: 'Invalid limit ID. ID exceeds maximum allowed value.'
    }
  }
  
  return {
    id: numericId,
    isValid: true
  }
}

/**
 * Server-side limit existence check (if available)
 * This would typically call the API server-side, but for now we'll validate client-side
 * 
 * @param limitId - The validated limit ID
 * @returns Whether the limit exists
 */
async function checkLimitExists(limitId: number): Promise<boolean> {
  // In a real implementation, this would make a server-side API call
  // For now, we'll defer this check to the client component
  // This maintains SSR performance while ensuring data accuracy
  return true
}

// =============================================================================
// LOADING SKELETON COMPONENT
// =============================================================================

/**
 * Loading skeleton component for the limit edit page
 * Provides immediate visual feedback while the dynamic component loads
 */
function LimitEditLoadingSkeleton() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header skeleton */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="space-y-2">
              <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-32 animate-pulse"></div>
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-64 animate-pulse"></div>
            </div>
            <div className="flex space-x-3">
              <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded w-20 animate-pulse"></div>
              <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded w-24 animate-pulse"></div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Navigation skeleton */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex space-x-4 mb-6">
          <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded w-32 animate-pulse"></div>
          <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded w-24 animate-pulse"></div>
        </div>
        
        {/* Form skeleton */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <div className="space-y-6">
            {/* Form title */}
            <div className="border-b border-gray-200 dark:border-gray-700 pb-4">
              <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-48 animate-pulse mb-2"></div>
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-96 animate-pulse"></div>
            </div>
            
            {/* Form fields */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {[...Array(6)].map((_, index) => (
                <div key={index} className="space-y-2">
                  <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-24 animate-pulse"></div>
                  <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded w-full animate-pulse"></div>
                </div>
              ))}
            </div>
            
            {/* Form actions */}
            <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200 dark:border-gray-700">
              <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded w-20 animate-pulse"></div>
              <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded w-32 animate-pulse"></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// =============================================================================
// METADATA GENERATION
// =============================================================================

/**
 * Generate dynamic metadata for the limit edit page
 * Provides SEO optimization for limit editing workflows
 * 
 * @param props - Page props with routing parameters
 * @returns Metadata object for Next.js
 */
export async function generateMetadata(
  { params }: LimitEditPageProps
): Promise<Metadata> {
  const validatedId = validateLimitId(params.id)
  
  if (!validatedId.isValid) {
    return {
      title: 'Invalid Limit ID | API Security | DreamFactory Admin',
      description: 'The specified rate limit ID is invalid.',
      robots: {
        index: false,
        follow: false
      }
    }
  }
  
  // In a real implementation, we might fetch the limit name for the title
  // For now, we'll use the ID in the title
  const limitId = validatedId.id
  
  return {
    title: `Edit Rate Limit #${limitId} | API Security | DreamFactory Admin`,
    description: `Configure and manage rate limit settings for limit #${limitId}. Control API request rates, set user and service-specific limits, and monitor usage patterns.`,
    keywords: [
      'rate limiting',
      'API security',
      'request throttling',
      'DreamFactory',
      'admin interface',
      'edit limit',
      `limit ${limitId}`
    ],
    openGraph: {
      title: `Edit Rate Limit #${limitId} | DreamFactory Admin`,
      description: `Configure rate limit settings for limit #${limitId}`,
      type: 'website',
      siteName: 'DreamFactory Admin Interface'
    },
    twitter: {
      card: 'summary',
      title: `Edit Rate Limit #${limitId} | DreamFactory Admin`,
      description: `Configure rate limit settings for limit #${limitId}`
    },
    robots: {
      index: false, // Don't index admin pages
      follow: false
    }
  }
}

// =============================================================================
// MAIN PAGE COMPONENT
// =============================================================================

/**
 * Main page component for editing API rate limits
 * 
 * Implements Next.js app router patterns with dynamic routing, SSR optimization,
 * and comprehensive error handling. Validates route parameters server-side before
 * rendering the client component for optimal performance and user experience.
 * 
 * @param props - Page props with routing parameters
 * @returns JSX element for the limit edit page
 */
export default async function LimitEditPage({ 
  params, 
  searchParams 
}: LimitEditPageProps) {
  // ==========================================================================
  // SERVER-SIDE VALIDATION
  // ==========================================================================
  
  // Validate the limit ID parameter
  const validatedId = validateLimitId(params.id)
  
  if (!validatedId.isValid) {
    // Invalid ID format - redirect to limits list with error message
    redirect(`/api-security/limits?error=invalid-id&message=${encodeURIComponent(validatedId.error || 'Invalid limit ID')}`)
  }
  
  const limitId = validatedId.id
  
  // Optional: Check if limit exists (server-side optimization)
  // This would require API access from the server component
  // For now, we'll let the client component handle existence checking
  const limitExists = await checkLimitExists(limitId)
  
  if (!limitExists) {
    // Limit doesn't exist - return 404
    notFound()
  }
  
  // ==========================================================================
  // SEARCH PARAMS PROCESSING
  // ==========================================================================
  
  // Extract any additional parameters for the edit context
  const editContext = {
    returnUrl: searchParams?.return as string | undefined,
    mode: searchParams?.mode as string | undefined,
    highlight: searchParams?.highlight as string | undefined,
  }
  
  // ==========================================================================
  // PAGE RENDERING
  // ==========================================================================
  
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* 
        Suspense boundary for the client component
        Provides loading state while dynamic component loads
      */}
      <Suspense fallback={<LimitEditLoadingSkeleton />}>
        <LimitEditClient 
          limitId={limitId}
          editContext={editContext}
        />
      </Suspense>
    </div>
  )
}

// =============================================================================
// ROUTE SEGMENT CONFIG
// =============================================================================

/**
 * Route segment configuration for Next.js app router
 * Optimizes caching and rendering behavior for the edit page
 */
export const dynamic = 'force-dynamic' // Always render server-side for fresh data
export const revalidate = 0 // Don't cache this page
export const runtime = 'nodejs' // Use Node.js runtime for server features

// =============================================================================
// ERROR BOUNDARY EXPORTS
// =============================================================================

/**
 * Export error boundary component for route-level error handling
 * Provides graceful fallback when the page component fails
 */
export function ErrorBoundary({ error, reset }: { error: Error; reset: () => void }) {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
      <div className="max-w-md w-full bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <div className="text-center">
          <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100 dark:bg-red-900 mb-4">
            <svg 
              className="h-6 w-6 text-red-600 dark:text-red-400" 
              fill="none" 
              viewBox="0 0 24 24" 
              stroke="currentColor"
            >
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth={2} 
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.962-.833-2.732 0L3.262 16.5c-.77.833.192 2.5 1.732 2.5z" 
              />
            </svg>
          </div>
          
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
            Unable to Load Limit Editor
          </h2>
          
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
            {error.message || 'An unexpected error occurred while loading the rate limit editor.'}
          </p>
          
          <div className="flex flex-col sm:flex-row gap-3">
            <button
              onClick={reset}
              className="flex-1 bg-primary-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 transition-colors"
            >
              Try Again
            </button>
            
            <a
              href="/api-security/limits"
              className="flex-1 bg-gray-100 text-gray-900 px-4 py-2 rounded-md text-sm font-medium hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-colors dark:bg-gray-700 dark:text-gray-100 dark:hover:bg-gray-600 text-center"
            >
              Back to Limits
            </a>
          </div>
        </div>
      </div>
    </div>
  )
}

/**
 * Not found boundary for invalid limit IDs
 * Provides user-friendly 404 page when limit doesn't exist
 */
export function NotFound() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
      <div className="max-w-md w-full bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <div className="text-center">
          <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-yellow-100 dark:bg-yellow-900 mb-4">
            <svg 
              className="h-6 w-6 text-yellow-600 dark:text-yellow-400" 
              fill="none" 
              viewBox="0 0 24 24" 
              stroke="currentColor"
            >
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth={2} 
                d="M9.172 16.172a4 4 0 015.656 0M9 12h6m-3-8a8 8 0 100 16 8 8 0 000-16z" 
              />
            </svg>
          </div>
          
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
            Rate Limit Not Found
          </h2>
          
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
            The requested rate limit could not be found. It may have been deleted or the ID may be incorrect.
          </p>
          
          <a
            href="/api-security/limits"
            className="w-full bg-primary-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 transition-colors inline-block text-center"
          >
            View All Limits
          </a>
        </div>
      </div>
    </div>
  )
}