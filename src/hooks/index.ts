/**
 * Shared Hooks Library - Barrel Export Module
 * 
 * Centralized export hub for all custom React hooks used throughout the DreamFactory
 * Admin Interface. This barrel export file enables clean imports, supports tree-shaking
 * optimization with Turbopack, and provides a unified interface for consuming shared
 * functionality across the application.
 * 
 * Key Features:
 * - Tree-shaking optimization for Turbopack build pipeline
 * - TypeScript 5.8+ module system with comprehensive type exports
 * - React 19 compatible hook patterns with Next.js 15.1+ integration
 * - Clean import patterns supporting component composition architecture
 * - Centralized dependency management for all authentication, UI state, and data fetching hooks
 * 
 * Architecture Benefits:
 * - Eliminates relative import path complexity across components
 * - Enables consistent hook usage patterns throughout the application
 * - Supports build-time optimization through intelligent bundling
 * - Provides single source of truth for shared hook availability
 * - Facilitates refactoring and dependency management
 * 
 * Usage Examples:
 * ```typescript
 * // Clean imports for multiple hooks
 * import { useAuth, useTheme, useLoading } from '@/hooks';
 * 
 * // Tree-shaking friendly individual imports
 * import { useApi } from '@/hooks';
 * 
 * // Type imports for component development
 * import type { UseAuthReturn, LoadingState } from '@/hooks';
 * ```
 * 
 * @fileoverview Barrel export module for shared hooks library
 * @version 1.0.0
 * @since React 19.0.0, Next.js 15.1+, TypeScript 5.8+
 * @module hooks
 */

// =============================================================================
// AUTHENTICATION AND SESSION MANAGEMENT HOOKS
// =============================================================================

/**
 * Authentication and user session management hooks
 * Provides comprehensive auth state management, session validation, and user operations
 */
export {
  useAuth,
  useSession,
  useUser,
  // Named exports for authentication utilities
  AUTH_QUERY_KEYS,
  AUTH_MUTATION_KEYS,
  createAuthError,
  parseHttpError,
  // Type exports for authentication
  type UseAuthReturn,
  type AuthState,
  type AuthActions,
  type AuthStore,
  type UseAuthConfig,
  type UseSessionReturn,
  type SessionData,
  type SessionUser,
  type UseSessionOptions,
} from './use-auth';

// Re-export session hook with additional exports
export {
  type SessionToken,
  type UserRole,
  type RoleServiceAccess,
  type SessionValidationResponse,
  type SessionRefreshResponse,
  type SessionLoginRequest,
  type SessionLoginResponse,
} from './use-session';

// Re-export user management hook with types
export {
  type UserProfile,
  type AdminProfile,
  type UserParams,
  type UpdatePasswordRequest,
  type UpdatePasswordResponse,
  type UserProfileFormData,
  type UserProfileSchema,
  type UserAction,
  type SessionValidationResult,
  type SessionError,
} from './use-user';

// =============================================================================
// SYSTEM CONFIGURATION AND STATE HOOKS
// =============================================================================

/**
 * System configuration and application state management hooks
 * Handles global system settings, current service state, and configuration management
 */
export {
  useSystemConfig,
  useCurrentService,
  // Type exports for system configuration
  type SystemConfig,
  type SystemConfigUpdate,
  type UseSystemConfigReturn,
  type ServiceConfig,
  type UseCurrentServiceReturn,
} from './use-system-config';

export {
  type DatabaseService,
  type ServiceType,
  type ConnectionStatus,
  type ServiceValidation,
} from './use-current-service';

// =============================================================================
// UI STATE AND THEME MANAGEMENT HOOKS
// =============================================================================

/**
 * UI state management hooks for theme, loading states, and notifications
 * Provides comprehensive UI state coordination and user interface management
 */
export {
  useTheme,
  useSimpleTheme,
  useThemeStyles,
  // Type exports for theme management
  type UseThemeReturn,
  type PaginationPreferences,
  type ThemeMode,
  type ResolvedTheme,
  type ThemeUtils,
  type ThemeCSSProperties,
  type ThemeTransition,
  type SystemThemeConfig,
} from './use-theme';

