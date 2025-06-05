/**
 * Generic table component types adapted for React and Headless UI integration
 * Provides type-safe table configurations for React components with enhanced accessibility
 */

import { ReactNode, ComponentType, MouseEvent, KeyboardEvent } from 'react';

// ============================================================================
// Core Table Interface
// ============================================================================

/**
 * Main table component interface supporting React component patterns
 * Replaces Angular Material table configurations with React-compatible types
 */
export interface TableComponent<T = Record<string, any>> {
  /** Unique identifier for the table instance */
  id?: string;
  
  /** Table data array with type safety */
  data: T[];
  
  /** Column definitions with React component support */
  columns: TableColumn<T>[];
  
  /** Accessible table caption for screen readers */
  caption: string;
  
  /** Loading state indicator */
  loading?: boolean;
  
  /** Empty state configuration */
  emptyState?: EmptyStateConfig;
  
  /** Selection configuration */
  selection?: SelectionConfig<T>;
  
  /** Pagination configuration */
  pagination?: PaginationConfig;
  
  /** Sorting configuration */
  sorting?: SortingConfig;
  
  /** Filtering configuration */
  filtering?: FilteringConfig;
  
  /** Table actions and bulk operations */
  actions?: TableActionsConfig<T>;
  
  /** Accessibility configuration */
  accessibility?: AccessibilityConfig;
  
  /** Virtualization settings for large datasets */
  virtualization?: VirtualizationConfig;
  
  /** Custom styling and theme configuration */
  styling?: TableStylingConfig;
  
  /** Event handlers using React patterns */
  onRowClick?: (row: T, index: number, event: MouseEvent<HTMLTableRowElement>) => void;
  onRowDoubleClick?: (row: T, index: number, event: MouseEvent<HTMLTableRowElement>) => void;
  onRowKeyDown?: (row: T, index: number, event: KeyboardEvent<HTMLTableRowElement>) => void;
  
  /** CSS class name for custom styling */
  className?: string;
  
  /** Test identifier for automated testing */
  'data-testid'?: string;
  
  /** ARIA labeling for accessibility */
  'aria-label'?: string;
  'aria-describedby'?: string;
}

// ============================================================================
// Column Configuration
// ============================================================================

/**
 * Enhanced column definition supporting React component rendering
 * Updated from Angular Material patterns to React component patterns
 */
export interface TableColumn<T = Record<string, any>> {
  /** Unique identifier for the column */
  id: string;
  
  /** Data key to extract value from row object */
  key: keyof T;
  
  /** Column header text */
  header: string;
  
  /** Custom cell renderer using React component patterns */
  cell?: (value: T[keyof T], row: T, index: number) => ReactNode;
  
  /** Column width configuration */
  width?: ColumnWidth;
  
  /** Text alignment */
  align?: 'left' | 'center' | 'right';
  
  /** Sorting configuration */
  sortable?: boolean;
  sortKey?: string;
  
  /** Filtering configuration */
  filterable?: boolean;
  filterType?: FilterType;
  filterOptions?: FilterOption[];
  
  /** Column visibility and responsive behavior */
  visible?: boolean;
  hiddenBreakpoints?: ResponsiveBreakpoint[];
  
  /** Sticky column configuration */
  sticky?: StickyConfig;
  
  /** Accessibility configuration */
  accessibility?: ColumnAccessibilityConfig;
  
  /** Custom styling */
  className?: string;
  headerClassName?: string;
  cellClassName?: string;
  
  /** Validation and formatting */
  format?: CellFormatter<T>;
  validate?: CellValidator<T>;
}

/**
 * Column width configuration types
 */
export type ColumnWidth = 
  | string 
  | number 
  | 'auto' 
  | 'min-content' 
  | 'max-content'
  | ResponsiveWidth;

export interface ResponsiveWidth {
  xs?: string | number;
  sm?: string | number;
  md?: string | number;
  lg?: string | number;
  xl?: string | number;
}

export type ResponsiveBreakpoint = 'xs' | 'sm' | 'md' | 'lg' | 'xl';

