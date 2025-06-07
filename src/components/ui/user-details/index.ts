/**
 * @fileoverview Barrel export file for user details component
 * @description Centralized exports for the UserDetails component with comprehensive TypeScript support,
 * validation schemas, utilities, and clean import patterns for React 19/Next.js 15.1 applications
 * @module UserDetailsIndex
 * @version 1.0.0
 * @since 2024-12-19
 */

// ============================================================================
// COMPONENT EXPORTS
// ============================================================================

/**
 * Main UserDetails component with generic type support and comprehensive functionality
 */
export { UserDetails, type UserDetailsRef } from './user-details';

/**
 * Default export for convenience - UserDetails component
 */
export { default } from './user-details';

// ============================================================================
// TYPE EXPORTS - CORE INTERFACES
// ============================================================================

/**
 * Core component props interface with generic type parameter support
 */
export type {
  UserDetailsProps,
  UserDetailsFormData,
  ProfileDetailsFormData,
} from './types';

/**
 * Form data structure interfaces for validation and data handling
 */
export type {
  TabAccessItem,
  LookupKeyItem,
  AppRoleItem,
} from './types';

// ============================================================================
// TYPE EXPORTS - UTILITY TYPES
// ============================================================================

/**
 * Form operation and user type enums
 */
export type {
  FormMode,
  UserType,
  UserProfileType,
  ValidationState,
} from './types';

/**
 * Component configuration types
 */
export type {
  ComponentSize,
  ThemeMode,
} from './types';

// ============================================================================
// TYPE EXPORTS - VALIDATION AND ERROR HANDLING
// ============================================================================

/**
 * Validation configuration and error handling types
 */
export type {
  ValidationErrors,
  ValidationConfig,
  ZodValidationSchemas,
} from './types';

/**
 * Form workflow and state management types
 */
export type {
  FormWorkflowState,
  FormCallbacks,
  PaywallState,
} from './types';

// ============================================================================
// TYPE EXPORTS - ACCESSIBILITY AND INTERNATIONALIZATION
// ============================================================================

/**
 * Accessibility and WCAG 2.1 AA compliance interfaces
 */
export type {
  AccessibilityProps,
  InternationalizationProps,
} from './types';

/**
 * Theme and styling configuration types
 */
export type {
  ThemeAwareProps,
  ThemeStoreState,
} from './types';

// ============================================================================
// TYPE EXPORTS - REACT HOOK FORM INTEGRATION
// ============================================================================

/**
 * React Hook Form integration types for field arrays and state management
 */
export type {
  UseFieldArrayTypes,
  FormStateManager,
  FormPath,
  FormFieldPath,
} from './types';

/**
 * Re-exported React Hook Form types for convenience
 */
export type {
  UseFormReturn,
  UseFieldArrayReturn,
  FieldValues,
} from './types';

// ============================================================================
// TYPE EXPORTS - ADVANCED CONFIGURATION
// ============================================================================

/**
 * Advanced form configuration and customization types
 */
export type {
  ConditionalField,
  FieldConfig,
  FormConfiguration,
} from './types';

// ============================================================================
// TYPE-ONLY EXPORTS FOR TREE-SHAKING OPTIMIZATION
// ============================================================================

/**
 * Type-only exports to support optimal bundle splitting and tree-shaking
 * These exports ensure that TypeScript interfaces don't add runtime overhead
 */
export type * from './types';

// ============================================================================
// UTILITY EXPORTS - TYPE GUARDS
// ============================================================================

/**
 * Runtime type validation utilities
 */
export {
  isUserType,
  isFormMode,
  isValidationState,
} from './types';

// ============================================================================
// VALIDATION SCHEMA EXPORTS
// ============================================================================

/**
 * Note: Validation schemas are defined within the component file to avoid circular dependencies
 * and maintain proper encapsulation. They can be accessed through the component's exposed API
 * or re-exported here if needed for external validation usage.
 * 
 * For external access to validation schemas, use:
 * import { userDetailsSchema } from './user-details';
 * 
 * The following schemas are available in the component:
 * - profileDetailsSchema: Profile information validation
 * - tabAccessSchema: Admin tab access validation  
 * - lookupKeySchema: User lookup key validation
 * - appRoleSchema: Application role assignment validation
 * - userDetailsSchema: Complete form validation schema
 */

// ============================================================================
// UTILITY EXPORTS - HELPER FUNCTIONS
// ============================================================================

/**
 * Component utility functions for external usage
 * Note: These are internal to the component but can be exposed if needed
 * 
 * Available utilities in the component:
 * - getDefaultTabs(): Default admin tab configuration
 * - getDefaultFormValues(): Generate default form values based on mode/type
 * - useFormValidation(): Custom validation hook with debouncing
 */

