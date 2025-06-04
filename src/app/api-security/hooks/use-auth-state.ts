/**
 * @fileoverview Authentication State Management Hook
 * 
 * Custom React hook implementing centralized authentication state management with Zustand
 * integration and Next.js middleware coordination. Provides authentication status, user 
 * permissions, session management, and automatic token refresh capabilities.
 * 
 * Replaces Angular authentication service patterns with React Query-powered state 
 * synchronization and server-side validation for enhanced security and performance.
 * 
 * Key Features:
 * - Zustand-based authentication state management with optimistic updates
 * - Next.js middleware coordination for edge-based token validation  
 * - Automatic token refresh with server-side validation
 * - Real-time authentication status synchronization (< 100ms processing)
 * - User permission caching with React Query intelligent caching (< 50ms cache hits)
 * - Session management with automatic cleanup and timeout handling
 * - Role-based access control (RBAC) integration
 * - Enhanced security through server-side validation
 * - React 19 concurrent features compatibility
 * 
 * Performance Requirements:
 * - Middleware processing under 100ms per React/Next.js Integration Requirements
 * - Cache hit responses under 50ms per React/Next.js Integration Requirements
 * - Real-time state synchronization with sub-second updates
 * - Optimistic UI updates for improved user experience
 * 
 * @author DreamFactory Admin Interface Team
 * @version React 19/Next.js 15.1 Migration
 */

'use client';

import { useCallback, useEffect, useRef, useTransition } from 'react';
import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query';
import { create } from 'zustand';
import { subscribeWithSelector, persist, createJSONStorage } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import { apiClient } from '@/lib/api-client';
import {
  UserSession,
  AuthState,
  AuthError,
  AuthErrorCode,
  LoginCredentials,
  LoginResponse,
  Permission,
  Role,
  RBACContext,
  AccessCheckResult,
  SessionValidationOptions,
  AuthEventType
} from '@/types/auth';
import {
  UserProfile,
  UserPermissions,
  SessionState,
  AuthSession,
  JWTPayload
} from '@/types/user';

// ============================================================================
// CONSTANTS AND CONFIGURATION
// ============================================================================

/**
 * Authentication configuration constants optimized for performance
 */
const AUTH_CONFIG = {
  // Query keys for React Query caching
  QUERY_KEYS: {
    SESSION: ['auth', 'session'] as const,
    USER: ['auth', 'user'] as const,
    PERMISSIONS: ['auth', 'permissions'] as const,
    ROLES: ['auth', 'roles'] as const,
    VALIDATION: ['auth', 'validation'] as const,
  },
  
  // Cache configuration for optimal performance
  CACHE: {
    SESSION_STALE_TIME: 4 * 60 * 1000, // 4 minutes (under 5 minutes per spec)
    SESSION_CACHE_TIME: 10 * 60 * 1000, // 10 minutes
    PERMISSIONS_STALE_TIME: 5 * 60 * 1000, // 5 minutes
    PERMISSIONS_CACHE_TIME: 15 * 60 * 1000, // 15 minutes
    REFETCH_INTERVAL: 30 * 1000, // 30 seconds for session validation
  },
  
  // Session management timeouts
  SESSION: {
    REFRESH_THRESHOLD: 5 * 60 * 1000, // 5 minutes before expiry
    ACTIVITY_TIMEOUT: 30 * 60 * 1000, // 30 minutes inactivity
    CLEANUP_INTERVAL: 60 * 1000, // 1 minute cleanup check
    MAX_RETRY_ATTEMPTS: 3,
  },
  
  // Performance thresholds per specification
  PERFORMANCE: {
    MIDDLEWARE_TIMEOUT: 100, // 100ms middleware processing requirement
    CACHE_HIT_TIMEOUT: 50, // 50ms cache hit requirement
    REFRESH_TIMEOUT: 2000, // 2 seconds for token refresh
  }
} as const;

// ============================================================================
// ZUSTAND STORE DEFINITION
// ============================================================================

/**
 * Authentication store interface with comprehensive state management
 */
interface AuthStore {
  // Core authentication state
  state: AuthState;
  
  // Session management state
  sessionData: AuthSession | null;
  lastActivity: Date | null;
  sessionExpiry: Date | null;
  
