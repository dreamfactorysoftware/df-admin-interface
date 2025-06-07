'use client';

import { useCallback, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import type { System } from '@/types/license';

/**
 * Configuration for locked features by license type
 */
const LOCKED_FEATURES_CONFIG = {
  OPEN_SOURCE: [
    'event-scripts',
    'rate-limiting', 
    'scheduler',
    'reporting',
  ],
  SILVER: [
    'rate-limiting',
    'scheduler', 
    'reporting',
  ],
  GOLD: [],
} as const;

/**
 * Paywall state interface
 */
interface PaywallState {
  isLoading: boolean;
  error: string | null;
  hasError: boolean;
}

/**
 * Paywall hook return interface
 */
interface UsePaywallReturn {
  isFeatureLocked: (route: string, licenseType: string) => boolean;
  activatePaywall: (resource?: string | string[]) => Promise<boolean>;
  paywallState: PaywallState;
  clearError: () => void;
}

/**
 * Custom hook for managing paywall and feature gating functionality.
 * 
 * Replaces Angular DfPaywallService with React state management for comprehensive
 * feature gating and license enforcement across the application.
 * 
 * Features:
 * - Feature access checking with license type validation
 * - Route-based access control 
 * - Paywall activation workflows with error handling
 * - Resource-based feature availability checking
 * - Integration with system configuration and license status
 * 
 * @returns PaywallReturn object with feature checking and activation methods
 */
export function usePaywall(): UsePaywallReturn {
  // Mock hooks - these would be actual implementations when dependencies are created
  const useSystemConfig = () => ({
    data: { resource: [] } as System,
    error: null,
    isLoading: false,
    refetch: async () => ({ data: { resource: [] } as System })
  });

  const useErrorHandler = () => ({
    setError: (error: string) => { console.error('Paywall error:', error); }
  });

  const { data: systemConfig, error: systemError, isLoading: systemLoading, refetch: refetchSystem } = useSystemConfig();
  const { setError } = useErrorHandler();

  /**
   * Determines if a feature is locked based on route and license type.
   * 
   * @param route - The route path to check
   * @param licenseType - The user's license type ('GOLD', 'SILVER', or other)
   * @returns true if the feature is locked, false otherwise
   */
  const isFeatureLocked = useCallback((route: string, licenseType: string): boolean => {
    // GOLD license has access to all features
    if (licenseType === 'GOLD') {
      return false;
    }

    // Get locked features for the license type
    const lockedFeatures = licenseType === 'SILVER' 
      ? LOCKED_FEATURES_CONFIG.SILVER 
      : LOCKED_FEATURES_CONFIG.OPEN_SOURCE;

    // Check if any locked feature is included in the route
    return lockedFeatures.some(feature => route.includes(feature));
  }, []);

  /**
   * Activates paywall checking for specific resources.
   * 
   * @param resource - Single resource name or array of resource names to check
   * @returns Promise resolving to true if paywall should be activated, false otherwise
   */
  const activatePaywall = useCallback(async (resource?: string | string[]): Promise<boolean> => {
    // If no resource specified, return false (no paywall)
    if (!resource) {
      return false;
    }

    // Normalize resource to array
    const resources = Array.isArray(resource) ? resource : [resource];

    try {
      let currentSystem = systemConfig;

      // If system data is empty, fetch fresh data
      if (!currentSystem?.resource || currentSystem.resource.length === 0) {
        const refreshResult = await refetchSystem();
        currentSystem = refreshResult.data;
      }

      // If we still don't have system data, return false
      if (!currentSystem?.resource) {
        return false;
      }

      // Check if any requested resource is NOT available in system resources
      // If a resource is missing, paywall should be activated
      const shouldActivatePaywall = !currentSystem.resource.some(systemResource => 
        resources.includes(systemResource.name)
      );

      return shouldActivatePaywall;
    } catch (error) {
      // Set error state and return false on failure
      const errorMessage = error instanceof Error ? error.message : 'Failed to check paywall status';
      setError(errorMessage);
      return false;
    }
  }, [systemConfig, refetchSystem, setError]);

  /**
   * React Query for paywall activation state management.
   * This provides a reactive way to handle paywall state when needed.
   */
  const paywallQuery = useQuery({
    queryKey: ['paywall-state'],
    queryFn: () => Promise.resolve({ activated: false }),
    enabled: false, // Only run when explicitly triggered
    staleTime: 5 * 60 * 1000, // 5 minutes
    cacheTime: 10 * 60 * 1000, // 10 minutes
  });

  /**
   * Clears any error state
   */
  const clearError = useCallback(() => {
    setError('');
  }, [setError]);

  /**
   * Memoized paywall state
   */
  const paywallState: PaywallState = useMemo(() => ({
    isLoading: systemLoading || paywallQuery.isLoading,
    error: systemError?.message || paywallQuery.error?.message || null,
    hasError: !!(systemError || paywallQuery.error),
  }), [systemLoading, paywallQuery.isLoading, systemError, paywallQuery.error]);

  return {
    isFeatureLocked,
    activatePaywall,
    paywallState,
    clearError,
  };
}

export default usePaywall;