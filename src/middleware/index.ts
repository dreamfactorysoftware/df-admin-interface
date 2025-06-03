/**
 * @fileoverview Main Middleware Orchestrator for DreamFactory Admin Interface
 * 
 * Comprehensive Next.js 15.1+ edge middleware that orchestrates all middleware functions
 * in a high-performance pipeline optimized for sub-100ms processing requirements.
 * 
 * This middleware replaces the Angular guard/interceptor pipeline with server-side
 * processing at the edge runtime for enhanced security, performance, and user experience.
 * 
 * Key Features:
 * - Authentication enforcement with JWT token validation
 * - Role-based access control (RBAC) and permission checking
 * - API request/response transformation and case conversion
 * - Security headers and CSRF protection
 * - Session management with automatic refresh
 * - Audit logging and performance monitoring
 * - Rate limiting and origin validation
 * - MSW integration for development environment
 * 
 * Pipeline Order:
 * 1. Route matching and bypass detection
 * 2. Security validation (origin, rate limiting)
 * 3. Authentication middleware (JWT validation, session management)
 * 4. Authorization middleware (RBAC, admin validation, paywall)
 * 5. API transformation middleware (request/response processing)
 * 6. Response enhancement (security headers, audit logging)
 * 
 * Performance Requirements:
 * - Sub-100ms total processing time (specification requirement)
 * - Edge runtime compatibility for optimal performance
 * - Minimal memory footprint and CPU usage
 * - Intelligent caching for repeated validations
 * 
 * @author DreamFactory Admin Interface Team
 * @version React 19/Next.js 15.1 Migration
 * @requires Next.js 15.1+, Edge Runtime
 */

import { NextRequest, NextResponse } from 'next/server';
import { authMiddleware } from './auth';
import { securityMiddleware } from './security';
import { apiTransformMiddleware } from './api-transform';
import {
  MiddlewareRequest,
  MiddlewareResponse,
  MiddlewareError,
  MiddlewareComponent,
  MiddlewareStage,
  AuditEvent,
  AuditEventType,
  PerformanceMetrics,
  PerformanceWarning,
  PerformanceWarningType,
  PerformanceWarningSeverity,
  SecurityHeaders,
  MIDDLEWARE_DEFAULTS,
  MIDDLEWARE_ROUTE_PATTERNS,
  MiddlewareResult,
  MiddlewareOperationContext,
  MiddlewareOperationType
} from './types';
import {
  createAuditLogEntry,
  logAuditEntry,
  createErrorResponse,
  getEnvironmentConfig,
  validateRequestOrigin,
  checkRateLimit,
  extractTokenFromRequest,
  isEdgeRuntimeSupported
} from './utils';

// ============================================================================
// CONFIGURATION AND CONSTANTS
// ============================================================================

/**
 * Middleware orchestrator configuration
 * Optimized for production performance and development flexibility
 */
interface MiddlewareOrchestratorConfig {
  // Core middleware control
  enableAuthentication: boolean;
  enableAuthorization: boolean;
  enableSecurityValidation: boolean;
  enableAPITransformation: boolean;
  
  // Performance settings
  maxProcessingTime: number;
  enablePerformanceMonitoring: boolean;
  enableCaching: boolean;
  cacheTimeout: number;
  
  // Security settings
  enableOriginValidation: boolean;
  enableRateLimiting: boolean;
  enableSecurityHeaders: boolean;
  
  // Development settings
  enableDebugLogging: boolean;
  enableMSWIntegration: boolean;
  allowBypassInDevelopment: boolean;
  
  // Audit and compliance
  enableAuditLogging: boolean;
  auditSuccessfulRequests: boolean;
  auditFailedRequests: boolean;
  
  // Error handling
  returnDetailedErrors: boolean;
  enableErrorRecovery: boolean;
  maxRetryAttempts: number;
}

/**
 * Default configuration optimized for DreamFactory Admin Interface
 */
