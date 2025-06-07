/**
 * Form Component System - Main Export File
 * 
 * Centralizes all form-related exports for the DreamFactory Admin Interface
 * React 19/Next.js 15.1 migration from Angular Reactive Forms to React Hook Form.
 * 
 * This barrel export provides clean imports for:
 * - Form component (root form wrapper with React Hook Form + Zod integration)
 * - FormField component (field wrapper with automatic validation state)
 * - FormLabel component (accessible labels with required indicators)
 * - FormError component (validation error display with ARIA live regions)
 * - FormControl component (input control wrapper with consistent styling)
 * - FormGroup component (semantic fieldset grouping for related fields)
 * - Form validation hooks and utilities
 * - Comprehensive TypeScript type definitions
 * 
 * Features:
 * - React Hook Form 7.52+ integration with real-time validation under 100ms
 * - Zod schema validation for type-safe form data handling
 * - WCAG 2.1 AA accessibility compliance throughout
 * - TypeScript 5.8+ type safety with schema inference
 * - Tailwind CSS 4.1+ design system integration
 * - Dark theme support via Zustand theme store
 * - Performance monitoring for validation timing compliance
 * - Auto-save and form persistence capabilities
 * 
 * @example
 * ```tsx
 * // Import the primary Form component
 * import { Form } from '@/components/ui/form';
 * 
 * // Import specific form components
 * import { FormField, FormLabel, FormError } from '@/components/ui/form';
 * 
 * // Import hooks and utilities
 * import { useFormContext, type FormProps } from '@/components/ui/form';
 * 
 * // Complete form example
 * const DatabaseConnectionForm = () => (
 *   <Form schema={databaseSchema} onSubmit={handleSubmit}>
 *     <FormField
 *       control={control}
 *       name="host"
 *       config={{ label: "Database Host", required: true }}
 *     >
 *       <Input />
 *     </FormField>
 *   </Form>
 * );
 * ```
 * 
 * @see Technical Specification Section 0 - SUMMARY OF CHANGES
 * @see Technical Specification Section 7.1 - CORE UI TECHNOLOGIES
 * @see React Hook Form Integration Requirements - Real-time validation under 100ms
 * @see WCAG 2.1 AA Guidelines: https://www.w3.org/WAI/WCAG21/Understanding/
 */

// =============================================================================
// PRIMARY FORM COMPONENT EXPORTS
// =============================================================================

/**
 * Main Form component - Primary export for all form interactions
 * 
 * Replaces Angular Reactive Forms with comprehensive React Hook Form implementation featuring:
 * - React Hook Form 7.52+ integration with Zod schema validation
 * - Real-time validation under 100ms performance requirement
 * - WCAG 2.1 AA accessibility compliance with proper ARIA relationships
 * - Auto-save and form persistence for complex database configuration workflows
 * - Error boundary patterns for robust error handling
 * - Performance monitoring to ensure validation timing compliance
 * - Theme-aware styling via Zustand theme store integration
 * - Programmatic form control via imperative ref API
 */
export { 
  Form as default,
  Form,
  useFormContext,
} from './form';

/**
 * Form component prop interfaces and types
 * Provides comprehensive TypeScript support for all form configurations
 */
export type { 
  FormProps,
  FormRef,
  FormContextValue,
} from './form';

// =============================================================================
// FORM FIELD COMPONENT EXPORTS
// =============================================================================

/**
 * FormField component for comprehensive field wrapper functionality
 * 
 * Replaces Angular FormControl directives with React Hook Form useController integration:
 * - Automatic field registration with React Hook Form
 * - WCAG 2.1 AA accessibility with proper label-control-error associations
 * - Responsive layout support (vertical, horizontal, inline, grid)
 * - Error state management with real-time validation feedback
 * - Loading states and async validation support
 * - Conditional field visibility and dynamic form generation
 * - Field-level performance monitoring for validation timing
 */
