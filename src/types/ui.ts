/**
 * React UI Component Types for DreamFactory Admin Interface
 * 
 * Comprehensive type definitions for Headless UI components, Tailwind CSS styling,
 * React Hook Form integration, and WCAG 2.1 AA accessibility compliance.
 * 
 * Replaces Angular Material component types with modern React equivalents.
 */

import { ReactNode, ComponentType, ButtonHTMLAttributes, InputHTMLAttributes } from 'react';
import { VariantProps } from 'class-variance-authority';

// ============================================================================
// BASE COMPONENT TYPES
// ============================================================================

/**
 * Base component interface ensuring accessibility compliance
 * Replaces Angular Material base component interface
 */
export interface BaseComponent {
  id?: string;
  className?: string;
  children?: ReactNode;
  variant?: ComponentVariant;
  size?: ComponentSize;
  disabled?: boolean;
  loading?: boolean;
  'data-testid'?: string;
  
  // WCAG 2.1 AA accessibility props
  'aria-label'?: string;
  'aria-describedby'?: string;
  'aria-labelledby'?: string;
  'aria-required'?: boolean;
  'aria-expanded'?: boolean;
  'aria-hidden'?: boolean;
  role?: string;
}

/**
 * Component variants for consistent design system
 * Enhanced from Angular Material theming to Tailwind CSS variants
 */
export type ComponentVariant = 
  | 'primary' 
  | 'secondary' 
  | 'success' 
  | 'warning' 
  | 'error' 
  | 'ghost' 
  | 'outline'
  | 'filled'
  | 'minimal';

/**
 * Component sizes following WCAG touch target requirements
 * Minimum 44x44px for touch targets
 */
export type ComponentSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl';

// ============================================================================
// CLASS-VARIANCE-AUTHORITY INTEGRATION
// ============================================================================

/**
 * Dynamic styling configuration for component states
 * Integrates class-variance-authority with Tailwind CSS
 */
export interface ComponentVariantConfig {
  base: string;
  variants: {
    variant?: Record<ComponentVariant, string>;
    size?: Record<ComponentSize, string>;
    state?: Record<ComponentState, string>;
    intent?: Record<ComponentIntent, string>;
  };
  compoundVariants?: Array<{
    variant?: ComponentVariant;
    size?: ComponentSize;
    state?: ComponentState;
    className: string;
  }>;
  defaultVariants?: {
    variant?: ComponentVariant;
    size?: ComponentSize;
    state?: ComponentState;
  };
}

/**
 * Component states for dynamic styling
 */
export type ComponentState = 
  | 'idle'
  | 'loading'
  | 'success'
  | 'error'
  | 'warning'
  | 'disabled'
  | 'focused'
  | 'active'
  | 'hover';

/**
 * Component intent for semantic styling
 */
export type ComponentIntent = 
  | 'neutral'
  | 'positive'
  | 'negative'
  | 'informative'
  | 'warning';

// ============================================================================
// FORM COMPONENT TYPES
// ============================================================================

/**
 * Form field component interface with React Hook Form integration
 * Replaces Angular Reactive Forms with React Hook Form + Zod validation
 */
export interface FormFieldComponent extends BaseComponent {
  label: string;
  name: string;
  required?: boolean;
  error?: string;
  hint?: string;
  placeholder?: string;
  autoComplete?: string;
  
  // React Hook Form integration
  register?: any; // React Hook Form register function
  control?: any;  // React Hook Form control object
  
  // Enhanced validation
  validation?: FieldValidationRules;
  
  // Accessibility enhancements
  helpText?: string;
  errorId?: string;
  hintId?: string;
}

/**
 * Field validation rules integrated with Zod schemas
 */
export interface FieldValidationRules {
  required?: boolean | string;
  minLength?: number | { value: number; message: string };
  maxLength?: number | { value: number; message: string };
  pattern?: RegExp | { value: RegExp; message: string };
  min?: number | { value: number; message: string };
  max?: number | { value: number; message: string };
  validate?: Record<string, (value: any) => boolean | string>;
  
  // Zod schema integration
  schema?: any; // Zod schema
}

