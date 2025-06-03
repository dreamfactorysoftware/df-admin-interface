/**
 * @fileoverview API Request/Response Transformation Middleware for DreamFactory Admin Interface
 * 
 * Comprehensive Next.js 15.1+ edge middleware that replaces Angular HTTP interceptors
 * with server-side processing for optimal performance and enhanced security.
 * 
 * This middleware implements the following Angular interceptor migrations:
 * - case.interceptor.ts: Automatic camelCase/snake_case transformation
 * - session-token.interceptor.ts: Automatic session token attachment
 * - loading.interceptor.ts: Loading state management headers
 * - snackbar.interceptor.ts: UI notification headers
 * 
 * Key Features:
 * - Sub-100ms processing requirement compliance
 * - Edge runtime optimization for Next.js 15.1+
 * - DreamFactory API compatibility maintenance
 * - MSW integration for development environment
 * - Comprehensive audit logging and error handling
 * - Case transformation between camelCase and snake_case
 * - Automatic authentication header injection
 * - Loading state coordination through headers
 * - UI notification management via response headers
 * 
 * Architecture:
 * - Stateless transformation pipeline
 * - Immutable request/response handling
 * - Performance-optimized case conversion
 * - Secure token management
 * - Development/production environment adaptation
 * 
 * @author DreamFactory Admin Interface Team
 * @version React 19/Next.js 15.1 Migration
 * @requires Next.js 15.1+, Edge Runtime
 */

import { NextRequest, NextResponse } from 'next/server';
import {
  MiddlewareRequest,
  MiddlewareResponse,
  RequestTransformationContext,
  ResponseTransformationContext,
  TransformationRule,
  HeaderTransformation,
  BodyTransformation,
  BodyTransformationType,
  HeaderTransformationAction,
  MiddlewareError,
  MiddlewareComponent,
  MiddlewareStage,
  AuditEvent,
  AuditEventType,
  PerformanceMetrics,
  PerformanceWarning,
  PerformanceWarningType,
  PerformanceWarningSeverity,
  MIDDLEWARE_DEFAULTS
} from './types';
import {
  validateJWTStructure,
  extractTokenFromRequest,
  sanitizeRequestHeaders,
  addAuthenticationHeaders,
  createAuthenticationResponseHeaders,
  transformKeysToCamelCase,
  transformKeysToSnakeCase,
  createAuditLogEntry,
  logAuditEntry,
  getEnvironmentConfig,
  createErrorResponse,
  validateRequestOrigin,
  checkRateLimit,
  updateSessionActivity,
  SessionData,
  JWTPayload
} from './utils';

// ============================================================================
// CONFIGURATION AND CONSTANTS
// ============================================================================

/**
 * API transformation configuration for DreamFactory compatibility
 * Optimized for sub-100ms processing requirement
 */
interface APITransformConfig {
  // Core transformation settings
  enableRequestTransformation: boolean;
  enableResponseTransformation: boolean;
  enableCaseTransformation: boolean;
  enableSessionTokenInjection: boolean;
  enableLoadingHeaders: boolean;
  enableSnackbarHeaders: boolean;
  
  // Performance optimization
  maxProcessingTime: number;
  enablePerformanceMonitoring: boolean;
  cacheTransformations: boolean;
  
  // Development features
  enableMSWIntegration: boolean;
  enableDebugLogging: boolean;
  
  // Security settings
  enableAuditLogging: boolean;
  validateOrigin: boolean;
  enableRateLimiting: boolean;
  
  // DreamFactory API paths
  dreamfactoryApiPaths: string[];
  excludePaths: string[];
}

/**
 * Default configuration optimized for DreamFactory integration
 */
const DEFAULT_CONFIG: APITransformConfig = {
  enableRequestTransformation: true,
  enableResponseTransformation: true,
  enableCaseTransformation: true,
  enableSessionTokenInjection: true,
  enableLoadingHeaders: true,
  enableSnackbarHeaders: true,
  maxProcessingTime: MIDDLEWARE_DEFAULTS.PROCESSING_TIMEOUT,
  enablePerformanceMonitoring: true,
  cacheTransformations: true,
  enableMSWIntegration: true,
  enableDebugLogging: false,
  enableAuditLogging: true,
  validateOrigin: true,
  enableRateLimiting: true,
  dreamfactoryApiPaths: ['/api/v2', '/system/api/v2'],
  excludePaths: ['/_next', '/favicon.ico', '/public', '/static']
};

/**
 * MSW (Mock Service Worker) detection patterns for development
 */
const MSW_DETECTION_PATTERNS = {
  headers: ['x-msw-intention', 'x-msw-request-id'],
  userAgent: ['MSW', 'mock-service-worker'],
  localhost: ['localhost', '127.0.0.1', '0.0.0.0']
};

/**
 * Case transformation patterns for API compatibility
 */
