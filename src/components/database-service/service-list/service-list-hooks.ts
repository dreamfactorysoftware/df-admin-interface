/**
 * Database Service List Hooks
 * 
 * Custom React hooks for database service list data fetching, state management, and operations.
 * Implements SWR and React Query hooks for service listing, filtering, sorting, and CRUD operations.
 * Provides hooks for service list state management, table virtualization, and real-time data synchronization.
 * 
 * Key Features:
 * - React Query with TTL configuration (staleTime: 300s, cacheTime: 900s) per Section 5.2
 * - SWR for real-time connection testing and status monitoring
 * - TanStack Virtual integration for large service lists (1000+ services)
 * - Zustand store integration for persistent service list state management
 * - Optimistic updates and comprehensive error handling
 * - Bulk operations with conflict resolution
 * 
 * @fileoverview Service list management hooks for React/Next.js application
 * @version 1.0.0
 * @since React 19.0.0, Next.js 15.1+, TypeScript 5.8+
 */

import { useCallback, useMemo, useRef, useState, useEffect } from 'react';
import { useVirtualizer, type Virtualizer } from '@tanstack/react-virtual';
import { 
  useQuery, 
  useMutation, 
  useQueryClient, 
  useInfiniteQuery,
  type UseQueryResult,
  type UseMutationResult,
  type InfiniteData 
} from '@tanstack/react-query';
import useSWR, { type SWRResponse } from 'swr';
import { create } from 'zustand';
import { persist, subscribeWithSelector } from 'zustand/middleware';
import { apiClient, type ApiResponse } from '../../../lib/api-client';

// Types imports
import type {
  DatabaseService,
  DatabaseConnectionInput,
  DatabaseConnectionFormData,
  ConnectionTestResult,
  GenericListResponse,
  ApiErrorResponse,
  ServiceQueryParams,
  ServiceListFilters,
  ServiceListSort,
  ServiceListState,
  ServiceListActions,
  ServiceListQueryOptions,
  ServiceListMutationOptions,
  UseServiceListReturn,
  BulkActionType,
  BulkActionInput,
  VirtualizationConfig,
  PaginationConfig,
  DatabaseServiceQueryKeys,
} from '../types';

import type {
  ServiceListFiltersInput,
  ServiceListSortInput,
  PaginationParamsInput,
  ServiceListQueryKeys as ListQueryKeys,
} from './service-list-types';

// =============================================================================
// QUERY KEYS AND CACHE CONFIGURATION
// =============================================================================

/**
 * React Query cache configuration following Section 5.2 requirements
 * staleTime: 300 seconds (5 minutes)
 * cacheTime: 900 seconds (15 minutes)
 */
const CACHE_CONFIG = {
  staleTime: 5 * 60 * 1000, // 300 seconds
  cacheTime: 15 * 60 * 1000, // 900 seconds
  refetchOnWindowFocus: false,
  refetchOnReconnect: true,
  retry: (failureCount: number, error: any) => {
    // Don't retry on 4xx errors except 408 (timeout)
    if (error?.response?.status >= 400 && error?.response?.status < 500 && error?.response?.status !== 408) {
      return false;
    }
    return failureCount < 3;
  },
  retryDelay: (attemptIndex: number) => Math.min(1000 * 2 ** attemptIndex, 30000),
} as const;

/**
 * SWR configuration for real-time connection testing
 */
const SWR_CONFIG = {
  refreshInterval: 30000, // 30 seconds for real-time monitoring
  revalidateOnFocus: true,
  revalidateOnReconnect: true,
  dedupingInterval: 5000, // 5 seconds
  errorRetryCount: 2,
  errorRetryInterval: 3000,
  fallbackData: null,
} as const;

/**
 * Query keys factory for service list operations
 */
export const serviceListQueryKeys = {
  all: ['service-list'] as const,
  lists: () => [...serviceListQueryKeys.all, 'list'] as const,
  list: (params?: ServiceListFiltersInput & ServiceListSortInput & PaginationParamsInput) => 
    [...serviceListQueryKeys.lists(), params] as const,
  infinite: (params?: ServiceListFiltersInput & ServiceListSortInput) =>
    [...serviceListQueryKeys.lists(), 'infinite', params] as const,
  details: () => [...serviceListQueryKeys.all, 'detail'] as const,
  detail: (id: number) => [...serviceListQueryKeys.details(), id] as const,
  connectionTests: () => [...serviceListQueryKeys.all, 'connection-test'] as const,
  connectionTest: (id: number) => [...serviceListQueryKeys.connectionTests(), id] as const,
  bulkActions: () => [...serviceListQueryKeys.all, 'bulk-action'] as const,
  bulkAction: (action: BulkActionType) => [...serviceListQueryKeys.bulkActions(), action] as const,
  export: (params?: ServiceListFiltersInput) => [...serviceListQueryKeys.all, 'export', params] as const,
} as const;

