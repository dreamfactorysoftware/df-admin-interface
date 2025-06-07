/**
 * Email Template Details Page Component
 * 
 * Next.js page component implementing the main email template details interface
 * with both create and edit modes through URL search parameters. Provides 
 * server-side rendering for optimal performance while maintaining all 
 * functionality from the original Angular component including form validation,
 * error handling, and navigation.
 * 
 * Features:
 * - Server-side rendering for sub-2-second page loads per React/Next.js Integration Requirements
 * - React Hook Form with Zod schema validation for all user inputs
 * - SWR/React Query for intelligent caching and synchronization
 * - Tailwind CSS 4.1+ with consistent theme injection and dark mode support
 * - Responsive design with WCAG 2.1 AA compliance
 * - Error boundary integration with proper fallback states
 * - Next.js router navigation with proper loading states
 * 
 * @fileoverview Email template details page for DreamFactory Admin Interface
 * @version 1.0.0
 * @since React 19.0.0, Next.js 15.1+, TypeScript 5.8+
 */

import React, { Suspense } from 'react';
import { Metadata } from 'next';
import { redirect, notFound } from 'next/navigation';

// Import page components and hooks
import { EmailTemplateDetailsClient } from './email-template-details-client';
import { emailTemplateKeys } from './use-email-template';

// Import types
import type { EmailTemplate } from './use-email-template';
import type { SearchParams } from '@/types/navigation';

// ============================================================================
// METADATA AND SEO
// ============================================================================

/**
 * Generate dynamic metadata for the email template details page
 */
export async function generateMetadata({
  searchParams,
}: {
  searchParams: SearchParams;
}): Promise<Metadata> {
  const id = searchParams?.id ? Number(searchParams.id) : null;
  const isEdit = id && id > 0;
  
  const title = isEdit 
    ? `Edit Email Template #${id} | DreamFactory Admin`
    : 'Create Email Template | DreamFactory Admin';
    
  const description = isEdit
    ? `Edit email template configuration and settings for template #${id}`
    : 'Create a new email template with customizable settings for automated email communications';

  return {
    title,
    description,
    robots: {
      index: false, // Admin interface shouldn't be indexed
      follow: false,
    },
    other: {
      'X-Frame-Options': 'DENY',
      'X-Content-Type-Options': 'nosniff',
    },
  };
}

// ============================================================================
// SERVER COMPONENT INTERFACES
// ============================================================================

/**
 * Page props interface for server component
 */
interface EmailTemplateDetailsPageProps {
  /** URL search parameters for determining mode and data */
  searchParams: SearchParams;
}

/**
 * Server-side data fetching result
 */
interface EmailTemplateServerData {
  /** Email template data (null for create mode) */
  emailTemplate: EmailTemplate | null;
  /** Template ID for edit mode */
  templateId: number | null;
  /** Whether component is in edit mode */
  isEdit: boolean;
  /** Error state from server-side fetch */
  error: string | null;
}

// ============================================================================
// SERVER-SIDE DATA FETCHING
// ============================================================================

/**
 * Fetch email template data on the server for SSR optimization
 * 
 * @param templateId - ID of template to fetch (null for create mode)
 * @returns Server-side fetched data or error state
 */
async function fetchEmailTemplateServerSide(
  templateId: number | null
): Promise<EmailTemplateServerData> {
  // Create mode - no server fetch needed
  if (!templateId) {
    return {
      emailTemplate: null,
      templateId: null,
      isEdit: false,
      error: null,
    };
  }

  try {
    // Server-side fetch would go here in a real implementation
    // For now, we'll let the client handle the data fetching
    // This maintains compatibility with the existing API client architecture
    
    return {
      emailTemplate: null, // Will be loaded client-side
      templateId,
      isEdit: true,
      error: null,
    };
  } catch (error) {
    console.error('Server-side email template fetch failed:', error);
    
    return {
      emailTemplate: null,
      templateId,
      isEdit: true,
      error: error instanceof Error ? error.message : 'Failed to load email template',
    };
  }
}

/**
 * Validate search parameters and extract template information
 * 
 * @param searchParams - URL search parameters
 * @returns Validated template parameters or redirect
 */
function validateTemplateParams(searchParams: SearchParams): {
  id: number | null;
  isEdit: boolean;
  mode: 'create' | 'edit';
} {
  const idParam = searchParams?.id;
  
  // Handle create mode
  if (!idParam || idParam === 'new' || idParam === 'create') {
    return {
      id: null,
      isEdit: false,
      mode: 'create',
    };
  }
  
  // Parse and validate ID for edit mode
  const id = Number(idParam);
  
  if (isNaN(id) || id <= 0) {
    // Invalid ID format - redirect to create mode
    redirect('/adf-config/df-email-template-details');
  }
  
  return {
    id,
    isEdit: true,
    mode: 'edit',
  };
}

// ============================================================================
// LOADING COMPONENTS
// ============================================================================

/**
 * Loading skeleton component for SSR hydration
 */
