/**
 * User Session and Authentication State Management Utilities
 * 
 * Migrated from Angular DfUserDataService and UserService to React/Next.js patterns.
 * Provides comprehensive session token persistence, user data management, and 
 * authentication state synchronization with React hooks instead of RxJS observables.
 * 
 * Key Features:
 * - Cookie-based session token storage with secure configuration
 * - Cross-tab session state synchronization using localStorage events
 * - Role-based access control data persistence and validation
 * - Next.js middleware integration for server-side session validation
 * - React hooks replacing Angular BehaviorSubject patterns
 * - SSR-compatible session state management
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { 
  UserSession, 
  AuthState, 
  UserProfile, 
  STORAGE_KEYS,
  StorageResult,
  isUserSession
} from './types';
import { CookieStorage, LocalStorage, storageHelpers } from './storage-utils';
import { useLocalStorage, useCookieState, useIsHydrated } from './ssr-storage';

// =============================================================================
// Constants and Configuration
// =============================================================================

/**
 * Session configuration constants matching Angular implementation
 */
const SESSION_CONFIG = {
  TOKEN_COOKIE_NAME: 'df_session_token',
  REFRESH_TOKEN_COOKIE_NAME: 'df_refresh_token',
  TOKEN_EXPIRY_BUFFER: 5 * 60 * 1000, // 5 minutes buffer before token expiry
  SESSION_CHECK_INTERVAL: 30 * 1000, // Check session validity every 30 seconds
  CROSS_TAB_SYNC_KEY: 'df_session_sync',
  MAX_TOKEN_REFRESH_ATTEMPTS: 3,
  DEFAULT_SESSION_DURATION: 24 * 60 * 60 * 1000, // 24 hours
} as const;

/**
 * Default authentication state matching Angular service patterns
 */
const DEFAULT_AUTH_STATE: AuthState = {
  isLoggedIn: false,
  userData: null,
  restrictedAccess: [],
  isLoading: false,
  error: null,
};

/**
 * Cookie options for secure session token storage
 */
const SESSION_COOKIE_OPTIONS = {
  maxAge: 24 * 60 * 60, // 24 hours in seconds
  path: '/',
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'strict' as const,
  httpOnly: false, // Must be false for client-side access
};

// =============================================================================
// Session Token Management
// =============================================================================

/**
 * Session token management utilities for cookie-based storage
 * Replaces Angular's cookie service with secure, Next.js compatible patterns
 */
export class SessionTokenManager {
  /**
   * Store session token in secure cookie
   * @param token - JWT session token
   * @param expiryDate - Token expiration date
   * @returns Success status
   */
  static setSessionToken(token: string, expiryDate?: Date): StorageResult<string> {
    try {
      // Calculate expiry time in seconds from now
      const maxAge = expiryDate 
        ? Math.floor((expiryDate.getTime() - Date.now()) / 1000)
        : SESSION_COOKIE_OPTIONS.maxAge;

      const result = CookieStorage.setCookie(
        SESSION_CONFIG.TOKEN_COOKIE_NAME,
        token,
        {
          ...SESSION_COOKIE_OPTIONS,
          maxAge: Math.max(0, maxAge), // Ensure non-negative
        }
      );

      if (result.success) {
        // Also store token expiry in localStorage for client-side validation
        LocalStorage.setItem(
          `${SESSION_CONFIG.TOKEN_COOKIE_NAME}_expiry`,
          expiryDate?.toISOString() || new Date(Date.now() + SESSION_CONFIG.DEFAULT_SESSION_DURATION).toISOString()
        );
      }

      return result;
    } catch (error) {
      const errorMessage = `Failed to set session token: ${
        error instanceof Error ? error.message : 'Unknown error'
      }`;
      console.error(errorMessage, error);
      return { success: false, error: errorMessage };
    }
  }

