/**
 * TypeScript type definitions for the manage-table component system.
 * 
 * Provides comprehensive type-safe interfaces for TanStack Table integration,
 * React Hook Form compatibility, TanStack React Query data fetching,
 * accessibility compliance (WCAG 2.1 AA), and Tailwind CSS theming.
 * 
 * Supports enterprise-grade table functionality for DreamFactory Admin Interface
 * including database schema management, user administration, API documentation,
 * and system configuration with React 19 compatibility.
 * 
 * @fileoverview Manage table component type definitions
 * @version 1.0.0
 * @since React 19.0.0 / Next.js 15.1+ / TanStack Table v8
 */

import { ReactNode, ReactElement, ComponentType, Key, CSSProperties } from 'react';
import { 
  BaseComponent, 
  ComponentVariant, 
  ComponentSize, 
  ComponentState,
  FormFieldComponent,
  SelectOption,
  ButtonComponent,
  LoadingState,
  DataState,
  ResponsiveValue,
  ComponentVariantConfig
} from '@/types/ui';
import { 
  ApiResponse, 
  ApiListResponse, 
  PaginationMeta, 
  ApiRequestOptions,
  HttpMethod
} from '@/types/api';

// ============================================================================
// TANSTACK TABLE INTEGRATION TYPES
// ============================================================================

/**
 * TanStack Table column definition with enhanced React 19 type safety
 * Supports custom cell renderers, sorting, filtering, and accessibility
 */
export interface TableColumnDef<TData = any, TValue = any> {
  /** Unique column identifier */
  id: string;
  
  /** Data accessor key or function */
  accessorKey?: keyof TData;
  accessorFn?: (row: TData) => TValue;
  
  /** Column header content */
  header: string | ((props: TableHeaderProps<TData>) => ReactNode);
  
  /** Cell renderer function */
  cell?: (props: TableCellProps<TData, TValue>) => ReactNode;
  
  /** Footer content */
  footer?: string | ((props: TableFooterProps<TData>) => ReactNode);
  
  /** Column metadata */
  meta?: TableColumnMeta;
  
  /** Column sizing configuration */
  size?: number;
  minSize?: number;
  maxSize?: number;
  
  /** Enable/disable features */
  enableSorting?: boolean;
  enableColumnFilter?: boolean;
  enableGlobalFilter?: boolean;
  enableGrouping?: boolean;
  enableHiding?: boolean;
  enablePinning?: boolean;
  enableResizing?: boolean;
  
  /** Sort configuration */
  sortingFn?: TableSortingFn<TData>;
  sortDescFirst?: boolean;
  invertSorting?: boolean;
  
  /** Filter configuration */
  filterFn?: TableFilterFn<TData>;
  
  /** Grouping configuration */
  getGroupingValue?: (row: TData) => any;
  aggregationFn?: TableAggregationFn<TData>;
  
  /** Accessibility configuration */
  'aria-label'?: string;
  'aria-description'?: string;
}

/**
 * Column metadata for additional configuration
 */
export interface TableColumnMeta {
  /** Display name for column toggles */
  displayName?: string;
  
  /** Column description for tooltips */
  description?: string;
  
  /** Data type for filtering and formatting */
  dataType?: TableDataType;
  
  /** Format configuration */
  format?: TableCellFormat;
  
  /** Validation configuration */
  validation?: TableCellValidation;
  
  /** Styling configuration */
  className?: string;
  style?: CSSProperties;
  
  /** Responsive configuration */
  responsive?: ResponsiveTableColumn;
  
  /** Export configuration */
  exportable?: boolean;
  exportFormat?: (value: any) => string;
}

/**
 * Data types supported by table columns
 */
export type TableDataType = 
  | 'string'
  | 'number'
  | 'boolean'
  | 'date'
  | 'datetime'
  | 'time'
  | 'email'
  | 'url'
  | 'json'
  | 'array'
  | 'object'
  | 'enum'
  | 'currency'
  | 'percentage';