/**
 * Select field component with enhanced accessibility
 * Replaces Angular Material Select with Headless UI Listbox
 */
export interface SelectFieldComponent extends FormFieldComponent {
  options: SelectOption[];
  multiple?: boolean;
  searchable?: boolean;
  clearable?: boolean;
  createable?: boolean;
  
  // Headless UI integration
  onSelectionChange?: (value: any) => void;
  renderOption?: (option: SelectOption) => ReactNode;
  
  // Accessibility
  menuRole?: 'listbox' | 'menu';
  optionRole?: 'option' | 'menuitem';
}

/**
 * Select option with enhanced metadata
 */
export interface SelectOption {
  value: string | number;
  label: string;
  description?: string;
  icon?: ComponentType<{ className?: string }>;
  disabled?: boolean;
  group?: string;
  
  // Accessibility
  'aria-label'?: string;
  'aria-description'?: string;
}

/**
 * Button component interface with WCAG compliance
 * Replaces Angular Material Button with accessible React button
 */
export interface ButtonComponent extends BaseComponent, ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ComponentVariant;
  size?: ComponentSize;
  loading?: boolean;
  disabled?: boolean;
  fullWidth?: boolean;
  
  // Enhanced accessibility
  announceOnPress?: string; // Screen reader announcement
  loadingText?: string;
  
  // Icon integration
  leftIcon?: ComponentType<{ className?: string }>;
  rightIcon?: ComponentType<{ className?: string }>;
}

/**
 * Input component interface with validation
 * Replaces Angular Material Input with React Hook Form integration
 */
export interface InputComponent extends FormFieldComponent, InputHTMLAttributes<HTMLInputElement> {
  type?: 'text' | 'password' | 'email' | 'url' | 'tel' | 'number' | 'search' | 'date' | 'datetime-local' | 'time';
  
  // Enhanced features
  leftIcon?: ComponentType<{ className?: string }>;
  rightIcon?: ComponentType<{ className?: string }>;
  mask?: string;
  
  // Validation state styling
  validationState?: 'valid' | 'invalid' | 'pending';
}

// ============================================================================
// TABLE AND DATA DISPLAY TYPES
// ============================================================================

/**
 * Table component for database schema display
 * Replaces Angular Material Table with React table implementation
 */
export interface TableComponent<T = any> extends BaseComponent {
  data: T[];
  columns: ColumnDefinition<T>[];
  loading?: boolean;
  onRowClick?: (row: T) => void;
  onRowSelect?: (selectedRows: T[]) => void;
  pagination?: PaginationConfig;
  filtering?: FilterConfig;
  sorting?: SortConfig;
  caption?: string;
  emptyState?: ReactNode;
  
  // Accessibility
  'aria-label'?: string;
  'aria-describedby'?: string;
  
  // Performance optimization for large datasets
  virtualized?: boolean;
  estimatedRowHeight?: number;
}

/**
 * Table column definition with enhanced features
 */
export interface ColumnDefinition<T = any> {
  key: keyof T;
  header: string;
  cell?: (value: T[keyof T], row: T) => ReactNode;
  sortable?: boolean;
  filterable?: boolean;
  width?: string;
  align?: 'left' | 'center' | 'right';
  sticky?: boolean;
  
  // Accessibility
  'aria-label'?: string;
  'aria-sort'?: 'ascending' | 'descending' | 'none';
}

/**
 * Pagination configuration with accessibility
 */
export interface PaginationConfig {
  currentPage: number;
  totalPages: number;
  pageSize: number;
  totalItems: number;
  onPageChange: (page: number) => void;
  onPageSizeChange?: (size: number) => void;
  showPageSizeSelector?: boolean;
  showPageInfo?: boolean;
  
  // Accessibility
  'aria-label'?: string;
  pageLabel?: (page: number) => string;
}

/**
 * Filtering configuration
 */
export interface FilterConfig {
  searchTerm?: string;
  activeFilters: Filter[];
  onSearchChange: (term: string) => void;
  onFilterChange: (filters: Filter[]) => void;
  quickFilters?: QuickFilter[];
  
  // Accessibility
  searchLabel?: string;
  filterLabel?: string;
}

