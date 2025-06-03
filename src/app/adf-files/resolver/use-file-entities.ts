/**
 * File Entities Collection Hook for React/Next.js DreamFactory Admin Interface
 * 
 * React Query-based custom hook that fetches file entity collections with intelligent
 * caching and automatic revalidation. Replaces the Angular entitiesResolver by implementing
 * React Query useQuery with TTL configuration for file list operations. Provides type-safe
 * Files response while maintaining the original type-based filtering parameters for different
 * file service types.
 * 
 * Key features:
 * - React Query-powered data fetching with intelligent caching per Section 3.2.2
 * - Cache hit responses under 50ms per React/Next.js Integration Requirements
 * - Automatic background revalidation for real-time file entity updates
 * - Type-based filtering parameters for different file service types
 * - Comprehensive error handling with retry strategies and exponential backoff
 * - TypeScript type safety with Files interface integration
 * 
 * Migration notes:
 * - Transforms Angular ResolveFn entitiesResolver to React Query useQuery hook
 * - Replaces Angular DI BASE_SERVICE_TOKEN injection with React Query-powered API client
 * - Converts RxJS observable pattern to React Query caching with TTL configuration
 * - Converts Angular route data access to hook parameters accepting type string
 * 
 * @author DreamFactory Admin Interface Team
 * @version React 19/Next.js 15.1 Migration
 * @feature F-008: File and Log Management
 */

'use client';

import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useCallback, useMemo } from 'react';
import { apiClient } from '@/lib/api-client';
import { Files, Service, ServiceType } from '@/types/files';

// =============================================================================
// TYPE DEFINITIONS AND INTERFACES
// =============================================================================

/**
 * File entities query parameters for filtering and configuration
 */
export interface FileEntitiesParams {
  /** Service type filter (e.g., 'file', 'aws_s3', 'azure_blob', etc.) */
  type?: string;
  /** Include inactive services in the response */
  includeInactive?: boolean;
  /** Custom query parameters for API request */
  queryParams?: Record<string, unknown>;
}

/**
 * File entities query result with enhanced metadata
 */
export interface FileEntitiesResult {
  /** Complete files response with services and service types */
  data: Files | undefined;
  /** Services filtered by type if specified */
  services: Service[];
  /** Available service types for file operations */
  serviceTypes: ServiceType[];
  /** Loading state indicator */
  isLoading: boolean;
  /** Error state indicator */
  isError: boolean;
  /** Error object if request failed */
  error: Error | null;
  /** Background fetching indicator */
  isFetching: boolean;
  /** Stale data indicator */
  isStale: boolean;
  /** Data freshness timestamp */
  dataUpdatedAt: number;
  /** Manual refresh function */
  refresh: () => Promise<void>;
  /** Clear cache function */
  clearCache: () => void;
}

/**
 * API response structure for file services endpoint
 */
interface FileServicesResponse {
  resource: Service[];
}

/**
 * API response structure for service types endpoint
 */
interface ServiceTypesResponse {
  resource: ServiceType[];
}

// =============================================================================
// QUERY KEYS AND CACHING CONFIGURATION
// =============================================================================

/**
 * Query keys for React Query caching and invalidation
 */
const QUERY_KEYS = {
  fileEntities: (params?: FileEntitiesParams) => 
    ['file-entities', params?.type || 'all', params?.includeInactive || false] as const,
  fileServices: ['file-services'] as const,
  serviceTypes: ['service-types'] as const,
} as const;

/**
 * Cache configuration constants per Section 4.7.1.2 migration requirements
 */
const CACHE_CONFIG = {
  /** Stale time: 300 seconds (5 minutes) - data considered fresh */
  staleTime: 5 * 60 * 1000,
  /** Cache time: 900 seconds (15 minutes) - data retained in cache */
  gcTime: 15 * 60 * 1000,
  /** Maximum retry attempts for failed requests */
  retry: 3,
  /** Retry delay with exponential backoff */
  retryDelay: (attemptIndex: number) => Math.min(1000 * 2 ** attemptIndex, 30000),
} as const;

