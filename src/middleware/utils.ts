/**
 * Middleware Utilities
 * 
 * Provides essential utility functions for Next.js edge middleware operations including
 * JWT token validation, header management, case transformation, session handling,
 * and logging capabilities. All utilities are designed for edge runtime compatibility.
 * 
 * @fileoverview Comprehensive middleware utilities supporting authentication, security,
 * and request/response transformation for the DreamFactory Admin Interface
 */

import { NextRequest, NextResponse } from 'next/server';

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

/**
 * JWT payload structure for DreamFactory session tokens
 */
export interface JWTPayload {
  sub: string;           // User ID
  iat: number;          // Issued at timestamp
  exp: number;          // Expiration timestamp
  sessionId: string;    // Session identifier
  email?: string;       // User email
  roles?: string[];     // User roles
  permissions?: string[]; // User permissions
}

/**
 * Parsed session information
 */
export interface SessionInfo {
  userId: string;
  sessionId: string;
  email?: string;
  roles: string[];
  permissions: string[];
  isValid: boolean;
  expiresAt: Date;
  needsRefresh: boolean;
}

/**
 * Header management configuration
 */
export interface HeaderConfig {
  removeHeaders?: string[];
  addHeaders?: Record<string, string>;
  corsHeaders?: boolean;
  securityHeaders?: boolean;
}

/**
 * Audit log entry structure
 */
export interface AuditLogEntry {
  timestamp: string;
  action: string;
  userId?: string;
  sessionId?: string;
  ip: string;
  userAgent: string;
  path: string;
  method: string;
  statusCode?: number;
  error?: string;
  details?: Record<string, any>;
}

/**
 * Environment detection result
 */
export interface EnvironmentInfo {
  isProduction: boolean;
  isDevelopment: boolean;
  isTest: boolean;
  apiUrl: string;
  enableMSW: boolean;
  logLevel: 'error' | 'warn' | 'info' | 'debug';
}

// ============================================================================
// JWT TOKEN UTILITIES
// ============================================================================

/**
 * Validates JWT token structure without signature verification
 * For edge runtime compatibility, only performs basic validation
 */
export function validateJWTStructure(token: string): boolean {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return false;
    
    // Validate base64url encoding
    parts.forEach(part => {
      if (!part || !/^[A-Za-z0-9_-]+$/.test(part)) {
        throw new Error('Invalid base64url encoding');
      }
    });
    
    return true;
  } catch {
    return false;
  }
}

/**
 * Parses JWT payload without signature verification
 * @param token JWT token string
 * @returns Parsed payload or null if invalid
 */
export function parseJWTPayload(token: string): JWTPayload | null {
  try {
    if (!validateJWTStructure(token)) return null;
    
    const parts = token.split('.');
    const payload = parts[1];
    
    // Decode base64url
    const decoded = atob(payload.replace(/-/g, '+').replace(/_/g, '/'));
    const parsed = JSON.parse(decoded) as JWTPayload;
    
    // Validate required fields
    if (!parsed.sub || !parsed.iat || !parsed.exp || !parsed.sessionId) {
      return null;
    }
    
    return parsed;
  } catch {
    return null;
  }
}

/**
 * Checks if JWT token is expired
 */
export function isTokenExpired(payload: JWTPayload): boolean {
  const now = Math.floor(Date.now() / 1000);
  return payload.exp <= now;
}

/**
 * Checks if JWT token needs refresh (expires within 5 minutes)
 */
export function tokenNeedsRefresh(payload: JWTPayload): boolean {
  const now = Math.floor(Date.now() / 1000);
  const fiveMinutes = 5 * 60;
  return (payload.exp - now) <= fiveMinutes;
}

/**
 * Extracts JWT token from request headers or cookies
 */
export function extractToken(request: NextRequest): string | null {
  // Check Authorization header
  const authHeader = request.headers.get('authorization');
  if (authHeader?.startsWith('Bearer ')) {
    return authHeader.substring(7);
  }
  
  // Check X-DreamFactory-Session-Token header
  const sessionHeader = request.headers.get('x-dreamfactory-session-token');
  if (sessionHeader) {
    return sessionHeader;
  }
  
  // Check session cookie
  const sessionCookie = request.cookies.get('df-session-token');
  if (sessionCookie?.value) {
    return sessionCookie.value;
  }
  
  return null;
}

