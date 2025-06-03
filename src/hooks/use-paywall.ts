'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';

// Hook dependencies - importing from the corresponding dependency files
import { useLicense } from './use-license';
import { useSystemConfig } from './use-system-config';
import { useErrorHandler } from './use-error-handler';

// Type imports for comprehensive type safety
import type { LicenseType, FeatureAccess, PaywallState } from '../types/license';

/**
 * Feature access levels mapped to license types
 * Defines which features are locked at each license tier
 */
const FEATURE_ACCESS_MAP = {
  OPEN_SOURCE: {
    lockedFeatures: [
      'event-scripts',
      'rate-limiting', 
      'scheduler',
      'reporting',
    ],
    allowedFeatures: [
      'database-connections',
      'schema-discovery',
      'api-generation',
      'basic-security',
      'documentation',
    ],
  },
  SILVER: {
    lockedFeatures: [
      'rate-limiting',
      'scheduler', 
      'reporting',
    ],
    allowedFeatures: [
      'database-connections',
      'schema-discovery',
      'api-generation',
      'event-scripts',
      'basic-security',
      'advanced-security',
      'documentation',
    ],
  },
  GOLD: {
    lockedFeatures: [],
    allowedFeatures: [
      'database-connections',
      'schema-discovery', 
      'api-generation',
      'event-scripts',
      'rate-limiting',
      'scheduler',
      'reporting',
      'basic-security',
      'advanced-security',
      'documentation',
      'enterprise-features',
    ],
  },
} as const;

/**
 * Route-to-feature mapping for route-based access control
 * Maps application routes to corresponding feature identifiers
 */
const ROUTE_FEATURE_MAP = {
  '/adf-event-scripts': 'event-scripts',
  '/event-scripts': 'event-scripts',
  '/adf-limits': 'rate-limiting',
  '/api-security/limits': 'rate-limiting',
  '/rate-limiting': 'rate-limiting',
  '/adf-scheduler': 'scheduler',
  '/system-settings/scheduler': 'scheduler',
  '/scheduler': 'scheduler',
  '/adf-reports': 'reporting',
  '/system-settings/reports': 'reporting',
  '/reporting': 'reporting',
  '/adf-services': 'database-connections',
  '/api-connections': 'database-connections',
  '/adf-schema': 'schema-discovery',
  '/api-connections/database': 'api-generation',
  '/adf-api-docs': 'documentation',
} as const;

/**
 * Paywall configuration interface
 */
interface PaywallConfig {
  enableFeatureGating: boolean;
  enableUpgradePrompts: boolean;
  gracePeriodDays: number;
  cacheValidityMinutes: number;
}

/**
 * Feature access result interface
 */
interface FeatureAccessResult {
  isAllowed: boolean;
  isLocked: boolean;
  licenseType: LicenseType;
  feature: string;
  upgradeRequired: boolean;
  message?: string;
}

/**
 * Paywall activation result interface
 */
interface PaywallActivationResult {
  isActive: boolean;
  resources: string[];
  missingResources: string[];
  licenseType: LicenseType;
  upgradeUrl?: string;
}

/**
 * Comprehensive paywall and feature gating hook
 * 
 * Manages premium feature access, license-based restrictions, and upgrade workflows.
 * Replaces Angular DfPaywallService with React state management for comprehensive
 * feature gating and license enforcement across the application.
 * 
 * @returns Paywall state and methods for feature gating and license enforcement
 */
