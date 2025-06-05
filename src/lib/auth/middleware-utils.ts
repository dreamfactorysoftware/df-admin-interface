/**
 * Next.js Middleware Authentication Utilities
 * 
 * Provides comprehensive edge-based authentication processing for Next.js middleware
 * including token validation, automatic refresh, route protection, and security monitoring.
 * Implements server-side authentication flow with JWT validation, session management,
 * and role-based access control for optimal security and performance.
 */

import { NextRequest, NextResponse } from 'next/server';
import { 
  AUTH_HEADERS, 
  TOKEN_KEYS, 
  SESSION_CONFIG, 
  PROTECTED_ROUTES, 
  RBAC_PERMISSIONS,
  AUTH_ENDPOINTS,
  MIDDLEWARE_CONFIG,
  AUDIT_EVENTS,
  LOG_LEVELS,
  getAuthConfig,
  AuthState,
  AUTH_STATES,
  JWT_CONFIG,
  COOKIE_CONFIG,
  VALIDATION_PATTERNS
} from './constants';

// =============================================================================
// TYPE DEFINITIONS FOR MIDDLEWARE
// =============================================================================

/**
 * JWT payload structure for DreamFactory session tokens
 */
export interface JWTPayload {
  sub: string; // user ID
  email: string;
  roles: string[];
  permissions: string[];
  sid: string; // session ID
  iat: number; // issued at
  exp: number; // expires at
  nbf?: number; // not before
  iss?: string; // issuer
  aud?: string; // audience
}

/**
 * User session data extracted from JWT
 */
export interface UserSession {
  id: number;
  email: string;
  firstName: string;
  lastName: string;
  name: string;
  sessionId: string;
  sessionToken: string;
  tokenExpiryDate: Date;
  isRootAdmin: boolean;
  isSysAdmin: boolean;
  roleId: number;
  roles: string[];
  permissions: string[];
  host: string;
  lastLoginDate: string;
}

/**
 * Middleware authentication context
 */
export interface AuthContext {
  isAuthenticated: boolean;
  user: UserSession | null;
  token: string | null;
  refreshToken: string | null;
  expiresAt: number | null;
  permissions: string[];
  state: AuthState;
}

/**
 * Route protection configuration
 */
export interface RouteProtection {
  path: string;
  requiredPermissions?: string[];
  adminOnly?: boolean;
  allowAnonymous?: boolean;
  redirectTo?: string;
}

/**
 * Middleware authentication result
 */
export interface AuthResult {
  success: boolean;
  context: AuthContext | null;
  response: NextResponse | null;
  error: string | null;
  shouldRefresh: boolean;
  auditEvent?: string;
}

/**
 * Token validation result
 */
export interface TokenValidationResult {
  isValid: boolean;
  payload: JWTPayload | null;
  error: string | null;
  expiresAt: number | null;
  shouldRefresh: boolean;
}

/**
 * Refresh token result
 */
export interface RefreshResult {
  success: boolean;
  newToken: string | null;
  expiresAt: number | null;
  error: string | null;
}

// =============================================================================
// CORE AUTHENTICATION UTILITIES
// =============================================================================

/**
 * Extract authentication token from request headers or cookies
 */
export function extractToken(request: NextRequest): string | null {
  // Try Authorization header first (Bearer token)
  const authHeader = request.headers.get(MIDDLEWARE_CONFIG.HEADERS.AUTHORIZATION);
  if (authHeader?.startsWith('Bearer ')) {
    return authHeader.substring(7);
  }

  // Try X-DreamFactory-Session-Token header
  const sessionHeader = request.headers.get(MIDDLEWARE_CONFIG.HEADERS.SESSION_TOKEN);
  if (sessionHeader) {
    return sessionHeader;
  }

  // Try session cookie
  const sessionCookie = request.cookies.get(COOKIE_CONFIG.NAMES.SESSION_TOKEN);
  if (sessionCookie?.value) {
    return sessionCookie.value;
  }

  return null;
}

/**
 * Validate JWT token format and basic structure
 */
export function validateTokenFormat(token: string): boolean {
  if (!token || typeof token !== 'string') {
    return false;
  }

  // Check JWT pattern
  if (!VALIDATION_PATTERNS.JWT_TOKEN.test(token)) {
    return false;
  }

  // Ensure token has three parts (header.payload.signature)
  const parts = token.split('.');
  return parts.length === 3 && parts.every(part => part.length > 0);
}

