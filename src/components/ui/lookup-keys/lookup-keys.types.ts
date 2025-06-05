/**
 * TypeScript type definitions for the LookupKeys component system
 * 
 * This file provides comprehensive type safety for the LookupKeys component,
 * ensuring proper React Hook Form integration, Zod validation compatibility,
 * and WCAG 2.1 AA accessibility compliance per technical specification.
 * 
 * @version React 19.0.0 / Next.js 15.1+ / TypeScript 5.8+
 */

import type { ReactNode, AriaAttributes, HTMLAttributes } from 'react';
import type { 
  FieldPath, 
  FieldValues, 
  Control, 
  FieldArrayWithId,
  UseFieldArrayReturn,
  FieldError,
  Path
} from 'react-hook-form';
import type { z } from 'zod';

// =============================================================================
// Core Lookup Key Types
// =============================================================================

/**
 * Core lookup key entry object structure
 * Represents a single key-value pair with privacy controls
 */
export interface LookupKeyEntry {
  /** Unique identifier for the lookup key entry */
  id?: string;
  /** The key name - used as the lookup identifier */
  name: string;
  /** The associated value for the key */
  value: string;
  /** Whether this key-value pair should be treated as private/sensitive */
  private: boolean;
}

/**
 * Lookup key entry creation payload (without ID)
 * Used for creating new entries before they're persisted
 */
export type LookupKeyCreatePayload = Omit<LookupKeyEntry, 'id'>;

/**
 * Lookup key entry update payload (partial updates allowed)
 * Used for updating existing entries with only changed fields
 */
export type LookupKeyUpdatePayload = Partial<LookupKeyEntry> & { id: string };

// =============================================================================
// Form Integration Types
// =============================================================================

/**
 * Form values structure for lookup keys integration
 * Generic type to support different form contexts
 */
export interface LookupKeysFormValues extends FieldValues {
  /** Array of lookup key entries managed by useFieldArray */
  lookupKeys: LookupKeyEntry[];
}

/**
 * React Hook Form field array configuration for lookup keys
 * Provides type safety for useFieldArray integration
 */
export interface LookupKeysFieldArrayConfig<
  TFieldValues extends FieldValues = LookupKeysFormValues,
  TFieldArrayName extends FieldPath<TFieldValues> = 'lookupKeys',
  TKeyName extends string = 'id'
> {
  /** The field array name in the form */
  name: TFieldArrayName;
  /** Control instance from React Hook Form */
  control: Control<TFieldValues>;
  /** Optional key name for field identification */
  keyName?: TKeyName;
}

/**
 * Enhanced useFieldArray return type with lookup keys specifics
 * Extends React Hook Form's UseFieldArrayReturn with lookup key operations
 */
export interface LookupKeysFieldArrayReturn<
  TFieldValues extends FieldValues = LookupKeysFormValues,
  TFieldArrayName extends FieldPath<TFieldValues> = 'lookupKeys',
  TKeyName extends string = 'id'
> extends UseFieldArrayReturn<TFieldValues, TFieldArrayName, TKeyName> {
  /** Array of field entries with React Hook Form metadata */
  fields: FieldArrayWithId<TFieldValues, TFieldArrayName, TKeyName>[];
  /** Add a new lookup key entry */
  append: (value: LookupKeyEntry | LookupKeyEntry[]) => void;
  /** Remove lookup key entry at specified index */
  remove: (index?: number | number[]) => void;
  /** Insert lookup key entry at specified position */
  insert: (index: number, value: LookupKeyEntry | LookupKeyEntry[]) => void;
  /** Update specific lookup key entry */
  update: (index: number, value: LookupKeyEntry) => void;
  /** Replace entire field array */
  replace: (value: LookupKeyEntry[]) => void;
}

// =============================================================================
// Validation Schema Types
// =============================================================================

/**
 * Zod validation schema type for individual lookup key entries
 * Ensures runtime type checking and compile-time inference
 */
export type LookupKeyEntrySchema = z.ZodObject<{
  id: z.ZodOptional<z.ZodString>;
  name: z.ZodString;
  value: z.ZodString;
  private: z.ZodBoolean;
}>;

