/**
 * Next.js loading UI component for the admin editing route displaying skeleton placeholders 
 * and loading indicators during existing admin data fetching operations and form initialization.
 * 
 * Implements accessible loading states with proper ARIA attributes and responsive design 
 * following Tailwind CSS patterns established in the application design system, specifically 
 * optimized for admin-specific form sections including pre-populated profile data, access 
 * restrictions, and lookup keys.
 * 
 * @component AdminEditLoading
 * @example
 * // Automatically used by Next.js app router during admin data loading
 * // Route: /adf-admins/[id] (e.g., /adf-admins/123)
 */

import React from 'react';

/**
 * Loading skeleton component for individual form fields with proper ARIA attributes
 */
function FieldSkeleton({ 
  className = "h-10", 
  label = false,
  ariaLabel = "Loading form field"
}: { 
  className?: string; 
  label?: boolean;
  ariaLabel?: string;
}) {
  return (
    <div className="space-y-2">
      {label && (
        <div 
          className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-24 animate-pulse"
          aria-hidden="true"
        />
      )}
      <div 
        className={`bg-gray-200 dark:bg-gray-700 rounded animate-pulse ${className}`}
        role="status"
        aria-label={ariaLabel}
      />
    </div>
  );
}

/**
 * Loading skeleton for toggle/switch components with accessibility
 */
function ToggleSkeleton({ 
  label,
  ariaLabel = "Loading toggle setting"
}: { 
  label: string;
  ariaLabel?: string;
}) {
  return (
    <div className="flex items-center justify-between py-3">
      <div className="space-y-1">
        <div 
          className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-32 animate-pulse"
          aria-hidden="true"
        />
        <div 
          className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-48 animate-pulse"
          aria-hidden="true"
        />
      </div>
      <div 
        className="h-6 w-11 bg-gray-200 dark:bg-gray-700 rounded-full animate-pulse"
        role="status"
        aria-label={ariaLabel}
      />
    </div>
  );
}

/**
 * Loading skeleton for section headers with proper semantic structure
 */
function SectionHeaderSkeleton({ 
  size = "large",
  ariaLabel = "Loading section header"
}: { 
  size?: "large" | "medium" | "small";
  ariaLabel?: string;
}) {
  const sizeClasses = {
    large: "h-8 w-64",
    medium: "h-6 w-48", 
    small: "h-5 w-32"
  };

  return (
    <div 
      className={`bg-gray-200 dark:bg-gray-700 rounded animate-pulse ${sizeClasses[size]}`}
      role="status"
      aria-label={ariaLabel}
    />
  );
}

/**
 * Loading skeleton for table/list components with proper structure
 */
function TableSkeleton({ 
  rows = 3,
  columns = 4,
  ariaLabel = "Loading data table"
}: { 
  rows?: number;
  columns?: number;
  ariaLabel?: string;
}) {
  return (
    <div 
      className="space-y-3"
      role="status"
      aria-label={ariaLabel}
    >
      {/* Table header skeleton */}
      <div className="grid gap-4" style={{ gridTemplateColumns: `repeat(${columns}, 1fr)` }}>
        {Array.from({ length: columns }).map((_, i) => (
          <div 
            key={`header-${i}`}
            className="h-4 bg-gray-300 dark:bg-gray-600 rounded animate-pulse"
            aria-hidden="true"
          />
        ))}
      </div>
      
      {/* Table rows skeleton */}
      {Array.from({ length: rows }).map((_, rowIndex) => (
        <div 
          key={`row-${rowIndex}`}
          className="grid gap-4 py-2 border-b border-gray-100 dark:border-gray-700"
          style={{ gridTemplateColumns: `repeat(${columns}, 1fr)` }}
        >
          {Array.from({ length: columns }).map((_, colIndex) => (
            <div 
              key={`cell-${rowIndex}-${colIndex}`}
              className="h-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"
              aria-hidden="true"
            />
          ))}
        </div>
      ))}
    </div>
  );
}

