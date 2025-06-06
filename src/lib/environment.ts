/**
 * Environment configuration management for DreamFactory Admin Interface
 * 
 * This module provides environment configuration handling for the React/Next.js
 * application, including platform license settings, API keys, and runtime
 * configuration. Replaces Angular's environment service patterns with
 * Next.js-compatible configuration management.
 * 
 * @fileoverview Environment configuration utilities
 * @version 1.0.0
 * @since React 19.0.0 / Next.js 15.1+
 */

import React from 'react';

// ============================================================================
// Environment Types
// ============================================================================

/**
 * Platform configuration interface
 */
export interface PlatformConfig {
  /**
   * License type identifier
   * @example "ENTERPRISE" | "PROFESSIONAL" | "TRIAL" | "OPEN SOURCE"
   */
  license: string;
  
  /**
   * License key for commercial versions
   */
  licenseKey?: string;
  
  /**
   * Platform version information
   */
  version?: string;
  
  /**
   * Build information
   */
  build?: string;
  
  /**
   * Installation mode
   */
  mode?: string;
  
  /**
   * Whether this is a trial installation
   */
  isTrial?: boolean;
  
  /**
   * Instance identifier
   */
  instanceId?: string;
}

/**
 * Server configuration interface
 */
export interface ServerConfig {
  /**
   * Operating system information
   */
  os?: string;
  
  /**
   * Server version
   */
  version?: string;
  
  /**
   * Host information
   */
  host?: string;
  
  /**
   * Machine identifier
   */
  machine?: string;
  
  /**
   * PHP configuration
   */
  php?: {
    version?: string;
    serverApi?: string;
  };
}

/**
 * Client configuration interface
 */
export interface ClientConfig {
  /**
   * User agent string
   */
  userAgent?: string;
  
  /**
   * Client IP address
   */
  ipAddress?: string;
  
  /**
   * Client locale
   */
  locale?: string;
}

/**
 * Complete environment configuration interface
 */
export interface EnvironmentConfig {
  /**
   * Whether this is a production build
   */
  production: boolean;
  
  /**
   * Platform configuration
   */
  platform?: PlatformConfig;
  
  /**
   * Server configuration
   */
  server?: ServerConfig;
  
  /**
   * Client configuration
   */
  client?: ClientConfig;
  
  /**
   * API configuration
   */
  api?: {
    /**
     * Base URL for API calls
     */
    baseUrl?: string;
    
    /**
     * API version
     */
    version?: string;
    
    /**
     * Timeout configuration
     */
    timeout?: number;
  };
  
  /**
   * Feature flags
   */
  features?: {
    [key: string]: boolean;
  };
  
  /**
   * Debug configuration
   */
  debug?: {
    /**
     * Enable debug logging
     */
    enabled?: boolean;
    
    /**
     * Debug level
     */
    level?: 'error' | 'warn' | 'info' | 'debug';
  };
}

// ============================================================================
// Environment Management
// ============================================================================

/**
 * Default environment configuration
 */
const defaultEnvironment: EnvironmentConfig = {
  production: process.env.NODE_ENV === 'production',
  platform: {
    license: 'OPEN SOURCE',
    version: '1.0.0',
    mode: 'development',
    isTrial: false,
  },
  api: {
    baseUrl: '/api/v2',
    version: 'v2',
    timeout: 30000,
  },
  features: {},
  debug: {
    enabled: process.env.NODE_ENV !== 'production',
    level: 'info',
  },
};

/**
 * Current environment configuration
 * 
 * This will be populated by the environment loading process
 */
let currentEnvironment: EnvironmentConfig = { ...defaultEnvironment };

/**
 * Whether the environment has been initialized
 */
let environmentInitialized = false;

// ============================================================================
// Environment Loading Functions
// ============================================================================

/**
 * Load environment configuration from various sources
 * 
 * This function aggregates configuration from:
 * - Next.js environment variables
 * - Runtime configuration API
 * - Build-time configuration
 * 
 * @returns Promise resolving to complete environment configuration
 */
