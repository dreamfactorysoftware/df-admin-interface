/**
 * useStorageServices - Custom React hook for storage services management
 * 
 * Migrates from Angular baseService.getAll() to React Query-powered data fetching with
 * intelligent caching, group-based filtering for storage services, and automatic 
 * background revalidation. Provides comprehensive server-state management for storage
 * services with retry strategies and optimized caching configuration.
 * 
 * @fileoverview React Query hook for fetching storage services with source control and file filtering
 * @version 1.0.0
 * @since 2024-01-01
 */

import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useCallback, useMemo } from 'react';
import type { 
  Service, 
  ServiceType, 
  GenericListResponse,
  ApiErrorResponse 
} from '../../../../types/api';
import type { DatabaseService } from '../../../../types/database-service';

// =============================================================================
// TYPES AND INTERFACES
// =============================================================================

/**
 * Storage service filter parameters for intelligent filtering and caching
 */
export interface UseStorageServicesOptions {
  /** Group parameter filtering - defaults to 'source control,file' for storage services */
  groups?: string;
  /** Enable/disable query execution */
  enabled?: boolean;
  /** Manual cache refresh trigger */
  refresh?: boolean;
  /** Custom stale time override (default: 5-15 minutes) */
  staleTime?: number;
  /** Custom cache time override (default: 30 minutes) */
  cacheTime?: number;
}

/**
 * Storage services query result with metadata
 */
export interface StorageServicesQueryResult {
  /** Storage services data array */
  resource: Service[];
  /** Query metadata with count information */
  meta?: {
    count: number;
  };
}

/**
 * Hook return interface with query state and helper methods
 */
export interface UseStorageServicesReturn {
  /** Storage services data array */
  services: Service[];
  /** Service types for storage services */
  serviceTypes: ServiceType[];
  /** Loading state indicator */
  isLoading: boolean;
  /** Error state with typed error information */
  error: ApiErrorResponse | null;
  /** Data fetching state */
  isFetching: boolean;
  /** Background refresh state */
  isRefetching: boolean;
  /** Manual refresh function */
  refetch: () => Promise<any>;
  /** Cache invalidation function */
  invalidate: () => Promise<void>;
  /** Query metadata */
  meta?: {
    count: number;
  };
}

// =============================================================================
// QUERY KEYS AND CACHE MANAGEMENT
// =============================================================================

/**
 * Centralized query key factory for storage services cache management
 */
export const storageServicesQueryKeys = {
  all: ['storage-services'] as const,
  lists: () => [...storageServicesQueryKeys.all, 'list'] as const,
  list: (options?: UseStorageServicesOptions) => [
    ...storageServicesQueryKeys.lists(),
    {
      groups: options?.groups || 'source control,file',
      enabled: options?.enabled ?? true,
    },
  ] as const,
  serviceTypes: () => [...storageServicesQueryKeys.all, 'service-types'] as const,
} as const;

// =============================================================================
// API CLIENT FUNCTIONS
// =============================================================================

/**
 * Fetch storage services with group-based filtering
 * Replicates Angular baseService.getAll() functionality with React Query optimization
 */
async function fetchStorageServices(options: UseStorageServicesOptions = {}): Promise<StorageServicesQueryResult> {
  const { groups = 'source control,file' } = options;

  // Dynamic import for better tree-shaking with Turbopack
  const { apiClient } = await import('../../../../lib/api-client');
  
  try {
    // Fetch services with group filtering - matches original component baseService.getAll() pattern
    const response = await apiClient.get<GenericListResponse<Service>>('/system/service', {
      params: {
        group: groups,
        fields: 'name,label,type,description,id,is_active', // Essential fields for storage services
      },
    });

    // Validate response structure
    if (!response || typeof response !== 'object') {
      throw new Error('Invalid response format from storage services API');
    }

    // Return normalized data structure
    return {
      resource: response.resource || [],
      meta: response.meta || { count: 0 },
    };

  } catch (error: any) {
    // Enhanced error handling with context
    const apiError: ApiErrorResponse = {
      message: error?.message || 'Failed to fetch storage services',
      code: error?.code || 'STORAGE_SERVICES_FETCH_ERROR',
      statusCode: error?.statusCode || error?.status || 500,
      details: error?.details || null,
      timestamp: new Date().toISOString(),
    };
    
    throw apiError;
  }
}

/**
 * Fetch service types for storage services
 * Provides additional metadata for storage service management
 */
async function fetchStorageServiceTypes(): Promise<ServiceType[]> {
  // Dynamic import for better tree-shaking with Turbopack
  const { apiClient } = await import('../../../../lib/api-client');
  
  try {
    // Fetch service types for source control and file services
    const [sourceControlResponse, fileResponse] = await Promise.all([
      apiClient.get<GenericListResponse<ServiceType>>('/system/service_type', {
        params: {
          group: 'source control',
          fields: 'name,label,group,description',
        },
      }),
      apiClient.get<GenericListResponse<ServiceType>>('/system/service_type', {
        params: {
          group: 'file',
          fields: 'name,label,group,description',
        },
      }),
    ]);

    // Combine and flatten service types
    const serviceTypes = [
      ...(sourceControlResponse.resource || []),
      ...(fileResponse.resource || []),
    ];

    return serviceTypes;

  } catch (error: any) {
    // Log error but don't throw - service types are supplementary data
    console.warn('Failed to fetch storage service types:', error);
    return [];
  }
}

