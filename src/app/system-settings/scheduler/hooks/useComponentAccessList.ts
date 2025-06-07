/**
 * @fileoverview React Query hook for component access list fetching
 * @description Replaces Angular accessListService patterns with modern React Query implementation
 * 
 * This hook provides conditional fetching of component access lists based on selected service,
 * implementing intelligent caching and automatic refetching when service changes.
 * Supports scheduler task configuration workflows with comprehensive error handling.
 * 
 * @version 1.0.0
 * @since React 19.0.0 / Next.js 15.1+
 * 
 * Features:
 * - React Query useQuery for component access list fetching per Section 4.3.2
 * - Conditional fetching enabled only when valid service ID is provided
 * - Intelligent caching with staleTime: 300 seconds per React/Next.js Integration Requirements
 * - Automatic refetching when service dependency changes per dependency management
 * - Comprehensive error handling for access denied and service not found scenarios
 * - TypeScript type safety matching GenericListResponse<string> from Angular implementation
 */

import { useQuery } from '@tanstack/react-query'
import { apiClient } from '@/lib/api-client'
import type { GenericListResponse } from '@/types/generic-http'
import type { Service } from '@/types/services'

// =============================================================================
// TYPES AND INTERFACES
// =============================================================================

/**
 * Component access list hook parameters
 */
export interface UseComponentAccessListParams {
  /** Service ID to fetch component access list for */
  serviceId?: number | string | null
  /** Available services list for service name resolution */
  services: Service[]
  /** Optional additional request configuration */
  options?: {
    /** Override default stale time (default: 300 seconds) */
    staleTime?: number
    /** Enable/disable background refetching (default: true) */
    refetchOnWindowFocus?: boolean
    /** Enable/disable automatic retries (default: true) */
    retry?: boolean | number
  }
}

/**
 * Component access list hook return type
 */
export interface UseComponentAccessListReturn {
  /** Component access list data */
  data: string[] | undefined
  /** Loading state */
  isLoading: boolean
  /** Error state */
  error: Error | null
  /** Refetch function */
  refetch: () => void
  /** Query invalidation function */
  invalidate: () => void
  /** Whether the query is currently fetching */
  isFetching: boolean
  /** Whether the query is stale */
  isStale: boolean
}

/**
 * Error types for component access list operations
 */
export class ComponentAccessListError extends Error {
  constructor(
    message: string,
    public code: 'SERVICE_NOT_FOUND' | 'ACCESS_DENIED' | 'NETWORK_ERROR' | 'UNKNOWN_ERROR',
    public serviceId?: number | string
  ) {
    super(message)
    this.name = 'ComponentAccessListError'
  }
}

// =============================================================================
// HOOK IMPLEMENTATION
// =============================================================================

/**
 * React Query hook for fetching component access lists based on selected service
 * 
 * Replaces Angular accessListService.get() subscription patterns with modern React Query
 * implementation. Provides conditional fetching, intelligent caching, and automatic
 * refetching when service selection changes.
 * 
 * @param params Hook parameters including serviceId and services list
 * @returns Hook return object with data, loading, error states and utility functions
 * 
 * @example
 * ```typescript
 * const { data: componentOptions, isLoading, error } = useComponentAccessList({
 *   serviceId: selectedServiceId,
 *   services: userServicesDropdownOptions
 * })
 * 
 * // Use in form select
 * <select>
 *   {componentOptions?.map(component => (
 *     <option key={component} value={component}>{component}</option>
 *   ))}
 * </select>
 * ```
 */
