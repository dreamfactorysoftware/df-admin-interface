/**
 * Main API Client Library - Centralized Export Module
 * 
 * This module serves as the primary entry point for all API client functionality,
 * replacing Angular HTTP services with modern React/Next.js patterns optimized for
 * server-side rendering and intelligent caching with SWR/React Query integration.
 * 
 * Key Features:
 * - Unified API client exports with TypeScript type safety
 * - Clean import patterns for React hooks and components per Section 3.2.6
 * - Authentication integration per Section 4.5 security flows
 * - Middleware pattern implementation for request/response transformation
 * - Comprehensive HTTP client utilities replacing Angular HTTP services
 * - Support for SWR and React Query intelligent caching per Section 3.2.4
 * 
 * Usage Examples:
 * ```typescript
 * // Import specific clients
 * import { CrudClient, createCrudClient } from '@/lib/api-client';
 * 
 * // Import authentication utilities
 * import { AuthClient, generateAuthHeaders } from '@/lib/api-client';
 * 
 * // Import middleware functions
 * import { configureInterceptors, createDefaultMiddlewareStack } from '@/lib/api-client';
 * 
 * // Import type definitions
 * import type { RequestConfig, AuthContext, ListResponse } from '@/lib/api-client';
 * ```
 * 
 * @module ApiClient
 * @version 1.0.0
 * @author DreamFactory Admin Interface Team
 */

// =============================================================================
// BASE HTTP CLIENT EXPORTS
// =============================================================================

export {
  // Main base client class and utilities
  BaseApiClient,
  RequestConfigBuilder,
  createApiClient,
  requestConfig,
  
  // Base client utility functions
  generateRequestId,
  calculateBackoffDelay,
  isRetryableError,
  isNetworkError,
  buildQueryString,
  buildHeaders,
  
  // Constants for configuration
  DEFAULT_TIMEOUT,
  DEFAULT_RETRY_CONFIG,
  DEFAULT_HEADERS,
  HTTP_STATUS,
} from './base-client';

// =============================================================================
// CRUD OPERATIONS CLIENT EXPORTS
// =============================================================================

export {
  // Main CRUD client class
  CrudClient,
  
  // Factory functions for CRUD client instances
  createCrudClient,
  defaultCrudClient,
} from './crud-client';

// =============================================================================
// FILE OPERATIONS CLIENT EXPORTS
// =============================================================================

export {
  // Main file client class
  FileClient,
  
  // Factory functions for file client instances
  createFileClient,
  getFileClient,
  resetFileClient,
  
  // File utility functions
  formatFileSize,
  getFileExtension,
  isImageFile,
  isTextFile,
  generateUniqueFilename,
} from './file-client';

// =============================================================================
// SYSTEM API CLIENT EXPORTS
// =============================================================================

export {
  // Main system client class
  SystemClient,
  
  // Factory functions and default instance
  createSystemClient,
  createSystemClientFactory,
  systemClient,
} from './system-client';

// =============================================================================
// AUTHENTICATION CLIENT EXPORTS
// =============================================================================

export {
  // Main authentication client object with all utilities
  AuthClient,
  
  // Authentication configuration constants
  AUTH_CONFIG,
  COOKIE_OPTIONS,
  
  // Token management functions
  validateTokenStructure,
  createAuthToken,
  shouldRefreshToken,
  decodeJwtPayload,
  
  // Secure cookie operations
  storeTokenInCookies,
  getTokenFromCookies,
  clearAuthCookies,
  
  // Session data management
  storeSessionData,
  getStoredSessionData,
  clearStoredSessionData,
  
  // Authentication header management
  generateAuthHeaders,
  getCurrentAuthHeaders,
  updateRequestHeaders,
  
  // Session validation and refresh
  validateCurrentSession,
  refreshAuthToken,
  handleMiddlewareTokenRefresh,
  
  // Authentication state management
  initializeAuthState,
  updateAuthState,
  
  // Cleanup and logout utilities
  performAuthenticationCleanup,
  logoutUser,
  handleSessionExpiration,
  
  // Utility functions for integration
  createAuthContext,
  extractUserPermissions,
  hasPermission,
  recordSessionActivity,
} from './auth-client';

