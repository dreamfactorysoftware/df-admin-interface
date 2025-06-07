'use client';

import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useCallback, useMemo } from 'react';
import { apiClient } from '@/lib/api-client';
import { useSession } from './use-session';

// System configuration types - these will be imported from src/types/system.ts and src/types/environment.ts when available
interface AuthService {
  name: string;
  type: string;
  config: Record<string, any>;
}

interface LdapService extends AuthService {
  type: 'ldap';
}

interface Environment {
  authentication: {
    allowOpenRegistration: boolean;
    openRegEmailServiceId: number;
    allowForeverSessions: boolean;
    loginAttribute: string;
    adldap: Array<LdapService>;
    oauth: Array<AuthService>;
    saml: Array<AuthService>;
  };
  platform?: {
    version: string;
    bitnamiDemo: boolean;
    isHosted: boolean;
    isTrial: boolean;
    license: string;
    securedPackageExport: boolean;
    licenseKey: string | boolean;
    dbDriver: string;
    installPath: string;
    logPath: string;
    appDebug: boolean;
    logMode: string;
    logLevel: string;
    cacheDriver: string;
    packages: Array<{
      name: string;
      version: string;
    }>;
    dfInstanceId: string;
    rootAdminExists: boolean;
  };
  server: {
    host: string;
    machine: string;
    release: string;
    serverOs: string;
    version: string;
  };
  php?: {
    core: {
      phpVersion: string;
    };
    general: {
      serverApi: string;
    };
  };
  client?: {
    userAgent: string;
    ipAddress: string;
    locale: string;
  };
}

interface System {
  resource: Array<{
    name: string;
  }>;
}

// Default configuration fallbacks
const DEFAULT_ENVIRONMENT: Environment = {
  authentication: {
    allowOpenRegistration: false,
    openRegEmailServiceId: 0,
    allowForeverSessions: false,
    loginAttribute: 'email',
    adldap: [],
    oauth: [],
    saml: [],
  },
  server: {
    host: '',
    machine: '',
    release: '',
    serverOs: '',
    version: '',
  },
};

const DEFAULT_SYSTEM: System = {
  resource: [],
};

// API endpoints
const URLS = {
  ENVIRONMENT: '/api/v2/system/environment',
  SYSTEM: '/api/v2/system',
} as const;

// Query keys for React Query cache management
export const SYSTEM_CONFIG_QUERY_KEYS = {
  environment: ['system', 'environment'] as const,
  system: ['system', 'config'] as const,
} as const;

/**
 * Custom hook for managing system configuration data with React Query
 * 
 * Replaces Angular DfSystemConfigDataService with intelligent caching,
 * automatic background synchronization, and comprehensive error handling.
 * 
 * Features:
 * - React Query intelligent caching with configurable TTL
 * - Automatic background refetching for real-time configuration updates
 * - Error handling with authentication token clearance on failures
 * - Loading state integration with global loading indicators
 * - Configuration validation with fallback to default values
 * - Retry logic with exponential backoff for transient failures
 */
