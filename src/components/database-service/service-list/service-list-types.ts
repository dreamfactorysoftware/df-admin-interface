/**
 * Database Service List Component Types
 * 
 * TypeScript interface definitions and type exports specific to database service list
 * components. Defines type-safe contracts for service list operations, table props,
 * filter configurations, and component state management. Provides Zod schema validators
 * for service list filtering and sorting parameters.
 * 
 * @fileoverview Comprehensive types for database service list management in React/Next.js
 * @version 1.0.0
 * @since 2024-01-01
 */

import { z } from 'zod';
import { ReactNode, ComponentType, RefObject } from 'react';
import type { 
  UseQueryOptions, 
  UseMutationOptions, 
  QueryKey,
  UseQueryResult,
  UseMutationResult
} from '@tanstack/react-query';
import type { 
  VirtualizerOptions,
  Virtualizer,
  VirtualItem
} from '@tanstack/react-virtual';
import type { 
  DatabaseService,
  DatabaseDriver,
  ServiceStatus,
  ServiceTier,
  ConnectionTestResult,
  DatabaseConnectionInput,
  GenericListResponse,
  ApiErrorResponse,
  BaseComponentProps
} from '../types';

// =============================================================================
// SERVICE LIST TABLE TYPES
// =============================================================================

/**
 * Service list table component props
 * Extends BaseComponentProps with service-specific functionality
 */
export interface ServiceListTableProps extends BaseComponentProps {
  services: DatabaseService[];
  loading?: boolean;
  error?: Error | null;
  onServiceSelect?: (service: DatabaseService) => void;
  onServiceEdit?: (service: DatabaseService) => void;
  onServiceDelete?: (service: DatabaseService) => void;
  onServiceDuplicate?: (service: DatabaseService) => void;
  onServiceTest?: (service: DatabaseService) => void;
  onServiceToggle?: (service: DatabaseService, active: boolean) => void;
  onBulkActions?: (action: BulkActionType, services: DatabaseService[]) => void;
  selection?: TableSelectionConfig;
  pagination?: PaginationConfig;
  sorting?: SortingConfig;
  filtering?: FilteringConfig;
  virtualization?: VirtualizationConfig;
  paywall?: PaywallConfig;
  accessibility?: AccessibilityConfig;
}

/**
 * Service list container component props
 * Orchestrates all service list functionality
 */
export interface ServiceListContainerProps extends BaseComponentProps {
  initialFilters?: ServiceListFilters;
  initialSort?: ServiceListSort;
  pageSize?: number;
  enableVirtualization?: boolean;
  enableBulkActions?: boolean;
  enablePaywall?: boolean;
  onServiceCreated?: (service: DatabaseService) => void;
  onServiceUpdated?: (service: DatabaseService) => void;
  onServiceDeleted?: (serviceId: number) => void;
  onError?: (error: ApiErrorResponse) => void;
  refreshInterval?: number;
  autoRefresh?: boolean;
}

/**
 * Service list item component props
 * Individual service row representation
 */
export interface ServiceListItemProps extends BaseComponentProps {
  service: DatabaseService;
  index: number;
  isSelected?: boolean;
  isExpanded?: boolean;
  onSelect?: (service: DatabaseService) => void;
  onEdit?: (service: DatabaseService) => void;
  onDelete?: (service: DatabaseService) => void;
  onDuplicate?: (service: DatabaseService) => void;
  onTest?: (service: DatabaseService) => void;
  onToggle?: (service: DatabaseService, active: boolean) => void;
  onExpand?: (service: DatabaseService, expanded: boolean) => void;
  actions?: ServiceActionConfig[];
  showDetails?: boolean;
  compact?: boolean;
}

// =============================================================================
// TABLE CONFIGURATION TYPES
// =============================================================================

/**
 * Column definition for service list table
 * TanStack Table compatible column configuration
 */
