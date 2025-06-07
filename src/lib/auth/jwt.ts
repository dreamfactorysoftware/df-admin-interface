/**
 * JWT Token Handling Utilities
 * 
 * Comprehensive JWT token management for DreamFactory Admin Interface with
 * Next.js 15.1 middleware integration, automatic refresh capabilities, and
 * enterprise-grade security validation. Provides secure token lifecycle
 * management including creation, validation, refresh, and revocation.
 * 
 * Key features:
 * - JWT token validation with signature verification
 * - Token parsing and payload extraction with proper error handling
 * - Automatic token refresh with exponential backoff and retry strategies
 * - Token expiration detection with configurable refresh timing
 * - Integration with Next.js middleware for server-side processing
 * - Secure token storage patterns compatible with SSR
 * - Comprehensive token integrity and authentication state management
 * 
 * Performance targets:
 * - Token validation under 10ms
 * - Refresh operations under 500ms
 * - Middleware processing under 100ms
 */

import { jwtVerify, SignJWT, JWTPayload as JoseJWTPayload } from 'jose';
import { 
  JWTPayload, 
  UserSession, 
  AuthError, 
  AuthErrorCode,
  MiddlewareAuthContext,
  MiddlewareAuthResult 
} from '@/types/auth';
import {
  TOKEN_CONFIG,
  SESSION_CONFIG,
  REFRESH_CONFIG,
  AUTH_ERROR_CODES,
  VALIDATION_MESSAGES,
  COOKIE_CONFIG,
  ENV_CONFIG
} from './constants';

// =============================================================================
// JWT CONFIGURATION AND CONSTANTS
// =============================================================================

/**
 * JWT secret key for token signing and verification
 * Uses Next.js runtime environment variable with fallback for development
 */
const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || 'dreamfactory-admin-dev-secret-key-32-chars'
);

/**
 * JWT algorithm configuration for secure token operations
 * Uses HS256 for symmetric key signing with HMAC SHA-256
 */
const JWT_ALGORITHM = 'HS256';

/**
 * Token refresh configuration with intelligent timing
 * Optimizes refresh timing to prevent token expiration while minimizing requests
 */
const REFRESH_TIMING = {
  /** Buffer time before expiration to trigger refresh (5 minutes) */
  BUFFER_TIME: REFRESH_CONFIG.REFRESH_BUFFER_TIME,
  /** Maximum retry attempts for failed refresh operations */
  MAX_RETRIES: REFRESH_CONFIG.MAX_REFRESH_RETRIES,
  /** Base retry delay in milliseconds */
  RETRY_DELAY: REFRESH_CONFIG.RETRY_DELAY,
  /** Exponential backoff multiplier */
  BACKOFF_MULTIPLIER: REFRESH_CONFIG.BACKOFF_MULTIPLIER,
  /** Maximum backoff delay to prevent excessive waiting */
  MAX_BACKOFF_DELAY: REFRESH_CONFIG.MAX_BACKOFF_DELAY,
} as const;

// =============================================================================
// JWT TOKEN VALIDATION UTILITIES
// =============================================================================

/**
 * Validates JWT token signature and structure with comprehensive security checks
 * 
 * Performs complete token validation including signature verification, expiration
 * checking, and payload structure validation. Integrates with Next.js middleware
 * for optimal performance in edge environments.
 * 
 * @param token - JWT token string to validate
 * @returns Promise resolving to validation result with payload or error details
 * 
 * @example
 * ```typescript
 * const result = await validateToken(sessionToken);
 * if (result.isValid) {
 *   const { user, permissions } = result.payload;
 *   // Use validated token data
 * } else {
 *   handleAuthError(result.error);
 * }
 * ```
 */
