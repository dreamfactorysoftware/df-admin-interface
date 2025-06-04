/**
 * Select Component Type Definitions
 * 
 * Comprehensive TypeScript interfaces for React 19 select component variants
 * supporting complex value types, form integration, and accessibility requirements.
 * Migrated from Angular reactive forms to React Hook Form with enhanced type safety.
 * 
 * @fileoverview Select component type definitions for DreamFactory Admin Interface
 * @version 1.0.0
 * @since React 19.0.0 / Next.js 15.1+
 */

import { type ReactNode, type ComponentPropsWithoutRef } from 'react';
import { type FieldPath, type FieldValues, type UseFormRegister, type RegisterOptions } from 'react-hook-form';
import { type VariantProps } from 'class-variance-authority';
import { 
  type BaseComponentProps, 
  type FormComponentProps, 
  type ControlledProps, 
  type ThemeProps,
  type FocusProps,
  type ColorVariant,
  type SizeVariant,
  type StateVariant
} from '../../../types/ui';

/**
 * Complex value types supported by select components
 * Supports Angular migration patterns including bitmask operations
 */
export type SelectValue = string | number | boolean | string[] | number[] | null | undefined;

/**
 * Bitmask value transformation utilities for complex database field types
 * Maintains compatibility with Angular reactive forms bitmask handling
 */
export interface BitmaskValue {
  /** Raw bitmask integer value */
  value: number;
  /** Array of selected bit positions */
  selectedBits: number[];
  /** Human-readable labels for each bit */
  labels: Record<number, string>;
}

/**
 * Value transformation functions for complex data types
 * Enables seamless migration from Angular form value transforms
 */
export interface ValueTransform<TInput = any, TOutput = any> {
  /** Transform display value to form value */
  toFormValue: (displayValue: TInput) => TOutput;
  /** Transform form value to display value */
  toDisplayValue: (formValue: TOutput) => TInput;
  /** Validate transformed value */
  validate?: (value: TOutput) => boolean;
}

/**
 * Enhanced option interface with comprehensive metadata support
 * Extends Angular Material select option with additional properties
 */
export interface SelectOption<T = SelectValue> {
  /** Option value - supports complex types from database schemas */
  value: T;
  /** Display label for the option */
  label: string;
  /** Optional detailed description shown in tooltips or subtext */
  description?: string;
  /** Icon component or icon name for visual enhancement */
  icon?: ReactNode | string;
  /** Disabled state for individual options */
  disabled?: boolean;
  /** Group identifier for option grouping */
  group?: string;
  /** Additional metadata for complex options (e.g., database field info) */
  metadata?: Record<string, any>;
  /** Custom CSS classes for option styling */
  className?: string;
  /** Search keywords for filtering (in addition to label) */
  searchKeywords?: string[];
  /** Sort order within group */
  sortOrder?: number;
}

/**
 * Option group interface for organized option display
 * Supports hierarchical data structures common in database schemas
 */
export interface OptionGroup<T = SelectValue> {
  /** Group identifier */
  id: string;
  /** Group display label */
  label: string;
  /** Group description */
  description?: string;
  /** Options within this group */
  options: SelectOption<T>[];
  /** Disabled state for entire group */
  disabled?: boolean;
  /** Collapsible group state */
  collapsible?: boolean;
  /** Default collapsed state */
  defaultCollapsed?: boolean;
}

/**
 * Loading state interface for async operations
 * Supports DreamFactory API integration patterns
 */
export interface SelectLoadingState {
  /** Is component currently loading */
  isLoading: boolean;
  /** Loading progress percentage (0-100) */
  progress?: number;
  /** Loading message to display */
  message?: string;
  /** Loading state type */
  type?: 'initial' | 'search' | 'refresh' | 'lazy';
}

/**
 * Error state interface for validation and API errors
 * Integrates with React Hook Form error handling
 */
