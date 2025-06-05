/**
 * ManageTable Component Type Definitions
 * 
 * Comprehensive TypeScript interfaces for the ManageTable component system
 * featuring TanStack Table integration, React Query data fetching, and WCAG 2.1 AA
 * accessibility compliance. Replaces Angular Material table types with modern 
 * React 19 patterns optimized for DreamFactory's database schema management.
 * 
 * @fileoverview Type definitions for accessible, performant React data tables
 * @version 1.0.0
 */

import { type ReactNode, type HTMLAttributes, type MouseEvent, type KeyboardEvent, type ComponentPropsWithoutRef } from 'react';
import { type UseQueryResult, type QueryKey, type UseInfiniteQueryResult } from '@tanstack/react-query';
import { type ColumnDef, type Table, type Column, type Row, type Cell, type SortingState, type ColumnFiltersState, type PaginationState, type RowSelectionState, type VisibilityState, type ColumnOrderState } from '@tanstack/react-table';
import { type Virtualizer } from '@tanstack/react-virtual';
import { type UseFormRegister, type UseFormReturn, type FieldValues, type Control } from 'react-hook-form';
import { type AccessibilityProps, type ThemeProps, type ResponsiveProps, type AnimationProps, type BaseComponentProps, type LoadingState, type ValidationState } from '@/types/ui';

// =============================================================================
// API Integration Types
// =============================================================================

/**
 * Base API response structure for table data
 * Follows DreamFactory REST API conventions
 */
export interface TableApiResponse<T = unknown> {
  /** Array of data records */
  resource: T[];
  /** Metadata about the response */
  meta?: {
    /** Total number of records available */
    count?: number;
    /** Number of records in current response */
    limit?: number;
    /** Offset for pagination */
    offset?: number;
    /** Has more records available */
    has_more?: boolean;
    /** Next page token for cursor pagination */
    next_token?: string;
  };
  /** Links for pagination navigation */
  links?: {
    first?: string;
    last?: string;
    next?: string;
    prev?: string;
  };
}

/**
 * Table data fetching configuration for React Query integration
 */
export interface TableDataFetchConfig {
  /** React Query key for caching */
  queryKey: QueryKey;
  /** Query function to fetch data */
  queryFn: (params: TableQueryParams) => Promise<TableApiResponse>;
  /** Enable/disable the query */
  enabled?: boolean;
  /** Stale time for caching (default: 300 seconds for schema data) */
  staleTime?: number;
  /** Cache time for inactive queries */
  cacheTime?: number;
  /** Enable real-time updates */
  refetchOnWindowFocus?: boolean;
  /** Refetch interval for live data */
  refetchInterval?: number;
  /** Error retry configuration */
  retry?: number | boolean;
  /** Initial data to use while loading */
  initialData?: TableApiResponse;
}

/**
 * Query parameters for table data fetching
 */
export interface TableQueryParams {
  /** Current page number (1-based) */
  page?: number;
  /** Number of records per page */
  limit?: number;
  /** Offset for pagination */
  offset?: number;
  /** Sorting configuration */
  sort?: string;
  /** Sorting direction */
  order?: 'asc' | 'desc';
  /** Filter parameters */
  filter?: Record<string, unknown>;
  /** Search query string */
  search?: string;
  /** Fields to include in response */
  fields?: string[];
  /** Related data to include */
  include?: string[];
}

// =============================================================================
// Column Configuration Types
// =============================================================================

/**
 * Extended column definition with DreamFactory-specific features
 */
