/**
 * TypeScript type definitions for React field array component
 * 
 * Comprehensive type definitions supporting dynamic field array management with React Hook Form
 * integration, accessibility compliance, and backward compatibility with existing service definitions.
 * 
 * @fileoverview Field array component type definitions for React 19/Next.js 15.1
 * @version 1.0.0
 * @requires react-hook-form@7.52.0
 * @requires typescript@5.8.0
 */

import { ReactNode } from 'react';
import { 
  FieldPath, 
  FieldValues, 
  UseFieldArrayReturn,
  UseControllerProps,
  FieldArrayPath,
  Control,
  FieldError,
  ArrayPath,
  FieldArray
} from 'react-hook-form';
import { 
  BaseComponentProps, 
  FormComponentProps, 
  ThemeProps, 
  ResponsiveProps, 
  AccessibilityProps,
  LayoutProps,
  AnimationProps,
  ValidationState
} from '@/types/ui';

// ============================================================================
// Field Array Configuration Types
// ============================================================================

/**
 * Supported field array modes for different use cases
 * Determines component behavior and value structure
 */
export type FieldArrayMode = 'array' | 'object' | 'table' | 'grid';

/**
 * Field array value types based on configuration mode
 * Supports both simple arrays and complex object arrays
 */
export type FieldArrayValueType = 
  | string[]           // Simple string array
  | number[]           // Simple number array
  | boolean[]          // Simple boolean array
  | Record<string, any>[]  // Object array with dynamic properties
  | any[];             // Generic array for complex types

/**
 * Layout orientation for field array display
 */
export type FieldArrayLayout = 'vertical' | 'horizontal' | 'grid' | 'table';

/**
 * Add button placement options
 */
export type AddButtonPlacement = 'top' | 'bottom' | 'both' | 'inline' | 'none';

/**
 * Field array size variants for consistent scaling
 */
export type FieldArraySize = 'sm' | 'md' | 'lg' | 'xl';

// ============================================================================
// Configuration Schema Interface
// ============================================================================

/**
 * Configuration schema interface for field array metadata
 * Maintains backward compatibility with existing service definitions
 */
export interface ConfigSchema {
  /** Field identifier */
  name: string;
  /** Display label for the field array */
  label: string;
  /** Field type identifier (field_array, array, etc.) */
  type: string;
  /** Human-readable description for tooltips and help text */
  description?: string;
  /** API field alias for mapping */
  alias: string;
  /** Whether the field is required */
  required?: boolean;
  /** Default value for new array items */
  default?: any;
  /** Minimum number of array items */
  minItems?: number;
  /** Maximum number of array items */
  maxItems?: number;
  /** Whether array items can be reordered */
  sortable?: boolean;
  /** Whether array supports duplicate values */
  allowDuplicates?: boolean;
  /** Validation rules for the field array */
  validation?: any;
  /** Schema for individual array items */
  itemSchema?: ConfigSchema | ConfigSchema[];
  /** Additional metadata */
  [key: string]: any;
}

/**
 * Item configuration for object-type field arrays
 * Defines structure for complex array elements
 */
export interface FieldArrayItemConfig {
  /** Unique identifier for the item type */
  key: string;
  /** Display label for the item */
  label: string;
  /** Field type (for DynamicField integration) */
  type: string;
  /** Whether this field is required within the item */
  required?: boolean;
  /** Default value for this field */
  default?: any;
  /** Validation rules specific to this field */
  validation?: any;
  /** Field configuration for DynamicField component */
  config?: Partial<ConfigSchema>;
  /** Custom component to render for this field */
  component?: ReactNode;
  /** Field width in grid layout (1-12) */
  width?: number;
  /** Whether field should span full width */
  fullWidth?: boolean;
  /** Field order in layout */
  order?: number;
}

// ============================================================================
// Table Layout Configuration
// ============================================================================

/**
 * Table column configuration for table mode
 * Supports responsive design and virtual scrolling
 */
