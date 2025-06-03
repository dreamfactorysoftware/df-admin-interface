/**
 * Shared Hooks Library - Barrel Export File
 * 
 * Centralized exports for all global custom React hooks that replace Angular services.
 * Provides clean imports throughout the application and supports tree-shaking optimization
 * for Turbopack build pipeline per Section 3.2.5 build system requirements.
 * 
 * This module exports hooks organized into logical categories:
 * - Authentication & Session Management
 * - User & Profile Management  
 * - System & Configuration
 * - Data Fetching & API Integration
 * - UI State & Theme Management
 * - Utility & Helper Hooks
 * 
 * All exports support ES modules tree-shaking for optimal bundle size and performance
 * in the Next.js 15.1+ build pipeline with Turbopack optimization.
 * 
 * @example
 * ```tsx
 * // Clean import patterns enabled by barrel exports
 * import { useAuth, useUser, useTheme } from '@/hooks';
 * 
 * // Tree-shaking optimization - only imported hooks are bundled
 * import { useAuth } from '@/hooks';
 * 
 * // Component composition patterns
 * function Dashboard() {
 *   const { user, isAuthenticated } = useAuth();
 *   const { theme, toggleTheme } = useTheme();
 *   const { notifications } = useNotifications();
 *   
 *   return (
 *     <div className={theme === 'dark' ? 'dark' : ''}>
 *       {isAuthenticated && <WelcomeMessage user={user} />}
 *     </div>
 *   );
 * }
 * ```
 */

// ============================================================================
// Authentication & Session Management Hooks
// ============================================================================

/**
 * Primary authentication hook with comprehensive login/logout workflows,
 * JWT token handling, and authentication state management.
 * Replaces Angular AuthService with React Query mutations and Zustand state.
 */
export { 
  useAuth, 
  AuthAPI, 
  authQueryKeys,
  default as useAuthDefault 
} from './use-auth';

/**
 * Session management hook for user sessions, token validation,
 * and automatic session refresh with Next.js middleware integration.
 */
export { 
  useSession,
  SessionAPI,
  SessionCookieManager,
  sessionQueryKeys
} from './use-session';

// ============================================================================
// User & Profile Management Hooks
// ============================================================================

/**
 * User data management hook providing profile operations, permission checking,
 * and user state synchronization with comprehensive CRUD capabilities.
 */
export { 
  useUser,
  UserHookError,
  userQueryKeys
} from './use-user';

// ============================================================================
// System & Configuration Hooks
// ============================================================================

/**
 * System configuration management hook for DreamFactory platform settings,
 * environment configuration, and feature flags with intelligent caching.
 */
export { 
  useSystemConfig,
  systemConfigQueryKeys
} from './use-system-config';

/**
 * Current service context hook for active database service management
 * and service-specific configuration state throughout the application.
 */
export { 
  useCurrentService,
  currentServiceQueryKeys
} from './use-current-service';

// ============================================================================
// Data Fetching & API Integration Hooks
// ============================================================================

/**
 * Core API client hook providing standardized HTTP operations,
 * request configuration, and response handling with React Query integration.
 * Replaces Angular DfBaseCrudService with modern data fetching patterns.
 */
export { 
  useApi,
  ApiError,
  apiQueryKeys
} from './use-api';

/**
 * Enhanced mutation hook for server state modifications with optimistic updates,
 * error handling, and cache invalidation strategies using React Query.
 */
export { 
  useMutation,
  MutationError,
  mutationQueryKeys
} from './use-mutation';

/**
 * File API operations hook for upload, download, and file management
 * with progress tracking and comprehensive error handling.
 */
export { 
  useFileApi,
  FileApiError,
  fileApiQueryKeys
} from './use-file-api';

// ============================================================================
// UI State & Theme Management Hooks
// ============================================================================

/**
 * Theme management hook for dark/light mode toggling, theme persistence,
 * and CSS variable integration with Tailwind CSS theming system.
 */
export { 
  useTheme,
  ThemeConfig,
  THEME_STORAGE_KEY
} from './use-theme';

/**
 * Loading state management hook for tracking application loading states,
 * providing centralized loading indicators with debouncing and conflict resolution.
 */
export { 
  useLoading,
  LoadingConfig,
  LoadingState
} from './use-loading';

/**
 * Notification system hook for displaying alerts, messages, and notifications
 * with queue management, auto-dismissal, and type-safe notification handling.
 */
export { 
  useNotifications,
  NotificationItem,
  NotificationConfig,
  NotificationType
} from './use-notifications';

/**
 * Error handling hook for centralized error management, error boundaries,
 * and consistent error display throughout the application.
 */
export { 
  useError,
  ErrorConfig,
  ErrorState
} from './use-error';

/**
 * Enhanced error handler hook for global error handling strategies,
 * error reporting, and recovery mechanisms with logging integration.
 */
export { 
  useErrorHandler,
  ErrorHandlerConfig,
  ErrorSeverity
} from './use-error-handler';

/**
 * Search functionality hook for global search operations, query management,
 * and search result caching with debounced input handling.
 */
export { 
  useSearch,
  SearchConfig,
  SearchResult
} from './use-search';

// ============================================================================
// Utility & Helper Hooks
// ============================================================================

/**
 * Local storage hook for client-side data persistence with type safety,
 * automatic serialization, and synchronization across browser tabs.
 */
export { 
  useLocalStorage,
  LocalStorageConfig,
  LocalStorageError
} from './use-local-storage';

/**
 * First-time user experience hook for onboarding workflows,
 * tutorial management, and guided user introduction features.
 */
