/**
 * useServices - Custom React hook for database services management
 * 
 * Migrates from Angular servicesResolver to React Query-powered data fetching with
 * intelligent caching, parallel group filtering, system-level filtering, and
 * optimistic updates. Provides comprehensive server-state management for database
 * services with background synchronization and automatic cache invalidation.
 * 
 * @fileoverview React Query hook for fetching and managing database services
 * @version 1.0.0
 * @since 2024-01-01
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useCallback, useMemo } from 'react';
import type { 
  DatabaseService, 
  ServiceType, 
  GenericListResponse, 
  ApiErrorResponse 
} from '../types';

// =============================================================================
// TYPES AND INTERFACES
// =============================================================================

/**
 * Service filter parameters for intelligent filtering and caching
 */
export interface UseServicesOptions {
  /** Optional service type groups for parallel filtering */
  groups?: string[];
  /** System-level filtering (created_by_id null vs not null) */
  system?: boolean;
  /** Custom filter string for additional filtering */
  filter?: string;
  /** Pagination limit */
  limit?: number;
  /** Manual cache refresh trigger */
  refresh?: boolean;
  /** Enable/disable query execution */
  enabled?: boolean;
}

/**
 * Services query result with metadata and service types
 */
export interface ServicesQueryResult {
  resource: DatabaseService[];
  meta?: {
    count: number;
  };
  serviceTypes?: ServiceType[];
}

/**
 * Hook return interface with query state and mutations
 */
export interface UseServicesReturn {
  /** Services data array */
  services: DatabaseService[];
  /** Service types metadata when groups filtering is used */
  serviceTypes?: ServiceType[];
  /** Loading state */
  isLoading: boolean;
  /** Error state */
  error: ApiErrorResponse | null;
  /** Manual refetch function */
  refetch: () => void;
  /** Cache invalidation */
  invalidateCache: () => Promise<void>;
  /** Optimistic update mutations */
  mutations: {
    create: ReturnType<typeof useMutation>;
    update: ReturnType<typeof useMutation>;
    delete: ReturnType<typeof useMutation>;
  };
}

// =============================================================================
// QUERY KEYS AND CACHE MANAGEMENT
// =============================================================================

/**
 * Centralized query key factory for cache management
 */
export const servicesQueryKeys = {
  all: ['database-services'] as const,
  lists: () => [...servicesQueryKeys.all, 'list'] as const,
  list: (options?: UseServicesOptions) => [
    ...servicesQueryKeys.lists(),
    {
      groups: options?.groups || null,
      system: options?.system || false,
      filter: options?.filter || null,
      limit: options?.limit || null,
    },
  ] as const,
  serviceTypes: () => [...servicesQueryKeys.all, 'service-types'] as const,
  serviceTypeList: (groups?: string[]) => [
    ...servicesQueryKeys.serviceTypes(),
    groups || null,
  ] as const,
} as const;

// =============================================================================
// API CLIENT FUNCTIONS
// =============================================================================

/**
 * Fetch services with intelligent filtering and parallel group support
 * Replicates Angular servicesResolver functionality with React Query optimization
 */
async function fetchServices(options: UseServicesOptions = {}): Promise<ServicesQueryResult> {
  const { groups, system = false, filter, limit } = options;

  // Import API client functions (assuming they exist in the api-client module)
  const { apiClient } = await import('../../../lib/api-client');
  
  try {
    // Parallel group-based filtering (matches original resolver forkJoin pattern)
    if (groups && groups.length > 0) {
      // Fetch service types for all groups in parallel
      const serviceTypePromises = groups.map(group =>
        apiClient.get<GenericListResponse<ServiceType>>('/system/service_type', {
          params: {
            fields: 'name',
            group,
          },
        })
      );

      const serviceTypeResponses = await Promise.all(serviceTypePromises);
      const serviceTypes = serviceTypeResponses
        .map(response => response.resource)
        .flat();

      // Build filter string for service types
      const typeNames = serviceTypes.map(st => st.name);
      const typeFilter = `type in ("${typeNames.join('","')}")`;
      
      // Combine with system and custom filters
      const combinedFilter = [
        system ? '(created_by_id is not null)' : '',
        typeFilter,
        filter || '',
      ]
        .filter(Boolean)
        .join(' and ');

      // Fetch services with combined filter
      const servicesResponse = await apiClient.get<GenericListResponse<DatabaseService>>(
        '/system/service',
        {
          params: {
            limit,
            sort: 'name',
            filter: combinedFilter,
          },
        }
      );

      return {
        ...servicesResponse,
        serviceTypes,
      };
    }

    // Standard filtering without groups
    const systemFilter = system 
      ? '(created_by_id is null) and (name != "api_docs")'
      : '';
    
    const combinedFilter = [systemFilter, filter]
      .filter(Boolean)
      .join(' and ');

    const servicesResponse = await apiClient.get<GenericListResponse<DatabaseService>>(
      '/system/service',
      {
        params: {
          limit,
          sort: 'name',
          filter: combinedFilter || undefined,
        },
      }
    );

    return servicesResponse;
  } catch (error) {
    throw error;
  }
}

