/**
 * Authentication Provider Component for DreamFactory Admin Interface
 * 
 * This React authentication context provider replaces Angular DfAuthService and DfUserDataService
 * with modern React patterns, integrating Next.js middleware authentication flow and Zustand
 * state management for enhanced security and performance.
 * 
 * Features:
 * - JWT token management with automatic refresh via Next.js middleware
 * - User session state management with React Context API
 * - TanStack React Query for intelligent user permissions caching
 * - Zustand integration for global authentication state
 * - Role-based access control (RBAC) with component-level enforcement
 * - Seamless Next.js App Router navigation for login/logout flows
 * 
 * @version 2.0.0 - React 19.0.0 + Next.js 15.1+ Migration
 * @requires React 19.0.0 for enhanced concurrent features
 * @requires Next.js 15.1+ for middleware authentication flow
 * @requires TanStack React Query 5.79.2 for permissions caching
 * @requires Zustand 5.0.3 for global state management
 */

'use client';

import React, {
  createContext,
  useContext,
  useEffect,
  useCallback,
  useMemo,
  ReactNode,
  useTransition,
} from 'react';
import { useRouter } from 'next/navigation';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import { 
  AuthContextValue,
  AuthState,
  AuthActions,
  AuthUser,
  AuthError,
  LoginCredentials,
  UserPermissions,
  UserPreferences,
  AuthProviderProps,
  HttpVerb
} from './provider-types';

// =============================================================================
// Authentication Store (Zustand Integration)
// =============================================================================

/**
 * Zustand store for authentication state management
 * Replaces Angular services with reactive state patterns
 */
interface AuthStore extends AuthState {
  // State update actions
  setUser: (user: AuthUser | null) => void;
  setToken: (token: string | null) => void;
  setPermissions: (permissions: UserPermissions) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: AuthError | null) => void;
  setAuthenticated: (authenticated: boolean) => void;
  setExpiresAt: (expiresAt: number | null) => void;
  
  // Session management
  clearSession: () => void;
  updateUserPreferences: (preferences: Partial<UserPreferences>) => void;
}

const useAuthStore = create<AuthStore>()(
  devtools(
    persist(
      (set, get) => ({
        // Initial state
        user: null,
        isAuthenticated: false,
        token: null,
        permissions: {
          services: [],
          canManageUsers: false,
          canManageServices: false,
          canManageSchema: false,
          canManageSystem: false,
          canViewApiDocs: false,
          canManageRoles: false,
        },
        expiresAt: null,
        isLoading: false,
        error: null,

        // State setters
        setUser: (user) => set({ user }),
        setToken: (token) => set({ token }),
        setPermissions: (permissions) => set({ permissions }),
        setLoading: (loading) => set({ isLoading: loading }),
        setError: (error) => set({ error }),
        setAuthenticated: (authenticated) => set({ isAuthenticated: authenticated }),
        setExpiresAt: (expiresAt) => set({ expiresAt }),

        // Session management
        clearSession: () => set({
          user: null,
          isAuthenticated: false,
          token: null,
          permissions: {
            services: [],
            canManageUsers: false,
            canManageServices: false,
            canManageSchema: false,
            canManageSystem: false,
            canViewApiDocs: false,
            canManageRoles: false,
          },
          expiresAt: null,
          error: null,
        }),

        updateUserPreferences: (newPreferences) => {
          const currentUser = get().user;
          if (currentUser) {
            set({
              user: {
                ...currentUser,
                preferences: { ...currentUser.preferences, ...newPreferences }
              }
            });
          }
        },
      }),
      {
        name: 'df-admin-auth',
        partialize: (state) => ({
          user: state.user,
          token: state.token,
          expiresAt: state.expiresAt,
          isAuthenticated: state.isAuthenticated,
        }),
      }
    ),
    {
      name: 'DreamFactory Auth Store',
    }
  )
);

// =============================================================================
// API Client Functions
// =============================================================================

/**
 * Authentication API endpoints and request functions
 * Replaces Angular HTTP client with modern fetch API
 */
const AUTH_ENDPOINTS = {
  USER_SESSION: '/api/v2/user/session',
  ADMIN_SESSION: '/api/v2/system/admin/session',
  USER_PROFILE: '/api/v2/user/profile',
  USER_PERMISSIONS: '/api/v2/user/permissions',
} as const;

/**
 * Generic API request function with authentication headers
 */
