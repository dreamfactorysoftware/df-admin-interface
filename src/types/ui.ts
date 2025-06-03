/**
 * React UI Component Types for DreamFactory Admin Interface
 * 
 * Comprehensive type definitions for React 19 components using Headless UI,
 * Tailwind CSS, and class-variance-authority patterns. Provides type safety
 * for forms, tables, dialogs, navigation, and all UI components with full
 * WCAG 2.1 AA accessibility compliance.
 * 
 * @fileoverview UI component type definitions for React/Next.js migration
 * @version 1.0.0
 */

import { ComponentType, ReactNode, ForwardRefExoticComponent, RefAttributes } from 'react';
import { VariantProps } from 'class-variance-authority';
import { 
  UseFormReturn, 
  FieldPath, 
  FieldValues, 
  Control, 
  RegisterOptions,
  FieldError,
  UseControllerProps
} from 'react-hook-form';
import { ZodSchema, ZodType } from 'zod';

// ===================================================================
// BASE COMPONENT INTERFACES
// ===================================================================

/**
 * Base interface for all UI components ensuring consistent props structure
 * and accessibility compliance across all React components.
 */
export interface BaseComponent {
  /** Unique identifier for the component instance */
  id?: string;
  /** Additional CSS classes to apply to the component */
  className?: string;
  /** Child components to render within this component */
  children?: ReactNode;
  /** Component visual variant for styling */
  variant?: ComponentVariant;
  /** Component size configuration */
  size?: ComponentSize;
  /** Disabled state - prevents interaction */
  disabled?: boolean;
  /** Loading state - shows loading indicator */
  loading?: boolean;
  /** Test identifier for automated testing */
  'data-testid'?: string;
  /** ARIA label for accessibility */
  'aria-label'?: string;
  /** ARIA description for accessibility */
  'aria-describedby'?: string;
  /** Additional ARIA attributes */
  [key: `aria-${string}`]: string | boolean | undefined;
}

/**
 * Standard component variants based on design system
 */
export type ComponentVariant = 
  | 'primary'     // Main action variant (DreamFactory blue)
  | 'secondary'   // Secondary action variant
  | 'success'     // Success state variant (green)
  | 'warning'     // Warning state variant (amber)
  | 'error'       // Error state variant (red)
  | 'ghost'       // Transparent variant
  | 'outline'     // Outline variant
  | 'link';       // Text link variant

/**
 * Standard component sizes for consistent spacing
 */
export type ComponentSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl';

/**
 * Theme configuration matching Tailwind CSS dark mode patterns
 */
export type ThemeMode = 'light' | 'dark' | 'system';

/**
 * Responsive breakpoint values matching Tailwind CSS breakpoints
 */
export type BreakpointSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl';

// ===================================================================
// ACCESSIBILITY INTERFACES
// ===================================================================

/**
 * WCAG 2.1 AA accessibility compliance interface
 * Ensures all components meet accessibility standards
 */
export interface AccessibilityProps {
  /** ARIA label for component description */
  'aria-label'?: string;
  /** Reference to element that describes this component */
  'aria-describedby'?: string;
  /** Reference to element that labels this component */
  'aria-labelledby'?: string;
  /** Indicates if component is required */
  'aria-required'?: boolean;
  /** Indicates if component is invalid */
  'aria-invalid'?: boolean;
  /** Indicates if component is expanded (for collapsible elements) */
  'aria-expanded'?: boolean;
  /** Role of the component for assistive technology */
  role?: string;
  /** Tab index for keyboard navigation */
  tabIndex?: number;
}

/**
 * Focus management interface for keyboard navigation
 */
export interface FocusManagement {
  /** Auto-focus on component mount */
  autoFocus?: boolean;
  /** Callback when component receives focus */
  onFocus?: (event: React.FocusEvent) => void;
  /** Callback when component loses focus */
  onBlur?: (event: React.FocusEvent) => void;
  /** Keyboard event handler */
  onKeyDown?: (event: React.KeyboardEvent) => void;
}

// ===================================================================
// FORM COMPONENT INTERFACES
// ===================================================================