const CASE_TRANSFORM_PATTERNS = {
  // Fields that should remain unchanged during transformation
  excludeFields: [
    '_links', '_embedded', '_metadata', '__v', '_id',
    'id', 'ID', 'uuid', 'UUID', 'url', 'URL', 'uri', 'URI',
    'api_key', 'session_token', 'access_token', 'refresh_token'
  ],
  // Patterns for identifying DreamFactory API responses
  dreamfactoryResponseKeys: [
    'session_token', 'session_id', 'last_login_date',
    'user_id', 'display_name', 'first_name', 'last_name',
    'email', 'is_active', 'is_sys_admin'
  ]
};

// ============================================================================
// TRANSFORMATION PIPELINE IMPLEMENTATION
// ============================================================================

/**
 * Main API transformation middleware function
 * Processes all HTTP requests/responses with comprehensive transformation
 * 
 * @param request - Next.js request object
 * @param config - Optional transformation configuration
 * @returns Promise resolving to transformed response
 */
export async function apiTransformMiddleware(
  request: NextRequest,
  config: Partial<APITransformConfig> = {}
): Promise<NextResponse> {
  const startTime = performance.now();
  const requestId = generateRequestId();
  const finalConfig = { ...DEFAULT_CONFIG, ...config };
  
  let auditEvent: AuditEvent | null = null;
  let processingError: MiddlewareError | null = null;
  let performanceWarnings: PerformanceWarning[] = [];
  
  try {
    // Skip transformation for excluded paths
    if (shouldSkipTransformation(request, finalConfig)) {
      return NextResponse.next();
    }
    
    // Environment detection and MSW handling
    const environmentInfo = await detectEnvironment(request, finalConfig);
    if (environmentInfo.isMSW && finalConfig.enableMSWIntegration) {
      return handleMSWRequest(request, finalConfig);
    }
    
    // Rate limiting check
    if (finalConfig.enableRateLimiting) {
      const rateLimit = checkRateLimit(getClientIdentifier(request));
      if (!rateLimit.allowed) {
        return createRateLimitResponse(rateLimit);
      }
    }
    
    // Origin validation for security
    if (finalConfig.validateOrigin && !validateRequestOrigin(request)) {
      processingError = createMiddlewareError(
        'Invalid request origin',
        MiddlewareComponent.SECURITY_HEADERS,
        MiddlewareStage.REQUEST_RECEIVED,
        request,
        requestId
      );
      return createErrorResponse('Invalid request origin', 403);
    }
    
    // Request transformation pipeline
    const transformedRequest = await transformRequest(request, finalConfig, requestId);
    
    // Process the request (in real middleware, this would be next())
    // For now, we'll simulate the response transformation
    const response = await processTransformedRequest(transformedRequest, finalConfig);
    
    // Response transformation pipeline
    const transformedResponse = await transformResponse(response, finalConfig, requestId);
    
    // Performance monitoring
    const processingTime = performance.now() - startTime;
    if (processingTime > finalConfig.maxProcessingTime) {
      performanceWarnings.push(createPerformanceWarning(
        PerformanceWarningType.PROCESSING_TIME_EXCEEDED,
        'API transformation exceeded time limit',
        finalConfig.maxProcessingTime,
        processingTime,
        PerformanceWarningSeverity.WARNING,
        requestId
      ));
    }
    
    // Audit logging
    if (finalConfig.enableAuditLogging) {
      auditEvent = createAuditLogEntry(
        request,
        'API_TRANSFORMATION_SUCCESS',
        true,
        { requestId, processingTime }
      );
      logAuditEntry(auditEvent);
    }
    
    return enhanceResponseWithMetadata(transformedResponse, {
      requestId,
      processingTime,
      performanceWarnings,
      auditEvent
    });
    
  } catch (error) {
    const processingTime = performance.now() - startTime;
    processingError = createMiddlewareError(
      error instanceof Error ? error.message : 'Unknown transformation error',
      MiddlewareComponent.REQUEST_TRANSFORMATION,
      MiddlewareStage.REQUEST_PROCESSING,
      request,
      requestId,
      error instanceof Error ? error : undefined
    );
    
    // Error audit logging
    if (finalConfig.enableAuditLogging) {
      auditEvent = createAuditLogEntry(
        request,
        'API_TRANSFORMATION_ERROR',
        false,
        { 
          requestId, 
          processingTime,
          error: processingError.message 
        }
      );
      logAuditEntry(auditEvent);
    }
    
    // Return error response with appropriate status
    return createErrorResponse(
      getEnvironmentConfig().isDevelopment ? processingError.message : 'Transformation failed',
      500
    );
  }
}

/**
 * Transforms outgoing HTTP requests with comprehensive enhancement
 * Implements case.interceptor.ts and session-token.interceptor.ts functionality
 * 
 * @param request - Original Next.js request
 * @param config - Transformation configuration
 * @param requestId - Unique request identifier
 * @returns Promise resolving to transformed request
 */
