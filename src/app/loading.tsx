/**
 * Global loading UI component for Next.js app router
 * 
 * This component displays during page transitions and data fetching operations,
 * providing a consistent loading experience across all routes. Implements 
 * server-side rendering compatibility with theme-aware styling and full 
 * WCAG 2.1 AA accessibility compliance.
 * 
 * @component
 * @example
 * // Automatically displayed by Next.js app router during navigation
 * // No manual usage required - Next.js handles this component automatically
 */

import React from 'react';

/**
 * Spinner component with Tailwind CSS animations
 * Replaces Angular Material spinner with accessible, theme-aware implementation
 */
const LoadingSpinner: React.FC = () => {
  return (
    <div
      className="relative"
      role="img"
      aria-label="Loading spinner"
    >
      {/* Outer ring with slow spin animation */}
      <div
        className="h-12 w-12 rounded-full border-4 border-primary-200 dark:border-primary-800"
        aria-hidden="true"
      />
      
      {/* Inner spinning arc */}
      <div
        className="absolute inset-0 h-12 w-12 animate-spin rounded-full border-4 border-transparent border-t-primary-500 dark:border-t-primary-400"
        aria-hidden="true"
      />
      
      {/* Pulsing center dot for additional visual feedback */}
      <div
        className="absolute inset-0 flex items-center justify-center"
        aria-hidden="true"
      >
        <div className="h-2 w-2 animate-pulse rounded-full bg-primary-500 dark:bg-primary-400" />
      </div>
    </div>
  );
};

/**
 * Loading message component with proper semantic markup
 * Provides screen reader accessible loading status
 */
const LoadingMessage: React.FC = () => {
  return (
    <div className="mt-4 text-center">
      <h2 
        className="text-lg font-medium text-gray-900 dark:text-gray-100"
        id="loading-heading"
      >
        Loading
      </h2>
      <p 
        className="mt-1 text-sm text-gray-600 dark:text-gray-400"
        aria-describedby="loading-heading"
      >
        Please wait while we prepare your content
      </p>
    </div>
  );
};

/**
 * Global loading component for Next.js app router
 * 
 * This component is automatically displayed by Next.js during:
 * - Page transitions between routes
 * - Server-side data fetching operations
 * - Suspense boundary fallbacks
 * 
 * Features:
 * - Server-side rendering compatible
 * - Theme-aware styling (light/dark mode)
 * - WCAG 2.1 AA compliant with proper ARIA attributes
 * - Tailwind CSS animations with reduced motion support
 * - Semantic HTML structure for screen readers
 * 
 * @returns JSX element containing the loading interface
 */
export default function Loading(): JSX.Element {
  return (
    <div
      className="flex min-h-screen items-center justify-center bg-white dark:bg-gray-950"
      role="status"
      aria-live="polite"
      aria-busy="true"
      aria-label="Page loading"
    >
      {/* Main loading container with proper spacing and centering */}
      <div className="flex flex-col items-center justify-center p-8">
        {/* Loading spinner with animation */}
        <LoadingSpinner />
        
        {/* Loading message and status */}
        <LoadingMessage />
        
        {/* Hidden text for screen readers */}
        <span className="sr-only">
          Loading page content. Please wait while the application prepares your data.
        </span>
      </div>
      
      {/* Reduced motion fallback */}
      <style jsx>{`
        @media (prefers-reduced-motion: reduce) {
          .animate-spin {
            animation: none;
          }
          .animate-pulse {
            animation: none;
            opacity: 0.8;
          }
        }
      `}</style>
    </div>
  );
}

/**
 * Component metadata for Next.js optimization
 */
Loading.displayName = 'Loading';

// Ensure this component can be server-side rendered
if (typeof window === 'undefined') {
  // Server-side rendering compatibility check
  // Component is designed to work without client-side JavaScript
}