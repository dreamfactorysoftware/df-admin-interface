/**
 * Limit Options Hook for DreamFactory React/Next.js Admin Interface
 * 
 * Custom React hook implementing SWR-based data fetching for limit form dropdown options
 * including services, users, and roles with intelligent caching and conditional loading.
 * 
 * Features:
 * - SWR conditional fetching per React/Next.js Integration Requirements
 * - Cache hit responses under 50ms per performance standards
 * - Automatic revalidation for dropdown data changes
 * - Type-safe dropdown data management per Section 5.2 Component Details
 * - Comprehensive dropdown options per existing Angular resolver patterns
 * - Error handling and retry logic for dropdown data fetching failures
 * 
 * Replaces Angular ActivatedRoute.data subscriptions with modern React Query patterns,
 * implementing cascading data fetching with intelligent caching and conditional loading
 * based on form requirements and user permissions.
 * 
 * @fileoverview Limit form dropdown options hook
 * @version 1.0.0
 * @since React 19.0.0 / Next.js 15.1+
 */

import { useMemo, useCallback } from 'react';
import useSWR from 'swr';
import type { 
  ApiListResponse, 
  ApiErrorResponse,
  ApiRequestOptions 
} from '../../../types/api';
import type { UserProfile } from '../../../types/user';
import { apiGet, API_ENDPOINTS } from '../../../lib/api-client';

// ============================================================================
// Type Definitions for Dropdown Options
// ============================================================================

/**
 * Service information for dropdown display
 * Simplified representation focusing on limit management needs
 */
export interface ServiceOption {
  /** Unique service identifier */
  id: number;
  /** Service display name */
  name: string;
  /** Service type (database, rest, etc.) */
  type: string;
  /** Service label for display */
  label?: string;
  /** Service description */
  description?: string;
  /** Whether service is currently active */
  is_active: boolean;
  /** Service configuration URL */
  config?: string;
}

/**
 * User information for dropdown display
 * Optimized for limit assignment workflows
 */
export interface UserOption {
  /** Unique user identifier */
  id: number;
  /** Username for identification */
  username: string;
  /** User email address */
  email: string;
  /** User display name */
  display_name?: string;
  /** Full name combination */
  name?: string;
  /** Whether user is currently active */
  is_active: boolean;
  /** User's primary role */
  role?: string;
  /** Last login date for context */
  last_login_date?: string;
}

/**
 * Role information for dropdown display
 * Enhanced for RBAC limit management
 */
export interface RoleOption {
  /** Unique role identifier */
  id: number;
  /** Role name */
  name: string;
  /** Role description */
  description?: string;
  /** Whether role is currently active */
  is_active: boolean;
  /** Role creation date */
  created_date?: string;
  /** Number of users with this role */
  user_count?: number;
}

/**
 * Consolidated dropdown options interface
 * Provides all required data for limit form dropdowns
 */
export interface LimitDropdownOptions {
  /** Available services for service-specific limits */
  services: ServiceOption[];
  /** Available users for user-specific limits */
  users: UserOption[];
  /** Available roles for role-based limits */
  roles: RoleOption[];
}

/**
 * Loading states for each dropdown type
 * Enables granular loading UI control
 */
export interface LimitOptionsLoadingState {
  /** Services data loading state */
  services: boolean;
  /** Users data loading state */
  users: boolean;
  /** Roles data loading state */
  roles: boolean;
  /** Overall loading state (any pending) */
  isLoading: boolean;
}

/**
 * Error states for each dropdown type
 * Provides detailed error information for debugging
 */
export interface LimitOptionsErrorState {
  /** Services data error */
  services: ApiErrorResponse | null;
  /** Users data error */
  users: ApiErrorResponse | null;
  /** Roles data error */
  roles: ApiErrorResponse | null;
  /** Whether any errors exist */
  hasErrors: boolean;
}

/**
 * Hook configuration options
 * Controls conditional fetching and caching behavior
 */
export interface UseLimitOptionsConfig {
  /** Whether to fetch services data */
  fetchServices?: boolean;
  /** Whether to fetch users data */
  fetchUsers?: boolean;
  /** Whether to fetch roles data */
  fetchRoles?: boolean;
  /** Refresh interval in milliseconds (default: 5 minutes) */
  refreshInterval?: number;
  /** Whether to revalidate on focus (default: true) */
  revalidateOnFocus?: boolean;
  /** Whether to revalidate on reconnect (default: true) */
  revalidateOnReconnect?: boolean;
  /** Enable background revalidation (default: true) */
  revalidateOnMount?: boolean;
  /** Custom error retry count (default: 3) */
  errorRetryCount?: number;
  /** Custom error retry interval in milliseconds (default: 1000) */
  errorRetryInterval?: number;
  /** Dedupe interval for identical requests (default: 2000ms) */
  dedupingInterval?: number;
}

