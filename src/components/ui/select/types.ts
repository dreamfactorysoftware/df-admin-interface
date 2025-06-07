/**
 * Select Component Type Definitions for DreamFactory Admin Interface
 * 
 * Comprehensive TypeScript type definitions for all select component variants including
 * SelectOption, SelectProps, AutocompleteProps, and MultiSelectProps interfaces.
 * 
 * Provides typing for React 19/Next.js 15.1 compatibility with strict type safety,
 * React Hook Form integration, and WCAG 2.1 AA accessibility compliance.
 * 
 * Migrated from Angular Material Select to Headless UI-based React components
 * with support for complex value transformations and database-specific options.
 */

import { ReactNode, ComponentType, KeyboardEvent, FocusEvent } from 'react';
import { 
  BaseComponent, 
  ComponentVariant, 
  ComponentSize, 
  FormFieldComponent,
  LoadingState,
  ComponentState,
  ComponentIntent 
} from '../../../types/ui';

// ============================================================================
// CORE SELECT TYPES
// ============================================================================

/**
 * Base select option interface with enhanced metadata
 * Supports complex data structures from DreamFactory database schemas
 */
export interface SelectOption<T = string | number> {
  /** Unique identifier for the option */
  value: T;
  
  /** Display text for the option */
  label: string;
  
  /** Optional description for additional context */
  description?: string;
  
  /** Icon component for visual enhancement */
  icon?: ComponentType<{ className?: string; size?: ComponentSize }>;
  
  /** Whether the option is disabled */
  disabled?: boolean;
  
  /** Group identifier for option categorization */
  group?: string;
  
  /** Additional metadata for complex option types */
  metadata?: OptionMetadata;
  
  /** Custom rendering data */
  data?: Record<string, any>;
  
  // WCAG 2.1 AA Accessibility
  'aria-label'?: string;
  'aria-description'?: string;
  'aria-selected'?: boolean;
}

/**
 * Extended metadata for complex option types
 * Supports database service types and configuration options
 */
export interface OptionMetadata {
  /** Database service type for service options */
  serviceType?: 'mysql' | 'postgresql' | 'mongodb' | 'sqlserver' | 'oracle' | 'snowflake' | 'sqlite';
  
  /** Color coding for visual categorization */
  color?: string;
  
  /** Badge text for status indicators */
  badge?: string | number;
  
  /** Tooltip content */
  tooltip?: string;
  
  /** Sort priority for option ordering */
  sortPriority?: number;
  
  /** Whether option represents a new/create action */
  isCreateAction?: boolean;
  
  /** External link for additional information */
  externalLink?: string;
}

/**
 * Value transformation types for Angular migration compatibility
 * Supports bitmask, array, and string conversions from existing Angular forms
 */
export type ValueTransformType = 'string' | 'number' | 'array' | 'bitmask' | 'json' | 'custom';

export interface ValueTransformation<T = any> {
  /** Type of transformation to apply */
  type: ValueTransformType;
  
  /** Transform function for outbound values (to API) */
  toValue?: (displayValue: any) => T;
  
  /** Transform function for inbound values (from API) */
  fromValue?: (apiValue: T) => any;
  
  /** Bitmask configuration for flag-based values */
  bitmask?: BitmaskConfig;
  
  /** Custom transformation function */
  custom?: {
    encode: (value: any) => T;
    decode: (value: T) => any;
    validate?: (value: any) => boolean;
  };
}

export interface BitmaskConfig {
  /** Mapping of option values to bit positions */
  mapping: Record<string | number, number>;
  
  /** Maximum bit value supported */
  maxBits?: number;
  
  /** Whether to use string representation */
  useStringValues?: boolean;
}

// ============================================================================
// LOADING AND ERROR STATES
// ============================================================================

/**
 * Enhanced loading state for async select operations
 */
export interface SelectLoadingState extends LoadingState {
  /** Whether options are being loaded */
  loadingOptions?: boolean;
  
  /** Whether search results are loading */
  loadingSearch?: boolean;
  
  /** Whether validation is in progress */
  validating?: boolean;
  
  /** Debounce delay for search operations */
  searchDebounce?: number;
  
  /** Progress indicator for large datasets */
  loadProgress?: {
    loaded: number;
    total: number;
    percentage: number;
  };
}

/**
 * Error state configuration for select components
 */
export interface SelectErrorState {
  /** Whether component is in error state */
  hasError: boolean;
  
  /** Error message to display */
  message?: string;
  
  /** Error type classification */
  type?: 'validation' | 'network' | 'permission' | 'data' | 'timeout';
  
  /** Whether error is recoverable */
  recoverable?: boolean;
  
