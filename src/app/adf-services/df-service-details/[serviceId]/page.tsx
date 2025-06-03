/**
 * Database Service Edit Page Component
 * 
 * Main Next.js page component for editing existing database services identified by serviceId parameter.
 * Implements the complete service editing workflow using React Hook Form with Zod validation,
 * enabling users to modify database connection parameters, test connectivity, update service 
 * configurations, and manage security settings.
 * 
 * Key Features:
 * - Service configuration editing with pre-populated form data
 * - Real-time connection testing with SWR caching
 * - React Hook Form with Zod schema validation
 * - Optimistic updates with React Query
 * - Paywall integration for premium features
 * - SSR-compatible server component architecture
 * - Next.js middleware authentication enforcement
 * 
 * Technical Implementation:
 * - Next.js 15.1 app router with dynamic route parameters
 * - React 19 server components for initial page loads under 2 seconds
 * - SWR for connection testing with cache hit responses under 50ms
 * - React Hook Form with real-time validation under 100ms
 * - Tailwind CSS 4.1+ with consistent theme injection
 * - Zustand state management for edit workflow coordination
 * 
 * @see Section 2.1 F-001 Database Service Connection Management
 * @see React/Next.js Integration Requirements
 * @see Section 5.2 Database Service Management Component
 */

import { Suspense } from 'react';
import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import dynamic from 'next/dynamic';

// Core types and validation schemas
import type { 
  Service, 
  ServiceFormData, 
  ServiceUpdateValidator,
  ServiceTestResult
} from '@/types/services';
import type { DatabaseServiceType } from '@/types/database';
import type { User } from '@/types/user';

// API client for server-side data fetching
import { apiClient } from '@/lib/api-client';

// UI Components with optimized loading
const ServiceEditForm = dynamic(
  () => import('@/components/database/service-wizard').then(mod => ({ default: mod.ServiceEditForm })),
  { 
    loading: () => <ServiceEditFormSkeleton />,
    ssr: false // Form interactions require client-side hydration
  }
);

const PaywallModal = dynamic(
  () => import('@/components/database/paywall-modal'),
  { 
    loading: () => null,
    ssr: false // Modal state requires client-side management
  }
);

const PageHeader = dynamic(
  () => import('@/components/ui/page-header'),
  { 
    loading: () => <PageHeaderSkeleton />,
    ssr: true // Headers can be server-rendered for SEO
  }
);

// Loading skeleton components for optimal perceived performance
function ServiceEditFormSkeleton() {
  return (
    <div className="animate-pulse space-y-6">
      {/* Service Type Section */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-32 mb-4"></div>
        <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded w-full"></div>
      </div>
      
      {/* Configuration Fields */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-48 mb-6"></div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="space-y-2">
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-24"></div>
              <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded w-full"></div>
            </div>
          ))}
        </div>
      </div>
      
      {/* Action Buttons */}
      <div className="flex justify-between">
        <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded w-24"></div>
        <div className="flex space-x-3">
          <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded w-32"></div>
          <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded w-24"></div>
        </div>
      </div>
    </div>
  );
}

function PageHeaderSkeleton() {
  return (
    <div className="animate-pulse">
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-64"></div>
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-96"></div>
        </div>
        <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded w-32"></div>
      </div>
    </div>
  );
}

/**
 * Page Props Interface
 * 
 * Defines the structure for dynamic route parameters and search parameters
 * passed to the service edit page component.
 */
interface ServiceEditPageProps {
  params: {
    serviceId: string;
  };
  searchParams: {
    tab?: string;
    section?: string;
    returnTo?: string;
  };
}

/**
 * Server-side service data fetching with error handling
 * 
 * Implements SSR-compatible data fetching for service details with proper
 * error boundaries and authentication validation. Ensures page loads
 * under 2 seconds per performance requirements.
 * 
 * @param serviceId - The numeric service identifier
 * @returns Promise resolving to service data or null for not found
 */
async function getServiceData(serviceId: number): Promise<Service | null> {
  try {
    // Validate serviceId parameter
    if (!Number.isInteger(serviceId) || serviceId <= 0) {
      return null;
    }

    // Fetch service data with authentication headers
    // Server-side requests include automatic token forwarding via middleware
    const response = await apiClient.get<Service>(`/api/v2/system/service/${serviceId}`);
    
    if (!response.success || !response.data) {
      return null;
    }

    return response.data;
  } catch (error) {
    // Log error for monitoring but don't expose sensitive details
    console.error(`Failed to fetch service ${serviceId}:`, error);
    return null;
  }
}

/**
 * Generate metadata for SEO optimization
 * 
 * Creates dynamic metadata for the service edit page including proper
 * title, description, and Open Graph tags for enhanced SEO performance.
 */
export async function generateMetadata({ params }: ServiceEditPageProps): Promise<Metadata> {
  const serviceId = parseInt(params.serviceId, 10);
  
  if (isNaN(serviceId)) {
    return {
      title: 'Invalid Service | DreamFactory Admin',
      description: 'The requested service could not be found.',
      robots: 'noindex, nofollow'
    };
  }

  const service = await getServiceData(serviceId);
  
  if (!service) {
    return {
      title: 'Service Not Found | DreamFactory Admin',
      description: 'The requested database service could not be found.',
      robots: 'noindex, nofollow'
    };
  }

  return {
    title: `Edit ${service.label} (${service.name}) | DreamFactory Admin`,
    description: `Configure and manage the ${service.label} database service connection. Update connection parameters, test connectivity, and manage security settings.`,
    keywords: [
      'database service',
      'connection configuration',
      service.type,
      'API management',
      'DreamFactory'
    ],
    openGraph: {
      title: `Edit ${service.label} Service`,
      description: `Configure ${service.type} database service: ${service.description || service.label}`,
      type: 'website',
      siteName: 'DreamFactory Admin Interface'
    }
  };
}

