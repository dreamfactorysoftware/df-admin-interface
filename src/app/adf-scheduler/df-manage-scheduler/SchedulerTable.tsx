'use client';

import React, { useState, useMemo, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { 
  ColumnDef, 
  flexRender, 
  getCoreRowModel, 
  getSortedRowModel, 
  getFilteredRowModel,
  getPaginationRowModel,
  useReactTable,
  SortingState,
  VisibilityState,
  ColumnFiltersState,
  PaginationState
} from '@tanstack/react-table';
import { useVirtualizer } from '@tanstack/react-virtual';
import { 
  TrashIcon, 
  PencilSquareIcon, 
  EyeIcon,
  ArrowsUpDownIcon,
  ArrowUpIcon,
  ArrowDownIcon,
  CheckCircleIcon,
  XCircleIcon,
  PlusIcon,
  ArrowPathIcon
} from '@heroicons/react/24/outline';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import clsx from 'clsx';

// Types based on the Angular implementation
interface SchedulerTaskData {
  id: number;
  name: string;
  description: string;
  isActive: boolean;
  serviceId: number;
  component: string;
  verb: string;
  frequency: number;
  taskLogByTaskId?: any[];
  serviceByServiceId: {
    id: number;
    name: string;
  };
}

interface SchedulerApiResponse {
  resource: SchedulerTaskData[];
  meta: {
    count: number;
  };
}

// Mock API functions - these would be imported from the actual API client
const fetchSchedulerTasks = async (params: {
  limit?: number;
  offset?: number;
  filter?: string;
}): Promise<SchedulerApiResponse> => {
  // This would be replaced with actual API call
  const response = await fetch(`/api/v2/system/scheduler?${new URLSearchParams({
    limit: params.limit?.toString() || '50',
    offset: params.offset?.toString() || '0',
    ...(params.filter && { filter: params.filter })
  })}`);
  return response.json();
};

const deleteSchedulerTask = async (taskId: string): Promise<void> => {
  const response = await fetch(`/api/v2/system/scheduler/${taskId}`, {
    method: 'DELETE'
  });
  if (!response.ok) {
    throw new Error('Failed to delete scheduler task');
  }
};

// Custom hooks for data fetching (matching the dependency requirements)
const useSchedulerTasks = (params: {
  limit?: number;
  offset?: number;
  filter?: string;
}) => {
  return useQuery({
    queryKey: ['scheduler-tasks', params],
    queryFn: () => fetchSchedulerTasks(params),
    staleTime: 300 * 1000, // 5 minutes as per Section 5.2
    cacheTime: 900 * 1000, // 15 minutes as per Section 5.2
    keepPreviousData: true
  });
};

const useDeleteSchedulerTask = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: deleteSchedulerTask,
    onSuccess: () => {
      // Invalidate and refetch scheduler tasks after successful deletion
      queryClient.invalidateQueries(['scheduler-tasks']);
    },
    onError: (error) => {
      console.error('Failed to delete scheduler task:', error);
      // Here you would typically show a toast/snackbar with error message
    }
  });
};

// Confirmation Dialog Component using Headless UI patterns
interface ConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
}

const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-screen items-center justify-center px-4 pt-4 pb-20 text-center sm:block sm:p-0">
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={onClose} />
        
        <div className="inline-block transform overflow-hidden rounded-lg bg-white text-left align-bottom shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-lg sm:align-middle">
          <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
            <div className="sm:flex sm:items-start">
              <div className="mx-auto flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-red-100 sm:mx-0 sm:h-10 sm:w-10">
                <TrashIcon className="h-6 w-6 text-red-600" />
              </div>
              <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left">
                <h3 className="text-lg font-medium leading-6 text-gray-900">
                  {title}
                </h3>
                <div className="mt-2">
                  <p className="text-sm text-gray-500">{message}</p>
                </div>
              </div>
            </div>
          </div>
          <div className="bg-gray-50 px-4 py-3 sm:flex sm:flex-row-reverse sm:px-6">
            <button
              type="button"
              className="inline-flex w-full justify-center rounded-md border border-transparent bg-red-600 px-4 py-2 text-base font-medium text-white shadow-sm hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 sm:ml-3 sm:w-auto sm:text-sm"
              onClick={onConfirm}
            >
              Delete
            </button>
            <button
              type="button"
              className="mt-3 inline-flex w-full justify-center rounded-md border border-gray-300 bg-white px-4 py-2 text-base font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
              onClick={onClose}
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// Main SchedulerTable Component
interface SchedulerTableProps {
  onRefresh?: () => void;
}

