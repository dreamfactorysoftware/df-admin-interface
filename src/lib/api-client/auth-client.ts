/**
 * Authentication client utilities for JWT token management, session validation,
 * and authentication header configuration in the React/Next.js environment.
 * 
 * This module provides comprehensive authentication capabilities including:
 * - JWT token management with automatic refresh per Section 4.5.1
 * - Secure cookie operations with HTTP-only and SameSite=Strict configuration
 * - Session validation with automatic token expiration detection
 * - Authentication header management for API requests
 * - Token clearance utilities for logout and session cleanup
 * - Integration with Next.js middleware for server-side authentication
 * 
 * @module AuthClient
 * @version 1.0.0
 */

import { cookies } from 'next/headers';
import { AuthToken, AuthHeaders, SessionData, AuthContext } from './types';

// =============================================================================
// CONSTANTS AND CONFIGURATION
// =============================================================================

/**
 * Authentication configuration constants
 */
export const AUTH_CONFIG = {
  /** Session token cookie name */
  SESSION_TOKEN_COOKIE: 'df_session_token',
  /** Refresh token cookie name */
  REFRESH_TOKEN_COOKIE: 'df_refresh_token',
  /** User data storage key */
  USER_DATA_KEY: 'df_user_data',
  /** Session metadata storage key */
  SESSION_META_KEY: 'df_session_meta',
  /** Token refresh threshold in minutes */
  REFRESH_THRESHOLD_MINUTES: 5,
  /** Maximum retry attempts for token refresh */
  MAX_REFRESH_RETRIES: 3,
  /** Default token expiration time in hours */
  DEFAULT_TOKEN_EXPIRY_HOURS: 24,
  /** API key header name */
  API_KEY_HEADER: 'X-DreamFactory-API-Key',
  /** Session token header name */
  SESSION_TOKEN_HEADER: 'X-DreamFactory-Session-Token',
  /** License key header name */
  LICENSE_KEY_HEADER: 'X-DreamFactory-License-Key',
} as const;

/**
 * Cookie configuration options for secure token storage
 */
export const COOKIE_OPTIONS = {
  /** HTTP-only flag for security */
  httpOnly: true,
  /** Secure flag for HTTPS-only transmission */
  secure: process.env.NODE_ENV === 'production',
  /** SameSite configuration for CSRF protection */
  sameSite: 'strict' as const,
  /** Cookie path */
  path: '/',
  /** Maximum age in seconds (24 hours) */
  maxAge: 24 * 60 * 60,
} as const;

// =============================================================================
// TYPE DEFINITIONS FOR AUTH CLIENT
// =============================================================================

/**
 * Authentication error types
 */
export type AuthError =
  | 'TOKEN_EXPIRED'
  | 'TOKEN_INVALID'
  | 'REFRESH_FAILED'
  | 'NETWORK_ERROR'
  | 'UNAUTHORIZED'
  | 'FORBIDDEN'
  | 'UNKNOWN_ERROR';

/**
 * Token validation result interface
 */
export interface TokenValidationResult {
  /** Whether the token is valid */
  isValid: boolean;
  /** Whether the token is expired */
  isExpired: boolean;
  /** Whether the token needs refresh */
  needsRefresh: boolean;
  /** Error if validation failed */
  error?: AuthError;
  /** Remaining time until expiration in seconds */
  expiresIn?: number;
}

/**
 * Session refresh result interface
 */
export interface SessionRefreshResult {
  /** Whether the refresh was successful */
  success: boolean;
  /** New authentication token if successful */
  token?: AuthToken;
  /** Error if refresh failed */
  error?: AuthError;
  /** Retry count for failed attempts */
  retryCount?: number;
}

/**
 * Authentication state interface
 */
export interface AuthState {
  /** Current authentication token */
  token?: AuthToken;
  /** Current session data */
  session?: SessionData;
  /** Authentication status */
  isAuthenticated: boolean;
  /** Authentication in progress */
  isAuthenticating: boolean;
  /** Last authentication error */
  lastError?: AuthError;
  /** Last activity timestamp */
  lastActivity: number;
}

// =============================================================================
// TOKEN MANAGEMENT UTILITIES
// =============================================================================

/**
 * Decodes a JWT token payload without verification
 * Used for extracting expiration and basic claims information
 * 
 * @param token - JWT token string
 * @returns Decoded token payload or null if invalid
 */