export {
  useLoading,
  useGlobalLoading,
  useApiLoading,
  useImmediateLoading,
  withLoading,
  // Type exports for loading management
  type LoadingConfig,
  type LoadingState,
  type LoadingOperation,
  type UseLoadingReturn,
} from './use-loading';

export {
  useNotifications,
  // Type exports for notifications
  type NotificationLevel,
  type NotificationConfig,
  type NotificationState,
  type UseNotificationsReturn,
} from './use-notifications';

// =============================================================================
// DATA FETCHING AND API MANAGEMENT HOOKS
// =============================================================================

/**
 * Data fetching and API management hooks
 * Provides comprehensive HTTP client functionality, mutations, and API abstractions
 */
export {
  useApi,
  // Type exports for API management
  type ApiRequestOptions,
  type FileUploadOptions,
  type FileDownloadOptions,
} from './use-api';

export {
  useMutation,
  // Type exports for mutation management
  type MutationConfig,
  type MutationState,
  type UseMutationReturn,
} from './use-mutation';

export {
  useFileApi,
  // Type exports for file operations
  type FileApiConfig,
  type FileOperation,
  type UseFileApiReturn,
} from './use-file-api';

// =============================================================================
// ERROR HANDLING AND LOGGING HOOKS
// =============================================================================

/**
 * Error handling and logging hooks
 * Provides comprehensive error management, logging, and debugging capabilities
 */
export {
  useError,
  useErrorHandler,
  // Type exports for error management
  type ErrorState,
  type ErrorHandler,
  type UseErrorReturn,
  type UseErrorHandlerReturn,
} from './use-error';

export {
  useErrorHandler as useErrorHandlerAlias,
  // Additional error handling types
  type ErrorContext,
  type ErrorSeverity,
  type ErrorReporting,
} from './use-error-handler';

export {
  useLogger,
  // Type exports for logging
  type LogLevel,
  type LogEntry,
  type LoggerConfig,
  type UseLoggerReturn,
} from './use-logger';

// =============================================================================
// UTILITY AND BROWSER INTEGRATION HOOKS
// =============================================================================

/**
 * Utility hooks for browser integration and common functionality
 * Provides localStorage management, responsive design, debouncing, and search capabilities
 */
export {
  useLocalStorage,
  // Type exports for local storage
  type LocalStorageOptions,
  type LocalStorageState,
  type UseLocalStorageReturn,
} from './use-local-storage';

export {
  useBreakpoint,
  // Type exports for responsive design
  type BreakpointConfig,
  type BreakpointState,
  type UseBreakpointReturn,
} from './use-breakpoint';

export {
  useDebounce,
  // Type exports for debouncing
  type DebounceConfig,
  type UseDebounceReturn,
} from './use-debounce';

export {
  useSearch,
  // Type exports for search functionality
  type SearchConfig,
  type SearchState,
  type SearchResults,
  type UseSearchReturn,
} from './use-search';

// =============================================================================
// APPLICATION LIFECYCLE AND BUSINESS LOGIC HOOKS
// =============================================================================

/**
 * Application lifecycle and business logic hooks
 * Handles first-time user experience, licensing, and paywall functionality
 */
export {
  useFirstTimeUser,
  // Type exports for first-time user management
  type FirstTimeUserState,
  type OnboardingStep,
  type UseFirstTimeUserReturn,
} from './use-first-time-user';

export {
  useLicense,
  // Type exports for license management
  type LicenseState,
  type LicenseInfo,
  type UseLicenseReturn,
} from './use-license';

export {
  usePaywall,
  // Type exports for paywall functionality
  type PaywallState,
  type PaywallConfig,
  type UsePaywallReturn,
} from './use-paywall';

// =============================================================================
// ADDITIONAL TYPE EXPORTS FOR CROSS-CUTTING CONCERNS
// =============================================================================

/**
 * Cross-cutting type definitions used across multiple hooks
 * Provides shared interfaces for consistent typing throughout the application
 */

// Generic API types used across hooks
export type {
  GenericListResponse,
  GenericSuccessResponse,
  GenericCreateResponse,
  GenericUpdateResponse,
  RequestOptions,
  KeyValuePair,
} from '../types/generic-http';

