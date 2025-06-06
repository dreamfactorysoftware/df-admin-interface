/**
 * HTTP Verb Picker Component Types
 * 
 * TypeScript type definitions for HTTP verb picker component including VerbPickerProps interface,
 * HTTP verb types, selection modes, and value transformation types. Provides comprehensive typing
 * for bitmask operations, form integration, and component configuration matching Angular df-verb-picker functionality.
 * 
 * @fileoverview Comprehensive typing for HTTP verb selection with React Hook Form integration
 * @version 1.0.0
 */

import { type ReactNode, type ComponentProps } from 'react';
import { type BaseComponent, type ComponentVariant, type ComponentSize } from '@/types/ui';
import { 
  type FormFieldProps, 
  type FormFieldConfig, 
  type EnhancedValidationState,
  type FieldValues,
  type Path,
  type PathValue
} from '@/types/forms';

// ============================================================================
// HTTP VERB TYPES
// ============================================================================

/**
 * Supported HTTP verb literal union type
 * Defines the complete set of HTTP methods supported by DreamFactory API generation
 */
export type HttpVerb = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

/**
 * HTTP verb configuration with numeric value mapping
 * Supports bitmask operations for multiple verb selection (from Angular migration)
 */
export interface VerbOption {
  /** Numeric bitmask value for the HTTP verb */
  value: number;
  /** HTTP verb string representation */
  altValue: HttpVerb;
  /** Display label for the verb option */
  label: string;
  /** Optional description for tooltips */
  description?: string;
  /** Verb color variant for UI consistency */
  colorVariant?: VerbColorVariant;
  /** Is this verb option disabled */
  disabled?: boolean;
  /** Accessibility label for screen readers */
  ariaLabel?: string;
}

/**
 * Color variants for HTTP verb styling
 * Provides consistent visual representation across light/dark themes
 */
export type VerbColorVariant = 
  | 'get'      // Typically blue/primary
  | 'post'     // Typically green/success  
  | 'put'      // Typically orange/warning
  | 'patch'    // Typically purple/secondary
  | 'delete';  // Typically red/error

// ============================================================================
// VERB PICKER MODES
// ============================================================================

/**
 * Verb picker selection modes
 * Supports different value formats for form integration and Angular migration compatibility
 */
export type VerbPickerMode = 
  | 'verb'           // Single verb selection (returns HttpVerb string)
  | 'verb_multiple'  // Multiple verb selection (returns HttpVerb[] array)
  | 'number';        // Bitmask selection (returns number for Angular compatibility)

/**
 * Value type mapping based on picker mode
 * Provides type safety for different selection modes
 */
export type VerbPickerValue<T extends VerbPickerMode> = 
  T extends 'verb' ? HttpVerb :
  T extends 'verb_multiple' ? HttpVerb[] :
  T extends 'number' ? number :
  never;

// ============================================================================
// VALUE TRANSFORMATION TYPES
// ============================================================================

/**
 * Bitmask value transformation utilities
 * Enables conversion between different value formats for Angular migration
 */
export interface VerbBitmaskUtils {
  /** Convert HttpVerb array to bitmask number */
  arrayToBitmask: (verbs: HttpVerb[]) => number;
  /** Convert bitmask number to HttpVerb array */
  bitmaskToArray: (bitmask: number) => HttpVerb[];
  /** Convert single HttpVerb to bitmask number */
  verbToBitmask: (verb: HttpVerb) => number;
  /** Convert bitmask number to single HttpVerb (first set bit) */
  bitmaskToVerb: (bitmask: number) => HttpVerb | null;
  /** Check if specific verb is set in bitmask */
  isVerbSet: (bitmask: number, verb: HttpVerb) => boolean;
  /** Toggle verb in bitmask */
  toggleVerb: (bitmask: number, verb: HttpVerb) => number;
}

/**
 * Value transformation configuration
 * Supports complex value handling from Angular migration
 */
