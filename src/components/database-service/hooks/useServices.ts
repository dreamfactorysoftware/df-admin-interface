/**
 * useServices Hook - Database Services Management
 * 
 * Custom React hook for fetching and managing database services with intelligent 
 * caching and filtering capabilities using TanStack React Query 5.79.2. Provides 
 * optimistic updates for service mutations and background synchronization for 
 * real-time data consistency.
 * 
 * Features:
 * - TanStack React Query for complex server-state management
 * - Intelligent caching with 5-15 minute stale time configuration
 * - Support for service type filtering with parallel data fetching
 * - System-level filtering (created_by_id logic) and custom filter support
 * - Optimistic updates and background synchronization patterns
 * - Error handling with exponential backoff retry strategy
 * - TypeScript generics support for GenericListResponse<Service>
 * 
 * @fileoverview Database services hook with React Query integration
 * @version 1.0.0
 * @since React 19.0.0, Next.js 15.1+, TypeScript 5.8+
 */

import { useMemo } from 'react';
import { 
  useQuery, 
  useQueries, 
  useQueryClient, 
  useMutation,
  type UseQueryResult,
  type UseMutationResult,
  type QueryClient
} from '@tanstack/react-query';
import { apiClient, type ApiResponse } from '../../../lib/api-client';
import type { 
  DatabaseService, 
  ServiceType, 
  DatabaseServiceCreateInput,
  DatabaseServiceUpdateInput,
  GenericListResponse 
} from '../../../types/database-service';
import type { GenericListResponse as LegacyListResponse } from '../../../types/generic-http';

// =============================================================================
// QUERY KEY FACTORIES
// =============================================================================

/**
 * Query key factory for database services
 * Provides type-safe and consistent query key generation
 */
export const servicesQueryKeys = {
  /** Base key for all services queries */
  all: ['services'] as const,
  
  /** Services list queries */
  lists: () => [...servicesQueryKeys.all, 'list'] as const,
  
  /** Filtered services list query */
  list: (params: ServicesQueryParams) => 
    [...servicesQueryKeys.lists(), params] as const,
  
  /** Service types queries */
  types: () => [...servicesQueryKeys.all, 'types'] as const,
  
  /** Service types with optional groups filter */
  typesList: (groups?: string[]) => 
    [...servicesQueryKeys.types(), { groups }] as const,
  
  /** Individual service detail queries */
  details: () => [...servicesQueryKeys.all, 'detail'] as const,
  
  /** Single service detail query */
  detail: (id: number) => 
    [...servicesQueryKeys.details(), id] as const,
} as const;

// =============================================================================
// TYPE DEFINITIONS
// =============================================================================

/**
 * Services query parameters interface
 */
export interface ServicesQueryParams {
  /** Service type groups for filtering */
  groups?: string[];
  
  /** System-level filtering: created_by_id null vs not null */
  includeSystem?: boolean;
  
  /** Custom filter string for additional filtering */
  filter?: string;
  
  /** Fields to include in response */
  fields?: string;
  
  /** Related data to include */
  related?: string;
  
  /** Pagination limit */
  limit?: number;
  
  /** Pagination offset */
  offset?: number;
  
  /** Sort criteria */
  sort?: string;
  
  /** Include count in response */
  includeCount?: boolean;
  
  /** Exclude api_docs service type */
  excludeApiDocs?: boolean;
}

/**
 * Hook configuration options
 */
export interface UseServicesOptions {
  /** Enable the query (default: true) */
  enabled?: boolean;
  
  /** Stale time in milliseconds (default: 5 minutes) */
  staleTime?: number;
  
  /** Cache time in milliseconds (default: 10 minutes) */
  cacheTime?: number;
  
  /** Refetch on window focus (default: false) */
  refetchOnWindowFocus?: boolean;
  
  /** Refetch on reconnect (default: true) */
  refetchOnReconnect?: boolean;
  
  /** Refetch interval in milliseconds */
  refetchInterval?: number;
  
  /** Retry count for failed requests (default: 3) */
  retry?: number;
  
  /** Retry delay function for exponential backoff */
  retryDelay?: (attemptIndex: number) => number;
  
