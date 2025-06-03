/**
 * Loading UI component for the event scripts section
 * 
 * Displays skeleton placeholders during data fetching operations for:
 * - Script management table with columns (active, name, type, actions)
 * - Script detail forms with various input types
 * - Script editor with code syntax highlighting
 * 
 * Implements Next.js app router loading states with:
 * - WCAG 2.1 AA compliant accessibility features
 * - Responsive design for mobile and desktop viewports
 * - Theme-aware styling with dark/light mode support
 * - Tailwind CSS animations and consistent design system
 */

import React from 'react';

/**
 * Skeleton component for individual loading elements
 * Provides accessible loading indicators with proper ARIA attributes
 */
interface SkeletonProps {
  className?: string;
  'aria-label'?: string;
}

function Skeleton({ className = '', 'aria-label': ariaLabel }: SkeletonProps) {
  return (
    <div
      className={`animate-pulse bg-gray-200 dark:bg-gray-700 rounded ${className}`}
      role="presentation"
      aria-label={ariaLabel || 'Loading content'}
      aria-hidden="true"
    />
  );
}

/**
 * Loading spinner component for active loading states
 * Accessible with proper ARIA attributes and animation controls
 */
function LoadingSpinner({ size = 'md', className = '' }: { size?: 'sm' | 'md' | 'lg'; className?: string }) {
  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-6 w-6',
    lg: 'h-8 w-8'
  };

  return (
    <div
      className={`animate-spin rounded-full border-2 border-gray-300 dark:border-gray-600 border-t-primary-600 dark:border-t-primary-500 ${sizeClasses[size]} ${className}`}
      role="status"
      aria-label="Loading..."
      aria-live="polite"
    >
      <span className="sr-only">Loading...</span>
    </div>
  );
}

/**
 * Table loading skeleton for script management interface
 * Mimics the actual script table structure with proper column sizing
 */
