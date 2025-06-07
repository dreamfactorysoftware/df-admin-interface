/**
 * System API Client for DreamFactory Administrative Operations
 * 
 * Provides specialized endpoints for system configuration management, environment data retrieval,
 * license validation, and administrative operations. This client replaces the Angular-based
 * DfSystemService and DfSystemConfigDataService with React-compatible patterns optimized for
 * Next.js 15.1 and React Query integration.
 * 
 * Key Features:
 * - System configuration fetching with intelligent caching
 * - Environment and system data synchronization
 * - License validation and subscription management
 * - Error handling with automatic token clearance
 * - Background refetching for configuration updates
 * - Integration with React Query for optimal performance
 * 
 * @module SystemApiClient
 * @version 1.0.0
 * @author DreamFactory Admin Interface Team
 */

import { BaseApiClient, RequestConfig } from './base-client';
import { AuthContext, AuthHeaders } from './types';
import { clearAuthToken } from './auth-client';
import type { 
  Environment, 
  System, 
  SystemInfo,
  ServerInfo,
  AuthenticationConfig,
  LicenseValidationRequest,
  LicenseValidationResponse 
} from '../../types/system';
import type { 
  LicenseInfo,
  LicenseCheckResponse,
  LicenseType,
  LicenseFeature,
  FeatureAvailability,
  PaywallResult 
} from '../../types/license';

// =============================================================================
// CONSTANTS AND CONFIGURATION
// =============================================================================

/**
 * System API endpoint paths
 */
export const SYSTEM_ENDPOINTS = {
  /** Environment configuration endpoint */
  ENVIRONMENT: '/system/environment',
  /** System resource information endpoint */
  SYSTEM: '/system/resource',
  /** System configuration endpoint */
  CONFIG: '/system/config',
  /** License validation endpoint */
  LICENSE: '/system/license',
  /** License check endpoint for validation */
  LICENSE_CHECK: '/system/license/check',
  /** System information endpoint */
  INFO: '/system',
  /** Server information endpoint */
  SERVER: '/system/server',
  /** Cache management endpoint */
  CACHE: '/system/cache',
  /** Email configuration endpoint */
  EMAIL: '/system/email',
  /** CORS configuration endpoint */
  CORS: '/system/cors',
  /** Lookup keys endpoint */
  LOOKUP_KEYS: '/system/lookup',
} as const;

/**
 * Cache keys for React Query integration
 */
export const SYSTEM_CACHE_KEYS = {
  /** Environment data cache key */
  ENVIRONMENT: ['system', 'environment'] as const,
  /** System resources cache key */
  SYSTEM: ['system', 'resource'] as const,
  /** License information cache key */
  LICENSE: ['system', 'license'] as const,
  /** License validation cache key */
  LICENSE_CHECK: ['system', 'license', 'check'] as const,
  /** System information cache key */
  INFO: ['system', 'info'] as const,
  /** Server information cache key */
  SERVER: ['system', 'server'] as const,
  /** System configuration cache key */
  CONFIG: ['system', 'config'] as const,
} as const;

/**
 * Cache TTL configuration in milliseconds
 */
export const SYSTEM_CACHE_TTL = {
  /** Environment data cache TTL (5 minutes) */
  ENVIRONMENT: 5 * 60 * 1000,
  /** System resources cache TTL (10 minutes) */
  SYSTEM: 10 * 60 * 1000,
  /** License info cache TTL (1 hour) */
  LICENSE: 60 * 60 * 1000,
  /** License validation cache TTL (30 minutes) */
  LICENSE_CHECK: 30 * 60 * 1000,
  /** System info cache TTL (1 hour) */
  INFO: 60 * 60 * 1000,
  /** Server info cache TTL (1 hour) */
  SERVER: 60 * 60 * 1000,
  /** System config cache TTL (30 minutes) */
  CONFIG: 30 * 60 * 1000,
} as const;

