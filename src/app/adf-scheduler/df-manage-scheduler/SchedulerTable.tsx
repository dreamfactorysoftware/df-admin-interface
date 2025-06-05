"use client";

/**
 * SchedulerTable Component
 * 
 * React table component that replaces the Angular DfManageSchedulerTableComponent,
 * providing comprehensive scheduler task management with sorting, filtering, pagination,
 * and CRUD operations. Implements React Query for intelligent data caching, Headless UI 
 * for accessible table elements, and Tailwind CSS for responsive styling.
 * 
 * Features:
 * - React Query for server state management with intelligent caching per Section 4.3.2
 * - Headless UI for accessibility compliance (WCAG 2.1 AA) per Section 5.2
 * - Tailwind CSS for responsive design and consistent styling per Section 3.2.1
 * - TanStack Virtual for optimizing rendering with large datasets per Section 5.2
 * - React Hook Form with Zod validation for form interactions per Section 3.2.3
 * - Complete CRUD functionality for scheduler tasks maintained from Angular version
 * 
 * @fileoverview Scheduler task management table for DreamFactory Admin Interface
 * @version 1.0.0
 */

import React, { 
  forwardRef, 
  useCallback, 
  useMemo, 
  useState,
  useRef,
  type KeyboardEvent,
  type MouseEvent
} from 'react';
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  flexRender,
  type ColumnDef,
  type SortingState,
  type ColumnFiltersState,
  type PaginationState,
  type RowSelectionState,
  type Row,
} from '@tanstack/react-table';
import { useVirtualizer } from '@tanstack/react-virtual';
import { useForm } from 'react-hook-form';
import { 
  Search, 
  RefreshCw, 
  MoreVertical, 
  ChevronUp, 
  ChevronDown,
  ChevronsUpDown,
  Trash2,
  Edit,
  Eye,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Clock,
  Server,
  Settings,
  Activity
} from 'lucide-react';
import { Menu, Transition } from '@headlessui/react';
import { Fragment } from 'react';

// Internal imports
import { useSchedulerTasks } from '@/hooks/useSchedulerTasks';
import { useDeleteSchedulerTask } from '@/hooks/useDeleteSchedulerTask';
import { Button } from '@/components/ui/Button';
import { Dialog } from '@/components/ui/Dialog';
import { cn } from '@/lib/utils';
import { type SchedulerTaskData } from '@/types/scheduler';

/**
 * Props interface for SchedulerTable component
 * Provides comprehensive configuration options for table behavior and appearance
 */
export interface SchedulerTableProps {
  /**
   * Additional CSS classes for styling customization
   */
  className?: string;
  
  /**
   * Enable/disable filtering functionality
   * Defaults to false to match Angular component behavior
   */
  allowFilter?: boolean;
  
  /**
   * Enable/disable row selection
   */
  enableSelection?: boolean;
  
  /**
   * Initial page size for pagination
   */
  initialPageSize?: number;
  
  /**
   * Enable virtualization for large datasets
   * Automatically enables for 1000+ rows per Section 5.2
   */
  enableVirtualization?: boolean;
  
  /**
   * Callback for row actions (edit, view, etc.)
   */
  onRowAction?: (action: string, row: SchedulerTaskData) => void;
  
  /**
   * Custom row height for virtualization
   */
  virtualRowHeight?: number;
  
  /**
   * Enable dense table layout
   */
  dense?: boolean;
  
  /**
   * Additional accessibility label for screen readers
   */
  'aria-label'?: string;
  
  /**
   * ID for aria-describedby
   */
  'aria-describedby'?: string;
}

/**
 * Column configuration for the scheduler task table
 * Maintains exact functionality from Angular DfManageSchedulerTableComponent
 */
