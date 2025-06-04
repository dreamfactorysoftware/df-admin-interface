/**
 * System Information Page Component
 * 
 * Main system information display page implementing Next.js server component
 * architecture for comprehensive DreamFactory system, server, and client
 * information monitoring. Provides real-time system status display including
 * license details, subscription information, version data, database drivers,
 * installation paths, server specifications, and client context.
 * 
 * Features:
 * - SSR pages under 2 seconds per performance requirements
 * - React Query for server state caching with TTL configuration
 * - Responsive design maintaining WCAG 2.1 AA compliance
 * - Real-time system status monitoring with cache hit responses under 50ms
 * - Error boundaries and loading states per Next.js app router conventions
 * 
 * @author DreamFactory Admin Interface Team
 * @version React 19/Next.js 15.1 Migration
 */

'use client';

import React, { Suspense } from 'react';
import { useSystemInfo } from '@/hooks/use-system-info';
import { useBreakpoint } from '@/hooks/use-breakpoint';
import { 
  Card, 
  CardHeader, 
  CardTitle, 
  CardContent,
  StatsCard 
} from '@/components/ui/card';
import { 
  KeyValueList,
  DescriptionList,
  DescriptionTerm,
  DescriptionDetails 
} from '@/components/ui/list';
import { Badge, StatusBadge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import type { PackageInfo } from '@/types/system-info';

// ============================================================================
// LOADING SKELETON COMPONENT
// ============================================================================

function SystemInfoSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/3"></div>
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="bg-gray-100 dark:bg-gray-800 rounded-lg h-32"></div>
        ))}
      </div>
      <div className="space-y-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="bg-gray-100 dark:bg-gray-800 rounded-lg h-48"></div>
        ))}
      </div>
    </div>
  );
}

// ============================================================================
// ERROR BOUNDARY COMPONENT
// ============================================================================

interface ErrorBoundaryProps {
  error: Error;
  onRetry?: () => void;
}

function ErrorBoundary({ error, onRetry }: ErrorBoundaryProps) {
  return (
    <Card variant="error" className="max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="text-error-600 dark:text-error-400 flex items-center">
          <svg className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.464 0L4.35 16.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
          System Information Error
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
          Unable to load system information. Please check your connection and try again.
        </p>
        <details className="mb-4">
          <summary className="text-sm font-medium cursor-pointer text-gray-700 dark:text-gray-300">
            Error Details
          </summary>
          <code className="block mt-2 p-2 bg-gray-100 dark:bg-gray-800 rounded text-xs text-gray-800 dark:text-gray-200">
            {error.message}
          </code>
        </details>
        {onRetry && (
          <button
            onClick={onRetry}
            className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
          >
            Retry
          </button>
        )}
      </CardContent>
    </Card>
  );
}

// ============================================================================
// LICENSE STATUS COMPONENT
// ============================================================================

interface LicenseStatusProps {
  license: {
    level: string;
    key?: string | boolean;
    subscriptionStatus?: {
      msg: string;
      renewalDate: string;
      statusCode: string;
    };
  };
}

