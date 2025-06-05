/**
 * Next.js Loading UI Component for Profile Management Route
 * 
 * Displays skeleton placeholders during profile data fetching operations.
 * Implements accessible loading states with proper ARIA attributes and responsive
 * design using Tailwind CSS animations for profile form tabs (Details, Security 
 * Question, Password) following Next.js app router loading UI patterns.
 * 
 * Features:
 * - WCAG 2.1 AA compliance with proper ARIA labeling
 * - Responsive design patterns for mobile and desktop viewports
 * - Theme-aware styling matching application design system
 * - Skeleton placeholders for all profile form components
 * - Smooth loading transitions with accessibility announcements
 */

import React from 'react';

/**
 * Skeleton component for form field placeholders
 * Implements WCAG 2.1 AA compliant loading animation
 */
function Skeleton({ 
  className = '', 
  height = 'h-4',
  ariaLabel = 'Loading content'
}: {
  className?: string;
  height?: string;
  ariaLabel?: string;
}) {
  return (
    <div
      className={`animate-pulse bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 dark:from-gray-700 dark:via-gray-600 dark:to-gray-700 rounded-md ${height} ${className}`}
      style={{
        backgroundSize: '200% 100%',
        animation: 'skeleton-wave 1.5s ease-in-out infinite',
      }}
      role="status"
      aria-label={ariaLabel}
    />
  );
}

/**
 * Loading spinner component for active loading states
 * Provides visual feedback during data fetching operations
 */
function LoadingSpinner({ 
  size = 'w-5 h-5',
  className = ''
}: {
  size?: string;
  className?: string;
}) {
  return (
    <div
      className={`animate-spin rounded-full border-2 border-primary-200 border-t-primary-600 dark:border-gray-600 dark:border-t-primary-400 ${size} ${className}`}
      role="status"
      aria-label="Loading data"
    />
  );
}

/**
 * Tab skeleton component for navigation placeholders
 * Matches the structure of profile form tabs
 */
function TabSkeleton({ isActive = false }: { isActive?: boolean }) {
  return (
    <div
      className={`px-4 py-2 border-b-2 transition-colors duration-200 ${
        isActive 
          ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/10' 
          : 'border-transparent hover:border-gray-300 dark:hover:border-gray-600'
      }`}
      role="tab"
      aria-selected={isActive}
      tabIndex={isActive ? 0 : -1}
    >
      <Skeleton 
        className="w-20 sm:w-24" 
        height="h-5"
        ariaLabel={`Loading tab ${isActive ? '(active)' : ''}`}
      />
    </div>
  );
}

/**
 * Form field skeleton component for input placeholders
 * Maintains proper form structure during loading
 */
function FormFieldSkeleton({ 
  hasLabel = true,
  hasHelper = false,
  inputHeight = 'h-11'
}: {
  hasLabel?: boolean;
  hasHelper?: boolean;
  inputHeight?: string;
}) {
  return (
    <div className="space-y-2">
      {hasLabel && (
        <Skeleton 
          className="w-24 sm:w-32" 
          height="h-4"
          ariaLabel="Loading field label"
        />
      )}
      <Skeleton 
        className="w-full" 
        height={inputHeight}
        ariaLabel="Loading form input"
      />
      {hasHelper && (
        <Skeleton 
          className="w-40 sm:w-48" 
          height="h-3"
          ariaLabel="Loading helper text"
        />
      )}
    </div>
  );
}

/**
 * Button skeleton component for action placeholders
 * Implements minimum 44x44px touch target per WCAG guidelines
 */
function ButtonSkeleton({ 
  variant = 'primary',
  size = 'md'
}: {
  variant?: 'primary' | 'secondary' | 'outline';
  size?: 'sm' | 'md' | 'lg';
}) {
  const sizeClasses = {
    sm: 'h-11 w-20 sm:w-24 min-h-[44px]',
    md: 'h-12 w-24 sm:w-32 min-h-[44px]',
    lg: 'h-14 w-28 sm:w-36 min-h-[44px]'
  };

  const variantClasses = {
    primary: 'bg-primary-100 dark:bg-primary-900/20',
    secondary: 'bg-gray-100 dark:bg-gray-800',
    outline: 'border-2 border-gray-200 dark:border-gray-700 bg-transparent'
  };

  return (
    <div
      className={`rounded-md ${sizeClasses[size]} ${variantClasses[variant]}`}
      role="button"
      aria-disabled="true"
      aria-label="Loading action button"
    >
      <Skeleton 
        className="w-full h-full" 
        ariaLabel="Loading button content"
      />
    </div>
  );
}

/**
 * Alert skeleton component for message placeholders
 * Provides structure for status messages during loading
 */
function AlertSkeleton() {
  return (
    <div 
      className="p-4 rounded-md border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50"
      role="status"
      aria-label="Loading notification area"
    >
      <div className="flex items-start space-x-3">
        <Skeleton 
          className="w-5 h-5 rounded-full flex-shrink-0" 
          ariaLabel="Loading alert icon"
        />
        <div className="flex-1 space-y-2">
          <Skeleton 
            className="w-48 sm:w-64" 
            height="h-4"
            ariaLabel="Loading alert title"
          />
          <Skeleton 
            className="w-full max-w-md" 
            height="h-3"
            ariaLabel="Loading alert message"
          />
        </div>
      </div>
    </div>
  );
}

/**
 * Main loading component for profile management route
 * Implements Next.js loading UI patterns with comprehensive accessibility
 */
