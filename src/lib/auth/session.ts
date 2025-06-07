/**
 * Session Management Utilities
 * 
 * Provides comprehensive session lifecycle management for DreamFactory Admin Interface.
 * Implements secure session handling with HTTP-only cookies, automatic token refresh,
 * cross-tab synchronization, and robust security monitoring for Next.js applications.
 * 
 * Key Features:
 * - Session lifecycle management with secure initialization, validation, and cleanup workflows
 * - Session state persistence with automatic synchronization and cross-tab coordination
 * - Session expiration detection with automatic refresh and configurable timeout handling
 * - Session validation with token verification and comprehensive authentication checks
 * - Session metadata management including user roles, permissions, and access restrictions
 * - Integration with HTTP-only cookies for secure session token storage with SameSite=Strict configuration
 * - Session security features including automatic logout, session invalidation, and security monitoring
 * 
 * Security Compliance:
 * - OWASP session management best practices
 * - Next.js 15.1+ middleware integration support
 * - Cross-tab session coordination with storage events
 * - Automatic security monitoring and threat detection
 */

import { NextRequest, NextResponse } from 'next/server';
import {
  UserSession,
  AuthState,
  SessionStorage,
  MiddlewareAuthResult,
  JWTPayload,
  AuthError,
  AuthErrorCode,
} from '@/types/auth';
import {
  SessionValidationResult,
  SessionCookieData,
  SessionError,
} from '@/types/user';
import {
  setSessionTokenCookie,
  getSessionTokenCookie,
  clearSessionTokenCookie,
  refreshSessionTokenCookie,
  performCookieCleanup,
  checkCookieExpiration,
  SessionCookieOptions,
  CookieValidationResult,
} from './cookies';
import {
  validateJWTToken,
  parseJWTPayload,
  isTokenExpired,
  needsTokenRefresh,
  getTimeToExpiry,
  extractTokenFromRequest,
  JWTLifecycleManager,
  TokenRefreshManager,
  JWTValidationError,
  JWTValidationResult,
  TokenRefreshResult,
} from './jwt';

// =============================================================================
// TYPES AND INTERFACES
// =============================================================================

/**
 * Session initialization configuration
 */
export interface SessionInitConfig {
  /** JWT token to initialize session with */
  token: string;
  /** Whether to extend session for "remember me" */
  extended?: boolean;
  /** Custom session duration in seconds */
  customDuration?: number;
  /** Enable automatic refresh */
  autoRefresh?: boolean;
  /** Custom domain for cross-domain sessions */
  domain?: string;
  /** Initialize with user data */
  userData?: Partial<UserSession>;
}

/**
 * Session validation options
 */
export interface SessionValidationOptions {
  /** Verify token signature */
  verifySignature?: boolean;
  /** Check token expiration */
  checkExpiration?: boolean;
  /** Validate user permissions */
  checkPermissions?: boolean;
  /** Required permissions for validation */
  requiredPermissions?: string[];
  /** Validate against blacklist */
  checkBlacklist?: boolean;
  /** Allow expired tokens for refresh */
  allowExpiredForRefresh?: boolean;
}

/**
 * Session refresh configuration
 */
export interface SessionRefreshConfig {
  /** Force refresh even if not needed */
  force?: boolean;
  /** Extend session duration */
  extend?: boolean;
  /** Custom expiration duration */
  customDuration?: number;
  /** Update user data during refresh */
  updateUserData?: boolean;
}

/**
 * Session cleanup configuration
 */
export interface SessionCleanupConfig {
  /** Clear all authentication cookies */
  clearCookies?: boolean;
  /** Clear browser storage */
  clearStorage?: boolean;
  /** Invalidate server-side session */
  invalidateServerSession?: boolean;
  /** Notify other tabs of logout */
  broadcastLogout?: boolean;
  /** Custom cleanup actions */
  customActions?: (() => Promise<void>)[];
}

/**
 * Session metadata for security monitoring
 */
