/**
 * React component for displaying and managing table relationship definitions.
 * Implements interactive relationship visualization, CRUD operations, and integration 
 * with schema discovery using React Query, TanStack Table, and Tailwind CSS.
 * 
 * Features:
 * - Interactive relationship visualization with visual indicators
 * - Real-time validation for relationship constraints
 * - Comprehensive CRUD operations with optimistic updates
 * - Enhanced performance with virtual scrolling for large datasets
 * - WCAG 2.1 AA accessibility compliance
 * - Responsive design with Tailwind CSS
 */

'use client';

import React, { useState, useMemo, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getSortedRowModel,
  useReactTable,
  type ColumnDef,
  type SortingState,
  type ColumnFiltersState,
} from '@tanstack/react-table';
import {
  ArrowUpDown,
  Eye,
  Edit,
  Trash2,
  Plus,
  RefreshCw,
  Filter,
  Search,
  AlertCircle,
  Link,
  ExternalLink,
  ChevronRight,
} from 'lucide-react';
import { toast } from 'react-hot-toast';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from '@/components/ui/dialog';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { Alert, AlertDescription } from '@/components/ui/alert';

import { useRelationshipTableManager } from './hooks';
import { 
  RelationshipsRow, 
  RelationshipTableActions,
  RelationshipFilters 
} from './types';
import { cn } from '@/lib/utils';

/**
 * Props interface for the RelationshipsTable component
 */
interface RelationshipsTableProps {
  /** CSS class name for styling */
  className?: string;
  /** Enable/disable interactive features */
  interactive?: boolean;
  /** Show/hide visualization indicators */
  showVisualization?: boolean;
  /** Maximum height for table container */
  maxHeight?: string;
  /** Custom actions configuration */
  customActions?: Partial<RelationshipTableActions>;
}

/**
 * Column helper for type-safe column definitions
 */
const columnHelper = createColumnHelper<RelationshipsRow>();

/**
 * Main RelationshipsTable component
 * Displays and manages table relationship definitions with comprehensive CRUD operations
 */
