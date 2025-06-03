/**
 * @fileoverview Error Handling Middleware for DreamFactory Admin Interface
 * 
 * Comprehensive error capture, processing, and recovery mechanisms replacing Angular 
 * error interceptor with edge-based error management and React Error Boundary integration.
 * 
 * This middleware provides:
 * - Global error handling with graceful degradation and enhanced user experience
 * - HTTP error response processing and transformation for all status codes
 * - React Error Boundary integration for client-side error capture
 * - Development mode enhanced error information and debugging capabilities
 * - Security compliance through audit logging and error sanitization
 * - Performance monitoring and error recovery with exponential backoff
 * - Edge runtime optimization for sub-100ms error processing
 * 
 * Key Features:
 * - Comprehensive HTTP status code handling (401, 403, 404, 500+)
 * - Audit trail generation for security compliance and monitoring
 * - Exponential backoff retry mechanisms for transient failures
 * - Error boundary integration for React component error capture
 * - Context-aware error transformation and user-friendly messaging
 * - Performance tracking and error analytics integration
 * - Development vs production error handling differentiation
 * 
 * @author DreamFactory Admin Interface Team
 * @version React 19/Next.js 15.1 Migration
 * @requires Next.js 15.1+ Edge Runtime
 * @requires React 19+ Error Boundaries
 */

import { NextRequest, NextResponse } from 'next/server';
import { 
  MiddlewareRequest, 
  MiddlewareResponse, 
  MiddlewareError,
  MiddlewareComponent,
  MiddlewareStage,
  AuditEvent,
  AuditEventType,
  SecurityHeaders,
  PerformanceWarning,
  PerformanceWarningType,
  PerformanceWarningSeverity,
  RecoveryAction,
  RecoveryActionType,
  RecoveryResult,
  ComplianceImpact,
  ComplianceSeverity,
  MIDDLEWARE_DEFAULTS
} from './types';
import { 
  createAuditLogEntry, 
  logAuditEntry, 
  getEnvironmentConfig, 
  createErrorResponse,
  getClientIP
} from './utils';

// ============================================================================
// ERROR CLASSIFICATION AND TYPES
// ============================================================================

/**
 * HTTP error status codes with specific handling requirements
 */
export enum HttpErrorCode {
  BAD_REQUEST = 400,
  UNAUTHORIZED = 401,
  FORBIDDEN = 403,
  NOT_FOUND = 404,
  METHOD_NOT_ALLOWED = 405,
  CONFLICT = 409,
  UNPROCESSABLE_ENTITY = 422,
  TOO_MANY_REQUESTS = 429,
  INTERNAL_SERVER_ERROR = 500,
  BAD_GATEWAY = 502,
  SERVICE_UNAVAILABLE = 503,
  GATEWAY_TIMEOUT = 504
}

/**
 * Error categories for classification and handling
 */
export enum ErrorCategory {
  AUTHENTICATION = 'AUTHENTICATION',
  AUTHORIZATION = 'AUTHORIZATION',
  VALIDATION = 'VALIDATION',
  NETWORK = 'NETWORK',
  SERVER = 'SERVER',
  CLIENT = 'CLIENT',
  SECURITY = 'SECURITY',
  PERFORMANCE = 'PERFORMANCE',
  CONFIGURATION = 'CONFIGURATION',
  UNKNOWN = 'UNKNOWN'
}

/**
 * Error severity levels for response prioritization
 */
export enum ErrorSeverity {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  CRITICAL = 'CRITICAL'
}

/**
 * Comprehensive error context for detailed error tracking
 */
export interface ErrorContext {
  // Request context
  requestId: string;
  requestPath: string;
  requestMethod: string;
  requestHeaders: Record<string, string>;
  requestQuery: Record<string, string>;
  requestBody?: string;
  
  // User context
  userId?: number;
  userEmail?: string;
  sessionId?: string;
  userRole?: string;
  
  // Error classification
  errorCategory: ErrorCategory;
  errorSeverity: ErrorSeverity;
  middlewareComponent: MiddlewareComponent;
  processingStage: MiddlewareStage;
  
  // Performance context
  processingTimeMs: number;
  timeoutOccurred: boolean;
  memoryUsage?: number;
  
  // Network context
  clientIP: string;
  userAgent: string;
  origin?: string;
  referrer?: string;
  
  // Error details
  originalError: Error | null;
  stackTrace?: string;
  errorCode?: string;
  errorMessage: string;
  internalMessage?: string;
  
  // Recovery context
  recoverable: boolean;
  retryCount: number;
  maxRetries: number;
  nextRetryIn?: number;
  
  // Audit context
  auditRequired: boolean;
  sensitiveDataInvolved: boolean;
  complianceImpact?: ComplianceImpact;
  
  // Development context
  isDevelopment: boolean;
  debugInfo?: Record<string, unknown>;
}

/**
 * Error recovery strategy configuration
 */
export interface RecoveryStrategy {
  maxRetries: number;
  baseDelay: number;
  maxDelay: number;
  exponentialBase: number;
  jitterEnabled: boolean;
  retryableErrors: HttpErrorCode[];
  fallbackActions: RecoveryActionType[];
}

/**
 * Error transformation rules for user-facing messages
 */
export interface ErrorTransformationRule {
  errorPattern: string | RegExp;
  userMessage: string;
  statusCode: number;
  includeDetails: boolean;
  logLevel: 'error' | 'warn' | 'info';
  auditRequired: boolean;
}

// ============================================================================
// DEFAULT CONFIGURATIONS
// ============================================================================

/**
 * Default recovery strategy for different error types
 */
