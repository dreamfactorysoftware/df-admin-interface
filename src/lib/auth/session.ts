/**
 * Session Management Utilities
 * 
 * Provides secure session lifecycle management, state persistence, and session validation
 * for Next.js authentication flows. Implements HTTP-only cookie integration, session 
 * expiration handling, and automatic session refresh capabilities with comprehensive
 * security features and cross-tab synchronization.
 */

import { 
  storeSessionToken, 
  getSessionToken, 
  refreshSessionToken, 
  getRefreshToken,
  getCsrfToken,
  performLogoutCleanup,
  cleanupExpiredCookies,
  emergencySessionInvalidation,
  type SessionData,
  type CookieValidationResult,
  type CookieCleanupOptions,
} from './cookies';
import {
  SESSION_CONFIG,
  TOKEN_EXPIRATION,
  AUTH_STATES,
  AUTH_EVENTS,
  VALIDATION_MESSAGES,
  RBAC_PERMISSIONS,
  AUDIT_EVENTS,
  LOG_LEVELS,
  type AuthState,
  type AuthEvent,
  type RBACPermission,
  type AuditEvent,
  type LogLevel,
} from './constants';

// =============================================================================
// TYPES AND INTERFACES
// =============================================================================

/**
 * User authentication data structure
 */
export interface UserSession {
  userId: string;
  email: string;
  firstName?: string;
  lastName?: string;
  displayName?: string;
  roles: string[];
  permissions: RBACPermission[];
  sessionId: string;
  sessionToken: string;
  refreshToken?: string;
  csrfToken?: string;
  issuedAt: number;
  expiresAt: number;
  lastActivity: number;
  isRootAdmin: boolean;
  isSysAdmin: boolean;
  roleId?: string;
  accessibleTabs?: string[];
  preferences?: Record<string, any>;
}

/**
 * Session initialization options
 */
export interface SessionInitOptions {
  rememberMe?: boolean;
  skipValidation?: boolean;
  autoRefresh?: boolean;
  backgroundSync?: boolean;
  crossTabSync?: boolean;
}

/**
 * Session validation result
 */
export interface SessionValidationResult {
  isValid: boolean;
  session?: UserSession | null;
  state: AuthState;
  error?: string;
  needsRefresh?: boolean;
  expired?: boolean;
  tampered?: boolean;
  timeUntilExpiry?: number;
}

/**
 * Session refresh result
 */
export interface SessionRefreshResult {
  success: boolean;
  session?: UserSession;
  error?: string;
  newToken?: string;
  needsReauth?: boolean;
}

/**
 * Session event data
 */
export interface SessionEventData {
  sessionId?: string;
  userId?: string;
  event: AuthEvent;
  timestamp: number;
  metadata?: Record<string, any>;
}

/**
 * Session state change listener
 */
export type SessionStateChangeListener = (state: AuthState, session?: UserSession) => void;

/**
 * Session activity data
 */
export interface SessionActivity {
  lastActivity: number;
  idleTime: number;
  isIdle: boolean;
  warningShown: boolean;
}

/**
 * Cross-tab session synchronization data
 */
export interface CrossTabSyncData {
  sessionId: string;
  action: 'login' | 'logout' | 'refresh' | 'update' | 'invalidate';
  timestamp: number;
  data?: any;
}

// =============================================================================
// SESSION STATE MANAGEMENT
// =============================================================================

/**
 * Session manager class providing comprehensive session lifecycle management
 */
export class SessionManager {
  private static instance: SessionManager;
  private currentSession: UserSession | null = null;
  private sessionState: AuthState = AUTH_STATES.UNAUTHENTICATED;
  private refreshTimer: NodeJS.Timeout | null = null;
  private validationTimer: NodeJS.Timeout | null = null;
  private activityTimer: NodeJS.Timeout | null = null;
  private stateListeners: Set<SessionStateChangeListener> = new Set();
  private isInitialized = false;
  private sessionActivity: SessionActivity = {
    lastActivity: Date.now(),
    idleTime: 0,
    isIdle: false,
    warningShown: false,
  };

