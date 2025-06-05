'use client';

import { useQuery, useQueries, UseQueryResult } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import { GenericListResponse, Meta } from '@/types/generic-http';
import { Service, ServiceType } from '@/types/service';
import { useServiceTypes } from './use-service-types';

/**
 * Configuration options for useServices hook
 */
interface UseServicesOptions {
  /** Maximum number of services to fetch */
  limit?: number;
  /** Additional filter string for query */
  filter?: string;
  /** Whether to fetch system services (created_by_id is null) or user services (created_by_id is not null) */
  system?: boolean;
  /** Array of service groups to filter by. When provided, will fetch service types for these groups first */
  groups?: string[];
  /** Whether to enable the query (default: true) */
  enabled?: boolean;
}

/**
 * Configuration options for useService hook
 */
interface UseServiceOptions {
  /** Related entities to include in the response */
  related?: string;
  /** Whether to enable the query (default: true when id is provided) */
  enabled?: boolean;
}

/**
 * Response type for useServices hook combining services and service types
 */
interface UseServicesResponse {
  resource: Service[];
  meta?: Meta;
  serviceTypes?: ServiceType[];
}

/**
 * React Query configuration constants
 * TTL configuration per Section 5.2 requirements:
 * - staleTime: 300 seconds (5 minutes)
 * - cacheTime: 900 seconds (15 minutes)
 */
const QUERY_CONFIG = {
  staleTime: 5 * 60 * 1000, // 5 minutes
  cacheTime: 15 * 60 * 1000, // 15 minutes
} as const;

/**
 * Custom React Query hook that fetches a list of services with advanced filtering capabilities.
 * Replaces Angular servicesResolver factory pattern with React Query useServices hook.
 * 
 * Features:
 * - Intelligent caching with TTL configuration (staleTime: 300s, cacheTime: 900s)
 * - Group-based filtering using parallel queries with useQueries
 * - System vs user service filtering
 * - Complex filter string building logic
 * - Background synchronization and automatic revalidation
 * - Cache hit responses under 50ms per React/Next.js Integration Requirements
 * 
 * @param options - Configuration options for service fetching
 * @returns UseQueryResult containing services data, loading state, and error information
 */
export function useServices(options: UseServicesOptions = {}): UseQueryResult<UseServicesResponse> {
  const {
    limit,
    filter,
    system,
    groups,
    enabled = true,
  } = options;

  // Fetch service types for group filtering
  const {
    data: serviceTypesData,
    isLoading: serviceTypesLoading,
    error: serviceTypesError,
  } = useServiceTypes({
    groups,
    enabled: enabled && !!groups?.length,
  });

  // Determine if we should proceed with services query
  const shouldFetchServices = enabled && (!groups?.length || (!serviceTypesLoading && !serviceTypesError));

  return useQuery({
    queryKey: ['services', { limit, filter, system, groups }],
    queryFn: async (): Promise<UseServicesResponse> => {
      // Build the filter string based on system flag and groups
      let filterString = '';

      if (system !== undefined) {
        if (system) {
          // System services: created_by_id is not null
          filterString = '(created_by_id is not null)';
        } else {
          // User services: created_by_id is null and exclude api_docs
          filterString = '(created_by_id is null) and (name != "api_docs")';
        }
      }

      // Add group-based filtering if groups are specified
      if (groups?.length && serviceTypesData?.length) {
        const serviceTypeNames = serviceTypesData.map(st => st.name);
        const typeFilter = `(type in ("${serviceTypeNames.join('","')}"))`;
        
        if (filterString) {
          filterString = `${filterString} and ${typeFilter}`;
        } else {
          filterString = typeFilter;
        }
      }

      // Add additional filter if provided
      if (filter) {
        if (filterString) {
          filterString = `${filterString} and ${filter}`;
        } else {
          filterString = filter;
        }
      }

      // Fetch services with constructed filter
      const response = await apiClient.get<GenericListResponse<Service>>('/system/service', {
        params: {
          limit,
          sort: 'name',
          ...(filterString && { filter: filterString }),
        },
      });

      return {
        resource: response.resource,
        meta: response.meta,
        serviceTypes: serviceTypesData,
      };
    },
    enabled: shouldFetchServices,
    ...QUERY_CONFIG,
    // Select function for optimized re-rendering per React/Next.js Integration Requirements
    select: (data) => ({
      ...data,
      // Ensure stable references for arrays
      resource: data.resource || [],
      serviceTypes: data.serviceTypes || [],
    }),
    // Background refetch configuration for intelligent synchronization
    refetchOnMount: true,
    refetchOnWindowFocus: false,
    refetchOnReconnect: true,
    // Retry configuration for resilient data fetching
    retry: (failureCount, error: any) => {
      // Don't retry on 4xx errors (client errors)
      if (error?.response?.status >= 400 && error?.response?.status < 500) {
        return false;
      }
      // Retry up to 3 times for other errors
      return failureCount < 3;
    },
  });
}