const DEFAULT_RECOVERY_STRATEGY: RecoveryStrategy = {
  maxRetries: 3,
  baseDelay: 1000, // 1 second
  maxDelay: 10000, // 10 seconds
  exponentialBase: 2,
  jitterEnabled: true,
  retryableErrors: [
    HttpErrorCode.TOO_MANY_REQUESTS,
    HttpErrorCode.INTERNAL_SERVER_ERROR,
    HttpErrorCode.BAD_GATEWAY,
    HttpErrorCode.SERVICE_UNAVAILABLE,
    HttpErrorCode.GATEWAY_TIMEOUT
  ],
  fallbackActions: [
    RecoveryActionType.RETRY_OPERATION,
    RecoveryActionType.FALLBACK_TO_CACHE,
    RecoveryActionType.LOG_AND_CONTINUE
  ]
};

/**
 * Default error transformation rules for common scenarios
 */
const DEFAULT_ERROR_TRANSFORMATIONS: ErrorTransformationRule[] = [
  {
    errorPattern: /token.*expired/i,
    userMessage: 'Your session has expired. Please sign in again.',
    statusCode: 401,
    includeDetails: false,
    logLevel: 'info',
    auditRequired: true
  },
  {
    errorPattern: /unauthorized|forbidden/i,
    userMessage: 'You do not have permission to access this resource.',
    statusCode: 403,
    includeDetails: false,
    logLevel: 'warn',
    auditRequired: true
  },
  {
    errorPattern: /not found/i,
    userMessage: 'The requested resource was not found.',
    statusCode: 404,
    includeDetails: false,
    logLevel: 'info',
    auditRequired: false
  },
  {
    errorPattern: /validation.*failed/i,
    userMessage: 'Please check your input and try again.',
    statusCode: 400,
    includeDetails: true,
    logLevel: 'info',
    auditRequired: false
  },
  {
    errorPattern: /network.*error/i,
    userMessage: 'Network connection error. Please check your connection and try again.',
    statusCode: 503,
    includeDetails: false,
    logLevel: 'error',
    auditRequired: true
  },
  {
    errorPattern: /server.*error|internal.*error/i,
    userMessage: 'An unexpected error occurred. Please try again later.',
    statusCode: 500,
    includeDetails: false,
    logLevel: 'error',
    auditRequired: true
  }
];

/**
 * Security headers for error responses
 */
const ERROR_RESPONSE_SECURITY_HEADERS: SecurityHeaders = {
  'X-Frame-Options': 'DENY',
  'X-Content-Type-Options': 'nosniff',
  'X-XSS-Protection': '1; mode=block',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Content-Security-Policy': "default-src 'self'; frame-ancestors 'none';",
  'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
  'X-DreamFactory-Version': process.env.DREAMFACTORY_VERSION || 'unknown',
  'X-Request-ID': '',
  'X-Processing-Time': '',
  'X-Cache-Status': 'BYPASS'
};

// ============================================================================
// CORE ERROR HANDLING FUNCTIONS
// ============================================================================

/**
 * Main error handling middleware function
 * Processes all errors with comprehensive context and recovery
 * 
 * @param error - Error object or error context
 * @param request - Next.js request object
 * @param processingStage - Current middleware processing stage
 * @returns Promise resolving to error response
 */
export async function handleMiddlewareError(
  error: Error | MiddlewareError | unknown,
  request: NextRequest,
  processingStage: MiddlewareStage = MiddlewareStage.ERROR_HANDLING
): Promise<NextResponse> {
  const startTime = performance.now();
  const requestId = generateRequestId();
  
  try {
    // Create comprehensive error context
    const errorContext = await createErrorContext(
      error,
      request,
      processingStage,
      requestId,
      startTime
    );
    
    // Log error for monitoring and debugging
    await logError(errorContext);
    
    // Create audit event for security compliance
    if (errorContext.auditRequired) {
      await createAndLogAuditEvent(errorContext, request);
    }
    
    // Apply error transformation rules
    const transformedError = transformError(errorContext);
    
    // Create appropriate error response
    const errorResponse = await createErrorResponse(
      transformedError,
      errorContext,
      request
    );
    
    // Add performance tracking
    const processingTime = performance.now() - startTime;
    addPerformanceHeaders(errorResponse, processingTime, requestId);
    
    // Check for performance warnings
    if (processingTime > MIDDLEWARE_DEFAULTS.PERFORMANCE_WARNING_THRESHOLD) {
      await logPerformanceWarning(processingTime, errorContext, requestId);
    }
    
    return errorResponse;
    
  } catch (handlingError) {
    // Fallback error handling if primary error handling fails
    console.error('Error handling middleware failed:', handlingError);
    return createFallbackErrorResponse(request, requestId);
  }
}

/**
 * Creates comprehensive error context from error object and request
 * 
 * @param error - Original error object
 * @param request - Next.js request object
 * @param processingStage - Current processing stage
 * @param requestId - Unique request identifier
 * @param startTime - Processing start time
 * @returns Promise resolving to error context
 */
