/**
 * React Component Type Definitions for DreamFactory Admin Interface
 * 
 * Comprehensive component interfaces for React 19/Next.js 15.1 implementation,
 * replacing Angular Material component patterns with Headless UI and Tailwind CSS.
 * Provides type-safe component definitions with accessibility compliance and
 * React Hook Form integration.
 * 
 * @fileoverview Component types for Headless UI + Tailwind CSS React implementation
 * @version 1.0.0
 */

import { type ReactNode, type ComponentType, type RefObject } from 'react';
import { type VariantProps } from 'class-variance-authority';
import { 
  type UseFormRegister, 
  type Control, 
  type FieldError, 
  type FieldErrors,
  type FieldValues,
  type Path,
  type UseFieldArrayReturn 
} from 'react-hook-form';
import { type ZodSchema } from 'zod';
import { 
  type BaseComponent, 
  type ComponentVariant, 
  type ComponentSize, 
  type ThemeConfig,
  type AccessibilityConfig 
} from './ui';

// ============================================================================
// BASE COMPONENT INTERFACES
// ============================================================================

/**
 * Enhanced base component interface for React 19 components
 * Extends Headless UI patterns with accessibility compliance
 */
export interface BaseComponentProps extends BaseComponent {
  /** Component reference for imperative access */
  ref?: RefObject<HTMLElement>;
  
  /** Component error boundary fallback */
  fallback?: ComponentType<{ error: Error; reset: () => void }>;
  
  /** Server component compatibility */
  suppressHydrationWarning?: boolean;
  
  /** React 19 concurrent features support */
  priority?: 'high' | 'normal' | 'low';
}

/**
 * Form component interface with React Hook Form integration
 * Replaces Angular Material form components
 */
export interface FormComponentProps extends BaseComponentProps {
  /** Form register function from React Hook Form */
  register?: UseFormRegister<any>;
  
  /** Form control object */
  control?: Control<any>;
  
  /** Field validation error */
  error?: FieldError;
  
  /** Field validation errors for nested objects */
  errors?: FieldErrors<any>;
  
  /** Field name for form integration */
  name?: string;
  
  /** Field label */
  label?: string;
  
  /** Help text or description */
  description?: string;
  
  /** Placeholder text */
  placeholder?: string;
  
  /** Field is required */
  required?: boolean;
  
  /** Field is disabled */
  disabled?: boolean;
  
  /** Field is read-only */
  readOnly?: boolean;
  
  /** Field validation schema */
  schema?: ZodSchema<any>;
  
  /** Accessibility props */
  accessibility?: ComponentAccessibilityProps;
}

/**
 * Component accessibility properties for WCAG 2.1 AA compliance
 */
export interface ComponentAccessibilityProps {
  /** ARIA label */
  'aria-label'?: string;
  
  /** ARIA described by element IDs */
  'aria-describedby'?: string;
  
  /** ARIA labelled by element IDs */
  'aria-labelledby'?: string;
  
  /** ARIA required attribute */
  'aria-required'?: boolean;
  
  /** ARIA invalid attribute */
  'aria-invalid'?: boolean;
  
  /** ARIA expanded state */
  'aria-expanded'?: boolean;
  
  /** ARIA hidden state */
  'aria-hidden'?: boolean;
  
  /** Element role */
  role?: string;
  
  /** Tab index for keyboard navigation */
  tabIndex?: number;
  
  /** Auto focus on mount */
  autoFocus?: boolean;
  
  /** Screen reader only text */
  srOnlyText?: string;
}

/**
 * Theme-aware component interface
 */
export interface ThemeComponentProps extends BaseComponentProps {
  /** Component theme variant */
  theme?: 'light' | 'dark' | 'auto';
  
  /** Custom theme configuration */
  themeConfig?: Partial<ThemeConfig>;
  
  /** Theme context override */
  themeContext?: string;
}

// ============================================================================
// SPECIFIC COMPONENT INTERFACES
// ============================================================================

/**
 * Input component interface with enhanced validation
 */
