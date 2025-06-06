'use client';

import React, { useMemo, useState, useCallback, useRef, useEffect } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
import { useQuery } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  ChevronUpIcon,
  ChevronDownIcon,
  MagnifyingGlassIcon,
  ArrowPathIcon,
} from '@heroicons/react/24/outline';
import { 
  Table, 
  TableHeader, 
  TableBody, 
  TableHead, 
  TableRow, 
  TableCell 
} from '@/components/ui/table';
import { Input } from '@/components/ui/form/input';
import { Button } from '@/components/ui/button';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { ErrorBoundary } from '@/components/ui/error-boundary';
import { useServiceReports } from '@/hooks/use-service-reports';
import type { ServiceReportData } from '@/types/service-report';

// Form validation schema for filtering
const filterSchema = z.object({
  search: z.string().min(0).max(255),
  serviceId: z.string().optional(),
  userEmail: z.string().optional(),
  action: z.string().optional(),
});

type FilterFormData = z.infer<typeof filterSchema>;

// Column definitions matching the original Angular implementation
type Column = {
  key: keyof ServiceReportData | 'time' | 'request';
  header: string;
  accessor: (row: ServiceReportData) => string | number | null;
  sortable: boolean;
  width?: string;
};

const columns: Column[] = [
  {
    key: 'time',
    header: 'Time',
    accessor: (row) => row.lastModifiedDate,
    sortable: true,
    width: 'w-48',
  },
  {
    key: 'serviceId',
    header: 'Service ID',
    accessor: (row) => row.serviceId,
    sortable: true,
    width: 'w-32',
  },
  {
    key: 'serviceName',
    header: 'Service Name',
    accessor: (row) => row.serviceName,
    sortable: true,
    width: 'w-48',
  },
  {
    key: 'userEmail',
    header: 'User Email',
    accessor: (row) => row.userEmail,
    sortable: true,
    width: 'w-64',
  },
  {
    key: 'action',
    header: 'Action',
    accessor: (row) => row.action,
    sortable: true,
    width: 'w-32',
  },
  {
    key: 'request',
    header: 'Request',
    accessor: (row) => row.requestVerb,
    sortable: true,
    width: 'w-24',
  },
];

// Pagination configuration
const PAGE_SIZES = [10, 25, 50, 100];
const DEFAULT_PAGE_SIZE = 25;

// Sort configuration type
type SortConfig = {
  column: string;
  direction: 'asc' | 'desc';
} | null;

interface ServiceReportTableProps {
  className?: string;
  onRowClick?: (row: ServiceReportData) => void;
  'aria-label'?: string;
}

