/**
 * Loading UI component for the event scripts section
 * 
 * Displays skeleton placeholders during data fetching operations for:
 * - Script management tables
 * - Script editor and form components  
 * - Code syntax highlighting areas
 * 
 * Implements Next.js app router loading patterns with WCAG 2.1 AA compliance
 * and responsive design using Tailwind CSS 4.1+ animations.
 */

'use client';

import React from 'react';

/**
 * Reusable skeleton component with accessibility and animation support
 */
interface SkeletonProps {
  className?: string;
  variant?: 'text' | 'rectangular' | 'circular' | 'code';
  width?: string;
  height?: string;
  'aria-label'?: string;
}

function Skeleton({ 
  className = '', 
  variant = 'rectangular',
  width,
  height,
  'aria-label': ariaLabel = 'Loading content'
}: SkeletonProps) {
  const baseClasses = 'animate-pulse bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 dark:from-gray-700 dark:via-gray-600 dark:to-gray-700';
  
  const variantClasses = {
    text: 'rounded h-4',
    rectangular: 'rounded-md',
    circular: 'rounded-full',
    code: 'rounded font-mono text-sm'
  };

  const style: React.CSSProperties = {};
  if (width) style.width = width;
  if (height) style.height = height;

  return (
    <div
      className={`${baseClasses} ${variantClasses[variant]} ${className}`}
      style={style}
      role="status"
      aria-label={ariaLabel}
      aria-busy="true"
    >
      <span className="sr-only">Loading...</span>
    </div>
  );
}

/**
 * Loading skeleton for script table rows
 */
function ScriptTableRowSkeleton() {
  return (
    <tr className="border-b border-gray-200 dark:border-gray-700">
      <td className="px-6 py-4">
        <div className="flex items-center space-x-3">
          <Skeleton variant="circular" className="w-8 h-8" aria-label="Loading script icon" />
          <div className="space-y-2 flex-1">
            <Skeleton variant="text" className="w-32" aria-label="Loading script name" />
            <Skeleton variant="text" className="w-24 h-3" aria-label="Loading script type" />
          </div>
        </div>
      </td>
      <td className="px-6 py-4">
        <Skeleton variant="text" className="w-20" aria-label="Loading script status" />
      </td>
      <td className="px-6 py-4">
        <Skeleton variant="text" className="w-28" aria-label="Loading last modified date" />
      </td>
      <td className="px-6 py-4">
        <div className="flex space-x-2">
          <Skeleton variant="rectangular" className="w-8 h-8" aria-label="Loading action button" />
          <Skeleton variant="rectangular" className="w-8 h-8" aria-label="Loading action button" />
          <Skeleton variant="rectangular" className="w-8 h-8" aria-label="Loading action button" />
        </div>
      </td>
    </tr>
  );
}

/**
 * Loading skeleton for script table header and controls
 */
