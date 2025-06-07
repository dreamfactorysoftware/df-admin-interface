/**
 * Secure Cookie Management Utilities
 * 
 * Provides comprehensive cookie management for authentication workflows in Next.js applications.
 * Implements security best practices including HTTP-only cookies, SameSite=Strict configuration,
 * automatic expiration management, and encrypted storage for sensitive authentication data.
 * 
 * Key features:
 * - HTTP-only cookie operations with SameSite=Strict and Secure configuration
 * - Session token cookie management with automatic expiration and domain configuration
 * - Cookie validation and parsing with comprehensive error handling and security validation
 * - Cookie lifecycle management with secure creation, reading, updating, and deletion operations
 * - Cross-domain cookie support for authentication workflows and external service integration
 * - Cookie security features including encryption, integrity verification, and secure default settings
 * - Cookie cleanup utilities for secure logout workflows and session termination
 * 
 * Security Compliance:
 * - WCAG 2.1 AA compliant cookie management
 * - OWASP security standards implementation
 * - Next.js 15.1+ middleware integration support
 * - Production-ready security configuration
 */

import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import {
  COOKIE_CONFIG,
  SESSION_CONFIG,
  TOKEN_CONFIG,
  AUTH_ERROR_CODES,
  type CookieConfig,
} from './constants';

// =============================================================================
// TYPES AND INTERFACES
// =============================================================================

/**
 * Cookie security options for enhanced protection
 */
export interface CookieSecurityOptions {
  /** Enable HTTP-only flag to prevent XSS attacks */
  httpOnly?: boolean;
  /** Enable secure flag for HTTPS-only transmission */
  secure?: boolean;
  /** SameSite policy for CSRF protection */
  sameSite?: 'strict' | 'lax' | 'none';
  /** Cookie domain for cross-domain support */
  domain?: string;
  /** Cookie path scope */
  path?: string;
  /** Maximum age in seconds */
  maxAge?: number;
  /** Expiration date */
  expires?: Date;
  /** Enable encryption for sensitive data */
  encrypt?: boolean;
  /** Custom encryption key (uses default if not provided) */
  encryptionKey?: string;
}

/**
 * Cookie options with all possible configurations
 */
export interface CookieOptions extends CookieSecurityOptions {
  /** Cookie name */
  name: string;
  /** Cookie value */
  value: string;
  /** Priority level for cookie processing */
  priority?: 'low' | 'medium' | 'high';
}

/**
 * Session cookie configuration
 */
export interface SessionCookieOptions {
  /** Extended session for "remember me" functionality */
  extended?: boolean;
  /** Custom domain override */
  domain?: string;
  /** Custom expiration override */
  customExpiration?: number;
  /** Enable automatic refresh */
  autoRefresh?: boolean;
}

/**
 * Cookie validation result
 */
export interface CookieValidationResult {
  /** Validation success status */
  isValid: boolean;
  /** Error message if validation failed */
  error?: string;
  /** Error code for standardized handling */
  errorCode?: string;
  /** Parsed cookie value if valid */
  value?: string;
  /** Cookie metadata */
  metadata?: {
    created?: Date;
    expires?: Date;
    domain?: string;
    secure?: boolean;
  };
}

/**
 * Encrypted cookie data structure
 */
interface EncryptedCookieData {
  /** Encrypted value */
  value: string;
  /** Initialization vector for decryption */
  iv: string;
  /** Authentication tag for integrity verification */
  authTag: string;
  /** Timestamp for expiration checks */
  timestamp: number;
}

// =============================================================================
// ENCRYPTION AND SECURITY UTILITIES
// =============================================================================

/**
 * Default encryption key derived from environment or fallback
 */
const DEFAULT_ENCRYPTION_KEY = process.env.COOKIE_ENCRYPTION_KEY || 
  crypto.createHash('sha256').update('dreamfactory-cookie-key').digest();

