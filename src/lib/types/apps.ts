/**
 * Application Data Types for React Component Integration
 * 
 * Application data interfaces maintaining full API compatibility while supporting
 * React component patterns for application management and deployment workflows.
 * 
 * These types provide the foundational data structures for application entities,
 * ensuring seamless integration with existing DreamFactory backend APIs
 * while enabling modern React component patterns and Next.js deployment flows.
 * 
 * @fileoverview Application data interfaces for React/Next.js integration
 * @version 1.0.0
 */

import { ReactNode } from 'react';
import { RoleRow, RoleType } from './role';

// =============================================================================
// PRESERVED BACKEND API COMPATIBILITY INTERFACES
// =============================================================================

/**
 * Application row data interface for table display and listing operations.
 * Maintains exact compatibility with existing backend API structure.
 * 
 * Used in:
 * - Application management tables and grids
 * - Application selection dropdowns and lists
 * - Application summary displays
 * - API response mapping for GET /api/v2/system/app endpoints
 * 
 * @interface AppRow
 * @example
 * ```typescript
 * const appRow: AppRow = {
 *   id: 1,
 *   name: "mobile_api",
 *   label: "Mobile Application API",
 *   description: "REST API for mobile application backend",
 *   is_active: true,
 *   type: 2,
 *   path: "/mobile"
 * };
 * ```
 */
export interface AppRow {
  /** Unique application identifier from backend database */
  id: number;
  
  /** Application name (unique system identifier) */
  name: string;
  
  /** Human-readable application label */
  label: string;
  
  /** Application description */
  description: string;
  
  /** Whether the application is currently active and accessible */
  is_active: boolean;
  
  /** Application type identifier */
  type: number;
  
  /** Application URL path or endpoint */
  path: string;
}

/**
 * Comprehensive application type definition for detailed application management operations.
 * Maintains exact compatibility with existing backend API structure while
 * supporting React component state management and form handling.
 * 
 * Used in:
 * - Application creation and editing forms
 * - Detailed application management interfaces
 * - Application deployment workflows
 * - API request/response payloads for application CRUD operations
 * 
 * @interface AppType
 * @example
 * ```typescript
 * const appType: AppType = {
 *   id: 1,
 *   name: "customer_portal",
 *   label: "Customer Portal",
 *   description: "Self-service customer portal application",
 *   isActive: true,
 *   type: 3,
 *   path: "/portal",
 *   url: "https://api.company.com/portal",
 *   isUrlExternal: false,
 *   storageServiceId: 1,
 *   storageContainer: "app_files",
 *   requiresFullscreen: false,
 *   allowFullscreenToggle: true,
 *   toggleLocation: "top-right",
 *   createdById: 1,
 *   lastModifiedById: 1,
 *   createdDate: "2024-01-15T10:30:00Z",
 *   lastModifiedDate: "2024-01-15T10:30:00Z",
 *   appToRoleToRolesByAppId: [1, 2, 3],
 *   lookupByAppId: [1, 2]
 * };
 * ```
 */
export interface AppType {
  /** Application description */
  description: string;
  
  /** Unique application identifier */
  id: number;
  
  /** Whether application is active and accessible to users */
  isActive: boolean;
  
  /** Application name (unique system identifier) */
  name: string;
  
  /** Human-readable application label */
  label: string;
  
  /** Application type identifier */
  type: number;
  
  /** Application URL path or endpoint */
  path: string;
  
  /** Full URL for the application */
  url: string;
  
  /** Whether the URL points to an external application */
  isUrlExternal: boolean;
  
  /** Storage service ID for application files */
  storageServiceId?: number;
  
  /** Storage container name for application assets */
  storageContainer?: string;
  
  /** Whether application requires fullscreen mode */
  requiresFullscreen: boolean;
  
  /** Whether users can toggle fullscreen mode */
  allowFullscreenToggle: boolean;
  
  /** Location of fullscreen toggle control */
  toggleLocation: string;
  
  /** ID of user who created this application */
  createdById: number;
  
  /** ID of user who last modified this application */
  lastModifiedById: number;
  
  /** ISO 8601 timestamp when application was created */
  createdDate: string;
  
  /** ISO 8601 timestamp when application was last modified */
  lastModifiedDate: string;
  
