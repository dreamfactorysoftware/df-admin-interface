/**
 * Tables Table Component for Database Schema Management
 * 
 * React component that displays and manages a table of database table schemas with
 * TanStack Virtual for large dataset handling. Replaces Angular DfManageTablesTableComponent
 * with React Query for data fetching, Headless UI table components with Tailwind CSS styling,
 * and Next.js routing for navigation.
 * 
 * Features:
 * - Database table schema listing with virtual scrolling (1000+ tables)
 * - React Query cached schema metadata with TTL configuration
 * - Table filtering, viewing, and deletion capabilities
 * - Responsive design with Tailwind CSS utility classes
 * - WCAG 2.1 AA compliance for accessibility
 * - Next.js router integration for navigation
 * 
 * Performance optimizations:
 * - TanStack Virtual for efficient rendering of large datasets
 * - React Query intelligent caching (staleTime: 300s, cacheTime: 900s)
 * - Memoized components and callbacks for optimal re-rendering
 * - Progressive loading with configurable page sizes
 */

'use client';

import React, { useMemo, useCallback, useState, useEffect, useRef } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useVirtualizer } from '@tanstack/react-virtual';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { 
  ChevronUpDownIcon, 
  EyeIcon, 
  TrashIcon, 
  MagnifyingGlassIcon,
  ExclamationTriangleIcon,
  CheckIcon,
  XMarkIcon
} from '@heroicons/react/24/outline';
import { Menu, Transition, Dialog } from '@headlessui/react';
import { Fragment } from 'react';

// =============================================================================
// TYPE DEFINITIONS AND INTERFACES
// =============================================================================

/**
 * Database table schema interface optimized for React Query and virtual scrolling
 */
interface TableSchema {
  name: string;
  label?: string;
  description?: string;
  schema?: string;
  
  // Table metadata
  rowCount?: number;
  estimatedSize?: string;
  lastModified?: string;
  isView: boolean;
  
  // Field information
  fieldCount: number;
  primaryKeyFields: string[];
  foreignKeyCount: number;
  indexCount: number;
  
  // API generation status
  apiEnabled?: boolean;
  endpointGenerated?: boolean;
  access?: number;
  
  // React component state
  expanded?: boolean;
  selected?: boolean;
  loading?: boolean;
}

/**
 * Table filter form schema with Zod validation
 */
const filterFormSchema = z.object({
  searchTerm: z.string().optional(),
  showViews: z.boolean().default(true),
  showTables: z.boolean().default(true),
  hasData: z.enum(['all', 'with-data', 'empty']).default('all'),
  apiStatus: z.enum(['all', 'enabled', 'disabled']).default('all'),
  sortBy: z.enum(['name', 'rowCount', 'lastModified', 'fieldCount']).default('name'),
  sortOrder: z.enum(['asc', 'desc']).default('asc')
});

type FilterFormData = z.infer<typeof filterFormSchema>;

/**
 * Query configuration for React Query integration
 */
interface TableSchemasQuery {
  serviceName: string;
  database: string;
  filters?: Partial<FilterFormData>;
  page?: number;
  pageSize?: number;
}

/**
 * API response structure for table schemas
 */
interface TableSchemasResponse {
  resource: TableSchema[];
  meta: {
    count: number;
    total: number;
    offset: number;
    limit: number;
  };
}

// =============================================================================
// REACT QUERY HOOKS AND API FUNCTIONS
// =============================================================================

/**
 * API client function for fetching table schemas
 */
