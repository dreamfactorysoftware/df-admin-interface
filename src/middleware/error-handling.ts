/**
 * Error Handling Middleware for DreamFactory Admin Interface
 * 
 * Comprehensive error capture, processing, and recovery mechanisms providing
 * graceful degradation and optimal user experience. Migrates Angular error
 * interceptor logic to Next.js edge-based middleware with enhanced capabilities.
 * 
 * Key Features:
 * - Next.js 15.1+ edge runtime compatibility with sub-100ms processing
 * - HTTP error status code handling (401, 403, 404, 500+) with appropriate responses
 * - React Error Boundary integration for client-side error capture
 * - Security compliance with comprehensive audit logging and error tracking
 * - Exponential backoff retry mechanisms for transient failures
 * - Development mode enhanced debugging with detailed error context
 * - Integration with existing authentication flow and session management
 * - MSW mock error response handling for development testing
 * 
 * Performance Requirements:
 * - Middleware processing under 100ms for error handling
 * - Memory-efficient error context management
 * - Optimized error logging for edge runtime constraints
 * 
 * Security Features:
 * - Sanitized error responses to prevent information disclosure
 * - Comprehensive audit logging for security events
 * - Rate limiting integration for error-based attacks
 * - CSRF and XSS protection in error responses
 * 
 * @fileoverview Next.js middleware for comprehensive error handling and recovery
 * @version 1.0.0
 * @since Next.js 15.1+ / React 19.0.0
 */

import { NextRequest, NextResponse } from 'next/server';
import type {
  MiddlewareRequest,
  MiddlewareResponseContext,
  MiddlewareError,
  MiddlewareLogContext,
  AuditLogEntry,
  TokenValidationContext,
  SessionManagementContext,
  MiddlewareMetrics,
  SecurityHeaderConfig,
  AuditEventType
} from './types';
import {
  extractToken,
  validateSessionToken,
  createErrorResponse,
  createAuthRedirect,
  applyHeaders,
  SECURITY_HEADERS,
  getClientIP,
  isAPIRequest,
  isStaticAsset,
  requiresAuthentication,
  createPerformanceMarker,
  EdgeRateLimiter,
  logAuditEntry,
  logAuthEvent,
  createAuditLogEntry,
  getEnvironmentInfo,
  isDevelopmentMode,
  SessionInfo
} from './utils';

// ============================================================================
// ERROR HANDLING CONFIGURATION
// ============================================================================

/**
 * Error handling configuration for different environments
 * Provides environment-specific error handling behavior
 */
interface ErrorHandlingConfig {
  /** Enable detailed error logging */
  enableDetailedLogging: boolean;
  
  /** Enable retry mechanisms */
  enableRetryMechanisms: boolean;
  
  /** Maximum retry attempts for failed requests */
  maxRetryAttempts: number;
  
  /** Base delay for exponential backoff in milliseconds */
  baseRetryDelay: number;
  
  /** Maximum delay for exponential backoff in milliseconds */
  maxRetryDelay: number;
  
  /** Enable development mode error details */
  enableDevelopmentDetails: boolean;
  
  /** Enable security event logging */
  enableSecurityLogging: boolean;
  
  /** Rate limit window for error-based attacks (ms) */
  rateLimitWindow: number;
  
  /** Maximum errors per window before rate limiting */
  maxErrorsPerWindow: number;
  
  /** Sanitize error messages in production */
  sanitizeProductionErrors: boolean;
}

/**
 * Default error handling configuration
 */
const DEFAULT_ERROR_CONFIG: ErrorHandlingConfig = {
  enableDetailedLogging: true,
  enableRetryMechanisms: true,
  maxRetryAttempts: 3,
  baseRetryDelay: 1000, // 1 second
  maxRetryDelay: 30000, // 30 seconds
  enableDevelopmentDetails: isDevelopmentMode(),
  enableSecurityLogging: true,
  rateLimitWindow: 900000, // 15 minutes
  maxErrorsPerWindow: 100,
  sanitizeProductionErrors: true,
};

/**
 * HTTP status code categories for error handling
 */
