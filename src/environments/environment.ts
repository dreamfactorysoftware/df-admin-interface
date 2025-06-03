/**
 * Next.js Environment Configuration
 * 
 * Migrated from Angular environment object to Next.js environment variable pattern
 * while maintaining backward compatibility for existing component consumption.
 * 
 * Environment Variable Scoping Strategy:
 * - NEXT_PUBLIC_ prefix: Client-side accessible variables
 * - No prefix: Server-only variables (not exposed to client)
 * 
 * Per Section 8.2.3 migration pattern and React/Next.js Integration Requirements
 */

// Type-safe environment configuration with proper client/server scoping
export const environment = {
  // Development environment flag
  production: process.env.NODE_ENV === 'production',
  
  // Client-side accessible DreamFactory API keys (NEXT_PUBLIC_ prefix required)
  // These are safe to expose to the client as they are used for authenticated API calls
  dfAdminApiKey: process.env.NEXT_PUBLIC_DF_ADMIN_API_KEY || '',
  dfApiDocsApiKey: process.env.NEXT_PUBLIC_DF_API_DOCS_API_KEY || '',
  dfFileManagerApiKey: process.env.NEXT_PUBLIC_DF_FILE_MANAGER_API_KEY || '',
  
  // Next.js SSR development server configuration
  // Client-side accessible API endpoint configuration
  apiUrl: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:80',
  basePath: process.env.NEXT_PUBLIC_BASE_PATH || '/dreamfactory/dist',
  version: process.env.NEXT_PUBLIC_VERSION || '1.0.0',
  
  // Development-specific configuration for Next.js SSR support
  development: {
    enableHotReload: process.env.NODE_ENV === 'development',
    debugMode: process.env.NODE_ENV === 'development' && process.env.DEBUG === 'true',
    // SSR development server optimization flags
    enableTurbopack: process.env.NODE_ENV === 'development',
    enableServerComponents: true,
  },
} as const;

/**
 * Environment variable validation for build pipeline
 * Ensures required client-side variables are present during build
 * Per Section 8.2.3 environment variable scoping strategy
 */
export function validateEnvironment(): void {
  const requiredClientVars = [
    'NEXT_PUBLIC_API_URL',
  ] as const;

  // Validate required client-side variables during build
  for (const varName of requiredClientVars) {
    if (!process.env[varName]) {
      console.warn(`Warning: Missing environment variable: ${varName}. Using default value.`);
    }
  }

  // DreamFactory API keys are optional but recommended for production
  if (environment.production) {
    const recommendedVars = [
      'NEXT_PUBLIC_DF_ADMIN_API_KEY',
      'NEXT_PUBLIC_DF_API_DOCS_API_KEY', 
      'NEXT_PUBLIC_DF_FILE_MANAGER_API_KEY',
    ] as const;

    for (const varName of recommendedVars) {
      if (!process.env[varName]) {
        console.warn(`Warning: Missing recommended production environment variable: ${varName}`);
      }
    }
  }
}

/**
 * Runtime configuration for Next.js SSR compatibility
 * Provides configuration object structure for backward compatibility
 * while enabling Next.js pattern migration
 */
export const runtimeConfig = {
  // Public runtime configuration (accessible to client)
  public: {
    apiUrl: environment.apiUrl,
    basePath: environment.basePath,
    version: environment.version,
    dfAdminApiKey: environment.dfAdminApiKey,
    dfApiDocsApiKey: environment.dfApiDocsApiKey,
    dfFileManagerApiKey: environment.dfFileManagerApiKey,
  },
  
  // Server runtime configuration (server-only, not exposed to client)
  server: {
    // Server-only configuration can be added here as needed
    internalApiUrl: process.env.INTERNAL_API_URL,
    serverSecret: process.env.SERVER_SECRET,
  },
} as const;

// Validate environment on module load
validateEnvironment();

// Default export for backward compatibility with existing Angular imports
export default environment;