const DEFAULT_ORCHESTRATOR_CONFIG: MiddlewareOrchestratorConfig = {
  // Core middleware control
  enableAuthentication: true,
  enableAuthorization: true,
  enableSecurityValidation: true,
  enableAPITransformation: true,
  
  // Performance settings
  maxProcessingTime: MIDDLEWARE_DEFAULTS.PROCESSING_TIMEOUT,
  enablePerformanceMonitoring: true,
  enableCaching: true,
  cacheTimeout: 300, // 5 minutes
  
  // Security settings
  enableOriginValidation: true,
  enableRateLimiting: true,
  enableSecurityHeaders: true,
  
  // Development settings
  enableDebugLogging: false,
  enableMSWIntegration: true,
  allowBypassInDevelopment: false,
  
  // Audit and compliance
  enableAuditLogging: true,
  auditSuccessfulRequests: false,
  auditFailedRequests: true,
  
  // Error handling
  returnDetailedErrors: false,
  enableErrorRecovery: true,
  maxRetryAttempts: 3
};

/**
 * Route matcher configuration for selective middleware application
 * Optimized patterns for Next.js matcher performance
 */
const MIDDLEWARE_MATCHER_CONFIG = {
  // Routes that require full middleware processing
  protectedRoutes: [
    '/((?!_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml).*)',
  ],
  
  // API routes that require transformation
  apiRoutes: [
    '/api/((?!auth).*)', // All API routes except auth
  ],
  
  // Static assets and public routes to bypass
  bypassRoutes: [
    '/_next/static/:path*',
    '/_next/image/:path*',
    '/favicon.ico',
    '/robots.txt',
    '/sitemap.xml',
    '/public/:path*',
    '/static/:path*'
  ],
  
  // Authentication routes that need special handling
  authRoutes: [
    '/login',
    '/register',
    '/forgot-password',
    '/reset-password',
    '/saml-callback'
  ]
};

// ============================================================================
// MAIN MIDDLEWARE ORCHESTRATOR FUNCTION
// ============================================================================

/**
 * Main middleware function for Next.js edge runtime
 * Orchestrates all middleware components in optimal sequence for maximum performance
 * 
 * @param request - Next.js request object
 * @returns Promise resolving to Next.js response
 */
export async function middleware(request: NextRequest): Promise<NextResponse> {
  const startTime = performance.now();
  const requestId = generateRequestId();
  const config = { ...DEFAULT_ORCHESTRATOR_CONFIG };
  const envConfig = getEnvironmentConfig();
  
  // Update config based on environment
  if (envConfig.isDevelopment) {
    config.enableDebugLogging = true;
    config.returnDetailedErrors = true;
  }
  
  // Initialize processing context
  let processingContext: MiddlewareProcessingContext = {
    requestId,
    startTime,
    request,
    config,
    user: null,
    sessionToken: null,
    processingStage: MiddlewareStage.REQUEST_RECEIVED,
    performanceMetrics: initializePerformanceMetrics(startTime),
    auditEvents: [],
    errors: [],
    warnings: [],
    bypassMiddleware: false,
    requiresAuthentication: false,
    requiresAuthorization: false,
    middlewareResults: {}
  };
  
  try {
    // Phase 1: Initial request processing and route analysis
    processingContext = await processInitialRequest(processingContext);
    
    // Early exit for bypass routes
    if (processingContext.bypassMiddleware) {
      return createBypassResponse(request, processingContext);
    }
    
    // Phase 2: Security validation (origin, rate limiting)
    processingContext = await processSecurityValidation(processingContext);
    
    // Phase 3: Authentication processing
    if (config.enableAuthentication && processingContext.requiresAuthentication) {
      processingContext = await processAuthentication(processingContext);
    }
    
    // Phase 4: Authorization processing
    if (config.enableAuthorization && processingContext.requiresAuthorization) {
      processingContext = await processAuthorization(processingContext);
    }
    
    // Phase 5: API transformation processing
    if (config.enableAPITransformation && isAPIRoute(request.nextUrl.pathname)) {
      processingContext = await processAPITransformation(processingContext);
    }
    
    // Phase 6: Final response processing
    return await createFinalResponse(processingContext);
    
  } catch (error) {
    // Global error handling for middleware failures
    return await handleMiddlewareError(error, processingContext);
  }
}

