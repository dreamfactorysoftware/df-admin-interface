/**
 * Loading UI component for the event script edit route
 * 
 * Displays skeleton placeholders during script data fetching and form initialization for:
 * - Script edit form with pre-populated metadata fields
 * - Script content editor with syntax highlighting
 * - Storage service configuration panel
 * - Form validation and submission actions
 * 
 * Implements Next.js app router loading states with:
 * - WCAG 2.1 AA compliant accessibility features
 * - Responsive design for mobile and desktop viewports
 * - Theme-aware styling with dark/light mode support
 * - Tailwind CSS animations and consistent design system
 * - Proper ARIA live regions for screen reader announcements
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
 * Script metadata form loading skeleton
 * Mimics the script edit form structure with read-only name field
 */
function ScriptFormLoading() {
  return (
    <div 
      className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700 p-6"
      role="region"
      aria-label="Loading script edit form"
    >
      {/* Form header */}
      <div className="mb-6">
        <div className="flex items-center space-x-3 mb-3">
          <Skeleton className="h-8 w-48" aria-label="Loading form title" />
          <Skeleton className="h-6 w-20 rounded-full" aria-label="Loading script status badge" />
        </div>
        <Skeleton className="h-4 w-80" aria-label="Loading form description" />
      </div>

      {/* Script identification section */}
      <div className="space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Script name (read-only in edit mode) */}
          <div className="lg:col-span-2">
            <div className="flex items-center space-x-2 mb-2">
              <Skeleton className="h-4 w-24" aria-label="Loading script name label" />
              <Skeleton className="h-4 w-16 rounded-full bg-blue-100 dark:bg-blue-900" aria-label="Loading read-only indicator" />
            </div>
            <Skeleton className="h-11 w-full opacity-60" aria-label="Loading script name input (read-only)" />
            <Skeleton className="h-3 w-64 mt-1" aria-label="Loading script name help text" />
          </div>
        </div>

        {/* Service and event configuration */}
        <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
          <Skeleton className="h-6 w-36 mb-4" aria-label="Loading service configuration section title" />
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div>
                <Skeleton className="h-4 w-20 mb-2" aria-label="Loading service label" />
                <Skeleton className="h-11 w-full" aria-label="Loading service dropdown" />
                <Skeleton className="h-3 w-48 mt-1" aria-label="Loading service help text" />
              </div>
              <div>
                <Skeleton className="h-4 w-16 mb-2" aria-label="Loading event label" />
                <Skeleton className="h-11 w-full" aria-label="Loading event dropdown" />
              </div>
            </div>
            
            <div className="space-y-4">
              <div>
                <Skeleton className="h-4 w-28 mb-2" aria-label="Loading HTTP method label" />
                <Skeleton className="h-11 w-full" aria-label="Loading HTTP method dropdown" />
              </div>
              <div>
                <Skeleton className="h-4 w-20 mb-2" aria-label="Loading table label" />
                <Skeleton className="h-11 w-full" aria-label="Loading table dropdown" />
              </div>
            </div>
          </div>
        </div>

        {/* Script configuration */}
        <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
          <Skeleton className="h-6 w-32 mb-4" aria-label="Loading script configuration section title" />
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div>
                <Skeleton className="h-4 w-24 mb-2" aria-label="Loading script type label" />
                <Skeleton className="h-11 w-full" aria-label="Loading script type dropdown" />
              </div>
              <div>
                <Skeleton className="h-4 w-20 mb-2" aria-label="Loading language label" />
                <Skeleton className="h-11 w-full" aria-label="Loading language dropdown" />
              </div>
            </div>
            
            <div className="space-y-6">
              {/* Toggle switches for script options */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Skeleton className="h-4 w-16 mb-1" aria-label="Loading active toggle label" />
                    <Skeleton className="h-3 w-32" aria-label="Loading active toggle description" />
                  </div>
                  <Skeleton className="h-6 w-12 rounded-full" aria-label="Loading active toggle switch" />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <Skeleton className="h-4 w-28 mb-1" aria-label="Loading event modification toggle label" />
                    <Skeleton className="h-3 w-40" aria-label="Loading event modification toggle description" />
                  </div>
                  <Skeleton className="h-6 w-12 rounded-full" aria-label="Loading event modification toggle switch" />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <Skeleton className="h-4 w-24 mb-1" aria-label="Loading script debugging toggle label" />
                    <Skeleton className="h-3 w-36" aria-label="Loading script debugging toggle description" />
                  </div>
                  <Skeleton className="h-6 w-12 rounded-full" aria-label="Loading script debugging toggle switch" />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Storage service configuration */}
        <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
          <div className="flex items-center space-x-2 mb-4">
            <Skeleton className="h-6 w-40" aria-label="Loading storage service section title" />
            <Skeleton className="h-4 w-16 rounded-full" aria-label="Loading optional badge" />
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div>
                <Skeleton className="h-4 w-28 mb-2" aria-label="Loading storage service label" />
                <Skeleton className="h-11 w-full" aria-label="Loading storage service dropdown" />
                <Skeleton className="h-3 w-56 mt-1" aria-label="Loading storage service help text" />
              </div>
              <div>
                <Skeleton className="h-4 w-20 mb-2" aria-label="Loading file path label" />
                <Skeleton className="h-11 w-full" aria-label="Loading file path input" />
              </div>
            </div>
            
            <div className="space-y-4">
              <div>
                <Skeleton className="h-4 w-24 mb-2" aria-label="Loading container label" />
                <Skeleton className="h-11 w-full" aria-label="Loading container input" />
              </div>
              <div className="flex items-center space-x-3">
                <Skeleton className="h-9 w-20" aria-label="Loading browse files button" />
                <Skeleton className="h-9 w-24" aria-label="Loading test connection button" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Form actions */}
      <div className="flex items-center justify-between mt-8 pt-6 border-t border-gray-200 dark:border-gray-700">
        <div className="flex items-center space-x-4">
          <Skeleton className="h-9 w-20" aria-label="Loading cancel button" />
          <Skeleton className="h-9 w-16" aria-label="Loading reset button" />
        </div>
        <div className="flex items-center space-x-4">
          <Skeleton className="h-9 w-24" aria-label="Loading test script button" />
          <Skeleton className="h-9 w-32" aria-label="Loading save changes button" />
        </div>
      </div>
    </div>
  );
}

