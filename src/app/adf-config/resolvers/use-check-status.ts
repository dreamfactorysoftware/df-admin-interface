/**
 * React Query-based license status check hook for ADF configuration
 * 
 * This hook replaces the Angular checkStatusResolver by implementing React Query's
 * useQuery with environment-based conditional logic, license key validation, and 
 * fallback handling. Provides type-safe CheckResponse | null return type while 
 * maintaining the original license validation patterns and null fallback behavior.
 * 
 * Features:
 * - TanStack React Query 5.0.0 for intelligent caching and conditional data fetching
 * - Cache hit responses under 50ms per React/Next.js Integration Requirements
 * - Conditional license checking based on environment platform configuration
 * - Null fallback for open-source and development modes
 * - Type-safe CheckResponse interface implementation
 * - Error handling with graceful degradation
 * 
 * @fileoverview Platform license status validation hook
 * @version 1.0.0
 * @since React 19.0.0 / Next.js 15.1+
 */

import { useQuery } from '@tanstack/react-query';
import { apiGet } from '../../../lib/api-client';
import type { CheckResponse } from '../../../types/check';
import { getEnvironment } from '../../../lib/environment';

// ============================================================================
// Query Keys
// ============================================================================

/**
 * Query key factory for license check queries
 */
export const checkStatusQueryKeys = {
  all: ['check-status'] as const,
  license: (licenseKey: string) => ['check-status', 'license', licenseKey] as const,
} as const;

// ============================================================================
// API Functions
// ============================================================================

/**
 * Fetch license check status from DreamFactory Core API
 * 
 * @param licenseKey - The license key to validate
 * @returns Promise resolving to license check response
 */
async function fetchLicenseStatus(licenseKey: string): Promise<CheckResponse> {
  try {
    // Make API call to license check endpoint
    // This endpoint validates the license key and returns status information
    const response = await apiGet<CheckResponse>('/api/v2/system/license/check', {
      additionalParams: [
        { key: 'license_key', value: licenseKey }
      ],
      // Enable caching for optimal performance
      includeCacheControl: true,
      // Reduce loading spinner for background checks
      showSpinner: false,
    });

    return response;
  } catch (error) {
    // Log error for debugging but don't expose sensitive information
    console.warn('License check failed:', error instanceof Error ? error.message : 'Unknown error');
    
    // Return a safe fallback response indicating check failure
    return {
      disableUi: 'false',
      msg: 'License check temporarily unavailable',
      renewalDate: '',
      statusCode: 'ERROR',
    };
  }
}

// ============================================================================
// Hook Implementation
// ============================================================================

/**
 * Hook options for configuring license check behavior
 */
export interface UseCheckStatusOptions {
  /**
   * Whether to enable the license check query
   * @default true
   */
  enabled?: boolean;
  
  /**
   * Custom stale time in milliseconds
   * @default 300000 (5 minutes)
   */
  staleTime?: number;
  
  /**
   * Custom cache time in milliseconds  
   * @default 600000 (10 minutes)
   */
  cacheTime?: number;
}

/**
 * React Query hook for platform license status validation
 * 
 * Implements conditional license checking logic that:
 * 1. Fetches environment configuration
 * 2. Checks if platform.license !== 'OPEN SOURCE' and licenseKey exists
 * 3. Conditionally executes license validation via React Query
 * 4. Returns null for open-source/development modes
 * 5. Provides intelligent caching with sub-50ms cache responses
 * 
 * @param options - Configuration options for the hook
 * @returns React Query result with CheckResponse | null data
 */
