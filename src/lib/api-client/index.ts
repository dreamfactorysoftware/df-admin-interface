/**
 * API Client Library - Main Export Index
 * 
 * Centralized export module providing comprehensive HTTP client utilities,
 * authentication integration, and request/response middleware for the
 * DreamFactory Admin Interface React/Next.js application.
 * 
 * This module replaces Angular HTTP services and interceptors with modern
 * React/Next.js patterns optimized for server-side rendering, concurrent
 * features, and enhanced performance characteristics.
 * 
 * Key Features:
 * - Unified API client library exports replacing Angular HTTP service dependency injection patterns
 * - Clean import patterns for React hooks and components per Section 3.2.6 component architecture
 * - TypeScript type safety with comprehensive API client type definitions
 * - Integration with authentication system per Section 4.5 security and authentication flows
 * - Middleware pattern implementation for request/response transformation per Section 4.7.1.2 interceptor migration
 * - Compatibility with SWR and React Query for intelligent caching per Section 3.2.4 HTTP client architecture
 * 
 * @fileoverview Main API client library export providing centralized access to all HTTP utilities
 * @version 1.0.0
 * @since React 19.0.0 / Next.js 15.1+
 * @module ApiClient
 */

// =============================================================================
// Base HTTP Client Exports
// =============================================================================

/**
 * Core HTTP client implementation and factory functions
 */
export {
  // Main client class
  BaseClient,
  
  // Factory functions
  createApiClient,
  createDefaultApiClient,
  
  // Legacy compatibility utilities
  convertLegacyRequest,
  
  // Utility functions
  generateRequestId,
  generateCorrelationId,
  buildUrl,
  normalizeHeaders,
  mergeHeaders,
  calculateRetryDelay,
  isRetryableError,
  
  // Default export
  default as BaseApiClient,
} from './base-client';

// =============================================================================
// CRUD Operations Client Exports
// =============================================================================

/**
 * Comprehensive CRUD operations with React Query integration
 */
export {
  // Main CRUD client class
  CrudClient,
  
  // Factory functions
  createCrudClient,
  createDefaultCrudClient,
  
  // Type exports for CRUD operations
  type PaginationOptions,
  type FilterOptions,
  type QueryOptions,
  type CacheControlOptions,
  type NotificationOptions,
  type FileImportExportOptions,
  type ValidationConfig,
  type BulkOperationOptions,
  type BulkOperationProgress,
  type EventScriptOptions,
  type GitHubOptions,
  
  // Default export
  default as CrudApiClient,
} from './crud-client';

// =============================================================================
// File Operations Client Exports
// =============================================================================

/**
 * Specialized file operations including upload, download, and directory management
 */
export {
  // Main file client class
  FileClient,
  
  // Factory functions
  createFileClient,
  createDefaultFileClient,
  
  // Configuration constants
  FILE_CONFIG,
  FILE_ENDPOINTS,
  
  // Type exports for file operations
  type FileOperationType,
  type FileChunk,
  type ChunkedUploadConfig,
  type DirectoryListingOptions,
  type FileSecurityScanOptions,
  type FileValidationResult,
  type DirectoryOperationResult,
  type FileUploadResult,
  type FileDownloadResult,
  type FileBatchOperationResult,
  
  // Utility functions
  validateFileForSecurity,
  isSecuritySensitiveFile,
  formatFileSize,
  generateFileHash,
  buildFileUrl,
  
  // Default export
  default as FileApiClient,
} from './file-client';

// =============================================================================
// System API Client Exports
// =============================================================================

/**
 * System configuration and administrative operations
 */
export {
  // Main system client class
  SystemClient,
  
  // Factory functions
  createSystemClient,
  createDefaultSystemClient,
  
  // Configuration constants
  SYSTEM_ENDPOINTS,
  SYSTEM_CACHE_KEYS,
  SYSTEM_CACHE_TTL,
  
  // Type exports for system operations
  type SystemConfigOptions,
  type EnvironmentDataOptions,
  type LicenseValidationOptions,
  type SystemHealthOptions,
  type CacheOperationOptions,
  type EmailConfigOptions,
  type CorsConfigOptions,
  type LookupKeyOptions,
  
  // Utility functions
  validateLicenseResponse,
  formatSystemInfo,
  buildSystemEndpoint,
  parseEnvironmentData,
  
  // Default export
  default as SystemApiClient,
} from './system-client';

