/**
 * Storage Services Hook
 * 
 * Custom React hook for fetching available storage services using TanStack React Query.
 * Implements intelligent caching for storage service metadata with group-based filtering
 * (source control and file services). Provides the same functionality as the Angular
 * component's baseService.getAll() call with enhanced caching and background revalidation.
 * 
 * Migrates Angular baseService.getAll() call to React Query-powered custom hook per 
 * Section 0.2.1 transformation requirements. Supports group parameter filtering for
 * 'source control,file' services matching original component behavior.
 * 
 * @fileoverview Storage services data fetching hook with React Query integration
 * @version 1.0.0
 * @since React 19.0.0, Next.js 15.1+, TypeScript 5.8+
 */

import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import { GenericListResponse } from '@/types/api';
import { DatabaseService, ServiceType } from '@/types/database-service';
import { useAuth } from '@/hooks/useAuth';

// ============================================================================
// CONSTANTS AND CONFIGURATION
// ============================================================================

/**
 * Query keys for storage services data
 * Follows React Query key management patterns for effective cache invalidation
 */
export const STORAGE_SERVICES_QUERY_KEYS = {
  /**
   * Base key for all storage services queries
   */
  all: ['storage-services'] as const,
  
  /**
   * Key for services filtered by group
   * @param group - Group filter parameter ('source control,file')
   */
  byGroup: (group: string) => [...STORAGE_SERVICES_QUERY_KEYS.all, 'group', group] as const,
  
  /**
   * Key for service types data
   */
  types: () => [...STORAGE_SERVICES_QUERY_KEYS.all, 'types'] as const,
} as const;

/**
 * Default group parameter for storage services filtering
 * Matches original component behavior for source control and file services
 */
const DEFAULT_STORAGE_GROUP = 'source control,file' as const;

/**
 * Cache configuration aligned with Section 3.2.4 data fetching requirements
 * Intelligent caching with 5-15 minute stale time and background revalidation
 */
const CACHE_CONFIG = {
  /**
   * Stale time: 10 minutes (middle of 5-15 minute range)
   * Data remains fresh for 10 minutes before background refetch
   */
  staleTime: 10 * 60 * 1000, // 10 minutes
  
  /**
   * Cache time: 15 minutes
   * Data stays in cache for 15 minutes after last usage
   */
  cacheTime: 15 * 60 * 1000, // 15 minutes
  
  /**
   * Background refetch configuration for storage service metadata synchronization
   */
  refetchOnWindowFocus: false, // Prevent excessive refetching on focus
  refetchOnReconnect: true,    // Refetch when network reconnects
  refetchInterval: 5 * 60 * 1000, // Background refetch every 5 minutes
  
  /**
   * Retry configuration aligned with Section 4.4.5.2 network error recovery patterns
   */
  retry: 3,                    // Retry failed requests 3 times
  retryDelay: (attemptIndex: number) => Math.min(1000 * 2 ** attemptIndex, 30000), // Exponential backoff, max 30s
} as const;

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

/**
 * Storage services query configuration options
 */
export interface UseStorageServicesOptions {
  /**
   * Group filter parameter for services
   * @default 'source control,file'
   */
  group?: string;
  
  /**
   * Enable or disable the query
   * @default true
   */
  enabled?: boolean;
  
  /**
   * Override default stale time in milliseconds
   */
  staleTime?: number;
  
  /**
   * Override default cache time in milliseconds
   */
  cacheTime?: number;
  
  /**
   * Override default retry configuration
   */
  retry?: number | boolean;
  
  /**
   * Callback for successful data fetch
   */
  onSuccess?: (data: DatabaseService[]) => void;
  
  /**
   * Callback for fetch errors
   */
  onError?: (error: Error) => void;
}

/**
 * Storage services hook return type with comprehensive functionality
 */
export interface UseStorageServicesReturn {
  /**
   * Array of storage services from the API response
   */
  services: DatabaseService[] | undefined;
  
  /**
   * Raw API response data including metadata
   */
  data: GenericListResponse<DatabaseService> | undefined;
  
  /**
   * Loading state for the query
   */
  isLoading: boolean;
  
  /**
   * Error state with proper error typing
   */
  error: Error | null;
  
  /**
   * Whether the query is currently fetching (including background fetches)
   */
  isFetching: boolean;
  
  /**
   * Whether the data is stale and being refetched in the background
   */
  isRefetching: boolean;
  
  /**
   * Whether the query has been fetched successfully at least once
   */
  isSuccess: boolean;
  
