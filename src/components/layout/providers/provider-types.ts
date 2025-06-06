/**
 * Provider Type Definitions for DreamFactory Admin Interface
 * 
 * Comprehensive TypeScript type definitions for all React context providers in the
 * refactored DreamFactory Admin Interface. Provides type safety for authentication,
 * theme management, notifications, and error handling contexts with React 19 and
 * TypeScript 5.8+ enhanced support.
 * 
 * Key Features:
 * - React 19 compatible context typing with enhanced inference
 * - TypeScript 5.8+ generic type support for reusable provider patterns
 * - Strict type definitions for all provider context values and actions
 * - Integration with Zustand state types for consistent state management
 * - Provider props typing with optional configuration and default handling
 * - WCAG 2.1 AA accessibility compliance types
 * - Next.js 15.1 middleware integration patterns
 * 
 * @fileoverview Provider types for React context system
 * @version 1.0.0
 * @since React 19.0.0 / Next.js 15.1+ / TypeScript 5.8+
 */

import React, { ReactNode } from 'react';
import type {
  UserProfile,
  AdminProfile,
  UserSession,
  LoginCredentials,
  LoginResponse,
  RegisterDetails,
  ForgetPasswordRequest,
  ResetFormData,
  UpdatePasswordRequest,
  PermissionCheckResult,
  RouteProtection,
  RoleType,
  SystemPermission,
  UserAction,
} from '@/types/user';
import type {
  ThemeMode,
  ResolvedTheme,
  ThemeContextState,
  ThemeProviderConfig,
  UseThemeReturn,
  ThemeUtils,
  ThemeStorage,
  ThemeTransition,
  SystemThemeConfig,
} from '@/types/theme';
import type {
  Notification,
  NotificationConfig,
  NotificationQueueConfig,
  NotificationQueueState,
  UseNotificationsReturn,
  NotificationContextValue,
  NotificationEventHandlers,
  NotificationPersistence,
  DfSnackbarCompatibility,
  NotificationServiceCompatibility,
} from '@/types/notification';
import type {
  AppError,
  ErrorType,
  ErrorSeverity,
  ErrorCategory,
  BaseError,
  NetworkError,
  ValidationError,
  AuthenticationError,
  AuthorizationError,
  ServerError,
  ClientError,
  SystemError,
  ErrorContext,
  ErrorReportingOptions,
  RetryConfig,
  CircuitBreakerConfig,
  CircuitBreakerState,
  RecoveryAction,
  UserFriendlyErrorMessage,
  ErrorRecoveryOptions,
  ErrorBoundaryInfo,
  ErrorMetrics,
  ErrorHandlerConfig,
  UseErrorHandlerReturn,
} from '@/types/error';

// ============================================================================
// CORE PROVIDER INTERFACES
// ============================================================================

/**
 * Generic provider props interface for reusable patterns
 * Supports composition and optional configuration across all providers
 */
export interface BaseProviderProps<TConfig = Record<string, unknown>> {
  /** Child components to wrap with provider */
  children: ReactNode;
  
  /** Optional configuration for provider behavior */
  config?: Partial<TConfig>;
  
  /** Optional default values to override built-in defaults */
  defaultValues?: Partial<TConfig>;
  
  /** Whether to enable debug mode for development */
  debug?: boolean;
  
  /** Unique identifier for provider instance (useful for testing) */
  id?: string;
}

/**
 * Generic context value interface with common provider patterns
 * Ensures consistency across all provider implementations
 */
export interface BaseContextValue<TState = unknown, TActions = unknown> {
  /** Current state managed by the provider */
  state: TState;
  
  /** Available actions for state mutations */
  actions: TActions;
  
  /** Whether the provider is initialized and ready */
  isInitialized: boolean;
  
  /** Loading state for async operations */
  isLoading: boolean;
  
  /** Error state if provider initialization failed */
  error: AppError | null;
  
  /** Provider configuration settings */
  config: Record<string, unknown>;
  
  /** Debug information for development */
  debug?: {
    lastUpdate: string;
    renderCount: number;
    subscribers: number;
  };
}

/**
 * Provider composition interface for nested provider configurations
 * Enables complex provider hierarchies with dependency injection
 */
export interface ProviderComposition {
  /** Provider component constructor */
  Provider: React.ComponentType<any>;
  
  /** Provider-specific props */
  props?: Record<string, unknown>;
  
  /** Dependencies this provider requires */
  dependencies?: string[];
  