/**
 * Validates token and returns session information
 */
export function validateSessionToken(request: NextRequest): SessionInfo | null {
  const token = extractToken(request);
  if (!token) return null;
  
  const payload = parseJWTPayload(token);
  if (!payload) return null;
  
  const isExpired = isTokenExpired(payload);
  const needsRefresh = tokenNeedsRefresh(payload);
  
  return {
    userId: payload.sub,
    sessionId: payload.sessionId,
    email: payload.email,
    roles: payload.roles || [],
    permissions: payload.permissions || [],
    isValid: !isExpired,
    expiresAt: new Date(payload.exp * 1000),
    needsRefresh: needsRefresh && !isExpired
  };
}

// ============================================================================
// HEADER MANAGEMENT UTILITIES
// ============================================================================

/**
 * Security headers for all responses
 */
export const SECURITY_HEADERS = {
  'X-Frame-Options': 'DENY',
  'X-Content-Type-Options': 'nosniff',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'X-XSS-Protection': '1; mode=block',
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
} as const;

/**
 * CORS headers for API requests
 */
export const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, PATCH, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-DreamFactory-Session-Token, X-DreamFactory-API-Key',
  'Access-Control-Expose-Headers': 'X-DreamFactory-Session-Token',
  'Access-Control-Max-Age': '86400', // 24 hours
} as const;

/**
 * Applies headers to response based on configuration
 */
export function applyHeaders(
  response: NextResponse,
  config: HeaderConfig = {}
): NextResponse {
  const { removeHeaders = [], addHeaders = {}, corsHeaders = false, securityHeaders = true } = config;
  
  // Remove specified headers
  removeHeaders.forEach(header => {
    response.headers.delete(header);
  });
  
  // Add security headers
  if (securityHeaders) {
    Object.entries(SECURITY_HEADERS).forEach(([key, value]) => {
      response.headers.set(key, value);
    });
  }
  
  // Add CORS headers
  if (corsHeaders) {
    Object.entries(CORS_HEADERS).forEach(([key, value]) => {
      response.headers.set(key, value);
    });
  }
  
  // Add custom headers
  Object.entries(addHeaders).forEach(([key, value]) => {
    response.headers.set(key, value);
  });
  
  return response;
}

/**
 * Creates standardized API response headers
 */
export function createAPIHeaders(sessionToken?: string): Record<string, string> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'Cache-Control': 'no-cache, no-store, must-revalidate',
    'Pragma': 'no-cache',
    'Expires': '0',
  };
  
  if (sessionToken) {
    headers['X-DreamFactory-Session-Token'] = sessionToken;
  }
  
  return headers;
}

/**
 * Extracts DreamFactory-specific headers from request
 */
export function extractDFHeaders(request: NextRequest): Record<string, string> {
  const dfHeaders: Record<string, string> = {};
  
  // Extract DreamFactory session token
  const sessionToken = extractToken(request);
  if (sessionToken) {
    dfHeaders['X-DreamFactory-Session-Token'] = sessionToken;
  }
  
  // Extract API key
  const apiKey = request.headers.get('x-dreamfactory-api-key');
  if (apiKey) {
    dfHeaders['X-DreamFactory-API-Key'] = apiKey;
  }
  
  // Extract application name
  const appName = request.headers.get('x-dreamfactory-application-name');
  if (appName) {
    dfHeaders['X-DreamFactory-Application-Name'] = appName;
  }
  
  return dfHeaders;
}

// ============================================================================
// CASE TRANSFORMATION UTILITIES
// ============================================================================

/**
 * Converts camelCase to snake_case
 */
export function camelToSnake(str: string): string {
  return str.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
}

/**
 * Converts snake_case to camelCase
 */
export function snakeToCamel(str: string): string {
  return str.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
}

/**
 * Recursively transforms object keys from camelCase to snake_case
 */
export function transformKeysToSnakeCase(obj: any): any {
  if (obj === null || typeof obj !== 'object') {
    return obj;
  }
  
  if (Array.isArray(obj)) {
    return obj.map(transformKeysToSnakeCase);
  }
  
  const transformed: any = {};
  for (const [key, value] of Object.entries(obj)) {
    const snakeKey = camelToSnake(key);
    transformed[snakeKey] = transformKeysToSnakeCase(value);
  }
  
  return transformed;
}

