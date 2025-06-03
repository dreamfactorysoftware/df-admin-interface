/**
 * Loading UI component for the user edit route
 * 
 * Displays skeleton placeholders during user data fetching and form initialization with:
 * - Next.js app router loading state patterns per Section 0.2.1 architecture specifications
 * - WCAG 2.1 AA compliant accessibility features with proper ARIA attributes
 * - Responsive design for mobile and desktop viewports per Tailwind responsive design patterns
 * - Theme-aware styling with Tailwind CSS 4.1+ animations per React/Next.js Integration Requirements
 * - Form field skeleton placeholders matching user edit form structure and layout
 * - Loading indicators for profile details, app roles, and lookup keys sections
 * - Smooth loading transitions providing clear feedback during data fetching operations
 * 
 * @returns React component for user edit route loading state
 */
export default function UserEditLoading() {
  return (
    <div 
      className="space-y-8 animate-pulse max-w-4xl mx-auto" 
      data-testid="user-edit-loading"
      role="status"
      aria-label="Loading user edit form"
    >
      {/* Screen reader announcement */}
      <div className="sr-only" aria-live="polite" aria-atomic="true">
        Loading user edit form, please wait
      </div>

      {/* Page Header Skeleton */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-6 border-b border-gray-200 dark:border-gray-700">
        <div className="space-y-3">
          {/* Breadcrumb Navigation */}
          <div className="flex items-center space-x-2">
            <div 
              className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-16 animate-pulse"
              aria-hidden="true"
            />
            <div 
              className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1 animate-pulse"
              aria-hidden="true"
            />
            <div 
              className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-12 animate-pulse"
              aria-hidden="true"
            />
            <div 
              className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1 animate-pulse"
              aria-hidden="true"
            />
            <div 
              className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-20 animate-pulse"
              aria-hidden="true"
            />
          </div>
          
          {/* Page Title */}
          <div 
            className="h-8 bg-gray-200 dark:bg-gray-700 rounded-md w-48 animate-pulse"
            aria-hidden="true"
          />
          
          {/* Page Description */}
          <div 
            className="h-5 bg-gray-200 dark:bg-gray-700 rounded-md w-80 animate-pulse"
            aria-hidden="true"
          />
        </div>
        
        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div 
            className="h-10 bg-gray-200 dark:bg-gray-700 rounded-md w-28 animate-pulse"
            aria-hidden="true"
          />
          <div 
            className="h-10 bg-primary-200 dark:bg-primary-700 rounded-md w-24 animate-pulse"
            aria-hidden="true"
          />
        </div>
      </div>

      {/* User Form Sections */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Main Form Content - Left Column (2/3 width) */}
        <div className="lg:col-span-2 space-y-8">
          
          {/* Profile Details Section */}
          <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg">
            {/* Section Header */}
            <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center gap-3">
                <div 
                  className="h-6 w-6 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"
                  aria-hidden="true"
                />
                <div 
                  className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-32 animate-pulse"
                  aria-hidden="true"
                />
              </div>
            </div>
            
            {/* Form Fields */}
            <div className="p-6 space-y-6">
              {/* User Avatar Upload */}
              <div className="flex items-center gap-6">
                <div 
                  className="h-20 w-20 bg-gray-200 dark:bg-gray-700 rounded-full animate-pulse"
                  aria-hidden="true"
                />
                <div className="space-y-2">
                  <div 
                    className="h-10 bg-gray-200 dark:bg-gray-700 rounded w-32 animate-pulse"
                    aria-hidden="true"
                  />
                  <div 
                    className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-48 animate-pulse"
                    aria-hidden="true"
                  />
                </div>
              </div>
              
              {/* Form Row - Name Fields */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {Array.from({ length: 2 }).map((_, index) => (
                  <div key={`name-field-${index}`} className="space-y-2">
                    <div 
                      className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-20 animate-pulse"
                      aria-hidden="true"
                    />
                    <div 
                      className="h-10 bg-gray-100 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-md animate-pulse"
                      aria-hidden="true"
                    />
                  </div>
                ))}
              </div>
              
              {/* Form Row - Email and Username */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {Array.from({ length: 2 }).map((_, index) => (
                  <div key={`email-field-${index}`} className="space-y-2">
                    <div 
                      className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-16 animate-pulse"
                      aria-hidden="true"
                    />
                    <div 
                      className="h-10 bg-gray-100 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-md animate-pulse"
                      aria-hidden="true"
                    />
                  </div>
                ))}
              </div>
              
              {/* Phone Number Field */}
              <div className="space-y-2">
                <div 
                  className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-24 animate-pulse"
                  aria-hidden="true"
                />
                <div 
                  className="h-10 bg-gray-100 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-md animate-pulse"
                  aria-hidden="true"
                />
              </div>
              
              {/* Password Fields - Conditional */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {Array.from({ length: 2 }).map((_, index) => (
                  <div key={`password-field-${index}`} className="space-y-2">
                    <div 
                      className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-20 animate-pulse"
                      aria-hidden="true"
                    />
                    <div 
                      className="h-10 bg-gray-100 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-md animate-pulse"
                      aria-hidden="true"
                    />
                  </div>
                ))}
              </div>
              
              {/* Toggle Options */}
              <div className="space-y-4">
                {Array.from({ length: 3 }).map((_, index) => (
                  <div key={`toggle-${index}`} className="flex items-center justify-between">
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
                      aria-hidden="true"
                    />
                  </div>
                ))}
              </div>
            </div>
          </div>
          
          {/* App Roles Section */}
          <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg">
            {/* Section Header */}
            <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div 
                    className="h-6 w-6 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"
                    aria-hidden="true"
                  />
                  <div 
                    className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-24 animate-pulse"
                    aria-hidden="true"
                  />
                </div>
                <div 
                  className="h-8 bg-primary-200 dark:bg-primary-700 rounded w-20 animate-pulse"
                  aria-hidden="true"
                />
              </div>
            </div>
            
            {/* App Roles List */}
            <div className="p-6">
              <div className="space-y-4">
                {Array.from({ length: 4 }).map((_, index) => (
                  <div key={`app-role-${index}`} className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-900 rounded-lg">
                    <div className="flex items-center gap-4">
                      <div 
                        className="h-5 w-5 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"
                        aria-hidden="true"
                      />
                      <div className="space-y-1">
                        <div 
                          className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-24 animate-pulse"
                          aria-hidden="true"
                        />
                        <div 
                          className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-16 animate-pulse"
                          aria-hidden="true"
                        />
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <div 
                        className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-20 animate-pulse"
                        aria-hidden="true"
                      />
                      <div 
                        className="h-8 w-8 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"
                        aria-hidden="true"
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
          
          {/* Lookup Keys Section */}
          <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg">
            {/* Section Header */}
            <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div 
                    className="h-6 w-6 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"
                    aria-hidden="true"
                  />
                  <div 
                    className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-28 animate-pulse"
                    aria-hidden="true"
                  />
                </div>
                <div 
                  className="h-8 bg-primary-200 dark:bg-primary-700 rounded w-16 animate-pulse"
                  aria-hidden="true"
                />
              </div>
            </div>
            
            {/* Lookup Keys Table */}
            <div className="p-6">
              <div className="space-y-3">
                {/* Table Header */}
                <div className="grid grid-cols-3 gap-4 pb-2 border-b border-gray-200 dark:border-gray-700">
                  {['Key', 'Value', 'Actions'].map((header, index) => (
                    <div 
                      key={`lookup-header-${index}`}
                      className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-12 animate-pulse"
                      aria-hidden="true"
                    />
                  ))}
                </div>
                
                {/* Table Rows */}
                {Array.from({ length: 3 }).map((_, index) => (
                  <div key={`lookup-row-${index}`} className="grid grid-cols-3 gap-4 py-2">
                    <div 
                      className="h-8 bg-gray-100 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded animate-pulse"
                      aria-hidden="true"
                    />
                    <div 
                      className="h-8 bg-gray-100 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded animate-pulse"
                      aria-hidden="true"
                    />
                    <div 
                      className="h-8 w-8 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"
                      aria-hidden="true"
                    />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
        
        {/* Sidebar - Right Column (1/3 width) */}
        <div className="space-y-6">
          
          {/* User Status Card */}
          <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6">
            <div className="space-y-4">
              <div 
                className="h-5 bg-gray-200 dark:bg-gray-700 rounded w-20 animate-pulse"
                aria-hidden="true"
              />
              
              {/* Status Indicators */}
              <div className="space-y-3">
                {Array.from({ length: 4 }).map((_, index) => (
                  <div key={`status-${index}`} className="flex items-center justify-between">
                    <div 
                      className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-16 animate-pulse"
                      aria-hidden="true"
                    />
                    <div 
                      className="h-6 bg-gray-200 dark:bg-gray-700 rounded-full w-12 animate-pulse"
                      aria-hidden="true"
                    />
                  </div>
                ))}
              </div>
            </div>
          </div>
          
          {/* Activity Timeline Card */}
          <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6">
            <div className="space-y-4">
              <div 
                className="h-5 bg-gray-200 dark:bg-gray-700 rounded w-28 animate-pulse"
                aria-hidden="true"
              />
              
              {/* Timeline Items */}
              <div className="space-y-4">
                {Array.from({ length: 3 }).map((_, index) => (
                  <div key={`timeline-${index}`} className="flex gap-3">
                    <div 
                      className="h-8 w-8 bg-gray-200 dark:bg-gray-700 rounded-full animate-pulse mt-1"
                      aria-hidden="true"
                    />
                    <div className="flex-1 space-y-2">
                      <div 
                        className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-32 animate-pulse"
                        aria-hidden="true"
                      />
                      <div 
                        className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-20 animate-pulse"
                        aria-hidden="true"
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
          
          {/* Quick Actions Card */}
          <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6">
            <div className="space-y-4">
              <div 
                className="h-5 bg-gray-200 dark:bg-gray-700 rounded w-24 animate-pulse"
                aria-hidden="true"
              />
              
              {/* Action Buttons */}
              <div className="space-y-3">
                {Array.from({ length: 3 }).map((_, index) => (
                  <div 
                    key={`action-${index}`}
                    className="h-10 bg-gray-200 dark:bg-gray-700 rounded w-full animate-pulse"
                    aria-hidden="true"
                  />
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Form Actions - Bottom */}
      <div className="flex flex-col sm:flex-row justify-end gap-3 pt-6 border-t border-gray-200 dark:border-gray-700">
        <div 
          className="h-10 bg-gray-200 dark:bg-gray-700 rounded w-20 animate-pulse"
          aria-hidden="true"
        />
        <div 
          className="h-10 bg-primary-200 dark:bg-primary-700 rounded w-24 animate-pulse"
          aria-hidden="true"
        />
      </div>

      {/* Mobile-optimized loading state for smaller screens */}
      <div className="lg:hidden space-y-6">
        {/* Mobile form sections stacked */}
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
          <div className="space-y-4">
            <div 
              className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-32 animate-pulse"
              aria-hidden="true"
            />
            
            {/* Mobile form fields */}
            {Array.from({ length: 6 }).map((_, index) => (
              <div key={`mobile-field-${index}`} className="space-y-2">
                <div 
                  className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-20 animate-pulse"
                  aria-hidden="true"
                />
                <div 
                  className="h-10 bg-gray-100 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded animate-pulse"
                  aria-hidden="true"
                />
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Loading indicator for screen readers */}
      <div 
        className="sr-only" 
        aria-live="polite" 
        aria-atomic="true"
      >
        User profile data is being loaded. Form fields will populate automatically when ready.
      </div>
    </div>
  );
}