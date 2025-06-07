/**
 * TypeScript type definitions for the React Field Array Component
 * 
 * Comprehensive type definitions for array and object field configurations with React Hook Form
 * integration, virtual scrolling capabilities, and WCAG 2.1 AA accessibility compliance.
 * Replaces Angular FormArray with React useFieldArray for enhanced performance and type safety.
 * 
 * @fileoverview Field array types supporting React Hook Form + dynamic field integration
 * @version 1.0.0
 * @since React 19/Next.js 15.1 migration
 */

import type { ReactNode, ComponentType, HTMLAttributes, AriaAttributes, KeyboardEvent, MouseEvent } from 'react';
import type { 
  UseFormRegister,
  FieldPath,
  FieldValues,
  Control,
  FieldError,
  RegisterOptions,
  UseFieldArrayReturn,
  FieldArrayPath,
  FieldArray as ReactHookFormFieldArray
} from 'react-hook-form';
import type { ZodSchema, ZodType } from 'zod';
import type { VariantProps } from 'class-variance-authority';

// Import dependent types
import type { 
  SchemaField,
  SchemaTable,
  FieldType,
  FieldValidation 
} from '@/types/schema';
import type { 
  BaseComponent,
  ComponentVariant,
  ComponentSize,
  FormFieldComponent,
  TableComponent,
  ColumnDefinition,
  ResponsiveValue,
  GridConfig,
  AccessibilityConfig
} from '@/types/ui';
import type { 
  DynamicFieldType,
  DynamicFieldValue,
  DynamicFieldProps,
  ConfigSchema as DynamicFieldConfigSchema,
  SelectOption,
  EventOption
} from '@/components/ui/dynamic-field/dynamic-field.types';
import type { 
  VerbPickerProps,
  HttpVerb,
  VerbOption,
  VerbPickerMode
} from '@/components/ui/verb-picker/types';

// ============================================================================
// CORE FIELD ARRAY TYPES
// ============================================================================

/**
 * Field array configuration schema types supporting both array and object variations
 * Maintains backward compatibility with existing service definitions
 */
export type FieldArrayDataType = 'array' | 'object' | 'mixed';

/**
 * Field array value types with type safety for different data structures
 */
export type FieldArrayValue = 
  | Record<string, any>[]        // Array of objects
  | any[]                       // Simple array
  | Record<string, any>         // Single object (for object mode)
  | null
  | undefined;

/**
 * Individual field array item value
 */
export type FieldArrayItemValue = Record<string, any> | any;

/**
 * Field array operation types for mutation tracking
 */
export type FieldArrayOperation = 
  | 'append'
  | 'prepend'
  | 'insert'
  | 'remove'
  | 'swap'
  | 'move'
  | 'update'
  | 'replace'
  | 'clear';

// ============================================================================
// COMPONENT PROPS INTERFACES
// ============================================================================

/**
 * Base interface for field array component props with accessibility support
 * Extends BaseComponent for consistent prop interface across components
 */
export interface FieldArrayBaseProps extends BaseComponent, AriaAttributes {
  // Core field identification
  name: string;
  
  // Display properties
  label?: string;
  description?: string;
  helpText?: string;
  emptyMessage?: string;
  
  // Configuration
  dataType: FieldArrayDataType;
  minItems?: number;
  maxItems?: number;
  allowReorder?: boolean;
  allowDuplicates?: boolean;
  
  // Styling and theme
  variant?: ComponentVariant;
  size?: ComponentSize;
  className?: string;
  
  // State
  disabled?: boolean;
  readonly?: boolean;
  loading?: boolean;
  
  // Accessibility enhancement
  'aria-label'?: string;
  'aria-describedby'?: string;
  'aria-required'?: boolean;
  'aria-invalid'?: boolean;
  'role'?: string;
  
  // Test support
  'data-testid'?: string;
}

/**
 * React Hook Form integration props for field arrays
 * Supports both controlled and uncontrolled component modes
 */