/**
 * Cell formatting configuration
 */
export interface TableCellFormat {
  type: TableDataType;
  options?: {
    /** Date/time formatting */
    dateFormat?: string;
    timezone?: string;
    
    /** Number formatting */
    decimals?: number;
    currency?: string;
    locale?: string;
    
    /** String formatting */
    maxLength?: number;
    truncate?: boolean;
    
    /** Boolean formatting */
    truthyValue?: string;
    falsyValue?: string;
    
    /** Array/object formatting */
    separator?: string;
    preview?: boolean;
  };
}

/**
 * Cell validation configuration
 */
export interface TableCellValidation {
  required?: boolean;
  pattern?: RegExp;
  min?: number;
  max?: number;
  custom?: (value: any) => boolean | string;
}

/**
 * Responsive column configuration
 */
export interface ResponsiveTableColumn {
  hideBelow?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  showOnly?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  priority?: number; // Higher priority shown first on small screens
}

// ============================================================================
// TABLE COMPONENT PROPS
// ============================================================================

/**
 * Main table component props with comprehensive configuration
 * Integrates TanStack Table with React Query and accessibility features
 */
export interface ManageTableProps<TData = any> extends BaseComponent {
  /** Table data */
  data: TData[];
  
  /** Column definitions */
  columns: TableColumnDef<TData>[];
  
  /** Loading state */
  loading?: boolean;
  
  /** Error state */
  error?: string | null;
  
  /** Empty state configuration */
  emptyState?: TableEmptyState;
  
  /** Pagination configuration */
  pagination?: TablePagination;
  
  /** Sorting configuration */
  sorting?: TableSorting<TData>;
  
  /** Filtering configuration */
  filtering?: TableFiltering<TData>;
  
  /** Row selection configuration */
  selection?: TableSelection<TData>;
  
  /** Row actions configuration */
  actions?: TableActions<TData>;
  
  /** Bulk operations configuration */
  bulkActions?: TableBulkActions<TData>;
  
  /** Table layout and styling */
  layout?: TableLayout;
  
  /** Export functionality */
  export?: TableExport<TData>;
  
  /** Accessibility configuration */
  accessibility?: TableAccessibility;
  
  /** Performance optimization */
  virtualization?: TableVirtualization;
  
  /** Event handlers */
  onRowClick?: (row: TData, event: React.MouseEvent) => void;
  onRowDoubleClick?: (row: TData, event: React.MouseEvent) => void;
  onRowSelect?: (selectedRows: TData[]) => void;
  onColumnSort?: (columnId: string, direction: 'asc' | 'desc') => void;
  onColumnFilter?: (columnId: string, value: any) => void;
  onPageChange?: (page: number) => void;
  onPageSizeChange?: (pageSize: number) => void;
  
  /** React Query integration */
  queryKey?: string[];
  queryOptions?: TableQueryOptions;
  
  /** Form integration */
  formIntegration?: TableFormIntegration;
}

/**
 * Empty state configuration
 */
export interface TableEmptyState {
  /** Empty state content */
  title: string;
  description?: string;
  icon?: ComponentType<{ className?: string }>;
  action?: {
    label: string;
    handler: () => void;
    variant?: ComponentVariant;
  };
  
  /** Custom empty state component */
  component?: ComponentType<{ className?: string }>;
}

/**
 * Pagination configuration with accessibility
 */
export interface TablePagination {
  /** Current page (0-based) */
  pageIndex: number;
  
  /** Items per page */
  pageSize: number;
  
  /** Total number of items */
  totalItems?: number;
  
  /** Total number of pages */
  totalPages?: number;
  
  /** Page size options */
  pageSizeOptions?: number[];
  
  /** Show page size selector */
  showPageSizeSelector?: boolean;
  
  /** Show page info */
  showPageInfo?: boolean;
  
  /** Show first/last buttons */
  showFirstLast?: boolean;
  
  /** Server-side pagination */
  serverSide?: boolean;
  
