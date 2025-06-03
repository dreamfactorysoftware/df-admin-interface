'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import useSWR from 'swr'
import { useSWRConfig } from 'swr'
import useLocalStorage from './use-local-storage'
import {
  UserProfile,
  AdminUser,
  UserPermissions,
  SessionState,
  NotificationPreferences,
  UserProfileUpdateForm,
  ChangePasswordForm,
  ApiResponse,
  AUTH_ERROR_CODES,
  AuthError,
  userQueryKeys,
  isAdminUser,
  isAuthenticatedUser,
  UpdateUserPayload,
  userProfileUpdateSchema
} from '../types/user'

/**
 * User hook configuration options
 */
interface UseUserOptions {
  /** Enable automatic localStorage synchronization */
  enablePersistence?: boolean
  /** Enable cross-tab synchronization */
  syncAcrossTabs?: boolean
  /** Enable automatic session refresh */
  enableAutoRefresh?: boolean
  /** Session refresh interval in milliseconds */
  refreshInterval?: number
  /** Enable real-time profile updates */
  enableRealtimeUpdates?: boolean
}

/**
 * User hook state interface
 */
interface UserState {
  user: UserProfile | null
  permissions: UserPermissions | null
  preferences: NotificationPreferences | null
  isLoading: boolean
  error: AuthError | null
  isAuthenticated: boolean
  isSystemAdmin: boolean
  lastActivity: number
  sessionExpiry: number | null
}

/**
 * User profile mutation options
 */
interface UserMutationOptions {
  optimisticUpdate?: boolean
  invalidateQueries?: boolean
  showSuccessMessage?: boolean
  onSuccess?: (user: UserProfile) => void
  onError?: (error: AuthError) => void
}

/**
 * User data management hook error class
 */
export class UserHookError extends Error {
  constructor(
    message: string,
    public readonly code: keyof typeof AUTH_ERROR_CODES,
    public readonly details?: any
  ) {
    super(message)
    this.name = 'UserHookError'
  }
}

/**
 * User data management hook that handles current user state, profile information, 
 * and user-related operations. Replaces Angular UserService and DfUserDataService 
 * with React patterns for reactive user data management, localStorage persistence, 
 * and session coordination.
 * 
 * Features:
 * - Reactive user data updates coordinated with authentication state changes
 * - LocalStorage synchronization for user data across browser sessions with JSON serialization
 * - User profile mutation capabilities using SWR/React Query for update operations
 * - Session token integration with user data for authenticated API requests
 * - Role-based user data filtering and access control integration
 * - Automatic session refresh and activity tracking
 * - Cross-tab synchronization support
 * - Comprehensive error handling and recovery
 * 
 * @param options - Configuration options for the user hook
 * @returns User state and management functions
 * 
 * @example
 * ```typescript
 * const {
 *   user,
 *   permissions,
 *   updateProfile,
 *   changePassword,
 *   isLoading,
 *   error,
 *   isAuthenticated,
 *   isSystemAdmin,
 *   hasPermission,
 *   refreshUserData,
 *   clearError
 * } = useUser({
 *   enablePersistence: true,
 *   syncAcrossTabs: true,
 *   enableAutoRefresh: true
 * })
 * ```
 */