export interface ManageTableColumnDef<TData = unknown, TValue = unknown> extends ColumnDef<TData, TValue> {
  /** Column unique identifier */
  id: string;
  /** Human-readable column header */
  header: string | ReactNode | ((props: { column: Column<TData, TValue> }) => ReactNode);
  /** Data accessor key or function */
  accessorKey?: keyof TData | string;
  /** Custom cell renderer */
  cell?: (info: { getValue: () => TValue; row: Row<TData>; column: Column<TData, TValue>; table: Table<TData> }) => ReactNode;
  /** Enable sorting for this column */
  enableSorting?: boolean;
  /** Enable filtering for this column */
  enableColumnFilter?: boolean;
  /** Enable hiding/showing this column */
  enableHiding?: boolean;
  /** Enable resizing this column */
  enableResizing?: boolean;
  /** Column size configuration */
  size?: number;
  /** Minimum column width */
  minSize?: number;
  /** Maximum column width */
  maxSize?: number;
  /** Custom filter component */
  filterFn?: string | ((row: Row<TData>, columnId: string, filterValue: unknown) => boolean);
  /** Column metadata for tooltips and descriptions */
  meta?: {
    /** Column description for tooltips */
    description?: string;
    /** Data type for styling and validation */
    dataType?: 'text' | 'number' | 'date' | 'boolean' | 'email' | 'url' | 'phone' | 'json';
    /** Field validation rules */
    validation?: ValidationState;
    /** Column grouping for organization */
    group?: string;
    /** Is this a system/internal field */
    internal?: boolean;
    /** Required field indicator */
    required?: boolean;
    /** Primary key indicator */
    isPrimaryKey?: boolean;
    /** Foreign key relationship */
    foreignKey?: {
      table: string;
      column: string;
      displayField?: string;
    };
  };
}

/**
 * Column visibility configuration
 */
export interface ColumnVisibilityConfig {
  /** Default visible columns */
  defaultVisible: string[];
  /** Columns hidden by default */
  defaultHidden: string[];
  /** Minimum required visible columns */
  minimumVisible: string[];
  /** Columns that cannot be hidden */
  alwaysVisible: string[];
  /** User preference storage key */
  storageKey?: string;
}

/**
 * Column grouping configuration
 */
export interface ColumnGroupConfig {
  /** Group identifier */
  id: string;
  /** Group display name */
  name: string;
  /** Group description */
  description?: string;
  /** Columns in this group */
  columns: string[];
  /** Default expanded state */
  defaultExpanded?: boolean;
  /** Group color theme */
  theme?: 'primary' | 'secondary' | 'success' | 'warning' | 'error';
}

// =============================================================================
// Row Action Types
// =============================================================================

/**
 * Individual row action configuration
 */
export interface RowAction<TData = unknown> {
  /** Action unique identifier */
  id: string;
  /** Action display label */
  label: string;
  /** Action icon (Lucide React icon name or component) */
  icon?: ReactNode | string;
  /** Action handler function */
  onClick: (row: Row<TData>, event: MouseEvent<HTMLElement>) => void | Promise<void>;
  /** Show action conditionally based on row data */
  show?: (row: Row<TData>) => boolean;
  /** Disable action conditionally based on row data */
  disabled?: (row: Row<TData>) => boolean;
  /** Action variant styling */
  variant?: 'default' | 'primary' | 'secondary' | 'destructive' | 'ghost' | 'outline';
  /** Action size */
  size?: 'sm' | 'md' | 'lg';
  /** Confirmation dialog configuration */
  confirmation?: {
    title: string;
    message: string;
    confirmLabel?: string;
    cancelLabel?: string;
    variant?: 'default' | 'destructive';
  };
  /** Keyboard shortcut */
  shortcut?: string;
  /** Loading state during async operations */
  loading?: boolean;
  /** Tooltip text */
  tooltip?: string;
  /** Accessibility label */
  ariaLabel?: string;
}

/**
 * Bulk actions configuration for selected rows
 */
export interface BulkAction<TData = unknown> {
  /** Bulk action unique identifier */
  id: string;
  /** Action display label */
  label: string;
  /** Action icon */
  icon?: ReactNode | string;
  /** Bulk action handler */
  onClick: (rows: Row<TData>[], clearSelection: () => void) => void | Promise<void>;
  /** Show action conditionally based on selected rows */
  show?: (rows: Row<TData>[]) => boolean;
  /** Disable action conditionally based on selected rows */
  disabled?: (rows: Row<TData>[]) => boolean;
  /** Action variant styling */
  variant?: 'default' | 'primary' | 'secondary' | 'destructive' | 'ghost' | 'outline';
  /** Confirmation dialog for destructive actions */
  confirmation?: {
    title: string;
    message: (count: number) => string;
    confirmLabel?: string;
    cancelLabel?: string;
  };
  /** Loading state during bulk operations */
  loading?: boolean;
  /** Accessibility label */
  ariaLabel?: string;
}

