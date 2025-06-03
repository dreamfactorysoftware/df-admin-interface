/**
 * Loading UI component for the event script creation page
 * 
 * Displays skeleton placeholders during form initialization and data fetching operations for:
 * - Script creation form with metadata fields (name, type, storage service, path)
 * - Event endpoint configuration (service, event, method, table selection)
 * - Code editor with syntax highlighting initialization
 * - Storage service configuration and linking components
 * 
 * Implements Next.js app router loading patterns with:
 * - WCAG 2.1 AA compliant accessibility features with proper ARIA live regions
 * - Responsive design adapting to mobile and desktop viewports
 * - Theme-aware styling with dark/light mode support
 * - Tailwind CSS animations and consistent design system integration
 * - Accessible loading indicators with screen reader compatibility
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
      aria-label="Loading script creation form..."
      aria-live="polite"
    >
      <span className="sr-only">Loading script creation form...</span>
    </div>
  );
}

/**
 * Script creation form loading skeleton
 * Mimics the script creation form structure with all required fields
 */
function ScriptCreationFormLoading() {
  return (
    <div 
      className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700 p-6"
      role="region"
      aria-label="Loading script creation form"
    >
      {/* Form header */}
      <div className="mb-6">
        <Skeleton className="h-8 w-56 mb-2" aria-label="Loading create script title" />
        <Skeleton className="h-4 w-full max-w-md" aria-label="Loading form description" />
      </div>

      {/* Script metadata section */}
      <div className="space-y-6">
        {/* Basic script information */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="space-y-4">
            {/* Script name field */}
            <div>
              <Skeleton className="h-4 w-20 mb-2" aria-label="Loading script name label" />
              <Skeleton className="h-11 w-full" aria-label="Loading script name input field" />
              <Skeleton className="h-3 w-48 mt-1" aria-label="Loading script name help text" />
            </div>
            
            {/* Script type field */}
            <div>
              <Skeleton className="h-4 w-20 mb-2" aria-label="Loading script type label" />
              <Skeleton className="h-11 w-full" aria-label="Loading script type dropdown" />
              <Skeleton className="h-3 w-56 mt-1" aria-label="Loading script type help text" />
            </div>
          </div>
          
          <div className="space-y-4">
            {/* Active toggle */}
            <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <div className="space-y-1">
                <Skeleton className="h-4 w-16" aria-label="Loading active toggle label" />
                <Skeleton className="h-3 w-32" aria-label="Loading active toggle description" />
              </div>
              <Skeleton className="h-6 w-12 rounded-full" aria-label="Loading active toggle switch" />
            </div>
            
            {/* Event modification toggle */}
            <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <div className="space-y-1">
                <Skeleton className="h-4 w-32" aria-label="Loading event modification toggle label" />
                <Skeleton className="h-3 w-40" aria-label="Loading event modification toggle description" />
              </div>
              <Skeleton className="h-6 w-12 rounded-full" aria-label="Loading event modification toggle switch" />
            </div>
          </div>
        </div>

        {/* Event endpoint configuration section */}
        <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
          <div className="mb-4">
            <Skeleton className="h-6 w-40 mb-2" aria-label="Loading event configuration section title" />
            <Skeleton className="h-4 w-full max-w-lg" aria-label="Loading event configuration description" />
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Service dropdown */}
            <div>
              <Skeleton className="h-4 w-16 mb-2" aria-label="Loading service label" />
              <Skeleton className="h-11 w-full" aria-label="Loading service dropdown" />
            </div>
            
            {/* Event dropdown */}
            <div>
              <Skeleton className="h-4 w-12 mb-2" aria-label="Loading event label" />
              <Skeleton className="h-11 w-full" aria-label="Loading event dropdown" />
            </div>
            
            {/* HTTP method dropdown */}
            <div>
              <Skeleton className="h-4 w-16 mb-2" aria-label="Loading method label" />
              <Skeleton className="h-11 w-full" aria-label="Loading HTTP method dropdown" />
            </div>
            
            {/* Table dropdown */}
            <div>
              <Skeleton className="h-4 w-12 mb-2" aria-label="Loading table label" />
              <Skeleton className="h-11 w-full" aria-label="Loading table dropdown" />
            </div>
          </div>
          
          {/* Event endpoint preview */}
          <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-950/30 rounded-lg border border-blue-200 dark:border-blue-800">
            <Skeleton className="h-4 w-24 mb-2" aria-label="Loading endpoint preview label" />
            <Skeleton className="h-6 w-full max-w-lg" aria-label="Loading endpoint preview URL" />
          </div>
        </div>

        {/* Storage service configuration section */}
        <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
          <div className="mb-4">
            <Skeleton className="h-6 w-48 mb-2" aria-label="Loading storage configuration section title" />
            <Skeleton className="h-4 w-full max-w-md" aria-label="Loading storage configuration description" />
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div>
              <Skeleton className="h-4 w-28 mb-2" aria-label="Loading storage service label" />
              <Skeleton className="h-11 w-full" aria-label="Loading storage service dropdown" />
              <Skeleton className="h-3 w-full max-w-xs mt-1" aria-label="Loading storage service help text" />
            </div>
            
            <div>
              <Skeleton className="h-4 w-20 mb-2" aria-label="Loading storage path label" />
              <div className="flex">
                <Skeleton className="h-11 flex-1" aria-label="Loading storage path input" />
                <Skeleton className="h-11 w-16 ml-2" aria-label="Loading browse button" />
              </div>
              <Skeleton className="h-3 w-full max-w-sm mt-1" aria-label="Loading storage path help text" />
            </div>
          </div>
          
          {/* Storage service link component placeholder */}
          <div className="mt-4 p-4 bg-yellow-50 dark:bg-yellow-950/30 rounded-lg border border-yellow-200 dark:border-yellow-800">
            <div className="flex items-center space-x-3">
              <Skeleton className="h-6 w-6" aria-label="Loading link service icon" />
              <div className="flex-1">
                <Skeleton className="h-4 w-40 mb-1" aria-label="Loading link service title" />
                <Skeleton className="h-3 w-64" aria-label="Loading link service description" />
              </div>
              <Skeleton className="h-9 w-20" aria-label="Loading configure link button" />
            </div>
          </div>
        </div>

        {/* Script content section placeholder */}
        <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
          <div className="mb-4">
            <Skeleton className="h-6 w-32 mb-2" aria-label="Loading script content section title" />
            <Skeleton className="h-4 w-full max-w-lg" aria-label="Loading script content description" />
          </div>
          
          {/* Editor toolbar placeholder */}
          <div className="bg-gray-50 dark:bg-gray-800 rounded-t-lg border border-gray-200 dark:border-gray-700 border-b-0 p-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <Skeleton className="h-5 w-24" aria-label="Loading editor language label" />
                <Skeleton className="h-6 w-16 rounded-full" aria-label="Loading language badge" />
              </div>
              <div className="flex items-center space-x-2">
                <Skeleton className="h-8 w-8 rounded" aria-label="Loading format code button" />
                <Skeleton className="h-8 w-8 rounded" aria-label="Loading fullscreen button" />
                <Skeleton className="h-8 w-8 rounded" aria-label="Loading settings button" />
              </div>
            </div>
          </div>
          
          {/* Code editor placeholder */}
          <div className="relative border border-gray-200 dark:border-gray-700 rounded-b-lg overflow-hidden">
            <div className="flex">
              {/* Line numbers */}
              <div className="w-12 bg-gray-50 dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 py-4">
                <div className="space-y-2">
                  {Array.from({ length: 12 }).map((_, index) => (
                    <div key={index} className="text-center">
                      <Skeleton className="h-4 w-6 mx-auto" aria-label={`Loading line number ${index + 1}`} />
                    </div>
                  ))}
                </div>
              </div>
              
              {/* Code content area */}
              <div className="flex-1 p-4 min-h-[300px] bg-white dark:bg-gray-900">
                <div className="space-y-2 font-mono text-sm">
                  {/* Template script content skeleton */}
                  <div className="space-y-1">
                    <Skeleton className="h-4 w-32" aria-label="Loading script header comment" />
                    <Skeleton className="h-4 w-56" aria-label="Loading script description comment" />
                    <Skeleton className="h-4 w-0" aria-label="Loading empty line" />
                  </div>
                  
                  <div className="space-y-1">
                    <Skeleton className="h-4 w-20" aria-label="Loading function keyword" />
                    <div className="pl-4 space-y-1">
                      <Skeleton className="h-4 w-28" aria-label="Loading variable declaration" />
                      <Skeleton className="h-4 w-36" aria-label="Loading request processing" />
                      <Skeleton className="h-4 w-32" aria-label="Loading response handling" />
                    </div>
                    <Skeleton className="h-4 w-8" aria-label="Loading closing brace" />
                  </div>
                  
                  <div className="space-y-1">
                    <Skeleton className="h-4 w-0" aria-label="Loading empty line" />
                    <Skeleton className="h-4 w-24" aria-label="Loading comment line" />
                    <Skeleton className="h-4 w-40" aria-label="Loading example usage" />
                  </div>
                </div>
                
                {/* Editor loading overlay */}
                <div className="absolute inset-0 bg-white/50 dark:bg-gray-900/50 flex items-center justify-center">
                  <div className="flex items-center space-x-3 bg-white dark:bg-gray-800 px-4 py-2 rounded-lg border border-gray-200 dark:border-gray-700 shadow-lg">
                    <LoadingSpinner size="sm" />
                    <span className="text-sm text-gray-600 dark:text-gray-400">Initializing code editor...</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Form actions */}
      <div className="flex flex-col sm:flex-row items-center justify-between space-y-4 sm:space-y-0 sm:space-x-4 mt-8 pt-6 border-t border-gray-200 dark:border-gray-700">
        {/* Validation status placeholder */}
        <div className="flex items-center space-x-2">
          <Skeleton className="h-4 w-4 rounded-full" aria-label="Loading validation status icon" />
          <Skeleton className="h-4 w-32" aria-label="Loading validation status text" />
        </div>
        
        {/* Action buttons */}
        <div className="flex items-center space-x-3">
          <Skeleton className="h-11 w-20" aria-label="Loading cancel button" />
          <Skeleton className="h-11 w-28" aria-label="Loading save draft button" />
          <Skeleton className="h-11 w-32" aria-label="Loading create script button" />
        </div>
      </div>
    </div>
  );
}