export interface ServiceListColumn {
  key: keyof DatabaseService | 'actions' | 'selection';
  header: string;
  accessorKey?: keyof DatabaseService;
  cell?: (props: ServiceListCellProps) => ReactNode;
  sortable?: boolean;
  filterable?: boolean;
  searchable?: boolean;
  width?: string | number;
  minWidth?: string | number;
  maxWidth?: string | number;
  sticky?: 'left' | 'right' | false;
  align?: 'left' | 'center' | 'right';
  visible?: boolean;
  resizable?: boolean;
  priority?: number; // For responsive hiding
  className?: string;
  headerClassName?: string;
  cellClassName?: string;
}

/**
 * Cell props for custom cell renderers
 */
export interface ServiceListCellProps {
  value: any;
  row: DatabaseService;
  column: ServiceListColumn;
  index: number;
  isSelected: boolean;
}

/**
 * Table selection configuration
 */
export interface TableSelectionConfig {
  enabled: boolean;
  multiple?: boolean;
  selectedIds: Set<number>;
  onSelectionChange: (selectedIds: Set<number>) => void;
  selectableRowIds?: Set<number>;
  disabledRowIds?: Set<number>;
  onSelectAll?: (selected: boolean) => void;
  onSelectPage?: (selected: boolean) => void;
}

/**
 * Pagination configuration for service list
 */
export interface PaginationConfig {
  currentPage: number;
  pageSize: number;
  totalItems: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  onPageSizeChange: (pageSize: number) => void;
  showPageSizeSelector?: boolean;
  showPageInfo?: boolean;
  showFirstLast?: boolean;
  showPrevNext?: boolean;
  pageSizeOptions?: number[];
  maxVisiblePages?: number;
  disabled?: boolean;
}

/**
 * Sorting configuration for service list
 */
export interface SortingConfig {
  sortBy?: keyof DatabaseService;
  sortDirection?: 'asc' | 'desc';
  onSortChange: (sortBy: keyof DatabaseService, direction: 'asc' | 'desc') => void;
  multiSort?: boolean;
  sortState?: SortingState[];
  defaultSort?: ServiceListSort;
}

/**
 * Individual sorting state
 */
export interface SortingState {
  field: keyof DatabaseService;
  direction: 'asc' | 'desc';
  priority: number;
}

/**
 * Filtering configuration for service list
 */
export interface FilteringConfig {
  filters: ServiceListFilters;
  onFiltersChange: (filters: ServiceListFilters) => void;
  quickFilters?: QuickFilter[];
  advancedFilters?: AdvancedFilter[];
  searchFields?: (keyof DatabaseService)[];
  onSearchChange?: (search: string) => void;
  onQuickFilterChange?: (filterId: string, enabled: boolean) => void;
  clearable?: boolean;
  collapsible?: boolean;
  defaultExpanded?: boolean;
}

// =============================================================================
// FILTER AND SEARCH TYPES
// =============================================================================

/**
 * Service list filters interface
 * Comprehensive filtering options for database services
 */
export interface ServiceListFilters {
  search?: string;
  type?: DatabaseDriver[];
  status?: ServiceStatus[];
  tier?: ServiceTier[];
  isActive?: boolean;
  hasErrors?: boolean;
  createdDateRange?: DateRange;
  lastModifiedDateRange?: DateRange;
  tags?: string[];
  customFilters?: Record<string, any>;
}

/**
 * Service list sorting options
 */
export interface ServiceListSort {
  field: keyof DatabaseService;
  direction: 'asc' | 'desc';
}

/**
 * Date range filter
 */
export interface DateRange {
  start: Date | string;
  end: Date | string;
}

/**
 * Quick filter definition
 */
export interface QuickFilter {
  id: string;
  label: string;
  description?: string;
  icon?: ComponentType<{ className?: string }>;
  filter: Partial<ServiceListFilters>;
  count?: number;
  enabled?: boolean;
  shortcut?: string;
}

/**
 * Advanced filter definition
 */
