'use client';

import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useCallback, useMemo } from 'react';
import { z } from 'zod';

/**
 * API Key Management Hook for DreamFactory Services
 * 
 * React custom hook that provides API key management functionality for DreamFactory services
 * using React Query for intelligent caching and state management. Replaces the Angular 
 * ApiKeysService with modern React patterns, enabling components to retrieve, cache, and 
 * manage API keys for backend services within the adf-api-docs feature.
 * 
 * Features:
 * - React Query intelligent caching with staleTime: 300s, cacheTime: 900s per Section 5.2
 * - Parallel API requests using Promise.all for roles and apps endpoints
 * - Zod schema validation for API responses per React/Next.js Integration Requirements
 * - Optimistic cache updates and invalidation strategies
 * - Error handling with exponential backoff retry logic
 * - TypeScript type safety with full interface compliance
 * 
 * Usage:
 * ```typescript
 * const { data: apiKeys, isLoading, error, refetch } = useApiKeys(serviceId);
 * const clearCache = useClearApiKeysCache();
 * ```
 */

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

/**
 * API Key information interface
 */
export interface ApiKeyInfo {
  name: string;
  apiKey: string;
}

/**
 * Service API keys container interface
 */
export interface ServiceApiKeys {
  serviceId: number;
  keys: ApiKeyInfo[];
}

/**
 * Role service access configuration
 */
interface RoleServiceAccess {
  serviceId: number;
  roleId: number;
  component: string;
  verbMask: number;
  requestorMask: number;
  filters: any[];
  filterOp: string;
  id: number;
}

/**
 * Role entity with service access relationships
 */
interface Role {
  id: number;
  name: string;
  description: string;
  isActive: boolean;
  roleServiceAccessByRoleId: RoleServiceAccess[];
  createdDate: string;
  lastModifiedDate: string;
  createdById: number;
  lastModifiedById: number;
}

/**
 * Application entity with API key
 */
interface App {
  name: string;
  apiKey: string;
  roleId: number;
  id: number;
  description?: string;
  isActive?: boolean;
}

// ============================================================================
// ZOD VALIDATION SCHEMAS
// ============================================================================

/**
 * Zod schema for RoleServiceAccess validation
 */
const RoleServiceAccessSchema = z.object({
  serviceId: z.number(),
  roleId: z.number(),
  component: z.string(),
  verbMask: z.number(),
  requestorMask: z.number(),
  filters: z.array(z.any()),
  filterOp: z.string(),
  id: z.number(),
});

/**
 * Zod schema for Role validation
 */
const RoleSchema = z.object({
  id: z.number(),
  name: z.string(),
  description: z.string(),
  isActive: z.boolean(),
  roleServiceAccessByRoleId: z.array(RoleServiceAccessSchema),
  createdDate: z.string(),
  lastModifiedDate: z.string(),
  createdById: z.number(),
  lastModifiedById: z.number(),
});

/**
 * Zod schema for Roles API response
 */
const RolesResponseSchema = z.object({
  resource: z.array(RoleSchema),
});

/**
 * Zod schema for App validation
 */
const AppSchema = z.object({
  name: z.string(),
  apiKey: z.string(),
  roleId: z.number(),
  id: z.number(),
  description: z.string().optional(),
  isActive: z.boolean().optional(),
});

/**
 * Zod schema for Apps API response
 */
const AppsResponseSchema = z.object({
  resource: z.array(AppSchema),
});

/**
 * Zod schema for ApiKeyInfo validation
 */
const ApiKeyInfoSchema = z.object({
  name: z.string(),
  apiKey: z.string(),
});

// ============================================================================
// API CONSTANTS
// ============================================================================

/**
 * DreamFactory API base URL
 */
const BASE_URL = '/api/v2';

/**
 * API endpoint URLs following DreamFactory patterns
 */
const URLS = {
  ROLES: `${BASE_URL}/system/role`,
  APP: `${BASE_URL}/system/app`,
} as const;

/**
 * React Query cache configuration per Section 5.2 component details
 */