/**
 * Row selection configuration
 */
export interface RowSelectionConfig<TData = unknown> {
  /** Enable row selection */
  enabled: boolean;
  /** Selection mode */
  mode: 'single' | 'multiple';
  /** Row identifier function */
  getRowId?: (row: TData) => string;
  /** Enable select all functionality */
  enableSelectAll?: boolean;
  /** Custom selection column configuration */
  selectionColumn?: {
    header?: string | ReactNode;
    size?: number;
    position?: 'start' | 'end';
  };
  /** Selection change handler */
  onSelectionChange?: (selectedRows: Row<TData>[]) => void;
  /** Maximum allowed selections */
  maxSelections?: number;
  /** Preserve selection across page changes */
  preserveSelection?: boolean;
}

// =============================================================================
// Pagination and Virtualization Types
// =============================================================================

/**
 * Pagination configuration
 */
export interface PaginationConfig {
  /** Enable pagination */
  enabled: boolean;
  /** Pagination mode */
  mode: 'client' | 'server' | 'infinite';
  /** Page size options */
  pageSizeOptions: number[];
  /** Default page size */
  defaultPageSize: number;
  /** Maximum page size allowed */
  maxPageSize?: number;
  /** Show pagination info */
  showInfo?: boolean;
  /** Show page size selector */
  showPageSizeSelector?: boolean;
  /** Show quick navigation buttons */
  showQuickNavigation?: boolean;
  /** Pagination position */
  position: 'top' | 'bottom' | 'both';
  /** Custom pagination component */
  customPagination?: ReactNode;
}

/**
 * Infinite scroll configuration for large datasets
 */
export interface InfiniteScrollConfig {
  /** Enable infinite scrolling */
  enabled: boolean;
  /** Threshold for loading next page (in pixels) */
  threshold?: number;
  /** Loading indicator component */
  loadingIndicator?: ReactNode;
  /** End of data indicator */
  endIndicator?: ReactNode;
  /** Error retry component */
  errorRetry?: ReactNode;
  /** Enable manual load more button */
  enableLoadMore?: boolean;
}

/**
 * Virtualization configuration for performance optimization
 */
export interface VirtualizationConfig {
  /** Enable virtualization */
  enabled: boolean;
  /** Estimated row height in pixels */
  estimateSize: number;
  /** Overscan count for smooth scrolling */
  overscan?: number;
  /** Enable horizontal virtualization */
  horizontal?: boolean;
  /** Custom virtualizer configuration */
  getScrollElement?: () => HTMLElement | null;
  /** Debug virtualization */
  debug?: boolean;
}

// =============================================================================
// Filtering and Sorting Types
// =============================================================================

/**
 * Column filter configuration
 */
export interface ColumnFilterConfig {
  /** Filter type */
  type: 'text' | 'select' | 'multi-select' | 'range' | 'date' | 'boolean' | 'number' | 'custom';
  /** Filter placeholder text */
  placeholder?: string;
  /** Options for select filters */
  options?: Array<{
    label: string;
    value: unknown;
    disabled?: boolean;
  }>;
  /** Custom filter component */
  component?: ReactNode;
  /** Filter debounce delay in milliseconds */
  debounceMs?: number;
  /** Default filter value */
  defaultValue?: unknown;
  /** Filter validation */
  validation?: (value: unknown) => boolean | string;
}

/**
 * Global filtering configuration
 */
export interface GlobalFilterConfig {
  /** Enable global search */
  enabled: boolean;
  /** Search placeholder text */
  placeholder?: string;
  /** Columns to include in global search */
  includeColumns?: string[];
  /** Columns to exclude from global search */
  excludeColumns?: string[];
  /** Search debounce delay */
  debounceMs?: number;
  /** Custom filter function */
  filterFn?: (row: Row<unknown>, columnId: string, filterValue: string) => boolean;
  /** Search input component customization */
  searchComponent?: ReactNode;
}

/**
 * Sorting configuration
 */
