/**
 * Next.js Production Environment Configuration
 * 
 * Transforms from Angular environment object to Next.js production configuration
 * per Section 8.2.3 migration strategy. Implements production-specific environment
 * variable scoping with proper client/server separation per security requirements.
 * 
 * Key Features:
 * - Production-specific SSR optimization settings
 * - Environment variable validation and runtime resolution
 * - Client/server variable separation with NEXT_PUBLIC_ prefix
 * - DreamFactory API configuration compatibility
 * - Production flag and build optimization settings
 */

/**
 * Production environment configuration object
 * Maintains Angular environment.production pattern while adapting to Next.js
 */
export const environment = {
  production: true,
  
  // Client-side accessible variables (NEXT_PUBLIC_ prefix for Next.js client access)
  apiUrl: process.env.NEXT_PUBLIC_API_URL || 'https://api.dreamfactory.com',
  basePath: process.env.NEXT_PUBLIC_BASE_PATH || '/dreamfactory/dist',
  version: process.env.NEXT_PUBLIC_VERSION || '1.0.0',
  
  // DreamFactory API keys - client-accessible for frontend operations
  dfAdminApiKey: process.env.NEXT_PUBLIC_DF_ADMIN_API_KEY || '',
  dfApiDocsApiKey: process.env.NEXT_PUBLIC_DF_API_DOCS_API_KEY || '',
  dfFileManagerApiKey: process.env.NEXT_PUBLIC_DF_FILE_MANAGER_API_KEY || '',
  
  // Production-specific SSR optimization flags
  enableSSR: true,
  enableStaticExport: true,
  enableImageOptimization: true,
  enableAnalytics: true,
  
  // Build and performance configuration
  buildConfig: {
    enableTurbopack: true,
    enableReactCompiler: true,
    enablePartialPrerendering: true,
    enableServerComponents: true,
  },
  
  // Security configuration for production
  security: {
    enableCSP: true,
    enableHSTS: true,
    enableSecurityHeaders: true,
    frameDeny: true,
  },
} as const;

/**
 * Server-only environment variables (no NEXT_PUBLIC_ prefix)
 * These are not exposed to the client and only available server-side
 */
export const serverConfig = {
  // Server-only runtime variables for production
  serverSecret: process.env.SERVER_SECRET,
  jwtSecret: process.env.JWT_SECRET,
  internalApiUrl: process.env.INTERNAL_API_URL,
  databaseUrl: process.env.DATABASE_URL,
  
  // Production logging and monitoring
  logLevel: process.env.LOG_LEVEL || 'error',
  enableMetrics: process.env.ENABLE_METRICS === 'true',
  enableTracing: process.env.ENABLE_TRACING === 'true',
} as const;

/**
 * Production environment variable validation function
 * Ensures all required environment variables are present during build time
 * per Section 8.2.3 validation requirements
 */
export function validateProductionEnvironment(): void {
  const requiredClientVars = [
    'NEXT_PUBLIC_API_URL',
    'NEXT_PUBLIC_DF_ADMIN_API_KEY',
    'NEXT_PUBLIC_DF_API_DOCS_API_KEY',
    'NEXT_PUBLIC_DF_FILE_MANAGER_API_KEY',
  ];
  
  const requiredServerVars = [
    'SERVER_SECRET',
    'JWT_SECRET',
  ];
  
  // Validate client-side variables
  for (const varName of requiredClientVars) {
    if (!process.env[varName]) {
      throw new Error(`Missing required production client environment variable: ${varName}`);
    }
  }
  
  // Validate server-side variables (only in server context)
  if (typeof window === 'undefined') {
    for (const varName of requiredServerVars) {
      if (!process.env[varName]) {
        throw new Error(`Missing required production server environment variable: ${varName}`);
      }
    }
  }
  
  // Production-specific validations
  if (environment.production) {
    // Ensure production API URL is HTTPS
    if (environment.apiUrl && !environment.apiUrl.startsWith('https://')) {
      console.warn('Warning: Production API URL should use HTTPS');
    }
    
    // Validate API keys are not empty in production
    if (!environment.dfAdminApiKey) {
      console.warn('Warning: DreamFactory Admin API key is empty in production');
    }
    
    if (!environment.dfApiDocsApiKey) {
      console.warn('Warning: DreamFactory API Docs API key is empty in production');
    }
    
    if (!environment.dfFileManagerApiKey) {
      console.warn('Warning: DreamFactory File Manager API key is empty in production');
    }
  }
}

/**
 * Runtime environment configuration getter
 * Provides centralized access to all configuration values with validation
 */
export function getProductionConfig() {
  // Validate environment on access
  validateProductionEnvironment();
  
  return {
    ...environment,
    server: serverConfig,
    
    // Runtime computed values
    isDevelopment: false,
    isProduction: true,
    isTest: false,
    
    // API endpoints derived from base configuration
    endpoints: {
      api: `${environment.apiUrl}/api/v2`,
      system: `${environment.apiUrl}/system/api/v2`,
      auth: `${environment.apiUrl}/api/v2/user/session`,
    },
    
    // Feature flags for production
    features: {
      enableDatabaseService: true,
      enableSchemaDiscovery: true,
      enableApiGeneration: true,
      enableFileManager: true,
      enableUserManagement: true,
      enableRoleManagement: true,
      enableSystemSettings: true,
    },
  };
}

/**
 * Type definitions for environment configuration
 * Ensures type safety throughout the application
 */
export type ProductionEnvironment = typeof environment;
export type ServerConfig = typeof serverConfig;
export type ProductionConfig = ReturnType<typeof getProductionConfig>;

// Default export for compatibility with existing imports
export default environment;