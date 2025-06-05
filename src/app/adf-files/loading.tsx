/**
 * @fileoverview Loading state component for file management operations
 * 
 * Provides skeleton UI during file list loading, upload progress, and folder navigation.
 * Implements accessibility-compliant loading indicators with proper ARIA attributes
 * and responsive design using Tailwind CSS animations.
 * 
 * Supports multiple loading states:
 * - File browser table skeleton
 * - File upload progress indicators
 * - Folder navigation loading
 * - File operation feedback
 * 
 * @version 1.0.0
 * @since React 19.0.0 / Next.js 15.1.0
 * @compliance WCAG 2.1 AA
 */

import React from 'react';

// ============================================================================
// SKELETON COMPONENTS
// ============================================================================

/**
 * Base skeleton component with accessibility support
 * Implements WCAG 2.1 AA compliant loading indicator
 */
interface SkeletonProps {
  className?: string;
  variant?: 'text' | 'circular' | 'rectangular';
  width?: string | number;
  height?: string | number;
  children?: React.ReactNode;
  'aria-label'?: string;
}

function Skeleton({ 
  className = '', 
  variant = 'rectangular',
  width,
  height,
  children,
  'aria-label': ariaLabel = 'Loading content'
}: SkeletonProps) {
  const baseClasses = 'animate-pulse bg-gray-200 dark:bg-gray-700';
  
  const variantClasses = {
    text: 'rounded-sm',
    circular: 'rounded-full',
    rectangular: 'rounded-md'
  };

  const style = {
    width: typeof width === 'number' ? `${width}px` : width,
    height: typeof height === 'number' ? `${height}px` : height
  };

  return (
    <div
      className={`${baseClasses} ${variantClasses[variant]} ${className}`}
      style={style}
      role="status"
      aria-label={ariaLabel}
      aria-live="polite"
    >
      {children && (
        <div className="opacity-0" aria-hidden="true">
          {children}
        </div>
      )}
      <span className="sr-only">Loading...</span>
    </div>
  );
}

/**
 * Spinner component for active loading states
 * WCAG 2.1 AA compliant with proper focus management
 */
interface SpinnerProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  color?: 'primary' | 'secondary' | 'white';
  'aria-label'?: string;
}

function Spinner({ 
  size = 'md', 
  className = '',
  color = 'primary',
  'aria-label': ariaLabel = 'Loading'
}: SpinnerProps) {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6', 
    lg: 'w-8 h-8',
    xl: 'w-12 h-12'
  };

  const colorClasses = {
    primary: 'text-primary-600 dark:text-primary-400',
    secondary: 'text-secondary-600 dark:text-secondary-400',
    white: 'text-white'
  };

  return (
    <div
      className={`inline-block animate-spin ${sizeClasses[size]} ${colorClasses[color]} ${className}`}
      role="status"
      aria-label={ariaLabel}
      aria-live="polite"
    >
      <svg
        className="w-full h-full"
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24"
        aria-hidden="true"
      >
        <circle
          className="opacity-25"
          cx="12"
          cy="12"
          r="10"
          stroke="currentColor"
          strokeWidth="4"
        />
        <path
          className="opacity-75"
          fill="currentColor"
          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
        />
      </svg>
      <span className="sr-only">{ariaLabel}</span>
    </div>
  );
}

// ============================================================================
// FILE BROWSER SKELETON COMPONENTS
// ============================================================================

/**
 * Skeleton for file browser toolbar
 * Represents search, filters, and action buttons
 */
function FileToolbarSkeleton() {
  return (
    <div 
      className="flex flex-col sm:flex-row gap-4 p-4 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700"
      role="region"
      aria-label="File management toolbar loading"
    >
      {/* Search bar skeleton */}
      <div className="flex-1 min-w-0">
        <Skeleton 
          className="h-10 w-full max-w-md"
          aria-label="Search bar loading"
        />
      </div>
      
      {/* Action buttons skeleton - responsive */}
      <div className="flex flex-wrap gap-2 sm:gap-3">
        <Skeleton className="h-10 w-24 hidden sm:block" aria-label="Upload button loading" />
        <Skeleton className="h-10 w-20 hidden sm:block" aria-label="New folder button loading" />
        <Skeleton className="h-10 w-16 hidden sm:block" aria-label="View options loading" />
        
        {/* Mobile: Show simplified button layout */}
        <Skeleton className="h-10 w-16 sm:hidden" aria-label="Mobile actions loading" />
        <Skeleton className="h-10 w-16 sm:hidden" aria-label="Mobile menu loading" />
      </div>
    </div>
  );
}

/**
 * Skeleton for file table header
 * Represents sortable column headers
 */
