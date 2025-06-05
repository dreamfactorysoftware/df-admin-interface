/**
 * Main Middleware Orchestrator for DreamFactory React/Next.js Admin Interface
 * 
 * Comprehensive Next.js edge middleware orchestrating authentication, security, and API transformation
 * middleware in a unified pipeline. Replaces Angular guard/interceptor architecture with modern
 * middleware-based approach providing superior performance and edge runtime compatibility.
 * 
 * Key Features:
 * - Unified middleware pipeline orchestrating auth, security, and API transformation
 * - Edge runtime optimized for sub-100ms processing performance
 * - Comprehensive route-based configuration with pattern matching
 * - Production-grade error handling and recovery mechanisms
 * - Extensive logging and audit trail generation for compliance
 * - Dynamic middleware enabling based on route patterns and environment
 * - Request/response transformation pipeline with case conversion
 * - Security header management and CORS handling
 * 
 * Architecture Overview:
 * 1. Route Pattern Matching - Determines which middleware to apply
 * 2. Authentication Validation - JWT token validation and session management
 * 3. Security Enforcement - RBAC, admin access, license validation
 * 4. API Transformation - Request/response transformation and header management
 * 5. Response Orchestration - Unified response handling across all middleware
 * 
 * Performance Requirements:
 * - Complete middleware pipeline processing under 100ms
 * - Memory-efficient request context management
 * - Edge runtime compatibility with zero cold start impact
 * - Intelligent caching and optimization strategies
 * 
 * @fileoverview Main middleware entry point replacing Angular guard/interceptor pipeline
 * @version 1.0.0
 * @since Next.js 15.1+ / React 19.0.0
 */

import { NextRequest, NextResponse } from 'next/server';
import { authMiddleware } from './auth';
import { securityMiddleware } from './security';
import { apiTransformMiddleware } from './api-transform';
import type {
  MiddlewareConfig,
  MiddlewareMatcher,
  MiddlewareRequest,
  MiddlewareResponseContext,
  MiddlewareError,
  MiddlewareMetrics,
  MiddlewareLogContext,
  AuditLogEntry,
  AuditEventType,
  TokenErrorCode
} from './types';
import {
  getClientIP,
  isStaticAsset,
  isAPIRequest,
  requiresAuthentication,
  createPerformanceMarker,
  createErrorResponse,
  createSuccessResponse,
  applyHeaders,
  SECURITY_HEADERS,
  CORS_HEADERS,
  logAuditEntry,
  createAuditLogEntry,
  getEnvironmentInfo,
  isDevelopmentMode,
  isProductionMode,
  EdgeRateLimiter
} from './utils';

// ============================================================================
// MIDDLEWARE CONFIGURATION
// ============================================================================

/**
 * Main middleware configuration defining processing rules and route patterns
 * Centralizes all middleware behavior configuration for the application
 */
const MAIN_MIDDLEWARE_CONFIG: MiddlewareConfig = {
  matcher: [
    // Exclude static assets and Next.js internal routes
    {
      source: '/((?!_next/static|_next/image|favicon.ico|static|public|api/health).*)',
      requiresAuth: false, // Will be determined by individual middleware
      priority: 1000,
      metadata: {
        description: 'Main middleware matcher - processes all non-static routes',
        category: 'universal'
      }
    }
  ],
  global: {
    enableLogging: true,
    enableMetrics: true,
    enableSecurityHeaders: true,
    defaultRedirect: '/login',
    timeout: 5000 // 5 seconds maximum processing time
  },
  environment: {
    development: {
      enableLogging: true,
      enableMetrics: true,
      timeout: 10000 // Allow longer timeout in development
    },
    production: {
      enableLogging: false, // Minimal logging in production
      enableMetrics: true,
      timeout: 5000
    }
  }
};

/**
 * Middleware execution order and enablement configuration
 * Defines the sequence and conditions for middleware execution
 */
