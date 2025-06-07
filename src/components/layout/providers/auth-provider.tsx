/**
 * Authentication Context Provider for DreamFactory React/Next.js Admin Interface
 * 
 * React authentication context provider that manages user session state, authentication status,
 * login/logout actions, and user permissions. Replaces Angular DfAuthService and DfUserDataService
 * with React context patterns, integrating with Next.js middleware authentication flow and
 * Zustand state management.
 * 
 * Key Features:
 * - React 19.0.0 stable with enhanced concurrent features for authentication state management
 * - Next.js 15.1+ middleware authentication flow with edge-based JWT validation per Section 4.5.1.1
 * - Zustand 5.0.3 for global client state management of authentication status per Section 3.2.2
 * - TanStack React Query 5.79.2 for user permissions caching with role-based access control per Section 4.5.4
 * - JWT token management with automatic refresh capabilities through Next.js middleware
 * - Comprehensive RBAC enforcement with route protection
 * - Server-side rendering compatibility with Next.js hydration patterns
 * 
 * Architecture:
 * - Converts Angular DfAuthService dependency injection to React Context API
 * - Replaces RxJS observables with React Query mutations and Zustand state management
 * - Implements Next.js middleware-based JWT token validation and automatic refresh
 * - Transforms Angular router navigation to Next.js App Router for login/logout redirects
 * - Integrates user permission caching using TanStack React Query with intelligent deduplication
 * 
 * @fileoverview Authentication provider with React 19 + Next.js 15.1 + Zustand + React Query
 * @version 1.0.0
 * @since React 19.0.0 / Next.js 15.1+ / TypeScript 5.8+
 */

'use client';

