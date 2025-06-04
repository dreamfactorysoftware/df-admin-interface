/**
 * TypeScript type definitions for all React context providers in the DreamFactory Admin Interface.
 * 
 * This file provides comprehensive type safety for provider state and actions throughout the application,
 * supporting the migration from Angular services to React context patterns with enhanced type inference
 * and strict type checking for all provider context values and action functions.
 * 
 * @version 1.0.0
 * @requires TypeScript 5.8+ with enhanced React 19 support for context typing
 * @requires React 19.0.0 for enhanced concurrent features and context optimizations
 */

import { ReactNode } from 'react';
import { StateCreator } from 'zustand';
import { QueryClient } from '@tanstack/react-query';

// =============================================================================
// Generic Provider Types & Utilities
// =============================================================================

/**
 * Generic provider props interface supporting optional configuration and default value handling.
 * Enables reusable provider patterns and context composition across the application.
 */
export interface BaseProviderProps<T = unknown> {
  /** Child components to be wrapped by the provider */
  children: ReactNode;
  /** Optional initial value for the context */
  defaultValue?: T;
  /** Optional configuration overrides for the provider */
  config?: Partial<T>;
  /** Development mode flag for enhanced debugging */
  debug?: boolean;
}

/**
 * Generic context value interface with loading and error states.
 * Provides consistent patterns for context values across all providers.
 */
export interface ContextValue<T, A = Record<string, unknown>> {
  /** Current state value */
  value: T;
  /** Loading state indicator */
  isLoading: boolean;
  /** Error state if any operation failed */
  error: Error | null;
  /** Available actions for this context */
  actions: A;
}

/**
 * Generic async action interface for context actions that perform network operations.
 * Ensures consistent error handling and loading states across all provider actions.
 */
export interface AsyncAction<TInput = void, TOutput = void> {
  (input: TInput): Promise<TOutput>;
}

/**
 * Zustand state creator type with enhanced typing for React 19 compatibility.
 * Provides type-safe state management integration with context providers.
 */
export type ProviderStateCreator<T> = StateCreator<
  T,
  [],
  [],
  T
>;

// =============================================================================
// Authentication Context Types
// =============================================================================

/**
 * User authentication state and session data.
 * Represents the current user's authentication status and profile information.
 */
export interface AuthState {
  /** Current authenticated user, null if not logged in */
  user: AuthUser | null;
  /** Authentication status */
  isAuthenticated: boolean;
  /** Current session token */
  token: string | null;
  /** User permissions and role-based access control data */
  permissions: UserPermissions;
  /** Session expiration timestamp */
  expiresAt: number | null;
  /** Loading state for authentication operations */
  isLoading: boolean;
  /** Last authentication error */
  error: AuthError | null;
}

/**
 * Authenticated user profile data with enhanced type safety.
 * Maintains compatibility with DreamFactory user management patterns.
 */
export interface AuthUser {
  /** Unique user identifier */
  id: number;
  /** User email address (primary identifier) */
  email: string;
  /** User display name */
  name: string;
  /** First name */
  firstName?: string;
  /** Last name */
  lastName?: string;
  /** User avatar URL */
  avatar?: string;
  /** User role assignments */
  roles: UserRole[];
  /** Account status flags */
  isActive: boolean;
  /** Administrative privileges flag */
  isAdmin: boolean;
  /** Last login timestamp */
  lastLogin?: string;
  /** User preferences and settings */
  preferences: UserPreferences;
}

/**
 * User role definition with granular permissions.
 * Supports DreamFactory's role-based access control system.
 */
export interface UserRole {
  /** Role identifier */
  id: number;
  /** Role name */
  name: string;
  /** Role description */
  description?: string;
  /** Service access permissions */
  serviceAccess: ServicePermission[];
  /** Administrative capabilities */
  isDefault: boolean;
}

/**
 * Service-level permission configuration.
 * Defines granular access control for DreamFactory services.
 */
export interface ServicePermission {
  /** Service identifier */
  serviceId: number;
  /** Service name */
  serviceName: string;
  /** Allowed HTTP verbs */
  verbs: HttpVerb[];
  /** Request filters */
  requestFilters?: string[];
  /** Response filters */
  responseFilters?: string[];
}

/**
 * HTTP verb enumeration for API permissions.
 */
export type HttpVerb = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

/**
 * Comprehensive user permissions object.
 * Provides quick access to user capabilities and restrictions.
 */
