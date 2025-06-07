/**
 * API Rate Limiting Types for React Component Integration
 * 
 * Comprehensive rate limiting type definitions maintaining full backend API compatibility
 * while supporting modern React component patterns for limit management. These types enable
 * seamless integration with DreamFactory Core rate limiting endpoints while providing
 * enhanced TypeScript support for React 19/Next.js 15.1 component architecture.
 * 
 * This module preserves all existing rate limiting data contracts and endpoint compatibility
 * while introducing React-specific patterns for form management, state handling, and
 * component integration with React Hook Form, SWR/React Query, and Zustand state management.
 * 
 * @fileoverview Rate limiting types for React/Next.js integration
 * @version 1.0.0
 * @since Next.js 15.1 / React 19 migration
 */

import { ReactNode } from 'react';
import type { RoleType, RoleRow } from './role';
import type { Service, ServiceRow, ServiceType } from './service';
import type { UserType, UserRow } from './user';

// =============================================================================
// PRESERVED BACKEND API COMPATIBILITY INTERFACES
// =============================================================================

/**
 * Core rate limit type interface matching DreamFactory backend structure.
 * Maintains exact compatibility with /api/v2/system/limit endpoints for
 * seamless integration with existing DreamFactory Core installations.
 * 
 * Used in:
 * - Rate limit CRUD operations through backend APIs
 * - Limit configuration workflows and management interfaces
 * - API response mapping for limit endpoint operations
 * - Rate limiting enforcement and validation logic
 * 
 * @interface LimitType
 * @example
 * ```typescript
 * const rateLimit: LimitType = {
 *   id: 1,
 *   name: "api_user_limit",
 *   description: "Standard API rate limit for regular users",
 *   type: "api",
 *   rate: 1000,
 *   period: 3600,
 *   userId: 42,
 *   roleId: 3,
 *   serviceId: 15,
 *   isActive: true,
 *   createdDate: "2024-01-15T10:30:00Z",
 *   lastModifiedDate: "2024-01-15T10:30:00Z",
 *   createdById: 1,
 *   lastModifiedById: 1
 * };
 * ```
 */
export interface LimitType {
  /** Unique rate limit identifier from backend database */
  id: number;
  
  /** Human-readable limit name for identification and management */
  name: string;
  
  /** Detailed description of the rate limit purpose and scope */
  description: string;
  
  /** Type of rate limit - determines enforcement scope and behavior */
  type: 'api' | 'user' | 'role' | 'service' | 'endpoint' | 'global';
  
  /** Maximum number of requests allowed within the specified period */
  rate: number;
  
  /** Time period in seconds for rate limit window (e.g., 3600 for 1 hour) */
  period: number;
  
  /** 
   * User ID for user-specific rate limits.
   * When specified, limit applies only to the associated user.
   * Mutually exclusive with roleId for targeted rate limiting.
   */
  userId?: number;
  
  /** 
   * Role ID for role-based rate limits.
   * When specified, limit applies to all users with the associated role.
   * Mutually exclusive with userId for role-wide rate limiting.
   */
  roleId?: number;
  
  /** 
   * Service ID for service-specific rate limits.
   * When specified, limit applies only to requests targeting the associated service.
   * Enables granular per-service rate limiting strategies.
   */
  serviceId?: number;
  
  /** Whether the rate limit is currently active and enforced */
  isActive: boolean;
  
  /** ISO 8601 timestamp when rate limit was created */
  createdDate: string;
  
  /** ISO 8601 timestamp when rate limit was last modified */
  lastModifiedDate: string;
  
  /** ID of administrator who created this rate limit */
  createdById: number;
  
  /** ID of administrator who last modified this rate limit */
  lastModifiedById: number;
  
  /** 
   * Optional endpoint pattern for fine-grained rate limiting.
   * Supports wildcards and regex patterns for flexible endpoint matching.
   * Examples: "/api/v2/database/*", "/api/v2/user/session"
   */
  endpointPattern?: string;
  
  /** 
   * HTTP methods affected by this rate limit.
   * When specified, limit applies only to matching HTTP verbs.
   * Supports granular rate limiting per operation type.
   */
  httpMethods?: ('GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE' | 'OPTIONS')[];
  
  /** 
   * Additional metadata for rate limit configuration.
   * Extensible object for custom rate limiting parameters and backend-specific settings.
   */
  metadata?: Record<string, unknown>;
}

