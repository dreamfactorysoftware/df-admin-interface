/**
 * Application Configuration Types
 * 
 * Provides comprehensive TypeScript types and Zod validation for the DreamFactory
 * Admin Interface configuration system. Supports Next.js 15.1+ runtime configuration
 * with proper server-side and client-side distinction, environment variable validation,
 * and build optimization settings.
 * 
 * Migration Notes:
 * - Replaces Angular environment.ts pattern with Next.js .env conventions
 * - Implements Zod schema validation for runtime configuration safety
 * - Supports TypeScript 5.8+ enhanced server component typing
 * - Enables feature flag management for progressive deployment
 */

import { z } from 'zod';

// =============================================================================
// ENVIRONMENT VARIABLE SCHEMAS
// =============================================================================

/**
 * Client-side Environment Variables Schema
 * Variables accessible in the browser (NEXT_PUBLIC_ prefix required)
 */
export const ClientEnvSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'staging', 'production']).default('development'),
  NEXT_PUBLIC_API_URL: z.string().url().default('http://localhost:80'),
  NEXT_PUBLIC_DF_API_KEY: z.string().min(1, 'DreamFactory API key is required'),
  NEXT_PUBLIC_BASE_PATH: z.string().default('/dreamfactory/dist'),
  NEXT_PUBLIC_VERSION: z.string().default('1.0.0'),
  NEXT_PUBLIC_APP_NAME: z.string().default('DreamFactory Admin'),
  NEXT_PUBLIC_ENABLE_ANALYTICS: z.string().transform(val => val === 'true').default('false'),
  NEXT_PUBLIC_SENTRY_DSN: z.string().url().optional(),
  NEXT_PUBLIC_FEATURE_FLAGS: z.string().optional(), // JSON string of feature flags
});

/**
 * Server-side Environment Variables Schema
 * Variables only accessible on the server (no NEXT_PUBLIC_ prefix)
 */
export const ServerEnvSchema = z.object({
  SERVER_SECRET: z.string().min(32, 'Server secret must be at least 32 characters'),
  JWT_SECRET: z.string().min(32, 'JWT secret must be at least 32 characters'),
  DATABASE_URL: z.string().url().optional(),
  INTERNAL_API_URL: z.string().url().optional(),
  REDIS_URL: z.string().url().optional(),
  SESSION_TIMEOUT: z.string().transform(val => parseInt(val, 10)).default('3600'), // seconds
  RATE_LIMIT_MAX: z.string().transform(val => parseInt(val, 10)).default('100'),
  RATE_LIMIT_WINDOW: z.string().transform(val => parseInt(val, 10)).default('900'), // 15 minutes
  LOG_LEVEL: z.enum(['error', 'warn', 'info', 'debug']).default('info'),
  CORS_ORIGIN: z.string().optional(),
  ENCRYPTION_KEY: z.string().min(32).optional(),
});

/**
 * Build-time Environment Variables Schema
 * Variables used during the build process
 */
export const BuildEnvSchema = z.object({
  TURBO_TEAM: z.string().optional(),
  TURBO_TOKEN: z.string().optional(),
  ANALYZE_BUNDLE: z.string().transform(val => val === 'true').default('false'),
  DISABLE_ESLINT: z.string().transform(val => val === 'true').default('false'),
  DISABLE_TYPE_CHECK: z.string().transform(val => val === 'true').default('false'),
  BUNDLE_ANALYZER: z.string().transform(val => val === 'true').default('false'),
  SOURCEMAP: z.string().transform(val => val === 'true').default('false'),
});

// =============================================================================
// CONFIGURATION TYPE DEFINITIONS
// =============================================================================

/**
 * Client-side Configuration
 * Available in browser and server environments
 */
export type ClientConfig = z.infer<typeof ClientEnvSchema>;

/**
 * Server-side Configuration
 * Only available in server environments
 */
export type ServerConfig = z.infer<typeof ServerEnvSchema>;

/**
 * Build Configuration
 * Used during build and development
 */
export type BuildConfig = z.infer<typeof BuildEnvSchema>;

/**
 * API Endpoint Configuration
 * Defines all API endpoints used by the application
 */