  private constructor() {
    this.setupActivityMonitoring();
    this.setupCrossTabSync();
  }

  /**
   * Get singleton instance of SessionManager
   */
  public static getInstance(): SessionManager {
    if (!SessionManager.instance) {
      SessionManager.instance = new SessionManager();
    }
    return SessionManager.instance;
  }

  /**
   * Initialize session management with optional configuration
   */
  public async initialize(options: SessionInitOptions = {}): Promise<SessionValidationResult> {
    try {
      const {
        skipValidation = false,
        autoRefresh = true,
        backgroundSync = true,
        crossTabSync = true,
      } = options;

      this.logSessionEvent('SESSION_INIT_STARTED', 'info', { options });

      // Clean up any expired cookies first
      await cleanupExpiredCookies();

      // Validate existing session if not skipping validation
      if (!skipValidation) {
        const validationResult = await this.validateCurrentSession();
        
        if (validationResult.isValid && validationResult.session) {
          await this.setSession(validationResult.session, { 
            skipStore: true, 
            autoRefresh,
            backgroundSync,
          });
        } else if (validationResult.needsRefresh) {
          const refreshResult = await this.refreshSession();
          if (refreshResult.success && refreshResult.session) {
            await this.setSession(refreshResult.session, { 
              skipStore: false, 
              autoRefresh,
              backgroundSync,
            });
          }
        }
      }

      // Setup background processes
      if (autoRefresh) {
        this.setupAutoRefresh();
      }

      if (backgroundSync) {
        this.setupBackgroundValidation();
      }

      this.isInitialized = true;
      
      const result: SessionValidationResult = {
        isValid: this.currentSession !== null,
        session: this.currentSession,
        state: this.sessionState,
        timeUntilExpiry: this.currentSession ? 
          this.currentSession.expiresAt - Date.now() : undefined,
      };

      this.logSessionEvent('SESSION_INIT_COMPLETED', 'info', {
        isValid: result.isValid,
        sessionId: this.currentSession?.sessionId,
        state: this.sessionState,
      });

      return result;
    } catch (error) {
      this.logSessionEvent('SESSION_INIT_FAILED', 'error', {
        error: error instanceof Error ? error.message : 'Unknown error',
      });

      return {
        isValid: false,
        state: AUTH_STATES.UNAUTHENTICATED,
        error: 'Session initialization failed',
      };
    }
  }

  /**
   * Create new session from authentication response
   */
  public async createSession(
    authData: {
      userId: string;
      email: string;
      sessionToken: string;
      refreshToken?: string;
      csrfToken?: string;
      roles?: string[];
      permissions?: RBACPermission[];
      userData?: any;
    },
    options: SessionInitOptions = {}
  ): Promise<SessionValidationResult> {
    try {
      const { rememberMe = false } = options;
      const now = Date.now();
      
      // Calculate session expiration
      const expiresAt = now + (rememberMe 
        ? SESSION_CONFIG.TIMEOUTS.REMEMBER_ME 
        : SESSION_CONFIG.TIMEOUTS.DEFAULT);

      // Create session data
      const sessionData: UserSession = {
        userId: authData.userId,
        email: authData.email,
        firstName: authData.userData?.firstName || authData.userData?.first_name,
        lastName: authData.userData?.lastName || authData.userData?.last_name,
        displayName: authData.userData?.displayName || authData.userData?.name || authData.email,
        roles: authData.roles || [],
        permissions: authData.permissions || [],
        sessionId: this.generateSessionId(),
        sessionToken: authData.sessionToken,
        refreshToken: authData.refreshToken,
        csrfToken: authData.csrfToken,
        issuedAt: now,
        expiresAt,
        lastActivity: now,
        isRootAdmin: authData.userData?.isRootAdmin || false,
        isSysAdmin: authData.userData?.isSysAdmin || false,
        roleId: authData.userData?.roleId,
        accessibleTabs: authData.userData?.accessibleTabs || [],
        preferences: authData.userData?.preferences || {},
      };

      // Store session in cookies
      const cookieData: SessionData = {
        userId: sessionData.userId,
        email: sessionData.email,
        roles: sessionData.roles,
        permissions: sessionData.permissions,
        sessionId: sessionData.sessionId,
        issuedAt: sessionData.issuedAt,
        expiresAt: sessionData.expiresAt,
        lastActivity: sessionData.lastActivity,
        refreshToken: sessionData.refreshToken,
        csrfToken: sessionData.csrfToken,
      };

      const storeSuccess = await storeSessionToken(cookieData, rememberMe);
      
      if (!storeSuccess) {
        throw new Error('Failed to store session in cookies');
      }

      // Set active session
      await this.setSession(sessionData, options);

      // Broadcast session creation to other tabs
      this.broadcastSessionChange('login', sessionData);

      this.logSessionEvent('SESSION_CREATED', 'info', {
        sessionId: sessionData.sessionId,
        userId: sessionData.userId,
        rememberMe,
        expiresAt: new Date(sessionData.expiresAt).toISOString(),
      });

      return {
        isValid: true,
        session: sessionData,
        state: this.sessionState,
        timeUntilExpiry: sessionData.expiresAt - now,
      };
    } catch (error) {
      this.logSessionEvent('SESSION_CREATE_FAILED', 'error', {
        error: error instanceof Error ? error.message : 'Unknown error',
        userId: authData.userId,
      });

      return {
        isValid: false,
        state: AUTH_STATES.UNAUTHENTICATED,
        error: 'Failed to create session',
      };
    }
  }

