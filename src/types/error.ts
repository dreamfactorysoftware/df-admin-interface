/**
 * Error management types for global error state handling, categorization,
 * recovery workflows, and error boundary integration.
 * 
 * Provides comprehensive error typing for React 19 Error Boundaries,
 * API error handling, validation errors, and user feedback systems.
 */

import { LogLevel, LogContext } from './logging';

export type ErrorSeverity = 'low' | 'medium' | 'high' | 'critical';
export type ErrorCategory = 
  | 'api' 
  | 'network' 
  | 'authentication' 
  | 'authorization' 
  | 'validation' 
  | 'database' 
  | 'schema' 
  | 'permission' 
  | 'configuration' 
  | 'system' 
  | 'user_input' 
  | 'file_upload' 
  | 'performance' 
  | 'unknown';

export type ErrorRecoveryAction = 
  | 'retry' 
  | 'refresh' 
  | 'login' 
  | 'navigate' 
  | 'contact_support' 
  | 'dismiss' 
  | 'report' 
  | 'fallback' 
  | 'none';

export type ErrorPersistenceLevel = 'session' | 'permanent' | 'temporary';

/**
 * Core error interface defining the structure of all application errors
 */
export interface AppError {
  /** Unique error identifier */
  id: string;
  /** Error message for display */
  message: string;
  /** Technical error details for debugging */
  details?: string;
  /** Error category for classification */
  category: ErrorCategory;
  /** Error severity level */
  severity: ErrorSeverity;
  /** HTTP status code if applicable */
  statusCode?: number;
  /** Source of the error (component, API endpoint, etc.) */
  source?: string;
  /** Stack trace for debugging */
  stack?: string;
  /** Original error object */
  originalError?: Error;
  /** Error metadata */
  metadata?: Record<string, unknown>;
  /** Timestamp when error occurred */
  timestamp: string;
  /** User context when error occurred */
  context?: LogContext;
  /** How long to persist this error */
  persistence: ErrorPersistenceLevel;
  /** Suggested recovery actions */
  recoveryActions: ErrorRecoveryAction[];
  /** Whether error can be automatically retried */
  retryable: boolean;
  /** Number of retry attempts made */
  retryCount?: number;
  /** Maximum retry attempts allowed */
  maxRetries?: number;
  /** Timeout for error display (ms) */
  timeout?: number;
  /** Whether error has been dismissed by user */
  dismissed?: boolean;
  /** Whether error has been reported */
  reported?: boolean;
  /** Component that should handle this error */
  boundaryComponent?: string;
}

/**
 * API-specific error interface extending AppError
 */
export interface ApiError extends AppError {
  category: 'api' | 'network' | 'authentication' | 'authorization';
  /** HTTP response status */
  statusCode: number;
  /** Response headers */
  headers?: Record<string, string>;
  /** Request URL that caused the error */
  url?: string;
  /** HTTP method used */
  method?: string;
  /** Request payload */
  requestData?: unknown;
  /** Response data */
  responseData?: unknown;
  /** Rate limiting information */
  rateLimitInfo?: {
    limit: number;
    remaining: number;
    reset: number;
  };
}

/**
 * Validation error interface for form and input validation
 */
export interface ValidationError extends AppError {
  category: 'validation' | 'user_input';
  /** Field name that caused the validation error */
  field?: string;
  /** All validation errors by field */
  fieldErrors?: Record<string, string[]>;
  /** Form ID or name */
  formId?: string;
  /** Validation rule that failed */
  rule?: string;
  /** Expected value or format */
  expected?: unknown;
  /** Actual value that failed validation */
  actual?: unknown;
}

/**
 * Database error interface for database operations
 */
export interface DatabaseError extends AppError {
  category: 'database' | 'schema';
  /** Database connection name */
  connection?: string;
  /** SQL query that caused the error */
  query?: string;
  /** Database error code */
  dbErrorCode?: string | number;
  /** Database-specific error message */
  dbMessage?: string;
  /** Table or collection name */
  table?: string;
  /** Operation that failed */
  operation?: 'create' | 'read' | 'update' | 'delete' | 'connect' | 'schema';
}

/**
 * Permission error interface for access control
 */
