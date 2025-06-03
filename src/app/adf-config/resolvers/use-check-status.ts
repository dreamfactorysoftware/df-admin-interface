/**
 * License Check Status Hook
 * 
 * React Query-based custom hook that fetches platform license check status with intelligent 
 * caching and conditional license validation. Replaces the Angular checkStatusResolver by 
 * implementing React Query useQuery with environment-based conditional logic, license key 
 * validation, and fallback handling.
 * 
 * @fileoverview Platform license status validation for ADF configuration requirements with 
 * React Query-powered conditional data fetching and cache responses under 50ms per 
 * React/Next.js Integration Requirements.
 * 
 * @author DreamFactory Admin Interface Team
 * @version React 19/Next.js 15.1 Migration
 */

import { useQuery, type UseQueryResult } from '@tanstack/react-query'
import { apiClient } from '@/lib/api-client'
import { env, dreamFactoryConfig } from '@/lib/environment'

// =============================================================================
// TYPE DEFINITIONS
// =============================================================================

/**
 * License check response structure from DreamFactory Core API
 * Maintains compatibility with existing backend while adding React Query support
 */
export interface CheckResponse {
  /** License validation status */
  success: boolean
  /** License type (if applicable) */
  license_type?: string
  /** License expiration date (ISO 8601 format) */
  expires_at?: string
  /** Licensed features and limits */
  features?: {
    max_services?: number
    max_users?: number
    advanced_features?: boolean
    support_level?: 'basic' | 'professional' | 'enterprise'
  }
  /** License validation messages */
  message?: string
  /** License key validation details */
  validation?: {
    key_valid: boolean
    key_expired: boolean
    domain_valid: boolean
  }
  /** Additional license metadata */
  metadata?: {
    issued_to?: string
    issued_at?: string
    version?: string
    platform?: string
  }
}

/**
 * Environment configuration interface for license checking
 * Derived from environment variables and platform configuration
 */
interface LicenseEnvironment {
  /** Platform license type */
  license: 'OPEN SOURCE' | 'PROFESSIONAL' | 'ENTERPRISE' | string
  /** License key (if available) */
  licenseKey?: string
  /** Platform version */
  version?: string
  /** Environment type */
  environment: 'development' | 'staging' | 'production'
}

// =============================================================================
// CONSTANTS AND CONFIGURATION
// =============================================================================

/**
 * Query key factory for license check queries
 */
const LICENSE_CHECK_QUERY_KEY = ['license', 'check', 'status'] as const

/**
 * Default cache configuration for license checks
 * Optimized for React/Next.js Integration Requirements with cache responses under 50ms
 */
const LICENSE_CHECK_CONFIG = {
  /** Stale time - 5 minutes for license status caching */
  staleTime: 5 * 60 * 1000,
  /** Cache time - 10 minutes for query cache retention */
  cacheTime: 10 * 60 * 1000,
  /** Retry configuration for failed license checks */
  retry: 2,
  /** Retry delay with exponential backoff */
  retryDelay: (attemptIndex: number) => Math.min(1000 * 2 ** attemptIndex, 30000),
  /** Refetch on window focus for fresh license validation */
  refetchOnWindowFocus: true,
  /** Refetch on reconnect for network recovery */
  refetchOnReconnect: true,
  /** Background refetch interval - every 15 minutes */
  refetchInterval: 15 * 60 * 1000,
} as const

// =============================================================================
// ENVIRONMENT AND LICENSE VALIDATION
// =============================================================================

/**
 * Extracts license environment configuration from Next.js environment variables
 * Implements environment-based conditional logic per Section 4.1 system workflows
 */
function getLicenseEnvironment(): LicenseEnvironment {
  // Extract platform configuration from environment variables
  // Default to OPEN SOURCE for development/missing configuration
  const platformLicense = env.NEXT_PUBLIC_PLATFORM_LICENSE || 'OPEN SOURCE'
  const licenseKey = env.NEXT_PUBLIC_LICENSE_KEY || env.NEXT_PUBLIC_DF_LICENSE_KEY
  
  return {
    license: platformLicense,
    licenseKey,
    version: env.NEXT_PUBLIC_VERSION,
    environment: env.NODE_ENV,
  }
}

