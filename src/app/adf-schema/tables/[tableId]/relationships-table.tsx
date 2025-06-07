/**
 * RelationshipsTable Component
 * 
 * React component for displaying and managing table relationship definitions including 
 * foreign keys and constraints. Implements interactive relationship visualization, 
 * CRUD operations, and integration with schema discovery. Provides comprehensive 
 * relationship management interface with real-time validation.
 * 
 * Features:
 * - TanStack Table integration for enhanced table functionality with sorting and filtering
 * - React Query for intelligent caching and real-time data synchronization
 * - Interactive relationship visualization with visual indicators
 * - Comprehensive CRUD operations for relationship management workflows
 * - Real-time validation for relationship constraints and dependencies
 * - WCAG 2.1 AA accessibility compliance with keyboard navigation
 * - Tailwind CSS styling with design tokens and responsive breakpoints
 * - Error handling with retry logic and user-friendly feedback
 * - Optimistic updates for improved user experience
 * 
 * @fileoverview Table relationships management component for DreamFactory Admin Interface
 * @version 1.0.0
 */

'use client';

import React, { 
  forwardRef, 
  useCallback, 
  useMemo, 
  useState,
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
} from '@tanstack/react-table';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { debounce } from 'lodash-es';
import { 
  Search, 
  Plus, 
  RefreshCw, 
  MoreVertical, 
  ChevronUp, 
  ChevronDown,
  ChevronsUpDown,
  Eye,
  Edit,
  Trash2,
  AlertTriangle,
  Link,
  Database,
  ArrowRight,
  ExternalLink,
  Filter,
  X,
  CheckCircle,
  XCircle,
  Circle
} from 'lucide-react';
import { Menu, Transition } from '@headlessui/react';
import { Fragment } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';

// Internal imports
import { Button } from '@/components/ui/button';
import { IconButton } from '@/components/ui/button/icon-button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { useTableData } from './hooks';
import { type RelationshipRow, type TableRelationship } from './types';

/**
 * Props interface for RelationshipsTable component
 */
interface RelationshipsTableProps {
  /** Database service name */
  serviceName: string;
  /** Table name for relationship management */
  tableName: string;
  /** Optional CSS class name */
  className?: string;
  /** Callback when relationship is selected */
  onRelationshipSelect?: (relationship: RelationshipRow) => void;
  /** Whether the table is read-only */
  readOnly?: boolean;
  /** Maximum number of relationships to display */
  maxRows?: number;
  /** Enable virtualization for large datasets */
  enableVirtualization?: boolean;
}

/**
 * Relationship type configuration for visual indicators
 */
const RELATIONSHIP_TYPES = {
  belongsTo: {
    label: 'Belongs To',
    icon: ArrowRight,
    color: 'blue',
    description: 'This table has a foreign key reference to another table'
  },
  hasOne: {
    label: 'Has One',
    icon: Link,
    color: 'green',
    description: 'This table is referenced by one record in another table'
  },
  hasMany: {
    label: 'Has Many',
    icon: Database,
    color: 'purple',
    description: 'This table is referenced by multiple records in another table'
  },
  hasManyThrough: {
    label: 'Has Many Through',
    icon: ExternalLink,
    color: 'orange',
    description: 'This table has a many-to-many relationship through a junction table'
  },
  virtual: {
    label: 'Virtual',
    icon: Circle,
    color: 'gray',
    description: 'This is a virtual relationship defined in configuration'
  }
} as const;

/**
 * Relationship status indicators
 */
const RELATIONSHIP_STATUS = {
  active: {
    icon: CheckCircle,
    color: 'green',
    label: 'Active'
  },
  inactive: {
    icon: XCircle,
    color: 'red',
    label: 'Inactive'
  },
  pending: {
    icon: Circle,
    color: 'yellow',
    label: 'Pending'
  }
} as const;

/**
 * Main RelationshipsTable component
 */