  /** Event handlers */
  onPageChange: (page: number) => void;
  onPageSizeChange?: (pageSize: number) => void;
  
  /** Accessibility labels */
  labels?: {
    page?: (page: number) => string;
    pageSize?: string;
    totalItems?: (total: number) => string;
    previous?: string;
    next?: string;
    first?: string;
    last?: string;
  };
}

/**
 * Sorting configuration
 */
export interface TableSorting<TData = any> {
  /** Current sort state */
  state: TableSortState[];
  
  /** Enable multi-column sorting */
  multiSort?: boolean;
  
  /** Sort state change handler */
  onSortingChange: (sorting: TableSortState[]) => void;
  
  /** Server-side sorting */
  serverSide?: boolean;
  
  /** Default sort state */
  defaultSort?: TableSortState[];
  
  /** Custom sorting functions */
  sortingFns?: Record<string, TableSortingFn<TData>>;
}

/**
 * Sort state definition
 */
export interface TableSortState {
  id: string;
  desc: boolean;
}

/**
 * Filtering configuration with React Hook Form integration
 */
export interface TableFiltering<TData = any> {
  /** Global filter value */
  globalFilter?: string;
  
  /** Column-specific filters */
  columnFilters?: TableColumnFilter[];
  
  /** Filter change handlers */
  onGlobalFilterChange?: (value: string) => void;
  onColumnFiltersChange?: (filters: TableColumnFilter[]) => void;
  
  /** Server-side filtering */
  serverSide?: boolean;
  
  /** Filter UI configuration */
  ui?: {
    /** Show global search */
    showGlobalSearch?: boolean;
    
    /** Global search placeholder */
    globalSearchPlaceholder?: string;
    
    /** Show column filters */
    showColumnFilters?: boolean;
    
    /** Filter placement */
    filterPlacement?: 'header' | 'toolbar' | 'sidebar';
    
    /** Advanced filters */
    advancedFilters?: boolean;
  };
  
  /** Custom filter functions */
  filterFns?: Record<string, TableFilterFn<TData>>;
  
  /** React Hook Form integration */
  formIntegration?: {
    control?: any;
    register?: any;
    setValue?: any;
    watch?: any;
  };
}

/**
 * Column filter definition
 */
export interface TableColumnFilter {
  id: string;
  value: any;
  operator?: TableFilterOperator;
}

/**
 * Filter operators
 */
export type TableFilterOperator = 
  | 'equals'
  | 'notEquals'
  | 'contains'
  | 'notContains'
  | 'startsWith'
  | 'endsWith'
  | 'greaterThan'
  | 'lessThan'
  | 'greaterThanOrEqual'
  | 'lessThanOrEqual'
  | 'between'
  | 'in'
  | 'notIn'
  | 'isEmpty'
  | 'isNotEmpty'
  | 'isNull'
  | 'isNotNull';

/**
 * Row selection configuration
 */
export interface TableSelection<TData = any> {
  /** Selection mode */
  mode: 'single' | 'multiple' | 'none';
  
  /** Selected row IDs */
  selectedRowIds: Set<string>;
  
  /** Selection change handler */
  onSelectionChange: (selectedRowIds: Set<string>) => void;
  
  /** Row ID accessor */
  getRowId?: (row: TData) => string;
  
  /** Enable row selection */
  enableRowSelection?: boolean | ((row: TData) => boolean);
  
  /** Enable select all */
  enableSelectAll?: boolean;
  
  /** Selection persistence */
  persistSelection?: boolean;
  
  /** Accessibility configuration */
  accessibility?: {
    selectRowLabel?: (row: TData) => string;
    selectAllLabel?: string;
    selectedCountLabel?: (count: number) => string;
  };
}

/**
 * Row actions configuration
 */
export interface TableActions<TData = any> {
  /** Action items */
  items: TableActionItem<TData>[];
  
  /** Action trigger */
  trigger?: 'click' | 'hover' | 'menu';
  
