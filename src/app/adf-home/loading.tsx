/**
 * @fileoverview Loading state component for the ADF Home section
 * 
 * Provides visual feedback during page transitions and data fetching operations,
 * implementing Next.js loading UI patterns with Tailwind CSS animations.
 * 
 * This component creates skeleton placeholders that match the home dashboard layout:
 * - Two-column welcome section with content and video area
 * - GitHub releases section with card grid
 * - Responsive design following mobile-first approach
 * 
 * @implements WCAG 2.1 AA compliance with screen reader announcements
 * @implements Next.js app router loading.tsx conventions
 * @implements Tailwind CSS 4.1+ utility classes with animation system
 */

import React from 'react';

/**
 * Loading skeleton component for individual cards
 * Reusable component for consistent loading animations across different card types
 */
const CardSkeleton: React.FC<{ className?: string }> = ({ className = '' }) => (
  <div 
    className={`bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm animate-pulse ${className}`}
    role="presentation"
    aria-hidden="true"
  >
    <div className="p-6 space-y-4">
      {/* Card header */}
      <div className="space-y-2">
        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
        <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
      </div>
      
      {/* Card content */}
      <div className="space-y-2">
        <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-full"></div>
        <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-5/6"></div>
      </div>
      
      {/* Card actions */}
      <div className="pt-2">
        <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-24"></div>
      </div>
    </div>
  </div>
);

/**
 * Loading skeleton for the welcome section resources list
 */
const ResourceListSkeleton: React.FC = () => (
  <ul className="space-y-3" role="presentation" aria-hidden="true">
    {Array.from({ length: 4 }).map((_, index) => (
      <li key={index} className="flex items-center space-x-3">
        <div className="h-5 w-5 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-48 animate-pulse"></div>
      </li>
    ))}
  </ul>
);

/**
 * Loading skeleton for the video section
 */
const VideoSkeleton: React.FC = () => (
  <div 
    className="relative bg-gray-200 dark:bg-gray-700 rounded-lg aspect-video animate-pulse"
    role="presentation"
    aria-hidden="true"
  >
    <div className="absolute inset-0 flex items-center justify-center">
      <div className="h-16 w-16 bg-gray-300 dark:bg-gray-600 rounded-full flex items-center justify-center">
        <div className="h-6 w-6 bg-gray-400 dark:bg-gray-500 rounded"></div>
      </div>
    </div>
    <div className="absolute bottom-4 left-4 right-4">
      <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded w-3/4"></div>
    </div>
  </div>
);

/**
 * Main loading component for ADF Home section
 * 
 * Implements Next.js loading.tsx conventions and provides comprehensive
 * loading states for all sections of the home page with proper accessibility.
 */
export default function Loading(): React.JSX.Element {
  return (
    <>
      {/* Screen reader announcement for loading state */}
      <div 
        className="sr-only" 
        role="status" 
        aria-live="polite"
        aria-label="Loading DreamFactory Admin Console home page"
      >
        Loading DreamFactory Admin Console home page. Please wait while we fetch your data.
      </div>

      {/* Main loading content with semantic structure */}
      <div 
        className="min-h-screen bg-gray-50 dark:bg-gray-900"
        data-testid="adf-home-loading"
        role="main"
        aria-busy="true"
        aria-label="Home page content loading"
      >
        <div className="container mx-auto px-4 py-6 max-w-7xl">
          
          {/* Two-column welcome section */}
          <section 
            className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12"
            role="region"
            aria-label="Welcome section loading"
          >
            {/* Left column - Welcome content */}
            <article className="space-y-6">
              {/* Welcome heading */}
              <div className="space-y-4">
                <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-3/4 animate-pulse"></div>
                <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded w-full animate-pulse"></div>
                <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded w-5/6 animate-pulse"></div>
              </div>
              
              {/* Resource links */}
              <div className="space-y-4">
                <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded w-1/2 animate-pulse"></div>
                <ResourceListSkeleton />
              </div>
            </article>

            {/* Right column - Video section */}
            <aside className="space-y-4">
              <VideoSkeleton />
            </aside>
          </section>

          {/* GitHub releases section */}
          <section 
            className="space-y-6"
            role="region"
            aria-label="GitHub releases section loading"
          >
            {/* Section heading */}
            <div className="space-y-2">
              <div className="h-7 bg-gray-200 dark:bg-gray-700 rounded w-48 animate-pulse"></div>
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-96 animate-pulse"></div>
            </div>
            
            {/* Release cards grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {Array.from({ length: 6 }).map((_, index) => (
                <CardSkeleton key={index} />
              ))}
            </div>
          </section>

          {/* Additional content sections for future expansion */}
          <section 
            className="mt-12 space-y-6"
            role="region"
            aria-label="Additional content loading"
          >
            {/* Section divider */}
            <div className="h-px bg-gray-200 dark:bg-gray-700 w-full"></div>
            
            {/* Platform/download section skeleton */}
            <div className="space-y-4">
              <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-64 animate-pulse"></div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {Array.from({ length: 4 }).map((_, index) => (
                  <div 
                    key={index}
                    className="h-32 bg-gray-200 dark:bg-gray-700 rounded-lg animate-pulse"
                    role="presentation"
                    aria-hidden="true"
                  ></div>
                ))}
              </div>
            </div>
          </section>
        </div>
      </div>

      {/* Loading overlay for enhanced user feedback */}
      <div 
        className="fixed bottom-4 right-4 z-50 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 p-4 animate-fade-in"
        role="status"
        aria-label="Loading progress"
      >
        <div className="flex items-center space-x-3">
          {/* Animated spinner */}
          <div 
            className="animate-spin rounded-full h-5 w-5 border-2 border-gray-300 border-t-primary-600"
            aria-hidden="true"
          ></div>
          <span className="text-sm text-gray-600 dark:text-gray-400">
            Loading content...
          </span>
        </div>
      </div>
    </>
  );
}

/**
 * Type definitions for component props (for future extensibility)
 */
export interface LoadingProps {
  /** Optional className for custom styling */
  className?: string;
  /** Loading message override */
  message?: string;
  /** Show progress indicator */
  showProgress?: boolean;
}

/**
 * Named export for potential future use with props
 */
export const AdfHomeLoading: React.FC<LoadingProps> = ({ 
  className = '',
  message = 'Loading content...',
  showProgress = true 
}) => {
  return <Loading />;
};