/**
 * Parse JWT payload without verification (for expiration checking)
 */
export function parseJWTPayload(token: string): JWTPayload | null {
  try {
    if (!validateTokenFormat(token)) {
      return null;
    }

    const parts = token.split('.');
    const payload = JSON.parse(atob(parts[1]));

    // Validate required fields
    if (!payload.sub || !payload.exp || !payload.iat) {
      return null;
    }

    return {
      sub: payload.sub,
      email: payload.email || '',
      roles: Array.isArray(payload.roles) ? payload.roles : [],
      permissions: Array.isArray(payload.permissions) ? payload.permissions : [],
      sid: payload.sid || '',
      iat: payload.iat,
      exp: payload.exp,
      nbf: payload.nbf,
      iss: payload.iss,
      aud: payload.aud,
    };
  } catch (error) {
    console.error('Error parsing JWT payload:', error);
    return null;
  }
}

/**
 * Check if token is expired or will expire soon
 */
export function isTokenExpired(payload: JWTPayload, refreshThreshold?: number): {
  isExpired: boolean;
  shouldRefresh: boolean;
  expiresAt: number;
} {
  const now = Math.floor(Date.now() / 1000);
  const expiresAt = payload.exp;
  const threshold = refreshThreshold || SESSION_CONFIG.REFRESH.THRESHOLD / 1000;

  return {
    isExpired: now >= expiresAt,
    shouldRefresh: now >= (expiresAt - threshold),
    expiresAt: expiresAt,
  };
}

/**
 * Validate JWT token signature and expiration
 */