/**
 * Sticky column configuration
 */
export interface StickyConfig {
  left?: boolean;
  right?: boolean;
  zIndex?: number;
}

/**
 * Column accessibility configuration
 */
export interface ColumnAccessibilityConfig {
  /** ARIA label for column header */
  ariaLabel?: string;
  
  /** ARIA description for complex columns */
  ariaDescription?: string;
  
  /** Column scope for accessibility */
  scope?: 'col' | 'colgroup';
  
  /** Abbreviated header for screen readers */
  abbr?: string;
}

// ============================================================================
// Cell Formatting and Validation
// ============================================================================

/**
 * Cell formatter interface for data transformation
 */
export interface CellFormatter<T = Record<string, any>> {
  type: 'currency' | 'date' | 'number' | 'percentage' | 'custom';
  options?: CellFormatterOptions;
  customFormatter?: (value: T[keyof T], row: T) => string | ReactNode;
}

export interface CellFormatterOptions {
  /** Currency formatting options */
  currency?: {
    currency: string;
    locale?: string;
    minimumFractionDigits?: number;
    maximumFractionDigits?: number;
  };
  
  /** Date formatting options */
  date?: {
    format: string;
    locale?: string;
    timezone?: string;
  };
  
  /** Number formatting options */
  number?: {
    locale?: string;
    minimumFractionDigits?: number;
    maximumFractionDigits?: number;
    useGrouping?: boolean;
  };
  
  /** Percentage formatting options */
  percentage?: {
    locale?: string;
    minimumFractionDigits?: number;
    maximumFractionDigits?: number;
  };
}

/**
 * Cell validator interface for data validation
 */
export interface CellValidator<T = Record<string, any>> {
  validate: (value: T[keyof T], row: T) => ValidationResult;
  showValidation?: boolean;
}

export interface ValidationResult {
  isValid: boolean;
  message?: string;
  severity?: 'error' | 'warning' | 'info';
}

// ============================================================================
// Table Actions and Interactions
// ============================================================================

/**
 * Table actions configuration supporting React icon libraries
 * Updated from Angular Material icons to React component patterns
 */
export interface TableActionsConfig<T = Record<string, any>> {
  /** Row-level actions */
  rowActions?: RowAction<T>[];
  
  /** Bulk actions for selected rows */
  bulkActions?: BulkAction<T>[];
  
  /** Table-level actions (toolbar actions) */
  tableActions?: TableAction[];
  
  /** Action menu configuration */
  actionMenu?: ActionMenuConfig;
}

/**
 * Individual row action configuration
 * Modified to support React icon libraries instead of Angular Material
 */
export interface RowAction<T = Record<string, any>> {
  /** Unique identifier */
  id: string;
  
  /** Action label */
  label: string;
  
  /** Icon component from React icon libraries (e.g., Heroicons, Lucide) */
  icon?: ComponentType<{ className?: string; 'aria-hidden'?: boolean }>;
  
  /** Action handler with React event patterns */
  onClick: (row: T, index: number, event: MouseEvent<HTMLButtonElement>) => void;
  
  /** Conditional visibility */
  visible?: (row: T) => boolean;
  
  /** Conditional disabled state */
  disabled?: (row: T) => boolean;
  
  /** Action variant styling */
  variant?: ActionVariant;
  
  /** Tooltip text */
  tooltip?: string;
  
  /** Accessibility configuration */
  accessibility?: ActionAccessibilityConfig;
  
  /** Confirmation dialog configuration */
  confirmation?: ConfirmationConfig;
}

/**
 * Bulk action configuration for selected rows
 */
export interface BulkAction<T = Record<string, any>> {
  /** Unique identifier */
  id: string;
  
  /** Action label */
  label: string;
  
  /** Icon component */
  icon?: ComponentType<{ className?: string; 'aria-hidden'?: boolean }>;
  
  /** Bulk action handler */
  onClick: (selectedRows: T[], selectedIndices: number[]) => void;
  
