/**
 * Main Configuration Module Export
 * 
 * Provides centralized access to all configuration utilities including environment variables,
 * constants, API endpoints, and application settings. Serves as the primary import point for
 * configuration across the Next.js application components and services.
 * 
 * This module replaces the distributed Angular constant imports with a unified barrel export
 * pattern optimized for tree-shaking and type-safe configuration access. It establishes a
 * single source of truth for all application configuration while organizing exports by domain
 * for logical grouping and maintainability.
 * 
 * Key Features:
 * - Type-safe configuration object aggregation for consistent access patterns
 * - Optimized import patterns for tree-shaking and bundle size optimization
 * - Configuration accessible from both client-side components and server-side utilities
 * - Export structure supports future configuration additions without breaking existing imports
 * - Organized configuration exports by domain (environment, api, constants, app)
 * 
 * @example
 * ```typescript
 * // Individual domain imports (tree-shaking optimized)
 * import { env, isProduction } from '@/lib/config';
 * import { API_ENDPOINTS, buildApiUrl } from '@/lib/config';
 * import { ROUTES, SERVICE_GROUPS } from '@/lib/config';
 * import { APP_METADATA, UI_ICONS } from '@/lib/config';
 * 
 * // Aggregated configuration object access
 * import { config } from '@/lib/config';
 * const apiUrl = config.api.endpoints.SYSTEM;
 * const isDev = config.env.isDevelopment;
 * const appName = config.app.metadata.name;
 * 
 * // Utility function access
 * import { getEndpointConfig, validateEnvironment } from '@/lib/config';
 * ```
 */

// =============================================================================
// ENVIRONMENT CONFIGURATION EXPORTS
// =============================================================================

export {
  // Core environment object and utilities
  env,
  isProduction,
  isDevelopment,
  isStaging,
  
  // Environment validation and configuration functions
  validateEnvironment,
  getDreamFactoryConfig,
  getServerConfig,
  getClientConfig,
  envUtils,
  
  // Environment type exports
  type EnvironmentConfig,
} from './env';

// =============================================================================
// APPLICATION CONSTANTS EXPORTS
// =============================================================================

export {
  // Language and internationalization
  SUPPORTED_LANGUAGES,
  DEFAULT_LANGUAGE,
  
  // Script and editor configuration
  AceEditorMode,
  SCRIPT_TYPES,
  
  // HTTP headers and request configuration
  HTTP_HEADERS,
  REQUEST_OPTIONS,
  
  // Routes and navigation
  ROUTES,
  
  // Service configuration and types
  SERVICE_GROUPS,
  SILVER_SERVICES,
  GOLD_SERVICES,
  getAllServices,
  getServicesByGroup,
  getServiceGroupsForRoute,
  
  // File and export types
  EXPORT_TYPES,
  BASE_URL,
  URLS,
  
  // Type exports for constants
  type SupportedLanguage,
  type ScriptTypeConfig,
  type HttpHeaderKey,
  type RequestOptionKey,
  type ServiceGroupMapping,
  type SilverServiceType,
  type GoldServiceType,
  type AllServiceTypes,
  type ExportFormat,
  type ApiEndpoint,
  type ServiceByName,
  type ServiceType,
  type ConfigSchema,
} from './constants';

// =============================================================================
// API CONFIGURATION EXPORTS
// =============================================================================

export {
  // Base API configuration
  API_BASE_URL,
  API_ENDPOINTS,
  API_CONFIG,
  DEFAULT_REQUEST_CONFIG,
  
  // URL and endpoint utilities
  getBaseUrl,
  resolveApiUrl,
  getEndpointConfig,
  buildApiUrl,
  validateApiConfig,
  
  // Cache and query utilities
  generateCacheKey,
  getCacheConfig,
  ENDPOINT_CONFIG,
  
  // Backward compatibility exports
  BASE_URL as API_BASE_URL_LEGACY,
  URLS as API_ENDPOINTS_LEGACY,
  
  // API type exports
  type ApiConfig,
  type RequestConfig,
  type EndpointConfig,
  type ApiEndpoint as ApiEndpointType,
} from './api';

// =============================================================================
// APPLICATION CONFIGURATION EXPORTS
// =============================================================================

