/**
 * Next.js Loading Component for Edit Limit Dynamic Route
 * 
 * Provides skeleton loading states while the page component and limit data are being fetched.
 * Implements consistent loading patterns with Tailwind CSS animations and accessibility features
 * for screen readers during SSR hydration and data loading operations.
 * 
 * Features:
 * - Next.js 15.1+ app router loading UI patterns for suspense boundaries
 * - Tailwind CSS 4.1+ skeleton animations matching limit-form component structure
 * - WCAG 2.1 AA compliance with screen reader accessibility
 * - Responsive design across all supported screen sizes
 * - Consistent visual design matching the edit form layout
 * 
 * @version 1.0.0
 * @compliance WCAG 2.1 AA
 * @framework Next.js 15.1+, React 19, Tailwind CSS 4.1+
 */

import React from 'react';

/**
 * Skeleton loading component that mimics the structure of a form field
 * with label and input areas for consistent visual feedback.
 */
function SkeletonField({ 
  className = "dynamic-width",
  height = "h-14",
  hasLabel = true 
}: {
  className?: string;
  height?: string;
  hasLabel?: boolean;
}) {
  return (
    <div className={`${className} space-y-2`}>
      {hasLabel && (
        <div className="h-4 w-24 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
      )}
      <div className={`${height} w-full bg-gray-200 dark:bg-gray-700 rounded-md animate-pulse`} />
    </div>
  );
}

/**
 * Skeleton loading component for dropdown/select fields
 * with a specific visual pattern for select inputs.
 */
function SkeletonSelect({ 
  className = "dynamic-width",
  hasLabel = true 
}: {
  className?: string;
  hasLabel?: boolean;
}) {
  return (
    <div className={`${className} space-y-2`}>
      {hasLabel && (
        <div className="h-4 w-32 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
      )}
      <div className="h-14 w-full bg-gray-200 dark:bg-gray-700 rounded-md animate-pulse relative">
        {/* Dropdown arrow indicator */}
        <div className="absolute right-3 top-1/2 transform -translate-y-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-400 dark:border-t-gray-500" />
      </div>
    </div>
  );
}

/**
 * Skeleton loading component for textarea fields
 * with appropriate height for multi-line content.
 */
function SkeletonTextarea({ 
  className = "full-width",
  hasLabel = true 
}: {
  className?: string;
  hasLabel?: boolean;
}) {
  return (
    <div className={`${className} space-y-2`}>
      {hasLabel && (
        <div className="h-4 w-28 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
      )}
      <div className="h-20 w-full bg-gray-200 dark:bg-gray-700 rounded-md animate-pulse" />
    </div>
  );
}

/**
 * Skeleton loading component for toggle switch controls
 * with a distinctive switch-like appearance.
 */
function SkeletonToggle({ 
  className = "full-width",
  hasLabel = true 
}: {
  className?: string;
  hasLabel?: boolean;
}) {
  return (
    <div className={`${className} flex items-center space-x-3`}>
      <div className="h-6 w-10 bg-gray-200 dark:bg-gray-700 rounded-full animate-pulse relative">
        {/* Toggle thumb */}
        <div className="absolute left-1 top-1 h-4 w-4 bg-gray-300 dark:bg-gray-600 rounded-full" />
      </div>
      {hasLabel && (
        <div className="h-4 w-16 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
      )}
    </div>
  );
}

/**
 * Skeleton loading component for action buttons
 * representing the form submission controls.
 */
function SkeletonActionButtons() {
  return (
    <div className="full-width flex justify-end space-x-3 pt-4">
      <div className="h-10 w-20 bg-gray-200 dark:bg-gray-700 rounded-md animate-pulse" />
      <div className="h-10 w-16 bg-blue-200 dark:bg-blue-800/30 rounded-md animate-pulse" />
    </div>
  );
}

/**
 * Main loading component for the edit limits page.
 * 
 * This component provides a comprehensive skeleton loading state that matches
 * the structure of the limit form, including all form fields, conditional fields,
 * and action buttons. It implements accessibility features and responsive design
 * patterns consistent with the application's design system.
 * 
 * @returns {JSX.Element} The loading UI component
 */