  /** Array of role IDs associated with this application */
  appToRoleToRolesByAppId: number[];
  
  /** Array of lookup IDs associated with this application */
  lookupByAppId: number[];
}

/**
 * Application payload structure for API create/update requests.
 * Maintains exact compatibility with existing backend API structure.
 * 
 * Used in:
 * - Application creation POST requests
 * - Application update PUT/PATCH requests
 * - Form data submission payloads
 * - API integration with backend services
 * 
 * @interface AppPayload
 * @example
 * ```typescript
 * const appPayload: AppPayload = {
 *   name: "analytics_dashboard",
 *   label: "Analytics Dashboard",
 *   description: "Real-time analytics and reporting dashboard",
 *   isActive: true,
 *   type: 1,
 *   path: "/analytics",
 *   url: "https://api.company.com/analytics",
 *   isUrlExternal: false,
 *   storageServiceId: 2,
 *   storageContainer: "dashboard_assets",
 *   requiresFullscreen: true,
 *   allowFullscreenToggle: false,
 *   toggleLocation: "top-right",
 *   roleIds: [1, 2, 3]
 * };
 * ```
 */
export interface AppPayload {
  /** Application name (required) */
  name: string;
  
  /** Application label (required) */
  label: string;
  
  /** Application description */
  description?: string;
  
  /** Whether application is active */
  isActive?: boolean;
  
  /** Application type identifier */
  type: number;
  
  /** Application URL path */
  path: string;
  
  /** Full application URL */
  url: string;
  
  /** Whether URL is external */
  isUrlExternal?: boolean;
  
  /** Storage service ID for application files */
  storageServiceId?: number;
  
  /** Storage container for application assets */
  storageContainer?: string;
  
  /** Fullscreen requirement */
  requiresFullscreen?: boolean;
  
  /** Fullscreen toggle capability */
  allowFullscreenToggle?: boolean;
  
  /** Toggle control location */
  toggleLocation?: string;
  
  /** Associated role IDs */
  roleIds?: number[];
  
  /** Associated lookup IDs */
  lookupIds?: number[];
}

// =============================================================================
// APPLICATION TYPE AND STATUS ENUMERATIONS
// =============================================================================

/**
 * Application type enumeration for categorizing applications.
 */
export enum ApplicationType {
  /** Web-based application */
  WEB = 1,
  
  /** Mobile application */
  MOBILE = 2,
  
  /** Native desktop application */
  NATIVE = 3,
  
  /** API-only application */
  API = 4,
  
  /** Microservice application */
  MICROSERVICE = 5,
  
  /** Third-party integration */
  INTEGRATION = 6
}

/**
 * Application status enumeration for tracking deployment states.
 */
export enum ApplicationStatus {
  /** Application is in development */
  DEVELOPMENT = 'development',
  
  /** Application is in testing phase */
  TESTING = 'testing',
  
  /** Application is in staging environment */
  STAGING = 'staging',
  
  /** Application is deployed and active */
  PRODUCTION = 'production',
  
  /** Application is temporarily disabled */
  DISABLED = 'disabled',
  
  /** Application has been archived */
  ARCHIVED = 'archived',
  
  /** Application deployment failed */
  ERROR = 'error'
}

/**
 * Application deployment environment enumeration.
 */
export enum DeploymentEnvironment {
  /** Development environment */
  DEV = 'dev',
  
  /** Quality assurance environment */
  QA = 'qa',
  
  /** User acceptance testing environment */
  UAT = 'uat',
  
  /** Staging environment */
  STAGING = 'staging',
  
  /** Production environment */
  PRODUCTION = 'production'
}

// =============================================================================
// REACT COMPONENT INTEGRATION TYPES
// =============================================================================

/**
 * Extended application data interface for React component state management.
 * Combines backend data with client-side state and UI concerns.
 */
export interface AppComponentState extends AppType {
  /** Loading state for application operations */
  loading?: boolean;
  
  /** Error state for application operations */
  error?: string | null;
  
  /** Whether application is currently being edited */
  isEditing?: boolean;
  
  /** Whether application is selected in multi-select interfaces */
  isSelected?: boolean;
  
  /** Validation errors for form fields */
  validationErrors?: AppValidationErrors;
  
