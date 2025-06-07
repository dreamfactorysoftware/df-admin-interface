/**
 * Comprehensive error handling types for DreamFactory Admin Interface
 * 
 * This module provides complete type definitions for the error handling system including:
 * - Error classification and categorization types
 * - Error boundary integration interfaces
 * - Retry mechanism and circuit breaker configurations
 * - Error context collection and reporting structures
 * - User-friendly error message and recovery action types
 * - Metrics and monitoring interfaces
 * 
 * Supports React 19 error boundaries, Next.js middleware patterns, and comprehensive
 * error recovery workflows with accessibility and internationalization considerations.
 * 
 * @fileoverview Comprehensive error handling type definitions
 * @version 1.0.0
 * @since React 19.0.0 / Next.js 15.1+
 */

import React from 'react';
import { ApiErrorResponse, HttpStatusCode } from '@/types/api';

// ============================================================================
// Core Error Types and Classifications
// ============================================================================

/**
 * Primary error type classification for different error scenarios
 */
export enum ErrorType {
  /** Network connectivity and communication errors */
  NETWORK = 'NETWORK',
  /** Input validation and form errors */
  VALIDATION = 'VALIDATION',
  /** Authentication and session errors */
  AUTHENTICATION = 'AUTHENTICATION',
  /** Authorization and permission errors */
  AUTHORIZATION = 'AUTHORIZATION',
  /** Server-side processing errors */
  SERVER = 'SERVER',
  /** Client-side request errors */
  CLIENT = 'CLIENT',
  /** System-level and unexpected errors */
  SYSTEM = 'SYSTEM',
}

/**
 * Error severity levels for prioritization and handling
 */
export enum ErrorSeverity {
  /** Minor issues that don't affect functionality */
  LOW = 'LOW',
  /** Issues that affect some functionality */
  MEDIUM = 'MEDIUM',
  /** Issues that significantly impact functionality */
  HIGH = 'HIGH',
  /** Issues that prevent application usage */
  CRITICAL = 'CRITICAL',
}

/**
 * Error categories for organizational and filtering purposes
 */
export enum ErrorCategory {
  /** User input and interaction errors */
  USER_INPUT = 'USER_INPUT',
  /** Infrastructure and network errors */
  INFRASTRUCTURE = 'INFRASTRUCTURE',
  /** Security and authentication errors */
  SECURITY = 'SECURITY',
  /** Application logic and processing errors */
  APPLICATION = 'APPLICATION',
  /** External service and integration errors */
  EXTERNAL_SERVICE = 'EXTERNAL_SERVICE',
  /** Database and data access errors */
  DATABASE = 'DATABASE',
  /** Configuration and setup errors */
  CONFIGURATION = 'CONFIGURATION',
}

/**
 * Circuit breaker states for preventing cascade failures
 */
export enum CircuitBreakerState {
  /** Normal operation, requests pass through */
  CLOSED = 'CLOSED',
  /** Failure threshold exceeded, requests blocked */
  OPEN = 'OPEN',
  /** Testing if service has recovered */
  HALF_OPEN = 'HALF_OPEN',
}

// ============================================================================
// Base Error Interfaces
// ============================================================================

/**
 * Base error interface for all application errors
 */
export interface BaseError {
  /** Error type classification */
  type: ErrorType;
  /** Error severity level */
  severity: ErrorSeverity;
  /** Error category for organization */
  category: ErrorCategory;
  /** Unique error code for programmatic handling */
  code: string;
  /** Human-readable error message */
  message: string;
  /** Original error object for debugging */
  originalError?: any;
  /** Whether this error can be retried */
  isRetryable: boolean;
  /** Timestamp when error occurred */
  timestamp: string;
  /** Whether this error should be shown to users */
  userFacing: boolean;
  /** Correlation ID for request tracing */
  correlationId?: string;
  /** Additional error context */
  context?: ErrorContext;
}

/**
 * Network-specific error interface
 */
export interface NetworkError extends BaseError {
  type: ErrorType.NETWORK;
  /** Network error code (e.g., 'TIMEOUT', 'CONNECTION_REFUSED') */
  networkCode?: string;
  /** Whether the device is currently offline */
  isOffline?: boolean;
  /** Request URL that failed */
  url?: string;
  /** Request method that failed */
  method?: string;
}

/**
 * Validation-specific error interface
 */
