'use client';

import React, { Suspense } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { 
  PlusIcon, 
  RefreshIcon,
  TrashIcon,
  PencilIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  XCircleIcon 
} from '@heroicons/react/24/outline';
import { Button } from '@/components/ui/button';
import { Alert } from '@/components/ui/alert';
import { useSchedulerTasks } from '@/hooks/useSchedulerTasks';
import { usePaywall } from '@/hooks/use-paywall';
import { useNotifications } from '@/hooks/use-notifications';
import { useTheme } from '@/hooks/use-theme';
import { Paywall } from '@/components/ui/paywall';
import { ManageTable } from '@/components/ui/manage-table';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import type { SchedulerTaskData } from '@/types/scheduler';

/**
 * Main scheduler page component that serves as the entry point for the ADF Scheduler feature
 * in the Next.js app router. This page component manages the scheduler management interface
 * with React Query data fetching, Tailwind CSS styling, and Next.js middleware integration
 * for paywall enforcement.
 * 
 * Replaces the Angular routing entry point while maintaining the same functionality
 * as the original Angular implementation using React 19 patterns.
 * 
 * Features:
 * - React Query for server state management with TTL configuration
 * - Paywall enforcement via Next.js middleware instead of Angular guards
 * - Tailwind CSS styling with Headless UI components
 * - Functional parity with existing scheduler management capabilities
 */