export interface FieldArrayFormProps<TFieldValues extends FieldValues = FieldValues> {
  // React Hook Form integration
  control: Control<TFieldValues>;
  register?: UseFormRegister<TFieldValues>;
  name: FieldArrayPath<TFieldValues>;
  rules?: RegisterOptions<TFieldValues>;
  
  // Field array state from useFieldArray hook
  fieldArray?: UseFieldArrayReturn<TFieldValues>;
  
  // Field state
  error?: FieldError;
  errors?: Record<string, FieldError>;
  isDirty?: boolean;
  isTouched?: boolean;
  isValidating?: boolean;
  
  // Value handling for controlled mode
  value?: FieldArrayValue;
  defaultValue?: FieldArrayValue;
  onChange?: (value: FieldArrayValue) => void;
  onBlur?: () => void;
}

/**
 * Configuration schema interface maintaining backward compatibility
 * with existing Angular service definitions
 */
export interface ConfigSchema {
  // Field metadata
  name: string;
  type: 'array' | 'object';
  label?: string;
  description?: string;
  
  // Array configuration
  itemType?: DynamicFieldType;
  itemSchema?: ConfigSchemaItem;
  items?: ConfigSchemaItem[];
  
  // Validation rules
  required?: boolean;
  minItems?: number;
  maxItems?: number;
  validation?: FieldArrayValidationSchema;
  
  // Layout and behavior
  layout?: FieldArrayLayout;
  display?: FieldArrayDisplay;
  actions?: FieldArrayActions;
  
  // Integration configuration
  dependencies?: string[];
  conditional?: ConditionalFieldArrayConfig;
  
  // Legacy compatibility
  native?: any[];
  value?: any[];
}

/**
 * Individual schema item configuration for array elements
 */
export interface ConfigSchemaItem {
  // Field identification
  name: string;
  type: DynamicFieldType;
  label?: string;
  description?: string;
  
  // Field configuration
  required?: boolean;
  validation?: FieldValidation;
  options?: SelectOption[];
  
  // Layout
  grid?: GridConfig;
  order?: number;
  
  // Integration with other components
  component?: 'DynamicField' | 'VerbPicker' | 'custom';
  componentProps?: DynamicFieldProps | VerbPickerProps | Record<string, any>;
}

// ============================================================================
// LAYOUT AND DISPLAY TYPES
// ============================================================================

/**
 * Field array layout configuration supporting responsive design
 */
export interface FieldArrayLayout {
  type: FieldArrayLayoutType;
  orientation?: 'horizontal' | 'vertical';
  columns?: ResponsiveValue<number>;
  gap?: ComponentSize;
  responsive?: ResponsiveFieldArrayLayout;
  
  // Table-specific layout
  table?: TableLayoutConfig;
  
  // Card-specific layout
  card?: CardLayoutConfig;
  
  // List-specific layout
  list?: ListLayoutConfig;
}

/**
 * Field array layout types
 */
export type FieldArrayLayoutType = 
  | 'table'           // Tabular display with headers
  | 'cards'           // Card-based layout
  | 'list'            // Simple list layout
  | 'grid'            // CSS Grid layout
  | 'inline'          // Inline horizontal layout
  | 'accordion'       // Collapsible accordion
  | 'tabs';           // Tab-based navigation

/**
 * Responsive layout configuration
 */
export interface ResponsiveFieldArrayLayout {
  xs?: FieldArrayLayoutConfig;
  sm?: FieldArrayLayoutConfig;
  md?: FieldArrayLayoutConfig;
  lg?: FieldArrayLayoutConfig;
  xl?: FieldArrayLayoutConfig;
}

/**
 * Layout configuration for specific breakpoints
 */
export interface FieldArrayLayoutConfig {
  type: FieldArrayLayoutType;
  columns: number;
  gap: ComponentSize;
  showHeaders?: boolean;
  stackOnMobile?: boolean;
}

/**
 * Table layout configuration with virtual scrolling support
 */
export interface TableLayoutConfig {
  columns: FieldArrayColumnDefinition[];
  showHeaders?: boolean;
  striped?: boolean;
  bordered?: boolean;
  hoverable?: boolean;
  compact?: boolean;
  