async function createErrorContext(
  error: Error | MiddlewareError | unknown,
  request: NextRequest,
  processingStage: MiddlewareStage,
  requestId: string,
  startTime: number
): Promise<ErrorContext> {
  const config = getEnvironmentConfig();
  const processingTime = performance.now() - startTime;
  
  // Extract error details
  let originalError: Error | null = null;
  let errorMessage = 'Unknown error occurred';
  let errorCode: string | undefined;
  let middlewareComponent = MiddlewareComponent.ERROR_HANDLING;
  let stackTrace: string | undefined;
  
  if (error instanceof Error) {
    originalError = error;
    errorMessage = error.message;
    stackTrace = error.stack;
    
    // Check if it's a middleware error with additional context
    if ('middlewareComponent' in error) {
      middlewareComponent = (error as MiddlewareError).middlewareComponent;
      errorCode = (error as MiddlewareError).code;
    }
  } else if (typeof error === 'string') {
    errorMessage = error;
  } else if (error && typeof error === 'object') {
    errorMessage = (error as any).message || 'Object error';
    errorCode = (error as any).code;
  }
  
  // Classify error
  const errorCategory = classifyError(errorMessage, errorCode);
  const errorSeverity = determineErrorSeverity(errorCategory, errorCode);
  
  // Extract request context
  const requestPath = request.nextUrl.pathname;
  const requestMethod = request.method;
  const requestHeaders = extractSafeHeaders(request.headers);
  const requestQuery = Object.fromEntries(request.nextUrl.searchParams);
  
  // Extract user context (if available from middleware request)
  let userId: number | undefined;
  let userEmail: string | undefined;
  let sessionId: string | undefined;
  let userRole: string | undefined;
  
  if ('dreamfactory' in request) {
    const dfRequest = request as MiddlewareRequest;
    userId = dfRequest.dreamfactory.userId || undefined;
    userEmail = dfRequest.dreamfactory.userEmail || undefined;
    sessionId = dfRequest.dreamfactory.sessionId || undefined;
    // Extract role from user context if available
  }
  
  // Determine retry settings
  const recoverable = isErrorRecoverable(errorCategory, errorCode);
  const maxRetries = DEFAULT_RECOVERY_STRATEGY.maxRetries;
  
  // Security and compliance assessment
  const auditRequired = requiresAudit(errorCategory, errorSeverity);
  const sensitiveDataInvolved = checkSensitiveDataInvolvement(requestPath, errorMessage);
  const complianceImpact = assessComplianceImpact(errorCategory, sensitiveDataInvolved);
  
  return {
    requestId,
    requestPath,
    requestMethod,
    requestHeaders,
    requestQuery,
    userId,
    userEmail,
    sessionId,
    userRole,
    errorCategory,
    errorSeverity,
    middlewareComponent,
    processingStage,
    processingTimeMs: processingTime,
    timeoutOccurred: processingTime > MIDDLEWARE_DEFAULTS.MAX_PROCESSING_TIME,
    clientIP: getClientIP(request),
    userAgent: request.headers.get('user-agent') || 'Unknown',
    origin: request.headers.get('origin') || undefined,
    referrer: request.headers.get('referer') || undefined,
    originalError,
    stackTrace,
    errorCode,
    errorMessage,
    internalMessage: config.isDevelopment ? errorMessage : undefined,
    recoverable,
    retryCount: 0,
    maxRetries,
    auditRequired,
    sensitiveDataInvolved,
    complianceImpact,
    isDevelopment: config.isDevelopment,
    debugInfo: config.isDevelopment ? {
      stackTrace,
      originalError: originalError?.toString(),
      processingStage,
      middlewareComponent
    } : undefined
  };
}

/**
 * Logs error with appropriate level and context
 * 
 * @param errorContext - Comprehensive error context
 */
async function logError(errorContext: ErrorContext): Promise<void> {
  const logData = {
    timestamp: new Date().toISOString(),
    requestId: errorContext.requestId,
    level: getLogLevel(errorContext.errorSeverity),
    category: 'middleware_error',
    errorCategory: errorContext.errorCategory,
    errorSeverity: errorContext.errorSeverity,
    errorMessage: errorContext.errorMessage,
    requestPath: errorContext.requestPath,
    requestMethod: errorContext.requestMethod,
    userId: errorContext.userId,
    sessionId: errorContext.sessionId,
    clientIP: errorContext.clientIP,
    processingTimeMs: errorContext.processingTimeMs,
    middlewareComponent: errorContext.middlewareComponent,
    processingStage: errorContext.processingStage,
    recoverable: errorContext.recoverable,
    auditRequired: errorContext.auditRequired,
    sensitiveDataInvolved: errorContext.sensitiveDataInvolved,
    stackTrace: errorContext.isDevelopment ? errorContext.stackTrace : undefined,
    debugInfo: errorContext.debugInfo
  };
  
  // Use structured logging for production environments
  if (errorContext.isDevelopment) {
    console.error('[MIDDLEWARE ERROR]', JSON.stringify(logData, null, 2));
  } else {
    console.error(JSON.stringify(logData));
  }
  
  // In production, you would also send to external logging service
  // await sendToLoggingService(logData);
}

/**
 * Creates and logs audit event for security compliance
 * 
 * @param errorContext - Error context
 * @param request - Original request
 */
async function createAndLogAuditEvent(
  errorContext: ErrorContext,
  request: NextRequest
): Promise<void> {
  const auditEvent: AuditEvent = {
    eventId: generateEventId(),
    eventType: getAuditEventType(errorContext.errorCategory),
    eventSubtype: errorContext.errorCode || 'UNKNOWN_ERROR',
    timestamp: new Date(),
    duration: errorContext.processingTimeMs,
    userId: errorContext.userId || null,
    userEmail: errorContext.userEmail || null,
    userRole: errorContext.userRole || null,
    sessionId: errorContext.sessionId || null,
    requestId: errorContext.requestId,
    requestPath: errorContext.requestPath,
    requestMethod: errorContext.requestMethod as any,
    requestHeaders: errorContext.requestHeaders,
    requestBody: null, // Don't log request body for security
    responseStatus: getResponseStatusFromError(errorContext.errorCategory),
    responseHeaders: {},
    responseBody: null,
    ipAddress: errorContext.clientIP,
    userAgent: errorContext.userAgent,
    referrer: errorContext.referrer || null,
    geoLocation: null, // Would be populated by geo-location service
    authenticationMethod: null,
    permissionsChecked: [],
    accessGranted: false,
    denyReason: errorContext.errorMessage,
    processingTime: errorContext.processingTimeMs,
    cacheHit: false,
    errorOccurred: true,
    containsSensitiveData: errorContext.sensitiveDataInvolved,
    dataClassification: errorContext.sensitiveDataInvolved ? 'CONFIDENTIAL' : 'INTERNAL',
    metadata: {
      errorCategory: errorContext.errorCategory,
      errorSeverity: errorContext.errorSeverity,
      middlewareComponent: errorContext.middlewareComponent,
      processingStage: errorContext.processingStage,
      recoverable: errorContext.recoverable,
      complianceImpact: errorContext.complianceImpact
    },
    tags: [
      'middleware_error',
      errorContext.errorCategory.toLowerCase(),
      errorContext.errorSeverity.toLowerCase()
    ],
    complianceFlags: errorContext.complianceImpact ? [{
      regulation: 'SECURITY_AUDIT',
      requirement: 'ERROR_LOGGING',
      met: true,
      evidence: 'Error logged with full context',
      assessor: 'MIDDLEWARE',
      assessedAt: new Date()
    }] : [],
    retentionPolicy: errorContext.complianceImpact?.severity === ComplianceSeverity.CRITICAL ? 
      'LONG_TERM' : 'STANDARD',
    correlationId: errorContext.requestId,
    parentEventId: null,
    relatedEventIds: []
  };
  
  // Log the audit event
  logAuditEntry(createAuditLogEntry(
    request,
    `MIDDLEWARE_ERROR_${errorContext.errorCategory}`,
    false,
    {
      userId: errorContext.userId?.toString(),
      sessionId: errorContext.sessionId,
      error: errorContext.errorMessage,
      metadata: auditEvent.metadata
    }
  ));
}