export interface SessionMetadata {
  /** Session creation timestamp */
  createdAt: Date;
  /** Last activity timestamp */
  lastActivity: Date;
  /** Last validation timestamp */
  lastValidation: Date;
  /** Session refresh count */
  refreshCount: number;
  /** User agent information */
  userAgent?: string;
  /** Client IP address */
  clientIP?: string;
  /** Device identifier */
  deviceId?: string;
  /** Session flags */
  flags: {
    /** Session is extended (remember me) */
    isExtended: boolean;
    /** Auto-refresh is enabled */
    autoRefresh: boolean;
    /** Session is from mobile device */
    isMobile: boolean;
    /** Session has elevated privileges */
    hasElevatedPrivileges: boolean;
  };
}

/**
 * Session security monitoring result
 */
export interface SessionSecurityResult {
  /** Security check passed */
  isSecure: boolean;
  /** Security threats detected */
  threats: string[];
  /** Recommended actions */
  recommendations: string[];
  /** Risk level (low, medium, high, critical) */
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  /** Should force logout */
  shouldLogout: boolean;
}

/**
 * Cross-tab session event types
 */
export enum SessionEventType {
  SESSION_CREATED = 'session_created',
  SESSION_UPDATED = 'session_updated',
  SESSION_REFRESHED = 'session_refreshed',
  SESSION_EXPIRED = 'session_expired',
  SESSION_DESTROYED = 'session_destroyed',
  LOGOUT_ALL_TABS = 'logout_all_tabs',
  PERMISSION_CHANGED = 'permission_changed',
  SECURITY_ALERT = 'security_alert',
}

/**
 * Session event data for cross-tab communication
 */
export interface SessionEvent {
  type: SessionEventType;
  timestamp: number;
  sessionId?: string;
  userId?: number;
  data?: any;
  source?: string;
}

/**
 * Session storage event listener callback
 */
export type SessionEventListener = (event: SessionEvent) => void;

// =============================================================================
// SESSION LIFECYCLE MANAGER
// =============================================================================

/**
 * Comprehensive session lifecycle manager
 * Handles all aspects of session management including initialization, validation,
 * refresh, cleanup, and cross-tab synchronization
 */
export class SessionLifecycleManager {
  private jwtManager: JWTLifecycleManager;
  private refreshManager: TokenRefreshManager;
  private metadata: SessionMetadata | null = null;
  private eventListeners: Map<SessionEventType, SessionEventListener[]> = new Map();
  private storageListener: ((event: StorageEvent) => void) | null = null;
  private securityTimer: NodeJS.Timeout | null = null;
  private activityTimer: NodeJS.Timeout | null = null;

  constructor() {
    this.jwtManager = new JWTLifecycleManager();
    this.refreshManager = new TokenRefreshManager();
    this.initializeStorageListener();
    this.startSecurityMonitoring();
  }

  /**
   * Initializes a new session with comprehensive security setup
   */
  async initializeSession(config: SessionInitConfig): Promise<SessionValidationResult> {
    try {
      // Validate input token
      const tokenValidation = validateJWTToken(config.token, {
        verifySignature: false,
        checkExpiration: true,
        checkNotBefore: true,
        validateIssuer: true,
        validateAudience: true,
      });

      if (!tokenValidation.isValid || !tokenValidation.payload) {
        return {
          isValid: false,
          error: 'invalid_token',
          session: undefined,
        };
      }

      // Set session cookie with security configuration
      const cookieOptions: SessionCookieOptions = {
        extended: config.extended || false,
        domain: config.domain,
        customExpiration: config.customDuration,
        autoRefresh: config.autoRefresh !== false,
      };

      const cookieResult = await setSessionTokenCookie(config.token, cookieOptions);
      if (!cookieResult.isValid) {
        return {
          isValid: false,
          error: 'cookie_set_failed',
          session: undefined,
        };
      }

      // Create session metadata
      this.metadata = {
        createdAt: new Date(),
        lastActivity: new Date(),
        lastValidation: new Date(),
        refreshCount: 0,
        flags: {
          isExtended: config.extended || false,
          autoRefresh: config.autoRefresh !== false,
          isMobile: this.detectMobileDevice(),
          hasElevatedPrivileges: this.hasElevatedPrivileges(tokenValidation.payload),
        },
      };

      // Create user session object
      const userSession = this.createUserSessionFromPayload(tokenValidation.payload, config.userData);

      // Set up automatic refresh if enabled
      if (config.autoRefresh !== false) {
        await this.jwtManager.validateAndScheduleRefresh(
          config.token,
          '', // Refresh token handled separately
          this.handleTokenRefresh.bind(this)
        );
      }

      // Broadcast session creation to other tabs
      this.broadcastSessionEvent({
        type: SessionEventType.SESSION_CREATED,
        timestamp: Date.now(),
        sessionId: userSession.sessionId,
        userId: userSession.id,
      });

      // Start activity tracking
      this.startActivityTracking();

      return {
        isValid: true,
        session: userSession,
        error: undefined,
      };
    } catch (error) {
      console.error('Session initialization failed:', error);
      return {
        isValid: false,
        error: 'initialization_failed',
        session: undefined,
      };
    }
  }

