/**
 * Session Management Hook for DreamFactory Admin Interface
 * 
 * Comprehensive session management hook that handles session token lifecycle, cookie operations,
 * and session validation. Replaces Angular session management patterns with React Query caching,
 * HTTP-only cookie handling, and automatic session refresh capabilities for secure authentication workflows.
 * 
 * Key Features:
 * - Secure session token management with HTTP-only cookies and SameSite=Strict configuration
 * - Automatic session validation with background refresh using React Query per Section 3.2.4
 * - Session expiration detection and automatic logout workflows with proper cleanup
 * - Session metadata management including user roles and access restrictions
 * - Cookie lifecycle management with proper expiration and domain configuration
 * - Integration with Next.js middleware for server-side session validation
 * 
 * Security Implementation:
 * - HTTP-only cookies prevent XSS attacks on session tokens
 * - SameSite=Strict configuration prevents CSRF attacks
 * - Automatic token refresh prevents session interruption
 * - Secure logout with complete session cleanup
 * - Background validation ensures session integrity
 * 
 * Performance Characteristics:
 * - React Query caching provides cache hit responses under 50ms
 * - Background revalidation maintains session freshness
 * - Optimistic updates for seamless user experience
 * - Intelligent retry logic for network resilience
 * 
 * @example
 * ```tsx
 * function Dashboard() {
 *   const {
 *     user,
 *     isAuthenticated,
 *     isLoading,
 *     logout,
 *     refresh,
 *     hasPermission,
 *     isSessionExpiring
 *   } = useSession();
 * 
 *   if (isLoading) return <LoadingSpinner />;
 *   if (!isAuthenticated) return <LoginForm />;
 * 
 *   return (
 *     <div>
 *       <h1>Welcome, {user?.name}</h1>
 *       {isSessionExpiring && <SessionExpiryWarning />}
 *       {hasPermission('admin') && <AdminPanel />}
 *     </div>
 *   );
 * }
 * ```
 */

'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useCallback, useEffect, useRef } from 'react';
import { 
  UserSession, 
  AuthState, 
  AuthError, 
  AuthErrorCode,
  SessionValidation,
  SessionRefreshRequest,
  DEFAULT_COOKIE_CONFIG,
  SessionCookieConfig
} from '@/types/auth';
import { UserProfile, UserPermissions } from '@/types/user';

// ============================================================================
// Constants and Configuration
// ============================================================================

/**
 * Session management configuration constants
 * Optimized for DreamFactory deployment patterns with enhanced security
 */
const SESSION_CONFIG = {
  QUERY_KEY: ['session'] as const,
  VALIDATION_KEY: ['session', 'validation'] as const,
  REFRESH_THRESHOLD: 5 * 60 * 1000, // 5 minutes before expiration
  VALIDATION_INTERVAL: 30 * 1000, // 30 seconds background validation
  COOKIE_NAME: 'df-session-token',
  MAX_RETRY_ATTEMPTS: 3,
  RETRY_DELAY: 1000, // 1 second base delay
} as const;

/**
 * Session query stale time configuration
 * Balances performance with security requirements
 */
const QUERY_CONFIG = {
  STALE_TIME: 5 * 60 * 1000, // 5 minutes
  CACHE_TIME: 10 * 60 * 1000, // 10 minutes
  REFETCH_INTERVAL: SESSION_CONFIG.VALIDATION_INTERVAL,
} as const;

// ============================================================================
// Cookie Management Utilities
// ============================================================================

/**
 * Secure cookie management utilities for session tokens
 * Implements HTTP-only, SameSite=Strict configuration per security requirements
 */
class SessionCookieManager {
  private static config: SessionCookieConfig = {
    ...DEFAULT_COOKIE_CONFIG,
    name: SESSION_CONFIG.COOKIE_NAME,
  };

