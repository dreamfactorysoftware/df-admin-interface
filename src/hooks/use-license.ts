'use client';

import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useCallback, useMemo } from 'react';
import { apiClient } from '@/lib/api-client';
import { useSystemConfig } from '@/hooks/use-system-config';

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

// License response interface transformed from snake_case to camelCase
export interface LicenseCheckResponse {
  disableUi: string;
  msg: string;
  renewalDate: string;
  statusCode: string;
  features?: string[];
  maxDatabases?: number;
  maxServices?: number;
  maxUsers?: number;
  licenseType?: 'trial' | 'professional' | 'enterprise' | 'opensource';
  expirationDate?: string;
  isValid?: boolean;
}

// License status derived from API response
export interface LicenseStatus {
  isValid: boolean;
  isPaid: boolean;
  isExpired: boolean;
  isOpenSource: boolean;
  licenseType: 'trial' | 'professional' | 'enterprise' | 'opensource';
  statusCode: string;
  message: string;
  renewalDate?: string;
  expirationDate?: string;
  features: string[];
  limits: {
    maxDatabases?: number;
    maxServices?: number;
    maxUsers?: number;
  };
}

// Feature check result
export interface FeatureCheckResult {
  hasAccess: boolean;
  reason?: string;
  alternativeFeature?: string;
}

// License query key factory
const licenseKeys = {
  all: ['license'] as const,
  check: (licenseKey?: string) => [...licenseKeys.all, 'check', licenseKey] as const,
  features: () => [...licenseKeys.all, 'features'] as const,
  status: () => [...licenseKeys.all, 'status'] as const,
};

/**
 * Transform snake_case license response to camelCase application format
 */
function transformLicenseResponse(response: any): LicenseCheckResponse {
  if (!response) return response;
  
  // Helper function to convert snake_case to camelCase
  const snakeToCamel = (str: string): string => 
    str.replace(/([-_]\w)/g, g => g[1].toUpperCase());
  
  // Transform object keys from snake_case to camelCase
  const transformKeys = (obj: any): any => {
    if (Array.isArray(obj)) {
      return obj.map(item => transformKeys(item));
    } else if (typeof obj === 'object' && obj !== null) {
      const newObj: Record<string, any> = {};
      for (const key in obj) {
        if (Object.prototype.hasOwnProperty.call(obj, key)) {
          newObj[snakeToCamel(key)] = transformKeys(obj[key]);
        }
      }
      return newObj;
    }
    return obj;
  };
  
  return transformKeys(response) as LicenseCheckResponse;
}

/**
 * Derive license status from API response
 */
function deriveLicenseStatus(response: LicenseCheckResponse): LicenseStatus {
  const statusCode = response.statusCode || '404';
  const isValid = statusCode === '200' || statusCode === '201';
  const isPaid = isValid && response.licenseType !== 'opensource';
  const isExpired = statusCode === '402' || statusCode === '403';
  const isOpenSource = !isValid || response.licenseType === 'opensource';
  
  return {
    isValid,
    isPaid,
    isExpired,
    isOpenSource,
    licenseType: response.licenseType || 'opensource',
    statusCode,
    message: response.msg || 'No license information available',
    renewalDate: response.renewalDate,
    expirationDate: response.expirationDate,
    features: response.features || [],
    limits: {
      maxDatabases: response.maxDatabases,
      maxServices: response.maxServices,
      maxUsers: response.maxUsers,
    },
  };
}

/**
 * Main license management hook
 */