/**
 * Filter definition
 */
export interface Filter {
  field: string;
  operator: FilterOperator;
  value: any;
  label?: string;
}

export type FilterOperator = 
  | 'equals' 
  | 'contains' 
  | 'startsWith' 
  | 'endsWith' 
  | 'greaterThan' 
  | 'lessThan' 
  | 'between' 
  | 'in' 
  | 'notIn'
  | 'isNull'
  | 'isNotNull';

/**
 * Quick filter definition
 */
export interface QuickFilter {
  id: string;
  label: string;
  filter: Filter;
  active?: boolean;
}

/**
 * Sort configuration
 */
export interface SortConfig {
  field?: string;
  direction?: 'asc' | 'desc';
  onSortChange: (field: string, direction: 'asc' | 'desc') => void;
  
  // Multiple column sorting
  multiSort?: boolean;
  sortState?: SortState[];
}

export interface SortState {
  field: string;
  direction: 'asc' | 'desc';
  priority: number;
}

// ============================================================================
// NAVIGATION AND LAYOUT TYPES
// ============================================================================

/**
 * Navigation component interface
 * Replaces Angular Router with Next.js navigation
 */
export interface NavigationComponent extends BaseComponent {
  items: NavigationItem[];
  orientation?: 'horizontal' | 'vertical';
  variant?: 'default' | 'pills' | 'underline' | 'sidebar';
  
  // Mobile responsiveness
  collapsible?: boolean;
  collapsed?: boolean;
  onToggleCollapse?: () => void;
  
  // Accessibility
  'aria-label'?: string;
  skipLinkText?: string;
}

/**
 * Navigation item definition
 */
export interface NavigationItem {
  id: string;
  label: string;
  href?: string;
  icon?: ComponentType<{ className?: string }>;
  badge?: string | number;
  disabled?: boolean;
  external?: boolean;
  
  // Nested navigation
  children?: NavigationItem[];
  expanded?: boolean;
  
  // Accessibility
  'aria-label'?: string;
  'aria-description'?: string;
}

/**
 * Dialog component interface
 * Replaces Angular Material Dialog with Headless UI Dialog
 */
export interface DialogComponent extends BaseComponent {
  open: boolean;
  onClose: () => void;
  title?: string;
  description?: string;
  
  // Dialog variants
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | 'full';
  position?: 'center' | 'top' | 'bottom';
  
  // Behavior
  closeOnOverlayClick?: boolean;
  closeOnEscape?: boolean;
  preventScroll?: boolean;
  
  // Accessibility
  initialFocus?: React.RefObject<HTMLElement>;
  finalFocus?: React.RefObject<HTMLElement>;
}

/**
 * Toast/Notification component interface
 * Replaces Angular Material Snackbar
 */
export interface ToastComponent extends BaseComponent {
  message: string;
  type?: ComponentVariant;
  duration?: number;
  persistent?: boolean;
  
  // Actions
  action?: {
    label: string;
    handler: () => void;
  };
  
  // Positioning
  position?: 'top-left' | 'top-center' | 'top-right' | 'bottom-left' | 'bottom-center' | 'bottom-right';
  
  // Accessibility
  'aria-live'?: 'off' | 'polite' | 'assertive';
  announceMessage?: boolean;
}

// ============================================================================
// RESPONSIVE DESIGN TYPES
// ============================================================================

/**
 * Responsive breakpoints following Tailwind CSS conventions
 */
export interface ResponsiveBreakpoints {
  xs: string;    // 475px
  sm: string;    // 640px
  md: string;    // 768px
  lg: string;    // 1024px
  xl: string;    // 1280px
  '2xl': string; // 1536px
  '3xl': string; // 1920px
}

/**
 * Responsive value type for dynamic sizing
 */
export type ResponsiveValue<T> = T | {
  xs?: T;
  sm?: T;
  md?: T;
  lg?: T;
  xl?: T;
  '2xl'?: T;
  '3xl'?: T;
};

/**
 * Grid system configuration
 */
export interface GridConfig {
  columns?: ResponsiveValue<number>;
  gap?: ResponsiveValue<ComponentSize>;
  rows?: ResponsiveValue<number>;
  autoFit?: boolean;
  autoFill?: boolean;
  
