/**
 * Input Component System - Barrel Export File
 * 
 * Centralized export hub for the DreamFactory Admin Interface input component system.
 * Provides clean imports for all React 19/Next.js 15.1 input components with comprehensive
 * TypeScript support, WCAG 2.1 AA accessibility compliance, and Tailwind CSS 4.1+ styling.
 * 
 * This barrel export file enables tree-shaking and organized imports while maintaining
 * consistency across the design system. All components are production-ready with
 * enterprise-grade validation, accessibility, and performance optimizations.
 * 
 * @example Basic Usage
 * ```tsx
 * import { Input, SearchInput, NumberInput } from '@/components/ui/input';
 * 
 * // Or specific imports for better tree-shaking
 * import { Input } from '@/components/ui/input/input';
 * import { SearchInput } from '@/components/ui/input/search-input';
 * ```
 * 
 * @example Type Imports
 * ```tsx
 * import type { 
 *   InputProps, 
 *   InputVariant, 
 *   SearchInputProps,
 *   NumberInputProps 
 * } from '@/components/ui/input';
 * ```
 * 
 * @fileoverview Barrel export for input component system
 * @version 1.0.0
 * @since React 19.0.0, Next.js 15.1+, TypeScript 5.8+
 */

// =============================================================================
// CORE INPUT COMPONENTS
// =============================================================================

/**
 * Base Input Component - Foundation for all input variations
 * Provides comprehensive text input with validation, accessibility, and theming
 */
export { Input, default as DefaultInput } from './input';

/**
 * Advanced Search Input Component
 * Specialized search with autocomplete, recent searches, and debounced handling
 */
export { SearchInput, default as DefaultSearchInput } from './search-input';

/**
 * Textarea Component
 * Multi-line text input with auto-resize, character counting, and syntax highlighting
 */
export { Textarea, ControlledTextarea } from './textarea';

/**
 * Number Input Component
 * Numeric input with formatting, validation, increment controls, and locale support
 */
export { NumberInput, default as DefaultNumberInput } from './number-input';

/**
 * Password Input Component
 * Secure password input with strength meter, visibility toggle, and security features
 */
export { PasswordInput, default as DefaultPasswordInput } from './password-input';

/**
 * Email Input Component
 * Email validation with typo detection, autocomplete suggestions, and multi-email support
 */
export { EmailInput, default as DefaultEmailInput } from './email-input';

// =============================================================================
// COMPONENT TYPE EXPORTS - BASE INPUT
// =============================================================================

/**
 * Base Input Component Types
 * Core interfaces for standard text input functionality
 */
export type {
  InputProps,
  InputRef,
  ReactHookFormProps as InputReactHookFormProps,
} from './input';

// =============================================================================
// COMPONENT TYPE EXPORTS - SEARCH INPUT
// =============================================================================

/**
 * Search Input Component Types
 * Interfaces for advanced search functionality
 */
export type {
  SearchInputProps,
  SearchSuggestion,
  RecentSearch,
  SearchInputConfig,
} from './search-input';

// =============================================================================
// COMPONENT TYPE EXPORTS - TEXTAREA
// =============================================================================

/**
 * Textarea Component Types
 * Interfaces for multi-line text input
 */
export type {
  TextareaProps,
  ControlledTextareaProps,
  TextareaRef,
  TextareaChangeEvent,
  TextareaFocusEvent,
  TextareaKeyboardEvent,
} from './textarea';

// =============================================================================
// COMPONENT TYPE EXPORTS - NUMBER INPUT
// =============================================================================

/**
 * Number Input Component Types
 * Interfaces for numeric input with formatting and controls
 */
export type {
  NumberInputProps,
  NumberFormatMode,
  NumberFormatConfig,
} from './number-input';

// =============================================================================
// COMPONENT TYPE EXPORTS - PASSWORD INPUT
// =============================================================================

/**
 * Password Input Component Types
 * Interfaces for secure password input with strength validation
 */
export type {
  PasswordInputProps,
  PasswordRule,
  PasswordStrength,
  PasswordStrengthConfig,
  PasswordSecurityConfig,
  PasswordConfirmationConfig,
} from './password-input';

// =============================================================================
// COMPONENT TYPE EXPORTS - EMAIL INPUT
// =============================================================================

/**
 * Email Input Component Types
 * Note: EmailInput component defines its own props interface internally
 * Re-export would need to be added to email-input.tsx if types need external access
 */
// Email input types are defined internally - no public type exports available
// This follows the pattern where component-specific types remain encapsulated

// =============================================================================
// SHARED INPUT TYPE SYSTEM
// =============================================================================

/**
 * Comprehensive Input Type System
 * Shared types and interfaces used across all input components
 */