const SchedulerTable: React.FC<SchedulerTableProps> = ({ onRefresh }) => {
  const router = useRouter();
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});
  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: 50
  });
  const [globalFilter, setGlobalFilter] = useState('');
  const [deleteConfirmDialog, setDeleteConfirmDialog] = useState<{
    isOpen: boolean;
    taskId?: number;
    taskName?: string;
  }>({ isOpen: false });

  // Data fetching with React Query
  const {
    data: schedulerData,
    isLoading,
    isError,
    error,
    refetch
  } = useSchedulerTasks({
    limit: pagination.pageSize,
    offset: pagination.pageIndex * pagination.pageSize,
    filter: globalFilter
  });

  const deleteTaskMutation = useDeleteSchedulerTask();

  // Table data
  const tasks = schedulerData?.resource || [];
  const totalCount = schedulerData?.meta?.count || 0;

  // Column definitions matching the Angular implementation
  const columns = useMemo<ColumnDef<SchedulerTaskData>[]>(() => [
    {
      accessorKey: 'isActive',
      header: ({ column }) => (
        <button
          className="flex items-center space-x-1 hover:bg-gray-100 rounded px-2 py-1"
          onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
        >
          <span>Active</span>
          {column.getIsSorted() === 'asc' ? (
            <ArrowUpIcon className="h-4 w-4" />
          ) : column.getIsSorted() === 'desc' ? (
            <ArrowDownIcon className="h-4 w-4" />
          ) : (
            <ArrowsUpDownIcon className="h-4 w-4" />
          )}
        </button>
      ),
      cell: ({ row }) => (
        <div className="flex justify-center">
          {row.getValue('isActive') ? (
            <CheckCircleIcon className="h-5 w-5 text-green-500" />
          ) : (
            <XCircleIcon className="h-5 w-5 text-red-500" />
          )}
        </div>
      ),
      size: 80
    },
    {
      accessorKey: 'id',
      header: ({ column }) => (
        <button
          className="flex items-center space-x-1 hover:bg-gray-100 rounded px-2 py-1"
          onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
        >
          <span>ID</span>
          {column.getIsSorted() === 'asc' ? (
            <ArrowUpIcon className="h-4 w-4" />
          ) : column.getIsSorted() === 'desc' ? (
            <ArrowDownIcon className="h-4 w-4" />
          ) : (
            <ArrowsUpDownIcon className="h-4 w-4" />
          )}
        </button>
      ),
      size: 80
    },
    {
      accessorKey: 'name',
      header: ({ column }) => (
        <button
          className="flex items-center space-x-1 hover:bg-gray-100 rounded px-2 py-1"
          onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
        >
          <span>Name</span>
          {column.getIsSorted() === 'asc' ? (
            <ArrowUpIcon className="h-4 w-4" />
          ) : column.getIsSorted() === 'desc' ? (
            <ArrowDownIcon className="h-4 w-4" />
          ) : (
            <ArrowsUpDownIcon className="h-4 w-4" />
          )}
        </button>
      ),
      cell: ({ row }) => (
        <button
          className="text-blue-600 hover:text-blue-800 hover:underline text-left"
          onClick={() => handleViewTask(row.original)}
        >
          {row.getValue('name')}
        </button>
      )
    },
    {
      accessorKey: 'description',
      header: 'Description',
      cell: ({ row }) => (
        <div className="max-w-xs truncate" title={row.getValue('description')}>
          {row.getValue('description')}
        </div>
      )
    },
    {
      accessorKey: 'serviceByServiceId.name',
      header: ({ column }) => (
        <button
          className="flex items-center space-x-1 hover:bg-gray-100 rounded px-2 py-1"
          onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
        >
          <span>Service</span>
          {column.getIsSorted() === 'asc' ? (
            <ArrowUpIcon className="h-4 w-4" />
          ) : column.getIsSorted() === 'desc' ? (
            <ArrowDownIcon className="h-4 w-4" />
          ) : (
            <ArrowsUpDownIcon className="h-4 w-4" />
          )}
        </button>
      ),
      cell: ({ row }) => row.original.serviceByServiceId?.name || 'N/A'
    },
    {
      accessorKey: 'component',
      header: 'Component',
      size: 150
    },
    {
      accessorKey: 'verb',
      header: 'Method',
      cell: ({ row }) => (
        <span className={clsx(
          'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium',
          {
            'bg-green-100 text-green-800': row.getValue('verb') === 'GET',
            'bg-blue-100 text-blue-800': row.getValue('verb') === 'POST',
            'bg-yellow-100 text-yellow-800': row.getValue('verb') === 'PUT',
            'bg-red-100 text-red-800': row.getValue('verb') === 'DELETE',
            'bg-purple-100 text-purple-800': row.getValue('verb') === 'PATCH',
            'bg-gray-100 text-gray-800': !['GET', 'POST', 'PUT', 'DELETE', 'PATCH'].includes(row.getValue('verb'))
          }
        )}>
          {row.getValue('verb')}
        </span>
      ),
      size: 100
    },
    {
      accessorKey: 'frequency',
      header: ({ column }) => (
        <button
          className="flex items-center space-x-1 hover:bg-gray-100 rounded px-2 py-1"
          onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
        >
          <span>Frequency</span>
          {column.getIsSorted() === 'asc' ? (
            <ArrowUpIcon className="h-4 w-4" />
          ) : column.getIsSorted() === 'desc' ? (
            <ArrowDownIcon className="h-4 w-4" />
          ) : (
            <ArrowsUpDownIcon className="h-4 w-4" />
          )}
        </button>
      ),
      cell: ({ row }) => `${row.getValue('frequency')}s`,
      size: 100
    },
    {
      accessorKey: 'taskLogByTaskId',
      header: 'Log',
      cell: ({ row }) => (
        <div className="flex justify-center">
          {row.original.taskLogByTaskId && row.original.taskLogByTaskId.length > 0 ? (
            <CheckCircleIcon className="h-5 w-5 text-green-500" />
          ) : (
            <XCircleIcon className="h-5 w-5 text-gray-400" />
          )}
        </div>
      ),
      size: 80
    },
    {
      id: 'actions',
      header: 'Actions',
      cell: ({ row }) => (
        <div className="flex space-x-2">
          <button
            className="p-1 text-blue-600 hover:text-blue-800 hover:bg-blue-100 rounded"
            onClick={() => handleViewTask(row.original)}
            title={`View scheduler task ${row.original.id}`}
            aria-label={`View scheduler task ${row.original.id}`}
          >
            <EyeIcon className="h-4 w-4" />
          </button>
          <button
            className="p-1 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded"
            onClick={() => handleEditTask(row.original)}
            title={`Edit scheduler task ${row.original.id}`}
            aria-label={`Edit scheduler task ${row.original.id}`}
          >
            <PencilSquareIcon className="h-4 w-4" />
          </button>
          <button
            className="p-1 text-red-600 hover:text-red-800 hover:bg-red-100 rounded"
            onClick={() => handleDeleteTask(row.original)}
            title={`Delete scheduler task ${row.original.id}`}
            aria-label={`Delete scheduler task ${row.original.id}`}
          >
            <TrashIcon className="h-4 w-4" />
          </button>
        </div>
      ),
      size: 120
    }
  ], []);

  // Initialize React Table
  const table = useReactTable({
    data: tasks,
    columns,
    pageCount: Math.ceil(totalCount / pagination.pageSize),
    state: {
      sorting,
      columnFilters,
      columnVisibility,
      pagination,
      globalFilter
    },
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onColumnVisibilityChange: setColumnVisibility,
    onPaginationChange: setPagination,
    onGlobalFilterChange: setGlobalFilter,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    manualPagination: true,
    manualSorting: false,
    manualFiltering: true
  });

  // Event handlers
  const handleViewTask = useCallback((task: SchedulerTaskData) => {
    router.push(`/adf-scheduler/df-scheduler-details/${task.id}`);
  }, [router]);

  const handleEditTask = useCallback((task: SchedulerTaskData) => {
    router.push(`/adf-scheduler/df-scheduler-details/${task.id}`);
  }, [router]);

  const handleDeleteTask = useCallback((task: SchedulerTaskData) => {
    setDeleteConfirmDialog({
      isOpen: true,
      taskId: task.id,
      taskName: task.name
    });
  }, []);

  const handleConfirmDelete = useCallback(async () => {
    if (deleteConfirmDialog.taskId) {
      try {
        await deleteTaskMutation.mutateAsync(deleteConfirmDialog.taskId.toString());
        setDeleteConfirmDialog({ isOpen: false });
        // Optionally call onRefresh if provided
        onRefresh?.();
      } catch (error) {
        console.error('Delete failed:', error);
      }
    }
  }, [deleteConfirmDialog.taskId, deleteTaskMutation, onRefresh]);

  const handleCreateTask = useCallback(() => {
    router.push('/adf-scheduler/df-scheduler-details/create');
  }, [router]);

  const handleRefreshTable = useCallback(() => {
    refetch();
    onRefresh?.();
  }, [refetch, onRefresh]);

  // TanStack Virtual for performance optimization with large datasets
  const parentRef = React.useRef<HTMLDivElement>(null);
  const virtualizer = useVirtualizer({
    count: table.getRowModel().rows.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 60, // Estimated row height
    overscan: 10,
    enabled: tasks.length > 100 // Only enable virtualization for large datasets
  });

  if (isError) {
    return (
      <div className="rounded-md bg-red-50 p-4">
        <div className="flex">
          <div className="ml-3">
            <h3 className="text-sm font-medium text-red-800">Error loading scheduler tasks</h3>
            <div className="mt-2 text-sm text-red-700">
              {error instanceof Error ? error.message : 'An unknown error occurred'}
            </div>
            <div className="mt-4">
              <button
                type="button"
                className="rounded-md bg-red-100 px-2 py-1.5 text-sm font-medium text-red-800 hover:bg-red-200 focus:outline-none focus:ring-2 focus:ring-red-600 focus:ring-offset-2 focus:ring-offset-red-50"
                onClick={handleRefreshTable}
              >
                Try again
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header with actions */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <h2 className="text-lg font-medium text-gray-900">Scheduler Tasks</h2>
          <button
            onClick={handleRefreshTable}
            disabled={isLoading}
            className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
          >
            <ArrowPathIcon className={clsx("h-4 w-4 mr-2", { "animate-spin": isLoading })} />
            Refresh
          </button>
        </div>
        <button
          onClick={handleCreateTask}
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
        >
          <PlusIcon className="h-4 w-4 mr-2" />
          Create Task
        </button>
      </div>

      {/* Global filter */}
      <div className="flex items-center space-x-4">
        <div className="flex-1 max-w-md">
          <input
            placeholder="Search scheduler tasks..."
            value={globalFilter ?? ''}
            onChange={(e) => setGlobalFilter(e.target.value)}
            className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
          />
        </div>
        <div className="text-sm text-gray-500">
          {totalCount} total tasks
        </div>
      </div>

      {/* Table */}
      <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 md:rounded-lg">
        <div className="overflow-x-auto">
          <div 
            ref={parentRef}
            className="h-[600px] overflow-auto"
            style={{ contain: 'strict' }}
          >
            <table className="min-w-full divide-y divide-gray-300">
              <thead className="bg-gray-50 sticky top-0 z-10">
                {table.getHeaderGroups().map(headerGroup => (
                  <tr key={headerGroup.id}>
                    {headerGroup.headers.map(header => (
                      <th
                        key={header.id}
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                        style={{ width: header.getSize() }}
                      >
                        {header.isPlaceholder
                          ? null
                          : flexRender(header.column.columnDef.header, header.getContext())
                        }
                      </th>
                    ))}
                  </tr>
                ))}
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {isLoading ? (
                  <tr>
                    <td colSpan={columns.length} className="px-6 py-4 text-center text-sm text-gray-500">
                      <div className="flex items-center justify-center space-x-2">
                        <ArrowPathIcon className="h-5 w-5 animate-spin" />
                        <span>Loading scheduler tasks...</span>
                      </div>
                    </td>
                  </tr>
                ) : tasks.length === 0 ? (
                  <tr>
                    <td colSpan={columns.length} className="px-6 py-4 text-center text-sm text-gray-500">
                      No scheduler tasks found
                    </td>
                  </tr>
                ) : (
                  // Use virtualization for large datasets
                  (tasks.length > 100 
                    ? virtualizer.getVirtualItems().map(virtualRow => {
                        const row = table.getRowModel().rows[virtualRow.index];
                        return (
                          <tr
                            key={row.id}
                            style={{
                              height: `${virtualRow.size}px`,
                              transform: `translateY(${virtualRow.start}px)`
                            }}
                            className="hover:bg-gray-50"
                          >
                            {row.getVisibleCells().map(cell => (
                              <td
                                key={cell.id}
                                className="px-6 py-4 whitespace-nowrap text-sm text-gray-900"
                              >
                                {flexRender(cell.column.columnDef.cell, cell.getContext())}
                              </td>
                            ))}
                          </tr>
                        );
                      })
                    : table.getRowModel().rows.map(row => (
                        <tr key={row.id} className="hover:bg-gray-50">
                          {row.getVisibleCells().map(cell => (
                            <td
                              key={cell.id}
                              className="px-6 py-4 whitespace-nowrap text-sm text-gray-900"
                            >
                              {flexRender(cell.column.columnDef.cell, cell.getContext())}
                            </td>
                          ))}
                        </tr>
                      ))
                  )
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between border-t border-gray-200 bg-white px-4 py-3 sm:px-6">
        <div className="flex flex-1 justify-between sm:hidden">
          <button
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
            className="relative inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
          >
            Previous
          </button>
          <button
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
            className="relative ml-3 inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
          >
            Next
          </button>
        </div>
        <div className="hidden sm:flex sm:flex-1 sm:items-center sm:justify-between">
          <div className="flex items-center space-x-2">
            <p className="text-sm text-gray-700">
              Showing{' '}
              <span className="font-medium">
                {pagination.pageIndex * pagination.pageSize + 1}
              </span>{' '}
              to{' '}
              <span className="font-medium">
                {Math.min((pagination.pageIndex + 1) * pagination.pageSize, totalCount)}
              </span>{' '}
              of{' '}
              <span className="font-medium">{totalCount}</span> results
            </p>
            <select
              value={pagination.pageSize}
              onChange={(e) => {
                table.setPageSize(Number(e.target.value));
              }}
              className="rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
            >
              {[10, 25, 50, 100].map(pageSize => (
                <option key={pageSize} value={pageSize}>
                  Show {pageSize}
                </option>
              ))}
            </select>
          </div>
          <div>
            <nav className="isolate inline-flex -space-x-px rounded-md shadow-sm" aria-label="Pagination">
              <button
                onClick={() => table.setPageIndex(0)}
                disabled={!table.getCanPreviousPage()}
                className="relative inline-flex items-center rounded-l-md border border-gray-300 bg-white px-2 py-2 text-sm font-medium text-gray-500 hover:bg-gray-50 focus:z-20 disabled:opacity-50"
              >
                First
              </button>
              <button
                onClick={() => table.previousPage()}
                disabled={!table.getCanPreviousPage()}
                className="relative inline-flex items-center border border-gray-300 bg-white px-2 py-2 text-sm font-medium text-gray-500 hover:bg-gray-50 focus:z-20 disabled:opacity-50"
              >
                Previous
              </button>
              <span className="relative inline-flex items-center border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700">
                Page {table.getState().pagination.pageIndex + 1} of {table.getPageCount()}
              </span>
              <button
                onClick={() => table.nextPage()}
                disabled={!table.getCanNextPage()}
                className="relative inline-flex items-center border border-gray-300 bg-white px-2 py-2 text-sm font-medium text-gray-500 hover:bg-gray-50 focus:z-20 disabled:opacity-50"
              >
                Next
              </button>
              <button
                onClick={() => table.setPageIndex(table.getPageCount() - 1)}
                disabled={!table.getCanNextPage()}
                className="relative inline-flex items-center rounded-r-md border border-gray-300 bg-white px-2 py-2 text-sm font-medium text-gray-500 hover:bg-gray-50 focus:z-20 disabled:opacity-50"
              >
                Last
              </button>
            </nav>
          </div>
        </div>
      </div>

      {/* Confirmation Dialog */}
      <ConfirmDialog
        isOpen={deleteConfirmDialog.isOpen}
        onClose={() => setDeleteConfirmDialog({ isOpen: false })}
        onConfirm={handleConfirmDelete}
        title="Delete Scheduler Task"
        message={`Are you sure you want to delete the scheduler task "${deleteConfirmDialog.taskName}"? This action cannot be undone.`}
      />
    </div>
  );
};

export default SchedulerTable;