export interface ApiEndpointConfig {
  /** Base URL for DreamFactory Core API */
  baseUrl: string;
  /** System API endpoints */
  system: {
    config: string;
    info: string;
    cache: string;
    cors: string;
    email: string;
    lookup: string;
  };
  /** Database service endpoints */
  database: {
    services: string;
    schema: string;
    tables: string;
    fields: string;
    relationships: string;
  };
  /** Authentication endpoints */
  auth: {
    login: string;
    logout: string;
    refresh: string;
    profile: string;
    register: string;
    reset: string;
  };
  /** User management endpoints */
  users: {
    list: string;
    create: string;
    update: string;
    delete: string;
    roles: string;
  };
  /** Admin management endpoints */
  admins: {
    list: string;
    create: string;
    update: string;
    delete: string;
  };
  /** API documentation endpoints */
  docs: {
    swagger: string;
    openapi: string;
  };
}

/**
 * Feature Flag Configuration
 * Controls progressive deployment and feature rollouts
 */
export interface FeatureFlagConfig {
  /** Enable new database service UI */
  enableNewDatabaseUI: boolean;
  /** Enable enhanced schema discovery */
  enableSchemaEnhancements: boolean;
  /** Enable API generation wizard v2 */
  enableApiWizardV2: boolean;
  /** Enable advanced security features */
  enableAdvancedSecurity: boolean;
  /** Enable real-time notifications */
  enableRealTimeNotifications: boolean;
  /** Enable experimental Turbopack features */
  enableTurbopackExperimental: boolean;
  /** Enable React 19 server components */
  enableServerComponents: boolean;
  /** Enable performance monitoring */
  enablePerformanceMonitoring: boolean;
  /** Enable advanced caching */
  enableAdvancedCaching: boolean;
  /** Enable beta features */
  enableBetaFeatures: boolean;
}

/**
 * Database Configuration
 * Settings for supported database types
 */
export interface DatabaseConfig {
  /** Supported database types */
  supportedTypes: Array<'mysql' | 'postgresql' | 'mongodb' | 'oracle' | 'snowflake' | 'sqlite'>;
  /** Default connection timeout in milliseconds */
  connectionTimeout: number;
  /** Maximum number of concurrent connections */
  maxConnections: number;
  /** Connection pool settings */
  pool: {
    min: number;
    max: number;
    idle: number;
  };
  /** Query timeout in milliseconds */
  queryTimeout: number;
  /** Schema discovery settings */
  schemaDiscovery: {
    maxTables: number;
    maxFields: number;
    timeout: number;
  };
}

/**
 * Security Configuration
 * Authentication and authorization settings
 */
export interface SecurityConfig {
  /** JWT token configuration */
  jwt: {
    expiresIn: string;
    refreshExpiresIn: string;
    algorithm: string;
    issuer: string;
  };
  /** Session configuration */
  session: {
    timeout: number;
    cookieName: string;
    secure: boolean;
    httpOnly: boolean;
    sameSite: 'strict' | 'lax' | 'none';
  };
  /** CORS configuration */
  cors: {
    origin: string | string[];
    credentials: boolean;
    optionsSuccessStatus: number;
  };
  /** Rate limiting */
  rateLimit: {
    windowMs: number;
    max: number;
    skipSuccessfulRequests: boolean;
  };
  /** Password requirements */
  password: {
    minLength: number;
    requireUppercase: boolean;
    requireLowercase: boolean;
    requireNumbers: boolean;
    requireSymbols: boolean;
  };
}

/**
 * Performance Configuration
 * Settings for optimization and monitoring
 */
export interface PerformanceConfig {
  /** Cache configuration */
  cache: {
    ttl: number;
    maxSize: number;
    strategy: 'lru' | 'fifo' | 'lfu';
  };
  /** API response caching */
  apiCache: {
    enabled: boolean;
    duration: number;
    exclude: string[];
  };
  /** Static asset configuration */
  assets: {
    maxAge: number;
    compression: boolean;
    optimization: boolean;
  };
  /** Bundle optimization */
  bundle: {
    splitChunks: boolean;
    treeShaking: boolean;
    minification: boolean;
  };
}

/**
 * Next.js Specific Configuration
 * Runtime and build configuration for Next.js
 */
export interface NextJSConfig {
  /** Server runtime configuration */
  serverRuntimeConfig: {
    internalApiUrl?: string;
    serverSecret: string;
    databaseConnectionString?: string;
    redisUrl?: string;
  };
  /** Public runtime configuration */
  publicRuntimeConfig: {
    apiUrl: string;
    version: string;
    basePath: string;
    appName: string;
  };
  /** Image optimization */
  images: {
    domains: string[];
    formats: string[];
    deviceSizes: number[];
    imageSizes: number[];
    unoptimized: boolean;
  };
  /** Experimental features */
  experimental: {
    reactCompiler: boolean;
    ppr: boolean; // Partial Prerendering
    turbo: boolean;
    serverComponents: boolean;
  };
  /** Build configuration */
  build: {
    distDir: string;
    generateEtags: boolean;
    poweredByHeader: boolean;
    compress: boolean;
  };
}