// =============================================================================
// Authentication Client Exports
// =============================================================================

/**
 * JWT token management, session validation, and authentication headers
 */
export {
  // JWT utilities
  parseJWTPayload,
  isTokenExpired,
  extractUserFromToken,
  
  // Session management
  getSessionToken,
  setSessionToken,
  clearSessionToken,
  validateSession,
  refreshSessionToken,
  
  // Server-side authentication utilities
  getServerSessionToken,
  validateServerSession,
  extractSessionFromRequest,
  createAuthenticatedRequest,
  
  // Authentication headers
  getCurrentAuthHeaders,
  buildAuthHeaders,
  addAuthToRequest,
  
  // Cookie management
  setAuthCookie,
  clearAuthCookie,
  getAuthFromCookies,
  
  // Middleware utilities
  createAuthMiddleware,
  handleAuthError,
  refreshTokenMiddleware,
  
  // Factory functions
  createAuthClient,
  createDefaultAuthClient,
  
  // Type exports for authentication
  type AuthCookieConfig,
  type SessionValidationResult,
  type TokenRefreshResult,
  type MiddlewareAuthContext,
  type MiddlewareAuthResult,
  type AuthErrorCode,
  
  // Constants
  STORAGE_KEYS,
  DEFAULT_COOKIE_CONFIG,
  TOKEN_REFRESH_BUFFER_MS,
  MAX_REFRESH_RETRIES,
  
  // Default export
  default as AuthApiClient,
} from './auth-client';

// =============================================================================
// Request/Response Middleware Exports
// =============================================================================

/**
 * Middleware pipeline for request/response transformation
 */
export {
  // Middleware pipeline
  InterceptorPipeline,
  createDefaultMiddlewareStack,
  
  // Individual middleware functions
  caseTransformMiddleware,
  authenticationMiddleware,
  errorHandlingMiddleware,
  loadingStateMiddleware,
  notificationMiddleware,
  
  // Error handling utilities
  createErrorFromResponse,
  isRetryableStatusCode,
  shouldRetryError,
  
  // Loading and notification managers
  loadingStateManager,
  notificationManager,
  
  // Middleware configuration
  DEFAULT_MIDDLEWARE_CONFIG,
  MIDDLEWARE_PRIORITIES,
  
  // Header constants
  HTTP_HEADERS,
  MIDDLEWARE_HEADERS,
  
  // Type exports for middleware
  type MiddlewarePipeline,
  type MiddlewareContext,
  type MiddlewareState,
  type RequestInterceptor,
  type ResponseInterceptor,
  type ErrorInterceptor,
  type InterceptorConfig,
  
  // Default export
  default as ApiInterceptors,
} from './interceptors';

// =============================================================================
// Comprehensive Type Definitions Exports
// =============================================================================

/**
 * Complete TypeScript interface definitions for API client operations
 */
export type {
  // Core configuration types
  ApiClientConfig,
  ServerSideConfig,
  InterceptorConfig,
  InterceptorHandler,
  
  // Request and response types
  ApiRequestConfig,
  ApiResponse,
  HttpMethod,
  RequestParams,
  AuthConfig,
  CacheConfig,
  ProgressConfig,
  RequestMetadata,
  
  // Response metadata types
  ResponseStatus,
  ResponseMeta,
  TimingMeta,
  CacheMeta,
  PaginationMeta,
  
  // Authentication types
  SessionManager,
  AuthProvider,
  AuthContext,
  AuthHeaders,
  AuthState,
  LoginRequest,
  LoginResult,
  LogoutResult,
  RefreshRequest,
  RefreshResult,
  
  // File operation types
  FileService,
  FileUploadConfig,
  FileDownloadConfig,
  FileOperationResult,
  FileMetadata,
  FileUploadProgress,
  FileDownloadProgress,
  ProgressEvent,
  ProgressEventEmitter,
  ProgressEventListener,
  
  // Response wrapper types
  ListResponse,
  CreateResponse,
  UpdateResponse,
  DeleteResponse,
  BulkResponse,
  
  // Health and monitoring types
  HealthStatus,
  ClientMetrics,
  PerformanceMetrics,
  
  // Default configuration
  DEFAULT_CONFIG,
} from './types';

// =============================================================================
// Legacy Compatibility Exports
// =============================================================================

/**
 * Legacy compatibility utilities for gradual migration
 */