async function transformRequest(
  request: NextRequest,
  config: APITransformConfig,
  requestId: string
): Promise<NextRequest> {
  const transformationContext: RequestTransformationContext = {
    originalRequest: request,
    transformationRules: [],
    enableTransformation: config.enableRequestTransformation,
    headerTransformations: [],
    addHeaders: {},
    removeHeaders: [],
    modifyHeaders: {},
    bodyTransformation: null,
    queryTransformations: [],
    injectAuthentication: config.enableSessionTokenInjection,
    authenticationHeaders: {},
    transformationTime: 0,
    transformationErrors: [],
    validateTransformation: true,
    validationErrors: []
  };
  
  const startTime = performance.now();
  
  try {
    // Clone request for transformation
    let transformedRequest = request.clone();
    
    // Step 1: Session token injection (session-token.interceptor.ts migration)
    if (config.enableSessionTokenInjection) {
      transformedRequest = await injectSessionToken(transformedRequest, config);
    }
    
    // Step 2: Request header transformations
    transformedRequest = await transformRequestHeaders(transformedRequest, config);
    
    // Step 3: Loading state headers (loading.interceptor.ts migration)
    if (config.enableLoadingHeaders) {
      transformedRequest = await addLoadingHeaders(transformedRequest, requestId);
    }
    
    // Step 4: Request body case transformation (case.interceptor.ts migration)
    if (config.enableCaseTransformation && isDreamFactoryApiRequest(request, config)) {
      transformedRequest = await transformRequestBody(transformedRequest, config);
    }
    
    // Step 5: Security and audit headers
    transformedRequest = await addSecurityHeaders(transformedRequest, config);
    
    transformationContext.transformationTime = performance.now() - startTime;
    
    if (config.enableDebugLogging) {
      console.log('[API Transform] Request transformed:', {
        requestId,
        transformationTime: transformationContext.transformationTime,
        headers: Object.fromEntries(transformedRequest.headers.entries())
      });
    }
    
    return transformedRequest;
    
  } catch (error) {
    throw new Error(`Request transformation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Transforms incoming HTTP responses with comprehensive enhancement
 * Implements case.interceptor.ts and snackbar.interceptor.ts functionality
 * 
 * @param response - Original Next.js response
 * @param config - Transformation configuration
 * @param requestId - Unique request identifier
 * @returns Promise resolving to transformed response
 */
async function transformResponse(
  response: NextResponse,
  config: APITransformConfig,
  requestId: string
): Promise<NextResponse> {
  const transformationContext: ResponseTransformationContext = {
    originalResponse: response,
    transformationRules: [],
    enableTransformation: config.enableResponseTransformation,
    headerTransformations: [],
    securityHeaders: MIDDLEWARE_DEFAULTS.DEFAULT_SECURITY_HEADERS,
    bodyTransformation: null,
    statusCodeTransformation: null,
    errorTransformation: null,
    transformationTime: 0,
    transformationErrors: [],
    cacheDirectives: []
  };
  
  const startTime = performance.now();
  
  try {
    // Clone response for transformation
    let transformedResponse = response.clone();
    
    // Step 1: Response header transformations and security headers
    transformedResponse = await transformResponseHeaders(transformedResponse, config, requestId);
    
    // Step 2: Snackbar notification headers (snackbar.interceptor.ts migration)
    if (config.enableSnackbarHeaders) {
      transformedResponse = await addSnackbarHeaders(transformedResponse, config);
    }
    
    // Step 3: Response body case transformation (case.interceptor.ts migration)
    if (config.enableCaseTransformation) {
      transformedResponse = await transformResponseBody(transformedResponse, config);
    }
    
    // Step 4: Loading state completion headers (loading.interceptor.ts migration)
    if (config.enableLoadingHeaders) {
      transformedResponse = await addLoadingCompletionHeaders(transformedResponse, requestId);
    }
    
    // Step 5: Performance and audit headers
    transformedResponse = await addPerformanceHeaders(transformedResponse, transformationContext);
    
    transformationContext.transformationTime = performance.now() - startTime;
    
    if (config.enableDebugLogging) {
      console.log('[API Transform] Response transformed:', {
        requestId,
        transformationTime: transformationContext.transformationTime,
        status: transformedResponse.status,
        headers: Object.fromEntries(transformedResponse.headers.entries())
      });
    }
    
    return transformedResponse;
    
  } catch (error) {
    throw new Error(`Response transformation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

// ============================================================================
// SESSION TOKEN INJECTION (session-token.interceptor.ts migration)
// ============================================================================

/**
 * Injects DreamFactory session token into outgoing requests
 * Replaces Angular session-token.interceptor.ts functionality
 * 
 * @param request - Request to enhance with session token
 * @param config - Transformation configuration
 * @returns Promise resolving to request with session token
 */
async function injectSessionToken(
  request: NextRequest,
  config: APITransformConfig
): Promise<NextRequest> {
  try {
    // Extract existing session token from request
    const existingToken = extractTokenFromRequest(request);
    
    if (existingToken) {
      // Validate existing token
      const validation = await validateJWTStructure(existingToken);
      if (validation.valid && validation.payload) {
        // Token is valid, add to headers if not already present
        const newHeaders = addAuthenticationHeaders(
          request.headers,
          existingToken
        );
        
        return new NextRequest(request, { headers: newHeaders });
      }
    }
    
    // Attempt to retrieve session token from secure storage
    const sessionToken = await retrieveStoredSessionToken(request);
    if (sessionToken) {
      const newHeaders = addAuthenticationHeaders(
        request.headers,
        sessionToken
      );
      
      return new NextRequest(request, { headers: newHeaders });
    }
    
    // No valid session token available - continue without modification
    return request;
    
  } catch (error) {
    console.warn('[Session Token] Injection failed:', error);
    return request; // Continue without session token on error
  }
}

/**
 * Retrieves stored session token from secure storage
 * Implements server-side session token retrieval
 * 
 * @param request - Request containing potential session information
 * @returns Promise resolving to session token or null
 */
async function retrieveStoredSessionToken(request: NextRequest): Promise<string | null> {
  try {
    const config = getEnvironmentConfig();
    const sessionCookie = request.cookies.get(config.sessionCookieName);
    
    if (sessionCookie?.value) {
      // Validate the session token
      const validation = await validateJWTStructure(sessionCookie.value);
      if (validation.valid) {
        return sessionCookie.value;
      }
    }
    
    return null;
  } catch (error) {
    console.warn('[Session Token] Retrieval failed:', error);
    return null;
  }
}

// ============================================================================
// CASE TRANSFORMATION (case.interceptor.ts migration)
// ============================================================================

/**
 * Transforms request body from camelCase to snake_case for DreamFactory API
 * Replaces Angular case.interceptor.ts functionality for outgoing requests
 * 
 * @param request - Request with body to transform
 * @param config - Transformation configuration
 * @returns Promise resolving to request with transformed body
 */
async function transformRequestBody(
  request: NextRequest,
  config: APITransformConfig
): Promise<NextRequest> {
  try {
    if (!request.body || request.method === 'GET' || request.method === 'HEAD') {
      return request; // No body to transform
    }
    
    const contentType = request.headers.get('content-type') || '';
    if (!contentType.includes('application/json')) {
      return request; // Only transform JSON bodies
    }
    
    // Read and parse the request body
    const bodyText = await request.text();
    if (!bodyText.trim()) {
      return request; // Empty body
    }
    
    try {
      const bodyData = JSON.parse(bodyText);
      
      // Transform keys to snake_case for DreamFactory API compatibility
      const transformedData = transformKeysToSnakeCase(bodyData);
      
      // Create new request with transformed body
      const transformedBody = JSON.stringify(transformedData);
      const newHeaders = new Headers(request.headers);
      newHeaders.set('content-length', transformedBody.length.toString());
      
      return new NextRequest(request, {
        headers: newHeaders,
        body: transformedBody,
        method: request.method
      });
      
    } catch (parseError) {
      console.warn('[Case Transform] JSON parse error:', parseError);
      return request; // Return original request if JSON parsing fails
    }
    
  } catch (error) {
    console.warn('[Case Transform] Request body transformation failed:', error);
    return request; // Return original request on error
  }
}

/**
 * Transforms response body from snake_case to camelCase for JavaScript compatibility
 * Replaces Angular case.interceptor.ts functionality for incoming responses
 * 
 * @param response - Response with body to transform
 * @param config - Transformation configuration
 * @returns Promise resolving to response with transformed body
 */
async function transformResponseBody(
  response: NextResponse,
  config: APITransformConfig
): Promise<NextResponse> {
  try {
    const contentType = response.headers.get('content-type') || '';
    if (!contentType.includes('application/json')) {
      return response; // Only transform JSON responses
    }
    
    // Read and parse the response body
    const bodyText = await response.text();
    if (!bodyText.trim()) {
      return response; // Empty body
    }
    
    try {
      const bodyData = JSON.parse(bodyText);
      
      // Check if this looks like a DreamFactory API response
      if (isDreamFactoryApiResponse(bodyData)) {
        // Transform keys to camelCase for JavaScript compatibility
        const transformedData = transformKeysToCamelCase(bodyData);
        
        // Create new response with transformed body
        const transformedBody = JSON.stringify(transformedData);
        const newHeaders = new Headers(response.headers);
        newHeaders.set('content-length', transformedBody.length.toString());
        
        return new NextResponse(transformedBody, {
          status: response.status,
          statusText: response.statusText,
          headers: newHeaders
        });
      }
      
      return response; // Not a DreamFactory response, return unchanged
      
    } catch (parseError) {
      console.warn('[Case Transform] JSON parse error:', parseError);
      return response; // Return original response if JSON parsing fails
    }
    
  } catch (error) {
    console.warn('[Case Transform] Response body transformation failed:', error);
    return response; // Return original response on error
  }
}

/**
 * Determines if a response body contains DreamFactory API data
 * Uses heuristics to identify API responses that need transformation
 * 
 * @param data - Parsed response body data
 * @returns Boolean indicating if this is a DreamFactory API response
 */
function isDreamFactoryApiResponse(data: any): boolean {
  if (!data || typeof data !== 'object') {
    return false;
  }
  
  // Check for common DreamFactory response patterns
  const hasSessionToken = 'session_token' in data || 'sessionToken' in data;
  const hasUserId = 'user_id' in data || 'userId' in data;
  const hasDisplayName = 'display_name' in data || 'displayName' in data;
  const hasResource = 'resource' in data && Array.isArray(data.resource);
  const hasMetadata = '_metadata' in data || 'metadata' in data;
  
  // Check for any DreamFactory-specific keys
  const hasDreamFactoryKeys = CASE_TRANSFORM_PATTERNS.dreamfactoryResponseKeys.some(
    key => key in data
  );
  
  return hasSessionToken || hasUserId || hasDisplayName || hasResource || hasMetadata || hasDreamFactoryKeys;
}

// ============================================================================
// LOADING STATE MANAGEMENT (loading.interceptor.ts migration)
// ============================================================================

/**
 * Adds loading state management headers to outgoing requests
 * Replaces Angular loading.interceptor.ts functionality
 * 
 * @param request - Request to enhance with loading headers
 * @param requestId - Unique request identifier
 * @returns Promise resolving to request with loading headers
 */
async function addLoadingHeaders(
  request: NextRequest,
  requestId: string
): Promise<NextRequest> {
  try {
    const newHeaders = new Headers(request.headers);
    
    // Add loading state tracking headers
    newHeaders.set('X-Loading-Request-ID', requestId);
    newHeaders.set('X-Loading-Start-Time', Date.now().toString());
    newHeaders.set('X-Loading-State', 'started');
    
    // Add correlation headers for frontend loading state management
    newHeaders.set('X-Request-Correlation-ID', requestId);
    
    return new NextRequest(request, { headers: newHeaders });
    
  } catch (error) {
    console.warn('[Loading Headers] Addition failed:', error);
    return request;
  }
}

/**
 * Adds loading completion headers to responses
 * Enables frontend loading state cleanup
 * 
 * @param response - Response to enhance with loading completion headers
 * @param requestId - Unique request identifier
 * @returns Promise resolving to response with loading completion headers
 */
async function addLoadingCompletionHeaders(
  response: NextResponse,
  requestId: string
): Promise<NextResponse> {
  try {
    const newHeaders = new Headers(response.headers);
    
    // Add loading completion tracking headers
    newHeaders.set('X-Loading-Request-ID', requestId);
    newHeaders.set('X-Loading-End-Time', Date.now().toString());
    newHeaders.set('X-Loading-State', 'completed');
    newHeaders.set('X-Loading-Success', response.ok ? 'true' : 'false');
    
    return new NextResponse(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers: newHeaders
    });
    
  } catch (error) {
    console.warn('[Loading Completion Headers] Addition failed:', error);
    return response;
  }
}

// ============================================================================
// SNACKBAR NOTIFICATION MANAGEMENT (snackbar.interceptor.ts migration)
// ============================================================================

/**
 * Adds snackbar notification headers to responses
 * Replaces Angular snackbar.interceptor.ts functionality
 * 
 * @param response - Response to enhance with snackbar headers
 * @param config - Transformation configuration
 * @returns Promise resolving to response with snackbar headers
 */
async function addSnackbarHeaders(
  response: NextResponse,
  config: APITransformConfig
): Promise<NextResponse> {
  try {
    const newHeaders = new Headers(response.headers);
    
    // Determine notification type based on response status
    if (response.status >= 200 && response.status < 300) {
      // Success notification
      newHeaders.set('X-Snackbar-Type', 'success');
      newHeaders.set('X-Snackbar-Message', getSuccessMessage(response.status));
      newHeaders.set('X-Snackbar-Duration', '3000'); // 3 seconds
    } else if (response.status >= 400 && response.status < 500) {
      // Client error notification
      newHeaders.set('X-Snackbar-Type', 'error');
      newHeaders.set('X-Snackbar-Message', getErrorMessage(response.status));
      newHeaders.set('X-Snackbar-Duration', '5000'); // 5 seconds
    } else if (response.status >= 500) {
      // Server error notification
      newHeaders.set('X-Snackbar-Type', 'error');
      newHeaders.set('X-Snackbar-Message', 'Server error occurred. Please try again.');
      newHeaders.set('X-Snackbar-Duration', '7000'); // 7 seconds
    }
    
    // Add auto-dismiss and position information
    newHeaders.set('X-Snackbar-Auto-Dismiss', 'true');
    newHeaders.set('X-Snackbar-Position', 'bottom-right');
    
    return new NextResponse(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers: newHeaders
    });
    
  } catch (error) {
    console.warn('[Snackbar Headers] Addition failed:', error);
    return response;
  }
}

/**
 * Gets appropriate success message based on response status
 * 
 * @param status - HTTP status code
 * @returns Success message string
 */
function getSuccessMessage(status: number): string {
  switch (status) {
    case 200: return 'Operation completed successfully';
    case 201: return 'Resource created successfully';
    case 202: return 'Request accepted for processing';
    case 204: return 'Operation completed';
    default: return 'Request completed successfully';
  }
}

/**
 * Gets appropriate error message based on response status
 * 
 * @param status - HTTP status code
 * @returns Error message string
 */
function getErrorMessage(status: number): string {
  switch (status) {
    case 400: return 'Invalid request. Please check your input.';
    case 401: return 'Authentication required. Please log in.';
    case 403: return 'Access denied. Insufficient permissions.';
    case 404: return 'Resource not found.';
    case 409: return 'Conflict occurred. Resource may already exist.';
    case 422: return 'Validation failed. Please check your input.';
    case 429: return 'Too many requests. Please try again later.';
    default: return 'Request failed. Please try again.';
  }
}

// ============================================================================
// HEADER TRANSFORMATION UTILITIES
// ============================================================================

/**
 * Transforms request headers with security and API compatibility enhancements
 * 
 * @param request - Request to transform headers for
 * @param config - Transformation configuration
 * @returns Promise resolving to request with transformed headers
 */
async function transformRequestHeaders(
  request: NextRequest,
  config: APITransformConfig
): Promise<NextRequest> {
  try {
    const newHeaders = new Headers(request.headers);
    
    // Sanitize existing headers
    const sanitizedHeaders = sanitizeRequestHeaders(request.headers);
    
    // Apply sanitized headers
    Object.entries(sanitizedHeaders).forEach(([key, value]) => {
      newHeaders.set(key, value);
    });
    
    // Add DreamFactory-specific headers
    if (isDreamFactoryApiRequest(request, config)) {
      newHeaders.set('X-DreamFactory-API-Version', '2.0');
      newHeaders.set('Accept', 'application/json');
      
      // Ensure content-type is set for POST/PUT/PATCH requests
      if (['POST', 'PUT', 'PATCH'].includes(request.method) && 
          !newHeaders.has('Content-Type')) {
        newHeaders.set('Content-Type', 'application/json');
      }
    }
    
    return new NextRequest(request, { headers: newHeaders });
    
  } catch (error) {
    console.warn('[Request Headers] Transformation failed:', error);
    return request;
  }
}

/**
 * Transforms response headers with security and performance enhancements
 * 
 * @param response - Response to transform headers for
 * @param config - Transformation configuration
 * @param requestId - Unique request identifier
 * @returns Promise resolving to response with transformed headers
 */
async function transformResponseHeaders(
  response: NextResponse,
  config: APITransformConfig,
  requestId: string
): Promise<NextResponse> {
  try {
    const newHeaders = new Headers(response.headers);
    
    // Add security headers
    const securityHeaders = MIDDLEWARE_DEFAULTS.DEFAULT_SECURITY_HEADERS;
    Object.entries(securityHeaders).forEach(([key, value]) => {
      if (value) {
        newHeaders.set(key, value);
      }
    });
    
    // Add DreamFactory-specific headers
    newHeaders.set('X-DreamFactory-Version', '2.0');
    newHeaders.set('X-Request-ID', requestId);
    newHeaders.set('X-Processing-Time', '0'); // Will be updated later
    
    // Add CORS headers for development
    const envConfig = getEnvironmentConfig();
    if (envConfig.isDevelopment) {
      newHeaders.set('Access-Control-Allow-Origin', '*');
      newHeaders.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
      newHeaders.set('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-DreamFactory-Session-Token');
      newHeaders.set('Access-Control-Expose-Headers', 'X-Request-ID, X-Processing-Time, X-Loading-State');
    }
    
    return new NextResponse(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers: newHeaders
    });
    
  } catch (error) {
    console.warn('[Response Headers] Transformation failed:', error);
    return response;
  }
}

