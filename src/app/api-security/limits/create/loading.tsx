/**
 * Loading component for the API Security Limits Create page
 * 
 * Displays accessible skeleton states while form data and dropdown options are being fetched.
 * Implements WCAG 2.1 AA compliant loading indicators with smooth animations and responsive design.
 * 
 * Features:
 * - Accessible skeleton UI with proper ARIA labels for screen readers
 * - Responsive design patterns for all supported breakpoints
 * - Smooth loading transitions using Tailwind CSS animations
 * - Form field and dropdown skeleton states
 * - WCAG 2.1 AA compliant color contrast and accessibility
 */

import React from 'react';

// Skeleton component with accessibility support
const Skeleton: React.FC<{ 
  className?: string; 
  ariaLabel?: string;
  role?: string;
}> = ({ 
  className = '', 
  ariaLabel = 'Loading content',
  role = 'status'
}) => (
  <div
    className={`animate-pulse bg-gray-200 dark:bg-gray-700 rounded-md ${className}`}
    aria-label={ariaLabel}
    role={role}
    aria-live="polite"
  >
    <span className="sr-only">{ariaLabel}</span>
  </div>
);

// Card component with loading state styling
const LoadingCard: React.FC<{ 
  children: React.ReactNode;
  className?: string;
}> = ({ children, className = '' }) => (
  <div className={`
    bg-white dark:bg-gray-900 
    border border-gray-200 dark:border-gray-700 
    rounded-lg 
    shadow-sm 
    p-6 
    ${className}
  `}>
    {children}
  </div>
);

// Form field skeleton with proper proportions
const FormFieldSkeleton: React.FC<{ 
  label?: boolean;
  required?: boolean;
  helpText?: boolean;
}> = ({ 
  label = true, 
  required = false, 
  helpText = false 
}) => (
  <div className="space-y-2">
    {label && (
      <div className="flex items-center space-x-1">
        <Skeleton 
          className="h-4 w-24" 
          ariaLabel="Loading field label"
        />
        {required && (
          <Skeleton 
            className="h-3 w-3 rounded-full" 
            ariaLabel="Loading required indicator"
          />
        )}
      </div>
    )}
    <Skeleton 
      className="h-11 w-full" 
      ariaLabel="Loading input field"
    />
    {helpText && (
      <Skeleton 
        className="h-3 w-3/4" 
        ariaLabel="Loading help text"
      />
    )}
  </div>
);

// Dropdown/Select skeleton
const SelectSkeleton: React.FC<{ 
  label?: boolean;
  required?: boolean;
}> = ({ 
  label = true, 
  required = false 
}) => (
  <div className="space-y-2">
    {label && (
      <div className="flex items-center space-x-1">
        <Skeleton 
          className="h-4 w-20" 
          ariaLabel="Loading select label"
        />
        {required && (
          <Skeleton 
            className="h-3 w-3 rounded-full" 
            ariaLabel="Loading required indicator"
          />
        )}
      </div>
    )}
    <div className="relative">
      <Skeleton 
        className="h-11 w-full" 
        ariaLabel="Loading dropdown field"
      />
      <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
        <Skeleton 
          className="h-4 w-4" 
          ariaLabel="Loading dropdown icon"
        />
      </div>
    </div>
  </div>
);

// Button skeleton
const ButtonSkeleton: React.FC<{ 
  variant?: 'primary' | 'secondary';
  size?: 'sm' | 'md' | 'lg';
}> = ({ 
  variant = 'primary', 
  size = 'md' 
}) => {
  const sizeClasses = {
    sm: 'h-9 w-20',
    md: 'h-11 w-24', 
    lg: 'h-12 w-28'
  };

  return (
    <Skeleton 
      className={`${sizeClasses[size]} rounded-md`}
      ariaLabel={`Loading ${variant} button`}
    />
  );
};

/**
 * Loading component for the Create Limit page
 * 
 * Renders skeleton states for the entire form while data is being fetched.
 * Provides accessible loading experience with proper ARIA labels and screen reader support.
 */