/**
 * Determines if license checking should be performed based on environment conditions
 * Implements conditional license checking logic per Section 7.1 Core UI Technologies
 */
function shouldCheckLicense(): boolean {
  const environment = getLicenseEnvironment()
  
  // Skip license checking for open source mode
  if (environment.license === 'OPEN SOURCE') {
    return false
  }
  
  // Skip if no license key is available
  if (!environment.licenseKey || environment.licenseKey.trim() === '') {
    return false
  }
  
  // Skip in development mode unless explicitly enabled
  if (environment.environment === 'development' && !env.NEXT_PUBLIC_ENABLE_LICENSE_CHECK) {
    return false
  }
  
  return true
}

// =============================================================================
// API INTEGRATION
// =============================================================================

/**
 * Fetches license check status from DreamFactory Core API
 * Integrates with existing backend services while leveraging React Query caching
 */
async function fetchLicenseCheckStatus(): Promise<CheckResponse> {
  const environment = getLicenseEnvironment()
  
  // Construct license check endpoint
  // Uses system API for license validation
  const endpoint = `${dreamFactoryConfig.endpoints.system}/license/check`
  
  try {
    // Perform license check API call with authentication headers
    const response = await apiClient.get(endpoint, {
      headers: {
        ...dreamFactoryConfig.defaultHeaders,
        'X-DreamFactory-License-Key': environment.licenseKey || '',
      },
      // Add timeout for license check requests (5 seconds)
      signal: AbortSignal.timeout(5000),
    })
    
    // Validate response structure
    if (!response || typeof response !== 'object') {
      throw new Error('Invalid license check response format')
    }
    
    return response as CheckResponse
    
  } catch (error) {
    // Handle API errors gracefully
    if (error instanceof Error) {
      // Log error for debugging (development only)
      if (env.NODE_ENV === 'development') {
        console.warn('License check failed:', error.message)
      }
      
      // Return fallback response for license check failures
      return {
        success: false,
        message: `License validation failed: ${error.message}`,
        validation: {
          key_valid: false,
          key_expired: false,
          domain_valid: false,
        },
      }
    }
    
    // Unknown error type - return generic failure response
    return {
      success: false,
      message: 'License check encountered an unexpected error',
      validation: {
        key_valid: false,
        key_expired: false,
        domain_valid: false,
      },
    }
  }
}

// =============================================================================
// REACT QUERY HOOK IMPLEMENTATION
// =============================================================================

/**
 * React Query-based license check status hook
 * 
 * Provides type-safe CheckResponse | null return type while maintaining the original 
 * license validation patterns and null fallback behavior per Section 0.2.6 minimal 
 * change clause.
 * 
 * @returns UseQueryResult with CheckResponse data or null for non-applicable environments
 * 
 * @example
 * ```tsx
 * function LicenseStatus() {
 *   const { data: licenseStatus, isLoading, error } = useCheckStatus()
 *   
 *   if (isLoading) return <div>Checking license...</div>
 *   if (error) return <div>License check failed</div>
 *   if (!licenseStatus) return <div>Open source mode</div>
 *   
 *   return (
 *     <div>
 *       License Status: {licenseStatus.success ? 'Valid' : 'Invalid'}
 *       {licenseStatus.expires_at && (
 *         <div>Expires: {new Date(licenseStatus.expires_at).toLocaleDateString()}</div>
 *       )}
 *     </div>
 *   )
 * }
 * ```
 */
