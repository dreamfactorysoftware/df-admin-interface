/**
 * TypeScript Type Definitions for LookupKeys Component System
 * 
 * Comprehensive type definitions for the LookupKeys component that manages
 * dynamic key-value pairs with React Hook Form useFieldArray integration.
 * Provides type-safe interfaces for lookup key entries, component props,
 * form integration patterns, and accessibility compliance.
 * 
 * Replaces Angular df-lookup-keys component types with modern React equivalents
 * supporting React Hook Form, Zod validation, and WCAG 2.1 AA accessibility.
 * 
 * @fileoverview LookupKeys component type definitions with React Hook Form integration
 * @version 1.0.0
 */

import { type ReactNode, type ComponentType, type RefObject } from 'react';
import { 
  type UseFieldArrayReturn, 
  type Control, 
  type FieldErrors, 
  type FieldValues, 
  type Path,
  type UseFormRegister,
  type UseFormSetValue,
  type UseFormWatch,
  type UseFormTrigger 
} from 'react-hook-form';
import { type ZodSchema, type ZodType, type infer as ZodInfer } from 'zod';
import { 
  type BaseComponentProps,
  type FormComponentProps,
  type ComponentAccessibilityProps,
  type ThemeComponentProps,
  type FieldArrayComponentProps,
  type ComponentVariant,
  type ComponentSize,
  type AnimationConfig
} from '../../types/components';
import { 
  type FormFieldConfig,
  type FormFieldValidation,
  type EnhancedValidationState,
  type FormEventHandlers
} from '../../types/forms';

// ============================================================================
// LOOKUP KEY ENTRY TYPES
// ============================================================================

/**
 * Individual lookup key entry interface
 * Represents a single key-value pair with privacy and metadata properties
 */
export interface LookupKeyEntry {
  /** Unique identifier for the entry */
  id?: string;
  
  /** The key name */
  name: string;
  
  /** The key value */
  value: string;
  
  /** Whether this key should be private/hidden */
  private: boolean;
  
  /** Optional description or help text */
  description?: string;
  
  /** Entry creation timestamp */
  createdAt?: Date;
  
  /** Entry last modified timestamp */
  updatedAt?: Date;
  
  /** Whether entry is system-generated and read-only */
  readonly?: boolean;
  
  /** Entry validation errors */
  errors?: LookupKeyEntryErrors;
  
  /** Custom metadata */
  metadata?: Record<string, any>;
}

/**
 * Validation errors for lookup key entries
 */
export interface LookupKeyEntryErrors {
  /** Name field validation error */
  name?: string;
  
  /** Value field validation error */
  value?: string;
  
  /** General entry validation error */
  entry?: string;
}

/**
 * Lookup key entry creation/update payload
 */
export interface LookupKeyEntryInput {
  /** The key name */
  name: string;
  
  /** The key value */
  value: string;
  
  /** Whether this key should be private/hidden */
  private?: boolean;
  
  /** Optional description */
  description?: string;
  
  /** Custom metadata */
  metadata?: Record<string, any>;
}

/**
 * Lookup key entry validation schema types
 */
export interface LookupKeyValidationSchemas {
  /** Individual entry validation schema */
  entrySchema: ZodSchema<LookupKeyEntry>;
  
  /** Entry input validation schema */
  entryInputSchema: ZodSchema<LookupKeyEntryInput>;
  
  /** Array of entries validation schema */
  entriesSchema: ZodSchema<LookupKeyEntry[]>;
  
  /** Key name validation schema */
  nameSchema: ZodSchema<string>;
  
  /** Key value validation schema */
  valueSchema: ZodSchema<string>;
}

// ============================================================================
// COMPONENT PROPS INTERFACES
// ============================================================================

/**
 * Core LookupKeys component props interface
 * Extends form component props with field array integration
 */
export interface LookupKeysProps<
  TFieldValues extends FieldValues = FieldValues,
  TFieldName extends Path<TFieldValues> = Path<TFieldValues>