/**
 * Recursively transforms object keys from snake_case to camelCase
 */
export function transformKeysToCamelCase(obj: any): any {
  if (obj === null || typeof obj !== 'object') {
    return obj;
  }
  
  if (Array.isArray(obj)) {
    return obj.map(transformKeysToCamelCase);
  }
  
  const transformed: any = {};
  for (const [key, value] of Object.entries(obj)) {
    const camelKey = snakeToCamel(key);
    transformed[camelKey] = transformKeysToCamelCase(value);
  }
  
  return transformed;
}

/**
 * Transforms request body for API compatibility
 */
export function transformRequestBody(body: any, toSnakeCase: boolean = true): any {
  if (!body) return body;
  
  try {
    const parsedBody = typeof body === 'string' ? JSON.parse(body) : body;
    return toSnakeCase 
      ? transformKeysToSnakeCase(parsedBody)
      : transformKeysToCamelCase(parsedBody);
  } catch {
    return body; // Return original if parsing fails
  }
}

// ============================================================================
// SESSION MANAGEMENT UTILITIES
// ============================================================================

/**
 * Cookie configuration for session management
 */
export const SESSION_COOKIE_CONFIG = {
  name: 'df-session-token',
  maxAge: 24 * 60 * 60, // 24 hours in seconds
  httpOnly: true,
  secure: true,
  sameSite: 'strict' as const,
  path: '/',
};

/**
 * Sets session cookie in response
 */
export function setSessionCookie(response: NextResponse, token: string): void {
  response.cookies.set({
    name: SESSION_COOKIE_CONFIG.name,
    value: token,
    maxAge: SESSION_COOKIE_CONFIG.maxAge,
    httpOnly: SESSION_COOKIE_CONFIG.httpOnly,
    secure: SESSION_COOKIE_CONFIG.secure,
    sameSite: SESSION_COOKIE_CONFIG.sameSite,
    path: SESSION_COOKIE_CONFIG.path,
  });
}

/**
 * Clears session cookie from response
 */
export function clearSessionCookie(response: NextResponse): void {
  response.cookies.set({
    name: SESSION_COOKIE_CONFIG.name,
    value: '',
    maxAge: 0,
    httpOnly: SESSION_COOKIE_CONFIG.httpOnly,
    secure: SESSION_COOKIE_CONFIG.secure,
    sameSite: SESSION_COOKIE_CONFIG.sameSite,
    path: SESSION_COOKIE_CONFIG.path,
  });
}

/**
 * Creates session-aware redirect response
 */
export function createAuthRedirect(
  request: NextRequest,
  loginPath: string = '/login'
): NextResponse {
  const url = request.nextUrl.clone();
  url.pathname = loginPath;
  
  // Preserve return URL for post-login redirect
  if (request.nextUrl.pathname !== loginPath) {
    url.searchParams.set('returnUrl', request.nextUrl.pathname + request.nextUrl.search);
  }
  
  const response = NextResponse.redirect(url);
  clearSessionCookie(response);
  
  return response;
}

/**
 * Validates session and returns appropriate response
 */
export function validateSessionMiddleware(request: NextRequest): {
  isValid: boolean;
  sessionInfo: SessionInfo | null;
  response?: NextResponse;
} {
  const sessionInfo = validateSessionToken(request);
  
  if (!sessionInfo) {
    return {
      isValid: false,
      sessionInfo: null,
      response: createAuthRedirect(request)
    };
  }
  
  if (!sessionInfo.isValid) {
    return {
      isValid: false,
      sessionInfo,
      response: createAuthRedirect(request)
    };
  }
  
  return {
    isValid: true,
    sessionInfo
  };
}

// ============================================================================
// LOGGING AND AUDIT UTILITIES
// ============================================================================

/**
 * Creates audit log entry from request
 */
