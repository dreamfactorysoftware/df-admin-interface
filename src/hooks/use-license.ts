'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useCallback, useMemo } from 'react'

// Types - These would be imported from src/types/license.ts when available
interface LicenseResponse {
  disableUi: boolean | string
  msg: string
  renewalDate: string
  statusCode: string
  features?: string[]
  licenseType?: 'GOLD' | 'SILVER' | 'OPEN_SOURCE'
  isValid?: boolean
  expirationDate?: string
  maxUsers?: number
  currentUsers?: number
}

interface LicenseCheckRequest {
  licenseKey: string
}

interface LicenseFeatureCheck {
  feature: string
  route?: string
  licenseType?: string
}

interface LicenseValidationResult {
  isValid: boolean
  licenseData: LicenseResponse | null
  error: string | null
  isLoading: boolean
  lastChecked: Date | null
}

// Constants for license management
const LICENSE_QUERY_KEY = 'license'
const LICENSE_VALIDATION_QUERY_KEY = 'license-validation'
const DEFAULT_STALE_TIME = 15 * 60 * 1000 // 15 minutes
const DEFAULT_CACHE_TIME = 30 * 60 * 1000 // 30 minutes
const VALIDATION_RETRY_ATTEMPTS = 3
const VALIDATION_RETRY_DELAY = 1000

// API configuration constants (these would come from lib/api-client.ts)
const SUBSCRIPTION_DATA_URL = 'https://updates.dreamfactory.com/check'
const LICENSE_KEY_HEADER = 'X-DreamFactory-License-Key'

// Utility function for snake_case to camelCase transformation
const toCamelCase = (str: string): string => {
  return str.replace(/_([a-z])/g, (match, letter) => letter.toUpperCase())
}

const mapSnakeToCamel = <T extends Record<string, any>>(obj: T): any => {
  if (obj === null || typeof obj !== 'object') return obj
  
  if (Array.isArray(obj)) {
    return obj.map(mapSnakeToCamel)
  }
  
  const result: any = {}
  for (const [key, value] of Object.entries(obj)) {
    const camelKey = toCamelCase(key)
    result[camelKey] = typeof value === 'object' ? mapSnakeToCamel(value) : value
  }
  return result
}

// Feature lock definitions (would come from system config in real implementation)
const OPEN_SOURCE_LOCKED_FEATURES = [
  'event-scripts',
  'rate-limiting', 
  'scheduler',
  'reporting',
  'advanced-analytics',
  'multi-tenant',
  'enterprise-auth'
]

const SILVER_LOCKED_FEATURES = [
  'rate-limiting',
  'scheduler', 
  'reporting',
  'advanced-analytics',
  'multi-tenant'
]

/**
 * License management hook that handles license validation, feature checking, and license status monitoring.
 * Replaces Angular DfLicenseCheckService with React Query caching for license data and proper license 
 * state management throughout the application.
 * 
 * Features:
 * - License validation with automatic background checking using React Query intelligent caching
 * - License feature checking with integration to feature flag system and paywall enforcement
 * - License status monitoring with configurable refresh intervals and automatic renewal
 * - Error handling for license validation failures with fallback to appropriate access levels
 * - License data transformation from snake_case API responses to camelCase application patterns
 * - Integration with system configuration for license key management and validation workflows
 */
