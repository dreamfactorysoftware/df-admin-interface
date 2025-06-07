/**
 * Role Data Types for React Component Integration
 * 
 * Core role data interfaces maintaining full API compatibility while supporting
 * React component patterns for role-based access control and management.
 * 
 * These types provide the foundational data structures for role entities,
 * ensuring seamless integration with existing DreamFactory backend APIs
 * while enabling modern React component patterns and Next.js middleware flows.
 * 
 * @fileoverview Role data interfaces for React/Next.js integration
 * @version 1.0.0
 */

import { ReactNode } from 'react';

// =============================================================================
// PRESERVED BACKEND API COMPATIBILITY INTERFACES
// =============================================================================

/**
 * Role row data interface for table display and listing operations.
 * Maintains exact compatibility with existing backend API structure.
 * 
 * Used in:
 * - Role management tables and grids
 * - Role selection dropdowns and lists
 * - Role summary displays
 * - API response mapping for GET /api/v2/system/role endpoints
 * 
 * @interface RoleRow
 * @example
 * ```typescript
 * const roleRow: RoleRow = {
 *   id: 1,
 *   name: "admin",
 *   description: "Administrator role with full system access",
 *   active: true
 * };
 * ```
 */
export interface RoleRow {
  /** Unique role identifier from backend database */
  id: number;
  
  /** Role name (unique system identifier) */
  name: string;
  
  /** Human-readable role description */
  description: string;
  
  /** Whether the role is currently active and assignable */
  active: boolean;
}

/**
 * Comprehensive role type definition for detailed role management operations.
 * Maintains exact compatibility with existing backend API structure while
 * supporting React component state management and form handling.
 * 
 * Used in:
 * - Role creation and editing forms
 * - Detailed role management interfaces
 * - Role relationship mapping
 * - API request/response payloads for role CRUD operations
 * 
 * @interface RoleType
 * @example
 * ```typescript
 * const roleType: RoleType = {
 *   id: 1,
 *   name: "database_admin",
 *   description: "Database administrator with schema management rights",
 *   isActive: true,
 *   createdById: 1,
 *   createdDate: "2024-01-15T10:30:00Z",
 *   lastModifiedById: 1,
 *   lastModifiedDate: "2024-01-15T10:30:00Z",
 *   lookupByRoleId: [1, 2, 3],
 *   accessibleTabs: ["schema", "users", "services"]
 * };
 * ```
 */
export interface RoleType {
  /** Human-readable role description */
  description: string;
  
  /** Unique role identifier */
  id: number;
  
  /** Whether role is active and can be assigned to users */
  isActive: boolean;
  
  /** ID of user who created this role */
  createdById: number;
  
  /** ISO 8601 timestamp when role was created */
  createdDate: string;
  
  /** ID of user who last modified this role */
  lastModifiedById: number;
  
  /** ISO 8601 timestamp when role was last modified */
  lastModifiedDate: string;
  
  /** Array of lookup IDs associated with this role */
  lookupByRoleId: number[];
  
  /** Role name (unique system identifier) */
  name: string;
  
  /** Optional array of tab/section identifiers that this role can access */
  accessibleTabs?: Array<string>;
}

// =============================================================================
// REACT COMPONENT INTEGRATION TYPES
// =============================================================================

/**
 * Extended role data interface for React component state management.
 * Combines backend data with client-side state and UI concerns.
 */
export interface RoleComponentState extends RoleType {
  /** Loading state for role operations */
  loading?: boolean;
  
  /** Error state for role operations */
  error?: string | null;
  
  /** Whether role is currently being edited */
  isEditing?: boolean;
  
  /** Whether role is selected in multi-select interfaces */
  isSelected?: boolean;
  
  /** Validation errors for form fields */
  validationErrors?: RoleValidationErrors;
  
  /** Original values for change tracking */
  originalValues?: Partial<RoleType>;
  
  /** Dirty state for form change detection */
  isDirty?: boolean;
}

/**
 * Validation error mapping for role form fields.
 */
export interface RoleValidationErrors {
  /** Name field validation errors */
  name?: string[];
  
  /** Description field validation errors */
  description?: string[];
  
  /** General validation errors */
  general?: string[];
  
  /** Tab access validation errors */
  accessibleTabs?: string[];
}

/**
 * Role selection state for dropdowns and multi-select components.
 */
export interface RoleSelectionState {
  /** Currently selected role IDs */
  selectedIds: number[];
  
  /** Available roles for selection */
  availableRoles: RoleRow[];
  
  /** Filtered roles based on search criteria */
  filteredRoles: RoleRow[];
  
  /** Search query for role filtering */
  searchQuery: string;
  
