/**
 * Loading state component for the administrative dashboard
 * 
 * Displays skeleton placeholders during data fetching operations for:
 * - Admin metrics and statistics
 * - User statistics and counts  
 * - System health indicators
 * - Audit trail loading
 * 
 * Implements WCAG 2.1 AA compliance with proper ARIA attributes
 * and responsive design using Tailwind CSS animations.
 */

'use client';

import { cn } from '@/lib/utils';

/**
 * Reusable skeleton component for consistent loading states
 */
interface SkeletonProps {
  className?: string;
  'data-testid'?: string;
}

function Skeleton({ className, 'data-testid': testId, ...props }: SkeletonProps) {
  return (
    <div
      className={cn(
        'animate-pulse rounded-md bg-gray-200 dark:bg-gray-700',
        className
      )}
      data-testid={testId}
      {...props}
    />
  );
}

/**
 * Spinner component for active loading indicators
 */
function Spinner({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        'animate-spin rounded-full border-2 border-current border-t-transparent',
        'text-gray-400 dark:text-gray-500',
        className
      )}
      role="status"
      aria-label="Loading"
    >
      <span className="sr-only">Loading...</span>
    </div>
  );
}

/**
 * Card skeleton for admin metric cards
 */
function MetricCardSkeleton() {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
      <div className="flex items-center justify-between mb-4">
        <Skeleton className="h-6 w-32" data-testid="metric-title-skeleton" />
        <Skeleton className="h-8 w-8 rounded-full" data-testid="metric-icon-skeleton" />
      </div>
      <div className="space-y-3">
        <Skeleton className="h-8 w-20" data-testid="metric-value-skeleton" />
        <div className="flex items-center space-x-2">
          <Skeleton className="h-4 w-12" data-testid="metric-change-skeleton" />
          <Skeleton className="h-4 w-24" data-testid="metric-label-skeleton" />
        </div>
      </div>
    </div>
  );
}

/**
 * Table skeleton for admin data tables
 */
function TableSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
      {/* Table Header */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between mb-4">
          <Skeleton className="h-6 w-40" data-testid="table-title-skeleton" />
          <Skeleton className="h-10 w-32" data-testid="table-action-skeleton" />
        </div>
        <div className="grid grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-5 w-full" data-testid={`table-header-${i}`} />
          ))}
        </div>
      </div>
      
      {/* Table Rows */}
      <div className="divide-y divide-gray-200 dark:divide-gray-700">
        {Array.from({ length: rows }).map((_, rowIndex) => (
          <div key={rowIndex} className="p-4">
            <div className="grid grid-cols-4 gap-4 items-center">
              {Array.from({ length: 4 }).map((_, colIndex) => (
                <Skeleton 
                  key={colIndex} 
                  className="h-4 w-full" 
                  data-testid={`table-cell-${rowIndex}-${colIndex}`} 
                />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/**
 * Chart skeleton for admin analytics
 */
function ChartSkeleton() {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="space-y-2">
          <Skeleton className="h-6 w-48" data-testid="chart-title-skeleton" />
          <Skeleton className="h-4 w-32" data-testid="chart-subtitle-skeleton" />
        </div>
        <Skeleton className="h-8 w-24" data-testid="chart-filter-skeleton" />
      </div>
      
      {/* Chart Area */}
      <div className="relative h-64">
        <Skeleton className="h-full w-full" data-testid="chart-area-skeleton" />
        
        {/* Chart Bars Animation */}
        <div className="absolute bottom-4 left-8 right-8 flex items-end justify-between space-x-2">
          {Array.from({ length: 7 }).map((_, i) => (
            <Skeleton 
              key={i} 
              className={`w-6 bg-gray-300 dark:bg-gray-600`}
              style={{ height: `${Math.random() * 120 + 20}px` }}
              data-testid={`chart-bar-${i}`}
            />
          ))}
        </div>
      </div>
      
      {/* Chart Legend */}
      <div className="flex items-center justify-center space-x-6 mt-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="flex items-center space-x-2">
            <Skeleton className="h-3 w-3 rounded-full" data-testid={`legend-dot-${i}`} />
            <Skeleton className="h-4 w-16" data-testid={`legend-label-${i}`} />
          </div>
        ))}
      </div>
    </div>
  );
}

/**
 * Quick actions skeleton for admin toolbar
 */
function QuickActionsSkeleton() {
  return (
    <div className="flex items-center space-x-3">
      {Array.from({ length: 4 }).map((_, i) => (
        <Skeleton 
          key={i} 
          className="h-10 w-28" 
          data-testid={`quick-action-${i}`} 
        />
      ))}
    </div>
  );
}

/**
 * Main loading component for admin settings page
 */
export default function AdminSettingsLoading() {
  return (
    <div 
      className="space-y-8 animate-in fade-in-0 duration-200" 
      data-testid="admin-settings-loading"
      role="status"
      aria-label="Loading administrative dashboard"
      aria-live="polite"
    >
      {/* Screen Reader Announcement */}
      <div className="sr-only" aria-live="assertive">
        Loading administrative dashboard. Please wait while we fetch your data.
      </div>

      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <Skeleton className="h-8 w-64" data-testid="page-title-skeleton" />
          <Skeleton className="h-5 w-96" data-testid="page-description-skeleton" />
        </div>
        <QuickActionsSkeleton />
      </div>

      {/* Admin Metrics Grid */}
      <div 
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
        role="region"
        aria-label="Loading administrative metrics"
      >
        {Array.from({ length: 4 }).map((_, i) => (
          <MetricCardSkeleton key={i} />
        ))}
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Primary Content Area */}
        <div className="lg:col-span-2 space-y-8">
          {/* System Health Chart */}
          <div role="region" aria-label="Loading system health indicators">
            <ChartSkeleton />
          </div>

          {/* User Activity Table */}
          <div role="region" aria-label="Loading user activity data">
            <TableSkeleton rows={6} />
          </div>
        </div>

        {/* Secondary Content Area */}
        <div className="space-y-8">
          {/* Recent Actions */}
          <div 
            className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6"
            role="region"
            aria-label="Loading recent administrative actions"
          >
            <div className="flex items-center justify-between mb-6">
              <Skeleton className="h-6 w-40" data-testid="recent-actions-title" />
              <Spinner className="h-4 w-4" />
            </div>
            
            <div className="space-y-4">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="flex items-start space-x-3">
                  <Skeleton className="h-8 w-8 rounded-full flex-shrink-0" data-testid={`action-avatar-${i}`} />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-full" data-testid={`action-text-${i}`} />
                    <Skeleton className="h-3 w-20" data-testid={`action-time-${i}`} />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* System Status */}
          <div 
            className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6"
            role="region" 
            aria-label="Loading system status indicators"
          >
            <div className="flex items-center justify-between mb-6">
              <Skeleton className="h-6 w-32" data-testid="system-status-title" />
              <Skeleton className="h-5 w-16 rounded-full" data-testid="status-badge" />
            </div>
            
            <div className="space-y-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <Skeleton className="h-4 w-4 rounded-full" data-testid={`status-indicator-${i}`} />
                    <Skeleton className="h-4 w-24" data-testid={`status-label-${i}`} />
                  </div>
                  <Skeleton className="h-4 w-12" data-testid={`status-value-${i}`} />
                </div>
              ))}
            </div>
          </div>

          {/* Audit Trail Preview */}
          <div 
            className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6"
            role="region"
            aria-label="Loading audit trail preview"
          >
            <div className="flex items-center justify-between mb-6">
              <Skeleton className="h-6 w-28" data-testid="audit-trail-title" />
              <Skeleton className="h-8 w-20" data-testid="view-all-button" />
            </div>
            
            <div className="space-y-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="flex items-center justify-between p-3 rounded bg-gray-50 dark:bg-gray-900">
                  <div className="flex-1 space-y-1">
                    <Skeleton className="h-4 w-full" data-testid={`audit-action-${i}`} />
                    <Skeleton className="h-3 w-32" data-testid={`audit-timestamp-${i}`} />
                  </div>
                  <Skeleton className="h-6 w-16 rounded" data-testid={`audit-severity-${i}`} />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Loading Progress Indicator */}
      <div 
        className="fixed bottom-4 right-4 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 p-4"
        role="status"
        aria-live="polite"
      >
        <div className="flex items-center space-x-3">
          <Spinner className="h-5 w-5" />
          <div className="space-y-1">
            <Skeleton className="h-4 w-32" data-testid="loading-text" />
            <Skeleton className="h-2 w-40" data-testid="loading-progress" />
          </div>
        </div>
      </div>
    </div>
  );
}