/**
 * Page breadcrumb loading skeleton
 * Shows navigation hierarchy for the script creation page
 */
function BreadcrumbLoading() {
  return (
    <nav 
      aria-label="Loading breadcrumb navigation"
      className="mb-6"
    >
      <div className="flex items-center space-x-2 text-sm">
        <Skeleton className="h-4 w-12" aria-label="Loading home breadcrumb" />
        <span className="text-gray-400 dark:text-gray-600">/</span>
        <Skeleton className="h-4 w-20" aria-label="Loading scripts breadcrumb" />
        <span className="text-gray-400 dark:text-gray-600">/</span>
        <Skeleton className="h-4 w-16" aria-label="Loading create breadcrumb" />
      </div>
    </nav>
  );
}

/**
 * Page header loading skeleton
 * Shows the main page title and action area
 */
function PageHeaderLoading() {
  return (
    <div className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
          <div className="space-y-2">
            <Skeleton className="h-8 w-64" aria-label="Loading page title" />
            <Skeleton className="h-4 w-full max-w-2xl" aria-label="Loading page description" />
          </div>
          
          <div className="flex items-center space-x-3">
            <LoadingSpinner size="md" />
            <span className="text-sm text-gray-600 dark:text-gray-400">Setting up form...</span>
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Help sidebar loading skeleton
 * Shows documentation and help content loading state
 */
function HelpSidebarLoading() {
  return (
    <div 
      className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700 p-6"
      role="region"
      aria-label="Loading help documentation"
    >
      <div className="space-y-6">
        {/* Getting started section */}
        <div>
          <Skeleton className="h-6 w-32 mb-3" aria-label="Loading help section title" />
          <div className="space-y-2">
            <Skeleton className="h-4 w-full" aria-label="Loading help text line 1" />
            <Skeleton className="h-4 w-5/6" aria-label="Loading help text line 2" />
            <Skeleton className="h-4 w-4/5" aria-label="Loading help text line 3" />
          </div>
        </div>
        
        {/* Quick tips section */}
        <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
          <Skeleton className="h-5 w-24 mb-3" aria-label="Loading tips section title" />
          <div className="space-y-3">
            {Array.from({ length: 4 }).map((_, index) => (
              <div key={index} className="flex items-start space-x-3">
                <Skeleton className="h-4 w-4 mt-0.5 rounded-full" aria-label={`Loading tip ${index + 1} icon`} />
                <Skeleton className="h-4 flex-1" aria-label={`Loading tip ${index + 1} text`} />
              </div>
            ))}
          </div>
        </div>
        
        {/* Documentation links */}
        <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
          <Skeleton className="h-5 w-28 mb-3" aria-label="Loading documentation section title" />
          <div className="space-y-2">
            <Skeleton className="h-9 w-full" aria-label="Loading documentation link 1" />
            <Skeleton className="h-9 w-full" aria-label="Loading documentation link 2" />
            <Skeleton className="h-9 w-full" aria-label="Loading documentation link 3" />
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Main loading component for the event script creation page
 * Provides comprehensive loading states for all form components and workflow elements
 */
export default function CreateEventScriptLoading() {
  return (
    <div 
      className="min-h-screen bg-gray-50 dark:bg-gray-950"
      role="main"
      aria-label="Loading script creation interface"
    >
      {/* Page header */}
      <PageHeaderLoading />

      {/* Main content area */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-8">
          {/* Breadcrumb navigation */}
          <BreadcrumbLoading />

          {/* Main content layout */}
          <div className="grid grid-cols-1 xl:grid-cols-4 gap-8">
            {/* Main form content - takes up 3 columns on xl screens */}
            <div className="xl:col-span-3">
              <ScriptCreationFormLoading />
            </div>

            {/* Help sidebar - takes up 1 column on xl screens */}
            <div className="xl:col-span-1">
              <div className="sticky top-8">
                <HelpSidebarLoading />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Screen reader announcements */}
      <div 
        role="status" 
        aria-live="polite" 
        aria-atomic="true"
        className="sr-only"
      >
        Loading script creation form. Please wait while we initialize the form fields and code editor.
      </div>
      
      {/* Secondary announcement for form readiness */}
      <div 
        role="status" 
        aria-live="assertive" 
        aria-atomic="true"
        className="sr-only"
      >
        Form components are being prepared. Script creation interface will be ready shortly.
      </div>
    </div>
  );
}