export async function validateToken(token: string): Promise<TokenValidationResult> {
  try {
    if (!validateTokenFormat(token)) {
      return {
        isValid: false,
        payload: null,
        error: 'Invalid token format',
        expiresAt: null,
        shouldRefresh: false,
      };
    }

    const payload = parseJWTPayload(token);
    if (!payload) {
      return {
        isValid: false,
        payload: null,
        error: 'Invalid token payload',
        expiresAt: null,
        shouldRefresh: false,
      };
    }

    const { isExpired, shouldRefresh, expiresAt } = isTokenExpired(payload);

    if (isExpired) {
      return {
        isValid: false,
        payload: payload,
        error: 'Token expired',
        expiresAt: expiresAt,
        shouldRefresh: true,
      };
    }

    // Check not before time if present
    if (payload.nbf && Math.floor(Date.now() / 1000) < payload.nbf) {
      return {
        isValid: false,
        payload: payload,
        error: 'Token not yet valid',
        expiresAt: expiresAt,
        shouldRefresh: false,
      };
    }

    return {
      isValid: true,
      payload: payload,
      error: null,
      expiresAt: expiresAt,
      shouldRefresh: shouldRefresh,
    };
  } catch (error) {
    return {
      isValid: false,
      payload: null,
      error: `Token validation failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      expiresAt: null,
      shouldRefresh: false,
    };
  }
}

/**
 * Attempt to refresh authentication token
 */
export async function refreshAuthToken(
  currentToken: string,
  refreshToken?: string
): Promise<RefreshResult> {
  try {
    const authConfig = getAuthConfig();
    
    // Prepare refresh request
    const refreshUrl = `${process.env.NEXT_PUBLIC_API_BASE_URL || ''}${AUTH_ENDPOINTS.REFRESH}`;
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    // Add current session token if available
    if (currentToken) {
      headers[AUTH_HEADERS.SESSION_TOKEN] = currentToken;
    }

    const requestBody: any = {};
    
    // Include refresh token if available
    if (refreshToken) {
      requestBody.refresh_token = refreshToken;
    }

    const response = await fetch(refreshUrl, {
      method: 'POST',
      headers,
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      return {
        success: false,
        newToken: null,
        expiresAt: null,
        error: `Refresh failed: ${response.status} ${response.statusText}`,
      };
    }

    const data = await response.json();
    
    if (!data.session_token) {
      return {
        success: false,
        newToken: null,
        expiresAt: null,
        error: 'No session token in refresh response',
      };
    }

    // Validate the new token
    const validation = await validateToken(data.session_token);
    if (!validation.isValid) {
      return {
        success: false,
        newToken: null,
        expiresAt: null,
        error: 'Refreshed token is invalid',
      };
    }

    return {
      success: true,
      newToken: data.session_token,
      expiresAt: validation.expiresAt,
      error: null,
    };
  } catch (error) {
    return {
      success: false,
      newToken: null,
      expiresAt: null,
      error: `Refresh error: ${error instanceof Error ? error.message : 'Unknown error'}`,
    };
  }
}

// =============================================================================
// ROUTE PROTECTION UTILITIES
// =============================================================================

/**
 * Check if a route is public (doesn't require authentication)
 */
export function isPublicRoute(pathname: string): boolean {
  return PROTECTED_ROUTES.PUBLIC.some(route => {
    if (route.endsWith('*')) {
      return pathname.startsWith(route.slice(0, -1));
    }
    return pathname === route || pathname.startsWith(`${route}/`);
  });
}

/**
 * Check if a route requires admin access
 */
export function isAdminRoute(pathname: string): boolean {
  return PROTECTED_ROUTES.ADMIN_ONLY.some(route => {
    if (route.endsWith('*')) {
      return pathname.startsWith(route.slice(0, -1));
    }
    return pathname === route || pathname.startsWith(`${route}/`);
  });
}

/**
 * Check if user has required permissions for a route
 */
export function hasRequiredPermissions(
  userPermissions: string[],
  requiredPermissions: string[]
): boolean {
  if (!requiredPermissions || requiredPermissions.length === 0) {
    return true;
  }

  // Check if user has any of the required permissions
  return requiredPermissions.some(permission => 
    userPermissions.includes(permission) ||
    userPermissions.includes(RBAC_PERMISSIONS.SUPER_ADMIN)
  );
}

/**
 * Validate route access for authenticated user
 */
export function validateRouteAccess(
  pathname: string,
  session: UserSession
): { allowed: boolean; reason?: string } {
  // Check admin-only routes
  if (isAdminRoute(pathname)) {
    if (!session.isSysAdmin && !session.isRootAdmin) {
      return {
        allowed: false,
        reason: 'Admin access required',
      };
    }
  }

  // Additional route-specific permission checks can be added here
  // For now, authenticated users can access non-admin routes
  return { allowed: true };
}

// =============================================================================
// MIDDLEWARE CONTEXT UTILITIES
// =============================================================================

/**
 * Create authentication context from JWT payload
 */
export function createAuthContext(payload: JWTPayload, token: string): AuthContext {
  const session: UserSession = {
    id: parseInt(payload.sub),
    email: payload.email,
    firstName: '', // Will be populated from user data if needed
    lastName: '',
    name: payload.email, // Fallback to email
    sessionId: payload.sid,
    sessionToken: token,
    tokenExpiryDate: new Date(payload.exp * 1000),
    isRootAdmin: payload.permissions.includes(RBAC_PERMISSIONS.SUPER_ADMIN),
    isSysAdmin: payload.permissions.includes(RBAC_PERMISSIONS.SYSTEM_ADMIN),
    roleId: 0, // Will be populated from roles if needed
    roles: payload.roles,
    permissions: payload.permissions,
    host: '', // Will be populated from request if needed
    lastLoginDate: new Date(payload.iat * 1000).toISOString(),
  };

  return {
    isAuthenticated: true,
    user: session,
    token: token,
    refreshToken: null, // Will be set if available
    expiresAt: payload.exp,
    permissions: payload.permissions,
    state: AUTH_STATES.AUTHENTICATED,
  };
}

/**
 * Create unauthenticated context
 */
export function createUnauthenticatedContext(): AuthContext {
  return {
    isAuthenticated: false,
    user: null,
    token: null,
    refreshToken: null,
    expiresAt: null,
    permissions: [],
    state: AUTH_STATES.UNAUTHENTICATED,
  };
}

// =============================================================================
// REQUEST PROCESSING UTILITIES
// =============================================================================

/**
 * Add authentication headers to outgoing requests
 */
export function addAuthHeaders(
  request: NextRequest,
  token: string,
  apiKey?: string
): NextRequest {
  const headers = new Headers(request.headers);
  
  // Add session token header
  headers.set(AUTH_HEADERS.SESSION_TOKEN, token);
  
  // Add authorization header
  headers.set(AUTH_HEADERS.AUTHORIZATION, `Bearer ${token}`);
  
  // Add API key if provided
  if (apiKey) {
    headers.set(AUTH_HEADERS.API_KEY, apiKey);
  }

  // Create new request with updated headers
  return new NextRequest(request, { headers });
}

/**
 * Create response with updated authentication cookies
 */
export function setAuthCookies(
  response: NextResponse,
  token: string,
  refreshToken?: string
): NextResponse {
  const cookieOptions = {
    httpOnly: COOKIE_CONFIG.OPTIONS.HTTP_ONLY,
    secure: COOKIE_CONFIG.OPTIONS.SECURE,
    sameSite: COOKIE_CONFIG.OPTIONS.SAME_SITE,
    path: COOKIE_CONFIG.OPTIONS.PATH,
    maxAge: COOKIE_CONFIG.OPTIONS.MAX_AGE,
    domain: COOKIE_CONFIG.DOMAIN,
  };

  // Set session token cookie
  response.cookies.set(COOKIE_CONFIG.NAMES.SESSION_TOKEN, token, cookieOptions);

  // Set refresh token cookie if provided
  if (refreshToken) {
    response.cookies.set(COOKIE_CONFIG.NAMES.REFRESH_TOKEN, refreshToken, cookieOptions);
  }

  return response;
}

/**
 * Clear authentication cookies
 */
export function clearAuthCookies(response: NextResponse): NextResponse {
  const expiredCookieOptions = {
    httpOnly: true,
    secure: COOKIE_CONFIG.OPTIONS.SECURE,
    sameSite: COOKIE_CONFIG.OPTIONS.SAME_SITE,
    path: COOKIE_CONFIG.OPTIONS.PATH,
    expires: new Date(0),
    domain: COOKIE_CONFIG.DOMAIN,
  };

  response.cookies.set(COOKIE_CONFIG.NAMES.SESSION_TOKEN, '', expiredCookieOptions);
  response.cookies.set(COOKIE_CONFIG.NAMES.REFRESH_TOKEN, '', expiredCookieOptions);

  return response;
}

// =============================================================================
// AUTHENTICATION FLOW COORDINATION
// =============================================================================

/**
 * Handle authentication redirect to login page
 */
export function createLoginRedirect(
  request: NextRequest,
  reason?: string
): NextResponse {
  const loginUrl = new URL('/login', request.url);
  
  // Add return URL if not already on login page
  if (request.nextUrl.pathname !== '/login') {
    loginUrl.searchParams.set('returnUrl', request.nextUrl.pathname + request.nextUrl.search);
  }
  
  // Add error reason if provided
  if (reason) {
    loginUrl.searchParams.set('error', reason);
  }

  const response = NextResponse.redirect(loginUrl);
  
  // Clear any existing auth cookies
  clearAuthCookies(response);
  
  // Set security headers
  response.headers.set('Cache-Control', MIDDLEWARE_CONFIG.RESPONSE_HEADERS.CACHE_CONTROL);
  response.headers.set('Expires', MIDDLEWARE_CONFIG.RESPONSE_HEADERS.EXPIRES);
  response.headers.set('Pragma', MIDDLEWARE_CONFIG.RESPONSE_HEADERS.PRAGMA);

  return response;
}

/**
 * Handle access denied response
 */
export function createAccessDeniedResponse(
  request: NextRequest,
  reason?: string
): NextResponse {
  const response = new NextResponse(
    JSON.stringify({ 
      error: 'Access Denied', 
      message: reason || 'Insufficient permissions',
      code: 403
    }),
    { 
      status: 403,
      headers: { 'Content-Type': 'application/json' }
    }
  );

  // Set security headers
  response.headers.set('Cache-Control', MIDDLEWARE_CONFIG.RESPONSE_HEADERS.CACHE_CONTROL);
  
  return response;
}

/**
 * Process authentication for middleware
 */
export async function processAuthentication(request: NextRequest): Promise<AuthResult> {
  try {
    const pathname = request.nextUrl.pathname;

    // Check if route is public
    if (isPublicRoute(pathname)) {
      return {
        success: true,
        context: createUnauthenticatedContext(),
        response: null,
        error: null,
        shouldRefresh: false,
        auditEvent: undefined,
      };
    }

    // Extract authentication token
    const token = extractToken(request);
    if (!token) {
      return {
        success: false,
        context: null,
        response: createLoginRedirect(request, 'authentication_required'),
        error: 'No authentication token found',
        shouldRefresh: false,
        auditEvent: AUDIT_EVENTS.USER_LOGIN_FAILURE,
      };
    }

    // Validate token
    const validation = await validateToken(token);
    if (!validation.isValid) {
      // Attempt token refresh if expired
      if (validation.shouldRefresh && validation.payload) {
        const refreshToken = request.cookies.get(COOKIE_CONFIG.NAMES.REFRESH_TOKEN)?.value;
        const refreshResult = await refreshAuthToken(token, refreshToken);
        
        if (refreshResult.success && refreshResult.newToken) {
          // Token refreshed successfully, create context with new token
          const newPayload = parseJWTPayload(refreshResult.newToken);
          if (newPayload) {
            const context = createAuthContext(newPayload, refreshResult.newToken);
            
            // Create response with updated cookies
            const response = NextResponse.next();
            setAuthCookies(response, refreshResult.newToken, refreshToken);
            
            return {
              success: true,
              context: context,
              response: response,
              error: null,
              shouldRefresh: true,
              auditEvent: AUDIT_EVENTS.TOKEN_REFRESH_SUCCESS,
            };
          }
        }
      }

      return {
        success: false,
        context: null,
        response: createLoginRedirect(request, 'session_expired'),
        error: validation.error || 'Token validation failed',
        shouldRefresh: false,
        auditEvent: AUDIT_EVENTS.TOKEN_REFRESH_FAILURE,
      };
    }

    // Create authentication context
    const context = createAuthContext(validation.payload!, token);

    // Validate route access
    const accessCheck = validateRouteAccess(pathname, context.user!);
    if (!accessCheck.allowed) {
      return {
        success: false,
        context: context,
        response: createAccessDeniedResponse(request, accessCheck.reason),
        error: accessCheck.reason || 'Access denied',
        shouldRefresh: false,
        auditEvent: AUDIT_EVENTS.PERMISSION_DENIED,
      };
    }

    // Check if token should be refreshed
    if (validation.shouldRefresh) {
      const refreshToken = request.cookies.get(COOKIE_CONFIG.NAMES.REFRESH_TOKEN)?.value;
      const refreshResult = await refreshAuthToken(token, refreshToken);
      
      if (refreshResult.success && refreshResult.newToken) {
        const response = NextResponse.next();
        setAuthCookies(response, refreshResult.newToken, refreshToken);
        
        return {
          success: true,
          context: context,
          response: response,
          error: null,
          shouldRefresh: true,
          auditEvent: AUDIT_EVENTS.TOKEN_REFRESH_SUCCESS,
        };
      }
    }

    return {
      success: true,
      context: context,
      response: null,
      error: null,
      shouldRefresh: false,
      auditEvent: undefined,
    };
  } catch (error) {
    return {
      success: false,
      context: null,
      response: createLoginRedirect(request, 'authentication_error'),
      error: `Authentication processing failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      shouldRefresh: false,
      auditEvent: AUDIT_EVENTS.USER_LOGIN_FAILURE,
    };
  }
}