/**
 * Zod validation schema type for the complete lookup keys array
 * Provides array-level validation and constraints
 */
export type LookupKeysArraySchema = z.ZodArray<LookupKeyEntrySchema>;

/**
 * Zod validation schema type for forms containing lookup keys
 * Generic type for broader form integration
 */
export type LookupKeysFormSchema<T extends Record<string, any> = {}> = z.ZodObject<{
  lookupKeys: LookupKeysArraySchema;
} & T>;

/**
 * Validation error structure for lookup keys
 * Maps field paths to error messages for display
 */
export interface LookupKeysValidationErrors {
  /** Root-level errors for the entire array */
  root?: FieldError;
  /** Index-specific errors for individual entries */
  [index: number]: {
    id?: FieldError;
    name?: FieldError;
    value?: FieldError;
    private?: FieldError;
  };
}

// =============================================================================
// Component Props & Styling Types
// =============================================================================

/**
 * Display layout variants for the lookup keys component
 * Supports different presentation modes based on context
 */
export type LookupKeysLayoutVariant = 'table' | 'accordion' | 'cards';

/**
 * Size variants for the lookup keys component
 * Provides consistent sizing across different use cases
 */
export type LookupKeysSize = 'sm' | 'md' | 'lg';

/**
 * Color theme variants for consistent component theming
 * Aligns with design system color tokens
 */
export type LookupKeysColorVariant = 'default' | 'primary' | 'secondary';

/**
 * Styling configuration for lookup keys component
 * Provides granular control over component appearance
 */
export interface LookupKeysStyling {
  /** Layout variant selection */
  variant?: LookupKeysLayoutVariant;
  /** Component size */
  size?: LookupKeysSize;
  /** Color theme */
  colorVariant?: LookupKeysColorVariant;
  /** Additional CSS classes */
  className?: string;
  /** Inline styles override */
  style?: React.CSSProperties;
  /** Enable dark mode styling */
  darkMode?: boolean;
}

// =============================================================================
// Accessibility Types (WCAG 2.1 AA Compliance)
// =============================================================================

/**
 * Accessibility configuration for WCAG 2.1 AA compliance
 * Ensures proper screen reader support and keyboard navigation
 */
export interface LookupKeysAccessibility extends AriaAttributes {
  /** Descriptive label for the entire lookup keys section */
  'aria-label'?: string;
  /** Reference to element describing the lookup keys purpose */
  'aria-describedby'?: string;
  /** Indicate if the section is required */
  'aria-required'?: boolean;
  /** Current validation state */
  'aria-invalid'?: boolean;
  /** Live region for announcing changes */
  'aria-live'?: 'off' | 'polite' | 'assertive';
  /** Atomic updates for screen readers */
  'aria-atomic'?: boolean;
  /** Role override for semantic meaning */
  role?: string;
  /** Tab index for keyboard navigation */
  tabIndex?: number;
}

/**
 * Focus management configuration for keyboard navigation
 * Ensures proper focus behavior per WCAG guidelines
 */
export interface LookupKeysFocusConfig {
  /** Enable automatic focus management */
  autoFocus?: boolean;
  /** Focus trap within component */
  trapFocus?: boolean;
  /** Return focus to trigger element */
  restoreFocus?: boolean;
  /** Focus ring visibility control */
  showFocusRing?: boolean;
  /** Focus ring color variant */
  focusRingColor?: 'primary' | 'error' | 'success';
}

// =============================================================================
// Event Handler Types
// =============================================================================

/**
 * Lookup key entry event data
 * Provides context for event handlers
 */
export interface LookupKeyEntryEventData {
  /** The entry that triggered the event */
  entry: LookupKeyEntry;
  /** Index in the array */
  index: number;
  /** Field name for form integration */
  fieldName: string;
}

/**
 * Event handler function types for lookup key operations
 * Provides type safety for callback functions
 */
