/**
 * Cache Table Component
 * 
 * React table component for displaying and managing system and per-service cache entries.
 * Implements virtual scrolling for performance with large datasets, cache refresh functionality,
 * delete operations, and real-time cache status updates using SWR for intelligent caching
 * and synchronization.
 * 
 * Features:
 * - TanStack Virtual for performance optimization with large datasets
 * - SWR/React Query for intelligent caching and synchronization
 * - WCAG 2.1 AA accessibility compliance with keyboard navigation
 * - Real-time cache status updates with optimistic UI updates
 * - Comprehensive error handling and loading states
 * - Responsive design with Tailwind CSS styling
 * 
 * @author DreamFactory Admin Interface Team
 * @version React 19/Next.js 15.1 Migration
 */

'use client';

import React, { 
  useState, 
  useMemo, 
  useCallback, 
  useRef, 
  useId,
  useTransition,
  KeyboardEvent,
  forwardRef
} from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
import { useSWR, mutate } from 'swr';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { 
  Trash2, 
  RefreshCw, 
  Search, 
  Database,
  Clock,
  HardDrive,
  AlertCircle,
  CheckCircle,
  Loader2,
  ChevronDown,
  ChevronUp,
  Filter,
  X
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { apiClient } from '@/lib/api-client';

// MSW integration for development API mocking
if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
  import('@/mocks/browser').then(({ worker }) => {
    if (!worker.listHandlers().length) {
      worker.start({
        onUnhandledRequest: 'bypass',
        quiet: true,
      });
    }
  });
}

/**
 * Cache Entry Interface
 * Represents individual cache entries with metadata
 */
interface CacheEntry {
  id: string;
  key: string;
  service?: string;
  type: 'system' | 'service' | 'schema' | 'api';
  size: number;
  created: string;
  lastAccessed: string;
  ttl?: number;
  hitCount: number;
  status: 'active' | 'expired' | 'invalidated';
}

/**
 * Cache Statistics Interface
 * Provides cache performance metrics
 */
interface CacheStats {
  totalEntries: number;
  totalSize: number;
  hitRate: number;
  missRate: number;
  lastCleared?: string;
}

/**
 * Filter Schema for cache table filtering
 */
const filterSchema = z.object({
  search: z.string().optional(),
  type: z.enum(['all', 'system', 'service', 'schema', 'api']).default('all'),
  status: z.enum(['all', 'active', 'expired', 'invalidated']).default('all'),
  service: z.string().optional(),
});

type FilterFormData = z.infer<typeof filterSchema>;

/**
 * Cache Table Props Interface
 */
interface CacheTableProps {
  className?: string;
  onEntrySelect?: (entry: CacheEntry) => void;
  onBulkDelete?: (entries: CacheEntry[]) => void;
  initialFilters?: Partial<FilterFormData>;
  pageSize?: number;
}

/**
 * Cache data fetcher function
 */
const fetchCacheEntries = async (filters: FilterFormData): Promise<{
  entries: CacheEntry[];
  stats: CacheStats;
}> => {
  const searchParams = new URLSearchParams();
  
  if (filters.search) searchParams.set('search', filters.search);
  if (filters.type !== 'all') searchParams.set('type', filters.type);
  if (filters.status !== 'all') searchParams.set('status', filters.status);
  if (filters.service) searchParams.set('service', filters.service);
  
  const response = await apiClient.get(
    `/system/cache/entries?${searchParams.toString()}`
  );
  
  return response;
};

/**
 * Delete cache entry function
 */
const deleteCacheEntry = async (entryId: string): Promise<void> => {
  await apiClient.post(`/system/cache/delete`, { id: entryId });
};

/**
 * Bulk delete cache entries function
 */
const bulkDeleteCacheEntries = async (entryIds: string[]): Promise<void> => {
  await apiClient.post(`/system/cache/bulk-delete`, { ids: entryIds });
};

/**
 * Clear all cache function
 */
const clearAllCache = async (): Promise<void> => {
  await apiClient.post(`/system/cache/clear`);
};

/**
 * Cache Table Component
 */
