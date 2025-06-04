'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useCallback, useMemo } from 'react';
import { apiClient } from '@/lib/api-client';
import { useSystemConfig } from '@/hooks/use-system-config';
import type { LicenseInfo, LicenseType, PaywallCheckResult } from '@/types/license';

/**
 * License management hook that handles license validation, feature checking, and license status monitoring.
 * Replaces Angular DfLicenseCheckService with React Query caching for license data and proper license state management.
 * 
 * Features:
 * - License type detection (OPEN SOURCE vs commercial)
 * - Feature gating logic based on license type and route-based paywall rules
 * - License validation caching using React Query with configurable TTL
 * - Integration with system configuration service for license data retrieval
 * - Commercial feature locking with user-friendly upgrade prompts
 */
export function useLicense() {
  const queryClient = useQueryClient();
  const { data: systemConfig, isLoading: isSystemConfigLoading } = useSystemConfig();

  // Define feature locking rules based on license types
  const licenseFeatureRules = useMemo(() => ({
    openSource: [
      'event-scripts',
      'rate-limiting', 
      'scheduler',
      'reporting'
    ],
    silver: [
      'rate-limiting',
      'scheduler', 
      'reporting'
    ],
    gold: [] // No restrictions for gold licenses
  }), []);

  /**
   * Fetch license information from the subscription service
   */
  const fetchLicenseInfo = useCallback(async (licenseKey: string): Promise<LicenseInfo> => {
    const response = await apiClient.get<LicenseInfo>('https://updates.dreamfactory.com/check', {
      headers: {
        'X-DreamFactory-License-Key': licenseKey
      }
    });
    
    // Transform snake_case to camelCase for consistency with React patterns
    return {
      disableUi: response.disable_ui || response.disableUi,
      msg: response.msg,
      renewalDate: response.renewal_date || response.renewalDate,
      statusCode: response.status_code || response.statusCode
    };
  }, []);

  /**
   * Determine license type from system configuration and license validation
   */
  const determineLicenseType = useCallback((): LicenseType => {
    if (!systemConfig?.license) {
      return 'open-source';
    }

    // Check if it's a commercial license based on system configuration
    const licenseInfo = systemConfig.license;
    
    // License type determination logic
    if (licenseInfo.type === 'GOLD' || licenseInfo.edition === 'GOLD') {
      return 'gold';
    } else if (licenseInfo.type === 'SILVER' || licenseInfo.edition === 'SILVER') {
      return 'silver';
    } else {
      return 'open-source';
    }
  }, [systemConfig]);

  /**
   * License validation query with React Query caching
   */
  const licenseQuery = useQuery({
    queryKey: ['license-validation', systemConfig?.license?.key],
    queryFn: () => {
      const licenseKey = systemConfig?.license?.key;
      if (!licenseKey) {
        throw new Error('No license key available');
      }
      return fetchLicenseInfo(licenseKey);
    },
    enabled: !!systemConfig?.license?.key,
    staleTime: 15 * 60 * 1000, // 15 minutes - configurable TTL for license caching
    cacheTime: 30 * 60 * 1000, // 30 minutes cache retention
    retry: (failureCount, error) => {
      // Only retry on network errors, not on license validation failures
      return failureCount < 2 && !error.message.includes('license');
    },
    refetchOnWindowFocus: false, // Prevent unnecessary refetches
    refetchInterval: 60 * 60 * 1000, // Background refetch every hour
    onError: (error) => {
      console.warn('License validation failed:', error);
      // Fallback to open source mode on license validation failure
    }
  });

  /**
   * Manual license validation mutation
   */
  const validateLicenseMutation = useMutation({
    mutationFn: (licenseKey: string) => fetchLicenseInfo(licenseKey),
    onSuccess: (data) => {
      // Update the license query cache
      queryClient.setQueryData(['license-validation', systemConfig?.license?.key], data);
    },
    onError: (error) => {
      console.error('Manual license validation failed:', error);
    }
  });

  /**
   * Check if a specific feature is locked based on current license type
   */
  const isFeatureLocked = useCallback((route: string): boolean => {
    const licenseType = determineLicenseType();
    
    if (licenseType === 'gold') {
      return false; // Gold licenses have no restrictions
    }

    const lockedFeatures = licenseType === 'silver' 
      ? licenseFeatureRules.silver 
      : licenseFeatureRules.openSource;

    return lockedFeatures.some(feature => route.includes(feature));
  }, [determineLicenseType, licenseFeatureRules]);

  /**
   * Check feature availability with paywall enforcement
   */
  const checkFeatureAvailability = useCallback((route: string): PaywallCheckResult => {
    const licenseType = determineLicenseType();
    const isLocked = isFeatureLocked(route);
    
    if (!isLocked) {
      return {
        hasAccess: true,
        licenseType,
        blockedFeature: null,
        upgradeRequired: false
      };
    }

    return {
      hasAccess: false,
      licenseType,
      blockedFeature: route,
      upgradeRequired: true,
      upgradeMessage: licenseType === 'open-source' 
        ? 'This feature requires a commercial license. Upgrade to Silver or Gold to access this functionality.'
        : 'This feature requires a Gold license. Upgrade your license to access this functionality.'
    };
  }, [determineLicenseType, isFeatureLocked]);

  /**
   * Activate paywall check for specific resources
   */
  const activatePaywall = useCallback(async (resource?: string | string[]): Promise<boolean> => {
    if (!resource) {
      return false;
    }

    const resources = Array.isArray(resource) ? resource : [resource];
    
    try {
      // Check against system configuration resources
      if (!systemConfig?.resource || systemConfig.resource.length === 0) {
        // If no system resources are cached, this indicates paywall should be active
        return true;
      }

      // Check if any of the requested resources are available in system config
      const hasAccess = systemConfig.resource.some(r => 
        resources.includes(r.name)
      );

      return !hasAccess; // Return true if paywall should be active (no access)
    } catch (error) {
      console.error('Paywall activation check failed:', error);
      return false; // Default to allowing access on error
    }
  }, [systemConfig]);

  /**
   * Get user-friendly upgrade prompt based on current license
   */
  const getUpgradePrompt = useCallback(() => {
    const licenseType = determineLicenseType();
    
    const prompts = {
      'open-source': {
        title: 'Commercial License Required',
        message: 'This feature is available with Silver or Gold licenses.',
        action: 'Upgrade to Commercial License',
        benefits: [
          'Access to premium features',
          'Advanced API management',
          'Priority support',
          'Enterprise capabilities'
        ]
      },
      'silver': {
        title: 'Gold License Required',
        message: 'This feature is available with Gold licenses.',
        action: 'Upgrade to Gold License',
        benefits: [
          'Full feature access',
          'Advanced enterprise features',
          'Premium support',
          'Custom integrations'
        ]
      },
      'gold': {
        title: 'Feature Available',
        message: 'You have access to all features.',
        action: null,
        benefits: []
      }
    };

    return prompts[licenseType];
  }, [determineLicenseType]);

  /**
   * Force refresh license data
   */
  const refreshLicense = useCallback(() => {
    queryClient.invalidateQueries(['license-validation']);
    if (systemConfig?.license?.key) {
      validateLicenseMutation.mutate(systemConfig.license.key);
    }
  }, [queryClient, validateLicenseMutation, systemConfig]);

  // Current license information
  const licenseInfo = licenseQuery.data;
  const licenseType = determineLicenseType();
  const isCommercialLicense = licenseType !== 'open-source';
  
  return {
    // License data
    licenseInfo,
    licenseType,
    isCommercialLicense,
    
    // Query states
    isLoading: licenseQuery.isLoading || isSystemConfigLoading,
    isError: licenseQuery.isError,
    error: licenseQuery.error,
    isValidating: validateLicenseMutation.isLoading,
    
    // Feature gating functions
    isFeatureLocked,
    checkFeatureAvailability,
    activatePaywall,
    
    // Upgrade and user experience
    getUpgradePrompt,
    
    // Actions
    refreshLicense,
    validateLicense: validateLicenseMutation.mutate,
    
    // License status helpers
    isLicenseValid: licenseInfo?.statusCode === '200' || licenseInfo?.statusCode === 'success',
    licenseMessage: licenseInfo?.msg,
    renewalDate: licenseInfo?.renewalDate,
    shouldDisableUi: licenseInfo?.disableUi === 'true' || licenseInfo?.disableUi === true
  };
}

export type UseLicenseReturn = ReturnType<typeof useLicense>;