export function createAuditLogEntry(
  request: NextRequest,
  action: string,
  sessionInfo?: SessionInfo | null,
  statusCode?: number,
  error?: string,
  details?: Record<string, any>
): AuditLogEntry {
  const forwarded = request.headers.get('x-forwarded-for');
  const ip = forwarded ? forwarded.split(',')[0].trim() : 
            request.headers.get('x-real-ip') || 'unknown';
  
  return {
    timestamp: new Date().toISOString(),
    action,
    userId: sessionInfo?.userId,
    sessionId: sessionInfo?.sessionId,
    ip,
    userAgent: request.headers.get('user-agent') || 'unknown',
    path: request.nextUrl.pathname,
    method: request.method,
    statusCode,
    error,
    details
  };
}

/**
 * Logs audit entry (edge-compatible logging)
 */
export function logAuditEntry(entry: AuditLogEntry): void {
  // In edge runtime, use console.log with structured format
  // In production, this would integrate with external logging service
  const logLevel = getEnvironmentInfo().logLevel;
  
  if (logLevel === 'debug' || (logLevel === 'info' && !entry.error) || 
      (logLevel === 'warn' && entry.statusCode && entry.statusCode >= 400) ||
      (logLevel === 'error' && entry.error)) {
    
    console.log(JSON.stringify({
      ...entry,
      level: entry.error ? 'error' : entry.statusCode && entry.statusCode >= 400 ? 'warn' : 'info',
      service: 'middleware'
    }));
  }
}

/**
 * Logs authentication events
 */
export function logAuthEvent(
  request: NextRequest,
  event: 'login' | 'logout' | 'token_refresh' | 'auth_failure' | 'access_denied',
  sessionInfo?: SessionInfo | null,
  error?: string
): void {
  const entry = createAuditLogEntry(
    request,
    `auth_${event}`,
    sessionInfo,
    event === 'auth_failure' || event === 'access_denied' ? 401 : 200,
    error,
    { event }
  );
  
  logAuditEntry(entry);
}

/**
 * Logs API access events
 */
export function logAPIAccess(
  request: NextRequest,
  sessionInfo: SessionInfo | null,
  statusCode: number,
  responseTime?: number
): void {
  const entry = createAuditLogEntry(
    request,
    'api_access',
    sessionInfo,
    statusCode,
    undefined,
    { responseTime }
  );
  
  logAuditEntry(entry);
}

// ============================================================================
// ENVIRONMENT DETECTION UTILITIES
// ============================================================================

/**
 * Detects current environment and returns configuration
 */
export function getEnvironmentInfo(): EnvironmentInfo {
  // Edge runtime compatible environment detection
  const nodeEnv = process.env.NODE_ENV || 'development';
  const isDevelopment = nodeEnv === 'development';
  const isProduction = nodeEnv === 'production';
  const isTest = nodeEnv === 'test';
  
  return {
    isProduction,
    isDevelopment,
    isTest,
    apiUrl: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:80',
    enableMSW: isDevelopment || isTest,
    logLevel: (process.env.LOG_LEVEL as any) || (isDevelopment ? 'debug' : 'warn')
  };
}

/**
 * Checks if MSW (Mock Service Worker) should be enabled
 */
export function shouldEnableMSW(): boolean {
  const env = getEnvironmentInfo();
  return env.enableMSW && typeof window !== 'undefined';
}

/**
 * Gets API base URL for the current environment
 */
export function getAPIBaseURL(): string {
  return getEnvironmentInfo().apiUrl;
}

/**
 * Checks if running in development mode
 */
export function isDevelopmentMode(): boolean {
  return getEnvironmentInfo().isDevelopment;
}

/**
 * Checks if running in production mode
 */
export function isProductionMode(): boolean {
  return getEnvironmentInfo().isProduction;
}

// ============================================================================
// REQUEST PROCESSING UTILITIES
// ============================================================================

/**
 * Extracts client IP address from request
 */
export function getClientIP(request: NextRequest): string {
  const forwarded = request.headers.get('x-forwarded-for');
  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }
  
  return request.headers.get('x-real-ip') || 
         request.headers.get('x-client-ip') || 
         'unknown';
}

/**
 * Checks if request is for API endpoint
 */
export function isAPIRequest(request: NextRequest): boolean {
  return request.nextUrl.pathname.startsWith('/api/');
}

/**
 * Checks if request is for static assets
 */