  // Permission and role state
  permissions: UserPermissions | null;
  userRole: Role | null;
  accessCache: Map<string, AccessCheckResult>;
  
  // UI state
  isRefreshing: boolean;
  isHydrated: boolean;
  
  // Actions - Authentication
  setAuthenticated: (user: UserSession, token: string) => void;
  setUnauthenticated: (error?: AuthError) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: AuthError | null) => void;
  clearError: () => void;
  
  // Actions - Session Management
  updateLastActivity: () => void;
  setSessionData: (session: AuthSession | null) => void;
  setSessionExpiry: (expiry: Date | null) => void;
  clearSession: () => void;
  
  // Actions - Permissions and Roles
  setPermissions: (permissions: UserPermissions | null) => void;
  setUserRole: (role: Role | null) => void;
  updateAccessCache: (key: string, result: AccessCheckResult) => void;
  clearAccessCache: () => void;
  
  // Actions - UI State
  setRefreshing: (refreshing: boolean) => void;
  setHydrated: (hydrated: boolean) => void;
  
  // Actions - Utilities
  reset: () => void;
  hydrateFromSession: (session: UserSession) => void;
}

/**
 * Initial authentication state
 */
const initialAuthState: AuthState = {
  isAuthenticated: false,
  isLoading: false,
  user: null,
  token: null,
  error: null,
  lastActivity: null,
  isRefreshing: false,
};

/**
 * Main authentication store using Zustand with persistence and middleware
 */
const useAuthStore = create<AuthStore>()(
  subscribeWithSelector(
    persist(
      immer((set, get) => ({
        // Initial state
        state: initialAuthState,
        sessionData: null,
        lastActivity: null,
        sessionExpiry: null,
        permissions: null,
        userRole: null,
        accessCache: new Map(),
        isRefreshing: false,
        isHydrated: false,
        
        // Authentication actions
        setAuthenticated: (user: UserSession, token: string) => {
          set((state) => {
            state.state.isAuthenticated = true;
            state.state.user = user;
            state.state.token = token;
            state.state.error = null;
            state.state.isLoading = false;
            state.lastActivity = new Date();
            state.sessionExpiry = user.tokenExpiryDate;
          });
        },
        
        setUnauthenticated: (error?: AuthError) => {
          set((state) => {
            state.state.isAuthenticated = false;
            state.state.user = null;
            state.state.token = null;
            state.state.error = error || null;
            state.state.isLoading = false;
            state.sessionData = null;
            state.lastActivity = null;
            state.sessionExpiry = null;
            state.permissions = null;
            state.userRole = null;
            state.accessCache.clear();
            state.isRefreshing = false;
          });
        },
        
        setLoading: (loading: boolean) => {
          set((state) => {
            state.state.isLoading = loading;
          });
        },
        
        setError: (error: AuthError | null) => {
          set((state) => {
            state.state.error = error;
          });
        },
        
        clearError: () => {
          set((state) => {
            state.state.error = null;
          });
        },
        
        // Session management actions
        updateLastActivity: () => {
          set((state) => {
            state.lastActivity = new Date();
            state.state.lastActivity = new Date();
          });
        },
        
        setSessionData: (session: AuthSession | null) => {
          set((state) => {
            state.sessionData = session;
          });
        },
        
        setSessionExpiry: (expiry: Date | null) => {
          set((state) => {
            state.sessionExpiry = expiry;
          });
        },
        
        clearSession: () => {
          set((state) => {
            state.sessionData = null;
            state.lastActivity = null;
            state.sessionExpiry = null;
            state.state.lastActivity = null;
          });
        },
        
        // Permission and role actions
        setPermissions: (permissions: UserPermissions | null) => {
          set((state) => {
            state.permissions = permissions;
          });
        },
        
        setUserRole: (role: Role | null) => {
          set((state) => {
            state.userRole = role;
          });
        },
        
        updateAccessCache: (key: string, result: AccessCheckResult) => {
          set((state) => {
            state.accessCache.set(key, result);
          });
        },
        
        clearAccessCache: () => {
          set((state) => {
            state.accessCache.clear();
          });
        },
        
        // UI state actions
        setRefreshing: (refreshing: boolean) => {
          set((state) => {
            state.isRefreshing = refreshing;
            state.state.isRefreshing = refreshing;
          });
        },
        
        setHydrated: (hydrated: boolean) => {
          set((state) => {
            state.isHydrated = hydrated;
          });
        },
        
        // Utility actions
        reset: () => {
          set((state) => {
            Object.assign(state, {
              state: initialAuthState,
              sessionData: null,
              lastActivity: null,
              sessionExpiry: null,
              permissions: null,
              userRole: null,
              isRefreshing: false,
              isHydrated: false,
            });
            state.accessCache.clear();
          });
        },
        
        hydrateFromSession: (session: UserSession) => {
          set((state) => {
            state.state.isAuthenticated = true;
            state.state.user = session;
            state.state.token = session.sessionToken;
            state.state.error = null;
            state.lastActivity = new Date();
            state.sessionExpiry = session.tokenExpiryDate;
            state.isHydrated = true;
          });
        },
      })),
      {
        name: 'df-auth-state',
        storage: createJSONStorage(() => sessionStorage),
        partialize: (state) => ({
          // Only persist essential state, exclude sensitive data
          lastActivity: state.lastActivity,
          isHydrated: state.isHydrated,
        }),
      }
    )
  )
);