// =============================================================================
// SECURITY MONITORING AND AUDIT LOGGING
// =============================================================================

/**
 * Authentication event data for audit logging
 */
export interface AuthAuditEvent {
  event: string;
  userId?: string;
  email?: string;
  ip?: string;
  userAgent?: string;
  path: string;
  success: boolean;
  error?: string;
  timestamp: string;
  sessionId?: string;
}

/**
 * Log authentication event for security monitoring
 */
export function logAuthEvent(
  request: NextRequest,
  event: string,
  context?: AuthContext,
  error?: string
): void {
  try {
    const auditEvent: AuthAuditEvent = {
      event,
      userId: context?.user?.id.toString(),
      email: context?.user?.email,
      ip: request.headers.get(MIDDLEWARE_CONFIG.HEADERS.X_FORWARDED_FOR) || 
          request.headers.get(MIDDLEWARE_CONFIG.HEADERS.X_REAL_IP) || 
          request.ip,
      userAgent: request.headers.get(MIDDLEWARE_CONFIG.HEADERS.USER_AGENT) || undefined,
      path: request.nextUrl.pathname,
      success: !error,
      error,
      timestamp: new Date().toISOString(),
      sessionId: context?.user?.sessionId,
    };

    // In a production environment, this would integrate with your logging system
    // For now, we'll use console logging with structured format
    const logLevel = error ? LOG_LEVELS.ERROR : LOG_LEVELS.INFO;
    const logMessage = `[${logLevel.toUpperCase()}] Auth Event: ${JSON.stringify(auditEvent)}`;
    
    if (error) {
      console.error(logMessage);
    } else {
      console.log(logMessage);
    }

    // TODO: Integrate with external monitoring/SIEM systems
    // - Send to centralized logging service
    // - Trigger security alerts for suspicious activity
    // - Store in audit database for compliance
  } catch (logError) {
    console.error('Failed to log auth event:', logError);
  }
}

