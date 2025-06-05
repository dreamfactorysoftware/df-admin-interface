/**
 * Type-safe environment variable management utility for Next.js
 * 
 * Handles both client-side (NEXT_PUBLIC_) and server-side environment variable scoping
 * with runtime validation, default values, and proper separation of concerns.
 * 
 * Replaces Angular's environment.ts pattern with Next.js-compatible configuration.
 */

// Environment variable type definitions for strict typing
interface ClientEnvironmentVariables {
  // Core application environment
  readonly NODE_ENV: 'development' | 'staging' | 'production';
  readonly NEXT_PUBLIC_API_URL: string;
  readonly NEXT_PUBLIC_BASE_PATH: string;
  readonly NEXT_PUBLIC_VERSION: string;
  
  // DreamFactory API configuration - client-accessible
  readonly NEXT_PUBLIC_DF_ADMIN_API_KEY: string;
  readonly NEXT_PUBLIC_DF_API_DOCS_API_KEY: string;
  readonly NEXT_PUBLIC_DF_FILE_MANAGER_API_KEY: string;
  
  // Feature flags and configuration
  readonly NEXT_PUBLIC_ENABLE_DEBUG: boolean;
  readonly NEXT_PUBLIC_ENABLE_ANALYTICS: boolean;
}

interface ServerEnvironmentVariables {
  // Server-only security variables
  readonly JWT_SECRET: string;
  readonly SERVER_SECRET: string;
  readonly DATABASE_URL: string;
  readonly INTERNAL_API_URL: string;
  
  // Build and deployment configuration
  readonly BUILD_ID: string;
  readonly DEPLOYMENT_ENVIRONMENT: string;
}

// Combined environment configuration
type EnvironmentConfig = ClientEnvironmentVariables & Partial<ServerEnvironmentVariables>;

/**
 * Parse string environment variable to boolean
 * Handles common boolean representations in environment variables
 */
function parseBoolean(value: string | undefined, defaultValue: boolean = false): boolean {
  if (!value) return defaultValue;
  return ['true', '1', 'yes', 'on'].includes(value.toLowerCase());
}

/**
 * Get environment variable with type safety and validation
 * Throws error for required variables that are missing
 */
function getEnvVar(
  key: string, 
  defaultValue?: string, 
  required: boolean = false
): string {
  const value = process.env[key];
  
  if (required && !value) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
  
  return value || defaultValue || '';
}

/**
 * Type-safe environment configuration object
 * Separates client-accessible and server-only variables with proper scoping
 */
export const env: EnvironmentConfig = {
  // Core application environment - available on both client and server
  NODE_ENV: (process.env.NODE_ENV as 'development' | 'staging' | 'production') || 'development',
  
  // API configuration - client-accessible with NEXT_PUBLIC_ prefix
  NEXT_PUBLIC_API_URL: getEnvVar(
    'NEXT_PUBLIC_API_URL', 
    process.env.NODE_ENV === 'production' 
      ? 'https://api.dreamfactory.com' 
      : 'http://localhost:80'
  ),
  NEXT_PUBLIC_BASE_PATH: getEnvVar('NEXT_PUBLIC_BASE_PATH', '/dreamfactory/dist'),
  NEXT_PUBLIC_VERSION: getEnvVar('NEXT_PUBLIC_VERSION', '1.0.0'),
  
  // DreamFactory API keys - migrated from Angular environment pattern
  // These are client-accessible as they were in the Angular environment files
  NEXT_PUBLIC_DF_ADMIN_API_KEY: getEnvVar('NEXT_PUBLIC_DF_ADMIN_API_KEY', ''),
  NEXT_PUBLIC_DF_API_DOCS_API_KEY: getEnvVar('NEXT_PUBLIC_DF_API_DOCS_API_KEY', ''),
  NEXT_PUBLIC_DF_FILE_MANAGER_API_KEY: getEnvVar('NEXT_PUBLIC_DF_FILE_MANAGER_API_KEY', ''),
  
  // Feature flags - client-accessible for conditional rendering
  NEXT_PUBLIC_ENABLE_DEBUG: parseBoolean(process.env.NEXT_PUBLIC_ENABLE_DEBUG, false),
  NEXT_PUBLIC_ENABLE_ANALYTICS: parseBoolean(process.env.NEXT_PUBLIC_ENABLE_ANALYTICS, true),
  
  // Server-only variables - only available in server context
  // These are conditionally included to prevent client-side exposure
  ...(typeof window === 'undefined' && {
    JWT_SECRET: getEnvVar('JWT_SECRET'),
    SERVER_SECRET: getEnvVar('SERVER_SECRET'), 
    DATABASE_URL: getEnvVar('DATABASE_URL'),
    INTERNAL_API_URL: getEnvVar('INTERNAL_API_URL', 'http://localhost:8080'),
    BUILD_ID: getEnvVar('BUILD_ID', 'development'),
    DEPLOYMENT_ENVIRONMENT: getEnvVar('DEPLOYMENT_ENVIRONMENT', process.env.NODE_ENV || 'development'),
  }),
} as const;

/**
 * Environment detection utilities
 * Replaces Angular's environment.production flag with NODE_ENV-based detection
 */
