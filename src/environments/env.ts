/**
 * Environment Configuration and Validation Utility
 * 
 * Type-safe environment variable configuration for Next.js application with proper
 * client-side vs server-side scoping using NEXT_PUBLIC_ prefix pattern.
 * Implements runtime validation and centralized configuration access.
 * 
 * @fileoverview Environment variable validation and type safety for build pipeline integrity
 * per Section 8.2.3 validation requirements and Section 0.2.1 migration strategy.
 */

// Type definitions for environment variables
interface ClientEnvironmentVariables {
  readonly NODE_ENV: 'development' | 'staging' | 'production'
  readonly NEXT_PUBLIC_API_URL: string
  readonly NEXT_PUBLIC_DF_API_KEY: string
  readonly NEXT_PUBLIC_BASE_PATH: string
  readonly NEXT_PUBLIC_VERSION: string
  readonly NEXT_PUBLIC_APP_NAME: string
  readonly NEXT_PUBLIC_DREAMFACTORY_INSTANCE_URL: string
  readonly NEXT_PUBLIC_API_DOCS_ENABLED: string
  readonly NEXT_PUBLIC_ENVIRONMENT: string
}

interface ServerEnvironmentVariables {
  readonly SERVER_SECRET: string
  readonly JWT_SECRET: string
  readonly DATABASE_URL: string
  readonly INTERNAL_API_URL: string
  readonly SESSION_SECRET: string
  readonly ENCRYPTION_KEY: string
  readonly REDIS_URL?: string
  readonly LOG_LEVEL: string
}

type EnvironmentVariables = ClientEnvironmentVariables & Partial<ServerEnvironmentVariables>

/**
 * Environment variable validation errors
 */
class EnvironmentValidationError extends Error {
  constructor(message: string, public readonly missingVariables: string[]) {
    super(message)
    this.name = 'EnvironmentValidationError'
  }
}

/**
 * Validates required client-side environment variables
 * These variables are accessible in both client and server contexts
 */
function validateClientEnvironment(): void {
  const requiredClientVars: Array<keyof ClientEnvironmentVariables> = [
    'NEXT_PUBLIC_API_URL',
    'NEXT_PUBLIC_DF_API_KEY',
    'NEXT_PUBLIC_BASE_PATH',
    'NEXT_PUBLIC_VERSION',
    'NEXT_PUBLIC_APP_NAME',
    'NEXT_PUBLIC_DREAMFACTORY_INSTANCE_URL',
    'NEXT_PUBLIC_API_DOCS_ENABLED',
    'NEXT_PUBLIC_ENVIRONMENT'
  ]

  const missingVars = requiredClientVars.filter(varName => {
    const value = process.env[varName]
    return !value || value.trim() === ''
  })

  if (missingVars.length > 0) {
    throw new EnvironmentValidationError(
      `Missing required client environment variables: ${missingVars.join(', ')}. ` +
      'These variables must be prefixed with NEXT_PUBLIC_ to be accessible in the browser.',
      missingVars
    )
  }

  // Validate API URL format
  const apiUrl = process.env.NEXT_PUBLIC_API_URL!
  try {
    new URL(apiUrl)
  } catch {
    throw new EnvironmentValidationError(
      `Invalid NEXT_PUBLIC_API_URL format: ${apiUrl}. Must be a valid URL.`,
      ['NEXT_PUBLIC_API_URL']
    )
  }

  // Validate DreamFactory instance URL format
  const dfInstanceUrl = process.env.NEXT_PUBLIC_DREAMFACTORY_INSTANCE_URL!
  try {
    new URL(dfInstanceUrl)
  } catch {
    throw new EnvironmentValidationError(
      `Invalid NEXT_PUBLIC_DREAMFACTORY_INSTANCE_URL format: ${dfInstanceUrl}. Must be a valid URL.`,
      ['NEXT_PUBLIC_DREAMFACTORY_INSTANCE_URL']
    )
  }

  // Validate boolean environment variables
  const booleanVars = ['NEXT_PUBLIC_API_DOCS_ENABLED']
  booleanVars.forEach(varName => {
    const value = process.env[varName]!.toLowerCase()
    if (!['true', 'false'].includes(value)) {
      throw new EnvironmentValidationError(
        `Invalid boolean value for ${varName}: ${value}. Must be 'true' or 'false'.`,
        [varName]
      )
    }
  })
}

/**
 * Validates required server-side environment variables
 * These variables are only accessible in server context for security
 */
