/**
 * Environment Configuration Library
 * 
 * Enhanced environment configuration for React/Next.js DreamFactory Admin Interface.
 * Provides centralized access to environment variables, configuration validation,
 * and license-related environment settings. Extends the base environment configuration
 * with license validation and platform-specific settings.
 * 
 * @fileoverview Environment configuration with license validation support for 
 * React Query-based license checking and platform configuration management.
 * 
 * @author DreamFactory Admin Interface Team
 * @version React 19/Next.js 15.1 Migration
 */

import { 
  env as baseEnv, 
  dreamFactoryConfig as baseDreamFactoryConfig,
  validateEnvironment as baseValidateEnvironment,
  isServerSide,
  isClientSide,
  type ClientEnvironmentVariables,
  type ServerEnvironmentVariables
} from '@/environments/env'

// =============================================================================
// EXTENDED ENVIRONMENT TYPES
// =============================================================================

/**
 * Extended client environment variables including license configuration
 */
interface ExtendedClientEnvironmentVariables extends ClientEnvironmentVariables {
  /** Platform license type */
  readonly NEXT_PUBLIC_PLATFORM_LICENSE?: string
  /** License key for platform validation */
  readonly NEXT_PUBLIC_LICENSE_KEY?: string
  /** DreamFactory license key (alternative) */
  readonly NEXT_PUBLIC_DF_LICENSE_KEY?: string
  /** Enable license checking in development */
  readonly NEXT_PUBLIC_ENABLE_LICENSE_CHECK?: string
  /** License server URL override */
  readonly NEXT_PUBLIC_LICENSE_SERVER_URL?: string
  /** Platform edition identifier */
  readonly NEXT_PUBLIC_PLATFORM_EDITION?: string
  /** License validation endpoint override */
  readonly NEXT_PUBLIC_LICENSE_ENDPOINT?: string
}

/**
 * Extended server environment variables for license validation
 */
interface ExtendedServerEnvironmentVariables extends ServerEnvironmentVariables {
  /** Server-side license key */
  readonly LICENSE_KEY?: string
  /** License server URL for backend validation */
  readonly LICENSE_SERVER_URL?: string
  /** License validation timeout */
  readonly LICENSE_TIMEOUT?: string
  /** License validation retry count */
  readonly LICENSE_RETRY_COUNT?: string
}

/**
 * Complete extended environment variables type
 */
type ExtendedEnvironmentVariables = ExtendedClientEnvironmentVariables & 
  Partial<ExtendedServerEnvironmentVariables>

// =============================================================================
// LICENSE ENVIRONMENT CONFIGURATION
// =============================================================================

/**
 * License environment configuration interface
 */
export interface LicenseEnvironment {
  /** Platform license type */
  license: string
  /** License key (client or server) */
  licenseKey?: string
  /** Platform version */
  version?: string
  /** Environment type */
  environment: 'development' | 'staging' | 'production'
  /** License check enablement */
  enableLicenseCheck: boolean
  /** License server URL */
  licenseServerUrl?: string
  /** Platform edition */
  edition?: string
  /** Validation endpoint */
  validationEndpoint?: string
}

/**
 * Platform configuration interface
 */
export interface PlatformConfig {
  /** License configuration */
  license: LicenseEnvironment
  /** Platform metadata */
  platform: {
    name: string
    version: string
    edition: string
    environment: string
  }
  /** Feature flags derived from license */
  features: {
    licenseValidation: boolean
    advancedFeatures: boolean
    enterpriseFeatures: boolean
    developmentMode: boolean
  }
}

// =============================================================================
// EXTENDED ENVIRONMENT OBJECT
// =============================================================================

/**
 * Extended environment configuration with license support
 * Maintains compatibility with base environment while adding license functionality
 */