/**
 * Error retry configuration for system operations
 */
export const SYSTEM_RETRY_CONFIG = {
  /** Maximum retry attempts for failed requests */
  maxRetries: 2,
  /** Base delay between retries in milliseconds */
  baseDelay: 1000,
  /** Maximum delay between retries in milliseconds */
  maxDelay: 5000,
  /** Backoff factor for exponential backoff */
  backoffFactor: 2,
} as const;

// =============================================================================
// TYPE DEFINITIONS
// =============================================================================

/**
 * System client configuration interface
 */
export interface SystemClientConfig {
  /** Base API client instance */
  baseClient: BaseApiClient;
  /** Authentication context */
  authContext: AuthContext;
  /** Cache TTL overrides */
  cacheTTL?: Partial<typeof SYSTEM_CACHE_TTL>;
  /** Retry configuration overrides */
  retryConfig?: Partial<typeof SYSTEM_RETRY_CONFIG>;
  /** Enable background refetching */
  backgroundRefetch?: boolean;
  /** Error callback for token clearance */
  onAuthError?: () => void;
}

/**
 * System data response interface
 */
export interface SystemDataResponse {
  /** Environment configuration data */
  environment: Environment;
  /** System resources data */
  system: System;
  /** Timestamp when data was fetched */
  fetchedAt: number;
  /** Whether data was fetched from cache */
  fromCache: boolean;
}

/**
 * License validation result interface
 */
export interface LicenseValidationResult {
  /** License information */
  licenseInfo: LicenseInfo;
  /** Validation response from server */
  checkResponse?: LicenseCheckResponse;
  /** Feature availability map */
  featureAvailability: Record<LicenseFeature, FeatureAvailability>;
  /** Timestamp when validation was performed */
  validatedAt: number;
}

/**
 * System health check result interface
 */
export interface SystemHealthResult {
  /** Whether system is healthy */
  isHealthy: boolean;
  /** System version information */
  version: string;
  /** Server uptime in seconds */
  uptime: number;
  /** Database connectivity status */
  databaseConnected: boolean;
  /** Cache status */
  cacheEnabled: boolean;
  /** Any health check errors */
  errors: string[];
}

// =============================================================================
// SYSTEM API CLIENT CLASS
// =============================================================================

/**
 * System API client for DreamFactory administrative operations
 */
export class SystemApiClient {
  private baseClient: BaseApiClient;
  private authContext: AuthContext;
  private config: SystemClientConfig;

  /**
   * Initialize system API client
   * 
   * @param config - System client configuration
   */
  constructor(config: SystemClientConfig) {
    this.baseClient = config.baseClient;
    this.authContext = config.authContext;
    this.config = config;
  }

  /**
   * Update authentication context
   * 
   * @param authContext - Updated authentication context
   */
  updateAuthContext(authContext: Partial<AuthContext>): void {
    this.authContext = { ...this.authContext, ...authContext };
    this.baseClient.updateAuthContext(this.authContext);
  }

  // =============================================================================
  // ENVIRONMENT AND SYSTEM DATA OPERATIONS
  // =============================================================================

  /**
   * Fetch environment configuration data
   * 
   * Retrieves authentication settings, server information, and environment-specific
   * configuration. Implements intelligent caching and error handling with token
   * clearance on authentication failures.
   * 
   * @param options - Request configuration options
   * @returns Promise resolving to environment data
   */
  async fetchEnvironmentData(options: RequestConfig = {}): Promise<Environment> {
    try {
      const requestConfig: RequestConfig = {
        ...options,
        retryAttempts: this.config.retryConfig?.maxRetries ?? SYSTEM_RETRY_CONFIG.maxRetries,
        retryDelay: this.config.retryConfig?.baseDelay ?? SYSTEM_RETRY_CONFIG.baseDelay,
        suppressNotifications: true, // Handle errors manually
      };

      const response = await this.baseClient.get<Environment>(
        SYSTEM_ENDPOINTS.ENVIRONMENT,
        requestConfig
      );

      return response;
    } catch (error) {
      // Clear token on authentication failure per original service behavior
      if (this.isAuthenticationError(error)) {
        await this.handleAuthenticationError();
      }
      
      throw this.enhanceSystemError(error, 'fetchEnvironmentData');
    }
  }