export interface TableColumnConfig {
  /** Column key/identifier */
  key: string;
  /** Column header label */
  header: string;
  /** Column type for rendering */
  type: string;
  /** Column width (fixed, percentage, or flex) */
  width?: string | number;
  /** Minimum column width */
  minWidth?: string | number;
  /** Maximum column width */
  maxWidth?: string | number;
  /** Whether column is sortable */
  sortable?: boolean;
  /** Whether column is resizable */
  resizable?: boolean;
  /** Whether column can be hidden */
  hideable?: boolean;
  /** Column alignment */
  align?: 'left' | 'center' | 'right';
  /** Whether column is sticky */
  sticky?: boolean;
  /** Custom cell renderer */
  cellRenderer?: (value: any, rowIndex: number, item: any) => ReactNode;
  /** Custom header renderer */
  headerRenderer?: () => ReactNode;
  /** Column visibility on different screen sizes */
  responsive?: {
    hideOnMobile?: boolean;
    hideOnTablet?: boolean;
    showOnlyOnDesktop?: boolean;
  };
}

/**
 * Table configuration for table layout mode
 * Includes virtualization and responsive design support
 */
export interface TableConfig {
  /** Column definitions */
  columns: TableColumnConfig[];
  /** Whether table supports virtual scrolling */
  virtualized?: boolean;
  /** Virtual scroll item height */
  itemHeight?: number;
  /** Maximum table height before scrolling */
  maxHeight?: string | number;
  /** Whether table headers are sticky */
  stickyHeader?: boolean;
  /** Whether to show table borders */
  bordered?: boolean;
  /** Whether to show row striping */
  striped?: boolean;
  /** Whether rows are hoverable */
  hoverable?: boolean;
  /** Whether table is responsive */
  responsive?: boolean;
  /** Responsive breakpoint for table switching */
  responsiveBreakpoint?: 'sm' | 'md' | 'lg' | 'xl';
}

// ============================================================================
// Integration Types
// ============================================================================

/**
 * Integration interface for DynamicField component
 * Ensures type safety when using field arrays with dynamic fields
 */
export interface DynamicFieldIntegration {
  /** Field type for DynamicField component */
  fieldType: string;
  /** Configuration for DynamicField */
  fieldConfig: Partial<ConfigSchema>;
  /** Default field value */
  defaultValue?: any;
  /** Custom validation function */
  validator?: (value: any) => boolean | string;
  /** Field transformation function */
  transformer?: (value: any) => any;
}

/**
 * Integration interface for VerbPicker component
 * Supports HTTP verb selection in field arrays
 */
export interface VerbPickerIntegration {
  /** VerbPicker mode (verb, verb_multiple, number) */
  mode: 'verb' | 'verb_multiple' | 'number';
  /** Default verb selection */
  defaultVerbs?: string | string[] | number;
  /** Custom verb options */
  verbOptions?: Array<{
    value: number;
    altValue: string;
    label: string;
  }>;
  /** Integration configuration */
  config?: {
    allowEmpty?: boolean;
    maxSelections?: number;
    minSelections?: number;
  };
}

/**
 * Component integration registry
 * Maps field types to their corresponding components
 */
export interface ComponentIntegration {
  /** Component type identifier */
  type: string;
  /** React component to render */
  component: ReactNode;
  /** Props to pass to the component */
  props?: Record<string, any>;
  /** Integration-specific configuration */
  config?: DynamicFieldIntegration | VerbPickerIntegration | Record<string, any>;
}

// ============================================================================
// Event Handler Types
// ============================================================================

/**
 * Field array value change event handler
 */
export type FieldArrayChangeHandler<T = any> = (
  values: T[],
  action: {
    type: 'add' | 'remove' | 'update' | 'reorder' | 'clear';
    index?: number;
    value?: T;
    previousValue?: T;
    fromIndex?: number;
    toIndex?: number;
  }
) => void;

/**
 * Individual item change event handler
 */
export type FieldArrayItemChangeHandler<T = any> = (
  value: T,
  index: number,
  field?: string
) => void;

/**
 * Validation event handler
 */
export type FieldArrayValidationHandler = (
  errors: Record<number, FieldError>,
  isValid: boolean
) => void;

/**
 * Reorder event handler for sortable arrays
 */