  /**
   * Validate current session without network calls
   */
  public async validateCurrentSession(): Promise<SessionValidationResult> {
    try {
      const sessionData = await getSessionToken();
      
      if (!sessionData) {
        return {
          isValid: false,
          state: AUTH_STATES.UNAUTHENTICATED,
          error: 'No session found',
        };
      }

      const now = Date.now();
      const timeUntilExpiry = sessionData.expiresAt - now;

      // Check if session has expired
      if (timeUntilExpiry <= 0) {
        await this.clearSession();
        return {
          isValid: false,
          state: AUTH_STATES.SESSION_EXPIRED,
          error: VALIDATION_MESSAGES.SESSION_EXPIRED,
          expired: true,
          timeUntilExpiry: 0,
        };
      }

      // Check if session needs refresh
      const needsRefresh = timeUntilExpiry <= SESSION_CONFIG.REFRESH.THRESHOLD;

      // Convert cookie data to session data
      const session: UserSession = {
        userId: sessionData.userId,
        email: sessionData.email,
        firstName: '',
        lastName: '',
        displayName: sessionData.email,
        roles: sessionData.roles,
        permissions: sessionData.permissions,
        sessionId: sessionData.sessionId,
        sessionToken: '', // Token is in HTTP-only cookie
        refreshToken: sessionData.refreshToken,
        csrfToken: sessionData.csrfToken,
        issuedAt: sessionData.issuedAt,
        expiresAt: sessionData.expiresAt,
        lastActivity: sessionData.lastActivity || now,
        isRootAdmin: sessionData.permissions.includes(RBAC_PERMISSIONS.SUPER_ADMIN),
        isSysAdmin: sessionData.permissions.includes(RBAC_PERMISSIONS.SYSTEM_ADMIN),
        accessibleTabs: [],
        preferences: {},
      };

      const result: SessionValidationResult = {
        isValid: true,
        session,
        state: AUTH_STATES.AUTHENTICATED,
        needsRefresh,
        timeUntilExpiry,
      };

      // Update current session if valid
      this.currentSession = session;
      this.updateSessionState(AUTH_STATES.AUTHENTICATED);

      return result;
    } catch (error) {
      this.logSessionEvent('SESSION_VALIDATE_FAILED', 'error', {
        error: error instanceof Error ? error.message : 'Unknown error',
      });

      return {
        isValid: false,
        state: AUTH_STATES.UNAUTHENTICATED,
        error: 'Session validation failed',
      };
    }
  }

