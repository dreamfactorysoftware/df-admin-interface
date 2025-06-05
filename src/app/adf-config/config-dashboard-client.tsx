'use client';

import { useEffect, useState } from 'react';
import { 
  CheckCircleIcon, 
  ExclamationTriangleIcon,
  ClockIcon,
  ServerIcon,
  ChartBarIcon,
  RefreshIcon
} from '@heroicons/react/24/outline';
import { useSystemConfig } from '@/hooks/use-system-config';

/**
 * Configuration Dashboard Client Component
 * 
 * Client-side component for the configuration dashboard that handles:
 * - Real-time system status monitoring using SWR/React Query
 * - Interactive system configuration overview
 * - System health indicators and metrics
 * - Background data synchronization and caching
 * 
 * Replaces Angular service-based dashboard with React Query intelligent caching
 * and provides enhanced user experience with optimistic updates and error handling.
 */

interface SystemMetric {
  label: string;
  value: string | number;
  status: 'healthy' | 'warning' | 'error' | 'unknown';
  description?: string;
}

/**
 * System status indicator component with accessibility features
 */
function StatusBadge({ 
  status, 
  label 
}: { 
  status: 'healthy' | 'warning' | 'error' | 'unknown';
  label: string;
}) {
  const statusConfig = {
    healthy: {
      bgColor: 'bg-green-100 dark:bg-green-900/20',
      textColor: 'text-green-800 dark:text-green-200',
      borderColor: 'border-green-200 dark:border-green-800',
      icon: CheckCircleIcon,
    },
    warning: {
      bgColor: 'bg-yellow-100 dark:bg-yellow-900/20',
      textColor: 'text-yellow-800 dark:text-yellow-200',
      borderColor: 'border-yellow-200 dark:border-yellow-800',
      icon: ExclamationTriangleIcon,
    },
    error: {
      bgColor: 'bg-red-100 dark:bg-red-900/20',
      textColor: 'text-red-800 dark:text-red-200',
      borderColor: 'border-red-200 dark:border-red-800',
      icon: ExclamationTriangleIcon,
    },
    unknown: {
      bgColor: 'bg-gray-100 dark:bg-gray-900/20',
      textColor: 'text-gray-800 dark:text-gray-200',
      borderColor: 'border-gray-200 dark:border-gray-800',
      icon: ClockIcon,
    },
  };

  const config = statusConfig[status];
  const IconComponent = config.icon;

  return (
    <span
      className={`
        inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border
        ${config.bgColor} ${config.textColor} ${config.borderColor}
      `}
      role="status"
      aria-label={`${label} status: ${status}`}
    >
      <IconComponent className="h-3 w-3 mr-1" aria-hidden="true" />
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </span>
  );
}

/**
 * System metrics display component
 */
