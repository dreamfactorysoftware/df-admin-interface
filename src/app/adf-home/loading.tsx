/**
 * Loading component for the ADF Home section
 * 
 * This component provides accessible loading states for the DreamFactory Admin Interface
 * home dashboard, implementing Next.js loading UI patterns with WCAG 2.1 AA compliance.
 * 
 * Features:
 * - Next.js app router loading.tsx conventions
 * - Tailwind CSS loading animations (replacing Angular Material progress indicators)
 * - WCAG 2.1 AA compliant accessibility features including screen reader support
 * - Responsive loading skeletons matching home dashboard layout
 * - Semantic HTML structure with proper ARIA attributes
 * 
 * @author DreamFactory Team
 * @version React 19/Next.js 15.1
 */

import React from 'react';

/**
 * Loading skeleton component for dashboard cards and sections
 * Provides consistent skeleton patterns across the home dashboard
 */
function LoadingSkeleton({ 
  className = "", 
  ariaLabel 
}: { 
  className?: string; 
  ariaLabel?: string; 
}) {
  return (
    <div 
      className={`animate-pulse bg-gray-200 dark:bg-gray-700 rounded ${className}`}
      role="img"
      aria-label={ariaLabel || "Loading content"}
      aria-hidden="true"
    />
  );
}

/**
 * Animated spinner component for immediate feedback
 * Implements WCAG-compliant loading indicator with proper contrast ratios
 */
function LoadingSpinner({ 
  size = "md",
  className = ""
}: { 
  size?: "sm" | "md" | "lg";
  className?: string;
}) {
  const sizeClasses = {
    sm: "h-4 w-4",
    md: "h-8 w-8",
    lg: "h-12 w-12"
  };

  return (
    <div
      className={`animate-spin rounded-full border-2 border-gray-300 dark:border-gray-600 border-t-primary-600 ${sizeClasses[size]} ${className}`}
      role="status"
      aria-label="Loading"
      aria-live="polite"
    >
      <span className="sr-only">Loading content, please wait...</span>
    </div>
  );
}

/**
 * Quick actions loading skeleton
 * Matches the layout of dashboard quick action buttons
 */
function QuickActionsLoading() {
  return (
    <div className="flex flex-wrap gap-3" aria-label="Loading quick actions">
      {Array.from({ length: 4 }).map((_, index) => (
        <LoadingSkeleton
          key={`quick-action-${index}`}
          className="h-10 w-32"
          ariaLabel={`Loading quick action ${index + 1}`}
        />
      ))}
    </div>
  );
}

/**
 * Stats overview loading skeleton
 * Provides loading state for dashboard statistics cards
 */
function StatsOverviewLoading() {
  return (
    <div 
      className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
      role="region"
      aria-label="Loading dashboard statistics"
    >
      {Array.from({ length: 4 }).map((_, index) => (
        <div 
          key={`stat-card-${index}`}
          className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6"
        >
          <div className="space-y-3">
            <LoadingSkeleton 
              className="h-4 w-24"
              ariaLabel={`Loading statistic title ${index + 1}`}
            />
            <LoadingSkeleton 
              className="h-8 w-16"
              ariaLabel={`Loading statistic value ${index + 1}`}
            />
            <LoadingSkeleton 
              className="h-3 w-20"
              ariaLabel={`Loading statistic change ${index + 1}`}
            />
          </div>
        </div>
      ))}
    </div>
  );
}

/**
 * Recent activity loading skeleton
 * Matches the layout of the activity feed section
 */