import React, { createContext, useContext, useEffect, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import { apiClient } from '@/lib/api-client';
import type {
  AuthState,
  AuthActions,
  AuthContextValue,
  AuthProviderProps,
  AuthProviderConfig,
} from './provider-types';
import type {
  UserProfile,
  AdminProfile,
  UserSession,
  LoginCredentials,
  LoginResponse,
  RegisterDetails,
  ForgetPasswordRequest,
  ResetFormData,
  UpdatePasswordRequest,
  PermissionCheckResult,
  RouteProtection,
  RoleType,
  SystemPermission,
  UserAction,
  TokenRefreshResult,
  SessionValidationResult,
} from '@/types/user';

// ============================================================================
// ZUSTAND STORE DEFINITION
// ============================================================================

/**
 * Zustand store interface for global authentication state management
 * Replaces Angular service patterns with modern React state management
 */
interface AuthStore extends AuthState {
  // State mutation actions
  setUser: (user: UserProfile | AdminProfile | null) => void;
  setSession: (session: UserSession | null) => void;
  setAuthenticated: (isAuthenticated: boolean) => void;
  setLoading: (loadingType: keyof AuthState['loading'], isLoading: boolean) => void;
  setPermissions: (permissions: string[], roles: RoleType[], systemPermissions: SystemPermission[]) => void;
  setSessionMeta: (meta: Partial<AuthState['sessionMeta']>) => void;
  setError: (errorType: keyof AuthState['errors'], error: any) => void;
  clearError: (errorType?: keyof AuthState['errors']) => void;
  clearAllErrors: () => void;
  resetState: () => void;
}

/**
 * Zustand store for authentication state management with persistence
 * Integrates with Next.js SSR and provides global state access across components
 */
const useAuthStore = create<AuthStore>()(
  devtools(
    persist(
      (set, get) => ({
        // Initial state
        user: null,
        session: null,
        isAuthenticated: false,
        loading: {
          isLoading: false,
          isLoggingIn: false,
          isLoggingOut: false,
          isRefreshing: false,
          isRegistering: false,
          isResettingPassword: false,
        },
        permissions: {
          list: [],
          roles: [],
          system: [],
          accessibleRoutes: [],
          restrictedRoutes: [],
        },
        sessionMeta: {
          expiresAt: null,
          lastActivity: null,
          tokenVersion: null,
          requiresRefresh: false,
        },
        errors: {
          auth: null,
          login: null,
          registration: null,
          passwordReset: null,
          sessionRefresh: null,
        },

        // State mutation actions
        setUser: (user) => set({ user }, false, 'auth/setUser'),
        setSession: (session) => set({ session }, false, 'auth/setSession'),
        setAuthenticated: (isAuthenticated) => set({ isAuthenticated }, false, 'auth/setAuthenticated'),
        setLoading: (loadingType, isLoading) =>
          set(
            (state) => ({
              loading: { ...state.loading, [loadingType]: isLoading },
            }),
            false,
            `auth/setLoading/${loadingType}`
          ),
        setPermissions: (list, roles, system) =>
          set(
            (state) => ({
              permissions: {
                ...state.permissions,
                list,
                roles,
                system,
                accessibleRoutes: generateAccessibleRoutes(roles, list),
                restrictedRoutes: generateRestrictedRoutes(roles, list),
              },
            }),
            false,
            'auth/setPermissions'
          ),
        setSessionMeta: (meta) =>
          set(
            (state) => ({
              sessionMeta: { ...state.sessionMeta, ...meta },
            }),
            false,
            'auth/setSessionMeta'
          ),
        setError: (errorType, error) =>
          set(
            (state) => ({
              errors: { ...state.errors, [errorType]: error },
            }),
            false,
            `auth/setError/${errorType}`
          ),
        clearError: (errorType) =>
          set(
            (state) => ({
              errors: errorType
                ? { ...state.errors, [errorType]: null }
                : {
                    auth: null,
                    login: null,
                    registration: null,
                    passwordReset: null,
                    sessionRefresh: null,
                  },
            }),
            false,
            'auth/clearError'
          ),
        clearAllErrors: () =>
          set(
            {
              errors: {
                auth: null,
                login: null,
                registration: null,
                passwordReset: null,
                sessionRefresh: null,
              },
            },
            false,
            'auth/clearAllErrors'
          ),
        resetState: () =>
          set(
            {
              user: null,
              session: null,
              isAuthenticated: false,
              loading: {
                isLoading: false,
                isLoggingIn: false,
                isLoggingOut: false,
                isRefreshing: false,
                isRegistering: false,
                isResettingPassword: false,
              },
              permissions: {
                list: [],
                roles: [],
                system: [],
                accessibleRoutes: [],
                restrictedRoutes: [],
              },
              sessionMeta: {
                expiresAt: null,
                lastActivity: null,
                tokenVersion: null,
                requiresRefresh: false,
              },
              errors: {
                auth: null,
                login: null,
                registration: null,
                passwordReset: null,
                sessionRefresh: null,
              },
            },
            false,
            'auth/resetState'
          ),
      }),
      {
        name: 'dreamfactory-auth-store',
        // Only persist essential data, not loading states or errors
        partialize: (state) => ({
          user: state.user,
          session: state.session,
          isAuthenticated: state.isAuthenticated,
          permissions: state.permissions,
          sessionMeta: state.sessionMeta,
        }),
        skipHydration: true, // Handle hydration manually for Next.js SSR compatibility
      }
    ),
    { name: 'dreamfactory-auth' }
  )
);

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Generate accessible routes based on user roles and permissions
 * Implements RBAC logic for route protection
 */
function generateAccessibleRoutes(roles: RoleType[], permissions: string[]): string[] {
  const accessibleRoutes: string[] = ['/'];

  // Base routes available to all authenticated users
  const baseRoutes = ['/profile', '/dashboard'];
  accessibleRoutes.push(...baseRoutes);

  // Admin routes
  if (roles.some((role) => role.name === 'admin' || role.name === 'sys_admin')) {
    accessibleRoutes.push(
      '/admin-settings',
      '/system-settings',
      '/api-security',
      '/adf-admins',
      '/adf-users',
      '/adf-config'
    );
  }

  // Service management routes
  if (permissions.includes('read_services') || permissions.includes('create_services')) {
    accessibleRoutes.push('/api-connections', '/adf-services');
  }

  // Schema management routes
  if (permissions.includes('read_schema') || permissions.includes('update_schema')) {
    accessibleRoutes.push('/adf-schema');
  }

  // API generation routes
  if (permissions.includes('generate_apis')) {
    accessibleRoutes.push('/adf-api-docs');
  }

  return [...new Set(accessibleRoutes)];
}

/**
 * Generate restricted routes based on user roles and permissions
 * Implements negative RBAC logic for route restrictions
 */
function generateRestrictedRoutes(roles: RoleType[], permissions: string[]): string[] {
  const restrictedRoutes: string[] = [];

  // Restrict admin routes for non-admin users
  if (!roles.some((role) => role.name === 'admin' || role.name === 'sys_admin')) {
    restrictedRoutes.push(
      '/admin-settings',
      '/system-settings',
      '/adf-admins',
      '/adf-config/df-system-info'
    );
  }

  // Restrict service management for users without service permissions
  if (!permissions.includes('read_services') && !permissions.includes('create_services')) {
    restrictedRoutes.push('/api-connections', '/adf-services');
  }

  // Restrict schema management for users without schema permissions
  if (!permissions.includes('read_schema') && !permissions.includes('update_schema')) {
    restrictedRoutes.push('/adf-schema');
  }

  return [...new Set(restrictedRoutes)];
}

/**
 * Check if token needs refresh based on expiration time
 * Implements intelligent refresh logic with configurable threshold
 */
function shouldRefreshToken(expiresAt: string | null, thresholdMinutes: number = 15): boolean {
  if (!expiresAt) return false;

  const expirationTime = new Date(expiresAt).getTime();
  const currentTime = Date.now();
  const thresholdTime = thresholdMinutes * 60 * 1000; // Convert to milliseconds

  return expirationTime - currentTime <= thresholdTime;
}

/**
 * Extract user permissions from user profile and session data
 * Consolidates permissions from multiple sources for comprehensive RBAC
 */
function extractUserPermissions(
  user: UserProfile | AdminProfile | null,
  session: UserSession | null
): { permissions: string[]; roles: RoleType[]; systemPermissions: SystemPermission[] } {
  const permissions: string[] = [];
  const roles: RoleType[] = [];
  const systemPermissions: SystemPermission[] = [];

  // Extract from user profile
  if (user?.permissions) {
    permissions.push(...user.permissions);
  }
  if (user?.role) {
    roles.push(user.role);
  }

  // Extract from admin profile
  if (user && 'systemPermissions' in user && user.systemPermissions) {
    systemPermissions.push(...user.systemPermissions);
  }

  // Extract from session
  if (session?.permissions) {
    permissions.push(...session.permissions);
  }
  if (session?.role) {
    roles.push(session.role);
  }

  return {
    permissions: [...new Set(permissions)],
    roles: [...new Set(roles)],
    systemPermissions: [...new Set(systemPermissions)],
  };
}

// ============================================================================
// AUTHENTICATION CONTEXT
// ============================================================================

/**
 * Authentication context for React component tree
 * Provides type-safe access to authentication state and actions
 */
const AuthContext = createContext<AuthContextValue | null>(null);

/**
 * Default configuration for AuthProvider
 * Implements DreamFactory API endpoints and security settings
 */
const DEFAULT_CONFIG: AuthProviderConfig = {
  endpoints: {
    login: '/user/session',
    logout: '/user/session',
    register: '/user/register',
    refresh: '/user/session',
    profile: '/user/profile',
    resetPassword: '/user/password',
    requestReset: '/user/password',
  },
  session: {
    storageKey: 'dreamfactory-session',
    refreshThreshold: 15, // minutes
    autoRefreshInterval: 5, // minutes
    clearOnClose: false,
  },
  security: {
    encryptTokens: true,
    csrfProtection: true,
    deviceFingerprinting: false,
    sessionTimeout: 480, // 8 hours
  },
  routing: {
    defaultLoginRedirect: '/dashboard',
    defaultLogoutRedirect: '/login',
    protectedRoutes: [],
  },
  permissions: {
    cacheResults: true,
    cacheTTL: 5, // minutes
    serverSideValidation: true,
  },
};

// ============================================================================
// AUTHENTICATION PROVIDER COMPONENT
// ============================================================================

/**
 * AuthProvider component that manages authentication state and provides context
 * Integrates React 19 concurrent features with Next.js middleware and Zustand state management
 */
export function AuthProvider({
  children,
  config = {},
  initialState = {},
  onLogin,
  onLogout,
  onSessionExpired,
  onAuthError,
  storage,
}: AuthProviderProps) {
  const router = useRouter();
  const queryClient = useQueryClient();

  // Merge provided config with defaults
  const authConfig = useMemo(() => ({ ...DEFAULT_CONFIG, ...config }), [config]);

  // Zustand store state and actions
  const {
    user,
    session,
    isAuthenticated,
    loading,
    permissions,
    sessionMeta,
    errors,
    setUser,
    setSession,
    setAuthenticated,
    setLoading,
    setPermissions,
    setSessionMeta,
    setError,
    clearError,
    clearAllErrors,
    resetState,
  } = useAuthStore();

  // ============================================================================
  // REACT QUERY HOOKS FOR SERVER STATE MANAGEMENT
  // ============================================================================

  /**
   * User permissions query with intelligent caching
   * Implements TanStack React Query for permissions caching per Section 4.5.4.1
   */
  const {
    data: cachedPermissions,
    isLoading: permissionsLoading,
    error: permissionsError,
    refetch: refetchPermissions,
  } = useQuery({
    queryKey: ['user-permissions', user?.id],
    queryFn: async () => {
      if (!user?.id) return null;

      const response = await apiClient.get(`/user/${user.id}/permissions`);
      return response.data;
    },
    enabled: !!user?.id && authConfig.permissions.cacheResults,
    staleTime: authConfig.permissions.cacheTTL * 60 * 1000,
    cacheTime: authConfig.permissions.cacheTTL * 2 * 60 * 1000,
    refetchOnWindowFocus: false,
    refetchOnReconnect: true,
  });

  /**
   * Session validation query for Next.js middleware integration
   * Provides server-side session validation with automatic refresh
   */
  const sessionValidationQuery = useQuery({
    queryKey: ['session-validation', session?.sessionToken],
    queryFn: async (): Promise<SessionValidationResult> => {
      if (!session?.sessionToken) {
        return { isValid: false, error: 'authentication_required' };
      }

      try {
        const response = await apiClient.get('/user/session');
        if (response.data) {
          return {
            isValid: true,
            session: response.data,
            requiresRefresh: shouldRefreshToken(response.data.expires_at, authConfig.session.refreshThreshold),
          };
        }
        return { isValid: false, error: 'session_expired' };
      } catch (error) {
        return { isValid: false, error: 'token_invalid' };
      }
    },
    enabled: !!session?.sessionToken,
    staleTime: 2 * 60 * 1000, // 2 minutes
    cacheTime: 5 * 60 * 1000, // 5 minutes
    refetchInterval: authConfig.session.autoRefreshInterval * 60 * 1000,
    refetchOnWindowFocus: true,
  });

  // ============================================================================
  // AUTHENTICATION MUTATIONS
  // ============================================================================

  /**
   * Login mutation with comprehensive error handling
   * Implements Next.js App Router navigation patterns
   */
  const loginMutation = useMutation({
    mutationFn: async (credentials: LoginCredentials): Promise<LoginResponse> => {
      setLoading('isLoggingIn', true);
      clearError('login');

      try {
        const response = await apiClient.post(authConfig.endpoints.login, credentials);
        return response.data;
      } catch (error) {
        throw error;
      }
    },
    onSuccess: (data, variables, context) => {
      const { user: userData, session: sessionData, sessionToken, session_token } = data;

      // Handle session token variations
      const token = sessionToken || session_token;
      if (token && userData) {
        const newSession: UserSession = {
          ...sessionData,
          sessionToken: token,
          session_token: token,
          user_id: userData.id,
          username: userData.username,
          email: userData.email,
          display_name: userData.display_name,
          is_active: userData.is_active,
          expires_at: sessionData?.expires_at || new Date(Date.now() + 8 * 60 * 60 * 1000).toISOString(),
          tokenVersion: data.tokenVersion || 1,
          isServerSide: false,
        };

        // Update Zustand state
        setUser(userData);
        setSession(newSession);
        setAuthenticated(true);
        setSessionMeta({
          expiresAt: newSession.expires_at,
          lastActivity: new Date().toISOString(),
          tokenVersion: newSession.tokenVersion,
          requiresRefresh: false,
        });

        // Extract and set permissions
        const { permissions: userPermissions, roles, systemPermissions } = extractUserPermissions(
          userData,
          newSession
        );
        setPermissions(userPermissions, roles, systemPermissions);

        // Store session token for API client
        if (typeof window !== 'undefined') {
          localStorage.setItem('session_token', token);
        }

        // Invalidate permission queries to refetch with new user context
        queryClient.invalidateQueries({ queryKey: ['user-permissions'] });

        // Execute callback and navigation
        onLogin?.(userData, newSession);

        const redirectTo = variables.redirectTo || authConfig.routing.defaultLoginRedirect;
        router.push(redirectTo);
      }

      setLoading('isLoggingIn', false);
    },
    onError: (error, variables, context) => {
      setError('login', error);
      setLoading('isLoggingIn', false);
      onAuthError?.(error);
    },
  });

  /**
   * Logout mutation with session cleanup
   * Implements comprehensive state reset and navigation
   */
  const logoutMutation = useMutation({
    mutationFn: async (options: { clearAllSessions?: boolean; reason?: string } = {}) => {
      setLoading('isLoggingOut', true);

      try {
        // Attempt server-side logout
        await apiClient.delete(authConfig.endpoints.logout);
      } catch (error) {
        // Continue with logout even if server request fails
        console.warn('Server logout failed, continuing with client logout:', error);
      }

      return options;
    },
    onSuccess: (options, variables, context) => {
      // Clear client-side state
      resetState();

      // Clear stored session token
      if (typeof window !== 'undefined') {
        localStorage.removeItem('session_token');
        if (options.clearAllSessions) {
          // Clear all related storage
          localStorage.clear();
        }
      }

      // Clear React Query cache
      queryClient.clear();

      // Execute callback
      onLogout?.(options.reason);

      // Navigate to logout page
      const redirectTo = options.redirectTo || authConfig.routing.defaultLogoutRedirect;
      router.push(redirectTo);

      setLoading('isLoggingOut', false);
    },
    onError: (error, variables, context) => {
      // Continue with logout even on error
      resetState();
      if (typeof window !== 'undefined') {
        localStorage.removeItem('session_token');
      }
      queryClient.clear();

      setLoading('isLoggingOut', false);
      router.push(authConfig.routing.defaultLogoutRedirect);
    },
  });

  /**
   * Token refresh mutation with automatic retry
   * Implements Next.js middleware-compatible refresh logic
   */
  const refreshMutation = useMutation({
    mutationFn: async (force: boolean = false): Promise<TokenRefreshResult> => {
      if (!session?.sessionToken) {
        throw new Error('No session token available for refresh');
      }

      setLoading('isRefreshing', true);

      try {
        const response = await apiClient.post(authConfig.endpoints.refresh, {
          session_token: session.sessionToken,
          force_refresh: force,
        });

        return {
          success: true,
          accessToken: response.data.sessionToken || response.data.session_token,
          refreshToken: response.data.refreshToken,
          expiresIn: response.data.expires_in,
        };
      } catch (error) {
        return {
          success: false,
          error: error instanceof Error ? error.message : 'Refresh failed',
          requiresReauth: true,
        };
      }
    },
    onSuccess: (result, variables, context) => {
      if (result.success && result.accessToken) {
        // Update session with new token
        const updatedSession: UserSession = {
          ...session!,
          sessionToken: result.accessToken,
          session_token: result.accessToken,
          expires_at: new Date(Date.now() + (result.expiresIn || 8 * 60 * 60) * 1000).toISOString(),
          tokenVersion: (session?.tokenVersion || 0) + 1,
        };

        setSession(updatedSession);
        setSessionMeta({
          expiresAt: updatedSession.expires_at,
          lastActivity: new Date().toISOString(),
          tokenVersion: updatedSession.tokenVersion,
          requiresRefresh: false,
        });

        // Update stored token
        if (typeof window !== 'undefined') {
          localStorage.setItem('session_token', result.accessToken);
        }

        clearError('sessionRefresh');
      } else if (result.requiresReauth) {
        // Force logout if refresh failed and requires re-authentication
        logoutMutation.mutate({ reason: 'session_expired' });
        onSessionExpired?.();
      }

      setLoading('isRefreshing', false);
    },
    onError: (error, variables, context) => {
      setError('sessionRefresh', error);
      setLoading('isRefreshing', false);
      
      // Force logout on refresh error
      logoutMutation.mutate({ reason: 'session_expired' });
      onSessionExpired?.();
    },
  });

  /**
   * Registration mutation with validation support
   */
  const registerMutation = useMutation({
    mutationFn: async (details: RegisterDetails): Promise<LoginResponse> => {
      setLoading('isRegistering', true);
      clearError('registration');

      try {
        const response = await apiClient.post(authConfig.endpoints.register, details);
        return response.data;
      } catch (error) {
        throw error;
      }
    },
    onSuccess: (data, variables, context) => {
      // Handle successful registration similar to login
      if (data.sessionToken || data.session_token) {
        // Auto-login after successful registration
        const loginCredentials: LoginCredentials = {
          username: variables.username,
          password: variables.password,
        };
        loginMutation.mutate(loginCredentials);
      }
      setLoading('isRegistering', false);
    },
    onError: (error, variables, context) => {
      setError('registration', error);
      setLoading('isRegistering', false);
      onAuthError?.(error);
    },
  });

  /**
   * Password reset request mutation
   */
  const requestPasswordResetMutation = useMutation({
    mutationFn: async (request: ForgetPasswordRequest) => {
      setLoading('isResettingPassword', true);
      clearError('passwordReset');

      try {
        const response = await apiClient.post(authConfig.endpoints.requestReset, request);
        return response.data;
      } catch (error) {
        throw error;
      }
    },
    onSuccess: (data, variables, context) => {
      setLoading('isResettingPassword', false);
    },
    onError: (error, variables, context) => {
      setError('passwordReset', error);
      setLoading('isResettingPassword', false);
      onAuthError?.(error);
    },
  });

  /**
   * Password reset mutation with new password
   */
  const resetPasswordMutation = useMutation({
    mutationFn: async (resetData: ResetFormData) => {
      setLoading('isResettingPassword', true);
      clearError('passwordReset');

      try {
        const response = await apiClient.post(authConfig.endpoints.resetPassword, resetData);
        return response.data;
      } catch (error) {
        throw error;
      }
    },
    onSuccess: (data, variables, context) => {
      setLoading('isResettingPassword', false);
      // Redirect to login after successful password reset
      router.push('/login');
    },
    onError: (error, variables, context) => {
      setError('passwordReset', error);
      setLoading('isResettingPassword', false);
      onAuthError?.(error);
    },
  });

  /**
   * Update password mutation for authenticated users
   */
  const updatePasswordMutation = useMutation({
    mutationFn: async (passwordData: UpdatePasswordRequest) => {
      try {
        const response = await apiClient.put(authConfig.endpoints.resetPassword, passwordData);
        return response.data;
      } catch (error) {
        throw error;
      }
    },
    onSuccess: (data, variables, context) => {
      // Handle potential session refresh after password update
      if (data.requiresReauth) {
        logoutMutation.mutate({ reason: 'security_logout' });
      } else if (data.sessionToken || data.session_token) {
        // Update session if new token provided
        const newToken = data.sessionToken || data.session_token;
        if (session) {
          const updatedSession = { ...session, sessionToken: newToken, session_token: newToken };
          setSession(updatedSession);
          if (typeof window !== 'undefined') {
            localStorage.setItem('session_token', newToken);
          }
        }
      }
    },
    onError: (error, variables, context) => {
      onAuthError?.(error);
    },
  });

  // ============================================================================
  // PERMISSION CHECKING FUNCTIONS
  // ============================================================================

  /**
   * Check if user has specific permission
   */
  const hasPermission = useCallback(
    (permission: string, resource?: string): boolean => {
      if (!isAuthenticated || !permissions.list.length) return false;

      // Check direct permission
      if (permissions.list.includes(permission)) return true;

      // Check resource-specific permission
      if (resource && permissions.list.includes(`${permission}:${resource}`)) return true;

      // Check system permissions for admin users
      if (permissions.system.includes(permission as SystemPermission)) return true;

      return false;
    },
    [isAuthenticated, permissions.list, permissions.system]
  );

  /**
   * Check if user has any of the specified permissions
   */
  const hasAnyPermission = useCallback(
    (permissionList: string[]): boolean => {
      return permissionList.some((permission) => hasPermission(permission));
    },
    [hasPermission]
  );

  /**
   * Check if user has all specified permissions
   */
  const hasAllPermissions = useCallback(
    (permissionList: string[]): boolean => {
      return permissionList.every((permission) => hasPermission(permission));
    },
    [hasPermission]
  );

  /**
   * Check if user has specific role
   */
  const hasRole = useCallback(
    (roleName: string): boolean => {
      return permissions.roles.some((role) => role.name === roleName);
    },
    [permissions.roles]
  );

  /**
   * Get detailed permission check result
   */
  const checkPermission = useCallback(
    (permission: string, resource?: string): PermissionCheckResult => {
      const granted = hasPermission(permission, resource);

      if (granted) {
        return { granted: true };
      }

      return {
        granted: false,
        reason: 'Insufficient permissions',
        requiredPermissions: [permission],
        alternatives: permissions.list.filter((p) => p.includes(permission.split(':')[0])),
      };
    },
    [hasPermission, permissions.list]
  );

  /**
   * Check if user can perform action on resource
   */
  const canPerformAction = useCallback(
    (action: UserAction, resource?: string): boolean => {
      const actionPermissionMap: Record<UserAction, string> = {
        create: 'create',
        read: 'read',
        update: 'update',
        delete: 'delete',
        activate: 'update',
        deactivate: 'update',
        reset_password: 'update_password',
        unlock: 'update',
        view_profile: 'read',
        edit_profile: 'update',
      };

      const requiredPermission = actionPermissionMap[action];
      return hasPermission(requiredPermission, resource);
    },
    [hasPermission]
  );

  /**
   * Check if user can access route
   */
  const canAccessRoute = useCallback(
    (route: string): boolean => {
      // Check if route is in accessible routes
      if (permissions.accessibleRoutes.includes(route)) return true;

      // Check if route is restricted
      if (permissions.restrictedRoutes.includes(route)) return false;

      // Check against route protection configuration
      const routeProtection = authConfig.routing.protectedRoutes.find((r) => r.path === route);
      if (!routeProtection) return true; // No protection configured

      if (routeProtection.requiresAuth && !isAuthenticated) return false;
      if (routeProtection.adminOnly && !hasRole('admin') && !hasRole('sys_admin')) return false;
      if (routeProtection.requiredPermissions && !hasAllPermissions(routeProtection.requiredPermissions)) return false;
      if (routeProtection.requiredRoles && !routeProtection.requiredRoles.some((role) => hasRole(role))) return false;

      return true;
    },
    [permissions.accessibleRoutes, permissions.restrictedRoutes, authConfig.routing.protectedRoutes, isAuthenticated, hasRole, hasAllPermissions]
  );

  /**
   * Get route protection configuration
   */
  const getRouteProtection = useCallback(
    (route: string): RouteProtection | null => {
      return authConfig.routing.protectedRoutes.find((r) => r.path === route) || null;
    },
    [authConfig.routing.protectedRoutes]
  );

  // ============================================================================
  // PROFILE MANAGEMENT FUNCTIONS
  // ============================================================================

  /**
   * Update current user profile
   */
  const updateProfile = useCallback(
    async (updates: Partial<UserProfile>): Promise<UserProfile> => {
      if (!user) throw new Error('No user logged in');

      try {
        const response = await apiClient.put(`${authConfig.endpoints.profile}/${user.id}`, updates);
        const updatedUser = response.data;

        setUser(updatedUser);
        return updatedUser;
      } catch (error) {
        throw error;
      }
    },
    [user, authConfig.endpoints.profile, setUser]
  );

  /**
   * Reload user profile from server
   */
  const reloadProfile = useCallback(async (): Promise<UserProfile> => {
    if (!user) throw new Error('No user logged in');

    try {
      const response = await apiClient.get(`${authConfig.endpoints.profile}/${user.id}`);
      const reloadedUser = response.data;

      setUser(reloadedUser);

      // Refresh permissions
      await refetchPermissions();

      return reloadedUser;
    } catch (error) {
      throw error;
    }
  }, [user, authConfig.endpoints.profile, setUser, refetchPermissions]);

  // ============================================================================
  // SESSION MANAGEMENT FUNCTIONS
  // ============================================================================

  /**
   * Validate current session status
   */
  const validateSession = useCallback(async (): Promise<boolean> => {
    const result = await sessionValidationQuery.refetch();
    return result.data?.isValid || false;
  }, [sessionValidationQuery]);

  /**
   * Clear current session without logout
   */
  const clearSession = useCallback(() => {
    setSession(null);
    setAuthenticated(false);
    if (typeof window !== 'undefined') {
      localStorage.removeItem('session_token');
    }
  }, [setSession, setAuthenticated]);

  // ============================================================================
  // AUTOMATIC SESSION REFRESH EFFECT
  // ============================================================================

  /**
   * Effect for automatic session refresh based on expiration
   * Implements Next.js middleware-compatible refresh logic
   */
  useEffect(() => {
    if (!isAuthenticated || !session || !sessionMeta.expiresAt) return;

    const checkAndRefresh = () => {
      if (shouldRefreshToken(sessionMeta.expiresAt, authConfig.session.refreshThreshold)) {
        setSessionMeta({ requiresRefresh: true });
        refreshMutation.mutate(false);
      }
    };

    // Initial check
    checkAndRefresh();

    // Set up interval for periodic checks
    const interval = setInterval(checkAndRefresh, authConfig.session.autoRefreshInterval * 60 * 1000);

    return () => clearInterval(interval);
  }, [
    isAuthenticated,
    session,
    sessionMeta.expiresAt,
    authConfig.session.refreshThreshold,
    authConfig.session.autoRefreshInterval,
    setSessionMeta,
    refreshMutation,
  ]);

  // ============================================================================
  // HYDRATION EFFECT FOR NEXT.JS SSR
  // ============================================================================

  /**
   * Effect for handling Next.js hydration and initial state setup
   * Ensures proper SSR compatibility and state restoration
   */
  useEffect(() => {
    // Handle Zustand hydration for Next.js SSR
    useAuthStore.persist.rehydrate();

    // Apply initial state if provided
    if (Object.keys(initialState).length > 0) {
      if (initialState.user) setUser(initialState.user);
      if (initialState.session) setSession(initialState.session);
      if (initialState.isAuthenticated !== undefined) setAuthenticated(initialState.isAuthenticated);
      if (initialState.permissions) {
        const { list, roles, system } = initialState.permissions;
        setPermissions(list, roles, system);
      }
    }
  }, [initialState, setUser, setSession, setAuthenticated, setPermissions]);

  // ============================================================================
  // PERMISSIONS SYNC EFFECT
  // ============================================================================

  /**
   * Effect for syncing cached permissions with Zustand state
   * Implements intelligent permission caching with TanStack React Query
   */
  useEffect(() => {
    if (cachedPermissions && authConfig.permissions.cacheResults) {
      const { permissions: list, roles, systemPermissions } = cachedPermissions;
      if (list || roles || systemPermissions) {
        setPermissions(list || [], roles || [], systemPermissions || []);
      }
    }
  }, [cachedPermissions, authConfig.permissions.cacheResults, setPermissions]);

  // ============================================================================
  // CONTEXT VALUE ASSEMBLY
  // ============================================================================

  /**
   * Assemble comprehensive authentication actions object
   */
  const authActions: AuthActions = useMemo(
    () => ({
      // Core authentication operations
      login: async (credentials, options = {}) => {
        const enhancedCredentials = { ...credentials, ...options };
        const result = await loginMutation.mutateAsync(enhancedCredentials);
        return result;
      },
      logout: async (options = {}) => {
        await logoutMutation.mutateAsync(options);
      },
      register: async (details) => {
        const result = await registerMutation.mutateAsync(details);
        return result;
      },

      // Session management
      refreshSession: async (force = false) => {
        const result = await refreshMutation.mutateAsync(force);
        if (result.success && session) {
          return {
            ...session,
            sessionToken: result.accessToken!,
            session_token: result.accessToken!,
            expires_at: new Date(Date.now() + (result.expiresIn || 8 * 60 * 60) * 1000).toISOString(),
          };
        }
        throw new Error(result.error || 'Refresh failed');
      },
      validateSession,
      clearSession,

      // Password management
      requestPasswordReset: async (request) => {
        await requestPasswordResetMutation.mutateAsync(request);
      },
      resetPassword: async (resetData) => {
        await resetPasswordMutation.mutateAsync(resetData);
      },
      updatePassword: async (passwordData) => {
        await updatePasswordMutation.mutateAsync(passwordData);
      },

      // User profile management
      updateProfile,
      reloadProfile,

      // Permission and role management
      hasPermission,
      hasAnyPermission,
      hasAllPermissions,
      hasRole,
      checkPermission,
      canPerformAction,

      // Route protection
      canAccessRoute,
      getRouteProtection,

      // Error handling
      clearError,
      clearAllErrors,

      // State management
      resetState,
      setLoading,
    }),
    [
      loginMutation,
      logoutMutation,
      registerMutation,
      refreshMutation,
      requestPasswordResetMutation,
      resetPasswordMutation,
      updatePasswordMutation,
      validateSession,
      clearSession,
      updateProfile,
      reloadProfile,
      hasPermission,
      hasAnyPermission,
      hasAllPermissions,
      hasRole,
      checkPermission,
      canPerformAction,
      canAccessRoute,
      getRouteProtection,
      clearError,
      clearAllErrors,
      resetState,
      setLoading,
      session,
    ]
  );

  /**
   * Assemble comprehensive authentication context value
   */
  const contextValue: AuthContextValue = useMemo(
    () => ({
      // Base context value properties
      state: {
        user,
        session,
        isAuthenticated,
        loading,
        permissions,
        sessionMeta,
        errors,
      },
      actions: authActions,
      isInitialized: true,
      isLoading: loading.isLoading || loading.isLoggingIn || loading.isRefreshing,
      error: errors.auth,
      config: authConfig,

      // Convenience getters
      isAuthenticated,
      currentUser: user,
      userPermissions: permissions.list,
      userRoles: permissions.roles,

      // Debug information in development
      debug:
        process.env.NODE_ENV === 'development'
          ? {
              lastUpdate: new Date().toISOString(),
              renderCount: 1,
              subscribers: 1,
            }
          : undefined,
    }),
    [
      user,
      session,
      isAuthenticated,
      loading,
      permissions,
      sessionMeta,
      errors,
      authActions,
      authConfig,
    ]
  );

  return <AuthContext.Provider value={contextValue}>{children}</AuthContext.Provider>;
}

// ============================================================================
// CUSTOM HOOK FOR AUTHENTICATION CONTEXT
// ============================================================================

/**
 * Custom hook for accessing authentication context
 * Provides type-safe access to authentication state and actions
 * 
 * @throws {Error} When used outside of AuthProvider
 * @returns {AuthContextValue} Authentication context value
 */
export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider. Make sure to wrap your component tree with <AuthProvider>.');
  }

  return context;
}

