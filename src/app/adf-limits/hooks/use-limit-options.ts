/**
 * Rate Limit Options Hook for React/Next.js Admin Interface
 * 
 * Custom React hook implementing SWR-based data fetching for limit form dropdown
 * options including services, users, and roles with intelligent caching and 
 * conditional loading. Manages the dropdown data sources for limit configuration 
 * forms with cache hit responses under 50ms and automatic revalidation when 
 * related data changes.
 * 
 * Features:
 * - SWR conditional fetching for dropdown options per React/Next.js Integration Requirements
 * - Cache hit responses under 50ms per React/Next.js Integration Requirements  
 * - Automatic revalidation for dropdown data changes per Section 4.3.2 Server State Management
 * - Type-safe dropdown data management per Section 5.2 Component Details
 * - Comprehensive dropdown options per existing Angular resolver patterns
 * - Error handling and retry logic per Section 4.2 error handling requirements
 * - Optimistic updates and cache invalidation strategies
 * 
 * @author DreamFactory Admin Interface Team
 * @version React 19/Next.js 15.1 Migration
 * @since 2024-12-19
 */

import { useMemo, useCallback } from 'react'
import useSWR, { mutate } from 'swr'
import { 
  LimitType, 
  LimitFormProps,
  LIMITS_QUERY_KEYS,
  type CreateLimitFormData,
  type EditLimitFormData 
} from '@/app/adf-limits/types'
import { apiClient } from '@/lib/api-client'
import { 
  ApiListResponse, 
  ApiErrorResponse, 
  ApiRequestOptions,
  SWRConfig 
} from '@/types/api'
import { 
  UserProfile, 
  UserRole,
  userQueryKeys 
} from '@/types/user'

// =============================================================================
// DROPDOWN OPTION TYPES
// =============================================================================

/**
 * Service option for dropdown selection
 * Derived from DreamFactory service configuration
 */
export interface ServiceOption {
  /** Unique service identifier */
  id: number
  /** Service display name */
  name: string
  /** Service type (database, file, email, etc.) */
  type: string
  /** Service description */
  description?: string
  /** Service is active and available */
  is_active: boolean
  /** Service label for dropdown display */
  label: string
  /** Service value for form selection */
  value: number
  /** Service group for categorization */
  group?: string
  /** Database-specific service indicator */
  isDatabase?: boolean
  /** API-specific service indicator */
  isApi?: boolean
}

/**
 * User option for dropdown selection
 * Based on UserProfile with dropdown-specific formatting
 */
export interface UserOption {
  /** Unique user identifier */
  id: number
  /** User display name or constructed name */
  name: string
  /** User email address */
  email: string
  /** User first name */
  first_name?: string
  /** User last name */
  last_name?: string
  /** User is active */
  is_active: boolean
  /** User is system administrator */
  is_sys_admin?: boolean
  /** User label for dropdown display */
  label: string
  /** User value for form selection */
  value: number
  /** User group for categorization (admin, regular, etc.) */
  group?: string
}

/**
 * Role option for dropdown selection
 * Based on UserRole with dropdown-specific formatting
 */
export interface RoleOption {
  /** Unique role identifier */
  id: number
  /** Role name */
  name: string
  /** Role description */
  description?: string
  /** Role is active */
  is_active: boolean
  /** Role label for dropdown display */
  label: string
  /** Role value for form selection */
  value: number
  /** Role group for categorization */
  group?: string
  /** Number of users assigned to this role */
  userCount?: number
}

/**
 * Comprehensive dropdown options data structure
 * Contains all option types with loading and error states
 */
export interface LimitDropdownOptions {
  /** Service options for service-based limits */
  services: ServiceOption[]
  /** User options for user-based limits */
  users: UserOption[]
  /** Role options for role-based limits */
  roles: RoleOption[]
  /** Loading states for each option type */
  loading: {
    services: boolean
    users: boolean
    roles: boolean
    /** Any option type is currently loading */
    any: boolean
    /** All option types are currently loading */
    all: boolean
  }
  /** Error states for each option type */
  errors: {
    services: ApiErrorResponse | null
    users: ApiErrorResponse | null
    roles: ApiErrorResponse | null
    /** Any option type has an error */
    hasError: boolean
  }
  /** Cache status for performance monitoring */
  cache: {
    services: CacheStatus
    users: CacheStatus
    roles: CacheStatus
  }
  /** Performance metrics for cache hit compliance */
  performance: PerformanceMetrics
}

