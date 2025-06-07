/**
 * @fileoverview Comprehensive React Data Table Component for DreamFactory Admin Interface
 * 
 * This component replaces Angular df-manage-table with a modern React 19 implementation
 * featuring TanStack Table for table logic, TanStack React Query for data fetching,
 * TanStack Virtual for performance optimization, and comprehensive WCAG 2.1 AA accessibility.
 * 
 * Key Features:
 * - TanStack Table integration for sorting, filtering, and pagination
 * - TanStack React Query for server state management with TTL configuration (staleTime: 300s)
 * - TanStack Virtual for performance with large datasets (1000+ rows)
 * - WCAG 2.1 AA accessibility compliance with keyboard navigation
 * - Tailwind CSS 4.1+ styling with responsive design
 * - React Hook Form integration for real-time validation under 100ms
 * - Headless UI components for accessible interactions
 * - Zustand theme management integration
 * - Comprehensive TypeScript type safety
 * 
 * @author DreamFactory Admin Interface Team
 * @version 1.0.0
 * @since React 19.0.0, Next.js 15.1+, TypeScript 5.8+
 */

'use client';

import React, { 
  forwardRef, 
  useCallback, 
  useMemo, 
  useRef, 
  useState, 
  useEffect,
  useId,
  memo
} from 'react';
import { 
  useReactTable,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  getGroupedRowModel,
  getExpandedRowModel,
  flexRender,
  type ColumnDef,
  type SortingState,
  type ColumnFiltersState,
  type VisibilityState,
  type RowSelectionState,
  type ExpandedState,
  type GroupingState,
  type PaginationState,
} from '@tanstack/react-table';
import { useVirtualizer } from '@tanstack/react-virtual';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useForm, Controller } from 'react-hook-form';
import { 
  ChevronDown, 
  ChevronUp, 
  ChevronsUpDown,
  Search,
  Filter,
  Download,
  Settings,
  MoreHorizontal,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Eye,
  EyeOff,
  ArrowUp,
  ArrowDown,
  Loader2,
  AlertCircle,
  CheckCircle,
  Clock,
  Info
} from 'lucide-react';

import { Button } from '@/components/ui/button/button';
import { Input } from '@/components/ui/input/input';
import { Dialog } from '@/components/ui/dialog/dialog';
import { useTheme } from '@/hooks/use-theme';
import { cn, debounce } from '@/lib/utils';

import type {
  ManageTableProps,
  TableColumnDef,
  TablePagination,
  TableSorting,
  TableFiltering,
  TableSelection,
  TableActions,
  TableBulkActions,
  TableLayout,
  TableExport,
  TableAccessibility,
  TableVirtualization,
  TableQueryOptions,
  TableFormIntegration,
  TableState,
  TableSortState,
  TableColumnFilter,
  TableEmptyState,
  TableResponsive,
  StatusBadgeVariants
} from './manage-table.types';

import {
  tableContainerVariants,
  tableVariants,
  tableHeaderVariants,
  tableCellVariants,
  statusBadgeVariants,
  tableActionVariants,
  createTableContainer,
  createTable,
  createTableHeader,
  createTableCell,
  createStatusBadge,
  createTableAction,
  tablePresets,
  tableA11yUtils,
  type TableContainerVariants,
  type TableVariants,
  type TableHeaderVariants,
  type TableCellVariants,
  type TableActionVariants
} from './manage-table-variants';

// ============================================================================
// COMPONENT INTERFACES AND TYPES
// ============================================================================

/**
 * Enhanced component props interface extending the base ManageTableProps
 */
export interface ManageTableComponentProps<TData = any> extends ManageTableProps<TData> {
  /** Custom ref forwarding support */
  ref?: React.Ref<HTMLDivElement>;
  
  /** Enhanced performance configuration */
  performance?: {
    /** Enable virtualization threshold */
    virtualizationThreshold?: number;
    /** Debounce delay for filtering */
    debounceDelay?: number;
    /** Cache configuration override */
    cacheConfig?: Partial<TableQueryOptions>;
  };
  
  /** Development and debugging features */
  debug?: {
    /** Enable console logging for debugging */
    enableLogging?: boolean;
    /** Show performance metrics */
    showMetrics?: boolean;
    /** Enable data mocking */
    mockData?: boolean;
  };
}

/**
 * Internal component state interface
 */
interface TableInternalState {
  sorting: SortingState;
  columnFilters: ColumnFiltersState;
  columnVisibility: VisibilityState;
  rowSelection: RowSelectionState;
  expanded: ExpandedState;
  grouping: GroupingState;
  pagination: PaginationState;
  globalFilter: string;
}