// =============================================================================
// ZUSTAND STORE FOR SERVICE LIST STATE MANAGEMENT
// =============================================================================

/**
 * Service list state store with persistence
 * Manages service list state, filters, sorting, pagination, and selection
 */
interface ServiceListStore extends ServiceListState, ServiceListActions {}

export const useServiceListStore = create<ServiceListStore>()(
  subscribeWithSelector(
    persist(
      (set, get) => ({
        // Initial state
        services: [],
        filteredServices: [],
        selectedServices: new Set<number>(),
        filters: {
          search: '',
          type: [],
          status: [],
          tier: [],
          isActive: undefined,
          hasErrors: undefined,
          tags: [],
          customFilters: {},
        },
        sorting: {
          field: 'name',
          direction: 'asc',
        },
        pagination: {
          currentPage: 1,
          pageSize: 20,
          totalItems: 0,
        },
        virtualization: {
          enabled: false,
          scrollOffset: 0,
          visibleRange: [0, 0],
        },
        ui: {
          loading: false,
          error: null,
          refreshing: false,
          bulkActionInProgress: false,
          selectedBulkAction: null,
        },
        preferences: {
          defaultPageSize: 20,
          defaultSort: { field: 'name', direction: 'asc' },
          defaultFilters: {},
          columnVisibility: {},
          columnOrder: [],
          columnWidths: {},
          compactMode: false,
          autoRefresh: false,
          refreshInterval: 30000,
        },

        // Data management actions
        setServices: (services: DatabaseService[]) => 
          set({ services }, false, 'setServices'),

        addService: (service: DatabaseService) =>
          set((state) => ({ 
            services: [...state.services, service] 
          }), false, 'addService'),

        updateService: (id: number, updates: Partial<DatabaseService>) =>
          set((state) => ({
            services: state.services.map(service => 
              service.id === id ? { ...service, ...updates } : service
            )
          }), false, 'updateService'),

        removeService: (id: number) =>
          set((state) => ({
            services: state.services.filter(service => service.id !== id),
            selectedServices: new Set([...state.selectedServices].filter(sid => sid !== id))
          }), false, 'removeService'),

        refreshServices: async () => {
          set((state) => ({ ui: { ...state.ui, refreshing: true } }), false, 'refreshServices:start');
          try {
            // This will be handled by React Query refetch
            return Promise.resolve();
          } finally {
            set((state) => ({ ui: { ...state.ui, refreshing: false } }), false, 'refreshServices:end');
          }
        },

        // Selection management
        setSelectedServices: (selectedIds: Set<number>) =>
          set({ selectedServices: selectedIds }, false, 'setSelectedServices'),

        selectService: (id: number) =>
          set((state) => ({
            selectedServices: new Set([...state.selectedServices, id])
          }), false, 'selectService'),

        deselectService: (id: number) =>
          set((state) => {
            const newSelected = new Set(state.selectedServices);
            newSelected.delete(id);
            return { selectedServices: newSelected };
          }, false, 'deselectService'),

        selectAll: () =>
          set((state) => ({
            selectedServices: new Set(state.filteredServices.map(s => s.id))
          }), false, 'selectAll'),

        deselectAll: () =>
          set({ selectedServices: new Set<number>() }, false, 'deselectAll'),

        selectFiltered: () =>
          set((state) => ({
            selectedServices: new Set(state.filteredServices.map(s => s.id))
          }), false, 'selectFiltered'),

        // Filtering and sorting
        setFilters: (filters: ServiceListFilters) => {
          set({ filters }, false, 'setFilters');
          get().applyFiltersAndSort();
        },

        updateFilter: (key: keyof ServiceListFilters, value: any) => {
          set((state) => ({
            filters: { ...state.filters, [key]: value }
          }), false, 'updateFilter');
          get().applyFiltersAndSort();
        },

        clearFilters: () => {
          set({ filters: get().preferences.defaultFilters }, false, 'clearFilters');
          get().applyFiltersAndSort();
        },

        setSorting: (sorting: ServiceListSort) => {
          set({ sorting }, false, 'setSorting');
          get().applyFiltersAndSort();
        },

        // Pagination
        setCurrentPage: (page: number) =>
          set((state) => ({
            pagination: { ...state.pagination, currentPage: page }
          }), false, 'setCurrentPage'),

        setPageSize: (pageSize: number) =>
          set((state) => ({
            pagination: { ...state.pagination, pageSize, currentPage: 1 }
          }), false, 'setPageSize'),

        goToPage: (page: number) =>
          set((state) => ({
            pagination: { ...state.pagination, currentPage: page }
          }), false, 'goToPage'),

        nextPage: () =>
          set((state) => {
            const totalPages = Math.ceil(state.pagination.totalItems / state.pagination.pageSize);
            const nextPage = Math.min(state.pagination.currentPage + 1, totalPages);
            return {
              pagination: { ...state.pagination, currentPage: nextPage }
            };
          }, false, 'nextPage'),

        previousPage: () =>
          set((state) => ({
            pagination: { 
              ...state.pagination, 
              currentPage: Math.max(state.pagination.currentPage - 1, 1) 
            }
          }), false, 'previousPage'),

        // Virtualization
        setVirtualization: (enabled: boolean) =>
          set((state) => ({
            virtualization: { ...state.virtualization, enabled }
          }), false, 'setVirtualization'),

        updateScrollOffset: (offset: number) =>
          set((state) => ({
            virtualization: { ...state.virtualization, scrollOffset: offset }
          }), false, 'updateScrollOffset'),

        updateVisibleRange: (range: [number, number]) =>
          set((state) => ({
            virtualization: { ...state.virtualization, visibleRange: range }
          }), false, 'updateVisibleRange'),

        // UI state
        setLoading: (loading: boolean) =>
          set((state) => ({
            ui: { ...state.ui, loading }
          }), false, 'setLoading'),

        setError: (error: ApiErrorResponse | null) =>
          set((state) => ({
            ui: { ...state.ui, error }
          }), false, 'setError'),

        setRefreshing: (refreshing: boolean) =>
          set((state) => ({
            ui: { ...state.ui, refreshing }
          }), false, 'setRefreshing'),

        setBulkActionInProgress: (inProgress: boolean) =>
          set((state) => ({
            ui: { ...state.ui, bulkActionInProgress: inProgress }
          }), false, 'setBulkActionInProgress'),

        setSelectedBulkAction: (action: BulkActionType | null) =>
          set((state) => ({
            ui: { ...state.ui, selectedBulkAction: action }
          }), false, 'setSelectedBulkAction'),

        // Bulk actions
        executeBulkAction: async (action: BulkActionType, serviceIds: number[]) => {
          set((state) => ({ 
            ui: { 
              ...state.ui, 
              bulkActionInProgress: true, 
              selectedBulkAction: action 
            } 
          }), false, 'executeBulkAction:start');

          try {
            // Implementation will be handled by mutation hooks
            return Promise.resolve();
          } finally {
            set((state) => ({ 
              ui: { 
                ...state.ui, 
                bulkActionInProgress: false, 
                selectedBulkAction: null 
              } 
            }), false, 'executeBulkAction:end');
          }
        },

        // Preferences
        updatePreferences: (preferences: Partial<ServiceListState['preferences']>) =>
          set((state) => ({
            preferences: { ...state.preferences, ...preferences }
          }), false, 'updatePreferences'),

        resetPreferences: () =>
          set({
            preferences: {
              defaultPageSize: 20,
              defaultSort: { field: 'name', direction: 'asc' },
              defaultFilters: {},
              columnVisibility: {},
              columnOrder: [],
              columnWidths: {},
              compactMode: false,
              autoRefresh: false,
              refreshInterval: 30000,
            }
          }, false, 'resetPreferences'),

        // Utility actions
        applyFiltersAndSort: () => {
          const state = get();
          let filtered = [...state.services];

          // Apply filters
          const { filters } = state;
          
          if (filters.search) {
            const searchTerm = filters.search.toLowerCase();
            filtered = filtered.filter(service => 
              service.name.toLowerCase().includes(searchTerm) ||
              service.label?.toLowerCase().includes(searchTerm) ||
              service.description?.toLowerCase().includes(searchTerm)
            );
          }

          if (filters.type && filters.type.length > 0) {
            filtered = filtered.filter(service => filters.type!.includes(service.type));
          }

          if (filters.status && filters.status.length > 0) {
            filtered = filtered.filter(service => 
              filters.status!.includes(service.is_active ? 'active' : 'inactive')
            );
          }

          if (filters.isActive !== undefined) {
            filtered = filtered.filter(service => service.is_active === filters.isActive);
          }

          if (filters.hasErrors) {
            filtered = filtered.filter(service => 
              service.last_modified_date && new Date(service.last_modified_date) < new Date(Date.now() - 24 * 60 * 60 * 1000)
            );
          }

          if (filters.tags && filters.tags.length > 0) {
            // Assuming services have a tags field
            filtered = filtered.filter(service => 
              filters.tags!.some(tag => (service as any).tags?.includes(tag))
            );
          }

          // Apply sorting
          const { sorting } = state;
          filtered.sort((a, b) => {
            const aValue = a[sorting.field as keyof DatabaseService];
            const bValue = b[sorting.field as keyof DatabaseService];
            
            if (aValue === undefined || aValue === null) return 1;
            if (bValue === undefined || bValue === null) return -1;
            
            let comparison = 0;
            if (typeof aValue === 'string' && typeof bValue === 'string') {
              comparison = aValue.localeCompare(bValue);
            } else if (typeof aValue === 'number' && typeof bValue === 'number') {
              comparison = aValue - bValue;
            } else if (aValue instanceof Date && bValue instanceof Date) {
              comparison = aValue.getTime() - bValue.getTime();
            } else {
              comparison = String(aValue).localeCompare(String(bValue));
            }
            
            return sorting.direction === 'desc' ? -comparison : comparison;
          });

          // Update pagination total
          const totalItems = filtered.length;
          const totalPages = Math.ceil(totalItems / state.pagination.pageSize);
          const currentPage = Math.min(state.pagination.currentPage, Math.max(totalPages, 1));

          set({
            filteredServices: filtered,
            pagination: {
              ...state.pagination,
              totalItems,
              currentPage,
            }
          }, false, 'applyFiltersAndSort');
        },

        resetState: () =>
          set({
            services: [],
            filteredServices: [],
            selectedServices: new Set<number>(),
            filters: get().preferences.defaultFilters,
            sorting: get().preferences.defaultSort,
            pagination: { currentPage: 1, pageSize: get().preferences.defaultPageSize, totalItems: 0 },
            virtualization: { enabled: false, scrollOffset: 0, visibleRange: [0, 0] },
            ui: { loading: false, error: null, refreshing: false, bulkActionInProgress: false, selectedBulkAction: null },
          }, false, 'resetState'),
      }),
      {
        name: 'service-list-store',
        partialize: (state) => ({
          filters: state.filters,
          sorting: state.sorting,
          preferences: state.preferences,
          pagination: { 
            pageSize: state.pagination.pageSize 
          },
        }),
      }
    )
  )
);

