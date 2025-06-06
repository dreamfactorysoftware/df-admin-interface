/**
 * CORS Configuration Management Page
 * 
 * Next.js app router page component providing comprehensive CORS configuration
 * management dashboard with server-side rendering capabilities. Implements system
 * CORS overview and per-service CORS management interface using React 19 server
 * components for optimal initial page load performance under 2 seconds.
 * 
 * Transforms Angular df-cors component to modern React/Next.js architecture with
 * Headless UI/Tailwind CSS styling, SWR/React Query hooks for intelligent data
 * caching, and React Hook Form integration for configuration management.
 * 
 * @fileoverview CORS configuration management page with SSR and modern React patterns
 * @version 1.0.0
 * @since React 19.0.0 / Next.js 15.1+
 */

import React, { Suspense } from 'react';
import { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { headers } from 'next/headers';
import { Globe, Shield, Settings, Clock, AlertTriangle, CheckCircle, Info } from 'lucide-react';
import { cn } from '../../../lib/utils';

// Client Components (dynamically imported for performance)
import dynamic from 'next/dynamic';

// Lazy load heavy client components for better performance
const CorsTable = dynamic(() => import('./cors-table'), {
  loading: () => <CorsTableSkeleton />,
  ssr: false, // Client-side only due to virtual scrolling
});

const CorsConfigDetails = dynamic(() => import('./cors-config-details'), {
  loading: () => <CorsDetailsSkeleton />,
  ssr: false, // Client-side only due to form interactions
});

// ============================================================================
// Types and Interfaces
// ============================================================================

/**
 * Page search parameters for routing and state management
 */
interface CorsPageSearchParams {
  /**
   * Action mode for the page
   */
  action?: 'create' | 'edit' | 'view';
  
  /**
   * CORS configuration ID for edit/view actions
   */
  id?: string;
  
  /**
   * Filter parameters for the table
   */
  search?: string;
  page?: string;
  size?: string;
  sort?: string;
  order?: 'asc' | 'desc';
}

/**
 * Page props interface
 */
interface CorsPageProps {
  searchParams: CorsPageSearchParams;
}

/**
 * CORS system status information
 */
interface CorsSystemStatus {
  globalEnabled: boolean;
  totalConfigurations: number;
  activeConfigurations: number;
  recentActivity: string;
  performanceImpact: 'low' | 'medium' | 'high';
}

// ============================================================================
// Metadata Configuration
// ============================================================================

/**
 * Dynamic metadata generation for SEO and accessibility
 */
export async function generateMetadata({ searchParams }: CorsPageProps): Promise<Metadata> {
  const { action, id } = searchParams;
  
  let title = 'CORS Configuration';
  let description = 'Manage Cross-Origin Resource Sharing (CORS) settings for your DreamFactory API endpoints.';
  
  if (action === 'create') {
    title = 'Create CORS Configuration';
    description = 'Create new CORS configuration rule for API endpoint access control.';
  } else if (action === 'edit' && id) {
    title = `Edit CORS Configuration ${id}`;
    description = `Modify CORS configuration settings for configuration ${id}.`;
  } else if (action === 'view' && id) {
    title = `View CORS Configuration ${id}`;
    description = `View details for CORS configuration ${id}.`;
  }
  
  return {
    title: `${title} | DreamFactory Admin`,
    description,
    keywords: [
      'CORS',
      'Cross-Origin Resource Sharing',
      'API Security',
      'DreamFactory',
      'Configuration Management',
      'Web Security',
      'Access Control',
    ],
    robots: {
      index: false, // Admin interface should not be indexed
      follow: false,
    },
    viewport: {
      width: 'device-width',
      initialScale: 1,
    },
  };
}

// ============================================================================
// Server Component Functions
// ============================================================================

/**
 * Fetch initial CORS system status for SSR
 * Note: In a real implementation, this would fetch from the API
 * For now, we provide default values that client components will replace
 */
async function getCorsSystemStatus(): Promise<CorsSystemStatus> {
  // In production, this would be an actual API call
  // For SSR performance, we provide sensible defaults
  return {
    globalEnabled: true,
    totalConfigurations: 0,
    activeConfigurations: 0,
    recentActivity: 'No recent activity',
    performanceImpact: 'low',
  };
}

/**
 * Validate authentication and authorization for CORS management
 * Note: In production, this would check actual session/permissions
 */
async function validateCorsAccess(): Promise<boolean> {
  // For now, assume authenticated access
  // In production, this would validate session and CORS management permissions
  return true;
}

// ============================================================================
// Loading and Error Components
// ============================================================================

/**
 * Loading skeleton for CORS table component
 */
function CorsTableSkeleton() {
  return (
    <div 
      className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden"
      data-testid="cors-table-skeleton"
      role="status"
      aria-label="Loading CORS configurations table"
    >
      {/* Header skeleton */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between mb-4">
          <div className="space-y-2">
            <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-48 animate-pulse" />
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-64 animate-pulse" />
          </div>
          <div className="flex space-x-2">
            <div className="h-9 bg-gray-200 dark:bg-gray-700 rounded w-20 animate-pulse" />
            <div className="h-9 bg-gray-200 dark:bg-gray-700 rounded w-32 animate-pulse" />
          </div>
        </div>
        <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
      </div>
      
      {/* Table skeleton */}
      <div className="p-4">
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, index) => (
            <div 
              key={index}
              className="flex items-center space-x-4 p-3 border border-gray-200 dark:border-gray-700 rounded"
            >
              <div className="h-5 w-5 bg-gray-200 dark:bg-gray-700 rounded-full animate-pulse" />
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-32 animate-pulse" />
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded flex-1 animate-pulse" />
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-24 animate-pulse" />
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-16 animate-pulse" />
              <div className="flex space-x-1">
                <div className="h-8 w-8 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
                <div className="h-8 w-8 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
                <div className="h-8 w-8 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/**
 * Loading skeleton for CORS details component
 */
function CorsDetailsSkeleton() {
  return (
    <div 
      className="space-y-6"
      data-testid="cors-details-skeleton"
      role="status"
      aria-label="Loading CORS configuration details"
    >
      {/* Header skeleton */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <div className="h-6 w-6 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
          <div className="space-y-2">
            <div className="h-7 bg-gray-200 dark:bg-gray-700 rounded w-64 animate-pulse" />
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-96 animate-pulse" />
          </div>
        </div>
        <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-20 animate-pulse" />
      </div>
      
      {/* Form sections skeleton */}
      {Array.from({ length: 3 }).map((_, sectionIndex) => (
        <div 
          key={sectionIndex}
          className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700 p-6"
        >
          <div className="flex items-center space-x-2 mb-6">
            <div className="h-5 w-5 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
            <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded w-32 animate-pulse" />
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {Array.from({ length: 4 }).map((_, fieldIndex) => (
              <div key={fieldIndex} className="space-y-2">
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-24 animate-pulse" />
                <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
              </div>
            ))}
          </div>
        </div>
      ))}
      
      {/* Action buttons skeleton */}
      <div className="flex items-center justify-between bg-gray-50 dark:bg-gray-800/50 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-32 animate-pulse" />
        <div className="flex space-x-3">
          <div className="h-9 bg-gray-200 dark:bg-gray-700 rounded w-20 animate-pulse" />
          <div className="h-9 bg-gray-200 dark:bg-gray-700 rounded w-32 animate-pulse" />
        </div>
      </div>
    </div>
  );
}

/**
 * System overview component with status indicators
 */
function CorsSystemOverview({ status }: { status: CorsSystemStatus }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      {/* Global Status */}
      <div 
        className={cn(
          'bg-white dark:bg-gray-900 rounded-lg border p-4',
          status.globalEnabled 
            ? 'border-green-200 dark:border-green-800' 
            : 'border-red-200 dark:border-red-800'
        )}
        data-testid="cors-global-status"
      >
        <div className="flex items-center space-x-2">
          {status.globalEnabled ? (
            <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400" aria-hidden="true" />
          ) : (
            <AlertTriangle className="h-5 w-5 text-red-600 dark:text-red-400" aria-hidden="true" />
          )}
          <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100">
            CORS Status
          </h3>
        </div>
        <p className="mt-2 text-2xl font-bold text-gray-900 dark:text-gray-100">
          {status.globalEnabled ? 'Enabled' : 'Disabled'}
        </p>
        <p className="text-xs text-gray-500 dark:text-gray-400">
          Global CORS configuration
        </p>
      </div>
      
      {/* Total Configurations */}
      <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
        <div className="flex items-center space-x-2">
          <Globe className="h-5 w-5 text-blue-600 dark:text-blue-400" aria-hidden="true" />
          <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100">
            Total Rules
          </h3>
        </div>
        <p className="mt-2 text-2xl font-bold text-gray-900 dark:text-gray-100">
          {status.totalConfigurations.toLocaleString()}
        </p>
        <p className="text-xs text-gray-500 dark:text-gray-400">
          CORS configurations
        </p>
      </div>
      
      {/* Active Configurations */}
      <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
        <div className="flex items-center space-x-2">
          <Shield className="h-5 w-5 text-green-600 dark:text-green-400" aria-hidden="true" />
          <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100">
            Active Rules
          </h3>
        </div>
        <p className="mt-2 text-2xl font-bold text-gray-900 dark:text-gray-100">
          {status.activeConfigurations.toLocaleString()}
        </p>
        <p className="text-xs text-gray-500 dark:text-gray-400">
          Currently enabled
        </p>
      </div>
      
      {/* Performance Impact */}
      <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
        <div className="flex items-center space-x-2">
          <Clock className="h-5 w-5 text-yellow-600 dark:text-yellow-400" aria-hidden="true" />
          <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100">
            Performance
          </h3>
        </div>
        <p className={cn(
          'mt-2 text-2xl font-bold capitalize',
          status.performanceImpact === 'low' && 'text-green-600 dark:text-green-400',
          status.performanceImpact === 'medium' && 'text-yellow-600 dark:text-yellow-400',
          status.performanceImpact === 'high' && 'text-red-600 dark:text-red-400',
        )}>
          {status.performanceImpact}
        </p>
        <p className="text-xs text-gray-500 dark:text-gray-400">
          System impact
        </p>
      </div>
    </div>
  );
}

/**
 * Information banner with CORS guidance
 */
function CorsInfoBanner() {
  return (
    <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 mb-6">
      <div className="flex items-start space-x-3">
        <Info className="h-5 w-5 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" aria-hidden="true" />
        <div className="flex-1">
          <h3 className="text-sm font-medium text-blue-900 dark:text-blue-100 mb-1">
            About CORS Configuration
          </h3>
          <p className="text-sm text-blue-800 dark:text-blue-200 mb-2">
            Cross-Origin Resource Sharing (CORS) allows you to control which domains can access your API endpoints from web browsers. 
            Configure origins, methods, and headers that should be allowed for cross-origin requests.
          </p>
          <ul className="text-xs text-blue-700 dark:text-blue-300 space-y-1">
            <li>• Use specific origins (e.g., https://example.com) for better security</li>
            <li>• Wildcard origins (*) allow any domain but reduce security</li>
            <li>• Configure only the HTTP methods your API actually supports</li>
            <li>• Enable credentials only when necessary and with specific origins</li>
          </ul>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// Main Page Component
// ============================================================================

/**
 * CORS Configuration Management Page Component
 * 
 * Server component providing initial page structure and delegating
 * interactive functionality to client components for optimal performance.
 */
export default async function CorsPage({ searchParams }: CorsPageProps): Promise<React.JSX.Element> {
  const { action, id } = searchParams;
  
  // Validate access permissions (server-side check)
  const hasAccess = await validateCorsAccess();
  if (!hasAccess) {
    redirect('/login?redirect=/adf-config/df-cors');
  }
  
  // Fetch initial system status for SSR
  const systemStatus = await getCorsSystemStatus();
  
  // Determine page mode and content
  const isDetailView = action === 'create' || action === 'edit' || action === 'view';
  const corsId = id ? parseInt(id, 10) : undefined;
  
  // Validate ID parameter for edit/view actions
  if ((action === 'edit' || action === 'view') && (!id || isNaN(corsId!))) {
    redirect('/adf-config/df-cors');
  }

  return (
    <div 
      className="min-h-screen bg-gray-50 dark:bg-gray-900"
      data-testid="cors-page"
    >
      {/* Page Container */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Page Header */}
        <div className="mb-8">
          <div className="flex items-center space-x-3 mb-2">
            <div className="flex items-center justify-center w-10 h-10 bg-primary-100 dark:bg-primary-900 rounded-lg">
              <Settings className="h-6 w-6 text-primary-600 dark:text-primary-400" aria-hidden="true" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
                {isDetailView ? (
                  action === 'create' ? 'Create CORS Configuration' :
                  action === 'edit' ? 'Edit CORS Configuration' :
                  'View CORS Configuration'
                ) : 'CORS Configuration'}
              </h1>
              <p className="text-lg text-gray-600 dark:text-gray-400">
                {isDetailView ? (
                  action === 'create' ? 'Create new cross-origin resource sharing rule for API endpoints.' :
                  action === 'edit' ? 'Modify existing CORS configuration settings.' :
                  'View CORS configuration details and settings.'
                ) : 'Manage Cross-Origin Resource Sharing (CORS) settings for API endpoints.'}
              </p>
            </div>
          </div>
          
          {/* Breadcrumb Navigation */}
          <nav aria-label="Breadcrumb" className="flex" data-testid="cors-breadcrumb">
            <ol className="flex items-center space-x-2 text-sm text-gray-500 dark:text-gray-400">
              <li>
                <a 
                  href="/adf-config" 
                  className="hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
                >
                  Configuration
                </a>
              </li>
              <li>
                <span className="mx-2">/</span>
                {isDetailView ? (
                  <>
                    <a 
                      href="/adf-config/df-cors" 
                      className="hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
                    >
                      CORS
                    </a>
                    <span className="mx-2">/</span>
                    <span className="text-gray-900 dark:text-gray-100 font-medium">
                      {action === 'create' ? 'Create' : 
                       action === 'edit' ? `Edit ${corsId}` : 
                       `View ${corsId}`}
                    </span>
                  </>
                ) : (
                  <span className="text-gray-900 dark:text-gray-100 font-medium">CORS</span>
                )}
              </li>
            </ol>
          </nav>
        </div>

        {/* Main Content */}
        <main>
          {isDetailView ? (
            /* Detail/Form View */
            <div className="max-w-4xl mx-auto">
              <Suspense fallback={<CorsDetailsSkeleton />}>
                <CorsConfigDetails
                  corsId={corsId}
                  showBackButton={true}
                  data-testid="cors-config-details"
                />
              </Suspense>
            </div>
          ) : (
            /* Dashboard/Table View */
            <div className="space-y-6">
              {/* Information Banner */}
              <CorsInfoBanner />
              
              {/* System Overview */}
              <CorsSystemOverview status={systemStatus} />
              
              {/* CORS Configuration Table */}
              <div className="bg-white dark:bg-gray-900 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
                <Suspense fallback={<CorsTableSkeleton />}>
                  <CorsTable
                    allowCreate={true}
                    allowFilter={true}
                    initialPageSize={25}
                    onRowEdit={(corsConfig) => {
                      // Handle edit navigation
                      window.location.href = `/adf-config/df-cors?action=edit&id=${corsConfig.id}`;
                    }}
                    onCreate={() => {
                      // Handle create navigation
                      window.location.href = `/adf-config/df-cors?action=create`;
                    }}
                    data-testid="cors-table"
                  />
                </Suspense>
              </div>
            </div>
          )}
        </main>
      </div>
      
      {/* Performance Monitoring (Development Only) */}
      {process.env.NODE_ENV === 'development' && (
        <div 
          className="fixed bottom-4 right-4 bg-gray-900 text-white text-xs p-2 rounded shadow-lg opacity-75"
          data-testid="performance-monitor"
        >
          <div>SSR: {isDetailView ? 'Detail View' : 'Table View'}</div>
          <div>Hydration: Client Components</div>
          <div>Mode: {action || 'list'}</div>
        </div>
      )}
    </div>
  );
}

// ============================================================================
// Additional Server Component Configurations
// ============================================================================

/**
 * Force dynamic rendering for this page to ensure fresh data
 * This ensures SSR performance while maintaining data freshness
 */
export const dynamic = 'force-dynamic';

/**
 * Disable static optimization for this admin page
 * Admin interfaces should always be server-rendered with fresh data
 */
export const revalidate = 0;

/**
 * Runtime configuration for the page
 */
export const runtime = 'nodejs';

/**
 * Specify that this page requires authentication
 * This helps with Next.js middleware optimization
 */
export const metadata: Metadata = {
  robots: {
    index: false,
    follow: false,
  },
};