interface MiddlewareExecutionConfig {
  /** Enable authentication middleware */
  enableAuth: boolean;
  
  /** Enable security middleware */
  enableSecurity: boolean;
  
  /** Enable API transformation middleware */
  enableAPITransform: boolean;
  
  /** Global rate limiting configuration */
  rateLimiting: {
    enabled: boolean;
    maxRequests: number;
    windowMs: number;
  };
  
  /** Environment-specific overrides */
  environmentOverrides: {
    development?: Partial<MiddlewareExecutionConfig>;
    production?: Partial<MiddlewareExecutionConfig>;
  };
}

/**
 * Default execution configuration
 */
const DEFAULT_EXECUTION_CONFIG: MiddlewareExecutionConfig = {
  enableAuth: true,
  enableSecurity: true,
  enableAPITransform: true,
  rateLimiting: {
    enabled: true,
    maxRequests: 100, // 100 requests per minute per IP
    windowMs: 60000
  },
  environmentOverrides: {
    development: {
      rateLimiting: {
        enabled: false, // Disable rate limiting in development
        maxRequests: 1000,
        windowMs: 60000
      }
    },
    production: {
      rateLimiting: {
        enabled: true,
        maxRequests: 60, // More restrictive in production
        windowMs: 60000
      }
    }
  }
};

// ============================================================================
// CORE MIDDLEWARE ORCHESTRATION
// ============================================================================

/**
 * Determines which middleware should be executed based on request characteristics
 * Implements intelligent middleware selection for optimal performance
 */
function determineMiddlewareExecution(
  request: NextRequest,
  config: MiddlewareExecutionConfig
): {
  enableAuth: boolean;
  enableSecurity: boolean;
  enableAPITransform: boolean;
} {
  const pathname = request.nextUrl.pathname;
  const method = request.method;
  
  // Apply environment-specific overrides
  const envInfo = getEnvironmentInfo();
  const envOverrides = envInfo.isDevelopment 
    ? config.environmentOverrides.development 
    : config.environmentOverrides.production;
  
  const effectiveConfig = { ...config, ...envOverrides };
  
  // Static assets - minimal middleware
  if (isStaticAsset(request)) {
    return {
      enableAuth: false,
      enableSecurity: false,
      enableAPITransform: false
    };
  }
  
  // Health check endpoints - skip auth but apply basic security
  if (pathname.startsWith('/api/health')) {
    return {
      enableAuth: false,
      enableSecurity: true,
      enableAPITransform: false
    };
  }
  
  // API routes - full middleware pipeline
  if (isAPIRequest(request)) {
    return {
      enableAuth: effectiveConfig.enableAuth,
      enableSecurity: effectiveConfig.enableSecurity,
      enableAPITransform: effectiveConfig.enableAPITransform
    };
  }
  
  // Public authentication routes - security only
  const publicAuthRoutes = ['/login', '/logout', '/saml-callback', '/forgot-password'];
  if (publicAuthRoutes.some(route => pathname.startsWith(route))) {
    return {
      enableAuth: false,
      enableSecurity: effectiveConfig.enableSecurity,
      enableAPITransform: false
    };
  }
  
  // Protected application routes - auth and security
  return {
    enableAuth: effectiveConfig.enableAuth,
    enableSecurity: effectiveConfig.enableSecurity,
    enableAPITransform: false // API transform only for API routes
  };
}

/**
 * Executes global rate limiting before middleware pipeline
 * Implements edge-compatible rate limiting for DDoS protection
 */