export const isProduction = env.NODE_ENV === 'production';
export const isDevelopment = env.NODE_ENV === 'development';
export const isStaging = env.NODE_ENV === 'staging';

/**
 * Comprehensive environment variable validation for build pipeline
 * Validates both client-side and server-side variables with proper context awareness
 * 
 * This function is called during build time to ensure all required environment
 * variables are properly configured before deployment.
 */
export function validateEnvironment(): void {
  const errors: string[] = [];
  
  // Required client-side environment variables
  const requiredClientVars = [
    'NEXT_PUBLIC_API_URL',
  ];
  
  // Required server-side environment variables (only validated in server context)
  const requiredServerVars = [
    'JWT_SECRET',
    'SERVER_SECRET',
  ];
  
  // Optional variables that should have sensible defaults in production
  const productionRecommendedVars = [
    'NEXT_PUBLIC_DF_ADMIN_API_KEY',
    'NEXT_PUBLIC_VERSION',
  ];
  
  // Validate required client-side variables
  for (const varName of requiredClientVars) {
    if (!process.env[varName]) {
      errors.push(`Missing required client environment variable: ${varName}`);
    }
  }
  
  // Validate server-side variables only in server context
  if (typeof window === 'undefined') {
    for (const varName of requiredServerVars) {
      if (!process.env[varName]) {
        errors.push(`Missing required server environment variable: ${varName}`);
      }
    }
  }
  
  // Warn about missing recommended variables in production
  if (isProduction) {
    for (const varName of productionRecommendedVars) {
      if (!process.env[varName]) {
        console.warn(`Warning: ${varName} is not set. This is recommended for production deployment.`);
      }
    }
  }
  
  // Validate API URL format
  if (env.NEXT_PUBLIC_API_URL) {
    try {
      new URL(env.NEXT_PUBLIC_API_URL);
    } catch (error) {
      errors.push(`Invalid API URL format: ${env.NEXT_PUBLIC_API_URL}`);
    }
  }
  
  // Validate base path format
  if (env.NEXT_PUBLIC_BASE_PATH && !env.NEXT_PUBLIC_BASE_PATH.startsWith('/')) {
    errors.push('NEXT_PUBLIC_BASE_PATH must start with a forward slash');
  }
  
  // Throw comprehensive error if validation fails
  if (errors.length > 0) {
    throw new Error(`Environment validation failed:\n${errors.join('\n')}`);
  }
  
  // Log successful validation in development
  if (isDevelopment) {
    console.log('✅ Environment variables validated successfully');
  }
}

/**
 * Get DreamFactory API configuration
 * Provides typed access to DreamFactory-specific API keys and endpoints
 */
export function getDreamFactoryConfig() {
  return {
    adminApiKey: env.NEXT_PUBLIC_DF_ADMIN_API_KEY,
    apiDocsApiKey: env.NEXT_PUBLIC_DF_API_DOCS_API_KEY,
    fileManagerApiKey: env.NEXT_PUBLIC_DF_FILE_MANAGER_API_KEY,
    baseUrl: env.NEXT_PUBLIC_API_URL,
    basePath: env.NEXT_PUBLIC_BASE_PATH,
  } as const;
}

/**
 * Get server configuration (server-side only)
 * Provides typed access to server-only environment variables
 * Throws error if called in client context for security
 */
export function getServerConfig() {
  if (typeof window !== 'undefined') {
    throw new Error('getServerConfig() can only be called in server context');
  }
  
  return {
    jwtSecret: env.JWT_SECRET,
    serverSecret: env.SERVER_SECRET,
    databaseUrl: env.DATABASE_URL,
    internalApiUrl: env.INTERNAL_API_URL,
    buildId: env.BUILD_ID,
    deploymentEnvironment: env.DEPLOYMENT_ENVIRONMENT,
  } as const;
}

/**
 * Get client configuration
 * Provides typed access to client-accessible environment variables
 * Safe to call from both client and server contexts
 */
export function getClientConfig() {
  return {
    apiUrl: env.NEXT_PUBLIC_API_URL,
    basePath: env.NEXT_PUBLIC_BASE_PATH,
    version: env.NEXT_PUBLIC_VERSION,
    enableDebug: env.NEXT_PUBLIC_ENABLE_DEBUG,
    enableAnalytics: env.NEXT_PUBLIC_ENABLE_ANALYTICS,
    environment: env.NODE_ENV,
    isProduction,
    isDevelopment,
    isStaging,
  } as const;
}

/**
 * Runtime environment check utilities
 * Provides helpers for conditional logic based on environment context
 */
export const envUtils = {
  /**
   * Check if running in server context
   */
  isServer: typeof window === 'undefined',
  
  /**
   * Check if running in client context
   */
  isClient: typeof window !== 'undefined',
  
  /**
   * Get environment-specific configuration
   */
  getEnvSpecificConfig: (config: {
    development?: any;
    staging?: any;
    production?: any;
  }) => {
    return config[env.NODE_ENV] || config.development;
  },
  
  /**
   * Conditional execution based on environment
   */
  ifProduction: <T>(callback: () => T): T | undefined => {
    return isProduction ? callback() : undefined;
  },
  
  ifDevelopment: <T>(callback: () => T): T | undefined => {
    return isDevelopment ? callback() : undefined;
  },
} as const;

// Export the main environment object as default
export default env;