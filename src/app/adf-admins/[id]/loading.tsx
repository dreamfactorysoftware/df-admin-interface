/**
 * Next.js loading UI component for the admin editing route
 * 
 * Displays skeleton placeholders and loading indicators during existing admin data 
 * fetching operations and form initialization. Implements accessible loading states 
 * with proper ARIA attributes and responsive design following Tailwind CSS patterns 
 * established in the application design system.
 * 
 * Optimized for admin-specific form sections including pre-populated profile data,
 * access restrictions, and lookup keys.
 */

export default function AdminEditLoading() {
  return (
    <div 
      className="max-w-4xl mx-auto space-y-8 animate-pulse"
      role="status"
      aria-label="Loading admin data"
      data-testid="admin-edit-loading"
    >
      {/* Screen reader announcement */}
      <div className="sr-only" aria-live="polite">
        Loading admin profile data and form fields...
      </div>

      {/* Page Header Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            {/* Back button skeleton */}
            <div className="h-8 w-8 bg-gray-200 dark:bg-gray-700 rounded" />
            <div className="space-y-2">
              {/* Title skeleton */}
              <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-48" />
              {/* Subtitle skeleton */}
              <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded w-80" />
            </div>
          </div>
          {/* Action buttons skeleton */}
          <div className="flex space-x-3">
            <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded w-24" />
            <div className="h-10 bg-primary-200 dark:bg-primary-700 rounded w-32" />
          </div>
        </div>
      </div>

      {/* Form Container */}
      <div className="bg-white dark:bg-gray-800 shadow-sm border border-gray-200 dark:border-gray-700 rounded-lg">
        <div className="p-6 space-y-8">
          
          {/* Profile Details Section */}
          <div className="space-y-6">
            <div className="flex items-center space-x-2">
              <div className="h-6 w-6 bg-gray-200 dark:bg-gray-700 rounded" />
              <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-32" />
            </div>

            {/* Profile form fields grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Basic profile fields */}
              {Array.from({ length: 6 }).map((_, index) => (
                <div key={`profile-field-${index}`} className="space-y-2">
                  {/* Field label */}
                  <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-24" />
                  {/* Field input */}
                  <div className="h-10 bg-gray-100 dark:bg-gray-700 rounded border border-gray-200 dark:border-gray-600" />
                </div>
              ))}
            </div>

            {/* Email and role fields - full width */}
            <div className="space-y-4">
              <div className="space-y-2">
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-20" />
                <div className="h-10 bg-gray-100 dark:bg-gray-700 rounded border border-gray-200 dark:border-gray-600" />
              </div>
              <div className="space-y-2">
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-28" />
                <div className="h-10 bg-gray-100 dark:bg-gray-700 rounded border border-gray-200 dark:border-gray-600" />
              </div>
            </div>
          </div>

          {/* Divider */}
          <div className="border-t border-gray-200 dark:border-gray-600"></div>

          {/* Access Restrictions Section */}
          <div className="space-y-6">
            <div className="flex items-center space-x-2">
              <div className="h-6 w-6 bg-gray-200 dark:bg-gray-700 rounded" />
              <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-40" />
            </div>

            {/* Admin restriction toggles */}
            <div className="space-y-4">
              {/* Restricted admin toggle */}
              <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                <div className="space-y-1">
                  <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded w-36" />
                  <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-64" />
                </div>
                <div className="h-6 w-11 bg-gray-200 dark:bg-gray-600 rounded-full" />
              </div>

              {/* Access by tabs configuration */}
              <div className="space-y-3">
                <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded w-48" />
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {Array.from({ length: 6 }).map((_, index) => (
                    <div key={`access-tab-${index}`} className="flex items-center space-x-2 p-3 bg-gray-50 dark:bg-gray-700/50 rounded">
                      <div className="h-4 w-4 bg-gray-200 dark:bg-gray-600 rounded" />
                      <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-20" />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Divider */}
          <div className="border-t border-gray-200 dark:border-gray-600"></div>

          {/* App Roles Section */}
          <div className="space-y-6">
            <div className="flex items-center space-x-2">
              <div className="h-6 w-6 bg-gray-200 dark:bg-gray-700 rounded" />
              <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-28" />
            </div>

            {/* App roles loading indicator */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded w-56" />
                <div className="h-8 bg-primary-200 dark:bg-primary-700 rounded w-24" />
              </div>

              {/* App roles table skeleton */}
              <div className="border border-gray-200 dark:border-gray-600 rounded-lg overflow-hidden">
                {/* Table header */}
                <div className="bg-gray-50 dark:bg-gray-700/50 px-4 py-3 border-b border-gray-200 dark:border-gray-600">
                  <div className="grid grid-cols-3 gap-4">
                    <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-16" />
                    <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-12" />
                    <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-20" />
                  </div>
                </div>

                {/* Table rows */}
                <div className="divide-y divide-gray-200 dark:divide-gray-600">
                  {Array.from({ length: 3 }).map((_, index) => (
                    <div key={`app-role-${index}`} className="px-4 py-3">
                      <div className="grid grid-cols-3 gap-4 items-center">
                        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-24" />
                        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-20" />
                        <div className="h-8 w-16 bg-gray-200 dark:bg-gray-600 rounded" />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Divider */}
          <div className="border-t border-gray-200 dark:border-gray-600"></div>

          {/* Lookup Keys Section */}
          <div className="space-y-6">
            <div className="flex items-center space-x-2">
              <div className="h-6 w-6 bg-gray-200 dark:bg-gray-700 rounded" />
              <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-32" />
            </div>

            {/* Lookup keys configuration */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded w-72" />
                <div className="h-8 bg-primary-200 dark:bg-primary-700 rounded w-28" />
              </div>

              {/* Lookup keys list */}
              <div className="space-y-3">
                {Array.from({ length: 4 }).map((_, index) => (
                  <div key={`lookup-key-${index}`} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <div className="h-4 w-4 bg-gray-200 dark:bg-gray-600 rounded" />
                      <div className="space-y-1">
                        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-32" />
                        <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-48" />
                      </div>
                    </div>
                    <div className="flex space-x-2">
                      <div className="h-8 w-8 bg-gray-200 dark:bg-gray-600 rounded" />
                      <div className="h-8 w-8 bg-gray-200 dark:bg-gray-600 rounded" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Divider */}
          <div className="border-t border-gray-200 dark:border-gray-600"></div>

          {/* Additional Settings Section */}
          <div className="space-y-6">
            <div className="flex items-center space-x-2">
              <div className="h-6 w-6 bg-gray-200 dark:bg-gray-700 rounded" />
              <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-44" />
            </div>

            {/* Additional settings toggles and options */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {Array.from({ length: 4 }).map((_, index) => (
                <div key={`setting-${index}`} className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                  <div className="space-y-1">
                    <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-28" />
                    <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-40" />
                  </div>
                  <div className="h-6 w-11 bg-gray-200 dark:bg-gray-600 rounded-full" />
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Form Actions Footer */}
        <div className="px-6 py-4 bg-gray-50 dark:bg-gray-700/50 border-t border-gray-200 dark:border-gray-600 flex items-center justify-between">
          <div className="flex space-x-3">
            {/* Secondary actions */}
            <div className="h-10 bg-gray-200 dark:bg-gray-600 rounded w-28" />
            <div className="h-10 bg-gray-200 dark:bg-gray-600 rounded w-24" />
          </div>
          <div className="flex space-x-3">
            {/* Primary actions */}
            <div className="h-10 bg-gray-200 dark:bg-gray-600 rounded w-20" />
            <div className="h-10 bg-primary-200 dark:bg-primary-700 rounded w-32" />
          </div>
        </div>
      </div>

      {/* Loading progress indicator */}
      <div className="fixed bottom-4 right-4" aria-hidden="true">
        <div className="flex items-center space-x-2 bg-white dark:bg-gray-800 shadow-lg border border-gray-200 dark:border-gray-600 rounded-lg px-4 py-2">
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary-600"></div>
          <span className="text-sm text-gray-600 dark:text-gray-400">Loading admin data...</span>
        </div>
      </div>
    </div>
  );
}