// ============================================================================
// PROCESSING PHASES
// ============================================================================

/**
 * Phase 1: Initial request processing and route analysis
 * Determines middleware requirements based on route patterns
 */
async function processInitialRequest(
  context: MiddlewareProcessingContext
): Promise<MiddlewareProcessingContext> {
  const { request, config } = context;
  const pathname = request.nextUrl.pathname;
  
  context.processingStage = MiddlewareStage.REQUEST_RECEIVED;
  
  // Log initial request if debug logging is enabled
  if (config.enableDebugLogging) {
    console.log('[MIDDLEWARE] Processing request:', {
      requestId: context.requestId,
      method: request.method,
      pathname,
      userAgent: request.headers.get('user-agent'),
      timestamp: new Date().toISOString()
    });
  }
  
  // Determine if route should bypass middleware entirely
  context.bypassMiddleware = shouldBypassMiddleware(pathname);
  
  if (!context.bypassMiddleware) {
    // Determine middleware requirements
    context.requiresAuthentication = requiresAuthentication(pathname);
    context.requiresAuthorization = requiresAuthorization(pathname);
    
    // Pre-extract session token for performance
    context.sessionToken = extractTokenFromRequest(request);
    
    // Create audit event for request processing
    if (config.enableAuditLogging) {
      const auditEvent = createAuditLogEntry(
        request,
        AuditEventType.ACCESS_GRANTED,
        true,
        { 
          requestId: context.requestId,
          stage: 'initial_processing',
          requiresAuth: context.requiresAuthentication,
          requiresAuthz: context.requiresAuthorization
        }
      );
      context.auditEvents.push(auditEvent);
    }
  }
  
  // Update performance metrics
  updatePerformanceMetrics(context.performanceMetrics, 'initialProcessingTime', context.startTime);
  
  return context;
}

/**
 * Phase 2: Security validation (origin, rate limiting, basic security checks)
 * Implements foundational security measures before authentication
 */
async function processSecurityValidation(
  context: MiddlewareProcessingContext
): Promise<MiddlewareProcessingContext> {
  const { request, config } = context;
  
  context.processingStage = MiddlewareStage.SECURITY_VALIDATION;
  const securityStartTime = performance.now();
  
  try {
    // Origin validation for CSRF protection
    if (config.enableOriginValidation && !validateRequestOrigin(request)) {
      throw createMiddlewareError(
        'Invalid request origin',
        MiddlewareComponent.SECURITY_HEADERS,
        'Origin validation failed - potential CSRF attack',
        context.requestId
      );
    }
    
    // Rate limiting check
    if (config.enableRateLimiting) {
      const clientIdentifier = getClientIdentifier(request);
      const rateLimitResult = checkRateLimit(clientIdentifier, 100, 60000); // 100 requests per minute
      
      if (!rateLimitResult.allowed) {
        throw createRateLimitError(rateLimitResult, context.requestId);
      }
      
      // Update performance metrics with rate limit info
      context.performanceMetrics.rateLimitRemaining = rateLimitResult.remaining;
      context.performanceMetrics.rateLimitResetTime = rateLimitResult.resetTime;
    }
    
    // Update performance metrics
    updatePerformanceMetrics(context.performanceMetrics, 'securityValidationTime', securityStartTime);
    
    return context;
    
  } catch (error) {
    // Security validation error handling
    const securityError = error instanceof Error && 'middlewareComponent' in error
      ? error as MiddlewareError
      : createMiddlewareError(
          'Security validation failed',
          MiddlewareComponent.SECURITY_HEADERS,
          error instanceof Error ? error.message : 'Unknown security error',
          context.requestId
        );
    
    context.errors.push(securityError);
    
    // Log security violation
    if (config.enableAuditLogging) {
      const auditEvent = createAuditLogEntry(
        request,
        AuditEventType.SECURITY_VIOLATION,
        false,
        { 
          requestId: context.requestId,
          error: securityError.message,
          stage: 'security_validation'
        }
      );
      context.auditEvents.push(auditEvent);
    }
    
    throw securityError;
  }
}