  /** Action placement */
  placement?: 'start' | 'end' | 'dropdown';
  
  /** Sticky actions column */
  sticky?: boolean;
  
  /** Action column width */
  width?: number;
  
  /** Accessibility label */
  label?: string;
}

/**
 * Individual action item
 */
export interface TableActionItem<TData = any> {
  /** Action identifier */
  id: string;
  
  /** Action label */
  label: string;
  
  /** Action icon */
  icon?: ComponentType<{ className?: string }>;
  
  /** Action variant */
  variant?: ComponentVariant;
  
  /** Action handler */
  handler: (row: TData) => void | Promise<void>;
  
  /** Visibility condition */
  visible?: boolean | ((row: TData) => boolean);
  
  /** Disabled condition */
  disabled?: boolean | ((row: TData) => boolean);
  
  /** Confirmation dialog */
  confirmation?: {
    title: string;
    message: string;
    confirmLabel?: string;
    cancelLabel?: string;
  };
  
  /** Loading state */
  loading?: boolean | ((row: TData) => boolean);
  
  /** Accessibility */
  'aria-label'?: string | ((row: TData) => string);
}

/**
 * Bulk actions configuration
 */
export interface TableBulkActions<TData = any> {
  /** Bulk action items */
  items: TableBulkActionItem<TData>[];
  
  /** Toolbar placement */
  placement?: 'top' | 'bottom' | 'both';
  
  /** Selection threshold */
  threshold?: number;
  
  /** Hide when no selection */
  hideWhenEmpty?: boolean;
}

/**
 * Individual bulk action item
 */
export interface TableBulkActionItem<TData = any> {
  /** Action identifier */
  id: string;
  
  /** Action label */
  label: string;
  
  /** Action icon */
  icon?: ComponentType<{ className?: string }>;
  
  /** Action variant */
  variant?: ComponentVariant;
  
  /** Action handler */
  handler: (selectedRows: TData[]) => void | Promise<void>;
  
  /** Visibility condition */
  visible?: boolean | ((selectedRows: TData[]) => boolean);
  
  /** Disabled condition */
  disabled?: boolean | ((selectedRows: TData[]) => boolean);
  
  /** Confirmation dialog */
  confirmation?: {
    title: string;
    message: (count: number) => string;
    confirmLabel?: string;
    cancelLabel?: string;
  };
  
  /** Loading state */
  loading?: boolean;
}

// ============================================================================
// TABLE LAYOUT AND STYLING
// ============================================================================

/**
 * Table layout configuration
 */
export interface TableLayout {
  /** Table variant */
  variant?: 'default' | 'striped' | 'bordered' | 'minimal' | 'card';
  
  /** Table size */
  size?: ComponentSize;
  
  /** Table density */
  density?: 'compact' | 'normal' | 'comfortable';
  
  /** Sticky header */
  stickyHeader?: boolean;
  
  /** Sticky columns */
  stickyColumns?: {
    left?: number;
    right?: number;
  };
  
  /** Fixed height */
  height?: string | number;
  
  /** Maximum height */
  maxHeight?: string | number;
  
  /** Responsive behavior */
  responsive?: TableResponsive;
  
  /** Custom styling */
  className?: string;
  style?: CSSProperties;
  
  /** Theme integration */
  theme?: TableTheme;
}

/**
 * Responsive table configuration
 */
export interface TableResponsive {
  /** Enable responsive behavior */
  enabled?: boolean;
  
  /** Breakpoint for stacking */
  stackAt?: 'xs' | 'sm' | 'md' | 'lg';
  
  /** Horizontal scroll */
  horizontalScroll?: boolean;
  
  /** Column priorities */
  columnPriorities?: Record<string, number>;
  
  /** Mobile card layout */
  cardLayout?: {
    enabled?: boolean;
    template?: ComponentType<{ row: any; columns: TableColumnDef[] }>;
  };
}

/**
 * Table theme configuration
 */