// =============================================================================
// MAIN SERVICE LIST HOOK
// =============================================================================

/**
 * Main service list hook with React Query integration
 * Provides paginated service data fetching with intelligent caching
 */
export function useServiceList(options?: ServiceListQueryOptions): UseServiceListReturn {
  const queryClient = useQueryClient();
  const store = useServiceListStore();
  
  // Build query parameters from store state
  const queryParams = useMemo(() => ({
    page: store.pagination.currentPage,
    pageSize: store.pagination.pageSize,
    search: store.filters.search || undefined,
    type: store.filters.type?.length ? store.filters.type : undefined,
    status: store.filters.status?.length ? store.filters.status : undefined,
    sortBy: store.sorting.field,
    sortOrder: store.sorting.direction,
    ...options?.filters,
    ...options?.sorting,
    ...options?.pagination,
  }), [store.filters, store.sorting, store.pagination, options]);

  // Main service list query
  const query = useQuery({
    queryKey: serviceListQueryKeys.list(queryParams),
    queryFn: async (): Promise<GenericListResponse<DatabaseService>> => {
      const response = await apiClient.get<GenericListResponse<DatabaseService>>(
        '/system/service',
        {
          headers: {
            'X-Include-Count': 'true',
          },
        }
      );
      
      if (!response.success && response.error) {
        throw new Error(response.error.message || 'Failed to fetch services');
      }
      
      return response.data || response.resource || { resource: [], meta: { count: 0 } };
    },
    ...CACHE_CONFIG,
    ...options,
    onSuccess: (data) => {
      const services = Array.isArray(data.resource) ? data.resource : [];
      store.setServices(services);
      
      // Update pagination with actual total count
      if (data.meta?.count !== undefined) {
        store.setCurrentPage(store.pagination.currentPage);
      }
      
      options?.onSuccess?.(data);
    },
    onError: (error) => {
      store.setError(error as ApiErrorResponse);
      options?.onError?.(error as ApiErrorResponse);
    },
  });

  // Create mutations for CRUD operations
  const createMutation = useMutation({
    mutationFn: async (data: DatabaseConnectionInput): Promise<DatabaseService> => {
      const response = await apiClient.post<DatabaseService>('/system/service', data);
      if (!response.success && response.error) {
        throw new Error(response.error.message || 'Failed to create service');
      }
      return response.data || response.resource!;
    },
    onMutate: async (newService) => {
      await queryClient.cancelQueries({ queryKey: serviceListQueryKeys.lists() });
      const previousServices = queryClient.getQueryData(serviceListQueryKeys.list(queryParams));
      
      // Optimistic update
      const optimisticService: DatabaseService = {
        id: Date.now(), // Temporary ID
        name: newService.name,
        label: newService.label || newService.name,
        description: newService.description,
        type: newService.type,
        is_active: newService.is_active ?? true,
        created_date: new Date().toISOString(),
        last_modified_date: new Date().toISOString(),
        created_by_id: 1,
        last_modified_by_id: 1,
        ...newService,
      };
      
      store.addService(optimisticService);
      return { previousServices, optimisticService };
    },
    onError: (error, newService, context) => {
      if (context?.optimisticService) {
        store.removeService(context.optimisticService.id);
      }
      store.setError(error as ApiErrorResponse);
    },
    onSuccess: (data, variables, context) => {
      if (context?.optimisticService) {
        store.removeService(context.optimisticService.id);
      }
      store.addService(data);
      queryClient.invalidateQueries({ queryKey: serviceListQueryKeys.lists() });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: Partial<DatabaseConnectionInput> }): Promise<DatabaseService> => {
      const response = await apiClient.put<DatabaseService>(`/system/service/${id}`, data);
      if (!response.success && response.error) {
        throw new Error(response.error.message || 'Failed to update service');
      }
      return response.data || response.resource!;
    },
    onMutate: async ({ id, data }) => {
      await queryClient.cancelQueries({ queryKey: serviceListQueryKeys.lists() });
      const previousService = store.services.find(s => s.id === id);
      
      if (previousService) {
        store.updateService(id, { ...data, last_modified_date: new Date().toISOString() });
      }
      
      return { previousService };
    },
    onError: (error, { id }, context) => {
      if (context?.previousService) {
        store.updateService(id, context.previousService);
      }
      store.setError(error as ApiErrorResponse);
    },
    onSuccess: (data) => {
      store.updateService(data.id, data);
      queryClient.invalidateQueries({ queryKey: serviceListQueryKeys.lists() });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number): Promise<void> => {
      const response = await apiClient.delete(`/system/service/${id}`);
      if (!response.success && response.error) {
        throw new Error(response.error.message || 'Failed to delete service');
      }
    },
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: serviceListQueryKeys.lists() });
      const previousService = store.services.find(s => s.id === id);
      
      store.removeService(id);
      return { previousService };
    },
    onError: (error, id, context) => {
      if (context?.previousService) {
        store.addService(context.previousService);
      }
      store.setError(error as ApiErrorResponse);
    },
    onSuccess: (data, id) => {
      queryClient.invalidateQueries({ queryKey: serviceListQueryKeys.lists() });
    },
  });

  const deleteMultipleMutation = useMutation({
    mutationFn: async (ids: number[]): Promise<void> => {
      await Promise.all(ids.map(id => 
        apiClient.delete(`/system/service/${id}`)
      ));
    },
    onMutate: async (ids) => {
      await queryClient.cancelQueries({ queryKey: serviceListQueryKeys.lists() });
      const previousServices = ids.map(id => store.services.find(s => s.id === id)).filter(Boolean);
      
      ids.forEach(id => store.removeService(id));
      return { previousServices };
    },
    onError: (error, ids, context) => {
      context?.previousServices?.forEach(service => {
        if (service) store.addService(service);
      });
      store.setError(error as ApiErrorResponse);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: serviceListQueryKeys.lists() });
    },
  });

  const testConnectionMutation = useMutation({
    mutationFn: async ({ id, config }: { id: number; config?: any }): Promise<ConnectionTestResult> => {
      const response = await apiClient.post<ConnectionTestResult>(
        `/system/service/${id}/_schema`,
        config || {}
      );
      if (!response.success && response.error) {
        throw new Error(response.error.message || 'Connection test failed');
      }
      return response.data || response.resource!;
    },
  });

  const toggleServiceMutation = useMutation({
    mutationFn: async ({ id, active }: { id: number; active: boolean }): Promise<DatabaseService> => {
      const response = await apiClient.patch<DatabaseService>(`/system/service/${id}`, {
        is_active: active,
      });
      if (!response.success && response.error) {
        throw new Error(response.error.message || 'Failed to toggle service');
      }
      return response.data || response.resource!;
    },
    onSuccess: (data) => {
      store.updateService(data.id, data);
      queryClient.invalidateQueries({ queryKey: serviceListQueryKeys.lists() });
    },
  });

  const duplicateServiceMutation = useMutation({
    mutationFn: async (id: number): Promise<DatabaseService> => {
      const original = store.services.find(s => s.id === id);
      if (!original) {
        throw new Error('Service not found');
      }

      const duplicateData = {
        ...original,
        name: `${original.name}_copy`,
        label: `${original.label || original.name} (Copy)`,
      };
      delete (duplicateData as any).id;
      delete (duplicateData as any).created_date;
      delete (duplicateData as any).last_modified_date;

      const response = await apiClient.post<DatabaseService>('/system/service', duplicateData);
      if (!response.success && response.error) {
        throw new Error(response.error.message || 'Failed to duplicate service');
      }
      return response.data || response.resource!;
    },
    onSuccess: (data) => {
      store.addService(data);
      queryClient.invalidateQueries({ queryKey: serviceListQueryKeys.lists() });
    },
  });

  // Refresh function
  const refresh = useCallback(async () => {
    store.setRefreshing(true);
    try {
      const result = await query.refetch();
      return result;
    } finally {
      store.setRefreshing(false);
    }
  }, [query, store]);

  return {
    // Data
    services: store.filteredServices,
    filteredServices: store.filteredServices,
    totalCount: store.pagination.totalItems,

    // Query state
    isLoading: query.isLoading,
    isError: query.isError,
    isFetching: query.isFetching,
    isRefetching: query.isRefetching,
    error: query.error as ApiErrorResponse | null,

    // Actions
    refetch: query.refetch,
    refresh,

    // Mutations
    createService: createMutation,
    updateService: updateMutation,
    deleteService: deleteMutation,
    deleteServices: deleteMultipleMutation,
    testConnection: testConnectionMutation,
    toggleService: toggleServiceMutation,
    duplicateService: duplicateServiceMutation,

    // Query keys for cache management
    queryKeys: {
      list: serviceListQueryKeys.list(queryParams),
      detail: (id: number) => serviceListQueryKeys.detail(id),
      connectionTest: (id: number) => serviceListQueryKeys.connectionTest(id),
    },
  };
}