export interface AdvancedFilter {
  id: string;
  field: keyof DatabaseService;
  operator: FilterOperator;
  label: string;
  type: FilterFieldType;
  options?: FilterOption[];
  validation?: z.ZodSchema;
  placeholder?: string;
  description?: string;
}

/**
 * Filter operator types
 */
export type FilterOperator = 
  | 'equals'
  | 'notEquals'
  | 'contains'
  | 'notContains'
  | 'startsWith'
  | 'endsWith'
  | 'in'
  | 'notIn'
  | 'greaterThan'
  | 'lessThan'
  | 'greaterThanOrEqual'
  | 'lessThanOrEqual'
  | 'between'
  | 'isEmpty'
  | 'isNotEmpty'
  | 'isNull'
  | 'isNotNull';

/**
 * Filter field types
 */
export type FilterFieldType = 
  | 'text'
  | 'select'
  | 'multiselect'
  | 'date'
  | 'daterange'
  | 'number'
  | 'boolean'
  | 'tags';

/**
 * Filter option for select filters
 */
export interface FilterOption {
  value: string | number | boolean;
  label: string;
  description?: string;
  icon?: ComponentType<{ className?: string }>;
  count?: number;
  disabled?: boolean;
}

// =============================================================================
// VIRTUALIZATION TYPES
// =============================================================================

/**
 * Virtualization configuration for large service lists
 * Optimized for 1000+ services per F-002-RQ-002 requirement
 */
export interface VirtualizationConfig {
  enabled: boolean;
  overscan?: number;
  estimateSize?: number;
  measureElement?: (element: Element) => number;
  scrollMargin?: number;
  scrollToAlignment?: 'start' | 'center' | 'end' | 'auto';
  initialOffset?: number;
  lanes?: number;
  horizontal?: boolean;
  getScrollElement?: () => Element | Window | null;
  debug?: boolean;
}

/**
 * Virtual list item props
 */
export interface VirtualListItemProps {
  virtualItem: VirtualItem;
  service: DatabaseService;
  index: number;
  measureElement?: (element: Element) => void;
}

/**
 * Virtual list ref interface
 */
export interface VirtualListRef {
  scrollToIndex: (index: number, options?: { align?: 'start' | 'center' | 'end' | 'auto' }) => void;
  scrollToOffset: (offset: number) => void;
  scrollBy: (delta: number) => void;
  getVirtualItems: () => VirtualItem[];
  getTotalSize: () => number;
  measure: () => void;
}

// =============================================================================
// ACTION AND INTERACTION TYPES
// =============================================================================

/**
 * Bulk action types for service list
 */
export type BulkActionType = 
  | 'activate'
  | 'deactivate'
  | 'delete'
  | 'duplicate'
  | 'test'
  | 'export'
  | 'tag'
  | 'move'
  | 'archive';

/**
 * Bulk action configuration
 */
export interface BulkActionConfig {
  type: BulkActionType;
  label: string;
  description?: string;
  icon?: ComponentType<{ className?: string }>;
  dangerous?: boolean;
  requiresConfirmation?: boolean;
  confirmationMessage?: string;
  disabled?: boolean;
  hidden?: boolean;
  shortcut?: string;
}

/**
 * Service action configuration
 */
export interface ServiceActionConfig {
  id: string;
  label: string;
  description?: string;
  icon?: ComponentType<{ className?: string }>;
  action: (service: DatabaseService) => void | Promise<void>;
  dangerous?: boolean;
  requiresConfirmation?: boolean;
  confirmationMessage?: string;
  disabled?: (service: DatabaseService) => boolean;
  hidden?: (service: DatabaseService) => boolean;
  shortcut?: string;
  priority?: number;
}

/**
 * Context menu item for service list
 */
