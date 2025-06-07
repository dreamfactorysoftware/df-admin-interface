/**
 * Custom React hook implementing comprehensive role management operations with
 * SWR-based data fetching for role configurations, permissions, and access control rules.
 * 
 * Provides CRUD operations for roles with intelligent caching and automatic revalidation.
 * Replaces Angular role resolver patterns with React Query-powered data synchronization
 * and cache management.
 * 
 * @fileoverview Role management hook with SWR/React Query integration
 * @version 1.0.0
 * @since React 19.0.0 / Next.js 15.1+
 */

import { useMemo, useCallback } from 'react';
import useSWR, { mutate } from 'swr';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import type {
  RoleType,
  RoleWithRelations,
  CreateRoleData,
  UpdateRoleData,
  DeleteRoleData,
  RoleQueryParams,
  RoleListItem,
  RolePermissionSummary,
} from '../../../types/role';
import type {
  ApiListResponse,
  ApiResourceResponse,
  ApiErrorResponse,
  ApiRequestOptions,
} from '../../../types/api';
import {
  apiGet,
  apiPost,
  apiPut,
  apiDelete,
  API_ENDPOINTS,
  buildQueryParams,
} from '../../../lib/api-client';

// ============================================================================
// Constants and Configuration
// ============================================================================

/**
 * Cache configuration for role management operations
 * Optimized for 50ms cache hit responses per React/Next.js Integration Requirements
 */
const CACHE_CONFIG = {
  /** Cache time for role list data */
  ROLE_LIST_STALE_TIME: 300000, // 5 minutes
  /** Cache time for individual role data */
  ROLE_DETAIL_STALE_TIME: 600000, // 10 minutes
  /** Refresh interval for active data */
  REFRESH_INTERVAL: 900000, // 15 minutes
  /** Dedupe interval for identical requests */
  DEDUPE_INTERVAL: 2000, // 2 seconds
  /** Error retry count */
  ERROR_RETRY_COUNT: 3,
  /** Error retry interval */
  ERROR_RETRY_INTERVAL: 1000, // 1 second
} as const;

/**
 * Query keys for React Query cache management
 */
const QUERY_KEYS = {
  ROLES: 'roles',
  ROLE_DETAIL: 'role-detail',
  ROLE_PERMISSIONS: 'role-permissions',
  ROLE_SERVICE_ACCESS: 'role-service-access',
  ROLE_LOOKUPS: 'role-lookups',
} as const;

/**
 * Default related data for role fetching
 * Matches Angular resolver functionality
 */
const DEFAULT_RELATED = 'role_service_access_by_role_id,lookup_by_role_id';

// ============================================================================
// Hook Return Types
// ============================================================================

/**
 * Role list hook return type
 */
interface UseRoleListReturn {
  /** Role list data */
  roles: RoleType[] | undefined;
  /** Loading state */
  isLoading: boolean;
  /** Error state */
  error: ApiErrorResponse | null;
  /** Data validation state */
  isValidating: boolean;
  /** Manual refresh function */
  refresh: () => Promise<void>;
  /** Mutate function for optimistic updates */
  mutate: (data?: RoleType[]) => Promise<void>;
  /** Total count of roles */
  totalCount: number;
  /** Pagination metadata */
  pagination: {
    limit: number;
    offset: number;
    hasNext: boolean;
    hasPrevious: boolean;
  };
}

/**
 * Individual role hook return type
 */
interface UseRoleReturn {
  /** Role data with relations */
  role: RoleWithRelations | undefined;
  /** Loading state */
  isLoading: boolean;
  /** Error state */
  error: ApiErrorResponse | null;
  /** Data validation state */
  isValidating: boolean;
  /** Manual refresh function */
  refresh: () => Promise<void>;
  /** Mutate function for optimistic updates */
  mutate: (data?: RoleWithRelations) => Promise<void>;
}

/**
 * Role mutations hook return type
 */
