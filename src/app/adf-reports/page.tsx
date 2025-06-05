import { Suspense } from 'react';
import { Metadata } from 'next';
import { 
  ChartBarIcon, 
  ClockIcon, 
  ServerIcon,
  ExclamationTriangleIcon 
} from '@heroicons/react/24/outline';

// Component imports (these will be created by other team members)
import { ServiceReportOverview } from '@/components/reports/service-report-overview';
import { DataTable } from '@/components/ui/data-table';
import { Paywall } from '@/components/ui/paywall';

// Hook and utility imports
import { getServiceReports } from '@/hooks/use-service-reports';
import { createApiClient } from '@/lib/api-client';

/**
 * Service Reports Management Landing Page
 * 
 * Main dashboard for service report monitoring and analytics in the DreamFactory Admin Interface.
 * Implements Next.js 15.1 server component with React 19 features for enhanced performance.
 * 
 * Features:
 * - Server-side rendering with under 2-second load times
 * - Service report statistics and metrics overview
 * - Filtering and search capabilities for reports
 * - Paywall enforcement for premium features
 * - Real-time data updates via React Query
 * - Responsive design with Tailwind CSS
 * 
 * @returns Promise<JSX.Element> The service reports page component
 */

// Generate metadata for the page
export const metadata: Metadata = {
  title: 'Service Reports | DreamFactory Admin',
  description: 'Monitor and analyze service report metrics, performance statistics, and usage analytics for your DreamFactory APIs.',
  keywords: ['service reports', 'analytics', 'monitoring', 'dreamfactory', 'api metrics'],
};

