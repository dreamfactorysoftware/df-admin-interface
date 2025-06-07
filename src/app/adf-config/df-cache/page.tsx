/**
 * Next.js Cache Management Dashboard Page
 * 
 * Provides comprehensive cache management interface for DreamFactory admin users,
 * including system cache overview, per-service cache management, and cache clearing
 * operations. Implements React 19 server components for optimal SSR performance
 * with client-side interactivity for cache operations.
 * 
 * Features:
 * - System-wide cache overview with performance metrics
 * - Per-service cache management with detailed statistics
 * - Cache flush operations with confirmation dialogs
 * - Real-time cache status monitoring via SWR
 * - Accessible interface with keyboard navigation and screen reader support
 * - Optimistic updates with rollback capabilities
 * 
 * @fileoverview Cache management dashboard for DreamFactory admin interface
 * @version 1.0.0
 * @since React 19.0.0 / Next.js 15.1+
 */

import { Suspense } from 'react';
import { Metadata } from 'next';
import dynamic from 'next/dynamic';
import { 
  CpuChipIcon, 
  ClockIcon, 
  ServerIcon,
  ArrowPathIcon,
  TrashIcon,
  ChartBarIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline';

// Import components and hooks with proper error boundaries
import CacheTable from './cache-table';
import CacheModal from './cache-modal';
import { apiGet } from '@/lib/api-client';
import type { 
  ApiListResponse, 
  ApiResourceResponse,
  ApiErrorResponse 
} from '@/types/api';

// ============================================================================
// Type Definitions
// ============================================================================

/**
 * Cache service configuration interface
 * Represents a DreamFactory cache service with performance metrics
 */
interface CacheService {
  /** Unique service identifier */
  id: number;
  /** Service name */
  name: string;
  /** Service label for display */
  label?: string;
  /** Cache service type (local, redis, memcached) */
  type: 'cache_local' | 'cache_redis' | 'cache_memcached';
  /** Service description */
  description?: string;
  /** Whether service is active */
  is_active: boolean;
  /** Cache statistics */
  stats?: {
    /** Total cached items */
    total_items: number;
    /** Cache hit ratio (0-1) */
    hit_ratio: number;
    /** Total memory usage in bytes */
    memory_usage: number;
    /** Cache operations per second */
    ops_per_second: number;
    /** Last updated timestamp */
    last_updated: string;
  };
  /** Service configuration */
  config?: {
    /** Cache store type */
    store?: string;
    /** TTL in seconds */
    default_ttl?: number;
    /** Maximum cache size */
    max_size?: number;
  };
}

/**
 * System cache overview interface
 * Provides high-level cache performance metrics
 */
interface CacheOverview {
  /** Total cache services */
  total_services: number;
  /** Active cache services */
  active_services: number;
  /** Overall cache hit ratio */
  overall_hit_ratio: number;
  /** Total memory usage across all caches */
  total_memory_usage: number;
  /** Total cached items across all services */
  total_items: number;
  /** System cache health status */
  health_status: 'healthy' | 'warning' | 'critical';
  /** Last cache refresh timestamp */
  last_refresh: string;
}

/**
 * Page metadata for SEO and accessibility
 */
export const metadata: Metadata = {
  title: 'Cache Management - DreamFactory Admin',
  description: 'Manage system cache configuration, monitor cache performance, and clear cached data across DreamFactory services.',
  keywords: ['cache', 'performance', 'redis', 'memcached', 'system administration'],
  robots: {
    index: false, // Admin interface should not be indexed
    follow: false,
  },
};

// ============================================================================
// Server Component Data Fetching
// ============================================================================

/**
 * Fetch cache overview data server-side for initial page load
 * Implements Next.js server component patterns with error handling
 * 
 * @returns Promise resolving to cache overview data or error state
 */
async function getCacheOverview(): Promise<CacheOverview | null> {
  try {
    // Fetch system cache statistics
    const response = await apiGet<ApiResourceResponse<CacheOverview>>(
      '/api/v2/system/cache',
      {
        revalidate: 30, // Cache for 30 seconds on server
        tags: ['cache-overview'],
      }
    );

    if ('resource' in response) {
      return response.resource;
    }

    return null;
  } catch (error) {
    console.error('Failed to fetch cache overview:', error);
    return null;
  }
}

/**
 * Fetch cache services list server-side for initial page load
 * Optimized for SSR performance with intelligent caching
 * 
 * @returns Promise resolving to cache services list or empty array
 */
async function getCacheServices(): Promise<CacheService[]> {
  try {
    // Fetch all cache services from system API
    const response = await apiGet<ApiListResponse<CacheService>>(
      '/api/v2/system/service',
      {
        filter: 'service_type LIKE "cache_%"',
        fields: 'id,name,label,type,description,is_active,config',
        related: 'stats',
        includeCount: true,
        revalidate: 60, // Cache for 1 minute on server
        tags: ['cache-services'],
      }
    );

    if ('resource' in response && Array.isArray(response.resource)) {
      return response.resource;
    }

    return [];
  } catch (error) {
    console.error('Failed to fetch cache services:', error);
    return [];
  }
}

// ============================================================================
// Cache Overview Card Component
// ============================================================================

/**
 * Cache overview card displaying system-wide cache metrics
 * Renders cache performance summary with visual indicators
 */
interface CacheOverviewCardProps {
  overview: CacheOverview | null;
}

function CacheOverviewCard({ overview }: CacheOverviewCardProps) {
  if (!overview) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            Cache Overview
          </h2>
          <ExclamationTriangleIcon className="h-5 w-5 text-yellow-500" />
        </div>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Unable to load cache overview data. Please check your connection and try again.
        </p>
      </div>
    );
  }

  const formatBytes = (bytes: number): string => {
    const units = ['B', 'KB', 'MB', 'GB'];
    let size = bytes;
    let unitIndex = 0;
    
    while (size >= 1024 && unitIndex < units.length - 1) {
      size /= 1024;
      unitIndex++;
    }
    
    return `${size.toFixed(1)} ${units[unitIndex]}`;
  };

  const formatPercentage = (ratio: number): string => {
    return `${(ratio * 100).toFixed(1)}%`;
  };

  const getHealthStatusColor = (status: string): string => {
    switch (status) {
      case 'healthy':
        return 'text-green-600 dark:text-green-400';
      case 'warning':
        return 'text-yellow-600 dark:text-yellow-400';
      case 'critical':
        return 'text-red-600 dark:text-red-400';
      default:
        return 'text-gray-600 dark:text-gray-400';
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
          Cache Overview
        </h2>
        <div className={`flex items-center gap-2 ${getHealthStatusColor(overview.health_status)}`}>
          <div className="w-2 h-2 rounded-full bg-current" />
          <span className="text-sm font-medium capitalize">
            {overview.health_status}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Active Services */}
        <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
          <div className="flex items-center gap-3">
            <ServerIcon className="h-8 w-8 text-blue-600 dark:text-blue-400" />
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Active Services
              </p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {overview.active_services}/{overview.total_services}
              </p>
            </div>
          </div>
        </div>

        {/* Hit Ratio */}
        <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
          <div className="flex items-center gap-3">
            <ChartBarIcon className="h-8 w-8 text-green-600 dark:text-green-400" />
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Hit Ratio
              </p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {formatPercentage(overview.overall_hit_ratio)}
              </p>
            </div>
          </div>
        </div>

        {/* Memory Usage */}
        <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
          <div className="flex items-center gap-3">
            <CpuChipIcon className="h-8 w-8 text-purple-600 dark:text-purple-400" />
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Memory Usage
              </p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {formatBytes(overview.total_memory_usage)}
              </p>
            </div>
          </div>
        </div>

        {/* Total Items */}
        <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
          <div className="flex items-center gap-3">
            <ClockIcon className="h-8 w-8 text-orange-600 dark:text-orange-400" />
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Cached Items
              </p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {overview.total_items.toLocaleString()}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-600">
        <p className="text-xs text-gray-500 dark:text-gray-400">
          Last updated: {new Date(overview.last_refresh).toLocaleString()}
        </p>
      </div>
    </div>
  );
}

