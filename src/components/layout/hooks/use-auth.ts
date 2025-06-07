/**
 * Authentication Hook for DreamFactory Admin Interface
 * 
 * Custom React hook that manages authentication state, login/logout actions, 
 * session validation, and user permissions. Replaces Angular DfAuthService 
 * with React Query mutations, Zustand state management, and Next.js middleware 
 * integration for JWT token handling.
 * 
 * Key Features:
 * - React Query mutations for login, logout, and session validation
 * - Zustand state integration for authentication status and user data persistence
 * - JWT token management with automatic refresh capabilities
 * - User permission caching with role-based access control
 * - Session validation on component mount with token expiration handling
 * - Next.js router integration for authentication redirects
 * - Optimistic updates and error handling for auth operations
 * 
 * @example
 * ```tsx
 * function LoginComponent() {
 *   const { 
 *     login, 
 *     logout, 
 *     isAuthenticated, 
 *     user, 
 *     isLoading,
 *     hasPermission 
 *   } = useAuth();
 * 
 *   const handleLogin = async (credentials) => {
 *     try {
 *       await login.mutateAsync(credentials);
 *       // Redirect handled automatically
 *     } catch (error) {
 *       // Error handling in UI
 *     }
 *   };
 * 
 *   return (
 *     <div>
 *       {isAuthenticated ? (
 *         <div>Welcome {user?.name}!</div>
 *       ) : (
 *         <LoginForm onSubmit={handleLogin} />
 *       )}
 *     </div>
 *   );
 * }
 * ```
 */

