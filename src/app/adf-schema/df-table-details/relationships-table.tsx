'use client';

import React, { useMemo, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  useReactTable,
  getPaginationRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  SortingState,
  ColumnFiltersState,
  VisibilityState,
  PaginationState,
} from '@tanstack/react-table';
import { useVirtualizer } from '@tanstack/react-virtual';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Dialog } from '@/components/ui/dialog';
import { useTableRelationships } from '@/hooks/use-table-relationships';
import { useTableCrud } from '@/hooks/use-table-crud';
import { TableRelated, RelationshipsRow } from '@/types/table-details';
import { cn } from '@/lib/utils';
import { Plus, Eye, MoreHorizontal, Trash2, RefreshCw } from 'lucide-react';

interface RelationshipsTableProps {
  /**
   * Database name from route parameters
   */
  dbName: string;
  /**
   * Table name from route context
   */
  tableName: string;
  /**
   * Optional class name for styling
   */
  className?: string;
  /**
   * Enable virtual scrolling for large datasets (1,000+ relationships)
   */
  enableVirtualization?: boolean;
}

/**
 * Relationships table component for displaying and managing table relationships
 * using TanStack Table with virtual scrolling for performance optimization.
 * 
 * Features:
 * - TanStack Virtual implementation for databases with 1,000+ tables per Section 5.2
 * - SWR/React Query for intelligent caching with cache hit responses under 50ms
 * - Tailwind CSS 4.1+ with consistent theme injection
 * - Optimistic updates and real-time synchronization with React Query mutations
 * - CRUD functionality with navigation to detail views and creation workflows
 */
