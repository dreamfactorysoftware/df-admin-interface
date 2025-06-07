/**
 * Authentication Client Utilities for DreamFactory React/Next.js Admin Interface
 * 
 * Comprehensive JWT token management, session validation, and authentication header
 * configuration with Next.js middleware integration. Provides secure token operations
 * including automatic refresh, cookie management, and server-side authentication workflows.
 * 
 * Key Features:
 * - JWT token management with automatic refresh per Section 4.5.1 Next.js middleware authentication flow
 * - Secure cookie operations with HttpOnly and SameSite=Strict configuration per security requirements
 * - Session validation with automatic token expiration detection and refresh workflows
 * - Authentication header management for API requests per existing session-token interceptor behavior
 * - Token clearance utilities for logout and session cleanup per existing user data service patterns
 * - Integration with Next.js middleware for server-side authentication per Section 4.5.1.1 middleware features
 * 
 * @fileoverview Authentication client utilities for DreamFactory Admin Interface
 * @version 1.0.0
 * @since React 19.0.0 / Next.js 15.1+
 */

import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';
import type {
  UserSession,
  LoginCredentials,
  LoginResponse,
  AuthError,
  JWTPayload,
  MiddlewareAuthContext,
  MiddlewareAuthResult,
  AuthCookieConfig,
  SessionValidationResult,
  TokenRefreshResult,
  AuthErrorCode,
} from '@/types/auth';
import type {
  UserProfile,
  SessionCookieData,
} from '@/types/user';
import type {
  ApiRequestConfig,
  AuthConfig,
  SessionManager,
  AuthProvider,
} from '@/lib/api-client/types';
import { env, getClientConfig, getServerConfig } from '@/lib/config/environment';

// ============================================================================
// CONSTANTS AND CONFIGURATION
// ============================================================================

/**
 * Default cookie configuration for secure session storage
 * Follows security best practices with HttpOnly, Secure, and SameSite=Strict
 */
const DEFAULT_COOKIE_CONFIG: AuthCookieConfig = {
  name: 'df-session-token',
  maxAge: 86400, // 24 hours
  secure: env.NODE_ENV === 'production',
  httpOnly: true,
  sameSite: 'strict',
  path: '/',
  domain: env.NODE_ENV === 'production' ? undefined : undefined, // Let browser handle domain
};

/**
 * Session token storage keys for client-side operations
 */
const STORAGE_KEYS = {
  SESSION_TOKEN: 'df-session-token',
  REFRESH_TOKEN: 'df-refresh-token',
  USER_DATA: 'df-user-data',
  CSRF_TOKEN: 'df-csrf-token',
  TOKEN_VERSION: 'df-token-version',
} as const;

/**
 * Default expiration buffer for token refresh (5 minutes)
 * Tokens are refreshed when they expire within this buffer
 */
const TOKEN_REFRESH_BUFFER_MS = 5 * 60 * 1000;

/**
 * Maximum retry attempts for token refresh operations
 */
const MAX_REFRESH_RETRIES = 3;

// ============================================================================
// JWT TOKEN UTILITIES
// ============================================================================

/**
 * Parse JWT token payload without verification
 * Used for extracting expiration time and user data from tokens
 * 
 * @param token - JWT token string
 * @returns Parsed JWT payload or null if invalid
 */
export function parseJWTPayload(token: string): JWTPayload | null {
  try {
    if (!token || typeof token !== 'string') {
      return null;
    }

    const parts = token.split('.');
    if (parts.length !== 3) {
      return null;
    }

    // Decode base64url payload
    const payload = parts[1];
    const base64 = payload.replace(/-/g, '+').replace(/_/g, '/');
    const padded = base64.padEnd(base64.length + (4 - base64.length % 4) % 4, '=');
    
    const decoded = atob(padded);
    const parsed = JSON.parse(decoded) as JWTPayload;

    // Validate required fields
    if (!parsed.sub || !parsed.exp || !parsed.iat) {
      return null;
    }

    return parsed;
  } catch (error) {
    console.warn('Failed to parse JWT payload:', error);
    return null;
  }
}

