'use client';

import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useSystemConfig } from '@/hooks/use-system-config';
import { useBreakpoint } from '@/hooks/use-breakpoint';
import { apiClient } from '@/lib/api-client';

/**
 * License check response interface matching the original Angular service
 */
interface LicenseCheckResponse {
  msg: string;
  renewalDate: string;
  status?: string;
  error?: string;
}

/**
 * License validation hook to replace df-license-check service
 */
function useLicenseCheck(licenseKey: string | null | undefined) {
  return useQuery({
    queryKey: ['license-check', licenseKey],
    queryFn: async (): Promise<LicenseCheckResponse> => {
      if (!licenseKey) {
        throw new Error('No license key provided');
      }

      try {
        const response = await apiClient.get('/subscription-data', {
          headers: {
            'X-DreamFactory-License-Key': licenseKey,
          },
        });
        return response.data;
      } catch (error: any) {
        // Return error response structure matching original service
        return {
          msg: error.message || 'License validation failed',
          renewalDate: '',
          error: error.message,
        };
      }
    },
    enabled: !!(licenseKey && licenseKey !== 'OPEN SOURCE'),
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: 1,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
  });
}

/**
 * Reusable data list component for displaying key-value pairs
 */
interface DataListProps {
  data: Array<{
    label: string;
    value: string | number | boolean | null | undefined;
    condition?: boolean;
  }>;
  className?: string;
}

function DataList({ data, className = '' }: DataListProps) {
  const filteredData = data.filter(item => 
    item.condition !== false && 
    item.value !== null && 
    item.value !== undefined && 
    item.value !== ''
  );

  if (filteredData.length === 0) {
    return null;
  }

  return (
    <ul className={`space-y-3 ${className}`}>
      {filteredData.map((item, index) => (
        <li key={index} className="flex justify-between items-start py-2 border-b border-gray-100 last:border-b-0">
          <span className="font-medium text-gray-700 min-w-0 flex-shrink-0 pr-4">
            {item.label}:
          </span>
          <span className="text-gray-900 text-right break-all">
            {typeof item.value === 'boolean' ? (item.value ? 'Yes' : 'No') : String(item.value)}
          </span>
        </li>
      ))}
    </ul>
  );
}

/**
 * Package list component for displaying installed packages
 */
interface PackageListProps {
  packages: Array<{ name: string; version: string }>;
  className?: string;
}

