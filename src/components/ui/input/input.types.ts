/**
 * Input Component Type Definitions
 * 
 * Comprehensive TypeScript interfaces for React 19 input components with
 * React Hook Form integration, Zod validation support, and WCAG 2.1 AA
 * accessibility compliance.
 * 
 * @fileoverview Input component type definitions for accessible, responsive React components
 * @version 1.0.0
 */

import { type ReactNode, type InputHTMLAttributes, type TextareaHTMLAttributes, type RefObject } from 'react';
import { type FieldPath, type FieldValues, type UseFormReturn, type RegisterOptions, type FieldError } from 'react-hook-form';
import { type ZodSchema, type ZodType } from 'zod';
import { 
  type AccessibilityProps, 
  type SizeVariant, 
  type ColorVariant, 
  type StateVariant,
  type BaseComponentProps,
  type FormComponentProps,
  type ControlledProps,
  type ThemeProps,
  type FocusProps,
  type ValidationState,
  type ResponsiveProps
} from '@/types/ui';

/**
 * Input component variant types supporting different visual styles
 * Each variant maintains WCAG 2.1 AA contrast compliance
 */
export type InputVariant = 
  | 'outline'    // Default outlined input with border
  | 'filled'     // Filled background input
  | 'ghost'      // Minimal styling with subtle background
  | 'underlined' // Bottom border only
  | 'floating';  // Floating label design

/**
 * Input component size variants with responsive support
 * All sizes maintain minimum 44px touch target for accessibility
 */
export type InputSize = 'sm' | 'md' | 'lg' | 'xl';

/**
 * Input component state variants for visual feedback
 */
export type InputState = 
  | 'default'
  | 'focused'
  | 'error'
  | 'success'
  | 'warning'
  | 'disabled'
  | 'readonly'
  | 'loading';

/**
 * Supported HTML input types with validation considerations
 */
export type InputType = 
  | 'text'
  | 'password'
  | 'email'
  | 'url'
  | 'tel'
  | 'search'
  | 'number'
  | 'date'
  | 'datetime-local'
  | 'time'
  | 'month'
  | 'week'
  | 'color'
  | 'file'
  | 'hidden';

/**
 * Label positioning options for form layout flexibility
 */
export type LabelPosition = 'top' | 'left' | 'right' | 'inside' | 'floating' | 'none';

/**
 * Input validation severity levels
 */
export type ValidationSeverity = 'error' | 'warning' | 'info' | 'success';

/**
 * Core input component props interface
 * Extends base HTML input attributes with enhanced type safety
 */
export interface BaseInputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'size' | 'prefix'> {
  /** Input variant for visual styling */
  variant?: InputVariant;
  /** Input size for responsive design */
  size?: InputSize;
  /** Current input state for visual feedback */
  state?: InputState;
  /** Label text content */
  label?: string;
  /** Label positioning relative to input */
  labelPosition?: LabelPosition;
  /** Helper text below input */
  helperText?: string;
  /** Validation error message */
  error?: string;
  /** Success message */
  successMessage?: string;
  /** Warning message */
  warningMessage?: string;
  /** Additional context or instructions */
  description?: string;
  /** Show label visually (false makes it screen-reader only) */
  showLabel?: boolean;
  
  // Enhanced accessibility props
  /** Screen reader label override */
  'aria-label'?: string;
  /** ID of element describing the input */
  'aria-describedby'?: string;
  /** ID of element labeling the input */
  'aria-labelledby'?: string;
  /** Invalid state for screen readers */
  'aria-invalid'?: boolean | 'grammar' | 'spelling';
  /** Input validation requirements description */
  'aria-required'?: boolean;
  /** Error message announcement for screen readers */
  'aria-errormessage'?: string;
  
  // Visual enhancements
  /** Icon or content before input */
  prefix?: ReactNode;
  /** Icon or content after input */
  suffix?: ReactNode;
  /** Show clear button when input has value */
  clearable?: boolean;
  /** Show password visibility toggle (password inputs) */
  showPasswordToggle?: boolean;
  /** Loading spinner inside input */
  loading?: boolean;
  /** Character count display */
  showCharacterCount?: boolean;
  /** Custom placeholder text */
  placeholder?: string;
}

/**
 * React Hook Form integration props
 * Provides seamless integration with form validation
 */
export interface ReactHookFormProps<
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>
> {
  /** Form instance from useForm hook */
  form?: UseFormReturn<TFieldValues>;
  /** Field name for form registration */
  name?: TName;
  /** Validation rules for React Hook Form */
  rules?: RegisterOptions<TFieldValues, TName>;
  /** Transform value on change */
  transform?: {
    input?: (value: any) => any;
    output?: (value: any) => any;
  };
  /** Manual field error override */
  fieldError?: FieldError;
  /** Validation mode override */
  mode?: 'onChange' | 'onBlur' | 'onSubmit' | 'onTouched' | 'all';
}

/**
 * Zod schema validation integration
 */