  // Virtual scrolling for large datasets
  virtualScrolling?: VirtualScrollingConfig;
  
  // Row actions
  rowActions?: RowActionConfig[];
  
  // Selection
  selectable?: boolean;
  multiSelect?: boolean;
}

/**
 * Virtual scrolling configuration for large field arrays
 */
export interface VirtualScrollingConfig {
  enabled: boolean;
  estimatedRowHeight: number;
  overscan?: number;
  scrollingDelay?: number;
  itemCount?: number;
  getItemSize?: (index: number) => number;
  onScroll?: (scrollTop: number, scrollLeft: number) => void;
}

/**
 * Column definition for table layout
 */
export interface FieldArrayColumnDefinition extends ColumnDefinition {
  field: string;
  type?: DynamicFieldType;
  component?: ComponentType<any>;
  editable?: boolean;
  sortable?: boolean;
  filterable?: boolean;
  resizable?: boolean;
  
  // Responsive behavior
  hideOnMobile?: boolean;
  priority?: number;
}

/**
 * Row action configuration
 */
export interface RowActionConfig {
  id: string;
  label: string;
  icon?: ComponentType<{ className?: string }>;
  action: RowActionType;
  disabled?: (item: FieldArrayItemValue, index: number) => boolean;
  visible?: (item: FieldArrayItemValue, index: number) => boolean;
  className?: string;
  
  // Accessibility
  'aria-label'?: string;
  confirmAction?: boolean;
  confirmMessage?: string;
}

/**
 * Row action types
 */
export type RowActionType = 
  | 'edit'
  | 'delete'
  | 'duplicate'
  | 'move-up'
  | 'move-down'
  | 'view'
  | 'custom';

/**
 * Card layout configuration
 */
export interface CardLayoutConfig {
  showTitle?: boolean;
  showDescription?: boolean;
  showActions?: boolean;
  elevation?: ComponentSize;
  padding?: ComponentSize;
  
  // Card grid
  cardsPerRow?: ResponsiveValue<number>;
  cardMinWidth?: string;
  cardMaxWidth?: string;
}

/**
 * List layout configuration
 */
export interface ListLayoutConfig {
  showDividers?: boolean;
  showIndexes?: boolean;
  itemPadding?: ComponentSize;
  itemGap?: ComponentSize;
  
  // Drag and drop
  draggable?: boolean;
  dropZoneConfig?: DropZoneConfig;
}

/**
 * Drag and drop configuration
 */
export interface DropZoneConfig {
  accept?: string[];
  multiple?: boolean;
  disabled?: boolean;
  onDrop?: (files: File[], index?: number) => void;
  onDragOver?: (event: DragEvent) => void;
  onDragLeave?: (event: DragEvent) => void;
}

// ============================================================================
// DISPLAY AND INTERACTION TYPES
// ============================================================================

/**
 * Field array display configuration
 */
export interface FieldArrayDisplay {
  showLabels?: boolean;
  showDescriptions?: boolean;
  showErrors?: boolean;
  showIndexes?: boolean;
  showItemCount?: boolean;
  showProgress?: boolean;
  
  // Empty state
  emptyState?: EmptyStateConfig;
  
  // Loading state
  loadingState?: LoadingStateConfig;
  
  // Error state
  errorState?: ErrorStateConfig;
}

/**
 * Empty state configuration
 */
export interface EmptyStateConfig {
  message?: string;
  description?: string;
  icon?: ComponentType<{ className?: string }>;
  action?: {
    label: string;
    handler: () => void;
  };
  illustration?: ReactNode;
}

/**
 * Loading state configuration
 */
export interface LoadingStateConfig {
  message?: string;
  showProgress?: boolean;
  spinner?: ComponentType<{ className?: string }>;
  skeleton?: boolean;
  rows?: number;
}

/**
 * Error state configuration
 */