  /** Minimum selection requirement */
  minSelection?: number;
  
  /** Maximum selection limit */
  maxSelection?: number;
  
  /** Action variant styling */
  variant?: ActionVariant;
  
  /** Confirmation dialog configuration */
  confirmation?: ConfirmationConfig;
  
  /** Accessibility configuration */
  accessibility?: ActionAccessibilityConfig;
}

/**
 * Table-level action configuration
 */
export interface TableAction {
  /** Unique identifier */
  id: string;
  
  /** Action label */
  label: string;
  
  /** Icon component */
  icon?: ComponentType<{ className?: string; 'aria-hidden'?: boolean }>;
  
  /** Action handler */
  onClick: (event: MouseEvent<HTMLButtonElement>) => void;
  
  /** Action variant styling */
  variant?: ActionVariant;
  
  /** Accessibility configuration */
  accessibility?: ActionAccessibilityConfig;
}

export type ActionVariant = 
  | 'primary' 
  | 'secondary' 
  | 'success' 
  | 'warning' 
  | 'error' 
  | 'ghost' 
  | 'outline';

/**
 * Action accessibility configuration
 */
export interface ActionAccessibilityConfig {
  /** ARIA label for the action */
  ariaLabel?: string;
  
  /** ARIA description for complex actions */
  ariaDescription?: string;
  
  /** Keyboard shortcut */
  keyboardShortcut?: string;
}

/**
 * Confirmation dialog configuration
 */
export interface ConfirmationConfig {
  /** Dialog title */
  title: string;
  
  /** Dialog message */
  message: string;
  
  /** Confirm button text */
  confirmText?: string;
  
  /** Cancel button text */
  cancelText?: string;
  
  /** Confirmation variant (affects styling) */
  variant?: 'default' | 'destructive';
}

/**
 * Action menu configuration
 */
export interface ActionMenuConfig {
  /** Maximum actions to show before grouping into menu */
  maxVisibleActions?: number;
  
  /** Menu trigger icon */
  menuIcon?: ComponentType<{ className?: string; 'aria-hidden'?: boolean }>;
  
  /** Menu placement */
  placement?: 'bottom-start' | 'bottom-end' | 'top-start' | 'top-end';
}

// ============================================================================
// Selection Configuration
// ============================================================================

/**
 * Row selection configuration
 */
export interface SelectionConfig<T = Record<string, any>> {
  /** Selection mode */
  mode: 'single' | 'multiple' | 'none';
  
  /** Currently selected rows */
  selectedRows?: T[];
  
  /** Selection change handler */
  onSelectionChange?: (selectedRows: T[], selectedIndices: number[]) => void;
  
  /** Row selection predicate */
  selectable?: (row: T, index: number) => boolean;
  
  /** Show select all checkbox in header */
  showSelectAll?: boolean;
  
  /** Selection persistence across data changes */
  persistSelection?: boolean;
  
  /** Selection comparison function */
  compareFunction?: (a: T, b: T) => boolean;
  
  /** Accessibility configuration */
  accessibility?: SelectionAccessibilityConfig;
}

export interface SelectionAccessibilityConfig {
  /** ARIA label for select all checkbox */
  selectAllLabel?: string;
  
  /** ARIA label for row checkboxes */
  selectRowLabel?: (row: any, index: number) => string;
  
  /** Selection announcement for screen readers */
  selectionAnnouncement?: (count: number, total: number) => string;
}

// ============================================================================
// Pagination Configuration
// ============================================================================

/**
 * Pagination configuration
 */
export interface PaginationConfig {
  /** Current page (0-based) */
  currentPage: number;
  
  /** Items per page */
  pageSize: number;
  
  /** Total number of items */
  totalItems: number;
  
  /** Page change handler */
  onPageChange: (page: number) => void;
  
  /** Page size change handler */
  onPageSizeChange?: (pageSize: number) => void;
  
  /** Available page size options */
  pageSizeOptions?: number[];
  
  /** Show page size selector */
  showPageSizeSelector?: boolean;
  
