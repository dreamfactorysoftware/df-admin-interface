/**
 * Loading state component for the download page that provides visual feedback
 * during page transitions and data fetching, following Next.js app router
 * loading.tsx conventions with Tailwind CSS animations.
 * 
 * Features:
 * - Skeleton placeholders for cloud and local installer sections
 * - Responsive loading layout matching download page structure
 * - Accessibility support with ARIA live regions and screen reader announcements
 * - WCAG 2.1 AA compliant loading states
 * - Dark mode support with Tailwind CSS
 */

'use client';

import { useEffect } from 'react';

/**
 * Loading skeleton component for individual installer cards
 */
function InstallerCardSkeleton() {
  return (
    <li className="animate-pulse">
      <div className="flex flex-col items-center p-6 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-sm hover:shadow-md transition-shadow duration-200">
        {/* Icon skeleton */}
        <div className="w-16 h-16 bg-gray-200 dark:bg-gray-700 rounded-lg mb-4"></div>
        
        {/* Text skeleton */}
        <div className="w-24 h-4 bg-gray-200 dark:bg-gray-700 rounded"></div>
      </div>
    </li>
  );
}

/**
 * Loading skeleton for installer section (cloud or local)
 */
function InstallerSectionSkeleton({ 
  title, 
  itemCount, 
  id 
}: { 
  title: string; 
  itemCount: number; 
  id: string; 
}) {
  return (
    <article className="space-y-4">
      {/* Section heading skeleton */}
      <div className="animate-pulse">
        <div className="h-7 bg-gray-200 dark:bg-gray-700 rounded w-48 mb-2"></div>
      </div>

      {/* Installer cards grid */}
      <ul 
        className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4"
        aria-labelledby={id}
        role="list"
      >
        {Array.from({ length: itemCount }, (_, index) => (
          <InstallerCardSkeleton key={`${id}-skeleton-${index}`} />
        ))}
      </ul>
    </article>
  );
}

/**
 * Main loading component for the download page
 * 
 * This component creates skeleton placeholders that match the structure
 * of the actual download page with cloud and local installer sections.
 */
export default function DownloadPageLoading() {
  useEffect(() => {
    // Announce loading state to screen readers
    const announcement = document.createElement('div');
    announcement.setAttribute('role', 'status');
    announcement.setAttribute('aria-live', 'polite');
    announcement.className = 'sr-only';
    announcement.textContent = 'Loading download page content...';
    document.body.appendChild(announcement);

    // Clean up announcement when component unmounts
    return () => {
      if (document.body.contains(announcement)) {
        document.body.removeChild(announcement);
      }
    };
  }, []);

  return (
    <div 
      className="space-y-8 max-w-6xl mx-auto px-4 py-6"
      data-testid="download-loading"
      role="main"
      aria-label="Loading download page"
    >
      {/* Live region for screen readers */}
      <div 
        className="sr-only" 
        role="status" 
        aria-live="polite"
        aria-atomic="true"
      >
        Loading DreamFactory download options...
      </div>

      {/* Page content loading skeleton */}
      <section className="installers-section space-y-8">
        {/* Intro text skeleton */}
        <div className="animate-pulse space-y-3">
          <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded w-full max-w-3xl"></div>
          <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded w-2/3"></div>
        </div>

        {/* Cloud Installers Section */}
        <InstallerSectionSkeleton
          title="Cloud Installers"
          itemCount={7}
          id="cloud-installers-loading"
        />

        {/* Local Installers Section */}
        <InstallerSectionSkeleton
          title="Local Installers"
          itemCount={4}
          id="local-installers-loading"
        />
      </section>

      {/* Loading indicator for visual feedback */}
      <div className="flex items-center justify-center py-8">
        <div className="flex items-center space-x-3 text-gray-600 dark:text-gray-400">
          {/* Spinner */}
          <svg
            className="animate-spin h-5 w-5"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            aria-hidden="true"
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
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
          
          {/* Loading text */}
          <span className="text-sm font-medium">
            Loading installer options...
          </span>
        </div>
      </div>

      {/* Progress indicator (optional visual enhancement) */}
      <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1 overflow-hidden">
        <div className="bg-primary-600 h-1 rounded-full animate-pulse w-1/3"></div>
      </div>
    </div>
  );
}