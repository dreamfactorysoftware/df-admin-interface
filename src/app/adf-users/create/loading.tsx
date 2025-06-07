/**
 * @fileoverview Next.js loading UI component for the user creation route
 * Displays skeleton placeholders and loading indicators during form initialization 
 * and data fetching operations. Implements accessible loading states with proper 
 * ARIA attributes and responsive design following Tailwind CSS patterns.
 * 
 * @version 1.0.0
 * @since 2024
 */

import React from 'react';

/**
 * Skeleton placeholder component for consistent loading animations
 * Implements WCAG 2.1 AA compliant loading indicators with proper accessibility
 */
const Skeleton: React.FC<{
  className?: string;
  'aria-label'?: string;
}> = ({ className = '', 'aria-label': ariaLabel }) => (
  <div
    className={`animate-pulse bg-gray-200 dark:bg-gray-700 rounded ${className}`}
    role="presentation"
    aria-label={ariaLabel || 'Loading content'}
    aria-hidden="true"
  />
);

/**
 * Loading spinner component for active data fetching states
 * Uses WCAG compliant color contrast and accessibility announcements
 */
const LoadingSpinner: React.FC<{
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
      className={`inline-flex items-center justify-center ${className}`}
      role="status"
      aria-live="polite"
      aria-label="Loading data"
    >
      <div
        className={`animate-spin rounded-full border-2 border-gray-300 dark:border-gray-600 border-t-primary-600 dark:border-t-primary-400 ${sizeClasses[size]}`}
        aria-hidden="true"
      />
      <span className="sr-only">Loading...</span>
    </div>
  );
};

/**
 * Profile details section skeleton loader
 * Matches the structure of user profile form fields
 */
const ProfileDetailsSkeleton: React.FC = () => (
  <div className="space-y-6">
    {/* Section header */}
    <div className="space-y-2">
      <Skeleton className="h-6 w-32" aria-label="Loading section title" />
      <Skeleton className="h-4 w-80" aria-label="Loading section description" />
    </div>

    {/* Form fields grid */}
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {/* First Name */}
      <div className="space-y-2">
        <Skeleton className="h-4 w-20" aria-label="Loading first name label" />
        <Skeleton className="h-12 w-full" aria-label="Loading first name input" />
      </div>

      {/* Last Name */}
      <div className="space-y-2">
        <Skeleton className="h-4 w-20" aria-label="Loading last name label" />
        <Skeleton className="h-12 w-full" aria-label="Loading last name input" />
      </div>

      {/* Email */}
      <div className="space-y-2 md:col-span-2">
        <Skeleton className="h-4 w-16" aria-label="Loading email label" />
        <Skeleton className="h-12 w-full" aria-label="Loading email input" />
      </div>

      {/* Display Name */}
      <div className="space-y-2">
        <Skeleton className="h-4 w-24" aria-label="Loading display name label" />
        <Skeleton className="h-12 w-full" aria-label="Loading display name input" />
      </div>

      {/* Phone */}
      <div className="space-y-2">
        <Skeleton className="h-4 w-16" aria-label="Loading phone label" />
        <Skeleton className="h-12 w-full" aria-label="Loading phone input" />
      </div>

      {/* User Type */}
      <div className="space-y-2">
        <Skeleton className="h-4 w-20" aria-label="Loading user type label" />
        <Skeleton className="h-12 w-full" aria-label="Loading user type select" />
      </div>

      {/* Status */}
      <div className="space-y-2">
        <Skeleton className="h-4 w-16" aria-label="Loading status label" />
        <Skeleton className="h-12 w-full" aria-label="Loading status select" />
      </div>
    </div>

    {/* Authentication options */}
    <div className="space-y-4">
      <Skeleton className="h-4 w-40" aria-label="Loading authentication options label" />
      <div className="space-y-3">
        <div className="flex items-center space-x-3">
          <Skeleton className="h-5 w-5 rounded" aria-label="Loading send invitation checkbox" />
          <Skeleton className="h-4 w-32" aria-label="Loading send invitation label" />
        </div>
        <div className="flex items-center space-x-3">
          <Skeleton className="h-5 w-5 rounded" aria-label="Loading require password checkbox" />
          <Skeleton className="h-4 w-40" aria-label="Loading require password label" />
        </div>
      </div>
    </div>
  </div>
);

