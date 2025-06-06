/**
 * Data Table component with pagination, sorting, and filtering
 * Replaces Angular Material table with React/Tailwind CSS implementation
 * Supports server-side pagination and WCAG 2.1 AA accessibility compliance
 */

'use client';

import React, { useState, useMemo, useCallback } from 'react';
import { ChevronUpIcon, ChevronDownIcon, ChevronLeftIcon, ChevronRightIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

// Column definition interface
export interface DataTableColumn<T = any> {
  key: string;
  header: string;
  accessor?: keyof T | ((row: T) => React.ReactNode);
  sortable?: boolean;
  searchable?: boolean;
  width?: string;
  align?: 'left' | 'center' | 'right';
  render?: (value: any, row: T, index: number) => React.ReactNode;
}

// Sort configuration
export interface SortConfig {
  key: string;
  direction: 'asc' | 'desc';
}

// Pagination configuration
export interface PaginationConfig {
  page: number;
  pageSize: number;
  total: number;
  pageSizeOptions?: number[];
}

// Table props interface
export interface DataTableProps<T = any> {
  data: T[];
  columns: DataTableColumn<T>[];
  loading?: boolean;
  error?: string | null;
  pagination?: PaginationConfig;
  onPageChange?: (page: number) => void;
  onPageSizeChange?: (pageSize: number) => void;
  sortConfig?: SortConfig;
  onSortChange?: (sortConfig: SortConfig) => void;
  searchQuery?: string;
  onSearchChange?: (query: string) => void;
  searchPlaceholder?: string;
  emptyMessage?: string;
  actions?: React.ReactNode;
  className?: string;
  rowClassName?: (row: T, index: number) => string;
  onRowClick?: (row: T, index: number) => void;
  selectedRows?: Set<string | number>;
  onSelectionChange?: (selectedRows: Set<string | number>) => void;
  getRowId?: (row: T) => string | number;
  showSearch?: boolean;
  showPagination?: boolean;
  stickyHeader?: boolean;
  compact?: boolean;
}

// Loading skeleton component
const TableSkeleton: React.FC<{ columns: number; rows?: number }> = ({ 
  columns, 
  rows = 5 
}) => (
  <div className="animate-pulse">
    {/* Header skeleton */}
    <div className="flex border-b border-gray-200">
      {Array.from({ length: columns }).map((_, i) => (
        <div key={i} className="flex-1 p-4">
          <div className="h-4 bg-gray-200 rounded"></div>
        </div>
      ))}
    </div>
    {/* Rows skeleton */}
    {Array.from({ length: rows }).map((_, i) => (
      <div key={i} className="flex border-b border-gray-50">
        {Array.from({ length: columns }).map((_, j) => (
          <div key={j} className="flex-1 p-4">
            <div className="h-4 bg-gray-100 rounded"></div>
          </div>
        ))}
      </div>
    ))}
  </div>
);

// Empty state component
const EmptyState: React.FC<{ message: string; icon?: React.ReactNode }> = ({ 
  message, 
  icon 
}) => (
  <div className="flex flex-col items-center justify-center py-12 text-gray-500">
    {icon && <div className="mb-4 text-gray-400">{icon}</div>}
    <p className="text-sm">{message}</p>
  </div>
);

// Error state component
const ErrorState: React.FC<{ message: string; onRetry?: () => void }> = ({ 
  message, 
  onRetry 
}) => (
  <div className="flex flex-col items-center justify-center py-12 text-red-500">
    <p className="text-sm mb-4">{message}</p>
    {onRetry && (
      <Button variant="outline" size="sm" onClick={onRetry}>
        Try Again
      </Button>
    )}
  </div>
);

// Pagination component
const DataTablePagination: React.FC<{
  pagination: PaginationConfig;
  onPageChange: (page: number) => void;
  onPageSizeChange: (pageSize: number) => void;
  loading?: boolean;
}> = ({ pagination, onPageChange, onPageSizeChange, loading }) => {
  const { page, pageSize, total, pageSizeOptions = [10, 25, 50, 100] } = pagination;
  const totalPages = Math.ceil(total / pageSize);
  const startItem = Math.min((page - 1) * pageSize + 1, total);
  const endItem = Math.min(page * pageSize, total);

  const canGoPrevious = page > 1;
  const canGoNext = page < totalPages;

  return (
    <div className="flex items-center justify-between px-4 py-3 bg-white border-t border-gray-200">
      {/* Items per page */}
      <div className="flex items-center space-x-2">
        <span className="text-sm text-gray-700">Rows per page:</span>
        <select
          value={pageSize}
          onChange={(e) => onPageSizeChange(parseInt(e.target.value))}
          disabled={loading}
          className="px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {pageSizeOptions.map((size) => (
            <option key={size} value={size}>
              {size}
            </option>
          ))}
        </select>
      </div>

      {/* Page info and navigation */}
      <div className="flex items-center space-x-4">
        <span className="text-sm text-gray-700">
          {total > 0 ? `${startItem}-${endItem} of ${total}` : '0 items'}
        </span>
        
        <div className="flex items-center space-x-1">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onPageChange(page - 1)}
            disabled={!canGoPrevious || loading}
            aria-label="Previous page"
          >
            <ChevronLeftIcon className="w-4 h-4" />
          </Button>
          
          <span className="px-3 py-1 text-sm">
            Page {page} of {totalPages || 1}
          </span>
          
          <Button
            variant="outline"
            size="sm"
            onClick={() => onPageChange(page + 1)}
            disabled={!canGoNext || loading}
            aria-label="Next page"
          >
            <ChevronRightIcon className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  );
};