export function useComponentAccessList(
  params: UseComponentAccessListParams
): UseComponentAccessListReturn {
  const { serviceId, services, options = {} } = params
  
  // Extract options with defaults
  const {
    staleTime = 300 * 1000, // 300 seconds as per Section 5.2
    refetchOnWindowFocus = true,
    retry = true
  } = options

  // Find the selected service from the services list
  const selectedService = serviceId 
    ? services.find(service => service.id === Number(serviceId))
    : undefined

  // Query key for React Query cache management
  const queryKey = ['componentAccessList', serviceId, selectedService?.name]

  // React Query implementation
  const query = useQuery({
    queryKey,
    queryFn: async (): Promise<string[]> => {
      // Validate service selection
      if (!serviceId) {
        throw new ComponentAccessListError(
          'Service ID is required to fetch component access list',
          'SERVICE_NOT_FOUND'
        )
      }

      if (!selectedService) {
        throw new ComponentAccessListError(
          `Service with ID ${serviceId} not found in available services`,
          'SERVICE_NOT_FOUND',
          serviceId
        )
      }

      try {
        // Call DreamFactory API with service name and as_access_list parameter
        // Replicates Angular: this.accessListService.get<GenericListResponse<string>>(service.name, { additionalParams: [{ key: 'as_access_list', value: true }] })
        const endpoint = `${selectedService.name}?as_access_list=true`
        const response = await apiClient.get<GenericListResponse<string>>(endpoint)

        // Handle API response structure
        if (response.resource) {
          return response.resource
        } else if (response.data && Array.isArray(response.data)) {
          return response.data
        } else {
          throw new ComponentAccessListError(
            'Invalid response format from component access list API',
            'UNKNOWN_ERROR',
            serviceId
          )
        }
      } catch (error: any) {
        // Enhanced error handling for specific scenarios per Section 4.2
        if (error instanceof ComponentAccessListError) {
          throw error
        }

        // Map HTTP errors to specific error types
        if (error.message?.includes('403') || error.message?.includes('Forbidden')) {
          throw new ComponentAccessListError(
            `Access denied to service '${selectedService.name}'. Please check your permissions.`,
            'ACCESS_DENIED',
            serviceId
          )
        }

        if (error.message?.includes('404') || error.message?.includes('Not Found')) {
          throw new ComponentAccessListError(
            `Service '${selectedService.name}' not found or not accessible.`,
            'SERVICE_NOT_FOUND',
            serviceId
          )
        }

        if (error.message?.includes('fetch') || error.message?.includes('network')) {
          throw new ComponentAccessListError(
            'Network error occurred while fetching component access list. Please try again.',
            'NETWORK_ERROR',
            serviceId
          )
        }

        // Generic error fallback
        throw new ComponentAccessListError(
          `Failed to fetch component access list for service '${selectedService.name}': ${error.message}`,
          'UNKNOWN_ERROR',
          serviceId
        )
      }
    },
    // Conditional fetching - only enabled when valid service ID is provided per React Query patterns
    enabled: Boolean(serviceId && selectedService),
    // Intelligent caching configuration per Section 5.2
    staleTime,
    // Cache time for inactive queries (15 minutes)
    gcTime: 15 * 60 * 1000,
    // Background refetching configuration
    refetchOnWindowFocus,
    // Retry configuration with exponential backoff
    retry: typeof retry === 'boolean' ? (retry ? 3 : false) : retry,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
    // React Query error handling
    throwOnError: false,
    // Refetch interval for real-time updates (disabled by default)
    refetchInterval: false,
    // Refetch on mount if data is stale
    refetchOnMount: 'stale'
  })

  // Utility function to invalidate the query
  const invalidate = async () => {
    const queryClient = query.queryClient
    if (queryClient) {
      await queryClient.invalidateQueries({ queryKey })
    }
  }

  // Return normalized interface matching React patterns
  return {
    data: query.data,
    isLoading: query.isLoading,
    error: query.error as Error | null,
    refetch: query.refetch,
    invalidate,
    isFetching: query.isFetching,
    isStale: query.isStale
  }
}

// =============================================================================
// UTILITY FUNCTIONS
// =============================================================================

/**
 * Helper function to create component access list query key
 * Useful for manual cache manipulation or invalidation
 */
export function createComponentAccessListQueryKey(
  serviceId?: number | string | null,
  serviceName?: string
): string[] {
  return ['componentAccessList', serviceId, serviceName]
}

/**
 * Helper function to validate service ID parameter
 */
export function isValidServiceId(serviceId: unknown): serviceId is number | string {
  return (typeof serviceId === 'number' && serviceId > 0) || 
         (typeof serviceId === 'string' && serviceId.trim() !== '' && !isNaN(Number(serviceId)))
}

/**
 * Default export for convenient importing
 */
export default useComponentAccessList