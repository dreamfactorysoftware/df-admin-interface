/**
 * Database Services Listing Page
 * 
 * Main database services listing page component implementing Next.js server component
 * with React Query for data fetching. Displays paginated table of database service
 * connections with filtering, sorting, and management actions. Replaces Angular
 * df-manage-services components with modern React patterns including SWR caching,
 * Tailwind CSS styling, and paywall integration for premium features.
 * 
 * @fileoverview Database service management page with SSR and real-time updates
 * @version 1.0.0
 * @since 2024-01-01
 * 
 * Requirements:
 * - Database Service Management feature F-001 per Section 2.1 Feature Catalog
 * - React Query-powered service management with intelligent caching
 * - SSR pages under 2 seconds per React/Next.js Integration Requirements
 * - Next.js server components for initial page loads per Section 5.1 architectural patterns
 * - Tailwind CSS styling with consistent theme injection per React/Next.js Integration Requirements
 */

import { Suspense } from 'react';
import { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { DatabaseServiceProvider } from '@/components/database-service/database-service-provider';
import { DatabaseServiceList } from '@/components/database-service/service-list';
import { DatabaseServiceFilters } from '@/components/database-service/service-filters';
import { PageHeader } from '@/components/ui/page-header';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { PaywallGate } from '@/components/ui/paywall';
import { apiClient } from '@/lib/api-client';
import { auth } from '@/lib/auth';
import { 
  DatabaseService,
  ServiceType,
  DatabaseServiceQueryKeys,
  type GenericListResponse 
} from '@/types/database-service';
import { 
  HydrationBoundary, 
  QueryClient, 
  dehydrate 
} from '@tanstack/react-query';

// =============================================================================
// METADATA AND SEO CONFIGURATION
// =============================================================================

export const metadata: Metadata = {
  title: 'Database Services | DreamFactory Admin',
  description: 'Manage database service connections for API generation. Create, configure, and test connections to MySQL, PostgreSQL, Oracle, MongoDB, Snowflake, and more.',
  keywords: ['database services', 'API generation', 'database connections', 'DreamFactory'],
  robots: {
    index: false,
    follow: false,
  },
};

// =============================================================================
// PAGE CONFIGURATION
// =============================================================================

/**
 * Page configuration for Next.js App Router
 * SSR enabled for initial page loads under 2 seconds per requirements
 */
export const dynamic = 'force-dynamic';
export const revalidate = 0;

// =============================================================================
// SERVER-SIDE DATA FETCHING
// =============================================================================

/**
 * Fetch initial database services data with SSR support
 * Implements server-side rendering for optimal performance per Section 5.1
 */
async function fetchServicesData(searchParams: { [key: string]: string | string[] | undefined }) {
  const session = await auth();
  
  if (!session?.user) {
    redirect('/login');
  }

  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 1000 * 60 * 5, // 5 minutes
        cacheTime: 1000 * 60 * 30, // 30 minutes
        retry: 3,
        refetchOnWindowFocus: false,
      },
    },
  });

  // Parse search parameters for filtering and pagination
  const page = Number(searchParams.page) || 1;
  const pageSize = Number(searchParams.pageSize) || 50;
  const search = typeof searchParams.search === 'string' ? searchParams.search : '';
  const typeFilter = typeof searchParams.type === 'string' ? searchParams.type.split(',') : [];
  const statusFilter = typeof searchParams.status === 'string' ? searchParams.status.split(',') : [];
  const sortBy = typeof searchParams.sortBy === 'string' ? searchParams.sortBy : 'name';
  const sortOrder = typeof searchParams.sortOrder === 'string' ? searchParams.sortOrder : 'asc';

  const offset = (page - 1) * pageSize;

  // Build filter query following DreamFactory API patterns
  const filters: string[] = [];
  
  if (search) {
    filters.push(`(name contains "${search}" or label contains "${search}" or description contains "${search}")`);
  }
  
  if (typeFilter.length > 0) {
    filters.push(`type in ("${typeFilter.join('","')}")`);
  }
  
  if (statusFilter.length > 0) {
    const statusConditions = statusFilter.map(status => {
      switch (status) {
        case 'active':
          return 'is_active = true';
        case 'inactive':
          return 'is_active = false';
        default:
          return '';
      }
    }).filter(Boolean);
    
    if (statusConditions.length > 0) {
      filters.push(`(${statusConditions.join(' or ')})`);
    }
  }

  // Filter to show only user-created services (non-system)
  filters.push('created_by_id is not null');

  const filterQuery = filters.length > 0 ? filters.join(' and ') : undefined;

  try {
    // Prefetch services list with React Query
    await queryClient.prefetchQuery({
      queryKey: DatabaseServiceQueryKeys.list({ 
        page, 
        pageSize, 
        search, 
        type: typeFilter, 
        status: statusFilter, 
        sortBy, 
        sortOrder 
      }),
      queryFn: async () => {
        const response = await apiClient.get<GenericListResponse<DatabaseService>>('/api/v2/system/service', {
          params: {
            limit: pageSize,
            offset,
            filter: filterQuery,
            order: `${sortBy} ${sortOrder}`,
            include_count: true,
            refresh: false,
          },
          headers: {
            'Authorization': `Bearer ${session.accessToken}`,
            'X-DreamFactory-Api-Key': process.env.DREAMFACTORY_API_KEY,
          },
        });

        return response.data;
      },
      staleTime: 1000 * 60 * 2, // 2 minutes for services list
    });

    // Prefetch service types for paywall and filtering
    await queryClient.prefetchQuery({
      queryKey: DatabaseServiceQueryKeys.types(),
      queryFn: async () => {
        const response = await apiClient.get<GenericListResponse<ServiceType>>('/api/v2/system/service_type', {
          params: {
            group: 'Database',
            limit: 100,
          },
          headers: {
            'Authorization': `Bearer ${session.accessToken}`,
            'X-DreamFactory-Api-Key': process.env.DREAMFACTORY_API_KEY,
          },
        });

        return response.data;
      },
      staleTime: 1000 * 60 * 10, // 10 minutes for service types
    });

    return queryClient;
  } catch (error) {
    console.error('Failed to fetch services data:', error);
    
    // Return empty query client on error to allow client-side retry
    return queryClient;
  }
}