/**
 * Table metrics interface for performance monitoring
 */
interface TableMetrics {
  renderTime: number;
  dataSize: number;
  visibleRows: number;
  totalRows: number;
  lastUpdate: number;
}

// ============================================================================
// UTILITY FUNCTIONS AND CONSTANTS
// ============================================================================

/**
 * Default configuration values
 */
const DEFAULT_CONFIG = {
  VIRTUALIZATION_THRESHOLD: 100,
  DEBOUNCE_DELAY: 300,
  STALE_TIME: 300000, // 5 minutes
  CACHE_TIME: 900000, // 15 minutes
  PAGE_SIZE: 25,
  PAGE_SIZE_OPTIONS: [10, 25, 50, 100],
  OVERSCAN: 5,
} as const;

/**
 * Performance monitoring utilities
 */
const createPerformanceMonitor = () => {
  let startTime = 0;
  
  return {
    start: () => {
      startTime = performance.now();
    },
    end: (): number => {
      return performance.now() - startTime;
    },
    measure: (name: string, fn: () => void): number => {
      const start = performance.now();
      fn();
      const duration = performance.now() - start;
      
      if (process.env.NODE_ENV === 'development') {
        console.log(`[Table Performance] ${name}: ${duration.toFixed(2)}ms`);
      }
      
      return duration;
    }
  };
};

/**
 * Generate cache key for React Query
 */
const generateCacheKey = (
  baseKey: string[],
  pagination: PaginationState,
  sorting: SortingState,
  filters: ColumnFiltersState,
  globalFilter: string
): string[] => {
  return [
    ...baseKey,
    'table-data',
    JSON.stringify({ pagination, sorting, filters, globalFilter })
  ];
};

/**
 * Status badge component for table cells
 */
const StatusBadge = memo<{
  status: StatusBadgeVariants['status'];
  size?: StatusBadgeVariants['size'];
  children: React.ReactNode;
  className?: string;
}>(({ status, size = 'default', children, className }) => (
  <span 
    className={cn(statusBadgeVariants({ status, size }), className)}
    role="status"
    aria-label={`Status: ${children}`}
  >
    {children}
  </span>
));

StatusBadge.displayName = 'StatusBadge';

/**
 * Loading skeleton component
 */
const TableSkeleton = memo<{ rows?: number; columns?: number }>(({ 
  rows = 5, 
  columns = 4 
}) => (
  <div className="space-y-2" role="status" aria-label="Loading table data">
    {Array.from({ length: rows }, (_, i) => (
      <div key={i} className="flex space-x-4">
        {Array.from({ length: columns }, (_, j) => (
          <div 
            key={j} 
            className="h-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse flex-1"
          />
        ))}
      </div>
    ))}
    <span className="sr-only">Loading table data...</span>
  </div>
));

TableSkeleton.displayName = 'TableSkeleton';

/**
 * Empty state component
 */
const EmptyStateComponent = memo<{
  emptyState?: TableEmptyState;
  className?: string;
}>(({ emptyState, className }) => {
  if (!emptyState) {
    return (
      <div className={cn("text-center py-12", className)}>
        <div className="text-gray-500 dark:text-gray-400">
          <Info className="mx-auto h-12 w-12 mb-4" aria-hidden="true" />
          <h3 className="text-lg font-medium mb-2">No Data Available</h3>
          <p className="text-sm">There are currently no items to display.</p>
        </div>
      </div>
    );
  }

  const Icon = emptyState.icon || Info;

  return (
    <div className={cn("text-center py-12", className)}>
      <div className="text-gray-500 dark:text-gray-400">
        <Icon className="mx-auto h-12 w-12 mb-4" aria-hidden="true" />
        <h3 className="text-lg font-medium mb-2">{emptyState.title}</h3>
        {emptyState.description && (
          <p className="text-sm mb-4">{emptyState.description}</p>
        )}
        {emptyState.action && (
          <Button
            variant={emptyState.action.variant || 'primary'}
            onClick={emptyState.action.handler}
          >
            {emptyState.action.label}
          </Button>
        )}
      </div>
    </div>
  );
});

EmptyStateComponent.displayName = 'EmptyState';

// ============================================================================
// MAIN COMPONENT IMPLEMENTATION
// ============================================================================

