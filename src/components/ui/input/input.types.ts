/**
 * TypeScript type definitions for the Input component system
 * Provides interfaces for React Hook Form integration, validation, and accessibility compliance
 * 
 * @file src/components/ui/input/input.types.ts
 * @since 1.0.0
 */

import { InputHTMLAttributes, ReactNode } from 'react';
import { FieldPath, FieldValues, UseControllerProps } from 'react-hook-form';

/**
 * Base input variant types following design system from Section 7.7.1
 */
export type InputVariant = 'outline' | 'filled' | 'ghost';

/**
 * Input size variants with WCAG 2.1 AA minimum touch targets
 */
export type InputSize = 'sm' | 'md' | 'lg';

/**
 * Input state types for styling and accessibility
 */
export type InputState = 'default' | 'error' | 'success' | 'warning';

/**
 * Extended input props with React Hook Form integration and accessibility features
 */
export interface BaseInputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'size'> {
  /**
   * Input variant following design system
   * @default 'outline'
   */
  variant?: InputVariant;
  
  /**
   * Input size with minimum touch target compliance
   * @default 'md'
   */
  size?: InputSize;
  
  /**
   * Current input state for styling and ARIA attributes
   * @default 'default'
   */
  state?: InputState;
  
  /**
   * Error message for validation display
   */
  error?: string;
  
  /**
   * Help text displayed below the input
   */
  helpText?: string;
  
  /**
   * Element to display before the input (icon, text, etc.)
   */
  prefix?: ReactNode;
  
  /**
   * Element to display after the input (icon, button, etc.)
   */
  suffix?: ReactNode;
  
  /**
   * Whether the input is in a loading state
   */
  loading?: boolean;
  
  /**
   * Custom class name for additional styling
   */
  className?: string;
  
  /**
   * Custom class name for the container wrapper
   */
  containerClassName?: string;
  
  /**
   * Enhanced accessibility label for screen readers
   */
  'aria-label'?: string;
  
  /**
   * ID of element that describes this input
   */
  'aria-describedby'?: string;
  
  /**
   * Whether input is required (adds ARIA and visual indicators)
   */
  required?: boolean;
  
  /**
   * Custom validation message for screen readers
   */
  'aria-invalid'?: boolean;
  
  /**
   * Additional ARIA attributes for accessibility
   */
  'aria-errormessage'?: string;
}

/**
 * Props for React Hook Form controlled input
 */
export interface ControlledInputProps<
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>
> extends BaseInputProps {
  /**
   * React Hook Form controller props
   */
  control?: UseControllerProps<TFieldValues, TName>['control'];
  
  /**
   * Field name for React Hook Form
   */
  name: TName;
  
  /**
   * Default value for the field
   */
  defaultValue?: UseControllerProps<TFieldValues, TName>['defaultValue'];
  
  /**
   * Validation rules for React Hook Form
   */
  rules?: UseControllerProps<TFieldValues, TName>['rules'];
  
  /**
   * Whether to disable form state subscription for performance
   */
  shouldUnregister?: UseControllerProps<TFieldValues, TName>['shouldUnregister'];
}

/**
 * Input container props for consistent layout and spacing
 */
export interface InputContainerProps {
  /**
   * Container size following input size
   */
  size?: InputSize;
  
  /**
   * Container variant for styling
   */
  variant?: InputVariant;
  
  /**
   * Current state for container styling
   */
  state?: InputState;
  
  /**
   * Whether container has prefix element
   */
  hasPrefix?: boolean;
  
  /**
   * Whether container has suffix element
   */
  hasSuffix?: boolean;
  
  /**
   * Whether input is disabled
   */
  disabled?: boolean;
  
  /**
   * Whether input is readonly
   */
  readonly?: boolean;
  
  /**
   * Whether input is focused (for styling)
   */
  focused?: boolean;
  
  /**
   * Custom class name
   */
  className?: string;
  
  /**
   * Children components (prefix, input, suffix)
   */
  children: ReactNode;
  
  /**
   * Click handler for container (focus management)
   */
  onClick?: () => void;
}

/**
 * Input prefix/suffix element props
 */
export interface InputAdornmentProps {
  /**
   * Element content (icon, text, button)
   */
  children: ReactNode;
  
  /**
   * Position of the adornment
   */
  position: 'prefix' | 'suffix';
  
  /**
   * Input size for consistent sizing
   */
  size?: InputSize;
  
  /**
   * Whether adornment is clickable
   */
  clickable?: boolean;
  
  /**
   * Click handler for interactive adornments
   */
  onClick?: () => void;
  
  /**
   * Custom class name
   */
  className?: string;
  
  /**
   * ARIA label for interactive adornments
   */
  'aria-label'?: string;
}

/**
 * Focus ring configuration for accessibility compliance
 */
export interface InputFocusRing {
  /**
   * Focus ring width in pixels
   */
  width: string;
  
  /**
   * Focus ring color (must meet 3:1 contrast ratio)
   */
  color: string;
  
  /**
   * Focus ring offset for visibility
   */
  offset: string;
  
  /**
   * Focus ring border radius
   */
  borderRadius?: string;
}

/**
 * Validation state configuration
 */
export interface InputValidationState {
  /**
   * Whether input is valid
   */
  isValid: boolean;
  
  /**
   * Validation error message
   */
  errorMessage?: string;
  
  /**
   * Success message for positive feedback
   */
  successMessage?: string;
  
  /**
   * Warning message for important notices
   */
  warningMessage?: string;
  
  /**
   * Field name for error tracking
   */
  fieldName?: string;
}

/**
 * Theme-aware styling configuration
 */
export interface InputThemeConfig {
  /**
   * Light theme colors
   */
  light: {
    background: string;
    border: string;
    text: string;
    placeholder: string;
    focusRing: InputFocusRing;
  };
  
  /**
   * Dark theme colors
   */
  dark: {
    background: string;
    border: string;
    text: string;
    placeholder: string;
    focusRing: InputFocusRing;
  };
}

/**
 * Export utility type for input refs
 */
export type InputRef = HTMLInputElement;

/**
 * Export utility type for common input events
 */
export type InputChangeEvent = React.ChangeEvent<HTMLInputElement>;
export type InputFocusEvent = React.FocusEvent<HTMLInputElement>;
export type InputKeyboardEvent = React.KeyboardEvent<HTMLInputElement>;