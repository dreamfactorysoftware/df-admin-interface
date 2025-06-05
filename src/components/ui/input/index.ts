/**
 * Input Component System - Barrel Export
 * 
 * Centralized export structure for comprehensive React 19 input component library
 * with React Hook Form integration, accessibility compliance, and TypeScript 5.8+ support.
 * 
 * This barrel export file provides clean imports for all input-related components and utilities,
 * supporting Next.js 15.1 app router patterns with optimal tree-shaking and performance.
 * 
 * @fileoverview Input component barrel exports for DreamFactory Admin Interface
 * @version 1.0.0
 * @since React 19.0.0 + Next.js 15.1
 */

// =============================================================================
// CORE INPUT COMPONENTS
// =============================================================================

/**
 * Base Input Component Exports
 * Primary input component with comprehensive accessibility and validation support
 */
export {
  Input,
  ControlledInput,
  InputContainer,
  InputAdornment,
  type InputRef,
  type InputChangeEvent,
  type InputFocusEvent,
  type InputKeyboardEvent,
} from './input';

/**
 * Specialized Search Input
 * Enhanced search component with debounced input, autocomplete, and keyboard shortcuts
 */
export {
  SearchInput,
  type SearchSuggestion,
  type RecentSearch,
  type SearchInputProps,
  type SearchInputRef,
} from './search-input';

/**
 * Textarea Component
 * Multi-line text input with auto-resize functionality and character counting
 */
export {
  Textarea,
  type TextareaProps,
} from './textarea';

/**
 * Number Input Component
 * Specialized numeric input with formatting, validation, and increment controls
 */
export {
  NumberInput,
  type NumberInputProps,
} from './number-input';

/**
 * Password Input Component
 * Secure password input with strength meter, validation rules, and visibility toggle
 */
export {
  PasswordInput,
  type PasswordInputProps,
  type PasswordStrength,
  type PasswordRule,
} from './password-input';

/**
 * Email Input Component
 * Email-specific input with validation, typo correction, and domain suggestions
 */
export {
  EmailInput,
  type EmailInputProps,
} from './email-input';

// =============================================================================
// COMPREHENSIVE TYPE DEFINITIONS
// =============================================================================

/**
 * Core Input Types
 * Fundamental type definitions for input component development
 */
export type {
  // Component variant and sizing types
  InputVariant,
  InputSize,
  InputState,
  InputType,
  LabelPosition,
  ValidationSeverity,
  
  // Base component props interfaces
  BaseInputProps,
  InputProps,
  InputPropsWithoutChildren,
  InputElementProps,
  TextareaElementProps,
  
  // React Hook Form integration types
  ReactHookFormProps,
  
  // Zod validation integration
  ZodValidationProps,
  
  // Advanced formatting and styling
  InputFormattingProps,
  InputStylingProps,
  InputResponsiveProps,
  
  // Event handling interfaces
  InputEventProps,
  
  // Field state management
  InputFieldState,
  InputContextValue,
  
  // Validation configuration
  InputValidationConfig,
  
  // Component configuration
  InputSizeConfig,
  InputVariantConfig,
  InputConfig,
  
  // Group configuration
  InputGroupProps,
  
  // Factory types for dynamic component creation
  InputFactory,
  
  // Reference types
  InputRef as InputElementRef,
  TextareaRef,
} from './input.types';

/**
 * Re-exported Dependency Types
 * Convenient access to external library types used in input components
 */
export type {
  // React Hook Form types
  FieldPath,
  FieldValues,
  UseFormReturn,
  RegisterOptions,
  FieldError,
  
  // Zod validation types
  ZodSchema,
  ZodType,
} from './input.types';

// =============================================================================
// COMPONENT VARIANTS AND STYLING EXPORTS
// =============================================================================

/**
 * Input Variant Constants
 * Predefined variant options for consistent component usage
 */
export const INPUT_VARIANTS = {
  OUTLINE: 'outline',
  FILLED: 'filled',
  GHOST: 'ghost',
  UNDERLINED: 'underlined',
  FLOATING: 'floating',
} as const;

/**
 * Input Size Constants
 * Standardized size options maintaining WCAG 2.1 AA compliance
 */
export const INPUT_SIZES = {
  SMALL: 'sm',
  MEDIUM: 'md',
  LARGE: 'lg',
  EXTRA_LARGE: 'xl',
} as const;

/**
 * Input State Constants
 * Available state variations for visual feedback
 */
export const INPUT_STATES = {
  DEFAULT: 'default',
  FOCUSED: 'focused',
  ERROR: 'error',
  SUCCESS: 'success',
  WARNING: 'warning',
  DISABLED: 'disabled',
  READONLY: 'readonly',
  LOADING: 'loading',
} as const;

/**
 * Label Position Constants
 * Layout options for form field labels
 */
export const LABEL_POSITIONS = {
  TOP: 'top',
  LEFT: 'left',
  RIGHT: 'right',
  INSIDE: 'inside',
  FLOATING: 'floating',
  NONE: 'none',
} as const;

// =============================================================================
// UTILITY FUNCTIONS AND HELPERS
// =============================================================================

/**
 * Input Validation Utilities
 * Helper functions for common input validation scenarios
 */