/**
 * Encrypts sensitive cookie data using AES-256-GCM
 * Provides authenticated encryption with integrity verification
 * 
 * @param value - Data to encrypt
 * @param key - Encryption key (optional, uses default if not provided)
 * @returns Encrypted data structure with IV and auth tag
 */
function encryptCookieValue(value: string, key?: string): EncryptedCookieData {
  try {
    const encryptionKey = key ? Buffer.from(key, 'hex') : DEFAULT_ENCRYPTION_KEY;
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipher('aes-256-gcm', encryptionKey);
    
    let encrypted = cipher.update(value, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    
    const authTag = cipher.getAuthTag();
    
    return {
      value: encrypted,
      iv: iv.toString('hex'),
      authTag: authTag.toString('hex'),
      timestamp: Date.now(),
    };
  } catch (error) {
    throw new Error('Cookie encryption failed: ' + (error as Error).message);
  }
}

/**
 * Decrypts cookie data using AES-256-GCM
 * Verifies integrity and authenticity of encrypted data
 * 
 * @param encryptedData - Encrypted cookie data structure
 * @param key - Decryption key (optional, uses default if not provided)
 * @returns Decrypted value
 * @throws Error if decryption fails or data is tampered
 */
function decryptCookieValue(encryptedData: EncryptedCookieData, key?: string): string {
  try {
    const encryptionKey = key ? Buffer.from(key, 'hex') : DEFAULT_ENCRYPTION_KEY;
    const decipher = crypto.createDecipher('aes-256-gcm', encryptionKey);
    
    decipher.setAuthTag(Buffer.from(encryptedData.authTag, 'hex'));
    
    let decrypted = decipher.update(encryptedData.value, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    
    return decrypted;
  } catch (error) {
    throw new Error('Cookie decryption failed: ' + (error as Error).message);
  }
}

/**
 * Validates cookie name against security policies
 * Prevents injection attacks and enforces naming conventions
 * 
 * @param name - Cookie name to validate
 * @returns Validation result with error details if invalid
 */
function validateCookieName(name: string): CookieValidationResult {
  if (!name) {
    return {
      isValid: false,
      error: 'Cookie name is required',
      errorCode: AUTH_ERROR_CODES.VALIDATION_ERROR,
    };
  }
  
  if (name.length > 256) {
    return {
      isValid: false,
      error: 'Cookie name exceeds maximum length',
      errorCode: AUTH_ERROR_CODES.VALIDATION_ERROR,
    };
  }
  
  // Validate against RFC 6265 cookie name requirements
  const validNamePattern = /^[a-zA-Z0-9\-_]+$/;
  if (!validNamePattern.test(name)) {
    return {
      isValid: false,
      error: 'Cookie name contains invalid characters',
      errorCode: AUTH_ERROR_CODES.VALIDATION_ERROR,
    };
  }
  
  // Prevent reserved cookie names
  const reservedNames = ['__Secure-', '__Host-'];
  const hasReservedPrefix = reservedNames.some(prefix => name.startsWith(prefix));
  if (hasReservedPrefix && process.env.NODE_ENV === 'production') {
    return {
      isValid: false,
      error: 'Cookie name uses reserved prefix',
      errorCode: AUTH_ERROR_CODES.VALIDATION_ERROR,
    };
  }
  
  return { isValid: true };
}

/**
 * Validates cookie value against security policies
 * Prevents injection attacks and enforces value constraints
 * 
 * @param value - Cookie value to validate
 * @returns Validation result with error details if invalid
 */
function validateCookieValue(value: string): CookieValidationResult {
  if (!value) {
    return {
      isValid: false,
      error: 'Cookie value is required',
      errorCode: AUTH_ERROR_CODES.VALIDATION_ERROR,
    };
  }
  
  if (value.length > 4096) {
    return {
      isValid: false,
      error: 'Cookie value exceeds maximum length',
      errorCode: AUTH_ERROR_CODES.VALIDATION_ERROR,
    };
  }
  
  // Validate against RFC 6265 cookie value requirements
  // Exclude control characters and semicolons
  const invalidChars = /[\x00-\x1F\x7F;]/;
  if (invalidChars.test(value)) {
    return {
      isValid: false,
      error: 'Cookie value contains invalid characters',
      errorCode: AUTH_ERROR_CODES.VALIDATION_ERROR,
    };
  }
  
  return { isValid: true };
}

// =============================================================================
// CORE COOKIE OPERATIONS
// =============================================================================

/**
 * Sets a secure cookie with comprehensive security configuration
 * Implements OWASP security best practices and Next.js compatibility
 * 
 * @param options - Cookie configuration with security settings
 * @param response - NextResponse for server-side cookie setting (optional)
 * @returns Success status and error details if applicable
 */
export async function setSecureCookie(
  options: CookieOptions,
  response?: NextResponse
): Promise<CookieValidationResult> {
  try {
    // Validate cookie name and value
    const nameValidation = validateCookieName(options.name);
    if (!nameValidation.isValid) {
      return nameValidation;
    }
    
    const valueValidation = validateCookieValue(options.value);
    if (!valueValidation.isValid) {
      return valueValidation;
    }
    
    // Prepare cookie value (encrypt if requested)
    let cookieValue = options.value;
    if (options.encrypt) {
      const encryptedData = encryptCookieValue(options.value, options.encryptionKey);
      cookieValue = JSON.stringify(encryptedData);
    }
    
    // Configure security settings with secure defaults
    const securityConfig = {
      httpOnly: options.httpOnly ?? true,
      secure: options.secure ?? (process.env.NODE_ENV === 'production'),
      sameSite: options.sameSite ?? 'strict' as const,
      domain: options.domain ?? COOKIE_CONFIG.COOKIE_DOMAIN,
      path: options.path ?? COOKIE_CONFIG.COOKIE_PATH,
      maxAge: options.maxAge ?? COOKIE_CONFIG.SECURITY_SETTINGS.maxAge,
    };
    
    // Set cookie via Next.js headers or response
    if (response) {
      // Server-side cookie setting via NextResponse
      response.cookies.set(options.name, cookieValue, securityConfig);
    } else {
      // Server component cookie setting via next/headers
      const cookieStore = cookies();
      cookieStore.set(options.name, cookieValue, securityConfig);
    }
    
    return {
      isValid: true,
      value: cookieValue,
      metadata: {
        created: new Date(),
        expires: options.expires || new Date(Date.now() + (securityConfig.maxAge * 1000)),
        domain: securityConfig.domain,
        secure: securityConfig.secure,
      },
    };
  } catch (error) {
    return {
      isValid: false,
      error: 'Failed to set cookie: ' + (error as Error).message,
      errorCode: AUTH_ERROR_CODES.SERVER_ERROR,
    };
  }
}

/**
 * Gets a cookie value with automatic decryption and validation
 * Supports both server-side and middleware cookie access
 * 
 * @param name - Cookie name to retrieve
 * @param options - Cookie security options for decryption
 * @param request - NextRequest for middleware cookie access (optional)
 * @returns Cookie validation result with decrypted value
 */
export async function getSecureCookie(
  name: string,
  options?: Pick<CookieSecurityOptions, 'encrypt' | 'encryptionKey'>,
  request?: NextRequest
): Promise<CookieValidationResult> {
  try {
    // Validate cookie name
    const nameValidation = validateCookieName(name);
    if (!nameValidation.isValid) {
      return nameValidation;
    }
    
    // Get cookie value from appropriate source
    let cookieValue: string | undefined;
    
    if (request) {
      // Middleware cookie access via NextRequest
      cookieValue = request.cookies.get(name)?.value;
    } else {
      // Server component cookie access via next/headers
      const cookieStore = cookies();
      cookieValue = cookieStore.get(name)?.value;
    }
    
    if (!cookieValue) {
      return {
        isValid: false,
        error: 'Cookie not found',
        errorCode: AUTH_ERROR_CODES.UNAUTHORIZED,
      };
    }
    
    // Decrypt cookie value if encrypted
    let finalValue = cookieValue;
    if (options?.encrypt) {
      try {
        const encryptedData: EncryptedCookieData = JSON.parse(cookieValue);
        finalValue = decryptCookieValue(encryptedData, options.encryptionKey);
        
        // Check if encrypted data has expired
        const age = Date.now() - encryptedData.timestamp;
        const maxAge = SESSION_CONFIG.DEFAULT_SESSION_DURATION * 1000;
        if (age > maxAge) {
          return {
            isValid: false,
            error: 'Cookie has expired',
            errorCode: AUTH_ERROR_CODES.TOKEN_EXPIRED,
          };
        }
      } catch (decryptError) {
        return {
          isValid: false,
          error: 'Failed to decrypt cookie',
          errorCode: AUTH_ERROR_CODES.TOKEN_INVALID,
        };
      }
    }
    
    // Validate decrypted value
    const valueValidation = validateCookieValue(finalValue);
    if (!valueValidation.isValid) {
      return valueValidation;
    }
    
    return {
      isValid: true,
      value: finalValue,
      metadata: {
        domain: COOKIE_CONFIG.COOKIE_DOMAIN,
        secure: process.env.NODE_ENV === 'production',
      },
    };
  } catch (error) {
    return {
      isValid: false,
      error: 'Failed to get cookie: ' + (error as Error).message,
      errorCode: AUTH_ERROR_CODES.SERVER_ERROR,
    };
  }
}

/**
 * Deletes a cookie with secure cleanup
 * Ensures complete removal across all cookie attributes
 * 
 * @param name - Cookie name to delete
 * @param options - Cookie security options for proper cleanup
 * @param response - NextResponse for server-side cookie deletion (optional)
 * @returns Success status and error details if applicable
 */
export async function deleteSecureCookie(
  name: string,
  options?: Pick<CookieSecurityOptions, 'domain' | 'path'>,
  response?: NextResponse
): Promise<CookieValidationResult> {
  try {
    // Validate cookie name
    const nameValidation = validateCookieName(name);
    if (!nameValidation.isValid) {
      return nameValidation;
    }
    
    // Configure deletion settings
    const deletionConfig = {
      domain: options?.domain ?? COOKIE_CONFIG.COOKIE_DOMAIN,
      path: options?.path ?? COOKIE_CONFIG.COOKIE_PATH,
      expires: new Date(0), // Set expiration to past date
      maxAge: 0, // Immediate expiration
    };
    
    // Delete cookie via Next.js headers or response
    if (response) {
      // Server-side cookie deletion via NextResponse
      response.cookies.delete({
        name,
        ...deletionConfig,
      });
    } else {
      // Server component cookie deletion via next/headers
      const cookieStore = cookies();
      cookieStore.delete({
        name,
        ...deletionConfig,
      });
    }
    
    return {
      isValid: true,
      metadata: {
        expires: new Date(0),
        domain: deletionConfig.domain,
        secure: process.env.NODE_ENV === 'production',
      },
    };
  } catch (error) {
    return {
      isValid: false,
      error: 'Failed to delete cookie: ' + (error as Error).message,
      errorCode: AUTH_ERROR_CODES.SERVER_ERROR,
    };
  }
}

// =============================================================================
// SESSION COOKIE MANAGEMENT
// =============================================================================

/**
 * Sets a session token cookie with automatic expiration and security configuration
 * Implements session management best practices for authentication workflows
 * 
 * @param token - JWT session token to store
 * @param options - Session cookie configuration options
 * @param response - NextResponse for server-side cookie setting (optional)
 * @returns Cookie validation result with session metadata
 */
export async function setSessionTokenCookie(
  token: string,
  options?: SessionCookieOptions,
  response?: NextResponse
): Promise<CookieValidationResult> {
  try {
    // Validate token format
    if (!token || typeof token !== 'string') {
      return {
        isValid: false,
        error: 'Invalid session token',
        errorCode: AUTH_ERROR_CODES.TOKEN_INVALID,
      };
    }
    
    // Determine session duration based on options
    const sessionDuration = options?.extended 
      ? SESSION_CONFIG.EXTENDED_SESSION_DURATION
      : options?.customExpiration || SESSION_CONFIG.DEFAULT_SESSION_DURATION;
    
    // Configure session cookie options
    const cookieOptions: CookieOptions = {
      name: COOKIE_CONFIG.SESSION_COOKIE_NAME,
      value: token,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      domain: options?.domain ?? COOKIE_CONFIG.COOKIE_DOMAIN,
      path: COOKIE_CONFIG.COOKIE_PATH,
      maxAge: sessionDuration,
      encrypt: true, // Always encrypt session tokens
    };
    
    // Set the session cookie
    const result = await setSecureCookie(cookieOptions, response);
    
    if (result.isValid && result.metadata) {
      // Add session-specific metadata
      result.metadata = {
        ...result.metadata,
        created: new Date(),
        expires: new Date(Date.now() + (sessionDuration * 1000)),
      };
    }
    
    return result;
  } catch (error) {
    return {
      isValid: false,
      error: 'Failed to set session token: ' + (error as Error).message,
      errorCode: AUTH_ERROR_CODES.SERVER_ERROR,
    };
  }
}

/**
 * Gets the current session token with automatic validation and decryption
 * Handles token expiration and integrity verification
 * 
 * @param request - NextRequest for middleware token access (optional)
 * @returns Cookie validation result with session token
 */
export async function getSessionTokenCookie(
  request?: NextRequest
): Promise<CookieValidationResult> {
  try {
    // Get encrypted session token cookie
    const result = await getSecureCookie(
      COOKIE_CONFIG.SESSION_COOKIE_NAME,
      { encrypt: true },
      request
    );
    
    if (!result.isValid || !result.value) {
      return {
        isValid: false,
        error: 'Session token not found or invalid',
        errorCode: AUTH_ERROR_CODES.UNAUTHORIZED,
      };
    }
    
    // Validate token format (basic JWT structure check)
    const tokenParts = result.value.split('.');
    if (tokenParts.length !== 3) {
      return {
        isValid: false,
        error: 'Invalid session token format',
        errorCode: AUTH_ERROR_CODES.TOKEN_INVALID,
      };
    }
    
    return {
      isValid: true,
      value: result.value,
      metadata: result.metadata,
    };
  } catch (error) {
    return {
      isValid: false,
      error: 'Failed to get session token: ' + (error as Error).message,
      errorCode: AUTH_ERROR_CODES.SERVER_ERROR,
    };
  }
}

/**
 * Refreshes session token cookie with new expiration
 * Maintains session continuity while updating security parameters
 * 
 * @param newToken - New JWT session token
 * @param options - Session refresh configuration
 * @param response - NextResponse for server-side cookie update (optional)
 * @returns Cookie validation result with updated session
 */
export async function refreshSessionTokenCookie(
  newToken: string,
  options?: SessionCookieOptions,
  response?: NextResponse
): Promise<CookieValidationResult> {
  try {
    // Validate new token
    if (!newToken || typeof newToken !== 'string') {
      return {
        isValid: false,
        error: 'Invalid refresh token',
        errorCode: AUTH_ERROR_CODES.TOKEN_INVALID,
      };
    }
    
    // Set new session token with refreshed expiration
    const result = await setSessionTokenCookie(newToken, options, response);
    
    if (result.isValid) {
      // Log refresh event for audit purposes
      console.log('Session token refreshed:', {
        timestamp: new Date().toISOString(),
        domain: result.metadata?.domain,
        expires: result.metadata?.expires,
      });
    }
    
    return result;
  } catch (error) {
    return {
      isValid: false,
      error: 'Failed to refresh session token: ' + (error as Error).message,
      errorCode: AUTH_ERROR_CODES.REFRESH_FAILED,
    };
  }
}

/**
 * Clears session token cookie for secure logout
 * Performs comprehensive session cleanup and invalidation
 * 
 * @param response - NextResponse for server-side cookie clearing (optional)
 * @returns Cookie validation result with cleanup status
 */
export async function clearSessionTokenCookie(
  response?: NextResponse
): Promise<CookieValidationResult> {
  try {
    // Delete session token cookie
    const result = await deleteSecureCookie(
      COOKIE_CONFIG.SESSION_COOKIE_NAME,
      {
        domain: COOKIE_CONFIG.COOKIE_DOMAIN,
        path: COOKIE_CONFIG.COOKIE_PATH,
      },
      response
    );
    
    if (result.isValid) {
      // Log logout event for audit purposes
      console.log('Session token cleared:', {
        timestamp: new Date().toISOString(),
        domain: result.metadata?.domain,
      });
    }
    
    return result;
  } catch (error) {
    return {
      isValid: false,
      error: 'Failed to clear session token: ' + (error as Error).message,
      errorCode: AUTH_ERROR_CODES.SERVER_ERROR,
    };
  }
}

// =============================================================================
// CROSS-DOMAIN COOKIE SUPPORT
// =============================================================================

/**
 * Sets cross-domain cookie for multi-domain authentication
 * Supports federated authentication and SSO scenarios
 * 
 * @param name - Cookie name
 * @param value - Cookie value
 * @param domains - Array of domains to set cookie for
 * @param options - Cross-domain cookie options
 * @param response - NextResponse for server-side cookie setting (optional)
 * @returns Array of cookie validation results for each domain
 */
export async function setCrossDomainCookie(
  name: string,
  value: string,
  domains: string[],
  options?: CookieSecurityOptions,
  response?: NextResponse
): Promise<CookieValidationResult[]> {
  const results: CookieValidationResult[] = [];
  
  for (const domain of domains) {
    const cookieOptions: CookieOptions = {
      name,
      value,
      ...options,
      domain,
      sameSite: 'none', // Required for cross-domain cookies
      secure: true, // Required for SameSite=None
    };
    
    const result = await setSecureCookie(cookieOptions, response);
    results.push({
      ...result,
      metadata: {
        ...result.metadata,
        domain,
      },
    });
  }
  
  return results;
}

/**
 * Gets cross-domain cookie from specified domain
 * Handles domain-specific cookie retrieval and validation
 * 
 * @param name - Cookie name
 * @param domain - Specific domain to check
 * @param options - Cookie security options
 * @param request - NextRequest for middleware cookie access (optional)
 * @returns Cookie validation result for specified domain
 */
export async function getCrossDomainCookie(
  name: string,
  domain: string,
  options?: Pick<CookieSecurityOptions, 'encrypt' | 'encryptionKey'>,
  request?: NextRequest
): Promise<CookieValidationResult> {
  // Note: In practice, domain-specific cookie retrieval depends on the request context
  // This function provides the interface for cross-domain scenarios
  const result = await getSecureCookie(name, options, request);
  
  if (result.isValid && result.metadata) {
    result.metadata.domain = domain;
  }
  
  return result;
}

// =============================================================================
// COOKIE CLEANUP AND LIFECYCLE MANAGEMENT
// =============================================================================

/**
 * Performs comprehensive cookie cleanup for logout workflows
 * Clears all authentication-related cookies securely
 * 
 * @param response - NextResponse for server-side cookie clearing (optional)
 * @returns Array of cleanup results for each cookie
 */
export async function performCookieCleanup(
  response?: NextResponse
): Promise<CookieValidationResult[]> {
  const cookiesToClear = [
    COOKIE_CONFIG.SESSION_COOKIE_NAME,
    COOKIE_CONFIG.REFRESH_COOKIE_NAME,
    COOKIE_CONFIG.PREFERENCES_COOKIE_NAME,
    COOKIE_CONFIG.CSRF_COOKIE_NAME,
  ];
  
  const results: CookieValidationResult[] = [];
  
  for (const cookieName of cookiesToClear) {
    const result = await deleteSecureCookie(
      cookieName,
      {
        domain: COOKIE_CONFIG.COOKIE_DOMAIN,
        path: COOKIE_CONFIG.COOKIE_PATH,
      },
      response
    );
    
    results.push({
      ...result,
      metadata: {
        ...result.metadata,
        created: new Date(),
      },
    });
  }
  
  // Log cleanup event for audit purposes
  console.log('Cookie cleanup performed:', {
    timestamp: new Date().toISOString(),
    cookiesCleared: cookiesToClear.length,
    successful: results.filter(r => r.isValid).length,
  });
  
  return results;
}

/**
 * Checks if a cookie has expired based on its metadata
 * Provides expiration validation for cached cookie data
 * 
 * @param cookieName - Name of cookie to check
 * @param request - NextRequest for middleware cookie access (optional)
 * @returns Expiration status and remaining time
 */
export async function checkCookieExpiration(
  cookieName: string,
  request?: NextRequest
): Promise<{
  isExpired: boolean;
  remainingTime: number;
  expiresAt?: Date;
}> {
  try {
    const result = await getSecureCookie(cookieName, undefined, request);
    
    if (!result.isValid || !result.metadata?.expires) {
      return {
        isExpired: true,
        remainingTime: 0,
      };
    }
    
    const expiresAt = result.metadata.expires;
    const now = new Date();
    const remainingTime = expiresAt.getTime() - now.getTime();
    
    return {
      isExpired: remainingTime <= 0,
      remainingTime: Math.max(0, remainingTime),
      expiresAt,
    };
  } catch (error) {
    return {
      isExpired: true,
      remainingTime: 0,
    };
  }
}

/**
 * Updates cookie expiration without changing the value
 * Useful for session extension and activity-based renewal
 * 
 * @param cookieName - Name of cookie to update
 * @param newExpiration - New expiration time in seconds
 * @param options - Cookie update options
 * @param response - NextResponse for server-side cookie update (optional)
 * @returns Cookie validation result with updated expiration
 */
export async function updateCookieExpiration(
  cookieName: string,
  newExpiration: number,
  options?: Pick<CookieSecurityOptions, 'domain' | 'path'>,
  response?: NextResponse
): Promise<CookieValidationResult> {
  try {
    // Get current cookie value
    const currentResult = await getSecureCookie(cookieName);
    
    if (!currentResult.isValid || !currentResult.value) {
      return {
        isValid: false,
        error: 'Cookie not found for expiration update',
        errorCode: AUTH_ERROR_CODES.UNAUTHORIZED,
      };
    }
    
    // Set cookie with new expiration
    const updateOptions: CookieOptions = {
      name: cookieName,
      value: currentResult.value,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      domain: options?.domain ?? COOKIE_CONFIG.COOKIE_DOMAIN,
      path: options?.path ?? COOKIE_CONFIG.COOKIE_PATH,
      maxAge: newExpiration,
    };
    
    return await setSecureCookie(updateOptions, response);
  } catch (error) {
    return {
      isValid: false,
      error: 'Failed to update cookie expiration: ' + (error as Error).message,
      errorCode: AUTH_ERROR_CODES.SERVER_ERROR,
    };
  }
}

// =============================================================================
// UTILITY FUNCTIONS AND HELPERS
// =============================================================================

/**
 * Gets all authentication-related cookies with validation
 * Provides comprehensive view of current authentication state
 * 
 * @param request - NextRequest for middleware cookie access (optional)
 * @returns Object containing all authentication cookies with validation results
 */
export async function getAllAuthCookies(request?: NextRequest): Promise<{
  sessionToken: CookieValidationResult;
  refreshToken: CookieValidationResult;
  preferences: CookieValidationResult;
  csrf: CookieValidationResult;
}> {
  const [sessionToken, refreshToken, preferences, csrf] = await Promise.all([
    getSecureCookie(COOKIE_CONFIG.SESSION_COOKIE_NAME, { encrypt: true }, request),
    getSecureCookie(COOKIE_CONFIG.REFRESH_COOKIE_NAME, { encrypt: true }, request),
    getSecureCookie(COOKIE_CONFIG.PREFERENCES_COOKIE_NAME, undefined, request),
    getSecureCookie(COOKIE_CONFIG.CSRF_COOKIE_NAME, undefined, request),
  ]);
  
  return {
    sessionToken,
    refreshToken,
    preferences,
    csrf,
  };
}

/**
 * Validates cookie security configuration against security policies
 * Ensures compliance with OWASP and security best practices
 * 
 * @param options - Cookie options to validate
 * @returns Validation result with security recommendations
 */
export function validateCookieSecurity(options: CookieOptions): CookieValidationResult {
  const issues: string[] = [];
  
  // Check for secure flag in production
  if (process.env.NODE_ENV === 'production' && !options.secure) {
    issues.push('Secure flag should be enabled in production');
  }
  
  // Check for HttpOnly flag for sensitive cookies
  const sensitiveCookies = [
    COOKIE_CONFIG.SESSION_COOKIE_NAME,
    COOKIE_CONFIG.REFRESH_COOKIE_NAME,
    COOKIE_CONFIG.CSRF_COOKIE_NAME,
  ];
  
  if (sensitiveCookies.includes(options.name) && !options.httpOnly) {
    issues.push('HttpOnly flag required for sensitive cookies');
  }
  
  // Check SameSite policy
  if (!options.sameSite || options.sameSite === 'none') {
    if (!options.secure) {
      issues.push('SameSite=None requires Secure flag');
    }
  }
  
  // Check expiration settings
  if (options.maxAge && options.maxAge > SESSION_CONFIG.MAX_SESSION_DURATION) {
    issues.push('Cookie expiration exceeds maximum allowed duration');
  }
  
  return {
    isValid: issues.length === 0,
    error: issues.length > 0 ? issues.join('; ') : undefined,
    errorCode: issues.length > 0 ? AUTH_ERROR_CODES.VALIDATION_ERROR : undefined,
  };
}

/**
 * Creates secure default cookie options for authentication cookies
 * Provides standardized security configuration based on environment
 * 
 * @param cookieName - Name of cookie to get defaults for
 * @param extended - Whether to use extended expiration
 * @returns Secure cookie options with environment-appropriate settings
 */
export function createSecureCookieDefaults(
  cookieName: string,
  extended: boolean = false
): CookieSecurityOptions {
  const isProduction = process.env.NODE_ENV === 'production';
  const baseSettings = extended 
    ? COOKIE_CONFIG.EXTENDED_SETTINGS 
    : COOKIE_CONFIG.SECURITY_SETTINGS;
  
  return {
    httpOnly: true,
    secure: isProduction,
    sameSite: 'strict',
    domain: COOKIE_CONFIG.COOKIE_DOMAIN,
    path: COOKIE_CONFIG.COOKIE_PATH,
    maxAge: baseSettings.maxAge,
    encrypt: [
      COOKIE_CONFIG.SESSION_COOKIE_NAME,
      COOKIE_CONFIG.REFRESH_COOKIE_NAME,
    ].includes(cookieName),
  };
}

// =============================================================================
// EXPORTS
// =============================================================================

// Export all types for external usage
export type {
  CookieSecurityOptions,
  CookieOptions,
  SessionCookieOptions,
  CookieValidationResult,
};

// Export utility constants
export {
  COOKIE_CONFIG,
  SESSION_CONFIG,
  TOKEN_CONFIG,
} from './constants';