async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const token = useAuthStore.getState().token;
  
  const response = await fetch(endpoint, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token && { 'X-DreamFactory-Session-Token': token }),
      ...options.headers,
    },
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || `HTTP ${response.status}: ${response.statusText}`);
  }

  return response.json();
}

/**
 * Login API call with credential validation
 */
async function loginUser(credentials: LoginCredentials): Promise<AuthUser> {
  try {
    // Try user session first, then admin session fallback
    const response = await apiRequest<any>(AUTH_ENDPOINTS.USER_SESSION, {
      method: 'POST',
      body: JSON.stringify(credentials),
    });
    
    return transformUserSession(response);
  } catch (error) {
    // Fallback to admin session for system administrators
    try {
      const response = await apiRequest<any>(AUTH_ENDPOINTS.ADMIN_SESSION, {
        method: 'POST',
        body: JSON.stringify(credentials),
      });
      
      return transformUserSession(response);
    } catch (adminError) {
      throw error; // Throw original user session error
    }
  }
}

/**
 * Logout API call with session cleanup
 */
async function logoutUser(): Promise<void> {
  const user = useAuthStore.getState().user;
  const endpoint = user?.isAdmin 
    ? AUTH_ENDPOINTS.ADMIN_SESSION 
    : AUTH_ENDPOINTS.USER_SESSION;
    
  await apiRequest(endpoint, { method: 'DELETE' });
}

/**
 * Token refresh via Next.js middleware validation
 */
async function refreshAuthToken(): Promise<string> {
  const response = await apiRequest<{ sessionToken: string }>(
    AUTH_ENDPOINTS.USER_SESSION,
    { method: 'GET' }
  );
  
  return response.sessionToken;
}

/**
 * Validate existing session with backend
 */
async function validateSession(): Promise<AuthUser | null> {
  try {
    const response = await apiRequest<any>(AUTH_ENDPOINTS.USER_SESSION, {
      method: 'GET',
    });
    
    return transformUserSession(response);
  } catch {
    return null;
  }
}

/**
 * Fetch user permissions with role-based access control
 */
async function fetchUserPermissions(userId: number): Promise<UserPermissions> {
  const response = await apiRequest<any>(`${AUTH_ENDPOINTS.USER_PERMISSIONS}/${userId}`);
  
  return {
    services: response.services || [],
    canManageUsers: response.canManageUsers || false,
    canManageServices: response.canManageServices || false,
    canManageSchema: response.canManageSchema || false,
    canManageSystem: response.canManageSystem || false,
    canViewApiDocs: response.canViewApiDocs || false,
    canManageRoles: response.canManageRoles || false,
  };
}

/**
 * Transform backend session response to AuthUser type
 */
function transformUserSession(sessionData: any): AuthUser {
  return {
    id: sessionData.id,
    email: sessionData.email,
    name: sessionData.name || `${sessionData.firstName} ${sessionData.lastName}`.trim(),
    firstName: sessionData.firstName,
    lastName: sessionData.lastName,
    avatar: sessionData.avatar,
    roles: sessionData.roles || [],
    isActive: sessionData.isActive !== false,
    isAdmin: sessionData.isSysAdmin || sessionData.isRootAdmin || false,
    lastLogin: sessionData.lastLoginDate,
    preferences: {
      theme: 'system',
      locale: 'en',
      dashboardLayout: 'grid',
      notifications: {
        browser: true,
        email: true,
        showSuccess: true,
        showWarnings: true,
        autoDismiss: 5000,
      },
      ...sessionData.preferences,
    },
  };
}

// =============================================================================
// React Query Hooks
// =============================================================================

/**
 * User permissions query with intelligent caching
 * Replaces Angular RxJS observables with React Query
 */
function useUserPermissions(userId: number | null) {
  return useQuery({
    queryKey: ['userPermissions', userId],
    queryFn: () => fetchUserPermissions(userId!),
    enabled: !!userId,
    staleTime: 5 * 60 * 1000, // 5 minutes
    cacheTime: 10 * 60 * 1000, // 10 minutes
    retry: 2,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
  });
}

/**
 * Session validation query for authentication state restoration
 */
function useSessionValidation() {
  return useQuery({
    queryKey: ['sessionValidation'],
    queryFn: validateSession,
    retry: false,
    staleTime: 1 * 60 * 1000, // 1 minute
    cacheTime: 5 * 60 * 1000, // 5 minutes
  });
}

