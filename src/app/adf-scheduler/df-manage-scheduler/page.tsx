'use client';

import React, { useState, useCallback, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { toast } from 'react-hot-toast';
import { 
  TrashIcon, 
  PencilIcon, 
  PlusIcon,
  PlayIcon,
  StopIcon,
  EyeIcon
} from '@heroicons/react/24/outline';
import { 
  CheckIcon, 
  XMarkIcon 
} from '@heroicons/react/24/solid';

// UI Components
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Paywall } from '@/components/ui/paywall';

// Hooks and utilities
import { useAuth } from '@/hooks/use-auth';
import { usePaywall } from '@/hooks/use-paywall';
import { useDebounce } from '@/hooks/use-debounce';

// Types
interface SchedulerTaskData {
  id: number;
  name: string;
  description: string | null;
  isActive: boolean;
  serviceId: number;
  component: string;
  frequency: number;
  payload: string | null;
  createdDate: string;
  lastModifiedDate: string;
  createdById: number;
  lastModifiedById: number | null;
  verb: string;
  verbMask: number;
  taskLogByTaskId: {
    taskId: number;
    statusCode: number;
    lastModifiedDate: string;
    createdDate: string;
    content: string;
  } | null;
  serviceByServiceId: {
    id: number;
    name: string;
    label: string;
    description: string;
    type: string;
    components: string[];
  };
}

interface SchedulerResponse {
  resource: SchedulerTaskData[];
  meta: {
    count: number;
    next?: string;
    previous?: string;
  };
}

interface PaginationOptions {
  limit?: number;
  offset?: number;
  filter?: string;
}

// API Client functions
const fetchSchedulerTasks = async (options: PaginationOptions = {}): Promise<SchedulerResponse> => {
  const { limit = 25, offset = 0, filter } = options;
  
  const params = new URLSearchParams({
    limit: limit.toString(),
    offset: offset.toString(),
    ...(filter && { filter }),
  });

  const response = await fetch(`/api/v2/system/scheduler?${params}`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include',
  });

  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }

  return response.json();
};

const deleteSchedulerTask = async (taskId: number): Promise<void> => {
  const response = await fetch(`/api/v2/system/scheduler/${taskId}`, {
    method: 'DELETE',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include',
  });

  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }
};