// =============================================================================
// SERVICE LIST FILTERS HOOK
// =============================================================================

/**
 * Hook for managing service list filters and search parameters
 */
export function useServiceListFilters() {
  const store = useServiceListStore();
  
  const setFilters = useCallback((filters: ServiceListFilters) => {
    store.setFilters(filters);
  }, [store]);

  const updateFilter = useCallback((key: keyof ServiceListFilters, value: any) => {
    store.updateFilter(key, value);
  }, [store]);

  const clearFilters = useCallback(() => {
    store.clearFilters();
  }, [store]);

  const setSearch = useCallback((search: string) => {
    store.updateFilter('search', search);
  }, [store]);

  const setTypeFilter = useCallback((types: string[]) => {
    store.updateFilter('type', types);
  }, [store]);

  const setStatusFilter = useCallback((statuses: string[]) => {
    store.updateFilter('status', statuses);
  }, [store]);

  const setSorting = useCallback((sorting: ServiceListSort) => {
    store.setSorting(sorting);
  }, [store]);

  return {
    filters: store.filters,
    sorting: store.sorting,
    setFilters,
    updateFilter,
    clearFilters,
    setSearch,
    setTypeFilter,
    setStatusFilter,
    setSorting,
  };
}

// =============================================================================
// SERVICE LIST MUTATIONS HOOK
// =============================================================================