export type {
  // Core variant and sizing types
  InputVariant,
  InputSize,
  InputState,
  InputFieldType,
  InputMask,
  
  // Base component interfaces
  BaseInputProps,
  ResponsiveInputConfig,
  
  // Form integration types
  InputFormIntegrationProps,
  InputFieldConfig,
  
  // Specialized input interfaces
  TextInputProps,
  PasswordInputProps as PasswordInputPropsGeneric,
  NumberInputProps as NumberInputPropsGeneric,
  SelectInputProps,
  SelectOption,
  TextareaInputProps,
  FileInputProps,
  FileUploadResult,
  FileUploadProgress,
  CheckboxInputProps,
  RadioInputProps,
  SwitchInputProps,
  DateInputProps,
  ColorInputProps,
  RangeInputProps,
  
  // Validation and state management
  InputValidationConfig,
  ValidationResult,
  InputStateManager,
  
  // Styling and theming
  InputStylingConfig,
  InputThemeConfig,
  
  // Accessibility and performance
  InputAccessibilityConfig,
  InputPerformanceConfig,
  
  // Component API and refs
  InputImperativeAPI,
  InputRef as InputRefGeneric,
  
  // Utility types
  InputPropsForType,
  InputComponentFactory,
  InputValueType,
  
  // Configuration
  InputConfig,
} from './input.types';

// =============================================================================
// PASSWORD INPUT UTILITIES AND CONSTANTS
// =============================================================================

/**
 * Password Input Utilities and Constants
 * Helpful functions and default configurations for password validation
 */
export {
  DEFAULT_PASSWORD_RULES,
  DEFAULT_STRENGTH_MESSAGES,
  calculatePasswordStrength,
} from './password-input';

// =============================================================================
// INPUT SYSTEM CONSTANTS
// =============================================================================

/**
 * Default Configuration Constants
 * Provides sensible defaults for input component configuration
 */
export { DEFAULT_INPUT_CONFIG } from './input.types';

// =============================================================================
// CONVENIENCE TYPE GROUPS
// =============================================================================

/**
 * Common Input Variant Types
 * Grouped exports for frequently used variant types
 */
export type InputVariants = {
  variant: InputVariant;
  size: InputSize;
  state: InputState;
};

/**
 * All Input Component Props
 * Union type of all input component props for generic handlers
 */
export type AnyInputProps = 
  | InputProps
  | SearchInputProps
  | TextareaProps
  | NumberInputProps
  | PasswordInputProps;

/**
 * Input Component Union Type
 * Union of all input component types for dynamic rendering
 */
export type InputComponent = 
  | typeof Input
  | typeof SearchInput
  | typeof Textarea
  | typeof NumberInput
  | typeof PasswordInput
  | typeof EmailInput;

/**
 * Input Value Types
 * Union of all possible input value types
 */
export type InputValue = string | number | boolean | Date | File[] | Array<string | number>;

// =============================================================================
// EXPORT COLLECTION OBJECTS
// =============================================================================

/**
 * Input Components Collection
 * Object containing all input components for dynamic access
 */
export const InputComponents = {
  Input,
  SearchInput,
  Textarea,
  NumberInput,
  PasswordInput,
  EmailInput,
} as const;

/**
 * Input Variants Collection
 * Object containing all variant options for configuration
 */
export const InputVariantOptions = {
  variants: [
    'default',
    'filled', 
    'ghost',
    'underlined',
    'floating',
    'inline'
  ] as const,
  sizes: [
    'xs',
    'sm', 
    'md',
    'lg',
    'xl'
  ] as const,
  states: [
    'idle',
    'focused',
    'valid',
    'invalid', 
    'warning',
    'disabled',
    'readonly',
    'loading'
  ] as const,
} as const;

/**
 * Input Types Collection
 * Object containing all input field types for dynamic forms
 */
export const InputTypeOptions = {
  text: [
    'text',
    'email',
    'url', 
    'tel',
    'search'
  ] as const,
  numeric: [
    'number',
    'range'
  ] as const,
  date: [
    'date',
    'datetime-local',
    'time',
    'month',
    'week'
  ] as const,
  selection: [
    'select',
    'multiselect',
    'checkbox',
    'radio',
    'switch'
  ] as const,
  advanced: [
    'textarea',
    'file',
    'color',
    'password'
  ] as const,
  specialized: [
    'connection-string',
    'json',
    'sql',
    'expression',
    'duration',
    'port',
    'hostname',
    'path',
    'tags'
  ] as const,
} as const;

// =============================================================================
// UTILITY FUNCTIONS
// =============================================================================

/**
 * Input Component Type Guards
 * Functions to check input component types at runtime
 */