export function useSystemConfig() {
  const queryClient = useQueryClient();
  const { clearSession } = useSession();

  /**
   * Fetch environment configuration with error handling and token management
   */
  const fetchEnvironmentData = useCallback(async (): Promise<Environment> => {
    try {
      const response = await apiClient.get<Environment>(URLS.ENVIRONMENT, {
        headers: {
          'show-loading': '', // Integrate with global loading indicators
        },
      });
      return response;
    } catch (error) {
      // Clear authentication token on configuration fetch failures
      // This matches the original Angular service behavior
      clearSession();
      throw error;
    }
  }, [clearSession]);

  /**
   * Fetch system configuration with error handling
   */
  const fetchSystemData = useCallback(async (): Promise<System> => {
    try {
      const response = await apiClient.get<System>(URLS.SYSTEM, {
        headers: {
          'show-loading': '', // Integrate with global loading indicators
          'skip-error': 'true', // Skip automatic error handling for system data
        },
      });
      return response;
    } catch (error) {
      // For system data, we don't clear tokens but still throw to handle gracefully
      throw error;
    }
  }, []);

  /**
   * Environment configuration query with intelligent caching
   */
  const environmentQuery = useQuery({
    queryKey: SYSTEM_CONFIG_QUERY_KEYS.environment,
    queryFn: fetchEnvironmentData,
    staleTime: 5 * 60 * 1000, // 5 minutes - environment data is relatively stable
    cacheTime: 10 * 60 * 1000, // 10 minutes - keep in cache longer
    retry: (failureCount, error) => {
      // Retry once for environment data to handle transient network issues
      return failureCount < 1;
    },
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000), // Exponential backoff
    refetchOnWindowFocus: true, // Ensure fresh data when user returns
    refetchOnReconnect: true, // Refetch on network reconnection
    keepPreviousData: true, // Maintain previous data during refetch
    select: (data) => {
      // Validate and provide fallbacks for missing data
      return {
        ...DEFAULT_ENVIRONMENT,
        ...data,
        authentication: {
          ...DEFAULT_ENVIRONMENT.authentication,
          ...data.authentication,
        },
        server: {
          ...DEFAULT_ENVIRONMENT.server,
          ...data.server,
        },
      };
    },
  });

  /**
   * System configuration query with intelligent caching
   */
  const systemQuery = useQuery({
    queryKey: SYSTEM_CONFIG_QUERY_KEYS.system,
    queryFn: fetchSystemData,
    staleTime: 10 * 60 * 1000, // 10 minutes - system data changes less frequently
    cacheTime: 15 * 60 * 1000, // 15 minutes - keep in cache longer
    retry: false, // Don't retry system data fetch to avoid unnecessary load
    refetchOnWindowFocus: false, // System data doesn't need frequent refetch
    refetchOnReconnect: true, // Still refetch on reconnection
    keepPreviousData: true, // Maintain previous data during refetch
    select: (data) => {
      // Validate and provide fallbacks for missing data
      return {
        ...DEFAULT_SYSTEM,
        ...data,
        resource: data?.resource || DEFAULT_SYSTEM.resource,
      };
    },
  });

  /**
   * Manual refetch functions for force refresh scenarios
   */
  const refetchEnvironment = useCallback(() => {
    return environmentQuery.refetch();
  }, [environmentQuery]);

  const refetchSystem = useCallback(() => {
    return systemQuery.refetch();
  }, [systemQuery]);

  /**
   * Clear all system configuration cache
   */
  const clearSystemConfigCache = useCallback(() => {
    queryClient.removeQueries({ queryKey: ['system'] });
  }, [queryClient]);

  /**
   * Validate if environment configuration is valid
   */
  const isEnvironmentValid = useMemo(() => {
    return !!(
      environmentQuery.data?.server?.host ||
      environmentQuery.data?.server?.version
    );
  }, [environmentQuery.data]);

  /**
   * Validate if system configuration is valid
   */
  const isSystemValid = useMemo(() => {
    return !!(systemQuery.data?.resource && Array.isArray(systemQuery.data.resource));
  }, [systemQuery.data]);

  /**
   * Combined loading state for both queries
   */
  const isLoading = environmentQuery.isLoading || systemQuery.isLoading;

  /**
   * Combined error state for both queries
   */
  const error = environmentQuery.error || systemQuery.error;

  /**
   * Combined fetching state for background updates
   */
  const isFetching = environmentQuery.isFetching || systemQuery.isFetching;

  /**
   * Check if data is stale and needs refresh
   */
  const isStale = environmentQuery.isStale || systemQuery.isStale;

  return {
    // Data with fallbacks
    environment: environmentQuery.data || DEFAULT_ENVIRONMENT,
    system: systemQuery.data || DEFAULT_SYSTEM,
    
    // Loading states
    isLoading,
    isFetching,
    isStale,
    
    // Error states
    error,
    environmentError: environmentQuery.error,
    systemError: systemQuery.error,
    
    // Validation states
    isEnvironmentValid,
    isSystemValid,
    
    // Manual control functions
    refetchEnvironment,
    refetchSystem,
    clearSystemConfigCache,
    
    // Individual query states for advanced usage
    environmentQuery: {
      isLoading: environmentQuery.isLoading,
      isFetching: environmentQuery.isFetching,
      isStale: environmentQuery.isStale,
      error: environmentQuery.error,
      refetch: environmentQuery.refetch,
    },
    systemQuery: {
      isLoading: systemQuery.isLoading,
      isFetching: systemQuery.isFetching,
      isStale: systemQuery.isStale,
      error: systemQuery.error,
      refetch: systemQuery.refetch,
    },
  };
}

/**
 * Helper hook to get only environment configuration
 */
export function useEnvironmentConfig() {
  const { environment, environmentError, environmentQuery } = useSystemConfig();
  
  return {
    environment,
    error: environmentError,
    isLoading: environmentQuery.isLoading,
    isFetching: environmentQuery.isFetching,
    isStale: environmentQuery.isStale,
    refetch: environmentQuery.refetch,
  };
}

/**
 * Helper hook to get only system configuration
 */
export function useSystemConfigData() {
  const { system, systemError, systemQuery } = useSystemConfig();
  
  return {
    system,
    error: systemError,
    isLoading: systemQuery.isLoading,
    isFetching: systemQuery.isFetching,
    isStale: systemQuery.isStale,
    refetch: systemQuery.refetch,
  };
}

export default useSystemConfig;