export function useUser(options: UseUserOptions = {}) {
  const {
    enablePersistence = true,
    syncAcrossTabs = true,
    enableAutoRefresh = true,
    refreshInterval = 30000, // 30 seconds
    enableRealtimeUpdates = true
  } = options

  // SWR configuration
  const { mutate, cache } = useSWRConfig()

  // Local state management
  const [userState, setUserState] = useState<UserState>({
    user: null,
    permissions: null,
    preferences: null,
    isLoading: true,
    error: null,
    isAuthenticated: false,
    isSystemAdmin: false,
    lastActivity: Date.now(),
    sessionExpiry: null
  })

  // Persistent user data storage with cross-tab synchronization
  const [persistedUser, setPersistedUser, removePersistedUser, storageError] = useLocalStorage<UserProfile>(
    'dreamfactory_user_profile',
    {
      defaultValue: undefined,
      syncAcrossTabs,
      validator: (value): value is UserProfile => isAuthenticatedUser(value),
      enableCleanup: true,
      expirationTime: 24 * 60 * 60 * 1000, // 24 hours
      migrator: {
        version: 1,
        migrate: (oldData: unknown) => {
          // Handle any schema migrations if needed
          return oldData as UserProfile
        }
      }
    }
  )

  // Persistent user preferences storage
  const [persistedPreferences, setPersistedPreferences] = useLocalStorage<NotificationPreferences>(
    'dreamfactory_user_preferences',
    {
      defaultValue: {
        email_notifications: true,
        system_alerts: true,
        api_quota_warnings: true,
        security_notifications: true,
        maintenance_notifications: true,
        newsletter_subscription: false
      },
      syncAcrossTabs,
      enableCleanup: true
    }
  )

  // Session token from auth store (would be implemented via Zustand)
  const [sessionToken, setSessionToken] = useState<string | null>(null)

  // SWR fetcher function for user profile data
  const userProfileFetcher = useCallback(async (url: string): Promise<UserProfile> => {
    if (!sessionToken) {
      throw new UserHookError('No session token available', 'TOKEN_INVALID')
    }

    try {
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${sessionToken}`,
          'Content-Type': 'application/json',
          'X-DreamFactory-API-Key': process.env.NEXT_PUBLIC_DREAMFACTORY_API_KEY || '',
          'X-DreamFactory-Session-Token': sessionToken
        },
        credentials: 'include'
      })

      if (!response.ok) {
        if (response.status === 401) {
          throw new UserHookError('Session expired', 'SESSION_EXPIRED')
        }
        if (response.status === 403) {
          throw new UserHookError('Access denied', 'PERMISSION_DENIED')
        }
        throw new UserHookError(`HTTP error: ${response.status}`, 'SERVER_ERROR')
      }

      const data: ApiResponse<UserProfile> = await response.json()
      
      if (!data.success || !data.data) {
        throw new UserHookError('Invalid response from server', 'SERVER_ERROR')
      }

      return data.data
    } catch (error) {
      if (error instanceof UserHookError) {
        throw error
      }
      
      if (error instanceof TypeError && error.message.includes('fetch')) {
        throw new UserHookError('Network connection failed', 'NETWORK_ERROR')
      }
      
      throw new UserHookError(
        `Failed to fetch user profile: ${error instanceof Error ? error.message : 'Unknown error'}`,
        'SERVER_ERROR'
      )
    }
  }, [sessionToken])

  // SWR hook for user profile data with caching and revalidation
  const {
    data: userData,
    error: userError,
    isLoading: userLoading,
    mutate: mutateUser,
    isValidating
  } = useSWR<UserProfile, UserHookError>(
    sessionToken ? '/api/v2/user/profile' : null,
    userProfileFetcher,
    {
      refreshInterval: enableAutoRefresh ? refreshInterval : 0,
      revalidateOnFocus: true,
      revalidateOnReconnect: true,
      dedupingInterval: 5000,
      shouldRetryOnError: (error) => {
        // Don't retry on authentication errors
        return !['SESSION_EXPIRED', 'TOKEN_INVALID', 'PERMISSION_DENIED'].includes(error.code)
      },
      onError: (error: UserHookError) => {
        console.error('User profile fetch error:', error)
        setUserState(prev => ({
          ...prev,
          error: {
            code: error.code,
            message: error.message,
            details: error.details
          }
        }))
      },
      onSuccess: (data: UserProfile) => {
        // Update persisted data
        if (enablePersistence) {
          setPersistedUser(data)
        }
        
        // Update activity tracking
        setUserState(prev => ({
          ...prev,
          lastActivity: Date.now(),
          error: null
        }))
      }
    }
  )

  // SWR hook for user permissions data
  const {
    data: permissionsData,
    mutate: mutatePermissions
  } = useSWR<UserPermissions, UserHookError>(
    sessionToken && userData ? `/api/v2/user/${userData.id}/permissions` : null,
    userProfileFetcher,
    {
      refreshInterval: enableAutoRefresh ? refreshInterval * 2 : 0, // Less frequent refresh for permissions
      revalidateOnFocus: false,
      dedupingInterval: 30000 // Cache permissions for 30 seconds
    }
  )

  /**
   * Update user profile with optimistic updates and comprehensive error handling
   */
  const updateProfile = useCallback(async (
    updates: Partial<UserProfileUpdateForm>,
    options: UserMutationOptions = {}
  ): Promise<UserProfile | null> => {
    if (!sessionToken || !userData) {
      const error = new UserHookError('User not authenticated', 'TOKEN_INVALID')
      setUserState(prev => ({ ...prev, error: { code: error.code, message: error.message } }))
      options.onError?.(error)
      return null
    }

    try {
      // Validate input data
      const validatedData = userProfileUpdateSchema.parse({
        ...userData,
        ...updates
      })

      // Optimistic update if enabled
      if (options.optimisticUpdate) {
        const optimisticUser = { ...userData, ...updates }
        await mutateUser(optimisticUser, false)
        if (enablePersistence) {
          setPersistedUser(optimisticUser)
        }
      }

      // Send update request
      const response = await fetch(`/api/v2/user/${userData.id}`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${sessionToken}`,
          'Content-Type': 'application/json',
          'X-DreamFactory-API-Key': process.env.NEXT_PUBLIC_DREAMFACTORY_API_KEY || '',
          'X-DreamFactory-Session-Token': sessionToken
        },
        body: JSON.stringify(validatedData),
        credentials: 'include'
      })

      if (!response.ok) {
        // Rollback optimistic update
        if (options.optimisticUpdate) {
          await mutateUser(userData, false)
          if (enablePersistence) {
            setPersistedUser(userData)
          }
        }
        
        const errorCode = response.status === 401 ? 'SESSION_EXPIRED' : 
                         response.status === 403 ? 'PERMISSION_DENIED' : 'SERVER_ERROR'
        throw new UserHookError(`Failed to update profile: ${response.statusText}`, errorCode)
      }

      const result: ApiResponse<UserProfile> = await response.json()
      
      if (!result.success || !result.data) {
        throw new UserHookError('Invalid response from server', 'SERVER_ERROR')
      }

      // Update local cache and persistence
      await mutateUser(result.data, false)
      if (enablePersistence) {
        setPersistedUser(result.data)
      }

      // Invalidate related queries if requested
      if (options.invalidateQueries) {
        await mutate(
          key => typeof key === 'string' && key.startsWith('/api/v2/user'),
          undefined,
          { revalidate: true }
        )
      }

      setUserState(prev => ({ ...prev, error: null }))
      options.onSuccess?.(result.data)

      return result.data
    } catch (error) {
      const userError = error instanceof UserHookError ? error : 
        new UserHookError(
          `Profile update failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
          'SERVER_ERROR'
        )
      
      setUserState(prev => ({ ...prev, error: { code: userError.code, message: userError.message } }))
      options.onError?.(userError)
      
      return null
    }
  }, [sessionToken, userData, mutateUser, enablePersistence, setPersistedUser, mutate])

  /**
   * Change user password with secure handling
   */
  const changePassword = useCallback(async (
    passwordData: ChangePasswordForm,
    options: UserMutationOptions = {}
  ): Promise<boolean> => {
    if (!sessionToken || !userData) {
      const error = new UserHookError('User not authenticated', 'TOKEN_INVALID')
      setUserState(prev => ({ ...prev, error: { code: error.code, message: error.message } }))
      options.onError?.(error)
      return false
    }

    try {
      const response = await fetch('/api/v2/user/password', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${sessionToken}`,
          'Content-Type': 'application/json',
          'X-DreamFactory-API-Key': process.env.NEXT_PUBLIC_DREAMFACTORY_API_KEY || '',
          'X-DreamFactory-Session-Token': sessionToken
        },
        body: JSON.stringify(passwordData),
        credentials: 'include'
      })

      if (!response.ok) {
        const errorCode = response.status === 401 ? 'INVALID_CREDENTIALS' : 
                         response.status === 403 ? 'PERMISSION_DENIED' : 'SERVER_ERROR'
        throw new UserHookError(`Failed to change password: ${response.statusText}`, errorCode)
      }

      const result: ApiResponse = await response.json()
      
      if (!result.success) {
        throw new UserHookError('Password change failed', 'SERVER_ERROR')
      }

      setUserState(prev => ({ ...prev, error: null }))
      return true
    } catch (error) {
      const userError = error instanceof UserHookError ? error : 
        new UserHookError(
          `Password change failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
          'SERVER_ERROR'
        )
      
      setUserState(prev => ({ ...prev, error: { code: userError.code, message: userError.message } }))
      options.onError?.(userError)
      
      return false
    }
  }, [sessionToken, userData])

  /**
   * Update user preferences with persistence
   */
  const updatePreferences = useCallback(async (
    preferences: Partial<NotificationPreferences>
  ): Promise<boolean> => {
    try {
      const updatedPreferences = {
        ...userState.preferences,
        ...preferences
      }

      // Update local state
      setUserState(prev => ({
        ...prev,
        preferences: updatedPreferences
      }))

      // Persist preferences
      if (enablePersistence) {
        setPersistedPreferences(updatedPreferences)
      }

      // Update user profile with new preferences if user is authenticated
      if (userData && sessionToken) {
        await updateProfile(
          { notification_preferences: updatedPreferences },
          { optimisticUpdate: true }
        )
      }

      return true
    } catch (error) {
      console.error('Failed to update preferences:', error)
      return false
    }
  }, [userState.preferences, enablePersistence, setPersistedPreferences, userData, sessionToken, updateProfile])

  /**
   * Check if user has specific permission
   */
  const hasPermission = useCallback((permission: string): boolean => {
    if (!userState.permissions) return false
    
    // System admin has all permissions
    if (userState.isSystemAdmin) return true
    
    // Check specific permissions based on the permission string
    switch (permission) {
      case 'manage_users':
        return userState.permissions.canManageUsers
      case 'manage_roles':
        return userState.permissions.canManageRoles
      case 'manage_services':
        return userState.permissions.canManageServices
      case 'manage_apps':
        return userState.permissions.canManageApps
      case 'view_reports':
        return userState.permissions.canViewReports
      case 'configure_system':
        return userState.permissions.canConfigureSystem
      case 'manage_files':
        return userState.permissions.canManageFiles
      case 'manage_scripts':
        return userState.permissions.canManageScripts
      case 'manage_scheduler':
        return userState.permissions.canManageScheduler
      case 'manage_cache':
        return userState.permissions.canManageCache
      case 'manage_cors':
        return userState.permissions.canManageCors
      case 'manage_email_templates':
        return userState.permissions.canManageEmailTemplates
      default:
        return false
    }
  }, [userState.permissions, userState.isSystemAdmin])

  /**
   * Check if user can access specific service
   */
  const canAccessService = useCallback((serviceId: number, action: 'create' | 'read' | 'update' | 'delete' = 'read'): boolean => {
    if (!userState.permissions || !userState.permissions.serviceAccess) return false
    
    // System admin has access to all services
    if (userState.isSystemAdmin) return true
    
    const servicePermission = userState.permissions.serviceAccess.find(
      service => service.serviceId === serviceId
    )
    
    if (!servicePermission) return false
    
    switch (action) {
      case 'create':
        return servicePermission.canCreate
      case 'read':
        return servicePermission.canRead
      case 'update':
        return servicePermission.canUpdate
      case 'delete':
        return servicePermission.canDelete
      default:
        return false
    }
  }, [userState.permissions, userState.isSystemAdmin])

  /**
   * Refresh user data and permissions
   */
  const refreshUserData = useCallback(async (): Promise<void> => {
    try {
      await Promise.all([
        mutateUser(),
        mutatePermissions()
      ])
      
      setUserState(prev => ({
        ...prev,
        lastActivity: Date.now(),
        error: null
      }))
    } catch (error) {
      console.error('Failed to refresh user data:', error)
    }
  }, [mutateUser, mutatePermissions])

  /**
   * Clear current error state
   */
  const clearError = useCallback((): void => {
    setUserState(prev => ({ ...prev, error: null }))
  }, [])

  /**
   * Update activity timestamp
   */
  const updateActivity = useCallback((): void => {
    setUserState(prev => ({
      ...prev,
      lastActivity: Date.now()
    }))
  }, [])

  /**
   * Clear user data and reset state
   */
  const clearUserData = useCallback((): void => {
    setUserState({
      user: null,
      permissions: null,
      preferences: null,
      isLoading: false,
      error: null,
      isAuthenticated: false,
      isSystemAdmin: false,
      lastActivity: Date.now(),
      sessionExpiry: null
    })
    
    if (enablePersistence) {
      removePersistedUser()
    }
    
    // Clear SWR cache for user-related endpoints
    mutate(
      key => typeof key === 'string' && key.startsWith('/api/v2/user'),
      undefined,
      { revalidate: false }
    )
  }, [enablePersistence, removePersistedUser, mutate])

  // Initialize user state from persisted data
  useEffect(() => {
    if (enablePersistence && persistedUser && !userData) {
      setUserState(prev => ({
        ...prev,
        user: persistedUser,
        isAuthenticated: true,
        isSystemAdmin: isAdminUser(persistedUser),
        preferences: persistedPreferences
      }))
    }
  }, [enablePersistence, persistedUser, userData, persistedPreferences])

  // Update state when user data changes
  useEffect(() => {
    if (userData) {
      setUserState(prev => ({
        ...prev,
        user: userData,
        isAuthenticated: true,
        isSystemAdmin: isAdminUser(userData),
        isLoading: false,
        error: null
      }))
    } else if (!userLoading) {
      setUserState(prev => ({
        ...prev,
        user: null,
        isAuthenticated: false,
        isSystemAdmin: false,
        isLoading: false
      }))
    }
  }, [userData, userLoading])

  // Update permissions state
  useEffect(() => {
    if (permissionsData) {
      setUserState(prev => ({
        ...prev,
        permissions: permissionsData
      }))
    }
  }, [permissionsData])

  // Handle loading state
  useEffect(() => {
    setUserState(prev => ({
      ...prev,
      isLoading: userLoading || isValidating
    }))
  }, [userLoading, isValidating])

  // Handle storage errors
  useEffect(() => {
    if (storageError) {
      console.error('User storage error:', storageError)
      setUserState(prev => ({
        ...prev,
        error: {
          code: 'SERVER_ERROR',
          message: `Storage error: ${storageError.message}`
        }
      }))
    }
  }, [storageError])

  // Memoized return value for performance optimization
  const returnValue = useMemo(() => ({
    // User state
    user: userState.user,
    permissions: userState.permissions,
    preferences: userState.preferences,
    isLoading: userState.isLoading,
    error: userState.error,
    isAuthenticated: userState.isAuthenticated,
    isSystemAdmin: userState.isSystemAdmin,
    lastActivity: userState.lastActivity,
    sessionExpiry: userState.sessionExpiry,
    
    // User mutations
    updateProfile,
    changePassword,
    updatePreferences,
    
    // Permission checks
    hasPermission,
    canAccessService,
    
    // Utility functions
    refreshUserData,
    clearError,
    updateActivity,
    clearUserData,
    
    // SWR utilities for advanced usage
    mutateUser,
    mutatePermissions,
    
    // State flags
    isValidating,
    isRefreshing: isValidating
  }), [
    userState,
    updateProfile,
    changePassword,
    updatePreferences,
    hasPermission,
    canAccessService,
    refreshUserData,
    clearError,
    updateActivity,
    clearUserData,
    mutateUser,
    mutatePermissions,
    isValidating
  ])

  return returnValue
}

/**
 * Utility hook for getting user query keys for SWR operations
 */
export function useUserQueryKeys() {
  return useMemo(() => userQueryKeys, [])
}

/**
 * Utility hook for batch user operations
 */
export function useUserBatch() {
  const { mutate } = useSWRConfig()
  
  const invalidateAllUserQueries = useCallback(async () => {
    return mutate(
      key => typeof key === 'string' && key.startsWith('/api/v2/user'),
      undefined,
      { revalidate: true }
    )
  }, [mutate])
  
  const preloadUserData = useCallback(async (userId: number) => {
    // Preload user data for improved UX
    return mutate(`/api/v2/user/${userId}`)
  }, [mutate])
  
  return {
    invalidateAllUserQueries,
    preloadUserData
  }
}

export default useUser