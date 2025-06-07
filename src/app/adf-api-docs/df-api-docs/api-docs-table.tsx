'use client';

import React, { useMemo, useState, useCallback, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useVirtualizer } from '@tanstack/react-virtual';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Dialog, Menu, Transition } from '@headlessui/react';
import { 
  ChevronDownIcon, 
  EllipsisVerticalIcon,
  MagnifyingGlassIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  XMarkIcon,
  ArrowUpIcon,
  ArrowDownIcon,
  RefreshIcon,
  PlusIcon
} from '@heroicons/react/24/outline';
import { CheckCircleIcon as CheckCircleIconSolid, XCircleIcon } from '@heroicons/react/24/solid';

// Types based on the Angular implementation
interface ServiceType {
  name: string;
  label: string;
  description: string;
  group: string;
  class?: string;
}

interface Service {
  id: number;
  name: string;
  label: string;
  description: string;
  isActive: boolean;
  type: string;
  mutable: boolean;
  deletable: boolean;
  createdDate: string;
  lastModifiedDate: string;
  createdById: number | null;
  lastModifiedById: number | null;
  config: any;
  serviceDocByServiceId: number | null;
  refresh: boolean;
}

interface ApiDocsRowData {
  name: string;
  label: string;
  description: string;
  group: string;
  type: string;
}

interface GenericListResponse<T> {
  resource: T[];
  meta: {
    count: number;
    offset?: number;
    limit?: number;
  };
}

interface Column<T> {
  columnDef: string;
  header?: string;
  cell: (row: T) => React.ReactNode;
  sortable?: boolean;
  width?: string;
}

interface PaginationInfo {
  page: number;
  pageSize: number;
  total: number;
}

interface SortInfo {
  column: string;
  direction: 'asc' | 'desc' | null;
}

// Custom hooks that would normally be imported

// Mock pagination hook - would normally come from src/hooks/use-pagination.ts
const usePagination = (total: number, initialPageSize: number = 25) => {
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(initialPageSize);
  
  const totalPages = Math.ceil(total / pageSize);
  const offset = page * pageSize;
  
  return {
    page,
    pageSize,
    offset,
    totalPages,
    setPage,
    setPageSize,
    pagination: { page, pageSize, total }
  };
};

