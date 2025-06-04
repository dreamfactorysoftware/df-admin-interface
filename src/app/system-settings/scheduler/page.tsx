'use client';

import React, { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  PlusIcon, 
  TrashIcon, 
  PencilIcon,
  EyeIcon,
  PlayIcon,
  StopIcon,
  ClockIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline';
import { 
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
  createColumnHelper,
  ColumnFiltersState,
  SortingState,
  VisibilityState,
  PaginationState
} from '@tanstack/react-table';
import { useVirtualizer } from '@tanstack/react-virtual';
import { toast } from 'react-hot-toast';
import { useRouter } from 'next/navigation';

// Types
import type { SchedulerTaskData } from '@/types/scheduler';

// Components
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

// Hooks and Utilities
import { useSchedulerTasks } from '@/hooks/useSchedulerTasks';
import { useDeleteSchedulerTask } from '@/hooks/useDeleteSchedulerTask';
import { apiClient } from '@/lib/api-client';
import { formatDistanceToNow, format } from 'date-fns';
import { cn } from '@/lib/utils';

/**
 * Scheduler Management Page Component
 * 
 * Main scheduler management page that serves as the central interface for managing 
 * scheduled tasks within the system settings. This Next.js app router page component 
 * implements React Query for scheduler task data fetching, Tailwind CSS styling with 
 * Headless UI components, and React Hook Form for task configuration.
 * 
 * Key Features:
 * - CRUD operations for scheduler tasks
 * - Real-time data fetching with intelligent caching
 * - Virtual scrolling for performance with large datasets
 * - Responsive design with Tailwind CSS
 * - Accessibility compliance (WCAG 2.1 AA)
 * - Server-side rendering compatibility
 */
export default function SchedulerPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  
  // State management
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});
  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: 50, // Optimized for virtual scrolling
  });
  const [globalFilter, setGlobalFilter] = useState<string>('');
  const [selectedTask, setSelectedTask] = useState<SchedulerTaskData | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [taskToDelete, setTaskToDelete] = useState<SchedulerTaskData | null>(null);

  // React Query hooks for data fetching
  const {
    data: schedulerTasks,
    isLoading,
    isError,
    error,
    refetch
  } = useSchedulerTasks({
    staleTime: 5 * 60 * 1000, // 5 minutes
    cacheTime: 15 * 60 * 1000, // 15 minutes
    refetchInterval: 30 * 1000, // Refresh every 30 seconds for real-time updates
  });

  // Delete mutation
  const deleteTaskMutation = useDeleteSchedulerTask({
    onSuccess: () => {
      toast.success('Scheduler task deleted successfully');
      setDeleteDialogOpen(false);
      setTaskToDelete(null);
      queryClient.invalidateQueries({ queryKey: ['scheduler-tasks'] });
    },
    onError: (error: any) => {
      toast.error(`Failed to delete task: ${error.message}`);
    },
  });

  // Column helper for type safety
  const columnHelper = createColumnHelper<SchedulerTaskData>();

  // Table column definitions
  const columns = useMemo(() => [
    columnHelper.accessor('isActive', {
      id: 'status',
      header: 'Status',
      cell: ({ getValue }) => (
        <Badge
          variant={getValue() ? 'success' : 'secondary'}
          className={cn(
            'inline-flex items-center gap-1',
            getValue() ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
          )}
        >
          {getValue() ? (
            <>
              <PlayIcon className="h-3 w-3" />
              Active
            </>
          ) : (
            <>
              <StopIcon className="h-3 w-3" />
              Inactive
            </>
          )}
        </Badge>
      ),
      enableSorting: true,
      enableColumnFilter: true,
    }),
    columnHelper.accessor('id', {
      header: 'ID',
      cell: ({ getValue }) => (
        <span className="font-mono text-sm">{getValue()}</span>
      ),
      enableSorting: true,
    }),
    columnHelper.accessor('name', {
      header: 'Name',
      cell: ({ getValue, row }) => (
        <div>
          <div className="font-medium text-gray-900">{getValue()}</div>
          {row.original.description && (
            <div className="text-sm text-gray-500 truncate max-w-xs">
              {row.original.description}
            </div>
          )}
        </div>
      ),
      enableSorting: true,
      enableColumnFilter: true,
    }),
    columnHelper.accessor('serviceByServiceId.name', {
      id: 'service',
      header: 'Service',
      cell: ({ getValue }) => (
        <Badge variant="outline" className="font-mono">
          {getValue()}
        </Badge>
      ),
      enableSorting: true,
      enableColumnFilter: true,
    }),
    columnHelper.accessor('component', {
      header: 'Component',
      cell: ({ getValue }) => (
        <span className="font-mono text-sm">{getValue()}</span>
      ),
      enableSorting: true,
      enableColumnFilter: true,
    }),
    columnHelper.accessor('verb', {
      header: 'Method',
      cell: ({ getValue }) => (
        <Badge
          variant="outline"
          className={cn(
            'font-mono',
            getValue() === 'GET' && 'bg-blue-50 text-blue-700 border-blue-200',
            getValue() === 'POST' && 'bg-green-50 text-green-700 border-green-200',
            getValue() === 'PUT' && 'bg-yellow-50 text-yellow-700 border-yellow-200',
            getValue() === 'DELETE' && 'bg-red-50 text-red-700 border-red-200'
          )}
        >
          {getValue()}
        </Badge>
      ),
      enableSorting: true,
      enableColumnFilter: true,
    }),
    columnHelper.accessor('frequency', {
      header: 'Frequency (seconds)',
      cell: ({ getValue }) => (
        <div className="flex items-center gap-1">
          <ClockIcon className="h-4 w-4 text-gray-400" />
          <span className="font-mono">{getValue()}</span>
        </div>
      ),
      enableSorting: true,
    }),
    columnHelper.accessor('taskLogByTaskId', {
      id: 'hasLog',
      header: 'Last Execution',
      cell: ({ getValue, row }) => {
        const log = getValue();
        if (!log) {
          return (
            <span className="text-gray-500 text-sm">No logs</span>
          );
        }
        
        const statusClass = log.statusCode >= 200 && log.statusCode < 300 
          ? 'text-green-600' 
          : 'text-red-600';
        
        return (
          <div className="text-sm">
            <div className={cn('font-medium', statusClass)}>
              Status: {log.statusCode}
            </div>
            <div className="text-gray-500">
              {format(new Date(log.lastModifiedDate), 'MMM d, yyyy HH:mm')}
            </div>
          </div>
        );
      },
      enableSorting: false,
    }),
    columnHelper.display({
      id: 'actions',
      header: 'Actions',
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push(`/system-settings/scheduler/${row.original.id}`)}
            className="h-8 w-8 p-0"
          >
            <EyeIcon className="h-4 w-4" />
            <span className="sr-only">View task details</span>
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push(`/system-settings/scheduler/${row.original.id}/edit`)}
            className="h-8 w-8 p-0"
          >
            <PencilIcon className="h-4 w-4" />
            <span className="sr-only">Edit task</span>
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleDeleteClick(row.original)}
            className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
          >
            <TrashIcon className="h-4 w-4" />
            <span className="sr-only">Delete task</span>
          </Button>
        </div>
      ),
    }),
  ], [router]);

  // Table instance
  const table = useReactTable({
    data: schedulerTasks || [],
    columns,
    state: {
      columnFilters,
      sorting,
      columnVisibility,
      pagination,
      globalFilter,
    },
    onColumnFiltersChange: setColumnFilters,
    onSortingChange: setSorting,
    onColumnVisibilityChange: setColumnVisibility,
    onPaginationChange: setPagination,
    onGlobalFilterChange: setGlobalFilter,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    debugTable: process.env.NODE_ENV === 'development',
  });

  // Virtual scrolling setup for performance with large datasets
  const { rows } = table.getRowModel();
  const parentRef = React.useRef<HTMLDivElement>(null);
  
  const virtualizer = useVirtualizer({
    count: rows.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 60, // Estimated row height
    overscan: 10, // Render extra rows for smoother scrolling
  });

  // Event handlers
  const handleDeleteClick = (task: SchedulerTaskData) => {
    setTaskToDelete(task);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = () => {
    if (taskToDelete) {
      deleteTaskMutation.mutate(taskToDelete.id);
    }
  };

  const handleCreateNew = () => {
    router.push('/system-settings/scheduler/create');
  };

  // Error state
  if (isError) {
    return (
      <div className="container mx-auto py-6">
        <Alert variant="destructive">
          <ExclamationTriangleIcon className="h-4 w-4" />
          <AlertDescription>
            Failed to load scheduler tasks. {error?.message}
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => refetch()}
              className="ml-2"
            >
              Retry
            </Button>
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Scheduler Management</h1>
          <p className="text-muted-foreground">
            Manage scheduled tasks and automated processes
          </p>
        </div>
        <Button onClick={handleCreateNew} className="flex items-center gap-2">
          <PlusIcon className="h-4 w-4" />
          Create New Task
        </Button>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Tasks</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{schedulerTasks?.length || 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Active Tasks</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {schedulerTasks?.filter(task => task.isActive).length || 0}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">With Logs</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {schedulerTasks?.filter(task => task.taskLogByTaskId).length || 0}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Recent Errors</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {schedulerTasks?.filter(task => 
                task.taskLogByTaskId && 
                task.taskLogByTaskId.statusCode >= 400
              ).length || 0}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Search */}
      <Card>
        <CardHeader>
          <CardTitle>Scheduler Tasks</CardTitle>
          <div className="flex items-center gap-4">
            <Input
              placeholder="Search tasks..."
              value={globalFilter ?? ''}
              onChange={(e) => setGlobalFilter(e.target.value)}
              className="max-w-sm"
            />
          </div>
        </CardHeader>
        <CardContent>
          {/* Table Container with Virtual Scrolling */}
          <div 
            ref={parentRef}
            className="h-[600px] overflow-auto border rounded-md"
          >
            <table className="w-full">
              <thead className="bg-gray-50 sticky top-0 z-10">
                {table.getHeaderGroups().map((headerGroup) => (
                  <tr key={headerGroup.id}>
                    {headerGroup.headers.map((header) => (
                      <th
                        key={header.id}
                        className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b"
                        style={{ width: header.getSize() }}
                      >
                        {header.isPlaceholder ? null : (
                          <div
                            className={cn(
                              'flex items-center gap-2',
                              header.column.getCanSort() && 'cursor-pointer select-none'
                            )}
                            onClick={header.column.getToggleSortingHandler()}
                          >
                            {flexRender(header.column.columnDef.header, header.getContext())}
                            {{
                              asc: ' 🔼',
                              desc: ' 🔽',
                            }[header.column.getIsSorted() as string] ?? null}
                          </div>
                        )}
                      </th>
                    ))}
                  </tr>
                ))}
              </thead>
              <tbody>
                {isLoading ? (
                  <tr>
                    <td 
                      colSpan={columns.length} 
                      className="px-4 py-8 text-center text-gray-500"
                    >
                      <div className="flex items-center justify-center">
                        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-gray-900"></div>
                        <span className="ml-2">Loading scheduler tasks...</span>
                      </div>
                    </td>
                  </tr>
                ) : virtualizer.getVirtualItems().length === 0 ? (
                  <tr>
                    <td 
                      colSpan={columns.length} 
                      className="px-4 py-8 text-center text-gray-500"
                    >
                      No scheduler tasks found.
                    </td>
                  </tr>
                ) : (
                  virtualizer.getVirtualItems().map((virtualRow) => {
                    const row = rows[virtualRow.index];
                    return (
                      <tr
                        key={row.id}
                        className="hover:bg-gray-50 border-b transition-colors"
                        style={{
                          height: `${virtualRow.size}px`,
                          transform: `translateY(${virtualRow.start}px)`,
                        }}
                      >
                        {row.getVisibleCells().map((cell) => (
                          <td key={cell.id} className="px-4 py-4 whitespace-nowrap">
                            {flexRender(cell.column.columnDef.cell, cell.getContext())}
                          </td>
                        ))}
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="flex items-center justify-between px-2 py-4">
            <div className="flex items-center gap-2">
              <p className="text-sm text-gray-700">
                Showing {table.getState().pagination.pageIndex * table.getState().pagination.pageSize + 1} to{' '}
                {Math.min(
                  (table.getState().pagination.pageIndex + 1) * table.getState().pagination.pageSize,
                  table.getFilteredRowModel().rows.length
                )}{' '}
                of {table.getFilteredRowModel().rows.length} tasks
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => table.previousPage()}
                disabled={!table.getCanPreviousPage()}
              >
                Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => table.nextPage()}
                disabled={!table.getCanNextPage()}
              >
                Next
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Scheduler Task</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p>
              Are you sure you want to delete the scheduler task{' '}
              <strong>"{taskToDelete?.name}"</strong>? This action cannot be undone.
            </p>
            {taskToDelete?.isActive && (
              <Alert>
                <ExclamationTriangleIcon className="h-4 w-4" />
                <AlertDescription>
                  This task is currently active and will stop executing after deletion.
                </AlertDescription>
              </Alert>
            )}
            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => setDeleteDialogOpen(false)}
                disabled={deleteTaskMutation.isPending}
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={handleDeleteConfirm}
                disabled={deleteTaskMutation.isPending}
              >
                {deleteTaskMutation.isPending ? 'Deleting...' : 'Delete Task'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}