  // Grid item configuration
  span?: ResponsiveValue<number>;
  start?: ResponsiveValue<number>;
  end?: ResponsiveValue<number>;
}

// ============================================================================
// THEME AND DESIGN SYSTEM TYPES
// ============================================================================

/**
 * Theme configuration interface
 * Supports light/dark/system modes with WCAG compliance
 */
export interface ThemeConfig {
  mode: 'light' | 'dark' | 'system';
  colors: ColorPalette;
  typography: TypographyScale;
  spacing: SpacingScale;
  shadows: ShadowScale;
  borders: BorderConfig;
  accessibility: AccessibilityConfig;
}

/**
 * Color palette with WCAG 2.1 AA compliance
 */
export interface ColorPalette {
  primary: ColorScale;
  secondary: ColorScale;
  success: ColorScale;
  warning: ColorScale;
  error: ColorScale;
  neutral: ColorScale;
  
  // Database type colors (accessible)
  database: {
    mysql: string;
    postgresql: string;
    mongodb: string;
    sqlserver: string;
    oracle: string;
    snowflake: string;
    sqlite: string;
  };
}

/**
 * Color scale with contrast ratios
 */
export interface ColorScale {
  50: string;
  100: string;
  200: string;
  300: string;
  400: string;
  500: string;   // Primary shade
  600: string;
  700: string;
  800: string;
  900: string;
  950: string;
}

/**
 * Typography scale configuration
 */
export interface TypographyScale {
  fontFamily: {
    sans: string[];
    mono: string[];
    display: string[];
  };
  fontSize: {
    xs: [string, { lineHeight: string }];
    sm: [string, { lineHeight: string }];
    base: [string, { lineHeight: string }];
    lg: [string, { lineHeight: string }];    // Large text threshold (18px)
    xl: [string, { lineHeight: string }];
    '2xl': [string, { lineHeight: string }];
    '3xl': [string, { lineHeight: string }];
    '4xl': [string, { lineHeight: string }];
    '5xl': [string, { lineHeight: string }];
    '6xl': [string, { lineHeight: string }];
  };
  fontWeight: {
    thin: string;
    extralight: string;
    light: string;
    normal: string;
    medium: string;
    semibold: string;
    bold: string;      // 14pt bold = 19px CSS (Large text threshold)
    extrabold: string;
    black: string;
  };
}

/**
 * Spacing scale configuration
 */
export interface SpacingScale {
  px: string;
  0: string;
  0.5: string;
  1: string;
  1.5: string;
  2: string;
  2.5: string;
  3: string;
  3.5: string;
  4: string;
  5: string;
  6: string;
  8: string;
  10: string;
  12: string;
  16: string;
  20: string;
  24: string;
  32: string;
  40: string;
  48: string;
  56: string;
  64: string;
  72: string;
  80: string;
  96: string;
}

/**
 * Shadow scale configuration
 */
export interface ShadowScale {
  sm: string;
  default: string;
  md: string;
  lg: string;
  xl: string;
  '2xl': string;
  inner: string;
  none: string;
}

/**
 * Border configuration
 */
export interface BorderConfig {
  width: {
    0: string;
    1: string;
    2: string;
    4: string;
    8: string;
  };
  radius: {
    none: string;
    sm: string;
    default: string;
    md: string;
    lg: string;
    xl: string;
    '2xl': string;
    '3xl': string;
    full: string;
  };
}

/**
 * Accessibility configuration for WCAG 2.1 AA compliance
 */
export interface AccessibilityConfig {
  focusRing: {
    primary: FocusRingConfig;
    error: FocusRingConfig;
    success: FocusRingConfig;
  };
  contrastRatios: {
    text: {
      normal: number;    // 4.5:1 minimum
      large: number;     // 3:1 minimum
      enhanced: number;  // 7:1 for AAA
    };
    ui: {
      component: number; // 3:1 minimum
      graphic: number;   // 3:1 minimum
    };
  };
  touchTargets: {
    minimum: string;     // 44px minimum
    recommended: string; // 48px recommended
  };
}