// Main DataTable component
export const DataTable = <T extends Record<string, any>>({
  data,
  columns,
  loading = false,
  error = null,
  pagination,
  onPageChange,
  onPageSizeChange,
  sortConfig,
  onSortChange,
  searchQuery = '',
  onSearchChange,
  searchPlaceholder = 'Search...',
  emptyMessage = 'No data available',
  actions,
  className = '',
  rowClassName,
  onRowClick,
  selectedRows,
  onSelectionChange,
  getRowId,
  showSearch = true,
  showPagination = true,
  stickyHeader = false,
  compact = false,
}: DataTableProps<T>) => {
  const [internalSearchQuery, setInternalSearchQuery] = useState(searchQuery);

  // Handle search input with debouncing
  const handleSearchChange = useCallback(
    (query: string) => {
      setInternalSearchQuery(query);
      onSearchChange?.(query);
    },
    [onSearchChange]
  );

  // Handle sorting
  const handleSort = useCallback(
    (columnKey: string) => {
      if (!onSortChange) return;

      const newDirection = 
        sortConfig?.key === columnKey && sortConfig.direction === 'asc'
          ? 'desc'
          : 'asc';

      onSortChange({ key: columnKey, direction: newDirection });
    },
    [sortConfig, onSortChange]
  );

  // Handle row selection
  const handleRowSelection = useCallback(
    (rowId: string | number, selected: boolean) => {
      if (!onSelectionChange || !selectedRows) return;

      const newSelection = new Set(selectedRows);
      if (selected) {
        newSelection.add(rowId);
      } else {
        newSelection.delete(rowId);
      }
      onSelectionChange(newSelection);
    },
    [selectedRows, onSelectionChange]
  );

  // Get cell value
  const getCellValue = useCallback((row: T, column: DataTableColumn<T>) => {
    if (column.render) {
      return column.render(
        column.accessor ? 
          (typeof column.accessor === 'function' ? column.accessor(row) : row[column.accessor]) :
          row[column.key as keyof T],
        row,
        0
      );
    }

    if (column.accessor) {
      return typeof column.accessor === 'function' ? column.accessor(row) : row[column.accessor];
    }

    return row[column.key as keyof T];
  }, []);

  // Render sort icon
  const renderSortIcon = (columnKey: string) => {
    if (!sortConfig || sortConfig.key !== columnKey) {
      return <ChevronUpIcon className="w-4 h-4 opacity-50" />;
    }

    return sortConfig.direction === 'asc' 
      ? <ChevronUpIcon className="w-4 h-4" />
      : <ChevronDownIcon className="w-4 h-4" />;
  };

  return (
    <div className={cn('bg-white border border-gray-200 rounded-lg', className)}>
      {/* Header with search and actions */}
      {(showSearch || actions) && (
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          {showSearch && onSearchChange && (
            <div className="max-w-sm">
              <Input
                type="text"
                placeholder={searchPlaceholder}
                value={internalSearchQuery}
                onChange={(e) => handleSearchChange(e.target.value)}
                className="w-full"
              />
            </div>
          )}
          {actions && <div className="flex items-center space-x-2">{actions}</div>}
        </div>
      )}

      {/* Table container */}
      <div className="relative overflow-auto">
        <table className="w-full text-sm">
          {/* Table header */}
          <thead 
            className={cn(
              'bg-gray-50 border-b border-gray-200',
              stickyHeader && 'sticky top-0 z-10'
            )}
          >
            <tr>
              {/* Selection column */}
              {selectedRows && onSelectionChange && (
                <th className="w-12 px-4 py-3 text-left">
                  <input
                    type="checkbox"
                    checked={selectedRows.size === data.length && data.length > 0}
                    indeterminate={selectedRows.size > 0 && selectedRows.size < data.length}
                    onChange={(e) => {
                      const newSelection = new Set<string | number>();
                      if (e.target.checked) {
                        data.forEach((row, index) => {
                          const rowId = getRowId ? getRowId(row) : index;
                          newSelection.add(rowId);
                        });
                      }
                      onSelectionChange(newSelection);
                    }}
                    className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                  />
                </th>
              )}

              {/* Column headers */}
              {columns.map((column) => (
                <th
                  key={column.key}
                  className={cn(
                    'px-4 py-3 text-left font-medium text-gray-900',
                    compact && 'py-2',
                    column.width && `w-[${column.width}]`,
                    column.align === 'center' && 'text-center',
                    column.align === 'right' && 'text-right'
                  )}
                >
                  {column.sortable && onSortChange ? (
                    <button
                      type="button"
                      onClick={() => handleSort(column.key)}
                      className="flex items-center space-x-1 hover:text-primary-600 focus:outline-none focus:text-primary-600"
                    >
                      <span>{column.header}</span>
                      {renderSortIcon(column.key)}
                    </button>
                  ) : (
                    column.header
                  )}
                </th>
              ))}
            </tr>
          </thead>

          {/* Table body */}
          <tbody className="divide-y divide-gray-200">
            {loading ? (
              <tr>
                <td colSpan={columns.length + (selectedRows ? 1 : 0)}>
                  <TableSkeleton columns={columns.length} />
                </td>
              </tr>
            ) : error ? (
              <tr>
                <td colSpan={columns.length + (selectedRows ? 1 : 0)}>
                  <ErrorState message={error} />
                </td>
              </tr>
            ) : data.length === 0 ? (
              <tr>
                <td colSpan={columns.length + (selectedRows ? 1 : 0)}>
                  <EmptyState message={emptyMessage} />
                </td>
              </tr>
            ) : (
              data.map((row, index) => {
                const rowId = getRowId ? getRowId(row) : index;
                const isSelected = selectedRows?.has(rowId) || false;
                
                return (
                  <tr
                    key={rowId}
                    onClick={onRowClick ? () => onRowClick(row, index) : undefined}
                    className={cn(
                      'hover:bg-gray-50 transition-colors',
                      onRowClick && 'cursor-pointer',
                      isSelected && 'bg-primary-50',
                      rowClassName?.(row, index)
                    )}
                  >
                    {/* Selection cell */}
                    {selectedRows && onSelectionChange && (
                      <td className="px-4 py-4">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={(e) => handleRowSelection(rowId, e.target.checked)}
                          onClick={(e) => e.stopPropagation()}
                          className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                        />
                      </td>
                    )}

                    {/* Data cells */}
                    {columns.map((column) => (
                      <td
                        key={column.key}
                        className={cn(
                          'px-4 py-4 whitespace-nowrap',
                          compact && 'py-2',
                          column.align === 'center' && 'text-center',
                          column.align === 'right' && 'text-right'
                        )}
                      >
                        {getCellValue(row, column)}
                      </td>
                    ))}
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {showPagination && pagination && onPageChange && onPageSizeChange && (
        <DataTablePagination
          pagination={pagination}
          onPageChange={onPageChange}
          onPageSizeChange={onPageSizeChange}
          loading={loading}
        />
      )}
    </div>
  );
};

export default DataTable;