const useSchedulerColumns = (
  onDelete: (id: number) => void,
  onRowAction?: (action: string, row: SchedulerTaskData) => void
): ColumnDef<SchedulerTaskData>[] => {
  return useMemo(() => [
    {
      id: 'active',
      accessorFn: (row) => row.isActive,
      header: ({ column }) => (
        <button
          className={cn(
            "flex items-center space-x-1 hover:bg-gray-100 dark:hover:bg-gray-800 p-1 rounded",
            "focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500"
          )}
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          aria-label="Sort by active status"
        >
          <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
            Active
          </span>
          {column.getIsSorted() === "asc" ? (
            <ChevronUp className="h-4 w-4" aria-hidden="true" />
          ) : column.getIsSorted() === "desc" ? (
            <ChevronDown className="h-4 w-4" aria-hidden="true" />
          ) : (
            <ChevronsUpDown className="h-4 w-4" aria-hidden="true" />
          )}
        </button>
      ),
      cell: ({ getValue }) => {
        const isActive = getValue() as boolean;
        return (
          <div className="flex items-center justify-center">
            {isActive ? (
              <CheckCircle 
                className="h-5 w-5 text-success-600" 
                aria-label="Active task"
              />
            ) : (
              <XCircle 
                className="h-5 w-5 text-gray-400" 
                aria-label="Inactive task"
              />
            )}
          </div>
        );
      },
      enableSorting: true,
      size: 80,
    },
    {
      id: 'id',
      accessorKey: 'id',
      header: ({ column }) => (
        <button
          className={cn(
            "flex items-center space-x-1 hover:bg-gray-100 dark:hover:bg-gray-800 p-1 rounded",
            "focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500"
          )}
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          aria-label="Sort by ID"
        >
          <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
            ID
          </span>
          {column.getIsSorted() === "asc" ? (
            <ChevronUp className="h-4 w-4" aria-hidden="true" />
          ) : column.getIsSorted() === "desc" ? (
            <ChevronDown className="h-4 w-4" aria-hidden="true" />
          ) : (
            <ChevronsUpDown className="h-4 w-4" aria-hidden="true" />
          )}
        </button>
      ),
      cell: ({ getValue }) => (
        <span className="text-sm font-mono text-gray-900 dark:text-gray-100">
          {getValue() as number}
        </span>
      ),
      enableSorting: true,
      size: 80,
    },
    {
      id: 'name',
      accessorKey: 'name',
      header: ({ column }) => (
        <button
          className={cn(
            "flex items-center space-x-1 hover:bg-gray-100 dark:hover:bg-gray-800 p-1 rounded",
            "focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500"
          )}
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          aria-label="Sort by name"
        >
          <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
            Name
          </span>
          {column.getIsSorted() === "asc" ? (
            <ChevronUp className="h-4 w-4" aria-hidden="true" />
          ) : column.getIsSorted() === "desc" ? (
            <ChevronDown className="h-4 w-4" aria-hidden="true" />
          ) : (
            <ChevronsUpDown className="h-4 w-4" aria-hidden="true" />
          )}
        </button>
      ),
      cell: ({ getValue, row }) => (
        <div className="max-w-xs">
          <span 
            className="text-sm text-gray-900 dark:text-gray-100 truncate block"
            title={getValue() as string}
          >
            {getValue() as string}
          </span>
          {row.original.description && (
            <span 
              className="text-xs text-gray-500 dark:text-gray-400 truncate block"
              title={row.original.description}
            >
              {row.original.description}
            </span>
          )}
        </div>
      ),
      enableSorting: true,
      size: 200,
    },
    {
      id: 'service',
      accessorFn: (row) => row.serviceByServiceId?.name || '',
      header: ({ column }) => (
        <button
          className={cn(
            "flex items-center space-x-1 hover:bg-gray-100 dark:hover:bg-gray-800 p-1 rounded",
            "focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500"
          )}
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          aria-label="Sort by service"
        >
          <Server className="h-4 w-4" aria-hidden="true" />
          <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
            Service
          </span>
          {column.getIsSorted() === "asc" ? (
            <ChevronUp className="h-4 w-4" aria-hidden="true" />
          ) : column.getIsSorted() === "desc" ? (
            <ChevronDown className="h-4 w-4" aria-hidden="true" />
          ) : (
            <ChevronsUpDown className="h-4 w-4" aria-hidden="true" />
          )}
        </button>
      ),
      cell: ({ row }) => (
        <div className="flex items-center space-x-2">
          <Server className="h-4 w-4 text-gray-400" aria-hidden="true" />
          <span className="text-sm text-gray-900 dark:text-gray-100">
            {row.original.serviceByServiceId?.name || 'N/A'}
          </span>
        </div>
      ),
      enableSorting: true,
      size: 150,
    },
    {
      id: 'component',
      accessorKey: 'component',
      header: ({ column }) => (
        <button
          className={cn(
            "flex items-center space-x-1 hover:bg-gray-100 dark:hover:bg-gray-800 p-1 rounded",
            "focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500"
          )}
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          aria-label="Sort by component"
        >
          <Settings className="h-4 w-4" aria-hidden="true" />
          <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
            Component
          </span>
          {column.getIsSorted() === "asc" ? (
            <ChevronUp className="h-4 w-4" aria-hidden="true" />
          ) : column.getIsSorted() === "desc" ? (
            <ChevronDown className="h-4 w-4" aria-hidden="true" />
          ) : (
            <ChevronsUpDown className="h-4 w-4" aria-hidden="true" />
          )}
        </button>
      ),
      cell: ({ getValue }) => (
        <span className="text-sm font-mono text-gray-900 dark:text-gray-100">
          {getValue() as string}
        </span>
      ),
      enableSorting: true,
      size: 120,
    },
    {
      id: 'method',
      accessorKey: 'verb',
      header: ({ column }) => (
        <button
          className={cn(
            "flex items-center space-x-1 hover:bg-gray-100 dark:hover:bg-gray-800 p-1 rounded",
            "focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500"
          )}
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          aria-label="Sort by HTTP method"
        >
          <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
            Method
          </span>
          {column.getIsSorted() === "asc" ? (
            <ChevronUp className="h-4 w-4" aria-hidden="true" />
          ) : column.getIsSorted() === "desc" ? (
            <ChevronDown className="h-4 w-4" aria-hidden="true" />
          ) : (
            <ChevronsUpDown className="h-4 w-4" aria-hidden="true" />
          )}
        </button>
      ),
      cell: ({ getValue }) => {
        const method = getValue() as string;
        const methodColors = {
          GET: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
          POST: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
          PUT: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
          DELETE: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
          PATCH: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
        };
        
        const colorClass = methodColors[method as keyof typeof methodColors] || 
          'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
        
        return (
          <span className={cn(
            "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium",
            colorClass
          )}>
            {method}
          </span>
        );
      },
      enableSorting: true,
      size: 100,
    },
    {
      id: 'frequency',
      accessorKey: 'frequency',
      header: ({ column }) => (
        <button
          className={cn(
            "flex items-center space-x-1 hover:bg-gray-100 dark:hover:bg-gray-800 p-1 rounded",
            "focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500"
          )}
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          aria-label="Sort by frequency"
        >
          <Clock className="h-4 w-4" aria-hidden="true" />
          <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
            Frequency
          </span>
          {column.getIsSorted() === "asc" ? (
            <ChevronUp className="h-4 w-4" aria-hidden="true" />
          ) : column.getIsSorted() === "desc" ? (
            <ChevronDown className="h-4 w-4" aria-hidden="true" />
          ) : (
            <ChevronsUpDown className="h-4 w-4" aria-hidden="true" />
          )}
        </button>
      ),
      cell: ({ getValue }) => (
        <div className="flex items-center space-x-1">
          <Clock className="h-4 w-4 text-gray-400" aria-hidden="true" />
          <span className="text-sm text-gray-900 dark:text-gray-100">
            {getValue() as number}s
          </span>
        </div>
      ),
      enableSorting: true,
      size: 100,
    },
    {
      id: 'log',
      accessorFn: (row) => !!row.taskLogByTaskId,
      header: ({ column }) => (
        <button
          className={cn(
            "flex items-center space-x-1 hover:bg-gray-100 dark:hover:bg-gray-800 p-1 rounded",
            "focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500"
          )}
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          aria-label="Sort by log availability"
        >
          <Activity className="h-4 w-4" aria-hidden="true" />
          <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
            Log
          </span>
          {column.getIsSorted() === "asc" ? (
            <ChevronUp className="h-4 w-4" aria-hidden="true" />
          ) : column.getIsSorted() === "desc" ? (
            <ChevronDown className="h-4 w-4" aria-hidden="true" />
          ) : (
            <ChevronsUpDown className="h-4 w-4" aria-hidden="true" />
          )}
        </button>
      ),
      cell: ({ getValue, row }) => {
        const hasLog = getValue() as boolean;
        const statusCode = row.original.taskLogByTaskId?.statusCode;
        
        return (
          <div className="flex items-center justify-center">
            {hasLog ? (
              <div className="flex items-center space-x-1">
                <Activity 
                  className={cn(
                    "h-4 w-4",
                    statusCode && statusCode >= 200 && statusCode < 300 
                      ? "text-success-600" 
                      : "text-error-600"
                  )} 
                  aria-hidden="true"
                />
                {statusCode && (
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    {statusCode}
                  </span>
                )}
              </div>
            ) : (
              <span className="text-xs text-gray-400">No log</span>
            )}
          </div>
        );
      },
      enableSorting: true,
      size: 100,
    },
    {
      id: 'actions',
      header: () => (
        <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
          Actions
        </span>
      ),
      cell: ({ row }) => (
        <div className="flex items-center justify-end space-x-1">
          <Menu as="div" className="relative inline-block text-left">
            <div>
              <Menu.Button
                className={cn(
                  "inline-flex items-center justify-center w-8 h-8 rounded-full",
                  "text-gray-400 hover:text-gray-600 dark:hover:text-gray-200",
                  "hover:bg-gray-100 dark:hover:bg-gray-800",
                  "focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500"
                )}
                aria-label={`Actions for task ${row.original.name}`}
              >
                <MoreVertical className="h-4 w-4" aria-hidden="true" />
              </Menu.Button>
            </div>
            <Transition
              as={Fragment}
              enter="transition ease-out duration-100"
              enterFrom="transform opacity-0 scale-95"
              enterTo="transform opacity-100 scale-100"
              leave="transition ease-in duration-75"
              leaveFrom="transform opacity-100 scale-100"
              leaveTo="transform opacity-0 scale-95"
            >
              <Menu.Items className={cn(
                "absolute right-0 z-10 mt-2 w-48 origin-top-right",
                "bg-white dark:bg-gray-800 rounded-md shadow-lg",
                "ring-1 ring-black ring-opacity-5 focus:outline-none"
              )}>
                <div className="py-1">
                  <Menu.Item>
                    {({ active }) => (
                      <button
                        className={cn(
                          "flex items-center w-full px-4 py-2 text-sm",
                          active 
                            ? "bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-gray-100" 
                            : "text-gray-700 dark:text-gray-300"
                        )}
                        onClick={() => onRowAction?.('view', row.original)}
                      >
                        <Eye className="h-4 w-4 mr-3" aria-hidden="true" />
                        View Details
                      </button>
                    )}
                  </Menu.Item>
                  <Menu.Item>
                    {({ active }) => (
                      <button
                        className={cn(
                          "flex items-center w-full px-4 py-2 text-sm",
                          active 
                            ? "bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-gray-100" 
                            : "text-gray-700 dark:text-gray-300"
                        )}
                        onClick={() => onRowAction?.('edit', row.original)}
                      >
                        <Edit className="h-4 w-4 mr-3" aria-hidden="true" />
                        Edit Task
                      </button>
                    )}
                  </Menu.Item>
                  <Menu.Item>
                    {({ active }) => (
                      <button
                        className={cn(
                          "flex items-center w-full px-4 py-2 text-sm",
                          active 
                            ? "bg-red-100 dark:bg-red-900 text-red-900 dark:text-red-200" 
                            : "text-red-700 dark:text-red-400"
                        )}
                        onClick={() => onDelete(row.original.id)}
                      >
                        <Trash2 className="h-4 w-4 mr-3" aria-hidden="true" />
                        Delete Task
                      </button>
                    )}
                  </Menu.Item>
                </div>
              </Menu.Items>
            </Transition>
          </Menu>
        </div>
      ),
      enableSorting: false,
      size: 80,
    },
  ], [onDelete, onRowAction]);
};