export interface TableTheme {
  /** Color scheme */
  colors?: {
    header?: string;
    row?: string;
    alternateRow?: string;
    border?: string;
    selected?: string;
    hover?: string;
  };
  
  /** Typography */
  typography?: {
    header?: string;
    cell?: string;
    caption?: string;
  };
  
  /** Spacing */
  spacing?: {
    cell?: string;
    row?: string;
  };
  
  /** Borders */
  borders?: {
    width?: string;
    style?: string;
    radius?: string;
  };
}

// ============================================================================
// EXPORT FUNCTIONALITY
// ============================================================================

/**
 * Table export configuration
 */
export interface TableExport<TData = any> {
  /** Enable export */
  enabled?: boolean;
  
  /** Export formats */
  formats?: TableExportFormat[];
  
  /** Export options */
  options?: TableExportOptions<TData>;
  
  /** Custom export handlers */
  customHandlers?: Record<string, (data: TData[], columns: TableColumnDef<TData>[]) => void>;
}

/**
 * Available export formats
 */
export type TableExportFormat = 'csv' | 'excel' | 'pdf' | 'json' | 'xml';

/**
 * Export options
 */
export interface TableExportOptions<TData = any> {
  /** Filename template */
  filename?: string | ((format: TableExportFormat) => string);
  
  /** Include column headers */
  includeHeaders?: boolean;
  
  /** Export selected rows only */
  selectedOnly?: boolean;
  
  /** Column selection */
  columns?: string[] | 'all' | 'visible';
  
  /** Data transformation */
  transform?: (data: TData[]) => any[];
  
  /** Format-specific options */
  csv?: {
    delimiter?: string;
    quote?: string;
    escape?: string;
  };
  
  excel?: {
    sheetName?: string;
    author?: string;
  };
  
  pdf?: {
    orientation?: 'portrait' | 'landscape';
    pageSize?: string;
    title?: string;
  };
}

// ============================================================================
// ACCESSIBILITY CONFIGURATION
// ============================================================================

/**
 * Comprehensive accessibility configuration for WCAG 2.1 AA compliance
 */
export interface TableAccessibility {
  /** Table caption */
  caption?: string;
  
  /** Table summary */
  summary?: string;
  
  /** Screen reader announcements */
  announcements?: {
    sortChange?: (column: string, direction: 'ascending' | 'descending') => string;
    filterChange?: (column: string, value: any) => string;
    selectionChange?: (count: number, total: number) => string;
    pageChange?: (page: number, total: number) => string;
  };
  
  /** Keyboard navigation */
  keyboard?: {
    enabled?: boolean;
    rowNavigation?: boolean;
    cellNavigation?: boolean;
    shortcuts?: Record<string, () => void>;
  };
  
  /** Focus management */
  focus?: {
    skipLink?: string;
    focusOnSort?: boolean;
    focusOnFilter?: boolean;
    initialFocus?: string;
  };
  
  /** ARIA labels */
  labels?: {
    table?: string;
    sort?: (column: string) => string;
    filter?: (column: string) => string;
    select?: (row: any) => string;
    selectAll?: string;
    actions?: (row: any) => string;
  };
  
  /** Live regions */
  liveRegions?: {
    enabled?: boolean;
    polite?: boolean;
    atomic?: boolean;
  };
}

// ============================================================================
// VIRTUALIZATION AND PERFORMANCE
// ============================================================================

/**
 * Table virtualization for large datasets
 */
export interface TableVirtualization {
  /** Enable virtualization */
  enabled?: boolean;
  
  /** Estimated row height */
  estimatedRowHeight?: number;
  
  /** Overscan count */
  overscan?: number;
  
  /** Virtualization strategy */
  strategy?: 'fixed' | 'dynamic' | 'variable';
  
  /** Scrolling configuration */
  scrolling?: {
    horizontal?: boolean;
    vertical?: boolean;
    smooth?: boolean;
  };
  
  /** Performance thresholds */
  thresholds?: {
    enableAt?: number;
    disableAt?: number;
  };
}