  /** Priority for provider initialization order */
  priority?: number;
}

// ============================================================================
// AUTHENTICATION CONTEXT TYPES
// ============================================================================

/**
 * Authentication state managed by AuthProvider
 */
export interface AuthState {
  /** Current authenticated user profile */
  user: UserProfile | AdminProfile | null;
  
  /** Active user session information */
  session: UserSession | null;
  
  /** Whether user is currently authenticated */
  isAuthenticated: boolean;
  
  /** Authentication loading states */
  loading: {
    /** Global authentication loading */
    isLoading: boolean;
    /** Login process loading */
    isLoggingIn: boolean;
    /** Logout process loading */
    isLoggingOut: boolean;
    /** Session refresh loading */
    isRefreshing: boolean;
    /** Registration process loading */
    isRegistering: boolean;
    /** Password reset loading */
    isResettingPassword: boolean;
  };
  
  /** User permissions and roles */
  permissions: {
    /** Array of permission strings */
    list: string[];
    /** Array of user roles */
    roles: RoleType[];
    /** System-level permissions */
    system: SystemPermission[];
    /** Accessible routes for navigation */
    accessibleRoutes: string[];
    /** Restricted routes for security */
    restrictedRoutes: string[];
  };
  
  /** Session metadata */
  sessionMeta: {
    /** Session expiration timestamp */
    expiresAt: string | null;
    /** Last activity timestamp */
    lastActivity: string | null;
    /** Token version for security */
    tokenVersion: number | null;
    /** Whether session needs refresh */
    requiresRefresh: boolean;
  };
  
  /** Error states for different auth operations */
  errors: {
    /** General authentication error */
    auth: AppError | null;
    /** Login-specific error */
    login: AppError | null;
    /** Registration-specific error */
    registration: AppError | null;
    /** Password reset error */
    passwordReset: AppError | null;
    /** Session refresh error */
    sessionRefresh: AppError | null;
  };
}

/**
 * Authentication actions available through AuthProvider
 */
export interface AuthActions {
  // =============== Core Authentication Operations ===============
  
  /** 
   * Authenticate user with credentials 
   * @param credentials - User login credentials
   * @param options - Additional login options
   */
  login: (
    credentials: LoginCredentials,
    options?: {
      redirectTo?: string;
      rememberSession?: boolean;
      validateDevice?: boolean;
    }
  ) => Promise<LoginResponse>;
  
  /** 
   * Log out current user and clear session 
   * @param options - Logout configuration
   */
  logout: (options?: {
    clearAllSessions?: boolean;
    redirectTo?: string;
    reason?: 'user_initiated' | 'session_expired' | 'security_logout';
  }) => Promise<void>;
  
  /** 
   * Register new user account 
   * @param details - User registration information
   */
  register: (details: RegisterDetails) => Promise<LoginResponse>;
  
  // =============== Session Management ===============
  
  /** 
   * Refresh current session token 
   * @param force - Whether to force refresh even if not needed
   */
  refreshSession: (force?: boolean) => Promise<UserSession>;
  
  /** 
   * Validate current session status 
   */
  validateSession: () => Promise<boolean>;
  
  /** 
   * Clear current session without logout 
   */
  clearSession: () => void;
  
  // =============== Password Management ===============
  
  /** 
   * Request password reset email 
   * @param request - Password reset request data
   */
  requestPasswordReset: (request: ForgetPasswordRequest) => Promise<void>;
  
  /** 
   * Reset password with reset token 
   * @param resetData - Password reset form data
   */
  resetPassword: (resetData: ResetFormData) => Promise<void>;
  
  /** 
   * Update current user password 
   * @param passwordData - Password update information
   */
  updatePassword: (passwordData: UpdatePasswordRequest) => Promise<void>;
  
  // =============== User Profile Management ===============
  
  /** 
   * Update current user profile 
   * @param updates - Profile fields to update
   */
  updateProfile: (updates: Partial<UserProfile>) => Promise<UserProfile>;
  
  /** 
   * Reload user profile from server 
   */
  reloadProfile: () => Promise<UserProfile>;
  
  // =============== Permission and Role Management ===============
  
  /** 
   * Check if user has specific permission 
   * @param permission - Permission string to check
   * @param resource - Optional resource context
   */
  hasPermission: (permission: string, resource?: string) => boolean;
  