  /**
   * Fetch system resource information
   * 
   * Retrieves available system resources, services, and configuration metadata.
   * Supports optional error suppression for non-critical system data.
   * 
   * @param options - Request configuration options
   * @returns Promise resolving to system resources
   */
  async fetchSystemData(options: RequestConfig = {}): Promise<System> {
    try {
      const requestConfig: RequestConfig = {
        ...options,
        retryAttempts: this.config.retryConfig?.maxRetries ?? SYSTEM_RETRY_CONFIG.maxRetries,
        retryDelay: this.config.retryConfig?.baseDelay ?? SYSTEM_RETRY_CONFIG.baseDelay,
        suppressNotifications: true,
        additionalHeaders: [
          { key: 'skip-error', value: 'true' } // Suppress error notifications
        ],
      };

      const response = await this.baseClient.get<System>(
        SYSTEM_ENDPOINTS.SYSTEM,
        requestConfig
      );

      return response;
    } catch (error) {
      // System data errors are non-critical, log but don't throw
      console.warn('System data fetch failed:', error);
      
      return {
        resource: []
      };
    }
  }

  /**
   * Fetch combined environment and system data
   * 
   * Efficiently retrieves both environment and system data in parallel,
   * implementing proper error handling and caching strategies.
   * 
   * @param options - Request configuration options
   * @returns Promise resolving to combined system data
   */
  async fetchSystemDataCombined(options: RequestConfig = {}): Promise<SystemDataResponse> {
    const startTime = Date.now();

    try {
      // Fetch both environment and system data in parallel
      const [environment, system] = await Promise.allSettled([
        this.fetchEnvironmentData(options),
        this.fetchSystemData(options)
      ]);

      const environmentData = environment.status === 'fulfilled' 
        ? environment.value 
        : {
            authentication: {
              allowOpenRegistration: false,
              openRegEmailServiceId: 0,
              allowForeverSessions: false,
              loginAttribute: 'email',
              adldap: [],
              oauth: [],
              saml: [],
            },
            server: {
              host: '',
              machine: '',
              release: '',
              serverOs: '',
              version: '',
            },
          };

      const systemData = system.status === 'fulfilled' 
        ? system.value 
        : { resource: [] };

      return {
        environment: environmentData,
        system: systemData,
        fetchedAt: startTime,
        fromCache: false, // This would be determined by React Query
      };
    } catch (error) {
      throw this.enhanceSystemError(error, 'fetchSystemDataCombined');
    }
  }

  // =============================================================================
  // SYSTEM CONFIGURATION OPERATIONS
  // =============================================================================

  /**
   * Get system information
   * 
   * @param options - Request configuration options
   * @returns Promise resolving to system information
   */
  async getSystemInfo(options: RequestConfig = {}): Promise<SystemInfo> {
    try {
      const response = await this.baseClient.get<SystemInfo>(
        SYSTEM_ENDPOINTS.INFO,
        options
      );

      return response;
    } catch (error) {
      throw this.enhanceSystemError(error, 'getSystemInfo');
    }
  }

  /**
   * Get server information
   * 
   * @param options - Request configuration options
   * @returns Promise resolving to server information
   */
  async getServerInfo(options: RequestConfig = {}): Promise<ServerInfo> {
    try {
      const response = await this.baseClient.get<ServerInfo>(
        SYSTEM_ENDPOINTS.SERVER,
        options
      );

      return response;
    } catch (error) {
      throw this.enhanceSystemError(error, 'getServerInfo');
    }
  }