/**
 * Hook return type providing all dropdown data and utilities
 */
export interface UseLimitOptionsReturn {
  /** Dropdown options data */
  data: LimitDropdownOptions;
  /** Loading states */
  loading: LimitOptionsLoadingState;
  /** Error states */
  errors: LimitOptionsErrorState;
  /** Manual refresh function */
  refresh: () => Promise<void>;
  /** Mutate specific data type */
  mutate: {
    services: () => Promise<ServiceOption[] | undefined>;
    users: () => Promise<UserOption[] | undefined>;
    roles: () => Promise<RoleOption[] | undefined>;
    all: () => Promise<void>;
  };
  /** Validate that required data is loaded */
  isReady: boolean;
}

// ============================================================================
// SWR Fetcher Functions
// ============================================================================

/**
 * Fetcher function for services data
 * Optimized for limit management dropdown needs
 */
const fetchServices = async (): Promise<ServiceOption[]> => {
  const options: ApiRequestOptions = {
    fields: 'id,name,type,label,description,is_active,config',
    filter: 'is_active=true',
    sort: 'name',
    limit: 1000, // Services list is typically small
    includeCacheControl: true,
    snackbarError: 'Failed to load services for limit configuration'
  };

  try {
    const response = await apiGet<ApiListResponse<ServiceOption>>(
      `${API_ENDPOINTS.SYSTEM_SERVICE}`,
      options
    );

    // Transform response to ensure consistent format
    return response.resource.map(service => ({
      id: service.id,
      name: service.name,
      type: service.type,
      label: service.label || service.name,
      description: service.description,
      is_active: service.is_active,
      config: service.config,
    }));
  } catch (error) {
    console.error('Failed to fetch services for limits:', error);
    throw error;
  }
};

/**
 * Fetcher function for users data
 * Optimized for limit assignment workflows
 */
const fetchUsers = async (): Promise<UserOption[]> => {
  const options: ApiRequestOptions = {
    fields: 'id,username,email,display_name,name,is_active,last_login_date',
    filter: 'is_active=true',
    sort: 'username',
    limit: 500, // Reasonable limit for dropdown
    includeCacheControl: true,
    snackbarError: 'Failed to load users for limit configuration'
  };

  try {
    const response = await apiGet<ApiListResponse<UserProfile>>(
      `${API_ENDPOINTS.SYSTEM_USER}`,
      options
    );

    // Transform response to consistent format
    return response.resource.map(user => ({
      id: user.id,
      username: user.username,
      email: user.email,
      display_name: user.display_name,
      name: user.name || user.display_name || `${user.first_name || ''} ${user.last_name || ''}`.trim(),
      is_active: user.is_active,
      role: user.role?.name,
      last_login_date: user.last_login_date,
    }));
  } catch (error) {
    console.error('Failed to fetch users for limits:', error);
    throw error;
  }
};

/**
 * Fetcher function for roles data
 * Enhanced for RBAC limit management
 */
const fetchRoles = async (): Promise<RoleOption[]> => {
  const options: ApiRequestOptions = {
    fields: 'id,name,description,is_active,created_date',
    filter: 'is_active=true',
    sort: 'name',
    limit: 100, // Roles list is typically small
    includeCacheControl: true,
    snackbarError: 'Failed to load roles for limit configuration'
  };

  try {
    const response = await apiGet<ApiListResponse<RoleOption>>(
      `${API_ENDPOINTS.SYSTEM_ROLE}`,
      options
    );

    // Transform response to ensure consistent format
    return response.resource.map(role => ({
      id: role.id,
      name: role.name,
      description: role.description,
      is_active: role.is_active,
      created_date: role.created_date,
      user_count: 0, // TODO: Add user count if available
    }));
  } catch (error) {
    console.error('Failed to fetch roles for limits:', error);
    throw error;
  }
};

// ============================================================================
// Main Hook Implementation
// ============================================================================