// =============================================================================
// SEARCH PARAMETERS INTERFACE
// =============================================================================

interface SearchParams {
  page?: string;
  pageSize?: string;
  search?: string;
  type?: string;
  status?: string;
  sortBy?: string;
  sortOrder?: string;
}

// =============================================================================
// PAGE COMPONENT PROPS
// =============================================================================

interface DatabaseServicesPageProps {
  searchParams: SearchParams;
}

// =============================================================================
// MAIN PAGE COMPONENT
// =============================================================================

/**
 * Database Services Page Component
 * 
 * Server component that provides the main database services management interface.
 * Implements comprehensive service management including creation, editing, deletion,
 * and connection testing. Features paywall integration for premium database types
 * and real-time connection status monitoring.
 * 
 * @param searchParams - URL search parameters for filtering and pagination
 * @returns JSX.Element - Rendered database services page
 */
export default async function DatabaseServicesPage({ 
  searchParams 
}: DatabaseServicesPageProps) {
  // Fetch initial data with SSR support
  const queryClient = await fetchServicesData(searchParams);
  const dehydratedState = dehydrate(queryClient);

  // Parse search parameters for component props
  const currentPage = Number(searchParams.page) || 1;
  const currentPageSize = Number(searchParams.pageSize) || 50;
  const currentSearch = searchParams.search || '';
  const currentTypeFilter = searchParams.type?.split(',') || [];
  const currentStatusFilter = searchParams.status?.split(',') || [];
  const currentSortBy = searchParams.sortBy || 'name';
  const currentSortOrder = (searchParams.sortOrder as 'asc' | 'desc') || 'asc';

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Page Header */}
      <PageHeader
        title="Database Services"
        description="Manage database connections for API generation"
        breadcrumbs={[
          { label: 'API Connections', href: '/api-connections' },
          { label: 'Database Services', href: '/api-connections/database' },
        ]}
      />

      {/* Main Content */}
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <HydrationBoundary state={dehydratedState}>
          <DatabaseServiceProvider
            refreshInterval={30000} // 30 seconds auto-refresh
            enableAutoRefresh={true}
            onError={(error) => {
              console.error('Database service provider error:', error);
            }}
          >
            {/* Paywall Check */}
            <PaywallGate
              feature="database-services"
              fallback={
                <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-800">
                  <div className="text-center">
                    <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">
                      Database Services Unavailable
                    </h3>
                    <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                      No database service types are available with your current subscription.
                      Please upgrade to access database connectivity features.
                    </p>
                  </div>
                </div>
              }
            >
              {/* Service Management Interface */}
              <div className="space-y-6">
                {/* Filters and Search */}
                <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-700 dark:bg-gray-800">
                  <Suspense 
                    fallback={
                      <div className="flex h-16 items-center justify-center">
                        <LoadingSpinner size="sm" />
                      </div>
                    }
                  >
                    <DatabaseServiceFilters
                      searchQuery={currentSearch}
                      selectedTypes={currentTypeFilter}
                      selectedStatuses={currentStatusFilter}
                      sortBy={currentSortBy}
                      sortOrder={currentSortOrder}
                      onFiltersChange={(filters) => {
                        // Filters will update URL via client-side navigation
                        // This is handled by the DatabaseServiceFilters component
                      }}
                    />
                  </Suspense>
                </div>

                {/* Services Table */}
                <div className="rounded-lg border border-gray-200 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-800">
                  <Suspense 
                    fallback={
                      <div className="flex h-64 items-center justify-center">
                        <LoadingSpinner size="lg" />
                        <span className="ml-3 text-sm text-gray-600 dark:text-gray-400">
                          Loading database services...
                        </span>
                      </div>
                    }
                  >
                    <DatabaseServiceList
                      initialPage={currentPage}
                      initialPageSize={currentPageSize}
                      initialFilters={{
                        search: currentSearch,
                        type: currentTypeFilter,
                        status: currentStatusFilter,
                        sortBy: currentSortBy,
                        sortOrder: currentSortOrder,
                      }}
                      enableRealTimeUpdates={true}
                      showConnectionStatus={true}
                      showScriptingStatus={true}
                      onServiceCreate={() => {
                        // Navigation handled by client component
                      }}
                      onServiceEdit={(service) => {
                        // Navigation handled by client component
                      }}
                      onServiceDelete={(service) => {
                        // Deletion handled by client component with confirmation
                      }}
                      onServiceView={(service) => {
                        // Navigation to schema discovery handled by client component
                      }}
                      onConnectionTest={(service) => {
                        // Connection testing handled by client component
                      }}
                      className="rounded-lg"
                    />
                  </Suspense>
                </div>
              </div>
            </PaywallGate>
          </DatabaseServiceProvider>
        </HydrationBoundary>
      </div>
    </div>
  );
}