export async function validateToken(token: string): Promise<{
  isValid: boolean;
  payload?: JWTPayload;
  error?: AuthError;
  expiresAt?: Date;
}> {
  try {
    // Input validation
    if (!token || typeof token !== 'string') {
      return {
        isValid: false,
        error: createAuthError(
          AUTH_ERROR_CODES.TOKEN_INVALID,
          'Token is required and must be a string',
          { context: 'validateToken' }
        )
      };
    }

    // Remove Bearer prefix if present
    const cleanToken = token.replace(/^Bearer\s+/i, '').trim();
    
    if (!cleanToken) {
      return {
        isValid: false,
        error: createAuthError(
          AUTH_ERROR_CODES.TOKEN_INVALID,
          'Token cannot be empty after cleaning',
          { context: 'validateToken' }
        )
      };
    }

    // Verify JWT signature and extract payload
    const { payload: josePayload } = await jwtVerify(cleanToken, JWT_SECRET, {
      algorithms: [JWT_ALGORITHM],
      issuer: TOKEN_CONFIG.JWT_ISSUER,
      audience: TOKEN_CONFIG.JWT_AUDIENCE,
    });

    // Validate payload structure and convert to application format
    const validatedPayload = await validatePayloadStructure(josePayload);
    
    // Additional expiration validation with buffer time
    const now = Math.floor(Date.now() / 1000);
    const expiration = validatedPayload.exp;
    
    if (expiration <= now) {
      return {
        isValid: false,
        error: createAuthError(
          AUTH_ERROR_CODES.TOKEN_EXPIRED,
          'Token has expired',
          { 
            context: 'validateToken',
            expiredAt: new Date(expiration * 1000).toISOString(),
            currentTime: new Date(now * 1000).toISOString()
          }
        )
      };
    }

    return {
      isValid: true,
      payload: validatedPayload,
      expiresAt: new Date(expiration * 1000)
    };

  } catch (error) {
    // Handle specific JWT verification errors
    if (error instanceof Error) {
      if (error.message.includes('expired')) {
        return {
          isValid: false,
          error: createAuthError(
            AUTH_ERROR_CODES.TOKEN_EXPIRED,
            'JWT token has expired',
            { context: 'validateToken', originalError: error.message }
          )
        };
      }
      
      if (error.message.includes('signature')) {
        return {
          isValid: false,
          error: createAuthError(
            AUTH_ERROR_CODES.TOKEN_INVALID,
            'JWT signature verification failed',
            { context: 'validateToken', originalError: error.message }
          )
        };
      }
    }

    return {
      isValid: false,
      error: createAuthError(
        AUTH_ERROR_CODES.TOKEN_INVALID,
        'JWT validation failed',
        { 
          context: 'validateToken',
          originalError: error instanceof Error ? error.message : 'Unknown error'
        }
      )
    };
  }
}

/**
 * Validates JWT payload structure and converts to application format
 * 
 * Ensures the JWT payload contains all required fields with proper types
 * and converts Jose JWT payload to application-specific JWTPayload interface.
 * 
 * @param payload - Raw JWT payload from jose library
 * @returns Validated and typed JWT payload
 * @throws Error if payload structure is invalid
 */
async function validatePayloadStructure(payload: JoseJWTPayload): Promise<JWTPayload> {
  // Validate required JWT claims
  if (typeof payload.sub !== 'string') {
    throw new Error('JWT payload missing or invalid subject (sub) claim');
  }
  
  if (typeof payload.iat !== 'number') {
    throw new Error('JWT payload missing or invalid issued at (iat) claim');
  }
  
  if (typeof payload.exp !== 'number') {
    throw new Error('JWT payload missing or invalid expiration (exp) claim');
  }

  // Validate user data structure
  if (!payload.user || typeof payload.user !== 'object') {
    throw new Error('JWT payload missing or invalid user data');
  }

  const userData = payload.user as any;
  
  // Validate required user fields
  const requiredUserFields = ['id', 'email', 'firstName', 'lastName', 'roleId'];
  for (const field of requiredUserFields) {
    if (userData[field] === undefined || userData[field] === null) {
      throw new Error(`JWT payload user data missing required field: ${field}`);
    }
  }

  // Validate user ID is a number
  if (typeof userData.id !== 'number' || !Number.isInteger(userData.id)) {
    throw new Error('JWT payload user ID must be a valid integer');
  }

  // Validate email format
  if (typeof userData.email !== 'string' || !userData.email.includes('@')) {
    throw new Error('JWT payload user email must be a valid email string');
  }

  // Validate role ID is a number
  if (typeof userData.roleId !== 'number' || !Number.isInteger(userData.roleId)) {
    throw new Error('JWT payload user roleId must be a valid integer');
  }

  // Validate session ID
  if (typeof payload.sessionId !== 'string' || !payload.sessionId.trim()) {
    throw new Error('JWT payload missing or invalid sessionId');
  }

  // Convert to application JWTPayload format
  const validatedPayload: JWTPayload = {
    sub: payload.sub,
    iat: payload.iat,
    exp: payload.exp,
    iss: payload.iss as string | undefined,
    user: {
      id: userData.id,
      email: userData.email,
      firstName: userData.firstName,
      lastName: userData.lastName,
      roleId: userData.roleId,
      isRootAdmin: Boolean(userData.isRootAdmin),
      isSysAdmin: Boolean(userData.isSysAdmin),
    },
    permissions: Array.isArray(payload.permissions) ? payload.permissions : [],
    sessionId: payload.sessionId as string,
  };

  return validatedPayload;
}

