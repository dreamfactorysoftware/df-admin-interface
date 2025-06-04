import { useQuery } from '@tanstack/react-query';
import { GenericListResponse } from '@/types/generic-http';
import { Service } from '@/types/service';

/**
 * Hook configuration interface for component access list fetching
 */
interface UseComponentAccessListConfig {
  /**
   * The service ID to fetch component access list for
   */
  serviceId?: number | null;
  
  /**
   * Optional service list to find the service name
   * If not provided, fetching will be disabled
   */
  services?: Service[];
  
  /**
   * Whether to enable the query (defaults to true when serviceId is valid)
   */
  enabled?: boolean;
}

/**
 * Component access list response type
 */
type ComponentAccessListResponse = GenericListResponse<string>;

/**
 * React Query hook that fetches component access lists based on selected service,
 * replacing Angular accessListService patterns. Implements conditional fetching 
 * based on service selection with intelligent caching and automatic refetching 
 * when service changes.
 * 
 * @param config - Configuration object containing serviceId and services
 * @returns React Query result with component access list data
 * 
 * @example
 * ```tsx
 * const { data, error, isLoading } = useComponentAccessList({
 *   serviceId: selectedServiceId,
 *   services: servicesData
 * });
 * 
 * // Use the component options in a dropdown
 * const componentOptions = data?.resource || [];
 * ```
 */
export function useComponentAccessList({
  serviceId,
  services = [],
  enabled = true,
}: UseComponentAccessListConfig = {}) {
  // Find the service by ID to get the service name
  const selectedService = services.find(service => service.id === serviceId);
  
  // Determine if query should be enabled
  const shouldFetch = Boolean(
    enabled && 
    serviceId && 
    selectedService?.name && 
    services.length > 0
  );

  return useQuery<ComponentAccessListResponse, Error>({
    queryKey: ['component-access-list', serviceId, selectedService?.name],
    
    queryFn: async (): Promise<ComponentAccessListResponse> => {
      if (!selectedService?.name) {
        throw new Error('Service not found or service name unavailable');
      }

      // Use native fetch for API call following Next.js patterns
      const url = new URL(`/api/v2/${selectedService.name}`, window.location.origin);
      url.searchParams.set('as_access_list', 'true');

      const response = await fetch(url.toString(), {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          // Session token will be handled by middleware/interceptors
        },
        credentials: 'include', // Include cookies for authentication
      });

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('Authentication required - please log in again');
        }
        if (response.status === 403) {
          throw new Error(`Access denied to service "${selectedService.name}" - insufficient permissions`);
        }
        if (response.status === 404) {
          throw new Error(`Service "${selectedService.name}" not found or unavailable`);
        }
        
        // Try to get error message from response
        let errorMessage = `Failed to fetch component access list for service "${selectedService.name}"`;
        try {
          const errorData = await response.json();
          if (errorData.error?.message) {
            errorMessage = errorData.error.message;
          }
        } catch {
          // Use default message if parsing fails
        }
        
        throw new Error(errorMessage);
      }

      const data: ComponentAccessListResponse = await response.json();
      return data;
    },

    // Conditional fetching - only enabled when valid service is selected
    enabled: shouldFetch,
    
    // Intelligent caching with 300 seconds stale time as specified
    staleTime: 300 * 1000, // 5 minutes
    
    // Cache for 15 minutes to prevent frequent refetching
    gcTime: 900 * 1000, // 15 minutes (formerly cacheTime)
    
    // Background refetching for real-time updates
    refetchOnWindowFocus: false, // Disable aggressive refetching
    refetchOnReconnect: true,
    
    // Retry configuration for network errors
    retry: (failureCount, error) => {
      // Don't retry on authentication/authorization errors
      if (error.message.includes('Authentication required') || 
          error.message.includes('Access denied')) {
        return false;
      }
      
      // Retry up to 3 times for other errors
      return failureCount < 3;
    },
    
    // Retry delay with exponential backoff
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
    
    // Error handling
    throwOnError: false, // Let components handle errors gracefully
    
    // Meta information for debugging
    meta: {
      description: 'Fetches component access list for scheduler task configuration',
      serviceId,
      serviceName: selectedService?.name,
    },
  });
}

/**
 * Type guard to check if the hook result has valid data
 */
export function hasComponentAccessData(
  result: ReturnType<typeof useComponentAccessList>
): result is ReturnType<typeof useComponentAccessList> & { 
  data: ComponentAccessListResponse 
} {
  return Boolean(result.data?.resource);
}

/**
 * Utility function to extract component options array from the hook result
 */
export function getComponentOptions(
  result: ReturnType<typeof useComponentAccessList>
): string[] {
  return result.data?.resource || [];
}

export default useComponentAccessList;