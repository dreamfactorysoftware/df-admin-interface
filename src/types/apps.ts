/**
 * Application management types for DreamFactory admin interface apps.
 * 
 * Provides type definitions for application configurations, app roles,
 * and application deployment patterns. Supports React Query optimization
 * and server-side rendering capabilities with Next.js integration.
 * 
 * @fileoverview Application management type definitions
 * @version 1.0.0
 * @since React 19.0.0 / Next.js 15.1+
 */

import { z } from 'zod';
import type { ApiListResponse, ApiResourceResponse } from './api';

// ============================================================================
// Core Application Types
// ============================================================================

/**
 * Role type for application role assignments
 */
export interface RoleType {
  id: number;
  name: string;
  description?: string;
  isActive: boolean;
  roleServiceAccess?: any[];
  lookupKeys?: any[];
  createdDate: string;
  lastModifiedDate: string;
  createdById: number;
  lastModifiedById?: number;
}

/**
 * Application row representation for table display
 * Optimized for data grid components and virtual scrolling
 */
export interface AppRow {
  /** Unique application ID */
  id: number;
  /** Application display name */
  name: string;
  /** Associated role name for display */
  role: string;
  /** Application API key for authentication */
  apiKey: string;
  /** Optional application description */
  description?: string;
  /** Whether the application is currently active */
  active: boolean;
  /** Launch URL for the application */
  launchUrl: string;
  /** ID of the user who created this application */
  createdById: number;
}

/**
 * Complete application configuration type
 * Enhanced with React Hook Form and Zod validation compatibility
 */
export interface AppType {
  /** Unique application identifier */
  id: number;
  /** Application name (must be unique) */
  name: string;
  /** API key for application authentication */
  apiKey: string;
  /** Application description */
  description: string;
  /** Application active status */
  isActive: boolean;
  /** Application type/location code (0,1,2,3) */
  type: number;
  /** File path for local applications */
  path?: string;
  /** URL for remote applications */
  url?: string;
  /** Storage service ID for hosted applications */
  storageServiceId?: number;
  /** Storage container for hosted applications */
  storageContainer?: string;
  /** Whether application requires fullscreen mode */
  requiresFullscreen: boolean;
  /** Whether fullscreen toggle is allowed */
  allowFullscreenToggle: boolean;
  /** Location of fullscreen toggle */
  toggleLocation: string;
  /** Associated role ID for access control */
  roleId?: number;
  /** Creation timestamp */
  createdDate: string;
  /** Last modification timestamp */
  lastModifiedDate: string;
  /** Creator user ID */
  createdById: number;
  /** Last modifier user ID */
  lastModifiedById?: number;
  /** Computed launch URL */
  launchUrl: string;
  /** Associated role details (populated by related parameter) */
  roleByRoleId?: RoleType;
}

/**
 * Application creation/update payload
 * Optimized for React Hook Form with snake_case API compatibility
 */
export interface AppPayload {
  /** Application name */
  name: string;
  /** Application description */
  description?: string;
  /** Application location type (0,1,2,3) */
  type: number;
  /** Associated role ID */
  role_id?: number;
  /** Active status */
  is_active: boolean;
  /** Application URL */
  url?: string;
  /** Storage service ID */
  storage_service_id?: number;
  /** Storage container */
  storage_container?: string;
  /** File path for local apps */
  path?: string;
  /** Fullscreen requirements */
  requires_fullscreen?: boolean;
  /** Fullscreen toggle settings */
  allow_fullscreen_toggle?: boolean;
  /** Toggle location */
  toggle_location?: string;
}

// ============================================================================
// Application List Response Types
// ============================================================================

/**
 * App list response from DreamFactory API
 * Compatible with React Query and SWR caching patterns
 */
export type AppListResponse = ApiListResponse<AppType>;

/**
 * Single app response from DreamFactory API
 */
export type AppResourceResponse = ApiResourceResponse<AppType>;

// ============================================================================
// Application Query and Filter Types
// ============================================================================