// =============================================================================
// MAIN HOOK IMPLEMENTATION
// =============================================================================

/**
 * useStorageServices - Main storage services data fetching hook
 * 
 * Provides intelligent caching, group-based filtering, and automatic background
 * revalidation for storage services (source control and file services). Implements
 * React Query best practices with retry strategies and error handling.
 * 
 * @param options - Configuration options for storage services fetching
 * @returns Storage services data with loading states and cache management
 */
export function useStorageServices(options: UseStorageServicesOptions = {}): UseStorageServicesReturn {
  const {
    groups = 'source control,file',
    enabled = true,
    staleTime = 5 * 60 * 1000, // 5 minutes default (5-15 minute range per spec)
    cacheTime = 30 * 60 * 1000, // 30 minutes
  } = options;

  const queryClient = useQueryClient();

  // ==========================================================================
  // SERVICES QUERY
  // ==========================================================================

  const servicesQuery = useQuery({
    queryKey: storageServicesQueryKeys.list({ groups, enabled }),
    queryFn: () => fetchStorageServices({ groups }),
    enabled,
    staleTime,
    cacheTime,
    // React Query retry configuration aligned with Section 4.4.5.2 network error recovery
    retry: (failureCount, error: any) => {
      // Don't retry on authentication errors
      if (error?.statusCode === 401 || error?.statusCode === 403) {
        return false;
      }
      // Retry up to 3 times with exponential backoff
      return failureCount < 3;
    },
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000), // Max 30 second delay
    // Background refetching configuration for storage service consistency
    refetchOnWindowFocus: true,
    refetchOnReconnect: true,
    refetchInterval: 15 * 60 * 1000, // Background refresh every 15 minutes
    // Error handling configuration
    throwOnError: false,
    // Query metadata
    meta: {
      description: 'Storage services data fetching with group filtering',
    },
  });

  // ==========================================================================
  // SERVICE TYPES QUERY
  // ==========================================================================

  const serviceTypesQuery = useQuery({
    queryKey: storageServicesQueryKeys.serviceTypes(),
    queryFn: fetchStorageServiceTypes,
    enabled,
    staleTime: 15 * 60 * 1000, // Service types change less frequently
    cacheTime: 60 * 60 * 1000, // 1 hour
    retry: 2, // Fewer retries for supplementary data
    refetchOnWindowFocus: false,
    refetchInterval: 30 * 60 * 1000, // 30 minutes
    throwOnError: false,
  });

  // ==========================================================================
  // CACHE MANAGEMENT FUNCTIONS
  // ==========================================================================

  /**
   * Manual cache invalidation for storage services
   */
  const invalidate = useCallback(async (): Promise<void> => {
    await queryClient.invalidateQueries({
      queryKey: storageServicesQueryKeys.all,
    });
  }, [queryClient]);

  /**
   * Manual refetch function with error handling
   */
  const refetch = useCallback(async () => {
    try {
      const result = await servicesQuery.refetch();
      // Also refresh service types
      serviceTypesQuery.refetch();
      return result;
    } catch (error) {
      console.error('Storage services refetch failed:', error);
      throw error;
    }
  }, [servicesQuery, serviceTypesQuery]);

  // ==========================================================================
  // DERIVED STATE AND RETURN VALUES
  // ==========================================================================

  const derivedState = useMemo(() => {
    return {
      services: servicesQuery.data?.resource || [],
      serviceTypes: serviceTypesQuery.data || [],
      isLoading: servicesQuery.isLoading || serviceTypesQuery.isLoading,
      error: servicesQuery.error as ApiErrorResponse | null,
      isFetching: servicesQuery.isFetching || serviceTypesQuery.isFetching,
      isRefetching: servicesQuery.isRefetching || serviceTypesQuery.isRefetching,
      meta: servicesQuery.data?.meta,
    };
  }, [
    servicesQuery.data,
    servicesQuery.isLoading,
    servicesQuery.error,
    servicesQuery.isFetching,
    servicesQuery.isRefetching,
    serviceTypesQuery.data,
    serviceTypesQuery.isLoading,
    serviceTypesQuery.isFetching,
    serviceTypesQuery.isRefetching,
  ]);

  return {
    ...derivedState,
    refetch,
    invalidate,
  };
}

// =============================================================================
// HOOK UTILITIES AND HELPERS
// =============================================================================

/**
 * Utility function to filter storage services by type
 */
export function filterStorageServicesByType(
  services: Service[],
  serviceType: string
): Service[] {
  return services.filter(service => service.type === serviceType);
}

/**
 * Utility function to get active storage services only
 */
export function getActiveStorageServices(services: Service[]): Service[] {
  return services.filter(service => service.is_active !== false);
}

/**
 * Utility function to sort storage services by name
 */
export function sortStorageServicesByName(services: Service[]): Service[] {
  return [...services].sort((a, b) => {
    const nameA = a.name?.toLowerCase() || '';
    const nameB = b.name?.toLowerCase() || '';
    return nameA.localeCompare(nameB);
  });
}

/**
 * Default export for convenient importing
 */
export default useStorageServices;