/**
 * System and environment configuration types for DreamFactory Admin Interface
 * 
 * This module provides comprehensive type definitions for Next.js runtime configuration,
 * environment variable management, and system deployment patterns. Designed to support
 * the transition from Angular environment patterns to Next.js runtime configuration
 * with enhanced security through server/client environment separation.
 * 
 * @fileoverview Environment and system configuration types adapted for Next.js
 * @version 1.0.0
 */

import { z } from 'zod';
import type { ServiceType } from './service';

// =============================================================================
// NEXT.JS ENVIRONMENT CONFIGURATION TYPES
// =============================================================================

/**
 * Environment types supported in Next.js runtime configuration
 * Maps to NODE_ENV values with additional deployment environment context
 */
export type EnvironmentMode = 'development' | 'staging' | 'production' | 'test';

/**
 * Build-time vs runtime environment differentiation
 * Supports Next.js build-time optimization and runtime configuration
 */
export type ConfigurationPhase = 'build' | 'runtime';

/**
 * Client vs server environment separation for Next.js applications
 * Ensures proper variable exposure based on execution context
 */
export type ExecutionContext = 'client' | 'server' | 'edge';

/**
 * Next.js environment variable accessibility patterns
 * Controls variable exposure to client-side JavaScript bundles
 */
export interface EnvironmentVariableConfig {
  /**
   * Client-accessible variables (prefixed with NEXT_PUBLIC_)
   * Exposed to browser environment during build process
   */
  client: Record<string, string>;
  
  /**
   * Server-only variables for backend operations
   * Available only in server-side code and API routes
   */
  server: Record<string, string>;
  
  /**
   * Edge runtime variables for middleware operations
   * Available in Next.js middleware at the edge
   */
  edge: Record<string, string>;
  
  /**
   * Build-time variables for static generation
   * Available during Next.js build process only
   */
  build: Record<string, string>;
}

/**
 * Next.js runtime configuration interface
 * Replaces Angular environment.ts patterns with Next.js configuration
 */
export interface NextEnvironmentConfig {
  /**
   * Environment mode for conditional logic
   */
  mode: EnvironmentMode;
  
  /**
   * Configuration phase context
   */
  phase: ConfigurationPhase;
  
  /**
   * Current execution context
   */
  context: ExecutionContext;
  
  /**
   * Environment variables organized by accessibility
   */
  variables: EnvironmentVariableConfig;
  
  /**
   * Feature flags for environment-specific functionality
   */
  features: FeatureFlags;
  
  /**
   * Security configuration for the current environment
   */
  security: SecurityConfiguration;
  
  /**
   * Performance and optimization settings
   */
  performance: PerformanceConfiguration;
  
  /**
   * Monitoring and observability configuration
   */
  observability: ObservabilityConfiguration;
}

// =============================================================================
// FEATURE FLAGS AND CONFIGURATION
// =============================================================================

/**
 * Feature flags for environment-specific functionality
 * Supports Next.js runtime feature toggling and A/B testing
 */
export interface FeatureFlags {
  /**
   * Development-specific features
   */
  development: {
    enableMockServiceWorker: boolean;
    enableReactDevTools: boolean;
    enableDebugLogging: boolean;
    enableHotReload: boolean;
    enableSourceMaps: boolean;
  };
  
  /**
   * Testing environment features
   */
  testing: {
    enableTestDataFixtures: boolean;
    enableApiMocking: boolean;
    enableCoverageReporting: boolean;
    enableVisualTesting: boolean;
  };
  
  /**
   * Production environment features
   */
  production: {
    enableAnalytics: boolean;
    enableErrorReporting: boolean;
    enablePerformanceMonitoring: boolean;
    enableSecurityHeaders: boolean;
    enableStaticOptimization: boolean;
  };
  
  /**
   * Experimental features across environments
   */
  experimental: {
    enableTurbopack: boolean;
    enableServerComponents: boolean;
    enableEdgeRuntime: boolean;
    enableIncrementalStaticRegeneration: boolean;
  };
}

