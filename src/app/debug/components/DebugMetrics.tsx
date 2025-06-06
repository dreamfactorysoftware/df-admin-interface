"use client";

import React, { useState, useEffect, useCallback } from "react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { usePerformanceMetrics } from "@/hooks/use-performance-metrics";
import { getDebugInfo, formatBytes, formatMs, formatPercentage } from "@/lib/debug-utils";

/**
 * Debug Metrics Component for Next.js Development Environment
 * 
 * Provides comprehensive development insights including:
 * - Next.js development metrics (SSR performance, hydration timing)
 * - React Query cache inspection and devtools integration
 * - Real-time performance monitoring with configurable refresh intervals
 * - Component render tracking and optimization suggestions
 * - Application state inspection tools
 * 
 * IMPORTANT: This component only renders in development environment for security.
 * 
 * Features:
 * - SSR performance monitoring with hydration timing display per Section 3.6
 * - React Query cache hit rates and inspection capabilities per Section 5.2
 * - Real-time performance metrics with configurable refresh intervals
 * - Component render tracking with React 19 performance patterns
 * - Responsive Tailwind CSS grid layouts per React/Next.js Integration Requirements
 * 
 * @see Technical Specification Section 3.6 for development tools and benchmarks
 * @see Technical Specification Section 5.2 for component state management patterns
 * @see React/Next.js Integration Requirements for cache performance standards
 */

// Card Component Interface (temporary implementation until ui/card is created)
interface CardProps {
  children: React.ReactNode;
  className?: string;
  title?: string;
}

const Card: React.FC<CardProps> = ({ children, className, title }) => (
  <div className={cn(
    "rounded-lg border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-gray-900",
    className
  )}>
    {title && (
      <h3 className="mb-4 text-lg font-semibold text-gray-900 dark:text-gray-100">
        {title}
      </h3>
    )}
    {children}
  </div>
);

/**
 * Performance metrics interface for comprehensive monitoring
 */
interface PerformanceMetrics {
  // Next.js specific metrics
  ssrTime?: number;
  hydrationTime?: number;
  totalPageLoad?: number;
  
  // React Query cache metrics
  cacheHitRate?: number;
  totalQueries?: number;
  activeQueries?: number;
  staleQueries?: number;
  
  // Core Web Vitals
  lcp?: number; // Largest Contentful Paint
  fid?: number; // First Input Delay
  cls?: number; // Cumulative Layout Shift
  
  // Memory and performance
  memoryUsage?: number;
  renderCount?: number;
  componentCount?: number;
  
  // Build and bundle metrics
  bundleSize?: number;
  chunkCount?: number;
}

/**
 * React Query cache status interface
 */
interface QueryCacheInfo {
  queries: Array<{
    queryKey: string[];
    status: 'loading' | 'error' | 'success' | 'idle';
    dataUpdatedAt: number;
    errorUpdatedAt: number;
    isStale: boolean;
    isFetching: boolean;
  }>;
  hitRate: number;
  missRate: number;
  totalQueries: number;
}

/**
 * Refresh interval options for real-time monitoring
 */
const REFRESH_INTERVALS = {
  '1s': 1000,
  '5s': 5000,
  '10s': 10000,
  '30s': 30000,
  'manual': null,
} as const;

type RefreshInterval = keyof typeof REFRESH_INTERVALS;

/**
 * Debug Metrics Props Interface
 */
export interface DebugMetricsProps {
  /**
   * Custom CSS classes for styling
   */
  className?: string;
  
  /**
   * Whether to show detailed component render information
   */
  showDetailedRenderInfo?: boolean;
  
  /**
   * Initial refresh interval for metrics updates
   */
  initialRefreshInterval?: RefreshInterval;
  
  /**
   * Whether to enable React Query devtools integration
   */
  enableQueryDevtools?: boolean;
  
  /**
   * Custom performance thresholds for warning indicators
   */
  performanceThresholds?: {
    ssrTime?: number;
    hydrationTime?: number;
    cacheHitRate?: number;
    lcp?: number;
    cls?: number;
  };
}

/**
 * Default performance thresholds based on technical specification requirements
 */
const DEFAULT_THRESHOLDS = {
  ssrTime: 1000, // < 1s SSR per Section 3.6
  hydrationTime: 500, // < 500ms hydration per Section 3.6
  cacheHitRate: 80, // > 80% cache hit rate
  lcp: 2500, // < 2.5s LCP per Web Vitals
  cls: 0.1, // < 0.1 CLS per Web Vitals
};

/**
 * Debug Metrics Component
 * 
 * Comprehensive development metrics dashboard for Next.js applications.
 * Only renders in development environment with configurable refresh intervals
 * and detailed performance insights.
 */