/**
 * Hook for service list CRUD operations with optimistic updates
 */
export function useServiceListMutations() {
  const queryClient = useQueryClient();
  const store = useServiceListStore();

  const bulkActionMutation = useMutation({
    mutationFn: async ({ action, serviceIds, parameters }: BulkActionInput): Promise<void> => {
      store.setBulkActionInProgress(true);
      store.setSelectedBulkAction(action);

      try {
        switch (action) {
          case 'activate':
            await Promise.all(serviceIds.map(id => 
              apiClient.patch(`/system/service/${id}`, { is_active: true })
            ));
            break;
          case 'deactivate':
            await Promise.all(serviceIds.map(id => 
              apiClient.patch(`/system/service/${id}`, { is_active: false })
            ));
            break;
          case 'delete':
            await Promise.all(serviceIds.map(id => 
              apiClient.delete(`/system/service/${id}`)
            ));
            break;
          case 'test':
            await Promise.all(serviceIds.map(id => 
              apiClient.post(`/system/service/${id}/_schema`)
            ));
            break;
          default:
            throw new Error(`Unsupported bulk action: ${action}`);
        }
      } finally {
        store.setBulkActionInProgress(false);
        store.setSelectedBulkAction(null);
      }
    },
    onSuccess: (data, { action, serviceIds }) => {
      // Update services based on action
      switch (action) {
        case 'activate':
          serviceIds.forEach(id => {
            store.updateService(id, { is_active: true });
          });
          break;
        case 'deactivate':
          serviceIds.forEach(id => {
            store.updateService(id, { is_active: false });
          });
          break;
        case 'delete':
          serviceIds.forEach(id => {
            store.removeService(id);
          });
          break;
      }
      
      queryClient.invalidateQueries({ queryKey: serviceListQueryKeys.lists() });
      store.deselectAll();
    },
    onError: (error) => {
      store.setError(error as ApiErrorResponse);
    },
  });

  return {
    bulkAction: bulkActionMutation,
    isBulkActionInProgress: store.ui.bulkActionInProgress,
    selectedBulkAction: store.ui.selectedBulkAction,
  };
}