  /** Select function to transform data */
  select?: (data: GenericListResponse<DatabaseService>) => any;
  
  /** Success callback */
  onSuccess?: (data: GenericListResponse<DatabaseService>) => void;
  
  /** Error callback */
  onError?: (error: Error) => void;
  
  /** Settlement callback (success or error) */
  onSettled?: (
    data?: GenericListResponse<DatabaseService>, 
    error?: Error | null
  ) => void;
}

/**
 * Services query result interface
 */
export interface UseServicesResult {
  /** Services data array */
  services: DatabaseService[];
  
  /** Raw query data */
  data: GenericListResponse<DatabaseService> | undefined;
  
  /** Loading state */
  isLoading: boolean;
  
  /** Error state */
  error: Error | null;
  
  /** Initial loading state */
  isInitialLoading: boolean;
  
  /** Fetching state (including background fetches) */
  isFetching: boolean;
  
  /** Stale data indicator */
  isStale: boolean;
  
  /** Success state */
  isSuccess: boolean;
  
  /** Error state boolean */
  isError: boolean;
  
  /** Data update timestamp */
  dataUpdatedAt: number;
  
  /** Error update timestamp */
  errorUpdatedAt: number;
  
  /** Total count from server */
  totalCount: number;
  
  /** Refetch function */
  refetch: () => Promise<UseQueryResult<GenericListResponse<DatabaseService>, Error>>;
  
  /** Remove from cache */
  remove: () => void;
  
  /** Check if query is enabled */
  isEnabled: boolean;
}

/**
 * Service types query result interface
 */
export interface UseServiceTypesResult {
  /** Service types data array */
  serviceTypes: ServiceType[];
  
  /** Raw query data */
  data: GenericListResponse<ServiceType> | undefined;
  
  /** Loading state */
  isLoading: boolean;
  
  /** Error state */
  error: Error | null;
  
  /** Success state */
  isSuccess: boolean;
  
  /** Refetch function */
  refetch: () => Promise<UseQueryResult<GenericListResponse<ServiceType>, Error>>;
}

/**
 * Parallel queries result for services with groups
 */
export interface UseServicesWithTypesResult {
  /** Services query result */
  services: UseServicesResult;
  
  /** Service types query result */
  serviceTypes: UseServiceTypesResult;
  
  /** Combined loading state */
  isLoading: boolean;
  
  /** Combined error state */
  hasErrors: boolean;
  
  /** All queries successful */
  isSuccess: boolean;
  
  /** Refetch all queries */
  refetchAll: () => Promise<void>;
}

/**
 * Service mutation variables for create operations
 */
export interface CreateServiceVariables {
  /** Service configuration data */
  data: DatabaseServiceCreateInput;
  
  /** Test connection before creating */
  testConnection?: boolean;
}

/**
 * Service mutation variables for update operations
 */
export interface UpdateServiceVariables {
  /** Service ID to update */
  id: number;
  
  /** Updated service data */
  data: DatabaseServiceUpdateInput;
  
  /** Test connection before updating */
  testConnection?: boolean;
}

/**
 * Service mutation variables for delete operations
 */
export interface DeleteServiceVariables {
  /** Service ID to delete */
  id: number;
  
  /** Force deletion */
  force?: boolean;
}

// =============================================================================
// UTILITY FUNCTIONS
// =============================================================================

/**
 * Build filter string from query parameters
 */
function buildFilterString(params: ServicesQueryParams): string {
  const filters: string[] = [];
  
  // System-level filtering based on created_by_id
  if (params.includeSystem === false) {
    filters.push('created_by_id is not null');
  } else if (params.includeSystem === true) {
    filters.push('created_by_id is null');
  }
  
  // Exclude api_docs service type if specified
  if (params.excludeApiDocs !== false) {
    filters.push('type != "api_docs"');
  }
  
  // Service type groups filtering
  if (params.groups && params.groups.length > 0) {
    const groupFilter = params.groups.map(group => `group = "${group}"`).join(' OR ');
    filters.push(`(${groupFilter})`);
  }
  
  // Custom filter parameter
  if (params.filter) {
    filters.push(params.filter);
  }
  
  return filters.join(' AND ');
}

