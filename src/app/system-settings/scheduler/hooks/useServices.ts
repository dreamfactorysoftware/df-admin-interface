/**
 * Services Hook for Scheduler Configuration
 * 
 * React Query hook that fetches available services for scheduler configuration dropdowns,
 * replacing Angular ActivatedRoute data subscription patterns. Implements intelligent
 * caching for service list data with background synchronization and provides filtered
 * service options for scheduler task configuration workflows.
 * 
 * This hook replaces the Angular pattern of using ActivatedRoute.data.resource to fetch
 * services and transforms it to React Query with optimized caching and background updates.
 * 
 * @fileoverview Scheduler services data fetching hook with React Query
 * @version 1.0.0
 * @since React 19.0.0 / Next.js 15.1+
 */

import { useQuery, UseQueryResult } from '@tanstack/react-query';
import { useMemo } from 'react';
import { apiClient } from '@/lib/api-client';
import type { DatabaseService } from '@/components/database-service/types';
import type { GenericListResponse, ApiErrorResponse } from '@/types/generic-http';

// =============================================================================
// TYPES AND INTERFACES
// =============================================================================

/**
 * Service dropdown option interface for scheduler configuration
 * Simplified structure optimized for dropdown components
 */
export interface ServiceDropdownOption {
  id: number;
  name: string;
  label: string;
  type: string;
  description?: string;
  is_active: boolean;
}

/**
 * Services query filter options
 */
export interface ServicesFilter {
  /** Search term to filter services by name or label */
  search?: string;
  /** Filter by service types */
  types?: string[];
  /** Include only active services */
  activeOnly?: boolean;
  /** Include specific service statuses */
  statuses?: string[];
}

/**
 * Hook return interface with comprehensive service data and utilities
 */
export interface UseServicesReturn {
  /** Array of all services */
  services: DatabaseService[];
  /** Filtered service options for dropdown consumption */
  serviceOptions: ServiceDropdownOption[];
  /** Loading state indicator */
  isLoading: boolean;
  /** Error state if service fetching fails */
  error: ApiErrorResponse | null;
  /** Manual refetch function */
  refetch: () => void;
  /** Background fetching indicator */
  isFetching: boolean;
  /** Success state indicator */
  isSuccess: boolean;
  /** Error state indicator */
  isError: boolean;
}

/**
 * Hook configuration options
 */
export interface UseServicesOptions {
  /** Custom filter options */
  filter?: ServicesFilter;
  /** Enable/disable automatic refetching */
  enabled?: boolean;
  /** Custom stale time override (default: 600 seconds) */
  staleTime?: number;
  /** Custom refetch interval override */
  refetchInterval?: number;
}

// =============================================================================
// QUERY CONFIGURATION
// =============================================================================

/**
 * React Query key factory for services
 */
export const servicesQueryKeys = {
  all: ['scheduler-services'] as const,
  lists: () => [...servicesQueryKeys.all, 'list'] as const,
  list: (filter?: ServicesFilter) => [...servicesQueryKeys.lists(), filter] as const,
} as const;

/**
 * Default query configuration optimized for service data
 * Per React/Next.js Integration Requirements and Section 4.3.2
 */
const DEFAULT_QUERY_CONFIG = {
  staleTime: 600_000, // 10 minutes - services are relatively static per requirements
  cacheTime: 1_800_000, // 30 minutes - extended cache for better UX
  refetchOnWindowFocus: true, // Background synchronization per Section 4.3.2
  refetchOnReconnect: true, // Ensure fresh data after network recovery
  refetchOnMount: false, // Use cached data if available and fresh
  retry: 3, // Comprehensive retry strategy per Section 4.2
  retryDelay: (attemptIndex: number) => Math.min(1000 * 2 ** attemptIndex, 30000), // Exponential backoff
} as const;

// =============================================================================
// SERVICES FETCHER FUNCTION
// =============================================================================

/**
 * Fetches services from the DreamFactory API
 * Implements proper error handling and response transformation
 */
async function fetchServices(): Promise<DatabaseService[]> {
  try {
    const response = await apiClient.get<GenericListResponse<DatabaseService>>('/system/service');
    
    // Handle both resource and data response formats from DreamFactory API
    const services = response.resource || response.data || [];
    
    if (!Array.isArray(services)) {
      throw new Error('Invalid services response format: expected array');
    }

    return services;
  } catch (error) {
    // Enhanced error handling with specific error types
    if (error instanceof Error) {
      throw {
        error: {
          code: 500,
          message: error.message || 'Failed to fetch services',
          context: 'services-fetch',
        }
      } as ApiErrorResponse;
    }
    
    throw {
      error: {
        code: 500,
        message: 'Unknown error occurred while fetching services',
        context: 'services-fetch-unknown',
      }
    } as ApiErrorResponse;
  }
}

// =============================================================================
// UTILITY FUNCTIONS
// =============================================================================

/**
 * Transforms services to dropdown options with filtering
 * Optimizes data structure for dropdown component consumption
 */