export interface PermissionError extends AppError {
  category: 'permission' | 'authorization';
  /** Required permission */
  requiredPermission?: string;
  /** User's current permissions */
  userPermissions?: string[];
  /** Resource being accessed */
  resource?: string;
  /** Action being attempted */
  action?: string;
  /** Role requirements */
  requiredRoles?: string[];
  /** User's current roles */
  userRoles?: string[];
}

/**
 * Network error interface for connectivity issues
 */
export interface NetworkError extends AppError {
  category: 'network';
  /** Network error type */
  networkErrorType: 'timeout' | 'offline' | 'dns' | 'connection_refused' | 'ssl' | 'unknown';
  /** Whether device is online */
  isOnline?: boolean;
  /** Request timeout duration */
  timeout?: number;
  /** Retry strategy */
  retryStrategy?: 'exponential' | 'linear' | 'immediate' | 'none';
}

/**
 * Error boundary props for React Error Boundaries
 */
export interface ErrorBoundaryState {
  /** Whether an error has occurred */
  hasError: boolean;
  /** Current error being displayed */
  error: AppError | null;
  /** Error info from React */
  errorInfo?: {
    componentStack: string;
  };
  /** Number of errors caught by this boundary */
  errorCount: number;
  /** Last error timestamp */
  lastErrorTime?: string;
}

/**
 * Error recovery options for user interaction
 */
export interface ErrorRecoveryOptions {
  /** Text to display for the action */
  label: string;
  /** Action to perform */
  action: ErrorRecoveryAction;
  /** URL to navigate to (for navigate action) */
  url?: string;
  /** Function to call for custom actions */
  handler?: () => void | Promise<void>;
  /** Whether action is primary (highlighted) */
  primary?: boolean;
  /** Whether action is destructive */
  destructive?: boolean;
  /** Icon to display with action */
  icon?: string;
}

/**
 * Error notification configuration
 */
export interface ErrorNotification {
  /** Error to display */
  error: AppError;
  /** Notification type */
  type: 'toast' | 'banner' | 'modal' | 'inline';
  /** Auto-dismiss timeout (0 = no auto-dismiss) */
  autoHideDelay?: number;
  /** Whether notification can be dismissed by user */
  dismissible: boolean;
  /** Recovery options to show */
  recoveryOptions?: ErrorRecoveryOptions[];
  /** Position for toast notifications */
  position?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right' | 'top-center' | 'bottom-center';
}

/**
 * Error filtering options
 */
export interface ErrorFilter {
  /** Filter by categories */
  categories?: ErrorCategory[];
  /** Filter by severity levels */
  severities?: ErrorSeverity[];
  /** Filter by sources */
  sources?: string[];
  /** Filter by date range */
  dateRange?: {
    start: Date;
    end: Date;
  };
  /** Filter dismissed errors */
  includeDismissed?: boolean;
  /** Filter reported errors */
  includeReported?: boolean;
  /** Text search in messages */
  searchText?: string;
  /** Filter by persistence level */
  persistenceLevel?: ErrorPersistenceLevel[];
}

/**
 * Error statistics interface
 */
export interface ErrorStats {
  /** Total error count */
  total: number;
  /** Count by category */
  byCategory: Record<ErrorCategory, number>;
  /** Count by severity */
  bySeverity: Record<ErrorSeverity, number>;
  /** Most common error messages */
  topErrors: Array<{
    message: string;
    count: number;
    lastOccurrence: string;
  }>;
  /** Error trend data */
  trend: Array<{
    date: string;
    count: number;
  }>;
  /** Resolution statistics */
  resolution: {
    dismissed: number;
    retried: number;
    reported: number;
    unresolved: number;
  };
}

/**
 * Error reporting configuration
 */
export interface ErrorReportingConfig {
  /** Whether error reporting is enabled */
  enabled: boolean;
  /** API endpoint for error reporting */
  endpoint?: string;
  /** API key for error reporting service */
  apiKey?: string;
  /** Automatically report errors above this severity */
  autoReportSeverity?: ErrorSeverity;
  /** Include user context in reports */
  includeUserContext: boolean;
  /** Include stack traces in reports */
  includeStackTrace: boolean;
  /** Maximum errors to report per session */
  maxReportsPerSession?: number;
  /** Batch reporting configuration */
  batching?: {
    enabled: boolean;
    batchSize: number;
    flushInterval: number;
  };
}