  /** Original values for change tracking */
  originalValues?: Partial<AppType>;
  
  /** Dirty state for form change detection */
  isDirty?: boolean;
  
  /** Deployment status information */
  deploymentStatus?: ApplicationStatus;
  
  /** Environment-specific configurations */
  environments?: EnvironmentConfig[];
  
  /** Application metrics and analytics */
  metrics?: AppMetrics;
  
  /** Associated roles with detailed information */
  roles?: RoleType[];
  
  /** Application health status */
  healthStatus?: HealthStatus;
}

/**
 * Validation error mapping for application form fields.
 */
export interface AppValidationErrors {
  /** Name field validation errors */
  name?: string[];
  
  /** Label field validation errors */
  label?: string[];
  
  /** Description field validation errors */
  description?: string[];
  
  /** Path field validation errors */
  path?: string[];
  
  /** URL field validation errors */
  url?: string[];
  
  /** Type field validation errors */
  type?: string[];
  
  /** Storage configuration validation errors */
  storage?: string[];
  
  /** Role assignment validation errors */
  roles?: string[];
  
  /** General validation errors */
  general?: string[];
}

/**
 * Environment-specific configuration for applications.
 */
export interface EnvironmentConfig {
  /** Environment identifier */
  environment: DeploymentEnvironment;
  
  /** Environment-specific URL */
  url: string;
  
  /** Environment-specific configuration variables */
  variables: Record<string, string>;
  
  /** Whether environment is currently active */
  isActive: boolean;
  
  /** Last deployment timestamp */
  lastDeployed?: string;
  
  /** Deployment version */
  version?: string;
  
  /** Environment health status */
  healthStatus?: HealthStatus;
}

/**
 * Application metrics and analytics data.
 */
export interface AppMetrics {
  /** Total API calls in current period */
  apiCalls: number;
  
  /** Unique users in current period */
  uniqueUsers: number;
  
  /** Average response time in milliseconds */
  averageResponseTime: number;
  
  /** Error rate percentage */
  errorRate: number;
  
  /** Uptime percentage */
  uptime: number;
  
  /** Last updated timestamp */
  lastUpdated: string;
  
  /** Historical data points */
  history?: MetricDataPoint[];
}

/**
 * Individual metric data point for historical tracking.
 */
export interface MetricDataPoint {
  /** Timestamp of the data point */
  timestamp: string;
  
  /** Metric values at this point in time */
  values: Record<string, number>;
}

/**
 * Application health status information.
 */
export interface HealthStatus {
  /** Overall health status */
  status: 'healthy' | 'warning' | 'critical' | 'unknown';
  
  /** Health check timestamp */
  lastChecked: string;
  
  /** Detailed health checks */
  checks: HealthCheck[];
  
  /** Overall health score (0-100) */
  score: number;
}

/**
 * Individual health check result.
 */
export interface HealthCheck {
  /** Health check name */
  name: string;
  
  /** Check status */
  status: 'pass' | 'fail' | 'warn';
  
  /** Check description */
  description: string;
  
  /** Response time for the check */
  responseTime?: number;
  
  /** Additional check details */
  details?: Record<string, any>;
}

/**
 * Application selection state for dropdowns and multi-select components.
 */
export interface AppSelectionState {
  /** Currently selected application IDs */
  selectedIds: number[];
  
  /** Available applications for selection */
  availableApps: AppRow[];
  
  /** Filtered applications based on search criteria */
  filteredApps: AppRow[];
  
  /** Search query for application filtering */
  searchQuery: string;
  
  /** Filter by application type */
  typeFilter?: ApplicationType;
  
  /** Filter by application status */
  statusFilter?: ApplicationStatus;
  
  /** Loading state for application data fetching */
  loading: boolean;
  
  /** Error state for application data fetching */
  error: string | null;
}

/**
 * Application management component props interface.
 */
export interface AppManagementComponentProps {
  /** Current user context for permission checking */
  currentUser?: {
    id: number;
    roles: RoleRow[];
    permissions: string[];
  };
  
  /** Available applications for management */
  applications?: AppType[];
  
  /** Loading state */
  loading?: boolean;
  
  /** Error state */
  error?: string | null;
  