export {
  // Legacy request options conversion
  convertLegacyOptions,
  
  // Legacy response format conversion
  toLegacyResponse,
  fromLegacyResponse,
  
  // Legacy error handling
  convertLegacyError,
  
  // Legacy interceptor patterns
  createLegacyInterceptor,
  
  // Type exports for legacy compatibility
  type LegacyRequestOptions,
  type LegacyResponseFormat,
  type LegacyErrorFormat,
} from './legacy-adapter';

// =============================================================================
// Unified Factory Functions
// =============================================================================

/**
 * Create a complete API client instance with all capabilities
 * 
 * @param config - Complete API client configuration
 * @returns Configured API client with all capabilities
 */
export function createCompleteApiClient(config: ApiClientConfig) {
  const baseClient = createApiClient(config);
  const crudClient = createCrudClient(baseClient);
  const fileClient = createFileClient(baseClient);
  const systemClient = createSystemClient(baseClient);
  const authClient = createAuthClient(config);
  
  return {
    base: baseClient,
    crud: crudClient,
    files: fileClient,
    system: systemClient,
    auth: authClient,
    
    // Convenience methods
    get: baseClient.get.bind(baseClient),
    post: baseClient.post.bind(baseClient),
    put: baseClient.put.bind(baseClient),
    patch: baseClient.patch.bind(baseClient),
    delete: baseClient.delete.bind(baseClient),
    
    // Health and utility methods
    testConnection: baseClient.testConnection.bind(baseClient),
    getHealth: baseClient.getHealth.bind(baseClient),
    dispose: baseClient.dispose.bind(baseClient),
  };
}

/**
 * Create a default API client with standard DreamFactory configuration
 * 
 * @param baseUrl - DreamFactory instance base URL
 * @param apiKey - DreamFactory API key
 * @returns Pre-configured API client for typical usage
 */
export function createDefaultCompleteApiClient(baseUrl: string, apiKey: string) {
  const config: ApiClientConfig = {
    baseUrl,
    apiKey,
    timeout: 30000,
    withCredentials: true,
    retryConfig: {
      maxAttempts: 3,
      initialDelay: 1000,
      maxDelay: 10000,
      backoffFactor: 2,
      jitter: true,
      retryableStatusCodes: [408, 429, 500, 502, 503, 504],
      retryableNetworkErrors: ['TIMEOUT', 'NETWORK_ERROR', 'ECONNRESET'],
    },
    circuitBreakerConfig: {
      enabled: true,
      failureThreshold: 5,
      recoveryTimeout: 60000,
      monitoringPeriod: 10000,
    },
    interceptors: [],
    debug: process.env.NODE_ENV === 'development',
  };
  
  return createCompleteApiClient(config);
}

// =============================================================================
// Type-only Exports for Better Tree Shaking
// =============================================================================

/**
 * Re-export types for external consumption without importing implementation
 */
export type { KeyValuePair } from '@/types/generic-http';
export type { 
  UserSession,
  LoginCredentials,
  LoginResponse,
  JWTPayload,
} from '@/types/auth';
export type {
  AppError,
  NetworkError,
  ValidationError,
  AuthenticationError,
  AuthorizationError,
  ServerError,
  ClientError,
  SystemError,
  RetryConfig,
  CircuitBreakerConfig,
} from '@/types/error';

// =============================================================================
// Default Export
// =============================================================================

/**
 * Default export provides the base API client for simple usage
 */
export { BaseClient as default } from './base-client';

// =============================================================================
// Version and Metadata
// =============================================================================

/**
 * API client library version and metadata
 */
export const API_CLIENT_VERSION = '1.0.0';
export const API_CLIENT_BUILD = process.env.BUILD_NUMBER || 'development';
export const API_CLIENT_COMMIT = process.env.COMMIT_SHA || 'unknown';

/**
 * Feature flags for experimental functionality
 */
export const FEATURE_FLAGS = {
  CONCURRENT_REQUESTS: true,
  RESPONSE_STREAMING: true,
  REQUEST_DEDUPLICATION: true,
  BACKGROUND_SYNC: true,
  OFFLINE_SUPPORT: false, // Future enhancement
  GRAPHQL_SUPPORT: false, // Future enhancement
} as const;

/**
 * Performance monitoring configuration
 */
export const PERFORMANCE_CONFIG = {
  ENABLE_METRICS: process.env.NODE_ENV === 'development',
  COLLECT_TIMING: true,
  COLLECT_ERRORS: true,
  SAMPLE_RATE: 1.0,
} as const;