interface UseRoleMutationsReturn {
  /** Create role mutation */
  createRole: {
    mutate: (data: CreateRoleData) => void;
    mutateAsync: (data: CreateRoleData) => Promise<RoleType>;
    isLoading: boolean;
    error: ApiErrorResponse | null;
    isSuccess: boolean;
    reset: () => void;
  };
  /** Update role mutation */
  updateRole: {
    mutate: (data: UpdateRoleData) => void;
    mutateAsync: (data: UpdateRoleData) => Promise<RoleType>;
    isLoading: boolean;
    error: ApiErrorResponse | null;
    isSuccess: boolean;
    reset: () => void;
  };
  /** Delete role mutation */
  deleteRole: {
    mutate: (data: DeleteRoleData) => void;
    mutateAsync: (data: DeleteRoleData) => Promise<void>;
    isLoading: boolean;
    error: ApiErrorResponse | null;
    isSuccess: boolean;
    reset: () => void;
  };
}

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Build SWR cache key for role list
 */
function buildRoleListKey(params?: RoleQueryParams): string {
  const queryParams = buildQueryParams(params || {});
  const keyParams = Object.entries(queryParams)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, value]) => `${key}:${value}`)
    .join('|');
  return `${QUERY_KEYS.ROLES}${keyParams ? `?${keyParams}` : ''}`;
}

/**
 * Build SWR cache key for individual role
 */
function buildRoleKey(id: number | string, params?: RoleQueryParams): string {
  const queryParams = buildQueryParams(params || {});
  const keyParams = Object.entries(queryParams)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, value]) => `${key}:${value}`)
    .join('|');
  return `${QUERY_KEYS.ROLE_DETAIL}:${id}${keyParams ? `?${keyParams}` : ''}`;
}

/**
 * Role list fetcher function for SWR
 */
async function fetchRoleList(
  cacheKey: string,
  params?: RoleQueryParams
): Promise<ApiListResponse<RoleType>> {
  const requestOptions: ApiRequestOptions = {
    related: params?.related || DEFAULT_RELATED,
    sort: params?.sort || 'name',
    limit: params?.limit || 25,
    offset: params?.offset || 0,
    includeCount: params?.includeCount !== false,
    filter: params?.filter,
    fields: params?.fields,
    additionalParams: params?.accessibleTabs 
      ? [{ key: 'accessible_tabs', value: true }] 
      : undefined,
  };

  return apiGet<ApiListResponse<RoleType>>(API_ENDPOINTS.SYSTEM_ROLE, requestOptions);
}

/**
 * Individual role fetcher function for SWR
 */
async function fetchRole(
  cacheKey: string,
  id: number | string,
  params?: RoleQueryParams
): Promise<RoleWithRelations> {
  const requestOptions: ApiRequestOptions = {
    related: params?.related || DEFAULT_RELATED,
    fields: params?.fields,
    additionalParams: params?.accessibleTabs 
      ? [{ key: 'accessible_tabs', value: true }] 
      : undefined,
  };

  const response = await apiGet<RoleWithRelations>(
    `${API_ENDPOINTS.SYSTEM_ROLE}/${id}`,
    requestOptions
  );

  return response;
}

/**
 * Invalidate related caches after mutations
 */
async function invalidateRoleCaches(): Promise<void> {
  // Invalidate all role-related SWR caches
  await mutate(
    (key) => typeof key === 'string' && key.startsWith(QUERY_KEYS.ROLES),
    undefined,
    { revalidate: true }
  );
  
  await mutate(
    (key) => typeof key === 'string' && key.startsWith(QUERY_KEYS.ROLE_DETAIL),
    undefined,
    { revalidate: true }
  );
}

// ============================================================================
// Main Hook Functions
// ============================================================================

/**
 * Hook for fetching and managing role list data
 * 
 * @param params - Query parameters for filtering and pagination
 * @returns Role list data and management functions
 */