export const env: ExtendedEnvironmentVariables = {
  // Inherit base environment variables
  ...baseEnv,
  
  // Extended client-side license variables
  NEXT_PUBLIC_PLATFORM_LICENSE: process.env.NEXT_PUBLIC_PLATFORM_LICENSE || 'OPEN SOURCE',
  NEXT_PUBLIC_LICENSE_KEY: process.env.NEXT_PUBLIC_LICENSE_KEY,
  NEXT_PUBLIC_DF_LICENSE_KEY: process.env.NEXT_PUBLIC_DF_LICENSE_KEY,
  NEXT_PUBLIC_ENABLE_LICENSE_CHECK: process.env.NEXT_PUBLIC_ENABLE_LICENSE_CHECK || 'false',
  NEXT_PUBLIC_LICENSE_SERVER_URL: process.env.NEXT_PUBLIC_LICENSE_SERVER_URL,
  NEXT_PUBLIC_PLATFORM_EDITION: process.env.NEXT_PUBLIC_PLATFORM_EDITION || 'community',
  NEXT_PUBLIC_LICENSE_ENDPOINT: process.env.NEXT_PUBLIC_LICENSE_ENDPOINT,
  
  // Extended server-side license variables (server context only)
  ...(isServerSide() ? {
    LICENSE_KEY: process.env.LICENSE_KEY,
    LICENSE_SERVER_URL: process.env.LICENSE_SERVER_URL,
    LICENSE_TIMEOUT: process.env.LICENSE_TIMEOUT || '5000',
    LICENSE_RETRY_COUNT: process.env.LICENSE_RETRY_COUNT || '2',
  } : {}),
} as const

// =============================================================================
// EXTENDED DREAMFACTORY CONFIGURATION
// =============================================================================

/**
 * Extended DreamFactory configuration with license endpoints
 */
export const dreamFactoryConfig = {
  // Inherit base configuration
  ...baseDreamFactoryConfig,
  
  // Extended endpoints for license validation
  endpoints: {
    ...baseDreamFactoryConfig.endpoints,
    
    // License-related endpoints
    license: {
      check: `${env.NEXT_PUBLIC_API_URL}/api/v2/system/license/check`,
      validate: `${env.NEXT_PUBLIC_API_URL}/api/v2/system/license/validate`,
      info: `${env.NEXT_PUBLIC_API_URL}/api/v2/system/license/info`,
      features: `${env.NEXT_PUBLIC_API_URL}/api/v2/system/license/features`,
    },
    
    // Custom license server endpoints (if configured)
    ...(env.NEXT_PUBLIC_LICENSE_SERVER_URL ? {
      licenseServer: {
        check: `${env.NEXT_PUBLIC_LICENSE_SERVER_URL}/check`,
        validate: `${env.NEXT_PUBLIC_LICENSE_SERVER_URL}/validate`,
        info: `${env.NEXT_PUBLIC_LICENSE_SERVER_URL}/info`,
      }
    } : {}),
  },
  
  // Extended default headers with license information
  defaultHeaders: {
    ...baseDreamFactoryConfig.defaultHeaders,
    
    // Add license key headers if available
    ...(env.NEXT_PUBLIC_LICENSE_KEY ? {
      'X-DreamFactory-License-Key': env.NEXT_PUBLIC_LICENSE_KEY,
    } : {}),
    ...(env.NEXT_PUBLIC_DF_LICENSE_KEY ? {
      'X-DF-License-Key': env.NEXT_PUBLIC_DF_LICENSE_KEY,
    } : {}),
  },
  
  // Extended features configuration
  features: {
    ...baseDreamFactoryConfig.features,
    
    // License-related features
    licenseValidation: env.NEXT_PUBLIC_PLATFORM_LICENSE !== 'OPEN SOURCE',
    licenseCheckEnabled: env.NEXT_PUBLIC_ENABLE_LICENSE_CHECK === 'true',
    hasLicenseKey: !!(env.NEXT_PUBLIC_LICENSE_KEY || env.NEXT_PUBLIC_DF_LICENSE_KEY),
    isPlatformLicensed: env.NEXT_PUBLIC_PLATFORM_LICENSE !== 'OPEN SOURCE',
  },
} as const

// =============================================================================
// LICENSE ENVIRONMENT FUNCTIONS
// =============================================================================

/**
 * Extracts license environment configuration from environment variables
 * Implements environment-based conditional logic for license validation
 */