export const InputTypeGuards = {
  /**
   * Check if a component is an Input component
   */
  isInput: (component: any): component is typeof Input => {
    return component === Input || component?.displayName === 'Input';
  },
  
  /**
   * Check if a component is a SearchInput component
   */
  isSearchInput: (component: any): component is typeof SearchInput => {
    return component === SearchInput || component?.displayName === 'SearchInput';
  },
  
  /**
   * Check if a component is a Textarea component
   */
  isTextarea: (component: any): component is typeof Textarea => {
    return component === Textarea || component?.displayName === 'Textarea';
  },
  
  /**
   * Check if a component is a NumberInput component
   */
  isNumberInput: (component: any): component is typeof NumberInput => {
    return component === NumberInput || component?.displayName === 'NumberInput';
  },
  
  /**
   * Check if a component is a PasswordInput component
   */
  isPasswordInput: (component: any): component is typeof PasswordInput => {
    return component === PasswordInput || component?.displayName === 'PasswordInput';
  },
  
  /**
   * Check if a component is an EmailInput component
   */
  isEmailInput: (component: any): component is typeof EmailInput => {
    return component === EmailInput || component?.displayName === 'EmailInput';
  },
} as const;

/**
 * Input Validation Helpers
 * Utility functions for common input validation scenarios
 */
export const InputValidationHelpers = {
  /**
   * Create validation rules for required fields
   */
  required: (message = 'This field is required') => ({
    required: { value: true, message },
  }),
  
  /**
   * Create validation rules for minimum length
   */
  minLength: (length: number, message?: string) => ({
    minLength: { 
      value: length, 
      message: message || `Minimum ${length} characters required` 
    },
  }),
  
  /**
   * Create validation rules for maximum length
   */
  maxLength: (length: number, message?: string) => ({
    maxLength: { 
      value: length, 
      message: message || `Maximum ${length} characters allowed` 
    },
  }),
  
  /**
   * Create validation rules for email format
   */
  email: (message = 'Please enter a valid email address') => ({
    pattern: {
      value: /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/,
      message,
    },
  }),
  
  /**
   * Create validation rules for numeric range
   */
  numberRange: (min: number, max: number, message?: string) => ({
    min: { value: min, message: message || `Minimum value is ${min}` },
    max: { value: max, message: message || `Maximum value is ${max}` },
  }),
} as const;

// =============================================================================
// VERSION AND METADATA
// =============================================================================

/**
 * Input Component System Metadata
 * Version and compatibility information
 */
export const InputSystemMetadata = {
  version: '1.0.0',
  reactVersion: '19.0.0',
  nextjsVersion: '15.1+',
  typescriptVersion: '5.8+',
  tailwindVersion: '4.1+',
  
  // Feature support flags
  features: {
    wcagCompliant: true,
    reactHookFormIntegration: true,
    zodValidation: true,
    darkModeSupport: true,
    responsiveDesign: true,
    internalization: true,
    performance: {
      debouncing: true,
      memoization: true,
      lazyLoading: true,
      treeshaking: true,
    },
    accessibility: {
      keyboardNavigation: true,
      screenReaderSupport: true,
      focusManagement: true,
      contrastCompliance: true,
    },
  },
  
  // Component counts
  components: {
    total: 6,
    core: 1,
    specialized: 5,
  },
  
  // Build information
  build: {
    target: 'es2022',
    modules: 'esnext',
    treeshaking: true,
  },
} as const;

// =============================================================================
// DEFAULT EXPORT
// =============================================================================

/**
 * Default export providing the base Input component
 * Most commonly used component in the input system
 */
export default Input;

// =============================================================================
// BARREL EXPORT SUMMARY
// =============================================================================

/**
 * Input Component System Export Summary
 * 
 * This barrel export provides:
 * 
 * ## Components (6 total)
 * - Input: Base text input with comprehensive features
 * - SearchInput: Advanced search with autocomplete and recent searches
 * - Textarea: Multi-line text with auto-resize and syntax highlighting
 * - NumberInput: Numeric input with formatting and increment controls
 * - PasswordInput: Secure password with strength meter and security features
 * - EmailInput: Email validation with typo detection and suggestions
 * 
 * ## Type System
 * - 50+ TypeScript interfaces and types for complete type safety
 * - React Hook Form integration with Zod schema validation support
 * - Comprehensive accessibility type definitions (WCAG 2.1 AA)
 * - Responsive design types with Tailwind CSS breakpoint support
 * 
 * ## Utilities
 * - Type guards for component identification
 * - Validation helpers for common scenarios
 * - Configuration constants and defaults
 * - Component collections for dynamic usage
 * 
 * ## Features
 * - Tree-shaking optimized exports
 * - Enterprise-grade validation and error handling
 * - Full accessibility compliance (WCAG 2.1 AA)
 * - Dark/light theme support with proper contrast ratios
 * - Responsive design with mobile-first approach
 * - Performance optimized with debouncing and memoization
 * - React 19 server component compatibility
 * - Next.js 15.1+ app router integration
 * 
 * @see Technical Specification Section 7.1 for framework details
 * @see WCAG 2.1 AA Guidelines for accessibility compliance
 * @see Tailwind CSS 4.1+ documentation for styling system
 */