  /** 
   * Check if user has any of the specified permissions 
   * @param permissions - Array of permission strings
   */
  hasAnyPermission: (permissions: string[]) => boolean;
  
  /** 
   * Check if user has all specified permissions 
   * @param permissions - Array of permission strings
   */
  hasAllPermissions: (permissions: string[]) => boolean;
  
  /** 
   * Check if user has specific role 
   * @param role - Role name to check
   */
  hasRole: (role: string) => boolean;
  
  /** 
   * Get permission check result with details 
   * @param permission - Permission to check
   * @param resource - Optional resource context
   */
  checkPermission: (permission: string, resource?: string) => PermissionCheckResult;
  
  /** 
   * Check if user can perform action on resource 
   * @param action - Action to perform
   * @param resource - Resource to act upon
   */
  canPerformAction: (action: UserAction, resource?: string) => boolean;
  
  // =============== Route Protection ===============
  
  /** 
   * Check if user can access route 
   * @param route - Route path to check
   */
  canAccessRoute: (route: string) => boolean;
  
  /** 
   * Get route protection configuration 
   * @param route - Route path
   */
  getRouteProtection: (route: string) => RouteProtection | null;
  
  // =============== Error Handling ===============
  
  /** 
   * Clear specific authentication error 
   * @param errorType - Type of error to clear
   */
  clearError: (errorType?: keyof AuthState['errors']) => void;
  
  /** 
   * Clear all authentication errors 
   */
  clearAllErrors: () => void;
  
  // =============== State Management ===============
  
  /** 
   * Reset authentication state to initial values 
   */
  resetState: () => void;
  
  /** 
   * Set authentication loading state 
   * @param loadingType - Type of loading to set
   * @param isLoading - Loading state value
   */
  setLoading: (loadingType: keyof AuthState['loading'], isLoading: boolean) => void;
}

/**
 * Authentication provider configuration
 */
export interface AuthProviderConfig {
  /** API endpoints configuration */
  endpoints: {
    login: string;
    logout: string;
    register: string;
    refresh: string;
    profile: string;
    resetPassword: string;
    requestReset: string;
  };
  
  /** Session management configuration */
  session: {
    /** Session storage key */
    storageKey: string;
    /** Session refresh threshold (minutes before expiry) */
    refreshThreshold: number;
    /** Auto refresh interval in minutes */
    autoRefreshInterval: number;
    /** Whether to clear session on tab close */
    clearOnClose: boolean;
  };
  
  /** Security configuration */
  security: {
    /** Token encryption enabled */
    encryptTokens: boolean;
    /** CSRF protection enabled */
    csrfProtection: boolean;
    /** Device fingerprinting enabled */
    deviceFingerprinting: boolean;
    /** Session timeout in minutes */
    sessionTimeout: number;
  };
  
  /** Route protection defaults */
  routing: {
    /** Default redirect after login */
    defaultLoginRedirect: string;
    /** Default redirect after logout */
    defaultLogoutRedirect: string;
    /** Protected routes configuration */
    protectedRoutes: RouteProtection[];
  };
  
  /** Permission system configuration */
  permissions: {
    /** Whether to cache permission results */
    cacheResults: boolean;
    /** Permission cache TTL in minutes */
    cacheTTL: number;
    /** Whether to check permissions server-side */
    serverSideValidation: boolean;
  };
}

/**
 * Authentication context value interface
 */
export interface AuthContextValue extends BaseContextValue<AuthState, AuthActions> {
  /** Current authentication state */
  state: AuthState;
  
  /** Available authentication actions */
  actions: AuthActions;
  
  /** Provider configuration */
  config: AuthProviderConfig;
  
  /** Convenience getters for common auth checks */
  isAuthenticated: boolean;
  isLoading: boolean;
  currentUser: UserProfile | AdminProfile | null;
  userPermissions: string[];
  userRoles: RoleType[];
}

/**
 * Authentication provider props
 */
export interface AuthProviderProps extends BaseProviderProps<AuthProviderConfig> {
  /** Initial authentication state */
  initialState?: Partial<AuthState>;
  
  /** Authentication event handlers */
  onLogin?: (user: UserProfile, session: UserSession) => void;
  onLogout?: (reason?: string) => void;
  onSessionExpired?: () => void;
  onAuthError?: (error: AppError) => void;
  
  /** Custom authentication storage */
  storage?: {
    getItem: (key: string) => string | null;
    setItem: (key: string, value: string) => void;
    removeItem: (key: string) => void;
  };
}

