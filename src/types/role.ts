/**
 * Role type definitions for DreamFactory admin interface.
 * 
 * Provides comprehensive type definitions for role management operations,
 * permissions, access controls, and related data structures. Supports
 * TypeScript 5.8+ with enhanced React 19 compatibility.
 * 
 * @fileoverview Role type definitions for role management
 * @version 1.0.0
 * @since React 19.0.0 / Next.js 15.1+
 */

import { z } from 'zod';

// ============================================================================
// Core Role Interfaces
// ============================================================================

/**
 * Table row representation for role data display
 * Optimized for UI rendering and table operations
 */
export interface RoleRow {
  /** Unique role identifier */
  id: number;
  /** Role name */
  name: string;
  /** Role description */
  description: string;
  /** Whether the role is active/enabled */
  active: boolean;
}

/**
 * Complete role data structure from DreamFactory API
 * Includes all fields for comprehensive role management
 */
export interface RoleType {
  /** Unique role identifier */
  id: number;
  /** Role name */
  name: string;
  /** Role description */
  description: string;
  /** Whether the role is active/enabled */
  isActive: boolean;
  /** ID of user who created this role */
  createdById: number;
  /** Creation timestamp in ISO format */
  createdDate: string;
  /** ID of user who last modified this role */
  lastModifiedById: number;
  /** Last modification timestamp in ISO format */
  lastModifiedDate: string;
  /** Array of lookup IDs associated with this role */
  lookupByRoleId: number[];
  /** Accessible tabs for this role (optional) */
  accessibleTabs?: Array<string>;
}

/**
 * Role service access configuration
 * Defines what services a role can access and with what permissions
 */
export interface RoleServiceAccess {
  /** Unique access configuration ID */
  id: number;
  /** Role ID this access belongs to */
  roleId: number;
  /** Service ID being accessed */
  serviceId: number;
  /** Component within the service (optional) */
  component?: string;
  /** HTTP verbs allowed (GET, POST, PUT, DELETE, etc.) */
  verbMask: number;
  /** Request filters (optional) */
  requestorType: number;
  /** Additional filters and conditions */
  filters?: string;
  /** Filter operator (AND, OR) */
  filterOp?: string;
}

/**
 * Lookup configuration associated with a role
 * Provides dynamic value lookups for role-based functionality
 */
export interface RoleLookup {
  /** Unique lookup ID */
  id: number;
  /** Role ID this lookup belongs to */
  roleId: number;
  /** Lookup name/key */
  name: string;
  /** Lookup value */
  value: string;
  /** Whether this lookup is private to the role */
  private: boolean;
  /** Lookup description */
  description?: string;
}

// ============================================================================
// Role Management Operation Types
// ============================================================================

/**
 * Role creation data
 * Data required to create a new role
 */
export interface CreateRoleData {
  /** Role name */
  name: string;
  /** Role description */
  description: string;
  /** Whether the role should be active */
  isActive: boolean;
  /** Service access configurations */
  roleServiceAccess?: Omit<RoleServiceAccess, 'id' | 'roleId'>[];
  /** Lookup configurations */
  lookupByRoleId?: Omit<RoleLookup, 'id' | 'roleId'>[];
}

/**
 * Role update data
 * Data for updating an existing role
 */
export interface UpdateRoleData extends Partial<CreateRoleData> {
  /** Role ID being updated */
  id: number;
}

/**
 * Role deletion data
 * Configuration for role deletion operations
 */
export interface DeleteRoleData {
  /** Role ID to delete */
  id: number;
  /** Whether to force deletion even if role has dependencies */
  force?: boolean;
}

// ============================================================================
// API Response Types
// ============================================================================

/**
 * Complete role data with all related information
 * Returned when fetching a single role with related data
 */
export interface RoleWithRelations extends RoleType {
  /** Service access configurations for this role */
  roleServiceAccessByRoleId?: RoleServiceAccess[];
  /** Lookup configurations for this role */
  lookupByRoleId?: RoleLookup[];
}

/**
 * Role list item for display in tables and lists
 * Optimized for list rendering with essential information
 */
export interface RoleListItem {
  /** Unique role identifier */
  id: number;
  /** Role name */
  name: string;
  /** Role description */
  description: string;
  /** Whether the role is active */
  isActive: boolean;
  /** Number of users assigned to this role */
  userCount?: number;
  /** Number of service access rules */
  serviceAccessCount?: number;
  /** Last modification date for sorting */
  lastModifiedDate: string;
}

// ============================================================================
// Role Query and Filter Types
// ============================================================================

/**
 * Role query parameters for filtering and pagination
 */
export interface RoleQueryParams {
  /** Search filter */
  filter?: string;
  /** Sort field and direction */
  sort?: string;
  /** Fields to include in response */
  fields?: string;
  /** Related data to include */
  related?: string;
  /** Number of items per page */
  limit?: number;
  /** Page offset */
  offset?: number;
  /** Include total count */
  includeCount?: boolean;
  /** Include accessible tabs data */
  accessibleTabs?: boolean;
}

/**
 * Role filter options for UI components
 */
export interface RoleFilterOptions {
  /** Filter by active status */
  isActive?: boolean;
  /** Search by name or description */
  search?: string;
  /** Filter by creation date range */
  createdDateFrom?: string;
  createdDateTo?: string;
  /** Filter by last modification date range */
  lastModifiedDateFrom?: string;
  lastModifiedDateTo?: string;
  /** Filter by user who created the role */
  createdById?: number;
}