export interface ContextMenuItem {
  id: string;
  label: string;
  icon?: ComponentType<{ className?: string }>;
  action: (service: DatabaseService) => void | Promise<void>;
  separator?: boolean;
  disabled?: boolean;
  dangerous?: boolean;
  shortcut?: string;
  submenu?: ContextMenuItem[];
}

// =============================================================================
// STATE MANAGEMENT TYPES
// =============================================================================

/**
 * Service list state interface
 * Zustand store state for service list management
 */
export interface ServiceListState {
  services: DatabaseService[];
  filteredServices: DatabaseService[];
  selectedServices: Set<number>;
  filters: ServiceListFilters;
  sorting: ServiceListSort;
  pagination: {
    currentPage: number;
    pageSize: number;
    totalItems: number;
  };
  virtualization: {
    enabled: boolean;
    scrollOffset: number;
    visibleRange: [number, number];
  };
  ui: {
    loading: boolean;
    error: ApiErrorResponse | null;
    refreshing: boolean;
    bulkActionInProgress: boolean;
    selectedBulkAction: BulkActionType | null;
  };
  preferences: {
    defaultPageSize: number;
    defaultSort: ServiceListSort;
    defaultFilters: ServiceListFilters;
    columnVisibility: Record<string, boolean>;
    columnOrder: string[];
    columnWidths: Record<string, number>;
    compactMode: boolean;
    autoRefresh: boolean;
    refreshInterval: number;
  };
}

/**
 * Service list actions interface
 * Zustand store actions for service list management
 */
export interface ServiceListActions {
  // Data management
  setServices: (services: DatabaseService[]) => void;
  addService: (service: DatabaseService) => void;
  updateService: (id: number, service: Partial<DatabaseService>) => void;
  removeService: (id: number) => void;
  refreshServices: () => Promise<void>;
  
  // Selection management
  setSelectedServices: (selectedIds: Set<number>) => void;
  selectService: (id: number) => void;
  deselectService: (id: number) => void;
  selectAll: () => void;
  deselectAll: () => void;
  selectFiltered: () => void;
  
  // Filtering and sorting
  setFilters: (filters: ServiceListFilters) => void;
  updateFilter: (key: keyof ServiceListFilters, value: any) => void;
  clearFilters: () => void;
  setSorting: (sorting: ServiceListSort) => void;
  
  // Pagination
  setCurrentPage: (page: number) => void;
  setPageSize: (pageSize: number) => void;
  goToPage: (page: number) => void;
  nextPage: () => void;
  previousPage: () => void;
  
  // Virtualization
  setVirtualization: (enabled: boolean) => void;
  updateScrollOffset: (offset: number) => void;
  updateVisibleRange: (range: [number, number]) => void;
  
  // UI state
  setLoading: (loading: boolean) => void;
  setError: (error: ApiErrorResponse | null) => void;
  setRefreshing: (refreshing: boolean) => void;
  setBulkActionInProgress: (inProgress: boolean) => void;
  setSelectedBulkAction: (action: BulkActionType | null) => void;
  
  // Bulk actions
  executeBulkAction: (action: BulkActionType, serviceIds: number[]) => Promise<void>;
  
  // Preferences
  updatePreferences: (preferences: Partial<ServiceListState['preferences']>) => void;
  resetPreferences: () => void;
  
  // Utility actions
  applyFiltersAndSort: () => void;
  resetState: () => void;
}

/**
 * Complete service list context type
 */
export type ServiceListContextType = ServiceListState & ServiceListActions;

// =============================================================================
// REACT QUERY INTEGRATION TYPES
// =============================================================================

/**
 * Service list query options
 */
export interface ServiceListQueryOptions extends Omit<UseQueryOptions<GenericListResponse<DatabaseService>>, 'queryKey' | 'queryFn'> {
  filters?: ServiceListFilters;
  sorting?: ServiceListSort;
  pagination?: { page: number; pageSize: number };
  refreshInterval?: number;
}

/**
 * Service list mutation options
 */