// ============================================================================
// THEME CONTEXT TYPES
// ============================================================================

/**
 * Theme state managed by ThemeProvider
 */
export interface ThemeState extends ThemeContextState {
  /** Current theme mode setting */
  theme: ThemeMode;
  
  /** Resolved theme after system detection */
  resolvedTheme: ResolvedTheme;
  
  /** System detected theme preference */
  systemTheme: ResolvedTheme;
  
  /** Whether theme system is mounted */
  mounted: boolean;
  
  /** Theme transition configuration */
  transitions: ThemeTransition;
  
  /** Accessibility preferences */
  accessibility: {
    /** Reduced motion preference */
    prefersReducedMotion: boolean;
    /** High contrast preference */
    prefersHighContrast: boolean;
    /** Color scheme preference override */
    colorSchemeOverride: ResolvedTheme | null;
  };
  
  /** Theme persistence state */
  persistence: {
    /** Whether theme is stored */
    isStored: boolean;
    /** Storage method used */
    storageMethod: 'localStorage' | 'sessionStorage' | 'cookie' | 'none';
    /** Last sync timestamp */
    lastSync: string | null;
  };
}

/**
 * Theme actions available through ThemeProvider
 */
export interface ThemeActions {
  /** Set theme mode */
  setTheme: (theme: ThemeMode) => void;
  
  /** Toggle between light and dark themes */
  toggleTheme: () => void;
  
  /** Reset theme to system preference */
  resetToSystem: () => void;
  
  /** Update theme configuration */
  updateConfig: (config: Partial<ThemeProviderConfig>) => void;
  
  /** Set accessibility preferences */
  setAccessibilityPreferences: (preferences: Partial<ThemeState['accessibility']>) => void;
  
  /** Force theme refresh from system */
  refreshSystemTheme: () => void;
  
  /** Clear stored theme preference */
  clearStoredTheme: () => void;
  
  /** Check if theme mode is supported */
  isThemeSupported: (theme: ThemeMode) => boolean;
  
  /** Get theme-appropriate colors */
  getThemeColors: (theme?: ResolvedTheme) => Record<string, string>;
  
  /** Apply custom theme properties */
  applyCustomTheme: (properties: Record<string, string>) => void;
}

/**
 * Enhanced theme context value with utilities
 */
export interface ThemeContextValue extends BaseContextValue<ThemeState, ThemeActions>, UseThemeReturn {
  /** Current theme state */
  state: ThemeState;
  
  /** Available theme actions */
  actions: ThemeActions;
  
  /** Theme utilities */
  utils: ThemeUtils;
  
  /** Theme storage interface */
  storage: ThemeStorage;
  
  /** Provider configuration */
  config: ThemeProviderConfig;
}

/**
 * Theme provider props
 */
export interface ThemeProviderProps extends BaseProviderProps<ThemeProviderConfig> {
  /** Initial theme state */
  initialState?: Partial<ThemeState>;
  
  /** Theme change event handlers */
  onThemeChange?: (theme: ThemeMode, resolvedTheme: ResolvedTheme) => void;
  onSystemThemeChange?: (systemTheme: ResolvedTheme) => void;
  
  /** Custom theme storage implementation */
  storage?: ThemeStorage;
  
  /** System theme detection configuration */
  systemConfig?: SystemThemeConfig;
  
  /** Force server-side rendering mode */
  forceSSR?: boolean;
}

// ============================================================================
// NOTIFICATION CONTEXT TYPES
// ============================================================================

/**
 * Notification state managed by NotificationProvider
 */
export interface NotificationState extends NotificationQueueState {
  /** Array of active notifications */
  notifications: Notification[];
  
  /** Queue configuration */
  config: NotificationQueueConfig;
  
  /** Whether notifications are paused */
  paused: boolean;
  
  /** Edit page persistence state */
  persistence: {
    /** Whether current page is edit page */
    isEditPage: boolean;
    /** Last element ID for edit page */
    lastElementId: string | null;
    /** Stored notifications for page restore */
    storedNotifications: Notification[];
  };
  
  /** Notification metrics */
  metrics: {
    /** Total notifications shown */
    totalShown: number;
    /** Total notifications dismissed */
    totalDismissed: number;
    /** Total notifications expired */
    totalExpired: number;
    /** Average display duration */
    averageDisplayDuration: number;
  };
  
