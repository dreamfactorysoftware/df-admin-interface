/**
 * Loading component for file management operations
 * Provides skeleton UI during file list loading, upload progress, and folder navigation
 * Implements Next.js app router loading conventions with accessibility compliance
 */

import { cn } from '@/lib/utils';

/**
 * Skeleton component for loading states
 * Provides animated placeholder content with theme support
 */
function Skeleton({ 
  className, 
  'data-testid': testId,
  'aria-label': ariaLabel 
}: { 
  className?: string;
  'data-testid'?: string;
  'aria-label'?: string;
}) {
  return (
    <div
      className={cn(
        "animate-pulse rounded-md bg-gray-200 dark:bg-gray-700",
        className
      )}
      data-testid={testId}
      aria-label={ariaLabel}
      role="status"
      aria-hidden="true"
    />
  );
}

/**
 * Spinner component for active loading operations
 * Provides animated loading indicator with accessibility support
 */
function Spinner({ 
  className,
  size = 'default',
  'data-testid': testId 
}: { 
  className?: string;
  size?: 'sm' | 'default' | 'lg';
  'data-testid'?: string;
}) {
  const sizeClasses = {
    sm: 'h-4 w-4',
    default: 'h-6 w-6',
    lg: 'h-8 w-8'
  };

  return (
    <div
      className={cn(
        "animate-spin rounded-full border-2 border-gray-300 border-t-primary-600 dark:border-gray-600 dark:border-t-primary-400",
        sizeClasses[size],
        className
      )}
      data-testid={testId}
      role="status"
      aria-label="Loading content"
    />
  );
}

/**
 * File table skeleton for loading file browser content
 */
