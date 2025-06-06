/**
 * Database Service List Types
 * 
 * TypeScript interface definitions and type exports specific to database service 
 * list components. Defines type-safe contracts for service list operations, table 
 * props, filter configurations, and component state management. Provides Zod 
 * schema validators for service list filtering and sorting parameters.
 * 
 * @fileoverview Service list component types for React/Next.js application
 * @version 1.0.0
 * @since React 19.0.0, Next.js 15.1+, TypeScript 5.8+
 */

import { z } from 'zod';
import type { ReactNode, ComponentType, MouseEvent, KeyboardEvent } from 'react';
import type { UseFormReturn, FieldError } from 'react-hook-form';
import type { SWRResponse } from 'swr';
import type { UseMutationResult, UseQueryResult } from '@tanstack/react-query';
import type { VirtualItem, Virtualizer } from '@tanstack/react-virtual';

// Re-export and extend core database service types
export type {
  DatabaseService,
  DatabaseDriver,
  ServiceStatus,
  DatabaseConnectionFormData,
  ServiceQueryParams,
  GenericListResponse,
  ApiErrorResponse,
  ResponseMetadata,
  ConnectionTestResult,
  DatabaseServiceSWRConfig,
  DatabaseServiceListResponse,
  DatabaseServiceMutationResult,
  CreateServiceMutationVariables,
  UpdateServiceMutationVariables,
  DeleteServiceMutationVariables,
  TestConnectionMutationVariables,
  BulkAction,
  ColumnConfig,
  BaseComponentProps,
} from '../types';

export {
  DatabaseConnectionSchema,
  ConnectionTestSchema,
  ServiceQuerySchema,
  DatabaseServiceQueryKeys,
  DATABASE_TYPE_LABELS,
  SERVICE_STATUS_LABELS,
  SERVICE_STATUS_COLORS,
  isDatabaseDriver,
  isServiceStatus,
  getDefaultPort,
  formatServiceStatus,
  getServiceStatusColor,
} from '../types';

// =============================================================================
// ZOD SCHEMA VALIDATORS FOR SERVICE LIST FILTERING AND SORTING
// =============================================================================

/**
 * Service list filter schema with comprehensive validation
 * Supports filtering by service properties, search terms, and advanced filters
 */
export const ServiceListFilterSchema = z.object({
  // Text search
  search: z.string()
    .max(255, 'Search term must be 255 characters or less')
    .optional(),
  
  // Service type filter
  type: z.enum(['mysql', 'postgresql', 'sqlserver', 'oracle', 'mongodb', 'snowflake', 'sqlite'])
    .optional(),
  
  // Service status filter
  status: z.enum(['active', 'inactive', 'testing', 'error', 'configuring'])
    .optional(),
  
  // Date range filters
  createdAfter: z.string()
    .datetime({ message: 'Invalid created after date format' })
    .optional(),
  
  createdBefore: z.string()
    .datetime({ message: 'Invalid created before date format' })
    .optional(),
  
  modifiedAfter: z.string()
    .datetime({ message: 'Invalid modified after date format' })
    .optional(),
  
  modifiedBefore: z.string()
    .datetime({ message: 'Invalid modified before date format' })
    .optional(),
  
  // Advanced filters
  isActive: z.boolean().optional(),
  hasConnectionIssues: z.boolean().optional(),
  needsAttention: z.boolean().optional(),
  
  // Host/connection filters
  hostPattern: z.string()
    .max(255, 'Host pattern must be 255 characters or less')
    .optional(),
  
  databasePattern: z.string()
    .max(255, 'Database pattern must be 255 characters or less')
    .optional(),
  
  // User filters (for admin views)
  createdBy: z.number().int().positive().optional(),
  modifiedBy: z.number().int().positive().optional(),
  
  // Performance filters
  lastTestPassed: z.boolean().optional(),
  lastTestDuration: z.object({
    min: z.number().min(0).optional(),
    max: z.number().min(0).optional(),
  }).optional(),
  
  // Tag-based filtering (if tags are implemented)
  tags: z.array(z.string().max(50)).optional(),
});

/**
 * Service list sorting schema with validation
 */
export const ServiceListSortSchema = z.object({
  field: z.enum([
    'name',
    'label', 
    'type',
    'host',
    'database',
    'status',
    'is_active',
    'created_date',
    'last_modified_date',
    'last_test_date',
    'last_test_duration',
    'connection_count',
  ], {
    required_error: 'Sort field is required',
    invalid_type_error: 'Invalid sort field',
  }),
  
  direction: z.enum(['asc', 'desc'], {
    required_error: 'Sort direction is required',
    invalid_type_error: 'Sort direction must be asc or desc',
  }),
  
  // Secondary sort for ties
  secondaryField: z.enum([
    'name',
    'type',
    'created_date',
    'last_modified_date',
  ]).optional(),
  
  secondaryDirection: z.enum(['asc', 'desc']).optional(),
});

