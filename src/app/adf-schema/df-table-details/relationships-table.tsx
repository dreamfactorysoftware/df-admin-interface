'use client'

import React, { useMemo, useState, useCallback } from 'react'
import { useParams, useRouter, useSearchParams } from 'next/navigation'
import { useVirtualizer } from '@tanstack/react-virtual'
import {
  useReactTable,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  type ColumnDef,
  type SortingState,
  type ColumnFiltersState,
  type PaginationState,
} from '@tanstack/react-table'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Button } from '@/components/ui/button'
import { Dialog } from '@/components/ui/dialog'
import { useTableRelationships } from '@/hooks/use-table-relationships'
import { useTableCrud } from '@/hooks/use-table-crud'
import { RelationshipsRow, TableRelated } from '@/types/table-details'
import { apiClient } from '@/lib/api-client'

/**
 * RelationshipsTable Component
 * 
 * React component for displaying and managing table relationships using TanStack Table
 * with virtual scrolling for optimal performance with 1,000+ tables. Provides CRUD 
 * functionality including navigation to detail views, creation workflows, and deletion
 * with optimistic updates via React Query.
 * 
 * Features:
 * - TanStack Virtual for performance optimization per Section 5.2 Component Details
 * - React Query for intelligent caching with cache hit responses under 50ms
 * - Tailwind CSS 4.1+ styling with consistent theme injection
 * - Optimistic updates and real-time synchronization
 * - Next.js navigation for relationship detail views
 */
interface RelationshipsTableProps {
  /** Database name from route parameters */
  dbName?: string
  /** Table name from route data */
  tableName?: string
  /** Custom className for styling overrides */
  className?: string
  /** Enable compact mode for smaller screens */
  compact?: boolean
}

