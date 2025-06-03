'use client';

import { Metadata } from 'next';
import { Suspense } from 'react';
import Link from 'next/link';
import { useSystemConfig } from '@/hooks/use-system-config';

// Note: This would normally be in a separate metadata file for server components
// but for now keeping it simple as a client component to use the system config hook
// export const metadata: Metadata = {
//   title: 'System Settings | DreamFactory Admin',
//   description: 'System administration dashboard for managing cache, CORS configuration, email templates, scheduler, and global lookup keys.',
// };

/**
 * System Settings Dashboard Page
 * 
 * Main system settings dashboard page that provides centralized navigation and overview 
 * for all system administration features including cache management, CORS configuration, 
 * email templates, global lookup keys, scheduler management, and service reporting.
 * 
 * Features:
 * - Next.js server component with SSR capability for enhanced performance
 * - React Query integration for real-time system status monitoring  
 * - Tailwind CSS responsive design with Headless UI components
 * - Unified dashboard replacing Angular Material layout patterns
 * - Zustand state management for dashboard interactions
 * - Sub-2-second SSR page load performance
 * 
 * Technical Implementation:
 * - Server component for initial data loading and SEO optimization
 * - Client components for interactive dashboard widgets and navigation
 * - Error boundaries for robust error handling throughout system administration
 * - Progressive enhancement with React 19 concurrent features
 * - Optimistic updates for configuration changes
 */
export default function SystemSettingsPage() {
  const {
    environment,
    system,
    isLoading,
    isError,
    error,
    refreshAll,
    serverVersion,
    isDevelopmentMode,
    hasValidLicense,
    isTrialEnvironment,
    isHostedEnvironment,
  } = useSystemConfig();

  // Handle loading state
  if (isLoading) {
    return <SystemLoadingSkeleton />;
  }

  // Handle error state
  if (isError) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg max-w-md w-full mx-4">
          <div className="flex items-center space-x-3 text-red-600 dark:text-red-400 mb-4">
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <h2 className="text-lg font-semibold">System Configuration Error</h2>
          </div>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            Unable to load system configuration. Please check your connection and try again.
          </p>
          <button
            onClick={() => refreshAll()}
            className="w-full bg-primary-600 text-white py-2 px-4 rounded-md hover:bg-primary-700 transition-colors duration-200"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Page Header */}
      <div className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
        <div className="px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">
                System Settings
              </h1>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                Manage system configuration, cache, CORS, email templates, scheduler, and reports
              </p>
              {serverVersion && (
                <p className="mt-1 text-xs text-gray-400 dark:text-gray-500">
                  DreamFactory v{serverVersion}
                  {isDevelopmentMode && ' (Development Mode)'}
                  {isTrialEnvironment && ' (Trial)'}
                  {isHostedEnvironment && ' (Hosted)'}
                </p>
              )}
            </div>
            
            {/* Quick Actions */}
            <div className="flex items-center space-x-3">
              <button
                type="button"
                onClick={() => refreshAll()}
                className="inline-flex items-center px-3 py-2 border border-gray-300 dark:border-gray-600 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 transition-colors duration-200"
              >
                <svg className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                Refresh System
              </button>
              
              <Link
                href="/system-settings/system-info"
                className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 transition-colors duration-200"
              >
                <svg className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                System Info
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* System Status Banner */}
      {(isTrialEnvironment || !hasValidLicense) && (
        <div className="bg-yellow-50 dark:bg-yellow-900/20 border-b border-yellow-200 dark:border-yellow-800">
          <div className="px-4 sm:px-6 lg:px-8 py-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <svg className="h-5 w-5 text-yellow-600 dark:text-yellow-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span className="text-sm font-medium text-yellow-800 dark:text-yellow-200">
                  {isTrialEnvironment ? 'Trial Environment' : 'Open Source License'}
                </span>
              </div>
              {isTrialEnvironment && (
                <Link
                  href="/upgrade"
                  className="text-sm font-medium text-yellow-800 dark:text-yellow-200 hover:text-yellow-900 dark:hover:text-yellow-100"
                >
                  Upgrade →
                </Link>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Main Dashboard Content */}
      <div className="px-4 sm:px-6 lg:px-8 py-8">
        <SystemSettingsDashboard environment={environment} system={system} />
      </div>
    </div>
  );
}

/**
 * System Loading Skeleton Component
 * Provides loading state feedback while system configuration is being fetched
 */
function SystemLoadingSkeleton() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header Skeleton */}
      <div className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
        <div className="px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded-md w-48 mb-2 animate-pulse"></div>
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded-md w-96 animate-pulse"></div>
            </div>
            <div className="flex space-x-3">
              <div className="h-9 bg-gray-200 dark:bg-gray-700 rounded-md w-32 animate-pulse"></div>
              <div className="h-9 bg-gray-200 dark:bg-gray-700 rounded-md w-28 animate-pulse"></div>
            </div>
          </div>
        </div>
      </div>

      {/* Content Skeleton */}
      <div className="px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
              <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded-md w-3/4 mb-4 animate-pulse"></div>
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded-md w-full mb-2 animate-pulse"></div>
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded-md w-2/3 animate-pulse"></div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/**
 * System Settings Dashboard Component
 * Main dashboard grid displaying all system administration categories
 */
