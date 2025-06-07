/**
 * Role-based Access Control (RBAC) Types
 * 
 * Comprehensive type definitions for role management, permissions, and service access control.
 * Maintains compatibility with existing DreamFactory backend APIs while supporting modern
 * React component patterns and Next.js middleware authentication flows.
 * 
 * @fileoverview Role and permission system types for React/Next.js integration
 * @version 1.0.0
 */

import { ReactNode } from 'react';

// =============================================================================
// Core Role and Permission Types
// =============================================================================

/**
 * Base role definition representing a user role in the system
 * Maps to backend `/api/v2/system/role` endpoint structure
 */
export interface Role {
  /** Unique role identifier */
  id: number;
  
  /** Role name (unique system identifier) */
  name: string;
  
  /** Human-readable role display label */
  label?: string;
  
  /** Role description and purpose */
  description?: string;
  
  /** Whether role is active and assignable */
  is_active: boolean;
  
  /** Whether this is a system-defined role (non-deletable) */
  is_system?: boolean;
  
  /** Default role assigned to new users */
  is_default?: boolean;
  
  /** Role creation timestamp */
  created_date: string;
  
  /** Last modification timestamp */
  last_modified_date: string;
  
  /** User ID who created the role */
  created_by_id?: number;
  
  /** User ID who last modified the role */
  last_modified_by_id?: number;
  
  /** Role lookup keys for system integration */
  role_lookup_by_role_id?: RoleLookup[];
  
  /** Service access configurations */
  role_service_access_by_role_id?: RoleServiceAccess[];
  
  /** User assignments for this role */
  user_to_app_to_role_by_role_id?: UserRoleAssignment[];
}

/**
 * Role lookup key configuration for system integration
 * Enables role-based configuration lookups
 */
export interface RoleLookup {
  /** Unique lookup identifier */
  id: number;
  
  /** Associated role ID */
  role_id: number;
  
  /** Lookup key name */
  name: string;
  
  /** Lookup key value */
  value: string;
  
  /** Whether lookup is private (not visible in client) */
  private?: boolean;
  
  /** Creation timestamp */
  created_date: string;
  
  /** Last modification timestamp */
  last_modified_date: string;
}

/**
 * Service access control configuration for roles
 * Maps to backend role service access management
 */
export interface RoleServiceAccess {
  /** Unique access rule identifier */
  id: number;
  
  /** Associated role ID */
  role_id: number;
  
  /** Service ID or name being accessed */
  service_id: number;
  
  /** Component within service (table, endpoint, etc.) */
  component?: string;
  
  /** HTTP verb permissions */
  verb_mask: number;
  
  /** Request filters (JSON string) */
  requestor_type: RequestorType;
  
  /** Access filters and conditions */
  filters?: string;
  
  /** Filter conditions for read operations */
  filter_op?: FilterOperation;
  
  /** Additional access filters */
  filters_additional?: string;
  
  /** Creation timestamp */
  created_date: string;
  
  /** Last modification timestamp */
  last_modified_date: string;
}

/**
 * User role assignment mapping
 * Represents user-to-role assignments with app context
 */
export interface UserRoleAssignment {
  /** Unique assignment identifier */
  id: number;
  
  /** User ID */
  user_id: number;
  
  /** Application ID context */
  app_id?: number;
  
  /** Assigned role ID */
  role_id: number;
  
  /** Assignment creation timestamp */
  created_date: string;
  
  /** Last modification timestamp */
  last_modified_date: string;
  
  /** User who created the assignment */
  created_by_id?: number;
  
  /** User who last modified the assignment */
  last_modified_by_id?: number;
}

// =============================================================================
// Permission and Access Control Types
// =============================================================================

/**
 * HTTP verb permission mask values
 * Bitwise representation of CRUD operations
 */
export enum VerbMask {
  None = 0,
  GET = 1,
  POST = 2,
  PUT = 4,
  PATCH = 8,
  DELETE = 16,
  All = GET | POST | PUT | PATCH | DELETE
}