export interface SortingConfig {
  /** Enable sorting */
  enabled: boolean;
  /** Allow multiple column sorting */
  enableMultiSort?: boolean;
  /** Default sorting state */
  defaultSorting?: SortingState;
  /** Maximum number of sortable columns */
  maxSortColumns?: number;
  /** Sort modes for columns */
  sortModes?: Array<'asc' | 'desc' | false>;
  /** Custom sort functions */
  sortingFns?: Record<string, (rowA: Row<unknown>, rowB: Row<unknown>, columnId: string) => number>;
}

// =============================================================================
// State Management Types
// =============================================================================

/**
 * Table state configuration for controlled/uncontrolled mode
 */
export interface TableStateConfig<TData = unknown> {
  /** Sorting state */
  sorting?: {
    state?: SortingState;
    onStateChange?: (state: SortingState) => void;
  };
  /** Column filters state */
  columnFilters?: {
    state?: ColumnFiltersState;
    onStateChange?: (state: ColumnFiltersState) => void;
  };
  /** Global filter state */
  globalFilter?: {
    state?: string;
    onStateChange?: (state: string) => void;
  };
  /** Pagination state */
  pagination?: {
    state?: PaginationState;
    onStateChange?: (state: PaginationState) => void;
  };
  /** Row selection state */
  rowSelection?: {
    state?: RowSelectionState;
    onStateChange?: (state: RowSelectionState) => void;
  };
  /** Column visibility state */
  columnVisibility?: {
    state?: VisibilityState;
    onStateChange?: (state: VisibilityState) => void;
  };
  /** Column order state */
  columnOrder?: {
    state?: ColumnOrderState;
    onStateChange?: (state: ColumnOrderState) => void;
  };
  /** Expanded rows state */
  expanded?: {
    state?: Record<string, boolean>;
    onStateChange?: (state: Record<string, boolean>) => void;
  };
}

/**
 * Table persistence configuration
 */
export interface TablePersistenceConfig {
  /** Enable state persistence */
  enabled: boolean;
  /** Storage key for persistence */
  storageKey: string;
  /** Storage type */
  storageType: 'localStorage' | 'sessionStorage' | 'indexedDB' | 'url';
  /** States to persist */
  persistStates: Array<'sorting' | 'columnFilters' | 'pagination' | 'rowSelection' | 'columnVisibility' | 'columnOrder' | 'expanded'>;
  /** Encryption for sensitive data */
  encrypt?: boolean;
  /** Version for migration handling */
  version?: string;
}

// =============================================================================
// Theme and Styling Types
// =============================================================================

/**
 * Table theme configuration
 */
export interface TableThemeConfig extends ThemeProps {
  /** Table density */
  density?: 'compact' | 'default' | 'comfortable';
  /** Border style */
  borders?: 'none' | 'horizontal' | 'vertical' | 'all';
  /** Striped rows */
  striped?: boolean;
  /** Hover effects */
  hover?: boolean;
  /** Selection highlighting */
  selectionHighlight?: boolean;
  /** Loading overlay style */
  loadingOverlay?: 'spinner' | 'skeleton' | 'blur' | 'custom';
  /** Empty state styling */
  emptyState?: {
    icon?: ReactNode;
    title?: string;
    description?: string;
    action?: ReactNode;
  };
  /** Error state styling */
  errorState?: {
    icon?: ReactNode;
    title?: string;
    description?: string;
    retry?: ReactNode;
  };
}

/**
 * Responsive table configuration
 */
export interface ResponsiveTableConfig extends ResponsiveProps {
  /** Breakpoint configurations */
  breakpoints?: {
    mobile?: {
      hiddenColumns?: string[];
      stackedView?: boolean;
      cardView?: boolean;
    };
    tablet?: {
      hiddenColumns?: string[];
      horizontalScroll?: boolean;
    };
    desktop?: {
      visibleColumns?: string[];
      fullWidth?: boolean;
    };
  };
  /** Mobile-specific configurations */
  mobileConfig?: {
    /** Enable card view on mobile */
    cardView?: boolean;
    /** Enable stacked view on mobile */
    stackedView?: boolean;
    /** Custom mobile renderer */
    mobileRenderer?: (row: Row<unknown>) => ReactNode;
  };
}

// =============================================================================
// Form Integration Types
// =============================================================================

/**
 * Form integration for inline editing
 */
