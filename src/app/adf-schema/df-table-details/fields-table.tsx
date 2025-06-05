'use client';

import React, { useMemo, useState, useCallback, useRef, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useVirtualizer } from '@tanstack/react-virtual';
import {
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  useReactTable,
  type SortingState,
  type ColumnFiltersState,
  type VisibilityState,
} from '@tanstack/react-table';
import { Search, Plus, Refresh, Eye, Edit, Trash2, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';

import { Button, IconButton } from '@/components/ui/button';
import { Dialog } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { useTableFields } from '@/hooks/use-table-fields';
import { useTableCrud } from '@/hooks/use-table-crud';
import type { TableField, FieldsRow } from '@/types/table-details';

/**
 * Interface for the Fields Table component props
 * Supports controlled mode for integration with parent components
 */
interface FieldsTableProps {
  /**
   * Database service name for API requests
   */
  dbName: string;
  
  /**
   * Table name for schema operations
   */
  tableName: string;
  
  /**
   * Optional initial fields data to display
   */
  initialData?: TableField[];
  
  /**
   * Whether the table is in read-only mode
   */
  readOnly?: boolean;
  
  /**
   * Custom height for the virtualized container
   */
  height?: number;
  
  /**
   * Callback when a field is selected for viewing/editing
   */
  onFieldSelect?: (field: FieldsRow) => void;
  
  /**
   * Additional CSS classes for the container
   */
  className?: string;
  
  /**
   * Test identifier for component testing
   */
  'data-testid'?: string;
}

/**
 * Fields Table Component for Database Schema Management
 * 
 * Displays and manages database schema fields in a virtualized table format
 * optimized for handling large datasets (1,000+ tables) with React Query caching
 * and TanStack Virtual for performance.
 * 
 * Key Features:
 * - TanStack Virtual implementation for performance with large datasets
 * - React Query integration with intelligent caching (50ms cache hits)
 * - CRUD operations: Create, Read, Update, Delete field definitions
 * - Accessibility support with ARIA labels and keyboard navigation
 * - Responsive design with Tailwind CSS styling
 * - Error handling and loading states
 * - Real-time field constraint analysis (primary/foreign keys)
 * 
 * Performance Characteristics:
 * - Supports 1,000+ table schemas per Section 5.2 Component Details
 * - Cache hit responses under 50ms per React/Next.js Integration Requirements
 * - Virtualized rendering for optimal memory usage
 * - Intelligent query invalidation for data synchronization
 * 
 * @example
 * ```tsx
 * <FieldsTable 
 *   dbName="mysql_service"
 *   tableName="users"
 *   height={400}
 *   onFieldSelect={handleFieldSelection}
 * />
 * ```
 */
export const FieldsTable: React.FC<FieldsTableProps> = ({
  dbName,
  tableName,
  initialData,
  readOnly = false,
  height = 600,
  onFieldSelect,
  className,
  'data-testid': dataTestId = 'fields-table',
}) => {
  // Router and navigation hooks
  const router = useRouter();
  const params = useParams();
  
  // State management for table interactions
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});
  const [globalFilter, setGlobalFilter] = useState('');
  const [selectedField, setSelectedField] = useState<FieldsRow | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  
  // Refs for virtualization
  const tableContainerRef = useRef<HTMLDivElement>(null);
  
  // Query client for cache management
  const queryClient = useQueryClient();
  
  // Custom hooks for data fetching and CRUD operations
  const {
    data: fieldsData,
    isLoading,
    isError,
    error,
    refetch,
  } = useTableFields(dbName, tableName, {
    initialData,
    staleTime: 300000, // 5 minutes - per Section 5.2 Component Details
    cacheTime: 900000, // 15 minutes - per Section 5.2 Component Details
    enabled: !!dbName && !!tableName,
  });
  
  const {
    deleteField,
    isDeleting,
  } = useTableCrud(dbName, tableName);
  
  /**
   * Transform raw TableField data into display-ready FieldsRow format
   * Computes constraint labels and accessibility information
   */
  const transformedData = useMemo<FieldsRow[]>(() => {
    if (!fieldsData?.resource) return [];
    
    return fieldsData.resource.map((field: TableField): FieldsRow => ({
      name: field.name,
      alias: field.alias || '',
      type: field.type,
      isVirtual: field.isVirtual,
      isAggregate: field.isAggregate,
      required: field.required,
      constraints: getFieldConstraints(field),
      // Include original field for detailed operations
      _original: field,
    }));
  }, [fieldsData]);
  
  /**
   * Determine field constraint labels for display
   * Prioritizes primary key over foreign key constraints
   */
  const getFieldConstraints = useCallback((field: TableField): string => {
    if (field.isPrimaryKey) {
      return 'Primary Key';
    } else if (field.isForeignKey) {
      return 'Foreign Key';
    } else if (field.isUnique) {
      return 'Unique';
    } else if (field.isIndex) {
      return 'Index';
    }
    return '';
  }, []);
  
  /**
   * Handle field deletion with confirmation and optimistic updates
   */
  const handleDeleteField = useCallback(async (field: FieldsRow) => {
    if (!field.name) return;
    
    try {
      // Show confirmation dialog
      setSelectedField(field);
      setDeleteDialogOpen(true);
    } catch (error) {
      console.error('Error preparing field deletion:', error);
      toast.error('Failed to prepare field deletion');
    }
  }, []);
  
  /**
   * Confirm and execute field deletion
   */
  const confirmDeleteField = useCallback(async () => {
    if (!selectedField?.name) return;
    
    try {
      await deleteField.mutateAsync(selectedField.name);
      
      // Announce success to screen readers
      const announcement = document.createElement('div');
      announcement.setAttribute('aria-live', 'polite');
      announcement.setAttribute('aria-atomic', 'true');
      announcement.className = 'sr-only absolute -top-px -left-px w-px h-px overflow-hidden';
      announcement.textContent = `Field ${selectedField.name} deleted successfully`;
      document.body.appendChild(announcement);
      setTimeout(() => {
        if (document.body.contains(announcement)) {
          document.body.removeChild(announcement);
        }
      }, 1000);
      
      // Invalidate and refetch data
      await queryClient.invalidateQueries({
        queryKey: ['table-fields', dbName, tableName],
      });
      
      toast.success(`Field "${selectedField.name}" deleted successfully`);
      setDeleteDialogOpen(false);
      setSelectedField(null);
      
    } catch (error) {
      console.error('Error deleting field:', error);
      toast.error(`Failed to delete field "${selectedField.name}"`);
    }
  }, [selectedField, deleteField, queryClient, dbName, tableName]);
  
  /**
   * Navigate to field creation page
   */
  const handleCreateField = useCallback(() => {
    if (readOnly) return;
    router.push(`/adf-schema/${dbName}/${tableName}/fields/create`);
  }, [router, dbName, tableName, readOnly]);
  
  /**
   * Navigate to field detail/edit page
   */
  const handleViewField = useCallback((field: FieldsRow) => {
    if (onFieldSelect) {
      onFieldSelect(field);
    } else {
      router.push(`/adf-schema/${dbName}/${tableName}/fields/${field.name}`);
    }
  }, [router, dbName, tableName, onFieldSelect]);
  
  /**
   * Refresh table data with cache invalidation
   */
  const handleRefresh = useCallback(async () => {
    try {
      // Invalidate cache and refetch
      await queryClient.invalidateQueries({
        queryKey: ['table-fields', dbName, tableName],
      });
      await refetch();
      
      toast.success('Field data refreshed successfully');
      
      // Announce to screen readers
      const announcement = document.createElement('div');
      announcement.setAttribute('aria-live', 'polite');
      announcement.setAttribute('aria-atomic', 'true');
      announcement.className = 'sr-only';
      announcement.textContent = 'Table fields refreshed';
      document.body.appendChild(announcement);
      setTimeout(() => document.body.removeChild(announcement), 1000);
      
    } catch (error) {
      console.error('Error refreshing fields:', error);
      toast.error('Failed to refresh field data');
    }
  }, [queryClient, dbName, tableName, refetch]);
  
  // Column definitions with sorting and filtering
  const columnHelper = createColumnHelper<FieldsRow>();
  
  const columns = useMemo(() => [
    columnHelper.accessor('name', {
      header: 'Name',
      cell: ({ getValue, row }) => (
        <button
          onClick={() => handleViewField(row.original)}
          className={cn(
            'text-left font-medium text-primary-600 hover:text-primary-700',
            'focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-1',
            'rounded px-1 py-0.5 transition-colors duration-200',
            'dark:text-primary-400 dark:hover:text-primary-300'
          )}
          aria-label={`View details for field ${getValue()}`}
        >
          {getValue()}
        </button>
      ),
      enableSorting: true,
      enableColumnFilter: true,
    }),
    columnHelper.accessor('alias', {
      header: 'Alias',
      cell: ({ getValue }) => (
        <span className="text-gray-600 dark:text-gray-300">
          {getValue() || '—'}
        </span>
      ),
      enableSorting: true,
      enableColumnFilter: true,
    }),
    columnHelper.accessor('type', {
      header: 'Type',
      cell: ({ getValue }) => (
        <code className={cn(
          'rounded bg-gray-100 px-2 py-1 text-sm font-mono',
          'text-gray-800 dark:bg-gray-800 dark:text-gray-200'
        )}>
          {getValue()}
        </code>
      ),
      enableSorting: true,
      enableColumnFilter: true,
    }),
    columnHelper.accessor('isVirtual', {
      header: 'Virtual',
      cell: ({ getValue }) => (
        <span className={cn(
          'inline-flex items-center rounded-full px-2 py-1 text-xs font-medium',
          getValue()
            ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
            : 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400'
        )}>
          {getValue() ? 'Yes' : 'No'}
        </span>
      ),
      enableSorting: true,
      enableColumnFilter: false,
    }),
    columnHelper.accessor('isAggregate', {
      header: 'Aggregate',
      cell: ({ getValue }) => (
        <span className={cn(
          'inline-flex items-center rounded-full px-2 py-1 text-xs font-medium',
          getValue()
            ? 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200'
            : 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400'
        )}>
          {getValue() ? 'Yes' : 'No'}
        </span>
      ),
      enableSorting: true,
      enableColumnFilter: false,
    }),
    columnHelper.accessor('required', {
      header: 'Required',
      cell: ({ getValue }) => (
        <span className={cn(
          'inline-flex items-center rounded-full px-2 py-1 text-xs font-medium',
          getValue()
            ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
            : 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400'
        )}>
          {getValue() ? 'Yes' : 'No'}
        </span>
      ),
      enableSorting: true,
      enableColumnFilter: false,
    }),
    columnHelper.accessor('constraints', {
      header: 'Constraints',
      cell: ({ getValue }) => {
        const constraints = getValue();
        if (!constraints) return <span className="text-gray-400">—</span>;
        
        const constraintColors = {
          'Primary Key': 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
          'Foreign Key': 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
          'Unique': 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
          'Index': 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200',
        };
        
        return (
          <span className={cn(
            'inline-flex items-center rounded-full px-2 py-1 text-xs font-medium',
            constraintColors[constraints as keyof typeof constraintColors] || 'bg-gray-100 text-gray-600'
          )}>
            {constraints}
          </span>
        );
      },
      enableSorting: true,
      enableColumnFilter: true,
    }),
    columnHelper.display({
      id: 'actions',
      header: 'Actions',
      cell: ({ row }) => (
        <div className="flex items-center space-x-2">
          <IconButton
            icon={<Eye className="h-4 w-4" />}
            ariaLabel={`View field ${row.original.name}`}
            variant="ghost"
            size="sm"
            onClick={() => handleViewField(row.original)}
            className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
          />
          {!readOnly && (
            <>
              <IconButton
                icon={<Edit className="h-4 w-4" />}
                ariaLabel={`Edit field ${row.original.name}`}
                variant="ghost"
                size="sm"
                onClick={() => router.push(`/adf-schema/${dbName}/${tableName}/fields/${row.original.name}/edit`)}
                className="text-blue-500 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-200"
              />
              <IconButton
                icon={<Trash2 className="h-4 w-4" />}
                ariaLabel={`Delete field ${row.original.name}`}
                variant="ghost"
                size="sm"
                onClick={() => handleDeleteField(row.original)}
                className="text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-200"
              />
            </>
          )}
        </div>
      ),
      enableSorting: false,
      enableColumnFilter: false,
    }),
  ], [columnHelper, handleViewField, handleDeleteField, router, dbName, tableName, readOnly]);
  
  // React Table instance
  const table = useReactTable({
    data: transformedData,
    columns,
    state: {
      sorting,
      columnFilters,
      columnVisibility,
      globalFilter,
    },
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onColumnVisibilityChange: setColumnVisibility,
    onGlobalFilterChange: setGlobalFilter,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
  });
  
  // Virtualization for performance
  const { rows } = table.getRowModel();
  
  const rowVirtualizer = useVirtualizer({
    count: rows.length,
    getScrollElement: () => tableContainerRef.current,
    estimateSize: () => 60, // Estimated row height in pixels
    overscan: 10, // Render extra rows for smooth scrolling
  });
  
  // Error state rendering
  if (isError) {
    return (
      <div 
        className={cn(
          'flex flex-col items-center justify-center p-8 text-center',
          'border-2 border-dashed border-gray-300 rounded-lg',
          'dark:border-gray-600',
          className
        )}
        data-testid={`${dataTestId}-error`}
      >
        <AlertCircle className="h-12 w-12 text-red-500 mb-4" />
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
          Failed to Load Fields
        </h3>
        <p className="text-gray-600 dark:text-gray-400 mb-4">
          {error instanceof Error ? error.message : 'An unexpected error occurred while loading table fields.'}
        </p>
        <Button
          onClick={handleRefresh}
          variant="outline"
          className="min-w-24"
        >
          <Refresh className="h-4 w-4 mr-2" />
          Retry
        </Button>
      </div>
    );
  }
  
  return (
    <>
      <div 
        className={cn(
          'flex flex-col space-y-4 bg-white dark:bg-gray-900',
          'border border-gray-200 dark:border-gray-700 rounded-lg',
          className
        )}
        data-testid={dataTestId}
      >
        {/* Action Bar */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center space-x-2">
            {!readOnly && (
              <Button
                onClick={handleCreateField}
                size="sm"
                className="min-w-24"
                aria-label="Create new field"
              >
                <Plus className="h-4 w-4 mr-2" />
                New Field
              </Button>
            )}
            <Button
              onClick={handleRefresh}
              variant="outline"
              size="sm"
              disabled={isLoading}
              aria-label="Refresh field data"
            >
              <Refresh className={cn('h-4 w-4 mr-2', isLoading && 'animate-spin')} />
              Refresh
            </Button>
          </div>
          
          <div className="flex items-center space-x-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <Input
                placeholder="Search fields..."
                value={globalFilter}
                onChange={(e) => setGlobalFilter(e.target.value)}
                className="pl-10 w-64"
                aria-label="Search table fields"
              />
            </div>
            <span className="text-sm text-gray-500 dark:text-gray-400">
              {transformedData.length} field{transformedData.length !== 1 ? 's' : ''}
            </span>
          </div>
        </div>
        
        {/* Table Container with Virtualization */}
        <div
          ref={tableContainerRef}
          className="relative overflow-auto"
          style={{ height }}
          role="region"
          aria-label="Table fields data"
          aria-busy={isLoading}
        >
          {/* Loading Overlay */}
          {isLoading && (
            <div className="absolute inset-0 z-10 flex items-center justify-center bg-white/80 dark:bg-gray-900/80">
              <div className="flex items-center space-x-3">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary-600"></div>
                <span className="text-sm text-gray-600 dark:text-gray-400">Loading fields...</span>
              </div>
            </div>
          )}
          
          {/* Table Header */}
          <div className="sticky top-0 z-10 bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
            {table.getHeaderGroups().map((headerGroup) => (
              <div key={headerGroup.id} className="flex">
                {headerGroup.headers.map((header) => (
                  <div
                    key={header.id}
                    className={cn(
                      'flex items-center px-4 py-3 text-left text-xs font-medium',
                      'text-gray-500 dark:text-gray-400 uppercase tracking-wider',
                      'border-r border-gray-200 dark:border-gray-700 last:border-r-0',
                      header.column.getCanSort() && 'cursor-pointer select-none hover:bg-gray-100 dark:hover:bg-gray-700'
                    )}
                    style={{ 
                      width: header.getSize() === 150 ? 'auto' : header.getSize(),
                      minWidth: header.id === 'actions' ? '120px' : '100px',
                      flex: header.id === 'name' ? '1 1 200px' : '0 0 auto'
                    }}
                    onClick={header.column.getToggleSortingHandler()}
                    role={header.column.getCanSort() ? 'button' : undefined}
                    tabIndex={header.column.getCanSort() ? 0 : undefined}
                    aria-sort={
                      header.column.getCanSort()
                        ? header.column.getIsSorted() === 'asc'
                          ? 'ascending'
                          : header.column.getIsSorted() === 'desc'
                          ? 'descending'
                          : 'none'
                        : undefined
                    }
                    onKeyDown={(e) => {
                      if (header.column.getCanSort() && (e.key === 'Enter' || e.key === ' ')) {
                        e.preventDefault();
                        header.column.toggleSorting();
                      }
                    }}
                  >
                    {flexRender(header.column.columnDef.header, header.getContext())}
                    {header.column.getCanSort() && (
                      <span className="ml-2">
                        {header.column.getIsSorted() === 'asc' ? '↑' : 
                         header.column.getIsSorted() === 'desc' ? '↓' : '↕'}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            ))}
          </div>
          
          {/* Virtualized Table Body */}
          <div
            style={{
              height: `${rowVirtualizer.getTotalSize()}px`,
              width: '100%',
              position: 'relative',
            }}
          >
            {rowVirtualizer.getVirtualItems().map((virtualRow) => {
              const row = rows[virtualRow.index];
              return (
                <div
                  key={row.id}
                  className={cn(
                    'absolute top-0 left-0 w-full flex',
                    'border-b border-gray-200 dark:border-gray-700',
                    'hover:bg-gray-50 dark:hover:bg-gray-800',
                    'transition-colors duration-150'
                  )}
                  style={{
                    height: `${virtualRow.size}px`,
                    transform: `translateY(${virtualRow.start}px)`,
                  }}
                  role="row"
                  aria-rowindex={virtualRow.index + 1}
                >
                  {row.getVisibleCells().map((cell) => (
                    <div
                      key={cell.id}
                      className={cn(
                        'flex items-center px-4 py-3',
                        'border-r border-gray-200 dark:border-gray-700 last:border-r-0'
                      )}
                      style={{
                        width: cell.column.getSize() === 150 ? 'auto' : cell.column.getSize(),
                        minWidth: cell.column.id === 'actions' ? '120px' : '100px',
                        flex: cell.column.id === 'name' ? '1 1 200px' : '0 0 auto'
                      }}
                      role="cell"
                    >
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </div>
                  ))}
                </div>
              );
            })}
          </div>
          
          {/* Empty State */}
          {!isLoading && transformedData.length === 0 && (
            <div className="flex flex-col items-center justify-center p-12 text-center">
              <div className="rounded-full bg-gray-100 dark:bg-gray-800 p-3 mb-4">
                <Search className="h-6 w-6 text-gray-400" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
                No fields found
              </h3>
              <p className="text-gray-500 dark:text-gray-400 mb-4">
                {globalFilter ? 'No fields match your search criteria.' : 'This table has no field definitions yet.'}
              </p>
              {!readOnly && !globalFilter && (
                <Button onClick={handleCreateField} size="sm">
                  <Plus className="h-4 w-4 mr-2" />
                  Create First Field
                </Button>
              )}
            </div>
          )}
        </div>
      </div>
      
      {/* Delete Confirmation Dialog */}
      <Dialog
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
        aria-labelledby="delete-field-title"
        aria-describedby="delete-field-description"
      >
        <Dialog.Header>
          <Dialog.Title id="delete-field-title">
            Delete Field
          </Dialog.Title>
        </Dialog.Header>
        
        <Dialog.Content>
          <Dialog.Description id="delete-field-description">
            Are you sure you want to delete the field "{selectedField?.name}"? 
            This action cannot be undone and will permanently remove the field 
            definition from the table schema.
          </Dialog.Description>
        </Dialog.Content>
        
        <Dialog.Footer align="right">
          <Button
            variant="outline"
            onClick={() => setDeleteDialogOpen(false)}
            disabled={isDeleting}
          >
            Cancel
          </Button>
          <Button
            variant="error"
            onClick={confirmDeleteField}
            loading={isDeleting}
            loadingText="Deleting field..."
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Delete Field
          </Button>
        </Dialog.Footer>
      </Dialog>
    </>
  );
};

export default FieldsTable;

// Export types for external usage
export type { FieldsTableProps, FieldsRow };