/**
 * HTTP verb names for permission configuration
 */
export type HttpVerb = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

/**
 * Requestor type enumeration
 */
export enum RequestorType {
  API = 1,
  SCRIPT = 2,
  ADMIN = 4,
  APP = 8
}

/**
 * Filter operation types for access control
 */
export type FilterOperation = 'AND' | 'OR';

/**
 * Permission check result for React components
 */
export interface PermissionCheckResult {
  /** Whether access is granted */
  granted: boolean;
  
  /** Reason for denial (if not granted) */
  reason?: string;
  
  /** Required permissions that are missing */
  requiredPermissions?: Permission[];
  
  /** Alternative actions user can take */
  alternatives?: PermissionAlternative[];
}

/**
 * Individual permission definition
 */
export interface Permission {
  /** Service name or identifier */
  service: string;
  
  /** Specific component (table, endpoint, etc.) */
  component?: string;
  
  /** Required HTTP verb */
  verb: HttpVerb;
  
  /** Additional access conditions */
  conditions?: Record<string, any>;
}

/**
 * Alternative permission actions
 */
export interface PermissionAlternative {
  /** Alternative action name */
  action: string;
  
  /** Alternative action label */
  label: string;
  
  /** Route or handler for alternative */
  route?: string;
  
  /** Required permissions for alternative */
  permissions: Permission[];
}

// =============================================================================
// Service and Resource Types
// =============================================================================

/**
 * Service metadata for role-based access control
 */
export interface ServiceInfo {
  /** Service unique identifier */
  id: number;
  
  /** Service name */
  name: string;
  
  /** Service display label */
  label?: string;
  
  /** Service description */
  description?: string;
  
  /** Service type (database, file, etc.) */
  type: ServiceType;
  
  /** Whether service is active */
  is_active: boolean;
  
  /** Available components (tables, endpoints, etc.) */
  components?: ServiceComponent[];
  
  /** Default access level */
  default_access?: VerbMask;
  
  /** Service-specific configuration */
  config?: Record<string, any>;
}

/**
 * Service type enumeration
 */
export type ServiceType = 
  | 'mysql'
  | 'postgresql'
  | 'sqlserver'
  | 'oracle'
  | 'mongodb'
  | 'snowflake'
  | 'sqlite'
  | 'file'
  | 'email'
  | 'script'
  | 'user'
  | 'system'
  | 'oauth'
  | 'saml'
  | 'ldap'
  | 'custom';

/**
 * Service component (table, endpoint, etc.)
 */
export interface ServiceComponent {
  /** Component name */
  name: string;
  
  /** Component display label */
  label?: string;
  
  /** Component description */
  description?: string;
  
  /** Available operations */
  operations: HttpVerb[];
  
  /** Component type */
  type: ComponentType;
  
  /** Whether component requires authentication */
  requires_auth?: boolean;
  
  /** Default access permissions */
  default_permissions?: VerbMask;
}

/**
 * Component type enumeration
 */
export type ComponentType = 
  | 'table'
  | 'view'
  | 'procedure'
  | 'function'
  | 'endpoint'
  | 'file'
  | 'folder'
  | 'resource';

// =============================================================================
// User Context and Session Types
// =============================================================================

/**
 * Current user context with role information
 * Used throughout React components for permission checks
 */
export interface UserContext {
  /** User identifier */
  id: number;
  
  /** User email */
  email: string;
  
  /** User display name */
  name?: string;
  
  /** First name */
  first_name?: string;
  
  /** Last name */
  last_name?: string;
  
  /** Whether user is active */
  is_active: boolean;
  
  /** Whether user is system admin */
  is_sys_admin?: boolean;
  
  /** User's assigned roles */
  roles: UserRole[];
  
  /** Computed permissions cache */
  permissions?: PermissionSet;
  
