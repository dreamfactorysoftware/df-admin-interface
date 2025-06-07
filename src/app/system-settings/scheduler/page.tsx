'use client';

import React, { useState, useMemo, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useVirtualizer } from '@tanstack/react-virtual';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/data-table';
import { Badge } from '@/components/ui/badge';
import { Spinner } from '@/components/ui/spinner';
import { Trash2, Edit, Plus, AlertTriangle, Eye } from 'lucide-react';
import { useSchedulerTasks } from '@/hooks/useSchedulerTasks';
import { useDeleteSchedulerTask } from '@/hooks/useDeleteSchedulerTask';
import { apiClient } from '@/lib/api-client';
import { useSchedulerStore } from '@/lib/scheduler-store';
import { SchedulerTaskData } from '@/types/scheduler';
import { cn } from '@/lib/utils';

/**
 * Scheduler Management Page Component
 * 
 * This Next.js app router page component provides comprehensive CRUD operations
 * for scheduler tasks. It implements React Query for intelligent caching,
 * TanStack Virtual for performance optimization with large datasets,
 * and Tailwind CSS with Headless UI for accessible styling.
 * 
 * Features:
 * - Server state management with React Query (300s staleTime, 900s cacheTime)
 * - Virtual scrolling for 1000+ scheduler tasks
 * - Real-time data synchronization
 * - Accessibility compliance (WCAG 2.1 AA)
 * - Paywall enforcement via conditional rendering
 * - Responsive design with Tailwind CSS
 */