/**
 * Transforms error based on transformation rules
 * 
 * @param errorContext - Error context to transform
 * @returns Transformed error information
 */
function transformError(errorContext: ErrorContext): {
  userMessage: string;
  statusCode: number;
  includeDetails: boolean;
  errorCode?: string;
} {
  // Find matching transformation rule
  const matchingRule = DEFAULT_ERROR_TRANSFORMATIONS.find(rule => {
    if (typeof rule.errorPattern === 'string') {
      return errorContext.errorMessage.includes(rule.errorPattern);
    } else {
      return rule.errorPattern.test(errorContext.errorMessage);
    }
  });
  
  if (matchingRule) {
    return {
      userMessage: matchingRule.userMessage,
      statusCode: matchingRule.statusCode,
      includeDetails: matchingRule.includeDetails && errorContext.isDevelopment,
      errorCode: errorContext.errorCode
    };
  }
  
  // Default transformation based on error category
  return getDefaultTransformation(errorContext);
}

/**
 * Creates appropriate error response with context
 * 
 * @param transformedError - Transformed error information
 * @param errorContext - Original error context
 * @param request - Original request
 * @returns Promise resolving to error response
 */
async function createErrorResponse(
  transformedError: { userMessage: string; statusCode: number; includeDetails: boolean; errorCode?: string },
  errorContext: ErrorContext,
  request: NextRequest
): Promise<NextResponse> {
  const responseBody: any = {
    error: transformedError.userMessage,
    timestamp: new Date().toISOString(),
    requestId: errorContext.requestId,
    path: errorContext.requestPath
  };
  
  // Include additional details in development mode
  if (errorContext.isDevelopment && transformedError.includeDetails) {
    responseBody.details = {
      errorCode: transformedError.errorCode,
      errorCategory: errorContext.errorCategory,
      errorSeverity: errorContext.errorSeverity,
      processingStage: errorContext.processingStage,
      processingTimeMs: errorContext.processingTimeMs,
      stackTrace: errorContext.stackTrace,
      debugInfo: errorContext.debugInfo
    };
  }
  
  // Include error code for API clients
  if (transformedError.errorCode) {
    responseBody.code = transformedError.errorCode;
  }
  
  // Include retry information for recoverable errors
  if (errorContext.recoverable && errorContext.retryCount < errorContext.maxRetries) {
    const nextRetryIn = calculateNextRetryDelay(errorContext.retryCount);
    responseBody.retry = {
      retryable: true,
      retryCount: errorContext.retryCount,
      maxRetries: errorContext.maxRetries,
      nextRetryIn: nextRetryIn,
      retryAfter: Math.ceil(nextRetryIn / 1000) // Retry-After header value in seconds
    };
  }
  
  // Create response with appropriate headers
  const response = NextResponse.json(responseBody, { status: transformedError.statusCode });
  
  // Add security headers
  addSecurityHeaders(response, errorContext.requestId);
  
  // Add retry headers for recoverable errors
  if (errorContext.recoverable && responseBody.retry) {
    response.headers.set('Retry-After', responseBody.retry.retryAfter.toString());
  }
  
  // Add CORS headers for API requests
  if (errorContext.requestPath.startsWith('/api/')) {
    addCORSHeaders(response, request);
  }
  
  return response;
}

/**
 * Adds performance tracking headers to response
 * 
 * @param response - Response object
 * @param processingTime - Processing time in milliseconds
 * @param requestId - Request identifier
 */
function addPerformanceHeaders(
  response: NextResponse,
  processingTime: number,
  requestId: string
): void {
  response.headers.set('X-Processing-Time', `${processingTime.toFixed(2)}ms`);
  response.headers.set('X-Request-ID', requestId);
  
  // Add performance warnings if processing time is high
  if (processingTime > MIDDLEWARE_DEFAULTS.PERFORMANCE_WARNING_THRESHOLD) {
    response.headers.set('X-Performance-Warning', 'Processing time exceeded threshold');
  }
}

/**
 * Logs performance warning for slow error handling
 * 
 * @param processingTime - Processing time in milliseconds
 * @param errorContext - Error context
 * @param requestId - Request identifier
 */