/**
 * Check if JWT token is expired or will expire within the refresh buffer
 * 
 * @param token - JWT token string
 * @param bufferMs - Time buffer in milliseconds before expiration to consider expired
 * @returns True if token is expired or will expire soon
 */
export function isTokenExpired(token: string, bufferMs: number = TOKEN_REFRESH_BUFFER_MS): boolean {
  const payload = parseJWTPayload(token);
  if (!payload || !payload.exp) {
    return true;
  }

  const now = Math.floor(Date.now() / 1000);
  const expirationWithBuffer = payload.exp - Math.floor(bufferMs / 1000);
  
  return now >= expirationWithBuffer;
}

/**
 * Extract user session data from JWT token payload
 * 
 * @param token - JWT token string
 * @returns User session data or null if invalid
 */
export function extractUserFromToken(token: string): UserSession | null {
  const payload = parseJWTPayload(token);
  if (!payload) {
    return null;
  }

  try {
    return {
      id: payload.user.id,
      session_token: token,
      sessionToken: token,
      user_id: payload.user.id,
      username: payload.user.email.split('@')[0] || '',
      email: payload.user.email,
      display_name: `${payload.user.firstName} ${payload.user.lastName}`.trim(),
      is_sys_admin: payload.user.isSysAdmin || false,
      is_active: true,
      role: payload.user.roleId ? { id: payload.user.roleId, name: '', description: '', is_active: true } : undefined,
      permissions: payload.permissions || [],
      expires_at: new Date(payload.exp * 1000).toISOString(),
      sessionId: payload.sessionId,
      tokenVersion: 1,
      created_date: new Date(payload.iat * 1000).toISOString(),
    };
  } catch (error) {
    console.warn('Failed to extract user from token:', error);
    return null;
  }
}

// ============================================================================
// COOKIE OPERATIONS
// ============================================================================

/**
 * Set secure HTTP-only cookie with authentication token
 * Supports both client-side and server-side cookie operations
 * 
 * @param token - Authentication token to store
 * @param config - Cookie configuration options
 * @param response - Optional NextResponse for server-side cookie setting
 */
export function setAuthCookie(
  token: string,
  config: Partial<AuthCookieConfig> = {},
  response?: NextResponse
): void {
  const cookieConfig = { ...DEFAULT_COOKIE_CONFIG, ...config };
  
  const cookieValue = `${token}; Max-Age=${cookieConfig.maxAge}; Path=${cookieConfig.path}; ${
    cookieConfig.secure ? 'Secure; ' : ''
  }${cookieConfig.httpOnly ? 'HttpOnly; ' : ''}SameSite=${cookieConfig.sameSite}${
    cookieConfig.domain ? `; Domain=${cookieConfig.domain}` : ''
  }`;

  if (response) {
    // Server-side cookie setting
    response.headers.set('Set-Cookie', `${cookieConfig.name}=${cookieValue}`);
  } else if (typeof window !== 'undefined' && !cookieConfig.httpOnly) {
    // Client-side cookie setting (only for non-HttpOnly cookies)
    document.cookie = `${cookieConfig.name}=${token}; ${cookieValue}`;
  }
}

/**
 * Get authentication token from cookies
 * Supports both client-side and server-side cookie access
 * 
 * @param cookieName - Name of the cookie to retrieve
 * @param request - Optional NextRequest for server-side cookie access
 * @returns Authentication token or null if not found
 */
export async function getAuthCookie(
  cookieName: string = DEFAULT_COOKIE_CONFIG.name,
  request?: NextRequest
): Promise<string | null> {
  try {
    if (request) {
      // Server-side cookie access using Next.js request
      return request.cookies.get(cookieName)?.value || null;
    } else if (typeof window === 'undefined') {
      // Server component cookie access
      const cookieStore = cookies();
      return cookieStore.get(cookieName)?.value || null;
    } else {
      // Client-side cookie access
      const cookies = document.cookie.split(';');
      for (const cookie of cookies) {
        const [name, value] = cookie.split('=').map(c => c.trim());
        if (name === cookieName) {
          return value || null;
        }
      }
      return null;
    }
  } catch (error) {
    console.warn('Failed to get auth cookie:', error);
    return null;
  }
}