const toggleSchedulerTask = async (taskId: number, isActive: boolean): Promise<void> => {
  const response = await fetch(`/api/v2/system/scheduler/${taskId}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include',
    body: JSON.stringify({ isActive }),
  });

  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }
};

// Custom hooks for scheduler operations
const useSchedulerTasks = (options: PaginationOptions) => {
  return useQuery({
    queryKey: ['scheduler-tasks', options],
    queryFn: () => fetchSchedulerTasks(options),
    staleTime: 5 * 60 * 1000, // 5 minutes
    cacheTime: 15 * 60 * 1000, // 15 minutes
    refetchOnWindowFocus: false,
    refetchOnMount: true,
  });
};

const useDeleteSchedulerTask = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: deleteSchedulerTask,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['scheduler-tasks'] });
      toast.success('Scheduler task deleted successfully');
    },
    onError: (error: Error) => {
      toast.error(`Failed to delete scheduler task: ${error.message}`);
    },
  });
};

const useToggleSchedulerTask = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ taskId, isActive }: { taskId: number; isActive: boolean }) =>
      toggleSchedulerTask(taskId, isActive),
    onMutate: async ({ taskId, isActive }) => {
      // Optimistic update
      await queryClient.cancelQueries({ queryKey: ['scheduler-tasks'] });
      
      const previousData = queryClient.getQueriesData({ queryKey: ['scheduler-tasks'] });
      
      queryClient.setQueriesData({ queryKey: ['scheduler-tasks'] }, (oldData: any) => {
        if (!oldData?.resource) return oldData;
        
        return {
          ...oldData,
          resource: oldData.resource.map((task: SchedulerTaskData) =>
            task.id === taskId ? { ...task, isActive } : task
          ),
        };
      });
      
      return { previousData };
    },
    onError: (error, variables, context) => {
      // Rollback optimistic update
      if (context?.previousData) {
        context.previousData.forEach(([queryKey, data]) => {
          queryClient.setQueryData(queryKey, data);
        });
      }
      toast.error(`Failed to update scheduler task: ${error.message}`);
    },
    onSuccess: (_, { isActive }) => {
      toast.success(`Scheduler task ${isActive ? 'activated' : 'deactivated'} successfully`);
    },
  });
};

// Table column configuration
const TABLE_COLUMNS = [
  {
    key: 'active',
    header: 'Active',
    sortable: false,
    width: 'w-16',
  },
  {
    key: 'id',
    header: 'ID',
    sortable: true,
    width: 'w-20',
  },
  {
    key: 'name',
    header: 'Name',
    sortable: true,
    width: 'w-48',
  },
  {
    key: 'description',
    header: 'Description',
    sortable: false,
    width: 'w-64',
  },
  {
    key: 'service',
    header: 'Service',
    sortable: true,
    width: 'w-32',
  },
  {
    key: 'component',
    header: 'Component',
    sortable: true,
    width: 'w-32',
  },
  {
    key: 'method',
    header: 'Method',
    sortable: true,
    width: 'w-24',
  },
  {
    key: 'frequency',
    header: 'Frequency',
    sortable: true,
    width: 'w-28',
  },
  {
    key: 'log',
    header: 'Log',
    sortable: false,
    width: 'w-16',
  },
  {
    key: 'actions',
    header: 'Actions',
    sortable: false,
    width: 'w-32',
  },
] as const;

// Main component
export default function ManageSchedulerPage() {
  const router = useRouter();
  const { user, isAuthenticated } = useAuth();
  const { isPaywallActive, hasAccess } = usePaywall();
  
  // State management
  const [currentPage, setCurrentPage] = useState(0);
  const [pageSize, setPageSize] = useState(25);
  const [searchTerm, setSearchTerm] = useState('');
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [taskToDelete, setTaskToDelete] = useState<SchedulerTaskData | null>(null);
  
  // Debounced search for performance
  const debouncedSearchTerm = useDebounce(searchTerm, 300);
  
  // Query options
  const queryOptions = useMemo(() => ({
    limit: pageSize,
    offset: currentPage * pageSize,
    ...(debouncedSearchTerm && { filter: `name like '%${debouncedSearchTerm}%'` }),
  }), [currentPage, pageSize, debouncedSearchTerm]);
  
  // Data fetching
  const {
    data: schedulerData,
    isLoading,
    isError,
    error,
    refetch,
  } = useSchedulerTasks(queryOptions);
  
  // Mutations
  const deleteTaskMutation = useDeleteSchedulerTask();
  const toggleTaskMutation = useToggleSchedulerTask();
  
  // Event handlers
  const handleSearchChange = useCallback((value: string) => {
    setSearchTerm(value);
    setCurrentPage(0); // Reset to first page when searching
  }, []);
  
  const handlePageChange = useCallback((page: number) => {
    setCurrentPage(page);
  }, []);
  
  const handlePageSizeChange = useCallback((size: number) => {
    setPageSize(size);
    setCurrentPage(0);
  }, []);
  
  const handleCreateNew = useCallback(() => {
    router.push('/adf-scheduler/df-scheduler-details/create');
  }, [router]);
  
  const handleEdit = useCallback((task: SchedulerTaskData) => {
    router.push(`/adf-scheduler/df-scheduler-details/${task.id}`);
  }, [router]);
  
  const handleToggleActive = useCallback((task: SchedulerTaskData) => {
    toggleTaskMutation.mutate({
      taskId: task.id,
      isActive: !task.isActive,
    });
  }, [toggleTaskMutation]);
  
  const handleDeleteClick = useCallback((task: SchedulerTaskData) => {
    setTaskToDelete(task);
    setDeleteDialogOpen(true);
  }, []);
  
  const handleDeleteConfirm = useCallback(() => {
    if (taskToDelete) {
      deleteTaskMutation.mutate(taskToDelete.id, {
        onSuccess: () => {
          setDeleteDialogOpen(false);
          setTaskToDelete(null);
        },
      });
    }
  }, [taskToDelete, deleteTaskMutation]);
  
  const handleDeleteCancel = useCallback(() => {
    setDeleteDialogOpen(false);
    setTaskToDelete(null);
  }, []);
  
  const handleViewLog = useCallback((task: SchedulerTaskData) => {
    if (task.taskLogByTaskId) {
      router.push(`/adf-scheduler/logs/${task.taskLogByTaskId.taskId}`);
    }
  }, [router]);
  
  // Format frequency display
  const formatFrequency = useCallback((frequency: number) => {
    if (frequency < 60) return `${frequency}s`;
    if (frequency < 3600) return `${Math.floor(frequency / 60)}m`;
    if (frequency < 86400) return `${Math.floor(frequency / 3600)}h`;
    return `${Math.floor(frequency / 86400)}d`;
  }, []);
  
  // Calculate pagination
  const totalItems = schedulerData?.meta?.count || 0;
  const totalPages = Math.ceil(totalItems / pageSize);
  
  // Authentication check
  if (!isAuthenticated) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Alert className="max-w-md">
          <AlertDescription>
            Please log in to access the scheduler management interface.
          </AlertDescription>
        </Alert>
      </div>
    );
  }
  
  // Paywall enforcement
  if (isPaywallActive && !hasAccess('scheduler_management')) {
    return <Paywall feature="Scheduler Management" />;
  }
  
  return (
    <div className="container mx-auto px-4 py-6 max-w-7xl">
      {/* Page Header */}
      <div className="mb-8">
        <div className="flex justify-between items-center mb-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              Scheduler Management
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-2">
              Manage automated tasks and their execution schedules
            </p>
          </div>
          <Button
            onClick={handleCreateNew}
            className="flex items-center gap-2"
            size="lg"
          >
            <PlusIcon className="h-5 w-5" />
            Create New Task
          </Button>
        </div>
        
        {/* Search and Filters */}
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
          <div className="flex-1 max-w-md">
            <label htmlFor="search" className="sr-only">
              Search scheduler tasks
            </label>
            <input
              id="search"
              type="search"
              placeholder="Search tasks..."
              value={searchTerm}
              onChange={(e) => handleSearchChange(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:border-gray-600 dark:bg-gray-800 dark:text-white"
            />
          </div>
          
          <div className="flex items-center gap-2">
            <label htmlFor="pageSize" className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Show:
            </label>
            <select
              id="pageSize"
              value={pageSize}
              onChange={(e) => handlePageSizeChange(parseInt(e.target.value))}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
            >
              <option value={10}>10</option>
              <option value={25}>25</option>
              <option value={50}>50</option>
              <option value={100}>100</option>
            </select>
          </div>
        </div>
      </div>
      
      {/* Error State */}
      {isError && (
        <Alert className="mb-6 border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-900/10">
          <AlertDescription className="text-red-800 dark:text-red-200">
            Failed to load scheduler tasks: {error?.message || 'Unknown error'}
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => refetch()}
              className="ml-4"
            >
              Retry
            </Button>
          </AlertDescription>
        </Alert>
      )}
      
      {/* Data Table */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <LoadingSpinner className="h-8 w-8" />
            <span className="ml-2 text-gray-600 dark:text-gray-400">
              Loading scheduler tasks...
            </span>
          </div>
        ) : schedulerData?.resource?.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500 dark:text-gray-400 text-lg">
              {debouncedSearchTerm ? 'No tasks found matching your search' : 'No scheduler tasks configured'}
            </p>
            {!debouncedSearchTerm && (
              <Button 
                onClick={handleCreateNew}
                className="mt-4"
                variant="outline"
              >
                Create Your First Task
              </Button>
            )}
          </div>
        ) : (
          <>
            <Table>
              <TableHeader>
                <TableRow>
                  {TABLE_COLUMNS.map((column) => (
                    <TableHead 
                      key={column.key} 
                      className={`${column.width} font-semibold`}
                    >
                      {column.header}
                    </TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {schedulerData?.resource?.map((task) => (
                  <TableRow 
                    key={task.id}
                    className="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                  >
                    {/* Active Status */}
                    <TableCell>
                      <button
                        onClick={() => handleToggleActive(task)}
                        disabled={toggleTaskMutation.isLoading}
                        className="p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
                        title={task.isActive ? 'Deactivate task' : 'Activate task'}
                      >
                        {task.isActive ? (
                          <CheckIcon className="h-5 w-5 text-green-600" />
                        ) : (
                          <XMarkIcon className="h-5 w-5 text-gray-400" />
                        )}
                      </button>
                    </TableCell>
                    
                    {/* ID */}
                    <TableCell className="font-mono text-sm">
                      {task.id}
                    </TableCell>
                    
                    {/* Name */}
                    <TableCell>
                      <div className="font-medium text-gray-900 dark:text-white">
                        {task.name}
                      </div>
                    </TableCell>
                    
                    {/* Description */}
                    <TableCell>
                      <div className="text-sm text-gray-600 dark:text-gray-400 max-w-xs truncate">
                        {task.description || '-'}
                      </div>
                    </TableCell>
                    
                    {/* Service */}
                    <TableCell>
                      <Badge variant="secondary" className="text-xs">
                        {task.serviceByServiceId.name}
                      </Badge>
                    </TableCell>
                    
                    {/* Component */}
                    <TableCell className="font-mono text-sm">
                      {task.component}
                    </TableCell>
                    
                    {/* Method */}
                    <TableCell>
                      <Badge 
                        variant={
                          task.verb === 'GET' ? 'secondary' :
                          task.verb === 'POST' ? 'default' :
                          task.verb === 'PUT' ? 'outline' :
                          task.verb === 'DELETE' ? 'destructive' : 'secondary'
                        }
                        className="text-xs"
                      >
                        {task.verb}
                      </Badge>
                    </TableCell>
                    
                    {/* Frequency */}
                    <TableCell className="text-sm font-mono">
                      {formatFrequency(task.frequency)}
                    </TableCell>
                    
                    {/* Log Status */}
                    <TableCell>
                      {task.taskLogByTaskId ? (
                        <button
                          onClick={() => handleViewLog(task)}
                          className="p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
                          title="View task log"
                        >
                          <EyeIcon className="h-4 w-4 text-blue-600" />
                        </button>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </TableCell>
                    
                    {/* Actions */}
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleEdit(task)}
                          className="p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
                          title="Edit task"
                        >
                          <PencilIcon className="h-4 w-4 text-gray-600 dark:text-gray-400" />
                        </button>
                        <button
                          onClick={() => handleDeleteClick(task)}
                          className="p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
                          title="Delete task"
                        >
                          <TrashIcon className="h-4 w-4 text-red-600" />
                        </button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            
            {/* Pagination */}
            {totalPages > 1 && (
              <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700">
                <div className="flex items-center justify-between">
                  <div className="text-sm text-gray-700 dark:text-gray-300">
                    Showing {currentPage * pageSize + 1} to{' '}
                    {Math.min((currentPage + 1) * pageSize, totalItems)} of{' '}
                    {totalItems} results
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handlePageChange(currentPage - 1)}
                      disabled={currentPage === 0}
                    >
                      Previous
                    </Button>
                    
                    <div className="flex items-center gap-1">
                      {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                        const pageNum = Math.max(0, Math.min(currentPage - 2 + i, totalPages - 1));
                        const isActive = pageNum === currentPage;
                        
                        return (
                          <Button
                            key={pageNum}
                            variant={isActive ? 'default' : 'outline'}
                            size="sm"
                            onClick={() => handlePageChange(pageNum)}
                            className="w-10"
                          >
                            {pageNum + 1}
                          </Button>
                        );
                      })}
                    </div>
                    
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handlePageChange(currentPage + 1)}
                      disabled={currentPage >= totalPages - 1}
                    >
                      Next
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>
      
      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Delete Scheduler Task</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete "{taskToDelete?.name}"? 
              This action cannot be undone and will permanently remove the scheduled task.
            </DialogDescription>
          </DialogHeader>
          
          <div className="flex justify-end gap-2 mt-6">
            <Button
              variant="outline"
              onClick={handleDeleteCancel}
              disabled={deleteTaskMutation.isLoading}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteConfirm}
              disabled={deleteTaskMutation.isLoading}
            >
              {deleteTaskMutation.isLoading ? (
                <>
                  <LoadingSpinner className="h-4 w-4 mr-2" />
                  Deleting...
                </>
              ) : (
                'Delete Task'
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}