  /**
   * Update system configuration
   * 
   * @param config - Configuration updates
   * @param options - Request configuration options
   * @returns Promise resolving to updated configuration
   */
  async updateSystemConfig(
    config: Partial<SystemInfo>, 
    options: RequestConfig = {}
  ): Promise<SystemInfo> {
    try {
      const response = await this.baseClient.put<SystemInfo>(
        SYSTEM_ENDPOINTS.CONFIG,
        config,
        options
      );

      return response;
    } catch (error) {
      throw this.enhanceSystemError(error, 'updateSystemConfig');
    }
  }

  // =============================================================================
  // LICENSE VALIDATION AND MANAGEMENT
  // =============================================================================

  /**
   * Validate license key
   * 
   * Performs license validation against DreamFactory licensing server,
   * including feature availability determination and paywall configuration.
   * 
   * @param licenseKey - License key to validate
   * @param options - Request configuration options
   * @returns Promise resolving to license validation response
   */
  async validateLicense(
    licenseKey: string, 
    options: RequestConfig = {}
  ): Promise<LicenseCheckResponse> {
    try {
      const validationRequest: LicenseValidationRequest = {
        license_key: licenseKey,
      };

      const response = await this.baseClient.post<LicenseCheckResponse>(
        SYSTEM_ENDPOINTS.LICENSE_CHECK,
        validationRequest,
        {
          ...options,
          suppressNotifications: true,
        }
      );

      return response;
    } catch (error) {
      throw this.enhanceSystemError(error, 'validateLicense');
    }
  }

  /**
   * Get current license information
   * 
   * Retrieves comprehensive license information including status, features,
   * and subscription details for paywall and feature gating functionality.
   * 
   * @param options - Request configuration options
   * @returns Promise resolving to license information
   */
  async getLicenseInfo(options: RequestConfig = {}): Promise<LicenseValidationResult> {
    try {
      // Fetch both environment (for license key) and license validation
      const environment = await this.fetchEnvironmentData(options);
      
      let licenseInfo: LicenseInfo;
      let checkResponse: LicenseCheckResponse | undefined;
      
      // Determine license type and perform validation if needed
      if (typeof environment.license === 'string' && environment.license) {
        // Commercial license - validate with server
        try {
          checkResponse = await this.validateLicense(environment.license, options);
          
          licenseInfo = {
            type: this.determineLicenseType(environment.license, checkResponse),
            key: environment.license,
            status: this.determineLicenseStatus(checkResponse),
            checkResponse,
            isTrial: this.isTrialLicense(checkResponse),
            isHosted: environment.server?.hosted === true,
            version: environment.server?.version,
          };
        } catch (error) {
          // License validation failed
          licenseInfo = {
            type: 'OPEN_SOURCE',
            key: environment.license,
            status: 'invalid',
            isTrial: false,
            isHosted: environment.server?.hosted === true,
            version: environment.server?.version,
          };
        }
      } else {
        // Open source license
        licenseInfo = {
          type: 'OPEN_SOURCE',
          key: environment.license || false,
          status: 'valid',
          isTrial: false,
          isHosted: environment.server?.hosted === true,
          version: environment.server?.version,
        };
      }

      // Calculate feature availability
      const featureAvailability = this.calculateFeatureAvailability(licenseInfo);

      return {
        licenseInfo,
        checkResponse,
        featureAvailability,
        validatedAt: Date.now(),
      };
    } catch (error) {
      throw this.enhanceSystemError(error, 'getLicenseInfo');
    }
  }