export interface UserPermissions {
  /** Services the user can access */
  services: string[];
  /** Administrative capabilities */
  canManageUsers: boolean;
  /** Service management permissions */
  canManageServices: boolean;
  /** Schema modification permissions */
  canManageSchema: boolean;
  /** System configuration access */
  canManageSystem: boolean;
  /** API documentation access */
  canViewApiDocs: boolean;
  /** Role management permissions */
  canManageRoles: boolean;
}

/**
 * User preferences and customization settings.
 */
export interface UserPreferences {
  /** Preferred theme */
  theme: 'light' | 'dark' | 'system';
  /** Preferred language/locale */
  locale: string;
  /** Dashboard layout preferences */
  dashboardLayout: 'grid' | 'list';
  /** Notification preferences */
  notifications: NotificationPreferences;
}

/**
 * Notification preferences configuration.
 */
export interface NotificationPreferences {
  /** Enable browser notifications */
  browser: boolean;
  /** Enable email notifications */
  email: boolean;
  /** Show success messages */
  showSuccess: boolean;
  /** Show warning messages */
  showWarnings: boolean;
  /** Auto-dismiss timing in milliseconds */
  autoDismiss: number;
}

/**
 * Authentication error types with detailed context.
 */
export interface AuthError {
  /** Error type classification */
  type: 'INVALID_CREDENTIALS' | 'TOKEN_EXPIRED' | 'NETWORK_ERROR' | 'SERVER_ERROR' | 'UNKNOWN';
  /** Error message */
  message: string;
  /** Additional error context */
  details?: string;
  /** Error timestamp */
  timestamp: number;
  /** Retry capability flag */
  canRetry: boolean;
}

/**
 * Authentication context actions interface.
 * Provides type-safe methods for authentication operations with React 19 optimizations.
 */
export interface AuthActions {
  /** User login with credentials */
  login: AsyncAction<LoginCredentials, AuthUser>;
  /** User logout with session cleanup */
  logout: AsyncAction<void, void>;
  /** Refresh authentication token */
  refreshToken: AsyncAction<void, string>;
  /** Update user profile */
  updateProfile: AsyncAction<Partial<AuthUser>, AuthUser>;
  /** Update user preferences */
  updatePreferences: AsyncAction<Partial<UserPreferences>, UserPreferences>;
  /** Check user permissions for specific service */
  checkPermission: (service: string, verb: HttpVerb) => boolean;
  /** Clear authentication errors */
  clearError: () => void;
  /** Force session validation */
  validateSession: AsyncAction<void, boolean>;
}

/**
 * Login credentials interface.
 */
export interface LoginCredentials {
  /** User email address */
  email: string;
  /** User password */
  password: string;
  /** Remember session flag */
  rememberMe?: boolean;
  /** Two-factor authentication code */
  twoFactorCode?: string;
}

/**
 * Authentication context value with comprehensive type safety.
 */
export interface AuthContextValue extends ContextValue<AuthState, AuthActions> {}

/**
 * Authentication provider props with configuration options.
 */
export interface AuthProviderProps extends BaseProviderProps<AuthState> {
  /** Custom authentication service endpoint */
  authEndpoint?: string;
  /** Token refresh interval in milliseconds */
  refreshInterval?: number;
  /** Enable automatic token refresh */
  autoRefresh?: boolean;
}

// =============================================================================
// Theme Context Types
// =============================================================================

/**
 * Application theme state and configuration.
 * Manages light/dark theme preferences with Tailwind CSS integration.
 */
export interface ThemeState {
  /** Current active theme */
  theme: ThemeMode;
  /** System preference detection */
  systemPreference: 'light' | 'dark';
  /** Theme initialization status */
  isInitialized: boolean;
  /** CSS variables loaded flag */
  cssVariablesLoaded: boolean;
  /** Available theme configurations */
  availableThemes: ThemeConfig[];
  /** Custom theme overrides */
  customizations: ThemeCustomizations;
}

/**
 * Theme mode enumeration.
 */
export type ThemeMode = 'light' | 'dark' | 'system';

/**
 * Theme configuration definition.
 */
export interface ThemeConfig {
  /** Theme identifier */
  id: string;
  /** Display name */
  name: string;
  /** Theme description */
  description?: string;
  /** CSS class name for Tailwind CSS */
  className: string;
  /** Color palette definition */
  colors: ThemeColorPalette;
  /** Typography configuration */
  typography: ThemeTypography;
  /** Component-specific styling */
  components: ThemeComponentStyles;
}

