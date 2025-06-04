/**
 * Database Service List Hooks
 * 
 * Custom React hooks for database service list data fetching, state management, and operations.
 * Implements SWR and React Query hooks for service listing, filtering, sorting, and CRUD operations.
 * Provides hooks for service list state management, table virtualization, and real-time data synchronization.
 * 
 * @fileoverview Service list hooks with React Query, SWR, and Zustand integration
 * @version 1.0.0
 * @since 2024-01-01
 */

import { useCallback, useMemo, useState, useEffect } from 'react';
import { 
  useQuery, 
  useMutation, 
  useQueryClient, 
  keepPreviousData,
  type QueryKey,
  type UseQueryOptions,
  type UseMutationOptions 
} from '@tanstack/react-query';
import useSWR, { type SWRConfiguration, mutate } from 'swr';
import { useVirtual, type VirtualItem } from '@tanstack/react-virtual';
import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import { 
  DatabaseService,
  DatabaseServiceCreateInput,
  DatabaseServiceUpdateInput,
  DatabaseConnectionInput,
  DatabaseDriver,
  ServiceStatus,
  ConnectionTestResult,
  ConnectionTestStatus,
  GenericListResponse,
  ApiErrorResponse,
  DatabaseServiceQueryKeys
} from '../types';

// =============================================================================
// TYPES AND INTERFACES
// =============================================================================

/**
 * Service list filter parameters
 */
export interface ServiceListFilters {
  search?: string;
  type?: DatabaseDriver[];
  status?: ServiceStatus[];
  isActive?: boolean;
  sortBy?: 'name' | 'type' | 'created_date' | 'last_modified_date';
  sortOrder?: 'asc' | 'desc';
}

/**
 * Service list pagination parameters
 */
export interface ServiceListPagination {
  page: number;
  pageSize: number;
  offset: number;
  limit: number;
}

/**
 * Service list query parameters
 */
export interface ServiceListQuery extends ServiceListFilters, ServiceListPagination {}

/**
 * Service list response with metadata
 */
export interface ServiceListResponse extends GenericListResponse<DatabaseService> {
  totalCount: number;
  hasMore: boolean;
  nextCursor?: string;
}

/**
 * Service list state for virtualization
 */
export interface ServiceListState {
  services: DatabaseService[];
  selectedServices: Set<number>;
  filters: ServiceListFilters;
  pagination: ServiceListPagination;
  loading: boolean;
  error: ApiErrorResponse | null;
  lastUpdated: string | null;
}

/**
 * Service list actions for Zustand store
 */
export interface ServiceListActions {
  setServices: (services: DatabaseService[]) => void;
  addService: (service: DatabaseService) => void;
  updateService: (id: number, service: Partial<DatabaseService>) => void;
  removeService: (id: number) => void;
  setSelectedServices: (services: Set<number>) => void;
  toggleServiceSelection: (id: number) => void;
  clearSelection: () => void;
  setFilters: (filters: Partial<ServiceListFilters>) => void;
  setPagination: (pagination: Partial<ServiceListPagination>) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: ApiErrorResponse | null) => void;
  reset: () => void;
}

/**
 * Complete service list store type
 */
export type ServiceListStore = ServiceListState & ServiceListActions;

/**
 * Export data format options
 */
export type ExportFormat = 'json' | 'csv' | 'xlsx';

/**
 * Export options interface
 */
export interface ExportOptions {
  format: ExportFormat;
  includeFields?: string[];
  filters?: ServiceListFilters;
  filename?: string;
}

// =============================================================================
// ZUSTAND STORE FOR SERVICE LIST STATE MANAGEMENT
// =============================================================================

/**
 * Service list Zustand store with persistent state management
 * Integrates with React Query for server state synchronization
 */
