/**
 * Custom React hook for authentication state management
 * 
 * Replaces Angular DfAuthService with modern React patterns:
 * - React Query mutations for login/logout/session validation
 * - Zustand state management for authentication status and user data
 * - JWT token management with automatic refresh capabilities
 * - Next.js middleware integration for enhanced security
 * - Role-based access control with permission caching
 * 
 * @author DreamFactory Team
 * @version 1.0.0
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useRouter } from 'next/navigation'
import { useCallback, useEffect } from 'react'
import { toast } from 'sonner'

// Type imports - these interfaces are expected to be defined in the dependency files
interface User {
  id: number
  email: string
  username: string
  first_name?: string
  last_name?: string
  display_name: string
  is_active: boolean
  roles?: UserRole[]
  permissions?: string[]
  last_login_date?: string
  created_date: string
  modified_date: string
}

interface UserRole {
  id: number
  name: string
  description?: string
  is_active: boolean
  role_service_access?: RoleServiceAccess[]
}

interface RoleServiceAccess {
  service_id: number
  component: string
  verb_mask: number
  filters?: string[]
  filter_op: 'AND' | 'OR'
}

interface LoginCredentials {
  email: string
  password: string
  remember_me?: boolean
}

interface LoginResponse {
  session_token: string
  session_id: string
  user: User
  expires_in?: number
  refresh_token?: string
}

interface SessionValidationResponse {
  valid: boolean
  user?: User
  expires_at?: string
  refresh_token?: string
}

interface AuthError {
  error: {
    code: number
    message: string
    details?: string[]
  }
}

// Mock API client functions - these would typically be imported from src/lib/api-client.ts
const apiClient = {
  async login(credentials: LoginCredentials): Promise<LoginResponse> {
    // This would be replaced with actual API client implementation
    const response = await fetch('/api/v2/user/session', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(credentials),
    })
    
    if (!response.ok) {
      const error: AuthError = await response.json()
      throw new Error(error.error.message || 'Authentication failed')
    }
    
    return response.json()
  },

  async logout(): Promise<void> {
    // This would be replaced with actual API client implementation
    await fetch('/api/v2/user/session', {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${getStoredToken()}` },
    })
  },

  async validateSession(): Promise<SessionValidationResponse> {
    // This would be replaced with actual API client implementation
    const token = getStoredToken()
    if (!token) {
      return { valid: false }
    }

    const response = await fetch('/api/v2/user/session', {
      method: 'GET',
      headers: { 'Authorization': `Bearer ${token}` },
    })

    if (!response.ok) {
      return { valid: false }
    }

    const data = await response.json()
    return {
      valid: true,
      user: data.user,
      expires_at: data.expires_at,
      refresh_token: data.refresh_token,
    }
  },

  async refreshToken(): Promise<LoginResponse> {
    // This would be replaced with actual API client implementation
    const refreshToken = getStoredRefreshToken()
    if (!refreshToken) {
      throw new Error('No refresh token available')
    }

    const response = await fetch('/api/v2/user/session/refresh', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${refreshToken}`,
      },
    })

    if (!response.ok) {
      const error: AuthError = await response.json()
      throw new Error(error.error.message || 'Token refresh failed')
    }

    return response.json()
  },

  async getUserPermissions(userId: number): Promise<string[]> {
    // This would be replaced with actual API client implementation
    const token = getStoredToken()
    const response = await fetch(`/api/v2/user/${userId}/permissions`, {
      headers: { 'Authorization': `Bearer ${token}` },
    })

    if (!response.ok) {
      throw new Error('Failed to fetch user permissions')
    }

    const data = await response.json()
    return data.resource || []
  }
}

// Mock Zustand store - this would typically be imported from src/stores/auth-store.ts
interface AuthStore {
  isAuthenticated: boolean
  user: User | null
  permissions: string[]
  setAuthState: (isAuthenticated: boolean, user: User | null, permissions?: string[]) => void
  clearAuth: () => void
}

// Mock store implementation - would be replaced with actual Zustand store
const useAuthStore = (): AuthStore => {
  // This is a simplified mock implementation
  // The actual implementation would use Zustand's create function
  const isAuthenticated = !!getStoredToken()
  const user = getStoredUser()
  const permissions = getStoredPermissions()

  return {
    isAuthenticated,
    user,
    permissions,
    setAuthState: (isAuthenticated: boolean, user: User | null, permissions: string[] = []) => {
      if (isAuthenticated && user) {
        storeUserData(user)
        storePermissions(permissions)
      }
    },
    clearAuth: () => {
      clearStoredAuth()
    }
  }
}

// Local storage utilities
const TOKEN_KEY = 'df_session_token'
const REFRESH_TOKEN_KEY = 'df_refresh_token'
const USER_KEY = 'df_user_data'
const PERMISSIONS_KEY = 'df_user_permissions'

function getStoredToken(): string | null {
  if (typeof window === 'undefined') return null
  return localStorage.getItem(TOKEN_KEY)
}

function getStoredRefreshToken(): string | null {
  if (typeof window === 'undefined') return null
  return localStorage.getItem(REFRESH_TOKEN_KEY)
}

function getStoredUser(): User | null {
  if (typeof window === 'undefined') return null
  const userData = localStorage.getItem(USER_KEY)
  return userData ? JSON.parse(userData) : null
}

function getStoredPermissions(): string[] {
  if (typeof window === 'undefined') return []
  const permissions = localStorage.getItem(PERMISSIONS_KEY)
  return permissions ? JSON.parse(permissions) : []
}

function storeAuthData(loginResponse: LoginResponse): void {
  if (typeof window === 'undefined') return
  
  localStorage.setItem(TOKEN_KEY, loginResponse.session_token)
  if (loginResponse.refresh_token) {
    localStorage.setItem(REFRESH_TOKEN_KEY, loginResponse.refresh_token)
  }
  storeUserData(loginResponse.user)
}

function storeUserData(user: User): void {
  if (typeof window === 'undefined') return
  localStorage.setItem(USER_KEY, JSON.stringify(user))
}

function storePermissions(permissions: string[]): void {
  if (typeof window === 'undefined') return
  localStorage.setItem(PERMISSIONS_KEY, JSON.stringify(permissions))
}

function clearStoredAuth(): void {
  if (typeof window === 'undefined') return
  
  localStorage.removeItem(TOKEN_KEY)
  localStorage.removeItem(REFRESH_TOKEN_KEY)
  localStorage.removeItem(USER_KEY)
  localStorage.removeItem(PERMISSIONS_KEY)
}

// React Query cache keys
const QUERY_KEYS = {
  session: ['auth', 'session'] as const,
  permissions: (userId: number) => ['auth', 'permissions', userId] as const,
  user: (userId: number) => ['auth', 'user', userId] as const,
} as const

/**
 * Custom hook for authentication state management
 * 
 * Provides comprehensive authentication functionality including:
 * - Login/logout operations with React Query mutations
 * - Session validation with automatic refresh
 * - User permission management with RBAC
 * - Integration with Next.js middleware for enhanced security
 * - Automatic token management and expiration handling
 */
