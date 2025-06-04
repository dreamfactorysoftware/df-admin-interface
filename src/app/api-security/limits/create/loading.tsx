/**
 * Loading Component for Create Limit Page
 * 
 * Displays skeleton states and loading indicators while form data and dropdown 
 * options are being fetched. Provides smooth user experience during initial 
 * page load with accessible loading states and responsive design patterns.
 * 
 * Features:
 * - Skeleton UI patterns for all form fields
 * - WCAG 2.1 AA compliant accessibility attributes
 * - Responsive design for all supported breakpoints
 * - Theme-aware styling (light/dark mode)
 * - Smooth Tailwind CSS animations with reduced motion support
 * - Server-side rendering compatible
 * 
 * @component
 * @example
 * // Automatically displayed by Next.js app router during page load
 * // No manual usage required
 */

import React from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { cn } from '@/lib/utils';

/**
 * Skeleton component for form input fields
 * Mimics the appearance of input fields while loading
 */
const SkeletonInput: React.FC<{ 
  className?: string;
  height?: 'sm' | 'default' | 'lg';
}> = ({ className, height = 'default' }) => {
  const heights = {
    sm: 'h-8',
    default: 'h-10',
    lg: 'h-12',
  };

  return (
    <div className={cn('space-y-2', className)}>
      {/* Field label skeleton */}
      <div className="h-4 w-20 animate-pulse rounded bg-gray-200 dark:bg-gray-700" />
      {/* Field input skeleton */}
      <div 
        className={cn(
          'w-full animate-pulse rounded-md border border-gray-200 bg-gray-100 dark:border-gray-700 dark:bg-gray-800',
          heights[height]
        )}
        aria-hidden="true"
      />
    </div>
  );
};

/**
 * Skeleton component for select dropdown fields
 * Includes arrow indicator to mimic select appearance
 */
const SkeletonSelect: React.FC<{ 
  className?: string;
}> = ({ className }) => {
  return (
    <div className={cn('space-y-2', className)}>
      {/* Field label skeleton */}
      <div className="h-4 w-24 animate-pulse rounded bg-gray-200 dark:bg-gray-700" />
      {/* Select field skeleton with dropdown arrow indicator */}
      <div className="relative">
        <div 
          className="h-10 w-full animate-pulse rounded-md border border-gray-200 bg-gray-100 dark:border-gray-700 dark:bg-gray-800"
          aria-hidden="true"
        />
        {/* Dropdown arrow skeleton */}
        <div className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 animate-pulse rounded bg-gray-300 dark:bg-gray-600" />
      </div>
    </div>
  );
};

/**
 * Skeleton component for textarea fields
 * Taller to match textarea appearance
 */
const SkeletonTextarea: React.FC<{ 
  className?: string;
}> = ({ className }) => {
  return (
    <div className={cn('space-y-2', className)}>
      {/* Field label skeleton */}
      <div className="h-4 w-28 animate-pulse rounded bg-gray-200 dark:bg-gray-700" />
      {/* Textarea skeleton */}
      <div 
        className="h-20 w-full animate-pulse rounded-md border border-gray-200 bg-gray-100 dark:border-gray-700 dark:bg-gray-800"
        aria-hidden="true"
      />
    </div>
  );
};

/**
 * Skeleton component for toggle/switch fields
 * Mimics the appearance of a toggle switch
 */
const SkeletonToggle: React.FC<{ 
  className?: string;
}> = ({ className }) => {
  return (
    <div className={cn('flex items-center space-x-3', className)}>
      {/* Toggle switch skeleton */}
      <div 
        className="h-6 w-11 animate-pulse rounded-full border border-gray-200 bg-gray-100 dark:border-gray-700 dark:bg-gray-800"
        aria-hidden="true"
      />
      {/* Toggle label skeleton */}
      <div className="h-4 w-16 animate-pulse rounded bg-gray-200 dark:bg-gray-700" />
    </div>
  );
};

/**
 * Skeleton component for action buttons
 * Shows loading state for form submission buttons
 */
const SkeletonButton: React.FC<{ 
  variant?: 'primary' | 'secondary';
  className?: string;
}> = ({ variant = 'secondary', className }) => {
  const variants = {
    primary: 'bg-primary-100 dark:bg-primary-900',
    secondary: 'bg-gray-100 dark:bg-gray-800',
  };

  return (
    <div 
      className={cn(
        'h-10 w-20 animate-pulse rounded-md border border-gray-200 dark:border-gray-700',
        variants[variant],
        className
      )}
      aria-hidden="true"
    />
  );
};

