/**
 * @fileoverview Loading component for the edit limit page ([id]/loading.tsx)
 * 
 * Displays skeleton states and loading indicators while limit data and form 
 * dependencies are being fetched. Provides smooth user experience during data 
 * loading with accessible loading states, form field skeletons, and responsive 
 * design patterns optimized for the edit workflow.
 * 
 * This component replaces Angular Material progress indicators with Tailwind CSS
 * skeleton patterns and ensures WCAG 2.1 AA compliance through proper ARIA 
 * attributes and screen reader announcements.
 * 
 * @version 1.0.0
 * @since React 19.0.0 / Next.js 15.1.0
 */

import React from 'react';

/**
 * Skeleton component for form field loading states
 * Creates accessible skeleton patterns with proper ARIA attributes
 */
const FieldSkeleton: React.FC<{
  lines?: number;
  height?: 'sm' | 'md' | 'lg';
  className?: string;
}> = ({ lines = 1, height = 'md', className = '' }) => {
  const heightClasses = {
    sm: 'h-8',
    md: 'h-10',
    lg: 'h-12'
  };

  return (
    <div className={`space-y-2 ${className}`}>
      <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse w-1/3" />
      {Array.from({ length: lines }).map((_, index) => (
        <div 
          key={index}
          className={`bg-gray-200 dark:bg-gray-700 rounded animate-pulse ${heightClasses[height]}`}
          aria-hidden="true"
        />
      ))}
    </div>
  );
};

/**
 * Skeleton component for select dropdown loading states
 * Includes loading indicator for dropdown options
 */
const SelectSkeleton: React.FC<{
  className?: string;
}> = ({ className = '' }) => (
  <div className={`space-y-2 ${className}`}>
    <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse w-1/4" />
    <div className="relative">
      <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded border animate-pulse" />
      <div className="absolute inset-y-0 right-0 flex items-center pr-3">
        <div className="h-4 w-4 bg-gray-300 dark:bg-gray-600 rounded animate-pulse" />
      </div>
    </div>
  </div>
);

/**
 * Skeleton component for textarea loading states
 * Provides multi-line skeleton for description fields
 */
const TextareaSkeleton: React.FC<{
  className?: string;
}> = ({ className = '' }) => (
  <div className={`space-y-2 ${className}`}>
    <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse w-1/3" />
    <div className="h-24 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
  </div>
);

/**
 * Skeleton component for switch/toggle loading states
 * Displays loading state for boolean configuration options
 */
const SwitchSkeleton: React.FC<{
  className?: string;
}> = ({ className = '' }) => (
  <div className={`flex items-center justify-between ${className}`}>
    <div className="space-y-1">
      <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse w-32" />
      <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded animate-pulse w-48" />
    </div>
    <div className="h-6 w-11 bg-gray-200 dark:bg-gray-700 rounded-full animate-pulse" />
  </div>
);

/**
 * Skeleton component for button loading states
 * Provides loading states for form action buttons
 */
const ButtonSkeleton: React.FC<{
  variant?: 'primary' | 'secondary';
  className?: string;
}> = ({ variant = 'primary', className = '' }) => {
  const variantClasses = variant === 'primary' 
    ? 'bg-primary-200 dark:bg-primary-700' 
    : 'bg-gray-200 dark:bg-gray-700';

  return (
    <div 
      className={`h-10 w-24 ${variantClasses} rounded animate-pulse ${className}`}
      aria-hidden="true"
    />
  );
};

/**
 * Skeleton component for card/section containers
 * Creates loading state for form sections
 */
const CardSkeleton: React.FC<{
  children: React.ReactNode;
  className?: string;
}> = ({ children, className = '' }) => (
  <div className={`bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6 ${className}`}>
    {children}
  </div>
);

/**
 * Loading spinner component for general loading states
 * Provides accessible loading indicator with proper ARIA attributes
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
      className={`${sizeClasses[size]} animate-spin rounded-full border-2 border-gray-300 border-t-primary-600 dark:border-gray-600 dark:border-t-primary-400 ${className}`}
      role="status"
      aria-label="Loading"
    >
      <span className="sr-only">Loading...</span>
    </div>
  );
};

/**
 * Main loading component for the edit limit page
 * 
 * Displays comprehensive skeleton states matching the edit form structure:
 * - Page header with breadcrumb and title skeletons
 * - General Information section with basic limit details
 * - Conditions section with rule configuration fields
 * - Actions section with response configuration
 * - Form action buttons (Save, Cancel, Delete)
 * 
 * Features:
 * - WCAG 2.1 AA compliance with proper ARIA attributes
 * - Responsive design supporting all breakpoints (xs to 3xl)
 * - Dark mode support with proper contrast ratios
 * - Smooth loading transitions with Tailwind CSS animations
 * - Screen reader announcements for loading states
 * - Accessible loading indicators and skeleton patterns
 * 
 * @returns React component representing the loading state
 */
