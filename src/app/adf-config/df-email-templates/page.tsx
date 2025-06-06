/**
 * Email Templates Configuration Page
 * 
 * Next.js page component implementing React server component architecture with
 * client-side interactivity for comprehensive email template management. This
 * component serves as the main container for the email templates interface,
 * replacing Angular component architecture with modern React patterns optimized
 * for server-side rendering and enhanced performance.
 * 
 * Key Features:
 * - React server component with SSR capability for sub-2-second page loads
 * - Client-side data fetching with React Query intelligent caching
 * - Comprehensive error boundaries and loading states for production reliability
 * - Authentication validation through Next.js middleware integration
 * - Responsive Tailwind CSS layout with dark mode support
 * - WCAG 2.1 AA accessibility compliance with proper ARIA implementation
 * - Suspense boundaries for optimal loading experience
 * 
 * Performance Requirements:
 * - SSR pages under 2 seconds per React/Next.js Integration Requirements
 * - Cache hit responses under 50ms for optimal user experience
 * - Real-time validation under 100ms for form interactions
 * 
 * Security Features:
 * - Next.js middleware authentication flow validation
 * - Role-based access control enforcement at page level
 * - Secure session management with automatic token refresh
 * 
 * @fileoverview Next.js email templates configuration page
 * @version 1.0.0
 * @since Next.js 15.1+ / React 19.0.0
 */

import type { Metadata } from 'next';
import { Suspense } from 'react';
import { notFound } from 'next/navigation';

// Core UI Components
import { EmailTemplatesTable } from './email-templates-table';

// Error Boundary and Loading Components
import { ErrorBoundary } from '../../../components/ui/error-boundary';
import { LoadingSpinner } from '../../../components/ui/loading-spinner';
import { PageHeader } from '../../../components/ui/page-header';

// Authentication and Security
import { validatePageAccess } from '../../../lib/auth/page-access';

// Types
import type { PageProps } from '../../../types/page';

// ============================================================================
// PAGE METADATA CONFIGURATION
// ============================================================================

/**
 * Metadata configuration for SEO and page identification
 * Optimized for admin interface context with security considerations
 */
export const metadata: Metadata = {
  title: 'Email Templates - Configuration',
  description: 'Manage email templates for automated notifications, user communications, and system-generated messages. Configure template content, variables, and delivery settings.',
  keywords: [
    'email templates',
    'email configuration',
    'notification templates',
    'automated emails',
    'DreamFactory admin',
    'template management',
  ],
  robots: {
    index: false,    // Admin pages should not be indexed
    follow: false,
    nocache: true,
    noarchive: true,
  },
  openGraph: {
    title: 'Email Templates Configuration - DreamFactory Admin',
    description: 'Manage and configure email templates for your DreamFactory instance.',
    type: 'website',
  },
};

// ============================================================================
// SERVER-SIDE ACCESS VALIDATION
// ============================================================================

/**
 * Validates user permissions for email templates management
 * Implements server-side authorization before component rendering
 * 
 * @returns Authorization result with user context
 * @throws notFound() if user lacks required permissions
 */
async function validateEmailTemplatesAccess() {
  try {
    const accessResult = await validatePageAccess({
      requiredPermissions: [
        'system.email_template.read',
        'system.config.read',
      ],
      optionalPermissions: [
        'system.email_template.write',
        'system.email_template.delete',
      ],
      redirectUnauthenticated: '/login',
      redirectUnauthorized: '/unauthorized',
    });

    if (!accessResult.hasAccess) {
      notFound();
    }

    return accessResult;
  } catch (error) {
    console.error('Email templates access validation failed:', error);
    notFound();
  }
}

// ============================================================================
// LOADING COMPONENTS
// ============================================================================

/**
 * Page-level loading component with skeleton UI
 * Provides immediate visual feedback during SSR and data loading
 */
function EmailTemplatesPageSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      {/* Header Skeleton */}
      <div className="border-b border-gray-200 dark:border-gray-700 pb-6">
        <div className="h-8 w-64 bg-gray-200 dark:bg-gray-700 rounded mb-2" />
        <div className="h-4 w-96 bg-gray-200 dark:bg-gray-700 rounded" />
      </div>

      {/* Table Controls Skeleton */}
      <div className="flex items-center justify-between">
        <div className="h-10 w-80 bg-gray-200 dark:bg-gray-700 rounded" />
        <div className="flex space-x-3">
          <div className="h-10 w-24 bg-gray-200 dark:bg-gray-700 rounded" />
          <div className="h-10 w-32 bg-gray-200 dark:bg-gray-700 rounded" />
        </div>
      </div>

      {/* Table Skeleton */}
      <div className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
        {/* Table Header */}
        <div className="bg-gray-50 dark:bg-gray-800 px-6 py-3 border-b border-gray-200 dark:border-gray-700">
          <div className="flex space-x-4">
            <div className="h-4 w-32 bg-gray-200 dark:bg-gray-700 rounded" />
            <div className="h-4 w-48 bg-gray-200 dark:bg-gray-700 rounded" />
            <div className="h-4 w-24 bg-gray-200 dark:bg-gray-700 rounded ml-auto" />
          </div>
        </div>

        {/* Table Rows */}
        {[...Array(8)].map((_, index) => (
          <div 
            key={index}
            className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 last:border-b-0"
          >
            <div className="flex items-center space-x-4">
              <div className="h-4 w-32 bg-gray-200 dark:bg-gray-700 rounded" />
              <div className="h-4 w-48 bg-gray-200 dark:bg-gray-700 rounded" />
              <div className="h-4 w-20 bg-gray-200 dark:bg-gray-700 rounded ml-auto" />
            </div>
          </div>
        ))}
      </div>

      {/* Pagination Skeleton */}
      <div className="flex items-center justify-between">
        <div className="h-4 w-48 bg-gray-200 dark:bg-gray-700 rounded" />
        <div className="flex space-x-2">
          <div className="h-8 w-20 bg-gray-200 dark:bg-gray-700 rounded" />
          <div className="h-8 w-16 bg-gray-200 dark:bg-gray-700 rounded" />
          <div className="h-8 w-16 bg-gray-200 dark:bg-gray-700 rounded" />
        </div>
      </div>
    </div>
  );
}

/**
 * Critical error component for server-side failures
 * Provides user-friendly error messaging with recovery options
 */
