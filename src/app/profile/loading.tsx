/**
 * Profile Management Loading Component
 * 
 * Next.js loading UI component for the profile management route displaying skeleton 
 * placeholders during profile data fetching operations. Implements accessible loading 
 * states with proper ARIA attributes and responsive design using Tailwind CSS animations 
 * for profile form tabs (Details, Security Question, Password) following Next.js app 
 * router loading UI patterns.
 * 
 * Features:
 * - WCAG 2.1 AA compliant with proper ARIA attributes for screen readers
 * - Responsive skeleton placeholders that adapt to mobile and desktop viewports
 * - Theme-aware styling consistent with application design system
 * - Smooth loading animations with proper accessibility announcements
 * - Form field skeleton placeholders matching profile edit form structure
 * 
 * @see Section 7.5.1 - Next.js app router loading UI patterns
 * @see React/Next.js Integration Requirements - Tailwind CSS 4.1+ integration
 * @see Section 0.1.2 - WCAG 2.1 AA compliance specifications
 */

export default function ProfileLoading() {
  return (
    <div 
      className="space-y-6 animate-pulse" 
      data-testid="profile-loading"
      role="status"
      aria-label="Loading profile management interface"
      aria-live="polite"
    >
      {/* Page Header Skeleton */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="space-y-2">
          <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-48 sm:w-56" />
          <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded w-72 sm:w-80" />
        </div>
        <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded w-32" />
      </div>

      {/* Tabbed Interface Skeleton */}
      <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
        {/* Tab Navigation Skeleton */}
        <div className="border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
          <nav className="flex space-x-8 px-6" aria-label="Profile tabs">
            {/* Profile Details Tab */}
            <div className="py-4 border-b-2 border-primary-500 opacity-100">
              <div className="flex items-center space-x-2">
                <div className="h-5 w-5 bg-primary-300 dark:bg-primary-600 rounded" />
                <div className="h-5 bg-primary-400 dark:bg-primary-500 rounded w-20" />
              </div>
            </div>
            {/* Security Question Tab */}
            <div className="py-4 border-b-2 border-transparent opacity-60">
              <div className="flex items-center space-x-2">
                <div className="h-5 w-5 bg-gray-300 dark:bg-gray-600 rounded" />
                <div className="h-5 bg-gray-300 dark:bg-gray-600 rounded w-28" />
              </div>
            </div>
            {/* Password Tab */}
            <div className="py-4 border-b-2 border-transparent opacity-60">
              <div className="flex items-center space-x-2">
                <div className="h-5 w-5 bg-gray-300 dark:bg-gray-600 rounded" />
                <div className="h-5 bg-gray-300 dark:bg-gray-600 rounded w-20" />
              </div>
            </div>
          </nav>
        </div>

        {/* Tab Content Skeleton */}
        <div className="p-6">
          {/* Profile Details Form Skeleton */}
          <div className="space-y-6" aria-label="Loading profile details form">
            {/* Personal Information Section */}
            <div className="space-y-4">
              <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-40" />
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* First Name Field */}
                <div className="space-y-2">
                  <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-20" />
                  <div className="h-11 bg-gray-100 dark:bg-gray-800 rounded border border-gray-200 dark:border-gray-700" />
                </div>
                
                {/* Last Name Field */}
                <div className="space-y-2">
                  <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-20" />
                  <div className="h-11 bg-gray-100 dark:bg-gray-800 rounded border border-gray-200 dark:border-gray-700" />
                </div>
                
                {/* Email Field */}
                <div className="space-y-2 md:col-span-2">
                  <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-16" />
                  <div className="h-11 bg-gray-100 dark:bg-gray-800 rounded border border-gray-200 dark:border-gray-700" />
                </div>
                
                {/* Display Name Field */}
                <div className="space-y-2 md:col-span-2">
                  <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-24" />
                  <div className="h-11 bg-gray-100 dark:bg-gray-800 rounded border border-gray-200 dark:border-gray-700" />
                </div>
              </div>
            </div>

            {/* Contact Information Section */}
            <div className="space-y-4 pt-6 border-t border-gray-200 dark:border-gray-700">
              <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-36" />
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Phone Field */}
                <div className="space-y-2">
                  <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-12" />
                  <div className="h-11 bg-gray-100 dark:bg-gray-800 rounded border border-gray-200 dark:border-gray-700" />
                </div>
                
                {/* Department Field */}
                <div className="space-y-2">
                  <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-20" />
                  <div className="h-11 bg-gray-100 dark:bg-gray-800 rounded border border-gray-200 dark:border-gray-700" />
                </div>
              </div>
            </div>

            {/* Security Preferences Section */}
            <div className="space-y-4 pt-6 border-t border-gray-200 dark:border-gray-700">
              <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-40" />
              
              <div className="space-y-4">
                {/* Two-Factor Authentication */}
                <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
                  <div className="space-y-1">
                    <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded w-48" />
                    <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-64" />
                  </div>
                  <div className="h-6 w-11 bg-gray-200 dark:bg-gray-700 rounded-full" />
                </div>
                
                {/* Email Notifications */}
                <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
                  <div className="space-y-1">
                    <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded w-36" />
                    <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-56" />
                  </div>
                  <div className="h-6 w-11 bg-gray-200 dark:bg-gray-700 rounded-full" />
                </div>
              </div>
            </div>

            {/* Form Actions */}
            <div className="flex flex-col sm:flex-row gap-3 pt-6 border-t border-gray-200 dark:border-gray-700">
              <div className="h-11 bg-primary-200 dark:bg-primary-700 rounded w-full sm:w-32" />
              <div className="h-11 bg-gray-200 dark:bg-gray-700 rounded w-full sm:w-24" />
            </div>
          </div>
        </div>
      </div>

      {/* Loading Status Text for Screen Readers */}
      <div className="sr-only" aria-live="polite" aria-atomic="true">
        Loading profile management interface. Please wait while we fetch your profile information, security settings, and preferences.
      </div>

      {/* Loading Indicator for Visual Users */}
      <div className="flex items-center justify-center py-8" aria-hidden="true">
        <div className="flex items-center space-x-3">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary-600 dark:border-primary-400" />
          <span className="text-sm text-gray-600 dark:text-gray-400 font-medium">
            Loading profile data...
          </span>
        </div>
      </div>

      {/* Accessibility Enhancement: Progress Indication */}
      <div className="sr-only" role="progressbar" aria-label="Loading progress" aria-valuetext="Loading profile management interface">
        <span>Profile data is being loaded. This may take a few moments.</span>
      </div>
    </div>
  );
}