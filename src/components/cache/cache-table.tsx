'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useCache } from '@/hooks/use-cache';
import { CacheRow } from '@/types/cache';
import { RefreshCw, Trash2, AlertCircle, CheckCircle, Database } from 'lucide-react';

/**
 * Cache Table Component
 * 
 * Displays and manages per-service cache entries with real-time status monitoring.
 * Implements React Query for data fetching with automatic revalidation and
 * provides individual cache flush operations with confirmation dialogs.
 * 
 * Features:
 * - Real-time cache list display
 * - Per-service cache flush operations
 * - Loading states and error handling
 * - Responsive design with Tailwind CSS
 * - Automatic data refresh and background updates
 * 
 * @returns {JSX.Element} Cache table component
 */
export default function CacheTable(): React.JSX.Element {
  const [flushingService, setFlushingService] = useState<string | null>(null);
  const [showConfirmation, setShowConfirmation] = useState<string | null>(null);
  
  const {
    cacheList,
    isLoadingCacheList,
    cacheListError,
    flushServiceCache,
    isFlushingServiceCache,
    refetchCacheList
  } = useCache();

  /**
   * Handle service cache flush with confirmation
   */
  const handleFlushService = async (serviceName: string) => {
    if (!serviceName) return;
    
    setFlushingService(serviceName);
    setShowConfirmation(null);
    
    try {
      await flushServiceCache(serviceName);
      // Refetch cache list to update the display
      await refetchCacheList();
    } catch (error) {
      console.error('Failed to flush service cache:', error);
    } finally {
      setFlushingService(null);
    }
  };

  /**
   * Handle confirmation dialog
   */
  const handleConfirmFlush = (serviceName: string) => {
    setShowConfirmation(serviceName);
  };

  /**
   * Cancel confirmation dialog
   */
  const handleCancelFlush = () => {
    setShowConfirmation(null);
  };

  /**
   * Handle manual refresh
   */
  const handleRefresh = async () => {
    await refetchCacheList();
  };

  // Loading state
  if (isLoadingCacheList) {
    return (
      <Card className="p-6">
        <div className="flex items-center justify-center py-8">
          <RefreshCw className="w-6 h-6 animate-spin text-gray-400" />
          <span className="ml-2 text-gray-600 dark:text-gray-400">Loading cache data...</span>
        </div>
      </Card>
    );
  }

  // Error state
  if (cacheListError) {
    return (
      <Card className="p-6 border-red-200 dark:border-red-800">
        <div className="flex items-center justify-center py-8">
          <AlertCircle className="w-6 h-6 text-red-500 mr-2" />
          <div className="text-center">
            <p className="text-red-600 dark:text-red-400 font-medium">
              Failed to load cache data
            </p>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              {cacheListError.message}
            </p>
            <Button
              onClick={handleRefresh}
              variant="outline"
              size="sm"
              className="mt-3"
            >
              <RefreshCw className="w-4 h-4 mr-1" />
              Retry
            </Button>
          </div>
        </div>
      </Card>
    );
  }

  // Empty state
  if (!cacheList || cacheList.length === 0) {
    return (
      <Card className="p-6">
        <div className="flex flex-col items-center justify-center py-8 text-center">
          <Database className="w-12 h-12 text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
            No Service Caches Found
          </h3>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            No service-specific caches are currently available to manage.
          </p>
          <Button
            onClick={handleRefresh}
            variant="outline"
            size="sm"
          >
            <RefreshCw className="w-4 h-4 mr-1" />
            Refresh
          </Button>
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Table Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium text-gray-900 dark:text-white">
          Service Caches ({cacheList.length})
        </h3>
        <Button
          onClick={handleRefresh}
          variant="outline"
          size="sm"
          disabled={isLoadingCacheList}
        >
          <RefreshCw className={`w-4 h-4 mr-1 ${isLoadingCacheList ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {/* Cache Table */}
      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-800">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Service Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Cache ID
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
              {cacheList.map((cache: CacheRow) => (
                <tr key={cache.name} className="hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <Database className="w-4 h-4 text-gray-400 mr-2" />
                      <div>
                        <div className="text-sm font-medium text-gray-900 dark:text-white">
                          {cache.label}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-600 dark:text-gray-400 font-mono">
                      {cache.name}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex items-center justify-end space-x-2">
                      {showConfirmation === cache.name ? (
                        // Confirmation buttons
                        <div className="flex items-center space-x-2">
                          <span className="text-xs text-gray-600 dark:text-gray-400">Confirm flush?</span>
                          <Button
                            onClick={() => handleFlushService(cache.name)}
                            size="sm"
                            className="bg-red-600 hover:bg-red-700 text-white"
                            disabled={flushingService === cache.name}
                          >
                            {flushingService === cache.name ? (
                              <RefreshCw className="w-3 h-3 animate-spin" />
                            ) : (
                              <CheckCircle className="w-3 h-3" />
                            )}
                          </Button>
                          <Button
                            onClick={handleCancelFlush}
                            size="sm"
                            variant="outline"
                            disabled={flushingService === cache.name}
                          >
                            Cancel
                          </Button>
                        </div>
                      ) : (
                        // Normal flush button
                        <Button
                          onClick={() => handleConfirmFlush(cache.name)}
                          size="sm"
                          variant="outline"
                          className="text-red-600 border-red-200 hover:bg-red-50 hover:border-red-300 dark:text-red-400 dark:border-red-800 dark:hover:bg-red-900/20"
                          disabled={flushingService !== null || isFlushingServiceCache}
                          aria-label={`Flush cache for ${cache.label}`}
                        >
                          <Trash2 className="w-3 h-3 mr-1" />
                          Clear
                        </Button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Performance Information */}
      <div className="text-xs text-gray-500 dark:text-gray-400 text-center">
        Cache operations are optimized to complete within 5 seconds to maintain API generation performance.
      </div>
    </div>
  );
}