export function useRoleList(params?: RoleQueryParams): UseRoleListReturn {
  const cacheKey = useMemo(() => buildRoleListKey(params), [params]);
  
  const {
    data,
    error,
    isLoading,
    isValidating,
    mutate: swrMutate,
  } = useSWR(
    [cacheKey, params],
    ([key, queryParams]) => fetchRoleList(key, queryParams),
    {
      refreshInterval: CACHE_CONFIG.REFRESH_INTERVAL,
      dedupingInterval: CACHE_CONFIG.DEDUPE_INTERVAL,
      errorRetryCount: CACHE_CONFIG.ERROR_RETRY_COUNT,
      errorRetryInterval: CACHE_CONFIG.ERROR_RETRY_INTERVAL,
      revalidateOnFocus: true,
      revalidateOnReconnect: true,
    }
  );

  const refresh = useCallback(async () => {
    await swrMutate();
  }, [swrMutate]);

  const mutateRoles = useCallback(async (roles?: RoleType[]) => {
    await swrMutate(
      roles ? { resource: roles, meta: data?.meta || { count: 0, offset: 0, limit: 25 } } : undefined,
      { revalidate: false }
    );
  }, [swrMutate, data?.meta]);

  return {
    roles: data?.resource,
    isLoading,
    error: error as ApiErrorResponse | null,
    isValidating,
    refresh,
    mutate: mutateRoles,
    totalCount: data?.meta?.count || 0,
    pagination: {
      limit: params?.limit || 25,
      offset: params?.offset || 0,
      hasNext: data?.meta?.has_next || false,
      hasPrevious: data?.meta?.has_previous || false,
    },
  };
}

/**
 * Hook for fetching and managing individual role data
 * 
 * @param id - Role ID to fetch
 * @param params - Query parameters for related data inclusion
 * @returns Role data and management functions
 */
export function useRole(
  id: number | string | null,
  params?: RoleQueryParams
): UseRoleReturn {
  const cacheKey = useMemo(
    () => id ? buildRoleKey(id, params) : null,
    [id, params]
  );
  
  const {
    data,
    error,
    isLoading,
    isValidating,
    mutate: swrMutate,
  } = useSWR(
    id ? [cacheKey, id, params] : null,
    ([key, roleId, queryParams]) => fetchRole(key, roleId, queryParams),
    {
      refreshInterval: CACHE_CONFIG.REFRESH_INTERVAL,
      dedupingInterval: CACHE_CONFIG.DEDUPE_INTERVAL,
      errorRetryCount: CACHE_CONFIG.ERROR_RETRY_COUNT,
      errorRetryInterval: CACHE_CONFIG.ERROR_RETRY_INTERVAL,
      revalidateOnFocus: true,
      revalidateOnReconnect: true,
    }
  );

  const refresh = useCallback(async () => {
    await swrMutate();
  }, [swrMutate]);

  const mutateRole = useCallback(async (role?: RoleWithRelations) => {
    await swrMutate(role, { revalidate: false });
  }, [swrMutate]);

  return {
    role: data,
    isLoading,
    error: error as ApiErrorResponse | null,
    isValidating,
    refresh,
    mutate: mutateRole,
  };
}

/**
 * Hook for role CRUD mutations with optimistic updates
 * 
 * @returns Mutation functions for create, update, and delete operations
 */
