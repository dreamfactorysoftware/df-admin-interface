/**
 * Loading UI component for the user creation route
 * 
 * Displays skeleton placeholders during form initialization and data fetching operations with:
 * - Next.js app router loading state patterns per Section 0.2.1 architecture specifications
 * - WCAG 2.1 AA compliant accessibility features with proper ARIA attributes
 * - Responsive design for mobile and desktop viewports using Tailwind CSS patterns
 * - Theme-aware styling with consistent design system integration
 * - Semantic structure matching the user creation form interface
 * - Smooth loading transitions providing clear feedback during data fetching
 * 
 * Key sections covered:
 * - Profile details form fields (name, email, username, etc.)
 * - App roles assignment section with role selection
 * - Lookup keys section for additional user metadata
 * - Form actions and navigation elements
 * 
 * @returns React component for user creation route loading state
 */
export default function UserCreateLoading() {
  return (
    <div 
      className="space-y-8 animate-fade-in" 
      data-testid="user-create-loading"
      role="status"
      aria-label="Loading user creation form"
    >
      {/* Screen reader announcement */}
      <div className="sr-only" aria-live="polite" aria-atomic="true">
        Loading user creation form, please wait
      </div>

      {/* Page Header Section */}
      <div className="space-y-4">
        {/* Breadcrumb Navigation Skeleton */}
        <div className="flex items-center space-x-2" aria-hidden="true">
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-16 animate-pulse" />
          <div className="h-4 w-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-12 animate-pulse" />
          <div className="h-4 w-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-20 animate-pulse" />
        </div>

        {/* Page Title and Description */}
        <div className="space-y-2">
          <div 
            className="h-8 bg-gray-200 dark:bg-gray-700 rounded-md w-48 animate-pulse"
            aria-hidden="true"
          />
          <div 
            className="h-5 bg-gray-200 dark:bg-gray-700 rounded-md w-80 animate-pulse"
            aria-hidden="true"
          />
        </div>
      </div>

      {/* Main Form Container */}
      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-sm">
        
        {/* Form Header with Progress Indicator */}
        <div className="border-b border-gray-200 dark:border-gray-700 px-6 py-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div 
              className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-32 animate-pulse"
              aria-hidden="true"
            />
            
            {/* Progress Steps Skeleton */}
            <div className="flex items-center space-x-4" aria-hidden="true">
              {Array.from({ length: 3 }).map((_, index) => (
                <div key={`step-${index}`} className="flex items-center space-x-2">
                  <div className="h-8 w-8 bg-primary-200 dark:bg-primary-700 rounded-full animate-pulse" />
                  <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-16 animate-pulse" />
                  {index < 2 && (
                    <div className="h-0.5 bg-gray-200 dark:bg-gray-700 w-8 animate-pulse" />
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="p-6 space-y-8">

          {/* Profile Details Section */}
          <div className="space-y-6">
            <div className="flex items-center gap-3">
              <div 
                className="h-6 w-6 bg-primary-200 dark:bg-primary-700 rounded animate-pulse"
                aria-hidden="true"
              />
              <div 
                className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-32 animate-pulse"
                aria-hidden="true"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Form Field Skeletons - First Row */}
              {['First Name', 'Last Name'].map((field, index) => (
                <div key={`name-field-${index}`} className="space-y-2">
                  {/* Field Label */}
                  <div 
                    className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-20 animate-pulse"
                    aria-hidden="true"
                  />
                  {/* Field Input */}
                  <div 
                    className="h-11 bg-gray-100 dark:bg-gray-750 border border-gray-200 dark:border-gray-600 rounded-md animate-pulse"
                    aria-hidden="true"
                  />
                </div>
              ))}

              {/* Email and Username Fields */}
              {['Email Address', 'Username'].map((field, index) => (
                <div key={`contact-field-${index}`} className="space-y-2">
                  <div 
                    className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-24 animate-pulse"
                    aria-hidden="true"
                  />
                  <div 
                    className="h-11 bg-gray-100 dark:bg-gray-750 border border-gray-200 dark:border-gray-600 rounded-md animate-pulse"
                    aria-hidden="true"
                  />
                </div>
              ))}

              {/* Phone and Department Fields */}
              {['Phone Number', 'Department'].map((field, index) => (
                <div key={`info-field-${index}`} className="space-y-2">
                  <div 
                    className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-20 animate-pulse"
                    aria-hidden="true"
                  />
                  <div 
                    className="h-11 bg-gray-100 dark:bg-gray-750 border border-gray-200 dark:border-gray-600 rounded-md animate-pulse"
                    aria-hidden="true"
                  />
                </div>
              ))}
            </div>

            {/* Security Settings Row */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Password Field */}
              <div className="space-y-2">
                <div 
                  className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-16 animate-pulse"
                  aria-hidden="true"
                />
                <div 
                  className="h-11 bg-gray-100 dark:bg-gray-750 border border-gray-200 dark:border-gray-600 rounded-md animate-pulse"
                  aria-hidden="true"
                />
              </div>

              {/* Security Options */}
              <div className="space-y-4">
                <div 
                  className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-24 animate-pulse"
                  aria-hidden="true"
                />
                
                {/* Checkbox Options */}
                {Array.from({ length: 3 }).map((_, index) => (
                  <div key={`security-option-${index}`} className="flex items-center space-x-3">
                    <div 
                      className="h-5 w-5 bg-gray-200 dark:bg-gray-700 rounded border animate-pulse"
                      aria-hidden="true"
                    />
                    <div 
                      className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-32 animate-pulse"
                      aria-hidden="true"
                    />
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* App Roles Section */}
          <div className="space-y-6 border-t border-gray-200 dark:border-gray-700 pt-8">
            <div className="flex items-center gap-3">
              <div 
                className="h-6 w-6 bg-primary-200 dark:bg-primary-700 rounded animate-pulse"
                aria-hidden="true"
              />
              <div 
                className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-28 animate-pulse"
                aria-hidden="true"
              />
            </div>

            {/* App Selection Dropdown */}
            <div className="space-y-2">
              <div 
                className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-32 animate-pulse"
                aria-hidden="true"
              />
              <div 
                className="h-11 bg-gray-100 dark:bg-gray-750 border border-gray-200 dark:border-gray-600 rounded-md animate-pulse"
                aria-hidden="true"
              />
            </div>

            {/* Role Assignment Cards */}
            <div className="space-y-4">
              {Array.from({ length: 3 }).map((_, index) => (
                <div 
                  key={`role-card-${index}`}
                  className="border border-gray-200 dark:border-gray-600 rounded-lg p-4 space-y-3"
                  aria-hidden="true"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="h-5 w-5 bg-gray-200 dark:bg-gray-700 rounded border animate-pulse" />
                      <div className="space-y-1">
                        <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded w-24 animate-pulse" />
                        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-40 animate-pulse" />
                      </div>
                    </div>
                    <div className="h-6 bg-primary-200 dark:bg-primary-700 rounded-full w-16 animate-pulse" />
                  </div>

                  {/* Role Permissions Preview */}
                  <div className="pl-8 space-y-2">
                    <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-20 animate-pulse" />
                    <div className="flex flex-wrap gap-2">
                      {Array.from({ length: 4 }).map((_, permIndex) => (
                        <div 
                          key={`permission-${permIndex}`}
                          className="h-6 bg-gray-200 dark:bg-gray-700 rounded-full w-16 animate-pulse"
                        />
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Lookup Keys Section */}
          <div className="space-y-6 border-t border-gray-200 dark:border-gray-700 pt-8">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div 
                  className="h-6 w-6 bg-primary-200 dark:bg-primary-700 rounded animate-pulse"
                  aria-hidden="true"
                />
                <div 
                  className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-28 animate-pulse"
                  aria-hidden="true"
                />
              </div>
              
              {/* Add Button */}
              <div 
                className="h-9 bg-primary-200 dark:bg-primary-700 rounded-md w-24 animate-pulse"
                aria-hidden="true"
              />
            </div>

            {/* Lookup Key Entries */}
            <div className="space-y-3">
              {Array.from({ length: 4 }).map((_, index) => (
                <div 
                  key={`lookup-${index}`}
                  className="grid grid-cols-1 sm:grid-cols-3 gap-4 p-4 border border-gray-200 dark:border-gray-600 rounded-lg"
                  aria-hidden="true"
                >
                  {/* Key Field */}
                  <div className="space-y-1">
                    <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-8 animate-pulse" />
                    <div className="h-9 bg-gray-100 dark:bg-gray-750 border border-gray-200 dark:border-gray-600 rounded animate-pulse" />
                  </div>
                  
                  {/* Value Field */}
                  <div className="space-y-1">
                    <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-10 animate-pulse" />
                    <div className="h-9 bg-gray-100 dark:bg-gray-750 border border-gray-200 dark:border-gray-600 rounded animate-pulse" />
                  </div>
                  
                  {/* Actions */}
                  <div className="flex items-end justify-end">
                    <div className="h-9 w-9 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Advanced Settings Toggle */}
          <div className="border-t border-gray-200 dark:border-gray-700 pt-8">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <div 
                  className="h-5 bg-gray-200 dark:bg-gray-700 rounded w-32 animate-pulse"
                  aria-hidden="true"
                />
                <div 
                  className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-48 animate-pulse"
                  aria-hidden="true"
                />
              </div>
              <div 
                className="h-6 w-11 bg-gray-200 dark:bg-gray-700 rounded-full animate-pulse"
                aria-hidden="true"
              />
            </div>
          </div>
        </div>

        {/* Form Actions Footer */}
        <div className="border-t border-gray-200 dark:border-gray-700 px-6 py-4">
          <div className="flex flex-col sm:flex-row justify-between gap-4">
            {/* Cancel Button */}
            <div 
              className="h-11 bg-gray-200 dark:bg-gray-700 rounded-md w-24 animate-pulse"
              aria-hidden="true"
            />
            
            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-3">
              <div 
                className="h-11 bg-gray-200 dark:bg-gray-700 rounded-md w-28 animate-pulse"
                aria-hidden="true"
              />
              <div 
                className="h-11 bg-primary-200 dark:bg-primary-700 rounded-md w-32 animate-pulse"
                aria-hidden="true"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Mobile-optimized loading state for smaller screens */}
      <div className="md:hidden">
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4 space-y-6">
          {/* Mobile Form Header */}
          <div className="space-y-3">
            <div 
              className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-40 animate-pulse"
              aria-hidden="true"
            />
            <div 
              className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-full animate-pulse"
              aria-hidden="true"
            />
          </div>

          {/* Mobile Form Fields */}
          <div className="space-y-4">
            {Array.from({ length: 6 }).map((_, index) => (
              <div key={`mobile-field-${index}`} className="space-y-2">
                <div 
                  className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-24 animate-pulse"
                  aria-hidden="true"
                />
                <div 
                  className="h-11 bg-gray-100 dark:bg-gray-750 border border-gray-200 dark:border-gray-600 rounded-md animate-pulse"
                  aria-hidden="true"
                />
              </div>
            ))}
          </div>

          {/* Mobile Actions */}
          <div className="flex flex-col gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
            <div 
              className="h-11 bg-primary-200 dark:bg-primary-700 rounded-md w-full animate-pulse"
              aria-hidden="true"
            />
            <div 
              className="h-11 bg-gray-200 dark:bg-gray-700 rounded-md w-full animate-pulse"
              aria-hidden="true"
            />
          </div>
        </div>
      </div>

      {/* Loading completion announcement for screen readers */}
      <div 
        className="sr-only" 
        aria-live="polite" 
        aria-atomic="true"
      >
        User creation form is being prepared. This page will update automatically when all data is loaded.
      </div>
    </div>
  );
}