  /**
   * Whether the query is in an error state
   */
  isError: boolean;
  
  /**
   * Manual refetch function for triggering data refresh
   */
  refetch: () => Promise<any>;
  
  /**
   * Remove the query from cache
   */
  remove: () => void;
}

/**
 * Service types query return type for parallel fetching support
 */
export interface UseServiceTypesReturn {
  /**
   * Array of service types
   */
  serviceTypes: ServiceType[] | undefined;
  
  /**
   * Raw service types response data
   */
  data: GenericListResponse<ServiceType> | undefined;
  
  /**
   * Loading state for service types query
   */
  isLoading: boolean;
  
  /**
   * Error state for service types query
   */
  error: Error | null;
  
  /**
   * Manual refetch function for service types
   */
  refetch: () => Promise<any>;
}

// ============================================================================
// API FUNCTIONS
// ============================================================================

/**
 * Fetch storage services from the API with group filtering
 * Implements the same functionality as Angular baseService.getAll() with enhanced error handling
 * 
 * @param group - Group parameter for filtering services ('source control,file')
 * @returns Promise resolving to GenericListResponse<DatabaseService>
 */
async function fetchStorageServices(group: string = DEFAULT_STORAGE_GROUP): Promise<GenericListResponse<DatabaseService>> {
  try {
    // Build API endpoint with group parameter
    const endpoint = '/system/service';
    const params = new URLSearchParams({ group });
    const url = `${endpoint}?${params.toString()}`;
    
    // Make API request using the centralized API client
    const response = await apiClient.get<GenericListResponse<DatabaseService>>(url, {
      // Enhanced retry configuration for storage services
      retries: CACHE_CONFIG.retry,
      timeout: 30000, // 30 second timeout for service discovery
    });
    
    // Handle different response formats from DreamFactory API
    if (response.resource) {
      // Standard GenericListResponse format
      return {
        resource: response.resource,
        meta: response.meta || { count: response.resource.length }
      };
    }
    
    if (response.data) {
      // Alternative response format - extract and normalize
      const services = Array.isArray(response.data) ? response.data : [response.data];
      return {
        resource: services,
        meta: { count: services.length }
      };
    }
    
    // Fallback for unexpected response formats
    throw new Error('Invalid response format: Expected services array');
    
  } catch (error) {
    // Enhanced error handling with context
    const errorMessage = error instanceof Error 
      ? error.message 
      : 'Failed to fetch storage services';
    
    throw new Error(`Storage services fetch failed: ${errorMessage}`);
  }
}

/**
 * Fetch service types for parallel fetching support
 * 
 * @returns Promise resolving to GenericListResponse<ServiceType>
 */
async function fetchServiceTypes(): Promise<GenericListResponse<ServiceType>> {
  try {
    const response = await apiClient.get<GenericListResponse<ServiceType>>('/system/service_type', {
      retries: CACHE_CONFIG.retry,
      timeout: 15000, // 15 second timeout for service types
    });
    
    // Normalize response format
    if (response.resource) {
      return {
        resource: response.resource,
        meta: response.meta || { count: response.resource.length }
      };
    }
    
    if (response.data) {
      const types = Array.isArray(response.data) ? response.data : [response.data];
      return {
        resource: types,
        meta: { count: types.length }
      };
    }
    
    throw new Error('Invalid service types response format');
    
  } catch (error) {
    const errorMessage = error instanceof Error 
      ? error.message 
      : 'Failed to fetch service types';
    
    throw new Error(`Service types fetch failed: ${errorMessage}`);
  }
}

// ============================================================================
// CUSTOM HOOKS
// ============================================================================

/**
 * Custom React hook for fetching storage services with intelligent caching
 * 
 * Migrates Angular baseService.getAll() functionality to React Query with enhanced
 * caching strategies, background revalidation, and comprehensive error handling.
 * 
 * Features:
 * - TanStack React Query 5.79.2 integration per Section 3.2.2 state management
 * - Group parameter filtering for 'source control,file' services
 * - Intelligent caching with 5-15 minute stale time configuration
 * - Automatic background revalidation for storage service metadata synchronization
 * - Error handling with retry strategies per Section 4.4.5.2 network error recovery
 * - TypeScript generic support for GenericListResponse<Service> with strict type safety
 * 
 * @param options - Configuration options for the hook
 * @returns Hook return object with services data and query state
 * 
 * @example
 * ```typescript
 * // Basic usage with default group filtering
 * const { services, isLoading, error } = useStorageServices();
 * 
 * // Custom group filtering
 * const { services, isLoading, error } = useStorageServices({
 *   group: 'source control',
 *   onSuccess: (services) => console.log('Loaded services:', services.length),
 *   onError: (error) => console.error('Failed to load services:', error)
 * });
 * 
 * // Conditional fetching
 * const { services, isLoading, error } = useStorageServices({
 *   enabled: user?.hasStorageAccess
 * });
 * ```
 */
