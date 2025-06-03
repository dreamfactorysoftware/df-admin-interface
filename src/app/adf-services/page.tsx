import { Suspense } from 'react';
import { Metadata } from 'next';
import dynamic from 'next/dynamic';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

// Dynamic imports for client components with loading states
const ServiceOverview = dynamic(
  () => import('@/components/database/service-overview'),
  {
    loading: () => (
      <div className="animate-pulse space-y-4">
        <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/3"></div>
        <div className="h-64 bg-gray-200 dark:bg-gray-700 rounded"></div>
      </div>
    ),
    ssr: false,
  }
);

const ServiceManagementTable = dynamic(
  () => import('@/components/ui/data-table'),
  {
    loading: () => (
      <div className="animate-pulse space-y-4">
        <div className="h-12 bg-gray-200 dark:bg-gray-700 rounded"></div>
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-16 bg-gray-200 dark:bg-gray-700 rounded"></div>
          ))}
        </div>
      </div>
    ),
    ssr: false,
  }
);

const PaywallComponent = dynamic(
  () => import('@/components/ui/paywall'),
  {
    loading: () => (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
      </div>
    ),
    ssr: false,
  }
);

// Server component for metadata and SSR
export const metadata: Metadata = {
  title: 'Database Services | DreamFactory',
  description: 'Manage database service connections and API generation configurations. Create, configure, and test database connections for rapid API development.',
  keywords: ['database services', 'API generation', 'DreamFactory', 'database connections'],
  openGraph: {
    title: 'Database Services Management',
    description: 'Centralized database service management for API generation',
    type: 'website',
  },
};

// Types for server-side data fetching
interface ServiceType {
  id: number;
  name: string;
  label: string;
  description: string;
  group: string;
  singleton: boolean;
  created_date: string;
  last_modified_date: string;
}

interface Service {
  id: number;
  name: string;
  label: string;
  description: string;
  type: string;
  is_active: boolean;
  created_by_id: number | null;
  last_modified_by_id: number | null;
  created_date: string;
  last_modified_date: string;
  mutable: boolean;
  deletable: boolean;
}

interface ServicesPageData {
  services: Service[];
  serviceTypes: ServiceType[];
  hasPaywall: boolean;
  systemServices: boolean;
}

// Server-side data fetching function
async function getServicesData(): Promise<ServicesPageData> {
  const cookieStore = cookies();
  const sessionToken = cookieStore.get('dreamfactory_session_token')?.value;

  if (!sessionToken) {
    redirect('/login');
  }

  try {
    // Fetch service types to determine paywall status
    const serviceTypesResponse = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/api/v2/system/service_type`,
      {
        headers: {
          'X-DreamFactory-Session-Token': sessionToken,
          'X-DreamFactory-API-Key': process.env.NEXT_PUBLIC_API_KEY || '',
          'Content-Type': 'application/json',
        },
        cache: 'no-store', // Always fresh data for services
      }
    );

    if (!serviceTypesResponse.ok) {
      throw new Error('Failed to fetch service types');
    }

    const serviceTypesData = await serviceTypesResponse.json();
    const serviceTypes: ServiceType[] = serviceTypesData.resource || [];
    
    // Check for paywall condition - if no service types available
    const hasPaywall = serviceTypes.length === 0;

    // If paywall is active, return early
    if (hasPaywall) {
      return {
        services: [],
        serviceTypes: [],
        hasPaywall: true,
        systemServices: false,
      };
    }

    // Fetch services data
    const servicesResponse = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/api/v2/system/service`,
      {
        headers: {
          'X-DreamFactory-Session-Token': sessionToken,
          'X-DreamFactory-API-Key': process.env.NEXT_PUBLIC_API_KEY || '',
          'Content-Type': 'application/json',
        },
        cache: 'no-store', // Always fresh data for services
      }
    );

    if (!servicesResponse.ok) {
      throw new Error('Failed to fetch services');
    }

    const servicesData = await servicesResponse.json();
    const services: Service[] = servicesData.resource || [];

    return {
      services,
      serviceTypes,
      hasPaywall: false,
      systemServices: false, // Default to user services view
    };
  } catch (error) {
    console.error('Failed to fetch services data:', error);
    
    // Return safe defaults on error
    return {
      services: [],
      serviceTypes: [],
      hasPaywall: false,
      systemServices: false,
    };
  }
}