/**
 * Phase 3: Authentication processing
 * Delegates to authentication middleware for comprehensive JWT validation
 */
async function processAuthentication(
  context: MiddlewareProcessingContext
): Promise<MiddlewareProcessingContext> {
  const { request, config } = context;
  
  context.processingStage = MiddlewareStage.AUTHENTICATION_CHECK;
  const authStartTime = performance.now();
  
  try {
    // Call authentication middleware
    const authResponse = await authMiddleware(request);
    
    // Check if authentication was successful
    if (authResponse.status >= 400) {
      // Authentication failed
      throw createMiddlewareError(
        'Authentication failed',
        MiddlewareComponent.AUTHENTICATION,
        `Authentication middleware returned status: ${authResponse.status}`,
        context.requestId
      );
    }
    
    // Extract user context from authentication headers (if available)
    const userIdHeader = authResponse.headers.get('X-User-ID');
    const userEmailHeader = authResponse.headers.get('X-User-Email');
    const isAdminHeader = authResponse.headers.get('X-Is-Admin');
    
    if (userIdHeader) {
      context.user = {
        id: parseInt(userIdHeader, 10),
        email: userEmailHeader || undefined,
        isSysAdmin: isAdminHeader === 'true',
        isRootAdmin: false // Would be determined from full user data
      };
    }
    
    // Store authentication result
    context.middlewareResults.authentication = {
      success: true,
      response: authResponse,
      processingTimeMs: performance.now() - authStartTime
    };
    
    // Update performance metrics
    updatePerformanceMetrics(context.performanceMetrics, 'authenticationTime', authStartTime);
    
    return context;
    
  } catch (error) {
    const authError = error instanceof Error && 'middlewareComponent' in error
      ? error as MiddlewareError
      : createMiddlewareError(
          'Authentication processing failed',
          MiddlewareComponent.AUTHENTICATION,
          error instanceof Error ? error.message : 'Unknown authentication error',
          context.requestId
        );
    
    context.errors.push(authError);
    
    // Log authentication failure
    if (config.enableAuditLogging) {
      const auditEvent = createAuditLogEntry(
        request,
        AuditEventType.LOGIN_FAILURE,
        false,
        { 
          requestId: context.requestId,
          error: authError.message,
          stage: 'authentication'
        }
      );
      context.auditEvents.push(auditEvent);
    }
    
    throw authError;
  }
}

/**
 * Phase 4: Authorization processing
 * Delegates to security middleware for RBAC, admin validation, and paywall enforcement
 */
async function processAuthorization(
  context: MiddlewareProcessingContext
): Promise<MiddlewareProcessingContext> {
  const { request, config } = context;
  
  context.processingStage = MiddlewareStage.AUTHORIZATION_CHECK;
  const authzStartTime = performance.now();
  
  try {
    // Call security middleware for authorization
    const authzResponse = await securityMiddleware(request);
    
    // Check if authorization was successful
    if (authzResponse.status >= 400) {
      throw createMiddlewareError(
        'Authorization failed',
        MiddlewareComponent.AUTHORIZATION,
        `Security middleware returned status: ${authzResponse.status}`,
        context.requestId
      );
    }
    
    // Store authorization result
    context.middlewareResults.authorization = {
      success: true,
      response: authzResponse,
      processingTimeMs: performance.now() - authzStartTime
    };
    
    // Update performance metrics
    updatePerformanceMetrics(context.performanceMetrics, 'authorizationTime', authzStartTime);
    
    return context;
    
  } catch (error) {
    const authzError = error instanceof Error && 'middlewareComponent' in error
      ? error as MiddlewareError
      : createMiddlewareError(
          'Authorization processing failed',
          MiddlewareComponent.AUTHORIZATION,
          error instanceof Error ? error.message : 'Unknown authorization error',
          context.requestId
        );
    
    context.errors.push(authzError);
    
    // Log authorization failure
    if (config.enableAuditLogging) {
      const auditEvent = createAuditLogEntry(
        request,
        AuditEventType.PERMISSION_DENIED,
        false,
        { 
          requestId: context.requestId,
          error: authzError.message,
          stage: 'authorization'
        }
      );
      context.auditEvents.push(auditEvent);
    }
    
    throw authzError;
  }
}

