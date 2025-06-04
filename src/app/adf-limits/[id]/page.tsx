/**
 * Edit Rate Limit Page Component for Next.js App Router
 * 
 * Next.js page component for editing existing API rate limits using dynamic route parameters.
 * Implements server-side rendering with React Query for intelligent caching, comprehensive
 * error handling, and optimistic updates. Replaces Angular df-limit-details component edit
 * mode with modern React 19 patterns and Next.js 15.1+ routing system.
 * 
 * Features:
 * - Dynamic route parameter handling via Next.js useParams
 * - SSR-compatible data fetching with React Query prefetching  
 * - Optimistic updates and error handling through React Query mutations
 * - WCAG 2.1 AA compliance through Headless UI integration
 * - Real-time validation under 100ms with React Hook Form
 * - Cache hit responses under 50ms per performance requirements
 * 
 * @author DreamFactory Admin Interface Team
 * @version React 19/Next.js 15.1 Migration
 * @since 2024-12-19
 */

import { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { Suspense } from 'react'
import { HydrationBoundary, QueryClient, dehydrate } from '@tanstack/react-query'

import { LimitForm } from '../components/limit-form'
import { LoadingSpinner } from '@/components/ui/loading-spinner'
import { Alert } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { 
  LimitTableRowData, 
  LIMITS_QUERY_KEYS,
  type EditLimitFormData 
} from '../types'
import { apiClient } from '@/lib/api-client'
import { EditLimitPageClient } from './edit-limit-client'

// =============================================================================
// PAGE PROPS AND ROUTE PARAMETERS
// =============================================================================

/**
 * Route parameters for dynamic limit ID
 */
interface PageParams {
  id: string
}

/**
 * Page props with route parameters
 */
interface EditLimitPageProps {
  params: PageParams
}

// =============================================================================
// SERVER-SIDE DATA FETCHING
// =============================================================================

/**
 * Fetches limit data on the server for SSR
 * 
 * Implements server-side data fetching with error handling for invalid IDs.
 * Ensures initial page load under 2 seconds per SSR requirements.
 */
async function fetchLimitData(id: number): Promise<LimitTableRowData | null> {
  try {
    const response = await apiClient.get(`/limits/${id}`, {
      headers: {
        'Cache-Control': 'max-age=300, stale-while-revalidate=60'
      }
    })
    
    return response as LimitTableRowData
  } catch (error) {
    console.error(`Failed to fetch limit data for ID ${id}:`, error)
    return null
  }
}

// =============================================================================
// METADATA GENERATION
// =============================================================================

/**
 * Generates dynamic metadata for SEO optimization
 * 
 * Creates page metadata based on limit name and type for enhanced SEO.
 * Implements Next.js 15.1+ metadata API patterns.
 */
export async function generateMetadata({ 
  params 
}: EditLimitPageProps): Promise<Metadata> {
  const limitId = parseInt(params.id, 10)
  
  // Validate ID format
  if (isNaN(limitId) || limitId <= 0) {
    return {
      title: 'Invalid Rate Limit - DreamFactory Admin',
      description: 'The specified rate limit ID is not valid.',
      robots: 'noindex, nofollow'
    }
  }

  try {
    const limitData = await fetchLimitData(limitId)
    
    if (!limitData) {
      return {
        title: 'Rate Limit Not Found - DreamFactory Admin',
        description: 'The specified rate limit could not be found.',
        robots: 'noindex, nofollow'
      }
    }

    const limitTypeName = limitData.limitType
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ')

    return {
      title: `Edit ${limitData.name} - ${limitTypeName} Rate Limit - DreamFactory Admin`,
      description: `Edit the ${limitData.name} ${limitTypeName.toLowerCase()} rate limit configuration. Current rate: ${limitData.limitRate} using ${limitData.limitCounter} counter.`,
      keywords: [
        'rate limit',
        'API management', 
        'DreamFactory',
        'edit limit',
        limitData.limitType,
        limitData.limitCounter
      ],
      authors: [{ name: 'DreamFactory Admin Interface Team' }],
      openGraph: {
        title: `Edit ${limitData.name} Rate Limit`,
        description: `Configure ${limitTypeName.toLowerCase()} rate limit: ${limitData.limitRate}`,
        type: 'website',
        siteName: 'DreamFactory Admin Interface'
      },
      alternates: {
        canonical: `/adf-limits/${limitId}`
      }
    }
  } catch (error) {
    console.error('Error generating metadata:', error)
    
    return {
      title: 'Edit Rate Limit - DreamFactory Admin',
      description: 'Edit API rate limit configuration in DreamFactory Admin Interface.',
      robots: 'noindex, nofollow'
    }
  }
}

// =============================================================================
// SERVER COMPONENT ERROR BOUNDARY
// =============================================================================

/**
 * Error display component for server-side errors
 */
function ServerErrorDisplay({ 
  error, 
  limitId 
}: { 
  error: string
  limitId: number 
}) {
  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="mb-6">
        <Button 
          variant="outline" 
          onClick={() => window.history.back()}
          className="mb-4"
        >
          ← Back to Limits
        </Button>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
          Edit Rate Limit
        </h1>
      </div>
      
      <Alert
        variant="destructive"
        title="Failed to Load Rate Limit"
        className="mb-6"
      >
        <p className="mb-4">{error}</p>
        <div className="flex flex-col sm:flex-row gap-3">
          <Button 
            variant="outline"
            onClick={() => window.location.reload()}
          >
            Try Again
          </Button>
          <Button 
            variant="outline"
            onClick={() => window.history.back()}
          >
            Go Back
          </Button>
        </div>
      </Alert>
    </div>
  )
}