// =============================================================================
// ERROR BOUNDARY AND LOADING STATES
// =============================================================================

/**
 * Error component for database services page
 * Provides user-friendly error messaging with retry functionality
 */
export function DatabaseServicesError({ 
  error, 
  reset 
}: { 
  error: Error & { digest?: string }; 
  reset: () => void; 
}) {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <PageHeader
        title="Database Services"
        description="Manage database connections for API generation"
        breadcrumbs={[
          { label: 'API Connections', href: '/api-connections' },
          { label: 'Database Services', href: '/api-connections/database' },
        ]}
      />
      
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="rounded-lg border border-red-200 bg-red-50 p-6 dark:border-red-800 dark:bg-red-900/10">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg 
                className="h-5 w-5 text-red-400" 
                viewBox="0 0 20 20" 
                fill="currentColor"
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
                Failed to Load Database Services
              </h3>
              <div className="mt-2 text-sm text-red-700 dark:text-red-300">
                <p>
                  There was a problem loading the database services. This might be due to:
                </p>
                <ul className="mt-1 list-disc space-y-1 pl-5">
                  <li>Network connectivity issues</li>
                  <li>Authentication session expiration</li>
                  <li>Server configuration problems</li>
                </ul>
              </div>
              <div className="mt-4">
                <button
                  type="button"
                  onClick={reset}
                  className="inline-flex items-center rounded-md border border-transparent bg-red-600 px-3 py-2 text-sm font-medium leading-4 text-white shadow-sm hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 dark:bg-red-500 dark:hover:bg-red-600"
                >
                  Try Again
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Loading component for database services page
 * Provides skeleton loading states during initial page load
 */
export function DatabaseServicesLoading() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <PageHeader
        title="Database Services"
        description="Manage database connections for API generation"
        breadcrumbs={[
          { label: 'API Connections', href: '/api-connections' },
          { label: 'Database Services', href: '/api-connections/database' },
        ]}
      />
      
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="space-y-6">
          {/* Filters Skeleton */}
          <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-700 dark:bg-gray-800">
            <div className="flex items-center space-x-4">
              <div className="h-10 w-64 animate-pulse rounded-md bg-gray-200 dark:bg-gray-700"></div>
              <div className="h-10 w-32 animate-pulse rounded-md bg-gray-200 dark:bg-gray-700"></div>
              <div className="h-10 w-32 animate-pulse rounded-md bg-gray-200 dark:bg-gray-700"></div>
            </div>
          </div>

          {/* Table Skeleton */}
          <div className="rounded-lg border border-gray-200 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-800">
            <div className="p-6">
              <div className="space-y-4">
                <div className="h-6 w-full animate-pulse rounded bg-gray-200 dark:bg-gray-700"></div>
                <div className="h-6 w-3/4 animate-pulse rounded bg-gray-200 dark:bg-gray-700"></div>
                <div className="h-6 w-1/2 animate-pulse rounded bg-gray-200 dark:bg-gray-700"></div>
                <div className="h-6 w-2/3 animate-pulse rounded bg-gray-200 dark:bg-gray-700"></div>
                <div className="h-6 w-4/5 animate-pulse rounded bg-gray-200 dark:bg-gray-700"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// =============================================================================
// TYPE EXPORTS FOR COMPONENT INTEGRATION
// =============================================================================

export type {
  DatabaseServicesPageProps,
  SearchParams,
};