/**
 * Color palette for theme configuration.
 */
export interface ThemeColorPalette {
  /** Primary brand colors */
  primary: ColorScale;
  /** Secondary colors */
  secondary: ColorScale;
  /** Accent colors */
  accent: ColorScale;
  /** Neutral/gray colors */
  neutral: ColorScale;
  /** Success state colors */
  success: ColorScale;
  /** Warning state colors */
  warning: ColorScale;
  /** Error state colors */
  error: ColorScale;
  /** Background colors */
  background: {
    primary: string;
    secondary: string;
    tertiary: string;
  };
  /** Text colors */
  text: {
    primary: string;
    secondary: string;
    tertiary: string;
    inverse: string;
  };
  /** Border colors */
  border: {
    primary: string;
    secondary: string;
    focus: string;
  };
}

/**
 * Color scale with multiple shades.
 */
export interface ColorScale {
  50: string;
  100: string;
  200: string;
  300: string;
  400: string;
  500: string;
  600: string;
  700: string;
  800: string;
  900: string;
  950: string;
}

/**
 * Typography configuration for themes.
 */
export interface ThemeTypography {
  /** Font family definitions */
  fontFamily: {
    sans: string[];
    serif: string[];
    mono: string[];
  };
  /** Font size scale */
  fontSize: {
    xs: string;
    sm: string;
    base: string;
    lg: string;
    xl: string;
    '2xl': string;
    '3xl': string;
    '4xl': string;
    '5xl': string;
  };
  /** Font weight scale */
  fontWeight: {
    thin: string;
    light: string;
    normal: string;
    medium: string;
    semibold: string;
    bold: string;
    extrabold: string;
  };
  /** Line height scale */
  lineHeight: {
    tight: string;
    normal: string;
    relaxed: string;
    loose: string;
  };
}

/**
 * Component-specific theme styling.
 */
export interface ThemeComponentStyles {
  /** Button component styles */
  button: {
    primary: string;
    secondary: string;
    danger: string;
    ghost: string;
  };
  /** Input component styles */
  input: {
    base: string;
    focus: string;
    error: string;
    disabled: string;
  };
  /** Card component styles */
  card: {
    base: string;
    header: string;
    content: string;
    footer: string;
  };
  /** Navigation component styles */
  navigation: {
    base: string;
    item: string;
    active: string;
    hover: string;
  };
}

/**
 * Theme customization overrides.
 */
export interface ThemeCustomizations {
  /** Custom CSS variables */
  cssVariables: Record<string, string>;
  /** Component class overrides */
  componentOverrides: Record<string, string>;
  /** Custom animations */
  animations: Record<string, string>;
  /** Responsive breakpoint overrides */
  breakpoints: Record<string, string>;
}

/**
 * Theme context actions interface.
 */
export interface ThemeActions {
  /** Set theme mode */
  setTheme: (theme: ThemeMode) => void;
  /** Toggle between light and dark */
  toggleTheme: () => void;
  /** Apply custom theme configuration */
  applyCustomTheme: (config: Partial<ThemeConfig>) => void;
  /** Reset to default theme */
  resetTheme: () => void;
  /** Export current theme configuration */
  exportTheme: () => ThemeConfig;
  /** Import theme configuration */
  importTheme: (config: ThemeConfig) => void;
  /** Update theme customizations */
  updateCustomizations: (customizations: Partial<ThemeCustomizations>) => void;
}

/**
 * Theme context value interface.
 */
export interface ThemeContextValue extends ContextValue<ThemeState, ThemeActions> {}

/**
 * Theme provider props with configuration options.
 */
export interface ThemeProviderProps extends BaseProviderProps<ThemeState> {
  /** Default theme mode */
  defaultTheme?: ThemeMode;
  /** Enable system preference detection */
  enableSystemDetection?: boolean;
  /** Storage key for theme persistence */
  storageKey?: string;
  /** Custom theme configurations */
  themes?: ThemeConfig[];
}

// =============================================================================
// Notification Context Types
// =============================================================================

/**
 * Application notification state and queue management.
 * Replaces Angular Material snackbar with React-based notification system.
 */
