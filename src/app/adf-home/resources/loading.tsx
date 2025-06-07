/**
 * Loading state component for the resources page
 * 
 * This component provides skeleton loading animations for the resources page
 * that displays a list of external resources including documentation, tutorials,
 * community forums, and support links. The loading state matches the structure
 * of the actual resource list to provide visual consistency.
 * 
 * Features:
 * - Next.js app router loading.tsx conventions
 * - Tailwind CSS skeleton animations
 * - WCAG 2.1 AA accessibility compliance
 * - Responsive design matching actual resource layout
 * - Screen reader announcements for loading states
 */

export default function ResourcesLoading() {
  return (
    <section 
      className="space-y-6"
      data-testid="resources-loading"
      aria-label="Loading resources page"
    >
      {/* Loading announcement for screen readers */}
      <div 
        className="sr-only" 
        aria-live="polite" 
        aria-atomic="true"
      >
        Loading DreamFactory resources and documentation links
      </div>

      {/* Subheading skeleton */}
      <div className="mb-6">
        <div 
          className="h-6 bg-gray-200 dark:bg-gray-700 rounded-md animate-pulse w-full max-w-2xl"
          aria-hidden="true"
        />
      </div>

      {/* Resource links list skeleton */}
      <div 
        className="space-y-4"
        role="list"
        aria-label="Loading resource links"
      >
        {/* Generate 8 skeleton items to match resourcesPageResources array */}
        {Array.from({ length: 8 }, (_, index) => (
          <div
            key={`resource-skeleton-${index}`}
            className="flex items-center space-x-3 p-2 rounded-md"
            role="listitem"
            aria-hidden="true"
          >
            {/* Icon skeleton */}
            <div className="flex-shrink-0">
              <div className="h-5 w-5 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
            </div>
            
            {/* Text skeleton with varying widths for natural appearance */}
            <div className="flex-1 min-w-0">
              <div 
                className={`h-5 bg-gray-200 dark:bg-gray-700 rounded animate-pulse ${
                  index === 0 ? 'w-32' : // Written Tutorials
                  index === 1 ? 'w-28' : // Video Tutorials  
                  index === 2 ? 'w-36' : // Full Documentation
                  index === 3 ? 'w-32' : // Community Forum
                  index === 4 ? 'w-40' : // Bug & Feature Requests
                  index === 5 ? 'w-28' : // DreamFactory Twitter
                  index === 6 ? 'w-32' : // DreamFactory Blog
                  'w-28'                  // Contact Support
                }`}
              />
            </div>
          </div>
        ))}
      </div>

      {/* Accessible loading indicator */}
      <div 
        className="flex items-center justify-center mt-8 text-sm text-gray-500 dark:text-gray-400"
        aria-live="polite"
      >
        <div className="flex items-center space-x-2">
          <div className="h-4 w-4 border-2 border-primary-200 border-t-primary-600 rounded-full animate-spin" />
          <span>Loading resources...</span>
        </div>
      </div>

      {/* Invisible skip link for keyboard navigation */}
      <a 
        href="#main-content" 
        className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 bg-primary-600 text-white px-4 py-2 rounded-md z-50 focus:outline-none focus:ring-2 focus:ring-primary-600 focus:ring-offset-2"
        aria-label="Skip to main content when loading completes"
      >
        Skip to main content
      </a>
    </section>
  );
}