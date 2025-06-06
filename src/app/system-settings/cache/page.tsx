import React from 'react';
import { Metadata } from 'next';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import CacheTable from '@/components/cache/cache-table';
import CacheFlushForm from './cache-flush-form';

export const metadata: Metadata = {
  title: 'Cache Management - System Settings',
  description: 'Manage system-wide cache and per-service cache operations',
};

/**
 * Cache Management Page
 * 
 * Server component for cache administration in the system settings.
 * Provides comprehensive cache management interface including system-wide 
 * cache flushing and per-service cache management with real-time status monitoring.
 * 
 * Features:
 * - System-wide cache flush operations
 * - Per-service cache management
 * - Real-time cache status monitoring
 * - React Query integration for intelligent caching
 * - Next.js server component architecture for optimal performance
 * 
 * @returns {JSX.Element} Cache management page component
 */
export default async function CachePage(): Promise<JSX.Element> {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Cache Management
          </h1>
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
            Manage system-wide cache and per-service cache operations to optimize performance
          </p>
        </div>

        {/* Main Content */}
        <div className="space-y-8">
          {/* System Cache Management Card */}
          <Card className="p-6">
            <div className="flex flex-col space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                    System Cache
                  </h2>
                  <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                    Flush all system-wide cached data including configuration, schema metadata, and API responses
                  </p>
                </div>
                <div className="flex-shrink-0">
                  <CacheFlushForm />
                </div>
              </div>
            </div>
          </Card>

          {/* Per-Service Cache Management Card */}
          <Card className="p-6">
            <div className="space-y-4">
              <div>
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                  Service Cache Management
                </h2>
                <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                  View and manage cache for individual services. Clear cache to force refresh of service-specific data.
                </p>
              </div>
              
              {/* Cache Table Component */}
              <div className="mt-6">
                <CacheTable />
              </div>
            </div>
          </Card>

          {/* Cache Information Card */}
          <Card className="p-6 bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800">
            <div className="space-y-3">
              <h3 className="text-lg font-medium text-blue-900 dark:text-blue-200">
                Cache Management Information
              </h3>
              <div className="space-y-2 text-sm text-blue-800 dark:text-blue-300">
                <div className="flex items-start">
                  <span className="inline-block w-2 h-2 bg-blue-500 rounded-full mt-1.5 mr-3 flex-shrink-0"></span>
                  <span>
                    <strong>System Cache:</strong> Contains global configuration, user sessions, and cross-service metadata. 
                    Flushing system cache will require users to re-authenticate and may temporarily impact performance.
                  </span>
                </div>
                <div className="flex items-start">
                  <span className="inline-block w-2 h-2 bg-blue-500 rounded-full mt-1.5 mr-3 flex-shrink-0"></span>
                  <span>
                    <strong>Service Cache:</strong> Contains service-specific data including schema metadata, query results, 
                    and API responses. Clearing service cache will force refresh of service data on next request.
                  </span>
                </div>
                <div className="flex items-start">
                  <span className="inline-block w-2 h-2 bg-blue-500 rounded-full mt-1.5 mr-3 flex-shrink-0"></span>
                  <span>
                    <strong>Performance Impact:</strong> Cache operations are designed to complete within 5 seconds 
                    to maintain the platform's 5-minute API generation capability.
                  </span>
                </div>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}