/**
 * Base interface for all form field components with React Hook Form integration
 */
export interface FormFieldComponent<T = any> extends BaseComponent, AccessibilityProps, FocusManagement {
  /** Field label text */
  label: string;
  /** Field name for form registration */
  name: string;
  /** Current field value */
  value?: T;
  /** Field placeholder text */
  placeholder?: string;
  /** Field description or help text */
  description?: string;
  /** Hint text for user guidance */
  hint?: string;
  /** Error message for validation failures */
  error?: string | FieldError;
  /** Required field indicator */
  required?: boolean;
  /** Read-only state */
  readonly?: boolean;
  /** Hidden field indicator */
  hidden?: boolean;
  /** Autocomplete attribute */
  autoComplete?: string;
  /** Change event handler */
  onChange?: (value: T) => void;
  /** Validation rules */
  rules?: RegisterOptions;
}

/**
 * Select field component interface with option support
 */
export interface SelectFieldComponent<T = any> extends FormFieldComponent<T> {
  /** Available options for selection */
  options: SelectOption<T>[];
  /** Multiple selection support */
  multiple?: boolean;
  /** Search functionality within options */
  searchable?: boolean;
  /** Clear selection functionality */
  clearable?: boolean;
  /** Create new option functionality */
  creatable?: boolean;
  /** Loading state for async options */
  loading?: boolean;
  /** No options message */
  noOptionsMessage?: string;
  /** Custom option filtering function */
  filterOption?: (option: SelectOption<T>, inputValue: string) => boolean;
}

/**
 * Option interface for select components
 */
export interface SelectOption<T = any> {
  /** Option value */
  value: T;
  /** Option display label */
  label: string;
  /** Optional description */
  description?: string;
  /** Optional icon component */
  icon?: ComponentType<{ className?: string }>;
  /** Disabled state */
  disabled?: boolean;
  /** Option group for categorization */
  group?: string;
  /** Additional data */
  data?: Record<string, any>;
}

/**
 * React Hook Form integration interface
 */
export interface ReactHookFormIntegration<TFieldValues extends FieldValues = FieldValues> {
  /** Form control instance */
  control?: Control<TFieldValues>;
  /** Field name for registration */
  name: FieldPath<TFieldValues>;
  /** Validation rules */
  rules?: RegisterOptions<TFieldValues>;
  /** Default value */
  defaultValue?: any;
  /** Should unfocus on error */
  shouldUnregister?: boolean;
}

/**
 * Zod schema validation integration
 */
export interface ZodValidationIntegration<T = any> {
  /** Zod schema for validation */
  schema?: ZodSchema<T>;
  /** Custom validation function */
  validate?: (value: T) => string | boolean | undefined;
  /** Async validation function */
  asyncValidate?: (value: T) => Promise<string | boolean | undefined>;
}

/**
 * Complete form configuration interface
 */
export interface FormConfiguration<TFieldValues extends FieldValues = FieldValues> {
  /** Form title */
  title?: string;
  /** Form description */
  description?: string;
  /** Zod validation schema */
  schema?: ZodType<TFieldValues>;
  /** Default form values */
  defaultValues?: Partial<TFieldValues>;
  /** Form mode configuration */
  mode?: 'onSubmit' | 'onBlur' | 'onChange' | 'onTouched' | 'all';
  /** Re-validation mode */
  reValidateMode?: 'onSubmit' | 'onBlur' | 'onChange' | 'onTouched' | 'all';
  /** Should focus first error */
  shouldFocusError?: boolean;
  /** Form submission handler */
  onSubmit?: (data: TFieldValues) => void | Promise<void>;
  /** Form error handler */
  onError?: (errors: any) => void;
  /** Form loading state */
  loading?: boolean;
  /** Form disabled state */
  disabled?: boolean;
}

// ===================================================================
// TABLE COMPONENT INTERFACES
// ===================================================================

/**
 * Table component interface with full data management capabilities
 */