export interface VerbValueTransform<T extends VerbPickerMode = VerbPickerMode> {
  /** Input value transformation */
  input?: (value: any) => VerbPickerValue<T>;
  /** Output value transformation */
  output?: (value: VerbPickerValue<T>) => any;
  /** Validation transformation */
  validate?: (value: any) => boolean;
  /** Default value provider */
  defaultValue?: () => VerbPickerValue<T>;
}

// ============================================================================
// CONFIGURATION SCHEMA
// ============================================================================

/**
 * Configuration schema for verb picker metadata
 * Provides tooltip descriptions and field metadata for dynamic forms
 */
export interface ConfigSchema {
  /** Field configuration metadata */
  field?: {
    /** Field type identifier */
    type: 'verb-picker';
    /** Field category for grouping */
    category?: string;
    /** Field priority for ordering */
    priority?: number;
    /** Field dependencies */
    dependencies?: string[];
  };
  /** Tooltip and help text configuration */
  tooltips?: {
    /** Main field tooltip */
    field?: string;
    /** Individual verb tooltips */
    verbs?: Partial<Record<HttpVerb, string>>;
    /** Mode-specific tooltips */
    modes?: Partial<Record<VerbPickerMode, string>>;
  };
  /** Validation configuration */
  validation?: {
    /** Required validation message */
    required?: string;
    /** Minimum selection for multiple mode */
    minSelection?: number;
    /** Maximum selection for multiple mode */
    maxSelection?: number;
    /** Custom validation messages */
    messages?: Record<string, string>;
  };
  /** Accessibility configuration */
  accessibility?: {
    /** ARIA label template */
    ariaLabelTemplate?: string;
    /** Description template */
    descriptionTemplate?: string;
    /** Error announcement template */
    errorTemplate?: string;
  };
}

// ============================================================================
// THEME AND STYLING
// ============================================================================

/**
 * Theme variant types for dark/light mode styling consistency
 * Ensures proper contrast ratios and WCAG 2.1 AA compliance
 */
export interface VerbPickerTheme {
  /** Light theme configuration */
  light: VerbPickerThemeConfig;
  /** Dark theme configuration */
  dark: VerbPickerThemeConfig;
  /** System theme preference */
  system?: 'light' | 'dark';
}

/**
 * Theme configuration for verb picker styling
 */
export interface VerbPickerThemeConfig {
  /** Background colors for each verb */
  verbColors: Record<VerbColorVariant, string>;
  /** Text colors for each verb */
  verbTextColors: Record<VerbColorVariant, string>;
  /** Border colors for each verb */
  verbBorderColors: Record<VerbColorVariant, string>;
  /** Hover state colors */
  hoverColors: Record<VerbColorVariant, string>;
  /** Active/selected state colors */
  activeColors: Record<VerbColorVariant, string>;
  /** Disabled state colors */
  disabledColors: Record<VerbColorVariant, string>;
  /** Focus ring configuration */
  focusRing: {
    color: string;
    width: string;
    style: string;
  };
}

// ============================================================================
// COMPONENT PROPS INTERFACE
// ============================================================================

/**
 * Main VerbPickerProps interface extending BaseComponent
 * Provides comprehensive configuration for HTTP verb selection with form integration
 */
export interface VerbPickerProps<
  TFieldValues extends FieldValues = FieldValues,
  TMode extends VerbPickerMode = VerbPickerMode
