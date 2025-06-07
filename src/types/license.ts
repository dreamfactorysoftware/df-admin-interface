/**
 * License Management Types
 * 
 * Defines comprehensive TypeScript interfaces for license validation,
 * feature gating, and paywall functionality in the DreamFactory admin interface.
 * These types support OPEN SOURCE, SILVER, and GOLD license tiers with
 * granular feature control and validation responses.
 */

/**
 * License validation response from DreamFactory licensing server
 * Maps to the original CheckResponse interface from Angular implementation
 */
export interface LicenseCheckResponse {
  /** Whether UI features should be disabled based on license status */
  disableUi: string;
  /** Human-readable message about license status */
  msg: string;
  /** License renewal date in ISO string format */
  renewalDate: string;
  /** Numeric status code indicating license validation result */
  statusCode: string;
}

/**
 * Supported license types in DreamFactory platform
 * Determines feature availability and access control
 */
export type LicenseType = 'OPEN_SOURCE' | 'SILVER' | 'GOLD';

/**
 * Features that may be locked based on license tier
 * Maps to original Angular paywall service locked features
 */
export type LicenseFeature = 
  | 'event-scripts'
  | 'rate-limiting' 
  | 'scheduler'
  | 'reporting';

/**
 * License validation status enumeration
 */
export type LicenseStatus = 
  | 'valid'
  | 'expired'
  | 'invalid'
  | 'unknown'
  | 'checking';

/**
 * Comprehensive license information combining system config and validation
 */
export interface LicenseInfo {
  /** Current license type from system configuration */
  type: LicenseType;
  /** License key from system configuration (may be boolean for OPEN_SOURCE) */
  key: string | boolean;
  /** Current validation status */
  status: LicenseStatus;
  /** Validation response from license server (if available) */
  checkResponse?: LicenseCheckResponse;
  /** Whether this is a trial license */
  isTrial: boolean;
  /** Whether this is a hosted DreamFactory instance */
  isHosted: boolean;
  /** Platform version information */
  version?: string;
}

/**
 * Feature availability information for UI components
 */
export interface FeatureAvailability {
  /** Whether the feature is available for current license */
  isAvailable: boolean;
  /** Whether the feature should show a paywall prompt */
  requiresUpgrade: boolean;
  /** Minimum license tier required for this feature */
  minimumTier: LicenseType;
  /** Human-readable reason if feature is not available */
  reason?: string;
}

/**
 * Paywall activation result
 */
export interface PaywallResult {
  /** Whether paywall should be shown */
  shouldShowPaywall: boolean;
  /** Resource that triggered paywall check */
  resource?: string;
  /** Available system resources */
  availableResources: string[];
}

/**
 * Configuration for license checking behavior
 */
export interface LicenseCheckConfig {
  /** TTL for license cache in milliseconds */
  cacheTTL?: number;
  /** Whether to automatically revalidate license in background */
  backgroundRevalidation?: boolean;
  /** Retry configuration for failed license checks */
  retryConfig?: {
    attempts: number;
    delayMs: number;
  };
}

/**
 * License error types for error handling
 */
export interface LicenseError {
  /** Error type classification */
  type: 'network' | 'validation' | 'expired' | 'invalid' | 'unknown';
  /** Error message */
  message: string;
  /** Original error details */
  details?: any;
  /** Whether error is recoverable */
  recoverable: boolean;
}

/**
 * Hook return interface for use-license
 */
export interface UseLicenseReturn {
  /** Current license information */
  license: LicenseInfo | null;
  /** Loading state for license checks */
  isLoading: boolean;
  /** Error state */
  error: LicenseError | null;
  /** Whether data is being fetched in background */
  isFetching: boolean;
  /** Check if a feature is available */
  isFeatureAvailable: (feature: LicenseFeature) => FeatureAvailability;
  /** Check if a route/feature should be locked */
  isFeatureLocked: (route: string) => boolean;
  /** Activate paywall for specific resources */
  activatePaywall: (resource?: string | string[]) => Promise<PaywallResult>;
  /** Manually validate license key */
  validateLicense: (licenseKey: string) => Promise<LicenseCheckResponse>;
  /** Refresh license information */
  refresh: () => Promise<void>;
  /** Clear license cache */
  clearCache: () => void;
}

export default UseLicenseReturn;