export interface TableComponent<TData = any> extends BaseComponent {
  /** Table data array */
  data: TData[];
  /** Column definitions */
  columns: ColumnDefinition<TData>[];
  /** Loading state */
  loading?: boolean;
  /** Empty state content */
  emptyState?: ReactNode;
  /** Table caption for accessibility */
  caption?: string;
  /** Row click handler */
  onRowClick?: (row: TData, index: number) => void;
  /** Row selection handler */
  onRowSelect?: (selectedRows: TData[]) => void;
  /** Selected rows */
  selectedRows?: TData[];
  /** Pagination configuration */
  pagination?: PaginationConfiguration;
  /** Filtering configuration */
  filtering?: FilterConfiguration<TData>;
  /** Sorting configuration */
  sorting?: SortConfiguration<TData>;
  /** Row key extractor */
  getRowKey?: (row: TData, index: number) => string | number;
  /** Sticky header */
  stickyHeader?: boolean;
  /** Table density */
  density?: 'compact' | 'normal' | 'comfortable';
}

/**
 * Column definition interface with flexible rendering
 */
export interface ColumnDefinition<TData = any> {
  /** Column key */
  key: keyof TData | string;
  /** Column header text */
  header: string;
  /** Cell render function */
  cell?: (value: any, row: TData, index: number) => ReactNode;
  /** Header render function */
  headerCell?: () => ReactNode;
  /** Column sortable */
  sortable?: boolean;
  /** Column filterable */
  filterable?: boolean;
  /** Column width */
  width?: string | number;
  /** Column min width */
  minWidth?: string | number;
  /** Column max width */
  maxWidth?: string | number;
  /** Text alignment */
  align?: 'left' | 'center' | 'right';
  /** Sticky column */
  sticky?: 'left' | 'right';
  /** Column visibility */
  hidden?: boolean;
  /** Resize handler */
  onResize?: (width: number) => void;
}

/**
 * Pagination configuration interface
 */
export interface PaginationConfiguration {
  /** Current page number (1-based) */
  currentPage: number;
  /** Total number of pages */
  totalPages: number;
  /** Items per page */
  pageSize: number;
  /** Total number of items */
  totalItems: number;
  /** Page change handler */
  onPageChange: (page: number) => void;
  /** Page size change handler */
  onPageSizeChange: (size: number) => void;
  /** Available page sizes */
  pageSizeOptions?: number[];
  /** Show page size selector */
  showPageSizeSelector?: boolean;
  /** Show page info */
  showPageInfo?: boolean;
  /** Show first/last buttons */
  showFirstLast?: boolean;
  /** Show previous/next buttons */
  showPrevNext?: boolean;
}

/**
 * Filter configuration interface
 */
export interface FilterConfiguration<TData = any> {
  /** Global search term */
  searchTerm?: string;
  /** Active filters */
  activeFilters?: Filter<TData>[];
  /** Search change handler */
  onSearchChange?: (term: string) => void;
  /** Filter change handler */
  onFilterChange?: (filters: Filter<TData>[]) => void;
  /** Quick filters */
  quickFilters?: QuickFilter<TData>[];
  /** Advanced filter toggle */
  showAdvancedFilters?: boolean;
}

/**
 * Individual filter interface
 */
export interface Filter<TData = any> {
  /** Field to filter */
  field: keyof TData | string;
  /** Filter operator */
  operator: FilterOperator;
  /** Filter value */
  value: any;
  /** Filter label */
  label?: string;
  /** Filter type */
  type?: FilterType;
}

/**
 * Filter operators
 */
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
  | 'notIn'
  | 'isEmpty'
  | 'isNotEmpty';

/**
 * Filter input types
 */
export type FilterType = 
  | 'text'
  | 'number'
  | 'date'
  | 'select'
  | 'multiselect'
  | 'boolean'
  | 'range';

/**
 * Quick filter interface
 */
export interface QuickFilter<TData = any> {
  /** Filter label */
  label: string;
  /** Filter value */
  value: Partial<Filter<TData>>;
  /** Filter icon */
  icon?: ComponentType<{ className?: string }>;
  /** Active state */
  active?: boolean;
}

/**
 * Sort configuration interface
 */