export interface ErrorStateConfig {
  message?: string;
  description?: string;
  icon?: ComponentType<{ className?: string }>;
  action?: {
    label: string;
    handler: () => void;
  };
  showDetails?: boolean;
}

/**
 * Field array actions configuration
 */
export interface FieldArrayActions {
  add?: AddActionConfig;
  remove?: RemoveActionConfig;
  reorder?: ReorderActionConfig;
  duplicate?: DuplicateActionConfig;
  clear?: ClearActionConfig;
  
  // Bulk actions
  bulkActions?: BulkActionConfig[];
  
  // Custom actions
  customActions?: CustomActionConfig[];
}

/**
 * Add action configuration
 */
export interface AddActionConfig {
  enabled?: boolean;
  label?: string;
  icon?: ComponentType<{ className?: string }>;
  position?: 'top' | 'bottom' | 'both';
  defaultValue?: FieldArrayItemValue;
  validation?: (item: FieldArrayItemValue) => boolean | string;
  
  // Modal or inline
  addMode?: 'inline' | 'modal' | 'sidebar';
  modalConfig?: ModalConfig;
}

/**
 * Remove action configuration
 */
export interface RemoveActionConfig {
  enabled?: boolean;
  icon?: ComponentType<{ className?: string }>;
  confirmAction?: boolean;
  confirmMessage?: string;
  validation?: (item: FieldArrayItemValue, index: number) => boolean | string;
}

/**
 * Reorder action configuration
 */
export interface ReorderActionConfig {
  enabled?: boolean;
  method?: 'drag-drop' | 'buttons' | 'both';
  handle?: boolean;
  animation?: boolean;
  
  // Drag and drop
  dragHandle?: ComponentType<{ className?: string }>;
  onReorder?: (fromIndex: number, toIndex: number) => void;
}

/**
 * Duplicate action configuration
 */
export interface DuplicateActionConfig {
  enabled?: boolean;
  icon?: ComponentType<{ className?: string }>;
  deepCopy?: boolean;
  validation?: (item: FieldArrayItemValue) => boolean | string;
}

/**
 * Clear action configuration
 */
export interface ClearActionConfig {
  enabled?: boolean;
  label?: string;
  icon?: ComponentType<{ className?: string }>;
  confirmAction?: boolean;
  confirmMessage?: string;
}

/**
 * Bulk action configuration
 */
export interface BulkActionConfig {
  id: string;
  label: string;
  icon?: ComponentType<{ className?: string }>;
  action: (selectedItems: FieldArrayItemValue[], selectedIndexes: number[]) => void;
  disabled?: (selectedItems: FieldArrayItemValue[]) => boolean;
  confirmAction?: boolean;
  confirmMessage?: string;
}

/**
 * Custom action configuration
 */
export interface CustomActionConfig {
  id: string;
  label: string;
  icon?: ComponentType<{ className?: string }>;
  action: (item?: FieldArrayItemValue, index?: number) => void;
  position?: 'toolbar' | 'row' | 'both';
  disabled?: (item?: FieldArrayItemValue, index?: number) => boolean;
  visible?: (item?: FieldArrayItemValue, index?: number) => boolean;
}

/**
 * Modal configuration for add/edit operations
 */
export interface ModalConfig {
  title?: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | 'full';
  closeOnOverlayClick?: boolean;
  closeOnEscape?: boolean;
  showCloseButton?: boolean;
  
  // Form configuration
  formLayout?: 'single-column' | 'two-column' | 'grid';
  submitLabel?: string;
  cancelLabel?: string;
}

// ============================================================================
// VALIDATION AND CONDITIONAL LOGIC
// ============================================================================

/**
 * Field array validation schema with Zod integration
 */
export interface FieldArrayValidationSchema {
  schema?: ZodType<any>;
  required?: boolean;
  minItems?: number;
  maxItems?: number;
  uniqueItems?: boolean;
  itemValidation?: FieldValidation;
  customValidation?: (items: FieldArrayItemValue[]) => boolean | string;
  messages?: FieldArrayValidationMessages;
  