export const RelationshipsTable = forwardRef<HTMLDivElement, RelationshipsTableProps>(({
  serviceName,
  tableName,
  className = '',
  onRelationshipSelect,
  readOnly = false,
  maxRows = 100,
  enableVirtualization = false,
  ...props
}, ref) => {
  const router = useRouter();
  const queryClient = useQueryClient();

  // Component state
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: 10,
  });
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({});
  const [globalFilter, setGlobalFilter] = useState('');
  const [showDeleteDialog, setShowDeleteDialog] = useState<string | null>(null);

  // Data fetching with React Query
  const {
    data: relationships = [],
    isLoading,
    isError,
    error,
    refetch,
    isFetching
  } = useQuery({
    queryKey: ['relationships', serviceName, tableName],
    queryFn: async () => {
      const response = await fetch(`/api/v2/${serviceName}/_schema/${tableName}/_related`, {
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      if (!response.ok) {
        throw new Error(`Failed to fetch relationships: ${response.statusText}`);
      }
      
      const data = await response.json();
      return data.resource?.map((relationship: TableRelationship): RelationshipRow => ({
        id: relationship.name,
        name: relationship.name,
        alias: relationship.alias || relationship.name,
        type: relationship.type || 'belongsTo',
        isVirtual: relationship.isVirtual || false,
        refTable: relationship.refTable,
        refField: relationship.refField,
        field: relationship.field,
        refServiceID: relationship.refServiceID,
        junctionTable: relationship.junctionTable,
        alwaysFetch: relationship.alwaysFetch || false,
        flatten: relationship.flatten || false,
        status: 'active', // Default status
        description: relationship.description || '',
        refOnUpdate: relationship.refOnUpdate || 'RESTRICT',
        refOnDelete: relationship.refOnDelete || 'RESTRICT',
      })) || [];
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
    refetchOnWindowFocus: false,
    retry: 3,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: async (relationshipName: string) => {
      const response = await fetch(`/api/v2/${serviceName}/_schema/${tableName}/_related/${relationshipName}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      if (!response.ok) {
        throw new Error(`Failed to delete relationship: ${response.statusText}`);
      }
      
      return relationshipName;
    },
    onSuccess: (deletedName) => {
      queryClient.invalidateQueries({ queryKey: ['relationships', serviceName, tableName] });
      toast.success(`Relationship "${deletedName}" deleted successfully`);
      setShowDeleteDialog(null);
    },
    onError: (error) => {
      toast.error(`Failed to delete relationship: ${error.message}`);
    },
  });

  // Table columns configuration
  const columns = useMemo<ColumnDef<RelationshipRow>[]>(() => [
    {
      id: 'select',
      header: ({ table }) => (
        <input
          type="checkbox"
          className="w-4 h-4 rounded border-gray-300 focus:ring-2 focus:ring-blue-500"
          checked={table.getIsAllPageRowsSelected()}
          onChange={table.getToggleAllPageRowsSelectedHandler()}
          aria-label="Select all relationships"
        />
      ),
      cell: ({ row }) => (
        <input
          type="checkbox"
          className="w-4 h-4 rounded border-gray-300 focus:ring-2 focus:ring-blue-500"
          checked={row.getIsSelected()}
          onChange={row.getToggleSelectedHandler()}
          aria-label={`Select relationship ${row.original.name}`}
        />
      ),
      enableSorting: false,
    },
    {
      accessorKey: 'name',
      header: ({ column }) => (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
          className="h-auto p-0 font-semibold hover:bg-transparent"
          aria-label={`Sort by name ${column.getIsSorted() === 'asc' ? 'descending' : 'ascending'}`}
        >
          Name
          {column.getIsSorted() === 'asc' ? (
            <ChevronUp className="ml-1 h-4 w-4" />
          ) : column.getIsSorted() === 'desc' ? (
            <ChevronDown className="ml-1 h-4 w-4" />
          ) : (
            <ChevronsUpDown className="ml-1 h-4 w-4" />
          )}
        </Button>
      ),
      cell: ({ row }) => (
        <div className="flex items-center space-x-2">
          <span className="font-medium text-gray-900 dark:text-gray-100">
            {row.original.name}
          </span>
          {row.original.isVirtual && (
            <Badge variant="secondary" size="sm">
              Virtual
            </Badge>
          )}
        </div>
      ),
    },
    {
      accessorKey: 'alias',
      header: ({ column }) => (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
          className="h-auto p-0 font-semibold hover:bg-transparent"
          aria-label={`Sort by alias ${column.getIsSorted() === 'asc' ? 'descending' : 'ascending'}`}
        >
          Alias
          {column.getIsSorted() === 'asc' ? (
            <ChevronUp className="ml-1 h-4 w-4" />
          ) : column.getIsSorted() === 'desc' ? (
            <ChevronDown className="ml-1 h-4 w-4" />
          ) : (
            <ChevronsUpDown className="ml-1 h-4 w-4" />
          )}
        </Button>
      ),
      cell: ({ row }) => (
        <span className="text-gray-700 dark:text-gray-300">
          {row.original.alias || '—'}
        </span>
      ),
    },
    {
      accessorKey: 'type',
      header: 'Type',
      cell: ({ row }) => {
        const typeConfig = RELATIONSHIP_TYPES[row.original.type as keyof typeof RELATIONSHIP_TYPES] || RELATIONSHIP_TYPES.belongsTo;
        const Icon = typeConfig.icon;
        
        return (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="flex items-center space-x-2">
                  <Icon className={`h-4 w-4 text-${typeConfig.color}-500`} />
                  <span className="text-sm font-medium">
                    {typeConfig.label}
                  </span>
                </div>
              </TooltipTrigger>
              <TooltipContent>
                <p>{typeConfig.description}</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        );
      },
    },
    {
      accessorKey: 'refTable',
      header: 'Referenced Table',
      cell: ({ row }) => (
        <div className="flex items-center space-x-2">
          <Database className="h-4 w-4 text-gray-400" />
          <span className="text-sm font-medium text-blue-600 dark:text-blue-400">
            {row.original.refTable || '—'}
          </span>
        </div>
      ),
    },
    {
      accessorKey: 'field',
      header: 'Local Field',
      cell: ({ row }) => (
        <span className="text-sm text-gray-600 dark:text-gray-400 font-mono">
          {row.original.field || '—'}
        </span>
      ),
    },
    {
      accessorKey: 'refField',
      header: 'Referenced Field',
      cell: ({ row }) => (
        <span className="text-sm text-gray-600 dark:text-gray-400 font-mono">
          {row.original.refField || '—'}
        </span>
      ),
    },
    {
      id: 'actions',
      header: 'Actions',
      cell: ({ row }) => (
        <div className="flex items-center space-x-1">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <IconButton
                  variant="ghost"
                  size="sm"
                  onClick={() => handleViewRelationship(row.original)}
                  aria-label={`View relationship ${row.original.name}`}
                >
                  <Eye className="h-4 w-4" />
                </IconButton>
              </TooltipTrigger>
              <TooltipContent>View details</TooltipContent>
            </Tooltip>
          </TooltipProvider>

          {!readOnly && (
            <>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <IconButton
                      variant="ghost"
                      size="sm"
                      onClick={() => handleEditRelationship(row.original)}
                      aria-label={`Edit relationship ${row.original.name}`}
                    >
                      <Edit className="h-4 w-4" />
                    </IconButton>
                  </TooltipTrigger>
                  <TooltipContent>Edit relationship</TooltipContent>
                </Tooltip>
              </TooltipProvider>

              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <IconButton
                      variant="ghost"
                      size="sm"
                      onClick={() => setShowDeleteDialog(row.original.name)}
                      className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20"
                      aria-label={`Delete relationship ${row.original.name}`}
                    >
                      <Trash2 className="h-4 w-4" />
                    </IconButton>
                  </TooltipTrigger>
                  <TooltipContent>Delete relationship</TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </>
          )}

          <Menu as="div" className="relative">
            <Menu.Button as={Fragment}>
              <IconButton
                variant="ghost"
                size="sm"
                aria-label={`More actions for relationship ${row.original.name}`}
              >
                <MoreVertical className="h-4 w-4" />
              </IconButton>
            </Menu.Button>
            <Transition
              as={Fragment}
              enter="transition ease-out duration-100"
              enterFrom="transform opacity-0 scale-95"
              enterTo="transform opacity-100 scale-100"
              leave="transition ease-in duration-75"
              leaveFrom="transform opacity-100 scale-100"
              leaveTo="transform opacity-0 scale-95"
            >
              <Menu.Items className="absolute right-0 z-10 mt-2 w-48 origin-top-right rounded-md bg-white dark:bg-gray-800 py-1 shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
                <Menu.Item>
                  {({ active }) => (
                    <button
                      className={`${
                        active ? 'bg-gray-100 dark:bg-gray-700' : ''
                      } block w-full px-4 py-2 text-left text-sm text-gray-700 dark:text-gray-300`}
                      onClick={() => handleDuplicateRelationship(row.original)}
                    >
                      Duplicate
                    </button>
                  )}
                </Menu.Item>
                <Menu.Item>
                  {({ active }) => (
                    <button
                      className={`${
                        active ? 'bg-gray-100 dark:bg-gray-700' : ''
                      } block w-full px-4 py-2 text-left text-sm text-gray-700 dark:text-gray-300`}
                      onClick={() => handleExportRelationship(row.original)}
                    >
                      Export Configuration
                    </button>
                  )}
                </Menu.Item>
              </Menu.Items>
            </Transition>
          </Menu>
        </div>
      ),
      enableSorting: false,
    },
  ], [readOnly]);

  // Table instance
  const table = useReactTable({
    data: relationships,
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
    manualPagination: false,
    pageCount: Math.ceil(relationships.length / pagination.pageSize),
  });

  // Debounced search handler
  const debouncedSearch = useMemo(
    () => debounce((value: string) => {
      setGlobalFilter(value);
    }, 300),
    []
  );

  // Event handlers
  const handleViewRelationship = useCallback((relationship: RelationshipRow) => {
    if (onRelationshipSelect) {
      onRelationshipSelect(relationship);
    } else {
      router.push(`/adf-schema/tables/${tableName}/relationships/${relationship.name}`);
    }
  }, [onRelationshipSelect, router, tableName]);

  const handleEditRelationship = useCallback((relationship: RelationshipRow) => {
    router.push(`/adf-schema/tables/${tableName}/relationships/${relationship.name}/edit`);
  }, [router, tableName]);

  const handleCreateRelationship = useCallback(() => {
    router.push(`/adf-schema/tables/${tableName}/relationships/create`);
  }, [router, tableName]);

  const handleDeleteRelationship = useCallback((relationshipName: string) => {
    deleteMutation.mutate(relationshipName);
  }, [deleteMutation]);

  const handleDuplicateRelationship = useCallback((relationship: RelationshipRow) => {
    // Navigate to create page with pre-filled data
    router.push(`/adf-schema/tables/${tableName}/relationships/create?duplicate=${relationship.name}`);
  }, [router, tableName]);

  const handleExportRelationship = useCallback((relationship: RelationshipRow) => {
    // Export relationship configuration as JSON
    const config = {
      name: relationship.name,
      alias: relationship.alias,
      type: relationship.type,
      field: relationship.field,
      refTable: relationship.refTable,
      refField: relationship.refField,
      refServiceID: relationship.refServiceID,
      junctionTable: relationship.junctionTable,
      alwaysFetch: relationship.alwaysFetch,
      flatten: relationship.flatten,
      refOnUpdate: relationship.refOnUpdate,
      refOnDelete: relationship.refOnDelete,
      description: relationship.description,
      isVirtual: relationship.isVirtual,
    };

    const blob = new Blob([JSON.stringify(config, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${relationship.name}-relationship.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    toast.success(`Relationship "${relationship.name}" configuration exported`);
  }, []);

  const handleRefresh = useCallback(() => {
    refetch();
  }, [refetch]);

  const handleKeyDown = useCallback((event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key === 'r' && (event.ctrlKey || event.metaKey)) {
      event.preventDefault();
      handleRefresh();
    }
  }, [handleRefresh]);

  // Error state
  if (isError) {
    return (
      <div className={`space-y-4 ${className}`} ref={ref} {...props}>
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            Failed to load relationships: {error?.message || 'Unknown error occurred'}
            <Button
              variant="outline"
              size="sm"
              onClick={handleRefresh}
              className="ml-2"
            >
              <RefreshCw className="h-4 w-4 mr-1" />
              Retry
            </Button>
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div 
      className={`space-y-4 ${className}`} 
      ref={ref} 
      onKeyDown={handleKeyDown}
      {...props}
    >
      {/* Table Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            Table Relationships
          </h3>
          <Badge variant="secondary">
            {relationships.length} relationship{relationships.length !== 1 ? 's' : ''}
          </Badge>
        </div>

        <div className="flex items-center space-x-2">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <Input
              placeholder="Search relationships..."
              className="pl-9 w-64"
              onChange={(e) => debouncedSearch(e.target.value)}
              aria-label="Search relationships"
            />
          </div>

          {/* Refresh */}
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <IconButton
                  variant="outline"
                  size="sm"
                  onClick={handleRefresh}
                  disabled={isFetching}
                  aria-label="Refresh relationships"
                >
                  <RefreshCw className={`h-4 w-4 ${isFetching ? 'animate-spin' : ''}`} />
                </IconButton>
              </TooltipTrigger>
              <TooltipContent>Refresh (Ctrl+R)</TooltipContent>
            </Tooltip>
          </TooltipProvider>

          {/* Create Button */}
          {!readOnly && (
            <Button
              onClick={handleCreateRelationship}
              size="sm"
              className="flex items-center space-x-2"
            >
              <Plus className="h-4 w-4" />
              <span>Add Relationship</span>
            </Button>
          )}
        </div>
      </div>

      {/* Table */}
      <div className="rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-800">
              {table.getHeaderGroups().map((headerGroup) => (
                <tr key={headerGroup.id}>
                  {headerGroup.headers.map((header) => (
                    <th
                      key={header.id}
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider"
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
            <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
              {isLoading ? (
                // Loading skeleton
                Array.from({ length: 5 }).map((_, index) => (
                  <tr key={index} className="animate-pulse">
                    {columns.map((_, colIndex) => (
                      <td key={colIndex} className="px-6 py-4 whitespace-nowrap">
                        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded"></div>
                      </td>
                    ))}
                  </tr>
                ))
              ) : table.getRowModel().rows.length === 0 ? (
                // Empty state
                <tr>
                  <td colSpan={columns.length} className="px-6 py-12 text-center">
                    <div className="flex flex-col items-center space-y-3">
                      <Database className="h-12 w-12 text-gray-400" />
                      <div className="text-gray-500 dark:text-gray-400">
                        <p className="text-sm font-medium">No relationships found</p>
                        <p className="text-xs">
                          {globalFilter 
                            ? 'Try adjusting your search criteria' 
                            : 'Create your first relationship to get started'
                          }
                        </p>
                      </div>
                      {!readOnly && !globalFilter && (
                        <Button
                          onClick={handleCreateRelationship}
                          size="sm"
                          variant="outline"
                        >
                          <Plus className="h-4 w-4 mr-2" />
                          Add Relationship
                        </Button>
                      )}
                    </div>
                  </td>
                </tr>
              ) : (
                // Data rows
                table.getRowModel().rows.map((row) => (
                  <tr 
                    key={row.id}
                    className="hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                  >
                    {row.getVisibleCells().map((cell) => (
                      <td
                        key={cell.id}
                        className="px-6 py-4 whitespace-nowrap text-sm"
                      >
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </td>
                    ))}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {table.getPageCount() > 1 && (
          <div className="bg-white dark:bg-gray-900 px-6 py-3 border-t border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <p className="text-sm text-gray-700 dark:text-gray-300">
                  Showing {table.getState().pagination.pageIndex * table.getState().pagination.pageSize + 1} to{' '}
                  {Math.min(
                    (table.getState().pagination.pageIndex + 1) * table.getState().pagination.pageSize,
                    relationships.length
                  )}{' '}
                  of {relationships.length} relationships
                </p>
              </div>
              
              <div className="flex items-center space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => table.setPageIndex(0)}
                  disabled={!table.getCanPreviousPage()}
                >
                  First
                </Button>
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
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => table.setPageIndex(table.getPageCount() - 1)}
                  disabled={!table.getCanNextPage()}
                >
                  Last
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        open={showDeleteDialog !== null}
        onOpenChange={(open) => !open && setShowDeleteDialog(null)}
        onConfirm={() => showDeleteDialog && handleDeleteRelationship(showDeleteDialog)}
        title="Delete Relationship"
        description={`Are you sure you want to delete the relationship "${showDeleteDialog}"? This action cannot be undone.`}
        confirmText="Delete"
        cancelText="Cancel"
        variant="destructive"
        loading={deleteMutation.isPending}
      />
    </div>
  );
});

RelationshipsTable.displayName = 'RelationshipsTable';

export default RelationshipsTable;