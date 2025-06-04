/**
 * System Information React Query Hook
 * 
 * Intelligent caching hook for DreamFactory system information with SWR
 * patterns, license validation, and real-time status monitoring. Replaces
 * Angular DfSystemConfigDataService with React Query optimization.
 * 
 * Features:
 * - Sub-50ms cache hit responses per performance requirements
 * - Automatic background revalidation with 30-second intervals
 * - License status integration with DfLicenseCheckService patterns
 * - Error boundaries and loading states for Next.js app router
 * - SSR-compatible with hydration support
 * 
 * @author DreamFactory Admin Interface Team
 * @version React 19/Next.js 15.1 Migration
 */

'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useCallback, useMemo } from 'react';
import { apiClient, API_BASE_URL, SYSTEM_API_URL } from '@/lib/api-client';
import type {
  Environment,
  System,
  CheckResponse,
  SystemStatus,
  SystemInfoResponse,
  HealthCheckResponse,
  SystemInfoDisplayData,
  UseSystemInfoOptions,
  SystemInfoError,
  LicenseInfo,
} from '@/types/system-info';

// ============================================================================
// QUERY KEYS
// ============================================================================

export const SYSTEM_INFO_QUERY_KEYS = {
  all: ['system-info'] as const,
  environment: () => [...SYSTEM_INFO_QUERY_KEYS.all, 'environment'] as const,
  system: () => [...SYSTEM_INFO_QUERY_KEYS.all, 'system'] as const,
  license: (key: string) => [...SYSTEM_INFO_QUERY_KEYS.all, 'license', key] as const,
  status: () => [...SYSTEM_INFO_QUERY_KEYS.all, 'status'] as const,
  health: () => [...SYSTEM_INFO_QUERY_KEYS.all, 'health'] as const,
} as const;

// ============================================================================
// API FUNCTIONS
// ============================================================================

/**
 * Fetch environment information from DreamFactory system API
 */
async function fetchEnvironment(): Promise<Environment> {
  try {
    const response = await fetch(`${SYSTEM_API_URL}/environment`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'X-DreamFactory-Cache': 'true',
      },
      // Enable aggressive caching for environment data
      cache: 'force-cache',
      next: { revalidate: 60 }, // Revalidate every minute
    });

    if (!response.ok) {
      throw new Error(`Environment fetch failed: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    return data as Environment;
  } catch (error) {
    console.error('Environment fetch error:', error);
    throw new SystemInfoError(
      'ENVIRONMENT_FETCH_ERROR',
      error instanceof Error ? error.message : 'Failed to fetch environment data'
    );
  }
}

/**
 * Fetch system resource information
 */
async function fetchSystem(): Promise<System> {
  try {
    const response = await fetch(`${SYSTEM_API_URL}/system`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'skip-error': 'true',
        'X-DreamFactory-Cache': 'true',
      },
      cache: 'force-cache',
      next: { revalidate: 300 }, // Revalidate every 5 minutes
    });

    if (!response.ok) {
      // System endpoint may not be available in all configurations
      console.warn(`System fetch failed: ${response.status} ${response.statusText}`);
      return { resource: [] };
    }

    const data = await response.json();
    return data as System;
  } catch (error) {
    console.warn('System fetch error:', error);
    // Return empty system data rather than throwing for non-critical data
    return { resource: [] };
  }
}

/**
 * Check license status using license key
 */
async function checkLicenseStatus(licenseKey: string): Promise<CheckResponse> {
  try {
    const response = await fetch(`${API_BASE_URL}/license/check`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-DreamFactory-Cache': 'true',
      },
      body: JSON.stringify({ license_key: licenseKey }),
      cache: 'no-store', // License status should be fresh
    });

    if (!response.ok) {
      throw new Error(`License check failed: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    return data as CheckResponse;
  } catch (error) {
    console.error('License check error:', error);
    throw new SystemInfoError(
      'LICENSE_CHECK_ERROR',
      error instanceof Error ? error.message : 'Failed to check license status'
    );
  }
}