export const useLicense = () => {
  const queryClient = useQueryClient()

  // System configuration integration (placeholder - would use actual hook)
  const getSystemConfig = useCallback(() => {
    // This would integrate with useSystemConfig hook when available
    const stored = localStorage.getItem('df-system-config')
    try {
      return stored ? JSON.parse(stored) : null
    } catch {
      return null
    }
  }, [])

  const getLicenseKey = useCallback(() => {
    const config = getSystemConfig()
    return config?.platform?.licenseKey || process.env.NEXT_PUBLIC_LICENSE_KEY || ''
  }, [getSystemConfig])

  // License validation query with React Query intelligent caching
  const {
    data: licenseData,
    isLoading: isValidating,
    error: validationError,
    refetch: revalidateLicense,
    dataUpdatedAt
  } = useQuery({
    queryKey: [LICENSE_QUERY_KEY, 'status'],
    queryFn: async (): Promise<LicenseResponse> => {
      const licenseKey = getLicenseKey()
      
      if (!licenseKey) {
        throw new Error('No license key configured')
      }

      const response = await fetch(SUBSCRIPTION_DATA_URL, {
        method: 'GET',
        headers: {
          [LICENSE_KEY_HEADER]: licenseKey,
          'Content-Type': 'application/json'
        }
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.message || `License validation failed: ${response.status}`)
      }

      const rawData = await response.json()
      // Transform snake_case API responses to camelCase application patterns
      const transformedData = mapSnakeToCamel(rawData)
      
      return {
        ...transformedData,
        // Normalize disableUi to boolean
        disableUi: transformedData.disableUi === 'true' || transformedData.disableUi === true,
        // Detect license type from response or derive from feature availability
        licenseType: transformedData.licenseType || deriveLicenseType(transformedData),
        isValid: transformedData.statusCode === '200' || transformedData.statusCode === 'active'
      }
    },
    staleTime: DEFAULT_STALE_TIME,
    gcTime: DEFAULT_CACHE_TIME, // Updated from cacheTime in React Query v5
    retry: VALIDATION_RETRY_ATTEMPTS,
    retryDelay: attemptIndex => Math.min(1000 * 2 ** attemptIndex, 30000),
    refetchOnWindowFocus: true,
    refetchOnReconnect: true,
    // Background refetching for automatic license renewal
    refetchInterval: 30 * 60 * 1000, // 30 minutes
    enabled: !!getLicenseKey()
  })

  // License validation mutation for manual license key checking
  const validateLicenseMutation = useMutation({
    mutationFn: async ({ licenseKey }: LicenseCheckRequest): Promise<LicenseResponse> => {
      const response = await fetch(SUBSCRIPTION_DATA_URL, {
        method: 'GET',
        headers: {
          [LICENSE_KEY_HEADER]: licenseKey,
          'Content-Type': 'application/json'
        }
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.message || 'License validation failed')
      }

      const rawData = await response.json()
      const transformedData = mapSnakeToCamel(rawData)
      
      return {
        ...transformedData,
        disableUi: transformedData.disableUi === 'true' || transformedData.disableUi === true,
        licenseType: transformedData.licenseType || deriveLicenseType(transformedData),
        isValid: transformedData.statusCode === '200' || transformedData.statusCode === 'active'
      }
    },
    onSuccess: (data) => {
      // Update the license cache with validated data
      queryClient.setQueryData([LICENSE_QUERY_KEY, 'status'], data)
    },
    retry: VALIDATION_RETRY_ATTEMPTS,
    retryDelay: attemptIndex => Math.min(VALIDATION_RETRY_DELAY * 2 ** attemptIndex, 10000)
  })

  // Utility function to derive license type from features or response data
  const deriveLicenseType = useCallback((data: any): 'GOLD' | 'SILVER' | 'OPEN_SOURCE' => {
    if (data.features?.includes('enterprise') || data.licenseType === 'GOLD') {
      return 'GOLD'
    }
    if (data.features?.includes('professional') || data.licenseType === 'SILVER') {
      return 'SILVER'
    }
    return 'OPEN_SOURCE'
  }, [])

  // License feature checking with integration to feature flag system and paywall enforcement
  const isFeatureLocked = useCallback(({ feature, route, licenseType }: LicenseFeatureCheck): boolean => {
    const currentLicenseType = licenseType || licenseData?.licenseType || 'OPEN_SOURCE'
    
    // GOLD license has access to all features
    if (currentLicenseType === 'GOLD') {
      return false
    }
    
    // Check by route if provided
    if (route) {
      if (currentLicenseType === 'SILVER') {
        return SILVER_LOCKED_FEATURES.some(lockedFeature => route.includes(lockedFeature))
      }
      return OPEN_SOURCE_LOCKED_FEATURES.some(lockedFeature => route.includes(lockedFeature))
    }
    
    // Check by feature name
    if (currentLicenseType === 'SILVER') {
      return SILVER_LOCKED_FEATURES.includes(feature)
    }
    return OPEN_SOURCE_LOCKED_FEATURES.includes(feature)
  }, [licenseData?.licenseType])

  // Check if current license allows specific features
  const hasFeatureAccess = useCallback((feature: string): boolean => {
    return !isFeatureLocked({ feature })
  }, [isFeatureLocked])

  // Get current license status with comprehensive information
  const getLicenseStatus = useCallback((): LicenseValidationResult => {
    return {
      isValid: licenseData?.isValid ?? false,
      licenseData: licenseData || null,
      error: validationError?.message || null,
      isLoading: isValidating || validateLicenseMutation.isPending,
      lastChecked: dataUpdatedAt ? new Date(dataUpdatedAt) : null
    }
  }, [licenseData, validationError, isValidating, validateLicenseMutation.isPending, dataUpdatedAt])

  // Force license revalidation
  const forceRevalidation = useCallback(async () => {
    await revalidateLicense()
  }, [revalidateLicense])

  // Validate specific license key
  const validateLicense = useCallback(async (licenseKey: string): Promise<LicenseResponse> => {
    return validateLicenseMutation.mutateAsync({ licenseKey })
  }, [validateLicenseMutation])

  // Clear license cache (useful for logout scenarios)
  const clearLicenseCache = useCallback(() => {
    queryClient.removeQueries({ queryKey: [LICENSE_QUERY_KEY] })
  }, [queryClient])

  // Check if license is expiring soon (within 30 days)
  const isLicenseExpiringSoon = useMemo(() => {
    if (!licenseData?.renewalDate && !licenseData?.expirationDate) {
      return false
    }
    
    const expirationDate = new Date(licenseData.renewalDate || licenseData.expirationDate!)
    const thirtyDaysFromNow = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
    
    return expirationDate <= thirtyDaysFromNow
  }, [licenseData])

  // Get user count information if available
  const getUserLimits = useMemo(() => {
    if (!licenseData?.maxUsers) return null
    
    return {
      maxUsers: licenseData.maxUsers,
      currentUsers: licenseData.currentUsers || 0,
      isNearLimit: licenseData.currentUsers ? 
        (licenseData.currentUsers / licenseData.maxUsers) > 0.8 : false
    }
  }, [licenseData])

  return {
    // Core license data
    licenseData,
    isValidating,
    validationError,
    lastChecked: dataUpdatedAt ? new Date(dataUpdatedAt) : null,
    
    // License status and validation
    getLicenseStatus,
    validateLicense,
    forceRevalidation,
    clearLicenseCache,
    
    // Feature checking
    isFeatureLocked,
    hasFeatureAccess,
    
    // License information
    licenseType: licenseData?.licenseType || 'OPEN_SOURCE',
    isLicenseValid: licenseData?.isValid ?? false,
    isLicenseExpiringSoon,
    getUserLimits,
    
    // Mutation states
    isValidatingManual: validateLicenseMutation.isPending,
    validationMutationError: validateLicenseMutation.error?.message || null,
    
    // Legacy compatibility
    licenseCheck$: licenseData, // For components still expecting observable pattern
    check: validateLicense // Alias for backward compatibility
  }
}

export default useLicense

// Type exports for use throughout the application
export type {
  LicenseResponse,
  LicenseCheckRequest,
  LicenseFeatureCheck,
  LicenseValidationResult
}