export function useCheckStatus(): UseQueryResult<CheckResponse | null, Error> {
  return useQuery({
    // Unique query key for license check caching
    queryKey: LICENSE_CHECK_QUERY_KEY,
    
    // Query function with conditional execution
    queryFn: async (): Promise<CheckResponse | null> => {
      // Check if license validation should be performed
      if (!shouldCheckLicense()) {
        // Return null for open source mode or missing license configuration
        // Maintains null fallback response pattern per requirements
        return null
      }
      
      // Fetch license status from DreamFactory Core API
      return await fetchLicenseCheckStatus()
    },
    
    // Performance optimization configuration
    staleTime: LICENSE_CHECK_CONFIG.staleTime,
    cacheTime: LICENSE_CHECK_CONFIG.cacheTime,
    
    // Error handling and retry configuration
    retry: LICENSE_CHECK_CONFIG.retry,
    retryDelay: LICENSE_CHECK_CONFIG.retryDelay,
    
    // Background refetch configuration for fresh data
    refetchOnWindowFocus: LICENSE_CHECK_CONFIG.refetchOnWindowFocus,
    refetchOnReconnect: LICENSE_CHECK_CONFIG.refetchOnReconnect,
    refetchInterval: LICENSE_CHECK_CONFIG.refetchInterval,
    
    // Enable background refetch only in production for license monitoring
    refetchIntervalInBackground: env.NODE_ENV === 'production',
    
    // Suspense support for React 19 concurrent features
    suspense: false,
    
    // Error boundary integration
    useErrorBoundary: false,
    
    // Keep previous data during refetch for smooth UX
    keepPreviousData: true,
    
    // Network mode configuration for offline scenarios
    networkMode: 'online',
    
    // Custom meta for debugging and monitoring
    meta: {
      errorMessage: 'Failed to fetch license check status',
      component: 'useCheckStatus',
      category: 'license-validation',
    },
  })
}

// =============================================================================
// UTILITY FUNCTIONS
// =============================================================================

/**
 * Type guard to check if license check data is available
 */
export function hasLicenseData(data: CheckResponse | null | undefined): data is CheckResponse {
  return data !== null && data !== undefined && typeof data === 'object'
}

/**
 * Utility to check if license is valid based on response
 */
export function isLicenseValid(licenseData: CheckResponse | null): boolean {
  if (!hasLicenseData(licenseData)) {
    // For open source mode, consider as "valid" (no license required)
    return true
  }
  
  return licenseData.success && 
         licenseData.validation?.key_valid === true &&
         licenseData.validation?.key_expired !== true
}

/**
 * Utility to get license expiration status
 */
export function getLicenseExpirationInfo(licenseData: CheckResponse | null): {
  isExpired: boolean
  expiresAt: Date | null
  daysUntilExpiration: number | null
} {
  if (!hasLicenseData(licenseData) || !licenseData.expires_at) {
    return {
      isExpired: false,
      expiresAt: null,
      daysUntilExpiration: null,
    }
  }
  
  const expiresAt = new Date(licenseData.expires_at)
  const now = new Date()
  const isExpired = expiresAt < now
  const daysUntilExpiration = Math.ceil((expiresAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
  
  return {
    isExpired,
    expiresAt,
    daysUntilExpiration: isExpired ? 0 : daysUntilExpiration,
  }
}

/**
 * Utility to format license status for display
 */
export function formatLicenseStatus(licenseData: CheckResponse | null): string {
  if (!hasLicenseData(licenseData)) {
    return 'Open Source'
  }
  
  if (!licenseData.success) {
    return 'Invalid'
  }
  
  const { isExpired, daysUntilExpiration } = getLicenseExpirationInfo(licenseData)
  
  if (isExpired) {
    return 'Expired'
  }
  
  if (daysUntilExpiration !== null && daysUntilExpiration <= 30) {
    return `Valid (expires in ${daysUntilExpiration} days)`
  }
  
  return 'Valid'
}

// =============================================================================
// EXPORTS
// =============================================================================

// Export hook as default for convenient importing
export default useCheckStatus

// Export types for external use
export type { CheckResponse, LicenseEnvironment }

// Export utility functions
export {
  getLicenseEnvironment,
  shouldCheckLicense,
  hasLicenseData,
  isLicenseValid,
  getLicenseExpirationInfo,
  formatLicenseStatus,
}