const fetchTableSchemas = async ({ 
  serviceName, 
  database, 
  filters, 
  page = 0, 
  pageSize = 50 
}: TableSchemasQuery): Promise<TableSchemasResponse> => {
  const params = new URLSearchParams({
    offset: (page * pageSize).toString(),
    limit: pageSize.toString(),
    include_schema: 'true',
    include_count: 'true'
  });

  // Apply filters
  if (filters?.searchTerm) {
    params.append('filter', `name like "${filters.searchTerm}%"`);
  }

  if (filters?.showViews === false) {
    params.append('filter', 'is_view = false');
  }

  if (filters?.showTables === false) {
    params.append('filter', 'is_view = true');
  }

  if (filters?.hasData === 'with-data') {
    params.append('filter', 'row_count > 0');
  } else if (filters?.hasData === 'empty') {
    params.append('filter', 'row_count = 0');
  }

  // Sorting
  if (filters?.sortBy && filters?.sortOrder) {
    const sortField = filters.sortBy === 'rowCount' ? 'row_count' : 
                     filters.sortBy === 'lastModified' ? 'last_modified' :
                     filters.sortBy === 'fieldCount' ? 'field_count' : 'name';
    params.append('order', `${sortField} ${filters.sortOrder}`);
  }

  const response = await fetch(`/api/v2/${serviceName}/_schema?${params}`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    },
    credentials: 'include'
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch table schemas: ${response.statusText}`);
  }

  return response.json();
};

/**
 * Custom hook for table schemas data fetching with React Query
 */
const useTableSchemas = (serviceName: string, database: string, filters?: Partial<FilterFormData>) => {
  return useQuery({
    queryKey: ['tableSchemas', serviceName, database, filters],
    queryFn: () => fetchTableSchemas({ serviceName, database, filters }),
    staleTime: 5 * 60 * 1000, // 5 minutes (300 seconds) per specification
    gcTime: 15 * 60 * 1000, // 15 minutes (900 seconds) per specification
    enabled: Boolean(serviceName && database),
    keepPreviousData: true,
    refetchOnWindowFocus: false,
    retry: (failureCount, error) => {
      if (error instanceof Error && error.message.includes('401')) {
        return false; // Don't retry on authentication errors
      }
      return failureCount < 3;
    }
  });
};

/**
 * Custom hook for table deletion mutation
 */
const useDeleteTable = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ serviceName, tableName }: { serviceName: string; tableName: string }) => {
      const response = await fetch(`/api/v2/${serviceName}/_schema/${tableName}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include'
      });

      if (!response.ok) {
        throw new Error(`Failed to delete table: ${response.statusText}`);
      }

      return response.json();
    },
    onSuccess: (_, { serviceName }) => {
      // Invalidate and refetch table schemas after deletion
      queryClient.invalidateQueries({ queryKey: ['tableSchemas', serviceName] });
    }
  });
};

// =============================================================================
// UI COMPONENTS
// =============================================================================

/**
 * Loading skeleton component for table rows
 */
const TableRowSkeleton: React.FC = () => (
  <div className="h-12 border-b border-gray-200 dark:border-gray-700 animate-pulse">
    <div className="flex items-center px-6 py-3 space-x-4">
      <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded w-1/4"></div>
      <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded w-1/6"></div>
      <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded w-1/6"></div>
      <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded w-1/6"></div>
      <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded w-1/6"></div>
      <div className="h-8 bg-gray-300 dark:bg-gray-600 rounded w-20"></div>
    </div>
  </div>
);

/**
 * Error boundary component for graceful error handling
 */
const ErrorDisplay: React.FC<{ error: Error; retry: () => void }> = ({ error, retry }) => (
  <div className="flex flex-col items-center justify-center p-8 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800">
    <ExclamationTriangleIcon className="h-12 w-12 text-red-500 dark:text-red-400 mb-4" />
    <h3 className="text-lg font-semibold text-red-900 dark:text-red-100 mb-2">
      Failed to Load Table Schemas
    </h3>
    <p className="text-red-700 dark:text-red-300 text-center mb-4 max-w-md">
      {error.message || 'An unexpected error occurred while fetching table schemas.'}
    </p>
    <button
      onClick={retry}
      className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-md transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
    >
      Try Again
    </button>
  </div>
);

/**
 * Empty state component when no tables are found
 */
const EmptyState: React.FC<{ hasFilters: boolean; onClearFilters: () => void }> = ({ 
  hasFilters, 
  onClearFilters 
}) => (
  <div className="flex flex-col items-center justify-center p-12 text-gray-500 dark:text-gray-400">
    <div className="w-16 h-16 mb-4 bg-gray-200 dark:bg-gray-700 rounded-full flex items-center justify-center">
      <MagnifyingGlassIcon className="h-8 w-8" />
    </div>
    <h3 className="text-lg font-medium mb-2">
      {hasFilters ? 'No tables match your filters' : 'No tables found'}
    </h3>
    <p className="text-sm text-center mb-4 max-w-sm">
      {hasFilters 
        ? 'Try adjusting your search criteria or filters to find tables.'
        : 'This database does not contain any tables or views.'
      }
    </p>
    {hasFilters && (
      <button
        onClick={onClearFilters}
        className="px-4 py-2 text-sm bg-blue-600 hover:bg-blue-700 text-white rounded-md transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
      >
        Clear Filters
      </button>
    )}
  </div>
);

/**
 * Confirmation dialog for table deletion
 */