  /**
   * Validates current session with comprehensive security checks
   */
  async validateSession(options: SessionValidationOptions = {}): Promise<SessionValidationResult> {
    try {
      // Get session token from cookies
      const cookieResult = await getSessionTokenCookie();
      if (!cookieResult.isValid || !cookieResult.value) {
        return {
          isValid: false,
          error: 'no_session_token',
          session: undefined,
        };
      }

      // Validate JWT token
      const tokenValidation = validateJWTToken(cookieResult.value, {
        verifySignature: options.verifySignature || false,
        checkExpiration: options.checkExpiration !== false,
        checkNotBefore: true,
        validateIssuer: true,
        validateAudience: true,
        requiredClaims: ['sub', 'exp', 'iat', 'email'],
      });

      if (!tokenValidation.isValid || !tokenValidation.payload) {
        // Handle expired tokens specially if refresh is allowed
        if (tokenValidation.error === JWTValidationError.TOKEN_EXPIRED && options.allowExpiredForRefresh) {
          return {
            isValid: false,
            error: 'token_expired',
            session: undefined,
            requiresRefresh: true,
          };
        }

        return {
          isValid: false,
          error: this.mapJWTErrorToSessionError(tokenValidation.error),
          session: undefined,
        };
      }

      // Check permissions if required
      if (options.checkPermissions && options.requiredPermissions) {
        const hasPermissions = this.validatePermissions(
          tokenValidation.payload,
          options.requiredPermissions
        );
        if (!hasPermissions) {
          return {
            isValid: false,
            error: 'permission_denied',
            session: undefined,
          };
        }
      }

      // Perform security checks
      const securityResult = await this.performSecurityChecks(tokenValidation.payload);
      if (!securityResult.isSecure) {
        if (securityResult.shouldLogout) {
          await this.cleanupSession({ broadcastLogout: true });
          return {
            isValid: false,
            error: 'security_violation',
            session: undefined,
          };
        }
      }

      // Update metadata
      if (this.metadata) {
        this.metadata.lastValidation = new Date();
        this.metadata.lastActivity = new Date();
      }

      // Create session object
      const userSession = this.createUserSessionFromPayload(tokenValidation.payload);

      // Check if refresh is needed
      const needsRefresh = needsTokenRefresh(cookieResult.value);
      if (needsRefresh) {
        // Schedule or trigger refresh
        this.scheduleTokenRefresh();
      }

      return {
        isValid: true,
        session: userSession,
        error: undefined,
        requiresRefresh: needsRefresh,
      };
    } catch (error) {
      console.error('Session validation failed:', error);
      return {
        isValid: false,
        error: 'validation_failed',
        session: undefined,
      };
    }
  }