/**
 * Simplified rate limit interface for table display and listing operations.
 * Optimized for React component rendering and table virtualization with TanStack Virtual.
 * 
 * Used in:
 * - Rate limit management tables and data grids
 * - Limit overview displays and summary components
 * - Quick selection and filtering interfaces
 * - Performance-optimized list rendering
 * 
 * @interface LimitRow
 * @example
 * ```typescript
 * const limitRow: LimitRow = {
 *   id: 1,
 *   name: "user_api_limit",
 *   type: "user",
 *   rate: 500,
 *   period: 3600,
 *   isActive: true,
 *   associatedEntity: "john.doe@example.com",
 *   lastEnforced: "2024-01-15T14:22:00Z"
 * };
 * ```
 */
export interface LimitRow {
  /** Unique rate limit identifier */
  id: number;
  
  /** Rate limit name for display purposes */
  name: string;
  
  /** Rate limit type for categorization and filtering */
  type: LimitType['type'];
  
  /** Request rate per period for quick reference */
  rate: number;
  
  /** Time period in seconds for rate limit window */
  period: number;
  
  /** Active status for UI state management */
  isActive: boolean;
  
  /** 
   * Display name of associated entity (user email, role name, service name).
   * Provides quick identification without requiring additional lookups.
   */
  associatedEntity?: string;
  
  /** 
   * Last enforcement timestamp for monitoring and debugging.
   * Helps administrators understand rate limit usage patterns.
   */
  lastEnforced?: string;
  
  /** 
   * Current usage count within the current period.
   * Enables real-time monitoring of rate limit consumption.
   */
  currentUsage?: number;
  
  /** 
   * Percentage of rate limit currently consumed.
   * Calculated value for progress indicators and alerts.
   */
  usagePercentage?: number;
}

/**
 * Rate limit creation payload for API requests.
 * Used with React Hook Form for limit creation workflows and form validation.
 * 
 * @interface CreateLimitPayload
 * @example
 * ```typescript
 * const newLimit: CreateLimitPayload = {
 *   name: "premium_user_limit",
 *   description: "Enhanced rate limit for premium subscribers",
 *   type: "role",
 *   rate: 5000,
 *   period: 3600,
 *   roleId: 5,
 *   isActive: true,
 *   httpMethods: ["GET", "POST"],
 *   endpointPattern: "/api/v2/database/*"
 * };
 * ```
 */
export interface CreateLimitPayload {
  /** Rate limit name (required, unique constraint) */
  name: string;
  
  /** Rate limit description (required for documentation) */
  description: string;
  
  /** Rate limit type (required, determines enforcement scope) */
  type: LimitType['type'];
  
  /** Request rate per period (required, positive integer) */
  rate: number;
  
  /** Time period in seconds (required, positive integer) */
  period: number;
  
  /** User ID for user-specific limits (optional, mutually exclusive with roleId) */
  userId?: number;
  
  /** Role ID for role-based limits (optional, mutually exclusive with userId) */
  roleId?: number;
  
  /** Service ID for service-specific limits (optional) */
  serviceId?: number;
  
  /** Initial active status (optional, defaults to true) */
  isActive?: boolean;
  
  /** Endpoint pattern for targeted rate limiting (optional) */
  endpointPattern?: string;
  
  /** HTTP methods for selective rate limiting (optional) */
  httpMethods?: LimitType['httpMethods'];
  
  /** Additional configuration metadata (optional) */
  metadata?: Record<string, unknown>;
}

/**
 * Rate limit update payload for API requests.
 * Used with React Hook Form for limit modification workflows and partial updates.
 * 
 * @interface UpdateLimitPayload
 * @example
 * ```typescript
 * const limitUpdate: UpdateLimitPayload = {
 *   rate: 2000,
 *   period: 7200,
 *   isActive: false,
 *   description: "Updated rate limit for maintenance window"
 * };
 * ```
 */
export interface UpdateLimitPayload {
  /** Updated rate limit name (optional) */
  name?: string;
  
  /** Updated rate limit description (optional) */
  description?: string;
  
  /** Updated request rate per period (optional) */
  rate?: number;
  
  /** Updated time period in seconds (optional) */
  period?: number;
  
  /** Updated user ID association (optional) */
  userId?: number;
  
  /** Updated role ID association (optional) */
  roleId?: number;
  
  /** Updated service ID association (optional) */
  serviceId?: number;
  
  /** Updated active status (optional) */
  isActive?: boolean;
  
  /** Updated endpoint pattern (optional) */
  endpointPattern?: string;
  
  /** Updated HTTP methods (optional) */
  httpMethods?: LimitType['httpMethods'];
  
  /** Updated configuration metadata (optional) */
  metadata?: Record<string, unknown>;
}

// =============================================================================
// REACT COMPONENT INTEGRATION TYPES
// =============================================================================