  /** Show page info (e.g., "1-10 of 100") */
  showPageInfo?: boolean;
  
  /** Show first/last page buttons */
  showFirstLastButtons?: boolean;
  
  /** Number of page buttons to show */
  maxPageButtons?: number;
  
  /** Pagination placement */
  placement?: 'top' | 'bottom' | 'both';
  
  /** Custom pagination component */
  customPagination?: ComponentType<PaginationProps>;
  
  /** Accessibility configuration */
  accessibility?: PaginationAccessibilityConfig;
}

export interface PaginationProps {
  currentPage: number;
  totalPages: number;
  pageSize: number;
  totalItems: number;
  onPageChange: (page: number) => void;
  onPageSizeChange?: (pageSize: number) => void;
  pageSizeOptions?: number[];
  showPageSizeSelector?: boolean;
  showPageInfo?: boolean;
  accessibility?: PaginationAccessibilityConfig;
}

export interface PaginationAccessibilityConfig {
  /** ARIA label for pagination navigation */
  paginationLabel?: string;
  
  /** ARIA label for page buttons */
  pageButtonLabel?: (page: number) => string;
  
  /** ARIA label for previous/next buttons */
  previousButtonLabel?: string;
  nextButtonLabel?: string;
  
  /** ARIA label for page size selector */
  pageSizeLabel?: string;
}

// ============================================================================
// Sorting Configuration
// ============================================================================

/**
 * Sorting configuration
 */
export interface SortingConfig {
  /** Currently sorted column */
  sortColumn?: string;
  
  /** Sort direction */
  sortDirection?: SortDirection;
  
  /** Sort change handler */
  onSortChange: (column: string, direction: SortDirection) => void;
  
  /** Multi-column sorting support */
  multiSort?: boolean;
  
  /** Current sort state for multi-column sorting */
  sortState?: SortState[];
  
  /** Default sort configuration */
  defaultSort?: SortState;
  
  /** Custom sort functions */
  customSortFunctions?: Record<string, SortFunction>;
  
  /** Accessibility configuration */
  accessibility?: SortingAccessibilityConfig;
}

export type SortDirection = 'asc' | 'desc' | 'none';

export interface SortState {
  column: string;
  direction: SortDirection;
  priority?: number;
}

export type SortFunction = (a: any, b: any) => number;

export interface SortingAccessibilityConfig {
  /** ARIA label for sortable column headers */
  sortableColumnLabel?: (column: string, direction: SortDirection) => string;
  
  /** Sort instructions for screen readers */
  sortInstructions?: string;
}

// ============================================================================
// Filtering Configuration
// ============================================================================

/**
 * Filtering configuration
 */
export interface FilteringConfig {
  /** Global search/filter term */
  globalFilter?: string;
  
  /** Global filter change handler */
  onGlobalFilterChange?: (term: string) => void;
  
  /** Column-specific filters */
  columnFilters?: ColumnFilter[];
  
  /** Column filter change handler */
  onColumnFilterChange?: (filters: ColumnFilter[]) => void;
  
  /** Quick filter options */
  quickFilters?: QuickFilter[];
  
  /** Advanced filter configuration */
  advancedFilters?: AdvancedFilterConfig;
  
  /** Filter persistence */
  persistFilters?: boolean;
  
  /** Custom filter functions */
  customFilterFunctions?: Record<string, FilterFunction>;
  
  /** Accessibility configuration */
  accessibility?: FilteringAccessibilityConfig;
}

export interface ColumnFilter {
  column: string;
  type: FilterType;
  value: any;
  operator?: FilterOperator;
}

export type FilterType = 
  | 'text' 
  | 'number' 
  | 'date' 
  | 'select' 
  | 'multiselect' 
  | 'boolean' 
  | 'range';

export type FilterOperator = 
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
  | 'notIn';

export interface FilterOption {
  value: any;
  label: string;
  count?: number;
}