  /** User preferences */
  preferences?: UserPreferences;
  
  /** Current session information */
  session?: SessionInfo;
}

/**
 * User role with app context
 */
export interface UserRole {
  /** Role information */
  role: Role;
  
  /** Application context (if app-specific) */
  app_id?: number;
  
  /** App name for display */
  app_name?: string;
  
  /** When role was assigned */
  assigned_date: string;
  
  /** Role assignment status */
  status: RoleAssignmentStatus;
}

/**
 * Role assignment status
 */
export type RoleAssignmentStatus = 'active' | 'pending' | 'suspended' | 'expired';

/**
 * Computed permission set for efficient lookups
 */
export interface PermissionSet {
  /** Service-level permissions */
  services: Record<string, ServicePermissions>;
  
  /** Global permissions */
  global: GlobalPermissions;
  
  /** Permission computation timestamp */
  computed_at: string;
  
  /** Cache expiration time */
  expires_at: string;
}

/**
 * Service-specific permissions
 */
export interface ServicePermissions {
  /** Service identifier */
  service: string;
  
  /** Component-level permissions */
  components: Record<string, ComponentPermissions>;
  
  /** Service-level verb permissions */
  verbs: HttpVerb[];
  
  /** Access filters */
  filters?: AccessFilter[];
}

/**
 * Component-specific permissions
 */
export interface ComponentPermissions {
  /** Component identifier */
  component: string;
  
  /** Allowed HTTP verbs */
  verbs: HttpVerb[];
  
  /** Access conditions */
  conditions?: Record<string, any>;
  
  /** Field-level restrictions */
  fields?: FieldPermissions;
}

/**
 * Field-level permissions for fine-grained access control
 */
export interface FieldPermissions {
  /** Readable fields */
  read?: string[];
  
  /** Writable fields */
  write?: string[];
  
  /** Hidden fields */
  hidden?: string[];
  
  /** Required fields for operations */
  required?: string[];
}

/**
 * Access filter for conditional permissions
 */
export interface AccessFilter {
  /** Filter field */
  field: string;
  
  /** Filter operation */
  operator: FilterOperator;
  
  /** Filter value */
  value: any;
  
  /** Filter logic combination */
  logic?: FilterOperation;
}

/**
 * Filter operator types
 */
export type FilterOperator = 
  | 'eq'
  | 'ne'
  | 'gt'
  | 'gte'
  | 'lt'
  | 'lte'
  | 'in'
  | 'nin'
  | 'like'
  | 'ilike'
  | 'rlike'
  | 'contains'
  | 'starts_with'
  | 'ends_with'
  | 'is_null'
  | 'is_not_null'
  | 'between';

/**
 * Global system permissions
 */
export interface GlobalPermissions {
  /** System administration access */
  system_admin: boolean;
  
  /** User management permissions */
  user_management: boolean;
  
  /** Role management permissions */
  role_management: boolean;
  
  /** Service management permissions */
  service_management: boolean;
  
  /** API documentation access */
  api_docs: boolean;
  
  /** System configuration access */
  system_config: boolean;
  
  /** File management permissions */
  file_management: boolean;
  
  /** Log viewing permissions */
  log_viewing: boolean;
  
  /** Schema management permissions */
  schema_management: boolean;
}

/**
 * User preferences for role and security settings
 */
export interface UserPreferences {
  /** Preferred language */
  language?: string;
  
  /** Timezone setting */
  timezone?: string;
  
  /** Date format preference */
  date_format?: string;
  
  /** Session timeout preference (minutes) */
  session_timeout?: number;
  
  /** Security notification settings */
  security_notifications?: SecurityNotificationSettings;
  
  /** Role-specific preferences */
  role_preferences?: Record<number, RolePreferences>;
}

/**
 * Security notification preferences
 */
export interface SecurityNotificationSettings {
  /** Email notifications for security events */
  email_security_alerts: boolean;
  