/**
 * Phase 5: API transformation processing
 * Delegates to API transformation middleware for request/response processing
 */
async function processAPITransformation(
  context: MiddlewareProcessingContext
): Promise<MiddlewareProcessingContext> {
  const { request, config } = context;
  
  context.processingStage = MiddlewareStage.REQUEST_PROCESSING;
  const transformStartTime = performance.now();
  
  try {
    // Call API transformation middleware
    const transformResponse = await apiTransformMiddleware(request);
    
    // Store transformation result
    context.middlewareResults.transformation = {
      success: true,
      response: transformResponse,
      processingTimeMs: performance.now() - transformStartTime
    };
    
    // Update performance metrics
    updatePerformanceMetrics(context.performanceMetrics, 'transformationTime', transformStartTime);
    
    return context;
    
  } catch (error) {
    const transformError = error instanceof Error && 'middlewareComponent' in error
      ? error as MiddlewareError
      : createMiddlewareError(
          'API transformation failed',
          MiddlewareComponent.REQUEST_TRANSFORMATION,
          error instanceof Error ? error.message : 'Unknown transformation error',
          context.requestId
        );
    
    context.errors.push(transformError);
    
    // Transformation errors are typically non-fatal, log but continue
    if (config.enableDebugLogging) {
      console.warn('[MIDDLEWARE] API transformation warning:', transformError.message);
    }
    
    return context;
  }
}

/**
 * Phase 6: Final response processing
 * Creates the final response with security headers and audit logging
 */