export function getLicenseEnvironment(): LicenseEnvironment {
  // Determine the appropriate license key
  const licenseKey = env.NEXT_PUBLIC_LICENSE_KEY || 
                    env.NEXT_PUBLIC_DF_LICENSE_KEY ||
                    (isServerSide() ? env.LICENSE_KEY : undefined)
  
  // Determine license server URL
  const licenseServerUrl = env.NEXT_PUBLIC_LICENSE_SERVER_URL ||
                          (isServerSide() ? env.LICENSE_SERVER_URL : undefined)
  
  // Check if license validation should be enabled
  const enableLicenseCheck = env.NEXT_PUBLIC_PLATFORM_LICENSE !== 'OPEN SOURCE' &&
                            !!licenseKey &&
                            (env.NODE_ENV !== 'development' || env.NEXT_PUBLIC_ENABLE_LICENSE_CHECK === 'true')
  
  return {
    license: env.NEXT_PUBLIC_PLATFORM_LICENSE || 'OPEN SOURCE',
    licenseKey,
    version: env.NEXT_PUBLIC_VERSION,
    environment: env.NODE_ENV as 'development' | 'staging' | 'production',
    enableLicenseCheck,
    licenseServerUrl,
    edition: env.NEXT_PUBLIC_PLATFORM_EDITION,
    validationEndpoint: env.NEXT_PUBLIC_LICENSE_ENDPOINT,
  }
}

/**
 * Gets complete platform configuration including license information
 */
export function getPlatformConfig(): PlatformConfig {
  const licenseEnv = getLicenseEnvironment()
  
  return {
    license: licenseEnv,
    platform: {
      name: env.NEXT_PUBLIC_APP_NAME || 'DreamFactory Admin Interface',
      version: env.NEXT_PUBLIC_VERSION || '1.0.0',
      edition: licenseEnv.edition || 'community',
      environment: env.NODE_ENV,
    },
    features: {
      licenseValidation: licenseEnv.enableLicenseCheck,
      advancedFeatures: licenseEnv.license === 'PROFESSIONAL' || licenseEnv.license === 'ENTERPRISE',
      enterpriseFeatures: licenseEnv.license === 'ENTERPRISE',
      developmentMode: env.NODE_ENV === 'development',
    },
  }
}

/**
 * Determines if license checking should be performed
 * Implements conditional license checking logic based on environment and configuration
 */
export function shouldCheckLicense(): boolean {
  const licenseEnv = getLicenseEnvironment()
  
  // Always skip for open source
  if (licenseEnv.license === 'OPEN SOURCE') {
    return false
  }
  
  // Skip if no license key
  if (!licenseEnv.licenseKey || licenseEnv.licenseKey.trim() === '') {
    return false
  }
  
  // Check development mode setting
  if (licenseEnv.environment === 'development' && !licenseEnv.enableLicenseCheck) {
    return false
  }
  
  return true
}

/**
 * Gets license key with fallback priority
 */
export function getLicenseKey(): string | undefined {
  return env.NEXT_PUBLIC_LICENSE_KEY || 
         env.NEXT_PUBLIC_DF_LICENSE_KEY ||
         (isServerSide() ? env.LICENSE_KEY : undefined)
}

/**
 * Gets license server URL with fallback
 */
export function getLicenseServerUrl(): string | undefined {
  return env.NEXT_PUBLIC_LICENSE_SERVER_URL ||
         (isServerSide() ? env.LICENSE_SERVER_URL : undefined) ||
         `${env.NEXT_PUBLIC_API_URL}/api/v2/system`
}

// =============================================================================
// VALIDATION FUNCTIONS
// =============================================================================

/**
 * Validates license-related environment variables
 */