const QUERY_CONFIG = {
  staleTime: 300 * 1000, // 300 seconds (5 minutes)
  cacheTime: 900 * 1000, // 900 seconds (15 minutes)
  refetchOnWindowFocus: false,
  retry: 3,
  retryDelay: (attemptIndex: number) => Math.min(1000 * 2 ** attemptIndex, 30000),
} as const;

// ============================================================================
// API CLIENT FUNCTIONS
// ============================================================================

/**
 * Fetches roles with service access relationships
 */
async function fetchRoles(): Promise<Role[]> {
  const response = await fetch(
    `${URLS.ROLES}?related=role_service_access_by_role_id`,
    {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      credentials: 'include', // Include session cookies for authentication
    }
  );

  if (!response.ok) {
    throw new Error(`Failed to fetch roles: ${response.status} ${response.statusText}`);
  }

  const data = await response.json();
  const validatedData = RolesResponseSchema.parse(data);
  return validatedData.resource;
}

/**
 * Fetches apps for a specific role ID
 */
async function fetchAppsForRole(roleId: number): Promise<App[]> {
  const response = await fetch(
    `${URLS.APP}?filter=role_id=${roleId}&fields=*`,
    {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      credentials: 'include', // Include session cookies for authentication
    }
  );

  if (!response.ok) {
    throw new Error(`Failed to fetch apps for role ${roleId}: ${response.status} ${response.statusText}`);
  }

  const data = await response.json();
  const validatedData = AppsResponseSchema.parse(data);
  return validatedData.resource;
}

/**
 * Fetches API keys for a specific service ID
 * Replicates the original Angular service logic with React Query patterns
 */
async function fetchApiKeysForService(serviceId: number): Promise<ApiKeyInfo[]> {
  // Handle invalid service ID
  if (serviceId === -1 || serviceId < 0) {
    return [];
  }

  try {
    // Step 1: Fetch all roles with service access
    const roles = await fetchRoles();

    // Step 2: Filter roles that have access to the specified service
    const relevantRoles = roles.filter(role => {
      if (!role.roleServiceAccessByRoleId || !Array.isArray(role.roleServiceAccessByRoleId)) {
        return false;
      }

      return role.roleServiceAccessByRoleId.some(
        access => access.serviceId === serviceId
      );
    });

    if (!relevantRoles.length) {
      return [];
    }

    // Step 3: Fetch apps for all relevant roles in parallel
    const appRequests = relevantRoles.map(role => fetchAppsForRole(role.id));
    const appsResponses = await Promise.all(appRequests);

    // Step 4: Process and validate API keys
    const keys: ApiKeyInfo[] = appsResponses
      .flat()
      .filter((app): app is App => {
        // Filter out apps without API keys and validate structure
        return !!(app && app.apiKey && app.name);
      })
      .map(app => ({
        name: app.name,
        apiKey: app.apiKey,
      }))
      .filter(key => {
        // Additional Zod validation for each key
        try {
          ApiKeyInfoSchema.parse(key);
          return true;
        } catch {
          console.warn('Invalid API key structure found:', key);
          return false;
        }
      });

    return keys;
  } catch (error) {
    console.error('Error fetching API keys for service:', serviceId, error);
    throw error;
  }
}

// ============================================================================
// REACT QUERY HOOKS
// ============================================================================

/**
 * Query key factory for API keys
 */
const apiKeysQueryKeys = {
  all: ['apiKeys'] as const,
  forService: (serviceId: number) => ['apiKeys', 'service', serviceId] as const,
};

/**
 * useApiKeys Hook
 * 
 * Provides API key management functionality for DreamFactory services using React Query
 * for intelligent caching and state management. Replaces the Angular ApiKeysService with
 * modern React patterns.
 * 
 * @param serviceId - The service ID to fetch API keys for
 * @param options - Optional query configuration overrides
 * @returns React Query result with API keys data, loading state, and error handling
 */