  // Real-time validation
  validateOnChange?: boolean;
  validateOnBlur?: boolean;
  debounceMs?: number;
}

/**
 * Validation error messages for field arrays
 */
export interface FieldArrayValidationMessages {
  required?: string;
  minItems?: string;
  maxItems?: string;
  uniqueItems?: string;
  itemValidation?: string;
  custom?: string;
}

/**
 * Conditional field array configuration
 */
export interface ConditionalFieldArrayConfig {
  conditions: FieldArrayCondition[];
  operator: 'AND' | 'OR';
  actions: ConditionalFieldArrayAction[];
}

/**
 * Field array condition
 */
export interface FieldArrayCondition {
  field: string;
  operator: ComparisonOperator;
  value: any;
  scope?: 'global' | 'item';
}

/**
 * Comparison operators for conditions
 */
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
  | 'isNotNull'
  | 'hasLength'
  | 'matchesPattern';

/**
 * Conditional actions for field arrays
 */
export interface ConditionalFieldArrayAction {
  type: ConditionalActionType;
  target?: string;
  value?: any;
  message?: string;
}

/**
 * Conditional action types
 */
export type ConditionalActionType = 
  | 'show'
  | 'hide'
  | 'enable'
  | 'disable'
  | 'require'
  | 'optional'
  | 'setMinItems'
  | 'setMaxItems'
  | 'setDefaultValue'
  | 'showMessage'
  | 'enableAction'
  | 'disableAction';

// ============================================================================
// INTEGRATION TYPES
// ============================================================================

/**
 * Integration configuration for DynamicField components
 */
export interface DynamicFieldIntegration {
  enabled: boolean;
  fieldMapping: Record<string, DynamicFieldConfig>;
  globalProps?: Partial<DynamicFieldProps>;
  validation?: boolean;
  
  // Event handling
  onFieldChange?: (fieldName: string, value: DynamicFieldValue, index: number) => void;
  onFieldBlur?: (fieldName: string, index: number) => void;
  onFieldFocus?: (fieldName: string, index: number) => void;
  onFieldValidation?: (fieldName: string, isValid: boolean, errors: string[], index: number) => void;
}

/**
 * Dynamic field configuration within field arrays
 */
export interface DynamicFieldConfig {
  type: DynamicFieldType;
  props?: Partial<DynamicFieldProps>;
  validation?: FieldValidation;
  conditional?: ConditionalFieldArrayConfig;
  grid?: GridConfig;
}

/**
 * Integration configuration for VerbPicker components
 */
export interface VerbPickerIntegration {
  enabled: boolean;
  mode: VerbPickerMode;
  fieldName: string;
  props?: Partial<VerbPickerProps>;
  
  // Value transformation
  transformValue?: boolean;
  defaultVerbs?: HttpVerb[];
  
  // Event handling
  onVerbChange?: (verbs: HttpVerb[], index: number) => void;
  onVerbSelection?: (verb: HttpVerb, selected: boolean, index: number) => void;
}

/**
 * Schema field integration for database schema display
 */
export interface SchemaFieldIntegration {
  enabled: boolean;
  schemaFields: SchemaField[];
  tableName?: string;
  
  // Field mapping
  fieldMapping?: Record<string, string>;
  
  // Display configuration
  showFieldTypes?: boolean;
  showConstraints?: boolean;
  showValidation?: boolean;
  
  // Event handling
  onSchemaFieldSelect?: (field: SchemaField, index: number) => void;
  onSchemaFieldChange?: (field: SchemaField, index: number) => void;
}

// ============================================================================
// EVENT HANDLER TYPES
// ============================================================================

/**
 * Field array event handlers
 */
export interface FieldArrayEventHandlers {
  // Item operations
  onItemAdd?: (item: FieldArrayItemValue, index: number) => void;
  onItemRemove?: (item: FieldArrayItemValue, index: number) => void;
  onItemUpdate?: (item: FieldArrayItemValue, index: number, oldItem: FieldArrayItemValue) => void;
  onItemDuplicate?: (item: FieldArrayItemValue, index: number) => void;
  
