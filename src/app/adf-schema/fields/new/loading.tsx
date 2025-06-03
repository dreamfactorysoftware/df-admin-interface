/**
 * Next.js Loading Component for Database Field Creation Page
 * 
 * Provides optimized loading state with skeleton placeholders matching the field 
 * creation form layout. Displays animated loading indicators for page header, 
 * form sections, and action buttons to maintain consistent user experience 
 * during SSR and data fetching operations.
 * 
 * Features:
 * - WCAG 2.1 AA compliant loading states with proper ARIA labels
 * - Tailwind CSS 4.1+ with consistent theme injection
 * - Optimized for SSR performance under 2 seconds
 * - Responsive design matching field creation form structure
 * - Accessible screen reader announcements
 * 
 * @file src/app/adf-schema/fields/new/loading.tsx
 * @author DreamFactory Team
 * @since React 19/Next.js 15.1 Migration
 */

export default function FieldCreationLoading() {
  return (
    <div
      className="space-y-6 max-w-4xl mx-auto p-6"
      role="status"
      aria-label="Loading field creation form"
    >
      {/* Screen reader announcement */}
      <span className="sr-only">Loading field creation form, please wait...</span>

      {/* Page Header Skeleton */}
      <div className="space-y-4" aria-label="Page header loading">
        {/* Breadcrumb Navigation Skeleton */}
        <div className="flex items-center space-x-2">
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-16 animate-pulse" />
          <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded w-1 animate-pulse" />
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-20 animate-pulse" />
          <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded w-1 animate-pulse" />
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-24 animate-pulse" />
          <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded w-1 animate-pulse" />
          <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded w-32 animate-pulse" />
        </div>

        {/* Page Title and Description */}
        <div className="space-y-2">
          <div className="h-8 bg-gray-300 dark:bg-gray-600 rounded w-48 animate-pulse" />
          <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded w-96 animate-pulse" />
        </div>
      </div>

      {/* Main Form Container Skeleton */}
      <div
        className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6 space-y-8"
        aria-label="Form content loading"
      >
        {/* Basic Field Information Section */}
        <div className="space-y-6">
          <div className="h-6 bg-gray-300 dark:bg-gray-600 rounded w-40 animate-pulse" />
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Field Name Input */}
            <div className="space-y-2">
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-20 animate-pulse" />
              <div className="h-10 bg-gray-100 dark:bg-gray-700 rounded border border-gray-200 dark:border-gray-600 animate-pulse" />
            </div>

            {/* Field Type Select */}
            <div className="space-y-2">
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-24 animate-pulse" />
              <div className="h-10 bg-gray-100 dark:bg-gray-700 rounded border border-gray-200 dark:border-gray-600 animate-pulse" />
            </div>

            {/* Field Label Input */}
            <div className="space-y-2">
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-18 animate-pulse" />
              <div className="h-10 bg-gray-100 dark:bg-gray-700 rounded border border-gray-200 dark:border-gray-600 animate-pulse" />
            </div>

            {/* Field Length Input */}
            <div className="space-y-2">
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-16 animate-pulse" />
              <div className="h-10 bg-gray-100 dark:bg-gray-700 rounded border border-gray-200 dark:border-gray-600 animate-pulse" />
            </div>
          </div>
        </div>

        {/* Field Constraints Section */}
        <div className="space-y-6 border-t border-gray-200 dark:border-gray-700 pt-6">
          <div className="h-6 bg-gray-300 dark:bg-gray-600 rounded w-36 animate-pulse" />
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Default Value Input */}
            <div className="space-y-2">
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-24 animate-pulse" />
              <div className="h-10 bg-gray-100 dark:bg-gray-700 rounded border border-gray-200 dark:border-gray-600 animate-pulse" />
            </div>

            {/* Precision Input */}
            <div className="space-y-2">
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-20 animate-pulse" />
              <div className="h-10 bg-gray-100 dark:bg-gray-700 rounded border border-gray-200 dark:border-gray-600 animate-pulse" />
            </div>
          </div>

          {/* Checkbox Options */}
          <div className="space-y-4">
            {[
              'Allow null values',
              'Auto increment',
              'Primary key',
              'Unique constraint',
              'Include in API responses'
            ].map((_, index) => (
              <div key={index} className="flex items-center space-x-3">
                <div className="h-4 w-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-32 animate-pulse" />
              </div>
            ))}
          </div>
        </div>

        {/* Relationships Section */}
        <div className="space-y-6 border-t border-gray-200 dark:border-gray-700 pt-6">
          <div className="h-6 bg-gray-300 dark:bg-gray-600 rounded w-28 animate-pulse" />
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Reference Table Select */}
            <div className="space-y-2">
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-28 animate-pulse" />
              <div className="h-10 bg-gray-100 dark:bg-gray-700 rounded border border-gray-200 dark:border-gray-600 animate-pulse" />
            </div>

            {/* Reference Field Select */}
            <div className="space-y-2">
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-26 animate-pulse" />
              <div className="h-10 bg-gray-100 dark:bg-gray-700 rounded border border-gray-200 dark:border-gray-600 animate-pulse" />
            </div>
          </div>

          {/* Relationship Options */}
          <div className="space-y-4">
            {[
              'On Delete Cascade',
              'On Update Cascade',
              'Always fetch related data'
            ].map((_, index) => (
              <div key={index} className="flex items-center space-x-3">
                <div className="h-4 w-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-40 animate-pulse" />
              </div>
            ))}
          </div>
        </div>

        {/* Function Usage Section */}
        <div className="space-y-6 border-t border-gray-200 dark:border-gray-700 pt-6">
          <div className="h-6 bg-gray-300 dark:bg-gray-600 rounded w-32 animate-pulse" />
          
          <div className="space-y-4">
            {/* Function Dropdown */}
            <div className="space-y-2">
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-36 animate-pulse" />
              <div className="h-10 bg-gray-100 dark:bg-gray-700 rounded border border-gray-200 dark:border-gray-600 animate-pulse" />
            </div>

            {/* Function Parameters */}
            <div className="space-y-3">
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-28 animate-pulse" />
              <div className="h-24 bg-gray-100 dark:bg-gray-700 rounded border border-gray-200 dark:border-gray-600 animate-pulse" />
            </div>
          </div>
        </div>

        {/* Validation Rules Section */}
        <div className="space-y-6 border-t border-gray-200 dark:border-gray-700 pt-6">
          <div className="h-6 bg-gray-300 dark:bg-gray-600 rounded w-32 animate-pulse" />
          
          <div className="space-y-4">
            {/* Custom Validation */}
            <div className="space-y-2">
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-40 animate-pulse" />
              <div className="h-20 bg-gray-100 dark:bg-gray-700 rounded border border-gray-200 dark:border-gray-600 animate-pulse" />
            </div>

            {/* Validation Message */}
            <div className="space-y-2">
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-36 animate-pulse" />
              <div className="h-10 bg-gray-100 dark:bg-gray-700 rounded border border-gray-200 dark:border-gray-600 animate-pulse" />
            </div>
          </div>
        </div>
      </div>

      {/* Action Buttons Skeleton */}
      <div
        className="flex items-center justify-between bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4"
        aria-label="Form actions loading"
      >
        <div className="flex space-x-3">
          {/* Cancel Button */}
          <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded w-20 animate-pulse" />
          
          {/* Reset Button */}
          <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded w-16 animate-pulse" />
        </div>

        <div className="flex space-x-3">
          {/* Save Draft Button */}
          <div className="h-10 bg-gray-300 dark:bg-gray-600 rounded w-24 animate-pulse" />
          
          {/* Create Field Button */}
          <div className="h-10 bg-primary-200 dark:bg-primary-700 rounded w-28 animate-pulse" />
        </div>
      </div>

      {/* Progress Indicator */}
      <div className="flex items-center justify-center space-x-2 text-gray-500 dark:text-gray-400">
        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary-600 dark:border-primary-400" />
        <span className="text-sm">Loading field creation form...</span>
      </div>
    </div>
  );
}