export default function Loading(): JSX.Element {
  return (
    <div 
      className="max-w-4xl mx-auto p-6 space-y-6"
      role="status"
      aria-live="polite"
      aria-label="Loading limit details"
    >
      {/* Screen reader announcement */}
      <div className="sr-only">
        Loading limit details, please wait...
      </div>

      {/* Alert area skeleton */}
      <div className="mb-6">
        <div className="h-12 w-full bg-gray-100 dark:bg-gray-800 rounded-lg animate-pulse" />
      </div>

      {/* Form container with consistent styling */}
      <div className="card-base p-6 space-y-6 theme-transition">
        {/* Form header skeleton */}
        <div className="space-y-2 mb-6">
          <div className="h-6 w-32 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
          <div className="h-4 w-64 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
        </div>

        {/* Form fields grid container */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Primary form fields */}
          
          {/* Limit Name field */}
          <SkeletonField className="dynamic-width" />
          
          {/* Verb picker field */}
          <SkeletonSelect className="dynamic-width" />
          
          {/* Description field - full width textarea */}
          <div className="md:col-span-2">
            <SkeletonTextarea className="w-full" />
          </div>
          
          {/* Limit Type field */}
          <SkeletonSelect className="dynamic-width" />
          
          {/* Conditionally shown Service field */}
          <SkeletonSelect className="dynamic-width" />
          
          {/* Conditionally shown Role field */}
          <SkeletonSelect className="dynamic-width" />
          
          {/* Conditionally shown User field */}
          <SkeletonSelect className="dynamic-width" />
          
          {/* Conditionally shown Endpoint field */}
          <SkeletonField className="dynamic-width" />
          
          {/* Limit Rate field */}
          <SkeletonField className="dynamic-width" height="h-14" />
          
          {/* Limit Period field */}
          <SkeletonSelect className="dynamic-width" />
          
          {/* Active toggle - full width */}
          <div className="md:col-span-2">
            <SkeletonToggle className="w-full" />
          </div>
        </div>

        {/* Action buttons section */}
        <div className="border-t pt-6 mt-8">
          <SkeletonActionButtons />
        </div>
      </div>

      {/* Additional loading indicators for better UX */}
      <div className="flex items-center justify-center space-x-2 text-sm text-gray-500 dark:text-gray-400">
        <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
        <span>Loading limit configuration...</span>
      </div>
    </div>
  );
}

/**
 * CSS Classes Used:
 * 
 * Layout & Responsive:
 * - max-w-4xl: Maximum container width
 * - mx-auto: Horizontal centering
 * - p-6: Padding on all sides
 * - space-y-6: Vertical spacing between children
 * - grid grid-cols-1 md:grid-cols-2: Responsive grid layout
 * - gap-6: Grid gap spacing
 * - md:col-span-2: Full width on medium screens and up
 * 
 * Component Styling (from globals.css):
 * - card-base: Consistent card appearance with shadows and borders
 * - theme-transition: Smooth transitions for theme changes
 * - dynamic-width: Component-specific width handling
 * - full-width: Full container width
 * 
 * Skeleton Animation:
 * - animate-pulse: Built-in Tailwind pulse animation
 * - animate-spin: Spinning animation for loading spinner
 * 
 * Accessibility:
 * - sr-only: Screen reader only content
 * - role="status": ARIA role for loading states
 * - aria-live="polite": Announces changes to screen readers
 * - aria-label: Accessible label for the loading state
 * 
 * Color System (from globals.css):
 * - bg-gray-200 dark:bg-gray-700: Skeleton background colors
 * - bg-gray-100 dark:bg-gray-800: Alert area background
 * - bg-blue-200 dark:bg-blue-800/30: Primary button skeleton
 * - text-gray-500 dark:text-gray-400: Secondary text colors
 * 
 * Form Field Heights:
 * - h-4: Label heights
 * - h-6: Toggle switch height
 * - h-10: Button heights  
 * - h-12: Alert area height
 * - h-14: Standard input field height
 * - h-20: Textarea height
 * 
 * Animation Performance:
 * All animations respect prefers-reduced-motion settings from globals.css
 * and provide smooth fallbacks for accessibility compliance.
 */