/**
 * Adds security headers to outgoing requests
 * 
 * @param request - Request to enhance with security headers
 * @param config - Transformation configuration
 * @returns Promise resolving to request with security headers
 */
async function addSecurityHeaders(
  request: NextRequest,
  config: APITransformConfig
): Promise<NextRequest> {
  try {
    const newHeaders = new Headers(request.headers);
    
    // Add security and audit headers
    newHeaders.set('X-Request-Time', new Date().toISOString());
    newHeaders.set('X-User-Agent', request.headers.get('user-agent') || 'Unknown');
    
    // Add origin validation header
    const origin = request.headers.get('origin');
    if (origin) {
      newHeaders.set('X-Origin-Validated', 'true');
    }
    
    return new NextRequest(request, { headers: newHeaders });
    
  } catch (error) {
    console.warn('[Security Headers] Addition failed:', error);
    return request;
  }
}

/**
 * Adds performance monitoring headers to responses
 * 
 * @param response - Response to enhance with performance headers
 * @param context - Response transformation context
 * @returns Promise resolving to response with performance headers
 */
async function addPerformanceHeaders(
  response: NextResponse,
  context: ResponseTransformationContext
): Promise<NextResponse> {
  try {
    const newHeaders = new Headers(response.headers);
    
    // Update processing time header
    newHeaders.set('X-Processing-Time', context.transformationTime.toFixed(2));
    newHeaders.set('X-Transformation-Success', 'true');
    
    // Add cache information if available
    newHeaders.set('X-Cache-Status', 'MISS'); // Default to MISS, would be updated by cache layer
    
    return new NextResponse(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers: newHeaders
    });
    
  } catch (error) {
    console.warn('[Performance Headers] Addition failed:', error);
    return response;
  }
}

