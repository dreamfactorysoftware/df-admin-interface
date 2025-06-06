/**
 * CORS (Cross-Origin Resource Sharing) configuration types for DreamFactory admin interface.
 * 
 * Defines type interfaces for CORS configuration management including CORS entry
 * creation, updates, validation, and status monitoring. Supports comprehensive
 * CORS configuration with path-based origins, HTTP methods, headers, and credentials.
 * 
 * @fileoverview CORS configuration type definitions
 * @version 1.0.0
 * @since React 19.0.0 / Next.js 15.1+
 */

import type { ApiResponse, ApiListResponse } from './api';

// ============================================================================
// Core CORS Configuration Types
// ============================================================================

/**
 * CORS configuration entry representing a single CORS rule
 */
export interface CorsConfig {
  /** Unique identifier for the CORS configuration */
  id: number;
  /** Descriptive name for the CORS configuration */
  description: string;
  /** Whether this CORS configuration is enabled */
  enabled: boolean;
  /** The resource path pattern this CORS rule applies to */
  path: string;
  /** Allowed origins for cross-origin requests */
  origin: string;
  /** Allowed HTTP methods for cross-origin requests */
  method: string[];
  /** Allowed headers for cross-origin requests */
  header: string;
  /** Headers exposed to the client */
  exposedHeader: string | null;
  /** Maximum age for preflight cache in seconds */
  maxAge: number;
  /** Whether to support credentials (cookies, authorization headers) */
  supportsCredentials: boolean;
  /** User ID who created this configuration */
  createdById: number | null;
  /** Timestamp when this configuration was created */
  createdDate: string | null;
  /** User ID who last modified this configuration */
  lastModifiedById: number | null;
  /** Timestamp when this configuration was last modified */
  lastModifiedDate: string | null;
}

/**
 * Data structure for CORS configuration creation
 * Omits auto-generated fields like id and timestamps
 */
export interface CorsConfigCreate {
  /** Descriptive name for the CORS configuration */
  description: string;
  /** Whether this CORS configuration is enabled */
  enabled: boolean;
  /** The resource path pattern this CORS rule applies to */
  path: string;
  /** Allowed origins for cross-origin requests */
  origin: string;
  /** Allowed HTTP methods for cross-origin requests */
  method: string[];
  /** Allowed headers for cross-origin requests */
  header: string;
  /** Headers exposed to the client */
  exposedHeader?: string;
  /** Maximum age for preflight cache in seconds */
  maxAge: number;
  /** Whether to support credentials (cookies, authorization headers) */
  supportsCredentials: boolean;
}

/**
 * Data structure for CORS configuration updates
 * All fields are optional except id
 */
export interface CorsConfigUpdate {
  /** Unique identifier for the CORS configuration */
  id: number;
  /** Descriptive name for the CORS configuration */
  description?: string;
  /** Whether this CORS configuration is enabled */
  enabled?: boolean;
  /** The resource path pattern this CORS rule applies to */
  path?: string;
  /** Allowed origins for cross-origin requests */
  origin?: string;
  /** Allowed HTTP methods for cross-origin requests */
  method?: string[];
  /** Allowed headers for cross-origin requests */
  header?: string;
  /** Headers exposed to the client */
  exposedHeader?: string;
  /** Maximum age for preflight cache in seconds */
  maxAge?: number;
  /** Whether to support credentials (cookies, authorization headers) */
  supportsCredentials?: boolean;
}

// ============================================================================
// API Response Types
// ============================================================================

/**
 * API response for CORS configuration list operations
 */
export type CorsConfigListResponse = ApiListResponse<CorsConfig>;

/**
 * API response for individual CORS configuration operations
 */
export type CorsConfigResponse = ApiResponse<CorsConfig>;

/**
 * API response for CORS configuration creation
 */
export type CorsConfigCreateResponse = ApiResponse<CorsConfig>;

/**
 * API response for CORS configuration updates
 */
export type CorsConfigUpdateResponse = ApiResponse<CorsConfig>;

/**
 * API response for CORS configuration deletion
 */