// =============================================================================
// SERVICE LIST VIRTUALIZATION HOOK
// =============================================================================

/**
 * Hook for TanStack Virtual table integration
 * Optimized for large service lists (1000+ services) per Section 5.2
 */
export function useServiceListVirtualization(config: VirtualizationConfig) {
  const store = useServiceListStore();
  const scrollElementRef = useRef<HTMLDivElement>(null);

  const virtualizer = useVirtualizer({
    count: store.filteredServices.length,
    getScrollElement: () => scrollElementRef.current,
    estimateSize: () => config.estimateSize || 60,
    overscan: config.overscan || 10,
    measureElement: config.measureElement,
    initialOffset: config.initialOffset || 0,
    scrollMargin: config.scrollMargin || 0,
    lanes: config.lanes || 1,
    horizontal: config.horizontal || false,
    debug: config.debug || false,
  });

  // Update store with virtualization state
  useEffect(() => {
    const visibleItems = virtualizer.getVirtualItems();
    if (visibleItems.length > 0) {
      const visibleRange: [number, number] = [
        visibleItems[0].index,
        visibleItems[visibleItems.length - 1].index,
      ];
      store.updateVisibleRange(visibleRange);
    }
  }, [virtualizer.getVirtualItems(), store]);

  // Update scroll offset
  useEffect(() => {
    store.updateScrollOffset(virtualizer.scrollOffset || 0);
  }, [virtualizer.scrollOffset, store]);

  const scrollToIndex = useCallback((index: number, options?: { align?: 'start' | 'center' | 'end' | 'auto' }) => {
    virtualizer.scrollToIndex(index, options);
  }, [virtualizer]);

  const scrollToOffset = useCallback((offset: number) => {
    virtualizer.scrollToOffset(offset);
  }, [virtualizer]);

  const scrollBy = useCallback((delta: number) => {
    if (scrollElementRef.current) {
      scrollElementRef.current.scrollTop += delta;
    }
  }, []);

  return {
    virtualizer,
    scrollElementRef,
    scrollToIndex,
    scrollToOffset,
    scrollBy,
    totalSize: virtualizer.getTotalSize(),
    virtualItems: virtualizer.getVirtualItems(),
    visibleRange: store.virtualization.visibleRange,
    isEnabled: config.enabled,
  };
}