/**
 * Deployment Configuration
 * Environment-specific deployment settings
 */
export interface DeploymentConfig {
  /** Deployment environment */
  environment: 'development' | 'staging' | 'production';
  /** Platform-specific settings */
  platform: 'vercel' | 'aws' | 'docker' | 'static';
  /** CDN configuration */
  cdn: {
    enabled: boolean;
    domain?: string;
    caching: {
      staticFiles: number;
      dynamicContent: number;
      api: number;
    };
  };
  /** Monitoring and logging */
  monitoring: {
    enabled: boolean;
    provider?: 'sentry' | 'datadog' | 'newrelic';
    sampleRate: number;
  };
  /** Health check configuration */
  healthCheck: {
    enabled: boolean;
    path: string;
    timeout: number;
  };
}

/**
 * Complete Application Configuration
 * Combines all configuration types
 */
export interface AppConfig {
  /** Client-side configuration */
  client: ClientConfig;
  /** Server-side configuration */
  server: ServerConfig;
  /** Build configuration */
  build: BuildConfig;
  /** API endpoints */
  api: ApiEndpointConfig;
  /** Feature flags */
  features: FeatureFlagConfig;
  /** Database settings */
  database: DatabaseConfig;
  /** Security settings */
  security: SecurityConfig;
  /** Performance settings */
  performance: PerformanceConfig;
  /** Next.js configuration */
  nextjs: NextJSConfig;
  /** Deployment configuration */
  deployment: DeploymentConfig;
}

// =============================================================================
// DEFAULT CONFIGURATIONS
// =============================================================================

/**
 * Default API Endpoint Configuration
 */
export const defaultApiConfig: ApiEndpointConfig = {
  baseUrl: '/api/v2',
  system: {
    config: '/system/config',
    info: '/system/info',
    cache: '/system/cache',
    cors: '/system/cors',
    email: '/system/email',
    lookup: '/system/lookup',
  },
  database: {
    services: '/system/service',
    schema: '/{service}/_schema',
    tables: '/{service}/_table',
    fields: '/{service}/_table/{table}/_field',
    relationships: '/{service}/_table/{table}/_related',
  },
  auth: {
    login: '/user/session',
    logout: '/user/session',
    refresh: '/user/session',
    profile: '/user/profile',
    register: '/user/register',
    reset: '/user/password',
  },
  users: {
    list: '/system/user',
    create: '/system/user',
    update: '/system/user/{id}',
    delete: '/system/user/{id}',
    roles: '/system/user/{id}/role',
  },
  admins: {
    list: '/system/admin',
    create: '/system/admin',
    update: '/system/admin/{id}',
    delete: '/system/admin/{id}',
  },
  docs: {
    swagger: '/api-docs',
    openapi: '/api-docs/openapi',
  },
};

/**
 * Default Feature Flag Configuration
 */
export const defaultFeatureFlags: FeatureFlagConfig = {
  enableNewDatabaseUI: true,
  enableSchemaEnhancements: true,
  enableApiWizardV2: true,
  enableAdvancedSecurity: false,
  enableRealTimeNotifications: false,
  enableTurbopackExperimental: true,
  enableServerComponents: true,
  enablePerformanceMonitoring: true,
  enableAdvancedCaching: true,
  enableBetaFeatures: false,
};

/**
 * Default Database Configuration
 */
export const defaultDatabaseConfig: DatabaseConfig = {
  supportedTypes: ['mysql', 'postgresql', 'mongodb', 'oracle', 'snowflake', 'sqlite'],
  connectionTimeout: 30000, // 30 seconds
  maxConnections: 10,
  pool: {
    min: 0,
    max: 10,
    idle: 30000,
  },
  queryTimeout: 60000, // 60 seconds
  schemaDiscovery: {
    maxTables: 1000,
    maxFields: 100,
    timeout: 120000, // 2 minutes
  },
};

/**
 * Default Security Configuration
 */
