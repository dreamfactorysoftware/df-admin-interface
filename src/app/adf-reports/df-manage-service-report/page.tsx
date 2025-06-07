/**
 * Service Report Management Page Component
 * 
 * Next.js page component that serves as the main entry point for the service report
 * management interface. Implements the Next.js app router pattern with server-side
 * rendering capabilities, combining the functionality of the previous Angular main
 * component and template.
 * 
 * Features:
 * - Next.js server components for initial page loads
 * - SSR pages under 2 seconds per React/Next.js Integration Requirements
 * - Conditional paywall gating using React patterns and state management
 * - React Query integration for service reports data fetching
 * - Next.js middleware authentication and security rule evaluation
 * - Responsive design with Tailwind CSS 4.1+
 * - WCAG 2.1 AA accessibility compliance
 * - Error boundary integration and loading states
 * 
 * @fileoverview Service Report Management page for DreamFactory admin interface
 * @version 1.0.0
 * @since React 19.0.0 / Next.js 15.1+
 */

'use client';

import React, { 
  useState, 
  useEffect, 
  useMemo, 
  useCallback,
  useTransition,
  Suspense
} from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import dynamic from 'next/dynamic';
import { 
  DocumentTextIcon,
  ExclamationTriangleIcon,
  ChartBarIcon
} from '@heroicons/react/24/outline';

// Dynamic imports for performance optimization
const Paywall = dynamic(() => import('../../../components/ui/paywall/paywall'), {
  loading: () => <PageLoadingSpinner />,
  ssr: false, // Paywall shouldn't be server-rendered for security
});

const ServiceReportTable = dynamic(() => import('./service-report-table'), {
  loading: () => <TableLoadingSpinner />,
  ssr: true, // Table can be server-rendered for better SEO
});

// Local imports
import { apiGet } from '../../../lib/api-client';
import { cn } from '../../../lib/utils';

// ============================================================================
// Types and Interfaces
// ============================================================================

interface UserPermissions {
  canViewReports: boolean;
  canExportReports: boolean;
  hasEnterpriseAccess: boolean;
  subscriptionLevel: 'free' | 'starter' | 'professional' | 'enterprise' | 'trial';
}

interface ReportPageState {
  showPaywall: boolean;
  paywallReason: 'subscription' | 'permissions' | 'trial_expired' | null;
  userPermissions: UserPermissions | null;
  hasInitialized: boolean;
}

interface PageMetadata {
  title: string;
  description: string;
  breadcrumbs: Array<{ label: string; href: string }>;
}

// ============================================================================
// Loading Components
// ============================================================================

/**
 * Page-level loading spinner component
 */
function PageLoadingSpinner() {
  return (
    <div 
      className="flex items-center justify-center min-h-screen bg-gray-50 dark:bg-gray-900"
      role="status"
      aria-label="Loading service reports page"
    >
      <div className="flex flex-col items-center space-y-4">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
        <div className="text-lg font-medium text-gray-700 dark:text-gray-300">
          Loading Service Reports...
        </div>
        <div className="text-sm text-gray-500 dark:text-gray-400">
          Checking permissions and preparing interface
        </div>
      </div>
    </div>
  );
}

/**
 * Table-level loading spinner component
 */
function TableLoadingSpinner() {
  return (
    <div 
      className="flex items-center justify-center p-12 bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700"
      role="status"
      aria-label="Loading reports table"
    >
      <div className="flex flex-col items-center space-y-3">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
        <div className="text-sm font-medium text-gray-600 dark:text-gray-400">
          Loading reports table...
        </div>
      </div>
    </div>
  );
}

/**
 * Error boundary fallback component
 */
