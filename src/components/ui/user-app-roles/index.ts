/**
 * @fileoverview Barrel export file for the UserAppRoles component system
 * 
 * This file provides centralized exports for the user application roles component,
 * enabling clean imports throughout the React 19/Next.js 15.1 application.
 * Supports tree-shaking optimization for optimal bundle size in production builds.
 * 
 * @example
 * ```typescript
 * // Import the main component
 * import { UserAppRoles } from '@/components/ui/user-app-roles';
 * 
 * // Import component with types
 * import { UserAppRoles, type UserAppRolesProps } from '@/components/ui/user-app-roles';
 * 
 * // Import specific types
 * import type { 
 *   UserAppRolesProps,
 *   UserAppRoleItem,
 *   UserAppRolesFormData 
 * } from '@/components/ui/user-app-roles';
 * ```
 */

// Main component exports - default and named exports for flexibility
export { default as UserAppRoles } from './user-app-roles';
export { default } from './user-app-roles';

// TypeScript interface exports for component props and form field types
export type {
  UserAppRolesProps,
  UserAppRoleItem,
  UserAppRolesFormData,
  UserAppRoleFieldType,
  UserAppRolesValidationSchema,
  UserAppRolesEventHandlers,
  UserAppRolesAccessibilityProps,
  UserAppRolesThemeProps,
  UserAppRolesIntegrationProps,
} from './user-app-roles.types';

// Re-export commonly used types from the types file for convenience
export type {
  AppSelectionOption,
  RoleSelectionOption,
  FormValidationState,
  AutocompleteState,
} from './user-app-roles.types';