  /**
   * Check feature availability based on license
   * 
   * @param feature - Feature to check
   * @param licenseInfo - Optional license info (will fetch if not provided)
   * @returns Promise resolving to feature availability
   */
  async isFeatureAvailable(
    feature: LicenseFeature,
    licenseInfo?: LicenseInfo
  ): Promise<FeatureAvailability> {
    try {
      if (!licenseInfo) {
        const validation = await this.getLicenseInfo();
        licenseInfo = validation.licenseInfo;
      }

      const featureAvailability = this.calculateFeatureAvailability(licenseInfo);
      return featureAvailability[feature];
    } catch (error) {
      // On error, assume feature is not available
      return {
        isAvailable: false,
        requiresUpgrade: true,
        minimumTier: 'SILVER',
        reason: 'License validation failed',
      };
    }
  }

  /**
   * Activate paywall for specific resources
   * 
   * @param resources - Resources to check for paywall activation
   * @param licenseInfo - Optional license info
   * @returns Promise resolving to paywall activation result
   */
  async activatePaywall(
    resources?: string | string[],
    licenseInfo?: LicenseInfo
  ): Promise<PaywallResult> {
    try {
      if (!licenseInfo) {
        const validation = await this.getLicenseInfo();
        licenseInfo = validation.licenseInfo;
      }

      const resourceArray = Array.isArray(resources) 
        ? resources 
        : resources 
          ? [resources] 
          : [];

      // For open source license, show paywall for premium features
      const shouldShow = licenseInfo.type === 'OPEN_SOURCE' && 
        resourceArray.length > 0;

      return {
        shouldShowPaywall: shouldShow,
        resource: Array.isArray(resources) ? undefined : resources,
        availableResources: this.getAvailableResourcesForLicense(licenseInfo),
      };
    } catch (error) {
      // On error, be conservative and show paywall
      return {
        shouldShowPaywall: true,
        resource: Array.isArray(resources) ? undefined : resources,
        availableResources: [],
      };
    }
  }

  // =============================================================================
  // CACHE MANAGEMENT OPERATIONS
  // =============================================================================

  /**
   * Clear system cache
   * 
   * @param cacheType - Type of cache to clear (optional)
   * @param options - Request configuration options
   * @returns Promise resolving when cache is cleared
   */
  async clearSystemCache(
    cacheType?: string,
    options: RequestConfig = {}
  ): Promise<void> {
    try {
      const endpoint = cacheType 
        ? `${SYSTEM_ENDPOINTS.CACHE}/${cacheType}`
        : SYSTEM_ENDPOINTS.CACHE;

      await this.baseClient.delete(endpoint, options);
    } catch (error) {
      throw this.enhanceSystemError(error, 'clearSystemCache');
    }
  }

  /**
   * Get cache status
   * 
   * @param options - Request configuration options
   * @returns Promise resolving to cache status
   */
  async getCacheStatus(options: RequestConfig = {}): Promise<any> {
    try {
      const response = await this.baseClient.get(SYSTEM_ENDPOINTS.CACHE, options);
      return response;
    } catch (error) {
      throw this.enhanceSystemError(error, 'getCacheStatus');
    }
  }

  // =============================================================================
  // SYSTEM HEALTH AND MONITORING
  // =============================================================================

  /**
   * Perform system health check
   * 
   * @param options - Request configuration options
   * @returns Promise resolving to health check result
   */
  async performHealthCheck(options: RequestConfig = {}): Promise<SystemHealthResult> {
    try {
      const [systemInfo, serverInfo] = await Promise.allSettled([
        this.getSystemInfo(options),
        this.getServerInfo(options)
      ]);

      const errors: string[] = [];
      
      if (systemInfo.status === 'rejected') {
        errors.push(`System info check failed: ${systemInfo.reason}`);
      }
      
      if (serverInfo.status === 'rejected') {
        errors.push(`Server info check failed: ${serverInfo.reason}`);
      }

      const systemData = systemInfo.status === 'fulfilled' ? systemInfo.value : null;
      const serverData = serverInfo.status === 'fulfilled' ? serverInfo.value : null;

      return {
        isHealthy: errors.length === 0,
        version: serverData?.version || systemData?.version || 'unknown',
        uptime: serverData?.uptime || 0,
        databaseConnected: systemData?.database?.connected !== false,
        cacheEnabled: systemData?.cache?.enabled !== false,
        errors,
      };
    } catch (error) {
      return {
        isHealthy: false,
        version: 'unknown',
        uptime: 0,
        databaseConnected: false,
        cacheEnabled: false,
        errors: [String(error)],
      };
    }
  }