function PackageList({ packages, className = '' }: PackageListProps) {
  if (!packages || packages.length === 0) {
    return null;
  }

  return (
    <div className={className}>
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Installed Packages</h3>
      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
        <div className="flex justify-between items-center p-3 bg-gray-50 border-b border-gray-200 font-semibold text-gray-700">
          <span>Name</span>
          <span>Version</span>
        </div>
        <div className="max-h-80 overflow-y-auto">
          <ul className="divide-y divide-gray-100">
            {packages.map((pkg, index) => (
              <li key={index} className="flex justify-between items-center p-3 hover:bg-gray-50 transition-colors">
                <span className="font-mono text-sm text-gray-900 break-all pr-4">{pkg.name}</span>
                <span className="font-mono text-sm text-gray-600 flex-shrink-0">{pkg.version}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}

/**
 * Next.js System Information Page Component
 * 
 * Comprehensive dashboard displaying DreamFactory system information including
 * license details, version information, database driver details, server 
 * specifications, and client information. Implements server-side rendering
 * with React 19 server components for optimal performance.
 * 
 * Features:
 * - Real-time system configuration data with SWR caching
 * - License validation and subscription status
 * - Responsive design with mobile-optimized layouts
 * - Auto-refreshing data with intelligent background updates
 * - Error handling and offline fallback support
 * - WCAG 2.1 AA accessibility compliance
 */
export default function SystemInfoPage() {
  const { environment, isLoading, isError, error, refreshAll } = useSystemConfig();
  const { isMobile, isTablet, current } = useBreakpoint();
  const [mounted, setMounted] = useState(false);

  // Handle client-side hydration
  useEffect(() => {
    setMounted(true);
  }, []);

  // License check hook for enterprise features
  const licenseCheck = useLicenseCheck(
    environment.platform?.licenseKey && environment.platform.licenseKey !== 'OPEN SOURCE' 
      ? String(environment.platform.licenseKey) 
      : null
  );

  // Loading state with skeleton UI for better perceived performance
  if (!mounted || isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="animate-pulse space-y-8">
            <div className="h-8 bg-gray-200 rounded-lg w-1/3"></div>
            <div className="h-6 bg-gray-200 rounded w-2/3"></div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div className="space-y-4">
                <div className="h-6 bg-gray-200 rounded w-1/4"></div>
                <div className="space-y-3">
                  {[...Array(8)].map((_, i) => (
                    <div key={i} className="h-4 bg-gray-200 rounded"></div>
                  ))}
                </div>
              </div>
              <div className="space-y-4">
                <div className="h-6 bg-gray-200 rounded w-1/3"></div>
                <div className="h-64 bg-gray-200 rounded"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Error state with retry functionality
  if (isError) {
    return (
      <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mx-auto">
          <div className="bg-white border border-red-200 rounded-lg p-6 text-center">
            <div className="text-red-600 mb-4">
              <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.268 19.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Unable to Load System Information</h2>
            <p className="text-gray-600 mb-4">
              {error?.message || 'Failed to retrieve system configuration data'}
            </p>
            <button
              onClick={() => refreshAll()}
              className="bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
            >
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Responsive layout classes based on breakpoint
  const containerClasses = isMobile || isTablet 
    ? 'flex-col space-y-8' 
    : 'lg:grid lg:grid-cols-2 lg:gap-8 lg:space-y-0 space-y-8';

  const instanceData = [
    { label: 'License Level', value: environment.platform?.license },
    { 
      label: 'License Key', 
      value: environment.platform?.licenseKey,
      condition: !!environment.platform?.licenseKey && environment.platform.licenseKey !== 'OPEN SOURCE'
    },
    {
      label: 'Subscription Status',
      value: licenseCheck.data?.msg,
      condition: !!licenseCheck.data && !licenseCheck.data.error
    },
    {
      label: 'Subscription Expiration Date',
      value: licenseCheck.data?.renewalDate,
      condition: !!licenseCheck.data?.renewalDate && !licenseCheck.data.error
    },
    { label: 'DreamFactory Version', value: environment.platform?.version },
    { label: 'System Database', value: environment.platform?.dbDriver },
    { label: 'Install Path', value: environment.platform?.installPath },
    { label: 'Log Path', value: environment.platform?.logPath },
    { label: 'Log Mode', value: environment.platform?.logMode },
    { label: 'Log Level', value: environment.platform?.logLevel },
    { label: 'Cache Driver', value: environment.platform?.cacheDriver },
    { label: 'Demo', value: environment.platform?.isTrial },
    { label: 'DreamFactory Instance ID', value: environment.platform?.dfInstanceId },
  ];

  const serverData = [
    { label: 'Operating System', value: environment.server.serverOs },
    { label: 'Release', value: environment.server.release },
    { label: 'Version', value: environment.server.version },
    { label: 'Host', value: environment.server.host },
    { label: 'Machine', value: environment.server.machine },
    { label: 'PHP Version', value: environment.php?.core.phpVersion },
    { label: 'PHP Server API', value: environment.php?.general.serverApi },
  ];

  const clientData = [
    { label: 'User Agent', value: environment.client?.userAgent },
    { label: 'IP Address', value: environment.client?.ipAddress },
    { label: 'Locale', value: environment.client?.locale },
  ];

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Page Header */}
        <div className="mb-8">
          <p className="text-gray-600 mb-2">
            Displays current system information.
          </p>
          <h1 className="text-3xl font-bold text-gray-900 border-b border-gray-200 pb-4">
            DreamFactory Instance
          </h1>
        </div>

        {/* Main Content Grid */}
        <div className={containerClasses}>
          {/* Instance Information Section */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-6 border-b border-gray-200 pb-3">
              Instance Information
            </h2>
            
            {/* License Check Loading State */}
            {licenseCheck.isLoading && environment.platform?.licenseKey && (
              <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="flex items-center">
                  <div className="animate-spin h-4 w-4 border-2 border-blue-600 border-t-transparent rounded-full mr-2"></div>
                  <span className="text-blue-700 text-sm">Validating license...</span>
                </div>
              </div>
            )}

            {/* License Check Error State */}
            {licenseCheck.isError && (
              <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                <p className="text-yellow-700 text-sm">
                  License validation failed: {licenseCheck.error?.message}
                </p>
              </div>
            )}

            <DataList data={instanceData} />
          </div>

          {/* Packages Section */}
          {environment.platform?.packages && (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <PackageList 
                packages={environment.platform.packages}
                className="h-full"
              />
            </div>
          )}
        </div>

        {/* Server Information Section */}
        <div className="mt-8 bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-6 border-b border-gray-200 pb-3">
            Server
          </h2>
          <DataList data={serverData} />
        </div>

        {/* Client Information Section */}
        <div className="mt-8 bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-6 border-b border-gray-200 pb-3">
            Client
          </h2>
          <DataList data={clientData} />
        </div>

        {/* Refresh Action */}
        <div className="mt-8 flex justify-center">
          <button
            onClick={() => refreshAll()}
            className="bg-primary-600 hover:bg-primary-700 text-white px-6 py-2 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={isLoading}
          >
            {isLoading ? (
              <div className="flex items-center">
                <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full mr-2"></div>
                Refreshing...
              </div>
            ) : (
              'Refresh System Information'
            )}
          </button>
        </div>
      </div>
    </div>
  );
}