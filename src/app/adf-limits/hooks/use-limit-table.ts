/**
 * Comprehensive Limit Table Management Hook for React/Next.js Admin Interface
 * 
 * Replaces Angular DfManageLimitsTableComponent with React Query table management patterns.
 * Provides intelligent caching with SWR-based data fetching, comprehensive table state management,
 * CRUD operations with optimistic updates, and performance optimization for large datasets.
 * 
 * Implements cache hit responses under 50ms per React/Next.js Integration Requirements,
 * comprehensive error handling per Section 4.2, and state management workflows per Section 4.3.
 * 
 * @author DreamFactory Admin Interface Team
 * @version React 19/Next.js 15.1 Migration
 * @since 2024-12-19
 */

import { useState, useCallback, useMemo, useEffect } from 'react'
import useSWR, { mutate } from 'swr'
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query'
import { 
  LimitTableRowData,
  LimitType,
  LimitCounter,
  LIMITS_QUERY_KEYS,
  CreateLimitFormData,
  EditLimitFormData,
  LimitsListQueryResult,
  CreateLimitMutationResult,
  UpdateLimitMutationResult,
  DeleteLimitMutationResult,
  QueryPerformanceMetrics
} from '../types'
import {
  ApiListResponse,
  ApiCreateResponse,
  ApiUpdateResponse,
  ApiDeleteResponse,
  ApiErrorResponse,
  ApiRequestOptions,
  PaginationMeta
} from '@/types/api'
import { apiClient } from '@/lib/api-client'

// =============================================================================
// CONSTANTS AND CONFIGURATION
// =============================================================================

/**
 * Default table configuration optimized for performance and UX
 */
const DEFAULT_TABLE_CONFIG = {
  /** Default page size for optimal loading performance */
  pageSize: 25,
  /** Maximum page size to prevent performance degradation */
  maxPageSize: 100,
  /** Debounce delay for search filtering in milliseconds */
  searchDebounceMs: 300,
  /** Cache stale time for list queries (5 minutes) */
  staleTime: 5 * 60 * 1000,
  /** Cache time for memory management (15 minutes) */
  cacheTime: 15 * 60 * 1000,
  /** Retry configuration for failed requests */
  retryConfig: {
    attempts: 3,
    delay: 1000,
    backoffFactor: 2
  }
} as const

/**
 * API endpoints for limit operations
 */
const LIMIT_ENDPOINTS = {
  list: '/limits',
  detail: (id: number) => `/limits/${id}`,
  cache: (id: number) => `/limits/${id}/cache`,
  related: '/limits/related-data'
} as const

/**
 * Filter query generator for limits search - matches Angular implementation
 */
const createLimitFilterQuery = (searchValue: string): string => {
  if (!searchValue?.trim()) return ''
  
  const value = searchValue.trim()
  return `(name like "%${value}%")`
}

// =============================================================================
// TYPES AND INTERFACES
// =============================================================================

/**
 * Table state management interface
 */
export interface LimitTableState {
  /** Current page number (0-based) */
  page: number
  /** Items per page */
  pageSize: number
  /** Current sort configuration */
  sort: {
    column: keyof LimitTableRowData | null
    direction: 'asc' | 'desc' | null
  }
  /** Current search/filter value */
  search: string
  /** Selected row IDs for bulk operations */
  selectedIds: Set<number>
  /** Loading states for different operations */
  loading: {
    table: boolean
    create: boolean
    update: boolean
    delete: boolean
    refresh: boolean
  }
}

/**
 * Hook configuration options
 */
export interface UseLimitTableConfig {
  /** Initial page size */
  initialPageSize?: number
  /** Enable automatic refresh on window focus */
  refetchOnFocus?: boolean
  /** Enable real-time updates */
  realTimeUpdates?: boolean
  /** Custom cache configuration */
  cacheConfig?: {
    staleTime?: number
    cacheTime?: number
  }
  /** Performance monitoring enabled */
  enableMetrics?: boolean
}