async function executeGlobalRateLimit(
  request: NextRequest,
  config: MiddlewareExecutionConfig
): Promise<{
  allowed: boolean;
  response?: NextResponse;
  metrics?: { remaining: number; resetTime: number };
}> {
  if (!config.rateLimiting.enabled) {
    return { allowed: true };
  }
  
  const clientIp = getClientIP(request);
  const rateLimitKey = `global:${clientIp}`;
  
  const result = EdgeRateLimiter.check(
    rateLimitKey,
    config.rateLimiting.maxRequests,
    config.rateLimiting.windowMs
  );
  
  if (!result.allowed) {
    // Create audit log for rate limit violation
    const auditEntry = createAuditLogEntry(
      request,
      'rate_limit_exceeded',
      null,
      429,
      'Global rate limit exceeded',
      {
        clientIp,
        remaining: result.remaining,
        resetTime: result.resetTime,
        limit: config.rateLimiting.maxRequests,
        window: config.rateLimiting.windowMs
      }
    );
    logAuditEntry(auditEntry);
    
    const errorResponse = createErrorResponse(
      'Rate limit exceeded. Please try again later.',
      429,
      {
        retryAfter: Math.ceil((result.resetTime - Date.now()) / 1000),
        limit: config.rateLimiting.maxRequests,
        window: config.rateLimiting.windowMs
      }
    );
    
    // Apply rate limit headers
    errorResponse.headers.set('X-RateLimit-Limit', config.rateLimiting.maxRequests.toString());
    errorResponse.headers.set('X-RateLimit-Remaining', result.remaining.toString());
    errorResponse.headers.set('X-RateLimit-Reset', result.resetTime.toString());
    errorResponse.headers.set('Retry-After', Math.ceil((result.resetTime - Date.now()) / 1000).toString());
    
    return {
      allowed: false,
      response: errorResponse,
      metrics: { remaining: result.remaining, resetTime: result.resetTime }
    };
  }
  
  return {
    allowed: true,
    metrics: { remaining: result.remaining, resetTime: result.resetTime }
  };
}

/**
 * Executes the authentication middleware and processes the response
 * Handles authentication validation and token management
 */
async function executeAuthMiddleware(
  request: NextRequest
): Promise<{
  success: boolean;
  response?: NextResponse;
  context?: {
    isAuthenticated: boolean;
    user?: any;
    sessionInfo?: any;
    processingTime: number;
  };
}> {
  const performanceMarker = createPerformanceMarker();
  
  try {
    // Execute authentication middleware
    const authResponse = await authMiddleware(request);
    const processingTime = performanceMarker.end();
    
    // Auth middleware returns NextResponse directly
    if (authResponse instanceof NextResponse) {
      // Check if it's a redirect (authentication failure)
      if (authResponse.status === 302) {
        return {
          success: false,
          response: authResponse,
          context: {
            isAuthenticated: false,
            processingTime
          }
        };
      }
      
      // Check for error responses
      if (authResponse.status >= 400) {
        return {
          success: false,
          response: authResponse,
          context: {
            isAuthenticated: false,
            processingTime
          }
        };
      }
      
      // Success - extract context from headers
      const userIdHeader = authResponse.headers.get('X-User-ID');
      const sessionIdHeader = authResponse.headers.get('X-Session-ID');
      
      return {
        success: true,
        context: {
          isAuthenticated: !!userIdHeader,
          user: userIdHeader ? { id: userIdHeader } : undefined,
          sessionInfo: sessionIdHeader ? { sessionId: sessionIdHeader } : undefined,
          processingTime
        }
      };
    }
    
    // Unexpected response type
    return {
      success: false,
      response: createErrorResponse('Authentication middleware returned unexpected response', 500),
      context: {
        isAuthenticated: false,
        processingTime
      }
    };
    
  } catch (error) {
    const processingTime = performanceMarker.end();
    
    const errorMessage = error instanceof Error ? error.message : 'Authentication middleware error';
    const errorResponse = createErrorResponse(
      `Authentication failed: ${errorMessage}`,
      500,
      { processingTime }
    );
    
    return {
      success: false,
      response: errorResponse,
      context: {
        isAuthenticated: false,
        processingTime
      }
    };
  }
}

/**
 * Executes the security middleware and processes the response
 * Handles authorization, admin access, and security validation
 */