  /** Accessibility state */
  accessibility: {
    /** Whether screen reader announcements are enabled */
    announceToScreenReader: boolean;
    /** Current focus management mode */
    focusManagement: 'none' | 'notification' | 'action';
    /** Keyboard navigation enabled */
    keyboardNavigation: boolean;
  };
}

/**
 * Notification actions available through NotificationProvider
 */
export interface NotificationActions {
  /** Show a notification */
  notify: (config: NotificationConfig) => string;
  
  /** Show success notification */
  success: (message: string, options?: Partial<NotificationConfig>) => string;
  
  /** Show error notification */
  error: (message: string, options?: Partial<NotificationConfig>) => string;
  
  /** Show warning notification */
  warning: (message: string, options?: Partial<NotificationConfig>) => string;
  
  /** Show info notification */
  info: (message: string, options?: Partial<NotificationConfig>) => string;
  
  /** Dismiss specific notification */
  dismiss: (id: string) => void;
  
  /** Dismiss all notifications */
  dismissAll: () => void;
  
  /** Pause auto-dismissal */
  pause: () => void;
  
  /** Resume auto-dismissal */
  resume: () => void;
  
  /** Update notification content */
  update: (id: string, updates: Partial<NotificationConfig>) => void;
  
  /** Set edit page state */
  setEditPageState: (isEditPage: boolean, elementId?: string) => void;
  
  /** Restore notifications for edit page */
  restoreNotifications: () => void;
  
  /** Clear stored notifications */
  clearStoredNotifications: () => void;
  
  /** Update queue configuration */
  updateConfig: (config: Partial<NotificationQueueConfig>) => void;
  
  /** Set accessibility preferences */
  setAccessibilityPreferences: (preferences: Partial<NotificationState['accessibility']>) => void;
  
  /** Get notification by ID */
  getNotification: (id: string) => Notification | null;
  
  /** Get notifications by type */
  getNotificationsByType: (type: string) => Notification[];
}

/**
 * Enhanced notification context value
 */
export interface NotificationContextValue extends BaseContextValue<NotificationState, NotificationActions>, UseNotificationsReturn {
  /** Current notification state */
  state: NotificationState;
  
  /** Available notification actions */
  actions: NotificationActions;
  
  /** Provider configuration */
  config: NotificationQueueConfig;
  
  /** Angular compatibility layer */
  compatibility: {
    /** DfSnackbar service compatibility */
    dfSnackbar: DfSnackbarCompatibility;
    /** Notification service compatibility */
    notificationService: NotificationServiceCompatibility;
  };
}

/**
 * Notification provider props
 */
export interface NotificationProviderProps extends BaseProviderProps<NotificationQueueConfig> {
  /** Initial notification state */
  initialState?: Partial<NotificationState>;
  
  /** Notification event handlers */
  eventHandlers?: NotificationEventHandlers;
  
  /** Persistence configuration */
  persistence?: NotificationPersistence;
  
  /** Angular compatibility mode */
  enableCompatibilityMode?: boolean;
  
  /** Custom notification components */
  customComponents?: {
    Toast?: React.ComponentType<{ notification: Notification }>;
    Banner?: React.ComponentType<{ notification: Notification }>;
    Modal?: React.ComponentType<{ notification: Notification }>;
  };
}

// ============================================================================
// ERROR CONTEXT TYPES
// ============================================================================

/**
 * Error state managed by ErrorProvider
 */
export interface ErrorState {
  /** Active application errors */
  activeErrors: AppError[];
  
  /** Error handler configuration */
  config: ErrorHandlerConfig;
  
  /** Circuit breaker state */
  circuitBreaker: {
    /** Current state */
    state: CircuitBreakerState;
    /** Failure count */
    failureCount: number;
    /** Last failure timestamp */
    lastFailure: string | null;
    /** Next retry timestamp */
    nextRetry: string | null;
  };
  
  /** Retry mechanism state */
  retryState: {
    /** Active retry operations */
    activeRetries: Record<string, {
      attempt: number;
      nextAttempt: string;
      config: RetryConfig;
    }>;
    /** Retry history */
    retryHistory: Array<{
      operationId: string;
      attempts: number;
      success: boolean;
      duration: number;
    }>;
  };
  
  /** Error metrics */
  metrics: ErrorMetrics;
  