  /** Loading state for role data fetching */
  loading: boolean;
  
  /** Error state for role data fetching */
  error: string | null;
}

/**
 * Role management component props interface.
 */
export interface RoleManagementComponentProps {
  /** Current user context for permission checking */
  currentUser?: {
    id: number;
    roles: RoleRow[];
    permissions: string[];
  };
  
  /** Available roles for management */
  roles?: RoleType[];
  
  /** Loading state */
  loading?: boolean;
  
  /** Error state */
  error?: string | null;
  
  /** Role creation handler */
  onCreateRole?: (role: Partial<RoleType>) => Promise<void>;
  
  /** Role update handler */
  onUpdateRole?: (id: number, role: Partial<RoleType>) => Promise<void>;
  
  /** Role deletion handler */
  onDeleteRole?: (id: number) => Promise<void>;
  
  /** Role selection handler */
  onSelectRole?: (role: RoleType) => void;
  
  /** Component styling classes */
  className?: string;
  
  /** Child components */
  children?: ReactNode;
}

/**
 * Role selector component props interface.
 */
export interface RoleSelectorProps {
  /** Available roles for selection */
  roles: RoleRow[];
  
  /** Currently selected role IDs */
  selectedIds?: number[];
  
  /** Multi-select mode */
  multiple?: boolean;
  
  /** Placeholder text */
  placeholder?: string;
  
  /** Disabled state */
  disabled?: boolean;
  
  /** Loading state */
  loading?: boolean;
  
  /** Error message */
  error?: string;
  
  /** Selection change handler */
  onChange: (selectedIds: number[]) => void;
  
  /** Search functionality enabled */
  searchable?: boolean;
  
  /** Custom role display renderer */
  renderRole?: (role: RoleRow) => ReactNode;
  
  /** Component styling */
  className?: string;
}

/**
 * Role form component props interface.
 */
export interface RoleFormProps {
  /** Role being edited (undefined for create mode) */
  role?: RoleType;
  
  /** Available tabs/sections for access configuration */
  availableTabs?: string[];
  
  /** Form submission handler */
  onSubmit: (role: Partial<RoleType>) => Promise<void>;
  
  /** Form cancellation handler */
  onCancel?: () => void;
  
  /** Loading state during submission */
  loading?: boolean;
  
  /** Form validation errors */
  errors?: RoleValidationErrors;
  
  /** Read-only mode */
  readOnly?: boolean;
  
  /** Component styling */
  className?: string;
}

/**
 * Role access control component props interface.
 */
export interface RoleAccessControlProps {
  /** Role to configure access for */
  role: RoleType;
  
  /** Available services for access configuration */
  availableServices?: ServiceAccessInfo[];
  
  /** Current access configuration */
  accessConfiguration?: RoleAccessConfiguration;
  
  /** Access configuration update handler */
  onUpdateAccess?: (config: RoleAccessConfiguration) => Promise<void>;
  
  /** Loading state */
  loading?: boolean;
  
  /** Error state */
  error?: string | null;
  
  /** Read-only mode */
  readOnly?: boolean;
  
  /** Component styling */
  className?: string;
}

// =============================================================================
// ROLE ACCESS CONFIGURATION TYPES
// =============================================================================

/**
 * Service access information for role configuration.
 */
export interface ServiceAccessInfo {
  /** Service identifier */
  id: number;
  
  /** Service name */
  name: string;
  
  /** Service display label */
  label: string;
  
  /** Service type */
  type: string;
  
  /** Available operations */
  operations: string[];
  
  /** Service description */
  description?: string;
  
  /** Whether service requires special permissions */
  requiresSpecialPermissions?: boolean;
}

/**
 * Role access configuration structure.
 */
export interface RoleAccessConfiguration {
  /** Role identifier */
  roleId: number;
  
  /** Service access mappings */
  serviceAccess: Record<number, ServiceAccessPermissions>;
  
  /** Tab/section access permissions */
  tabAccess: string[];
  
  /** Global permissions */
  globalPermissions: string[];
  
  /** Configuration last modified timestamp */
  lastModified: string;
  
  /** User who last modified the configuration */
  modifiedBy: number;
}

/**
 * Service-specific access permissions for a role.
 */
export interface ServiceAccessPermissions {
  /** Service identifier */
  serviceId: number;
  
  /** Allowed operations */
  allowedOperations: string[];
  
  /** Access restrictions */
  restrictions?: AccessRestriction[];
  
  /** Custom filters */
  filters?: Record<string, any>;
  
  /** Whether access is read-only */
  readOnly?: boolean;
}

/**
 * Access restriction definition.
 */
export interface AccessRestriction {
  /** Restriction type */
  type: 'field' | 'record' | 'operation';
  
