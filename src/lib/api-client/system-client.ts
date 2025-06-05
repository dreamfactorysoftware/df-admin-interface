/**
 * System API client that provides specialized endpoints for system configuration,
 * environment data, and administrative operations.
 * 
 * This client handles system-specific API calls with proper authentication, error handling,
 * and configuration management for DreamFactory system endpoints. It replaces the Angular
 * DfSystemService and DfSystemConfigDataService with React-compatible patterns optimized
 * for SWR and React Query integration.
 * 
 * Key Features:
 * - System configuration fetching with intelligent caching
 * - Environment data synchronization with background refetching
 * - License validation and subscription data management
 * - Error handling with token clearance on system configuration failures
 * - React Query and SWR compatibility for optimal data synchronization
 */

import { 
  RequestConfig, 
  SuccessResponse, 
  ErrorResponse,
  AuthHeaders,
  SWRConfig,
  ReactQueryConfig 
} from './types';

// =============================================================================
// SYSTEM API TYPES AND INTERFACES
// =============================================================================

/**
 * Environment configuration data structure
 */
export interface Environment {
  authentication: {
    allowOpenRegistration: boolean;
    openRegEmailServiceId: number;
    allowForeverSessions: boolean;
    loginAttribute: string;
    adldap: Array<any>;
    oauth: Array<any>;
    saml: Array<any>;
  };
  server: {
    host: string;
    machine: string;
    release: string;
    serverOs: string;
    version: string;
  };
  platform?: {
    bitnami?: boolean;
    docker?: boolean;
    version_current?: string;
    upgrade_available?: boolean;
  };
  config?: Record<string, any>;
  branding?: {
    name?: string;
    logo?: string;
    favicon?: string;
  };
}

/**
 * System configuration data structure
 */
export interface System {
  resource: Array<{
    name: string;
    type: string;
    group?: string;
    description?: string;
    is_active?: boolean;
    config?: Record<string, any>;
  }>;
  meta?: {
    count: number;
    schema?: Array<string>;
  };
}

/**
 * License check response structure
 */
export interface LicenseCheckResponse {
  success: boolean;
  valid: boolean;
  expired?: boolean;
  daysLeft?: number;
  plan?: string;
  features?: string[];
  limits?: {
    users?: number;
    apis?: number;
    storage?: number;
  };
  message?: string;
  error?: string;
}

/**
 * Subscription data response structure
 */
export interface SubscriptionData {
  plan: string;
  status: string;
  expirationDate?: string;
  features: string[];
  limits: {
    users: number;
    apis: number;
    storage: number;
    requests: number;
  };
  billing?: {
    interval?: string;
    amount?: number;
    currency?: string;
  };
}

/**
 * System information response structure
 */
export interface SystemInfo {
  version: string;
  host: string;
  machine: string;
  platform: {
    name: string;
    version: string;
    architecture: string;
  };
  server: {
    software: string;
    version: string;
  };
  database?: {
    driver: string;
    version: string;
  };
  cache?: {
    driver: string;
    enabled: boolean;
  };
  storage?: {
    available: number;
    total: number;
  };
}

/**
 * Configuration item structure for system settings
 */
export interface ConfigItem {
  name: string;
  value: any;
  type: string;
  description?: string;
  is_secret?: boolean;
  default_value?: any;
  validation?: {
    required?: boolean;
    min?: number;
    max?: number;
    pattern?: string;
  };
}

/**
 * System performance metrics
 */
export interface SystemMetrics {
  memory: {
    used: number;
    total: number;
    percentage: number;
  };
  cpu: {
    usage: number;
    cores: number;
  };
  disk: {
    used: number;
    total: number;
    percentage: number;
  };
  requests: {
    total: number;
    success: number;
    errors: number;
    averageResponseTime: number;
  };
  uptime: number;
  timestamp: number;
}

// =============================================================================
// SYSTEM CLIENT CONFIGURATION
// =============================================================================

/**
 * System client configuration options
 */
