import { Suspense } from 'react';
import { Metadata } from 'next';
import { cookies } from 'next/headers';
import { notFound } from 'next/navigation';

// UI Components
import { Paywall } from '@/components/ui/paywall';
import { Alert } from '@/components/ui/alert';
import { ErrorBoundary } from '@/components/ui/error-boundary';

// Feature Components
import { ServiceReportTable } from './service-report-table';

// Loading Component
import { LoadingSkeleton } from './loading';

// Utils and Configuration
import { validateSession } from '@/lib/auth/session-validator';
import { checkFeatureAccess } from '@/lib/auth/feature-access';

/**
 * Metadata for the Service Reports page
 * Provides SEO optimization and proper document head configuration
 */
export const metadata: Metadata = {
  title: 'Service Reports | System Settings | DreamFactory',
  description: 'Monitor API service usage, track user activity, and analyze service performance with comprehensive service reporting dashboard.',
  keywords: 'service reports, API monitoring, user activity, system analytics, DreamFactory',
  robots: 'noindex, nofollow', // Admin interface should not be indexed
};

/**
 * Server-side props for reports page
 * Validates session and checks paywall status server-side for optimal performance
 */
interface ReportsPageProps {
  searchParams: {
    filter?: string;
    page?: string;
    limit?: string;
    sort?: string;
    order?: 'asc' | 'desc';
  };
}

/**
 * Service Reports Page Component
 * 
 * Main service reports page implementing Next.js app router architecture with server-side rendering.
 * Provides service report overview dashboard with paywall enforcement, filtering capabilities,
 * and integration with React Query for intelligent data caching.
 * 
 * Features:
 * - Server-side rendering with sub-2-second load times
 * - Paywall enforcement for premium features
 * - Comprehensive error handling and recovery
 * - React Query-powered data management
 * - Responsive Tailwind CSS layout
 * - Accessibility compliance (WCAG 2.1 AA)
 * 
 * @param searchParams - URL search parameters for filtering and pagination
 */
export default async function ServiceReportsPage({ searchParams }: ReportsPageProps) {
  try {
    // Server-side session validation for security
    const cookieStore = cookies();
    const sessionToken = cookieStore.get('df-session-token')?.value;
    
    if (!sessionToken) {
      notFound();
    }

    // Validate session token server-side
    const session = await validateSession(sessionToken);
    if (!session.valid) {
      notFound();
    }

    // Check feature access and paywall status
    const featureAccess = await checkFeatureAccess(sessionToken, 'service-reports');
    const isPaywallActive = !featureAccess.hasAccess;

    // Extract and validate search parameters
    const {
      filter = '',
      page = '1',
      limit = '25',
      sort = 'lastModifiedDate',
      order = 'desc'
    } = searchParams;

    // Validate pagination parameters
    const pageNumber = Math.max(1, parseInt(page, 10) || 1);
    const pageSize = Math.min(100, Math.max(10, parseInt(limit, 10) || 25));
    const sortOrder = order === 'asc' ? 'asc' : 'desc';

    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        {/* Page Header */}
        <div className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
          <div className="px-4 py-6 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold leading-7 text-gray-900 dark:text-white sm:truncate sm:text-3xl">
                  Service Reports
                </h1>
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                  Monitor API service usage, track user activity, and analyze service performance
                </p>
              </div>
              
              {/* Feature Status Badge */}
              <div className="flex items-center space-x-2">
                {isPaywallActive ? (
                  <span className="inline-flex items-center rounded-full bg-yellow-100 dark:bg-yellow-900/20 px-3 py-1 text-xs font-medium text-yellow-800 dark:text-yellow-300">
                    Premium Feature
                  </span>
                ) : (
                  <span className="inline-flex items-center rounded-full bg-green-100 dark:bg-green-900/20 px-3 py-1 text-xs font-medium text-green-800 dark:text-green-300">
                    Active
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8">
          <div className="mx-auto max-w-7xl">
            {/* Error Boundary for Component-Level Error Handling */}
            <ErrorBoundary
              fallback={
                <Alert 
                  variant="destructive"
                  title="Error Loading Service Reports"
                  className="mb-6"
                >
                  There was an error loading the service reports. Please try refreshing the page or contact support if the issue persists.
                </Alert>
              }
              onError={(error, errorInfo) => {
                // Log error for monitoring
                console.error('Service Reports Page Error:', error, errorInfo);
              }}
            >
              {/* Conditional Rendering: Paywall or Reports Table */}
              {isPaywallActive ? (
                <PaywallSection 
                  feature="service-reports"
                  title="Service Reports"
                  description="Access comprehensive service usage analytics, user activity tracking, and performance monitoring."
                />
              ) : (
                <ReportsSection
                  initialFilters={{
                    filter,
                    page: pageNumber,
                    limit: pageSize,
                    sort,
                    order: sortOrder,
                  }}
                />
              )}
            </ErrorBoundary>
          </div>
        </main>
      </div>
    );
  } catch (error) {
    // Server-side error handling
    console.error('Service Reports Page Server Error:', error);
    
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <Alert 
          variant="destructive"
          title="Service Unavailable"
          className="max-w-md"
        >
          The service reports feature is temporarily unavailable. Please try again later.
        </Alert>
      </div>
    );
  }
}

