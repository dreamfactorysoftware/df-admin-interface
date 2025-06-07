/**
 * User Data Management Hook
 * 
 * Comprehensive user data management hook that handles current user state, profile
 * information, and user-related operations. Replaces Angular UserService and 
 * DfUserDataService with React patterns for reactive user data management,
 * localStorage persistence, and session coordination.
 * 
 * Key Features:
 * - User profile state management with React Query integration
 * - LocalStorage synchronization for user preferences and profile data
 * - Reactive user data updates coordinated with authentication state changes
 * - User profile mutation capabilities with optimistic updates
 * - Session token integration for authenticated API requests
 * - Role-based access control integration with permission checking
 * - Cross-tab synchronization for user data consistency
 * 
 * @fileoverview User management hook for the DreamFactory Admin Interface
 * @version 1.0.0
 * @since React 19.0.0, Next.js 15.1+, TypeScript 5.8+
 */

import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { 
  UserProfile, 
  AdminProfile, 
  UserSession,
  UserParams,
  UpdatePasswordRequest,
  UpdatePasswordResponse,
  UserProfileFormData,
  UserProfileSchema,
  type UserAction,
  type SessionValidationResult,
  type SessionError
} from '@/types/user';
import { useLocalStorage } from './use-local-storage';
import { 
  AuthClient,
  CrudClient,
  createCrudClient,
  generateAuthHeaders,
  type RequestConfig
} from '@/lib/api-client';
import { 
  getSessionManager,
  getCurrentUserSession,
  isAuthenticated,
  userHasPermission,
  userHasRole,
  onSessionStateChange,
  type UserSession as SessionUserSession,
  type SessionStateChangeListener
} from '@/lib/auth/session';

// =============================================================================
// TYPES AND INTERFACES
// =============================================================================

/**
 * User preferences interface for localStorage persistence
 */
export interface UserPreferences {
  theme?: 'light' | 'dark' | 'system';
  language?: string;
  timezone?: string;
  dateFormat?: string;
  timeFormat?: '12h' | '24h';
  tablePageSize?: number;
  notifications?: {
    email?: boolean;
    browser?: boolean;
    sound?: boolean;
  };
  layout?: {
    sidebarCollapsed?: boolean;
    density?: 'comfortable' | 'compact' | 'spacious';
  };
  dashboard?: {
    widgets?: string[];
    layout?: 'grid' | 'list';
  };
  [key: string]: any;
}

/**
 * User state interface for the hook
 */
export interface UserState {
  // Core user data
  user: UserProfile | null;
  session: UserSession | null;
  preferences: UserPreferences;
  
  // Authentication state
  isAuthenticated: boolean;
  isLoading: boolean;
  isRefreshing: boolean;
  
  // Error handling
  error: SessionError | string | null;
  lastError: Date | null;
  
  // Permissions and roles
  permissions: string[];
  roles: string[];
  isAdmin: boolean;
  isSysAdmin: boolean;
  
  // Activity tracking
  lastActivity: Date | null;
  sessionExpiresAt: Date | null;
  timeUntilExpiry: number;
}

/**
 * User mutation options
 */
export interface UserMutationOptions {
  optimistic?: boolean;
  invalidateQueries?: boolean;
  showNotification?: boolean;
  onSuccess?: (data: any) => void;
  onError?: (error: any) => void;
}

/**
 * User profile update data
 */
export interface UserProfileUpdate extends Partial<UserProfile> {
  preferences?: Partial<UserPreferences>;
}

/**
 * User hook return interface
 */
export interface UseUserReturn {
  // State data
  user: UserProfile | null;
  session: UserSession | null;
  preferences: UserPreferences;
  state: UserState;
  
  // Authentication state
  isAuthenticated: boolean;
  isLoading: boolean;
  isRefreshing: boolean;
  error: SessionError | string | null;
  
  // Permission utilities
  hasPermission: (permission: string) => boolean;
  hasRole: (roles: string | string[]) => boolean;
  hasAnyPermission: (permissions: string[]) => boolean;
  hasAllPermissions: (permissions: string[]) => boolean;
  