export interface NotificationState {
  /** Current notification queue */
  notifications: Notification[];
  /** Maximum queue size */
  maxQueueSize: number;
  /** Global notification settings */
  globalSettings: NotificationSettings;
  /** Persistence across route changes */
  persistAcrossRoutes: boolean;
}

/**
 * Individual notification definition.
 */
export interface Notification {
  /** Unique notification identifier */
  id: string;
  /** Notification type for styling and behavior */
  type: NotificationType;
  /** Notification title */
  title: string;
  /** Notification message content */
  message: string;
  /** Auto-dismiss duration in milliseconds */
  duration?: number;
  /** Notification persistence flag */
  persistent?: boolean;
  /** Action buttons */
  actions?: NotificationAction[];
  /** Creation timestamp */
  timestamp: number;
  /** Position preference */
  position?: NotificationPosition;
  /** Additional metadata */
  metadata?: Record<string, unknown>;
  /** Read status */
  isRead?: boolean;
}

/**
 * Notification type enumeration for styling and behavior.
 */
export type NotificationType = 
  | 'success' 
  | 'error' 
  | 'warning' 
  | 'info' 
  | 'loading';

/**
 * Notification position on screen.
 */
export type NotificationPosition = 
  | 'top-right' 
  | 'top-left' 
  | 'top-center'
  | 'bottom-right' 
  | 'bottom-left' 
  | 'bottom-center';

/**
 * Notification action button configuration.
 */
export interface NotificationAction {
  /** Action identifier */
  id: string;
  /** Button label */
  label: string;
  /** Action handler */
  handler: () => void | Promise<void>;
  /** Button style variant */
  variant?: 'primary' | 'secondary' | 'ghost';
  /** Action icon */
  icon?: string;
}

/**
 * Global notification settings.
 */
export interface NotificationSettings {
  /** Default duration for auto-dismiss */
  defaultDuration: number;
  /** Maximum visible notifications */
  maxVisible: number;
  /** Default position */
  defaultPosition: NotificationPosition;
  /** Animation duration */
  animationDuration: number;
  /** Enable sound notifications */
  enableSound: boolean;
  /** Sound file paths */
  sounds: {
    success: string;
    error: string;
    warning: string;
    info: string;
  };
}

/**
 * Notification context actions interface.
 */
export interface NotificationActions {
  /** Add new notification to queue */
  addNotification: (notification: Omit<Notification, 'id' | 'timestamp'>) => string;
  /** Remove specific notification */
  removeNotification: (id: string) => void;
  /** Clear all notifications */
  clearAll: () => void;
  /** Clear notifications by type */
  clearByType: (type: NotificationType) => void;
  /** Mark notification as read */
  markAsRead: (id: string) => void;
  /** Mark all notifications as read */
  markAllAsRead: () => void;
  /** Update notification settings */
  updateSettings: (settings: Partial<NotificationSettings>) => void;
  /** Show success notification (convenience method) */
  success: (title: string, message?: string, options?: Partial<Notification>) => string;
  /** Show error notification (convenience method) */
  error: (title: string, message?: string, options?: Partial<Notification>) => string;
  /** Show warning notification (convenience method) */
  warning: (title: string, message?: string, options?: Partial<Notification>) => string;
  /** Show info notification (convenience method) */
  info: (title: string, message?: string, options?: Partial<Notification>) => string;
  /** Show loading notification (convenience method) */
  loading: (title: string, message?: string, options?: Partial<Notification>) => string;
}

/**
 * Notification context value interface.
 */
export interface NotificationContextValue extends ContextValue<NotificationState, NotificationActions> {}

/**
 * Notification provider props with configuration options.
 */
export interface NotificationProviderProps extends BaseProviderProps<NotificationState> {
  /** Maximum number of notifications in queue */
  maxQueueSize?: number;
  /** Default notification position */
  position?: NotificationPosition;
  /** Enable persistence across route changes */
  persistAcrossRoutes?: boolean;
  /** Custom notification settings */
  settings?: Partial<NotificationSettings>;
}

// =============================================================================
// Error Context Types
// =============================================================================

/**
 * Application error state and recovery management.
 * Replaces Angular error handling with React Error Boundary integration.
 */
export interface ErrorState {
  /** Current global error if any */
  globalError: GlobalError | null;
  /** Component-level errors */
  componentErrors: ComponentError[];
  /** Error reporting configuration */
  reportingConfig: ErrorReportingConfig;
  /** Error recovery strategies */
  recoveryStrategies: ErrorRecoveryStrategy[];
  /** Error history for debugging */
  errorHistory: ErrorHistoryEntry[];
}