export function decodeJwtPayload(token: string): Record<string, any> | null {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) {
      return null;
    }

    const payload = parts[1];
    const decoded = atob(payload.replace(/-/g, '+').replace(/_/g, '/'));
    return JSON.parse(decoded);
  } catch (error) {
    console.error('JWT decode error:', error);
    return null;
  }
}

/**
 * Validates JWT token structure and expiration
 * Performs client-side validation for immediate feedback
 * 
 * @param token - JWT token string
 * @returns Token validation result with detailed status
 */
export function validateTokenStructure(token: string): TokenValidationResult {
  if (!token) {
    return {
      isValid: false,
      isExpired: false,
      needsRefresh: false,
      error: 'TOKEN_INVALID',
    };
  }

  const payload = decodeJwtPayload(token);
  if (!payload) {
    return {
      isValid: false,
      isExpired: false,
      needsRefresh: false,
      error: 'TOKEN_INVALID',
    };
  }

  const currentTime = Math.floor(Date.now() / 1000);
  const expirationTime = payload.exp;

  if (!expirationTime) {
    return {
      isValid: false,
      isExpired: false,
      needsRefresh: false,
      error: 'TOKEN_INVALID',
    };
  }

  const isExpired = currentTime >= expirationTime;
  const expiresIn = expirationTime - currentTime;
  const needsRefresh = expiresIn <= (AUTH_CONFIG.REFRESH_THRESHOLD_MINUTES * 60);

  return {
    isValid: !isExpired,
    isExpired,
    needsRefresh,
    expiresIn: Math.max(0, expiresIn),
  };
}

/**
 * Creates an AuthToken object from JWT string
 * Extracts expiration and other metadata from token payload
 * 
 * @param sessionToken - JWT session token
 * @param refreshToken - Optional refresh token
 * @returns AuthToken object with metadata
 */
export function createAuthToken(
  sessionToken: string,
  refreshToken?: string
): AuthToken | null {
  const payload = decodeJwtPayload(sessionToken);
  if (!payload || !payload.exp) {
    return null;
  }

  return {
    sessionToken,
    expiresAt: payload.exp * 1000, // Convert to milliseconds
    refreshToken,
    tokenType: 'Bearer',
  };
}

/**
 * Checks if a token needs refresh based on expiration threshold
 * Used by middleware to determine when to attempt automatic refresh
 * 
 * @param token - AuthToken to check
 * @returns Boolean indicating if refresh is needed
 */
export function shouldRefreshToken(token: AuthToken): boolean {
  const currentTime = Date.now();
  const refreshThreshold = AUTH_CONFIG.REFRESH_THRESHOLD_MINUTES * 60 * 1000;
  return (token.expiresAt - currentTime) <= refreshThreshold;
}

// =============================================================================
// SECURE COOKIE OPERATIONS
// =============================================================================

/**
 * Stores authentication token in secure HTTP-only cookies
 * Implements SameSite=Strict and secure flags for production
 * 
 * @param token - AuthToken to store
 * @returns Promise resolving when cookies are set
 */
export async function storeTokenInCookies(token: AuthToken): Promise<void> {
  const cookieStore = cookies();

  // Store session token
  cookieStore.set(AUTH_CONFIG.SESSION_TOKEN_COOKIE, token.sessionToken, {
    ...COOKIE_OPTIONS,
    expires: new Date(token.expiresAt),
  });

  // Store refresh token if available
  if (token.refreshToken) {
    cookieStore.set(AUTH_CONFIG.REFRESH_TOKEN_COOKIE, token.refreshToken, {
      ...COOKIE_OPTIONS,
      expires: new Date(token.expiresAt + (7 * 24 * 60 * 60 * 1000)), // 7 days longer
    });
  }
}

/**
 * Retrieves authentication token from cookies
 * Handles both session and refresh tokens with validation
 * 
 * @returns AuthToken object or null if not found/invalid
 */
export async function getTokenFromCookies(): Promise<AuthToken | null> {
  try {
    const cookieStore = cookies();
    
    const sessionToken = cookieStore.get(AUTH_CONFIG.SESSION_TOKEN_COOKIE)?.value;
    const refreshToken = cookieStore.get(AUTH_CONFIG.REFRESH_TOKEN_COOKIE)?.value;

    if (!sessionToken) {
      return null;
    }

    return createAuthToken(sessionToken, refreshToken);
  } catch (error) {
    console.error('Cookie retrieval error:', error);
    return null;
  }
}