export interface ValidationError extends BaseError {
  type: ErrorType.VALIDATION;
  /** Field-specific validation errors */
  fieldErrors: Record<string, string[]>;
  /** Form or schema that failed validation */
  formId?: string;
  /** Validation rules that were violated */
  violatedRules?: string[];
}

/**
 * Authentication-specific error interface
 */
export interface AuthenticationError extends BaseError {
  type: ErrorType.AUTHENTICATION;
  /** Whether user needs to log in again */
  requiresLogin: boolean;
  /** Session ID that expired */
  sessionId?: string;
  /** Authentication method that failed */
  authMethod?: string;
}

/**
 * Authorization-specific error interface
 */
export interface AuthorizationError extends BaseError {
  type: ErrorType.AUTHORIZATION;
  /** Required permissions for the action */
  requiredPermissions: string[];
  /** User's current permissions */
  userPermissions?: string[];
  /** Resource that was accessed */
  resource?: string;
  /** Action that was attempted */
  action?: string;
}

/**
 * Server-specific error interface
 */
export interface ServerError extends BaseError {
  type: ErrorType.SERVER;
  /** HTTP status code */
  statusCode: HttpStatusCode;
  /** Server error message */
  serverMessage?: string;
  /** Server trace ID */
  traceId?: string;
  /** Service that generated the error */
  service?: string;
}

/**
 * Client-specific error interface
 */
export interface ClientError extends BaseError {
  type: ErrorType.CLIENT;
  /** HTTP status code */
  statusCode: HttpStatusCode;
  /** Request data that caused the error */
  requestData?: any;
  /** Invalid parameters */
  invalidParams?: string[];
}

/**
 * System-specific error interface
 */
export interface SystemError extends BaseError {
  type: ErrorType.SYSTEM;
  /** Stack trace for debugging */
  stackTrace?: string;
  /** Component where error occurred */
  component?: string;
  /** Browser or runtime information */
  runtime?: string;
}

/**
 * Union type for all application errors
 */
export type AppError = 
  | NetworkError 
  | ValidationError 
  | AuthenticationError 
  | AuthorizationError 
  | ServerError 
  | ClientError 
  | SystemError;

// ============================================================================
// Error Context and Reporting
// ============================================================================

/**
 * Comprehensive error context for debugging and analysis
 */
export interface ErrorContext {
  /** User-related context */
  user?: {
    id?: string;
    email?: string;
    role?: string;
    lastAction?: string;
    sessionStart?: string;
  };
  
  /** Application-related context */
  application?: {
    route?: string;
    component?: string;
    feature?: string;
    version: string;
    buildId: string;
    timestamp: string;
  };
  
  /** Environment-related context */
  environment?: {
    userAgent?: string;
    url?: string;
    referrer?: string;
    viewport?: {
      width: number;
      height: number;
    };
    online?: boolean;
    language?: string;
  };
  
  /** Session-related context */
  session?: {
    id?: string;
    duration?: number;
    lastActivity?: string;
    permissions?: string[];
  };
  
  /** Performance-related context */
  performance?: {
    navigationStart?: number;
    loadTime?: number;
    memory?: {
      usedJSMemorySize?: number;
      totalJSMemorySize?: number;
    };
  };
}

/**
 * Error reporting configuration
 */
export interface ErrorReportingOptions {
  /** Whether error reporting is enabled */
  enabled: boolean;
  /** Sampling rate for error reporting (0.0 to 1.0) */
  sampleRate: number;
  /** Whether to include stack traces */
  includeStackTrace: boolean;
  /** Whether to include user context */
  includeUserContext: boolean;
  /** Whether to include application context */
  includeAppContext: boolean;
  /** Fields to exclude from error reports */
  excludeFields: string[];
  /** External monitoring service endpoint */
  endpoint?: string;
  /** API key for monitoring service */
  apiKey?: string;
}

// ============================================================================
// Retry and Circuit Breaker Configuration
// ============================================================================

/**
 * Retry mechanism configuration
 */
export interface RetryConfig {
  /** Maximum number of retry attempts */
  maxAttempts: number;
  /** Initial delay between retries in milliseconds */
  initialDelay: number;
  /** Maximum delay between retries in milliseconds */
  maxDelay: number;
  /** Backoff multiplier for exponential backoff */
  backoffFactor: number;
  /** Whether to add random jitter to delays */
  jitter: boolean;
  /** HTTP status codes that should trigger retries */
  retryableStatusCodes: number[];
  /** Network error codes that should trigger retries */
  retryableNetworkErrors: string[];
}