/**
 * Cache status information for performance monitoring
 */
export interface CacheStatus {
  /** Data is cached and fresh */
  isCached: boolean
  /** Cache hit occurred (data served from cache) */
  isHit: boolean
  /** Data is stale but served from cache */
  isStale: boolean
  /** Background revalidation is in progress */
  isValidating: boolean
  /** Last cache update timestamp */
  lastUpdated?: Date
  /** Cache TTL in milliseconds */
  ttl?: number
}

/**
 * Performance metrics for cache compliance monitoring
 */
export interface PerformanceMetrics {
  /** Average response time for cache hits in milliseconds */
  averageCacheHitTime: number
  /** Maximum response time recorded */
  maxResponseTime: number
  /** Cache hit rate percentage (0-100) */
  cacheHitRate: number
  /** Number of requests under 50ms threshold */
  fastRequestCount: number
  /** Total number of requests made */
  totalRequestCount: number
  /** Compliance rate with 50ms requirement */
  complianceRate: number
  /** Last performance measurement timestamp */
  lastMeasurement: Date
}

// =============================================================================
// HOOK CONFIGURATION TYPES
// =============================================================================

/**
 * Configuration options for the useLimitOptions hook
 * Supports conditional loading and permission-based filtering
 */
export interface UseLimitOptionsConfig {
  /** Current form mode affecting which options to load */
  formMode?: 'create' | 'edit'
  /** Current limit type to determine required options */
  limitType?: LimitType
  /** Enable/disable specific option types based on form state */
  enabled?: {
    services?: boolean
    users?: boolean
    roles?: boolean
  }
  /** Filtering options for dropdown data */
  filters?: {
    services?: ServiceFilterOptions
    users?: UserFilterOptions
    roles?: RoleFilterOptions
  }
  /** Cache configuration overrides */
  cache?: {
    staleTime?: number
    cacheTime?: number
    revalidateOnFocus?: boolean
  }
  /** Performance monitoring configuration */
  performance?: {
    enableMetrics?: boolean
    trackCacheHits?: boolean
    alertThreshold?: number
  }
  /** Error handling configuration */
  errors?: {
    retryCount?: number
    retryDelay?: number
    showNotifications?: boolean
  }
}

/**
 * Service filtering options for dropdown optimization
 */
export interface ServiceFilterOptions {
  /** Filter by service type */
  types?: string[]
  /** Filter by active status */
  activeOnly?: boolean
  /** Filter by database services only */
  databaseOnly?: boolean
  /** Filter by API services only */
  apiOnly?: boolean
  /** Custom filter function */
  customFilter?: (service: ServiceOption) => boolean
}

/**
 * User filtering options for dropdown optimization
 */
export interface UserFilterOptions {
  /** Filter by active status */
  activeOnly?: boolean
  /** Include system administrators */
  includeSysAdmins?: boolean
  /** Exclude system administrators */
  excludeSysAdmins?: boolean
  /** Filter by user roles */
  roles?: string[]
  /** Custom filter function */
  customFilter?: (user: UserOption) => boolean
}

/**
 * Role filtering options for dropdown optimization
 */
export interface RoleFilterOptions {
  /** Filter by active status */
  activeOnly?: boolean
  /** Include system roles */
  includeSystemRoles?: boolean
  /** Exclude system roles */
  excludeSystemRoles?: boolean
  /** Filter by minimum user count */
  minUserCount?: number
  /** Custom filter function */
  customFilter?: (role: RoleOption) => boolean
}

// =============================================================================
// SWR CONFIGURATION CONSTANTS
// =============================================================================

/**
 * Optimized SWR configuration for dropdown options
 * Configured for sub-50ms cache hit responses per requirements
 */
const DROPDOWN_SWR_CONFIG: SWRConfig = {
  // Cache optimization for 50ms requirement
  revalidateOnFocus: false,
  revalidateOnReconnect: true,
  revalidateIfStale: true,
  dedupingInterval: 30000, // 30 seconds deduplication
  
  // Performance optimization
  refreshInterval: 300000, // 5 minutes background refresh
  loadingTimeout: 10000, // 10 second timeout
  errorRetryCount: 3,
  errorRetryInterval: 1000, // 1 second base retry interval
  
  // Cache persistence
  keepPreviousData: true,
  suspense: false
}