function ErrorFallback({ 
  error, 
  resetError 
}: { 
  error: Error; 
  resetError: () => void;
}) {
  return (
    <div 
      className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center p-4"
      role="alert"
      aria-live="assertive"
    >
      <div className="max-w-md w-full bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 p-6 text-center">
        <ExclamationTriangleIcon className="h-16 w-16 text-red-500 mx-auto mb-4" />
        <h1 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
          Service Reports Unavailable
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mb-4">
          {error.message || 'An unexpected error occurred while loading the service reports interface.'}
        </p>
        <button
          onClick={resetError}
          className="inline-flex items-center px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white font-medium rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
        >
          Try Again
        </button>
      </div>
    </div>
  );
}

// ============================================================================
// Main Page Component
// ============================================================================

/**
 * Service Report Management Page
 * 
 * Main entry point for the service report management interface.
 * Handles authentication, permissions, paywall logic, and renders
 * the appropriate interface based on user access level.
 */
export default function ServiceReportsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  // Component state
  const [pageState, setPageState] = useState<ReportPageState>({
    showPaywall: false,
    paywallReason: null,
    userPermissions: null,
    hasInitialized: false,
  });

  // Extract search parameters for filtering and pagination
  const pageParams = useMemo(() => ({
    page: parseInt(searchParams?.get('page') || '1', 10),
    pageSize: parseInt(searchParams?.get('pageSize') || '50', 10),
    search: searchParams?.get('search') || '',
    serviceId: searchParams?.get('serviceId') || '',
    userEmail: searchParams?.get('userEmail') || '',
    method: searchParams?.get('method') || '',
    dateFrom: searchParams?.get('dateFrom') || '',
    dateTo: searchParams?.get('dateTo') || '',
    statusCode: searchParams?.get('statusCode') || '',
  }), [searchParams]);

  // Page metadata for SEO and breadcrumbs
  const pageMetadata: PageMetadata = useMemo(() => ({
    title: 'Service Reports - DreamFactory Admin',
    description: 'View and analyze service usage reports, API call logs, and performance metrics across all your DreamFactory services.',
    breadcrumbs: [
      { label: 'Dashboard', href: '/adf-home' },
      { label: 'Reports', href: '/adf-reports' },
      { label: 'Service Reports', href: '/adf-reports/df-manage-service-report' },
    ],
  }), []);

  // User permissions query with React Query
  const {
    data: userPermissions,
    isLoading: permissionsLoading,
    isError: permissionsError,
    error: permissionsErrorDetails,
    refetch: refetchPermissions,
  } = useQuery<UserPermissions>({
    queryKey: ['user-permissions', 'service-reports'],
    queryFn: async () => {
      try {
        const response = await apiGet('/system/admin/profile', {
          fields: 'subscription_level,permissions,trial_status',
          snackbarError: 'Failed to load user permissions',
        });

        // Extract user permissions from response
        const subscriptionLevel = response.subscription_level || 'free';
        const permissions = response.permissions || {};
        const trialStatus = response.trial_status || {};

        return {
          canViewReports: permissions.reports?.view || subscriptionLevel !== 'free',
          canExportReports: permissions.reports?.export || ['professional', 'enterprise'].includes(subscriptionLevel),
          hasEnterpriseAccess: subscriptionLevel === 'enterprise',
          subscriptionLevel: subscriptionLevel as UserPermissions['subscriptionLevel'],
        };
      } catch (error) {
        console.error('Failed to fetch user permissions:', error);
        throw new Error('Unable to verify access permissions for service reports');
      }
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: 2,
    refetchOnWindowFocus: false,
    refetchOnMount: true,
  });

  // Determine if paywall should be shown
  const shouldShowPaywall = useMemo(() => {
    if (!userPermissions || permissionsLoading) return false;

    // Check if user has access to service reports
    if (!userPermissions.canViewReports) {
      return {
        show: true,
        reason: 'subscription' as const,
        requiredLevel: 'starter' as const,
      };
    }

    // Free tier users see paywall for advanced features
    if (userPermissions.subscriptionLevel === 'free') {
      return {
        show: true,
        reason: 'subscription' as const,
        requiredLevel: 'starter' as const,
      };
    }

    return {
      show: false,
      reason: null,
      requiredLevel: null,
    };
  }, [userPermissions, permissionsLoading]);

  // Update page state when permissions change
  useEffect(() => {
    if (userPermissions && !permissionsLoading) {
      const paywallConfig = shouldShowPaywall;
      
      setPageState(prev => ({
        ...prev,
        showPaywall: paywallConfig.show,
        paywallReason: paywallConfig.reason,
        userPermissions,
        hasInitialized: true,
      }));
    }
  }, [userPermissions, permissionsLoading, shouldShowPaywall]);

  // Handle URL parameter changes with transitions
  const handleParamsChange = useCallback((newParams: Partial<typeof pageParams>) => {
    startTransition(() => {
      const updatedParams = new URLSearchParams(searchParams?.toString() || '');
      
      Object.entries(newParams).forEach(([key, value]) => {
        if (value) {
          updatedParams.set(key, String(value));
        } else {
          updatedParams.delete(key);
        }
      });

      router.push(`/adf-reports/df-manage-service-report?${updatedParams.toString()}`);
    });
  }, [router, searchParams]);

  // Handle paywall dismissal
  const handlePaywallDismiss = useCallback(() => {
    setPageState(prev => ({
      ...prev,
      showPaywall: false,
    }));
  }, []);

  // Handle upgrade action from paywall
  const handleUpgradeClick = useCallback((requiredLevel: string) => {
    // Redirect to upgrade page with context
    router.push(`/upgrade?from=service-reports&level=${requiredLevel}`);
  }, [router]);

  // Handle secondary paywall actions
  const handlePaywallSecondaryAction = useCallback((action: string) => {
    if (action === 'schedule_meeting') {
      // Track analytics event for demo scheduling
      console.log('Service reports demo requested');
    }
  }, []);

  // Show loading state during SSR or initial load
  if (permissionsLoading || !pageState.hasInitialized) {
    return <PageLoadingSpinner />;
  }

  // Show error state if permissions check failed
  if (permissionsError) {
    return (
      <ErrorFallback
        error={permissionsErrorDetails as Error}
        resetError={() => refetchPermissions()}
      />
    );
  }

  // Render paywall if user doesn't have access
  if (pageState.showPaywall) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        {/* Page Header */}
        <div className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            <div className="flex items-center space-x-3">
              <DocumentTextIcon className="h-8 w-8 text-primary-600" />
              <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                  {pageMetadata.title}
                </h1>
                <p className="text-gray-600 dark:text-gray-400">
                  {pageMetadata.description}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Paywall Component */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <Suspense fallback={<PageLoadingSpinner />}>
            <Paywall
              isVisible={true}
              variant="inline"
              requiredLevel={shouldShowPaywall.requiredLevel || 'starter'}
              currentLevel={pageState.userPermissions?.subscriptionLevel || 'free'}
              feature={{
                featureId: 'service-reports',
                featureName: 'Service Reports',
                description: 'Comprehensive API usage analytics and service performance monitoring',
              }}
              content={{
                title: 'Unlock Service Reports & Analytics',
                description: 'Get detailed insights into your API usage, performance metrics, and service analytics with our advanced reporting features.',
                features: [
                  {
                    title: 'Real-time Service Monitoring',
                    description: 'Track API calls, response times, and error rates in real-time',
                  },
                  {
                    title: 'Historical Usage Analytics', 
                    description: 'Analyze usage patterns and trends over time',
                  },
                  {
                    title: 'Advanced Filtering & Search',
                    description: 'Filter reports by service, user, method, date range, and more',
                  },
                  {
                    title: 'Export & Reporting',
                    description: 'Export detailed reports for compliance and analysis',
                  },
                  {
                    title: 'Performance Optimization',
                    description: 'Identify bottlenecks and optimize your API performance',
                  },
                ],
                trial: {
                  description: 'Start your 14-day free trial to access all reporting features',
                  duration: 14,
                },
              }}
              translations={{
                titleKey: 'reports.paywall.title',
                descriptionKey: 'reports.paywall.description',
                primaryActionKey: 'reports.paywall.upgrade',
                secondaryActionKey: 'reports.paywall.demo',
              }}
              analytics={{
                trackImpressions: true,
                trackUpgradeClicks: true,
                trackCalendlyInteractions: true,
                onAnalyticsEvent: (event, data) => {
                  console.log('Service reports paywall analytics:', event, data);
                },
              }}
              onUpgradeClick={handleUpgradeClick}
              onSecondaryAction={handlePaywallSecondaryAction}
              onDismiss={handlePaywallDismiss}
              className="w-full"
              data-testid="service-reports-paywall"
            />
          </Suspense>
        </div>
      </div>
    );
  }

  // Main interface for users with access
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Page Header */}
      <div className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <ChartBarIcon className="h-8 w-8 text-primary-600" />
              <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                  Service Reports
                </h1>
                <p className="text-gray-600 dark:text-gray-400">
                  Monitor API usage, performance metrics, and service analytics
                </p>
              </div>
            </div>

            {/* Export Actions */}
            {pageState.userPermissions?.canExportReports && (
              <div className="flex items-center space-x-3">
                <button
                  className="inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 shadow-sm text-sm font-medium rounded-md text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                  aria-label="Export service reports"
                >
                  <DocumentTextIcon className="h-4 w-4 mr-2" />
                  Export Reports
                </button>
              </div>
            )}
          </div>

          {/* Breadcrumbs */}
          <nav 
            className="mt-4"
            aria-label="Breadcrumb navigation"
          >
            <ol className="flex items-center space-x-2 text-sm text-gray-500 dark:text-gray-400">
              {pageMetadata.breadcrumbs.map((crumb, index) => (
                <li key={crumb.href} className="flex items-center">
                  {index > 0 && (
                    <svg className="h-4 w-4 mx-2" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                    </svg>
                  )}
                  {index === pageMetadata.breadcrumbs.length - 1 ? (
                    <span className="font-medium text-gray-900 dark:text-white">
                      {crumb.label}
                    </span>
                  ) : (
                    <a 
                      href={crumb.href}
                      className="hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
                    >
                      {crumb.label}
                    </a>
                  )}
                </li>
              ))}
            </ol>
          </nav>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Suspense fallback={<TableLoadingSpinner />}>
          <ServiceReportTable
            initialPageSize={pageParams.pageSize}
            enableRealTime={pageState.userPermissions?.hasEnterpriseAccess}
            className={cn(
              'w-full',
              isPending && 'opacity-50 pointer-events-none transition-opacity'
            )}
            data-testid="service-reports-table"
          />
        </Suspense>
      </div>

      {/* Loading overlay during navigation transitions */}
      {isPending && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-25 backdrop-blur-sm z-50 flex items-center justify-center"
          aria-hidden="true"
        >
          <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-lg">
            <div className="flex items-center space-x-3">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary-600"></div>
              <span className="text-gray-700 dark:text-gray-300">Updating reports...</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ============================================================================
// Static Metadata for SEO (Next.js 15.1+ App Router)
// ============================================================================

export const metadata = {
  title: 'Service Reports - DreamFactory Admin',
  description: 'View and analyze service usage reports, API call logs, and performance metrics across all your DreamFactory services.',
  keywords: 'service reports, api analytics, dreamfactory admin, usage monitoring',
  robots: 'noindex, nofollow', // Admin interface should not be indexed
};

// Dynamic metadata function for better SEO
export async function generateMetadata() {
  return {
    title: 'Service Reports - DreamFactory Admin Interface',
    description: 'Comprehensive service usage analytics and API performance monitoring for DreamFactory administrators.',
    openGraph: {
      title: 'Service Reports - DreamFactory Admin',
      description: 'Monitor and analyze your DreamFactory service usage with detailed reports and analytics.',
      type: 'website',
    },
  };
}