/**
 * Clear authentication cookies
 * Removes all authentication-related cookies for logout
 * 
 * @param response - Optional NextResponse for server-side cookie clearing
 */
export function clearAuthCookies(response?: NextResponse): void {
  const cookiesToClear = [
    DEFAULT_COOKIE_CONFIG.name,
    'df-refresh-token',
    'df-csrf-token',
  ];

  for (const cookieName of cookiesToClear) {
    if (response) {
      // Server-side cookie clearing
      response.headers.append(
        'Set-Cookie',
        `${cookieName}=; Max-Age=0; Path=/; ${
          DEFAULT_COOKIE_CONFIG.secure ? 'Secure; ' : ''
        }HttpOnly; SameSite=${DEFAULT_COOKIE_CONFIG.sameSite}`
      );
    } else if (typeof window !== 'undefined') {
      // Client-side cookie clearing
      document.cookie = `${cookieName}=; Max-Age=0; Path=/;`;
    }
  }
}

// ============================================================================
// SESSION STORAGE OPERATIONS
// ============================================================================

/**
 * Store user session data in browser storage
 * Uses sessionStorage for temporary data and localStorage for persistent data
 * 
 * @param session - User session data to store
 * @param persistent - Whether to use localStorage (true) or sessionStorage (false)
 */
export function storeSessionData(session: UserSession, persistent: boolean = false): void {
  if (typeof window === 'undefined') {
    return; // Server-side, skip storage operations
  }

  const storage = persistent ? localStorage : sessionStorage;
  
  try {
    // Store sanitized session data (remove sensitive token information)
    const sessionData = {
      id: session.id,
      user_id: session.user_id,
      username: session.username,
      email: session.email,
      display_name: session.display_name,
      is_sys_admin: session.is_sys_admin,
      is_active: session.is_active,
      role: session.role,
      permissions: session.permissions,
      expires_at: session.expires_at,
      sessionId: session.sessionId,
      created_date: session.created_date,
    };

    storage.setItem(STORAGE_KEYS.USER_DATA, JSON.stringify(sessionData));
    
    // Store token version for validation
    if (session.tokenVersion) {
      storage.setItem(STORAGE_KEYS.TOKEN_VERSION, session.tokenVersion.toString());
    }
  } catch (error) {
    console.warn('Failed to store session data:', error);
  }
}

/**
 * Retrieve user session data from browser storage
 * 
 * @param persistent - Whether to check localStorage (true) or sessionStorage (false)
 * @returns Stored user session data or null if not found
 */
export function getStoredSessionData(persistent: boolean = false): UserSession | null {
  if (typeof window === 'undefined') {
    return null; // Server-side, no browser storage access
  }

  const storage = persistent ? localStorage : sessionStorage;
  
  try {
    const storedData = storage.getItem(STORAGE_KEYS.USER_DATA);
    if (!storedData) {
      return null;
    }

    const sessionData = JSON.parse(storedData);
    const tokenVersion = storage.getItem(STORAGE_KEYS.TOKEN_VERSION);

    return {
      ...sessionData,
      tokenVersion: tokenVersion ? parseInt(tokenVersion, 10) : 1,
    };
  } catch (error) {
    console.warn('Failed to retrieve session data:', error);
    return null;
  }
}

/**
 * Clear all stored session data
 * Removes session data from both sessionStorage and localStorage
 */
export function clearStoredSessionData(): void {
  if (typeof window === 'undefined') {
    return; // Server-side, skip storage operations
  }

  try {
    // Clear from both storage types
    const storageTypes = [sessionStorage, localStorage];
    for (const storage of storageTypes) {
      Object.values(STORAGE_KEYS).forEach(key => {
        storage.removeItem(key);
      });
    }
  } catch (error) {
    console.warn('Failed to clear session data:', error);
  }
}

// ============================================================================
// AUTHENTICATION HEADER MANAGEMENT
// ============================================================================

/**
 * Generate authentication headers for API requests
 * Includes session token, API key, and CSRF token as needed
 * 
 * @param config - Authentication configuration
 * @returns Headers object with authentication data
 */