export interface TableFormConfig<TData = FieldValues> {
  /** Enable inline editing */
  enableInlineEdit?: boolean;
  /** Form control instance */
  control?: Control<TData>;
  /** Register function for form fields */
  register?: UseFormRegister<TData>;
  /** Form submission handler */
  onSubmit?: (data: TData, row: Row<TData>) => void | Promise<void>;
  /** Form validation rules */
  validationRules?: Record<string, unknown>;
  /** Edit mode */
  editMode?: 'inline' | 'modal' | 'drawer';
  /** Custom form components */
  formComponents?: Record<string, ReactNode>;
}

// =============================================================================
// Main Component Props
// =============================================================================

/**
 * Core ManageTable component props
 */
export interface ManageTableProps<TData = unknown> extends 
  BaseComponentProps<HTMLDivElement>,
  AccessibilityProps,
  ThemeProps,
  ResponsiveProps,
  AnimationProps {
  
  // Data Configuration
  /** Table data - can be static data or React Query result */
  data?: TData[] | UseQueryResult<TableApiResponse<TData>> | UseInfiniteQueryResult<TableApiResponse<TData>>;
  /** Column definitions */
  columns: ManageTableColumnDef<TData>[];
  /** Data fetching configuration for React Query */
  dataFetch?: TableDataFetchConfig;
  /** Loading state override */
  loading?: boolean;
  /** Error state override */
  error?: Error | null;
  /** Empty state configuration */
  emptyState?: {
    title?: string;
    description?: string;
    icon?: ReactNode;
    action?: ReactNode;
  };

  // Features Configuration
  /** Pagination configuration */
  pagination?: PaginationConfig;
  /** Infinite scroll configuration */
  infiniteScroll?: InfiniteScrollConfig;
  /** Virtualization configuration */
  virtualization?: VirtualizationConfig;
  /** Sorting configuration */
  sorting?: SortingConfig;
  /** Global filter configuration */
  globalFilter?: GlobalFilterConfig;
  /** Column filter configurations */
  columnFilters?: Record<string, ColumnFilterConfig>;
  /** Row selection configuration */
  rowSelection?: RowSelectionConfig<TData>;
  /** Column visibility configuration */
  columnVisibility?: ColumnVisibilityConfig;
  /** Column grouping configuration */
  columnGroups?: ColumnGroupConfig[];

  // Actions Configuration
  /** Individual row actions */
  rowActions?: RowAction<TData>[];
  /** Bulk actions for selected rows */
  bulkActions?: BulkAction<TData>[];
  /** Table-level actions */
  tableActions?: Array<{
    id: string;
    label: string;
    icon?: ReactNode;
    onClick: () => void | Promise<void>;
    variant?: 'default' | 'primary' | 'secondary' | 'destructive';
    loading?: boolean;
  }>;

  // State Management
  /** Table state configuration */
  state?: TableStateConfig<TData>;
  /** State persistence configuration */
  persistence?: TablePersistenceConfig;

  // Styling and Theming
  /** Theme configuration */
  theme?: TableThemeConfig;
  /** Responsive configuration */
  responsive?: ResponsiveTableConfig;

  // Form Integration
  /** Form integration configuration */
  form?: TableFormConfig<TData>;

  // Event Handlers
  /** Row click handler */
  onRowClick?: (row: Row<TData>, event: MouseEvent<HTMLTableRowElement>) => void;
  /** Row double click handler */
  onRowDoubleClick?: (row: Row<TData>, event: MouseEvent<HTMLTableRowElement>) => void;
  /** Cell click handler */
  onCellClick?: (cell: Cell<TData, unknown>, event: MouseEvent<HTMLTableCellElement>) => void;
  /** Table state change handler */
  onStateChange?: (state: Partial<TableStateConfig<TData>>) => void;

  // Accessibility
  /** Table caption for screen readers */
  caption?: string;
  /** Table summary for complex tables */
  summary?: string;
  /** ARIA label override */
  'aria-label'?: string;
  /** ARIA labelledby reference */
  'aria-labelledby'?: string;
  /** ARIA describedby reference */
  'aria-describedby'?: string;

  // Performance
  /** Enable performance monitoring */
  enablePerformanceMonitoring?: boolean;
  /** Row height optimization */
  getRowHeight?: (index: number) => number;
  /** Memory optimization for large datasets */
  memoryOptimization?: {
    /** Maximum rows to keep in memory */
    maxRowsInMemory?: number;
    /** Cleanup interval in milliseconds */
    cleanupInterval?: number;
  };

  // Testing and Development
  /** Test ID for automated testing */
  'data-testid'?: string;
  /** Debug mode for development */
  debug?: boolean;
}

