/**
 * Database Service Details Page
 * 
 * Main service details page component implementing Next.js server component with 
 * React Hook Form for database service configuration. Handles service editing, 
 * connection testing, and multi-step wizard interface for database API generation. 
 * Replaces Angular DfServiceDetailsComponent with modern React patterns including 
 * SWR for connection testing, Tailwind CSS styling, and paywall integration for 
 * premium features.
 * 
 * @fileoverview Next.js dynamic route page for database service management
 * @version 1.0.0
 * @since 2024-01-01
 */

import { Suspense } from 'react';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { 
  DatabaseIcon, 
  SettingsIcon, 
  ShieldCheckIcon, 
  EyeIcon,
  ZapIcon,
  ArrowLeftIcon,
  ExternalLinkIcon 
} from 'lucide-react';

// Component imports following established patterns
import { ServiceConfigurationForm } from '@/components/database-service/service-form/service-form-container';
import { ConnectionTestPanel } from '@/components/database-service/connection-test/connection-test-button';
import { PaywallModal } from '@/components/database-service/service-form/paywall-modal';
import { ServiceNavigationTabs } from '@/components/database-service/service-navigation-tabs';
import { ServiceHeader } from '@/components/database-service/service-header';
import { ServiceStatusIndicator } from '@/components/database-service/connection-test/connection-status-indicator';
import { LoadingSkeleton } from '@/components/ui/loading-skeleton';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Alert } from '@/components/ui/alert';

// Type imports from established patterns
import type {
  DatabaseService,
  ServiceConfiguration,
  ConnectionTestResult,
  DatabaseServicePermissions
} from '@/types/database';
import type { ApiResponse } from '@/types/api';

// =============================================================================
// PAGE COMPONENT PROPS & METADATA
// =============================================================================

interface ServiceDetailsPageProps {
  params: { 
    service: string; 
  };
  searchParams: { 
    tab?: 'configuration' | 'connection' | 'schema' | 'generate' | 'docs';
    modal?: 'paywall' | 'delete' | 'clone';
    wizard?: 'true' | 'false';
  };
}

/**
 * Generate dynamic metadata for service details pages
 * Optimized for SEO while maintaining security (no indexing)
 */
export async function generateMetadata({ 
  params 
}: ServiceDetailsPageProps): Promise<Metadata> {
  const serviceName = decodeURIComponent(params.service);
  
  return {
    title: `Database Service - ${serviceName}`,
    description: `Configure and manage ${serviceName} database service with connection testing, schema discovery, and API generation capabilities`,
    openGraph: {
      title: `Database Service - ${serviceName} | DreamFactory`,
      description: 'Configure database connections and generate REST APIs with real-time validation',
    },
    robots: {
      index: false,
      follow: false,
    },
  };
}

// Force dynamic rendering for real-time service data
export const dynamic = 'force-dynamic';

// =============================================================================
// SERVER DATA FETCHING
// =============================================================================

/**
 * Fetch service data on server for initial page load
 * Implements SSR under 2 seconds per React/Next.js Integration Requirements
 */