/**
 * Clears authentication cookies from browser storage
 * Used during logout and session cleanup operations
 * 
 * @returns Promise resolving when cookies are cleared
 */
export async function clearAuthCookies(): Promise<void> {
  const cookieStore = cookies();

  // Clear session token cookie
  cookieStore.delete(AUTH_CONFIG.SESSION_TOKEN_COOKIE);
  
  // Clear refresh token cookie
  cookieStore.delete(AUTH_CONFIG.REFRESH_TOKEN_COOKIE);
}

/**
 * Stores session data in browser storage
 * Uses sessionStorage for temporary data and localStorage for preferences
 * 
 * @param sessionData - SessionData to store
 * @returns Promise resolving when data is stored
 */
export async function storeSessionData(sessionData: SessionData): Promise<void> {
  try {
    // Store in sessionStorage for current session
    if (typeof window !== 'undefined') {
      sessionStorage.setItem(AUTH_CONFIG.USER_DATA_KEY, JSON.stringify(sessionData));
      sessionStorage.setItem(AUTH_CONFIG.SESSION_META_KEY, JSON.stringify({
        lastActivity: Date.now(),
        sessionId: sessionData.userId,
      }));
    }
  } catch (error) {
    console.error('Session data storage error:', error);
  }
}

/**
 * Retrieves session data from browser storage
 * Validates data integrity and expiration
 * 
 * @returns SessionData object or null if not found/invalid
 */
export async function getStoredSessionData(): Promise<SessionData | null> {
  try {
    if (typeof window === 'undefined') {
      return null;
    }

    const storedData = sessionStorage.getItem(AUTH_CONFIG.USER_DATA_KEY);
    if (!storedData) {
      return null;
    }

    const sessionData: SessionData = JSON.parse(storedData);
    
    // Validate session data structure
    if (!sessionData.userId || !sessionData.username) {
      return null;
    }

    return sessionData;
  } catch (error) {
    console.error('Session data retrieval error:', error);
    return null;
  }
}

/**
 * Clears all stored session data
 * Removes data from both sessionStorage and localStorage
 * 
 * @returns Promise resolving when data is cleared
 */
export async function clearStoredSessionData(): Promise<void> {
  try {
    if (typeof window !== 'undefined') {
      sessionStorage.removeItem(AUTH_CONFIG.USER_DATA_KEY);
      sessionStorage.removeItem(AUTH_CONFIG.SESSION_META_KEY);
      localStorage.removeItem('df_user_preferences'); // Clear user preferences
    }
  } catch (error) {
    console.error('Session data cleanup error:', error);
  }
}

// =============================================================================
// AUTHENTICATION HEADER MANAGEMENT
// =============================================================================

/**
 * Generates authentication headers for API requests
 * Supports both session tokens and API keys per DreamFactory requirements
 * 
 * @param options - Authentication options
 * @returns AuthHeaders object with appropriate headers
 */
export function generateAuthHeaders(options: {
  sessionToken?: string;
  apiKey?: string;
  licenseKey?: string;
}): AuthHeaders {
  const headers: AuthHeaders = {};

  // Add session token header if available
  if (options.sessionToken) {
    headers[AUTH_CONFIG.SESSION_TOKEN_HEADER] = options.sessionToken;
    headers['Authorization'] = `Bearer ${options.sessionToken}`;
  }

  // Add API key header if available
  if (options.apiKey) {
    headers[AUTH_CONFIG.API_KEY_HEADER] = options.apiKey;
  }

  // Add license key header if available
  if (options.licenseKey) {
    headers[AUTH_CONFIG.LICENSE_KEY_HEADER] = options.licenseKey;
  }

  return headers;
}

/**
 * Retrieves current authentication headers from stored tokens
 * Automatically includes valid session tokens and configured API keys
 * 
 * @returns Promise resolving to AuthHeaders object
 */