// ============================================================================
// INTEGRATION EXPORTS - CLEAN IMPORT PATTERNS
// ============================================================================

/**
 * Organized exports by category for clean import patterns
 */

// Component exports
export const UserDetailsComponent = {
  UserDetails,
  type: 'UserDetails' as const,
} as const;

// Type exports organized by category
export const UserDetailsTypes = {
  // Core types
  Props: {} as UserDetailsProps,
  FormData: {} as UserDetailsFormData,
  ProfileData: {} as ProfileDetailsFormData,
  
  // Utility types
  Mode: {} as FormMode,
  UserType: {} as UserType,
  ValidationState: {} as ValidationState,
  
  // Configuration types
  ValidationConfig: {} as ValidationConfig,
  AccessibilityProps: {} as AccessibilityProps,
  ThemeProps: {} as ThemeAwareProps,
} as const;

// ============================================================================
// NAMED EXPORT COLLECTIONS FOR DIFFERENT USE CASES
// ============================================================================

/**
 * Admin workflow specific exports
 */
export const AdminUserDetails = {
  Component: UserDetails,
  type Props() { return {} as UserDetailsProps<UserDetailsFormData, 'admins'>; },
  type FormData() { return {} as UserDetailsFormData; },
  userType: 'admins' as const,
} as const;

/**
 * User workflow specific exports  
 */
export const StandardUserDetails = {
  Component: UserDetails,
  type Props() { return {} as UserDetailsProps<UserDetailsFormData, 'users'>; },
  type FormData() { return {} as UserDetailsFormData; },
  userType: 'users' as const,
} as const;

// ============================================================================
// VERSION AND METADATA
// ============================================================================

/**
 * Component metadata for development and debugging
 */
export const UserDetailsMetadata = {
  name: 'UserDetails',
  version: '1.0.0',
  framework: 'React 19',
  routing: 'Next.js 15.1',
  styling: 'Tailwind CSS',
  validation: 'Zod + React Hook Form',
  accessibility: 'WCAG 2.1 AA',
  testing: 'Vitest + Testing Library',
  features: [
    'Generic type support',
    'Comprehensive form validation',
    'Admin access control',
    'Role-based permissions',
    'Lookup key management',
    'Password security',
    'Accessibility compliance',
    'Dark mode support',
    'Internationalization ready',
    'Paywall integration',
    'Responsive design',
  ],
} as const;

// ============================================================================
// COMPATIBILITY EXPORTS
// ============================================================================

/**
 * Backward compatibility exports for migration from Angular implementation
 */
export const LegacyCompat = {
  // Angular component name mapping
  DfUserDetailsBaseComponent: UserDetails,
  
  // Angular reactive form patterns
  type ReactiveFormData() { return {} as UserDetailsFormData; },
  type FormMode() { return {} as FormMode; },
  type UserType() { return {} as UserType; },
} as const;

// ============================================================================
// DEVELOPMENT EXPORTS
// ============================================================================

/**
 * Development and testing utilities
 * These exports are only included in development builds
 */
export const DevUtils = process.env.NODE_ENV === 'development' ? {
  // Test data generators
  createMockUserData: (overrides?: Partial<UserDetailsFormData>) => ({
    profileDetailsGroup: {
      username: 'testuser',
      email: 'test@example.com',
      firstName: 'Test',
      lastName: 'User',
      name: 'Test User',
      phone: '+1-555-0123',
    },
    isActive: true,
    tabs: [],
    lookupKeys: [],
    appRoles: [],
    setPassword: false,
    sendInvite: true,
    ...overrides,
  } as UserDetailsFormData),
  
  // Mock props generators
  createMockProps: (overrides?: Partial<UserDetailsProps>) => ({
    mode: 'create' as FormMode,
    userType: 'users' as UserType,
    disabled: false,
    loading: false,
    ...overrides,
  } as UserDetailsProps),
} : undefined;

// ============================================================================
// MAIN EXPORTS SUMMARY
// ============================================================================

/**
 * Primary exports for common usage patterns:
 * 
 * // Default component import
 * import UserDetails from '@/components/ui/user-details';
 * 
 * // Named component import with types
 * import { UserDetails, type UserDetailsProps } from '@/components/ui/user-details';
 * 
 * // Type-only imports for optimal tree-shaking
 * import type { UserDetailsFormData, FormMode, UserType } from '@/components/ui/user-details';
 * 
 * // Specific workflow imports
 * import { AdminUserDetails, StandardUserDetails } from '@/components/ui/user-details';
 * 
 * // Utility imports
 * import { isUserType, isFormMode } from '@/components/ui/user-details';
 * 
 * // Category-based imports
 * import { UserDetailsComponent, UserDetailsTypes } from '@/components/ui/user-details';
 */