function LicenseStatus({ license }: LicenseStatusProps) {
  const getStatusVariant = (statusCode?: string) => {
    if (!statusCode) return 'secondary';
    
    switch (statusCode.toLowerCase()) {
      case 'active':
      case 'valid':
        return 'success';
      case 'expired':
      case 'invalid':
        return 'error';
      case 'warning':
        return 'warning';
      default:
        return 'secondary';
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          DreamFactory License
          <Badge variant={license.level === 'OPEN SOURCE' ? 'outline' : 'default'}>
            {license.level}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <DescriptionList variant="vertical" spacing="default">
          <div>
            <DescriptionTerm>License Level</DescriptionTerm>
            <DescriptionDetails>{license.level}</DescriptionDetails>
          </div>
          
          {license.key && typeof license.key === 'string' && (
            <div>
              <DescriptionTerm>License Key</DescriptionTerm>
              <DescriptionDetails className="font-mono text-xs">
                {license.key.substring(0, 16)}...
              </DescriptionDetails>
            </div>
          )}
          
          {license.subscriptionStatus && (
            <>
              <div>
                <DescriptionTerm>Subscription Status</DescriptionTerm>
                <DescriptionDetails>
                  <Badge variant={getStatusVariant(license.subscriptionStatus.statusCode)}>
                    {license.subscriptionStatus.msg}
                  </Badge>
                </DescriptionDetails>
              </div>
              
              <div>
                <DescriptionTerm>Renewal Date</DescriptionTerm>
                <DescriptionDetails>
                  {license.subscriptionStatus.renewalDate}
                </DescriptionDetails>
              </div>
            </>
          )}
        </DescriptionList>
      </CardContent>
    </Card>
  );
}

// ============================================================================
// PACKAGES LIST COMPONENT
// ============================================================================

interface PackagesListProps {
  packages: PackageInfo[];
  className?: string;
}

function PackagesList({ packages, className }: PackagesListProps) {
  if (!packages.length) {
    return (
      <div className={cn("text-center py-8 text-gray-500 dark:text-gray-400", className)}>
        <svg className="mx-auto h-8 w-8 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
        </svg>
        <p>No packages installed</p>
      </div>
    );
  }

  return (
    <div className={cn("space-y-2", className)}>
      <div className="grid grid-cols-2 gap-2 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide pb-2 border-b border-gray-200 dark:border-gray-700">
        <span>Package Name</span>
        <span>Version</span>
      </div>
      <div className="max-h-64 overflow-y-auto space-y-1">
        {packages.map((pkg, index) => (
          <div
            key={`${pkg.name}-${index}`}
            className="grid grid-cols-2 gap-2 py-1 text-sm border-b border-dotted border-gray-200 dark:border-gray-600 last:border-b-0"
          >
            <span className="text-gray-900 dark:text-gray-100 font-medium break-words">
              {pkg.name}
            </span>
            <span className="text-gray-600 dark:text-gray-400 font-mono">
              {pkg.version}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ============================================================================
// MAIN SYSTEM INFO COMPONENT
// ============================================================================

function SystemInfoContent() {
  const {
    displayData,
    systemStatus,
    isLoading,
    error,
    refetch,
    getCacheStats,
  } = useSystemInfo({
    refreshInterval: 30000,
    enableBackgroundRefresh: true,
    includeLicenseCheck: true,
    cacheTTL: 60000,
  });

  const { current, isMobile, isTablet } = useBreakpoint();

  // Handle loading state
  if (isLoading) {
    return <SystemInfoSkeleton />;
  }

  // Handle error state
  if (error || !displayData) {
    return <ErrorBoundary error={error || new Error('No data available')} onRetry={refetch} />;
  }

  const cacheStats = getCacheStats();
  const isCompact = isMobile || isTablet;

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            System Information
          </h1>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            Comprehensive DreamFactory system status and configuration details
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          <StatusBadge 
            status={systemStatus?.isOnline ? 'online' : 'offline'}
            pulse={systemStatus?.isOnline}
          />
          
          <Badge variant="outline" className="text-xs">
            Updated {systemStatus?.lastUpdated.toLocaleTimeString()}
          </Badge>
          
          <button
            onClick={refetch}
            className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800"
            title="Refresh system information"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          </button>
        </div>
      </div>

      {/* Performance Stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatsCard
          title="Response Time"
          value={`${systemStatus?.responseTime || 0}ms`}
          description="Last update response time"
          trend={{
            value: systemStatus?.responseTime && systemStatus.responseTime < 50 ? 15 : -5,
            label: "vs target",
            direction: systemStatus?.responseTime && systemStatus.responseTime < 50 ? 'up' : 'down'
          }}
          icon={
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          }
        />
        
        <StatsCard
          title="Cache Status"
          value={cacheStats.environmentCacheHit ? "HIT" : "MISS"}
          description="Environment data cache"
          icon={
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4" />
            </svg>
          }
        />
        
        <StatsCard
          title="Packages"
          value={displayData.platform.packages.length}
          description="Installed packages"
          icon={
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
            </svg>
          }
        />
        
        <StatsCard
          title="Instance Type"
          value={displayData.platform.instance.isTrial ? "Trial" : "Production"}
          description="Current instance mode"
          icon={
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
            </svg>
          }
        />
      </div>

      {/* Main Content Grid */}
      <div className={cn(
        "grid gap-6",
        isCompact ? "grid-cols-1" : "grid-cols-1 lg:grid-cols-3"
      )}>
        
        {/* DreamFactory Instance Information */}
        <div className={cn(isCompact ? "col-span-1" : "lg:col-span-2")}>
          <div className="grid gap-6">
            
            {/* License Information */}
            <LicenseStatus license={displayData.platform.license} />
            
            {/* Platform Details */}
            <Card>
              <CardHeader>
                <CardTitle>Platform Details</CardTitle>
              </CardHeader>
              <CardContent>
                <KeyValueList
                  variant="horizontal"
                  spacing="default"
                  items={[
                    {
                      key: "DreamFactory Version",
                      value: displayData.platform.version,
                      icon: (
                        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 4V2a1 1 0 011-1h8a1 1 0 011 1v2M7 4h10M7 4v16a1 1 0 001 1h8a1 1 0 001-1V4M5 8h14M5 12h14M5 16h14" />
                        </svg>
                      ),
                    },
                    {
                      key: "System Database",
                      value: displayData.platform.database,
                      icon: (
                        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4" />
                        </svg>
                      ),
                    },
                    {
                      key: "Install Path",
                      value: displayData.platform.paths.install,
                      icon: (
                        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
                        </svg>
                      ),
                    },
                    {
                      key: "Log Path",
                      value: displayData.platform.paths.log,
                      icon: (
                        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                      ),
                    },
                    {
                      key: "Log Mode",
                      value: displayData.platform.logging.mode,
                      badge: (
                        <Badge variant="outline" size="sm">
                          {displayData.platform.logging.level}
                        </Badge>
                      ),
                    },
                    {
                      key: "Cache Driver",
                      value: displayData.platform.cache,
                      icon: (
                        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4" />
                        </svg>
                      ),
                    },
                    {
                      key: "Instance ID",
                      value: displayData.platform.instance.id,
                      badge: displayData.platform.instance.isTrial ? (
                        <Badge variant="warning" size="sm">Trial</Badge>
                      ) : displayData.platform.instance.isDemo ? (
                        <Badge variant="info" size="sm">Demo</Badge>
                      ) : undefined,
                    },
                  ]}
                />
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Packages Sidebar */}
        <div className="lg:col-span-1">
          <Card className="h-fit">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                Installed Packages
                <Badge variant="secondary" size="sm">
                  {displayData.platform.packages.length}
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <PackagesList packages={displayData.platform.packages} />
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Server Information */}
      <Card>
        <CardHeader>
          <CardTitle>Server Information</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-6 md:grid-cols-2">
            <KeyValueList
              variant="vertical"
              spacing="default"
              items={[
                {
                  key: "Operating System",
                  value: displayData.server.os,
                  icon: (
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                  ),
                },
                {
                  key: "Release",
                  value: displayData.server.release,
                },
                {
                  key: "Version",
                  value: displayData.server.version,
                },
              ]}
            />
            
            <KeyValueList
              variant="vertical"
              spacing="default"
              items={[
                {
                  key: "Host",
                  value: displayData.server.host,
                  icon: (
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9v-9m0-9v9" />
                    </svg>
                  ),
                },
                {
                  key: "Machine",
                  value: displayData.server.machine,
                },
                ...(displayData.php ? [
                  {
                    key: "PHP Version",
                    value: displayData.php.version,
                    icon: (
                      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
                      </svg>
                    ),
                  },
                  {
                    key: "PHP Server API",
                    value: displayData.php.serverApi,
                  },
                ] : []),
              ]}
            />
          </div>
        </CardContent>
      </Card>

      {/* Client Information */}
      <Card>
        <CardHeader>
          <CardTitle>Client Information</CardTitle>
        </CardHeader>
        <CardContent>
          <KeyValueList
            variant="horizontal"
            spacing="default"
            items={[
              {
                key: "User Agent",
                value: (
                  <span className="break-all text-xs font-mono">
                    {displayData.client.userAgent}
                  </span>
                ),
                icon: (
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9v-9m0-9v9" />
                  </svg>
                ),
              },
              {
                key: "IP Address",
                value: displayData.client.ipAddress,
                icon: (
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                ),
              },
              {
                key: "Locale",
                value: displayData.client.locale,
                icon: (
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9v-9m0-9v9" />
                  </svg>
                ),
              },
            ]}
          />
        </CardContent>
      </Card>
    </div>
  );
}

// ============================================================================
// MAIN PAGE COMPONENT
// ============================================================================

/**
 * System Information Page
 * 
 * Next.js page component for displaying comprehensive DreamFactory system
 * information with SSR optimization and real-time monitoring capabilities.
 */
export default function SystemInfoPage() {
  return (
    <div className="container mx-auto px-4 py-6 max-w-7xl">
      <Suspense fallback={<SystemInfoSkeleton />}>
        <SystemInfoContent />
      </Suspense>
    </div>
  );
}

// ============================================================================
// METADATA EXPORT FOR SEO
// ============================================================================

export const metadata = {
  title: 'System Information - DreamFactory Admin',
  description: 'Comprehensive DreamFactory system status, server information, and configuration details',
  keywords: 'DreamFactory, system information, server status, admin interface',
};