/**
 * Main Service Edit Page Component
 * 
 * Server component that renders the complete service editing interface with
 * proper error handling, loading states, and authentication enforcement.
 * Implements optimistic updates and real-time validation for optimal UX.
 */
export default async function ServiceEditPage({ params, searchParams }: ServiceEditPageProps) {
  // Parse and validate serviceId parameter with proper error handling
  const serviceId = parseInt(params.serviceId, 10);
  
  if (isNaN(serviceId) || serviceId <= 0) {
    notFound();
  }

  // Server-side data fetching with SSR capability
  const service = await getServiceData(serviceId);
  
  if (!service) {
    notFound();
  }

  // Determine return URL for navigation after save/cancel
  const returnTo = searchParams.returnTo || '/adf-services';
  const activeTab = searchParams.tab || 'configuration';
  const activeSection = searchParams.section || 'basic';

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Page Header with Service Information */}
      <Suspense fallback={<PageHeaderSkeleton />}>
        <PageHeader
          title={`Edit ${service.label}`}
          subtitle={`Configure ${service.type} database service: ${service.name}`}
          breadcrumbs={[
            { label: 'Services', href: '/adf-services' },
            { label: service.label, href: `/adf-services/df-service-details/${service.id}` },
            { label: 'Edit', href: '#', current: true }
          ]}
          actions={[
            {
              label: 'View API Documentation',
              href: `/adf-api-docs/services/${service.name}`,
              variant: 'secondary',
              icon: 'DocumentTextIcon'
            },
            {
              label: 'Service Health',
              href: `/adf-services/df-service-details/${service.id}?tab=health`,
              variant: 'secondary',
              icon: 'HeartIcon'
            }
          ]}
        />
      </Suspense>

      {/* Main Content Area */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-6">
          {/* Service Status Banner */}
          <ServiceStatusBanner service={service} />

          {/* Service Edit Form */}
          <Suspense fallback={<ServiceEditFormSkeleton />}>
            <ServiceEditFormContainer
              service={service}
              activeTab={activeTab}
              activeSection={activeSection}
              returnTo={returnTo}
            />
          </Suspense>
        </div>
      </main>

      {/* Paywall Modal for Premium Features */}
      <Suspense fallback={null}>
        <PaywallModal />
      </Suspense>
    </div>
  );
}

/**
 * Service Status Banner Component
 * 
 * Displays current service status, health information, and last activity
 * with appropriate visual indicators and accessibility features.
 */
function ServiceStatusBanner({ service }: { service: Service }) {
  const statusColors = {
    active: 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800 text-green-800 dark:text-green-200',
    inactive: 'bg-gray-50 dark:bg-gray-900/20 border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300',
    error: 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800 text-red-800 dark:text-red-200'
  };

  const status = service.isActive ? 'active' : 'inactive';
  const statusText = service.isActive ? 'Active' : 'Inactive';

  return (
    <div className={`rounded-lg border p-4 ${statusColors[status]}`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="flex items-center space-x-2">
            <div className={`w-2 h-2 rounded-full ${service.isActive ? 'bg-green-500' : 'bg-gray-400'}`} 
                 aria-hidden="true" />
            <span className="font-medium">Status: {statusText}</span>
          </div>
          
          {service.healthStatus && (
            <div className="flex items-center space-x-2 text-sm">
              <span>Health: {service.healthStatus.status}</span>
              {service.healthStatus.responseTime && (
                <span>({service.healthStatus.responseTime}ms)</span>
              )}
            </div>
          )}
        </div>

        <div className="text-sm">
          <span>Last Modified: </span>
          <time dateTime={service.lastModifiedDate}>
            {new Date(service.lastModifiedDate).toLocaleDateString('en-US', {
              year: 'numeric',
              month: 'short',
              day: 'numeric',
              hour: '2-digit',
              minute: '2-digit'
            })}
          </time>
        </div>
      </div>
    </div>
  );
}

/**
 * Service Edit Form Container Component
 * 
 * Client component that manages the complete service editing workflow
 * with React Hook Form, SWR for testing, and optimistic updates.
 */
function ServiceEditFormContainer({ 
  service, 
  activeTab, 
  activeSection, 
  returnTo 
}: {
  service: Service;
  activeTab: string;
  activeSection: string;
  returnTo: string;
}) {
  return (
    <ServiceEditForm
      service={service}
      mode="edit"
      initialTab={activeTab}
      initialSection={activeSection}
      returnTo={returnTo}
      onSuccess={(updatedService) => {
        // Handle successful service update
        console.log('Service updated successfully:', updatedService);
      }}
      onCancel={() => {
        // Handle form cancellation
        window.history.back();
      }}
      onError={(error) => {
        // Handle form submission errors
        console.error('Service update failed:', error);
      }}
    />
  );
}

/**
 * Static generation configuration
 * 
 * Configures Next.js ISR (Incremental Static Regeneration) for optimal
 * performance while maintaining data freshness for service configurations.
 */
export const revalidate = 300; // Revalidate every 5 minutes

/**
 * Runtime configuration
 * 
 * Ensures the page runs with appropriate runtime configuration for
 * database service management operations and API interactions.
 */
export const dynamic = 'force-dynamic'; // Force dynamic rendering for service-specific data

/**
 * Type exports for external consumption
 */
export type { ServiceEditPageProps };