export type CorsConfigDeleteResponse = ApiResponse<{ success: boolean }>;

// ============================================================================
// Filter and Query Types
// ============================================================================

/**
 * CORS configuration filter options for list queries
 */
export interface CorsConfigFilter {
  /** Filter by enabled status */
  enabled?: boolean;
  /** Filter by path pattern */
  path?: string;
  /** Filter by origin pattern */
  origin?: string;
  /** Filter by description text search */
  description?: string;
  /** Filter by supported methods */
  method?: string[];
  /** Filter by creation date range */
  createdDateFrom?: string;
  /** Filter by creation date range */
  createdDateTo?: string;
}

/**
 * CORS configuration sort options
 */
export interface CorsConfigSort {
  /** Field to sort by */
  field: keyof CorsConfig;
  /** Sort direction */
  direction: 'asc' | 'desc';
}

/**
 * CORS configuration query parameters for list operations
 */
export interface CorsConfigQuery {
  /** Number of records to return */
  limit?: number;
  /** Number of records to skip */
  offset?: number;
  /** Filter criteria */
  filter?: CorsConfigFilter;
  /** Sort configuration */
  sort?: CorsConfigSort[];
  /** Fields to include in response */
  fields?: (keyof CorsConfig)[];
  /** Whether to include total count */
  includeCount?: boolean;
}

// ============================================================================
// Validation Constants
// ============================================================================

/**
 * Common HTTP methods for CORS configuration
 */
export const HTTP_METHODS = [
  'GET',
  'POST',
  'PUT',
  'PATCH',
  'DELETE',
  'HEAD',
  'OPTIONS',
] as const;

/**
 * HTTP method type union
 */
export type HttpMethod = typeof HTTP_METHODS[number];

/**
 * Common CORS headers
 */
export const COMMON_CORS_HEADERS = [
  'Accept',
  'Accept-Language',
  'Content-Language',
  'Content-Type',
  'Authorization',
  'X-Requested-With',
  'X-DreamFactory-Api-Key',
  'X-DreamFactory-Session-Token',
] as const;

/**
 * Default CORS configuration values
 */
export const DEFAULT_CORS_CONFIG: Partial<CorsConfigCreate> = {
  enabled: true,
  path: '/*',
  origin: '*',
  method: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  header: 'Content-Type, X-Requested-With, Authorization',
  exposedHeader: '',
  maxAge: 3600,
  supportsCredentials: false,
};

// ============================================================================
// Utility Types
// ============================================================================

/**
 * CORS configuration state for UI components
 */
export interface CorsConfigState {
  /** List of CORS configurations */
  configs: CorsConfig[];
  /** Currently selected CORS configuration */
  selectedConfig: CorsConfig | null;
  /** Loading state for CORS operations */
  isLoading: boolean;
  /** Error state for CORS operations */
  error: string | null;
  /** Total count of CORS configurations */
  totalCount: number;
  /** Current page information */
  pagination: {
    limit: number;
    offset: number;
    hasMore: boolean;
  };
}

/**
 * CORS operation status for optimistic updates
 */
export interface CorsOperationStatus {
  /** Operation type being performed */
  operation: 'create' | 'update' | 'delete' | 'toggle';
  /** ID of the CORS configuration being operated on */
  configId?: number;
  /** Whether the operation is in progress */
  isPending: boolean;
  /** Error message if operation failed */
  error?: string;
}

// ============================================================================
// Export all types
// ============================================================================

export type {
  CorsConfig,
  CorsConfigCreate,
  CorsConfigUpdate,
  CorsConfigListResponse,
  CorsConfigResponse,
  CorsConfigCreateResponse,
  CorsConfigUpdateResponse,
  CorsConfigDeleteResponse,
  CorsConfigFilter,
  CorsConfigSort,
  CorsConfigQuery,
  CorsConfigState,
  CorsOperationStatus,
  HttpMethod,
};

export {
  HTTP_METHODS,
  COMMON_CORS_HEADERS,
  DEFAULT_CORS_CONFIG,
};