  // Profile operations
  updateProfile: (data: UserProfileUpdate, options?: UserMutationOptions) => Promise<UserProfile>;
  updatePreferences: (preferences: Partial<UserPreferences>, options?: UserMutationOptions) => Promise<UserPreferences>;
  updatePassword: (data: UpdatePasswordRequest, options?: UserMutationOptions) => Promise<UpdatePasswordResponse>;
  
  // Data refresh
  refreshUser: () => Promise<UserProfile | null>;
  refreshSession: () => Promise<UserSession | null>;
  
  // Utility functions
  clearUserData: () => void;
  resetPreferences: () => void;
  exportUserData: () => Record<string, any>;
  getDisplayName: () => string;
  getInitials: () => string;
  
  // Activity tracking
  updateActivity: () => void;
  getSessionTimeRemaining: () => number;
  
  // Loading states for mutations
  isUpdatingProfile: boolean;
  isUpdatingPreferences: boolean;
  isUpdatingPassword: boolean;
}

// =============================================================================
// CONSTANTS AND DEFAULTS
// =============================================================================

/**
 * Default user preferences
 */
const DEFAULT_PREFERENCES: UserPreferences = {
  theme: 'system',
  language: 'en',
  timezone: 'UTC',
  dateFormat: 'YYYY-MM-DD',
  timeFormat: '24h',
  tablePageSize: 25,
  notifications: {
    email: true,
    browser: true,
    sound: false,
  },
  layout: {
    sidebarCollapsed: false,
    density: 'comfortable',
  },
  dashboard: {
    widgets: ['quick-stats', 'recent-activity', 'system-status'],
    layout: 'grid',
  },
};

/**
 * Query keys for React Query
 */
const QUERY_KEYS = {
  user: ['user'] as const,
  profile: (userId: number) => ['user', 'profile', userId] as const,
  preferences: (userId: number) => ['user', 'preferences', userId] as const,
  session: ['user', 'session'] as const,
} as const;

/**
 * Cache configuration
 */
const CACHE_CONFIG = {
  staleTime: 5 * 60 * 1000, // 5 minutes
  gcTime: 30 * 60 * 1000, // 30 minutes
  refetchOnWindowFocus: false,
  retry: (failureCount: number, error: any) => {
    // Don't retry authentication errors
    if (error?.status === 401 || error?.status === 403) {
      return false;
    }
    return failureCount < 3;
  },
} as const;

// =============================================================================
// UTILITY FUNCTIONS
// =============================================================================

/**
 * Convert session user data to UserProfile
 */
const sessionToUserProfile = (session: SessionUserSession): UserProfile => ({
  id: session.userId ? Number(session.userId) : 0,
  username: session.username || session.email,
  email: session.email,
  first_name: session.firstName,
  last_name: session.lastName,
  display_name: session.displayName || session.email,
  is_active: true,
  permissions: session.permissions || [],
  roles: session.roles?.map(role => ({ 
    id: 0, 
    name: role, 
    is_active: true 
  })) || [],
  accessibleRoutes: session.accessibleRoutes || [],
  preferences: session.preferences || {},
  created_date: new Date().toISOString(),
  last_modified_date: new Date().toISOString(),
});

/**
 * Convert session user data to UserSession
 */
const sessionToUserSession = (session: SessionUserSession): UserSession => ({
  id: session.userId ? Number(session.userId) : 0,
  session_token: session.sessionToken || '',
  sessionToken: session.sessionToken || '',
  user_id: session.userId ? Number(session.userId) : 0,
  username: session.username || session.email,
  email: session.email,
  display_name: session.displayName || session.email,
  is_sys_admin: session.isSysAdmin || false,
  is_active: true,
  role: session.roles?.[0] ? { 
    id: 0, 
    name: session.roles[0], 
    is_active: true 
  } : undefined,
  permissions: session.permissions || [],
  accessibleRoutes: session.accessibleRoutes || [],
  created_date: new Date().toISOString(),
  expires_at: new Date(session.expiresAt).toISOString(),
  last_activity: new Date(session.lastActivity).toISOString(),
});