// =============================================================================
// MIDDLEWARE AND INTERCEPTOR EXPORTS
// =============================================================================

export {
  // Configuration functions
  configureInterceptors,
  getInterceptorConfig,
  
  // Individual middleware functions
  authenticationMiddleware,
  requestCaseTransformMiddleware,
  responseCaseTransformMiddleware,
  errorHandlingMiddleware,
  loadingStateMiddleware,
  loadingCleanupMiddleware,
  loadingErrorCleanupMiddleware,
  successNotificationMiddleware,
  errorNotificationMiddleware,
  performanceMonitoringMiddleware,
  performanceCompletionMiddleware,
  
  // Middleware composition utilities
  composeRequestMiddlewares,
  composeResponseMiddlewares,
  composeErrorMiddlewares,
  createDefaultMiddlewareStack,
  
  // Default middleware stacks
  defaultRequestMiddleware,
  defaultResponseMiddleware,
  defaultErrorMiddleware,
} from './interceptors';

// =============================================================================
// TYPE DEFINITIONS EXPORT
// =============================================================================

export type {
  // Core HTTP types
  HttpMethod,
  ContentType,
  CacheStrategy,
  
  // Request configuration types
  RequestConfig,
  PaginationConfig,
  FilterConfig,
  UIConfig,
  CacheConfig,
  KeyValuePair,
  
  // SWR and React Query configuration types
  SWRConfig,
  ReactQueryConfig,
  
  // Response types
  SuccessResponse,
  ErrorResponse,
  ErrorContext,
  ResponseMeta,
  ListResponse,
  CreateResponse,
  UpdateResponse,
  DeleteResponse,
  BulkResponse,
  
  // Authentication types
  AuthToken,
  ApiKey,
  SessionData,
  AuthHeaders,
  AuthContext,
  
  // Middleware types
  MiddlewareContext,
  MiddlewareStack,
  RequestMiddleware,
  ResponseMiddleware,
  ErrorMiddleware,
  
  // File operation types
  FileUploadProgress,
  FileMetadata,
  FileUploadConfig,
  FileDownloadConfig,
  DirectoryItem,
  DirectoryListing,
  
  // Specialized API types
  ConnectionTestResult,
  SchemaDiscoveryResult,
  EndpointGenerationResult,
  
  // System API types
  Environment,
  System,
  LicenseCheckResponse,
  SubscriptionData,
  SystemInfo,
  ConfigItem,
  SystemMetrics,
  SystemClientConfig,
  SystemSWRConfig,
  SystemReactQueryConfig,
  
  // File client specific types
  FileService,
  FileItem,
  CreateDirectoryPayload,
  FileUploadResult,
  FileListingOptions,
  FileValidationResult,
  
  // Authentication client specific types
  AuthError,
  TokenValidationResult,
  SessionRefreshResult,
  AuthState,
  
  // Middleware configuration types
  InterceptorConfig,
  
  // Utility types
  ExtractResourceType,
  PartialConfig,
  CombinedConfig,
  ApiClientError,
  RequestContext,
  ApiClientConfig,
} from './types';

// =============================================================================
// UNIFIED API CLIENT FACTORY
// =============================================================================

/**
 * Configuration interface for creating a complete API client setup
 */
export interface ApiClientSetupConfig {
  /** Base URL for all API requests */
  baseUrl: string;
  /** Authentication session token */
  sessionToken?: string;
  /** API key for authentication */
  apiKey?: string;
  /** License key for premium features */
  licenseKey?: string;
  /** Default request timeout in milliseconds */
  timeout?: number;
  /** Enable development mode features */
  developmentMode?: boolean;
  /** Custom middleware configuration */
  interceptorConfig?: import('./interceptors').InterceptorConfig;
}

/**
 * Complete API client setup with all configured clients
 */