async function executeSecurityMiddleware(
  request: NextRequest
): Promise<{
  success: boolean;
  response?: NextResponse;
  context?: MiddlewareResponseContext;
}> {
  const performanceMarker = createPerformanceMarker();
  
  try {
    const securityContext = await securityMiddleware(request);
    const processingTime = performanceMarker.end();
    
    // Security middleware returns MiddlewareResponseContext
    if (!securityContext.continue) {
      // Security middleware wants to stop processing
      let response: NextResponse;
      
      if (securityContext.response) {
        response = securityContext.response;
      } else if (securityContext.redirect) {
        response = NextResponse.redirect(securityContext.redirect);
      } else {
        response = createErrorResponse(
          securityContext.error?.message || 'Security validation failed',
          securityContext.statusCode || 403
        );
      }
      
      // Apply security headers
      response = applyHeaders(response, { securityHeaders: true });
      
      // Apply any additional headers from security context
      if (securityContext.headers) {
        Object.entries(securityContext.headers).forEach(([key, value]) => {
          response.headers.set(key, value);
        });
      }
      
      return {
        success: false,
        response,
        context: securityContext
      };
    }
    
    // Security validation passed
    return {
      success: true,
      context: {
        ...securityContext,
        metadata: {
          ...securityContext.metadata,
          processingTime: securityContext.metadata.processingTime + processingTime
        }
      }
    };
    
  } catch (error) {
    const processingTime = performanceMarker.end();
    
    const errorMessage = error instanceof Error ? error.message : 'Security middleware error';
    const errorResponse = createErrorResponse(
      `Security validation failed: ${errorMessage}`,
      500,
      { processingTime }
    );
    
    return {
      success: false,
      response: errorResponse,
      context: {
        continue: false,
        metadata: {
          processingTime,
          security: {
            headersApplied: [],
            authorizationChecks: ['error']
          }
        }
      }
    };
  }
}

/**
 * Executes the API transformation middleware and processes the response
 * Handles request/response transformation and API compatibility
 */
async function executeAPITransformMiddleware(
  request: NextRequest
): Promise<{
  success: boolean;
  response?: NextResponse;
  context?: MiddlewareResponseContext;
}> {
  const performanceMarker = createPerformanceMarker();
  
  try {
    const transformContext = await apiTransformMiddleware(request);
    const processingTime = performanceMarker.end();
    
    // API transform middleware returns MiddlewareResponseContext
    if (!transformContext.continue) {
      // Transformation middleware wants to provide a response
      let response: NextResponse;
      
      if (transformContext.response) {
        response = transformContext.response;
      } else if (transformContext.redirect) {
        response = NextResponse.redirect(transformContext.redirect);
      } else {
        response = createErrorResponse(
          transformContext.error?.message || 'API transformation failed',
          transformContext.statusCode || 500
        );
      }
      
      // Apply transformation headers
      if (transformContext.headers) {
        Object.entries(transformContext.headers).forEach(([key, value]) => {
          response.headers.set(key, value);
        });
      }
      
      return {
        success: false,
        response,
        context: transformContext
      };
    }
    
    // Transformation completed successfully
    return {
      success: true,
      context: {
        ...transformContext,
        metadata: {
          ...transformContext.metadata,
          processingTime: transformContext.metadata.processingTime + processingTime
        }
      }
    };
    
  } catch (error) {
    const processingTime = performanceMarker.end();
    
    const errorMessage = error instanceof Error ? error.message : 'API transformation error';
    const errorResponse = createErrorResponse(
      `API transformation failed: ${errorMessage}`,
      500,
      { processingTime }
    );
    
    return {
      success: false,
      response: errorResponse,
      context: {
        continue: false,
        metadata: {
          processingTime,
          security: {
            headersApplied: [],
            authorizationChecks: ['error']
          }
        }
      }
    };
  }
}

/**
 * Creates comprehensive metrics from middleware execution
 * Aggregates performance data across all middleware components
 */