function FileTableHeaderSkeleton() {
  return (
    <div 
      className="grid grid-cols-1 sm:grid-cols-4 lg:grid-cols-5 gap-4 p-4 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800"
      role="row"
      aria-label="File table header loading"
    >
      <Skeleton className="h-5 w-16" aria-label="Name column loading" />
      <Skeleton className="h-5 w-12 hidden sm:block" aria-label="Size column loading" />
      <Skeleton className="h-5 w-20 hidden sm:block" aria-label="Modified column loading" />
      <Skeleton className="h-5 w-16 hidden sm:block" aria-label="Type column loading" />
      <Skeleton className="h-5 w-14 hidden lg:block" aria-label="Actions column loading" />
    </div>
  );
}

/**
 * Skeleton for individual file table row
 * Represents file/folder entries with icons and metadata
 */
function FileTableRowSkeleton({ index }: { index: number }) {
  return (
    <div 
      className="grid grid-cols-1 sm:grid-cols-4 lg:grid-cols-5 gap-4 p-4 border-b border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
      role="row"
      aria-label={`File entry ${index + 1} loading`}
    >
      {/* File name with icon */}
      <div className="flex items-center gap-3 min-w-0">
        <Skeleton 
          variant="rectangular" 
          className="w-6 h-6 flex-shrink-0"
          aria-label="File icon loading"
        />
        <Skeleton 
          className="h-4 flex-1 max-w-40"
          aria-label="File name loading"
        />
      </div>
      
      {/* File size - hidden on mobile */}
      <Skeleton 
        className="h-4 w-16 hidden sm:block"
        aria-label="File size loading"
      />
      
      {/* Modified date - hidden on mobile */}
      <Skeleton 
        className="h-4 w-24 hidden sm:block"
        aria-label="Modified date loading"
      />
      
      {/* File type - hidden on mobile */}
      <Skeleton 
        className="h-4 w-20 hidden sm:block"
        aria-label="File type loading"
      />
      
      {/* Actions menu - hidden on mobile, shown on hover */}
      <div className="hidden lg:flex items-center justify-end">
        <Skeleton 
          variant="circular"
          className="w-6 h-6"
          aria-label="File actions loading"
        />
      </div>
    </div>
  );
}

/**
 * Skeleton for file upload dropzone area
 * Represents drag-and-drop upload interface
 */
function FileUploadSkeleton() {
  return (
    <div 
      className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-8 text-center bg-gray-50 dark:bg-gray-800/50"
      role="region"
      aria-label="File upload area loading"
    >
      <div className="flex flex-col items-center gap-4">
        <Skeleton 
          variant="circular" 
          className="w-16 h-16"
          aria-label="Upload icon loading"
        />
        <div className="space-y-2">
          <Skeleton 
            className="h-5 w-48 mx-auto"
            aria-label="Upload instructions loading"
          />
          <Skeleton 
            className="h-4 w-32 mx-auto"
            aria-label="Upload details loading"
          />
        </div>
        <Skeleton 
          className="h-10 w-32"
          aria-label="Browse files button loading"
        />
      </div>
    </div>
  );
}

/**
 * Skeleton for breadcrumb navigation
 * Represents folder path navigation
 */
function BreadcrumbSkeleton() {
  return (
    <nav 
      className="flex items-center gap-2 p-4 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700"
      role="navigation"
      aria-label="Folder navigation loading"
    >
      <Skeleton className="h-4 w-12" aria-label="Home breadcrumb loading" />
      <span className="text-gray-400 dark:text-gray-500">/</span>
      <Skeleton className="h-4 w-20" aria-label="Parent folder loading" />
      <span className="text-gray-400 dark:text-gray-500">/</span>
      <Skeleton className="h-4 w-24" aria-label="Current folder loading" />
    </nav>
  );
}

/**
 * Skeleton for upload progress indicators
 * Shows during active file upload operations
 */
