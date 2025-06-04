/**
 * @fileoverview User Details Component Barrel Export
 * 
 * Centralized export file for the UserDetails component system providing clean imports
 * for all component exports, types, and utilities. Supports React 19/Next.js 15.1
 * conventions with generic type support for different user profile types.
 * 
 * @version 1.0.0
 * @author DreamFactory Admin Interface Team
 */

// =============================================================================
// COMPONENT EXPORTS
// =============================================================================

// Main UserDetails component with generic type support
export { default as UserDetails } from './user-details';
export { UserDetails as UserDetailsComponent } from './user-details';

// =============================================================================
// TYPE EXPORTS
// =============================================================================

// Primary component prop interfaces with generic support
export type {
  UserDetailsProps,
  UserDetailsGenericProps,
  UserDetailsFormData,
  UserDetailsFormState,
} from './types';

// Form mode and user type enums
export type {
  FormMode,
  UserType,
  UserProfileType,
  ValidationMode,
} from './types';

// Validation and error handling types
export type {
  UserDetailsErrors,
  FieldValidationError,
  FormValidationResult,
  ValidationErrorMap,
} from './types';

// Event handler types for component interaction
export type {
  UserDetailsEventHandlers,
  FormSubmitHandler,
  FormChangeHandler,
  FormValidationHandler,
} from './types';

// Configuration and options types
export type {
  UserDetailsConfig,
  FormFieldConfig,
  AccessibilityConfig,
  ThemeConfig,
} from './types';

// =============================================================================
// VALIDATION SCHEMA EXPORTS
// =============================================================================

// Zod schemas for form validation and data integrity
export {
  userDetailsSchema,
  userProfileSchema,
  userFormDataSchema,
  adminProfileSchema,
} from './validation-schemas';

// Field-level validation schemas
export {
  emailValidationSchema,
  passwordValidationSchema,
  nameValidationSchema,
  phoneValidationSchema,
} from './validation-schemas';

// Conditional validation schemas for different user types
export {
  createUserValidationSchema,
  updateUserValidationSchema,
  adminUserValidationSchema,
  standardUserValidationSchema,
} from './validation-schemas';

// =============================================================================
// UTILITY EXPORTS
// =============================================================================

// Form data transformation utilities
export {
  transformUserFormData,
  sanitizeUserInput,
  validateUserProfile,
  formatUserDisplay,
} from './utils';

// State management utilities
export {
  getUserFormDefaults,
  resetUserForm,
  isFormDirty,
  getFormErrors,
} from './utils';

// Accessibility utilities
export {
  generateAriaLabels,
  getFieldAccessibilityProps,
  announceFormErrors,
  focusFirstError,
} from './accessibility-utils';

// Theme integration utilities
export {
  getUserDetailsThemeClasses,
  getFormFieldVariants,
  getDynamicFormStyles,
} from './theme-utils';

// =============================================================================
// HOOK EXPORTS
// =============================================================================

// Custom hooks for user details functionality
export {
  useUserDetailsForm,
  useUserValidation,
  useUserFormState,
  useUserSubmission,
} from './hooks';

// =============================================================================
// CONSTANT EXPORTS
// =============================================================================

// Form configuration constants
export {
  DEFAULT_FORM_CONFIG,
  USER_TYPE_OPTIONS,
  VALIDATION_DEBOUNCE_MS,
  FORM_FIELD_NAMES,
} from './constants';

// Error message constants
export {
  ERROR_MESSAGES,
  VALIDATION_MESSAGES,
  ACCESSIBILITY_MESSAGES,
} from './constants';

// =============================================================================
// TYPE-ONLY EXPORTS (for tree-shaking optimization)
// =============================================================================

// Component prop types for external usage
export type { UserDetailsRef } from './types';
export type { UserDetailsForwardRef } from './types';

// Generic constraints for type safety
export type { UserProfileBase, AdminProfileBase } from './types';

// Form submission types
export type { SubmitResult, SubmitError, SubmitSuccess } from './types';

// =============================================================================
// RE-EXPORTS FROM DEPENDENCIES
// =============================================================================

// Re-export common types from shared type definitions
export type {
  UserProfile,
  AdminProfile,
  UserSession,
  LookupKey,
} from '@/types/user';

// Re-export form types for convenience
export type {
  FormFieldProps,
  FormValidationProps,
  FormSubmissionProps,
} from '@/types/forms';

// =============================================================================
// DEFAULT EXPORT
// =============================================================================

// Default export for convenience importing
export { default } from './user-details';

/**
 * @example Basic Usage
 * ```typescript
 * import { UserDetails } from '@/components/ui/user-details';
 * import type { UserDetailsProps, UserProfile } from '@/components/ui/user-details';
 * 
 * function UserManagement() {
 *   return (
 *     <UserDetails<UserProfile>
 *       mode="create"
 *       userType="users"
 *       onSubmit={handleSubmit}
 *       validationSchema={userDetailsSchema}
 *     />
 *   );
 * }
 * ```
 * 
 * @example Admin User Creation
 * ```typescript
 * import { 
 *   UserDetails, 
 *   adminProfileSchema,
 *   useUserDetailsForm 
 * } from '@/components/ui/user-details';
 * import type { AdminProfile } from '@/components/ui/user-details';
 * 
 * function AdminUserForm() {
 *   const { form, handleSubmit } = useUserDetailsForm<AdminProfile>({
 *     validationSchema: adminProfileSchema,
 *     mode: 'create'
 *   });
 * 
 *   return (
 *     <UserDetails<AdminProfile>
 *       mode="create"
 *       userType="admins"
 *       form={form}
 *       onSubmit={handleSubmit}
 *       config={{
 *         showAdvancedOptions: true,
 *         enableRoleManagement: true
 *       }}
 *     />
 *   );
 * }
 * ```
 * 
 * @example Validation Only Import
 * ```typescript
 * import { 
 *   userDetailsSchema, 
 *   validateUserProfile 
 * } from '@/components/ui/user-details';
 * 
 * const validationResult = validateUserProfile(userData, userDetailsSchema);
 * ```
 * 
 * @example Type-only Import
 * ```typescript
 * import type { 
 *   UserDetailsProps, 
 *   FormMode, 
 *   UserType 
 * } from '@/components/ui/user-details';
 * 
 * const config: UserDetailsProps<UserProfile> = {
 *   mode: 'edit',
 *   userType: 'users'
 * };
 * ```
 */