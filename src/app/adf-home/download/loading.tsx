/**
 * Loading state component for the download page following Next.js app router conventions.
 * Provides accessible loading feedback with Tailwind CSS animations and skeleton patterns.
 * 
 * This component replaces Angular Material progress indicators with modern loading patterns
 * that match the download page structure with cloud and local installer sections.
 * 
 * Features:
 * - WCAG 2.1 AA compliant accessibility with ARIA live regions
 * - Responsive skeleton layout matching the download page structure
 * - Smooth Tailwind CSS animations for enhanced user experience
 * - Server-side rendering compatible loading states
 * 
 * @component
 * @since Next.js 15.1 migration
 */

export default function DownloadPageLoading() {
  return (
    <div 
      className="space-y-8 animate-pulse" 
      data-testid="download-page-loading"
      role="status"
      aria-live="polite"
      aria-label="Loading download page content"
    >
      {/* Screen reader announcement */}
      <div className="sr-only" aria-live="assertive">
        Loading DreamFactory installer download options. Please wait while we prepare the content.
      </div>

      {/* Main description skeleton */}
      <div className="space-y-3">
        <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded w-3/4 max-w-2xl"></div>
        <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded w-2/3 max-w-xl"></div>
      </div>

      {/* Cloud Installers Section */}
      <section 
        className="space-y-6 pt-6" 
        aria-labelledby="cloud-installers-loading"
      >
        {/* Cloud installers heading skeleton */}
        <div className="space-y-2">
          <div 
            id="cloud-installers-loading"
            className="h-7 bg-gray-300 dark:bg-gray-600 rounded w-64 font-semibold"
            aria-label="Loading cloud installers section"
          ></div>
        </div>

        {/* Cloud installers grid skeleton */}
        <div 
          className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 pt-6"
          role="group"
          aria-labelledby="cloud-installers-loading"
        >
          {/* Generate 7 cloud installer card skeletons */}
          {Array.from({ length: 7 }, (_, index) => (
            <div
              key={`cloud-installer-${index}`}
              className="group relative"
              data-testid={`cloud-installer-skeleton-${index}`}
            >
              {/* Card container skeleton */}
              <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6 shadow-sm hover:shadow-md transition-shadow duration-200">
                {/* Icon skeleton */}
                <div className="flex justify-center mb-4">
                  <div className="w-16 h-16 bg-gray-200 dark:bg-gray-700 rounded-lg flex items-center justify-center">
                    <div className="w-10 h-10 bg-gray-300 dark:bg-gray-600 rounded"></div>
                  </div>
                </div>
                
                {/* Title skeleton */}
                <div className="text-center">
                  <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded mx-auto w-20 mb-2"></div>
                  <div className="h-4 bg-gray-100 dark:bg-gray-800 rounded mx-auto w-16"></div>
                </div>
              </div>

              {/* Hover state simulation */}
              <div className="absolute inset-0 bg-transparent group-hover:bg-primary-50 dark:group-hover:bg-primary-900/20 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none"></div>
            </div>
          ))}
        </div>
      </section>

      {/* Local Installers Section */}
      <section 
        className="space-y-6 pt-6" 
        aria-labelledby="local-installers-loading"
      >
        {/* Local installers heading skeleton */}
        <div className="space-y-2">
          <div 
            id="local-installers-loading"
            className="h-7 bg-gray-300 dark:bg-gray-600 rounded w-56 font-semibold"
            aria-label="Loading local installers section"
          ></div>
        </div>

        {/* Local installers grid skeleton */}
        <div 
          className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 pt-6"
          role="group"
          aria-labelledby="local-installers-loading"
        >
          {/* Generate 4 local installer card skeletons */}
          {Array.from({ length: 4 }, (_, index) => (
            <div
              key={`local-installer-${index}`}
              className="group relative"
              data-testid={`local-installer-skeleton-${index}`}
            >
              {/* Card container skeleton */}
              <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6 shadow-sm hover:shadow-md transition-shadow duration-200">
                {/* Icon skeleton */}
                <div className="flex justify-center mb-4">
                  <div className="w-16 h-16 bg-gray-200 dark:bg-gray-700 rounded-lg flex items-center justify-center">
                    <div className="w-10 h-10 bg-gray-300 dark:bg-gray-600 rounded"></div>
                  </div>
                </div>
                
                {/* Title skeleton */}
                <div className="text-center">
                  <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded mx-auto w-18 mb-2"></div>
                  <div className="h-4 bg-gray-100 dark:bg-gray-800 rounded mx-auto w-14"></div>
                </div>
              </div>

              {/* Hover state simulation */}
              <div className="absolute inset-0 bg-transparent group-hover:bg-primary-50 dark:group-hover:bg-primary-900/20 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none"></div>
            </div>
          ))}
        </div>
      </section>

      {/* Loading progress indicator for enhanced feedback */}
      <div className="flex justify-center pt-8" role="status" aria-hidden="true">
        <div className="flex space-x-2">
          <div className="w-2 h-2 bg-primary-400 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
          <div className="w-2 h-2 bg-primary-500 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
          <div className="w-2 h-2 bg-primary-600 rounded-full animate-bounce"></div>
        </div>
      </div>

      {/* Accessibility enhancement: Progress announcement */}
      <div 
        className="sr-only" 
        aria-live="polite" 
        aria-atomic="true"
        role="status"
      >
        Loading installer download options. Content will be available shortly.
      </div>
    </div>
  );
}