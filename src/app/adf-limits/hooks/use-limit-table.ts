/**
 * Comprehensive React hook for limit table data management with SWR integration.
 * 
 * Replaces Angular DfManageLimitsTableComponent patterns with React Query data fetching,
 * intelligent caching, and performance optimization for large datasets. Provides complete
 * table state management including sorting, filtering, pagination, and CRUD operations
 * with cache synchronization and optimistic updates.
 * 
 * Implements SWR-based data fetching with cache hit responses under 50ms per
 * React/Next.js Integration Requirements. Includes comprehensive error handling,
 * loading states, and accessibility support for enterprise-grade applications.
 * 
 * @fileoverview Limit table management hook for React/Next.js DreamFactory admin interface
 * @version 1.0.0
 * @since React 19.0.0 / Next.js 15.1+
 */

import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import useSWR, { mutate } from 'swr';
import { useSearchParams, useRouter } from 'next/navigation';
import { debounce } from 'lodash';
import type { 
  LimitTableRowData,
  LimitConfiguration,
  LimitUsageStats,
  UseLimitsReturn,
  LimitSwrOptions,
  LimitMutationOptions,
  CreateLimitMutationVariables,
  UpdateLimitMutationVariables,
  DeleteLimitMutationVariables
} from '../types';
import type {
  ApiListResponse,
  ApiResourceResponse,
  ApiErrorResponse,
  PaginationMeta
} from '../../types/api';
import { apiGet, apiPost, apiPut, apiDelete } from '../../lib/api-client';

// ============================================================================
// Types and Interfaces
// ============================================================================

/**
 * Table state management interface
 */
interface TableState {
  // Pagination state
  offset: number;
  limit: number;
  
  // Sorting state  
  sortField: keyof LimitTableRowData;
  sortDirection: 'asc' | 'desc';
  
  // Filtering state
  searchQuery: string;
  activeFilter: boolean | undefined;
  limitTypeFilter: string | undefined;
  userFilter: number | undefined;
  serviceFilter: number | undefined;
  roleFilter: number | undefined;
  
  // Selection state
  selectedIds: number[];
  
  // UI state
  isRefreshing: boolean;
  lastRefresh: Date | null;
}

/**
 * Cache configuration for SWR
 */
interface CacheConfig {
  staleTime: number;
  refreshInterval: number;
  revalidateOnFocus: boolean;
  dedupingInterval: number;
}

/**
 * Related data for dropdown options
 */
interface RelatedData {
  services: Array<{ id: number; name: string; type: string }>;
  users: Array<{ id: number; name: string; email: string }>;
  roles: Array<{ id: number; name: string; description?: string }>;
}

/**
 * Hook configuration options
 */
interface UseLimitTableOptions {
  /** Initial page size */
  initialLimit?: number;
  
  /** Enable real-time updates */
  enableRealtimeUpdates?: boolean;
  
  /** Custom cache configuration */
  cacheConfig?: Partial<CacheConfig>;
  
  /** Debounce delay for search input (ms) */
  searchDebounceMs?: number;
  
  /** Enable optimistic updates */
  enableOptimisticUpdates?: boolean;
  
  /** Custom success/error notifications */
  notifications?: {
    onSuccess?: (message: string) => void;
    onError?: (error: string) => void;
  };
}

// ============================================================================
// Default Configuration
// ============================================================================

/**
 * Default cache configuration optimized for React/Next.js Integration Requirements
 */
const DEFAULT_CACHE_CONFIG: CacheConfig = {
  staleTime: 30000, // 30 seconds - cache hit responses under 50ms
  refreshInterval: 60000, // 1 minute for real-time monitoring
  revalidateOnFocus: true,
  dedupingInterval: 2000, // 2 seconds
};

/**
 * Default pagination settings
 */
const DEFAULT_PAGINATION = {
  offset: 0,
  limit: 25,
  sortField: 'name' as keyof LimitTableRowData,
  sortDirection: 'asc' as const,
};

// ============================================================================
// SWR Key Generators and Fetchers
// ============================================================================

/**
 * Generate SWR cache key for limits list
 */