/**
 * Extended rate limit interface for React component state management.
 * Combines backend data with client-side state, UI concerns, and form handling.
 * 
 * @interface LimitComponentState
 */
export interface LimitComponentState extends LimitType {
  /** Loading state for limit operations (create, update, delete) */
  loading?: boolean;
  
  /** Error state for limit operations and validation failures */
  error?: string | null;
  
  /** Whether limit is currently being edited in form interfaces */
  isEditing?: boolean;
  
  /** Whether limit is selected in multi-select management interfaces */
  isSelected?: boolean;
  
  /** Form validation errors for React Hook Form integration */
  validationErrors?: LimitValidationErrors;
  
  /** Original values for change tracking and dirty state detection */
  originalValues?: Partial<LimitType>;
  
  /** Form dirty state for unsaved changes warning */
  isDirty?: boolean;
  
  /** 
   * Associated entity data for display purposes.
   * Populated from user, role, or service lookups to avoid additional API calls.
   */
  associatedUser?: UserRow;
  associatedRole?: RoleRow;
  associatedService?: ServiceRow;
  
  /** 
   * Real-time usage statistics for monitoring and alerts.
   * Updated through WebSocket connections or polling mechanisms.
   */
  usageStats?: LimitUsageStats;
  
  /** 
   * Enforcement history for debugging and audit purposes.
   * Limited to recent events to avoid excessive memory usage.
   */
  recentEnforcements?: LimitEnforcementEvent[];
}

/**
 * Validation error mapping for rate limit form fields.
 * Provides structured error handling for React Hook Form integration.
 * 
 * @interface LimitValidationErrors
 */
export interface LimitValidationErrors {
  /** Name field validation errors */
  name?: string[];
  
  /** Description field validation errors */
  description?: string[];
  
  /** Type field validation errors */
  type?: string[];
  
  /** Rate field validation errors */
  rate?: string[];
  
  /** Period field validation errors */
  period?: string[];
  
  /** User ID validation errors */
  userId?: string[];
  
  /** Role ID validation errors */
  roleId?: string[];
  
  /** Service ID validation errors */
  serviceId?: string[];
  
  /** Endpoint pattern validation errors */
  endpointPattern?: string[];
  
  /** HTTP methods validation errors */
  httpMethods?: string[];
  
  /** General validation errors not specific to individual fields */
  general?: string[];
  
  /** Cross-field validation errors (e.g., conflicting userId and roleId) */
  crossField?: string[];
}

/**
 * Rate limit usage statistics for monitoring and alerting.
 * Provides real-time insights into rate limit consumption patterns.
 * 
 * @interface LimitUsageStats
 */
export interface LimitUsageStats {
  /** Current request count within the active period */
  currentRequests: number;
  
  /** Maximum requests allowed within the period */
  maxRequests: number;
  
  /** Percentage of rate limit currently consumed */
  usagePercentage: number;
  
  /** Timestamp when the current period started */
  periodStart: string;
  
  /** Timestamp when the current period will reset */
  periodEnd: string;
  
  /** Remaining time in seconds until period reset */
  timeRemaining: number;
  
  /** Recent request rate (requests per minute) */
  recentRequestRate: number;
  
  /** Peak usage percentage reached in the current period */
  peakUsagePercentage: number;
  
  /** Number of times this limit has been exceeded in the last 24 hours */
  violationCount24h: number;
  
  /** Average usage percentage over the last 24 hours */
  averageUsage24h: number;
}

/**
 * Rate limit enforcement event for audit trails and debugging.
 * Captures individual rate limit violations and enforcement actions.
 * 
 * @interface LimitEnforcementEvent
 */
export interface LimitEnforcementEvent {
  /** Unique event identifier */
  id: string;
  
  /** Timestamp when enforcement occurred */
  timestamp: string;
  
  /** Type of enforcement action taken */
  action: 'blocked' | 'throttled' | 'warned' | 'allowed';
  
  /** Request details that triggered enforcement */
  request: {
    method: string;
    endpoint: string;
    userAgent?: string;
    ipAddress?: string;
    userId?: number;
    sessionId?: string;
  };
  
  /** Rate limit state at time of enforcement */
  limitState: {
    currentRequests: number;
    maxRequests: number;
    timeRemaining: number;
  };
  
  /** Additional context and metadata */
  metadata?: Record<string, unknown>;
}

// =============================================================================
// REACT COMPONENT PROPS INTERFACES
// =============================================================================

/**
 * Rate limit management component props interface.
 * Supports comprehensive limit management workflows with full CRUD capabilities.
 * 
 * @interface LimitManagementComponentProps
 */
