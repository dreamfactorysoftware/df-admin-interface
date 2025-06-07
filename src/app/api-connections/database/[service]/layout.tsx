import { Suspense } from 'react';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';

// Types for service layout
interface ServiceLayoutProps {
  children: React.ReactNode;
  params: { service: string };
}

interface ServiceBreadcrumb {
  label: string;
  href?: string;
  current?: boolean;
}

interface ServiceStatus {
  id: string;
  name: string;
  status: 'connected' | 'disconnected' | 'testing' | 'error';
  lastChecked: Date;
  type: string;
  label?: string;
}

interface ServiceStatusIndicatorProps {
  status: ServiceStatus['status'];
  lastChecked: Date;
  className?: string;
}

interface ServiceBreadcrumbsProps {
  breadcrumbs: ServiceBreadcrumb[];
  className?: string;
}

interface PageHeaderProps {
  title: string;
  description?: string;
  children?: React.ReactNode;
  className?: string;
}

// Service Status Indicator Component
function ServiceStatusIndicator({ status, lastChecked, className = '' }: ServiceStatusIndicatorProps) {
  const statusConfig = {
    connected: {
      color: 'bg-green-500',
      text: 'Connected',
      textColor: 'text-green-700',
      bgColor: 'bg-green-50',
      borderColor: 'border-green-200'
    },
    disconnected: {
      color: 'bg-gray-500',
      text: 'Disconnected',
      textColor: 'text-gray-700',
      bgColor: 'bg-gray-50',
      borderColor: 'border-gray-200'
    },
    testing: {
      color: 'bg-yellow-500',
      text: 'Testing Connection',
      textColor: 'text-yellow-700',
      bgColor: 'bg-yellow-50',
      borderColor: 'border-yellow-200'
    },
    error: {
      color: 'bg-red-500',
      text: 'Connection Error',
      textColor: 'text-red-700',
      bgColor: 'bg-red-50',
      borderColor: 'border-red-200'
    }
  };

  const config = statusConfig[status];
  const formattedTime = new Intl.DateTimeFormat('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  }).format(lastChecked);

  return (
    <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium ${config.bgColor} ${config.borderColor} ${config.textColor} border ${className}`}>
      <div className={`w-2 h-2 rounded-full ${config.color} ${status === 'testing' ? 'animate-pulse' : ''}`} />
      <span>{config.text}</span>
      <span className="text-xs opacity-75">({formattedTime})</span>
    </div>
  );
}

// Service Breadcrumbs Component
function ServiceBreadcrumbs({ breadcrumbs, className = '' }: ServiceBreadcrumbsProps) {
  return (
    <nav className={`flex ${className}`} aria-label="Breadcrumb">
      <ol className="inline-flex items-center space-x-1 md:space-x-3">
        {breadcrumbs.map((breadcrumb, index) => (
          <li key={index} className="inline-flex items-center">
            {index > 0 && (
              <svg
                className="w-6 h-6 text-gray-400 mx-1"
                fill="currentColor"
                viewBox="0 0 20 20"
                xmlns="http://www.w3.org/2000/svg"
                aria-hidden="true"
              >
                <path
                  fillRule="evenodd"
                  d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z"
                  clipRule="evenodd"
                />
              </svg>
            )}
            {breadcrumb.current ? (
              <span className="ml-1 text-sm font-medium text-gray-500 md:ml-2 dark:text-gray-400">
                {breadcrumb.label}
              </span>
            ) : (
              <a
                href={breadcrumb.href}
                className="ml-1 text-sm font-medium text-gray-700 hover:text-blue-600 md:ml-2 dark:text-gray-400 dark:hover:text-white transition-colors"
              >
                {breadcrumb.label}
              </a>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}

// Page Header Component
function PageHeader({ title, description, children, className = '' }: PageHeaderProps) {
  return (
    <div className={`flex items-center justify-between border-b border-gray-200 dark:border-gray-700 pb-6 ${className}`}>
      <div className="min-w-0 flex-1">
        <h1 className="text-2xl font-bold leading-7 text-gray-900 dark:text-white sm:truncate sm:text-3xl sm:tracking-tight">
          {title}
        </h1>
        {description && (
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            {description}
          </p>
        )}
      </div>
      {children && (
        <div className="mt-4 flex md:ml-4 md:mt-0">
          {children}
        </div>
      )}
    </div>
  );
}

// Service Action Toolbar Component
function ServiceActionToolbar({ serviceId }: { serviceId: string }) {
  return (
    <div className="flex items-center gap-3">
      <a
        href={`/api-connections/database/${serviceId}/schema`}
        className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors dark:bg-gray-800 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
      >
        <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
        </svg>
        Schema
      </a>
      <a
        href={`/api-connections/database/${serviceId}/generate`}
        className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors shadow-sm"
      >
        <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
        </svg>
        Generate APIs
      </a>
      <a
        href={`/api-docs/${serviceId}`}
        className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors dark:bg-gray-800 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
      >
        <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
        API Docs
      </a>
    </div>
  );
}

// Mock service status hook (will be replaced by actual implementation)
function useServiceStatus(serviceId: string): { 
  service: ServiceStatus | null; 
  isLoading: boolean; 
  error: Error | null;
  mutate: () => void;
} {
  // Mock implementation - in real app this would use SWR/React Query
  return {
    service: {
      id: serviceId,
      name: serviceId,
      status: 'connected' as const,
      lastChecked: new Date(),
      type: 'mysql',
      label: `${serviceId} Database`
    },
    isLoading: false,
    error: null,
    mutate: () => {}
  };
}

// Service Status Component with real-time monitoring
function ServiceStatusSection({ serviceId }: { serviceId: string }) {
  const { service, isLoading, error } = useServiceStatus(serviceId);

  if (isLoading) {
    return (
      <div className="animate-pulse">
        <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-48"></div>
      </div>
    );
  }

  if (error || !service) {
    return (
      <div className="text-sm text-red-600 dark:text-red-400">
        Unable to load service status
      </div>
    );
  }

  return (
    <ServiceStatusIndicator 
      status={service.status} 
      lastChecked={service.lastChecked}
    />
  );
}

// Generate dynamic metadata for the service
export async function generateMetadata({ params }: { params: { service: string } }): Promise<Metadata> {
  // In a real implementation, this would fetch service details
  // For now, we'll generate basic metadata based on the service ID
  const serviceId = decodeURIComponent(params.service);
  
  return {
    title: `${serviceId} Database Service`,
    description: `Manage database service configuration, schema discovery, and API generation for ${serviceId}`,
    openGraph: {
      title: `${serviceId} Database Service | DreamFactory`,
      description: `Configure and manage the ${serviceId} database service with real-time connection monitoring`,
      type: 'website',
    },
    robots: {
      index: false,
      follow: false,
    },
  };
}

/**
 * Service-specific layout component for database service management
 * 
 * This layout provides:
 * - Breadcrumb navigation for service context
 * - Real-time service status monitoring
 * - Action toolbar for schema discovery and API generation
 * - Dynamic metadata generation for SEO
 * - Consistent styling and accessibility
 * 
 * Performance targets:
 * - Layout rendering under 100ms
 * - Real-time status updates via SWR
 * - Responsive design with Tailwind CSS
 */
export default function ServiceLayout({ children, params }: ServiceLayoutProps) {
  const serviceId = decodeURIComponent(params.service);

  // Generate breadcrumbs for navigation context
  const breadcrumbs: ServiceBreadcrumb[] = [
    { label: 'Dashboard', href: '/' },
    { label: 'API Connections', href: '/api-connections' },
    { label: 'Database Services', href: '/api-connections/database' },
    { label: serviceId, current: true }
  ];

  return (
    <div className="space-y-6" data-testid="service-layout">
      {/* Breadcrumb Navigation */}
      <ServiceBreadcrumbs breadcrumbs={breadcrumbs} />

      {/* Service Header with Status and Actions */}
      <PageHeader 
        title={`${serviceId} Database Service`}
        description="Configure database connection settings, explore schema, and generate REST APIs"
      >
        <div className="flex items-center gap-4">
          {/* Real-time Service Status */}
          <Suspense fallback={
            <div className="animate-pulse">
              <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-32"></div>
            </div>
          }>
            <ServiceStatusSection serviceId={serviceId} />
          </Suspense>

          {/* Service Action Toolbar */}
          <ServiceActionToolbar serviceId={serviceId} />
        </div>
      </PageHeader>

      {/* Main Content Area */}
      <main className="space-y-6" role="main">
        {children}
      </main>
    </div>
  );
}

// Export component for reuse
export { ServiceStatusIndicator, ServiceBreadcrumbs, PageHeader, ServiceActionToolbar };

// Export types for other components
export type { ServiceLayoutProps, ServiceStatus, ServiceBreadcrumb };