export interface ApiClientSetup {
  /** Base HTTP client for low-level operations */
  baseClient: import('./base-client').BaseApiClient;
  /** CRUD operations client */
  crudClient: import('./crud-client').CrudClient;
  /** File operations client */
  fileClient: import('./file-client').FileClient;
  /** System API client */
  systemClient: import('./system-client').SystemClient;
  /** Authentication utilities */
  authClient: typeof import('./auth-client').AuthClient;
  /** Current authentication headers */
  authHeaders: import('./types').AuthHeaders;
}

/**
 * Create a complete API client setup with all configured clients
 * 
 * This factory function provides a convenient way to initialize all API clients
 * with consistent configuration, replacing Angular service dependency injection
 * patterns with React-compatible factory patterns.
 * 
 * @param config - Complete API client configuration
 * @returns Configured API client setup with all clients
 * 
 * @example
 * ```typescript
 * // Initialize complete API client setup
 * const apiClients = await createApiClientSetup({
 *   baseUrl: process.env.NEXT_PUBLIC_API_URL,
 *   sessionToken: await getTokenFromCookies(),
 *   timeout: 30000,
 *   developmentMode: process.env.NODE_ENV === 'development',
 * });
 * 
 * // Use individual clients
 * const connections = await apiClients.crudClient.getAll('/api/v2/system/service');
 * const files = await apiClients.fileClient.listFiles('files', '/scripts');
 * ```
 */
export async function createApiClientSetup(config: ApiClientSetupConfig): Promise<ApiClientSetup> {
  const {
    baseUrl,
    sessionToken,
    apiKey,
    licenseKey,
    timeout = 30000,
    developmentMode = false,
    interceptorConfig,
  } = config;

  // Generate authentication headers
  const authHeaders = generateAuthHeaders({
    sessionToken,
    apiKey,
    licenseKey,
  });

  // Configure global interceptors if provided
  if (interceptorConfig) {
    configureInterceptors({
      ...interceptorConfig,
      isDevelopment: developmentMode,
      baseUrl,
    });
  }

  // Create authentication context
  const authContext: import('./types').AuthContext = {
    token: sessionToken ? createAuthToken(sessionToken) : undefined,
    apiKey: apiKey ? { key: apiKey } : undefined,
    isAuthenticated: !!sessionToken,
    isAuthenticating: false,
  };

  // Create base HTTP client with authentication
  const baseClient = createApiClient(baseUrl, authContext, {
    timeout,
    interceptorConfig,
  });

  // Create CRUD client with authentication headers
  const crudClient = createCrudClient({
    baseUrl,
    sessionToken,
    apiKey,
    timeout,
  });

  // Create file client with authentication headers
  const fileClient = createFileClient(baseUrl, authHeaders);

  // Create system client with authentication configuration
  const systemClient = createSystemClient({
    baseUrl,
    defaultHeaders: authHeaders,
    defaultTimeout: timeout,
    enableBackgroundSync: !developmentMode, // Disable in development for debugging
  });

  return {
    baseClient,
    crudClient,
    fileClient,
    systemClient,
    authClient: AuthClient,
    authHeaders,
  };
}

/**
 * Default API client setup using environment configuration
 * 
 * Provides a pre-configured API client setup using environment variables
 * and default settings suitable for most use cases.
 * 
 * @returns Promise resolving to configured API client setup
 * 
 * @example
 * ```typescript
 * // Use default configuration
 * const apiClients = await getDefaultApiClientSetup();
 * 
 * // Fetch data using configured clients
 * const { data, error } = await apiClients.crudClient.getAll('/api/v2/database/_table');
 * ```
 */
export async function getDefaultApiClientSetup(): Promise<ApiClientSetup> {
  // Get authentication token from cookies
  const token = await getTokenFromCookies();
  
  return createApiClientSetup({
    baseUrl: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000',
    sessionToken: token?.sessionToken,
    apiKey: process.env.NEXT_PUBLIC_DREAMFACTORY_API_KEY,
    licenseKey: process.env.DREAMFACTORY_LICENSE_KEY,
    timeout: 30000,
    developmentMode: process.env.NODE_ENV === 'development',
  });
}