async function createFinalResponse(
  context: MiddlewareProcessingContext
): Promise<NextResponse> {
  const { request, config } = context;
  
  context.processingStage = MiddlewareStage.RESPONSE_GENERATION;
  const endTime = performance.now();
  const totalProcessingTime = endTime - context.startTime;
  
  // Check performance threshold
  if (totalProcessingTime > config.maxProcessingTime) {
    const warning: PerformanceWarning = {
      warningType: PerformanceWarningType.PROCESSING_TIME_EXCEEDED,
      warningMessage: `Middleware processing exceeded threshold: ${totalProcessingTime.toFixed(2)}ms`,
      threshold: config.maxProcessingTime,
      actualValue: totalProcessingTime,
      severity: totalProcessingTime > (config.maxProcessingTime * 2) 
        ? PerformanceWarningSeverity.ERROR 
        : PerformanceWarningSeverity.WARNING,
      timestamp: new Date(),
      component: MiddlewareComponent.PERFORMANCE_MONITORING,
      requestId: context.requestId,
      userId: context.user?.id || null,
      suggestedActions: ['Optimize middleware processing', 'Check for performance bottlenecks'],
      automaticMitigation: false,
      mitigationApplied: false,
      occurrenceCount: 1,
      firstOccurrence: new Date(),
      lastOccurrence: new Date()
    };
    
    context.warnings.push(warning);
    
    if (config.enableDebugLogging) {
      console.warn('[MIDDLEWARE] Performance warning:', warning);
    }
  }
  
  // Determine the best response to use
  let baseResponse: NextResponse;
  
  if (context.middlewareResults.transformation?.response) {
    baseResponse = context.middlewareResults.transformation.response;
  } else if (context.middlewareResults.authorization?.response) {
    baseResponse = context.middlewareResults.authorization.response;
  } else if (context.middlewareResults.authentication?.response) {
    baseResponse = context.middlewareResults.authentication.response;
  } else {
    baseResponse = NextResponse.next();
  }
  
  // Add comprehensive headers
  const response = enhanceResponseWithHeaders(baseResponse, context, totalProcessingTime);
  
  // Final audit logging
  if (config.enableAuditLogging && (config.auditSuccessfulRequests || context.errors.length > 0)) {
    const finalAuditEvent = createAuditLogEntry(
      request,
      context.errors.length > 0 ? AuditEventType.SYSTEM_ERROR : AuditEventType.ACCESS_GRANTED,
      context.errors.length === 0,
      { 
        requestId: context.requestId,
        processingTimeMs: totalProcessingTime,
        warningCount: context.warnings.length,
        errorCount: context.errors.length,
        stage: 'final_processing'
      }
    );
    
    context.auditEvents.push(finalAuditEvent);
    
    // Log all audit events
    for (const auditEvent of context.auditEvents) {
      logAuditEntry(auditEvent);
    }
  }
  
  return response;
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Creates enhanced response with comprehensive headers and metadata
 */
function enhanceResponseWithHeaders(
  response: NextResponse,
  context: MiddlewareProcessingContext,
  processingTime: number
): NextResponse {
  const { config } = context;
  
  // Add security headers if enabled
  if (config.enableSecurityHeaders) {
    const securityHeaders: SecurityHeaders = {
      'X-Frame-Options': 'DENY',
      'X-Content-Type-Options': 'nosniff',
      'X-XSS-Protection': '1; mode=block',
      'Referrer-Policy': 'strict-origin-when-cross-origin',
      'Content-Security-Policy': "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; connect-src 'self' https:; font-src 'self' data:; object-src 'none'; base-uri 'self'; form-action 'self'; frame-ancestors 'none';",
      'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
      'X-DreamFactory-Version': '5.0.0',
      'X-Request-ID': context.requestId,
      'X-Processing-Time': processingTime.toFixed(2),
      'X-Cache-Status': 'BYPASS'
    };
    
    Object.entries(securityHeaders).forEach(([key, value]) => {
      if (value) {
        response.headers.set(key, value);
      }
    });
  }
  
  // Add performance monitoring headers
  response.headers.set('X-Middleware-Performance', JSON.stringify({
    totalTime: processingTime,
    authTime: context.performanceMetrics.authenticationTime,
    authzTime: context.performanceMetrics.authorizationTime,
    transformTime: context.performanceMetrics.transformationTime,
    warningCount: context.warnings.length,
    errorCount: context.errors.length
  }));
  
  // Add user context headers (for debugging in development)
  const envConfig = getEnvironmentConfig();
  if (envConfig.isDevelopment && context.user) {
    response.headers.set('X-Debug-User-ID', context.user.id?.toString() || '');
    response.headers.set('X-Debug-User-Email', context.user.email || '');
    response.headers.set('X-Debug-Is-Admin', context.user.isSysAdmin?.toString() || 'false');
  }
  
  return response;
}

/**
 * Creates bypass response for routes that don't require middleware processing
 */
function createBypassResponse(
  request: NextRequest,
  context: MiddlewareProcessingContext
): NextResponse {
  const response = NextResponse.next();
  
  // Add minimal security headers even for bypass routes
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('X-Request-ID', context.requestId);
  response.headers.set('X-Middleware-Bypass', 'true');
  
  return response;
}

/**
 * Handles middleware errors with comprehensive error response
 */
async function handleMiddlewareError(
  error: unknown,
  context: MiddlewareProcessingContext
): Promise<NextResponse> {
  const { config } = context;
  const endTime = performance.now();
  const processingTime = endTime - context.startTime;
  
  const middlewareError = error instanceof Error && 'middlewareComponent' in error
    ? error as MiddlewareError
    : createMiddlewareError(
        'Middleware processing failed',
        MiddlewareComponent.ERROR_HANDLING,
        error instanceof Error ? error.message : 'Unknown middleware error',
        context.requestId
      );
  
  // Log error
  console.error('[MIDDLEWARE] Error:', middlewareError);
  
  // Create audit event for error
  if (config.enableAuditLogging) {
    const errorAuditEvent = createAuditLogEntry(
      context.request,
      AuditEventType.SYSTEM_ERROR,
      false,
      { 
        requestId: context.requestId,
        error: middlewareError.message,
        processingTimeMs: processingTime,
        stage: 'error_handling'
      }
    );
    
    logAuditEntry(errorAuditEvent);
  }
  
  // Determine appropriate error response
  if (middlewareError.middlewareComponent === MiddlewareComponent.AUTHENTICATION) {
    // Authentication errors should redirect to login
    const url = context.request.nextUrl.clone();
    url.pathname = '/login';
    url.searchParams.set('error', 'authentication_required');
    
    const response = NextResponse.redirect(url);
    response.headers.set('X-Error-Type', 'authentication');
    response.headers.set('X-Request-ID', context.requestId);
    return response;
  }
  
  if (middlewareError.middlewareComponent === MiddlewareComponent.AUTHORIZATION) {
    // Authorization errors should return 403
    return createErrorResponse(
      'Access denied - insufficient permissions',
      403,
      { event: 'authorization_failed', requestId: context.requestId }
    );
  }
  
  if (middlewareError.middlewareComponent === MiddlewareComponent.SECURITY_HEADERS) {
    // Security errors should return 403
    return createErrorResponse(
      'Security validation failed',
      403,
      { event: 'security_violation', requestId: context.requestId }
    );
  }
  
  // Generic middleware error
  const errorMessage = config.returnDetailedErrors 
    ? `Middleware error: ${middlewareError.message}`
    : 'Internal server error';
  
  return createErrorResponse(errorMessage, 500, {
    event: 'middleware_error',
    requestId: context.requestId,
    component: middlewareError.middlewareComponent
  });
}

/**
 * Route analysis functions
 */
function shouldBypassMiddleware(pathname: string): boolean {
  return MIDDLEWARE_MATCHER_CONFIG.bypassRoutes.some(pattern => {
    const regexPattern = pattern.replace(/:\w+\*/g, '.*').replace(/\*/g, '.*');
    return new RegExp(`^${regexPattern}`).test(pathname);
  });
}

function requiresAuthentication(pathname: string): boolean {
  // Public routes don't require authentication
  if (MIDDLEWARE_MATCHER_CONFIG.authRoutes.some(route => pathname.startsWith(route))) {
    return false;
  }
  
  // API routes require authentication
  if (pathname.startsWith('/api/') && !pathname.startsWith('/api/auth')) {
    return true;
  }
  
  // Protected application routes require authentication
  return MIDDLEWARE_ROUTE_PATTERNS.PROTECTED_ROUTES.some(pattern => {
    const regexPattern = pattern.replace(/:\w+\*/g, '.*').replace(/\*/g, '.*');
    return new RegExp(`^${regexPattern}`).test(pathname);
  });
}

function requiresAuthorization(pathname: string): boolean {
  // If it requires authentication, it typically also requires authorization
  if (!requiresAuthentication(pathname)) {
    return false;
  }
  
  // Profile routes only need authentication, not special authorization
  if (pathname.startsWith('/profile')) {
    return false;
  }
  
  // All other protected routes require authorization
  return true;
}

function isAPIRoute(pathname: string): boolean {
  return pathname.startsWith('/api/');
}

/**
 * Performance and utility functions
 */
function generateRequestId(): string {
  return `mw_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

function getClientIdentifier(request: NextRequest): string {
  // Try to get user ID from session token
  const token = extractTokenFromRequest(request);
  if (token) {
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      return `user_${payload.sub}`;
    } catch {
      // Fall through to IP-based identification
    }
  }
  
  // Fall back to IP address
  return request.ip || 'unknown';
}

function initializePerformanceMetrics(startTime: number): PerformanceMetrics {
  return {
    totalProcessingTime: 0,
    averageProcessingTime: 0,
    maxProcessingTime: 0,
    minProcessingTime: 0,
    authenticationTime: 0,
    authorizationTime: 0,
    tokenValidationTime: 0,
    permissionCheckTime: 0,
    transformationTime: 0,
    auditLoggingTime: 0,
    requestSize: 0,
    responseSize: 0,
    headerCount: 0,
    cacheHitRate: 0,
    cacheRetrievalTime: 0,
    cacheStorageTime: 0,
    errorRate: 0,
    errorCount: 0,
    timeoutCount: 0,
    memoryUsage: 0,
    cpuUsage: 0,
    networkLatency: 0,
    dnsLookupTime: 0,
    connectTime: 0,
    rateLimitRemaining: 100,
    rateLimitResetTime: Date.now() + 60000
  };
}

function updatePerformanceMetrics(
  metrics: PerformanceMetrics,
  field: keyof PerformanceMetrics,
  startTime: number
): void {
  const duration = performance.now() - startTime;
  (metrics as any)[field] = duration;
}

function createMiddlewareError(
  message: string,
  component: MiddlewareComponent,
  details: string,
  requestId: string
): MiddlewareError {
  return {
    code: 'MIDDLEWARE_ERROR',
    message,
    details,
    timestamp: new Date(),
    requestId,
    retryable: false,
    middlewareComponent: component,
    processingStage: MiddlewareStage.ERROR_HANDLING,
    recoverable: false,
    requestPath: '',
    requestMethod: 'GET' as any,
    requestHeaders: {},
    userId: null,
    userEmail: null,
    sessionId: null,
    errorId: `err_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    occurredAt: new Date(),
    stackTrace: null,
    innerError: null,
    processingTimeMs: 0,
    timeoutOccurred: false,
    resourcesExhausted: false,
    recoveryAttempts: 0,
    maxRecoveryAttempts: 3,
    recoveryActions: [],
    auditEvent: null as any,
    sensitiveDataExposed: false,
    complianceImpact: null
  };
}