/**
 * Circuit breaker configuration
 */
export interface CircuitBreakerConfig {
  /** Number of failures before opening circuit */
  failureThreshold: number;
  /** Time to wait before attempting recovery in milliseconds */
  recoveryTimeout: number;
  /** Period for monitoring failures in milliseconds */
  monitoringPeriod: number;
  /** Maximum attempts in half-open state */
  halfOpenMaxAttempts: number;
}

/**
 * Retry attempt information
 */
export interface RetryAttempt {
  /** Attempt number */
  attempt: number;
  /** Delay before this attempt in milliseconds */
  delay: number;
  /** Error that triggered the retry */
  error: AppError;
  /** Timestamp of the attempt */
  timestamp: string;
}

// ============================================================================
// User Experience and Recovery
// ============================================================================

/**
 * Recovery action types for user-initiated error recovery
 */
export type RecoveryActionType = 
  | 'retry'
  | 'refresh'
  | 'login'
  | 'dismiss'
  | 'contact'
  | 'navigate'
  | 'reset';

/**
 * Recovery action configuration
 */
export interface RecoveryAction {
  /** Type of recovery action */
  type: RecoveryActionType;
  /** Display label for the action */
  label: string;
  /** Whether this is the primary action */
  primary: boolean;
  /** URL for navigation actions */
  url?: string;
  /** Accessibility configuration */
  accessibility?: {
    ariaLabel: string;
    keyboardShortcut?: string;
    description?: string;
  };
}

/**
 * User-friendly error message structure
 */
export interface UserFriendlyErrorMessage {
  /** Main error title */
  title: string;
  /** Primary error message */
  message: string;
  /** Actionable message with guidance */
  actionableMessage: string;
  /** Available recovery options */
  recoveryOptions: RecoveryAction[];
  /** Technical details for developers */
  technicalDetails?: {
    code: string;
    timestamp: string;
    correlationId?: string;
  };
  /** Accessibility enhancements */
  accessibility?: {
    ariaLabel: string;
    role: string;
    screenReaderText: string;
  };
}

/**
 * Error recovery options configuration
 */
export interface ErrorRecoveryOptions {
  /** Whether to prevent automatic redirects */
  preventRedirect?: boolean;
  /** Custom recovery actions */
  customActions?: RecoveryAction[];
  /** Component context for targeted recovery */
  component?: string;
  /** Feature context for scoped recovery */
  feature?: string;
  /** Whether to show technical details */
  showTechnicalDetails?: boolean;
}

// ============================================================================
// Error Boundary Integration
// ============================================================================

/**
 * React Error Boundary information
 */
export interface ErrorBoundaryInfo {
  /** Classified error information */
  error: AppError;
  /** React error info with component stack */
  errorInfo?: React.ErrorInfo;
  /** Function to retry/reset the error boundary */
  retry: () => void;
  /** Additional recovery actions */
  recoveryActions?: RecoveryAction[];
}

/**
 * Error boundary component props
 */
export interface ErrorBoundaryProps {
  /** Custom fallback component */
  fallback?: React.ComponentType<ErrorBoundaryInfo>;
  /** Error reporting callback */
  onError?: (error: AppError, errorInfo: React.ErrorInfo) => void;
  /** Recovery options */
  recoveryOptions?: ErrorRecoveryOptions;
  /** Whether to isolate errors to this boundary */
  isolateErrors?: boolean;
}

// ============================================================================
// Metrics and Monitoring
// ============================================================================

/**
 * Error metrics for monitoring and analysis
 */
export interface ErrorMetrics {
  /** Total number of errors */
  totalErrors: number;
  /** Errors by type classification */
  errorsByType: Record<ErrorType, number>;
  /** Errors by category */
  errorsByCategory: Record<ErrorCategory, number>;
  /** Total retry attempts */
  retryAttempts: number;
  /** Successfully recovered errors */
  recoveredErrors: number;
  /** Average error resolution time */
  averageResolutionTime?: number;
  /** Circuit breaker state changes */
  circuitBreakerStateChanges?: number;
}

/**
 * Error handler event types
 */
export type ErrorHandlerEventType = 
  | 'error'
  | 'recovery'
  | 'retry'
  | 'circuit_breaker_state_change'
  | 'metrics_update';

/**
 * Error handler event
 */
