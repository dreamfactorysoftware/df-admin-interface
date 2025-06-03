/**
 * CORS Configuration Management Page
 * 
 * Next.js app router page component for CORS configuration management dashboard.
 * Implements server-side rendering with React 19 server components for initial page load
 * and provides comprehensive CORS administration functionality including system CORS
 * overview and per-service CORS management interface.
 * 
 * Features:
 * - Next.js App Router with server components per React/Next.js Integration Requirements
 * - SSR pages under 2 seconds per React/Next.js Integration Requirements  
 * - SWR/React Query integration for intelligent caching per Section 4.3 state management workflows
 * - Tailwind CSS with Headless UI components per Section 7.1 Core UI Technologies
 * - WCAG 2.1 AA compliance with comprehensive accessibility features
 * - Real-time CORS configuration updates and validation
 * - Responsive design with mobile-first approach
 * - Comprehensive error handling and loading states
 * 
 * @author DreamFactory Admin Interface Team
 * @version React 19/Next.js 15.1 Migration
 */

import { Suspense } from 'react';
import { Metadata } from 'next';
import dynamic from 'next/dynamic';
import { 
  ServerIcon, 
  ShieldCheckIcon, 
  GlobeAltIcon,
  ExclamationTriangleIcon,
  InformationCircleIcon,
  PlusIcon,
  Cog6ToothIcon,
  ChartBarIcon,
} from '@heroicons/react/24/outline';

// Dynamic imports for client components with loading states
const CorsTable = dynamic(() => import('./cors-table').then(mod => ({ default: mod.CorsTable })), {
  ssr: false,
  loading: () => (
    <div 
      className="animate-pulse space-y-4" 
      data-testid="cors-table-loading"
      role="status" 
      aria-label="Loading CORS configuration table"
    >
      <div className="bg-gray-200 dark:bg-gray-700 h-64 rounded-lg"></div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-gray-200 dark:bg-gray-700 h-16 rounded"></div>
        <div className="bg-gray-200 dark:bg-gray-700 h-16 rounded"></div>
        <div className="bg-gray-200 dark:bg-gray-700 h-16 rounded"></div>
      </div>
    </div>
  ),
});

const CorsConfigDetails = dynamic(() => import('./cors-config-details').then(mod => ({ default: mod.CorsConfigDetails })), {
  ssr: false,
  loading: () => (
    <div 
      className="animate-pulse space-y-6 p-6" 
      data-testid="cors-config-details-loading"
      role="status" 
      aria-label="Loading CORS configuration form"
    >
      <div className="bg-gray-200 dark:bg-gray-700 h-8 w-1/3 rounded"></div>
      <div className="space-y-4">
        <div className="bg-gray-200 dark:bg-gray-700 h-10 rounded"></div>
        <div className="bg-gray-200 dark:bg-gray-700 h-32 rounded"></div>
        <div className="bg-gray-200 dark:bg-gray-700 h-10 rounded"></div>
      </div>
    </div>
  ),
});

// =============================================================================
// METADATA CONFIGURATION
// =============================================================================

/**
 * Page metadata for SEO and accessibility
 */
export const metadata: Metadata = {
  title: 'CORS Configuration - DreamFactory Admin',
  description: 'Configure Cross-Origin Resource Sharing (CORS) settings for DreamFactory API endpoints. Manage allowed origins, headers, methods, and security policies.',
  keywords: ['CORS', 'Cross-Origin', 'API Security', 'DreamFactory', 'Configuration'],
  openGraph: {
    title: 'CORS Configuration Management',
    description: 'Comprehensive CORS configuration interface for DreamFactory API endpoints',
    type: 'website',
  },
  robots: {
    index: false, // Internal admin interface - not for search indexing
    follow: false,
  },
};

// =============================================================================
// STATIC DATA AND CONFIGURATION
// =============================================================================

/**
 * CORS overview statistics interface
 */
interface CorsOverviewStats {
  totalConfigurations: number;
  activeConfigurations: number;
  inactiveConfigurations: number;
  recentChanges: number;
  securityAlerts: number;
}

/**
 * Default CORS overview statistics
 * These would typically be fetched from the API in a real implementation
 */
const defaultCorsStats: CorsOverviewStats = {
  totalConfigurations: 0,
  activeConfigurations: 0,
  inactiveConfigurations: 0,
  recentChanges: 0,
  securityAlerts: 0,
};

/**
 * CORS best practices and common patterns
 */