  /**
   * Refresh session token
   */
  public async refreshSession(): Promise<SessionRefreshResult> {
    try {
      if (!this.currentSession) {
        throw new Error('No active session to refresh');
      }

      this.updateSessionState(AUTH_STATES.TOKEN_REFRESHING);

      const refreshToken = await getRefreshToken();
      if (!refreshToken) {
        throw new Error('No refresh token available');
      }

      // In a real implementation, this would make an API call to refresh the token
      // For now, we'll simulate token refresh by extending the current session
      const now = Date.now();
      const newExpiresAt = now + SESSION_CONFIG.TIMEOUTS.DEFAULT;
      
      const updatedSession: UserSession = {
        ...this.currentSession,
        expiresAt: newExpiresAt,
        lastActivity: now,
      };

      // Update session in cookies
      const success = await refreshSessionToken({
        userId: updatedSession.userId,
        email: updatedSession.email,
        roles: updatedSession.roles,
        permissions: updatedSession.permissions,
        sessionId: updatedSession.sessionId,
        issuedAt: updatedSession.issuedAt,
        expiresAt: updatedSession.expiresAt,
        lastActivity: updatedSession.lastActivity,
        refreshToken: updatedSession.refreshToken,
        csrfToken: updatedSession.csrfToken,
      });

      if (!success) {
        throw new Error('Failed to update session in cookies');
      }

      this.currentSession = updatedSession;
      this.updateSessionState(AUTH_STATES.AUTHENTICATED);

      // Broadcast refresh to other tabs
      this.broadcastSessionChange('refresh', updatedSession);

      this.logSessionEvent('SESSION_REFRESHED', 'info', {
        sessionId: updatedSession.sessionId,
        newExpiresAt: new Date(updatedSession.expiresAt).toISOString(),
      });

      return {
        success: true,
        session: updatedSession,
        newToken: updatedSession.sessionToken,
      };
    } catch (error) {
      this.updateSessionState(AUTH_STATES.AUTHENTICATED); // Revert state
      
      this.logSessionEvent('SESSION_REFRESH_FAILED', 'error', {
        error: error instanceof Error ? error.message : 'Unknown error',
        sessionId: this.currentSession?.sessionId,
      });

      return {
        success: false,
        error: error instanceof Error ? error.message : 'Token refresh failed',
        needsReauth: true,
      };
    }
  }

  /**
   * Clear current session and cleanup
   */
  public async clearSession(reason?: string): Promise<boolean> {
    try {
      const sessionId = this.currentSession?.sessionId;

      // Clear all timers
      this.clearTimers();

      // Perform cookie cleanup
      const cleanupSuccess = await performLogoutCleanup();

      // Clear session data
      this.currentSession = null;
      this.updateSessionState(AUTH_STATES.UNAUTHENTICATED);

      // Broadcast logout to other tabs
      this.broadcastSessionChange('logout', null);

      this.logSessionEvent('SESSION_CLEARED', 'info', {
        sessionId,
        reason: reason || 'Manual logout',
        cleanupSuccess,
      });

      return cleanupSuccess;
    } catch (error) {
      this.logSessionEvent('SESSION_CLEAR_FAILED', 'error', {
        error: error instanceof Error ? error.message : 'Unknown error',
      });

      return false;
    }
  }

  /**
   * Get current session data
   */
  public getCurrentSession(): UserSession | null {
    return this.currentSession;
  }

  /**
   * Get current session state
   */
  public getSessionState(): AuthState {
    return this.sessionState;
  }

  /**
   * Check if user has specific permission
   */
  public hasPermission(permission: RBACPermission): boolean {
    return this.currentSession?.permissions.includes(permission) || false;
  }

  /**
   * Check if user has any of the specified roles
   */
  public hasRole(roles: string | string[]): boolean {
    if (!this.currentSession) return false;
    
    const roleArray = Array.isArray(roles) ? roles : [roles];
    return roleArray.some(role => this.currentSession!.roles.includes(role));
  }

  /**
   * Check if session is expired
   */
  public isSessionExpired(): boolean {
    if (!this.currentSession) return true;
    return Date.now() >= this.currentSession.expiresAt;
  }