export interface ServiceListMutationOptions<TData, TVariables> 
  extends Omit<UseMutationOptions<TData, ApiErrorResponse, TVariables>, 'mutationFn'> {
  onSuccess?: (data: TData, variables: TVariables) => void;
  onError?: (error: ApiErrorResponse, variables: TVariables) => void;
  onSettled?: (data: TData | undefined, error: ApiErrorResponse | null, variables: TVariables) => void;
}

/**
 * Service list hook return type
 */
export interface UseServiceListReturn {
  // Data
  services: DatabaseService[];
  filteredServices: DatabaseService[];
  totalCount: number;
  
  // Query state
  isLoading: boolean;
  isError: boolean;
  isFetching: boolean;
  isRefetching: boolean;
  error: ApiErrorResponse | null;
  
  // Actions
  refetch: () => Promise<UseQueryResult<GenericListResponse<DatabaseService>>>;
  refresh: () => Promise<void>;
  
  // Mutations
  createService: UseMutationResult<DatabaseService, ApiErrorResponse, DatabaseConnectionInput>;
  updateService: UseMutationResult<DatabaseService, ApiErrorResponse, { id: number; data: Partial<DatabaseConnectionInput> }>;
  deleteService: UseMutationResult<void, ApiErrorResponse, number>;
  deleteServices: UseMutationResult<void, ApiErrorResponse, number[]>;
  testConnection: UseMutationResult<ConnectionTestResult, ApiErrorResponse, { id: number; config?: any }>;
  toggleService: UseMutationResult<DatabaseService, ApiErrorResponse, { id: number; active: boolean }>;
  duplicateService: UseMutationResult<DatabaseService, ApiErrorResponse, number>;
  
  // Query keys for cache management
  queryKeys: {
    list: QueryKey;
    detail: (id: number) => QueryKey;
    connectionTest: (id: number) => QueryKey;
  };
}

// =============================================================================
// PAYWALL AND ACCESS CONTROL TYPES
// =============================================================================

/**
 * Paywall configuration for service list
 */
export interface PaywallConfig {
  enabled: boolean;
  tier: ServiceTier;
  maxServices?: number;
  featureRestrictions?: FeatureRestriction[];
  upgradePrompts?: UpgradePrompt[];
  gracePeriod?: number; // Days
  onUpgradeRequired?: (restriction: FeatureRestriction) => void;
}

/**
 * Feature restriction definition
 */
export interface FeatureRestriction {
  feature: PaywallFeature;
  requiredTier: ServiceTier;
  message: string;
  learnMoreUrl?: string;
  allowTrial?: boolean;
  trialDuration?: number; // Days
}

/**
 * Paywall feature types
 */
export type PaywallFeature = 
  | 'unlimited_services'
  | 'advanced_databases'
  | 'bulk_operations'
  | 'export_services'
  | 'api_analytics'
  | 'priority_support'
  | 'custom_branding'
  | 'sso_integration';

/**
 * Upgrade prompt configuration
 */
export interface UpgradePrompt {
  id: string;
  trigger: PaywallTrigger;
  title: string;
  description: string;
  features: string[];
  ctaText: string;
  ctaUrl: string;
  dismissible?: boolean;
  frequency?: PromptFrequency;
}

/**
 * Paywall trigger types
 */
export type PaywallTrigger = 
  | 'service_limit_reached'
  | 'premium_feature_access'
  | 'bulk_action_attempt'
  | 'export_attempt'
  | 'daily_limit_reached';

/**
 * Prompt frequency options
 */
export type PromptFrequency = 
  | 'once'
  | 'daily'
  | 'weekly'
  | 'monthly'
  | 'per_session';

// =============================================================================
// ACCESSIBILITY TYPES
// =============================================================================

/**
 * Accessibility configuration for service list
 */
export interface AccessibilityConfig {
  announcements?: boolean;
  keyboardNavigation?: boolean;
  screenReaderSupport?: boolean;
  highContrast?: boolean;
  reducedMotion?: boolean;
  focusManagement?: FocusManagementConfig;
  ariaLabels?: AriaLabelsConfig;
}

