/**
 * Loading UI component for the system settings section that displays skeleton states
 * and loading indicators while data is being fetched. Implements Tailwind CSS animations
 * and responsive design patterns to provide smooth user experience during system
 * configuration data loading operations.
 * 
 * Features:
 * - Next.js app router loading.tsx convention compliance
 * - Tailwind CSS skeleton animations replacing Angular Material loading components
 * - Responsive loading states for different viewport sizes
 * - WCAG 2.1 AA accessibility compliance
 * - SSR and client-side navigation support
 * - Optimized for React Query loading states
 */

import React from 'react';

/**
 * Skeleton component for consistent loading animations
 * Uses Tailwind CSS utilities for smooth, accessible animations
 */
const Skeleton: React.FC<{
  className?: string;
  'aria-label'?: string;
  height?: 'sm' | 'md' | 'lg' | 'xl';
  width?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
}> = ({ 
  className = '', 
  'aria-label': ariaLabel = 'Loading content',
  height = 'md',
  width = 'full'
}) => {
  const heightClasses = {
    sm: 'h-4',
    md: 'h-6',
    lg: 'h-8',
    xl: 'h-12'
  };

  const widthClasses = {
    sm: 'w-24',
    md: 'w-48',
    lg: 'w-64',
    xl: 'w-80',
    full: 'w-full'
  };

  return (
    <div
      className={`
        animate-pulse bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 
        dark:from-gray-700 dark:via-gray-600 dark:to-gray-700
        rounded-md
        ${heightClasses[height]}
        ${widthClasses[width]}
        ${className}
      `}
      style={{
        backgroundSize: '200% 100%',
        animation: 'shimmer 2s ease-in-out infinite'
      }}
      aria-label={ariaLabel}
      role="status"
    />
  );
};

/**
 * Card skeleton for dashboard overview sections
 */
const CardSkeleton: React.FC<{ showIcon?: boolean }> = ({ showIcon = true }) => (
  <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6 shadow-sm">
    <div className="flex items-start justify-between mb-4">
      <div className="space-y-2 flex-1">
        {showIcon && (
          <Skeleton 
            height="sm" 
            width="sm" 
            className="mb-2"
            aria-label="Loading icon"
          />
        )}
        <Skeleton 
          height="md" 
          width="lg"
          aria-label="Loading card title"
        />
        <Skeleton 
          height="sm" 
          width="xl"
          aria-label="Loading card description"
        />
      </div>
    </div>
    <div className="space-y-2">
      <Skeleton 
        height="sm" 
        width="md"
        aria-label="Loading card metadata"
      />
      <Skeleton 
        height="sm" 
        width="lg"
        aria-label="Loading card status"
      />
    </div>
  </div>
);

/**
 * Table skeleton for data tables (cache, email templates, etc.)
 */