/**
 * Build query parameters for API request
 */
function buildApiParams(params: ServicesQueryParams): Record<string, string> {
  const apiParams: Record<string, string> = {};
  
  // Build filter string
  const filter = buildFilterString(params);
  if (filter) {
    apiParams.filter = filter;
  }
  
  // Add other parameters
  if (params.fields) {
    apiParams.fields = params.fields;
  }
  
  if (params.related) {
    apiParams.related = params.related;
  }
  
  if (params.limit !== undefined) {
    apiParams.limit = params.limit.toString();
  }
  
  if (params.offset !== undefined) {
    apiParams.offset = params.offset.toString();
  }
  
  if (params.sort) {
    apiParams.sort = params.sort;
  }
  
  if (params.includeCount !== false) {
    apiParams.include_count = 'true';
  }
  
  return apiParams;
}

/**
 * Default exponential backoff retry delay
 */
const defaultRetryDelay = (attemptIndex: number): number => {
  return Math.min(1000 * 2 ** attemptIndex, 30000);
};

/**
 * Default hook options
 */
const defaultOptions: Required<Omit<UseServicesOptions, 'onSuccess' | 'onError' | 'onSettled' | 'select'>> = {
  enabled: true,
  staleTime: 5 * 60 * 1000, // 5 minutes
  cacheTime: 10 * 60 * 1000, // 10 minutes
  refetchOnWindowFocus: false,
  refetchOnReconnect: true,
  refetchInterval: 0,
  retry: 3,
  retryDelay: defaultRetryDelay,
};

// =============================================================================
// API FUNCTIONS
// =============================================================================

/**
 * Fetch services from API
 */
async function fetchServices(params: ServicesQueryParams): Promise<GenericListResponse<DatabaseService>> {
  const apiParams = buildApiParams(params);
  const queryString = new URLSearchParams(apiParams).toString();
  const endpoint = `/service${queryString ? `?${queryString}` : ''}`;
  
  const response = await apiClient.get<LegacyListResponse<DatabaseService>>(endpoint);
  
  // Transform legacy response format to new format
  return {
    resource: response.resource || [],
    meta: {
      count: response.meta?.count || 0,
    },
  };
}

/**
 * Fetch service types from API
 */
async function fetchServiceTypes(groups?: string[]): Promise<GenericListResponse<ServiceType>> {
  const params: Record<string, string> = {};
  
  if (groups && groups.length > 0) {
    params.group = groups.join(',');
  }
  
  const queryString = new URLSearchParams(params).toString();
  const endpoint = `/service_type${queryString ? `?${queryString}` : ''}`;
  
  const response = await apiClient.get<LegacyListResponse<ServiceType>>(endpoint);
  
  return {
    resource: response.resource || [],
    meta: {
      count: response.meta?.count || 0,
    },
  };
}

/**
 * Create new database service
 */
async function createService(variables: CreateServiceVariables): Promise<DatabaseService> {
  const response = await apiClient.post<{ resource: DatabaseService }>('/service', variables.data);
  return response.resource!;
}

/**
 * Update existing database service
 */
async function updateService(variables: UpdateServiceVariables): Promise<DatabaseService> {
  const response = await apiClient.patch<{ resource: DatabaseService }>(
    `/service/${variables.id}`, 
    variables.data
  );
  return response.resource!;
}

/**
 * Delete database service
 */
async function deleteService(variables: DeleteServiceVariables): Promise<{ success: boolean }> {
  const params: Record<string, string> = {};
  if (variables.force) {
    params.force = 'true';
  }
  
  const queryString = new URLSearchParams(params).toString();
  const endpoint = `/service/${variables.id}${queryString ? `?${queryString}` : ''}`;
  
  await apiClient.delete(endpoint);
  return { success: true };
}

// =============================================================================
// MAIN HOOKS
// =============================================================================

