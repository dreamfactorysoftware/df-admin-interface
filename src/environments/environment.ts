/**
 * Environment Configuration (Development)
 * 
 * Backward compatibility layer for Angular-style environment access while
 * leveraging Next.js environment variable configuration patterns.
 * 
 * This module transforms Angular environment object exports to Next.js
 * environment variable configuration per Section 8.2.3 migration pattern,
 * maintaining existing component interfaces while enabling modern patterns.
 * 
 * @module src/environments/environment
 * @version 1.0.0
 * @since Next.js 15.1 migration
 */

// Import the modern Next.js environment configuration
import { env, getDreamFactoryConfig, getClientConfig, isDevelopment } from '../lib/config/env';

/**
 * Development Environment Configuration
 * 
 * Maintains backward compatibility with Angular environment object pattern
 * while internally leveraging Next.js environment variable configuration
 * with NEXT_PUBLIC_ prefix for client-side accessible values.
 * 
 * Maps traditional Angular environment properties to Next.js environment
 * variables, supporting development-specific configuration for SSR server.
 */
export const environment = {
  /**
   * Production flag - maps to NODE_ENV environment variable
   * Maintains Angular's environment.production pattern
   */
  production: false,

  /**
   * DreamFactory Admin API Key
   * Maps to NEXT_PUBLIC_DF_ADMIN_API_KEY environment variable
   * Client-accessible for frontend API authentication
   */
  dfAdminApiKey: env.NEXT_PUBLIC_DF_ADMIN_API_KEY,

  /**
   * DreamFactory API Documentation Key  
   * Maps to NEXT_PUBLIC_DF_API_DOCS_API_KEY environment variable
   * Client-accessible for API documentation access
   */
  dfApiDocsApiKey: env.NEXT_PUBLIC_DF_API_DOCS_API_KEY,

  /**
   * DreamFactory File Manager API Key
   * Maps to NEXT_PUBLIC_DF_FILE_MANAGER_API_KEY environment variable  
   * Client-accessible for file management operations
   */
  dfFileManagerApiKey: env.NEXT_PUBLIC_DF_FILE_MANAGER_API_KEY,

  /**
   * Development-specific configuration for Next.js SSR support
   * Additional properties for enhanced development experience
   */
  
  /**
   * API Base URL - maps to NEXT_PUBLIC_API_URL
   * Supports Next.js SSR development server configuration
   */
  apiUrl: env.NEXT_PUBLIC_API_URL,

  /**
   * Application Base Path - maps to NEXT_PUBLIC_BASE_PATH
   * Supports Next.js routing and asset serving configuration
   */
  basePath: env.NEXT_PUBLIC_BASE_PATH,

  /**
   * Application Version - maps to NEXT_PUBLIC_VERSION
   * Enables version-specific features and debugging
   */
  version: env.NEXT_PUBLIC_VERSION,

  /**
   * Debug Mode - maps to NEXT_PUBLIC_ENABLE_DEBUG
   * Enables enhanced logging and development tools
   */
  enableDebug: env.NEXT_PUBLIC_ENABLE_DEBUG,

  /**
   * Analytics Configuration - maps to NEXT_PUBLIC_ENABLE_ANALYTICS
   * Controls client-side analytics and tracking
   */
  enableAnalytics: env.NEXT_PUBLIC_ENABLE_ANALYTICS,
} as const;

/**
 * Environment Detection Utilities
 * 
 * Provides Angular-compatible environment detection while
 * leveraging Next.js NODE_ENV patterns for consistency
 */
export const isProduction = () => env.NODE_ENV === 'production';
export const isDevelopmentMode = () => env.NODE_ENV === 'development';
export const isStaging = () => env.NODE_ENV === 'staging';

/**
 * DreamFactory Configuration Helper
 * 
 * Provides typed access to DreamFactory-specific API configuration
 * with backward compatibility for existing service integrations
 */
export const dreamFactoryConfig = getDreamFactoryConfig();

/**
 * Client Configuration Helper
 * 
 * Provides access to client-safe configuration values
 * compatible with Next.js SSR and client-side rendering
 */
export const clientConfig = getClientConfig();

/**
 * Development Server Configuration
 * 
 * Next.js SSR development server specific configuration
 * Supports hot module replacement and enhanced debugging
 */