export default function SchedulerPage() {
  const router = useRouter();
  const { isDark } = useTheme();
  const { addNotification } = useNotifications();
  const { isPaywallActive } = usePaywall('scheduler');
  
  // React Query hook for scheduler tasks data fetching with TTL configuration
  const {
    data: schedulerTasks,
    isLoading,
    isError,
    error,
    refetch,
    deleteTask,
    isDeleting
  } = useSchedulerTasks({
    staleTime: 300000, // 5 minutes TTL
    cacheTime: 900000, // 15 minutes cache time
    refetchOnWindowFocus: false,
    related: 'task_log_by_task_id,service_by_service_id'
  });

  const [deleteDialogOpen, setDeleteDialogOpen] = React.useState(false);
  const [taskToDelete, setTaskToDelete] = React.useState<SchedulerTaskData | null>(null);

  /**
   * Table column configuration matching the original Angular implementation
   * with proper TypeScript typing and accessibility considerations
   */
  const columns = React.useMemo(() => [
    {
      id: 'active',
      header: 'Active',
      accessorKey: 'isActive',
      cell: ({ row }: { row: { original: SchedulerTaskData } }) => (
        <div className="flex items-center justify-center">
          {row.original.isActive ? (
            <CheckCircleIcon className="h-5 w-5 text-green-500" aria-label="Active" />
          ) : (
            <XCircleIcon className="h-5 w-5 text-red-500" aria-label="Inactive" />
          )}
        </div>
      ),
    },
    {
      id: 'id',
      header: 'ID',
      accessorKey: 'id',
      cell: ({ row }: { row: { original: SchedulerTaskData } }) => (
        <span className="font-mono text-sm">{row.original.id}</span>
      ),
    },
    {
      id: 'name',
      header: 'Name',
      accessorKey: 'name',
      cell: ({ row }: { row: { original: SchedulerTaskData } }) => (
        <span className="font-medium">{row.original.name}</span>
      ),
    },
    {
      id: 'description',
      header: 'Description',
      accessorKey: 'description',
      cell: ({ row }: { row: { original: SchedulerTaskData } }) => (
        <span className="text-gray-600 dark:text-gray-300 truncate max-w-xs">
          {row.original.description || '-'}
        </span>
      ),
    },
    {
      id: 'service',
      header: 'Service',
      accessorKey: 'serviceByServiceId.name',
      cell: ({ row }: { row: { original: SchedulerTaskData } }) => (
        <span className="font-medium text-blue-600 dark:text-blue-400">
          {row.original.serviceByServiceId?.name || '-'}
        </span>
      ),
    },
    {
      id: 'component',
      header: 'Component',
      accessorKey: 'component',
      cell: ({ row }: { row: { original: SchedulerTaskData } }) => (
        <span className="font-mono text-sm">{row.original.component}</span>
      ),
    },
    {
      id: 'method',
      header: 'Method',
      accessorKey: 'verb',
      cell: ({ row }: { row: { original: SchedulerTaskData } }) => (
        <span className={`
          inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium
          ${row.original.verb === 'GET' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' : ''}
          ${row.original.verb === 'POST' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200' : ''}
          ${row.original.verb === 'PUT' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200' : ''}
          ${row.original.verb === 'DELETE' ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200' : ''}
          ${!['GET', 'POST', 'PUT', 'DELETE'].includes(row.original.verb) ? 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200' : ''}
        `}>
          {row.original.verb}
        </span>
      ),
    },
    {
      id: 'frequency',
      header: 'Frequency',
      accessorKey: 'frequency',
      cell: ({ row }: { row: { original: SchedulerTaskData } }) => (
        <span className="text-sm">{row.original.frequency}s</span>
      ),
    },
    {
      id: 'log',
      header: 'Log',
      cell: ({ row }: { row: { original: SchedulerTaskData } }) => (
        <div className="flex items-center justify-center">
          {row.original.taskLogByTaskId ? (
            <CheckCircleIcon className="h-5 w-5 text-green-500" aria-label="Has log" />
          ) : (
            <XCircleIcon className="h-5 w-5 text-gray-400" aria-label="No log" />
          )}
        </div>
      ),
    },
    {
      id: 'actions',
      header: 'Actions',
      cell: ({ row }: { row: { original: SchedulerTaskData } }) => (
        <div className="flex items-center space-x-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleEdit(row.original)}
            className="h-8 w-8 p-0"
            aria-label={`Edit ${row.original.name}`}
          >
            <PencilIcon className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleDelete(row.original)}
            className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50 dark:text-red-400 dark:hover:text-red-300 dark:hover:bg-red-900/20"
            aria-label={`Delete ${row.original.name}`}
          >
            <TrashIcon className="h-4 w-4" />
          </Button>
        </div>
      ),
    },
  ], []);

  /**
   * Handle creating a new scheduler task
   */
  const handleCreate = () => {
    router.push('/adf-scheduler/create');
  };

  /**
   * Handle editing an existing scheduler task
   */
  const handleEdit = (task: SchedulerTaskData) => {
    router.push(`/adf-scheduler/${task.id}`);
  };

  /**
   * Handle deleting a scheduler task with confirmation
   */
  const handleDelete = (task: SchedulerTaskData) => {
    setTaskToDelete(task);
    setDeleteDialogOpen(true);
  };

  /**
   * Confirm deletion of scheduler task
   */
  const confirmDelete = async () => {
    if (taskToDelete) {
      try {
        await deleteTask(taskToDelete.id);
        addNotification({
          type: 'success',
          title: 'Task Deleted',
          message: `Scheduler task "${taskToDelete.name}" has been deleted successfully.`
        });
        setDeleteDialogOpen(false);
        setTaskToDelete(null);
      } catch (error) {
        addNotification({
          type: 'error',
          title: 'Delete Failed',
          message: `Failed to delete scheduler task "${taskToDelete.name}". Please try again.`
        });
      }
    }
  };

  /**
   * Handle refreshing the scheduler tasks data
   */
  const handleRefresh = () => {
    refetch();
    addNotification({
      type: 'info',
      title: 'Refreshed',
      message: 'Scheduler tasks data has been refreshed.'
    });
  };

  // Show paywall if middleware indicates paywall is active
  if (isPaywallActive) {
    return (
      <div className="container mx-auto px-4 py-6">
        <Paywall feature="scheduler" />
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-6">
      {/* Page Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
              Scheduler
            </h1>
            <p className="mt-2 text-gray-600 dark:text-gray-300">
              Manage scheduled tasks and automation workflows
            </p>
          </div>
          <div className="flex items-center space-x-3">
            <Button
              variant="outline"
              onClick={handleRefresh}
              disabled={isLoading}
              className="flex items-center space-x-2"
              aria-label="Refresh scheduler tasks"
            >
              <RefreshIcon className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
              <span>Refresh</span>
            </Button>
            <Button
              onClick={handleCreate}
              className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white"
              aria-label="Create new scheduler task"
            >
              <PlusIcon className="h-4 w-4" />
              <span>Create Task</span>
            </Button>
          </div>
        </div>
      </div>

      {/* Error State */}
      {isError && (
        <Alert variant="destructive" className="mb-6">
          <ExclamationTriangleIcon className="h-4 w-4" />
          <div>
            <h4 className="font-medium">Error Loading Scheduler Tasks</h4>
            <p className="text-sm mt-1">
              {error?.message || 'An unexpected error occurred. Please try refreshing the page.'}
            </p>
          </div>
        </Alert>
      )}

      {/* Main Table */}
      <div className="bg-white dark:bg-gray-800 shadow rounded-lg">
        <Suspense fallback={
          <div className="flex items-center justify-center p-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        }>
          <ManageTable
            data={schedulerTasks || []}
            columns={columns}
            isLoading={isLoading}
            searchPlaceholder="Search scheduler tasks..."
            emptyMessage="No scheduler tasks found. Create your first task to get started."
            className="border-0"
            enableSearch={true}
            enablePagination={true}
            pageSize={25}
          />
        </Suspense>
      </div>

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        title="Delete Scheduler Task"
        description={
          taskToDelete 
            ? `Are you sure you want to delete "${taskToDelete.name}"? This action cannot be undone.`
            : 'Are you sure you want to delete this task?'
        }
        confirmText="Delete"
        cancelText="Cancel"
        onConfirm={confirmDelete}
        variant="destructive"
        loading={isDeleting}
      />
    </div>
  );
}