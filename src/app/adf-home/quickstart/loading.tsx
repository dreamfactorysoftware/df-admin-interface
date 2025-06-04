/**
 * Loading state component for the quickstart page that provides visual feedback 
 * during page transitions and content loading, implementing Next.js loading UI 
 * patterns with Tailwind CSS animations and accessibility features.
 * 
 * This component follows Next.js app router loading.tsx conventions and provides
 * accessible loading feedback that matches the quickstart page layout structure.
 */

export default function QuickstartLoading() {
  return (
    <div 
      className="space-y-8 animate-pulse" 
      data-testid="quickstart-loading"
      role="status"
      aria-label="Loading quickstart content"
    >
      {/* Screen reader announcement */}
      <span className="sr-only">Loading quickstart instructions and platform examples</span>

      {/* Instructions Section Skeleton */}
      <section 
        className="space-y-4"
        aria-label="Loading quickstart instructions"
      >
        {/* Instructions heading skeleton */}
        <div 
          className="h-6 bg-gray-200 dark:bg-gray-700 rounded-md w-3/4 max-w-md animate-pulse"
          role="presentation"
          aria-hidden="true"
        />

        {/* Ordered list skeleton */}
        <div 
          className="space-y-3 ml-6"
          role="presentation"
          aria-hidden="true"
        >
          {/* Step 1 skeleton */}
          <div className="flex items-start gap-3">
            <div className="w-2 h-2 bg-gray-300 dark:bg-gray-600 rounded-full mt-2 flex-shrink-0" />
            <div className="flex-1 space-y-2">
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-full max-w-lg" />
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-2/3 max-w-md" />
            </div>
          </div>
          
          {/* Step 2 skeleton */}
          <div className="flex items-start gap-3">
            <div className="w-2 h-2 bg-gray-300 dark:bg-gray-600 rounded-full mt-2 flex-shrink-0" />
            <div className="flex-1 space-y-2">
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-full max-w-xl" />
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4 max-w-lg" />
            </div>
          </div>
          
          {/* Step 3 skeleton */}
          <div className="flex items-start gap-3">
            <div className="w-2 h-2 bg-gray-300 dark:bg-gray-600 rounded-full mt-2 flex-shrink-0" />
            <div className="flex-1 space-y-2">
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-5/6 max-w-lg" />
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2 max-w-sm" />
            </div>
          </div>
        </div>
      </section>

      {/* Divider Skeleton */}
      <div 
        className="h-px bg-gray-200 dark:bg-gray-700 w-full rounded-full"
        role="presentation"
        aria-hidden="true"
      />

      {/* Platforms Section Skeleton */}
      <section 
        className="space-y-6"
        aria-label="Loading platform examples"
      >
        {/* Section heading skeleton */}
        <div 
          className="h-7 bg-gray-200 dark:bg-gray-700 rounded-md w-1/2 max-w-sm"
          role="presentation"
          aria-hidden="true"
        />

        {/* Native Examples Article Skeleton */}
        <article className="space-y-4">
          {/* Article heading skeleton */}
          <div 
            className="h-6 bg-gray-200 dark:bg-gray-700 rounded-md w-1/3 max-w-xs"
            role="presentation"
            aria-hidden="true"
          />

          {/* Icon card links grid skeleton - responsive */}
          <div 
            className="grid grid-cols-1 xs:grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4"
            role="presentation"
            aria-hidden="true"
          >
            {Array.from({ length: 6 }).map((_, index) => (
              <div
                key={`native-skeleton-${index}`}
                className="group"
              >
                {/* Icon card link skeleton */}
                <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4 space-y-3 hover:shadow-md transition-shadow duration-200">
                  {/* Icon skeleton */}
                  <div className="w-12 h-12 bg-gray-200 dark:bg-gray-700 rounded-lg mx-auto" />
                  
                  {/* Title skeleton */}
                  <div className="space-y-2">
                    <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mx-auto" />
                    <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/2 mx-auto" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </article>

        {/* JavaScript Examples Article Skeleton */}
        <article className="space-y-4">
          {/* Article heading skeleton */}
          <div 
            className="h-6 bg-gray-200 dark:bg-gray-700 rounded-md w-2/5 max-w-sm"
            role="presentation"
            aria-hidden="true"
          />

          {/* Icon card links grid skeleton - responsive */}
          <div 
            className="grid grid-cols-1 xs:grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4"
            role="presentation"
            aria-hidden="true"
          >
            {Array.from({ length: 8 }).map((_, index) => (
              <div
                key={`js-skeleton-${index}`}
                className="group"
              >
                {/* Icon card link skeleton */}
                <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4 space-y-3 hover:shadow-md transition-shadow duration-200">
                  {/* Icon skeleton */}
                  <div className="w-12 h-12 bg-gray-200 dark:bg-gray-700 rounded-lg mx-auto" />
                  
                  {/* Title skeleton */}
                  <div className="space-y-2">
                    <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-4/5 mx-auto" />
                    <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-2/3 mx-auto" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </article>
      </section>

      {/* Additional loading indicator for enhanced accessibility */}
      <div 
        className="flex items-center justify-center mt-8"
        role="presentation"
        aria-hidden="true"
      >
        <div className="flex space-x-2">
          <div className="w-2 h-2 bg-primary-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
          <div className="w-2 h-2 bg-primary-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
          <div className="w-2 h-2 bg-primary-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
        </div>
      </div>

      {/* Live region for screen reader updates */}
      <div 
        aria-live="polite" 
        aria-atomic="true"
        className="sr-only"
      >
        Quickstart content is loading, please wait...
      </div>
    </div>
  );
}