/**
 * Global application error definition.
 */
export interface GlobalError {
  /** Error identifier */
  id: string;
  /** Error type classification */
  type: ErrorType;
  /** Error message */
  message: string;
  /** Error stack trace */
  stack?: string;
  /** Component stack where error occurred */
  componentStack?: string;
  /** User context when error occurred */
  userContext: ErrorUserContext;
  /** Timestamp when error occurred */
  timestamp: number;
  /** Error severity level */
  severity: ErrorSeverity;
  /** Recovery actions attempted */
  recoveryAttempts: number;
  /** Additional error metadata */
  metadata: Record<string, unknown>;
}

/**
 * Component-specific error information.
 */
export interface ComponentError {
  /** Component error identifier */
  id: string;
  /** Component name where error occurred */
  componentName: string;
  /** Error boundary that caught the error */
  errorBoundary: string;
  /** Original error object */
  error: Error;
  /** Error info from React */
  errorInfo: {
    componentStack: string;
  };
  /** Error timestamp */
  timestamp: number;
  /** Recovery state */
  isRecovered: boolean;
}

/**
 * Error type classification.
 */
export type ErrorType = 
  | 'JAVASCRIPT_ERROR'
  | 'NETWORK_ERROR' 
  | 'API_ERROR'
  | 'VALIDATION_ERROR'
  | 'AUTHENTICATION_ERROR'
  | 'AUTHORIZATION_ERROR'
  | 'CONFIGURATION_ERROR'
  | 'UNKNOWN_ERROR';

/**
 * Error severity levels.
 */
export type ErrorSeverity = 'low' | 'medium' | 'high' | 'critical';

/**
 * User context information for error reporting.
 */
export interface ErrorUserContext {
  /** User identifier */
  userId?: number;
  /** User email */
  userEmail?: string;
  /** Current route */
  currentRoute: string;
  /** User agent string */
  userAgent: string;
  /** Viewport dimensions */
  viewport: {
    width: number;
    height: number;
  };
  /** Browser information */
  browser: {
    name: string;
    version: string;
  };
  /** Operating system */
  os: {
    name: string;
    version: string;
  };
}

/**
 * Error reporting configuration.
 */
export interface ErrorReportingConfig {
  /** Enable error reporting */
  enabled: boolean;
  /** Error reporting endpoint */
  endpoint?: string;
  /** Include user context in reports */
  includeUserContext: boolean;
  /** Include stack traces */
  includeStackTrace: boolean;
  /** Sampling rate for error reporting */
  sampleRate: number;
  /** Maximum errors to report per session */
  maxErrorsPerSession: number;
  /** Ignored error patterns */
  ignoredErrors: string[];
}

/**
 * Error recovery strategy definition.
 */
export interface ErrorRecoveryStrategy {
  /** Strategy identifier */
  id: string;
  /** Error types this strategy handles */
  errorTypes: ErrorType[];
  /** Recovery action */
  action: ErrorRecoveryAction;
  /** Maximum retry attempts */
  maxRetries: number;
  /** Retry delay in milliseconds */
  retryDelay: number;
  /** Success condition check */
  isSuccessful: () => boolean;
}

/**
 * Error recovery action definition.
 */
export interface ErrorRecoveryAction {
  /** Action name */
  name: string;
  /** Action description */
  description: string;
  /** Action handler */
  handler: () => Promise<void>;
  /** User-visible label */
  label: string;
  /** Action icon */
  icon?: string;
}

/**
 * Error history entry for debugging.
 */
export interface ErrorHistoryEntry {
  /** Entry identifier */
  id: string;
  /** Error that occurred */
  error: GlobalError;
  /** Recovery actions taken */
  recoveryActions: string[];
  /** Final resolution */
  resolution: 'recovered' | 'unresolved' | 'ignored';
  /** Resolution timestamp */
  resolvedAt?: number;
}

/**
 * Error context actions interface.
 */