  /**
   * Retrieve session token from cookie
   * @returns Session token or null if not found/invalid
   */
  static getSessionToken(): StorageResult<string> {
    try {
      const result = CookieStorage.getCookie(SESSION_CONFIG.TOKEN_COOKIE_NAME);
      
      if (result.success && result.data) {
        // Validate token hasn't expired
        const expiryResult = LocalStorage.getItem<string>(
          `${SESSION_CONFIG.TOKEN_COOKIE_NAME}_expiry`
        );
        
        if (expiryResult.success && expiryResult.data) {
          const expiryDate = new Date(expiryResult.data);
          if (expiryDate.getTime() <= Date.now()) {
            // Token expired, clear it
            this.clearSessionToken();
            return { success: false, error: 'Session token expired' };
          }
        }
        
        return { success: true, data: result.data };
      }
      
      return { success: false, error: 'No session token found' };
    } catch (error) {
      const errorMessage = `Failed to get session token: ${
        error instanceof Error ? error.message : 'Unknown error'
      }`;
      console.error(errorMessage, error);
      return { success: false, error: errorMessage };
    }
  }

  /**
   * Clear session token and related data
   * @returns Success status
   */
  static clearSessionToken(): StorageResult<void> {
    try {
      const results = [
        CookieStorage.removeCookie(SESSION_CONFIG.TOKEN_COOKIE_NAME),
        CookieStorage.removeCookie(SESSION_CONFIG.REFRESH_TOKEN_COOKIE_NAME),
        LocalStorage.removeItem(`${SESSION_CONFIG.TOKEN_COOKIE_NAME}_expiry`),
        LocalStorage.removeItem(STORAGE_KEYS.CURRENT_USER),
      ];

      const hasErrors = results.some(result => !result.success);
      
      if (hasErrors) {
        const errors = results
          .filter(result => !result.success)
          .map(result => result.error)
          .join('; ');
        
        return { success: false, error: `Token clear errors: ${errors}` };
      }

      return { success: true };
    } catch (error) {
      const errorMessage = `Failed to clear session token: ${
        error instanceof Error ? error.message : 'Unknown error'
      }`;
      console.error(errorMessage, error);
      return { success: false, error: errorMessage };
    }
  }

  /**
   * Check if session token is valid and not expired
   * @returns Validation result
   */
  static validateToken(): boolean {
    const tokenResult = this.getSessionToken();
    return tokenResult.success && !!tokenResult.data;
  }

  /**
   * Get time until token expiry in milliseconds
   * @returns Milliseconds until expiry, or 0 if expired/not found
   */
  static getTimeUntilExpiry(): number {
    try {
      const expiryResult = LocalStorage.getItem<string>(
        `${SESSION_CONFIG.TOKEN_COOKIE_NAME}_expiry`
      );
      
      if (expiryResult.success && expiryResult.data) {
        const expiryDate = new Date(expiryResult.data);
        const timeRemaining = expiryDate.getTime() - Date.now();
        return Math.max(0, timeRemaining);
      }
      
      return 0;
    } catch (error) {
      console.error('Failed to get token expiry time:', error);
      return 0;
    }
  }

  /**
   * Check if token needs refresh (within buffer time of expiry)
   * @returns True if token should be refreshed
   */
  static shouldRefreshToken(): boolean {
    const timeUntilExpiry = this.getTimeUntilExpiry();
    return timeUntilExpiry > 0 && timeUntilExpiry <= SESSION_CONFIG.TOKEN_EXPIRY_BUFFER;
  }
}

// =============================================================================
// User Data Management
// =============================================================================

/**
 * User data persistence and retrieval utilities
 * Replaces Angular's user data service with React-compatible storage patterns
 */