/**
 * Generate display name from user data
 */
const generateDisplayName = (user: UserProfile | null): string => {
  if (!user) return 'Guest';
  
  if (user.display_name) return user.display_name;
  if (user.first_name && user.last_name) {
    return `${user.first_name} ${user.last_name}`;
  }
  if (user.first_name) return user.first_name;
  if (user.name) return user.name;
  if (user.username) return user.username;
  return user.email || 'User';
};

/**
 * Generate initials from user data
 */
const generateInitials = (user: UserProfile | null): string => {
  if (!user) return 'G';
  
  const displayName = generateDisplayName(user);
  const words = displayName.split(' ').filter(Boolean);
  
  if (words.length >= 2) {
    return `${words[0][0]}${words[1][0]}`.toUpperCase();
  }
  
  return displayName.slice(0, 2).toUpperCase();
};

// =============================================================================
// MAIN HOOK IMPLEMENTATION
// =============================================================================

/**
 * User data management hook with comprehensive functionality
 * 
 * @param options Configuration options for the hook
 * @returns Complete user management interface
 * 
 * @example
 * ```typescript
 * const {
 *   user,
 *   isAuthenticated,
 *   hasPermission,
 *   updateProfile,
 *   updatePreferences,
 *   preferences
 * } = useUser();
 * 
 * // Check permissions
 * if (hasPermission('manage_users')) {
 *   // Show admin UI
 * }
 * 
 * // Update user preferences
 * await updatePreferences({ theme: 'dark' });
 * 
 * // Update profile
 * await updateProfile({ 
 *   first_name: 'John',
 *   last_name: 'Doe'
 * });
 * ```
 */
