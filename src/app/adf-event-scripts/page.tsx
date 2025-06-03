import { Metadata } from 'next';
import { Suspense } from 'react';
import { redirect } from 'next/navigation';
import { EventScriptsTable } from '@/components/event-scripts/scripts-table';
import { PaywallModal } from '@/components/ui/paywall';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { ErrorBoundary } from '@/components/ui/error-boundary';
import { checkPaywallAccess } from '@/lib/paywall';

// Metadata for SEO optimization and responsive viewport settings per Section 0.2.1 SSR capabilities
export const metadata: Metadata = {
  title: 'Event Scripts - DreamFactory Admin Interface',
  description: 'Manage event scripts with comprehensive CRUD operations, filtering, and paywall enforcement for premium feature access control.',
  keywords: ['event scripts', 'dreamfactory', 'admin', 'api', 'automation', 'scripts'],
  viewport: 'width=device-width, initial-scale=1',
  robots: 'noindex, nofollow', // Admin interface should not be indexed
};

/**
 * Event Scripts Management Page Component
 * 
 * Main event scripts management page implementing the scripts list interface with table display,
 * filtering, and script CRUD operations. Replaces the Angular df-manage-scripts component with
 * Next.js server components, React Query integration, and paywall enforcement through middleware
 * for premium feature access control.
 * 
 * Migration from Angular:
 * - Converts Angular DfManageScriptsComponent to Next.js page.tsx per Section 4.7.1.1 routing migration strategy
 * - Transforms Angular DfManageScriptsTableComponent reactive table to React data table with TanStack Virtual per React/Next.js Integration Requirements
 * - Replaces Angular paywall guards with Next.js middleware authentication flow per Section 4.5 security and authentication flows
 * - Migrates Angular Material table components to Headless UI with Tailwind CSS styling per Section 7.1 core UI technologies
 * - Converts RxJS-based data fetching (getFilterQuery, getList) to React Query with intelligent caching per Section 5.2 component details
 * - Transforms Angular Router navigation to Next.js app router push patterns per Section 4.1.1 system workflows
 * - Replaces Angular @ngneat/transloco with Next.js internationalization patterns per React/Next.js Integration Requirements
 * - Converts MatDialog confirmations to Headless UI modal components per Section 7.1.2 component library integration
 * - Transforms LiveAnnouncer accessibility to modern ARIA live regions per WCAG 2.1 AA compliance requirements
 * 
 * Architecture Elements:
 * - Event Scripts Management feature with paywall enforcement per Section 0.1.3 architecture elements
 * - React Query-powered script management with intelligent caching per React/Next.js Integration Requirements
 * - Next.js middleware for authentication and paywall validation per Section 4.5.1.1 middleware authentication interception
 * - SSR pages under 2 seconds per React/Next.js Integration Requirements performance standards
 * - Headless UI components with Tailwind CSS 4.1+ per Section 7.1.1 framework stack architecture
 * 
 * Performance Requirements:
 * - SSR pages under 2 seconds per React/Next.js Integration Requirements
 * - React Query cache hit responses under 50ms per React/Next.js Integration Requirements
 * - Real-time validation under 100ms per React/Next.js Integration Requirements
 * - WCAG 2.1 AA compliance maintained per Section 0.1.2 affected components
 */

// Server-side paywall check - executed during SSR per Next.js middleware patterns
async function checkFeatureAccess(): Promise<{ hasAccess: boolean; reason?: string }> {
  try {
    // Check paywall access for event scripts feature
    // Per Angular DfPaywallService.activatePaywall(['script_Type','event_script']) pattern
    const hasAccess = await checkPaywallAccess(['script_Type', 'event_script']);
    
    if (!hasAccess) {
      return { 
        hasAccess: false, 
        reason: 'Event Scripts feature requires premium subscription. Please upgrade your license to access this functionality.' 
      };
    }
    
    return { hasAccess: true };
  } catch (error) {
    console.error('Error checking feature access:', error);
    return { 
      hasAccess: false, 
      reason: 'Unable to verify feature access. Please try again or contact support.' 
    };
  }
}