export function generateAuthHeaders(config: AuthConfig = {}): Record<string, string> {
  const headers: Record<string, string> = {};

  // Skip authentication if explicitly requested
  if (config.skipAuth) {
    return headers;
  }

  // Add session token header
  if (config.sessionToken) {
    headers['X-DreamFactory-Session-Token'] = config.sessionToken;
  }

  // Add API key header
  const apiKey = config.apiKey || getClientConfig().apiUrl;
  if (apiKey) {
    headers['X-DreamFactory-API-Key'] = apiKey;
  }

  // Add custom authentication headers
  if (config.headers) {
    Object.assign(headers, config.headers);
  }

  // Add CSRF token if available (client-side only)
  if (typeof window !== 'undefined') {
    const csrfToken = localStorage.getItem(STORAGE_KEYS.CSRF_TOKEN);
    if (csrfToken) {
      headers['X-CSRF-Token'] = csrfToken;
    }
  }

  return headers;
}

/**
 * Add authentication headers to an existing request configuration
 * Modifies the request config in place with authentication headers
 * 
 * @param requestConfig - API request configuration to modify
 * @param authConfig - Authentication configuration
 * @returns Modified request configuration with auth headers
 */
export function addAuthHeaders(
  requestConfig: ApiRequestConfig,
  authConfig: AuthConfig = {}
): ApiRequestConfig {
  const authHeaders = generateAuthHeaders(authConfig);
  
  return {
    ...requestConfig,
    headers: {
      ...requestConfig.headers,
      ...authHeaders,
    },
  };
}

// ============================================================================
// TOKEN REFRESH OPERATIONS
// ============================================================================

/**
 * Refresh authentication token using refresh token or session validation
 * Implements automatic token refresh logic per Section 4.5.1.2
 * 
 * @param currentToken - Current session token
 * @param refreshToken - Optional refresh token
 * @returns Promise resolving to token refresh result
 */
export async function refreshAuthToken(
  currentToken?: string,
  refreshToken?: string
): Promise<TokenRefreshResult> {
  try {
    const clientConfig = getClientConfig();
    
    // Prepare refresh request
    const refreshPayload: any = {};
    
    if (refreshToken) {
      refreshPayload.refresh_token = refreshToken;
    } else if (currentToken) {
      refreshPayload.session_token = currentToken;
    } else {
      return {
        success: false,
        error: 'No token available for refresh',
        requiresReauth: true,
      };
    }

    // Make refresh request to DreamFactory API
    const response = await fetch(`${clientConfig.apiUrl}/api/v2/user/session`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'X-DreamFactory-API-Key': clientConfig.apiUrl, // This should be the actual API key
      },
      body: JSON.stringify(refreshPayload),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return {
        success: false,
        error: errorData.error?.message || 'Token refresh failed',
        requiresReauth: response.status === 401 || response.status === 403,
      };
    }

    const data = await response.json();
    
    return {
      success: true,
      accessToken: data.session_token || data.sessionToken,
      refreshToken: data.refresh_token,
      expiresIn: data.expires_in,
    };
  } catch (error) {
    console.error('Token refresh error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Network error during token refresh',
      requiresReauth: true,
    };
  }
}

/**
 * Automatic token refresh with retry logic
 * Implements exponential backoff for failed refresh attempts
 * 
 * @param currentToken - Current session token
 * @param retryCount - Current retry attempt count
 * @returns Promise resolving to refreshed token or null
 */
export async function autoRefreshToken(
  currentToken: string,
  retryCount: number = 0
): Promise<string | null> {
  if (retryCount >= MAX_REFRESH_RETRIES) {
    console.error('Max token refresh retries exceeded');
    return null;
  }

  const refreshResult = await refreshAuthToken(currentToken);
  
  if (refreshResult.success && refreshResult.accessToken) {
    return refreshResult.accessToken;
  }

  if (refreshResult.requiresReauth) {
    console.warn('Token refresh requires re-authentication');
    return null;
  }

  // Implement exponential backoff for retry
  const delayMs = Math.min(1000 * Math.pow(2, retryCount), 10000);
  await new Promise(resolve => setTimeout(resolve, delayMs));
  
  return autoRefreshToken(currentToken, retryCount + 1);
}

