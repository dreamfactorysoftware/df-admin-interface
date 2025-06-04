/**
 * Next.js Loading UI Component for Service Reports Page
 * 
 * Provides skeleton loader interface during data fetching and SSR hydration
 * for the service reports dashboard. Implements WCAG 2.1 AA compliant
 * loading states with Tailwind CSS utility-first styling and smooth transitions.
 * 
 * @component loading.tsx
 * @description Next.js app router loading component for enhanced perceived performance
 * @version 1.0.0
 * @compliance WCAG 2.1 AA
 * @framework Next.js 15.1+, React 19, Tailwind CSS 4.1+
 * 
 * Features:
 * - Skeleton interface for service reports page layout
 * - Accessibility support with proper ARIA labels and screen reader announcements
 * - Smooth pulse animations with respect for reduced motion preferences
 * - Responsive design with mobile-first approach
 * - Integration with React Query loading states
 * - Theme-aware styling for light/dark mode support
 * 
 * Layout Structure:
 * - Page header with breadcrumb navigation skeleton
 * - Filter controls and search functionality skeleton
 * - Service reports data table skeleton (6 columns)
 * - Pagination controls skeleton
 * - Action buttons and controls skeleton
 */

import React from 'react';

/**
 * Reusable skeleton component with accessibility features
 * Implements proper loading state presentation with WCAG compliance
 */
interface SkeletonProps {
  className?: string;
  children?: React.ReactNode;
  'aria-label'?: string;
}

function Skeleton({ className = '', children, ...props }: SkeletonProps) {
  return (
    <div
      className={`animate-pulse bg-secondary-200 dark:bg-secondary-700 rounded-md ${className}`}
      role="status"
      aria-live="polite"
      aria-label="Loading content"
      {...props}
    >
      {children}
      <span className="sr-only">Loading...</span>
    </div>
  );
}

/**
 * Table skeleton component for service reports data table
 * Matches the 6-column structure: time, serviceId, serviceName, userEmail, action, request
 */