export type FieldArrayReorderHandler = (
  fromIndex: number,
  toIndex: number,
  item: any
) => void;

// ============================================================================
// Component State Types
// ============================================================================

/**
 * Field array item state interface
 */
export interface FieldArrayItemState {
  /** Unique identifier for the item */
  id: string;
  /** Item index in the array */
  index: number;
  /** Whether item is being edited */
  isEditing?: boolean;
  /** Whether item is selected */
  isSelected?: boolean;
  /** Whether item has validation errors */
  hasErrors?: boolean;
  /** Item validation state */
  validation?: ValidationState;
  /** Whether item is expanded (for collapsible items) */
  isExpanded?: boolean;
}

/**
 * Overall field array state interface
 */
export interface FieldArrayState {
  /** Array of item states */
  items: FieldArrayItemState[];
  /** Whether array is loading */
  isLoading?: boolean;
  /** Whether array has unsaved changes */
  isDirty?: boolean;
  /** Global validation state */
  validation?: ValidationState;
  /** Currently selected item indices */
  selectedItems?: number[];
  /** Expansion state for collapsible mode */
  expandedItems?: number[];
}

// ============================================================================
// Main Component Props Interface
// ============================================================================

/**
 * Comprehensive props interface for FieldArray component
 * Supports all modes, integrations, and accessibility requirements
 */
export interface FieldArrayProps<
  TFieldValues extends FieldValues = FieldValues,
  TFieldArrayName extends FieldArrayPath<TFieldValues> = FieldArrayPath<TFieldValues>,
  TKeyName extends string = 'id'