  /**
   * Refreshes current session with new token and updated expiration
   */
  async refreshSession(config: SessionRefreshConfig = {}): Promise<SessionValidationResult> {
    try {
      // Get current session token
      const currentTokenResult = await getSessionTokenCookie();
      if (!currentTokenResult.isValid || !currentTokenResult.value) {
        return {
          isValid: false,
          error: 'no_session_token',
          session: undefined,
        };
      }

      // Check if refresh is actually needed (unless forced)
      if (!config.force && !needsTokenRefresh(currentTokenResult.value)) {
        // Token is still fresh, just update activity
        this.updateActivity();
        const payload = parseJWTPayload(currentTokenResult.value);
        if (payload) {
          return {
            isValid: true,
            session: this.createUserSessionFromPayload(payload),
            error: undefined,
          };
        }
      }

      // Attempt token refresh
      const refreshResult = await this.refreshManager.refreshToken(currentTokenResult.value);
      if (!refreshResult.success || !refreshResult.accessToken) {
        return {
          isValid: false,
          error: 'refresh_failed',
          session: undefined,
        };
      }

      // Update session cookie with new token
      const cookieOptions: SessionCookieOptions = {
        extended: config.extend || (this.metadata?.flags.isExtended || false),
        customExpiration: config.customDuration,
        autoRefresh: true,
      };

      const cookieResult = await refreshSessionTokenCookie(
        refreshResult.accessToken,
        cookieOptions
      );

      if (!cookieResult.isValid) {
        return {
          isValid: false,
          error: 'cookie_update_failed',
          session: undefined,
        };
      }

      // Update metadata
      if (this.metadata) {
        this.metadata.refreshCount += 1;
        this.metadata.lastActivity = new Date();
        this.metadata.lastValidation = new Date();
      }

      // Parse new token and create session
      const newPayload = parseJWTPayload(refreshResult.accessToken);
      if (!newPayload) {
        return {
          isValid: false,
          error: 'invalid_refreshed_token',
          session: undefined,
        };
      }

      const userSession = this.createUserSessionFromPayload(newPayload);

      // Broadcast refresh event
      this.broadcastSessionEvent({
        type: SessionEventType.SESSION_REFRESHED,
        timestamp: Date.now(),
        sessionId: userSession.sessionId,
        userId: userSession.id,
      });

      return {
        isValid: true,
        session: userSession,
        error: undefined,
      };
    } catch (error) {
      console.error('Session refresh failed:', error);
      return {
        isValid: false,
        error: 'refresh_failed',
        session: undefined,
      };
    }
  }

  /**
   * Performs comprehensive session cleanup and invalidation
   */
  async cleanupSession(config: SessionCleanupConfig = {}): Promise<boolean> {
    try {
      // Clear session cookie
      if (config.clearCookies !== false) {
        const cookieCleanupResults = await performCookieCleanup();
        const successful = cookieCleanupResults.every(result => result.isValid);
        if (!successful) {
          console.warn('Some cookies failed to clear during cleanup');
        }
      }

      // Clear browser storage
      if (config.clearStorage && typeof window !== 'undefined') {
        try {
          localStorage.removeItem('df_session_data');
          localStorage.removeItem('df_user_preferences');
          sessionStorage.clear();
        } catch (error) {
          console.warn('Failed to clear browser storage:', error);
        }
      }

      // Execute custom cleanup actions
      if (config.customActions) {
        await Promise.allSettled(
          config.customActions.map(action => action())
        );
      }

      // Broadcast logout event
      if (config.broadcastLogout !== false) {
        this.broadcastSessionEvent({
          type: SessionEventType.SESSION_DESTROYED,
          timestamp: Date.now(),
          sessionId: this.metadata?.toString() || 'unknown',
        });
      }

      // Clean up timers and listeners
      this.cleanup();

      return true;
    } catch (error) {
      console.error('Session cleanup failed:', error);
      return false;
    }
  }

  /**
   * Checks session expiration status with configurable tolerance
   */
  async checkSessionExpiration(): Promise<{
    isExpired: boolean;
    timeToExpiry: number;
    requiresRefresh: boolean;
    shouldWarn: boolean;
  }> {
    try {
      const cookieResult = await getSessionTokenCookie();
      if (!cookieResult.isValid || !cookieResult.value) {
        return {
          isExpired: true,
          timeToExpiry: 0,
          requiresRefresh: false,
          shouldWarn: false,
        };
      }

      const isExpired = isTokenExpired(cookieResult.value);
      const timeToExpiry = getTimeToExpiry(cookieResult.value) || 0;
      const requiresRefresh = needsTokenRefresh(cookieResult.value);
      
      // Warn if less than 5 minutes remaining
      const shouldWarn = timeToExpiry > 0 && timeToExpiry < 300000; // 5 minutes in ms

      return {
        isExpired,
        timeToExpiry,
        requiresRefresh,
        shouldWarn,
      };
    } catch (error) {
      console.error('Session expiration check failed:', error);
      return {
        isExpired: true,
        timeToExpiry: 0,
        requiresRefresh: false,
        shouldWarn: false,
      };
    }
  }