function ScriptTableHeaderSkeleton() {
  return (
    <div className="space-y-4">
      {/* Page header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="space-y-2">
          <Skeleton variant="text" className="w-48 h-8" aria-label="Loading page title" />
          <Skeleton variant="text" className="w-64 h-4" aria-label="Loading page description" />
        </div>
        <Skeleton variant="rectangular" className="w-32 h-10" aria-label="Loading create button" />
      </div>

      {/* Search and filter controls */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1">
          <Skeleton variant="rectangular" className="w-full h-10" aria-label="Loading search input" />
        </div>
        <div className="flex gap-2">
          <Skeleton variant="rectangular" className="w-24 h-10" aria-label="Loading filter dropdown" />
          <Skeleton variant="rectangular" className="w-20 h-10" aria-label="Loading sort dropdown" />
        </div>
      </div>
    </div>
  );
}

/**
 * Loading skeleton for script editor components
 */
function ScriptEditorSkeleton() {
  return (
    <div className="space-y-6">
      {/* Editor header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="space-y-2">
          <Skeleton variant="text" className="w-40 h-6" aria-label="Loading script title" />
          <div className="flex items-center space-x-2">
            <Skeleton variant="text" className="w-16 h-4" aria-label="Loading script type" />
            <span className="text-gray-400">•</span>
            <Skeleton variant="text" className="w-20 h-4" aria-label="Loading script status" />
          </div>
        </div>
        <div className="flex gap-2">
          <Skeleton variant="rectangular" className="w-16 h-9" aria-label="Loading save button" />
          <Skeleton variant="rectangular" className="w-16 h-9" aria-label="Loading test button" />
        </div>
      </div>

      {/* Script configuration form */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1 space-y-4">
          <div className="space-y-2">
            <Skeleton variant="text" className="w-16 h-4" aria-label="Loading form label" />
            <Skeleton variant="rectangular" className="w-full h-10" aria-label="Loading form input" />
          </div>
          <div className="space-y-2">
            <Skeleton variant="text" className="w-20 h-4" aria-label="Loading form label" />
            <Skeleton variant="rectangular" className="w-full h-10" aria-label="Loading form select" />
          </div>
          <div className="space-y-2">
            <Skeleton variant="text" className="w-24 h-4" aria-label="Loading form label" />
            <Skeleton variant="rectangular" className="w-full h-20" aria-label="Loading form textarea" />
          </div>
        </div>

        {/* Code editor area */}
        <div className="lg:col-span-2">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Skeleton variant="text" className="w-20 h-4" aria-label="Loading editor label" />
              <div className="flex space-x-2">
                <Skeleton variant="rectangular" className="w-16 h-6" aria-label="Loading editor option" />
                <Skeleton variant="rectangular" className="w-20 h-6" aria-label="Loading editor option" />
              </div>
            </div>
            
            {/* Code editor skeleton with syntax highlighting pattern */}
            <div className="border border-gray-300 dark:border-gray-600 rounded-lg overflow-hidden">
              {/* Editor toolbar */}
              <div className="flex items-center justify-between px-4 py-2 bg-gray-50 dark:bg-gray-800 border-b border-gray-300 dark:border-gray-600">
                <div className="flex space-x-2">
                  <Skeleton variant="rectangular" className="w-6 h-6" aria-label="Loading editor tool" />
                  <Skeleton variant="rectangular" className="w-6 h-6" aria-label="Loading editor tool" />
                  <Skeleton variant="rectangular" className="w-6 h-6" aria-label="Loading editor tool" />
                </div>
                <Skeleton variant="text" className="w-16 h-4" aria-label="Loading editor status" />
              </div>
              
              {/* Code area with line numbers and syntax highlighting simulation */}
              <div className="relative min-h-[400px] bg-white dark:bg-gray-900">
                <div className="absolute left-0 top-0 w-12 bg-gray-50 dark:bg-gray-800 h-full border-r border-gray-200 dark:border-gray-700">
                  {/* Line numbers */}
                  {Array.from({ length: 15 }, (_, i) => (
                    <div key={i} className="h-6 flex items-center justify-center">
                      <Skeleton variant="text" className="w-4 h-3" aria-label={`Loading line ${i + 1}`} />
                    </div>
                  ))}
                </div>
                
                {/* Code content */}
                <div className="pl-16 p-4 space-y-2">
                  {Array.from({ length: 15 }, (_, i) => (
                    <div key={i} className="flex space-x-2">
                      <Skeleton 
                        variant="code" 
                        className={`h-4 ${
                          i === 0 ? 'w-24' : 
                          i === 1 ? 'w-32' : 
                          i === 2 ? 'w-40' :
                          i % 3 === 0 ? 'w-28' :
                          i % 3 === 1 ? 'w-36' : 'w-20'
                        }`}
                        aria-label={`Loading code line ${i + 1}`}
                      />
                      {i % 4 === 0 && (
                        <Skeleton variant="code" className="w-16 h-4" aria-label="Loading code continuation" />
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Main loading component for event scripts section
 * 
 * Provides comprehensive loading states for all script management interfaces
 * with responsive design and accessibility support.
 */
export default function EventScriptsLoading() {
  return (
    <div 
      className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-200"
      role="main"
      aria-live="polite"
      aria-busy="true"
      aria-label="Loading event scripts interface"
    >
      {/* Skip link for accessibility */}
      <a 
        href="#main-content" 
        className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 bg-primary-600 text-white px-4 py-2 rounded-md z-50"
      >
        Skip to main content
      </a>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6" id="main-content">
        {/* Responsive loading states - Mobile first approach */}
        
        {/* Mobile: Stack layout for smaller screens */}
        <div className="block lg:hidden">
          <div className="space-y-6">
            <ScriptTableHeaderSkeleton />
            
            {/* Mobile card view for scripts */}
            <div className="space-y-4">
              {Array.from({ length: 6 }, (_, i) => (
                <div key={i} className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm border border-gray-200 dark:border-gray-700">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center space-x-3 flex-1">
                      <Skeleton variant="circular" className="w-10 h-10" aria-label="Loading script icon" />
                      <div className="space-y-1 flex-1">
                        <Skeleton variant="text" className="w-32 h-5" aria-label="Loading script name" />
                        <Skeleton variant="text" className="w-20 h-4" aria-label="Loading script type" />
                      </div>
                    </div>
                    <Skeleton variant="rectangular" className="w-8 h-8" aria-label="Loading menu button" />
                  </div>
                  <div className="flex justify-between items-center">
                    <Skeleton variant="text" className="w-24 h-4" aria-label="Loading status" />
                    <Skeleton variant="text" className="w-28 h-4" aria-label="Loading date" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Desktop: Table layout for larger screens */}
        <div className="hidden lg:block">
          <div className="space-y-6">
            <ScriptTableHeaderSkeleton />
            
            {/* Desktop table view */}
            <div className="bg-white dark:bg-gray-800 shadow-sm rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead className="bg-gray-50 dark:bg-gray-700">
                  <tr>
                    <th className="px-6 py-3 text-left">
                      <Skeleton variant="text" className="w-20 h-4" aria-label="Loading column header" />
                    </th>
                    <th className="px-6 py-3 text-left">
                      <Skeleton variant="text" className="w-16 h-4" aria-label="Loading column header" />
                    </th>
                    <th className="px-6 py-3 text-left">
                      <Skeleton variant="text" className="w-24 h-4" aria-label="Loading column header" />
                    </th>
                    <th className="px-6 py-3 text-left">
                      <Skeleton variant="text" className="w-16 h-4" aria-label="Loading column header" />
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                  {Array.from({ length: 8 }, (_, i) => (
                    <ScriptTableRowSkeleton key={i} />
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination skeleton */}
            <div className="flex items-center justify-between">
              <Skeleton variant="text" className="w-32 h-4" aria-label="Loading pagination info" />
              <div className="flex space-x-2">
                <Skeleton variant="rectangular" className="w-8 h-8" aria-label="Loading pagination button" />
                <Skeleton variant="rectangular" className="w-8 h-8" aria-label="Loading pagination button" />
                <Skeleton variant="rectangular" className="w-8 h-8" aria-label="Loading pagination button" />
                <Skeleton variant="rectangular" className="w-8 h-8" aria-label="Loading pagination button" />
              </div>
            </div>
          </div>
        </div>

        {/* Script editor loading state - shown when editing/creating */}
        <div className="mt-8">
          <div className="bg-white dark:bg-gray-800 shadow-sm rounded-lg border border-gray-200 dark:border-gray-700 p-6">
            <ScriptEditorSkeleton />
          </div>
        </div>
      </div>

      {/* Loading announcement for screen readers */}
      <div 
        aria-live="polite" 
        aria-atomic="true" 
        className="sr-only"
        role="status"
      >
        Loading event scripts interface. Please wait while we fetch your scripts and prepare the editor.
      </div>

      {/* Global loading indicator */}
      <div className="fixed bottom-4 right-4 z-50">
        <div className="bg-white dark:bg-gray-800 rounded-full p-3 shadow-lg border border-gray-200 dark:border-gray-700">
          <div className="w-6 h-6 border-2 border-primary-600 border-t-transparent rounded-full animate-spin" 
               role="status" 
               aria-label="Loading in progress">
            <span className="sr-only">Loading...</span>
          </div>
        </div>
      </div>
    </div>
  );
}