export interface SortConfiguration<TData = any> {
  /** Current sort field */
  field?: keyof TData | string;
  /** Current sort direction */
  direction?: 'asc' | 'desc';
  /** Sort change handler */
  onSortChange: (field: keyof TData | string, direction: 'asc' | 'desc') => void;
  /** Multiple sort support */
  multiple?: boolean;
  /** Sort orders for multiple sort */
  sorts?: SortOrder<TData>[];
}

/**
 * Individual sort order
 */
export interface SortOrder<TData = any> {
  /** Field to sort */
  field: keyof TData | string;
  /** Sort direction */
  direction: 'asc' | 'desc';
  /** Sort priority */
  priority?: number;
}

// ===================================================================
// DIALOG AND MODAL INTERFACES
// ===================================================================

/**
 * Dialog component interface with Headless UI integration
 */
export interface DialogComponent extends BaseComponent {
  /** Dialog open state */
  open: boolean;
  /** Close handler */
  onClose: () => void;
  /** Dialog title */
  title?: string;
  /** Dialog description */
  description?: string;
  /** Initial focus element ref */
  initialFocus?: React.RefObject<HTMLElement>;
  /** Close on overlay click */
  closeOnOverlayClick?: boolean;
  /** Close on escape key */
  closeOnEscape?: boolean;
  /** Dialog size */
  size?: DialogSize;
  /** Dialog position */
  position?: DialogPosition;
  /** Dialog animation */
  animation?: DialogAnimation;
  /** Footer content */
  footer?: ReactNode;
  /** Header content */
  header?: ReactNode;
}

/**
 * Dialog size options
 */
export type DialogSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl' | '4xl' | 'full';

/**
 * Dialog position options
 */
export type DialogPosition = 'center' | 'top' | 'bottom';

/**
 * Dialog animation options
 */
export type DialogAnimation = 'fade' | 'slide-up' | 'slide-down' | 'scale' | 'none';

/**
 * Confirmation dialog interface
 */
export interface ConfirmationDialogComponent extends DialogComponent {
  /** Confirmation message */
  message: string;
  /** Confirm button text */
  confirmText?: string;
  /** Cancel button text */
  cancelText?: string;
  /** Confirm button variant */
  confirmVariant?: ComponentVariant;
  /** Cancel button variant */
  cancelVariant?: ComponentVariant;
  /** Confirm handler */
  onConfirm: () => void | Promise<void>;
  /** Cancel handler */
  onCancel?: () => void;
  /** Loading state for async confirmation */
  loading?: boolean;
  /** Destructive action indicator */
  destructive?: boolean;
}

// ===================================================================
// NAVIGATION INTERFACES
// ===================================================================

/**
 * Navigation item interface
 */
export interface NavigationItem {
  /** Item label */
  label: string;
  /** Item URL or route */
  href?: string;
  /** Item icon */
  icon?: ComponentType<{ className?: string }>;
  /** Item badge */
  badge?: string | number;
  /** Active state */
  active?: boolean;
  /** Disabled state */
  disabled?: boolean;
  /** Child items */
  children?: NavigationItem[];
  /** Click handler */
  onClick?: () => void;
  /** External link indicator */
  external?: boolean;
  /** Target attribute for links */
  target?: string;
}

/**
 * Navigation component interface
 */
export interface NavigationComponent extends BaseComponent {
  /** Navigation items */
  items: NavigationItem[];
  /** Collapsed state */
  collapsed?: boolean;
  /** Collapse toggle handler */
  onCollapseToggle?: (collapsed: boolean) => void;
  /** Active item key */
  activeKey?: string;
  /** Orientation */
  orientation?: 'horizontal' | 'vertical';
  /** Navigation style */
  style?: NavigationStyle;
}

/**
 * Navigation style options
 */
export type NavigationStyle = 'sidebar' | 'tabs' | 'pills' | 'breadcrumb' | 'pagination';

/**
 * Breadcrumb component interface
 */
export interface BreadcrumbComponent extends BaseComponent {
  /** Breadcrumb items */
  items: BreadcrumbItem[];
  /** Separator component */
  separator?: ReactNode;
  /** Maximum items to show */
  maxItems?: number;
  /** Ellipsis position when max items exceeded */
  ellipsisPosition?: 'start' | 'middle' | 'end';
}

