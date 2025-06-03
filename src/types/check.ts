/**
 * License Check Types
 * 
 * Type definitions for DreamFactory platform license validation and check status responses.
 * Provides comprehensive type safety for license validation workflows, expiration handling,
 * and feature availability checking.
 * 
 * @fileoverview Platform license validation types for React Query-based license checking
 * with support for multiple license tiers and validation scenarios.
 * 
 * @author DreamFactory Admin Interface Team
 * @version React 19/Next.js 15.1 Migration
 */

// =============================================================================
// CORE LICENSE CHECK TYPES
// =============================================================================

/**
 * License check response structure from DreamFactory Core API
 * Maintains compatibility with existing backend while adding React Query support
 */
export interface CheckResponse {
  /** License validation status */
  success: boolean
  /** License type (if applicable) */
  license_type?: 'OPEN_SOURCE' | 'PROFESSIONAL' | 'ENTERPRISE' | 'TRIAL' | string
  /** License expiration date (ISO 8601 format) */
  expires_at?: string
  /** Licensed features and limits */
  features?: LicenseFeatures
  /** License validation messages */
  message?: string
  /** License key validation details */
  validation?: LicenseValidation
  /** Additional license metadata */
  metadata?: LicenseMetadata
  /** License usage statistics */
  usage?: LicenseUsage
  /** Support and maintenance information */
  support?: SupportInfo
}

/**
 * Licensed features and limits structure
 */
export interface LicenseFeatures {
  /** Maximum number of database services */
  max_services?: number
  /** Maximum number of users */
  max_users?: number
  /** Maximum number of admin users */
  max_admins?: number
  /** Advanced features availability */
  advanced_features?: boolean
  /** API rate limits */
  api_rate_limits?: {
    requests_per_minute?: number
    requests_per_hour?: number
    requests_per_day?: number
  }
  /** Storage limits */
  storage_limits?: {
    max_storage_gb?: number
    max_files?: number
  }
  /** Support level */
  support_level?: 'none' | 'basic' | 'professional' | 'enterprise' | 'premium'
  /** Available integrations */
  integrations?: string[]
  /** Security features */
  security_features?: {
    sso_enabled?: boolean
    advanced_auth?: boolean
    audit_logging?: boolean
    encryption?: boolean
  }
  /** Development features */
  development_features?: {
    scripting_enabled?: boolean
    event_scripts?: boolean
    custom_apis?: boolean
    webhooks?: boolean
  }
}

/**
 * License key validation details
 */
export interface LicenseValidation {
  /** License key format validation */
  key_valid: boolean
  /** License expiration status */
  key_expired: boolean
  /** Domain/host validation */
  domain_valid: boolean
  /** Signature validation */
  signature_valid?: boolean
  /** Version compatibility */
  version_compatible?: boolean
  /** Validation errors */
  validation_errors?: string[]
  /** Validation warnings */
  validation_warnings?: string[]
}

/**
 * License metadata information
 */
export interface LicenseMetadata {
  /** License holder organization */
  issued_to?: string
  /** License issue date (ISO 8601) */
  issued_at?: string
  /** License version */
  version?: string
  /** Target platform */
  platform?: string
  /** License identifier */
  license_id?: string
  /** Issuing authority */
  issued_by?: string
  /** License renewal information */
  renewal_info?: {
    auto_renewal?: boolean
    renewal_date?: string
    renewal_url?: string
  }
}

/**
 * License usage statistics
 */
export interface LicenseUsage {
  /** Current service count */
  current_services?: number
  /** Current user count */
  current_users?: number
  /** Current admin count */
  current_admins?: number
  /** API usage statistics */
  api_usage?: {
    requests_today?: number
    requests_this_month?: number
    peak_requests_per_minute?: number
  }
  /** Storage usage */
  storage_usage?: {
    used_storage_gb?: number
    used_files?: number
    usage_percentage?: number
  }
  /** Last usage update timestamp */
  last_updated?: string
}

/**
 * Support and maintenance information
 */
export interface SupportInfo {
  /** Support level details */
  level?: 'none' | 'basic' | 'professional' | 'enterprise' | 'premium'
  /** Support expiration date */
  support_expires?: string
  /** Maintenance status */
  maintenance_active?: boolean
  /** Support contact information */
  contact?: {
    email?: string
    phone?: string
    portal_url?: string
  }
  /** Available support channels */
  channels?: ('email' | 'phone' | 'chat' | 'portal' | 'priority')[]
  /** Response time guarantees */
  response_times?: {
    critical?: string
    high?: string
    medium?: string
    low?: string
  }
}

// =============================================================================
// LICENSE ENVIRONMENT TYPES
// =============================================================================

/**
 * Environment configuration interface for license checking
 * Derived from environment variables and platform configuration
 */
export interface LicenseEnvironment {
  /** Platform license type */
  license: 'OPEN SOURCE' | 'PROFESSIONAL' | 'ENTERPRISE' | 'TRIAL' | string
  /** License key (if available) */
  licenseKey?: string
  /** Platform version */
  version?: string
  /** Environment type */
  environment: 'development' | 'staging' | 'production'
  /** License check enablement flag */
  enableLicenseCheck?: boolean
  /** License server URL override */
  licenseServerUrl?: string
}

/**
 * License status enumeration for consistent status handling
 */