/**
 * Script content editor loading skeleton
 * Mimics the code editor interface with syntax highlighting and features
 */
function ScriptEditorLoading() {
  return (
    <div 
      className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden"
      role="region"
      aria-label="Loading script content editor"
    >
      {/* Editor header with toolbar */}
      <div className="bg-gray-50 dark:bg-gray-800 px-4 py-3 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Skeleton className="h-5 w-32" aria-label="Loading editor title" />
            <Skeleton className="h-6 w-20 rounded-full" aria-label="Loading language badge" />
            <Skeleton className="h-4 w-24" aria-label="Loading file size indicator" />
          </div>
          <div className="flex items-center space-x-2">
            <Skeleton className="h-8 w-8 rounded" aria-label="Loading format button" />
            <Skeleton className="h-8 w-8 rounded" aria-label="Loading find button" />
            <Skeleton className="h-8 w-8 rounded" aria-label="Loading replace button" />
            <Skeleton className="h-8 w-8 rounded" aria-label="Loading fullscreen button" />
          </div>
        </div>
      </div>

      {/* Editor content area */}
      <div className="relative">
        {/* Line numbers gutter */}
        <div className="absolute left-0 top-0 w-14 bg-gray-50 dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 py-4">
          <div className="space-y-[1.2rem] text-right pr-3">
            {Array.from({ length: 20 }).map((_, index) => (
              <div key={index}>
                <Skeleton className="h-4 w-6 ml-auto" aria-label={`Loading line number ${index + 1}`} />
              </div>
            ))}
          </div>
        </div>

        {/* Code content area */}
        <div className="pl-16 pr-4 py-4 min-h-[500px] font-mono text-sm bg-white dark:bg-gray-900">
          <div className="space-y-[1.2rem]">
            {/* Simulate realistic script code structure */}
            <div className="flex items-center space-x-2">
              <Skeleton className="h-4 w-20 bg-purple-200 dark:bg-purple-800" aria-label="Loading import keyword" />
              <Skeleton className="h-4 w-32 bg-green-200 dark:bg-green-800" aria-label="Loading import path" />
            </div>
            <div className="flex items-center space-x-2">
              <Skeleton className="h-4 w-16 bg-purple-200 dark:bg-purple-800" aria-label="Loading from keyword" />
              <Skeleton className="h-4 w-28 bg-green-200 dark:bg-green-800" aria-label="Loading module name" />
            </div>
            <Skeleton className="h-4 w-0" aria-label="Loading empty line" />
            
            {/* Function definition */}
            <div className="flex items-center space-x-2">
              <Skeleton className="h-4 w-16 bg-blue-200 dark:bg-blue-800" aria-label="Loading function keyword" />
              <Skeleton className="h-4 w-24 bg-yellow-200 dark:bg-yellow-800" aria-label="Loading function name" />
              <Skeleton className="h-4 w-8" aria-label="Loading parenthesis" />
            </div>
            
            {/* Function body */}
            <div className="pl-4 space-y-[1.2rem]">
              <div className="flex items-center space-x-2">
                <Skeleton className="h-4 w-16 bg-orange-200 dark:bg-orange-800" aria-label="Loading variable keyword" />
                <Skeleton className="h-4 w-20" aria-label="Loading variable name" />
                <Skeleton className="h-4 w-32 bg-green-200 dark:bg-green-800" aria-label="Loading string value" />
              </div>
              <div className="flex items-center space-x-2">
                <Skeleton className="h-4 w-16 bg-orange-200 dark:bg-orange-800" aria-label="Loading variable keyword" />
                <Skeleton className="h-4 w-18" aria-label="Loading variable name" />
                <Skeleton className="h-4 w-24" aria-label="Loading assignment" />
              </div>
              <Skeleton className="h-4 w-0" aria-label="Loading empty line" />
              
              {/* Try-catch block */}
              <div className="flex items-center space-x-2">
                <Skeleton className="h-4 w-12 bg-blue-200 dark:bg-blue-800" aria-label="Loading try keyword" />
              </div>
              <div className="pl-4 space-y-[1.2rem]">
                <div className="flex items-center space-x-2">
                  <Skeleton className="h-4 w-20" aria-label="Loading api call" />
                  <Skeleton className="h-4 w-36 bg-green-200 dark:bg-green-800" aria-label="Loading method call" />
                </div>
                <div className="flex items-center space-x-2">
                  <Skeleton className="h-4 w-16 bg-blue-200 dark:bg-blue-800" aria-label="Loading if keyword" />
                  <Skeleton className="h-4 w-28" aria-label="Loading condition" />
                </div>
                <div className="pl-4">
                  <div className="flex items-center space-x-2">
                    <Skeleton className="h-4 w-20 bg-blue-200 dark:bg-blue-800" aria-label="Loading return keyword" />
                    <Skeleton className="h-4 w-24" aria-label="Loading return value" />
                  </div>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <Skeleton className="h-4 w-16 bg-blue-200 dark:bg-blue-800" aria-label="Loading catch keyword" />
                <Skeleton className="h-4 w-12" aria-label="Loading error parameter" />
              </div>
              <div className="pl-4 space-y-[1.2rem]">
                <div className="flex items-center space-x-2">
                  <Skeleton className="h-4 w-24" aria-label="Loading console log" />
                  <Skeleton className="h-4 w-32 bg-green-200 dark:bg-green-800" aria-label="Loading error message" />
                </div>
                <div className="flex items-center space-x-2">
                  <Skeleton className="h-4 w-16 bg-red-200 dark:bg-red-800" aria-label="Loading throw keyword" />
                  <Skeleton className="h-4 w-20" aria-label="Loading error object" />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Loading overlay */}
        <div className="absolute inset-0 bg-white/60 dark:bg-gray-900/60 flex items-center justify-center backdrop-blur-sm">
          <div className="flex items-center space-x-4 bg-white dark:bg-gray-800 px-6 py-3 rounded-lg border border-gray-200 dark:border-gray-700 shadow-lg">
            <LoadingSpinner size="sm" />
            <div className="text-sm">
              <div className="font-medium text-gray-900 dark:text-gray-100">Loading script content...</div>
              <div className="text-gray-500 dark:text-gray-400">Initializing code editor</div>
            </div>
          </div>
        </div>
      </div>

      {/* Editor status bar */}
      <div className="bg-gray-50 dark:bg-gray-800 px-4 py-2 border-t border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between text-xs">
          <div className="flex items-center space-x-4 text-gray-500 dark:text-gray-400">
            <Skeleton className="h-3 w-20" aria-label="Loading cursor position" />
            <Skeleton className="h-3 w-16" aria-label="Loading character count" />
            <Skeleton className="h-3 w-18" aria-label="Loading file encoding" />
          </div>
          <div className="flex items-center space-x-4 text-gray-500 dark:text-gray-400">
            <Skeleton className="h-3 w-16" aria-label="Loading syntax mode" />
            <Skeleton className="h-3 w-12" aria-label="Loading line ending" />
            <Skeleton className="h-3 w-14" aria-label="Loading tab size" />
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Main loading component for the event script edit route
 * Displays a comprehensive loading state for script editing interface
 */
export default function ScriptEditLoading() {
  return (
    <div 
      className="min-h-screen bg-gray-50 dark:bg-gray-950"
      role="main"
      aria-label="Loading script edit interface"
    >
      {/* Page header loading */}
      <div className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-start justify-between">
            <div className="space-y-2">
              <div className="flex items-center space-x-3">
                <Skeleton className="h-8 w-64" aria-label="Loading page title with script name" />
                <LoadingSpinner size="sm" />
              </div>
              <Skeleton className="h-4 w-80" aria-label="Loading page description" />
            </div>
            <div className="flex items-center space-x-3">
              <Skeleton className="h-9 w-24" aria-label="Loading script actions button" />
              <Skeleton className="h-9 w-16" aria-label="Loading settings button" />
            </div>
          </div>
        </div>
      </div>

      {/* Main content area */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-8">
          {/* Breadcrumb navigation loading */}
          <nav aria-label="Loading breadcrumb navigation">
            <div className="flex items-center space-x-2 text-sm">
              <Skeleton className="h-4 w-16" aria-label="Loading home breadcrumb" />
              <span className="text-gray-400 dark:text-gray-600">/</span>
              <Skeleton className="h-4 w-24" aria-label="Loading scripts breadcrumb" />
              <span className="text-gray-400 dark:text-gray-600">/</span>
              <Skeleton className="h-4 w-32" aria-label="Loading script name breadcrumb" />
            </div>
          </nav>

          {/* Mobile-first responsive layout */}
          <div className="space-y-8 lg:space-y-0 lg:grid lg:grid-cols-2 lg:gap-8">
            {/* Script form section */}
            <div className="order-1 lg:order-1">
              <ScriptFormLoading />
            </div>

            {/* Script editor section */}
            <div className="order-2 lg:order-2">
              <ScriptEditorLoading />
            </div>
          </div>

          {/* Additional loading indicators for mobile */}
          <div className="lg:hidden">
            <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
              <div className="flex items-center justify-center space-x-3">
                <LoadingSpinner size="sm" />
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  Preparing script editing environment...
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Screen reader announcements for accessibility */}
      <div 
        role="status" 
        aria-live="polite" 
        aria-atomic="true"
        className="sr-only"
      >
        Loading script editing interface. Please wait while we fetch the script data and initialize the editor.
      </div>

      {/* Loading progress indicator for assistive technology */}
      <div 
        role="progressbar"
        aria-label="Loading script editor"
        aria-valuenow={undefined}
        aria-valuemin={0}
        aria-valuemax={100}
        className="sr-only"
      >
        Loading in progress
      </div>
    </div>
  );
}