export { 
  FormField,
  useFormFieldAccessibility,
  useFormFieldValidation,
  FORM_FIELD_CONSTANTS,
} from './form-field';

/**
 * FormField prop interfaces and utilities
 */
export type { 
  FormFieldProps,
  FormFieldConfig,
  FormFieldLayout,
} from './form-field';

// =============================================================================
// FORM LABEL COMPONENT EXPORTS
// =============================================================================

/**
 * FormLabel component for accessible form field labeling
 * 
 * Provides consistent labeling with accessibility compliance:
 * - Proper label-control association via htmlFor attributes
 * - Required field indicators with screen reader announcements
 * - Optional field indicators for improved UX clarity
 * - Tooltip integration for description and help text
 * - Responsive typography scaling across viewport sizes
 * - Error state styling with WCAG compliant color contrast
 * - Integration with form validation state for visual feedback
 */
export { 
  FormLabel,
} from './form-label';

/**
 * FormLabel prop interfaces and utilities
 */
export type { 
  FormLabelProps,
} from './form-label';

// =============================================================================
// FORM ERROR COMPONENT EXPORTS
// =============================================================================

/**
 * FormError component for validation error display
 * 
 * Integrates with React Hook Form for comprehensive error handling:
 * - FieldError integration with automatic error state management
 * - ARIA live regions for dynamic error announcements to screen readers
 * - Error severity levels (error, warning, info) with appropriate styling
 * - Multiple error display with priority ordering
 * - Smooth animations for error state transitions
 * - Error icon integration with proper ARIA labeling
 * - Color contrast compliance for accessibility standards
 */
export { 
  FormError,
} from './form-error';

/**
 * FormError prop interfaces and utilities
 */
export type { 
  FormErrorProps,
  ErrorMessage,
  ErrorSeverity,
} from './form-error';

// =============================================================================
// FORM CONTROL COMPONENT EXPORTS
// =============================================================================

/**
 * FormControl component for input control wrapper functionality
 * 
 * Provides consistent spacing, layout, and accessibility for form inputs:
 * - Automatic field registration integration
 * - WCAG 2.1 AA focus indicators and keyboard navigation
 * - Consistent styling using Tailwind CSS design tokens
 * - Support for disabled and readonly states
 * - Help text and description support with ARIA associations
 * - Focus ring system with proper contrast ratios
 * - Integration with form field validation state
 */
export { 
  FormControl,
} from './form-control';

/**
 * FormControl prop interfaces and utilities
 */
export type { 
  FormControlProps,
  FormControlSpacing,
  FormControlLayout,
  FormControlState,
} from './form-control';

// =============================================================================
// FORM GROUP COMPONENT EXPORTS
// =============================================================================

/**
 * FormGroup component for semantic field grouping
 * 
 * Uses fieldset/legend elements for proper accessibility:
 * - Semantic HTML with fieldset/legend for screen reader navigation
 * - WCAG 2.1 AA compliance with proper ARIA labeling
 * - Collapsible groups with smooth animations and accessibility support
 * - Group-level validation and error display
 * - Responsive layout patterns for complex forms
 * - Integration with form section configuration
 * - Dark theme support with consistent visual hierarchy
 */
export { 
  FormGroup,
} from './form-group';

/**
 * FormGroup prop interfaces and utilities
 */
export type { 
  FormGroupProps,
} from './form-group';

// =============================================================================
// FORM TYPE DEFINITIONS AND SCHEMAS
// =============================================================================

/**
 * Comprehensive TypeScript type definitions for the form system
 * 
 * Provides type-safe form development with:
 * - React Hook Form integration types
 * - Zod schema validation types with inference
 * - Form configuration and validation interfaces
 * - Dynamic form generation types
 * - Performance monitoring types
 * - Accessibility configuration types
 * - Theme integration types
 */