function transformToDropdownOptions(
  services: DatabaseService[],
  filter?: ServicesFilter
): ServiceDropdownOption[] {
  if (!services || !Array.isArray(services)) {
    return [];
  }

  let filteredServices = [...services];

  // Apply filters
  if (filter) {
    const { search, types, activeOnly, statuses } = filter;

    // Search filter - case insensitive search across name, label, and description
    if (search && search.trim()) {
      const searchTerm = search.toLowerCase().trim();
      filteredServices = filteredServices.filter(service => 
        service.name?.toLowerCase().includes(searchTerm) ||
        service.label?.toLowerCase().includes(searchTerm) ||
        service.description?.toLowerCase().includes(searchTerm)
      );
    }

    // Type filter
    if (types && types.length > 0) {
      filteredServices = filteredServices.filter(service => 
        types.includes(service.type)
      );
    }

    // Active only filter
    if (activeOnly) {
      filteredServices = filteredServices.filter(service => service.is_active);
    }

    // Status filter (if using extended status property)
    if (statuses && statuses.length > 0) {
      filteredServices = filteredServices.filter(service => 
        service.status && statuses.includes(service.status)
      );
    }
  }

  // Transform to dropdown options
  return filteredServices.map(service => ({
    id: service.id,
    name: service.name,
    label: service.label || service.name,
    type: service.type,
    description: service.description,
    is_active: service.is_active,
  }));
}

// =============================================================================
// MAIN HOOK IMPLEMENTATION
// =============================================================================

/**
 * Services hook for scheduler configuration dropdowns
 * 
 * Replaces Angular ActivatedRoute data subscription patterns with React Query
 * intelligent caching and background synchronization. Provides filtered service
 * options optimized for dropdown consumption in scheduler task configuration.
 * 
 * Features:
 * - Intelligent caching with 600-second staleTime per requirements
 * - Background refetching for service list synchronization
 * - Search and filter capabilities for large service lists
 * - Retry logic with exponential backoff
 * - TypeScript type safety matching existing Service interface
 * 
 * @param options Hook configuration options
 * @returns Comprehensive service data and utilities
 * 
 * @example
 * ```tsx
 * // Basic usage for dropdown
 * const { serviceOptions, isLoading, error } = useServices();
 * 
 * // With filtering for specific types
 * const { serviceOptions } = useServices({
 *   filter: { types: ['mysql', 'pgsql'], activeOnly: true }
 * });
 * 
 * // With search functionality
 * const [search, setSearch] = useState('');
 * const { serviceOptions } = useServices({
 *   filter: { search }
 * });
 * ```
 */
export function useServices(options: UseServicesOptions = {}): UseServicesReturn {
  const {
    filter,
    enabled = true,
    staleTime = DEFAULT_QUERY_CONFIG.staleTime,
    refetchInterval,
  } = options;

  // React Query hook for service data fetching
  const queryResult: UseQueryResult<DatabaseService[], ApiErrorResponse> = useQuery({
    queryKey: servicesQueryKeys.list(filter),
    queryFn: fetchServices,
    enabled,
    staleTime,
    cacheTime: DEFAULT_QUERY_CONFIG.cacheTime,
    refetchOnWindowFocus: DEFAULT_QUERY_CONFIG.refetchOnWindowFocus,
    refetchOnReconnect: DEFAULT_QUERY_CONFIG.refetchOnReconnect,
    refetchOnMount: DEFAULT_QUERY_CONFIG.refetchOnMount,
    retry: DEFAULT_QUERY_CONFIG.retry,
    retryDelay: DEFAULT_QUERY_CONFIG.retryDelay,
    refetchInterval,
    // Background refetching configuration per Section 4.3.2
    refetchIntervalInBackground: true,
    // Ensure stale data is served while refetching in background
    keepPreviousData: true,
    // Error handling configuration
    useErrorBoundary: false, // Handle errors in component, not boundary
    // Suspense configuration for future enhancement
    suspense: false,
  });

  // Extract query result properties
  const {
    data: services = [],
    isLoading,
    error,
    refetch,
    isFetching,
    isSuccess,
    isError,
  } = queryResult;

  // Memoized service options transformation
  // Recalculates only when services or filter changes
  const serviceOptions = useMemo(() => {
    return transformToDropdownOptions(services, filter);
  }, [services, filter]);

  // Return comprehensive hook interface
  return {
    services,
    serviceOptions,
    isLoading,
    error,
    refetch,
    isFetching,
    isSuccess,
    isError,
  };
}

// =============================================================================
// HOOK VARIANTS AND UTILITIES
// =============================================================================

/**
 * Simplified hook variant for basic dropdown usage
 * Pre-configured with common filtering options
 * 
 * @param search Optional search term
 * @param activeOnly Filter to only active services (default: true)
 * @returns Simplified return interface for dropdown consumption
 */
export function useServicesDropdown(
  search?: string,
  activeOnly: boolean = true
) {
  const { serviceOptions, isLoading, error } = useServices({
    filter: {
      search,
      activeOnly,
    },
  });

  return {
    options: serviceOptions,
    loading: isLoading,
    error,
  };
}

/**
 * Hook variant for specific service types
 * Optimized for scheduler tasks that work with specific database types
 * 
 * @param types Array of service types to include
 * @param search Optional search term
 * @returns Filtered service options for specific types
 */
export function useServicesByType(
  types: string[],
  search?: string
) {
  const { serviceOptions, isLoading, error, refetch } = useServices({
    filter: {
      types,
      search,
      activeOnly: true,
    },
  });

  return {
    services: serviceOptions,
    isLoading,
    error,
    refetch,
  };
}

// =============================================================================
// EXPORTS
// =============================================================================

// Export main hook as default
export default useServices;

// Export types for external usage
export type {
  ServiceDropdownOption,
  ServicesFilter,
  UseServicesReturn,
  UseServicesOptions,
};

// Export query keys for cache management
export { servicesQueryKeys };