export interface InputComponentProps extends FormComponentProps {
  /** Input type */
  type?: 'text' | 'password' | 'email' | 'url' | 'tel' | 'number' | 'search' | 'date' | 'datetime-local' | 'time';
  
  /** Input value */
  value?: string | number;
  
  /** Default value */
  defaultValue?: string | number;
  
  /** Change handler */
  onChange?: (value: string | number) => void;
  
  /** Blur handler */
  onBlur?: () => void;
  
  /** Focus handler */
  onFocus?: () => void;
  
  /** Left icon */
  leftIcon?: ComponentType<{ className?: string }>;
  
  /** Right icon */
  rightIcon?: ComponentType<{ className?: string }>;
  
  /** Input mask pattern */
  mask?: string;
  
  /** Auto complete attribute */
  autoComplete?: string;
  
  /** Input validation state */
  validationState?: 'valid' | 'invalid' | 'pending';
}

/**
 * Button component interface with loading states
 */
export interface ButtonComponentProps extends BaseComponentProps {
  /** Button variant */
  variant?: ComponentVariant;
  
  /** Button size */
  size?: ComponentSize;
  
  /** Button is loading */
  loading?: boolean;
  
  /** Button is disabled */
  disabled?: boolean;
  
  /** Button takes full width */
  fullWidth?: boolean;
  
  /** Click handler */
  onClick?: () => void | Promise<void>;
  
  /** Button type */
  type?: 'button' | 'submit' | 'reset';
  
  /** Left icon */
  leftIcon?: ComponentType<{ className?: string }>;
  
  /** Right icon */
  rightIcon?: ComponentType<{ className?: string }>;
  
  /** Loading text */
  loadingText?: string;
  
  /** Screen reader announcement on press */
  announceOnPress?: string;
}

/**
 * Table component interface for data display
 */
export interface TableComponentProps<T = any> extends BaseComponentProps {
  /** Table data */
  data: T[];
  
  /** Column definitions */
  columns: TableColumnDefinition<T>[];
  
  /** Table is loading */
  loading?: boolean;
  
  /** Row click handler */
  onRowClick?: (row: T, index: number) => void;
  
  /** Row selection handler */
  onRowSelect?: (selectedRows: T[]) => void;
  
  /** Table caption for accessibility */
  caption?: string;
  
  /** Empty state content */
  emptyState?: ReactNode;
  
  /** Enable virtualization for large datasets */
  virtualized?: boolean;
  
  /** Estimated row height for virtualization */
  estimatedRowHeight?: number;
  
  /** Pagination configuration */
  pagination?: TablePaginationProps;
  
  /** Sorting configuration */
  sorting?: TableSortingProps;
  
  /** Filtering configuration */
  filtering?: TableFilteringProps;
}

/**
 * Table column definition
 */
export interface TableColumnDefinition<T = any> {
  /** Column key */
  key: keyof T;
  
  /** Column header text */
  header: string;
  
  /** Custom cell renderer */
  cell?: (value: T[keyof T], row: T, index: number) => ReactNode;
  
  /** Column is sortable */
  sortable?: boolean;
  
  /** Column is filterable */
  filterable?: boolean;
  
  /** Column width */
  width?: string | number;
  
  /** Text alignment */
  align?: 'left' | 'center' | 'right';
  
  /** Column is sticky */
  sticky?: boolean;
  
  /** Accessibility label */
  'aria-label'?: string;
}

/**
 * Table pagination properties
 */
export interface TablePaginationProps {
  /** Current page */
  currentPage: number;
  
  /** Total pages */
  totalPages: number;
  
  /** Page size */
  pageSize: number;
  
  /** Total items */
  totalItems: number;
  
  /** Page change handler */
  onPageChange: (page: number) => void;
  
  /** Page size change handler */
  onPageSizeChange?: (size: number) => void;
  
  /** Show page size selector */
  showPageSizeSelector?: boolean;
  
  /** Show page info */
  showPageInfo?: boolean;
}

/**
 * Table sorting properties
 */
export interface TableSortingProps {
  /** Current sort field */
  field?: string;
  
  /** Current sort direction */
  direction?: 'asc' | 'desc';
  