export interface LookupKeysEventHandlers {
  /** Called when a new entry is added */
  onAdd?: (entry: LookupKeyCreatePayload) => void | Promise<void>;
  /** Called when an entry is removed */
  onRemove?: (data: LookupKeyEntryEventData) => void | Promise<void>;
  /** Called when an entry is updated */
  onChange?: (data: LookupKeyEntryEventData) => void | Promise<void>;
  /** Called when validation fails */
  onValidationError?: (errors: LookupKeysValidationErrors) => void;
  /** Called when the privacy toggle is changed */
  onPrivacyToggle?: (data: LookupKeyEntryEventData & { private: boolean }) => void;
  /** Called on focus events for accessibility */
  onFocus?: (data: LookupKeyEntryEventData) => void;
  /** Called on blur events for validation */
  onBlur?: (data: LookupKeyEntryEventData) => void;
  /** Called when keyboard shortcuts are triggered */
  onKeyboardShortcut?: (key: string, data: LookupKeyEntryEventData) => void;
}

// =============================================================================
// Main Component Props Interface
// =============================================================================

/**
 * Comprehensive props interface for the LookupKeys component
 * Combines all configuration options with proper type safety
 */
export interface LookupKeysProps<
  TFieldValues extends FieldValues = LookupKeysFormValues,
  TFieldArrayName extends FieldPath<TFieldValues> = 'lookupKeys'
> extends HTMLAttributes<HTMLDivElement> {
  // Form Integration
  /** React Hook Form field array configuration */
  fieldArray: LookupKeysFieldArrayConfig<TFieldValues, TFieldArrayName>;
  /** Default values for new entries */
  defaultEntry?: Partial<LookupKeyCreatePayload>;
  /** Enable form validation */
  enableValidation?: boolean;
  /** Custom validation schema override */
  validationSchema?: LookupKeysFormSchema;

  // Display Configuration
  /** Styling and layout configuration */
  styling?: LookupKeysStyling;
  /** Show/hide the accordion layout option */
  showAccordion?: boolean;
  /** Enable privacy toggle controls */
  enablePrivacyToggle?: boolean;
  /** Allow empty entries */
  allowEmpty?: boolean;
  /** Maximum number of entries allowed */
  maxEntries?: number;
  /** Minimum number of entries required */
  minEntries?: number;

  // Accessibility
  /** WCAG 2.1 AA accessibility configuration */
  accessibility?: LookupKeysAccessibility;
  /** Focus management configuration */
  focusConfig?: LookupKeysFocusConfig;
  /** Enable keyboard shortcuts */
  enableKeyboardShortcuts?: boolean;

  // Event Handlers
  /** Event handler callbacks */
  eventHandlers?: LookupKeysEventHandlers;

  // Content Configuration
  /** Custom labels for internationalization */
  labels?: {
    addButton?: string;
    removeButton?: string;
    nameLabel?: string;
    valueLabel?: string;
    privateLabel?: string;
    nameTooltip?: string;
    valueTooltip?: string;
    privateTooltip?: string;
    emptyStateMessage?: string;
    validationMessages?: {
      required?: string;
      duplicate?: string;
      invalid?: string;
    };
  };

  // Loading & States
  /** Loading state indicator */
  isLoading?: boolean;
  /** Disabled state */
  disabled?: boolean;
  /** Read-only mode */
  readOnly?: boolean;
  /** Error state */
  hasError?: boolean;
  /** Error message to display */
  errorMessage?: string;

  // Advanced Configuration
  /** Custom row renderer */
  renderEntry?: (
    entry: LookupKeyEntry,
    index: number,
    helpers: LookupKeysFieldArrayReturn<TFieldValues, TFieldArrayName>
  ) => ReactNode;
  /** Custom add button renderer */
  renderAddButton?: (onClick: () => void) => ReactNode;
  /** Custom empty state renderer */
  renderEmptyState?: () => ReactNode;
  /** Custom validation message renderer */
  renderValidationMessage?: (error: FieldError) => ReactNode;

  // Theme Integration
  /** Theme context override */
  theme?: 'light' | 'dark' | 'auto';
  /** Custom CSS variables */
  cssVariables?: Record<string, string>;
}

// =============================================================================
// Utility Types
// =============================================================================

/**
 * Extract lookup keys from form values
 * Utility type for working with nested form structures
 */
export type ExtractLookupKeys<T extends FieldValues> = T extends { lookupKeys: infer U }
  ? U extends LookupKeyEntry[]
    ? U
    : never
  : never;