export function useUser(): UseUserReturn {
  // Initialize query client for React Query operations
  const queryClient = useQueryClient();
  
  // Session manager for authentication coordination
  const sessionManager = useMemo(() => getSessionManager(), []);
  
  // Local state management
  const [error, setError] = useState<SessionError | string | null>(null);
  const [lastError, setLastError] = useState<Date | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  
  // localStorage for user preferences with cross-tab sync
  const [preferences, setPreferences, , , preferencesError] = useLocalStorage('userPreferences', {
    defaultValue: DEFAULT_PREFERENCES,
    syncAcrossTabs: true,
    serialize: true,
    version: 1,
  });
  
  // Refs for avoiding stale closures
  const sessionListenerRef = useRef<(() => void) | null>(null);
  
  // Current session query with automatic updates
  const {
    data: currentSession,
    isLoading: isLoadingSession,
    error: sessionError,
    refetch: refetchSession,
  } = useQuery({
    queryKey: QUERY_KEYS.session,
    queryFn: async (): Promise<UserSession | null> => {
      const session = getCurrentUserSession();
      if (!session) return null;
      return sessionToUserSession(session);
    },
    ...CACHE_CONFIG,
    refetchInterval: 60000, // Refetch every minute to check session status
  });
  
  // User profile query derived from session
  const {
    data: user,
    isLoading: isLoadingUser,
    error: userError,
    refetch: refetchUser,
  } = useQuery({
    queryKey: QUERY_KEYS.user,
    queryFn: async (): Promise<UserProfile | null> => {
      const session = getCurrentUserSession();
      if (!session) return null;
      return sessionToUserProfile(session);
    },
    enabled: !!currentSession,
    ...CACHE_CONFIG,
  });
  
  // Derived state
  const isAuthenticated = useMemo(() => isAuthenticated(), [currentSession]);
  const isLoading = isLoadingSession || isLoadingUser;
  
  const permissions = useMemo(() => 
    user?.permissions || currentSession?.permissions || [], 
    [user?.permissions, currentSession?.permissions]
  );
  
  const roles = useMemo(() => 
    user?.roles?.map(r => r.name) || currentSession?.role ? [currentSession.role.name] : [],
    [user?.roles, currentSession?.role]
  );
  
  const isAdmin = useMemo(() => 
    roles.includes('admin') || roles.includes('administrator') || 
    permissions.includes('admin_access'),
    [roles, permissions]
  );
  
  const isSysAdmin = useMemo(() => 
    currentSession?.is_sys_admin || 
    roles.includes('sys_admin') || 
    permissions.includes('system_admin'),
    [currentSession?.is_sys_admin, roles, permissions]
  );
  
  // Session timing
  const timeUntilExpiry = useMemo(() => 
    sessionManager.getTimeUntilExpiry(),
    [sessionManager, currentSession?.expires_at]
  );
  
  // =============================================================================
  // PERMISSION UTILITIES
  // =============================================================================
  
  const hasPermission = useCallback((permission: string): boolean => {
    return userHasPermission(permission as any);
  }, []);
  
  const hasRole = useCallback((roleNames: string | string[]): boolean => {
    return userHasRole(roleNames);
  }, []);
  
  const hasAnyPermission = useCallback((permissionList: string[]): boolean => {
    return permissionList.some(permission => hasPermission(permission));
  }, [hasPermission]);
  
  const hasAllPermissions = useCallback((permissionList: string[]): boolean => {
    return permissionList.every(permission => hasPermission(permission));
  }, [hasPermission]);
  
  // =============================================================================
  // USER PROFILE MUTATIONS
  // =============================================================================
  
  // Create API client for user operations
  const userApiClient = useMemo(() => {
    return createCrudClient('system/user');
  }, []);
  
  // Profile update mutation
  const {
    mutateAsync: updateProfileMutation,
    isPending: isUpdatingProfile,
  } = useMutation({
    mutationFn: async (data: UserProfileUpdate): Promise<UserProfile> => {
      if (!user) throw new Error('No user session available');
      
      // Validate the data using Zod schema
      const validatedData = UserProfileSchema.parse(data);
      
      // Update user profile via API
      const response = await userApiClient.update(user.id, validatedData, {
        headers: generateAuthHeaders(),
      });
      
      return response.data;
    },
    onMutate: async (newData) => {
      // Optimistic update
      if (user) {
        const optimisticUser = { ...user, ...newData };
        queryClient.setQueryData(QUERY_KEYS.user, optimisticUser);
      }
    },
    onSuccess: (updatedUser) => {
      // Update all related queries
      queryClient.setQueryData(QUERY_KEYS.user, updatedUser);
      queryClient.setQueryData(QUERY_KEYS.profile(updatedUser.id), updatedUser);
      
      // Clear any previous errors
      setError(null);
      setLastError(null);
    },
    onError: (error, variables, context) => {
      // Revert optimistic update
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.user });
      
      // Set error state
      const errorMessage = error instanceof Error ? error.message : 'Profile update failed';
      setError(errorMessage);
      setLastError(new Date());
    },
  });
  
  // Preferences update mutation
  const {
    mutateAsync: updatePreferencesMutation,
    isPending: isUpdatingPreferences,
  } = useMutation({
    mutationFn: async (newPreferences: Partial<UserPreferences>): Promise<UserPreferences> => {
      const updatedPreferences = { ...preferences, ...newPreferences };
      
      // Update localStorage immediately
      const result = setPreferences(updatedPreferences);
      if (!result.success) {
        throw new Error(result.error || 'Failed to save preferences');
      }
      
      // Optionally sync with server if user has profile
      if (user) {
        try {
          await updateProfileMutation({
            preferences: updatedPreferences,
          });
        } catch (error) {
          // Don't throw if server sync fails, localStorage is primary for preferences
          console.warn('Failed to sync preferences to server:', error);
        }
      }
      
      return updatedPreferences;
    },
    onSuccess: (updatedPreferences) => {
      // Update React Query cache
      if (user) {
        queryClient.setQueryData(QUERY_KEYS.preferences(user.id), updatedPreferences);
      }
      setError(null);
    },
    onError: (error) => {
      const errorMessage = error instanceof Error ? error.message : 'Preferences update failed';
      setError(errorMessage);
      setLastError(new Date());
    },
  });
  
  // Password update mutation
  const {
    mutateAsync: updatePasswordMutation,
    isPending: isUpdatingPassword,
  } = useMutation({
    mutationFn: async (data: UpdatePasswordRequest): Promise<UpdatePasswordResponse> => {
      if (!user) throw new Error('No user session available');
      
      const response = await userApiClient.request<UpdatePasswordResponse>('PUT', 'password', {
        body: data,
        headers: generateAuthHeaders(),
      });
      
      return response.data;
    },
    onSuccess: (response) => {
      // If password update requires re-authentication, handle it
      if (response.requiresReauth) {
        sessionManager.clearSession('Password updated - re-authentication required');
      }
      
      setError(null);
    },
    onError: (error) => {
      const errorMessage = error instanceof Error ? error.message : 'Password update failed';
      setError(errorMessage);
      setLastError(new Date());
    },
  });
  
  // =============================================================================
  // PUBLIC API FUNCTIONS
  // =============================================================================
  
  const updateProfile = useCallback(async (
    data: UserProfileUpdate, 
    options: UserMutationOptions = {}
  ): Promise<UserProfile> => {
    try {
      const result = await updateProfileMutation(data);
      options.onSuccess?.(result);
      return result;
    } catch (error) {
      options.onError?.(error);
      throw error;
    }
  }, [updateProfileMutation]);
  
  const updatePreferences = useCallback(async (
    newPreferences: Partial<UserPreferences>,
    options: UserMutationOptions = {}
  ): Promise<UserPreferences> => {
    try {
      const result = await updatePreferencesMutation(newPreferences);
      options.onSuccess?.(result);
      return result;
    } catch (error) {
      options.onError?.(error);
      throw error;
    }
  }, [updatePreferencesMutation]);
  
  const updatePassword = useCallback(async (
    data: UpdatePasswordRequest,
    options: UserMutationOptions = {}
  ): Promise<UpdatePasswordResponse> => {
    try {
      const result = await updatePasswordMutation(data);
      options.onSuccess?.(result);
      return result;
    } catch (error) {
      options.onError?.(error);
      throw error;
    }
  }, [updatePasswordMutation]);
  
  const refreshUser = useCallback(async (): Promise<UserProfile | null> => {
    setIsRefreshing(true);
    try {
      const { data } = await refetchUser();
      return data || null;
    } finally {
      setIsRefreshing(false);
    }
  }, [refetchUser]);
  
  const refreshSession = useCallback(async (): Promise<UserSession | null> => {
    setIsRefreshing(true);
    try {
      const { data } = await refetchSession();
      return data || null;
    } finally {
      setIsRefreshing(false);
    }
  }, [refetchSession]);
  
  const clearUserData = useCallback(() => {
    queryClient.removeQueries({ queryKey: QUERY_KEYS.user });
    queryClient.removeQueries({ queryKey: QUERY_KEYS.session });
    if (user) {
      queryClient.removeQueries({ queryKey: QUERY_KEYS.profile(user.id) });
      queryClient.removeQueries({ queryKey: QUERY_KEYS.preferences(user.id) });
    }
    setError(null);
    setLastError(null);
  }, [queryClient, user]);
  
  const resetPreferences = useCallback(() => {
    const result = setPreferences(DEFAULT_PREFERENCES);
    if (!result.success) {
      setError(result.error || 'Failed to reset preferences');
    }
  }, [setPreferences]);
  
  const exportUserData = useCallback((): Record<string, any> => {
    return {
      user: user || null,
      session: currentSession || null,
      preferences: preferences || DEFAULT_PREFERENCES,
      permissions,
      roles,
      exportedAt: new Date().toISOString(),
    };
  }, [user, currentSession, preferences, permissions, roles]);
  
  const getDisplayName = useCallback((): string => {
    return generateDisplayName(user);
  }, [user]);
  
  const getInitials = useCallback((): string => {
    return generateInitials(user);
  }, [user]);
  
  const updateActivity = useCallback(() => {
    sessionManager.updateActivity();
  }, [sessionManager]);
  
  const getSessionTimeRemaining = useCallback((): number => {
    return sessionManager.getTimeUntilExpiry();
  }, [sessionManager]);
  
  // =============================================================================
  // EFFECTS AND LIFECYCLE
  // =============================================================================
  
  // Set up session state change listener
  useEffect(() => {
    const unsubscribe = onSessionStateChange((state, session) => {
      // Invalidate queries when session changes
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.session });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.user });
      
      // Clear error state on successful authentication
      if (state === 'AUTHENTICATED') {
        setError(null);
        setLastError(null);
      }
    });
    
    sessionListenerRef.current = unsubscribe;
    
    return () => {
      unsubscribe();
      sessionListenerRef.current = null;
    };
  }, [queryClient]);
  
  // Handle preference storage errors
  useEffect(() => {
    if (preferencesError) {
      setError(`Preferences storage error: ${preferencesError}`);
      setLastError(new Date());
    }
  }, [preferencesError]);
  
  // Handle session and user query errors
  useEffect(() => {
    const error = sessionError || userError;
    if (error) {
      setError(error instanceof Error ? error.message : 'Unknown error');
      setLastError(new Date());
    }
  }, [sessionError, userError]);
  
  // Build comprehensive user state
  const state: UserState = useMemo(() => ({
    user,
    session: currentSession,
    preferences: preferences || DEFAULT_PREFERENCES,
    isAuthenticated,
    isLoading,
    isRefreshing,
    error,
    lastError,
    permissions,
    roles,
    isAdmin,
    isSysAdmin,
    lastActivity: currentSession?.last_activity ? new Date(currentSession.last_activity) : null,
    sessionExpiresAt: currentSession?.expires_at ? new Date(currentSession.expires_at) : null,
    timeUntilExpiry,
  }), [
    user,
    currentSession,
    preferences,
    isAuthenticated,
    isLoading,
    isRefreshing,
    error,
    lastError,
    permissions,
    roles,
    isAdmin,
    isSysAdmin,
    timeUntilExpiry,
  ]);
  
  // =============================================================================
  // RETURN HOOK INTERFACE
  // =============================================================================
  
  return {
    // State data
    user,
    session: currentSession,
    preferences: preferences || DEFAULT_PREFERENCES,
    state,
    
    // Authentication state
    isAuthenticated,
    isLoading,
    isRefreshing,
    error,
    
    // Permission utilities
    hasPermission,
    hasRole,
    hasAnyPermission,
    hasAllPermissions,
    
    // Profile operations
    updateProfile,
    updatePreferences,
    updatePassword,
    
    // Data refresh
    refreshUser,
    refreshSession,
    
    // Utility functions
    clearUserData,
    resetPreferences,
    exportUserData,
    getDisplayName,
    getInitials,
    
    // Activity tracking
    updateActivity,
    getSessionTimeRemaining,
    
    // Loading states for mutations
    isUpdatingProfile,
    isUpdatingPreferences,
    isUpdatingPassword,
  };
}

// =============================================================================
// ADDITIONAL UTILITY HOOKS
// =============================================================================

/**
 * Lightweight hook for just checking authentication status
 */
export function useAuthStatus() {
  const { isAuthenticated, isLoading, user } = useUser();
  
  return {
    isAuthenticated,
    isLoading,
    user,
  };
}

/**
 * Hook for permission checking without full user data
 */
export function usePermissions() {
  const { hasPermission, hasRole, hasAnyPermission, hasAllPermissions, permissions, roles } = useUser();
  
  return {
    hasPermission,
    hasRole,
    hasAnyPermission,
    hasAllPermissions,
    permissions,
    roles,
  };
}

/**
 * Hook for user preferences management
 */
export function useUserPreferences() {
  const { preferences, updatePreferences, resetPreferences, isUpdatingPreferences } = useUser();
  
  return {
    preferences,
    updatePreferences,
    resetPreferences,
    isUpdating: isUpdatingPreferences,
  };
}

// =============================================================================
// TYPE EXPORTS
// =============================================================================

export type {
  UserPreferences,
  UserState,
  UserMutationOptions,
  UserProfileUpdate,
  UseUserReturn,
};