function validateLicenseEnvironment(): void {
  const licenseEnv = getLicenseEnvironment()
  
  // If license is not open source, validate license configuration
  if (licenseEnv.license !== 'OPEN SOURCE') {
    // Warn if no license key is provided
    if (!licenseEnv.licenseKey) {
      console.warn(
        `⚠️  Platform license is set to '${licenseEnv.license}' but no license key provided. ` +
        'Set NEXT_PUBLIC_LICENSE_KEY or NEXT_PUBLIC_DF_LICENSE_KEY environment variable.'
      )
    }
    
    // Validate license server URL format if provided
    if (licenseEnv.licenseServerUrl) {
      try {
        new URL(licenseEnv.licenseServerUrl)
      } catch {
        console.warn(
          `⚠️  Invalid license server URL format: ${licenseEnv.licenseServerUrl}. ` +
          'Must be a valid URL format.'
        )
      }
    }
  }
  
  // Validate timeout and retry settings in server context
  if (isServerSide()) {
    const timeout = env.LICENSE_TIMEOUT
    if (timeout && isNaN(parseInt(timeout, 10))) {
      console.warn(`⚠️  Invalid LICENSE_TIMEOUT value: ${timeout}. Must be a number.`)
    }
    
    const retryCount = env.LICENSE_RETRY_COUNT
    if (retryCount && isNaN(parseInt(retryCount, 10))) {
      console.warn(`⚠️  Invalid LICENSE_RETRY_COUNT value: ${retryCount}. Must be a number.`)
    }
  }
}

/**
 * Extended environment validation including license configuration
 */
export function validateEnvironment(): void {
  // Run base environment validation
  baseValidateEnvironment()
  
  // Run license-specific validation
  validateLicenseEnvironment()
}

// =============================================================================
// UTILITY FUNCTIONS
// =============================================================================

/**
 * Checks if the platform is running in open source mode
 */
export function isOpenSourceMode(): boolean {
  return env.NEXT_PUBLIC_PLATFORM_LICENSE === 'OPEN SOURCE'
}

/**
 * Checks if the platform has a professional license
 */
export function isProfessionalLicense(): boolean {
  return env.NEXT_PUBLIC_PLATFORM_LICENSE === 'PROFESSIONAL'
}

/**
 * Checks if the platform has an enterprise license
 */
export function isEnterpriseLicense(): boolean {
  return env.NEXT_PUBLIC_PLATFORM_LICENSE === 'ENTERPRISE'
}

/**
 * Checks if advanced features should be available
 */
export function hasAdvancedFeatures(): boolean {
  return isProfessionalLicense() || isEnterpriseLicense()
}

/**
 * Checks if enterprise features should be available
 */
export function hasEnterpriseFeatures(): boolean {
  return isEnterpriseLicense()
}

/**
 * Gets license timeout value with fallback
 */
export function getLicenseTimeout(): number {
  if (isServerSide() && env.LICENSE_TIMEOUT) {
    const timeout = parseInt(env.LICENSE_TIMEOUT, 10)
    return isNaN(timeout) ? 5000 : timeout
  }
  return 5000 // Default 5 second timeout
}

/**
 * Gets license retry count with fallback
 */
export function getLicenseRetryCount(): number {
  if (isServerSide() && env.LICENSE_RETRY_COUNT) {
    const retryCount = parseInt(env.LICENSE_RETRY_COUNT, 10)
    return isNaN(retryCount) ? 2 : retryCount
  }
  return 2 // Default 2 retries
}

// =============================================================================
// EXPORTS
// =============================================================================

// Re-export base environment utilities
export {
  isServerSide,
  isClientSide,
  runtimeInfo,
} from '@/environments/env'

// Export extended configuration
export {
  env,
  dreamFactoryConfig,
  validateEnvironment,
}

// Export license-specific functions
export {
  getLicenseEnvironment,
  getPlatformConfig,
  shouldCheckLicense,
  getLicenseKey,
  getLicenseServerUrl,
  isOpenSourceMode,
  isProfessionalLicense,
  isEnterpriseLicense,
  hasAdvancedFeatures,
  hasEnterpriseFeatures,
  getLicenseTimeout,
  getLicenseRetryCount,
}

// Export types
export type {
  LicenseEnvironment,
  PlatformConfig,
  ExtendedClientEnvironmentVariables,
  ExtendedServerEnvironmentVariables,
  ExtendedEnvironmentVariables,
}

// Default export
export default env