export class UserDataManager {
  /**
   * Store user session data in localStorage with JSON serialization
   * @param userData - User session data
   * @returns Success status
   */
  static setUserData(userData: UserSession): StorageResult<UserSession> {
    try {
      // Validate user data structure
      if (!isUserSession(userData)) {
        return { success: false, error: 'Invalid user session data structure' };
      }

      const result = LocalStorage.setItem(STORAGE_KEYS.CURRENT_USER, userData);
      
      if (result.success) {
        // Trigger cross-tab synchronization
        this.broadcastSessionChange('user_data_updated', userData);
      }
      
      return result;
    } catch (error) {
      const errorMessage = `Failed to set user data: ${
        error instanceof Error ? error.message : 'Unknown error'
      }`;
      console.error(errorMessage, error);
      return { success: false, error: errorMessage };
    }
  }

  /**
   * Retrieve user session data from localStorage
   * @returns User session data or null if not found/invalid
   */
  static getUserData(): StorageResult<UserSession> {
    try {
      const result = LocalStorage.getItem<UserSession>(STORAGE_KEYS.CURRENT_USER);
      
      if (result.success && result.data && isUserSession(result.data)) {
        return { success: true, data: result.data };
      }
      
      return { success: false, error: 'No valid user data found' };
    } catch (error) {
      const errorMessage = `Failed to get user data: ${
        error instanceof Error ? error.message : 'Unknown error'
      }`;
      console.error(errorMessage, error);
      return { success: false, error: errorMessage };
    }
  }

  /**
   * Clear user data from storage
   * @returns Success status
   */
  static clearUserData(): StorageResult<void> {
    try {
      const result = LocalStorage.removeItem(STORAGE_KEYS.CURRENT_USER);
      
      if (result.success) {
        // Trigger cross-tab synchronization
        this.broadcastSessionChange('user_data_cleared', null);
      }
      
      return result;
    } catch (error) {
      const errorMessage = `Failed to clear user data: ${
        error instanceof Error ? error.message : 'Unknown error'
      }`;
      console.error(errorMessage, error);
      return { success: false, error: errorMessage };
    }
  }

  /**
   * Update specific user profile fields
   * @param updates - Partial user data to update
   * @returns Updated user session data
   */
  static updateUserData(updates: Partial<UserSession>): StorageResult<UserSession> {
    try {
      const currentDataResult = this.getUserData();
      
      if (!currentDataResult.success || !currentDataResult.data) {
        return { success: false, error: 'No existing user data to update' };
      }

      const updatedData = { ...currentDataResult.data, ...updates };
      return this.setUserData(updatedData);
    } catch (error) {
      const errorMessage = `Failed to update user data: ${
        error instanceof Error ? error.message : 'Unknown error'
      }`;
      console.error(errorMessage, error);
      return { success: false, error: errorMessage };
    }
  }

  /**
   * Broadcast session changes to other tabs for synchronization
   * @param type - Type of change
   * @param data - Associated data
   */
  private static broadcastSessionChange(type: string, data: any): void {
    try {
      const event = {
        type,
        data,
        timestamp: Date.now(),
        tabId: Math.random().toString(36).substr(2, 9),
      };

      LocalStorage.setItem(SESSION_CONFIG.CROSS_TAB_SYNC_KEY, event);
    } catch (error) {
      console.warn('Failed to broadcast session change:', error);
    }
  }
}

// =============================================================================
// Authentication State Hook
// =============================================================================

/**
 * Primary authentication state hook replacing Angular's UserService
 * Provides reactive authentication state with automatic session validation
 */
