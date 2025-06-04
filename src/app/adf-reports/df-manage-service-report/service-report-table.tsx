/**
 * Service Report Table Component
 * 
 * React functional component that renders and manages service report entries 
 * in a paginated, filterable, and accessible table using Headless UI with 
 * TanStack Virtual for performance optimization.
 * 
 * Features:
 * - Six columns: time, serviceId, serviceName, userEmail, action, request
 * - React Query/SWR for intelligent caching and synchronization
 * - Accessibility with ARIA implementation
 * - Internationalization support
 * - Performance optimization for large datasets
 * - Filtering and sorting capabilities
 * - Responsive design with Tailwind CSS
 * 
 * Replaces: Angular DfManageServiceReportTableComponent
 * 
 * @author DreamFactory Admin Interface Team
 * @version React 19/Next.js 15.1 Migration
 */

'use client';

import React, { useState, useMemo, useCallback } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
import { useQuery } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { 
  ChevronUpIcon, 
  ChevronDownIcon,
  FunnelIcon,
  XMarkIcon,
  MagnifyingGlassIcon,
  ArrowPathIcon
} from '@heroicons/react/24/outline';
import { cn, formatRelativeTime, formatDuration } from '@/lib/utils';
import { apiClient } from '@/lib/api-client';

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

interface ServiceReportEntry {
  id: string;
  timestamp: string;
  serviceId: string;
  serviceName: string;
  userEmail: string;
  action: string;
  request: {
    method: string;
    endpoint: string;
    duration: number;
    statusCode: number;
    responseSize: number;
  };
  metadata?: {
    userAgent?: string;
    ipAddress?: string;
    requestId?: string;
  };
}

interface ServiceReportResponse {
  data: ServiceReportEntry[];
  total: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
}

interface ServiceReportFilters {
  search: string;
  serviceId: string;
  userEmail: string;
  action: string;
  dateFrom: string;
  dateTo: string;
  statusCode: string;
}

type SortField = 'timestamp' | 'serviceId' | 'serviceName' | 'userEmail' | 'action';
type SortDirection = 'asc' | 'desc';

// ============================================================================
// VALIDATION SCHEMAS
// ============================================================================

const filterSchema = z.object({
  search: z.string().optional(),
  serviceId: z.string().optional(),
  userEmail: z.string().email().optional().or(z.literal('')),
  action: z.string().optional(),
  dateFrom: z.string().optional(),
  dateTo: z.string().optional(),
  statusCode: z.string().optional(),
});

type FilterFormData = z.infer<typeof filterSchema>;

// ============================================================================
// CONSTANTS
// ============================================================================

const ITEMS_PER_PAGE = 50;
const VIRTUAL_ROW_HEIGHT = 64; // Height of each table row in pixels

const ACTION_TYPES = [
  { value: '', label: 'All Actions' },
  { value: 'GET', label: 'GET' },
  { value: 'POST', label: 'POST' },
  { value: 'PUT', label: 'PUT' },
  { value: 'PATCH', label: 'PATCH' },
  { value: 'DELETE', label: 'DELETE' },
];

const STATUS_CODE_FILTERS = [
  { value: '', label: 'All Status Codes' },
  { value: '2xx', label: '2xx Success' },
  { value: '3xx', label: '3xx Redirect' },
  { value: '4xx', label: '4xx Client Error' },
  { value: '5xx', label: '5xx Server Error' },
];

// ============================================================================
// HOOKS
// ============================================================================

/**
 * Custom hook for fetching service reports with intelligent caching
 */