export default function EditLimitLoading(): React.JSX.Element {
  return (
    <div 
      className="container mx-auto px-4 sm:px-6 lg:px-8 py-6 max-w-4xl"
      role="main"
      aria-live="polite"
      aria-label="Loading edit limit form"
    >
      {/* Screen reader announcement */}
      <div className="sr-only" aria-live="assertive">
        Loading edit limit form. Please wait while limit data and form options are being fetched.
      </div>

      {/* Page header skeleton */}
      <div className="mb-8 space-y-4">
        {/* Breadcrumb skeleton */}
        <div className="flex items-center space-x-2 text-sm">
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse w-24" />
          <div className="h-4 w-1 bg-gray-300 dark:bg-gray-600 rounded animate-pulse" />
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse w-20" />
          <div className="h-4 w-1 bg-gray-300 dark:bg-gray-600 rounded animate-pulse" />
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse w-16" />
        </div>

        {/* Page title skeleton */}
        <div className="space-y-2">
          <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded animate-pulse w-48" />
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse w-64" />
        </div>
      </div>

      {/* Main form content */}
      <div className="space-y-6">
        {/* General Information Section */}
        <CardSkeleton>
          <div className="space-y-6">
            {/* Section title */}
            <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded animate-pulse w-40" />
            
            {/* Form fields grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Limit name */}
              <FieldSkeleton className="md:col-span-1" />
              
              {/* Service selection */}
              <SelectSkeleton className="md:col-span-1" />
              
              {/* User/Role selection */}
              <SelectSkeleton className="md:col-span-1" />
              
              {/* Limit type */}
              <SelectSkeleton className="md:col-span-1" />
              
              {/* Description */}
              <TextareaSkeleton className="md:col-span-2" />
            </div>
          </div>
        </CardSkeleton>

        {/* Conditions Section */}
        <CardSkeleton>
          <div className="space-y-6">
            {/* Section title */}
            <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded animate-pulse w-32" />
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {/* Rate limit value */}
              <FieldSkeleton />
              
              {/* Time period */}
              <SelectSkeleton />
              
              {/* Request method */}
              <SelectSkeleton />
              
              {/* Endpoint pattern */}
              <FieldSkeleton className="md:col-span-2 lg:col-span-3" />
            </div>

            {/* Advanced settings */}
            <div className="space-y-4 pt-4 border-t border-gray-200 dark:border-gray-700">
              <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded animate-pulse w-36" />
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <SwitchSkeleton />
                <SwitchSkeleton />
              </div>
            </div>
          </div>
        </CardSkeleton>

        {/* Actions Section */}
        <CardSkeleton>
          <div className="space-y-6">
            {/* Section title */}
            <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded animate-pulse w-24" />
            
            <div className="space-y-6">
              {/* Response settings */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <SelectSkeleton />
                <FieldSkeleton />
              </div>
              
              {/* Custom response message */}
              <TextareaSkeleton />
              
              {/* Action toggles */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <SwitchSkeleton />
                <SwitchSkeleton />
              </div>
            </div>
          </div>
        </CardSkeleton>

        {/* Form Actions */}
        <div className="flex flex-col sm:flex-row justify-between items-center gap-4 pt-6">
          {/* Left side - Delete button */}
          <div className="flex justify-start">
            <ButtonSkeleton variant="secondary" className="bg-red-200 dark:bg-red-800" />
          </div>

          {/* Right side - Save and Cancel buttons */}
          <div className="flex flex-col sm:flex-row gap-3">
            <ButtonSkeleton variant="secondary" />
            <ButtonSkeleton variant="primary" className="w-32" />
          </div>
        </div>
      </div>

      {/* Loading status indicator */}
      <div className="fixed bottom-4 right-4 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 p-4">
        <div className="flex items-center space-x-3">
          <LoadingSpinner size="sm" />
          <span className="text-sm text-gray-600 dark:text-gray-400">
            Loading limit data...
          </span>
        </div>
      </div>
    </div>
  );
}

/**
 * Component metadata for Next.js app router
 */
EditLimitLoading.displayName = 'EditLimitLoading';

/**
 * Type exports for component props and configuration
 */
export type {
  React.JSX.Element as EditLimitLoadingElement
};

/**
 * Default export following Next.js loading component conventions
 * This component will be automatically used by Next.js app router
 * when the edit limit page ([id]/page.tsx) is loading
 */