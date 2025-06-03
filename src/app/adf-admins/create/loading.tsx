/**
 * Next.js loading UI component for the admin creation route.
 * 
 * Displays skeleton placeholders and loading indicators during form initialization
 * and data fetching operations. Implements accessible loading states with proper
 * ARIA attributes and responsive design following Tailwind CSS patterns.
 * 
 * Optimized for admin-specific form sections including:
 * - Profile details (basic user information)
 * - Access restrictions (isRestrictedAdmin toggle, accessByTabs)
 * - App roles (role assignment interfaces)
 * - Lookup keys (lookupByUserId and management)
 * 
 * @author DreamFactory Team
 * @version 1.0.0
 * @since 2024-12-19
 */

export default function AdminCreateLoading() {
  return (
    <div 
      className="max-w-4xl mx-auto space-y-8 p-6"
      data-testid="admin-create-loading"
      role="status"
      aria-label="Loading admin creation form"
    >
      {/* Page Header Loading */}
      <div className="space-y-4">
        <div className="flex items-center space-x-4">
          {/* Back Button Skeleton */}
          <div className="h-10 w-10 bg-gray-200 dark:bg-gray-700 rounded-md animate-pulse" />
          
          {/* Page Title and Description */}
          <div className="space-y-2 flex-1">
            <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-64 animate-pulse" />
            <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded w-96 animate-pulse" />
          </div>
        </div>
      </div>

      {/* Main Form Loading Container */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm">
        <div className="p-6 space-y-8">
          
          {/* Profile Details Section */}
          <div className="space-y-6">
            <div className="flex items-center space-x-3">
              <div className="h-6 w-6 bg-primary-200 dark:bg-primary-700 rounded animate-pulse" />
              <div className="h-7 bg-gray-200 dark:bg-gray-700 rounded w-32 animate-pulse" />
            </div>
            
            {/* Profile Form Fields Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* First Name Field */}
              <div className="space-y-2">
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-20 animate-pulse" />
                <div className="h-10 bg-gray-100 dark:bg-gray-700 rounded border border-gray-200 dark:border-gray-600 animate-pulse" />
              </div>
              
              {/* Last Name Field */}
              <div className="space-y-2">
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-20 animate-pulse" />
                <div className="h-10 bg-gray-100 dark:bg-gray-700 rounded border border-gray-200 dark:border-gray-600 animate-pulse" />
              </div>
              
              {/* Email Field */}
              <div className="space-y-2">
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-16 animate-pulse" />
                <div className="h-10 bg-gray-100 dark:bg-gray-700 rounded border border-gray-200 dark:border-gray-600 animate-pulse" />
              </div>
              
              {/* Display Name Field */}
              <div className="space-y-2">
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-24 animate-pulse" />
                <div className="h-10 bg-gray-100 dark:bg-gray-700 rounded border border-gray-200 dark:border-gray-600 animate-pulse" />
              </div>
              
              {/* Phone Field */}
              <div className="space-y-2">
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-16 animate-pulse" />
                <div className="h-10 bg-gray-100 dark:bg-gray-700 rounded border border-gray-200 dark:border-gray-600 animate-pulse" />
              </div>
              
              {/* Password Type Selection */}
              <div className="space-y-2">
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-28 animate-pulse" />
                <div className="flex space-x-4">
                  <div className="flex items-center space-x-2">
                    <div className="h-4 w-4 bg-gray-200 dark:bg-gray-700 rounded-full animate-pulse" />
                    <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-16 animate-pulse" />
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="h-4 w-4 bg-gray-200 dark:bg-gray-700 rounded-full animate-pulse" />
                    <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-20 animate-pulse" />
                  </div>
                </div>
              </div>
            </div>
            
            {/* Password Field (when visible) */}
            <div className="space-y-2">
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-20 animate-pulse" />
              <div className="h-10 bg-gray-100 dark:bg-gray-700 rounded border border-gray-200 dark:border-gray-600 animate-pulse" />
            </div>
          </div>

          {/* Access Restrictions Section */}
          <div className="space-y-6 border-t border-gray-200 dark:border-gray-700 pt-8">
            <div className="flex items-center space-x-3">
              <div className="h-6 w-6 bg-primary-200 dark:bg-primary-700 rounded animate-pulse" />
              <div className="h-7 bg-gray-200 dark:bg-gray-700 rounded w-36 animate-pulse" />
            </div>
            
            {/* Restricted Admin Toggle */}
            <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-900 rounded-lg">
              <div className="space-y-2">
                <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded w-32 animate-pulse" />
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-64 animate-pulse" />
              </div>
              <div className="h-6 w-11 bg-gray-200 dark:bg-gray-700 rounded-full animate-pulse" />
            </div>
            
            {/* Access by Tabs Section */}
            <div className="space-y-4">
              <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded w-28 animate-pulse" />
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                {Array.from({ length: 8 }).map((_, index) => (
                  <div key={index} className="flex items-center space-x-2 p-2">
                    <div className="h-4 w-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
                    <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded flex-1 animate-pulse" />
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* App Roles Section */}
          <div className="space-y-6 border-t border-gray-200 dark:border-gray-700 pt-8">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="h-6 w-6 bg-primary-200 dark:bg-primary-700 rounded animate-pulse" />
                <div className="h-7 bg-gray-200 dark:bg-gray-700 rounded w-24 animate-pulse" />
              </div>
              {/* Loading indicator for apps data */}
              <div className="flex items-center space-x-2">
                <div 
                  className="h-4 w-4 border-2 border-primary-200 border-t-primary-600 rounded-full animate-spin"
                  aria-label="Loading applications data"
                />
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-20 animate-pulse" />
              </div>
            </div>
            
            {/* App Roles Grid */}
            <div className="space-y-4">
              {Array.from({ length: 3 }).map((_, appIndex) => (
                <div key={appIndex} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                  {/* App Name */}
                  <div className="flex items-center space-x-3 mb-4">
                    <div className="h-8 w-8 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
                    <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded w-32 animate-pulse" />
                  </div>
                  
                  {/* Roles Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                    {Array.from({ length: 6 }).map((_, roleIndex) => (
                      <div key={roleIndex} className="flex items-center space-x-2 p-2">
                        <div className="h-4 w-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
                        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded flex-1 animate-pulse" />
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Lookup Keys Section */}
          <div className="space-y-6 border-t border-gray-200 dark:border-gray-700 pt-8">
            <div className="flex items-center space-x-3">
              <div className="h-6 w-6 bg-primary-200 dark:bg-primary-700 rounded animate-pulse" />
              <div className="h-7 bg-gray-200 dark:bg-gray-700 rounded w-28 animate-pulse" />
            </div>
            
            {/* Lookup by User ID Toggle */}
            <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-900 rounded-lg">
              <div className="space-y-2">
                <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded w-36 animate-pulse" />
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-72 animate-pulse" />
              </div>
              <div className="h-6 w-11 bg-gray-200 dark:bg-gray-700 rounded-full animate-pulse" />
            </div>
            
            {/* Additional Lookup Keys */}
            <div className="space-y-3">
              {Array.from({ length: 4 }).map((_, index) => (
                <div key={index} className="flex items-center space-x-4 p-3 border border-gray-200 dark:border-gray-700 rounded">
                  <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-24 animate-pulse" />
                  <div className="h-8 bg-gray-100 dark:bg-gray-700 rounded flex-1 animate-pulse" />
                  <div className="h-8 w-8 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
                </div>
              ))}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-between pt-8 border-t border-gray-200 dark:border-gray-700">
            <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded w-20 animate-pulse" />
            
            <div className="flex items-center space-x-3">
              <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded w-24 animate-pulse" />
              <div className="h-10 bg-primary-200 dark:bg-primary-700 rounded w-32 animate-pulse" />
            </div>
          </div>
        </div>
      </div>

      {/* Screen Reader Status Update */}
      <div 
        className="sr-only" 
        role="status" 
        aria-live="polite"
        aria-atomic="true"
      >
        Loading admin creation form. Please wait while we prepare the interface for creating a new administrator account.
      </div>
    </div>
  );
}