/**
 * Hook for fetching database services with intelligent caching and filtering
 * 
 * @param params Query parameters for filtering services
 * @param options Hook configuration options
 * @returns Services query result with caching and synchronization
 * 
 * @example
 * ```typescript
 * // Basic usage
 * const { services, isLoading, error } = useServices();
 * 
 * // With filtering
 * const { services } = useServices({
 *   groups: ['database'],
 *   excludeApiDocs: true,
 *   includeSystem: false
 * });
 * 
 * // With custom options
 * const { services } = useServices(
 *   { limit: 50 },
 *   { 
 *     staleTime: 15 * 60 * 1000,
 *     select: (data) => data.resource.filter(s => s.is_active)
 *   }
 * );
 * ```
 */
export function useServices(
  params: ServicesQueryParams = {},
  options: UseServicesOptions = {}
): UseServicesResult {
  const mergedOptions = { ...defaultOptions, ...options };
  
  const queryResult = useQuery({
    queryKey: servicesQueryKeys.list(params),
    queryFn: () => fetchServices(params),
    enabled: mergedOptions.enabled,
    staleTime: mergedOptions.staleTime,
    cacheTime: mergedOptions.cacheTime,
    refetchOnWindowFocus: mergedOptions.refetchOnWindowFocus,
    refetchOnReconnect: mergedOptions.refetchOnReconnect,
    refetchInterval: mergedOptions.refetchInterval,
    retry: mergedOptions.retry,
    retryDelay: mergedOptions.retryDelay,
    select: options.select,
    onSuccess: options.onSuccess,
    onError: options.onError,
    onSettled: options.onSettled,
  });
  
  const services = useMemo(() => {
    if (options.select) {
      // If custom select is used, return the transformed data directly
      return Array.isArray(queryResult.data) ? queryResult.data : [];
    }
    return queryResult.data?.resource || [];
  }, [queryResult.data, options.select]);
  
  const totalCount = useMemo(() => {
    return queryResult.data?.meta?.count || 0;
  }, [queryResult.data?.meta?.count]);
  
  return {
    services,
    data: queryResult.data,
    isLoading: queryResult.isLoading,
    error: queryResult.error,
    isInitialLoading: queryResult.isInitialLoading,
    isFetching: queryResult.isFetching,
    isStale: queryResult.isStale,
    isSuccess: queryResult.isSuccess,
    isError: queryResult.isError,
    dataUpdatedAt: queryResult.dataUpdatedAt,
    errorUpdatedAt: queryResult.errorUpdatedAt,
    totalCount,
    refetch: queryResult.refetch,
    remove: queryResult.remove,
    isEnabled: mergedOptions.enabled,
  };
}

/**
 * Hook for fetching service types with optional groups filtering
 * 
 * @param groups Optional service type groups to filter by
 * @param options Hook configuration options
 * @returns Service types query result
 * 
 * @example
 * ```typescript
 * // Fetch all service types
 * const { serviceTypes } = useServiceTypes();
 * 
 * // Fetch database service types only
 * const { serviceTypes } = useServiceTypes(['database']);
 * ```
 */
export function useServiceTypes(
  groups?: string[],
  options: UseServicesOptions = {}
): UseServiceTypesResult {
  const mergedOptions = { ...defaultOptions, ...options };
  
  const queryResult = useQuery({
    queryKey: servicesQueryKeys.typesList(groups),
    queryFn: () => fetchServiceTypes(groups),
    enabled: mergedOptions.enabled,
    staleTime: mergedOptions.staleTime,
    cacheTime: mergedOptions.cacheTime,
    refetchOnWindowFocus: mergedOptions.refetchOnWindowFocus,
    refetchOnReconnect: mergedOptions.refetchOnReconnect,
    retry: mergedOptions.retry,
    retryDelay: mergedOptions.retryDelay,
  });
  
  const serviceTypes = useMemo(() => {
    return queryResult.data?.resource || [];
  }, [queryResult.data?.resource]);
  
  return {
    serviceTypes,
    data: queryResult.data,
    isLoading: queryResult.isLoading,
    error: queryResult.error,
    isSuccess: queryResult.isSuccess,
    refetch: queryResult.refetch,
  };
}