export async function loadEnvironment(): Promise<EnvironmentConfig> {
  try {
    // Start with default configuration
    const environment: EnvironmentConfig = { ...defaultEnvironment };
    
    // Override with Next.js environment variables
    if (process.env.NEXT_PUBLIC_PRODUCTION) {
      environment.production = process.env.NEXT_PUBLIC_PRODUCTION === 'true';
    }
    
    if (process.env.NEXT_PUBLIC_API_BASE_URL) {
      environment.api = {
        ...environment.api,
        baseUrl: process.env.NEXT_PUBLIC_API_BASE_URL,
      };
    }
    
    if (process.env.NEXT_PUBLIC_DEBUG_ENABLED) {
      environment.debug = {
        ...environment.debug,
        enabled: process.env.NEXT_PUBLIC_DEBUG_ENABLED === 'true',
      };
    }
    
    // Load runtime configuration from API if available
    try {
      if (typeof window !== 'undefined') {
        // Client-side: fetch from API
        const response = await fetch('/api/v2/system/environment', {
          method: 'GET',
          headers: {
            'Accept': 'application/json',
            'Cache-Control': 'no-cache',
          },
          credentials: 'include',
        });
        
        if (response.ok) {
          const runtimeConfig = await response.json();
          
          // Merge runtime configuration
          if (runtimeConfig.platform) {
            environment.platform = {
              ...environment.platform,
              ...runtimeConfig.platform,
            };
          }
          
          if (runtimeConfig.server) {
            environment.server = runtimeConfig.server;
          }
          
          if (runtimeConfig.client) {
            environment.client = runtimeConfig.client;
          }
          
          if (runtimeConfig.features) {
            environment.features = {
              ...environment.features,
              ...runtimeConfig.features,
            };
          }
        }
      }
    } catch (error) {
      // Runtime configuration failed, but continue with defaults
      console.warn('Failed to load runtime environment configuration:', error);
    }
    
    // Update current environment
    currentEnvironment = environment;
    environmentInitialized = true;
    
    return environment;
  } catch (error) {
    console.error('Failed to load environment configuration:', error);
    
    // Return safe defaults on error
    currentEnvironment = { ...defaultEnvironment };
    environmentInitialized = true;
    
    return currentEnvironment;
  }
}

/**
 * Get current environment configuration
 * 
 * Returns the current environment configuration. If not yet loaded,
 * returns default configuration and triggers loading.
 * 
 * @returns Current environment configuration
 */
export function getEnvironment(): EnvironmentConfig {
  // If not initialized, trigger loading but return defaults immediately
  if (!environmentInitialized) {
    loadEnvironment().catch(console.error);
    return { ...defaultEnvironment };
  }
  
  return currentEnvironment;
}

/**
 * Update environment configuration
 * 
 * @param updates - Partial environment configuration to merge
 */
export function updateEnvironment(updates: Partial<EnvironmentConfig>): void {
  currentEnvironment = {
    ...currentEnvironment,
    ...updates,
  };
}

/**
 * Check if environment is production
 * 
 * @returns Whether the environment is production
 */
export function isProduction(): boolean {
  return getEnvironment().production;
}

/**
 * Check if environment is development
 * 
 * @returns Whether the environment is development
 */
export function isDevelopment(): boolean {
  return !isProduction();
}

/**
 * Get platform license information
 * 
 * @returns Platform license configuration
 */
export function getPlatformLicense(): PlatformConfig | undefined {
  return getEnvironment().platform;
}

/**
 * Check if license checking should be performed
 * 
 * @returns Whether license checking is enabled
 */
export function shouldCheckLicense(): boolean {
  const platform = getPlatformLicense();
  
  return Boolean(
    platform?.license &&
    platform.license !== 'OPEN SOURCE' &&
    platform.licenseKey &&
    platform.licenseKey.trim() !== ''
  );
}

/**
 * Get API configuration
 * 
 * @returns API configuration
 */
export function getApiConfig(): NonNullable<EnvironmentConfig['api']> {
  const config = getEnvironment().api;
  return {
    baseUrl: '/api/v2',
    version: 'v2',
    timeout: 30000,
    ...config,
  };
}

/**
 * Check if a feature is enabled
 * 
 * @param feature - Feature name to check
 * @returns Whether the feature is enabled
 */
export function isFeatureEnabled(feature: string): boolean {
  const features = getEnvironment().features || {};
  return Boolean(features[feature]);
}

/**
 * Check if debug mode is enabled
 * 
 * @returns Whether debug mode is enabled
 */
export function isDebugEnabled(): boolean {
  return getEnvironment().debug?.enabled ?? false;
}

// ============================================================================
// React Hook for Environment
// ============================================================================

/**
 * React hook for accessing environment configuration
 * 
 * This hook provides reactive access to environment configuration
 * and handles loading state.
 */
export function useEnvironment() {
  const [environment, setEnvironment] = React.useState<EnvironmentConfig>(getEnvironment);
  const [loading, setLoading] = React.useState(!environmentInitialized);
  const [error, setError] = React.useState<Error | null>(null);
  
  React.useEffect(() => {
    if (!environmentInitialized) {
      setLoading(true);
      loadEnvironment()
        .then((env) => {
          setEnvironment(env);
          setError(null);
        })
        .catch((err) => {
          setError(err instanceof Error ? err : new Error('Failed to load environment'));
          setEnvironment(getEnvironment());
        })
        .finally(() => {
          setLoading(false);
        });
    }
  }, []);
  
  return { environment, loading, error };
}

// ============================================================================
// Default Export
// ============================================================================

export default {
  loadEnvironment,
  getEnvironment,
  updateEnvironment,
  isProduction,
  isDevelopment,
  getPlatformLicense,
  shouldCheckLicense,
  getApiConfig,
  isFeatureEnabled,
  isDebugEnabled,
  useEnvironment,
};