const DeleteConfirmationDialog: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  tableName: string;
  isDeleting: boolean;
}> = ({ isOpen, onClose, onConfirm, tableName, isDeleting }) => (
  <Transition appear show={isOpen} as={Fragment}>
    <Dialog as="div" className="relative z-50" onClose={onClose}>
      <Transition.Child
        as={Fragment}
        enter="ease-out duration-300"
        enterFrom="opacity-0"
        enterTo="opacity-100"
        leave="ease-in duration-200"
        leaveFrom="opacity-100"
        leaveTo="opacity-0"
      >
        <div className="fixed inset-0 bg-black bg-opacity-25" />
      </Transition.Child>

      <div className="fixed inset-0 overflow-y-auto">
        <div className="flex min-h-full items-center justify-center p-4 text-center">
          <Transition.Child
            as={Fragment}
            enter="ease-out duration-300"
            enterFrom="opacity-0 scale-95"
            enterTo="opacity-100 scale-100"
            leave="ease-in duration-200"
            leaveFrom="opacity-100 scale-100"
            leaveTo="opacity-0 scale-95"
          >
            <Dialog.Panel className="w-full max-w-md transform overflow-hidden rounded-2xl bg-white dark:bg-gray-800 p-6 text-left align-middle shadow-xl transition-all">
              <Dialog.Title
                as="h3"
                className="text-lg font-medium leading-6 text-gray-900 dark:text-gray-100 mb-4"
              >
                Delete Table "{tableName}"
              </Dialog.Title>
              
              <div className="mb-6">
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Are you sure you want to delete this table? This action cannot be undone and will permanently remove all data and structure.
                </p>
              </div>

              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-md transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
                  onClick={onClose}
                  disabled={isDeleting}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-md transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
                  onClick={onConfirm}
                  disabled={isDeleting}
                >
                  {isDeleting ? 'Deleting...' : 'Delete Table'}
                </button>
              </div>
            </Dialog.Panel>
          </Transition.Child>
        </div>
      </div>
    </Dialog>
  </Transition>
);

// =============================================================================
// MAIN COMPONENT
// =============================================================================

/**
 * Tables Table Component
 * 
 * Main component for displaying and managing database table schemas with virtual scrolling,
 * filtering, and CRUD operations. Implements React Query for data management and TanStack
 * Virtual for performance optimization with large datasets.
 */