function validateServerEnvironment(): void {
  // Only validate server environment in server context
  if (typeof window !== 'undefined') {
    return
  }

  const requiredServerVars: Array<keyof ServerEnvironmentVariables> = [
    'SERVER_SECRET',
    'JWT_SECRET',
    'DATABASE_URL',
    'INTERNAL_API_URL',
    'SESSION_SECRET',
    'ENCRYPTION_KEY',
    'LOG_LEVEL'
  ]

  const missingVars = requiredServerVars.filter(varName => {
    const value = process.env[varName]
    return !value || value.trim() === ''
  })

  if (missingVars.length > 0) {
    throw new EnvironmentValidationError(
      `Missing required server environment variables: ${missingVars.join(', ')}. ` +
      'These variables should NOT be prefixed with NEXT_PUBLIC_ for security.',
      missingVars
    )
  }

  // Validate server secret minimum length
  const serverSecret = process.env.SERVER_SECRET!
  if (serverSecret.length < 32) {
    throw new EnvironmentValidationError(
      'SERVER_SECRET must be at least 32 characters long for security.',
      ['SERVER_SECRET']
    )
  }

  // Validate JWT secret minimum length
  const jwtSecret = process.env.JWT_SECRET!
  if (jwtSecret.length < 32) {
    throw new EnvironmentValidationError(
      'JWT_SECRET must be at least 32 characters long for security.',
      ['JWT_SECRET']
    )
  }

  // Validate internal API URL format
  const internalApiUrl = process.env.INTERNAL_API_URL!
  try {
    new URL(internalApiUrl)
  } catch {
    throw new EnvironmentValidationError(
      `Invalid INTERNAL_API_URL format: ${internalApiUrl}. Must be a valid URL.`,
      ['INTERNAL_API_URL']
    )
  }

  // Validate log level
  const validLogLevels = ['error', 'warn', 'info', 'debug']
  const logLevel = process.env.LOG_LEVEL!.toLowerCase()
  if (!validLogLevels.includes(logLevel)) {
    throw new EnvironmentValidationError(
      `Invalid LOG_LEVEL: ${logLevel}. Must be one of: ${validLogLevels.join(', ')}.`,
      ['LOG_LEVEL']
    )
  }
}

/**
 * Comprehensive environment validation for build pipeline integrity
 * Called during application initialization to ensure all required variables are present
 */
export function validateEnvironment(): void {
  try {
    validateClientEnvironment()
    validateServerEnvironment()
  } catch (error) {
    if (error instanceof EnvironmentValidationError) {
      // In development, provide helpful error messages
      if (process.env.NODE_ENV === 'development') {
        console.error('\n🚨 Environment Validation Failed:')
        console.error(`📋 ${error.message}`)
        console.error('\n📝 Missing variables:')
        error.missingVariables.forEach(varName => {
          console.error(`   - ${varName}`)
        })
        console.error('\n💡 Create a .env.local file in your project root with these variables.\n')
      }
      throw error
    }
    throw error
  }
}

/**
 * Centralized environment configuration object with proper NEXT_PUBLIC_ scoping
 * Provides type-safe access to all environment variables
 */
export const env: EnvironmentVariables = {
  // Client-side accessible variables (NEXT_PUBLIC_ prefix)
  NODE_ENV: (process.env.NODE_ENV as 'development' | 'staging' | 'production') || 'development',
  NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:80',
  NEXT_PUBLIC_DF_API_KEY: process.env.NEXT_PUBLIC_DF_API_KEY || '',
  NEXT_PUBLIC_BASE_PATH: process.env.NEXT_PUBLIC_BASE_PATH || '/dreamfactory/dist',
  NEXT_PUBLIC_VERSION: process.env.NEXT_PUBLIC_VERSION || '1.0.0',
  NEXT_PUBLIC_APP_NAME: process.env.NEXT_PUBLIC_APP_NAME || 'DreamFactory Admin Interface',
  NEXT_PUBLIC_DREAMFACTORY_INSTANCE_URL: process.env.NEXT_PUBLIC_DREAMFACTORY_INSTANCE_URL || 'http://localhost:80',
  NEXT_PUBLIC_API_DOCS_ENABLED: process.env.NEXT_PUBLIC_API_DOCS_ENABLED || 'true',
  NEXT_PUBLIC_ENVIRONMENT: process.env.NEXT_PUBLIC_ENVIRONMENT || 'development',

  // Server-only variables (no NEXT_PUBLIC_ prefix - not exposed to client)
  // These will be undefined in client context
  ...(typeof window === 'undefined' ? {
    SERVER_SECRET: process.env.SERVER_SECRET,
    JWT_SECRET: process.env.JWT_SECRET,
    DATABASE_URL: process.env.DATABASE_URL,
    INTERNAL_API_URL: process.env.INTERNAL_API_URL,
    SESSION_SECRET: process.env.SESSION_SECRET,
    ENCRYPTION_KEY: process.env.ENCRYPTION_KEY,
    REDIS_URL: process.env.REDIS_URL,
    LOG_LEVEL: process.env.LOG_LEVEL || 'info'
  } : {})
} as const