function getLimitsListKey(state: Partial<TableState>): string {
  const params = new URLSearchParams();
  
  if (state.offset !== undefined) params.set('offset', state.offset.toString());
  if (state.limit !== undefined) params.set('limit', state.limit.toString());
  if (state.sortField) params.set('sort', `${state.sortDirection === 'desc' ? '-' : ''}${state.sortField}`);
  if (state.searchQuery) params.set('filter', `name contains "${state.searchQuery}"`);
  if (state.activeFilter !== undefined) params.set('active', state.activeFilter.toString());
  if (state.limitTypeFilter) params.set('limit_type', state.limitTypeFilter);
  if (state.userFilter) params.set('user', state.userFilter.toString());
  if (state.serviceFilter) params.set('service', state.serviceFilter.toString());
  if (state.roleFilter) params.set('role', state.roleFilter.toString());
  
  return `limits-list?${params.toString()}`;
}

/**
 * Fetch limits data with intelligent caching
 */
async function fetchLimits(key: string): Promise<ApiListResponse<LimitTableRowData>> {
  const [, queryString] = key.split('?');
  const endpoint = `/api/v2/system/limit${queryString ? `?${queryString}` : ''}`;
  
  return apiGet<ApiListResponse<LimitTableRowData>>(endpoint, {
    related: 'limit_cache_by_limit_id,user_by_user_id,service_by_service_id,role_by_role_id',
    includeCount: true,
    includeCacheControl: true,
  });
}

/**
 * Fetch related data for dropdowns
 */
async function fetchRelatedData(): Promise<RelatedData> {
  const [servicesRes, usersRes, rolesRes] = await Promise.all([
    apiGet<ApiListResponse<any>>('/api/v2/system/service', { fields: 'id,name,type', limit: 1000 }),
    apiGet<ApiListResponse<any>>('/api/v2/system/user', { fields: 'id,name,email', limit: 1000 }),
    apiGet<ApiListResponse<any>>('/api/v2/system/role', { fields: 'id,name,description', limit: 1000 }),
  ]);
  
  return {
    services: servicesRes.resource || [],
    users: usersRes.resource || [],
    roles: rolesRes.resource || [],
  };
}

/**
 * Fetch limit usage statistics
 */
async function fetchLimitUsage(limitId: number): Promise<LimitUsageStats> {
  return apiGet<ApiResourceResponse<LimitUsageStats>>(`/api/v2/system/limit/${limitId}/usage`)
    .then(response => response.resource);
}

// ============================================================================
// Main Hook Implementation
// ============================================================================

/**
 * Comprehensive limit table management hook
 * 
 * Provides SWR-based data fetching, table state management, and CRUD operations
 * with intelligent caching and performance optimization for large datasets.
 * 
 * @param options Hook configuration options
 * @returns Complete table management interface
 */