/**
 * Service list pagination schema
 */
export const ServiceListPaginationSchema = z.object({
  page: z.number()
    .int('Page must be an integer')
    .min(1, 'Page must be at least 1')
    .max(10000, 'Page cannot exceed 10,000'),
  
  limit: z.number()
    .int('Limit must be an integer')
    .min(1, 'Limit must be at least 1')
    .max(100, 'Limit cannot exceed 100'),
  
  offset: z.number()
    .int('Offset must be an integer')
    .min(0, 'Offset cannot be negative')
    .optional(),
});

/**
 * Complete service list query schema combining filters, sorting, and pagination
 */
export const ServiceListQuerySchema = z.object({
  // Pagination
  pagination: ServiceListPaginationSchema,
  
  // Filtering
  filters: ServiceListFilterSchema.optional(),
  
  // Sorting
  sort: ServiceListSortSchema.optional(),
  
  // View options
  includeInactive: z.boolean().default(false),
  includeDeleted: z.boolean().default(false),
  includeSystemServices: z.boolean().default(true),
  
  // Performance options
  includeConnectionStatus: z.boolean().default(true),
  includeLastTestResult: z.boolean().default(false),
  includeSchemaMetadata: z.boolean().default(false),
  
  // Cache control
  skipCache: z.boolean().default(false),
  maxAge: z.number().int().min(0).max(3600).optional(), // Max cache age in seconds
});

/**
 * Bulk action schema for service operations
 */
export const ServiceBulkActionSchema = z.object({
  action: z.enum([
    'activate',
    'deactivate',
    'test-connection',
    'refresh-schema',
    'export-config',
    'delete',
    'duplicate',
    'add-tags',
    'remove-tags',
    'update-config',
  ], {
    required_error: 'Bulk action is required',
    invalid_type_error: 'Invalid bulk action type',
  }),
  
  serviceIds: z.array(z.number().int().positive())
    .min(1, 'At least one service must be selected')
    .max(100, 'Cannot perform bulk action on more than 100 services'),
  
  // Action-specific parameters
  parameters: z.record(z.any()).optional(),
  
  // Confirmation
  confirmed: z.boolean().default(false),
  
  // Batch processing options
  batchSize: z.number().int().min(1).max(10).default(5),
  continueOnError: z.boolean().default(false),
});

/**
 * Service list view configuration schema
 */
export const ServiceListViewConfigSchema = z.object({
  // Column configuration
  visibleColumns: z.array(z.string()).default([
    'name', 'type', 'host', 'database', 'status', 'actions'
  ]),
  
  columnWidths: z.record(z.string(), z.number().min(50).max(800)).optional(),
  columnOrder: z.array(z.string()).optional(),
  
  // Display options
  density: z.enum(['compact', 'normal', 'comfortable']).default('normal'),
  showRowNumbers: z.boolean().default(false),
  showRowSelection: z.boolean().default(true),
  showColumnHeaders: z.boolean().default(true),
  
  // Virtualization
  enableVirtualization: z.boolean().default(false),
  virtualItemHeight: z.number().min(40).max(200).default(60),
  virtualOverscan: z.number().min(1).max(20).default(5),
  
  // Grouping
  groupBy: z.enum(['type', 'status', 'host', 'created_date', 'none']).default('none'),
  expandedGroups: z.array(z.string()).default([]),
  
  // Refresh settings
  autoRefresh: z.boolean().default(false),
  refreshInterval: z.number().min(5000).max(300000).default(30000), // 30 seconds default
});

/**
 * Inferred types from Zod schemas
 */
export type ServiceListFilterData = z.infer<typeof ServiceListFilterSchema>;
export type ServiceListSortData = z.infer<typeof ServiceListSortSchema>;
export type ServiceListPaginationData = z.infer<typeof ServiceListPaginationSchema>;
export type ServiceListQueryData = z.infer<typeof ServiceListQuerySchema>;
export type ServiceBulkActionData = z.infer<typeof ServiceBulkActionSchema>;
export type ServiceListViewConfigData = z.infer<typeof ServiceListViewConfigSchema>;

// =============================================================================
// SERVICE LIST TABLE COMPONENT TYPES
// =============================================================================

/**
 * Service list table column definition
 */
export interface ServiceListColumn {
  /** Column identifier */
  id: string;
  
  /** Column header label */
  header: string;
  
  /** Column description for tooltips */
  description?: string;
  