export {
  // Application metadata and branding
  APP_METADATA,
  
  // Navigation and resources
  WELCOME_PAGE_RESOURCES,
  RESOURCES_PAGE_RESOURCES,
  NATIVE_EXAMPLE_LINKS,
  JAVASCRIPT_EXAMPLE_LINKS,
  
  // Table and UI configuration
  USER_TABLE_COLUMNS,
  SERVICE_TABLE_COLUMNS,
  PAGINATION_CONFIG,
  TABLE_CONFIG,
  
  // API and endpoint configuration
  BASE_API_URL as APP_BASE_API_URL,
  API_ENDPOINTS as APP_API_ENDPOINTS,
  
  // UI and styling
  UI_ICONS,
  EXPORT_TYPE_CONFIG,
  
  // Form and validation configuration
  VALIDATION_MESSAGES,
  FORM_CONFIG,
  
  // Application type exports
  type ResourceLink,
  type SDKLink,
  type TableColumn,
  type APIEndpoint,
  type IconKey,
  type APIEndpointKey,
  type ExportType,
} from './app';

// =============================================================================
// AGGREGATED CONFIGURATION OBJECT
// =============================================================================

/**
 * Aggregated configuration object providing type-safe access to all configuration domains.
 * Enables consistent configuration access patterns throughout the application while maintaining
 * the ability to import individual pieces for optimal tree-shaking.
 * 
 * This object serves as a convenience export for components that need access to multiple
 * configuration domains without requiring multiple import statements.
 */
export const config = {
  /**
   * Environment configuration including variables, validation, and utilities
   */
  env: {
    // Core environment detection
    isProduction,
    isDevelopment,
    isStaging,
    
    // Environment variables
    variables: env,
    
    // Environment-specific getters
    getDreamFactoryConfig,
    getClientConfig,
    
    // Validation utilities
    validate: validateEnvironment,
    utils: envUtils,
  },
  
  /**
   * API configuration including endpoints, utilities, and caching
   */
  api: {
    // Base configuration
    baseUrl: API_BASE_URL,
    endpoints: API_ENDPOINTS,
    config: API_CONFIG,
    
    // URL and endpoint utilities
    getBaseUrl,
    resolveApiUrl,
    getEndpointConfig,
    buildApiUrl,
    
    // Cache and query utilities
    generateCacheKey,
    getCacheConfig,
    
    // Validation
    validate: validateApiConfig,
  },
  
  /**
   * Application constants including routes, services, and HTTP configuration
   */
  constants: {
    // Language and localization
    languages: SUPPORTED_LANGUAGES,
    defaultLanguage: DEFAULT_LANGUAGE,
    
    // Routes and navigation
    routes: ROUTES,
    
    // Service configuration
    serviceGroups: SERVICE_GROUPS,
    silverServices: SILVER_SERVICES,
    goldServices: GOLD_SERVICES,
    getAllServices,
    getServicesByGroup,
    getServiceGroupsForRoute,
    
    // HTTP and request configuration
    httpHeaders: HTTP_HEADERS,
    requestOptions: REQUEST_OPTIONS,
    
    // Script and editor types
    aceEditorMode: AceEditorMode,
    scriptTypes: SCRIPT_TYPES,
    
    // Export types
    exportTypes: EXPORT_TYPES,
  },
  
  /**
   * Application-specific configuration including metadata, UI, and table definitions
   */
  app: {
    // Application metadata
    metadata: APP_METADATA,
    
    // Navigation resources
    resources: {
      welcome: WELCOME_PAGE_RESOURCES,
      resources: RESOURCES_PAGE_RESOURCES,
      native: NATIVE_EXAMPLE_LINKS,
      javascript: JAVASCRIPT_EXAMPLE_LINKS,
    },
    
    // Table configurations
    tables: {
      users: USER_TABLE_COLUMNS,
      services: SERVICE_TABLE_COLUMNS,
      pagination: PAGINATION_CONFIG,
      config: TABLE_CONFIG,
    },
    
    // UI configuration
    ui: {
      icons: UI_ICONS,
      exportTypes: EXPORT_TYPE_CONFIG,
      validation: VALIDATION_MESSAGES,
      forms: FORM_CONFIG,
    },
  },
} as const;

// =============================================================================
// UTILITY FUNCTIONS FOR CONFIGURATION ACCESS
// =============================================================================

/**
 * Get configuration for a specific domain with type safety.
 * Provides a functional interface for accessing configuration domains.
 * 
 * @param domain - The configuration domain to access
 * @returns The configuration object for the specified domain
 * 
 * @example
 * ```typescript
 * const envConfig = getConfigDomain('env');
 * const apiConfig = getConfigDomain('api');
 * const constantsConfig = getConfigDomain('constants');
 * const appConfig = getConfigDomain('app');
 * ```
 */
export function getConfigDomain<T extends keyof typeof config>(domain: T): typeof config[T] {
  return config[domain];
}