/**
 * Security configuration for Next.js runtime environment
 * Supports middleware-based security enforcement
 */
export interface SecurityConfiguration {
  /**
   * JWT token configuration for authentication
   */
  jwt: {
    secretKey: string;
    expirationTime: string;
    refreshThreshold: number;
    algorithm: 'HS256' | 'HS384' | 'HS512' | 'RS256' | 'RS384' | 'RS512';
  };
  
  /**
   * API security configuration
   */
  api: {
    rateLimiting: {
      enabled: boolean;
      maxRequests: number;
      timeWindow: number;
      skipSuccessfulRequests: boolean;
    };
    corsSettings: {
      allowedOrigins: string[];
      allowedMethods: string[];
      allowedHeaders: string[];
      credentialsSupport: boolean;
    };
  };
  
  /**
   * Session management configuration
   */
  session: {
    cookieName: string;
    cookieSecure: boolean;
    cookieHttpOnly: boolean;
    cookieSameSite: 'strict' | 'lax' | 'none';
    sessionTimeout: number;
    enableAutoRefresh: boolean;
  };
  
  /**
   * Content Security Policy configuration
   */
  contentSecurityPolicy: {
    enabled: boolean;
    directives: Record<string, string[]>;
    reportOnly: boolean;
    reportUri?: string;
  };
}

/**
 * Performance configuration for Next.js optimization
 * Supports Turbopack and modern build optimizations
 */
export interface PerformanceConfiguration {
  /**
   * Build optimization settings
   */
  build: {
    enableTurbopack: boolean;
    enableSWCMinification: boolean;
    enableTreeShaking: boolean;
    enableCodeSplitting: boolean;
    chunkSizeLimit: number;
  };
  
  /**
   * Runtime performance settings
   */
  runtime: {
    enableServerSideRendering: boolean;
    enableStaticGeneration: boolean;
    enableIncrementalStaticRegeneration: boolean;
    revalidationInterval: number;
  };
  
  /**
   * Caching configuration
   */
  caching: {
    enableBrowserCaching: boolean;
    enableCDNCaching: boolean;
    enableAPIResponseCaching: boolean;
    defaultCacheDuration: number;
    staticAssetCacheDuration: number;
  };
  
  /**
   * Bundle optimization settings
   */
  bundling: {
    enableCompression: boolean;
    compressionAlgorithm: 'gzip' | 'brotli';
    enableSourceMaps: boolean;
    enablePolyfills: boolean;
  };
}

/**
 * Observability configuration for monitoring and logging
 * Supports Next.js SSR performance monitoring
 */
export interface ObservabilityConfiguration {
  /**
   * Logging configuration
   */
  logging: {
    level: 'debug' | 'info' | 'warn' | 'error';
    enableStructuredLogging: boolean;
    enableRequestLogging: boolean;
    enableErrorLogging: boolean;
    logRetentionDays: number;
  };
  
  /**
   * Performance monitoring configuration
   */
  performance: {
    enableWebVitals: boolean;
    enableSSRMetrics: boolean;
    enableAPIMetrics: boolean;
    enableDatabaseMetrics: boolean;
    enableCustomMetrics: boolean;
  };
  
  /**
   * Error tracking configuration
   */
  errorTracking: {
    enabled: boolean;
    provider: 'sentry' | 'bugsnag' | 'rollbar' | 'custom';
    apiKey?: string;
    environment: string;
    sampleRate: number;
  };
  
  /**
   * Analytics configuration
   */
  analytics: {
    enabled: boolean;
    provider: 'google' | 'adobe' | 'mixpanel' | 'custom';
    trackingId?: string;
    enableUserTracking: boolean;
    enableEventTracking: boolean;
  };
}

// =============================================================================
// AUTHENTICATION AND AUTHORIZATION TYPES
// =============================================================================

/**
 * React authentication provider types for Next.js middleware
 * Replaces Angular guard patterns with React provider architecture
 */