export function useCheckStatus(options: UseCheckStatusOptions = {}) {
  const {
    enabled = true,
    staleTime = 300000, // 5 minutes
    cacheTime = 600000, // 10 minutes
  } = options;

  // Get environment configuration
  const environment = getEnvironment();
  
  // Determine if license check should be performed
  const shouldCheckLicense = Boolean(
    environment?.platform?.license &&
    environment.platform.license !== 'OPEN SOURCE' &&
    environment.platform.licenseKey &&
    environment.platform.licenseKey.trim() !== ''
  );

  // Extract license key for query key generation
  const licenseKey = environment?.platform?.licenseKey || '';

  return useQuery({
    // Query key includes license key for proper cache segmentation
    queryKey: shouldCheckLicense ? checkStatusQueryKeys.license(licenseKey) : checkStatusQueryKeys.all,
    
    // Query function - only executes when shouldCheckLicense is true
    queryFn: () => {
      if (!shouldCheckLicense) {
        // Return null immediately for open-source/development modes
        return Promise.resolve(null);
      }
      
      return fetchLicenseStatus(licenseKey);
    },
    
    // Enable query based on hook options and license check requirements
    enabled: enabled && shouldCheckLicense,
    
    // Cache configuration for optimal performance
    staleTime, // Data considered fresh for 5 minutes by default
    gcTime: cacheTime, // Cache kept for 10 minutes by default (renamed from cacheTime in v5)
    
    // Error handling - return null on error to maintain graceful degradation
    retry: (failureCount, error) => {
      // Retry up to 2 times for network errors, but not for auth/validation errors
      if (failureCount >= 2) return false;
      
      // Don't retry on client errors (4xx)
      if (error instanceof Error && error.message.includes('"status_code":4')) {
        return false;
      }
      
      return true;
    },
    
    // Exponential backoff for retries
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
    
    // Background refetch configuration
    refetchOnWindowFocus: false, // Prevent unnecessary refetches on focus
    refetchOnMount: true, // Always fetch on mount for license validation
    refetchOnReconnect: true, // Refetch when network reconnects
    
    // Placeholder data for immediate response
    placeholderData: shouldCheckLicense ? undefined : null,
    
    // Select function to transform the data
    select: (data) => {
      // Ensure null is returned for open-source modes even if query somehow executes
      if (!shouldCheckLicense) {
        return null;
      }
      return data;
    },
    
    // Meta information for debugging and monitoring
    meta: {
      feature: 'license-check',
      component: 'adf-config',
      conditional: !shouldCheckLicense,
    },
  });
}

// ============================================================================
// Hook Variants and Utilities
// ============================================================================

/**
 * Simplified hook that returns only the license check data
 * 
 * @param options - Configuration options
 * @returns CheckResponse | null | undefined
 */
export function useCheckStatusData(options?: UseCheckStatusOptions): CheckResponse | null | undefined {
  const { data } = useCheckStatus(options);
  return data;
}

/**
 * Hook that returns a boolean indicating if the license is valid
 * 
 * @param options - Configuration options  
 * @returns boolean indicating license validity
 */
export function useIsLicenseValid(options?: UseCheckStatusOptions): boolean {
  const { data, isLoading, isError } = useCheckStatus(options);
  
  // If loading or error, assume invalid for security
  if (isLoading || isError) return false;
  
  // If data is null (open source mode), consider valid
  if (data === null) return true;
  
  // Check if license status indicates validity
  return data.statusCode === 'SUCCESS' || data.statusCode === 'VALID';
}

/**
 * Hook that returns license renewal information
 * 
 * @param options - Configuration options
 * @returns Object with renewal date and days until renewal
 */
export function useLicenseRenewal(options?: UseCheckStatusOptions) {
  const { data } = useCheckStatus(options);
  
  if (!data?.renewalDate) {
    return {
      renewalDate: null,
      daysUntilRenewal: null,
      isExpiringSoon: false,
    };
  }
  
  const renewalDate = new Date(data.renewalDate);
  const now = new Date();
  const daysUntilRenewal = Math.ceil((renewalDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  
  return {
    renewalDate,
    daysUntilRenewal,
    isExpiringSoon: daysUntilRenewal <= 30 && daysUntilRenewal > 0,
  };
}

// ============================================================================
// Default Export
// ============================================================================

export default useCheckStatus;