> extends FormComponentProps, ThemeComponentProps {
  /** Field array return object from useFieldArray hook */
  fieldArray: UseFieldArrayReturn<TFieldValues, TFieldName>;
  
  /** Form control object */
  control: Control<TFieldValues>;
  
  /** Form register function */
  register: UseFormRegister<TFieldValues>;
  
  /** Form setValue function */
  setValue: UseFormSetValue<TFieldValues>;
  
  /** Form watch function */
  watch: UseFormWatch<TFieldValues>;
  
  /** Form trigger validation function */
  trigger: UseFormTrigger<TFieldValues>;
  
  /** Field errors */
  errors?: FieldErrors<TFieldValues>;
  
  /** Component configuration */
  config?: LookupKeysConfig;
  
  /** Display layout variant */
  layout?: LookupKeysLayout;
  
  /** Component size */
  size?: ComponentSize;
  
  /** Component variant */
  variant?: ComponentVariant;
  
  /** Event handlers */
  handlers?: LookupKeysEventHandlers<TFieldValues>;
  
  /** Accessibility configuration */
  accessibility?: LookupKeysAccessibility;
  
  /** Validation configuration */
  validation?: LookupKeysValidation;
  
  /** Styling configuration */
  styling?: LookupKeysStyling;
  
  /** Performance optimization settings */
  performance?: LookupKeysPerformance;
}

/**
 * LookupKeys component configuration
 */
export interface LookupKeysConfig {
  /** Minimum number of entries allowed */
  minEntries?: number;
  
  /** Maximum number of entries allowed */
  maxEntries?: number;
  
  /** Default entry template */
  defaultEntry?: Partial<LookupKeyEntry>;
  
  /** Allow duplicate key names */
  allowDuplicateNames?: boolean;
  
  /** Show entry indices */
  showIndices?: boolean;
  
  /** Show entry timestamps */
  showTimestamps?: boolean;
  
  /** Enable drag and drop reordering */
  enableReordering?: boolean;
  
  /** Enable bulk operations */
  enableBulkOperations?: boolean;
  
  /** Show privacy toggle for all entries */
  showPrivacyToggle?: boolean;
  
  /** Default privacy state for new entries */
  defaultPrivate?: boolean;
  
  /** Enable entry descriptions */
  enableDescriptions?: boolean;
  
  /** Read-only mode */
  readOnly?: boolean;
  
  /** Dense mode for compact display */
  dense?: boolean;
}

/**
 * LookupKeys display layout options
 */
export type LookupKeysLayout = 
  | 'table'      // Table layout with columns
  | 'accordion'  // Accordion layout with collapsible sections
  | 'cards'      // Card-based layout
  | 'list'       // Simple list layout
  | 'grid';      // Grid layout for large datasets

/**
 * LookupKeys event handlers interface
 */
export interface LookupKeysEventHandlers<TFieldValues extends FieldValues = FieldValues> 
  extends FormEventHandlers {
  /** Entry addition handler */
  onAddEntry?: (entry: LookupKeyEntryInput) => void | Promise<void>;
  
  /** Entry removal handler */
  onRemoveEntry?: (index: number, entry: LookupKeyEntry) => void | Promise<void>;
  
  /** Entry update handler */
  onUpdateEntry?: (index: number, entry: LookupKeyEntry, changes: Partial<LookupKeyEntry>) => void | Promise<void>;
  
  /** Entry reorder handler */
  onReorderEntries?: (fromIndex: number, toIndex: number) => void | Promise<void>;
  
  /** Privacy toggle handler */
  onTogglePrivacy?: (index: number, isPrivate: boolean) => void | Promise<void>;
  
  /** Bulk operation handler */
  onBulkOperation?: (operation: BulkOperation, indices: number[]) => void | Promise<void>;
  
  /** Entry validation handler */
  onValidateEntry?: (entry: LookupKeyEntry, index: number) => Promise<LookupKeyEntryErrors | null>;
  
  /** Duplicate detection handler */
  onDuplicateDetected?: (duplicates: DuplicateEntry[]) => void;
  
  /** Import handler */
  onImport?: (entries: LookupKeyEntry[]) => void | Promise<void>;
  
  /** Export handler */
  onExport?: (format: ExportFormat) => void | Promise<void>;
}