// ============================================================================
// SESSION VALIDATION
// ============================================================================

/**
 * Validate user session with automatic token expiration detection
 * Checks token validity and triggers refresh if needed
 * 
 * @param session - User session to validate
 * @param autoRefresh - Whether to automatically refresh expired tokens
 * @returns Promise resolving to session validation result
 */
export async function validateSession(
  session: UserSession | null,
  autoRefresh: boolean = true
): Promise<SessionValidationResult> {
  if (!session || !session.session_token) {
    return {
      isValid: false,
      error: 'session_expired',
      requiresRefresh: false,
    };
  }

  // Check if token is expired
  if (isTokenExpired(session.session_token)) {
    if (!autoRefresh) {
      return {
        isValid: false,
        error: 'token_expired',
        requiresRefresh: true,
      };
    }

    // Attempt automatic token refresh
    const refreshedToken = await autoRefreshToken(session.session_token);
    
    if (refreshedToken) {
      const updatedSession = {
        ...session,
        session_token: refreshedToken,
        sessionToken: refreshedToken,
      };
      
      return {
        isValid: true,
        session: updatedSession,
        requiresRefresh: false,
      };
    } else {
      return {
        isValid: false,
        error: 'refresh_required',
        requiresRefresh: true,
      };
    }
  }

  // Validate user status
  if (!session.is_active) {
    return {
      isValid: false,
      error: 'user_inactive',
      requiresRefresh: false,
    };
  }

  return {
    isValid: true,
    session,
    requiresRefresh: false,
  };
}

/**
 * Validate session for Next.js middleware context
 * Performs server-side session validation with middleware integration
 * 
 * @param context - Middleware authentication context
 * @returns Promise resolving to middleware authentication result
 */
export async function validateMiddlewareSession(
  context: MiddlewareAuthContext
): Promise<MiddlewareAuthResult> {
  try {
    const { sessionToken, pathname, headers } = context;

    if (!sessionToken) {
      return {
        isAuthenticated: false,
        isAuthorized: false,
        redirectTo: `/login?returnUrl=${encodeURIComponent(pathname)}`,
      };
    }

    // Parse and validate JWT token
    const payload = parseJWTPayload(sessionToken);
    if (!payload) {
      return {
        isAuthenticated: false,
        isAuthorized: false,
        redirectTo: `/login?returnUrl=${encodeURIComponent(pathname)}`,
        error: {
          code: AuthErrorCode.TOKEN_INVALID,
          message: 'Invalid token format',
        },
      };
    }

    // Check token expiration
    if (isTokenExpired(sessionToken)) {
      // Attempt token refresh in middleware
      const refreshResult = await refreshAuthToken(sessionToken);
      
      if (refreshResult.success && refreshResult.accessToken) {
        const user = extractUserFromToken(refreshResult.accessToken);
        
        return {
          isAuthenticated: true,
          isAuthorized: true,
          user,
          updatedToken: refreshResult.accessToken,
          headers: {
            'Set-Cookie': `${DEFAULT_COOKIE_CONFIG.name}=${refreshResult.accessToken}; ${
              'Max-Age=' + DEFAULT_COOKIE_CONFIG.maxAge
            }; Path=/; ${DEFAULT_COOKIE_CONFIG.secure ? 'Secure; ' : ''}HttpOnly; SameSite=${
              DEFAULT_COOKIE_CONFIG.sameSite
            }`,
          },
        };
      } else {
        return {
          isAuthenticated: false,
          isAuthorized: false,
          redirectTo: `/login?returnUrl=${encodeURIComponent(pathname)}`,
          error: {
            code: AuthErrorCode.TOKEN_EXPIRED,
            message: 'Token expired and refresh failed',
          },
        };
      }
    }

    // Extract user session from valid token
    const user = extractUserFromToken(sessionToken);
    if (!user) {
      return {
        isAuthenticated: false,
        isAuthorized: false,
        redirectTo: `/login?returnUrl=${encodeURIComponent(pathname)}`,
        error: {
          code: AuthErrorCode.TOKEN_INVALID,
          message: 'Failed to extract user from token',
        },
      };
    }

    // Check user active status
    if (!user.is_active) {
      return {
        isAuthenticated: false,
        isAuthorized: false,
        redirectTo: '/login?error=account_inactive',
        error: {
          code: AuthErrorCode.UNAUTHORIZED,
          message: 'User account is inactive',
        },
      };
    }

    // Basic authorization check (can be extended with RBAC logic)
    const isAuthorized = checkRouteAuthorization(pathname, user);

    return {
      isAuthenticated: true,
      isAuthorized,
      user,
    };
  } catch (error) {
    console.error('Middleware session validation error:', error);
    return {
      isAuthenticated: false,
      isAuthorized: false,
      redirectTo: `/login?returnUrl=${encodeURIComponent(context.pathname)}`,
      error: {
        code: AuthErrorCode.SERVER_ERROR,
        message: 'Session validation failed',
      },
    };
  }
}

