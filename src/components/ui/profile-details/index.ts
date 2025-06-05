/**
 * @fileoverview ProfileDetails component barrel export
 * 
 * Provides centralized imports for the React ProfileDetails form component and its associated types.
 * Exports the main ProfileDetailsComponent, TypeScript interfaces, validation schemas, and utility
 * functions to enable clean imports throughout the application with proper tree-shaking support.
 * 
 * This replaces the Angular DfProfileDetailsComponent with modern React 19 patterns,
 * React Hook Form integration, Zod validation, and Tailwind CSS styling.
 * 
 * @version 1.0.0
 * @requires React 19
 * @requires TypeScript 5.8+
 * @requires React Hook Form 7.57.0+
 * @requires Zod validation
 * @author DreamFactory Team
 */

// ============================================================================
// MAIN COMPONENT EXPORT
// ============================================================================

/**
 * Main ProfileDetails component - replaces Angular DfProfileDetailsComponent
 * React functional component with React Hook Form integration, Zod validation,
 * and comprehensive accessibility support.
 */
export { 
  ProfileDetails as ProfileDetailsComponent,
  default as ProfileDetails 
} from './profile-details';

// ============================================================================
// CORE TYPE DEFINITIONS
// ============================================================================

/**
 * Component props interface for type-safe component usage
 * Supports form configuration, validation, theming, and accessibility
 */
export type {
  ProfileDetailsProps,
  ProfileDetailsFormData,
} from './profile-details';

/**
 * Additional core interfaces from types module
 * Provides comprehensive typing for form state, validation, and configuration
 */
export type {
  ProfileDetailsProps as IProfileDetailsProps,
  ProfileDetailsFormData as IProfileDetailsFormData,
  ProfileDetailsFieldNames,
  ProfileDetailsFieldValues,
  PartialProfileDetailsFormData,
  RequiredProfileDetailsFields,
  OptionalProfileDetailsFields,
} from './types';

// ============================================================================
// VALIDATION SCHEMA EXPORTS
// ============================================================================

/**
 * Zod validation schema for ProfileDetails form
 * Provides comprehensive form validation with internationalized error messages
 * Compatible with React Hook Form resolver integration
 */
export { profileDetailsSchema } from './profile-details';

/**
 * Additional validation types and utilities
 */
export type {
  ProfileDetailsSchema,
  ValidationErrors,
  ProfileDetailsSubmitHandler,
  ProfileDetailsValidationHandler,
  ProfileDetailsChangeHandler,
} from './types';

// ============================================================================
// FORM CONFIGURATION TYPES
// ============================================================================

/**
 * Form field configuration interfaces for dynamic form rendering
 * Supports conditional fields, custom validation, and accessibility features
 */
export type {
  FormFieldConfig,
  ConditionalLogic,
  FormSubmissionState,
  FormValidationState,
  ProfileDetailsFormState,
} from './types';

// ============================================================================
// THEME INTEGRATION EXPORTS
// ============================================================================

/**
 * Theme-aware props for consistent styling across the application
 * Integrates with Zustand state management and Tailwind CSS
 */
export type {
  ThemeAwareProps,
  ResponsiveThemeConfig,
  FieldThemeConfig,
  ThemeMode,
  ComponentSize,
  FormLayout,
} from './types';

// ============================================================================
// ACCESSIBILITY EXPORTS
// ============================================================================

/**
 * Accessibility interfaces for WCAG 2.1 AA compliance
 * Provides comprehensive ARIA attributes and keyboard navigation support
 */
export type {
  AccessibilityProps,
  FieldAccessibilityConfig,
  TabNavigationConfig,
  ScreenReaderConfig,
  KeyboardShortcutConfig,
  FocusManagementConfig,
  ErrorAnnouncementConfig,
  AccessibilityRole,
} from './types';

// ============================================================================
// DEFAULT CONFIGURATIONS
// ============================================================================

/**
 * Default configuration objects for easy component setup
 * Provides sensible defaults for form behavior, theming, and accessibility
 */
export {
  DEFAULT_FORM_CONFIG,
  DEFAULT_THEME_CONFIG,
  DEFAULT_ACCESSIBILITY_CONFIG,
} from './types';

// ============================================================================
// TYPE GUARDS AND UTILITIES
// ============================================================================

/**
 * Runtime type validation utilities
 * Provides type guards for safe type checking and validation
 */
export {
  isProfileDetailsFormData,
  isValidationErrors,
  isFormValidationError,
} from './types';

// ============================================================================
// CONVENIENCE RE-EXPORTS
// ============================================================================

/**
 * Convenience exports for common use cases
 * Enables clean imports for the most frequently used types and components
 */

// Main component with common alias
export { ProfileDetailsComponent as UserProfileForm } from './profile-details';

// Common validation exports
export type { ValidationErrors as FormErrors } from './types';

// Theme and accessibility shortcuts
export type { 
  ThemeAwareProps as ThemeProps,
  AccessibilityProps as A11yProps 
} from './types';

// ============================================================================
// JSDoc TYPE DEFINITIONS FOR ENHANCED IDE SUPPORT
// ============================================================================

/**
 * @typedef {import('./types').ProfileDetailsProps} ProfileDetailsProps
 * @typedef {import('./types').ProfileDetailsFormData} ProfileDetailsFormData
 * @typedef {import('./types').ValidationErrors} ValidationErrors
 * @typedef {import('./types').ThemeAwareProps} ThemeAwareProps
 * @typedef {import('./types').AccessibilityProps} AccessibilityProps
 */