// ============================================================================
// REACT QUERY INTEGRATION
// ============================================================================

/**
 * React Query integration options
 */
export interface TableQueryOptions {
  /** Query key factory */
  keyFactory?: (params: TableQueryParams) => string[];
  
  /** Cache time */
  cacheTime?: number;
  
  /** Stale time */
  staleTime?: number;
  
  /** Refetch intervals */
  refetchInterval?: number;
  
  /** Background refetch */
  refetchOnWindowFocus?: boolean;
  refetchOnReconnect?: boolean;
  
  /** Optimistic updates */
  optimisticUpdates?: boolean;
  
  /** Error handling */
  errorHandler?: (error: any) => void;
  
  /** Success handler */
  successHandler?: (data: any) => void;
  
  /** Loading states */
  suspense?: boolean;
  
  /** Retry configuration */
  retry?: boolean | number | ((failureCount: number, error: any) => boolean);
}

/**
 * Query parameters for table data fetching
 */
export interface TableQueryParams {
  /** Pagination */
  page?: number;
  pageSize?: number;
  
  /** Sorting */
  sort?: TableSortState[];
  
  /** Filtering */
  filters?: TableColumnFilter[];
  globalFilter?: string;
  
  /** Search */
  search?: string;
  
  /** Additional parameters */
  [key: string]: any;
}

// ============================================================================
// FORM INTEGRATION
// ============================================================================

/**
 * React Hook Form integration for table configuration
 */
export interface TableFormIntegration {
  /** Form control */
  control?: any;
  
  /** Registration function */
  register?: any;
  
  /** Set value function */
  setValue?: any;
  
  /** Watch function */
  watch?: any;
  
  /** Form state */
  formState?: any;
  
  /** Field configuration */
  fields?: {
    /** Page size field */
    pageSize?: string;
    
    /** Sort field */
    sort?: string;
    
    /** Filter fields */
    filters?: Record<string, string>;
    
    /** Global search field */
    globalSearch?: string;
  };
  
  /** Validation schemas */
  validation?: {
    pageSize?: any; // Zod schema
    sort?: any; // Zod schema
    filters?: any; // Zod schema
  };
}

// ============================================================================
// FUNCTION TYPE DEFINITIONS
// ============================================================================

/**
 * Table sorting function
 */
export type TableSortingFn<TData = any> = (
  rowA: TData,
  rowB: TData,
  columnId: string
) => number;

/**
 * Table filter function
 */
export type TableFilterFn<TData = any> = (
  row: TData,
  columnId: string,
  value: any,
  addMeta: (meta: any) => void
) => boolean;

/**
 * Table aggregation function
 */
export type TableAggregationFn<TData = any> = (
  getLeafValues: () => any[],
  getChildRows: () => TData[]
) => any;

// ============================================================================
// COMPONENT PROP TYPES
// ============================================================================

/**
 * Table header component props
 */
export interface TableHeaderProps<TData = any> {
  column: TableColumnDef<TData>;
  header: any; // TanStack header object
  table: any; // TanStack table instance
}

/**
 * Table cell component props
 */
export interface TableCellProps<TData = any, TValue = any> {
  getValue: () => TValue;
  row: any; // TanStack row object
  column: TableColumnDef<TData>;
  cell: any; // TanStack cell object
  table: any; // TanStack table instance
}

/**
 * Table footer component props
 */
export interface TableFooterProps<TData = any> {
  column: TableColumnDef<TData>;
  header: any; // TanStack header object
  table: any; // TanStack table instance
}

// ============================================================================
// SPECIALIZED TABLE TYPES FOR DREAMFACTORY USE CASES
// ============================================================================

/**
 * Database schema table configuration
 */
export interface DatabaseSchemaTableProps extends Omit<ManageTableProps, 'data' | 'columns'> {
  /** Database service ID */
  serviceId: string;
  
  /** Schema name */
  schemaName?: string;
  