  /** Data accessor key or function */
  accessor: keyof DatabaseService | ((service: DatabaseService) => any);
  
  /** Custom cell renderer */
  cell?: (value: any, service: DatabaseService, index: number) => ReactNode;
  
  /** Column width (CSS value) */
  width?: string;
  
  /** Minimum column width */
  minWidth?: number;
  
  /** Maximum column width */
  maxWidth?: number;
  
  /** Column is sortable */
  sortable?: boolean;
  
  /** Column is filterable */
  filterable?: boolean;
  
  /** Column is resizable */
  resizable?: boolean;
  
  /** Column is sticky */
  sticky?: 'left' | 'right';
  
  /** Column alignment */
  align?: 'left' | 'center' | 'right';
  
  /** Column is hidden by default */
  hidden?: boolean;
  
  /** Column cannot be hidden */
  required?: boolean;
  
  /** Column display order */
  order?: number;
  
  /** Column group (for multi-level headers) */
  group?: string;
  
  /** Custom header renderer */
  headerRenderer?: (column: ServiceListColumn) => ReactNode;
  
  /** Column-specific CSS classes */
  className?: string;
  
  /** Column-specific header CSS classes */
  headerClassName?: string;
  
  /** Column-specific cell CSS classes */
  cellClassName?: string;
}

/**
 * Service list table row selection configuration
 */
export interface ServiceListRowSelection {
  /** Selection mode */
  mode: 'none' | 'single' | 'multiple';
  
  /** Currently selected service IDs */
  selectedIds: number[];
  
  /** Selection change callback */
  onSelectionChange: (selectedIds: number[]) => void;
  
  /** Row selection disabled predicate */
  isRowSelectable?: (service: DatabaseService) => boolean;
  
  /** Select all checkbox in header */
  showSelectAll?: boolean;
  
  /** Select all state */
  selectAllState?: 'none' | 'some' | 'all';
  
  /** Select all callback */
  onSelectAll?: (selectAll: boolean) => void;
  
  /** Selection limit */
  maxSelection?: number;
  
  /** Selection validation */
  validateSelection?: (selectedIds: number[]) => string | null;
}

/**
 * Service list table action configuration
 */
export interface ServiceListAction {
  /** Action identifier */
  id: string;
  
  /** Action label */
  label: string;
  
  /** Action icon component */
  icon?: ComponentType<{ className?: string }>;
  
  /** Action callback */
  onClick: (service: DatabaseService, event: MouseEvent) => void;
  
  /** Action is disabled predicate */
  disabled?: (service: DatabaseService) => boolean;
  
  /** Disabled reason tooltip */
  disabledReason?: (service: DatabaseService) => string;
  
  /** Action variant */
  variant?: 'default' | 'primary' | 'secondary' | 'destructive' | 'ghost';
  
  /** Action size */
  size?: 'sm' | 'md' | 'lg';
  
  /** Action requires confirmation */
  requiresConfirmation?: boolean;
  
  /** Confirmation message */
  confirmationMessage?: (service: DatabaseService) => string;
  
  /** Action is loading */
  loading?: (service: DatabaseService) => boolean;
  
  /** Action order */
  order?: number;
  
  /** Action group */
  group?: string;
  
  /** Action visibility */
  visible?: (service: DatabaseService) => boolean;
  
  /** Keyboard shortcut */
  shortcut?: string;
}

/**
 * Service list table props interface
 */
export interface ServiceListTableProps extends BaseComponentProps {
  /** Service data array */
  services: DatabaseService[];
  
  /** Loading state */
  loading?: boolean;
  
  /** Error message */
  error?: string | null;
  
  /** Empty state message */
  emptyMessage?: string;
  
  /** Custom empty state component */
  emptyState?: ComponentType;
  
  /** Column configuration */
  columns: ServiceListColumn[];
  
  /** Row selection configuration */
  selection?: ServiceListRowSelection;
  
  /** Row actions configuration */
  actions?: ServiceListAction[];
  
  /** Bulk actions configuration */
  bulkActions?: BulkAction[];
  
  /** Row click handler */
  onRowClick?: (service: DatabaseService, event: MouseEvent) => void;
  
  /** Row double click handler */
  onRowDoubleClick?: (service: DatabaseService, event: MouseEvent) => void;
  
  /** Row context menu handler */
  onRowContextMenu?: (service: DatabaseService, event: MouseEvent) => void;
  
  /** Row hover handler */
  onRowHover?: (service: DatabaseService | null, event: MouseEvent) => void;
  
  /** Keyboard navigation handler */
  onKeyDown?: (event: KeyboardEvent) => void;
  
