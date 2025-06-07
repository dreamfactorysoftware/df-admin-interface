/**
 * Global loading UI component for Next.js app router
 * 
 * Displays during page transitions and data fetching operations across all routes.
 * Implements spinner component with proper accessibility attributes and theme-aware
 * styling using Tailwind CSS, ensuring consistent loading experience.
 * 
 * Features:
 * - Server-side rendering compatibility
 * - WCAG 2.1 AA compliance with proper ARIA attributes
 * - Theme-aware styling with Tailwind CSS 4.1+
 * - Responsive design across all screen sizes
 * - Performance optimized animations
 */

export default function Loading() {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-white/80 backdrop-blur-sm dark:bg-gray-900/80">
      <div className="flex flex-col items-center gap-6">
        {/* Loading Spinner */}
        <div
          className="relative"
          role="status"
          aria-label="Loading content"
          aria-live="polite"
        >
          {/* Outer Ring */}
          <div className="h-16 w-16 rounded-full border-4 border-gray-200 dark:border-gray-700" />
          
          {/* Spinning Inner Ring */}
          <div className="absolute inset-0 h-16 w-16 animate-spin rounded-full border-4 border-transparent border-t-primary-500 border-r-primary-500" />
          
          {/* Center Dot */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="h-2 w-2 rounded-full bg-primary-500 animate-pulse" />
          </div>
        </div>

        {/* Loading Text */}
        <div className="text-center">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
            Loading
          </h2>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Please wait while we prepare your content...
          </p>
        </div>

        {/* Progress Indicator */}
        <div className="w-48 bg-gray-200 rounded-full h-1 dark:bg-gray-700">
          <div className="bg-primary-500 h-1 rounded-full animate-pulse w-1/3"></div>
        </div>
      </div>

      {/* Screen Reader Only Content */}
      <span className="sr-only">
        Loading application content. Please wait a moment while the page loads.
      </span>
    </div>
  );
}