/**
 * Form path type for lookup key fields
 * Provides type-safe path references for form operations
 */
export type LookupKeyFieldPath<
  TFieldValues extends FieldValues = LookupKeysFormValues,
  TFieldArrayName extends FieldPath<TFieldValues> = 'lookupKeys'
> = `${TFieldArrayName}.${number}.${'name' | 'value' | 'private'}`;

/**
 * Component ref type for imperative operations
 * Supports direct component manipulation when needed
 */
export interface LookupKeysRef {
  /** Add a new entry programmatically */
  addEntry: (entry?: Partial<LookupKeyCreatePayload>) => void;
  /** Remove entry at index */
  removeEntry: (index: number) => void;
  /** Focus specific entry field */
  focusEntry: (index: number, field?: 'name' | 'value' | 'private') => void;
  /** Validate all entries */
  validate: () => Promise<boolean>;
  /** Reset to default state */
  reset: () => void;
  /** Get current entries */
  getEntries: () => LookupKeyEntry[];
}

// =============================================================================
// Context Types
// =============================================================================

/**
 * Context type for lookup keys component configuration
 * Enables nested component communication and shared state
 */
export interface LookupKeysContextValue {
  /** Current entries */
  entries: LookupKeyEntry[];
  /** Field array helpers */
  fieldArrayHelpers: LookupKeysFieldArrayReturn;
  /** Styling configuration */
  styling: Required<LookupKeysStyling>;
  /** Accessibility configuration */
  accessibility: Required<LookupKeysAccessibility>;
  /** Event handlers */
  eventHandlers: LookupKeysEventHandlers;
  /** Validation state */
  validationState: {
    isValid: boolean;
    errors: LookupKeysValidationErrors;
    touchedFields: Set<string>;
  };
  /** Theme configuration */
  theme: {
    mode: 'light' | 'dark';
    cssVariables: Record<string, string>;
  };
}

// =============================================================================
// Export Type Guards
// =============================================================================

/**
 * Type guard to check if value is a valid lookup key entry
 */
export const isLookupKeyEntry = (value: any): value is LookupKeyEntry => {
  return (
    typeof value === 'object' &&
    value !== null &&
    typeof value.name === 'string' &&
    typeof value.value === 'string' &&
    typeof value.private === 'boolean'
  );
};

/**
 * Type guard to check if array contains valid lookup key entries
 */
export const isLookupKeyEntryArray = (value: any): value is LookupKeyEntry[] => {
  return Array.isArray(value) && value.every(isLookupKeyEntry);
};

// =============================================================================
// Default Values & Constants
// =============================================================================

/**
 * Default lookup key entry for new entries
 */
export const DEFAULT_LOOKUP_KEY_ENTRY: LookupKeyCreatePayload = {
  name: '',
  value: '',
  private: false,
} as const;

/**
 * Default styling configuration
 */
export const DEFAULT_LOOKUP_KEYS_STYLING: Required<LookupKeysStyling> = {
  variant: 'table',
  size: 'md',
  colorVariant: 'default',
  className: '',
  style: {},
  darkMode: false,
} as const;

/**
 * Default accessibility configuration
 */
export const DEFAULT_LOOKUP_KEYS_ACCESSIBILITY: Required<LookupKeysAccessibility> = {
  'aria-label': 'Lookup Keys Configuration',
  'aria-live': 'polite',
  'aria-atomic': false,
  role: 'region',
  tabIndex: -1,
} as const;

/**
 * Default labels for internationalization
 */
export const DEFAULT_LOOKUP_KEYS_LABELS = {
  addButton: 'Add Key',
  removeButton: 'Remove Key',
  nameLabel: 'Key Name',
  valueLabel: 'Key Value',
  privateLabel: 'Private',
  nameTooltip: 'Enter the lookup key name',
  valueTooltip: 'Enter the lookup key value',
  privateTooltip: 'Mark as private to exclude from public API responses',
  emptyStateMessage: 'No lookup keys configured. Click "Add Key" to create your first entry.',
  validationMessages: {
    required: 'This field is required',
    duplicate: 'Key name must be unique',
    invalid: 'Invalid key format',
  },
} as const;