  /** Sort configuration */
  sort?: ServiceListSortData;
  
  /** Sort change handler */
  onSortChange?: (sort: ServiceListSortData) => void;
  
  /** Filter configuration */
  filters?: ServiceListFilterData;
  
  /** Filter change handler */
  onFilterChange?: (filters: ServiceListFilterData) => void;
  
  /** Pagination configuration */
  pagination?: ServiceListPaginationData & {
    total: number;
    totalPages: number;
  };
  
  /** Pagination change handler */
  onPaginationChange?: (pagination: ServiceListPaginationData) => void;
  
  /** View configuration */
  viewConfig?: ServiceListViewConfigData;
  
  /** View configuration change handler */
  onViewConfigChange?: (config: ServiceListViewConfigData) => void;
  
  /** Virtualization configuration */
  virtualization?: {
    enabled: boolean;
    itemHeight: number;
    overscan?: number;
    scrollElement?: HTMLElement;
  };
  
  /** Custom row renderer */
  rowRenderer?: (service: DatabaseService, index: number, style?: React.CSSProperties) => ReactNode;
  
  /** Custom loading overlay */
  loadingOverlay?: ComponentType;
  
  /** Custom error overlay */
  errorOverlay?: ComponentType<{ error: string }>;
  
  /** Table density */
  density?: 'compact' | 'normal' | 'comfortable';
  
  /** Show table borders */
  bordered?: boolean;
  
  /** Show row striping */
  striped?: boolean;
  
  /** Show hover effects */
  hoverable?: boolean;
  
  /** Table is focusable */
  focusable?: boolean;
  
  /** Auto-focus table on mount */
  autoFocus?: boolean;
  
  /** ARIA label for table */
  ariaLabel?: string;
  
  /** ARIA description for table */
  ariaDescription?: string;
  
  /** Test ID for table */
  testId?: string;
}

/**
 * Service list container props interface
 */
export interface ServiceListContainerProps extends BaseComponentProps {
  /** Initial query parameters */
  initialQuery?: Partial<ServiceListQueryData>;
  
  /** Enable search functionality */
  enableSearch?: boolean;
  
  /** Enable filtering */
  enableFiltering?: boolean;
  
  /** Enable sorting */
  enableSorting?: boolean;
  
  /** Enable pagination */
  enablePagination?: boolean;
  
  /** Enable column configuration */
  enableColumnConfig?: boolean;
  
  /** Enable bulk actions */
  enableBulkActions?: boolean;
  
  /** Enable export functionality */
  enableExport?: boolean;
  
  /** Enable import functionality */
  enableImport?: boolean;
  
  /** Enable auto-refresh */
  enableAutoRefresh?: boolean;
  
  /** Auto-refresh interval in milliseconds */
  autoRefreshInterval?: number;
  
  /** Service creation callback */
  onCreateService?: () => void;
  
  /** Service edit callback */
  onEditService?: (service: DatabaseService) => void;
  
  /** Service delete callback */
  onDeleteService?: (service: DatabaseService) => void;
  
  /** Service duplicate callback */
  onDuplicateService?: (service: DatabaseService) => void;
  
  /** Service test connection callback */
  onTestConnection?: (service: DatabaseService) => void;
  
  /** Service export callback */
  onExportServices?: (services: DatabaseService[]) => void;
  
  /** Service import callback */
  onImportServices?: (file: File) => void;
  
  /** Bulk action callback */
  onBulkAction?: (action: ServiceBulkActionData) => Promise<void>;
  
  /** Query change callback */
  onQueryChange?: (query: ServiceListQueryData) => void;
  
  /** Selection change callback */
  onSelectionChange?: (selectedIds: number[]) => void;
  
  /** View state change callback */
  onViewStateChange?: (state: ServiceListViewState) => void;
  
  /** Error handler */
  onError?: (error: Error) => void;
  
  /** Custom toolbar component */
  toolbar?: ComponentType<ServiceListToolbarProps>;
  
  /** Custom filter panel component */
  filterPanel?: ComponentType<ServiceListFilterPanelProps>;
  
  /** Show toolbar */
  showToolbar?: boolean;
  
  /** Show filter panel */
  showFilterPanel?: boolean;
  
  /** Show footer */
  showFooter?: boolean;
  
  /** Container layout */
  layout?: 'default' | 'compact' | 'full-width';
  
  /** Container height */
  height?: string | number;
  
  /** Enable full-screen mode */
  enableFullScreen?: boolean;
  
  /** Paywall configuration */
  paywall?: PaywallConfig;
}

// =============================================================================
// TANSTACK VIRTUAL TABLE TYPES
// =============================================================================

/**
 * Virtual table item data
 */