export interface SelectErrorState {
  /** Error message to display */
  message: string;
  /** Error type for different handling */
  type?: 'validation' | 'network' | 'permission' | 'data';
  /** Field-specific errors for complex selects */
  fieldErrors?: Record<string, string>;
  /** Retry function for recoverable errors */
  onRetry?: () => void;
}

/**
 * Theme variant configuration for consistent styling
 * Uses class-variance-authority for dynamic class composition
 */
export interface SelectThemeVariants {
  /** Visual style variant */
  variant?: ColorVariant;
  /** Size variant */
  size?: SizeVariant;
  /** Component state */
  state?: StateVariant;
  /** Border style */
  border?: 'none' | 'subtle' | 'default' | 'strong';
  /** Background style */
  background?: 'transparent' | 'subtle' | 'default' | 'strong';
}

/**
 * Base select component props extending form and UI patterns
 * Provides foundation for all select variants
 */
export interface BaseSelectProps<T = SelectValue, TFieldValues extends FieldValues = FieldValues> 
  extends Omit<BaseComponentProps<HTMLSelectElement>, 'onChange' | 'value'>,
          FormComponentProps,
          ControlledProps<T>,
          ThemeProps,
          FocusProps {
  
  /** Select options - can be flat array or grouped */
  options: SelectOption<T>[] | OptionGroup<T>[];
  /** Placeholder text when no value selected */
  placeholder?: string;
  /** Allow clearing selection */
  clearable?: boolean;
  /** Show search/filter capability */
  searchable?: boolean;
  /** Custom empty state content */
  emptyStateContent?: ReactNode;
  /** Custom loading content */
  loadingContent?: ReactNode;
  /** Loading state configuration */
  loadingState?: SelectLoadingState;
  /** Error state configuration */
  errorState?: SelectErrorState;
  /** Theme variants for styling */
  themeVariants?: SelectThemeVariants;
  
  /** React Hook Form integration */
  register?: UseFormRegister<TFieldValues>;
  /** Field name for form registration */
  name?: FieldPath<TFieldValues>;
  /** Validation rules for React Hook Form */
  rules?: RegisterOptions<TFieldValues>;
  
  /** Value transformation utilities */
  valueTransform?: ValueTransform<T>;
  /** Custom option renderer */
  renderOption?: (option: SelectOption<T>, isSelected: boolean) => ReactNode;
  /** Custom value renderer for selected state */
  renderValue?: (value: T, option?: SelectOption<T>) => ReactNode;
  /** Custom group header renderer */
  renderGroup?: (group: OptionGroup<T>) => ReactNode;
  
  /** Accessibility enhancements */
  'aria-describedby'?: string;
  'aria-invalid'?: boolean;
  /** Announcement for screen readers on selection change */
  announceSelection?: (option: SelectOption<T>) => string;
}

/**
 * Standard select component props for single selection
 * Maintains compatibility with Angular Material select patterns
 */
export interface SelectProps<T = SelectValue, TFieldValues extends FieldValues = FieldValues> 
  extends BaseSelectProps<T, TFieldValues> {
  
  /** Single value selection */
  value?: T;
  /** Default value for uncontrolled usage */
  defaultValue?: T;
  /** Change handler with option metadata */
  onChange?: (value: T, option?: SelectOption<T>) => void;
  /** Validation on change */
  validateOnChange?: boolean;
  /** Auto-submit form on selection */
  autoSubmit?: boolean;
}

/**
 * Autocomplete/Combobox props with search capabilities
 * Supports async data loading and server-side search
 */