  /** Application creation handler */
  onCreateApp?: (app: AppPayload) => Promise<void>;
  
  /** Application update handler */
  onUpdateApp?: (id: number, app: Partial<AppPayload>) => Promise<void>;
  
  /** Application deletion handler */
  onDeleteApp?: (id: number) => Promise<void>;
  
  /** Application deployment handler */
  onDeployApp?: (id: number, environment: DeploymentEnvironment) => Promise<void>;
  
  /** Application selection handler */
  onSelectApp?: (app: AppType) => void;
  
  /** Component styling classes */
  className?: string;
  
  /** Child components */
  children?: ReactNode;
}

/**
 * Application selector component props interface.
 */
export interface AppSelectorProps {
  /** Available applications for selection */
  applications: AppRow[];
  
  /** Currently selected application IDs */
  selectedIds?: number[];
  
  /** Multi-select mode */
  multiple?: boolean;
  
  /** Filter by application type */
  typeFilter?: ApplicationType[];
  
  /** Filter by application status */
  statusFilter?: ApplicationStatus[];
  
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
  
  /** Custom application display renderer */
  renderApp?: (app: AppRow) => ReactNode;
  
  /** Component styling */
  className?: string;
}

/**
 * Application form component props interface.
 */
export interface AppFormProps {
  /** Application being edited (undefined for create mode) */
  application?: AppType;
  
  /** Available application types */
  availableTypes?: ApplicationTypeOption[];
  
  /** Available roles for assignment */
  availableRoles?: RoleRow[];
  
  /** Available storage services */
  storageServices?: StorageServiceOption[];
  
  /** Form submission handler */
  onSubmit: (app: AppPayload) => Promise<void>;
  
  /** Form cancellation handler */
  onCancel?: () => void;
  
  /** Loading state during submission */
  loading?: boolean;
  
  /** Form validation errors */
  errors?: AppValidationErrors;
  
  /** Read-only mode */
  readOnly?: boolean;
  
  /** Show advanced options */
  showAdvanced?: boolean;
  
  /** Component styling */
  className?: string;
}

/**
 * Application type option for form dropdowns.
 */
export interface ApplicationTypeOption {
  /** Type identifier */
  value: number;
  
  /** Display label */
  label: string;
  
  /** Type description */
  description: string;
  
  /** Type icon component */
  icon?: React.ComponentType<{ className?: string }>;
  
  /** Whether type is available for creation */
  available: boolean;
}

/**
 * Storage service option for application file storage.
 */
export interface StorageServiceOption {
  /** Service identifier */
  id: number;
  
  /** Service name */
  name: string;
  
  /** Service display label */
  label: string;
  
  /** Available containers */
  containers: string[];
  
  /** Whether service is currently active */
  isActive: boolean;
}

/**
 * Application deployment component props interface.
 */
export interface AppDeploymentProps {
  /** Application to deploy */
  application: AppType;
  
  /** Available deployment environments */
  environments: DeploymentEnvironment[];
  
  /** Current deployment status */
  deploymentStatus?: Record<DeploymentEnvironment, EnvironmentConfig>;
  
  /** Deployment handler */
  onDeploy: (environment: DeploymentEnvironment, config?: EnvironmentConfig) => Promise<void>;
  
  /** Environment configuration handler */
  onConfigureEnvironment: (environment: DeploymentEnvironment, config: EnvironmentConfig) => Promise<void>;
  
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
// APPLICATION QUERY AND MUTATION TYPES
// =============================================================================

/**
 * Application query parameters for React Query/SWR integration.
 */
export interface AppQueryParams {
  /** Filter by active status */
  active?: boolean;
  
  /** Search by name, label, or description */
  search?: string;
  
  /** Filter by application type */
  type?: ApplicationType[];
  
  /** Filter by application status */
  status?: ApplicationStatus[];
  
  /** Filter by associated roles */
  roles?: number[];
  
  /** Filter by deployment environment */
  environment?: DeploymentEnvironment;
  
  /** Pagination limit */
  limit?: number;
  
  /** Pagination offset */
  offset?: number;
  
  /** Sort field */
  sortBy?: keyof AppType;
  
  /** Sort direction */
  sortDirection?: 'asc' | 'desc';
  