  /**
   * Get time until session expires
   */
  public getTimeUntilExpiry(): number {
    if (!this.currentSession) return 0;
    return Math.max(0, this.currentSession.expiresAt - Date.now());
  }

  /**
   * Update session activity timestamp
   */
  public updateActivity(): void {
    const now = Date.now();
    this.sessionActivity.lastActivity = now;
    this.sessionActivity.idleTime = 0;
    this.sessionActivity.isIdle = false;

    if (this.currentSession) {
      this.currentSession.lastActivity = now;
      // Note: In production, you might want to throttle cookie updates
      // to avoid excessive writes on every user action
    }
  }

  /**
   * Add session state change listener
   */
  public addStateChangeListener(listener: SessionStateChangeListener): () => void {
    this.stateListeners.add(listener);
    return () => this.stateListeners.delete(listener);
  }

  /**
   * Emergency session invalidation (security measure)
   */
  public async emergencyInvalidation(domains?: string[]): Promise<boolean> {
    try {
      this.clearTimers();
      
      const success = await emergencySessionInvalidation(domains);
      
      this.currentSession = null;
      this.updateSessionState(AUTH_STATES.UNAUTHENTICATED);
      
      // Broadcast emergency invalidation
      this.broadcastSessionChange('invalidate', null);

      this.logSessionEvent('EMERGENCY_INVALIDATION', 'security', {
        domains,
        success,
      });

      return success;
    } catch (error) {
      this.logSessionEvent('EMERGENCY_INVALIDATION_FAILED', 'error', {
        error: error instanceof Error ? error.message : 'Unknown error',
      });

      return false;
    }
  }

  // =============================================================================
  // PRIVATE HELPER METHODS
  // =============================================================================

  /**
   * Set active session with options
   */
  private async setSession(
    session: UserSession, 
    options: { 
      skipStore?: boolean; 
      autoRefresh?: boolean; 
      backgroundSync?: boolean; 
    } = {}
  ): Promise<void> {
    this.currentSession = session;
    this.updateSessionState(AUTH_STATES.AUTHENTICATED);
    this.updateActivity();

    if (options.autoRefresh) {
      this.setupAutoRefresh();
    }

    if (options.backgroundSync) {
      this.setupBackgroundValidation();
    }
  }

  /**
   * Update session state and notify listeners
   */
  private updateSessionState(newState: AuthState): void {
    const previousState = this.sessionState;
    this.sessionState = newState;

    if (previousState !== newState) {
      this.stateListeners.forEach(listener => {
        try {
          listener(newState, this.currentSession || undefined);
        } catch (error) {
          console.error('Session state listener error:', error);
        }
      });
    }
  }

  /**
   * Setup automatic token refresh
   */
  private setupAutoRefresh(): void {
    if (this.refreshTimer) {
      clearInterval(this.refreshTimer);
    }

    this.refreshTimer = setInterval(async () => {
      if (!this.currentSession) return;

      const timeUntilExpiry = this.getTimeUntilExpiry();
      
      if (timeUntilExpiry <= SESSION_CONFIG.REFRESH.THRESHOLD && timeUntilExpiry > 0) {
        await this.refreshSession();
      }
    }, SESSION_CONFIG.REFRESH.BACKGROUND_INTERVAL);
  }

  /**
   * Setup background session validation
   */
  private setupBackgroundValidation(): void {
    if (this.validationTimer) {
      clearInterval(this.validationTimer);
    }

    this.validationTimer = setInterval(async () => {
      if (!this.currentSession) return;

      const validationResult = await this.validateCurrentSession();
      
      if (!validationResult.isValid) {
        await this.clearSession('Background validation failed');
      } else if (validationResult.needsRefresh) {
        await this.refreshSession();
      }
    }, SESSION_CONFIG.VALIDATION.INTERVAL);
  }