  /** Error reporting state */
  reporting: {
    /** Whether reporting is enabled */
    enabled: boolean;
    /** Queue of errors to report */
    queue: Array<{ error: AppError; context: ErrorContext }>;
    /** Last successful report timestamp */
    lastReport: string | null;
    /** Failed report count */
    failedReports: number;
  };
  
  /** Recovery state */
  recovery: {
    /** Available recovery actions */
    availableActions: Record<string, RecoveryAction[]>;
    /** Recovery attempt history */
    recoveryHistory: Array<{
      errorId: string;
      action: RecoveryAction;
      success: boolean;
      timestamp: string;
    }>;
  };
}

/**
 * Error actions available through ErrorProvider
 */
export interface ErrorActions {
  /** Handle any error with comprehensive processing */
  handleError: (
    error: any,
    options?: Partial<ErrorRecoveryOptions>
  ) => Promise<UserFriendlyErrorMessage>;
  
  /** Report error to monitoring service */
  reportError: (
    error: AppError,
    context?: Partial<ErrorContext>
  ) => Promise<void>;
  
  /** Retry operation with backoff */
  retryWithBackoff: <T>(
    operation: () => Promise<T>,
    operationId: string,
    options?: Partial<RetryConfig>
  ) => Promise<T>;
  
  /** Recover from specific error */
  recoverFromError: (
    errorId: string,
    action: RecoveryAction
  ) => Promise<boolean>;
  
  /** Clear specific error */
  clearError: (errorId: string) => void;
  
  /** Clear all errors */
  clearAllErrors: () => void;
  
  /** Reset circuit breaker */
  resetCircuitBreaker: () => void;
  
  /** Update error handler configuration */
  updateConfig: (config: Partial<ErrorHandlerConfig>) => void;
  
  /** Create error boundary component */
  createErrorBoundary: (
    fallbackComponent?: React.ComponentType<ErrorBoundaryInfo>
  ) => React.ComponentType<React.PropsWithChildren<{}>>;
  
  /** Get user-friendly error message */
  getUserFriendlyMessage: (error: AppError) => UserFriendlyErrorMessage;
  
  /** Get recovery actions for error */
  getRecoveryActions: (error: AppError) => RecoveryAction[];
  
  /** Get error metrics */
  getMetrics: () => ErrorMetrics;
  
  /** Get circuit breaker state */
  getCircuitBreakerState: () => CircuitBreakerState;
  
  /** Check if operation should be retried */
  shouldRetry: (error: AppError, attempt: number) => boolean;
  
  /** Collect error context */
  collectErrorContext: () => ErrorContext;
  
  /** Sanitize error for production */
  sanitizeError: (error: AppError) => AppError;
}

/**
 * Enhanced error context value
 */
export interface ErrorContextValue extends BaseContextValue<ErrorState, ErrorActions>, UseErrorHandlerReturn {
  /** Current error state */
  state: ErrorState;
  
  /** Available error actions */
  actions: ErrorActions;
  
  /** Provider configuration */
  config: ErrorHandlerConfig;
  
  /** Error classification utilities */
  classifiers: {
    /** Classify generic error */
    classifyError: (error: any) => AppError;
    /** Classify API error response */
    classifyApiError: (response: any) => AppError;
    /** Classify network error */
    classifyNetworkError: (error: any) => NetworkError;
    /** Check if error is retryable */
    isRetryable: (error: AppError) => boolean;
  };
}

/**
 * Error provider props
 */
export interface ErrorProviderProps extends BaseProviderProps<ErrorHandlerConfig> {
  /** Initial error state */
  initialState?: Partial<ErrorState>;
  
  /** Error event handlers */
  onError?: (error: AppError, context: ErrorContext) => void;
  onRecovery?: (errorId: string, action: RecoveryAction, success: boolean) => void;
  onCircuitBreakerStateChange?: (state: CircuitBreakerState) => void;
  
  /** Custom error reporting service */
  reportingService?: {
    report: (error: AppError, context: ErrorContext) => Promise<void>;
    batchReport: (errors: Array<{ error: AppError; context: ErrorContext }>) => Promise<void>;
  };
  
  /** Custom error boundary fallback */
  defaultErrorBoundary?: React.ComponentType<ErrorBoundaryInfo>;
}

// ============================================================================
// PROVIDER COMPOSITION TYPES
// ============================================================================

/**
 * Combined provider state for app-wide state access
 */
export interface AppProviderState {
  auth: AuthState;
  theme: ThemeState;
  notification: NotificationState;
  error: ErrorState;
}