// ============================================================================
// MSW INTEGRATION AND DEVELOPMENT SUPPORT
// ============================================================================

/**
 * Detects current environment and MSW usage
 * Provides development environment adaptation
 * 
 * @param request - Request to analyze for environment detection
 * @param config - Transformation configuration
 * @returns Promise resolving to environment information
 */
async function detectEnvironment(
  request: NextRequest,
  config: APITransformConfig
): Promise<{
  isDevelopment: boolean;
  isProduction: boolean;
  isMSW: boolean;
  isLocalhost: boolean;
}> {
  const envConfig = getEnvironmentConfig();
  const url = request.nextUrl;
  
  // Check for MSW headers
  const hasMSWHeaders = MSW_DETECTION_PATTERNS.headers.some(
    header => request.headers.has(header)
  );
  
  // Check for MSW user agent
  const userAgent = request.headers.get('user-agent') || '';
  const hasMSWUserAgent = MSW_DETECTION_PATTERNS.userAgent.some(
    pattern => userAgent.includes(pattern)
  );
  
  // Check for localhost
  const isLocalhost = MSW_DETECTION_PATTERNS.localhost.some(
    pattern => url.hostname.includes(pattern)
  );
  
  return {
    isDevelopment: envConfig.isDevelopment,
    isProduction: envConfig.isProduction,
    isMSW: hasMSWHeaders || hasMSWUserAgent,
    isLocalhost
  };
}