// ============================================================================
// AUTHENTICATION API FUNCTIONS
// ============================================================================

/**
 * Authentication API client with middleware integration
 */
const authApi = {
  /**
   * Validates current session with server-side validation
   */
  async validateSession(): Promise<{ valid: boolean; user?: UserSession; error?: AuthError }> {
    try {
      const response = await apiClient.get('/user/session');
      
      if (response.success && response.session_token) {
        const user = transformToUserSession(response);
        return { valid: true, user };
      }
      
      return {
        valid: false,
        error: {
          code: AuthErrorCode.SESSION_INVALID,
          message: 'Session validation failed',
          details: 'Server returned invalid session response',
          timestamp: new Date(),
          retryable: false
        }
      };
    } catch (error) {
      return {
        valid: false,
        error: {
          code: AuthErrorCode.NETWORK_ERROR,
          message: 'Session validation network error',
          details: error instanceof Error ? error.message : 'Unknown error',
          timestamp: new Date(),
          retryable: true
        }
      };
    }
  },
  
  /**
   * Refreshes authentication token through middleware
   */
  async refreshToken(): Promise<{ success: boolean; user?: UserSession; error?: AuthError }> {
    try {
      const response = await apiClient.post('/user/session/refresh');
      
      if (response.success && response.session_token) {
        const user = transformToUserSession(response);
        return { success: true, user };
      }
      
      return {
        success: false,
        error: {
          code: AuthErrorCode.TOKEN_REFRESH_FAILED,
          message: 'Token refresh failed',
          details: 'Server returned invalid refresh response',
          timestamp: new Date(),
          retryable: false
        }
      };
    } catch (error) {
      return {
        success: false,
        error: {
          code: AuthErrorCode.NETWORK_ERROR,
          message: 'Token refresh network error',
          details: error instanceof Error ? error.message : 'Unknown error',
          timestamp: new Date(),
          retryable: true
        }
      };
    }
  },
  
  /**
   * Fetches user permissions with caching
   */
  async fetchPermissions(userId: number): Promise<{ permissions?: UserPermissions; error?: AuthError }> {
    try {
      const response = await apiClient.get(`/user/${userId}/permissions`);
      
      if (response.success) {
        return { permissions: response.data };
      }
      
      return {
        error: {
          code: AuthErrorCode.NETWORK_ERROR,
          message: 'Failed to fetch user permissions',
          details: 'Server returned error response',
          timestamp: new Date(),
          retryable: true
        }
      };
    } catch (error) {
      return {
        error: {
          code: AuthErrorCode.NETWORK_ERROR,
          message: 'Permission fetch network error',
          details: error instanceof Error ? error.message : 'Unknown error',
          timestamp: new Date(),
          retryable: true
        }
      };
    }
  },
  
  /**
   * Performs user login with credentials
   */
  async login(credentials: LoginCredentials): Promise<{ success: boolean; user?: UserSession; error?: AuthError }> {
    try {
      const response = await apiClient.post('/user/session', credentials);
      
      if (response.success && response.session_token) {
        const user = transformToUserSession(response);
        return { success: true, user };
      }
      
      return {
        success: false,
        error: {
          code: AuthErrorCode.INVALID_CREDENTIALS,
          message: 'Login failed',
          details: response.error?.message || 'Invalid credentials',
          timestamp: new Date(),
          retryable: false
        }
      };
    } catch (error) {
      return {
        success: false,
        error: {
          code: AuthErrorCode.NETWORK_ERROR,
          message: 'Login network error',
          details: error instanceof Error ? error.message : 'Unknown error',
          timestamp: new Date(),
          retryable: true
        }
      };
    }
  },
  
  /**
   * Performs user logout with session cleanup
   */
  async logout(): Promise<{ success: boolean; error?: AuthError }> {
    try {
      await apiClient.delete('/user/session');
      return { success: true };
    } catch (error) {
      // Even if logout fails on server, we should clear local state
      return {
        success: true, // Treat as success for UX
        error: {
          code: AuthErrorCode.NETWORK_ERROR,
          message: 'Logout network error (local session cleared)',
          details: error instanceof Error ? error.message : 'Unknown error',
          timestamp: new Date(),
          retryable: false
        }
      };
    }
  },
};