/**
 * Focus ring configuration
 */
export interface FocusRingConfig {
  width: string;
  style: string;
  color: string;
  offset: string;
}

// ============================================================================
// FORM SCHEMA TYPES (Enhanced from Technical Specification)
// ============================================================================

/**
 * Dynamic form schema for database configuration
 * Integrates with React Hook Form and Zod validation
 */
export interface FormSchema {
  id: string;
  title: string;
  description?: string;
  fields: FormField[];
  validation?: FormValidation;
  layout?: FormLayout;
  submission?: FormSubmission;
  styling?: FormStyling;
}

/**
 * Form field definition with comprehensive configuration
 */
export interface FormField {
  id: string;
  name: string;
  type: FormFieldType;
  label: string;
  placeholder?: string;
  description?: string;
  required?: boolean;
  disabled?: boolean;
  readonly?: boolean;
  hidden?: boolean;
  
  // Field-specific configuration
  options?: SelectOption[];
  validation?: FieldValidationRules;
  conditional?: ConditionalLogic;
  formatting?: FieldFormatting;
  
  // Layout configuration
  grid?: GridConfig;
  section?: string;
  order?: number;
  
  // Accessibility
  ariaLabel?: string;
  ariaDescribedBy?: string;
  helpText?: string;
}

/**
 * Form field types supporting database configuration
 */
export type FormFieldType = 
  | 'text'
  | 'password'
  | 'email'
  | 'url'
  | 'tel'
  | 'number'
  | 'range'
  | 'select'
  | 'multiselect'
  | 'checkbox'
  | 'radio'
  | 'switch'
  | 'textarea'
  | 'file'
  | 'date'
  | 'datetime-local'
  | 'time'
  | 'month'
  | 'week'
  | 'color'
  | 'json'
  | 'code'
  | 'markdown'
  | 'tags'
  | 'rating'
  | 'slider'
  | 'toggle'
  | 'button-group';

/**
 * Conditional logic for dynamic forms
 */
export interface ConditionalLogic {
  conditions: FormCondition[];
  operator: 'AND' | 'OR';
  action: ConditionalAction;
}

export interface FormCondition {
  field: string;
  operator: ComparisonOperator;
  value: any;
}

export type ComparisonOperator = 
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
  | 'isEmpty'
  | 'isNotEmpty'
  | 'isNull'
  | 'isNotNull';

export type ConditionalAction = 
  | 'show'
  | 'hide'
  | 'enable'
  | 'disable'
  | 'require'
  | 'optional'
  | 'focus'
  | 'clear';

/**
 * Field formatting configuration
 */
export interface FieldFormatting {
  mask?: string;
  transform?: TextTransform;
  currency?: CurrencyConfig;
  number?: NumberConfig;
  date?: DateConfig;
}

export type TextTransform = 
  | 'uppercase'
  | 'lowercase'
  | 'capitalize'
  | 'camelCase'
  | 'pascalCase'
  | 'kebabCase'
  | 'snakeCase';

export interface CurrencyConfig {
  currency: string;
  locale?: string;
  minimumFractionDigits?: number;
  maximumFractionDigits?: number;
}

export interface NumberConfig {
  locale?: string;
  minimumIntegerDigits?: number;
  minimumFractionDigits?: number;
  maximumFractionDigits?: number;
  useGrouping?: boolean;
}

export interface DateConfig {
  format: string;
  locale?: string;
  timezone?: string;
  minDate?: string;
  maxDate?: string;
  excludeDates?: string[];
  includeDates?: string[];
}

/**
 * Form validation configuration
 */
export interface FormValidation {
  validationMode?: ValidationMode;
  reValidateMode?: ValidationMode;
  shouldFocusError?: boolean;
  shouldUnregister?: boolean;
  shouldUseNativeValidation?: boolean;
  criteriaMode?: 'firstError' | 'all';
  delayError?: number;
}

export type ValidationMode = 
  | 'onSubmit'
  | 'onBlur'
  | 'onChange'
  | 'onTouched'
  | 'all';

/**
 * Form layout configuration
 */