export function usePaywall() {
  // Internal state management
  const [paywallState, setPaywallState] = useState<PaywallState>({
    isActive: false,
    activatedFeatures: [],
    blockedFeatures: [],
    lastChecked: null,
  });

  const [config] = useState<PaywallConfig>({
    enableFeatureGating: true,
    enableUpgradePrompts: true,
    gracePeriodDays: 7,
    cacheValidityMinutes: 15,
  });

  // Hook dependencies for license, system config, and error handling
  const { 
    licenseData, 
    licenseType, 
    isValidLicense, 
    isLicenseExpired,
    refreshLicense 
  } = useLicense();
  
  const { 
    systemConfig, 
    environment, 
    isLoading: isSystemLoading 
  } = useSystemConfig();
  
  const { handleError, clearError } = useErrorHandler();

  // Query for system resources to determine feature availability
  const {
    data: systemResources,
    isLoading: isResourcesLoading,
    error: resourcesError,
    refetch: refetchResources,
  } = useQuery({
    queryKey: ['system-resources', systemConfig?.resource],
    queryFn: async () => {
      if (!systemConfig?.resource) {
        return [];
      }
      return systemConfig.resource.map(r => r.name);
    },
    enabled: !!systemConfig?.resource,
    staleTime: config.cacheValidityMinutes * 60 * 1000,
    gcTime: (config.cacheValidityMinutes + 5) * 60 * 1000,
  });

  // Feature access determination with license validation
  const featureAccess = useMemo<Record<string, FeatureAccess>>(() => {
    const currentLicenseType = licenseType || 'OPEN_SOURCE';
    const accessMap = FEATURE_ACCESS_MAP[currentLicenseType];
    const result: Record<string, FeatureAccess> = {};

    // Process allowed features
    accessMap.allowedFeatures.forEach(feature => {
      result[feature] = {
        isAllowed: true,
        isLocked: false,
        licenseType: currentLicenseType,
        requiresUpgrade: false,
      };
    });

    // Process locked features
    accessMap.lockedFeatures.forEach(feature => {
      result[feature] = {
        isAllowed: false,
        isLocked: true,
        licenseType: currentLicenseType,
        requiresUpgrade: true,
        upgradeFromTier: currentLicenseType,
        upgradeToTier: currentLicenseType === 'OPEN_SOURCE' ? 'SILVER' : 'GOLD',
      };
    });

    return result;
  }, [licenseType]);

  // Route-based feature access checking
  const isRouteAccessible = useCallback((route: string): FeatureAccessResult => {
    const feature = ROUTE_FEATURE_MAP[route as keyof typeof ROUTE_FEATURE_MAP];
    
    if (!feature) {
      // Route not controlled by paywall - allow access
      return {
        isAllowed: true,
        isLocked: false,
        licenseType: licenseType || 'OPEN_SOURCE',
        feature: 'uncontrolled',
        upgradeRequired: false,
      };
    }

    const access = featureAccess[feature];
    
    if (!access) {
      // Feature not defined in access map - deny by default
      return {
        isAllowed: false,
        isLocked: true,
        licenseType: licenseType || 'OPEN_SOURCE',
        feature,
        upgradeRequired: true,
        message: `Feature ${feature} requires license validation`,
      };
    }

    return {
      isAllowed: access.isAllowed,
      isLocked: access.isLocked,
      licenseType: licenseType || 'OPEN_SOURCE',
      feature,
      upgradeRequired: access.requiresUpgrade || false,
      message: access.isLocked 
        ? `Feature ${feature} is locked for ${access.licenseType} license`
        : undefined,
    };
  }, [featureAccess, licenseType]);

  // Feature-based access checking
  const isFeatureAccessible = useCallback((feature: string): FeatureAccessResult => {
    const access = featureAccess[feature];
    
    if (!access) {
      // Feature not defined - deny by default for security
      return {
        isAllowed: false,
        isLocked: true,
        licenseType: licenseType || 'OPEN_SOURCE',
        feature,
        upgradeRequired: true,
        message: `Unknown feature: ${feature}`,
      };
    }

    // Check if license is expired
    if (isLicenseExpired && config.enableFeatureGating) {
      return {
        isAllowed: false,
        isLocked: true,
        licenseType: licenseType || 'OPEN_SOURCE',
        feature,
        upgradeRequired: true,
        message: `License expired. Please renew to access ${feature}`,
      };
    }

    return {
      isAllowed: access.isAllowed,
      isLocked: access.isLocked,
      licenseType: licenseType || 'OPEN_SOURCE',
      feature,
      upgradeRequired: access.requiresUpgrade || false,
      message: access.isLocked 
        ? `Feature ${feature} requires license upgrade from ${access.licenseType}`
        : undefined,
    };
  }, [featureAccess, licenseType, isLicenseExpired, config.enableFeatureGating]);

  // Paywall activation based on required resources
  const activatePaywall = useCallback(async (
    resource?: string | string[]
  ): Promise<PaywallActivationResult> => {
    try {
      clearError();

      if (!resource) {
        // No specific resource required - check general license validity
        return {
          isActive: !isValidLicense,
          resources: [],
          missingResources: [],
          licenseType: licenseType || 'OPEN_SOURCE',
          upgradeUrl: !isValidLicense ? getUpgradeUrl(licenseType) : undefined,
        };
      }

      const requiredResources = Array.isArray(resource) ? resource : [resource];
      const availableResources = systemResources || [];
      
      // Check which required resources are missing
      const missingResources = requiredResources.filter(
        req => !availableResources.includes(req)
      );

      const isActive = missingResources.length > 0;

      // Update paywall state
      setPaywallState(prev => ({
        ...prev,
        isActive,
        activatedFeatures: isActive ? requiredResources : prev.activatedFeatures,
        blockedFeatures: isActive ? missingResources : [],
        lastChecked: new Date(),
      }));

      return {
        isActive,
        resources: requiredResources,
        missingResources,
        licenseType: licenseType || 'OPEN_SOURCE',
        upgradeUrl: isActive ? getUpgradeUrl(licenseType) : undefined,
      };

    } catch (error) {
      const errorMessage = `Failed to activate paywall: ${error instanceof Error ? error.message : 'Unknown error'}`;
      handleError(new Error(errorMessage), {
        context: 'usePaywall.activatePaywall',
        resource,
        licenseType,
      });

      // Return safe fallback state
      return {
        isActive: true,
        resources: Array.isArray(resource) ? resource : resource ? [resource] : [],
        missingResources: Array.isArray(resource) ? resource : resource ? [resource] : [],
        licenseType: licenseType || 'OPEN_SOURCE',
        upgradeUrl: getUpgradeUrl(licenseType),
      };
    }
  }, [
    resource, 
    systemResources, 
    licenseType, 
    isValidLicense, 
    handleError, 
    clearError
  ]);

  // Generate upgrade URL based on license type
  const getUpgradeUrl = useCallback((currentLicenseType?: LicenseType): string => {
    const baseUrl = environment?.platform?.isHosted 
      ? '/subscription/upgrade' 
      : 'https://www.dreamfactory.com/pricing';
    
    switch (currentLicenseType) {
      case 'OPEN_SOURCE':
        return `${baseUrl}?from=open-source&to=silver`;
      case 'SILVER':
        return `${baseUrl}?from=silver&to=gold`;
      case 'GOLD':
        return baseUrl; // Already highest tier
      default:
        return `${baseUrl}?from=unknown`;
    }
  }, [environment?.platform?.isHosted]);

  // Refresh paywall state and dependencies
  const refreshPaywall = useCallback(async () => {
    try {
      await Promise.all([
        refreshLicense(),
        refetchResources(),
      ]);
      
      setPaywallState(prev => ({
        ...prev,
        lastChecked: new Date(),
      }));
    } catch (error) {
      handleError(error as Error, {
        context: 'usePaywall.refreshPaywall',
      });
    }
  }, [refreshLicense, refetchResources, handleError]);

  // Initialize paywall state when dependencies change
  useEffect(() => {
    if (licenseData && systemConfig) {
      setPaywallState(prev => ({
        ...prev,
        lastChecked: new Date(),
      }));
    }
  }, [licenseData, systemConfig]);

  // Handle resource loading errors
  useEffect(() => {
    if (resourcesError) {
      handleError(resourcesError as Error, {
        context: 'usePaywall.systemResources',
        operation: 'fetch',
      });
    }
  }, [resourcesError, handleError]);

  // Loading state aggregation
  const isLoading = isSystemLoading || isResourcesLoading;

  // Feature check utilities
  const checkFeatureAccess = useCallback((feature: string) => {
    return isFeatureAccessible(feature);
  }, [isFeatureAccessible]);

  const checkRouteAccess = useCallback((route: string) => {
    return isRouteAccessible(route);
  }, [isRouteAccessible]);

  // Bulk feature access checking
  const checkMultipleFeatures = useCallback((features: string[]) => {
    return features.reduce((acc, feature) => {
      acc[feature] = isFeatureAccessible(feature);
      return acc;
    }, {} as Record<string, FeatureAccessResult>);
  }, [isFeatureAccessible]);

  // Legacy compatibility method for direct feature locking check
  const isFeatureLocked = useCallback((route: string, licenseTypeOverride?: LicenseType): boolean => {
    const effectiveLicenseType = licenseTypeOverride || licenseType || 'OPEN_SOURCE';
    
    if (effectiveLicenseType === 'GOLD') return false;
    
    const accessMap = FEATURE_ACCESS_MAP[effectiveLicenseType];
    return accessMap.lockedFeatures.some(feature => route.includes(feature));
  }, [licenseType]);

  return {
    // State
    paywallState,
    isLoading,
    licenseType,
    isValidLicense,
    isLicenseExpired,
    systemResources: systemResources || [],
    featureAccess,
    config,

    // Feature access methods
    isFeatureAccessible,
    isRouteAccessible,
    checkFeatureAccess,
    checkRouteAccess,
    checkMultipleFeatures,
    isFeatureLocked, // Legacy compatibility

    // Paywall management
    activatePaywall,
    refreshPaywall,
    getUpgradeUrl,

    // Utilities
    constants: {
      FEATURE_ACCESS_MAP,
      ROUTE_FEATURE_MAP,
    },
  };
}

export type UsePaywallReturn = ReturnType<typeof usePaywall>;

// Export types for external usage
export type {
  FeatureAccessResult,
  PaywallActivationResult,
  PaywallConfig,
  FeatureAccess,
  PaywallState,
  LicenseType,
};