  /** Target field/record/operation */
  target: string;
  
  /** Restriction rule */
  rule: 'allow' | 'deny';
  
  /** Restriction condition */
  condition?: string;
  
  /** Restriction description */
  description?: string;
}

// =============================================================================
// ROLE QUERY AND MUTATION TYPES
// =============================================================================

/**
 * Role query parameters for React Query/SWR integration.
 */
export interface RoleQueryParams {
  /** Filter by active status */
  active?: boolean;
  
  /** Search by name or description */
  search?: string;
  
  /** Filter by accessible tabs */
  tabs?: string[];
  
  /** Pagination limit */
  limit?: number;
  
  /** Pagination offset */
  offset?: number;
  
  /** Sort field */
  sortBy?: keyof RoleType;
  
  /** Sort direction */
  sortDirection?: 'asc' | 'desc';
  
  /** Include related data */
  include?: ('lookups' | 'access' | 'users')[];
}

/**
 * Role creation payload for API requests.
 */
export interface CreateRolePayload {
  /** Role name (required) */
  name: string;
  
  /** Role description (required) */
  description: string;
  
  /** Whether role is active (default: true) */
  isActive?: boolean;
  
  /** Accessible tabs/sections */
  accessibleTabs?: string[];
  
  /** Initial lookup associations */
  lookupIds?: number[];
}

/**
 * Role update payload for API requests.
 */
export interface UpdateRolePayload {
  /** Updated role name */
  name?: string;
  
  /** Updated role description */
  description?: string;
  
  /** Updated active status */
  isActive?: boolean;
  
  /** Updated accessible tabs/sections */
  accessibleTabs?: string[];
  
  /** Updated lookup associations */
  lookupIds?: number[];
}

/**
 * Role deletion options.
 */
export interface DeleteRoleOptions {
  /** Whether to force deletion even if role is assigned to users */
  force?: boolean;
  
  /** Replacement role ID for user reassignment */
  replacementRoleId?: number;
  
  /** Whether to send notification to affected users */
  notifyUsers?: boolean;
}

// =============================================================================
// ROLE HOOK INTEGRATION TYPES
// =============================================================================

/**
 * Role management hook return interface.
 */
export interface UseRoleManagementReturn {
  /** Available roles */
  roles: RoleType[];
  
  /** Loading state */
  loading: boolean;
  
  /** Error state */
  error: string | null;
  
  /** Create role function */
  createRole: (payload: CreateRolePayload) => Promise<RoleType>;
  
  /** Update role function */
  updateRole: (id: number, payload: UpdateRolePayload) => Promise<RoleType>;
  
  /** Delete role function */
  deleteRole: (id: number, options?: DeleteRoleOptions) => Promise<void>;
  
  /** Refresh roles function */
  refreshRoles: () => Promise<void>;
  
  /** Get role by ID function */
  getRoleById: (id: number) => RoleType | undefined;
  
  /** Filter roles function */
  filterRoles: (params: RoleQueryParams) => RoleType[];
}

/**
 * Role selection hook return interface.
 */
export interface UseRoleSelectionReturn {
  /** Selection state */
  selectionState: RoleSelectionState;
  
  /** Select role function */
  selectRole: (id: number) => void;
  
  /** Deselect role function */
  deselectRole: (id: number) => void;
  
  /** Toggle role selection */
  toggleRole: (id: number) => void;
  
  /** Select all roles */
  selectAll: () => void;
  
  /** Clear selection */
  clearSelection: () => void;
  
  /** Set search query */
  setSearchQuery: (query: string) => void;
  
  /** Get selected roles */
  getSelectedRoles: () => RoleRow[];
}

// =============================================================================
// ROLE EVENT TYPES
// =============================================================================

/**
 * Role management event types for component communication.
 */
export type RoleManagementEvent =
  | 'role:created'
  | 'role:updated'
  | 'role:deleted'
  | 'role:selected'
  | 'role:deselected'
  | 'roles:loaded'
  | 'roles:error';

/**
 * Role event payload interface.
 */
export interface RoleEventPayload {
  /** Event type */
  type: RoleManagementEvent;
  
  /** Role data (if applicable) */
  role?: RoleType;
  
  /** Role ID (if applicable) */
  roleId?: number;
  
  /** Error information (if applicable) */
  error?: string;
  
  /** Additional event data */
  data?: Record<string, any>;
  
  /** Event timestamp */
  timestamp: string;
}

/**
 * Role event handler function type.
 */
export type RoleEventHandler = (payload: RoleEventPayload) => void;

// =============================================================================
// ROLE UTILITY TYPES
// =============================================================================

/**
 * Role comparison result for change detection.
 */