// =============================================================================
// TOKEN PARSING AND EXTRACTION UTILITIES
// =============================================================================

/**
 * Safely parses JWT token and extracts payload without signature verification
 * 
 * Useful for extracting token information for display purposes or preliminary
 * validation before performing full signature verification. Should not be used
 * for security-critical operations without subsequent validation.
 * 
 * @param token - JWT token string to parse
 * @returns Parsed token data or error information
 * 
 * @example
 * ```typescript
 * const parsed = parseTokenPayload(token);
 * if (parsed.success) {
 *   const expirationTime = new Date(parsed.payload.exp * 1000);
 *   console.log('Token expires at:', expirationTime);
 * }
 * ```
 */
export function parseTokenPayload(token: string): {
  success: boolean;
  payload?: JWTPayload;
  error?: AuthError;
} {
  try {
    if (!token || typeof token !== 'string') {
      return {
        success: false,
        error: createAuthError(
          AUTH_ERROR_CODES.TOKEN_INVALID,
          'Token is required and must be a string',
          { context: 'parseTokenPayload' }
        )
      };
    }

    // Remove Bearer prefix if present
    const cleanToken = token.replace(/^Bearer\s+/i, '').trim();
    
    // Split JWT into parts
    const parts = cleanToken.split('.');
    if (parts.length !== 3) {
      return {
        success: false,
        error: createAuthError(
          AUTH_ERROR_CODES.TOKEN_INVALID,
          'Invalid JWT format - must have three parts separated by dots',
          { context: 'parseTokenPayload' }
        )
      };
    }

    // Decode payload (second part)
    try {
      const payloadBase64 = parts[1];
      // Add padding if necessary
      const paddedPayload = payloadBase64 + '='.repeat((4 - payloadBase64.length % 4) % 4);
      const decodedPayload = atob(paddedPayload);
      const payload = JSON.parse(decodedPayload);

      // Basic payload validation
      if (!payload || typeof payload !== 'object') {
        throw new Error('Payload is not a valid object');
      }

      // Convert to application format with basic validation
      const jwtPayload: JWTPayload = {
        sub: payload.sub || '',
        iat: payload.iat || 0,
        exp: payload.exp || 0,
        iss: payload.iss,
        user: payload.user || {
          id: 0,
          email: '',
          firstName: '',
          lastName: '',
          roleId: 0,
          isRootAdmin: false,
          isSysAdmin: false,
        },
        permissions: Array.isArray(payload.permissions) ? payload.permissions : [],
        sessionId: payload.sessionId || '',
      };

      return {
        success: true,
        payload: jwtPayload
      };

    } catch (decodeError) {
      return {
        success: false,
        error: createAuthError(
          AUTH_ERROR_CODES.TOKEN_INVALID,
          'Failed to decode JWT payload',
          { 
            context: 'parseTokenPayload',
            originalError: decodeError instanceof Error ? decodeError.message : 'Unknown decode error'
          }
        )
      };
    }

  } catch (error) {
    return {
      success: false,
      error: createAuthError(
        AUTH_ERROR_CODES.TOKEN_INVALID,
        'Failed to parse JWT token',
        { 
          context: 'parseTokenPayload',
          originalError: error instanceof Error ? error.message : 'Unknown error'
        }
      )
    };
  }
}

/**
 * Extracts token from various sources (headers, cookies) for middleware processing
 * 
 * Supports multiple token sources to accommodate different authentication patterns
 * including Authorization headers, custom headers, and HTTP-only cookies.
 * 
 * @param context - Middleware authentication context with headers and request data
 * @returns Extracted token string or null if not found
 * 
 * @example
 * ```typescript
 * // In Next.js middleware
 * const token = extractTokenFromRequest({
 *   headers: req.headers,
 *   pathname: req.nextUrl.pathname
 * });
 * ```
 */