// =============================================================================
// API FETCHING FUNCTIONS
// =============================================================================

/**
 * Fetch file services from DreamFactory backend
 * @param includeInactive - Whether to include inactive services
 * @returns Promise resolving to array of file services
 */
async function fetchFileServices(includeInactive: boolean = false): Promise<Service[]> {
  try {
    const queryParams = new URLSearchParams();
    if (includeInactive) {
      queryParams.append('include_inactive', 'true');
    }
    
    const url = `/system/service?${queryParams.toString()}`;
    const response = await apiClient.get<FileServicesResponse>(url);
    
    // Filter to only file-type services based on service type groups
    const fileServices = response.resource?.filter((service: Service) => {
      // File service types typically include: file, aws_s3, azure_blob, etc.
      const fileServiceTypes = [
        'file', 'local_file', 'aws_s3', 'azure_blob', 'azure_file',
        'aws_s3_glacier', 'rackspace_cloudfiles', 'openstack_object_storage',
        'google_cloud_storage', 'dropbox', 'ftp', 'sftp', 'webdav'
      ];
      return fileServiceTypes.includes(service.type);
    }) || [];
    
    return fileServices;
  } catch (error) {
    console.error('[useFileEntities] Failed to fetch file services:', error);
    throw new Error(`Failed to fetch file services: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Fetch service types from DreamFactory backend
 * @returns Promise resolving to array of service types
 */
async function fetchServiceTypes(): Promise<ServiceType[]> {
  try {
    const response = await apiClient.get<ServiceTypesResponse>('/system/service_type');
    
    // Filter to only file-related service types
    const fileServiceTypes = response.resource?.filter((serviceType: ServiceType) => {
      return serviceType.group === 'File' || serviceType.group === 'file';
    }) || [];
    
    return fileServiceTypes;
  } catch (error) {
    console.error('[useFileEntities] Failed to fetch service types:', error);
    throw new Error(`Failed to fetch service types: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Fetch complete file entities data combining services and service types
 * @param params - Query parameters for filtering and configuration
 * @returns Promise resolving to Files object
 */
async function fetchFileEntities(params: FileEntitiesParams = {}): Promise<Files> {
  try {
    // Fetch both services and service types in parallel for optimal performance
    const [services, serviceTypes] = await Promise.all([
      fetchFileServices(params.includeInactive),
      fetchServiceTypes(),
    ]);
    
    // Apply type filtering if specified
    let filteredServices = services;
    if (params.type) {
      filteredServices = services.filter((service: Service) => service.type === params.type);
    }
    
    return {
      services: filteredServices,
      serviceTypes,
    };
  } catch (error) {
    console.error('[useFileEntities] Failed to fetch file entities:', error);
    throw new Error(`Failed to fetch file entities: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

// =============================================================================
// MAIN HOOK IMPLEMENTATION
// =============================================================================

/**
 * File entities collection hook with React Query intelligent caching
 * 
 * Provides type-safe access to file entity collections with automatic background
 * revalidation and intelligent caching. Replaces Angular entitiesResolver with
 * modern React Query patterns for optimal performance and developer experience.
 * 
 * @param params - Optional parameters for filtering and configuration
 * @returns FileEntitiesResult with data, loading states, and control functions
 * 
 * @example
 * ```typescript
 * // Basic usage - fetch all file entities
 * const { data, services, serviceTypes, isLoading } = useFileEntities();
 * 
 * // Type-filtered usage - fetch only AWS S3 services
 * const { services: s3Services } = useFileEntities({ type: 'aws_s3' });
 * 
 * // Include inactive services
 * const { services: allServices } = useFileEntities({ includeInactive: true });
 * 
 * // Manual refresh
 * const { refresh } = useFileEntities();
 * await refresh();
 * ```
 */
export function useFileEntities(params: FileEntitiesParams = {}): FileEntitiesResult {
  const queryClient = useQueryClient();
  
  // Memoize query key to prevent unnecessary re-renders
  const queryKey = useMemo(() => QUERY_KEYS.fileEntities(params), [params]);
  
  // Main file entities query with intelligent caching
  const {
    data,
    isLoading,
    isError,
    error,
    isFetching,
    isStale,
    dataUpdatedAt,
  } = useQuery({
    queryKey,
    queryFn: () => fetchFileEntities(params),
    staleTime: CACHE_CONFIG.staleTime,
    gcTime: CACHE_CONFIG.gcTime,
    retry: CACHE_CONFIG.retry,
    retryDelay: CACHE_CONFIG.retryDelay,
    // Enable background refetching for real-time updates
    refetchOnWindowFocus: true,
    refetchOnReconnect: true,
    // Ensure data is considered stale and refetched appropriately
    refetchInterval: false, // Disable automatic polling to rely on stale-while-revalidate
    // Network mode configuration for proper offline handling
    networkMode: 'online',
  });
  
  // Manual refresh function for forced data updates
  const refresh = useCallback(async (): Promise<void> => {
    await queryClient.invalidateQueries({
      queryKey,
    });
  }, [queryClient, queryKey]);
  
  // Clear cache function for cleanup operations
  const clearCache = useCallback((): void => {
    queryClient.removeQueries({
      queryKey,
    });
  }, [queryClient, queryKey]);
  
  // Memoized derived data for performance optimization
  const derivedData = useMemo(() => {
    if (!data) {
      return {
        services: [],
        serviceTypes: [],
      };
    }
    
    return {
      services: data.services || [],
      serviceTypes: data.serviceTypes || [],
    };
  }, [data]);
  
  return {
    // Core data properties
    data,
    services: derivedData.services,
    serviceTypes: derivedData.serviceTypes,
    
    // Loading and error states
    isLoading,
    isError,
    error: error as Error | null,
    isFetching,
    isStale,
    dataUpdatedAt,
    
    // Control functions
    refresh,
    clearCache,
  };
}

// =============================================================================
// UTILITY FUNCTIONS AND HELPERS
// =============================================================================

/**
 * Prefetch file entities data for performance optimization
 * 
 * Useful for preloading data before navigation or user interactions.
 * Should be called from components that know file entities will be needed soon.
 * 
 * @param queryClient - React Query client instance
 * @param params - Optional parameters for the prefetch operation
 * @returns Promise that resolves when prefetch is complete
 */
export async function prefetchFileEntities(
  queryClient: ReturnType<typeof useQueryClient>,
  params: FileEntitiesParams = {}
): Promise<void> {
  const queryKey = QUERY_KEYS.fileEntities(params);
  
  await queryClient.prefetchQuery({
    queryKey,
    queryFn: () => fetchFileEntities(params),
    staleTime: CACHE_CONFIG.staleTime,
  });
}

/**
 * Get cached file entities data without triggering a fetch
 * 
 * Useful for accessing already-loaded data in components that don't need
 * to trigger loading states.
 * 
 * @param queryClient - React Query client instance
 * @param params - Optional parameters matching the original query
 * @returns Cached Files data or undefined if not in cache
 */
export function getCachedFileEntities(
  queryClient: ReturnType<typeof useQueryClient>,
  params: FileEntitiesParams = {}
): Files | undefined {
  const queryKey = QUERY_KEYS.fileEntities(params);
  return queryClient.getQueryData<Files>(queryKey);
}

/**
 * Invalidate all file entities queries
 * 
 * Useful for clearing all file-related cache when global changes occur
 * (e.g., service configuration updates, user permissions changes).
 * 
 * @param queryClient - React Query client instance
 * @returns Promise that resolves when invalidation is complete
 */
export async function invalidateAllFileEntities(
  queryClient: ReturnType<typeof useQueryClient>
): Promise<void> {
  await queryClient.invalidateQueries({
    queryKey: ['file-entities'],
  });
}

// Export types for use throughout the application
export type {
  FileEntitiesParams,
  FileEntitiesResult,
  Files,
  Service,
  ServiceType,
};