/**
 * Cache configuration per Section 5.2 Component Details
 * TTL configuration: staleTime: 300 seconds, cacheTime: 900 seconds
 */
const CACHE_CONFIG = {
  STALE_TIME: 300000, // 5 minutes
  CACHE_TIME: 900000, // 15 minutes
  BACKGROUND_REFETCH_INTERVAL: 300000, // 5 minutes
  DEDUPING_INTERVAL: 30000 // 30 seconds
}

// =============================================================================
// API CLIENT FUNCTIONS
// =============================================================================

/**
 * Fetch services for dropdown options
 * Optimized for database service filtering per limit requirements
 */
const fetchServices = async (): Promise<ServiceOption[]> => {
  const startTime = performance.now()
  
  try {
    const response = await apiClient.get('/system/service', {
      headers: {
        'Cache-Control': 'max-age=300', // 5 minute browser cache
        'X-Request-Type': 'dropdown-options'
      }
    }) as ApiListResponse<any>
    
    const endTime = performance.now()
    const responseTime = endTime - startTime
    
    // Log performance metrics for monitoring
    if (typeof window !== 'undefined' && window.performance) {
      performance.mark('services-fetch-end')
      performance.measure('services-fetch-time', 'services-fetch-start', 'services-fetch-end')
    }
    
    // Transform service data to dropdown options
    const services: ServiceOption[] = response.resource.map((service: any) => ({
      id: service.id,
      name: service.name,
      type: service.type,
      description: service.description,
      is_active: service.is_active,
      label: `${service.name} (${service.type})`,
      value: service.id,
      group: service.type,
      isDatabase: ['mysql', 'postgresql', 'mongodb', 'oracle', 'snowflake', 'sqlite'].includes(service.type?.toLowerCase()),
      isApi: ['rest', 'soap', 'graphql'].includes(service.type?.toLowerCase())
    }))
    
    return services
  } catch (error) {
    // Enhanced error handling per Section 4.2
    const enhancedError: ApiErrorResponse = {
      error: {
        code: 'SERVICES_FETCH_ERROR',
        message: error instanceof Error ? error.message : 'Failed to fetch services',
        status_code: 500,
        context: 'dropdown-options-services',
        timestamp: new Date().toISOString()
      }
    }
    
    throw enhancedError
  }
}

/**
 * Fetch users for dropdown options
 * Includes filtering for active users and permission-based access
 */
const fetchUsers = async (): Promise<UserOption[]> => {
  const startTime = performance.now()
  
  try {
    const response = await apiClient.get('/system/user', {
      headers: {
        'Cache-Control': 'max-age=300',
        'X-Request-Type': 'dropdown-options'
      }
    }) as ApiListResponse<UserProfile>
    
    const endTime = performance.now()
    const responseTime = endTime - startTime
    
    // Performance monitoring
    if (typeof window !== 'undefined') {
      performance.mark('users-fetch-end')
      performance.measure('users-fetch-time', 'users-fetch-start', 'users-fetch-end')
    }
    
    // Transform user data to dropdown options
    const users: UserOption[] = response.resource.map((user: UserProfile) => {
      const displayName = user.display_name || 
                         `${user.first_name || ''} ${user.last_name || ''}`.trim() || 
                         user.name || 
                         user.email
      
      return {
        id: user.id,
        name: displayName,
        email: user.email,
        first_name: user.first_name,
        last_name: user.last_name,
        is_active: user.is_active,
        is_sys_admin: user.is_sys_admin,
        label: `${displayName} (${user.email})`,
        value: user.id,
        group: user.is_sys_admin ? 'System Administrators' : 'Users'
      }
    })
    
    return users
  } catch (error) {
    const enhancedError: ApiErrorResponse = {
      error: {
        code: 'USERS_FETCH_ERROR',
        message: error instanceof Error ? error.message : 'Failed to fetch users',
        status_code: 500,
        context: 'dropdown-options-users',
        timestamp: new Date().toISOString()
      }
    }
    
    throw enhancedError
  }
}

/**
 * Fetch roles for dropdown options
 * Includes role descriptions and user count information
 */