/**
 * Monitor for suspicious authentication activity
 */
export function detectSuspiciousActivity(
  request: NextRequest,
  authResult: AuthResult
): boolean {
  // This is a basic implementation - in production, you would implement
  // more sophisticated anomaly detection based on:
  // - Multiple failed login attempts
  // - Unusual IP addresses or locations
  // - Rapid successive requests
  // - Invalid token patterns
  // - Time-based access patterns

  const indicators = [];

  // Check for multiple rapid failed attempts (basic rate limiting check)
  if (!authResult.success && authResult.error?.includes('Token validation failed')) {
    indicators.push('token_validation_failure');
  }

  // Check for unusual user agents or missing user agents
  const userAgent = request.headers.get(MIDDLEWARE_CONFIG.HEADERS.USER_AGENT);
  if (!userAgent || userAgent.length < 10) {
    indicators.push('suspicious_user_agent');
  }

  // Check for direct API access without proper headers
  if (request.nextUrl.pathname.startsWith('/api/') && !authResult.success) {
    indicators.push('unauthorized_api_access');
  }

  // Log suspicious activity if detected
  if (indicators.length > 0) {
    logAuthEvent(
      request, 
      AUDIT_EVENTS.SUSPICIOUS_ACTIVITY, 
      authResult.context || undefined,
      `Suspicious indicators: ${indicators.join(', ')}`
    );
    return true;
  }

  return false;
}