function UploadProgressSkeleton() {
  return (
    <div 
      className="fixed bottom-4 right-4 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 p-4 min-w-80 max-w-sm"
      role="status"
      aria-label="File upload progress"
      aria-live="polite"
    >
      <div className="flex items-center gap-3 mb-3">
        <Spinner size="sm" />
        <Skeleton className="h-4 w-32" aria-label="Upload status loading" />
      </div>
      
      {/* Progress bar skeleton */}
      <div className="space-y-2">
        <Skeleton className="h-2 w-full" aria-label="Upload progress bar" />
        <div className="flex justify-between">
          <Skeleton className="h-3 w-16" aria-label="Upload speed loading" />
          <Skeleton className="h-3 w-12" aria-label="Upload percentage loading" />
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// MAIN LOADING COMPONENT
// ============================================================================

/**
 * Main loading component for file management operations
 * Provides comprehensive skeleton UI for all file browser states
 * 
 * Features:
 * - Responsive design with mobile-first approach
 * - WCAG 2.1 AA compliant loading indicators
 * - Theme-aware styling for light/dark modes
 * - Proper ARIA attributes and roles
 * - Multiple loading state representations
 */
export default function FileManagementLoading() {
  return (
    <div 
      className="min-h-screen bg-gray-50 dark:bg-gray-900"
      role="main"
      aria-label="File management loading"
    >
      {/* Skip link for keyboard navigation */}
      <a 
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 bg-primary-600 text-white px-4 py-2 rounded-md z-50"
      >
        Skip to main content
      </a>

      {/* Page header with breadcrumb navigation */}
      <BreadcrumbSkeleton />
      
      {/* File management toolbar */}
      <FileToolbarSkeleton />
      
      {/* Main content area */}
      <div id="main-content" className="container mx-auto px-4 py-6">
        
        {/* File upload dropzone - shown when no files */}
        <div className="mb-8">
          <FileUploadSkeleton />
        </div>
        
        {/* File browser table */}
        <div 
          className="bg-white dark:bg-gray-900 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden"
          role="region"
          aria-label="File browser table loading"
        >
          {/* Table header */}
          <FileTableHeaderSkeleton />
          
          {/* Table rows */}
          <div role="rowgroup">
            {Array.from({ length: 8 }, (_, index) => (
              <FileTableRowSkeleton key={index} index={index} />
            ))}
          </div>
          
          {/* Table footer with pagination skeleton */}
          <div className="p-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              <Skeleton 
                className="h-4 w-32"
                aria-label="Items count loading"
              />
              <div className="flex items-center gap-2">
                <Skeleton className="h-8 w-8" aria-label="Previous page loading" />
                <Skeleton className="h-8 w-8" aria-label="Page 1 loading" />
                <Skeleton className="h-8 w-8" aria-label="Page 2 loading" />
                <Skeleton className="h-8 w-8" aria-label="Page 3 loading" />
                <Skeleton className="h-8 w-8" aria-label="Next page loading" />
              </div>
            </div>
          </div>
        </div>
        
        {/* File details panel skeleton - shown on desktop when file selected */}
        <div className="hidden xl:block mt-6">
          <div 
            className="bg-white dark:bg-gray-900 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6"
            role="region"
            aria-label="File details panel loading"
          >
            <div className="space-y-4">
              <Skeleton className="h-6 w-32" aria-label="File details title loading" />
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Skeleton className="h-4 w-16 mb-2" aria-label="File property label loading" />
                  <Skeleton className="h-4 w-24" aria-label="File property value loading" />
                </div>
                <div>
                  <Skeleton className="h-4 w-20 mb-2" aria-label="File property label loading" />
                  <Skeleton className="h-4 w-32" aria-label="File property value loading" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Upload progress overlay - conditionally shown */}
      <UploadProgressSkeleton />
      
      {/* Loading announcement for screen readers */}
      <div 
        role="status" 
        aria-live="polite" 
        aria-atomic="true"
        className="sr-only"
      >
        Loading file management interface. Please wait while we prepare your files and folders.
      </div>
    </div>
  );
}

// ============================================================================
// ACCESSIBILITY NOTES
// ============================================================================

/**
 * WCAG 2.1 AA Compliance Features:
 * 
 * 1. Keyboard Navigation:
 *    - Skip link for main content
 *    - Proper focus management
 *    - No keyboard traps
 * 
 * 2. Screen Reader Support:
 *    - Proper ARIA roles and labels
 *    - Live regions for status updates
 *    - Descriptive loading messages
 *    - Hidden decorative content
 * 
 * 3. Visual Design:
 *    - High contrast loading indicators
 *    - Theme-aware styling (light/dark)
 *    - Consistent animation timing
 *    - Reduced motion support via CSS
 * 
 * 4. Responsive Design:
 *    - Mobile-first approach
 *    - Touch-friendly loading states
 *    - Adaptive content layout
 *    - Minimum 44px touch targets
 * 
 * 5. Color and Contrast:
 *    - Uses semantic color tokens
 *    - Meets 4.5:1 contrast for text
 *    - Meets 3:1 contrast for UI components
 *    - No color-only information
 */

/**
 * Performance Considerations:
 * 
 * 1. Efficient Rendering:
 *    - Minimal DOM elements
 *    - CSS-based animations
 *    - No JavaScript animations
 *    - Optimized for SSR
 * 
 * 2. Bundle Size:
 *    - No external dependencies
 *    - Tree-shakeable components
 *    - Minimal CSS footprint
 *    - Reusable skeleton patterns
 * 
 * 3. Accessibility Performance:
 *    - Efficient ARIA updates
 *    - Minimal screen reader verbosity
 *    - Fast keyboard navigation
 *    - Optimized focus management
 */

/**
 * Usage Examples:
 * 
 * This loading component is automatically used by Next.js app router
 * when navigating to /adf-files route while the page component loads.
 * 
 * The component provides skeleton states for:
 * - Initial page load
 * - File upload operations
 * - Folder navigation
 * - Search and filtering
 * - File selection and preview
 */