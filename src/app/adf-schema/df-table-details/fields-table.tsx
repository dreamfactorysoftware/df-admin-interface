'use client';

import React, { useMemo, useRef, useCallback, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useVirtualizer } from '@tanstack/react-virtual';
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  createColumnHelper,
  type ColumnDef,
  type SortingState,
  type ColumnFiltersState,
} from '@tanstack/react-table';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

// Types based on the Angular implementation
interface TableField {
  alias?: string;
  name: string;
  label: string;
  description?: string;
  native: any[];
  type: string;
  dbType: string;
  length?: number;
  precision?: any;
  scale?: any;
  default?: any;
  required: boolean;
  allowNull?: boolean;
  fixedLength: boolean;
  supportsMultibyte: boolean;
  autoIncrement: boolean;
  isPrimaryKey: boolean;
  isUnique: boolean;
  isIndex: boolean;
  isForeignKey: boolean;
  refTable?: string;
  refField?: string;
  refOnUpdate?: any;
  refOnDelete?: any;
  picklist?: string[];
  validation?: any;
  dbFunction?: string;
  isVirtual: boolean;
  isAggregate: boolean;
}

interface FieldsRow {
  name: string;
  alias: string;
  type: string;
  isVirtual: boolean;
  isAggregate: boolean;
  required: boolean;
  constraints: string;
}

interface FieldsTableProps {
  dbName: string;
  tableName: string;
}

// Mock API client - replace with actual implementation
const apiClient = {
  async getTableFields(dbName: string, tableName: string): Promise<{ resource: TableField[] }> {
    // This would be replaced with actual API call using fetch or axios
    const response = await fetch(`/api/v2/${dbName}/_schema/${tableName}/_field`);
    if (!response.ok) {
      throw new Error(`Failed to fetch table fields: ${response.statusText}`);
    }
    return response.json();
  },

  async deleteTableField(dbName: string, tableName: string, fieldName: string): Promise<void> {
    const response = await fetch(`/api/v2/${dbName}/_schema/${tableName}/_field/${fieldName}`, {
      method: 'DELETE',
    });
    if (!response.ok) {
      throw new Error(`Failed to delete field: ${response.statusText}`);
    }
  },
};

// Hook for table fields data management
function useTableFields(dbName: string, tableName: string) {
  const queryClient = useQueryClient();

  // Query for fetching table fields with intelligent caching
  const fieldsQuery = useQuery({
    queryKey: ['table-fields', dbName, tableName],
    queryFn: () => apiClient.getTableFields(dbName, tableName),
    staleTime: 5 * 60 * 1000, // 5 minutes
    cacheTime: 10 * 60 * 1000, // 10 minutes
    retry: 2,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
  });

  // Mutation for deleting a field
  const deleteFieldMutation = useMutation({
    mutationFn: ({ fieldName }: { fieldName: string }) => 
      apiClient.deleteTableField(dbName, tableName, fieldName),
    onSuccess: () => {
      // Invalidate and refetch table fields after successful deletion
      queryClient.invalidateQueries(['table-fields', dbName, tableName]);
      toast.success('Field deleted successfully');
    },
    onError: (error) => {
      toast.error(`Failed to delete field: ${error.message}`);
    },
  });

  return {
    data: fieldsQuery.data?.resource || [],
    isLoading: fieldsQuery.isLoading,
    isError: fieldsQuery.isError,
    error: fieldsQuery.error,
    deleteField: deleteFieldMutation.mutate,
    isDeletingField: deleteFieldMutation.isLoading,
    refetch: fieldsQuery.refetch,
  };
}

// Utility function to get field constraints (matching Angular logic)
function getFieldConstraints(field: TableField): string {
  if (field.isPrimaryKey) {
    return 'Primary Key';
  } else if (field.isForeignKey) {
    return 'Foreign Key';
  }
  return '';
}

// Transform TableField to FieldsRow (matching Angular mapDataToTable)
function mapFieldsToRows(fields: TableField[]): FieldsRow[] {
  return fields.map((field) => ({
    name: field.name,
    alias: field.alias || '',
    type: field.type,
    isVirtual: field.isVirtual,
    isAggregate: field.isAggregate,
    required: field.required,
    constraints: getFieldConstraints(field),
  }));
}