export const devServerConfig = {
  /**
   * Hot Module Replacement enabled
   * Leverages Next.js Fast Refresh for component updates
   */
  hmr: isDevelopment,

  /**
   * Source maps enabled for debugging
   * Provides enhanced error tracking in development
   */
  sourceMaps: isDevelopment,

  /**
   * API proxy configuration for development
   * Routes API calls through Next.js development server
   */
  apiProxy: {
    enabled: isDevelopment,
    target: env.NEXT_PUBLIC_API_URL,
    changeOrigin: true,
    pathRewrite: {
      '^/api': '/api/v2'
    }
  },

  /**
   * Development-specific optimizations
   * Enhances development experience with faster builds
   */
  optimization: {
    splitChunks: false,
    minimizer: false,
    usedExports: false
  },

  /**
   * Development logging configuration
   * Enhanced error reporting and debugging information
   */
  logging: {
    level: env.NEXT_PUBLIC_ENABLE_DEBUG ? 'verbose' : 'info',
    errors: true,
    warnings: true,
    performance: true
  }
} as const;

/**
 * Environment Variable Mapping Configuration
 * 
 * Documents the mapping between Angular environment properties
 * and Next.js environment variables for migration reference
 */
export const environmentMapping = {
  'environment.production': 'NODE_ENV === "production"',
  'environment.dfAdminApiKey': 'NEXT_PUBLIC_DF_ADMIN_API_KEY',
  'environment.dfApiDocsApiKey': 'NEXT_PUBLIC_DF_API_DOCS_API_KEY', 
  'environment.dfFileManagerApiKey': 'NEXT_PUBLIC_DF_FILE_MANAGER_API_KEY',
  'environment.apiUrl': 'NEXT_PUBLIC_API_URL',
  'environment.basePath': 'NEXT_PUBLIC_BASE_PATH',
  'environment.version': 'NEXT_PUBLIC_VERSION',
  'environment.enableDebug': 'NEXT_PUBLIC_ENABLE_DEBUG',
  'environment.enableAnalytics': 'NEXT_PUBLIC_ENABLE_ANALYTICS'
} as const;

/**
 * Migration Utilities
 * 
 * Helper functions to support the transition from Angular to Next.js
 * environment configuration patterns
 */
export const migrationUtils = {
  /**
   * Validate environment configuration
   * Ensures all required environment variables are properly configured
   */
  validateEnvironment: () => {
    const errors: string[] = [];

    // Validate required DreamFactory API keys in production
    if (env.NODE_ENV === 'production') {
      if (!environment.dfAdminApiKey) {
        errors.push('NEXT_PUBLIC_DF_ADMIN_API_KEY is required in production');
      }
      if (!environment.apiUrl) {
        errors.push('NEXT_PUBLIC_API_URL is required in production');
      }
    }

    // Validate URL format
    if (environment.apiUrl) {
      try {
        new URL(environment.apiUrl);
      } catch (error) {
        errors.push(`Invalid API URL format: ${environment.apiUrl}`);
      }
    }

    if (errors.length > 0) {
      throw new Error(`Environment validation failed:\n${errors.join('\n')}`);
    }

    return true;
  },

  /**
   * Get environment-specific configuration
   * Returns configuration based on current environment
   */
  getEnvSpecificConfig: () => {
    const baseConfig = {
      development: {
        apiTimeout: 30000,
        retryAttempts: 3,
        enableMocking: true,
        logLevel: 'debug'
      },
      staging: {
        apiTimeout: 20000,
        retryAttempts: 2,
        enableMocking: false,
        logLevel: 'info'
      },
      production: {
        apiTimeout: 10000,
        retryAttempts: 1,
        enableMocking: false,
        logLevel: 'error'
      }
    };

    return baseConfig[env.NODE_ENV] || baseConfig.development;
  },

  /**
   * Generate .env template
   * Creates a template for environment variable configuration
   */
  generateEnvTemplate: () => {
    return `# Environment Variables Template
# Copy to .env.local for local development

# Core Application Environment
NODE_ENV=development
NEXT_PUBLIC_API_URL=http://localhost:80
NEXT_PUBLIC_BASE_PATH=/dreamfactory/dist
NEXT_PUBLIC_VERSION=1.0.0

# DreamFactory API Configuration
NEXT_PUBLIC_DF_ADMIN_API_KEY=
NEXT_PUBLIC_DF_API_DOCS_API_KEY=
NEXT_PUBLIC_DF_FILE_MANAGER_API_KEY=

# Feature Flags
NEXT_PUBLIC_ENABLE_DEBUG=true
NEXT_PUBLIC_ENABLE_ANALYTICS=false

# Server-only Variables (not accessible to client)
JWT_SECRET=your-jwt-secret-here
SERVER_SECRET=your-server-secret-here
DATABASE_URL=your-database-url-here
INTERNAL_API_URL=http://localhost:8080
`;
  }
} as const;

/**
 * Default export for backward compatibility
 * Maintains Angular's environment import pattern
 */
export default environment;