> extends BaseComponentProps,
        FormComponentProps,
        ThemeProps,
        ResponsiveProps,
        AccessibilityProps,
        LayoutProps,
        AnimationProps {
  
  // ========================================================================
  // Core Configuration
  // ========================================================================
  
  /** Field array mode determining behavior and layout */
  mode?: FieldArrayMode;
  
  /** Layout orientation for field display */
  layout?: FieldArrayLayout;
  
  /** Component size variant */
  size?: FieldArraySize;
  
  /** Configuration schema for field metadata */
  schema?: Partial<ConfigSchema>;
  
  /** Individual item configuration for object arrays */
  itemConfig?: FieldArrayItemConfig[];
  
  /** Table configuration for table mode */
  tableConfig?: TableConfig;
  
  // ========================================================================
  // React Hook Form Integration
  // ========================================================================
  
  /** React Hook Form control instance */
  control: Control<TFieldValues>;
  
  /** Field array name path */
  name: TFieldArrayName;
  
  /** Field array hook return (from useFieldArray) */
  fieldArray?: UseFieldArrayReturn<TFieldValues, TFieldArrayName, TKeyName>;
  
  /** Field registration rules */
  rules?: UseControllerProps<TFieldValues, TFieldArrayName>['rules'];
  
  /** Key name for field array items */
  keyName?: TKeyName;
  
  // ========================================================================
  // Value and State Management
  // ========================================================================
  
  /** Default values for new array items */
  defaultValues?: FieldArray<TFieldValues, TFieldArrayName>[number];
  
  /** Minimum number of array items */
  minItems?: number;
  
  /** Maximum number of array items */
  maxItems?: number;
  
  /** Whether array supports reordering */
  sortable?: boolean;
  
  /** Whether to allow duplicate values */
  allowDuplicates?: boolean;
  
  /** Whether items can be selected */
  selectable?: boolean;
  
  /** Whether to show item indices */
  showIndices?: boolean;
  
  // ========================================================================
  // UI Configuration
  // ========================================================================
  
  /** Add button placement */
  addButtonPlacement?: AddButtonPlacement;
  
  /** Custom add button text */
  addButtonText?: string;
  
  /** Custom add button icon */
  addButtonIcon?: ReactNode;
  
  /** Custom remove button icon */
  removeButtonIcon?: ReactNode;
  
  /** Custom reorder handle icon */
  reorderIcon?: ReactNode;
  
  /** Whether to show field labels */
  showLabels?: boolean;
  
  /** Whether to show item borders */
  showBorders?: boolean;
  
  /** Whether items are collapsible */
  collapsible?: boolean;
  
  /** Empty state content */
  emptyStateContent?: ReactNode;
  
  /** Loading state content */
  loadingStateContent?: ReactNode;
  
  // ========================================================================
  // Component Integration
  // ========================================================================
  
  /** DynamicField integration configuration */
  dynamicFieldIntegration?: DynamicFieldIntegration;
  
  /** VerbPicker integration configuration */
  verbPickerIntegration?: VerbPickerIntegration;
  
  /** Custom component integrations */
  componentIntegrations?: ComponentIntegration[];
  
  /** Custom item renderer */
  itemRenderer?: (
    item: any,
    index: number,
    state: FieldArrayItemState
  ) => ReactNode;
  
  /** Custom header renderer */
  headerRenderer?: () => ReactNode;
  
  /** Custom footer renderer */
  footerRenderer?: () => ReactNode;
  
  // ========================================================================
  // Event Handlers
  // ========================================================================
  
  /** Value change handler */
  onChange?: FieldArrayChangeHandler;
  
  /** Item change handler */
  onItemChange?: FieldArrayItemChangeHandler;
  
  /** Validation handler */
  onValidation?: FieldArrayValidationHandler;
  
  /** Reorder handler */
  onReorder?: FieldArrayReorderHandler;
  
  /** Add item handler */
  onAddItem?: (index?: number) => void;
  
  /** Remove item handler */
  onRemoveItem?: (index: number) => void;
  
  /** Item selection handler */
  onItemSelect?: (index: number, selected: boolean) => void;
  
  /** Item focus handler */
  onItemFocus?: (index: number) => void;
  
  /** Item blur handler */
  onItemBlur?: (index: number) => void;
  
  // ========================================================================
  // Accessibility and ARIA
  // ========================================================================
  
  /** ARIA label for the field array */
  'aria-label'?: string;
  
  /** ARIA description for the field array */
  'aria-describedby'?: string;
  
  /** ARIA label for add button */
  'aria-label-add'?: string;
  
  /** ARIA label for remove button */
  'aria-label-remove'?: string;
  
  /** ARIA label for reorder handle */
  'aria-label-reorder'?: string;
  
  /** ARIA live region for announcements */
  'aria-live'?: 'polite' | 'assertive' | 'off';
  
  /** Screen reader announcements */
  announcements?: {
    itemAdded?: string;
    itemRemoved?: string;
    itemReordered?: string;
    validationError?: string;
  };
  
  // ========================================================================
  // Performance and Virtualization
  // ========================================================================
  
  /** Whether to enable virtual scrolling for large arrays */
  virtualized?: boolean;
  
  /** Virtual scroll item height */
  virtualItemHeight?: number;
  
  /** Virtual scroll buffer size */
  virtualBufferSize?: number;
  
  /** Maximum height before virtualization kicks in */
  virtualThreshold?: number;
  
  /** Whether to use React.memo for item components */
  memoizeItems?: boolean;
  
  /** Debounce delay for onChange events (ms) */
  debounceDelay?: number;
}

// ============================================================================
// Hook Return Types
// ============================================================================

/**
 * Return type for useFieldArray integration hook
 */
export interface UseFieldArrayIntegrationReturn<T = any> {
  /** Field array items with state */
  items: (T & { state: FieldArrayItemState })[];
  /** Add item function */
  addItem: (item?: Partial<T>, index?: number) => void;
  /** Remove item function */
  removeItem: (index: number) => void;
  /** Update item function */
  updateItem: (index: number, updates: Partial<T>) => void;
  /** Reorder items function */
  reorderItems: (fromIndex: number, toIndex: number) => void;
  /** Clear all items function */
  clearItems: () => void;
  /** Select item function */
  selectItem: (index: number, selected?: boolean) => void;
  /** Toggle item selection function */
  toggleSelection: (index: number) => void;
  /** Select all items function */
  selectAll: () => void;
  /** Clear selection function */
  clearSelection: () => void;
  /** Field array state */
  state: FieldArrayState;
  /** Whether array has changes */
  isDirty: boolean;
  /** Whether array is valid */
  isValid: boolean;
  /** Array validation errors */
  errors: Record<number, FieldError>;
}

