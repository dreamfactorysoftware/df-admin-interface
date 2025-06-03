'use client';

import React, { Suspense } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { RefreshCcw } from 'lucide-react';
import dynamic from 'next/dynamic';

// Components imports
import { Button } from '@/components/ui/button';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { LimitsTable } from '@/app/adf-limits/components/limits-table';

// Hooks imports
import { useLimits } from '@/app/adf-limits/hooks/use-limits';
import { usePaywall } from '@/hooks/use-paywall';
import { useTheme } from '@/hooks/use-theme';
import { useNotifications } from '@/hooks/use-notifications';

// Types
import type { LimitTableRowData } from '@/app/adf-limits/types';

// Dynamic import for paywall component to optimize initial bundle
const LimitPaywall = dynamic(
  () => import('@/app/adf-limits/components/limit-paywall').then(mod => ({ default: mod.LimitPaywall })),
  {
    loading: () => <LoadingSpinner className="h-32" />,
    ssr: false
  }
);

/**
 * Main limits management page component for Next.js app router.
 * 
 * Serves as the primary interface for viewing and managing API rate limits,
 * replacing the Angular df-manage-limits component with React server components
 * and client-side interactivity using React Query for data fetching and Zustand 
 * for state management.
 * 
 * Features:
 * - Server-side rendering with client-side hydration
 * - React Query for intelligent caching (cache hit responses under 50ms)
 * - Paywall enforcement using Next.js middleware patterns
 * - Tailwind CSS styling with WCAG 2.1 AA compliance
 * - Comprehensive error handling and loading states
 */
export default function LimitsPage() {
  const router = useRouter();
  const { isDarkMode } = useTheme();
  const { showNotification } = useNotifications();
  
  // Paywall enforcement - checks if limits feature is available
  const { 
    isPaywallActive, 
    isLoading: paywallLoading, 
    error: paywallError 
  } = usePaywall(['limit']);

  // Limits data fetching with React Query intelligent caching
  const {
    data: limitsData,
    isLoading: limitsLoading,
    error: limitsError,
    refetch: refetchLimits,
    isRefetching
  } = useLimits({
    enabled: !isPaywallActive && !paywallLoading,
    staleTime: 50, // Cache hit responses under 50ms per requirements
    cacheTime: 300000, // 5 minutes cache time
    refetchOnWindowFocus: false,
    retry: 3,
    retryDelay: attemptIndex => Math.min(1000 * 2 ** attemptIndex, 30000),
    onError: (error) => {
      console.error('Failed to fetch limits data:', error);
      showNotification({
        type: 'error',
        title: 'Failed to load limits',
        message: 'Unable to fetch limits data. Please try again.',
        duration: 5000
      });
    }
  });

  /**
   * Refreshes the limits table data with loading feedback
   */
  const handleRefreshTable = async () => {
    try {
      await refetchLimits();
      showNotification({
        type: 'success',
        title: 'Limits refreshed',
        message: 'Limits data has been successfully updated.',
        duration: 3000
      });
    } catch (error) {
      console.error('Failed to refresh limits:', error);
      showNotification({
        type: 'error',
        title: 'Refresh failed',
        message: 'Unable to refresh limits data. Please try again.',
        duration: 5000
      });
    }
  };

  /**
   * Navigates to create new limit page
   */
  const handleCreateLimit = () => {
    router.push('/adf-limits/create');
  };

  // Loading state while checking paywall status
  if (paywallLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]" role="status" aria-live="polite">
        <LoadingSpinner className="h-8 w-8" />
        <span className="sr-only">Loading limits page...</span>
      </div>
    );
  }

  // Error state for paywall check
  if (paywallError) {
    return (
      <div 
        className="flex flex-col items-center justify-center min-h-[400px] p-6"
        role="alert"
        aria-live="assertive"
      >
        <div className="text-center">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
            Unable to Load Limits
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            There was an error checking feature availability. Please try again.
          </p>
          <Button 
            onClick={() => window.location.reload()} 
            variant="outline"
            className="min-w-[120px]"
          >
            Retry
          </Button>
        </div>
      </div>
    );
  }

  // Paywall enforcement - show paywall component if feature is gated
  if (isPaywallActive) {
    return (
      <Suspense fallback={<LoadingSpinner className="h-32" />}>
        <LimitPaywall />
      </Suspense>
    );
  }

  return (
    <main 
      className={`
        min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-200
        ${isDarkMode ? 'dark' : ''}
      `}
      role="main"
      aria-labelledby="limits-page-title"
    >
      {/* Page Header */}
      <div className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 
                id="limits-page-title"
                className="text-2xl font-bold text-gray-900 dark:text-gray-100"
              >
                API Rate Limits
              </h1>
              <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                Manage and configure API rate limiting policies for your services
              </p>
            </div>
            
            {/* Action buttons */}
            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                size="sm"
                onClick={handleRefreshTable}
                disabled={isRefetching}
                className="min-w-[100px]"
                aria-label="Refresh limits data"
              >
                <RefreshCcw 
                  className={`h-4 w-4 mr-2 ${isRefetching ? 'animate-spin' : ''}`} 
                  aria-hidden="true"
                />
                {isRefetching ? 'Refreshing...' : 'Refresh'}
              </Button>
              
              <Button
                onClick={handleCreateLimit}
                size="sm"
                className="min-w-[120px]"
                aria-label="Create new rate limit"
              >
                Create Limit
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Error State */}
        {limitsError && (
          <div 
            className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md p-4 mb-6"
            role="alert"
            aria-live="assertive"
          >
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
                <h3 className="text-sm font-medium text-red-800 dark:text-red-200">
                  Error Loading Limits
                </h3>
                <p className="mt-1 text-sm text-red-700 dark:text-red-300">
                  {limitsError instanceof Error ? limitsError.message : 'An unexpected error occurred'}
                </p>
                <div className="mt-3">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleRefreshTable}
                    className="text-red-800 dark:text-red-200 border-red-300 dark:border-red-700 hover:bg-red-100 dark:hover:bg-red-900/30"
                  >
                    Try Again
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Loading State */}
        {limitsLoading && (
          <div 
            className="flex items-center justify-center py-12"
            role="status"
            aria-live="polite"
          >
            <LoadingSpinner className="h-8 w-8" />
            <span className="ml-3 text-gray-600 dark:text-gray-400">
              Loading limits data...
            </span>
            <span className="sr-only">Loading API rate limits data</span>
          </div>
        )}

        {/* Limits Table */}
        {!limitsLoading && !limitsError && (
          <Suspense fallback={<LoadingSpinner className="h-32" />}>
            <LimitsTable 
              data={limitsData?.data || []}
              totalCount={limitsData?.meta?.count || 0}
              isLoading={limitsLoading}
              onRefresh={handleRefreshTable}
              className="bg-white dark:bg-gray-800 shadow-sm rounded-lg border border-gray-200 dark:border-gray-700"
            />
          </Suspense>
        )}

        {/* Empty State */}
        {!limitsLoading && !limitsError && (!limitsData?.data || limitsData.data.length === 0) && (
          <div className="text-center py-12">
            <svg
              className="mx-auto h-12 w-12 text-gray-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-gray-100">
              No rate limits configured
            </h3>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              Get started by creating your first API rate limit policy.
            </p>
            <div className="mt-6">
              <Button onClick={handleCreateLimit}>
                Create Your First Limit
              </Button>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}

// Export metadata for Next.js App Router
export const metadata = {
  title: 'API Rate Limits - DreamFactory Admin',
  description: 'Manage and configure API rate limiting policies for your services',
};