  /**
   * Setup user activity monitoring
   */
  private setupActivityMonitoring(): void {
    if (typeof window === 'undefined') return; // Server-side check

    const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart', 'click'];
    
    const activityHandler = () => {
      this.updateActivity();
    };

    events.forEach(event => {
      document.addEventListener(event, activityHandler, true);
    });

    // Monitor idle time
    this.activityTimer = setInterval(() => {
      const now = Date.now();
      this.sessionActivity.idleTime = now - this.sessionActivity.lastActivity;
      
      const wasIdle = this.sessionActivity.isIdle;
      this.sessionActivity.isIdle = this.sessionActivity.idleTime >= SESSION_CONFIG.VALIDATION.IDLE_TIMEOUT;

      // Show warning before session expires
      if (this.currentSession && !this.sessionActivity.warningShown) {
        const timeUntilExpiry = this.getTimeUntilExpiry();
        if (timeUntilExpiry <= SESSION_CONFIG.VALIDATION.WARNING_THRESHOLD && timeUntilExpiry > 0) {
          this.sessionActivity.warningShown = true;
          this.logSessionEvent('SESSION_EXPIRY_WARNING', 'warn', {
            timeUntilExpiry,
            sessionId: this.currentSession.sessionId,
          });
        }
      }

      // Reset warning flag when session is refreshed
      if (this.sessionActivity.warningShown && this.getTimeUntilExpiry() > SESSION_CONFIG.VALIDATION.WARNING_THRESHOLD) {
        this.sessionActivity.warningShown = false;
      }
    }, 60000); // Check every minute
  }

  /**
   * Setup cross-tab session synchronization
   */
  private setupCrossTabSync(): void {
    if (typeof window === 'undefined') return; // Server-side check

    window.addEventListener('storage', (event) => {
      if (event.key === 'session_sync' && event.newValue) {
        try {
          const syncData: CrossTabSyncData = JSON.parse(event.newValue);
          this.handleCrossTabSync(syncData);
        } catch (error) {
          console.error('Cross-tab sync error:', error);
        }
      }
    });
  }

  /**
   * Handle cross-tab synchronization events
   */
  private async handleCrossTabSync(syncData: CrossTabSyncData): Promise<void> {
    switch (syncData.action) {
      case 'login':
        if (!this.currentSession || this.currentSession.sessionId !== syncData.sessionId) {
          await this.initialize({ skipValidation: false });
        }
        break;
      
      case 'logout':
      case 'invalidate':
        if (this.currentSession) {
          await this.clearSession('Cross-tab logout');
        }
        break;
      
      case 'refresh':
        if (this.currentSession && this.currentSession.sessionId === syncData.sessionId) {
          await this.validateCurrentSession();
        }
        break;
    }
  }

  /**
   * Broadcast session changes to other tabs
   */
  private broadcastSessionChange(action: CrossTabSyncData['action'], session: UserSession | null): void {
    if (typeof window === 'undefined') return; // Server-side check

    const syncData: CrossTabSyncData = {
      sessionId: session?.sessionId || '',
      action,
      timestamp: Date.now(),
      data: session ? { userId: session.userId } : null,
    };

    try {
      localStorage.setItem('session_sync', JSON.stringify(syncData));
      // Clear the item immediately to trigger storage event
      localStorage.removeItem('session_sync');
    } catch (error) {
      console.error('Cross-tab broadcast error:', error);
    }
  }

  /**
   * Clear all timers
   */
  private clearTimers(): void {
    if (this.refreshTimer) {
      clearInterval(this.refreshTimer);
      this.refreshTimer = null;
    }

    if (this.validationTimer) {
      clearInterval(this.validationTimer);
      this.validationTimer = null;
    }

    if (this.activityTimer) {
      clearInterval(this.activityTimer);
      this.activityTimer = null;
    }
  }

  /**
   * Generate unique session ID
   */
  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Log session-related events
   */
  private logSessionEvent(
    event: string,
    level: LogLevel,
    data: Record<string, any> = {}
  ): void {
    try {
      const logEntry = {
        timestamp: new Date().toISOString(),
        event,
        level,
        component: 'session-manager',
        sessionId: this.currentSession?.sessionId,
        userId: this.currentSession?.userId,
        ...data,
      };

      if (level === 'error' || level === 'security') {
        console.error('[SESSION]', JSON.stringify(logEntry));
      } else if (level === 'warn') {
        console.warn('[SESSION]', JSON.stringify(logEntry));
      } else if (process.env.NODE_ENV === 'development') {
        console.log('[SESSION]', JSON.stringify(logEntry));
      }
    } catch (error) {
      console.error('[SESSION] Logging failed:', error);
    }
  }
}