export function RelationshipsTable({
  dbName,
  tableName,
  className,
  enableVirtualization = true,
}: RelationshipsTableProps) {
  const router = useRouter();
  const queryClient = useQueryClient();
  
  // Table state management
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});
  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: 50,
  });

  // Confirmation dialog state
  const [deleteDialog, setDeleteDialog] = useState<{
    open: boolean;
    relationship?: RelationshipsRow;
  }>({ open: false });

  // Data fetching with React Query intelligent caching
  const {
    data: relationshipsData,
    isLoading,
    isError,
    error,
    refetch,
  } = useTableRelationships({
    dbName,
    tableName,
    options: {
      staleTime: 300000, // 5 minutes stale time for optimal caching
      cacheTime: 900000, // 15 minutes cache time per Section 5.2
      refetchOnWindowFocus: false,
      retry: 3,
    },
  });

  // CRUD operations hook
  const { deleteRelationship } = useTableCrud({
    dbName,
    tableName,
  });

  // Delete mutation with optimistic updates
  const deleteMutation = useMutation({
    mutationFn: (relationshipName: string) =>
      deleteRelationship(relationshipName),
    onMutate: async (relationshipName) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({
        queryKey: ['table-relationships', dbName, tableName],
      });

      // Snapshot the previous value for rollback
      const previousRelationships = queryClient.getQueryData([
        'table-relationships',
        dbName,
        tableName,
      ]);

      // Optimistically update the cache
      queryClient.setQueryData(
        ['table-relationships', dbName, tableName],
        (old: any) => ({
          ...old,
          resource: old?.resource?.filter(
            (rel: TableRelated) => rel.name !== relationshipName
          ),
        })
      );

      return { previousRelationships };
    },
    onError: (err, relationshipName, context) => {
      // Rollback on error
      if (context?.previousRelationships) {
        queryClient.setQueryData(
          ['table-relationships', dbName, tableName],
          context.previousRelationships
        );
      }
    },
    onSettled: () => {
      // Always refetch after mutation to ensure consistency
      queryClient.invalidateQueries({
        queryKey: ['table-relationships', dbName, tableName],
      });
    },
  });

  // Transform data for table display
  const tableData = useMemo((): RelationshipsRow[] => {
    if (!relationshipsData?.resource) return [];
    
    return relationshipsData.resource.map((rel: TableRelated): RelationshipsRow => ({
      name: rel.name,
      alias: rel.alias || '',
      type: rel.type,
      isVirtual: rel.isVirtual,
    }));
  }, [relationshipsData]);

  // Column definitions using TanStack Table
  const columnHelper = createColumnHelper<RelationshipsRow>();

  const columns = useMemo(
    () => [
      columnHelper.accessor('name', {
        id: 'name',
        header: 'Name',
        cell: (info) => (
          <span className="font-medium text-gray-900 dark:text-gray-100">
            {info.getValue()}
          </span>
        ),
        enableSorting: true,
        enableColumnFilter: true,
      }),
      columnHelper.accessor('alias', {
        id: 'alias',
        header: 'Alias',
        cell: (info) => (
          <span className="text-gray-600 dark:text-gray-400">
            {info.getValue() || '—'}
          </span>
        ),
        enableSorting: true,
        enableColumnFilter: true,
      }),
      columnHelper.accessor('type', {
        id: 'type',
        header: 'Type',
        cell: (info) => (
          <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
            {info.getValue()}
          </span>
        ),
        enableSorting: true,
        enableColumnFilter: true,
      }),
      columnHelper.accessor('isVirtual', {
        id: 'virtual',
        header: 'Virtual',
        cell: (info) => (
          <span
            className={cn(
              'inline-flex items-center px-2 py-1 rounded-md text-xs font-medium',
              info.getValue()
                ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
            )}
          >
            {info.getValue() ? 'Yes' : 'No'}
          </span>
        ),
        enableSorting: true,
        enableColumnFilter: false,
      }),
      columnHelper.display({
        id: 'actions',
        header: 'Actions',
        cell: (info) => (
          <div className="flex items-center space-x-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleViewRelationship(info.row.original)}
              className="h-8 w-8 p-0"
              aria-label={`View relationship ${info.row.original.name}`}
            >
              <Eye className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() =>
                setDeleteDialog({
                  open: true,
                  relationship: info.row.original,
                })
              }
              className="h-8 w-8 p-0 text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
              aria-label={`Delete relationship ${info.row.original.name}`}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        ),
        enableSorting: false,
        enableColumnFilter: false,
      }),
    ],
    [columnHelper]
  );

  // Table instance with TanStack Table
  const table = useReactTable({
    data: tableData,
    columns,
    state: {
      sorting,
      columnFilters,
      columnVisibility,
      pagination,
    },
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onColumnVisibilityChange: setColumnVisibility,
    onPaginationChange: setPagination,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    manualPagination: false,
    debugTable: false,
  });

  // Virtual scrolling setup for performance optimization
  const parentRef = React.useRef<HTMLDivElement>(null);
  const { rows } = table.getRowModel();

  const virtualizer = useVirtualizer({
    count: rows.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 52, // Estimated row height in pixels
    overscan: 10, // Render extra items outside viewport
    enabled: enableVirtualization && rows.length > 100,
  });

  // Navigation handlers using Next.js router
  const handleViewRelationship = (relationship: RelationshipsRow) => {
    router.push(
      `/adf-schema/databases/${dbName}/tables/${tableName}/relationships/${relationship.name}`
    );
  };

  const handleCreateRelationship = () => {
    router.push(
      `/adf-schema/databases/${dbName}/tables/${tableName}/relationships/create`
    );
  };

  // Delete confirmation handler
  const handleDeleteRelationship = async () => {
    if (!deleteDialog.relationship) return;

    try {
      await deleteMutation.mutateAsync(deleteDialog.relationship.name);
      setDeleteDialog({ open: false });
    } catch (error) {
      console.error('Failed to delete relationship:', error);
      // Error handling is managed by the mutation's onError callback
    }
  };

  // Refresh handler
  const handleRefresh = () => {
    refetch();
  };

  // Error state rendering
  if (isError) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <div className="text-red-600 dark:text-red-400 mb-4">
          Error loading relationships: {error?.message || 'Unknown error'}
        </div>
        <Button onClick={handleRefresh} variant="outline">
          <RefreshCw className="mr-2 h-4 w-4" />
          Retry
        </Button>
      </div>
    );
  }

  return (
    <div className={cn('space-y-4', className)}>
      {/* Table header with actions */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            Relationships
          </h2>
          {tableData.length > 0 && (
            <span className="text-sm text-gray-500 dark:text-gray-400">
              {tableData.length} relationship{tableData.length !== 1 ? 's' : ''}
            </span>
          )}
        </div>
        <div className="flex items-center space-x-2">
          <Button
            onClick={handleRefresh}
            variant="outline"
            size="sm"
            disabled={isLoading}
            className="h-8"
          >
            <RefreshCw
              className={cn('mr-2 h-4 w-4', isLoading && 'animate-spin')}
            />
            Refresh
          </Button>
          <Button
            onClick={handleCreateRelationship}
            size="sm"
            className="h-8"
          >
            <Plus className="mr-2 h-4 w-4" />
            Add Relationship
          </Button>
        </div>
      </div>

      {/* Table container with virtual scrolling */}
      <div className="border rounded-lg bg-white dark:bg-gray-800 overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        ) : tableData.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12">
            <div className="text-gray-500 dark:text-gray-400 mb-4">
              No relationships found
            </div>
            <Button onClick={handleCreateRelationship} variant="outline">
              <Plus className="mr-2 h-4 w-4" />
              Create First Relationship
            </Button>
          </div>
        ) : (
          <div
            ref={parentRef}
            className="h-[600px] overflow-auto"
            style={{
              contain: 'strict',
            }}
          >
            <div
              style={{
                height: enableVirtualization
                  ? `${virtualizer.getTotalSize()}px`
                  : 'auto',
                width: '100%',
                position: 'relative',
              }}
            >
              <table className="w-full">
                <thead className="bg-gray-50 dark:bg-gray-700 sticky top-0 z-10">
                  {table.getHeaderGroups().map((headerGroup) => (
                    <tr key={headerGroup.id}>
                      {headerGroup.headers.map((header) => (
                        <th
                          key={header.id}
                          className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider"
                          style={{
                            width: header.getSize(),
                          }}
                        >
                          {header.isPlaceholder ? null : (
                            <div
                              className={cn(
                                header.column.getCanSort() &&
                                  'cursor-pointer select-none',
                                'flex items-center space-x-1'
                              )}
                              onClick={header.column.getToggleSortingHandler()}
                            >
                              {flexRender(
                                header.column.columnDef.header,
                                header.getContext()
                              )}
                              {header.column.getCanSort() && (
                                <span>
                                  {{
                                    asc: '↑',
                                    desc: '↓',
                                  }[header.column.getIsSorted() as string] ??
                                    '↕'}
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
                  {enableVirtualization && rows.length > 100
                    ? virtualizer.getVirtualItems().map((virtualRow) => {
                        const row = rows[virtualRow.index];
                        return (
                          <tr
                            key={row.id}
                            data-index={virtualRow.index}
                            ref={(node) => virtualizer.measureElement(node)}
                            style={{
                              position: 'absolute',
                              top: 0,
                              left: 0,
                              width: '100%',
                              transform: `translateY(${virtualRow.start}px)`,
                            }}
                            className="hover:bg-gray-50 dark:hover:bg-gray-700"
                          >
                            {row.getVisibleCells().map((cell) => (
                              <td
                                key={cell.id}
                                className="px-6 py-4 whitespace-nowrap text-sm"
                              >
                                {flexRender(
                                  cell.column.columnDef.cell,
                                  cell.getContext()
                                )}
                              </td>
                            ))}
                          </tr>
                        );
                      })
                    : rows.map((row) => (
                        <tr
                          key={row.id}
                          className="hover:bg-gray-50 dark:hover:bg-gray-700"
                        >
                          {row.getVisibleCells().map((cell) => (
                            <td
                              key={cell.id}
                              className="px-6 py-4 whitespace-nowrap text-sm"
                            >
                              {flexRender(
                                cell.column.columnDef.cell,
                                cell.getContext()
                              )}
                            </td>
                          ))}
                        </tr>
                      ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Pagination */}
      {tableData.length > 0 && (
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <span className="text-sm text-gray-700 dark:text-gray-300">
              Rows per page:
            </span>
            <select
              className="border border-gray-300 dark:border-gray-600 rounded px-2 py-1 text-sm bg-white dark:bg-gray-800"
              value={table.getState().pagination.pageSize}
              onChange={(e) => {
                table.setPageSize(Number(e.target.value));
              }}
            >
              {[10, 25, 50, 100].map((pageSize) => (
                <option key={pageSize} value={pageSize}>
                  {pageSize}
                </option>
              ))}
            </select>
          </div>
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => table.previousPage()}
              disabled={!table.getCanPreviousPage()}
            >
              Previous
            </Button>
            <span className="text-sm text-gray-700 dark:text-gray-300">
              Page {table.getState().pagination.pageIndex + 1} of{' '}
              {table.getPageCount()}
            </span>
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
      )}

      {/* Delete confirmation dialog */}
      <Dialog
        open={deleteDialog.open}
        onOpenChange={(open) => !open && setDeleteDialog({ open: false })}
      >
        <Dialog.Content>
          <Dialog.Header>
            <Dialog.Title>Delete Relationship</Dialog.Title>
            <Dialog.Description>
              Are you sure you want to delete the relationship &ldquo;
              {deleteDialog.relationship?.name}&rdquo;? This action cannot be
              undone.
            </Dialog.Description>
          </Dialog.Header>
          <Dialog.Footer>
            <Button
              variant="outline"
              onClick={() => setDeleteDialog({ open: false })}
              disabled={deleteMutation.isPending}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteRelationship}
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending ? 'Deleting...' : 'Delete'}
            </Button>
          </Dialog.Footer>
        </Dialog.Content>
      </Dialog>
    </div>
  );
}

export default RelationshipsTable;