  /** Login attempt notifications */
  login_notifications: boolean;
  
  /** Permission change notifications */
  permission_notifications: boolean;
  
  /** Role assignment notifications */
  role_notifications: boolean;
}

/**
 * Role-specific user preferences
 */
export interface RolePreferences {
  /** Default view for role */
  default_view?: string;
  
  /** Preferred service access order */
  service_order?: string[];
  
  /** Quick access services */
  quick_access?: string[];
  
  /** Hidden services */
  hidden_services?: string[];
}

/**
 * Session information for authentication context
 */
export interface SessionInfo {
  /** Session token identifier */
  id: string;
  
  /** Session creation time */
  created_at: string;
  
  /** Session expiration time */
  expires_at: string;
  
  /** Last activity timestamp */
  last_activity: string;
  
  /** Session IP address */
  ip_address?: string;
  
  /** User agent string */
  user_agent?: string;
  
  /** Whether session is remembered */
  remember_me: boolean;
  
  /** Session security flags */
  security_flags?: SessionSecurityFlags;
}

/**
 * Session security configuration
 */
export interface SessionSecurityFlags {
  /** Secure cookie requirement */
  secure_only: boolean;
  
  /** HTTP-only cookie requirement */
  http_only: boolean;
  
  /** Same-site cookie policy */
  same_site: 'strict' | 'lax' | 'none';
  
  /** Require session refresh */
  require_refresh: boolean;
  
  /** Multi-factor authentication required */
  mfa_required: boolean;
}

// =============================================================================
// React Component Integration Types
// =============================================================================

/**
 * Props for role-based access control React components
 */
export interface RoleGuardProps {
  /** Required roles for access */
  requiredRoles?: string[];
  
  /** Required permissions */
  requiredPermissions?: Permission[];
  
  /** Fallback component when access denied */
  fallback?: ReactNode;
  
  /** Loading component during permission check */
  loading?: ReactNode;
  
  /** Custom permission check function */
  customCheck?: (user: UserContext) => boolean;
  
  /** Child components to render when authorized */
  children: ReactNode;
  
  /** Redirect URL when access denied */
  redirectTo?: string;
  
  /** Show access denied message */
  showAccessDenied?: boolean;
}

/**
 * Hook return type for role-based access control
 */
export interface UseRoleAccessReturn {
  /** Current user context */
  user: UserContext | null;
  
  /** Whether user has required permissions */
  hasAccess: boolean;
  
  /** Whether permission check is loading */
  loading: boolean;
  
  /** Permission check error */
  error: Error | null;
  
  /** Function to check specific permissions */
  checkPermission: (permission: Permission) => boolean;
  
  /** Function to check multiple permissions */
  checkPermissions: (permissions: Permission[], requireAll?: boolean) => boolean;
  
  /** Function to check role membership */
  hasRole: (roleName: string) => boolean;
  
  /** Function to check multiple roles */
  hasAnyRole: (roleNames: string[]) => boolean;
  
  /** Function to refresh user permissions */
  refreshPermissions: () => Promise<void>;
}

/**
 * Role management component props
 */
export interface RoleManagementProps {
  /** Current user context */
  user: UserContext;
  
  /** Available services */
  services: ServiceInfo[];
  
  /** Role selection handler */
  onRoleSelect?: (role: Role) => void;
  
  /** Role creation handler */
  onRoleCreate?: (role: Partial<Role>) => Promise<Role>;
  
  /** Role update handler */
  onRoleUpdate?: (id: number, role: Partial<Role>) => Promise<Role>;
  
  /** Role deletion handler */
  onRoleDelete?: (id: number) => Promise<void>;
  
  /** Permission update handler */
  onPermissionUpdate?: (roleId: number, permissions: RoleServiceAccess[]) => Promise<void>;
  
  /** Component styling options */
  className?: string;
  
  /** Whether to show advanced options */
  showAdvanced?: boolean;
}

