'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useCallback, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from './use-session';
import type {
  LoginCredentials,
  LoginResponse,
  RegisterDetails,
  AuthError,
  AuthErrorCode,
  UserSession,
  AuthState,
  AuthActions,
  AuthStore,
  ForgetPasswordRequest,
  UpdatePasswordRequest,
  UpdatePasswordResponse,
  OAuthLoginRequest,
  SAMLAuthParams,
  UseAuthConfig,
} from '../types/auth';
import type { UserProfile } from '../types/user';

// =============================================================================
// CONSTANTS AND CONFIGURATION
// =============================================================================

const AUTH_QUERY_KEYS = {
  session: ['auth', 'session'] as const,
  user: ['auth', 'user'] as const,
  permissions: ['auth', 'permissions'] as const,
  roles: ['auth', 'roles'] as const,
} as const;

const AUTH_MUTATION_KEYS = {
  login: 'auth.login',
  logout: 'auth.logout',
  register: 'auth.register',
  refresh: 'auth.refresh',
  forgotPassword: 'auth.forgotPassword',
  updatePassword: 'auth.updatePassword',
  oauthLogin: 'auth.oauthLogin',
  samlLogin: 'auth.samlLogin',
} as const;

const DEFAULT_CONFIG: Required<UseAuthConfig> = {
  redirectIfUnauthenticated: true,
  redirectTo: '/login',
  requiredPermissions: [],
  enableAutoRefresh: true,
};

// Token refresh timing configuration
const TOKEN_REFRESH_THRESHOLD = 5 * 60 * 1000; // 5 minutes before expiry
const TOKEN_REFRESH_INTERVAL = 30 * 60 * 1000; // Check every 30 minutes

// =============================================================================
// ERROR HANDLING UTILITIES
// =============================================================================

/**
 * Creates a standardized authentication error object
 */
function createAuthError(
  code: AuthErrorCode,
  message: string,
  context?: string | Record<string, any>,
  statusCode?: number
): AuthError {
  return {
    code,
    message,
    context,
    statusCode,
    timestamp: new Date().toISOString(),
    requestId: crypto.randomUUID?.() || Math.random().toString(36),
  };
}

/**
 * Parses HTTP errors into standardized auth errors
 */
function parseHttpError(error: any): AuthError {
  if (error?.status === 401) {
    return createAuthError(
      AuthErrorCode.UNAUTHORIZED,
      'Authentication required',
      error?.message || 'Invalid or expired credentials',
      401
    );
  }

  if (error?.status === 403) {
    return createAuthError(
      AuthErrorCode.FORBIDDEN,
      'Access denied',
      error?.message || 'Insufficient permissions',
      403
    );
  }

  if (error?.status === 422) {
    return createAuthError(
      AuthErrorCode.VALIDATION_ERROR,
      'Validation failed',
      error?.message || 'Invalid input data',
      422
    );
  }

  if (error?.name === 'NetworkError' || error?.code === 'NETWORK_ERROR') {
    return createAuthError(
      AuthErrorCode.NETWORK_ERROR,
      'Network connection failed',
      error?.message || 'Unable to connect to authentication server'
    );
  }

  return createAuthError(
    AuthErrorCode.SERVER_ERROR,
    'Authentication error',
    error?.message || 'An unexpected error occurred',
    error?.status || 500
  );
}

// =============================================================================
// API CLIENT FUNCTIONS
// =============================================================================

/**
 * Makes authenticated API requests with automatic token handling
 */
async function makeAuthenticatedRequest<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const response = await fetch(endpoint, {
    ...options,
    credentials: 'include', // Include HTTP-only cookies
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'no-cache',
      ...options.headers,
    },
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw {
      status: response.status,
      statusText: response.statusText,
      message: errorData.message || response.statusText,
      ...errorData,
    };
  }

  return response.json();
}

/**
 * Login API call with credential validation
 */
async function loginAPI(credentials: LoginCredentials): Promise<LoginResponse> {
  // Determine the correct endpoint based on credentials
  const endpoint = credentials.email ? '/api/auth/user/session' : '/api/auth/admin/session';
  
  const response = await makeAuthenticatedRequest<LoginResponse>(endpoint, {
    method: 'POST',
    body: JSON.stringify(credentials),
  });

  return response;
}

/**
 * Login with existing JWT token
 */
