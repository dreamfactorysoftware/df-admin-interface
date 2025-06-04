import { useQuery, UseQueryResult } from '@tanstack/react-query';
import { useMemo } from 'react';

// Types (these will be properly imported once available)
interface Service {
  id: number;
  name: string;
  label: string;
  description: string;
  isActive: boolean;
  type: string;
  mutable: boolean;
  deletable: boolean;
  createdDate: string;
  lastModifiedDate: string;
  createdById: number | null;
  lastModifiedById: number | null;
  config: any;
  serviceDocByServiceId: number | null;
  refresh: boolean;
}

interface GenericListResponse<T> {
  resource: Array<T>;
  meta: {
    count: number;
  };
}

interface ServiceFilterOptions {
  search?: string;
  includeSystem?: boolean;
  includeUserCreated?: boolean;
  activeOnly?: boolean;
  types?: string[];
}

interface UseServicesOptions extends ServiceFilterOptions {
  enabled?: boolean;
}

interface UseServicesResult {
  services: Service[];
  filteredServices: Service[];
  isLoading: boolean;
  isError: boolean;
  error: Error | null;
  refetch: () => void;
  isRefetching: boolean;
}

/**
 * React Query hook that fetches available services for scheduler configuration dropdowns.
 * Replaces Angular ActivatedRoute data subscription patterns with intelligent caching
 * and background synchronization.
 * 
 * Implements the following features:
 * - Intelligent caching with 600 second staleTime for relatively static service data
 * - Background revalidation for service list updates 
 * - Service filtering and search capabilities for large service lists
 * - Error handling with retry capabilities and user-friendly error messages
 * - TypeScript type safety for Service array responses
 * 
 * @param options - Configuration options for filtering and query behavior
 * @returns Object containing filtered services data, loading state, and error handling
 */
export function useServices(options: UseServicesOptions = {}): UseServicesResult {
  const {
    search,
    includeSystem = true,
    includeUserCreated = true, 
    activeOnly = true,
    types,
    enabled = true,
  } = options;

  // Fetch services data using React Query
  const queryResult: UseQueryResult<GenericListResponse<Service>, Error> = useQuery({
    queryKey: ['services', 'scheduler-dropdown', { includeSystem, includeUserCreated, activeOnly, types }],
    queryFn: async (): Promise<GenericListResponse<Service>> => {
      // Build filter string based on options
      const filters: string[] = [];
      
      if (activeOnly) {
        filters.push('(is_active = true)');
      }
      
      if (!includeSystem && !includeUserCreated) {
        // If neither system nor user services are included, return empty result
        throw new Error('At least one of includeSystem or includeUserCreated must be true');
      } else if (!includeSystem) {
        filters.push('(created_by_id is not null)');
      } else if (!includeUserCreated) {
        filters.push('(created_by_id is null)');
      }
      
      // Exclude api_docs service as per Angular implementation
      filters.push('(name != "api_docs")');
      
      if (types && types.length > 0) {
        filters.push(`(type in ("${types.join('","')}"))`);
      }
      
      const filterString = filters.length > 0 ? filters.join(' and ') : '';
      
      // Build query parameters
      const params = new URLSearchParams({
        sort: 'name',
        limit: '100', // Reasonable limit for scheduler dropdown
        fields: 'id,name,label,description,type,is_active,created_by_id,last_modified_date',
      });
      
      if (filterString) {
        params.append('filter', filterString);
      }
      
      // Make API request (this will use the actual API client once available)
      const response = await fetch(`/api/v2/system/service?${params.toString()}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          // Authentication headers will be handled by middleware/interceptors
        },
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: { message: 'Network error' } }));
        throw new Error(errorData.error?.message || `HTTP ${response.status}: Failed to fetch services`);
      }
      
      const data: GenericListResponse<Service> = await response.json();
      return data;
    },
    enabled,
    staleTime: 600 * 1000, // 10 minutes - services are relatively static
    cacheTime: 900 * 1000, // 15 minutes - keep in cache longer than stale time
    refetchOnWindowFocus: false, // Don't refetch on window focus for relatively static data
    refetchOnMount: false, // Use cached data on mount if available and not stale
    refetchOnReconnect: true, // Refetch when connection is restored
    retry: (failureCount, error) => {
      // Retry up to 3 times for network errors, but not for 4xx errors
      if (failureCount >= 3) return false;
      if (error.message.includes('4')) return false; // Don't retry 4xx errors
      return true;
    },
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000), // Exponential backoff
  });

  // Memoized filtered services based on search term
  const filteredServices = useMemo(() => {
    if (!queryResult.data?.resource) return [];
    
    let services = queryResult.data.resource;
    
    // Apply search filter if provided
    if (search && search.trim()) {
      const searchTerm = search.toLowerCase().trim();
      services = services.filter((service) => 
        service.name.toLowerCase().includes(searchTerm) ||
        service.label.toLowerCase().includes(searchTerm) ||
        (service.description && service.description.toLowerCase().includes(searchTerm))
      );
    }
    
    return services;
  }, [queryResult.data?.resource, search]);

  return {
    services: queryResult.data?.resource || [],
    filteredServices,
    isLoading: queryResult.isLoading,
    isError: queryResult.isError,
    error: queryResult.error,
    refetch: queryResult.refetch,
    isRefetching: queryResult.isRefetching,
  };
}

/**
 * Type definitions for dropdown consumption
 */
export interface ServiceDropdownOption {
  id: number;
  name: string;
  label: string;
  description?: string;
  type: string;
}

/**
 * Helper hook that transforms services data into dropdown-friendly format
 * @param options - Service filter options
 * @returns Dropdown options with value/label pairs
 */
export function useServiceDropdownOptions(options: UseServicesOptions = {}) {
  const { filteredServices, ...rest } = useServices(options);
  
  const dropdownOptions = useMemo((): ServiceDropdownOption[] => {
    return filteredServices.map((service) => ({
      id: service.id,
      name: service.name,
      label: service.label || service.name,
      description: service.description,
      type: service.type,
    }));
  }, [filteredServices]);
  
  return {
    options: dropdownOptions,
    filteredServices,
    ...rest,
  };
}

/**
 * Default export for convenient importing
 */
export default useServices;