export { 
  useFirstTimeUser,
  FirstTimeUserConfig,
  FirstTimeUserState
} from './use-first-time-user';

/**
 * License management hook for feature availability checking,
 * license validation, and enterprise feature access control.
 */
export { 
  useLicense,
  LicenseConfig,
  LicenseState
} from './use-license';

/**
 * Paywall management hook for premium feature access control,
 * subscription status checking, and upgrade flow management.
 */
export { 
  usePaywall,
  PaywallConfig,
  PaywallState
} from './use-paywall';

/**
 * Responsive design hook for breakpoint detection, media query matching,
 * and responsive component behavior with Tailwind CSS integration.
 */
export { 
  useBreakpoint,
  BreakpointConfig,
  BreakpointState
} from './use-breakpoint';

/**
 * Debouncing hook for input delay management, API call throttling,
 * and performance optimization with configurable delay strategies.
 */
export { 
  useDebounce,
  DebounceConfig
} from './use-debounce';

/**
 * Logging hook for application logging, debugging, and monitoring
 * with configurable log levels and structured logging capabilities.
 */
export { 
  useLogger,
  LoggerConfig,
  LogLevel
} from './use-logger';

// ============================================================================
// Type Re-exports for Convenience
// ============================================================================

/**
 * Common authentication types re-exported for convenience
 */
export type {
  LoginCredentials,
  LoginResponse,
  UserSession,
  AuthError,
  AuthErrorCode,
  UseAuthReturn
} from '@/types/auth';

/**
 * Common user types re-exported for convenience
 */
export type {
  UserProfile,
  AdminUser,
  UserPermissions,
  NotificationPreferences
} from '@/types/user';

/**
 * API client types re-exported for convenience
 */
export type {
  GenericSuccessResponse,
  GenericErrorResponse,
  GenericListResponse,
  RequestOptions
} from './use-api';

// ============================================================================
// Default Exports for Backward Compatibility
// ============================================================================

/**
 * Default export object containing all hooks for object destructuring patterns
 * Provides backward compatibility while maintaining tree-shaking support
 * 
 * @example
 * ```tsx
 * import hooks from '@/hooks';
 * const { useAuth, useTheme } = hooks;
 * ```
 */
const hooks = {
  // Authentication & Session
  useAuth,
  useSession,
  
  // User Management
  useUser,
  
  // System Configuration
  useSystemConfig,
  useCurrentService,
  
  // Data Fetching & API
  useApi,
  useMutation,
  useFileApi,
  
  // UI State & Theme
  useTheme,
  useLoading,
  useNotifications,
  useError,
  useErrorHandler,
  useSearch,
  
  // Utilities
  useLocalStorage,
  useFirstTimeUser,
  useLicense,
  usePaywall,
  useBreakpoint,
  useDebounce,
  useLogger,
} as const;

export default hooks;

// ============================================================================
// Hook Categories for Organized Imports
// ============================================================================

/**
 * Authentication-related hooks grouped for convenience
 * 
 * @example
 * ```tsx
 * import { authHooks } from '@/hooks';
 * const { useAuth, useSession } = authHooks;
 * ```
 */
export const authHooks = {
  useAuth,
  useSession,
} as const;

/**
 * User management hooks grouped for convenience
 */
export const userHooks = {
  useUser,
  useFirstTimeUser,
} as const;

/**
 * System configuration hooks grouped for convenience
 */
export const systemHooks = {
  useSystemConfig,
  useCurrentService,
  useLicense,
  usePaywall,
} as const;

/**
 * Data fetching and API hooks grouped for convenience
 */
export const apiHooks = {
  useApi,
  useMutation,
  useFileApi,
} as const;

/**
 * UI state management hooks grouped for convenience
 */
export const uiHooks = {
  useTheme,
  useLoading,
  useNotifications,
  useError,
  useErrorHandler,
  useSearch,
} as const;

/**
 * Utility hooks grouped for convenience
 */
export const utilityHooks = {
  useLocalStorage,
  useBreakpoint,
  useDebounce,
  useLogger,
} as const;

// ============================================================================
// Module Metadata for Development Tools
// ============================================================================

/**
 * Hook registry for development tools and debugging
 * Provides metadata about available hooks for tooling integration
 */
export const hookRegistry = {
  hooks: Object.keys(hooks),
  categories: {
    auth: Object.keys(authHooks),
    user: Object.keys(userHooks),
    system: Object.keys(systemHooks),
    api: Object.keys(apiHooks),
    ui: Object.keys(uiHooks),
    utility: Object.keys(utilityHooks),
  },
  total: Object.keys(hooks).length,
  version: '1.0.0',
  framework: 'React 19',
  buildSystem: 'Next.js 15.1 + Turbopack',
} as const;

/**
 * Type guard for hook validation in development
 * Helps ensure proper hook usage patterns
 */
export const isValidHook = (hookName: string): hookName is keyof typeof hooks => {
  return hookName in hooks;
};

/**
 * Hook dependency graph for build optimization
 * Maps hook dependencies for intelligent code splitting
 */
export const hookDependencies = {
  useAuth: ['useSession', 'useUser'],
  useUser: ['useLocalStorage', 'useApi'],
  useSystemConfig: ['useApi', 'useSession'],
  useCurrentService: ['useApi', 'useLocalStorage'],
  useTheme: ['useLocalStorage'],
  useNotifications: ['useDebounce'],
  useError: ['useLogger'],
  useErrorHandler: ['useError', 'useLogger'],
  useSearch: ['useDebounce', 'useApi'],
  useFileApi: ['useApi', 'useNotifications'],
  useMutation: ['useApi', 'useError'],
  // Add other dependencies as needed
} as const;