export function useAuth() {
  const router = useRouter()
  const queryClient = useQueryClient()
  const authStore = useAuthStore()

  // Session validation query with automatic background refetching
  const sessionQuery = useQuery({
    queryKey: QUERY_KEYS.session,
    queryFn: apiClient.validateSession,
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchInterval: 15 * 60 * 1000, // 15 minutes
    refetchOnWindowFocus: true,
    retry: (failureCount, error) => {
      // Don't retry on authentication errors
      if (error.message.includes('Authentication') || error.message.includes('Unauthorized')) {
        return false
      }
      return failureCount < 3
    },
    enabled: !!getStoredToken(), // Only run if we have a token
  })

  // User permissions query with intelligent caching
  const permissionsQuery = useQuery({
    queryKey: authStore.user ? QUERY_KEYS.permissions(authStore.user.id) : ['permissions', 'disabled'],
    queryFn: () => authStore.user ? apiClient.getUserPermissions(authStore.user.id) : Promise.resolve([]),
    staleTime: 10 * 60 * 1000, // 10 minutes
    enabled: !!authStore.user?.id,
  })

  // Login mutation with optimistic updates
  const loginMutation = useMutation({
    mutationFn: apiClient.login,
    onSuccess: async (data: LoginResponse) => {
      // Store authentication data
      storeAuthData(data)
      
      // Update Zustand store
      authStore.setAuthState(true, data.user)
      
      // Update React Query cache
      queryClient.setQueryData(QUERY_KEYS.session, {
        valid: true,
        user: data.user,
        expires_at: data.expires_in ? new Date(Date.now() + data.expires_in * 1000).toISOString() : undefined,
        refresh_token: data.refresh_token,
      })

      // Fetch user permissions
      if (data.user.id) {
        const permissions = await apiClient.getUserPermissions(data.user.id)
        storePermissions(permissions)
        authStore.setAuthState(true, data.user, permissions)
        
        queryClient.setQueryData(QUERY_KEYS.permissions(data.user.id), permissions)
      }

      // Navigate to dashboard
      router.push('/adf-home')
      
      toast.success(`Welcome back, ${data.user.display_name}!`)
    },
    onError: (error: Error) => {
      console.error('Login failed:', error)
      toast.error(error.message || 'Login failed. Please try again.')
    },
  })

  // Logout mutation with cleanup
  const logoutMutation = useMutation({
    mutationFn: apiClient.logout,
    onSuccess: () => {
      performLogout()
    },
    onError: (error: Error) => {
      console.error('Logout error:', error)
      // Still perform logout cleanup even if server call fails
      performLogout()
    },
  })

  // Token refresh mutation for automatic token renewal
  const refreshTokenMutation = useMutation({
    mutationFn: apiClient.refreshToken,
    onSuccess: (data: LoginResponse) => {
      // Update stored tokens
      storeAuthData(data)
      
      // Update auth store
      authStore.setAuthState(true, data.user)
      
      // Update session query cache
      queryClient.setQueryData(QUERY_KEYS.session, {
        valid: true,
        user: data.user,
        expires_at: data.expires_in ? new Date(Date.now() + data.expires_in * 1000).toISOString() : undefined,
        refresh_token: data.refresh_token,
      })
      
      toast.success('Session refreshed successfully')
    },
    onError: (error: Error) => {
      console.error('Token refresh failed:', error)
      // Force logout on refresh failure
      performLogout()
      toast.error('Session expired. Please log in again.')
    },
  })

  // Logout cleanup function
  const performLogout = useCallback(() => {
    // Clear all stored authentication data
    clearStoredAuth()
    
    // Update Zustand store
    authStore.clearAuth()
    
    // Clear React Query cache
    queryClient.removeQueries({ queryKey: ['auth'] })
    
    // Navigate to login page
    router.push('/login')
    
    toast.info('You have been logged out')
  }, [authStore, queryClient, router])

  // Automatic token refresh when near expiration
  useEffect(() => {
    if (!sessionQuery.data?.valid || !sessionQuery.data.expires_at) {
      return
    }

    const expiresAt = new Date(sessionQuery.data.expires_at).getTime()
    const now = Date.now()
    const timeUntilExpiry = expiresAt - now
    
    // Refresh token when 5 minutes before expiration
    const refreshThreshold = 5 * 60 * 1000 // 5 minutes
    
    if (timeUntilExpiry > 0 && timeUntilExpiry <= refreshThreshold) {
      const refreshToken = getStoredRefreshToken()
      if (refreshToken && !refreshTokenMutation.isPending) {
        refreshTokenMutation.mutate()
      }
    }
  }, [sessionQuery.data, refreshTokenMutation])

  // Session validation on component mount
  useEffect(() => {
    const token = getStoredToken()
    if (token && !sessionQuery.data) {
      // Trigger session validation
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.session })
    }
  }, [queryClient, sessionQuery.data])

  // Permission checking utilities
  const hasPermission = useCallback((permission: string): boolean => {
    if (!authStore.isAuthenticated || !permissionsQuery.data) {
      return false
    }
    return permissionsQuery.data.includes(permission)
  }, [authStore.isAuthenticated, permissionsQuery.data])

  const hasRole = useCallback((roleName: string): boolean => {
    if (!authStore.user?.roles) {
      return false
    }
    return authStore.user.roles.some(role => role.name === roleName && role.is_active)
  }, [authStore.user])

  const hasAnyRole = useCallback((roleNames: string[]): boolean => {
    return roleNames.some(roleName => hasRole(roleName))
  }, [hasRole])

  const hasAllRoles = useCallback((roleNames: string[]): boolean => {
    return roleNames.every(roleName => hasRole(roleName))
  }, [hasRole])

  // Check if user can access a specific service/component
  const canAccessService = useCallback((serviceId: number, component: string, verb: string): boolean => {
    if (!authStore.user?.roles) {
      return false
    }

    const verbMasks: Record<string, number> = {
      'GET': 1,
      'POST': 2,
      'PUT': 4,
      'PATCH': 8,
      'DELETE': 16,
    }

    const verbMask = verbMasks[verb.toUpperCase()]
    if (!verbMask) {
      return false
    }

    return authStore.user.roles.some(role => {
      if (!role.is_active || !role.role_service_access) {
        return false
      }

      return role.role_service_access.some(access => 
        access.service_id === serviceId && 
        access.component === component && 
        (access.verb_mask & verbMask) === verbMask
      )
    })
  }, [authStore.user])

  return {
    // Authentication state
    isAuthenticated: authStore.isAuthenticated,
    user: authStore.user,
    permissions: permissionsQuery.data || [],
    
    // Loading states
    isLoading: sessionQuery.isLoading || permissionsQuery.isLoading,
    isValidating: sessionQuery.isFetching,
    isLoggingIn: loginMutation.isPending,
    isLoggingOut: logoutMutation.isPending,
    isRefreshing: refreshTokenMutation.isPending,
    
    // Error states
    sessionError: sessionQuery.error,
    permissionsError: permissionsQuery.error,
    loginError: loginMutation.error,
    logoutError: logoutMutation.error,
    
    // Actions
    login: loginMutation.mutate,
    logout: () => logoutMutation.mutate(),
    refreshToken: () => refreshTokenMutation.mutate(),
    
    // Utilities
    hasPermission,
    hasRole,
    hasAnyRole,
    hasAllRoles,
    canAccessService,
    
    // Session management
    validateSession: () => queryClient.invalidateQueries({ queryKey: QUERY_KEYS.session }),
    clearSession: performLogout,
  }
}

// Export types for use in other components
export type {
  User,
  UserRole,
  RoleServiceAccess,
  LoginCredentials,
  LoginResponse,
  SessionValidationResponse,
  AuthError,
}

// Export utility functions for external use
export {
  getStoredToken,
  getStoredUser,
  clearStoredAuth,
}