/**
 * Bulk operation types
 */
export type BulkOperation = 
  | 'delete'
  | 'toggle-privacy'
  | 'mark-private'
  | 'mark-public'
  | 'duplicate'
  | 'export';

/**
 * Duplicate entry detection result
 */
export interface DuplicateEntry {
  /** Index of the duplicate entry */
  index: number;
  
  /** The duplicate entry */
  entry: LookupKeyEntry;
  
  /** Indices of other entries with the same name */
  duplicateIndices: number[];
}

/**
 * Export format options
 */
export type ExportFormat = 
  | 'json'
  | 'csv'
  | 'yaml'
  | 'env'
  | 'properties';

// ============================================================================
// ACCESSIBILITY INTERFACES
// ============================================================================

/**
 * LookupKeys accessibility configuration for WCAG 2.1 AA compliance
 */
export interface LookupKeysAccessibility extends ComponentAccessibilityProps {
  /** Table caption for screen readers */
  tableCaption?: string;
  
  /** Column headers for screen readers */
  columnHeaders?: {
    name: string;
    value: string;
    private: string;
    actions: string;
  };
  
  /** Screen reader announcements */
  announcements?: {
    entryAdded: string;
    entryRemoved: string;
    entryUpdated: string;
    privacyToggled: string;
    validationError: string;
  };
  
  /** Keyboard navigation configuration */
  keyboardNavigation?: {
    enableArrowKeys: boolean;
    enableHomeEnd: boolean;
    enablePageUpDown: boolean;
    trapFocus: boolean;
  };
  
  /** Focus management */
  focusManagement?: {
    autoFocusNewEntry: boolean;
    focusOnError: boolean;
    preserveFocusOnUpdate: boolean;
  };
  
  /** ARIA live region configuration */
  liveRegion?: {
    politeness: 'off' | 'polite' | 'assertive';
    atomic: boolean;
    relevant: string;
  };
  
  /** High contrast mode support */
  highContrast?: {
    enabled: boolean;
    customColors?: Record<string, string>;
  };
}

// ============================================================================
// VALIDATION INTERFACES
// ============================================================================

/**
 * LookupKeys validation configuration
 */
export interface LookupKeysValidation {
  /** Validation schemas */
  schemas: LookupKeyValidationSchemas;
  
  /** Real-time validation settings */
  realTime?: {
    enabled: boolean;
    debounceMs: number;
    validateOnChange: boolean;
    validateOnBlur: boolean;
  };
  
  /** Custom validation rules */
  customRules?: {
    nameValidation?: (name: string, entries: LookupKeyEntry[], index?: number) => string | null;
    valueValidation?: (value: string, name: string, entries: LookupKeyEntry[], index?: number) => string | null;
    entryValidation?: (entry: LookupKeyEntry, entries: LookupKeyEntry[], index: number) => LookupKeyEntryErrors | null;
  };
  
  /** Validation timing */
  timing?: {
    debounceMs: number;
    maxValidationTime: number;
    batchValidation: boolean;
  };
  
  /** Error display configuration */
  errorDisplay?: {
    showInline: boolean;
    showSummary: boolean;
    groupSimilarErrors: boolean;
    maxErrorsDisplayed: number;
  };
}

// ============================================================================
// STYLING INTERFACES
// ============================================================================

/**
 * LookupKeys styling configuration
 */
export interface LookupKeysStyling {
  /** Table styling options */
  table?: {
    striped: boolean;
    bordered: boolean;
    hoverable: boolean;
    compact: boolean;
    stickyHeader: boolean;
  };
  