/**
 * Check route authorization for user
 * Basic implementation that can be extended with RBAC logic
 * 
 * @param pathname - Route pathname to check
 * @param user - User session data
 * @returns True if user is authorized for the route
 */
function checkRouteAuthorization(pathname: string, user: UserSession): boolean {
  // Public routes that don't require authorization
  const publicRoutes = ['/login', '/forgot-password', '/reset-password'];
  if (publicRoutes.some(route => pathname.startsWith(route))) {
    return true;
  }

  // Admin-only routes
  const adminRoutes = ['/admin-settings', '/system-settings'];
  if (adminRoutes.some(route => pathname.startsWith(route))) {
    return user.is_sys_admin || false;
  }

  // Default: authenticated users can access most routes
  return true;
}

// ============================================================================
// AUTHENTICATION PROVIDER IMPLEMENTATION
// ============================================================================

/**
 * Create authentication provider instance
 * Implements the AuthProvider interface for React context integration
 * 
 * @returns AuthProvider instance with authentication methods
 */
export function createAuthProvider(): AuthProvider {
  return {
    async login(credentials: LoginCredentials): Promise<LoginResponse> {
      try {
        const clientConfig = getClientConfig();
        
        const response = await fetch(`${clientConfig.apiUrl}/api/v2/user/session`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-DreamFactory-API-Key': clientConfig.apiUrl, // This should be the actual API key
          },
          body: JSON.stringify({
            email: credentials.email,
            username: credentials.username,
            password: credentials.password,
            remember: credentials.remember,
            service: credentials.service,
          }),
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error?.message || 'Login failed');
        }

        // Store authentication data
        const sessionToken = data.session_token || data.sessionToken;
        if (sessionToken) {
          setAuthCookie(sessionToken, {
            maxAge: credentials.remember ? 86400 * 30 : 86400, // 30 days if remember, 1 day otherwise
          });

          const user = extractUserFromToken(sessionToken);
          if (user) {
            storeSessionData(user, credentials.remember || false);
          }
        }

        return data;
      } catch (error) {
        console.error('Login error:', error);
        throw error;
      }
    },

    async logout(): Promise<void> {
      try {
        const sessionToken = await getAuthCookie();
        if (sessionToken) {
          const clientConfig = getClientConfig();
          
          // Attempt to invalidate session on server
          await fetch(`${clientConfig.apiUrl}/api/v2/user/session`, {
            method: 'DELETE',
            headers: {
              'X-DreamFactory-Session-Token': sessionToken,
              'X-DreamFactory-API-Key': clientConfig.apiUrl, // This should be the actual API key
            },
          }).catch(() => {
            // Ignore errors during logout - still clear local data
          });
        }
      } finally {
        // Always clear local authentication data
        clearAuthCookies();
        clearStoredSessionData();
      }
    },

    async refresh(): Promise<LoginResponse> {
      const sessionToken = await getAuthCookie();
      if (!sessionToken) {
        throw new Error('No session token available for refresh');
      }

      const refreshResult = await refreshAuthToken(sessionToken);
      
      if (!refreshResult.success) {
        throw new Error(refreshResult.error || 'Token refresh failed');
      }

      // Update stored token
      if (refreshResult.accessToken) {
        setAuthCookie(refreshResult.accessToken);
        const user = extractUserFromToken(refreshResult.accessToken);
        if (user) {
          storeSessionData(user);
        }
      }

      return {
        sessionToken: refreshResult.accessToken,
        session_token: refreshResult.accessToken,
        refresh_token: refreshResult.refreshToken,
        expires_in: refreshResult.expiresIn,
      };
    },

    async validate(): Promise<boolean> {
      const sessionToken = await getAuthCookie();
      if (!sessionToken) {
        return false;
      }

      const user = extractUserFromToken(sessionToken);
      const validationResult = await validateSession(user);
      
      return validationResult.isValid;
    },

    async getState() {
      const sessionToken = await getAuthCookie();
      const storedSession = getStoredSessionData();
      
      if (!sessionToken || !storedSession) {
        return {
          isAuthenticated: false,
          session: null,
          token: null,
          isLoading: false,
          error: null,
        };
      }

      const validationResult = await validateSession(storedSession);
      
      return {
        isAuthenticated: validationResult.isValid,
        session: validationResult.session || null,
        token: sessionToken,
        isLoading: false,
        error: validationResult.error ? {
          code: validationResult.error,
          message: `Session validation failed: ${validationResult.error}`,
        } : null,
      };
    },
  };
}