export interface SystemClientConfig extends RequestConfig {
  /** Base URL for system API endpoints */
  baseUrl?: string;
  /** Default authentication headers */
  defaultHeaders?: AuthHeaders;
  /** Environment data refresh interval in milliseconds (default: 30000) */
  environmentRefreshInterval?: number;
  /** System data refresh interval in milliseconds (default: 60000) */
  systemRefreshInterval?: number;
  /** License check refresh interval in milliseconds (default: 300000) */
  licenseRefreshInterval?: number;
  /** Enable automatic background synchronization */
  enableBackgroundSync?: boolean;
  /** Retry configuration for failed requests */
  retryConfig?: {
    attempts: number;
    delay: number;
    backoff: boolean;
  };
}

/**
 * SWR configuration for system data fetching
 */
export interface SystemSWRConfig extends SWRConfig {
  /** Environment data SWR options */
  environment?: Partial<SWRConfig>;
  /** System data SWR options */
  system?: Partial<SWRConfig>;
  /** License data SWR options */
  license?: Partial<SWRConfig>;
}

/**
 * React Query configuration for system data fetching
 */
export interface SystemReactQueryConfig extends ReactQueryConfig {
  /** Environment data query options */
  environment?: Partial<ReactQueryConfig>;
  /** System data query options */
  system?: Partial<ReactQueryConfig>;
  /** License data query options */
  license?: Partial<ReactQueryConfig>;
}

// =============================================================================
// SYSTEM API CLIENT IMPLEMENTATION
// =============================================================================

/**
 * System API client class for handling system configuration and environment data
 */
export class SystemClient {
  private baseUrl: string;
  private defaultHeaders: AuthHeaders;
  private config: SystemClientConfig;

  constructor(config: SystemClientConfig = {}) {
    this.baseUrl = config.baseUrl || '/api/v2';
    this.defaultHeaders = config.defaultHeaders || {};
    this.config = {
      environmentRefreshInterval: 30000, // 30 seconds
      systemRefreshInterval: 60000, // 1 minute
      licenseRefreshInterval: 300000, // 5 minutes
      enableBackgroundSync: true,
      retryConfig: {
        attempts: 3,
        delay: 1000,
        backoff: true,
      },
      ...config,
    };
  }

  // =============================================================================
  // CORE SYSTEM ENDPOINTS
  // =============================================================================