// ============================================================================
// Cache Management Actions Component
// ============================================================================

/**
 * Cache management actions toolbar with global operations
 * Provides quick access to system-wide cache management functions
 */
function CacheManagementActions() {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h3 className="text-base font-medium text-gray-900 dark:text-white">
            Quick Actions
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Manage cache operations across all services
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-2">
          <button
            type="button"
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800 transition-colors"
            aria-label="Refresh all cache statistics"
          >
            <ArrowPathIcon className="h-4 w-4" />
            Refresh All
          </button>

          <button
            type="button"
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-red-600 border border-transparent rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800 transition-colors"
            aria-label="Clear all system caches"
          >
            <TrashIcon className="h-4 w-4" />
            Clear All Caches
          </button>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// Loading Components
// ============================================================================

/**
 * Loading skeleton for cache overview card
 */
function CacheOverviewSkeleton() {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6 animate-pulse">
      <div className="flex items-center justify-between mb-6">
        <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-32" />
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-gray-200 dark:bg-gray-700" />
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-16" />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
            <div className="flex items-center gap-3">
              <div className="h-8 w-8 bg-gray-200 dark:bg-gray-600 rounded" />
              <div className="space-y-2">
                <div className="h-3 bg-gray-200 dark:bg-gray-600 rounded w-20" />
                <div className="h-6 bg-gray-200 dark:bg-gray-600 rounded w-16" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/**
 * Loading skeleton for cache table
 */
function CacheTableSkeleton() {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6 animate-pulse">
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-40" />
          <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-24" />
        </div>
        
        {[...Array(5)].map((_, i) => (
          <div key={i} className="flex items-center space-x-4 py-3">
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/4" />
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/6" />
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/6" />
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/6" />
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/6" />
            <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-20" />
          </div>
        ))}
      </div>
    </div>
  );
}

// ============================================================================
// Main Page Component
// ============================================================================

/**
 * Cache Management Dashboard Page Component
 * 
 * Implements Next.js 15.1+ app router patterns with React 19 server components
 * for optimal SSR performance. Provides comprehensive cache management interface
 * with real-time monitoring and intuitive administration capabilities.
 * 
 * Features:
 * - Server-side rendered initial data for fast page loads
 * - Client-side hydration for interactive cache operations
 * - Accessible design with keyboard navigation and screen reader support
 * - Progressive enhancement with JavaScript disabled fallbacks
 * - Optimized bundle splitting and lazy loading for performance
 */
export default async function CachePage() {
  // Server-side data fetching for initial page load
  const [overviewData, servicesData] = await Promise.allSettled([
    getCacheOverview(),
    getCacheServices(),
  ]);

  const overview = overviewData.status === 'fulfilled' ? overviewData.value : null;
  const services = servicesData.status === 'fulfilled' ? servicesData.value : [];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Page Header */}
      <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                Cache Management
              </h1>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                Monitor and manage cache performance across all DreamFactory services
              </p>
            </div>
            
            {/* Breadcrumb Navigation */}
            <nav className="flex" aria-label="Breadcrumb">
              <ol className="flex items-center space-x-2 text-sm text-gray-500 dark:text-gray-400">
                <li>
                  <a href="/adf-config" className="hover:text-gray-700 dark:hover:text-gray-200">
                    Configuration
                  </a>
                </li>
                <li className="flex items-center">
                  <span className="mx-2">/</span>
                  <span className="font-medium text-gray-900 dark:text-white">
                    Cache
                  </span>
                </li>
              </ol>
            </nav>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-6">
          {/* Cache Overview Section */}
          <section aria-labelledby="cache-overview-heading">
            <h2 id="cache-overview-heading" className="sr-only">
              Cache Overview Statistics
            </h2>
            <Suspense fallback={<CacheOverviewSkeleton />}>
              <CacheOverviewCard overview={overview} />
            </Suspense>
          </section>

          {/* Quick Actions Section */}
          <section aria-labelledby="cache-actions-heading">
            <h2 id="cache-actions-heading" className="sr-only">
              Cache Management Actions
            </h2>
            <CacheManagementActions />
          </section>

          {/* Cache Services Table Section */}
          <section aria-labelledby="cache-services-heading">
            <h2 id="cache-services-heading" className="sr-only">
              Cache Services Management
            </h2>
            <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
              <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
                <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                  Cache Services
                </h3>
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                  Manage individual cache services and view their performance statistics
                </p>
              </div>
              
              <Suspense fallback={<CacheTableSkeleton />}>
                <CacheTable 
                  initialData={services}
                  overview={overview}
                />
              </Suspense>
            </div>
          </section>
        </div>
      </main>

      {/* Cache Modal - Rendered at root level for proper z-index layering */}
      <Suspense fallback={null}>
        <CacheModal />
      </Suspense>
    </div>
  );
}

// ============================================================================
// Performance Optimizations
// ============================================================================

/**
 * Enable static optimization for this page when possible
 * Improves build-time optimization and deployment performance
 */
export const dynamic = 'force-dynamic'; // Required due to server-side API calls

/**
 * Configure runtime for optimal performance
 * Uses Node.js runtime for server-side data fetching compatibility
 */
export const runtime = 'nodejs';

/**
 * Disable static generation for this admin interface page
 * Ensures fresh data on each request for accurate cache statistics
 */
export const revalidate = 0;