async function getServiceData(serviceId: string): Promise<{
  service: DatabaseService | null;
  permissions: DatabaseServicePermissions;
  error?: string;
}> {
  try {
    // Server-side data fetching with error handling
    const apiUrl = process.env.DREAMFACTORY_API_URL || 'http://localhost:8080';
    const response = await fetch(`${apiUrl}/api/v2/system/service/${serviceId}`, {
      cache: 'no-store', // Force fresh data for dynamic content
      next: { revalidate: 0 },
      headers: {
        'Content-Type': 'application/json',
        // Server-side authentication will be handled by middleware
      },
    });

    if (!response.ok) {
      if (response.status === 404) {
        return { service: null, permissions: { canEdit: false, canDelete: false, canTest: false } };
      }
      throw new Error(`Service fetch failed: ${response.status}`);
    }

    const data: ApiResponse<DatabaseService> = await response.json();
    
    // Determine user permissions based on service and user role
    const permissions: DatabaseServicePermissions = {
      canEdit: true, // Will be determined by middleware authentication
      canDelete: data.data?.created_by_id !== 1, // Can't delete system services
      canTest: true,
      canViewSchema: true,
      canGenerateAPI: data.data?.type === 'database', // Only database services can generate APIs
    };

    return { 
      service: data.data || null, 
      permissions 
    };
  } catch (error) {
    console.error('Failed to fetch service data:', error);
    return { 
      service: null, 
      permissions: { canEdit: false, canDelete: false, canTest: false },
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

// =============================================================================
// MAIN PAGE COMPONENT
// =============================================================================

/**
 * Database Service Details Page Component
 * 
 * Implements comprehensive service management interface with:
 * - Server-side rendering for initial page load
 * - Real-time connection testing with SWR
 * - Multi-step configuration wizard
 * - Schema discovery navigation
 * - API generation workflow
 * - Paywall integration for premium features
 */
export default async function ServiceDetailsPage({
  params,
  searchParams
}: ServiceDetailsPageProps) {
  const serviceId = decodeURIComponent(params.service);
  const currentTab = searchParams.tab || 'configuration';
  const showWizard = searchParams.wizard === 'true';
  
  // Server-side data fetching
  const { service, permissions, error } = await getServiceData(serviceId);

  // Handle service not found
  if (!service && !error) {
    notFound();
  }

  // Handle server errors
  if (error) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-4xl" data-testid="service-details-error">
        <Alert variant="destructive" className="mb-6">
          <DatabaseIcon className="h-4 w-4" />
          <div>
            <h3 className="font-semibold">Service Loading Error</h3>
            <p className="text-sm mt-1">
              Failed to load service details: {error}. Please check your connection and try again.
            </p>
          </div>
        </Alert>
        
        <div className="flex gap-3">
          <Button
            variant="outline"
            onClick={() => window.history.back()}
            className="inline-flex items-center"
          >
            <ArrowLeftIcon className="h-4 w-4 mr-2" />
            Go Back
          </Button>
          
          <Button
            onClick={() => window.location.reload()}
            className="inline-flex items-center"
          >
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-6 max-w-6xl space-y-6" data-testid="service-details-page">
      {/* Service Header with Status and Actions */}
      <Suspense fallback={<LoadingSkeleton className="h-24" />}>
        <ServiceHeader 
          service={service!}
          permissions={permissions}
          showBackButton
        />
      </Suspense>

      {/* Connection Status Banner */}
      <Suspense fallback={<LoadingSkeleton className="h-16" />}>
        <ServiceStatusBanner 
          serviceId={serviceId}
          serviceType={service!.type}
        />
      </Suspense>

      {/* Navigation Tabs */}
      <ServiceNavigationTabs
        serviceId={serviceId}
        currentTab={currentTab}
        permissions={permissions}
        className="border-b border-gray-200 dark:border-gray-700"
      />

      {/* Main Content Area */}
      <div className="min-h-[600px]">
        {/* Configuration Tab */}
        {currentTab === 'configuration' && (
          <Suspense fallback={<LoadingSkeleton className="h-96" />}>
            <ServiceConfigurationTab
              service={service!}
              permissions={permissions}
              showWizard={showWizard}
            />
          </Suspense>
        )}

        {/* Connection Testing Tab */}
        {currentTab === 'connection' && (
          <Suspense fallback={<LoadingSkeleton className="h-96" />}>
            <ConnectionTestingTab
              serviceId={serviceId}
              service={service!}
              permissions={permissions}
            />
          </Suspense>
        )}

        {/* Schema Discovery Tab */}
        {currentTab === 'schema' && (
          <Suspense fallback={<LoadingSkeleton className="h-96" />}>
            <SchemaDiscoveryTab
              serviceId={serviceId}
              service={service!}
              permissions={permissions}
            />
          </Suspense>
        )}

        {/* API Generation Tab */}
        {currentTab === 'generate' && (
          <Suspense fallback={<LoadingSkeleton className="h-96" />}>
            <APIGenerationTab
              serviceId={serviceId}
              service={service!}
              permissions={permissions}
            />
          </Suspense>
        )}

        {/* API Documentation Tab */}
        {currentTab === 'docs' && (
          <Suspense fallback={<LoadingSkeleton className="h-96" />}>
            <APIDocumentationTab
              serviceId={serviceId}
              service={service!}
            />
          </Suspense>
        )}
      </div>

      {/* Modal Handling */}
      {searchParams.modal === 'paywall' && (
        <PaywallModal
          isOpen={true}
          onClose={() => {
            // Handle modal close navigation
            const url = new URL(window.location.href);
            url.searchParams.delete('modal');
            window.history.replaceState({}, '', url.toString());
          }}
          feature="premium_database_features"
          serviceType={service!.type}
        />
      )}
    </div>
  );
}

// =============================================================================
// TAB COMPONENT IMPLEMENTATIONS
// =============================================================================

/**
 * Service Configuration Tab Component
 * Handles database connection configuration with React Hook Form and Zod validation
 */
async function ServiceConfigurationTab({
  service,
  permissions,
  showWizard
}: {
  service: DatabaseService;
  permissions: DatabaseServicePermissions;
  showWizard: boolean;
}) {
  return (
    <div className="space-y-6" data-testid="service-configuration-tab">
      {/* Configuration Form */}
      <Card className="p-6">
        <div className="flex items-center gap-3 mb-6">
          <SettingsIcon className="h-5 w-5 text-primary-600" />
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
            Database Configuration
          </h2>
        </div>
        
        <ServiceConfigurationForm
          service={service}
          permissions={permissions}
          showWizard={showWizard}
          mode="edit"
        />
      </Card>

      {/* Connection Testing Panel */}
      {permissions.canTest && (
        <Card className="p-6">
          <div className="flex items-center gap-3 mb-6">
            <DatabaseIcon className="h-5 w-5 text-primary-600" />
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              Connection Testing
            </h2>
          </div>
          
          <ConnectionTestPanel
            serviceId={service.id!}
            serviceConfig={service.config}
            realTimeValidation={true}
          />
        </Card>
      )}
    </div>
  );
}

/**
 * Connection Testing Tab Component
 * Dedicated tab for comprehensive connection testing and diagnostics
 */
async function ConnectionTestingTab({
  serviceId,
  service,
  permissions
}: {
  serviceId: string;
  service: DatabaseService;
  permissions: DatabaseServicePermissions;
}) {
  if (!permissions.canTest) {
    return (
      <Card className="p-8 text-center">
        <ShieldCheckIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
          Access Restricted
        </h3>
        <p className="text-gray-600 dark:text-gray-400">
          You don't have permission to test this database connection.
        </p>
      </Card>
    );
  }

  return (
    <div className="space-y-6" data-testid="connection-testing-tab">
      <Card className="p-6">
        <ConnectionTestPanel
          serviceId={serviceId}
          serviceConfig={service.config}
          realTimeValidation={true}
          showDetailedResults={true}
          enableRetryLogic={true}
        />
      </Card>
    </div>
  );
}

/**
 * Schema Discovery Tab Component
 * Navigation to dedicated schema discovery interface
 */
async function SchemaDiscoveryTab({
  serviceId,
  service,
  permissions
}: {
  serviceId: string;
  service: DatabaseService;
  permissions: DatabaseServicePermissions;
}) {
  if (!permissions.canViewSchema) {
    return (
      <Card className="p-8 text-center">
        <ShieldCheckIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
          Schema Discovery Unavailable
        </h3>
        <p className="text-gray-600 dark:text-gray-400">
          Schema discovery is not available for this service type or you don't have sufficient permissions.
        </p>
      </Card>
    );
  }

  return (
    <div className="space-y-6" data-testid="schema-discovery-tab">
      <Card className="p-8 text-center">
        <EyeIcon className="h-12 w-12 text-primary-600 mx-auto mb-4" />
        <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
          Schema Discovery
        </h3>
        <p className="text-gray-600 dark:text-gray-400 mb-6 max-w-md mx-auto">
          Explore your database schema, browse tables and relationships, and understand your data structure.
        </p>
        
        <Button
          size="lg"
          className="inline-flex items-center"
          onClick={() => {
            window.location.href = `/api-connections/database/${serviceId}/schema`;
          }}
        >
          <EyeIcon className="h-4 w-4 mr-2" />
          Browse Schema
          <ExternalLinkIcon className="h-4 w-4 ml-2" />
        </Button>
      </Card>
    </div>
  );
}

/**
 * API Generation Tab Component  
 * Navigation to API generation workflow
 */
async function APIGenerationTab({
  serviceId,
  service,
  permissions
}: {
  serviceId: string;
  service: DatabaseService;
  permissions: DatabaseServicePermissions;
}) {
  if (!permissions.canGenerateAPI) {
    return (
      <Card className="p-8 text-center">
        <ShieldCheckIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
          API Generation Unavailable
        </h3>
        <p className="text-gray-600 dark:text-gray-400">
          API generation is only available for database services.
        </p>
      </Card>
    );
  }

  return (
    <div className="space-y-6" data-testid="api-generation-tab">
      <Card className="p-8 text-center">
        <ZapIcon className="h-12 w-12 text-primary-600 mx-auto mb-4" />
        <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
          API Generation
        </h3>
        <p className="text-gray-600 dark:text-gray-400 mb-6 max-w-md mx-auto">
          Generate comprehensive REST APIs from your database tables with configurable endpoints, security rules, and validation.
        </p>
        
        <Button
          size="lg"
          className="inline-flex items-center"
          onClick={() => {
            window.location.href = `/api-connections/database/${serviceId}/generate`;
          }}
        >
          <ZapIcon className="h-4 w-4 mr-2" />
          Generate APIs
          <ExternalLinkIcon className="h-4 w-4 ml-2" />
        </Button>
      </Card>
    </div>
  );
}

/**
 * API Documentation Tab Component
 * Navigation to interactive API documentation
 */
async function APIDocumentationTab({
  serviceId,
  service
}: {
  serviceId: string;
  service: DatabaseService;
}) {
  return (
    <div className="space-y-6" data-testid="api-documentation-tab">
      <Card className="p-8 text-center">
        <ExternalLinkIcon className="h-12 w-12 text-primary-600 mx-auto mb-4" />
        <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
          API Documentation
        </h3>
        <p className="text-gray-600 dark:text-gray-400 mb-6 max-w-md mx-auto">
          View interactive API documentation with Swagger UI, test endpoints, and explore available operations.
        </p>
        
        <Button
          size="lg"
          className="inline-flex items-center"
          onClick={() => {
            window.location.href = `/api-docs/${serviceId}`;
          }}
        >
          View Documentation
          <ExternalLinkIcon className="h-4 w-4 ml-2" />
        </Button>
      </Card>
    </div>
  );
}

// =============================================================================
// SUPPORTING COMPONENTS
// =============================================================================

/**
 * Service Status Banner Component
 * Real-time connection status display with SWR
 */
async function ServiceStatusBanner({
  serviceId,
  serviceType
}: {
  serviceId: string;
  serviceType: string;
}) {
  return (
    <Card className="p-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <DatabaseIcon className="h-5 w-5 text-gray-600" />
          <div>
            <h3 className="font-medium text-gray-900 dark:text-white">
              {serviceId}
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {serviceType.charAt(0).toUpperCase() + serviceType.slice(1)} Service
            </p>
          </div>
        </div>
        
        <ServiceStatusIndicator 
          serviceId={serviceId}
          realTimeUpdates={true}
          showDetails={false}
        />
      </div>
    </Card>
  );
}