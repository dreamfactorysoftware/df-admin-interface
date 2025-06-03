/**
 * @fileoverview Middleware utility functions for Next.js edge runtime
 * 
 * Provides comprehensive utility functions for middleware operations including:
 * - JWT token validation and parsing with edge runtime compatibility
 * - Request/response header management for DreamFactory API integration
 * - Case transformation utilities maintaining API compatibility
 * - Session management and secure cookie handling
 * - Logging and audit trail functionality
 * - Environment detection and configuration utilities
 * 
 * All functions are optimized for Next.js 15.1+ edge runtime and maintain
 * security best practices for DreamFactory authentication workflows.
 */

import { NextRequest, NextResponse } from 'next/server'

// =============================================================================
// TYPES AND INTERFACES
// =============================================================================

/**
 * JWT token payload structure for DreamFactory sessions
 */
export interface JWTPayload {
  sub: string          // User ID
  iat: number         // Issued at timestamp
  exp: number         // Expiration timestamp
  aud: string         // Audience (DreamFactory instance)
  iss: string         // Issuer
  jti: string         // JWT ID
  session_id: string  // DreamFactory session identifier
  role?: string       // User role
  email?: string      // User email
  name?: string       // User display name
}

/**
 * Session data structure maintained in middleware
 */
export interface SessionData {
  token: string
  payload: JWTPayload
  expiresAt: number
  refreshToken?: string
  lastActivity: number
}

/**
 * Audit log entry structure for security tracking
 */
export interface AuditLogEntry {
  timestamp: number
  event: string
  userId?: string
  sessionId?: string
  ip: string
  userAgent: string
  path: string
  method: string
  success: boolean
  error?: string
  metadata?: Record<string, unknown>
}

/**
 * Environment configuration type
 */
export interface EnvironmentConfig {
  isDevelopment: boolean
  isProduction: boolean
  isTest: boolean
  dreamfactoryUrl: string
  jwtSecret: string
  sessionCookieName: string
  sessionTimeout: number
  auditLoggingEnabled: boolean
}

// =============================================================================
// JWT TOKEN UTILITIES
// =============================================================================

/**
 * Validates JWT token structure and signature compatibility
 * Optimized for edge runtime with minimal dependencies
 * 
 * @param token - JWT token string to validate
 * @returns Promise resolving to validation result
 */
export async function validateJWTStructure(token: string): Promise<{
  valid: boolean
  payload?: JWTPayload
  error?: string
}> {
  try {
    if (!token || typeof token !== 'string') {
      return { valid: false, error: 'Invalid token format' }
    }

    const parts = token.split('.')
    if (parts.length !== 3) {
      return { valid: false, error: 'Invalid JWT structure' }
    }

    // Decode payload (validation of signature would require crypto in production)
    const payloadBase64 = parts[1]
    const paddedPayload = payloadBase64 + '='.repeat((4 - payloadBase64.length % 4) % 4)
    
    let payload: JWTPayload
    try {
      const decoded = atob(paddedPayload)
      payload = JSON.parse(decoded)
    } catch {
      return { valid: false, error: 'Invalid payload encoding' }
    }

    // Validate required claims
    if (!payload.sub || !payload.iat || !payload.exp || !payload.session_id) {
      return { valid: false, error: 'Missing required claims' }
    }

    // Check expiration
    const now = Math.floor(Date.now() / 1000)
    if (payload.exp <= now) {
      return { valid: false, error: 'Token expired' }
    }

    return { valid: true, payload }
  } catch (error) {
    return { 
      valid: false, 
      error: error instanceof Error ? error.message : 'Token validation failed' 
    }
  }
}

/**
 * Extracts JWT token from Authorization header or cookies
 * Supports multiple token sources for flexible authentication
 * 
 * @param request - Next.js request object
 * @returns Extracted token string or null
 */
export function extractTokenFromRequest(request: NextRequest): string | null {
  // Try Authorization header first (Bearer token)
  const authHeader = request.headers.get('Authorization')
  if (authHeader?.startsWith('Bearer ')) {
    return authHeader.slice(7)
  }

  // Try X-DreamFactory-Session-Token header (DreamFactory specific)
  const sessionHeader = request.headers.get('X-DreamFactory-Session-Token')
  if (sessionHeader) {
    return sessionHeader
  }

  // Try session cookie as fallback
  const sessionCookieName = getEnvironmentConfig().sessionCookieName
  const cookieToken = request.cookies.get(sessionCookieName)?.value
  if (cookieToken) {
    return cookieToken
  }

  return null
}