function createComprehensiveMetrics(
  executionData: {
    authContext?: any;
    securityContext?: MiddlewareResponseContext;
    transformContext?: MiddlewareResponseContext;
    totalProcessingTime: number;
    rateLimitMetrics?: { remaining: number; resetTime: number };
  }
): MiddlewareMetrics {
  const authTime = executionData.authContext?.processingTime || 0;
  const securityTime = executionData.securityContext?.metadata?.processingTime || 0;
  const transformTime = executionData.transformContext?.metadata?.processingTime || 0;
  
  return {
    processingTime: executionData.totalProcessingTime,
    memoryUsage: {
      heapUsed: 0, // Edge runtime doesn't provide detailed memory info
      heapTotal: 0,
      external: 0
    },
    authentication: {
      tokenValidationTime: authTime,
      sessionLookupTime: 0,
      permissionCheckTime: securityTime
    },
    cache: {
      hits: 0,
      misses: 0,
      hitRatio: 0
    },
    network: {
      requestSize: 0,
      responseSize: 0,
      latency: executionData.totalProcessingTime
    }
  };
}

/**
 * Creates comprehensive audit log entry for middleware pipeline execution
 * Provides detailed logging for compliance and monitoring
 */
function createPipelineAuditLog(
  request: NextRequest,
  executionData: {
    authContext?: any;
    securityContext?: MiddlewareResponseContext;
    transformContext?: MiddlewareResponseContext;
    finalResponse: NextResponse;
    metrics: MiddlewareMetrics;
    errors: MiddlewareError[];
  }
): AuditLogEntry {
  const requestId = `pipe_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  
  return {
    id: requestId,
    timestamp: new Date(),
    eventType: AuditEventType.SYSTEM_EVENT,
    action: 'middleware_pipeline_execution',
    result: executionData.finalResponse.status < 400 ? 'success' : 'failure',
    user: executionData.authContext?.user ? {
      id: executionData.authContext.user.id,
      ipAddress: getClientIP(request)
    } : {
      ipAddress: getClientIP(request)
    },
    resource: {
      type: 'route',
      path: request.nextUrl.pathname
    },
    details: {
      method: request.method,
      userAgent: request.headers.get('user-agent') || 'unknown',
      processingTime: executionData.metrics.processingTime,
      statusCode: executionData.finalResponse.status,
      middlewareExecuted: {
        auth: !!executionData.authContext,
        security: !!executionData.securityContext,
        transform: !!executionData.transformContext
      },
      errors: executionData.errors.map(error => ({
        code: error.code,
        message: error.message,
        source: error.source,
        severity: error.severity
      })),
      performanceMetrics: {
        authTime: executionData.authContext?.processingTime || 0,
        securityTime: executionData.securityContext?.metadata?.processingTime || 0,
        transformTime: executionData.transformContext?.metadata?.processingTime || 0
      }
    },
    riskLevel: executionData.errors.length > 0 ? 'medium' : 'low',
    compliance: {
      gdpr: !!executionData.authContext?.user,
      sox: true
    }
  };
}

// ============================================================================
// MAIN MIDDLEWARE FUNCTION
// ============================================================================

/**
 * Main middleware function orchestrating the complete pipeline
 * Entry point for all Next.js middleware processing
 */
export async function middleware(request: NextRequest): Promise<NextResponse> {
  const pipelineStartTime = Date.now();
  const requestId = `main_${pipelineStartTime}_${Math.random().toString(36).substr(2, 9)}`;
  const clientIp = getClientIP(request);
  
  // Initialize execution tracking
  const executionData: {
    authContext?: any;
    securityContext?: MiddlewareResponseContext;
    transformContext?: MiddlewareResponseContext;
    errors: MiddlewareError[];
    rateLimitMetrics?: { remaining: number; resetTime: number };
  } = {
    errors: []
  };
  
  try {
    // Apply environment-specific configuration
    const envInfo = getEnvironmentInfo();
    const executionConfig = {
      ...DEFAULT_EXECUTION_CONFIG,
      ...(envInfo.isDevelopment 
        ? DEFAULT_EXECUTION_CONFIG.environmentOverrides.development 
        : DEFAULT_EXECUTION_CONFIG.environmentOverrides.production)
    };
    
    // 1. Global Rate Limiting
    const rateLimitResult = await executeGlobalRateLimit(request, executionConfig);
    if (!rateLimitResult.allowed) {
      return rateLimitResult.response!;
    }
    executionData.rateLimitMetrics = rateLimitResult.metrics;
    
    // 2. Determine middleware execution strategy
    const middlewareExecution = determineMiddlewareExecution(request, executionConfig);
    
    // 3. Execute Authentication Middleware
    if (middlewareExecution.enableAuth) {
      const authResult = await executeAuthMiddleware(request);
      executionData.authContext = authResult.context;
      
      if (!authResult.success) {
        // Authentication failed - return auth response immediately
        return authResult.response!;
      }
    }
    
    // 4. Execute Security Middleware
    if (middlewareExecution.enableSecurity) {
      const securityResult = await executeSecurityMiddleware(request);
      executionData.securityContext = securityResult.context;
      
      if (!securityResult.success) {
        // Security validation failed - return security response
        return securityResult.response!;
      }
    }
    
    // 5. Execute API Transformation Middleware
    if (middlewareExecution.enableAPITransform) {
      const transformResult = await executeAPITransformMiddleware(request);
      executionData.transformContext = transformResult.context;
      
      if (!transformResult.success) {
        // API transformation provided a response - return it
        return transformResult.response!;
      }
    }
    
    // 6. All middleware passed - continue to application
    const finalResponse = NextResponse.next();
    
    // Apply aggregated headers from all middleware
    const aggregatedHeaders: Record<string, string> = {
      ...SECURITY_HEADERS,
      'X-Request-ID': requestId,
      'X-Processing-Time': (Date.now() - pipelineStartTime).toString()
    };
    
    // Add rate limit headers if available
    if (executionData.rateLimitMetrics) {
      aggregatedHeaders['X-RateLimit-Remaining'] = executionData.rateLimitMetrics.remaining.toString();
      aggregatedHeaders['X-RateLimit-Reset'] = executionData.rateLimitMetrics.resetTime.toString();
    }
    
    // Add authentication headers if authenticated
    if (executionData.authContext?.user) {
      aggregatedHeaders['X-User-ID'] = executionData.authContext.user.id.toString();
    }
    
    // Add security headers from security middleware
    if (executionData.securityContext?.headers) {
      Object.assign(aggregatedHeaders, executionData.securityContext.headers);
    }
    
    // Apply CORS headers for API requests
    if (isAPIRequest(request)) {
      Object.assign(aggregatedHeaders, CORS_HEADERS);
    }
    
    // Apply all headers to response
    Object.entries(aggregatedHeaders).forEach(([key, value]) => {
      finalResponse.headers.set(key, value);
    });
    
    // 7. Create comprehensive metrics and audit log
    const totalProcessingTime = Date.now() - pipelineStartTime;
    const metrics = createComprehensiveMetrics({
      ...executionData,
      totalProcessingTime
    });
    
    // Log successful pipeline execution
    const auditEntry = createPipelineAuditLog(request, {
      ...executionData,
      finalResponse,
      metrics,
      errors: executionData.errors
    });
    
    logAuditEntry(auditEntry);
    
    // 8. Performance monitoring
    if (totalProcessingTime > 100) {
      console.warn(`[MIDDLEWARE_PERFORMANCE] Slow middleware execution: ${totalProcessingTime}ms for ${request.nextUrl.pathname}`);
    }
    
    return finalResponse;
    
  } catch (error) {
    // Handle unexpected middleware pipeline errors
    const totalProcessingTime = Date.now() - pipelineStartTime;
    const errorMessage = error instanceof Error ? error.message : 'Unknown middleware pipeline error';
    
    // Create error audit log
    const errorAuditEntry = createAuditLogEntry(
      request,
      'middleware_pipeline_error',
      null,
      500,
      errorMessage,
      {
        requestId,
        processingTime: totalProcessingTime,
        clientIp,
        executionState: {
          authExecuted: !!executionData.authContext,
          securityExecuted: !!executionData.securityContext,
          transformExecuted: !!executionData.transformContext
        },
        error: error instanceof Error ? {
          name: error.name,
          message: error.message,
          stack: error.stack
        } : error
      }
    );
    
    logAuditEntry(errorAuditEntry);
    
    // Return appropriate error response
    const errorResponse = createErrorResponse(
      envInfo.isDevelopment 
        ? `Middleware pipeline error: ${errorMessage}`
        : 'Internal server error',
      500,
      {
        requestId,
        processingTime: totalProcessingTime,
        ...(envInfo.isDevelopment ? { error: errorMessage } : {})
      }
    );
    
    return errorResponse;
  }
}

// ============================================================================
// MIDDLEWARE CONFIGURATION EXPORT
// ============================================================================

/**
 * Next.js middleware configuration
 * Defines which routes should be processed by middleware
 */
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api/health (health check endpoints)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - static (static assets)
     * - public (public assets)
     */
    '/((?!api/health|_next/static|_next/image|favicon.ico|static|public).*)',
  ],
};

// ============================================================================
// UTILITY EXPORTS
// ============================================================================

/**
 * Create a custom middleware configuration for advanced use cases
 */
export function createCustomMiddleware(
  customConfig: Partial<MiddlewareExecutionConfig>
): typeof middleware {
  const mergedConfig = { ...DEFAULT_EXECUTION_CONFIG, ...customConfig };
  
  return async function customMiddleware(request: NextRequest): Promise<NextResponse> {
    // Store original config
    const originalConfig = Object.assign({}, DEFAULT_EXECUTION_CONFIG);
    
    // Apply custom config
    Object.assign(DEFAULT_EXECUTION_CONFIG, mergedConfig);
    
    try {
      // Execute main middleware with custom config
      return await middleware(request);
    } finally {
      // Restore original config
      Object.assign(DEFAULT_EXECUTION_CONFIG, originalConfig);
    }
  };
}

/**
 * Development-optimized middleware with enhanced logging and debugging
 */
export function createDevelopmentMiddleware(): typeof middleware {
  return createCustomMiddleware({
    rateLimiting: {
      enabled: false,
      maxRequests: 1000,
      windowMs: 60000
    },
    environmentOverrides: {
      development: {
        enableAuth: true,
        enableSecurity: true,
        enableAPITransform: true,
        rateLimiting: {
          enabled: false,
          maxRequests: 1000,
          windowMs: 60000
        }
      }
    }
  });
}

/**
 * Production-optimized middleware with enhanced security and performance
 */
export function createProductionMiddleware(): typeof middleware {
  return createCustomMiddleware({
    rateLimiting: {
      enabled: true,
      maxRequests: 60,
      windowMs: 60000
    },
    environmentOverrides: {
      production: {
        enableAuth: true,
        enableSecurity: true,
        enableAPITransform: true,
        rateLimiting: {
          enabled: true,
          maxRequests: 60,
          windowMs: 60000
        }
      }
    }
  });
}

/**
 * Export middleware configuration and utilities
 */
export {
  MAIN_MIDDLEWARE_CONFIG,
  DEFAULT_EXECUTION_CONFIG,
  type MiddlewareExecutionConfig,
  determineMiddlewareExecution,
  executeGlobalRateLimit,
  createComprehensiveMetrics,
  createPipelineAuditLog
};

/**
 * Default export for Next.js middleware
 */
export default middleware;