export type ReactAuthProvider = 
  | 'next-auth'
  | 'clerk'
  | 'auth0'
  | 'firebase'
  | 'supabase'
  | 'custom-jwt'
  | 'oauth2'
  | 'saml';

/**
 * Authentication service configuration for React providers
 * Supports Next.js middleware integration patterns
 */
export interface AuthenticationServiceConfig {
  /**
   * Primary authentication provider
   */
  provider: ReactAuthProvider;
  
  /**
   * Provider-specific configuration
   */
  config: {
    /**
     * Client ID for OAuth providers
     */
    clientId?: string;
    
    /**
     * Client secret (server-side only)
     */
    clientSecret?: string;
    
    /**
     * OAuth scopes for authentication
     */
    scopes?: string[];
    
    /**
     * Redirect URLs for OAuth flow
     */
    redirectUrl?: string;
    callbackUrl?: string;
    
    /**
     * Custom provider endpoints
     */
    endpoints?: {
      authorization?: string;
      token?: string;
      userInfo?: string;
      logout?: string;
    };
  };
  
  /**
   * Session configuration
   */
  session: {
    strategy: 'jwt' | 'database';
    maxAge: number;
    updateAge: number;
    generateSessionToken?: () => string;
  };
  
  /**
   * Security settings
   */
  security: {
    enableCSRFProtection: boolean;
    enableStateValidation: boolean;
    enablePKCE: boolean;
    enableJWTEncryption: boolean;
  };
}

/**
 * Role-based access control configuration
 * Integrates with Next.js middleware for route protection
 */
export interface RBACConfiguration {
  /**
   * Default role for new users
   */
  defaultRole: string;
  
  /**
   * Role hierarchy definition
   */
  roleHierarchy: Record<string, string[]>;
  
  /**
   * Permission mappings
   */
  permissions: Record<string, string[]>;
  
  /**
   * Route-based access control
   */
  routePermissions: Record<string, string[]>;
  
  /**
   * Service-based access control
   */
  servicePermissions: Record<ServiceType, string[]>;
}

// =============================================================================
// PLATFORM DEPLOYMENT METADATA
// =============================================================================

/**
 * Next.js deployment platform types
 * Supports various hosting and deployment strategies
 */
export type DeploymentPlatform = 
  | 'vercel'
  | 'netlify'
  | 'aws-amplify'
  | 'docker'
  | 'kubernetes'
  | 'cloudflare-pages'
  | 'self-hosted';

/**
 * Deployment strategy for Next.js applications
 * Controls build and runtime optimization strategies
 */
export type DeploymentStrategy = 
  | 'static-export'
  | 'server-side-rendering'
  | 'edge-runtime'
  | 'hybrid'
  | 'serverless';

/**
 * Platform deployment metadata for Next.js patterns
 * Replaces Angular deployment configuration with Next.js specifics
 */
export interface PlatformDeploymentMetadata {
  /**
   * Target deployment platform
   */
  platform: DeploymentPlatform;
  
  /**
   * Deployment strategy
   */
  strategy: DeploymentStrategy;
  
  /**
   * Environment-specific configuration
   */
  environment: EnvironmentMode;
  
  /**
   * Build configuration
   */
  build: {
    outputDirectory: string;
    buildCommand: string;
    installCommand: string;
    nodeVersion: string;
    enableTurbopack: boolean;
  };
  
  /**
   * Runtime configuration
   */
  runtime: {
    nodeRuntime: string;
    enableEdgeRuntime: boolean;
    memoryLimit: number;
    timeoutLimit: number;
    regions: string[];
  };
  
  /**
   * Networking configuration
   */
  networking: {
    customDomains: string[];
    enableHTTPS: boolean;
    enableHTTP2: boolean;
    enableCompression: boolean;
    enableCaching: boolean;
  };
  
  /**
   * Environment variables for deployment
   */
  environmentVariables: EnvironmentVariableConfig;
  
