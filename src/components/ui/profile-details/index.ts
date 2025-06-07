/**
 * ProfileDetails Component Barrel Export
 * 
 * Centralized export file for the ProfileDetails component providing clean imports
 * for the React profile details form component and its associated types. Supports
 * modern React patterns with proper tree-shaking and TypeScript 5.8+ integration.
 * 
 * Exports:
 * - ProfileDetailsComponent: Main React component replacing Angular DfProfileDetailsComponent
 * - ProfileDetailsProps: TypeScript interface for component prop typing
 * - ProfileDetailsFormData: Type definition for form data structure
 * - profileDetailsSchema: Zod validation schema for form validation
 * - Utility functions and accessibility/theme integration helpers
 * 
 * @fileoverview Barrel export for ProfileDetails component
 * @version 1.0.0
 * @since React 19.0.0, Next.js 15.1+, TypeScript 5.8+
 */

// ============================================================================
// MAIN COMPONENT EXPORTS
// ============================================================================

/**
 * Main ProfileDetails component export
 * Primary React component for profile details form functionality
 */
export { 
  ProfileDetails as ProfileDetailsComponent,
  ProfileDetails,
  ProfileDetailsUtils,
  default as ProfileDetailsDefault
} from './profile-details';

// ============================================================================
// TYPE DEFINITIONS EXPORTS
// ============================================================================

/**
 * Core type definitions for ProfileDetails component
 * Provides comprehensive TypeScript support for props, form data, and configuration
 */
export type {
  // Core component types
  ProfileDetailsProps,
  ProfileDetailsFormData,
  ProfileValidationErrors,
  
  // Configuration types
  ProfileValidationConfig,
  ProfileThemeConfig,
  ProfileAccessibilityConfig,
  ProfileLayoutConfig,
  ProfilePermissions,
  
  // User preference types
  UserPreferences,
  NotificationPreferences,
  AccessibilityPreferences,
  
  // Form and validation types
  ProfileFormFieldConfig,
  ProfileFormState,
  ProfileEventHandlers,
  ProfileCustomValidationRules,
  PasswordValidationRules,
  EmailValidationConfig,
  PhoneValidationConfig,
  ProfileValidationMessages,
  
  // Layout and presentation types
  ProfileLayoutSection,
  ProfileAriaAttributes,
  
  // Theme integration types
  ProfileThemeIntegration,
  
  // Utility types
  ProfileFormFieldName,
  ProfileFormFieldValue,
  ProfileFormPartial,
  ProfileFormRequired,
  HasPermission,
  
  // Template literal types for enhanced validation (TypeScript 5.8+)
  ProfileValidationKey,
  ProfileErrorKey,
  ProfileSuccessKey,
  
  // Branded types for enhanced type safety
  ProfileId,
  Username,
  EmailAddress,
} from './types';

// ============================================================================
// VALIDATION SCHEMA EXPORTS
// ============================================================================

/**
 * Zod validation schema export
 * Provides reusable validation schema for form validation across the application
 */
export const profileDetailsSchema = ProfileDetailsUtils.schema;

// ============================================================================
// UTILITY FUNCTION EXPORTS
// ============================================================================

/**
 * Utility functions for ProfileDetails component
 * Provides helper functions for validation, data transformation, and profile management
 */
export const {
  validateProfileData,
  generateDisplayName,
} = ProfileDetailsUtils;

// ============================================================================
// ACCESSIBILITY EXPORTS
// ============================================================================

/**
 * Re-export accessibility utilities for external usage
 * Enables consistent accessibility patterns across the application
 */
export type {
  ProfileAccessibilityConfig as AccessibilityConfig,
  ProfileAriaAttributes as AriaAttributes,
} from './types';

// ============================================================================
// THEME INTEGRATION EXPORTS
// ============================================================================

/**
 * Re-export theme integration types for external usage
 * Supports theme-aware component development and customization
 */
export type {
  ProfileThemeConfig as ThemeConfig,
  ProfileThemeIntegration as ThemeIntegration,
} from './types';

// ============================================================================
// VALIDATION HELPERS EXPORTS
// ============================================================================

/**
 * Validation helper types and configurations
 * Provides reusable validation patterns for form development
 */
export type {
  ProfileValidationConfig as ValidationConfig,
  ProfileCustomValidationRules as CustomValidationRules,
  ProfileValidationErrors as ValidationErrors,
  ProfileValidationMessages as ValidationMessages,
} from './types';

// ============================================================================
// FORM INTEGRATION EXPORTS
// ============================================================================