function FileTableSkeleton() {
  return (
    <div 
      className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden"
      data-testid="file-table-skeleton"
      role="region"
      aria-label="Loading file browser table"
    >
      {/* Table Header */}
      <div className="px-6 py-4 bg-gray-50 dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700">
        <div className="grid grid-cols-12 gap-4">
          <div className="col-span-1">
            <Skeleton className="h-4 w-4" aria-label="Loading file type indicator" />
          </div>
          <div className="col-span-5 md:col-span-4">
            <Skeleton className="h-4 w-20" aria-label="Loading file name column header" />
          </div>
          <div className="col-span-3 hidden md:block">
            <Skeleton className="h-4 w-16" aria-label="Loading file size column header" />
          </div>
          <div className="col-span-3 hidden md:block">
            <Skeleton className="h-4 w-24" aria-label="Loading modified date column header" />
          </div>
          <div className="col-span-6 md:col-span-1">
            <Skeleton className="h-4 w-8" aria-label="Loading actions column header" />
          </div>
        </div>
      </div>

      {/* Table Rows */}
      <div className="divide-y divide-gray-200 dark:divide-gray-700">
        {Array.from({ length: 8 }).map((_, index) => (
          <div 
            key={index}
            className="px-6 py-4 hover:bg-gray-50 dark:hover:bg-gray-800/50"
            data-testid={`file-row-skeleton-${index}`}
          >
            <div className="grid grid-cols-12 gap-4 items-center">
              {/* File Icon */}
              <div className="col-span-1">
                <Skeleton 
                  className="h-5 w-5" 
                  aria-label={`Loading file ${index + 1} type icon`}
                />
              </div>
              
              {/* File Name */}
              <div className="col-span-5 md:col-span-4">
                <Skeleton 
                  className={cn(
                    "h-4",
                    // Vary the width for more realistic loading appearance
                    index % 4 === 0 ? "w-32" :
                    index % 4 === 1 ? "w-24" :
                    index % 4 === 2 ? "w-40" : "w-28"
                  )}
                  aria-label={`Loading file ${index + 1} name`}
                />
              </div>
              
              {/* File Size - Hidden on mobile */}
              <div className="col-span-3 hidden md:block">
                <Skeleton 
                  className="h-4 w-16" 
                  aria-label={`Loading file ${index + 1} size`}
                />
              </div>
              
              {/* Modified Date - Hidden on mobile */}
              <div className="col-span-3 hidden md:block">
                <Skeleton 
                  className="h-4 w-20" 
                  aria-label={`Loading file ${index + 1} modified date`}
                />
              </div>
              
              {/* Actions */}
              <div className="col-span-6 md:col-span-1 flex justify-end">
                <Skeleton 
                  className="h-6 w-6" 
                  aria-label={`Loading actions for file ${index + 1}`}
                />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/**
 * Upload area skeleton for file upload operations
 */
function UploadAreaSkeleton() {
  return (
    <div 
      className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-8 text-center bg-gray-50 dark:bg-gray-800/50"
      data-testid="upload-area-skeleton"
      role="region"
      aria-label="Loading file upload area"
    >
      <div className="flex flex-col items-center space-y-4">
        {/* Upload Icon */}
        <Skeleton 
          className="h-12 w-12 rounded-full" 
          aria-label="Loading upload icon"
        />
        
        {/* Upload Text */}
        <div className="space-y-2">
          <Skeleton 
            className="h-5 w-48 mx-auto" 
            aria-label="Loading upload instructions"
          />
          <Skeleton 
            className="h-4 w-64 mx-auto" 
            aria-label="Loading upload guidelines"
          />
        </div>
        
        {/* Upload Button */}
        <Skeleton 
          className="h-10 w-32" 
          aria-label="Loading upload button"
        />
      </div>
    </div>
  );
}

/**
 * Breadcrumb navigation skeleton
 */
function BreadcrumbSkeleton() {
  return (
    <nav 
      className="flex items-center space-x-2 mb-6"
      data-testid="breadcrumb-skeleton"
      role="navigation"
      aria-label="Loading folder navigation breadcrumbs"
    >
      <Skeleton className="h-4 w-12" aria-label="Loading home breadcrumb" />
      <span className="text-gray-400 dark:text-gray-500">/</span>
      <Skeleton className="h-4 w-16" aria-label="Loading folder breadcrumb" />
      <span className="text-gray-400 dark:text-gray-500">/</span>
      <Skeleton className="h-4 w-20" aria-label="Loading current folder breadcrumb" />
    </nav>
  );
}

/**
 * Toolbar skeleton for file management actions
 */
function ToolbarSkeleton() {
  return (
    <div 
      className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6"
      data-testid="toolbar-skeleton"
      role="region"
      aria-label="Loading file management toolbar"
    >
      {/* Left side actions */}
      <div className="flex items-center space-x-3">
        <Skeleton 
          className="h-9 w-24" 
          aria-label="Loading new folder button"
        />
        <Skeleton 
          className="h-9 w-20" 
          aria-label="Loading upload button"
        />
        <Skeleton 
          className="h-9 w-20" 
          aria-label="Loading refresh button"
        />
      </div>
      
      {/* Right side controls */}
      <div className="flex items-center space-x-3">
        {/* Search */}
        <Skeleton 
          className="h-9 w-48" 
          aria-label="Loading search input"
        />
        
        {/* View toggle */}
        <div className="flex items-center space-x-1">
          <Skeleton 
            className="h-9 w-9" 
            aria-label="Loading list view button"
          />
          <Skeleton 
            className="h-9 w-9" 
            aria-label="Loading grid view button"
          />
        </div>
      </div>
    </div>
  );
}

/**
 * File operation progress indicator
 */
function FileOperationProgress() {
  return (
    <div 
      className="fixed bottom-4 right-4 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg p-4 max-w-sm"
      data-testid="file-operation-progress"
      role="status"
      aria-live="polite"
      aria-label="File operation in progress"
    >
      <div className="flex items-center space-x-3">
        <Spinner size="sm" data-testid="operation-spinner" />
        <div className="flex-1 min-w-0">
          <div className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-1">
            Loading files...
          </div>
          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
            <div 
              className="bg-primary-600 h-2 rounded-full transition-all duration-300 ease-out animate-pulse"
              style={{ width: '45%' }}
              aria-label="Loading progress: approximately 45%"
            />
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Main loading component for file management page
 * Implements Next.js app router loading conventions with comprehensive accessibility
 */
export default function FilesLoading() {
  return (
    <div 
      className="space-y-6 p-6"
      data-testid="files-loading-container"
      role="main"
      aria-label="Loading file management interface"
    >
      {/* Screen reader announcement */}
      <div 
        className="sr-only" 
        aria-live="polite"
        data-testid="loading-announcement"
      >
        Loading file management interface. Please wait while we fetch your files and folders.
      </div>

      {/* Page Header */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="space-y-2">
            <Skeleton 
              className="h-8 w-48" 
              data-testid="page-title-skeleton"
              aria-label="Loading page title"
            />
            <Skeleton 
              className="h-5 w-80" 
              data-testid="page-description-skeleton"
              aria-label="Loading page description"
            />
          </div>
          
          {/* Quick actions */}
          <div className="flex items-center space-x-2">
            <Skeleton 
              className="h-10 w-24" 
              data-testid="primary-action-skeleton"
              aria-label="Loading primary action button"
            />
            <Skeleton 
              className="h-10 w-10" 
              data-testid="secondary-action-skeleton"
              aria-label="Loading secondary action button"
            />
          </div>
        </div>
      </div>

      {/* Breadcrumb Navigation */}
      <BreadcrumbSkeleton />

      {/* File Management Toolbar */}
      <ToolbarSkeleton />

      {/* Main Content Area */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* File Browser - Main content area */}
        <div className="lg:col-span-3 space-y-6">
          {/* Upload Area */}
          <UploadAreaSkeleton />
          
          {/* File Table */}
          <FileTableSkeleton />
        </div>

        {/* Sidebar - File details and actions */}
        <div className="lg:col-span-1 space-y-6">
          {/* File Details Panel */}
          <div 
            className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6"
            data-testid="file-details-skeleton"
            role="region"
            aria-label="Loading file details panel"
          >
            <div className="space-y-4">
              <Skeleton 
                className="h-5 w-24" 
                aria-label="Loading details panel title"
              />
              
              <div className="space-y-3">
                {Array.from({ length: 4 }).map((_, index) => (
                  <div key={index} className="flex justify-between items-center">
                    <Skeleton 
                      className="h-4 w-20" 
                      aria-label={`Loading detail ${index + 1} label`}
                    />
                    <Skeleton 
                      className="h-4 w-16" 
                      aria-label={`Loading detail ${index + 1} value`}
                    />
                  </div>
                ))}
              </div>
              
              <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
                <Skeleton 
                  className="h-9 w-full" 
                  aria-label="Loading action button"
                />
              </div>
            </div>
          </div>

          {/* Recent Files Panel */}
          <div 
            className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6"
            data-testid="recent-files-skeleton"
            role="region"
            aria-label="Loading recent files panel"
          >
            <div className="space-y-4">
              <Skeleton 
                className="h-5 w-28" 
                aria-label="Loading recent files title"
              />
              
              <div className="space-y-3">
                {Array.from({ length: 3 }).map((_, index) => (
                  <div key={index} className="flex items-center space-x-3">
                    <Skeleton 
                      className="h-8 w-8" 
                      aria-label={`Loading recent file ${index + 1} icon`}
                    />
                    <div className="flex-1 min-w-0">
                      <Skeleton 
                        className="h-4 w-24 mb-1" 
                        aria-label={`Loading recent file ${index + 1} name`}
                      />
                      <Skeleton 
                        className="h-3 w-16" 
                        aria-label={`Loading recent file ${index + 1} timestamp`}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* File Operation Progress (appears during operations) */}
      <FileOperationProgress />

      {/* Accessibility: Loading completion announcement */}
      <div 
        className="sr-only" 
        aria-live="polite" 
        aria-atomic="true"
        data-testid="loading-status"
      >
        File management interface is loading. Use keyboard navigation with Tab and arrow keys when content is ready.
      </div>
    </div>
  );
}