function SystemMetricsCard({ metrics }: { metrics: SystemMetric[] }) {
  return (
    <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-medium text-gray-900 dark:text-white">
          System Overview
        </h3>
        <ChartBarIcon className="h-5 w-5 text-gray-400" />
      </div>
      
      <div className="space-y-4">
        {metrics.map((metric, index) => (
          <div key={index} className="flex items-center justify-between">
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-900 dark:text-white">
                {metric.label}
              </p>
              {metric.description && (
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {metric.description}
                </p>
              )}
            </div>
            <div className="flex items-center space-x-2">
              <span className="text-sm text-gray-600 dark:text-gray-300">
                {metric.value}
              </span>
              <StatusBadge status={metric.status} label={metric.label} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/**
 * Cache status component with flush action
 */
function CacheStatusCard() {
  const [isFlushingCache, setIsFlushingCache] = useState(false);
  
  const handleFlushCache = async () => {
    setIsFlushingCache(true);
    try {
      // Simulate cache flush operation
      // In real implementation, this would call the cache service
      await new Promise(resolve => setTimeout(resolve, 1000));
      // TODO: Implement actual cache flush via API client
    } catch (error) {
      console.error('Failed to flush cache:', error);
    } finally {
      setIsFlushingCache(false);
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-medium text-gray-900 dark:text-white">
          Cache Management
        </h3>
        <ServerIcon className="h-5 w-5 text-gray-400" />
      </div>
      
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-900 dark:text-white">
              System Cache
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Clear all cached data
            </p>
          </div>
          <StatusBadge status="healthy" label="Cache" />
        </div>
        
        <button
          onClick={handleFlushCache}
          disabled={isFlushingCache}
          className={`
            w-full flex items-center justify-center px-4 py-2 text-sm font-medium rounded-md
            transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500
            ${isFlushingCache 
              ? 'bg-gray-100 text-gray-400 cursor-not-allowed dark:bg-gray-700 dark:text-gray-500'
              : 'bg-blue-600 text-white hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-800'
            }
          `}
        >
          {isFlushingCache ? (
            <>
              <RefreshIcon className="h-4 w-4 mr-2 animate-spin" />
              Flushing Cache...
            </>
          ) : (
            <>
              <RefreshIcon className="h-4 w-4 mr-2" />
              Flush System Cache
            </>
          )}
        </button>
      </div>
    </div>
  );
}

/**
 * Main configuration dashboard client component
 */
export function ConfigDashboardClient() {
  const {
    environment,
    system,
    isLoading,
    isFetching,
    error,
    isEnvironmentValid,
    isSystemValid,
    refetchEnvironment,
    refetchSystem
  } = useSystemConfig();

  const [lastRefreshTime, setLastRefreshTime] = useState<Date | null>(null);

  // Update last refresh time when data is fetched
  useEffect(() => {
    if (!isFetching && !isLoading) {
      setLastRefreshTime(new Date());
    }
  }, [isFetching, isLoading]);

  // Generate system metrics from environment and system data
  const systemMetrics: SystemMetric[] = [
    {
      label: 'DreamFactory Version',
      value: environment.platform?.version || 'Unknown',
      status: isEnvironmentValid ? 'healthy' : 'unknown',
      description: 'Current platform version'
    },
    {
      label: 'Database Driver',
      value: environment.platform?.dbDriver || 'Unknown',
      status: environment.platform?.dbDriver ? 'healthy' : 'warning',
      description: 'Active database driver'
    },
    {
      label: 'Cache Driver',
      value: environment.platform?.cacheDriver || 'Unknown',
      status: environment.platform?.cacheDriver ? 'healthy' : 'warning',
      description: 'Active cache driver'
    },
    {
      label: 'Server OS',
      value: environment.server?.serverOs || 'Unknown',
      status: environment.server?.serverOs ? 'healthy' : 'unknown',
      description: 'Operating system'
    },
    {
      label: 'PHP Version',
      value: environment.php?.core?.phpVersion || 'Unknown',
      status: environment.php?.core?.phpVersion ? 'healthy' : 'warning',
      description: 'PHP runtime version'
    },
    {
      label: 'Available Services',
      value: system.resource?.length || 0,
      status: isSystemValid ? 'healthy' : 'unknown',
      description: 'Number of configured services'
    }
  ];

  const handleRefreshData = async () => {
    try {
      await Promise.all([refetchEnvironment(), refetchSystem()]);
    } catch (error) {
      console.error('Failed to refresh system data:', error);
    }
  };

  if (error) {
    return (
      <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-6">
        <div className="flex items-center space-x-3">
          <ExclamationTriangleIcon className="h-6 w-6 text-red-600 dark:text-red-400" />
          <div>
            <h3 className="text-lg font-medium text-red-900 dark:text-red-100 mb-2">
              Error Loading Configuration Data
            </h3>
            <p className="text-sm text-red-800 dark:text-red-200 mb-4">
              Failed to load system configuration. Please check your connection and try again.
            </p>
            <button
              onClick={handleRefreshData}
              className="inline-flex items-center px-4 py-2 text-sm font-medium text-red-700 bg-red-100 border border-red-300 rounded-md hover:bg-red-200 focus:outline-none focus:ring-2 focus:ring-red-500 dark:bg-red-800 dark:text-red-200 dark:border-red-700 dark:hover:bg-red-700"
            >
              <RefreshIcon className="h-4 w-4 mr-2" />
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* System Status Overview */}
      <section>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
            System Status Overview
          </h2>
          <div className="flex items-center space-x-4">
            {lastRefreshTime && (
              <span className="text-sm text-gray-500 dark:text-gray-400">
                Last updated: {lastRefreshTime.toLocaleTimeString()}
              </span>
            )}
            <button
              onClick={handleRefreshData}
              disabled={isLoading || isFetching}
              className={`
                inline-flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors duration-200
                focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500
                ${isLoading || isFetching
                  ? 'bg-gray-100 text-gray-400 cursor-not-allowed dark:bg-gray-700 dark:text-gray-500'
                  : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-600 dark:hover:bg-gray-700'
                }
              `}
            >
              <RefreshIcon 
                className={`h-4 w-4 mr-2 ${(isLoading || isFetching) ? 'animate-spin' : ''}`} 
              />
              {isLoading || isFetching ? 'Refreshing...' : 'Refresh'}
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          {/* System Metrics */}
          <SystemMetricsCard metrics={systemMetrics} />
          
          {/* Cache Management */}
          <CacheStatusCard />
        </div>
      </section>

      {/* Configuration Health Indicators */}
      <section>
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">
          Configuration Health
        </h2>
        
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-900 dark:text-white">
                  Environment
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Configuration validity
                </p>
              </div>
              <StatusBadge 
                status={isEnvironmentValid ? 'healthy' : 'warning'} 
                label="Environment" 
              />
            </div>
          </div>
          
          <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-900 dark:text-white">
                  Services
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  System services
                </p>
              </div>
              <StatusBadge 
                status={isSystemValid ? 'healthy' : 'warning'} 
                label="Services" 
              />
            </div>
          </div>
          
          <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-900 dark:text-white">
                  Authentication
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  User authentication
                </p>
              </div>
              <StatusBadge 
                status={environment.authentication ? 'healthy' : 'unknown'} 
                label="Authentication" 
              />
            </div>
          </div>
          
          <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-900 dark:text-white">
                  Platform
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Platform status
                </p>
              </div>
              <StatusBadge 
                status={environment.platform?.version ? 'healthy' : 'unknown'} 
                label="Platform" 
              />
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

export default ConfigDashboardClient;