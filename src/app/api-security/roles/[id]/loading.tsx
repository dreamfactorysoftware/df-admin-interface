/**
 * Loading component for role editing page
 * 
 * Displays skeleton states and loading indicators while role data and dependencies
 * are being fetched for the specific role ID. Provides smooth user experience during
 * initial page load and data fetching operations with accessible skeleton UI patterns
 * and WCAG 2.1 AA compliance.
 * 
 * Designed specifically for the role editing form structure with skeletons for:
 * - Role details (name, description, is_active)
 * - Service access configuration
 * - Lookup keys sections
 * - Permission settings
 * 
 * @returns JSX.Element - Accessible loading interface with skeleton patterns
 */

import { type FC } from 'react';

/**
 * Reusable skeleton component with accessibility attributes
 */
const Skeleton: FC<{
  className?: string;
  'aria-label'?: string;
  role?: string;
}> = ({ className = '', 'aria-label': ariaLabel, role = 'status' }) => (
  <div
    className={`animate-pulse bg-gray-200 dark:bg-gray-700 rounded-md ${className}`}
    role={role}
    aria-label={ariaLabel || 'Loading content'}
    aria-live="polite"
  />
);

/**
 * Loading spinner component for sections that need active loading indicators
 */
const LoadingSpinner: FC<{
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}> = ({ size = 'md', className = '' }) => {
  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-6 w-6',
    lg: 'h-8 w-8'
  };

  return (
    <div
      className={`inline-block animate-spin rounded-full border-2 border-solid border-primary-200 border-r-primary-600 ${sizeClasses[size]} ${className}`}
      role="status"
      aria-label="Loading"
      aria-live="polite"
    >
      <span className="sr-only">Loading...</span>
    </div>
  );
};

/**
 * Form field skeleton with label and input placeholder
 */
const FormFieldSkeleton: FC<{
  hasLabel?: boolean;
  inputType?: 'input' | 'textarea' | 'select';
  labelWidth?: string;
  inputHeight?: string;
}> = ({ 
  hasLabel = true, 
  inputType = 'input',
  labelWidth = 'w-24',
  inputHeight = 'h-10'
}) => (
  <div className="space-y-2">
    {hasLabel && (
      <Skeleton 
        className={`h-4 ${labelWidth}`}
        aria-label="Loading form label"
      />
    )}
    <Skeleton 
      className={`w-full ${inputType === 'textarea' ? 'h-24' : inputType === 'select' ? 'h-10' : inputHeight}`}
      aria-label={`Loading ${inputType} field`}
    />
  </div>
);

/**
 * Table skeleton for service access configuration
 */
const TableSkeleton: FC<{
  rows?: number;
  columns?: number;
}> = ({ rows = 5, columns = 4 }) => (
  <div className="space-y-3">
    {/* Table header */}
    <div className="grid grid-cols-4 gap-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-t-lg">
      {Array.from({ length: columns }).map((_, index) => (
        <Skeleton
          key={`header-${index}`}
          className="h-4 w-full"
          aria-label={`Loading table header ${index + 1}`}
        />
      ))}
    </div>
    
    {/* Table rows */}
    <div className="space-y-2">
      {Array.from({ length: rows }).map((_, rowIndex) => (
        <div key={`row-${rowIndex}`} className="grid grid-cols-4 gap-4 p-4 border-b border-gray-200 dark:border-gray-700">
          {Array.from({ length: columns }).map((_, colIndex) => (
            <Skeleton
              key={`cell-${rowIndex}-${colIndex}`}
              className="h-4 w-full"
              aria-label={`Loading table cell ${rowIndex + 1}, ${colIndex + 1}`}
            />
          ))}
        </div>
      ))}
    </div>
  </div>
);

/**
 * Card skeleton for section containers
 */
const CardSkeleton: FC<{
  children: React.ReactNode;
  title?: string;
}> = ({ children, title }) => (
  <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm p-6 space-y-6">
    {title && (
      <div className="space-y-2">
        <Skeleton 
          className="h-6 w-48"
          aria-label={`Loading ${title} section title`}
        />
        <Skeleton 
          className="h-4 w-96"
          aria-label={`Loading ${title} section description`}
        />
      </div>
    )}
    {children}
  </div>
);

/**
 * Main loading component for role editing page
 */