// =============================================================================
// MAIN PAGE COMPONENT
// =============================================================================

/**
 * Edit Rate Limit Page - Server Component
 * 
 * Main server component that handles SSR data fetching, validation, and
 * renders the client component with hydrated data. Implements comprehensive
 * error handling and loading states per React/Next.js Integration Requirements.
 * 
 * @param params - Dynamic route parameters containing limit ID
 */
export default async function EditLimitPage({ params }: EditLimitPageProps) {
  // Validate and parse limit ID
  const limitId = parseInt(params.id, 10)
  
  if (isNaN(limitId) || limitId <= 0) {
    return (
      <ServerErrorDisplay
        error={`Invalid rate limit ID: "${params.id}". Please provide a valid numeric ID.`}
        limitId={limitId}
      />
    )
  }

  // Create query client for SSR prefetching
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 120000, // 2 minutes for detailed view
        cacheTime: 600000, // 10 minutes cache time
        retry: 2,
        refetchOnWindowFocus: true
      }
    }
  })

  try {
    // Prefetch limit data for SSR with performance optimization
    await queryClient.prefetchQuery({
      queryKey: LIMITS_QUERY_KEYS.detail(limitId),
      queryFn: () => fetchLimitData(limitId),
      staleTime: 120000
    })

    const limitData = queryClient.getQueryData<LimitTableRowData>(
      LIMITS_QUERY_KEYS.detail(limitId)
    )

    // Handle not found case
    if (!limitData) {
      notFound()
    }

    // Prefetch related data for form dropdowns (optional, improves UX)
    try {
      await Promise.allSettled([
        // Prefetch services for service-type limits
        limitData.limitType === 'SERVICE' && queryClient.prefetchQuery({
          queryKey: ['services', 'list'],
          queryFn: () => apiClient.get('/services'),
          staleTime: 300000
        }),
        // Prefetch users for user-type limits  
        limitData.limitType === 'USER' && queryClient.prefetchQuery({
          queryKey: ['users', 'list'],
          queryFn: () => apiClient.get('/users'),
          staleTime: 300000
        }),
        // Prefetch roles for role-type limits
        limitData.limitType === 'ROLE' && queryClient.prefetchQuery({
          queryKey: ['roles', 'list'], 
          queryFn: () => apiClient.get('/roles'),
          staleTime: 300000
        })
      ])
    } catch (prefetchError) {
      // Non-critical prefetch errors - log but don't fail page load
      console.warn('Non-critical prefetch error:', prefetchError)
    }

    // Render page with hydrated query client
    return (
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <HydrationBoundary state={dehydrate(queryClient)}>
          <Suspense 
            fallback={
              <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
                <LoadingSpinner size="lg" />
                <p className="text-gray-600 dark:text-gray-400">
                  Loading rate limit configuration...
                </p>
              </div>
            }
          >
            <EditLimitPageClient limitId={limitId} />
          </Suspense>
        </HydrationBoundary>
      </div>
    )

  } catch (error) {
    console.error('Server-side error fetching limit data:', error)
    
    return (
      <ServerErrorDisplay
        error={`Failed to load rate limit with ID ${limitId}. The limit may not exist or there was a server error.`}
        limitId={limitId}
      />
    )
  }
}

// =============================================================================
// STATIC GENERATION CONFIGURATION
// =============================================================================

/**
 * Configure dynamic route generation
 * 
 * Enables dynamic routes while maintaining performance through ISR.
 * Implements Next.js 15.1+ static generation patterns.
 */
export const dynamic = 'force-dynamic' // Always SSR for real-time data
export const revalidate = 300 // Revalidate every 5 minutes for ISR caching

// =============================================================================
// ERROR HANDLING FOR PRODUCTION
// =============================================================================

/**
 * Global error boundary for the page
 * 
 * Catches and handles any unhandled errors in the page component tree.
 * Provides graceful degradation and user-friendly error messages.
 */
export function generateStaticParams() {
  // Return empty array to enable dynamic generation
  // Limits are created dynamically so we can't pre-generate
  return []
}

/**
 * Not Found Page Handler
 * 
 * Custom not found handling for invalid limit IDs.
 * Provides user-friendly messaging and navigation options.
 */
export function NotFound() {
  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="text-center space-y-6">
        <div className="space-y-2">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-gray-100">
            404
          </h1>
          <h2 className="text-xl font-semibold text-gray-700 dark:text-gray-300">
            Rate Limit Not Found
          </h2>
          <p className="text-gray-600 dark:text-gray-400 max-w-md mx-auto">
            The rate limit you're looking for doesn't exist or may have been removed.
          </p>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Button 
            variant="default"
            onClick={() => window.location.href = '/adf-limits'}
          >
            View All Limits
          </Button>
          <Button 
            variant="outline"
            onClick={() => window.history.back()}
          >
            Go Back
          </Button>
        </div>
      </div>
    </div>
  )
}