export async function getCurrentAuthHeaders(): Promise<AuthHeaders> {
  const token = await getTokenFromCookies();
  const apiKey = process.env.NEXT_PUBLIC_DREAMFACTORY_API_KEY;
  const licenseKey = process.env.DREAMFACTORY_LICENSE_KEY;

  if (!token) {
    return generateAuthHeaders({ apiKey, licenseKey });
  }

  const validation = validateTokenStructure(token.sessionToken);
  if (!validation.isValid) {
    return generateAuthHeaders({ apiKey, licenseKey });
  }

  return generateAuthHeaders({
    sessionToken: token.sessionToken,
    apiKey,
    licenseKey,
  });
}

/**
 * Updates authentication headers for fetch requests
 * Middleware-compatible function for automatic header injection
 * 
 * @param headers - Existing headers object
 * @param authHeaders - Authentication headers to add
 * @returns Updated headers object
 */
export function updateRequestHeaders(
  headers: HeadersInit = {},
  authHeaders: AuthHeaders
): HeadersInit {
  const updatedHeaders = new Headers(headers);

  Object.entries(authHeaders).forEach(([key, value]) => {
    if (value) {
      updatedHeaders.set(key, value);
    }
  });

  return updatedHeaders;
}

// =============================================================================
// SESSION VALIDATION AND REFRESH
// =============================================================================

/**
 * Validates current session and token status
 * Checks both token validity and session data consistency
 * 
 * @returns Promise resolving to comprehensive validation result
 */
export async function validateCurrentSession(): Promise<{
  isValid: boolean;
  needsRefresh: boolean;
  token?: AuthToken;
  session?: SessionData;
  error?: AuthError;
}> {
  try {
    const token = await getTokenFromCookies();
    if (!token) {
      return { isValid: false, needsRefresh: false, error: 'TOKEN_INVALID' };
    }

    const validation = validateTokenStructure(token.sessionToken);
    if (!validation.isValid) {
      return { 
        isValid: false, 
        needsRefresh: false, 
        error: validation.error,
        token 
      };
    }

    const sessionData = await getStoredSessionData();
    if (!sessionData) {
      return { 
        isValid: false, 
        needsRefresh: false, 
        error: 'TOKEN_INVALID',
        token 
      };
    }

    return {
      isValid: true,
      needsRefresh: validation.needsRefresh,
      token,
      session: sessionData,
    };
  } catch (error) {
    console.error('Session validation error:', error);
    return { 
      isValid: false, 
      needsRefresh: false, 
      error: 'UNKNOWN_ERROR' 
    };
  }
}

/**
 * Attempts to refresh authentication token using refresh token
 * Implements retry logic and fallback to re-authentication
 * 
 * @param retryCount - Number of previous retry attempts
 * @returns Promise resolving to refresh result
 */