export interface VirtualServiceItem {
  /** Service data */
  service: DatabaseService;
  
  /** Virtual item index */
  index: number;
  
  /** Virtual item size */
  size: number;
  
  /** Virtual item start position */
  start: number;
  
  /** Virtual item end position */
  end: number;
  
  /** Item is visible in viewport */
  isVisible: boolean;
  
  /** Item measurement key */
  key: string | number;
}

/**
 * Virtual table configuration
 */
export interface VirtualTableConfig {
  /** Enable virtualization */
  enabled: boolean;
  
  /** Item height (fixed) or estimator function */
  itemHeight: number | ((index: number, service: DatabaseService) => number);
  
  /** Overscan count */
  overscan?: number;
  
  /** Scroll element */
  scrollElement?: HTMLElement | (() => HTMLElement);
  
  /** Initial scroll offset */
  initialOffset?: number;
  
  /** Scroll to index on mount */
  initialIndex?: number;
  
  /** Horizontal scrolling */
  horizontal?: boolean;
  
  /** Virtual item measure function */
  measureElement?: (element: HTMLElement) => void;
  
  /** Scroll margin */
  scrollMargin?: number;
  
  /** Gap between items */
  gap?: number;
  
  /** Enable smooth scrolling */
  smoothScrolling?: boolean;
  
  /** Scroll behavior */
  scrollBehavior?: 'auto' | 'smooth';
  
  /** Range extractor function */
  rangeExtractor?: (range: { startIndex: number; endIndex: number }) => number[];
}

/**
 * Virtual table state
 */
export interface VirtualTableState {
  /** Virtualizer instance */
  virtualizer: Virtualizer<HTMLElement, Element>;
  
  /** Virtual items */
  virtualItems: VirtualItem[];
  
  /** Total size */
  totalSize: number;
  
  /** Scroll offset */
  scrollOffset: number;
  
  /** Is scrolling */
  isScrolling: boolean;
  
  /** Visible range */
  visibleRange: { start: number; end: number };
  
  /** Scroll to index function */
  scrollToIndex: (index: number, options?: { align?: 'start' | 'center' | 'end' | 'auto' }) => void;
  
  /** Scroll to offset function */
  scrollToOffset: (offset: number, options?: { align?: 'start' | 'center' | 'end' | 'auto' }) => void;
  
  /** Measure element function */
  measureElement: (element: HTMLElement) => void;
  
  /** Get item by index */
  getItemByIndex: (index: number) => VirtualItem | undefined;
}

/**
 * Virtual row props
 */
export interface VirtualRowProps {
  /** Virtual item */
  virtualItem: VirtualItem;
  
  /** Service data */
  service: DatabaseService;
  
  /** Row index */
  index: number;
  
  /** Row is selected */
  isSelected: boolean;
  
  /** Row is hovered */
  isHovered: boolean;
  
  /** Row is focused */
  isFocused: boolean;
  
  /** Row style from virtualizer */
  style: React.CSSProperties;
  
  /** Measure element callback */
  measureElement: (element: HTMLElement) => void;
  
  /** Row selection callback */
  onSelect: (selected: boolean) => void;
  
  /** Row click callback */
  onClick: (event: MouseEvent) => void;
  
  /** Row hover callback */
  onHover: (hovered: boolean) => void;
  
  /** Row focus callback */
  onFocus: (focused: boolean) => void;
}

// =============================================================================
// REACT QUERY AND SWR INTEGRATION TYPES
// =============================================================================

/**
 * Service list query result
 */
export interface UseServiceListQueryResult extends UseQueryResult<GenericListResponse<DatabaseService>, Error> {
  /** Services array */
  services: DatabaseService[];
  
  /** Pagination metadata */
  pagination: {
    currentPage: number;
    totalPages: number;
    totalItems: number;
    pageSize: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
  };
  
  /** Refresh services */
  refresh: () => Promise<void>;
  
  /** Invalidate query */
  invalidate: () => Promise<void>;
  
  /** Prefetch next page */
  prefetchNextPage: () => Promise<void>;
  
  /** Prefetch previous page */
  prefetchPreviousPage: () => Promise<void>;
}

/**
 * Service list SWR result
 */
export interface UseServiceListSWRResult extends SWRResponse<GenericListResponse<DatabaseService>, Error> {
  /** Services array */
  services: DatabaseService[];
  
  /** Pagination metadata */
  pagination: {
    currentPage: number;
    totalPages: number;
    totalItems: number;
    pageSize: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
  };
  
  /** Refresh services */
  refresh: () => Promise<GenericListResponse<DatabaseService> | undefined>;
  