// ============================================================================
// CONVENIENCE HOOKS FOR SPECIFIC AUTH OPERATIONS
// ============================================================================

/**
 * Hook for accessing authentication state only
 * Optimized for components that only need to read auth state
 */
export function useAuthState(): AuthState {
  const { state } = useAuth();
  return state;
}

/**
 * Hook for accessing authentication actions only
 * Optimized for components that only need auth actions
 */
export function useAuthActions(): AuthActions {
  const { actions } = useAuth();
  return actions;
}

/**
 * Hook for checking user permissions
 * Provides convenient permission checking utilities
 */
export function useAuthPermissions() {
  const { actions, userPermissions, userRoles } = useAuth();

  return {
    permissions: userPermissions,
    roles: userRoles,
    hasPermission: actions.hasPermission,
    hasAnyPermission: actions.hasAnyPermission,
    hasAllPermissions: actions.hasAllPermissions,
    hasRole: actions.hasRole,
    checkPermission: actions.checkPermission,
    canPerformAction: actions.canPerformAction,
    canAccessRoute: actions.canAccessRoute,
  };
}

/**
 * Hook for checking authentication status
 * Optimized for conditional rendering based on auth state
 */
export function useAuthStatus() {
  const { isAuthenticated, isLoading, currentUser } = useAuth();

  return {
    isAuthenticated,
    isLoading,
    user: currentUser,
    isLoggedIn: isAuthenticated && !!currentUser,
    isGuest: !isAuthenticated,
  };
}

// ============================================================================
// EXPORTS
// ============================================================================

export type { AuthContextValue, AuthState, AuthActions } from './provider-types';
export { useAuthStore };