async function loginWithTokenAPI(token: string): Promise<LoginResponse> {
  const response = await makeAuthenticatedRequest<LoginResponse>('/api/auth/session/validate', {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  return response;
}

/**
 * Logout API call with session cleanup
 */
async function logoutAPI(userData?: UserSession | null): Promise<void> {
  const endpoint = userData?.isSysAdmin ? '/api/auth/admin/session' : '/api/auth/user/session';
  
  await makeAuthenticatedRequest<void>(endpoint, {
    method: 'DELETE',
  });
}

/**
 * User registration API call
 */
async function registerAPI(details: RegisterDetails): Promise<LoginResponse> {
  const response = await makeAuthenticatedRequest<LoginResponse>('/api/auth/register', {
    method: 'POST',
    body: JSON.stringify(details),
  });

  return response;
}

/**
 * Password reset request API call
 */
async function forgotPasswordAPI(request: ForgetPasswordRequest): Promise<{ success: boolean; message: string }> {
  const response = await makeAuthenticatedRequest<{ success: boolean; message: string }>('/api/auth/password/forgot', {
    method: 'POST',
    body: JSON.stringify(request),
  });

  return response;
}

/**
 * Password update API call
 */
async function updatePasswordAPI(request: UpdatePasswordRequest): Promise<UpdatePasswordResponse> {
  const response = await makeAuthenticatedRequest<UpdatePasswordResponse>('/api/auth/password/update', {
    method: 'PUT',
    body: JSON.stringify(request),
  });

  return response;
}

/**
 * OAuth login API call
 */
async function oauthLoginAPI(request: OAuthLoginRequest): Promise<LoginResponse> {
  const response = await makeAuthenticatedRequest<LoginResponse>('/api/auth/oauth/login', {
    method: 'POST',
    body: JSON.stringify(request),
  });

  return response;
}

/**
 * SAML login API call
 */
async function samlLoginAPI(params: SAMLAuthParams): Promise<LoginResponse> {
  const response = await makeAuthenticatedRequest<LoginResponse>('/api/auth/saml/login', {
    method: 'POST',
    body: JSON.stringify(params),
  });

  return response;
}

/**
 * Token refresh API call
 */
async function refreshTokenAPI(): Promise<{ token: string; expiresAt: string }> {
  const response = await makeAuthenticatedRequest<{ token: string; expiresAt: string }>('/api/auth/token/refresh', {
    method: 'POST',
  });

  return response;
}

/**
 * User permissions API call
 */
async function getUserPermissionsAPI(userId: number): Promise<string[]> {
  const response = await makeAuthenticatedRequest<{ permissions: string[] }>(`/api/auth/users/${userId}/permissions`, {
    method: 'GET',
  });

  return response.permissions;
}

// =============================================================================
// CORE AUTHENTICATION HOOK
// =============================================================================

/**
 * Primary authentication hook for DreamFactory Admin Interface
 * 
 * Provides comprehensive authentication management with:
 * - React Query mutations for login, logout, and session validation
 * - Zustand state integration for authentication status and user data
 * - JWT token management with automatic refresh capabilities
 * - User permission caching with RBAC using React Query intelligent caching
 * - Session validation on component mount with token expiration handling
 * - HTTP-only cookie integration with SameSite=Strict configuration
 * - Next.js middleware integration for server-side authentication
 * 
 * @param config Configuration options for authentication behavior
 * @returns Authentication state and actions interface
 */
export function useAuth(config: UseAuthConfig = {}): AuthState & AuthActions {
  const finalConfig = { ...DEFAULT_CONFIG, ...config };
  const queryClient = useQueryClient();
  const router = useRouter();
  
  // Integrate with session management hook
  const {
    session,
    user,
    isAuthenticated: sessionAuthenticated,
    isLoading: sessionLoading,
    error: sessionError,
    login: sessionLogin,
    logout: sessionLogout,
    refresh: sessionRefresh,
    validateSession,
    clearSession,
    hasRole,
    hasPermission,
    canAccessService,
  } = useSession({
    enabled: true,
    refreshInterval: TOKEN_REFRESH_INTERVAL,
    onSessionExpired: () => {
      // Handle session expiration by clearing state and redirecting
      clearAuthState();
      if (finalConfig.redirectIfUnauthenticated) {
        router.push(finalConfig.redirectTo);
      }
    },
    onSessionRefreshed: (session) => {
      // Update auth cache when session is refreshed
      queryClient.setQueryData(AUTH_QUERY_KEYS.session, session);
      queryClient.setQueryData(AUTH_QUERY_KEYS.user, session.user);
    },
  });

  // =============================================================================
  // AUTHENTICATION STATE QUERIES
  // =============================================================================

  // User permissions query with intelligent caching
  const permissionsQuery = useQuery({
    queryKey: AUTH_QUERY_KEYS.permissions,
    queryFn: async () => {
      if (!user?.id) return [];
      return getUserPermissionsAPI(user.id);
    },
    enabled: !!user?.id && sessionAuthenticated,
    staleTime: 10 * 60 * 1000, // 10 minutes
    cacheTime: 30 * 60 * 1000, // 30 minutes
    refetchOnMount: false,
    refetchOnWindowFocus: false,
    retry: (failureCount, error: any) => {
      // Don't retry on authentication errors
      if (error?.status === 401 || error?.status === 403) {
        return false;
      }
      return failureCount < 2;
    },
  });

  // =============================================================================
  // AUTHENTICATION MUTATIONS
  // =============================================================================

  // Login mutation with comprehensive error handling
  const loginMutation = useMutation({
    mutationKey: [AUTH_MUTATION_KEYS.login],
    mutationFn: async (credentials: LoginCredentials): Promise<LoginResponse> => {
      try {
        const response = await loginAPI(credentials);
        return response;
      } catch (error) {
        throw parseHttpError(error);
      }
    },
    onSuccess: async (response) => {
      // Update session state via session hook
      if (response.user && response.sessionToken) {
        const sessionData = {
          token: {
            token: response.sessionToken,
            expires_at: response.expiresAt || new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
            user_id: response.user.id,
            session_id: response.user.sessionId || crypto.randomUUID?.() || Math.random().toString(36),
          },
          user: response.user,
          lastActivity: new Date().toISOString(),
          expiresAt: response.expiresAt || new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        };
        
        // Invalidate all auth-related queries to trigger fresh data fetch
        await queryClient.invalidateQueries({ queryKey: ['auth'] });
        
        // Set fresh session data
        queryClient.setQueryData(AUTH_QUERY_KEYS.session, sessionData);
        queryClient.setQueryData(AUTH_QUERY_KEYS.user, response.user);
      }
    },
    onError: (error: AuthError) => {
      // Clear any stale auth data on login failure
      clearAuthState();
    },
  });

  // Login with JWT token mutation
  const loginWithTokenMutation = useMutation({
    mutationKey: [AUTH_MUTATION_KEYS.login, 'token'],
    mutationFn: async (token: string): Promise<LoginResponse> => {
      try {
        const response = await loginWithTokenAPI(token);
        return response;
      } catch (error) {
        throw parseHttpError(error);
      }
    },
    onSuccess: async (response) => {
      if (response.user && response.sessionToken) {
        // Same session update logic as regular login
        const sessionData = {
          token: {
            token: response.sessionToken,
            expires_at: response.expiresAt || new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
            user_id: response.user.id,
            session_id: response.user.sessionId || crypto.randomUUID?.() || Math.random().toString(36),
          },
          user: response.user,
          lastActivity: new Date().toISOString(),
          expiresAt: response.expiresAt || new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        };
        
        await queryClient.invalidateQueries({ queryKey: ['auth'] });
        queryClient.setQueryData(AUTH_QUERY_KEYS.session, sessionData);
        queryClient.setQueryData(AUTH_QUERY_KEYS.user, response.user);
      }
    },
    onError: () => {
      clearAuthState();
    },
  });

  // Logout mutation with cleanup
  const logoutMutation = useMutation({
    mutationKey: [AUTH_MUTATION_KEYS.logout],
    mutationFn: async (): Promise<void> => {
      try {
        await logoutAPI(user);
      } catch (error) {
        // Continue with logout even if API call fails
        console.warn('Logout API call failed, continuing with local cleanup:', error);
      }
    },
    onSettled: async () => {
      // Always clear state and redirect, regardless of API success
      await clearAuthState();
      
      // Use session logout for complete cleanup
      try {
        await sessionLogout();
      } catch (error) {
        console.warn('Session logout failed:', error);
      }
      
      // Redirect to login page
      router.push(finalConfig.redirectTo);
    },
  });

  // User registration mutation
  const registerMutation = useMutation({
    mutationKey: [AUTH_MUTATION_KEYS.register],
    mutationFn: async (details: RegisterDetails): Promise<LoginResponse> => {
      try {
        const response = await registerAPI(details);
        return response;
      } catch (error) {
        throw parseHttpError(error);
      }
    },
    onSuccess: async (response) => {
      // Same session setup as login
      if (response.user && response.sessionToken) {
        const sessionData = {
          token: {
            token: response.sessionToken,
            expires_at: response.expiresAt || new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
            user_id: response.user.id,
            session_id: response.user.sessionId || crypto.randomUUID?.() || Math.random().toString(36),
          },
          user: response.user,
          lastActivity: new Date().toISOString(),
          expiresAt: response.expiresAt || new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        };
        
        await queryClient.invalidateQueries({ queryKey: ['auth'] });
        queryClient.setQueryData(AUTH_QUERY_KEYS.session, sessionData);
        queryClient.setQueryData(AUTH_QUERY_KEYS.user, response.user);
      }
    },
  });

  // Token refresh mutation
  const refreshMutation = useMutation({
    mutationKey: [AUTH_MUTATION_KEYS.refresh],
    mutationFn: async (): Promise<{ token: string; expiresAt: string }> => {
      try {
        const response = await refreshTokenAPI();
        return response;
      } catch (error) {
        throw parseHttpError(error);
      }
    },
    onSuccess: async (response) => {
      // Update session token data
      if (session) {
        const updatedSession = {
          ...session,
          token: {
            ...session.token,
            token: response.token,
            expires_at: response.expiresAt,
          },
          expiresAt: response.expiresAt,
          lastActivity: new Date().toISOString(),
        };
        
        queryClient.setQueryData(AUTH_QUERY_KEYS.session, updatedSession);
      }
    },
    onError: () => {
      // If refresh fails, logout user
      clearAuthState();
      if (finalConfig.redirectIfUnauthenticated) {
        router.push(finalConfig.redirectTo);
      }
    },
  });

  // Forgot password mutation
  const forgotPasswordMutation = useMutation({
    mutationKey: [AUTH_MUTATION_KEYS.forgotPassword],
    mutationFn: async (request: ForgetPasswordRequest): Promise<{ success: boolean; message: string }> => {
      try {
        const response = await forgotPasswordAPI(request);
        return response;
      } catch (error) {
        throw parseHttpError(error);
      }
    },
  });

  // Update password mutation
  const updatePasswordMutation = useMutation({
    mutationKey: [AUTH_MUTATION_KEYS.updatePassword],
    mutationFn: async (request: UpdatePasswordRequest): Promise<UpdatePasswordResponse> => {
      try {
        const response = await updatePasswordAPI(request);
        return response;
      } catch (error) {
        throw parseHttpError(error);
      }
    },
    onSuccess: async (response) => {
      // Update session token if provided
      if (response.sessionToken && session) {
        const updatedSession = {
          ...session,
          token: {
            ...session.token,
            token: response.sessionToken,
          },
          lastActivity: new Date().toISOString(),
        };
        
        queryClient.setQueryData(AUTH_QUERY_KEYS.session, updatedSession);
      }
    },
  });

  // OAuth login mutation
  const oauthLoginMutation = useMutation({
    mutationKey: [AUTH_MUTATION_KEYS.oauthLogin],
    mutationFn: async (request: OAuthLoginRequest): Promise<LoginResponse> => {
      try {
        const response = await oauthLoginAPI(request);
        return response;
      } catch (error) {
        throw parseHttpError(error);
      }
    },
    onSuccess: async (response) => {
      // Same session setup as regular login
      if (response.user && response.sessionToken) {
        const sessionData = {
          token: {
            token: response.sessionToken,
            expires_at: response.expiresAt || new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
            user_id: response.user.id,
            session_id: response.user.sessionId || crypto.randomUUID?.() || Math.random().toString(36),
          },
          user: response.user,
          lastActivity: new Date().toISOString(),
          expiresAt: response.expiresAt || new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        };
        
        await queryClient.invalidateQueries({ queryKey: ['auth'] });
        queryClient.setQueryData(AUTH_QUERY_KEYS.session, sessionData);
        queryClient.setQueryData(AUTH_QUERY_KEYS.user, response.user);
      }
    },
  });

  // SAML login mutation
  const samlLoginMutation = useMutation({
    mutationKey: [AUTH_MUTATION_KEYS.samlLogin],
    mutationFn: async (params: SAMLAuthParams): Promise<LoginResponse> => {
      try {
        const response = await samlLoginAPI(params);
        return response;
      } catch (error) {
        throw parseHttpError(error);
      }
    },
    onSuccess: async (response) => {
      // Same session setup as regular login
      if (response.user && response.sessionToken) {
        const sessionData = {
          token: {
            token: response.sessionToken,
            expires_at: response.expiresAt || new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
            user_id: response.user.id,
            session_id: response.user.sessionId || crypto.randomUUID?.() || Math.random().toString(36),
          },
          user: response.user,
          lastActivity: new Date().toISOString(),
          expiresAt: response.expiresAt || new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        };
        
        await queryClient.invalidateQueries({ queryKey: ['auth'] });
        queryClient.setQueryData(AUTH_QUERY_KEYS.session, sessionData);
        queryClient.setQueryData(AUTH_QUERY_KEYS.user, response.user);
      }
    },
  });

  // =============================================================================
  // UTILITY FUNCTIONS
  // =============================================================================

  /**
   * Clears all authentication state from React Query cache
   */
  const clearAuthState = useCallback(async (): Promise<void> => {
    await queryClient.invalidateQueries({ queryKey: ['auth'] });
    queryClient.removeQueries({ queryKey: ['auth'] });
    clearSession();
  }, [queryClient, clearSession]);

  /**
   * Checks if current user has all required permissions
   */
  const checkPermissions = useCallback((requiredPermissions: string[]): boolean => {
    if (!requiredPermissions.length) return true;
    if (!user || !sessionAuthenticated) return false;
    
    const userPermissions = permissionsQuery.data || [];
    return requiredPermissions.every(permission => userPermissions.includes(permission));
  }, [user, sessionAuthenticated, permissionsQuery.data]);

  /**
   * Automatic token refresh based on expiration time
   */
  useEffect(() => {
    if (!finalConfig.enableAutoRefresh || !session?.expiresAt) return;

    const expiryTime = new Date(session.expiresAt).getTime();
    const currentTime = Date.now();
    const timeUntilExpiry = expiryTime - currentTime;

    // If token expires within threshold, refresh it
    if (timeUntilExpiry > 0 && timeUntilExpiry <= TOKEN_REFRESH_THRESHOLD) {
      refreshMutation.mutate();
    }

    // Set up automatic refresh before expiry
    const refreshTimeout = setTimeout(() => {
      if (sessionAuthenticated && !refreshMutation.isPending) {
        refreshMutation.mutate();
      }
    }, Math.max(0, timeUntilExpiry - TOKEN_REFRESH_THRESHOLD));

    return () => clearTimeout(refreshTimeout);
  }, [session?.expiresAt, sessionAuthenticated, finalConfig.enableAutoRefresh, refreshMutation]);

  /**
   * Permission-based access control with redirect
   */
  useEffect(() => {
    if (!finalConfig.redirectIfUnauthenticated) return;
    
    // Check authentication
    if (!sessionLoading && !sessionAuthenticated) {
      router.push(finalConfig.redirectTo);
      return;
    }

    // Check permissions
    if (sessionAuthenticated && finalConfig.requiredPermissions.length > 0) {
      if (!permissionsQuery.isLoading && !checkPermissions(finalConfig.requiredPermissions)) {
        router.push('/unauthorized');
        return;
      }
    }
  }, [
    sessionAuthenticated,
    sessionLoading,
    permissionsQuery.isLoading,
    finalConfig.redirectIfUnauthenticated,
    finalConfig.redirectTo,
    finalConfig.requiredPermissions,
    checkPermissions,
    router,
  ]);

  // =============================================================================
  // ACTION IMPLEMENTATIONS
  // =============================================================================

  const login = useCallback(async (credentials: LoginCredentials): Promise<void> => {
    await loginMutation.mutateAsync(credentials);
  }, [loginMutation]);

  const loginWithToken = useCallback(async (token: string): Promise<void> => {
    await loginWithTokenMutation.mutateAsync(token);
  }, [loginWithTokenMutation]);

  const logout = useCallback(async (): Promise<void> => {
    await logoutMutation.mutateAsync();
  }, [logoutMutation]);

  const register = useCallback(async (details: RegisterDetails): Promise<void> => {
    await registerMutation.mutateAsync(details);
  }, [registerMutation]);

  const refreshToken = useCallback(async (): Promise<void> => {
    await refreshMutation.mutateAsync();
  }, [refreshMutation]);

  const forgotPassword = useCallback(async (request: ForgetPasswordRequest): Promise<{ success: boolean; message: string }> => {
    return await forgotPasswordMutation.mutateAsync(request);
  }, [forgotPasswordMutation]);

  const updatePassword = useCallback(async (request: UpdatePasswordRequest): Promise<UpdatePasswordResponse> => {
    return await updatePasswordMutation.mutateAsync(request);
  }, [updatePasswordMutation]);

  const oauthLogin = useCallback(async (request: OAuthLoginRequest): Promise<void> => {
    await oauthLoginMutation.mutateAsync(request);
  }, [oauthLoginMutation]);

  const samlLogin = useCallback(async (params: SAMLAuthParams): Promise<void> => {
    await samlLoginMutation.mutateAsync(params);
  }, [samlLoginMutation]);

  const updateUser = useCallback((userData: Partial<UserSession>): void => {
    if (user) {
      const updatedUser = { ...user, ...userData };
      queryClient.setQueryData(AUTH_QUERY_KEYS.user, updatedUser);
      
      if (session) {
        const updatedSession = { ...session, user: updatedUser };
        queryClient.setQueryData(AUTH_QUERY_KEYS.session, updatedSession);
      }
    }
  }, [user, session, queryClient]);

  const clearError = useCallback((): void => {
    // Reset mutation errors
    loginMutation.reset();
    registerMutation.reset();
    refreshMutation.reset();
    forgotPasswordMutation.reset();
    updatePasswordMutation.reset();
    oauthLoginMutation.reset();
    samlLoginMutation.reset();
  }, [
    loginMutation,
    registerMutation,
    refreshMutation,
    forgotPasswordMutation,
    updatePasswordMutation,
    oauthLoginMutation,
    samlLoginMutation,
  ]);

  const checkSession = useCallback(async (): Promise<boolean> => {
    try {
      const result = await validateSession();
      return result.success;
    } catch (error) {
      return false;
    }
  }, [validateSession]);

  // =============================================================================
  // COMPUTED STATE
  // =============================================================================

  const isLoading = useMemo(() => {
    return sessionLoading || 
           loginMutation.isPending || 
           registerMutation.isPending || 
           refreshMutation.isPending || 
           permissionsQuery.isLoading;
  }, [
    sessionLoading,
    loginMutation.isPending,
    registerMutation.isPending,
    refreshMutation.isPending,
    permissionsQuery.isLoading,
  ]);

  const error = useMemo(() => {
    return (sessionError as AuthError) ||
           (loginMutation.error as AuthError) ||
           (registerMutation.error as AuthError) ||
           (refreshMutation.error as AuthError) ||
           (forgotPasswordMutation.error as AuthError) ||
           (updatePasswordMutation.error as AuthError) ||
           (oauthLoginMutation.error as AuthError) ||
           (samlLoginMutation.error as AuthError) ||
           (permissionsQuery.error ? parseHttpError(permissionsQuery.error) : null);
  }, [
    sessionError,
    loginMutation.error,
    registerMutation.error,
    refreshMutation.error,
    forgotPasswordMutation.error,
    updatePasswordMutation.error,
    oauthLoginMutation.error,
    samlLoginMutation.error,
    permissionsQuery.error,
  ]);

  const isRefreshing = useMemo(() => {
    return refreshMutation.isPending;
  }, [refreshMutation.isPending]);

  const permissions = useMemo(() => {
    return permissionsQuery.data || [];
  }, [permissionsQuery.data]);

  // =============================================================================
  // RETURN INTERFACE
  // =============================================================================

  return {
    // Authentication state
    isAuthenticated: sessionAuthenticated,
    isLoading,
    user,
    error,
    isRefreshing,
    permissions,

    // Authentication actions
    login,
    loginWithToken,
    logout,
    register,
    refreshToken,
    forgotPassword,
    updatePassword,
    oauthLogin,
    samlLogin,
    updateUser,
    clearError,
    checkSession,

    // Permission and role checking (delegated to session hook)
    hasRole,
    hasPermission,
    canAccessService,
    checkPermissions,

    // Additional utilities
    clearAuthState,
  };
}

// =============================================================================
// EXPORT TYPES AND UTILITIES
// =============================================================================

export type UseAuthReturn = ReturnType<typeof useAuth>;

export {
  AUTH_QUERY_KEYS,
  AUTH_MUTATION_KEYS,
  createAuthError,
  parseHttpError,
  type AuthState,
  type AuthActions,
  type AuthStore,
  type UseAuthConfig,
};

export default useAuth;