  /**
   * Scaling configuration
   */
  scaling: {
    enableAutoScaling: boolean;
    minInstances: number;
    maxInstances: number;
    concurrencyLimit: number;
  };
}

// =============================================================================
// CLIENT-SIDE REQUEST CONTEXT
// =============================================================================

/**
 * Client-side request context for React application patterns
 * Replaces Angular HTTP interceptor patterns with React request context
 */
export interface ClientRequestContext {
  /**
   * Request identification
   */
  requestId: string;
  
  /**
   * Execution context
   */
  context: ExecutionContext;
  
  /**
   * Authentication context
   */
  authentication: {
    isAuthenticated: boolean;
    accessToken?: string;
    refreshToken?: string;
    tokenExpiration?: Date;
    userRoles: string[];
    permissions: string[];
  };
  
  /**
   * Session context
   */
  session: {
    sessionId: string;
    userId?: string;
    userAgent: string;
    ipAddress?: string;
    locale: string;
    timezone: string;
  };
  
  /**
   * Application context
   */
  application: {
    version: string;
    environment: EnvironmentMode;
    buildId: string;
    deploymentId: string;
    features: string[];
  };
  
  /**
   * Request metadata
   */
  request: {
    timestamp: Date;
    method: string;
    url: string;
    headers: Record<string, string>;
    correlationId: string;
    traceId?: string;
  };
  
  /**
   * Performance tracking
   */
  performance: {
    startTime: number;
    navigationTiming?: PerformanceNavigationTiming;
    resourceTiming?: PerformanceResourceTiming[];
    marks: PerformanceMark[];
    measures: PerformanceMeasure[];
  };
}

/**
 * Request interceptor configuration for React patterns
 * Provides middleware-like functionality for client-side requests
 */
export interface RequestInterceptorConfig {
  /**
   * Authentication interceptor
   */
  authentication: {
    enabled: boolean;
    autoRefreshTokens: boolean;
    redirectOnUnauthorized: boolean;
    includeCredentials: boolean;
  };
  
  /**
   * Error handling interceptor
   */
  errorHandling: {
    enabled: boolean;
    retryAttempts: number;
    retryDelay: number;
    exponentialBackoff: boolean;
    logErrors: boolean;
  };
  
  /**
   * Performance monitoring interceptor
   */
  performance: {
    enabled: boolean;
    trackRequestTiming: boolean;
    trackNetworkTiming: boolean;
    enableWebVitals: boolean;
  };
  
  /**
   * Caching interceptor
   */
  caching: {
    enabled: boolean;
    defaultCacheDuration: number;
    enableETags: boolean;
    enableConditionalRequests: boolean;
  };
}

// =============================================================================
// SYSTEM INFORMATION AND METADATA
// =============================================================================

/**
 * System information interface for runtime diagnostics
 * Provides comprehensive system state for monitoring and debugging
 */
export interface SystemInformation {
  /**
   * Application metadata
   */
  application: {
    name: string;
    version: string;
    buildNumber: string;
    buildDate: Date;
    gitCommit: string;
    gitBranch: string;
  };
  
  /**
   * Runtime environment information
   */
  runtime: {
    nodeVersion: string;
    nextjsVersion: string;
    reactVersion: string;
    typescriptVersion: string;
    platform: string;
    architecture: string;
  };
  
  /**
   * Deployment information
   */
  deployment: {
    platform: DeploymentPlatform;
    strategy: DeploymentStrategy;
    environment: EnvironmentMode;
    region?: string;
    instanceId?: string;
    deploymentId: string;
  };
  
  /**
   * Performance metrics
   */
  performance: {
    uptime: number;
    memoryUsage: {
      total: number;
      used: number;
      free: number;
    };
    cpuUsage?: number;
    responseTime: {
      average: number;
      p95: number;
      p99: number;
    };
  };
  
  /**
   * Feature status
   */
  features: {
    serverSideRendering: boolean;
    edgeRuntime: boolean;
    turbopack: boolean;
    staticOptimization: boolean;
    middleware: boolean;
  };
}