export function useAuthState(): {
  authState: AuthState;
  login: (credentials: { email: string; password: string }) => Promise<void>;
  logout: () => Promise<void>;
  refreshSession: () => Promise<boolean>;
  updateUserData: (updates: Partial<UserSession>) => void;
  isSessionValid: boolean;
  timeUntilExpiry: number;
} {
  const isHydrated = useIsHydrated();
  const [authState, setAuthState] = useState<AuthState>(DEFAULT_AUTH_STATE);
  const [sessionToken] = useCookieState(SESSION_CONFIG.TOKEN_COOKIE_NAME, '');
  const refreshAttempts = useRef(0);
  const sessionCheckInterval = useRef<NodeJS.Timeout>();

  // Session validation state
  const isSessionValid = SessionTokenManager.validateToken();
  const timeUntilExpiry = SessionTokenManager.getTimeUntilExpiry();

  /**
   * Initialize authentication state from stored session
   */
  const initializeAuth = useCallback(async () => {
    if (!isHydrated) return;

    setAuthState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      const tokenResult = SessionTokenManager.getSessionToken();
      const userDataResult = UserDataManager.getUserData();

      if (tokenResult.success && userDataResult.success) {
        setAuthState({
          isLoggedIn: true,
          userData: userDataResult.data!,
          restrictedAccess: [], // Will be populated from user roles
          isLoading: false,
          error: null,
        });
      } else {
        setAuthState(DEFAULT_AUTH_STATE);
      }
    } catch (error) {
      console.error('Failed to initialize authentication state:', error);
      setAuthState({
        ...DEFAULT_AUTH_STATE,
        error: 'Failed to initialize authentication',
      });
    }
  }, [isHydrated]);

  /**
   * Login with email and password
   * @param credentials - User credentials
   */
  const login = useCallback(async (credentials: { email: string; password: string }) => {
    setAuthState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      // In a real implementation, this would call the DreamFactory authentication API
      const response = await fetch('/api/v2/user/session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(credentials),
      });

      if (!response.ok) {
        throw new Error('Authentication failed');
      }

      const sessionData = await response.json();
      
      // Store session token
      const tokenResult = SessionTokenManager.setSessionToken(
        sessionData.session_token,
        new Date(sessionData.expires)
      );

      if (!tokenResult.success) {
        throw new Error(tokenResult.error || 'Failed to store session token');
      }

      // Store user data
      const userDataResult = UserDataManager.setUserData(sessionData);

      if (!userDataResult.success) {
        throw new Error(userDataResult.error || 'Failed to store user data');
      }

      setAuthState({
        isLoggedIn: true,
        userData: sessionData,
        restrictedAccess: [],
        isLoading: false,
        error: null,
      });

      refreshAttempts.current = 0;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Login failed';
      setAuthState({
        ...DEFAULT_AUTH_STATE,
        error: errorMessage,
      });
      throw error;
    }
  }, []);

  /**
   * Logout and clear all session data
   */
  const logout = useCallback(async () => {
    setAuthState(prev => ({ ...prev, isLoading: true }));

    try {
      // Clear session on server if possible
      const tokenResult = SessionTokenManager.getSessionToken();
      if (tokenResult.success) {
        try {
          await fetch('/api/v2/user/session', {
            method: 'DELETE',
            headers: {
              'X-DreamFactory-Session-Token': tokenResult.data!,
            },
          });
        } catch (error) {
          // Ignore server logout errors, still clear local session
          console.warn('Failed to logout on server:', error);
        }
      }

      // Clear local session data
      SessionTokenManager.clearSessionToken();
      UserDataManager.clearUserData();

      setAuthState(DEFAULT_AUTH_STATE);
    } catch (error) {
      console.error('Logout error:', error);
      // Still clear local state even if server logout fails
      setAuthState(DEFAULT_AUTH_STATE);
    }
  }, []);

  /**
   * Refresh session token
   * @returns True if refresh was successful
   */
  const refreshSession = useCallback(async (): Promise<boolean> => {
    if (refreshAttempts.current >= SESSION_CONFIG.MAX_TOKEN_REFRESH_ATTEMPTS) {
      console.warn('Max token refresh attempts reached');
      await logout();
      return false;
    }

    try {
      refreshAttempts.current++;

      const currentToken = SessionTokenManager.getSessionToken();
      if (!currentToken.success) {
        return false;
      }

      const response = await fetch('/api/v2/user/session', {
        method: 'PUT',
        headers: {
          'X-DreamFactory-Session-Token': currentToken.data!,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Token refresh failed');
      }

      const sessionData = await response.json();

      // Update stored session token
      const tokenResult = SessionTokenManager.setSessionToken(
        sessionData.session_token,
        new Date(sessionData.expires)
      );

      if (tokenResult.success) {
        refreshAttempts.current = 0;
        return true;
      }

      return false;
    } catch (error) {
      console.error('Session refresh failed:', error);
      if (refreshAttempts.current >= SESSION_CONFIG.MAX_TOKEN_REFRESH_ATTEMPTS) {
        await logout();
      }
      return false;
    }
  }, [logout]);

  /**
   * Update user data in state and storage
   * @param updates - Partial user data updates
   */
  const updateUserData = useCallback((updates: Partial<UserSession>) => {
    if (!authState.userData) return;

    const result = UserDataManager.updateUserData(updates);
    if (result.success) {
      setAuthState(prev => ({
        ...prev,
        userData: result.data!,
      }));
    }
  }, [authState.userData]);

  /**
   * Set up periodic session validation
   */
  useEffect(() => {
    if (!isHydrated) return;

    const checkSession = () => {
      if (authState.isLoggedIn) {
        if (SessionTokenManager.shouldRefreshToken()) {
          refreshSession();
        } else if (!SessionTokenManager.validateToken()) {
          logout();
        }
      }
    };

    sessionCheckInterval.current = setInterval(checkSession, SESSION_CONFIG.SESSION_CHECK_INTERVAL);

    return () => {
      if (sessionCheckInterval.current) {
        clearInterval(sessionCheckInterval.current);
      }
    };
  }, [isHydrated, authState.isLoggedIn, refreshSession, logout]);

  /**
   * Listen for cross-tab session changes
   */
  useEffect(() => {
    if (!isHydrated) return;

    const handleStorageChange = (event: StorageEvent) => {
      if (event.key === SESSION_CONFIG.CROSS_TAB_SYNC_KEY && event.newValue) {
        try {
          const syncEvent = JSON.parse(event.newValue);
          
          switch (syncEvent.type) {
            case 'user_data_updated':
              if (syncEvent.data && isUserSession(syncEvent.data)) {
                setAuthState(prev => ({
                  ...prev,
                  userData: syncEvent.data,
                  isLoggedIn: true,
                }));
              }
              break;
            case 'user_data_cleared':
              setAuthState(DEFAULT_AUTH_STATE);
              break;
          }
        } catch (error) {
          console.warn('Failed to process cross-tab sync event:', error);
        }
      }
    };

    window.addEventListener('storage', handleStorageChange);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, [isHydrated]);

  /**
   * Initialize authentication state on mount
   */
  useEffect(() => {
    initializeAuth();
  }, [initializeAuth]);

  return {
    authState,
    login,
    logout,
    refreshSession,
    updateUserData,
    isSessionValid,
    timeUntilExpiry,
  };
}

// =============================================================================
// Role-Based Access Control Hook
// =============================================================================

/**
 * Role-based access control hook for permission management
 * Replaces Angular guards with React-based permission checking
 */
export function useRoleAccess(): {
  hasPermission: (permission: string) => boolean;
  hasRole: (role: string) => boolean;
  isAdmin: boolean;
  isSysAdmin: boolean;
  userRoles: string[];
  userPermissions: string[];
} {
  const { authState } = useAuthState();
  const [userRoles, setUserRoles] = useLocalStorage<string[]>('user_roles', {
    defaultValue: [],
    syncAcrossTabs: true,
  });
  const [userPermissions, setUserPermissions] = useLocalStorage<string[]>('user_permissions', {
    defaultValue: [],
    syncAcrossTabs: true,
  });

  const isAdmin = authState.userData?.isRootAdmin || false;
  const isSysAdmin = authState.userData?.isSysAdmin || false;

  /**
   * Check if user has a specific permission
   * @param permission - Permission string to check
   * @returns True if user has permission
   */
  const hasPermission = useCallback((permission: string): boolean => {
    // Root admin has all permissions
    if (isAdmin) return true;
    
    // Check explicit permissions
    return userPermissions.includes(permission);
  }, [isAdmin, userPermissions]);

  /**
   * Check if user has a specific role
   * @param role - Role string to check
   * @returns True if user has role
   */
  const hasRole = useCallback((role: string): boolean => {
    return userRoles.includes(role);
  }, [userRoles]);

  /**
   * Load user roles and permissions when user data changes
   */
  useEffect(() => {
    if (authState.userData && authState.isLoggedIn) {
      // In a real implementation, this would fetch roles/permissions from the API
      // For now, derive from user data
      const roles: string[] = [];
      const permissions: string[] = [];

      if (authState.userData.isRootAdmin) {
        roles.push('root_admin');
        permissions.push('*'); // All permissions
      }

      if (authState.userData.isSysAdmin) {
        roles.push('sys_admin');
        permissions.push('system.read', 'system.write', 'users.manage');
      }

      // Add role-based permissions
      if (authState.userData.roleId) {
        roles.push(`role_${authState.userData.roleId}`);
      }

      setUserRoles(roles);
      setUserPermissions(permissions);
    } else {
      setUserRoles([]);
      setUserPermissions([]);
    }
  }, [authState.userData, authState.isLoggedIn, setUserRoles, setUserPermissions]);

  return {
    hasPermission,
    hasRole,
    isAdmin,
    isSysAdmin,
    userRoles,
    userPermissions,
  };
}

// =============================================================================
// Session Storage Hook for Temporary Data
// =============================================================================

/**
 * Session storage hook for temporary authentication-related data
 * Provides session-scoped storage that clears when tab is closed
 */
export function useSessionData<T>(
  key: string,
  defaultValue: T
): [T, (value: T) => void, () => void] {
  const { authState } = useAuthState();
  
  // Prefix key with user ID to avoid cross-user data contamination
  const userSpecificKey = authState.userData?.id 
    ? `user_${authState.userData.id}_${key}`
    : `guest_${key}`;

  return useLocalStorage(userSpecificKey, {
    defaultValue,
    syncAcrossTabs: false, // Session data shouldn't sync across tabs
  });
}

// =============================================================================
// Utility Functions for Migration
// =============================================================================

/**
 * Utility functions to ease migration from Angular patterns
 */
export const sessionUtils = {
  /**
   * Get current user data synchronously (for compatibility)
   * @returns Current user session or null
   */
  getCurrentUser: (): UserSession | null => {
    const result = UserDataManager.getUserData();
    return result.success ? result.data! : null;
  },

  /**
   * Get current session token synchronously (for compatibility)
   * @returns Current session token or null
   */
  getCurrentToken: (): string | null => {
    const result = SessionTokenManager.getSessionToken();
    return result.success ? result.data! : null;
  },

  /**
   * Check if user is currently authenticated (for compatibility)
   * @returns True if user is authenticated
   */
  isAuthenticated: (): boolean => {
    return SessionTokenManager.validateToken() && !!sessionUtils.getCurrentUser();
  },

  /**
   * Clear all session data (for compatibility)
   */
  clearSession: (): void => {
    SessionTokenManager.clearSessionToken();
    UserDataManager.clearUserData();
  },

  /**
   * Migration helper: Convert Angular BehaviorSubject observable to React hook pattern
   * @param key - Storage key for the observable data
   * @param defaultValue - Default value if no stored data exists
   * @returns React hook pattern [value, setValue]
   */
  migrateObservable: <T>(key: string, defaultValue: T) => {
    // This is a helper function that applications can use during migration
    // It provides the same interface as Angular BehaviorSubject but with React hooks
    return useLocalStorage(key, { defaultValue, syncAcrossTabs: true });
  },
};

// =============================================================================
// Export All Public APIs
// =============================================================================

export {
  SessionTokenManager,
  UserDataManager,
  SESSION_CONFIG,
  DEFAULT_AUTH_STATE,
  SESSION_COOKIE_OPTIONS,
};

export type {
  AuthState,
  UserSession,
  UserProfile,
};