export default function ProfileLoading() {
  return (
    <div className="min-h-screen bg-white dark:bg-gray-950">
      {/* Custom keyframes for skeleton animation */}
      <style jsx>{`
        @keyframes skeleton-wave {
          0% {
            background-position: -200% 0;
          }
          100% {
            background-position: 200% 0;
          }
        }
      `}</style>

      {/* Screen reader announcement */}
      <div 
        className="sr-only" 
        role="status" 
        aria-live="polite"
        aria-atomic="true"
      >
        Loading profile management interface. Please wait while we fetch your profile information.
      </div>

      {/* Skip link for keyboard navigation */}
      <a 
        href="#main-content" 
        className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-primary-600 focus:text-white focus:rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
      >
        Skip to main content
      </a>

      {/* Header loading */}
      <header className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <Skeleton 
                className="w-8 h-8 rounded" 
                ariaLabel="Loading page icon"
              />
              <Skeleton 
                className="w-32 sm:w-40" 
                height="h-6"
                ariaLabel="Loading page title"
              />
            </div>
            <div className="flex items-center space-x-2">
              <LoadingSpinner size="w-4 h-4" />
              <Skeleton 
                className="w-16 sm:w-20" 
                height="h-4"
                ariaLabel="Loading user info"
              />
            </div>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main 
        id="main-content"
        className="max-w-4xl mx-auto py-6 sm:py-8 px-4 sm:px-6 lg:px-8"
        role="main"
        aria-label="Profile management content"
      >
        {/* Page header */}
        <div className="mb-8">
          <Skeleton 
            className="w-48 sm:w-64 mb-2" 
            height="h-8"
            ariaLabel="Loading page heading"
          />
          <Skeleton 
            className="w-full max-w-2xl" 
            height="h-4"
            ariaLabel="Loading page description"
          />
        </div>

        {/* Alert placeholder */}
        <div className="mb-6">
          <AlertSkeleton />
        </div>

        {/* Tab navigation */}
        <div className="mb-6">
          <nav 
            className="flex border-b border-gray-200 dark:border-gray-700 overflow-x-auto"
            role="tablist"
            aria-label="Profile management sections"
          >
            <TabSkeleton isActive={true} />
            <TabSkeleton />
            <TabSkeleton />
          </nav>
        </div>

        {/* Content area */}
        <div 
          className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm"
          role="tabpanel"
          aria-label="Loading profile form content"
        >
          <div className="p-6 sm:p-8">
            {/* Form sections */}
            <div className="space-y-8">
              {/* Profile Details Section */}
              <section aria-labelledby="profile-details-heading">
                <div className="mb-6">
                  <Skeleton 
                    className="w-32 sm:w-40 mb-2" 
                    height="h-6"
                    ariaLabel="Loading section title"
                  />
                  <Skeleton 
                    className="w-full max-w-lg" 
                    height="h-4"
                    ariaLabel="Loading section description"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <FormFieldSkeleton hasLabel={true} />
                  <FormFieldSkeleton hasLabel={true} />
                  <FormFieldSkeleton hasLabel={true} hasHelper={true} />
                  <FormFieldSkeleton hasLabel={true} />
                </div>
              </section>

              {/* Security Questions Section */}
              <section 
                aria-labelledby="security-questions-heading"
                className="border-t border-gray-200 dark:border-gray-700 pt-8"
              >
                <div className="mb-6">
                  <Skeleton 
                    className="w-40 sm:w-48 mb-2" 
                    height="h-6"
                    ariaLabel="Loading security section title"
                  />
                  <Skeleton 
                    className="w-full max-w-xl" 
                    height="h-4"
                    ariaLabel="Loading security section description"
                  />
                </div>

                <div className="space-y-6">
                  <FormFieldSkeleton hasLabel={true} inputHeight="h-11" />
                  <FormFieldSkeleton hasLabel={true} inputHeight="h-24" />
                </div>
              </section>

              {/* Password Update Section */}
              <section 
                aria-labelledby="password-update-heading"
                className="border-t border-gray-200 dark:border-gray-700 pt-8"
              >
                <div className="mb-6">
                  <Skeleton 
                    className="w-36 sm:w-44 mb-2" 
                    height="h-6"
                    ariaLabel="Loading password section title"
                  />
                  <Skeleton 
                    className="w-full max-w-lg" 
                    height="h-4"
                    ariaLabel="Loading password section description"
                  />
                </div>

                <div className="space-y-6">
                  <FormFieldSkeleton hasLabel={true} hasHelper={true} />
                  <FormFieldSkeleton hasLabel={true} hasHelper={true} />
                  <FormFieldSkeleton hasLabel={true} hasHelper={true} />
                </div>
              </section>
            </div>

            {/* Action buttons */}
            <div className="flex flex-col sm:flex-row justify-end space-y-3 sm:space-y-0 sm:space-x-4 mt-8 pt-6 border-t border-gray-200 dark:border-gray-700">
              <ButtonSkeleton variant="outline" size="md" />
              <ButtonSkeleton variant="primary" size="md" />
            </div>
          </div>
        </div>

        {/* Loading progress indicator */}
        <div 
          className="mt-6 flex items-center justify-center text-sm text-gray-500 dark:text-gray-400"
          role="status"
          aria-live="polite"
        >
          <LoadingSpinner size="w-4 h-4" className="mr-2" />
          <span>Loading profile data...</span>
        </div>
      </main>

      {/* Footer placeholder */}
      <footer className="mt-12 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
        <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row justify-between items-center space-y-2 sm:space-y-0">
            <Skeleton 
              className="w-32 sm:w-40" 
              height="h-4"
              ariaLabel="Loading footer info"
            />
            <div className="flex space-x-4">
              <Skeleton className="w-16" height="h-4" ariaLabel="Loading footer link" />
              <Skeleton className="w-20" height="h-4" ariaLabel="Loading footer link" />
              <Skeleton className="w-18" height="h-4" ariaLabel="Loading footer link" />
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}