export interface ErrorActions {
  /** Report a new error */
  reportError: (error: Error, context?: Partial<ErrorUserContext>) => void;
  /** Clear specific error */
  clearError: (errorId: string) => void;
  /** Clear all errors */
  clearAllErrors: () => void;
  /** Attempt error recovery */
  attemptRecovery: (errorId: string, strategyId?: string) => Promise<boolean>;
  /** Add custom recovery strategy */
  addRecoveryStrategy: (strategy: ErrorRecoveryStrategy) => void;
  /** Update error reporting configuration */
  updateReportingConfig: (config: Partial<ErrorReportingConfig>) => void;
  /** Get error by ID */
  getError: (errorId: string) => GlobalError | undefined;
  /** Get errors by type */
  getErrorsByType: (type: ErrorType) => GlobalError[];
  /** Export error history */
  exportErrorHistory: () => ErrorHistoryEntry[];
}

/**
 * Error context value interface.
 */
export interface ErrorContextValue extends ContextValue<ErrorState, ErrorActions> {}

/**
 * Error provider props with configuration options.
 */
export interface ErrorProviderProps extends BaseProviderProps<ErrorState> {
  /** Error reporting configuration */
  reportingConfig?: Partial<ErrorReportingConfig>;
  /** Custom recovery strategies */
  recoveryStrategies?: ErrorRecoveryStrategy[];
  /** Maximum error history entries */
  maxHistoryEntries?: number;
  /** Enable development mode logging */
  developmentMode?: boolean;
}

// =============================================================================
// Query Provider Types
// =============================================================================

/**
 * React Query provider configuration and state.
 * Manages TanStack React Query client with intelligent caching strategies.
 */
export interface QueryState {
  /** Query client instance */
  client: QueryClient;
  /** Global cache configuration */
  cacheConfig: QueryCacheConfig;
  /** Mutation configuration */
  mutationConfig: QueryMutationConfig;
  /** Default query options */
  defaultOptions: QueryDefaultOptions;
  /** Development tools configuration */
  devtools: QueryDevtoolsConfig;
}

/**
 * Query cache configuration.
 */
export interface QueryCacheConfig {
  /** Default stale time in milliseconds */
  defaultStaleTime: number;
  /** Default cache time in milliseconds */
  defaultCacheTime: number;
  /** Maximum cache size */
  maxCacheSize: number;
  /** Cache garbage collection interval */
  gcInterval: number;
  /** Enable background refetching */
  enableBackgroundRefetch: boolean;
}

/**
 * Mutation configuration.
 */
export interface QueryMutationConfig {
  /** Default retry count for mutations */
  defaultRetryCount: number;
  /** Retry delay function */
  retryDelay: (attempt: number) => number;
  /** Enable optimistic updates */
  enableOptimisticUpdates: boolean;
  /** Default mutation timeout */
  defaultTimeout: number;
}

/**
 * Default query options configuration.
 */
export interface QueryDefaultOptions {
  /** Stale time for database queries */
  databaseQueriesStaleTime: number;
  /** Stale time for user queries */
  userQueriesStaleTime: number;
  /** Stale time for system queries */
  systemQueriesStaleTime: number;
  /** Refetch on window focus */
  refetchOnWindowFocus: boolean;
  /** Refetch on reconnect */
  refetchOnReconnect: boolean;
  /** Retry configuration */
  retry: boolean | number | ((failureCount: number, error: Error) => boolean);
}

/**
 * Query devtools configuration.
 */
export interface QueryDevtoolsConfig {
  /** Enable React Query devtools */
  enabled: boolean;
  /** Devtools position */
  position: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
  /** Initial devtools state */
  initialIsOpen: boolean;
  /** Button position */
  buttonPosition: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
}

/**
 * Query provider props with comprehensive configuration.
 */
export interface QueryProviderProps extends BaseProviderProps<QueryState> {
  /** Custom query client */
  client?: QueryClient;
  /** Cache configuration overrides */
  cacheConfig?: Partial<QueryCacheConfig>;
  /** Mutation configuration overrides */
  mutationConfig?: Partial<QueryMutationConfig>;
  /** Default options overrides */
  defaultOptions?: Partial<QueryDefaultOptions>;
  /** Devtools configuration */
  devtools?: Partial<QueryDevtoolsConfig>;
}

// =============================================================================
// Provider Composition Types
// =============================================================================

/**
 * Root provider configuration combining all application providers.
 */