// ============================================================================
// Permission and Access Control Types
// ============================================================================

/**
 * HTTP verbs for API access control
 */
export enum HttpVerb {
  GET = 1,
  POST = 2,
  PUT = 4,
  PATCH = 8,
  DELETE = 16,
  OPTIONS = 32,
  HEAD = 64,
}

/**
 * Service access configuration for role permissions
 */
export interface ServiceAccessConfig {
  /** Service name */
  serviceName: string;
  /** Allowed HTTP verbs (bitmask) */
  allowedVerbs: number;
  /** Component-level access (optional) */
  componentAccess?: {
    /** Component name */
    component: string;
    /** Allowed verbs for this component */
    verbs: number;
  }[];
  /** Request filters */
  filters?: {
    /** Filter conditions */
    condition: string;
    /** Filter operator */
    operator: 'AND' | 'OR';
  }[];
}

/**
 * Role permission summary
 * Aggregated view of role permissions for display
 */
export interface RolePermissionSummary {
  /** Role ID */
  roleId: number;
  /** Total number of services accessible */
  serviceCount: number;
  /** Services with full access */
  fullAccessServices: string[];
  /** Services with limited access */
  limitedAccessServices: string[];
  /** Number of lookup configurations */
  lookupCount: number;
  /** Whether role has administrative privileges */
  isAdmin: boolean;
}

// ============================================================================
// Validation Schemas
// ============================================================================

/**
 * Zod schema for role creation validation
 */
export const CreateRoleSchema = z.object({
  name: z.string()
    .min(1, 'Role name is required')
    .max(64, 'Role name must be less than 64 characters')
    .regex(/^[a-zA-Z0-9_-]+$/, 'Role name can only contain letters, numbers, underscores, and hyphens'),
  description: z.string()
    .max(255, 'Description must be less than 255 characters')
    .optional()
    .or(z.literal('')),
  isActive: z.boolean().default(true),
});

/**
 * Zod schema for role update validation
 */
export const UpdateRoleSchema = CreateRoleSchema.partial().extend({
  id: z.number().int().positive('Role ID must be a positive integer'),
});

/**
 * Zod schema for role query parameters validation
 */
export const RoleQuerySchema = z.object({
  filter: z.string().optional(),
  sort: z.string().optional(),
  fields: z.string().optional(),
  related: z.string().optional(),
  limit: z.number().int().min(1).max(1000).optional(),
  offset: z.number().int().min(0).optional(),
  includeCount: z.boolean().optional(),
  accessibleTabs: z.boolean().optional(),
}).partial();

/**
 * Zod schema for service access configuration validation
 */
export const ServiceAccessSchema = z.object({
  serviceId: z.number().int().positive(),
  component: z.string().optional(),
  verbMask: z.number().int().min(0).max(127), // Max value for all HTTP verbs
  requestorType: z.number().int().min(0),
  filters: z.string().optional(),
  filterOp: z.enum(['AND', 'OR']).optional(),
});

// ============================================================================
// Type Guards and Utilities
// ============================================================================

/**
 * Type guard to check if an object is a complete RoleType
 */
export function isRoleType(obj: any): obj is RoleType {
  return obj && 
    typeof obj.id === 'number' &&
    typeof obj.name === 'string' &&
    typeof obj.isActive === 'boolean' &&
    typeof obj.createdDate === 'string' &&
    typeof obj.lastModifiedDate === 'string';
}

/**
 * Type guard to check if an object is a RoleWithRelations
 */
export function isRoleWithRelations(obj: any): obj is RoleWithRelations {
  return isRoleType(obj) && (
    obj.roleServiceAccessByRoleId !== undefined ||
    obj.lookupByRoleId !== undefined
  );
}

/**
 * Utility to convert RoleType to RoleRow for table display
 */
export function roleTypeToRoleRow(role: RoleType): RoleRow {
  return {
    id: role.id,
    name: role.name,
    description: role.description || '',
    active: role.isActive,
  };
}

/**
 * Utility to map role data for table display
 */
export function mapRolesToTableData(roles: RoleType[]): RoleRow[] {
  return roles.map(roleTypeToRoleRow);
}

/**
 * Utility to calculate HTTP verb mask from array of verbs
 */
export function calculateVerbMask(verbs: HttpVerb[]): number {
  return verbs.reduce((mask, verb) => mask | verb, 0);
}

/**
 * Utility to extract HTTP verbs from verb mask
 */
export function extractVerbsFromMask(verbMask: number): HttpVerb[] {
  const verbs: HttpVerb[] = [];
  Object.values(HttpVerb).forEach(verb => {
    if (typeof verb === 'number' && (verbMask & verb) === verb) {
      verbs.push(verb);
    }
  });
  return verbs;
}

// ============================================================================
// Type Exports for Convenience
// ============================================================================

export type { RoleType as Role };
export type { RoleWithRelations as RoleDetails };
export type { CreateRoleData as CreateRole };
export type { UpdateRoleData as UpdateRole };
export type { DeleteRoleData as DeleteRole };
export type { RoleQueryParams as RoleQuery };
export type { RoleFilterOptions as RoleFilters };

// Export schemas for external validation
export {
  CreateRoleSchema,
  UpdateRoleSchema,
  RoleQuerySchema,
  ServiceAccessSchema,
} as RoleSchemas;