// Loading component for suspense boundary
function ServicesPageSkeleton() {
  return (
    <div className="space-y-6 p-6">
      {/* Header skeleton */}
      <div className="animate-pulse">
        <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/3 mb-2"></div>
        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-2/3"></div>
      </div>

      {/* Stats overview skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="animate-pulse">
            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg border border-gray-200 dark:border-gray-700">
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2 mb-3"></div>
              <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/4"></div>
            </div>
          </div>
        ))}
      </div>

      {/* Table skeleton */}
      <div className="animate-pulse">
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
          <div className="p-4 border-b border-gray-200 dark:border-gray-700">
            <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-1/4"></div>
          </div>
          <div className="p-4 space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-12 bg-gray-200 dark:bg-gray-700 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// Main page component with client-side interactivity
async function ServicesPageContent() {
  const data = await getServicesData();

  if (data.hasPaywall) {
    return (
      <div className="container mx-auto px-4 py-6">
        <div className="max-w-4xl mx-auto">
          <PaywallComponent 
            title="Database Services"
            description="Upgrade to access database service management and API generation capabilities."
            features={[
              'Create unlimited database connections',
              'Automatic API generation from schemas',
              'Advanced security configuration',
              'Real-time connection testing',
              'OpenAPI documentation generation'
            ]}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-6 space-y-6">
      {/* Page Header */}
      <div className="flex flex-col space-y-2">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
          Database Services
        </h1>
        <p className="text-gray-600 dark:text-gray-400 text-lg">
          Manage database connections and generate REST APIs in under 5 minutes
        </p>
      </div>

      {/* Service Overview Dashboard */}
      <ServiceOverview 
        initialServices={data.services}
        initialServiceTypes={data.serviceTypes}
      />

      {/* Main Services Management Table */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                Database Services
              </h2>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                Manage your database service connections and configurations
              </p>
            </div>
            <div className="flex items-center space-x-3">
              <button
                type="button"
                className="inline-flex items-center px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                title="Refresh services list"
              >
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                Refresh
              </button>
              <a
                href="/adf-services/create"
                className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
              >
                <svg className="h-4 w-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Create Service
              </a>
            </div>
          </div>
        </div>

        <ServiceManagementTable
          initialData={data.services}
          serviceTypes={data.serviceTypes}
          systemView={data.systemServices}
        />
      </div>

      {/* Quick Access Section */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="flex items-center justify-center h-8 w-8 rounded-md bg-primary-600 text-white">
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4" />
                </svg>
              </div>
            </div>
            <div className="ml-4">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                Database Connections
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Configure and test database connections
              </p>
            </div>
          </div>
          <div className="mt-4">
            <a
              href="/adf-services/create"
              className="text-primary-600 hover:text-primary-500 text-sm font-medium"
            >
              Create new connection →
            </a>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="flex items-center justify-center h-8 w-8 rounded-md bg-green-600 text-white">
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
            </div>
            <div className="ml-4">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                API Documentation
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                View generated API documentation
              </p>
            </div>
          </div>
          <div className="mt-4">
            <a
              href="/adf-api-docs"
              className="text-green-600 hover:text-green-500 text-sm font-medium"
            >
              View API docs →
            </a>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="flex items-center justify-center h-8 w-8 rounded-md bg-yellow-600 text-white">
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                </svg>
              </div>
            </div>
            <div className="ml-4">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                Schema Discovery
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Explore database schemas and relationships
              </p>
            </div>
          </div>
          <div className="mt-4">
            <a
              href="/adf-schema"
              className="text-yellow-600 hover:text-yellow-500 text-sm font-medium"
            >
              Explore schemas →
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}

// Main exported page component
export default function ServicesPage() {
  return (
    <Suspense fallback={<ServicesPageSkeleton />}>
      <ServicesPageContent />
    </Suspense>
  );
}

// Export for static analysis and performance optimization
export const dynamic = 'force-dynamic';
export const revalidate = 0; // Always fresh data for services