  /** Table type filter */
  tableTypes?: ('table' | 'view' | 'procedure')[];
  
  /** Enhanced schema data */
  data: DatabaseTableInfo[];
  
  /** Schema-specific columns */
  columns: TableColumnDef<DatabaseTableInfo>[];
  
  /** Schema actions */
  schemaActions?: {
    viewSchema?: (table: DatabaseTableInfo) => void;
    generateAPI?: (table: DatabaseTableInfo) => void;
    editTable?: (table: DatabaseTableInfo) => void;
    dropTable?: (table: DatabaseTableInfo) => void;
  };
}

/**
 * Database table information
 */
export interface DatabaseTableInfo {
  id: string;
  name: string;
  type: 'table' | 'view' | 'procedure';
  schema?: string;
  description?: string;
  rowCount?: number;
  columns?: DatabaseColumnInfo[];
  indexes?: DatabaseIndexInfo[];
  relationships?: DatabaseRelationshipInfo[];
  permissions?: string[];
  createdAt?: string;
  updatedAt?: string;
}

/**
 * Database column information
 */
export interface DatabaseColumnInfo {
  name: string;
  type: string;
  nullable: boolean;
  primaryKey: boolean;
  foreignKey?: {
    table: string;
    column: string;
  };
  defaultValue?: any;
  autoIncrement?: boolean;
  length?: number;
  precision?: number;
  scale?: number;
}

/**
 * Database index information
 */
export interface DatabaseIndexInfo {
  name: string;
  columns: string[];
  unique: boolean;
  type: string;
}

/**
 * Database relationship information
 */
export interface DatabaseRelationshipInfo {
  type: 'one-to-one' | 'one-to-many' | 'many-to-many';
  localColumn: string;
  foreignTable: string;
  foreignColumn: string;
  name?: string;
}

/**
 * User management table configuration
 */
export interface UserManagementTableProps extends Omit<ManageTableProps, 'data' | 'columns'> {
  /** User data */
  data: UserInfo[];
  
  /** User-specific columns */
  columns: TableColumnDef<UserInfo>[];
  
  /** User actions */
  userActions?: {
    editUser?: (user: UserInfo) => void;
    deleteUser?: (user: UserInfo) => void;
    resetPassword?: (user: UserInfo) => void;
    toggleStatus?: (user: UserInfo) => void;
    viewProfile?: (user: UserInfo) => void;
  };
  
  /** Role management */
  roleManagement?: {
    availableRoles: RoleInfo[];
    assignRole?: (user: UserInfo, role: RoleInfo) => void;
    removeRole?: (user: UserInfo, role: RoleInfo) => void;
  };
}

/**
 * User information
 */
export interface UserInfo {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  displayName?: string;
  status: 'active' | 'inactive' | 'suspended';
  roles: RoleInfo[];
  lastLogin?: string;
  createdAt: string;
  updatedAt?: string;
  permissions?: string[];
  avatar?: string;
}

/**
 * Role information
 */
export interface RoleInfo {
  id: string;
  name: string;
  description?: string;
  permissions: string[];
  isDefault?: boolean;
  isSystemRole?: boolean;
}

/**
 * API documentation table configuration
 */
export interface APIDocumentationTableProps extends Omit<ManageTableProps, 'data' | 'columns'> {
  /** API endpoint data */
  data: APIEndpointInfo[];
  
  /** API-specific columns */
  columns: TableColumnDef<APIEndpointInfo>[];
  
  /** API actions */
  apiActions?: {
    testEndpoint?: (endpoint: APIEndpointInfo) => void;
    viewDocs?: (endpoint: APIEndpointInfo) => void;
    editEndpoint?: (endpoint: APIEndpointInfo) => void;
    generateCode?: (endpoint: APIEndpointInfo) => void;
  };
}

/**
 * API endpoint information
 */
