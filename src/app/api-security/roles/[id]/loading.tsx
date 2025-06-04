/**
 * Loading component for the role editing page that displays skeleton states and loading indicators
 * while role data and dependencies are being fetched for the specific role ID.
 * 
 * Provides smooth user experience during initial page load and data fetching operations with
 * accessible skeleton UI patterns and WCAG 2.1 AA compliance. Designed specifically for the
 * role editing form structure with skeletons for role details, service access configuration,
 * and lookup keys sections.
 * 
 * @implements Next.js app router loading conventions per Section 4.7.1.1 routing migration
 * @implements Tailwind CSS animation classes for smooth loading transitions per Section 7.1.2
 * @implements Responsive design patterns for all supported breakpoints per React/Next.js Integration Requirements
 * @implements Progressive loading patterns for complex role form sections per F-005 User and Role Management
 */

import React from 'react';

/**
 * Skeleton component for form field loading states
 * Provides consistent skeleton patterns for input fields with proper accessibility
 */
const FieldSkeleton: React.FC<{ 
  type?: 'input' | 'textarea' | 'toggle' | 'select';
  width?: 'full' | 'half' | 'quarter';
  label?: boolean;
}> = ({ 
  type = 'input', 
  width = 'full',
  label = true 
}) => {
  const widthClasses = {
    full: 'w-full',
    half: 'w-1/2',
    quarter: 'w-1/4'
  };

  const heightClasses = {
    input: 'h-12',
    textarea: 'h-24',
    toggle: 'h-6',
    select: 'h-12'
  };

  return (
    <div className={`space-y-2 ${widthClasses[width]}`}>
      {label && (
        <div 
          className="h-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"
          style={{ width: '30%' }}
          role="presentation"
          aria-hidden="true"
        />
      )}
      <div 
        className={`bg-gray-200 dark:bg-gray-700 rounded-md animate-pulse ${heightClasses[type]}`}
        role="presentation"
        aria-hidden="true"
      />
    </div>
  );
};

/**
 * Skeleton component for complex sections like service access and lookup keys
 * Represents table-like structures with multiple rows and columns
 */
const SectionSkeleton: React.FC<{
  title: string;
  rows?: number;
  columns?: number;
}> = ({ 
  title, 
  rows = 3, 
  columns = 3 
}) => {
  return (
    <div className="space-y-4">
      {/* Section title */}
      <div 
        className="h-5 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"
        style={{ width: '40%' }}
        role="presentation"
        aria-hidden="true"
      />
      
      {/* Table header skeleton */}
      <div className="grid gap-4" style={{ gridTemplateColumns: `repeat(${columns}, 1fr)` }}>
        {Array.from({ length: columns }).map((_, index) => (
          <div 
            key={`header-${index}`}
            className="h-8 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"
            role="presentation"
            aria-hidden="true"
          />
        ))}
      </div>
      
      {/* Table rows skeleton */}
      {Array.from({ length: rows }).map((_, rowIndex) => (
        <div 
          key={`row-${rowIndex}`}
          className="grid gap-4 py-2 border-b border-gray-100 dark:border-gray-800"
          style={{ gridTemplateColumns: `repeat(${columns}, 1fr)` }}
        >
          {Array.from({ length: columns }).map((_, colIndex) => (
            <div 
              key={`cell-${rowIndex}-${colIndex}`}
              className="h-6 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"
              role="presentation"
              aria-hidden="true"
            />
          ))}
        </div>
      ))}
    </div>
  );
};

/**
 * Loading component for role editing page
 * 
 * Displays skeleton states for all major form sections while role data and dependencies
 * are being fetched. Maintains proper semantic structure and accessibility for screen readers.
 * 
 * @returns JSX element representing the loading state of the role editing form
 */
export default function Loading(): JSX.Element {
  return (
    <div 
      className="max-w-4xl mx-auto p-4 sm:p-6 lg:p-8 space-y-6"
      role="status"
      aria-label="Loading role details"
      aria-live="polite"
    >
      {/* Loading announcement for screen readers */}
      <div className="sr-only">
        Loading role editing form, please wait...
      </div>
      
      {/* Page description skeleton */}
      <div className="space-y-2">
        <div 
          className="h-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"
          style={{ width: '85%' }}
          role="presentation"
          aria-hidden="true"
        />
        <div 
          className="h-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"
          style={{ width: '70%' }}
          role="presentation"
          aria-hidden="true"
        />
      </div>

      {/* Alert area skeleton */}
      <div 
        className="h-12 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-md animate-pulse"
        role="presentation"
        aria-hidden="true"
      />

      {/* Form container */}
      <div 
        className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg p-6 space-y-8"
        role="presentation"
        aria-hidden="true"
      >
        
        {/* Basic role information fields */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Name field */}
          <FieldSkeleton type="input" width="full" label={true} />
          
          {/* Active toggle */}
          <div className="flex items-center space-x-3">
            <div 
              className="w-12 h-6 bg-gray-200 dark:bg-gray-700 rounded-full animate-pulse"
              role="presentation"
              aria-hidden="true"
            />
            <div 
              className="h-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"
              style={{ width: '60px' }}
              role="presentation"
              aria-hidden="true"
            />
          </div>
        </div>

        {/* Description field */}
        <FieldSkeleton type="textarea" width="full" label={true} />

        {/* Service Access section */}
        <div className="space-y-6">
          <SectionSkeleton 
            title="Service Access Configuration"
            rows={4}
            columns={4}
          />
          
          {/* Additional service access controls */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.from({ length: 6 }).map((_, index) => (
              <div 
                key={`access-control-${index}`}
                className="flex items-center space-x-2"
              >
                <div 
                  className="w-4 h-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"
                  role="presentation"
                  aria-hidden="true"
                />
                <div 
                  className="h-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse flex-1"
                  role="presentation"
                  aria-hidden="true"
                />
              </div>
            ))}
          </div>
        </div>

        {/* Lookup Keys section */}
        <div className="space-y-4">
          {/* Lookup keys description */}
          <div 
            className="h-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"
            style={{ width: '75%' }}
            role="presentation"
            aria-hidden="true"
          />
          
          <SectionSkeleton 
            title="Lookup Keys"
            rows={3}
            columns={3}
          />
          
          {/* Add lookup key button area */}
          <div 
            className="h-10 w-32 bg-gray-200 dark:bg-gray-700 rounded-md animate-pulse"
            role="presentation"
            aria-hidden="true"
          />
        </div>

        {/* Action buttons */}
        <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 pt-6 border-t border-gray-200 dark:border-gray-700">
          <div 
            className="h-10 w-full sm:w-24 bg-gray-200 dark:bg-gray-700 rounded-md animate-pulse"
            role="presentation"
            aria-hidden="true"
          />
          <div 
            className="h-10 w-full sm:w-24 bg-primary-200 dark:bg-primary-700 rounded-md animate-pulse"
            role="presentation"
            aria-hidden="true"
          />
        </div>
      </div>

      {/* Loading spinner for additional visual feedback */}
      <div className="flex justify-center py-4">
        <div 
          className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 dark:border-primary-400"
          role="presentation"
          aria-hidden="true"
        />
      </div>
    </div>
  );
}