  /** Input field styling */
  inputs?: {
    variant: 'outline' | 'filled' | 'ghost';
    size: ComponentSize;
    rounded: boolean;
  };
  
  /** Button styling */
  buttons?: {
    variant: ComponentVariant;
    size: ComponentSize;
    iconOnly: boolean;
  };
  
  /** Privacy indicator styling */
  privacyIndicator?: {
    showIcon: boolean;
    showText: boolean;
    position: 'left' | 'right' | 'inline';
  };
  
  /** Animation configuration */
  animations?: {
    entryAdd: AnimationConfig;
    entryRemove: AnimationConfig;
    entryUpdate: AnimationConfig;
    reorder: AnimationConfig;
  };
  
  /** Color scheme */
  colors?: {
    primary: string;
    secondary: string;
    success: string;
    warning: string;
    error: string;
    private: string;
    public: string;
  };
  
  /** Spacing configuration */
  spacing?: {
    compact: boolean;
    cellPadding: string;
    rowGap: string;
    columnGap: string;
  };
}

// ============================================================================
// PERFORMANCE INTERFACES
// ============================================================================

/**
 * LookupKeys performance optimization settings
 */
export interface LookupKeysPerformance {
  /** Virtualization settings for large datasets */
  virtualization?: {
    enabled: boolean;
    threshold: number;
    itemHeight: number;
    overscan: number;
  };
  
  /** Debouncing configuration */
  debouncing?: {
    validation: number;
    search: number;
    reorder: number;
  };
  
  /** Memoization settings */
  memoization?: {
    entries: boolean;
    validation: boolean;
    rendering: boolean;
  };
  
  /** Lazy loading configuration */
  lazyLoading?: {
    enabled: boolean;
    pageSize: number;
    preloadPages: number;
  };
  
  /** Performance monitoring */
  monitoring?: {
    enabled: boolean;
    logSlowOperations: boolean;
    maxRenderTime: number;
    maxValidationTime: number;
  };
}

// ============================================================================
// FORM INTEGRATION INTERFACES
// ============================================================================

/**
 * React Hook Form field array integration types
 */
export interface LookupKeysFieldArrayIntegration<
  TFieldValues extends FieldValues = FieldValues,
  TFieldName extends Path<TFieldValues> = Path<TFieldValues>
> {
  /** Field array methods */
  methods: UseFieldArrayReturn<TFieldValues, TFieldName>;
  
  /** Field name path */
  name: TFieldName;
  
  /** Field array validation */
  validation: {
    minLength?: number;
    maxLength?: number;
    uniqueNames?: boolean;
    requiredFields?: (keyof LookupKeyEntry)[];
  };
  
  /** Default values factory */
  defaultValues: () => LookupKeyEntry;
  
  /** Value transformer functions */
  transformers?: {
    input?: (value: any) => LookupKeyEntry;
    output?: (entry: LookupKeyEntry) => any;
  };
}

/**
 * Form state integration interface
 */
export interface LookupKeysFormState<TFieldValues extends FieldValues = FieldValues> {
  /** Current form values */
  values: TFieldValues;
  
  /** Form validation errors */
  errors: FieldErrors<TFieldValues>;
  
  /** Form dirty state */
  isDirty: boolean;
  
  /** Form touched state */
  isTouched: boolean;
  
  /** Form validation state */
  isValid: boolean;
  
  /** Form submission state */
  isSubmitting: boolean;
  
  /** Field-specific validation states */
  fieldStates: Map<string, EnhancedValidationState>;
}

// ============================================================================
// CONTEXT INTERFACES
// ============================================================================

/**
 * LookupKeys context interface for provider pattern
 */
export interface LookupKeysContextValue<
  TFieldValues extends FieldValues = FieldValues,
  TFieldName extends Path<TFieldValues> = Path<TFieldValues>