export const defaultSecurityConfig: SecurityConfig = {
  jwt: {
    expiresIn: '1h',
    refreshExpiresIn: '7d',
    algorithm: 'HS256',
    issuer: 'dreamfactory-admin',
  },
  session: {
    timeout: 3600, // 1 hour
    cookieName: 'df-admin-session',
    secure: true,
    httpOnly: true,
    sameSite: 'strict',
  },
  cors: {
    origin: ['http://localhost:3000', 'http://localhost:80'],
    credentials: true,
    optionsSuccessStatus: 200,
  },
  rateLimit: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100,
    skipSuccessfulRequests: false,
  },
  password: {
    minLength: 8,
    requireUppercase: true,
    requireLowercase: true,
    requireNumbers: true,
    requireSymbols: false,
  },
};

/**
 * Default Performance Configuration
 */
export const defaultPerformanceConfig: PerformanceConfig = {
  cache: {
    ttl: 300000, // 5 minutes
    maxSize: 100,
    strategy: 'lru',
  },
  apiCache: {
    enabled: true,
    duration: 60000, // 1 minute
    exclude: ['/auth/', '/user/session'],
  },
  assets: {
    maxAge: 31536000, // 1 year
    compression: true,
    optimization: true,
  },
  bundle: {
    splitChunks: true,
    treeShaking: true,
    minification: true,
  },
};

// =============================================================================
// VALIDATION FUNCTIONS
// =============================================================================

/**
 * Validates client-side environment variables
 */
export function validateClientEnv(): ClientConfig {
  try {
    const env = {
      NODE_ENV: process.env.NODE_ENV,
      NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL,
      NEXT_PUBLIC_DF_API_KEY: process.env.NEXT_PUBLIC_DF_API_KEY,
      NEXT_PUBLIC_BASE_PATH: process.env.NEXT_PUBLIC_BASE_PATH,
      NEXT_PUBLIC_VERSION: process.env.NEXT_PUBLIC_VERSION,
      NEXT_PUBLIC_APP_NAME: process.env.NEXT_PUBLIC_APP_NAME,
      NEXT_PUBLIC_ENABLE_ANALYTICS: process.env.NEXT_PUBLIC_ENABLE_ANALYTICS,
      NEXT_PUBLIC_SENTRY_DSN: process.env.NEXT_PUBLIC_SENTRY_DSN,
      NEXT_PUBLIC_FEATURE_FLAGS: process.env.NEXT_PUBLIC_FEATURE_FLAGS,
    };

    return ClientEnvSchema.parse(env);
  } catch (error) {
    throw new Error(`Client environment validation failed: ${error}`);
  }
}

/**
 * Validates server-side environment variables
 * Only call this in server-side contexts
 */
export function validateServerEnv(): ServerConfig {
  if (typeof window !== 'undefined') {
    throw new Error('validateServerEnv() should only be called on the server side');
  }

  try {
    const env = {
      SERVER_SECRET: process.env.SERVER_SECRET,
      JWT_SECRET: process.env.JWT_SECRET,
      DATABASE_URL: process.env.DATABASE_URL,
      INTERNAL_API_URL: process.env.INTERNAL_API_URL,
      REDIS_URL: process.env.REDIS_URL,
      SESSION_TIMEOUT: process.env.SESSION_TIMEOUT,
      RATE_LIMIT_MAX: process.env.RATE_LIMIT_MAX,
      RATE_LIMIT_WINDOW: process.env.RATE_LIMIT_WINDOW,
      LOG_LEVEL: process.env.LOG_LEVEL,
      CORS_ORIGIN: process.env.CORS_ORIGIN,
      ENCRYPTION_KEY: process.env.ENCRYPTION_KEY,
    };

    return ServerEnvSchema.parse(env);
  } catch (error) {
    throw new Error(`Server environment validation failed: ${error}`);
  }
}

/**
 * Validates build environment variables
 */
export function validateBuildEnv(): BuildConfig {
  try {
    const env = {
      TURBO_TEAM: process.env.TURBO_TEAM,
      TURBO_TOKEN: process.env.TURBO_TOKEN,
      ANALYZE_BUNDLE: process.env.ANALYZE_BUNDLE,
      DISABLE_ESLINT: process.env.DISABLE_ESLINT,
      DISABLE_TYPE_CHECK: process.env.DISABLE_TYPE_CHECK,
      BUNDLE_ANALYZER: process.env.BUNDLE_ANALYZER,
      SOURCEMAP: process.env.SOURCEMAP,
    };

    return BuildEnvSchema.parse(env);
  } catch (error) {
    throw new Error(`Build environment validation failed: ${error}`);
  }
}

/**
 * Parses feature flags from environment variable
 */
