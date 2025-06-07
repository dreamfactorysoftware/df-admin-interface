/**
 * Production Environment Configuration for Next.js DreamFactory Admin Interface
 * 
 * This file provides production-specific environment configuration that transforms
 * from Angular's environment object pattern to Next.js environment variable pattern
 * while maintaining backward compatibility and proper client/server separation.
 * 
 * Key Features:
 * - Production-specific SSR optimization settings
 * - Secure environment variable scoping with client/server separation
 * - DreamFactory API configuration with runtime validation
 * - Production flag maintenance for conditional logic
 * - Next.js-compatible configuration patterns
 */

// Production environment configuration object (backward compatibility)
export const environment = {
  production: true,
  dfAdminApiKey: process.env.NEXT_PUBLIC_DF_ADMIN_API_KEY || '',
  dfApiDocsApiKey: process.env.NEXT_PUBLIC_DF_API_DOCS_API_KEY || '',
  dfFileManagerApiKey: process.env.NEXT_PUBLIC_DF_FILE_MANAGER_API_KEY || '',
};

/**
 * Production Environment Variable Configuration
 * Implements proper client/server separation per Next.js security requirements
 */
export const productionConfig = {
  // Core environment settings
  production: true,
  nodeEnv: 'production' as const,
  
  // Client-side accessible configuration (NEXT_PUBLIC_ prefix)
  client: {
    // DreamFactory API endpoints and configuration
    apiUrl: process.env.NEXT_PUBLIC_API_URL || 'https://api.dreamfactory.com',
    basePath: process.env.NEXT_PUBLIC_BASE_PATH || '/dreamfactory/dist',
    version: process.env.NEXT_PUBLIC_VERSION || '1.0.0',
    
    // DreamFactory API keys for client-side operations
    dfAdminApiKey: process.env.NEXT_PUBLIC_DF_ADMIN_API_KEY || '',
    dfApiDocsApiKey: process.env.NEXT_PUBLIC_DF_API_DOCS_API_KEY || '',
    dfFileManagerApiKey: process.env.NEXT_PUBLIC_DF_FILE_MANAGER_API_KEY || '',
    
    // Production features and flags
    enableAnalytics: process.env.NEXT_PUBLIC_ENABLE_ANALYTICS === 'true',
    enableErrorReporting: process.env.NEXT_PUBLIC_ENABLE_ERROR_REPORTING === 'true',
    enablePerformanceMonitoring: process.env.NEXT_PUBLIC_ENABLE_PERFORMANCE_MONITORING === 'true',
    
    // SSR and performance optimization settings
    enableSSR: true,
    enableStaticOptimization: true,
    enableImageOptimization: true,
    
    // Security and compliance settings
    enforceHTTPS: true,
    enableCSP: true,
    enableCORS: process.env.NEXT_PUBLIC_ENABLE_CORS === 'true',
  },
  
  // Server-side only configuration (not exposed to client)
  server: {
    // Internal API configuration for server-side operations
    internalApiUrl: process.env.INTERNAL_API_URL,
    serverSecret: process.env.SERVER_SECRET,
    jwtSecret: process.env.JWT_SECRET,
    csrfSecret: process.env.CSRF_SECRET,
    
    // Database configuration for server operations
    databaseUrl: process.env.DATABASE_URL,
    redisUrl: process.env.REDIS_URL,
    
    // External service configuration
    analyticsSecret: process.env.ANALYTICS_SECRET,
    errorReportingApiKey: process.env.ERROR_REPORTING_API_KEY,
    
    // Production optimization settings
    enableBundleAnalyzer: process.env.ANALYZE === 'true',
    enableSourceMaps: process.env.ENABLE_SOURCE_MAPS === 'true',
    enableDebugLogging: process.env.ENABLE_DEBUG_LOGGING === 'true',
    
    // SSR performance configuration
    ssrTimeout: parseInt(process.env.SSR_TIMEOUT || '5000', 10),
    cacheTimeout: parseInt(process.env.CACHE_TIMEOUT || '300', 10),
    maxConcurrentRequests: parseInt(process.env.MAX_CONCURRENT_REQUESTS || '100', 10),
  },
};

/**
 * Production API Configuration Validation
 * Validates required environment variables and throws descriptive errors for missing values
 */
export function validateProductionEnvironment(): void {
  const requiredClientVars = [
    'NEXT_PUBLIC_API_URL',
    'NEXT_PUBLIC_DF_ADMIN_API_KEY',
  ];
  
  const requiredServerVars = [
    'SERVER_SECRET',
    'JWT_SECRET',
    'CSRF_SECRET',
  ];
  
  const missingClientVars: string[] = [];
  const missingServerVars: string[] = [];
  
  // Validate client-side environment variables
  for (const varName of requiredClientVars) {
    if (!process.env[varName]) {
      missingClientVars.push(varName);
    }
  }
  
  // Validate server-side environment variables (only in server context)
  if (typeof window === 'undefined') {
    for (const varName of requiredServerVars) {
      if (!process.env[varName]) {
        missingServerVars.push(varName);
      }
    }
  }
  
  // Report missing variables with actionable error messages
  if (missingClientVars.length > 0) {
    throw new Error(
      `Missing required client environment variables for production:\n` +
      `${missingClientVars.map(v => `  - ${v}`).join('\n')}\n\n` +
      `Please ensure these variables are set in your production environment:\n` +
      `- In Vercel: Use the Environment Variables section in project settings\n` +
      `- In Docker: Pass via docker run -e or docker-compose environment section\n` +
      `- In CI/CD: Set as encrypted secrets in your pipeline configuration`
    );
  }
  
  if (missingServerVars.length > 0) {
    throw new Error(
      `Missing required server environment variables for production:\n` +
      `${missingServerVars.map(v => `  - ${v}`).join('\n')}\n\n` +
      `These variables must be set securely and not exposed to the client:\n` +
      `- Generate strong random values for secrets (minimum 32 characters)\n` +
      `- Use environment-specific secret management systems\n` +
      `- Never commit these values to version control`
    );
  }
}