function ScriptTableLoading() {
  return (
    <div 
      className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden"
      role="region"
      aria-label="Loading script management table"
    >
      {/* Table header */}
      <div className="bg-gray-50 dark:bg-gray-800 px-6 py-3 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Skeleton className="h-6 w-32" aria-label="Loading table title" />
            <Skeleton className="h-4 w-16" aria-label="Loading item count" />
          </div>
          <div className="flex items-center space-x-2">
            <Skeleton className="h-9 w-20" aria-label="Loading filter button" />
            <Skeleton className="h-9 w-24" aria-label="Loading create button" />
          </div>
        </div>
      </div>

      {/* Table column headers */}
      <div className="bg-gray-50 dark:bg-gray-800 px-6 py-3 border-b border-gray-200 dark:border-gray-700">
        <div className="grid grid-cols-12 gap-4">
          <div className="col-span-1">
            <Skeleton className="h-4 w-12" aria-label="Loading active column header" />
          </div>
          <div className="col-span-4 md:col-span-3">
            <Skeleton className="h-4 w-16" aria-label="Loading name column header" />
          </div>
          <div className="col-span-3 md:col-span-2">
            <Skeleton className="h-4 w-12" aria-label="Loading type column header" />
          </div>
          <div className="col-span-2 hidden md:block">
            <Skeleton className="h-4 w-20" aria-label="Loading service column header" />
          </div>
          <div className="col-span-2 hidden md:block">
            <Skeleton className="h-4 w-16" aria-label="Loading event column header" />
          </div>
          <div className="col-span-4 md:col-span-2">
            <Skeleton className="h-4 w-16" aria-label="Loading actions column header" />
          </div>
        </div>
      </div>

      {/* Table rows */}
      <div className="divide-y divide-gray-200 dark:divide-gray-700">
        {Array.from({ length: 8 }).map((_, index) => (
          <div key={index} className="px-6 py-4">
            <div className="grid grid-cols-12 gap-4 items-center">
              {/* Active status */}
              <div className="col-span-1">
                <Skeleton className="h-4 w-4 rounded-full" aria-label={`Loading active status for row ${index + 1}`} />
              </div>
              
              {/* Script name */}
              <div className="col-span-4 md:col-span-3">
                <Skeleton className="h-4 w-full max-w-[200px]" aria-label={`Loading script name for row ${index + 1}`} />
              </div>
              
              {/* Script type */}
              <div className="col-span-3 md:col-span-2">
                <Skeleton className="h-6 w-16 rounded-full" aria-label={`Loading script type for row ${index + 1}`} />
              </div>
              
              {/* Service (hidden on mobile) */}
              <div className="col-span-2 hidden md:block">
                <Skeleton className="h-4 w-full max-w-[120px]" aria-label={`Loading service for row ${index + 1}`} />
              </div>
              
              {/* Event (hidden on mobile) */}
              <div className="col-span-2 hidden md:block">
                <Skeleton className="h-4 w-full max-w-[100px]" aria-label={`Loading event for row ${index + 1}`} />
              </div>
              
              {/* Actions */}
              <div className="col-span-4 md:col-span-2">
                <div className="flex items-center space-x-2">
                  <Skeleton className="h-8 w-8 rounded" aria-label={`Loading edit action for row ${index + 1}`} />
                  <Skeleton className="h-8 w-8 rounded" aria-label={`Loading delete action for row ${index + 1}`} />
                  <Skeleton className="h-8 w-8 rounded md:hidden" aria-label={`Loading more actions for row ${index + 1}`} />
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Table footer with pagination */}
      <div className="bg-gray-50 dark:bg-gray-800 px-6 py-3 border-t border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between">
          <Skeleton className="h-4 w-32" aria-label="Loading pagination info" />
          <div className="flex items-center space-x-2">
            <Skeleton className="h-8 w-20" aria-label="Loading previous page button" />
            <Skeleton className="h-8 w-8" aria-label="Loading page number" />
            <Skeleton className="h-8 w-20" aria-label="Loading next page button" />
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Form loading skeleton for script creation/editing interface
 * Mimics the actual script detail form structure
 */
function ScriptFormLoading() {
  return (
    <div 
      className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700 p-6"
      role="region"
      aria-label="Loading script form"
    >
      {/* Form header */}
      <div className="mb-6">
        <Skeleton className="h-8 w-48 mb-2" aria-label="Loading form title" />
        <Skeleton className="h-4 w-96" aria-label="Loading form description" />
      </div>

      {/* Form sections */}
      <div className="space-y-6">
        {/* Service configuration section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div>
              <Skeleton className="h-4 w-24 mb-2" aria-label="Loading service label" />
              <Skeleton className="h-11 w-full" aria-label="Loading service dropdown" />
            </div>
            <div>
              <Skeleton className="h-4 w-20 mb-2" aria-label="Loading event label" />
              <Skeleton className="h-11 w-full" aria-label="Loading event dropdown" />
            </div>
          </div>
          
          <div className="space-y-4">
            <div>
              <Skeleton className="h-4 w-28 mb-2" aria-label="Loading method label" />
              <Skeleton className="h-11 w-full" aria-label="Loading HTTP method dropdown" />
            </div>
            <div>
              <Skeleton className="h-4 w-20 mb-2" aria-label="Loading table label" />
              <Skeleton className="h-11 w-full" aria-label="Loading table dropdown" />
            </div>
          </div>
        </div>

        {/* Script configuration section */}
        <div className="space-y-4">
          <div>
            <Skeleton className="h-4 w-24 mb-2" aria-label="Loading script name label" />
            <Skeleton className="h-11 w-full" aria-label="Loading script name input" />
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div>
              <Skeleton className="h-4 w-24 mb-2" aria-label="Loading script type label" />
              <Skeleton className="h-11 w-full" aria-label="Loading script type dropdown" />
            </div>
            <div className="space-y-4">
              {/* Toggle switches */}
              <div className="flex items-center justify-between">
                <Skeleton className="h-4 w-20" aria-label="Loading active toggle label" />
                <Skeleton className="h-6 w-12 rounded-full" aria-label="Loading active toggle" />
              </div>
              <div className="flex items-center justify-between">
                <Skeleton className="h-4 w-32" aria-label="Loading event modification toggle label" />
                <Skeleton className="h-6 w-12 rounded-full" aria-label="Loading event modification toggle" />
              </div>
            </div>
          </div>
        </div>

        {/* Storage service section */}
        <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
          <Skeleton className="h-6 w-32 mb-4" aria-label="Loading storage section title" />
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div>
              <Skeleton className="h-4 w-28 mb-2" aria-label="Loading storage service label" />
              <Skeleton className="h-11 w-full" aria-label="Loading storage service dropdown" />
            </div>
            <div>
              <Skeleton className="h-4 w-20 mb-2" aria-label="Loading path label" />
              <Skeleton className="h-11 w-full" aria-label="Loading path input" />
            </div>
          </div>
        </div>
      </div>

      {/* Form actions */}
      <div className="flex items-center justify-end space-x-4 mt-8 pt-6 border-t border-gray-200 dark:border-gray-700">
        <Skeleton className="h-11 w-20" aria-label="Loading cancel button" />
        <Skeleton className="h-11 w-24" aria-label="Loading save button" />
      </div>
    </div>
  );
}

/**
 * Script editor loading skeleton
 * Mimics the code editor interface with syntax highlighting areas
 */
function ScriptEditorLoading() {
  return (
    <div 
      className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden"
      role="region"
      aria-label="Loading script editor"
    >
      {/* Editor header */}
      <div className="bg-gray-50 dark:bg-gray-800 px-4 py-3 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Skeleton className="h-5 w-32" aria-label="Loading editor title" />
            <Skeleton className="h-6 w-16 rounded-full" aria-label="Loading language badge" />
          </div>
          <div className="flex items-center space-x-2">
            <Skeleton className="h-8 w-8 rounded" aria-label="Loading format button" />
            <Skeleton className="h-8 w-8 rounded" aria-label="Loading fullscreen button" />
          </div>
        </div>
      </div>

      {/* Editor content area */}
      <div className="relative">
        {/* Line numbers */}
        <div className="absolute left-0 top-0 w-12 bg-gray-50 dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 py-4">
          <div className="space-y-2">
            {Array.from({ length: 15 }).map((_, index) => (
              <div key={index} className="text-center">
                <Skeleton className="h-4 w-6 mx-auto" aria-label={`Loading line number ${index + 1}`} />
              </div>
            ))}
          </div>
        </div>

        {/* Code content */}
        <div className="pl-16 pr-4 py-4 min-h-[400px] font-mono text-sm bg-white dark:bg-gray-900">
          <div className="space-y-2">
            {/* Simulate code lines with varying lengths */}
            <div className="flex items-center space-x-2">
              <Skeleton className="h-4 w-16" aria-label="Loading code keyword" />
              <Skeleton className="h-4 w-24" aria-label="Loading function name" />
              <Skeleton className="h-4 w-8" aria-label="Loading parenthesis" />
            </div>
            <div className="pl-4">
              <Skeleton className="h-4 w-20" aria-label="Loading indented code" />
            </div>
            <div className="pl-4 space-y-1">
              <Skeleton className="h-4 w-32" aria-label="Loading variable declaration" />
              <Skeleton className="h-4 w-28" aria-label="Loading assignment" />
              <Skeleton className="h-4 w-36" aria-label="Loading method call" />
            </div>
            <div className="space-y-1">
              <Skeleton className="h-4 w-0" aria-label="Loading empty line" />
              <Skeleton className="h-4 w-12" aria-label="Loading comment" />
              <Skeleton className="h-4 w-40" aria-label="Loading comment text" />
            </div>
            <div className="pl-4 space-y-1">
              <Skeleton className="h-4 w-16" aria-label="Loading if statement" />
              <div className="pl-4 space-y-1">
                <Skeleton className="h-4 w-44" aria-label="Loading conditional logic" />
                <Skeleton className="h-4 w-20" aria-label="Loading return statement" />
              </div>
              <Skeleton className="h-4 w-8" aria-label="Loading closing brace" />
            </div>
            <div className="space-y-1">
              <Skeleton className="h-4 w-0" aria-label="Loading empty line" />
              <Skeleton className="h-4 w-24" aria-label="Loading try block" />
              <div className="pl-4 space-y-1">
                <Skeleton className="h-4 w-38" aria-label="Loading try content" />
                <Skeleton className="h-4 w-32" aria-label="Loading API call" />
              </div>
              <Skeleton className="h-4 w-20" aria-label="Loading catch block" />
              <div className="pl-4">
                <Skeleton className="h-4 w-36" aria-label="Loading error handling" />
              </div>
              <Skeleton className="h-4 w-8" aria-label="Loading closing brace" />
            </div>
          </div>
        </div>

        {/* Loading overlay */}
        <div className="absolute inset-0 bg-white/50 dark:bg-gray-900/50 flex items-center justify-center">
          <div className="flex items-center space-x-3 bg-white dark:bg-gray-800 px-4 py-2 rounded-lg border border-gray-200 dark:border-gray-700 shadow-lg">
            <LoadingSpinner size="sm" />
            <span className="text-sm text-gray-600 dark:text-gray-400">Loading script editor...</span>
          </div>
        </div>
      </div>

      {/* Editor footer */}
      <div className="bg-gray-50 dark:bg-gray-800 px-4 py-2 border-t border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
          <div className="flex items-center space-x-4">
            <Skeleton className="h-3 w-16" aria-label="Loading cursor position" />
            <Skeleton className="h-3 w-20" aria-label="Loading file encoding" />
          </div>
          <div className="flex items-center space-x-4">
            <Skeleton className="h-3 w-12" aria-label="Loading syntax mode" />
            <Skeleton className="h-3 w-16" aria-label="Loading line ending" />
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Main loading component for the event scripts section
 * Provides different loading states based on the current route/view
 */
export default function EventScriptsLoading() {
  return (
    <div 
      className="min-h-screen bg-gray-50 dark:bg-gray-950"
      role="main"
      aria-label="Loading event scripts interface"
    >
      {/* Page header loading */}
      <div className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="space-y-2">
              <Skeleton className="h-8 w-48" aria-label="Loading page title" />
              <Skeleton className="h-4 w-96" aria-label="Loading page description" />
            </div>
            <div className="flex items-center space-x-3">
              <LoadingSpinner size="md" />
              <span className="text-sm text-gray-600 dark:text-gray-400">Loading scripts...</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main content area */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-8">
          {/* Breadcrumb loading */}
          <nav aria-label="Loading breadcrumb navigation">
            <div className="flex items-center space-x-2">
              <Skeleton className="h-4 w-16" aria-label="Loading home breadcrumb" />
              <span className="text-gray-400 dark:text-gray-600">/</span>
              <Skeleton className="h-4 w-24" aria-label="Loading scripts breadcrumb" />
            </div>
          </nav>

          {/* Primary loading content */}
          <div className="grid grid-cols-1 gap-8">
            {/* Script management table */}
            <ScriptTableLoading />

            {/* Script form (when in create/edit mode) */}
            <div className="lg:hidden">
              <ScriptFormLoading />
            </div>

            {/* Side-by-side layout for larger screens */}
            <div className="hidden lg:grid lg:grid-cols-2 lg:gap-8">
              <ScriptFormLoading />
              <ScriptEditorLoading />
            </div>
          </div>

          {/* Additional loading elements for mobile */}
          <div className="lg:hidden space-y-6">
            <ScriptEditorLoading />
          </div>
        </div>
      </div>

      {/* Screen reader announcement */}
      <div 
        role="status" 
        aria-live="polite" 
        aria-atomic="true"
        className="sr-only"
      >
        Loading event scripts interface. Please wait while we prepare your content.
      </div>
    </div>
  );
}