export enum LicenseStatus {
  UNKNOWN = 'unknown',
  OPEN_SOURCE = 'open_source',
  VALID = 'valid',
  EXPIRED = 'expired',
  INVALID = 'invalid',
  TRIAL = 'trial',
  TRIAL_EXPIRED = 'trial_expired',
  SUSPENDED = 'suspended',
}

/**
 * License tier enumeration for feature gating
 */
export enum LicenseTier {
  OPEN_SOURCE = 'open_source',
  TRIAL = 'trial',
  PROFESSIONAL = 'professional',
  ENTERPRISE = 'enterprise',
  PREMIUM = 'premium',
}

// =============================================================================
// VALIDATION AND UTILITY TYPES
// =============================================================================

/**
 * License validation result for comprehensive checking
 */
export interface LicenseValidationResult {
  /** Overall validation status */
  isValid: boolean
  /** Detailed validation status */
  status: LicenseStatus
  /** License tier */
  tier: LicenseTier
  /** Validation errors */
  errors: string[]
  /** Validation warnings */
  warnings: string[]
  /** Expiration information */
  expiration: {
    isExpired: boolean
    expiresAt: Date | null
    daysUntilExpiration: number | null
  }
  /** Feature availability */
  features: {
    [feature: string]: boolean
  }
}

/**
 * License check configuration options
 */
export interface LicenseCheckOptions {
  /** Force license check even in development */
  force?: boolean
  /** Skip cache and fetch fresh data */
  skipCache?: boolean
  /** Custom timeout for license check requests */
  timeout?: number
  /** Custom retry configuration */
  retry?: {
    attempts: number
    delay: number
  }
  /** Include usage statistics in response */
  includeUsage?: boolean
  /** Include support information in response */
  includeSupport?: boolean
}

/**
 * License check error types for specific error handling
 */
export enum LicenseCheckError {
  NETWORK_ERROR = 'network_error',
  INVALID_RESPONSE = 'invalid_response',
  AUTHENTICATION_FAILED = 'authentication_failed',
  LICENSE_SERVER_ERROR = 'license_server_error',
  TIMEOUT = 'timeout',
  UNKNOWN_ERROR = 'unknown_error',
}

/**
 * License check error detail structure
 */
export interface LicenseCheckErrorDetail {
  /** Error type */
  type: LicenseCheckError
  /** Error message */
  message: string
  /** Error code (if available) */
  code?: string | number
  /** Additional error context */
  context?: Record<string, unknown>
  /** Timestamp of error occurrence */
  timestamp: Date
  /** Suggested recovery actions */
  recoveryActions?: string[]
}

// =============================================================================
// REACT QUERY INTEGRATION TYPES
// =============================================================================

/**
 * License check query data structure for React Query
 */
export interface LicenseCheckQueryData {
  /** License check response */
  response: CheckResponse | null
  /** Query metadata */
  meta: {
    /** Last successful check timestamp */
    lastChecked: Date
    /** Next scheduled check timestamp */
    nextCheck: Date | null
    /** Check count for this session */
    checkCount: number
    /** Cache hit indicator */
    fromCache: boolean
  }
}

/**
 * License check mutation variables for React Query
 */
export interface LicenseCheckMutationVariables {
  /** Force check flag */
  force?: boolean
  /** Custom license key to validate */
  licenseKey?: string
  /** Additional validation options */
  options?: LicenseCheckOptions
}

// =============================================================================
// FEATURE FLAG AND GATING TYPES
// =============================================================================

/**
 * Feature gate configuration based on license
 */
export interface FeatureGate {
  /** Feature identifier */
  feature: string
  /** Required license tier */
  requiredTier: LicenseTier
  /** Feature description */
  description?: string
  /** Feature availability */
  available: boolean
  /** Upgrade message for unavailable features */
  upgradeMessage?: string
  /** Upgrade URL */
  upgradeUrl?: string
}

/**
 * License-based feature availability map
 */
export interface FeatureAvailability {
  /** Database service features */
  database: {
    maxServices: number
    advancedDrivers: boolean
    customConnections: boolean
  }
  /** User management features */
  users: {
    maxUsers: number
    ssoIntegration: boolean
    advancedRoles: boolean
  }
  /** API features */
  api: {
    rateLimits: {
      requestsPerMinute: number
      requestsPerHour: number
    }
    customEndpoints: boolean
    scriptingEngine: boolean
  }
  /** Security features */
  security: {
    auditLogging: boolean
    encryption: boolean
    advancedAuth: boolean
  }
  /** Support features */
  support: {
    level: string
    channels: string[]
    responseTime: string
  }
}

// =============================================================================
// EXPORTS
// =============================================================================

// Export all types for external use
export type {
  CheckResponse,
  LicenseFeatures,
  LicenseValidation,
  LicenseMetadata,
  LicenseUsage,
  SupportInfo,
  LicenseEnvironment,
  LicenseValidationResult,
  LicenseCheckOptions,
  LicenseCheckErrorDetail,
  LicenseCheckQueryData,
  LicenseCheckMutationVariables,
  FeatureGate,
  FeatureAvailability,
}

// Export enums
export {
  LicenseStatus,
  LicenseTier,
  LicenseCheckError,
}

// Default export for convenient importing
export default CheckResponse