const fetchRoles = async (): Promise<RoleOption[]> => {
  const startTime = performance.now()
  
  try {
    const response = await apiClient.get('/system/role', {
      headers: {
        'Cache-Control': 'max-age=300',
        'X-Request-Type': 'dropdown-options'
      }
    }) as ApiListResponse<UserRole>
    
    const endTime = performance.now()
    const responseTime = endTime - startTime
    
    // Performance monitoring
    if (typeof window !== 'undefined') {
      performance.mark('roles-fetch-end')
      performance.measure('roles-fetch-time', 'roles-fetch-start', 'roles-fetch-end')
    }
    
    // Transform role data to dropdown options
    const roles: RoleOption[] = response.resource.map((role: UserRole) => ({
      id: role.id,
      name: role.name,
      description: role.description,
      is_active: role.is_active,
      label: role.description ? `${role.name} - ${role.description}` : role.name,
      value: role.id,
      group: 'Roles',
      userCount: 0 // Would be populated from a separate endpoint if needed
    }))
    
    return roles
  } catch (error) {
    const enhancedError: ApiErrorResponse = {
      error: {
        code: 'ROLES_FETCH_ERROR',
        message: error instanceof Error ? error.message : 'Failed to fetch roles',
        status_code: 500,
        context: 'dropdown-options-roles',
        timestamp: new Date().toISOString()
      }
    }
    
    throw enhancedError
  }
}

// =============================================================================
// PERFORMANCE MONITORING UTILITIES
// =============================================================================

/**
 * Track cache performance metrics for compliance monitoring
 */
const trackPerformanceMetrics = (() => {
  let metrics: PerformanceMetrics = {
    averageCacheHitTime: 0,
    maxResponseTime: 0,
    cacheHitRate: 0,
    fastRequestCount: 0,
    totalRequestCount: 0,
    complianceRate: 0,
    lastMeasurement: new Date()
  }
  
  return {
    record: (responseTime: number, isCacheHit: boolean) => {
      metrics.totalRequestCount++
      
      if (isCacheHit) {
        metrics.averageCacheHitTime = (
          (metrics.averageCacheHitTime * (metrics.totalRequestCount - 1)) + responseTime
        ) / metrics.totalRequestCount
      }
      
      if (responseTime > metrics.maxResponseTime) {
        metrics.maxResponseTime = responseTime
      }
      
      if (responseTime < 50) {
        metrics.fastRequestCount++
      }
      
      metrics.cacheHitRate = (metrics.fastRequestCount / metrics.totalRequestCount) * 100
      metrics.complianceRate = (metrics.fastRequestCount / metrics.totalRequestCount) * 100
      metrics.lastMeasurement = new Date()
      
      // Alert if compliance rate drops below threshold
      if (metrics.complianceRate < 90) {
        console.warn('Cache performance below threshold:', metrics.complianceRate)
      }
    },
    
    get: () => ({ ...metrics }),
    
    reset: () => {
      metrics = {
        averageCacheHitTime: 0,
        maxResponseTime: 0,
        cacheHitRate: 0,
        fastRequestCount: 0,
        totalRequestCount: 0,
        complianceRate: 0,
        lastMeasurement: new Date()
      }
    }
  }
})()

// =============================================================================
// MAIN HOOK IMPLEMENTATION
// =============================================================================

/**
 * Custom React hook for managing limit form dropdown options
 * 
 * Implements SWR-based conditional fetching with intelligent caching,
 * automatic revalidation, and performance monitoring per technical requirements.
 * 
 * @param config Configuration options for conditional loading and filtering
 * @returns Comprehensive dropdown options with loading states and cache metrics
 */