export interface RoleComparisonResult {
  /** Whether roles are equal */
  isEqual: boolean;
  
  /** Changed fields */
  changedFields: (keyof RoleType)[];
  
  /** Field-specific differences */
  differences: Record<keyof RoleType, {
    oldValue: any;
    newValue: any;
  }>;
}

/**
 * Role validation result interface.
 */
export interface RoleValidationResult {
  /** Whether role data is valid */
  isValid: boolean;
  
  /** Validation errors by field */
  errors: RoleValidationErrors;
  
  /** Validation warnings */
  warnings?: Record<string, string[]>;
  
  /** Suggested fixes */
  suggestions?: string[];
}

/**
 * Role export/import format.
 */
export interface RoleExportData {
  /** Export metadata */
  metadata: {
    version: string;
    exportDate: string;
    exportedBy: number;
    totalRoles: number;
  };
  
  /** Role data */
  roles: RoleType[];
  
  /** Access configurations */
  accessConfigurations?: RoleAccessConfiguration[];
  
  /** Export options used */
  options: {
    includeInactiveRoles: boolean;
    includeAccessConfig: boolean;
    includeMetadata: boolean;
  };
}

// =============================================================================
// TYPE GUARDS AND VALIDATORS
// =============================================================================

/**
 * Type guard to check if an object is a valid RoleRow.
 */
export function isRoleRow(obj: any): obj is RoleRow {
  return (
    typeof obj === 'object' &&
    obj !== null &&
    typeof obj.id === 'number' &&
    typeof obj.name === 'string' &&
    typeof obj.description === 'string' &&
    typeof obj.active === 'boolean'
  );
}

/**
 * Type guard to check if an object is a valid RoleType.
 */
export function isRoleType(obj: any): obj is RoleType {
  return (
    typeof obj === 'object' &&
    obj !== null &&
    typeof obj.id === 'number' &&
    typeof obj.name === 'string' &&
    typeof obj.description === 'string' &&
    typeof obj.isActive === 'boolean' &&
    typeof obj.createdById === 'number' &&
    typeof obj.createdDate === 'string' &&
    typeof obj.lastModifiedById === 'number' &&
    typeof obj.lastModifiedDate === 'string' &&
    Array.isArray(obj.lookupByRoleId) &&
    obj.lookupByRoleId.every((id: any) => typeof id === 'number') &&
    (obj.accessibleTabs === undefined || (
      Array.isArray(obj.accessibleTabs) &&
      obj.accessibleTabs.every((tab: any) => typeof tab === 'string')
    ))
  );
}

/**
 * Validates role data according to business rules.
 */
export function validateRoleData(role: Partial<RoleType>): RoleValidationResult {
  const errors: RoleValidationErrors = {};
  const warnings: Record<string, string[]> = {};
  
  // Name validation
  if (!role.name) {
    errors.name = ['Role name is required'];
  } else if (role.name.length < 3) {
    errors.name = ['Role name must be at least 3 characters'];
  } else if (role.name.length > 64) {
    errors.name = ['Role name must not exceed 64 characters'];
  } else if (!/^[a-zA-Z][a-zA-Z0-9_-]*$/.test(role.name)) {
    errors.name = ['Role name must start with a letter and contain only letters, numbers, underscores, and hyphens'];
  }
  
  // Description validation
  if (!role.description) {
    errors.description = ['Role description is required'];
  } else if (role.description.length > 1000) {
    errors.description = ['Role description must not exceed 1000 characters'];
  }
  
  // Tab access validation
  if (role.accessibleTabs && role.accessibleTabs.length === 0) {
    warnings.accessibleTabs = ['Role has no accessible tabs - users may not be able to use the system'];
  }
  
  return {
    isValid: Object.keys(errors).length === 0,
    errors,
    warnings: Object.keys(warnings).length > 0 ? warnings : undefined,
    suggestions: Object.keys(warnings).length > 0 ? [
      'Consider assigning at least one accessible tab to this role'
    ] : undefined
  };
}

/**
 * Default values for creating new roles.
 */
export const DEFAULT_ROLE_VALUES: Partial<RoleType> = {
  isActive: true,
  lookupByRoleId: [],
  accessibleTabs: []
};

/**
 * Role field labels for form components.
 */
export const ROLE_FIELD_LABELS: Record<keyof RoleType, string> = {
  id: 'ID',
  name: 'Role Name',
  description: 'Description',
  isActive: 'Active',
  createdById: 'Created By',
  createdDate: 'Created Date',
  lastModifiedById: 'Last Modified By',
  lastModifiedDate: 'Last Modified Date',
  lookupByRoleId: 'Associated Lookups',
  accessibleTabs: 'Accessible Tabs'
};