export function isStaticAsset(request: NextRequest): boolean {
  const { pathname } = request.nextUrl;
  return pathname.startsWith('/_next/') ||
         pathname.startsWith('/static/') ||
         pathname.includes('.') && 
         /\.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot|pdf)$/.test(pathname);
}

/**
 * Checks if request requires authentication
 */
export function requiresAuthentication(request: NextRequest): boolean {
  const { pathname } = request.nextUrl;
  
  // Public routes that don't require authentication
  const publicRoutes = [
    '/login',
    '/logout',
    '/saml-callback',
    '/forgot-password',
    '/password-reset',
    '/api/auth/',
    '/api/health'
  ];
  
  return !publicRoutes.some(route => pathname.startsWith(route)) &&
         !isStaticAsset(request);
}

/**
 * Creates standardized error response
 */
export function createErrorResponse(
  message: string,
  statusCode: number = 500,
  details?: Record<string, any>
): NextResponse {
  const response = NextResponse.json(
    {
      error: {
        message,
        code: statusCode,
        timestamp: new Date().toISOString(),
        ...details
      }
    },
    { status: statusCode }
  );
  
  return applyHeaders(response, { securityHeaders: true });
}

/**
 * Creates successful JSON response
 */
export function createSuccessResponse<T = any>(
  data: T,
  statusCode: number = 200,
  headers?: Record<string, string>
): NextResponse {
  const response = NextResponse.json(data, { status: statusCode });
  
  return applyHeaders(response, { 
    securityHeaders: true,
    addHeaders: headers 
  });
}

// ============================================================================
// PERFORMANCE UTILITIES
// ============================================================================

/**
 * Creates performance timing marker
 */
export function createPerformanceMarker(): {
  end: () => number;
} {
  const start = Date.now();
  
  return {
    end: () => Date.now() - start
  };
}

/**
 * Rate limiting utility for edge runtime
 */
export class EdgeRateLimiter {
  private static instances = new Map<string, { count: number; resetTime: number }>();
  
  static check(
    key: string, 
    limit: number, 
    windowMs: number = 60000
  ): { allowed: boolean; remaining: number; resetTime: number } {
    const now = Date.now();
    const instance = this.instances.get(key);
    
    if (!instance || now > instance.resetTime) {
      const resetTime = now + windowMs;
      this.instances.set(key, { count: 1, resetTime });
      return { allowed: true, remaining: limit - 1, resetTime };
    }
    
    if (instance.count >= limit) {
      return { allowed: false, remaining: 0, resetTime: instance.resetTime };
    }
    
    instance.count++;
    return { 
      allowed: true, 
      remaining: limit - instance.count, 
      resetTime: instance.resetTime 
    };
  }
  
  static cleanup(): void {
    const now = Date.now();
    for (const [key, instance] of this.instances.entries()) {
      if (now > instance.resetTime) {
        this.instances.delete(key);
      }
    }
  }
}

// ============================================================================
// EXPORT ALL UTILITIES
// ============================================================================

export default {
  // JWT utilities
  validateJWTStructure,
  parseJWTPayload,
  isTokenExpired,
  tokenNeedsRefresh,
  extractToken,
  validateSessionToken,
  
  // Header utilities
  SECURITY_HEADERS,
  CORS_HEADERS,
  applyHeaders,
  createAPIHeaders,
  extractDFHeaders,
  
  // Case transformation
  camelToSnake,
  snakeToCamel,
  transformKeysToSnakeCase,
  transformKeysToCamelCase,
  transformRequestBody,
  
  // Session management
  SESSION_COOKIE_CONFIG,
  setSessionCookie,
  clearSessionCookie,
  createAuthRedirect,
  validateSessionMiddleware,
  
  // Logging and audit
  createAuditLogEntry,
  logAuditEntry,
  logAuthEvent,
  logAPIAccess,
  
  // Environment detection
  getEnvironmentInfo,
  shouldEnableMSW,
  getAPIBaseURL,
  isDevelopmentMode,
  isProductionMode,
  
  // Request processing
  getClientIP,
  isAPIRequest,
  isStaticAsset,
  requiresAuthentication,
  createErrorResponse,
  createSuccessResponse,
  
  // Performance
  createPerformanceMarker,
  EdgeRateLimiter
};