async function logPerformanceWarning(
  processingTime: number,
  errorContext: ErrorContext,
  requestId: string
): Promise<void> {
  const warning: PerformanceWarning = {
    warningType: PerformanceWarningType.PROCESSING_TIME_EXCEEDED,
    warningMessage: `Error handling processing time (${processingTime.toFixed(2)}ms) exceeded threshold (${MIDDLEWARE_DEFAULTS.PERFORMANCE_WARNING_THRESHOLD}ms)`,
    threshold: MIDDLEWARE_DEFAULTS.PERFORMANCE_WARNING_THRESHOLD,
    actualValue: processingTime,
    severity: processingTime > 200 ? PerformanceWarningSeverity.ERROR : PerformanceWarningSeverity.WARNING,
    timestamp: new Date(),
    component: MiddlewareComponent.ERROR_HANDLING,
    requestId,
    userId: errorContext.userId || null,
    suggestedActions: [
      'Review error handling complexity',
      'Optimize error logging operations',
      'Consider caching error transformations',
      'Monitor system resource usage'
    ],
    automaticMitigation: false,
    mitigationApplied: false,
    occurrenceCount: 1,
    firstOccurrence: new Date(),
    lastOccurrence: new Date()
  };
  
  console.warn('[PERFORMANCE WARNING]', JSON.stringify(warning, null, 2));
}

/**
 * Creates fallback error response when primary error handling fails
 * 
 * @param request - Original request
 * @param requestId - Request identifier
 * @returns Fallback error response
 */
function createFallbackErrorResponse(
  request: NextRequest,
  requestId: string
): NextResponse {
  const response = NextResponse.json(
    {
      error: 'An internal error occurred while processing your request',
      timestamp: new Date().toISOString(),
      requestId,
      path: request.nextUrl.pathname
    },
    { status: 500 }
  );
  
  // Add minimal security headers
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('X-Request-ID', requestId);
  
  return response;
}

// ============================================================================
// ERROR RECOVERY AND RETRY MECHANISMS
// ============================================================================

/**
 * Calculates next retry delay using exponential backoff with jitter
 * 
 * @param retryCount - Current retry attempt number
 * @param strategy - Recovery strategy configuration
 * @returns Delay in milliseconds
 */
export function calculateNextRetryDelay(
  retryCount: number,
  strategy: RecoveryStrategy = DEFAULT_RECOVERY_STRATEGY
): number {
  const exponentialDelay = strategy.baseDelay * Math.pow(strategy.exponentialBase, retryCount);
  const cappedDelay = Math.min(exponentialDelay, strategy.maxDelay);
  
  if (strategy.jitterEnabled) {
    // Add random jitter to prevent thundering herd
    const jitter = Math.random() * 0.1 * cappedDelay; // 10% jitter
    return Math.floor(cappedDelay + jitter);
  }
  
  return cappedDelay;
}

/**
 * Determines if error is recoverable through retry
 * 
 * @param errorCategory - Error category
 * @param errorCode - Specific error code
 * @returns Boolean indicating if error is recoverable
 */
function isErrorRecoverable(errorCategory: ErrorCategory, errorCode?: string): boolean {
  // Network and server errors are generally recoverable
  if (errorCategory === ErrorCategory.NETWORK || errorCategory === ErrorCategory.SERVER) {
    return true;
  }
  
  // Some authentication errors are recoverable (token refresh)
  if (errorCategory === ErrorCategory.AUTHENTICATION && errorCode === 'TOKEN_EXPIRED') {
    return true;
  }
  
  // Performance errors might be recoverable
  if (errorCategory === ErrorCategory.PERFORMANCE) {
    return true;
  }
  
  // Client, validation, and authorization errors are generally not recoverable
  return false;
}

/**
 * Creates recovery actions for recoverable errors
 * 
 * @param errorContext - Error context
 * @returns Array of recovery actions
 */
export function createRecoveryActions(errorContext: ErrorContext): RecoveryAction[] {
  const actions: RecoveryAction[] = [];
  
  if (!errorContext.recoverable) {
    return actions;
  }
  
  // Add retry action if within retry limits
  if (errorContext.retryCount < errorContext.maxRetries) {
    actions.push({
      action: RecoveryActionType.RETRY_OPERATION,
      description: `Retry operation (attempt ${errorContext.retryCount + 1}/${errorContext.maxRetries})`,
      executed: false,
      executedAt: null,
      result: null,
      errorMessage: null
    });
  }
  
  // Add cache fallback for appropriate scenarios
  if (errorContext.errorCategory === ErrorCategory.NETWORK || 
      errorContext.errorCategory === ErrorCategory.SERVER) {
    actions.push({
      action: RecoveryActionType.FALLBACK_TO_CACHE,
      description: 'Use cached data if available',
      executed: false,
      executedAt: null,
      result: null,
      errorMessage: null
    });
  }
  
  // Add authentication recovery for auth errors
  if (errorContext.errorCategory === ErrorCategory.AUTHENTICATION) {
    actions.push({
      action: RecoveryActionType.REDIRECT_TO_LOGIN,
      description: 'Redirect to login page for re-authentication',
      executed: false,
      executedAt: null,
      result: null,
      errorMessage: null
    });
  }
  
  // Always add logging action
  actions.push({
    action: RecoveryActionType.LOG_AND_CONTINUE,
    description: 'Log error and continue with graceful degradation',
    executed: false,
    executedAt: null,
    result: null,
    errorMessage: null
  });
  
  return actions;
}

// ============================================================================
// REACT ERROR BOUNDARY INTEGRATION
// ============================================================================

/**
 * Error boundary integration data for client-side error handling
 */
export interface ErrorBoundaryContext {
  errorId: string;
  errorMessage: string;
  componentStack?: string;
  errorBoundary: string;
  userId?: number;
  sessionId?: string;
  timestamp: Date;
  userAgent: string;
  url: string;
  additionalContext?: Record<string, unknown>;
}

/**
 * Processes React Error Boundary errors for logging and recovery
 * 
 * @param error - React error object
 * @param errorInfo - Error boundary information
 * @param userContext - User context if available
 * @returns Error boundary context for further processing
 */
