/**
 * Subscription Management Hook
 * 
 * Custom React hook for managing subscription status, paywall enforcement,
 * and feature access control. Integrates with DreamFactory licensing system
 * and provides React Query-powered subscription state management.
 * 
 * @author DreamFactory Admin Interface Team
 * @version React 19/Next.js 15.1 Migration
 */

import { useCallback, useMemo } from 'react'
import useSWR from 'swr'
import { apiClient } from '@/lib/api-client'
import type { PaywallStatus, SubscriptionConfig } from '@/types/limit'

// =============================================================================
// SUBSCRIPTION TYPES
// =============================================================================

/**
 * System configuration response from DreamFactory
 */
interface SystemConfig {
  resource: Array<{
    name: string
    type: string
    label: string
    singleton?: boolean
  }>
  platform: {
    version: string
    license: string
    edition: 'open-source' | 'silver' | 'gold'
  }
}

/**
 * Feature access configuration
 */
interface FeatureAccess {
  isLocked: boolean
  licenseType: 'OPEN_SOURCE' | 'SILVER' | 'GOLD'
  requiredLicense?: 'SILVER' | 'GOLD'
  feature: string
  message?: string
  upgradeUrl?: string
}

// =============================================================================
// CONSTANTS
// =============================================================================

/**
 * Features locked per license tier
 */
const FEATURE_RESTRICTIONS = {
  'OPEN_SOURCE': [
    'event-scripts',
    'rate-limiting', 
    'scheduler',
    'reporting',
    'advanced-analytics',
    'enterprise-auth',
  ],
  'SILVER': [
    'rate-limiting',
    'scheduler', 
    'reporting',
    'advanced-analytics',
  ],
  'GOLD': [],
} as const

/**
 * Default subscription configuration
 */
const DEFAULT_SUBSCRIPTION_CONFIG: Required<SubscriptionConfig> = {
  feature: 'unknown',
  resource: [],
  required_license: 'SILVER',
  fallback_component: () => null,
}

// =============================================================================
// HOOK IMPLEMENTATION
// =============================================================================

/**
 * Custom hook for subscription and paywall management
 * 
 * @param config - Subscription configuration options
 * @returns Subscription state and paywall enforcement utilities
 */