export interface LimitManagementComponentProps {
  /** Current user context for permission checking and audit trails */
  currentUser?: {
    id: number;
    roles: RoleRow[];
    permissions: string[];
  };
  
  /** Available rate limits for management and display */
  limits?: LimitType[];
  
  /** Loading state for limit data fetching */
  loading?: boolean;
  
  /** Error state for limit operations */
  error?: string | null;
  
  /** Rate limit creation handler */
  onCreateLimit?: (limit: CreateLimitPayload) => Promise<void>;
  
  /** Rate limit update handler */
  onUpdateLimit?: (id: number, limit: UpdateLimitPayload) => Promise<void>;
  
  /** Rate limit deletion handler */
  onDeleteLimit?: (id: number) => Promise<void>;
  
  /** Rate limit selection handler for detailed views */
  onSelectLimit?: (limit: LimitType) => void;
  
  /** Bulk operations handler for multiple limits */
  onBulkAction?: (action: 'activate' | 'deactivate' | 'delete', limitIds: number[]) => Promise<void>;
  
  /** Available users for user-specific limits */
  availableUsers?: UserRow[];
  
  /** Available roles for role-based limits */
  availableRoles?: RoleRow[];
  
  /** Available services for service-specific limits */
  availableServices?: ServiceRow[];
  
  /** Component styling classes */
  className?: string;
  
  /** Child components for custom layouts */
  children?: ReactNode;
}

/**
 * Rate limit form component props interface.
 * Supports both creation and editing workflows with comprehensive validation.
 * 
 * @interface LimitFormProps
 */
export interface LimitFormProps {
  /** Rate limit being edited (undefined for create mode) */
  limit?: LimitType;
  
  /** Available users for user-specific limit assignment */
  availableUsers?: UserRow[];
  
  /** Available roles for role-based limit assignment */
  availableRoles?: RoleRow[];
  
  /** Available services for service-specific limit assignment */
  availableServices?: ServiceRow[];
  
  /** Available service types for filtering and validation */
  availableServiceTypes?: ServiceType[];
  
  /** Form submission handler */
  onSubmit: (limit: CreateLimitPayload | UpdateLimitPayload) => Promise<void>;
  
  /** Form cancellation handler */
  onCancel?: () => void;
  
  /** Loading state during form submission */
  loading?: boolean;
  
  /** Form validation errors */
  errors?: LimitValidationErrors;
  
  /** Read-only mode for viewing existing limits */
  readOnly?: boolean;
  
  /** Default values for form initialization */
  defaultValues?: Partial<CreateLimitPayload>;
  
  /** Form validation mode (onChange, onBlur, onSubmit) */
  validationMode?: 'onChange' | 'onBlur' | 'onSubmit';
  
  /** Component styling classes */
  className?: string;
}

/**
 * Rate limit selector component props interface.
 * Supports multi-select and single-select scenarios for limit assignment.
 * 
 * @interface LimitSelectorProps
 */
export interface LimitSelectorProps {
  /** Available rate limits for selection */
  limits: LimitRow[];
  
  /** Currently selected limit IDs */
  selectedIds?: number[];
  
  /** Multi-select mode enabling multiple limit selection */
  multiple?: boolean;
  
  /** Placeholder text for empty state */
  placeholder?: string;
  
  /** Disabled state for form control */
  disabled?: boolean;
  
  /** Loading state during data fetching */
  loading?: boolean;
  
  /** Error message for validation failures */
  error?: string;
  
  /** Selection change handler */
  onChange: (selectedIds: number[]) => void;
  
  /** Search functionality for large limit lists */
  searchable?: boolean;
  
  /** Filter by limit type */
  filterByType?: LimitType['type'][];
  
  /** Filter by active status */
  filterByActiveStatus?: boolean;
  
  /** Custom limit display renderer */
  renderLimit?: (limit: LimitRow) => ReactNode;
  
  /** Component styling classes */
  className?: string;
}

/**
 * Rate limit monitor component props interface.
 * Provides real-time monitoring and alerting capabilities.
 * 
 * @interface LimitMonitorProps
 */
export interface LimitMonitorProps {
  /** Rate limits to monitor */
  limits: LimitType[];
  
  /** Real-time usage data */
  usageData?: Record<number, LimitUsageStats>;
  
  /** Recent enforcement events */
  enforcementEvents?: LimitEnforcementEvent[];
  
  /** Alert thresholds for usage warnings */
  alertThresholds?: {
    warning: number; // Percentage (e.g., 80)
    critical: number; // Percentage (e.g., 95)
  };
  
  /** Refresh interval in milliseconds for real-time updates */
  refreshInterval?: number;
  