export type {
  // Core form types
  FormSchema,
  InferFormSchema,
  FormConfig,
  BaseFormProps,
  FormLayout,
  FormSpacing,
  FormFieldVariant,
  
  // Validation types
  ValidationMode,
  RevalidateMode,
  FormValidationResult,
  FormSubmissionResult,
  FormValidator,
  
  // State management types
  FormState,
  FormActions,
  UseFormResult,
  
  // Dynamic form types
  DynamicFormConfig,
  FormSectionConfig,
  FormFieldType,
  FormFieldRegistry,
  
  // Performance and accessibility types
  FormPerformanceConfig,
  FormPerformanceMetrics,
  FormAccessibilityConfig,
  FormThemeConfig,
  FormValidationContext,
  
  // Re-exported React Hook Form types for convenience
  UseFormReturn,
  FieldError,
  FieldValues,
  Path,
  PathValue,
  SubmitHandler,
  Control,
  RegisterOptions,
  FieldErrorsImpl,
  
  // Re-exported Zod types for validation
  ZodSchema,
  ZodType,
  ZodInfer,
  
  // Class variance authority types
  VariantProps,
} from './form.types';

// =============================================================================
// FORM CONSTANTS AND CONFIGURATION
// =============================================================================

/**
 * Form system constants for consistent behavior
 * 
 * Provides reference values for:
 * - Performance requirements (100ms validation threshold)
 * - Default configuration values
 * - Accessibility timing standards
 * - Layout and spacing defaults
 * - Validation mode defaults
 */
export { 
  FORM_CONSTANTS,
} from './form.types';

// =============================================================================
// CONVENIENCE RE-EXPORTS
// =============================================================================

/**
 * React Hook Form utilities re-exported for convenience
 * Enables seamless integration without additional imports
 */
export { 
  useForm,
  useController,
  useFormState,
  useWatch,
  useFieldArray,
} from 'react-hook-form';

/**
 * Zod validation utilities re-exported for convenience
 * Simplifies schema creation and validation workflows
 */
export { 
  z,
} from 'zod';

/**
 * React Hook Form resolver for Zod integration
 * Essential for connecting Zod schemas with React Hook Form
 */
export { 
  zodResolver,
} from '@hookform/resolvers/zod';

// =============================================================================
// COMPONENT COLLECTION EXPORT
// =============================================================================

/**
 * Complete form component collection for bulk imports
 * Useful for component libraries and documentation systems
 * 
 * @example
 * ```tsx
 * import { FormComponents } from '@/components/ui/form';
 * 
 * // Access all components through the collection
 * const { Form, FormField, FormLabel } = FormComponents;
 * ```
 */
export const FormComponents = {
  Form,
  FormField,
  FormLabel,
  FormError,
  FormControl,
  FormGroup,
} as const;

/**
 * Form hooks collection for bulk imports
 * Provides access to all form-related hooks and utilities
 * 
 * @example
 * ```tsx
 * import { FormHooks } from '@/components/ui/form';
 * 
 * // Access hooks through the collection
 * const formContext = FormHooks.useFormContext();
 * ```
 */
export const FormHooks = {
  useFormContext,
  useFormFieldAccessibility,
  useFormFieldValidation,
  useForm,
  useController,
  useFormState,
  useWatch,
  useFieldArray,
} as const;

// =============================================================================
// TYPE COLLECTION EXPORTS
// =============================================================================

/**
 * Complete type collection for form system
 * Consolidates all TypeScript interfaces and types for easy import
 */
export interface FormSystemTypes {
  FormProps: FormProps;
  FormRef: FormRef;
  FormFieldProps: FormFieldProps;
  FormLabelProps: FormLabelProps;
  FormErrorProps: FormErrorProps;
  FormControlProps: FormControlProps;
  FormGroupProps: FormGroupProps;
  FormConfig: FormConfig;
  FormValidationResult: FormValidationResult;
  FormSubmissionResult: FormSubmissionResult;
  FormState: FormState;
}

/**
 * Form field type union for dynamic component creation
 * Useful for configuration-driven form rendering
 */