/**
 * Error state management configuration
 */
export interface ErrorConfig {
  /** Maximum errors to keep in memory */
  maxErrors: number;
  /** Default timeout for error display (ms) */
  defaultTimeout: number;
  /** Auto-clear dismissed errors after (ms) */
  autoClearTimeout: number;
  /** Maximum retry attempts for retryable errors */
  maxRetries: number;
  /** Enable error persistence across sessions */
  persistErrors: boolean;
  /** Error reporting configuration */
  reporting: ErrorReportingConfig;
  /** Default recovery actions by category */
  defaultRecoveryActions: Partial<Record<ErrorCategory, ErrorRecoveryAction[]>>;
  /** Auto-dismiss errors by severity */
  autoHideBySeverity: Partial<Record<ErrorSeverity, number>>;
}

/**
 * Hook return interface for useError
 */
export interface UseErrorReturn {
  /** Current errors in state */
  errors: AppError[];
  /** Add a new error */
  addError: (error: Partial<AppError> & Pick<AppError, 'message' | 'category'>) => string;
  /** Remove error by ID */
  removeError: (id: string) => void;
  /** Clear all errors */
  clearErrors: () => void;
  /** Clear errors by category */
  clearErrorsByCategory: (category: ErrorCategory) => void;
  /** Clear dismissed errors */
  clearDismissedErrors: () => void;
  /** Dismiss error (mark as dismissed) */
  dismissError: (id: string) => void;
  /** Retry error (for retryable errors) */
  retryError: (id: string) => Promise<void>;
  /** Report error to external service */
  reportError: (id: string) => Promise<void>;
  /** Get errors with filtering */
  getErrors: (filter?: ErrorFilter) => AppError[];
  /** Get error statistics */
  getErrorStats: () => ErrorStats;
  /** Update error configuration */
  updateConfig: (config: Partial<ErrorConfig>) => void;
  /** Current configuration */
  config: ErrorConfig;
  /** Whether any critical errors exist */
  hasCriticalErrors: boolean;
  /** Whether any unresolved errors exist */
  hasUnresolvedErrors: boolean;
  /** Error count by severity */
  errorCountBySeverity: Record<ErrorSeverity, number>;
  /** Subscribe to error changes */
  onErrorChange: (callback: (errors: AppError[]) => void) => () => void;
}

/**
 * Error boundary props interface
 */
export interface ErrorBoundaryProps {
  /** Children to render when no error */
  children: React.ReactNode;
  /** Fallback component to render on error */
  fallback?: React.ComponentType<ErrorBoundaryFallbackProps>;
  /** Callback when error occurs */
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
  /** Component name for debugging */
  componentName?: string;
  /** Whether to isolate errors to this boundary */
  isolate?: boolean;
  /** Recovery actions to offer */
  recoveryActions?: ErrorRecoveryOptions[];
}

/**
 * Error boundary fallback props
 */
export interface ErrorBoundaryFallbackProps {
  /** Error that occurred */
  error: AppError;
  /** Error info from React */
  errorInfo?: React.ErrorInfo;
  /** Reset error state */
  resetError: () => void;
  /** Retry the failed operation */
  retry?: () => void;
  /** Recovery options */
  recoveryOptions?: ErrorRecoveryOptions[];
}

// Error severity mapping to log levels
export const ERROR_SEVERITY_TO_LOG_LEVEL: Record<ErrorSeverity, LogLevel> = {
  low: 'warn',
  medium: 'error',
  high: 'error',
  critical: 'fatal',
} as const;

// Default recovery actions by category
export const DEFAULT_RECOVERY_ACTIONS: Record<ErrorCategory, ErrorRecoveryAction[]> = {
  api: ['retry', 'refresh', 'report'],
  network: ['retry', 'refresh', 'dismiss'],
  authentication: ['login', 'refresh', 'contact_support'],
  authorization: ['contact_support', 'dismiss'],
  validation: ['dismiss'],
  database: ['retry', 'refresh', 'report'],
  schema: ['refresh', 'report'],
  permission: ['contact_support', 'dismiss'],
  configuration: ['refresh', 'report'],
  system: ['refresh', 'report', 'contact_support'],
  user_input: ['dismiss'],
  file_upload: ['retry', 'dismiss'],
  performance: ['refresh', 'dismiss'],
  unknown: ['refresh', 'report'],
} as const;