  /** Include related data */
  include?: ('roles' | 'metrics' | 'health' | 'environments')[];
}

/**
 * Application creation payload for API requests.
 */
export interface CreateAppPayload {
  /** Application name (required) */
  name: string;
  
  /** Application label (required) */
  label: string;
  
  /** Application description */
  description?: string;
  
  /** Application type (required) */
  type: number;
  
  /** Application path (required) */
  path: string;
  
  /** Application URL (required) */
  url: string;
  
  /** Whether application is active (default: true) */
  isActive?: boolean;
  
  /** Whether URL is external */
  isUrlExternal?: boolean;
  
  /** Storage service configuration */
  storageServiceId?: number;
  
  /** Storage container */
  storageContainer?: string;
  
  /** Fullscreen settings */
  requiresFullscreen?: boolean;
  
  /** Fullscreen toggle settings */
  allowFullscreenToggle?: boolean;
  
  /** Toggle location */
  toggleLocation?: string;
  
  /** Initial role assignments */
  roleIds?: number[];
  
  /** Initial lookup associations */
  lookupIds?: number[];
  
  /** Environment-specific configurations */
  environments?: Partial<EnvironmentConfig>[];
}

/**
 * Application update payload for API requests.
 */
export interface UpdateAppPayload {
  /** Updated application name */
  name?: string;
  
  /** Updated application label */
  label?: string;
  
  /** Updated application description */
  description?: string;
  
  /** Updated application type */
  type?: number;
  
  /** Updated application path */
  path?: string;
  
  /** Updated application URL */
  url?: string;
  
  /** Updated active status */
  isActive?: boolean;
  
  /** Updated external URL flag */
  isUrlExternal?: boolean;
  
  /** Updated storage service */
  storageServiceId?: number;
  
  /** Updated storage container */
  storageContainer?: string;
  
  /** Updated fullscreen requirement */
  requiresFullscreen?: boolean;
  
  /** Updated fullscreen toggle capability */
  allowFullscreenToggle?: boolean;
  
  /** Updated toggle location */
  toggleLocation?: string;
  
  /** Updated role assignments */
  roleIds?: number[];
  
  /** Updated lookup associations */
  lookupIds?: number[];
}

/**
 * Application deletion options.
 */
export interface DeleteAppOptions {
  /** Whether to force deletion even if app has dependencies */
  force?: boolean;
  
  /** Whether to backup application data before deletion */
  backup?: boolean;
  
  /** Whether to send notification to app users */
  notifyUsers?: boolean;
  
  /** Reason for deletion */
  reason?: string;
}

/**
 * Application deployment payload.
 */
export interface DeploymentPayload {
  /** Target environment */
  environment: DeploymentEnvironment;
  
  /** Environment-specific configuration */
  config?: EnvironmentConfig;
  
  /** Deployment version */
  version?: string;
  
  /** Deployment notes */
  notes?: string;
  
  /** Whether to run health checks after deployment */
  runHealthChecks?: boolean;
  
  /** Rollback strategy */
  rollbackStrategy?: 'automatic' | 'manual' | 'none';
}

// =============================================================================
// APPLICATION HOOK INTEGRATION TYPES
// =============================================================================

/**
 * Application management hook return interface.
 */
export interface UseAppManagementReturn {
  /** Available applications */
  applications: AppType[];
  
  /** Loading state */
  loading: boolean;
  
  /** Error state */
  error: string | null;
  
  /** Create application function */
  createApp: (payload: CreateAppPayload) => Promise<AppType>;
  
  /** Update application function */
  updateApp: (id: number, payload: UpdateAppPayload) => Promise<AppType>;
  
  /** Delete application function */
  deleteApp: (id: number, options?: DeleteAppOptions) => Promise<void>;
  
  /** Deploy application function */
  deployApp: (id: number, payload: DeploymentPayload) => Promise<void>;
  
  /** Refresh applications function */
  refreshApps: () => Promise<void>;
  
  /** Get application by ID function */
  getAppById: (id: number) => AppType | undefined;
  
  /** Filter applications function */
  filterApps: (params: AppQueryParams) => AppType[];
  
  /** Get application metrics function */
  getAppMetrics: (id: number) => Promise<AppMetrics>;
  