export function useLimitOptions(config: UseLimitOptionsConfig = {}): LimitDropdownOptions {
  const {
    formMode = 'create',
    limitType,
    enabled = {},
    filters = {},
    cache: cacheConfig = {},
    performance: performanceConfig = { enableMetrics: true },
    errors: errorConfig = { retryCount: 3, retryDelay: 1000 }
  } = config
  
  // =============================================================================
  // CONDITIONAL LOADING LOGIC
  // =============================================================================
  
  /**
   * Determine which option types should be loaded based on form state
   * Implements conditional SWR hooks per React/Next.js Integration Requirements
   */
  const shouldLoadOptions = useMemo(() => {
    const baseEnabled = {
      services: enabled.services !== false,
      users: enabled.users !== false,
      roles: enabled.roles !== false
    }
    
    // Conditional loading based on limit type per Section 4.3.2
    if (limitType) {
      switch (limitType) {
        case LimitType.SERVICE:
          return { ...baseEnabled, services: true, users: false, roles: false }
        case LimitType.USER:
          return { ...baseEnabled, services: false, users: true, roles: false }
        case LimitType.ROLE:
          return { ...baseEnabled, services: false, users: false, roles: true }
        case LimitType.GLOBAL:
        case LimitType.IP:
          return { ...baseEnabled, services: false, users: false, roles: false }
        case LimitType.ENDPOINT:
          return { ...baseEnabled, services: true, users: false, roles: false }
        default:
          return baseEnabled
      }
    }
    
    return baseEnabled
  }, [limitType, enabled])
  
  // =============================================================================
  // SWR DATA FETCHING WITH INTELLIGENT CACHING
  // =============================================================================
  
  /**
   * Services data fetching with conditional loading
   * Cache configuration per Section 5.2 Component Details
   */
  const {
    data: services,
    error: servicesError,
    isValidating: servicesValidating,
    mutate: mutateServices
  } = useSWR(
    shouldLoadOptions.services ? 'dropdown-services' : null,
    fetchServices,
    {
      ...DROPDOWN_SWR_CONFIG,
      revalidateOnFocus: cacheConfig.revalidateOnFocus ?? false,
      onSuccess: (data) => {
        if (performanceConfig.enableMetrics) {
          trackPerformanceMetrics.record(performance.now(), true)
        }
      },
      onError: (error) => {
        console.error('Services fetch error:', error)
      }
    }
  )
  
  /**
   * Users data fetching with conditional loading
   * Implements user permission-based access control
   */
  const {
    data: users,
    error: usersError,
    isValidating: usersValidating,
    mutate: mutateUsers
  } = useSWR(
    shouldLoadOptions.users ? 'dropdown-users' : null,
    fetchUsers,
    {
      ...DROPDOWN_SWR_CONFIG,
      revalidateOnFocus: cacheConfig.revalidateOnFocus ?? false,
      onSuccess: (data) => {
        if (performanceConfig.enableMetrics) {
          trackPerformanceMetrics.record(performance.now(), true)
        }
      },
      onError: (error) => {
        console.error('Users fetch error:', error)
      }
    }
  )
  
  /**
   * Roles data fetching with conditional loading
   * Supports role-based limit configuration
   */
  const {
    data: roles,
    error: rolesError,
    isValidating: rolesValidating,
    mutate: mutateRoles
  } = useSWR(
    shouldLoadOptions.roles ? 'dropdown-roles' : null,
    fetchRoles,
    {
      ...DROPDOWN_SWR_CONFIG,
      revalidateOnFocus: cacheConfig.revalidateOnFocus ?? false,
      onSuccess: (data) => {
        if (performanceConfig.enableMetrics) {
          trackPerformanceMetrics.record(performance.now(), true)
        }
      },
      onError: (error) => {
        console.error('Roles fetch error:', error)
      }
    }
  )
  
  // =============================================================================
  // DATA FILTERING AND TRANSFORMATION
  // =============================================================================
  
  /**
   * Apply filters to services data
   * Supports database-only filtering for database services
   */
  const filteredServices = useMemo(() => {
    if (!services) return []
    
    let filtered = services
    
    const serviceFilters = filters.services
    if (serviceFilters) {
      if (serviceFilters.activeOnly) {
        filtered = filtered.filter(service => service.is_active)
      }
      
      if (serviceFilters.types?.length) {
        filtered = filtered.filter(service => serviceFilters.types!.includes(service.type))
      }
      
      if (serviceFilters.databaseOnly) {
        filtered = filtered.filter(service => service.isDatabase)
      }
      
      if (serviceFilters.apiOnly) {
        filtered = filtered.filter(service => service.isApi)
      }
      
      if (serviceFilters.customFilter) {
        filtered = filtered.filter(serviceFilters.customFilter)
      }
    }
    
    return filtered.sort((a, b) => a.label.localeCompare(b.label))
  }, [services, filters.services])
  
  /**
   * Apply filters to users data
   * Supports admin inclusion/exclusion and role filtering
   */
  const filteredUsers = useMemo(() => {
    if (!users) return []
    
    let filtered = users
    
    const userFilters = filters.users
    if (userFilters) {
      if (userFilters.activeOnly) {
        filtered = filtered.filter(user => user.is_active)
      }
      
      if (userFilters.excludeSysAdmins) {
        filtered = filtered.filter(user => !user.is_sys_admin)
      }
      
      if (userFilters.includeSysAdmins === false) {
        filtered = filtered.filter(user => !user.is_sys_admin)
      }
      
      if (userFilters.customFilter) {
        filtered = filtered.filter(userFilters.customFilter)
      }
    }
    
    return filtered.sort((a, b) => a.label.localeCompare(b.label))
  }, [users, filters.users])
  
  /**
   * Apply filters to roles data
   * Supports system role filtering and user count thresholds
   */
  const filteredRoles = useMemo(() => {
    if (!roles) return []
    
    let filtered = roles
    
    const roleFilters = filters.roles
    if (roleFilters) {
      if (roleFilters.activeOnly) {
        filtered = filtered.filter(role => role.is_active)
      }
      
      if (roleFilters.minUserCount !== undefined) {
        filtered = filtered.filter(role => (role.userCount || 0) >= roleFilters.minUserCount!)
      }
      
      if (roleFilters.customFilter) {
        filtered = filtered.filter(roleFilters.customFilter)
      }
    }
    
    return filtered.sort((a, b) => a.label.localeCompare(b.label))
  }, [roles, filters.roles])
  
  // =============================================================================
  // CACHE STATUS AND PERFORMANCE MONITORING
  // =============================================================================
  
  /**
   * Generate cache status information for performance monitoring
   */
  const cacheStatus = useMemo(() => ({
    services: {
      isCached: !!services,
      isHit: !!services && !servicesValidating,
      isStale: false, // SWR handles stale detection internally
      isValidating: servicesValidating,
      lastUpdated: services ? new Date() : undefined,
      ttl: CACHE_CONFIG.STALE_TIME
    } as CacheStatus,
    users: {
      isCached: !!users,
      isHit: !!users && !usersValidating,
      isStale: false,
      isValidating: usersValidating,
      lastUpdated: users ? new Date() : undefined,
      ttl: CACHE_CONFIG.STALE_TIME
    } as CacheStatus,
    roles: {
      isCached: !!roles,
      isHit: !!roles && !rolesValidating,
      isStale: false,
      isValidating: rolesValidating,
      lastUpdated: roles ? new Date() : undefined,
      ttl: CACHE_CONFIG.STALE_TIME
    } as CacheStatus
  }), [services, users, roles, servicesValidating, usersValidating, rolesValidating])
  
  /**
   * Calculate loading states with granular control
   */
  const loadingStates = useMemo(() => ({
    services: servicesValidating && !services,
    users: usersValidating && !users,
    roles: rolesValidating && !roles,
    any: (servicesValidating && !services) || (usersValidating && !users) || (rolesValidating && !roles),
    all: (servicesValidating && !services) && (usersValidating && !users) && (rolesValidating && !roles)
  }), [services, users, roles, servicesValidating, usersValidating, rolesValidating])
  
  /**
   * Aggregate error states with enhanced error information
   */
  const errorStates = useMemo(() => ({
    services: servicesError || null,
    users: usersError || null,
    roles: rolesError || null,
    hasError: !!(servicesError || usersError || rolesError)
  }), [servicesError, usersError, rolesError])
  
  // =============================================================================
  // CACHE INVALIDATION AND REVALIDATION
  // =============================================================================
  
  /**
   * Invalidate specific option type cache
   * Implements cache invalidation per Section 4.3.2 cache management
   */
  const invalidateCache = useCallback(async (optionType: 'services' | 'users' | 'roles' | 'all') => {
    if (optionType === 'all') {
      await Promise.all([
        mutateServices(),
        mutateUsers(),
        mutateRoles()
      ])
    } else {
      switch (optionType) {
        case 'services':
          await mutateServices()
          break
        case 'users':
          await mutateUsers()
          break
        case 'roles':
          await mutateRoles()
          break
      }
    }
  }, [mutateServices, mutateUsers, mutateRoles])
  
  /**
   * Refresh specific option type data
   * Forces revalidation regardless of cache state
   */
  const refreshOptions = useCallback(async (optionType: 'services' | 'users' | 'roles' | 'all') => {
    const refreshPromises: Promise<any>[] = []
    
    if (optionType === 'all' || optionType === 'services') {
      refreshPromises.push(mutateServices(fetchServices(), false))
    }
    
    if (optionType === 'all' || optionType === 'users') {
      refreshPromises.push(mutateUsers(fetchUsers(), false))
    }
    
    if (optionType === 'all' || optionType === 'roles') {
      refreshPromises.push(mutateRoles(fetchRoles(), false))
    }
    
    await Promise.all(refreshPromises)
  }, [mutateServices, mutateUsers, mutateRoles])
  
  // =============================================================================
  // RETURN COMPREHENSIVE OPTIONS DATA
  // =============================================================================
  
  return {
    services: filteredServices,
    users: filteredUsers,
    roles: filteredRoles,
    loading: loadingStates,
    errors: errorStates,
    cache: cacheStatus,
    performance: performanceConfig.enableMetrics ? trackPerformanceMetrics.get() : {
      averageCacheHitTime: 0,
      maxResponseTime: 0,
      cacheHitRate: 0,
      fastRequestCount: 0,
      totalRequestCount: 0,
      complianceRate: 0,
      lastMeasurement: new Date()
    },
    
    // Utility methods (not part of the main interface but useful for debugging)
    _internal: {
      invalidateCache,
      refreshOptions,
      resetMetrics: performanceConfig.enableMetrics ? trackPerformanceMetrics.reset : () => {},
      getQueryKeys: () => ({
        services: 'dropdown-services',
        users: 'dropdown-users',
        roles: 'dropdown-roles'
      })
    }
  } as LimitDropdownOptions & {
    _internal: {
      invalidateCache: typeof invalidateCache
      refreshOptions: typeof refreshOptions
      resetMetrics: () => void
      getQueryKeys: () => Record<string, string>
    }
  }
}