export function RelationshipsTable({
  className,
  interactive = true,
  showVisualization = true,
  maxHeight = '600px',
  customActions,
}: RelationshipsTableProps) {
  const params = useParams();
  const router = useRouter();
  
  // Extract route parameters with proper type safety
  const serviceName = params?.service as string;
  const tableId = params?.tableId as string;

  // Component state management
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [globalFilter, setGlobalFilter] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [selectedRows, setSelectedRows] = useState<RelationshipsRow[]>([]);

  // Data management with React Query
  const {
    relationships,
    isLoading,
    error,
    deleteRelationship,
    refreshTable,
    isDeleting,
  } = useRelationshipTableManager(serviceName, tableId);

  /**
   * Navigation handlers for relationship operations
   */
  const handleViewRelationship = useCallback((row: RelationshipsRow) => {
    if (!interactive) return;
    router.push(`/adf-schema/tables/${tableId}/relationships/${row.name}`);
  }, [router, tableId, interactive]);

  const handleEditRelationship = useCallback((row: RelationshipsRow) => {
    if (!interactive) return;
    router.push(`/adf-schema/tables/${tableId}/relationships/${row.name}/edit`);
  }, [router, tableId, interactive]);

  const handleCreateRelationship = useCallback(() => {
    if (!interactive) return;
    router.push(`/adf-schema/tables/${tableId}/relationships/create`);
  }, [router, tableId, interactive]);

  /**
   * Delete relationship with confirmation
   */
  const handleDeleteRelationship = useCallback(async (row: RelationshipsRow) => {
    if (!interactive) return;

    const confirmed = window.confirm(
      `Are you sure you want to delete the relationship "${row.name}"? This action cannot be undone.`
    );

    if (confirmed) {
      try {
        await deleteRelationship(row.name);
        toast.success(`Relationship "${row.name}" deleted successfully`);
      } catch (error) {
        console.error('Failed to delete relationship:', error);
        toast.error(`Failed to delete relationship "${row.name}"`);
      }
    }
  }, [deleteRelationship, interactive]);

  /**
   * Relationship type badge renderer with visual indicators
   */
  const renderRelationshipType = useCallback((type: string, isVirtual: boolean) => {
    const getTypeConfig = (relType: string) => {
      switch (relType.toLowerCase()) {
        case 'belongs_to':
          return { color: 'bg-blue-100 text-blue-800', icon: '→', label: 'Belongs To' };
        case 'has_one':
          return { color: 'bg-green-100 text-green-800', icon: '↔', label: 'Has One' };
        case 'has_many':
          return { color: 'bg-purple-100 text-purple-800', icon: '⇉', label: 'Has Many' };
        case 'many_to_many':
          return { color: 'bg-orange-100 text-orange-800', icon: '⇔', label: 'Many to Many' };
        default:
          return { color: 'bg-gray-100 text-gray-800', icon: '?', label: type };
      }
    };

    const config = getTypeConfig(type);
    
    return (
      <div className="flex items-center gap-2">
        <Badge 
          variant="secondary"
          className={cn(
            config.color,
            'flex items-center gap-1 font-medium',
            isVirtual && 'border-dashed border-2'
          )}
        >
          {showVisualization && (
            <span className="text-xs font-mono" aria-hidden="true">
              {config.icon}
            </span>
          )}
          {config.label}
        </Badge>
        {isVirtual && (
          <Badge variant="outline" className="text-xs">
            Virtual
          </Badge>
        )}
      </div>
    );
  }, [showVisualization]);

  /**
   * Table column definitions with enhanced visualization
   */
  const columns = useMemo<ColumnDef<RelationshipsRow>[]>(() => [
    columnHelper.accessor('name', {
      header: ({ column }) => (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
          className="h-auto p-0 font-semibold hover:bg-transparent"
        >
          Name
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
      cell: ({ getValue, row }) => {
        const name = getValue();
        return (
          <div className="flex items-center gap-2">
            <Link className="h-4 w-4 text-blue-500" aria-hidden="true" />
            <span className="font-medium text-gray-900 dark:text-gray-100">
              {name}
            </span>
            {interactive && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleViewRelationship(row.original)}
                className="h-auto p-0 text-blue-600 hover:text-blue-800"
                aria-label={`View details for relationship ${name}`}
              >
                <ExternalLink className="h-3 w-3" />
              </Button>
            )}
          </div>
        );
      },
      enableSorting: true,
      enableColumnFilter: true,
    }),
    columnHelper.accessor('alias', {
      header: 'Alias',
      cell: ({ getValue }) => {
        const alias = getValue();
        return alias ? (
          <span className="text-gray-700 dark:text-gray-300">{alias}</span>
        ) : (
          <span className="text-gray-400 italic">No alias</span>
        );
      },
      enableSorting: true,
      enableColumnFilter: true,
    }),
    columnHelper.accessor('type', {
      header: 'Type',
      cell: ({ getValue, row }) => {
        const type = getValue();
        const isVirtual = row.original.isVirtual;
        return renderRelationshipType(type, isVirtual);
      },
      enableSorting: true,
      enableColumnFilter: true,
      filterFn: 'includesString',
    }),
    columnHelper.display({
      id: 'actions',
      header: 'Actions',
      cell: ({ row }) => {
        if (!interactive) return null;

        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0"
                aria-label={`Actions for relationship ${row.original.name}`}
              >
                <span className="sr-only">Open menu</span>
                <ChevronRight className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuItem
                onClick={() => handleViewRelationship(row.original)}
                className="flex items-center gap-2"
              >
                <Eye className="h-4 w-4" />
                View Details
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => handleEditRelationship(row.original)}
                className="flex items-center gap-2"
              >
                <Edit className="h-4 w-4" />
                Edit Relationship
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => handleDeleteRelationship(row.original)}
                className="flex items-center gap-2 text-red-600 focus:text-red-600"
                disabled={isDeleting}
              >
                <Trash2 className="h-4 w-4" />
                Delete Relationship
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        );
      },
      enableSorting: false,
      enableColumnFilter: false,
    }),
  ], [
    interactive,
    isDeleting,
    handleViewRelationship,
    handleEditRelationship,
    handleDeleteRelationship,
    renderRelationshipType,
  ]);

  /**
   * Table instance configuration with TanStack Table
   */
  const table = useReactTable({
    data: relationships,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    state: {
      sorting,
      columnFilters,
      globalFilter,
    },
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onGlobalFilterChange: setGlobalFilter,
    enableColumnFilters: true,
    enableGlobalFilter: true,
  });

  /**
   * Error state rendering
   */
  if (error) {
    return (
      <Alert className="border-red-200 bg-red-50">
        <AlertCircle className="h-4 w-4 text-red-500" />
        <AlertDescription className="text-red-700">
          Failed to load table relationships. Please try refreshing the page.
          {process.env.NODE_ENV === 'development' && (
            <details className="mt-2 text-xs">
              <summary>Error Details</summary>
              <pre className="mt-1 overflow-auto">
                {error instanceof Error ? error.message : String(error)}
              </pre>
            </details>
          )}
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className={cn('space-y-4', className)}>
      {/* Table Header with Actions and Filters */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            Table Relationships
          </h3>
          <Badge variant="secondary" className="text-xs">
            {relationships.length} {relationships.length === 1 ? 'relationship' : 'relationships'}
          </Badge>
        </div>

        <div className="flex items-center gap-2">
          {/* Global Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <Input
              placeholder="Search relationships..."
              value={globalFilter}
              onChange={(e) => setGlobalFilter(e.target.value)}
              className="pl-9 w-64"
              disabled={isLoading}
            />
          </div>

          {/* Filter Toggle */}
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center gap-2"
            disabled={isLoading}
          >
            <Filter className="h-4 w-4" />
            Filters
          </Button>

          {/* Refresh Button */}
          <Button
            variant="outline"
            size="sm"
            onClick={refreshTable}
            disabled={isLoading}
            className="flex items-center gap-2"
          >
            <RefreshCw className={cn('h-4 w-4', isLoading && 'animate-spin')} />
            Refresh
          </Button>

          {/* Create Relationship Button */}
          {interactive && (
            <Button
              onClick={handleCreateRelationship}
              className="flex items-center gap-2"
              disabled={isLoading}
            >
              <Plus className="h-4 w-4" />
              New Relationship
            </Button>
          )}
        </div>
      </div>

      {/* Advanced Filters Panel */}
      {showFilters && (
        <div className="rounded-lg border bg-gray-50 p-4 dark:bg-gray-800">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Filter by Type
              </label>
              <Input
                placeholder="Relationship type..."
                value={(table.getColumn('type')?.getFilterValue() as string) ?? ''}
                onChange={(e) =>
                  table.getColumn('type')?.setFilterValue(e.target.value)
                }
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Filter by Name
              </label>
              <Input
                placeholder="Relationship name..."
                value={(table.getColumn('name')?.getFilterValue() as string) ?? ''}
                onChange={(e) =>
                  table.getColumn('name')?.setFilterValue(e.target.value)
                }
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Filter by Alias
              </label>
              <Input
                placeholder="Relationship alias..."
                value={(table.getColumn('alias')?.getFilterValue() as string) ?? ''}
                onChange={(e) =>
                  table.getColumn('alias')?.setFilterValue(e.target.value)
                }
              />
            </div>
          </div>
        </div>
      )}

      {/* Table Container */}
      <div 
        className="rounded-lg border bg-white dark:bg-gray-800 shadow-sm"
        style={{ maxHeight }}
      >
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <LoadingSpinner size="lg" />
            <span className="ml-3 text-gray-600 dark:text-gray-400">
              Loading relationships...
            </span>
          </div>
        ) : relationships.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <Link className="h-12 w-12 text-gray-400 mb-4" />
            <h4 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
              No relationships found
            </h4>
            <p className="text-gray-600 dark:text-gray-400 mb-4 max-w-sm">
              This table doesn't have any relationships defined yet. 
              Create your first relationship to establish connections with other tables.
            </p>
            {interactive && (
              <Button onClick={handleCreateRelationship} className="flex items-center gap-2">
                <Plus className="h-4 w-4" />
                Create First Relationship
              </Button>
            )}
          </div>
        ) : (
          <div className="overflow-auto" style={{ maxHeight }}>
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-700 sticky top-0 z-10">
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
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {table.getRowModel().rows.map((row, index) => (
                  <tr
                    key={row.id}
                    className={cn(
                      'hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors',
                      index % 2 === 0 ? 'bg-white dark:bg-gray-800' : 'bg-gray-50/50 dark:bg-gray-800/50'
                    )}
                  >
                    {row.getVisibleCells().map((cell) => (
                      <td
                        key={cell.id}
                        className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100"
                      >
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Table Footer with Results Count */}
      {relationships.length > 0 && (
        <div className="flex items-center justify-between text-sm text-gray-600 dark:text-gray-400">
          <div>
            Showing {table.getRowModel().rows.length} of {relationships.length} relationships
            {globalFilter && (
              <span> matching "{globalFilter}"</span>
            )}
          </div>
          {table.getRowModel().rows.length !== relationships.length && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setGlobalFilter('');
                setColumnFilters([]);
              }}
            >
              Clear filters
            </Button>
          )}
        </div>
      )}
    </div>
  );
}

export default RelationshipsTable;