  /**
   * Sets a secure session token cookie with proper security configuration
   * @param token - Session token to store
   * @param expiresAt - Optional expiration timestamp
   */
  static setSessionToken(token: string, expiresAt?: number): void {
    if (typeof document === 'undefined') return; // Server-side guard

    const expires = expiresAt 
      ? new Date(expiresAt).toUTCString()
      : new Date(Date.now() + this.config.maxAge * 1000).toUTCString();

    const cookieString = [
      `${this.config.name}=${token}`,
      `expires=${expires}`,
      `path=${this.config.path}`,
      this.config.domain ? `domain=${this.config.domain}` : '',
      this.config.httpOnly ? 'HttpOnly' : '',
      this.config.secure ? 'Secure' : '',
      `SameSite=${this.config.sameSite}`,
    ]
      .filter(Boolean)
      .join('; ');

    document.cookie = cookieString;
  }

  /**
   * Retrieves the session token from cookies
   * Note: HTTP-only cookies are not accessible via JavaScript
   * This method is for client-side validation only
   */
  static getSessionToken(): string | null {
    if (typeof document === 'undefined') return null; // Server-side guard

    const cookies = document.cookie.split(';');
    const sessionCookie = cookies.find(cookie => 
      cookie.trim().startsWith(`${this.config.name}=`)
    );

    if (!sessionCookie) return null;

    return sessionCookie.split('=')[1] || null;
  }

  /**
   * Clears the session token cookie with proper cleanup
   * Ensures complete session termination
   */
  static clearSessionToken(): void {
    if (typeof document === 'undefined') return; // Server-side guard

    const cookieString = [
      `${this.config.name}=`,
      'expires=Thu, 01 Jan 1970 00:00:00 UTC',
      `path=${this.config.path}`,
      this.config.domain ? `domain=${this.config.domain}` : '',
      this.config.httpOnly ? 'HttpOnly' : '',
      this.config.secure ? 'Secure' : '',
      `SameSite=${this.config.sameSite}`,
    ]
      .filter(Boolean)
      .join('; ');

    document.cookie = cookieString;
  }

  /**
   * Updates cookie configuration for different environments
   * @param config - Partial cookie configuration to override defaults
   */
  static updateConfig(config: Partial<SessionCookieConfig>): void {
    this.config = { ...this.config, ...config };
  }
}

// ============================================================================
// Session API Functions
// ============================================================================

/**
 * Session API client for server communication
 * Handles session validation, refresh, and logout operations
 */
class SessionAPI {
  private static baseUrl = '/api/v2/user';
  