import { useCallback, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { create } from 'zustand';
import { persist, subscribeWithSelector } from 'zustand/middleware';
import { apiClient } from '@/lib/api-client';
import type { 
  LoginCredentials, 
  LoginResponse, 
  UserSession,
  AuthState,
  AuthActions,
  AuthStore,
  AuthError,
  AuthErrorCode,
  MiddlewareAuthResult,
  TokenRefreshResult,
  UserPermissions
} from '@/types/auth';
import type { UserProfile } from '@/types/user';

// ============================================================================
// ZUSTAND AUTH STORE DEFINITION
// ============================================================================

/**
 * Zustand store for authentication state management
 * Persists authentication data across browser sessions using localStorage
 * Integrates with React Query for server state synchronization
 */
const useAuthStore = create<AuthStore>()(
  subscribeWithSelector(
    persist(
      (set, get) => ({
        // State
        isAuthenticated: false,
        isLoading: false,
        user: null,
        error: null,
        isRefreshing: false,

        // Actions
        login: async (credentials: LoginCredentials) => {
          // This will be handled by React Query mutation
          throw new Error('Login should be called through useAuth hook');
        },

        loginWithToken: async (token: string) => {
          // This will be handled by React Query mutation
          throw new Error('loginWithToken should be called through useAuth hook');
        },

        logout: async () => {
          // This will be handled by React Query mutation
          throw new Error('Logout should be called through useAuth hook');
        },

        refreshToken: async () => {
          // This will be handled by React Query mutation
          throw new Error('refreshToken should be called through useAuth hook');
        },

        updateUser: (user: Partial<UserSession>) => {
          set((state) => ({
            user: state.user ? { ...state.user, ...user } : null,
          }));
        },

        clearError: () => {
          set({ error: null });
        },

        checkSession: async () => {
          // This will be handled by React Query
          return false;
        },

        // Internal store actions
        setAuthenticated: (isAuthenticated: boolean, user?: UserSession | null) => {
          set({ 
            isAuthenticated, 
            user: isAuthenticated ? user : null,
            error: null 
          });
        },

        setLoading: (isLoading: boolean) => {
          set({ isLoading });
        },

        setError: (error: AuthError | null) => {
          set({ error });
        },

        setRefreshing: (isRefreshing: boolean) => {
          set({ isRefreshing });
        },

        // Clear all auth data
        reset: () => {
          set({
            isAuthenticated: false,
            isLoading: false,
            user: null,
            error: null,
            isRefreshing: false,
          });
        },
      }),
      {
        name: 'auth-storage',
        partialize: (state) => ({
          isAuthenticated: state.isAuthenticated,
          user: state.user,
        }),
        onRehydrateStorage: () => (state) => {
          // Validate stored session on hydration
          if (state?.user?.sessionToken) {
            // Check if token is expired
            const tokenExpiryDate = state.user.tokenExpiryDate;
            if (tokenExpiryDate && new Date(tokenExpiryDate) <= new Date()) {
              state.reset();
            }
          }
        },
      }
    )
  )
);

// ============================================================================
// REACT QUERY KEY FACTORIES
// ============================================================================

/**
 * Query key factory for authentication-related queries
 * Ensures consistent cache key generation and invalidation
 */
const authKeys = {
  all: ['auth'] as const,
  session: () => [...authKeys.all, 'session'] as const,
  user: (userId?: number) => [...authKeys.all, 'user', userId] as const,
  permissions: (userId?: number) => [...authKeys.all, 'permissions', userId] as const,
  refresh: () => [...authKeys.all, 'refresh'] as const,
} as const;

// ============================================================================
// API FUNCTIONS FOR AUTHENTICATION
// ============================================================================

/**
 * Login API call with credentials
 */
async function loginUser(credentials: LoginCredentials): Promise<LoginResponse> {
  const response = await apiClient.post<LoginResponse>('/user/session', {
    ...credentials,
    // Ensure either email or username is provided
    email: credentials.email || undefined,
    username: credentials.username || undefined,
  });

  if (!response.data?.sessionToken && !response.data?.session_token) {
    throw new Error('Login failed: No session token received');
  }

  return response.data;
}

/**
 * Login with existing JWT token
 */
async function loginWithJwtToken(token: string): Promise<UserSession> {
  const response = await apiClient.get<UserSession>('/user/profile', {
    headers: {
      'X-DreamFactory-Session-Token': token,
      'Authorization': `Bearer ${token}`,
    },
  });

  if (!response.data) {
    throw new Error('Failed to retrieve user profile');
  }

  // Construct full user session from profile data
  const userSession: UserSession = {
    ...response.data,
    sessionToken: token,
    sessionId: `session_${response.data.id}_${Date.now()}`,
    tokenExpiryDate: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours default
    lastLoginDate: new Date().toISOString(),
  };

  return userSession;
}

/**
 * Logout API call
 */
async function logoutUser(): Promise<void> {
  try {
    await apiClient.delete('/user/session');
  } catch (error) {
    // Even if the API call fails, we should clear local session
    console.warn('Logout API call failed, but continuing with local cleanup:', error);
  }
}

/**
 * Validate current session
 */
async function validateSession(): Promise<UserSession | null> {
  try {
    const response = await apiClient.get<UserSession>('/user/session');
    return response.data || null;
  } catch (error) {
    // Session is invalid
    return null;
  }
}

/**
 * Refresh authentication token
 */
async function refreshAuthToken(): Promise<TokenRefreshResult> {
  try {
    const response = await apiClient.post<{ sessionToken: string; expiresIn: number }>('/user/session/refresh');
    
    if (!response.data?.sessionToken) {
      return {
        success: false,
        error: 'No refresh token received',
        requiresReauth: true,
      };
    }

    return {
      success: true,
      accessToken: response.data.sessionToken,
      expiresIn: response.data.expiresIn || 24 * 60 * 60, // 24 hours default
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Token refresh failed',
      requiresReauth: true,
    };
  }
}

/**
 * Fetch user permissions
 */
async function fetchUserPermissions(userId: number): Promise<UserPermissions> {
  const response = await apiClient.get<{ permissions: UserPermissions }>(`/user/${userId}/permissions`);
  return response.data?.permissions || [];
}

// ============================================================================
// MAIN USE-AUTH HOOK
// ============================================================================

/**
 * Main authentication hook providing comprehensive auth management
 * Integrates React Query mutations with Zustand state for optimal performance
 */
export function useAuth() {
  const router = useRouter();
  const queryClient = useQueryClient();
  
  // Access Zustand store state and actions
  const {
    isAuthenticated,
    isLoading,
    user,
    error,
    isRefreshing,
    setAuthenticated,
    setLoading,
    setError,
    setRefreshing,
    updateUser,
    clearError,
    reset,
  } = useAuthStore();

  // ============================================================================
  // REACT QUERY MUTATIONS
  // ============================================================================

  /**
   * Login mutation with optimistic updates and error handling
   */
  const loginMutation = useMutation({
    mutationFn: loginUser,
    onMutate: () => {
      setLoading(true);
      setError(null);
    },
    onSuccess: async (response) => {
      try {
        // Extract session token from response
        const sessionToken = response.sessionToken || response.session_token;
        if (!sessionToken) {
          throw new Error('No session token in login response');
        }

        // Store token in localStorage for API client
        if (typeof window !== 'undefined') {
          localStorage.setItem('session_token', sessionToken);
        }

        // Create user session object
        const userSession: UserSession = {
          ...response.user,
          sessionToken,
          sessionId: `session_${response.user?.id}_${Date.now()}`,
          tokenExpiryDate: response.expiresAt 
            ? new Date(response.expiresAt)
            : new Date(Date.now() + 24 * 60 * 60 * 1000),
          lastLoginDate: new Date().toISOString(),
        } as UserSession;

        // Update Zustand store
        setAuthenticated(true, userSession);
        
        // Invalidate and refetch auth-related queries
        await queryClient.invalidateQueries({ queryKey: authKeys.all });
        
        // Pre-fetch user permissions
        if (userSession.id) {
          queryClient.prefetchQuery({
            queryKey: authKeys.permissions(userSession.id),
            queryFn: () => fetchUserPermissions(userSession.id),
          });
        }

        // Navigate to home page
        router.push('/');
        
      } catch (error) {
        setError({
          code: AuthErrorCode.SERVER_ERROR,
          message: error instanceof Error ? error.message : 'Login processing failed',
          timestamp: new Date().toISOString(),
        });
      } finally {
        setLoading(false);
      }
    },
    onError: (error: Error) => {
      setLoading(false);
      setError({
        code: AuthErrorCode.INVALID_CREDENTIALS,
        message: error.message || 'Login failed',
        timestamp: new Date().toISOString(),
      });
    },
  });

  /**
   * Login with JWT token mutation
   */
  const loginWithTokenMutation = useMutation({
    mutationFn: loginWithJwtToken,
    onMutate: () => {
      setLoading(true);
      setError(null);
    },
    onSuccess: async (userSession) => {
      try {
        // Store token in localStorage
        if (typeof window !== 'undefined') {
          localStorage.setItem('session_token', userSession.sessionToken);
        }

        // Update Zustand store
        setAuthenticated(true, userSession);
        
        // Invalidate and refetch auth-related queries
        await queryClient.invalidateQueries({ queryKey: authKeys.all });
        
        // Pre-fetch user permissions
        if (userSession.id) {
          queryClient.prefetchQuery({
            queryKey: authKeys.permissions(userSession.id),
            queryFn: () => fetchUserPermissions(userSession.id),
          });
        }

        // Navigate to home page
        router.push('/');
        
      } catch (error) {
        setError({
          code: AuthErrorCode.SERVER_ERROR,
          message: error instanceof Error ? error.message : 'Token login processing failed',
          timestamp: new Date().toISOString(),
        });
      } finally {
        setLoading(false);
      }
    },
    onError: (error: Error) => {
      setLoading(false);
      setError({
        code: AuthErrorCode.TOKEN_INVALID,
        message: error.message || 'Token login failed',
        timestamp: new Date().toISOString(),
      });
    },
  });

  /**
   * Logout mutation with cleanup
   */
  const logoutMutation = useMutation({
    mutationFn: logoutUser,
    onMutate: () => {
      setLoading(true);
    },
    onSuccess: async () => {
      // Clear localStorage
      if (typeof window !== 'undefined') {
        localStorage.removeItem('session_token');
      }

      // Reset Zustand store
      reset();
      
      // Clear all React Query cache
      queryClient.clear();
      
      // Navigate to login page
      router.push('/login');
      
      setLoading(false);
    },
    onError: (error: Error) => {
      // Even on error, clear local state
      if (typeof window !== 'undefined') {
        localStorage.removeItem('session_token');
      }
      reset();
      queryClient.clear();
      router.push('/login');
      setLoading(false);
    },
  });

  /**
   * Token refresh mutation with automatic retry
   */
  const refreshTokenMutation = useMutation({
    mutationFn: refreshAuthToken,
    onMutate: () => {
      setRefreshing(true);
    },
    onSuccess: async (result) => {
      setRefreshing(false);
      
      if (result.success && result.accessToken) {
        // Update stored token
        if (typeof window !== 'undefined') {
          localStorage.setItem('session_token', result.accessToken);
        }
        
        // Update user session with new token
        if (user) {
          const updatedUser: UserSession = {
            ...user,
            sessionToken: result.accessToken,
            tokenExpiryDate: new Date(Date.now() + (result.expiresIn || 24 * 60 * 60) * 1000),
          };
          setAuthenticated(true, updatedUser);
        }
        
        // Invalidate session query to refetch with new token
        await queryClient.invalidateQueries({ queryKey: authKeys.session() });
      } else if (result.requiresReauth) {
        // Force logout and redirect to login
        logoutMutation.mutate();
      }
    },
    onError: () => {
      setRefreshing(false);
      // Force logout on refresh failure
      logoutMutation.mutate();
    },
  });

  // ============================================================================
  // REACT QUERY QUERIES
  // ============================================================================

  /**
   * Session validation query with automatic background refetching
   */
  const sessionQuery = useQuery({
    queryKey: authKeys.session(),
    queryFn: validateSession,
    enabled: isAuthenticated && !!user?.sessionToken,
    staleTime: 5 * 60 * 1000, // 5 minutes
    cacheTime: 10 * 60 * 1000, // 10 minutes
    refetchInterval: 15 * 60 * 1000, // 15 minutes background refetch
    refetchIntervalInBackground: true,
    refetchOnWindowFocus: true,
    retry: (failureCount, error) => {
      // Don't retry on auth errors
      if (error && typeof error === 'object' && 'status' in error) {
        const status = (error as any).status;
        if (status === 401 || status === 403) {
          return false;
        }
      }
      return failureCount < 2;
    },
    onError: () => {
      // Session is invalid, logout user
      logoutMutation.mutate();
    },
  });

  /**
   * User permissions query with caching
   */
  const permissionsQuery = useQuery({
    queryKey: authKeys.permissions(user?.id),
    queryFn: () => user?.id ? fetchUserPermissions(user.id) : Promise.resolve([]),
    enabled: isAuthenticated && !!user?.id,
    staleTime: 15 * 60 * 1000, // 15 minutes
    cacheTime: 30 * 60 * 1000, // 30 minutes
  });

  // ============================================================================
  // AUTOMATIC TOKEN REFRESH LOGIC
  // ============================================================================

  /**
   * Setup automatic token refresh based on expiration
   */
  useEffect(() => {
    if (!isAuthenticated || !user?.tokenExpiryDate || isRefreshing) {
      return;
    }

    const expiryDate = new Date(user.tokenExpiryDate);
    const now = new Date();
    const timeUntilExpiry = expiryDate.getTime() - now.getTime();
    
    // Refresh token 5 minutes before expiry
    const refreshTime = timeUntilExpiry - (5 * 60 * 1000);
    
    if (refreshTime > 0) {
      const refreshTimeout = setTimeout(() => {
        refreshTokenMutation.mutate();
      }, refreshTime);
      
      return () => clearTimeout(refreshTimeout);
    } else if (timeUntilExpiry <= 0) {
      // Token is already expired, logout immediately
      logoutMutation.mutate();
    }
  }, [isAuthenticated, user?.tokenExpiryDate, isRefreshing, refreshTokenMutation, logoutMutation]);

  // ============================================================================
  // PERMISSION CHECKING UTILITIES
  // ============================================================================

  /**
   * Check if user has specific permission
   */
  const hasPermission = useCallback((permission: string): boolean => {
    if (!isAuthenticated || !user) {
      return false;
    }

    // Root admin has all permissions
    if (user.isRootAdmin || user.isSysAdmin) {
      return true;
    }

    // Check against cached permissions
    const permissions = permissionsQuery.data || [];
    return permissions.some(p => 
      p.resource === permission || 
      p.operations?.includes(permission as any)
    );
  }, [isAuthenticated, user, permissionsQuery.data]);

  /**
   * Check if user has any of the specified permissions
   */
  const hasAnyPermission = useCallback((permissions: string[]): boolean => {
    return permissions.some(permission => hasPermission(permission));
  }, [hasPermission]);

  /**
   * Check if user has all specified permissions
   */
  const hasAllPermissions = useCallback((permissions: string[]): boolean => {
    return permissions.every(permission => hasPermission(permission));
  }, [hasPermission]);

  // ============================================================================
  // RETURN HOOK INTERFACE
  // ============================================================================

  return {
    // Authentication state
    isAuthenticated,
    isLoading: isLoading || loginMutation.isPending || logoutMutation.isPending,
    user,
    error,
    isRefreshing: isRefreshing || refreshTokenMutation.isPending,

    // Authentication actions (React Query mutations)
    login: loginMutation,
    loginWithToken: loginWithTokenMutation,
    logout: logoutMutation,
    refreshToken: refreshTokenMutation,

    // User management
    updateUser,
    clearError,

    // Session and permission data
    sessionData: sessionQuery.data,
    permissions: permissionsQuery.data || [],
    isSessionLoading: sessionQuery.isLoading,
    isPermissionsLoading: permissionsQuery.isLoading,

    // Permission checking utilities
    hasPermission,
    hasAnyPermission,
    hasAllPermissions,

    // Direct mutation functions for imperative usage
    mutateLogin: loginMutation.mutateAsync,
    mutateLoginWithToken: loginWithTokenMutation.mutateAsync,
    mutateLogout: logoutMutation.mutateAsync,
    mutateRefreshToken: refreshTokenMutation.mutateAsync,
  };
}

// ============================================================================
// EXPORTS
// ============================================================================

export default useAuth;

// Export types for external usage
export type {
  AuthState,
  AuthActions,
  AuthStore,
  AuthError,
  UserSession,
  LoginCredentials,
  LoginResponse,
  UserPermissions,
};

// Export auth store for direct access if needed
export { useAuthStore };

// Export query key factory for external invalidation
export { authKeys };