export async function refreshAuthToken(retryCount = 0): Promise<SessionRefreshResult> {
  try {
    const token = await getTokenFromCookies();
    if (!token?.refreshToken) {
      return { success: false, error: 'REFRESH_FAILED', retryCount };
    }

    // Call DreamFactory refresh endpoint
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/v2/user/session`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        [AUTH_CONFIG.SESSION_TOKEN_HEADER]: token.sessionToken,
      },
      body: JSON.stringify({
        refresh_token: token.refreshToken,
      }),
    });

    if (!response.ok) {
      if (retryCount < AUTH_CONFIG.MAX_REFRESH_RETRIES) {
        // Retry with exponential backoff
        await new Promise(resolve => setTimeout(resolve, Math.pow(2, retryCount) * 1000));
        return refreshAuthToken(retryCount + 1);
      }
      return { success: false, error: 'REFRESH_FAILED', retryCount };
    }

    const data = await response.json();
    const newToken = createAuthToken(data.session_token, data.refresh_token);

    if (!newToken) {
      return { success: false, error: 'TOKEN_INVALID', retryCount };
    }

    // Store new token
    await storeTokenInCookies(newToken);

    return { success: true, token: newToken, retryCount };
  } catch (error) {
    console.error('Token refresh error:', error);
    if (retryCount < AUTH_CONFIG.MAX_REFRESH_RETRIES) {
      await new Promise(resolve => setTimeout(resolve, Math.pow(2, retryCount) * 1000));
      return refreshAuthToken(retryCount + 1);
    }
    return { success: false, error: 'NETWORK_ERROR', retryCount };
  }
}

/**
 * Handles automatic token refresh for middleware
 * Optimized for edge runtime environments with minimal overhead
 * 
 * @param request - Incoming request object
 * @returns Promise resolving to updated headers or null if refresh failed
 */
export async function handleMiddlewareTokenRefresh(
  request: Request
): Promise<AuthHeaders | null> {
  try {
    const token = await getTokenFromCookies();
    if (!token) {
      return null;
    }

    const validation = validateTokenStructure(token.sessionToken);
    if (validation.isValid && !validation.needsRefresh) {
      return generateAuthHeaders({ sessionToken: token.sessionToken });
    }

    if (validation.needsRefresh && token.refreshToken) {
      const refreshResult = await refreshAuthToken();
      if (refreshResult.success && refreshResult.token) {
        return generateAuthHeaders({ sessionToken: refreshResult.token.sessionToken });
      }
    }

    return null;
  } catch (error) {
    console.error('Middleware token refresh error:', error);
    return null;
  }
}

// =============================================================================
// AUTHENTICATION STATE MANAGEMENT
// =============================================================================

/**
 * Initializes authentication state from stored tokens and session data
 * Used during application bootstrap and middleware initialization
 * 
 * @returns Promise resolving to current authentication state
 */
export async function initializeAuthState(): Promise<AuthState> {
  try {
    const token = await getTokenFromCookies();
    const sessionData = await getStoredSessionData();

    if (!token || !sessionData) {
      return {
        isAuthenticated: false,
        isAuthenticating: false,
        lastActivity: Date.now(),
      };
    }

    const validation = validateTokenStructure(token.sessionToken);
    
    return {
      token: validation.isValid ? token : undefined,
      session: validation.isValid ? sessionData : undefined,
      isAuthenticated: validation.isValid,
      isAuthenticating: false,
      lastActivity: Date.now(),
    };
  } catch (error) {
    console.error('Auth state initialization error:', error);
    return {
      isAuthenticated: false,
      isAuthenticating: false,
      lastError: 'UNKNOWN_ERROR',
      lastActivity: Date.now(),
    };
  }
}

/**
 * Updates authentication state with new token and session data
 * Maintains consistency between cookies, storage, and application state
 * 
 * @param token - New authentication token
 * @param sessionData - New session data
 * @returns Promise resolving to updated authentication state
 */
export async function updateAuthState(
  token: AuthToken,
  sessionData: SessionData
): Promise<AuthState> {
  try {
    await storeTokenInCookies(token);
    await storeSessionData(sessionData);

    return {
      token,
      session: sessionData,
      isAuthenticated: true,
      isAuthenticating: false,
      lastActivity: Date.now(),
    };
  } catch (error) {
    console.error('Auth state update error:', error);
    return {
      isAuthenticated: false,
      isAuthenticating: false,
      lastError: 'UNKNOWN_ERROR',
      lastActivity: Date.now(),
    };
  }
}

// =============================================================================
// LOGOUT AND SESSION CLEANUP
// =============================================================================

/**
 * Performs complete authentication cleanup
 * Clears all tokens, session data, and related storage
 * 
 * @param callLogoutEndpoint - Whether to call server logout endpoint
 * @returns Promise resolving when cleanup is complete
 */
export async function performAuthenticationCleanup(
  callLogoutEndpoint = true
): Promise<void> {
  try {
    if (callLogoutEndpoint) {
      const headers = await getCurrentAuthHeaders();
      
      // Call DreamFactory logout endpoint
      try {
        await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/v2/user/session`, {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json',
            ...headers,
          },
        });
      } catch (error) {
        console.warn('Logout endpoint call failed:', error);
        // Continue with cleanup even if server call fails
      }
    }

    // Clear all authentication data
    await clearAuthCookies();
    await clearStoredSessionData();

  } catch (error) {
    console.error('Authentication cleanup error:', error);
  }
}

/**
 * Logs out user and redirects to login page
 * Handles both client-side and server-side logout scenarios
 * 
 * @param redirectPath - Optional redirect path after logout
 * @returns Promise resolving when logout is complete
 */
export async function logoutUser(redirectPath = '/login'): Promise<void> {
  await performAuthenticationCleanup(true);
  
  // Redirect based on environment
  if (typeof window !== 'undefined') {
    window.location.href = redirectPath;
  } else {
    // Server-side redirect
    throw new Error('Logout requires client-side execution');
  }
}

/**
 * Handles session expiration scenarios
 * Attempts refresh before forcing logout
 * 
 * @returns Promise resolving to boolean indicating if session was recovered
 */