  /** Alert handler for threshold violations */
  onAlert?: (limit: LimitType, usage: LimitUsageStats, level: 'warning' | 'critical') => void;
  
  /** Export handler for monitoring data */
  onExport?: (format: 'csv' | 'json') => void;
  
  /** Time range for historical data display */
  timeRange?: {
    start: string;
    end: string;
  };
  
  /** Component styling classes */
  className?: string;
}

// =============================================================================
// RATE LIMIT QUERY AND MUTATION TYPES
// =============================================================================

/**
 * Rate limit query parameters for React Query/SWR integration.
 * Supports filtering, sorting, and pagination for optimal data fetching.
 * 
 * @interface LimitQueryParams
 */
export interface LimitQueryParams {
  /** Filter by active status */
  active?: boolean;
  
  /** Filter by limit type */
  type?: LimitType['type'][];
  
  /** Search by name or description */
  search?: string;
  
  /** Filter by associated user ID */
  userId?: number;
  
  /** Filter by associated role ID */
  roleId?: number;
  
  /** Filter by associated service ID */
  serviceId?: number;
  
  /** Filter by endpoint pattern */
  endpointPattern?: string;
  
  /** Filter by HTTP methods */
  httpMethods?: string[];
  
  /** Include usage statistics in response */
  includeUsageStats?: boolean;
  
  /** Include recent enforcement events */
  includeEnforcementHistory?: boolean;
  
  /** Include associated entity details (user, role, service) */
  includeAssociatedEntities?: boolean;
  
  /** Pagination limit */
  limit?: number;
  
  /** Pagination offset */
  offset?: number;
  
  /** Sort field */
  sortBy?: keyof LimitType | 'usagePercentage' | 'lastEnforced';
  
  /** Sort direction */
  sortDirection?: 'asc' | 'desc';
  
  /** Time range for usage statistics */
  timeRange?: {
    start: string;
    end: string;
  };
}

// =============================================================================
// RATE LIMIT HOOK INTEGRATION TYPES
// =============================================================================

/**
 * Rate limit management hook return interface.
 * Provides comprehensive CRUD operations and state management for React components.
 * 
 * @interface UseLimitManagementReturn
 */
export interface UseLimitManagementReturn {
  /** Available rate limits */
  limits: LimitType[];
  
  /** Loading state for data operations */
  loading: boolean;
  
  /** Error state for failed operations */
  error: string | null;
  
  /** Create rate limit function */
  createLimit: (payload: CreateLimitPayload) => Promise<LimitType>;
  
  /** Update rate limit function */
  updateLimit: (id: number, payload: UpdateLimitPayload) => Promise<LimitType>;
  
  /** Delete rate limit function */
  deleteLimit: (id: number) => Promise<void>;
  
  /** Bulk activate/deactivate limits */
  bulkUpdateStatus: (limitIds: number[], isActive: boolean) => Promise<void>;
  
  /** Bulk delete limits */
  bulkDelete: (limitIds: number[]) => Promise<void>;
  
  /** Refresh limits data */
  refreshLimits: () => Promise<void>;
  
  /** Get limit by ID */
  getLimitById: (id: number) => LimitType | undefined;
  
  /** Filter limits based on criteria */
  filterLimits: (params: LimitQueryParams) => LimitType[];
  
  /** Get usage statistics for limit */
  getLimitUsage: (id: number) => Promise<LimitUsageStats>;
  
  /** Get enforcement history for limit */
  getEnforcementHistory: (id: number, timeRange?: { start: string; end: string }) => Promise<LimitEnforcementEvent[]>;
}

/**
 * Rate limit selection hook return interface.
 * Manages multi-select state for limit management interfaces.
 * 
 * @interface UseLimitSelectionReturn
 */
export interface UseLimitSelectionReturn {
  /** Currently selected limit IDs */
  selectedIds: number[];
  
  /** Select limit function */
  selectLimit: (id: number) => void;
  
  /** Deselect limit function */
  deselectLimit: (id: number) => void;
  
  /** Toggle limit selection */
  toggleLimit: (id: number) => void;
  
  /** Select all limits */
  selectAll: (limitIds: number[]) => void;
  
  /** Clear all selections */
  clearSelection: () => void;
  
  /** Check if limit is selected */
  isSelected: (id: number) => boolean;
  
  /** Get selected limits */
  getSelectedLimits: (allLimits: LimitType[]) => LimitType[];
  
  /** Selection count */
  selectionCount: number;
}

// =============================================================================
// RATE LIMIT EVENT TYPES
// =============================================================================

/**
 * Rate limit management event types for component communication.
 * Enables event-driven architecture for limit management workflows.
 */