/**
 * Focus management configuration
 */
export interface FocusManagementConfig {
  autoFocus?: boolean;
  focusOnLoad?: boolean;
  focusOnUpdate?: boolean;
  focusOnError?: boolean;
  trapFocus?: boolean;
  restoreFocus?: boolean;
}

/**
 * ARIA labels configuration
 */
export interface AriaLabelsConfig {
  table?: string;
  sortButton?: (column: string, direction: 'asc' | 'desc') => string;
  filterButton?: string;
  bulkActions?: string;
  pagination?: string;
  searchInput?: string;
  rowSelection?: (serviceName: string, selected: boolean) => string;
  actionButton?: (action: string, serviceName: string) => string;
}

// =============================================================================
// ZOD VALIDATION SCHEMAS
// =============================================================================

/**
 * Zod schema for service list filters
 * Real-time validation for filter forms per React/Next.js integration requirements
 */
export const ServiceListFiltersSchema = z.object({
  search: z.string()
    .max(255, 'Search term must be less than 255 characters')
    .optional(),
  
  type: z.array(z.enum([
    'mysql', 'pgsql', 'sqlite', 'mongodb', 'oracle', 'sqlsrv', 'snowflake',
    'ibmdb2', 'informix', 'sqlanywhere', 'memsql', 'salesforce_db', 'hana',
    'apache_hive', 'databricks', 'dremio'
  ])).optional(),
  
  status: z.array(z.enum([
    'active', 'inactive', 'testing', 'error', 'configuring', 'pending'
  ])).optional(),
  
  tier: z.array(z.enum(['core', 'silver', 'gold'])).optional(),
  
  isActive: z.boolean().optional(),
  
  hasErrors: z.boolean().optional(),
  
  createdDateRange: z.object({
    start: z.coerce.date(),
    end: z.coerce.date()
  }).refine(
    data => data.start <= data.end,
    { message: 'Start date must be before end date' }
  ).optional(),
  
  lastModifiedDateRange: z.object({
    start: z.coerce.date(),
    end: z.coerce.date()
  }).refine(
    data => data.start <= data.end,
    { message: 'Start date must be before end date' }
  ).optional(),
  
  tags: z.array(z.string().min(1).max(50)).optional(),
  
  customFilters: z.record(z.any()).optional()
});

/**
 * Zod schema for service list sorting
 */
export const ServiceListSortSchema = z.object({
  field: z.enum([
    'id', 'name', 'label', 'description', 'type', 'is_active',
    'created_date', 'last_modified_date', 'created_by_id', 'last_modified_by_id'
  ]),
  direction: z.enum(['asc', 'desc'])
});

/**
 * Zod schema for pagination parameters
 */
export const PaginationParamsSchema = z.object({
  page: z.number()
    .int('Page must be an integer')
    .min(1, 'Page must be at least 1')
    .max(10000, 'Page must be less than 10,000'),
  
  pageSize: z.number()
    .int('Page size must be an integer')
    .min(1, 'Page size must be at least 1')
    .max(1000, 'Page size must be less than 1,000'),
  
  offset: z.number()
    .int('Offset must be an integer')
    .min(0, 'Offset must be non-negative')
    .optional(),
  
  limit: z.number()
    .int('Limit must be an integer')
    .min(1, 'Limit must be at least 1')
    .max(1000, 'Limit must be less than 1,000')
    .optional()
});

/**
 * Zod schema for bulk action parameters
 */
export const BulkActionSchema = z.object({
  action: z.enum([
    'activate', 'deactivate', 'delete', 'duplicate', 'test', 'export', 'tag', 'move', 'archive'
  ]),
  serviceIds: z.array(z.number().int().positive())
    .min(1, 'At least one service must be selected')
    .max(100, 'Cannot perform bulk action on more than 100 services'),
  parameters: z.record(z.any()).optional()
});