  // =============================================================================
  // PRIVATE HELPER METHODS
  // =============================================================================

  /**
   * Check if error is an authentication error
   * 
   * @param error - Error to check
   * @returns True if authentication error
   */
  private isAuthenticationError(error: any): boolean {
    return error?.status === 401 || 
           error?.status === 403 ||
           error?.message?.includes('unauthorized') ||
           error?.message?.includes('forbidden');
  }

  /**
   * Handle authentication error by clearing tokens
   */
  private async handleAuthenticationError(): Promise<void> {
    try {
      await clearAuthToken();
      if (this.config.onAuthError) {
        this.config.onAuthError();
      }
    } catch (error) {
      console.error('Failed to clear authentication token:', error);
    }
  }

  /**
   * Enhance system-specific errors with context
   * 
   * @param error - Original error
   * @param operation - Operation that failed
   * @returns Enhanced error with system context
   */
  private enhanceSystemError(error: any, operation: string): Error {
    const enhancedError = new Error(
      `System operation '${operation}' failed: ${error.message || error}`
    );
    
    // Preserve original error properties
    Object.assign(enhancedError, error);
    
    return enhancedError;
  }

  /**
   * Determine license type from validation response
   * 
   * @param licenseKey - License key
   * @param checkResponse - Validation response
   * @returns License type
   */
  private determineLicenseType(
    licenseKey: string, 
    checkResponse?: LicenseCheckResponse
  ): LicenseType {
    if (!licenseKey || licenseKey === 'false') {
      return 'OPEN_SOURCE';
    }

    // Analyze validation response to determine tier
    if (checkResponse?.statusCode === '200' || checkResponse?.statusCode === 'valid') {
      // Could analyze license features to determine SILVER vs GOLD
      // For now, assume SILVER for valid commercial licenses
      return 'SILVER';
    }

    return 'OPEN_SOURCE';
  }

  /**
   * Determine license status from validation response
   * 
   * @param checkResponse - Validation response
   * @returns License status
   */
  private determineLicenseStatus(checkResponse?: LicenseCheckResponse) {
    if (!checkResponse) {
      return 'unknown' as const;
    }

    switch (checkResponse.statusCode) {
      case '200':
      case 'valid':
        return 'valid' as const;
      case 'expired':
        return 'expired' as const;
      case 'invalid':
        return 'invalid' as const;
      default:
        return 'unknown' as const;
    }
  }

  /**
   * Check if license is a trial license
   * 
   * @param checkResponse - Validation response
   * @returns True if trial license
   */
  private isTrialLicense(checkResponse?: LicenseCheckResponse): boolean {
    return checkResponse?.msg?.toLowerCase().includes('trial') || false;
  }

  /**
   * Calculate feature availability based on license
   * 
   * @param licenseInfo - License information
   * @returns Feature availability map
   */
  private calculateFeatureAvailability(
    licenseInfo: LicenseInfo
  ): Record<LicenseFeature, FeatureAvailability> {
    const features: LicenseFeature[] = [
      'event-scripts',
      'rate-limiting',
      'scheduler',
      'reporting'
    ];

    const availability: Record<LicenseFeature, FeatureAvailability> = {} as any;

    features.forEach(feature => {
      const isAvailable = this.isFeatureAvailableForLicense(feature, licenseInfo);
      const minimumTier = this.getMinimumTierForFeature(feature);

      availability[feature] = {
        isAvailable,
        requiresUpgrade: !isAvailable && licenseInfo.type === 'OPEN_SOURCE',
        minimumTier,
        reason: isAvailable ? undefined : `Requires ${minimumTier} license or higher`,
      };
    });

    return availability;
  }