export function useRoleMutations(): UseRoleMutationsReturn {
  const queryClient = useQueryClient();

  // Create role mutation
  const createRoleMutation = useMutation({
    mutationFn: async (data: CreateRoleData): Promise<RoleType> => {
      const response = await apiPost<ApiResourceResponse<RoleType>>(
        API_ENDPOINTS.SYSTEM_ROLE,
        data,
        {
          snackbarSuccess: 'Role created successfully',
          snackbarError: 'Failed to create role',
        }
      );
      return response.resource;
    },
    onMutate: async (newRole: CreateRoleData) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: [QUERY_KEYS.ROLES] });

      // Snapshot the previous value
      const previousRoles = queryClient.getQueryData([QUERY_KEYS.ROLES]);

      // Optimistically update the cache
      queryClient.setQueryData([QUERY_KEYS.ROLES], (old: any) => {
        if (!old?.resource) return old;
        
        const optimisticRole: RoleType = {
          id: Date.now(), // Temporary ID
          name: newRole.name,
          description: newRole.description || '',
          isActive: newRole.isActive,
          createdById: 0,
          createdDate: new Date().toISOString(),
          lastModifiedById: 0,
          lastModifiedDate: new Date().toISOString(),
          lookupByRoleId: [],
        };

        return {
          ...old,
          resource: [...old.resource, optimisticRole],
          meta: {
            ...old.meta,
            count: old.meta.count + 1,
          },
        };
      });

      return { previousRoles };
    },
    onError: (err, newRole, context) => {
      // Rollback on error
      if (context?.previousRoles) {
        queryClient.setQueryData([QUERY_KEYS.ROLES], context.previousRoles);
      }
    },
    onSettled: async () => {
      // Invalidate and refetch
      await invalidateRoleCaches();
    },
  });

  // Update role mutation
  const updateRoleMutation = useMutation({
    mutationFn: async (data: UpdateRoleData): Promise<RoleType> => {
      const response = await apiPut<RoleType>(
        `${API_ENDPOINTS.SYSTEM_ROLE}/${data.id}`,
        data,
        {
          snackbarSuccess: 'Role updated successfully',
          snackbarError: 'Failed to update role',
        }
      );
      return response;
    },
    onMutate: async (updatedRole: UpdateRoleData) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: [QUERY_KEYS.ROLES] });
      await queryClient.cancelQueries({ queryKey: [QUERY_KEYS.ROLE_DETAIL, updatedRole.id] });

      // Snapshot the previous values
      const previousRoles = queryClient.getQueryData([QUERY_KEYS.ROLES]);
      const previousRole = queryClient.getQueryData([QUERY_KEYS.ROLE_DETAIL, updatedRole.id]);

      // Optimistically update the role list cache
      queryClient.setQueryData([QUERY_KEYS.ROLES], (old: any) => {
        if (!old?.resource) return old;
        
        return {
          ...old,
          resource: old.resource.map((role: RoleType) =>
            role.id === updatedRole.id
              ? { 
                  ...role, 
                  ...updatedRole, 
                  lastModifiedDate: new Date().toISOString(),
                }
              : role
          ),
        };
      });

      // Optimistically update the individual role cache
      queryClient.setQueryData([QUERY_KEYS.ROLE_DETAIL, updatedRole.id], (old: any) => {
        if (!old) return old;
        return {
          ...old,
          ...updatedRole,
          lastModifiedDate: new Date().toISOString(),
        };
      });

      return { previousRoles, previousRole };
    },
    onError: (err, updatedRole, context) => {
      // Rollback on error
      if (context?.previousRoles) {
        queryClient.setQueryData([QUERY_KEYS.ROLES], context.previousRoles);
      }
      if (context?.previousRole) {
        queryClient.setQueryData([QUERY_KEYS.ROLE_DETAIL, updatedRole.id], context.previousRole);
      }
    },
    onSettled: async (data, error, variables) => {
      // Invalidate and refetch
      await invalidateRoleCaches();
    },
  });

  // Delete role mutation
  const deleteRoleMutation = useMutation({
    mutationFn: async (data: DeleteRoleData): Promise<void> => {
      await apiDelete(
        `${API_ENDPOINTS.SYSTEM_ROLE}/${data.id}`,
        {
          snackbarSuccess: 'Role deleted successfully',
          snackbarError: 'Failed to delete role',
          additionalParams: data.force ? [{ key: 'force', value: true }] : undefined,
        }
      );
    },
    onMutate: async (deletedRole: DeleteRoleData) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: [QUERY_KEYS.ROLES] });

      // Snapshot the previous value
      const previousRoles = queryClient.getQueryData([QUERY_KEYS.ROLES]);

      // Optimistically remove the role from cache
      queryClient.setQueryData([QUERY_KEYS.ROLES], (old: any) => {
        if (!old?.resource) return old;
        
        return {
          ...old,
          resource: old.resource.filter((role: RoleType) => role.id !== deletedRole.id),
          meta: {
            ...old.meta,
            count: Math.max(0, old.meta.count - 1),
          },
        };
      });

      // Remove individual role cache
      queryClient.removeQueries({ queryKey: [QUERY_KEYS.ROLE_DETAIL, deletedRole.id] });

      return { previousRoles };
    },
    onError: (err, deletedRole, context) => {
      // Rollback on error
      if (context?.previousRoles) {
        queryClient.setQueryData([QUERY_KEYS.ROLES], context.previousRoles);
      }
    },
    onSettled: async () => {
      // Invalidate and refetch
      await invalidateRoleCaches();
    },
  });

  return {
    createRole: {
      mutate: createRoleMutation.mutate,
      mutateAsync: createRoleMutation.mutateAsync,
      isLoading: createRoleMutation.isPending,
      error: createRoleMutation.error as ApiErrorResponse | null,
      isSuccess: createRoleMutation.isSuccess,
      reset: createRoleMutation.reset,
    },
    updateRole: {
      mutate: updateRoleMutation.mutate,
      mutateAsync: updateRoleMutation.mutateAsync,
      isLoading: updateRoleMutation.isPending,
      error: updateRoleMutation.error as ApiErrorResponse | null,
      isSuccess: updateRoleMutation.isSuccess,
      reset: updateRoleMutation.reset,
    },
    deleteRole: {
      mutate: deleteRoleMutation.mutate,
      mutateAsync: deleteRoleMutation.mutateAsync,
      isLoading: deleteRoleMutation.isPending,
      error: deleteRoleMutation.error as ApiErrorResponse | null,
      isSuccess: deleteRoleMutation.isSuccess,
      reset: deleteRoleMutation.reset,
    },
  };
}