export function useLicense() {
  const queryClient = useQueryClient();
  const { data: systemConfig } = useSystemConfig();
  
  // Get license key from system configuration
  const licenseKey = systemConfig?.licenseKey;
  
  // License validation query with automatic background checking
  const licenseQuery = useQuery({
    queryKey: licenseKeys.check(licenseKey),
    queryFn: async () => {
      if (!licenseKey) {
        // Return default open-source license status when no key is configured
        return {
          disableUi: 'false',
          msg: 'Open source license active',
          renewalDate: '',
          statusCode: '404',
          licenseType: 'opensource' as const,
          isValid: false,
          features: [],
        } satisfies LicenseCheckResponse;
      }
      
      try {
        // Make license validation request to DreamFactory updates server
        const response = await apiClient.get('https://updates.dreamfactory.com/check', {
          headers: {
            'X-DreamFactory-License-Key': licenseKey,
          },
        });
        
        return transformLicenseResponse(response);
      } catch (error: any) {
        // Handle license validation errors with fallback to error response
        const errorResponse = error?.response?.data || {};
        return transformLicenseResponse({
          disableUi: 'false',
          msg: errorResponse.msg || 'License validation failed',
          renewalDate: '',
          statusCode: error?.response?.status?.toString() || '500',
          licenseType: 'opensource',
          isValid: false,
          features: [],
          ...errorResponse,
        });
      }
    },
    enabled: true, // Always enabled to check for license key changes
    staleTime: 5 * 60 * 1000, // 5 minutes
    cacheTime: 10 * 60 * 1000, // 10 minutes
    refetchInterval: 15 * 60 * 1000, // 15 minutes for automatic renewal checking
    refetchIntervalInBackground: true, // Continue checking in background
    refetchOnWindowFocus: true, // Revalidate when user returns to app
    refetchOnReconnect: true, // Revalidate when network reconnects
    retry: (failureCount, error: any) => {
      // Don't retry for 404 (no license) or 403 (expired license)
      const status = error?.response?.status;
      if (status === 404 || status === 403) return false;
      
      // Retry other errors up to 3 times with exponential backoff
      return failureCount < 3;
    },
    retryDelay: attemptIndex => Math.min(1000 * 2 ** attemptIndex, 30000),
  });
  
  // Derive license status from query result
  const licenseStatus = useMemo((): LicenseStatus => {
    if (!licenseQuery.data) {
      return {
        isValid: false,
        isPaid: false,
        isExpired: false,
        isOpenSource: true,
        licenseType: 'opensource',
        statusCode: '404',
        message: 'No license data available',
        features: [],
        limits: {},
      };
    }
    
    return deriveLicenseStatus(licenseQuery.data);
  }, [licenseQuery.data]);
  
  // Feature checking function with proper feature flag integration
  const hasFeature = useCallback((featureName: string): FeatureCheckResult => {
    if (!licenseStatus.isValid) {
      return {
        hasAccess: false,
        reason: 'License is not valid or active',
        alternativeFeature: 'opensource',
      };
    }
    
    if (licenseStatus.isOpenSource) {
      // Define open source available features
      const openSourceFeatures = [
        'database-connections',
        'basic-api-generation',
        'user-management',
        'basic-authentication',
        'basic-schema-discovery',
      ];
      
      return {
        hasAccess: openSourceFeatures.includes(featureName),
        reason: openSourceFeatures.includes(featureName) 
          ? undefined 
          : 'Feature requires paid license',
        alternativeFeature: 'opensource',
      };
    }
    
    // Check if feature is included in license
    const hasFeatureAccess = licenseStatus.features.includes(featureName) ||
      licenseStatus.features.includes('*') || // Full access
      licenseStatus.licenseType === 'enterprise'; // Enterprise has all features
    
    return {
      hasAccess: hasFeatureAccess,
      reason: hasFeatureAccess ? undefined : 'Feature not included in current license',
    };
  }, [licenseStatus]);
  
  // Check if user is within usage limits
  const isWithinLimits = useCallback((resourceType: keyof LicenseStatus['limits'], currentCount: number): boolean => {
    const limit = licenseStatus.limits[resourceType];
    if (limit === undefined) return true; // No limit set
    return currentCount < limit;
  }, [licenseStatus.limits]);
  
  // Force license refresh
  const refreshLicense = useCallback(() => {
    return queryClient.invalidateQueries(licenseKeys.check(licenseKey));
  }, [queryClient, licenseKey]);
  
  // Clear license cache (useful for logout or license key changes)
  const clearLicenseCache = useCallback(() => {
    queryClient.removeQueries(licenseKeys.all);
  }, [queryClient]);
  
  // Check if license requires renewal soon (within 30 days)
  const needsRenewal = useMemo(() => {
    if (!licenseStatus.renewalDate) return false;
    
    try {
      const renewalDate = new Date(licenseStatus.renewalDate);
      const thirtyDaysFromNow = new Date();
      thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);
      
      return renewalDate <= thirtyDaysFromNow;
    } catch {
      return false;
    }
  }, [licenseStatus.renewalDate]);
  
  // Check if license has expired
  const isExpired = useMemo(() => {
    if (!licenseStatus.expirationDate) return false;
    
    try {
      const expirationDate = new Date(licenseStatus.expirationDate);
      const now = new Date();
      
      return expirationDate <= now;
    } catch {
      return licenseStatus.isExpired;
    }
  }, [licenseStatus.expirationDate, licenseStatus.isExpired]);
  
  return {
    // Core license data
    license: licenseQuery.data,
    licenseStatus,
    
    // Query state
    isLoading: licenseQuery.isLoading,
    isError: licenseQuery.isError,
    error: licenseQuery.error,
    isValidating: licenseQuery.isFetching,
    
    // License validation states
    isValid: licenseStatus.isValid,
    isPaid: licenseStatus.isPaid,
    isOpenSource: licenseStatus.isOpenSource,
    needsRenewal,
    isExpired,
    
    // License information
    licenseType: licenseStatus.licenseType,
    statusCode: licenseStatus.statusCode,
    message: licenseStatus.message,
    renewalDate: licenseStatus.renewalDate,
    expirationDate: licenseStatus.expirationDate,
    features: licenseStatus.features,
    limits: licenseStatus.limits,
    
    // Feature checking functions
    hasFeature,
    isWithinLimits,
    
    // Control functions
    refreshLicense,
    clearLicenseCache,
  };
}

