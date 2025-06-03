/**
 * Email Templates Configuration Page
 * 
 * Next.js page component for the email templates configuration route implementing 
 * React server component architecture with client-side interactivity. Provides the 
 * main container UI that renders the email templates table with proper authentication,
 * theming, and internationalization support.
 * 
 * This component transforms the Angular email templates container to a Next.js 
 * app router page following React/Next.js Integration Requirements with SSR 
 * capability under 2 seconds per performance specifications.
 * 
 * @author DreamFactory Admin Interface Team
 * @version React 19/Next.js 15.1 Migration
 * @since 2024-12-19
 */

import React, { Suspense } from 'react';
import { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { headers } from 'next/headers';
import dynamic from 'next/dynamic';

// Dynamic imports for client components to optimize initial page load
const EmailTemplatesTable = dynamic(
  () => import('./email-templates-table'),
  {
    loading: () => <EmailTemplatesTableSkeleton />,
    ssr: false // Client component with React Query
  }
);

// Error boundary for graceful error handling
const ErrorBoundary = dynamic(
  () => import('@/components/ui/error-boundary'),
  { 
    loading: () => <ErrorFallback />,
    ssr: false 
  }
);

/**
 * Page metadata for SEO and social sharing optimization
 * Implements Next.js 15.1 metadata API for enhanced SSR performance
 */
export const metadata: Metadata = {
  title: 'Email Templates | DreamFactory Admin',
  description: 'Manage and configure email templates for your DreamFactory instance. Create, edit, and customize email templates for user notifications, password resets, and system communications.',
  keywords: ['email templates', 'configuration', 'dreamfactory', 'admin', 'notifications'],
  openGraph: {
    title: 'Email Templates Configuration',
    description: 'Configure email templates for your DreamFactory instance',
    type: 'website',
  },
  robots: {
    index: false, // Admin interface should not be indexed
    follow: false,
  },
};

/**
 * Server-side authentication validation
 * Leverages Next.js middleware for session validation with <100ms processing time
 * per React/Next.js Integration Requirements
 */
async function validateAuthentication(): Promise<boolean> {
  try {
    const headersList = headers();
    const userSession = headersList.get('x-user-session');
    const userPermissions = headersList.get('x-user-permissions');
    
    // Validate session exists and has admin permissions
    if (!userSession) {
      return false;
    }
    
    // Check if user has email template management permissions
    const permissions = userPermissions ? JSON.parse(userPermissions) : [];
    const hasEmailTemplateAccess = permissions.includes('admin') || 
                                 permissions.includes('email_template_management') ||
                                 permissions.includes('system_config');
    
    return hasEmailTemplateAccess;
  } catch (error) {
    console.error('Authentication validation error:', error);
    return false;
  }
}

/**
 * Loading skeleton component for email templates table
 * Provides immediate visual feedback during SSR and component loading
 */
function EmailTemplatesTableSkeleton() {
  return (
    <div className="animate-pulse" role="status" aria-label="Loading email templates">
      {/* Header skeleton */}
      <div className="border-b border-gray-200 pb-5 sm:flex sm:items-center sm:justify-between">
        <div className="h-6 bg-gray-200 rounded w-48"></div>
        <div className="mt-3 flex sm:ml-4 sm:mt-0 space-x-3">
          <div className="h-9 bg-gray-200 rounded w-20"></div>
          <div className="h-9 bg-gray-300 rounded w-32"></div>
        </div>
      </div>
      
      {/* Search bar skeleton */}
      <div className="mt-6 flex items-center justify-between">
        <div className="h-10 bg-gray-200 rounded w-80"></div>
        <div className="h-4 bg-gray-200 rounded w-32"></div>
      </div>
      
      {/* Table skeleton */}
      <div className="mt-6 flow-root">
        <div className="-mx-4 -my-2 overflow-x-auto sm:-mx-6 lg:-mx-8">
          <div className="inline-block min-w-full py-2 align-middle sm:px-6 lg:px-8">
            <div className="space-y-3">
              {/* Table header */}
              <div className="grid grid-cols-3 gap-4 px-6 py-3">
                <div className="h-4 bg-gray-200 rounded w-16"></div>
                <div className="h-4 bg-gray-200 rounded w-24"></div>
                <div className="h-4 bg-gray-200 rounded w-16"></div>
              </div>
              
              {/* Table rows */}
              {[...Array(5)].map((_, index) => (
                <div key={index} className="grid grid-cols-3 gap-4 px-6 py-4 border-t border-gray-200">
                  <div className="h-4 bg-gray-100 rounded w-32"></div>
                  <div className="h-4 bg-gray-100 rounded w-48"></div>
                  <div className="h-8 bg-gray-100 rounded w-8 ml-auto"></div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
      
      {/* Pagination skeleton */}
      <div className="flex items-center justify-between border-t border-gray-200 bg-white px-4 py-3 sm:px-6">
        <div className="h-4 bg-gray-200 rounded w-48"></div>
        <div className="flex space-x-2">
          <div className="h-8 bg-gray-200 rounded w-8"></div>
          <div className="h-8 bg-gray-200 rounded w-16"></div>
          <div className="h-8 bg-gray-200 rounded w-8"></div>
        </div>
      </div>
      
      <span className="sr-only">Loading email templates...</span>
    </div>
  );
}

/**
 * Error fallback component for graceful error handling
 * Provides user-friendly error messages with recovery options
 */
function ErrorFallback() {
  return (
    <div className="rounded-md bg-red-50 p-4" role="alert">
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
            Unable to load email templates
          </h3>
          <div className="mt-2 text-sm text-red-700">
            <p>
              There was an error loading the email templates configuration. 
              Please check your connection and try again.
            </p>
          </div>
          <div className="mt-4">
            <button
              type="button"
              className="rounded-md bg-red-50 px-2 py-1.5 text-sm font-medium text-red-800 hover:bg-red-100 focus:outline-none focus:ring-2 focus:ring-red-600 focus:ring-offset-2 focus:ring-offset-red-50"
              onClick={() => window.location.reload()}
            >
              Try again
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Breadcrumb navigation component for better UX
 * Provides clear navigation context within the admin interface
 */
function Breadcrumbs() {
  return (
    <nav className="flex" aria-label="Breadcrumb">
      <ol role="list" className="flex items-center space-x-4">
        <li>
          <div className="flex items-center">
            <a 
              href="/adf-home" 
              className="text-sm font-medium text-gray-500 hover:text-gray-700 transition-colors duration-200"
              aria-label="Go to dashboard home"
            >
              Dashboard
            </a>
          </div>
        </li>
        <li>
          <div className="flex items-center">
            <svg
              className="h-5 w-5 flex-shrink-0 text-gray-300"
              fill="currentColor"
              viewBox="0 0 20 20"
              aria-hidden="true"
            >
              <path d="m5.555 17.776 4-16 .894.448-4 16-.894-.448z" />
            </svg>
            <a 
              href="/adf-config" 
              className="ml-4 text-sm font-medium text-gray-500 hover:text-gray-700 transition-colors duration-200"
              aria-label="Go to configuration section"
            >
              Configuration
            </a>
          </div>
        </li>
        <li>
          <div className="flex items-center">
            <svg
              className="h-5 w-5 flex-shrink-0 text-gray-300"
              fill="currentColor"
              viewBox="0 0 20 20"
              aria-hidden="true"
            >
              <path d="m5.555 17.776 4-16 .894.448-4 16-.894-.448z" />
            </svg>
            <span 
              className="ml-4 text-sm font-medium text-gray-900"
              aria-current="page"
            >
              Email Templates
            </span>
          </div>
        </li>
      </ol>
    </nav>
  );
}

/**
 * Page header component with actions
 * Provides consistent page title and contextual actions
 */
function PageHeader() {
  return (
    <div className="md:flex md:items-center md:justify-between">
      <div className="min-w-0 flex-1">
        <h1 className="text-2xl font-bold leading-7 text-gray-900 sm:truncate sm:text-3xl sm:tracking-tight">
          Email Templates
        </h1>
        <p className="mt-1 text-sm text-gray-500">
          Manage and configure email templates for user notifications, password resets, and system communications.
        </p>
      </div>
    </div>
  );
}

/**
 * Main Email Templates Page Component
 * 
 * React Server Component implementing Next.js 15.1 app router architecture
 * with optimal performance and SER capabilities. Transforms Angular email
 * templates container to modern React patterns with Tailwind CSS styling.
 * 
 * Features:
 * - Server-side rendering with <2 second load times
 * - Authentication validation via Next.js middleware  
 * - Suspense boundaries for progressive loading
 * - Error boundaries for graceful error handling
 * - Accessible design with WCAG 2.1 AA compliance
 * - SEO optimization with proper metadata
 */
export default async function EmailTemplatesPage() {
  // Server-side authentication check with redirect handling
  const isAuthenticated = await validateAuthentication();
  
  if (!isAuthenticated) {
    // Redirect to login with return URL for seamless UX
    redirect('/login?returnUrl=/adf-config/df-email-templates');
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Skip navigation link for accessibility */}
      <a 
        href="#main-content" 
        className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 bg-primary-600 text-white px-4 py-2 rounded-md z-50"
      >
        Skip to main content
      </a>
      
      {/* Main content container */}
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Page padding and structure */}
        <div className="py-6">
          {/* Breadcrumb navigation */}
          <div className="mb-6">
            <Breadcrumbs />
          </div>
          
          {/* Page header */}
          <div className="mb-8">
            <PageHeader />
          </div>
          
          {/* Main content area */}
          <main id="main-content" className="space-y-6">
            {/* Email templates table with error boundary and suspense */}
            <div className="bg-white shadow rounded-lg">
              <div className="px-4 py-5 sm:p-6">
                <Suspense fallback={<EmailTemplatesTableSkeleton />}>
                  <ErrorBoundary fallback={<ErrorFallback />}>
                    <EmailTemplatesTable />
                  </ErrorBoundary>
                </Suspense>
              </div>
            </div>
          </main>
        </div>
      </div>
      
      {/* Page analytics and performance monitoring hook */}
      <script
        dangerouslySetInnerHTML={{
          __html: `
            // Page load performance tracking
            if (typeof window !== 'undefined' && window.performance) {
              window.addEventListener('load', function() {
                const navTiming = performance.getEntriesByType('navigation')[0];
                if (navTiming && navTiming.loadEventEnd > 0) {
                  const loadTime = navTiming.loadEventEnd - navTiming.fetchStart;
                  console.log('Email Templates Page Load Time:', loadTime + 'ms');
                  
                  // Track if we meet <2s SSR requirement
                  if (loadTime > 2000) {
                    console.warn('Page load time exceeds 2s requirement:', loadTime + 'ms');
                  }
                }
              });
            }
          `,
        }}
      />
    </div>
  );
}

/**
 * Static generation configuration for optimal performance
 * Disables static generation for admin pages requiring authentication
 */
export const dynamic = 'force-dynamic';
export const revalidate = 0;

/**
 * Runtime configuration for enhanced security
 * Ensures proper handling of sensitive admin functionality
 */
export const runtime = 'nodejs';