// ============================================================================
// Utility Hooks
// ============================================================================

/**
 * Hook for fetching role permission summary
 * Provides aggregated permission information for role analysis
 * 
 * @param roleId - Role ID to analyze
 * @returns Permission summary data
 */
export function useRolePermissions(
  roleId: number | string | null
): {
  permissions: RolePermissionSummary | undefined;
  isLoading: boolean;
  error: ApiErrorResponse | null;
  refresh: () => Promise<void>;
} {
  const { role, isLoading, error, refresh } = useRole(roleId, {
    related: 'role_service_access_by_role_id,lookup_by_role_id',
  });

  const permissions = useMemo((): RolePermissionSummary | undefined => {
    if (!role || !roleId) return undefined;

    const serviceAccess = role.roleServiceAccessByRoleId || [];
    const serviceNames = [...new Set(serviceAccess.map(access => access.serviceId.toString()))];

    return {
      roleId: Number(roleId),
      serviceCount: serviceNames.length,
      fullAccessServices: serviceNames.filter(serviceName => {
        const accessRules = serviceAccess.filter(access => access.serviceId.toString() === serviceName);
        return accessRules.some(rule => rule.verbMask === 127); // All verbs
      }),
      limitedAccessServices: serviceNames.filter(serviceName => {
        const accessRules = serviceAccess.filter(access => access.serviceId.toString() === serviceName);
        return accessRules.every(rule => rule.verbMask < 127); // Limited verbs
      }),
      lookupCount: role.lookupByRoleId?.length || 0,
      isAdmin: role.name.toLowerCase().includes('admin') || serviceAccess.length > 10,
    };
  }, [role, roleId]);

  return {
    permissions,
    isLoading,
    error,
    refresh,
  };
}

/**
 * Hook for conditional role fetching based on route parameters
 * Replaces Angular resolver patterns with React hook parameter management
 * 
 * @param id - Role ID (can be null for conditional fetching)
 * @param options - Additional fetching options
 * @returns Role data or undefined if ID is null
 */
export function useConditionalRole(
  id: string | number | null | undefined,
  options: {
    related?: string;
    fields?: string;
    accessibleTabs?: boolean;
  } = {}
): UseRoleReturn {
  const params: RoleQueryParams = {
    related: options.related || DEFAULT_RELATED,
    fields: options.fields,
    accessibleTabs: options.accessibleTabs,
  };

  return useRole(id || null, params);
}

// ============================================================================
// Default Export
// ============================================================================

export default {
  useRoleList,
  useRole,
  useRoleMutations,
  useRolePermissions,
  useConditionalRole,
};