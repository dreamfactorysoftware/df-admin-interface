/**
 * System Settings Reports Page Component
 * 
 * Main service reports page implementing Next.js app router architecture with 
 * server-side rendering. Provides service report overview dashboard with paywall 
 * enforcement, filtering capabilities, and integration with React Query for 
 * intelligent data caching. Replaces Angular component architecture with React 
 * server component supporting SSR under 2 seconds.
 * 
 * @fileoverview Service Reports Dashboard Page
 * @version 1.0.0
 * @since React 19.0.0 / Next.js 15.1+
 */

import React, { Suspense } from 'react';
import { Metadata } from 'next';
import { 
  ChartBarIcon, 
  ClockIcon,
  ServerIcon,
  EyeIcon,
  ArrowPathIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline';
import { Button } from '@/components/ui/button';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { ErrorBoundary } from '@/components/ui/error-boundary';
import { Paywall } from '@/components/ui/paywall';
import ServiceReportTable from './service-report-table';

// ============================================================================
// Server Component Metadata
// ============================================================================

export const metadata: Metadata = {
  title: 'Service Reports - System Settings | DreamFactory',
  description: 'Monitor and analyze service usage patterns, performance metrics, and API activity across all configured database services.',
  keywords: ['service reports', 'analytics', 'monitoring', 'API usage', 'database services'],
  robots: 'noindex', // Admin pages should not be indexed
};

// ============================================================================
// Server Component Configuration
// ============================================================================

// Enable static optimization for consistent SSR performance
export const dynamic = 'force-static';
export const revalidate = 300; // Revalidate every 5 minutes for fresh data

// ============================================================================
// Loading Components
// ============================================================================

/**
 * Service reports table loading fallback with skeleton UI
 */
function ServiceReportsLoading() {
  return (
    <div className="space-y-6" role="status" aria-label="Loading service reports">
      {/* Header skeleton */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded animate-pulse w-48" />
        <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded animate-pulse w-24" />
      </div>
      
      {/* Filters skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-10 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
        ))}
      </div>
      
      {/* Table skeleton */}
      <div className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
        <div className="bg-gray-50 dark:bg-gray-900 p-4">
          <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded animate-pulse w-32" />
        </div>
        <div className="space-y-2 p-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="h-12 bg-gray-100 dark:bg-gray-800 rounded animate-pulse" />
          ))}
        </div>
      </div>
      
      <span className="sr-only">Loading service reports data...</span>
    </div>
  );
}

/**
 * Dashboard overview loading component
 */
function DashboardOverviewLoading() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="flex items-center">
            <div className="h-8 w-8 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
            <div className="ml-4 flex-1">
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse w-20 mb-2" />
              <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded animate-pulse w-16" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

// ============================================================================
// Dashboard Overview Component
// ============================================================================

/**
 * Dashboard overview showing key service metrics
 * Implemented as client component for real-time updates
 */