/**
 * Create a new database service
 */
async function createService(service: Partial<DatabaseService>): Promise<DatabaseService> {
  const { apiClient } = await import('../../../lib/api-client');
  
  const response = await apiClient.post<DatabaseService>('/system/service', service);
  return response;
}

/**
 * Update an existing database service
 */
async function updateService(
  id: number,
  updates: Partial<DatabaseService>
): Promise<DatabaseService> {
  const { apiClient } = await import('../../../lib/api-client');
  
  const response = await apiClient.patch<DatabaseService>(
    `/system/service/${id}`,
    updates
  );
  return response;
}

/**
 * Delete a database service
 */
async function deleteService(id: number): Promise<void> {
  const { apiClient } = await import('../../../lib/api-client');
  
  await apiClient.delete(`/system/service/${id}`);
}

// =============================================================================
// CUSTOM HOOK IMPLEMENTATION
// =============================================================================

/**
 * useServices - Comprehensive database services management hook
 * 
 * Provides intelligent caching, filtering, and mutation capabilities for database
 * services with optimistic updates and background synchronization. Implements
 * the same functionality as Angular servicesResolver with enhanced performance.
 * 
 * @param options - Service filtering and query options
 * @returns Hook result with services data, loading state, and mutations
 * 
 * @example
 * ```typescript
 * // Basic usage
 * const { services, isLoading, error } = useServices();
 * 
 * // With group filtering
 * const { services, serviceTypes } = useServices({
 *   groups: ['database', 'nosql'],
 *   system: false
 * });
 * 
 * // With custom filtering
 * const { services } = useServices({
 *   filter: 'name like "%test%"',
 *   limit: 50
 * });
 * ```
 */
export function useServices(options: UseServicesOptions = {}): UseServicesReturn {
  const queryClient = useQueryClient();
  const { enabled = true } = options;

  // Memoize query key for cache optimization
  const queryKey = useMemo(
    () => servicesQueryKeys.list(options),
    [options.groups, options.system, options.filter, options.limit]
  );

  // Main services query with intelligent caching
  const {
    data,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey,
    queryFn: () => fetchServices(options),
    enabled,
    
    // Intelligent caching configuration per Section 3.2.4
    staleTime: 5 * 60 * 1000, // 5 minutes (minimum of 5-15 minute range)
    gcTime: 10 * 60 * 1000, // 10 minutes cache time
    
    // Background synchronization settings
    refetchOnWindowFocus: true,
    refetchOnReconnect: true,
    refetchInterval: 15 * 60 * 1000, // 15 minutes background refresh
    
    // Error handling with exponential backoff retry strategy
    retry: (failureCount, error) => {
      // Don't retry on 4xx errors (client errors)
      if (error && typeof error === 'object' && 'status' in error) {
        const status = (error as any).status;
        if (status >= 400 && status < 500) {
          return false;
        }
      }
      
      // Retry up to 3 times for network/server errors
      return failureCount < 3;
    },
    
    retryDelay: (attemptIndex) => {
      // Exponential backoff: 1s, 2s, 4s
      return Math.min(1000 * 2 ** attemptIndex, 30000);
    },

    // Performance optimization
    select: useCallback((data: ServicesQueryResult) => data, []),
  });

  // Cache invalidation helper
  const invalidateCache = useCallback(async () => {
    await queryClient.invalidateQueries({
      queryKey: servicesQueryKeys.all,
    });
  }, [queryClient]);

  // Optimistic create mutation
  const createMutation = useMutation({
    mutationFn: createService,
    
    // Optimistic update
    onMutate: async (newService) => {
      await queryClient.cancelQueries({ queryKey });
      
      const previousServices = queryClient.getQueryData<ServicesQueryResult>(queryKey);
      
      if (previousServices) {
        queryClient.setQueryData<ServicesQueryResult>(queryKey, {
          ...previousServices,
          resource: [
            ...previousServices.resource,
            {
              ...newService,
              id: Date.now(), // Temporary ID
              createdDate: new Date().toISOString(),
              lastModifiedDate: new Date().toISOString(),
            } as DatabaseService,
          ],
        });
      }
      
      return { previousServices };
    },
    
    // Success: update with server response
    onSuccess: (createdService, variables, context) => {
      queryClient.setQueryData<ServicesQueryResult>(queryKey, (old) => {
        if (!old) return old;
        
        return {
          ...old,
          resource: old.resource.map((service) =>
            service.id === context?.previousServices?.resource.length
              ? createdService
              : service
          ),
        };
      });
      
      // Invalidate related queries
      invalidateCache();
    },
    
    // Error: rollback optimistic update
    onError: (error, variables, context) => {
      if (context?.previousServices) {
        queryClient.setQueryData(queryKey, context.previousServices);
      }
    },
  });

  // Optimistic update mutation
  const updateMutation = useMutation({
    mutationFn: ({ id, updates }: { id: number; updates: Partial<DatabaseService> }) =>
      updateService(id, updates),
    
    // Optimistic update
    onMutate: async ({ id, updates }) => {
      await queryClient.cancelQueries({ queryKey });
      
      const previousServices = queryClient.getQueryData<ServicesQueryResult>(queryKey);
      
      if (previousServices) {
        queryClient.setQueryData<ServicesQueryResult>(queryKey, {
          ...previousServices,
          resource: previousServices.resource.map((service) =>
            service.id === id
              ? {
                  ...service,
                  ...updates,
                  lastModifiedDate: new Date().toISOString(),
                }
              : service
          ),
        });
      }
      
      return { previousServices };
    },
    
    // Success: confirm update
    onSuccess: (updatedService, variables, context) => {
      queryClient.setQueryData<ServicesQueryResult>(queryKey, (old) => {
        if (!old) return old;
        
        return {
          ...old,
          resource: old.resource.map((service) =>
            service.id === variables.id ? updatedService : service
          ),
        };
      });
      
      invalidateCache();
    },
    
    // Error: rollback optimistic update
    onError: (error, variables, context) => {
      if (context?.previousServices) {
        queryClient.setQueryData(queryKey, context.previousServices);
      }
    },
  });

  // Optimistic delete mutation
  const deleteMutation = useMutation({
    mutationFn: deleteService,
    
    // Optimistic update
    onMutate: async (serviceId) => {
      await queryClient.cancelQueries({ queryKey });
      
      const previousServices = queryClient.getQueryData<ServicesQueryResult>(queryKey);
      
      if (previousServices) {
        queryClient.setQueryData<ServicesQueryResult>(queryKey, {
          ...previousServices,
          resource: previousServices.resource.filter(
            (service) => service.id !== serviceId
          ),
        });
      }
      
      return { previousServices };
    },
    
    // Success: confirm deletion
    onSuccess: (data, serviceId, context) => {
      invalidateCache();
    },
    
    // Error: rollback optimistic update
    onError: (error, serviceId, context) => {
      if (context?.previousServices) {
        queryClient.setQueryData(queryKey, context.previousServices);
      }
    },
  });

  // Manual refetch wrapper
  const manualRefetch = useCallback(() => {
    refetch();
  }, [refetch]);

  return {
    services: data?.resource || [],
    serviceTypes: data?.serviceTypes,
    isLoading,
    error: error as ApiErrorResponse | null,
    refetch: manualRefetch,
    invalidateCache,
    mutations: {
      create: createMutation,
      update: updateMutation,
      delete: deleteMutation,
    },
  };
}