  /** Sort change handler */
  onSortChange: (field: string, direction: 'asc' | 'desc') => void;
  
  /** Multiple column sorting */
  multiSort?: boolean;
}

/**
 * Table filtering properties
 */
export interface TableFilteringProps {
  /** Current search term */
  searchTerm?: string;
  
  /** Active filters */
  activeFilters: TableFilter[];
  
  /** Search change handler */
  onSearchChange: (term: string) => void;
  
  /** Filter change handler */
  onFilterChange: (filters: TableFilter[]) => void;
}

/**
 * Table filter definition
 */
export interface TableFilter {
  /** Filter field */
  field: string;
  
  /** Filter operator */
  operator: 'equals' | 'contains' | 'startsWith' | 'endsWith' | 'greaterThan' | 'lessThan';
  
  /** Filter value */
  value: any;
  
  /** Filter label */
  label?: string;
}

/**
 * Dialog component interface
 */
export interface DialogComponentProps extends BaseComponentProps {
  /** Dialog is open */
  open: boolean;
  
  /** Close handler */
  onClose: () => void;
  
  /** Dialog title */
  title?: string;
  
  /** Dialog description */
  description?: string;
  
  /** Dialog size */
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | 'full';
  
  /** Dialog position */
  position?: 'center' | 'top' | 'bottom';
  
  /** Close on overlay click */
  closeOnOverlayClick?: boolean;
  
  /** Close on escape key */
  closeOnEscape?: boolean;
  
  /** Prevent body scroll */
  preventScroll?: boolean;
  
  /** Initial focus element */
  initialFocus?: RefObject<HTMLElement>;
  
  /** Final focus element */
  finalFocus?: RefObject<HTMLElement>;
}

/**
 * Toast/Notification component interface
 */
export interface ToastComponentProps extends BaseComponentProps {
  /** Toast message */
  message: string;
  
  /** Toast type */
  type?: ComponentVariant;
  
  /** Toast duration in milliseconds */
  duration?: number;
  
  /** Toast is persistent */
  persistent?: boolean;
  
  /** Toast action */
  action?: ToastAction;
  
  /** Toast position */
  position?: 'top-left' | 'top-center' | 'top-right' | 'bottom-left' | 'bottom-center' | 'bottom-right';
  
  /** ARIA live region */
  'aria-live'?: 'off' | 'polite' | 'assertive';
  
  /** Announce message to screen readers */
  announceMessage?: boolean;
}

/**
 * Toast action definition
 */
export interface ToastAction {
  /** Action label */
  label: string;
  
  /** Action handler */
  handler: () => void;
  
  /** Action is destructive */
  destructive?: boolean;
}

/**
 * Navigation component interface
 */
export interface NavigationComponentProps extends BaseComponentProps {
  /** Navigation items */
  items: NavigationItem[];
  
  /** Navigation orientation */
  orientation?: 'horizontal' | 'vertical';
  
  /** Navigation variant */
  variant?: 'default' | 'pills' | 'underline' | 'sidebar';
  
  /** Is collapsible */
  collapsible?: boolean;
  
  /** Is collapsed */
  collapsed?: boolean;
  
  /** Toggle collapse handler */
  onToggleCollapse?: () => void;
  
  /** Skip link text */
  skipLinkText?: string;
}

/**
 * Navigation item definition
 */
export interface NavigationItem {
  /** Item ID */
  id: string;
  
  /** Item label */
  label: string;
  
  /** Item href */
  href?: string;
  
  /** Item icon */
  icon?: ComponentType<{ className?: string }>;
  
  /** Item badge */
  badge?: string | number;
  
  /** Item is disabled */
  disabled?: boolean;
  
  /** Item is external link */
  external?: boolean;
  
  /** Child items */
  children?: NavigationItem[];
  
  /** Is expanded */
  expanded?: boolean;
  
  /** Accessibility label */
  'aria-label'?: string;
  
  /** Accessibility description */
  'aria-description'?: string;
}

// ============================================================================
// FORM ARRAY COMPONENT INTERFACES
// ============================================================================

/**
 * Field array component interface for dynamic form fields
 * Used by components like LookupKeys that manage arrays of data
 */
