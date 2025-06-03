'use client';

/**
 * @fileoverview React component for displaying and managing table field definitions in a tabular format.
 * Implements TanStack Table for virtualization of large datasets, supports CRUD operations on fields,
 * and provides filtering and sorting capabilities. Replaces Angular DfFieldsTableComponent with modern React patterns.
 * 
 * @version 1.0.0
 * @created 2024-12-28
 * 
 * Key Features:
 * - TanStack Virtual implementation for databases with 1,000+ fields
 * - React Query caching with TTL configuration for optimal performance  
 * - Tailwind CSS styling for consistent table design
 * - WCAG 2.1 AA compliance for table accessibility
 * - CRUD operations for field management workflows
 */

import React, { useState, useMemo, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  useReactTable,
  getCoreRowModel,
  getFilteredRowModel,
  getSortedRowModel,
  createColumnHelper,
  flexRender,
  type ColumnDef,
  type SortingState,
  type ColumnFiltersState,
  type VisibilityState,
} from '@tanstack/react-table';
import { useVirtualizer } from '@tanstack/react-virtual';
import { 
  ChevronUpIcon, 
  ChevronDownIcon,
  PlusIcon,
  PencilIcon,
  TrashIcon,
  EyeIcon,
  FunnelIcon,
  MagnifyingGlassIcon,
  ArrowPathIcon,
  DocumentDuplicateIcon,
} from '@heroicons/react/24/outline';
import { CheckIcon, XMarkIcon } from '@heroicons/react/24/solid';

import { useFieldTableManager } from './hooks';
import { 
  FieldTableRow, 
  FieldFilters, 
  FieldTableActions,
  FieldTableConfig,
} from './types';

// UI Components (assuming these exist based on the folder structure)
// import { Button } from '@/components/ui/button';
// import { Input } from '@/components/ui/input';
// import { Badge } from '@/components/ui/badge';

/**
 * Temporary UI components placeholders
 * These should be replaced with actual UI components from @/components/ui
 */
const Button = ({ children, onClick, variant = 'default', size = 'sm', disabled = false, className = '', ...props }: any) => (
  <button
    onClick={onClick}
    disabled={disabled}
    className={`
      inline-flex items-center justify-center rounded-md font-medium transition-colors
      focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2
      disabled:pointer-events-none disabled:opacity-50
      ${size === 'sm' ? 'h-8 px-3 text-xs' : 'h-9 px-4 py-2 text-sm'}
      ${variant === 'outline' ? 'border border-input bg-background hover:bg-accent hover:text-accent-foreground' : ''}
      ${variant === 'ghost' ? 'hover:bg-accent hover:text-accent-foreground' : ''}
      ${variant === 'destructive' ? 'bg-red-500 text-white hover:bg-red-600' : ''}
      ${variant === 'default' ? 'bg-primary text-primary-foreground hover:bg-primary/90' : ''}
      ${className}
    `}
    {...props}
  >
    {children}
  </button>
);

const Input = ({ placeholder, value, onChange, className = '', ...props }: any) => (
  <input
    type="text"
    placeholder={placeholder}
    value={value}
    onChange={onChange}
    className={`
      flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm
      ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium
      placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2
      focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50
      ${className}
    `}
    {...props}
  />
);

const Badge = ({ children, variant = 'default', className = '' }: any) => (
  <span className={`
    inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium
    ${variant === 'secondary' ? 'bg-secondary text-secondary-foreground' : ''}
    ${variant === 'destructive' ? 'bg-red-100 text-red-800' : ''}
    ${variant === 'success' ? 'bg-green-100 text-green-800' : ''}
    ${variant === 'warning' ? 'bg-yellow-100 text-yellow-800' : ''}
    ${variant === 'default' ? 'bg-primary/10 text-primary' : ''}
    ${className}
  `}>
    {children}
  </span>
);

/**
 * Props interface for the FieldsTable component
 */
interface FieldsTableProps {
  /** Optional service name override */
  serviceName?: string;
  /** Optional table name override */
  tableName?: string;
  /** Table configuration */
  config?: Partial<FieldTableConfig>;
  /** Custom actions configuration */
  actions?: Partial<FieldTableActions>;
  /** Height for virtualization container */
  height?: number;
  /** Custom CSS classes */
  className?: string;
}

/**
 * Default table configuration optimized for field management
 */
const defaultConfig: FieldTableConfig = {
  enableVirtualization: true,
  pageSize: 50,
  enableSorting: true,
  enableFiltering: true,
  enableColumnResizing: true,
  enableRowSelection: false,
  estimateSize: 50,
  overscan: 10,
};