enum ErrorCategory {
  CLIENT_ERROR = 'client_error',
  SERVER_ERROR = 'server_error',
  AUTHENTICATION_ERROR = 'authentication_error',
  AUTHORIZATION_ERROR = 'authorization_error',
  VALIDATION_ERROR = 'validation_error',
  NETWORK_ERROR = 'network_error',
  SYSTEM_ERROR = 'system_error',
}

/**
 * Error severity levels for logging and alerting
 */
enum ErrorSeverity {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical',
}

/**
 * Error recovery strategies for different error types
 */
enum RecoveryStrategy {
  RETRY = 'retry',
  REDIRECT = 'redirect',
  FALLBACK = 'fallback',
  ABORT = 'abort',
}

// ============================================================================
// ERROR CLASSIFICATION AND HANDLING
// ============================================================================

/**
 * Comprehensive error classification system
 * Maps HTTP status codes to error categories, severity, and recovery strategies
 */
const ERROR_CLASSIFICATION = {
  // Authentication Errors (401)
  401: {
    category: ErrorCategory.AUTHENTICATION_ERROR,
    severity: ErrorSeverity.HIGH,
    recovery: RecoveryStrategy.REDIRECT,
    message: 'Authentication required',
    action: 'redirect_to_login',
    retryable: false,
    logSecurity: true,
  },
  
  // Authorization Errors (403)
  403: {
    category: ErrorCategory.AUTHORIZATION_ERROR,
    severity: ErrorSeverity.HIGH,
    recovery: RecoveryStrategy.ABORT,
    message: 'Access denied',
    action: 'show_access_denied',
    retryable: false,
    logSecurity: true,
  },
  
  // Not Found Errors (404)
  404: {
    category: ErrorCategory.CLIENT_ERROR,
    severity: ErrorSeverity.MEDIUM,
    recovery: RecoveryStrategy.FALLBACK,
    message: 'Resource not found',
    action: 'show_not_found',
    retryable: false,
    logSecurity: false,
  },
  
  // Validation Errors (400, 422)
  400: {
    category: ErrorCategory.VALIDATION_ERROR,
    severity: ErrorSeverity.MEDIUM,
    recovery: RecoveryStrategy.ABORT,
    message: 'Invalid request',
    action: 'show_validation_error',
    retryable: false,
    logSecurity: false,
  },
  
  422: {
    category: ErrorCategory.VALIDATION_ERROR,
    severity: ErrorSeverity.MEDIUM,
    recovery: RecoveryStrategy.ABORT,
    message: 'Validation failed',
    action: 'show_validation_error',
    retryable: false,
    logSecurity: false,
  },
  
  // Rate Limiting (429)
  429: {
    category: ErrorCategory.CLIENT_ERROR,
    severity: ErrorSeverity.MEDIUM,
    recovery: RecoveryStrategy.RETRY,
    message: 'Too many requests',
    action: 'retry_with_backoff',
    retryable: true,
    logSecurity: true,
  },
  
  // Server Errors (500+)
  500: {
    category: ErrorCategory.SERVER_ERROR,
    severity: ErrorSeverity.CRITICAL,
    recovery: RecoveryStrategy.RETRY,
    message: 'Internal server error',
    action: 'retry_with_backoff',
    retryable: true,
    logSecurity: true,
  },
  
  502: {
    category: ErrorCategory.SERVER_ERROR,
    severity: ErrorSeverity.HIGH,
    recovery: RecoveryStrategy.RETRY,
    message: 'Bad gateway',
    action: 'retry_with_backoff',
    retryable: true,
    logSecurity: false,
  },
  
  503: {
    category: ErrorCategory.SERVER_ERROR,
    severity: ErrorSeverity.HIGH,
    recovery: RecoveryStrategy.RETRY,
    message: 'Service unavailable',
    action: 'retry_with_backoff',
    retryable: true,
    logSecurity: false,
  },
  
  504: {
    category: ErrorCategory.SERVER_ERROR,
    severity: ErrorSeverity.HIGH,
    recovery: RecoveryStrategy.RETRY,
    message: 'Gateway timeout',
    action: 'retry_with_backoff',
    retryable: true,
    logSecurity: false,
  },
} as const;