  /** Mutate with optimistic updates */
  mutateOptimistic: (updater: (data: GenericListResponse<DatabaseService>) => GenericListResponse<DatabaseService>) => Promise<GenericListResponse<DatabaseService> | undefined>;
  
  /** Add service optimistically */
  addServiceOptimistic: (service: DatabaseService) => void;
  
  /** Update service optimistically */
  updateServiceOptimistic: (id: number, updates: Partial<DatabaseService>) => void;
  
  /** Remove service optimistically */
  removeServiceOptimistic: (id: number) => void;
}

/**
 * Service list mutations interface
 */
export interface ServiceListMutations {
  /** Create service mutation */
  createService: UseMutationResult<DatabaseService, Error, CreateServiceMutationVariables>;
  
  /** Update service mutation */
  updateService: UseMutationResult<DatabaseService, Error, UpdateServiceMutationVariables>;
  
  /** Delete service mutation */
  deleteService: UseMutationResult<void, Error, DeleteServiceMutationVariables>;
  
  /** Test connection mutation */
  testConnection: UseMutationResult<ConnectionTestResult, Error, TestConnectionMutationVariables>;
  
  /** Bulk action mutation */
  bulkAction: UseMutationResult<ServiceBulkActionResult, Error, ServiceBulkActionData>;
  
  /** Export services mutation */
  exportServices: UseMutationResult<Blob, Error, { serviceIds: number[]; format: 'json' | 'csv' | 'xlsx' }>;
  
  /** Import services mutation */
  importServices: UseMutationResult<ServiceImportResult, Error, { file: File; options?: ServiceImportOptions }>;
}

/**
 * Bulk action result
 */
export interface ServiceBulkActionResult {
  /** Action that was performed */
  action: string;
  
  /** Total services processed */
  total: number;
  
  /** Successfully processed services */
  successful: number;
  
  /** Failed services */
  failed: number;
  
  /** Error details for failed services */
  errors: { serviceId: number; error: string }[];
  
  /** Result details */
  details: { serviceId: number; result: any }[];
  
  /** Action duration */
  duration: number;
}

/**
 * Service import result
 */
export interface ServiceImportResult {
  /** Total services in import file */
  total: number;
  
  /** Successfully imported services */
  imported: number;
  
  /** Skipped services (duplicates) */
  skipped: number;
  
  /** Failed imports */
  failed: number;
  
  /** Import errors */
  errors: { row: number; error: string }[];
  
  /** Imported service details */
  services: DatabaseService[];
}

/**
 * Service import options
 */
export interface ServiceImportOptions {
  /** Skip duplicate services */
  skipDuplicates?: boolean;
  
  /** Update existing services */
  updateExisting?: boolean;
  
  /** Validate connections on import */
  validateConnections?: boolean;
  
  /** Import batch size */
  batchSize?: number;
  
  /** Dry run mode */
  dryRun?: boolean;
}

// =============================================================================
// ZUSTAND STORE STATE MANAGEMENT TYPES
// =============================================================================

/**
 * Service list view state
 */
export interface ServiceListViewState {
  /** Current query parameters */
  query: ServiceListQueryData;
  
  /** Selected service IDs */
  selectedIds: number[];
  
  /** View configuration */
  viewConfig: ServiceListViewConfigData;
  
  /** Filter panel visibility */
  showFilterPanel: boolean;
  
  /** Column configuration panel visibility */
  showColumnConfig: boolean;
  
  /** Bulk actions panel visibility */
  showBulkActions: boolean;
  
  /** Full-screen mode */
  fullScreen: boolean;
  
  /** Last refresh timestamp */
  lastRefresh: number | null;
  
  /** Auto-refresh enabled */
  autoRefresh: boolean;
  
  /** Error state */
  error: string | null;
  
  /** Loading state */
  loading: boolean;
}

/**
 * Service list actions
 */
export interface ServiceListActions {
  /** Update query parameters */
  updateQuery: (query: Partial<ServiceListQueryData>) => void;
  
  /** Set selected service IDs */
  setSelectedIds: (ids: number[]) => void;
  
  /** Toggle service selection */
  toggleSelection: (id: number) => void;
  
  /** Select all services */
  selectAll: (services: DatabaseService[]) => void;
  
  /** Clear selection */
  clearSelection: () => void;
  
  /** Update view configuration */
  updateViewConfig: (config: Partial<ServiceListViewConfigData>) => void;
  
  /** Toggle filter panel */
  toggleFilterPanel: () => void;
  
  /** Toggle column configuration */
  toggleColumnConfig: () => void;
  
  /** Toggle bulk actions */
  toggleBulkActions: () => void;
  
  /** Toggle full-screen mode */
  toggleFullScreen: () => void;
  