export interface FormLayout {
  type: LayoutType;
  columns?: number;
  gap?: ComponentSize;
  sections?: FormSection[];
  responsive?: ResponsiveLayout;
}

export type LayoutType = 
  | 'single-column'
  | 'two-column'
  | 'three-column'
  | 'grid'
  | 'tabs'
  | 'accordion'
  | 'wizard'
  | 'inline';

export interface FormSection {
  id: string;
  title: string;
  description?: string;
  collapsible?: boolean;
  collapsed?: boolean;
  fields: string[];
  order?: number;
}

export interface ResponsiveLayout {
  xs?: LayoutConfig;
  sm?: LayoutConfig;
  md?: LayoutConfig;
  lg?: LayoutConfig;
  xl?: LayoutConfig;
}

export interface LayoutConfig {
  columns: number;
  type?: LayoutType;
  gap?: ComponentSize;
}

/**
 * Form submission configuration
 */
export interface FormSubmission {
  method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  action: string;
  enctype?: 'application/x-www-form-urlencoded' | 'multipart/form-data' | 'application/json';
  target?: string;
  onSuccess?: SubmissionCallback;
  onError?: SubmissionCallback;
  transform?: DataTransform;
}

export interface SubmissionCallback {
  action: CallbackAction;
  params?: Record<string, any>;
}

export type CallbackAction = 
  | 'redirect'
  | 'reload'
  | 'reset'
  | 'message'
  | 'callback'
  | 'modal'
  | 'none';

export interface DataTransform {
  include?: string[];
  exclude?: string[];
  rename?: Record<string, string>;
  format?: Record<string, TransformFunction>;
}

export type TransformFunction = 
  | 'trim'
  | 'lowercase'
  | 'uppercase'
  | 'capitalize'
  | 'slugify'
  | 'sanitize'
  | 'encrypt'
  | 'hash';

/**
 * Form styling configuration
 */
export interface FormStyling {
  theme?: FormTheme;
  size?: ComponentSize;
  variant?: ComponentVariant;
  spacing?: ComponentSize;
  borders?: boolean;
  shadows?: boolean;
  rounded?: boolean;
  customCSS?: string;
}

export type FormTheme = 
  | 'default'
  | 'minimal'
  | 'card'
  | 'inline'
  | 'floating'
  | 'outline'
  | 'filled';

// ============================================================================
// UTILITY TYPES
// ============================================================================

/**
 * Component props with variant support
 */
export type VariantComponentProps<T extends ComponentVariantConfig> = VariantProps<T> & BaseComponent;

/**
 * Polymorphic component props
 */
export type PolymorphicProps<T extends React.ElementType> = {
  as?: T;
} & React.ComponentPropsWithoutRef<T> & BaseComponent;

/**
 * Event handler types for form interactions
 */
export interface FormEventHandlers {
  onChange?: (value: any) => void;
  onBlur?: (event: React.FocusEvent) => void;
  onFocus?: (event: React.FocusEvent) => void;
  onSubmit?: (data: any) => void | Promise<void>;
  onError?: (errors: any) => void;
  onReset?: () => void;
}

/**
 * Loading state types for async operations
 */
export interface LoadingState {
  loading: boolean;
  error?: string | null;
  progress?: number;
  message?: string;
}

/**
 * Data fetching state for React Query integration
 */
export interface DataState<T = any> extends LoadingState {
  data?: T;
  isLoading: boolean;
  isError: boolean;
  isSuccess: boolean;
  refetch?: () => void;
  mutate?: (data: T) => void;
}

// ============================================================================
// TYPE EXPORTS
// ============================================================================

export type {
  // Re-export common types for convenience
  ReactNode,
  ComponentType,
  ButtonHTMLAttributes,
  InputHTMLAttributes,
};

// Default export for the main UI configuration
export interface UIConfig {
  theme: ThemeConfig;
  breakpoints: ResponsiveBreakpoints;
  accessibility: AccessibilityConfig;
  components: {
    button: ComponentVariantConfig;
    input: ComponentVariantConfig;
    select: ComponentVariantConfig;
    table: ComponentVariantConfig;
    dialog: ComponentVariantConfig;
    toast: ComponentVariantConfig;
  };
}