/**
 * Health check configuration for system monitoring
 * Supports Next.js API routes for health endpoints
 */
export interface HealthCheckConfiguration {
  /**
   * Health check endpoints
   */
  endpoints: {
    health: string;
    ready: string;
    live: string;
    metrics: string;
  };
  
  /**
   * Check intervals
   */
  intervals: {
    healthCheck: number;
    readinessCheck: number;
    livenessCheck: number;
    metricsCollection: number;
  };
  
  /**
   * Timeout configurations
   */
  timeouts: {
    healthCheck: number;
    databaseCheck: number;
    externalServiceCheck: number;
  };
  
  /**
   * Dependency checks
   */
  dependencies: {
    database: boolean;
    cache: boolean;
    externalAPIs: boolean;
    fileSystem: boolean;
  };
}

// =============================================================================
// ZOD VALIDATION SCHEMAS
// =============================================================================

/**
 * Zod schema for environment variable validation
 * Ensures type-safe environment configuration
 */
export const EnvironmentVariableSchema = z.object({
  // Client-side variables (NEXT_PUBLIC_ prefixed)
  NEXT_PUBLIC_API_URL: z.string().url('API URL must be valid'),
  NEXT_PUBLIC_APP_VERSION: z.string().min(1, 'App version required'),
  NEXT_PUBLIC_ENVIRONMENT: z.enum(['development', 'staging', 'production', 'test']),
  NEXT_PUBLIC_ANALYTICS_ID: z.string().optional(),
  
  // Server-side variables
  DATABASE_URL: z.string().min(1, 'Database URL required'),
  JWT_SECRET: z.string().min(32, 'JWT secret must be at least 32 characters'),
  API_SECRET_KEY: z.string().min(1, 'API secret key required'),
  ENCRYPTION_KEY: z.string().min(32, 'Encryption key must be at least 32 characters'),
  
  // Authentication provider configuration
  AUTH_PROVIDER: z.enum(['next-auth', 'clerk', 'auth0', 'firebase', 'supabase', 'custom-jwt']),
  AUTH_CLIENT_ID: z.string().optional(),
  AUTH_CLIENT_SECRET: z.string().optional(),
  
  // Performance and monitoring
  ENABLE_PERFORMANCE_MONITORING: z.boolean().default(true),
  ENABLE_ERROR_REPORTING: z.boolean().default(true),
  LOG_LEVEL: z.enum(['debug', 'info', 'warn', 'error']).default('info'),
  
  // Security configuration
  ENABLE_CSRF_PROTECTION: z.boolean().default(true),
  ENABLE_RATE_LIMITING: z.boolean().default(true),
  SESSION_TIMEOUT: z.number().default(3600),
});

/**
 * Zod schema for Next.js configuration validation
 * Validates complete Next.js environment configuration
 */
export const NextEnvironmentConfigSchema = z.object({
  mode: z.enum(['development', 'staging', 'production', 'test']),
  phase: z.enum(['build', 'runtime']),
  context: z.enum(['client', 'server', 'edge']),
  variables: z.object({
    client: z.record(z.string()),
    server: z.record(z.string()),
    edge: z.record(z.string()),
    build: z.record(z.string()),
  }),
  features: z.object({
    development: z.object({
      enableMockServiceWorker: z.boolean(),
      enableReactDevTools: z.boolean(),
      enableDebugLogging: z.boolean(),
      enableHotReload: z.boolean(),
      enableSourceMaps: z.boolean(),
    }),
    testing: z.object({
      enableTestDataFixtures: z.boolean(),
      enableApiMocking: z.boolean(),
      enableCoverageReporting: z.boolean(),
      enableVisualTesting: z.boolean(),
    }),
    production: z.object({
      enableAnalytics: z.boolean(),
      enableErrorReporting: z.boolean(),
      enablePerformanceMonitoring: z.boolean(),
      enableSecurityHeaders: z.boolean(),
      enableStaticOptimization: z.boolean(),
    }),
    experimental: z.object({
      enableTurbopack: z.boolean(),
      enableServerComponents: z.boolean(),
      enableEdgeRuntime: z.boolean(),
      enableIncrementalStaticRegeneration: z.boolean(),
    }),
  }),
});