/**
 * Application list query parameters
 * Enhanced with React Query select functions and filtering options
 */
export interface AppQueryOptions {
  /** Include related role information */
  related?: string;
  /** Field selection for response optimization */
  fields?: string;
  /** Maximum number of apps to return */
  limit?: number;
  /** Pagination offset */
  offset?: number;
  /** Sorting parameters */
  sort?: string;
  /** Filtering parameters */
  filter?: string;
  /** Include total count */
  includeCount?: boolean;
  /** Force refresh */
  refresh?: boolean;
}

/**
 * Application filtering and search options
 * Optimized for React Query select functions and virtual scrolling
 */
export interface AppFilterOptions {
  /** Filter by application name */
  name?: string;
  /** Filter by active status */
  isActive?: boolean;
  /** Filter by application type */
  type?: number;
  /** Filter by role ID */
  roleId?: number;
  /** Search term for name/description */
  search?: string;
  /** Include archived applications */
  includeArchived?: boolean;
}

// ============================================================================
// React Query Integration Types
// ============================================================================

/**
 * App list query key for React Query caching
 * Supports intelligent cache invalidation and background synchronization
 */
export type AppQueryKey = [
  'apps',
  'list',
  AppQueryOptions?
];

/**
 * Single app query key for React Query caching
 */
export type AppDetailQueryKey = [
  'apps',
  'detail',
  number | string,
  AppQueryOptions?
];

/**
 * App mutation variables for create operations
 */
export interface AppCreateMutation {
  data: AppPayload;
}

/**
 * App mutation variables for update operations
 */
export interface AppUpdateMutation {
  id: number;
  data: Partial<AppPayload>;
}

/**
 * App mutation variables for delete operations
 */
export interface AppDeleteMutation {
  id: number | number[];
}

// ============================================================================
// Zod Schema Validation
// ============================================================================

/**
 * Zod schema for application type validation
 * Provides runtime type checking with compile-time inference
 */
export const AppTypeSchema = z.object({
  id: z.number().int().positive(),
  name: z.string().min(1).max(255),
  apiKey: z.string().min(1),
  description: z.string(),
  isActive: z.boolean(),
  type: z.number().int().min(0).max(3),
  path: z.string().optional(),
  url: z.string().url().optional(),
  storageServiceId: z.number().int().positive().optional(),
  storageContainer: z.string().optional(),
  requiresFullscreen: z.boolean(),
  allowFullscreenToggle: z.boolean(),
  toggleLocation: z.string(),
  roleId: z.number().int().positive().optional(),
  createdDate: z.string().datetime(),
  lastModifiedDate: z.string().datetime(),
  createdById: z.number().int().positive(),
  lastModifiedById: z.number().int().positive().optional(),
  launchUrl: z.string().url(),
  roleByRoleId: z.object({
    id: z.number().int().positive(),
    name: z.string(),
    description: z.string().optional(),
    isActive: z.boolean(),
    createdDate: z.string().datetime(),
    lastModifiedDate: z.string().datetime(),
    createdById: z.number().int().positive(),
    lastModifiedById: z.number().int().positive().optional(),
  }).optional(),
});

/**
 * Zod schema for application payload validation
 */
export const AppPayloadSchema = z.object({
  name: z.string().min(1).max(255),
  description: z.string().optional(),
  type: z.number().int().min(0).max(3),
  role_id: z.number().int().positive().optional(),
  is_active: z.boolean(),
  url: z.string().url().optional(),
  storage_service_id: z.number().int().positive().optional(),
  storage_container: z.string().optional(),
  path: z.string().optional(),
  requires_fullscreen: z.boolean().optional(),
  allow_fullscreen_toggle: z.boolean().optional(),
  toggle_location: z.string().optional(),
});

/**
 * Zod schema for application query options validation
 */
