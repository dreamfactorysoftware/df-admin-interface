/**
 * API Keys Management Hook
 * 
 * React custom hook for managing API key retrieval and caching in the DreamFactory Admin Interface.
 * Replaces the Angular ApiKeysService with modern React patterns, providing intelligent caching
 * and state management through React Query.
 * 
 * Features:
 * - Service-specific API key retrieval
 * - Intelligent caching with React Query (staleTime: 300s, cacheTime: 900s)
 * - Optimistic updates and background synchronization
 * - Zod schema validation for API responses
 * - MSW integration for testing scenarios
 * 
 * @author DreamFactory Admin Interface Team
 * @version React 19/Next.js 15.1 Migration
 */

'use client';

import { useQuery, useQueryClient } from '@tanstack/react-query';
import { z } from 'zod';
import { apiClient } from '@/lib/api-client';

// Zod validation schemas for API responses
const roleServiceAccessSchema = z.object({
  serviceId: z.number(),
  roleId: z.number(),
  component: z.string(),
  verbMask: z.number(),
  requestorMask: z.number(),
  filters: z.array(z.any()),
  filterOp: z.string(),
  id: z.number(),
});

const roleSchema = z.object({
  id: z.number(),
  name: z.string(),
  description: z.string(),
  isActive: z.boolean(),
  roleServiceAccessByRoleId: z.array(roleServiceAccessSchema),
  createdDate: z.string(),
  lastModifiedDate: z.string(),
  createdById: z.number(),
  lastModifiedById: z.number(),
});

const rolesResponseSchema = z.object({
  resource: z.array(roleSchema),
});

const appSchema = z.object({
  name: z.string(),
  apiKey: z.string(),
  roleId: z.number(),
  id: z.number(),
  description: z.string().optional(),
  isActive: z.boolean().optional(),
});

const appsResponseSchema = z.object({
  resource: z.array(appSchema),
});

const apiKeyInfoSchema = z.object({
  name: z.string(),
  apiKey: z.string(),
});

// TypeScript types inferred from Zod schemas
export type ApiKeyInfo = z.infer<typeof apiKeyInfoSchema>;
export type RoleServiceAccess = z.infer<typeof roleServiceAccessSchema>;
export type Role = z.infer<typeof roleSchema>;
export type RolesResponse = z.infer<typeof rolesResponseSchema>;
export type App = z.infer<typeof appSchema>;
export type AppsResponse = z.infer<typeof appsResponseSchema>;

// API endpoint URLs configuration
const API_ENDPOINTS = {
  ROLES: '/system/role',
  APPS: '/system/app',
} as const;

/**
 * Fetches API keys for a specific service from DreamFactory backend
 * 
 * @param serviceId - The ID of the service to fetch API keys for
 * @returns Promise<ApiKeyInfo[]> - Array of API key information
 */