/**
 * Hook for parallel data fetching of services and service types
 * Enables efficient loading when both datasets are required
 * 
 * @param servicesParams Query parameters for services
 * @param groups Service type groups filter
 * @param options Hook configuration options
 * @returns Combined query results with parallel fetching
 * 
 * @example
 * ```typescript
 * // Parallel fetch services and types
 * const { services, serviceTypes, isLoading } = useServicesWithTypes(
 *   { excludeApiDocs: true },
 *   ['database']
 * );
 * ```
 */
export function useServicesWithTypes(
  servicesParams: ServicesQueryParams = {},
  groups?: string[],
  options: UseServicesOptions = {}
): UseServicesWithTypesResult {
  const mergedOptions = { ...defaultOptions, ...options };
  
  const queries = useQueries({
    queries: [
      {
        queryKey: servicesQueryKeys.list(servicesParams),
        queryFn: () => fetchServices(servicesParams),
        enabled: mergedOptions.enabled,
        staleTime: mergedOptions.staleTime,
        cacheTime: mergedOptions.cacheTime,
        refetchOnWindowFocus: mergedOptions.refetchOnWindowFocus,
        refetchOnReconnect: mergedOptions.refetchOnReconnect,
        retry: mergedOptions.retry,
        retryDelay: mergedOptions.retryDelay,
      },
      {
        queryKey: servicesQueryKeys.typesList(groups),
        queryFn: () => fetchServiceTypes(groups),
        enabled: mergedOptions.enabled,
        staleTime: mergedOptions.staleTime,
        cacheTime: mergedOptions.cacheTime,
        refetchOnWindowFocus: mergedOptions.refetchOnWindowFocus,
        refetchOnReconnect: mergedOptions.refetchOnReconnect,
        retry: mergedOptions.retry,
        retryDelay: mergedOptions.retryDelay,
      },
    ],
  });
  
  const [servicesQuery, serviceTypesQuery] = queries;
  
  const services = useMemo(() => ({
    services: servicesQuery.data?.resource || [],
    data: servicesQuery.data,
    isLoading: servicesQuery.isLoading,
    error: servicesQuery.error,
    isInitialLoading: servicesQuery.isInitialLoading,
    isFetching: servicesQuery.isFetching,
    isStale: servicesQuery.isStale,
    isSuccess: servicesQuery.isSuccess,
    isError: servicesQuery.isError,
    dataUpdatedAt: servicesQuery.dataUpdatedAt,
    errorUpdatedAt: servicesQuery.errorUpdatedAt,
    totalCount: servicesQuery.data?.meta?.count || 0,
    refetch: servicesQuery.refetch,
    remove: servicesQuery.remove,
    isEnabled: mergedOptions.enabled,
  }), [servicesQuery, mergedOptions.enabled]);
  
  const serviceTypes = useMemo(() => ({
    serviceTypes: serviceTypesQuery.data?.resource || [],
    data: serviceTypesQuery.data,
    isLoading: serviceTypesQuery.isLoading,
    error: serviceTypesQuery.error,
    isSuccess: serviceTypesQuery.isSuccess,
    refetch: serviceTypesQuery.refetch,
  }), [serviceTypesQuery]);
  
  const isLoading = servicesQuery.isLoading || serviceTypesQuery.isLoading;
  const hasErrors = servicesQuery.isError || serviceTypesQuery.isError;
  const isSuccess = servicesQuery.isSuccess && serviceTypesQuery.isSuccess;
  
  const refetchAll = async (): Promise<void> => {
    await Promise.all([
      servicesQuery.refetch(),
      serviceTypesQuery.refetch(),
    ]);
  };
  
  return {
    services,
    serviceTypes,
    isLoading,
    hasErrors,
    isSuccess,
    refetchAll,
  };
}

// =============================================================================
// MUTATION HOOKS
// =============================================================================

/**
 * Hook for creating database services with optimistic updates
 * 
 * @returns Mutation hook for service creation
 * 
 * @example
 * ```typescript
 * const createServiceMutation = useCreateService();
 * 
 * const handleCreate = async (data: DatabaseServiceCreateInput) => {
 *   try {
 *     const newService = await createServiceMutation.mutateAsync({ data });
 *     console.log('Service created:', newService);
 *   } catch (error) {
 *     console.error('Creation failed:', error);
 *   }
 * };
 * ```
 */