export function extractTokenFromRequest(context: MiddlewareAuthContext): string | null {
  const { headers } = context;

  // Try Authorization header first
  const authHeader = headers[TOKEN_CONFIG.AUTHORIZATION_HEADER.toLowerCase()];
  if (authHeader && typeof authHeader === 'string') {
    const match = authHeader.match(/^Bearer\s+(.+)$/i);
    if (match && match[1]) {
      return match[1];
    }
  }

  // Try custom session token header
  const sessionHeader = headers[TOKEN_CONFIG.SESSION_TOKEN_KEY.toLowerCase()];
  if (sessionHeader && typeof sessionHeader === 'string') {
    return sessionHeader;
  }

  // Try legacy token header
  const legacyHeader = headers[TOKEN_CONFIG.LEGACY_TOKEN_KEY.toLowerCase()];
  if (legacyHeader && typeof legacyHeader === 'string') {
    return legacyHeader;
  }

  // Try cookie-based token (would be extracted by middleware from cookies)
  if (context.sessionToken && typeof context.sessionToken === 'string') {
    return context.sessionToken;
  }

  return null;
}

// =============================================================================
// TOKEN EXPIRATION AND REFRESH UTILITIES
// =============================================================================

/**
 * Checks if token is expired or approaching expiration
 * 
 * Evaluates token expiration status with configurable buffer time to enable
 * proactive token refresh before actual expiration occurs.
 * 
 * @param token - JWT token to check
 * @param bufferTimeMs - Buffer time in milliseconds before expiration (default: 5 minutes)
 * @returns Token expiration status with detailed timing information
 * 
 * @example
 * ```typescript
 * const expirationStatus = await checkTokenExpiration(token);
 * if (expirationStatus.needsRefresh) {
 *   await refreshAuthToken();
 * }
 * ```
 */
export async function checkTokenExpiration(
  token: string,
  bufferTimeMs: number = REFRESH_TIMING.BUFFER_TIME
): Promise<{
  isExpired: boolean;
  needsRefresh: boolean;
  expiresAt?: Date;
  timeUntilExpiry?: number;
  error?: AuthError;
}> {
  try {
    // Parse token to get expiration without full validation
    const parseResult = parseTokenPayload(token);
    
    if (!parseResult.success || !parseResult.payload) {
      return {
        isExpired: true,
        needsRefresh: true,
        error: parseResult.error || createAuthError(
          AUTH_ERROR_CODES.TOKEN_INVALID,
          'Failed to parse token for expiration check'
        )
      };
    }

    const now = Date.now();
    const expirationTime = parseResult.payload.exp * 1000; // Convert to milliseconds
    const timeUntilExpiry = expirationTime - now;
    
    const isExpired = timeUntilExpiry <= 0;
    const needsRefresh = timeUntilExpiry <= bufferTimeMs && timeUntilExpiry > 0;

    return {
      isExpired,
      needsRefresh,
      expiresAt: new Date(expirationTime),
      timeUntilExpiry: Math.max(0, timeUntilExpiry),
    };

  } catch (error) {
    return {
      isExpired: true,
      needsRefresh: true,
      error: createAuthError(
        AUTH_ERROR_CODES.TOKEN_INVALID,
        'Failed to check token expiration',
        { 
          context: 'checkTokenExpiration',
          originalError: error instanceof Error ? error.message : 'Unknown error'
        }
      )
    };
  }
}

/**
 * Automatically refreshes JWT token with exponential backoff retry strategy
 * 
 * Implements intelligent token refresh with retry logic, exponential backoff,
 * and comprehensive error handling. Integrates with DreamFactory API endpoints
 * for seamless token renewal.
 * 
 * @param currentToken - Current JWT token to refresh
 * @param retryCount - Current retry attempt (used for exponential backoff)
 * @returns Promise resolving to refresh result with new token or error
 * 
 * @example
 * ```typescript
 * const refreshResult = await refreshToken(currentToken);
 * if (refreshResult.success) {
 *   updateStoredToken(refreshResult.newToken);
 * } else {
 *   handleRefreshFailure(refreshResult.error);
 * }
 * ```
 */