export default async function EventScriptsPage() {
  // Server-side paywall enforcement per Next.js middleware authentication flow
  const accessCheck = await checkFeatureAccess();
  
  // If no access, render paywall component instead of redirecting
  // This maintains the route structure while enforcing access control
  if (!accessCheck.hasAccess) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-200">
        <div className="container mx-auto px-4 py-6 lg:px-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              Event Scripts
            </h1>
            <p className="mt-2 text-gray-600 dark:text-gray-400">
              Manage event scripts and automation workflows
            </p>
          </div>
          
          {/* Paywall enforcement modal - replaces Angular df-paywall component */}
          <PaywallModal
            isOpen={true}
            onClose={() => {}} // No close action - access required
            feature="Event Scripts"
            description={accessCheck.reason || 'This feature requires premium access'}
            upgradeUrl="/upgrade"
            contactUrl="/contact"
          />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-200">
      {/* Main event scripts container with responsive layout */}
      <div className="container mx-auto px-4 py-6 lg:px-8">
        
        {/* Page header with title and description */}
        <div className="mb-8">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
            <div className="mb-4 lg:mb-0">
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                Event Scripts
              </h1>
              <p className="mt-2 text-gray-600 dark:text-gray-400">
                Manage event scripts and automation workflows for your APIs
              </p>
            </div>
            
            {/* Quick action buttons */}
            <div className="flex flex-col sm:flex-row gap-3">
              <button
                type="button"
                className="inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 text-sm font-medium rounded-md text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 transition-colors duration-200"
                onClick={() => window.open('/docs/event-scripts', '_blank')}
                aria-label="Open event scripts documentation"
              >
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                Documentation
              </button>
              
              <button
                type="button"
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 transition-colors duration-200"
                onClick={() => window.location.href = '/adf-event-scripts/create'}
                aria-label="Create new event script"
              >
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                New Script
              </button>
            </div>
          </div>
        </div>

        {/* Main content area with error boundary and loading states */}
        <ErrorBoundary
          fallback={
            <div className="bg-white dark:bg-gray-800 rounded-lg p-8 shadow-sm border border-gray-200 dark:border-gray-700">
              <div className="text-center">
                <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100 dark:bg-red-900/20">
                  <svg className="h-6 w-6 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                  </svg>
                </div>
                <h3 className="mt-4 text-lg font-medium text-gray-900 dark:text-white">
                  Error Loading Event Scripts
                </h3>
                <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                  There was a problem loading the event scripts. Please refresh the page or contact support if the issue persists.
                </p>
                <button
                  type="button"
                  className="mt-4 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                  onClick={() => window.location.reload()}
                >
                  Refresh Page
                </button>
              </div>
            </div>
          }
        >
          {/* Event Scripts Table with Suspense for loading state */}
          <Suspense 
            fallback={
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
                {/* Loading state for table */}
                <div className="p-6">
                  <div className="animate-pulse space-y-4">
                    {/* Table header loading skeleton */}
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                      <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-48"></div>
                      <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded w-64"></div>
                    </div>
                    
                    {/* Table rows loading skeleton */}
                    <div className="space-y-3">
                      {[...Array(5)].map((_, i) => (
                        <div key={i} className="grid grid-cols-4 gap-4">
                          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded"></div>
                          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded"></div>
                          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded"></div>
                          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-20"></div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
                
                {/* Loading spinner overlay */}
                <div className="absolute inset-0 bg-white/50 dark:bg-gray-800/50 flex items-center justify-center">
                  <LoadingSpinner size="lg" />
                  <span className="ml-3 text-sm text-gray-600 dark:text-gray-400">
                    Loading event scripts...
                  </span>
                </div>
              </div>
            }
          >
            {/* Main Event Scripts Table Component */}
            {/* Replaces Angular DfManageScriptsTableComponent with React implementation */}
            <EventScriptsTable />
          </Suspense>
        </ErrorBoundary>

        {/* Help text and additional information */}
        <div className="mt-8 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-6">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-blue-800 dark:text-blue-200">
                About Event Scripts
              </h3>
              <div className="mt-2 text-sm text-blue-700 dark:text-blue-300">
                <p>
                  Event scripts allow you to execute custom code when specific API events occur. 
                  You can create scripts in multiple languages including Node.js, PHP, and Python 
                  to extend your API functionality with custom business logic.
                </p>
                <ul className="mt-2 list-disc list-inside space-y-1">
                  <li>Scripts can be triggered on pre- and post-API events</li>
                  <li>Support for multiple scripting languages and environments</li>
                  <li>Access to event context and API request/response data</li>
                  <li>Integration with external services and databases</li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        {/* ARIA live region for accessibility announcements */}
        <div 
          aria-live="polite" 
          aria-atomic="true" 
          className="sr-only"
          id="scripts-announcements"
        >
          {/* Dynamic announcements will be inserted here for screen readers */}
        </div>
      </div>
    </div>
  );
}

/**
 * Performance optimization: Enable static generation for better SSR performance
 * This page will be statically generated at build time when possible
 */
export const dynamic = 'force-dynamic'; // Required for server-side paywall checks

/**
 * Revalidate configuration for caching optimization
 * Per React/Next.js Integration Requirements for cache hit responses under 50ms
 */
export const revalidate = 300; // 5 minutes cache