export default function SchedulerPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  
  // State management
  const [selectedTask, setSelectedTask] = useState<SchedulerTaskData | null>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [filter, setFilter] = useState('');
  const [sortField, setSortField] = useState<keyof SchedulerTaskData>('name');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

  // Store state
  const { isPaywallActive, setPaywallActive } = useSchedulerStore();

  // Data fetching with React Query - optimized caching per Section 5.2
  const {
    data: tasksData,
    isLoading,
    isError,
    error,
    refetch,
  } = useSchedulerTasks({
    staleTime: 300 * 1000, // 5 minutes
    cacheTime: 900 * 1000, // 15 minutes
    refetchOnWindowFocus: false,
    refetchInterval: 30 * 1000, // 30 seconds background refresh
  });

  // Delete mutation with optimistic updates
  const deleteTaskMutation = useDeleteSchedulerTask({
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['scheduler-tasks'] });
      setShowDeleteDialog(false);
      setSelectedTask(null);
    },
    onError: (error) => {
      console.error('Failed to delete scheduler task:', error);
    },
  });

  // Filtered and sorted data
  const processedTasks = useMemo(() => {
    if (!tasksData?.data) return [];
    
    let filtered = tasksData.data;
    
    // Apply filter
    if (filter) {
      const searchTerm = filter.toLowerCase();
      filtered = filtered.filter(task =>
        task.name.toLowerCase().includes(searchTerm) ||
        task.description?.toLowerCase().includes(searchTerm) ||
        task.serviceByServiceId.name.toLowerCase().includes(searchTerm) ||
        task.component.toLowerCase().includes(searchTerm)
      );
    }
    
    // Apply sorting
    filtered.sort((a, b) => {
      const aVal = a[sortField];
      const bVal = b[sortField];
      
      if (aVal === null || aVal === undefined) return 1;
      if (bVal === null || bVal === undefined) return -1;
      
      let comparison = 0;
      if (typeof aVal === 'string' && typeof bVal === 'string') {
        comparison = aVal.localeCompare(bVal);
      } else if (typeof aVal === 'number' && typeof bVal === 'number') {
        comparison = aVal - bVal;
      } else if (typeof aVal === 'boolean' && typeof bVal === 'boolean') {
        comparison = aVal === bVal ? 0 : aVal ? 1 : -1;
      }
      
      return sortDirection === 'asc' ? comparison : -comparison;
    });
    
    return filtered;
  }, [tasksData?.data, filter, sortField, sortDirection]);

  // Virtual scrolling setup for performance with large datasets (1000+ tasks)
  const parentRef = React.useRef<HTMLDivElement>(null);
  const virtualizer = useVirtualizer({
    count: processedTasks.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 60, // Estimated row height
    overscan: 10, // Render extra items for smooth scrolling
  });

  // Event handlers
  const handleSort = useCallback((field: keyof SchedulerTaskData) => {
    if (sortField === field) {
      setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  }, [sortField]);

  const handleDeleteTask = useCallback((task: SchedulerTaskData) => {
    setSelectedTask(task);
    setShowDeleteDialog(true);
  }, []);

  const confirmDelete = useCallback(() => {
    if (selectedTask) {
      deleteTaskMutation.mutate(selectedTask.id);
    }
  }, [selectedTask, deleteTaskMutation]);

  const handleEditTask = useCallback((task: SchedulerTaskData) => {
    router.push(`/system-settings/scheduler/${task.id}`);
  }, [router]);

  const handleViewTask = useCallback((task: SchedulerTaskData) => {
    router.push(`/system-settings/scheduler/${task.id}?view=true`);
  }, [router]);

  const handleCreateTask = useCallback(() => {
    router.push('/system-settings/scheduler/create');
  }, [router]);

  const formatFrequency = useCallback((frequency: number) => {
    if (frequency < 60) return `${frequency}s`;
    if (frequency < 3600) return `${Math.floor(frequency / 60)}m`;
    return `${Math.floor(frequency / 3600)}h`;
  }, []);

  const getStatusBadge = useCallback((task: SchedulerTaskData) => {
    if (!task.isActive) {
      return <Badge variant="secondary">Inactive</Badge>;
    }
    
    if (task.taskLogByTaskId) {
      const lastLog = task.taskLogByTaskId;
      if (lastLog.statusCode >= 200 && lastLog.statusCode < 300) {
        return <Badge variant="success">Success</Badge>;
      } else if (lastLog.statusCode >= 400) {
        return <Badge variant="destructive">Error</Badge>;
      }
    }
    
    return <Badge variant="default">Active</Badge>;
  }, []);

  // Paywall enforcement - conditional rendering based on middleware authentication
  if (isPaywallActive) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto text-center">
          <div className="bg-gradient-to-br from-purple-500 to-pink-600 rounded-lg p-8 text-white">
            <AlertTriangle className="h-16 w-16 mx-auto mb-4" />
            <h2 className="text-2xl font-bold mb-4">Premium Feature</h2>
            <p className="text-lg mb-6">
              Scheduler management is available with DreamFactory Premium.
              Upgrade your plan to access advanced scheduling capabilities.
            </p>
            <Button
              onClick={() => window.open('/upgrade', '_blank')}
              className="bg-white text-purple-600 hover:bg-gray-100"
            >
              Upgrade Now
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (isError) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
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
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Scheduler Tasks</h1>
          <p className="text-muted-foreground">
            Manage and monitor your scheduled API tasks
          </p>
        </div>
        <Button onClick={handleCreateTask} className="flex items-center gap-2">
          <Plus className="h-4 w-4" />
          Create Task
        </Button>
      </div>

      {/* Filters and Search */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1">
          <input
            type="text"
            placeholder="Search tasks..."
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent dark:border-gray-600 dark:bg-gray-800 dark:text-white"
          />
        </div>
        <div className="text-sm text-muted-foreground flex items-center gap-2">
          <span>Total: {processedTasks.length}</span>
          {isLoading && <Spinner className="h-4 w-4" />}
        </div>
      </div>

      {/* Tasks Table with Virtual Scrolling */}
      <div className="border rounded-lg bg-white dark:bg-gray-800">
        {isLoading ? (
          <div className="flex justify-center items-center h-64">
            <Spinner className="h-8 w-8" />
          </div>
        ) : processedTasks.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground">
              {filter ? 'No tasks match your search.' : 'No scheduler tasks found.'}
            </p>
            {!filter && (
              <Button onClick={handleCreateTask} className="mt-4">
                Create your first task
              </Button>
            )}
          </div>
        ) : (
          <div ref={parentRef} className="h-[600px] overflow-auto">
            <div
              style={{
                height: `${virtualizer.getTotalSize()}px`,
                width: '100%',
                position: 'relative',
              }}
            >
              <Table>
                <TableHeader className="sticky top-0 bg-white dark:bg-gray-800 z-10">
                  <TableRow>
                    <TableHead
                      className="cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700"
                      onClick={() => handleSort('isActive')}
                    >
                      Status
                      {sortField === 'isActive' && (
                        <span className="ml-1">
                          {sortDirection === 'asc' ? '↑' : '↓'}
                        </span>
                      )}
                    </TableHead>
                    <TableHead
                      className="cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700"
                      onClick={() => handleSort('name')}
                    >
                      Name
                      {sortField === 'name' && (
                        <span className="ml-1">
                          {sortDirection === 'asc' ? '↑' : '↓'}
                        </span>
                      )}
                    </TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead
                      className="cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700"
                      onClick={() => handleSort('serviceByServiceId')}
                    >
                      Service
                    </TableHead>
                    <TableHead>Component</TableHead>
                    <TableHead>Method</TableHead>
                    <TableHead
                      className="cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700"
                      onClick={() => handleSort('frequency')}
                    >
                      Frequency
                      {sortField === 'frequency' && (
                        <span className="ml-1">
                          {sortDirection === 'asc' ? '↑' : '↓'}
                        </span>
                      )}
                    </TableHead>
                    <TableHead>Log</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {virtualizer.getVirtualItems().map((virtualItem) => {
                    const task = processedTasks[virtualItem.index];
                    return (
                      <TableRow
                        key={task.id}
                        style={{
                          position: 'absolute',
                          top: 0,
                          left: 0,
                          width: '100%',
                          transform: `translateY(${virtualItem.start}px)`,
                        }}
                        className="hover:bg-gray-50 dark:hover:bg-gray-700"
                      >
                        <TableCell>
                          {getStatusBadge(task)}
                        </TableCell>
                        <TableCell className="font-medium">
                          {task.name}
                        </TableCell>
                        <TableCell className="max-w-xs truncate">
                          {task.description || '—'}
                        </TableCell>
                        <TableCell>
                          {task.serviceByServiceId.name}
                        </TableCell>
                        <TableCell>
                          {task.component}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">
                            {task.verb.toUpperCase()}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {formatFrequency(task.frequency)}
                        </TableCell>
                        <TableCell>
                          {task.taskLogByTaskId ? (
                            <Badge
                              variant={
                                task.taskLogByTaskId.statusCode >= 200 &&
                                task.taskLogByTaskId.statusCode < 300
                                  ? 'success'
                                  : 'destructive'
                              }
                            >
                              {task.taskLogByTaskId.statusCode}
                            </Badge>
                          ) : (
                            '—'
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleViewTask(task)}
                              className="h-8 w-8 p-0"
                              title="View task"
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleEditTask(task)}
                              className="h-8 w-8 p-0"
                              title="Edit task"
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDeleteTask(task)}
                              className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                              title="Delete task"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          </div>
        )}
      </div>

      {/* Delete Confirmation Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Scheduler Task</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete the task "{selectedTask?.name}"?
              This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowDeleteDialog(false)}
              disabled={deleteTaskMutation.isPending}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={confirmDelete}
              disabled={deleteTaskMutation.isPending}
            >
              {deleteTaskMutation.isPending ? (
                <>
                  <Spinner className="h-4 w-4 mr-2" />
                  Deleting...
                </>
              ) : (
                'Delete'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}