function createRateLimitError(
  rateLimitResult: { remaining: number; resetTime: number },
  requestId: string
): MiddlewareError {
  return createMiddlewareError(
    'Rate limit exceeded',
    MiddlewareComponent.SECURITY_HEADERS,
    `Too many requests. Remaining: ${rateLimitResult.remaining}, Reset: ${new Date(rateLimitResult.resetTime).toISOString()}`,
    requestId
  );
}

// ============================================================================
// TYPES AND INTERFACES
// ============================================================================

/**
 * Middleware processing context for state management across phases
 */
interface MiddlewareProcessingContext {
  requestId: string;
  startTime: number;
  request: NextRequest;
  config: MiddlewareOrchestratorConfig;
  user: Partial<{ id: number; email: string; isSysAdmin: boolean; isRootAdmin: boolean }> | null;
  sessionToken: string | null;
  processingStage: MiddlewareStage;
  performanceMetrics: PerformanceMetrics;
  auditEvents: AuditEvent[];
  errors: MiddlewareError[];
  warnings: PerformanceWarning[];
  bypassMiddleware: boolean;
  requiresAuthentication: boolean;
  requiresAuthorization: boolean;
  middlewareResults: {
    authentication?: MiddlewareResult<NextResponse>;
    authorization?: MiddlewareResult<NextResponse>;
    transformation?: MiddlewareResult<NextResponse>;
  };
}

// ============================================================================
// NEXT.JS MIDDLEWARE CONFIGURATION
// ============================================================================

/**
 * Next.js middleware configuration with optimized matcher
 * Ensures middleware runs only on necessary routes for optimal performance
 */
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api/auth (authentication endpoints handle their own middleware)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - robots.txt, sitemap.xml (SEO files)
     */
    '/((?!api/auth|_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml).*)',
  ],
  
  // Runtime configuration for edge compatibility
  runtime: 'edge',
  
  // Regions for edge deployment (can be configured based on requirements)
  unstable_allowDynamic: [
    '/lib/utilities/**', // Allows dynamic imports for utility functions
  ],
};

// Export the main middleware function as default
export default middleware;

// Export additional utilities for testing and integration
export {
  shouldBypassMiddleware,
  requiresAuthentication,
  requiresAuthorization,
  isAPIRoute,
  generateRequestId,
  DEFAULT_ORCHESTRATOR_CONFIG,
  MIDDLEWARE_MATCHER_CONFIG
};

export type {
  MiddlewareOrchestratorConfig,
  MiddlewareProcessingContext
};