/**
 * Loading message component with proper semantic markup
 * Provides screen reader accessible loading status
 */
const LoadingMessage: React.FC = () => {
  return (
    <div className="mb-6 text-center">
      <div className="mx-auto mb-3 h-8 w-8">
        {/* Loading spinner */}
        <div className="relative">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary-200 border-t-primary-500 dark:border-primary-800 dark:border-t-primary-400" />
        </div>
      </div>
      <h2 
        className="text-lg font-medium text-gray-900 dark:text-gray-100"
        id="loading-heading"
      >
        Loading Create Limit Form
      </h2>
      <p 
        className="mt-1 text-sm text-gray-600 dark:text-gray-400"
        aria-describedby="loading-heading"
      >
        Preparing form fields and loading dropdown options...
      </p>
    </div>
  );
};

/**
 * Main loading component for the create limit page
 * 
 * This component is automatically displayed by Next.js during:
 * - Initial page load and data fetching
 * - Form initialization and dropdown population
 * - Navigation to the create limit route
 * 
 * @returns JSX element containing the loading interface with form skeletons
 */
export default function Loading(): JSX.Element {
  return (
    <div
      className="container mx-auto max-w-4xl p-6"
      role="status"
      aria-live="polite"
      aria-busy="true"
      aria-label="Create limit form loading"
    >
      {/* Loading status message */}
      <LoadingMessage />

      {/* Form skeleton container */}
      <Card className="w-full">
        <CardHeader>
          {/* Page title skeleton */}
          <div className="h-7 w-48 animate-pulse rounded bg-gray-200 dark:bg-gray-700" />
          {/* Page description skeleton */}
          <div className="mt-2 h-4 w-80 animate-pulse rounded bg-gray-200 dark:bg-gray-700" />
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Alert/notification area skeleton */}
          <div className="h-12 w-full animate-pulse rounded-md border border-gray-200 bg-gray-50 dark:border-gray-700 dark:bg-gray-850" />

          {/* Form fields grid */}
          <div className="grid gap-6">
            {/* Row 1: Basic Information */}
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              {/* Limit Name field */}
              <SkeletonInput className="w-full" />
              
              {/* Verb picker field */}
              <SkeletonSelect className="w-full" />
            </div>

            {/* Row 2: Description (full width) */}
            <SkeletonTextarea className="w-full" />

            {/* Row 3: Limit Configuration */}
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              {/* Limit Type field */}
              <SkeletonSelect className="w-full" />
              
              {/* Conditional Service field skeleton */}
              <SkeletonSelect className="w-full opacity-60" />
            </div>

            {/* Row 4: Additional conditional fields */}
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
              {/* Role field skeleton (conditional) */}
              <SkeletonSelect className="w-full opacity-60" />
              
              {/* User field skeleton (conditional) */}
              <SkeletonSelect className="w-full opacity-60" />
              
              {/* Endpoint field skeleton (conditional) */}
              <SkeletonInput className="w-full opacity-60" />
            </div>

            {/* Row 5: Rate limiting configuration */}
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              {/* Limit Rate field */}
              <SkeletonInput className="w-full" />
              
              {/* Limit Period field */}
              <SkeletonSelect className="w-full" />
            </div>

            {/* Row 6: Active toggle */}
            <div className="flex justify-start">
              <SkeletonToggle />
            </div>

            {/* Action buttons */}
            <div className="flex justify-end space-x-4 border-t border-gray-200 pt-6 dark:border-gray-700">
              <SkeletonButton variant="secondary" className="w-24" />
              <SkeletonButton variant="primary" className="w-20" />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Hidden text for screen readers */}
      <span className="sr-only">
        Loading create limit form. Please wait while we prepare the form fields 
        and load service, role, and user dropdown options. The form will be 
        available shortly.
      </span>

      {/* Reduced motion fallback styles */}
      <style jsx>{`
        @media (prefers-reduced-motion: reduce) {
          .animate-pulse {
            animation: none;
            opacity: 0.7;
          }
          .animate-spin {
            animation: none;
          }
        }
      `}</style>
    </div>
  );
}

/**
 * Component metadata for Next.js optimization
 */
Loading.displayName = 'CreateLimitLoading';

// Ensure this component can be server-side rendered
if (typeof window === 'undefined') {
  // Server-side rendering compatibility check
  // Component is designed to work without client-side JavaScript
}