'use client';

import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useCallback, useEffect } from 'react';
import { apiClient } from '@/lib/api-client';
import { useSession } from '@/hooks/use-session';

// Temporary types until system.ts and environment.ts are created
interface AuthService {
  id: number;
  name: string;
  type: string;
  is_active: boolean;
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

// Default configuration fallbacks for offline scenarios
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

// Query keys for React Query caching
const QUERY_KEYS = {
  environment: ['system', 'environment'] as const,
  system: ['system', 'config'] as const,
} as const;

/**
 * System configuration hook that manages environment and system data fetching,
 * caching, and reactive updates. Replaces Angular DfSystemConfigDataService
 * with React Query intelligent caching, automatic background synchronization,
 * and error handling for system-wide configuration management.
 */
export function useSystemConfig() {
  const { clearSession } = useSession();
  const queryClient = useQueryClient();

  // Environment data query with intelligent caching
  const environmentQuery = useQuery({
    queryKey: QUERY_KEYS.environment,
    queryFn: async (): Promise<Environment> => {
      try {
        const response = await apiClient.get<Environment>('/api/v2/system/environment', {
          headers: {
            'show-loading': '', // Maintains original header pattern
          },
        });
        return response.data;
      } catch (error) {
        // Clear token on environment fetch failure per original service behavior
        clearSession();
        throw error;
      }
    },
    staleTime: 5 * 60 * 1000, // 5 minutes - configuration doesn't change frequently
    gcTime: 10 * 60 * 1000, // 10 minutes cache retention
    retry: 1, // Matches original retry behavior
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
    refetchOnWindowFocus: false, // System config doesn't need frequent refetching
    refetchOnReconnect: true, // Refetch when connection is restored
  });

  // System data query with intelligent caching
  const systemQuery = useQuery({
    queryKey: QUERY_KEYS.system,
    queryFn: async (): Promise<System> => {
      const response = await apiClient.get<System>('/api/v2/system', {
        headers: {
          'show-loading': '',
          'skip-error': 'true', // Matches original header pattern
        },
      });
      return response.data;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes cache retention
    retry: 1,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
    refetchOnWindowFocus: false,
    refetchOnReconnect: true,
  });

  // Manual refresh functions for forcing data updates
  const refreshEnvironment = useCallback(async () => {
    await queryClient.invalidateQueries({
      queryKey: QUERY_KEYS.environment,
    });
  }, [queryClient]);

  const refreshSystem = useCallback(async () => {
    await queryClient.invalidateQueries({
      queryKey: QUERY_KEYS.system,
    });
  }, [queryClient]);

  const refreshAll = useCallback(async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.environment }),
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.system }),
    ]);
  }, [queryClient]);

  // Clear all system configuration cache
  const clearCache = useCallback(() => {
    queryClient.removeQueries({ queryKey: QUERY_KEYS.environment });
    queryClient.removeQueries({ queryKey: QUERY_KEYS.system });
  }, [queryClient]);

  // Set initial data from cache on mount if available
  useEffect(() => {
    const cachedEnvironment = queryClient.getQueryData<Environment>(QUERY_KEYS.environment);
    const cachedSystem = queryClient.getQueryData<System>(QUERY_KEYS.system);

    // Prefetch data if not in cache
    if (!cachedEnvironment && !environmentQuery.isFetching) {
      queryClient.prefetchQuery({
        queryKey: QUERY_KEYS.environment,
        queryFn: environmentQuery.queryFn,
        staleTime: 5 * 60 * 1000,
      });
    }

    if (!cachedSystem && !systemQuery.isFetching) {
      queryClient.prefetchQuery({
        queryKey: QUERY_KEYS.system,
        queryFn: systemQuery.queryFn,
        staleTime: 5 * 60 * 1000,
      });
    }
  }, [queryClient, environmentQuery.isFetching, systemQuery.isFetching, environmentQuery.queryFn, systemQuery.queryFn]);

  // Derive computed states
  const isLoading = environmentQuery.isLoading || systemQuery.isLoading;
  const isError = environmentQuery.isError || systemQuery.isError;
  const error = environmentQuery.error || systemQuery.error;

  // Provide data with fallbacks for offline scenarios
  const environment: Environment = environmentQuery.data || DEFAULT_ENVIRONMENT;
  const system: System = systemQuery.data || DEFAULT_SYSTEM;

  // Configuration validation helpers
  const isConfigurationValid = useCallback(() => {
    return !!(
      environment.server.host &&
      environment.authentication &&
      system.resource
    );
  }, [environment, system]);

  const hasValidLicense = useCallback(() => {
    return !!(
      environment.platform?.license &&
      environment.platform.license !== 'OPEN SOURCE'
    );
  }, [environment.platform?.license]);

  const isTrialEnvironment = useCallback(() => {
    return environment.platform?.isTrial || false;
  }, [environment.platform?.isTrial]);

  const isHostedEnvironment = useCallback(() => {
    return environment.platform?.isHosted || false;
  }, [environment.platform?.isHosted]);

  return {
    // Data properties
    environment,
    system,
    
    // Loading and error states
    isLoading,
    isError,
    error,
    
    // Individual query states for granular control
    environmentQuery: {
      data: environment,
      isLoading: environmentQuery.isLoading,
      isError: environmentQuery.isError,
      error: environmentQuery.error,
      isFetching: environmentQuery.isFetching,
      isStale: environmentQuery.isStale,
    },
    systemQuery: {
      data: system,
      isLoading: systemQuery.isLoading,
      isError: systemQuery.isError,
      error: systemQuery.error,
      isFetching: systemQuery.isFetching,
      isStale: systemQuery.isStale,
    },
    
    // Manual control functions
    refreshEnvironment,
    refreshSystem,
    refreshAll,
    clearCache,
    
    // Configuration validation helpers
    isConfigurationValid,
    hasValidLicense,
    isTrialEnvironment,
    isHostedEnvironment,
    
    // Convenience getters matching original service interface
    get isOpenRegistrationAllowed() {
      return environment.authentication.allowOpenRegistration;
    },
    
    get serverVersion() {
      return environment.platform?.version || environment.server.version || '';
    },
    
    get isDevelopmentMode() {
      return environment.platform?.appDebug || false;
    },
    
    get availableAuthServices() {
      return [
        ...environment.authentication.oauth,
        ...environment.authentication.saml,
        ...environment.authentication.adldap,
      ];
    },
    
    get systemResources() {
      return system.resource.map(r => r.name);
    },
  };
}

// Export types for use throughout the application
export type { Environment, System, AuthService, LdapService };