/**
 * FieldsTable component for displaying and managing table field definitions
 * 
 * @param props - Component configuration props
 * @returns React component for field table management
 */
export function FieldsTable({
  serviceName: serviceNameProp,
  tableName: tableNameProp,
  config = {},
  actions = {},
  height = 600,
  className = '',
}: FieldsTableProps) {
  // Next.js routing
  const params = useParams();
  const router = useRouter();
  
  // Extract service and table names from params or props
  const serviceName = serviceNameProp || (params?.service as string);
  const tableName = tableNameProp || (params?.tableId as string);
  
  // Merge configuration with defaults
  const tableConfig = useMemo(() => ({ ...defaultConfig, ...config }), [config]);
  
  // Field management hooks
  const {
    fields,
    isLoading,
    error,
    deleteField,
    refreshTable,
    isDeleting,
  } = useFieldTableManager(serviceName, tableName);

  // Table state
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});
  const [globalFilter, setGlobalFilter] = useState('');

  // Filter state
  const [filters, setFilters] = useState<FieldFilters>({});
  const [showFilters, setShowFilters] = useState(false);

  // Column helper for type safety
  const columnHelper = createColumnHelper<FieldTableRow>();

  /**
   * Field type badge component with appropriate styling
   */
  const FieldTypeBadge = ({ type }: { type: string }) => {
    const getVariant = (fieldType: string) => {
      switch (fieldType.toLowerCase()) {
        case 'integer':
        case 'bigint':
        case 'smallint':
        case 'decimal':
        case 'float':
        case 'double':
          return 'default';
        case 'string':
        case 'text':
        case 'varchar':
          return 'secondary';
        case 'boolean':
          return 'success';
        case 'date':
        case 'datetime':
        case 'timestamp':
          return 'warning';
        default:
          return 'secondary';
      }
    };

    return <Badge variant={getVariant(type)}>{type}</Badge>;
  };

  /**
   * Constraints badge component showing field constraints
   */
  const ConstraintsBadge = ({ constraints }: { constraints: string }) => {
    if (!constraints) return null;
    
    const constraintList = constraints.split(', ').filter(Boolean);
    
    return (
      <div className="flex flex-wrap gap-1">
        {constraintList.map((constraint, index) => {
          const getConstraintVariant = (c: string) => {
            switch (c) {
              case 'PK':
                return 'destructive';
              case 'FK':
                return 'warning';
              case 'UNIQUE':
                return 'success';
              case 'NOT NULL':
                return 'default';
              case 'AUTO_INCREMENT':
                return 'secondary';
              default:
                return 'secondary';
            }
          };

          return (
            <Badge 
              key={index} 
              variant={getConstraintVariant(constraint)}
              className="text-xs"
            >
              {constraint}
            </Badge>
          );
        })}
      </div>
    );
  };

  /**
   * Action handlers for field operations
   */
  const defaultActions: FieldTableActions = {
    view: {
      enabled: true,
      handler: (row) => {
        router.push(`/adf-schema/fields/${row.name}`);
      },
    },
    edit: {
      enabled: true,
      handler: (row) => {
        router.push(`/adf-schema/fields/${row.name}/edit`);
      },
    },
    delete: {
      enabled: true,
      handler: async (row) => {
        if (window.confirm(`Are you sure you want to delete field '${row.name}'?`)) {
          deleteField(row.name);
        }
      },
    },
    create: {
      enabled: true,
      handler: () => {
        router.push('/adf-schema/fields/new');
      },
    },
    clone: {
      enabled: true,
      handler: (row) => {
        router.push(`/adf-schema/fields/new?clone=${row.name}`);
      },
    },
  };

  // Merge actions with defaults
  const resolvedActions = useMemo(() => ({
    ...defaultActions,
    ...actions,
  }), [actions]);

  /**
   * Table column definitions with proper typing and accessibility
   */
  const columns = useMemo<ColumnDef<FieldTableRow>[]>(() => [
    columnHelper.accessor('name', {
      id: 'name',
      header: ({ column }) => (
        <button
          className="flex items-center gap-2 font-medium text-left hover:text-primary"
          onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
          aria-label={`Sort by name ${column.getIsSorted() === 'asc' ? 'descending' : 'ascending'}`}
        >
          Name
          {column.getIsSorted() === 'asc' && <ChevronUpIcon className="h-4 w-4" />}
          {column.getIsSorted() === 'desc' && <ChevronDownIcon className="h-4 w-4" />}
        </button>
      ),
      cell: ({ row }) => (
        <div className="flex flex-col">
          <span className="font-medium text-sm">{row.original.name}</span>
          {row.original.alias && row.original.alias !== row.original.name && (
            <span className="text-xs text-muted-foreground">Alias: {row.original.alias}</span>
          )}
        </div>
      ),
      enableSorting: true,
      enableColumnFilter: true,
      minSize: 150,
    }),
    
    columnHelper.accessor('label', {
      id: 'label',
      header: 'Label',
      cell: ({ getValue, row }) => (
        <div className="flex flex-col">
          <span className="text-sm">{getValue()}</span>
          {row.original.description && (
            <span className="text-xs text-muted-foreground" title={row.original.description}>
              {row.original.description.length > 50 
                ? `${row.original.description.substring(0, 50)}...`
                : row.original.description
              }
            </span>
          )}
        </div>
      ),
      enableSorting: true,
      enableColumnFilter: true,
      minSize: 120,
    }),

    columnHelper.accessor('type', {
      id: 'type',
      header: ({ column }) => (
        <button
          className="flex items-center gap-2 font-medium text-left hover:text-primary"
          onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
          aria-label={`Sort by type ${column.getIsSorted() === 'asc' ? 'descending' : 'ascending'}`}
        >
          Type
          {column.getIsSorted() === 'asc' && <ChevronUpIcon className="h-4 w-4" />}
          {column.getIsSorted() === 'desc' && <ChevronDownIcon className="h-4 w-4" />}
        </button>
      ),
      cell: ({ getValue, row }) => (
        <div className="flex flex-col gap-1">
          <FieldTypeBadge type={getValue()} />
          {row.original.dbType && row.original.dbType !== getValue() && (
            <span className="text-xs text-muted-foreground">DB: {row.original.dbType}</span>
          )}
          {row.original.length && (
            <span className="text-xs text-muted-foreground">Length: {row.original.length}</span>
          )}
        </div>
      ),
      enableSorting: true,
      enableColumnFilter: true,
      filterFn: 'includesString',
      minSize: 120,
    }),

    columnHelper.accessor('constraints', {
      id: 'constraints',
      header: 'Constraints',
      cell: ({ getValue }) => <ConstraintsBadge constraints={getValue()} />,
      enableSorting: false,
      enableColumnFilter: false,
      minSize: 150,
    }),

    columnHelper.accessor('default', {
      id: 'default',
      header: 'Default',
      cell: ({ getValue }) => {
        const value = getValue();
        if (value === null || value === undefined) return <span className="text-muted-foreground">—</span>;
        return <span className="text-sm font-mono">{String(value)}</span>;
      },
      enableSorting: true,
      enableColumnFilter: false,
      minSize: 100,
    }),

    columnHelper.display({
      id: 'flags',
      header: 'Flags',
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          {row.original.isVirtual && (
            <Badge variant="secondary" className="text-xs">Virtual</Badge>
          )}
          {row.original.required && (
            <Badge variant="destructive" className="text-xs">Required</Badge>
          )}
        </div>
      ),
      enableSorting: false,
      enableColumnFilter: false,
      minSize: 100,
    }),

    columnHelper.display({
      id: 'actions',
      header: 'Actions',
      cell: ({ row }) => (
        <div className="flex items-center gap-1">
          {resolvedActions.view.enabled && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => resolvedActions.view.handler(row.original)}
              aria-label={`View field ${row.original.name}`}
              title="View field details"
            >
              <EyeIcon className="h-4 w-4" />
            </Button>
          )}
          {resolvedActions.edit.enabled && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => resolvedActions.edit.handler(row.original)}
              aria-label={`Edit field ${row.original.name}`}
              title="Edit field"
            >
              <PencilIcon className="h-4 w-4" />
            </Button>
          )}
          {resolvedActions.clone.enabled && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => resolvedActions.clone.handler(row.original)}
              aria-label={`Clone field ${row.original.name}`}
              title="Clone field"
            >
              <DocumentDuplicateIcon className="h-4 w-4" />
            </Button>
          )}
          {resolvedActions.delete.enabled && !row.original.isPrimaryKey && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => resolvedActions.delete.handler(row.original)}
              disabled={isDeleting}
              aria-label={`Delete field ${row.original.name}`}
              title="Delete field"
              className="text-red-600 hover:text-red-700 hover:bg-red-50"
            >
              <TrashIcon className="h-4 w-4" />
            </Button>
          )}
        </div>
      ),
      enableSorting: false,
      enableColumnFilter: false,
      size: 120,
    }),
  ], [columnHelper, resolvedActions, isDeleting]);

  /**
   * Filter fields based on active filters
   */
  const filteredFields = useMemo(() => {
    let filtered = fields;

    if (filters.virtualOnly) {
      filtered = filtered.filter(field => field.isVirtual);
    }

    if (filters.requiredOnly) {
      filtered = filtered.filter(field => field.required);
    }

    if (filters.primaryKeyOnly) {
      filtered = filtered.filter(field => field.isPrimaryKey);
    }

    if (filters.foreignKeyOnly) {
      filtered = filtered.filter(field => field.isForeignKey);
    }

    if (filters.type) {
      filtered = filtered.filter(field => 
        field.type.toLowerCase().includes(filters.type!.toLowerCase())
      );
    }

    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      filtered = filtered.filter(field =>
        field.name.toLowerCase().includes(searchLower) ||
        field.alias.toLowerCase().includes(searchLower) ||
        field.label.toLowerCase().includes(searchLower) ||
        (field.description && field.description.toLowerCase().includes(searchLower))
      );
    }

    return filtered;
  }, [fields, filters]);

  /**
   * Table instance with TanStack Table
   */
  const table = useReactTable({
    data: filteredFields,
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
    getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel: getSortedRowModel(),
    enableColumnResizing: tableConfig.enableColumnResizing,
    columnResizeMode: 'onChange',
  });

  /**
   * Virtual table setup for large datasets
   */
  const { rows } = table.getRowModel();
  const parentRef = React.useRef<HTMLDivElement>(null);

  const virtualizer = useVirtualizer({
    count: rows.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => tableConfig.estimateSize,
    overscan: tableConfig.overscan,
    enabled: tableConfig.enableVirtualization && rows.length > 50,
  });

  /**
   * Handle filter changes
   */
  const handleFilterChange = useCallback((key: keyof FieldFilters, value: any) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  }, []);

  /**
   * Clear all filters
   */
  const clearFilters = useCallback(() => {
    setFilters({});
    setGlobalFilter('');
    setColumnFilters([]);
  }, []);

  // Loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="flex items-center gap-2 text-muted-foreground">
          <ArrowPathIcon className="h-5 w-5 animate-spin" />
          Loading fields...
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="flex flex-col items-center justify-center p-8 text-center">
        <div className="text-red-600 mb-4">
          <XMarkIcon className="h-8 w-8 mx-auto mb-2" />
          <h3 className="text-lg font-semibold">Failed to load fields</h3>
          <p className="text-sm text-muted-foreground">
            {error instanceof Error ? error.message : 'An unexpected error occurred'}
          </p>
        </div>
        <Button onClick={refreshTable} variant="outline">
          <ArrowPathIcon className="h-4 w-4 mr-2" />
          Try Again
        </Button>
      </div>
    );
  }

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Header with actions and search */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2">
          <h2 className="text-lg font-semibold">
            Fields ({filteredFields.length})
          </h2>
          {resolvedActions.create.enabled && (
            <Button onClick={resolvedActions.create.handler} size="sm">
              <PlusIcon className="h-4 w-4 mr-2" />
              Add Field
            </Button>
          )}
        </div>

        <div className="flex items-center gap-2">
          <div className="relative">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search fields..."
              value={filters.search || ''}
              onChange={(e) => handleFilterChange('search', e.target.value)}
              className="pl-9 w-64"
            />
          </div>
          
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowFilters(!showFilters)}
            aria-label="Toggle filters"
          >
            <FunnelIcon className="h-4 w-4" />
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={refreshTable}
            disabled={isLoading}
            aria-label="Refresh table"
          >
            <ArrowPathIcon className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </div>

      {/* Filter panel */}
      {showFilters && (
        <div className="bg-muted/50 p-4 rounded-lg border">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Field Type</label>
              <Input
                placeholder="Filter by type..."
                value={filters.type || ''}
                onChange={(e) => handleFilterChange('type', e.target.value)}
              />
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium">Field Properties</label>
              <div className="space-y-1">
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={filters.virtualOnly || false}
                    onChange={(e) => handleFilterChange('virtualOnly', e.target.checked || undefined)}
                    className="rounded border-gray-300"
                  />
                  Virtual only
                </label>
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={filters.requiredOnly || false}
                    onChange={(e) => handleFilterChange('requiredOnly', e.target.checked || undefined)}
                    className="rounded border-gray-300"
                  />
                  Required only
                </label>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Key Fields</label>
              <div className="space-y-1">
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={filters.primaryKeyOnly || false}
                    onChange={(e) => handleFilterChange('primaryKeyOnly', e.target.checked || undefined)}
                    className="rounded border-gray-300"
                  />
                  Primary keys only
                </label>
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={filters.foreignKeyOnly || false}
                    onChange={(e) => handleFilterChange('foreignKeyOnly', e.target.checked || undefined)}
                    className="rounded border-gray-300"
                  />
                  Foreign keys only
                </label>
              </div>
            </div>

            <div className="flex items-end">
              <Button
                variant="outline"
                size="sm"
                onClick={clearFilters}
                className="w-full"
              >
                Clear Filters
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Table */}
      <div className="rounded-md border">
        {tableConfig.enableVirtualization && rows.length > 50 ? (
          // Virtualized table for large datasets
          <div
            ref={parentRef}
            className="overflow-auto"
            style={{ height: `${height}px` }}
            role="grid"
            aria-label="Fields table"
          >
            <div style={{ height: `${virtualizer.getTotalSize()}px`, position: 'relative' }}>
              {/* Table header */}
              <div className="sticky top-0 z-10 bg-background border-b">
                {table.getHeaderGroups().map(headerGroup => (
                  <div key={headerGroup.id} className="flex" role="row">
                    {headerGroup.headers.map(header => (
                      <div
                        key={header.id}
                        className="px-4 py-3 text-left font-medium text-sm border-r last:border-r-0"
                        style={{ width: header.getSize() }}
                        role="columnheader"
                      >
                        {header.isPlaceholder
                          ? null
                          : flexRender(header.column.columnDef.header, header.getContext())
                        }
                      </div>
                    ))}
                  </div>
                ))}
              </div>

              {/* Virtualized rows */}
              {virtualizer.getVirtualItems().map(virtualRow => {
                const row = rows[virtualRow.index];
                return (
                  <div
                    key={row.id}
                    className="absolute flex w-full hover:bg-muted/50"
                    style={{
                      height: `${virtualRow.size}px`,
                      transform: `translateY(${virtualRow.start}px)`,
                    }}
                    role="row"
                  >
                    {row.getVisibleCells().map(cell => (
                      <div
                        key={cell.id}
                        className="px-4 py-3 text-sm border-r last:border-r-0 border-b flex items-center"
                        style={{ width: cell.column.getSize() }}
                        role="gridcell"
                      >
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </div>
                    ))}
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          // Standard table for smaller datasets
          <div className="overflow-auto" style={{ maxHeight: `${height}px` }}>
            <table className="w-full" role="table" aria-label="Fields table">
              <thead className="sticky top-0 bg-background border-b">
                {table.getHeaderGroups().map(headerGroup => (
                  <tr key={headerGroup.id} role="row">
                    {headerGroup.headers.map(header => (
                      <th
                        key={header.id}
                        className="px-4 py-3 text-left font-medium text-sm border-r last:border-r-0"
                        style={{ width: header.getSize() }}
                        role="columnheader"
                      >
                        {header.isPlaceholder
                          ? null
                          : flexRender(header.column.columnDef.header, header.getContext())
                        }
                      </th>
                    ))}
                  </tr>
                ))}
              </thead>
              <tbody>
                {table.getRowModel().rows.map(row => (
                  <tr
                    key={row.id}
                    className="border-b hover:bg-muted/50"
                    role="row"
                  >
                    {row.getVisibleCells().map(cell => (
                      <td
                        key={cell.id}
                        className="px-4 py-3 text-sm border-r last:border-r-0"
                        style={{ width: cell.column.getSize() }}
                        role="gridcell"
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

        {/* Empty state */}
        {filteredFields.length === 0 && (
          <div className="text-center py-8">
            <div className="text-muted-foreground">
              <h3 className="text-lg font-semibold mb-2">No fields found</h3>
              <p className="text-sm mb-4">
                {Object.keys(filters).length > 0 || globalFilter
                  ? 'Try adjusting your filters to see more results.'
                  : 'This table has no fields defined yet.'
                }
              </p>
              {resolvedActions.create.enabled && (
                <Button onClick={resolvedActions.create.handler}>
                  <PlusIcon className="h-4 w-4 mr-2" />
                  Add First Field
                </Button>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Table summary */}
      <div className="flex items-center justify-between text-sm text-muted-foreground">
        <div>
          Showing {filteredFields.length} of {fields.length} fields
        </div>
        {tableConfig.enableVirtualization && rows.length > 50 && (
          <div>
            Virtualization enabled for optimal performance
          </div>
        )}
      </div>
    </div>
  );
}

export default FieldsTable;