export interface AutocompleteProps<T = SelectValue, TFieldValues extends FieldValues = FieldValues> 
  extends BaseSelectProps<T, TFieldValues> {
  
  /** Current search query */
  searchQuery?: string;
  /** Search input placeholder */
  searchPlaceholder?: string;
  /** Minimum characters before search triggers */
  minSearchLength?: number;
  /** Search debounce delay in milliseconds */
  searchDebounce?: number;
  /** Allow custom input values not in options */
  allowCustomValue?: boolean;
  /** Create new option from search input */
  onCreateOption?: (searchValue: string) => SelectOption<T> | Promise<SelectOption<T>>;
  
  /** Search handler - can be sync or async */
  onSearch?: (query: string) => void | Promise<void>;
  /** Async options loading */
  asyncOptions?: (query: string) => Promise<SelectOption<T>[]>;
  /** Show recent selections */
  showRecentSelections?: boolean;
  /** Maximum recent selections to show */
  maxRecentSelections?: number;
  
  /** Highlight matching text in options */
  highlightMatches?: boolean;
  /** Custom search filter function */
  filterOptions?: (options: SelectOption<T>[], query: string) => SelectOption<T>[];
  /** Search result announcement for screen readers */
  announceSearchResults?: (count: number, query: string) => string;
}

/**
 * Multi-select component props for multiple selection
 * Supports complex multi-value patterns from database operations
 */
export interface MultiSelectProps<T = SelectValue, TFieldValues extends FieldValues = FieldValues> 
  extends BaseSelectProps<T[], TFieldValues> {
  
  /** Multiple selected values */
  value?: T[];
  /** Default selected values */
  defaultValue?: T[];
  /** Change handler with all selected options */
  onChange?: (values: T[], options: SelectOption<T>[]) => void;
  
  /** Maximum number of selections allowed */
  maxSelections?: number;
  /** Minimum number of selections required */
  minSelections?: number;
  /** Select all / deselect all functionality */
  selectAllOption?: boolean;
  /** Custom select all option label */
  selectAllLabel?: string;
  
  /** How to display selected values */
  valueDisplay?: 'chips' | 'count' | 'list' | 'custom';
  /** Custom chip/tag renderer for selected values */
  chipRenderer?: (value: T, option: SelectOption<T>, onRemove: () => void) => ReactNode;
  /** Maximum chips to display before showing count */
  maxChipsDisplay?: number;
  /** Chip removal handler */
  onChipRemove?: (value: T, option: SelectOption<T>) => void;
  
  /** Close dropdown after each selection */
  closeOnSelect?: boolean;
  /** Order selected values */
  orderSelected?: 'selection' | 'original' | 'alphabetical';
  /** Selection announcement for screen readers */
  announceSelectionCount?: (count: number, total: number) => string;
}

/**
 * Advanced select props for complex database field configurations
 * Supports bitmask operations and complex value transformations
 */
export interface AdvancedSelectProps<T = SelectValue, TFieldValues extends FieldValues = FieldValues> 
  extends BaseSelectProps<T, TFieldValues> {
  
  /** Bitmask mode for flag-style selections */
  bitmaskMode?: boolean;
  /** Bitmask configuration */
  bitmaskConfig?: {
    /** Available bit positions and labels */
    bitLabels: Record<number, string>;
    /** Maximum bit position */
    maxBits?: number;
    /** Display format for bitmask value */
    displayFormat?: 'binary' | 'decimal' | 'hex' | 'labels';
  };
  
  /** Hierarchical/tree selection support */
  hierarchical?: boolean;
  /** Parent-child relationships */
  hierarchy?: {
    /** Parent option selection behavior */
    parentSelection?: 'cascade' | 'independent' | 'disabled';
    /** Child option display */
    childDisplay?: 'indented' | 'grouped' | 'flat';
    /** Maximum nesting levels */
    maxDepth?: number;
  };
  
  /** Advanced validation */
  customValidation?: {
    /** Custom validation function */
    validate: (value: T) => boolean | string;
    /** Validation message */
    message?: string;
    /** Async validation */
    async?: boolean;
  };
  
  /** Performance optimizations for large datasets */
  performance?: {
    /** Virtual scrolling for large option lists */
    virtualScrolling?: boolean;
    /** Lazy loading of option groups */
    lazyLoading?: boolean;
    /** Option caching strategy */
    caching?: 'none' | 'memory' | 'session' | 'persistent';
  };
}

