/**
 * Loading state component for the quickstart page
 * 
 * Provides visual feedback during page transitions and content loading, implementing 
 * Next.js loading UI patterns with Tailwind CSS animations and accessibility features.
 * 
 * Features:
 * - Next.js loading.tsx conventions following app router patterns
 * - Tailwind CSS loading animations and skeleton UI patterns
 * - WCAG 2.1 AA compliant accessibility features for screen readers
 * - Responsive loading skeletons matching quickstart page layout
 * - Test integration with data-testid attributes for Vitest
 * 
 * @requires Tailwind CSS 4.1+ with animate-pulse utility
 * @requires Next.js 15.1+ app router
 */

export default function QuickstartLoading() {
  return (
    <div 
      className="space-y-8 animate-fade-in"
      data-testid="quickstart-loading"
      role="status"
      aria-live="polite"
      aria-label="Loading quickstart instructions"
    >
      {/* Screen reader announcement */}
      <span className="sr-only">
        Loading DreamFactory quickstart guide. Please wait while we prepare your content.
      </span>

      {/* Instructions Section Loading */}
      <section 
        className="space-y-6"
        data-testid="instructions-section-loading"
        aria-labelledby="instructions-loading-heading"
      >
        {/* Instructions heading skeleton */}
        <div 
          id="instructions-loading-heading"
          className="h-6 bg-gray-200 dark:bg-gray-700 rounded-md w-full max-w-2xl animate-pulse"
          aria-hidden="true"
        />

        {/* Steps list skeleton */}
        <div 
          className="space-y-4"
          role="list"
          aria-label="Loading quickstart steps"
        >
          {Array.from({ length: 3 }).map((_, index) => (
            <div 
              key={`step-${index}`}
              className="flex items-start space-x-3"
              role="listitem"
              aria-hidden="true"
            >
              {/* Step number placeholder */}
              <div className="flex-shrink-0 w-6 h-6 bg-gray-200 dark:bg-gray-700 rounded-full animate-pulse mt-0.5" />
              
              {/* Step content placeholder */}
              <div className="flex-1 space-y-2">
                <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded w-full animate-pulse" />
                {index === 1 && (
                  <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded w-4/5 animate-pulse" />
                )}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Divider skeleton */}
      <div 
        className="h-px bg-gray-200 dark:bg-gray-700 animate-pulse"
        data-testid="divider-loading"
        aria-hidden="true"
      />

      {/* Platforms Section Loading */}
      <section 
        className="space-y-8"
        data-testid="platforms-section-loading"
        aria-labelledby="platforms-loading-heading"
      >
        {/* Main platforms heading skeleton */}
        <div 
          id="platforms-loading-heading"
          className="h-8 bg-gray-200 dark:bg-gray-700 rounded-md w-80 animate-pulse"
          aria-hidden="true"
        />

        {/* Native Examples Article Loading */}
        <article 
          className="space-y-6"
          data-testid="native-examples-loading"
          aria-labelledby="native-examples-loading-heading"
        >
          {/* Native examples heading skeleton */}
          <div 
            id="native-examples-loading-heading"
            className="h-6 bg-gray-200 dark:bg-gray-700 rounded-md w-64 animate-pulse"
            aria-hidden="true"
          />

          {/* Native examples grid skeleton */}
          <div 
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4"
            role="list"
            aria-label="Loading native platform examples"
          >
            {Array.from({ length: 4 }).map((_, index) => (
              <div 
                key={`native-${index}`}
                className="group"
                role="listitem"
                aria-hidden="true"
              >
                {/* Icon card link skeleton */}
                <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6 hover:shadow-lg transition-all duration-200 animate-pulse">
                  {/* Icon placeholder */}
                  <div className="w-12 h-12 bg-gray-200 dark:bg-gray-700 rounded-lg mb-4 mx-auto animate-pulse" />
                  
                  {/* Title placeholder */}
                  <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mx-auto mb-2 animate-pulse" />
                  
                  {/* Subtitle placeholder */}
                  <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2 mx-auto animate-pulse" />
                </div>
              </div>
            ))}
          </div>
        </article>

        {/* JavaScript Examples Article Loading */}
        <article 
          className="space-y-6"
          data-testid="javascript-examples-loading"
          aria-labelledby="javascript-examples-loading-heading"
        >
          {/* JavaScript examples heading skeleton */}
          <div 
            id="javascript-examples-loading-heading"
            className="h-6 bg-gray-200 dark:bg-gray-700 rounded-md w-72 animate-pulse"
            aria-hidden="true"
          />

          {/* JavaScript examples grid skeleton */}
          <div 
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4"
            role="list"
            aria-label="Loading JavaScript platform examples"
          >
            {Array.from({ length: 6 }).map((_, index) => (
              <div 
                key={`javascript-${index}`}
                className="group"
                role="listitem"
                aria-hidden="true"
              >
                {/* Icon card link skeleton */}
                <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6 hover:shadow-lg transition-all duration-200 animate-pulse">
                  {/* Icon placeholder */}
                  <div className="w-12 h-12 bg-gray-200 dark:bg-gray-700 rounded-lg mb-4 mx-auto animate-pulse" />
                  
                  {/* Title placeholder */}
                  <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mx-auto mb-2 animate-pulse" />
                  
                  {/* Subtitle placeholder */}
                  <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2 mx-auto animate-pulse" />
                </div>
              </div>
            ))}
          </div>
        </article>
      </section>

      {/* Loading indicator for screen readers */}
      <div 
        className="sr-only" 
        aria-live="polite" 
        aria-atomic="true"
        data-testid="sr-loading-announcement"
      >
        Quickstart content is loading. You will be notified when it's ready.
      </div>
    </div>
  );
}