> extends BaseComponent {
  /** Selection mode determining value type */
  mode: TMode;
  /** Configuration schema for metadata and validation */
  schema?: ConfigSchema;
  /** Show/hide field label */
  showLabel?: boolean;
  /** Field label text */
  label?: string;
  /** Field description/help text */
  description?: string;
  /** Current selected value */
  value?: VerbPickerValue<TMode>;
  /** Default value when no selection */
  defaultValue?: VerbPickerValue<TMode>;
  /** Available verb options */
  options?: VerbOption[];
  /** Value change handler */
  onChange?: (value: VerbPickerValue<TMode>) => void;
  /** Blur event handler */
  onBlur?: () => void;
  /** Focus event handler */
  onFocus?: () => void;
  /** Error state */
  error?: string;
  /** Help text */
  helpText?: string;
  /** Required field indicator */
  required?: boolean;
  /** Disabled state */
  disabled?: boolean;
  /** Read-only state */
  readOnly?: boolean;
  /** Component size variant */
  size?: ComponentSize;
  /** Component visual variant */
  variant?: ComponentVariant;
  /** Layout orientation */
  orientation?: 'horizontal' | 'vertical';
  /** Allow multiple selection (for verb_multiple mode) */
  multiple?: boolean;
  /** Show verb descriptions as tooltips */
  showTooltips?: boolean;
  /** Custom theme configuration */
  theme?: Partial<VerbPickerTheme>;
  /** Value transformation utilities */
  transform?: VerbValueTransform<TMode>;
  /** Bitmask utilities for number mode */
  bitmaskUtils?: VerbBitmaskUtils;
  /** Custom CSS classes */
  className?: string;
  /** Custom container CSS classes */
  containerClassName?: string;
  /** Custom label CSS classes */
  labelClassName?: string;
  /** Test identifier */
  'data-testid'?: string;
  /** Custom render function for verb options */
  renderOption?: (option: VerbOption, selected: boolean) => ReactNode;
  /** Accessibility configuration */
  'aria-label'?: string;
  'aria-describedby'?: string;
  'aria-required'?: boolean;
  'aria-invalid'?: boolean;
}

// ============================================================================
// FORM INTEGRATION TYPES
// ============================================================================

/**
 * React Hook Form integration props for VerbPicker
 * Extends FormFieldProps with verb-specific configuration
 */
export interface VerbPickerFieldProps<
  TFieldValues extends FieldValues = FieldValues,
  TMode extends VerbPickerMode = VerbPickerMode
> extends FormFieldProps<TFieldValues>, 
  Omit<VerbPickerProps<TFieldValues, TMode>, 'value' | 'onChange' | 'onBlur' | 'error'> {
  /** Field name for form registration */
  name: Path<TFieldValues>;
  /** Form field configuration */
  config: VerbPickerFieldConfig<TFieldValues, TMode>;
}

/**
 * Form field configuration specific to verb picker
 */
export interface VerbPickerFieldConfig<
  TFieldValues extends FieldValues = FieldValues,
  TMode extends VerbPickerMode = VerbPickerMode
> extends FormFieldConfig<TFieldValues> {
  /** Verb picker specific configuration */
  verbPicker: {
    /** Selection mode */
    mode: TMode;
    /** Available verb options */
    options?: VerbOption[];
    /** Value transformation */
    transform?: VerbValueTransform<TMode>;
    /** Bitmask utilities */
    bitmaskUtils?: VerbBitmaskUtils;
    /** Theme configuration */
    theme?: Partial<VerbPickerTheme>;
  };
}

// ============================================================================
// VALIDATION TYPES
// ============================================================================

/**
 * Validation types for React Hook Form integration with error handling
 * Supports complex validation scenarios for HTTP verb selection
 */
export interface VerbPickerValidation<TMode extends VerbPickerMode = VerbPickerMode> {
  /** Required validation */
  required?: boolean | string;
  /** Minimum selection count (for multiple mode) */
  minSelection?: number | { value: number; message: string };
  /** Maximum selection count (for multiple mode) */
  maxSelection?: number | { value: number; message: string };
  /** Custom validation function */
  validate?: (value: VerbPickerValue<TMode>) => boolean | string;
  /** Async validation function */
  asyncValidate?: (value: VerbPickerValue<TMode>) => Promise<boolean | string>;
  /** Validation dependencies */
  dependencies?: string[];
  /** Validation timing */
  timing?: 'onChange' | 'onBlur' | 'onSubmit';
}

/**
 * Enhanced validation state for verb picker
 * Extends base validation state with verb-specific information
 */