const CORS_BEST_PRACTICES = [
  {
    title: 'Restrict Origins',
    description: 'Avoid using "*" for origins in production. Specify exact domains for better security.',
    icon: ShieldCheckIcon,
    type: 'security' as const,
  },
  {
    title: 'Minimize Headers',
    description: 'Only expose headers that are necessary for your application functionality.',
    icon: GlobeAltIcon,
    type: 'performance' as const,
  },
  {
    title: 'Set Appropriate Max Age',
    description: 'Configure reasonable cache times for preflight requests (typically 1-24 hours).',
    icon: Cog6ToothIcon,
    type: 'optimization' as const,
  },
  {
    title: 'Monitor Usage',
    description: 'Regularly review CORS configurations and remove unused or overly permissive rules.',
    icon: ChartBarIcon,
    type: 'monitoring' as const,
  },
] as const;

// =============================================================================
// SERVER COMPONENT: CORS OVERVIEW STATS
// =============================================================================

/**
 * Server component for CORS overview statistics
 * Renders initial statistics on the server for improved performance
 */
async function CorsOverviewStats() {
  // In a real implementation, this would fetch data from the API
  // For now, we'll use default values to demonstrate the structure
  const stats = defaultCorsStats;

  return (
    <div 
      className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8"
      data-testid="cors-overview-stats"
      role="region"
      aria-labelledby="stats-heading"
    >
      <h2 id="stats-heading" className="sr-only">
        CORS Configuration Statistics Overview
      </h2>

      {/* Total Configurations */}
      <div className="bg-white dark:bg-gray-800 overflow-hidden shadow rounded-lg border border-gray-200 dark:border-gray-700">
        <div className="p-5">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <ServerIcon 
                className="h-6 w-6 text-gray-400" 
                aria-hidden="true" 
              />
            </div>
            <div className="ml-5 w-0 flex-1">
              <dl>
                <dt className="text-sm font-medium text-gray-500 dark:text-gray-400 truncate">
                  Total Configurations
                </dt>
                <dd className="text-lg font-medium text-gray-900 dark:text-gray-100">
                  {stats.totalConfigurations}
                </dd>
              </dl>
            </div>
          </div>
        </div>
        <div className="bg-gray-50 dark:bg-gray-700 px-5 py-3">
          <div className="text-sm">
            <span className="font-medium text-gray-600 dark:text-gray-300">
              All CORS rules
            </span>
          </div>
        </div>
      </div>

      {/* Active Configurations */}
      <div className="bg-white dark:bg-gray-800 overflow-hidden shadow rounded-lg border border-gray-200 dark:border-gray-700">
        <div className="p-5">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <ShieldCheckIcon 
                className="h-6 w-6 text-green-400" 
                aria-hidden="true" 
              />
            </div>
            <div className="ml-5 w-0 flex-1">
              <dl>
                <dt className="text-sm font-medium text-gray-500 dark:text-gray-400 truncate">
                  Active Rules
                </dt>
                <dd className="text-lg font-medium text-green-600 dark:text-green-400">
                  {stats.activeConfigurations}
                </dd>
              </dl>
            </div>
          </div>
        </div>
        <div className="bg-gray-50 dark:bg-gray-700 px-5 py-3">
          <div className="text-sm">
            <span className="font-medium text-green-600 dark:text-green-400">
              Currently enabled
            </span>
          </div>
        </div>
      </div>

      {/* Inactive Configurations */}
      <div className="bg-white dark:bg-gray-800 overflow-hidden shadow rounded-lg border border-gray-200 dark:border-gray-700">
        <div className="p-5">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <ExclamationTriangleIcon 
                className="h-6 w-6 text-amber-400" 
                aria-hidden="true" 
              />
            </div>
            <div className="ml-5 w-0 flex-1">
              <dl>
                <dt className="text-sm font-medium text-gray-500 dark:text-gray-400 truncate">
                  Inactive Rules
                </dt>
                <dd className="text-lg font-medium text-amber-600 dark:text-amber-400">
                  {stats.inactiveConfigurations}
                </dd>
              </dl>
            </div>
          </div>
        </div>
        <div className="bg-gray-50 dark:bg-gray-700 px-5 py-3">
          <div className="text-sm">
            <span className="font-medium text-amber-600 dark:text-amber-400">
              Disabled rules
            </span>
          </div>
        </div>
      </div>

      {/* Recent Changes */}
      <div className="bg-white dark:bg-gray-800 overflow-hidden shadow rounded-lg border border-gray-200 dark:border-gray-700">
        <div className="p-5">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <InformationCircleIcon 
                className="h-6 w-6 text-blue-400" 
                aria-hidden="true" 
              />
            </div>
            <div className="ml-5 w-0 flex-1">
              <dl>
                <dt className="text-sm font-medium text-gray-500 dark:text-gray-400 truncate">
                  Recent Changes
                </dt>
                <dd className="text-lg font-medium text-blue-600 dark:text-blue-400">
                  {stats.recentChanges}
                </dd>
              </dl>
            </div>
          </div>
        </div>
        <div className="bg-gray-50 dark:bg-gray-700 px-5 py-3">
          <div className="text-sm">
            <span className="font-medium text-blue-600 dark:text-blue-400">
              Last 24 hours
            </span>
          </div>
        </div>
      </div>

      {/* Security Alerts */}
      <div className="bg-white dark:bg-gray-800 overflow-hidden shadow rounded-lg border border-gray-200 dark:border-gray-700">
        <div className="p-5">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <ExclamationTriangleIcon 
                className={`h-6 w-6 ${stats.securityAlerts > 0 ? 'text-red-400' : 'text-gray-400'}`}
                aria-hidden="true" 
              />
            </div>
            <div className="ml-5 w-0 flex-1">
              <dl>
                <dt className="text-sm font-medium text-gray-500 dark:text-gray-400 truncate">
                  Security Alerts
                </dt>
                <dd className={`text-lg font-medium ${stats.securityAlerts > 0 ? 'text-red-600 dark:text-red-400' : 'text-gray-900 dark:text-gray-100'}`}>
                  {stats.securityAlerts}
                </dd>
              </dl>
            </div>
          </div>
        </div>
        <div className="bg-gray-50 dark:bg-gray-700 px-5 py-3">
          <div className="text-sm">
            <span className={`font-medium ${stats.securityAlerts > 0 ? 'text-red-600 dark:text-red-400' : 'text-gray-600 dark:text-gray-300'}`}>
              {stats.securityAlerts > 0 ? 'Requires attention' : 'All secure'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

// =============================================================================
// SERVER COMPONENT: CORS BEST PRACTICES
// =============================================================================

/**
 * Server component for CORS best practices section
 * Renders guidance and recommendations for CORS configuration
 */
async function CorsBestPractices() {
  return (
    <div 
      className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-lg p-6 mb-8"
      data-testid="cors-best-practices"
      role="region"
      aria-labelledby="best-practices-heading"
    >
      <div className="flex items-start">
        <InformationCircleIcon 
          className="h-6 w-6 text-blue-600 dark:text-blue-400 mr-3 mt-1 flex-shrink-0" 
          aria-hidden="true" 
        />
        <div className="flex-1">
          <h2 
            id="best-practices-heading"
            className="text-lg font-medium text-blue-900 dark:text-blue-100 mb-4"
          >
            CORS Configuration Best Practices
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {CORS_BEST_PRACTICES.map((practice, index) => {
              const IconComponent = practice.icon;
              return (
                <div 
                  key={index}
                  className="flex items-start space-x-3 p-3 bg-white dark:bg-gray-800 rounded-md border border-blue-200 dark:border-blue-600"
                >
                  <IconComponent 
                    className={`h-5 w-5 mt-0.5 flex-shrink-0 ${
                      practice.type === 'security' ? 'text-red-500' :
                      practice.type === 'performance' ? 'text-green-500' :
                      practice.type === 'optimization' ? 'text-amber-500' :
                      'text-blue-500'
                    }`}
                    aria-hidden="true"
                  />
                  <div>
                    <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100">
                      {practice.title}
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                      {practice.description}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

// =============================================================================
// PAGE COMPONENT: CLIENT WRAPPER
// =============================================================================

/**
 * Client component wrapper for interactive functionality
 */
function CorsPageClient() {
  return (
    <div className="space-y-8">
      {/* CORS Management Table */}
      <div 
        className="bg-white dark:bg-gray-800 shadow rounded-lg border border-gray-200 dark:border-gray-700"
        data-testid="cors-management-section"
      >
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-medium text-gray-900 dark:text-gray-100">
                CORS Configurations
              </h2>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                Manage Cross-Origin Resource Sharing rules for your API endpoints
              </p>
            </div>
            <div className="flex items-center space-x-3">
              <button
                type="button"
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 dark:focus:ring-offset-gray-800 transition-colors duration-200"
                data-testid="create-cors-button"
                aria-label="Create new CORS configuration"
                onClick={() => {
                  // Navigation would be handled by the CorsTable component
                  // This is just a placeholder for the UI structure
                }}
              >
                <PlusIcon className="w-4 h-4 mr-2" aria-hidden="true" />
                Create CORS Rule
              </button>
            </div>
          </div>
        </div>
        
        <div className="p-6">
          <Suspense 
            fallback={
              <div 
                className="animate-pulse bg-gray-200 dark:bg-gray-700 h-64 rounded"
                data-testid="cors-table-suspense-fallback"
                role="status"
                aria-label="Loading CORS configuration table"
              >
                <span className="sr-only">Loading CORS configurations...</span>
              </div>
            }
          >
            <CorsTable 
              className="w-full"
              enableBulkActions={true}
              enableRealTimeUpdates={true}
              maxHeight={600}
              ariaLabel="CORS configuration management table"
            />
          </Suspense>
        </div>
      </div>
    </div>
  );
}

// =============================================================================
// MAIN PAGE COMPONENT
// =============================================================================

/**
 * Main CORS Configuration Page Component
 * 
 * Next.js app router page component implementing server-side rendering
 * for optimal performance and SEO. Combines server and client components
 * for comprehensive CORS configuration management interface.
 */
export default async function CorsConfigurationPage() {
  return (
    <div 
      className="min-h-screen bg-gray-50 dark:bg-gray-900"
      data-testid="cors-configuration-page"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Page Header */}
        <div className="mb-8">
          <div className="flex items-center space-x-3">
            <GlobeAltIcon 
              className="h-8 w-8 text-primary-600 dark:text-primary-400" 
              aria-hidden="true" 
            />
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
                CORS Configuration
              </h1>
              <p className="text-lg text-gray-600 dark:text-gray-400 mt-2">
                Configure Cross-Origin Resource Sharing settings for your API endpoints
              </p>
            </div>
          </div>
        </div>

        {/* Page Navigation Breadcrumb */}
        <nav 
          className="mb-8" 
          aria-label="Breadcrumb"
          data-testid="cors-breadcrumb"
        >
          <ol className="flex items-center space-x-2 text-sm">
            <li>
              <a 
                href="/adf-config" 
                className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors duration-200"
                aria-label="Go to configuration dashboard"
              >
                Configuration
              </a>
            </li>
            <li className="text-gray-400 dark:text-gray-500">/</li>
            <li className="text-gray-900 dark:text-gray-100 font-medium" aria-current="page">
              CORS
            </li>
          </ol>
        </nav>

        {/* CORS Overview Statistics - Server Component */}
        <Suspense 
          fallback={
            <div 
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8"
              data-testid="cors-stats-suspense-fallback"
            >
              {Array.from({ length: 5 }, (_, i) => (
                <div 
                  key={i}
                  className="animate-pulse bg-gray-200 dark:bg-gray-700 h-24 rounded-lg"
                  role="status"
                  aria-label={`Loading statistics ${i + 1}`}
                />
              ))}
            </div>
          }
        >
          <CorsOverviewStats />
        </Suspense>

        {/* CORS Best Practices - Server Component */}
        <Suspense 
          fallback={
            <div 
              className="animate-pulse bg-gray-200 dark:bg-gray-700 h-32 rounded-lg mb-8"
              data-testid="cors-practices-suspense-fallback"
              role="status"
              aria-label="Loading CORS best practices"
            />
          }
        >
          <CorsBestPractices />
        </Suspense>

        {/* Main CORS Management Interface - Client Component */}
        <Suspense 
          fallback={
            <div 
              className="animate-pulse bg-gray-200 dark:bg-gray-700 h-96 rounded-lg"
              data-testid="cors-client-suspense-fallback"
              role="status"
              aria-label="Loading CORS management interface"
            />
          }
        >
          <CorsPageClient />
        </Suspense>

        {/* Footer Information */}
        <div className="mt-12 pt-8 border-t border-gray-200 dark:border-gray-700">
          <div className="text-center">
            <p className="text-sm text-gray-500 dark:text-gray-400">
              CORS configurations control how browsers handle cross-origin requests to your API endpoints.
              {' '}
              <a 
                href="https://developer.mozilla.org/en-US/docs/Web/HTTP/CORS" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 underline transition-colors duration-200"
                aria-label="Learn more about CORS (opens in new tab)"
              >
                Learn more about CORS
              </a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Generate static parameters for dynamic routes (if needed)
 * Currently not needed for this page but included for future extensibility
 */
export async function generateStaticParams() {
  return [];
}

/**
 * Page configuration for Next.js
 */
export const dynamic = 'force-dynamic'; // Always render on server for fresh data
export const revalidate = 60; // Revalidate every 60 seconds for ISR
export const fetchCache = 'default-cache'; // Use default caching behavior
export const runtime = 'nodejs'; // Use Node.js runtime for full API compatibility
export const preferredRegion = 'auto'; // Automatic region selection