// =============================================================================
// Authentication Context
// =============================================================================

/**
 * React Context for authentication state and actions
 * Replaces Angular dependency injection with React Context API
 */
const AuthContext = createContext<AuthContextValue | null>(null);

/**
 * Custom hook to access authentication context
 * Provides type-safe access to auth state and actions
 */
export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  
  return context;
}

// =============================================================================
// Authentication Provider Component
// =============================================================================

/**
 * Authentication Provider Component
 * 
 * Manages authentication state, session lifecycle, and user permissions
 * with integration to Next.js middleware and React Query caching
 */
export function AuthProvider({ 
  children,
  authEndpoint,
  refreshInterval = 15 * 60 * 1000, // 15 minutes
  autoRefresh = true,
  debug = false,
}: AuthProviderProps) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [isPending, startTransition] = useTransition();
  
  // Zustand state selectors
  const authState = useAuthStore();
  const {
    user,
    isAuthenticated,
    token,
    permissions,
    expiresAt,
    isLoading,
    error,
    setUser,
    setToken,
    setPermissions,
    setLoading,
    setError,
    setAuthenticated,
    setExpiresAt,
    clearSession,
    updateUserPreferences,
  } = authState;

  // React Query hooks for server state
  const { data: validatedUser } = useSessionValidation();
  const { data: userPermissions } = useUserPermissions(user?.id || null);

  // Update permissions when data changes
  useEffect(() => {
    if (userPermissions) {
      setPermissions(userPermissions);
    }
  }, [userPermissions, setPermissions]);

  // Session validation on mount
  useEffect(() => {
    if (validatedUser) {
      setUser(validatedUser);
      setAuthenticated(true);
    } else if (validatedUser === null && isAuthenticated) {
      // Session invalid, clear state
      clearSession();
    }
  }, [validatedUser, isAuthenticated, setUser, setAuthenticated, clearSession]);

  // Automatic token refresh setup
  useEffect(() => {
    if (!autoRefresh || !isAuthenticated || !expiresAt) {
      return;
    }

    const refreshTime = expiresAt - Date.now() - 60000; // Refresh 1 minute before expiry
    
    if (refreshTime <= 0) {
      return;
    }

    const timeoutId = setTimeout(async () => {
      try {
        const newToken = await refreshAuthToken();
        setToken(newToken);
        setExpiresAt(Date.now() + refreshInterval);
        
        if (debug) {
          console.log('Auth token refreshed successfully');
        }
      } catch (error) {
        console.error('Token refresh failed:', error);
        await handleLogout();
      }
    }, refreshTime);

    return () => clearTimeout(timeoutId);
  }, [autoRefresh, isAuthenticated, expiresAt, refreshInterval, debug, setToken, setExpiresAt]);

  // Login mutation with optimistic updates
  const loginMutation = useMutation({
    mutationFn: loginUser,
    onMutate: () => {
      setLoading(true);
      setError(null);
    },
    onSuccess: (userData) => {
      setUser(userData);
      setAuthenticated(true);
      setToken(userData.sessionToken || token);
      setExpiresAt(Date.now() + refreshInterval);
      setLoading(false);
      
      // Invalidate related queries
      queryClient.invalidateQueries({ queryKey: ['userPermissions'] });
      queryClient.invalidateQueries({ queryKey: ['sessionValidation'] });
    },
    onError: (error: Error) => {
      const authError: AuthError = {
        type: 'INVALID_CREDENTIALS',
        message: error.message,
        timestamp: Date.now(),
        canRetry: true,
      };
      
      setError(authError);
      setLoading(false);
    },
  });

  // Logout mutation with cleanup
  const logoutMutation = useMutation({
    mutationFn: logoutUser,
    onMutate: () => {
      setLoading(true);
    },
    onSettled: () => {
      clearSession();
      setLoading(false);
      queryClient.clear(); // Clear all cached data
    },
  });

  // Authentication actions
  const handleLogin = useCallback(async (credentials: LoginCredentials): Promise<AuthUser> => {
    const result = await loginMutation.mutateAsync(credentials);
    
    // Navigate to dashboard on successful login
    startTransition(() => {
      router.push('/');
    });
    
    return result;
  }, [loginMutation, router]);

  const handleLogout = useCallback(async (): Promise<void> => {
    await logoutMutation.mutateAsync();
    
    // Navigate to login page
    startTransition(() => {
      router.push('/login');
    });
  }, [logoutMutation, router]);

  const handleRefreshToken = useCallback(async (): Promise<string> => {
    try {
      const newToken = await refreshAuthToken();
      setToken(newToken);
      setExpiresAt(Date.now() + refreshInterval);
      return newToken;
    } catch (error) {
      await handleLogout();
      throw error;
    }
  }, [setToken, setExpiresAt, refreshInterval, handleLogout]);

  const handleUpdateProfile = useCallback(async (updates: Partial<AuthUser>): Promise<AuthUser> => {
    if (!user) {
      throw new Error('No authenticated user');
    }

    const updatedUser = { ...user, ...updates };
    setUser(updatedUser);
    
    // Optimistically update, handle API call separately
    return updatedUser;
  }, [user, setUser]);

  const handleUpdatePreferences = useCallback(async (preferences: Partial<UserPreferences>): Promise<UserPreferences> => {
    if (!user) {
      throw new Error('No authenticated user');
    }

    const updatedPreferences = { ...user.preferences, ...preferences };
    updateUserPreferences(preferences);
    
    return updatedPreferences;
  }, [user, updateUserPreferences]);

  const handleCheckPermission = useCallback((service: string, verb: HttpVerb): boolean => {
    if (!isAuthenticated || !permissions) {
      return false;
    }

    // Root admin has all permissions
    if (user?.isAdmin) {
      return true;
    }

    // Check if user has access to the service
    return permissions.services.includes(service);
  }, [isAuthenticated, permissions, user]);

  const handleClearError = useCallback(() => {
    setError(null);
  }, [setError]);

  const handleValidateSession = useCallback(async (): Promise<boolean> => {
    try {
      const userData = await validateSession();
      
      if (userData) {
        setUser(userData);
        setAuthenticated(true);
        return true;
      } else {
        clearSession();
        return false;
      }
    } catch {
      clearSession();
      return false;
    }
  }, [setUser, setAuthenticated, clearSession]);

  // Memoized context value for performance optimization
  const contextValue = useMemo<AuthContextValue>(() => ({
    value: {
      user,
      isAuthenticated,
      token,
      permissions,
      expiresAt,
      isLoading: isLoading || isPending || loginMutation.isPending || logoutMutation.isPending,
      error,
    },
    isLoading: isLoading || isPending || loginMutation.isPending || logoutMutation.isPending,
    error,
    actions: {
      login: handleLogin,
      logout: handleLogout,
      refreshToken: handleRefreshToken,
      updateProfile: handleUpdateProfile,
      updatePreferences: handleUpdatePreferences,
      checkPermission: handleCheckPermission,
      clearError: handleClearError,
      validateSession: handleValidateSession,
    },
  }), [
    user,
    isAuthenticated,
    token,
    permissions,
    expiresAt,
    isLoading,
    isPending,
    error,
    loginMutation.isPending,
    logoutMutation.isPending,
    handleLogin,
    handleLogout,
    handleRefreshToken,
    handleUpdateProfile,
    handleUpdatePreferences,
    handleCheckPermission,
    handleClearError,
    handleValidateSession,
  ]);

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
}