export interface FieldArrayComponentProps<
  TFieldValues extends FieldValues = FieldValues,
  TFieldName extends Path<TFieldValues> = Path<TFieldValues>
> extends FormComponentProps {
  /** Field array return object from useFieldArray */
  fieldArray: UseFieldArrayReturn<TFieldValues, TFieldName>;
  
  /** Minimum number of items */
  minItems?: number;
  
  /** Maximum number of items */
  maxItems?: number;
  
  /** Add item handler */
  onAddItem?: (item: any) => void;
  
  /** Remove item handler */
  onRemoveItem?: (index: number) => void;
  
  /** Move item handler */
  onMoveItem?: (fromIndex: number, toIndex: number) => void;
  
  /** Item validation schema */
  itemSchema?: ZodSchema<any>;
  
  /** Default item factory */
  createDefaultItem?: () => any;
  
  /** Item renderer */
  renderItem?: (item: any, index: number, field: any) => ReactNode;
  
  /** Add button text */
  addButtonText?: string;
  
  /** Remove button text */
  removeButtonText?: string;
  
  /** Empty state message */
  emptyStateMessage?: string;
  
  /** Show item indices */
  showItemIndices?: boolean;
  
  /** Allow reordering */
  allowReordering?: boolean;
}

/**
 * Toggle/Switch component interface
 */
export interface ToggleComponentProps extends FormComponentProps {
  /** Toggle is checked */
  checked?: boolean;
  
  /** Default checked state */
  defaultChecked?: boolean;
  
  /** Change handler */
  onChange?: (checked: boolean) => void;
  
  /** Toggle size */
  size?: ComponentSize;
  
  /** Toggle color */
  color?: ComponentVariant;
  
  /** Toggle icon */
  icon?: ComponentType<{ className?: string }>;
  
  /** Toggle label position */
  labelPosition?: 'left' | 'right';
  
  /** Toggle description */
  description?: string;
}

/**
 * Select component interface
 */
export interface SelectComponentProps extends FormComponentProps {
  /** Select options */
  options: SelectOption[];
  
  /** Selected value */
  value?: string | number | (string | number)[];
  
  /** Default value */
  defaultValue?: string | number | (string | number)[];
  
  /** Change handler */
  onChange?: (value: string | number | (string | number)[]) => void;
  
  /** Multiple selection */
  multiple?: boolean;
  
  /** Searchable select */
  searchable?: boolean;
  
  /** Clearable select */
  clearable?: boolean;
  
  /** Create new options */
  creatable?: boolean;
  
  /** Loading state */
  loading?: boolean;
  
  /** Option renderer */
  renderOption?: (option: SelectOption) => ReactNode;
  
  /** Value renderer */
  renderValue?: (value: string | number) => ReactNode;
  
  /** No options message */
  noOptionsMessage?: string;
  
  /** Loading message */
  loadingMessage?: string;
}

/**
 * Select option definition
 */
export interface SelectOption {
  /** Option value */
  value: string | number;
  
  /** Option label */
  label: string;
  
  /** Option description */
  description?: string;
  
  /** Option icon */
  icon?: ComponentType<{ className?: string }>;
  
  /** Option is disabled */
  disabled?: boolean;
  
  /** Option group */
  group?: string;
  
  /** Custom data */
  data?: any;
}

// ============================================================================
// COMPONENT VARIANT INTERFACES
// ============================================================================

/**
 * Component styling variant interface using class-variance-authority
 */
export interface ComponentVariants {
  /** Base styles */
  base: string;
  
  /** Variant styles */
  variants: {
    variant?: Record<ComponentVariant, string>;
    size?: Record<ComponentSize, string>;
    state?: Record<string, string>;
  };
  
  /** Compound variants */
  compoundVariants?: Array<{
    variant?: ComponentVariant;
    size?: ComponentSize;
    state?: string;
    className: string;
  }>;
  
  /** Default variants */
  defaultVariants?: {
    variant?: ComponentVariant;
    size?: ComponentSize;
    state?: string;
  };
}

/**
 * Component with variants props
 */