export function useCreateService(): UseMutationResult<DatabaseService, Error, CreateServiceVariables> {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: createService,
    onSuccess: (newService) => {
      // Invalidate and refetch services queries
      queryClient.invalidateQueries({ queryKey: servicesQueryKeys.lists() });
      
      // Add optimistic update to existing queries
      queryClient.setQueriesData<GenericListResponse<DatabaseService>>(
        { queryKey: servicesQueryKeys.lists() },
        (oldData) => {
          if (!oldData) return oldData;
          
          return {
            ...oldData,
            resource: [newService, ...oldData.resource],
            meta: {
              ...oldData.meta,
              count: oldData.meta.count + 1,
            },
          };
        }
      );
    },
    onError: (error) => {
      console.error('Service creation failed:', error);
    },
  });
}

/**
 * Hook for updating database services with optimistic updates
 * 
 * @returns Mutation hook for service updates
 * 
 * @example
 * ```typescript
 * const updateServiceMutation = useUpdateService();
 * 
 * const handleUpdate = async (id: number, data: DatabaseServiceUpdateInput) => {
 *   await updateServiceMutation.mutateAsync({ id, data });
 * };
 * ```
 */
export function useUpdateService(): UseMutationResult<DatabaseService, Error, UpdateServiceVariables> {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: updateService,
    onMutate: async (variables) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: servicesQueryKeys.lists() });
      await queryClient.cancelQueries({ queryKey: servicesQueryKeys.detail(variables.id) });
      
      // Snapshot the previous values
      const previousServices = queryClient.getQueriesData<GenericListResponse<DatabaseService>>({
        queryKey: servicesQueryKeys.lists(),
      });
      const previousService = queryClient.getQueryData<DatabaseService>(
        servicesQueryKeys.detail(variables.id)
      );
      
      // Optimistically update services lists
      queryClient.setQueriesData<GenericListResponse<DatabaseService>>(
        { queryKey: servicesQueryKeys.lists() },
        (oldData) => {
          if (!oldData) return oldData;
          
          return {
            ...oldData,
            resource: oldData.resource.map(service =>
              service.id === variables.id 
                ? { ...service, ...variables.data }
                : service
            ),
          };
        }
      );
      
      // Optimistically update service detail
      if (previousService) {
        queryClient.setQueryData(
          servicesQueryKeys.detail(variables.id),
          { ...previousService, ...variables.data }
        );
      }
      
      return { previousServices, previousService };
    },
    onSuccess: (updatedService, variables) => {
      // Update with actual server response
      queryClient.setQueriesData<GenericListResponse<DatabaseService>>(
        { queryKey: servicesQueryKeys.lists() },
        (oldData) => {
          if (!oldData) return oldData;
          
          return {
            ...oldData,
            resource: oldData.resource.map(service =>
              service.id === variables.id ? updatedService : service
            ),
          };
        }
      );
      
      queryClient.setQueryData(servicesQueryKeys.detail(variables.id), updatedService);
    },
    onError: (error, variables, context) => {
      // Rollback optimistic updates
      if (context?.previousServices) {
        context.previousServices.forEach(([queryKey, data]) => {
          queryClient.setQueryData(queryKey, data);
        });
      }
      
      if (context?.previousService) {
        queryClient.setQueryData(servicesQueryKeys.detail(variables.id), context.previousService);
      }
      
      console.error('Service update failed:', error);
    },
  });
}

/**
 * Hook for deleting database services with optimistic updates
 * 
 * @returns Mutation hook for service deletion
 * 
 * @example
 * ```typescript
 * const deleteServiceMutation = useDeleteService();
 * 
 * const handleDelete = async (id: number) => {
 *   await deleteServiceMutation.mutateAsync({ id });
 * };
 * ```
 */