  /** Retry function for recoverable errors */
  onRetry?: () => void;
  
  /** Additional error details */
  details?: Record<string, any>;
}

// ============================================================================
// THEME VARIANTS
// ============================================================================

/**
 * Select-specific theme variants for consistent styling
 * Integrates with class-variance-authority for dynamic Tailwind CSS composition
 */
export interface SelectThemeVariants {
  /** Visual variant for different contexts */
  variant?: ComponentVariant;
  
  /** Size configuration */
  size?: ComponentSize;
  
  /** Current state for dynamic styling */
  state?: ComponentState;
  
  /** Intent for semantic coloring */
  intent?: ComponentIntent;
  
  /** Border style configuration */
  border?: 'none' | 'subtle' | 'default' | 'strong';
  
  /** Background style */
  background?: 'transparent' | 'subtle' | 'default' | 'strong';
  
  /** Corner radius configuration */
  radius?: 'none' | 'sm' | 'md' | 'lg' | 'full';
}

/**
 * Dynamic styling configuration for select states
 */
export interface SelectStyleConfig {
  /** Base container styles */
  container?: string;
  
  /** Trigger button styles */
  trigger?: string;
  
  /** Dropdown menu styles */
  dropdown?: string;
  
  /** Individual option styles */
  option?: string;
  
  /** Selected option styles */
  selectedOption?: string;
  
  /** Group header styles */
  groupHeader?: string;
  
  /** Loading indicator styles */
  loading?: string;
  
  /** Error state styles */
  error?: string;
  
  /** Focus ring styles for accessibility */
  focusRing?: string;
}

// ============================================================================
// BASE SELECT PROPS
// ============================================================================

/**
 * Core select component properties
 * Extends BaseComponent and FormFieldComponent for consistency
 */
export interface SelectProps<T = any> extends FormFieldComponent {
  /** Array of available options */
  options: SelectOption<T>[];
  
  /** Currently selected value(s) */
  value?: T | T[];
  
  /** Change handler for value updates */
  onChange: (value: T | T[] | null) => void;
  
  /** Blur event handler */
  onBlur?: (event: FocusEvent<HTMLElement>) => void;
  
  /** Focus event handler */
  onFocus?: (event: FocusEvent<HTMLElement>) => void;
  
  /** Whether multiple selection is allowed */
  multiple?: boolean;
  
  /** Whether the field can be cleared */
  clearable?: boolean;
  
  /** Placeholder text when no selection */
  placeholder?: string;
  
  /** Loading state configuration */
  loading?: boolean | SelectLoadingState;
  
  /** Error state configuration */
  error?: string | SelectErrorState;
  
  /** Theme and styling variants */
  variants?: SelectThemeVariants;
  
  /** Custom style overrides */
  styles?: SelectStyleConfig;
  
  /** Value transformation configuration */
  transform?: ValueTransformation<T>;
  
  /** Whether to close dropdown on selection */
  closeOnSelect?: boolean;
  
  /** Maximum height for dropdown menu */
  maxDropdownHeight?: string | number;
  
  /** Virtualization settings for large option lists */
  virtualized?: {
    enabled: boolean;
    itemHeight: number;
    overscan?: number;
  };
  
  // React Hook Form Integration
  /** React Hook Form register function */
  register?: any;
  
  /** React Hook Form control object */
  control?: any;
  
  /** Form validation rules */
  rules?: Record<string, any>;
  
  // Accessibility enhancements
  'aria-label'?: string;
  'aria-describedby'?: string;
  'aria-labelledby'?: string;
  'aria-required'?: boolean;
  'aria-invalid'?: boolean;
  'aria-expanded'?: boolean;
  'aria-haspopup'?: boolean;
  
  /** Screen reader announcements */
  announcements?: {
    selection?: (option: SelectOption<T>) => string;
    deselection?: (option: SelectOption<T>) => string;
    cleared?: string;
    opened?: string;
    closed?: string;
  };
}

// ============================================================================
// AUTOCOMPLETE PROPS
// ============================================================================

/**
 * Autocomplete/searchable select component properties
 * Extends SelectProps with search-specific functionality
 */
export interface AutocompleteProps<T = any> extends Omit<SelectProps<T>, 'options'> {
  /** Whether search functionality is enabled */
  searchable?: boolean;
  
  /** Static options for local filtering */
  options?: SelectOption<T>[];
  
  /** Async function for fetching options based on search term */
  asyncOptions?: (searchTerm: string) => Promise<SelectOption<T>[]>;
  
  /** Search input change handler */
  onSearch?: (searchTerm: string) => void;
  
  /** Current search term */
  searchTerm?: string;
  