/**
 * Zod schema for deployment metadata validation
 * Ensures valid deployment configuration
 */
export const PlatformDeploymentMetadataSchema = z.object({
  platform: z.enum(['vercel', 'netlify', 'aws-amplify', 'docker', 'kubernetes', 'cloudflare-pages', 'self-hosted']),
  strategy: z.enum(['static-export', 'server-side-rendering', 'edge-runtime', 'hybrid', 'serverless']),
  environment: z.enum(['development', 'staging', 'production', 'test']),
  build: z.object({
    outputDirectory: z.string().min(1),
    buildCommand: z.string().min(1),
    installCommand: z.string().min(1),
    nodeVersion: z.string().min(1),
    enableTurbopack: z.boolean(),
  }),
  runtime: z.object({
    nodeRuntime: z.string().min(1),
    enableEdgeRuntime: z.boolean(),
    memoryLimit: z.number().min(128),
    timeoutLimit: z.number().min(1),
    regions: z.array(z.string()),
  }),
});

// =============================================================================
// UTILITY FUNCTIONS AND HELPERS
// =============================================================================

/**
 * Environment variable accessor with type safety
 * Provides secure access to environment variables with validation
 */
export function getEnvironmentVariable(
  key: string,
  context: ExecutionContext = 'server',
  required: boolean = true
): string | undefined {
  const value = process.env[key];
  
  // Validate client-side access
  if (context === 'client' && !key.startsWith('NEXT_PUBLIC_')) {
    console.warn(`Attempted to access server-side variable '${key}' from client context`);
    return undefined;
  }
  
  // Handle required variables
  if (required && !value) {
    throw new Error(`Required environment variable '${key}' is not defined`);
  }
  
  return value;
}

/**
 * Type-safe environment configuration factory
 * Creates validated environment configuration objects
 */
export function createEnvironmentConfig(
  mode: EnvironmentMode,
  context: ExecutionContext = 'server'
): Partial<NextEnvironmentConfig> {
  const baseConfig = {
    mode,
    phase: 'runtime' as ConfigurationPhase,
    context,
    variables: {
      client: {},
      server: {},
      edge: {},
      build: {},
    },
  };
  
  // Load environment-specific variables
  Object.keys(process.env).forEach(key => {
    const value = process.env[key];
    if (!value) return;
    
    if (key.startsWith('NEXT_PUBLIC_')) {
      baseConfig.variables.client[key] = value;
    } else {
      baseConfig.variables.server[key] = value;
    }
  });
  
  return baseConfig;
}

/**
 * Authentication provider configuration factory
 * Creates type-safe authentication service configurations
 */
export function createAuthServiceConfig(
  provider: ReactAuthProvider,
  customConfig?: Partial<AuthenticationServiceConfig>
): AuthenticationServiceConfig {
  const defaultConfig: AuthenticationServiceConfig = {
    provider,
    config: {
      scopes: ['openid', 'profile', 'email'],
      redirectUrl: '/auth/callback',
      callbackUrl: '/dashboard',
    },
    session: {
      strategy: 'jwt',
      maxAge: 30 * 24 * 60 * 60, // 30 days
      updateAge: 24 * 60 * 60, // 24 hours
    },
    security: {
      enableCSRFProtection: true,
      enableStateValidation: true,
      enablePKCE: true,
      enableJWTEncryption: false,
    },
  };
  
  return {
    ...defaultConfig,
    ...customConfig,
    config: {
      ...defaultConfig.config,
      ...customConfig?.config,
    },
    session: {
      ...defaultConfig.session,
      ...customConfig?.session,
    },
    security: {
      ...defaultConfig.security,
      ...customConfig?.security,
    },
  };
}

/**
 * Deployment metadata factory for different platforms
 * Creates platform-specific deployment configurations
 */