export interface QuickFilter {
  id: string;
  label: string;
  filter: ColumnFilter[];
  icon?: ComponentType<{ className?: string; 'aria-hidden'?: boolean }>;
}

export interface AdvancedFilterConfig {
  /** Enable advanced filter UI */
  enabled: boolean;
  
  /** Available filter operators per column type */
  operatorsByType?: Record<FilterType, FilterOperator[]>;
  
  /** Filter group logic (AND/OR) */
  groupLogic?: 'AND' | 'OR';
  
  /** Maximum number of filter conditions */
  maxConditions?: number;
}

export type FilterFunction = (row: any, filterValue: any) => boolean;

export interface FilteringAccessibilityConfig {
  /** ARIA label for global filter input */
  globalFilterLabel?: string;
  
  /** ARIA label for column filter inputs */
  columnFilterLabel?: (column: string) => string;
  
  /** Filter instructions for screen readers */
  filterInstructions?: string;
}

// ============================================================================
// Empty State Configuration
// ============================================================================

/**
 * Empty state configuration
 */
export interface EmptyStateConfig {
  /** Empty state message */
  message: string;
  
  /** Empty state description */
  description?: string;
  
  /** Empty state icon */
  icon?: ComponentType<{ className?: string; 'aria-hidden'?: boolean }>;
  
  /** Empty state actions */
  actions?: EmptyStateAction[];
  
  /** Custom empty state component */
  customComponent?: ComponentType<EmptyStateProps>;
  
  /** Styling configuration */
  className?: string;
}

export interface EmptyStateAction {
  label: string;
  onClick: () => void;
  variant?: ActionVariant;
  icon?: ComponentType<{ className?: string; 'aria-hidden'?: boolean }>;
}

export interface EmptyStateProps {
  message: string;
  description?: string;
  icon?: ComponentType<{ className?: string; 'aria-hidden'?: boolean }>;
  actions?: EmptyStateAction[];
  className?: string;
}

// ============================================================================
// Accessibility Configuration
// ============================================================================

/**
 * Comprehensive accessibility configuration
 */
export interface AccessibilityConfig {
  /** Enable keyboard navigation */
  keyboardNavigation?: boolean;
  
  /** Enable row selection with keyboard */
  keyboardSelection?: boolean;
  
  /** Enable screen reader announcements */
  screenReaderAnnouncements?: boolean;
  
  /** Custom keyboard shortcuts */
  keyboardShortcuts?: KeyboardShortcut[];
  
  /** ARIA live region for announcements */
  liveRegion?: LiveRegionConfig;
  
  /** Focus management configuration */
  focusManagement?: FocusManagementConfig;
  
  /** High contrast mode support */
  highContrastMode?: boolean;
  
  /** Reduced motion support */
  reducedMotion?: boolean;
}

export interface KeyboardShortcut {
  key: string;
  metaKey?: boolean;
  ctrlKey?: boolean;
  altKey?: boolean;
  shiftKey?: boolean;
  action: (event: KeyboardEvent) => void;
  description: string;
}

export interface LiveRegionConfig {
  /** ARIA live region politeness */
  politeness: 'polite' | 'assertive';
  
  /** Custom announcements */
  customAnnouncements?: Record<string, string>;
}

export interface FocusManagementConfig {
  /** Restore focus on actions */
  restoreFocus?: boolean;
  
  /** Focus trap within table */
  trapFocus?: boolean;
  
  /** Skip navigation support */
  skipNavigation?: boolean;
}

// ============================================================================
// Virtualization Configuration
// ============================================================================

/**
 * Virtualization configuration for large datasets
 * Supports @tanstack/react-virtual integration
 */
export interface VirtualizationConfig {
  /** Enable virtualization */
  enabled: boolean;
  
  /** Estimated row height */
  estimateRowHeight: number | ((index: number) => number);
  
  /** Overscan count for smooth scrolling */
  overscan?: number;
  
  /** Horizontal virtualization */
  horizontal?: boolean;
  
  /** Estimated column width for horizontal virtualization */
  estimateColumnWidth?: number | ((index: number) => number);
  