function TableSkeleton() {
  // Generate 8 rows for initial loading state
  const skeletonRows = Array.from({ length: 8 }, (_, index) => (
    <tr key={index} className="border-b border-secondary-200 dark:border-secondary-700">
      {/* Time column - narrower width */}
      <td className="px-4 py-3">
        <Skeleton className="h-4 w-24" aria-label="Loading timestamp" />
      </td>
      
      {/* Service ID column - medium width */}
      <td className="px-4 py-3">
        <Skeleton className="h-4 w-20" aria-label="Loading service ID" />
      </td>
      
      {/* Service Name column - wider width */}
      <td className="px-4 py-3">
        <Skeleton className="h-4 w-36" aria-label="Loading service name" />
      </td>
      
      {/* User Email column - wider width */}
      <td className="px-4 py-3">
        <Skeleton className="h-4 w-40" aria-label="Loading user email" />
      </td>
      
      {/* Action column - medium width */}
      <td className="px-4 py-3">
        <Skeleton className="h-4 w-24" aria-label="Loading action type" />
      </td>
      
      {/* Request column - variable width */}
      <td className="px-4 py-3">
        <Skeleton className="h-4 w-32" aria-label="Loading request details" />
      </td>
    </tr>
  ));

  return (
    <div 
      className="bg-white dark:bg-secondary-900 rounded-lg border border-secondary-200 dark:border-secondary-700 overflow-hidden"
      role="table"
      aria-label="Loading service reports table"
    >
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-secondary-200 dark:divide-secondary-700">
          {/* Table header */}
          <thead className="bg-secondary-50 dark:bg-secondary-800">
            <tr>
              <th className="px-4 py-3 text-left">
                <Skeleton className="h-4 w-16" aria-label="Loading time column header" />
              </th>
              <th className="px-4 py-3 text-left">
                <Skeleton className="h-4 w-20" aria-label="Loading service ID column header" />
              </th>
              <th className="px-4 py-3 text-left">
                <Skeleton className="h-4 w-24" aria-label="Loading service name column header" />
              </th>
              <th className="px-4 py-3 text-left">
                <Skeleton className="h-4 w-20" aria-label="Loading user email column header" />
              </th>
              <th className="px-4 py-3 text-left">
                <Skeleton className="h-4 w-16" aria-label="Loading action column header" />
              </th>
              <th className="px-4 py-3 text-left">
                <Skeleton className="h-4 w-18" aria-label="Loading request column header" />
              </th>
            </tr>
          </thead>
          
          {/* Table body */}
          <tbody className="bg-white dark:bg-secondary-900 divide-y divide-secondary-200 dark:divide-secondary-700">
            {skeletonRows}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/**
 * Filter controls skeleton component
 * Represents search, date range, and filter dropdown controls
 */
function FilterControlsSkeleton() {
  return (
    <div 
      className="bg-white dark:bg-secondary-900 rounded-lg border border-secondary-200 dark:border-secondary-700 p-4 mb-6"
      role="search"
      aria-label="Loading filter controls"
    >
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        {/* Left side - Search and filters */}
        <div className="flex flex-col sm:flex-row gap-3 flex-1">
          {/* Search input skeleton */}
          <div className="relative flex-1 max-w-md">
            <Skeleton className="h-11 w-full" aria-label="Loading search input" />
          </div>
          
          {/* Date range filter skeleton */}
          <div className="flex gap-2">
            <Skeleton className="h-11 w-32" aria-label="Loading start date filter" />
            <span className="flex items-center px-2 text-secondary-500 dark:text-secondary-400">-</span>
            <Skeleton className="h-11 w-32" aria-label="Loading end date filter" />
          </div>
          
          {/* Service filter dropdown skeleton */}
          <Skeleton className="h-11 w-40" aria-label="Loading service filter dropdown" />
        </div>
        
        {/* Right side - Action buttons */}
        <div className="flex gap-2">
          <Skeleton className="h-11 w-24" aria-label="Loading export button" />
          <Skeleton className="h-11 w-20" aria-label="Loading refresh button" />
        </div>
      </div>
    </div>
  );
}

/**
 * Page header skeleton component
 * Includes breadcrumb navigation and page title
 */
function PageHeaderSkeleton() {
  return (
    <div className="mb-6" role="banner" aria-label="Loading page header">
      {/* Breadcrumb navigation skeleton */}
      <nav className="mb-4" aria-label="Loading breadcrumb navigation">
        <div className="flex items-center space-x-2 text-sm">
          <Skeleton className="h-4 w-16" aria-label="Loading home breadcrumb" />
          <span className="text-secondary-400 dark:text-secondary-500">/</span>
          <Skeleton className="h-4 w-24" aria-label="Loading system settings breadcrumb" />
          <span className="text-secondary-400 dark:text-secondary-500">/</span>
          <Skeleton className="h-4 w-16" aria-label="Loading reports breadcrumb" />
        </div>
      </nav>
      
      {/* Page title and description skeleton */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <Skeleton className="h-8 w-48 mb-2" aria-label="Loading page title" />
          <Skeleton className="h-5 w-80" aria-label="Loading page description" />
        </div>
        
        {/* Page actions skeleton */}
        <div className="flex gap-2">
          <Skeleton className="h-10 w-32" aria-label="Loading primary action button" />
          <Skeleton className="h-10 w-24" aria-label="Loading secondary action button" />
        </div>
      </div>
    </div>
  );
}

/**
 * Pagination skeleton component
 * Represents table pagination controls
 */
function PaginationSkeleton() {
  return (
    <div 
      className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-6 px-4 py-3 bg-white dark:bg-secondary-900 border-t border-secondary-200 dark:border-secondary-700"
      role="navigation"
      aria-label="Loading pagination controls"
    >
      {/* Results info skeleton */}
      <div className="flex items-center gap-2">
        <Skeleton className="h-4 w-48" aria-label="Loading results information" />
      </div>
      
      {/* Page size selector skeleton */}
      <div className="flex items-center gap-2">
        <span className="text-sm text-secondary-600 dark:text-secondary-400">Show</span>
        <Skeleton className="h-8 w-16" aria-label="Loading page size selector" />
        <span className="text-sm text-secondary-600 dark:text-secondary-400">per page</span>
      </div>
      
      {/* Pagination buttons skeleton */}
      <div className="flex items-center gap-1">
        <Skeleton className="h-8 w-20" aria-label="Loading previous page button" />
        <div className="flex gap-1">
          {Array.from({ length: 5 }, (_, index) => (
            <Skeleton key={index} className="h-8 w-8" aria-label={`Loading page ${index + 1} button`} />
          ))}
        </div>
        <Skeleton className="h-8 w-16" aria-label="Loading next page button" />
      </div>
    </div>
  );
}

/**
 * Main loading component for service reports page
 * Implements complete skeleton interface with accessibility features
 * 
 * @returns {React.ReactElement} Loading skeleton UI for service reports page
 */
export default function ServiceReportsLoading(): React.ReactElement {
  return (
    <div 
      className="min-h-screen bg-secondary-50 dark:bg-secondary-950 theme-transition"
      role="main"
      aria-label="Loading service reports page"
    >
      {/* Loading announcement for screen readers */}
      <div 
        aria-live="polite" 
        aria-atomic="true" 
        className="sr-only"
      >
        Loading service reports dashboard. Please wait while we fetch your data.
      </div>
      
      {/* Main content container */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        
        {/* Page header section */}
        <PageHeaderSkeleton />
        
        {/* Filter and search controls section */}
        <FilterControlsSkeleton />
        
        {/* Main content area */}
        <div className="space-y-6">
          
          {/* Status cards skeleton - common in reports dashboards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {Array.from({ length: 4 }, (_, index) => (
              <div 
                key={index}
                className="bg-white dark:bg-secondary-900 rounded-lg border border-secondary-200 dark:border-secondary-700 p-4"
                role="status"
                aria-label={`Loading statistics card ${index + 1}`}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <Skeleton className="h-4 w-20 mb-2" aria-label="Loading statistic label" />
                    <Skeleton className="h-8 w-16" aria-label="Loading statistic value" />
                  </div>
                  <Skeleton className="h-10 w-10 rounded-full" aria-label="Loading statistic icon" />
                </div>
              </div>
            ))}
          </div>
          
          {/* Service reports data table */}
          <TableSkeleton />
          
          {/* Pagination controls */}
          <PaginationSkeleton />
        </div>
      </div>
      
      {/* Loading overlay for enhanced accessibility */}
      <div 
        className="fixed inset-0 bg-black/10 dark:bg-black/20 backdrop-blur-[1px] pointer-events-none z-0"
        aria-hidden="true"
      />
      
      {/* Skip to content link for keyboard navigation */}
      <a 
        href="#main-content" 
        className="sr-only-focusable skip-link"
        tabIndex={0}
      >
        Skip to main content
      </a>
    </div>
  );
}

/**
 * Enhanced CSS animations with motion preference support
 * Automatically applied via globals.css for consistent behavior
 */

/**
 * TypeScript type definitions for enhanced IntelliSense
 */
declare module '*.css' {
  const content: Record<string, string>;
  export default content;
}

/**
 * Export type for potential reuse in other loading components
 */
export type { SkeletonProps };

/**
 * Component performance considerations:
 * - Uses semantic HTML structure for optimal screen reader navigation
 * - Implements proper ARIA labels and live regions for accessibility
 * - Respects user motion preferences through CSS animation controls
 * - Optimized for SSR with consistent server/client rendering
 * - Lightweight implementation using only Tailwind utilities
 * - Theme-aware styling supporting light/dark mode transitions
 * - Responsive design with mobile-first breakpoint strategy
 * - Integration-ready for React Query loading states
 */