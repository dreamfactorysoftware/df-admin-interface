'use client';

import { useState, useMemo, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useVirtualizer } from '@tanstack/react-virtual';
import { Dialog, Transition } from '@headlessui/react';
import { 
  TrashIcon, 
  ArrowPathIcon,
  ExclamationTriangleIcon 
} from '@heroicons/react/24/outline';
import { Fragment } from 'react';
import { toast } from 'react-hot-toast';

// Types for cache data
interface CacheType {
  name: string;
  label: string;
  description: string;
  type: string;
}

interface CacheRow {
  name: string;
  label: string;
}

interface CacheTableProps {
  serviceId?: string;
  className?: string;
}

interface FlushCacheModalProps {
  isOpen: boolean;
  onClose: () => void;
  cacheItem: CacheRow | null;
  onConfirm: (cacheName: string) => void;
  isLoading: boolean;
}

// Mock API client - This would be replaced with the actual API client
const cacheApi = {
  getAll: async (params?: { limit?: number; offset?: number; filter?: string }): Promise<{
    resource: CacheType[];
    meta: { count: number };
  }> => {
    // Simulate API call with realistic delay
    await new Promise(resolve => setTimeout(resolve, Math.random() * 100 + 50));
    
    // Mock data for large datasets to test virtualization
    const mockData: CacheType[] = Array.from({ length: 1200 }, (_, i) => ({
      name: `service_${i + 1}`,
      label: `Service ${i + 1} Cache`,
      description: `Cache for service ${i + 1}`,
      type: 'service'
    }));

    const { limit = 50, offset = 0, filter = '' } = params || {};
    
    let filteredData = mockData;
    if (filter) {
      filteredData = mockData.filter(item => 
        item.label.toLowerCase().includes(filter.toLowerCase()) ||
        item.name.toLowerCase().includes(filter.toLowerCase())
      );
    }

    const paginatedData = filteredData.slice(offset, offset + limit);
    
    return {
      resource: paginatedData,
      meta: { count: filteredData.length }
    };
  },
  
  delete: async (cacheName: string): Promise<void> => {
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, Math.random() * 200 + 100));
    
    // Simulate random failures for testing error handling
    if (Math.random() < 0.1) {
      throw new Error('Failed to flush cache');
    }
  }
};

// Flush confirmation modal component
function FlushCacheModal({ isOpen, onClose, cacheItem, onConfirm, isLoading }: FlushCacheModalProps) {
  const handleConfirm = useCallback(() => {
    if (cacheItem) {
      onConfirm(cacheItem.name);
    }
  }, [cacheItem, onConfirm]);

  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={onClose}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black bg-opacity-25" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4 text-center">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <Dialog.Panel className="w-full max-w-md transform overflow-hidden rounded-2xl bg-white dark:bg-gray-800 p-6 text-left align-middle shadow-xl transition-all">
                <div className="flex items-center space-x-3 mb-4">
                  <ExclamationTriangleIcon className="h-6 w-6 text-amber-500" />
                  <Dialog.Title
                    as="h3"
                    className="text-lg font-medium leading-6 text-gray-900 dark:text-white"
                  >
                    Flush Cache Confirmation
                  </Dialog.Title>
                </div>

                <div className="mt-2">
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Are you sure you want to flush the cache for{' '}
                    <span className="font-semibold text-gray-900 dark:text-white">
                      {cacheItem?.label}
                    </span>
                    ? This action cannot be undone and may temporarily impact performance.
                  </p>
                </div>

                <div className="mt-6 flex justify-end space-x-3">
                  <button
                    type="button"
                    className="inline-flex justify-center rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    onClick={onClose}
                    disabled={isLoading}
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    className="inline-flex justify-center items-center space-x-2 rounded-md border border-transparent bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    onClick={handleConfirm}
                    disabled={isLoading}
                  >
                    {isLoading && (
                      <ArrowPathIcon className="h-4 w-4 animate-spin" />
                    )}
                    <span>Flush Cache</span>
                  </button>
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
}