export type LimitManagementEvent =
  | 'limit:created'
  | 'limit:updated'
  | 'limit:deleted'
  | 'limit:activated'
  | 'limit:deactivated'
  | 'limit:exceeded'
  | 'limit:warning'
  | 'limits:loaded'
  | 'limits:error';

/**
 * Rate limit event payload interface.
 * Provides structured event data for component communication and audit trails.
 * 
 * @interface LimitEventPayload
 */
export interface LimitEventPayload {
  /** Event type identifier */
  type: LimitManagementEvent;
  
  /** Rate limit data (if applicable) */
  limit?: LimitType;
  
  /** Rate limit ID (if applicable) */
  limitId?: number;
  
  /** Error information (if applicable) */
  error?: string;
  
  /** Usage statistics (for monitoring events) */
  usageStats?: LimitUsageStats;
  
  /** Enforcement event (for violation events) */
  enforcementEvent?: LimitEnforcementEvent;
  
  /** Additional event data */
  data?: Record<string, unknown>;
  
  /** Event timestamp */
  timestamp: string;
  
  /** User who triggered the event */
  triggeredBy?: number;
}

/**
 * Rate limit event handler function type.
 * Enables consistent event handling across components.
 */
export type LimitEventHandler = (payload: LimitEventPayload) => void;

// =============================================================================
// RATE LIMIT UTILITY TYPES
// =============================================================================

/**
 * Rate limit comparison result for change detection.
 * Enables sophisticated diff tracking for form management.
 * 
 * @interface LimitComparisonResult
 */
export interface LimitComparisonResult {
  /** Whether limits are functionally equivalent */
  isEqual: boolean;
  
  /** Fields that have changed between versions */
  changedFields: (keyof LimitType)[];
  
  /** Detailed field-by-field differences */
  differences: Record<keyof LimitType, {
    oldValue: any;
    newValue: any;
  }>;
  
  /** Whether changes affect rate limiting behavior */
  behaviorChanged: boolean;
  
  /** Whether changes require immediate enforcement update */
  requiresImmediateUpdate: boolean;
}

/**
 * Rate limit validation result interface.
 * Provides comprehensive validation feedback for form components.
 * 
 * @interface LimitValidationResult
 */
export interface LimitValidationResult {
  /** Whether limit configuration is valid */
  isValid: boolean;
  
  /** Validation errors by field */
  errors: LimitValidationErrors;
  
  /** Validation warnings (non-blocking issues) */
  warnings?: Record<string, string[]>;
  
  /** Suggested improvements for limit configuration */
  suggestions?: string[];
  
  /** Estimated impact of the rate limit configuration */
  impact?: {
    affectedUsers: number;
    affectedServices: number;
    estimatedBlockedRequests: number;
  };
}

/**
 * Rate limit export/import format for backup and migration.
 * Supports comprehensive limit configuration portability.
 * 
 * @interface LimitExportData
 */
export interface LimitExportData {
  /** Export metadata */
  metadata: {
    version: string;
    exportDate: string;
    exportedBy: number;
    totalLimits: number;
    exportedFrom: string; // Environment or instance identifier
  };
  
  /** Rate limit data */
  limits: LimitType[];
  
  /** Associated entity data for context */
  associatedEntities?: {
    users: UserRow[];
    roles: RoleRow[];
    services: ServiceRow[];
  };
  
  /** Usage statistics at time of export */
  usageSnapshots?: Record<number, LimitUsageStats>;
  
  /** Export options used */
  options: {
    includeInactiveLimits: boolean;
    includeUsageStats: boolean;
    includeAssociatedEntities: boolean;
    includeEnforcementHistory: boolean;
    timeRange?: {
      start: string;
      end: string;
    };
  };
}

// =============================================================================
// TYPE GUARDS AND VALIDATORS
// =============================================================================

/**
 * Type guard to check if an object is a valid LimitType.
 * Provides runtime type safety for API responses and data validation.
 * 
 * @param obj - Object to validate
 * @returns true if object matches LimitType interface
 */