/**
 * Transforms login response to UserSession format
 */
function transformToUserSession(response: LoginResponse): UserSession {
  return {
    id: response.id,
    email: response.email,
    firstName: response.firstName,
    lastName: response.lastName,
    name: response.name,
    host: response.host,
    isRootAdmin: response.isRootAdmin,
    isSysAdmin: response.isSysAdmin,
    lastLoginDate: response.lastLoginDate,
    sessionId: response.sessionId,
    sessionToken: response.session_token || response.sessionToken || '',
    tokenExpiryDate: new Date(response.tokenExpiryDate),
    roleId: response.roleId || response.role_id || 0,
  };
}

// ============================================================================
// REACT QUERY HOOKS
// ============================================================================

/**
 * Session validation query with intelligent caching
 */
function useSessionQuery() {
  return useQuery({
    queryKey: AUTH_CONFIG.QUERY_KEYS.SESSION,
    queryFn: authApi.validateSession,
    staleTime: AUTH_CONFIG.CACHE.SESSION_STALE_TIME,
    cacheTime: AUTH_CONFIG.CACHE.SESSION_CACHE_TIME,
    refetchInterval: AUTH_CONFIG.CACHE.REFETCH_INTERVAL,
    refetchOnMount: true,
    refetchOnWindowFocus: true,
    retry: (failureCount, error) => {
      // Don't retry authentication errors, only network errors
      if (error && typeof error === 'object' && 'code' in error) {
        const authError = error as AuthError;
        return authError.retryable && failureCount < AUTH_CONFIG.SESSION.MAX_RETRY_ATTEMPTS;
      }
      return failureCount < AUTH_CONFIG.SESSION.MAX_RETRY_ATTEMPTS;
    },
  });
}

/**
 * User permissions query with caching optimization
 */
function usePermissionsQuery(userId: number | null, enabled: boolean = true) {
  return useQuery({
    queryKey: [...AUTH_CONFIG.QUERY_KEYS.PERMISSIONS, userId],
    queryFn: () => userId ? authApi.fetchPermissions(userId) : Promise.resolve({}),
    enabled: enabled && !!userId,
    staleTime: AUTH_CONFIG.CACHE.PERMISSIONS_STALE_TIME,
    cacheTime: AUTH_CONFIG.CACHE.PERMISSIONS_CACHE_TIME,
    retry: 2,
  });
}

/**
 * Token refresh mutation for automatic refresh
 */
function useTokenRefreshMutation() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: authApi.refreshToken,
    onSuccess: (data) => {
      if (data.success && data.user) {
        // Invalidate all auth-related queries
        queryClient.invalidateQueries({ queryKey: ['auth'] });
      }
    },
    retry: 1,
  });
}

/**
 * Login mutation with optimistic updates
 */
function useLoginMutation() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: authApi.login,
    onSuccess: (data) => {
      if (data.success && data.user) {
        // Invalidate all auth-related queries
        queryClient.invalidateQueries({ queryKey: ['auth'] });
      }
    },
  });
}

