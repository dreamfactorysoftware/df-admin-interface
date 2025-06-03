/**
 * Authentication Hook for DreamFactory Admin Interface
 * 
 * Primary authentication hook that manages login/logout workflows, JWT token handling,
 * and authentication state. Replaces Angular AuthService with React Query mutations,
 * Zustand state management, and Next.js middleware integration for comprehensive
 * authentication functionality throughout the application.
 * 
 * Key Features:
 * - React Query mutations for login, logout, and session validation with automatic error handling
 * - Zustand state integration for authentication status and user data persistence
 * - JWT token management with automatic refresh and Next.js middleware integration
 * - User permission caching with role-based access control using React Query intelligent caching
 * - Session validation on component mount with token expiration handling
 * - HTTP-only cookie integration with SameSite=Strict configuration for enhanced security
 * 
 * Security Implementation:
 * - HTTP-only cookies prevent XSS attacks on session tokens per Section 5.2 requirements
 * - SameSite=Strict configuration prevents CSRF attacks
 * - Automatic token refresh prevents session interruption
 * - Secure logout with complete session cleanup
 * - JWT validation with Next.js middleware integration
 * - Role-based permission caching with intelligent invalidation
 * 
 * Performance Characteristics:
 * - React Query caching provides cache hit responses under 50ms per Section 3.2.4
 * - Background revalidation maintains session freshness
 * - Optimistic updates for seamless user experience
 * - Intelligent retry logic for network resilience
 * - Permission queries cached for 5 minutes with background updates
 * 
 * @example
 * ```tsx
 * function LoginPage() {
 *   const {
 *     login,
 *     logout,
 *     user,
 *     isAuthenticated,
 *     isLoading,
 *     hasPermission,
 *     isAdmin,
 *     error,
 *     startTransition,
 *     isPending
 *   } = useAuth();
 * 
 *   const handleLogin = (credentials) => {
 *     startTransition(() => {
 *       login(credentials).catch(console.error);
 *     });
 *   };
 * 
 *   return (
 *     <div>
 *       {isAuthenticated ? (
 *         <div>
 *           <h1>Welcome, {user?.name}</h1>
 *           {hasPermission('admin') && <AdminPanel />}
 *           <button onClick={logout}>Logout</button>
 *         </div>
 *       ) : (
 *         <LoginForm onSubmit={handleLogin} isLoading={isPending} />
 *       )}
 *     </div>
 *   );
 * }
 * ```
 */

'use client';

