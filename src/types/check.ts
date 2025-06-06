/**
 * Type definitions for license check responses and related functionality
 * 
 * This file contains TypeScript interfaces and types for the DreamFactory
 * license check system, ensuring type safety across the platform license
 * validation workflow.
 * 
 * @fileoverview License check response types
 * @version 1.0.0
 * @since React 19.0.0 / Next.js 15.1+
 */

// ============================================================================
// Core License Check Types
// ============================================================================

/**
 * Response interface for license check API calls
 * 
 * Represents the structure returned by the DreamFactory Core API
 * when validating platform license status.
 */
export interface CheckResponse {
  /**
   * Whether the UI should be disabled based on license status
   * 
   * @example "true" | "false"
   */
  disableUi: string;
  
  /**
   * Human-readable message about the license status
   * 
   * @example "License is valid" | "License expired" | "Invalid license key"
   */
  msg: string;
  
  /**
   * ISO date string indicating when the license should be renewed
   * 
   * @example "2024-12-31T23:59:59Z"
   */
  renewalDate: string;
  
  /**
   * Status code indicating the result of the license check
   * 
   * @example "SUCCESS" | "ERROR" | "EXPIRED" | "INVALID"
   */
  statusCode: string;
}

// ============================================================================
// License Status Enums
// ============================================================================

/**
 * Enum for standardized license status codes
 */
export enum LicenseStatusCode {
  SUCCESS = 'SUCCESS',
  VALID = 'VALID',
  ERROR = 'ERROR',
  EXPIRED = 'EXPIRED',
  INVALID = 'INVALID',
  TRIAL = 'TRIAL',
  DEMO = 'DEMO',
}

/**
 * Enum for UI disable states
 */
export enum LicenseUiState {
  ENABLED = 'false',
  DISABLED = 'true',
}

// ============================================================================
// License Validation Types
// ============================================================================

/**
 * Extended license information for detailed validation
 */
export interface LicenseInfo extends CheckResponse {
  /**
   * License type (e.g., "ENTERPRISE", "PROFESSIONAL", "TRIAL")
   */
  licenseType?: string;
  
  /**
   * Number of allowed users for this license
   */
  userLimit?: number;
  
  /**
   * Features enabled for this license
   */
  enabledFeatures?: string[];
  
  /**
   * Whether this is a trial license
   */
  isTrial?: boolean;
  
  /**
   * Days remaining until expiration
   */
  daysRemaining?: number;
}

/**
 * License validation result with additional computed properties
 */
export interface LicenseValidationResult {
  /**
   * The raw response from the license check API
   */
  response: CheckResponse | null;
  
  /**
   * Whether the license is currently valid
   */
  isValid: boolean;
  
  /**
   * Whether the UI should be disabled
   */
  uiDisabled: boolean;
  
  /**
   * Whether the license is expiring soon (within 30 days)
   */
  isExpiringSoon: boolean;
  
  /**
   * Parsed renewal date object
   */
  renewalDate: Date | null;
  
  /**
   * Days until renewal is required
   */
  daysUntilRenewal: number | null;
  
  /**
   * Human-readable status message
   */
  statusMessage: string;
}

// ============================================================================
// Platform License Types
// ============================================================================

/**
 * Platform license configuration from environment
 */
export interface PlatformLicense {
  /**
   * License type identifier
   */
  license: string;
  
  /**
   * License key for validation
   */
  licenseKey?: string;
  
  /**
   * Whether license checking is enabled
   */
  licenseCheckEnabled?: boolean;
}

// ============================================================================
// Utility Types
// ============================================================================

/**
 * Type guard for checking if a response is a valid CheckResponse
 */
export function isCheckResponse(obj: any): obj is CheckResponse {
  return (
    obj &&
    typeof obj === 'object' &&
    typeof obj.disableUi === 'string' &&
    typeof obj.msg === 'string' &&
    typeof obj.renewalDate === 'string' &&
    typeof obj.statusCode === 'string'
  );
}

/**
 * Type guard for checking if a license is valid based on status code
 */
export function isValidLicense(response: CheckResponse | null): boolean {
  if (!response) return true; // null means open source mode, which is valid
  
  return (
    response.statusCode === LicenseStatusCode.SUCCESS ||
    response.statusCode === LicenseStatusCode.VALID ||
    response.statusCode === LicenseStatusCode.TRIAL
  );
}

/**
 * Type guard for checking if UI should be disabled
 */
export function shouldDisableUi(response: CheckResponse | null): boolean {
  if (!response) return false; // null means open source mode, UI enabled
  
  return response.disableUi === LicenseUiState.DISABLED;
}

// ============================================================================
// Default Export
// ============================================================================

export default CheckResponse;