// =============================================================================
// SERVICE LIST SELECTION HOOK
// =============================================================================

/**
 * Hook for managing service selection and bulk operations
 */
export function useServiceListSelection() {
  const store = useServiceListStore();

  const isSelected = useCallback((id: number) => {
    return store.selectedServices.has(id);
  }, [store.selectedServices]);

  const isAllSelected = useMemo(() => {
    if (store.filteredServices.length === 0) return false;
    return store.filteredServices.every(service => store.selectedServices.has(service.id));
  }, [store.filteredServices, store.selectedServices]);

  const isIndeterminate = useMemo(() => {
    const selectedCount = store.filteredServices.filter(service => 
      store.selectedServices.has(service.id)
    ).length;
    return selectedCount > 0 && selectedCount < store.filteredServices.length;
  }, [store.filteredServices, store.selectedServices]);

  const selectedCount = useMemo(() => {
    return store.selectedServices.size;
  }, [store.selectedServices]);

  const selectedServices = useMemo(() => {
    return store.services.filter(service => store.selectedServices.has(service.id));
  }, [store.services, store.selectedServices]);

  const toggleSelection = useCallback((id: number) => {
    if (store.selectedServices.has(id)) {
      store.deselectService(id);
    } else {
      store.selectService(id);
    }
  }, [store]);

  const toggleSelectAll = useCallback(() => {
    if (isAllSelected) {
      store.deselectAll();
    } else {
      store.selectAll();
    }
  }, [isAllSelected, store]);

  return {
    selectedServices: store.selectedServices,
    selectedCount,
    selectedServiceObjects: selectedServices,
    isSelected,
    isAllSelected,
    isIndeterminate,
    toggleSelection,
    toggleSelectAll,
    selectAll: store.selectAll,
    deselectAll: store.deselectAll,
    selectFiltered: store.selectFiltered,
  };
}