export function isLimitType(obj: any): obj is LimitType {
  return (
    typeof obj === 'object' &&
    obj !== null &&
    typeof obj.id === 'number' &&
    typeof obj.name === 'string' &&
    typeof obj.description === 'string' &&
    typeof obj.type === 'string' &&
    ['api', 'user', 'role', 'service', 'endpoint', 'global'].includes(obj.type) &&
    typeof obj.rate === 'number' &&
    obj.rate > 0 &&
    typeof obj.period === 'number' &&
    obj.period > 0 &&
    typeof obj.isActive === 'boolean' &&
    typeof obj.createdDate === 'string' &&
    typeof obj.lastModifiedDate === 'string' &&
    typeof obj.createdById === 'number' &&
    typeof obj.lastModifiedById === 'number' &&
    (obj.userId === undefined || typeof obj.userId === 'number') &&
    (obj.roleId === undefined || typeof obj.roleId === 'number') &&
    (obj.serviceId === undefined || typeof obj.serviceId === 'number') &&
    (obj.endpointPattern === undefined || typeof obj.endpointPattern === 'string') &&
    (obj.httpMethods === undefined || (
      Array.isArray(obj.httpMethods) &&
      obj.httpMethods.every((method: any) => 
        typeof method === 'string' &&
        ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'].includes(method)
      )
    )) &&
    (obj.metadata === undefined || (
      typeof obj.metadata === 'object' &&
      obj.metadata !== null
    ))
  );
}

/**
 * Type guard to check if an object is a valid LimitRow.
 * Provides runtime validation for table and listing components.
 * 
 * @param obj - Object to validate
 * @returns true if object matches LimitRow interface
 */
export function isLimitRow(obj: any): obj is LimitRow {
  return (
    typeof obj === 'object' &&
    obj !== null &&
    typeof obj.id === 'number' &&
    typeof obj.name === 'string' &&
    typeof obj.type === 'string' &&
    ['api', 'user', 'role', 'service', 'endpoint', 'global'].includes(obj.type) &&
    typeof obj.rate === 'number' &&
    obj.rate > 0 &&
    typeof obj.period === 'number' &&
    obj.period > 0 &&
    typeof obj.isActive === 'boolean' &&
    (obj.associatedEntity === undefined || typeof obj.associatedEntity === 'string') &&
    (obj.lastEnforced === undefined || typeof obj.lastEnforced === 'string') &&
    (obj.currentUsage === undefined || typeof obj.currentUsage === 'number') &&
    (obj.usagePercentage === undefined || (
      typeof obj.usagePercentage === 'number' &&
      obj.usagePercentage >= 0 &&
      obj.usagePercentage <= 100
    ))
  );
}

/**
 * Validates rate limit data according to business rules and constraints.
 * Provides comprehensive validation for form components and API payloads.
 * 
 * @param limit - Rate limit data to validate
 * @returns Detailed validation result with errors and suggestions
 */
export function validateLimitData(limit: Partial<LimitType | CreateLimitPayload>): LimitValidationResult {
  const errors: LimitValidationErrors = {};
  const warnings: Record<string, string[]> = {};
  const suggestions: string[] = [];
  
  // Name validation
  if (!limit.name) {
    errors.name = ['Rate limit name is required'];
  } else if (limit.name.length < 3) {
    errors.name = ['Rate limit name must be at least 3 characters'];
  } else if (limit.name.length > 64) {
    errors.name = ['Rate limit name must not exceed 64 characters'];
  } else if (!/^[a-zA-Z][a-zA-Z0-9_-]*$/.test(limit.name)) {
    errors.name = ['Rate limit name must start with a letter and contain only letters, numbers, underscores, and hyphens'];
  }
  
  // Description validation
  if (!limit.description) {
    errors.description = ['Rate limit description is required'];
  } else if (limit.description.length > 1000) {
    errors.description = ['Rate limit description must not exceed 1000 characters'];
  }
  
  // Type validation
  if (!limit.type) {
    errors.type = ['Rate limit type is required'];
  } else if (!['api', 'user', 'role', 'service', 'endpoint', 'global'].includes(limit.type)) {
    errors.type = ['Invalid rate limit type'];
  }
  
  // Rate validation
  if (limit.rate === undefined || limit.rate === null) {
    errors.rate = ['Rate value is required'];
  } else if (!Number.isInteger(limit.rate) || limit.rate <= 0) {
    errors.rate = ['Rate must be a positive integer'];
  } else if (limit.rate > 1000000) {
    warnings.rate = ['Very high rate limit may impact system performance'];
    suggestions.push('Consider whether such a high rate limit is necessary');
  }
  
  // Period validation
  if (limit.period === undefined || limit.period === null) {
    errors.period = ['Period value is required'];
  } else if (!Number.isInteger(limit.period) || limit.period <= 0) {
    errors.period = ['Period must be a positive integer (seconds)'];
  } else if (limit.period < 60) {
    warnings.period = ['Very short periods may cause performance issues'];
    suggestions.push('Consider using periods of at least 60 seconds');
  } else if (limit.period > 86400) {
    warnings.period = ['Very long periods may not provide effective rate limiting'];
  }
  
  // Association validation
  const hasUserAssociation = limit.userId !== undefined && limit.userId !== null;
  const hasRoleAssociation = limit.roleId !== undefined && limit.roleId !== null;
  const hasServiceAssociation = limit.serviceId !== undefined && limit.serviceId !== null;
  
  if (hasUserAssociation && hasRoleAssociation) {
    errors.crossField = ['Cannot specify both user and role for the same rate limit'];
  }
  
  if (limit.type === 'user' && !hasUserAssociation) {
    errors.userId = ['User ID is required for user-type rate limits'];
  }
  
  if (limit.type === 'role' && !hasRoleAssociation) {
    errors.roleId = ['Role ID is required for role-type rate limits'];
  }
  
  if (limit.type === 'service' && !hasServiceAssociation) {
    errors.serviceId = ['Service ID is required for service-type rate limits'];
  }
  
  // Endpoint pattern validation
  if (limit.endpointPattern) {
    try {
      // Basic pattern validation - check for common issues
      if (limit.endpointPattern.includes('//')) {
        warnings.endpointPattern = ['Double slashes in endpoint pattern may cause matching issues'];
      }
      if (!limit.endpointPattern.startsWith('/')) {
        warnings.endpointPattern = ['Endpoint patterns should typically start with /'];
      }
    } catch (e) {
      errors.endpointPattern = ['Invalid endpoint pattern format'];
    }
  }
  
  // HTTP methods validation
  if (limit.httpMethods && limit.httpMethods.length === 0) {
    warnings.httpMethods = ['No HTTP methods specified - rate limit will apply to all methods'];
  }
  
  // Performance and usability suggestions
  if (limit.rate && limit.period) {
    const requestsPerSecond = limit.rate / limit.period;
    if (requestsPerSecond > 100) {
      suggestions.push('High request rate may require additional monitoring');
    }
    if (requestsPerSecond < 0.01) {
      suggestions.push('Very low request rate may be too restrictive');
    }
  }
  
  return {
    isValid: Object.keys(errors).length === 0,
    errors,
    warnings: Object.keys(warnings).length > 0 ? warnings : undefined,
    suggestions: suggestions.length > 0 ? suggestions : undefined
  };
}