/**
 * Enhanced error context for comprehensive error handling
 * Includes all necessary information for error processing and recovery
 */
interface ErrorContext {
  /** Original error information */
  error: Error | any;
  
  /** HTTP status code */
  statusCode: number;
  
  /** Request context */
  request: {
    method: string;
    url: string;
    headers: Record<string, string>;
    userAgent: string;
    clientIP: string;
    timestamp: Date;
  };
  
  /** User context if available */
  user?: {
    id?: number;
    email?: string;
    sessionId?: string;
    roles?: string[];
  };
  
  /** Error classification */
  classification: typeof ERROR_CLASSIFICATION[keyof typeof ERROR_CLASSIFICATION];
  
  /** Retry context */
  retry?: {
    attempt: number;
    maxAttempts: number;
    nextRetryDelay: number;
  };
  
  /** Development mode context */
  development?: {
    stack?: string;
    originalError?: any;
    debugInfo?: Record<string, any>;
  };
  
  /** Performance metrics */
  metrics: {
    processingTime: number;
    memoryUsage?: number;
  };
}

// ============================================================================
// ERROR PROCESSING FUNCTIONS
// ============================================================================

/**
 * Creates enhanced error context from request and error information
 * Provides comprehensive error analysis for proper handling
 */
function createErrorContext(
  error: any,
  request: NextRequest,
  sessionInfo?: SessionInfo | null,
  metrics?: { processingTime: number }
): ErrorContext {
  const statusCode = error?.status || error?.statusCode || 500;
  const classification = ERROR_CLASSIFICATION[statusCode as keyof typeof ERROR_CLASSIFICATION] || 
                        ERROR_CLASSIFICATION[500];
  
  const context: ErrorContext = {
    error,
    statusCode,
    request: {
      method: request.method,
      url: request.url,
      headers: Object.fromEntries(request.headers.entries()),
      userAgent: request.headers.get('user-agent') || 'unknown',
      clientIP: getClientIP(request),
      timestamp: new Date(),
    },
    classification,
    metrics: {
      processingTime: metrics?.processingTime || 0,
    },
  };
  
  // Add user context if available
  if (sessionInfo) {
    context.user = {
      id: parseInt(sessionInfo.userId),
      email: sessionInfo.email,
      sessionId: sessionInfo.sessionId,
      roles: sessionInfo.roles,
    };
  }
  
  // Add development mode context
  if (isDevelopmentMode() && DEFAULT_ERROR_CONFIG.enableDevelopmentDetails) {
    context.development = {
      stack: error?.stack,
      originalError: error,
      debugInfo: {
        timestamp: new Date().toISOString(),
        nodeVersion: process.version,
        environment: process.env.NODE_ENV,
        requestId: `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      },
    };
  }
  
  return context;
}

/**
 * Sanitizes error messages for production environments
 * Prevents sensitive information disclosure while maintaining useful feedback
 */
function sanitizeErrorMessage(
  error: any,
  statusCode: number,
  isProduction: boolean = !isDevelopmentMode()
): string {
  const classification = ERROR_CLASSIFICATION[statusCode as keyof typeof ERROR_CLASSIFICATION];
  
  if (!isProduction || !DEFAULT_ERROR_CONFIG.sanitizeProductionErrors) {
    return error?.message || classification?.message || 'An unexpected error occurred';
  }
  
  // In production, return generic messages for security
  switch (statusCode) {
    case 401:
      return 'Authentication required. Please log in to continue.';
    case 403:
      return 'You do not have permission to access this resource.';
    case 404:
      return 'The requested resource was not found.';
    case 429:
      return 'Too many requests. Please try again later.';
    case 500:
    case 502:
    case 503:
    case 504:
      return 'A server error occurred. Please try again later.';
    default:
      return classification?.message || 'An error occurred while processing your request.';
  }
}

/**
 * Calculates exponential backoff delay with jitter
 * Provides progressive delay for retry mechanisms
 */
function calculateBackoffDelay(
  attempt: number,
  baseDelay: number = DEFAULT_ERROR_CONFIG.baseRetryDelay,
  maxDelay: number = DEFAULT_ERROR_CONFIG.maxRetryDelay
): number {
  const exponentialDelay = baseDelay * Math.pow(2, attempt - 1);
  const jitter = Math.random() * 0.1 * exponentialDelay; // 10% jitter
  return Math.min(exponentialDelay + jitter, maxDelay);
}

/**
 * Determines if an error should trigger a retry attempt
 * Analyzes error type and context to make intelligent retry decisions
 */
function shouldRetryError(
  errorContext: ErrorContext,
  currentAttempt: number = 1
): boolean {
  const { classification } = errorContext;
  const config = DEFAULT_ERROR_CONFIG;
  
  // Check if retries are enabled and error is retryable
  if (!config.enableRetryMechanisms || !classification.retryable) {
    return false;
  }
  
  // Check if we haven't exceeded max attempts
  if (currentAttempt >= config.maxRetryAttempts) {
    return false;
  }
  
  // Additional checks for specific error types
  switch (errorContext.statusCode) {
    case 429: // Rate limiting
      return true;
    case 500:
    case 502:
    case 503:
    case 504:
      return true;
    default:
      return false;
  }
}

/**
 * Creates comprehensive audit log entry for error events
 * Ensures security compliance and monitoring requirements
 */
function createErrorAuditLog(
  errorContext: ErrorContext,
  action: string = 'error_occurred'
): AuditLogEntry {
  const { request, user, classification, statusCode } = errorContext;
  
  return {
    id: `audit_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    timestamp: new Date(),
    eventType: classification.logSecurity ? AuditEventType.SECURITY_VIOLATION : AuditEventType.SYSTEM_EVENT,
    action,
    result: 'failure',
    user: user ? {
      id: user.id,
      email: user.email,
      sessionId: user.sessionId,
      ipAddress: request.clientIP,
    } : {
      ipAddress: request.clientIP,
    },
    resource: {
      type: 'api_endpoint',
      path: new URL(request.url).pathname,
    },
    details: {
      statusCode,
      errorCategory: classification.category,
      errorSeverity: classification.severity,
      method: request.method,
      userAgent: request.userAgent,
      timestamp: request.timestamp.toISOString(),
      processingTime: errorContext.metrics.processingTime,
    },
    riskLevel: classification.severity === ErrorSeverity.CRITICAL ? 'critical' :
              classification.severity === ErrorSeverity.HIGH ? 'high' :
              classification.severity === ErrorSeverity.MEDIUM ? 'medium' : 'low',
    compliance: {
      gdpr: true, // Error logging for security compliance
      sox: classification.logSecurity,
    },
  };
}

// ============================================================================
// ERROR RESPONSE BUILDERS
// ============================================================================

/**
 * Creates standardized error response for API endpoints
 * Provides consistent error format across the application
 */
function createAPIErrorResponse(
  errorContext: ErrorContext,
  headers?: Record<string, string>
): NextResponse {
  const { statusCode, classification } = errorContext;
  const sanitizedMessage = sanitizeErrorMessage(
    errorContext.error,
    statusCode
  );
  
  const errorResponse = {
    error: {
      code: statusCode,
      message: sanitizedMessage,
      type: classification.category,
      timestamp: new Date().toISOString(),
      requestId: errorContext.development?.debugInfo?.requestId,
    },
    ...(isDevelopmentMode() && errorContext.development ? {
      debug: {
        stack: errorContext.development.stack,
        originalMessage: errorContext.error?.message,
        debugInfo: errorContext.development.debugInfo,
      },
    } : {}),
  };
  
  const response = NextResponse.json(errorResponse, { status: statusCode });
  
  // Apply security headers
  applyHeaders(response, {
    securityHeaders: true,
    addHeaders: {
      'X-Error-Type': classification.category,
      'X-Error-Severity': classification.severity,
      ...headers,
    },
  });
  
  return response;
}

/**
 * Creates HTML error page response for browser requests
 * Provides user-friendly error pages with recovery options
 */
function createHTMLErrorResponse(
  errorContext: ErrorContext
): NextResponse {
  const { statusCode, classification } = errorContext;
  const sanitizedMessage = sanitizeErrorMessage(
    errorContext.error,
    statusCode
  );
  
  // Determine redirect URL based on error type
  let redirectUrl = '/error';
  
  switch (statusCode) {
    case 401:
      redirectUrl = '/login';
      break;
    case 403:
      redirectUrl = '/access-denied';
      break;
    case 404:
      redirectUrl = '/not-found';
      break;
    default:
      redirectUrl = '/error';
  }
  
  // For authentication errors, preserve return URL
  if (statusCode === 401) {
    const url = new URL(errorContext.request.url);
    const returnUrl = encodeURIComponent(url.pathname + url.search);
    redirectUrl += `?returnUrl=${returnUrl}`;
  }
  
  // Create redirect response with error context
  const response = NextResponse.redirect(new URL(redirectUrl, errorContext.request.url));
  
  // Apply security headers and error context
  applyHeaders(response, {
    securityHeaders: true,
    addHeaders: {
      'X-Error-Type': classification.category,
      'X-Error-Code': statusCode.toString(),
      'X-Error-Message': encodeURIComponent(sanitizedMessage),
    },
  });
  
  return response;
}

/**
 * Creates retry response with appropriate headers
 * Supports exponential backoff for client-side retry mechanisms
 */
function createRetryResponse(
  errorContext: ErrorContext,
  retryAttempt: number
): NextResponse {
  const retryDelay = calculateBackoffDelay(retryAttempt);
  const maxAttempts = DEFAULT_ERROR_CONFIG.maxRetryAttempts;
  
  const retryResponse = {
    error: {
      code: errorContext.statusCode,
      message: sanitizeErrorMessage(errorContext.error, errorContext.statusCode),
      retryable: true,
      retryAfter: Math.ceil(retryDelay / 1000), // Convert to seconds
      maxAttempts,
      currentAttempt: retryAttempt,
    },
  };
  
  const response = NextResponse.json(retryResponse, { 
    status: errorContext.statusCode 
  });
  
  // Add retry headers
  applyHeaders(response, {
    securityHeaders: true,
    addHeaders: {
      'Retry-After': Math.ceil(retryDelay / 1000).toString(),
      'X-Retry-Attempt': retryAttempt.toString(),
      'X-Max-Retry-Attempts': maxAttempts.toString(),
      'X-Error-Retryable': 'true',
    },
  });
  
  return response;
}

// ============================================================================
// RATE LIMITING FOR ERROR-BASED ATTACKS
// ============================================================================

/**
 * Implements rate limiting for error-based attacks
 * Prevents abuse through excessive error generation
 */
function checkErrorRateLimit(
  request: NextRequest,
  statusCode: number
): { allowed: boolean; remaining: number; resetTime: number } {
  const clientIP = getClientIP(request);
  const key = `error_rate_${clientIP}_${statusCode}`;
  
  return EdgeRateLimiter.check(
    key,
    DEFAULT_ERROR_CONFIG.maxErrorsPerWindow,
    DEFAULT_ERROR_CONFIG.rateLimitWindow
  );
}

/**
 * Handles rate limit exceeded for error requests
 * Provides appropriate response when error rate limit is exceeded
 */
function handleErrorRateLimitExceeded(
  request: NextRequest,
  statusCode: number
): NextResponse {
  const rateLimitInfo = checkErrorRateLimit(request, statusCode);
  
  const response = NextResponse.json({
    error: {
      code: 429,
      message: 'Too many error requests. Please try again later.',
      type: 'rate_limit_exceeded',
      retryAfter: Math.ceil((rateLimitInfo.resetTime - Date.now()) / 1000),
    },
  }, { status: 429 });
  
  applyHeaders(response, {
    securityHeaders: true,
    addHeaders: {
      'Retry-After': Math.ceil((rateLimitInfo.resetTime - Date.now()) / 1000).toString(),
      'X-RateLimit-Limit': DEFAULT_ERROR_CONFIG.maxErrorsPerWindow.toString(),
      'X-RateLimit-Remaining': '0',
      'X-RateLimit-Reset': new Date(rateLimitInfo.resetTime).toISOString(),
    },
  });
  
  return response;
}

// ============================================================================
// MAIN ERROR HANDLING MIDDLEWARE
// ============================================================================

/**
 * Main error handling middleware function
 * Processes all errors and provides appropriate responses and recovery mechanisms
 */
export async function handleError(
  error: any,
  request: NextRequest,
  context?: {
    sessionInfo?: SessionInfo | null;
    metrics?: { processingTime: number };
    retryAttempt?: number;
  }
): Promise<NextResponse> {
  const performanceMarker = createPerformanceMarker();
  
  try {
    // Extract context information
    const sessionInfo = context?.sessionInfo;
    const retryAttempt = context?.retryAttempt || 1;
    
    // Create comprehensive error context
    const errorContext = createErrorContext(
      error,
      request,
      sessionInfo,
      context?.metrics
    );
    
    // Check rate limiting for error-based attacks
    const rateLimitCheck = checkErrorRateLimit(request, errorContext.statusCode);
    if (!rateLimitCheck.allowed) {
      // Log security event for rate limit violation
      const auditEntry = createErrorAuditLog(errorContext, 'error_rate_limit_exceeded');
      logAuditEntry(auditEntry);
      
      return handleErrorRateLimitExceeded(request, errorContext.statusCode);
    }
    
    // Log comprehensive audit entry
    if (DEFAULT_ERROR_CONFIG.enableSecurityLogging) {
      const auditEntry = createErrorAuditLog(errorContext);
      logAuditEntry(auditEntry);
    }
    
    // Handle authentication errors with session cleanup
    if (errorContext.statusCode === 401) {
      // Log authentication failure
      if (sessionInfo) {
        logAuthEvent(request, 'auth_failure', sessionInfo, errorContext.error?.message);
      }
      
      // Clear session and redirect to login
      if (isAPIRequest(request)) {
        return createAPIErrorResponse(errorContext);
      } else {
        return createAuthRedirect(request);
      }
    }
    
    // Handle authorization errors
    if (errorContext.statusCode === 403) {
      // Log access denied event
      if (sessionInfo) {
        logAuthEvent(request, 'access_denied', sessionInfo, 'Insufficient permissions');
      }
      
      if (isAPIRequest(request)) {
        return createAPIErrorResponse(errorContext);
      } else {
        return createHTMLErrorResponse(errorContext);
      }
    }
    
    // Handle retryable errors
    if (shouldRetryError(errorContext, retryAttempt)) {
      return createRetryResponse(errorContext, retryAttempt);
    }
    
    // Handle validation and client errors
    if (errorContext.statusCode >= 400 && errorContext.statusCode < 500) {
      if (isAPIRequest(request)) {
        return createAPIErrorResponse(errorContext);
      } else {
        return createHTMLErrorResponse(errorContext);
      }
    }
    
    // Handle server errors
    if (errorContext.statusCode >= 500) {
      // Log critical server errors
      if (errorContext.classification.severity === ErrorSeverity.CRITICAL) {
        console.error('Critical server error:', {
          error: errorContext.error,
          request: errorContext.request,
          user: errorContext.user,
          timestamp: new Date().toISOString(),
        });
      }
      
      if (isAPIRequest(request)) {
        return createAPIErrorResponse(errorContext);
      } else {
        return createHTMLErrorResponse(errorContext);
      }
    }
    
    // Default error handling
    if (isAPIRequest(request)) {
      return createAPIErrorResponse(errorContext);
    } else {
      return createHTMLErrorResponse(errorContext);
    }
    
  } catch (handlingError) {
    // Fallback error handling if error processing itself fails
    console.error('Error in error handling middleware:', handlingError);
    
    const fallbackResponse = createErrorResponse(
      'An unexpected error occurred while processing your request',
      500,
      {
        fallback: true,
        timestamp: new Date().toISOString(),
        requestId: `fallback_${Date.now()}`,
      }
    );
    
    return fallbackResponse;
  } finally {
    // Clean up rate limiter cache periodically
    if (Math.random() < 0.01) { // 1% chance to trigger cleanup
      EdgeRateLimiter.cleanup();
    }
  }
}

/**
 * Error boundary integration helper for React components
 * Provides server-side error context for client-side error boundaries
 */
export function createErrorBoundaryProps(
  error: Error,
  errorInfo?: any
): {
  error: Error;
  errorInfo: any;
  requestId: string;
  timestamp: string;
  development?: any;
} {
  const props = {
    error,
    errorInfo,
    requestId: `client_error_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    timestamp: new Date().toISOString(),
  };
  
  if (isDevelopmentMode()) {
    props.development = {
      stack: error.stack,
      componentStack: errorInfo?.componentStack,
      errorBoundary: errorInfo?.errorBoundary,
      nodeVersion: process.version,
    };
  }
  
  return props;
}

/**
 * Development mode error enhancement
 * Provides additional debugging information for development environments
 */
export function enhanceErrorForDevelopment(
  error: any,
  request: NextRequest,
  additionalContext?: Record<string, any>
): any {
  if (!isDevelopmentMode()) {
    return error;
  }
  
  return {
    ...error,
    __development: {
      originalError: error,
      request: {
        method: request.method,
        url: request.url,
        headers: Object.fromEntries(request.headers.entries()),
        timestamp: new Date().toISOString(),
      },
      environment: {
        nodeVersion: process.version,
        nextVersion: process.env.NEXT_VERSION || 'unknown',
        isDevelopment: true,
      },
      additionalContext,
    },
  };
}

/**
 * Error metrics collector for monitoring and alerting
 * Tracks error rates and patterns for system health monitoring
 */
export class ErrorMetricsCollector {
  private static errorCounts = new Map<string, number>();
  private static lastReset = Date.now();
  private static readonly RESET_INTERVAL = 300000; // 5 minutes
  
  /**
   * Records an error occurrence for metrics tracking
   */
  static recordError(
    statusCode: number,
    category: ErrorCategory,
    severity: ErrorSeverity
  ): void {
    const key = `${statusCode}_${category}_${severity}`;
    const current = this.errorCounts.get(key) || 0;
    this.errorCounts.set(key, current + 1);
    
    // Reset metrics periodically
    if (Date.now() - this.lastReset > this.RESET_INTERVAL) {
      this.reset();
    }
  }
  
  /**
   * Gets current error metrics
   */
  static getMetrics(): Record<string, number> {
    return Object.fromEntries(this.errorCounts.entries());
  }
  
  /**
   * Resets error metrics
   */
  static reset(): void {
    this.errorCounts.clear();
    this.lastReset = Date.now();
  }
  
  /**
   * Gets error rate for specific category
   */
  static getErrorRate(category: ErrorCategory): number {
    let totalErrors = 0;
    let categoryErrors = 0;
    
    for (const [key, count] of this.errorCounts.entries()) {
      totalErrors += count;
      if (key.includes(category)) {
        categoryErrors += count;
      }
    }
    
    return totalErrors > 0 ? categoryErrors / totalErrors : 0;
  }
}

// ============================================================================
// EXPORTS
// ============================================================================

// Export main error handling function
export { handleError as default };

// Export error classification and utilities
export {
  ErrorCategory,
  ErrorSeverity,
  RecoveryStrategy,
  ERROR_CLASSIFICATION,
  createErrorContext,
  sanitizeErrorMessage,
  calculateBackoffDelay,
  shouldRetryError,
  createErrorAuditLog,
  ErrorMetricsCollector,
};

// Export response builders
export {
  createAPIErrorResponse,
  createHTMLErrorResponse,
  createRetryResponse,
};

// Export rate limiting functions
export {
  checkErrorRateLimit,
  handleErrorRateLimitExceeded,
};

// Export error boundary integration
export {
  createErrorBoundaryProps,
  enhanceErrorForDevelopment,
};

// Export configuration
export {
  DEFAULT_ERROR_CONFIG,
  type ErrorHandlingConfig,
  type ErrorContext,
};