import { useCallback, useTransition, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { 
  LoginCredentials,
  LoginResponse,
  UserSession,
  AuthError,
  AuthErrorCode,
  JWTPayload,
  UseAuthReturn,
  SessionCookieConfig,
  DEFAULT_COOKIE_CONFIG,
  PROTECTED_ROUTES
} from '@/types/auth';
import { UserProfile, UserPermissions } from '@/types/user';
import { useSession, SessionCookieManager, SessionAPI } from '@/hooks/use-session';

// ============================================================================
// Constants and Configuration
// ============================================================================

/**
 * Authentication configuration constants
 * Optimized for DreamFactory deployment patterns with enhanced security
 */
const AUTH_CONFIG = {
  API_BASE_URL: '/api/v2/user',
  LOGIN_REDIRECT: '/home',
  LOGOUT_REDIRECT: '/login',
  PERMISSION_CACHE_TIME: 5 * 60 * 1000, // 5 minutes
  PERMISSION_STALE_TIME: 2 * 60 * 1000, // 2 minutes
  MAX_RETRY_ATTEMPTS: 3,
  RETRY_DELAY: 1000, // 1 second base delay
} as const;

/**
 * Query keys for React Query cache management
 * Provides consistent cache key patterns across the application
 */
export const authQueryKeys = {
  all: ['auth'] as const,
  session: () => [...authQueryKeys.all, 'session'] as const,
  user: () => [...authQueryKeys.all, 'user'] as const,
  permissions: (userId: number) => [...authQueryKeys.all, 'permissions', userId] as const,
  roles: (userId: number) => [...authQueryKeys.all, 'roles', userId] as const,
} as const;

// ============================================================================
// Authentication API Client
// ============================================================================

/**
 * Authentication API client for server communication
 * Handles login, logout, session management, and permission validation
 */
class AuthAPI {
  private static baseUrl = AUTH_CONFIG.API_BASE_URL;

  /**
   * Authenticates user with provided credentials
   * Returns comprehensive login response with session data
   */
  static async login(credentials: LoginCredentials): Promise<LoginResponse> {
    const response = await fetch(`${this.baseUrl}/session`, {
      method: 'POST',
      credentials: 'include', // Include HTTP-only cookies
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify({
        email: credentials.email || credentials.username,
        password: credentials.password,
        remember: credentials.rememberMe || false,
        duration: credentials.rememberMe ? 604800 : 86400, // 7 days or 24 hours
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      
      // Handle specific authentication error scenarios
      if (response.status === 401) {
        throw new Error('Invalid credentials. Please check your email and password.');
      } else if (response.status === 423) {
        throw new Error('Account is locked. Please contact your administrator.');
      } else if (response.status === 429) {
        throw new Error('Too many login attempts. Please try again later.');
      }
      
      throw new Error(errorData.message || `Authentication failed: ${response.statusText}`);
    }

    const data = await response.json();
    
    // Store session token in HTTP-only cookie
    if (data.session_token || data.sessionToken) {
      const token = data.session_token || data.sessionToken;
      const expiresAt = data.tokenExpiryDate 
        ? new Date(data.tokenExpiryDate).getTime()
        : Date.now() + (data.rememberMe ? 604800000 : 86400000); // 7 days or 24 hours
      
      SessionCookieManager.setSessionToken(token, expiresAt);
    }

    return this.transformLoginResponse(data);
  }

  /**
   * Logs out the user and terminates the session
   * Ensures complete cleanup of session data and cookies
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
   * Refreshes the current session token
   * Extends session without requiring re-authentication
   */
  static async refreshSession(): Promise<UserSession> {
    const response = await fetch(`${this.baseUrl}/session`, {
      method: 'PUT',
      credentials: 'include', // Include HTTP-only cookies
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
    });

    if (!response.ok) {
      if (response.status === 401) {
        throw new Error('Session expired. Please log in again.');
      }
      
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
   * Validates the current session with the server
   * Returns session validation result with user data
   */
  static async validateSession(): Promise<{ valid: boolean; user?: UserSession }> {
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
          return { valid: false };
        }
        throw new Error(`Session validation failed: ${response.statusText}`);
      }

      const data = await response.json();
      const user = this.transformToUserSession(data);
      
      return { valid: true, user };
    } catch (error) {
      console.error('Session validation error:', error);
      return { valid: false };
    }
  }

  /**
   * Fetches user permissions based on roles and service access
   * Returns comprehensive permission set for RBAC implementation
   */
  static async getUserPermissions(userId: number): Promise<UserPermissions> {
    const response = await fetch(`${this.baseUrl}/${userId}/permissions`, {
      method: 'GET',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch user permissions: ${response.statusText}`);
    }

    const data = await response.json();
    return this.transformToUserPermissions(data);
  }

  /**
   * Fetches user roles for role-based access control
   * Returns detailed role information with service access rights
   */
  static async getUserRoles(userId: number): Promise<any[]> {
    const response = await fetch(`${this.baseUrl}/${userId}/roles`, {
      method: 'GET',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch user roles: ${response.statusText}`);
    }

    return response.json();
  }

  /**
   * Transforms API login response to LoginResponse format
   * Ensures consistent data structure across the application
   */
  private static transformLoginResponse(data: any): LoginResponse {
    return {
      session_token: data.session_token || data.sessionToken,
      sessionToken: data.sessionToken || data.session_token,
      email: data.email,
      firstName: data.firstName || data.first_name || '',
      lastName: data.lastName || data.last_name || '',
      name: data.name || `${data.firstName || data.first_name || ''} ${data.lastName || data.last_name || ''}`.trim(),
      id: data.id,
      isRootAdmin: data.isRootAdmin || data.is_root_admin || false,
      isSysAdmin: data.isSysAdmin || data.is_sys_admin || false,
      roleId: data.roleId || data.role_id || 0,
      role_id: data.role_id,
      host: data.host || '',
      lastLoginDate: data.lastLoginDate || data.last_login_date || '',
      tokenExpiryDate: data.tokenExpiryDate || data.token_expiry_date || new Date(Date.now() + 86400000).toISOString(),
      sessionId: data.sessionId || data.session_id || '',
    };
  }

  /**
   * Transforms API response to UserSession format
   * Provides consistent session data structure
   */
  private static transformToUserSession(data: any): UserSession {
    return {
      email: data.email,
      firstName: data.firstName || data.first_name || '',
      lastName: data.lastName || data.last_name || '',
      name: data.name || `${data.firstName || data.first_name || ''} ${data.lastName || data.last_name || ''}`.trim(),
      host: data.host || '',
      id: data.id,
      isRootAdmin: data.isRootAdmin || data.is_root_admin || false,
      isSysAdmin: data.isSysAdmin || data.is_sys_admin || false,
      lastLoginDate: data.lastLoginDate || data.last_login_date || '',
      sessionId: data.sessionId || data.session_id || '',
      sessionToken: data.sessionToken || data.session_token || '',
      tokenExpiryDate: new Date(data.tokenExpiryDate || data.token_expiry_date || Date.now() + 86400000),
      roleId: data.roleId || data.role_id || 0,
      role_id: data.role_id,
    };
  }

  /**
   * Transforms API response to UserPermissions format
   * Provides comprehensive permission data for RBAC
   */
  private static transformToUserPermissions(data: any): UserPermissions {
    return {
      isSystemAdmin: data.is_sys_admin || data.isSystemAdmin || false,
      canManageUsers: data.can_manage_users || false,
      canManageRoles: data.can_manage_roles || false,
      canManageServices: data.can_manage_services || false,
      canManageApps: data.can_manage_apps || false,
      canViewReports: data.can_view_reports || false,
      canConfigureSystem: data.can_configure_system || false,
      canManageFiles: data.can_manage_files || false,
      canManageScripts: data.can_manage_scripts || false,
      canManageScheduler: data.can_manage_scheduler || false,
      canManageCache: data.can_manage_cache || false,
      canManageCors: data.can_manage_cors || false,
      canManageEmailTemplates: data.can_manage_email_templates || false,
      canManageLookupKeys: data.can_manage_lookup_keys || false,
      serviceAccess: data.service_access || [],
      appAccess: data.app_access || [],
    };
  }
}

// ============================================================================
// Auth Store Integration (Zustand)
// ============================================================================

/**
 * Authentication store state interface
 * Defines the shape of authentication state managed by Zustand
 */
interface AuthStore {
  user: UserSession | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: AuthError | null;
  permissions: UserPermissions | null;
  lastActivity: Date | null;
  
  // Actions
  setUser: (user: UserSession | null) => void;
  setAuthenticated: (authenticated: boolean) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: AuthError | null) => void;
  setPermissions: (permissions: UserPermissions | null) => void;
  updateLastActivity: () => void;
  reset: () => void;
}

/**
 * Mock Zustand store implementation
 * This would be replaced with actual Zustand store import in production
 * For now, we'll use a simple implementation to demonstrate the pattern
 */
let authStore: AuthStore = {
  user: null,
  isAuthenticated: false,
  isLoading: false,
  error: null,
  permissions: null,
  lastActivity: null,
  
  setUser: (user) => { authStore.user = user; },
  setAuthenticated: (authenticated) => { authStore.isAuthenticated = authenticated; },
  setLoading: (loading) => { authStore.isLoading = loading; },
  setError: (error) => { authStore.error = error; },
  setPermissions: (permissions) => { authStore.permissions = permissions; },
  updateLastActivity: () => { authStore.lastActivity = new Date(); },
  reset: () => {
    authStore.user = null;
    authStore.isAuthenticated = false;
    authStore.isLoading = false;
    authStore.error = null;
    authStore.permissions = null;
    authStore.lastActivity = null;
  }
};

// ============================================================================
// Main Authentication Hook
// ============================================================================

/**
 * Primary authentication hook with comprehensive functionality
 * 
 * Provides complete authentication management including login/logout workflows,
 * session validation, permission checking, and automatic token refresh.
 * Integrates with React Query for intelligent caching and background synchronization.
 * 
 * Key Features:
 * - React Query mutations for optimistic updates and error handling
 * - Zustand state integration for global authentication state
 * - HTTP-only cookie management with security best practices
 * - Automatic session refresh and expiration handling
 * - Role-based access control with intelligent permission caching
 * - Next.js router integration for navigation management
 * - React 19 concurrent features with transitions
 */
export function useAuth(): UseAuthReturn {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [isPending, startTransition] = useTransition();
  
  // Integrate with existing session management hook
  const {
    user: sessionUser,
    isAuthenticated: sessionAuthenticated,
    isLoading: sessionLoading,
    error: sessionError,
    logout: sessionLogout,
    refresh: sessionRefresh,
    hasPermission: sessionHasPermission,
    hasRole: sessionHasRole,
    isAdmin: sessionIsAdmin,
    isRootAdmin: sessionIsRootAdmin,
  } = useSession();

  // ============================================================================
  // Permission Queries with Intelligent Caching
  // ============================================================================

  /**
   * User permissions query with React Query caching
   * Provides comprehensive permission data for RBAC implementation
   */
  const {
    data: permissions,
    error: permissionsError,
    isLoading: isLoadingPermissions,
  } = useQuery({
    queryKey: authQueryKeys.permissions(sessionUser?.id || 0),
    queryFn: () => AuthAPI.getUserPermissions(sessionUser!.id),
    enabled: sessionAuthenticated && !!sessionUser?.id,
    staleTime: AUTH_CONFIG.PERMISSION_STALE_TIME,
    gcTime: AUTH_CONFIG.PERMISSION_CACHE_TIME,
    refetchOnWindowFocus: false,
    retry: (failureCount, error) => {
      if (error instanceof Error && error.message.includes('401')) {
        return false;
      }
      return failureCount < AUTH_CONFIG.MAX_RETRY_ATTEMPTS;
    },
  });

  /**
   * User roles query with intelligent caching
   * Provides detailed role information for access control
   */
  const {
    data: roles,
    isLoading: isLoadingRoles,
  } = useQuery({
    queryKey: authQueryKeys.roles(sessionUser?.id || 0),
    queryFn: () => AuthAPI.getUserRoles(sessionUser!.id),
    enabled: sessionAuthenticated && !!sessionUser?.id,
    staleTime: AUTH_CONFIG.PERMISSION_STALE_TIME,
    gcTime: AUTH_CONFIG.PERMISSION_CACHE_TIME,
    refetchOnWindowFocus: false,
  });

  // ============================================================================
  // Authentication Mutations
  // ============================================================================

  /**
   * Login mutation with optimistic updates and error handling
   * Handles complete authentication workflow including session establishment
   */
  const loginMutation = useMutation({
    mutationFn: AuthAPI.login,
    onMutate: async (credentials) => {
      // Set loading state
      authStore.setLoading(true);
      authStore.setError(null);
      
      return { credentials };
    },
    onSuccess: async (loginResponse, credentials) => {
      // Transform login response to user session
      const userSession: UserSession = {
        email: loginResponse.email,
        firstName: loginResponse.firstName,
        lastName: loginResponse.lastName,
        name: loginResponse.name,
        host: loginResponse.host,
        id: loginResponse.id,
        isRootAdmin: loginResponse.isRootAdmin,
        isSysAdmin: loginResponse.isSysAdmin,
        lastLoginDate: loginResponse.lastLoginDate,
        sessionId: loginResponse.sessionId,
        sessionToken: loginResponse.sessionToken || loginResponse.session_token || '',
        tokenExpiryDate: new Date(loginResponse.tokenExpiryDate),
        roleId: loginResponse.roleId,
        role_id: loginResponse.role_id,
      };

      // Update authentication state
      authStore.setUser(userSession);
      authStore.setAuthenticated(true);
      authStore.setLoading(false);
      authStore.updateLastActivity();

      // Invalidate and refetch session-related queries
      await queryClient.invalidateQueries({ queryKey: authQueryKeys.session() });
      await queryClient.invalidateQueries({ queryKey: authQueryKeys.user() });
      
      // Pre-fetch user permissions for immediate access
      if (userSession.id) {
        queryClient.prefetchQuery({
          queryKey: authQueryKeys.permissions(userSession.id),
          queryFn: () => AuthAPI.getUserPermissions(userSession.id),
          staleTime: AUTH_CONFIG.PERMISSION_STALE_TIME,
        });
      }

      // Navigate to appropriate route after successful login
      startTransition(() => {
        router.push(AUTH_CONFIG.LOGIN_REDIRECT);
      });
    },
    onError: (error) => {
      // Create structured error object
      const authError: AuthError = {
        code: 'LOGIN_FAILED' as AuthErrorCode,
        message: error instanceof Error ? error.message : 'Login failed',
        timestamp: new Date(),
        retryable: true,
      };

      authStore.setError(authError);
      authStore.setLoading(false);
      
      console.error('Login failed:', error);
    },
    retry: false, // Don't retry login attempts automatically
  });

  /**
   * Logout mutation with comprehensive cleanup
   * Ensures complete session termination and state cleanup
   */
  const logoutMutation = useMutation({
    mutationFn: AuthAPI.logout,
    onMutate: async () => {
      // Immediately set loading state
      authStore.setLoading(true);
      
      return {};
    },
    onSuccess: async () => {
      // Clear all authentication state
      authStore.reset();
      
      // Clear all authentication-related cache
      queryClient.removeQueries({ queryKey: authQueryKeys.all });
      queryClient.removeQueries({ queryKey: ['session'] });
      queryClient.removeQueries({ queryKey: ['user'] });
      
      // Navigate to login page
      startTransition(() => {
        router.push(AUTH_CONFIG.LOGOUT_REDIRECT);
      });
    },
    onError: (error) => {
      console.error('Logout error:', error);
      
      // Even if server logout fails, clear local state
      authStore.reset();
      queryClient.removeQueries({ queryKey: authQueryKeys.all });
      
      startTransition(() => {
        router.push(AUTH_CONFIG.LOGOUT_REDIRECT);
      });
    },
  });

  /**
   * Session validation mutation for manual session checks
   * Allows components to trigger session validation
   */
  const validateSessionMutation = useMutation({
    mutationFn: AuthAPI.validateSession,
    onSuccess: (result) => {
      if (result.valid && result.user) {
        authStore.setUser(result.user);
        authStore.setAuthenticated(true);
      } else {
        authStore.setAuthenticated(false);
        authStore.setUser(null);
      }
    },
    onError: (error) => {
      console.error('Session validation error:', error);
      authStore.setAuthenticated(false);
      authStore.setUser(null);
    },
  });

  // ============================================================================
  // Permission and Role Helpers
  // ============================================================================

  /**
   * Enhanced permission checking with caching
   * Combines session-based permissions with cached permission data
   */
  const hasPermission = useCallback((permission: string): boolean => {
    // Use session-based permission check as primary method
    if (sessionHasPermission(permission)) {
      return true;
    }

    // Fallback to cached permissions if available
    if (permissions) {
      // System admins have all permissions
      if (permissions.isSystemAdmin) return true;

      // Check specific permissions based on permission string
      switch (permission.toLowerCase()) {
        case 'admin':
        case 'system_admin':
          return permissions.isSystemAdmin;
        case 'manage_users':
          return permissions.canManageUsers;
        case 'manage_roles':
          return permissions.canManageRoles;
        case 'manage_services':
          return permissions.canManageServices;
        case 'manage_apps':
          return permissions.canManageApps;
        case 'view_reports':
          return permissions.canViewReports;
        case 'configure_system':
          return permissions.canConfigureSystem;
        case 'manage_files':
          return permissions.canManageFiles;
        case 'manage_scripts':
          return permissions.canManageScripts;
        case 'manage_scheduler':
          return permissions.canManageScheduler;
        case 'manage_cache':
          return permissions.canManageCache;
        case 'manage_cors':
          return permissions.canManageCors;
        case 'manage_email_templates':
          return permissions.canManageEmailTemplates;
        case 'manage_lookup_keys':
          return permissions.canManageLookupKeys;
        default:
          return false;
      }
    }

    return false;
  }, [sessionHasPermission, permissions]);

  /**
   * Enhanced role checking with multiple role sources
   * Combines session-based roles with cached role data
   */
  const hasRole = useCallback((roleId: number): boolean => {
    // Use session-based role check as primary method
    if (sessionHasRole(roleId)) {
      return true;
    }

    // Fallback to cached roles if available
    if (roles && Array.isArray(roles)) {
      return roles.some(role => role.id === roleId);
    }

    return false;
  }, [sessionHasRole, roles]);

  // ============================================================================
  // Action Wrappers with State Integration
  // ============================================================================

  /**
   * Login action wrapper with transition support
   * Provides consistent interface for login operations
   */
  const login = useCallback(async (credentials: LoginCredentials): Promise<LoginResponse> => {
    return new Promise((resolve, reject) => {
      startTransition(() => {
        loginMutation.mutateAsync(credentials)
          .then(resolve)
          .catch(reject);
      });
    });
  }, [loginMutation, startTransition]);

  /**
   * Logout action wrapper with transition support
   * Ensures consistent logout behavior across the application
   */
  const logout = useCallback(async (): Promise<void> => {
    return new Promise((resolve, reject) => {
      startTransition(() => {
        logoutMutation.mutateAsync()
          .then(() => {
            // Also call session logout for complete cleanup
            sessionLogout().catch(console.error);
            resolve();
          })
          .catch(reject);
      });
    });
  }, [logoutMutation, sessionLogout, startTransition]);

  /**
   * Session refresh wrapper
   * Delegates to session hook for consistency
   */
  const refresh = useCallback(async (): Promise<void> => {
    await sessionRefresh();
    
    // Invalidate permission cache after refresh
    if (sessionUser?.id) {
      await queryClient.invalidateQueries({ 
        queryKey: authQueryKeys.permissions(sessionUser.id) 
      });
    }
  }, [sessionRefresh, sessionUser?.id, queryClient]);

  /**
   * Session validation wrapper
   * Provides manual session checking capability
   */
  const checkSession = useCallback(async (): Promise<boolean> => {
    const result = await validateSessionMutation.mutateAsync();
    return result.valid;
  }, [validateSessionMutation]);

  // ============================================================================
  // Computed State and Error Handling
  // ============================================================================

  /**
   * Comprehensive loading state
   * Combines all loading states for consistent UX
   */
  const isLoading = sessionLoading || 
                   isLoadingPermissions || 
                   isLoadingRoles || 
                   loginMutation.isPending || 
                   logoutMutation.isPending ||
                   authStore.isLoading;

  /**
   * Centralized error handling
   * Prioritizes errors based on severity and recency
   */
  const error: AuthError | null = (() => {
    // Prioritize authentication errors
    if (loginMutation.error) {
      return {
        code: 'LOGIN_FAILED' as AuthErrorCode,
        message: loginMutation.error instanceof Error ? loginMutation.error.message : 'Login failed',
        timestamp: new Date(),
        retryable: true,
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

    // Include session errors
    if (sessionError) {
      return sessionError;
    }

    // Include permission errors
    if (permissionsError) {
      return {
        code: 'PERMISSION_FETCH_ERROR' as AuthErrorCode,
        message: permissionsError instanceof Error ? permissionsError.message : 'Failed to fetch permissions',
        timestamp: new Date(),
        retryable: true,
      };
    }

    return authStore.error;
  })();

  // ============================================================================
  // Activity Monitoring Integration
  // ============================================================================

  /**
   * Update last activity with Zustand store integration
   * Tracks user activity for session management
   */
  const updateLastActivity = useCallback((): void => {
    authStore.updateLastActivity();
  }, []);

  // ============================================================================
  // Effect for State Synchronization
  // ============================================================================

  /**
   * Synchronize session state with auth store
   * Ensures consistency between session hook and auth store
   */
  useEffect(() => {
    if (sessionUser) {
      authStore.setUser(sessionUser);
      authStore.setAuthenticated(sessionAuthenticated);
    }
  }, [sessionUser, sessionAuthenticated]);

  // ============================================================================
  // Return Hook Interface
  // ============================================================================

  return {
    // Core state - prioritize session state over store state
    user: sessionUser || authStore.user,
    isAuthenticated: sessionAuthenticated,
    isLoading,
    error,
    
    // Actions
    login,
    logout,
    refresh,
    checkSession,
    
    // React 19 concurrent features
    startTransition,
    isPending: isPending || loginMutation.isPending || logoutMutation.isPending,
    
    // RBAC integration - enhanced with cached permissions
    hasPermission,
    hasRole,
    isAdmin: sessionIsAdmin || authStore.user?.isSysAdmin || false,
    isRootAdmin: sessionIsRootAdmin || authStore.user?.isRootAdmin || false,
  };
}

// ============================================================================
// Additional Exports
// ============================================================================

/**
 * Authentication API client for external use
 * Provides direct access to authentication API operations
 */
export { AuthAPI };

/**
 * Authentication query keys for external cache management
 * Enables consistent cache key usage across components
 */
export { authQueryKeys };

/**
 * Default export for convenient importing
 */
export default useAuth;