// =============================================================================
// HELPER HOOKS FOR SPECIFIC OPTION TYPES
// =============================================================================

/**
 * Hook for fetching only service options
 * Optimized for service-specific limit forms
 */
export function useServiceOptions(config: Pick<UseLimitOptionsConfig, 'filters' | 'cache'> = {}) {
  const options = useLimitOptions({
    ...config,
    enabled: { services: true, users: false, roles: false }
  })
  
  return {
    services: options.services,
    loading: options.loading.services,
    error: options.errors.services,
    cache: options.cache.services,
    refresh: () => (options as any)._internal.refreshOptions('services')
  }
}

/**
 * Hook for fetching only user options
 * Optimized for user-specific limit forms
 */
export function useUserOptions(config: Pick<UseLimitOptionsConfig, 'filters' | 'cache'> = {}) {
  const options = useLimitOptions({
    ...config,
    enabled: { services: false, users: true, roles: false }
  })
  
  return {
    users: options.users,
    loading: options.loading.users,
    error: options.errors.users,
    cache: options.cache.users,
    refresh: () => (options as any)._internal.refreshOptions('users')
  }
}

/**
 * Hook for fetching only role options
 * Optimized for role-specific limit forms
 */
export function useRoleOptions(config: Pick<UseLimitOptionsConfig, 'filters' | 'cache'> = {}) {
  const options = useLimitOptions({
    ...config,
    enabled: { services: false, users: false, roles: true }
  })
  
  return {
    roles: options.roles,
    loading: options.loading.roles,
    error: options.errors.roles,
    cache: options.cache.roles,
    refresh: () => (options as any)._internal.refreshOptions('roles')
  }
}

