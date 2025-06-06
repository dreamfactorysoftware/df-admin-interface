/**
 * Global Lookup Keys Configuration Page
 * 
 * Next.js app router page component for global lookup keys configuration management,
 * implementing server-side rendering with React 19 server components for initial page load.
 * Provides comprehensive interface for viewing, adding, editing, and saving global lookup key
 * entries with form validation, unique name constraints, and real-time updates using SWR
 * for intelligent caching.
 * 
 * Transforms Angular DfGlobalLookupKeysComponent to React server component with SSR capability
 * per React/Next.js Integration Requirements. Migrates from Angular Material UI to Headless UI
 * with Tailwind CSS styling per Section 7.1 Core UI Technologies.
 * 
 * @fileoverview Global lookup keys page component
 * @version 1.0.0
 * @since React 19.0.0 / Next.js 15.1+
 */

import { Suspense } from 'react';
import { Metadata } from 'next';
import { Key, AlertCircle, HelpCircle } from 'lucide-react';
import { GlobalLookupKeysClient } from './client';

// ============================================================================
// Metadata for SSR and SEO
// ============================================================================

export const metadata: Metadata = {
  title: 'Global Lookup Keys | DreamFactory Admin',
  description: 'Manage global lookup keys that can be referenced throughout your API endpoints. Configure key-value pairs for consistent data access across your DreamFactory services.',
  keywords: ['lookup keys', 'configuration', 'DreamFactory', 'API management', 'global variables'],
  robots: {
    index: true,
    follow: true,
  },
  openGraph: {
    title: 'Global Lookup Keys Configuration',
    description: 'Manage global lookup keys for your DreamFactory instance',
    type: 'website',
  },
};

// ============================================================================
// Server Component: Loading Skeleton
// ============================================================================

/**
 * Loading skeleton component for lookup keys table
 */