  /** Minimum characters required before search */
  minSearchLength?: number;
  
  /** Debounce delay for search requests (ms) */
  searchDebounce?: number;
  
  /** Whether to show create option for new values */
  allowCreate?: boolean;
  
  /** Custom create option renderer */
  createOptionRenderer?: (searchTerm: string) => ReactNode;
  
  /** Handler for creating new options */
  onCreateOption?: (value: string) => void | Promise<void>;
  
  /** Whether to highlight search terms in results */
  highlightMatch?: boolean;
  
  /** Custom search filter function for local options */
  filterFunction?: (option: SelectOption<T>, searchTerm: string) => boolean;
  
  /** Empty state when no search results */
  emptySearchText?: string;
  
  /** Loading text during search */
  searchingText?: string;
  
  /** Error handling for failed searches */
  onSearchError?: (error: Error) => void;
  
  /** Whether to clear search on selection */
  clearSearchOnSelect?: boolean;
  
  /** Search input placeholder */
  searchPlaceholder?: string;
  
  /** Whether search is case sensitive */
  caseSensitive?: boolean;
}

// ============================================================================
// MULTI-SELECT PROPS
// ============================================================================

/**
 * Multi-select component properties
 * Extends SelectProps with multiple selection features
 */
export interface MultiSelectProps<T = any> extends Omit<SelectProps<T>, 'value' | 'onChange' | 'multiple'> {
  /** Array of selected values */
  value?: T[];
  
  /** Change handler for multi-select values */
  onChange: (values: T[]) => void;
  
  /** Maximum number of selections allowed */
  maxSelections?: number;
  
  /** Custom chip/tag renderer for selected items */
  chipRenderer?: (option: SelectOption<T>, onRemove: () => void) => ReactNode;
  
  /** Whether chips can be removed */
  removable?: boolean;
  
  /** Whether to show "Select All" option */
  showSelectAll?: boolean;
  
  /** Text for "Select All" option */
  selectAllText?: string;
  
  /** Text for "Clear All" action */
  clearAllText?: string;
  
  /** Whether to show selection count */
  showSelectionCount?: boolean;
  
  /** Format function for selection count display */
  selectionCountFormatter?: (count: number, total: number) => string;
  
  /** Whether to close dropdown after each selection */
  closeOnMultiSelect?: boolean;
  
  /** Chip/tag size configuration */
  chipSize?: ComponentSize;
  
  /** Chip/tag variant configuration */
  chipVariant?: ComponentVariant;
  
  /** Maximum number of chips to display before showing count */
  maxChipsDisplayed?: number;
  
  /** Custom overflow indicator when chips exceed max display */
  overflowRenderer?: (hiddenCount: number) => ReactNode;
  
  /** Whether chips can be reordered */
  sortable?: boolean;
  
  /** Handler for chip reordering */
  onReorder?: (newOrder: T[]) => void;
  
  /** Validation for selection limits */
  onMaxSelectionsReached?: () => void;
  
  /** Group selection behavior */
  groupSelection?: {
    enabled: boolean;
    selectGroupText?: string;
    deselectGroupText?: string;
  };
}

// ============================================================================
// SPECIALIZED SELECT TYPES
// ============================================================================

/**
 * Database service select properties
 * Specialized for DreamFactory database service configuration
 */
export interface DatabaseServiceSelectProps extends SelectProps<string> {
  /** Available database service types */
  serviceTypes?: ('mysql' | 'postgresql' | 'mongodb' | 'sqlserver' | 'oracle' | 'snowflake' | 'sqlite')[];
  
  /** Whether to show service type icons */
  showServiceIcons?: boolean;
  
  /** Custom service type colors */
  serviceColors?: Record<string, string>;
  
  /** Whether to group by service category */
  groupByCategory?: boolean;
  
  /** Handler for service type selection */
  onServiceTypeChange?: (serviceType: string) => void;
  
  /** Whether to show connection status */
  showConnectionStatus?: boolean;
  
  /** Connection status data */
  connectionStatus?: Record<string, 'connected' | 'disconnected' | 'error'>;
}

/**
 * Schema field select properties
 * Specialized for database schema field selection
 */
export interface SchemaFieldSelectProps extends SelectProps<string> {
  /** Available field types */
  fieldTypes?: string[];
  
  /** Whether to show field type icons */
  showFieldTypeIcons?: boolean;
  
  /** Whether to group by data type category */
  groupByDataType?: boolean;
  
  /** Field metadata for enhanced display */
  fieldMetadata?: Record<string, {
    type: string;
    nullable: boolean;
    primaryKey: boolean;
    foreignKey: boolean;
    length?: number;
    precision?: number;
    scale?: number;
  }>;
  
