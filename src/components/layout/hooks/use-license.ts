'use client';

import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query';
import { useCallback, useMemo } from 'react';
import { apiClient } from '@/lib/api-client';
import { useSystemConfig } from '@/hooks/use-system-config';
import type { 
  LicenseInfo,
  LicenseType,
  LicenseFeature,
  LicenseCheckResponse,
  LicenseStatus,
  FeatureAvailability,
  PaywallResult,
  LicenseError,
  LicenseCheckConfig,
  UseLicenseReturn
} from '@/types/license';

// License service constants
const LICENSE_ENDPOINTS = {
  SUBSCRIPTION_DATA: 'https://updates.dreamfactory.com/check',
} as const;

const LICENSE_HEADERS = {
  LICENSE_KEY: 'X-DreamFactory-License-Key',
} as const;

// Feature configuration based on original Angular paywall service
const LOCKED_FEATURES = {
  OPEN_SOURCE: [
    'event-scripts',
    'rate-limiting', 
    'scheduler',
    'reporting'
  ] as LicenseFeature[],
  SILVER: [
    'rate-limiting',
    'scheduler', 
    'reporting'
  ] as LicenseFeature[],
  GOLD: [] as LicenseFeature[]
} as const;

// Default configuration
const DEFAULT_CONFIG: Required<LicenseCheckConfig> = {
  cacheTTL: 5 * 60 * 1000, // 5 minutes
  backgroundRevalidation: true,
  retryConfig: {
    attempts: 2,
    delayMs: 1000
  }
} as const;

// Query keys for React Query cache management
const LICENSE_QUERY_KEYS = {
  licenseCheck: (licenseKey: string) => ['license', 'check', licenseKey] as const,
  licenseInfo: ['license', 'info'] as const,
  paywall: (resource?: string | string[]) => ['license', 'paywall', resource] as const,
} as const;

/**
 * Custom React hook for comprehensive license management and feature gating
 * 
 * Replaces Angular DfLicenseCheckService and DfPaywallService with modern React Query
 * caching, intelligent background synchronization, and seamless system integration.
 * 
 * Features:
 * - License type detection with system configuration integration
 * - Feature gating logic based on license type and route-based paywall rules
 * - License validation caching using React Query with configurable TTL
 * - Integration with system configuration service for license data retrieval
 * - Commercial feature locking with user-friendly upgrade prompts
 * - Automatic background refetching and error recovery
 * - Type-safe feature availability checking
 * - Route-based paywall enforcement
 * 
 * @param config - Optional configuration for license checking behavior
 * @returns Comprehensive license management interface
 */