// =============================================================================
// CONVENIENCE EXPORTS FOR REACT HOOK INTEGRATION
// =============================================================================

/**
 * Convenience exports for React hook integration patterns
 * These exports facilitate clean imports in React components and hooks
 */

// Base client utilities for custom hooks
export { BaseApiClient as HttpClient } from './base-client';
export { CrudClient as DataClient } from './crud-client';
export { FileClient as FileManager } from './file-client';
export { SystemClient as SystemAPI } from './system-client';

// Authentication utilities for auth hooks
export {
  validateCurrentSession as useSessionValidation,
  getCurrentAuthHeaders as useAuthHeaders,
} from './auth-client';

// Middleware utilities for custom implementations
export {
  createDefaultMiddlewareStack as useDefaultMiddleware,
} from './interceptors';

// =============================================================================
// RE-EXPORT COMMON PATTERNS FOR CONVENIENCE
// =============================================================================

/**
 * Common API client patterns for frequently used operations
 */

// Default clients for immediate use
export const httpClient = new BaseApiClient();
export const dataClient = new CrudClient({
  baseUrl: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000',
  defaultHeaders: {},
});
export const fileManager = new FileClient();
export const systemAPI = new SystemClient();

// Authentication utilities
export const auth = AuthClient;

// Middleware configuration
export const middleware = {
  configure: configureInterceptors,
  getConfig: getInterceptorConfig,
  createDefault: createDefaultMiddlewareStack,
};

// =============================================================================
// DEFAULT EXPORT FOR COMPATIBILITY
// =============================================================================

/**
 * Default export providing the complete API client interface
 * 
 * This default export maintains compatibility with CommonJS imports
 * while providing access to all API client functionality.
 */
const ApiClientLibrary = {
  // Core clients
  BaseApiClient,
  CrudClient,
  FileClient,
  SystemClient,
  AuthClient,
  
  // Factory functions
  createApiClientSetup,
  getDefaultApiClientSetup,
  createApiClient,
  createCrudClient,
  createFileClient,
  createSystemClient,
  
  // Authentication utilities
  auth: AuthClient,
  generateAuthHeaders,
  validateCurrentSession,
  
  // Middleware utilities
  middleware,
  configureInterceptors,
  createDefaultMiddlewareStack,
  
  // Default instances
  httpClient,
  dataClient,
  fileManager,
  systemAPI,
  
  // Configuration constants
  AUTH_CONFIG,
  DEFAULT_TIMEOUT,
  HTTP_STATUS,
} as const;

export default ApiClientLibrary;

// =============================================================================
// MODULE DOCUMENTATION
// =============================================================================

/**
 * @fileoverview
 * 
 * This module serves as the main entry point for the DreamFactory Admin Interface
 * API client library, providing comprehensive HTTP client utilities that replace
 * Angular HTTP services with modern React/Next.js patterns.
 * 
 * Architecture:
 * - BaseApiClient: Core HTTP functionality with middleware support
 * - CrudClient: Standardized CRUD operations with React Query compatibility
 * - FileClient: File upload/download operations with progress tracking
 * - SystemClient: System configuration and environment management
 * - AuthClient: Authentication and session management utilities
 * - Interceptors: Request/response middleware for cross-cutting concerns
 * 
 * Integration Features:
 * - SWR and React Query compatibility for intelligent caching
 * - Next.js middleware integration for server-side authentication
 * - TypeScript type safety throughout the API surface
 * - Comprehensive error handling with automatic token refresh
 * - Performance monitoring and optimization utilities
 * 
 * Security Features:
 * - JWT token management with automatic refresh
 * - Secure cookie storage with HTTP-only and SameSite configurations
 * - Authentication header management for DreamFactory API compatibility
 * - Session validation and cleanup utilities
 * 
 * Performance Features:
 * - Intelligent caching with background synchronization
 * - Request deduplication and retry mechanisms
 * - Optimistic updates for improved user experience
 * - Progressive loading for large datasets
 * 
 * @version 1.0.0
 * @since React 19.0.0 / Next.js 15.1
 * @requires TypeScript 5.8+
 */