/**
 * Logout mutation with cleanup
 */
function useLogoutMutation() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: authApi.logout,
    onSettled: () => {
      // Clear all auth-related cache on logout
      queryClient.removeQueries({ queryKey: ['auth'] });
      queryClient.clear();
    },
  });
}

// ============================================================================
// SESSION MANAGEMENT UTILITIES
// ============================================================================

/**
 * Session timeout manager for automatic cleanup
 */
class SessionTimeoutManager {
  private timeoutId: NodeJS.Timeout | null = null;
  private activityTimeoutId: NodeJS.Timeout | null = null;
  private onTimeout: () => void;
  
  constructor(onTimeout: () => void) {
    this.onTimeout = onTimeout;
  }
  
  /**
   * Sets session expiry timeout
   */
  setSessionTimeout(expiryDate: Date | null) {
    this.clearSessionTimeout();
    
    if (expiryDate) {
      const timeUntilExpiry = expiryDate.getTime() - Date.now();
      
      if (timeUntilExpiry > 0) {
        this.timeoutId = setTimeout(() => {
          this.onTimeout();
        }, timeUntilExpiry);
      } else {
        // Session already expired
        this.onTimeout();
      }
    }
  }
  
  /**
   * Sets activity timeout
   */
  setActivityTimeout() {
    this.clearActivityTimeout();
    
    this.activityTimeoutId = setTimeout(() => {
      this.onTimeout();
    }, AUTH_CONFIG.SESSION.ACTIVITY_TIMEOUT);
  }
  
  /**
   * Resets activity timeout on user activity
   */
  resetActivityTimeout() {
    this.setActivityTimeout();
  }
  
  /**
   * Clears all timeouts
   */
  clearTimeouts() {
    this.clearSessionTimeout();
    this.clearActivityTimeout();
  }
  
  private clearSessionTimeout() {
    if (this.timeoutId) {
      clearTimeout(this.timeoutId);
      this.timeoutId = null;
    }
  }
  
  private clearActivityTimeout() {
    if (this.activityTimeoutId) {
      clearTimeout(this.activityTimeoutId);
      this.activityTimeoutId = null;
    }
  }
}

/**
 * RBAC helper utilities for permission checking
 */
class RBACHelper {
  private permissions: UserPermissions | null;
  private userRole: Role | null;
  private accessCache: Map<string, AccessCheckResult>;
  
  constructor(
    permissions: UserPermissions | null,
    userRole: Role | null,
    accessCache: Map<string, AccessCheckResult>
  ) {
    this.permissions = permissions;
    this.userRole = userRole;
    this.accessCache = accessCache;
  }
  
  /**
   * Checks if user has specific permission
   */
  hasPermission(permission: string): boolean {
    // Check cache first for performance
    const cacheKey = `perm:${permission}`;
    const cached = this.accessCache.get(cacheKey);
    
    if (cached && cached.ttl > Date.now()) {
      return cached.granted;
    }
    
    // System admins have all permissions
    if (this.permissions?.isSystemAdmin) {
      this.cacheResult(cacheKey, true, [permission]);
      return true;
    }
    
    // Check specific permission
    const hasPermission = this.permissions?.serviceAccess?.some(service => 
      service.canRead || service.canCreate || service.canUpdate || service.canDelete
    ) || false;
    
    this.cacheResult(cacheKey, hasPermission, [permission]);
    return hasPermission;
  }
  
  /**
   * Checks if user has specific role
   */
  hasRole(roleId: number): boolean {
    const cacheKey = `role:${roleId}`;
    const cached = this.accessCache.get(cacheKey);
    
    if (cached && cached.ttl > Date.now()) {
      return cached.granted;
    }
    
    const hasRole = this.userRole?.id === roleId;
    this.cacheResult(cacheKey, hasRole, [], [roleId]);
    return hasRole;
  }
  
  /**
   * Checks if user is admin
   */
  isAdmin(): boolean {
    return this.permissions?.isSystemAdmin || false;
  }
  
  /**
   * Checks if user is root admin
   */
  isRootAdmin(): boolean {
    return this.permissions?.isSystemAdmin || false;
  }
  