// Auto-hide timeouts by severity (in milliseconds)
export const AUTO_HIDE_TIMEOUTS: Record<ErrorSeverity, number> = {
  low: 5000,
  medium: 8000,
  high: 0, // No auto-hide
  critical: 0, // No auto-hide
} as const;

// Default error configuration
export const DEFAULT_ERROR_CONFIG: ErrorConfig = {
  maxErrors: 100,
  defaultTimeout: 8000,
  autoClearTimeout: 60000, // 1 minute
  maxRetries: 3,
  persistErrors: true,
  reporting: {
    enabled: false,
    includeUserContext: true,
    includeStackTrace: true,
    maxReportsPerSession: 10,
    batching: {
      enabled: true,
      batchSize: 5,
      flushInterval: 30000,
    },
  },
  defaultRecoveryActions: DEFAULT_RECOVERY_ACTIONS,
  autoHideBySeverity: AUTO_HIDE_TIMEOUTS,
} as const;

/**
 * Utility function to create an API error
 */
export function createApiError(
  message: string,
  statusCode: number,
  details?: Partial<ApiError>
): ApiError {
  const severity: ErrorSeverity = 
    statusCode >= 500 ? 'critical' :
    statusCode >= 400 ? 'medium' : 'low';

  return {
    id: `api-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    message,
    category: statusCode === 401 ? 'authentication' : 
              statusCode === 403 ? 'authorization' : 'api',
    severity,
    statusCode,
    timestamp: new Date().toISOString(),
    persistence: 'session',
    recoveryActions: DEFAULT_RECOVERY_ACTIONS.api,
    retryable: statusCode >= 500 || statusCode === 408 || statusCode === 429,
    retryCount: 0,
    maxRetries: 3,
    timeout: AUTO_HIDE_TIMEOUTS[severity],
    ...details,
  };
}

/**
 * Utility function to create a validation error
 */
export function createValidationError(
  message: string,
  field?: string,
  details?: Partial<ValidationError>
): ValidationError {
  return {
    id: `validation-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    message,
    category: 'validation',
    severity: 'low',
    field,
    timestamp: new Date().toISOString(),
    persistence: 'temporary',
    recoveryActions: ['dismiss'],
    retryable: false,
    timeout: AUTO_HIDE_TIMEOUTS.low,
    ...details,
  };
}

/**
 * Utility function to create a network error
 */
export function createNetworkError(
  message: string,
  networkErrorType: NetworkError['networkErrorType'],
  details?: Partial<NetworkError>
): NetworkError {
  return {
    id: `network-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    message,
    category: 'network',
    severity: 'medium',
    networkErrorType,
    timestamp: new Date().toISOString(),
    persistence: 'session',
    recoveryActions: DEFAULT_RECOVERY_ACTIONS.network,
    retryable: true,
    retryCount: 0,
    maxRetries: 5,
    timeout: AUTO_HIDE_TIMEOUTS.medium,
    ...details,
  };
}

/**
 * Utility function to determine if an error is retryable
 */
export function isRetryableError(error: AppError): boolean {
  if (!error.retryable) return false;
  if (error.retryCount && error.maxRetries && error.retryCount >= error.maxRetries) return false;
  return true;
}

/**
 * Utility function to get user-friendly error message
 */
export function getUserFriendlyMessage(error: AppError): string {
  switch (error.category) {
    case 'network':
      return 'Unable to connect to the server. Please check your internet connection and try again.';
    case 'authentication':
      return 'Your session has expired. Please log in again to continue.';
    case 'authorization':
      return 'You do not have permission to perform this action. Please contact your administrator.';
    case 'validation':
      return error.message || 'Please correct the highlighted fields and try again.';
    case 'database':
      return 'A database error occurred. Please try again or contact support if the problem persists.';
    default:
      return error.message || 'An unexpected error occurred. Please try again.';
  }
}