export const DebugMetrics: React.FC<DebugMetricsProps> = ({
  className,
  showDetailedRenderInfo = false,
  initialRefreshInterval = '5s',
  enableQueryDevtools = true,
  performanceThresholds = DEFAULT_THRESHOLDS,
}) => {
  // Development environment check - component only renders in development
  const isDevelopment = process.env.NODE_ENV === 'development';
  
  // State management for metrics and configuration
  const [refreshInterval, setRefreshInterval] = useState<RefreshInterval>(initialRefreshInterval);
  const [isExpanded, setIsExpanded] = useState(false);
  const [selectedTab, setSelectedTab] = useState<'overview' | 'queries' | 'components' | 'web-vitals'>('overview');
  
  // Custom hook for performance metrics (assumes implementation)
  const {
    metrics,
    queryCacheInfo,
    componentRenderInfo,
    webVitals,
    refreshMetrics,
    isLoading
  } = usePerformanceMetrics({ 
    refreshInterval: REFRESH_INTERVALS[refreshInterval],
    enableQueryCache: enableQueryDevtools 
  });

  /**
   * Auto-refresh mechanism for real-time monitoring
   */
  useEffect(() => {
    if (!isDevelopment || !REFRESH_INTERVALS[refreshInterval]) return;

    const interval = setInterval(() => {
      refreshMetrics();
    }, REFRESH_INTERVALS[refreshInterval]!);

    return () => clearInterval(interval);
  }, [refreshInterval, refreshMetrics, isDevelopment]);

  /**
   * Manual refresh handler
   */
  const handleManualRefresh = useCallback(() => {
    refreshMetrics();
  }, [refreshMetrics]);

  /**
   * Get status badge variant based on performance threshold
   */
  const getStatusVariant = (value: number, threshold: number, isInverted = false) => {
    const isGood = isInverted ? value < threshold : value > threshold;
    return isGood ? 'success' : 'warning';
  };

  /**
   * Format query status for display
   */
  const formatQueryStatus = (status: string) => {
    const statusMap = {
      loading: { variant: 'info' as const, label: 'Loading' },
      error: { variant: 'destructive' as const, label: 'Error' },
      success: { variant: 'success' as const, label: 'Success' },
      idle: { variant: 'secondary' as const, label: 'Idle' },
    };
    return statusMap[status as keyof typeof statusMap] || { variant: 'secondary' as const, label: status };
  };

  // Don't render in production for security
  if (!isDevelopment) {
    return null;
  }

  return (
    <div className={cn(
      "fixed bottom-4 right-4 z-50 max-w-md transition-all duration-300",
      isExpanded ? "w-full max-w-4xl" : "w-80",
      className
    )}>
      <Card 
        className="border-blue-200 bg-blue-50/90 backdrop-blur-sm dark:border-blue-800 dark:bg-blue-950/90"
        title={
          <div className="flex items-center justify-between">
            <span className="flex items-center gap-2">
              🔧 Debug Metrics
              <Badge 
                variant="info" 
                size="sm"
                className="text-xs"
              >
                DEV
              </Badge>
            </span>
            <div className="flex items-center gap-2">
              {/* Refresh interval selector */}
              <select
                value={refreshInterval}
                onChange={(e) => setRefreshInterval(e.target.value as RefreshInterval)}
                className="rounded border border-gray-300 bg-white px-2 py-1 text-xs dark:border-gray-600 dark:bg-gray-800"
                aria-label="Select refresh interval"
              >
                {Object.keys(REFRESH_INTERVALS).map((interval) => (
                  <option key={interval} value={interval}>
                    {interval === 'manual' ? 'Manual' : `Auto ${interval}`}
                  </option>
                ))}
              </select>
              
              {/* Manual refresh button */}
              <button
                onClick={handleManualRefresh}
                disabled={isLoading}
                className="rounded border border-gray-300 bg-white px-2 py-1 text-xs hover:bg-gray-50 disabled:opacity-50 dark:border-gray-600 dark:bg-gray-800 dark:hover:bg-gray-700"
                aria-label="Refresh metrics manually"
              >
                🔄
              </button>
              
              {/* Expand/collapse toggle */}
              <button
                onClick={() => setIsExpanded(!isExpanded)}
                className="rounded border border-gray-300 bg-white px-2 py-1 text-xs hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-800 dark:hover:bg-gray-700"
                aria-label={isExpanded ? "Collapse metrics" : "Expand metrics"}
              >
                {isExpanded ? "➖" : "➕"}
              </button>
            </div>
          </div>
        }
      >
        {!isExpanded ? (
          /* Collapsed view - key metrics only */
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <div className="font-medium text-gray-700 dark:text-gray-300">SSR Time</div>
              <div className="flex items-center gap-2">
                <span className="font-mono">{formatMs(metrics?.ssrTime)}</span>
                <Badge 
                  variant={getStatusVariant(metrics?.ssrTime || 0, performanceThresholds.ssrTime!, true)}
                  size="sm"
                >
                  {(metrics?.ssrTime || 0) < performanceThresholds.ssrTime! ? "✓" : "⚠"}
                </Badge>
              </div>
            </div>
            
            <div>
              <div className="font-medium text-gray-700 dark:text-gray-300">Cache Hit Rate</div>
              <div className="flex items-center gap-2">
                <span className="font-mono">{formatPercentage(metrics?.cacheHitRate)}</span>
                <Badge 
                  variant={getStatusVariant(metrics?.cacheHitRate || 0, performanceThresholds.cacheHitRate!)}
                  size="sm"
                >
                  {(metrics?.cacheHitRate || 0) > performanceThresholds.cacheHitRate! ? "✓" : "⚠"}
                </Badge>
              </div>
            </div>
          </div>
        ) : (
          /* Expanded view - comprehensive dashboard */
          <div className="space-y-6">
            {/* Tab navigation */}
            <div className="flex space-x-1 rounded-lg bg-gray-100 p-1 dark:bg-gray-800">
              {[
                { id: 'overview', label: 'Overview' },
                { id: 'queries', label: 'React Query' },
                { id: 'components', label: 'Components' },
                { id: 'web-vitals', label: 'Web Vitals' },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setSelectedTab(tab.id as any)}
                  className={cn(
                    "flex-1 rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
                    selectedTab === tab.id
                      ? "bg-white text-gray-900 shadow-sm dark:bg-gray-700 dark:text-gray-100"
                      : "text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100"
                  )}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Tab content */}
            <div className="min-h-[300px]">
              {selectedTab === 'overview' && (
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {/* Next.js SSR Performance */}
                  <div className="space-y-3">
                    <h4 className="font-semibold text-gray-900 dark:text-gray-100">Next.js Performance</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span>SSR Time:</span>
                        <div className="flex items-center gap-1">
                          <span className="font-mono">{formatMs(metrics?.ssrTime)}</span>
                          <Badge 
                            variant={getStatusVariant(metrics?.ssrTime || 0, performanceThresholds.ssrTime!, true)}
                            size="sm"
                          >
                            {(metrics?.ssrTime || 0) < performanceThresholds.ssrTime! ? "✓" : "⚠"}
                          </Badge>
                        </div>
                      </div>
                      <div className="flex justify-between">
                        <span>Hydration:</span>
                        <div className="flex items-center gap-1">
                          <span className="font-mono">{formatMs(metrics?.hydrationTime)}</span>
                          <Badge 
                            variant={getStatusVariant(metrics?.hydrationTime || 0, performanceThresholds.hydrationTime!, true)}
                            size="sm"
                          >
                            {(metrics?.hydrationTime || 0) < performanceThresholds.hydrationTime! ? "✓" : "⚠"}
                          </Badge>
                        </div>
                      </div>
                      <div className="flex justify-between">
                        <span>Total Load:</span>
                        <span className="font-mono">{formatMs(metrics?.totalPageLoad)}</span>
                      </div>
                    </div>
                  </div>

                  {/* React Query Cache */}
                  <div className="space-y-3">
                    <h4 className="font-semibold text-gray-900 dark:text-gray-100">Cache Performance</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span>Hit Rate:</span>
                        <div className="flex items-center gap-1">
                          <span className="font-mono">{formatPercentage(metrics?.cacheHitRate)}</span>
                          <Badge 
                            variant={getStatusVariant(metrics?.cacheHitRate || 0, performanceThresholds.cacheHitRate!)}
                            size="sm"
                          >
                            {(metrics?.cacheHitRate || 0) > performanceThresholds.cacheHitRate! ? "✓" : "⚠"}
                          </Badge>
                        </div>
                      </div>
                      <div className="flex justify-between">
                        <span>Active Queries:</span>
                        <span className="font-mono">{metrics?.activeQueries || 0}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Stale Queries:</span>
                        <span className="font-mono">{metrics?.staleQueries || 0}</span>
                      </div>
                    </div>
                  </div>

                  {/* Memory and Performance */}
                  <div className="space-y-3">
                    <h4 className="font-semibold text-gray-900 dark:text-gray-100">Memory & Bundle</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span>Memory Usage:</span>
                        <span className="font-mono">{formatBytes(metrics?.memoryUsage)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Bundle Size:</span>
                        <span className="font-mono">{formatBytes(metrics?.bundleSize)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Components:</span>
                        <span className="font-mono">{metrics?.componentCount || 0}</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {selectedTab === 'queries' && (
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <h4 className="font-semibold text-gray-900 dark:text-gray-100">React Query Cache Status</h4>
                    <Badge variant="info">
                      {queryCacheInfo?.totalQueries || 0} queries
                    </Badge>
                  </div>
                  
                  <div className="max-h-64 overflow-y-auto space-y-2">
                    {queryCacheInfo?.queries?.map((query, index) => (
                      <div key={index} className="flex items-center justify-between rounded border p-2 text-sm">
                        <div className="flex-1 min-w-0">
                          <div className="font-mono text-xs truncate">
                            {query.queryKey.join(' → ')}
                          </div>
                          <div className="text-xs text-gray-500 dark:text-gray-400">
                            Updated: {new Date(query.dataUpdatedAt).toLocaleTimeString()}
                          </div>
                        </div>
                        <div className="flex items-center gap-2 ml-2">
                          <Badge {...formatQueryStatus(query.status)} size="sm">
                            {formatQueryStatus(query.status).label}
                          </Badge>
                          {query.isStale && (
                            <Badge variant="warning" size="sm">Stale</Badge>
                          )}
                          {query.isFetching && (
                            <Badge variant="info" size="sm">Fetching</Badge>
                          )}
                        </div>
                      </div>
                    )) || (
                      <div className="text-center text-gray-500 dark:text-gray-400 py-8">
                        No active queries
                      </div>
                    )}
                  </div>
                </div>
              )}

              {selectedTab === 'components' && showDetailedRenderInfo && (
                <div className="space-y-4">
                  <h4 className="font-semibold text-gray-900 dark:text-gray-100">Component Render Analysis</h4>
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    React 19 performance insights and render optimization suggestions
                  </div>
                  
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span>Total Renders:</span>
                      <span className="font-mono">{componentRenderInfo?.totalRenders || 0}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Avg Render Time:</span>
                      <span className="font-mono">{formatMs(componentRenderInfo?.avgRenderTime)}</span>
                    </div>
                    
                    {componentRenderInfo?.suggestions?.length > 0 && (
                      <div className="mt-4">
                        <h5 className="font-medium mb-2">Optimization Suggestions:</h5>
                        <ul className="space-y-1 text-sm">
                          {componentRenderInfo.suggestions.map((suggestion, index) => (
                            <li key={index} className="flex items-start gap-2">
                              <span className="text-yellow-500">💡</span>
                              <span>{suggestion}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {selectedTab === 'web-vitals' && (
                <div className="space-y-4">
                  <h4 className="font-semibold text-gray-900 dark:text-gray-100">Core Web Vitals</h4>
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                    <div className="space-y-2">
                      <div className="font-medium">LCP (Largest Contentful Paint)</div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono">{formatMs(webVitals?.lcp)}</span>
                        <Badge 
                          variant={getStatusVariant(webVitals?.lcp || 0, performanceThresholds.lcp!, true)}
                          size="sm"
                        >
                          {(webVitals?.lcp || 0) < performanceThresholds.lcp! ? "Good" : "Needs Work"}
                        </Badge>
                      </div>
                      <div className="text-xs text-gray-500">Target: &lt; 2.5s</div>
                    </div>
                    
                    <div className="space-y-2">
                      <div className="font-medium">FID (First Input Delay)</div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono">{formatMs(webVitals?.fid)}</span>
                        <Badge 
                          variant={getStatusVariant(webVitals?.fid || 0, 100, true)}
                          size="sm"
                        >
                          {(webVitals?.fid || 0) < 100 ? "Good" : "Needs Work"}
                        </Badge>
                      </div>
                      <div className="text-xs text-gray-500">Target: &lt; 100ms</div>
                    </div>
                    
                    <div className="space-y-2">
                      <div className="font-medium">CLS (Cumulative Layout Shift)</div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono">{webVitals?.cls?.toFixed(3) || '0.000'}</span>
                        <Badge 
                          variant={getStatusVariant(webVitals?.cls || 0, performanceThresholds.cls!, true)}
                          size="sm"
                        >
                          {(webVitals?.cls || 0) < performanceThresholds.cls! ? "Good" : "Needs Work"}
                        </Badge>
                      </div>
                      <div className="text-xs text-gray-500">Target: &lt; 0.1</div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
        
        {/* Loading indicator */}
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-white/50 dark:bg-gray-900/50">
            <div className="flex items-center gap-2 text-sm">
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-blue-500 border-t-transparent"></div>
              Refreshing metrics...
            </div>
          </div>
        )}
        
        {/* Footer with development environment notice */}
        <div className="mt-4 border-t border-gray-200 pt-2 text-xs text-gray-500 dark:border-gray-700 dark:text-gray-400">
          🚧 Development environment only - Auto-refresh: {refreshInterval}
        </div>
      </Card>
    </div>
  );
};

export default DebugMetrics;