// Main cache table component
export default function CacheTable({ serviceId, className }: CacheTableProps) {
  const [filter, setFilter] = useState('');
  const [selectedCache, setSelectedCache] = useState<CacheRow | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  const queryClient = useQueryClient();

  // React Query for cache data with optimistic caching
  const {
    data: cacheData,
    isLoading,
    isError,
    error,
    refetch
  } = useQuery({
    queryKey: ['cache', { filter }],
    queryFn: () => cacheApi.getAll({ 
      limit: 1000, // Load all for virtualization
      offset: 0, 
      filter 
    }),
    staleTime: 30000, // Cache hit responses under 50ms
    cacheTime: 300000, // 5 minutes cache time
    refetchInterval: 60000, // Real-time monitoring with auto-revalidation
    retry: 3,
    retryDelay: attemptIndex => Math.min(1000 * 2 ** attemptIndex, 30000),
  });

  // Mutation for cache flush with optimistic updates
  const flushCacheMutation = useMutation({
    mutationFn: cacheApi.delete,
    onMutate: async (cacheName: string) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['cache'] });

      // Snapshot previous value for rollback
      const previousCache = queryClient.getQueryData(['cache', { filter }]);

      // Optimistically update cache by removing the flushed item
      queryClient.setQueryData(['cache', { filter }], (old: any) => {
        if (!old) return old;
        return {
          ...old,
          resource: old.resource.filter((item: CacheType) => item.name !== cacheName)
        };
      });

      return { previousCache };
    },
    onError: (err, cacheName, context) => {
      // Rollback on error
      if (context?.previousCache) {
        queryClient.setQueryData(['cache', { filter }], context.previousCache);
      }
      toast.error(`Failed to flush cache: ${err.message}`);
    },
    onSuccess: (data, cacheName) => {
      toast.success(`Cache flushed successfully for ${selectedCache?.label}`);
      // Invalidate and refetch to ensure consistency
      queryClient.invalidateQueries({ queryKey: ['cache'] });
    },
    onSettled: () => {
      setIsModalOpen(false);
      setSelectedCache(null);
    },
  });

  // Map data for table display
  const tableData: CacheRow[] = useMemo(() => {
    if (!cacheData?.resource) return [];
    return cacheData.resource.map((item: CacheType) => ({
      name: item.name,
      label: item.label,
    }));
  }, [cacheData]);

  // Virtualization setup for large datasets
  const parentRef = useState<HTMLDivElement | null>(null)[0];
  const rowVirtualizer = useVirtualizer({
    count: tableData.length,
    getScrollElement: () => parentRef,
    estimateSize: () => 64, // Estimated row height
    overscan: 10, // Render extra items for smooth scrolling
  });

  // Event handlers
  const handleFlushCache = useCallback((cacheItem: CacheRow) => {
    setSelectedCache(cacheItem);
    setIsModalOpen(true);
  }, []);

  const handleConfirmFlush = useCallback((cacheName: string) => {
    flushCacheMutation.mutate(cacheName);
  }, [flushCacheMutation]);

  const handleRefresh = useCallback(() => {
    refetch();
    toast.success('Cache data refreshed');
  }, [refetch]);

  // Render loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <ArrowPathIcon className="h-8 w-8 animate-spin text-primary-500" />
        <span className="ml-2 text-gray-600 dark:text-gray-400">Loading cache data...</span>
      </div>
    );
  }

  // Render error state
  if (isError) {
    return (
      <div className="rounded-md bg-red-50 dark:bg-red-900/20 p-4">
        <div className="flex">
          <ExclamationTriangleIcon className="h-5 w-5 text-red-400" />
          <div className="ml-3">
            <h3 className="text-sm font-medium text-red-800 dark:text-red-400">
              Error loading cache data
            </h3>
            <div className="mt-2 text-sm text-red-700 dark:text-red-300">
              {error instanceof Error ? error.message : 'An unknown error occurred'}
            </div>
            <div className="mt-4">
              <button
                type="button"
                onClick={handleRefresh}
                className="bg-red-100 dark:bg-red-800 text-red-800 dark:text-red-200 px-3 py-1 rounded-md text-sm font-medium hover:bg-red-200 dark:hover:bg-red-700 transition-colors"
              >
                Try again
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-white dark:bg-gray-800 shadow rounded-lg ${className || ''}`}>
      {/* Header with controls */}
      <div className="px-4 py-5 sm:p-6">
        <div className="sm:flex sm:items-center sm:justify-between">
          <div>
            <h3 className="text-lg leading-6 font-medium text-gray-900 dark:text-white">
              Per-Service Cache Entries
            </h3>
            <p className="mt-1 max-w-2xl text-sm text-gray-500 dark:text-gray-400">
              Manage cache entries for individual services. Total entries: {tableData.length}
            </p>
          </div>
          <div className="mt-4 sm:mt-0 sm:ml-16 sm:flex-none">
            <button
              type="button"
              onClick={handleRefresh}
              className="inline-flex items-center justify-center rounded-md border border-transparent bg-primary-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              disabled={isLoading}
            >
              <ArrowPathIcon className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
              Refresh
            </button>
          </div>
        </div>

        {/* Filter input */}
        <div className="mt-6">
          <label htmlFor="cache-filter" className="sr-only">
            Filter cache entries
          </label>
          <input
            type="text"
            name="cache-filter"
            id="cache-filter"
            className="block w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm dark:text-white"
            placeholder="Filter cache entries..."
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
          />
        </div>
      </div>

      {/* Virtualized table */}
      <div className="border-t border-gray-200 dark:border-gray-700">
        {tableData.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-gray-500 dark:text-gray-400">
              {filter ? 'No cache entries match your filter.' : 'No cache entries found.'}
            </div>
          </div>
        ) : (
          <div className="overflow-hidden">
            {/* Table header */}
            <div className="bg-gray-50 dark:bg-gray-900 px-6 py-3 border-b border-gray-200 dark:border-gray-700">
              <div className="grid grid-cols-12 gap-4 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                <div className="col-span-8">Service Cache</div>
                <div className="col-span-4 text-right">Actions</div>
              </div>
            </div>

            {/* Virtualized rows */}
            <div
              ref={parentRef}
              className="h-96 overflow-auto"
              style={{ contain: 'strict' }}
            >
              <div
                style={{
                  height: `${rowVirtualizer.getTotalSize()}px`,
                  width: '100%',
                  position: 'relative',
                }}
              >
                {rowVirtualizer.getVirtualItems().map((virtualItem) => {
                  const cacheItem = tableData[virtualItem.index];
                  return (
                    <div
                      key={virtualItem.key}
                      style={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        width: '100%',
                        height: `${virtualItem.size}px`,
                        transform: `translateY(${virtualItem.start}px)`,
                      }}
                      className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                    >
                      <div className="grid grid-cols-12 gap-4 items-center">
                        <div className="col-span-8">
                          <div className="text-sm font-medium text-gray-900 dark:text-white">
                            {cacheItem.label}
                          </div>
                          <div className="text-sm text-gray-500 dark:text-gray-400">
                            {cacheItem.name}
                          </div>
                        </div>
                        <div className="col-span-4 text-right">
                          <button
                            type="button"
                            onClick={() => handleFlushCache(cacheItem)}
                            className="inline-flex items-center px-3 py-1 border border-transparent text-xs font-medium rounded-md text-red-700 bg-red-100 hover:bg-red-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 dark:text-red-400 dark:bg-red-900/30 dark:hover:bg-red-900/50 transition-colors"
                            aria-label={`Flush cache for ${cacheItem.label}`}
                          >
                            <TrashIcon className="h-3 w-3 mr-1" />
                            Flush
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Confirmation modal */}
      <FlushCacheModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setSelectedCache(null);
        }}
        cacheItem={selectedCache}
        onConfirm={handleConfirmFlush}
        isLoading={flushCacheMutation.isLoading}
      />
    </div>
  );
}