/**
 * Custom hook for managing limit form dropdown options
 * 
 * Implements SWR-based conditional fetching for services, users, and roles
 * with intelligent caching, automatic revalidation, and comprehensive error handling.
 * 
 * Performance Requirements:
 * - Cache hit responses under 50ms
 * - Automatic revalidation when related data changes
 * - Conditional loading based on form requirements
 * 
 * @param config - Hook configuration options
 * @returns Comprehensive dropdown options data and utilities
 */
export function useLimitOptions(config: UseLimitOptionsConfig = {}): UseLimitOptionsReturn {
  // Extract configuration with defaults
  const {
    fetchServices = true,
    fetchUsers = true,
    fetchRoles = true,
    refreshInterval = 5 * 60 * 1000, // 5 minutes
    revalidateOnFocus = true,
    revalidateOnReconnect = true,
    revalidateOnMount = true,
    errorRetryCount = 3,
    errorRetryInterval = 1000,
    dedupingInterval = 2000, // 2 seconds
  } = config;

  // SWR configuration for optimal performance
  const swrConfig = useMemo(() => ({
    refreshInterval,
    revalidateOnFocus,
    revalidateOnReconnect,
    revalidateOnMount,
    errorRetryCount,
    errorRetryInterval,
    dedupingInterval,
    // Enhanced caching for sub-50ms cache hits
    focusThrottleInterval: 5000, // 5 seconds
    shouldRetryOnError: (error: any) => {
      // Don't retry on 4xx errors (client errors)
      if (error?.status >= 400 && error?.status < 500) {
        return false;
      }
      return true;
    },
  }), [
    refreshInterval,
    revalidateOnFocus,
    revalidateOnReconnect,
    revalidateOnMount,
    errorRetryCount,
    errorRetryInterval,
    dedupingInterval,
  ]);

  // Services data fetching with conditional loading
  const {
    data: servicesData,
    error: servicesError,
    isLoading: servicesLoading,
    mutate: mutateServices,
  } = useSWR<ServiceOption[], ApiErrorResponse>(
    fetchServices ? 'limit-options-services' : null,
    fetchServices ? fetchServices : null,
    swrConfig
  );

  // Users data fetching with conditional loading
  const {
    data: usersData,
    error: usersError,
    isLoading: usersLoading,
    mutate: mutateUsers,
  } = useSWR<UserOption[], ApiErrorResponse>(
    fetchUsers ? 'limit-options-users' : null,
    fetchUsers ? fetchUsers : null,
    swrConfig
  );

  // Roles data fetching with conditional loading
  const {
    data: rolesData,
    error: rolesError,
    isLoading: rolesLoading,
    mutate: mutateRoles,
  } = useSWR<RoleOption[], ApiErrorResponse>(
    fetchRoles ? 'limit-options-roles' : null,
    fetchRoles ? fetchRoles : null,
    swrConfig
  );

  // Consolidate dropdown options data
  const data: LimitDropdownOptions = useMemo(() => ({
    services: servicesData || [],
    users: usersData || [],
    roles: rolesData || [],
  }), [servicesData, usersData, rolesData]);

  // Consolidate loading states
  const loading: LimitOptionsLoadingState = useMemo(() => {
    const activeLoadingStates = [
      fetchServices && servicesLoading,
      fetchUsers && usersLoading,
      fetchRoles && rolesLoading,
    ].filter(Boolean);

    return {
      services: servicesLoading || false,
      users: usersLoading || false,
      roles: rolesLoading || false,
      isLoading: activeLoadingStates.length > 0,
    };
  }, [
    fetchServices, servicesLoading,
    fetchUsers, usersLoading,
    fetchRoles, rolesLoading,
  ]);

  // Consolidate error states
  const errors: LimitOptionsErrorState = useMemo(() => {
    const hasErrors = !!(servicesError || usersError || rolesError);

    return {
      services: servicesError || null,
      users: usersError || null,
      roles: rolesError || null,
      hasErrors,
    };
  }, [servicesError, usersError, rolesError]);

  // Manual refresh function for all enabled data sources
  const refresh = useCallback(async (): Promise<void> => {
    const refreshPromises: Promise<any>[] = [];

    if (fetchServices) {
      refreshPromises.push(mutateServices());
    }
    if (fetchUsers) {
      refreshPromises.push(mutateUsers());
    }
    if (fetchRoles) {
      refreshPromises.push(mutateRoles());
    }

    try {
      await Promise.all(refreshPromises);
    } catch (error) {
      console.error('Failed to refresh limit options:', error);
      throw error;
    }
  }, [fetchServices, fetchUsers, fetchRoles, mutateServices, mutateUsers, mutateRoles]);

  // Mutation utilities for individual data types
  const mutate = useMemo(() => ({
    services: mutateServices,
    users: mutateUsers,
    roles: mutateRoles,
    all: refresh,
  }), [mutateServices, mutateUsers, mutateRoles, refresh]);

  // Check if all required data is ready
  const isReady = useMemo(() => {
    const requiredData = [
      fetchServices && !!servicesData,
      fetchUsers && !!usersData,
      fetchRoles && !!rolesData,
    ];

    // Filter enabled requirements and check if all are met
    const enabledRequirements = requiredData.filter((_, index) => {
      return [fetchServices, fetchUsers, fetchRoles][index];
    });

    return enabledRequirements.length === 0 || enabledRequirements.every(Boolean);
  }, [
    fetchServices, servicesData,
    fetchUsers, usersData,
    fetchRoles, rolesData,
  ]);

  return {
    data,
    loading,
    errors,
    refresh,
    mutate,
    isReady,
  };
}