export interface AppProvidersConfig {
  /** Authentication provider configuration */
  auth?: Partial<AuthProviderProps>;
  /** Theme provider configuration */
  theme?: Partial<ThemeProviderProps>;
  /** Query provider configuration */
  query?: Partial<QueryProviderProps>;
  /** Notification provider configuration */
  notification?: Partial<NotificationProviderProps>;
  /** Error provider configuration */
  error?: Partial<ErrorProviderProps>;
  /** Development mode settings */
  development?: {
    enableDevtools: boolean;
    enableDebugLogging: boolean;
    mockApiCalls: boolean;
  };
}

/**
 * Provider order configuration for proper dependency resolution.
 */
export interface ProviderOrder {
  /** Provider priority order (lower numbers = higher priority) */
  order: {
    error: 1;
    query: 2;
    auth: 3;
    theme: 4;
    notification: 5;
  };
}

/**
 * Combined application context value interface.
 * Provides access to all provider contexts in a single interface.
 */
export interface AppContextValue {
  /** Authentication context */
  auth: AuthContextValue;
  /** Theme context */
  theme: ThemeContextValue;
  /** Notification context */
  notification: NotificationContextValue;
  /** Error context */
  error: ErrorContextValue;
  /** Query state information */
  query: QueryState;
}

/**
 * App providers component props.
 */
export interface AppProvidersProps {
  /** Child components */
  children: ReactNode;
  /** Provider configuration */
  config?: AppProvidersConfig;
  /** Enable strict mode */
  strictMode?: boolean;
  /** Enable performance profiling */
  enableProfiling?: boolean;
}

// =============================================================================
// Utility Types for Enhanced Type Safety
// =============================================================================

/**
 * Extract provider state type from provider props.
 */
export type ExtractProviderState<T> = T extends BaseProviderProps<infer U> ? U : never;

/**
 * Extract provider actions type from context value.
 */
export type ExtractProviderActions<T> = T extends ContextValue<unknown, infer A> ? A : never;

/**
 * Utility type for creating provider hooks with proper typing.
 */
export type ProviderHook<T extends ContextValue<unknown, unknown>> = () => T;

/**
 * Utility type for creating provider components with proper typing.
 */
export type ProviderComponent<T extends BaseProviderProps<unknown>> = (props: T) => JSX.Element;

/**
 * Type guard for checking if a value is a valid context value.
 */
export function isContextValue<T, A>(value: unknown): value is ContextValue<T, A> {
  return (
    typeof value === 'object' &&
    value !== null &&
    'value' in value &&
    'isLoading' in value &&
    'error' in value &&
    'actions' in value
  );
}

/**
 * Type guard for checking if an error is a known error type.
 */
export function isKnownError(error: unknown): error is GlobalError {
  return (
    typeof error === 'object' &&
    error !== null &&
    'id' in error &&
    'type' in error &&
    'message' in error &&
    'timestamp' in error
  );
}

// =============================================================================
// Constants and Default Values
// =============================================================================

/**
 * Default configuration values for all providers.
 */
export const DEFAULT_PROVIDER_CONFIG = {
  /** Default authentication configuration */
  auth: {
    refreshInterval: 15 * 60 * 1000, // 15 minutes
    autoRefresh: true,
  },
  /** Default theme configuration */
  theme: {
    defaultTheme: 'system' as const,
    enableSystemDetection: true,
    storageKey: 'df-admin-theme',
  },
  /** Default query configuration */
  query: {
    cacheConfig: {
      defaultStaleTime: 5 * 60 * 1000, // 5 minutes
      defaultCacheTime: 10 * 60 * 1000, // 10 minutes
      maxCacheSize: 100,
      gcInterval: 30 * 60 * 1000, // 30 minutes
      enableBackgroundRefetch: true,
    },
  },
  /** Default notification configuration */
  notification: {
    maxQueueSize: 10,
    position: 'top-right' as const,
    persistAcrossRoutes: true,
  },
  /** Default error configuration */
  error: {
    maxHistoryEntries: 50,
    developmentMode: process.env.NODE_ENV === 'development',
  },
} as const;

/**
 * Provider context display names for debugging.
 */
export const PROVIDER_DISPLAY_NAMES = {
  auth: 'AuthProvider',
  theme: 'ThemeProvider',
  query: 'QueryProvider',
  notification: 'NotificationProvider',
  error: 'ErrorProvider',
  app: 'AppProviders',
} as const;

export default {
  DEFAULT_PROVIDER_CONFIG,
  PROVIDER_DISPLAY_NAMES,
  isContextValue,
  isKnownError,
};