// =============================================================================
// ADDITIONAL UTILITY HOOKS
// =============================================================================

/**
 * useServicesInvalidation - Hook for manual cache invalidation
 * 
 * Provides utilities for invalidating services cache from external components
 * without direct access to the services query.
 */
export function useServicesInvalidation() {
  const queryClient = useQueryClient();

  const invalidateServices = useCallback(async () => {
    await queryClient.invalidateQueries({
      queryKey: servicesQueryKeys.all,
    });
  }, [queryClient]);

  const invalidateServicesList = useCallback(
    async (options?: UseServicesOptions) => {
      await queryClient.invalidateQueries({
        queryKey: servicesQueryKeys.list(options),
      });
    },
    [queryClient]
  );

  const removeServicesCache = useCallback(async () => {
    await queryClient.removeQueries({
      queryKey: servicesQueryKeys.all,
    });
  }, [queryClient]);

  return {
    invalidateServices,
    invalidateServicesList,
    removeServicesCache,
  };
}

/**
 * useServicesCache - Hook for programmatic cache management
 * 
 * Provides utilities for reading and manipulating services cache data
 * for advanced use cases like prefetching and cache warming.
 */
export function useServicesCache() {
  const queryClient = useQueryClient();

  const getServicesCache = useCallback(
    (options?: UseServicesOptions) => {
      return queryClient.getQueryData<ServicesQueryResult>(
        servicesQueryKeys.list(options)
      );
    },
    [queryClient]
  );

  const setServicesCache = useCallback(
    (options: UseServicesOptions, data: ServicesQueryResult) => {
      queryClient.setQueryData(servicesQueryKeys.list(options), data);
    },
    [queryClient]
  );

  const prefetchServices = useCallback(
    async (options: UseServicesOptions = {}) => {
      await queryClient.prefetchQuery({
        queryKey: servicesQueryKeys.list(options),
        queryFn: () => fetchServices(options),
        staleTime: 5 * 60 * 1000,
      });
    },
    [queryClient]
  );

  return {
    getServicesCache,
    setServicesCache,
    prefetchServices,
  };
}

// =============================================================================
// EXPORTS
// =============================================================================

export default useServices;

// Re-export types for convenience
export type {
  UseServicesOptions,
  ServicesQueryResult,
  UseServicesReturn,
};

// Export query keys for external cache management
export { servicesQueryKeys };