/**
 * Service access configuration component props
 */
export interface ServiceAccessConfigProps {
  /** Role being configured */
  role: Role;
  
  /** Available services */
  services: ServiceInfo[];
  
  /** Current service access rules */
  accessRules: RoleServiceAccess[];
  
  /** Access rule update handler */
  onAccessRuleUpdate: (rules: RoleServiceAccess[]) => Promise<void>;
  
  /** Component styling */
  className?: string;
  
  /** Read-only mode */
  readOnly?: boolean;
}

/**
 * User role assignment component props
 */
export interface UserRoleAssignmentProps {
  /** User being configured */
  userId: number;
  
  /** Available roles */
  availableRoles: Role[];
  
  /** Current user roles */
  userRoles: UserRole[];
  
  /** Role assignment handler */
  onRoleAssign: (userId: number, roleId: number, appId?: number) => Promise<void>;
  
  /** Role removal handler */
  onRoleRemove: (userId: number, roleId: number, appId?: number) => Promise<void>;
  
  /** Component styling */
  className?: string;
  
  /** Show app context selection */
  showAppContext?: boolean;
}

// =============================================================================
// API Request and Response Types
// =============================================================================

/**
 * Role API request payloads
 */
export namespace RoleAPI {
  /**
   * Create role request
   */
  export interface CreateRoleRequest {
    name: string;
    label?: string;
    description?: string;
    is_active?: boolean;
    is_default?: boolean;
  }
  
  /**
   * Update role request
   */
  export interface UpdateRoleRequest {
    name?: string;
    label?: string;
    description?: string;
    is_active?: boolean;
    is_default?: boolean;
  }
  
  /**
   * Role service access update request
   */
  export interface UpdateServiceAccessRequest {
    role_service_access_by_role_id: Partial<RoleServiceAccess>[];
  }
  
  /**
   * Role lookup update request
   */
  export interface UpdateRoleLookupRequest {
    role_lookup_by_role_id: Partial<RoleLookup>[];
  }
  
  /**
   * User role assignment request
   */
  export interface AssignUserRoleRequest {
    user_id: number;
    role_id: number;
    app_id?: number;
  }
  
  /**
   * Bulk role assignment request
   */
  export interface BulkRoleAssignmentRequest {
    assignments: AssignUserRoleRequest[];
  }
  
  /**
   * Role list response
   */
  export interface RoleListResponse {
    resource: Role[];
    meta?: {
      count: number;
      limit?: number;
      offset?: number;
    };
  }
  
  /**
   * Permission check request
   */
  export interface PermissionCheckRequest {
    permissions: Permission[];
    user_id?: number;
  }
  
  /**
   * Permission check response
   */
  export interface PermissionCheckResponse {
    results: PermissionCheckResult[];
    user_context: UserContext;
  }
}

/**
 * Role configuration validation types
 */
export interface RoleValidation {
  /** Role name validation rules */
  name: {
    required: boolean;
    minLength: number;
    maxLength: number;
    pattern: RegExp;
    unique: boolean;
  };
  
  /** Role label validation rules */
  label: {
    maxLength: number;
  };
  
  /** Description validation rules */
  description: {
    maxLength: number;
  };
  
  /** Service access validation rules */
  serviceAccess: {
    requiredFields: string[];
    validVerbs: HttpVerb[];
    maxFiltersLength: number;
  };
}

/**
 * Default role validation configuration
 */
export const DEFAULT_ROLE_VALIDATION: RoleValidation = {
  name: {
    required: true,
    minLength: 3,
    maxLength: 64,
    pattern: /^[a-zA-Z][a-zA-Z0-9_-]*$/,
    unique: true
  },
  label: {
    maxLength: 128
  },
  description: {
    maxLength: 1024
  },
  serviceAccess: {
    requiredFields: ['service_id', 'verb_mask'],
    validVerbs: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
    maxFiltersLength: 4000
  }
};