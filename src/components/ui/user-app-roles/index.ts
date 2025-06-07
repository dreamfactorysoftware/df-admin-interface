/**
 * @fileoverview Barrel export file for the user application roles component
 * 
 * This file provides centralized imports for all UserAppRoles component exports and related
 * utilities, following React 19/Next.js 15.1 component library patterns for optimal
 * tree-shaking and build performance.
 * 
 * Key Features:
 * - Clean export patterns for Next.js 15.1 app router compatibility
 * - Tree-shaking support for optimal bundle size in production builds
 * - Type-only exports for TypeScript interface definitions
 * - Comprehensive component exports for flexible customization
 * - Validation schemas and utility functions for form integration
 * 
 * Usage:
 * ```typescript
 * // Primary component import
 * import { UserAppRoles } from '@/components/ui/user-app-roles';
 * 
 * // Type imports
 * import type { UserAppRolesProps, UserAppRoleAssignment } from '@/components/ui/user-app-roles';
 * 
 * // Validation schema import
 * import { UserAppRoleAssignmentSchema } from '@/components/ui/user-app-roles';
 * 
 * // Sub-component imports for customization
 * import { AppSelector, RoleSelector } from '@/components/ui/user-app-roles';
 * ```
 * 
 * @version 1.0.0
 * @author DreamFactory Platform Team
 */

// =============================================================================
// MAIN COMPONENT EXPORTS
// =============================================================================

// Default export for the main component
export { default } from './user-app-roles';

// Named export for the main component (supporting both import patterns)
export { default as UserAppRoles } from './user-app-roles';

// Sub-component exports for customization and composition
export {
  AccessibleButton,
  AppSelector,
  RoleSelector,
} from './user-app-roles';

// =============================================================================
// TYPE-ONLY EXPORTS
// =============================================================================

// Core data types
export type {
  AppType,
  RoleType,
  UserAppRoleAssignment,
  UserAppRolesFormData,
} from './user-app-roles.types';

// Form integration types
export type {
  AppRoleFieldRegistration,
  UserAppRoleAssignmentValidation,
  UserAppRolesFormValidation,
  ValidationErrors,
} from './user-app-roles.types';

// Component configuration types
export type {
  ThemeConfiguration,
  AccessibilityProps,
  InternationalizationProps,
  EventHandlers,
  DataSourceConfiguration,
  SearchConfiguration,
  UserAppRolesProps,
} from './user-app-roles.types';

// Sub-component prop types
export type {
  AppSelectorProps,
  RoleSelectorProps,
  AssignmentItemProps,
  AddButtonProps,
  RemoveButtonProps,
} from './user-app-roles.types';

// Utility types
export type {
  FormMode,
  ComponentState,
  UseUserAppRolesReturn,
} from './user-app-roles.types';

// =============================================================================
// VALIDATION SCHEMA EXPORTS
// =============================================================================

// Zod validation schemas for runtime validation
export {
  UserAppRoleAssignmentSchema,
  UserAppRolesFormSchema,
} from './user-app-roles.types';

// =============================================================================
// UTILITY FUNCTION EXPORTS
// =============================================================================

// Type guard functions for runtime type checking
export {
  isAppType,
  isRoleType,
  isUserAppRoleAssignment,
} from './user-app-roles.types';

// =============================================================================
// RE-EXPORTS FOR CONVENIENCE
// =============================================================================

// Re-export commonly used types from the main component for backward compatibility
export type {
  UserAppRolesProps as Props,
  UserAppRoleAssignment as Assignment,
  DataSourceConfiguration as DataSource,
  ValidationErrors as Errors,
} from './user-app-roles.types';