// =============================================================================
// CONVENIENCE FUNCTIONS
// =============================================================================

/**
 * Get global session manager instance
 */
export function getSessionManager(): SessionManager {
  return SessionManager.getInstance();
}

/**
 * Initialize session management
 */
export async function initializeSession(options?: SessionInitOptions): Promise<SessionValidationResult> {
  return getSessionManager().initialize(options);
}

/**
 * Create new session from authentication data
 */
export async function createUserSession(
  authData: {
    userId: string;
    email: string;
    sessionToken: string;
    refreshToken?: string;
    csrfToken?: string;
    roles?: string[];
    permissions?: RBACPermission[];
    userData?: any;
  },
  options?: SessionInitOptions
): Promise<SessionValidationResult> {
  return getSessionManager().createSession(authData, options);
}

/**
 * Validate current session
 */
export async function validateSession(): Promise<SessionValidationResult> {
  return getSessionManager().validateCurrentSession();
}

/**
 * Refresh current session
 */
export async function refreshCurrentSession(): Promise<SessionRefreshResult> {
  return getSessionManager().refreshSession();
}

/**
 * Logout and clear session
 */
export async function logoutUser(reason?: string): Promise<boolean> {
  return getSessionManager().clearSession(reason);
}

/**
 * Get current user session
 */
export function getCurrentUserSession(): UserSession | null {
  return getSessionManager().getCurrentSession();
}

/**
 * Check if user is authenticated
 */
export function isAuthenticated(): boolean {
  const session = getCurrentUserSession();
  return session !== null && !getSessionManager().isSessionExpired();
}

/**
 * Check if user has specific permission
 */
export function userHasPermission(permission: RBACPermission): boolean {
  return getSessionManager().hasPermission(permission);
}

/**
 * Check if user has role
 */
export function userHasRole(roles: string | string[]): boolean {
  return getSessionManager().hasRole(roles);
}

/**
 * Get time until session expires
 */
export function getSessionTimeRemaining(): number {
  return getSessionManager().getTimeUntilExpiry();
}

/**
 * Update user activity timestamp
 */
export function updateUserActivity(): void {
  getSessionManager().updateActivity();
}

/**
 * Add session state change listener
 */
export function onSessionStateChange(listener: SessionStateChangeListener): () => void {
  return getSessionManager().addStateChangeListener(listener);
}

/**
 * Emergency session invalidation
 */
export async function emergencySessionInvalidation(domains?: string[]): Promise<boolean> {
  return getSessionManager().emergencyInvalidation(domains);
}

// =============================================================================
// REACT HOOKS INTEGRATION
// =============================================================================

/**
 * Session hook data interface for React integration
 */
export interface UseSessionData {
  session: UserSession | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  state: AuthState;
  timeUntilExpiry: number;
  hasPermission: (permission: RBACPermission) => boolean;
  hasRole: (roles: string | string[]) => boolean;
  refresh: () => Promise<SessionRefreshResult>;
  logout: (reason?: string) => Promise<boolean>;
  updateActivity: () => void;
}

/**
 * Hook factory for React integration (to be used with React)
 * Note: This is a factory function - the actual React hook would be implemented
 * in a separate hooks file that imports this session manager
 */
export function createSessionHook() {
  // This would be implemented as a React hook in the hooks directory
  // It would use the SessionManager and provide reactive state updates
  return {
    useSession: (): UseSessionData => {
      throw new Error('useSession hook must be implemented in React context');
    },
  };
}

// =============================================================================
// EXPORTS
// =============================================================================

export {
  type UserSession,
  type SessionInitOptions,
  type SessionValidationResult,
  type SessionRefreshResult,
  type SessionEventData,
  type SessionStateChangeListener,
  type SessionActivity,
  type CrossTabSyncData,
  SessionManager,
};