export function createDeploymentMetadata(
  platform: DeploymentPlatform,
  environment: EnvironmentMode
): PlatformDeploymentMetadata {
  const baseMetadata: PlatformDeploymentMetadata = {
    platform,
    strategy: 'server-side-rendering',
    environment,
    build: {
      outputDirectory: '.next',
      buildCommand: 'npm run build',
      installCommand: 'npm ci',
      nodeVersion: '20.x',
      enableTurbopack: true,
    },
    runtime: {
      nodeRuntime: '20.x',
      enableEdgeRuntime: false,
      memoryLimit: 1024,
      timeoutLimit: 30,
      regions: ['auto'],
    },
    networking: {
      customDomains: [],
      enableHTTPS: true,
      enableHTTP2: true,
      enableCompression: true,
      enableCaching: true,
    },
    environmentVariables: {
      client: {},
      server: {},
      edge: {},
      build: {},
    },
    scaling: {
      enableAutoScaling: true,
      minInstances: 1,
      maxInstances: 10,
      concurrencyLimit: 1000,
    },
  };
  
  // Platform-specific overrides
  switch (platform) {
    case 'vercel':
      baseMetadata.strategy = 'serverless';
      baseMetadata.runtime.enableEdgeRuntime = true;
      break;
    
    case 'netlify':
      baseMetadata.strategy = 'static-export';
      baseMetadata.build.buildCommand = 'npm run build && npm run export';
      break;
    
    case 'docker':
      baseMetadata.strategy = 'server-side-rendering';
      baseMetadata.runtime.memoryLimit = 2048;
      break;
    
    case 'kubernetes':
      baseMetadata.scaling.minInstances = 2;
      baseMetadata.scaling.maxInstances = 50;
      break;
  }
  
  return baseMetadata;
}

/**
 * Client request context factory
 * Creates comprehensive request context for React patterns
 */
export function createClientRequestContext(
  requestId: string,
  context: ExecutionContext = 'client'
): ClientRequestContext {
  return {
    requestId,
    context,
    authentication: {
      isAuthenticated: false,
      userRoles: [],
      permissions: [],
    },
    session: {
      sessionId: '',
      userAgent: typeof window !== 'undefined' ? window.navigator.userAgent : '',
      locale: typeof window !== 'undefined' ? window.navigator.language : 'en-US',
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    },
    application: {
      version: getEnvironmentVariable('NEXT_PUBLIC_APP_VERSION', 'client', false) || '1.0.0',
      environment: (getEnvironmentVariable('NEXT_PUBLIC_ENVIRONMENT', 'client', false) as EnvironmentMode) || 'production',
      buildId: getEnvironmentVariable('NEXT_PUBLIC_BUILD_ID', 'client', false) || '',
      deploymentId: getEnvironmentVariable('NEXT_PUBLIC_DEPLOYMENT_ID', 'client', false) || '',
      features: [],
    },
    request: {
      timestamp: new Date(),
      method: 'GET',
      url: '',
      headers: {},
      correlationId: requestId,
    },
    performance: {
      startTime: Date.now(),
      marks: [],
      measures: [],
    },
  };
}

/**
 * Export all types for convenient importing
 */
export type {
  // Environment types
  EnvironmentMode,
  ConfigurationPhase,
  ExecutionContext,
  EnvironmentVariableConfig,
  NextEnvironmentConfig,
  
  // Feature and configuration types
  FeatureFlags,
  SecurityConfiguration,
  PerformanceConfiguration,
  ObservabilityConfiguration,
  
  // Authentication types
  ReactAuthProvider,
  AuthenticationServiceConfig,
  RBACConfiguration,
  
  // Deployment types
  DeploymentPlatform,
  DeploymentStrategy,
  PlatformDeploymentMetadata,
  
  // Request context types
  ClientRequestContext,
  RequestInterceptorConfig,
  
  // System information types
  SystemInformation,
  HealthCheckConfiguration,
};