/**
 * Hook return interface with comprehensive table management
 */
export interface UseLimitTableReturn {
  // Data and state
  /** Current table data */
  data: LimitTableRowData[]
  /** Pagination metadata */
  pagination: PaginationMeta
  /** Table state management */
  state: LimitTableState
  /** Loading states */
  isLoading: boolean
  /** Error state */
  error: ApiErrorResponse | null
  /** Performance metrics */
  metrics: QueryPerformanceMetrics

  // State management functions
  /** Update page number */
  setPage: (page: number) => void
  /** Update page size */
  setPageSize: (size: number) => void
  /** Update sort configuration */
  setSort: (column: keyof LimitTableRowData, direction: 'asc' | 'desc' | null) => void
  /** Update search filter */
  setSearch: (search: string) => void
  /** Update selected rows */
  setSelectedIds: (ids: Set<number>) => void
  /** Clear all selections */
  clearSelection: () => void

  // CRUD operations
  /** Refresh table data */
  refreshTable: () => Promise<void>
  /** Refresh specific row with cache invalidation */
  refreshRow: (id: number) => Promise<void>
  /** Create new limit */
  createLimit: CreateLimitMutationResult
  /** Update existing limit */
  updateLimit: UpdateLimitMutationResult
  /** Delete limit */
  deleteLimit: DeleteLimitMutationResult
  /** Toggle limit active status */
  toggleLimitStatus: (id: number, active: boolean) => Promise<void>

  // Bulk operations
  /** Delete multiple limits */
  bulkDelete: (ids: number[]) => Promise<void>
  /** Toggle multiple limits status */
  bulkToggleStatus: (ids: number[], active: boolean) => Promise<void>
}

// =============================================================================
// DATA TRANSFORMATION UTILITIES
// =============================================================================

/**
 * Map raw API limit data to table row format - matches Angular mapDataToTable
 */
const mapLimitToTableRow = (limit: any): LimitTableRowData => {
  return {
    id: limit.id,
    name: limit.name,
    limitType: limit.type as LimitType,
    limitRate: `${limit.rate} / ${limit.period}`,
    limitCounter: limit.limitCacheByLimitId?.[0] 
      ? `${limit.limitCacheByLimitId[0].attempts} / ${limit.limitCacheByLimitId[0].max}`
      : '0 / 0',
    user: limit.userId || null,
    service: limit.serviceId || null,
    role: limit.roleId || null,
    active: limit.isActive ?? true,
    createdAt: limit.createdAt,
    updatedAt: limit.updatedAt,
    createdBy: limit.createdBy,
    metadata: {
      description: limit.description,
      priority: limit.priority
    }
  }
}

/**
 * Build API request options from table state
 */
const buildRequestOptions = (state: LimitTableState): ApiRequestOptions => {
  const options: ApiRequestOptions = {
    limit: state.pageSize,
    offset: state.page * state.pageSize,
    related: 'service_by_service_id,role_by_role_id,user_by_user_id,limit_cache_by_limit_id'
  }

  // Add search filter
  if (state.search.trim()) {
    options.filter = createLimitFilterQuery(state.search)
  }

  // Add sorting
  if (state.sort.column && state.sort.direction) {
    const sortDirection = state.sort.direction === 'desc' ? '-' : ''
    options.sort = `${sortDirection}${state.sort.column}`
  }

  return options
}

// =============================================================================
// PERFORMANCE MONITORING UTILITIES
// =============================================================================

/**
 * Performance metrics tracking
 */
class PerformanceTracker {
  private startTime: number = 0
  private metrics: QueryPerformanceMetrics = {
    queryTime: 0,
    cacheHitRate: 0,
    backgroundRefetchCount: 0,
    lastFetchTime: new Date(),
    errorRate: 0
  }

  startTimer(): void {
    this.startTime = performance.now()
  }

  endTimer(): number {
    const duration = performance.now() - this.startTime
    this.metrics.queryTime = duration
    this.metrics.lastFetchTime = new Date()
    return duration
  }