export interface ZodValidationProps {
  /** Zod schema for input validation */
  schema?: ZodSchema;
  /** Custom validation function using Zod */
  zodValidate?: (value: any) => { success: boolean; error?: string };
  /** Validation trigger timing */
  validateOn?: 'change' | 'blur' | 'submit';
  /** Show validation errors immediately */
  showValidationErrors?: boolean;
}

/**
 * Advanced input formatting and masking options
 */
export interface InputFormattingProps {
  /** Input mask pattern (e.g., phone numbers, dates) */
  mask?: string | ((value: string) => string);
  /** Character used for mask placeholders */
  maskChar?: string;
  /** Allow incomplete mask input */
  alwaysShowMask?: boolean;
  /** Format value for display */
  format?: (value: string) => string;
  /** Parse formatted value back to raw value */
  parse?: (value: string) => string;
  /** Text transformation */
  transform?: 'uppercase' | 'lowercase' | 'capitalize' | 'none';
  /** Remove formatting characters on blur */
  cleanOnBlur?: boolean;
}

/**
 * Input styling and theming configuration
 */
export interface InputStylingProps {
  /** Container CSS classes */
  containerClassName?: string;
  /** Label CSS classes */
  labelClassName?: string;
  /** Input element CSS classes */
  inputClassName?: string;
  /** Helper text CSS classes */
  helperClassName?: string;
  /** Error message CSS classes */
  errorClassName?: string;
  /** Success message CSS classes */
  successClassName?: string;
  /** Prefix/suffix container CSS classes */
  affixClassName?: string;
  /** Custom CSS variables for theming */
  cssVariables?: Record<string, string>;
  /** Border radius override */
  borderRadius?: 'none' | 'sm' | 'md' | 'lg' | 'xl' | 'full';
  /** Shadow depth */
  shadow?: 'none' | 'sm' | 'md' | 'lg' | 'xl';
}

/**
 * Responsive input configuration
 */
export interface InputResponsiveProps extends ResponsiveProps {
  /** Size per breakpoint */
  responsiveSize?: {
    xs?: InputSize;
    sm?: InputSize;
    md?: InputSize;
    lg?: InputSize;
    xl?: InputSize;
  };
  /** Label position per breakpoint */
  responsiveLabelPosition?: {
    xs?: LabelPosition;
    sm?: LabelPosition;
    md?: LabelPosition;
    lg?: LabelPosition;
    xl?: LabelPosition;
  };
  /** Stacking behavior on small screens */
  stackOnMobile?: boolean;
}

/**
 * Input event handlers with enhanced type safety
 */
export interface InputEventProps {
  /** Value change handler */
  onValueChange?: (value: string, event?: React.ChangeEvent<HTMLInputElement>) => void;
  /** Focus event with enhanced context */
  onFocusChange?: (focused: boolean, event?: React.FocusEvent<HTMLInputElement>) => void;
  /** Validation state change */
  onValidationChange?: (validation: ValidationState) => void;
  /** Clear button click */
  onClear?: () => void;
  /** Prefix/suffix click handlers */
  onPrefixClick?: () => void;
  onSuffixClick?: () => void;
  /** Enter key press in input */
  onEnterPress?: (value: string) => void;
  /** Escape key press */
  onEscapePress?: () => void;
}

/**
 * Complete input component props interface
 * Combines all input-related interfaces for comprehensive type safety
 */
export interface InputProps extends 
  BaseInputProps,
  ReactHookFormProps,
  ZodValidationProps,
  InputFormattingProps,
  InputStylingProps,
  InputResponsiveProps,
  InputEventProps,
  AccessibilityProps,
  ThemeProps,
  FocusProps {
  
  /** Component reference for imperative operations */
  ref?: RefObject<HTMLInputElement>;
  /** Test ID for automated testing */
  'data-testid'?: string;
  /** Custom input component render function */
  renderInput?: (props: InputHTMLAttributes<HTMLInputElement>) => ReactNode;
  /** Custom label render function */
  renderLabel?: (label: string, required?: boolean) => ReactNode;
  /** Custom error render function */
  renderError?: (error: string) => ReactNode;
  /** Custom helper text render function */
  renderHelper?: (helper: string) => ReactNode;
}

/**
 * Textarea-specific props extending input functionality
 */
export interface TextareaProps extends 
  Omit<TextareaHTMLAttributes<HTMLTextAreaElement>, 'size'>,
  Omit<InputProps, 'type' | 'prefix' | 'suffix' | 'showPasswordToggle'> {
  
  /** Auto-resize behavior */
  autoResize?: boolean;
  /** Minimum number of visible rows */
  minRows?: number;
  /** Maximum number of visible rows */
  maxRows?: number;
  /** Resize handle visibility */
  resize?: 'none' | 'vertical' | 'horizontal' | 'both';
  /** Textarea reference */
  ref?: RefObject<HTMLTextAreaElement>;
}

/**
 * Input group configuration for related inputs
 */
