/**
 * TypeScript type definitions for HTTP verb picker component
 * Provides comprehensive typing for bitmask operations, form integration, and component configuration
 * matching Angular df-verb-picker functionality with React 19 and TypeScript 5.8+ compatibility
 */

import { ReactNode } from 'react';
import { FieldPath, FieldValues, UseControllerProps } from 'react-hook-form';

// ============================================================================
// HTTP Verb and Value Types
// ============================================================================

/**
 * HTTP methods supported by the verb picker component
 * Literal union type ensuring type safety for verb operations
 */
export type HttpVerb = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

/**
 * Bitmask values for HTTP verbs (used in numeric mode)
 * Maps each HTTP verb to its corresponding bitmask value
 */
export const VERB_BITMASKS = {
  GET: 1,     // 0001
  POST: 2,    // 0010
  PUT: 4,     // 0100
  PATCH: 8,   // 1000
  DELETE: 16, // 10000
} as const;

/**
 * Individual verb option configuration
 * Matches Angular df-verb-picker verb structure
 */
export interface VerbOption {
  /** Numeric bitmask value for the verb */
  value: number;
  /** HTTP verb string representation */
  altValue: HttpVerb;
  /** Display label for the verb (internationalized) */
  label: string;
}

// ============================================================================
// Component Configuration Types
// ============================================================================

/**
 * Selection modes for the verb picker component
 * Determines how values are handled and displayed
 */
export type VerbPickerMode = 'verb' | 'verb_multiple' | 'number';

/**
 * Theme variant types for consistent styling
 * Supports Tailwind CSS dark mode integration
 */
export type ThemeVariant = 'light' | 'dark' | 'system';

/**
 * Size variants for component scaling
 */
export type SizeVariant = 'sm' | 'md' | 'lg';

/**
 * Configuration schema interface for field metadata
 * Extends Angular ConfigSchema for React compatibility
 */
export interface ConfigSchema {
  /** Field name identifier */
  name: string;
  /** Display label for the field */
  label: string;
  /** Field type (verb_mask for verb picker) */
  type: string;
  /** Optional description for tooltips */
  description?: string;
  /** Field alias for API mapping */
  alias: string;
  /** Whether the field is required */
  required?: boolean;
  /** Default value for the field */
  default?: any;
  /** Validation rules */
  validation?: any;
  /** Additional field metadata */
  [key: string]: any;
}

// ============================================================================
// Value Transformation Types
// ============================================================================

/**
 * Value types supported by the verb picker based on mode
 */
export type VerbPickerValue<T extends VerbPickerMode = VerbPickerMode> = 
  T extends 'verb' 
    ? HttpVerb 
    : T extends 'verb_multiple' 
    ? HttpVerb[] 
    : T extends 'number' 
    ? number 
    : never;

/**
 * Generic value type for all modes (used internally)
 */
export type VerbPickerAnyValue = HttpVerb | HttpVerb[] | number;

/**
 * Value transformation utilities type
 */
export interface VerbTransformOptions {
  /** Source mode for transformation */
  fromMode: VerbPickerMode;
  /** Target mode for transformation */
  toMode: VerbPickerMode;
  /** Input value to transform */
  value: VerbPickerAnyValue;
}

// ============================================================================
// Base Component Types
// ============================================================================

/**
 * Base component props interface
 * Provides consistent foundation for all UI components
 */
export interface BaseComponent {
  /** CSS class names for styling */
  className?: string;
  /** Unique identifier for the component */
  id?: string;
  /** Test identifier for testing frameworks */
  'data-testid'?: string;
  /** Children elements */
  children?: ReactNode;
  /** Whether the component is disabled */
  disabled?: boolean;
  /** ARIA label for accessibility */
  'aria-label'?: string;
  /** ARIA described by for accessibility */
  'aria-describedby'?: string;
}

/**
 * Form control component base props
 * Extends BaseComponent with form-specific properties
 */
export interface FormControlComponent extends BaseComponent {
  /** Field name for form integration */
  name?: string;
  /** Whether the field is required */
  required?: boolean;
  /** Error message for validation */
  error?: string;
  /** Helper text for the field */
  helperText?: string;
  /** Whether to show the field label */
  showLabel?: boolean;
}

// ============================================================================
// Component Props Interface
// ============================================================================

/**
 * Props interface for the VerbPicker component
 * Comprehensive type definition supporting all modes and React Hook Form integration
 */
export interface VerbPickerProps<
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>
> extends FormControlComponent {
  /** Selection mode determining value type and behavior */
  mode?: VerbPickerMode;
  
  /** Configuration schema for field metadata and tooltips */
  schema?: Partial<ConfigSchema>;
  
  /** Size variant for component scaling */
  size?: SizeVariant;
  
  /** Theme variant for styling */
  theme?: ThemeVariant;
  
  /** Custom verb options (overrides default HTTP verbs) */
  verbOptions?: VerbOption[];
  
  /** Default selected value(s) */
  defaultValue?: VerbPickerAnyValue;
  
  /** Current value (controlled component) */
  value?: VerbPickerAnyValue;
  
  /** Value change handler */
  onChange?: (value: VerbPickerAnyValue) => void;
  
  /** Focus event handler */
  onFocus?: () => void;
  
  /** Blur event handler */
  onBlur?: () => void;
  
  /** Whether to allow no selection (null value) */
  allowEmpty?: boolean;
  
  /** Maximum number of selections (for multiple mode) */
  maxSelections?: number;
  
  /** Minimum number of selections (for multiple mode) */
  minSelections?: number;
  
  /** Custom placeholder text */
  placeholder?: string;
  
  /** React Hook Form controller props */
  control?: UseControllerProps<TFieldValues, TName>['control'];
  
  /** Field name for React Hook Form */
  name?: TName;
  
  /** Validation rules for React Hook Form */
  rules?: UseControllerProps<TFieldValues, TName>['rules'];
  
  /** Whether to show tooltip for schema description */
  showTooltip?: boolean;
  
  /** Custom tooltip content */
  tooltipContent?: ReactNode;
  
  /** Additional ARIA attributes */
  'aria-expanded'?: boolean;
  'aria-haspopup'?: boolean;
  'aria-invalid'?: boolean;
}