/**
 * Handles MSW (Mock Service Worker) requests in development
 * Provides seamless integration with testing infrastructure
 * 
 * @param request - MSW request to handle
 * @param config - Transformation configuration
 * @returns Promise resolving to MSW-compatible response
 */
async function handleMSWRequest(
  request: NextRequest,
  config: APITransformConfig
): Promise<NextResponse> {
  try {
    // Add MSW compatibility headers
    const response = NextResponse.next();
    response.headers.set('X-MSW-Intercepted', 'true');
    response.headers.set('X-MSW-Timestamp', Date.now().toString());
    
    // Disable certain transformations for MSW
    if (config.enableDebugLogging) {
      console.log('[MSW] Request intercepted by MSW, skipping transformations:', {
        url: request.url,
        method: request.method
      });
    }
    
    return response;
    
  } catch (error) {
    console.warn('[MSW] MSW request handling failed:', error);
    return NextResponse.next();
  }
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Determines if transformation should be skipped for the request
 * 
 * @param request - Request to evaluate
 * @param config - Transformation configuration
 * @returns Boolean indicating if transformation should be skipped
 */
function shouldSkipTransformation(
  request: NextRequest,
  config: APITransformConfig
): boolean {
  const pathname = request.nextUrl.pathname;
  
  // Skip excluded paths
  return config.excludePaths.some(excludePath => 
    pathname.startsWith(excludePath)
  );
}

/**
 * Determines if request is targeting DreamFactory API
 * 
 * @param request - Request to evaluate
 * @param config - Transformation configuration
 * @returns Boolean indicating if this is a DreamFactory API request
 */
function isDreamFactoryApiRequest(
  request: NextRequest,
  config: APITransformConfig
): boolean {
  const pathname = request.nextUrl.pathname;
  
  return config.dreamfactoryApiPaths.some(apiPath => 
    pathname.startsWith(apiPath)
  );
}

/**
 * Generates unique request identifier for tracking
 * 
 * @returns Unique request ID string
 */
function generateRequestId(): string {
  return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Gets client identifier for rate limiting
 * 
 * @param request - Request to extract identifier from
 * @returns Client identifier string
 */
function getClientIdentifier(request: NextRequest): string {
  // Try to get user ID from session token
  const token = extractTokenFromRequest(request);
  if (token) {
    try {
      const payload = JSON.parse(atob(token.split('.')[1])) as JWTPayload;
      return `user_${payload.sub}`;
    } catch {
      // Fall through to IP-based identification
    }
  }
  
  // Fall back to IP address
  return request.ip || 'unknown';
}

/**
 * Creates rate limit response for exceeded limits
 * 
 * @param rateLimit - Rate limit information
 * @returns NextResponse with rate limit information
 */
function createRateLimitResponse(rateLimit: {
  allowed: boolean;
  remaining: number;
  resetTime: number;
}): NextResponse {
  const response = NextResponse.json(
    { 
      error: 'Rate limit exceeded',
      message: 'Too many requests. Please try again later.',
      resetTime: new Date(rateLimit.resetTime).toISOString()
    },
    { status: 429 }
  );
  
  response.headers.set('X-RateLimit-Remaining', rateLimit.remaining.toString());
  response.headers.set('X-RateLimit-Reset', rateLimit.resetTime.toString());
  response.headers.set('Retry-After', Math.ceil((rateLimit.resetTime - Date.now()) / 1000).toString());
  
  return response;
}

/**
 * Simulates request processing (in real middleware, this would call next())
 * 
 * @param request - Transformed request
 * @param config - Transformation configuration
 * @returns Promise resolving to simulated response
 */
async function processTransformedRequest(
  request: NextRequest,
  config: APITransformConfig
): Promise<NextResponse> {
  // In real middleware, this would be: return NextResponse.next()
  // For demonstration, we'll create a mock response
  return new NextResponse(
    JSON.stringify({ 
      message: 'Request processed successfully',
      timestamp: new Date().toISOString()
    }),
    {
      status: 200,
      headers: {
        'Content-Type': 'application/json'
      }
    }
  );
}

/**
 * Enhances response with metadata and monitoring information
 * 
 * @param response - Response to enhance
 * @param metadata - Metadata to add
 * @returns Enhanced response with metadata
 */
function enhanceResponseWithMetadata(
  response: NextResponse,
  metadata: {
    requestId: string;
    processingTime: number;
    performanceWarnings: PerformanceWarning[];
    auditEvent: AuditEvent | null;
  }
): NextResponse {
  const newHeaders = new Headers(response.headers);
  
  // Add metadata headers
  newHeaders.set('X-Request-ID', metadata.requestId);
  newHeaders.set('X-Processing-Time', metadata.processingTime.toFixed(2));
  newHeaders.set('X-Performance-Warnings', metadata.performanceWarnings.length.toString());
  
  if (metadata.auditEvent) {
    newHeaders.set('X-Audit-Event-ID', metadata.auditEvent.eventId);
  }
  
  return new NextResponse(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers: newHeaders
  });
}

/**
 * Creates middleware error object with comprehensive context
 * 
 * @param message - Error message
 * @param component - Middleware component where error occurred
 * @param stage - Processing stage where error occurred
 * @param request - Request context
 * @param requestId - Request identifier
 * @param originalError - Original error object
 * @returns Comprehensive middleware error
 */
function createMiddlewareError(
  message: string,
  component: MiddlewareComponent,
  stage: MiddlewareStage,
  request: NextRequest,
  requestId: string,
  originalError?: Error
): MiddlewareError {
  return {
    code: 'TRANSFORMATION_ERROR',
    message,
    details: originalError?.message || message,
    timestamp: new Date(),
    recoverable: true,
    middlewareComponent: component,
    processingStage: stage,
    requestId,
    requestPath: request.nextUrl.pathname,
    requestMethod: request.method as any,
    requestHeaders: Object.fromEntries(request.headers.entries()),
    userId: null,
    userEmail: null,
    sessionId: null,
    errorId: `err_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    occurredAt: new Date(),
    stackTrace: originalError?.stack || null,
    innerError: originalError || null,
    processingTimeMs: 0,
    timeoutOccurred: false,
    resourcesExhausted: false,
    recoveryAttempts: 0,
    maxRecoveryAttempts: 3,
    recoveryActions: [],
    auditEvent: {
      eventId: `audit_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      eventType: AuditEventType.SYSTEM_ERROR,
      eventSubtype: 'middleware_error',
      timestamp: new Date(),
      duration: 0,
      userId: null,
      userEmail: null,
      userRole: null,
      sessionId: null,
      requestId,
      requestPath: request.nextUrl.pathname,
      requestMethod: request.method as any,
      requestHeaders: Object.fromEntries(request.headers.entries()),
      requestBody: null,
      responseStatus: 500,
      responseHeaders: {},
      responseBody: null,
      ipAddress: request.ip || 'unknown',
      userAgent: request.headers.get('user-agent') || 'Unknown',
      referrer: request.headers.get('referer'),
      geoLocation: null,
      authenticationMethod: null,
      permissionsChecked: [],
      accessGranted: false,
      denyReason: 'Middleware error occurred',
      processingTime: 0,
      cacheHit: false,
      errorOccurred: true,
      containsSensitiveData: false,
      dataClassification: 'INTERNAL' as any,
      metadata: { component, stage, originalError: originalError?.message },
      tags: ['middleware-error', component.toLowerCase()],
      complianceFlags: [],
      retentionPolicy: 'standard',
      correlationId: requestId,
      parentEventId: null,
      relatedEventIds: []
    },
    sensitiveDataExposed: false,
    complianceImpact: null
  };
}

