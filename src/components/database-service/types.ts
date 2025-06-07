/**
 * Database Service Component Types
 * 
 * TypeScript interface definitions and type exports specific to database service 
 * components, including service configuration, connection parameters, validation 
 * schemas, and component prop interfaces. Defines type-safe contracts for database 
 * service operations with React 19 and Next.js 15.1+ integration.
 * 
 * @fileoverview Database service component types for React/Next.js application
 * @version 1.0.0
 * @since React 19.0.0, Next.js 15.1+, TypeScript 5.8+
 */

import { z } from 'zod';
import type { ReactNode, ComponentType, FormEvent } from 'react';
import type { UseFormReturn, FieldError, Path } from 'react-hook-form';
import type { SWRConfiguration, SWRResponse } from 'swr';
import type { UseMutationResult } from '@tanstack/react-query';

// Re-export core types from centralized database service types
export type {
  DatabaseDriver,
  ServiceTier,
  ServiceStatus,
  DatabaseType,
  DatabaseConfig,
  DatabaseService,
  ServiceType,
  SSLConfig,
  PoolingConfig,
  DatabaseOptions,
  ConnectionTestResult,
  ConnectionTestStatus,
  ConnectionMetadata,
  GenericListResponse,
  ApiErrorResponse,
  ResponseMetadata,
  DatabaseConnectionInput,
  ConnectionTestInput,
  DatabaseServiceCreateInput,
  DatabaseServiceUpdateInput,
  ServiceRow,
} from '../../types/database-service';

// =============================================================================
// ZOD SCHEMA VALIDATORS FOR REACT HOOK FORM INTEGRATION
// =============================================================================

/**
 * Database connection configuration schema with comprehensive validation
 * Supports all database types: MySQL, PostgreSQL, Oracle, MongoDB, Snowflake
 */