export function ServiceReportTable({
  className = '',
  onRowClick,
  'aria-label': ariaLabel = 'Service reports data table',
}: ServiceReportTableProps) {
  // State management
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);
  const [sortConfig, setSortConfig] = useState<SortConfig>(null);
  const [liveRegion, setLiveRegion] = useState('');

  // Form state for filtering
  const {
    register,
    watch,
    setValue,
    handleSubmit,
    formState: { errors },
  } = useForm<FilterFormData>({
    resolver: zodResolver(filterSchema),
    defaultValues: {
      search: '',
      serviceId: '',
      userEmail: '',
      action: '',
    },
  });

  const searchValue = watch('search');
  const filterValues = watch();

  // Virtual scrolling container reference
  const parentRef = useRef<HTMLDivElement>(null);

  // Build filter object for API
  const filterParams = useMemo(() => {
    const filters: Record<string, string> = {};
    
    if (filterValues.search?.trim()) {
      filters.search = filterValues.search.trim();
    }
    if (filterValues.serviceId?.trim()) {
      filters.serviceId = filterValues.serviceId.trim();
    }
    if (filterValues.userEmail?.trim()) {
      filters.userEmail = filterValues.userEmail.trim();
    }
    if (filterValues.action?.trim()) {
      filters.action = filterValues.action.trim();
    }

    return Object.keys(filters).length > 0 ? filters : undefined;
  }, [filterValues]);

  // Data fetching with React Query
  const {
    data: reportData,
    isLoading,
    isError,
    error,
    refetch,
    isFetching,
  } = useServiceReports({
    page: currentPage,
    limit: pageSize,
    filters: filterParams,
    sortBy: sortConfig?.column,
    sortOrder: sortConfig?.direction,
  });

  const { data: reports = [], meta } = reportData || {};
  const totalItems = meta?.count || 0;
  const totalPages = Math.ceil(totalItems / pageSize);

  // Sort data for virtual scrolling
  const sortedData = useMemo(() => {
    if (!sortConfig) return reports;

    return [...reports].sort((a, b) => {
      const column = columns.find(col => col.key === sortConfig.column);
      if (!column) return 0;

      const aValue = column.accessor(a);
      const bValue = column.accessor(b);
      
      if (aValue === null && bValue === null) return 0;
      if (aValue === null) return 1;
      if (bValue === null) return -1;

      const aStr = String(aValue).toLowerCase();
      const bStr = String(bValue).toLowerCase();
      
      const comparison = aStr.localeCompare(bStr, undefined, { numeric: true });
      return sortConfig.direction === 'desc' ? -comparison : comparison;
    });
  }, [reports, sortConfig]);

  // Virtual scrolling setup
  const rowVirtualizer = useVirtualizer({
    count: sortedData.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 48, // Estimated row height in pixels
    overscan: 5,
  });

  // Handlers
  const handleSort = useCallback((columnKey: string) => {
    const column = columns.find(col => col.key === columnKey);
    if (!column?.sortable) return;

    setSortConfig(current => {
      const newDirection = 
        current?.column === columnKey && current.direction === 'asc' 
          ? 'desc' 
          : 'asc';
      
      // Announce sort change for screen readers
      const columnName = column.header;
      const directionText = newDirection === 'asc' ? 'ascending' : 'descending';
      setLiveRegion(`Table sorted by ${columnName} in ${directionText} order`);
      
      return { column: columnKey, direction: newDirection };
    });
  }, []);

  const handleRefresh = useCallback(() => {
    refetch();
    setLiveRegion('Service reports data refreshed');
  }, [refetch]);

  const handlePageChange = useCallback((page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
      setLiveRegion(`Navigated to page ${page} of ${totalPages}`);
    }
  }, [totalPages]);

  const handlePageSizeChange = useCallback((newPageSize: number) => {
    setPageSize(newPageSize);
    setCurrentPage(1); // Reset to first page
    setLiveRegion(`Page size changed to ${newPageSize} items per page`);
  }, []);

  const handleRowClick = useCallback((row: ServiceReportData) => {
    if (onRowClick) {
      onRowClick(row);
      setLiveRegion(`Selected service report for ${row.serviceName}`);
    }
  }, [onRowClick]);

  const clearFilters = useCallback(() => {
    setValue('search', '');
    setValue('serviceId', '');
    setValue('userEmail', '');
    setValue('action', '');
    setCurrentPage(1);
    setLiveRegion('Filters cleared');
  }, [setValue]);

  // Format date for display
  const formatDate = useCallback((dateString: string) => {
    try {
      return new Date(dateString).toLocaleString();
    } catch {
      return dateString;
    }
  }, []);

  // Render sort icon
  const renderSortIcon = useCallback((columnKey: string) => {
    if (sortConfig?.column !== columnKey) {
      return null;
    }
    
    return sortConfig.direction === 'asc' ? (
      <ChevronUpIcon className="w-4 h-4 ml-1 inline" />
    ) : (
      <ChevronDownIcon className="w-4 h-4 ml-1 inline" />
    );
  }, [sortConfig]);

  // Clear live region after announcement
  useEffect(() => {
    if (liveRegion) {
      const timer = setTimeout(() => setLiveRegion(''), 1000);
      return () => clearTimeout(timer);
    }
  }, [liveRegion]);

  if (isError) {
    return (
      <ErrorBoundary
        error={error as Error}
        onRetry={handleRefresh}
        className="p-6"
      >
        <div className="text-center">
          <p className="text-red-600 dark:text-red-400 mb-4">
            Failed to load service reports data
          </p>
          <Button onClick={handleRefresh} variant="outline">
            <ArrowPathIcon className="w-4 h-4 mr-2" />
            Retry
          </Button>
        </div>
      </ErrorBoundary>
    );
  }

  return (
    <div className={`service-report-table ${className}`}>
      {/* Live region for screen reader announcements */}
      <div
        aria-live="polite"
        aria-atomic="true"
        className="sr-only"
        role="status"
      >
        {liveRegion}
      </div>

      {/* Header controls */}
      <div className="mb-6 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <h2 className="text-2xl font-semibold text-gray-900 dark:text-gray-100">
            Service Reports
          </h2>
          
          <div className="flex items-center gap-2">
            <Button
              onClick={handleRefresh}
              disabled={isFetching}
              variant="outline"
              size="sm"
              aria-label="Refresh service reports data"
            >
              <ArrowPathIcon className={`w-4 h-4 ${isFetching ? 'animate-spin' : ''}`} />
              <span className="sr-only">Refresh</span>
            </Button>
          </div>
        </div>

        {/* Search and filters */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="relative">
            <Input
              {...register('search')}
              type="text"
              placeholder="Search all fields..."
              className="pl-10"
              aria-label="Search service reports"
            />
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
          </div>
          
          <Input
            {...register('serviceId')}
            type="text"
            placeholder="Filter by Service ID"
            aria-label="Filter by service ID"
          />
          
          <Input
            {...register('userEmail')}
            type="text"
            placeholder="Filter by User Email"
            aria-label="Filter by user email"
          />
          
          <div className="flex gap-2">
            <Input
              {...register('action')}
              type="text"
              placeholder="Filter by Action"
              aria-label="Filter by action"
              className="flex-1"
            />
            <Button
              onClick={clearFilters}
              variant="outline"
              size="sm"
              aria-label="Clear all filters"
            >
              Clear
            </Button>
          </div>
        </div>
      </div>

      {/* Data summary */}
      <div className="mb-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 text-sm text-gray-600 dark:text-gray-400">
        <p>
          Showing {sortedData.length} of {totalItems} reports
          {filterParams && ' (filtered)'}
        </p>
        
        <div className="flex items-center gap-2">
          <label htmlFor="page-size" className="whitespace-nowrap">
            Items per page:
          </label>
          <select
            id="page-size"
            value={pageSize}
            onChange={(e) => handlePageSizeChange(Number(e.target.value))}
            className="border border-gray-300 rounded px-2 py-1 text-sm bg-white dark:bg-gray-800 dark:border-gray-600"
            aria-label="Items per page"
          >
            {PAGE_SIZES.map(size => (
              <option key={size} value={size}>
                {size}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Table container with virtual scrolling */}
      <div className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
        <div className="bg-white dark:bg-gray-800">
          {/* Table header */}
          <div className="border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
            <div className="grid grid-cols-6 gap-4 px-6 py-3">
              {columns.map((column) => (
                <button
                  key={column.key}
                  onClick={() => handleSort(column.key)}
                  disabled={!column.sortable}
                  className={`
                    text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider
                    ${column.sortable ? 'hover:text-gray-700 dark:hover:text-gray-200 cursor-pointer' : 'cursor-default'}
                    ${column.width || ''}
                    focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 rounded
                  `}
                  aria-label={column.sortable ? `Sort by ${column.header}` : column.header}
                  aria-sort={
                    sortConfig?.column === column.key
                      ? sortConfig.direction === 'asc' ? 'ascending' : 'descending'
                      : undefined
                  }
                >
                  <span className="flex items-center">
                    {column.header}
                    {column.sortable && renderSortIcon(column.key)}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Loading state */}
          {isLoading && (
            <div className="flex items-center justify-center py-12">
              <LoadingSpinner size="md" />
              <span className="ml-2 text-gray-600 dark:text-gray-400">
                Loading service reports...
              </span>
            </div>
          )}

          {/* Virtual scrolling container */}
          {!isLoading && sortedData.length > 0 && (
            <div
              ref={parentRef}
              className="h-96 overflow-auto"
              style={{ contain: 'strict' }}
              role="grid"
              aria-label={ariaLabel}
              aria-rowcount={sortedData.length}
            >
              <div
                style={{
                  height: `${rowVirtualizer.getTotalSize()}px`,
                  width: '100%',
                  position: 'relative',
                }}
              >
                {rowVirtualizer.getVirtualItems().map((virtualRow) => {
                  const row = sortedData[virtualRow.index];
                  if (!row) return null;

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
                      role="gridcell"
                      aria-rowindex={virtualRow.index + 1}
                    >
                      <div
                        className={`
                          grid grid-cols-6 gap-4 px-6 py-3 border-b border-gray-100 dark:border-gray-700
                          hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors
                          ${onRowClick ? 'cursor-pointer' : 'cursor-default'}
                          focus-within:ring-2 focus-within:ring-primary-500 focus-within:ring-offset-2
                        `}
                        onClick={() => handleRowClick(row)}
                        onKeyDown={(e) => {
                          if ((e.key === 'Enter' || e.key === ' ') && onRowClick) {
                            e.preventDefault();
                            handleRowClick(row);
                          }
                        }}
                        tabIndex={onRowClick ? 0 : -1}
                        role="button"
                        aria-label={`Service report for ${row.serviceName}, ${formatDate(row.lastModifiedDate)}`}
                      >
                        <div className="text-sm text-gray-900 dark:text-gray-100 font-mono">
                          {formatDate(row.lastModifiedDate)}
                        </div>
                        <div className="text-sm text-gray-900 dark:text-gray-100">
                          {row.serviceId || '-'}
                        </div>
                        <div className="text-sm text-gray-900 dark:text-gray-100 truncate">
                          {row.serviceName}
                        </div>
                        <div className="text-sm text-gray-900 dark:text-gray-100 truncate">
                          {row.userEmail}
                        </div>
                        <div className="text-sm text-gray-900 dark:text-gray-100">
                          {row.action}
                        </div>
                        <div className="text-sm text-gray-900 dark:text-gray-100 font-mono">
                          <span className={`
                            inline-flex px-2 py-1 text-xs font-semibold rounded-full
                            ${row.requestVerb === 'GET' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' : ''}
                            ${row.requestVerb === 'POST' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200' : ''}
                            ${row.requestVerb === 'PUT' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200' : ''}
                            ${row.requestVerb === 'DELETE' ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200' : ''}
                            ${!['GET', 'POST', 'PUT', 'DELETE'].includes(row.requestVerb) ? 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200' : ''}
                          `}>
                            {row.requestVerb}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Empty state */}
          {!isLoading && sortedData.length === 0 && (
            <div className="text-center py-12">
              <p className="text-gray-500 dark:text-gray-400">
                {filterParams ? 'No reports match your filters' : 'No service reports found'}
              </p>
              {filterParams && (
                <Button
                  onClick={clearFilters}
                  variant="outline"
                  className="mt-4"
                >
                  Clear filters
                </Button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Pagination */}
      {!isLoading && totalPages > 1 && (
        <div className="mt-6 flex items-center justify-between">
          <div className="text-sm text-gray-700 dark:text-gray-300">
            Page {currentPage} of {totalPages}
          </div>
          
          <div className="flex items-center space-x-2">
            <Button
              onClick={() => handlePageChange(1)}
              disabled={currentPage === 1}
              variant="outline"
              size="sm"
              aria-label="Go to first page"
            >
              First
            </Button>
            
            <Button
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 1}
              variant="outline"
              size="sm"
              aria-label="Go to previous page"
            >
              Previous
            </Button>
            
            <Button
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
              variant="outline"
              size="sm"
              aria-label="Go to next page"
            >
              Next
            </Button>
            
            <Button
              onClick={() => handlePageChange(totalPages)}
              disabled={currentPage === totalPages}
              variant="outline"
              size="sm"
              aria-label="Go to last page"
            >
              Last
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

export default ServiceReportTable;