export function useSubscription(config: Partial<SubscriptionConfig> = {}) {
  const fullConfig = { ...DEFAULT_SUBSCRIPTION_CONFIG, ...config }
  
  // Fetch system configuration with SWR
  const {
    data: systemConfig,
    error: systemError,
    isLoading: isSystemLoading,
    mutate: refetchSystem,
  } = useSWR<SystemConfig>(
    '/system/config',
    async () => {
      try {
        const response = await apiClient.get('/system/config')
        return response
      } catch (error) {
        // Graceful fallback for system config errors
        console.warn('Failed to fetch system config:', error)
        return {
          resource: [],
          platform: {
            version: 'unknown',
            license: 'OPEN_SOURCE',
            edition: 'open-source' as const,
          },
        }
      }
    },
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: true,
      refreshInterval: 5 * 60 * 1000, // 5 minutes
      errorRetryCount: 3,
      errorRetryInterval: 2000,
      // Use stale data while revalidating
      shouldRetryOnError: (error) => {
        // Don't retry on auth errors
        return !(error?.status >= 400 && error?.status < 500)
      },
    }
  )

  // Extract license information
  const licenseType = useMemo(() => {
    if (!systemConfig?.platform?.license) return 'OPEN_SOURCE'
    
    const license = systemConfig.platform.license.toUpperCase()
    if (license.includes('GOLD')) return 'GOLD'
    if (license.includes('SILVER')) return 'SILVER'
    return 'OPEN_SOURCE'
  }, [systemConfig])

  // Check if specific features are available
  const checkFeatureAccess = useCallback((feature: string): FeatureAccess => {
    const restrictedFeatures = FEATURE_RESTRICTIONS[licenseType] || []
    const isLocked = restrictedFeatures.includes(feature as any)
    
    let requiredLicense: 'SILVER' | 'GOLD' | undefined
    if (FEATURE_RESTRICTIONS.OPEN_SOURCE.includes(feature as any)) {
      requiredLicense = 'SILVER'
    }
    if (FEATURE_RESTRICTIONS.SILVER.includes(feature as any)) {
      requiredLicense = 'GOLD'
    }

    return {
      isLocked,
      licenseType,
      requiredLicense,
      feature,
      message: isLocked 
        ? `This feature requires a ${requiredLicense} license. Please upgrade to access ${feature}.`
        : undefined,
      upgradeUrl: isLocked ? '/upgrade' : undefined,
    }
  }, [licenseType])

  // Check paywall status for specific resources
  const activatePaywall = useCallback((resource?: string | string[]): PaywallStatus => {
    if (!resource) {
      return {
        isLocked: false,
        licenseType,
        feature: 'none',
      }
    }

    const resources = Array.isArray(resource) ? resource : [resource]
    
    // Check if any required resources are missing from system config
    const hasRequiredResources = systemConfig?.resource?.some(r => 
      resources.includes(r.name)
    ) ?? false

    // For rate limiting specifically
    if (resources.includes('limit') || resources.includes('rate-limiting')) {
      const featureAccess = checkFeatureAccess('rate-limiting')
      return {
        isLocked: featureAccess.isLocked || !hasRequiredResources,
        licenseType,
        feature: 'rate-limiting',
        message: featureAccess.message,
        upgradeUrl: featureAccess.upgradeUrl,
      }
    }

    // Generic resource check
    return {
      isLocked: !hasRequiredResources,
      licenseType,
      feature: fullConfig.feature,
      message: !hasRequiredResources 
        ? `Required resources not available: ${resources.join(', ')}`
        : undefined,
    }
  }, [systemConfig, licenseType, checkFeatureAccess, fullConfig.feature])

  // Check if current feature is locked
  const isFeatureLocked = useMemo(() => {
    const featureAccess = checkFeatureAccess(fullConfig.feature)
    return featureAccess.isLocked
  }, [checkFeatureAccess, fullConfig.feature])

  // Check paywall status for configured resources
  const paywallStatus = useMemo(() => {
    return activatePaywall(fullConfig.resource)
  }, [activatePaywall, fullConfig.resource])

  // Subscription state summary
  const subscription = useMemo(() => ({
    licenseType,
    isLoading: isSystemLoading,
    error: systemError,
    isFeatureLocked,
    paywallStatus,
    systemConfig,
    hasValidLicense: licenseType !== 'OPEN_SOURCE',
    canAccessFeature: (feature: string) => !checkFeatureAccess(feature).isLocked,
    getFeatureRequirement: (feature: string) => checkFeatureAccess(feature).requiredLicense,
  }), [
    licenseType,
    isSystemLoading,
    systemError,
    isFeatureLocked,
    paywallStatus,
    systemConfig,
    checkFeatureAccess,
  ])

  return {
    // Core subscription state
    subscription,
    
    // License information
    licenseType,
    isLoading: isSystemLoading,
    error: systemError,
    
    // Feature access methods
    checkFeatureAccess,
    activatePaywall,
    isFeatureLocked,
    paywallStatus,
    
    // System data
    systemConfig,
    refetchSystem,
    
    // Convenience getters
    hasValidLicense: licenseType !== 'OPEN_SOURCE',
    isGold: licenseType === 'GOLD',
    isSilver: licenseType === 'SILVER',
    isOpenSource: licenseType === 'OPEN_SOURCE',
    
    // Feature helpers
    canAccessFeature: (feature: string) => !checkFeatureAccess(feature).isLocked,
    getRequiredLicense: (feature: string) => checkFeatureAccess(feature).requiredLicense,
    
    // Error state helpers
    hasError: !!systemError,
    isSystemConfigLoaded: !!systemConfig && !isSystemLoading,
  }
}

// =============================================================================
// SPECIALIZED HOOKS
// =============================================================================

/**
 * Hook specifically for rate limiting feature access
 */
export function useRateLimitingSubscription() {
  return useSubscription({
    feature: 'rate-limiting',
    resource: ['limit'],
    required_license: 'SILVER',
  })
}

/**
 * Hook for scheduler feature access
 */
export function useSchedulerSubscription() {
  return useSubscription({
    feature: 'scheduler',
    resource: ['scheduler'],
    required_license: 'GOLD',
  })
}

/**
 * Hook for event scripts feature access
 */
export function useEventScriptsSubscription() {
  return useSubscription({
    feature: 'event-scripts',
    resource: ['event-scripts'],
    required_license: 'SILVER',
  })
}

/**
 * Hook for reporting feature access
 */
export function useReportingSubscription() {
  return useSubscription({
    feature: 'reporting',
    resource: ['reporting'],
    required_license: 'GOLD',
  })
}

// =============================================================================
// EXPORTS
// =============================================================================

export type {
  SystemConfig,
  FeatureAccess,
  PaywallStatus,
  SubscriptionConfig,
}

export {
  FEATURE_RESTRICTIONS,
  DEFAULT_SUBSCRIPTION_CONFIG,
}