/**
 * Fetch comprehensive health check
 */
async function fetchHealthCheck(): Promise<HealthCheckResponse> {
  const startTime = Date.now();
  
  try {
    const response = await fetch(`${SYSTEM_API_URL}/health`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      cache: 'no-store', // Health should always be fresh
    });

    const responseTime = Date.now() - startTime;

    if (!response.ok) {
      return {
        status: 'unhealthy',
        timestamp: new Date().toISOString(),
        responseTime,
        services: {
          database: 'down',
          cache: 'down',
          storage: 'down',
        },
      };
    }

    const data = await response.json();
    return {
      ...data,
      responseTime,
      timestamp: new Date().toISOString(),
    } as HealthCheckResponse;
  } catch (error) {
    return {
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      responseTime: Date.now() - startTime,
      services: {
        database: 'down',
        cache: 'down',
        storage: 'down',
      },
    };
  }
}

// ============================================================================
// SYSTEM INFO ERROR CLASS
// ============================================================================

class SystemInfoError extends Error {
  constructor(
    public code: string,
    message: string,
    public details?: Record<string, any>
  ) {
    super(message);
    this.name = 'SystemInfoError';
  }
}

// ============================================================================
// MAIN HOOK
// ============================================================================

/**
 * System Information Hook with React Query Integration
 * 
 * Provides comprehensive system information with intelligent caching,
 * automatic revalidation, and license status monitoring. Optimized for
 * sub-50ms cache responses and SSR compatibility.
 * 
 * @param options - Configuration options for data fetching behavior
 * @returns Comprehensive system information state and utilities
 * 
 * @example
 * ```tsx
 * function SystemInfoPage() {
 *   const {
 *     environment,
 *     system,
 *     licenseStatus,
 *     displayData,
 *     isLoading,
 *     error,
 *     refetch,
 *   } = useSystemInfo({
 *     refreshInterval: 30000,
 *     includeLicenseCheck: true,
 *   });
 * 
 *   if (isLoading) return <SystemInfoSkeleton />;
 *   if (error) return <ErrorBoundary error={error} />;
 * 
 *   return <SystemInfoDisplay data={displayData} />;
 * }
 * ```
 */