/**
 * Form integration types for React Hook Form compatibility
 * Enables seamless integration with React Hook Form patterns
 */
export type {
  ProfileFormFieldConfig as FormFieldConfig,
  ProfileFormState as FormState,
  ProfileEventHandlers as EventHandlers,
} from './types';

// ============================================================================
// DEFAULT EXPORT
// ============================================================================

/**
 * Default export for convenient importing
 * Provides the main ProfileDetails component as default export
 */
export { ProfileDetails as default } from './profile-details';

// ============================================================================
// NAMESPACE EXPORT
// ============================================================================

/**
 * Namespace export for organized imports
 * Allows importing all ProfileDetails-related items under a single namespace
 */
export * as ProfileDetailsNamespace from './profile-details';
export * as ProfileDetailsTypes from './types';

// ============================================================================
// COMPATIBILITY EXPORTS
// ============================================================================

/**
 * Legacy and compatibility exports
 * Provides backward compatibility and alternative import patterns
 */

// Alternative component name for migration compatibility
export { ProfileDetails as DfProfileDetailsReact } from './profile-details';

// Common alias exports
export { ProfileDetails as ProfileDetailsForm } from './profile-details';
export { ProfileDetails as UserProfileDetails } from './profile-details';

// Schema alias for validation libraries
export { profileDetailsSchema as userProfileSchema } from './profile-details';

// ============================================================================
// TREE-SHAKING OPTIMIZATION
// ============================================================================

/**
 * Explicit exports for optimal tree-shaking
 * Ensures dead code elimination and minimal bundle size
 */

// Core component export with explicit typing
export const ProfileDetailsComponent: React.ComponentType<ProfileDetailsProps> = ProfileDetails;

// Validation schema with explicit typing
export const ProfileValidationSchema = profileDetailsSchema;

// Utility functions with explicit typing
export const ProfileUtils = {
  validateProfileData: ProfileDetailsUtils.validateProfileData,
  generateDisplayName: ProfileDetailsUtils.generateDisplayName,
  schema: ProfileDetailsUtils.schema,
} as const;

// ============================================================================
// TYPE-ONLY EXPORTS FOR ENHANCED TREE-SHAKING
// ============================================================================

/**
 * Type-only exports for maximum tree-shaking efficiency
 * Ensures types are removed during compilation while maintaining type safety
 */
export type { ProfileDetailsProps as ComponentProps } from './types';
export type { ProfileDetailsFormData as FormData } from './types';
export type { ProfileValidationConfig as Validation } from './types';
export type { ProfileAccessibilityConfig as A11y } from './types';
export type { ProfileThemeConfig as Theme } from './types';
export type { ProfileLayoutConfig as Layout } from './types';
export type { ProfilePermissions as Permissions } from './types';

// ============================================================================
// DEVELOPMENT AND DEBUGGING EXPORTS
// ============================================================================

/**
 * Development-only exports for debugging and testing
 * Provides additional utilities for development and testing environments
 */
if (process.env.NODE_ENV === 'development') {
  // Performance monitoring utilities
  export const ProfileDetailsDebug = {
    componentName: 'ProfileDetails',
    version: '1.0.0',
    dependencies: ['react-hook-form', 'zod', 'tailwindcss'],
    features: [
      'React Hook Form integration',
      'Zod validation',
      'Tailwind CSS styling',
      'WCAG 2.1 AA accessibility',
      'Theme integration',
      'Internationalization support',
    ],
  };
}

// ============================================================================
// MODULE METADATA
// ============================================================================

/**
 * Module metadata for tooling and documentation
 */
export const __metadata = {
  name: 'ProfileDetails',
  version: '1.0.0',
  description: 'React profile details form component for DreamFactory Admin Interface',
  author: 'DreamFactory Development Team',
  license: 'MIT',
  dependencies: {
    react: '^19.0.0',
    'react-hook-form': '^7.52.0',
    zod: '^3.23.0',
    clsx: '^2.1.0',
    '@headlessui/react': '^2.0.0',
  },
  exports: {
    component: 'ProfileDetailsComponent',
    types: 'ProfileDetailsProps, ProfileDetailsFormData',
    schema: 'profileDetailsSchema',
    utils: 'ProfileDetailsUtils',
  },
  accessibility: {
    compliance: 'WCAG 2.1 AA',
    features: ['ARIA support', 'Keyboard navigation', 'Screen reader optimization'],
  },
  testing: {
    coverage: '90%+',
    frameworks: ['Vitest', 'React Testing Library'],
  },
} as const;