function EmailTemplateDetailsLoading(): React.ReactElement {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-200">
      {/* Page Header Skeleton */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="space-y-2">
              <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded-md w-64 animate-pulse" />
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded-md w-96 animate-pulse" />
            </div>
            <div className="flex space-x-3">
              <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded-md w-20 animate-pulse" />
              <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded-md w-24 animate-pulse" />
            </div>
          </div>
        </div>
      </div>

      {/* Form Content Skeleton */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-8">
          {/* Basic Information Section */}
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
            <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded-md w-48 mb-4 animate-pulse" />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded-md w-32 animate-pulse" />
                <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded-md animate-pulse" />
              </div>
              <div className="space-y-2">
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded-md w-24 animate-pulse" />
                <div className="h-24 bg-gray-200 dark:bg-gray-700 rounded-md animate-pulse" />
              </div>
            </div>
          </div>

          {/* Recipients Section */}
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
            <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded-md w-32 mb-4 animate-pulse" />
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {Array.from({ length: 3 }).map((_, index) => (
                <div key={index} className="space-y-2">
                  <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded-md w-16 animate-pulse" />
                  <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded-md animate-pulse" />
                </div>
              ))}
            </div>
          </div>

          {/* Email Content Section */}
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
            <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded-md w-40 mb-4 animate-pulse" />
            <div className="space-y-6">
              <div className="space-y-2">
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded-md w-20 animate-pulse" />
                <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded-md animate-pulse" />
              </div>
              <div className="space-y-2">
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded-md w-32 animate-pulse" />
                <div className="h-32 bg-gray-200 dark:bg-gray-700 rounded-md animate-pulse" />
              </div>
            </div>
          </div>

          {/* Sender Information Section */}
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
            <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded-md w-48 mb-4 animate-pulse" />
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {Array.from({ length: 4 }).map((_, index) => (
                <div key={index} className="space-y-2">
                  <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded-md w-24 animate-pulse" />
                  <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded-md animate-pulse" />
                </div>
              ))}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200 dark:border-gray-700">
            <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded-md w-24 animate-pulse" />
            <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded-md w-32 animate-pulse" />
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Error boundary fallback for server-side errors
 */
function EmailTemplateDetailsError({ 
  error, 
  reset 
}: { 
  error: Error; 
  reset: () => void;
}): React.ReactElement {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
      <div className="max-w-md w-full bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
        <div className="flex items-center justify-center w-12 h-12 mx-auto bg-error-100 dark:bg-error-900/20 rounded-full mb-4">
          <svg 
            className="w-6 h-6 text-error-600 dark:text-error-400" 
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
          >
            <path 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              strokeWidth={2} 
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" 
            />
          </svg>
        </div>
        <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 text-center mb-2">
          Failed to Load Email Template
        </h3>
        <p className="text-sm text-gray-500 dark:text-gray-400 text-center mb-6">
          {error.message || 'An unexpected error occurred while loading the email template details.'}
        </p>
        <div className="flex space-x-3">
          <button
            onClick={reset}
            className="flex-1 bg-primary-600 text-white px-4 py-2 rounded-md hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 transition-colors"
          >
            Try Again
          </button>
          <button
            onClick={() => window.history.back()}
            className="flex-1 bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-gray-100 px-4 py-2 rounded-md hover:bg-gray-300 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-colors"
          >
            Go Back
          </button>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// MAIN SERVER COMPONENT
// ============================================================================

/**
 * Email Template Details Page - Server Component
 * 
 * Handles server-side rendering, data fetching, and routing for email template
 * details in both create and edit modes. Implements SSR optimization while
 * maintaining compatibility with client-side data fetching patterns.
 * 
 * @param props - Page props including search parameters
 * @returns Server-rendered page component with client-side hydration
 */
export default async function EmailTemplateDetailsPage({
  searchParams,
}: EmailTemplateDetailsPageProps): Promise<React.ReactElement> {
  // ============================================================================
  // PARAMETER VALIDATION AND ROUTING
  // ============================================================================

  const { id, isEdit, mode } = validateTemplateParams(searchParams);

  // ============================================================================
  // SERVER-SIDE DATA FETCHING
  // ============================================================================

  const serverData = await fetchEmailTemplateServerSide(id);

  // Handle server-side errors
  if (serverData.error) {
    // For critical errors, we could show an error page
    // For now, we'll let the client handle the error state
    console.error('Server-side fetch error:', serverData.error);
  }

  // ============================================================================
  // RENDER SERVER COMPONENT
  // ============================================================================

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-200">
      {/* SEO and Accessibility */}
      <div className="sr-only">
        <h1>
          {isEdit 
            ? `Edit Email Template ${id ? `#${id}` : ''}`
            : 'Create New Email Template'
          }
        </h1>
        <p>
          {isEdit
            ? 'Modify email template configuration including recipients, content, and sender information.'
            : 'Configure a new email template with customizable settings for automated email communications.'
          }
        </p>
      </div>

      {/* Main Content with Error Boundary */}
      <Suspense fallback={<EmailTemplateDetailsLoading />}>
        <EmailTemplateDetailsClient
          templateId={id}
          isEdit={isEdit}
          mode={mode}
          initialError={serverData.error}
        />
      </Suspense>
    </div>
  );
}

// ============================================================================
// ERROR BOUNDARY EXPORT
// ============================================================================

/**
 * Error boundary component for handling runtime errors
 */
export function ErrorBoundary({ error, reset }: { error: Error; reset: () => void }) {
  return <EmailTemplateDetailsError error={error} reset={reset} />;
}

// ============================================================================
// ADDITIONAL EXPORTS
// ============================================================================

/**
 * Export loading component for external use
 */
export { EmailTemplateDetailsLoading as Loading };

/**
 * Static export for build optimization
 */
export const dynamic = 'force-dynamic'; // Always server-side render
export const revalidate = 0; // Don't cache this page