> {
  /** Component configuration */
  config: LookupKeysConfig;
  
  /** Field array integration */
  fieldArray: LookupKeysFieldArrayIntegration<TFieldValues, TFieldName>;
  
  /** Form state */
  formState: LookupKeysFormState<TFieldValues>;
  
  /** Event handlers */
  handlers: LookupKeysEventHandlers<TFieldValues>;
  
  /** Accessibility configuration */
  accessibility: LookupKeysAccessibility;
  
  /** Validation configuration */
  validation: LookupKeysValidation;
  
  /** Styling configuration */
  styling: LookupKeysStyling;
  
  /** Performance settings */
  performance: LookupKeysPerformance;
  
  /** Component references */
  refs: {
    container: RefObject<HTMLDivElement>;
    table: RefObject<HTMLTableElement>;
    addButton: RefObject<HTMLButtonElement>;
  };
}

/**
 * LookupKeys provider props
 */
export interface LookupKeysProviderProps<
  TFieldValues extends FieldValues = FieldValues,
  TFieldName extends Path<TFieldValues> = Path<TFieldValues>
> extends BaseComponentProps {
  /** Initial configuration */
  config?: Partial<LookupKeysConfig>;
  
  /** Field array integration */
  fieldArray: LookupKeysFieldArrayIntegration<TFieldValues, TFieldName>;
  
  /** Event handlers */
  handlers?: Partial<LookupKeysEventHandlers<TFieldValues>>;
  
  /** Custom validation schemas */
  schemas?: Partial<LookupKeyValidationSchemas>;
}

// ============================================================================
// UTILITY TYPES
// ============================================================================

/**
 * Lookup key entry with form field metadata
 */
export type LookupKeyEntryWithField<T = any> = LookupKeyEntry & {
  /** React Hook Form field metadata */
  field: T;
  
  /** Field index in array */
  index: number;
  
  /** Field validation state */
  validationState: EnhancedValidationState;
};

/**
 * Lookup keys operation result
 */
export interface LookupKeysOperationResult<T = any> {
  /** Operation success status */
  success: boolean;
  
  /** Operation result data */
  data?: T;
  
  /** Operation error */
  error?: Error;
  
  /** Validation errors */
  validationErrors?: LookupKeyEntryErrors[];
  
  /** Performance metrics */
  metrics?: {
    duration: number;
    memoryUsage: number;
    validationTime: number;
  };
}

/**
 * Lookup keys hook return type
 */
export interface UseLookupKeysReturn<
  TFieldValues extends FieldValues = FieldValues,
  TFieldName extends Path<TFieldValues> = Path<TFieldValues>
> {
  /** Field array methods */
  fieldArray: UseFieldArrayReturn<TFieldValues, TFieldName>;
  
  /** Add entry function */
  addEntry: (entry?: Partial<LookupKeyEntry>) => Promise<LookupKeysOperationResult>;
  
  /** Remove entry function */
  removeEntry: (index: number) => Promise<LookupKeysOperationResult>;
  
  /** Update entry function */
  updateEntry: (index: number, changes: Partial<LookupKeyEntry>) => Promise<LookupKeysOperationResult>;
  
  /** Toggle privacy function */
  togglePrivacy: (index: number) => Promise<LookupKeysOperationResult>;
  
  /** Validate entries function */
  validateEntries: () => Promise<LookupKeysOperationResult<FieldErrors<TFieldValues>>>;
  
  /** Get duplicate entries */
  getDuplicates: () => DuplicateEntry[];
  
  /** Form state */
  formState: LookupKeysFormState<TFieldValues>;
  
  /** Configuration */
  config: LookupKeysConfig;
}

// ============================================================================
// EXPORT TYPES
// ============================================================================

export type {
  // Zod schema inference
  ZodInfer
} from 'zod';

// Default export for main component props
export type LookupKeysComponentProps<
  TFieldValues extends FieldValues = FieldValues,
  TFieldName extends Path<TFieldValues> = Path<TFieldValues>
> = LookupKeysProps<TFieldValues, TFieldName>;