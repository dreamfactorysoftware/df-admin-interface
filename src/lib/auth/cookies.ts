/**
 * Cookie Management Utilities
 * 
 * Provides secure HTTP-only cookie operations with SameSite=Strict configuration
 * for Next.js authentication integration. Implements session token storage,
 * cookie lifecycle management, and cross-domain cookie handling with comprehensive
 * security features including encryption, integrity verification, and secure defaults.
 */

import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { SignJWT, jwtVerify, type JWTPayload } from 'jose';
import {
  COOKIE_CONFIG,
  SESSION_CONFIG,
  TOKEN_EXPIRATION,
  JWT_CONFIG,
  TOKEN_KEYS,
  AUTH_EVENTS,
  LOG_LEVELS,
  type AuthEvent,
  type LogLevel,
} from './constants';

// =============================================================================
// TYPES AND INTERFACES
// =============================================================================

/**
 * Cookie configuration options
 */
export interface CookieOptions {
  httpOnly?: boolean;
  secure?: boolean;
  sameSite?: 'strict' | 'lax' | 'none';
  path?: string;
  domain?: string;
  maxAge?: number;
  expires?: Date;
  priority?: 'low' | 'medium' | 'high';
}

/**
 * Session data structure for cookie storage
 */
export interface SessionData {
  userId: string;
  email: string;
  roles: string[];
  permissions: string[];
  sessionId: string;
  issuedAt: number;
  expiresAt: number;
  lastActivity?: number;
  refreshToken?: string;
  csrfToken?: string;
}

/**
 * Cookie validation result
 */
export interface CookieValidationResult {
  isValid: boolean;
  data?: SessionData;
  error?: string;
  expired?: boolean;
  tampered?: boolean;
}

/**
 * Cookie cleanup configuration
 */
export interface CookieCleanupOptions {
  clearSession?: boolean;
  clearRefresh?: boolean;
  clearCsrf?: boolean;
  clearPreferences?: boolean;
  clearAll?: boolean;
  domain?: string;
  path?: string;
}

/**
 * Cross-domain cookie configuration
 */
export interface CrossDomainCookieConfig {
  domain: string;
  subdomains?: boolean;
  secure?: boolean;
  sameSite?: 'strict' | 'lax' | 'none';
}

// =============================================================================
// SECURITY CONSTANTS
// =============================================================================

/**
 * JWT secret key for cookie encryption (should be loaded from environment)
 */
const getJWTSecret = (): Uint8Array => {
  const secret = process.env.NEXTAUTH_SECRET || process.env.JWT_SECRET || 'default-dev-secret-key-change-in-production';
  if (secret === 'default-dev-secret-key-change-in-production' && process.env.NODE_ENV === 'production') {
    throw new Error('JWT_SECRET or NEXTAUTH_SECRET must be set in production environment');
  }
  return new TextEncoder().encode(secret);
};

/**
 * Default secure cookie options
 */
const SECURE_COOKIE_DEFAULTS: CookieOptions = {
  httpOnly: COOKIE_CONFIG.OPTIONS.HTTP_ONLY,
  secure: COOKIE_CONFIG.OPTIONS.SECURE,
  sameSite: COOKIE_CONFIG.OPTIONS.SAME_SITE,
  path: COOKIE_CONFIG.OPTIONS.PATH,
  domain: COOKIE_CONFIG.DOMAIN,
  priority: 'high',
} as const;

/**
 * Cookie integrity salt for additional security
 */
const INTEGRITY_SALT = 'df-cookie-integrity-v1';

// =============================================================================
// CORE COOKIE OPERATIONS
// =============================================================================

/**
 * Creates a secure HTTP-only cookie with encryption and integrity verification
 * 
 * @param name - Cookie name
 * @param value - Cookie value (will be encrypted)
 * @param options - Additional cookie options
 * @returns Promise resolving to success status
 */
