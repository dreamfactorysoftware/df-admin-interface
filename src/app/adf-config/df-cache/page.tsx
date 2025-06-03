'use client';

import React, { useState } from 'react';
import { Suspense } from 'react';
import useSWR from 'swr';
import { RefreshCwIcon, Trash2Icon, AlertTriangleIcon } from 'lucide-react';

// Type definitions for cache management
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

// API client for cache operations
const cacheApiClient = {
  async fetchCaches(): Promise<CacheType[]> {
    const response = await fetch('/api/v2/system/cache', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    
    if (!response.ok) {
      throw new Error(`Failed to fetch caches: ${response.statusText}`);
    }
    
    const data = await response.json();
    return data.resource || [];
  },

  async flushSystemCache(): Promise<void> {
    const response = await fetch('/api/v2/system/cache', {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    
    if (!response.ok) {
      throw new Error(`Failed to flush system cache: ${response.statusText}`);
    }
  },

  async flushServiceCache(serviceName: string): Promise<void> {
    const response = await fetch(`/api/v2/system/cache/${serviceName}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    
    if (!response.ok) {
      throw new Error(`Failed to flush service cache: ${response.statusText}`);
    }
  },
};

// Cache Table Component
interface CacheTableProps {
  caches: CacheType[];
  onClearCache: (cache: CacheRow) => void;
  isLoading?: boolean;
}

function CacheTable({ caches, onClearCache, isLoading }: CacheTableProps) {
  const mapDataToTable = (data: CacheType[]): CacheRow[] => {
    return data.map((cache: CacheType) => ({
      label: cache.label,
      name: cache.name,
    }));
  };

  const tableData = mapDataToTable(caches);

  if (isLoading) {
    return (
      <div className="animate-pulse">
        <div className="bg-white dark:bg-gray-800 shadow-sm rounded-lg overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
            <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-1/4"></div>
          </div>
          {[...Array(3)].map((_, i) => (
            <div key={i} className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 shadow-sm rounded-lg overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
        <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">
          Per-Service Caches
        </h3>
      </div>
      
      {tableData.length === 0 ? (
        <div className="px-6 py-12 text-center">
          <p className="text-gray-500 dark:text-gray-400">
            No cache services available
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th 
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider"
                >
                  Service
                </th>
                <th 
                  scope="col"
                  className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider"
                >
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {tableData.map((cache) => (
                <tr key={cache.name} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
                      {cache.label}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button
                      type="button"
                      onClick={() => onClearCache(cache)}
                      className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
                      aria-label={`Clear cache for ${cache.label}`}
                    >
                      <RefreshCwIcon className="w-4 h-4 mr-2" />
                      Clear
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

// Cache Modal Component
interface CacheModalProps {
  isOpen: boolean;
  onClose: () => void;
  cache: CacheRow | null;
  onConfirm: () => void;
  isLoading?: boolean;
}

function CacheModal({ isOpen, onClose, cache, onConfirm, isLoading }: CacheModalProps) {
  if (!isOpen || !cache) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
        {/* Background overlay */}
        <div 
          className="fixed inset-0 transition-opacity bg-gray-500 bg-opacity-75 dark:bg-gray-900 dark:bg-opacity-75" 
          onClick={onClose}
          aria-hidden="true"
        />

        {/* Modal dialog */}
        <div className="inline-block align-bottom bg-white dark:bg-gray-800 rounded-lg px-4 pt-5 pb-4 text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full sm:p-6">
          <div className="sm:flex sm:items-start">
            <div className="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-red-100 dark:bg-red-900 sm:mx-0 sm:h-10 sm:w-10">
              <AlertTriangleIcon className="h-6 w-6 text-red-600 dark:text-red-400" />
            </div>
            <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left">
              <h3 className="text-lg leading-6 font-medium text-gray-900 dark:text-gray-100">
                Clear {cache.label} Cache
              </h3>
              <div className="mt-2">
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Are you sure you want to clear the cache for {cache.label}? This action cannot be undone.
                </p>
              </div>
            </div>
          </div>
          
          <div className="mt-5 sm:mt-4 sm:flex sm:flex-row-reverse">
            <button
              type="button"
              onClick={onConfirm}
              disabled={isLoading}
              className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-red-600 text-base font-medium text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 sm:ml-3 sm:w-auto sm:text-sm disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
            >
              {isLoading ? (
                <>
                  <RefreshCwIcon className="w-4 h-4 mr-2 animate-spin" />
                  Clearing...
                </>
              ) : (
                <>
                  <Trash2Icon className="w-4 h-4 mr-2" />
                  Clear Cache
                </>
              )}
            </button>
            <button
              type="button"
              onClick={onClose}
              disabled={isLoading}
              className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 dark:border-gray-600 shadow-sm px-4 py-2 bg-white dark:bg-gray-700 text-base font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 sm:w-auto sm:text-sm disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// Main Cache Management Page Component
export default function CachePage() {
  const [selectedCache, setSelectedCache] = useState<CacheRow | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isFlushingSystem, setIsFlushingSystem] = useState(false);
  const [isFlushingService, setIsFlushingService] = useState(false);
  const [notification, setNotification] = useState<{
    type: 'success' | 'error';
    message: string;
  } | null>(null);

  // Fetch cache data using SWR
  const { 
    data: caches = [], 
    error: cachesError, 
    isLoading: cachesLoading,
    mutate: mutateCaches 
  } = useSWR<CacheType[]>('/api/v2/system/cache', cacheApiClient.fetchCaches, {
    revalidateOnFocus: false,
    revalidateOnReconnect: true,
    errorRetryCount: 3,
    errorRetryInterval: 1000,
  });

  // Show notification helper
  const showNotification = (type: 'success' | 'error', message: string) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 5000);
  };

  // Handle system cache flush
  const handleFlushSystemCache = async () => {
    setIsFlushingSystem(true);
    try {
      await cacheApiClient.flushSystemCache();
      showNotification('success', 'System cache has been successfully flushed');
      // Optionally refresh cache list
      mutateCaches();
    } catch (error) {
      console.error('Error flushing system cache:', error);
      showNotification('error', 'Failed to flush system cache. Please try again.');
    } finally {
      setIsFlushingSystem(false);
    }
  };

  // Handle service cache clear
  const handleClearServiceCache = (cache: CacheRow) => {
    setSelectedCache(cache);
    setIsModalOpen(true);
  };

  // Confirm service cache clear
  const handleConfirmClear = async () => {
    if (!selectedCache) return;

    setIsFlushingService(true);
    try {
      await cacheApiClient.flushServiceCache(selectedCache.name);
      showNotification('success', `${selectedCache.label} cache has been successfully cleared`);
      setIsModalOpen(false);
      setSelectedCache(null);
      // Optionally refresh cache list
      mutateCaches();
    } catch (error) {
      console.error('Error clearing service cache:', error);
      showNotification('error', `Failed to clear ${selectedCache.label} cache. Please try again.`);
    } finally {
      setIsFlushingService(false);
    }
  };

  // Close modal
  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedCache(null);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Page Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
          Cache Management
        </h1>
        <p className="mt-2 text-gray-600 dark:text-gray-400">
          Manage system and service-specific caches to optimize performance and ensure data consistency.
          Clearing caches can help resolve issues with stale data and improve system responsiveness.
        </p>
      </div>

      {/* Notification */}
      {notification && (
        <div className={`mb-6 rounded-md p-4 ${
          notification.type === 'success' 
            ? 'bg-green-50 dark:bg-green-900 border border-green-200 dark:border-green-700' 
            : 'bg-red-50 dark:bg-red-900 border border-red-200 dark:border-red-700'
        }`}>
          <p className={`text-sm ${
            notification.type === 'success' 
              ? 'text-green-700 dark:text-green-200' 
              : 'text-red-700 dark:text-red-200'
          }`}>
            {notification.message}
          </p>
        </div>
      )}

      {/* System Cache Section */}
      <div className="mb-8">
        <div className="bg-white dark:bg-gray-800 shadow-sm rounded-lg overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
              System Cache
            </h2>
            <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
              Clear all system-wide cached data
            </p>
          </div>
          <div className="px-6 py-4">
            <button
              type="button"
              onClick={handleFlushSystemCache}
              disabled={isFlushingSystem}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
              aria-label="Flush system cache"
            >
              {isFlushingSystem ? (
                <>
                  <RefreshCwIcon className="w-4 h-4 mr-2 animate-spin" />
                  Flushing System Cache...
                </>
              ) : (
                <>
                  <Trash2Icon className="w-4 h-4 mr-2" />
                  Flush System Cache
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Per-Service Cache Section */}
      <div className="mb-8">
        <Suspense fallback={
          <div className="animate-pulse bg-white dark:bg-gray-800 shadow-sm rounded-lg h-64">
            <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
              <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-1/4"></div>
            </div>
          </div>
        }>
          {cachesError ? (
            <div className="bg-red-50 dark:bg-red-900 border border-red-200 dark:border-red-700 rounded-lg p-6">
              <h3 className="text-lg font-medium text-red-800 dark:text-red-200 mb-2">
                Error Loading Cache Services
              </h3>
              <p className="text-red-700 dark:text-red-300 text-sm">
                Failed to load cache services. Please check your connection and try again.
              </p>
              <button
                onClick={() => mutateCaches()}
                className="mt-4 inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-red-700 dark:text-red-200 bg-red-100 dark:bg-red-800 hover:bg-red-200 dark:hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
              >
                <RefreshCwIcon className="w-4 h-4 mr-2" />
                Retry
              </button>
            </div>
          ) : (
            <CacheTable
              caches={caches}
              onClearCache={handleClearServiceCache}
              isLoading={cachesLoading}
            />
          )}
        </Suspense>
      </div>

      {/* Cache Clear Confirmation Modal */}
      <CacheModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        cache={selectedCache}
        onConfirm={handleConfirmClear}
        isLoading={isFlushingService}
      />
    </div>
  );
}