  /** Set auto-refresh */
  setAutoRefresh: (enabled: boolean) => void;
  
  /** Set error state */
  setError: (error: string | null) => void;
  
  /** Set loading state */
  setLoading: (loading: boolean) => void;
  
  /** Reset to initial state */
  reset: () => void;
  
  /** Update last refresh timestamp */
  updateLastRefresh: () => void;
}

/**
 * Complete service list store type
 */
export type ServiceListStore = ServiceListViewState & ServiceListActions;

/**
 * Store hook options
 */
export interface UseServiceListStoreOptions {
  /** Store persistence key */
  persistKey?: string;
  
  /** Enable state persistence */
  persist?: boolean;
  
  /** Persist whitelist */
  persistWhitelist?: (keyof ServiceListViewState)[];
  
  /** Persist blacklist */
  persistBlacklist?: (keyof ServiceListViewState)[];
  
  /** Initial state override */
  initialState?: Partial<ServiceListViewState>;
  
  /** State change callback */
  onStateChange?: (state: ServiceListViewState) => void;
}

// =============================================================================
// PAYWALL AND ACCESS CONTROL TYPES
// =============================================================================

/**
 * Paywall configuration for service list features
 */
export interface PaywallConfig {
  /** Feature is behind paywall */
  enabled: boolean;
  
  /** Required subscription tier */
  requiredTier: 'basic' | 'professional' | 'enterprise';
  
  /** Feature limit for current tier */
  limit?: number;
  
  /** Current usage count */
  usage?: number;
  
  /** Paywall message */
  message?: string;
  
  /** Upgrade URL */
  upgradeUrl?: string;
  
  /** Custom paywall component */
  customComponent?: ComponentType<PaywallProps>;
  
  /** Allow limited functionality */
  allowLimited?: boolean;
  
  /** Limited functionality message */
  limitedMessage?: string;
}

/**
 * Paywall props interface
 */
export interface PaywallProps {
  /** Required tier */
  requiredTier: string;
  
  /** Feature name */
  feature: string;
  
  /** Custom message */
  message?: string;
  
  /** Upgrade URL */
  upgradeUrl?: string;
  
  /** Paywall action callback */
  onAction?: (action: 'upgrade' | 'dismiss') => void;
  
  /** Show upgrade button */
  showUpgrade?: boolean;
  
  /** Show dismiss button */
  showDismiss?: boolean;
}

/**
 * Access control configuration
 */
export interface ServiceListAccessControl {
  /** User can view services */
  canView: boolean;
  
  /** User can create services */
  canCreate: boolean;
  
  /** User can edit services */
  canEdit: boolean;
  
  /** User can delete services */
  canDelete: boolean;
  
  /** User can test connections */
  canTestConnection: boolean;
  
  /** User can perform bulk actions */
  canBulkAction: boolean;
  
  /** User can export services */
  canExport: boolean;
  
  /** User can import services */
  canImport: boolean;
  
  /** User can configure views */
  canConfigureView: boolean;
  
  /** Restricted service types */
  restrictedTypes?: DatabaseDriver[];
  
  /** Maximum services allowed */
  maxServices?: number;
  
  /** Feature restrictions */
  restrictions: Record<string, boolean>;
}

// =============================================================================
// ADDITIONAL COMPONENT PROP INTERFACES
// =============================================================================

/**
 * Service list toolbar props
 */
export interface ServiceListToolbarProps {
  /** Selected service count */
  selectedCount: number;
  
  /** Total service count */
  totalCount: number;
  
  /** Loading state */
  loading: boolean;
  
  /** Search value */
  searchValue: string;
  
  /** Search change handler */
  onSearchChange: (value: string) => void;
  
  /** Filter toggle handler */
  onToggleFilters: () => void;
  
  /** Column config toggle handler */
  onToggleColumnConfig: () => void;
  
  /** Bulk actions toggle handler */
  onToggleBulkActions: () => void;
  
  /** Create service handler */
  onCreateService: () => void;
  
  /** Refresh handler */
  onRefresh: () => void;
  
  /** Export handler */
  onExport: () => void;
  
  /** Import handler */
  onImport: () => void;
  
  /** View mode change handler */
  onViewModeChange: (mode: 'table' | 'grid' | 'list') => void;
  
  /** Current view mode */
  viewMode: 'table' | 'grid' | 'list';
  
  /** Access control */
  accessControl: ServiceListAccessControl;
  
  /** Paywall configuration */
  paywall?: PaywallConfig;
}

/**
 * Service list filter panel props
 */
export interface ServiceListFilterPanelProps {
  /** Current filters */
  filters: ServiceListFilterData;
  