export const useServiceListStore = create<ServiceListStore>()(
  subscribeWithSelector((set, get) => ({
    // Initial state
    services: [],
    selectedServices: new Set<number>(),
    filters: {
      sortBy: 'name',
      sortOrder: 'asc'
    },
    pagination: {
      page: 1,
      pageSize: 25,
      offset: 0,
      limit: 25
    },
    loading: false,
    error: null,
    lastUpdated: null,

    // Actions
    setServices: (services: DatabaseService[]) => 
      set({ 
        services, 
        lastUpdated: new Date().toISOString() 
      }),

    addService: (service: DatabaseService) =>
      set((state) => ({
        services: [...state.services, service],
        lastUpdated: new Date().toISOString()
      })),

    updateService: (id: number, updatedService: Partial<DatabaseService>) =>
      set((state) => ({
        services: state.services.map((service) =>
          service.id === id ? { ...service, ...updatedService } : service
        ),
        lastUpdated: new Date().toISOString()
      })),

    removeService: (id: number) =>
      set((state) => {
        const newSelectedServices = new Set(state.selectedServices);
        newSelectedServices.delete(id);
        return {
          services: state.services.filter((service) => service.id !== id),
          selectedServices: newSelectedServices,
          lastUpdated: new Date().toISOString()
        };
      }),

    setSelectedServices: (selectedServices: Set<number>) =>
      set({ selectedServices }),

    toggleServiceSelection: (id: number) =>
      set((state) => {
        const newSelectedServices = new Set(state.selectedServices);
        if (newSelectedServices.has(id)) {
          newSelectedServices.delete(id);
        } else {
          newSelectedServices.add(id);
        }
        return { selectedServices: newSelectedServices };
      }),

    clearSelection: () => 
      set({ selectedServices: new Set<number>() }),

    setFilters: (filters: Partial<ServiceListFilters>) =>
      set((state) => ({
        filters: { ...state.filters, ...filters },
        pagination: { ...state.pagination, page: 1, offset: 0 } // Reset pagination on filter change
      })),

    setPagination: (pagination: Partial<ServiceListPagination>) =>
      set((state) => {
        const newPagination = { ...state.pagination, ...pagination };
        // Calculate offset from page and pageSize
        if (pagination.page !== undefined || pagination.pageSize !== undefined) {
          newPagination.offset = (newPagination.page - 1) * newPagination.pageSize;
          newPagination.limit = newPagination.pageSize;
        }
        return { pagination: newPagination };
      }),

    setLoading: (loading: boolean) => set({ loading }),

    setError: (error: ApiErrorResponse | null) => set({ error }),

    reset: () => set({
      services: [],
      selectedServices: new Set<number>(),
      filters: { sortBy: 'name', sortOrder: 'asc' },
      pagination: { page: 1, pageSize: 25, offset: 0, limit: 25 },
      loading: false,
      error: null,
      lastUpdated: null
    })
  }))
);

// =============================================================================
// API CLIENT FUNCTIONS
// =============================================================================

/**
 * Fetch services with filters and pagination
 */
const fetchServices = async (query: ServiceListQuery): Promise<ServiceListResponse> => {
  const params = new URLSearchParams();
  
  // Add pagination
  params.append('offset', query.offset.toString());
  params.append('limit', query.limit.toString());
  
  // Add filters
  if (query.search) {
    params.append('filter', `name like '%${query.search}%' OR label like '%${query.search}%'`);
  }
  
  if (query.type && query.type.length > 0) {
    params.append('filter', `type in (${query.type.map(t => `'${t}'`).join(',')})`);
  }
  
  if (query.isActive !== undefined) {
    params.append('filter', `is_active = ${query.isActive}`);
  }
  
  // Add sorting
  if (query.sortBy) {
    const sortDirection = query.sortOrder === 'desc' ? 'DESC' : 'ASC';
    params.append('order', `${query.sortBy} ${sortDirection}`);
  }
  
  const response = await fetch(`/api/v2/system/service?${params.toString()}`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
  });
  
  if (!response.ok) {
    const error: ApiErrorResponse = await response.json();
    throw error;
  }
  
  const data: GenericListResponse<DatabaseService> = await response.json();
  
  return {
    ...data,
    totalCount: data.meta?.total_count || data.resource.length,
    hasMore: (data.meta?.offset || 0) + data.resource.length < (data.meta?.total_count || 0),
    nextCursor: data.next
  };
};

