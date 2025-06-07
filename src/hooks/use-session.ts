'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useCallback, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';

// Types for session management
interface SessionToken {
  token: string;
  expires_at: string;
  refresh_token?: string;
  user_id: number;
  session_id: string;
}

interface SessionUser {
  id: number;
  email: string;
  first_name?: string;
  last_name?: string;
  display_name?: string;
  last_login_date?: string;
  roles?: UserRole[];
  permissions?: string[];
  is_sys_admin?: boolean;
  is_active: boolean;
}

interface UserRole {
  id: number;
  name: string;
  description?: string;
  is_active: boolean;
  role_service_access?: RoleServiceAccess[];
}

interface RoleServiceAccess {
  service_id: number;
  component: string;
  verb_mask: number;
  requestor_type: string;
  access_mask?: number;
}

interface SessionData {
  token: SessionToken;
  user: SessionUser;
  restrictedAccess?: boolean;
  lastActivity: string;
  expiresAt: string;
  csrfToken?: string;
}

interface SessionValidationResponse {
  success: boolean;
  session?: SessionData;
  error?: string;
  refreshed?: boolean;
}

interface SessionRefreshResponse {
  token: string;
  expires_at: string;
  refresh_token?: string;
  success: boolean;
  error?: string;
}

interface SessionLoginRequest {
  email: string;
  password: string;
  remember_me?: boolean;
  duration?: number;
}

interface SessionLoginResponse {
  success: boolean;
  session_token?: string;
  session_id?: string;
  user?: SessionUser;
  expires_at?: string;
  refresh_token?: string;
  error?: string;
}

interface UseSessionOptions {
  enabled?: boolean;
  refreshInterval?: number;
  onSessionExpired?: () => void;
  onSessionRefreshed?: (session: SessionData) => void;
  onLoginSuccess?: (session: SessionData) => void;
  onLogoutComplete?: () => void;
}

interface UseSessionReturn {
  // Session state
  session: SessionData | null;
  user: SessionUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  isValidating: boolean;
  isRefreshing: boolean;
  error: Error | null;
  
  // Session metadata
  expiresAt: Date | null;
  timeUntilExpiry: number | null;
  isExpired: boolean;
  restrictedAccess: boolean;
  
  // Actions
  login: (credentials: SessionLoginRequest) => Promise<SessionLoginResponse>;
  logout: () => Promise<void>;
  refresh: () => Promise<SessionRefreshResponse>;
  validateSession: () => Promise<SessionValidationResponse>;
  clearSession: () => void;
  updateLastActivity: () => void;
  
  // Permissions
  hasRole: (roleName: string) => boolean;
  hasPermission: (permission: string) => boolean;
  canAccessService: (serviceId: number, verb?: string) => boolean;
}

const SESSION_QUERY_KEY = ['session'];
const SESSION_REFRESH_INTERVAL = 5 * 60 * 1000; // 5 minutes
const SESSION_VALIDATION_INTERVAL = 30 * 1000; // 30 seconds
const SESSION_EXPIRY_WARNING_TIME = 5 * 60 * 1000; // 5 minutes before expiry

/**
 * Custom hook for secure session management with React Query caching
 * 
 * Features:
 * - HTTP-only cookie handling with SameSite=Strict configuration
 * - Automatic session validation and refresh using React Query background refetching
 * - Session expiration detection with automatic logout workflows
 * - Session metadata management including user roles and access restrictions
 * - Integration with Next.js middleware for server-side session validation
 * 
 * @param options Configuration options for session management
 * @returns Session management interface with state and actions
 */