export function handleReactErrorBoundary(
  error: Error,
  errorInfo: { componentStack?: string },
  userContext?: { userId?: number; sessionId?: string }
): ErrorBoundaryContext {
  const errorBoundaryContext: ErrorBoundaryContext = {
    errorId: generateEventId(),
    errorMessage: error.message,
    componentStack: errorInfo.componentStack,
    errorBoundary: 'React Error Boundary',
    userId: userContext?.userId,
    sessionId: userContext?.sessionId,
    timestamp: new Date(),
    userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'Unknown',
    url: typeof window !== 'undefined' ? window.location.href : 'Unknown',
    additionalContext: {
      errorName: error.name,
      errorStack: error.stack,
      componentStack: errorInfo.componentStack
    }
  };
  
  // Log error boundary error
  logReactErrorBoundary(errorBoundaryContext);
  
  return errorBoundaryContext;
}

/**
 * Logs React Error Boundary errors
 * 
 * @param context - Error boundary context
 */
function logReactErrorBoundary(context: ErrorBoundaryContext): void {
  const logData = {
    timestamp: context.timestamp.toISOString(),
    level: 'error',
    category: 'react_error_boundary',
    errorId: context.errorId,
    errorMessage: context.errorMessage,
    userId: context.userId,
    sessionId: context.sessionId,
    userAgent: context.userAgent,
    url: context.url,
    componentStack: context.componentStack,
    additionalContext: context.additionalContext
  };
  
  console.error('[REACT ERROR BOUNDARY]', JSON.stringify(logData, null, 2));
  
  // In production, send to external logging service
  // await sendToLoggingService(logData);
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Classifies error based on message and code
 * 
 * @param errorMessage - Error message
 * @param errorCode - Error code
 * @returns Error category
 */
function classifyError(errorMessage: string, errorCode?: string): ErrorCategory {
  const message = errorMessage.toLowerCase();
  
  // Authentication errors
  if (message.includes('unauthorized') || message.includes('authentication') || 
      message.includes('token') || errorCode === 'UNAUTHORIZED') {
    return ErrorCategory.AUTHENTICATION;
  }
  
  // Authorization errors
  if (message.includes('forbidden') || message.includes('permission') || 
      message.includes('access denied') || errorCode === 'FORBIDDEN') {
    return ErrorCategory.AUTHORIZATION;
  }
  
  // Validation errors
  if (message.includes('validation') || message.includes('invalid') || 
      message.includes('required') || errorCode === 'VALIDATION_FAILED') {
    return ErrorCategory.VALIDATION;
  }
  
  // Network errors
  if (message.includes('network') || message.includes('connection') || 
      message.includes('timeout') || errorCode === 'NETWORK_ERROR') {
    return ErrorCategory.NETWORK;
  }
  
  // Server errors
  if (message.includes('server') || message.includes('internal') || 
      message.includes('service unavailable') || errorCode?.startsWith('5')) {
    return ErrorCategory.SERVER;
  }
  
  // Security errors
  if (message.includes('security') || message.includes('csrf') || 
      message.includes('suspicious') || errorCode === 'SECURITY_VIOLATION') {
    return ErrorCategory.SECURITY;
  }
  
  // Performance errors
  if (message.includes('timeout') || message.includes('slow') || 
      message.includes('performance') || errorCode === 'PERFORMANCE_DEGRADATION') {
    return ErrorCategory.PERFORMANCE;
  }
  
  // Configuration errors
  if (message.includes('configuration') || message.includes('config') || 
      message.includes('environment') || errorCode === 'CONFIG_ERROR') {
    return ErrorCategory.CONFIGURATION;
  }
  
  // Default to unknown
  return ErrorCategory.UNKNOWN;
}

/**
 * Determines error severity based on category and code
 * 
 * @param errorCategory - Error category
 * @param errorCode - Error code
 * @returns Error severity
 */
function determineErrorSeverity(errorCategory: ErrorCategory, errorCode?: string): ErrorSeverity {
  switch (errorCategory) {
    case ErrorCategory.SECURITY:
      return ErrorSeverity.CRITICAL;
    
    case ErrorCategory.SERVER:
      return errorCode?.startsWith('5') ? ErrorSeverity.HIGH : ErrorSeverity.MEDIUM;
    
    case ErrorCategory.AUTHENTICATION:
    case ErrorCategory.AUTHORIZATION:
      return ErrorSeverity.MEDIUM;
    
    case ErrorCategory.NETWORK:
    case ErrorCategory.PERFORMANCE:
    case ErrorCategory.CONFIGURATION:
      return ErrorSeverity.MEDIUM;
    
    case ErrorCategory.VALIDATION:
    case ErrorCategory.CLIENT:
      return ErrorSeverity.LOW;
    
    default:
      return ErrorSeverity.MEDIUM;
  }
}

/**
 * Extracts safe headers for logging (excludes sensitive data)
 * 
 * @param headers - Request headers
 * @returns Safe headers object
 */
function extractSafeHeaders(headers: Headers): Record<string, string> {
  const safeHeaders: Record<string, string> = {};
  const sensitiveHeaders = [
    'authorization',
    'cookie',
    'x-dreamfactory-session-token',
    'x-api-key',
    'x-dreamfactory-api-key'
  ];
  
  headers.forEach((value, key) => {
    if (!sensitiveHeaders.includes(key.toLowerCase())) {
      safeHeaders[key] = value;
    }
  });
  
  return safeHeaders;
}

/**
 * Determines if audit logging is required for error
 * 
 * @param errorCategory - Error category
 * @param errorSeverity - Error severity
 * @returns Boolean indicating if audit is required
 */
function requiresAudit(errorCategory: ErrorCategory, errorSeverity: ErrorSeverity): boolean {
  // Always audit security and authentication errors
  if (errorCategory === ErrorCategory.SECURITY || 
      errorCategory === ErrorCategory.AUTHENTICATION) {
    return true;
  }
  
  // Audit high and critical severity errors
  if (errorSeverity === ErrorSeverity.HIGH || errorSeverity === ErrorSeverity.CRITICAL) {
    return true;
  }
  
  // Audit authorization errors
  if (errorCategory === ErrorCategory.AUTHORIZATION) {
    return true;
  }
  
  return false;
}

/**
 * Checks if sensitive data might be involved in the error
 * 
 * @param requestPath - Request path
 * @param errorMessage - Error message
 * @returns Boolean indicating sensitive data involvement
 */
function checkSensitiveDataInvolvement(requestPath: string, errorMessage: string): boolean {
  const sensitivePaths = [
    '/admin-settings',
    '/system-settings',
    '/api-security',
    '/profile',
    '/api/v2/user',
    '/api/v2/system'
  ];
  
  const sensitiveKeywords = [
    'password',
    'token',
    'secret',
    'credential',
    'session',
    'auth',
    'key'
  ];
  
  // Check if path involves sensitive data
  if (sensitivePaths.some(path => requestPath.startsWith(path))) {
    return true;
  }
  
  // Check if error message contains sensitive keywords
  const lowerMessage = errorMessage.toLowerCase();
  if (sensitiveKeywords.some(keyword => lowerMessage.includes(keyword))) {
    return true;
  }
  
  return false;
}

/**
 * Assesses compliance impact of error
 * 
 * @param errorCategory - Error category
 * @param sensitiveDataInvolved - Whether sensitive data is involved
 * @returns Compliance impact assessment
 */
function assessComplianceImpact(
  errorCategory: ErrorCategory,
  sensitiveDataInvolved: boolean
): ComplianceImpact | undefined {
  if (!sensitiveDataInvolved && errorCategory !== ErrorCategory.SECURITY) {
    return undefined;
  }
  
  let severity = ComplianceSeverity.LOW;
  const regulations = ['SECURITY_AUDIT'];
  const dataTypes = ['SYSTEM_DATA'];
  
  if (errorCategory === ErrorCategory.SECURITY) {
    severity = ComplianceSeverity.HIGH;
    regulations.push('SECURITY_COMPLIANCE');
  }
  
  if (sensitiveDataInvolved) {
    severity = ComplianceSeverity.MEDIUM;
    dataTypes.push('SENSITIVE_DATA');
  }
  
  return {
    severity,
    regulations,
    dataTypes,
    reportingRequired: severity === ComplianceSeverity.HIGH || severity === ComplianceSeverity.CRITICAL,
    retentionPeriod: severity === ComplianceSeverity.HIGH ? 2555 : 365, // 7 years for high, 1 year for others
    escalationRequired: severity === ComplianceSeverity.CRITICAL
  };
}

/**
 * Gets appropriate log level for error severity
 * 
 * @param errorSeverity - Error severity
 * @returns Log level string
 */
function getLogLevel(errorSeverity: ErrorSeverity): string {
  switch (errorSeverity) {
    case ErrorSeverity.LOW:
      return 'info';
    case ErrorSeverity.MEDIUM:
      return 'warn';
    case ErrorSeverity.HIGH:
    case ErrorSeverity.CRITICAL:
      return 'error';
    default:
      return 'warn';
  }
}

/**
 * Gets audit event type based on error category
 * 
 * @param errorCategory - Error category
 * @returns Audit event type
 */
function getAuditEventType(errorCategory: ErrorCategory): AuditEventType {
  switch (errorCategory) {
    case ErrorCategory.AUTHENTICATION:
      return AuditEventType.LOGIN_FAILURE;
    case ErrorCategory.AUTHORIZATION:
      return AuditEventType.ACCESS_DENIED;
    case ErrorCategory.SECURITY:
      return AuditEventType.SECURITY_VIOLATION;
    default:
      return AuditEventType.SYSTEM_ERROR;
  }
}

/**
 * Gets HTTP status code from error category
 * 
 * @param errorCategory - Error category
 * @returns HTTP status code
 */
function getResponseStatusFromError(errorCategory: ErrorCategory): any {
  switch (errorCategory) {
    case ErrorCategory.AUTHENTICATION:
      return 401;
    case ErrorCategory.AUTHORIZATION:
      return 403;
    case ErrorCategory.VALIDATION:
      return 400;
    case ErrorCategory.NETWORK:
      return 503;
    case ErrorCategory.SERVER:
      return 500;
    default:
      return 500;
  }
}

/**
 * Gets default error transformation for unmatched errors
 * 
 * @param errorContext - Error context
 * @returns Default transformation
 */
function getDefaultTransformation(errorContext: ErrorContext): {
  userMessage: string;
  statusCode: number;
  includeDetails: boolean;
  errorCode?: string;
} {
  switch (errorContext.errorCategory) {
    case ErrorCategory.AUTHENTICATION:
      return {
        userMessage: 'Authentication required. Please sign in.',
        statusCode: 401,
        includeDetails: false,
        errorCode: errorContext.errorCode
      };
    
    case ErrorCategory.AUTHORIZATION:
      return {
        userMessage: 'You do not have permission to perform this action.',
        statusCode: 403,
        includeDetails: false,
        errorCode: errorContext.errorCode
      };
    
    case ErrorCategory.VALIDATION:
      return {
        userMessage: 'Invalid input provided. Please check your data and try again.',
        statusCode: 400,
        includeDetails: errorContext.isDevelopment,
        errorCode: errorContext.errorCode
      };
    
    case ErrorCategory.NETWORK:
      return {
        userMessage: 'Network connection error. Please check your connection and try again.',
        statusCode: 503,
        includeDetails: false,
        errorCode: errorContext.errorCode
      };
    
    case ErrorCategory.SERVER:
      return {
        userMessage: 'A server error occurred. Please try again later.',
        statusCode: 500,
        includeDetails: false,
        errorCode: errorContext.errorCode
      };
    
    case ErrorCategory.SECURITY:
      return {
        userMessage: 'Security violation detected. This incident has been logged.',
        statusCode: 403,
        includeDetails: false,
        errorCode: errorContext.errorCode
      };
    
    default:
      return {
        userMessage: 'An unexpected error occurred. Please try again.',
        statusCode: 500,
        includeDetails: errorContext.isDevelopment,
        errorCode: errorContext.errorCode
      };
  }
}

/**
 * Adds security headers to error response
 * 
 * @param response - Response object
 * @param requestId - Request identifier
 */
function addSecurityHeaders(response: NextResponse, requestId: string): void {
  const headers = { ...ERROR_RESPONSE_SECURITY_HEADERS };
  headers['X-Request-ID'] = requestId;
  headers['X-Processing-Time'] = response.headers.get('X-Processing-Time') || '0ms';
  
  Object.entries(headers).forEach(([key, value]) => {
    if (value) {
      response.headers.set(key, value);
    }
  });
}

/**
 * Adds CORS headers for API error responses
 * 
 * @param response - Response object
 * @param request - Original request
 */
function addCORSHeaders(response: NextResponse, request: NextRequest): void {
  const origin = request.headers.get('origin');
  
  if (origin) {
    response.headers.set('Access-Control-Allow-Origin', origin);
    response.headers.set('Access-Control-Allow-Credentials', 'true');
  }
  
  response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-DreamFactory-Session-Token');
}

/**
 * Generates unique request identifier
 * 
 * @returns Unique request ID
 */
function generateRequestId(): string {
  return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Generates unique event identifier
 * 
 * @returns Unique event ID
 */
function generateEventId(): string {
  return `evt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

// ============================================================================
// DEVELOPMENT MODE ENHANCEMENTS
// ============================================================================

/**
 * Development mode error enhancement with detailed debugging information
 * 
 * @param errorContext - Error context
 * @returns Enhanced error information for development
 */
export function enhanceErrorForDevelopment(errorContext: ErrorContext): Record<string, unknown> {
  if (!errorContext.isDevelopment) {
    return {};
  }
  
  return {
    developmentInfo: {
      errorCategory: errorContext.errorCategory,
      errorSeverity: errorContext.errorSeverity,
      middlewareComponent: errorContext.middlewareComponent,
      processingStage: errorContext.processingStage,
      stackTrace: errorContext.stackTrace,
      originalError: errorContext.originalError?.toString(),
      requestHeaders: errorContext.requestHeaders,
      requestQuery: errorContext.requestQuery,
      processingTimeMs: errorContext.processingTimeMs,
      memoryUsage: errorContext.memoryUsage,
      recoverable: errorContext.recoverable,
      auditRequired: errorContext.auditRequired,
      sensitiveDataInvolved: errorContext.sensitiveDataInvolved,
      complianceImpact: errorContext.complianceImpact,
      debugInfo: errorContext.debugInfo,
      suggestions: getDevelopmentSuggestions(errorContext)
    }
  };
}

/**
 * Provides development suggestions based on error context
 * 
 * @param errorContext - Error context
 * @returns Array of suggestions for developers
 */
function getDevelopmentSuggestions(errorContext: ErrorContext): string[] {
  const suggestions: string[] = [];
  
  switch (errorContext.errorCategory) {
    case ErrorCategory.AUTHENTICATION:
      suggestions.push(
        'Check if session token is valid and not expired',
        'Verify authentication middleware configuration',
        'Ensure proper token extraction from headers or cookies'
      );
      break;
    
    case ErrorCategory.AUTHORIZATION:
      suggestions.push(
        'Verify user permissions and role assignments',
        'Check RBAC configuration for the requested resource',
        'Ensure permission validation logic is correct'
      );
      break;
    
    case ErrorCategory.VALIDATION:
      suggestions.push(
        'Check Zod schema validation rules',
        'Verify form field types and constraints',
        'Ensure proper error handling in form components'
      );
      break;
    
    case ErrorCategory.NETWORK:
      suggestions.push(
        'Check network connectivity and API endpoints',
        'Verify CORS configuration for cross-origin requests',
        'Consider implementing retry logic for transient failures'
      );
      break;
    
    case ErrorCategory.SERVER:
      suggestions.push(
        'Check server logs for detailed error information',
        'Verify API endpoint implementation and error handling',
        'Consider implementing circuit breaker pattern'
      );
      break;
    
    case ErrorCategory.PERFORMANCE:
      suggestions.push(
        'Review processing time and identify bottlenecks',
        'Consider caching strategies for improved performance',
        'Optimize database queries and API calls'
      );
      break;
    
    default:
      suggestions.push(
        'Review error logs for additional context',
        'Consider adding more specific error handling',
        'Verify middleware configuration and order'
      );
  }
  
  if (errorContext.processingTimeMs > MIDDLEWARE_DEFAULTS.PERFORMANCE_WARNING_THRESHOLD) {
    suggestions.push(
      'Processing time exceeded threshold - consider optimization',
      'Review middleware complexity and async operations',
      'Consider implementing timeout handling'
    );
  }
  
  return suggestions;
}

// ============================================================================
// EXPORTS
// ============================================================================

export {
  type ErrorContext,
  type ErrorBoundaryContext,
  type RecoveryStrategy,
  type ErrorTransformationRule,
  ErrorCategory,
  ErrorSeverity,
  HttpErrorCode,
  DEFAULT_RECOVERY_STRATEGY,
  DEFAULT_ERROR_TRANSFORMATIONS
};

export default handleMiddlewareError;