function EmailTemplatesErrorFallback({ 
  error, 
  reset 
}: { 
  error: Error; 
  reset: () => void; 
}) {
  return (
    <div 
      className="min-h-[60vh] flex items-center justify-center p-6"
      role="alert"
      aria-labelledby="error-title"
      aria-describedby="error-description"
    >
      <div className="max-w-lg w-full bg-white dark:bg-gray-800 border border-red-200 dark:border-red-800 rounded-lg shadow-lg p-8 text-center">
        {/* Error Icon */}
        <div className="w-16 h-16 mx-auto mb-4 text-red-500 dark:text-red-400">
          <svg 
            className="w-full h-full" 
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <path 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              strokeWidth={2} 
              d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" 
            />
          </svg>
        </div>
        
        {/* Error Content */}
        <h1 
          id="error-title"
          className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2"
        >
          Unable to load email templates
        </h1>
        
        <p 
          id="error-description"
          className="text-gray-600 dark:text-gray-400 mb-6"
        >
          We encountered an error while loading the email templates configuration.
          This might be a temporary issue with the server connection.
        </p>
        
        {/* Development Error Details */}
        {process.env.NODE_ENV === 'development' && (
          <details className="mb-6 text-left">
            <summary className="cursor-pointer text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Error Details (Development)
            </summary>
            <pre className="text-xs bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 p-4 rounded overflow-auto text-red-700 dark:text-red-300">
              {error.message}
              {error.stack && (
                <>
                  {'\n\n'}
                  {error.stack}
                </>
              )}
            </pre>
          </details>
        )}
        
        {/* Recovery Actions */}
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <button
            onClick={reset}
            className="px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800"
          >
            Try again
          </button>
          
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800"
          >
            Refresh page
          </button>
          
          <a
            href="/adf-config"
            className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800 inline-block text-center"
          >
            Back to Config
          </a>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// MAIN PAGE COMPONENT
// ============================================================================

/**
 * Email Templates Configuration Page Component
 * 
 * React server component providing the main container for email template
 * management functionality. Implements comprehensive error handling, loading
 * states, and accessibility features while maintaining optimal performance
 * through server-side rendering and client-side caching strategies.
 * 
 * Architecture Features:
 * - Server-side authentication and permission validation
 * - Comprehensive error boundaries with graceful degradation
 * - Progressive loading with skeleton UI patterns
 * - Responsive layout with dark mode support
 * - WCAG 2.1 AA accessibility compliance
 * - SEO optimization for admin interface context
 * 
 * Performance Optimizations:
 * - React server component for faster initial loads
 * - Suspense boundaries for non-blocking UI updates
 * - Intelligent caching through React Query integration
 * - Minimal client-side JavaScript for optimal performance
 * 
 * @param props - Page props including search params and route parameters
 * @returns Complete email templates configuration page
 */
export default async function EmailTemplatesPage({ 
  searchParams 
}: PageProps) {
  // Server-side authentication and permission validation
  const accessResult = await validateEmailTemplatesAccess();
  
  // Extract search parameters for filtering and pagination
  const currentPage = Number(searchParams?.page) || 1;
  const searchQuery = searchParams?.search as string || '';
  const sortBy = searchParams?.sort as string || '';
  
  return (
    <div className="flex-1 space-y-6 p-6 lg:p-8">
      {/* Page Header */}
      <PageHeader
        title="Email Templates"
        description="Manage email templates for automated notifications, user communications, and system-generated messages. Configure template content, variables, and delivery settings."
        breadcrumb={[
          { label: 'Configuration', href: '/adf-config' },
          { label: 'Email Templates', href: '/adf-config/df-email-templates' },
        ]}
        className="border-b border-gray-200 dark:border-gray-700 pb-6"
      />

      {/* Main Content with Error Boundary */}
      <ErrorBoundary fallback={EmailTemplatesErrorFallback}>
        <main 
          className="space-y-6"
          role="main"
          aria-labelledby="email-templates-title"
          aria-describedby="email-templates-description"
        >
          {/* Screen Reader Content */}
          <div className="sr-only">
            <h1 id="email-templates-title">
              Email Templates Configuration
            </h1>
            <p id="email-templates-description">
              This page allows you to manage email templates for your DreamFactory instance.
              You can create, edit, and delete email templates, as well as configure their
              content and variables for automated notifications and user communications.
            </p>
          </div>

          {/* Email Templates Table with Suspense */}
          <Suspense fallback={<EmailTemplatesPageSkeleton />}>
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
              <EmailTemplatesTable
                className="w-full"
                aria-label="Email templates management table"
                // Pass server-side search params for SSR optimization
                initialPage={currentPage}
                initialSearch={searchQuery}
                initialSort={sortBy}
                // Pass user permissions for conditional UI
                canCreate={accessResult.permissions.includes('system.email_template.write')}
                canEdit={accessResult.permissions.includes('system.email_template.write')}
                canDelete={accessResult.permissions.includes('system.email_template.delete')}
              />
            </div>
          </Suspense>

          {/* Accessibility Live Region for Dynamic Updates */}
          <div 
            id="email-templates-announcements"
            aria-live="polite" 
            aria-atomic="true" 
            className="sr-only"
          />

          {/* Help Text for Users */}
          <div className="bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg 
                  className="h-5 w-5 text-blue-400" 
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
                  Email Template Tips
                </h3>
                <div className="mt-2 text-sm text-blue-700 dark:text-blue-300">
                  <ul className="list-disc list-inside space-y-1">
                    <li>
                      Use template variables like <code className="bg-blue-100 dark:bg-blue-900 px-1 rounded">{'{{username}}'}</code> and <code className="bg-blue-100 dark:bg-blue-900 px-1 rounded">{'{{app_name}}'}</code> for dynamic content
                    </li>
                    <li>
                      Test your templates before deploying to ensure proper variable substitution
                    </li>
                    <li>
                      Include both HTML and plain text versions for maximum email client compatibility
                    </li>
                    <li>
                      Consider email accessibility with proper alt text for images and semantic HTML structure
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </main>
      </ErrorBoundary>

      {/* Performance Monitoring - Development Only */}
      {process.env.NODE_ENV === 'development' && (
        <script
          dangerouslySetInnerHTML={{
            __html: `
              // Monitor email templates page load performance
              if (typeof window !== 'undefined' && window.performance) {
                window.addEventListener('load', () => {
                  const loadTime = performance.now();
                  console.log('Email Templates Page Load Time:', Math.round(loadTime), 'ms');
                  
                  // Ensure SSR requirement of under 2 seconds is met
                  if (loadTime > 2000) {
                    console.warn('Email Templates page load exceeded 2-second SSR requirement');
                  }
                });
              }
            `
          }}
        />
      )}
    </div>
  );
}

// ============================================================================
// EXPORT CONFIGURATION
// ============================================================================

/**
 * Next.js dynamic route configuration
 * Optimizes page generation for performance and security
 */
export const dynamic = 'force-dynamic'; // Always server-render for security
export const revalidate = 0; // No static generation for admin pages
export const runtime = 'nodejs'; // Use Node.js runtime for server-side features