/**
 * Breadcrumb item interface
 */
export interface BreadcrumbItem {
  /** Item label */
  label: string;
  /** Item URL */
  href?: string;
  /** Item icon */
  icon?: ComponentType<{ className?: string }>;
  /** Current page indicator */
  current?: boolean;
  /** Click handler */
  onClick?: () => void;
}

// ===================================================================
// STYLING AND THEMING INTERFACES
// ===================================================================

/**
 * Tailwind CSS class variance authority configuration
 */
export interface ComponentVariants {
  /** Base classes always applied */
  base?: string;
  /** Variant-specific classes */
  variants?: {
    variant?: Record<ComponentVariant, string>;
    size?: Record<ComponentSize, string>;
    state?: Record<string, string>;
  };
  /** Compound variants */
  compoundVariants?: Array<{
    variant?: ComponentVariant;
    size?: ComponentSize;
    state?: string;
    class: string;
  }>;
  /** Default variant values */
  defaultVariants?: {
    variant?: ComponentVariant;
    size?: ComponentSize;
  };
}

/**
 * Theme configuration interface
 */
export interface ThemeConfiguration {
  /** Current theme mode */
  mode: ThemeMode;
  /** Primary color scheme */
  primaryColor: string;
  /** Secondary color scheme */
  secondaryColor: string;
  /** Custom CSS variables */
  cssVariables?: Record<string, string>;
  /** Component overrides */
  components?: Record<string, ComponentVariants>;
}

/**
 * Responsive design configuration
 */
export interface ResponsiveConfiguration<T = any> {
  /** Extra small screens */
  xs?: T;
  /** Small screens */
  sm?: T;
  /** Medium screens */
  md?: T;
  /** Large screens */
  lg?: T;
  /** Extra large screens */
  xl?: T;
  /** 2X large screens */
  '2xl'?: T;
}

// ===================================================================
// LAYOUT INTERFACES
// ===================================================================

/**
 * Layout component interface
 */
export interface LayoutComponent extends BaseComponent {
  /** Header content */
  header?: ReactNode;
  /** Sidebar content */
  sidebar?: ReactNode;
  /** Footer content */
  footer?: ReactNode;
  /** Main content */
  main?: ReactNode;
  /** Sidebar collapsed state */
  sidebarCollapsed?: boolean;
  /** Layout variant */
  variant?: LayoutVariant;
}

/**
 * Layout variant options
 */
export type LayoutVariant = 'default' | 'sidebar' | 'header-only' | 'full-width';

/**
 * Grid system interface
 */
export interface GridSystemConfiguration {
  /** Number of columns */
  columns?: number | ResponsiveConfiguration<number>;
  /** Gap between items */
  gap?: ComponentSize | ResponsiveConfiguration<ComponentSize>;
  /** Auto-fit columns */
  autoFit?: boolean;
  /** Minimum column width */
  minWidth?: string;
  /** Maximum column width */
  maxWidth?: string;
}

// ===================================================================
// UTILITY INTERFACES
// ===================================================================

/**
 * Loading state interface
 */
export interface LoadingState {
  /** Loading indicator */
  loading: boolean;
  /** Loading message */
  message?: string;
  /** Loading progress */
  progress?: number;
  /** Loading type */
  type?: 'spinner' | 'skeleton' | 'progress' | 'pulse';
}

/**
 * Error state interface
 */
export interface ErrorState {
  /** Error occurred */
  hasError: boolean;
  /** Error message */
  message?: string;
  /** Error code */
  code?: string | number;
  /** Error details */
  details?: any;
  /** Retry handler */
  onRetry?: () => void;
}

/**
 * Animation configuration interface
 */
export interface AnimationConfiguration {
  /** Animation type */
  type: AnimationType;
  /** Animation duration */
  duration?: number;
  /** Animation delay */
  delay?: number;
  /** Animation easing */
  easing?: string;
  /** Animation direction */
  direction?: 'normal' | 'reverse' | 'alternate' | 'alternate-reverse';
  /** Animation iteration count */
  iterations?: number | 'infinite';
}

