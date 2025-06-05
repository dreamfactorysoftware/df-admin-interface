/**
 * Form Component System - Barrel Exports
 * 
 * Centralized export file for all React form components and utilities
 * that replace Angular reactive forms in the DreamFactory Admin Interface.
 * 
 * This barrel export provides:
 * - Core form components (Form, FormField, FormLabel, FormError, etc.)
 * - TypeScript interfaces and types for form handling
 * - Form validation utilities and hooks
 * - Named exports organized by component type and functionality
 * 
 * @framework React 19 + Next.js 15.1
 * @styling Tailwind CSS 4.1+ with Headless UI components
 * @validation React Hook Form 7.57+ with Zod schema validation
 * @accessibility WCAG 2.1 AA compliant form components
 */

// ================================
// Core Form Components
// ================================

/**
 * Primary Form component wrapper with React Hook Form integration
 * Replaces Angular reactive forms with React Hook Form patterns
 */
export { Form } from './form';
export type { FormProps } from './form';

/**
 * Flexible form field wrapper component with validation state management
 * Provides consistent layout and styling for all form input types
 */
export { FormField } from './form-field';
export type { FormFieldProps } from './form-field';

/**
 * Accessible form label component with required field indicators
 * Ensures proper label-input associations for screen readers
 */
export { FormLabel } from './form-label';
export type { FormLabelProps } from './form-label';

/**
 * Form error display component with validation message rendering
 * Integrates with React Hook Form error states and Zod validation
 */
export { FormError } from './form-error';
export type { FormErrorProps } from './form-error';

/**
 * Form control wrapper for individual input elements
 * Provides consistent styling and state management
 */
export { FormControl } from './form-control';
export type { FormControlProps } from './form-control';

/**
 * Form group container for logically related form fields
 * Enables grouped validation and layout organization
 */
export { FormGroup } from './form-group';
export type { FormGroupProps } from './form-group';

// ================================
// TypeScript Type Definitions
// ================================

/**
 * Comprehensive form-related type definitions and interfaces
 * Provides type safety for form handling throughout the application
 */
export type {
  // Base form types
  FormConfig,
  FormState,
  FormValidationRule,
  FormFieldType,
  
  // Validation types
  ValidationError,
  ValidationSchema,
  FieldValidator,
  
  // Form data types
  FormData,
  FormFieldValue,
  FormSubmitHandler,
  
  // Form control types
  FormControlState,
  FormFieldState,
  FormGroupState,
  
  // Event handler types
  FormChangeHandler,
  FormBlurHandler,
  FormFocusHandler,
  FormSubmitEvent,
  
  // Configuration types
  FormTheme,
  FormVariant,
  FormSize,
  FormLayout,
  
  // Accessibility types
  FormAriaProps,
  FormAccessibilityConfig,
  
  // Hook return types
  UseFormReturn,
  UseFormFieldReturn,
  UseFormValidationReturn,
} from './form.types';

// ================================
// Form Validation Utilities
// ================================

/**
 * Form validation utilities and helper functions
 * Replaces Angular validators with React Hook Form + Zod patterns
 */
export {
  // Validation schema builders
  createFormSchema,
  createFieldSchema,
  
  // Common validation rules
  required,
  minLength,
  maxLength,
  pattern,
  email,
  url,
  number,
  min,
  max,
  
  // Custom validators
  jsonValidator,
  matchValidator,
  uniqueNameValidator,
  
  // Validation utilities
  validateForm,
  validateField,
  getValidationError,
  formatValidationMessage,
} from './form-validation';

// ================================
// Form Hooks and Utilities
// ================================

/**
 * Custom React hooks for form state management and utilities
 * Provides React Hook Form integration with enhanced functionality
 */
export {
  // Primary form hook
  useForm,
  
  // Field-specific hooks
  useFormField,
  useFormValidation,
  useFormState,
  
  // Utility hooks
  useFormPersist,
  useFormAutoSave,
  useFormDirty,
  useFormSubmit,
  
  // Integration hooks
  useFormWithQuery,
  useFormWithMutation,
} from './form-hooks';

// ================================
// Form Constants and Presets
// ================================

/**
 * Form-related constants, default configurations, and presets
 * Maintains consistency across form implementations
 */
export {
  // Default configurations
  DEFAULT_FORM_CONFIG,
  DEFAULT_VALIDATION_CONFIG,
  
  // Theme presets
  FORM_THEMES,
  FORM_VARIANTS,
  FORM_SIZES,
  
  // Validation presets
  COMMON_VALIDATION_RULES,
  VALIDATION_MESSAGES,
  
  // Accessibility presets
  ARIA_LABELS,
  ACCESSIBILITY_CONFIG,
} from './form-constants';

// ================================
// Re-exports for Convenience
// ================================

/**
 * Re-export commonly used form-related dependencies
 * Provides single import point for external form libraries
 */
export {
  // React Hook Form core exports
  useController,
  useFieldArray,
  useFormContext,
  useFormState as useReactHookFormState,
  useWatch,
  Controller,
  FormProvider,
} from 'react-hook-form';

/**
 * Re-export Zod validation utilities for schema creation
 * Enables type-safe validation schema construction
 */
export {
  z,
  ZodSchema,
  ZodError,
  zodResolver,
} from 'zod';

// ================================
// Default Export (Deprecated Pattern)
// ================================

/**
 * Default export object for backward compatibility
 * @deprecated Use named exports instead for better tree-shaking
 */
const FormComponents = {
  Form,
  FormField,
  FormLabel,
  FormError,
  FormControl,
  FormGroup,
} as const;

export default FormComponents;