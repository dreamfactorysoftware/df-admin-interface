/**
 * Table Details Loading Component
 * 
 * Loading state component for table details page implementing Next.js app router pattern.
 * Provides skeleton loading interface with proper accessibility and responsive design.
 * Maintains visual hierarchy and expected layout structure during data fetching.
 * 
 * Features:
 * - Skeleton loading animation with realistic content placeholders
 * - WCAG 2.1 AA accessibility compliance with proper ARIA labels
 * - Responsive design matching the full table details interface
 * - Smooth animation transitions with reduced motion support
 * - Consistent theming with Tailwind CSS design system
 * 
 * @fileoverview Table details loading state component
 * @version 1.0.0
 * @created 2024-12-28
 */

import React from 'react';
import { cn } from '@/lib/utils';

/**
 * Skeleton component for reusable loading placeholders
 */
interface SkeletonProps {
  className?: string;
  children?: React.ReactNode;
}

const Skeleton: React.FC<SkeletonProps> = ({ className, children }) => (
  <div
    className={cn(
      'animate-pulse bg-gray-200 dark:bg-gray-700 rounded',
      className
    )}
    aria-hidden="true"
  >
    {children}
  </div>
);

/**
 * Tab skeleton component
 */
const TabSkeleton: React.FC = () => (
  <div className="flex space-x-1 border-b border-gray-200 dark:border-gray-700">
    {Array.from({ length: 5 }).map((_, index) => (
      <div
        key={index}
        className="flex items-center space-x-2 px-4 py-3 border-b-2 border-transparent"
      >
        <Skeleton className="h-5 w-5" />
        <Skeleton className="h-4 w-16" />
      </div>
    ))}
  </div>
);

/**
 * Form skeleton for basic info tab
 */
const FormSkeleton: React.FC = () => (
  <div className="space-y-6">
    {/* Header */}
    <div className="border-b border-gray-200 dark:border-gray-700 pb-4">
      <Skeleton className="h-6 w-48 mb-2" />
      <Skeleton className="h-4 w-96" />
    </div>

    {/* Form fields grid */}
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {Array.from({ length: 5 }).map((_, index) => (
        <div key={index} className={index === 4 ? 'md:col-span-2' : ''}>
          <Skeleton className="h-4 w-24 mb-2" />
          <Skeleton className="h-11 w-full" />
          <Skeleton className="h-3 w-32 mt-1" />
        </div>
      ))}
    </div>

    {/* Action buttons */}
    <div className="flex justify-end space-x-4 pt-6 border-t border-gray-200 dark:border-gray-700">
      <Skeleton className="h-11 w-20" />
      <Skeleton className="h-11 w-24" />
    </div>
  </div>
);

/**
 * Table skeleton for fields/relationships tabs
 */
const TableSkeleton: React.FC = () => (
  <div className="space-y-4">
    {/* Table header */}
    <div className="flex justify-between items-center">
      <Skeleton className="h-6 w-32" />
      <Skeleton className="h-10 w-24" />
    </div>

    {/* Search and filters */}
    <div className="flex flex-wrap gap-4">
      <Skeleton className="h-10 w-64" />
      <Skeleton className="h-10 w-24" />
      <Skeleton className="h-10 w-24" />
    </div>

    {/* Table */}
    <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
      {/* Table header row */}
      <div className="grid grid-cols-6 gap-4 px-4 py-3 bg-gray-50 dark:bg-gray-700 border-b border-gray-200 dark:border-gray-600">
        {Array.from({ length: 6 }).map((_, index) => (
          <Skeleton key={index} className="h-4 w-full" />
        ))}
      </div>

      {/* Table rows */}
      {Array.from({ length: 8 }).map((_, rowIndex) => (
        <div
          key={rowIndex}
          className="grid grid-cols-6 gap-4 px-4 py-3 border-b border-gray-200 dark:border-gray-600 last:border-b-0"
        >
          {Array.from({ length: 6 }).map((_, colIndex) => (
            <Skeleton
              key={colIndex}
              className={cn(
                'h-4',
                colIndex === 0 ? 'w-24' : colIndex === 1 ? 'w-16' : 'w-full'
              )}
            />
          ))}
        </div>
      ))}
    </div>

    {/* Pagination */}
    <div className="flex justify-between items-center">
      <Skeleton className="h-4 w-32" />
      <div className="flex space-x-2">
        <Skeleton className="h-8 w-8" />
        <Skeleton className="h-8 w-8" />
        <Skeleton className="h-8 w-8" />
        <Skeleton className="h-8 w-8" />
      </div>
    </div>
  </div>
);