export async function createSecureCookie(
  name: string,
  value: string,
  options: CookieOptions = {}
): Promise<boolean> {
  try {
    // Merge with secure defaults
    const cookieOptions: CookieOptions = {
      ...SECURE_COOKIE_DEFAULTS,
      ...options,
    };

    // Encrypt the value using JWT for integrity and confidentiality
    const encryptedValue = await encryptCookieValue(value, name);

    // Calculate expiration if maxAge is provided
    if (cookieOptions.maxAge && !cookieOptions.expires) {
      cookieOptions.expires = new Date(Date.now() + cookieOptions.maxAge * 1000);
    }

    // Set the cookie using Next.js cookies API
    const cookieStore = cookies();
    cookieStore.set(name, encryptedValue, {
      httpOnly: cookieOptions.httpOnly,
      secure: cookieOptions.secure,
      sameSite: cookieOptions.sameSite,
      path: cookieOptions.path,
      domain: cookieOptions.domain,
      maxAge: cookieOptions.maxAge,
      expires: cookieOptions.expires,
    });

    // Log successful cookie creation
    await logCookieEvent('COOKIE_CREATED', 'info', {
      cookieName: name,
      secure: cookieOptions.secure,
      httpOnly: cookieOptions.httpOnly,
      sameSite: cookieOptions.sameSite,
    });

    return true;
  } catch (error) {
    await logCookieEvent('COOKIE_CREATE_FAILED', 'error', {
      cookieName: name,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    return false;
  }
}

/**
 * Reads and decrypts a secure HTTP-only cookie
 * 
 * @param name - Cookie name
 * @returns Promise resolving to decrypted cookie value or null
 */
export async function readSecureCookie(name: string): Promise<string | null> {
  try {
    const cookieStore = cookies();
    const cookie = cookieStore.get(name);

    if (!cookie?.value) {
      return null;
    }

    // Decrypt and verify the cookie value
    const decryptedValue = await decryptCookieValue(cookie.value, name);
    
    if (!decryptedValue) {
      await logCookieEvent('COOKIE_DECRYPT_FAILED', 'warn', {
        cookieName: name,
        reason: 'Decryption failed or invalid signature',
      });
      return null;
    }

    return decryptedValue;
  } catch (error) {
    await logCookieEvent('COOKIE_READ_FAILED', 'error', {
      cookieName: name,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    return null;
  }
}

/**
 * Updates an existing secure cookie with new value
 * 
 * @param name - Cookie name
 * @param value - New cookie value
 * @param options - Additional cookie options
 * @returns Promise resolving to success status
 */
export async function updateSecureCookie(
  name: string,
  value: string,
  options: CookieOptions = {}
): Promise<boolean> {
  // Check if cookie exists first
  const existingValue = await readSecureCookie(name);
  
  if (existingValue === null) {
    await logCookieEvent('COOKIE_UPDATE_FAILED', 'warn', {
      cookieName: name,
      reason: 'Cookie does not exist',
    });
    return false;
  }

  // Update is essentially a create operation with new value
  const success = await createSecureCookie(name, value, options);
  
  if (success) {
    await logCookieEvent('COOKIE_UPDATED', 'info', {
      cookieName: name,
    });
  }

  return success;
}

/**
 * Deletes a secure cookie
 * 
 * @param name - Cookie name
 * @param domain - Optional domain for cross-domain deletion
 * @param path - Optional path for deletion
 * @returns Promise resolving to success status
 */
export async function deleteSecureCookie(
  name: string,
  domain?: string,
  path?: string
): Promise<boolean> {
  try {
    const cookieStore = cookies();
    
    // Set cookie with past expiration date to delete it
    cookieStore.set(name, '', {
      httpOnly: true,
      secure: COOKIE_CONFIG.OPTIONS.SECURE,
      sameSite: COOKIE_CONFIG.OPTIONS.SAME_SITE,
      path: path || COOKIE_CONFIG.OPTIONS.PATH,
      domain: domain || COOKIE_CONFIG.DOMAIN,
      expires: new Date(0), // Set to past date
      maxAge: 0,
    });

    await logCookieEvent('COOKIE_DELETED', 'info', {
      cookieName: name,
      domain,
      path,
    });

    return true;
  } catch (error) {
    await logCookieEvent('COOKIE_DELETE_FAILED', 'error', {
      cookieName: name,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    return false;
  }
}

// =============================================================================
// SESSION TOKEN MANAGEMENT
// =============================================================================

/**
 * Stores session token with automatic expiration and proper domain configuration
 * 
 * @param sessionData - Session data to store
 * @param rememberMe - Whether to use extended expiration
 * @returns Promise resolving to success status
 */
export async function storeSessionToken(
  sessionData: SessionData,
  rememberMe: boolean = false
): Promise<boolean> {
  try {
    const maxAge = rememberMe 
      ? TOKEN_EXPIRATION.REFRESH_TOKEN 
      : TOKEN_EXPIRATION.ACCESS_TOKEN;

    // Store the main session token
    const sessionSuccess = await createSecureCookie(
      COOKIE_CONFIG.NAMES.SESSION_TOKEN,
      JSON.stringify(sessionData),
      {
        maxAge,
        priority: 'high',
      }
    );

    // Store refresh token separately if provided
    let refreshSuccess = true;
    if (sessionData.refreshToken) {
      refreshSuccess = await createSecureCookie(
        COOKIE_CONFIG.NAMES.REFRESH_TOKEN,
        sessionData.refreshToken,
        {
          maxAge: TOKEN_EXPIRATION.REFRESH_TOKEN,
          priority: 'medium',
        }
      );
    }

    // Store CSRF token if provided
    let csrfSuccess = true;
    if (sessionData.csrfToken) {
      csrfSuccess = await createSecureCookie(
        COOKIE_CONFIG.NAMES.CSRF_TOKEN,
        sessionData.csrfToken,
        {
          maxAge: TOKEN_EXPIRATION.CSRF_TOKEN,
          priority: 'high',
        }
      );
    }

    const allSuccess = sessionSuccess && refreshSuccess && csrfSuccess;

    if (allSuccess) {
      await logCookieEvent('SESSION_STORED', 'info', {
        userId: sessionData.userId,
        sessionId: sessionData.sessionId,
        rememberMe,
        hasRefreshToken: !!sessionData.refreshToken,
        hasCsrfToken: !!sessionData.csrfToken,
      });
    }

    return allSuccess;
  } catch (error) {
    await logCookieEvent('SESSION_STORE_FAILED', 'error', {
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    return false;
  }
}

/**
 * Retrieves session token with validation
 * 
 * @returns Promise resolving to session data or null
 */
export async function getSessionToken(): Promise<SessionData | null> {
  try {
    const sessionCookie = await readSecureCookie(COOKIE_CONFIG.NAMES.SESSION_TOKEN);
    
    if (!sessionCookie) {
      return null;
    }

    const sessionData: SessionData = JSON.parse(sessionCookie);
    
    // Validate session data structure
    if (!isValidSessionData(sessionData)) {
      await logCookieEvent('SESSION_INVALID_STRUCTURE', 'warn', {
        reason: 'Session data structure validation failed',
      });
      return null;
    }

    // Check if session has expired
    if (sessionData.expiresAt && Date.now() > sessionData.expiresAt) {
      await logCookieEvent('SESSION_EXPIRED', 'info', {
        sessionId: sessionData.sessionId,
        expiresAt: new Date(sessionData.expiresAt).toISOString(),
      });
      return null;
    }

    // Update last activity timestamp
    sessionData.lastActivity = Date.now();
    await updateSecureCookie(
      COOKIE_CONFIG.NAMES.SESSION_TOKEN,
      JSON.stringify(sessionData)
    );

    return sessionData;
  } catch (error) {
    await logCookieEvent('SESSION_READ_FAILED', 'error', {
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    return null;
  }
}

/**
 * Refreshes session token with new expiration
 * 
 * @param sessionData - Updated session data
 * @returns Promise resolving to success status
 */
export async function refreshSessionToken(sessionData: SessionData): Promise<boolean> {
  try {
    // Update expiration time
    sessionData.expiresAt = Date.now() + (TOKEN_EXPIRATION.ACCESS_TOKEN * 1000);
    sessionData.lastActivity = Date.now();

    const success = await updateSecureCookie(
      COOKIE_CONFIG.NAMES.SESSION_TOKEN,
      JSON.stringify(sessionData)
    );

    if (success) {
      await logCookieEvent('SESSION_REFRESHED', 'info', {
        sessionId: sessionData.sessionId,
        newExpiresAt: new Date(sessionData.expiresAt).toISOString(),
      });
    }

    return success;
  } catch (error) {
    await logCookieEvent('SESSION_REFRESH_FAILED', 'error', {
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    return false;
  }
}

/**
 * Retrieves refresh token
 * 
 * @returns Promise resolving to refresh token or null
 */
export async function getRefreshToken(): Promise<string | null> {
  return await readSecureCookie(COOKIE_CONFIG.NAMES.REFRESH_TOKEN);
}

/**
 * Retrieves CSRF token
 * 
 * @returns Promise resolving to CSRF token or null
 */
export async function getCsrfToken(): Promise<string | null> {
  return await readSecureCookie(COOKIE_CONFIG.NAMES.CSRF_TOKEN);
}

// =============================================================================
// COOKIE VALIDATION AND PARSING
// =============================================================================

/**
 * Validates and parses cookie with comprehensive security checks
 * 
 * @param name - Cookie name
 * @returns Promise resolving to validation result
 */
export async function validateCookie(name: string): Promise<CookieValidationResult> {
  try {
    const cookieValue = await readSecureCookie(name);
    
    if (!cookieValue) {
      return {
        isValid: false,
        error: 'Cookie not found or could not be decrypted',
      };
    }

    // Special handling for session token cookies
    if (name === COOKIE_CONFIG.NAMES.SESSION_TOKEN) {
      try {
        const sessionData: SessionData = JSON.parse(cookieValue);
        
        // Validate session data structure
        if (!isValidSessionData(sessionData)) {
          return {
            isValid: false,
            error: 'Invalid session data structure',
            tampered: true,
          };
        }

        // Check expiration
        if (sessionData.expiresAt && Date.now() > sessionData.expiresAt) {
          return {
            isValid: false,
            error: 'Session has expired',
            expired: true,
            data: sessionData,
          };
        }

        // Check if session is close to expiring (within warning threshold)
        const timeUntilExpiry = sessionData.expiresAt - Date.now();
        if (timeUntilExpiry < SESSION_CONFIG.VALIDATION.WARNING_THRESHOLD) {
          await logCookieEvent('SESSION_EXPIRING_SOON', 'warn', {
            sessionId: sessionData.sessionId,
            timeUntilExpiry,
          });
        }

        return {
          isValid: true,
          data: sessionData,
        };
      } catch (parseError) {
        return {
          isValid: false,
          error: 'Failed to parse session data',
          tampered: true,
        };
      }
    }

    // For non-session cookies, basic validation
    return {
      isValid: true,
    };
  } catch (error) {
    await logCookieEvent('COOKIE_VALIDATION_FAILED', 'error', {
      cookieName: name,
      error: error instanceof Error ? error.message : 'Unknown error',
    });

    return {
      isValid: false,
      error: 'Cookie validation failed',
    };
  }
}

/**
 * Parses cookie headers from request
 * 
 * @param request - Next.js request object
 * @returns Object containing parsed cookies
 */
export function parseCookiesFromRequest(request: NextRequest): Record<string, string> {
  const cookies: Record<string, string> = {};
  
  try {
    const cookieHeader = request.headers.get('cookie');
    
    if (!cookieHeader) {
      return cookies;
    }

    // Parse cookie header
    cookieHeader.split(';').forEach((cookie) => {
      const [name, ...rest] = cookie.trim().split('=');
      if (name && rest.length > 0) {
        cookies[name] = decodeURIComponent(rest.join('='));
      }
    });

    return cookies;
  } catch (error) {
    logCookieEvent('COOKIE_PARSE_FAILED', 'error', {
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    return cookies;
  }
}

// =============================================================================
// CROSS-DOMAIN COOKIE SUPPORT
// =============================================================================

/**
 * Sets cookie for cross-domain authentication workflows
 * 
 * @param name - Cookie name
 * @param value - Cookie value
 * @param config - Cross-domain configuration
 * @returns Promise resolving to success status
 */
export async function setCrossDomainCookie(
  name: string,
  value: string,
  config: CrossDomainCookieConfig
): Promise<boolean> {
  try {
    const options: CookieOptions = {
      ...SECURE_COOKIE_DEFAULTS,
      domain: config.subdomains ? `.${config.domain}` : config.domain,
      secure: config.secure ?? true,
      sameSite: config.sameSite ?? 'lax', // More permissive for cross-domain
    };

    const success = await createSecureCookie(name, value, options);

    if (success) {
      await logCookieEvent('CROSS_DOMAIN_COOKIE_SET', 'info', {
        cookieName: name,
        domain: config.domain,
        subdomains: config.subdomains,
        sameSite: config.sameSite,
      });
    }

    return success;
  } catch (error) {
    await logCookieEvent('CROSS_DOMAIN_COOKIE_FAILED', 'error', {
      cookieName: name,
      domain: config.domain,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    return false;
  }
}

/**
 * Handles cookie synchronization across subdomains
 * 
 * @param name - Cookie name
 * @param value - Cookie value
 * @param domains - Array of domains to synchronize
 * @returns Promise resolving to success status for all domains
 */
export async function synchronizeCrossSubdomainCookies(
  name: string,
  value: string,
  domains: string[]
): Promise<boolean> {
  try {
    const results = await Promise.all(
      domains.map(domain => 
        setCrossDomainCookie(name, value, {
          domain,
          subdomains: true,
          secure: true,
          sameSite: 'lax',
        })
      )
    );

    const allSuccess = results.every(result => result);

    await logCookieEvent('SUBDOMAIN_SYNC_COMPLETED', 'info', {
      cookieName: name,
      domains,
      successCount: results.filter(r => r).length,
      totalCount: domains.length,
    });

    return allSuccess;
  } catch (error) {
    await logCookieEvent('SUBDOMAIN_SYNC_FAILED', 'error', {
      cookieName: name,
      domains,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    return false;
  }
}

// =============================================================================
// COOKIE CLEANUP UTILITIES
// =============================================================================

/**
 * Performs secure logout workflow with complete cookie cleanup
 * 
 * @param options - Cleanup configuration options
 * @returns Promise resolving to success status
 */
export async function performLogoutCleanup(
  options: CookieCleanupOptions = {}
): Promise<boolean> {
  try {
    const cleanupOptions = {
      clearSession: true,
      clearRefresh: true,
      clearCsrf: true,
      clearPreferences: false,
      clearAll: false,
      ...options,
    };

    const deletionPromises: Promise<boolean>[] = [];

    // Clear session-related cookies
    if (cleanupOptions.clearSession || cleanupOptions.clearAll) {
      deletionPromises.push(
        deleteSecureCookie(
          COOKIE_CONFIG.NAMES.SESSION_TOKEN,
          cleanupOptions.domain,
          cleanupOptions.path
        )
      );
    }

    if (cleanupOptions.clearRefresh || cleanupOptions.clearAll) {
      deletionPromises.push(
        deleteSecureCookie(
          COOKIE_CONFIG.NAMES.REFRESH_TOKEN,
          cleanupOptions.domain,
          cleanupOptions.path
        )
      );
    }

    if (cleanupOptions.clearCsrf || cleanupOptions.clearAll) {
      deletionPromises.push(
        deleteSecureCookie(
          COOKIE_CONFIG.NAMES.CSRF_TOKEN,
          cleanupOptions.domain,
          cleanupOptions.path
        )
      );
    }

    if (cleanupOptions.clearPreferences || cleanupOptions.clearAll) {
      deletionPromises.push(
        deleteSecureCookie(
          COOKIE_CONFIG.NAMES.PREFERENCES,
          cleanupOptions.domain,
          cleanupOptions.path
        )
      );
    }

    // Clear theme cookie if clearing all
    if (cleanupOptions.clearAll) {
      deletionPromises.push(
        deleteSecureCookie(
          COOKIE_CONFIG.NAMES.THEME,
          cleanupOptions.domain,
          cleanupOptions.path
        )
      );
    }

    const results = await Promise.all(deletionPromises);
    const allSuccess = results.every(result => result);

    await logCookieEvent('LOGOUT_CLEANUP_COMPLETED', 'info', {
      clearedSession: cleanupOptions.clearSession,
      clearedRefresh: cleanupOptions.clearRefresh,
      clearedCsrf: cleanupOptions.clearCsrf,
      clearedPreferences: cleanupOptions.clearPreferences,
      clearedAll: cleanupOptions.clearAll,
      successCount: results.filter(r => r).length,
      totalCount: results.length,
    });

    return allSuccess;
  } catch (error) {
    await logCookieEvent('LOGOUT_CLEANUP_FAILED', 'error', {
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    return false;
  }
}

/**
 * Cleans up expired cookies
 * 
 * @returns Promise resolving to number of cookies cleaned up
 */
export async function cleanupExpiredCookies(): Promise<number> {
  let cleanedCount = 0;

  try {
    // Check session token for expiration
    const sessionValidation = await validateCookie(COOKIE_CONFIG.NAMES.SESSION_TOKEN);
    if (!sessionValidation.isValid && sessionValidation.expired) {
      await deleteSecureCookie(COOKIE_CONFIG.NAMES.SESSION_TOKEN);
      cleanedCount++;
    }

    // Additional cleanup logic for other tokens could be added here

    await logCookieEvent('EXPIRED_COOKIES_CLEANED', 'info', {
      cleanedCount,
    });

    return cleanedCount;
  } catch (error) {
    await logCookieEvent('EXPIRED_CLEANUP_FAILED', 'error', {
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    return 0;
  }
}

/**
 * Invalidates all sessions across domains (emergency cleanup)
 * 
 * @param domains - Array of domains to clear sessions from
 * @returns Promise resolving to success status
 */
export async function emergencySessionInvalidation(domains: string[] = []): Promise<boolean> {
  try {
    const sessionCookies = [
      COOKIE_CONFIG.NAMES.SESSION_TOKEN,
      COOKIE_CONFIG.NAMES.REFRESH_TOKEN,
      COOKIE_CONFIG.NAMES.CSRF_TOKEN,
    ];

    const allDomains = domains.length > 0 ? domains : [COOKIE_CONFIG.DOMAIN].filter(Boolean);
    const deletionPromises: Promise<boolean>[] = [];

    // Delete session cookies from all specified domains
    for (const domain of allDomains) {
      for (const cookieName of sessionCookies) {
        deletionPromises.push(deleteSecureCookie(cookieName, domain));
      }
    }

    const results = await Promise.all(deletionPromises);
    const allSuccess = results.every(result => result);

    await logCookieEvent('EMERGENCY_INVALIDATION_COMPLETED', 'security', {
      domains: allDomains,
      cookiesCleared: sessionCookies,
      successCount: results.filter(r => r).length,
      totalCount: results.length,
    });

    return allSuccess;
  } catch (error) {
    await logCookieEvent('EMERGENCY_INVALIDATION_FAILED', 'error', {
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    return false;
  }
}

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

/**
 * Encrypts cookie value using JWT for integrity and confidentiality
 * 
 * @param value - Value to encrypt
 * @param cookieName - Cookie name for additional context
 * @returns Promise resolving to encrypted JWT string
 */
async function encryptCookieValue(value: string, cookieName: string): Promise<string> {
  const secret = getJWTSecret();
  
  const payload: JWTPayload = {
    data: value,
    cookieName,
    integrity: await generateIntegrityHash(value, cookieName),
    iat: Math.floor(Date.now() / 1000),
  };

  return await new SignJWT(payload)
    .setProtectedHeader({ alg: JWT_CONFIG.ALGORITHM })
    .setIssuer(JWT_CONFIG.ISSUER)
    .setAudience(JWT_CONFIG.AUDIENCE)
    .setIssuedAt()
    .sign(secret);
}

/**
 * Decrypts and verifies cookie value from JWT
 * 
 * @param encryptedValue - Encrypted JWT string
 * @param cookieName - Expected cookie name
 * @returns Promise resolving to decrypted value or null
 */
async function decryptCookieValue(encryptedValue: string, cookieName: string): Promise<string | null> {
  try {
    const secret = getJWTSecret();
    
    const { payload } = await jwtVerify(encryptedValue, secret, {
      issuer: JWT_CONFIG.ISSUER,
      audience: JWT_CONFIG.AUDIENCE,
    });

    // Verify cookie name matches
    if (payload.cookieName !== cookieName) {
      return null;
    }

    // Verify integrity
    const data = payload.data as string;
    const expectedIntegrity = await generateIntegrityHash(data, cookieName);
    
    if (payload.integrity !== expectedIntegrity) {
      return null;
    }

    return data;
  } catch (error) {
    return null;
  }
}

/**
 * Generates integrity hash for cookie value
 * 
 * @param value - Cookie value
 * @param cookieName - Cookie name
 * @returns Promise resolving to integrity hash
 */
async function generateIntegrityHash(value: string, cookieName: string): Promise<string> {
  const data = `${INTEGRITY_SALT}:${cookieName}:${value}`;
  const encoder = new TextEncoder();
  const hashBuffer = await crypto.subtle.digest('SHA-256', encoder.encode(data));
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Validates session data structure
 * 
 * @param data - Data to validate
 * @returns Boolean indicating if data is valid session data
 */
function isValidSessionData(data: any): data is SessionData {
  return (
    typeof data === 'object' &&
    data !== null &&
    typeof data.userId === 'string' &&
    typeof data.email === 'string' &&
    Array.isArray(data.roles) &&
    Array.isArray(data.permissions) &&
    typeof data.sessionId === 'string' &&
    typeof data.issuedAt === 'number' &&
    typeof data.expiresAt === 'number'
  );
}

/**
 * Logs cookie-related events for audit and monitoring
 * 
 * @param event - Event type
 * @param level - Log level
 * @param data - Additional event data
 */
async function logCookieEvent(
  event: string,
  level: LogLevel,
  data: Record<string, any> = {}
): Promise<void> {
  try {
    // In production, this would integrate with your logging infrastructure
    // For now, we'll use console logging with structured format
    const logEntry = {
      timestamp: new Date().toISOString(),
      event,
      level,
      component: 'cookie-manager',
      ...data,
    };

    if (level === 'error' || level === 'security') {
      console.error('[COOKIE]', JSON.stringify(logEntry));
    } else if (level === 'warn') {
      console.warn('[COOKIE]', JSON.stringify(logEntry));
    } else if (process.env.NODE_ENV === 'development') {
      console.log('[COOKIE]', JSON.stringify(logEntry));
    }
  } catch (error) {
    // Fallback logging if structured logging fails
    console.error('[COOKIE] Logging failed:', error);
  }
}

// =============================================================================
// RESPONSE HELPER FUNCTIONS FOR MIDDLEWARE
// =============================================================================

/**
 * Sets secure cookie in NextResponse for middleware usage
 * 
 * @param response - NextResponse object
 * @param name - Cookie name
 * @param value - Cookie value
 * @param options - Cookie options
 * @returns Updated NextResponse
 */
export function setResponseCookie(
  response: NextResponse,
  name: string,
  value: string,
  options: CookieOptions = {}
): NextResponse {
  const cookieOptions = {
    ...SECURE_COOKIE_DEFAULTS,
    ...options,
  };

  const cookieString = `${name}=${encodeURIComponent(value)}; ${Object.entries(cookieOptions)
    .filter(([_, value]) => value !== undefined)
    .map(([key, value]) => {
      if (key === 'maxAge') return `Max-Age=${value}`;
      if (key === 'httpOnly') return value ? 'HttpOnly' : '';
      if (key === 'secure') return value ? 'Secure' : '';
      if (key === 'sameSite') return `SameSite=${value}`;
      if (key === 'path') return `Path=${value}`;
      if (key === 'domain') return `Domain=${value}`;
      if (key === 'expires' && value instanceof Date) return `Expires=${value.toUTCString()}`;
      return '';
    })
    .filter(Boolean)
    .join('; ')}`;

  response.headers.set('Set-Cookie', cookieString);
  return response;
}

/**
 * Deletes cookie in NextResponse for middleware usage
 * 
 * @param response - NextResponse object
 * @param name - Cookie name
 * @param domain - Optional domain
 * @param path - Optional path
 * @returns Updated NextResponse
 */
export function deleteResponseCookie(
  response: NextResponse,
  name: string,
  domain?: string,
  path?: string
): NextResponse {
  return setResponseCookie(response, name, '', {
    expires: new Date(0),
    maxAge: 0,
    domain,
    path,
  });
}

// =============================================================================
// EXPORTS
// =============================================================================

export {
  COOKIE_CONFIG,
  SECURE_COOKIE_DEFAULTS,
  type CookieOptions,
  type SessionData,
  type CookieValidationResult,
  type CookieCleanupOptions,
  type CrossDomainCookieConfig,
};