export function parseFeatureFlags(flagsJson?: string): FeatureFlagConfig {
  if (!flagsJson) {
    return defaultFeatureFlags;
  }

  try {
    const parsed = JSON.parse(flagsJson);
    return { ...defaultFeatureFlags, ...parsed };
  } catch (error) {
    console.warn('Failed to parse feature flags, using defaults:', error);
    return defaultFeatureFlags;
  }
}

/**
 * Creates a complete application configuration
 * Validates and combines all configuration sources
 */
export function createAppConfig(): AppConfig {
  const clientConfig = validateClientEnv();
  const buildConfig = validateBuildEnv();
  
  // Only validate server config on server side
  const serverConfig = typeof window === 'undefined' ? validateServerEnv() : {} as ServerConfig;
  
  const featureFlags = parseFeatureFlags(clientConfig.NEXT_PUBLIC_FEATURE_FLAGS);

  return {
    client: clientConfig,
    server: serverConfig,
    build: buildConfig,
    api: defaultApiConfig,
    features: featureFlags,
    database: defaultDatabaseConfig,
    security: defaultSecurityConfig,
    performance: defaultPerformanceConfig,
    nextjs: {
      serverRuntimeConfig: {
        internalApiUrl: serverConfig.INTERNAL_API_URL,
        serverSecret: serverConfig.SERVER_SECRET,
        databaseConnectionString: serverConfig.DATABASE_URL,
        redisUrl: serverConfig.REDIS_URL,
      },
      publicRuntimeConfig: {
        apiUrl: clientConfig.NEXT_PUBLIC_API_URL,
        version: clientConfig.NEXT_PUBLIC_VERSION,
        basePath: clientConfig.NEXT_PUBLIC_BASE_PATH,
        appName: clientConfig.NEXT_PUBLIC_APP_NAME,
      },
      images: {
        domains: ['localhost', 'api.dreamfactory.com'],
        formats: ['image/webp', 'image/avif'],
        deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
        imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
        unoptimized: false,
      },
      experimental: {
        reactCompiler: true,
        ppr: true,
        turbo: featureFlags.enableTurbopackExperimental,
        serverComponents: featureFlags.enableServerComponents,
      },
      build: {
        distDir: 'dist',
        generateEtags: true,
        poweredByHeader: false,
        compress: true,
      },
    },
    deployment: {
      environment: clientConfig.NODE_ENV as 'development' | 'staging' | 'production',
      platform: 'vercel', // Default platform, can be overridden
      cdn: {
        enabled: clientConfig.NODE_ENV === 'production',
        caching: {
          staticFiles: 31536000, // 1 year
          dynamicContent: 0,
          api: 300, // 5 minutes
        },
      },
      monitoring: {
        enabled: clientConfig.NEXT_PUBLIC_ENABLE_ANALYTICS,
        sampleRate: 0.1,
      },
      healthCheck: {
        enabled: true,
        path: '/api/health',
        timeout: 5000,
      },
    },
  };
}

// =============================================================================
// TYPE GUARDS AND UTILITIES
// =============================================================================

/**
 * Type guard to check if we're in a server environment
 */
export function isServerSide(): boolean {
  return typeof window === 'undefined';
}

/**
 * Type guard to check if we're in a client environment
 */
export function isClientSide(): boolean {
  return typeof window !== 'undefined';
}

/**
 * Type guard to check if we're in development mode
 */
export function isDevelopment(config: ClientConfig): boolean {
  return config.NODE_ENV === 'development';
}

/**
 * Type guard to check if we're in production mode
 */
export function isProduction(config: ClientConfig): boolean {
  return config.NODE_ENV === 'production';
}

/**
 * Utility to get environment-specific API URL
 */
export function getApiUrl(config: ClientConfig): string {
  return config.NEXT_PUBLIC_API_URL;
}

/**
 * Utility to construct full API endpoint URL
 */
export function buildApiEndpoint(config: AppConfig, endpoint: string): string {
  const baseUrl = config.client.NEXT_PUBLIC_API_URL;
  const apiBase = config.api.baseUrl;
  return `${baseUrl}${apiBase}${endpoint}`;
}

/**
 * Utility to check if a feature flag is enabled
 */
export function isFeatureEnabled(config: AppConfig, feature: keyof FeatureFlagConfig): boolean {
  return config.features[feature];
}

// Export all types for external use
export type {
  ClientConfig,
  ServerConfig,
  BuildConfig,
  ApiEndpointConfig,
  FeatureFlagConfig,
  DatabaseConfig,
  SecurityConfig,
  PerformanceConfig,
  NextJSConfig,
  DeploymentConfig,
  AppConfig,
};