/**
 * JSON Editor skeleton
 */
const JsonEditorSkeleton: React.FC = () => (
  <div className="space-y-4">
    {/* Header */}
    <div className="flex justify-between items-center">
      <div>
        <Skeleton className="h-6 w-48 mb-2" />
        <Skeleton className="h-4 w-96" />
      </div>
      <div className="flex space-x-2">
        <Skeleton className="h-10 w-20" />
        <Skeleton className="h-10 w-20" />
      </div>
    </div>

    {/* Editor container */}
    <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
      {/* Editor toolbar */}
      <div className="flex justify-between items-center px-4 py-2 bg-gray-50 dark:bg-gray-700 border-b border-gray-200 dark:border-gray-600">
        <div className="flex space-x-2">
          <Skeleton className="h-6 w-16" />
          <Skeleton className="h-6 w-20" />
        </div>
        <Skeleton className="h-6 w-24" />
      </div>

      {/* Editor content */}
      <div className="p-4 font-mono text-sm space-y-2">
        {Array.from({ length: 20 }).map((_, index) => (
          <div key={index} className="flex">
            <Skeleton className="h-4 w-6 mr-4" />
            <Skeleton
              className={cn(
                'h-4',
                index % 4 === 0 ? 'w-32' : index % 4 === 1 ? 'w-48' : index % 4 === 2 ? 'w-24' : 'w-40'
              )}
            />
          </div>
        ))}
      </div>
    </div>
  </div>
);

/**
 * Main TableDetailsLoading component
 */
export function TableDetailsLoading() {
  return (
    <div 
      className="min-h-screen bg-gray-50 dark:bg-gray-900"
      role="status"
      aria-label="Loading table details"
    >
      <div className="container mx-auto px-4 py-6 max-w-7xl">
        {/* Page Header Skeleton */}
        <header className="mb-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="min-w-0 flex-1">
              {/* Breadcrumb skeleton */}
              <nav className="flex mb-2" aria-label="Breadcrumb">
                <div className="flex items-center space-x-2">
                  <Skeleton className="h-4 w-24" />
                  <span className="text-gray-400">/</span>
                  <Skeleton className="h-4 w-20" />
                  <span className="text-gray-400">/</span>
                  <Skeleton className="h-4 w-32" />
                </div>
              </nav>

              {/* Page title and description */}
              <div className="mt-2">
                <Skeleton className="h-8 w-64 mb-2" />
                <Skeleton className="h-4 w-96" />
              </div>
            </div>

            {/* Action buttons skeleton */}
            <div className="flex flex-shrink-0 space-x-3">
              <Skeleton className="h-10 w-32" />
              <Skeleton className="h-10 w-36" />
            </div>
          </div>
        </header>

        {/* Main Content Skeleton */}
        <main>
          <div className="bg-white dark:bg-gray-800 shadow-sm rounded-lg border border-gray-200 dark:border-gray-700">
            {/* Tab navigation skeleton */}
            <TabSkeleton />

            {/* Tab content skeleton - defaulting to form layout */}
            <div className="p-6">
              <FormSkeleton />
            </div>
          </div>
        </main>
      </div>

      {/* Screen reader announcement */}
      <div className="sr-only" aria-live="polite">
        Loading table details, please wait...
      </div>
    </div>
  );
}

/**
 * Specific loading components for different tab content
 */
export const TableFormLoading: React.FC = () => (
  <div className="p-6">
    <FormSkeleton />
  </div>
);

export const TableFieldsLoading: React.FC = () => (
  <div className="p-6">
    <TableSkeleton />
  </div>
);

export const TableRelationshipsLoading: React.FC = () => (
  <div className="p-6">
    <TableSkeleton />
  </div>
);

export const TableJsonEditorLoading: React.FC = () => (
  <div className="p-6">
    <JsonEditorSkeleton />
  </div>
);

export default TableDetailsLoading;