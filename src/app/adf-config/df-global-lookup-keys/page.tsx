/**
 * Global Lookup Keys Configuration Page
 * 
 * Next.js app router page component for global lookup keys configuration management,
 * implementing server-side rendering with React 19 server components for initial page load.
 * Provides comprehensive interface for viewing, adding, editing, and saving global lookup 
 * key entries with form validation, unique name constraints, and real-time updates using 
 * SWR for intelligent caching.
 * 
 * This component transforms the Angular DfGlobalLookupKeysComponent to React server component
 * with SSR capability, migrating from Angular Material UI to Headless UI with Tailwind CSS
 * styling per Section 7.1 Core UI Technologies requirements.
 * 
 * Features:
 * - Next.js server components for initial page loads with SSR under 2 seconds
 * - React Hook Form integration for lookup keys form management
 * - SWR/React Query hooks for lookup key operations with cache hits under 50ms
 * - Real-time validation under 100ms using Zod schema validators
 * - WCAG 2.1 AA accessibility compliance with proper ARIA labels
 * - Dark theme support with consistent Tailwind CSS styling
 * - Optimistic updates with automatic rollback on failure
 * - Comprehensive error handling and loading states
 * 
 * Performance Requirements:
 * - SSR pages under 2 seconds per React/Next.js Integration Requirements
 * - Real-time validation under 100ms per React/Next.js Integration Requirements
 * - Cache hit responses under 50ms per React/Next.js Integration Requirements
 * 
 * @author DreamFactory Admin Interface Team
 * @version React 19/Next.js 15.1 Migration
 */

import { Suspense } from 'react';
import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import GlobalLookupKeysClient from './client';

// Metadata for SEO and accessibility
export const metadata: Metadata = {
  title: 'Global Lookup Keys - DreamFactory Admin',
  description: 'Configure global lookup keys that provide consistent configuration values across all DreamFactory services and APIs.',
  keywords: ['dreamfactory', 'lookup keys', 'configuration', 'api management', 'global settings'],
  openGraph: {
    title: 'Global Lookup Keys Configuration',
    description: 'Manage global lookup key-value pairs for consistent API configuration.',
    type: 'website',
  },
  robots: {
    index: false, // Admin interface should not be indexed
    follow: false,
  },
};

/**
 * Server Component for initial data loading and SEO optimization
 * 
 * This server component provides initial page structure and metadata while delegating
 * interactive functionality to the client component for optimal performance and SEO.
 */