/**
 * Create a new database service
 */
const createService = async (service: DatabaseServiceCreateInput): Promise<DatabaseService> => {
  const response = await fetch('/api/v2/system/service', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(service),
  });
  
  if (!response.ok) {
    const error: ApiErrorResponse = await response.json();
    throw error;
  }
  
  return response.json();
};

/**
 * Update an existing database service
 */
const updateService = async (id: number, service: DatabaseServiceUpdateInput): Promise<DatabaseService> => {
  const response = await fetch(`/api/v2/system/service/${id}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(service),
  });
  
  if (!response.ok) {
    const error: ApiErrorResponse = await response.json();
    throw error;
  }
  
  return response.json();
};

/**
 * Delete a database service
 */
const deleteService = async (id: number): Promise<void> => {
  const response = await fetch(`/api/v2/system/service/${id}`, {
    method: 'DELETE',
  });
  
  if (!response.ok) {
    const error: ApiErrorResponse = await response.json();
    throw error;
  }
};

/**
 * Test database connection
 */
const testConnection = async (config: DatabaseConnectionInput): Promise<ConnectionTestResult> => {
  const serviceName = config.name || 'test-connection';
  const response = await fetch(`/${serviceName}/_table?limit=1`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      'X-DreamFactory-Test-Config': JSON.stringify(config),
    },
  });
  
  const timestamp = new Date().toISOString();
  const startTime = Date.now();
  
  try {
    if (response.ok) {
      const testDuration = Date.now() - startTime;
      return {
        success: true,
        message: 'Connection successful',
        timestamp,
        testDuration
      };
    } else {
      const error = await response.json();
      return {
        success: false,
        message: error.error?.message || 'Connection failed',
        details: error.error?.details,
        timestamp,
        testDuration: Date.now() - startTime,
        errorCode: error.error?.code?.toString()
      };
    }
  } catch (err) {
    return {
      success: false,
      message: err instanceof Error ? err.message : 'Connection test failed',
      timestamp,
      testDuration: Date.now() - startTime
    };
  }
};

// =============================================================================
// SERVICE LIST HOOKS
// =============================================================================

/**
 * Hook for paginated service list data fetching with React Query intelligent caching
 * Implements caching with TTL configuration per Section 5.2 requirements
 */
export function useServiceList(options?: {
  filters?: ServiceListFilters;
  pagination?: ServiceListPagination;
  enabled?: boolean;
}) {
  const store = useServiceListStore();
  const queryClient = useQueryClient();
  
  // Merge options with store state
  const query: ServiceListQuery = useMemo(() => ({
    ...store.filters,
    ...store.pagination,
    ...options?.filters,
    ...options?.pagination
  }), [store.filters, store.pagination, options?.filters, options?.pagination]);
  
  // React Query configuration per Section 5.2 requirements
  const queryOptions: UseQueryOptions<ServiceListResponse, ApiErrorResponse> = {
    queryKey: DatabaseServiceQueryKeys.list(query),
    queryFn: () => fetchServices(query),
    staleTime: 300 * 1000, // 300 seconds per specification
    gcTime: 900 * 1000, // 900 seconds per specification (replaces cacheTime)
    enabled: options?.enabled !== false,
    placeholderData: keepPreviousData,
    refetchOnWindowFocus: false,
    refetchOnReconnect: true
  };
  
  const {
    data,
    error,
    isLoading,
    isFetching,
    refetch,
    isRefetching
  } = useQuery(queryOptions);
  
  // Sync with Zustand store
  useEffect(() => {
    if (data?.resource) {
      store.setServices(data.resource);
    }
    store.setLoading(isLoading);
    store.setError(error);
  }, [data?.resource, isLoading, error, store]);
  
  // Memoized return values
  return useMemo(() => ({
    services: data?.resource || store.services,
    totalCount: data?.totalCount || 0,
    hasMore: data?.hasMore || false,
    nextCursor: data?.nextCursor,
    loading: isLoading,
    fetching: isFetching,
    refreshing: isRefetching,
    error,
    refetch: () => {
      void refetch();
    },
    invalidate: () => {
      void queryClient.invalidateQueries({
        queryKey: DatabaseServiceQueryKeys.lists()
      });
    }
  }), [
    data,
    store.services,
    isLoading,
    isFetching,
    isRefetching,
    error,
    refetch,
    queryClient
  ]);
}

/**
 * Hook for managing service list filters and query parameters
 */
export function useServiceListFilters() {
  const store = useServiceListStore();
  
  const updateFilters = useCallback((newFilters: Partial<ServiceListFilters>) => {
    store.setFilters(newFilters);
  }, [store]);
  
  const resetFilters = useCallback(() => {
    store.setFilters({
      search: undefined,
      type: undefined,
      status: undefined,
      isActive: undefined,
      sortBy: 'name',
      sortOrder: 'asc'
    });
  }, [store]);
  
  const setSearch = useCallback((search: string) => {
    store.setFilters({ search: search || undefined });
  }, [store]);
  
  const setTypes = useCallback((types: DatabaseDriver[]) => {
    store.setFilters({ type: types.length > 0 ? types : undefined });
  }, [store]);
  
  const setStatuses = useCallback((statuses: ServiceStatus[]) => {
    store.setFilters({ status: statuses.length > 0 ? statuses : undefined });
  }, [store]);
  
  const setSorting = useCallback((sortBy: ServiceListFilters['sortBy'], sortOrder: ServiceListFilters['sortOrder']) => {
    store.setFilters({ sortBy, sortOrder });
  }, [store]);
  
  return useMemo(() => ({
    filters: store.filters,
    updateFilters,
    resetFilters,
    setSearch,
    setTypes,
    setStatuses,
    setSorting
  }), [
    store.filters,
    updateFilters,
    resetFilters,
    setSearch,
    setTypes,
    setStatuses,
    setSorting
  ]);
}

/**
 * Hook for service CRUD operations with optimistic updates and error handling
 */
export function useServiceListMutations() {
  const queryClient = useQueryClient();
  const store = useServiceListStore();
  
  // Create service mutation
  const createMutation = useMutation({
    mutationFn: createService,
    onMutate: async (newService: DatabaseServiceCreateInput) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({
        queryKey: DatabaseServiceQueryKeys.lists()
      });
      
      // Snapshot the previous value
      const previousServices = queryClient.getQueryData(
        DatabaseServiceQueryKeys.list(store.filters)
      );
      
      // Optimistically update
      const optimisticService: DatabaseService = {
        ...newService,
        id: Date.now(), // Temporary ID
        created_date: new Date().toISOString(),
        last_modified_date: new Date().toISOString(),
        created_by_id: null,
        last_modified_by_id: null,
        status: 'configuring' as ServiceStatus,
        mutable: true,
        deletable: true
      };
      
      store.addService(optimisticService);
      
      return { previousServices, optimisticService };
    },
    onError: (err, newService, context) => {
      // Rollback optimistic update
      if (context?.optimisticService) {
        store.removeService(context.optimisticService.id);
      }
      store.setError(err as ApiErrorResponse);
    },
    onSuccess: (data, variables, context) => {
      // Replace optimistic service with real data
      if (context?.optimisticService) {
        store.removeService(context.optimisticService.id);
      }
      store.addService(data);
      
      // Invalidate and refetch
      void queryClient.invalidateQueries({
        queryKey: DatabaseServiceQueryKeys.lists()
      });
    }
  });
  
  // Update service mutation
  const updateMutation = useMutation({
    mutationFn: ({ id, service }: { id: number; service: DatabaseServiceUpdateInput }) =>
      updateService(id, service),
    onMutate: async ({ id, service }) => {
      await queryClient.cancelQueries({
        queryKey: DatabaseServiceQueryKeys.lists()
      });
      
      const previousServices = queryClient.getQueryData(
        DatabaseServiceQueryKeys.list(store.filters)
      );
      
      // Optimistically update
      store.updateService(id, {
        ...service,
        last_modified_date: new Date().toISOString()
      });
      
      return { previousServices };
    },
    onError: (err, variables, context) => {
      // Rollback would require more complex state management
      store.setError(err as ApiErrorResponse);
    },
    onSuccess: (data) => {
      store.updateService(data.id, data);
      
      void queryClient.invalidateQueries({
        queryKey: DatabaseServiceQueryKeys.lists()
      });
    }
  });
  
  // Delete service mutation
  const deleteMutation = useMutation({
    mutationFn: deleteService,
    onMutate: async (id: number) => {
      await queryClient.cancelQueries({
        queryKey: DatabaseServiceQueryKeys.lists()
      });
      
      const previousServices = queryClient.getQueryData(
        DatabaseServiceQueryKeys.list(store.filters)
      );
      
      // Optimistically remove
      store.removeService(id);
      
      return { previousServices };
    },
    onError: (err, id, context) => {
      // Rollback would require restoring the service
      store.setError(err as ApiErrorResponse);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: DatabaseServiceQueryKeys.lists()
      });
    }
  });
  
  return useMemo(() => ({
    create: {
      mutate: createMutation.mutate,
      mutateAsync: createMutation.mutateAsync,
      isLoading: createMutation.isPending,
      error: createMutation.error,
      isSuccess: createMutation.isSuccess,
      reset: createMutation.reset
    },
    update: {
      mutate: updateMutation.mutate,
      mutateAsync: updateMutation.mutateAsync,
      isLoading: updateMutation.isPending,
      error: updateMutation.error,
      isSuccess: updateMutation.isSuccess,
      reset: updateMutation.reset
    },
    delete: {
      mutate: deleteMutation.mutate,
      mutateAsync: deleteMutation.mutateAsync,
      isLoading: deleteMutation.isPending,
      error: deleteMutation.error,
      isSuccess: deleteMutation.isSuccess,
      reset: deleteMutation.reset
    }
  }), [createMutation, updateMutation, deleteMutation]);
}

/**
 * Hook for TanStack Virtual table integration for 1000+ services
 * Implements virtual scrolling per Section 5.2 scaling considerations
 */
export function useServiceListVirtualization(containerRef: React.RefObject<HTMLElement>) {
  const { services } = useServiceList();
  const [overscan, setOverscan] = useState(5);
  
  const virtualizer = useVirtual({
    size: services.length,
    parentRef: containerRef,
    estimateSize: useCallback(() => 60, []), // Estimated row height in pixels
    overscan,
  });
  
  const virtualItems = virtualizer.virtualItems;
  const totalSize = virtualizer.totalSize;
  
  // Adjust overscan based on performance
  useEffect(() => {
    if (services.length > 1000) {
      setOverscan(3); // Reduce overscan for very large lists
    } else if (services.length > 500) {
      setOverscan(4);
    } else {
      setOverscan(5);
    }
  }, [services.length]);
  
  return useMemo(() => ({
    virtualItems,
    totalSize,
    virtualizer,
    isVirtualized: services.length > 50, // Only virtualize for larger lists
    getVirtualItem: (index: number): VirtualItem | undefined => 
      virtualItems.find(item => item.index === index),
    scrollToIndex: virtualizer.scrollToIndex,
    scrollToOffset: virtualizer.scrollToOffset
  }), [virtualItems, totalSize, virtualizer, services.length]);
}

/**
 * Hook for managing selected services and bulk operations
 */
export function useServiceListSelection() {
  const store = useServiceListStore();
  const { services } = useServiceList();
  
  const selectAll = useCallback(() => {
    const allIds = new Set(services.map(service => service.id));
    store.setSelectedServices(allIds);
  }, [services, store]);
  
  const selectNone = useCallback(() => {
    store.clearSelection();
  }, [store]);
  
  const selectRange = useCallback((startIndex: number, endIndex: number) => {
    const start = Math.min(startIndex, endIndex);
    const end = Math.max(startIndex, endIndex);
    const rangeIds = new Set<number>();
    
    for (let i = start; i <= end && i < services.length; i++) {
      rangeIds.add(services[i].id);
    }
    
    store.setSelectedServices(rangeIds);
  }, [services, store]);
  
  const toggleSelection = useCallback((id: number) => {
    store.toggleServiceSelection(id);
  }, [store]);
  
  const isSelected = useCallback((id: number) => {
    return store.selectedServices.has(id);
  }, [store.selectedServices]);
  
  const selectedServices = useMemo(() => {
    return services.filter(service => store.selectedServices.has(service.id));
  }, [services, store.selectedServices]);
  
  return useMemo(() => ({
    selectedServices,
    selectedIds: store.selectedServices,
    selectedCount: store.selectedServices.size,
    isAllSelected: services.length > 0 && store.selectedServices.size === services.length,
    isPartialSelected: store.selectedServices.size > 0 && store.selectedServices.size < services.length,
    selectAll,
    selectNone,
    selectRange,
    toggleSelection,
    isSelected
  }), [
    selectedServices,
    store.selectedServices,
    services.length,
    selectAll,
    selectNone,
    selectRange,
    toggleSelection,
    isSelected
  ]);
}

/**
 * Hook for real-time connection testing with SWR
 * Implements SWR caching for connection status per React/Next.js integration requirements
 */
export function useServiceConnectionStatus(serviceId?: number, config?: DatabaseConnectionInput) {
  const [testStatus, setTestStatus] = useState<ConnectionTestStatus>('idle');
  
  // SWR configuration for connection testing
  const swrConfig: SWRConfiguration = {
    revalidateOnFocus: false,
    revalidateOnReconnect: true,
    refreshInterval: 0, // Manual refresh only
    dedupingInterval: 5000, // 5 seconds deduping
    errorRetryCount: 2,
    errorRetryInterval: 1000
  };
  
  // Use SWR for caching connection test results
  const { data: result, error, mutate: revalidate } = useSWR(
    config ? ['connection-test', serviceId, config] : null,
    () => testConnection(config!),
    swrConfig
  );
  
  const test = useCallback(async (testConfig?: DatabaseConnectionInput): Promise<ConnectionTestResult> => {
    const configToTest = testConfig || config;
    if (!configToTest) {
      throw new Error('No configuration provided for testing');
    }
    
    setTestStatus('testing');
    
    try {
      const result = await testConnection(configToTest);
      setTestStatus(result.success ? 'success' : 'error');
      
      // Update SWR cache
      await mutate(['connection-test', serviceId, configToTest], result, false);
      
      return result;
    } catch (err) {
      setTestStatus('error');
      throw err;
    }
  }, [config, serviceId]);
  
  const reset = useCallback(() => {
    setTestStatus('idle');
    void revalidate();
  }, [revalidate]);
  
  return useMemo(() => ({
    result,
    status: testStatus,
    isLoading: testStatus === 'testing',
    error: error as ApiErrorResponse | null,
    test,
    reset,
    revalidate
  }), [result, testStatus, error, test, reset, revalidate]);
}

/**
 * Hook for service list data export functionality
 */
export function useServiceListExport() {
  const { services } = useServiceList();
  const { selectedServices } = useServiceListSelection();
  const [isExporting, setIsExporting] = useState(false);
  
  const exportData = useCallback(async (options: ExportOptions) => {
    setIsExporting(true);
    
    try {
      // Determine which services to export
      const servicesToExport = options.filters 
        ? services // Apply additional filtering if needed
        : selectedServices.length > 0 
          ? selectedServices 
          : services;
      
      // Prepare data for export
      const exportFields = options.includeFields || [
        'id', 'name', 'label', 'description', 'type', 'is_active', 'created_date'
      ];
      
      const exportData = servicesToExport.map(service => {
        const exportItem: Record<string, any> = {};
        exportFields.forEach(field => {
          exportItem[field] = service[field as keyof DatabaseService];
        });
        return exportItem;
      });
      
      // Generate filename
      const timestamp = new Date().toISOString().split('T')[0];
      const filename = options.filename || `database-services-${timestamp}`;
      
      // Export based on format
      switch (options.format) {
        case 'json':
          return exportAsJSON(exportData, filename);
        case 'csv':
          return exportAsCSV(exportData, filename);
        case 'xlsx':
          return exportAsXLSX(exportData, filename);
        default:
          throw new Error(`Unsupported export format: ${options.format}`);
      }
    } finally {
      setIsExporting(false);
    }
  }, [services, selectedServices]);
  
  return useMemo(() => ({
    exportData,
    isExporting,
    availableFormats: ['json', 'csv', 'xlsx'] as ExportFormat[]
  }), [exportData, isExporting]);
}

// =============================================================================
// UTILITY FUNCTIONS FOR EXPORT
// =============================================================================

/**
 * Export data as JSON file
 */
function exportAsJSON(data: any[], filename: string): void {
  const jsonString = JSON.stringify(data, null, 2);
  downloadFile(jsonString, `${filename}.json`, 'application/json');
}

/**
 * Export data as CSV file
 */
function exportAsCSV(data: any[], filename: string): void {
  if (data.length === 0) return;
  
  const headers = Object.keys(data[0]);
  const csvContent = [
    headers.join(','),
    ...data.map(row =>
      headers.map(header => {
        const value = row[header];
        return typeof value === 'string' && value.includes(',')
          ? `"${value.replace(/"/g, '""')}"` // Escape quotes and wrap in quotes if contains comma
          : value;
      }).join(',')
    )
  ].join('\n');
  
  downloadFile(csvContent, `${filename}.csv`, 'text/csv');
}