export function useSession(options: UseSessionOptions = {}): UseSessionReturn {
  const {
    enabled = true,
    refreshInterval = SESSION_REFRESH_INTERVAL,
    onSessionExpired,
    onSessionRefreshed,
    onLoginSuccess,
    onLogoutComplete,
  } = options;

  const queryClient = useQueryClient();
  const router = useRouter();

  // Session validation query with React Query caching
  const sessionQuery = useQuery({
    queryKey: SESSION_QUERY_KEY,
    queryFn: async (): Promise<SessionData | null> => {
      try {
        const response = await fetch('/api/auth/session/validate', {
          method: 'GET',
          credentials: 'include', // Include HTTP-only cookies
          headers: {
            'Content-Type': 'application/json',
            'Cache-Control': 'no-cache',
          },
        });

        if (!response.ok) {
          if (response.status === 401) {
            return null; // Session not found or expired
          }
          throw new Error(`Session validation failed: ${response.statusText}`);
        }

        const result: SessionValidationResponse = await response.json();
        
        if (!result.success || !result.session) {
          return null;
        }

        // Update last activity timestamp
        result.session.lastActivity = new Date().toISOString();
        
        return result.session;
      } catch (error) {
        console.error('Session validation error:', error);
        throw error;
      }
    },
    enabled,
    staleTime: SESSION_VALIDATION_INTERVAL,
    cacheTime: refreshInterval,
    refetchInterval: SESSION_VALIDATION_INTERVAL,
    refetchOnMount: 'always',
    refetchOnWindowFocus: true,
    refetchOnReconnect: true,
    retry: (failureCount, error) => {
      // Don't retry 401 errors (unauthenticated)
      if (error && 'status' in error && error.status === 401) {
        return false;
      }
      return failureCount < 2;
    },
    onSuccess: (session) => {
      if (session && onSessionRefreshed) {
        onSessionRefreshed(session);
      }
    },
    onError: (error) => {
      console.error('Session query error:', error);
      // Clear session data on persistent errors
      if (error && 'status' in error && error.status === 401) {
        queryClient.setQueryData(SESSION_QUERY_KEY, null);
      }
    },
  });

  // Session refresh mutation
  const refreshMutation = useMutation({
    mutationFn: async (): Promise<SessionRefreshResponse> => {
      try {
        const response = await fetch('/api/auth/session/refresh', {
          method: 'POST',
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json',
          },
        });

        const result: SessionRefreshResponse = await response.json();
        
        if (!result.success) {
          throw new Error(result.error || 'Session refresh failed');
        }

        return result;
      } catch (error) {
        console.error('Session refresh error:', error);
        throw error;
      }
    },
    onSuccess: () => {
      // Invalidate session query to trigger refetch with new token
      queryClient.invalidateQueries({ queryKey: SESSION_QUERY_KEY });
    },
    onError: (error) => {
      console.error('Session refresh failed:', error);
      // If refresh fails, trigger logout
      if (onSessionExpired) {
        onSessionExpired();
      }
    },
  });

  // Login mutation
  const loginMutation = useMutation({
    mutationFn: async (credentials: SessionLoginRequest): Promise<SessionLoginResponse> => {
      try {
        const response = await fetch('/api/auth/session/login', {
          method: 'POST',
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(credentials),
        });

        const result: SessionLoginResponse = await response.json();
        
        if (!result.success) {
          throw new Error(result.error || 'Login failed');
        }

        return result;
      } catch (error) {
        console.error('Login error:', error);
        throw error;
      }
    },
    onSuccess: (result) => {
      // Invalidate session query to fetch fresh session data
      queryClient.invalidateQueries({ queryKey: SESSION_QUERY_KEY });
      
      // Trigger success callback if session data is available
      if (result.user && onLoginSuccess) {
        const sessionData: SessionData = {
          token: {
            token: result.session_token!,
            expires_at: result.expires_at!,
            refresh_token: result.refresh_token,
            user_id: result.user.id,
            session_id: result.session_id!,
          },
          user: result.user,
          lastActivity: new Date().toISOString(),
          expiresAt: result.expires_at!,
        };
        onLoginSuccess(sessionData);
      }
    },
  });

  // Logout mutation
  const logoutMutation = useMutation({
    mutationFn: async (): Promise<void> => {
      try {
        await fetch('/api/auth/session/logout', {
          method: 'POST',
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json',
          },
        });
      } catch (error) {
        console.error('Logout error:', error);
        // Continue with logout even if API call fails
      }
    },
    onSettled: () => {
      // Clear all session data and redirect
      queryClient.setQueryData(SESSION_QUERY_KEY, null);
      queryClient.removeQueries({ queryKey: SESSION_QUERY_KEY });
      
      if (onLogoutComplete) {
        onLogoutComplete();
      }
      
      // Redirect to login page
      router.push('/login');
    },
  });

  // Derived state
  const session = sessionQuery.data;
  const user = session?.user || null;
  const isAuthenticated = !!session && !!user;
  const isLoading = sessionQuery.isLoading || sessionQuery.isFetching;
  const isValidating = sessionQuery.isFetching && !sessionQuery.isLoading;
  const isRefreshing = refreshMutation.isPending;
  const error = sessionQuery.error || loginMutation.error || logoutMutation.error || refreshMutation.error;

  // Session expiry calculations
  const expiresAt = useMemo(() => {
    if (!session?.expiresAt) return null;
    return new Date(session.expiresAt);
  }, [session?.expiresAt]);

  const timeUntilExpiry = useMemo(() => {
    if (!expiresAt) return null;
    return Math.max(0, expiresAt.getTime() - Date.now());
  }, [expiresAt]);

  const isExpired = useMemo(() => {
    if (!timeUntilExpiry) return false;
    return timeUntilExpiry <= 0;
  }, [timeUntilExpiry]);

  const restrictedAccess = session?.restrictedAccess || false;

  // Session expiry monitoring
  useEffect(() => {
    if (!timeUntilExpiry || timeUntilExpiry <= 0) return;

    // Set timeout to warn about approaching expiry
    const warningTimeout = setTimeout(() => {
      if (timeUntilExpiry <= SESSION_EXPIRY_WARNING_TIME) {
        console.warn('Session expiring soon. Consider refreshing.');
        // Attempt automatic refresh if very close to expiry
        if (timeUntilExpiry <= 60 * 1000) { // 1 minute
          refreshMutation.mutate();
        }
      }
    }, Math.max(0, timeUntilExpiry - SESSION_EXPIRY_WARNING_TIME));

    // Set timeout for actual expiry
    const expiryTimeout = setTimeout(() => {
      if (onSessionExpired) {
        onSessionExpired();
      } else {
        logoutMutation.mutate();
      }
    }, timeUntilExpiry);

    return () => {
      clearTimeout(warningTimeout);
      clearTimeout(expiryTimeout);
    };
  }, [timeUntilExpiry, onSessionExpired, refreshMutation, logoutMutation]);

  // Action methods
  const login = useCallback(async (credentials: SessionLoginRequest): Promise<SessionLoginResponse> => {
    const result = await loginMutation.mutateAsync(credentials);
    return result;
  }, [loginMutation]);

  const logout = useCallback(async (): Promise<void> => {
    await logoutMutation.mutateAsync();
  }, [logoutMutation]);

  const refresh = useCallback(async (): Promise<SessionRefreshResponse> => {
    const result = await refreshMutation.mutateAsync();
    return result;
  }, [refreshMutation]);

  const validateSession = useCallback(async (): Promise<SessionValidationResponse> => {
    try {
      await queryClient.invalidateQueries({ queryKey: SESSION_QUERY_KEY });
      const session = await queryClient.fetchQuery({
        queryKey: SESSION_QUERY_KEY,
        queryFn: sessionQuery.queryFn!,
      });
      
      return {
        success: !!session,
        session: session || undefined,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Session validation failed',
      };
    }
  }, [queryClient, sessionQuery.queryFn]);

  const clearSession = useCallback(() => {
    queryClient.setQueryData(SESSION_QUERY_KEY, null);
    queryClient.removeQueries({ queryKey: SESSION_QUERY_KEY });
  }, [queryClient]);

  const updateLastActivity = useCallback(() => {
    if (session) {
      const updatedSession = {
        ...session,
        lastActivity: new Date().toISOString(),
      };
      queryClient.setQueryData(SESSION_QUERY_KEY, updatedSession);
    }
  }, [session, queryClient]);

  // Permission and role checking methods
  const hasRole = useCallback((roleName: string): boolean => {
    if (!user?.roles) return false;
    return user.roles.some(role => role.name === roleName && role.is_active);
  }, [user?.roles]);

  const hasPermission = useCallback((permission: string): boolean => {
    if (!user?.permissions) return false;
    return user.permissions.includes(permission);
  }, [user?.permissions]);

  const canAccessService = useCallback((serviceId: number, verb?: string): boolean => {
    if (!user?.roles) return false;
    
    // System admins have access to everything
    if (user.is_sys_admin) return true;
    
    // Check role-based service access
    for (const role of user.roles) {
      if (!role.is_active || !role.role_service_access) continue;
      
      const serviceAccess = role.role_service_access.find(
        access => access.service_id === serviceId
      );
      
      if (serviceAccess) {
        // If no specific verb is requested, any access is sufficient
        if (!verb) return true;
        
        // Check verb-specific access using bitmask
        const verbMasks: Record<string, number> = {
          'GET': 1,
          'POST': 2,
          'PUT': 4,
          'PATCH': 8,
          'DELETE': 16,
        };
        
        const requiredMask = verbMasks[verb.toUpperCase()];
        if (requiredMask && (serviceAccess.verb_mask & requiredMask) > 0) {
          return true;
        }
      }
    }
    
    return false;
  }, [user]);

  return {
    // Session state
    session,
    user,
    isAuthenticated,
    isLoading,
    isValidating,
    isRefreshing,
    error: error as Error | null,
    
    // Session metadata
    expiresAt,
    timeUntilExpiry,
    isExpired,
    restrictedAccess,
    
    // Actions
    login,
    logout,
    refresh,
    validateSession,
    clearSession,
    updateLastActivity,
    
    // Permissions
    hasRole,
    hasPermission,
    canAccessService,
  };
}

// Export types for external use
export type {
  SessionData,
  SessionUser,
  SessionToken,
  UserRole,
  RoleServiceAccess,
  SessionValidationResponse,
  SessionRefreshResponse,
  SessionLoginRequest,
  SessionLoginResponse,
  UseSessionOptions,
  UseSessionReturn,
};

// Export constants for configuration
export {
  SESSION_QUERY_KEY,
  SESSION_REFRESH_INTERVAL,
  SESSION_VALIDATION_INTERVAL,
  SESSION_EXPIRY_WARNING_TIME,
};