/**
 * Combined provider actions for app-wide action access
 */
export interface AppProviderActions {
  auth: AuthActions;
  theme: ThemeActions;
  notification: NotificationActions;
  error: ErrorActions;
}

/**
 * Root application context value
 */
export interface AppContextValue {
  /** Combined provider states */
  state: AppProviderState;
  
  /** Combined provider actions */
  actions: AppProviderActions;
  
  /** Combined provider configurations */
  config: {
    auth: AuthProviderConfig;
    theme: ThemeProviderConfig;
    notification: NotificationQueueConfig;
    error: ErrorHandlerConfig;
  };
  
  /** App-level utilities */
  utils: {
    /** Check if all providers are initialized */
    isAppReady: boolean;
    /** Get app initialization progress */
    initializationProgress: number;
    /** Reset all providers to initial state */
    resetApp: () => void;
  };
}

/**
 * Root application provider props
 */
export interface AppProviderProps {
  children: ReactNode;
  
  /** Configurations for all providers */
  config?: {
    auth?: Partial<AuthProviderConfig>;
    theme?: Partial<ThemeProviderConfig>;
    notification?: Partial<NotificationQueueConfig>;
    error?: Partial<ErrorHandlerConfig>;
  };
  
  /** Initial states for all providers */
  initialState?: {
    auth?: Partial<AuthState>;
    theme?: Partial<ThemeState>;
    notification?: Partial<NotificationState>;
    error?: Partial<ErrorState>;
  };
  
  /** Global event handlers */
  onAppReady?: () => void;
  onAppError?: (error: AppError) => void;
  
  /** Development mode configuration */
  development?: {
    enableDebugMode?: boolean;
    enablePerformanceMonitoring?: boolean;
    enableAccessibilityChecks?: boolean;
  };
}

/**
 * Provider registry for dynamic provider management
 */
export interface ProviderRegistry {
  /** Register a new provider */
  register: <T extends BaseContextValue<any, any>>(
    name: string,
    provider: ProviderComposition
  ) => void;
  
  /** Unregister a provider */
  unregister: (name: string) => void;
  
  /** Get provider by name */
  get: (name: string) => ProviderComposition | null;
  
  /** Get all registered providers */
  getAll: () => Record<string, ProviderComposition>;
  
  /** Check if provider is registered */
  has: (name: string) => boolean;
}

// ============================================================================
// TYPE UTILITIES AND HELPERS
// ============================================================================

/**
 * Extract state type from provider context value
 */
export type ExtractProviderState<T> = T extends BaseContextValue<infer S, any> ? S : never;

/**
 * Extract actions type from provider context value
 */
export type ExtractProviderActions<T> = T extends BaseContextValue<any, infer A> ? A : never;

/**
 * Extract config type from provider props
 */
export type ExtractProviderConfig<T> = T extends BaseProviderProps<infer C> ? C : never;

/**
 * Provider hook factory type
 */
export type ProviderHook<T extends BaseContextValue<any, any>> = () => T;

/**
 * Provider selector hook type
 */
export type ProviderSelector<T extends BaseContextValue<any, any>, R> = (value: T) => R;

/**
 * Provider subscription hook type
 */
export type ProviderSubscription<T extends BaseContextValue<any, any>> = (
  selector: ProviderSelector<T, any>,
  equalityFn?: (a: any, b: any) => boolean
) => any;

// ============================================================================
// EXPORT TYPES FOR CONVENIENT IMPORTS
// ============================================================================

export type {
  // Base provider types
  BaseProviderProps,
  BaseContextValue,
  ProviderComposition,
  
  // Authentication types
  AuthState,
  AuthActions,
  AuthContextValue,
  AuthProviderProps,
  AuthProviderConfig,
  
  // Theme types
  ThemeState,
  ThemeActions,
  ThemeContextValue,
  ThemeProviderProps,
  
  // Notification types
  NotificationState,
  NotificationActions,
  NotificationContextValue,
  NotificationProviderProps,
  
  // Error types
  ErrorState,
  ErrorActions,
  ErrorContextValue,
  ErrorProviderProps,
  
  // App-level types
  AppProviderState,
  AppProviderActions,
  AppContextValue,
  AppProviderProps,
  ProviderRegistry,
  
  // Utility types
  ExtractProviderState,
  ExtractProviderActions,
  ExtractProviderConfig,
  ProviderHook,
  ProviderSelector,
  ProviderSubscription,
};