function RecentActivityLoading() {
  return (
    <div 
      className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700"
      role="region"
      aria-label="Loading recent activity"
    >
      <div className="p-6 border-b border-gray-200 dark:border-gray-700">
        <LoadingSkeleton 
          className="h-6 w-32"
          ariaLabel="Loading recent activity title"
        />
      </div>
      <div className="p-6">
        <div className="space-y-4">
          {Array.from({ length: 5 }).map((_, index) => (
            <div key={`activity-${index}`} className="flex items-start space-x-3">
              <LoadingSkeleton 
                className="h-8 w-8 rounded-full flex-shrink-0"
                ariaLabel={`Loading activity icon ${index + 1}`}
              />
              <div className="flex-1 space-y-2">
                <LoadingSkeleton 
                  className="h-4 w-3/4"
                  ariaLabel={`Loading activity description ${index + 1}`}
                />
                <LoadingSkeleton 
                  className="h-3 w-1/4"
                  ariaLabel={`Loading activity timestamp ${index + 1}`}
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/**
 * Service health loading skeleton
 * Provides loading state for service status overview
 */
function ServiceHealthLoading() {
  return (
    <div 
      className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700"
      role="region"
      aria-label="Loading service health status"
    >
      <div className="p-6 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between">
          <LoadingSkeleton 
            className="h-6 w-28"
            ariaLabel="Loading service health title"
          />
          <LoadingSkeleton 
            className="h-4 w-16"
            ariaLabel="Loading service count"
          />
        </div>
      </div>
      <div className="p-6">
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, index) => (
            <div key={`service-${index}`} className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <LoadingSkeleton 
                  className="h-3 w-3 rounded-full"
                  ariaLabel={`Loading service status indicator ${index + 1}`}
                />
                <LoadingSkeleton 
                  className="h-4 w-32"
                  ariaLabel={`Loading service name ${index + 1}`}
                />
              </div>
              <LoadingSkeleton 
                className="h-4 w-16"
                ariaLabel={`Loading service status ${index + 1}`}
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/**
 * Quick start guide loading skeleton
 * Matches the sidebar guide layout
 */
function QuickStartGuideLoading() {
  return (
    <div 
      className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700"
      role="region"
      aria-label="Loading quick start guide"
    >
      <div className="p-6 border-b border-gray-200 dark:border-gray-700">
        <LoadingSkeleton 
          className="h-6 w-36"
          ariaLabel="Loading quick start guide title"
        />
      </div>
      <div className="p-6">
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, index) => (
            <div key={`guide-step-${index}`} className="flex items-start space-x-3">
              <LoadingSkeleton 
                className="h-6 w-6 rounded-full flex-shrink-0"
                ariaLabel={`Loading step number ${index + 1}`}
              />
              <div className="flex-1 space-y-2">
                <LoadingSkeleton 
                  className="h-4 w-full"
                  ariaLabel={`Loading step title ${index + 1}`}
                />
                <LoadingSkeleton 
                  className="h-3 w-3/4"
                  ariaLabel={`Loading step description ${index + 1}`}
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/**
 * Main loading component for ADF Home section
 * 
 * Implements Next.js loading.tsx convention with comprehensive dashboard layout
 * matching, accessibility compliance, and responsive design.
 * 
 * This component is automatically used by Next.js when pages are loading
 * within the adf-home route segment.
 */
export default function ADFHomeLoading() {
  return (
    <div 
      className="space-y-8 min-h-screen"
      data-testid="adf-home-loading"
      role="main"
      aria-label="Loading DreamFactory Admin Console home dashboard"
    >
      {/* Visually hidden loading announcement for screen readers */}
      <div 
        className="sr-only" 
        aria-live="polite" 
        aria-atomic="true"
        role="status"
      >
        Loading DreamFactory Admin Console dashboard. Please wait while we prepare your data.
      </div>

      {/* Page Header Loading */}
      <div 
        className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
        role="region"
        aria-label="Loading page header"
      >
        <div className="space-y-2">
          <LoadingSkeleton 
            className="h-8 w-80 sm:w-96"
            ariaLabel="Loading page title"
          />
          <LoadingSkeleton 
            className="h-6 w-64 sm:w-80"
            ariaLabel="Loading page description"
          />
        </div>
        <div className="flex justify-end">
          <QuickActionsLoading />
        </div>
      </div>

      {/* Stats Overview Loading */}
      <section aria-label="Dashboard statistics loading">
        <StatsOverviewLoading />
      </section>

      {/* Main Content Grid Loading */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Content Column */}
        <div className="lg:col-span-2 space-y-8">
          {/* Recent Activity Loading */}
          <section aria-label="Recent activity loading">
            <RecentActivityLoading />
          </section>
          
          {/* Service Health Loading */}
          <section aria-label="Service health loading">
            <ServiceHealthLoading />
          </section>
        </div>

        {/* Sidebar Column */}
        <div className="space-y-8">
          {/* Quick Start Guide Loading */}
          <section aria-label="Quick start guide loading">
            <QuickStartGuideLoading />
          </section>
        </div>
      </div>

      {/* Loading Progress Indicator */}
      <div 
        className="fixed bottom-4 right-4 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 p-4"
        role="status"
        aria-live="polite"
        aria-label="Loading progress"
      >
        <div className="flex items-center space-x-3">
          <LoadingSpinner size="sm" />
          <span className="text-sm text-gray-600 dark:text-gray-400">
            Loading dashboard...
          </span>
        </div>
      </div>
    </div>
  );
}

/**
 * Export components for reuse in other loading states
 * These components can be imported by other parts of the application
 * for consistent loading patterns across the platform
 */
export {
  LoadingSkeleton,
  LoadingSpinner,
  StatsOverviewLoading,
  RecentActivityLoading,
  ServiceHealthLoading,
  QuickStartGuideLoading
};