export function useLicense(config: LicenseCheckConfig = {}): UseLicenseReturn {
  const queryClient = useQueryClient();
  const { environment, system, isLoading: systemLoading, error: systemError } = useSystemConfig();
  
  // Merge configuration with defaults
  const licenseConfig = useMemo(() => ({
    ...DEFAULT_CONFIG,
    ...config
  }), [config]);

  /**
   * Extract license information from system configuration
   */
  const licenseInfo = useMemo((): LicenseInfo | null => {
    if (!environment?.platform) return null;

    const { platform } = environment;
    
    // Determine license type from platform configuration
    let licenseType: LicenseType = 'OPEN_SOURCE';
    if (platform.license) {
      const license = platform.license.toUpperCase();
      if (license.includes('GOLD')) {
        licenseType = 'GOLD';
      } else if (license.includes('SILVER')) {
        licenseType = 'SILVER';
      }
    }

    return {
      type: licenseType,
      key: platform.licenseKey || false,
      status: 'unknown' as LicenseStatus,
      isTrial: platform.isTrial || false,
      isHosted: platform.isHosted || false,
      version: platform.version
    };
  }, [environment]);

  /**
   * Validate license key against DreamFactory licensing server
   */
  const validateLicenseKey = useCallback(async (licenseKey: string): Promise<LicenseCheckResponse> => {
    try {
      const response = await apiClient.get<LicenseCheckResponse>(
        LICENSE_ENDPOINTS.SUBSCRIPTION_DATA,
        {
          headers: {
            [LICENSE_HEADERS.LICENSE_KEY]: licenseKey,
          },
          // Don't use default retry for license validation
          retries: 0
        }
      );

      // Transform snake_case to camelCase (matching original Angular service)
      const transformedResponse: LicenseCheckResponse = {
        disableUi: response.disable_ui || response.disableUi || '',
        msg: response.msg || '',
        renewalDate: response.renewal_date || response.renewalDate || '',
        statusCode: response.status_code || response.statusCode || ''
      };

      return transformedResponse;
    } catch (error) {
      // Transform error to match original behavior
      throw new Error(`License validation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }, []);

  /**
   * License validation query with intelligent caching
   */
  const licenseValidationQuery = useQuery({
    queryKey: LICENSE_QUERY_KEYS.licenseCheck(
      typeof licenseInfo?.key === 'string' ? licenseInfo.key : ''
    ),
    queryFn: () => {
      if (!licenseInfo?.key || typeof licenseInfo.key !== 'string') {
        return Promise.resolve(null);
      }
      return validateLicenseKey(licenseInfo.key);
    },
    enabled: !!(licenseInfo?.key && typeof licenseInfo.key === 'string'),
    staleTime: licenseConfig.cacheTTL,
    cacheTime: licenseConfig.cacheTTL * 2,
    retry: licenseConfig.retryConfig.attempts,
    retryDelay: (attemptIndex) => licenseConfig.retryConfig.delayMs * Math.pow(2, attemptIndex),
    refetchOnWindowFocus: licenseConfig.backgroundRevalidation,
    refetchOnReconnect: true,
    keepPreviousData: true,
    select: (data) => data,
  });

  /**
   * Combined license information with validation status
   */
  const enrichedLicenseInfo = useMemo((): LicenseInfo | null => {
    if (!licenseInfo) return null;

    let status: LicenseStatus = 'unknown';
    
    if (licenseValidationQuery.isLoading) {
      status = 'checking';
    } else if (licenseValidationQuery.error) {
      status = 'invalid';
    } else if (licenseValidationQuery.data) {
      const response = licenseValidationQuery.data;
      // Determine status from response
      if (response.statusCode === '200' || response.statusCode === 'ok') {
        status = 'valid';
      } else if (response.statusCode === '402' || response.disableUi === 'true') {
        status = 'expired';
      } else {
        status = 'invalid';
      }
    } else if (licenseInfo.type === 'OPEN_SOURCE') {
      status = 'valid'; // Open source is always valid
    }

    return {
      ...licenseInfo,
      status,
      checkResponse: licenseValidationQuery.data || undefined
    };
  }, [licenseInfo, licenseValidationQuery.data, licenseValidationQuery.isLoading, licenseValidationQuery.error]);

  /**
   * Check if a specific feature is available based on license type
   */
  const isFeatureAvailable = useCallback((feature: LicenseFeature): FeatureAvailability => {
    if (!enrichedLicenseInfo) {
      return {
        isAvailable: false,
        requiresUpgrade: true,
        minimumTier: 'GOLD',
        reason: 'License information not available'
      };
    }

    const { type } = enrichedLicenseInfo;
    const lockedFeatures = LOCKED_FEATURES[type] || [];
    const isLocked = lockedFeatures.includes(feature);

    if (!isLocked) {
      return {
        isAvailable: true,
        requiresUpgrade: false,
        minimumTier: type
      };
    }

    // Determine minimum tier required
    let minimumTier: LicenseType = 'GOLD';
    if (!LOCKED_FEATURES.SILVER.includes(feature)) {
      minimumTier = 'SILVER';
    }

    return {
      isAvailable: false,
      requiresUpgrade: true,
      minimumTier,
      reason: `This feature requires ${minimumTier} license`
    };
  }, [enrichedLicenseInfo]);

  /**
   * Check if a route/feature should be locked (original paywall service logic)
   */
  const isFeatureLocked = useCallback((route: string): boolean => {
    if (!enrichedLicenseInfo) return true;

    const { type } = enrichedLicenseInfo;
    
    // GOLD license has access to everything
    if (type === 'GOLD') return false;
    
    // Check route against locked features for license type
    const lockedFeatures = LOCKED_FEATURES[type] || [];
    return lockedFeatures.some(feature => route.includes(feature));
  }, [enrichedLicenseInfo]);

  /**
   * Paywall activation with system resource checking
   */
  const paywallMutation = useMutation({
    mutationFn: async (resources?: string | string[]): Promise<PaywallResult> => {
      if (!resources) {
        return {
          shouldShowPaywall: false,
          availableResources: []
        };
      }

      const resourceList = Array.isArray(resources) ? resources : [resources];
      
      // Get current system data or fetch fresh data
      let systemData = system;
      if (!systemData?.resource || systemData.resource.length === 0) {
        try {
          // This would trigger a refetch of system data
          await queryClient.invalidateQueries({ queryKey: ['system', 'config'] });
          systemData = system; // Will be updated after invalidation
        } catch (error) {
          console.error('Failed to fetch system data for paywall check:', error);
          return {
            shouldShowPaywall: false,
            availableResources: [],
            resource: Array.isArray(resources) ? resources[0] : resources
          };
        }
      }

      if (!systemData?.resource) {
        return {
          shouldShowPaywall: false,
          availableResources: [],
          resource: Array.isArray(resources) ? resources[0] : resources
        };
      }

      const availableResources = systemData.resource.map(r => r.name);
      const hasRequiredResource = systemData.resource.some(r => 
        resourceList.includes(r.name)
      );

      return {
        shouldShowPaywall: !hasRequiredResource,
        resource: Array.isArray(resources) ? resources[0] : resources,
        availableResources
      };
    },
    // Cache paywall results briefly
    cacheTime: 60000, // 1 minute
  });

  /**
   * Activate paywall for specific resources
   */
  const activatePaywall = useCallback(async (resource?: string | string[]): Promise<PaywallResult> => {
    return paywallMutation.mutateAsync(resource);
  }, [paywallMutation]);

  /**
   * Manual license validation
   */
  const validateLicense = useCallback(async (licenseKey: string): Promise<LicenseCheckResponse> => {
    return validateLicenseKey(licenseKey);
  }, [validateLicenseKey]);

  /**
   * Refresh license information
   */
  const refresh = useCallback(async (): Promise<void> => {
    await Promise.all([
      licenseValidationQuery.refetch(),
      queryClient.invalidateQueries({ queryKey: ['system'] })
    ]);
  }, [licenseValidationQuery, queryClient]);

  /**
   * Clear license cache
   */
  const clearCache = useCallback((): void => {
    queryClient.removeQueries({ queryKey: ['license'] });
  }, [queryClient]);

  /**
   * Error handling with proper typing
   */
  const licenseError = useMemo((): LicenseError | null => {
    if (systemError) {
      return {
        type: 'network',
        message: 'Failed to load system configuration',
        details: systemError,
        recoverable: true
      };
    }

    if (licenseValidationQuery.error) {
      const error = licenseValidationQuery.error;
      return {
        type: 'validation',
        message: error instanceof Error ? error.message : 'License validation failed',
        details: error,
        recoverable: true
      };
    }

    return null;
  }, [systemError, licenseValidationQuery.error]);

  /**
   * Combined loading state
   */
  const isLoading = systemLoading || licenseValidationQuery.isLoading;

  /**
   * Combined fetching state
   */
  const isFetching = licenseValidationQuery.isFetching || paywallMutation.isLoading;

  return {
    license: enrichedLicenseInfo,
    isLoading,
    error: licenseError,
    isFetching,
    isFeatureAvailable,
    isFeatureLocked,
    activatePaywall,
    validateLicense,
    refresh,
    clearCache
  };
}

/**
 * Helper hook for simple feature availability checking
 */
export function useFeatureGate(feature: LicenseFeature) {
  const { isFeatureAvailable } = useLicense();
  return isFeatureAvailable(feature);
}

/**
 * Helper hook for route-based paywall checking
 */
export function useRoutePaywall(route: string) {
  const { isFeatureLocked, license } = useLicense();
  
  return useMemo(() => ({
    isLocked: isFeatureLocked(route),
    licenseType: license?.type,
    requiresUpgrade: isFeatureLocked(route)
  }), [isFeatureLocked, route, license?.type]);
}

export default useLicense;