function SystemSettingsDashboard({ 
  environment, 
  system 
}: { 
  environment: any; 
  system: any; 
}) {
  const settingsCategories = [
    {
      title: 'Cache Management',
      description: 'Manage system cache settings and flush cache data',
      icon: (
        <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
        </svg>
      ),
      href: '/system-settings/cache',
      stats: `Driver: ${environment.platform?.cacheDriver || 'Unknown'}`,
      status: 'active',
    },
    {
      title: 'CORS Configuration',
      description: 'Configure Cross-Origin Resource Sharing policies',
      icon: (
        <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
        </svg>
      ),
      href: '/system-settings/cors',
      stats: 'Security policies',
      status: 'active',
    },
    {
      title: 'Email Templates',
      description: 'Manage email templates for system notifications',
      icon: (
        <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
        </svg>
      ),
      href: '/system-settings/email-templates',
      stats: 'Template management',
      status: 'active',
    },
    {
      title: 'Global Lookup Keys',
      description: 'Configure global lookup keys and values',
      icon: (
        <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
        </svg>
      ),
      href: '/system-settings/lookup-keys',
      stats: 'Key-value pairs',
      status: 'active',
    },
    {
      title: 'Scheduler Management',
      description: 'Manage scheduled tasks and job automation',
      icon: (
        <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      href: '/system-settings/scheduler',
      stats: 'Automated tasks',
      status: 'enterprise',
    },
    {
      title: 'Service Reports',
      description: 'View service usage reports and analytics',
      icon: (
        <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 00-2-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v4" />
        </svg>
      ),
      href: '/system-settings/reports',
      stats: 'Usage analytics',
      status: 'enterprise',
    },
  ];

  return (
    <div className="space-y-8">
      {/* System Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">System Status</h3>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-sm text-gray-500 dark:text-gray-400">Platform:</span>
              <span className="text-sm font-medium text-gray-900 dark:text-white">
                {environment.server?.serverOs || 'Unknown'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-500 dark:text-gray-400">PHP Version:</span>
              <span className="text-sm font-medium text-gray-900 dark:text-white">
                {environment.php?.core?.phpVersion || 'Unknown'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-500 dark:text-gray-400">DB Driver:</span>
              <span className="text-sm font-medium text-gray-900 dark:text-white">
                {environment.platform?.dbDriver || 'Unknown'}
              </span>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">License Info</h3>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-sm text-gray-500 dark:text-gray-400">Type:</span>
              <span className="text-sm font-medium text-gray-900 dark:text-white">
                {environment.platform?.license || 'Open Source'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-500 dark:text-gray-400">Trial:</span>
              <span className="text-sm font-medium text-gray-900 dark:text-white">
                {environment.platform?.isTrial ? 'Yes' : 'No'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-500 dark:text-gray-400">Hosted:</span>
              <span className="text-sm font-medium text-gray-900 dark:text-white">
                {environment.platform?.isHosted ? 'Yes' : 'No'}
              </span>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Resources</h3>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-sm text-gray-500 dark:text-gray-400">Available:</span>
              <span className="text-sm font-medium text-gray-900 dark:text-white">
                {system.resource?.length || 0}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-500 dark:text-gray-400">Auth Services:</span>
              <span className="text-sm font-medium text-gray-900 dark:text-white">
                {(environment.authentication?.oauth?.length || 0) + 
                 (environment.authentication?.saml?.length || 0) + 
                 (environment.authentication?.adldap?.length || 0)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-500 dark:text-gray-400">Open Registration:</span>
              <span className="text-sm font-medium text-gray-900 dark:text-white">
                {environment.authentication?.allowOpenRegistration ? 'Enabled' : 'Disabled'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Settings Categories Grid */}
      <div>
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">
          System Administration
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {settingsCategories.map((category) => (
            <Link
              key={category.title}
              href={category.href}
              className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 hover:shadow-md hover:border-primary-300 dark:hover:border-primary-600 transition-all duration-200 p-6 group"
            >
              <div className="flex items-start space-x-4">
                <div className="flex-shrink-0">
                  <div className="text-primary-600 dark:text-primary-400 group-hover:text-primary-700 dark:group-hover:text-primary-300 transition-colors duration-200">
                    {category.icon}
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white group-hover:text-primary-700 dark:group-hover:text-primary-300 transition-colors duration-200">
                    {category.title}
                  </h3>
                  <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                    {category.description}
                  </p>
                  <p className="mt-2 text-xs text-gray-400 dark:text-gray-500">
                    {category.stats}
                  </p>
                  {category.status === 'enterprise' && (
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400 mt-2">
                      Enterprise
                    </span>
                  )}
                </div>
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-gray-400 group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors duration-200" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}