  /** Custom field type renderer */
  fieldTypeRenderer?: (fieldType: string, metadata?: any) => ReactNode;
}

/**
 * API endpoint method select properties
 * Specialized for HTTP method selection in API generation
 */
export interface ApiMethodSelectProps extends MultiSelectProps<string> {
  /** Available HTTP methods */
  methods?: ('GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE' | 'HEAD' | 'OPTIONS')[];
  
  /** Whether to show method colors */
  showMethodColors?: boolean;
  
  /** Custom method colors */
  methodColors?: Record<string, string>;
  
  /** Default selected methods */
  defaultMethods?: string[];
  
  /** Whether certain methods are required */
  requiredMethods?: string[];
  
  /** Handler for method selection validation */
  onMethodValidation?: (methods: string[]) => boolean;
}

// ============================================================================
// EVENT HANDLERS
// ============================================================================

/**
 * Comprehensive event handlers for select interactions
 */
export interface SelectEventHandlers<T = any> {
  /** Option selection handler */
  onSelect?: (option: SelectOption<T>, event?: MouseEvent | KeyboardEvent) => void;
  
  /** Option deselection handler */
  onDeselect?: (option: SelectOption<T>, event?: MouseEvent | KeyboardEvent) => void;
  
  /** Dropdown open handler */
  onOpen?: () => void;
  
  /** Dropdown close handler */
  onClose?: () => void;
  
  /** Search term change handler */
  onSearchChange?: (searchTerm: string) => void;
  
  /** Clear all selections handler */
  onClearAll?: () => void;
  
  /** Option creation handler */
  onCreate?: (inputValue: string) => void | Promise<void>;
  
  /** Keyboard navigation handler */
  onKeyDown?: (event: KeyboardEvent<HTMLElement>) => void;
  
  /** Mouse interaction handlers */
  onMouseEnter?: (option: SelectOption<T>) => void;
  onMouseLeave?: (option: SelectOption<T>) => void;
  
  /** Focus management handlers */
  onFocusChange?: (focused: boolean) => void;
  onOptionFocus?: (option: SelectOption<T>) => void;
  
  /** Error handling */
  onError?: (error: Error, context: string) => void;
  
  /** Loading state changes */
  onLoadingChange?: (loading: boolean) => void;
}

// ============================================================================
// UTILITY TYPES
// ============================================================================

/**
 * Select component configuration aggregating all properties
 */
export interface SelectConfig<T = any> 
  extends SelectProps<T>, 
          Partial<AutocompleteProps<T>>, 
          Partial<MultiSelectProps<T>>,
          SelectEventHandlers<T> {
  /** Component type identification */
  componentType: 'select' | 'autocomplete' | 'multi-select' | 'database-service' | 'schema-field' | 'api-method';
  
  /** Feature flags for conditional functionality */
  features?: {
    search?: boolean;
    multiSelect?: boolean;
    async?: boolean;
    virtualization?: boolean;
    creation?: boolean;
    grouping?: boolean;
    sorting?: boolean;
  };
}

/**
 * Select option group definition
 */
export interface SelectOptionGroup<T = any> {
  /** Group identifier */
  id: string;
  
  /** Group display label */
  label: string;
  
  /** Group description */
  description?: string;
  
  /** Options in this group */
  options: SelectOption<T>[];
  
  /** Whether group is collapsible */
  collapsible?: boolean;
  
  /** Whether group is initially collapsed */
  collapsed?: boolean;
  
  /** Group-level metadata */
  metadata?: Record<string, any>;
  
  /** Custom group header renderer */
  headerRenderer?: () => ReactNode;
}

/**
 * Virtual scrolling configuration for large option lists
 */
export interface VirtualScrollConfig {
  /** Enable virtual scrolling */
  enabled: boolean;
  
  /** Height of each option item */
  itemHeight: number;
  
  /** Number of items to render outside visible area */
  overscan?: number;
  
  /** Maximum height of the dropdown */
  maxHeight?: number;
  
  /** Scroll behavior configuration */
  scrollBehavior?: 'auto' | 'smooth';
  
  /** Dynamic height calculation */
  dynamicHeight?: boolean;
  
  /** Threshold for enabling virtualization */
  threshold?: number;
}

// ============================================================================
// TYPE EXPORTS
// ============================================================================

export type {
  // Re-export for convenience
  ReactNode,
  ComponentType,
  KeyboardEvent,
  FocusEvent,
  BaseComponent,
  ComponentVariant,
  ComponentSize,
  FormFieldComponent,
  LoadingState,
  ComponentState,
  ComponentIntent
};