/**
 * Creates performance warning for threshold violations
 * 
 * @param warningType - Type of performance warning
 * @param message - Warning message
 * @param threshold - Performance threshold
 * @param actualValue - Actual measured value
 * @param severity - Warning severity
 * @param requestId - Request identifier
 * @returns Performance warning object
 */
function createPerformanceWarning(
  warningType: PerformanceWarningType,
  message: string,
  threshold: number,
  actualValue: number,
  severity: PerformanceWarningSeverity,
  requestId: string
): PerformanceWarning {
  return {
    warningType,
    warningMessage: message,
    threshold,
    actualValue,
    severity,
    timestamp: new Date(),
    component: MiddlewareComponent.PERFORMANCE_MONITORING,
    requestId,
    userId: null,
    suggestedActions: ['Optimize transformation logic', 'Consider caching', 'Review request complexity'],
    automaticMitigation: false,
    mitigationApplied: false,
    occurrenceCount: 1,
    firstOccurrence: new Date(),
    lastOccurrence: new Date()
  };
}

// Export the main middleware function and utilities
export {
  apiTransformMiddleware as default,
  transformRequest,
  transformResponse,
  isDreamFactoryApiRequest,
  isDreamFactoryApiResponse,
  generateRequestId
};

export type {
  APITransformConfig,
  RequestTransformationContext,
  ResponseTransformationContext
};