/**
 * Zod schema for service list query parameters
 */
export const ServiceListQueryParamsSchema = z.object({
  filters: ServiceListFiltersSchema.optional(),
  sorting: ServiceListSortSchema.optional(),
  pagination: PaginationParamsSchema.optional(),
  include: z.array(z.string()).optional(),
  fields: z.array(z.string()).optional()
});

// =============================================================================
// INFERRED TYPES FROM ZOD SCHEMAS
// =============================================================================

/**
 * Inferred types from Zod schemas for TypeScript integration
 */
export type ServiceListFiltersInput = z.infer<typeof ServiceListFiltersSchema>;
export type ServiceListSortInput = z.infer<typeof ServiceListSortSchema>;
export type PaginationParamsInput = z.infer<typeof PaginationParamsSchema>;
export type BulkActionInput = z.infer<typeof BulkActionSchema>;
export type ServiceListQueryParamsInput = z.infer<typeof ServiceListQueryParamsSchema>;

// =============================================================================
// QUERY KEYS FOR REACT QUERY
// =============================================================================

/**
 * Query keys for service list React Query cache management
 */
export const ServiceListQueryKeys = {
  all: ['service-list'] as const,
  lists: () => [...ServiceListQueryKeys.all, 'list'] as const,
  list: (params?: ServiceListQueryParamsInput) => [...ServiceListQueryKeys.lists(), params] as const,
  filtered: (filters: ServiceListFilters) => [...ServiceListQueryKeys.lists(), 'filtered', filters] as const,
  sorted: (sort: ServiceListSort) => [...ServiceListQueryKeys.lists(), 'sorted', sort] as const,
  paginated: (pagination: PaginationParamsInput) => [...ServiceListQueryKeys.lists(), 'paginated', pagination] as const,
  count: (filters?: ServiceListFilters) => [...ServiceListQueryKeys.all, 'count', filters] as const,
  preferences: () => [...ServiceListQueryKeys.all, 'preferences'] as const,
  bulkAction: (action: BulkActionType) => [...ServiceListQueryKeys.all, 'bulk-action', action] as const,
} as const;

// =============================================================================
// EXPORTS
// =============================================================================

// Re-export commonly used types for convenience
export type {
  // Component props
  ServiceListTableProps,
  ServiceListContainerProps,
  ServiceListItemProps,
  
  // Table configuration
  ServiceListColumn,
  ServiceListCellProps,
  TableSelectionConfig,
  PaginationConfig,
  SortingConfig,
  FilteringConfig,
  
  // Filtering and sorting
  ServiceListFilters,
  ServiceListSort,
  QuickFilter,
  AdvancedFilter,
  DateRange,
  
  // Virtualization
  VirtualizationConfig,
  VirtualListItemProps,
  VirtualListRef,
  
  // Actions
  BulkActionType,
  BulkActionConfig,
  ServiceActionConfig,
  ContextMenuItem,
  
  // State management
  ServiceListState,
  ServiceListActions,
  ServiceListContextType,
  
  // React Query integration
  ServiceListQueryOptions,
  ServiceListMutationOptions,
  UseServiceListReturn,
  
  // Paywall and access control
  PaywallConfig,
  FeatureRestriction,
  PaywallFeature,
  UpgradePrompt,
  
  // Accessibility
  AccessibilityConfig,
  FocusManagementConfig,
  AriaLabelsConfig,
};

// Export validation schemas
export {
  ServiceListFiltersSchema,
  ServiceListSortSchema,
  PaginationParamsSchema,
  BulkActionSchema,
  ServiceListQueryParamsSchema,
  ServiceListQueryKeys,
};

// Export inferred types
export type {
  ServiceListFiltersInput,
  ServiceListSortInput,
  PaginationParamsInput,
  BulkActionInput,
  ServiceListQueryParamsInput,
};