export function useStorageServices(options: UseStorageServicesOptions = {}): UseStorageServicesReturn {
  const {
    group = DEFAULT_STORAGE_GROUP,
    enabled = true,
    staleTime = CACHE_CONFIG.staleTime,
    cacheTime = CACHE_CONFIG.cacheTime,
    retry = CACHE_CONFIG.retry,
    onSuccess,
    onError,
  } = options;
  
  // Get authentication state to ensure authenticated requests
  const { isAuthenticated } = useAuth();
  
  // TanStack React Query for storage services data fetching
  const query = useQuery({
    // Query key management for effective cache invalidation
    queryKey: STORAGE_SERVICES_QUERY_KEYS.byGroup(group),
    
    // Query function with group parameter filtering
    queryFn: () => fetchStorageServices(group),
    
    // Enable query only when authenticated and enabled option is true
    enabled: enabled && isAuthenticated,
    
    // Cache configuration with intelligent caching strategy
    staleTime,
    cacheTime,
    
    // Background revalidation configuration
    refetchOnWindowFocus: CACHE_CONFIG.refetchOnWindowFocus,
    refetchOnReconnect: CACHE_CONFIG.refetchOnReconnect,
    refetchInterval: CACHE_CONFIG.refetchInterval,
    
    // Error handling and retry strategies
    retry,
    retryDelay: CACHE_CONFIG.retryDelay,
    
    // Success callback
    onSuccess: (data) => {
      if (onSuccess && data.resource) {
        onSuccess(data.resource);
      }
    },
    
    // Error callback with enhanced error context
    onError: (error) => {
      if (onError) {
        onError(error as Error);
      }
      
      // Log error for debugging in development
      if (process.env.NODE_ENV === 'development') {
        console.error('Storage services fetch error:', {
          error,
          group,
          authenticated: isAuthenticated,
          timestamp: new Date().toISOString(),
        });
      }
    },
    
    // Select function to extract services array from response
    select: (data) => data,
  });
  
  // Return comprehensive hook interface
  return {
    // Extract services array from GenericListResponse<Service> format
    services: query.data?.resource,
    
    // Raw API response data including metadata
    data: query.data,
    
    // Query state properties
    isLoading: query.isLoading,
    error: query.error as Error | null,
    isFetching: query.isFetching,
    isRefetching: query.isRefetching,
    isSuccess: query.isSuccess,
    isError: query.isError,
    
    // Query control functions
    refetch: query.refetch,
    remove: query.remove,
  };
}

/**
 * Custom React hook for fetching service types with parallel fetching support
 * 
 * Provides service type metadata for storage services with the same caching
 * and error handling patterns as useStorageServices.
 * 
 * @param options - Configuration options for the hook
 * @returns Hook return object with service types data and query state
 * 
 * @example
 * ```typescript
 * // Fetch service types in parallel with storage services
 * const { services } = useStorageServices();
 * const { serviceTypes } = useServiceTypes();
 * 
 * // Use together for complete storage service metadata
 * const storageMetadata = useMemo(() => ({
 *   services: services || [],
 *   types: serviceTypes || [],
 * }), [services, serviceTypes]);
 * ```
 */
export function useServiceTypes(options: UseStorageServicesOptions = {}): UseServiceTypesReturn {
  const {
    enabled = true,
    staleTime = CACHE_CONFIG.staleTime,
    cacheTime = CACHE_CONFIG.cacheTime,
    retry = CACHE_CONFIG.retry,
    onSuccess,
    onError,
  } = options;
  
  // Get authentication state
  const { isAuthenticated } = useAuth();
  
  // TanStack React Query for service types data fetching
  const query = useQuery({
    // Query key for service types
    queryKey: STORAGE_SERVICES_QUERY_KEYS.types(),
    
    // Query function for service types
    queryFn: fetchServiceTypes,
    
    // Enable query only when authenticated and enabled
    enabled: enabled && isAuthenticated,
    
    // Cache configuration matching storage services
    staleTime,
    cacheTime,
    
    // Background revalidation
    refetchOnWindowFocus: CACHE_CONFIG.refetchOnWindowFocus,
    refetchOnReconnect: CACHE_CONFIG.refetchOnReconnect,
    refetchInterval: CACHE_CONFIG.refetchInterval,
    
    // Error handling
    retry,
    retryDelay: CACHE_CONFIG.retryDelay,
    
    // Callbacks
    onSuccess: (data) => {
      if (onSuccess && data.resource) {
        onSuccess(data.resource as any); // Type assertion for callback compatibility
      }
    },
    
    onError: (error) => {
      if (onError) {
        onError(error as Error);
      }
    },
  });
  
  return {
    serviceTypes: query.data?.resource,
    data: query.data,
    isLoading: query.isLoading,
    error: query.error as Error | null,
    refetch: query.refetch,
  };
}