/**
 * Scheduler Table Component Implementation
 * 
 * Comprehensive table component that maintains all functionality from the Angular
 * DfManageSchedulerTableComponent while implementing modern React patterns and
 * enhanced accessibility features.
 */
export const SchedulerTable = forwardRef<HTMLDivElement, SchedulerTableProps>(
  (
    {
      className,
      allowFilter = false,
      enableSelection = false,
      initialPageSize = 25,
      enableVirtualization = false,
      onRowAction,
      virtualRowHeight = 60,
      dense = false,
      'aria-label': ariaLabel,
      'aria-describedby': ariaDescribedBy,
      ...props
    },
    ref
  ) => {
    // State management for table functionality
    const [sorting, setSorting] = useState<SortingState>([]);
    const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
    const [pagination, setPagination] = useState<PaginationState>({
      pageIndex: 0,
      pageSize: initialPageSize,
    });
    const [rowSelection, setRowSelection] = useState<RowSelectionState>({});
    const [globalFilter, setGlobalFilter] = useState('');
    
    // Delete confirmation state
    const [deleteTaskId, setDeleteTaskId] = useState<number | null>(null);
    const [showDeleteDialog, setShowDeleteDialog] = useState(false);
    
    // Table container ref for virtualization
    const tableContainerRef = useRef<HTMLDivElement>(null);
    
    // Form for search functionality
    const { register, watch } = useForm({
      defaultValues: {
        search: '',
      },
    });
    
    const searchValue = watch('search');
    
    // Data fetching with React Query
    const { 
      data: schedulerData, 
      isLoading, 
      isError, 
      error,
      refetch,
      isFetching
    } = useSchedulerTasks({
      pagination,
      sorting,
      filters: columnFilters,
      globalFilter,
    });
    
    // Delete mutation
    const deleteSchedulerTask = useDeleteSchedulerTask({
      onSuccess: () => {
        setShowDeleteDialog(false);
        setDeleteTaskId(null);
        refetch();
      },
      onError: (error) => {
        console.error('Failed to delete scheduler task:', error);
        // Here you would typically show an error notification
      },
    });
    
    // Handle delete action
    const handleDeleteTask = useCallback((taskId: number) => {
      setDeleteTaskId(taskId);
      setShowDeleteDialog(true);
    }, []);
    
    // Confirm delete
    const confirmDelete = useCallback(() => {
      if (deleteTaskId) {
        deleteSchedulerTask.mutate(deleteTaskId);
      }
    }, [deleteTaskId, deleteSchedulerTask]);
    
    // Cancel delete
    const cancelDelete = useCallback(() => {
      setShowDeleteDialog(false);
      setDeleteTaskId(null);
    }, []);
    
    // Update global filter when search changes
    React.useEffect(() => {
      setGlobalFilter(searchValue);
    }, [searchValue]);
    
    // Column definitions
    const columns = useSchedulerColumns(handleDeleteTask, onRowAction);
    
    // Table data with fallback
    const tableData = useMemo(() => schedulerData?.data || [], [schedulerData]);
    
    // Determine if virtualization should be enabled
    const shouldVirtualize = enableVirtualization || tableData.length >= 1000;
    
    // Table instance
    const table = useReactTable({
      data: tableData,
      columns,
      state: {
        sorting,
        columnFilters,
        pagination,
        rowSelection,
        globalFilter,
      },
      onSortingChange: setSorting,
      onColumnFiltersChange: setColumnFilters,
      onPaginationChange: setPagination,
      onRowSelectionChange: setRowSelection,
      onGlobalFilterChange: setGlobalFilter,
      getCoreRowModel: getCoreRowModel(),
      getSortedRowModel: getSortedRowModel(),
      getFilteredRowModel: getFilteredRowModel(),
      getPaginationRowModel: getPaginationRowModel(),
      manualPagination: false, // Client-side pagination to match Angular behavior
      manualSorting: false,   // Client-side sorting to match Angular behavior
      manualFiltering: false, // Client-side filtering to match Angular behavior
      pageCount: Math.ceil((schedulerData?.meta?.count || 0) / pagination.pageSize),
    });
    
    // Virtualization setup
    const { rows } = table.getRowModel();
    
    const rowVirtualizer = useVirtualizer({
      count: rows.length,
      getScrollElement: () => tableContainerRef.current,
      estimateSize: () => virtualRowHeight,
      overscan: 10,
      enabled: shouldVirtualize,
    });
    
    // Handle refresh
    const handleRefresh = useCallback(() => {
      refetch();
    }, [refetch]);
    
    // Loading state
    if (isLoading) {
      return (
        <div 
          className="flex items-center justify-center h-64"
          role="status"
          aria-label="Loading scheduler tasks"
        >
          <div className="flex items-center space-x-2">
            <RefreshCw 
              className="h-6 w-6 animate-spin text-primary-600" 
              aria-hidden="true" 
            />
            <span className="text-sm text-gray-600 dark:text-gray-400">
              Loading scheduler tasks...
            </span>
          </div>
        </div>
      );
    }
    
    // Error state
    if (isError) {
      return (
        <div 
          className="flex flex-col items-center justify-center h-64 space-y-4"
          role="alert"
          aria-label="Error loading scheduler tasks"
        >
          <AlertTriangle className="h-12 w-12 text-error-600" aria-hidden="true" />
          <div className="text-center">
            <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">
              Failed to load scheduler tasks
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              {error instanceof Error ? error.message : 'An unexpected error occurred'}
            </p>
          </div>
          <Button 
            variant="outline" 
            onClick={handleRefresh}
            icon={<RefreshCw className="h-4 w-4" />}
          >
            Try Again
          </Button>
        </div>
      );
    }
    
    return (
      <div 
        ref={ref} 
        className={cn("w-full space-y-4", className)}
        aria-label={ariaLabel || "Scheduler tasks table"}
        aria-describedby={ariaDescribedBy}
        {...props}
      >
        {/* Table Header with Search and Actions */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
              Scheduler Tasks
            </h2>
            {tableData.length > 0 && (
              <span className="text-sm text-gray-500 dark:text-gray-400">
                {tableData.length} {tableData.length === 1 ? 'task' : 'tasks'}
              </span>
            )}
          </div>
          
          <div className="flex items-center space-x-2">
            {/* Search Input - Only show if filtering is allowed */}
            {allowFilter && (
              <div className="relative">
                <Search 
                  className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" 
                  aria-hidden="true"
                />
                <input
                  {...register('search')}
                  type="text"
                  placeholder="Search tasks..."
                  className={cn(
                    "pl-9 pr-4 py-2 w-64 text-sm border rounded-md",
                    "border-gray-300 dark:border-gray-600",
                    "bg-white dark:bg-gray-800",
                    "text-gray-900 dark:text-gray-100",
                    "placeholder-gray-500 dark:placeholder-gray-400",
                    "focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  )}
                  aria-label="Search scheduler tasks"
                />
              </div>
            )}
            
            {/* Refresh Button */}
            <Button
              variant="outline"
              size="sm"
              onClick={handleRefresh}
              disabled={isFetching}
              icon={
                <RefreshCw 
                  className={cn(
                    "h-4 w-4",
                    isFetching && "animate-spin"
                  )} 
                />
              }
              aria-label="Refresh scheduler tasks"
            >
              Refresh
            </Button>
          </div>
        </div>
        
        {/* Table Container */}
        <div 
          ref={tableContainerRef}
          className={cn(
            "relative overflow-auto border border-gray-200 dark:border-gray-700 rounded-lg",
            shouldVirtualize && "h-[600px]"
          )}
        >
          <table className="w-full text-left">
            {/* Table Header */}
            <thead className="bg-gray-50 dark:bg-gray-800 sticky top-0 z-10">
              {table.getHeaderGroups().map((headerGroup) => (
                <tr key={headerGroup.id}>
                  {headerGroup.headers.map((header) => (
                    <th
                      key={header.id}
                      style={{ width: header.getSize() }}
                      className={cn(
                        "px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider",
                        header.column.getCanSort() && "cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700"
                      )}
                    >
                      {header.isPlaceholder
                        ? null
                        : flexRender(
                            header.column.columnDef.header,
                            header.getContext()
                          )}
                    </th>
                  ))}
                </tr>
              ))}
            </thead>
            
            {/* Table Body */}
            <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
              {shouldVirtualize ? (
                // Virtualized rows
                <>
                  {rowVirtualizer.getVirtualItems().map((virtualRow) => {
                    const row = rows[virtualRow.index];
                    return (
                      <tr
                        key={row.id}
                        data-index={virtualRow.index}
                        ref={(node) => rowVirtualizer.measureElement(node)}
                        style={{
                          position: 'absolute',
                          top: 0,
                          left: 0,
                          width: '100%',
                          transform: `translateY(${virtualRow.start}px)`,
                        }}
                        className={cn(
                          "hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors",
                          dense ? "h-12" : "h-16"
                        )}
                      >
                        {row.getVisibleCells().map((cell) => (
                          <td
                            key={cell.id}
                            style={{ width: cell.column.getSize() }}
                            className="px-4 py-3 whitespace-nowrap"
                          >
                            {flexRender(
                              cell.column.columnDef.cell,
                              cell.getContext()
                            )}
                          </td>
                        ))}
                      </tr>
                    );
                  })}
                  {/* Spacer for virtualization */}
                  <tr style={{ height: rowVirtualizer.getTotalSize() - rows.length * virtualRowHeight }} />
                </>
              ) : (
                // Regular rows
                rows.map((row) => (
                  <tr
                    key={row.id}
                    className={cn(
                      "hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors",
                      dense ? "h-12" : "h-16"
                    )}
                  >
                    {row.getVisibleCells().map((cell) => (
                      <td
                        key={cell.id}
                        style={{ width: cell.column.getSize() }}
                        className="px-4 py-3 whitespace-nowrap"
                      >
                        {flexRender(
                          cell.column.columnDef.cell,
                          cell.getContext()
                        )}
                      </td>
                    ))}
                  </tr>
                ))
              )}
              
              {/* Empty state */}
              {rows.length === 0 && (
                <tr>
                  <td
                    colSpan={columns.length}
                    className="px-4 py-12 text-center text-gray-500 dark:text-gray-400"
                  >
                    <div className="flex flex-col items-center space-y-2">
                      <Clock className="h-12 w-12 text-gray-300 dark:text-gray-600" aria-hidden="true" />
                      <span className="text-lg font-medium">No scheduler tasks found</span>
                      <span className="text-sm">
                        {searchValue ? 'Try adjusting your search terms' : 'Create your first scheduled task to get started'}
                      </span>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        
        {/* Pagination */}
        {!shouldVirtualize && tableData.length > 0 && (
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-700 dark:text-gray-300">
              Showing {table.getState().pagination.pageIndex * table.getState().pagination.pageSize + 1} to{' '}
              {Math.min(
                (table.getState().pagination.pageIndex + 1) * table.getState().pagination.pageSize,
                tableData.length
              )}{' '}
              of {tableData.length} results
            </div>
            
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => table.setPageIndex(0)}
                disabled={!table.getCanPreviousPage()}
                icon={<ChevronsLeft className="h-4 w-4" />}
                aria-label="Go to first page"
              />
              <Button
                variant="outline"
                size="sm"
                onClick={() => table.previousPage()}
                disabled={!table.getCanPreviousPage()}
                icon={<ChevronLeft className="h-4 w-4" />}
                aria-label="Go to previous page"
              />
              
              <span className="text-sm text-gray-700 dark:text-gray-300">
                Page {table.getState().pagination.pageIndex + 1} of {table.getPageCount()}
              </span>
              
              <Button
                variant="outline"
                size="sm"
                onClick={() => table.nextPage()}
                disabled={!table.getCanNextPage()}
                icon={<ChevronRight className="h-4 w-4" />}
                aria-label="Go to next page"
              />
              <Button
                variant="outline"
                size="sm"
                onClick={() => table.setPageIndex(table.getPageCount() - 1)}
                disabled={!table.getCanNextPage()}
                icon={<ChevronsRight className="h-4 w-4" />}
                aria-label="Go to last page"
              />
            </div>
          </div>
        )}
        
        {/* Delete Confirmation Dialog */}
        <Dialog
          open={showDeleteDialog}
          onClose={cancelDelete}
          title="Delete Scheduler Task"
          description="Are you sure you want to delete this scheduler task? This action cannot be undone."
        >
          <div className="flex items-center justify-end space-x-3 mt-6">
            <Button
              variant="outline"
              onClick={cancelDelete}
              disabled={deleteSchedulerTask.isPending}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={confirmDelete}
              loading={deleteSchedulerTask.isPending}
              icon={<Trash2 className="h-4 w-4" />}
            >
              Delete Task
            </Button>
          </div>
        </Dialog>
      </div>
    );
  }
);

SchedulerTable.displayName = "SchedulerTable";

export default SchedulerTable;