export default function CreateLimitLoading() {
  return (
    <div className="container mx-auto px-4 py-6 max-w-4xl">
      {/* Page header skeleton */}
      <div className="mb-8" role="region" aria-label="Page header loading">
        <Skeleton 
          className="h-8 w-48 mb-4" 
          ariaLabel="Loading page title"
        />
        <Skeleton 
          className="h-4 w-96" 
          ariaLabel="Loading page description"
        />
      </div>

      {/* Main form card */}
      <LoadingCard className="mb-6">
        <div role="region" aria-label="Form loading">
          {/* Form header */}
          <div className="mb-6 pb-4 border-b border-gray-200 dark:border-gray-700">
            <Skeleton 
              className="h-6 w-32 mb-2" 
              ariaLabel="Loading form title"
            />
            <Skeleton 
              className="h-4 w-80" 
              ariaLabel="Loading form description"
            />
          </div>

          {/* Form fields grid - responsive layout */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            {/* Limit name field */}
            <div className="md:col-span-2">
              <FormFieldSkeleton 
                label={true} 
                required={true}
                helpText={true}
              />
            </div>

            {/* Limit type dropdown */}
            <div>
              <SelectSkeleton 
                label={true} 
                required={true}
              />
            </div>

            {/* Service selection dropdown */}
            <div>
              <SelectSkeleton 
                label={true} 
                required={true}
              />
            </div>

            {/* Rate limit value */}
            <div>
              <FormFieldSkeleton 
                label={true} 
                required={true}
                helpText={true}
              />
            </div>

            {/* Time period dropdown */}
            <div>
              <SelectSkeleton 
                label={true} 
                required={true}
              />
            </div>

            {/* User/Role selection */}
            <div className="md:col-span-2">
              <SelectSkeleton 
                label={true} 
                required={false}
              />
            </div>

            {/* Description field */}
            <div className="md:col-span-2">
              <div className="space-y-2">
                <Skeleton 
                  className="h-4 w-20" 
                  ariaLabel="Loading description label"
                />
                <Skeleton 
                  className="h-24 w-full" 
                  ariaLabel="Loading description textarea"
                />
              </div>
            </div>
          </div>

          {/* Advanced settings section */}
          <div className="mb-6">
            <div className="mb-4">
              <Skeleton 
                className="h-5 w-36" 
                ariaLabel="Loading advanced settings title"
              />
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Additional options */}
              <div>
                <FormFieldSkeleton 
                  label={true} 
                  required={false}
                />
              </div>
              
              <div>
                <SelectSkeleton 
                  label={true} 
                  required={false}
                />
              </div>
            </div>
          </div>

          {/* Form actions */}
          <div 
            className="flex flex-col sm:flex-row gap-3 sm:gap-4 pt-6 border-t border-gray-200 dark:border-gray-700"
            role="region" 
            aria-label="Form actions loading"
          >
            <div className="flex gap-3">
              <ButtonSkeleton variant="primary" size="md" />
              <ButtonSkeleton variant="secondary" size="md" />
            </div>
            
            {/* Cancel button - aligned right on desktop */}
            <div className="sm:ml-auto">
              <ButtonSkeleton variant="secondary" size="md" />
            </div>
          </div>
        </div>
      </LoadingCard>

      {/* Additional info card */}
      <LoadingCard>
        <div role="region" aria-label="Additional information loading">
          <Skeleton 
            className="h-5 w-28 mb-4" 
            ariaLabel="Loading info section title"
          />
          
          <div className="space-y-3">
            <Skeleton 
              className="h-4 w-full" 
              ariaLabel="Loading info line 1"
            />
            <Skeleton 
              className="h-4 w-5/6" 
              ariaLabel="Loading info line 2"
            />
            <Skeleton 
              className="h-4 w-4/5" 
              ariaLabel="Loading info line 3"
            />
          </div>
        </div>
      </LoadingCard>

      {/* Screen reader announcement */}
      <div 
        aria-live="polite" 
        aria-atomic="true" 
        className="sr-only"
        role="status"
      >
        Loading create limit form. Please wait while we fetch the necessary data and options.
      </div>
    </div>
  );
}