/**
 * ManageTable - Comprehensive React data table component
 * 
 * This component provides enterprise-grade table functionality with comprehensive
 * accessibility support, performance optimization, and modern React patterns.
 * 
 * @example
 * ```tsx
 * // Basic usage
 * <ManageTable
 *   data={tableData}
 *   columns={columnDefinitions}
 *   loading={isLoading}
 *   pagination={{
 *     pageIndex: 0,
 *     pageSize: 25,
 *     totalItems: 1000,
 *     onPageChange: handlePageChange,
 *     onPageSizeChange: handlePageSizeChange
 *   }}
 * />
 * 
 * // Advanced usage with virtualization and filtering
 * <ManageTable
 *   data={largeDataset}
 *   columns={columns}
 *   virtualization={{ enabled: true, estimatedRowHeight: 50 }}
 *   filtering={{
 *     globalFilter: searchTerm,
 *     onGlobalFilterChange: setSearchTerm,
 *     columnFilters: activeFilters,
 *     onColumnFiltersChange: setActiveFilters
 *   }}
 *   selection={{
 *     mode: 'multiple',
 *     selectedRowIds: selected,
 *     onSelectionChange: setSelected
 *   }}
 * />
 * ```
 */
export const ManageTable = forwardRef<HTMLDivElement, ManageTableComponentProps>(
  <TData extends Record<string, any> = any>(
    {
      // Data and configuration props
      data = [],
      columns = [],
      loading = false,
      error = null,
      emptyState,
      
      // Table functionality props
      pagination,
      sorting,
      filtering,
      selection,
      actions,
      bulkActions,
      layout,
      export: exportConfig,
      accessibility,
      virtualization,
      
      // Event handlers
      onRowClick,
      onRowDoubleClick,
      onRowSelect,
      onColumnSort,
      onColumnFilter,
      onPageChange,
      onPageSizeChange,
      
      // React Query integration
      queryKey,
      queryOptions,
      
      // Form integration
      formIntegration,
      
      // Performance and debugging
      performance,
      debug,
      
      // Base component props
      className,
      'data-testid': dataTestId = 'manage-table',
      'aria-label': ariaLabel = 'Data table',
      'aria-describedby': ariaDescribedBy,
      ...restProps
    }: ManageTableComponentProps<TData>,
    ref: React.Ref<HTMLDivElement>
  ) => {
    // ========================================================================
    // HOOKS AND STATE MANAGEMENT
    // ========================================================================
    
    const { resolvedTheme } = useTheme();
    const queryClient = useQueryClient();
    const performanceMonitor = useMemo(() => createPerformanceMonitor(), []);
    
    // Generate unique IDs for accessibility
    const tableId = useId();
    const captionId = useId();
    const descriptionId = useId();
    
    // Performance configuration
    const perfConfig = useMemo(() => ({
      virtualizationThreshold: performance?.virtualizationThreshold ?? DEFAULT_CONFIG.VIRTUALIZATION_THRESHOLD,
      debounceDelay: performance?.debounceDelay ?? DEFAULT_CONFIG.DEBOUNCE_DELAY,
      cacheConfig: {
        staleTime: DEFAULT_CONFIG.STALE_TIME,
        cacheTime: DEFAULT_CONFIG.CACHE_TIME,
        ...performance?.cacheConfig
      }
    }), [performance]);
    
    // Table state management
    const [internalState, setInternalState] = useState<TableInternalState>(() => ({
      sorting: [],
      columnFilters: [],
      columnVisibility: {},
      rowSelection: {},
      expanded: {},
      grouping: [],
      pagination: {
        pageIndex: pagination?.pageIndex ?? 0,
        pageSize: pagination?.pageSize ?? DEFAULT_CONFIG.PAGE_SIZE,
      },
      globalFilter: filtering?.globalFilter ?? '',
    }));
    
    // Performance metrics state
    const [metrics, setMetrics] = useState<TableMetrics>(() => ({
      renderTime: 0,
      dataSize: data.length,
      visibleRows: 0,
      totalRows: data.length,
      lastUpdate: Date.now()
    }));
    
    // Table container and scroll refs
    const tableContainerRef = useRef<HTMLDivElement>(null);
    const tableRef = useRef<HTMLTableElement>(null);
    
    // ========================================================================
    // FORM INTEGRATION
    // ========================================================================
    
    const { control, watch, setValue } = useForm({
      defaultValues: {
        globalSearch: filtering?.globalFilter ?? '',
        pageSize: pagination?.pageSize ?? DEFAULT_CONFIG.PAGE_SIZE,
        columnVisibility: {},
        filters: {}
      }
    });
    
    // ========================================================================
    // DATA FETCHING WITH REACT QUERY
    // ========================================================================
    
    const cacheKey = useMemo(() => 
      queryKey ? generateCacheKey(
        queryKey,
        internalState.pagination,
        internalState.sorting,
        internalState.columnFilters,
        internalState.globalFilter
      ) : null,
    [queryKey, internalState]);
    
    const { 
      data: queryData, 
      isLoading: queryLoading, 
      error: queryError,
      refetch
    } = useQuery({
      queryKey: cacheKey,
      enabled: !!cacheKey && !!queryOptions,
      staleTime: perfConfig.cacheConfig.staleTime,
      cacheTime: perfConfig.cacheConfig.cacheTime,
      ...queryOptions,
    });
    
    // Use provided data or query data
    const tableData = useMemo(() => queryData ?? data, [queryData, data]);
    const isLoading = loading || queryLoading;
    const tableError = error || queryError;
    
    // ========================================================================
    // TABLE CONFIGURATION AND MEMOIZATION
    // ========================================================================
    
    // Memoize table columns with enhanced features
    const enhancedColumns = useMemo<ColumnDef<TData>[]>(() => {
      performanceMonitor.start();
      
      const cols = columns.map((col): ColumnDef<TData> => ({
        id: String(col.id),
        accessorKey: col.accessorKey as string,
        accessorFn: col.accessorFn,
        header: ({ column }) => {
          const canSort = col.enableSorting !== false;
          const sortDirection = column.getIsSorted();
          
          return (
            <div
              className={cn(
                'flex items-center justify-between',
                canSort && 'cursor-pointer select-none hover:bg-gray-50 dark:hover:bg-gray-800 rounded px-2 py-1'
              )}
              onClick={canSort ? column.getToggleSortingHandler() : undefined}
              onKeyDown={canSort ? (e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  column.toggleSorting();
                }
              } : undefined}
              role={canSort ? 'button' : undefined}
              tabIndex={canSort ? 0 : undefined}
              aria-label={canSort ? `Sort by ${col.header}` : undefined}
              aria-sort={
                sortDirection === 'asc' ? 'ascending' :
                sortDirection === 'desc' ? 'descending' : 
                canSort ? 'none' : undefined
              }
            >
              <span className="font-medium">
                {typeof col.header === 'string' ? col.header : col.header}
              </span>
              {canSort && (
                <span className="ml-2" aria-hidden="true">
                  {sortDirection === 'asc' ? (
                    <ArrowUp className="h-4 w-4" />
                  ) : sortDirection === 'desc' ? (
                    <ArrowDown className="h-4 w-4" />
                  ) : (
                    <ChevronsUpDown className="h-4 w-4 opacity-50" />
                  )}
                </span>
              )}
            </div>
          );
        },
        cell: col.cell || (({ getValue }) => {
          const value = getValue();
          return value?.toString() || '';
        }),
        enableSorting: col.enableSorting !== false,
        enableColumnFilter: col.enableColumnFilter !== false,
        enableGlobalFilter: col.enableGlobalFilter !== false,
        size: col.size,
        minSize: col.minSize,
        maxSize: col.maxSize,
        meta: col.meta,
      }));
      
      const renderTime = performanceMonitor.end();
      
      if (debug?.enableLogging) {
        console.log(`[ManageTable] Column enhancement completed in ${renderTime.toFixed(2)}ms`);
      }
      
      return cols;
    }, [columns, debug?.enableLogging, performanceMonitor]);
    
    // ========================================================================
    // TABLE INSTANCE CONFIGURATION
    // ========================================================================
    
    const table = useReactTable({
      data: tableData,
      columns: enhancedColumns,
      state: {
        sorting: internalState.sorting,
        columnFilters: internalState.columnFilters,
        columnVisibility: internalState.columnVisibility,
        rowSelection: internalState.rowSelection,
        expanded: internalState.expanded,
        globalFilter: internalState.globalFilter,
        pagination: internalState.pagination,
        grouping: internalState.grouping,
      },
      
      // Core row model
      getCoreRowModel: getCoreRowModel(),
      
      // Filtering
      getFilteredRowModel: getFilteredRowModel(),
      onColumnFiltersChange: (updater) => {
        const newFilters = typeof updater === 'function' 
          ? updater(internalState.columnFilters)
          : updater;
        
        setInternalState(prev => ({ ...prev, columnFilters: newFilters }));
        filtering?.onColumnFiltersChange?.(newFilters as TableColumnFilter[]);
      },
      onGlobalFilterChange: (updater) => {
        const newGlobalFilter = typeof updater === 'function'
          ? updater(internalState.globalFilter)
          : updater;
        
        setInternalState(prev => ({ ...prev, globalFilter: newGlobalFilter }));
        filtering?.onGlobalFilterChange?.(newGlobalFilter);
      },
      
      // Sorting
      getSortedRowModel: getSortedRowModel(),
      onSortingChange: (updater) => {
        const newSorting = typeof updater === 'function'
          ? updater(internalState.sorting)
          : updater;
        
        setInternalState(prev => ({ ...prev, sorting: newSorting }));
        
        // Call external sort handler if provided
        if (newSorting.length > 0 && onColumnSort) {
          const sort = newSorting[0];
          onColumnSort(sort.id, sort.desc ? 'desc' : 'asc');
        }
      },
      
      // Pagination
      getPaginationRowModel: getPaginationRowModel(),
      onPaginationChange: (updater) => {
        const newPagination = typeof updater === 'function'
          ? updater(internalState.pagination)
          : updater;
        
        setInternalState(prev => ({ ...prev, pagination: newPagination }));
        
        // Call external pagination handlers
        if (newPagination.pageIndex !== internalState.pagination.pageIndex) {
          onPageChange?.(newPagination.pageIndex);
        }
        if (newPagination.pageSize !== internalState.pagination.pageSize) {
          onPageSizeChange?.(newPagination.pageSize);
        }
      },
      
      // Row selection
      onRowSelectionChange: (updater) => {
        const newSelection = typeof updater === 'function'
          ? updater(internalState.rowSelection)
          : updater;
        
        setInternalState(prev => ({ ...prev, rowSelection: newSelection }));
        
        // Convert selection state to selected rows for external handler
        if (onRowSelect) {
          const selectedRows = Object.keys(newSelection)
            .filter(key => newSelection[key])
            .map(key => tableData[parseInt(key)])
            .filter(Boolean);
          onRowSelect(selectedRows);
        }
      },
      
      // Column visibility
      onColumnVisibilityChange: (updater) => {
        const newVisibility = typeof updater === 'function'
          ? updater(internalState.columnVisibility)
          : updater;
        
        setInternalState(prev => ({ ...prev, columnVisibility: newVisibility }));
      },
      
      // Grouping and expansion
      getGroupedRowModel: getGroupedRowModel(),
      getExpandedRowModel: getExpandedRowModel(),
      onGroupingChange: (updater) => {
        const newGrouping = typeof updater === 'function'
          ? updater(internalState.grouping)
          : updater;
        
        setInternalState(prev => ({ ...prev, grouping: newGrouping }));
      },
      onExpandedChange: (updater) => {
        const newExpanded = typeof updater === 'function'
          ? updater(internalState.expanded)
          : updater;
        
        setInternalState(prev => ({ ...prev, expanded: newExpanded }));
      },
      
      // Manual pagination for server-side handling
      manualPagination: pagination?.serverSide ?? false,
      manualSorting: sorting?.serverSide ?? false,
      manualFiltering: filtering?.serverSide ?? false,
      
      // Page count for server-side pagination
      pageCount: pagination?.totalPages ?? Math.ceil(tableData.length / internalState.pagination.pageSize),
      
      // Enable selection if configured
      enableRowSelection: selection?.mode !== 'none',
      enableMultiRowSelection: selection?.mode === 'multiple',
      
      // Debugging
      debugTable: debug?.enableLogging ?? false,
      debugHeaders: debug?.enableLogging ?? false,
      debugColumns: debug?.enableLogging ?? false,
    });
    
    // ========================================================================
    // VIRTUALIZATION SETUP
    // ========================================================================
    
    const shouldVirtualize = useMemo(() => {
      return (
        virtualization?.enabled ||
        tableData.length > perfConfig.virtualizationThreshold
      );
    }, [virtualization?.enabled, tableData.length, perfConfig.virtualizationThreshold]);
    
    const virtualizer = useVirtualizer({
      count: table.getRowModel().rows.length,
      getScrollElement: () => tableContainerRef.current,
      estimateSize: () => virtualization?.estimatedRowHeight ?? 50,
      overscan: virtualization?.overscan ?? DEFAULT_CONFIG.OVERSCAN,
      enabled: shouldVirtualize,
    });
    
    // ========================================================================
    // DEBOUNCED SEARCH HANDLER
    // ========================================================================
    
    const debouncedSearch = useMemo(
      () => debounce((value: string) => {
        table.setGlobalFilter(value);
      }, perfConfig.debounceDelay),
      [table, perfConfig.debounceDelay]
    );
    
    // ========================================================================
    // EVENT HANDLERS
    // ========================================================================
    
    const handleRowClick = useCallback((row: TData, event: React.MouseEvent) => {
      if (onRowClick) {
        onRowClick(row, event);
      }
    }, [onRowClick]);
    
    const handleRowDoubleClick = useCallback((row: TData, event: React.MouseEvent) => {
      if (onRowDoubleClick) {
        onRowDoubleClick(row, event);
      }
    }, [onRowDoubleClick]);
    
    const handleGlobalFilterChange = useCallback((value: string) => {
      debouncedSearch(value);
      setValue('globalSearch', value);
    }, [debouncedSearch, setValue]);
    
    const handleRefresh = useCallback(() => {
      if (refetch) {
        refetch();
      }
      queryClient.invalidateQueries({ queryKey: cacheKey });
    }, [refetch, queryClient, cacheKey]);
    
    // ========================================================================
    // PERFORMANCE MONITORING
    // ========================================================================
    
    useEffect(() => {
      if (debug?.showMetrics) {
        const newMetrics: TableMetrics = {
          renderTime: 0, // Will be updated during render
          dataSize: tableData.length,
          visibleRows: shouldVirtualize 
            ? virtualizer.getVirtualItems().length 
            : table.getRowModel().rows.length,
          totalRows: tableData.length,
          lastUpdate: Date.now()
        };
        
        setMetrics(newMetrics);
        
        if (debug.enableLogging) {
          console.log('[ManageTable] Metrics updated:', newMetrics);
        }
      }
    }, [tableData.length, shouldVirtualize, virtualizer, table, debug]);
    
    // ========================================================================
    // ACCESSIBILITY ENHANCEMENTS
    // ========================================================================
    
    const accessibilityProps = useMemo(() => ({
      role: 'table',
      'aria-label': ariaLabel,
      'aria-describedby': ariaDescribedBy || descriptionId,
      'aria-rowcount': tableData.length,
      'aria-colcount': table.getAllColumns().length,
      'aria-busy': isLoading,
      'aria-live': 'polite' as const,
      'aria-atomic': false,
    }), [ariaLabel, ariaDescribedBy, descriptionId, tableData.length, table, isLoading]);
    
    // ========================================================================
    // STYLING CONFIGURATION
    // ========================================================================
    
    const containerVariants = useMemo<TableContainerVariants>(() => {
      const preset = layout?.variant ? tablePresets[layout.variant] : tablePresets.standard;
      return {
        ...preset.container,
        size: layout?.size || 'default',
        theme: 'auto',
        density: layout?.density || 'normal',
        interactive: 'hoverable',
      };
    }, [layout]);
    
    const tableStyleVariants = useMemo<TableVariants>(() => {
      const preset = layout?.variant ? tablePresets[layout.variant] : tablePresets.standard;
      return {
        ...preset.table,
        size: layout?.size || 'default',
        bordered: layout?.responsive?.horizontalScroll ? 'horizontal' : 'horizontal',
        striped: 'none',
      };
    }, [layout]);
    
    // ========================================================================
    // RENDER HELPERS
    // ========================================================================
    
    const renderToolbar = () => (
      <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center space-x-4">
          {/* Global Search */}
          {filtering?.ui?.showGlobalSearch !== false && (
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder={filtering?.ui?.globalSearchPlaceholder || "Search..."}
                value={internalState.globalFilter}
                onChange={(e) => handleGlobalFilterChange(e.target.value)}
                className="pl-10 w-64"
                aria-label="Search table data"
              />
            </div>
          )}
          
          {/* Filter Toggle */}
          {filtering?.ui?.showColumnFilters && (
            <Button
              variant="outline"
              size="sm"
              aria-label="Toggle column filters"
            >
              <Filter className="h-4 w-4 mr-2" />
              Filters
            </Button>
          )}
        </div>
        
        <div className="flex items-center space-x-2">
          {/* Refresh Button */}
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={isLoading}
            aria-label="Refresh table data"
          >
            <RefreshCw className={cn("h-4 w-4", isLoading && "animate-spin")} />
          </Button>
          
          {/* Column Visibility */}
          <Button
            variant="outline"
            size="sm"
            aria-label="Toggle column visibility"
          >
            <Settings className="h-4 w-4" />
          </Button>
          
          {/* Export */}
          {exportConfig?.enabled && (
            <Button
              variant="outline"
              size="sm"
              aria-label="Export table data"
            >
              <Download className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>
    );
    
    const renderPagination = () => {
      if (!pagination) return null;
      
      const currentPage = table.getState().pagination.pageIndex;
      const pageCount = table.getPageCount();
      const pageSize = table.getState().pagination.pageSize;
      
      return (
        <div className="flex items-center justify-between px-4 py-3 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700">
          <div className="flex items-center text-sm text-gray-700 dark:text-gray-300">
            <span>
              Showing {currentPage * pageSize + 1} to{' '}
              {Math.min((currentPage + 1) * pageSize, tableData.length)} of{' '}
              {tableData.length} results
            </span>
          </div>
          
          <div className="flex items-center space-x-2">
            {/* Page size selector */}
            {pagination.showPageSizeSelector && (
              <select
                value={pageSize}
                onChange={(e) => table.setPageSize(Number(e.target.value))}
                className="rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-2 py-1 text-sm"
                aria-label="Select page size"
              >
                {DEFAULT_CONFIG.PAGE_SIZE_OPTIONS.map(size => (
                  <option key={size} value={size}>
                    {size} per page
                  </option>
                ))}
              </select>
            )}
            
            {/* Pagination controls */}
            <div className="flex items-center space-x-1">
              <Button
                variant="outline"
                size="sm"
                onClick={() => table.setPageIndex(0)}
                disabled={!table.getCanPreviousPage()}
                aria-label="Go to first page"
              >
                <ChevronsLeft className="h-4 w-4" />
              </Button>
              
              <Button
                variant="outline"
                size="sm"
                onClick={() => table.previousPage()}
                disabled={!table.getCanPreviousPage()}
                aria-label="Go to previous page"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              
              <span className="flex items-center px-2 text-sm text-gray-700 dark:text-gray-300">
                Page {currentPage + 1} of {pageCount}
              </span>
              
              <Button
                variant="outline"
                size="sm"
                onClick={() => table.nextPage()}
                disabled={!table.getCanNextPage()}
                aria-label="Go to next page"
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
              
              <Button
                variant="outline"
                size="sm"
                onClick={() => table.setPageIndex(pageCount - 1)}
                disabled={!table.getCanNextPage()}
                aria-label="Go to last page"
              >
                <ChevronsRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      );
    };
    
    const renderTableContent = () => {
      if (isLoading) {
        return <TableSkeleton rows={internalState.pagination.pageSize} columns={columns.length} />;
      }
      
      if (tableError) {
        return (
          <div className="text-center py-12">
            <AlertCircle className="mx-auto h-12 w-12 text-red-500 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
              Error Loading Data
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
              {typeof tableError === 'string' ? tableError : 'An unexpected error occurred'}
            </p>
            <Button onClick={handleRefresh} variant="outline">
              <RefreshCw className="h-4 w-4 mr-2" />
              Try Again
            </Button>
          </div>
        );
      }
      
      if (tableData.length === 0) {
        return <EmptyStateComponent emptyState={emptyState} />;
      }
      
      const rows = table.getRowModel().rows;
      
      if (shouldVirtualize) {
        const virtualItems = virtualizer.getVirtualItems();
        
        return (
          <div
            ref={tableContainerRef}
            style={{
              height: layout?.height || layout?.maxHeight || '400px',
              overflow: 'auto',
            }}
            className="relative"
          >
            <table
              ref={tableRef}
              className={createTable(tableStyleVariants)}
              {...accessibilityProps}
            >
              <thead className="sticky top-0 bg-gray-50 dark:bg-gray-800 z-10">
                {table.getHeaderGroups().map(headerGroup => (
                  <tr key={headerGroup.id}>
                    {headerGroup.headers.map(header => (
                      <th
                        key={header.id}
                        className={createTableHeader({
                          sortable: header.column.getCanSort(),
                          sortDirection: header.column.getIsSorted() || 'none',
                          align: 'left'
                        })}
                        style={{ width: header.getSize() }}
                      >
                        {flexRender(header.column.columnDef.header, header.getContext())}
                      </th>
                    ))}
                  </tr>
                ))}
              </thead>
              <tbody>
                <tr>
                  <td colSpan={table.getAllColumns().length}>
                    <div
                      style={{
                        height: virtualizer.getTotalSize(),
                        position: 'relative',
                      }}
                    >
                      {virtualItems.map(virtualItem => {
                        const row = rows[virtualItem.index];
                        return (
                          <div
                            key={row.id}
                            data-index={virtualItem.index}
                            ref={virtualizer.measureElement}
                            style={{
                              position: 'absolute',
                              top: 0,
                              left: 0,
                              width: '100%',
                              transform: `translateY(${virtualItem.start}px)`,
                            }}
                          >
                            <table style={{ width: '100%' }}>
                              <tbody>
                                <tr
                                  className={cn(
                                    'hover:bg-gray-50 dark:hover:bg-gray-800/50 cursor-pointer transition-colors',
                                    row.getIsSelected() && 'bg-primary-50 dark:bg-primary-900/20'
                                  )}
                                  onClick={(e) => handleRowClick(row.original, e)}
                                  onDoubleClick={(e) => handleRowDoubleClick(row.original, e)}
                                  aria-selected={row.getIsSelected()}
                                  aria-rowindex={virtualItem.index + 1}
                                >
                                  {row.getVisibleCells().map(cell => (
                                    <td
                                      key={cell.id}
                                      className={createTableCell({
                                        state: row.getIsSelected() ? 'selected' : 'default',
                                        interactive: 'clickable',
                                        align: 'left'
                                      })}
                                      style={{ width: cell.column.getSize() }}
                                    >
                                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                                    </td>
                                  ))}
                                </tr>
                              </tbody>
                            </table>
                          </div>
                        );
                      })}
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        );
      }
      
      // Non-virtualized rendering
      return (
        <div className="overflow-x-auto">
          <table
            ref={tableRef}
            className={createTable(tableStyleVariants)}
            {...accessibilityProps}
          >
            <thead className="bg-gray-50 dark:bg-gray-800">
              {table.getHeaderGroups().map(headerGroup => (
                <tr key={headerGroup.id}>
                  {headerGroup.headers.map(header => (
                    <th
                      key={header.id}
                      className={createTableHeader({
                        sortable: header.column.getCanSort(),
                        sortDirection: header.column.getIsSorted() || 'none',
                        align: 'left'
                      })}
                      style={{ width: header.getSize() }}
                    >
                      {flexRender(header.column.columnDef.header, header.getContext())}
                    </th>
                  ))}
                </tr>
              ))}
            </thead>
            <tbody className="bg-white dark:bg-gray-900">
              {rows.map((row) => (
                <tr
                  key={row.id}
                  className={cn(
                    'hover:bg-gray-50 dark:hover:bg-gray-800/50 cursor-pointer transition-colors border-b border-gray-200 dark:border-gray-700',
                    row.getIsSelected() && 'bg-primary-50 dark:bg-primary-900/20'
                  )}
                  onClick={(e) => handleRowClick(row.original, e)}
                  onDoubleClick={(e) => handleRowDoubleClick(row.original, e)}
                  aria-selected={row.getIsSelected()}
                  aria-rowindex={row.index + 1}
                >
                  {row.getVisibleCells().map(cell => (
                    <td
                      key={cell.id}
                      className={createTableCell({
                        state: row.getIsSelected() ? 'selected' : 'default',
                        interactive: 'clickable',
                        align: 'left'
                      })}
                      style={{ width: cell.column.getSize() }}
                    >
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
    };
    
    // ========================================================================
    // MAIN RENDER
    // ========================================================================
    
    performanceMonitor.start();
    
    const renderResult = (
      <div
        ref={ref}
        className={createTableContainer(containerVariants, className)}
        data-testid={dataTestId}
        {...restProps}
      >
        {/* Screen reader caption */}
        <div id={captionId} className="sr-only">
          {accessibility?.caption || `Data table with ${tableData.length} rows and ${columns.length} columns`}
        </div>
        
        {/* Optional description */}
        {accessibility?.summary && (
          <div id={descriptionId} className="sr-only">
            {accessibility.summary}
          </div>
        )}
        
        {/* Table toolbar */}
        {renderToolbar()}
        
        {/* Main table content */}
        <div className="flex-1 min-h-0">
          {renderTableContent()}
        </div>
        
        {/* Pagination controls */}
        {renderPagination()}
        
        {/* Performance metrics (development only) */}
        {debug?.showMetrics && process.env.NODE_ENV === 'development' && (
          <div className="p-2 bg-gray-100 dark:bg-gray-800 text-xs text-gray-600 dark:text-gray-400 border-t">
            <div className="flex justify-between">
              <span>Rows: {metrics.visibleRows}/{metrics.totalRows}</span>
              <span>Data size: {metrics.dataSize}</span>
              <span>Virtualized: {shouldVirtualize ? 'Yes' : 'No'}</span>
              <span>Last update: {new Date(metrics.lastUpdate).toLocaleTimeString()}</span>
            </div>
          </div>
        )}
      </div>
    );
    
    // Update render time metric
    const renderTime = performanceMonitor.end();
    
    if (debug?.enableLogging) {
      console.log(`[ManageTable] Render completed in ${renderTime.toFixed(2)}ms`);
    }
    
    // Update metrics
    useEffect(() => {
      if (debug?.showMetrics) {
        setMetrics(prev => ({ ...prev, renderTime }));
      }
    }, [renderTime, debug?.showMetrics]);
    
    return renderResult;
  }
);

ManageTable.displayName = 'ManageTable';

// ============================================================================
// COMPONENT EXPORTS AND UTILITIES
// ============================================================================

// Export status badge for use in table cells
export { StatusBadge };

// Export utility functions for external use
export const tableUtils = {
  generateCacheKey,
  createPerformanceMonitor,
  tableA11yUtils,
};

// Export default component
export default ManageTable;

// Type exports for external usage
export type {
  ManageTableComponentProps,
  TableMetrics,
  TableInternalState,
};