/**
 * Main loading component for admin editing page
 * Implements WCAG 2.1 AA compliance with proper ARIA attributes and responsive design
 */
export default function AdminEditLoading() {
  return (
    <div 
      className="max-w-4xl mx-auto space-y-8 p-6"
      role="status"
      aria-live="polite"
      aria-label="Loading admin profile editor"
    >
      {/* Screen reader announcement */}
      <div className="sr-only">
        Loading admin profile data, please wait...
      </div>

      {/* Page Header */}
      <div className="space-y-4">
        <div className="flex items-center space-x-4">
          {/* Back button skeleton */}
          <div 
            className="h-8 w-8 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"
            aria-hidden="true"
          />
          <div className="space-y-2">
            <SectionHeaderSkeleton 
              size="large" 
              ariaLabel="Loading page title"
            />
            <div 
              className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-80 animate-pulse"
              aria-hidden="true"
            />
          </div>
        </div>
        
        {/* Action buttons skeleton */}
        <div className="flex items-center justify-end space-x-3">
          <div 
            className="h-10 w-24 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"
            aria-hidden="true"
          />
          <div 
            className="h-10 w-32 bg-primary-200 dark:bg-primary-700 rounded animate-pulse"
            aria-hidden="true"
          />
        </div>
      </div>

      {/* Main Form Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Primary Form Sections - Left Column (lg:col-span-2) */}
        <div className="lg:col-span-2 space-y-8">
          
          {/* Profile Details Section */}
          <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
            <div className="space-y-6">
              <SectionHeaderSkeleton 
                size="medium" 
                ariaLabel="Loading profile details section"
              />
              
              {/* Profile form fields grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FieldSkeleton 
                  label={true} 
                  ariaLabel="Loading admin name field"
                />
                <FieldSkeleton 
                  label={true} 
                  ariaLabel="Loading admin email field"
                />
                <FieldSkeleton 
                  label={true} 
                  ariaLabel="Loading admin username field"
                />
                <FieldSkeleton 
                  label={true} 
                  ariaLabel="Loading admin display name field"
                />
              </div>
              
              {/* Description field */}
              <FieldSkeleton 
                className="h-24" 
                label={true} 
                ariaLabel="Loading admin description field"
              />
              
              {/* Password section */}
              <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
                <div className="space-y-4">
                  <SectionHeaderSkeleton 
                    size="small" 
                    ariaLabel="Loading password section"
                  />
                  <div className="flex items-center space-x-4">
                    <div 
                      className="h-4 w-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"
                      aria-hidden="true"
                    />
                    <div 
                      className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-40 animate-pulse"
                      aria-hidden="true"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Access Restrictions Section */}
          <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
            <div className="space-y-6">
              <SectionHeaderSkeleton 
                size="medium" 
                ariaLabel="Loading access restrictions section"
              />
              
              {/* Admin restriction toggles */}
              <div className="space-y-1">
                <ToggleSkeleton 
                  label="Restricted Admin"
                  ariaLabel="Loading restricted admin setting"
                />
                <ToggleSkeleton 
                  label="Access by Tabs"
                  ariaLabel="Loading access by tabs setting"
                />
              </div>
              
              {/* Additional restriction settings */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FieldSkeleton 
                  label={true} 
                  ariaLabel="Loading access restriction field"
                />
                <FieldSkeleton 
                  label={true} 
                  ariaLabel="Loading permission level field"
                />
              </div>
            </div>
          </div>

          {/* App Roles Section */}
          <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <SectionHeaderSkeleton 
                  size="medium" 
                  ariaLabel="Loading app roles section"
                />
                <div 
                  className="h-8 w-20 bg-primary-200 dark:bg-primary-700 rounded animate-pulse"
                  aria-hidden="true"
                />
              </div>
              
              {/* App roles table */}
              <TableSkeleton 
                rows={4}
                columns={4}
                ariaLabel="Loading admin app roles"
              />
              
              {/* Role assignment controls */}
              <div className="flex items-center space-x-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                <FieldSkeleton 
                  className="h-10 flex-1" 
                  ariaLabel="Loading app selection field"
                />
                <FieldSkeleton 
                  className="h-10 w-32" 
                  ariaLabel="Loading role selection field"
                />
                <div 
                  className="h-10 w-16 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"
                  aria-hidden="true"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Secondary Information - Right Column */}
        <div className="space-y-6">
          
          {/* Lookup Keys Section */}
          <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
            <div className="space-y-4">
              <SectionHeaderSkeleton 
                size="medium" 
                ariaLabel="Loading lookup keys section"
              />
              
              {/* Lookup keys list */}
              <div className="space-y-3">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div 
                    key={`lookup-${i}`}
                    className="flex items-center justify-between p-3 border border-gray-100 dark:border-gray-700 rounded"
                  >
                    <div 
                      className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-24 animate-pulse"
                      aria-hidden="true"
                    />
                    <div 
                      className="h-4 w-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"
                      aria-hidden="true"
                    />
                  </div>
                ))}
              </div>
              
              {/* Add lookup key section */}
              <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
                <div className="space-y-3">
                  <FieldSkeleton 
                    label={true} 
                    ariaLabel="Loading new lookup key field"
                  />
                  <div 
                    className="h-8 w-full bg-gray-200 dark:bg-gray-700 rounded animate-pulse"
                    aria-hidden="true"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Admin Status Information */}
          <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
            <div className="space-y-4">
              <SectionHeaderSkeleton 
                size="medium" 
                ariaLabel="Loading admin status section"
              />
              
              {/* Status indicators */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div 
                    className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-20 animate-pulse"
                    aria-hidden="true"
                  />
                  <div 
                    className="h-6 w-16 bg-green-200 dark:bg-green-700 rounded-full animate-pulse"
                    aria-hidden="true"
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div 
                    className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-24 animate-pulse"
                    aria-hidden="true"
                  />
                  <div 
                    className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-32 animate-pulse"
                    aria-hidden="true"
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div 
                    className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-28 animate-pulse"
                    aria-hidden="true"
                  />
                  <div 
                    className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-20 animate-pulse"
                    aria-hidden="true"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Action Panel */}
          <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
            <div className="space-y-4">
              <SectionHeaderSkeleton 
                size="medium" 
                ariaLabel="Loading admin actions section"
              />
              
              {/* Action buttons */}
              <div className="space-y-3">
                <div 
                  className="h-10 w-full bg-primary-200 dark:bg-primary-700 rounded animate-pulse"
                  aria-hidden="true"
                />
                <div 
                  className="h-10 w-full bg-gray-200 dark:bg-gray-700 rounded animate-pulse"
                  aria-hidden="true"
                />
                <div 
                  className="h-10 w-full bg-yellow-200 dark:bg-yellow-700 rounded animate-pulse"
                  aria-hidden="true"
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Loading Progress Indicator */}
      <div 
        className="fixed bottom-4 right-4 bg-white dark:bg-gray-900 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 p-4"
        role="status"
        aria-live="polite"
      >
        <div className="flex items-center space-x-3">
          {/* Spinning loader */}
          <div 
            className="animate-spin rounded-full h-5 w-5 border-2 border-primary-200 border-t-primary-600"
            aria-hidden="true"
          />
          <span className="text-sm text-gray-600 dark:text-gray-400">
            Loading admin data...
          </span>
        </div>
      </div>

      {/* Mobile-optimized responsive adjustments */}
      <style jsx>{`
        @media (max-width: 768px) {
          .grid-cols-1.lg\\:grid-cols-3 {
            grid-template-columns: 1fr;
          }
          .lg\\:col-span-2 {
            grid-column: span 1;
          }
        }
      `}</style>
    </div>
  );
}