/**
 * Hook for checking specific features with paywall integration
 */
export function useLicenseFeature(featureName: string) {
  const { hasFeature, licenseStatus, isLoading } = useLicense();
  
  const featureCheck = useMemo(() => {
    if (isLoading) {
      return {
        hasAccess: false,
        isLoading: true,
        reason: 'Checking license...',
      };
    }
    
    return {
      ...hasFeature(featureName),
      isLoading: false,
    };
  }, [hasFeature, featureName, isLoading]);
  
  return {
    ...featureCheck,
    licenseType: licenseStatus.licenseType,
    isOpenSource: licenseStatus.isOpenSource,
    isPaid: licenseStatus.isPaid,
  };
}

/**
 * Hook for license status monitoring with specific intervals
 */
export function useLicenseMonitoring(refreshInterval?: number) {
  const queryClient = useQueryClient();
  const { data: systemConfig } = useSystemConfig();
  const licenseKey = systemConfig?.licenseKey;
  
  // Override default refresh interval if specified
  const monitoringQuery = useQuery({
    queryKey: licenseKeys.check(licenseKey),
    queryFn: async () => {
      if (!licenseKey) return null;
      
      try {
        const response = await apiClient.get('https://updates.dreamfactory.com/check', {
          headers: {
            'X-DreamFactory-License-Key': licenseKey,
          },
        });
        
        return transformLicenseResponse(response);
      } catch (error: any) {
        const errorResponse = error?.response?.data || {};
        return transformLicenseResponse({
          disableUi: 'false',
          msg: errorResponse.msg || 'License validation failed',
          renewalDate: '',
          statusCode: error?.response?.status?.toString() || '500',
          licenseType: 'opensource',
          isValid: false,
          features: [],
          ...errorResponse,
        });
      }
    },
    enabled: !!licenseKey && !!refreshInterval,
    refetchInterval: refreshInterval,
    refetchIntervalInBackground: true,
  });
  
  const startMonitoring = useCallback((interval: number) => {
    queryClient.setQueryDefaults(licenseKeys.check(licenseKey), {
      refetchInterval: interval,
      refetchIntervalInBackground: true,
    });
  }, [queryClient, licenseKey]);
  
  const stopMonitoring = useCallback(() => {
    queryClient.setQueryDefaults(licenseKeys.check(licenseKey), {
      refetchInterval: false,
    });
  }, [queryClient, licenseKey]);
  
  return {
    isMonitoring: !!refreshInterval && monitoringQuery.isSuccess,
    startMonitoring,
    stopMonitoring,
    lastChecked: monitoringQuery.dataUpdatedAt,
  };
}

// Export types for external use
export type { LicenseCheckResponse, LicenseStatus, FeatureCheckResult };

// Export query keys for external cache management
export { licenseKeys };