/**
 * App roles section skeleton loader
 * Shows loading state for role assignment interface
 */
const AppRolesSkeleton: React.FC = () => (
  <div className="space-y-6">
    {/* Section header with spinner */}
    <div className="flex items-center justify-between">
      <div className="space-y-2">
        <Skeleton className="h-6 w-28" aria-label="Loading app roles title" />
        <Skeleton className="h-4 w-72" aria-label="Loading app roles description" />
      </div>
      <LoadingSpinner size="sm" />
    </div>

    {/* App selection */}
    <div className="space-y-2">
      <Skeleton className="h-4 w-32" aria-label="Loading application select label" />
      <Skeleton className="h-12 w-full" aria-label="Loading application select dropdown" />
    </div>

    {/* Role assignment table */}
    <div className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
      {/* Table header */}
      <div className="bg-gray-50 dark:bg-gray-800 p-4 border-b border-gray-200 dark:border-gray-700">
        <div className="grid grid-cols-12 gap-4">
          <div className="col-span-1">
            <Skeleton className="h-5 w-5 rounded" aria-label="Loading select all checkbox" />
          </div>
          <div className="col-span-4">
            <Skeleton className="h-4 w-20" aria-label="Loading role name header" />
          </div>
          <div className="col-span-7">
            <Skeleton className="h-4 w-28" aria-label="Loading description header" />
          </div>
        </div>
      </div>

      {/* Table rows */}
      <div className="divide-y divide-gray-200 dark:divide-gray-700">
        {Array.from({ length: 4 }).map((_, index) => (
          <div key={index} className="p-4">
            <div className="grid grid-cols-12 gap-4 items-center">
              <div className="col-span-1">
                <Skeleton className="h-5 w-5 rounded" aria-label={`Loading role ${index + 1} checkbox`} />
              </div>
              <div className="col-span-4">
                <Skeleton className="h-4 w-24" aria-label={`Loading role ${index + 1} name`} />
              </div>
              <div className="col-span-7">
                <Skeleton className="h-4 w-48" aria-label={`Loading role ${index + 1} description`} />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>

    {/* Selected roles summary */}
    <div className="space-y-2">
      <Skeleton className="h-4 w-28" aria-label="Loading selected roles label" />
      <Skeleton className="h-8 w-full" aria-label="Loading selected roles summary" />
    </div>
  </div>
);

/**
 * Lookup keys section skeleton loader
 * Shows loading state for lookup key configuration
 */
const LookupKeysSkeleton: React.FC = () => (
  <div className="space-y-6">
    {/* Section header with spinner */}
    <div className="flex items-center justify-between">
      <div className="space-y-2">
        <Skeleton className="h-6 w-32" aria-label="Loading lookup keys title" />
        <Skeleton className="h-4 w-96" aria-label="Loading lookup keys description" />
      </div>
      <LoadingSpinner size="sm" />
    </div>

    {/* Add lookup key button */}
    <div className="flex justify-start">
      <Skeleton className="h-10 w-36" aria-label="Loading add lookup key button" />
    </div>

    {/* Lookup keys list */}
    <div className="space-y-4">
      {Array.from({ length: 3 }).map((_, index) => (
        <div 
          key={index} 
          className="border border-gray-200 dark:border-gray-700 rounded-lg p-4"
        >
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Skeleton className="h-4 w-16" aria-label={`Loading lookup key ${index + 1} name label`} />
              <Skeleton className="h-10 w-full" aria-label={`Loading lookup key ${index + 1} name input`} />
            </div>
            <div className="space-y-2">
              <Skeleton className="h-4 w-20" aria-label={`Loading lookup key ${index + 1} value label`} />
              <Skeleton className="h-10 w-full" aria-label={`Loading lookup key ${index + 1} value input`} />
            </div>
            <div className="space-y-2">
              <Skeleton className="h-4 w-20" aria-label={`Loading lookup key ${index + 1} actions label`} />
              <div className="flex space-x-2">
                <Skeleton className="h-10 w-10" aria-label={`Loading lookup key ${index + 1} edit button`} />
                <Skeleton className="h-10 w-10" aria-label={`Loading lookup key ${index + 1} delete button`} />
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  </div>
);

/**
 * Form actions skeleton loader
 * Shows loading state for form submission buttons
 */
const FormActionsSkeleton: React.FC = () => (
  <div className="flex items-center justify-between pt-6 border-t border-gray-200 dark:border-gray-700">
    <Skeleton className="h-12 w-24" aria-label="Loading cancel button" />
    <div className="flex space-x-3">
      <Skeleton className="h-12 w-32" aria-label="Loading save draft button" />
      <Skeleton className="h-12 w-36" aria-label="Loading create user button" />
    </div>
  </div>
);

/**
 * Main loading component for user creation route
 * Implements Next.js app router loading patterns with comprehensive accessibility
 * 
 * Features:
 * - WCAG 2.1 AA compliant loading indicators
 * - Responsive design for mobile and desktop viewports
 * - Theme-aware styling with dark mode support
 * - Skeleton placeholders matching form structure
 * - Smooth loading transitions with proper announcements
 */
export default function UserCreateLoading(): JSX.Element {
  return (
    <div 
      className="max-w-4xl mx-auto space-y-8 p-6"
      role="status"
      aria-live="polite"
      aria-label="Loading user creation form"
      data-testid="user-create-loading"
    >
      {/* Page header */}
      <div className="space-y-4">
        {/* Breadcrumb */}
        <div className="flex items-center space-x-2 text-sm">
          <Skeleton className="h-4 w-16" aria-label="Loading breadcrumb home" />
          <span className="text-gray-400 dark:text-gray-600" aria-hidden="true">/</span>
          <Skeleton className="h-4 w-20" aria-label="Loading breadcrumb users" />
          <span className="text-gray-400 dark:text-gray-600" aria-hidden="true">/</span>
          <Skeleton className="h-4 w-24" aria-label="Loading breadcrumb create" />
        </div>

        {/* Page title and description */}
        <div className="space-y-2">
          <div className="flex items-center space-x-3">
            <Skeleton className="h-8 w-48" aria-label="Loading page title" />
            <LoadingSpinner size="sm" />
          </div>
          <Skeleton className="h-5 w-96" aria-label="Loading page description" />
        </div>
      </div>

      {/* Main form container */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm">
        <div className="p-6 space-y-8">
          {/* Profile Details Section */}
          <section 
            className="space-y-6"
            aria-labelledby="profile-details-loading"
          >
            <div className="pb-4 border-b border-gray-200 dark:border-gray-700">
              <h2 
                id="profile-details-loading"
                className="sr-only"
              >
                Loading profile details section
              </h2>
              <ProfileDetailsSkeleton />
            </div>
          </section>

          {/* App Roles Section */}
          <section 
            className="space-y-6"
            aria-labelledby="app-roles-loading"
          >
            <div className="pb-4 border-b border-gray-200 dark:border-gray-700">
              <h2 
                id="app-roles-loading"
                className="sr-only"
              >
                Loading app roles section
              </h2>
              <AppRolesSkeleton />
            </div>
          </section>

          {/* Lookup Keys Section */}
          <section 
            className="space-y-6"
            aria-labelledby="lookup-keys-loading"
          >
            <div className="pb-4 border-b border-gray-200 dark:border-gray-700">
              <h2 
                id="lookup-keys-loading"
                className="sr-only"
              >
                Loading lookup keys section
              </h2>
              <LookupKeysSkeleton />
            </div>
          </section>

          {/* Form Actions */}
          <FormActionsSkeleton />
        </div>
      </div>

      {/* Loading announcement for screen readers */}
      <div 
        className="sr-only" 
        aria-live="polite" 
        aria-atomic="true"
      >
        Loading user creation form. Please wait while we prepare the interface.
      </div>
    </div>
  );
}

// Export the component name for better debugging
UserCreateLoading.displayName = 'UserCreateLoading';