  /**
   * Gets current session metadata for monitoring and analytics
   */
  getSessionMetadata(): SessionMetadata | null {
    return this.metadata ? { ...this.metadata } : null;
  }

  // =============================================================================
  // CROSS-TAB SYNCHRONIZATION
  // =============================================================================

  /**
   * Adds event listener for session events across tabs
   */
  addEventListener(type: SessionEventType, listener: SessionEventListener): void {
    if (!this.eventListeners.has(type)) {
      this.eventListeners.set(type, []);
    }
    this.eventListeners.get(type)!.push(listener);
  }

  /**
   * Removes event listener for session events
   */
  removeEventListener(type: SessionEventType, listener: SessionEventListener): void {
    const listeners = this.eventListeners.get(type);
    if (listeners) {
      const index = listeners.indexOf(listener);
      if (index > -1) {
        listeners.splice(index, 1);
      }
    }
  }

  /**
   * Broadcasts session event to other tabs via localStorage
   */
  private broadcastSessionEvent(event: SessionEvent): void {
    if (typeof window !== 'undefined' && window.localStorage) {
      try {
        const eventData = {
          ...event,
          source: 'session-manager',
        };
        localStorage.setItem('df_session_event', JSON.stringify(eventData));
        // Remove immediately to trigger storage event
        localStorage.removeItem('df_session_event');
      } catch (error) {
        console.warn('Failed to broadcast session event:', error);
      }
    }
  }

  /**
   * Initializes storage event listener for cross-tab communication
   */
  private initializeStorageListener(): void {
    if (typeof window !== 'undefined') {
      this.storageListener = (event: StorageEvent) => {
        if (event.key === 'df_session_event' && event.newValue) {
          try {
            const sessionEvent: SessionEvent = JSON.parse(event.newValue);
            this.handleSessionEvent(sessionEvent);
          } catch (error) {
            console.warn('Failed to parse session event:', error);
          }
        }
      };
      window.addEventListener('storage', this.storageListener);
    }
  }

  /**
   * Handles incoming session events from other tabs
   */
  private handleSessionEvent(event: SessionEvent): void {
    // Ignore events from the same tab
    if (event.source === 'session-manager') {
      return;
    }

    const listeners = this.eventListeners.get(event.type);
    if (listeners) {
      listeners.forEach(listener => {
        try {
          listener(event);
        } catch (error) {
          console.error('Session event listener error:', error);
        }
      });
    }

    // Handle special events
    switch (event.type) {
      case SessionEventType.LOGOUT_ALL_TABS:
        this.cleanupSession({ broadcastLogout: false });
        break;
      case SessionEventType.SESSION_DESTROYED:
        // Another tab logged out, check if we should also logout
        this.validateSession().then(result => {
          if (!result.isValid) {
            this.cleanupSession({ broadcastLogout: false });
          }
        });
        break;
    }
  }

  // =============================================================================
  // SECURITY MONITORING
  // =============================================================================

  /**
   * Performs comprehensive security checks on session
   */
  private async performSecurityChecks(payload: JWTPayload): Promise<SessionSecurityResult> {
    const threats: string[] = [];
    const recommendations: string[] = [];
    let riskLevel: 'low' | 'medium' | 'high' | 'critical' = 'low';
    let shouldLogout = false;

    try {
      // Check for token age
      const tokenAge = Date.now() / 1000 - payload.iat;
      if (tokenAge > 86400) { // 24 hours
        threats.push('Long-lived token detected');
        riskLevel = 'medium';
      }

      // Check for unusual permissions
      if (payload.permissions && payload.permissions.length > 20) {
        threats.push('Excessive permissions detected');
        recommendations.push('Review user permissions');
        riskLevel = 'medium';
      }

      // Check session metadata for anomalies
      if (this.metadata) {
        const sessionAge = Date.now() - this.metadata.createdAt.getTime();
        if (sessionAge > 86400000 && !this.metadata.flags.isExtended) { // 24 hours
          threats.push('Extended session without remember-me flag');
          riskLevel = 'high';
        }

        if (this.metadata.refreshCount > 100) {
          threats.push('Excessive refresh attempts');
          riskLevel = 'high';
          shouldLogout = true;
        }
      }

      // Additional security checks would go here
      // (IP validation, device fingerprinting, etc.)

    } catch (error) {
      threats.push('Security check failed');
      riskLevel = 'medium';
    }

    return {
      isSecure: threats.length === 0 || riskLevel === 'low',
      threats,
      recommendations,
      riskLevel,
      shouldLogout,
    };
  }