export const TablesTable: React.FC = () => {
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();
  
  // Extract service name from URL parameters
  const serviceName = params?.service as string;
  const database = searchParams?.get('database') || '';
  
  // Component state
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [tableToDelete, setTableToDelete] = useState<string | null>(null);
  const [selectedTables, setSelectedTables] = useState<Set<string>>(new Set());
  
  // Virtual scrolling setup
  const parentRef = useRef<HTMLDivElement>(null);
  
  // Form setup for filters
  const {
    control,
    watch,
    setValue,
    reset: resetFilters,
    handleSubmit
  } = useForm<FilterFormData>({
    resolver: zodResolver(filterFormSchema),
    defaultValues: {
      searchTerm: '',
      showViews: true,
      showTables: true,
      hasData: 'all',
      apiStatus: 'all',
      sortBy: 'name',
      sortOrder: 'asc'
    }
  });
  
  const filters = watch();
  
  // React Query hooks
  const {
    data: tableData,
    isLoading,
    isError,
    error,
    refetch
  } = useTableSchemas(serviceName, database, filters);
  
  const deleteTableMutation = useDeleteTable();
  
  // Memoized table data for virtual scrolling
  const tables = useMemo(() => tableData?.resource || [], [tableData]);
  
  // Virtual scrolling configuration
  const virtualizer = useVirtualizer({
    count: tables.length,
    getScrollElement: () => parentRef.current,
    estimateSize: useCallback(() => 48, []), // 48px row height
    overscan: 10 // Render 10 extra items for smooth scrolling
  });
  
  // Event handlers
  const handleTableView = useCallback((tableName: string) => {
    router.push(`/adf-schema/tables/${encodeURIComponent(tableName)}?service=${serviceName}&database=${database}`);
  }, [router, serviceName, database]);
  
  const handleTableDelete = useCallback((tableName: string) => {
    setTableToDelete(tableName);
    setDeleteDialogOpen(true);
  }, []);
  
  const handleDeleteConfirm = useCallback(async () => {
    if (!tableToDelete) return;
    
    try {
      await deleteTableMutation.mutateAsync({
        serviceName,
        tableName: tableToDelete
      });
      setDeleteDialogOpen(false);
      setTableToDelete(null);
    } catch (error) {
      console.error('Failed to delete table:', error);
      // Error handling is managed by the mutation hook
    }
  }, [tableToDelete, deleteTableMutation, serviceName]);
  
  const handleClearFilters = useCallback(() => {
    resetFilters();
  }, [resetFilters]);
  
  const handleTableSelect = useCallback((tableName: string, selected: boolean) => {
    const newSelection = new Set(selectedTables);
    if (selected) {
      newSelection.add(tableName);
    } else {
      newSelection.delete(tableName);
    }
    setSelectedTables(newSelection);
  }, [selectedTables]);
  
  const handleSelectAll = useCallback((selected: boolean) => {
    if (selected) {
      setSelectedTables(new Set(tables.map(table => table.name)));
    } else {
      setSelectedTables(new Set());
    }
  }, [tables]);
  
  // Check for active filters
  const hasActiveFilters = useMemo(() => {
    return Boolean(
      filters.searchTerm ||
      !filters.showViews ||
      !filters.showTables ||
      filters.hasData !== 'all' ||
      filters.apiStatus !== 'all'
    );
  }, [filters]);
  
  // Loading state
  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="h-16 bg-gray-100 dark:bg-gray-800 rounded-lg animate-pulse" />
        <div className="space-y-2">
          {Array.from({ length: 10 }).map((_, index) => (
            <TableRowSkeleton key={index} />
          ))}
        </div>
      </div>
    );
  }
  
  // Error state
  if (isError && error) {
    return <ErrorDisplay error={error as Error} retry={refetch} />;
  }
  
  // Empty state
  if (!tables.length) {
    return <EmptyState hasFilters={hasActiveFilters} onClearFilters={handleClearFilters} />;
  }
  
  return (
    <div className="space-y-6">
      {/* Header and Filters */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
              Database Tables
            </h2>
            <div className="text-sm text-gray-500 dark:text-gray-400">
              {tableData?.meta.total || 0} tables found
            </div>
          </div>
          
          {/* Filter Controls */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Search Input */}
            <div className="relative">
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Controller
                name="searchTerm"
                control={control}
                render={({ field }) => (
                  <input
                    {...field}
                    type="text"
                    placeholder="Search tables..."
                    className="pl-10 pr-4 py-2 w-full border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                )}
              />
            </div>
            
            {/* Data Filter */}
            <Controller
              name="hasData"
              control={control}
              render={({ field }) => (
                <select
                  {...field}
                  className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="all">All Tables</option>
                  <option value="with-data">With Data</option>
                  <option value="empty">Empty Tables</option>
                </select>
              )}
            />
            
            {/* Sort Controls */}
            <Controller
              name="sortBy"
              control={control}
              render={({ field }) => (
                <select
                  {...field}
                  className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="name">Sort by Name</option>
                  <option value="rowCount">Sort by Row Count</option>
                  <option value="lastModified">Sort by Modified</option>
                  <option value="fieldCount">Sort by Fields</option>
                </select>
              )}
            />
            
            {/* Sort Order */}
            <Controller
              name="sortOrder"
              control={control}
              render={({ field }) => (
                <div className="flex">
                  <select
                    {...field}
                    className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-l-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="asc">Ascending</option>
                    <option value="desc">Descending</option>
                  </select>
                  {hasActiveFilters && (
                    <button
                      onClick={handleClearFilters}
                      className="px-3 py-2 bg-gray-100 dark:bg-gray-600 hover:bg-gray-200 dark:hover:bg-gray-500 border border-l-0 border-gray-300 dark:border-gray-600 rounded-r-md text-gray-700 dark:text-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      title="Clear filters"
                    >
                      <XMarkIcon className="h-4 w-4" />
                    </button>
                  )}
                </div>
              )}
            />
          </div>
          
          {/* Table Type Toggles */}
          <div className="flex items-center space-x-6 mt-4">
            <Controller
              name="showTables"
              control={control}
              render={({ field: { value, onChange } }) => (
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={value}
                    onChange={(e) => onChange(e.target.checked)}
                    className="h-4 w-4 text-blue-600 border-gray-300 dark:border-gray-600 rounded focus:ring-blue-500"
                  />
                  <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">Show Tables</span>
                </label>
              )}
            />
            <Controller
              name="showViews"
              control={control}
              render={({ field: { value, onChange } }) => (
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={value}
                    onChange={(e) => onChange(e.target.checked)}
                    className="h-4 w-4 text-blue-600 border-gray-300 dark:border-gray-600 rounded focus:ring-blue-500"
                  />
                  <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">Show Views</span>
                </label>
              )}
            />
          </div>
        </div>
      </div>
      
      {/* Table Container with Virtual Scrolling */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
        {/* Table Header */}
        <div className="px-6 py-3 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700/50">
          <div className="grid grid-cols-12 gap-4 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
            <div className="col-span-1">
              <input
                type="checkbox"
                checked={selectedTables.size === tables.length && tables.length > 0}
                onChange={(e) => handleSelectAll(e.target.checked)}
                className="h-4 w-4 text-blue-600 border-gray-300 dark:border-gray-600 rounded focus:ring-blue-500"
              />
            </div>
            <div className="col-span-3">Name</div>
            <div className="col-span-1">Type</div>
            <div className="col-span-2">Rows</div>
            <div className="col-span-2">Fields</div>
            <div className="col-span-2">Last Modified</div>
            <div className="col-span-1">Actions</div>
          </div>
        </div>
        
        {/* Virtual Scrolling Container */}
        <div
          ref={parentRef}
          className="h-96 overflow-auto"
          style={{
            contain: 'strict'
          }}
        >
          <div
            style={{
              height: `${virtualizer.getTotalSize()}px`,
              width: '100%',
              position: 'relative'
            }}
          >
            {virtualizer.getVirtualItems().map((virtualItem) => {
              const table = tables[virtualItem.index];
              const isSelected = selectedTables.has(table.name);
              
              return (
                <div
                  key={virtualItem.key}
                  style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: '100%',
                    height: `${virtualItem.size}px`,
                    transform: `translateY(${virtualItem.start}px)`
                  }}
                  className="border-b border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors duration-150"
                >
                  <div className="px-6 py-3">
                    <div className="grid grid-cols-12 gap-4 items-center">
                      {/* Selection Checkbox */}
                      <div className="col-span-1">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={(e) => handleTableSelect(table.name, e.target.checked)}
                          className="h-4 w-4 text-blue-600 border-gray-300 dark:border-gray-600 rounded focus:ring-blue-500"
                        />
                      </div>
                      
                      {/* Table Name */}
                      <div className="col-span-3">
                        <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
                          {table.name}
                        </div>
                        {table.label && table.label !== table.name && (
                          <div className="text-xs text-gray-500 dark:text-gray-400">
                            {table.label}
                          </div>
                        )}
                      </div>
                      
                      {/* Type */}
                      <div className="col-span-1">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          table.isView 
                            ? 'bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-300'
                            : 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-300'
                        }`}>
                          {table.isView ? 'View' : 'Table'}
                        </span>
                      </div>
                      
                      {/* Row Count */}
                      <div className="col-span-2">
                        <div className="text-sm text-gray-900 dark:text-gray-100">
                          {table.rowCount?.toLocaleString() || '—'}
                        </div>
                        {table.estimatedSize && (
                          <div className="text-xs text-gray-500 dark:text-gray-400">
                            {table.estimatedSize}
                          </div>
                        )}
                      </div>
                      
                      {/* Field Count */}
                      <div className="col-span-2">
                        <div className="text-sm text-gray-900 dark:text-gray-100">
                          {table.fieldCount} fields
                        </div>
                        {table.primaryKeyFields.length > 0 && (
                          <div className="text-xs text-gray-500 dark:text-gray-400">
                            PK: {table.primaryKeyFields.join(', ')}
                          </div>
                        )}
                      </div>
                      
                      {/* Last Modified */}
                      <div className="col-span-2">
                        <div className="text-sm text-gray-900 dark:text-gray-100">
                          {table.lastModified 
                            ? new Date(table.lastModified).toLocaleDateString()
                            : '—'
                          }
                        </div>
                      </div>
                      
                      {/* Actions */}
                      <div className="col-span-1">
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => handleTableView(table.name)}
                            className="p-1 text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 transition-colors duration-200"
                            title="View table details"
                          >
                            <EyeIcon className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleTableDelete(table.name)}
                            className="p-1 text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 transition-colors duration-200"
                            title="Delete table"
                          >
                            <TrashIcon className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
        
        {/* Table Footer with Pagination Info */}
        {tableData?.meta && (
          <div className="px-6 py-3 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700/50">
            <div className="flex items-center justify-between text-sm text-gray-500 dark:text-gray-400">
              <div>
                Showing {tableData.meta.offset + 1} to {Math.min(tableData.meta.offset + tableData.meta.limit, tableData.meta.total)} of {tableData.meta.total} tables
              </div>
              <div>
                {selectedTables.size > 0 && (
                  <span>
                    {selectedTables.size} table{selectedTables.size !== 1 ? 's' : ''} selected
                  </span>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
      
      {/* Delete Confirmation Dialog */}
      <DeleteConfirmationDialog
        isOpen={deleteDialogOpen}
        onClose={() => {
          setDeleteDialogOpen(false);
          setTableToDelete(null);
        }}
        onConfirm={handleDeleteConfirm}
        tableName={tableToDelete || ''}
        isDeleting={deleteTableMutation.isPending}
      />
    </div>
  );
};

export default TablesTable;