/**
 * Combined hook for parallel fetching of services and serviceTypes data
 * 
 * Provides concurrent fetching capabilities as mentioned in the requirements
 * for "parallel fetching of services and serviceTypes data with React Query
 * concurrent features".
 * 
 * @param options - Configuration options for both queries
 * @returns Combined hook return object with both services and types data
 * 
 * @example
 * ```typescript
 * // Fetch both services and types in parallel
 * const {
 *   services,
 *   serviceTypes,
 *   isLoading,
 *   error,
 *   refetchAll
 * } = useStorageServicesWithTypes({
 *   group: 'source control,file'
 * });
 * 
 * // All data loaded when both queries complete
 * if (!isLoading && services && serviceTypes) {
 *   // Render complete storage service interface
 * }
 * ```
 */
export function useStorageServicesWithTypes(options: UseStorageServicesOptions = {}) {
  const servicesQuery = useStorageServices(options);
  const typesQuery = useServiceTypes(options);
  
  return {
    // Services data
    services: servicesQuery.services,
    servicesData: servicesQuery.data,
    
    // Service types data
    serviceTypes: typesQuery.serviceTypes,
    serviceTypesData: typesQuery.data,
    
    // Combined loading state (true if either query is loading)
    isLoading: servicesQuery.isLoading || typesQuery.isLoading,
    
    // Combined error state (returns first error encountered)
    error: servicesQuery.error || typesQuery.error,
    
    // Combined fetching state
    isFetching: servicesQuery.isFetching || typesQuery.isFetching,
    
    // Combined success state (true only when both queries succeed)
    isSuccess: servicesQuery.isSuccess && typesQuery.isSuccess,
    
    // Combined error state (true if either query has error)
    isError: servicesQuery.isError || typesQuery.isError,
    
    // Refetch both queries
    refetchAll: async () => {
      const [servicesResult, typesResult] = await Promise.allSettled([
        servicesQuery.refetch(),
        typesQuery.refetch(),
      ]);
      
      return {
        services: servicesResult,
        types: typesResult,
      };
    },
    
    // Individual refetch functions
    refetchServices: servicesQuery.refetch,
    refetchTypes: typesQuery.refetch,
    
    // Remove functions
    removeServices: servicesQuery.remove,
    removeTypes: typesQuery.remove,
  };
}

// ============================================================================
// QUERY KEY UTILITIES
// ============================================================================

/**
 * Utility function to invalidate storage services cache
 * 
 * @param queryClient - TanStack Query client instance
 * @param group - Optional group filter to invalidate specific cache entries
 */
export function invalidateStorageServices(queryClient: any, group?: string) {
  if (group) {
    // Invalidate specific group cache
    queryClient.invalidateQueries({
      queryKey: STORAGE_SERVICES_QUERY_KEYS.byGroup(group),
    });
  } else {
    // Invalidate all storage services cache
    queryClient.invalidateQueries({
      queryKey: STORAGE_SERVICES_QUERY_KEYS.all,
    });
  }
}

/**
 * Utility function to prefetch storage services
 * 
 * @param queryClient - TanStack Query client instance
 * @param group - Group filter for prefetching
 */
export async function prefetchStorageServices(queryClient: any, group: string = DEFAULT_STORAGE_GROUP) {
  await queryClient.prefetchQuery({
    queryKey: STORAGE_SERVICES_QUERY_KEYS.byGroup(group),
    queryFn: () => fetchStorageServices(group),
    staleTime: CACHE_CONFIG.staleTime,
  });
}

// ============================================================================
// EXPORTS
// ============================================================================

// Export query keys for external cache management
export { STORAGE_SERVICES_QUERY_KEYS, DEFAULT_STORAGE_GROUP, CACHE_CONFIG };

// Export types for consumers
export type {
  UseStorageServicesOptions,
  UseStorageServicesReturn,
  UseServiceTypesReturn,
};