// ============================================================================
// Hook and Utility Types
// ============================================================================

/**
 * Return type for useVerbPicker hook
 */
export interface UseVerbPickerReturn {
  /** Current selected value(s) */
  value: VerbPickerAnyValue;
  /** Set value function */
  setValue: (value: VerbPickerAnyValue) => void;
  /** Selected verb options */
  selectedOptions: VerbOption[];
  /** Whether any options are selected */
  hasSelection: boolean;
  /** Clear all selections */
  clear: () => void;
  /** Select all available options (multiple mode only) */
  selectAll: () => void;
  /** Toggle specific verb selection */
  toggle: (verb: HttpVerb) => void;
  /** Whether specific verb is selected */
  isSelected: (verb: HttpVerb) => boolean;
}

/**
 * Return type for useVerbTransform hook
 */
export interface UseVerbTransformReturn {
  /** Transform value between modes */
  transform: (options: VerbTransformOptions) => VerbPickerAnyValue;
  /** Convert bitmask to verb array */
  bitmaskToVerbs: (bitmask: number) => HttpVerb[];
  /** Convert verb array to bitmask */
  verbsToBitmask: (verbs: HttpVerb[]) => number;
  /** Convert single verb to bitmask */
  verbToBitmask: (verb: HttpVerb) => number;
  /** Get verb from bitmask value */
  bitmaskToVerb: (bitmask: number) => HttpVerb | null;
}

/**
 * Validation result interface for verb picker
 */
export interface VerbValidationResult {
  /** Whether validation passed */
  isValid: boolean;
  /** Error message if validation failed */
  error?: string;
  /** Field name that failed validation */
  field?: string;
}

/**
 * Validation function type for verb picker
 */
export type VerbValidator = (
  value: VerbPickerAnyValue,
  mode: VerbPickerMode,
  options?: {
    required?: boolean;
    maxSelections?: number;
    minSelections?: number;
    allowedVerbs?: HttpVerb[];
  }
) => VerbValidationResult;

// ============================================================================
// Event and Handler Types
// ============================================================================

/**
 * Custom event types for verb picker interactions
 */
export interface VerbPickerEvents {
  /** Fired when selection changes */
  onSelectionChange: (value: VerbPickerAnyValue, selectedVerbs: HttpVerb[]) => void;
  /** Fired when picker opens */
  onOpen: () => void;
  /** Fired when picker closes */
  onClose: () => void;
  /** Fired when validation state changes */
  onValidationChange: (result: VerbValidationResult) => void;
}

/**
 * Keyboard event handler configuration
 */
export interface VerbPickerKeyboardHandlers {
  /** Handle Enter key press */
  onEnter: (event: KeyboardEvent) => void;
  /** Handle Escape key press */
  onEscape: (event: KeyboardEvent) => void;
  /** Handle Arrow key navigation */
  onArrowKey: (event: KeyboardEvent, direction: 'up' | 'down') => void;
  /** Handle Space key press */
  onSpace: (event: KeyboardEvent) => void;
}

// ============================================================================
// Testing and Development Types
// ============================================================================

/**
 * Props for testing the VerbPicker component
 */
export interface VerbPickerTestProps extends Partial<VerbPickerProps> {
  /** Mock onChange handler for testing */
  mockOnChange?: jest.Mock;
  /** Mock validation function for testing */
  mockValidator?: jest.Mock;
  /** Test scenario identifier */
  testScenario?: string;
  /** Whether to render with error state */
  hasError?: boolean;
}

/**
 * Mock data interface for testing
 */
export interface VerbPickerMockData {
  /** Mock verb options */
  verbOptions: VerbOption[];
  /** Mock schema configuration */
  schema: ConfigSchema;
  /** Mock form values */
  formValues: Record<string, VerbPickerAnyValue>;
  /** Mock validation results */
  validationResults: VerbValidationResult[];
}

// ============================================================================
// Export Type Utilities
// ============================================================================

/**
 * Extract the value type for a specific mode
 */
export type ExtractValueType<T extends VerbPickerMode> = VerbPickerValue<T>;

/**
 * Union of all possible verb picker prop variations
 */
export type VerbPickerPropsVariant = 
  | VerbPickerProps<any, any>
  | Omit<VerbPickerProps<any, any>, 'mode'>
  | Required<Pick<VerbPickerProps<any, any>, 'mode' | 'schema'>>;

/**
 * Conditional props based on mode
 */
export type ConditionalVerbPickerProps<T extends VerbPickerMode> = 
  VerbPickerProps & {
    mode: T;
    value?: VerbPickerValue<T>;
    onChange?: (value: VerbPickerValue<T>) => void;
  };

// Re-export commonly used types for convenience
export type {
  FieldPath,
  FieldValues,
  UseControllerProps,
} from 'react-hook-form';