  /** Get application health function */
  getAppHealth: (id: number) => Promise<HealthStatus>;
}

/**
 * Application selection hook return interface.
 */
export interface UseAppSelectionReturn {
  /** Selection state */
  selectionState: AppSelectionState;
  
  /** Select application function */
  selectApp: (id: number) => void;
  
  /** Deselect application function */
  deselectApp: (id: number) => void;
  
  /** Toggle application selection */
  toggleApp: (id: number) => void;
  
  /** Select all applications */
  selectAll: () => void;
  
  /** Clear selection */
  clearSelection: () => void;
  
  /** Set search query */
  setSearchQuery: (query: string) => void;
  
  /** Set type filter */
  setTypeFilter: (types: ApplicationType[]) => void;
  
  /** Set status filter */
  setStatusFilter: (statuses: ApplicationStatus[]) => void;
  
  /** Get selected applications */
  getSelectedApps: () => AppRow[];
}

/**
 * Application deployment hook return interface.
 */
export interface UseAppDeploymentReturn {
  /** Deployment status for each environment */
  deploymentStatus: Record<DeploymentEnvironment, EnvironmentConfig | null>;
  
  /** Loading state */
  loading: boolean;
  
  /** Error state */
  error: string | null;
  
  /** Deploy to environment function */
  deployToEnvironment: (environment: DeploymentEnvironment, config?: EnvironmentConfig) => Promise<void>;
  
  /** Configure environment function */
  configureEnvironment: (environment: DeploymentEnvironment, config: EnvironmentConfig) => Promise<void>;
  
  /** Get deployment history */
  getDeploymentHistory: (environment: DeploymentEnvironment) => Promise<DeploymentHistoryEntry[]>;
  
  /** Rollback deployment */
  rollbackDeployment: (environment: DeploymentEnvironment, version: string) => Promise<void>;
}

/**
 * Deployment history entry.
 */
export interface DeploymentHistoryEntry {
  /** Deployment identifier */
  id: string;
  
  /** Deployment version */
  version: string;
  
  /** Deployment timestamp */
  timestamp: string;
  
  /** User who performed deployment */
  deployedBy: number;
  
  /** Deployment status */
  status: 'success' | 'failed' | 'rollback';
  
  /** Deployment duration in seconds */
  duration: number;
  
  /** Deployment notes */
  notes?: string;
  
  /** Configuration used for deployment */
  config: EnvironmentConfig;
}

// =============================================================================
// APPLICATION EVENT TYPES
// =============================================================================

/**
 * Application management event types for component communication.
 */
export type AppManagementEvent =
  | 'app:created'
  | 'app:updated'
  | 'app:deleted'
  | 'app:deployed'
  | 'app:selected'
  | 'app:deselected'
  | 'apps:loaded'
  | 'apps:error'
  | 'deployment:started'
  | 'deployment:completed'
  | 'deployment:failed'
  | 'health:updated'
  | 'metrics:updated';

/**
 * Application event payload interface.
 */
export interface AppEventPayload {
  /** Event type */
  type: AppManagementEvent;
  
  /** Application data (if applicable) */
  app?: AppType;
  
  /** Application ID (if applicable) */
  appId?: number;
  
  /** Environment (for deployment events) */
  environment?: DeploymentEnvironment;
  
  /** Error information (if applicable) */
  error?: string;
  
  /** Additional event data */
  data?: Record<string, any>;
  
  /** Event timestamp */
  timestamp: string;
}

/**
 * Application event handler function type.
 */
export type AppEventHandler = (payload: AppEventPayload) => void;

// =============================================================================
// APPLICATION UTILITY TYPES
// =============================================================================

/**
 * Application comparison result for change detection.
 */
export interface AppComparisonResult {
  /** Whether applications are equal */
  isEqual: boolean;
  
  /** Changed fields */
  changedFields: (keyof AppType)[];
  
  /** Field-specific differences */
  differences: Record<keyof AppType, {
    oldValue: any;
    newValue: any;
  }>;
}

/**
 * Application validation result interface.
 */
export interface AppValidationResult {
  /** Whether application data is valid */
  isValid: boolean;
  
  /** Validation errors by field */
  errors: AppValidationErrors;
  
  /** Validation warnings */
  warnings?: Record<string, string[]>;
  