export interface ErrorHandlerEvent {
  /** Event type */
  type: ErrorHandlerEventType;
  /** Error information */
  error?: AppError;
  /** User-friendly message */
  userMessage?: UserFriendlyErrorMessage;
  /** Recovery action taken */
  recoveryAction?: RecoveryAction;
  /** Retry attempt information */
  retryAttempt?: RetryAttempt;
  /** Circuit breaker state */
  circuitBreakerState?: CircuitBreakerState;
  /** Updated metrics */
  metrics?: ErrorMetrics;
  /** Event timestamp */
  timestamp: string;
}

/**
 * Error handler event listener function
 */
export type ErrorHandlerEventListener = (event: ErrorHandlerEvent) => void;

// ============================================================================
// Configuration and Setup
// ============================================================================

/**
 * Comprehensive error handler configuration
 */
export interface ErrorHandlerConfig {
  /** Retry mechanism configuration */
  retry: RetryConfig;
  /** Circuit breaker configuration */
  circuitBreaker: CircuitBreakerConfig;
  /** Error reporting configuration */
  reporting: ErrorReportingOptions;
  /** User experience configuration */
  userExperience: {
    /** Whether to show retry buttons */
    showRetryButton: boolean;
    /** Whether to automatically retry transient errors */
    autoRetryTransientErrors: boolean;
    /** Whether to show technical error details */
    showErrorDetails: boolean;
    /** Notification duration in milliseconds */
    notificationDuration: number;
    /** Whether to enable accessibility features */
    enableAccessibility: boolean;
    /** Whether to support internationalization */
    supportI18n: boolean;
  };
  /** Performance and monitoring configuration */
  performance: {
    /** Whether to track error metrics */
    trackErrorMetrics: boolean;
    /** Whether to enable correlation IDs */
    correlationIdEnabled: boolean;
    /** Response time thresholds for warnings */
    responseTimeThresholds: {
      warn: number;
      error: number;
    };
  };
}

// ============================================================================
// Hook Interface and Utilities
// ============================================================================

/**
 * Error context collector function type
 */
export type ErrorContextCollector = (config: ErrorHandlerConfig) => ErrorContext;

/**
 * Error message generator function type
 */
export type ErrorMessageGenerator = (error: AppError, config: ErrorHandlerConfig) => UserFriendlyErrorMessage;

/**
 * Error handler hook return interface
 */
export interface UseErrorHandlerReturn {
  /** Handle any error with comprehensive processing */
  handleError: (error: any, options?: Partial<ErrorRecoveryOptions>) => Promise<UserFriendlyErrorMessage>;
  
  /** Retry operation with circuit breaker and exponential backoff */
  retryWithBackoff: <T>(
    operation: () => Promise<T>,
    options?: Partial<RetryConfig>
  ) => Promise<T>;
  
  /** Create React Error Boundary component */
  createErrorBoundary: (
    fallbackComponent?: React.ComponentType<ErrorBoundaryInfo>
  ) => React.ComponentType<React.PropsWithChildren<{}>>;
  
  /** Recover from a specific error */
  recoverFromError: (errorId: string, action: RecoveryAction) => Promise<boolean>;
  
  /** Clear all active errors */
  clearErrors: () => void;
  
  /** Get current active errors */
  activeErrors: AppError[];
  
  /** Get error metrics */
  getMetrics: () => ErrorMetrics;
  
  /** Reset circuit breaker */
  resetCircuitBreaker: () => void;
  
  /** Get circuit breaker state */
  getCircuitBreakerState: () => CircuitBreakerState;
  
  /** Add event listener */
  addEventListener: (listener: ErrorHandlerEventListener) => () => void;
}

// ============================================================================
// Utility Types for External Integration
// ============================================================================

/**
 * API error response classifier
 */
export type ApiErrorClassifier = (response: ApiErrorResponse) => AppError;

/**
 * Network error detector
 */
export type NetworkErrorDetector = (error: any) => boolean;

/**
 * Error sanitizer for production environments
 */
export type ErrorSanitizer = (error: AppError, config: ErrorHandlerConfig) => AppError;

/**
 * Error recovery strategy
 */
export type ErrorRecoveryStrategy = (error: AppError) => RecoveryAction[];

/**
 * Error reporting service integration
 */
export interface ErrorReportingService {
  /** Report error to external service */
  report: (error: AppError, context: ErrorContext) => Promise<void>;
  /** Batch report multiple errors */
  batchReport: (errors: Array<{ error: AppError; context: ErrorContext }>) => Promise<void>;
  /** Configure service settings */
  configure: (options: ErrorReportingOptions) => void;
}

export default ErrorType;