// =============================================================================
// Utility Hooks and HOCs
// =============================================================================

/**
 * Hook for checking if user has specific permission
 */
export function usePermission(service: string, verb: HttpVerb = 'GET'): boolean {
  const { actions } = useAuth();
  return actions.checkPermission(service, verb);
}

/**
 * Hook for getting authentication status with loading state
 */
export function useAuthStatus() {
  const { value: { isAuthenticated }, isLoading } = useAuth();
  
  return {
    isAuthenticated,
    isLoading,
    isReady: !isLoading,
  };
}

/**
 * Higher-order component for protecting routes
 */
export function withAuth<P extends object>(
  Component: React.ComponentType<P>
): React.ComponentType<P> {
  return function AuthenticatedComponent(props: P) {
    const { value: { isAuthenticated }, isLoading } = useAuth();
    const router = useRouter();

    useEffect(() => {
      if (!isLoading && !isAuthenticated) {
        router.push('/login');
      }
    }, [isAuthenticated, isLoading, router]);

    if (isLoading) {
      return (
        <div className="flex items-center justify-center min-h-screen">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary-600"></div>
        </div>
      );
    }

    if (!isAuthenticated) {
      return null;
    }

    return <Component {...props} />;
  };
}

/**
 * Default export for the authentication provider
 */
export default AuthProvider;