  /** Scroll element reference */
  scrollElement?: HTMLElement | null;
  
  /** Virtualization options */
  options?: VirtualizationOptions;
}

export interface VirtualizationOptions {
  /** Enable smooth scrolling */
  smoothScrolling?: boolean;
  
  /** Scroll behavior */
  scrollBehavior?: 'auto' | 'smooth';
  
  /** Dynamic size measurements */
  dynamicSizing?: boolean;
  
  /** Debug mode for development */
  debug?: boolean;
}

// ============================================================================
// Styling Configuration
// ============================================================================

/**
 * Table styling configuration
 */
export interface TableStylingConfig {
  /** Table size variant */
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  
  /** Table border configuration */
  borders?: BorderConfig;
  
  /** Striped rows */
  striped?: boolean;
  
  /** Hover effects */
  hover?: boolean;
  
  /** Color scheme */
  colorScheme?: 'light' | 'dark' | 'auto';
  
  /** Density configuration */
  density?: 'compact' | 'comfortable' | 'spacious';
  
  /** Custom CSS variables */
  cssVariables?: Record<string, string>;
  
  /** Tailwind CSS classes */
  tailwindClasses?: TailwindClasses;
}

export interface BorderConfig {
  /** Table border */
  table?: boolean;
  
  /** Cell borders */
  cells?: boolean;
  
  /** Row borders */
  rows?: boolean;
  
  /** Column borders */
  columns?: boolean;
  
  /** Border style */
  style?: 'solid' | 'dashed' | 'dotted';
  
  /** Border width */
  width?: number;
}

export interface TailwindClasses {
  /** Table wrapper classes */
  wrapper?: string;
  
  /** Table element classes */
  table?: string;
  
  /** Header classes */
  header?: string;
  
  /** Body classes */
  body?: string;
  
  /** Row classes */
  row?: string;
  
  /** Cell classes */
  cell?: string;
  
  /** Footer classes */
  footer?: string;
}

// ============================================================================
// Legacy Support Types (for migration compatibility)
// ============================================================================

/**
 * Legacy interface for backward compatibility during migration
 * @deprecated Use TableComponent interface instead
 */
export interface LegacyTableConfig<T = Record<string, any>> {
  displayedColumns: string[];
  dataSource: T[];
  columnDefinitions: LegacyColumnDefinition<T>[];
}

/**
 * Legacy column definition for migration support
 * @deprecated Use TableColumn interface instead
 */
export interface LegacyColumnDefinition<T = Record<string, any>> {
  columnDef: string;
  header: string;
  cell?: (element: T) => string | ReactNode;
  sortable?: boolean;
}

/**
 * Legacy additional action interface
 * @deprecated Use RowAction interface instead
 */
export interface LegacyAdditionalAction<T = Record<string, any>> {
  label: string;
  icon: string; // Legacy string-based icons
  action: (row: T) => void;
  visible?: (row: T) => boolean;
}

// ============================================================================
// Utility Types
// ============================================================================

/**
 * Extract row type from table data
 */
export type TableRowType<T extends TableComponent<any>> = T extends TableComponent<infer R> ? R : never;

/**
 * Extract column keys from row type
 */
export type TableColumnKeys<T> = keyof T;

/**
 * Type-safe column definition builder
 */
export type TypeSafeColumn<T> = {
  [K in keyof T]: TableColumn<T> & {
    key: K;
    cell?: (value: T[K], row: T, index: number) => ReactNode;
  };
}[keyof T];

/**
 * Table event handlers type
 */
export interface TableEventHandlers<T> {
  onRowClick?: TableComponent<T>['onRowClick'];
  onRowDoubleClick?: TableComponent<T>['onRowDoubleClick'];
  onRowKeyDown?: TableComponent<T>['onRowKeyDown'];
}

/**
 * Table configuration builder type
 */
export type TableConfigBuilder<T> = Partial<TableComponent<T>> & {
  data: T[];
  columns: TableColumn<T>[];
  caption: string;
};