export const DatabaseConnectionSchema = z.object({
  // Basic connection parameters
  name: z.string()
    .min(1, 'Service name is required')
    .max(255, 'Service name must be 255 characters or less')
    .regex(/^[a-zA-Z0-9_-]+$/, 'Service name can only contain letters, numbers, underscores, and hyphens'),
  
  label: z.string()
    .min(1, 'Service label is required')
    .max(255, 'Service label must be 255 characters or less')
    .optional(),
  
  description: z.string()
    .max(1000, 'Description must be 1000 characters or less')
    .optional(),
  
  type: z.enum(['mysql', 'postgresql', 'sqlserver', 'oracle', 'mongodb', 'snowflake', 'sqlite'], {
    required_error: 'Database type is required',
    invalid_type_error: 'Invalid database type selected',
  }),
  
  // Connection details
  host: z.string()
    .min(1, 'Host is required')
    .max(255, 'Host must be 255 characters or less')
    .refine((val) => {
      // Allow IP addresses, hostnames, and FQDNs
      const ipRegex = /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;
      const hostRegex = /^[a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(\.[a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;
      return ipRegex.test(val) || hostRegex.test(val);
    }, 'Invalid host format'),
  
  port: z.number()
    .int('Port must be an integer')
    .min(1, 'Port must be between 1 and 65535')
    .max(65535, 'Port must be between 1 and 65535')
    .optional(),
  
  database: z.string()
    .min(1, 'Database name is required')
    .max(255, 'Database name must be 255 characters or less'),
  
  username: z.string()
    .min(1, 'Username is required')
    .max(255, 'Username must be 255 characters or less'),
  
  password: z.string()
    .min(1, 'Password is required')
    .max(1000, 'Password must be 1000 characters or less'),
  
  // Advanced configuration
  connectionString: z.string()
    .max(2000, 'Connection string must be 2000 characters or less')
    .optional(),
  
  charset: z.string()
    .max(50, 'Charset must be 50 characters or less')
    .optional(),
  
  timezone: z.string()
    .max(100, 'Timezone must be 100 characters or less')
    .optional(),
  
  // SSL Configuration
  ssl: z.object({
    enabled: z.boolean(),
    mode: z.enum(['disable', 'allow', 'prefer', 'require', 'verify-ca', 'verify-full'])
      .optional(),
    ca: z.string().max(10000, 'SSL CA certificate too long').optional(),
    cert: z.string().max(10000, 'SSL certificate too long').optional(),
    key: z.string().max(10000, 'SSL key too long').optional(),
    rejectUnauthorized: z.boolean().optional(),
  }).optional(),
  
  // Connection pooling
  pooling: z.object({
    min: z.number().int().min(0).max(100).optional(),
    max: z.number().int().min(1).max(1000).optional(),
    acquireTimeoutMillis: z.number().int().min(1000).max(300000).optional(),
    createTimeoutMillis: z.number().int().min(1000).max(300000).optional(),
    destroyTimeoutMillis: z.number().int().min(1000).max(300000).optional(),
    idleTimeoutMillis: z.number().int().min(10000).max(3600000).optional(),
    reapIntervalMillis: z.number().int().min(1000).max(3600000).optional(),
    createRetryIntervalMillis: z.number().int().min(100).max(10000).optional(),
  }).optional(),
  
  // Service status
  is_active: z.boolean().default(true),
}).refine((data) => {
  // Custom validation for port based on database type
  if (data.port === undefined) return true;
  
  const defaultPorts: Record<string, number> = {
    mysql: 3306,
    postgresql: 5432,
    sqlserver: 1433,
    oracle: 1521,
    mongodb: 27017,
    snowflake: 443,
    sqlite: 0, // SQLite doesn't use ports
  };
  
  const expectedPort = defaultPorts[data.type];
  if (data.type === 'sqlite' && data.port !== undefined) {
    return false;
  }
  
  return true;
}, {
  message: 'Invalid port for selected database type',
  path: ['port'],
});

/**
 * Connection test schema for validating connection test requests
 */
export const ConnectionTestSchema = z.object({
  serviceId: z.number().int().positive('Service ID must be a positive integer').optional(),
  config: DatabaseConnectionSchema.optional(),
  timeout: z.number().int().min(1000).max(30000).default(5000),
  skipCache: z.boolean().default(false),
});

/**
 * Service query parameters schema for filtering and pagination
 */
export const ServiceQuerySchema = z.object({
  page: z.number().int().min(1).default(1),
  limit: z.number().int().min(1).max(100).default(20),
  search: z.string().max(255).optional(),
  type: z.enum(['mysql', 'postgresql', 'sqlserver', 'oracle', 'mongodb', 'snowflake', 'sqlite']).optional(),
  status: z.enum(['active', 'inactive', 'testing', 'error', 'configuring']).optional(),
  sortBy: z.enum(['name', 'type', 'created_date', 'last_modified_date']).default('name'),
  sortOrder: z.enum(['asc', 'desc']).default('asc'),
});

/**
 * Inferred types from Zod schemas
 */
export type DatabaseConnectionFormData = z.infer<typeof DatabaseConnectionSchema>;
export type ConnectionTestFormData = z.infer<typeof ConnectionTestSchema>;
export type ServiceQueryParams = z.infer<typeof ServiceQuerySchema>;

// =============================================================================
// REACT COMPONENT PROP INTERFACES
// =============================================================================

/**
 * Base component props following React 19 patterns
 */
export interface BaseComponentProps {
  /** Component CSS class name */
  className?: string;
  
  /** Test identifier for automated testing */
  'data-testid'?: string;
  
  /** Additional ARIA attributes */
  'aria-label'?: string;
  'aria-describedby'?: string;
}

/**
 * Database Service List Component Props
 * React table component for displaying and managing database services
 */
export interface DatabaseServiceListProps extends BaseComponentProps {
  /** Array of database services to display */
  services: DatabaseService[];
  
  /** Loading state indicator */
  loading?: boolean;
  
  /** Error message to display */
  error?: string | null;
  
  /** Enable service selection functionality */
  selectable?: boolean;
  
  /** Currently selected service IDs */
  selectedServiceIds?: number[];
  
  /** Callback when service selection changes */
  onSelectionChange?: (selectedIds: number[]) => void;
  
  /** Callback when a service row is clicked */
  onServiceClick?: (service: DatabaseService) => void;
  
  /** Callback when edit action is triggered */
  onEdit?: (service: DatabaseService) => void;
  
  /** Callback when delete action is triggered */
  onDelete?: (service: DatabaseService) => void;
  
  /** Callback when test connection action is triggered */
  onTestConnection?: (service: DatabaseService) => void;
  
  /** Callback when create new service is triggered */
  onCreate?: () => void;
  
  /** Enable pagination */
  enablePagination?: boolean;
  
  /** Current page number (1-based) */
  currentPage?: number;
  
  /** Total number of pages */
  totalPages?: number;
  
  /** Total number of items */
  totalItems?: number;
  
  /** Items per page */
  pageSize?: number;
  
  /** Callback when page changes */
  onPageChange?: (page: number) => void;
  
  /** Callback when page size changes */
  onPageSizeChange?: (size: number) => void;
  
  /** Enable search functionality */
  enableSearch?: boolean;
  
  /** Current search term */
  searchTerm?: string;
  
  /** Callback when search term changes */
  onSearchChange?: (term: string) => void;
  
  /** Enable filtering by service type */
  enableTypeFilter?: boolean;
  
  /** Current type filter */
  typeFilter?: DatabaseDriver | null;
  
  /** Callback when type filter changes */
  onTypeFilterChange?: (type: DatabaseDriver | null) => void;
  
  /** Enable sorting */
  enableSorting?: boolean;
  
  /** Current sort field */
  sortBy?: string;
  
  /** Current sort order */
  sortOrder?: 'asc' | 'desc';
  
  /** Callback when sorting changes */
  onSortChange?: (field: string, order: 'asc' | 'desc') => void;
  
  /** Empty state message */
  emptyMessage?: string;
  
  /** Custom empty state component */
  emptyState?: ComponentType;
  
  /** Enable bulk actions */
  enableBulkActions?: boolean;
  
  /** Available bulk actions */
  bulkActions?: BulkAction[];
  
  /** Callback when bulk action is executed */
  onBulkAction?: (action: string, serviceIds: number[]) => void;
  
  /** Column visibility configuration */
  columnConfig?: ColumnConfig;
  
  /** Enable column resizing */
  enableColumnResizing?: boolean;
  
  /** Enable column reordering */
  enableColumnReordering?: boolean;
  
  /** Table density setting */
  density?: 'compact' | 'normal' | 'comfortable';
  
  /** Show table header */
  showHeader?: boolean;
  
  /** Show table footer */
  showFooter?: boolean;
  
  /** Custom row renderer */
  rowRenderer?: (service: DatabaseService, index: number) => ReactNode;
  
  /** Custom cell renderers */
  cellRenderers?: Record<string, (value: any, service: DatabaseService) => ReactNode>;
  
  /** Enable row selection */
  enableRowSelection?: boolean;
  
  /** Row selection mode */
  selectionMode?: 'single' | 'multiple';
  
  /** Enable row expansion */
  enableRowExpansion?: boolean;
  
  /** Expanded row IDs */
  expandedRows?: number[];
  
  /** Callback when row expansion changes */
  onRowExpansionChange?: (expandedIds: number[]) => void;
  
  /** Custom expanded row content */
  expandedRowRenderer?: (service: DatabaseService) => ReactNode;
  
  /** Loading overlay component */
  loadingOverlay?: ComponentType;
  
  /** Error overlay component */
  errorOverlay?: ComponentType<{ error: string }>;
  
  /** Enable virtual scrolling for large datasets */
  enableVirtualScrolling?: boolean;
  
  /** Virtual scrolling item height */
  itemHeight?: number;
  
  /** Virtual scrolling overscan count */
  overscanCount?: number;
}

/**
 * Bulk action configuration
 */
export interface BulkAction {
  /** Action identifier */
  id: string;
  
  /** Display label */
  label: string;
  
  /** Action icon component */
  icon?: ComponentType<{ className?: string }>;
  
  /** Action variant */
  variant?: 'default' | 'destructive' | 'warning';
  
  /** Whether action requires confirmation */
  requiresConfirmation?: boolean;
  
  /** Confirmation message */
  confirmationMessage?: string;
  
  /** Whether action is disabled */
  disabled?: boolean;
  
  /** Disabled reason tooltip */
  disabledReason?: string;
}

/**
 * Column configuration for service list table
 */
export interface ColumnConfig {
  /** Show service name column */
  showName?: boolean;
  
  /** Show service type column */
  showType?: boolean;
  
  /** Show service host column */
  showHost?: boolean;
  
  /** Show service database column */
  showDatabase?: boolean;
  
  /** Show service status column */
  showStatus?: boolean;
  
  /** Show last connection test column */
  showLastTest?: boolean;
  
  /** Show created date column */
  showCreatedDate?: boolean;
  
  /** Show last modified date column */
  showLastModified?: boolean;
  
  /** Show actions column */
  showActions?: boolean;
  
  /** Custom column widths */
  columnWidths?: Record<string, string>;
  
  /** Column order */
  columnOrder?: string[];
}

/**
 * Database Service Form Component Props
 * React form component for creating and editing database services
 */
export interface DatabaseServiceFormProps extends BaseComponentProps {
  /** Form mode */
  mode: 'create' | 'edit';
  
  /** Initial form data for edit mode */
  initialData?: Partial<DatabaseConnectionFormData>;
  
  /** Service ID for edit mode */
  serviceId?: number;
  
  /** Form loading state */
  loading?: boolean;
  
  /** Form submission callback */
  onSubmit: (data: DatabaseConnectionFormData) => Promise<void> | void;
  
  /** Form cancel callback */
  onCancel?: () => void;
  
  /** Custom form validation */
  customValidation?: (data: DatabaseConnectionFormData) => Record<string, string> | null;
  
  /** Enable real-time validation */
  enableRealTimeValidation?: boolean;
  
  /** Validation mode */
  validationMode?: 'onSubmit' | 'onBlur' | 'onChange' | 'onTouched';
  
  /** Re-validation mode */
  reValidateMode?: 'onSubmit' | 'onBlur' | 'onChange' | 'onTouched';
  
  /** Focus first error on submission */
  shouldFocusError?: boolean;
  
  /** Form layout */
  layout?: 'vertical' | 'horizontal' | 'inline';
  
  /** Field spacing */
  spacing?: 'compact' | 'normal' | 'comfortable';
  
  /** Show field hints */
  showHints?: boolean;
  
  /** Show required indicators */
  showRequiredIndicators?: boolean;
  
  /** Field groups configuration */
  fieldGroups?: FieldGroupConfig[];
  
  /** Enable collapsible sections */
  enableCollapsibleSections?: boolean;
  
  /** Initially collapsed sections */
  initiallyCollapsed?: string[];
  
  /** Custom field components */
  customFields?: Record<string, ComponentType<FieldProps>>;
  
  /** Field visibility configuration */
  fieldVisibility?: Record<string, boolean>;
  
  /** Conditional field logic */
  conditionalFields?: ConditionalFieldConfig[];
  
  /** Enable auto-save */
  enableAutoSave?: boolean;
  
  /** Auto-save interval in milliseconds */
  autoSaveInterval?: number;
  
  /** Auto-save callback */
  onAutoSave?: (data: Partial<DatabaseConnectionFormData>) => void;
  
  /** Enable form reset */
  enableReset?: boolean;
  
  /** Custom reset confirmation */
  resetConfirmation?: string;
  
  /** Submit button text */
  submitText?: string;
  
  /** Cancel button text */
  cancelText?: string;
  
  /** Reset button text */
  resetText?: string;
  
  /** Hide action buttons */
  hideActions?: boolean;
  
  /** Custom action buttons */
  customActions?: ReactNode;
  
  /** Form footer content */
  footer?: ReactNode;
  
  /** Enable connection test within form */
  enableConnectionTest?: boolean;
  
  /** Connection test callback */
  onConnectionTest?: (data: DatabaseConnectionFormData) => Promise<ConnectionTestResult>;
  
  /** Show connection test results */
  showTestResults?: boolean;
  
  /** Connection test results */
  testResults?: ConnectionTestResult | null;
  
  /** Enable database-specific help */
  enableDatabaseHelp?: boolean;
  
  /** Custom help content */
  helpContent?: Record<DatabaseDriver, ReactNode>;
  
  /** Form change callback */
  onChange?: (data: Partial<DatabaseConnectionFormData>, isDirty: boolean) => void;
  
  /** Form error callback */
  onError?: (errors: Record<string, FieldError>) => void;
  
  /** Form validation callback */
  onValidation?: (isValid: boolean, errors: Record<string, FieldError>) => void;
}

/**
 * Field group configuration
 */
export interface FieldGroupConfig {
  /** Group identifier */
  id: string;
  
  /** Group title */
  title: string;
  
  /** Group description */
  description?: string;
  
  /** Fields in this group */
  fields: string[];
  
  /** Group is collapsible */
  collapsible?: boolean;
  
  /** Initially collapsed */
  collapsed?: boolean;
  
  /** Group icon */
  icon?: ComponentType<{ className?: string }>;
  
  /** Group order */
  order?: number;
}

/**
 * Conditional field configuration
 */
export interface ConditionalFieldConfig {
  /** Field to control */
  field: string;
  
  /** Conditions */
  conditions: FieldCondition[];
  
  /** Logic operator */
  operator: 'AND' | 'OR';
  
  /** Action when conditions are met */
  action: 'show' | 'hide' | 'enable' | 'disable' | 'require' | 'optional';
}

/**
 * Field condition
 */
export interface FieldCondition {
  /** Field to check */
  field: Path<DatabaseConnectionFormData>;
  
  /** Comparison operator */
  operator: 'equals' | 'notEquals' | 'contains' | 'notContains' | 'isEmpty' | 'isNotEmpty';
  
  /** Value to compare against */
  value: any;
}

/**
 * Custom field component props
 */
export interface FieldProps {
  /** Field name */
  name: string;
  
  /** Field label */
  label: string;
  
  /** Field value */
  value: any;
  
  /** Field change callback */
  onChange: (value: any) => void;
  
  /** Field error */
  error?: string;
  
  /** Field is required */
  required?: boolean;
  
  /** Field is disabled */
  disabled?: boolean;
  
  /** Field placeholder */
  placeholder?: string;
  
  /** Field hint */
  hint?: string;
  
  /** Additional props */
  [key: string]: any;
}

/**
 * Connection Test Component Props
 * React component for testing database connections
 */
export interface ConnectionTestProps extends BaseComponentProps {
  /** Service to test (for existing services) */
  service?: DatabaseService;
  
  /** Connection configuration to test (for new services) */
  config?: DatabaseConnectionFormData;
  
  /** Test timeout in milliseconds */
  timeout?: number;
  
  /** Skip cache and force new test */
  skipCache?: boolean;
  
  /** Show test button */
  showButton?: boolean;
  
  /** Test button text */
  buttonText?: string;
  
  /** Test button variant */
  buttonVariant?: 'default' | 'primary' | 'secondary';
  
  /** Test button size */
  buttonSize?: 'sm' | 'md' | 'lg';
  
  /** Auto-test on mount */
  autoTest?: boolean;
  
  /** Auto-test on config change */
  autoTestOnChange?: boolean;
  
  /** Test debounce delay in milliseconds */
  debounceDelay?: number;
  
  /** Show detailed test results */
  showDetails?: boolean;
  
  /** Show test duration */
  showDuration?: boolean;
  
  /** Show test timestamp */
  showTimestamp?: boolean;
  
  /** Test success callback */
  onTestSuccess?: (result: ConnectionTestResult) => void;
  
  /** Test error callback */
  onTestError?: (error: string, result?: ConnectionTestResult) => void;
  
  /** Test start callback */
  onTestStart?: () => void;
  
  /** Test complete callback (success or error) */
  onTestComplete?: (result: ConnectionTestResult) => void;
  
  /** Custom success message */
  successMessage?: string;
  
  /** Custom error message */
  errorMessage?: string;
  
  /** Custom loading message */
  loadingMessage?: string;
  
  /** Enable test history */
  enableHistory?: boolean;
  
  /** Maximum history entries */
  maxHistory?: number;
  
  /** Test history */
  history?: ConnectionTestResult[];
  
  /** Show test history */
  showHistory?: boolean;
  
  /** Clear history callback */
  onClearHistory?: () => void;
  
  /** Custom result renderer */
  resultRenderer?: (result: ConnectionTestResult) => ReactNode;
  
  /** Custom error renderer */
  errorRenderer?: (error: string, result?: ConnectionTestResult) => ReactNode;
  
  /** Custom loading renderer */
  loadingRenderer?: () => ReactNode;
  
  /** Test in progress state */
  testing?: boolean;
  
  /** Last test result */
  lastResult?: ConnectionTestResult | null;
  
  /** Disable test button */
  disabled?: boolean;
  
  /** Disabled reason tooltip */
  disabledReason?: string;
  
  /** Enable retry functionality */
  enableRetry?: boolean;
  
  /** Maximum retry attempts */
  maxRetries?: number;
  
  /** Retry delay in milliseconds */
  retryDelay?: number;
  
  /** Current retry attempt */
  retryAttempt?: number;
  
  /** Enable test cancellation */
  enableCancellation?: boolean;
  
  /** Test cancellation callback */
  onCancel?: () => void;
  
  /** Show advanced options */
  showAdvancedOptions?: boolean;
  
  /** Advanced test options */
  advancedOptions?: Record<string, any>;
}

// =============================================================================
// SWR/REACT QUERY INTEGRATION TYPES
// =============================================================================

/**
 * SWR Query Keys for database services
 */
export const DatabaseServiceQueryKeys = {
  /** Base key for all database service queries */
  all: ['database-services'] as const,
  
  /** Service list queries */
  lists: () => [...DatabaseServiceQueryKeys.all, 'list'] as const,
  
  /** Filtered service list query */
  list: (params: ServiceQueryParams) => 
    [...DatabaseServiceQueryKeys.lists(), params] as const,
  
  /** Individual service queries */
  details: () => [...DatabaseServiceQueryKeys.all, 'detail'] as const,
  
  /** Single service query */
  detail: (id: number) => 
    [...DatabaseServiceQueryKeys.details(), id] as const,
  
  /** Connection test queries */
  tests: () => [...DatabaseServiceQueryKeys.all, 'test'] as const,
  
  /** Connection test query */
  test: (serviceId: number) => 
    [...DatabaseServiceQueryKeys.tests(), serviceId] as const,
  
  /** Service types query */
  types: () => [...DatabaseServiceQueryKeys.all, 'types'] as const,
  
  /** Service configuration schema query */
  schema: (type: DatabaseDriver) => 
    [...DatabaseServiceQueryKeys.all, 'schema', type] as const,
} as const;

/**
 * SWR configuration options for database services
 */
export interface DatabaseServiceSWRConfig extends SWRConfiguration {
  /** Enable automatic revalidation on focus */
  revalidateOnFocus?: boolean;
  
  /** Enable automatic revalidation on reconnect */
  revalidateOnReconnect?: boolean;
  
  /** Enable automatic revalidation on interval */
  revalidateOnInterval?: number;
  
  /** Stale time before revalidation */
  dedupingInterval?: number;
  
  /** Error retry count */
  errorRetryCount?: number;
  
  /** Error retry interval */
  errorRetryInterval?: number;
  
  /** Focus throttle interval */
  focusThrottleInterval?: number;
  
  /** Loading timeout */
  loadingTimeout?: number;
  
  /** Keep previous data on revalidation */
  keepPreviousData?: boolean;
}

/**
 * Database service list SWR response
 */
export interface DatabaseServiceListResponse extends SWRResponse<GenericListResponse<DatabaseService>, Error> {
  /** Refresh service list */
  refresh: () => Promise<GenericListResponse<DatabaseService> | undefined>;
  
  /** Mutate service list data */
  mutateServices: (data?: GenericListResponse<DatabaseService>) => Promise<GenericListResponse<DatabaseService> | undefined>;
  
  /** Add optimistic service */
  addOptimisticService: (service: DatabaseService) => void;
  
  /** Update optimistic service */
  updateOptimisticService: (id: number, updates: Partial<DatabaseService>) => void;
  
  /** Remove optimistic service */
  removeOptimisticService: (id: number) => void;
}

/**
 * Database service detail SWR response
 */
export interface DatabaseServiceDetailResponse extends SWRResponse<DatabaseService, Error> {
  /** Refresh service detail */
  refresh: () => Promise<DatabaseService | undefined>;
  
  /** Mutate service data */
  mutateService: (data?: DatabaseService) => Promise<DatabaseService | undefined>;
  
  /** Update service optimistically */
  updateOptimistic: (updates: Partial<DatabaseService>) => void;
}

/**
 * Connection test SWR response
 */
export interface ConnectionTestResponse extends SWRResponse<ConnectionTestResult, Error> {
  /** Test connection */
  testConnection: (config?: DatabaseConnectionFormData) => Promise<ConnectionTestResult>;
  
  /** Cancel ongoing test */
  cancelTest: () => void;
  
  /** Test is in progress */
  isTesting: boolean;
  
  /** Test history */
  history: ConnectionTestResult[];
  
  /** Clear test history */
  clearHistory: () => void;
}

/**
 * React Query mutation result for database service operations
 */
export interface DatabaseServiceMutationResult<TData = any, TVariables = any> 
  extends UseMutationResult<TData, Error, TVariables> {
  /** Mutation is idle */
  isIdle: boolean;
  
  /** Mutation is pending */
  isPending: boolean;
  
  /** Mutation succeeded */
  isSuccess: boolean;
  
  /** Mutation failed */
  isError: boolean;
  
  /** Reset mutation state */
  reset: () => void;
}

/**
 * Database service creation mutation variables
 */
export interface CreateServiceMutationVariables {
  /** Service configuration data */
  data: DatabaseConnectionFormData;
  
  /** Test connection before creating */
  testConnection?: boolean;
  
  /** Skip validation */
  skipValidation?: boolean;
}

/**
 * Database service update mutation variables
 */
export interface UpdateServiceMutationVariables {
  /** Service ID to update */
  id: number;
  
  /** Updated service configuration */
  data: Partial<DatabaseConnectionFormData>;
  
  /** Test connection before updating */
  testConnection?: boolean;
  
  /** Skip validation */
  skipValidation?: boolean;
}

/**
 * Database service deletion mutation variables
 */
export interface DeleteServiceMutationVariables {
  /** Service ID to delete */
  id: number;
  
  /** Force deletion even if service is in use */
  force?: boolean;
  
  /** Backup service before deletion */
  backup?: boolean;
}

/**
 * Connection test mutation variables
 */
export interface TestConnectionMutationVariables {
  /** Service ID to test (for existing services) */
  serviceId?: number;
  
  /** Connection configuration to test (for new services) */
  config?: DatabaseConnectionFormData;
  
  /** Test timeout */
  timeout?: number;
  
  /** Skip cache */
  skipCache?: boolean;
}

// =============================================================================
// HOOK RETURN TYPES
// =============================================================================

/**
 * Database service list hook return type
 */
export interface UseDatabaseServiceListReturn {
  /** Service list data */
  services: DatabaseService[];
  
  /** Loading state */
  loading: boolean;
  
  /** Error state */
  error: Error | null;
  
  /** Total items count */
  totalItems: number;
  
  /** Total pages count */
  totalPages: number;
  
  /** Current page */
  currentPage: number;
  
  /** Page size */
  pageSize: number;
  
  /** Refresh services */
  refresh: () => Promise<void>;
  
  /** Set search term */
  setSearch: (term: string) => void;
  
  /** Set type filter */
  setTypeFilter: (type: DatabaseDriver | null) => void;
  
  /** Set page */
  setPage: (page: number) => void;
  
  /** Set page size */
  setPageSize: (size: number) => void;
  
  /** Set sorting */
  setSort: (field: string, order: 'asc' | 'desc') => void;
  
  /** Current query parameters */
  queryParams: ServiceQueryParams;
  
  /** Update query parameters */
  updateQuery: (params: Partial<ServiceQueryParams>) => void;
  
  /** Is data stale */
  isStale: boolean;
  
  /** Is revalidating */
  isRevalidating: boolean;
}

/**
 * Database service detail hook return type
 */
export interface UseDatabaseServiceDetailReturn {
  /** Service data */
  service: DatabaseService | null;
  
  /** Loading state */
  loading: boolean;
  
  /** Error state */
  error: Error | null;
  
  /** Refresh service */
  refresh: () => Promise<void>;
  
  /** Update service */
  update: (updates: Partial<DatabaseService>) => Promise<void>;
  
  /** Delete service */
  delete: () => Promise<void>;
  
  /** Test connection */
  testConnection: () => Promise<ConnectionTestResult>;
  
  /** Is data stale */
  isStale: boolean;
  
  /** Is revalidating */
  isRevalidating: boolean;
}

/**
 * Database service form hook return type
 */
export interface UseDatabaseServiceFormReturn {
  /** React Hook Form instance */
  form: UseFormReturn<DatabaseConnectionFormData>;
  
  /** Form submission handler */
  handleSubmit: (e?: FormEvent) => Promise<void>;
  
  /** Form is submitting */
  isSubmitting: boolean;
  
  /** Form is valid */
  isValid: boolean;
  
  /** Form is dirty */
  isDirty: boolean;
  
  /** Form errors */
  errors: Record<string, FieldError>;
  
  /** Reset form */
  reset: (data?: Partial<DatabaseConnectionFormData>) => void;
  
  /** Clear errors */
  clearErrors: () => void;
  
  /** Trigger validation */
  validate: () => Promise<boolean>;
  
  /** Watch form values */
  watch: UseFormReturn<DatabaseConnectionFormData>['watch'];
  
  /** Get field value */
  getValue: (name: Path<DatabaseConnectionFormData>) => any;
  
  /** Set field value */
  setValue: (name: Path<DatabaseConnectionFormData>, value: any) => void;
  
  /** Set field error */
  setError: (name: Path<DatabaseConnectionFormData>, error: FieldError) => void;
  
  /** Clear field error */
  clearFieldError: (name: Path<DatabaseConnectionFormData>) => void;
}

/**
 * Connection test hook return type
 */
export interface UseConnectionTestReturn {
  /** Test connection function */
  testConnection: (config?: DatabaseConnectionFormData) => Promise<ConnectionTestResult>;
  
  /** Test is in progress */
  isTesting: boolean;
  
  /** Last test result */
  result: ConnectionTestResult | null;
  
  /** Test error */
  error: Error | null;
  
  /** Test history */
  history: ConnectionTestResult[];
  
  /** Clear test history */
  clearHistory: () => void;
  
  /** Cancel ongoing test */
  cancel: () => void;
  
  /** Can cancel test */
  canCancel: boolean;
  
  /** Test duration */
  duration: number | null;
  
  /** Retry test */
  retry: () => Promise<ConnectionTestResult>;
  
  /** Can retry test */
  canRetry: boolean;
  
  /** Retry count */
  retryCount: number;
}

// =============================================================================
// UTILITY TYPES AND CONSTANTS
// =============================================================================

/**
 * Database type to default port mapping
 */
export const DATABASE_DEFAULT_PORTS: Record<DatabaseDriver, number | null> = {
  mysql: 3306,
  postgresql: 5432,
  sqlserver: 1433,
  oracle: 1521,
  mongodb: 27017,
  snowflake: 443,
  sqlite: null, // SQLite doesn't use ports
} as const;

/**
 * Database type display names
 */
export const DATABASE_TYPE_LABELS: Record<DatabaseDriver, string> = {
  mysql: 'MySQL',
  postgresql: 'PostgreSQL',
  sqlserver: 'SQL Server',
  oracle: 'Oracle',
  mongodb: 'MongoDB',
  snowflake: 'Snowflake',
  sqlite: 'SQLite',
} as const;

/**
 * Database type descriptions
 */
export const DATABASE_TYPE_DESCRIPTIONS: Record<DatabaseDriver, string> = {
  mysql: 'Popular open-source relational database',
  postgresql: 'Advanced open-source relational database',
  sqlserver: 'Microsoft SQL Server database',
  oracle: 'Enterprise-grade relational database',
  mongodb: 'NoSQL document database',
  snowflake: 'Cloud data warehouse platform',
  sqlite: 'Lightweight embedded database',
} as const;

/**
 * Service status display labels
 */
export const SERVICE_STATUS_LABELS: Record<ServiceStatus, string> = {
  active: 'Active',
  inactive: 'Inactive', 
  testing: 'Testing',
  error: 'Error',
  configuring: 'Configuring',
} as const;

/**
 * Service status colors for UI
 */
export const SERVICE_STATUS_COLORS: Record<ServiceStatus, string> = {
  active: 'green',
  inactive: 'gray',
  testing: 'blue',
  error: 'red',
  configuring: 'yellow',
} as const;

/**
 * Form field validation messages
 */
export const VALIDATION_MESSAGES = {
  required: 'This field is required',
  invalidEmail: 'Please enter a valid email address',
  invalidUrl: 'Please enter a valid URL',
  invalidHost: 'Please enter a valid hostname or IP address',
  invalidPort: 'Port must be between 1 and 65535',
  passwordTooShort: 'Password must be at least 8 characters',
  invalidFormat: 'Invalid format',
  tooLong: 'Value is too long',
  tooShort: 'Value is too short',
  invalidCharacters: 'Contains invalid characters',
  connectionFailed: 'Connection test failed',
  databaseNotFound: 'Database not found',
  authenticationFailed: 'Authentication failed',
  timeout: 'Connection timeout',
  networkError: 'Network error',
} as const;

/**
 * Type guard to check if a value is a valid database driver
 */
export function isDatabaseDriver(value: unknown): value is DatabaseDriver {
  return typeof value === 'string' && 
    ['mysql', 'postgresql', 'sqlserver', 'oracle', 'mongodb', 'snowflake', 'sqlite'].includes(value);
}

/**
 * Type guard to check if a value is a valid service status
 */
export function isServiceStatus(value: unknown): value is ServiceStatus {
  return typeof value === 'string' && 
    ['active', 'inactive', 'testing', 'error', 'configuring'].includes(value);
}

/**
 * Utility to get default port for database type
 */
export function getDefaultPort(type: DatabaseDriver): number | null {
  return DATABASE_DEFAULT_PORTS[type];
}

/**
 * Utility to format service status for display
 */
export function formatServiceStatus(status: ServiceStatus): string {
  return SERVICE_STATUS_LABELS[status];
}

/**
 * Utility to get service status color
 */
export function getServiceStatusColor(status: ServiceStatus): string {
  return SERVICE_STATUS_COLORS[status];
}

/**
 * Utility to validate connection configuration
 */
export function validateConnectionConfig(config: Partial<DatabaseConnectionFormData>): boolean {
  try {
    DatabaseConnectionSchema.parse(config);
    return true;
  } catch {
    return false;
  }
}

/**
 * Utility to create initial form data for database type
 */
export function createInitialFormData(type: DatabaseDriver): Partial<DatabaseConnectionFormData> {
  const defaultPort = getDefaultPort(type);
  
  return {
    type,
    port: defaultPort || undefined,
    is_active: true,
    ssl: {
      enabled: false,
    },
    pooling: {
      min: 0,
      max: 10,
    },
  };
}

/**
 * Export main component types for external usage
 */
export type {
  DatabaseConnectionFormData as ConnectionFormData,
  ConnectionTestFormData as TestFormData,
  ServiceQueryParams as QueryParams,
};