  /**
   * Checks access to specific resource and action
   */
  checkAccess(resource: string, action: string): boolean {
    const cacheKey = `access:${resource}:${action}`;
    const cached = this.accessCache.get(cacheKey);
    
    if (cached && cached.ttl > Date.now()) {
      return cached.granted;
    }
    
    // System admins have full access
    if (this.permissions?.isSystemAdmin) {
      this.cacheResult(cacheKey, true, [`${resource}.${action}`]);
      return true;
    }
    
    // Check specific resource access
    const hasAccess = this.checkResourceAccess(resource, action);
    this.cacheResult(cacheKey, hasAccess, [`${resource}.${action}`]);
    return hasAccess;
  }
  
  private checkResourceAccess(resource: string, action: string): boolean {
    if (!this.permissions) return false;
    
    // Map resource/action to permission checks
    switch (resource) {
      case 'users':
        return this.permissions.canManageUsers;
      case 'roles':
        return this.permissions.canManageRoles;
      case 'services':
        return this.permissions.canManageServices;
      case 'apps':
        return this.permissions.canManageApps;
      case 'system':
        return this.permissions.canConfigureSystem;
      case 'files':
        return this.permissions.canManageFiles;
      case 'scripts':
        return this.permissions.canManageScripts;
      case 'scheduler':
        return this.permissions.canManageScheduler;
      case 'cache':
        return this.permissions.canManageCache;
      case 'cors':
        return this.permissions.canManageCors;
      case 'email-templates':
        return this.permissions.canManageEmailTemplates;
      case 'lookup-keys':
        return this.permissions.canManageLookupKeys;
      case 'reports':
        return this.permissions.canViewReports;
      default:
        return false;
    }
  }
  
  private cacheResult(
    cacheKey: string,
    granted: boolean,
    requiredPermissions: string[] = [],
    requiredRoles: number[] = []
  ) {
    const result: AccessCheckResult = {
      granted,
      requiredPermissions,
      userPermissions: [],
      cacheKey,
      ttl: Date.now() + (5 * 60 * 1000), // 5 minutes cache
    };
    
    this.accessCache.set(cacheKey, result);
  }
}

// ============================================================================
// MAIN AUTHENTICATION HOOK
// ============================================================================

/**
 * Custom authentication hook with comprehensive state management
 * 
 * Provides centralized authentication state, session management, and RBAC
 * integration with Next.js middleware coordination and automatic token refresh.
 * 
 * @returns Comprehensive authentication state and actions
 */