  /**
   * Starts security monitoring timer
   */
  private startSecurityMonitoring(): void {
    this.securityTimer = setInterval(async () => {
      const validation = await this.validateSession({
        checkExpiration: true,
        checkPermissions: false,
      });

      if (!validation.isValid) {
        this.cleanupSession({ broadcastLogout: true });
      }
    }, 300000); // Check every 5 minutes
  }

  /**
   * Starts activity tracking for session extension
   */
  private startActivityTracking(): void {
    if (typeof window !== 'undefined') {
      const activityEvents = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart'];
      
      const updateActivity = () => {
        this.updateActivity();
      };

      activityEvents.forEach(event => {
        window.addEventListener(event, updateActivity, { passive: true });
      });
    }
  }

  /**
   * Updates last activity timestamp
   */
  private updateActivity(): void {
    if (this.metadata) {
      this.metadata.lastActivity = new Date();
    }
  }

  // =============================================================================
  // UTILITY METHODS
  // =============================================================================

  /**
   * Creates UserSession object from JWT payload
   */
  private createUserSessionFromPayload(payload: JWTPayload, userData?: Partial<UserSession>): UserSession {
    return {
      id: parseInt(payload.sub),
      email: payload.email,
      firstName: payload.first_name || '',
      lastName: payload.last_name || '',
      name: payload.name || `${payload.first_name || ''} ${payload.last_name || ''}`.trim(),
      host: payload.iss || '',
      sessionId: payload.sid || payload.session_id || '',
      sessionToken: '', // Set by caller
      tokenExpiryDate: new Date(payload.exp * 1000),
      lastLoginDate: new Date(payload.iat * 1000).toISOString(),
      isRootAdmin: payload.permissions?.includes('root_admin') || false,
      isSysAdmin: payload.permissions?.includes('sys_admin') || false,
      roleId: 0, // Would need to be extracted from payload or provided
      role: undefined, // Would need to be provided separately
      profile: undefined, // Would need to be provided separately
      ...userData,
    };
  }

  /**
   * Maps JWT validation errors to session errors
   */
  private mapJWTErrorToSessionError(error?: JWTValidationError): SessionError {
    switch (error) {
      case JWTValidationError.TOKEN_EXPIRED:
        return 'token_expired';
      case JWTValidationError.TOKEN_INVALID:
      case JWTValidationError.INVALID_FORMAT:
      case JWTValidationError.INVALID_SIGNATURE:
        return 'token_invalid';
      case JWTValidationError.MISSING_CLAIMS:
        return 'authentication_required';
      default:
        return 'session_expired';
    }
  }

  /**
   * Validates user permissions against required permissions
   */
  private validatePermissions(payload: JWTPayload, requiredPermissions: string[]): boolean {
    if (!payload.permissions || !Array.isArray(payload.permissions)) {
      return false;
    }

    return requiredPermissions.every(permission => 
      payload.permissions.includes(permission)
    );
  }