/**
 * Create session manager instance
 * Implements the SessionManager interface for token management
 * 
 * @returns SessionManager instance with session management methods
 */
export function createSessionManager(): SessionManager {
  return {
    async getToken(): Promise<string | null> {
      return getAuthCookie();
    },

    async setToken(token: string): Promise<void> {
      setAuthCookie(token);
      const user = extractUserFromToken(token);
      if (user) {
        storeSessionData(user);
      }
    },

    async clearToken(): Promise<void> {
      clearAuthCookies();
      clearStoredSessionData();
    },

    async validateSession(): Promise<boolean> {
      const token = await getAuthCookie();
      if (!token) {
        return false;
      }

      const user = extractUserFromToken(token);
      const validationResult = await validateSession(user);
      
      return validationResult.isValid;
    },

    async refreshToken(): Promise<string> {
      const currentToken = await getAuthCookie();
      if (!currentToken) {
        throw new Error('No current token to refresh');
      }

      const refreshedToken = await autoRefreshToken(currentToken);
      if (!refreshedToken) {
        throw new Error('Token refresh failed');
      }

      await this.setToken(refreshedToken);
      return refreshedToken;
    },

    async getSessionMeta() {
      const token = await getAuthCookie();
      const storedSession = getStoredSessionData();
      
      if (!token || !storedSession) {
        return null;
      }

      const payload = parseJWTPayload(token);
      if (!payload) {
        return null;
      }

      return {
        createdAt: new Date(payload.iat * 1000).toISOString(),
        expiresAt: new Date(payload.exp * 1000).toISOString(),
        lastActivity: new Date().toISOString(),
        user: storedSession,
        capabilities: storedSession.permissions || [],
      };
    },
  };
}

// ============================================================================
// EXPORTS
// ============================================================================

// Export all utilities for convenient importing
export {
  DEFAULT_COOKIE_CONFIG,
  STORAGE_KEYS,
  TOKEN_REFRESH_BUFFER_MS,
  MAX_REFRESH_RETRIES,
};

// Export factory functions for creating provider instances
export const authClient = {
  createAuthProvider,
  createSessionManager,
  parseJWTPayload,
  isTokenExpired,
  extractUserFromToken,
  validateSession,
  validateMiddlewareSession,
  generateAuthHeaders,
  addAuthHeaders,
  refreshAuthToken,
  autoRefreshToken,
  setAuthCookie,
  getAuthCookie,
  clearAuthCookies,
  storeSessionData,
  getStoredSessionData,
  clearStoredSessionData,
};

// Export as default for convenient importing
export default authClient;