export const AppQueryOptionsSchema = z.object({
  related: z.string().optional(),
  fields: z.string().optional(),
  limit: z.number().int().min(1).max(1000).optional(),
  offset: z.number().int().min(0).optional(),
  sort: z.string().optional(),
  filter: z.string().optional(),
  includeCount: z.boolean().optional(),
  refresh: z.boolean().optional(),
});

// ============================================================================
// Application Constants
// ============================================================================

/**
 * Application type constants
 */
export const APP_TYPES = {
  /** No storage */
  NONE: 0,
  /** Local file storage */
  LOCAL_FILE: 1,
  /** URL-based application */
  URL: 2,
  /** Cloud storage application */
  CLOUD_STORAGE: 3,
} as const;

/**
 * Default application query options
 * Optimized for React Query caching and performance
 */
export const DEFAULT_APP_QUERY_OPTIONS: Required<AppQueryOptions> = {
  related: 'role_by_role_id',
  fields: '*',
  limit: 50,
  offset: 0,
  sort: 'name',
  filter: '',
  includeCount: true,
  refresh: false,
};

/**
 * Application table columns for data grid display
 */
export const APP_TABLE_COLUMNS = [
  'name',
  'description',
  'type',
  'isActive',
  'roleByRoleId.name',
  'launchUrl',
  'createdDate',
] as const;

// ============================================================================
// Type Utilities and Guards
// ============================================================================

/**
 * Type guard to check if an object is a valid AppType
 */
export function isAppType(obj: any): obj is AppType {
  try {
    AppTypeSchema.parse(obj);
    return true;
  } catch {
    return false;
  }
}

/**
 * Type guard to check if an object is a valid AppPayload
 */
export function isAppPayload(obj: any): obj is AppPayload {
  try {
    AppPayloadSchema.parse(obj);
    return true;
  } catch {
    return false;
  }
}

/**
 * Transform AppType to AppRow for table display
 */
export function transformAppToRow(app: AppType): AppRow {
  return {
    id: app.id,
    name: app.name,
    role: app.roleByRoleId?.name || '',
    apiKey: app.apiKey,
    description: app.description,
    active: app.isActive,
    launchUrl: app.launchUrl,
    createdById: app.createdById,
  };
}

/**
 * Transform AppPayload to API format (camelCase to snake_case)
 */
export function transformPayloadToApi(payload: AppPayload): Record<string, any> {
  return {
    name: payload.name,
    description: payload.description,
    type: payload.type,
    role_id: payload.role_id,
    is_active: payload.is_active,
    url: payload.url,
    storage_service_id: payload.storage_service_id,
    storage_container: payload.storage_container,
    path: payload.path,
    requires_fullscreen: payload.requires_fullscreen,
    allow_fullscreen_toggle: payload.allow_fullscreen_toggle,
    toggle_location: payload.toggle_location,
  };
}

/**
 * Get application type display name
 */
export function getAppTypeDisplayName(type: number): string {
  switch (type) {
    case APP_TYPES.NONE:
      return 'No Storage';
    case APP_TYPES.LOCAL_FILE:
      return 'Local File';
    case APP_TYPES.URL:
      return 'URL';
    case APP_TYPES.CLOUD_STORAGE:
      return 'Cloud Storage';
    default:
      return 'Unknown';
  }
}

// ============================================================================
// Legacy Compatibility
// ============================================================================

/**
 * Legacy compatibility export for existing code
 * @deprecated Use AppType instead
 */
export type App = AppType;

/**
 * Legacy compatibility export for existing code
 * @deprecated Use AppListResponse instead
 */
export type AppsResponse = AppListResponse;

// Export for convenience
export default {
  AppType,
  AppPayload,
  AppListResponse,
  AppResourceResponse,
  AppQueryOptions,
  AppFilterOptions,
  APP_TYPES,
  DEFAULT_APP_QUERY_OPTIONS,
  APP_TABLE_COLUMNS,
  AppTypeSchema,
  AppPayloadSchema,
  AppQueryOptionsSchema,
  isAppType,
  isAppPayload,
  transformAppToRow,
  transformPayloadToApi,
  getAppTypeDisplayName,
};