// Authentication and authorization types
export type {
  LoginCredentials,
  LoginResponse,
  RegisterDetails,
  AuthError,
  AuthErrorCode,
  ForgetPasswordRequest,
  OAuthLoginRequest,
  SAMLAuthParams,
} from '../types/auth';

// Theme and UI types
export type {
  DEFAULT_THEME_CONFIG,
  THEME_CONSTANTS,
} from '../types/theme';

// =============================================================================
// DEFAULT EXPORTS
// =============================================================================

/**
 * Default export providing the most commonly used hooks as a convenience
 * Enables import patterns like: import hooks from '@/hooks'
 */
export default {
  // Most commonly used hooks
  useAuth,
  useSession,
  useUser,
  useTheme,
  useLoading,
  useApi,
  useNotifications,
  useError,
  useLocalStorage,
  useSystemConfig,
  useCurrentService,
  
  // Utility hooks
  useDebounce,
  useBreakpoint,
  useSearch,
  
  // Business logic hooks
  useLicense,
  usePaywall,
  useFirstTimeUser,
} as const;

// =============================================================================
// HOOK CATEGORIES FOR ORGANIZED IMPORTS
// =============================================================================

/**
 * Categorized hook exports for organized imports and better code organization
 * Enables import patterns like: import { auth } from '@/hooks'; auth.useAuth()
 */
export const auth = {
  useAuth,
  useSession,
  useUser,
} as const;

export const ui = {
  useTheme,
  useSimpleTheme,
  useThemeStyles,
  useLoading,
  useGlobalLoading,
  useApiLoading,
  useImmediateLoading,
  useNotifications,
  useBreakpoint,
} as const;

export const api = {
  useApi,
  useMutation,
  useFileApi,
} as const;

export const system = {
  useSystemConfig,
  useCurrentService,
  useError,
  useErrorHandler,
  useLogger,
} as const;

export const utils = {
  useLocalStorage,
  useDebounce,
  useSearch,
} as const;

export const business = {
  useLicense,
  usePaywall,
  useFirstTimeUser,
} as const;

// =============================================================================
// PERFORMANCE OPTIMIZATION HELPERS
// =============================================================================

/**
 * Performance optimization exports for build-time tree shaking
 * These constants help bundlers understand which exports are used
 */
export const HOOK_NAMES = [
  'useAuth',
  'useSession',
  'useUser',
  'useSystemConfig',
  'useCurrentService',
  'useTheme',
  'useLoading',
  'useNotifications',
  'useApi',
  'useMutation',
  'useFileApi',
  'useError',
  'useErrorHandler',
  'useLogger',
  'useLocalStorage',
  'useBreakpoint',
  'useDebounce',
  'useSearch',
  'useFirstTimeUser',
  'useLicense',
  'usePaywall',
] as const;

export const HOOK_CATEGORIES = [
  'auth',
  'ui', 
  'api',
  'system',
  'utils',
  'business',
] as const;

/**
 * Type-only exports for improved TypeScript performance
 * Enables import type { } patterns for better build optimization
 */
export type HookName = (typeof HOOK_NAMES)[number];
export type HookCategory = (typeof HOOK_CATEGORIES)[number];

// =============================================================================
// JSDOC METADATA FOR DOCUMENTATION
// =============================================================================

/**
 * @fileoverview This barrel export module provides centralized access to all custom React hooks
 * used throughout the DreamFactory Admin Interface. It supports tree-shaking optimization,
 * TypeScript 5.8+ module patterns, and React 19 compatibility with Next.js 15.1+.
 * 
 * @example Import individual hooks
 * ```typescript
 * import { useAuth, useTheme } from '@/hooks';
 * ```
 * 
 * @example Import hook categories
 * ```typescript
 * import { auth, ui } from '@/hooks';
 * const { user } = auth.useAuth();
 * const { theme } = ui.useTheme();
 * ```
 * 
 * @example Import types only
 * ```typescript
 * import type { UseAuthReturn, LoadingState } from '@/hooks';
 * ```
 * 
 * @see {@link https://react.dev/reference/react/hooks} React Hooks Documentation
 * @see {@link https://nextjs.org/docs/app/building-your-application/optimizing/bundle-analyzer} Next.js Bundle Optimization
 * @see {@link https://turbo.build/pack/docs/features/tree-shaking} Turbopack Tree Shaking
 */