export interface VerbPickerValidationState extends EnhancedValidationState {
  /** Currently selected verbs */
  selectedVerbs?: HttpVerb[];
  /** Selection count */
  selectionCount?: number;
  /** Bitmask value (for number mode) */
  bitmaskValue?: number;
  /** Validation errors by verb */
  verbErrors?: Partial<Record<HttpVerb, string>>;
}

// ============================================================================
// EVENT TYPES
// ============================================================================

/**
 * Event handler types for verb picker interactions
 */
export interface VerbPickerEventHandlers<TMode extends VerbPickerMode = VerbPickerMode> {
  /** Value change event */
  onChange?: (value: VerbPickerValue<TMode>, event?: Event) => void;
  /** Individual verb toggle event */
  onVerbToggle?: (verb: HttpVerb, selected: boolean, event?: Event) => void;
  /** Selection cleared event */
  onClear?: (event?: Event) => void;
  /** Focus events */
  onFocus?: (event?: FocusEvent) => void;
  onBlur?: (event?: FocusEvent) => void;
  /** Keyboard events */
  onKeyDown?: (event?: KeyboardEvent) => void;
  onKeyUp?: (event?: KeyboardEvent) => void;
  /** Mouse events */
  onClick?: (event?: MouseEvent) => void;
  onMouseEnter?: (event?: MouseEvent) => void;
  onMouseLeave?: (event?: MouseEvent) => void;
}

// ============================================================================
// UTILITY TYPES
// ============================================================================

/**
 * Utility type for extracting verb picker value type based on mode
 */
export type ExtractVerbValue<T> = T extends VerbPickerProps<any, infer M> 
  ? VerbPickerValue<M> 
  : never;

/**
 * Utility type for verb picker ref interface
 */
export interface VerbPickerRef<TMode extends VerbPickerMode = VerbPickerMode> {
  /** Focus the component */
  focus: () => void;
  /** Blur the component */
  blur: () => void;
  /** Get current value */
  getValue: () => VerbPickerValue<TMode>;
  /** Set value programmatically */
  setValue: (value: VerbPickerValue<TMode>) => void;
  /** Clear selection */
  clear: () => void;
  /** Validate current value */
  validate: () => Promise<boolean>;
  /** Get validation state */
  getValidationState: () => VerbPickerValidationState;
}

/**
 * Default verb options configuration
 * Standard HTTP verbs with common bitmask values
 */
export const DEFAULT_VERB_OPTIONS: VerbOption[] = [
  {
    value: 1,      // 2^0
    altValue: 'GET',
    label: 'GET',
    description: 'Retrieve data from the server',
    colorVariant: 'get'
  },
  {
    value: 2,      // 2^1
    altValue: 'POST',
    label: 'POST',
    description: 'Create new data on the server',
    colorVariant: 'post'
  },
  {
    value: 4,      // 2^2
    altValue: 'PUT',
    label: 'PUT',
    description: 'Update or replace data on the server',
    colorVariant: 'put'
  },
  {
    value: 8,      // 2^3
    altValue: 'PATCH',
    label: 'PATCH',
    description: 'Partially update data on the server',
    colorVariant: 'patch'
  },
  {
    value: 16,     // 2^4
    altValue: 'DELETE',
    label: 'DELETE',
    description: 'Remove data from the server',
    colorVariant: 'delete'
  }
] as const;

/**
 * Type guard for checking verb picker mode
 */
export function isVerbPickerMode(value: string): value is VerbPickerMode {
  return ['verb', 'verb_multiple', 'number'].includes(value);
}

/**
 * Type guard for checking HTTP verb
 */
export function isHttpVerb(value: string): value is HttpVerb {
  return ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'].includes(value);
}

// ============================================================================
// EXPORT TYPES
// ============================================================================

export type {
  // Re-export React types for convenience
  ReactNode,
  ComponentProps
} from 'react';

// Export all verb picker types
export type * from './types';