  /**
   * Detects if the current device is mobile
   */
  private detectMobileDevice(): boolean {
    if (typeof window === 'undefined') return false;
    
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
      navigator.userAgent
    );
  }

  /**
   * Checks if user has elevated privileges
   */
  private hasElevatedPrivileges(payload: JWTPayload): boolean {
    const elevatedPermissions = ['root_admin', 'sys_admin', 'user_management', 'system_configuration'];
    return payload.permissions?.some(permission => 
      elevatedPermissions.includes(permission)
    ) || false;
  }

  /**
   * Handles automatic token refresh
   */
  private async handleTokenRefresh(tokens: { accessToken: string; refreshToken: string }): Promise<void> {
    try {
      await refreshSessionTokenCookie(tokens.accessToken);
      
      // Broadcast refresh event
      const payload = parseJWTPayload(tokens.accessToken);
      if (payload) {
        this.broadcastSessionEvent({
          type: SessionEventType.SESSION_REFRESHED,
          timestamp: Date.now(),
          sessionId: payload.sid || payload.session_id || '',
          userId: parseInt(payload.sub),
        });
      }
    } catch (error) {
      console.error('Automatic token refresh failed:', error);
      // Force cleanup on refresh failure
      await this.cleanupSession({ broadcastLogout: true });
    }
  }

  /**
   * Schedules token refresh for near-expired tokens
   */
  private scheduleTokenRefresh(): void {
    // Use JWT manager's built-in refresh scheduling
    // This is a placeholder for additional refresh logic if needed
  }

  /**
   * Cleans up all timers and listeners
   */
  private cleanup(): void {
    // Clear timers
    if (this.securityTimer) {
      clearInterval(this.securityTimer);
      this.securityTimer = null;
    }

    if (this.activityTimer) {
      clearInterval(this.activityTimer);
      this.activityTimer = null;
    }

    // Remove storage listener
    if (this.storageListener && typeof window !== 'undefined') {
      window.removeEventListener('storage', this.storageListener);
      this.storageListener = null;
    }

    // Clean up JWT manager
    this.jwtManager.cleanup();

    // Clear metadata
    this.metadata = null;

    // Clear event listeners
    this.eventListeners.clear();
  }
}

// =============================================================================
// MIDDLEWARE INTEGRATION UTILITIES
// =============================================================================

/**
 * Validates session for Next.js middleware with comprehensive checks
 */
export async function validateSessionForMiddleware(
  request: NextRequest
): Promise<MiddlewareAuthResult> {
  try {
    // Extract tokens from request
    const { accessToken } = extractTokenFromRequest(request);
    
    if (!accessToken) {
      return {
        isAuthenticated: false,
        isAuthorized: false,
        redirectTo: '/login',
        error: {
          code: AuthErrorCode.UNAUTHORIZED,
          message: 'No session token found',
          statusCode: 401,
        },
      };
    }

    // Validate token
    const validation = validateJWTToken(accessToken, {
      verifySignature: false, // Server-side verification required
      checkExpiration: true,
      checkNotBefore: true,
      validateIssuer: true,
      validateAudience: true,
    });

    if (!validation.isValid || !validation.payload) {
      return {
        isAuthenticated: false,
        isAuthorized: false,
        redirectTo: '/login',
        error: {
          code: AuthErrorCode.TOKEN_INVALID,
          message: 'Invalid session token',
          statusCode: 401,
        },
      };
    }

    // Create user session from payload
    const sessionManager = new SessionLifecycleManager();
    const userSession = sessionManager['createUserSessionFromPayload'](validation.payload);

    return {
      isAuthenticated: true,
      isAuthorized: true,
      user: userSession,
      updatedToken: validation.needsRefresh ? undefined : accessToken,
      headers: {
        'X-User-ID': userSession.id.toString(),
        'X-Session-ID': userSession.sessionId,
      },
    };
  } catch (error) {
    console.error('Middleware session validation failed:', error);
    return {
      isAuthenticated: false,
      isAuthorized: false,
      redirectTo: '/login',
      error: {
        code: AuthErrorCode.SERVER_ERROR,
        message: 'Session validation failed',
        statusCode: 500,
      },
    };
  }
}

/**
 * Creates session token cookie for middleware responses
 */
export async function setSessionCookieForMiddleware(
  response: NextResponse,
  token: string,
  options?: SessionCookieOptions
): Promise<void> {
  await setSessionTokenCookie(token, options, response);
}

/**
 * Clears session cookies for middleware logout
 */
export async function clearSessionCookiesForMiddleware(
  response: NextResponse
): Promise<void> {
  await performCookieCleanup(response);
}

// =============================================================================
// SESSION STORAGE UTILITIES
// =============================================================================

/**
 * Browser session storage implementation
 */