function LookupKeysLoadingSkeleton() {
  return (
    <div className="space-y-6" aria-label="Loading lookup keys configuration">
      {/* Header skeleton */}
      <div className="animate-pulse">
        <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/3 mb-2"></div>
        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-2/3"></div>
      </div>

      {/* Description skeleton */}
      <div className="animate-pulse space-y-2">
        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-full"></div>
        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
      </div>

      {/* Table skeleton */}
      <div className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
        <div className="bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 p-4">
          <div className="grid grid-cols-12 gap-4">
            <div className="col-span-3">
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-16 animate-pulse"></div>
            </div>
            <div className="col-span-4">
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-12 animate-pulse"></div>
            </div>
            <div className="col-span-2">
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-16 animate-pulse"></div>
            </div>
            <div className="col-span-2">
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-14 animate-pulse"></div>
            </div>
            <div className="col-span-1"></div>
          </div>
        </div>
        
        {/* Skeleton rows */}
        {Array.from({ length: 3 }).map((_, index) => (
          <div key={index} className="border-b border-gray-200 dark:border-gray-700 last:border-b-0 p-4">
            <div className="grid grid-cols-12 gap-4">
              <div className="col-span-3">
                <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
              </div>
              <div className="col-span-4">
                <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
              </div>
              <div className="col-span-2">
                <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
              </div>
              <div className="col-span-2">
                <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
              </div>
              <div className="col-span-1">
                <div className="h-8 w-8 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ============================================================================
// Server Component: Error Boundary
// ============================================================================

/**
 * Error boundary component for graceful error handling
 */
function LookupKeysErrorBoundary({ 
  error, 
  reset 
}: { 
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="max-w-2xl mx-auto text-center py-12">
      <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-6">
        <AlertCircle className="mx-auto h-12 w-12 text-red-500 mb-4" />
        <h2 className="text-lg font-semibold text-red-900 dark:text-red-100 mb-2">
          Failed to Load Lookup Keys
        </h2>
        <p className="text-red-700 dark:text-red-300 mb-4">
          {error.message || 'An unexpected error occurred while loading the lookup keys configuration.'}
        </p>
        <button
          onClick={reset}
          className="inline-flex items-center px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 transition-colors"
        >
          Try Again
        </button>
      </div>
    </div>
  );
}

// ============================================================================
// Server Component: Page Header
// ============================================================================

/**
 * Page header component with title and description
 */
function PageHeader() {
  return (
    <div className="mb-8">
      <div className="flex items-center space-x-3 mb-4">
        <div className="flex-shrink-0">
          <div className="flex items-center justify-center w-10 h-10 bg-primary-100 dark:bg-primary-900/30 rounded-lg">
            <Key className="w-6 h-6 text-primary-600 dark:text-primary-400" />
          </div>
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            Global Lookup Keys
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Configure key-value pairs accessible across all API endpoints
          </p>
        </div>
      </div>

      {/* Information panel */}
      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
        <div className="flex items-start space-x-3">
          <HelpCircle className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-blue-800 dark:text-blue-200">
            <p className="font-medium mb-2">About Global Lookup Keys:</p>
            <ul className="space-y-1 list-disc list-inside text-blue-700 dark:text-blue-300">
              <li>
                <strong>Global Access:</strong> Available throughout your DreamFactory instance via the{' '}
                <code className="px-1.5 py-0.5 bg-blue-100 dark:bg-blue-800 rounded text-xs font-mono">
                  lookup(&apos;key_name&apos;)
                </code>{' '}
                function
              </li>
              <li>
                <strong>Use Cases:</strong> API keys, configuration values, constants, and environment-specific settings
              </li>
              <li>
                <strong>Privacy:</strong> Keys marked as private are hidden from API documentation but remain accessible to your applications
              </li>
              <li>
                <strong>Validation:</strong> Key names must be unique and follow naming conventions (letters, numbers, underscores only)
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// Main Server Component: Page Implementation
// ============================================================================

/**
 * Global Lookup Keys Configuration Page
 * 
 * Server-side rendered page component that provides the initial HTML for fast loading,
 * then hydrates with interactive client components. Implements SSR under 2 seconds
 * per React/Next.js Integration Requirements.
 * 
 * Features:
 * - Server-side rendering for initial page load
 * - Progressive enhancement with client-side interactivity
 * - Comprehensive error handling and loading states
 * - Accessible design with ARIA labels and keyboard navigation
 * - Responsive layout optimized for all screen sizes
 */
export default async function GlobalLookupKeysPage() {
  // Server-side component - no hooks or client-side logic here
  // All data fetching and state management is handled by client components
  
  return (
    <div className="container mx-auto px-4 py-6 max-w-7xl">
      {/* Page header with static content for SSR */}
      <PageHeader />

      {/* Client component wrapper with Suspense boundary */}
      <div className="space-y-6">
        <Suspense fallback={<LookupKeysLoadingSkeleton />}>
          <GlobalLookupKeysClient />
        </Suspense>
      </div>

      {/* SEO-friendly structured data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'WebPage',
            name: 'Global Lookup Keys Configuration',
            description: 'Manage global lookup keys for DreamFactory API configuration',
            url: `/adf-config/df-global-lookup-keys`,
            isPartOf: {
              '@type': 'WebSite',
              name: 'DreamFactory Admin Interface',
            },
            breadcrumb: {
              '@type': 'BreadcrumbList',
              itemListElement: [
                {
                  '@type': 'ListItem',
                  position: 1,
                  name: 'Configuration',
                  item: '/adf-config',
                },
                {
                  '@type': 'ListItem',
                  position: 2,
                  name: 'Global Lookup Keys',
                  item: '/adf-config/df-global-lookup-keys',
                },
              ],
            },
          }),
        }}
      />
    </div>
  );
}

// ============================================================================
// Performance Optimizations
// ============================================================================

/**
 * Force static rendering for parts of the page that don't change
 * This helps achieve the SSR under 2 seconds requirement
 */
export const dynamic = 'force-dynamic'; // Enable SSR for fresh data
export const revalidate = 300; // Revalidate every 5 minutes for cached responses

/**
 * Optimize fonts and reduce layout shift
 */
export const viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
};