  /** Suggested fixes */
  suggestions?: string[];
}

/**
 * Application export/import format.
 */
export interface AppExportData {
  /** Export metadata */
  metadata: {
    version: string;
    exportDate: string;
    exportedBy: number;
    totalApps: number;
  };
  
  /** Application data */
  applications: AppType[];
  
  /** Environment configurations */
  environments?: Record<number, EnvironmentConfig[]>;
  
  /** Role assignments */
  roleAssignments?: Record<number, number[]>;
  
  /** Export options used */
  options: {
    includeInactiveApps: boolean;
    includeEnvironments: boolean;
    includeMetrics: boolean;
    includeRoleAssignments: boolean;
  };
}

// =============================================================================
// TYPE GUARDS AND VALIDATORS
// =============================================================================

/**
 * Type guard to check if an object is a valid AppRow.
 */
export function isAppRow(obj: any): obj is AppRow {
  return (
    typeof obj === 'object' &&
    obj !== null &&
    typeof obj.id === 'number' &&
    typeof obj.name === 'string' &&
    typeof obj.label === 'string' &&
    typeof obj.description === 'string' &&
    typeof obj.is_active === 'boolean' &&
    typeof obj.type === 'number' &&
    typeof obj.path === 'string'
  );
}

/**
 * Type guard to check if an object is a valid AppType.
 */
export function isAppType(obj: any): obj is AppType {
  return (
    typeof obj === 'object' &&
    obj !== null &&
    typeof obj.id === 'number' &&
    typeof obj.name === 'string' &&
    typeof obj.label === 'string' &&
    typeof obj.description === 'string' &&
    typeof obj.isActive === 'boolean' &&
    typeof obj.type === 'number' &&
    typeof obj.path === 'string' &&
    typeof obj.url === 'string' &&
    typeof obj.isUrlExternal === 'boolean' &&
    typeof obj.requiresFullscreen === 'boolean' &&
    typeof obj.allowFullscreenToggle === 'boolean' &&
    typeof obj.toggleLocation === 'string' &&
    typeof obj.createdById === 'number' &&
    typeof obj.createdDate === 'string' &&
    typeof obj.lastModifiedById === 'number' &&
    typeof obj.lastModifiedDate === 'string' &&
    Array.isArray(obj.appToRoleToRolesByAppId) &&
    obj.appToRoleToRolesByAppId.every((id: any) => typeof id === 'number') &&
    Array.isArray(obj.lookupByAppId) &&
    obj.lookupByAppId.every((id: any) => typeof id === 'number')
  );
}

/**
 * Type guard to check if an object is a valid AppPayload.
 */
export function isAppPayload(obj: any): obj is AppPayload {
  return (
    typeof obj === 'object' &&
    obj !== null &&
    typeof obj.name === 'string' &&
    typeof obj.label === 'string' &&
    typeof obj.type === 'number' &&
    typeof obj.path === 'string' &&
    typeof obj.url === 'string' &&
    (obj.description === undefined || typeof obj.description === 'string') &&
    (obj.isActive === undefined || typeof obj.isActive === 'boolean') &&
    (obj.isUrlExternal === undefined || typeof obj.isUrlExternal === 'boolean') &&
    (obj.roleIds === undefined || (Array.isArray(obj.roleIds) && obj.roleIds.every((id: any) => typeof id === 'number')))
  );
}

/**
 * Validates application data according to business rules.
 */
export function validateAppData(app: Partial<AppType>): AppValidationResult {
  const errors: AppValidationErrors = {};
  const warnings: Record<string, string[]> = {};
  
  // Name validation
  if (!app.name) {
    errors.name = ['Application name is required'];
  } else if (app.name.length < 3) {
    errors.name = ['Application name must be at least 3 characters'];
  } else if (app.name.length > 64) {
    errors.name = ['Application name must not exceed 64 characters'];
  } else if (!/^[a-zA-Z][a-zA-Z0-9_-]*$/.test(app.name)) {
    errors.name = ['Application name must start with a letter and contain only letters, numbers, underscores, and hyphens'];
  }
  
  // Label validation
  if (!app.label) {
    errors.label = ['Application label is required'];
  } else if (app.label.length > 255) {
    errors.label = ['Application label must not exceed 255 characters'];
  }
  
  // Description validation
  if (app.description && app.description.length > 1000) {
    errors.description = ['Application description must not exceed 1000 characters'];
  }
  
  // Path validation
  if (!app.path) {
    errors.path = ['Application path is required'];
  } else if (!app.path.startsWith('/')) {
    errors.path = ['Application path must start with "/"'];
  } else if (app.path.length > 255) {
    errors.path = ['Application path must not exceed 255 characters'];
  }
  
  // URL validation
  if (!app.url) {
    errors.url = ['Application URL is required'];
  } else {
    try {
      new URL(app.url);
    } catch {
      errors.url = ['Application URL must be a valid URL'];
    }
  }
  
  // Type validation
  if (app.type === undefined || app.type === null) {
    errors.type = ['Application type is required'];
  } else if (!Object.values(ApplicationType).includes(app.type)) {
    errors.type = ['Invalid application type'];
  }
  
  // Storage validation
  if (app.storageServiceId && !app.storageContainer) {
    warnings.storage = ['Storage service specified but no container defined'];
  }
  
  return {
    isValid: Object.keys(errors).length === 0,
    errors,
    warnings: Object.keys(warnings).length > 0 ? warnings : undefined,
    suggestions: Object.keys(warnings).length > 0 ? [
      'Ensure storage configuration is complete if file storage is required'
    ] : undefined
  };
}

/**
 * Default values for creating new applications.
 */
export const DEFAULT_APP_VALUES: Partial<AppType> = {
  isActive: true,
  isUrlExternal: false,
  requiresFullscreen: false,
  allowFullscreenToggle: true,
  toggleLocation: 'top-right',
  appToRoleToRolesByAppId: [],
  lookupByAppId: []
};

/**
 * Application field labels for form components.
 */
export const APP_FIELD_LABELS: Record<keyof AppType, string> = {
  id: 'ID',
  name: 'Application Name',
  label: 'Display Label',
  description: 'Description',
  isActive: 'Active',
  type: 'Application Type',
  path: 'URL Path',
  url: 'Full URL',
  isUrlExternal: 'External URL',
  storageServiceId: 'Storage Service',
  storageContainer: 'Storage Container',
  requiresFullscreen: 'Requires Fullscreen',
  allowFullscreenToggle: 'Allow Fullscreen Toggle',
  toggleLocation: 'Toggle Location',
  createdById: 'Created By',
  createdDate: 'Created Date',
  lastModifiedById: 'Last Modified By',
  lastModifiedDate: 'Last Modified Date',
  appToRoleToRolesByAppId: 'Associated Roles',
  lookupByAppId: 'Associated Lookups'
};

/**
 * Application type labels for display.
 */
export const APPLICATION_TYPE_LABELS: Record<ApplicationType, string> = {
  [ApplicationType.WEB]: 'Web Application',
  [ApplicationType.MOBILE]: 'Mobile Application',
  [ApplicationType.NATIVE]: 'Native Application',
  [ApplicationType.API]: 'API Application',
  [ApplicationType.MICROSERVICE]: 'Microservice',
  [ApplicationType.INTEGRATION]: 'Third-party Integration'
};

/**
 * Application status labels for display.
 */
export const APPLICATION_STATUS_LABELS: Record<ApplicationStatus, string> = {
  [ApplicationStatus.DEVELOPMENT]: 'Development',
  [ApplicationStatus.TESTING]: 'Testing',
  [ApplicationStatus.STAGING]: 'Staging',
  [ApplicationStatus.PRODUCTION]: 'Production',
  [ApplicationStatus.DISABLED]: 'Disabled',
  [ApplicationStatus.ARCHIVED]: 'Archived',
  [ApplicationStatus.ERROR]: 'Error'
};

/**
 * Deployment environment labels for display.
 */
export const DEPLOYMENT_ENVIRONMENT_LABELS: Record<DeploymentEnvironment, string> = {
  [DeploymentEnvironment.DEV]: 'Development',
  [DeploymentEnvironment.QA]: 'Quality Assurance',
  [DeploymentEnvironment.UAT]: 'User Acceptance Testing',
  [DeploymentEnvironment.STAGING]: 'Staging',
  [DeploymentEnvironment.PRODUCTION]: 'Production'
};