/**
 * Export data as XLSX file (simplified implementation)
 * Note: In a real implementation, you would use a library like xlsx or exceljs
 */
function exportAsXLSX(data: any[], filename: string): void {
  // For now, fallback to CSV with XLSX extension
  // In production, implement with proper XLSX library
  exportAsCSV(data, filename.replace('.xlsx', ''));
  console.warn('XLSX export not fully implemented, exported as CSV instead');
}

/**
 * Utility function to trigger file download
 */
function downloadFile(content: string, filename: string, mimeType: string): void {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  
  URL.revokeObjectURL(url);
}

// =============================================================================
// COMPOUND HOOK FOR COMPLETE SERVICE LIST FUNCTIONALITY
// =============================================================================

/**
 * Compound hook that provides complete service list functionality
 * Combines all individual hooks for convenient usage
 */
export function useServiceListComplete(options?: {
  enabled?: boolean;
  enableVirtualization?: boolean;
  containerRef?: React.RefObject<HTMLElement>;
}) {
  const serviceList = useServiceList({ enabled: options?.enabled });
  const filters = useServiceListFilters();
  const mutations = useServiceListMutations();
  const selection = useServiceListSelection();
  const exportHook = useServiceListExport();
  
  // Only use virtualization if enabled and containerRef provided
  const virtualization = useServiceListVirtualization(
    options?.containerRef || { current: null }
  );
  
  return useMemo(() => ({
    // Service list data
    ...serviceList,
    
    // Filtering
    filters: filters.filters,
    updateFilters: filters.updateFilters,
    resetFilters: filters.resetFilters,
    setSearch: filters.setSearch,
    setTypes: filters.setTypes,
    setStatuses: filters.setStatuses,
    setSorting: filters.setSorting,
    
    // CRUD operations
    mutations,
    
    // Selection management
    selection,
    
    // Export functionality
    export: exportHook,
    
    // Virtualization (only if enabled)
    ...(options?.enableVirtualization && options?.containerRef ? { virtualization } : {})
  }), [
    serviceList,
    filters,
    mutations,
    selection,
    exportHook,
    virtualization,
    options?.enableVirtualization,
    options?.containerRef
  ]);
}

// =============================================================================
// EXPORTS
// =============================================================================

// Export individual hooks
export {
  useServiceList,
  useServiceListFilters,
  useServiceListMutations,
  useServiceListVirtualization,
  useServiceListSelection,
  useServiceConnectionStatus,
  useServiceListExport
};

// Export store
export { useServiceListStore };

// Export types
export type {
  ServiceListFilters,
  ServiceListPagination,
  ServiceListQuery,
  ServiceListResponse,
  ServiceListState,
  ServiceListActions,
  ServiceListStore,
  ExportFormat,
  ExportOptions
};