const RoleEditLoading: FC = () => {
  return (
    <div 
      className="container mx-auto px-4 py-6 space-y-8 animate-fade-in"
      role="main"
      aria-label="Loading role editing form"
    >
      {/* Screen reader announcement */}
      <div className="sr-only" aria-live="polite" aria-atomic="true">
        Loading role editing form. Please wait while we fetch the role details, service configurations, and lookup keys.
      </div>

      {/* Page header loading */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <Skeleton 
              className="h-8 w-64"
              aria-label="Loading page title"
            />
            <Skeleton 
              className="h-4 w-96"
              aria-label="Loading page description"
            />
          </div>
          <div className="flex space-x-3">
            <Skeleton 
              className="h-10 w-20"
              aria-label="Loading cancel button"
            />
            <Skeleton 
              className="h-10 w-24"
              aria-label="Loading save button"
            />
          </div>
        </div>
        
        {/* Breadcrumb loading */}
        <div className="flex items-center space-x-2">
          <Skeleton className="h-4 w-16" aria-label="Loading breadcrumb item" />
          <span className="text-gray-400">/</span>
          <Skeleton className="h-4 w-20" aria-label="Loading breadcrumb item" />
          <span className="text-gray-400">/</span>
          <Skeleton className="h-4 w-24" aria-label="Loading breadcrumb item" />
        </div>
      </div>

      {/* Main content grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left column - Main role details */}
        <div className="lg:col-span-2 space-y-8">
          
          {/* Basic Role Information Card */}
          <CardSkeleton title="Role Details">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormFieldSkeleton labelWidth="w-16" />
              <FormFieldSkeleton labelWidth="w-20" />
            </div>
            
            <FormFieldSkeleton 
              inputType="textarea"
              labelWidth="w-24"
            />
            
            {/* Active status toggle */}
            <div className="flex items-center space-x-3">
              <Skeleton 
                className="h-6 w-11 rounded-full"
                aria-label="Loading active status toggle"
              />
              <Skeleton 
                className="h-4 w-32"
                aria-label="Loading active status label"
              />
            </div>
          </CardSkeleton>

          {/* Service Access Configuration Card */}
          <CardSkeleton title="Service Access Configuration">
            <div className="space-y-4">
              {/* Search and filter controls */}
              <div className="flex flex-col sm:flex-row gap-4">
                <FormFieldSkeleton 
                  hasLabel={false}
                  labelWidth="w-0"
                  inputHeight="h-10"
                />
                <Skeleton 
                  className="h-10 w-32"
                  aria-label="Loading filter dropdown"
                />
              </div>
              
              {/* Service access table */}
              <div className="overflow-hidden rounded-lg border border-gray-200 dark:border-gray-700">
                <TableSkeleton rows={6} columns={5} />
              </div>
              
              {/* Loading indicator for service data */}
              <div className="flex items-center justify-center py-4">
                <LoadingSpinner size="md" className="mr-3" />
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  Loading service configurations...
                </span>
              </div>
            </div>
          </CardSkeleton>

          {/* Permission Settings Card */}
          <CardSkeleton title="Permission Settings">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {Array.from({ length: 6 }).map((_, index) => (
                <div key={`permission-${index}`} className="flex items-center space-x-3">
                  <Skeleton 
                    className="h-4 w-4 rounded"
                    aria-label={`Loading permission checkbox ${index + 1}`}
                  />
                  <Skeleton 
                    className="h-4 w-24"
                    aria-label={`Loading permission label ${index + 1}`}
                  />
                </div>
              ))}
            </div>
          </CardSkeleton>
        </div>

        {/* Right column - Sidebar information */}
        <div className="space-y-8">
          
          {/* Lookup Keys Card */}
          <CardSkeleton title="Lookup Keys">
            <div className="space-y-4">
              {Array.from({ length: 4 }).map((_, index) => (
                <div key={`lookup-${index}`} className="space-y-2">
                  <Skeleton 
                    className="h-4 w-32"
                    aria-label={`Loading lookup key ${index + 1} label`}
                  />
                  <Skeleton 
                    className="h-8 w-full"
                    aria-label={`Loading lookup key ${index + 1} value`}
                  />
                </div>
              ))}
              
              {/* Add lookup key button */}
              <Skeleton 
                className="h-10 w-full"
                aria-label="Loading add lookup key button"
              />
            </div>
          </CardSkeleton>

          {/* Role Metadata Card */}
          <CardSkeleton title="Role Information">
            <div className="space-y-4">
              <div className="space-y-2">
                <Skeleton className="h-4 w-20" aria-label="Loading created date label" />
                <Skeleton className="h-4 w-32" aria-label="Loading created date value" />
              </div>
              
              <div className="space-y-2">
                <Skeleton className="h-4 w-24" aria-label="Loading modified date label" />
                <Skeleton className="h-4 w-32" aria-label="Loading modified date value" />
              </div>
              
              <div className="space-y-2">
                <Skeleton className="h-4 w-16" aria-label="Loading role ID label" />
                <Skeleton className="h-4 w-8" aria-label="Loading role ID value" />
              </div>
            </div>
          </CardSkeleton>

          {/* Quick Actions Card */}
          <CardSkeleton title="Quick Actions">
            <div className="space-y-3">
              <Skeleton 
                className="h-10 w-full"
                aria-label="Loading duplicate role button"
              />
              <Skeleton 
                className="h-10 w-full"
                aria-label="Loading export role button"
              />
              <Skeleton 
                className="h-10 w-full"
                aria-label="Loading delete role button"
              />
            </div>
          </CardSkeleton>
        </div>
      </div>

      {/* Loading progress indicator */}
      <div 
        className="fixed bottom-4 right-4 bg-white dark:bg-gray-900 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 p-4"
        role="status"
        aria-live="polite"
      >
        <div className="flex items-center space-x-3">
          <LoadingSpinner size="sm" />
          <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
            Loading role data...
          </span>
        </div>
      </div>
    </div>
  );
};

export default RoleEditLoading;