export function useSystemInfo(options: UseSystemInfoOptions = {}) {
  const {
    refreshInterval = 30000, // 30 seconds
    enableBackgroundRefresh = true,
    includeLicenseCheck = true,
    cacheTTL = 60000, // 1 minute
    enableRealTimeStatus = false,
  } = options;

  const queryClient = useQueryClient();

  // ============================================================================
  // ENVIRONMENT QUERY
  // ============================================================================

  const environmentQuery = useQuery({
    queryKey: SYSTEM_INFO_QUERY_KEYS.environment(),
    queryFn: fetchEnvironment,
    staleTime: cacheTTL,
    gcTime: cacheTTL * 2, // Keep in cache for 2x TTL
    refetchInterval: enableBackgroundRefresh ? refreshInterval : false,
    refetchIntervalInBackground: true,
    refetchOnWindowFocus: true,
    refetchOnReconnect: true,
    retry: (failureCount, error) => {
      // Retry up to 3 times with exponential backoff
      if (failureCount >= 3) return false;
      const delay = Math.min(1000 * Math.pow(2, failureCount), 10000);
      setTimeout(() => {}, delay);
      return true;
    },
    retryDelay: (attemptIndex) => Math.min(1000 * Math.pow(2, attemptIndex), 10000),
  });

  // ============================================================================
  // SYSTEM QUERY
  // ============================================================================

  const systemQuery = useQuery({
    queryKey: SYSTEM_INFO_QUERY_KEYS.system(),
    queryFn: fetchSystem,
    staleTime: cacheTTL * 5, // System resources change less frequently
    gcTime: cacheTTL * 10,
    refetchInterval: enableBackgroundRefresh ? refreshInterval * 2 : false,
    refetchIntervalInBackground: false,
    refetchOnWindowFocus: false,
    retry: 1, // Fewer retries for non-critical system data
  });

  // ============================================================================
  // LICENSE STATUS QUERY
  // ============================================================================

  const licenseKey = environmentQuery.data?.platform?.licenseKey;
  const shouldCheckLicense = includeLicenseCheck && 
    licenseKey && 
    typeof licenseKey === 'string' &&
    environmentQuery.data?.platform?.license !== 'OPEN SOURCE';

  const licenseQuery = useQuery({
    queryKey: SYSTEM_INFO_QUERY_KEYS.license(licenseKey as string),
    queryFn: () => checkLicenseStatus(licenseKey as string),
    enabled: shouldCheckLicense,
    staleTime: cacheTTL * 2, // License status cached for 2 minutes
    gcTime: cacheTTL * 4,
    refetchInterval: enableBackgroundRefresh ? refreshInterval * 3 : false,
    refetchIntervalInBackground: false,
    retry: 2,
  });

  // ============================================================================
  // HEALTH CHECK QUERY
  // ============================================================================

  const healthQuery = useQuery({
    queryKey: SYSTEM_INFO_QUERY_KEYS.health(),
    queryFn: fetchHealthCheck,
    enabled: enableRealTimeStatus,
    staleTime: 5000, // Health status stale after 5 seconds
    gcTime: 10000,
    refetchInterval: enableRealTimeStatus ? 15000 : false, // Check every 15 seconds
    refetchIntervalInBackground: true,
    retry: 1,
  });

  // ============================================================================
  // COMPUTED VALUES
  // ============================================================================

  /**
   * Transform raw data into display-friendly format
   */
  const displayData = useMemo((): SystemInfoDisplayData | null => {
    if (!environmentQuery.data) return null;

    const env = environmentQuery.data;
    
    return {
      platform: {
        license: {
          level: env.platform?.license || 'Unknown',
          key: env.platform?.licenseKey,
          subscriptionStatus: licenseQuery.data,
        },
        version: env.platform?.version || 'Unknown',
        database: env.platform?.dbDriver || 'Unknown',
        paths: {
          install: env.platform?.installPath || 'Not specified',
          log: env.platform?.logPath || 'Not specified',
        },
        logging: {
          mode: env.platform?.logMode || 'Unknown',
          level: env.platform?.logLevel || 'Unknown',
        },
        cache: env.platform?.cacheDriver || 'Unknown',
        instance: {
          id: env.platform?.dfInstanceId || 'Unknown',
          isTrial: env.platform?.isTrial || false,
          isDemo: env.platform?.bitnamiDemo || false,
        },
        packages: env.platform?.packages || [],
      },
      server: {
        os: env.server.serverOs || 'Unknown',
        release: env.server.release || 'Unknown',
        version: env.server.version || 'Unknown',
        host: env.server.host || 'Unknown',
        machine: env.server.machine || 'Unknown',
      },
      php: env.php ? {
        version: env.php.core.phpVersion || 'Unknown',
        serverApi: env.php.general.serverApi || 'Unknown',
      } : undefined,
      client: {
        userAgent: env.client?.userAgent || 'Unknown',
        ipAddress: env.client?.ipAddress || 'Unknown',
        locale: env.client?.locale || 'Unknown',
      },
    };
  }, [environmentQuery.data, licenseQuery.data]);

  /**
   * Combined loading state
   */
  const isLoading = environmentQuery.isLoading;

  /**
   * Combined error state
   */
  const error = environmentQuery.error || systemQuery.error || licenseQuery.error;

  /**
   * System status information
   */
  const systemStatus: SystemStatus | null = useMemo(() => {
    if (!environmentQuery.data) return null;

    return {
      isOnline: !environmentQuery.isError && !systemQuery.isError,
      lastUpdated: new Date(environmentQuery.dataUpdatedAt),
      responseTime: healthQuery.data?.responseTime || 0,
      environment: environmentQuery.data,
      licenseStatus: licenseQuery.data,
    };
  }, [
    environmentQuery.data,
    environmentQuery.isError,
    environmentQuery.dataUpdatedAt,
    systemQuery.isError,
    licenseQuery.data,
    healthQuery.data,
  ]);

  // ============================================================================
  // MUTATION FUNCTIONS
  // ============================================================================

  /**
   * Force refresh all system information
   */
  const refreshSystemInfo = useMutation({
    mutationFn: async () => {
      await queryClient.invalidateQueries({
        queryKey: SYSTEM_INFO_QUERY_KEYS.all,
      });
      return Promise.all([
        environmentQuery.refetch(),
        systemQuery.refetch(),
        licenseQuery.refetch(),
      ]);
    },
    onSuccess: () => {
      console.log('System information refreshed successfully');
    },
    onError: (error) => {
      console.error('Failed to refresh system information:', error);
    },
  });

  // ============================================================================
  // UTILITY FUNCTIONS
  // ============================================================================

  /**
   * Manual refetch function for all queries
   */
  const refetch = useCallback(async () => {
    return refreshSystemInfo.mutateAsync();
  }, [refreshSystemInfo]);

  /**
   * Check if data is stale and needs refresh
   */
  const isStale = useCallback(() => {
    const now = Date.now();
    return (
      now - environmentQuery.dataUpdatedAt > cacheTTL ||
      (licenseQuery.data && now - licenseQuery.dataUpdatedAt > cacheTTL)
    );
  }, [environmentQuery.dataUpdatedAt, licenseQuery.dataUpdatedAt, cacheTTL]);

  /**
   * Get cache hit ratio for performance monitoring
   */
  const getCacheStats = useCallback(() => {
    return {
      environmentCacheHit: environmentQuery.isStale === false,
      systemCacheHit: systemQuery.isStale === false,
      licenseCacheHit: licenseQuery.isStale === false,
      lastFetch: new Date(Math.max(
        environmentQuery.dataUpdatedAt,
        systemQuery.dataUpdatedAt,
        licenseQuery.dataUpdatedAt || 0
      )),
    };
  }, [
    environmentQuery.isStale,
    environmentQuery.dataUpdatedAt,
    systemQuery.isStale,
    systemQuery.dataUpdatedAt,
    licenseQuery.isStale,
    licenseQuery.dataUpdatedAt,
  ]);

  // ============================================================================
  // RETURN HOOK STATE
  // ============================================================================

  return {
    // Raw data
    environment: environmentQuery.data,
    system: systemQuery.data,
    licenseStatus: licenseQuery.data,
    healthCheck: healthQuery.data,
    
    // Processed data
    displayData,
    systemStatus,
    
    // Loading states
    isLoading,
    isRefreshing: refreshSystemInfo.isPending,
    isFetching: environmentQuery.isFetching || systemQuery.isFetching || licenseQuery.isFetching,
    
    // Error states
    error,
    isError: !!error,
    
    // Utility functions
    refetch,
    isStale,
    getCacheStats,
    
    // Advanced state
    queries: {
      environment: environmentQuery,
      system: systemQuery,
      license: licenseQuery,
      health: healthQuery,
    },
  };
}

// ============================================================================
// HOOK UTILITIES
// ============================================================================

/**
 * Prefetch system information for SSR optimization
 */
export function prefetchSystemInfo(queryClient: any, options: UseSystemInfoOptions = {}) {
  const { cacheTTL = 60000, includeLicenseCheck = true } = options;

  return Promise.all([
    queryClient.prefetchQuery({
      queryKey: SYSTEM_INFO_QUERY_KEYS.environment(),
      queryFn: fetchEnvironment,
      staleTime: cacheTTL,
    }),
    queryClient.prefetchQuery({
      queryKey: SYSTEM_INFO_QUERY_KEYS.system(),
      queryFn: fetchSystem,
      staleTime: cacheTTL * 5,
    }),
  ]);
}

/**
 * Export query keys for external cache management
 */
export { SYSTEM_INFO_QUERY_KEYS };

/**
 * Export error class for error handling
 */
export { SystemInfoError };