/**
 * DreamFactory API configuration derived from environment variables
 * Provides structured access to DreamFactory-specific settings
 */
export const dreamFactoryConfig = {
  /**
   * Base URL for DreamFactory API endpoints
   */
  apiUrl: env.NEXT_PUBLIC_API_URL,
  
  /**
   * DreamFactory instance URL (may be different from API URL)
   */
  instanceUrl: env.NEXT_PUBLIC_DREAMFACTORY_INSTANCE_URL,
  
  /**
   * API key for DreamFactory authentication
   */
  apiKey: env.NEXT_PUBLIC_DF_API_KEY,
  
  /**
   * Standard DreamFactory API endpoints
   */
  endpoints: {
    system: `${env.NEXT_PUBLIC_API_URL}/api/v2/system`,
    services: `${env.NEXT_PUBLIC_API_URL}/api/v2/system/service`,
    serviceTypes: `${env.NEXT_PUBLIC_API_URL}/api/v2/system/service_type`,
    users: `${env.NEXT_PUBLIC_API_URL}/api/v2/system/user`,
    roles: `${env.NEXT_PUBLIC_API_URL}/api/v2/system/role`,
    apps: `${env.NEXT_PUBLIC_API_URL}/api/v2/system/app`,
    config: `${env.NEXT_PUBLIC_API_URL}/api/v2/system/config`,
    schema: (serviceName: string) => `${env.NEXT_PUBLIC_API_URL}/api/v2/${serviceName}/_schema`,
    table: (serviceName: string, tableName: string) => 
      `${env.NEXT_PUBLIC_API_URL}/api/v2/${serviceName}/_schema/${tableName}`
  },
  
  /**
   * Default request headers for DreamFactory API calls
   */
  defaultHeaders: {
    'Content-Type': 'application/json',
    'X-DreamFactory-API-Key': env.NEXT_PUBLIC_DF_API_KEY,
    'X-Requested-With': 'XMLHttpRequest'
  },
  
  /**
   * Feature flags derived from environment
   */
  features: {
    apiDocsEnabled: env.NEXT_PUBLIC_API_DOCS_ENABLED === 'true',
    isDevelopment: env.NODE_ENV === 'development',
    isProduction: env.NODE_ENV === 'production'
  }
} as const

/**
 * Type guard to check if we're in server context
 */
export function isServerSide(): boolean {
  return typeof window === 'undefined'
}

/**
 * Type guard to check if we're in client context
 */
export function isClientSide(): boolean {
  return typeof window !== 'undefined'
}

/**
 * Get server-only environment variable safely
 * Returns undefined if called from client side
 */
export function getServerEnv<K extends keyof ServerEnvironmentVariables>(
  key: K
): ServerEnvironmentVariables[K] | undefined {
  if (isClientSide()) {
    console.warn(`Attempted to access server-only environment variable '${key}' from client side`)
    return undefined
  }
  return env[key] as ServerEnvironmentVariables[K]
}

/**
 * Runtime environment information
 */
export const runtimeInfo = {
  nodeEnv: env.NODE_ENV,
  isServer: isServerSide(),
  isClient: isClientSide(),
  isDevelopment: env.NODE_ENV === 'development',
  isStaging: env.NODE_ENV === 'staging',
  isProduction: env.NODE_ENV === 'production',
  version: env.NEXT_PUBLIC_VERSION,
  buildTime: new Date().toISOString()
} as const

// Validate environment variables during module initialization
// This ensures build pipeline integrity by catching configuration errors early
try {
  validateEnvironment()
} catch (error) {
  if (error instanceof EnvironmentValidationError) {
    // In production builds, fail fast to prevent deployment with invalid configuration
    if (process.env.NODE_ENV === 'production') {
      console.error('❌ Environment validation failed. Deployment cannot proceed.')
      process.exit(1)
    }
    // In development, allow the app to start but log warnings
    console.warn('⚠️  Environment validation warnings detected. Some features may not work correctly.')
  }
}

export default env