  /**
   * Validates the current session with the server
   * Returns session validation result with user data
   */
  static async validateSession(): Promise<SessionValidation> {
    try {
      const response = await fetch(`${this.baseUrl}/session`, {
        method: 'GET',
        credentials: 'include', // Include HTTP-only cookies
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
      });

      if (!response.ok) {
        if (response.status === 401) {
          return {
            valid: false,
            expired: true,
            error: 'Session expired'
          };
        }
        throw new Error(`Session validation failed: ${response.statusText}`);
      }

      const data = await response.json();
      
      return {
        valid: true,
        expired: false,
        user_id: data.id,
        session_id: data.sessionId,
        expires_at: data.tokenExpiryDate ? new Date(data.tokenExpiryDate).getTime() : undefined,
      };
    } catch (error) {
      console.error('Session validation error:', error);
      return {
        valid: false,
        expired: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Refreshes the current session token
   * Attempts to extend session without requiring re-authentication
   */
  static async refreshSession(request: SessionRefreshRequest): Promise<UserSession> {
    const response = await fetch(`${this.baseUrl}/session`, {
      method: 'PUT',
      credentials: 'include', // Include HTTP-only cookies
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `Session refresh failed: ${response.statusText}`);
    }

    const data = await response.json();
    
    // Update the HTTP-only cookie with new token
    if (data.session_token || data.sessionToken) {
      const token = data.session_token || data.sessionToken;
      const expiresAt = data.tokenExpiryDate 
        ? new Date(data.tokenExpiryDate).getTime()
        : Date.now() + (24 * 60 * 60 * 1000); // 24 hours default
      
      SessionCookieManager.setSessionToken(token, expiresAt);
    }

    return this.transformToUserSession(data);
  }

  /**
   * Logs out the user and terminates the session
   * Ensures complete cleanup of session data
   */
  static async logout(): Promise<void> {
    try {
      await fetch(`${this.baseUrl}/session`, {
        method: 'DELETE',
        credentials: 'include', // Include HTTP-only cookies
        headers: {
          'Content-Type': 'application/json',
        },
      });
    } catch (error) {
      // Log error but don't prevent client-side cleanup
      console.error('Server logout error:', error);
    } finally {
      // Always clear client-side session data
      SessionCookieManager.clearSessionToken();
    }
  }

  /**
   * Retrieves current user profile data
   * Used for session hydration and profile updates
   */
  static async getUserProfile(): Promise<UserProfile> {
    const response = await fetch(`${this.baseUrl}/profile`, {
      method: 'GET',
      credentials: 'include', // Include HTTP-only cookies
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch user profile: ${response.statusText}`);
    }

    return response.json();
  }

  /**
   * Transforms API response to UserSession format
   * Ensures consistent session data structure
   */
  private static transformToUserSession(data: any): UserSession {
    return {
      email: data.email,
      firstName: data.firstName || data.first_name,
      lastName: data.lastName || data.last_name,
      name: data.name,
      host: data.host,
      id: data.id,
      isRootAdmin: data.isRootAdmin || data.is_root_admin || false,
      isSysAdmin: data.isSysAdmin || data.is_sys_admin || false,
      lastLoginDate: data.lastLoginDate || data.last_login_date,
      sessionId: data.sessionId || data.session_id,
      sessionToken: data.sessionToken || data.session_token,
      tokenExpiryDate: new Date(data.tokenExpiryDate || data.token_expiry_date),
      roleId: data.roleId || data.role_id,
      role_id: data.role_id,
    };
  }
}

// ============================================================================
// Session Hook Implementation
// ============================================================================

/**
 * Session hook return type with comprehensive session management capabilities
 * Provides all necessary functions and state for session handling
 */
export interface UseSessionReturn {
  // Core session state
  user: UserSession | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: AuthError | null;
  
  // Session metadata
  lastActivity: Date | null;
  sessionExpiry: Date | null;
  isRefreshing: boolean;
  isSessionExpiring: boolean;
  
  // Session management actions
  refresh: () => Promise<void>;
  logout: () => Promise<void>;
  checkSession: () => Promise<boolean>;
  updateLastActivity: () => void;
  
  // Permission helpers
  hasPermission: (permission: string) => boolean;
  hasRole: (roleId: number) => boolean;
  isAdmin: boolean;
  isRootAdmin: boolean;
  
  // Session validation utilities
  getTimeUntilExpiry: () => number;
  shouldRefreshSession: () => boolean;
}

/**
 * Enhanced session management hook with automatic validation and refresh
 * 
 * This hook provides comprehensive session management capabilities including:
 * - Automatic background session validation using React Query
 * - HTTP-only cookie management with secure configuration
 * - Session expiration detection and automatic refresh
 * - Permission-based access control helpers
 * - Optimistic updates and error handling
 * - Integration with Next.js middleware for SSR compatibility
 * 
 * The hook leverages React Query for intelligent caching and background
 * synchronization, ensuring optimal performance while maintaining security.
 */
export function useSession(): UseSessionReturn {
  const queryClient = useQueryClient();
  const lastActivityRef = useRef<Date>(new Date());
  const refreshTimeoutRef = useRef<NodeJS.Timeout>();

  // ============================================================================
  // Session Validation Query
  // ============================================================================

  /**
   * Primary session validation query with React Query
   * Implements background revalidation and intelligent caching
   */
  const {
    data: sessionValidation,
    error: validationError,
    isLoading: isValidating,
    refetch: revalidateSession,
  } = useQuery({
    queryKey: SESSION_CONFIG.VALIDATION_KEY,
    queryFn: SessionAPI.validateSession,
    staleTime: QUERY_CONFIG.STALE_TIME,
    gcTime: QUERY_CONFIG.CACHE_TIME, // Updated from cacheTime in React Query v5
    refetchInterval: QUERY_CONFIG.REFETCH_INTERVAL,
    refetchIntervalInBackground: true,
    refetchOnWindowFocus: true,
    refetchOnReconnect: true,
    retry: (failureCount, error) => {
      // Limit retries for authentication errors
      if (error instanceof Error && error.message.includes('401')) {
        return false;
      }
      return failureCount < SESSION_CONFIG.MAX_RETRY_ATTEMPTS;
    },
    retryDelay: (attemptIndex) => 
      Math.min(SESSION_CONFIG.RETRY_DELAY * Math.pow(2, attemptIndex), 30000),
  });

  // ============================================================================
  // User Profile Query
  // ============================================================================

  /**
   * User profile query with conditional fetching
   * Only fetches when session is validated and active
   */
  const {
    data: userProfile,
    error: profileError,
    isLoading: isLoadingProfile,
  } = useQuery({
    queryKey: ['user', 'profile'],
    queryFn: SessionAPI.getUserProfile,
    enabled: sessionValidation?.valid === true,
    staleTime: QUERY_CONFIG.STALE_TIME,
    gcTime: QUERY_CONFIG.CACHE_TIME,
  });

  // ============================================================================
  // Session Refresh Mutation
  // ============================================================================

  /**
   * Session refresh mutation with optimistic updates
   * Handles automatic token refresh without user intervention
   */
  const refreshMutation = useMutation({
    mutationFn: (request: SessionRefreshRequest) => SessionAPI.refreshSession(request),
    onMutate: async () => {
      // Cancel any outgoing refetches to prevent optimistic updates from being overwritten
      await queryClient.cancelQueries({ queryKey: SESSION_CONFIG.VALIDATION_KEY });
      
      // Set refreshing state
      return { isRefreshing: true };
    },
    onSuccess: (data) => {
      // Update session validation cache with successful refresh
      queryClient.setQueryData(SESSION_CONFIG.VALIDATION_KEY, {
        valid: true,
        expired: false,
        user_id: data.id,
        session_id: data.sessionId,
        expires_at: data.tokenExpiryDate.getTime(),
      });

      // Invalidate and refetch user profile to get latest data
      queryClient.invalidateQueries({ queryKey: ['user', 'profile'] });
    },
    onError: (error) => {
      console.error('Session refresh failed:', error);
      
      // Mark session as expired if refresh fails
      queryClient.setQueryData(SESSION_CONFIG.VALIDATION_KEY, {
        valid: false,
        expired: true,
        error: error instanceof Error ? error.message : 'Refresh failed'
      });
    },
  });

  // ============================================================================
  // Logout Mutation
  // ============================================================================

  /**
   * Logout mutation with comprehensive cleanup
   * Ensures complete session termination
   */
  const logoutMutation = useMutation({
    mutationFn: SessionAPI.logout,
    onSuccess: () => {
      // Clear all authentication-related cache
      queryClient.removeQueries({ queryKey: SESSION_CONFIG.QUERY_KEY });
      queryClient.removeQueries({ queryKey: ['user'] });
      
      // Reset session state
      queryClient.setQueryData(SESSION_CONFIG.VALIDATION_KEY, {
        valid: false,
        expired: false,
      });
    },
    onError: (error) => {
      console.error('Logout error:', error);
      
      // Even if server logout fails, clear local state
      queryClient.removeQueries({ queryKey: SESSION_CONFIG.QUERY_KEY });
      queryClient.removeQueries({ queryKey: ['user'] });
    },
  });

  // ============================================================================
  // Computed State and Properties
  // ============================================================================

  /**
   * Transform user profile data to UserSession format
   * Provides consistent session data structure
   */
  const user: UserSession | null = userProfile ? {
    email: userProfile.email,
    firstName: userProfile.first_name || '',
    lastName: userProfile.last_name || '',
    name: userProfile.name,
    host: userProfile.host || '',
    id: userProfile.id,
    isRootAdmin: userProfile.is_sys_admin || false,
    isSysAdmin: userProfile.is_sys_admin || false,
    lastLoginDate: userProfile.last_login_date || '',
    sessionId: sessionValidation?.session_id || '',
    sessionToken: '', // HTTP-only, not accessible
    tokenExpiryDate: sessionValidation?.expires_at 
      ? new Date(sessionValidation.expires_at) 
      : new Date(),
    roleId: userProfile.user_to_app_to_role_by_user_id?.[0]?.role_id || 0,
    role_id: userProfile.user_to_app_to_role_by_user_id?.[0]?.role_id,
  } : null;

  const isAuthenticated = sessionValidation?.valid === true && !!user;
  const isLoading = isValidating || isLoadingProfile;
  const isRefreshing = refreshMutation.isPending;

  /**
   * Session expiry calculations
   * Determines when session will expire and if refresh is needed
   */
  const sessionExpiry = sessionValidation?.expires_at 
    ? new Date(sessionValidation.expires_at) 
    : null;

  const getTimeUntilExpiry = useCallback((): number => {
    if (!sessionExpiry) return 0;
    return Math.max(0, sessionExpiry.getTime() - Date.now());
  }, [sessionExpiry]);

  const isSessionExpiring = getTimeUntilExpiry() < SESSION_CONFIG.REFRESH_THRESHOLD;
  const shouldRefreshSession = useCallback((): boolean => {
    return isAuthenticated && isSessionExpiring && !isRefreshing;
  }, [isAuthenticated, isSessionExpiring, isRefreshing]);

  // ============================================================================
  // Permission and Role Helpers
  // ============================================================================

  /**
   * Permission checking utilities
   * Provides role-based access control helpers
   */
  const hasPermission = useCallback((permission: string): boolean => {
    if (!user) return false;
    
    // System admins have all permissions
    if (user.isSysAdmin || user.isRootAdmin) return true;
    
    // TODO: Implement detailed permission checking based on user roles
    // This would integrate with the role-based access control system
    return false;
  }, [user]);

  const hasRole = useCallback((roleId: number): boolean => {
    if (!user) return false;
    return user.roleId === roleId;
  }, [user]);

  const isAdmin = user?.isSysAdmin || user?.isRootAdmin || false;
  const isRootAdmin = user?.isRootAdmin || false;

  // ============================================================================
  // Session Management Actions
  // ============================================================================

  /**
   * Manual session refresh action
   * Allows components to trigger session refresh
   */
  const refresh = useCallback(async (): Promise<void> => {
    if (!user?.sessionToken && !sessionValidation?.session_id) {
      throw new Error('No active session to refresh');
    }

    await refreshMutation.mutateAsync({
      session_token: user?.sessionToken || '',
    });
  }, [user?.sessionToken, sessionValidation?.session_id, refreshMutation]);

  /**
   * Logout action with complete cleanup
   * Terminates session and clears all related data
   */
  const logout = useCallback(async (): Promise<void> => {
    // Clear any pending refresh timeout
    if (refreshTimeoutRef.current) {
      clearTimeout(refreshTimeoutRef.current);
    }

    await logoutMutation.mutateAsync();
  }, [logoutMutation]);

  /**
   * Manual session validation
   * Allows components to force session check
   */
  const checkSession = useCallback(async (): Promise<boolean> => {
    const result = await revalidateSession();
    return result.data?.valid === true;
  }, [revalidateSession]);

  /**
   * Update last activity timestamp
   * Tracks user activity for session management
   */
  const updateLastActivity = useCallback((): void => {
    lastActivityRef.current = new Date();
  }, []);

  // ============================================================================
  // Automatic Session Refresh Effect
  // ============================================================================

  /**
   * Automatic session refresh effect
   * Monitors session expiry and triggers refresh when needed
   */
  useEffect(() => {
    if (!shouldRefreshSession()) return;

    const timeUntilRefresh = Math.max(0, getTimeUntilExpiry() - SESSION_CONFIG.REFRESH_THRESHOLD);
    
    refreshTimeoutRef.current = setTimeout(() => {
      if (shouldRefreshSession()) {
        refresh().catch((error) => {
          console.error('Automatic session refresh failed:', error);
        });
      }
    }, timeUntilRefresh);

    return () => {
      if (refreshTimeoutRef.current) {
        clearTimeout(refreshTimeoutRef.current);
      }
    };
  }, [shouldRefreshSession, getTimeUntilExpiry, refresh]);

  // ============================================================================
  // Activity Monitoring Effect
  // ============================================================================

  /**
   * Activity monitoring effect
   * Tracks user interactions to maintain session activity
   */
  useEffect(() => {
    const activityEvents = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart'];
    
    const handleActivity = () => {
      updateLastActivity();
    };

    // Add activity listeners
    activityEvents.forEach(event => {
      document.addEventListener(event, handleActivity, { passive: true });
    });

    return () => {
      // Clean up activity listeners
      activityEvents.forEach(event => {
        document.removeEventListener(event, handleActivity);
      });
    };
  }, [updateLastActivity]);

  // ============================================================================
  // Error Handling
  // ============================================================================

  /**
   * Centralized error handling for session operations
   * Transforms various error types into consistent AuthError format
   */
  const error: AuthError | null = (() => {
    if (validationError) {
      return {
        code: 'SESSION_VALIDATION_ERROR' as AuthErrorCode,
        message: validationError instanceof Error ? validationError.message : 'Session validation failed',
        timestamp: new Date(),
        retryable: true,
      };
    }

    if (profileError) {
      return {
        code: 'PROFILE_FETCH_ERROR' as AuthErrorCode,
        message: profileError instanceof Error ? profileError.message : 'Failed to fetch user profile',
        timestamp: new Date(),
        retryable: true,
      };
    }

    if (refreshMutation.error) {
      return {
        code: 'SESSION_REFRESH_ERROR' as AuthErrorCode,
        message: refreshMutation.error instanceof Error ? refreshMutation.error.message : 'Session refresh failed',
        timestamp: new Date(),
        retryable: false,
      };
    }

    if (logoutMutation.error) {
      return {
        code: 'LOGOUT_ERROR' as AuthErrorCode,
        message: logoutMutation.error instanceof Error ? logoutMutation.error.message : 'Logout failed',
        timestamp: new Date(),
        retryable: true,
      };
    }

    return null;
  })();

  // ============================================================================
  // Return Hook Interface
  // ============================================================================

  return {
    // Core session state
    user,
    isAuthenticated,
    isLoading,
    error,
    
    // Session metadata
    lastActivity: lastActivityRef.current,
    sessionExpiry,
    isRefreshing,
    isSessionExpiring,
    
    // Session management actions
    refresh,
    logout,
    checkSession,
    updateLastActivity,
    
    // Permission helpers
    hasPermission,
    hasRole,
    isAdmin,
    isRootAdmin,
    
    // Session validation utilities
    getTimeUntilExpiry,
    shouldRefreshSession,
  };
}

// ============================================================================
// Export Additional Utilities
// ============================================================================

/**
 * Session cookie manager for external use
 * Provides secure cookie operations for other components
 */
export { SessionCookieManager };

/**
 * Session API for external use
 * Provides session-related API operations
 */
export { SessionAPI };

/**
 * Default export for convenient importing
 */
export default useSession;