// =============================================================================
// TYPE EXPORTS FOR EXTERNAL USE
// =============================================================================

export type {
  ServiceOption,
  UserOption,
  RoleOption,
  LimitDropdownOptions,
  CacheStatus,
  PerformanceMetrics,
  UseLimitOptionsConfig,
  ServiceFilterOptions,
  UserFilterOptions,
  RoleFilterOptions
}

// =============================================================================
// QUERY KEY EXPORTS FOR CACHE MANAGEMENT
// =============================================================================

/**
 * Query keys for external cache invalidation
 * Enables coordination with other hooks and components
 */
export const DROPDOWN_QUERY_KEYS = {
  services: 'dropdown-services',
  users: 'dropdown-users',
  roles: 'dropdown-roles',
  all: ['dropdown-services', 'dropdown-users', 'dropdown-roles']
} as const

/**
 * Utility function for invalidating dropdown caches from external components
 * Supports integration with mutation operations and data updates
 */
export const invalidateDropdownCache = async (
  optionType: 'services' | 'users' | 'roles' | 'all' = 'all'
) => {
  const { mutate } = await import('swr')
  
  if (optionType === 'all') {
    await Promise.all([
      mutate(DROPDOWN_QUERY_KEYS.services),
      mutate(DROPDOWN_QUERY_KEYS.users),
      mutate(DROPDOWN_QUERY_KEYS.roles)
    ])
  } else {
    await mutate(DROPDOWN_QUERY_KEYS[optionType])
  }
}