// Mock services hook - would normally come from src/hooks/use-services.ts  
const useServices = (options?: {
  limit?: number;
  offset?: number;
  filter?: string;
}) => {
  return useQuery({
    queryKey: ['services', options],
    queryFn: async () => {
      // Mock API call - would normally use actual API client
      const params = new URLSearchParams();
      if (options?.limit) params.append('limit', options.limit.toString());
      if (options?.offset) params.append('offset', options.offset.toString());
      if (options?.filter) params.append('filter', options.filter);
      
      // This would be replaced with actual API call
      await new Promise(resolve => setTimeout(resolve, 100)); // Simulate network delay
      
      return {
        resource: [] as Service[],
        meta: { count: 0 }
      } as GenericListResponse<Service>;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    cacheTime: 10 * 60 * 1000, // 10 minutes
  });
};

// Filter query utility - would normally come from src/utils/filter-queries.ts
const getApiDocsFilterQuery = (value: string): string => {
  return `(name like "%${value}%") or (label like "%${value}%") or (description like "%${value}%")`;
};

// Main component
interface ApiDocsTableProps {
  serviceTypes?: ServiceType[];
  className?: string;
}

export function ApiDocsTable({ serviceTypes = [], className = '' }: ApiDocsTableProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const queryClient = useQueryClient();
  
  // State management
  const [searchFilter, setSearchFilter] = useState('');
  const [debouncedFilter, setDebouncedFilter] = useState('');
  const [sortInfo, setSortInfo] = useState<SortInfo>({ column: '', direction: null });
  const [isRefreshing, setIsRefreshing] = useState(false);
  
  // Pagination
  const { page, pageSize, offset, setPage, setPageSize, pagination } = usePagination(0, 25);
  
  // Debounce search filter
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedFilter(searchFilter);
    }, 1000);
    
    return () => clearTimeout(timer);
  }, [searchFilter]);
  
  // Data fetching with React Query
  const {
    data: servicesResponse,
    isLoading,
    error,
    refetch
  } = useServices({
    limit: pageSize,
    offset,
    filter: debouncedFilter ? `(type not like "%swagger%") and ${getApiDocsFilterQuery(debouncedFilter)}` : '(type not like "%swagger%")'
  });
  
  // Transform data for table display
  const tableData = useMemo((): ApiDocsRowData[] => {
    if (!servicesResponse?.resource) return [];
    
    const filteredData = servicesResponse.resource
      .filter(service => service.isActive === true)
      .sort((a, b) => a.name.localeCompare(b.name));
    
    return filteredData.map(service => {
      const serviceType = serviceTypes.find(type => type.name === service.type);
      return {
        name: service.name,
        description: service.description,
        group: serviceType?.group ?? '',
        label: service.label,
        type: serviceType?.label ?? '',
      };
    });
  }, [servicesResponse?.resource, serviceTypes]);
  
  // Update pagination total
  const totalCount = servicesResponse?.meta?.count ?? 0;
  
  // Column definitions
  const columns: Column<ApiDocsRowData>[] = useMemo(() => [
    {
      columnDef: 'name',
      header: 'Name',
      cell: (row) => row.name,
      sortable: true,
      width: 'w-1/5'
    },
    {
      columnDef: 'label', 
      header: 'Label',
      cell: (row) => row.label,
      sortable: true,
      width: 'w-1/5'
    },
    {
      columnDef: 'description',
      header: 'Description', 
      cell: (row) => row.description,
      sortable: true,
      width: 'w-2/5'
    },
    {
      columnDef: 'group',
      header: 'Group',
      cell: (row) => row.group,
      sortable: true,
      width: 'w-1/6'
    },
    {
      columnDef: 'type',
      header: 'Type',
      cell: (row) => row.type,
      sortable: true,
      width: 'w-1/6'
    }
  ], []);
  
  // Virtual scrolling setup for performance with large datasets
  const parentRef = React.useRef<HTMLDivElement>(null);
  
  const virtualizer = useVirtualizer({
    count: tableData.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 60, // Estimated row height in pixels
    overscan: 10, // Render extra items for smooth scrolling
  });
  
  // Event handlers
  const handleSort = useCallback((column: string) => {
    setSortInfo(prev => ({
      column,
      direction: prev.column === column && prev.direction === 'asc' 
        ? 'desc' 
        : prev.column === column && prev.direction === 'desc'
        ? null
        : 'asc'
    }));
  }, []);
  
  const handleRowClick = useCallback((row: ApiDocsRowData) => {
    router.push(`/adf-api-docs/df-api-docs/${row.name}`);
  }, [router]);
  
  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    try {
      await refetch();
    } finally {
      setIsRefreshing(false);
    }
  }, [refetch]);
  
  const handleKeyDown = useCallback((event: React.KeyboardEvent, row: ApiDocsRowData) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      handleRowClick(row);
    }
  }, [handleRowClick]);
  
  // Pagination handlers
  const handlePageChange = useCallback((newPage: number) => {
    setPage(newPage);
  }, [setPage]);
  
  const handlePageSizeChange = useCallback((newPageSize: number) => {
    setPageSize(newPageSize);
    setPage(0); // Reset to first page
  }, [setPageSize, setPage]);
  
  // Apply sorting to data
  const sortedData = useMemo(() => {
    if (!sortInfo.column || !sortInfo.direction) return tableData;
    
    return [...tableData].sort((a, b) => {
      const aValue = String(a[sortInfo.column as keyof ApiDocsRowData] || '');
      const bValue = String(b[sortInfo.column as keyof ApiDocsRowData] || '');
      
      const comparison = aValue.localeCompare(bValue);
      return sortInfo.direction === 'asc' ? comparison : -comparison;
    });
  }, [tableData, sortInfo]);
  
  const getSortIcon = useCallback((column: string) => {
    if (sortInfo.column !== column) return null;
    return sortInfo.direction === 'asc' 
      ? <ArrowUpIcon className="w-4 h-4 ml-1" />
      : <ArrowDownIcon className="w-4 h-4 ml-1" />;
  }, [sortInfo]);
  
  return (
    <div className={`bg-white dark:bg-gray-900 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 ${className}`}>
      {/* Top Action Bar */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center space-x-3">
          <button
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="inline-flex items-center p-2 border border-gray-300 rounded-md shadow-sm bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 disabled:opacity-50 disabled:cursor-not-allowed dark:bg-gray-800 dark:border-gray-600 dark:hover:bg-gray-700"
            aria-label="Refresh table data"
          >
            <RefreshIcon className={`w-5 h-5 text-gray-500 ${isRefreshing ? 'animate-spin' : ''}`} />
          </button>
        </div>
        
        <div className="flex items-center space-x-3">
          {/* Search Input */}
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="text"
              value={searchFilter}
              onChange={(e) => setSearchFilter(e.target.value)}
              className="block w-64 pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-800 dark:border-gray-600 dark:text-white dark:placeholder-gray-400"
              placeholder="Search..."
            />
          </div>
        </div>
      </div>
      
      {/* Table Container with Virtual Scrolling */}
      <div className="overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500"></div>
            <span className="ml-3 text-gray-600 dark:text-gray-400">Loading...</span>
          </div>
        ) : error ? (
          <div className="flex items-center justify-center py-12 text-red-600 dark:text-red-400">
            <ExclamationTriangleIcon className="w-5 h-5 mr-2" />
            Error loading data
          </div>
        ) : sortedData.length === 0 ? (
          <div className="text-center py-12 text-gray-500 dark:text-gray-400">
            No entries found
          </div>
        ) : (
          <>
            {/* Table Header */}
            <div className="bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
              <div className="grid grid-cols-5 gap-4 px-6 py-3">
                {columns.map((column) => (
                  <div
                    key={column.columnDef}
                    className={`${column.width || 'w-full'} text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider`}
                  >
                    {column.sortable ? (
                      <button
                        onClick={() => handleSort(column.columnDef)}
                        className="flex items-center hover:text-gray-700 dark:hover:text-gray-200 focus:outline-none"
                        aria-label={`Sort by ${column.header}`}
                      >
                        {column.header}
                        {getSortIcon(column.columnDef)}
                      </button>
                    ) : (
                      column.header
                    )}
                  </div>
                ))}
              </div>
            </div>
            
            {/* Virtual Scrolling Container */}
            <div
              ref={parentRef}
              className="h-96 overflow-auto"
              style={{ height: '400px' }}
            >
              <div
                style={{
                  height: `${virtualizer.getTotalSize()}px`,
                  width: '100%',
                  position: 'relative',
                }}
              >
                {virtualizer.getVirtualItems().map((virtualRow) => {
                  const row = sortedData[virtualRow.index];
                  return (
                    <div
                      key={virtualRow.index}
                      style={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        width: '100%',
                        height: `${virtualRow.size}px`,
                        transform: `translateY(${virtualRow.start}px)`,
                      }}
                      className="grid grid-cols-5 gap-4 px-6 py-4 border-b border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer focus:outline-none focus:bg-gray-50 dark:focus:bg-gray-800"
                      onClick={() => handleRowClick(row)}
                      onKeyDown={(e) => handleKeyDown(e, row)}
                      tabIndex={0}
                      role="row"
                      aria-label={`View details for ${row.name}`}
                    >
                      {columns.map((column) => (
                        <div
                          key={column.columnDef}
                          className={`${column.width || 'w-full'} text-sm text-gray-900 dark:text-gray-100 truncate`}
                        >
                          {column.cell(row)}
                        </div>
                      ))}
                    </div>
                  );
                })}
              </div>
            </div>
          </>
        )}
      </div>
      
      {/* Pagination */}
      {!isLoading && !error && sortedData.length > 0 && (
        <div className="bg-white dark:bg-gray-900 px-4 py-3 border-t border-gray-200 dark:border-gray-700 sm:px-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <span className="text-sm text-gray-700 dark:text-gray-300">
                Showing {offset + 1} to {Math.min(offset + pageSize, totalCount)} of {totalCount} results
              </span>
            </div>
            
            <div className="flex items-center space-x-4">
              {/* Page Size Selector */}
              <div className="flex items-center space-x-2">
                <label htmlFor="pageSize" className="text-sm text-gray-700 dark:text-gray-300">
                  Show:
                </label>
                <select
                  id="pageSize"
                  value={pageSize}
                  onChange={(e) => handlePageSizeChange(Number(e.target.value))}
                  className="border border-gray-300 rounded-md px-3 py-1 text-sm dark:bg-gray-800 dark:border-gray-600 dark:text-white"
                >
                  <option value={10}>10</option>
                  <option value={25}>25</option>
                  <option value={50}>50</option>
                  <option value={100}>100</option>
                </select>
              </div>
              
              {/* Pagination Controls */}
              <div className="flex items-center space-x-1">
                <button
                  onClick={() => handlePageChange(0)}
                  disabled={page === 0}
                  className="px-3 py-1 text-sm border border-gray-300 rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 dark:border-gray-600 dark:hover:bg-gray-800"
                >
                  First
                </button>
                <button
                  onClick={() => handlePageChange(page - 1)}
                  disabled={page === 0}
                  className="px-3 py-1 text-sm border border-gray-300 rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 dark:border-gray-600 dark:hover:bg-gray-800"
                >
                  Previous
                </button>
                <span className="px-3 py-1 text-sm text-gray-700 dark:text-gray-300">
                  Page {page + 1} of {Math.ceil(totalCount / pageSize)}
                </span>
                <button
                  onClick={() => handlePageChange(page + 1)}
                  disabled={page >= Math.ceil(totalCount / pageSize) - 1}
                  className="px-3 py-1 text-sm border border-gray-300 rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 dark:border-gray-600 dark:hover:bg-gray-800"
                >
                  Next
                </button>
                <button
                  onClick={() => handlePageChange(Math.ceil(totalCount / pageSize) - 1)}
                  disabled={page >= Math.ceil(totalCount / pageSize) - 1}
                  className="px-3 py-1 text-sm border border-gray-300 rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 dark:border-gray-600 dark:hover:bg-gray-800"
                >
                  Last
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default ApiDocsTable;