/**
 * Default values for creating new rate limits.
 * Provides sensible defaults for form initialization and quick setup.
 */
export const DEFAULT_LIMIT_VALUES: Partial<CreateLimitPayload> = {
  isActive: true,
  rate: 1000,
  period: 3600, // 1 hour
  type: 'api'
};

/**
 * Rate limit field labels for form components.
 * Provides consistent labeling across the application interface.
 */
export const LIMIT_FIELD_LABELS: Record<keyof LimitType, string> = {
  id: 'ID',
  name: 'Rate Limit Name',
  description: 'Description',
  type: 'Limit Type',
  rate: 'Requests per Period',
  period: 'Period (seconds)',
  userId: 'Target User',
  roleId: 'Target Role',
  serviceId: 'Target Service',
  isActive: 'Active',
  createdDate: 'Created Date',
  lastModifiedDate: 'Last Modified Date',
  createdById: 'Created By',
  lastModifiedById: 'Last Modified By',
  endpointPattern: 'Endpoint Pattern',
  httpMethods: 'HTTP Methods',
  metadata: 'Additional Configuration'
};

/**
 * Common rate limit configurations for quick setup.
 * Provides predefined templates for typical use cases.
 */
export const COMMON_LIMIT_TEMPLATES: Record<string, Partial<CreateLimitPayload>> = {
  standard_user: {
    name: 'standard_user_limit',
    description: 'Standard rate limit for regular users',
    type: 'role',
    rate: 1000,
    period: 3600,
    isActive: true
  },
  premium_user: {
    name: 'premium_user_limit',
    description: 'Enhanced rate limit for premium users',
    type: 'role',
    rate: 5000,
    period: 3600,
    isActive: true
  },
  api_service: {
    name: 'api_service_limit',
    description: 'Service-specific API rate limit',
    type: 'service',
    rate: 10000,
    period: 3600,
    isActive: true
  },
  database_operations: {
    name: 'database_ops_limit',
    description: 'Rate limit for database operations',
    type: 'endpoint',
    rate: 500,
    period: 300, // 5 minutes
    endpointPattern: '/api/v2/database/*',
    httpMethods: ['POST', 'PUT', 'PATCH', 'DELETE'],
    isActive: true
  },
  global_emergency: {
    name: 'emergency_global_limit',
    description: 'Emergency global rate limit for system protection',
    type: 'global',
    rate: 100,
    period: 60,
    isActive: false // Typically activated during emergencies
  }
};