/**
 * Select component configuration for form builders
 * Enables dynamic form generation from database schemas
 */
export interface SelectFieldConfig<T = SelectValue> {
  /** Field type identifier */
  type: 'select' | 'autocomplete' | 'multiselect' | 'advanced';
  /** Field schema information */
  schema?: {
    /** Database field type */
    dbType?: string;
    /** Foreign key relationship */
    foreignKey?: {
      table: string;
      column: string;
      displayColumn?: string;
    };
    /** Enum values for constrained fields */
    enumValues?: string[];
    /** Validation constraints */
    constraints?: {
      required?: boolean;
      minLength?: number;
      maxLength?: number;
      pattern?: string;
    };
  };
  
  /** Default configuration for this field type */
  defaultProps?: Partial<SelectProps<T> | AutocompleteProps<T> | MultiSelectProps<T> | AdvancedSelectProps<T>>;
  /** Dynamic option loading configuration */
  optionLoader?: {
    /** API endpoint for options */
    endpoint?: string;
    /** Query parameters */
    params?: Record<string, any>;
    /** Dependency fields that trigger reload */
    dependencies?: string[];
    /** Cache duration in seconds */
    cacheDuration?: number;
  };
}

/**
 * Export utility types for component variants
 */
export type SelectVariantProps = VariantProps<any>;

/**
 * Union type for all select component props
 */
export type AnySelectProps<T = SelectValue, TFieldValues extends FieldValues = FieldValues> = 
  | SelectProps<T, TFieldValues>
  | AutocompleteProps<T, TFieldValues>
  | MultiSelectProps<T, TFieldValues>
  | AdvancedSelectProps<T, TFieldValues>;

/**
 * Type guard functions for component variant detection
 */
export const isMultiSelect = <T = SelectValue>(props: AnySelectProps<T>): props is MultiSelectProps<T> => {
  return Array.isArray((props as MultiSelectProps<T>).value);
};

export const isAutocomplete = <T = SelectValue>(props: AnySelectProps<T>): props is AutocompleteProps<T> => {
  return (props as AutocompleteProps<T>).searchable === true || 
         'onSearch' in props || 
         'asyncOptions' in props;
};

export const isAdvancedSelect = <T = SelectValue>(props: AnySelectProps<T>): props is AdvancedSelectProps<T> => {
  return 'bitmaskMode' in props || 'hierarchical' in props || 'customValidation' in props;
};

/**
 * Default configurations for different select types
 */
export const DEFAULT_SELECT_CONFIG: Record<string, Partial<AnySelectProps>> = {
  basic: {
    size: 'md',
    variant: 'outline',
    clearable: false,
    searchable: false,
  },
  database: {
    size: 'md',
    variant: 'outline',
    clearable: true,
    searchable: true,
    loadingState: { isLoading: false, type: 'initial' },
  },
  multiSelect: {
    size: 'md',
    variant: 'outline',
    clearable: true,
    searchable: true,
    valueDisplay: 'chips',
    maxChipsDisplay: 3,
    closeOnSelect: false,
  },
  autocomplete: {
    size: 'md',
    variant: 'outline',
    clearable: true,
    searchable: true,
    minSearchLength: 2,
    searchDebounce: 300,
    highlightMatches: true,
  },
};

/**
 * Type exports for external usage
 */
export type {
  SelectValue,
  BitmaskValue,
  ValueTransform,
  SelectOption,
  OptionGroup,
  SelectLoadingState,
  SelectErrorState,
  SelectThemeVariants,
  BaseSelectProps,
  SelectProps,
  AutocompleteProps,
  MultiSelectProps,
  AdvancedSelectProps,
  SelectFieldConfig,
  AnySelectProps,
};