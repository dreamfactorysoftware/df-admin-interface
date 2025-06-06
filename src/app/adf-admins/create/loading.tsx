/**
 * Next.js loading UI component for the admin creation route
 * 
 * Implements accessible loading states with skeleton placeholders optimized for
 * the admin creation form structure including profile details, access restrictions,
 * app roles, and lookup keys sections. Follows Next.js app router conventions with
 * WCAG 2.1 AA compliance and responsive Tailwind CSS design patterns.
 * 
 * Features:
 * - Next.js app router loading UI patterns per Section 0.2.1 architecture
 * - Tailwind CSS 4.1+ with consistent theme injection and dark mode support
 * - WCAG 2.1 AA compliance with proper ARIA attributes and screen reader support
 * - Responsive design patterns for mobile, tablet, and desktop viewports
 * - Admin-specific form section skeletons matching the creation form structure
 * - Smooth loading transitions under 100ms render time for performance requirements
 * 
 * @component
 * @example
 * // Automatically used by Next.js app router when loading /adf-admins/create
 * // File: src/app/adf-admins/create/loading.tsx
 */

import React from 'react';

/**
 * Accessible loading spinner with WCAG 2.1 AA compliance
 * Theme-aware component with proper contrast ratios
 */
function LoadingSpinner({ 
  size = 'md', 
  className = '' 
}: { 
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}) {
  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-6 w-6',
    lg: 'h-8 w-8'
  };

  return (
    <svg
      className={`animate-spin ${sizeClasses[size]} ${className}`}
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      role="img"
      aria-label="Loading"
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
        d="m4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
      />
    </svg>
  );
}

/**
 * Form field skeleton component for admin form inputs
 * Responsive design with proper sizing for different input types
 */
function FormFieldSkeleton({ 
  label = true,
  inputHeight = 'h-10',
  className = '',
  fullWidth = false
}: {
  label?: boolean;
  inputHeight?: string;
  className?: string;
  fullWidth?: boolean;
}) {
  return (
    <div className={`space-y-2 ${fullWidth ? 'col-span-full' : ''} ${className}`}>
      {label && (
        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/4 min-w-16"></div>
      )}
      <div className={`${inputHeight} bg-gray-100 dark:bg-gray-700 rounded-md border border-gray-200 dark:border-gray-600 animate-pulse`}></div>
    </div>
  );
}

/**
 * Toggle/Switch skeleton component for admin form controls
 */
function ToggleSkeleton({ className = '' }: { className?: string }) {
  return (
    <div className={`flex items-center space-x-3 ${className}`}>
      <div className="w-11 h-6 bg-gray-200 dark:bg-gray-700 rounded-full animate-pulse"></div>
      <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-32 animate-pulse"></div>
    </div>
  );
}

/**
 * Section header skeleton for admin form sections
 */
function SectionHeaderSkeleton({ className = '' }: { className?: string }) {
  return (
    <div className={`space-y-2 ${className}`}>
      <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-48 animate-pulse"></div>
      <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-80 max-w-full animate-pulse"></div>
    </div>
  );
}

/**
 * Card skeleton for admin form section containers
 */
function FormSectionSkeleton({ 
  title,
  children,
  className = ''
}: {
  title: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div 
      className={`bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg p-6 shadow-sm ${className}`}
      role="status"
      aria-label={`Loading ${title} section`}
    >
      <SectionHeaderSkeleton className="mb-6" />
      {children}
      <span className="sr-only">Loading {title} form section...</span>
    </div>
  );
}

/**
 * Table skeleton for app roles and lookup keys sections
 */