export default async function GlobalLookupKeysPage() {
  // Server-side validation and error handling
  try {
    // Verify environment configuration for API access
    const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || '/api/v2';
    const systemApiUrl = process.env.NEXT_PUBLIC_SYSTEM_API_URL || '/system/api/v2';
    
    if (!apiBaseUrl || !systemApiUrl) {
      console.error('Missing required API configuration');
      notFound();
    }

    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        {/* Page Header */}
        <div className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="py-6">
              <div className="md:flex md:items-center md:justify-between">
                <div className="flex-1 min-w-0">
                  <h1 className="text-2xl font-bold leading-7 text-gray-900 dark:text-gray-100 sm:text-3xl sm:truncate">
                    Global Lookup Keys
                  </h1>
                  <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                    Define global lookup keys that can be referenced throughout your APIs. 
                    These key-value pairs provide consistent configuration values across all services.
                  </p>
                </div>
                <div className="mt-4 flex md:mt-0 md:ml-4">
                  <nav aria-label="Breadcrumb">
                    <ol className="flex items-center space-x-2 text-sm text-gray-500 dark:text-gray-400">
                      <li>
                        <span className="hover:text-gray-700 dark:hover:text-gray-300">
                          System Settings
                        </span>
                      </li>
                      <li>
                        <span className="mx-2">/</span>
                      </li>
                      <li aria-current="page">
                        <span className="text-gray-900 dark:text-gray-100 font-medium">
                          Global Lookup Keys
                        </span>
                      </li>
                    </ol>
                  </nav>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="bg-white dark:bg-gray-800 shadow-sm rounded-lg border border-gray-200 dark:border-gray-700">
            <div className="px-4 py-5 sm:p-6">
              {/* Documentation Section */}
              <div className="mb-6 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <svg 
                      className="h-5 w-5 text-blue-400 dark:text-blue-300" 
                      viewBox="0 0 20 20" 
                      fill="currentColor"
                      aria-hidden="true"
                    >
                      <path 
                        fillRule="evenodd" 
                        d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" 
                        clipRule="evenodd" 
                      />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-blue-800 dark:text-blue-200">
                      About Global Lookup Keys
                    </h3>
                    <div className="mt-2 text-sm text-blue-700 dark:text-blue-300">
                      <p className="mb-2">
                        Global lookup keys are system-wide key-value pairs that can be referenced 
                        in your API configurations, scripts, and service definitions. They provide 
                        a centralized way to manage configuration values that need to be consistent 
                        across multiple services.
                      </p>
                      <ul className="list-disc list-inside space-y-1">
                        <li>
                          Use alphanumeric characters, underscores, and hyphens for key names
                        </li>
                        <li>
                          Mark sensitive values as "Private" to hide them from API responses
                        </li>
                        <li>
                          Keys can be referenced in service configurations using {'{lookup.key_name}'}
                        </li>
                        <li>
                          Changes to lookup keys require service restarts to take effect
                        </li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>

              {/* Loading Boundary for Client Component */}
              <Suspense fallback={<GlobalLookupKeysLoadingFallback />}>
                <GlobalLookupKeysClient />
              </Suspense>
            </div>
          </div>
        </main>

        {/* Footer for context and help */}
        <footer className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
            <p className="text-xs text-gray-500 dark:text-gray-400 text-center">
              Need help with lookup keys? 
              <a 
                href="https://wiki.dreamfactory.com/DreamFactory/Tutorials/Configuration#Global_Lookup_Keys" 
                target="_blank" 
                rel="noopener noreferrer"
                className="ml-1 text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 underline"
              >
                View documentation
              </a>
            </p>
          </div>
        </footer>
      </div>
    );
  } catch (error) {
    console.error('Failed to render Global Lookup Keys page:', error);
    
    // Error boundary fallback
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="max-w-md w-full bg-white dark:bg-gray-800 shadow-lg rounded-lg p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <svg 
                className="h-6 w-6 text-red-400" 
                viewBox="0 0 20 20" 
                fill="currentColor"
                aria-hidden="true"
              >
                <path 
                  fillRule="evenodd" 
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" 
                  clipRule="evenodd" 
                />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100">
                Configuration Error
              </h3>
              <div className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                <p>
                  Unable to load the Global Lookup Keys page. Please check your 
                  system configuration and try again.
                </p>
              </div>
              <div className="mt-4">
                <button
                  onClick={() => window.location.reload()}
                  className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                >
                  Retry
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }
}

/**
 * Loading fallback component for Suspense boundary
 * 
 * Provides accessible loading state while the client component loads and
 * initial data is being fetched from the API.
 */
function GlobalLookupKeysLoadingFallback() {
  return (
    <div 
      className="space-y-6 animate-pulse"
      role="status"
      aria-label="Loading global lookup keys configuration"
    >
      {/* Table Header Skeleton */}
      <div className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
        <div className="bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
          <div className="grid grid-cols-12 gap-4 p-4">
            <div className="col-span-4">
              <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded"></div>
            </div>
            <div className="col-span-4">
              <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded"></div>
            </div>
            <div className="col-span-2">
              <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded"></div>
            </div>
            <div className="col-span-2 flex justify-end">
              <div className="h-8 w-8 bg-gray-300 dark:bg-gray-600 rounded"></div>
            </div>
          </div>
        </div>

        {/* Table Body Skeleton */}
        <div className="divide-y divide-gray-200 dark:divide-gray-700">
          {[...Array(3)].map((_, index) => (
            <div 
              key={index}
              className="grid grid-cols-12 gap-4 p-4"
            >
              <div className="col-span-4">
                <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded"></div>
              </div>
              <div className="col-span-4">
                <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded"></div>
              </div>
              <div className="col-span-2 flex items-center">
                <div className="h-6 w-10 bg-gray-200 dark:bg-gray-700 rounded-full"></div>
              </div>
              <div className="col-span-2 flex justify-end">
                <div className="h-8 w-8 bg-gray-200 dark:bg-gray-700 rounded"></div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Submit Button Skeleton */}
      <div className="flex justify-end">
        <div className="h-10 w-32 bg-gray-300 dark:bg-gray-600 rounded"></div>
      </div>

      {/* Screen Reader Announcement */}
      <div className="sr-only" aria-live="polite">
        Loading global lookup keys configuration. Please wait...
      </div>
    </div>
  );
}

/**
 * Export dynamic configuration for Next.js App Router
 * 
 * Configures the page for optimal performance and SEO while ensuring
 * compatibility with React Server Components and streaming.
 */
export const dynamic = 'force-dynamic'; // Ensure fresh data on each request
export const revalidate = 0; // Disable ISR for admin interface
export const fetchCache = 'force-no-store'; // Prevent stale cache for admin data