export function useLimitTable(options: UseLimitTableOptions = {}): UseLimitsReturn {
  const router = useRouter();
  const [searchParams, setSearchParams] = useSearchParams();
  
  // Configuration with defaults
  const config = useMemo(() => ({
    initialLimit: options.initialLimit || DEFAULT_PAGINATION.limit,
    enableRealtimeUpdates: options.enableRealtimeUpdates ?? true,
    cacheConfig: { ...DEFAULT_CACHE_CONFIG, ...options.cacheConfig },
    searchDebounceMs: options.searchDebounceMs || 300,
    enableOptimisticUpdates: options.enableOptimisticUpdates ?? true,
    notifications: options.notifications,
  }), [options]);
  
  // ============================================================================
  // State Management
  // ============================================================================
  
  /**
   * Initialize table state from URL parameters
   */
  const [tableState, setTableState] = useState<TableState>(() => {
    const offset = parseInt(searchParams.get('offset') || '0', 10);
    const limit = parseInt(searchParams.get('limit') || config.initialLimit.toString(), 10);
    const sortParam = searchParams.get('sort') || 'name';
    const sortDirection = sortParam.startsWith('-') ? 'desc' : 'asc';
    const sortField = sortParam.replace(/^-/, '') as keyof LimitTableRowData;
    
    return {
      offset,
      limit,
      sortField,
      sortDirection,
      searchQuery: searchParams.get('search') || '',
      activeFilter: searchParams.get('active') ? searchParams.get('active') === 'true' : undefined,
      limitTypeFilter: searchParams.get('limit_type') || undefined,
      userFilter: searchParams.get('user') ? parseInt(searchParams.get('user')!, 10) : undefined,
      serviceFilter: searchParams.get('service') ? parseInt(searchParams.get('service')!, 10) : undefined,
      roleFilter: searchParams.get('role') ? parseInt(searchParams.get('role')!, 10) : undefined,
      selectedIds: [],
      isRefreshing: false,
      lastRefresh: null,
    };
  });
  
  // Refs for performance optimization
  const abortControllerRef = useRef<AbortController | null>(null);
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  // ============================================================================
  // SWR Data Fetching
  // ============================================================================
  
  /**
   * Generate SWR key for current table state
   */
  const swrKey = useMemo(() => getLimitsListKey(tableState), [tableState]);
  
  /**
   * Main limits data fetching with SWR
   */
  const {
    data: limitsResponse,
    error: limitsError,
    isLoading: limitsLoading,
    mutate: mutateLimits,
  } = useSWR<ApiListResponse<LimitTableRowData>, Error>(
    swrKey,
    fetchLimits,
    {
      refreshInterval: config.enableRealtimeUpdates ? config.cacheConfig.refreshInterval : 0,
      revalidateOnFocus: config.cacheConfig.revalidateOnFocus,
      dedupingInterval: config.cacheConfig.dedupingInterval,
      onError: (error) => {
        console.error('Failed to fetch limits:', error);
        config.notifications?.onError?.(`Failed to load limits: ${error.message}`);
      },
    }
  );
  
  /**
   * Related data fetching for dropdown options
   */
  const {
    data: relatedData,
    error: relatedError,
    isLoading: relatedLoading,
  } = useSWR<RelatedData, Error>(
    'related-data',
    fetchRelatedData,
    {
      revalidateOnFocus: false,
      refreshInterval: 300000, // 5 minutes
      dedupingInterval: 60000, // 1 minute
    }
  );
  
  // ============================================================================
  // URL State Synchronization
  // ============================================================================
  
  /**
   * Sync table state to URL parameters
   */
  const updateUrlParams = useCallback((newState: Partial<TableState>) => {
    const params = new URLSearchParams(searchParams);
    
    if (newState.offset !== undefined) {
      if (newState.offset === 0) {
        params.delete('offset');
      } else {
        params.set('offset', newState.offset.toString());
      }
    }
    
    if (newState.limit !== undefined) {
      if (newState.limit === config.initialLimit) {
        params.delete('limit');
      } else {
        params.set('limit', newState.limit.toString());
      }
    }
    
    if (newState.sortField || newState.sortDirection) {
      const sortField = newState.sortField || tableState.sortField;
      const sortDirection = newState.sortDirection || tableState.sortDirection;
      const sortParam = sortDirection === 'desc' ? `-${sortField}` : sortField;
      if (sortParam === 'name') {
        params.delete('sort');
      } else {
        params.set('sort', sortParam);
      }
    }
    
    if (newState.searchQuery !== undefined) {
      if (newState.searchQuery) {
        params.set('search', newState.searchQuery);
      } else {
        params.delete('search');
      }
    }
    
    if (newState.activeFilter !== undefined) {
      params.set('active', newState.activeFilter.toString());
    }
    
    if (newState.limitTypeFilter !== undefined) {
      if (newState.limitTypeFilter) {
        params.set('limit_type', newState.limitTypeFilter);
      } else {
        params.delete('limit_type');
      }
    }
    
    if (newState.userFilter !== undefined) {
      if (newState.userFilter) {
        params.set('user', newState.userFilter.toString());
      } else {
        params.delete('user');
      }
    }
    
    if (newState.serviceFilter !== undefined) {
      if (newState.serviceFilter) {
        params.set('service', newState.serviceFilter.toString());
      } else {
        params.delete('service');
      }
    }
    
    if (newState.roleFilter !== undefined) {
      if (newState.roleFilter) {
        params.set('role', newState.roleFilter.toString());
      } else {
        params.delete('role');
      }
    }
    
    setSearchParams(params, { replace: true });
  }, [searchParams, setSearchParams, tableState, config.initialLimit]);
  
  // ============================================================================
  // Debounced Search Implementation
  // ============================================================================
  
  /**
   * Debounced search query update
   */
  const debouncedSearch = useMemo(
    () => debounce((query: string) => {
      setTableState(prevState => ({
        ...prevState,
        searchQuery: query,
        offset: 0, // Reset to first page on search
      }));
      updateUrlParams({ searchQuery: query, offset: 0 });
    }, config.searchDebounceMs),
    [config.searchDebounceMs, updateUrlParams]
  );
  
  // Cleanup debounced function on unmount
  useEffect(() => {
    return () => {
      debouncedSearch.cancel();
    };
  }, [debouncedSearch]);
  
  // ============================================================================
  // Cache Management Functions
  // ============================================================================
  
  /**
   * Invalidate all related cache entries
   */
  const invalidateCache = useCallback(async () => {
    // Invalidate main limits cache
    await mutate(
      (key) => typeof key === 'string' && key.startsWith('limits-list'),
      undefined,
      { revalidate: false }
    );
    
    // Invalidate specific limit usage cache if needed
    await mutate(
      (key) => typeof key === 'string' && key.includes('limit-usage'),
      undefined,
      { revalidate: false }
    );
  }, []);
  
  /**
   * Optimistic update for cache
   */
  const optimisticUpdate = useCallback(
    async (operation: 'create' | 'update' | 'delete', limitData?: Partial<LimitTableRowData>) => {
      if (!config.enableOptimisticUpdates || !limitsResponse) return;
      
      const currentData = limitsResponse;
      
      try {
        switch (operation) {
          case 'create':
            if (limitData) {
              const newLimit = {
                ...limitData,
                id: Date.now(), // Temporary ID
              } as LimitTableRowData;
              
              await mutateLimits({
                ...currentData,
                resource: [newLimit, ...currentData.resource],
                meta: {
                  ...currentData.meta,
                  count: currentData.meta.count + 1,
                },
              }, false);
            }
            break;
            
          case 'update':
            if (limitData && limitData.id) {
              await mutateLimits({
                ...currentData,
                resource: currentData.resource.map(limit =>
                  limit.id === limitData.id ? { ...limit, ...limitData } : limit
                ),
              }, false);
            }
            break;
            
          case 'delete':
            if (limitData?.id) {
              await mutateLimits({
                ...currentData,
                resource: currentData.resource.filter(limit => limit.id !== limitData.id),
                meta: {
                  ...currentData.meta,
                  count: currentData.meta.count - 1,
                },
              }, false);
            }
            break;
        }
      } catch (error) {
        console.error('Optimistic update failed:', error);
        // Revert will happen automatically on actual mutation
      }
    },
    [config.enableOptimisticUpdates, limitsResponse, mutateLimits]
  );
  
  // ============================================================================
  // CRUD Operations
  // ============================================================================
  
  /**
   * Create a new limit with optimistic updates
   */
  const createLimit = useCallback(
    async (data: LimitConfiguration): Promise<LimitTableRowData> => {
      // Optimistic update
      await optimisticUpdate('create', data as Partial<LimitTableRowData>);
      
      try {
        const response = await apiPost<ApiResourceResponse<LimitTableRowData>>(
          '/api/v2/system/limit',
          data,
          {
            snackbarSuccess: 'Limit created successfully',
            snackbarError: 'Failed to create limit',
          }
        );
        
        // Invalidate cache and refetch
        await invalidateCache();
        await mutateLimits();
        
        config.notifications?.onSuccess?.('Limit created successfully');
        return response.resource;
      } catch (error) {
        // Revert optimistic update
        await mutateLimits();
        const errorMessage = error instanceof Error ? error.message : 'Failed to create limit';
        config.notifications?.onError?.(errorMessage);
        throw error;
      }
    },
    [optimisticUpdate, invalidateCache, mutateLimits, config.notifications]
  );
  
  /**
   * Update an existing limit with optimistic updates
   */
  const updateLimit = useCallback(
    async (id: number, data: Partial<LimitConfiguration>): Promise<LimitTableRowData> => {
      // Optimistic update
      await optimisticUpdate('update', { ...data, id });
      
      try {
        const response = await apiPut<ApiResourceResponse<LimitTableRowData>>(
          `/api/v2/system/limit/${id}`,
          data,
          {
            snackbarSuccess: 'Limit updated successfully',
            snackbarError: 'Failed to update limit',
          }
        );
        
        // Invalidate cache and refetch
        await invalidateCache();
        await mutateLimits();
        
        config.notifications?.onSuccess?.('Limit updated successfully');
        return response.resource;
      } catch (error) {
        // Revert optimistic update
        await mutateLimits();
        const errorMessage = error instanceof Error ? error.message : 'Failed to update limit';
        config.notifications?.onError?.(errorMessage);
        throw error;
      }
    },
    [optimisticUpdate, invalidateCache, mutateLimits, config.notifications]
  );
  
  /**
   * Delete a limit with optimistic updates
   */
  const deleteLimit = useCallback(
    async (id: number): Promise<void> => {
      // Find the limit for optimistic update
      const limitToDelete = limitsResponse?.resource.find(limit => limit.id === id);
      
      // Optimistic update
      if (limitToDelete) {
        await optimisticUpdate('delete', limitToDelete);
      }
      
      try {
        await apiDelete(`/api/v2/system/limit/${id}`, {
          snackbarSuccess: 'Limit deleted successfully',
          snackbarError: 'Failed to delete limit',
        });
        
        // Invalidate cache and refetch
        await invalidateCache();
        await mutateLimits();
        
        // Clear selection if deleted limit was selected
        setTableState(prevState => ({
          ...prevState,
          selectedIds: prevState.selectedIds.filter(selectedId => selectedId !== id),
        }));
        
        config.notifications?.onSuccess?.('Limit deleted successfully');
      } catch (error) {
        // Revert optimistic update
        await mutateLimits();
        const errorMessage = error instanceof Error ? error.message : 'Failed to delete limit';
        config.notifications?.onError?.(errorMessage);
        throw error;
      }
    },
    [limitsResponse, optimisticUpdate, invalidateCache, mutateLimits, config.notifications]
  );
  
  /**
   * Bulk update multiple limits
   */
  const bulkUpdateLimits = useCallback(
    async (ids: number[], data: Partial<LimitConfiguration>): Promise<void> => {
      try {
        // Perform bulk update operations
        const updatePromises = ids.map(id => updateLimit(id, data));
        await Promise.all(updatePromises);
        
        config.notifications?.onSuccess?.(`${ids.length} limits updated successfully`);
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Failed to update limits';
        config.notifications?.onError?.(errorMessage);
        throw error;
      }
    },
    [updateLimit, config.notifications]
  );
  
  /**
   * Refresh table data with cache invalidation
   */
  const refreshTable = useCallback(async (): Promise<void> => {
    setTableState(prevState => ({
      ...prevState,
      isRefreshing: true,
    }));
    
    try {
      // Invalidate cache first (equivalent to Angular limitCacheService.delete)
      await invalidateCache();
      
      // Force refetch with fresh data
      await mutateLimits();
      
      setTableState(prevState => ({
        ...prevState,
        isRefreshing: false,
        lastRefresh: new Date(),
      }));
      
      config.notifications?.onSuccess?.('Table refreshed successfully');
    } catch (error) {
      setTableState(prevState => ({
        ...prevState,
        isRefreshing: false,
      }));
      
      const errorMessage = error instanceof Error ? error.message : 'Failed to refresh table';
      config.notifications?.onError?.(errorMessage);
    }
  }, [invalidateCache, mutateLimits, config.notifications]);
  
  // ============================================================================
  // Table State Management Functions
  // ============================================================================
  
  /**
   * Update pagination
   */
  const updatePagination = useCallback((newOffset: number, newLimit?: number) => {
    const updates: Partial<TableState> = { offset: newOffset };
    if (newLimit !== undefined) {
      updates.limit = newLimit;
    }
    
    setTableState(prevState => ({ ...prevState, ...updates }));
    updateUrlParams(updates);
  }, [updateUrlParams]);
  
  /**
   * Update sorting
   */
  const updateSort = useCallback((field: keyof LimitTableRowData, direction?: 'asc' | 'desc') => {
    const newDirection = direction || (
      tableState.sortField === field && tableState.sortDirection === 'asc' ? 'desc' : 'asc'
    );
    
    const updates = {
      sortField: field,
      sortDirection: newDirection,
      offset: 0, // Reset to first page
    };
    
    setTableState(prevState => ({ ...prevState, ...updates }));
    updateUrlParams(updates);
  }, [tableState.sortField, tableState.sortDirection, updateUrlParams]);
  
  /**
   * Update filters
   */
  const updateFilters = useCallback((filters: Partial<Pick<TableState, 
    'activeFilter' | 'limitTypeFilter' | 'userFilter' | 'serviceFilter' | 'roleFilter'
  >>) => {
    const updates = {
      ...filters,
      offset: 0, // Reset to first page
    };
    
    setTableState(prevState => ({ ...prevState, ...updates }));
    updateUrlParams(updates);
  }, [updateUrlParams]);
  
  /**
   * Clear all filters
   */
  const clearFilters = useCallback(() => {
    const updates = {
      searchQuery: '',
      activeFilter: undefined,
      limitTypeFilter: undefined,
      userFilter: undefined,
      serviceFilter: undefined,
      roleFilter: undefined,
      offset: 0,
    };
    
    setTableState(prevState => ({ ...prevState, ...updates }));
    updateUrlParams(updates);
    
    // Cancel any pending debounced search
    debouncedSearch.cancel();
  }, [updateUrlParams, debouncedSearch]);
  
  /**
   * Update selection
   */
  const updateSelection = useCallback((ids: number[]) => {
    setTableState(prevState => ({ ...prevState, selectedIds: ids }));
  }, []);
  
  /**
   * Select all visible items
   */
  const selectAll = useCallback(() => {
    if (limitsResponse?.resource) {
      const allIds = limitsResponse.resource.map(limit => limit.id);
      updateSelection(allIds);
    }
  }, [limitsResponse, updateSelection]);
  
  /**
   * Clear selection
   */
  const clearSelection = useCallback(() => {
    updateSelection([]);
  }, [updateSelection]);
  
  // ============================================================================
  // Computed Values
  // ============================================================================
  
  /**
   * Extract data and metadata from response
   */
  const { limits, pagination } = useMemo(() => {
    if (!limitsResponse) {
      return {
        limits: [],
        pagination: {
          count: 0,
          offset: 0,
          limit: config.initialLimit,
        } as PaginationMeta,
      };
    }
    
    return {
      limits: limitsResponse.resource,
      pagination: limitsResponse.meta,
    };
  }, [limitsResponse, config.initialLimit]);
  
  /**
   * Loading states
   */
  const loading = useMemo(() => ({
    list: limitsLoading || tableState.isRefreshing,
    create: false, // Managed by individual operations
    update: false, // Managed by individual operations
    delete: false, // Managed by individual operations
  }), [limitsLoading, tableState.isRefreshing]);
  
  /**
   * Error states
   */
  const errors = useMemo(() => ({
    list: limitsError ? { 
      success: false, 
      error: { 
        code: 'FETCH_ERROR', 
        message: limitsError.message, 
        status_code: 500 as const 
      } 
    } as ApiErrorResponse : null,
    create: null, // Managed by individual operations
    update: null, // Managed by individual operations
    delete: null, // Managed by individual operations
  }), [limitsError]);
  
  // ============================================================================
  // Cleanup
  // ============================================================================
  
  useEffect(() => {
    return () => {
      // Cancel any pending requests
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      
      // Cancel debounced search
      debouncedSearch.cancel();
      
      // Clear search timeout
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [debouncedSearch]);
  
  // ============================================================================
  // Return Interface
  // ============================================================================
  
  return {
    // Data
    limits,
    
    // Loading states
    loading,
    
    // Error states  
    errors,
    
    // Pagination
    pagination,
    
    // CRUD operations
    operations: {
      create: createLimit,
      update: updateLimit,
      delete: deleteLimit,
      bulkUpdate: bulkUpdateLimits,
      refresh: refreshTable,
    },
    
    // Filtering and sorting
    filters: {
      active: tableState.activeFilter,
      search: tableState.searchQuery,
      limitType: tableState.limitTypeFilter,
      setFilters: updateFilters,
      clearFilters,
    },
    
    // Advanced filtering
    setSearchQuery: debouncedSearch,
    setSortField: updateSort,
    setPagination: updatePagination,
    
    // Selection management
    selection: {
      selectedIds: tableState.selectedIds,
      setSelectedIds: updateSelection,
      selectAll,
      clearSelection,
    },
    
    // Related data for dropdowns
    relatedData: relatedData || { services: [], users: [], roles: [] },
    relatedLoading,
    relatedError,
    
    // Table state
    tableState: {
      sortField: tableState.sortField,
      sortDirection: tableState.sortDirection,
      currentPage: Math.floor(tableState.offset / tableState.limit),
      pageSize: tableState.limit,
      totalPages: Math.ceil(pagination.count / tableState.limit),
      isRefreshing: tableState.isRefreshing,
      lastRefresh: tableState.lastRefresh,
    },
    
    // Utility functions
    utils: {
      fetchLimitUsage,
      invalidateCache,
      isSelected: (id: number) => tableState.selectedIds.includes(id),
      getFilterString: () => swrKey,
    },
  };
}

// ============================================================================
// Export Types
// ============================================================================

export type { UseLimitTableOptions, TableState, RelatedData };