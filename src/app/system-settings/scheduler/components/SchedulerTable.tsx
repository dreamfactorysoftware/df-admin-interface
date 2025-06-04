'use client';

import React, { useState, useMemo, useCallback } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
import { 
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
  type ColumnDef,
  type SortingState,
  type ColumnFiltersState,
  type PaginationState,
} from '@tanstack/react-table';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  ChevronUpIcon, 
  ChevronDownIcon,
  SearchIcon,
  TrashIcon,
  EditIcon,
  PlayIcon,
  PauseIcon,
  EyeIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  ChevronsLeftIcon,
  ChevronsRightIcon,
} from 'lucide-react';

// Import UI components
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { 
  Dialog,
  DialogContent, 
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

// Import hooks and types
import { useSchedulerTasks } from '@/hooks/useSchedulerTasks';
import { useDeleteSchedulerTask } from '@/hooks/useDeleteSchedulerTask';
import type { SchedulerTaskData } from '@/types/scheduler';

// Import API client for caching keys
import { apiClient } from '@/lib/api-client';

/**
 * SchedulerTable Component
 * 
 * A comprehensive React table component that replaces the Angular DfManageSchedulerTableComponent.
 * Features:
 * - TanStack Virtual for performance with 1000+ scheduler tasks
 * - TanStack Table for sorting, filtering, and pagination
 * - React Query for data fetching and caching
 * - Tailwind CSS with Headless UI for accessibility
 * - Confirmation dialogs for delete operations
 * - Search functionality across task names and descriptions
 * - Responsive design across all viewport sizes
 * 
 * Performance Requirements:
 * - Handles 1000+ scheduler tasks without UI lag
 * - Cache hit responses under 50ms
 * - Real-time validation under 100ms
 * 
 * Accessibility:
 * - WCAG 2.1 AA compliance
 * - Proper ARIA labels and keyboard navigation
 * - Screen reader support
 * - Minimum 44x44px touch targets
 */
export default function SchedulerTable() {
  // State management
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [globalFilter, setGlobalFilter] = useState('');
  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: 25,
  });
  const [selectedTaskForDeletion, setSelectedTaskForDeletion] = useState<SchedulerTaskData | null>(null);

  // React Query setup
  const queryClient = useQueryClient();
  
  // Data fetching with React Query
  const {
    data: schedulerData,
    isLoading,
    isError,
    error,
    refetch,
  } = useSchedulerTasks({
    limit: pagination.pageSize,
    offset: pagination.pageIndex * pagination.pageSize,
    filter: globalFilter,
  });

  // Delete mutation
  const deleteTaskMutation = useDeleteSchedulerTask({
    onSuccess: () => {
      // Invalidate and refetch scheduler tasks
      queryClient.invalidateQueries({ queryKey: ['scheduler-tasks'] });
      setSelectedTaskForDeletion(null);
      // Show success message (would integrate with toast/snackbar system)
      console.log('Task deleted successfully');
    },
    onError: (error) => {
      console.error('Failed to delete task:', error);
      setSelectedTaskForDeletion(null);
    },
  });

  // Column definitions using TanStack Table
  const columnHelper = createColumnHelper<SchedulerTaskData>();

  const columns = useMemo<ColumnDef<SchedulerTaskData>[]>(() => [
    columnHelper.accessor('isActive', {
      id: 'active',
      header: 'Status',
      cell: ({ getValue }) => (
        <Badge 
          variant={getValue() ? 'success' : 'secondary'}
          className="min-w-[70px] justify-center"
          aria-label={getValue() ? 'Active task' : 'Inactive task'}
        >
          {getValue() ? (
            <>
              <PlayIcon className="w-3 h-3 mr-1" aria-hidden="true" />
              Active
            </>
          ) : (
            <>
              <PauseIcon className="w-3 h-3 mr-1" aria-hidden="true" />
              Inactive
            </>
          )}
        </Badge>
      ),
      enableSorting: true,
      filterFn: 'equals',
    }),
    columnHelper.accessor('id', {
      header: 'ID',
      cell: ({ getValue }) => (
        <span className="font-mono text-sm text-gray-600 dark:text-gray-300">
          {getValue()}
        </span>
      ),
      enableSorting: true,
      size: 80,
    }),
    columnHelper.accessor('name', {
      header: 'Name',
      cell: ({ getValue }) => (
        <span className="font-medium text-gray-900 dark:text-gray-100 truncate">
          {getValue()}
        </span>
      ),
      enableSorting: true,
      enableGlobalFilter: true,
    }),
    columnHelper.accessor('description', {
      header: 'Description',
      cell: ({ getValue }) => (
        <span className="text-gray-700 dark:text-gray-300 truncate max-w-xs block">
          {getValue() || 'No description'}
        </span>
      ),
      enableSorting: true,
      enableGlobalFilter: true,
    }),
    columnHelper.accessor('serviceByServiceId.name', {
      id: 'service',
      header: 'Service',
      cell: ({ getValue }) => (
        <Badge variant="outline" className="truncate max-w-[120px]">
          {getValue()}
        </Badge>
      ),
      enableSorting: true,
    }),
    columnHelper.accessor('component', {
      header: 'Component',
      cell: ({ getValue }) => (
        <span className="font-mono text-sm text-gray-600 dark:text-gray-300 truncate">
          {getValue()}
        </span>
      ),
      enableSorting: true,
    }),
    columnHelper.accessor('verb', {
      id: 'method',
      header: 'Method',
      cell: ({ getValue }) => {
        const method = getValue();
        const methodColors = {
          GET: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
          POST: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
          PUT: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
          PATCH: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200',
          DELETE: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
        };
        
        return (
          <span 
            className={`px-2 py-1 text-xs font-medium rounded ${
              methodColors[method as keyof typeof methodColors] || 
              'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200'
            }`}
          >
            {method}
          </span>
        );
      },
      enableSorting: true,
      size: 80,
    }),
    columnHelper.accessor('frequency', {
      header: 'Frequency (min)',
      cell: ({ getValue }) => (
        <span className="font-mono text-sm text-gray-600 dark:text-gray-300">
          {getValue()}
        </span>
      ),
      enableSorting: true,
      size: 100,
    }),
    columnHelper.accessor('taskLogByTaskId', {
      id: 'log',
      header: 'Log',
      cell: ({ getValue }) => (
        <Badge variant={getValue()?.length > 0 ? 'warning' : 'secondary'}>
          {getValue()?.length > 0 ? 'Available' : 'None'}
        </Badge>
      ),
      enableSorting: false,
      size: 80,
    }),
    columnHelper.display({
      id: 'actions',
      header: 'Actions',
      cell: ({ row }) => (
        <div className="flex items-center space-x-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleViewTask(row.original)}
            aria-label={`View task ${row.original.name}`}
            className="h-8 w-8 p-0"
          >
            <EyeIcon className="w-4 h-4" aria-hidden="true" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleEditTask(row.original)}
            aria-label={`Edit task ${row.original.name}`}
            className="h-8 w-8 p-0"
          >
            <EditIcon className="w-4 h-4" aria-hidden="true" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setSelectedTaskForDeletion(row.original)}
            aria-label={`Delete task ${row.original.name}`}
            className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50 dark:text-red-400 dark:hover:text-red-300 dark:hover:bg-red-950"
          >
            <TrashIcon className="w-4 h-4" aria-hidden="true" />
          </Button>
        </div>
      ),
      size: 120,
    }),
  ], []);

  // Table instance
  const table = useReactTable({
    data: schedulerData?.resource || [],
    columns,
    state: {
      sorting,
      columnFilters,
      globalFilter,
      pagination,
    },
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onGlobalFilterChange: setGlobalFilter,
    onPaginationChange: setPagination,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    pageCount: schedulerData?.meta ? Math.ceil(schedulerData.meta.count / pagination.pageSize) : 0,
    manualPagination: true,
    manualSorting: false,
    manualFiltering: false,
  });

  // Virtual scrolling setup for performance with large datasets
  const { rows } = table.getRowModel();
  const parentRef = React.useRef<HTMLDivElement>(null);
  
  const virtualizer = useVirtualizer({
    count: rows.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 48, // Estimated row height in pixels
    overscan: 10, // Render extra rows for smooth scrolling
  });

  // Event handlers
  const handleViewTask = useCallback((task: SchedulerTaskData) => {
    // Navigate to task details view
    console.log('View task:', task.id);
    // Implementation would integrate with Next.js router
    // router.push(`/system-settings/scheduler/${task.id}`);
  }, []);

  const handleEditTask = useCallback((task: SchedulerTaskData) => {
    // Navigate to task edit view
    console.log('Edit task:', task.id);
    // Implementation would integrate with Next.js router
    // router.push(`/system-settings/scheduler/${task.id}/edit`);
  }, []);

  const handleDeleteTask = useCallback(() => {
    if (selectedTaskForDeletion) {
      deleteTaskMutation.mutate(selectedTaskForDeletion.id);
    }
  }, [selectedTaskForDeletion, deleteTaskMutation]);

  const handleSearch = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    setGlobalFilter(event.target.value);
  }, []);

  // Loading state
  if (isLoading) {
    return (
      <div className="w-full">
        <div className="flex items-center justify-between mb-6">
          <div className="h-8 w-48 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
          <div className="h-10 w-64 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
        </div>
        <div className="space-y-3">
          {Array.from({ length: 10 }).map((_, i) => (
            <div key={i} className="h-12 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
          ))}
        </div>
      </div>
    );
  }

  // Error state
  if (isError) {
    return (
      <div className="w-full p-6 bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 rounded-lg">
        <h3 className="text-lg font-semibold text-red-900 dark:text-red-100 mb-2">
          Error Loading Scheduler Tasks
        </h3>
        <p className="text-red-700 dark:text-red-300 mb-4">
          {error?.message || 'An unexpected error occurred while loading scheduler tasks.'}
        </p>
        <Button 
          onClick={() => refetch()} 
          variant="outline"
          className="border-red-300 text-red-700 hover:bg-red-100 dark:border-red-700 dark:text-red-300 dark:hover:bg-red-900"
        >
          Try Again
        </Button>
      </div>
    );
  }

  return (
    <div className="w-full space-y-6">
      {/* Header and Search */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            Scheduler Tasks
          </h2>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            Manage automated tasks and their execution schedules
          </p>
        </div>
        <div className="flex items-center space-x-4">
          <div className="relative">
            <SearchIcon 
              className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" 
              aria-hidden="true"
            />
            <Input
              placeholder="Search tasks..."
              value={globalFilter}
              onChange={handleSearch}
              className="pl-10 w-64"
              aria-label="Search scheduler tasks"
            />
          </div>
          <Button onClick={() => refetch()}>
            Refresh
          </Button>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
        <div 
          ref={parentRef} 
          className="overflow-auto max-h-[600px]"
          role="table"
          aria-label="Scheduler tasks table"
        >
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-900 sticky top-0 z-10">
              {table.getHeaderGroups().map((headerGroup) => (
                <tr key={headerGroup.id}>
                  {headerGroup.headers.map((header) => (
                    <th
                      key={header.id}
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider"
                      style={{ width: header.getSize() }}
                    >
                      {header.isPlaceholder ? null : (
                        <div 
                          className={`flex items-center space-x-1 ${
                            header.column.getCanSort() ? 'cursor-pointer select-none' : ''
                          }`}
                          onClick={header.column.getToggleSortingHandler()}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' || e.key === ' ') {
                              e.preventDefault();
                              header.column.getToggleSortingHandler()?.(e);
                            }
                          }}
                          role={header.column.getCanSort() ? 'button' : undefined}
                          tabIndex={header.column.getCanSort() ? 0 : undefined}
                          aria-label={
                            header.column.getCanSort() 
                              ? `Sort by ${header.column.columnDef.header}` 
                              : undefined
                          }
                        >
                          <span>
                            {flexRender(header.column.columnDef.header, header.getContext())}
                          </span>
                          {header.column.getCanSort() && (
                            <span className="flex flex-col">
                              {header.column.getIsSorted() === 'asc' ? (
                                <ChevronUpIcon className="w-3 h-3" aria-hidden="true" />
                              ) : header.column.getIsSorted() === 'desc' ? (
                                <ChevronDownIcon className="w-3 h-3" aria-hidden="true" />
                              ) : (
                                <div className="w-3 h-3 opacity-50">
                                  <ChevronUpIcon className="w-3 h-1.5" aria-hidden="true" />
                                  <ChevronDownIcon className="w-3 h-1.5" aria-hidden="true" />
                                </div>
                              )}
                            </span>
                          )}
                        </div>
                      )}
                    </th>
                  ))}
                </tr>
              ))}
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {virtualizer.getVirtualItems().map((virtualRow) => {
                const row = rows[virtualRow.index];
                return (
                  <tr
                    key={row.id}
                    className="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                    style={{
                      height: `${virtualRow.size}px`,
                      transform: `translateY(${virtualRow.start}px)`,
                    }}
                  >
                    {row.getVisibleCells().map((cell) => (
                      <td
                        key={cell.id}
                        className="px-6 py-3 whitespace-nowrap text-sm"
                        style={{ width: cell.column.getSize() }}
                      >
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </td>
                    ))}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="bg-gray-50 dark:bg-gray-900 px-6 py-3 border-t border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2 text-sm text-gray-700 dark:text-gray-300">
              <span>
                Showing {pagination.pageIndex * pagination.pageSize + 1} to{' '}
                {Math.min(
                  (pagination.pageIndex + 1) * pagination.pageSize,
                  schedulerData?.meta.count || 0
                )}{' '}
                of {schedulerData?.meta.count || 0} tasks
              </span>
              <select
                value={pagination.pageSize}
                onChange={(e) => setPagination(prev => ({ ...prev, pageSize: Number(e.target.value), pageIndex: 0 }))}
                className="ml-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 rounded px-2 py-1 text-sm"
                aria-label="Items per page"
              >
                {[25, 50, 100].map((size) => (
                  <option key={size} value={size}>
                    {size} per page
                  </option>
                ))}
              </select>
            </div>
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => table.setPageIndex(0)}
                disabled={!table.getCanPreviousPage()}
                aria-label="Go to first page"
              >
                <ChevronsLeftIcon className="w-4 h-4" aria-hidden="true" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => table.previousPage()}
                disabled={!table.getCanPreviousPage()}
                aria-label="Go to previous page"
              >
                <ChevronLeftIcon className="w-4 h-4" aria-hidden="true" />
              </Button>
              <span className="text-sm text-gray-700 dark:text-gray-300 px-3">
                Page {pagination.pageIndex + 1} of {table.getPageCount()}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => table.nextPage()}
                disabled={!table.getCanNextPage()}
                aria-label="Go to next page"
              >
                <ChevronRightIcon className="w-4 h-4" aria-hidden="true" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => table.setPageIndex(table.getPageCount() - 1)}
                disabled={!table.getCanNextPage()}
                aria-label="Go to last page"
              >
                <ChevronsRightIcon className="w-4 h-4" aria-hidden="true" />
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Delete Confirmation Dialog */}
      <Dialog 
        open={!!selectedTaskForDeletion} 
        onOpenChange={(open) => !open && setSelectedTaskForDeletion(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Scheduler Task</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete the task "{selectedTaskForDeletion?.name}"? 
              This action cannot be undone and will permanently remove the scheduled task 
              and all associated logs.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setSelectedTaskForDeletion(null)}
              disabled={deleteTaskMutation.isPending}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteTask}
              disabled={deleteTaskMutation.isPending}
            >
              {deleteTaskMutation.isPending ? 'Deleting...' : 'Delete Task'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}