// ============================================================================
// Validation Types
// ============================================================================

/**
 * Field array validation function type
 */
export type FieldArrayValidator<T = any> = (
  values: T[],
  config: ConfigSchema
) => {
  isValid: boolean;
  errors?: Record<number, string>;
  globalError?: string;
};

/**
 * Item validation function type
 */
export type FieldArrayItemValidator<T = any> = (
  value: T,
  index: number,
  allValues: T[]
) => {
  isValid: boolean;
  error?: string;
};

/**
 * Validation configuration for field arrays
 */
export interface FieldArrayValidationConfig {
  /** Global array validator */
  arrayValidator?: FieldArrayValidator;
  /** Individual item validator */
  itemValidator?: FieldArrayItemValidator;
  /** Whether to validate on change */
  validateOnChange?: boolean;
  /** Whether to validate on blur */
  validateOnBlur?: boolean;
  /** Validation debounce delay */
  validationDelay?: number;
  /** Custom error messages */
  errorMessages?: {
    required?: string;
    minItems?: string;
    maxItems?: string;
    duplicate?: string;
    invalid?: string;
  };
}

// ============================================================================
// Utility Types
// ============================================================================

/**
 * Extract field array value type from form values
 */
export type ExtractFieldArrayType<
  TFieldValues extends FieldValues,
  TFieldArrayName extends FieldArrayPath<TFieldValues>
> = FieldArray<TFieldValues, TFieldArrayName>;

/**
 * Field array item type utility
 */
export type FieldArrayItem<T> = T extends Array<infer U> ? U : never;

/**
 * Conditional props based on mode
 */
export type ConditionalFieldArrayProps<T extends FieldArrayMode> = 
  FieldArrayProps & {
    mode: T;
  } & (T extends 'table' 
    ? { tableConfig: TableConfig } 
    : T extends 'object' 
    ? { itemConfig: FieldArrayItemConfig[] }
    : {});

/**
 * Theme variant props for field array styling
 */
export interface FieldArrayThemeProps {
  /** Color scheme variant */
  variant?: 'default' | 'bordered' | 'ghost' | 'filled';
  /** Accent color for interactive elements */
  accent?: 'primary' | 'secondary' | 'success' | 'warning' | 'error';
  /** Border radius variant */
  rounded?: boolean;
  /** Shadow variant */
  shadow?: 'none' | 'sm' | 'md' | 'lg';
}

// ============================================================================
// Export Convenience Types
// ============================================================================

/**
 * Props for simple array field arrays (string[], number[], etc.)
 */
export type SimpleFieldArrayProps<T extends string | number | boolean = string> = 
  Omit<FieldArrayProps, 'mode' | 'itemConfig' | 'tableConfig'> & {
    mode: 'array';
    defaultValue?: T;
  };

/**
 * Props for object field arrays with complex item structures
 */
export type ObjectFieldArrayProps<T extends Record<string, any> = Record<string, any>> = 
  Omit<FieldArrayProps, 'mode'> & {
    mode: 'object';
    itemConfig: FieldArrayItemConfig[];
    defaultValues?: Partial<T>;
  };

/**
 * Props for table-mode field arrays
 */
export type TableFieldArrayProps<T extends Record<string, any> = Record<string, any>> = 
  Omit<FieldArrayProps, 'mode' | 'layout'> & {
    mode: 'table';
    layout: 'table';
    tableConfig: TableConfig;
  };

// Re-export React Hook Form types for convenience
export type {
  FieldPath,
  FieldValues,
  UseFieldArrayReturn,
  UseControllerProps,
  FieldArrayPath,
  Control,
  FieldError,
  FieldArray,
  ArrayPath
} from 'react-hook-form';

// Re-export UI types for convenience
export type {
  BaseComponentProps,
  FormComponentProps,
  ThemeProps,
  ResponsiveProps,
  AccessibilityProps,
  LayoutProps,
  AnimationProps,
  ValidationState
} from '@/types/ui';