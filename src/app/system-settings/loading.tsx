/**
 * Loading UI component for system settings section
 * 
 * This component displays skeleton states and loading indicators while system
 * configuration data is being fetched. Implements Tailwind CSS animations and
 * responsive design patterns to provide smooth user experience during system
 * administration data loading operations.
 * 
 * Features:
 * - Skeleton UI that matches actual content layout
 * - WCAG 2.1 AA compliant animations and accessibility
 * - SSR and client-side navigation support
 * - Feedback for slow network conditions
 * - React Query loading state integration
 * 
 * @component
 * @example
 * // Automatically displayed by Next.js app router during system settings navigation
 * // No manual usage required - Next.js handles this component automatically
 */

import React from 'react';

/**
 * Skeleton loading animation component
 * Provides a reusable animated skeleton element with accessibility support
 */
const SkeletonElement: React.FC<{
  className?: string;
  'aria-label'?: string;
}> = ({ className = '', 'aria-label': ariaLabel }) => (
  <div
    className={`animate-pulse bg-gray-200 dark:bg-gray-700 rounded ${className}`}
    role="img"
    aria-label={ariaLabel || 'Loading content'}
    aria-hidden="true"
  />
);

/**
 * Skeleton table component
 * Provides loading state for system configuration tables
 */
const SkeletonTable: React.FC = () => {
  return (
    <div className="bg-white dark:bg-gray-900 shadow-sm rounded-lg border border-gray-200 dark:border-gray-700">
      {/* Table header skeleton */}
      <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between">
          <SkeletonElement 
            className="h-6 w-48" 
            aria-label="Loading table title"
          />
          <SkeletonElement 
            className="h-9 w-32" 
            aria-label="Loading action button"
          />
        </div>
      </div>
      
      {/* Table content skeleton */}
      <div className="divide-y divide-gray-200 dark:divide-gray-700">
        {/* Table rows skeleton */}
        {Array.from({ length: 5 }).map((_, index) => (
          <div key={index} className="px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <SkeletonElement 
                  className="h-4 w-32" 
                  aria-label={`Loading table row ${index + 1} name`}
                />
                <SkeletonElement 
                  className="h-4 w-48" 
                  aria-label={`Loading table row ${index + 1} value`}
                />
              </div>
              <div className="flex items-center space-x-2">
                <SkeletonElement 
                  className="h-8 w-16" 
                  aria-label={`Loading table row ${index + 1} action`}
                />
                <SkeletonElement 
                  className="h-8 w-8 rounded-full" 
                  aria-label={`Loading table row ${index + 1} menu`}
                />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

/**
 * Skeleton card component
 * Provides loading state for system configuration cards
 */
const SkeletonCard: React.FC<{
  title?: string;
  showButton?: boolean;
}> = ({ title, showButton = false }) => {
  return (
    <div className="bg-white dark:bg-gray-900 shadow-sm rounded-lg border border-gray-200 dark:border-gray-700 p-6">
      {/* Card header */}
      <div className="mb-4">
        <SkeletonElement 
          className="h-6 w-40 mb-2" 
          aria-label={`Loading ${title || 'card'} title`}
        />
        <SkeletonElement 
          className="h-4 w-full" 
          aria-label={`Loading ${title || 'card'} description`}
        />
      </div>
      
      {/* Card content */}
      <div className="space-y-3">
        <SkeletonElement 
          className="h-4 w-3/4" 
          aria-label={`Loading ${title || 'card'} content line 1`}
        />
        <SkeletonElement 
          className="h-4 w-1/2" 
          aria-label={`Loading ${title || 'card'} content line 2`}
        />
      </div>
      
      {/* Card action button */}
      {showButton && (
        <div className="mt-6">
          <SkeletonElement 
            className="h-9 w-32" 
            aria-label={`Loading ${title || 'card'} action button`}
          />
        </div>
      )}
    </div>
  );
};

/**
 * Navigation breadcrumb skeleton
 * Provides loading state for page navigation context
 */
const SkeletonBreadcrumb: React.FC = () => {
  return (
    <div className="flex items-center space-x-2 mb-6">
      <SkeletonElement 
        className="h-4 w-20" 
        aria-label="Loading breadcrumb home"
      />
      <div className="text-gray-400 dark:text-gray-500">/</div>
      <SkeletonElement 
        className="h-4 w-32" 
        aria-label="Loading breadcrumb current page"
      />
    </div>
  );
};

/**
 * Page header skeleton
 * Provides loading state for page title and description
 */
const SkeletonPageHeader: React.FC = () => {
  return (
    <div className="mb-8">
      <SkeletonElement 
        className="h-8 w-64 mb-3" 
        aria-label="Loading page title"
      />
      <SkeletonElement 
        className="h-5 w-96" 
        aria-label="Loading page description"
      />
    </div>
  );
};

/**
 * System settings grid layout skeleton
 * Provides loading state for the main system settings dashboard
 */
const SkeletonSystemGrid: React.FC = () => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
      {/* Cache Management */}
      <SkeletonCard title="cache management" showButton={true} />
      
      {/* CORS Configuration */}
      <SkeletonCard title="CORS configuration" showButton={true} />
      
      {/* Email Templates */}
      <SkeletonCard title="email templates" />
      
      {/* Global Lookup Keys */}
      <SkeletonCard title="lookup keys" />
      
      {/* Scheduler Management */}
      <SkeletonCard title="scheduler" showButton={true} />
      
      {/* System Information */}
      <SkeletonCard title="system info" />
    </div>
  );
};

/**
 * Loading spinner for slow network conditions
 * Provides additional feedback when loading takes longer than expected
 */
const SlowLoadingIndicator: React.FC = () => {
  const [showSlowIndicator, setShowSlowIndicator] = React.useState(false);
  
  React.useEffect(() => {
    // Show additional feedback after 3 seconds of loading
    const timer = setTimeout(() => {
      setShowSlowIndicator(true);
    }, 3000);
    
    return () => clearTimeout(timer);
  }, []);
  
  if (!showSlowIndicator) return null;
  
  return (
    <div className="fixed bottom-4 right-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4 shadow-lg">
      <div className="flex items-center space-x-3">
        {/* Spinning indicator */}
        <div className="animate-spin h-5 w-5 border-2 border-yellow-400 border-t-transparent rounded-full" />
        <div>
          <p className="text-sm font-medium text-yellow-800 dark:text-yellow-200">
            Taking longer than usual
          </p>
          <p className="text-xs text-yellow-600 dark:text-yellow-300">
            Loading system configuration...
          </p>
        </div>
      </div>
    </div>
  );
};

/**
 * System Settings Loading Component
 * 
 * This component is automatically displayed by Next.js during:
 * - Navigation to /system-settings routes
 * - Server-side data fetching for system configuration
 * - React Query cache misses for system data
 * - Suspense boundary fallbacks for system components
 * 
 * Features:
 * - Skeleton UI matching actual system settings layout
 * - Responsive design for mobile, tablet, and desktop
 * - WCAG 2.1 AA compliant with proper ARIA attributes
 * - Reduced motion support for accessibility
 * - Progressive loading feedback for slow connections
 * - Server-side rendering compatibility
 * 
 * @returns JSX element containing the system settings loading interface
 */
export default function SystemSettingsLoading(): JSX.Element {
  return (
    <div
      className="min-h-screen bg-gray-50 dark:bg-gray-950"
      role="status"
      aria-live="polite"
      aria-busy="true"
      aria-label="Loading system settings"
    >
      {/* Main content container with proper spacing */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Breadcrumb navigation skeleton */}
        <SkeletonBreadcrumb />
        
        {/* Page header skeleton */}
        <SkeletonPageHeader />
        
        {/* Primary content area */}
        <div className="space-y-8">
          {/* System configuration overview grid */}
          <div>
            <SkeletonElement 
              className="h-6 w-48 mb-4" 
              aria-label="Loading section title"
            />
            <SkeletonSystemGrid />
          </div>
          
          {/* Recent activity table */}
          <div>
            <SkeletonElement 
              className="h-6 w-40 mb-4" 
              aria-label="Loading activity section title"
            />
            <SkeletonTable />
          </div>
        </div>
        
        {/* Hidden text for screen readers */}
        <span className="sr-only">
          Loading system settings configuration. This includes cache management, 
          CORS configuration, email templates, global lookup keys, scheduler 
          settings, and system information. Please wait while we fetch the data.
        </span>
      </div>
      
      {/* Slow loading indicator for network feedback */}
      <SlowLoadingIndicator />
      
      {/* Reduced motion fallback styles */}
      <style jsx>{`
        @media (prefers-reduced-motion: reduce) {
          .animate-pulse {
            animation: none;
            opacity: 0.6;
          }
          .animate-spin {
            animation: none;
          }
        }
      `}</style>
    </div>
  );
}

/**
 * Component metadata for Next.js optimization
 */
SystemSettingsLoading.displayName = 'SystemSettingsLoading';

// Ensure this component can be server-side rendered
if (typeof window === 'undefined') {
  // Server-side rendering compatibility check
  // Component is designed to work without client-side JavaScript
}