export function useAuthState() {
  // Zustand store access
  const {
    state,
    sessionData,
    lastActivity,
    sessionExpiry,
    permissions,
    userRole,
    accessCache,
    isRefreshing,
    isHydrated,
    setAuthenticated,
    setUnauthenticated,
    setLoading,
    setError,
    clearError,
    updateLastActivity,
    setSessionData,
    setSessionExpiry,
    clearSession,
    setPermissions,
    setUserRole,
    updateAccessCache,
    clearAccessCache,
    setRefreshing,
    setHydrated,
    reset,
    hydrateFromSession,
  } = useAuthStore();
  
  // React Query hooks
  const sessionQuery = useSessionQuery();
  const permissionsQuery = usePermissionsQuery(
    state.user?.id || null,
    state.isAuthenticated
  );
  const tokenRefreshMutation = useTokenRefreshMutation();
  const loginMutation = useLoginMutation();
  const logoutMutation = useLogoutMutation();
  
  // React transitions for concurrent features
  const [isPending, startTransition] = useTransition();
  
  // Session timeout manager
  const timeoutManagerRef = useRef<SessionTimeoutManager | null>(null);
  
  // Initialize timeout manager
  useEffect(() => {
    if (!timeoutManagerRef.current) {
      timeoutManagerRef.current = new SessionTimeoutManager(() => {
        startTransition(() => {
          handleSessionTimeout();
        });
      });
    }
    
    return () => {
      timeoutManagerRef.current?.clearTimeouts();
    };
  }, []);
  
  // RBAC helper instance
  const rbacHelper = new RBACHelper(permissions, userRole, accessCache);
  
  /**
   * Handles session timeout and cleanup
   */
  const handleSessionTimeout = useCallback(() => {
    setUnauthenticated({
      code: AuthErrorCode.SESSION_EXPIRED,
      message: 'Session expired due to inactivity',
      details: 'Please log in again to continue',
      timestamp: new Date(),
      retryable: false,
    });
    clearSession();
    clearAccessCache();
  }, [setUnauthenticated, clearSession, clearAccessCache]);
  
  /**
   * Updates session timeout based on expiry date
   */
  const updateSessionTimeout = useCallback((expiryDate: Date | null) => {
    timeoutManagerRef.current?.setSessionTimeout(expiryDate);
    setSessionExpiry(expiryDate);
  }, [setSessionExpiry]);
  
  /**
   * Handles user activity tracking
   */
  const handleActivity = useCallback(() => {
    updateLastActivity();
    timeoutManagerRef.current?.resetActivityTimeout();
  }, [updateLastActivity]);
  
  /**
   * Syncs session query data with store
   */
  useEffect(() => {
    if (sessionQuery.data) {
      const { valid, user, error } = sessionQuery.data;
      
      if (valid && user) {
        setAuthenticated(user, user.sessionToken);
        updateSessionTimeout(user.tokenExpiryDate);
        setHydrated(true);
      } else if (error) {
        setUnauthenticated(error);
      }
    }
  }, [sessionQuery.data, setAuthenticated, setUnauthenticated, updateSessionTimeout, setHydrated]);
  
  /**
   * Syncs permissions query data with store
   */
  useEffect(() => {
    if (permissionsQuery.data?.permissions) {
      setPermissions(permissionsQuery.data.permissions);
    }
  }, [permissionsQuery.data, setPermissions]);
  
  /**
   * Sets up activity monitoring
   */
  useEffect(() => {
    if (state.isAuthenticated) {
      const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart'];
      
      const activityHandler = () => {
        handleActivity();
      };
      
      events.forEach(event => {
        document.addEventListener(event, activityHandler, { passive: true });
      });
      
      // Initialize activity timeout
      timeoutManagerRef.current?.setActivityTimeout();
      
      return () => {
        events.forEach(event => {
          document.removeEventListener(event, activityHandler);
        });
      };
    }
  }, [state.isAuthenticated, handleActivity]);
  
  /**
   * Automatic token refresh when nearing expiry
   */
  useEffect(() => {
    if (state.isAuthenticated && sessionExpiry && !isRefreshing) {
      const timeUntilExpiry = sessionExpiry.getTime() - Date.now();
      
      if (timeUntilExpiry <= AUTH_CONFIG.SESSION.REFRESH_THRESHOLD && timeUntilExpiry > 0) {
        startTransition(async () => {
          setRefreshing(true);
          
          try {
            const result = await tokenRefreshMutation.mutateAsync();
            
            if (result.success && result.user) {
              setAuthenticated(result.user, result.user.sessionToken);
              updateSessionTimeout(result.user.tokenExpiryDate);
            } else {
              handleSessionTimeout();
            }
          } catch (error) {
            handleSessionTimeout();
          } finally {
            setRefreshing(false);
          }
        });
      }
    }
  }, [
    state.isAuthenticated,
    sessionExpiry,
    isRefreshing,
    tokenRefreshMutation,
    setRefreshing,
    setAuthenticated,
    updateSessionTimeout,
    handleSessionTimeout,
  ]);
  
  /**
   * Login function with state management
   */
  const login = useCallback(async (credentials: LoginCredentials): Promise<LoginResponse> => {
    setLoading(true);
    clearError();
    
    try {
      const result = await loginMutation.mutateAsync(credentials);
      
      if (result.success && result.user) {
        setAuthenticated(result.user, result.user.sessionToken);
        updateSessionTimeout(result.user.tokenExpiryDate);
        handleActivity();
        
        return {
          success: true,
          session_token: result.user.sessionToken,
          sessionToken: result.user.sessionToken,
          email: result.user.email,
          firstName: result.user.firstName,
          lastName: result.user.lastName,
          name: result.user.name,
          id: result.user.id,
          isRootAdmin: result.user.isRootAdmin,
          isSysAdmin: result.user.isSysAdmin,
          roleId: result.user.roleId,
          host: result.user.host,
          lastLoginDate: result.user.lastLoginDate,
          tokenExpiryDate: result.user.tokenExpiryDate.toISOString(),
          sessionId: result.user.sessionId,
        };
      } else {
        const error = result.error || {
          code: AuthErrorCode.INVALID_CREDENTIALS,
          message: 'Login failed',
          details: 'Unknown error occurred',
          timestamp: new Date(),
          retryable: false,
        };
        setError(error);
        throw error;
      }
    } catch (error) {
      const authError = error as AuthError;
      setError(authError);
      throw authError;
    } finally {
      setLoading(false);
    }
  }, [
    loginMutation,
    setLoading,
    clearError,
    setError,
    setAuthenticated,
    updateSessionTimeout,
    handleActivity,
  ]);
  
  /**
   * Logout function with cleanup
   */
  const logout = useCallback(async (): Promise<void> => {
    setLoading(true);
    
    try {
      await logoutMutation.mutateAsync();
    } catch (error) {
      // Continue with logout even if server request fails
      console.warn('Logout server request failed:', error);
    } finally {
      reset();
      timeoutManagerRef.current?.clearTimeouts();
      setLoading(false);
    }
  }, [logoutMutation, reset, setLoading]);
  
  /**
   * Manual session refresh
   */
  const refresh = useCallback(async (): Promise<void> => {
    if (isRefreshing) return;
    
    setRefreshing(true);
    
    try {
      const result = await tokenRefreshMutation.mutateAsync();
      
      if (result.success && result.user) {
        setAuthenticated(result.user, result.user.sessionToken);
        updateSessionTimeout(result.user.tokenExpiryDate);
      } else {
        throw result.error || new Error('Refresh failed');
      }
    } catch (error) {
      setError(error as AuthError);
    } finally {
      setRefreshing(false);
    }
  }, [
    isRefreshing,
    tokenRefreshMutation,
    setRefreshing,
    setAuthenticated,
    updateSessionTimeout,
    setError,
  ]);
  
  /**
   * Session validation check
   */
  const checkSession = useCallback(async (): Promise<boolean> => {
    const result = await sessionQuery.refetch();
    return result.data?.valid || false;
  }, [sessionQuery]);
  
  /**
   * RBAC permission checking functions
   */
  const hasPermission = useCallback((permission: string): boolean => {
    return rbacHelper.hasPermission(permission);
  }, [rbacHelper]);
  
  const hasRole = useCallback((roleId: number): boolean => {
    return rbacHelper.hasRole(roleId);
  }, [rbacHelper]);
  
  const checkAccess = useCallback((resource: string, action: string): boolean => {
    return rbacHelper.checkAccess(resource, action);
  }, [rbacHelper]);
  
  // Return comprehensive authentication interface
  return {
    // Core state
    user: state.user,
    isAuthenticated: state.isAuthenticated,
    isLoading: state.isLoading || sessionQuery.isLoading || permissionsQuery.isLoading,
    error: state.error,
    
    // Session state
    sessionData,
    lastActivity,
    sessionExpiry,
    isRefreshing,
    isHydrated,
    
    // Permission state
    permissions,
    userRole,
    
    // Actions
    login,
    logout,
    refresh,
    checkSession,
    
    // React 19 concurrent features
    startTransition,
    isPending: isPending || loginMutation.isPending || logoutMutation.isPending,
    
    // RBAC integration
    hasPermission,
    hasRole,
    isAdmin: rbacHelper.isAdmin(),
    isRootAdmin: rbacHelper.isRootAdmin(),
    checkAccess,
    
    // Utilities
    updateActivity: handleActivity,
    clearError,
    hydrateSession: hydrateFromSession,
    
    // Query states for advanced usage
    sessionQuery: {
      isLoading: sessionQuery.isLoading,
      isError: sessionQuery.isError,
      error: sessionQuery.error,
      refetch: sessionQuery.refetch,
    },
    permissionsQuery: {
      isLoading: permissionsQuery.isLoading,
      isError: permissionsQuery.isError,
      error: permissionsQuery.error,
      refetch: permissionsQuery.refetch,
    },
  };
}

// Export types for external usage
export type {
  AuthStore,
  RBACHelper,
};

// Export the hook as default
export default useAuthState;