// =============================================================================
// SERVICE CONNECTION STATUS HOOK (SWR)
// =============================================================================

/**
 * Hook for real-time connection status monitoring using SWR
 */
export function useServiceConnectionStatus(serviceId?: number) {
  const { data, error, isLoading, mutate } = useSWR(
    serviceId ? `/system/service/${serviceId}/status` : null,
    async (url: string) => {
      const response = await apiClient.get<ConnectionTestResult>(url);
      if (!response.success && response.error) {
        throw new Error(response.error.message || 'Failed to check connection status');
      }
      return response.data || response.resource;
    },
    {
      ...SWR_CONFIG,
      refreshInterval: serviceId ? SWR_CONFIG.refreshInterval : 0,
    }
  );

  const testConnection = useCallback(async (config?: any) => {
    if (!serviceId) throw new Error('Service ID is required');
    
    const response = await apiClient.post<ConnectionTestResult>(
      `/system/service/${serviceId}/_schema`,
      config || {}
    );
    
    if (!response.success && response.error) {
      throw new Error(response.error.message || 'Connection test failed');
    }
    
    const result = response.data || response.resource!;
    await mutate(result, false); // Update cache without revalidation
    return result;
  }, [serviceId, mutate]);

  return {
    connectionStatus: data,
    isLoading,
    error: error as ApiErrorResponse | null,
    testConnection,
    refresh: mutate,
  };
}

// =============================================================================
// SERVICE LIST EXPORT HOOK
// =============================================================================

/**
 * Hook for service list data export functionality
 */
export function useServiceListExport() {
  const store = useServiceListStore();

  const exportMutation = useMutation({
    mutationFn: async (format: 'csv' | 'json' | 'xlsx' = 'csv'): Promise<Blob> => {
      const services = store.selectedServices.size > 0 
        ? store.services.filter(s => store.selectedServices.has(s.id))
        : store.filteredServices;

      if (format === 'json') {
        const jsonData = JSON.stringify(services, null, 2);
        return new Blob([jsonData], { type: 'application/json' });
      }

      if (format === 'csv') {
        const headers = ['ID', 'Name', 'Type', 'Host', 'Database', 'Active', 'Created Date'];
        const csvRows = [
          headers.join(','),
          ...services.map(service => [
            service.id,
            `"${service.name}"`,
            service.type,
            `"${(service as any).host || ''}"`,
            `"${(service as any).database || ''}"`,
            service.is_active ? 'Yes' : 'No',
            service.created_date,
          ].join(','))
        ];
        const csvData = csvRows.join('\n');
        return new Blob([csvData], { type: 'text/csv' });
      }

      throw new Error(`Unsupported export format: ${format}`);
    },
    onSuccess: (blob, format) => {
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `database-services-${Date.now()}.${format}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    },
  });

  return {
    exportServices: exportMutation.mutate,
    isExporting: exportMutation.isPending,
    exportError: exportMutation.error as ApiErrorResponse | null,
  };
}

// =============================================================================
// EXPORTS
// =============================================================================

export type {
  ServiceListStore,
  UseServiceListReturn,
};

export {
  serviceListQueryKeys,
  CACHE_CONFIG,
  SWR_CONFIG,
};