  /**
   * Check if feature is available for given license
   * 
   * @param feature - Feature to check
   * @param licenseInfo - License information
   * @returns True if feature is available
   */
  private isFeatureAvailableForLicense(
    feature: LicenseFeature, 
    licenseInfo: LicenseInfo
  ): boolean {
    // Open source features are always available
    if (licenseInfo.type === 'OPEN_SOURCE') {
      return false; // Premium features not available in open source
    }

    // All features available in SILVER and GOLD
    return licenseInfo.status === 'valid';
  }

  /**
   * Get minimum license tier required for feature
   * 
   * @param feature - Feature to check
   * @returns Minimum required license tier
   */
  private getMinimumTierForFeature(feature: LicenseFeature): LicenseType {
    // All premium features require at least SILVER license
    return 'SILVER';
  }

  /**
   * Get available resources for license type
   * 
   * @param licenseInfo - License information
   * @returns Array of available resource names
   */
  private getAvailableResourcesForLicense(licenseInfo: LicenseInfo): string[] {
    const baseResources = ['database', 'api-docs', 'users', 'roles'];
    
    if (licenseInfo.type === 'OPEN_SOURCE') {
      return baseResources;
    }

    // Add premium resources for commercial licenses
    return [
      ...baseResources,
      'event-scripts',
      'rate-limiting',
      'scheduler',
      'reporting',
      'advanced-caching',
    ];
  }
}

// =============================================================================
// FACTORY FUNCTIONS AND UTILITIES
// =============================================================================

/**
 * Create a new SystemApiClient instance
 * 
 * @param baseClient - Base API client instance
 * @param authContext - Authentication context
 * @param config - Optional configuration overrides
 * @returns SystemApiClient instance
 */
export function createSystemClient(
  baseClient: BaseApiClient,
  authContext: AuthContext,
  config?: Partial<Omit<SystemClientConfig, 'baseClient' | 'authContext'>>
): SystemApiClient {
  return new SystemApiClient({
    baseClient,
    authContext,
    ...config,
  });
}

/**
 * React Query cache key generators for system operations
 */
export const systemCacheKeys = {
  /**
   * Generate cache key for environment data
   */
  environment: () => SYSTEM_CACHE_KEYS.ENVIRONMENT,
  
  /**
   * Generate cache key for system resources
   */
  system: () => SYSTEM_CACHE_KEYS.SYSTEM,
  
  /**
   * Generate cache key for license information
   */
  license: () => SYSTEM_CACHE_KEYS.LICENSE,
  
  /**
   * Generate cache key for license validation
   */
  licenseCheck: (licenseKey?: string) => 
    licenseKey 
      ? [...SYSTEM_CACHE_KEYS.LICENSE_CHECK, licenseKey] 
      : SYSTEM_CACHE_KEYS.LICENSE_CHECK,
  
  /**
   * Generate cache key for system information
   */
  info: () => SYSTEM_CACHE_KEYS.INFO,
  
  /**
   * Generate cache key for server information
   */
  server: () => SYSTEM_CACHE_KEYS.SERVER,
  
  /**
   * Generate cache key for system configuration
   */
  config: () => SYSTEM_CACHE_KEYS.CONFIG,
};

// =============================================================================
// EXPORTS
// =============================================================================

export {
  // Main class
  SystemApiClient,
  
  // Factory function
  createSystemClient,
  
  // Cache utilities
  systemCacheKeys,
  
  // Constants
  SYSTEM_ENDPOINTS,
  SYSTEM_CACHE_KEYS,
  SYSTEM_CACHE_TTL,
  SYSTEM_RETRY_CONFIG,
  
  // Types
  type SystemClientConfig,
  type SystemDataResponse,
  type LicenseValidationResult,
  type SystemHealthResult,
};

export default SystemApiClient;