export function RelationshipsTable({ 
  dbName: propDbName, 
  tableName: propTableName,
  className = '',
  compact = false 
}: RelationshipsTableProps) {
  const router = useRouter()
  const params = useParams()
  const searchParams = useSearchParams()
  const queryClient = useQueryClient()
  
  // Extract route parameters with fallbacks
  const dbName = propDbName || (params?.name as string) || ''
  const tableName = propTableName || (params?.tableName as string) || ''
  
  // Table state management
  const [sorting, setSorting] = useState<SortingState>([])
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([])
  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: 25,
  })
  const [globalFilter, setGlobalFilter] = useState('')
  const [selectedRows, setSelectedRows] = useState<Record<string, boolean>>({})
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [relationshipToDelete, setRelationshipToDelete] = useState<RelationshipsRow | null>(null)

  // Data fetching with React Query for intelligent caching
  const {
    data: relationshipsData,
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery({
    queryKey: ['table-relationships', dbName, tableName],
    queryFn: async () => {
      const response = await apiClient.get(`${dbName}/_schema/${tableName}/_related`)
      return response
    },
    enabled: !!(dbName && tableName),
    staleTime: 300000, // 5 minutes per Section 5.2 Component Details
    cacheTime: 900000, // 15 minutes per Section 5.2 Component Details
    retry: 2,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
  })

  // Delete mutation with optimistic updates
  const deleteMutation = useMutation({
    mutationFn: async (relationshipName: string) => {
      const response = await apiClient.delete(
        `${dbName}/_schema/${tableName}/_related/${relationshipName}`
      )
      return response
    },
    onMutate: async (relationshipName) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({
        queryKey: ['table-relationships', dbName, tableName],
      })

      // Snapshot the previous value
      const previousData = queryClient.getQueryData([
        'table-relationships',
        dbName,
        tableName,
      ])

      // Optimistically update to the new value
      queryClient.setQueryData(
        ['table-relationships', dbName, tableName],
        (old: any) => {
          if (!old?.resource) return old
          return {
            ...old,
            resource: old.resource.filter(
              (item: TableRelated) => item.name !== relationshipName
            ),
          }
        }
      )

      return { previousData }
    },
    onError: (err, relationshipName, context) => {
      // If the mutation fails, use the context returned from onMutate to roll back
      if (context?.previousData) {
        queryClient.setQueryData(
          ['table-relationships', dbName, tableName],
          context.previousData
        )
      }
    },
    onSettled: () => {
      // Always refetch after error or success
      queryClient.invalidateQueries({
        queryKey: ['table-relationships', dbName, tableName],
      })
    },
  })

  // Transform data from API format to table format
  const tableData: RelationshipsRow[] = useMemo(() => {
    if (!relationshipsData?.resource) return []
    
    return relationshipsData.resource.map((relationship: TableRelated) => ({
      name: relationship.name,
      alias: relationship.alias || '',
      type: relationship.type,
      isVirtual: relationship.isVirtual,
    }))
  }, [relationshipsData])

  // Define table columns with accessibility and internationalization
  const columns = useMemo<ColumnDef<RelationshipsRow>[]>(
    () => [
      {
        accessorKey: 'name',
        header: 'Name',
        cell: ({ row }) => (
          <button
            onClick={() => handleViewRelationship(row.original)}
            className="text-left font-medium text-primary-600 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800"
            aria-label={`View relationship ${row.original.name}`}
          >
            {row.original.name}
          </button>
        ),
        enableSorting: true,
        enableColumnFilter: true,
      },
      {
        accessorKey: 'alias',
        header: 'Alias',
        cell: ({ row }) => (
          <span className="text-gray-600 dark:text-gray-300">
            {row.original.alias || '-'}
          </span>
        ),
        enableSorting: true,
        enableColumnFilter: true,
      },
      {
        accessorKey: 'type',
        header: 'Type',
        cell: ({ row }) => (
          <span className="inline-flex items-center px-2 py-1 text-xs font-medium rounded-full bg-primary-100 text-primary-700 dark:bg-primary-900 dark:text-primary-300">
            {row.original.type}
          </span>
        ),
        enableSorting: true,
        enableColumnFilter: true,
      },
      {
        accessorKey: 'isVirtual',
        header: 'Virtual',
        cell: ({ row }) => (
          <span
            className={`inline-flex items-center px-2 py-1 text-xs font-medium rounded-full ${
              row.original.isVirtual
                ? 'bg-success-100 text-success-700 dark:bg-success-900 dark:text-success-300'
                : 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300'
            }`}
          >
            {row.original.isVirtual ? 'Yes' : 'No'}
          </span>
        ),
        enableSorting: true,
        enableColumnFilter: false,
      },
      {
        id: 'actions',
        header: 'Actions',
        cell: ({ row }) => (
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleViewRelationship(row.original)}
              className="text-primary-600 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300"
              aria-label={`View relationship ${row.original.name}`}
            >
              View
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleDeleteRelationship(row.original)}
              className="text-error-600 hover:text-error-700 dark:text-error-400 dark:hover:text-error-300"
              aria-label={`Delete relationship ${row.original.name}`}
            >
              Delete
            </Button>
          </div>
        ),
        enableSorting: false,
        enableColumnFilter: false,
        size: 120,
      },
    ],
    []
  )

  // Initialize React Table with TanStack features
  const table = useReactTable({
    data: tableData,
    columns,
    state: {
      sorting,
      columnFilters,
      pagination,
      globalFilter,
    },
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onPaginationChange: setPagination,
    onGlobalFilterChange: setGlobalFilter,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    debugTable: process.env.NODE_ENV === 'development',
  })

  // Navigation handlers using Next.js router
  const handleViewRelationship = useCallback(
    (relationship: RelationshipsRow) => {
      router.push(
        `/adf-schema/df-table-details/${dbName}/${tableName}/relationships/${relationship.name}`
      )
    },
    [router, dbName, tableName]
  )

  const handleCreateRelationship = useCallback(() => {
    router.push(
      `/adf-schema/df-table-details/${dbName}/${tableName}/relationships/create`
    )
  }, [router, dbName, tableName])

  // Delete handlers with confirmation dialog
  const handleDeleteRelationship = useCallback((relationship: RelationshipsRow) => {
    setRelationshipToDelete(relationship)
    setDeleteDialogOpen(true)
  }, [])

  const confirmDelete = useCallback(async () => {
    if (!relationshipToDelete) return

    try {
      await deleteMutation.mutateAsync(relationshipToDelete.name)
      setDeleteDialogOpen(false)
      setRelationshipToDelete(null)
    } catch (error) {
      console.error('Failed to delete relationship:', error)
      // Error handling is managed by the mutation's onError callback
    }
  }, [relationshipToDelete, deleteMutation])

  // Virtual scrolling setup for performance with 1,000+ tables
  const { rows } = table.getRowModel()
  const parentRef = React.useRef<HTMLDivElement>(null)
  
  const virtualizer = useVirtualizer({
    count: rows.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => (compact ? 40 : 56), // Responsive row height
    overscan: 10, // Render 10 extra items for smooth scrolling
  })

  // Loading state
  if (isLoading) {
    return (
      <div className={`space-y-4 ${className}`}>
        <div className="flex justify-between items-center">
          <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded animate-pulse w-48" />
          <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded animate-pulse w-32" />
        </div>
        <div className="space-y-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <div
              key={i}
              className="h-14 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"
            />
          ))}
        </div>
      </div>
    )
  }

  // Error state
  if (isError) {
    return (
      <div className={`text-center py-8 ${className}`}>
        <div className="text-error-600 dark:text-error-400 mb-4">
          Failed to load relationships: {(error as Error)?.message}
        </div>
        <Button onClick={() => refetch()} variant="outline">
          Retry
        </Button>
      </div>
    )
  }

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Header with search and create button */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
          Table Relationships
        </h3>
        <div className="flex gap-2 items-center">
          <input
            type="text"
            placeholder="Search relationships..."
            value={globalFilter ?? ''}
            onChange={(e) => setGlobalFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            aria-label="Search relationships"
          />
          <Button
            onClick={handleCreateRelationship}
            className="bg-primary-600 hover:bg-primary-700 text-white"
          >
            Create Relationship
          </Button>
        </div>
      </div>

      {/* Table container with virtual scrolling */}
      <div className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden bg-white dark:bg-gray-800">
        {/* Table header */}
        <div className="grid grid-cols-5 gap-4 px-4 py-3 bg-gray-50 dark:bg-gray-700 border-b border-gray-200 dark:border-gray-600 text-sm font-medium text-gray-700 dark:text-gray-300">
          {table.getHeaderGroups().map((headerGroup) =>
            headerGroup.headers.map((header) => (
              <div
                key={header.id}
                className={`flex items-center ${
                  header.column.getCanSort() ? 'cursor-pointer select-none' : ''
                }`}
                onClick={header.column.getToggleSortingHandler()}
              >
                {header.isPlaceholder ? null : (
                  <span className="flex items-center gap-1">
                    {typeof header.column.columnDef.header === 'string'
                      ? header.column.columnDef.header
                      : null}
                    {header.column.getCanSort() && (
                      <span className="text-xs">
                        {{
                          asc: '↑',
                          desc: '↓',
                        }[header.column.getIsSorted() as string] ?? '↕️'}
                      </span>
                    )}
                  </span>
                )}
              </div>
            ))
          )}
        </div>

        {/* Virtual scrollable content */}
        <div
          ref={parentRef}
          className="h-96 overflow-auto"
          style={{ contain: 'strict' }}
        >
          <div
            style={{
              height: `${virtualizer.getTotalSize()}px`,
              width: '100%',
              position: 'relative',
            }}
          >
            {virtualizer.getVirtualItems().map((virtualRow) => {
              const row = rows[virtualRow.index]
              return (
                <div
                  key={row.id}
                  style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: '100%',
                    height: `${virtualRow.size}px`,
                    transform: `translateY(${virtualRow.start}px)`,
                  }}
                  className="grid grid-cols-5 gap-4 px-4 py-3 border-b border-gray-100 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 items-center"
                >
                  {row.getVisibleCells().map((cell) => (
                    <div
                      key={cell.id}
                      className="text-sm text-gray-900 dark:text-gray-100"
                    >
                      {typeof cell.column.columnDef.cell === 'function'
                        ? cell.column.columnDef.cell(cell.getContext())
                        : cell.getValue() as React.ReactNode}
                    </div>
                  ))}
                </div>
              )
            })}
          </div>
        </div>

        {/* Empty state */}
        {tableData.length === 0 && (
          <div className="text-center py-8 text-gray-500 dark:text-gray-400">
            <p>No relationships found for this table.</p>
            <Button
              onClick={handleCreateRelationship}
              variant="outline"
              className="mt-4"
            >
              Create First Relationship
            </Button>
          </div>
        )}
      </div>

      {/* Pagination */}
      {tableData.length > 0 && (
        <div className="flex items-center justify-between">
          <div className="text-sm text-gray-700 dark:text-gray-300">
            Showing {table.getState().pagination.pageIndex * table.getState().pagination.pageSize + 1} to{' '}
            {Math.min(
              (table.getState().pagination.pageIndex + 1) * table.getState().pagination.pageSize,
              table.getFilteredRowModel().rows.length
            )}{' '}
            of {table.getFilteredRowModel().rows.length} relationships
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
      )}

      {/* Delete confirmation dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg max-w-md w-full p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
              Delete Relationship
            </h3>
            <p className="text-gray-600 dark:text-gray-300 mb-6">
              Are you sure you want to delete the relationship &ldquo;
              {relationshipToDelete?.name}&rdquo;? This action cannot be undone.
            </p>
            <div className="flex gap-3 justify-end">
              <Button
                variant="outline"
                onClick={() => setDeleteDialogOpen(false)}
                disabled={deleteMutation.isPending}
              >
                Cancel
              </Button>
              <Button
                onClick={confirmDelete}
                disabled={deleteMutation.isPending}
                className="bg-error-600 hover:bg-error-700 text-white"
              >
                {deleteMutation.isPending ? 'Deleting...' : 'Delete'}
              </Button>
            </div>
          </div>
        </div>
      </Dialog>
    </div>
  )
}

export default RelationshipsTable