export function useApiKeys(
  serviceId: number,
  options?: {
    enabled?: boolean;
    refetchInterval?: number;
    onSuccess?: (data: ApiKeyInfo[]) => void;
    onError?: (error: Error) => void;
  }
) {
  const query = useQuery({
    queryKey: apiKeysQueryKeys.forService(serviceId),
    queryFn: () => fetchApiKeysForService(serviceId),
    enabled: options?.enabled !== false && serviceId > 0,
    ...QUERY_CONFIG,
    refetchInterval: options?.refetchInterval,
    onSuccess: options?.onSuccess,
    onError: options?.onError,
  });

  return {
    ...query,
    /**
     * API keys for the specified service
     */
    apiKeys: query.data || [],
    /**
     * Whether the query is currently loading
     */
    isLoading: query.isLoading,
    /**
     * Whether the query is fetching (including background refetch)
     */
    isFetching: query.isFetching,
    /**
     * Error object if the query failed
     */
    error: query.error,
    /**
     * Whether the data is stale (beyond staleTime)
     */
    isStale: query.isStale,
    /**
     * Manually refetch the API keys
     */
    refetch: query.refetch,
  };
}

/**
 * useClearApiKeysCache Hook
 * 
 * Provides cache invalidation functionality for API keys. Replaces the clearCache()
 * method from the original Angular service with React Query cache management.
 * 
 * @returns Function to clear API keys cache
 */
export function useClearApiKeysCache() {
  const queryClient = useQueryClient();

  return useCallback(
    (serviceId?: number) => {
      if (serviceId !== undefined) {
        // Clear cache for specific service
        queryClient.invalidateQueries({
          queryKey: apiKeysQueryKeys.forService(serviceId),
        });
      } else {
        // Clear all API keys cache
        queryClient.invalidateQueries({
          queryKey: apiKeysQueryKeys.all,
        });
      }
    },
    [queryClient]
  );
}

/**
 * usePrefetchApiKeys Hook
 * 
 * Provides prefetching functionality for API keys to improve perceived performance
 * by loading data before it's needed.
 * 
 * @returns Function to prefetch API keys for a service
 */
export function usePrefetchApiKeys() {
  const queryClient = useQueryClient();

  return useCallback(
    (serviceId: number) => {
      if (serviceId > 0) {
        queryClient.prefetchQuery({
          queryKey: apiKeysQueryKeys.forService(serviceId),
          queryFn: () => fetchApiKeysForService(serviceId),
          ...QUERY_CONFIG,
        });
      }
    },
    [queryClient]
  );
}

/**
 * useApiKeysCache Hook
 * 
 * Provides access to cached API keys data without triggering a network request.
 * Useful for accessing previously fetched data.
 * 
 * @param serviceId - The service ID to get cached data for
 * @returns Cached API keys data or undefined if not cached
 */
export function useApiKeysCache(serviceId: number): ApiKeyInfo[] | undefined {
  const queryClient = useQueryClient();

  return useMemo(() => {
    const cachedData = queryClient.getQueryData<ApiKeyInfo[]>(
      apiKeysQueryKeys.forService(serviceId)
    );
    return cachedData;
  }, [queryClient, serviceId]);
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Validates API key data structure
 * 
 * @param data - Data to validate
 * @returns Whether the data is valid API key info
 */
export function isValidApiKeyInfo(data: unknown): data is ApiKeyInfo {
  try {
    ApiKeyInfoSchema.parse(data);
    return true;
  } catch {
    return false;
  }
}

/**
 * Filters API keys by name pattern
 * 
 * @param apiKeys - API keys to filter
 * @param pattern - Search pattern (case-insensitive)
 * @returns Filtered API keys
 */
export function filterApiKeysByName(apiKeys: ApiKeyInfo[], pattern: string): ApiKeyInfo[] {
  if (!pattern.trim()) {
    return apiKeys;
  }

  const lowerPattern = pattern.toLowerCase().trim();
  return apiKeys.filter(key => 
    key.name.toLowerCase().includes(lowerPattern)
  );
}

/**
 * Gets API key preview (first 8 characters)
 * 
 * @param apiKey - Full API key
 * @returns Truncated preview string
 */
export function getApiKeyPreview(apiKey: string): string {
  return apiKey.length > 8 ? `${apiKey.substring(0, 8)}...` : apiKey;
}

// ============================================================================
// EXPORT DEFAULT
// ============================================================================

/**
 * Default export provides the main API keys hook for standard usage
 */
export default useApiKeys;

// ============================================================================
// TYPE EXPORTS
// ============================================================================

export type { ApiKeyInfo, ServiceApiKeys };