export const CacheTable = forwardRef<HTMLDivElement, CacheTableProps>(({
  className,
  onEntrySelect,
  onBulkDelete,
  initialFilters = {},
  pageSize = 50
}, ref) => {
  const tableId = useId();
  const captionId = useId();
  const parentRef = useRef<HTMLDivElement>(null);
  const [isPending, startTransition] = useTransition();
  
  // Form state for filters
  const filterForm = useForm<FilterFormData>({
    resolver: zodResolver(filterSchema),
    defaultValues: {
      search: '',
      type: 'all',
      status: 'all',
      service: '',
      ...initialFilters
    }
  });

  const filters = filterForm.watch();
  
  // Selection state
  const [selectedEntries, setSelectedEntries] = useState<Set<string>>(new Set());
  const [sortColumn, setSortColumn] = useState<keyof CacheEntry>('lastAccessed');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [showFilters, setShowFilters] = useState(false);

  // Data fetching with SWR
  const cacheKey = ['cache-entries', filters];
  const { 
    data, 
    error, 
    isLoading, 
    mutate: refreshCache 
  } = useSWR(
    cacheKey, 
    () => fetchCacheEntries(filters),
    {
      refreshInterval: 10000, // Refresh every 10 seconds
      revalidateOnFocus: true,
      dedupingInterval: 2000,
      errorRetryCount: 3,
    }
  );

  // Processed and sorted data
  const sortedEntries = useMemo(() => {
    if (!data?.entries) return [];
    
    return [...data.entries].sort((a, b) => {
      const aValue = a[sortColumn];
      const bValue = b[sortColumn];
      
      if (typeof aValue === 'string' && typeof bValue === 'string') {
        const comparison = aValue.localeCompare(bValue);
        return sortDirection === 'asc' ? comparison : -comparison;
      }
      
      if (typeof aValue === 'number' && typeof bValue === 'number') {
        return sortDirection === 'asc' ? aValue - bValue : bValue - aValue;
      }
      
      return 0;
    });
  }, [data?.entries, sortColumn, sortDirection]);

  // Virtual scrolling setup
  const virtualizer = useVirtualizer({
    count: sortedEntries.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 56, // Estimated row height
    overscan: 10,
  });

  // Event handlers
  const handleSort = useCallback((column: keyof CacheEntry) => {
    startTransition(() => {
      if (sortColumn === column) {
        setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
      } else {
        setSortColumn(column);
        setSortDirection('desc');
      }
    });
  }, [sortColumn]);

  const handleSelectEntry = useCallback((entryId: string, selected: boolean) => {
    startTransition(() => {
      setSelectedEntries(prev => {
        const newSelected = new Set(prev);
        if (selected) {
          newSelected.add(entryId);
        } else {
          newSelected.delete(entryId);
        }
        return newSelected;
      });
    });
  }, []);

  const handleSelectAll = useCallback((selected: boolean) => {
    startTransition(() => {
      if (selected) {
        setSelectedEntries(new Set(sortedEntries.map(entry => entry.id)));
      } else {
        setSelectedEntries(new Set());
      }
    });
  }, [sortedEntries]);

  const handleDeleteEntry = useCallback(async (entry: CacheEntry) => {
    try {
      await deleteCacheEntry(entry.id);
      await refreshCache();
      
      // Remove from selection if selected
      setSelectedEntries(prev => {
        const newSelected = new Set(prev);
        newSelected.delete(entry.id);
        return newSelected;
      });
    } catch (error) {
      console.error('Failed to delete cache entry:', error);
      // Error handling would typically show a toast notification
    }
  }, [refreshCache]);

  const handleBulkDelete = useCallback(async () => {
    if (selectedEntries.size === 0) return;
    
    try {
      await bulkDeleteCacheEntries(Array.from(selectedEntries));
      await refreshCache();
      setSelectedEntries(new Set());
      
      if (onBulkDelete) {
        const deletedEntries = sortedEntries.filter(entry => 
          selectedEntries.has(entry.id)
        );
        onBulkDelete(deletedEntries);
      }
    } catch (error) {
      console.error('Failed to bulk delete cache entries:', error);
    }
  }, [selectedEntries, sortedEntries, onBulkDelete, refreshCache]);

  const handleClearAll = useCallback(async () => {
    try {
      await clearAllCache();
      await refreshCache();
      setSelectedEntries(new Set());
    } catch (error) {
      console.error('Failed to clear all cache:', error);
    }
  }, [refreshCache]);

  const handleKeyDown = useCallback((event: KeyboardEvent<HTMLTableRowElement>, entryIndex: number) => {
    const entry = sortedEntries[entryIndex];
    
    switch (event.key) {
      case 'ArrowDown':
        event.preventDefault();
        if (entryIndex < sortedEntries.length - 1) {
          const nextRow = parentRef.current?.querySelector(
            `[data-row-index="${entryIndex + 1}"]`
          ) as HTMLTableRowElement;
          nextRow?.focus();
        }
        break;
        
      case 'ArrowUp':
        event.preventDefault();
        if (entryIndex > 0) {
          const prevRow = parentRef.current?.querySelector(
            `[data-row-index="${entryIndex - 1}"]`
          ) as HTMLTableRowElement;
          prevRow?.focus();
        }
        break;
        
      case 'Enter':
      case ' ':
        event.preventDefault();
        onEntrySelect?.(entry);
        break;
        
      case 'Delete':
        event.preventDefault();
        handleDeleteEntry(entry);
        break;
    }
  }, [sortedEntries, onEntrySelect, handleDeleteEntry]);

  // Format bytes helper
  const formatBytes = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
  };

  // Format relative time helper
  const formatRelativeTime = (dateString: string): string => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffMins < 1440) return `${Math.floor(diffMins / 60)}h ago`;
    return `${Math.floor(diffMins / 1440)}d ago`;
  };

  // Column definitions
  const columns = [
    {
      key: 'select' as const,
      header: (
        <input
          type="checkbox"
          checked={selectedEntries.size === sortedEntries.length && sortedEntries.length > 0}
          onChange={(e) => handleSelectAll(e.target.checked)}
          className="rounded border-gray-300 dark:border-gray-600 text-primary-600 focus:ring-primary-500"
          aria-label="Select all cache entries"
        />
      ),
      cell: (entry: CacheEntry) => (
        <input
          type="checkbox"
          checked={selectedEntries.has(entry.id)}
          onChange={(e) => handleSelectEntry(entry.id, e.target.checked)}
          className="rounded border-gray-300 dark:border-gray-600 text-primary-600 focus:ring-primary-500"
          aria-label={`Select cache entry ${entry.key}`}
        />
      ),
      sortable: false,
      width: '48px'
    },
    {
      key: 'key' as const,
      header: 'Cache Key',
      cell: (entry: CacheEntry) => (
        <div className="font-mono text-sm truncate max-w-xs" title={entry.key}>
          {entry.key}
        </div>
      ),
      sortable: true
    },
    {
      key: 'type' as const,
      header: 'Type',
      cell: (entry: CacheEntry) => (
        <span className={cn(
          "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium",
          {
            'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200': entry.type === 'system',
            'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200': entry.type === 'service',
            'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200': entry.type === 'schema',
            'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200': entry.type === 'api',
          }
        )}>
          {entry.type}
        </span>
      ),
      sortable: true,
      width: '100px'
    },
    {
      key: 'service' as const,
      header: 'Service',
      cell: (entry: CacheEntry) => (
        <span className="text-sm text-gray-600 dark:text-gray-400">
          {entry.service || '-'}
        </span>
      ),
      sortable: true,
      width: '120px'
    },
    {
      key: 'size' as const,
      header: 'Size',
      cell: (entry: CacheEntry) => (
        <span className="text-sm font-mono">
          {formatBytes(entry.size)}
        </span>
      ),
      sortable: true,
      width: '80px'
    },
    {
      key: 'hitCount' as const,
      header: 'Hits',
      cell: (entry: CacheEntry) => (
        <span className="text-sm">
          {entry.hitCount.toLocaleString()}
        </span>
      ),
      sortable: true,
      width: '80px'
    },
    {
      key: 'lastAccessed' as const,
      header: 'Last Accessed',
      cell: (entry: CacheEntry) => (
        <span className="text-sm text-gray-600 dark:text-gray-400">
          {formatRelativeTime(entry.lastAccessed)}
        </span>
      ),
      sortable: true,
      width: '120px'
    },
    {
      key: 'status' as const,
      header: 'Status',
      cell: (entry: CacheEntry) => (
        <div className="flex items-center space-x-1">
          {entry.status === 'active' && (
            <CheckCircle className="h-4 w-4 text-green-500" />
          )}
          {entry.status === 'expired' && (
            <Clock className="h-4 w-4 text-yellow-500" />
          )}
          {entry.status === 'invalidated' && (
            <AlertCircle className="h-4 w-4 text-red-500" />
          )}
          <span className="text-sm capitalize">{entry.status}</span>
        </div>
      ),
      sortable: true,
      width: '100px'
    },
    {
      key: 'actions' as const,
      header: 'Actions',
      cell: (entry: CacheEntry) => (
        <button
          onClick={() => handleDeleteEntry(entry)}
          className="p-1 text-gray-400 hover:text-red-600 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 rounded"
          aria-label={`Delete cache entry ${entry.key}`}
        >
          <Trash2 className="h-4 w-4" />
        </button>
      ),
      sortable: false,
      width: '80px'
    }
  ];

  if (error) {
    return (
      <div 
        className="flex flex-col items-center justify-center p-8 text-center"
        data-testid="cache-table-error"
      >
        <AlertCircle className="h-12 w-12 text-red-500 mb-4" />
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
          Failed to load cache data
        </h3>
        <p className="text-gray-600 dark:text-gray-400 mb-4">
          {error.message || 'An error occurred while fetching cache entries.'}
        </p>
        <button
          onClick={() => refreshCache()}
          className="inline-flex items-center px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
        >
          <RefreshCw className="h-4 w-4 mr-2" />
          Retry
        </button>
      </div>
    );
  }

  return (
    <div 
      ref={ref}
      className={cn("flex flex-col h-full bg-white dark:bg-gray-900", className)}
      data-testid="cache-table-container"
    >
      {/* Header with stats and actions */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
              Cache Management
            </h2>
            {data?.stats && (
              <div className="flex items-center space-x-4 text-sm text-gray-600 dark:text-gray-400">
                <div className="flex items-center space-x-1">
                  <Database className="h-4 w-4" />
                  <span>{data.stats.totalEntries} entries</span>
                </div>
                <div className="flex items-center space-x-1">
                  <HardDrive className="h-4 w-4" />
                  <span>{formatBytes(data.stats.totalSize)}</span>
                </div>
                <div>
                  Hit rate: {(data.stats.hitRate * 100).toFixed(1)}%
                </div>
              </div>
            )}
          </div>
          
          <div className="flex items-center space-x-2">
            {selectedEntries.size > 0 && (
              <button
                onClick={handleBulkDelete}
                className="inline-flex items-center px-3 py-1.5 bg-red-600 text-white text-sm rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
                data-testid="bulk-delete-button"
              >
                <Trash2 className="h-4 w-4 mr-1" />
                Delete Selected ({selectedEntries.size})
              </button>
            )}
            
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={cn(
                "inline-flex items-center px-3 py-1.5 text-sm rounded-md border focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2",
                showFilters 
                  ? "bg-primary-50 border-primary-200 text-primary-700 dark:bg-primary-900 dark:border-primary-700 dark:text-primary-200"
                  : "bg-white border-gray-300 text-gray-700 hover:bg-gray-50 dark:bg-gray-800 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
              )}
              data-testid="toggle-filters-button"
            >
              <Filter className="h-4 w-4 mr-1" />
              Filters
            </button>
            
            <button
              onClick={() => refreshCache()}
              disabled={isLoading}
              className="inline-flex items-center px-3 py-1.5 bg-primary-600 text-white text-sm rounded-md hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 disabled:opacity-50"
              data-testid="refresh-cache-button"
            >
              <RefreshCw className={cn("h-4 w-4 mr-1", isLoading && "animate-spin")} />
              Refresh
            </button>
            
            <button
              onClick={handleClearAll}
              className="inline-flex items-center px-3 py-1.5 bg-red-600 text-white text-sm rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
              data-testid="clear-all-button"
            >
              <Trash2 className="h-4 w-4 mr-1" />
              Clear All
            </button>
          </div>
        </div>

        {/* Filters */}
        {showFilters && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Search
              </label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  {...filterForm.register('search')}
                  type="text"
                  placeholder="Search cache keys..."
                  className="pl-10 pr-4 py-2 w-full border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  data-testid="search-input"
                />
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Type
              </label>
              <select
                {...filterForm.register('type')}
                className="w-full border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 py-2 px-3 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                data-testid="type-filter"
              >
                <option value="all">All Types</option>
                <option value="system">System</option>
                <option value="service">Service</option>
                <option value="schema">Schema</option>
                <option value="api">API</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Status
              </label>
              <select
                {...filterForm.register('status')}
                className="w-full border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 py-2 px-3 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                data-testid="status-filter"
              >
                <option value="all">All Status</option>
                <option value="active">Active</option>
                <option value="expired">Expired</option>
                <option value="invalidated">Invalidated</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Service
              </label>
              <input
                {...filterForm.register('service')}
                type="text"
                placeholder="Service name..."
                className="w-full border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 py-2 px-3 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                data-testid="service-filter"
              />
            </div>
          </div>
        )}
      </div>

      {/* Table */}
      <div className="flex-1 overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <Loader2 className="h-8 w-8 animate-spin text-primary-600 mx-auto mb-2" />
              <p className="text-gray-600 dark:text-gray-400">Loading cache data...</p>
            </div>
          </div>
        ) : sortedEntries.length === 0 ? (
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <Database className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
                No cache entries found
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                {filters.search || filters.type !== 'all' || filters.status !== 'all' || filters.service
                  ? 'Try adjusting your filters to see more results.'
                  : 'The cache is currently empty.'}
              </p>
            </div>
          </div>
        ) : (
          <div 
            ref={parentRef}
            className="h-full overflow-auto"
            data-testid="cache-table-virtualized-container"
          >
            <table
              id={tableId}
              role="table"
              aria-labelledby={captionId}
              aria-rowcount={sortedEntries.length + 1}
              className="w-full"
            >
              <caption id={captionId} className="sr-only">
                Cache entries table with {sortedEntries.length} entries. 
                Use arrow keys to navigate between rows. Press Enter to select an entry.
                Press Delete to remove an entry.
              </caption>
              
              <thead className="bg-gray-50 dark:bg-gray-800 sticky top-0 z-10">
                <tr role="row" aria-rowindex={1}>
                  {columns.map((column, index) => (
                    <th
                      key={column.key}
                      role="columnheader"
                      scope="col"
                      aria-colindex={index + 1}
                      aria-sort={
                        column.sortable && sortColumn === column.key
                          ? sortDirection
                          : column.sortable
                          ? 'none'
                          : undefined
                      }
                      style={{ width: column.width }}
                      className={cn(
                        "text-left p-3 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider border-b border-gray-200 dark:border-gray-700",
                        column.sortable && "cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700"
                      )}
                      tabIndex={column.sortable ? 0 : undefined}
                      onClick={column.sortable ? () => handleSort(column.key) : undefined}
                      onKeyDown={column.sortable ? (e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault();
                          handleSort(column.key);
                        }
                      } : undefined}
                    >
                      <div className="flex items-center space-x-1">
                        {typeof column.header === 'string' ? (
                          <span>{column.header}</span>
                        ) : (
                          column.header
                        )}
                        {column.sortable && sortColumn === column.key && (
                          <span aria-hidden="true">
                            {sortDirection === 'asc' ? (
                              <ChevronUp className="h-3 w-3" />
                            ) : (
                              <ChevronDown className="h-3 w-3" />
                            )}
                          </span>
                        )}
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              
              <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
                <tr style={{ height: `${virtualizer.getTotalSize()}px` }} />
                {virtualizer.getVirtualItems().map(virtualItem => {
                  const entry = sortedEntries[virtualItem.index];
                  const isSelected = selectedEntries.has(entry.id);
                  
                  return (
                    <tr
                      key={entry.id}
                      role="row"
                      aria-rowindex={virtualItem.index + 2}
                      aria-selected={isSelected}
                      data-row-index={virtualItem.index}
                      tabIndex={0}
                      style={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        width: '100%',
                        height: `${virtualItem.size}px`,
                        transform: `translateY(${virtualItem.start}px)`,
                      }}
                      className={cn(
                        "hover:bg-gray-50 dark:hover:bg-gray-800 focus:bg-primary-50 dark:focus:bg-primary-900/20 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-inset",
                        isSelected && "bg-primary-50 dark:bg-primary-900/20"
                      )}
                      onClick={() => onEntrySelect?.(entry)}
                      onKeyDown={(e) => handleKeyDown(e, virtualItem.index)}
                    >
                      {columns.map((column, colIndex) => (
                        <td
                          key={column.key}
                          role="gridcell"
                          aria-colindex={colIndex + 1}
                          style={{ width: column.width }}
                          className="p-3 text-sm text-gray-900 dark:text-gray-100"
                        >
                          {column.cell(entry)}
                        </td>
                      ))}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Screen reader live region for announcements */}
      <div className="sr-only" aria-live="polite" aria-atomic="true">
        {isLoading && "Loading cache data"}
        {selectedEntries.size > 0 && `${selectedEntries.size} entries selected`}
        {data?.entries && `${data.entries.length} cache entries displayed`}
      </div>
    </div>
  );
});

CacheTable.displayName = 'CacheTable';

export default CacheTable;