export type ComponentWithVariants<T extends ComponentVariants> = 
  VariantProps<T> & BaseComponentProps;

// ============================================================================
// ANIMATION AND TRANSITION INTERFACES
// ============================================================================

/**
 * Animation configuration interface
 */
export interface AnimationConfig {
  /** Animation type */
  type: 'fade' | 'slide' | 'scale' | 'rotate' | 'bounce' | 'pulse';
  
  /** Animation duration in milliseconds */
  duration?: number;
  
  /** Animation delay in milliseconds */
  delay?: number;
  
  /** Animation easing function */
  easing?: 'linear' | 'ease' | 'ease-in' | 'ease-out' | 'ease-in-out' | string;
  
  /** Animation direction */
  direction?: 'normal' | 'reverse' | 'alternate' | 'alternate-reverse';
  
  /** Animation iteration count */
  iterations?: number | 'infinite';
  
  /** Animation fill mode */
  fillMode?: 'none' | 'forwards' | 'backwards' | 'both';
}

/**
 * Transition configuration interface
 */
export interface TransitionConfig {
  /** Transition property */
  property?: string | string[];
  
  /** Transition duration in milliseconds */
  duration?: number;
  
  /** Transition delay in milliseconds */
  delay?: number;
  
  /** Transition timing function */
  timingFunction?: string;
}

// ============================================================================
// ERROR BOUNDARY INTERFACES
// ============================================================================

/**
 * Error boundary component interface
 */
export interface ErrorBoundaryProps extends BaseComponentProps {
  /** Fallback component */
  fallback?: ComponentType<ErrorBoundaryFallbackProps>;
  
  /** Error handler */
  onError?: (error: Error, errorInfo: { componentStack: string }) => void;
  
  /** Reset error boundary */
  onReset?: () => void;
  
  /** Reset keys for automatic reset */
  resetKeys?: Array<string | number>;
  
  /** Reset on prop change */
  resetOnPropsChange?: boolean;
}

/**
 * Error boundary fallback props
 */
export interface ErrorBoundaryFallbackProps {
  /** Error object */
  error: Error;
  
  /** Reset function */
  resetErrorBoundary: () => void;
  
  /** Error info */
  errorInfo?: { componentStack: string };
}

// ============================================================================
// CONTEXT PROVIDER INTERFACES
// ============================================================================

/**
 * Theme provider interface
 */
export interface ThemeProviderProps extends BaseComponentProps {
  /** Theme configuration */
  theme: ThemeConfig;
  
  /** Default theme mode */
  defaultMode?: 'light' | 'dark' | 'system';
  
  /** Storage key for theme persistence */
  storageKey?: string;
  
  /** Enable system theme detection */
  enableSystem?: boolean;
  
  /** Disable transitions during theme change */
  disableTransitions?: boolean;
}

/**
 * Form provider interface
 */
export interface FormProviderProps extends BaseComponentProps {
  /** Form methods */
  methods: any; // React Hook Form methods
  
  /** Form schema */
  schema?: ZodSchema<any>;
  
  /** Form configuration */
  config?: FormProviderConfig;
}

/**
 * Form provider configuration
 */
export interface FormProviderConfig {
  /** Auto focus first field */
  autoFocusFirst?: boolean;
  
  /** Focus error on submit */
  focusErrorOnSubmit?: boolean;
  
  /** Scroll to error */
  scrollToError?: boolean;
  
  /** Validation mode */
  mode?: 'onChange' | 'onBlur' | 'onSubmit' | 'onTouched' | 'all';
  
  /** Re-validation mode */
  reValidateMode?: 'onChange' | 'onBlur' | 'onSubmit';
}

// ============================================================================
// TYPE EXPORTS
// ============================================================================

export type {
  // Re-export from react-hook-form for convenience
  UseFormRegister,
  Control,
  FieldError,
  FieldErrors,
  FieldValues,
  Path,
  UseFieldArrayReturn
} from 'react-hook-form';

export type {
  // Re-export from zod for convenience
  ZodSchema
} from 'zod';

export type {
  // Re-export from class-variance-authority
  VariantProps
} from 'class-variance-authority';