export interface InputGroupProps {
  /** Group orientation */
  orientation?: 'horizontal' | 'vertical';
  /** Spacing between inputs */
  spacing?: 'compact' | 'normal' | 'relaxed';
  /** Group validation state */
  groupValidation?: ValidationState;
  /** Shared prefix for all inputs */
  groupPrefix?: ReactNode;
  /** Shared suffix for all inputs */
  groupSuffix?: ReactNode;
  /** Group label */
  groupLabel?: string;
  /** Group description */
  groupDescription?: string;
  /** Group error message */
  groupError?: string;
  /** Children inputs */
  children: ReactNode;
}

/**
 * Input field state management interface
 */
export interface InputFieldState {
  /** Current input value */
  value: string;
  /** Input has been modified */
  isDirty: boolean;
  /** Input has been focused */
  isTouched: boolean;
  /** Input is currently focused */
  isFocused: boolean;
  /** Input is valid */
  isValid: boolean;
  /** Input is currently validating */
  isValidating: boolean;
  /** Validation error message */
  error?: string;
  /** Success message */
  success?: string;
  /** Warning message */
  warning?: string;
}

/**
 * Input context for form field management
 */
export interface InputContextValue {
  /** Form-wide validation state */
  formValidation?: ValidationState;
  /** Default input variant */
  defaultVariant?: InputVariant;
  /** Default input size */
  defaultSize?: InputSize;
  /** Theme configuration */
  theme?: {
    colors?: Record<string, string>;
    spacing?: Record<string, string>;
    borderRadius?: Record<string, string>;
  };
  /** Accessibility preferences */
  accessibility?: {
    announceErrors?: boolean;
    highlightRequired?: boolean;
    useHighContrast?: boolean;
    reducedMotion?: boolean;
  };
  /** Form submission state */
  isSubmitting?: boolean;
  /** Form disabled state */
  isDisabled?: boolean;
}

/**
 * Input validation configuration
 */
export interface InputValidationConfig {
  /** Validation rules */
  rules: {
    required?: boolean | string;
    minLength?: number | { value: number; message: string };
    maxLength?: number | { value: number; message: string };
    pattern?: RegExp | { value: RegExp; message: string };
    min?: number | { value: number; message: string };
    max?: number | { value: number; message: string };
    validate?: Record<string, (value: any) => boolean | string>;
  };
  /** Custom validation messages */
  messages?: {
    required?: string;
    invalid?: string;
    tooShort?: string;
    tooLong?: string;
    patternMismatch?: string;
    rangeUnderflow?: string;
    rangeOverflow?: string;
  };
  /** Validation timing */
  timing?: {
    debounce?: number;
    validateOnMount?: boolean;
    validateOnChange?: boolean;
    validateOnBlur?: boolean;
  };
}

/**
 * Input component size configuration with responsive values
 */
export interface InputSizeConfig {
  /** Height values for each size */
  height: Record<InputSize, string>;
  /** Padding values for each size */
  padding: Record<InputSize, { x: string; y: string }>;
  /** Font size for each size */
  fontSize: Record<InputSize, string>;
  /** Border radius for each size */
  borderRadius: Record<InputSize, string>;
  /** Icon size for each size */
  iconSize: Record<InputSize, string>;
}

/**
 * Input variant styling configuration
 */
export interface InputVariantConfig {
  /** Base styles for each variant */
  base: Record<InputVariant, string>;
  /** State-specific styles */
  states: Record<InputState, Record<InputVariant, string>>;
  /** Focus styles */
  focus: Record<InputVariant, string>;
  /** Hover styles */
  hover: Record<InputVariant, string>;
}

/**
 * Complete input component configuration
 */
export interface InputConfig {
  /** Size configuration */
  sizes: InputSizeConfig;
  /** Variant styling */
  variants: InputVariantConfig;
  /** Default props */
  defaults: {
    variant: InputVariant;
    size: InputSize;
    labelPosition: LabelPosition;
  };
  /** Animation configuration */
  animations: {
    transition: string;
    focusTransition: string;
    labelTransition: string;
  };
}

/**
 * Export utility types for component development
 */
export type InputPropsWithoutChildren = Omit<InputProps, 'children'>;
export type InputElementProps = InputHTMLAttributes<HTMLInputElement>;
export type TextareaElementProps = TextareaHTMLAttributes<HTMLTextAreaElement>;

/**
 * Re-export relevant types from dependencies for convenience
 */
export type {
  FieldPath,
  FieldValues,
  UseFormReturn,
  RegisterOptions,
  FieldError
} from 'react-hook-form';

export type {
  ZodSchema,
  ZodType
} from 'zod';

/**
 * Input component forward ref type for TypeScript
 */
export type InputRef = HTMLInputElement;
export type TextareaRef = HTMLTextAreaElement;

/**
 * Input component factory types for dynamic creation
 */
export interface InputFactory {
  /** Create input with predefined configuration */
  createInput: (config: Partial<InputConfig>) => React.ComponentType<InputProps>;
  /** Create textarea with predefined configuration */
  createTextarea: (config: Partial<InputConfig>) => React.ComponentType<TextareaProps>;
  /** Create input group with predefined configuration */
  createInputGroup: (config: Partial<InputGroupProps>) => React.ComponentType<InputGroupProps>;
}