export type FormFieldTypeUnion = 
  | 'text'
  | 'email'
  | 'password'
  | 'number'
  | 'tel'
  | 'url'
  | 'search'
  | 'textarea'
  | 'select'
  | 'multiselect'
  | 'checkbox'
  | 'radio'
  | 'switch'
  | 'date'
  | 'datetime-local'
  | 'time'
  | 'file'
  | 'range'
  | 'color'
  | 'hidden';

/**
 * Form layout type union for dynamic layout control
 */
export type FormLayoutUnion = 'vertical' | 'horizontal' | 'inline' | 'grid';

/**
 * Form spacing type union for dynamic spacing control
 */
export type FormSpacingUnion = 'compact' | 'normal' | 'relaxed' | 'loose';

/**
 * Form variant type union for dynamic styling
 */
export type FormVariantUnion = 'default' | 'filled' | 'outlined' | 'underlined' | 'ghost';

// =============================================================================
// ACCESSIBILITY AND PERFORMANCE CONSTANTS
// =============================================================================

/**
 * WCAG 2.1 AA compliance constants for form system
 * Provides reference values for accessibility validation
 */
export const FORM_ACCESSIBILITY_CONSTANTS = {
  /**
   * Minimum touch target size per WCAG guidelines
   */
  MIN_TOUCH_TARGET: {
    width: 44,
    height: 44,
  },
  
  /**
   * Minimum contrast ratios for AA compliance
   */
  CONTRAST_RATIOS: {
    normalText: 4.5,
    uiComponents: 3.0,
    enhancedText: 7.0, // AAA level
  },
  
  /**
   * Focus ring specifications for form elements
   */
  FOCUS_RING: {
    width: 2,
    offset: 2,
    borderRadius: 4,
  },
  
  /**
   * Animation and transition constants
   */
  TIMING: {
    transition: 200, // milliseconds
    announcement: 1000, // milliseconds for screen reader announcements
    errorAnnouncementDelay: 150, // milliseconds for error state changes
  },
  
  /**
   * ARIA live region settings
   */
  LIVE_REGIONS: {
    errorPoliteness: 'polite' as const,
    successPoliteness: 'polite' as const,
    urgentPoliteness: 'assertive' as const,
  },
} as const;

/**
 * Performance monitoring constants for form validation
 * Ensures compliance with 100ms validation requirement
 */
export const FORM_PERFORMANCE_CONSTANTS = {
  /**
   * Maximum validation time per SUMMARY OF CHANGES requirement
   */
  MAX_VALIDATION_TIME: 100, // milliseconds
  
  /**
   * Maximum submission time for user experience
   */
  MAX_SUBMISSION_TIME: 30000, // milliseconds (30 seconds)
  
  /**
   * Debounce delay for onChange validation
   */
  VALIDATION_DEBOUNCE: 300, // milliseconds
  
  /**
   * Performance monitoring thresholds
   */
  PERFORMANCE_THRESHOLDS: {
    validation: 100, // milliseconds
    rendering: 16, // milliseconds (60fps)
    submission: 2000, // milliseconds
  },
  
  /**
   * Maximum field count for optimal performance
   */
  MAX_FIELDS: 100,
} as const;

/**
 * Default form configuration for consistent application defaults
 */
export const DEFAULT_FORM_CONFIG = {
  layout: 'vertical' as FormLayoutUnion,
  spacing: 'normal' as FormSpacingUnion,
  variant: 'default' as FormVariantUnion,
  validationMode: 'onBlur' as ValidationMode,
  revalidateMode: 'onChange' as RevalidateMode,
  shouldFocusError: true,
  shouldUseNativeValidation: false,
  enablePerformanceMonitoring: true,
  enableAccessibilityFeatures: true,
} as const;

/**
 * Form field default configuration
 */
export const DEFAULT_FIELD_CONFIG = {
  required: false,
  disabled: false,
  readOnly: false,
  showOptional: false,
  hideLabel: false,
  size: 'md' as const,
  variant: 'default' as FormVariantUnion,
} as const;