/**
 * Animation types
 */
export type AnimationType = 
  | 'fade-in'
  | 'fade-out'
  | 'slide-in'
  | 'slide-out'
  | 'scale-in'
  | 'scale-out'
  | 'rotate'
  | 'bounce'
  | 'pulse'
  | 'shake'
  | 'none';

// ===================================================================
// COMPONENT REF INTERFACES
// ===================================================================

/**
 * Form component ref interface
 */
export interface FormRef<TFieldValues extends FieldValues = FieldValues> {
  /** Submit form programmatically */
  submit: () => Promise<void>;
  /** Reset form to default values */
  reset: (values?: Partial<TFieldValues>) => void;
  /** Get current form values */
  getValues: () => TFieldValues;
  /** Set form values */
  setValues: (values: Partial<TFieldValues>) => void;
  /** Trigger validation */
  validate: () => Promise<boolean>;
  /** Focus first error field */
  focusFirstError: () => void;
}

/**
 * Table component ref interface
 */
export interface TableRef<TData = any> {
  /** Refresh table data */
  refresh: () => void;
  /** Clear all filters */
  clearFilters: () => void;
  /** Reset sorting */
  resetSort: () => void;
  /** Select all rows */
  selectAll: () => void;
  /** Clear selection */
  clearSelection: () => void;
  /** Get selected rows */
  getSelectedRows: () => TData[];
}

/**
 * Dialog component ref interface
 */
export interface DialogRef {
  /** Open dialog */
  open: () => void;
  /** Close dialog */
  close: () => void;
  /** Focus initial element */
  focus: () => void;
}

// ===================================================================
// EXPORTS
// ===================================================================

/**
 * Re-export commonly used types for convenience
 */
export type {
  VariantProps,
  UseFormReturn,
  Control,
  FieldValues,
  FieldPath,
  RegisterOptions,
  FieldError,
  UseControllerProps,
  ZodSchema,
  ZodType,
};

/**
 * Component prop types using class-variance-authority
 */
export type ButtonProps = BaseComponent & VariantProps<ComponentVariants> & {
  type?: 'button' | 'submit' | 'reset';
  onClick?: (event: React.MouseEvent<HTMLButtonElement>) => void;
};

export type InputProps = FormFieldComponent<string> & VariantProps<ComponentVariants> & {
  type?: 'text' | 'password' | 'email' | 'url' | 'tel' | 'search';
};

export type SelectProps<T = any> = SelectFieldComponent<T> & VariantProps<ComponentVariants>;

export type TextareaProps = FormFieldComponent<string> & VariantProps<ComponentVariants> & {
  rows?: number;
  cols?: number;
  resize?: 'none' | 'both' | 'horizontal' | 'vertical';
};

/**
 * Default export of core UI types
 */
export default {
  BaseComponent,
  ComponentVariant,
  ComponentSize,
  ThemeMode,
  BreakpointSize,
  AccessibilityProps,
  FocusManagement,
  FormFieldComponent,
  SelectFieldComponent,
  SelectOption,
  ReactHookFormIntegration,
  ZodValidationIntegration,
  FormConfiguration,
  TableComponent,
  ColumnDefinition,
  PaginationConfiguration,
  FilterConfiguration,
  Filter,
  FilterOperator,
  FilterType,
  QuickFilter,
  SortConfiguration,
  SortOrder,
  DialogComponent,
  DialogSize,
  DialogPosition,
  DialogAnimation,
  ConfirmationDialogComponent,
  NavigationItem,
  NavigationComponent,
  NavigationStyle,
  BreadcrumbComponent,
  BreadcrumbItem,
  ComponentVariants,
  ThemeConfiguration,
  ResponsiveConfiguration,
  LayoutComponent,
  LayoutVariant,
  GridSystemConfiguration,
  LoadingState,
  ErrorState,
  AnimationConfiguration,
  AnimationType,
  FormRef,
  TableRef,
  DialogRef,
};