async function fetchApiKeysForService(serviceId: number): Promise<ApiKeyInfo[]> {
  if (serviceId === -1) {
    return [];
  }

  try {
    // Step 1: Fetch roles with service access relationships
    const rolesResponse = await apiClient.get(
      `${API_ENDPOINTS.ROLES}?related=role_service_access_by_role_id`
    );
    
    const validatedRoles = rolesResponseSchema.parse(rolesResponse);

    // Step 2: Filter roles that have access to the specified service
    const relevantRoles = validatedRoles.resource.filter(role => {
      if (!role.roleServiceAccessByRoleId) {
        return false;
      }

      return role.roleServiceAccessByRoleId.some(
        access => access.serviceId === serviceId
      );
    });

    if (!relevantRoles.length) {
      return [];
    }

    // Step 3: Fetch apps for each relevant role in parallel
    const appPromises = relevantRoles.map(async role => {
      const appsResponse = await apiClient.get(
        `${API_ENDPOINTS.APPS}?filter=role_id=${role.id}&fields=*`
      );
      return appsResponseSchema.parse(appsResponse);
    });

    const appsResponses = await Promise.all(appPromises);

    // Step 4: Extract and validate API keys from app responses
    const keys: ApiKeyInfo[] = appsResponses
      .flatMap(response => response.resource)
      .filter((app): app is App => !!app && !!app.apiKey)
      .map(app => {
        const keyInfo = {
          name: app.name,
          apiKey: app.apiKey,
        };
        return apiKeyInfoSchema.parse(keyInfo);
      });

    return keys;
  } catch (error) {
    console.error('Failed to fetch API keys for service:', serviceId, error);
    throw new Error(`Failed to fetch API keys: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * React Query configuration for API keys caching
 */
const API_KEYS_QUERY_CONFIG = {
  staleTime: 5 * 60 * 1000, // 300 seconds (5 minutes) - data considered fresh
  cacheTime: 15 * 60 * 1000, // 900 seconds (15 minutes) - how long to keep in cache
  retry: 3,
  retryDelay: (attemptIndex: number) => Math.min(1000 * 2 ** attemptIndex, 30000),
  refetchOnWindowFocus: false,
  refetchOnReconnect: true,
} as const;

/**
 * Custom hook for managing API keys for a specific service
 * 
 * Provides intelligent caching, background synchronization, and error handling
 * for API key retrieval. Replaces Angular ApiKeysService with React Query patterns.
 * 
 * @param serviceId - The ID of the service to fetch API keys for
 * @returns Query result with API keys data, loading state, and error information
 */
export function useApiKeys(serviceId: number) {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ['apiKeys', serviceId],
    queryFn: () => fetchApiKeysForService(serviceId),
    enabled: serviceId !== -1, // Don't run query for invalid service ID
    ...API_KEYS_QUERY_CONFIG,
  });

  /**
   * Manually refetch API keys for the current service
   */
  const refetch = () => {
    return query.refetch();
  };

  /**
   * Clear cached API keys for a specific service
   */
  const clearServiceCache = (targetServiceId?: number) => {
    const keyToClear = targetServiceId ?? serviceId;
    queryClient.removeQueries({ queryKey: ['apiKeys', keyToClear] });
  };

  /**
   * Clear all cached API keys
   */
  const clearAllCache = () => {
    queryClient.removeQueries({ queryKey: ['apiKeys'] });
  };

  /**
   * Invalidate cached API keys to trigger background refetch
   */
  const invalidateCache = (targetServiceId?: number) => {
    const keyToInvalidate = targetServiceId ?? serviceId;
    queryClient.invalidateQueries({ queryKey: ['apiKeys', keyToInvalidate] });
  };

  /**
   * Prefetch API keys for a service (useful for preloading)
   */
  const prefetchApiKeys = (targetServiceId: number) => {
    return queryClient.prefetchQuery({
      queryKey: ['apiKeys', targetServiceId],
      queryFn: () => fetchApiKeysForService(targetServiceId),
      ...API_KEYS_QUERY_CONFIG,
    });
  };

  return {
    // Data and state
    data: query.data ?? [],
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
    isStale: query.isStale,
    isFetching: query.isFetching,
    
    // Actions
    refetch,
    clearServiceCache,
    clearAllCache,
    invalidateCache,
    prefetchApiKeys,
    
    // Computed values
    hasApiKeys: (query.data?.length ?? 0) > 0,
    isValidService: serviceId !== -1,
  };
}

/**
 * Hook for accessing React Query client directly for advanced cache operations
 * 
 * @returns QueryClient instance for manual cache management
 */
export function useApiKeysQueryClient() {
  return useQueryClient();
}

/**
 * Utility function to get cached API keys without triggering a fetch
 * 
 * @param queryClient - React Query client instance
 * @param serviceId - Service ID to get cached keys for
 * @returns Cached API keys or undefined if not in cache
 */
export function getCachedApiKeys(
  queryClient: ReturnType<typeof useQueryClient>,
  serviceId: number
): ApiKeyInfo[] | undefined {
  return queryClient.getQueryData(['apiKeys', serviceId]);
}

/**
 * Utility function to set API keys in cache (useful for optimistic updates)
 * 
 * @param queryClient - React Query client instance
 * @param serviceId - Service ID to cache keys for
 * @param apiKeys - API keys to cache
 */
export function setCachedApiKeys(
  queryClient: ReturnType<typeof useQueryClient>,
  serviceId: number,
  apiKeys: ApiKeyInfo[]
): void {
  queryClient.setQueryData(['apiKeys', serviceId], apiKeys);
}

// Re-export for convenience
export type { ApiKeyInfo as ApiKeyInfo };
export { apiKeyInfoSchema };