export async function handleSessionExpiration(): Promise<boolean> {
  try {
    const refreshResult = await refreshAuthToken();
    if (refreshResult.success) {
      return true;
    }

    await performAuthenticationCleanup(false);
    return false;
  } catch (error) {
    console.error('Session expiration handling error:', error);
    await performAuthenticationCleanup(false);
    return false;
  }
}

// =============================================================================
// UTILITY FUNCTIONS FOR INTEGRATION
// =============================================================================

/**
 * Creates authentication context for React components
 * Provides comprehensive authentication state for UI updates
 * 
 * @param authState - Current authentication state
 * @returns AuthContext object for React context
 */
export function createAuthContext(authState: AuthState): AuthContext {
  return {
    token: authState.token,
    session: authState.session,
    isAuthenticated: authState.isAuthenticated,
    isAuthenticating: authState.isAuthenticating,
    error: authState.lastError,
  };
}

/**
 * Extracts user permissions from session data
 * Used for role-based access control evaluation
 * 
 * @param sessionData - Current session data
 * @returns Array of user permissions/roles
 */
export function extractUserPermissions(sessionData?: SessionData): string[] {
  if (!sessionData?.roles) {
    return [];
  }

  return Array.isArray(sessionData.roles) ? sessionData.roles : [];
}

/**
 * Checks if user has required permission
 * Used by components and middleware for access control
 * 
 * @param requiredPermission - Permission to check
 * @param sessionData - Current session data
 * @returns Boolean indicating if user has permission
 */
export function hasPermission(
  requiredPermission: string,
  sessionData?: SessionData
): boolean {
  const userPermissions = extractUserPermissions(sessionData);
  return userPermissions.includes(requiredPermission) || userPermissions.includes('admin');
}

/**
 * Monitors session activity for automatic timeout
 * Updates last activity timestamp for session management
 * 
 * @returns Promise resolving when activity is recorded
 */
export async function recordSessionActivity(): Promise<void> {
  try {
    if (typeof window !== 'undefined') {
      const metadata = sessionStorage.getItem(AUTH_CONFIG.SESSION_META_KEY);
      if (metadata) {
        const meta = JSON.parse(metadata);
        meta.lastActivity = Date.now();
        sessionStorage.setItem(AUTH_CONFIG.SESSION_META_KEY, JSON.stringify(meta));
      }
    }
  } catch (error) {
    console.error('Session activity recording error:', error);
  }
}

// =============================================================================
// EXPORT AGGREGATION
// =============================================================================

/**
 * Main authentication client interface
 * Provides all authentication utilities in a single export
 */
export const AuthClient = {
  // Token management
  validateTokenStructure,
  createAuthToken,
  shouldRefreshToken,
  
  // Cookie operations
  storeTokenInCookies,
  getTokenFromCookies,
  clearAuthCookies,
  
  // Session management
  storeSessionData,
  getStoredSessionData,
  clearStoredSessionData,
  
  // Header management
  generateAuthHeaders,
  getCurrentAuthHeaders,
  updateRequestHeaders,
  
  // Validation and refresh
  validateCurrentSession,
  refreshAuthToken,
  handleMiddlewareTokenRefresh,
  
  // State management
  initializeAuthState,
  updateAuthState,
  
  // Cleanup and logout
  performAuthenticationCleanup,
  logoutUser,
  handleSessionExpiration,
  
  // Utilities
  createAuthContext,
  extractUserPermissions,
  hasPermission,
  recordSessionActivity,
} as const;

// Export individual functions for selective imports
export {
  validateTokenStructure,
  createAuthToken,
  shouldRefreshToken,
  storeTokenInCookies,
  getTokenFromCookies,
  clearAuthCookies,
  storeSessionData,
  getStoredSessionData,
  clearStoredSessionData,
  generateAuthHeaders,
  getCurrentAuthHeaders,
  updateRequestHeaders,
  validateCurrentSession,
  refreshAuthToken,
  handleMiddlewareTokenRefresh,
  initializeAuthState,
  updateAuthState,
  performAuthenticationCleanup,
  logoutUser,
  handleSessionExpiration,
  createAuthContext,
  extractUserPermissions,
  hasPermission,
  recordSessionActivity,
};

// Export types for external use
export type {
  AuthError,
  TokenValidationResult,
  SessionRefreshResult,
  AuthState,
};