// Server Component - runs on server only, zero bundle impact
export default async function ServiceReportsPage() {
  // Server-side data fetching for initial render
  // This ensures SSR performance under 2 seconds as required
  let initialReports = null;
  let hasError = false;
  
  try {
    // Create API client for server-side data fetching
    const apiClient = createApiClient();
    
    // Fetch initial service reports data on server
    // This will be hydrated by React Query on the client
    initialReports = await getServiceReports({
      page: 1,
      limit: 25,
      sortBy: 'created_at',
      sortOrder: 'desc'
    });
  } catch (error) {
    console.error('Failed to fetch initial service reports:', error);
    hasError = true;
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Page Header */}
      <div className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="py-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="flex-shrink-0">
                  <ChartBarIcon className="h-8 w-8 text-primary-600 dark:text-primary-400" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                    Service Reports
                  </h1>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Monitor and analyze service performance metrics and usage analytics
                  </p>
                </div>
              </div>
              
              {/* Quick Stats Bar */}
              <div className="hidden lg:flex items-center space-x-6">
                <div className="text-center">
                  <div className="text-2xl font-semibold text-gray-900 dark:text-white">
                    {initialReports?.totalReports || '--'}
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">Total Reports</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-semibold text-green-600 dark:text-green-400">
                    {initialReports?.activeServices || '--'}
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">Active Services</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-semibold text-blue-600 dark:text-blue-400">
                    {initialReports?.avgResponseTime || '--'}ms
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">Avg Response</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Error State */}
        {hasError && (
          <div className="mb-8 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
            <div className="flex items-center">
              <ExclamationTriangleIcon className="h-5 w-5 text-red-400 mr-3" />
              <div>
                <h3 className="text-sm font-medium text-red-800 dark:text-red-200">
                  Failed to load service reports
                </h3>
                <p className="text-sm text-red-700 dark:text-red-300 mt-1">
                  Unable to fetch initial data. The reports will load when available.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Service Report Overview Section */}
        <div className="mb-8">
          <Suspense 
            fallback={
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
                <div className="animate-pulse">
                  <div className="flex items-center space-x-4 mb-6">
                    <div className="w-8 h-8 bg-gray-300 dark:bg-gray-600 rounded"></div>
                    <div className="h-6 bg-gray-300 dark:bg-gray-600 rounded w-48"></div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {[...Array(4)].map((_, i) => (
                      <div key={i} className="space-y-3">
                        <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded w-3/4"></div>
                        <div className="h-8 bg-gray-300 dark:bg-gray-600 rounded w-1/2"></div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            }
          >
            <ServiceReportOverview 
              initialData={initialReports}
              refreshInterval={30000} // 30 seconds
            />
          </Suspense>
        </div>

        {/* Service Reports Data Table */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <ServerIcon className="h-5 w-5 text-gray-400" />
                <h2 className="text-lg font-medium text-gray-900 dark:text-white">
                  Service Reports
                </h2>
              </div>
              <div className="flex items-center space-x-2 text-sm text-gray-500 dark:text-gray-400">
                <ClockIcon className="h-4 w-4" />
                <span>Last updated: {new Date().toLocaleTimeString()}</span>
              </div>
            </div>
          </div>

          <Suspense 
            fallback={
              <div className="p-6">
                <div className="animate-pulse space-y-4">
                  {/* Table Header Skeleton */}
                  <div className="grid grid-cols-5 gap-4">
                    {[...Array(5)].map((_, i) => (
                      <div key={i} className="h-4 bg-gray-300 dark:bg-gray-600 rounded"></div>
                    ))}
                  </div>
                  {/* Table Rows Skeleton */}
                  {[...Array(10)].map((_, i) => (
                    <div key={i} className="grid grid-cols-5 gap-4">
                      {[...Array(5)].map((_, j) => (
                        <div key={j} className="h-6 bg-gray-200 dark:bg-gray-700 rounded"></div>
                      ))}
                    </div>
                  ))}
                </div>
              </div>
            }
          >
            <DataTable
              endpoint="/api/v2/system/reports/services"
              columns={[
                {
                  key: 'service_name',
                  label: 'Service Name',
                  sortable: true,
                  render: (value: string) => (
                    <span className="font-medium text-gray-900 dark:text-white">
                      {value}
                    </span>
                  )
                },
                {
                  key: 'service_type',
                  label: 'Type',
                  sortable: true,
                  render: (value: string) => (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-200">
                      {value}
                    </span>
                  )
                },
                {
                  key: 'total_requests',
                  label: 'Total Requests',
                  sortable: true,
                  render: (value: number) => (
                    <span className="text-gray-900 dark:text-white">
                      {value.toLocaleString()}
                    </span>
                  )
                },
                {
                  key: 'avg_response_time',
                  label: 'Avg Response Time',
                  sortable: true,
                  render: (value: number) => (
                    <span className={`text-sm font-medium ${
                      value < 500 
                        ? 'text-green-600 dark:text-green-400' 
                        : value < 1000 
                          ? 'text-yellow-600 dark:text-yellow-400'
                          : 'text-red-600 dark:text-red-400'
                    }`}>
                      {value}ms
                    </span>
                  )
                },
                {
                  key: 'error_rate',
                  label: 'Error Rate',
                  sortable: true,
                  render: (value: number) => (
                    <span className={`text-sm font-medium ${
                      value < 1 
                        ? 'text-green-600 dark:text-green-400' 
                        : value < 5 
                          ? 'text-yellow-600 dark:text-yellow-400'
                          : 'text-red-600 dark:text-red-400'
                    }`}>
                      {value.toFixed(2)}%
                    </span>
                  )
                },
                {
                  key: 'last_activity',
                  label: 'Last Activity',
                  sortable: true,
                  render: (value: string) => (
                    <span className="text-gray-600 dark:text-gray-400 text-sm">
                      {new Date(value).toLocaleDateString()}
                    </span>
                  )
                }
              ]}
              initialData={initialReports?.reports || []}
              enableSearch={true}
              enableFiltering={true}
              searchPlaceholder="Search service reports..."
              filters={[
                {
                  key: 'service_type',
                  label: 'Service Type',
                  type: 'select',
                  options: [
                    { value: 'database', label: 'Database' },
                    { value: 'rest', label: 'REST API' },
                    { value: 'soap', label: 'SOAP' },
                    { value: 'file', label: 'File Storage' },
                    { value: 'script', label: 'Script' }
                  ]
                },
                {
                  key: 'date_range',
                  label: 'Date Range',
                  type: 'daterange',
                  defaultValue: {
                    from: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // Last 7 days
                    to: new Date()
                  }
                },
                {
                  key: 'min_requests',
                  label: 'Min Requests',
                  type: 'number',
                  placeholder: 'Minimum request count'
                }
              ]}
              pageSize={25}
              enableExport={true}
              exportFormats={['csv', 'json']}
            />
          </Suspense>
        </div>

        {/* Paywall Component for Premium Features */}
        <Suspense fallback={null}>
          <Paywall
            feature="advanced-analytics"
            title="Advanced Service Analytics"
            description="Unlock detailed performance insights, custom report generation, and advanced filtering capabilities."
            benefits={[
              'Custom date range analysis',
              'Advanced performance metrics',
              'Automated report scheduling',
              'Export to multiple formats',
              'Real-time alerting system'
            ]}
            className="mt-8"
          />
        </Suspense>
      </div>
    </div>
  );
}

/**
 * Type definitions for service reports data structure
 * These interfaces define the expected data format for the service reports
 */
export interface ServiceReport {
  id: string;
  service_name: string;
  service_type: 'database' | 'rest' | 'soap' | 'file' | 'script';
  total_requests: number;
  avg_response_time: number;
  error_rate: number;
  last_activity: string;
  created_at: string;
  updated_at: string;
}

export interface ServiceReportsData {
  reports: ServiceReport[];
  totalReports: number;
  activeServices: number;
  avgResponseTime: number;
  totalPages: number;
  currentPage: number;
}

/**
 * Filter interface for the data table
 */
export interface ServiceReportFilter {
  service_type?: string;
  date_range?: {
    from: Date;
    to: Date;
  };
  min_requests?: number;
  search?: string;
}