export async function refreshToken(
  currentToken: string,
  retryCount: number = 0
): Promise<{
  success: boolean;
  newToken?: string;
  expiresAt?: Date;
  error?: AuthError;
}> {
  try {
    // Validate current token format before attempting refresh
    const parseResult = parseTokenPayload(currentToken);
    if (!parseResult.success) {
      return {
        success: false,
        error: createAuthError(
          AUTH_ERROR_CODES.TOKEN_INVALID,
          'Cannot refresh invalid token',
          { context: 'refreshToken' }
        )
      };
    }

    // Calculate retry delay with exponential backoff
    if (retryCount > 0) {
      const delay = Math.min(
        REFRESH_TIMING.RETRY_DELAY * Math.pow(REFRESH_TIMING.BACKOFF_MULTIPLIER, retryCount - 1),
        REFRESH_TIMING.MAX_BACKOFF_DELAY
      );
      await new Promise(resolve => setTimeout(resolve, delay));
    }

    // Prepare refresh request
    const refreshUrl = `${process.env.NEXT_PUBLIC_API_URL || ''}/api/v2/user/session`;
    const requestHeaders: HeadersInit = {
      'Content-Type': 'application/json',
      [TOKEN_CONFIG.AUTHORIZATION_HEADER]: `${TOKEN_CONFIG.BEARER_PREFIX} ${currentToken}`,
    };

    // Add API key if available
    if (process.env.NEXT_PUBLIC_API_KEY) {
      requestHeaders[TOKEN_CONFIG.API_KEY_HEADER] = process.env.NEXT_PUBLIC_API_KEY;
    }

    // Perform refresh request
    const response = await fetch(refreshUrl, {
      method: 'PUT',
      headers: requestHeaders,
      body: JSON.stringify({ session_token: currentToken }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      
      if (response.status === 401) {
        return {
          success: false,
          error: createAuthError(
            AUTH_ERROR_CODES.TOKEN_EXPIRED,
            'Token refresh failed - authentication required',
            { 
              context: 'refreshToken',
              statusCode: response.status,
              serverError: errorData
            }
          )
        };
      }

      // Retry on server errors if we haven't exceeded max retries
      if (response.status >= 500 && retryCount < REFRESH_TIMING.MAX_RETRIES) {
        return refreshToken(currentToken, retryCount + 1);
      }

      return {
        success: false,
        error: createAuthError(
          AUTH_ERROR_CODES.REFRESH_FAILED,
          `Token refresh failed with status ${response.status}`,
          { 
            context: 'refreshToken',
            statusCode: response.status,
            serverError: errorData
          }
        )
      };
    }

    // Parse refresh response
    const refreshData = await response.json();
    const newToken = refreshData.session_token || refreshData.sessionToken;
    
    if (!newToken) {
      return {
        success: false,
        error: createAuthError(
          AUTH_ERROR_CODES.REFRESH_FAILED,
          'No token returned from refresh endpoint',
          { context: 'refreshToken', response: refreshData }
        )
      };
    }

    // Validate new token
    const validationResult = await validateToken(newToken);
    if (!validationResult.isValid) {
      return {
        success: false,
        error: createAuthError(
          AUTH_ERROR_CODES.REFRESH_FAILED,
          'Refreshed token is invalid',
          { context: 'refreshToken', validationError: validationResult.error }
        )
      };
    }

    return {
      success: true,
      newToken,
      expiresAt: validationResult.expiresAt,
    };

  } catch (error) {
    // Retry on network errors if we haven't exceeded max retries
    if (retryCount < REFRESH_TIMING.MAX_RETRIES) {
      return refreshToken(currentToken, retryCount + 1);
    }

    return {
      success: false,
      error: createAuthError(
        AUTH_ERROR_CODES.NETWORK_ERROR,
        'Token refresh failed due to network error',
        { 
          context: 'refreshToken',
          retryCount,
          originalError: error instanceof Error ? error.message : 'Unknown error'
        }
      )
    };
  }
}

// =============================================================================
// NEXT.JS MIDDLEWARE INTEGRATION UTILITIES
// =============================================================================

/**
 * Processes authentication in Next.js middleware with comprehensive validation
 * 
 * Performs complete authentication flow including token extraction, validation,
 * refresh handling, and authorization checks. Optimized for edge runtime
 * performance with minimal latency overhead.
 * 
 * @param context - Middleware authentication context
 * @returns Promise resolving to middleware authentication result
 * 
 * @example
 * ```typescript
 * // In middleware.ts
 * export async function middleware(request: NextRequest) {
 *   const authResult = await processMiddlewareAuth({
 *     headers: Object.fromEntries(request.headers.entries()),
 *     pathname: request.nextUrl.pathname,
 *     userAgent: request.headers.get('user-agent') || undefined,
 *   });
 *   
 *   if (!authResult.isAuthenticated) {
 *     return NextResponse.redirect(new URL('/login', request.url));
 *   }
 *   
 *   return NextResponse.next();
 * }
 * ```
 */
export async function processMiddlewareAuth(
  context: MiddlewareAuthContext
): Promise<MiddlewareAuthResult> {
  try {
    // Extract token from request
    const token = extractTokenFromRequest(context);
    
    if (!token) {
      return {
        isAuthenticated: false,
        isAuthorized: false,
        redirectTo: '/login',
        error: createAuthError(
          AUTH_ERROR_CODES.UNAUTHORIZED,
          'No authentication token found',
          { context: 'processMiddlewareAuth' }
        )
      };
    }

    // Check token expiration first for performance
    const expirationStatus = await checkTokenExpiration(token);
    
    if (expirationStatus.isExpired) {
      return {
        isAuthenticated: false,
        isAuthorized: false,
        redirectTo: '/login',
        error: expirationStatus.error || createAuthError(
          AUTH_ERROR_CODES.TOKEN_EXPIRED,
          'Authentication token has expired',
          { context: 'processMiddlewareAuth' }
        )
      };
    }

    // Attempt token refresh if needed
    let currentToken = token;
    if (expirationStatus.needsRefresh) {
      const refreshResult = await refreshToken(token);
      
      if (refreshResult.success && refreshResult.newToken) {
        currentToken = refreshResult.newToken;
      } else {
        // Continue with current token if refresh fails but token is still valid
        console.warn('Token refresh failed but token is still valid:', refreshResult.error);
      }
    }

    // Validate token with signature verification
    const validationResult = await validateToken(currentToken);
    
    if (!validationResult.isValid) {
      return {
        isAuthenticated: false,
        isAuthorized: false,
        redirectTo: '/login',
        error: validationResult.error || createAuthError(
          AUTH_ERROR_CODES.TOKEN_INVALID,
          'Token validation failed',
          { context: 'processMiddlewareAuth' }
        )
      };
    }

    // Convert JWT payload to user session
    const userSession = convertPayloadToUserSession(validationResult.payload!);

    // Basic route authorization (can be extended with more complex logic)
    const isAuthorized = checkRouteAuthorization(context.pathname, userSession);

    const result: MiddlewareAuthResult = {
      isAuthenticated: true,
      isAuthorized,
      user: userSession,
    };

    // Add updated token if refresh occurred
    if (currentToken !== token) {
      result.updatedToken = currentToken;
      result.headers = {
        'Set-Cookie': `${COOKIE_CONFIG.SESSION_COOKIE_NAME}=${currentToken}; Path=${COOKIE_CONFIG.COOKIE_PATH}; HttpOnly; SameSite=Strict${COOKIE_CONFIG.SECURITY_SETTINGS.secure ? '; Secure' : ''}`
      };
    }

    // Redirect to forbidden page if not authorized
    if (!isAuthorized) {
      result.redirectTo = '/403';
      result.error = createAuthError(
        AUTH_ERROR_CODES.FORBIDDEN,
        'Insufficient permissions for requested resource',
        { context: 'processMiddlewareAuth', pathname: context.pathname }
      );
    }

    return result;

  } catch (error) {
    return {
      isAuthenticated: false,
      isAuthorized: false,
      redirectTo: '/login',
      error: createAuthError(
        AUTH_ERROR_CODES.SERVER_ERROR,
        'Authentication processing failed',
        { 
          context: 'processMiddlewareAuth',
          originalError: error instanceof Error ? error.message : 'Unknown error'
        }
      )
    };
  }
}

/**
 * Converts JWT payload to user session object
 * 
 * Transforms validated JWT payload into complete user session data structure
 * compatible with application authentication state management.
 * 
 * @param payload - Validated JWT payload
 * @returns Complete user session object
 */
function convertPayloadToUserSession(payload: JWTPayload): UserSession {
  const expirationDate = new Date(payload.exp * 1000);
  
  return {
    id: payload.user.id,
    email: payload.user.email,
    firstName: payload.user.firstName,
    lastName: payload.user.lastName,
    name: `${payload.user.firstName} ${payload.user.lastName}`.trim(),
    host: process.env.NEXT_PUBLIC_API_URL || '',
    sessionId: payload.sessionId,
    sessionToken: '', // Will be set by calling code
    tokenExpiryDate: expirationDate,
    lastLoginDate: new Date(payload.iat * 1000).toISOString(),
    isRootAdmin: payload.user.isRootAdmin,
    isSysAdmin: payload.user.isSysAdmin,
    roleId: payload.user.roleId,
    role_id: payload.user.roleId, // Legacy compatibility
  };
}

/**
 * Checks route authorization based on user permissions
 * 
 * Performs basic route-level authorization checks based on user session data.
 * Can be extended to support more complex permission evaluation logic.
 * 
 * @param pathname - Request pathname to check
 * @param user - User session data
 * @returns Boolean indicating if user is authorized for the route
 */
function checkRouteAuthorization(pathname: string, user: UserSession): boolean {
  // Admin routes require admin privileges
  if (pathname.startsWith('/admin-settings') || pathname.startsWith('/adf-admins')) {
    return user.isRootAdmin || user.isSysAdmin;
  }

  // System settings require system admin privileges
  if (pathname.startsWith('/system-settings') || pathname.startsWith('/adf-config')) {
    return user.isSysAdmin;
  }

  // All other protected routes require authentication (already verified)
  return true;
}

// =============================================================================
// TOKEN LIFECYCLE MANAGEMENT UTILITIES
// =============================================================================

/**
 * Creates a new JWT token with user session data
 * 
 * Generates signed JWT token with complete user session information,
 * appropriate expiration timing, and security claims for authentication.
 * 
 * @param userSession - User session data to encode in token
 * @param expirationSeconds - Token expiration time in seconds (optional)
 * @returns Promise resolving to signed JWT token
 * 
 * @example
 * ```typescript
 * const token = await createToken(userSession, SESSION_CONFIG.DEFAULT_SESSION_DURATION);
 * // Store token securely for authentication
 * ```
 */
export async function createToken(
  userSession: UserSession,
  expirationSeconds: number = SESSION_CONFIG.DEFAULT_SESSION_DURATION
): Promise<string> {
  const now = Math.floor(Date.now() / 1000);
  const exp = now + expirationSeconds;

  const payload: JoseJWTPayload = {
    sub: userSession.id.toString(),
    iat: now,
    exp: exp,
    iss: TOKEN_CONFIG.JWT_ISSUER,
    aud: TOKEN_CONFIG.JWT_AUDIENCE,
    user: {
      id: userSession.id,
      email: userSession.email,
      firstName: userSession.firstName,
      lastName: userSession.lastName,
      roleId: userSession.roleId,
      isRootAdmin: userSession.isRootAdmin,
      isSysAdmin: userSession.isSysAdmin,
    },
    sessionId: userSession.sessionId,
    permissions: [], // Can be populated from user role data
  };

  return await new SignJWT(payload)
    .setProtectedHeader({ alg: JWT_ALGORITHM })
    .sign(JWT_SECRET);
}

/**
 * Revokes JWT token by adding to blacklist (if implemented)
 * 
 * Placeholder for token revocation functionality. In a complete implementation,
 * this would add the token to a blacklist or mark it as revoked in storage.
 * 
 * @param token - JWT token to revoke
 * @returns Promise indicating revocation success
 */
export async function revokeToken(token: string): Promise<{
  success: boolean;
  error?: AuthError;
}> {
  try {
    // Parse token to get its ID/data for blacklisting
    const parseResult = parseTokenPayload(token);
    
    if (!parseResult.success) {
      return {
        success: false,
        error: createAuthError(
          AUTH_ERROR_CODES.TOKEN_INVALID,
          'Cannot revoke invalid token',
          { context: 'revokeToken' }
        )
      };
    }

    // TODO: Implement actual token blacklisting
    // This could involve:
    // - Adding token ID to Redis blacklist
    // - Storing revocation in database
    // - Notifying other services about revocation
    
    console.warn('Token revocation not fully implemented - token parsing successful');
    
    return { success: true };

  } catch (error) {
    return {
      success: false,
      error: createAuthError(
        AUTH_ERROR_CODES.SERVER_ERROR,
        'Token revocation failed',
        { 
          context: 'revokeToken',
          originalError: error instanceof Error ? error.message : 'Unknown error'
        }
      )
    };
  }
}

/**
 * Checks if a token has been revoked (if blacklist is implemented)
 * 
 * Placeholder for checking token revocation status. In a complete implementation,
 * this would check against a blacklist or revocation storage system.
 * 
 * @param token - JWT token to check
 * @returns Promise indicating if token is revoked
 */
export async function isTokenRevoked(token: string): Promise<{
  isRevoked: boolean;
  error?: AuthError;
}> {
  try {
    // Parse token to get its ID for blacklist checking
    const parseResult = parseTokenPayload(token);
    
    if (!parseResult.success) {
      return {
        isRevoked: true, // Consider invalid tokens as revoked
        error: createAuthError(
          AUTH_ERROR_CODES.TOKEN_INVALID,
          'Invalid token considered revoked',
          { context: 'isTokenRevoked' }
        )
      };
    }

    // TODO: Implement actual blacklist checking
    // This could involve:
    // - Checking Redis blacklist
    // - Querying revocation database
    // - Checking with external revocation service
    
    return { isRevoked: false };

  } catch (error) {
    return {
      isRevoked: true, // Fail safe - consider token revoked on error
      error: createAuthError(
        AUTH_ERROR_CODES.SERVER_ERROR,
        'Token revocation check failed',
        { 
          context: 'isTokenRevoked',
          originalError: error instanceof Error ? error.message : 'Unknown error'
        }
      )
    };
  }
}

// =============================================================================
// UTILITY FUNCTIONS
// =============================================================================

/**
 * Creates standardized authentication error object
 * 
 * Generates consistent authentication error objects with proper typing,
 * context information, and debugging details for comprehensive error handling.
 * 
 * @param code - Standardized error code
 * @param message - Human-readable error message
 * @param context - Additional error context and debugging information
 * @returns Properly formatted authentication error
 */
function createAuthError(
  code: string,
  message: string,
  context?: Record<string, any>
): AuthError {
  return {
    code,
    message,
    timestamp: new Date().toISOString(),
    requestId: `jwt-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    context,
  };
}

/**
 * Validates JWT token format without signature verification
 * 
 * Performs basic format validation to ensure token has proper JWT structure
 * before attempting more expensive signature verification operations.
 * 
 * @param token - Token string to validate
 * @returns Boolean indicating if token format is valid
 */
export function isValidTokenFormat(token: string): boolean {
  if (!token || typeof token !== 'string') {
    return false;
  }

  const cleanToken = token.replace(/^Bearer\s+/i, '').trim();
  const parts = cleanToken.split('.');
  
  return parts.length === 3 && parts.every(part => part.length > 0);
}

/**
 * Gets token expiration time without full validation
 * 
 * Quickly extracts expiration timestamp from JWT token for timing calculations
 * without performing expensive signature verification.
 * 
 * @param token - JWT token to check
 * @returns Expiration Date object or null if invalid
 */
export function getTokenExpiration(token: string): Date | null {
  const parseResult = parseTokenPayload(token);
  
  if (parseResult.success && parseResult.payload) {
    return new Date(parseResult.payload.exp * 1000);
  }
  
  return null;
}

/**
 * Calculates time until token expiration
 * 
 * Determines how much time remains before token expires, useful for
 * scheduling refresh operations and user notifications.
 * 
 * @param token - JWT token to check
 * @returns Time until expiration in milliseconds, or null if invalid
 */
export function getTimeUntilExpiration(token: string): number | null {
  const expiration = getTokenExpiration(token);
  
  if (expiration) {
    return Math.max(0, expiration.getTime() - Date.now());
  }
  
  return null;
}

// =============================================================================
// EXPORTS
// =============================================================================

export type {
  JWTPayload,
  MiddlewareAuthContext,
  MiddlewareAuthResult,
} from '@/types/auth';

export {
  AUTH_ERROR_CODES,
  TOKEN_CONFIG,
  SESSION_CONFIG,
  REFRESH_CONFIG,
} from './constants';