/**
 * Custom React Query hook that fetches a single service by ID with related data.
 * Replaces Angular serviceResolver for individual service fetching.
 * 
 * Features:
 * - Intelligent caching with TTL configuration
 * - Optional related data fetching
 * - Automatic background revalidation
 * - Type-safe service data with proper error handling
 * 
 * @param id - Service ID to fetch
 * @param options - Configuration options for service fetching
 * @returns UseQueryResult containing service data, loading state, and error information
 */
export function useService(
  id: string | number | null | undefined,
  options: UseServiceOptions = {}
): UseQueryResult<Service | undefined> {
  const {
    related = 'service_doc_by_service_id',
    enabled = true,
  } = options;

  return useQuery({
    queryKey: ['service', id, { related }],
    queryFn: async (): Promise<Service> => {
      if (!id) {
        throw new Error('Service ID is required');
      }

      const response = await apiClient.get<Service>(`/system/service/${id}`, {
        params: {
          related,
        },
      });

      return response;
    },
    enabled: enabled && !!id,
    ...QUERY_CONFIG,
    // Background refetch configuration
    refetchOnMount: true,
    refetchOnWindowFocus: false,
    refetchOnReconnect: true,
    // Retry configuration
    retry: (failureCount, error: any) => {
      // Don't retry on 404 (service not found) or other 4xx errors
      if (error?.response?.status >= 400 && error?.response?.status < 500) {
        return false;
      }
      return failureCount < 3;
    },
  });
}

/**
 * Utility hook for fetching multiple services in parallel using useQueries.
 * Useful for complex scenarios requiring parallel service fetching with different parameters.
 * 
 * @param queries - Array of service query configurations
 * @returns Array of UseQueryResult objects for each service query
 */
export function useMultipleServices(
  queries: Array<{ id: string | number; options?: UseServiceOptions }>
): UseQueryResult<Service | undefined>[] {
  return useQueries({
    queries: queries.map(({ id, options = {} }) => ({
      queryKey: ['service', id, { related: options.related }],
      queryFn: async (): Promise<Service> => {
        const response = await apiClient.get<Service>(`/system/service/${id}`, {
          params: {
            related: options.related || 'service_doc_by_service_id',
          },
        });
        return response;
      },
      enabled: options.enabled !== false && !!id,
      ...QUERY_CONFIG,
    })),
  });
}

/**
 * Query key factory for service-related queries.
 * Provides consistent query key generation for cache invalidation and prefetching.
 */
export const serviceQueryKeys = {
  all: ['services'] as const,
  lists: () => [...serviceQueryKeys.all, 'list'] as const,
  list: (filters: UseServicesOptions) => [...serviceQueryKeys.lists(), filters] as const,
  details: () => [...serviceQueryKeys.all, 'detail'] as const,
  detail: (id: string | number, options?: UseServiceOptions) => 
    [...serviceQueryKeys.details(), id, options] as const,
} as const;

/**
 * Type exports for external usage
 */
export type { UseServicesOptions, UseServiceOptions, UseServicesResponse };