/**
 * Paywall Section Component
 * Displays upgrade prompts and feature information for premium features
 */
interface PaywallSectionProps {
  feature: string;
  title: string;
  description: string;
}

function PaywallSection({ feature, title, description }: PaywallSectionProps) {
  return (
    <div className="rounded-lg bg-white dark:bg-gray-800 shadow-sm border border-gray-200 dark:border-gray-700">
      <div className="p-6">
        <Paywall
          feature={feature}
          title={title}
          description={description}
          variant="full"
          showUpgradeButton={true}
          className="w-full"
        />
      </div>
    </div>
  );
}

/**
 * Reports Section Component
 * Renders the main service reports table with filtering and pagination
 */
interface ReportsSectionProps {
  initialFilters: {
    filter: string;
    page: number;
    limit: number;
    sort: string;
    order: string;
  };
}

function ReportsSection({ initialFilters }: ReportsSectionProps) {
  return (
    <div className="space-y-6">
      {/* Reports Table with Suspense for Loading States */}
      <Suspense 
        fallback={
          <LoadingSkeleton 
            title="Loading Service Reports"
            description="Fetching service usage data and analytics..."
          />
        }
      >
        <div className="rounded-lg bg-white dark:bg-gray-800 shadow-sm border border-gray-200 dark:border-gray-700">
          <ServiceReportTable
            initialFilters={initialFilters}
            enableExport={true}
            enableAdvancedFiltering={true}
            showPagination={true}
            className="w-full"
          />
        </div>
      </Suspense>

      {/* Help Section */}
      <div className="rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 p-4">
        <div className="flex items-start space-x-3">
          <div className="flex-shrink-0">
            <svg
              className="h-5 w-5 text-blue-600 dark:text-blue-400"
              fill="currentColor"
              viewBox="0 0 20 20"
              aria-hidden="true"
            >
              <path
                fillRule="evenodd"
                d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                clipRule="evenodd"
              />
            </svg>
          </div>
          <div>
            <h3 className="text-sm font-medium text-blue-800 dark:text-blue-200">
              About Service Reports
            </h3>
            <p className="mt-1 text-sm text-blue-700 dark:text-blue-300">
              Service reports provide detailed insights into API usage patterns, user activity, and service performance. 
              Use the filters to analyze specific time periods, services, or user actions.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Force dynamic rendering to ensure server-side session validation
 * This prevents static generation and ensures proper authentication checks
 */
export const dynamic = 'force-dynamic';

/**
 * Revalidate configuration for ISR
 * Set to 0 to always revalidate for real-time report data
 */
export const revalidate = 0;

/**
 * Runtime configuration
 * Use Edge runtime for faster cold starts in serverless environments
 */
export const runtime = 'edge';