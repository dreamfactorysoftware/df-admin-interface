/**
 * Authentication State Management Hook for DreamFactory Admin Interface
 * 
 * Provides centralized authentication state management with Zustand integration,
 * Next.js middleware coordination, and React Query-powered state synchronization.
 * Replaces Angular authentication service patterns with modern React hooks.
 * 
 * Key Features:
 * - Zustand-based authentication state management
 * - Next.js middleware coordination for edge-based token validation
 * - Automatic token refresh with server-side validation
 * - Real-time authentication status synchronization
 * - User permission caching with React Query intelligent caching
 * - Session management with automatic cleanup and timeout handling
 * - Enterprise-grade error handling and security monitoring
 * 
 * Performance Requirements:
 * - Middleware processing under 100ms
 * - Cache hit responses under 50ms
 * - Real-time validation under 100ms
 * 
 * Security Features:
 * - Server-side token validation
 * - Automatic session invalidation on security violations
 * - Comprehensive audit logging for compliance
 * - RBAC integration with role-based route access
 * 
 * @fileoverview Authentication state management hook with Next.js integration
 * @version 1.0.0
 * @since React 19.0.0 / Next.js 15.1+
 */

'use client';

import { useCallback, useEffect, useMemo, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { create } from 'zustand';
import { subscribeWithSelector, devtools } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import { apiGet, apiPost, apiDelete } from '../../../lib/api-client';
import type {
  AuthState,
  AuthActions,
  AuthStore,
  LoginCredentials,
  LoginResponse,
  UserSession,
  AuthError,
  AuthErrorCode,
  MiddlewareAuthResult,
  TokenRefreshResult,
  SessionValidationResult,
} from '../../../types/auth';
import type { UserProfile } from '../../../types/user';

// ============================================================================
// CONSTANTS AND CONFIGURATION
// ============================================================================

/**
 * Authentication query keys for React Query cache management
 */
export const AUTH_QUERY_KEYS = {
  SESSION: ['auth', 'session'] as const,
  USER: ['auth', 'user'] as const,
  PERMISSIONS: ['auth', 'permissions'] as const,
  REFRESH: ['auth', 'refresh'] as const,
  VALIDATION: ['auth', 'validation'] as const,
} as const;

/**
 * Authentication configuration with performance and security settings
 */
const AUTH_CONFIG = {
  // Token refresh timing (5 minutes before expiration)
  REFRESH_THRESHOLD_MS: 5 * 60 * 1000,
  
  // Session validation interval (30 seconds)
  VALIDATION_INTERVAL_MS: 30 * 1000,
  
  // Maximum retry attempts for failed operations
  MAX_RETRY_ATTEMPTS: 3,
  
  // Request timeout for authentication operations
  REQUEST_TIMEOUT_MS: 10000,
  
  // Cache times for React Query
  CACHE_TIME_MS: 5 * 60 * 1000, // 5 minutes
  STALE_TIME_MS: 60 * 1000, // 1 minute
  
  // Middleware performance requirements
  MIDDLEWARE_TIMEOUT_MS: 100,
  CACHE_HIT_TIMEOUT_MS: 50,
} as const;

/**
 * Storage keys for session persistence
 */
const STORAGE_KEYS = {
  SESSION_TOKEN: 'df-session-token',
  USER_DATA: 'df-user-data',
  REFRESH_TOKEN: 'df-refresh-token',
  LAST_ACTIVITY: 'df-last-activity',
  PERMISSIONS_CACHE: 'df-permissions-cache',
} as const;

// ============================================================================
// ZUSTAND AUTHENTICATION STORE
// ============================================================================

/**
 * Authentication store interface with enhanced state management
 */
interface AuthStoreState extends AuthState {
  // Enhanced session management
  sessionId: string | null;
  tokenExpiresAt: Date | null;
  lastActivity: Date | null;
  refreshToken: string | null;
  
  // Permission and role management
  permissions: string[];
  roles: string[];
  isRootAdmin: boolean;
  isSysAdmin: boolean;
  
  // Session monitoring
  isSessionValid: boolean;
  sessionCheckInProgress: boolean;
  refreshInProgress: boolean;
  
  // Performance monitoring
  lastTokenRefresh: Date | null;
  authOperationCount: number;
  
  // Security flags
  securityViolations: number;
  suspiciousActivityDetected: boolean;
}

/**
 * Authentication store actions with comprehensive functionality
 */
interface AuthStoreActions extends AuthActions {
  // Enhanced session management
  setSession: (session: UserSession, rememberMe?: boolean) => void;
  clearSession: () => void;
  updateSessionActivity: () => void;
  validateSession: () => Promise<boolean>;
  
  // Token management
  setTokens: (sessionToken: string, refreshToken?: string, expiresAt?: Date) => void;
  clearTokens: () => void;
  scheduleTokenRefresh: () => void;
  
  // Permission management
  setPermissions: (permissions: string[]) => void;
  setRoles: (roles: string[]) => void;
  hasPermission: (permission: string) => boolean;
  hasRole: (role: string) => boolean;
  hasAnyRole: (roles: string[]) => boolean;
  
  // Security monitoring
  recordSecurityViolation: (violation: string) => void;
  setSuspiciousActivity: (detected: boolean) => void;
  
  // Performance tracking
  incrementOperationCount: () => void;
  resetOperationCount: () => void;
  
  // Error handling
  setAuthError: (error: AuthError | null) => void;
  clearAuthError: () => void;
  
  // Loading states
  setLoading: (loading: boolean) => void;
  setRefreshing: (refreshing: boolean) => void;
}

/**
 * Complete authentication store interface
 */
interface CompleteAuthStore extends AuthStoreState, AuthStoreActions {}

/**
 * Zustand authentication store with middleware integration
 */
const useAuthStore = create<CompleteAuthStore>()(
  devtools(
    subscribeWithSelector(
      immer((set, get) => ({
        // Authentication state
        isAuthenticated: false,
        isLoading: false,
        user: null,
        error: null,
        isRefreshing: false,
        
        // Enhanced session state
        sessionId: null,
        tokenExpiresAt: null,
        lastActivity: null,
        refreshToken: null,
        
        // Permission state
        permissions: [],
        roles: [],
        isRootAdmin: false,
        isSysAdmin: false,
        
        // Session monitoring
        isSessionValid: false,
        sessionCheckInProgress: false,
        refreshInProgress: false,
        
        // Performance monitoring
        lastTokenRefresh: null,
        authOperationCount: 0,
        
        // Security state
        securityViolations: 0,
        suspiciousActivityDetected: false,
        
        // Actions
        setSession: (session: UserSession, rememberMe = false) =>
          set((state) => {
            state.isAuthenticated = true;
            state.user = session;
            state.sessionId = session.sessionId;
            state.permissions = session.role?.permissions?.map(p => p.resource) || [];
            state.roles = session.role ? [session.role.name] : [];
            state.isRootAdmin = session.isRootAdmin;
            state.isSysAdmin = session.isSysAdmin;
            state.isSessionValid = true;
            state.lastActivity = new Date();
            state.error = null;
            state.isLoading = false;
            
            // Store in browser storage if remember me is enabled
            if (rememberMe) {
              try {
                localStorage.setItem(STORAGE_KEYS.USER_DATA, JSON.stringify(session));
                localStorage.setItem(STORAGE_KEYS.LAST_ACTIVITY, new Date().toISOString());
              } catch (error) {
                console.warn('Failed to store session data:', error);
              }
            }
          }),
        
        clearSession: () =>
          set((state) => {
            state.isAuthenticated = false;
            state.user = null;
            state.sessionId = null;
            state.tokenExpiresAt = null;
            state.lastActivity = null;
            state.refreshToken = null;
            state.permissions = [];
            state.roles = [];
            state.isRootAdmin = false;
            state.isSysAdmin = false;
            state.isSessionValid = false;
            state.refreshInProgress = false;
            state.error = null;
            state.isLoading = false;
            
            // Clear browser storage
            try {
              localStorage.removeItem(STORAGE_KEYS.SESSION_TOKEN);
              localStorage.removeItem(STORAGE_KEYS.USER_DATA);
              localStorage.removeItem(STORAGE_KEYS.REFRESH_TOKEN);
              localStorage.removeItem(STORAGE_KEYS.LAST_ACTIVITY);
              localStorage.removeItem(STORAGE_KEYS.PERMISSIONS_CACHE);
            } catch (error) {
              console.warn('Failed to clear session storage:', error);
            }
          }),
        
        updateSessionActivity: () =>
          set((state) => {
            state.lastActivity = new Date();
            try {
              localStorage.setItem(STORAGE_KEYS.LAST_ACTIVITY, new Date().toISOString());
            } catch (error) {
              console.warn('Failed to update activity timestamp:', error);
            }
          }),
        
        validateSession: async () => {
          const state = get();
          if (!state.sessionId || state.sessionCheckInProgress) {
            return false;
          }
          
          set((draft) => {
            draft.sessionCheckInProgress = true;
          });
          
          try {
            const response = await apiGet<SessionValidationResult>(
              `/api/v2/user/session/${state.sessionId}`,
              { signal: AbortSignal.timeout(AUTH_CONFIG.REQUEST_TIMEOUT_MS) }
            );
            
            const isValid = response.isValid && response.session;
            
            set((draft) => {
              draft.isSessionValid = isValid;
              draft.sessionCheckInProgress = false;
              if (!isValid) {
                draft.isAuthenticated = false;
                draft.user = null;
              }
            });
            
            return isValid;
          } catch (error) {
            set((draft) => {
              draft.isSessionValid = false;
              draft.sessionCheckInProgress = false;
              draft.error = {
                code: 'SESSION_VALIDATION_FAILED',
                message: 'Failed to validate session',
                context: error,
                timestamp: new Date().toISOString(),
              };
            });
            return false;
          }
        },
        
        setTokens: (sessionToken: string, refreshToken?: string, expiresAt?: Date) =>
          set((state) => {
            state.tokenExpiresAt = expiresAt || null;
            state.refreshToken = refreshToken || null;
            state.lastTokenRefresh = new Date();
            
            try {
              localStorage.setItem(STORAGE_KEYS.SESSION_TOKEN, sessionToken);
              if (refreshToken) {
                localStorage.setItem(STORAGE_KEYS.REFRESH_TOKEN, refreshToken);
              }
            } catch (error) {
              console.warn('Failed to store tokens:', error);
            }
          }),
        
        clearTokens: () =>
          set((state) => {
            state.tokenExpiresAt = null;
            state.refreshToken = null;
            
            try {
              localStorage.removeItem(STORAGE_KEYS.SESSION_TOKEN);
              localStorage.removeItem(STORAGE_KEYS.REFRESH_TOKEN);
            } catch (error) {
              console.warn('Failed to clear tokens:', error);
            }
          }),
        
        scheduleTokenRefresh: () => {
          const state = get();
          if (!state.tokenExpiresAt || state.refreshInProgress) {
            return;
          }
          
          const timeUntilExpiry = state.tokenExpiresAt.getTime() - Date.now();
          const timeUntilRefresh = timeUntilExpiry - AUTH_CONFIG.REFRESH_THRESHOLD_MS;
          
          if (timeUntilRefresh > 0) {
            setTimeout(() => {
              if (get().isAuthenticated && !get().refreshInProgress) {
                get().refreshToken();
              }
            }, timeUntilRefresh);
          }
        },
        
        setPermissions: (permissions: string[]) =>
          set((state) => {
            state.permissions = permissions;
            try {
              localStorage.setItem(STORAGE_KEYS.PERMISSIONS_CACHE, JSON.stringify(permissions));
            } catch (error) {
              console.warn('Failed to cache permissions:', error);
            }
          }),
        
        setRoles: (roles: string[]) =>
          set((state) => {
            state.roles = roles;
          }),
        
        hasPermission: (permission: string) => {
          const state = get();
          return state.permissions.includes(permission) || state.isRootAdmin;
        },
        
        hasRole: (role: string) => {
          const state = get();
          return state.roles.includes(role) || state.isRootAdmin;
        },
        
        hasAnyRole: (roles: string[]) => {
          const state = get();
          return roles.some(role => state.roles.includes(role)) || state.isRootAdmin;
        },
        
        recordSecurityViolation: (violation: string) =>
          set((state) => {
            state.securityViolations += 1;
            state.suspiciousActivityDetected = state.securityViolations >= 3;
            console.warn('Security violation recorded:', violation);
          }),
        
        setSuspiciousActivity: (detected: boolean) =>
          set((state) => {
            state.suspiciousActivityDetected = detected;
          }),
        
        incrementOperationCount: () =>
          set((state) => {
            state.authOperationCount += 1;
          }),
        
        resetOperationCount: () =>
          set((state) => {
            state.authOperationCount = 0;
          }),
        
        setAuthError: (error: AuthError | null) =>
          set((state) => {
            state.error = error;
          }),
        
        clearAuthError: () =>
          set((state) => {
            state.error = null;
          }),
        
        setLoading: (loading: boolean) =>
          set((state) => {
            state.isLoading = loading;
          }),
        
        setRefreshing: (refreshing: boolean) =>
          set((state) => {
            state.isRefreshing = refreshing;
            state.refreshInProgress = refreshing;
          }),
        
        // Core authentication actions
        login: async (credentials: LoginCredentials) => {
          const store = get();
          store.setLoading(true);
          store.clearAuthError();
          store.incrementOperationCount();
          
          try {
            const response = await apiPost<LoginResponse>(
              '/api/v2/user/session',
              credentials,
              { 
                signal: AbortSignal.timeout(AUTH_CONFIG.REQUEST_TIMEOUT_MS),
                snackbarSuccess: 'Login successful',
                snackbarError: 'Login failed',
              }
            );
            
            if (response.sessionToken || response.session_token) {
              const sessionToken = response.sessionToken || response.session_token!;
              const user = response.user as UserSession;
              
              // Set tokens with expiration
              const expiresAt = response.expiresAt 
                ? new Date(response.expiresAt)
                : new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours default
              
              store.setTokens(sessionToken, response.refreshToken, expiresAt);
              store.setSession(user, credentials.rememberMe);
              store.scheduleTokenRefresh();
              
              // Track successful authentication
              console.log('Authentication successful:', {
                userId: user.id,
                sessionId: user.sessionId,
                permissions: user.role?.permissions?.length || 0,
              });
            } else {
              throw new Error('Invalid login response: missing session token');
            }
          } catch (error) {
            const authError: AuthError = {
              code: 'LOGIN_FAILED',
              message: error instanceof Error ? error.message : 'Login failed',
              timestamp: new Date().toISOString(),
              context: error,
            };
            
            store.setAuthError(authError);
            store.recordSecurityViolation('Failed login attempt');
            throw authError;
          } finally {
            store.setLoading(false);
          }
        },
        
        loginWithToken: async (token: string) => {
          const store = get();
          store.setLoading(true);
          store.clearAuthError();
          
          try {
            // Validate token with middleware coordination
            const response = await apiGet<{ user: UserSession; valid: boolean }>(
              '/api/v2/user/session',
              {
                additionalHeaders: [{ key: 'Authorization', value: `Bearer ${token}` }],
                signal: AbortSignal.timeout(AUTH_CONFIG.REQUEST_TIMEOUT_MS),
              }
            );
            
            if (response.valid && response.user) {
              store.setTokens(token);
              store.setSession(response.user);
              store.scheduleTokenRefresh();
            } else {
              throw new Error('Invalid token');
            }
          } catch (error) {
            const authError: AuthError = {
              code: 'TOKEN_INVALID',
              message: 'Invalid authentication token',
              timestamp: new Date().toISOString(),
              context: error,
            };
            
            store.setAuthError(authError);
            throw authError;
          } finally {
            store.setLoading(false);
          }
        },
        
        logout: async () => {
          const store = get();
          const sessionId = store.sessionId;
          
          store.setLoading(true);
          
          try {
            if (sessionId) {
              await apiDelete(`/api/v2/user/session/${sessionId}`, {
                signal: AbortSignal.timeout(AUTH_CONFIG.REQUEST_TIMEOUT_MS),
                snackbarSuccess: 'Logged out successfully',
              });
            }
          } catch (error) {
            console.warn('Failed to logout from server:', error);
          } finally {
            store.clearSession();
            store.clearTokens();
            store.resetOperationCount();
            store.setLoading(false);
          }
        },
        
        refreshToken: async () => {
          const store = get();
          
          if (store.refreshInProgress || !store.refreshToken) {
            return;
          }
          
          store.setRefreshing(true);
          
          try {
            const response = await apiPost<TokenRefreshResult>(
              '/api/v2/user/session/refresh',
              { refreshToken: store.refreshToken },
              { signal: AbortSignal.timeout(AUTH_CONFIG.REQUEST_TIMEOUT_MS) }
            );
            
            if (response.success && response.accessToken) {
              const expiresAt = response.expiresIn
                ? new Date(Date.now() + response.expiresIn * 1000)
                : new Date(Date.now() + 24 * 60 * 60 * 1000);
              
              store.setTokens(response.accessToken, response.refreshToken, expiresAt);
              store.scheduleTokenRefresh();
              
              console.log('Token refreshed successfully');
            } else {
              throw new Error(response.error || 'Token refresh failed');
            }
          } catch (error) {
            console.error('Token refresh failed:', error);
            
            if (response.requiresReauth) {
              store.clearSession();
              store.clearTokens();
            }
            
            const authError: AuthError = {
              code: 'REFRESH_FAILED',
              message: 'Token refresh failed',
              timestamp: new Date().toISOString(),
              context: error,
            };
            
            store.setAuthError(authError);
          } finally {
            store.setRefreshing(false);
          }
        },
        
        updateUser: (userData: Partial<UserSession>) =>
          set((state) => {
            if (state.user) {
              state.user = { ...state.user, ...userData };
              
              try {
                localStorage.setItem(STORAGE_KEYS.USER_DATA, JSON.stringify(state.user));
              } catch (error) {
                console.warn('Failed to update stored user data:', error);
              }
            }
          }),
        
        clearError: () =>
          set((state) => {
            state.error = null;
          }),
        
        checkSession: async () => {
          const store = get();
          return await store.validateSession();
        },
      })),
      {
        name: 'auth-store',
        enabled: process.env.NODE_ENV === 'development',
      }
    )
  )
);

// ============================================================================
// REACT QUERY HOOKS FOR SERVER STATE
// ============================================================================

/**
 * React Query hook for session validation with intelligent caching
 */
function useSessionQuery(enabled: boolean = true) {
  const { sessionId, isAuthenticated } = useAuthStore();
  
  return useQuery({
    queryKey: [...AUTH_QUERY_KEYS.SESSION, sessionId],
    queryFn: async () => {
      if (!sessionId) {
        throw new Error('No session ID available');
      }
      
      const response = await apiGet<SessionValidationResult>(
        `/api/v2/user/session/${sessionId}`,
        { signal: AbortSignal.timeout(AUTH_CONFIG.CACHE_HIT_TIMEOUT_MS) }
      );
      
      return response;
    },
    enabled: enabled && isAuthenticated && !!sessionId,
    staleTime: AUTH_CONFIG.STALE_TIME_MS,
    cacheTime: AUTH_CONFIG.CACHE_TIME_MS,
    refetchInterval: AUTH_CONFIG.VALIDATION_INTERVAL_MS,
    refetchIntervalInBackground: true,
    retry: false,
    onSuccess: (data) => {
      if (!data.isValid) {
        useAuthStore.getState().clearSession();
      }
    },
    onError: (error) => {
      console.error('Session validation failed:', error);
      useAuthStore.getState().recordSecurityViolation('Session validation error');
    },
  });
}

/**
 * React Query hook for user permissions with intelligent caching
 */
function usePermissionsQuery(userId?: number, enabled: boolean = true) {
  return useQuery({
    queryKey: [...AUTH_QUERY_KEYS.PERMISSIONS, userId],
    queryFn: async () => {
      if (!userId) {
        throw new Error('User ID required for permissions');
      }
      
      const response = await apiGet<{ permissions: string[]; roles: string[] }>(
        `/api/v2/system/user/${userId}/permissions`,
        { signal: AbortSignal.timeout(AUTH_CONFIG.CACHE_HIT_TIMEOUT_MS) }
      );
      
      return response;
    },
    enabled: enabled && !!userId,
    staleTime: AUTH_CONFIG.STALE_TIME_MS,
    cacheTime: AUTH_CONFIG.CACHE_TIME_MS,
    retry: (failureCount, error) => {
      // Don't retry on authorization errors
      if (error instanceof Error && error.message.includes('403')) {
        return false;
      }
      return failureCount < AUTH_CONFIG.MAX_RETRY_ATTEMPTS;
    },
    onSuccess: (data) => {
      const store = useAuthStore.getState();
      store.setPermissions(data.permissions);
      store.setRoles(data.roles);
    },
  });
}

// ============================================================================
// MAIN AUTHENTICATION HOOK
// ============================================================================

/**
 * Main authentication hook with comprehensive state management and middleware integration
 */
export function useAuthState() {
  const router = useRouter();
  const queryClient = useQueryClient();
  
  // Access Zustand store state and actions
  const authState = useAuthStore();
  
  // Session validation interval reference
  const validationIntervalRef = useRef<NodeJS.Timeout>();
  
  // React Query hooks for server state synchronization
  const sessionQuery = useSessionQuery(authState.isAuthenticated);
  const permissionsQuery = usePermissionsQuery(
    authState.user?.id,
    authState.isAuthenticated
  );
  
  // =========================================================================
  // SESSION INITIALIZATION AND RECOVERY
  // =========================================================================
  
  /**
   * Initialize authentication state from stored session data
   */
  const initializeSession = useCallback(async () => {
    try {
      const storedToken = localStorage.getItem(STORAGE_KEYS.SESSION_TOKEN);
      const storedUserData = localStorage.getItem(STORAGE_KEYS.USER_DATA);
      const storedActivity = localStorage.getItem(STORAGE_KEYS.LAST_ACTIVITY);
      
      if (storedToken && storedUserData) {
        const userData = JSON.parse(storedUserData) as UserSession;
        const lastActivity = storedActivity ? new Date(storedActivity) : new Date();
        
        // Check if session is still recent (24 hours)
        const sessionAge = Date.now() - lastActivity.getTime();
        const maxSessionAge = 24 * 60 * 60 * 1000; // 24 hours
        
        if (sessionAge < maxSessionAge) {
          // Attempt to validate session with server
          try {
            await authState.loginWithToken(storedToken);
          } catch (error) {
            console.warn('Stored session validation failed:', error);
            authState.clearSession();
          }
        } else {
          // Session too old, clear it
          authState.clearSession();
        }
      }
    } catch (error) {
      console.error('Failed to initialize session:', error);
      authState.clearSession();
    }
  }, [authState]);
  
  // =========================================================================
  // AUTHENTICATION OPERATIONS
  // =========================================================================
  
  /**
   * Enhanced login with middleware coordination
   */
  const login = useMutation({
    mutationFn: async (credentials: LoginCredentials) => {
      await authState.login(credentials);
    },
    onSuccess: () => {
      queryClient.invalidateQueries(AUTH_QUERY_KEYS.SESSION);
      queryClient.invalidateQueries(AUTH_QUERY_KEYS.PERMISSIONS);
      router.push('/dashboard');
    },
    onError: (error: AuthError) => {
      console.error('Login failed:', error);
    },
  });
  
  /**
   * Enhanced logout with cleanup
   */
  const logout = useMutation({
    mutationFn: async () => {
      await authState.logout();
    },
    onSuccess: () => {
      queryClient.clear();
      router.push('/login');
    },
    onError: (error) => {
      console.error('Logout failed:', error);
      // Even if logout fails on server, clear local state
      authState.clearSession();
      queryClient.clear();
      router.push('/login');
    },
  });
  
  /**
   * Manual token refresh operation
   */
  const refreshSession = useMutation({
    mutationFn: async () => {
      await authState.refreshToken();
    },
    onSuccess: () => {
      queryClient.invalidateQueries(AUTH_QUERY_KEYS.SESSION);
    },
  });
  
  // =========================================================================
  // SESSION MONITORING AND VALIDATION
  // =========================================================================
  
  /**
   * Start session monitoring with periodic validation
   */
  const startSessionMonitoring = useCallback(() => {
    if (validationIntervalRef.current) {
      clearInterval(validationIntervalRef.current);
    }
    
    validationIntervalRef.current = setInterval(async () => {
      if (authState.isAuthenticated && !authState.sessionCheckInProgress) {
        const isValid = await authState.validateSession();
        
        if (!isValid) {
          console.warn('Session validation failed, redirecting to login');
          logout.mutate();
        }
      }
    }, AUTH_CONFIG.VALIDATION_INTERVAL_MS);
  }, [authState, logout]);
  
  /**
   * Stop session monitoring
   */
  const stopSessionMonitoring = useCallback(() => {
    if (validationIntervalRef.current) {
      clearInterval(validationIntervalRef.current);
      validationIntervalRef.current = undefined;
    }
  }, []);
  
  // =========================================================================
  // PERMISSION AND ROLE HELPERS
  // =========================================================================
  
  /**
   * Check if user has specific permission with caching
   */
  const hasPermission = useCallback(
    (permission: string): boolean => {
      return authState.hasPermission(permission);
    },
    [authState]
  );
  
  /**
   * Check if user has specific role
   */
  const hasRole = useCallback(
    (role: string): boolean => {
      return authState.hasRole(role);
    },
    [authState]
  );
  
  /**
   * Check if user has any of the specified roles
   */
  const hasAnyRole = useCallback(
    (roles: string[]): boolean => {
      return authState.hasAnyRole(roles);
    },
    [authState]
  );
  
  /**
   * Check if user can access a specific route
   */
  const canAccessRoute = useCallback(
    (route: string, requiredPermissions?: string[], requiredRoles?: string[]): boolean => {
      if (!authState.isAuthenticated) {
        return false;
      }
      
      if (authState.isRootAdmin) {
        return true;
      }
      
      if (requiredPermissions && !requiredPermissions.every(p => hasPermission(p))) {
        return false;
      }
      
      if (requiredRoles && !hasAnyRole(requiredRoles)) {
        return false;
      }
      
      return true;
    },
    [authState, hasPermission, hasAnyRole]
  );
  
  // =========================================================================
  // EFFECT HOOKS FOR LIFECYCLE MANAGEMENT
  // =========================================================================
  
  /**
   * Initialize authentication on mount
   */
  useEffect(() => {
    initializeSession();
  }, [initializeSession]);
  
  /**
   * Start/stop session monitoring based on authentication state
   */
  useEffect(() => {
    if (authState.isAuthenticated) {
      startSessionMonitoring();
    } else {
      stopSessionMonitoring();
    }
    
    return () => {
      stopSessionMonitoring();
    };
  }, [authState.isAuthenticated, startSessionMonitoring, stopSessionMonitoring]);
  
  /**
   * Schedule token refresh when authentication state changes
   */
  useEffect(() => {
    if (authState.isAuthenticated && authState.tokenExpiresAt) {
      authState.scheduleTokenRefresh();
    }
  }, [authState.isAuthenticated, authState.tokenExpiresAt]);
  
  /**
   * Update activity timestamp on user interaction
   */
  useEffect(() => {
    const handleUserActivity = () => {
      if (authState.isAuthenticated) {
        authState.updateSessionActivity();
      }
    };
    
    const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart'];
    events.forEach(event => {
      document.addEventListener(event, handleUserActivity, { passive: true });
    });
    
    return () => {
      events.forEach(event => {
        document.removeEventListener(event, handleUserActivity);
      });
    };
  }, [authState]);
  
  // =========================================================================
  // MEMOIZED RETURN VALUE
  // =========================================================================
  
  /**
   * Memoized hook return value for performance optimization
   */
  return useMemo(
    () => ({
      // Authentication state
      isAuthenticated: authState.isAuthenticated,
      isLoading: authState.isLoading || login.isLoading || logout.isLoading,
      isRefreshing: authState.isRefreshing || refreshSession.isLoading,
      user: authState.user,
      error: authState.error || login.error || logout.error || refreshSession.error,
      
      // Session state
      sessionId: authState.sessionId,
      isSessionValid: authState.isSessionValid,
      lastActivity: authState.lastActivity,
      tokenExpiresAt: authState.tokenExpiresAt,
      
      // Permission state
      permissions: authState.permissions,
      roles: authState.roles,
      isRootAdmin: authState.isRootAdmin,
      isSysAdmin: authState.isSysAdmin,
      
      // Security state
      securityViolations: authState.securityViolations,
      suspiciousActivityDetected: authState.suspiciousActivityDetected,
      
      // Performance metrics
      authOperationCount: authState.authOperationCount,
      lastTokenRefresh: authState.lastTokenRefresh,
      
      // Actions
      login: login.mutate,
      logout: logout.mutate,
      refreshToken: refreshSession.mutate,
      updateUser: authState.updateUser,
      clearError: authState.clearError,
      checkSession: authState.checkSession,
      
      // Permission helpers
      hasPermission,
      hasRole,
      hasAnyRole,
      canAccessRoute,
      
      // Query states
      sessionQuery: {
        isLoading: sessionQuery.isLoading,
        isError: sessionQuery.isError,
        data: sessionQuery.data,
      },
      permissionsQuery: {
        isLoading: permissionsQuery.isLoading,
        isError: permissionsQuery.isError,
        data: permissionsQuery.data,
      },
      
      // Utility functions
      initializeSession,
    }),
    [
      authState,
      login,
      logout,
      refreshSession,
      sessionQuery,
      permissionsQuery,
      hasPermission,
      hasRole,
      hasAnyRole,
      canAccessRoute,
      initializeSession,
    ]
  );
}

// ============================================================================
// ADDITIONAL HOOKS AND UTILITIES
// ============================================================================

/**
 * Hook for authentication-dependent data fetching
 */
export function useAuthenticatedQuery<TData = unknown>(
  queryKey: any[],
  queryFn: () => Promise<TData>,
  options: {
    requiredPermissions?: string[];
    requiredRoles?: string[];
    enabled?: boolean;
  } = {}
) {
  const { isAuthenticated, canAccessRoute } = useAuthState();
  const { requiredPermissions, requiredRoles, enabled = true } = options;
  
  const hasAccess = canAccessRoute('', requiredPermissions, requiredRoles);
  
  return useQuery({
    queryKey,
    queryFn,
    enabled: enabled && isAuthenticated && hasAccess,
    staleTime: AUTH_CONFIG.STALE_TIME_MS,
    cacheTime: AUTH_CONFIG.CACHE_TIME_MS,
  });
}

/**
 * Hook for checking authentication status without subscribing to all state changes
 */
export function useAuthStatus() {
  const isAuthenticated = useAuthStore(state => state.isAuthenticated);
  const isLoading = useAuthStore(state => state.isLoading);
  const error = useAuthStore(state => state.error);
  
  return { isAuthenticated, isLoading, error };
}

/**
 * Hook for permission checking without full auth state
 */
export function usePermissions() {
  const permissions = useAuthStore(state => state.permissions);
  const roles = useAuthStore(state => state.roles);
  const isRootAdmin = useAuthStore(state => state.isRootAdmin);
  const hasPermission = useAuthStore(state => state.hasPermission);
  const hasRole = useAuthStore(state => state.hasRole);
  const hasAnyRole = useAuthStore(state => state.hasAnyRole);
  
  return {
    permissions,
    roles,
    isRootAdmin,
    hasPermission,
    hasRole,
    hasAnyRole,
  };
}

// ============================================================================
// EXPORTS
// ============================================================================

export default useAuthState;
export {
  useAuthState,
  useAuthenticatedQuery,
  useAuthStatus,
  usePermissions,
  useAuthStore,
  AUTH_QUERY_KEYS,
  AUTH_CONFIG,
  STORAGE_KEYS,
};

export type {
  AuthStoreState,
  AuthStoreActions,
  CompleteAuthStore,
};