export interface APIEndpointInfo {
  id: string;
  path: string;
  method: HttpMethod;
  service: string;
  resource?: string;
  description?: string;
  parameters?: APIParameterInfo[];
  responses?: APIResponseInfo[];
  security?: APISecurityInfo[];
  tags?: string[];
  deprecated?: boolean;
  version?: string;
}

/**
 * API parameter information
 */
export interface APIParameterInfo {
  name: string;
  in: 'query' | 'path' | 'header' | 'body';
  type: string;
  required: boolean;
  description?: string;
  example?: any;
}

/**
 * API response information
 */
export interface APIResponseInfo {
  status: number;
  description: string;
  schema?: any;
  examples?: Record<string, any>;
}

/**
 * API security information
 */
export interface APISecurityInfo {
  type: 'apiKey' | 'bearer' | 'oauth2' | 'basic';
  name?: string;
  in?: 'header' | 'query';
  flows?: any;
}

// ============================================================================
// UTILITY TYPES
// ============================================================================

/**
 * Extract row data type from table props
 */
export type ExtractTableData<T> = T extends ManageTableProps<infer U> ? U : never;

/**
 * Extract column value type from column definition
 */
export type ExtractColumnValue<T> = T extends TableColumnDef<any, infer U> ? U : never;

/**
 * Table state for external state management
 */
export interface TableState<TData = any> {
  /** Pagination state */
  pagination: {
    pageIndex: number;
    pageSize: number;
  };
  
  /** Sorting state */
  sorting: TableSortState[];
  
  /** Filtering state */
  columnFilters: TableColumnFilter[];
  globalFilter: string;
  
  /** Selection state */
  rowSelection: Record<string, boolean>;
  
  /** Column visibility */
  columnVisibility: Record<string, boolean>;
  
  /** Column order */
  columnOrder: string[];
  
  /** Column sizing */
  columnSizing: Record<string, number>;
  
  /** Grouping state */
  grouping: string[];
  
  /** Expanded state */
  expanded: Record<string, boolean>;
}

/**
 * Table configuration for persistence
 */
export interface TableConfig {
  /** Configuration ID */
  id: string;
  
  /** Configuration name */
  name: string;
  
  /** User ID */
  userId?: string;
  
  /** Table state */
  state: Partial<TableState>;
  
  /** Timestamps */
  createdAt: string;
  updatedAt?: string;
  
  /** Configuration metadata */
  metadata?: {
    description?: string;
    tags?: string[];
    shared?: boolean;
    version?: number;
  };
}

// ============================================================================
// TYPE EXPORTS
// ============================================================================

// Main component types
export type {
  ManageTableProps,
  TableColumnDef,
  TableColumnMeta,
  TableDataType,
  TableCellFormat,
  TableCellValidation,
  ResponsiveTableColumn
};

// Configuration types
export type {
  TablePagination,
  TableSorting,
  TableFiltering,
  TableSelection,
  TableActions,
  TableBulkActions,
  TableLayout,
  TableExport,
  TableAccessibility,
  TableVirtualization
};

// Integration types
export type {
  TableQueryOptions,
  TableFormIntegration,
  TableState,
  TableConfig
};

// Specialized table types
export type {
  DatabaseSchemaTableProps,
  UserManagementTableProps,
  APIDocumentationTableProps
};

// Data types
export type {
  DatabaseTableInfo,
  UserInfo,
  APIEndpointInfo
};

// Function types
export type {
  TableSortingFn,
  TableFilterFn,
  TableAggregationFn
};

// Default export for main table configuration
export interface ManageTableConfig {
  /** Default page size options */
  defaultPageSizes: number[];
  
  /** Default theme */
  defaultTheme: TableTheme;
  
  /** Default accessibility settings */
  defaultAccessibility: TableAccessibility;
  
  /** Default virtualization threshold */
  virtualizationThreshold: number;
  
  /** Default export formats */
  defaultExportFormats: TableExportFormat[];
  
  /** Performance settings */
  performance: {
    debounceDelay: number;
    cacheTimeout: number;
    maxCacheSize: number;
  };
}