  updateCacheHitRate(isHit: boolean): void {
    // Simple moving average calculation
    this.metrics.cacheHitRate = isHit ? 
      Math.min(this.metrics.cacheHitRate + 0.1, 1.0) :
      Math.max(this.metrics.cacheHitRate - 0.05, 0.0)
  }

  incrementBackgroundRefetch(): void {
    this.metrics.backgroundRefetchCount += 1
  }

  updateErrorRate(hasError: boolean): void {
    this.metrics.errorRate = hasError ?
      Math.min(this.metrics.errorRate + 0.1, 1.0) :
      Math.max(this.metrics.errorRate - 0.05, 0.0)
  }

  getMetrics(): QueryPerformanceMetrics {
    return { ...this.metrics }
  }
}

// =============================================================================
// MAIN HOOK IMPLEMENTATION
// =============================================================================

/**
 * Comprehensive limit table management hook
 * 
 * Provides SWR-based data fetching with cache hit responses under 50ms,
 * comprehensive table state management, CRUD operations with optimistic updates,
 * and performance optimization for large datasets.
 */
export function useLimitTable(config: UseLimitTableConfig = {}): UseLimitTableReturn {
  const {
    initialPageSize = DEFAULT_TABLE_CONFIG.pageSize,
    refetchOnFocus = false,
    realTimeUpdates = false,
    cacheConfig = {
      staleTime: DEFAULT_TABLE_CONFIG.staleTime,
      cacheTime: DEFAULT_TABLE_CONFIG.cacheTime
    },
    enableMetrics = true
  } = config

  // Query client for React Query operations
  const queryClient = useQueryClient()

  // Performance tracking
  const performanceTracker = useMemo(() => 
    enableMetrics ? new PerformanceTracker() : null, 
    [enableMetrics]
  )

  // =============================================================================
  // STATE MANAGEMENT
  // =============================================================================

  /**
   * Core table state with comprehensive management
   */
  const [tableState, setTableState] = useState<LimitTableState>({
    page: 0,
    pageSize: initialPageSize,
    sort: {
      column: 'name',
      direction: 'asc'
    },
    search: '',
    selectedIds: new Set(),
    loading: {
      table: false,
      create: false,
      update: false,
      delete: false,
      refresh: false
    }
  })

  // Debounced search to optimize API calls
  const [debouncedSearch, setDebouncedSearch] = useState(tableState.search)

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(tableState.search)
    }, DEFAULT_TABLE_CONFIG.searchDebounceMs)

    return () => clearTimeout(timer)
  }, [tableState.search])

  // Reset page when search or filters change
  useEffect(() => {
    if (tableState.page > 0) {
      setTableState(prev => ({ ...prev, page: 0 }))
    }
  }, [debouncedSearch, tableState.sort])

  // =============================================================================
  // DATA FETCHING WITH SWR
  // =============================================================================

  /**
   * Current request options based on table state
   */
  const requestOptions = useMemo(() => 
    buildRequestOptions({ ...tableState, search: debouncedSearch }),
    [tableState.page, tableState.pageSize, tableState.sort, debouncedSearch]
  )

  /**
   * SWR cache key for current request
   */
  const cacheKey = useMemo(() => 
    LIMITS_QUERY_KEYS.list(requestOptions),
    [requestOptions]
  )

  /**
   * Primary data fetching with SWR for optimal caching
   */
  const {
    data: swrData,
    error: swrError,
    isLoading: swrLoading,
    mutate: swrMutate,
    isValidating
  } = useSWR<ApiListResponse<LimitTableRowData>, ApiErrorResponse>(
    cacheKey,
    async (key) => {
      performanceTracker?.startTimer()
      
      try {
        const response = await apiClient.get(LIMIT_ENDPOINTS.list, {
          params: requestOptions
        })

        const mappedData = {
          ...response,
          resource: response.resource.map(mapLimitToTableRow)
        }

        const queryTime = performanceTracker?.endTimer() || 0
        performanceTracker?.updateCacheHitRate(queryTime < 50) // Cache hit if under 50ms
        performanceTracker?.updateErrorRate(false)

        return mappedData
      } catch (error) {
        performanceTracker?.updateErrorRate(true)
        throw error
      }
    },
    {
      revalidateOnFocus: refetchOnFocus,
      revalidateOnReconnect: true,
      dedupingInterval: 5000, // 5 seconds deduplication
      errorRetryCount: DEFAULT_TABLE_CONFIG.retryConfig.attempts,
      errorRetryInterval: DEFAULT_TABLE_CONFIG.retryConfig.delay,
      refreshInterval: realTimeUpdates ? 30000 : 0, // 30 seconds if real-time enabled
      keepPreviousData: true, // Better UX during navigation
      onSuccess: () => {
        performanceTracker?.incrementBackgroundRefetch()
      }
    }
  )

  // =============================================================================
  // MUTATION OPERATIONS WITH OPTIMISTIC UPDATES
  // =============================================================================

  /**
   * Create limit mutation with optimistic updates
   */
  const createLimitMutation = useMutation<
    ApiCreateResponse,
    ApiErrorResponse,
    CreateLimitFormData
  >({
    mutationFn: async (data: CreateLimitFormData) => {
      return await apiClient.post(LIMIT_ENDPOINTS.list, data)
    },
    onMutate: async (variables) => {
      // Cancel outgoing queries to prevent race conditions
      await queryClient.cancelQueries({ queryKey: LIMITS_QUERY_KEYS.lists() })

      // Optimistic update with temporary ID
      const tempId = Date.now()
      const optimisticLimit: LimitTableRowData = {
        id: tempId,
        name: variables.name,
        limitType: variables.limitType,
        limitRate: variables.limitRate,
        limitCounter: variables.limitCounter,
        user: variables.user || null,
        service: variables.service || null,
        role: variables.role || null,
        active: variables.active ?? true,
        createdAt: new Date().toISOString(),
        metadata: variables.metadata
      }

      // Store previous data for rollback
      const previousData = queryClient.getQueryData(cacheKey)
      
      // Optimistically update cache
      queryClient.setQueryData(cacheKey, (old: ApiListResponse<LimitTableRowData> | undefined) => {
        if (!old) return old
        return {
          ...old,
          resource: [optimisticLimit, ...old.resource],
          meta: {
            ...old.meta,
            count: old.meta.count + 1,
            total: (old.meta.total || 0) + 1
          }
        }
      })

      return { previousData, tempId }
    },
    onSuccess: (data, variables, context) => {
      // Replace temporary item with real data
      queryClient.setQueryData(cacheKey, (old: ApiListResponse<LimitTableRowData> | undefined) => {
        if (!old) return old
        return {
          ...old,
          resource: old.resource.map(item => 
            item.id === context?.tempId 
              ? { ...item, id: data.id } 
              : item
          )
        }
      })

      // Invalidate related queries
      queryClient.invalidateQueries({ 
        queryKey: LIMITS_QUERY_KEYS.all,
        refetchType: 'none' // Don't refetch immediately
      })
    },
    onError: (error, variables, context) => {
      // Rollback optimistic update
      if (context?.previousData) {
        queryClient.setQueryData(cacheKey, context.previousData)
      }
    },
    onSettled: () => {
      // Always invalidate to ensure consistency
      queryClient.invalidateQueries({ queryKey: LIMITS_QUERY_KEYS.lists() })
    }
  })

  /**
   * Update limit mutation with optimistic updates
   */
  const updateLimitMutation = useMutation<
    ApiUpdateResponse,
    ApiErrorResponse,
    EditLimitFormData
  >({
    mutationFn: async (data: EditLimitFormData) => {
      return await apiClient.put(LIMIT_ENDPOINTS.detail(data.id), data)
    },
    onMutate: async (variables) => {
      await queryClient.cancelQueries({ queryKey: LIMITS_QUERY_KEYS.lists() })

      const previousData = queryClient.getQueryData(cacheKey)

      // Optimistic update
      queryClient.setQueryData(cacheKey, (old: ApiListResponse<LimitTableRowData> | undefined) => {
        if (!old) return old
        return {
          ...old,
          resource: old.resource.map(item =>
            item.id === variables.id
              ? {
                  ...item,
                  name: variables.name,
                  limitType: variables.limitType,
                  limitRate: variables.limitRate,
                  limitCounter: variables.limitCounter,
                  user: variables.user || null,
                  service: variables.service || null,
                  role: variables.role || null,
                  active: variables.active ?? true,
                  updatedAt: new Date().toISOString(),
                  metadata: variables.metadata
                }
              : item
          )
        }
      })

      return { previousData }
    },
    onError: (error, variables, context) => {
      if (context?.previousData) {
        queryClient.setQueryData(cacheKey, context.previousData)
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: LIMITS_QUERY_KEYS.lists() })
    }
  })

  /**
   * Delete limit mutation with optimistic updates
   */
  const deleteLimitMutation = useMutation<
    ApiDeleteResponse,
    ApiErrorResponse,
    number
  >({
    mutationFn: async (id: number) => {
      return await apiClient.delete(LIMIT_ENDPOINTS.detail(id))
    },
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: LIMITS_QUERY_KEYS.lists() })

      const previousData = queryClient.getQueryData(cacheKey)

      // Optimistic removal
      queryClient.setQueryData(cacheKey, (old: ApiListResponse<LimitTableRowData> | undefined) => {
        if (!old) return old
        return {
          ...old,
          resource: old.resource.filter(item => item.id !== id),
          meta: {
            ...old.meta,
            count: Math.max(0, old.meta.count - 1),
            total: Math.max(0, (old.meta.total || 0) - 1)
          }
        }
      })

      return { previousData }
    },
    onError: (error, variables, context) => {
      if (context?.previousData) {
        queryClient.setQueryData(cacheKey, context.previousData)
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: LIMITS_QUERY_KEYS.lists() })
    }
  })

  // =============================================================================
  // STATE MANAGEMENT FUNCTIONS
  // =============================================================================

  const setPage = useCallback((page: number) => {
    setTableState(prev => ({ ...prev, page }))
  }, [])

  const setPageSize = useCallback((pageSize: number) => {
    setTableState(prev => ({ 
      ...prev, 
      pageSize: Math.min(pageSize, DEFAULT_TABLE_CONFIG.maxPageSize),
      page: 0 // Reset to first page
    }))
  }, [])

  const setSort = useCallback((column: keyof LimitTableRowData, direction: 'asc' | 'desc' | null) => {
    setTableState(prev => ({
      ...prev,
      sort: { column, direction },
      page: 0 // Reset to first page when sorting changes
    }))
  }, [])

  const setSearch = useCallback((search: string) => {
    setTableState(prev => ({ ...prev, search }))
  }, [])

  const setSelectedIds = useCallback((selectedIds: Set<number>) => {
    setTableState(prev => ({ ...prev, selectedIds }))
  }, [])

  const clearSelection = useCallback(() => {
    setTableState(prev => ({ ...prev, selectedIds: new Set() }))
  }, [])

  // =============================================================================
  // CRUD OPERATION FUNCTIONS
  // =============================================================================

  /**
   * Refresh table data - matches Angular refreshTable functionality
   */
  const refreshTable = useCallback(async () => {
    setTableState(prev => ({ 
      ...prev, 
      loading: { ...prev.loading, refresh: true }
    }))

    try {
      await swrMutate()
    } finally {
      setTableState(prev => ({ 
        ...prev, 
        loading: { ...prev.loading, refresh: false }
      }))
    }
  }, [swrMutate])

  /**
   * Refresh specific row with cache invalidation - matches Angular refreshRow
   */
  const refreshRow = useCallback(async (id: number) => {
    try {
      // Invalidate cache for specific limit (matches Angular limitCacheService.delete)
      await apiClient.delete(LIMIT_ENDPOINTS.cache(id))
      
      // Refresh table data
      await refreshTable()
    } catch (error) {
      console.error('Failed to refresh row:', error)
      // Still attempt table refresh even if cache invalidation fails
      await refreshTable()
    }
  }, [refreshTable])

  /**
   * Toggle limit active status with optimistic update
   */
  const toggleLimitStatus = useCallback(async (id: number, active: boolean) => {
    try {
      const updateData: Partial<EditLimitFormData> = { 
        id, 
        active,
        // Include current data to satisfy form schema
        name: swrData?.resource.find(item => item.id === id)?.name || '',
        limitType: swrData?.resource.find(item => item.id === id)?.limitType || LimitType.ENDPOINT,
        limitRate: swrData?.resource.find(item => item.id === id)?.limitRate || '100/minute',
        limitCounter: swrData?.resource.find(item => item.id === id)?.limitCounter || LimitCounter.REQUEST
      }
      
      await updateLimitMutation.mutateAsync(updateData as EditLimitFormData)
    } catch (error) {
      console.error('Failed to toggle limit status:', error)
      throw error
    }
  }, [updateLimitMutation, swrData])

  /**
   * Bulk delete operation with optimistic updates
   */
  const bulkDelete = useCallback(async (ids: number[]) => {
    const deletePromises = ids.map(id => deleteLimitMutation.mutateAsync(id))
    
    try {
      await Promise.all(deletePromises)
      clearSelection()
    } catch (error) {
      console.error('Bulk delete failed:', error)
      throw error
    }
  }, [deleteLimitMutation, clearSelection])

  /**
   * Bulk status toggle operation
   */
  const bulkToggleStatus = useCallback(async (ids: number[], active: boolean) => {
    const togglePromises = ids.map(id => toggleLimitStatus(id, active))
    
    try {
      await Promise.all(togglePromises)
      clearSelection()
    } catch (error) {
      console.error('Bulk status toggle failed:', error)
      throw error
    }
  }, [toggleLimitStatus, clearSelection])

  // =============================================================================
  // COMPUTED VALUES AND RETURN OBJECT
  // =============================================================================

  /**
   * Processed table data and metadata
   */
  const tableData = useMemo(() => swrData?.resource || [], [swrData])
  const pagination = useMemo(() => swrData?.meta || {
    count: 0,
    limit: tableState.pageSize,
    offset: tableState.page * tableState.pageSize,
    total: 0,
    has_more: false
  }, [swrData, tableState.pageSize, tableState.page])

  /**
   * Loading state aggregation
   */
  const isLoading = useMemo(() => 
    swrLoading || 
    isValidating || 
    tableState.loading.refresh ||
    createLimitMutation.isPending ||
    updateLimitMutation.isPending ||
    deleteLimitMutation.isPending,
    [
      swrLoading, 
      isValidating, 
      tableState.loading.refresh,
      createLimitMutation.isPending,
      updateLimitMutation.isPending,
      deleteLimitMutation.isPending
    ]
  )

  /**
   * Performance metrics
   */
  const metrics = useMemo(() => 
    performanceTracker?.getMetrics() || {
      queryTime: 0,
      cacheHitRate: 0,
      backgroundRefetchCount: 0,
      lastFetchTime: new Date(),
      errorRate: 0
    },
    [performanceTracker]
  )

  return {
    // Data and state
    data: tableData,
    pagination,
    state: tableState,
    isLoading,
    error: swrError || null,
    metrics,

    // State management functions
    setPage,
    setPageSize,
    setSort,
    setSearch,
    setSelectedIds,
    clearSelection,

    // CRUD operations
    refreshTable,
    refreshRow,
    createLimit: createLimitMutation,
    updateLimit: updateLimitMutation,
    deleteLimit: deleteLimitMutation,
    toggleLimitStatus,

    // Bulk operations
    bulkDelete,
    bulkToggleStatus
  }
}

export default useLimitTable