  /**
   * Generic GET request to system endpoints
   * @param endpoint - The system endpoint path
   * @param config - Request configuration options
   * @returns Promise with response data
   */
  async get<T = any>(endpoint: string, config: RequestConfig = {}): Promise<T> {
    const url = `${this.baseUrl}/system/${endpoint}`;
    const headers = {
      ...this.defaultHeaders,
      ...config.additionalHeaders?.reduce((acc, header) => {
        acc[header.key] = String(header.value);
        return acc;
      }, {} as Record<string, string>),
    };

    try {
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          ...headers,
        },
        signal: config.signal,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({
          error: {
            code: response.status,
            message: response.statusText,
            status_code: response.status,
          },
        }));
        throw new Error(JSON.stringify(errorData));
      }

      return await response.json();
    } catch (error) {
      this.handleSystemError(error, config);
      throw error;
    }
  }

  /**
   * Generic POST request to system endpoints
   * @param endpoint - The system endpoint path
   * @param data - Request payload data
   * @param config - Request configuration options
   * @returns Promise with response data
   */
  async post<T = any>(
    endpoint: string, 
    data: any, 
    config: RequestConfig = {}
  ): Promise<T> {
    const url = `${this.baseUrl}/system/${endpoint}`;
    const headers = {
      ...this.defaultHeaders,
      ...config.additionalHeaders?.reduce((acc, header) => {
        acc[header.key] = String(header.value);
        return acc;
      }, {} as Record<string, string>),
    };

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...headers,
        },
        body: JSON.stringify(data),
        signal: config.signal,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({
          error: {
            code: response.status,
            message: response.statusText,
            status_code: response.status,
          },
        }));
        throw new Error(JSON.stringify(errorData));
      }

      return await response.json();
    } catch (error) {
      this.handleSystemError(error, config);
      throw error;
    }
  }

  // =============================================================================
  // ENVIRONMENT DATA MANAGEMENT
  // =============================================================================

  /**
   * Fetch environment configuration data
   * @param config - Request configuration options
   * @returns Promise with environment data
   */
  async fetchEnvironmentData(config: RequestConfig = {}): Promise<Environment> {
    return this.get<Environment>('environment', {
      showSpinner: true,
      ...config,
    });
  }

  /**
   * Get SWR key for environment data
   * @returns SWR cache key for environment data
   */
  getEnvironmentSWRKey(): string {
    return '/api/v2/system/environment';
  }

  /**
   * Get React Query key for environment data
   * @returns React Query cache key for environment data
   */
  getEnvironmentQueryKey(): string[] {
    return ['system', 'environment'];
  }

  /**
   * Get SWR configuration for environment data fetching
   * @param customConfig - Custom SWR configuration
   * @returns SWR configuration object
   */
  getEnvironmentSWRConfig(customConfig: Partial<SWRConfig> = {}): SWRConfig {
    return {
      refreshInterval: this.config.environmentRefreshInterval,
      revalidateOnFocus: true,
      revalidateOnReconnect: true,
      dedupingInterval: 5000,
      errorRetryCount: this.config.retryConfig?.attempts || 3,
      ...customConfig,
    };
  }

  /**
   * Get React Query configuration for environment data fetching
   * @param customConfig - Custom React Query configuration
   * @returns React Query configuration object
   */
  getEnvironmentQueryConfig(customConfig: Partial<ReactQueryConfig> = {}): ReactQueryConfig {
    return {
      staleTime: this.config.environmentRefreshInterval,
      cacheTime: this.config.environmentRefreshInterval * 2,
      retry: this.config.retryConfig?.attempts || 3,
      retryDelay: (retryAttempt: number) => 
        Math.min(1000 * 2 ** retryAttempt, 30000),
      refetchInterval: this.config.enableBackgroundSync 
        ? this.config.environmentRefreshInterval 
        : false,
      ...customConfig,
    };
  }

  // =============================================================================
  // SYSTEM DATA MANAGEMENT
  // =============================================================================

  /**
   * Fetch system configuration data
   * @param config - Request configuration options
   * @returns Promise with system data
   */
  async fetchSystemData(config: RequestConfig = {}): Promise<System> {
    return this.get<System>('', {
      showSpinner: true,
      suppressNotifications: true, // Skip error notifications for system data
      ...config,
    });
  }

  /**
   * Get SWR key for system data
   * @returns SWR cache key for system data
   */
  getSystemSWRKey(): string {
    return '/api/v2/system';
  }

  /**
   * Get React Query key for system data
   * @returns React Query cache key for system data
   */
  getSystemQueryKey(): string[] {
    return ['system', 'config'];
  }

  /**
   * Get SWR configuration for system data fetching
   * @param customConfig - Custom SWR configuration
   * @returns SWR configuration object
   */
  getSystemSWRConfig(customConfig: Partial<SWRConfig> = {}): SWRConfig {
    return {
      refreshInterval: this.config.systemRefreshInterval,
      revalidateOnFocus: false, // Less frequent revalidation for system data
      revalidateOnReconnect: true,
      dedupingInterval: 10000,
      errorRetryCount: this.config.retryConfig?.attempts || 3,
      ...customConfig,
    };
  }

  /**
   * Get React Query configuration for system data fetching
   * @param customConfig - Custom React Query configuration
   * @returns React Query configuration object
   */
  getSystemQueryConfig(customConfig: Partial<ReactQueryConfig> = {}): ReactQueryConfig {
    return {
      staleTime: this.config.systemRefreshInterval,
      cacheTime: this.config.systemRefreshInterval * 3,
      retry: this.config.retryConfig?.attempts || 3,
      retryDelay: (retryAttempt: number) => 
        Math.min(1000 * 2 ** retryAttempt, 30000),
      refetchInterval: this.config.enableBackgroundSync 
        ? this.config.systemRefreshInterval 
        : false,
      ...customConfig,
    };
  }

  // =============================================================================
  // SYSTEM INFORMATION AND MONITORING
  // =============================================================================

  /**
   * Fetch detailed system information
   * @param config - Request configuration options
   * @returns Promise with system information
   */
  async fetchSystemInfo(config: RequestConfig = {}): Promise<SystemInfo> {
    return this.get<SystemInfo>('info', config);
  }

  /**
   * Fetch system performance metrics
   * @param config - Request configuration options
   * @returns Promise with system metrics
   */
  async fetchSystemMetrics(config: RequestConfig = {}): Promise<SystemMetrics> {
    return this.get<SystemMetrics>('metrics', config);
  }

  /**
   * Fetch system configuration items
   * @param config - Request configuration options
   * @returns Promise with configuration items
   */
  async fetchConfigItems(config: RequestConfig = {}): Promise<ConfigItem[]> {
    const response = await this.get<{ resource: ConfigItem[] }>('config', config);
    return response.resource || [];
  }

  /**
   * Update system configuration item
   * @param name - Configuration item name
   * @param value - New configuration value
   * @param config - Request configuration options
   * @returns Promise with update response
   */
  async updateConfigItem(
    name: string, 
    value: any, 
    config: RequestConfig = {}
  ): Promise<SuccessResponse> {
    return this.post(`config/${name}`, { value }, config);
  }

  // =============================================================================
  // LICENSE VALIDATION AND SUBSCRIPTION MANAGEMENT
  // =============================================================================

  /**
   * Check license validity with license key
   * @param licenseKey - License key to validate
   * @param config - Request configuration options
   * @returns Promise with license check response
   */
  async checkLicense(
    licenseKey: string, 
    config: RequestConfig = {}
  ): Promise<LicenseCheckResponse> {
    const url = 'https://updates.dreamfactory.com/check';
    const headers = {
      'X-DreamFactory-License-Key': licenseKey,
      ...config.additionalHeaders?.reduce((acc, header) => {
        acc[header.key] = String(header.value);
        return acc;
      }, {} as Record<string, string>),
    };

    try {
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          ...headers,
        },
        signal: config.signal,
      });

      const data = await response.json();

      if (!response.ok) {
        return {
          success: false,
          valid: false,
          error: data.message || 'License validation failed',
        };
      }

      // Transform snake_case to camelCase for consistency
      return this.transformLicenseResponse(data);
    } catch (error) {
      return {
        success: false,
        valid: false,
        error: error instanceof Error ? error.message : 'License check failed',
      };
    }
  }

  /**
   * Fetch subscription data for the current license
   * @param config - Request configuration options
   * @returns Promise with subscription data
   */
  async fetchSubscriptionData(config: RequestConfig = {}): Promise<SubscriptionData> {
    return this.get<SubscriptionData>('subscription', config);
  }

  /**
   * Get SWR key for license validation
   * @param licenseKey - License key for cache key generation
   * @returns SWR cache key for license data
   */
  getLicenseSWRKey(licenseKey: string): string {
    return `/license/check/${licenseKey}`;
  }

  /**
   * Get React Query key for license validation
   * @param licenseKey - License key for cache key generation
   * @returns React Query cache key for license data
   */
  getLicenseQueryKey(licenseKey: string): string[] {
    return ['license', 'check', licenseKey];
  }

  /**
   * Get SWR configuration for license data fetching
   * @param customConfig - Custom SWR configuration
   * @returns SWR configuration object
   */
  getLicenseSWRConfig(customConfig: Partial<SWRConfig> = {}): SWRConfig {
    return {
      refreshInterval: this.config.licenseRefreshInterval,
      revalidateOnFocus: false, // Less frequent revalidation for license data
      revalidateOnReconnect: true,
      dedupingInterval: 60000, // 1 minute deduplication
      errorRetryCount: 2, // Fewer retries for license checks
      ...customConfig,
    };
  }

  /**
   * Get React Query configuration for license data fetching
   * @param customConfig - Custom React Query configuration
   * @returns React Query configuration object
   */
  getLicenseQueryConfig(customConfig: Partial<ReactQueryConfig> = {}): ReactQueryConfig {
    return {
      staleTime: this.config.licenseRefreshInterval,
      cacheTime: this.config.licenseRefreshInterval * 2,
      retry: 2, // Fewer retries for license checks
      retryDelay: (retryAttempt: number) => 
        Math.min(2000 * 2 ** retryAttempt, 10000),
      refetchInterval: this.config.enableBackgroundSync 
        ? this.config.licenseRefreshInterval 
        : false,
      ...customConfig,
    };
  }

  // =============================================================================
  // CACHE MANAGEMENT AND UTILITIES
  // =============================================================================

  /**
   * Clear system cache
   * @param config - Request configuration options
   * @returns Promise with cache clear response
   */
  async clearSystemCache(config: RequestConfig = {}): Promise<SuccessResponse> {
    return this.post('cache', { clear: true }, config);
  }

  /**
   * Get cache statistics
   * @param config - Request configuration options
   * @returns Promise with cache statistics
   */
  async getCacheStats(config: RequestConfig = {}): Promise<any> {
    return this.get('cache', config);
  }

  /**
   * Warm up system cache
   * @param config - Request configuration options
   * @returns Promise with cache warm-up response
   */
  async warmUpCache(config: RequestConfig = {}): Promise<SuccessResponse> {
    return this.post('cache/warmup', {}, config);
  }

  // =============================================================================
  // ERROR HANDLING AND UTILITIES
  // =============================================================================

  /**
   * Handle system-specific errors with token clearance
   * @param error - Error object from failed request
   * @param config - Request configuration that may contain error handlers
   */
  private handleSystemError(error: any, config: RequestConfig): void {
    try {
      const errorData = JSON.parse(error.message);
      
      // Clear token on authentication/authorization failures during system configuration
      if (errorData.error?.status_code === 401 || errorData.error?.status_code === 403) {
        // Trigger token clearance through auth client
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('auth:token-expired'));
        }
      }
    } catch {
      // If error message is not JSON, handle as generic error
      if (error.message?.includes('401') || error.message?.includes('403')) {
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('auth:token-expired'));
        }
      }
    }
  }

  /**
   * Transform license response from snake_case to camelCase
   * @param response - Raw license response
   * @returns Transformed license response
   */
  private transformLicenseResponse(response: any): LicenseCheckResponse {
    return {
      success: response.success ?? true,
      valid: response.valid ?? false,
      expired: response.expired,
      daysLeft: response.days_left,
      plan: response.plan,
      features: response.features,
      limits: response.limits ? {
        users: response.limits.users,
        apis: response.limits.apis,
        storage: response.limits.storage,
      } : undefined,
      message: response.message,
      error: response.error,
    };
  }

  /**
   * Get all system-related SWR keys for cache invalidation
   * @returns Array of all system SWR cache keys
   */
  getAllSystemSWRKeys(): string[] {
    return [
      this.getEnvironmentSWRKey(),
      this.getSystemSWRKey(),
    ];
  }

  /**
   * Get all system-related React Query keys for cache invalidation
   * @returns Array of all system React Query cache keys
   */
  getAllSystemQueryKeys(): string[][] {
    return [
      this.getEnvironmentQueryKey(),
      this.getSystemQueryKey(),
      ['system', 'info'],
      ['system', 'metrics'],
      ['system', 'config'],
      ['system', 'cache'],
    ];
  }

  /**
   * Update client configuration
   * @param newConfig - New configuration options to merge
   */
  updateConfig(newConfig: Partial<SystemClientConfig>): void {
    this.config = { ...this.config, ...newConfig };
    
    if (newConfig.baseUrl) {
      this.baseUrl = newConfig.baseUrl;
    }
    
    if (newConfig.defaultHeaders) {
      this.defaultHeaders = { ...this.defaultHeaders, ...newConfig.defaultHeaders };
    }
  }
}

// =============================================================================
// DEFAULT CLIENT INSTANCE AND UTILITIES
// =============================================================================

/**
 * Default system client instance
 */
export const systemClient = new SystemClient();

/**
 * Create a new system client with custom configuration
 * @param config - System client configuration
 * @returns New SystemClient instance
 */
export function createSystemClient(config: SystemClientConfig = {}): SystemClient {
  return new SystemClient(config);
}

/**
 * System client factory function for dependency injection
 * @param config - System client configuration
 * @returns SystemClient instance
 */
export const createSystemClientFactory = (config: SystemClientConfig = {}) => {
  return () => new SystemClient(config);
};

// =============================================================================
// TYPE EXPORTS
// =============================================================================

export type {
  Environment,
  System,
  LicenseCheckResponse,
  SubscriptionData,
  SystemInfo,
  ConfigItem,
  SystemMetrics,
  SystemClientConfig,
  SystemSWRConfig,
  SystemReactQueryConfig,
};