const TableSkeleton: React.FC<{ rows?: number; columns?: number }> = ({ 
  rows = 10, 
  columns = 5 
}) => (
  <div 
    className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden"
    role="table"
    aria-label="Loading data table"
  >
    {/* Table Header */}
    <div className="border-b border-gray-200 dark:border-gray-700 p-4">
      <div className="flex items-center justify-between mb-4">
        <Skeleton 
          height="md" 
          width="lg"
          aria-label="Loading table title"
        />
        <div className="flex space-x-2">
          <Skeleton 
            height="md" 
            width="sm"
            aria-label="Loading search input"
          />
          <Skeleton 
            height="md" 
            width="sm"
            aria-label="Loading action button"
          />
        </div>
      </div>
      
      {/* Column Headers */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
        {Array.from({ length: columns }).map((_, index) => (
          <Skeleton 
            key={`header-${index}`}
            height="sm" 
            width="full"
            aria-label={`Loading column ${index + 1} header`}
          />
        ))}
      </div>
    </div>

    {/* Table Rows */}
    <div className="divide-y divide-gray-200 dark:divide-gray-700">
      {Array.from({ length: rows }).map((_, rowIndex) => (
        <div 
          key={`row-${rowIndex}`} 
          className="p-4 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
        >
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4 items-center">
            {Array.from({ length: columns }).map((_, colIndex) => (
              <Skeleton 
                key={`cell-${rowIndex}-${colIndex}`}
                height="sm" 
                width={colIndex === 0 ? 'lg' : 'md'}
                aria-label={`Loading row ${rowIndex + 1}, column ${colIndex + 1}`}
              />
            ))}
          </div>
        </div>
      ))}
    </div>
  </div>
);

/**
 * Navigation skeleton for system settings navigation
 */
const NavigationSkeleton: React.FC = () => (
  <div className="space-y-2 mb-6">
    <Skeleton 
      height="sm" 
      width="lg"
      aria-label="Loading navigation breadcrumb"
    />
    <div className="flex flex-wrap gap-2">
      {Array.from({ length: 6 }).map((_, index) => (
        <Skeleton 
          key={`nav-${index}`}
          height="sm" 
          width="md"
          aria-label={`Loading navigation item ${index + 1}`}
        />
      ))}
    </div>
  </div>
);

/**
 * System status overview skeleton
 */
const StatusOverviewSkeleton: React.FC = () => (
  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
    {Array.from({ length: 4 }).map((_, index) => (
      <div 
        key={`status-${index}`}
        className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4"
      >
        <div className="flex items-center justify-between">
          <Skeleton 
            height="sm" 
            width="md"
            aria-label={`Loading status metric ${index + 1} label`}
          />
          <Skeleton 
            height="sm" 
            width="sm"
            aria-label={`Loading status metric ${index + 1} icon`}
          />
        </div>
        <div className="mt-2">
          <Skeleton 
            height="lg" 
            width="lg"
            aria-label={`Loading status metric ${index + 1} value`}
          />
        </div>
      </div>
    ))}
  </div>
);

/**
 * Main loading component for system settings
 * Displays comprehensive skeleton states matching actual content layout
 */
const SystemSettingsLoading: React.FC = () => {
  return (
    <div 
      className="p-6 space-y-8 min-h-screen bg-gray-50 dark:bg-gray-900"
      role="main"
      aria-live="polite"
      aria-label="System settings loading"
    >
      {/* Page Header */}
      <div className="space-y-4">
        <Skeleton 
          height="xl" 
          width="lg"
          aria-label="Loading page title"
        />
        <Skeleton 
          height="sm" 
          width="xl"
          aria-label="Loading page description"
        />
      </div>

      {/* Navigation */}
      <NavigationSkeleton />

      {/* System Status Overview */}
      <section aria-label="Loading system status overview">
        <div className="mb-4">
          <Skeleton 
            height="md" 
            width="md"
            aria-label="Loading status section title"
          />
        </div>
        <StatusOverviewSkeleton />
      </section>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        {/* Primary Content Area */}
        <section className="xl:col-span-2 space-y-6" aria-label="Loading main content">
          {/* Quick Actions */}
          <div className="space-y-4">
            <Skeleton 
              height="md" 
              width="md"
              aria-label="Loading quick actions title"
            />
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {Array.from({ length: 6 }).map((_, index) => (
                <CardSkeleton 
                  key={`action-${index}`} 
                  showIcon={true}
                />
              ))}
            </div>
          </div>

          {/* Main Data Table */}
          <div className="space-y-4">
            <Skeleton 
              height="md" 
              width="lg"
              aria-label="Loading data table title"
            />
            <TableSkeleton rows={8} columns={5} />
          </div>
        </section>

        {/* Sidebar Content */}
        <aside className="space-y-6" aria-label="Loading sidebar content">
          {/* Recent Activity */}
          <div className="space-y-4">
            <Skeleton 
              height="md" 
              width="md"
              aria-label="Loading recent activity title"
            />
            <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
              <div className="space-y-4">
                {Array.from({ length: 5 }).map((_, index) => (
                  <div key={`activity-${index}`} className="flex items-start space-x-3">
                    <Skeleton 
                      height="sm" 
                      width="sm"
                      aria-label={`Loading activity ${index + 1} icon`}
                    />
                    <div className="flex-1 space-y-1">
                      <Skeleton 
                        height="sm" 
                        width="full"
                        aria-label={`Loading activity ${index + 1} description`}
                      />
                      <Skeleton 
                        height="sm" 
                        width="md"
                        aria-label={`Loading activity ${index + 1} timestamp`}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* System Health */}
          <div className="space-y-4">
            <Skeleton 
              height="md" 
              width="md"
              aria-label="Loading system health title"
            />
            <CardSkeleton showIcon={false} />
          </div>
        </aside>
      </div>

      {/* CSS Keyframes for shimmer animation */}
      <style jsx>{`
        @keyframes shimmer {
          0% {
            background-position: -200% 0;
          }
          100% {
            background-position: 200% 0;
          }
        }
      `}</style>
    </div>
  );
};

export default SystemSettingsLoading;