  /** Filter change handler */
  onFiltersChange: (filters: ServiceListFilterData) => void;
  
  /** Clear filters handler */
  onClearFilters: () => void;
  
  /** Available filter options */
  filterOptions: {
    types: { value: DatabaseDriver; label: string }[];
    statuses: { value: ServiceStatus; label: string }[];
    users: { value: number; label: string }[];
  };
  
  /** Panel is visible */
  visible: boolean;
  
  /** Panel close handler */
  onClose: () => void;
  
  /** Apply filters handler */
  onApply: () => void;
  
  /** Reset filters handler */
  onReset: () => void;
  
  /** Enable advanced filters */
  enableAdvanced?: boolean;
  
  /** Show filter shortcuts */
  showShortcuts?: boolean;
  
  /** Custom filter components */
  customFilters?: Record<string, ComponentType<any>>;
}

// =============================================================================
// UTILITY TYPES AND CONSTANTS
// =============================================================================

/**
 * Service list sort fields
 */
export const SERVICE_LIST_SORT_FIELDS = [
  'name',
  'label',
  'type',
  'host',
  'database',
  'status',
  'is_active',
  'created_date',
  'last_modified_date',
  'last_test_date',
  'last_test_duration',
  'connection_count',
] as const;

/**
 * Service list default columns
 */
export const SERVICE_LIST_DEFAULT_COLUMNS = [
  'name',
  'type',
  'host',
  'database',
  'status',
  'actions',
] as const;

/**
 * Service list bulk actions
 */
export const SERVICE_LIST_BULK_ACTIONS = [
  'activate',
  'deactivate',
  'test-connection',
  'refresh-schema',
  'export-config',
  'delete',
  'duplicate',
  'add-tags',
  'remove-tags',
  'update-config',
] as const;

/**
 * Default pagination settings
 */
export const DEFAULT_PAGINATION: ServiceListPaginationData = {
  page: 1,
  limit: 20,
};

/**
 * Default sort settings
 */
export const DEFAULT_SORT: ServiceListSortData = {
  field: 'name',
  direction: 'asc',
};

/**
 * Default view configuration
 */
export const DEFAULT_VIEW_CONFIG: ServiceListViewConfigData = {
  visibleColumns: ['name', 'type', 'host', 'database', 'status', 'actions'],
  density: 'normal',
  showRowNumbers: false,
  showRowSelection: true,
  showColumnHeaders: true,
  enableVirtualization: false,
  virtualItemHeight: 60,
  virtualOverscan: 5,
  groupBy: 'none',
  expandedGroups: [],
  autoRefresh: false,
  refreshInterval: 30000,
};

/**
 * Type guard to check if value is a valid sort field
 */
export function isValidSortField(value: unknown): value is typeof SERVICE_LIST_SORT_FIELDS[number] {
  return typeof value === 'string' && SERVICE_LIST_SORT_FIELDS.includes(value as any);
}

/**
 * Type guard to check if value is a valid bulk action
 */
export function isValidBulkAction(value: unknown): value is typeof SERVICE_LIST_BULK_ACTIONS[number] {
  return typeof value === 'string' && SERVICE_LIST_BULK_ACTIONS.includes(value as any);
}

/**
 * Utility to create default query
 */
export function createDefaultQuery(): ServiceListQueryData {
  return {
    pagination: DEFAULT_PAGINATION,
    sort: DEFAULT_SORT,
    includeInactive: false,
    includeDeleted: false,
    includeSystemServices: true,
    includeConnectionStatus: true,
    includeLastTestResult: false,
    includeSchemaMetadata: false,
    skipCache: false,
  };
}

/**
 * Utility to validate service list query
 */
export function validateServiceListQuery(query: unknown): ServiceListQueryData | null {
  try {
    return ServiceListQuerySchema.parse(query);
  } catch {
    return null;
  }
}

/**
 * Utility to create service list store initial state
 */
export function createInitialViewState(): ServiceListViewState {
  return {
    query: createDefaultQuery(),
    selectedIds: [],
    viewConfig: DEFAULT_VIEW_CONFIG,
    showFilterPanel: false,
    showColumnConfig: false,
    showBulkActions: false,
    fullScreen: false,
    lastRefresh: null,
    autoRefresh: false,
    error: null,
    loading: false,
  };
}

/**
 * Export type utilities for external use
 */
export type ServiceListSortField = typeof SERVICE_LIST_SORT_FIELDS[number];
export type ServiceListColumnId = typeof SERVICE_LIST_DEFAULT_COLUMNS[number];
export type ServiceListBulkActionType = typeof SERVICE_LIST_BULK_ACTIONS[number];