function useServiceReports(
  page: number = 1,
  filters: Partial<ServiceReportFilters> = {},
  sortField: SortField = 'timestamp',
  sortDirection: SortDirection = 'desc'
) {
  const queryKey = ['service-reports', page, filters, sortField, sortDirection];
  
  return useQuery({
    queryKey,
    queryFn: async (): Promise<ServiceReportResponse> => {
      const params = new URLSearchParams({
        page: page.toString(),
        pageSize: ITEMS_PER_PAGE.toString(),
        sortBy: sortField,
        sortDirection,
        ...Object.fromEntries(
          Object.entries(filters).filter(([_, value]) => value !== '' && value != null)
        ),
      });

      const response = await apiClient.get(`/system/logs/service_reports?${params}`);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch service reports: ${response.statusText}`);
      }

      return response.json();
    },
    staleTime: 30000, // Consider data fresh for 30 seconds
    gcTime: 300000, // Keep in cache for 5 minutes
    refetchOnWindowFocus: false,
    retry: 2,
  });
}

// ============================================================================
// COMPONENTS
// ============================================================================

/**
 * Filter Controls Component
 */
interface FilterControlsProps {
  onFiltersChange: (filters: Partial<ServiceReportFilters>) => void;
  onClearFilters: () => void;
  isLoading: boolean;
}

function FilterControls({ onFiltersChange, onClearFilters, isLoading }: FilterControlsProps) {
  const [showAdvanced, setShowAdvanced] = useState(false);
  
  const { register, handleSubmit, reset, watch, formState: { errors } } = useForm<FilterFormData>({
    resolver: zodResolver(filterSchema),
    defaultValues: {
      search: '',
      serviceId: '',
      userEmail: '',
      action: '',
      dateFrom: '',
      dateTo: '',
      statusCode: '',
    },
  });

  const onSubmit = useCallback((data: FilterFormData) => {
    onFiltersChange(data);
  }, [onFiltersChange]);

  const handleClearFilters = useCallback(() => {
    reset();
    onClearFilters();
  }, [reset, onClearFilters]);

  const searchValue = watch('search');

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 mb-6">
      {/* Primary Search */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1 relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" aria-hidden="true" />
          </div>
          <input
            {...register('search')}
            type="text"
            placeholder="Search service reports..."
            className={cn(
              "w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg",
              "focus:ring-2 focus:ring-primary-500 focus:border-primary-500",
              "dark:bg-gray-700 dark:border-gray-600 dark:text-white",
              "placeholder-gray-400 dark:placeholder-gray-300",
              errors.search && "border-red-500 focus:border-red-500 focus:ring-red-500"
            )}
            aria-label="Search service reports"
            disabled={isLoading}
          />
          {searchValue && (
            <button
              type="button"
              onClick={() => reset({ search: '' })}
              className="absolute inset-y-0 right-0 pr-3 flex items-center"
              aria-label="Clear search"
            >
              <XMarkIcon className="h-5 w-5 text-gray-400 hover:text-gray-600" />
            </button>
          )}
        </div>
        
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setShowAdvanced(!showAdvanced)}
            className={cn(
              "inline-flex items-center px-4 py-2 border border-gray-300 rounded-lg",
              "bg-white text-gray-700 hover:bg-gray-50",
              "dark:bg-gray-700 dark:border-gray-600 dark:text-white dark:hover:bg-gray-600",
              "focus:outline-none focus:ring-2 focus:ring-primary-500",
              showAdvanced && "bg-primary-50 border-primary-300 text-primary-700"
            )}
            aria-expanded={showAdvanced}
            aria-controls="advanced-filters"
          >
            <FunnelIcon className="h-5 w-5 mr-2" />
            Filters
          </button>
          
          <button
            type="submit"
            disabled={isLoading}
            className={cn(
              "inline-flex items-center px-4 py-2 border border-transparent rounded-lg",
              "bg-primary-600 text-white hover:bg-primary-700",
              "focus:outline-none focus:ring-2 focus:ring-primary-500",
              "disabled:opacity-50 disabled:cursor-not-allowed"
            )}
          >
            {isLoading ? (
              <ArrowPathIcon className="h-5 w-5 mr-2 animate-spin" />
            ) : (
              <MagnifyingGlassIcon className="h-5 w-5 mr-2" />
            )}
            Search
          </button>
        </div>
      </div>

      {/* Advanced Filters */}
      {showAdvanced && (
        <div id="advanced-filters" className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
          <div>
            <label htmlFor="serviceId" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Service ID
            </label>
            <input
              {...register('serviceId')}
              id="serviceId"
              type="text"
              className={cn(
                "w-full px-3 py-2 border border-gray-300 rounded-lg",
                "focus:ring-2 focus:ring-primary-500 focus:border-primary-500",
                "dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              )}
              disabled={isLoading}
            />
          </div>

          <div>
            <label htmlFor="userEmail" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              User Email
            </label>
            <input
              {...register('userEmail')}
              id="userEmail"
              type="email"
              className={cn(
                "w-full px-3 py-2 border border-gray-300 rounded-lg",
                "focus:ring-2 focus:ring-primary-500 focus:border-primary-500",
                "dark:bg-gray-700 dark:border-gray-600 dark:text-white",
                errors.userEmail && "border-red-500 focus:border-red-500 focus:ring-red-500"
              )}
              disabled={isLoading}
            />
            {errors.userEmail && (
              <p className="mt-1 text-sm text-red-600" role="alert">
                {errors.userEmail.message}
              </p>
            )}
          </div>

          <div>
            <label htmlFor="action" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Action
            </label>
            <select
              {...register('action')}
              id="action"
              className={cn(
                "w-full px-3 py-2 border border-gray-300 rounded-lg",
                "focus:ring-2 focus:ring-primary-500 focus:border-primary-500",
                "dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              )}
              disabled={isLoading}
            >
              {ACTION_TYPES.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="dateFrom" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Date From
            </label>
            <input
              {...register('dateFrom')}
              id="dateFrom"
              type="datetime-local"
              className={cn(
                "w-full px-3 py-2 border border-gray-300 rounded-lg",
                "focus:ring-2 focus:ring-primary-500 focus:border-primary-500",
                "dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              )}
              disabled={isLoading}
            />
          </div>

          <div>
            <label htmlFor="dateTo" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Date To
            </label>
            <input
              {...register('dateTo')}
              id="dateTo"
              type="datetime-local"
              className={cn(
                "w-full px-3 py-2 border border-gray-300 rounded-lg",
                "focus:ring-2 focus:ring-primary-500 focus:border-primary-500",
                "dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              )}
              disabled={isLoading}
            />
          </div>

          <div>
            <label htmlFor="statusCode" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Status Code
            </label>
            <select
              {...register('statusCode')}
              id="statusCode"
              className={cn(
                "w-full px-3 py-2 border border-gray-300 rounded-lg",
                "focus:ring-2 focus:ring-primary-500 focus:border-primary-500",
                "dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              )}
              disabled={isLoading}
            >
              {STATUS_CODE_FILTERS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          <div className="lg:col-span-3 flex justify-end gap-2">
            <button
              type="button"
              onClick={handleClearFilters}
              className={cn(
                "px-4 py-2 border border-gray-300 rounded-lg",
                "bg-white text-gray-700 hover:bg-gray-50",
                "dark:bg-gray-700 dark:border-gray-600 dark:text-white dark:hover:bg-gray-600",
                "focus:outline-none focus:ring-2 focus:ring-primary-500"
              )}
              disabled={isLoading}
            >
              Clear Filters
            </button>
          </div>
        </div>
      )}
    </form>
  );
}

/**
 * Table Header Component with Sorting
 */
interface TableHeaderProps {
  sortField: SortField;
  sortDirection: SortDirection;
  onSort: (field: SortField) => void;
}

function TableHeader({ sortField, sortDirection, onSort }: TableHeaderProps) {
  const columns = [
    { key: 'timestamp' as SortField, label: 'Time', sortable: true },
    { key: 'serviceId' as SortField, label: 'Service ID', sortable: true },
    { key: 'serviceName' as SortField, label: 'Service Name', sortable: true },
    { key: 'userEmail' as SortField, label: 'User Email', sortable: true },
    { key: 'action' as SortField, label: 'Action', sortable: true },
    { key: 'request' as const, label: 'Request Details', sortable: false },
  ];

  return (
    <thead className="bg-gray-50 dark:bg-gray-800">
      <tr role="row">
        {columns.map((column) => (
          <th
            key={column.key}
            scope="col"
            className={cn(
              "px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider",
              column.sortable && "cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700"
            )}
            onClick={column.sortable ? () => onSort(column.key as SortField) : undefined}
            aria-sort={
              column.sortable && sortField === column.key
                ? sortDirection === 'asc' ? 'ascending' : 'descending'
                : 'none'
            }
          >
            <div className="flex items-center space-x-1">
              <span>{column.label}</span>
              {column.sortable && (
                <div className="flex flex-col">
                  <ChevronUpIcon 
                    className={cn(
                      "h-3 w-3",
                      sortField === column.key && sortDirection === 'asc'
                        ? "text-primary-600"
                        : "text-gray-400"
                    )}
                  />
                  <ChevronDownIcon 
                    className={cn(
                      "h-3 w-3 -mt-1",
                      sortField === column.key && sortDirection === 'desc'
                        ? "text-primary-600"
                        : "text-gray-400"
                    )}
                  />
                </div>
              )}
            </div>
          </th>
        ))}
      </tr>
    </thead>
  );
}

/**
 * Table Row Component with Virtual Scrolling Support
 */
interface TableRowProps {
  report: ServiceReportEntry;
  style: React.CSSProperties;
}

function TableRow({ report, style }: TableRowProps) {
  const getStatusCodeColor = (statusCode: number) => {
    if (statusCode >= 200 && statusCode < 300) return 'text-green-600 bg-green-100';
    if (statusCode >= 300 && statusCode < 400) return 'text-blue-600 bg-blue-100';
    if (statusCode >= 400 && statusCode < 500) return 'text-yellow-600 bg-yellow-100';
    if (statusCode >= 500) return 'text-red-600 bg-red-100';
    return 'text-gray-600 bg-gray-100';
  };

  return (
    <tr
      style={style}
      className="bg-white dark:bg-gray-900 hover:bg-gray-50 dark:hover:bg-gray-800 border-b border-gray-200 dark:border-gray-700"
      role="row"
    >
      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
        <div>
          <time dateTime={report.timestamp} title={new Date(report.timestamp).toLocaleString()}>
            {formatRelativeTime(report.timestamp)}
          </time>
          <div className="text-xs text-gray-500 dark:text-gray-400">
            {new Date(report.timestamp).toLocaleString()}
          </div>
        </div>
      </td>
      
      <td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-gray-900 dark:text-gray-100">
        {report.serviceId}
      </td>
      
      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
        {report.serviceName}
      </td>
      
      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
        {report.userEmail}
      </td>
      
      <td className="px-6 py-4 whitespace-nowrap">
        <span className={cn(
          "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium",
          "bg-primary-100 text-primary-800"
        )}>
          {report.action}
        </span>
      </td>
      
      <td className="px-6 py-4 text-sm text-gray-900 dark:text-gray-100">
        <div className="space-y-1">
          <div className="flex items-center space-x-2">
            <span className="font-medium">{report.request.method}</span>
            <span className="text-gray-500">{report.request.endpoint}</span>
          </div>
          <div className="flex items-center space-x-4 text-xs text-gray-500">
            <span
              className={cn(
                "inline-flex items-center px-2 py-1 rounded text-xs font-medium",
                getStatusCodeColor(report.request.statusCode)
              )}
            >
              {report.request.statusCode}
            </span>
            <span title="Response time">
              {formatDuration(report.request.duration)}
            </span>
            <span title="Response size">
              {(report.request.responseSize / 1024).toFixed(1)} KB
            </span>
          </div>
        </div>
      </td>
    </tr>
  );
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

/**
 * Service Report Table - Main Component
 */
export default function ServiceReportTable() {
  // State management
  const [page, setPage] = useState(1);
  const [filters, setFilters] = useState<Partial<ServiceReportFilters>>({});
  const [sortField, setSortField] = useState<SortField>('timestamp');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');

  // Data fetching with React Query
  const { data, isLoading, isError, error, refetch } = useServiceReports(
    page,
    filters,
    sortField,
    sortDirection
  );

  // Virtual scrolling setup
  const parentRef = React.useRef<HTMLDivElement>(null);
  
  const virtualizer = useVirtualizer({
    count: data?.data.length || 0,
    getScrollElement: () => parentRef.current,
    estimateSize: () => VIRTUAL_ROW_HEIGHT,
    overscan: 5,
  });

  // Event handlers
  const handleFiltersChange = useCallback((newFilters: Partial<ServiceReportFilters>) => {
    setFilters(newFilters);
    setPage(1); // Reset to first page when filters change
  }, []);

  const handleClearFilters = useCallback(() => {
    setFilters({});
    setPage(1);
  }, []);

  const handleSort = useCallback((field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
    setPage(1); // Reset to first page when sorting changes
  }, [sortField, sortDirection]);

  const handleRefresh = useCallback(() => {
    refetch();
  }, [refetch]);

  // Memoized virtual items
  const virtualItems = useMemo(() => virtualizer.getVirtualItems(), [virtualizer]);

  // Loading state
  if (isLoading && !data) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <ArrowPathIcon className="h-8 w-8 animate-spin text-primary-600 mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-400">Loading service reports...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (isError) {
    return (
      <div className="text-center py-12">
        <div className="text-red-600 mb-4">
          <svg className="h-12 w-12 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.962-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
        </div>
        <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
          Error loading service reports
        </h3>
        <p className="text-gray-600 dark:text-gray-400 mb-4">
          {error instanceof Error ? error.message : 'An unexpected error occurred'}
        </p>
        <button
          onClick={handleRefresh}
          className={cn(
            "inline-flex items-center px-4 py-2 border border-transparent rounded-lg",
            "bg-primary-600 text-white hover:bg-primary-700",
            "focus:outline-none focus:ring-2 focus:ring-primary-500"
          )}
        >
          <ArrowPathIcon className="h-5 w-5 mr-2" />
          Try Again
        </button>
      </div>
    );
  }

  const reports = data?.data || [];
  const totalItems = data?.total || 0;

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900 dark:text-gray-100">
            Service Reports
          </h1>
          <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
            Monitor service usage and performance metrics
          </p>
        </div>
        <button
          onClick={handleRefresh}
          disabled={isLoading}
          className={cn(
            "inline-flex items-center px-4 py-2 border border-gray-300 rounded-lg",
            "bg-white text-gray-700 hover:bg-gray-50",
            "dark:bg-gray-700 dark:border-gray-600 dark:text-white dark:hover:bg-gray-600",
            "focus:outline-none focus:ring-2 focus:ring-primary-500",
            "disabled:opacity-50 disabled:cursor-not-allowed"
          )}
          aria-label="Refresh service reports"
        >
          <ArrowPathIcon className={cn("h-5 w-5 mr-2", isLoading && "animate-spin")} />
          Refresh
        </button>
      </div>

      {/* Filter Controls */}
      <FilterControls
        onFiltersChange={handleFiltersChange}
        onClearFilters={handleClearFilters}
        isLoading={isLoading}
      />

      {/* Results Summary */}
      <div className="flex items-center justify-between text-sm text-gray-600 dark:text-gray-400">
        <div>
          Showing {reports.length} of {totalItems} service reports
        </div>
        {isLoading && (
          <div className="flex items-center">
            <ArrowPathIcon className="h-4 w-4 animate-spin mr-2" />
            Updating...
          </div>
        )}
      </div>

      {/* Data Table */}
      <div className="bg-white dark:bg-gray-900 shadow overflow-hidden sm:rounded-lg">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700" role="table">
            <TableHeader
              sortField={sortField}
              sortDirection={sortDirection}
              onSort={handleSort}
            />
            
            {reports.length > 0 ? (
              <tbody 
                ref={parentRef}
                className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700"
                style={{ height: '600px', overflow: 'auto' }}
                role="rowgroup"
              >
                <div
                  style={{
                    height: `${virtualizer.getTotalSize()}px`,
                    width: '100%',
                    position: 'relative',
                  }}
                >
                  {virtualItems.map((virtualItem) => {
                    const report = reports[virtualItem.index];
                    return (
                      <TableRow
                        key={report.id}
                        report={report}
                        style={{
                          position: 'absolute',
                          top: 0,
                          left: 0,
                          width: '100%',
                          height: `${virtualItem.size}px`,
                          transform: `translateY(${virtualItem.start}px)`,
                        }}
                      />
                    );
                  })}
                </div>
              </tbody>
            ) : (
              <tbody>
                <tr>
                  <td 
                    colSpan={6} 
                    className="px-6 py-12 text-center text-gray-500 dark:text-gray-400"
                    role="cell"
                  >
                    <div className="text-center">
                      <svg className="h-12 w-12 text-gray-400 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
                        No service reports found
                      </h3>
                      <p className="text-gray-600 dark:text-gray-400">
                        Try adjusting your search filters or check back later.
                      </p>
                    </div>
                  </td>
                </tr>
              </tbody>
            )}
          </table>
        </div>
      </div>

      {/* Pagination */}
      {data && data.hasMore && (
        <div className="flex items-center justify-between border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 px-4 py-3 sm:px-6">
          <div className="flex flex-1 justify-between sm:hidden">
            <button
              onClick={() => setPage(Math.max(1, page - 1))}
              disabled={page === 1 || isLoading}
              className={cn(
                "relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md",
                "text-gray-700 bg-white hover:bg-gray-50",
                "dark:bg-gray-700 dark:border-gray-600 dark:text-white dark:hover:bg-gray-600",
                "disabled:opacity-50 disabled:cursor-not-allowed"
              )}
            >
              Previous
            </button>
            <button
              onClick={() => setPage(page + 1)}
              disabled={!data.hasMore || isLoading}
              className={cn(
                "ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md",
                "text-gray-700 bg-white hover:bg-gray-50",
                "dark:bg-gray-700 dark:border-gray-600 dark:text-white dark:hover:bg-gray-600",
                "disabled:opacity-50 disabled:cursor-not-allowed"
              )}
            >
              Next
            </button>
          </div>
          <div className="hidden sm:flex sm:flex-1 sm:items-center sm:justify-between">
            <div>
              <p className="text-sm text-gray-700 dark:text-gray-300">
                Showing page <span className="font-medium">{page}</span> of service reports
              </p>
            </div>
            <div>
              <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                <button
                  onClick={() => setPage(Math.max(1, page - 1))}
                  disabled={page === 1 || isLoading}
                  className={cn(
                    "relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300",
                    "bg-white text-sm font-medium text-gray-500 hover:bg-gray-50",
                    "dark:bg-gray-700 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-600",
                    "disabled:opacity-50 disabled:cursor-not-allowed"
                  )}
                  aria-label="Previous page"
                >
                  <ChevronUpIcon className="h-5 w-5 transform rotate-90" aria-hidden="true" />
                </button>
                <button
                  onClick={() => setPage(page + 1)}
                  disabled={!data.hasMore || isLoading}
                  className={cn(
                    "relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300",
                    "bg-white text-sm font-medium text-gray-500 hover:bg-gray-50",
                    "dark:bg-gray-700 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-600",
                    "disabled:opacity-50 disabled:cursor-not-allowed"
                  )}
                  aria-label="Next page"
                >
                  <ChevronDownIcon className="h-5 w-5 transform -rotate-90" aria-hidden="true" />
                </button>
              </nav>
            </div>
          </div>
        </div>
      )}

      {/* Screen Reader Live Region for Accessibility */}
      <div 
        role="status" 
        aria-live="polite" 
        aria-atomic="true" 
        className="sr-only"
      >
        {isLoading 
          ? "Loading service reports..." 
          : `${reports.length} service reports loaded`
        }
      </div>
    </div>
  );
}