  // Array operations
  onItemsReorder?: (fromIndex: number, toIndex: number) => void;
  onItemsSwap?: (indexA: number, indexB: number) => void;
  onArrayClear?: () => void;
  onArrayReset?: (defaultValue: FieldArrayValue) => void;
  
  // Selection
  onItemSelect?: (item: FieldArrayItemValue, index: number, selected: boolean) => void;
  onSelectionChange?: (selectedItems: FieldArrayItemValue[], selectedIndexes: number[]) => void;
  
  // Validation
  onValidation?: (isValid: boolean, errors: Record<string, string>, items: FieldArrayItemValue[]) => void;
  onItemValidation?: (isValid: boolean, errors: string[], item: FieldArrayItemValue, index: number) => void;
  
  // User interactions
  onItemClick?: (item: FieldArrayItemValue, index: number, event: MouseEvent) => void;
  onItemDoubleClick?: (item: FieldArrayItemValue, index: number, event: MouseEvent) => void;
  onItemKeyDown?: (item: FieldArrayItemValue, index: number, event: KeyboardEvent) => void;
  
  // Focus and blur
  onFocus?: (index?: number) => void;
  onBlur?: (index?: number) => void;
  
  // Loading states
  onLoadingStart?: () => void;
  onLoadingEnd?: () => void;
  onError?: (error: Error) => void;
}

// ============================================================================
// ACCESSIBILITY TYPES
// ============================================================================

/**
 * Accessibility configuration for field arrays
 */
export interface FieldArrayAccessibilityConfig extends AccessibilityConfig {
  // Screen reader support
  announceItemChanges?: boolean;
  announceValidationErrors?: boolean;
  announceCount?: boolean;
  
  // Keyboard navigation
  keyboardNavigable?: boolean;
  tabThroughItems?: boolean;
  arrowKeyNavigation?: boolean;
  
  // Focus management
  autoFocusNewItems?: boolean;
  focusOnError?: boolean;
  maintainFocusOnReorder?: boolean;
  
  // ARIA attributes
  listRole?: 'list' | 'table' | 'grid' | 'group';
  itemRole?: 'listitem' | 'row' | 'gridcell' | 'option';
  
  // Labels and descriptions
  arrayLabel?: string;
  itemLabel?: (index: number) => string;
  actionLabels?: Record<string, string>;
  
  // Live regions for dynamic updates
  liveRegion?: 'off' | 'polite' | 'assertive';
  announceOperations?: boolean;
}

// ============================================================================
// COMPONENT PROPS UNION TYPES
// ============================================================================

/**
 * Complete field array component props combining all configuration options
 */
export interface FieldArrayProps<TFieldValues extends FieldValues = FieldValues>
  extends FieldArrayBaseProps,
          FieldArrayFormProps<TFieldValues> {
  
  // Configuration
  config?: ConfigSchema;
  
  // Layout and display
  layout?: FieldArrayLayout;
  display?: FieldArrayDisplay;
  actions?: FieldArrayActions;
  
  // Integration
  dynamicFields?: DynamicFieldIntegration;
  verbPicker?: VerbPickerIntegration;
  schemaFields?: SchemaFieldIntegration;
  
  // Validation
  validation?: FieldArrayValidationSchema;
  conditional?: ConditionalFieldArrayConfig;
  
  // Event handlers
  eventHandlers?: FieldArrayEventHandlers;
  
  // Accessibility
  accessibility?: FieldArrayAccessibilityConfig;
  
  // Performance
  virtualScrolling?: VirtualScrollingConfig;
  
  // Theme and styling
  theme?: FieldArrayTheme;
}

/**
 * Field array theme configuration
 */
export interface FieldArrayTheme {
  colors?: {
    background: string;
    border: string;
    header: string;
    row: string;
    selectedRow: string;
    error: string;
    success: string;
  };
  spacing?: {
    padding: string;
    margin: string;
    gap: string;
  };
  typography?: {
    fontSize: string;
    fontWeight: string;
    lineHeight: string;
  };
  borders?: {
    radius: string;
    width: string;
    style: string;
  };
}