export function useDeleteService(): UseMutationResult<{ success: boolean }, Error, DeleteServiceVariables> {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: deleteService,
    onMutate: async (variables) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: servicesQueryKeys.lists() });
      
      // Snapshot the previous values
      const previousServices = queryClient.getQueriesData<GenericListResponse<DatabaseService>>({
        queryKey: servicesQueryKeys.lists(),
      });
      
      // Optimistically remove from services lists
      queryClient.setQueriesData<GenericListResponse<DatabaseService>>(
        { queryKey: servicesQueryKeys.lists() },
        (oldData) => {
          if (!oldData) return oldData;
          
          return {
            ...oldData,
            resource: oldData.resource.filter(service => service.id !== variables.id),
            meta: {
              ...oldData.meta,
              count: Math.max(0, oldData.meta.count - 1),
            },
          };
        }
      );
      
      return { previousServices };
    },
    onSuccess: (_, variables) => {
      // Remove service detail from cache
      queryClient.removeQueries({ queryKey: servicesQueryKeys.detail(variables.id) });
      
      // Invalidate related queries to ensure consistency
      queryClient.invalidateQueries({ queryKey: servicesQueryKeys.lists() });
    },
    onError: (error, variables, context) => {
      // Rollback optimistic updates
      if (context?.previousServices) {
        context.previousServices.forEach(([queryKey, data]) => {
          queryClient.setQueryData(queryKey, data);
        });
      }
      
      console.error('Service deletion failed:', error);
    },
  });
}

// =============================================================================
// UTILITY HOOKS
// =============================================================================

/**
 * Hook for invalidating services cache
 * Useful for manual cache invalidation after external changes
 * 
 * @returns Cache invalidation functions
 * 
 * @example
 * ```typescript
 * const { invalidateAll, invalidateServices, invalidateTypes } = useInvalidateServices();
 * 
 * // Invalidate all services-related caches
 * await invalidateAll();
 * 
 * // Invalidate only services lists
 * await invalidateServices();
 * ```
 */
export function useInvalidateServices() {
  const queryClient = useQueryClient();
  
  const invalidateAll = async (): Promise<void> => {
    await queryClient.invalidateQueries({ queryKey: servicesQueryKeys.all });
  };
  
  const invalidateServices = async (): Promise<void> => {
    await queryClient.invalidateQueries({ queryKey: servicesQueryKeys.lists() });
  };
  
  const invalidateTypes = async (): Promise<void> => {
    await queryClient.invalidateQueries({ queryKey: servicesQueryKeys.types() });
  };
  
  const invalidateService = async (id: number): Promise<void> => {
    await queryClient.invalidateQueries({ queryKey: servicesQueryKeys.detail(id) });
  };
  
  return {
    invalidateAll,
    invalidateServices,
    invalidateTypes,
    invalidateService,
  };
}

/**
 * Hook for prefetching services data
 * Useful for preloading data before navigation
 * 
 * @returns Prefetch functions
 * 
 * @example
 * ```typescript
 * const { prefetchServices, prefetchTypes } = usePrefetchServices();
 * 
 * // Prefetch services on hover
 * const handleHover = () => {
 *   prefetchServices({ limit: 20 });
 * };
 * ```
 */
export function usePrefetchServices() {
  const queryClient = useQueryClient();
  
  const prefetchServices = async (params: ServicesQueryParams = {}): Promise<void> => {
    await queryClient.prefetchQuery({
      queryKey: servicesQueryKeys.list(params),
      queryFn: () => fetchServices(params),
      staleTime: defaultOptions.staleTime,
    });
  };
  
  const prefetchTypes = async (groups?: string[]): Promise<void> => {
    await queryClient.prefetchQuery({
      queryKey: servicesQueryKeys.typesList(groups),
      queryFn: () => fetchServiceTypes(groups),
      staleTime: defaultOptions.staleTime,
    });
  };
  
  return {
    prefetchServices,
    prefetchTypes,
  };
}

// =============================================================================
// EXPORTS
// =============================================================================

export type {
  ServicesQueryParams,
  UseServicesOptions,
  UseServicesResult,
  UseServiceTypesResult,
  UseServicesWithTypesResult,
  CreateServiceVariables,
  UpdateServiceVariables,
  DeleteServiceVariables,
};

export { servicesQueryKeys };