export default function FieldsTable({ dbName, tableName }: FieldsTableProps) {
  const router = useRouter();
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [globalFilter, setGlobalFilter] = useState('');

  // Data fetching and mutations
  const {
    data: fields,
    isLoading,
    isError,
    error,
    deleteField,
    isDeletingField,
    refetch,
  } = useTableFields(dbName, tableName);

  // Transform data for table display
  const tableData = useMemo(() => mapFieldsToRows(fields), [fields]);

  // Column helper for type-safe column definitions
  const columnHelper = createColumnHelper<FieldsRow>();

  // Table column definitions with TanStack Table
  const columns = useMemo<ColumnDef<FieldsRow, any>[]>(
    () => [
      columnHelper.accessor('name', {
        header: 'Name',
        cell: (info) => (
          <span className="font-medium text-gray-900 dark:text-white">
            {info.getValue()}
          </span>
        ),
        enableSorting: true,
        enableColumnFilter: true,
      }),
      columnHelper.accessor('alias', {
        header: 'Alias',
        cell: (info) => (
          <span className="text-gray-700 dark:text-gray-300">
            {info.getValue() || '-'}
          </span>
        ),
        enableSorting: true,
      }),
      columnHelper.accessor('type', {
        header: 'Type',
        cell: (info) => (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
            {info.getValue()}
          </span>
        ),
        enableSorting: true,
      }),
      columnHelper.accessor('isVirtual', {
        header: 'Virtual',
        cell: (info) => (
          <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
            info.getValue() 
              ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' 
              : 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200'
          }`}>
            {info.getValue() ? 'Yes' : 'No'}
          </span>
        ),
        enableSorting: true,
      }),
      columnHelper.accessor('isAggregate', {
        header: 'Aggregate',
        cell: (info) => (
          <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
            info.getValue() 
              ? 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200' 
              : 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200'
          }`}>
            {info.getValue() ? 'Yes' : 'No'}
          </span>
        ),
        enableSorting: true,
      }),
      columnHelper.accessor('required', {
        header: 'Required',
        cell: (info) => (
          <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
            info.getValue() 
              ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200' 
              : 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200'
          }`}>
            {info.getValue() ? 'Yes' : 'No'}
          </span>
        ),
        enableSorting: true,
      }),
      columnHelper.accessor('constraints', {
        header: 'Constraints',
        cell: (info) => {
          const constraints = info.getValue();
          return constraints ? (
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200">
              {constraints}
            </span>
          ) : (
            <span className="text-gray-400 dark:text-gray-500">-</span>
          );
        },
        enableSorting: false,
      }),
      columnHelper.display({
        id: 'actions',
        header: 'Actions',
        cell: (info) => (
          <div className="flex items-center space-x-2">
            <button
              onClick={() => handleViewField(info.row.original.name)}
              className="inline-flex items-center px-3 py-1 border border-transparent text-sm leading-4 font-medium rounded-md text-blue-700 bg-blue-100 hover:bg-blue-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 dark:text-blue-300 dark:bg-blue-800 dark:hover:bg-blue-700 transition-colors duration-200"
              aria-label={`View field ${info.row.original.name}`}
            >
              View
            </button>
            <button
              onClick={() => handleDeleteField(info.row.original.name)}
              disabled={isDeletingField}
              className="inline-flex items-center px-3 py-1 border border-transparent text-sm leading-4 font-medium rounded-md text-red-700 bg-red-100 hover:bg-red-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed dark:text-red-300 dark:bg-red-800 dark:hover:bg-red-700 transition-colors duration-200"
              aria-label={`Delete field ${info.row.original.name}`}
            >
              {isDeletingField ? 'Deleting...' : 'Delete'}
            </button>
          </div>
        ),
      }),
    ],
    [isDeletingField]
  );

  // Table instance with TanStack Table
  const table = useReactTable({
    data: tableData,
    columns,
    state: {
      sorting,
      columnFilters,
      globalFilter,
    },
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onGlobalFilterChange: setGlobalFilter,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    debugTable: process.env.NODE_ENV === 'development',
  });

  // Virtualization setup for performance with large datasets
  const parentRef = useRef<HTMLDivElement>(null);
  const virtualizer = useVirtualizer({
    count: table.getRowModel().rows.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 60, // Estimated row height in pixels
    overscan: 10, // Number of items to render outside of the visible area
  });

  // Action handlers
  const handleViewField = useCallback((fieldName: string) => {
    router.push(`/adf-schema/${dbName}/${tableName}/fields/${fieldName}`);
  }, [router, dbName, tableName]);

  const handleCreateField = useCallback(() => {
    router.push(`/adf-schema/${dbName}/${tableName}/fields/create`);
  }, [router, dbName, tableName]);

  const handleDeleteField = useCallback((fieldName: string) => {
    if (window.confirm(`Are you sure you want to delete the field "${fieldName}"?`)) {
      deleteField({ fieldName });
    }
  }, [deleteField]);

  const handleRefresh = useCallback(() => {
    refetch();
    toast.success('Table fields refreshed');
  }, [refetch]);

  // Loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-2 text-gray-600 dark:text-gray-400">Loading fields...</span>
      </div>
    );
  }

  // Error state
  if (isError) {
    return (
      <div className="rounded-md bg-red-50 p-4 dark:bg-red-900/50">
        <div className="flex">
          <div className="flex-shrink-0">
            <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-red-800 dark:text-red-200">
              Error loading table fields
            </h3>
            <div className="mt-2 text-sm text-red-700 dark:text-red-300">
              <p>{error?.message || 'An unexpected error occurred'}</p>
            </div>
            <div className="mt-4">
              <button
                onClick={handleRefresh}
                className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-red-700 bg-red-100 hover:bg-red-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 dark:text-red-300 dark:bg-red-800 dark:hover:bg-red-700"
              >
                Try Again
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header with search and actions */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex-1 max-w-md">
          <label htmlFor="search" className="sr-only">
            Search fields
          </label>
          <input
            id="search"
            type="text"
            placeholder="Search fields..."
            value={globalFilter ?? ''}
            onChange={(e) => setGlobalFilter(e.target.value)}
            className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:placeholder-gray-400 sm:text-sm"
            aria-label="Search table fields"
          />
        </div>
        <div className="flex items-center space-x-3">
          <button
            onClick={handleRefresh}
            disabled={isLoading}
            className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed dark:bg-gray-800 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700 transition-colors duration-200"
            aria-label="Refresh table fields"
          >
            <svg className="h-4 w-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Refresh
          </button>
          <button
            onClick={handleCreateField}
            className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors duration-200"
            aria-label="Create new field"
          >
            <svg className="h-4 w-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Add Field
          </button>
        </div>
      </div>

      {/* Results count */}
      <div className="text-sm text-gray-700 dark:text-gray-300">
        Showing {table.getRowModel().rows.length} of {tableData.length} fields
      </div>

      {/* Virtualized table */}
      <div className="bg-white dark:bg-gray-800 shadow overflow-hidden sm:rounded-md">
        <div
          ref={parentRef}
          className="overflow-auto h-96"
          style={{
            contain: 'strict',
          }}
        >
          <div
            style={{
              height: `${virtualizer.getTotalSize()}px`,
              width: '100%',
              position: 'relative',
            }}
          >
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-700 sticky top-0 z-10">
                {table.getHeaderGroups().map((headerGroup) => (
                  <tr key={headerGroup.id}>
                    {headerGroup.headers.map((header) => (
                      <th
                        key={header.id}
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-gray-300 cursor-pointer select-none"
                        onClick={header.column.getToggleSortingHandler()}
                        aria-sort={
                          header.column.getIsSorted()
                            ? header.column.getIsSorted() === 'desc'
                              ? 'descending'
                              : 'ascending'
                            : 'none'
                        }
                      >
                        <div className="flex items-center space-x-1">
                          <span>
                            {header.isPlaceholder
                              ? null
                              : typeof header.column.columnDef.header === 'string'
                              ? header.column.columnDef.header
                              : 'Column'}
                          </span>
                          {{
                            asc: <span aria-hidden="true">↑</span>,
                            desc: <span aria-hidden="true">↓</span>,
                          }[header.column.getIsSorted() as string] ?? null}
                        </div>
                      </th>
                    ))}
                  </tr>
                ))}
              </thead>
              <tbody className="bg-white divide-y divide-gray-200 dark:bg-gray-800 dark:divide-gray-700">
                {virtualizer.getVirtualItems().map((virtualItem) => {
                  const row = table.getRowModel().rows[virtualItem.index];
                  return (
                    <tr
                      key={row.id}
                      style={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        width: '100%',
                        height: `${virtualItem.size}px`,
                        transform: `translateY(${virtualItem.start}px)`,
                      }}
                      className="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors duration-150"
                    >
                      {row.getVisibleCells().map((cell) => (
                        <td
                          key={cell.id}
                          className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white"
                        >
                          {typeof cell.column.columnDef.cell === 'function'
                            ? cell.column.columnDef.cell(cell.getContext())
                            : cell.getValue()}
                        </td>
                      ))}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Empty state */}
      {tableData.length === 0 && (
        <div className="text-center py-12">
          <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">No fields found</h3>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Get started by creating a new field for this table.
          </p>
          <div className="mt-6">
            <button
              onClick={handleCreateField}
              className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              <svg className="h-4 w-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Add Field
            </button>
          </div>
        </div>
      )}
    </div>
  );
}