// ============================================================================
// COMPONENT REF AND UTILITY TYPES
// ============================================================================

/**
 * Field array component ref interface for imperative operations
 */
export interface FieldArrayRef {
  // Focus management
  focus: (index?: number) => void;
  blur: () => void;
  
  // Array operations
  add: (item?: FieldArrayItemValue, index?: number) => void;
  remove: (index: number) => void;
  update: (index: number, item: FieldArrayItemValue) => void;
  move: (fromIndex: number, toIndex: number) => void;
  clear: () => void;
  reset: (value?: FieldArrayValue) => void;
  
  // Validation
  validate: () => Promise<boolean>;
  validateItem: (index: number) => Promise<boolean>;
  
  // Selection
  selectItem: (index: number, selected?: boolean) => void;
  selectAll: () => void;
  clearSelection: () => void;
  getSelection: () => { items: FieldArrayItemValue[]; indexes: number[] };
  
  // Value management
  getValue: () => FieldArrayValue;
  setValue: (value: FieldArrayValue) => void;
  getItem: (index: number) => FieldArrayItemValue;
  setItem: (index: number, item: FieldArrayItemValue) => void;
  
  // State
  getState: () => FieldArrayState;
  isValid: () => boolean;
  isDirty: () => boolean;
  getErrors: () => Record<string, string>;
}

/**
 * Field array component state
 */
export interface FieldArrayState {
  items: FieldArrayItemValue[];
  selectedIndexes: number[];
  focusedIndex?: number;
  isValid: boolean;
  isDirty: boolean;
  isTouched: boolean;
  isValidating: boolean;
  errors: Record<string, string>;
  itemErrors: Record<number, Record<string, string>>;
}

// ============================================================================
// UTILITY AND LEGACY COMPATIBILITY TYPES
// ============================================================================

/**
 * Legacy compatibility types for Angular migration
 * @deprecated Use FieldArrayProps instead
 */
export type LegacyFieldArrayConfig = {
  type: 'array' | 'object';
  items?: any[];
  native?: any[];
  value?: any[];
};

/**
 * Type guards for field array values
 */
export const isFieldArrayValue = (value: any): value is FieldArrayValue => {
  return value === null || value === undefined || Array.isArray(value) || 
         (typeof value === 'object' && value !== null);
};

export const isFieldArrayItemValue = (value: any): value is FieldArrayItemValue => {
  return typeof value === 'object' || Array.isArray(value) || 
         typeof value === 'string' || typeof value === 'number' || 
         typeof value === 'boolean';
};

/**
 * Utility type for extracting item type from field array
 */
export type ExtractFieldArrayItemType<T extends FieldArrayValue> = 
  T extends (infer U)[] ? U : 
  T extends Record<string, any> ? T : 
  never;

/**
 * Required props helper type
 */
export type RequiredFieldArrayProps<T, K extends keyof T> = T & Required<Pick<T, K>>;

/**
 * Partial configuration for optional setup
 */
export type PartialFieldArrayConfig<T> = Partial<T> & Pick<T, 'name' | 'dataType'>;

// ============================================================================
// DEFAULT EXPORT TYPE
// ============================================================================

/**
 * Main field array component type export
 */
export interface FieldArrayComponent<TFieldValues extends FieldValues = FieldValues> {
  (props: FieldArrayProps<TFieldValues>): JSX.Element;
  displayName?: string;
}

// Re-export commonly used React Hook Form types for convenience
export type {
  UseFormRegister,
  Control,
  FieldError,
  FieldValues,
  FieldPath,
  FieldArrayPath,
  RegisterOptions,
  UseFieldArrayReturn,
  FieldArray as ReactHookFormFieldArray
} from 'react-hook-form';

// Re-export Zod types for validation
export type { ZodSchema, ZodType } from 'zod';

// Re-export component types for integration
export type {
  DynamicFieldProps,
  VerbPickerProps
} from '../dynamic-field/dynamic-field.types';