/**
 * Configuration Module Index
 * 
 * Centralized configuration export module providing type-safe access to all 
 * application configuration domains. Serves as the primary import point for 
 * configuration across Next.js components and services.
 * 
 * This module implements a barrel export pattern optimized for tree-shaking
 * and bundle size optimization, supporting both client-side components and
 * server-side utilities as required by Next.js 15.1 architecture.
 * 
 * @module src/lib/config
 * @version 1.0.0
 * @since Next.js 15.1
 */

// Environment configuration - NEXT_PUBLIC_ variables and server-side env
export {
  env,
  getClientConfig,
  getServerConfig,
  validateEnvironment,
  type EnvironmentConfig,
  type ClientEnvironmentConfig,
  type ServerEnvironmentConfig
} from './env';

// Application constants - languages, scripts, service types, etc.
export {
  SUPPORTED_LANGUAGES,
  SCRIPT_TYPES,
  SUPPORTED_EXTENSIONS,
  SERVICE_GROUPS,
  SERVICE_TYPES,
  HTTP_HEADERS,
  EXPORT_FORMATS,
  DEFAULT_PAGINATION,
  VALIDATION_PATTERNS,
  type SupportedLanguage,
  type ScriptType,
  type ServiceGroup,
  type ServiceType,
  type ExportFormat
} from './constants';

// API endpoint configuration - DreamFactory APIs and Next.js routes
export {
  apiConfig,
  getApiEndpoint,
  getBaseUrl,
  buildApiUrl,
  API_ENDPOINTS,
  API_VERSIONS,
  type ApiEndpoint,
  type ApiVersion,
  type ApiConfig
} from './api';

// Application-wide configuration - UI constants, table definitions, metadata
export {
  appConfig,
  APP_METADATA,
  HOME_RESOURCES,
  TABLE_COLUMNS,
  NAVIGATION_ITEMS,
  UI_CONSTANTS,
  THEME_CONFIG,
  type AppMetadata,
  type HomeResource,
  type TableColumnConfig,
  type NavigationItem,
  type ThemeConfig
} from './app';

/**
 * Unified Configuration Object
 * 
 * Aggregates all configuration domains into a single, type-safe object
 * for consistent access patterns throughout the application.
 */
export interface Config {
  env: EnvironmentConfig;
  api: ApiConfig;
  app: typeof appConfig;
  constants: {
    languages: typeof SUPPORTED_LANGUAGES;
    scripts: typeof SCRIPT_TYPES;
    services: typeof SERVICE_TYPES;
    exports: typeof EXPORT_FORMATS;
  };
}

/**
 * Create unified configuration object with proper typing
 * 
 * This function provides a centralized way to access all configuration
 * while maintaining tree-shaking capabilities for optimal bundle size.
 * 
 * @returns {Promise<Config>} Complete configuration object
 */
export async function createConfig(): Promise<Config> {
  // Import modules dynamically to support conditional loading
  const [
    { env },
    { apiConfig },
    { appConfig },
    { 
      SUPPORTED_LANGUAGES,
      SCRIPT_TYPES,
      SERVICE_TYPES,
      EXPORT_FORMATS
    }
  ] = await Promise.all([
    import('./env'),
    import('./api'),
    import('./app'),
    import('./constants')
  ]);

  return {
    env,
    api: apiConfig,
    app: appConfig,
    constants: {
      languages: SUPPORTED_LANGUAGES,
      scripts: SCRIPT_TYPES,
      services: SERVICE_TYPES,
      exports: EXPORT_FORMATS
    }
  };
}

/**
 * Configuration Utilities
 * 
 * Helper functions for common configuration operations
 */

/**
 * Check if running in development environment
 */
export function isDevelopment(): boolean {
  return process.env.NODE_ENV === 'development';
}

/**
 * Check if running in production environment
 */
export function isProduction(): boolean {
  return process.env.NODE_ENV === 'production';
}

/**
 * Check if running in test environment
 */
export function isTest(): boolean {
  return process.env.NODE_ENV === 'test';
}

/**
 * Check if running on client side
 */
export function isClient(): boolean {
  return typeof window !== 'undefined';
}

/**
 * Check if running on server side
 */
export function isServer(): boolean {
  return typeof window === 'undefined';
}

/**
 * Get feature flag value with type safety
 * 
 * @param flag - Feature flag name
 * @param defaultValue - Default value if flag is not set
 * @returns Feature flag value
 */
export function getFeatureFlag(flag: string, defaultValue: boolean = false): boolean {
  const value = process.env[`NEXT_PUBLIC_FEATURE_${flag.toUpperCase()}`];
  if (value === undefined) return defaultValue;
  return value === 'true' || value === '1';
}

/**
 * Configuration validation
 * 
 * Validates that all required configuration is properly loaded
 * and accessible. Should be called during application startup.
 * 
 * @throws {Error} If configuration validation fails
 */
export async function validateConfiguration(): Promise<void> {
  try {
    // Validate environment configuration
    const { validateEnvironment } = await import('./env');
    await validateEnvironment();

    // Validate API configuration
    const { apiConfig } = await import('./api');
    if (!apiConfig.baseUrl) {
      throw new Error('API base URL is not configured');
    }

    // Validate app configuration
    const { appConfig } = await import('./app');
    if (!appConfig.name || !appConfig.version) {
      throw new Error('App metadata is incomplete');
    }

    console.log('✅ Configuration validation successful');
  } catch (error) {
    console.error('❌ Configuration validation failed:', error);
    throw error;
  }
}

/**
 * Re-export types for external consumption
 */
export type {
  EnvironmentConfig,
  ClientEnvironmentConfig,
  ServerEnvironmentConfig,
  ApiEndpoint,
  ApiVersion,
  ApiConfig,
  AppMetadata,
  HomeResource,
  TableColumnConfig,
  NavigationItem,
  ThemeConfig,
  SupportedLanguage,
  ScriptType,
  ServiceGroup,
  ServiceType,
  ExportFormat
} from './env';

export type {
  ApiEndpoint as ApiEndpointType,
  ApiVersion as ApiVersionType,
  ApiConfig as ApiConfigType
} from './api';

export type {
  AppMetadata as AppMetadataType,
  HomeResource as HomeResourceType,
  TableColumnConfig as TableColumnConfigType,
  NavigationItem as NavigationItemType,
  ThemeConfig as ThemeConfigType
} from './app';

export type {
  SupportedLanguage as SupportedLanguageType,
  ScriptType as ScriptTypeType,
  ServiceGroup as ServiceGroupType,
  ServiceType as ServiceTypeType,
  ExportFormat as ExportFormatType
} from './constants';

/**
 * Default export for convenience imports
 * 
 * Provides a default export that includes the most commonly used
 * configuration items for convenient access.
 */
const config = {
  createConfig,
  validateConfiguration,
  isDevelopment,
  isProduction,
  isTest,
  isClient,
  isServer,
  getFeatureFlag
};

export default config;