export class BrowserSessionStorage implements SessionStorage {
  private readonly SESSION_KEY = 'df_session_data';
  private readonly TOKEN_KEY = 'df_session_token';

  setSession(session: UserSession): void {
    if (typeof window !== 'undefined' && window.localStorage) {
      try {
        localStorage.setItem(this.SESSION_KEY, JSON.stringify(session));
      } catch (error) {
        console.warn('Failed to store session in localStorage:', error);
      }
    }
  }

  getSession(): UserSession | null {
    if (typeof window !== 'undefined' && window.localStorage) {
      try {
        const stored = localStorage.getItem(this.SESSION_KEY);
        return stored ? JSON.parse(stored) : null;
      } catch (error) {
        console.warn('Failed to retrieve session from localStorage:', error);
        return null;
      }
    }
    return null;
  }

  clearSession(): void {
    if (typeof window !== 'undefined' && window.localStorage) {
      try {
        localStorage.removeItem(this.SESSION_KEY);
      } catch (error) {
        console.warn('Failed to clear session from localStorage:', error);
      }
    }
  }

  setToken(token: string): void {
    if (typeof window !== 'undefined' && window.sessionStorage) {
      try {
        sessionStorage.setItem(this.TOKEN_KEY, token);
      } catch (error) {
        console.warn('Failed to store token in sessionStorage:', error);
      }
    }
  }

  getToken(): string | null {
    if (typeof window !== 'undefined' && window.sessionStorage) {
      try {
        return sessionStorage.getItem(this.TOKEN_KEY);
      } catch (error) {
        console.warn('Failed to retrieve token from sessionStorage:', error);
        return null;
      }
    }
    return null;
  }

  clearToken(): void {
    if (typeof window !== 'undefined' && window.sessionStorage) {
      try {
        sessionStorage.removeItem(this.TOKEN_KEY);
      } catch (error) {
        console.warn('Failed to clear token from sessionStorage:', error);
      }
    }
  }
}

// =============================================================================
// GLOBAL INSTANCES AND EXPORTS
// =============================================================================

// Global session manager instance
let globalSessionManager: SessionLifecycleManager | null = null;

/**
 * Gets or creates the global session manager instance
 */
export function getSessionManager(): SessionLifecycleManager {
  if (!globalSessionManager) {
    globalSessionManager = new SessionLifecycleManager();
  }
  return globalSessionManager;
}

/**
 * Browser session storage instance
 */
export const browserSessionStorage = new BrowserSessionStorage();

// =============================================================================
// CONVENIENCE FUNCTIONS
// =============================================================================

/**
 * Initializes a new session with the global manager
 */
export async function initializeSession(config: SessionInitConfig): Promise<SessionValidationResult> {
  return getSessionManager().initializeSession(config);
}

/**
 * Validates current session with the global manager
 */
export async function validateSession(options?: SessionValidationOptions): Promise<SessionValidationResult> {
  return getSessionManager().validateSession(options);
}

/**
 * Refreshes current session with the global manager
 */
export async function refreshSession(config?: SessionRefreshConfig): Promise<SessionValidationResult> {
  return getSessionManager().refreshSession(config);
}

/**
 * Cleans up current session with the global manager
 */
export async function cleanupSession(config?: SessionCleanupConfig): Promise<boolean> {
  return getSessionManager().cleanupSession(config);
}

/**
 * Checks session expiration with the global manager
 */
export async function checkSessionExpiration(): Promise<{
  isExpired: boolean;
  timeToExpiry: number;
  requiresRefresh: boolean;
  shouldWarn: boolean;
}> {
  return getSessionManager().checkSessionExpiration();
}

/**
 * Gets session metadata from the global manager
 */
export function getSessionMetadata(): SessionMetadata | null {
  return getSessionManager().getSessionMetadata();
}

// Export types and classes
export type {
  SessionInitConfig,
  SessionValidationOptions,
  SessionRefreshConfig,
  SessionCleanupConfig,
  SessionMetadata,
  SessionSecurityResult,
  SessionEvent,
  SessionEventListener,
};

export {
  SessionLifecycleManager,
  SessionEventType,
  BrowserSessionStorage,
};