// =============================================================================
// MAIN MIDDLEWARE HANDLER
// =============================================================================

/**
 * Main middleware authentication handler
 * 
 * This function should be called from your Next.js middleware.ts file
 * to handle all authentication processing for incoming requests.
 */
export async function handleMiddlewareAuth(request: NextRequest): Promise<NextResponse> {
  try {
    // Process authentication
    const authResult = await processAuthentication(request);

    // Log authentication event if specified
    if (authResult.auditEvent) {
      logAuthEvent(
        request, 
        authResult.auditEvent, 
        authResult.context || undefined,
        authResult.error || undefined
      );
    }

    // Detect and log suspicious activity
    detectSuspiciousActivity(request, authResult);

    // Return response based on authentication result
    if (authResult.response) {
      return authResult.response;
    }

    // Continue with request processing
    const response = NextResponse.next();

    // Add authentication headers if user is authenticated
    if (authResult.context?.isAuthenticated && authResult.context.token) {
      response.headers.set(AUTH_HEADERS.SESSION_TOKEN, authResult.context.token);
      response.headers.set(AUTH_HEADERS.AUTHORIZATION, `Bearer ${authResult.context.token}`);
    }

    return response;
  } catch (error) {
    // Log critical middleware error
    console.error('Critical middleware error:', error);
    
    logAuthEvent(
      request,
      AUDIT_EVENTS.USER_LOGIN_FAILURE,
      undefined,
      `Middleware error: ${error instanceof Error ? error.message : 'Unknown error'}`
    );

    // Return login redirect on critical errors
    return createLoginRedirect(request, 'system_error');
  }
}

// =============================================================================
// UTILITY EXPORTS
// =============================================================================

/**
 * Helper function to check if middleware should process a request
 */
export function shouldProcessRequest(request: NextRequest): boolean {
  const pathname = request.nextUrl.pathname;

  // Skip processing for static files and Next.js internals
  if (
    pathname.startsWith('/_next/') ||
    pathname.startsWith('/favicon.ico') ||
    pathname.startsWith('/public/') ||
    pathname.startsWith('/api/health') ||
    pathname.startsWith('/api/status')
  ) {
    return false;
  }

  return true;
}

/**
 * Create middleware configuration for Next.js
 */
export const middlewareConfig = {
  matcher: MIDDLEWARE_CONFIG.MATCHER,
};

// Export all utilities for use in middleware and components
export {
  AUTH_HEADERS,
  COOKIE_CONFIG,
  SESSION_CONFIG,
  PROTECTED_ROUTES,
  RBAC_PERMISSIONS,
  type JWTPayload,
  type UserSession,
  type AuthContext,
  type AuthResult,
  type TokenValidationResult,
  type RefreshResult,
  type RouteProtection,
  type AuthAuditEvent,
};