// ============================================================================
// Utility Functions for Dropdown Processing
// ============================================================================

/**
 * Transform service options for React Hook Form
 * Optimizes data structure for form integration
 */
export function transformServicesForForm(services: ServiceOption[]) {
  return services.map(service => ({
    value: service.id,
    label: service.label || service.name,
    group: service.type,
    description: service.description,
    disabled: !service.is_active,
  }));
}

/**
 * Transform user options for React Hook Form
 * Optimizes data structure for form integration
 */
export function transformUsersForForm(users: UserOption[]) {
  return users.map(user => ({
    value: user.id,
    label: user.name || user.display_name || user.username,
    sublabel: user.email,
    group: user.role,
    disabled: !user.is_active,
    lastLogin: user.last_login_date,
  }));
}

/**
 * Transform role options for React Hook Form
 * Optimizes data structure for form integration
 */
export function transformRolesForForm(roles: RoleOption[]) {
  return roles.map(role => ({
    value: role.id,
    label: role.name,
    description: role.description,
    disabled: !role.is_active,
    userCount: role.user_count,
  }));
}

/**
 * Validate dropdown options against form requirements
 * Ensures required options are available
 */
export function validateLimitOptions(
  options: LimitDropdownOptions,
  requirements: {
    requireServices?: boolean;
    requireUsers?: boolean;
    requireRoles?: boolean;
    minServices?: number;
    minUsers?: number;
    minRoles?: number;
  }
): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];

  // Check services requirements
  if (requirements.requireServices && options.services.length === 0) {
    errors.push('At least one service is required for service-based limits');
  }
  if (requirements.minServices && options.services.length < requirements.minServices) {
    errors.push(`At least ${requirements.minServices} services are required`);
  }

  // Check users requirements
  if (requirements.requireUsers && options.users.length === 0) {
    errors.push('At least one user is required for user-based limits');
  }
  if (requirements.minUsers && options.users.length < requirements.minUsers) {
    errors.push(`At least ${requirements.minUsers} users are required`);
  }

  // Check roles requirements
  if (requirements.requireRoles && options.roles.length === 0) {
    errors.push('At least one role is required for role-based limits');
  }
  if (requirements.minRoles && options.roles.length < requirements.minRoles) {
    errors.push(`At least ${requirements.minRoles} roles are required`);
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Filter dropdown options based on search query
 * Provides client-side filtering for large datasets
 */
export function filterLimitOptions(
  options: LimitDropdownOptions,
  searchQuery: string
): LimitDropdownOptions {
  if (!searchQuery.trim()) {
    return options;
  }

  const query = searchQuery.toLowerCase();

  return {
    services: options.services.filter(service =>
      service.name.toLowerCase().includes(query) ||
      service.type.toLowerCase().includes(query) ||
      service.description?.toLowerCase().includes(query)
    ),
    users: options.users.filter(user =>
      user.username.toLowerCase().includes(query) ||
      user.email.toLowerCase().includes(query) ||
      user.name?.toLowerCase().includes(query) ||
      user.display_name?.toLowerCase().includes(query)
    ),
    roles: options.roles.filter(role =>
      role.name.toLowerCase().includes(query) ||
      role.description?.toLowerCase().includes(query)
    ),
  };
}

// ============================================================================
// Default Export
// ============================================================================

export default useLimitOptions;