/**
 * Checks if token needs refresh based on expiration time
 * Implements configurable refresh threshold for optimal UX
 * 
 * @param payload - JWT payload to check
 * @param refreshThresholdSeconds - Seconds before expiration to trigger refresh
 * @returns Boolean indicating if refresh is needed
 */
export function shouldRefreshToken(
  payload: JWTPayload, 
  refreshThresholdSeconds: number = 300 // 5 minutes default
): boolean {
  const now = Math.floor(Date.now() / 1000)
  const refreshTime = payload.exp - refreshThresholdSeconds
  return now >= refreshTime
}

// =============================================================================
// HEADER MANAGEMENT UTILITIES
// =============================================================================

/**
 * Sanitizes and normalizes request headers for DreamFactory API compatibility
 * Removes sensitive headers and ensures proper formatting
 * 
 * @param headers - Headers object to sanitize
 * @returns Sanitized headers object
 */
export function sanitizeRequestHeaders(headers: Headers): Record<string, string> {
  const sanitized: Record<string, string> = {}
  const sensitiveHeaders = ['authorization', 'cookie', 'x-dreamfactory-session-token']
  
  headers.forEach((value, key) => {
    const normalizedKey = key.toLowerCase()
    
    // Skip sensitive headers that should be handled separately
    if (sensitiveHeaders.includes(normalizedKey)) {
      return
    }
    
    // Normalize content-type for consistency
    if (normalizedKey === 'content-type') {
      sanitized['Content-Type'] = value.trim()
      return
    }
    
    // Pass through other headers with proper casing
    sanitized[toPascalCase(key)] = value.trim()
  })
  
  return sanitized
}

/**
 * Adds authentication headers to outgoing requests
 * Handles both JWT and API key authentication patterns
 * 
 * @param headers - Existing headers object
 * @param token - JWT session token
 * @param apiKey - Optional API key for service authentication
 * @returns Updated headers object
 */
export function addAuthenticationHeaders(
  headers: Headers,
  token?: string,
  apiKey?: string
): Headers {
  const newHeaders = new Headers(headers)
  
  if (token) {
    newHeaders.set('X-DreamFactory-Session-Token', token)
    newHeaders.set('Authorization', `Bearer ${token}`)
  }
  
  if (apiKey) {
    newHeaders.set('X-DreamFactory-API-Key', apiKey)
  }
  
  // Ensure proper content type for API requests
  if (!newHeaders.has('Content-Type')) {
    newHeaders.set('Content-Type', 'application/json')
  }
  
  return newHeaders
}

/**
 * Creates response headers for successful authentication
 * Includes security headers and session management
 * 
 * @param sessionToken - New session token to set
 * @param maxAge - Cookie max age in seconds
 * @returns Headers object for response
 */
export function createAuthenticationResponseHeaders(
  sessionToken?: string,
  maxAge: number = 3600 // 1 hour default
): Headers {
  const headers = new Headers()
  
  // Security headers
  headers.set('X-Content-Type-Options', 'nosniff')
  headers.set('X-Frame-Options', 'DENY')
  headers.set('X-XSS-Protection', '1; mode=block')
  headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')
  
  // Session headers
  if (sessionToken) {
    const config = getEnvironmentConfig()
    const secure = config.isProduction
    const sameSite = config.isProduction ? 'strict' : 'lax'
    
    headers.set(
      'Set-Cookie',
      `${config.sessionCookieName}=${sessionToken}; HttpOnly; Secure=${secure}; SameSite=${sameSite}; Max-Age=${maxAge}; Path=/`
    )
  }
  
  return headers
}

// =============================================================================
// CASE TRANSFORMATION UTILITIES
// =============================================================================

/**
 * Converts string to PascalCase for consistent header formatting
 * Maintains compatibility with HTTP header conventions
 * 
 * @param str - String to convert
 * @returns PascalCase string
 */
export function toPascalCase(str: string): string {
  return str
    .split(/[-_\s]/)
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join('-')
}

/**
 * Converts object keys to camelCase for JavaScript compatibility
 * Preserves data integrity while ensuring consistent naming
 * 
 * @param obj - Object to transform
 * @returns Object with camelCase keys
 */