// =============================================================================
// Utility Types
// =============================================================================

/**
 * Table instance type for ref access
 */
export interface ManageTableRef<TData = unknown> {
  /** TanStack Table instance */
  table: Table<TData>;
  /** Virtualizer instance (if enabled) */
  virtualizer?: Virtualizer<HTMLDivElement, Element>;
  /** Export data function */
  exportData: (format: 'csv' | 'json' | 'xlsx') => void;
  /** Refresh data function */
  refreshData: () => void;
  /** Clear all filters */
  clearFilters: () => void;
  /** Clear all sorting */
  clearSorting: () => void;
  /** Clear selection */
  clearSelection: () => void;
  /** Reset table state */
  resetState: () => void;
  /** Get current table state */
  getState: () => TableStateConfig<TData>;
  /** Set table state */
  setState: (state: Partial<TableStateConfig<TData>>) => void;
}

/**
 * Table context type for provider pattern
 */
export interface ManageTableContext<TData = unknown> {
  /** Table instance */
  table: Table<TData>;
  /** Theme configuration */
  theme: TableThemeConfig;
  /** Loading state */
  isLoading: boolean;
  /** Error state */
  error: Error | null;
  /** Selected rows */
  selectedRows: Row<TData>[];
  /** Actions configuration */
  actions: {
    rowActions: RowAction<TData>[];
    bulkActions: BulkAction<TData>[];
  };
  /** Event handlers */
  handlers: {
    onRowClick?: (row: Row<TData>, event: MouseEvent<HTMLTableRowElement>) => void;
    onCellClick?: (cell: Cell<TData, unknown>, event: MouseEvent<HTMLTableCellElement>) => void;
  };
}

/**
 * Export configuration for table data
 */
export interface TableExportConfig {
  /** Export formats */
  formats: Array<'csv' | 'json' | 'xlsx' | 'pdf'>;
  /** Include headers */
  includeHeaders?: boolean;
  /** Include selected rows only */
  selectedOnly?: boolean;
  /** Custom filename */
  filename?: string;
  /** Columns to include */
  includeColumns?: string[];
  /** Columns to exclude */
  excludeColumns?: string[];
  /** Custom export function */
  customExport?: (data: unknown[], format: string) => void;
}

/**
 * Table analytics and monitoring
 */
export interface TableAnalytics {
  /** Performance metrics */
  performance: {
    renderTime: number;
    dataFetchTime: number;
    totalRows: number;
    visibleRows: number;
  };
  /** User interaction tracking */
  interactions: {
    sortingEvents: number;
    filteringEvents: number;
    selectionEvents: number;
    exportEvents: number;
  };
  /** Error tracking */
  errors: Array<{
    timestamp: Date;
    error: Error;
    context: string;
  }>;
}

// =============================================================================
// Hook Types
// =============================================================================

/**
 * useManageTable hook return type
 */
export interface UseManageTableReturn<TData = unknown> {
  /** TanStack Table instance */
  table: Table<TData>;
  /** Loading state */
  isLoading: boolean;
  /** Error state */
  error: Error | null;
  /** Selected rows */
  selectedRows: Row<TData>[];
  /** Table utilities */
  utils: {
    exportData: (config: TableExportConfig) => void;
    refreshData: () => void;
    clearFilters: () => void;
    clearSorting: () => void;
    clearSelection: () => void;
    resetState: () => void;
  };
  /** Analytics data */
  analytics: TableAnalytics;
}

/**
 * Table state hook options
 */
export interface UseTableStateOptions<TData = unknown> {
  /** Initial state */
  initialState?: Partial<TableStateConfig<TData>>;
  /** Persistence configuration */
  persistence?: TablePersistenceConfig;
  /** State change callback */
  onStateChange?: (state: TableStateConfig<TData>) => void;
}