export const InputValidationUtils = {
  /**
   * Validates email format with international domain support
   */
  validateEmail: (email: string): boolean => {
    const emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-\u00A0-\uFFFF]+@[a-zA-Z0-9\u00A0-\uFFFF](?:[a-zA-Z0-9-\u00A0-\uFFFF]{0,61}[a-zA-Z0-9\u00A0-\uFFFF])?(?:\.[a-zA-Z0-9\u00A0-\uFFFF](?:[a-zA-Z0-9-\u00A0-\uFFFF]{0,61}[a-zA-Z0-9\u00A0-\uFFFF])?)*$/;
    return emailRegex.test(email.trim());
  },
  
  /**
   * Validates password strength based on common requirements
   */
  validatePasswordStrength: (password: string): {
    isValid: boolean;
    score: number;
    requirements: Record<string, boolean>;
  } => {
    const requirements = {
      minLength: password.length >= 8,
      hasUppercase: /[A-Z]/.test(password),
      hasLowercase: /[a-z]/.test(password),
      hasNumber: /\d/.test(password),
      hasSpecialChar: /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password),
      noSpaces: !/\s/.test(password),
    };
    
    const score = Object.values(requirements).filter(Boolean).length / Object.keys(requirements).length * 100;
    const isValid = requirements.minLength && requirements.hasUppercase && requirements.hasLowercase && requirements.hasNumber;
    
    return { isValid, score, requirements };
  },
  
  /**
   * Formats phone number input with international support
   */
  formatPhoneNumber: (value: string, countryCode: string = 'US'): string => {
    const cleaned = value.replace(/\D/g, '');
    
    if (countryCode === 'US') {
      const match = cleaned.match(/^(\d{3})(\d{3})(\d{4})$/);
      if (match) {
        return `(${match[1]}) ${match[2]}-${match[3]}`;
      }
    }
    
    return value;
  },
  
  /**
   * Validates numeric input within specified range
   */
  validateNumberRange: (value: number, min?: number, max?: number): boolean => {
    if (isNaN(value)) return false;
    if (min !== undefined && value < min) return false;
    if (max !== undefined && value > max) return false;
    return true;
  },
} as const;

/**
 * Input Accessibility Utilities
 * WCAG 2.1 AA compliance helpers for input components
 */
export const InputAccessibilityUtils = {
  /**
   * Generates appropriate ARIA attributes for input state
   */
  generateAriaAttributes: (
    hasError: boolean,
    isRequired: boolean,
    describedBy?: string
  ): Record<string, any> => ({
    'aria-invalid': hasError,
    'aria-required': isRequired,
    'aria-describedby': describedBy,
  }),
  
  /**
   * Creates accessible error message announcement
   */
  createErrorAnnouncement: (fieldName: string, error: string): string => 
    `${fieldName} field has an error: ${error}`,
  
  /**
   * Generates unique ID for form field association
   */
  generateFieldId: (name: string): string => 
    `input-${name}-${Math.random().toString(36).substr(2, 9)}`,
} as const;

// =============================================================================
// DEFAULT EXPORT FOR CONVENIENCE
// =============================================================================

/**
 * Default export object providing access to all input components
 * Useful for dynamic component selection and testing scenarios
 */
const InputComponents = {
  // Core components
  Input,
  ControlledInput,
  SearchInput,
  Textarea,
  NumberInput,
  PasswordInput,
  EmailInput,
  
  // Container and utility components
  InputContainer,
  InputAdornment,
  
  // Constants
  VARIANTS: INPUT_VARIANTS,
  SIZES: INPUT_SIZES,
  STATES: INPUT_STATES,
  LABEL_POSITIONS,
  
  // Utilities
  ValidationUtils: InputValidationUtils,
  AccessibilityUtils: InputAccessibilityUtils,
} as const;

export default InputComponents;

// =============================================================================
// TYPE-ONLY EXPORTS FOR TREE-SHAKING OPTIMIZATION
// =============================================================================

/**
 * Additional type-only exports to support advanced TypeScript usage
 * These exports are eliminated during build for optimal bundle size
 */
export type {
  // Component ref types for imperative operations
  InputRef,
  TextareaRef,
  
  // Event handler types for custom implementations
  InputChangeEvent,
  InputFocusEvent,
  InputKeyboardEvent,
  
  // Configuration types for theme customization
  InputSizeConfig,
  InputVariantConfig,
  InputConfig,
  
  // Context and state types for advanced state management
  InputContextValue,
  InputFieldState,
  
  // Factory types for dynamic component creation
  InputFactory,
  
  // Group and layout types
  InputGroupProps,
  
  // Validation types
  InputValidationConfig,
  ValidationSeverity,
} from './input.types';

/**
 * Export component display names for debugging and development tools
 */
export const COMPONENT_NAMES = {
  INPUT: Input.displayName,
  SEARCH_INPUT: SearchInput.displayName,
  TEXTAREA: Textarea.displayName,
  NUMBER_INPUT: NumberInput.displayName,
  PASSWORD_INPUT: PasswordInput.displayName,
  EMAIL_INPUT: EmailInput.displayName,
} as const;

/**
 * Component version information for debugging and compatibility checks
 */
export const INPUT_COMPONENT_VERSION = '1.0.0';
export const REACT_VERSION_REQUIREMENT = '>=19.0.0';
export const NEXTJS_VERSION_REQUIREMENT = '>=15.1.0';
export const TYPESCRIPT_VERSION_REQUIREMENT = '>=5.8.0';