/**
 * Validate all configuration domains at runtime.
 * Performs comprehensive validation across environment, API, and application configuration.
 * 
 * @returns Promise resolving to validation results for each domain
 * 
 * @example
 * ```typescript
 * const validation = await validateAllConfig();
 * if (!validation.isValid) {
 *   console.error('Configuration validation failed:', validation.errors);
 * }
 * ```
 */
export async function validateAllConfig(): Promise<{
  isValid: boolean;
  errors: string[];
  domains: {
    env: boolean;
    api: boolean;
  };
}> {
  const errors: string[] = [];
  let envValid = true;
  let apiValid = true;
  
  // Validate environment configuration
  try {
    validateEnvironment();
  } catch (error) {
    envValid = false;
    errors.push(`Environment validation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
  
  // Validate API configuration
  try {
    const apiValidationResult = validateApiConfig();
    if (!apiValidationResult) {
      apiValid = false;
      errors.push('API configuration validation failed');
    }
  } catch (error) {
    apiValid = false;
    errors.push(`API validation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
  
  const isValid = envValid && apiValid;
  
  return {
    isValid,
    errors,
    domains: {
      env: envValid,
      api: apiValid,
    },
  };
}

/**
 * Get environment-specific configuration values.
 * Provides a utility for conditional configuration based on the current environment.
 * 
 * @param configs - Configuration object with environment-specific values
 * @returns The configuration value for the current environment
 * 
 * @example
 * ```typescript
 * const apiTimeout = getEnvironmentConfig({
 *   development: 30000,
 *   staging: 15000,
 *   production: 10000,
 * });
 * 
 * const debugMode = getEnvironmentConfig({
 *   development: true,
 *   staging: false,
 *   production: false,
 * });
 * ```
 */
export function getEnvironmentConfig<T>(configs: {
  development?: T;
  staging?: T;
  production?: T;
  default?: T;
}): T | undefined {
  const environment = env.NODE_ENV;
  
  if (configs[environment] !== undefined) {
    return configs[environment];
  }
  
  return configs.default;
}

/**
 * Check if a feature is enabled based on environment and configuration.
 * Provides a centralized way to manage feature flags across the application.
 * 
 * @param feature - The feature to check
 * @returns Whether the feature is enabled
 * 
 * @example
 * ```typescript
 * const debugEnabled = isFeatureEnabled('debug');
 * const analyticsEnabled = isFeatureEnabled('analytics');
 * ```
 */
export function isFeatureEnabled(feature: keyof typeof APP_METADATA.features): boolean {
  return APP_METADATA.features[feature];
}

/**
 * Get the complete application configuration suitable for client-side hydration.
 * Excludes server-only configuration and provides a safe configuration object
 * that can be serialized and sent to the client.
 * 
 * @returns Client-safe configuration object
 * 
 * @example
 * ```typescript
 * // In Next.js getServerSideProps or API route
 * const clientConfig = getClientSafeConfig();
 * return {
 *   props: {
 *     config: clientConfig,
 *   },
 * };
 * ```
 */
export function getClientSafeConfig() {
  return {
    env: getClientConfig(),
    api: {
      baseUrl: API_BASE_URL,
      endpoints: API_ENDPOINTS,
    },
    app: {
      metadata: {
        name: APP_METADATA.name,
        version: APP_METADATA.version,
        features: APP_METADATA.features,
      },
      ui: {
        icons: UI_ICONS,
        validation: VALIDATION_MESSAGES,
      },
    },
    constants: {
      routes: ROUTES,
      httpHeaders: HTTP_HEADERS,
      exportTypes: EXPORT_TYPES,
    },
  };
}

// =============================================================================
// TYPE EXPORTS FOR EXTERNAL CONSUMPTION
// =============================================================================

/**
 * Comprehensive type export for the aggregated configuration object.
 * Enables type-safe access to the configuration throughout the application.
 */
export type Config = typeof config;

/**
 * Type for configuration domain keys, enabling type-safe domain access.
 */
export type ConfigDomain = keyof typeof config;

/**
 * Type for client-safe configuration, excluding server-only properties.
 */
export type ClientSafeConfig = ReturnType<typeof getClientSafeConfig>;

/**
 * Type for environment-specific configuration values.
 */
export type EnvironmentSpecificConfig<T> = {
  development?: T;
  staging?: T;
  production?: T;
  default?: T;
};

// =============================================================================
// DEFAULT EXPORT
// =============================================================================

/**
 * Default export provides the aggregated configuration object for convenient access.
 * Use named imports for tree-shaking optimization, or default import for comprehensive access.
 */
export default config;