export function transformKeysToCamelCase<T>(obj: Record<string, unknown>): T {
  if (obj === null || typeof obj !== 'object' || Array.isArray(obj)) {
    return obj as T
  }
  
  const transformed: Record<string, unknown> = {}
  
  for (const [key, value] of Object.entries(obj)) {
    const camelKey = key.replace(/[-_](.)/g, (_, char) => char.toUpperCase())
    
    if (value && typeof value === 'object' && !Array.isArray(value)) {
      transformed[camelKey] = transformKeysToCamelCase(value as Record<string, unknown>)
    } else if (Array.isArray(value)) {
      transformed[camelKey] = value.map(item => 
        typeof item === 'object' && item !== null 
          ? transformKeysToCamelCase(item as Record<string, unknown>)
          : item
      )
    } else {
      transformed[camelKey] = value
    }
  }
  
  return transformed as T
}

/**
 * Converts object keys to snake_case for API compatibility
 * Ensures proper formatting for DreamFactory API requests
 * 
 * @param obj - Object to transform
 * @returns Object with snake_case keys
 */
export function transformKeysToSnakeCase<T>(obj: Record<string, unknown>): T {
  if (obj === null || typeof obj !== 'object' || Array.isArray(obj)) {
    return obj as T
  }
  
  const transformed: Record<string, unknown> = {}
  
  for (const [key, value] of Object.entries(obj)) {
    const snakeKey = key.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`)
    
    if (value && typeof value === 'object' && !Array.isArray(value)) {
      transformed[snakeKey] = transformKeysToSnakeCase(value as Record<string, unknown>)
    } else if (Array.isArray(value)) {
      transformed[snakeKey] = value.map(item => 
        typeof item === 'object' && item !== null 
          ? transformKeysToSnakeCase(item as Record<string, unknown>)
          : item
      )
    } else {
      transformed[snakeKey] = value
    }
  }
  
  return transformed as T
}

// =============================================================================
// SESSION MANAGEMENT UTILITIES
// =============================================================================

/**
 * Creates secure session data object with proper validation
 * Implements stateless session management patterns
 * 
 * @param token - JWT token string
 * @param payload - Decoded JWT payload
 * @returns Session data object
 */
export function createSessionData(token: string, payload: JWTPayload): SessionData {
  return {
    token,
    payload,
    expiresAt: payload.exp * 1000, // Convert to milliseconds
    lastActivity: Date.now()
  }
}

/**
 * Validates session data integrity and expiration
 * Ensures session security and proper lifecycle management
 * 
 * @param sessionData - Session data to validate
 * @returns Validation result with details
 */
export function validateSessionData(sessionData: SessionData): {
  valid: boolean
  expired: boolean
  needsRefresh: boolean
  error?: string
} {
  try {
    if (!sessionData || !sessionData.token || !sessionData.payload) {
      return { valid: false, expired: false, needsRefresh: false, error: 'Invalid session data' }
    }

    const now = Date.now()
    const expired = sessionData.expiresAt <= now
    const needsRefresh = shouldRefreshToken(sessionData.payload)
    
    // Check for session timeout (inactive for too long)
    const config = getEnvironmentConfig()
    const sessionTimeout = config.sessionTimeout * 1000 // Convert to milliseconds
    const inactiveTime = now - sessionData.lastActivity
    
    if (inactiveTime > sessionTimeout) {
      return { valid: false, expired: true, needsRefresh: false, error: 'Session timeout' }
    }

    return {
      valid: !expired,
      expired,
      needsRefresh,
      error: expired ? 'Session expired' : undefined
    }
  } catch (error) {
    return { 
      valid: false, 
      expired: false, 
      needsRefresh: false, 
      error: error instanceof Error ? error.message : 'Session validation failed' 
    }
  }
}

/**
 * Updates session activity timestamp for timeout management
 * Maintains session lifecycle in stateless environment
 * 
 * @param sessionData - Session data to update
 * @returns Updated session data
 */
export function updateSessionActivity(sessionData: SessionData): SessionData {
  return {
    ...sessionData,
    lastActivity: Date.now()
  }
}

// =============================================================================
// COOKIE HANDLING UTILITIES
// =============================================================================

/**
 * Creates secure cookie options for session management
 * Implements security best practices for authentication cookies
 * 
 * @param maxAge - Cookie lifetime in seconds
 * @returns Cookie options object
 */
export function createSecureCookieOptions(maxAge: number = 3600): {
  httpOnly: boolean
  secure: boolean
  sameSite: 'strict' | 'lax' | 'none'
  maxAge: number
  path: string
} {
  const config = getEnvironmentConfig()
  
  return {
    httpOnly: true,
    secure: config.isProduction,
    sameSite: config.isProduction ? 'strict' : 'lax',
    maxAge,
    path: '/'
  }
}

/**
 * Clears authentication cookies for logout
 * Ensures complete session cleanup
 * 
 * @param response - Next.js response object
 * @returns Updated response with cleared cookies
 */
export function clearAuthenticationCookies(response: NextResponse): NextResponse {
  const config = getEnvironmentConfig()
  const expiredCookie = `${config.sessionCookieName}=; HttpOnly; Secure=${config.isProduction}; SameSite=${config.isProduction ? 'strict' : 'lax'}; Max-Age=0; Path=/`
  
  response.headers.set('Set-Cookie', expiredCookie)
  return response
}

// =============================================================================
// LOGGING AND AUDIT UTILITIES
// =============================================================================

/**
 * Creates structured audit log entry for security events
 * Implements comprehensive audit trail for compliance
 * 
 * @param request - Next.js request object
 * @param event - Event type description
 * @param success - Whether the event was successful
 * @param additionalData - Optional additional context
 * @returns Audit log entry
 */
export function createAuditLogEntry(
  request: NextRequest,
  event: string,
  success: boolean,
  additionalData?: {
    userId?: string
    sessionId?: string
    error?: string
    metadata?: Record<string, unknown>
  }
): AuditLogEntry {
  const ip = getClientIP(request)
  const userAgent = request.headers.get('user-agent') || 'Unknown'
  
  return {
    timestamp: Date.now(),
    event,
    userId: additionalData?.userId,
    sessionId: additionalData?.sessionId,
    ip,
    userAgent,
    path: request.nextUrl.pathname,
    method: request.method,
    success,
    error: additionalData?.error,
    metadata: additionalData?.metadata
  }
}

/**
 * Logs audit entry with appropriate formatting
 * Provides structured logging for monitoring systems
 * 
 * @param auditEntry - Audit log entry to log
 */
export function logAuditEntry(auditEntry: AuditLogEntry): void {
  const config = getEnvironmentConfig()
  
  if (!config.auditLoggingEnabled) {
    return
  }
  
  // In development, use console logging
  if (config.isDevelopment) {
    console.log('[AUDIT]', JSON.stringify(auditEntry, null, 2))
    return
  }
  
  // In production, this would integrate with your logging service
  // For now, using structured console logging that can be captured by log aggregators
  console.log(JSON.stringify({
    level: auditEntry.success ? 'info' : 'warn',
    category: 'security_audit',
    ...auditEntry
  }))
}

/**
 * Extracts client IP address from request
 * Handles various proxy configurations and headers
 * 
 * @param request - Next.js request object
 * @returns Client IP address
 */
function getClientIP(request: NextRequest): string {
  // Check various headers for real IP (common proxy configurations)
  const xForwardedFor = request.headers.get('x-forwarded-for')
  if (xForwardedFor) {
    return xForwardedFor.split(',')[0].trim()
  }
  
  const xRealIP = request.headers.get('x-real-ip')
  if (xRealIP) {
    return xRealIP
  }
  
  const cfConnectingIP = request.headers.get('cf-connecting-ip')
  if (cfConnectingIP) {
    return cfConnectingIP
  }
  
  // Fallback to connection IP
  return request.ip || 'unknown'
}

// =============================================================================
// ENVIRONMENT AND CONFIGURATION UTILITIES
// =============================================================================

/**
 * Detects runtime environment and returns configuration
 * Provides centralized environment detection for middleware
 * 
 * @returns Environment configuration object
 */
export function getEnvironmentConfig(): EnvironmentConfig {
  const nodeEnv = process.env.NODE_ENV
  const isDevelopment = nodeEnv === 'development'
  const isProduction = nodeEnv === 'production'
  const isTest = nodeEnv === 'test'
  
  return {
    isDevelopment,
    isProduction,
    isTest,
    dreamfactoryUrl: process.env.DREAMFACTORY_URL || 'http://localhost:8080',
    jwtSecret: process.env.JWT_SECRET || 'dev-secret-key',
    sessionCookieName: process.env.SESSION_COOKIE_NAME || 'df-session',
    sessionTimeout: parseInt(process.env.SESSION_TIMEOUT || '3600', 10), // 1 hour default
    auditLoggingEnabled: process.env.AUDIT_LOGGING === 'true' || isDevelopment
  }
}

/**
 * Checks if current environment supports edge runtime features
 * Ensures compatibility with Next.js middleware constraints
 * 
 * @returns Boolean indicating edge runtime support
 */
export function isEdgeRuntimeSupported(): boolean {
  // Edge runtime detection based on available APIs
  return typeof EdgeRuntime !== 'undefined' || 
         (typeof globalThis !== 'undefined' && 'EdgeRuntime' in globalThis)
}

/**
 * Gets environment-specific API endpoints
 * Provides dynamic endpoint configuration based on environment
 * 
 * @returns API endpoint configuration
 */
export function getAPIEndpoints(): {
  auth: string
  session: string
  user: string
  system: string
} {
  const config = getEnvironmentConfig()
  const baseUrl = config.dreamfactoryUrl
  
  return {
    auth: `${baseUrl}/api/v2/user/session`,
    session: `${baseUrl}/api/v2/user/session`,
    user: `${baseUrl}/api/v2/user`,
    system: `${baseUrl}/system/api/v2`
  }
}

// =============================================================================
// REQUEST PROCESSING UTILITIES
// =============================================================================

/**
 * Creates standardized error response for middleware
 * Provides consistent error handling across authentication flows
 * 
 * @param error - Error message
 * @param status - HTTP status code
 * @param auditData - Optional audit information
 * @returns NextResponse with error details
 */
export function createErrorResponse(
  error: string,
  status: number = 401,
  auditData?: { event: string; userId?: string; sessionId?: string }
): NextResponse {
  const response = NextResponse.json(
    { 
      error, 
      timestamp: new Date().toISOString(),
      status 
    },
    { status }
  )
  
  // Add security headers
  response.headers.set('X-Content-Type-Options', 'nosniff')
  response.headers.set('X-Frame-Options', 'DENY')
  
  return response
}

/**
 * Creates redirect response for authentication
 * Handles login redirects with proper URL preservation
 * 
 * @param request - Original request
 * @param loginUrl - Login page URL
 * @returns NextResponse redirect
 */
export function createAuthRedirectResponse(
  request: NextRequest,
  loginUrl: string = '/login'
): NextResponse {
  const url = request.nextUrl.clone()
  url.pathname = loginUrl
  
  // Preserve the original URL for post-login redirect
  const returnUrl = encodeURIComponent(request.nextUrl.pathname + request.nextUrl.search)
  url.searchParams.set('returnUrl', returnUrl)
  
  const response = NextResponse.redirect(url)
  
  // Clear any existing session cookies
  return clearAuthenticationCookies(response)
}

/**
 * Validates request origin for CSRF protection
 * Implements origin-based security validation
 * 
 * @param request - Next.js request object
 * @returns Boolean indicating if origin is valid
 */
export function validateRequestOrigin(request: NextRequest): boolean {
  const origin = request.headers.get('origin')
  const referer = request.headers.get('referer')
  const host = request.headers.get('host')
  
  // Allow same-origin requests
  if (origin && host) {
    const originHost = new URL(origin).host
    return originHost === host
  }
  
  // Check referer as fallback
  if (referer && host) {
    const refererHost = new URL(referer).host
    return refererHost === host
  }
  
  // Allow requests without origin/referer in development
  const config = getEnvironmentConfig()
  return config.isDevelopment
}

/**
 * Rate limiting utility for middleware
 * Simple in-memory rate limiting for development
 * 
 * @param identifier - Unique identifier (IP, user ID, etc.)
 * @param maxRequests - Maximum requests allowed
 * @param windowMs - Time window in milliseconds
 * @returns Boolean indicating if request is allowed
 */
const rateLimitStore = new Map<string, { count: number; resetTime: number }>()

export function checkRateLimit(
  identifier: string,
  maxRequests: number = 100,
  windowMs: number = 60000 // 1 minute
): { allowed: boolean; remaining: number; resetTime: number } {
  const now = Date.now()
  const key = identifier
  
  // Clean up expired entries
  if (rateLimitStore.size > 1000) {
    for (const [k, v] of rateLimitStore.entries()) {
      if (v.resetTime <= now) {
        rateLimitStore.delete(k)
      }
    }
  }
  
  const entry = rateLimitStore.get(key)
  
  if (!entry || entry.resetTime <= now) {
    // First request or window expired
    const resetTime = now + windowMs
    rateLimitStore.set(key, { count: 1, resetTime })
    return { allowed: true, remaining: maxRequests - 1, resetTime }
  }
  
  if (entry.count >= maxRequests) {
    // Rate limit exceeded
    return { allowed: false, remaining: 0, resetTime: entry.resetTime }
  }
  
  // Increment count
  entry.count++
  rateLimitStore.set(key, entry)
  
  return { 
    allowed: true, 
    remaining: maxRequests - entry.count, 
    resetTime: entry.resetTime 
  }
}