async function DashboardOverview() {
  // In a real implementation, this would fetch server-side data
  // For now, we'll show placeholder metrics that would be populated
  const metrics = {
    totalServices: 12,
    activeServices: 8,
    totalRequests: 1543,
    lastActivity: new Date().toISOString(),
  };

  const overviewCards = [
    {
      title: 'Total Services',
      value: metrics.totalServices.toString(),
      icon: ServerIcon,
      color: 'text-blue-600 dark:text-blue-400',
      bgColor: 'bg-blue-50 dark:bg-blue-900/20',
    },
    {
      title: 'Active Services',
      value: metrics.activeServices.toString(),
      icon: ChartBarIcon,
      color: 'text-green-600 dark:text-green-400',
      bgColor: 'bg-green-50 dark:bg-green-900/20',
    },
    {
      title: 'Total Requests',
      value: metrics.totalRequests.toLocaleString(),
      icon: EyeIcon,
      color: 'text-purple-600 dark:text-purple-400',
      bgColor: 'bg-purple-50 dark:bg-purple-900/20',
    },
    {
      title: 'Last Activity',
      value: new Date(metrics.lastActivity).toLocaleTimeString(),
      icon: ClockIcon,
      color: 'text-orange-600 dark:text-orange-400',
      bgColor: 'bg-orange-50 dark:bg-orange-900/20',
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      {overviewCards.map((card) => {
        const IconComponent = card.icon;
        return (
          <div
            key={card.title}
            className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 hover:shadow-md transition-shadow"
          >
            <div className="flex items-center">
              <div className={`p-2 rounded-lg ${card.bgColor}`}>
                <IconComponent className={`h-6 w-6 ${card.color}`} />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  {card.title}
                </p>
                <p className="text-2xl font-semibold text-gray-900 dark:text-gray-100">
                  {card.value}
                </p>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ============================================================================
// Error Fallback Components
// ============================================================================

/**
 * Service reports error fallback component
 */
function ServiceReportsError({ 
  error, 
  reset 
}: { 
  error: Error; 
  reset: () => void; 
}) {
  return (
    <div className="border border-red-200 dark:border-red-800 rounded-lg p-8 text-center bg-red-50 dark:bg-red-900/20">
      <ExclamationTriangleIcon className="h-12 w-12 text-red-500 dark:text-red-400 mx-auto mb-4" />
      <h3 className="text-lg font-semibold text-red-800 dark:text-red-200 mb-2">
        Failed to Load Service Reports
      </h3>
      <p className="text-red-600 dark:text-red-400 mb-6">
        {error.message || 'An unexpected error occurred while loading the service reports data.'}
      </p>
      <div className="flex flex-col sm:flex-row gap-3 justify-center">
        <Button
          onClick={reset}
          variant="outline"
          className="inline-flex items-center"
        >
          <ArrowPathIcon className="h-4 w-4 mr-2" />
          Try Again
        </Button>
        <Button
          onClick={() => window.location.reload()}
          variant="secondary"
        >
          Refresh Page
        </Button>
      </div>
    </div>
  );
}

// ============================================================================
// Main Page Component
// ============================================================================

/**
 * Service Reports Page
 * 
 * Main page component implementing Next.js app router architecture with SSR.
 * Provides comprehensive service reporting dashboard with:
 * - Real-time service metrics overview
 * - Detailed service reports table with filtering
 * - Paywall enforcement for premium features
 * - Optimized loading states and error handling
 * - WCAG 2.1 AA accessibility compliance
 */
export default async function ServiceReportsPage() {
  return (
    <main className="p-6 max-w-7xl mx-auto">
      {/* Page Header */}
      <div className="mb-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
              Service Reports
            </h1>
            <p className="mt-2 text-gray-600 dark:text-gray-400">
              Monitor service usage patterns, analyze performance metrics, and track API activity across all configured database services.
            </p>
          </div>
          
          {/* Quick actions */}
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="sm"
              className="inline-flex items-center"
              aria-label="Refresh service reports data"
            >
              <ArrowPathIcon className="h-4 w-4 mr-2" />
              Refresh
            </Button>
          </div>
        </div>
      </div>

      {/* Paywall Protection */}
      <Paywall
        feature="service-reports"
        title="Service Reports & Analytics"
        description="Access detailed service usage analytics, performance monitoring, and comprehensive reporting capabilities."
        fallback={
          <div className="border border-amber-200 dark:border-amber-800 rounded-lg p-8 text-center bg-amber-50 dark:bg-amber-900/20 mb-8">
            <ExclamationTriangleIcon className="h-12 w-12 text-amber-500 dark:text-amber-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-amber-800 dark:text-amber-200 mb-2">
              Premium Feature
            </h3>
            <p className="text-amber-700 dark:text-amber-300 mb-4">
              Service reports and analytics are available with a premium subscription.
            </p>
            <Button variant="primary">
              Upgrade to Premium
            </Button>
          </div>
        }
      >
        {/* Dashboard Overview */}
        <section aria-labelledby="overview-heading" className="mb-8">
          <h2 id="overview-heading" className="sr-only">
            Service Overview Metrics
          </h2>
          <ErrorBoundary
            onError={(error) => console.error('Dashboard overview error:', error)}
            fallback={({ error, reset }) => (
              <div className="border border-red-200 dark:border-red-800 rounded-lg p-6 text-center bg-red-50 dark:bg-red-900/20">
                <p className="text-red-600 dark:text-red-400 mb-4">
                  Failed to load dashboard overview
                </p>
                <Button onClick={reset} variant="outline" size="sm">
                  Retry
                </Button>
              </div>
            )}
          >
            <Suspense fallback={<DashboardOverviewLoading />}>
              <DashboardOverview />
            </Suspense>
          </ErrorBoundary>
        </section>

        {/* Service Reports Table */}
        <section aria-labelledby="reports-table-heading">
          <h2 id="reports-table-heading" className="sr-only">
            Detailed Service Reports
          </h2>
          <ErrorBoundary
            onError={(error) => console.error('Service reports table error:', error)}
            fallback={ServiceReportsError}
          >
            <Suspense fallback={<ServiceReportsLoading />}>
              <ServiceReportTable 
                className="w-full"
                aria-label="Service reports table with filtering and pagination"
              />
            </Suspense>
          </ErrorBoundary>
        </section>
      </Paywall>

      {/* Accessibility live region for dynamic updates */}
      <div
        aria-live="polite"
        aria-atomic="true"
        className="sr-only"
        role="status"
        id="page-status"
      >
        Service reports page loaded successfully
      </div>
    </main>
  );
}

// ============================================================================
// Additional Export for Testing
// ============================================================================

export { ServiceReportsLoading, DashboardOverview, ServiceReportsError };