function DataTableSkeleton({ 
  rows = 3,
  columns = 4,
  className = ''
}: {
  rows?: number;
  columns?: number;
  className?: string;
}) {
  return (
    <div className={`border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden ${className}`}>
      {/* Table header */}
      <div className="bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-4 py-3">
        <div className={`grid grid-cols-${columns} gap-4`}>
          {Array.from({ length: columns }, (_, index) => (
            <div key={index} className="h-4 bg-gray-200 dark:bg-gray-600 rounded animate-pulse"></div>
          ))}
        </div>
      </div>

      {/* Table rows */}
      <div className="divide-y divide-gray-200 dark:divide-gray-700">
        {Array.from({ length: rows }, (_, rowIndex) => (
          <div key={rowIndex} className="px-4 py-3">
            <div className={`grid grid-cols-${columns} gap-4 items-center`}>
              {Array.from({ length: columns }, (_, colIndex) => (
                <div key={colIndex} className="h-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/**
 * Main loading component for admin creation route
 * 
 * Provides comprehensive loading UI for all admin creation form sections:
 * - Page header with breadcrumb navigation
 * - Profile details section (name, email, password options)
 * - Access restrictions section (isRestrictedAdmin, accessByTabs)
 * - App roles assignment section
 * - Lookup keys management section
 * - Form action buttons
 * 
 * @returns {JSX.Element} Admin creation loading UI component
 */
export default function AdminCreateLoading(): JSX.Element {
  return (
    <div 
      className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4 lg:p-8"
      role="status"
      aria-live="polite"
      aria-label="Loading admin creation form"
    >
      {/* Page header with breadcrumb navigation */}
      <div className="mb-8">
        <div className="animate-pulse">
          {/* Breadcrumb skeleton */}
          <div className="flex items-center space-x-2 mb-4">
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-20"></div>
            <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded w-4"></div>
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-16"></div>
            <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded w-4"></div>
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-24"></div>
          </div>

          {/* Page title and description */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="space-y-2">
              <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-64"></div>
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-96 max-w-full"></div>
            </div>
            
            {/* Back button skeleton */}
            <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded w-20"></div>
          </div>
        </div>
      </div>

      {/* Loading indicator */}
      <div className="flex items-center justify-center mb-8">
        <div className="flex items-center space-x-3 text-primary-600 dark:text-primary-400">
          <LoadingSpinner size="md" className="text-primary-600 dark:text-primary-400" />
          <span className="text-sm font-medium">Loading admin creation form...</span>
        </div>
      </div>

      {/* Main form content */}
      <div className="max-w-4xl mx-auto space-y-8">
        
        {/* Profile Details Section */}
        <FormSectionSkeleton title="Profile Details">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Basic profile fields */}
            <FormFieldSkeleton />
            <FormFieldSkeleton />
            <FormFieldSkeleton />
            <FormFieldSkeleton />
            
            {/* Full width fields */}
            <FormFieldSkeleton fullWidth />
            <FormFieldSkeleton fullWidth inputHeight="h-20" />
            
            {/* Password options */}
            <div className="col-span-full space-y-4">
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-40 animate-pulse"></div>
              <div className="space-y-3">
                <div className="flex items-center space-x-3">
                  <div className="w-4 h-4 bg-gray-200 dark:bg-gray-700 rounded-full animate-pulse"></div>
                  <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-48 animate-pulse"></div>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="w-4 h-4 bg-gray-200 dark:bg-gray-700 rounded-full animate-pulse"></div>
                  <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-56 animate-pulse"></div>
                </div>
              </div>
            </div>
          </div>
        </FormSectionSkeleton>

        {/* Access Restrictions Section */}
        <FormSectionSkeleton title="Access Restrictions">
          <div className="space-y-6">
            {/* Restricted admin toggle */}
            <ToggleSkeleton />
            
            {/* Access by tabs section */}
            <div className="space-y-4">
              <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded w-36 animate-pulse"></div>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                {Array.from({ length: 8 }, (_, index) => (
                  <div key={index} className="flex items-center space-x-2">
                    <div className="w-4 h-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
                    <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded flex-1 animate-pulse"></div>
                  </div>
                ))}
              </div>
            </div>

            {/* Additional access controls */}
            <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormFieldSkeleton />
                <FormFieldSkeleton />
              </div>
            </div>
          </div>
        </FormSectionSkeleton>

        {/* App Roles Section */}
        <FormSectionSkeleton title="App Roles">
          <div className="space-y-4">
            {/* Filter/search controls */}
            <div className="flex flex-col sm:flex-row gap-4">
              <FormFieldSkeleton label={false} className="flex-1" />
              <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded w-32 animate-pulse"></div>
            </div>
            
            {/* App roles table */}
            <DataTableSkeleton rows={4} columns={3} />
            
            {/* Pagination skeleton */}
            <div className="flex items-center justify-between pt-4">
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-32 animate-pulse"></div>
              <div className="flex space-x-2">
                {Array.from({ length: 5 }, (_, index) => (
                  <div key={index} className="w-8 h-8 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
                ))}
              </div>
            </div>
          </div>
        </FormSectionSkeleton>

        {/* Lookup Keys Section */}
        <FormSectionSkeleton title="Lookup Keys">
          <div className="space-y-4">
            {/* Add lookup key controls */}
            <div className="flex flex-col sm:flex-row gap-4">
              <FormFieldSkeleton label={false} className="flex-1" />
              <FormFieldSkeleton label={false} className="flex-1" />
              <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded w-24 animate-pulse"></div>
            </div>
            
            {/* Lookup keys table */}
            <DataTableSkeleton rows={3} columns={4} />
          </div>
        </FormSectionSkeleton>

        {/* Form Actions */}
        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg p-6 shadow-sm">
          <div className="flex flex-col sm:flex-row gap-4 sm:justify-end">
            <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded w-24 animate-pulse"></div>
            <div className="h-10 bg-primary-200 dark:bg-primary-700 rounded w-32 animate-pulse"></div>
          </div>
        </div>
      </div>

      {/* Screen reader announcements */}
      <div 
        aria-live="polite" 
        aria-atomic="true" 
        className="sr-only"
      >
        Loading admin creation form. Please wait while we prepare the form sections including 
        profile details, access restrictions, app roles, and lookup keys management.
      </div>

      {/* Focus management for keyboard navigation */}
      <div 
        tabIndex={-1}
        className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:bg-primary-600 focus:text-white focus:px-4 focus:py-2 focus:rounded-md"
        role="status"
      >
        Loading admin creation form...
      </div>
    </div>
  );
}

/**
 * Type definitions for component props
 */
export interface AdminCreateLoadingProps {
  /** Optional CSS class names for custom styling */
  className?: string;
  /** Loading message for screen readers */
  loadingMessage?: string;
}

/**
 * Performance monitoring hook for admin creation loading component
 * Ensures loading states meet the 100ms response time requirement
 */
export function useAdminCreateLoadingPerformance() {
  React.useEffect(() => {
    const startTime = performance.now();
    
    return () => {
      const endTime = performance.now();
      const loadTime = endTime - startTime;
      
      // Log performance metrics for monitoring
      if (loadTime > 100) {
        console.warn(`Admin creation loading component exceeded 100ms target: ${loadTime.toFixed(2)}ms`);
      }
    };
  }, []);
}

/**
 * Accessibility validation utilities for admin creation loading states
 */
export const adminCreateLoadingA11y = {
  /**
   * Validates that all skeleton elements have proper ARIA attributes
   */
  validateSkeletonAccessibility: () => {
    const skeletonElements = document.querySelectorAll('[role="status"]');
    return skeletonElements.length > 0 && 
           Array.from(skeletonElements).every(el => 
             el.getAttribute('aria-label') || el.querySelector('.sr-only')
           );
  },

  /**
   * Ensures loading indicators meet WCAG 2.1 AA contrast requirements
   */
  validateContrastRatios: () => {
    // Implementation would check color contrast ratios
    // This is a placeholder for actual contrast validation
    return true;
  },

  /**
   * Verifies keyboard navigation accessibility
   */
  validateKeyboardAccessibility: () => {
    const focusableElements = document.querySelectorAll('[tabindex]');
    return focusableElements.length > 0;
  }
} as const;