/**
 * Runtime Environment Variable Resolution
 * Provides type-safe access to environment variables with fallbacks
 */
export function getProductionConfig() {
  // Validate environment before returning configuration
  validateProductionEnvironment();
  
  return {
    ...productionConfig,
    // Runtime feature flags based on environment
    features: {
      enableDatabaseConnectionPooling: productionConfig.server.databaseUrl !== undefined,
      enableRedisCache: productionConfig.server.redisUrl !== undefined,
      enableAdvancedMonitoring: productionConfig.client.enablePerformanceMonitoring && 
                               productionConfig.server.analyticsSecret !== undefined,
      enableSecureHeaders: productionConfig.client.enforceHTTPS && productionConfig.client.enableCSP,
    },
    
    // Production SSR optimization settings
    ssr: {
      enabled: productionConfig.client.enableSSR,
      timeout: productionConfig.server.ssrTimeout,
      cacheEnabled: true,
      cacheTimeout: productionConfig.server.cacheTimeout,
      compressionEnabled: true,
      minifyHTML: true,
      inlineCSS: true,
      preloadResources: true,
    },
    
    // Asset optimization settings for production
    assets: {
      enableImageOptimization: productionConfig.client.enableImageOptimization,
      enableStaticOptimization: productionConfig.client.enableStaticOptimization,
      enableGzipCompression: true,
      enableBrotliCompression: true,
      maxAge: 31536000, // 1 year cache for static assets
      cdnDomain: process.env.NEXT_PUBLIC_CDN_DOMAIN,
    },
    
    // Security configuration for production deployment
    security: {
      enforceHTTPS: productionConfig.client.enforceHTTPS,
      enableCSP: productionConfig.client.enableCSP,
      enableHSTS: true,
      enableXSSProtection: true,
      enableContentTypeOptions: true,
      enableReferrerPolicy: true,
      allowedDomains: [
        'api.dreamfactory.com',
        ...(process.env.NEXT_PUBLIC_ALLOWED_DOMAINS?.split(',') || []),
      ],
    },
  };
}

/**
 * Production Performance Monitoring Configuration
 * Configures monitoring and observability for production deployment
 */
export const productionMonitoring = {
  // Core Web Vitals monitoring
  webVitals: {
    enabled: productionConfig.client.enablePerformanceMonitoring,
    reportingEndpoint: process.env.NEXT_PUBLIC_WEB_VITALS_ENDPOINT,
    sampleRate: parseFloat(process.env.NEXT_PUBLIC_PERFORMANCE_SAMPLE_RATE || '0.1'),
  },
  
  // Error tracking and reporting
  errorReporting: {
    enabled: productionConfig.client.enableErrorReporting,
    apiKey: productionConfig.server.errorReportingApiKey,
    sampleRate: parseFloat(process.env.ERROR_REPORTING_SAMPLE_RATE || '1.0'),
    ignoreErrors: [
      'Network request failed',
      'Script error',
      'Non-Error promise rejection captured',
    ],
  },
  
  // Analytics and user behavior tracking
  analytics: {
    enabled: productionConfig.client.enableAnalytics,
    trackingId: process.env.NEXT_PUBLIC_ANALYTICS_TRACKING_ID,
    enableEcommerce: false,
    enableUserTiming: true,
    enableSiteSpeedSampling: true,
    siteSpeedSampleRate: 10,
  },
  
  // Server-side performance monitoring
  serverMetrics: {
    enabled: typeof window === 'undefined',
    metricsEndpoint: process.env.METRICS_ENDPOINT,
    collectInterval: parseInt(process.env.METRICS_COLLECT_INTERVAL || '60000', 10),
    enableMemoryMetrics: true,
    enableCPUMetrics: true,
    enableDatabaseMetrics: productionConfig.server.databaseUrl !== undefined,
  },
};

/**
 * Production Build Information
 * Provides build-time and runtime metadata for debugging and monitoring
 */
export const productionBuildInfo = {
  version: productionConfig.client.version,
  buildTime: process.env.BUILD_TIME || new Date().toISOString(),
  gitCommit: process.env.NEXT_PUBLIC_GIT_COMMIT || 'unknown',
  gitBranch: process.env.NEXT_PUBLIC_GIT_BRANCH || 'unknown',
  nodeVersion: process.version,
  nextVersion: process.env.NEXT_PUBLIC_NEXT_VERSION || 'unknown',
  deploymentUrl: process.env.NEXT_PUBLIC_DEPLOYMENT_URL,
  environment: 'production',
  
  // Feature flags for production deployment
  features: {
    turbopack: true,
    reactCompiler: true,
    partialPrerendering: true,
    serverComponents: true,
    appDirectory: true,
    imageOptimization: productionConfig.client.enableImageOptimization,
    staticOptimization: productionConfig.client.enableStaticOptimization,
  },
};

// Validate environment on module load for early error detection
if (process.env.NODE_ENV === 'production') {
  try {
    validateProductionEnvironment();
  } catch (error) {
    // Log validation errors for production deployment debugging
    console.error('Production environment validation failed:', error);
    
    // In production, we want to fail fast if configuration is invalid
    if (process.env.FAIL_FAST_ON_CONFIG_ERROR !== 'false') {
      throw error;
    }
  }
}

// Export backward-compatible default for existing Angular imports
export default environment;