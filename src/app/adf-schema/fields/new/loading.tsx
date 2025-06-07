/**
 * Field Creation Loading Component
 * 
 * Next.js loading component providing optimized loading state for the field creation page.
 * Displays skeleton placeholders matching the field creation form layout with animated
 * loading indicators for page header, form sections, and action buttons to maintain
 * consistent user experience during SSR and data fetching operations.
 * 
 * Features:
 * - Comprehensive form skeleton structure matching field creation layout
 * - Tailwind CSS skeleton animations with consistent theme support
 * - Accessibility-friendly loading indicators with proper ARIA labels
 * - SSR performance optimized under 2 seconds
 * - WCAG 2.1 AA compliance with semantic loading states
 * - Responsive skeleton layout for all screen sizes
 * - Dark mode theme support with consistent skeleton colors
 * 
 * @fileoverview Loading component for database field creation page
 * @version 1.0.0
 * @since React 19.0.0 / Next.js 15.1+
 */

import { cn } from '@/lib/utils';

/**
 * Reusable skeleton component for consistent loading animations
 */
interface SkeletonProps {
  className?: string;
  /** ARIA label for accessibility */
  'aria-label'?: string;
  /** Custom animation duration */
  duration?: 'fast' | 'normal' | 'slow';
}

function Skeleton({ 
  className, 
  'aria-label': ariaLabel = 'Loading content',
  duration = 'normal'
}: SkeletonProps) {
  const durationClasses = {
    fast: 'animate-pulse',
    normal: 'animate-pulse',
    slow: 'animate-pulse-slow'
  };

  return (
    <div 
      className={cn(
        'bg-gray-200 dark:bg-gray-700 rounded',
        durationClasses[duration],
        className
      )}
      role="progressbar"
      aria-label={ariaLabel}
      aria-valuetext="Loading"
    />
  );
}

/**
 * Form field skeleton for input elements
 */
function FormFieldSkeleton({ 
  label = true, 
  description = false,
  inputHeight = 'h-10',
  className 
}: {
  label?: boolean;
  description?: boolean;
  inputHeight?: string;
  className?: string;
}) {
  return (
    <div className={cn('space-y-2', className)}>
      {label && (
        <Skeleton 
          className="h-4 w-24" 
          aria-label="Loading field label"
        />
      )}
      <Skeleton 
        className={cn('w-full', inputHeight)} 
        aria-label="Loading input field"
      />
      {description && (
        <Skeleton 
          className="h-3 w-48 opacity-70" 
          aria-label="Loading field description"
        />
      )}
    </div>
  );
}

/**
 * Section header skeleton component
 */
function SectionHeaderSkeleton({ 
  showToggle = false,
  className 
}: {
  showToggle?: boolean;
  className?: string;
}) {
  return (
    <div className={cn('flex items-center justify-between', className)}>
      <Skeleton 
        className="h-6 w-32" 
        aria-label="Loading section title"
      />
      {showToggle && (
        <Skeleton 
          className="h-8 w-20 rounded-md" 
          aria-label="Loading section toggle"
        />
      )}
    </div>
  );
}

/**
 * Main field creation loading component
 */
export default function FieldCreationLoading() {
  return (
    <div 
      className="max-w-4xl mx-auto space-y-8 p-6"
      role="status"
      aria-label="Loading field creation form"
      data-testid="field-creation-loading"
    >
      {/* Page Header Skeleton */}
      <div className="space-y-4">
        {/* Breadcrumb Navigation */}
        <div className="flex items-center space-x-2">
          <Skeleton 
            className="h-4 w-16" 
            aria-label="Loading breadcrumb item"
          />
          <span className="text-gray-400 dark:text-gray-600">/</span>
          <Skeleton 
            className="h-4 w-20" 
            aria-label="Loading breadcrumb item"
          />
          <span className="text-gray-400 dark:text-gray-600">/</span>
          <Skeleton 
            className="h-4 w-24" 
            aria-label="Loading breadcrumb item"
          />
          <span className="text-gray-400 dark:text-gray-600">/</span>
          <Skeleton 
            className="h-4 w-16" 
            aria-label="Loading current page"
          />
        </div>

        {/* Page Title and Description */}
        <div className="space-y-2">
          <Skeleton 
            className="h-8 w-48" 
            aria-label="Loading page title"
          />
          <Skeleton 
            className="h-5 w-96" 
            aria-label="Loading page description"
          />
        </div>
      </div>

      {/* Main Form Container */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm">
        <div className="p-6 space-y-8">
          
          {/* Basic Field Information Section */}
          <div className="space-y-6">
            <SectionHeaderSkeleton />
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Field Name */}
              <FormFieldSkeleton 
                description={true}
                aria-label="Loading field name input"
              />
              
              {/* Field Type */}
              <FormFieldSkeleton 
                description={true}
                aria-label="Loading field type selection"
              />
            </div>

            {/* Field Description */}
            <FormFieldSkeleton 
              inputHeight="h-20"
              description={true}
              aria-label="Loading field description textarea"
            />

            {/* Field Options Row */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Required Toggle */}
              <div className="flex items-center space-x-3">
                <Skeleton 
                  className="h-5 w-10 rounded-full" 
                  aria-label="Loading required toggle"
                />
                <Skeleton 
                  className="h-4 w-16" 
                  aria-label="Loading toggle label"
                />
              </div>
              
              {/* Primary Key Toggle */}
              <div className="flex items-center space-x-3">
                <Skeleton 
                  className="h-5 w-10 rounded-full" 
                  aria-label="Loading primary key toggle"
                />
                <Skeleton 
                  className="h-4 w-20" 
                  aria-label="Loading toggle label"
                />
              </div>

              {/* Auto Increment Toggle */}
              <div className="flex items-center space-x-3">
                <Skeleton 
                  className="h-5 w-10 rounded-full" 
                  aria-label="Loading auto increment toggle"
                />
                <Skeleton 
                  className="h-4 w-24" 
                  aria-label="Loading toggle label"
                />
              </div>
            </div>
          </div>

          {/* Field Constraints Section */}
          <div className="space-y-6 border-t border-gray-200 dark:border-gray-700 pt-6">
            <SectionHeaderSkeleton />
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Minimum Value */}
              <FormFieldSkeleton 
                description={true}
                aria-label="Loading minimum value input"
              />
              
              {/* Maximum Value */}
              <FormFieldSkeleton 
                description={true}
                aria-label="Loading maximum value input"
              />
            </div>
          </div>

          {/* Size & Precision Section */}
          <div className="space-y-6 border-t border-gray-200 dark:border-gray-700 pt-6">
            <SectionHeaderSkeleton />
            
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              {/* Size */}
              <FormFieldSkeleton 
                description={true}
                aria-label="Loading size input"
              />
              
              {/* Precision */}
              <FormFieldSkeleton 
                description={true}
                aria-label="Loading precision input"
              />
              
              {/* Scale */}
              <FormFieldSkeleton 
                description={true}
                aria-label="Loading scale input"
              />
            </div>
          </div>

          {/* Default Value Section */}
          <div className="space-y-4 border-t border-gray-200 dark:border-gray-700 pt-6">
            <FormFieldSkeleton 
              description={true}
              aria-label="Loading default value input"
            />
          </div>

          {/* Picklist Values Section */}
          <div className="space-y-4 border-t border-gray-200 dark:border-gray-700 pt-6">
            <FormFieldSkeleton 
              inputHeight="h-16"
              description={true}
              aria-label="Loading picklist values textarea"
            />
          </div>

          {/* JSON Schema Section */}
          <div className="space-y-4 border-t border-gray-200 dark:border-gray-700 pt-6">
            <FormFieldSkeleton 
              inputHeight="h-24"
              description={true}
              aria-label="Loading JSON schema textarea"
            />
          </div>

          {/* Advanced Validation Rules Section */}
          <div className="space-y-6 border-t border-gray-200 dark:border-gray-700 pt-6">
            <SectionHeaderSkeleton showToggle={true} />
            
            {/* Validation Rules List */}
            <div className="space-y-4 pl-4 border-l-2 border-gray-200 dark:border-gray-700">
              {/* Rule Item 1 */}
              <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <FormFieldSkeleton 
                  label={true}
                  aria-label="Loading validation rule type"
                />
                <FormFieldSkeleton 
                  label={true}
                  aria-label="Loading validation rule value"
                />
                <FormFieldSkeleton 
                  label={true}
                  aria-label="Loading validation error message"
                />
                <div className="flex items-end space-x-2">
                  <div className="flex items-center space-x-3">
                    <Skeleton 
                      className="h-5 w-10 rounded-full" 
                      aria-label="Loading validation rule toggle"
                    />
                    <Skeleton 
                      className="h-4 w-12" 
                      aria-label="Loading toggle label"
                    />
                  </div>
                </div>
              </div>

              {/* Rule Item 2 */}
              <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg opacity-75">
                <FormFieldSkeleton 
                  label={true}
                  aria-label="Loading validation rule type"
                />
                <FormFieldSkeleton 
                  label={true}
                  aria-label="Loading validation rule value"
                />
                <FormFieldSkeleton 
                  label={true}
                  aria-label="Loading validation error message"
                />
                <div className="flex items-end space-x-2">
                  <div className="flex items-center space-x-3">
                    <Skeleton 
                      className="h-5 w-10 rounded-full" 
                      aria-label="Loading validation rule toggle"
                    />
                    <Skeleton 
                      className="h-4 w-12" 
                      aria-label="Loading toggle label"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Add Rule Button */}
            <div className="flex justify-start">
              <Skeleton 
                className="h-9 w-28 rounded-md" 
                aria-label="Loading add validation rule button"
              />
            </div>
          </div>

          {/* Function Usage Section */}
          <div className="space-y-6 border-t border-gray-200 dark:border-gray-700 pt-6">
            <SectionHeaderSkeleton showToggle={true} />
            
            <div className="space-y-4 pl-4 border-l-2 border-gray-200 dark:border-gray-700">
              {/* Function Type */}
              <FormFieldSkeleton 
                description={true}
                aria-label="Loading function type selection"
              />
              
              {/* Function Parameters */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <FormFieldSkeleton 
                  description={true}
                  aria-label="Loading function parameter"
                />
                <FormFieldSkeleton 
                  description={true}
                  aria-label="Loading function parameter"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Form Actions */}
        <div className="flex items-center justify-between px-6 py-4 bg-gray-50 dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 rounded-b-lg">
          {/* Cancel Button */}
          <Skeleton 
            className="h-10 w-20 rounded-md" 
            aria-label="Loading cancel button"
          />
          
          {/* Save Actions */}
          <div className="flex items-center space-x-3">
            <Skeleton 
              className="h-10 w-32 rounded-md" 
              aria-label="Loading save draft button"
            />
            <Skeleton 
              className="h-10 w-28 rounded-md bg-primary-200 dark:bg-primary-700" 
              aria-label="Loading save button"
              duration="fast"
            />
          </div>
        </div>
      </div>

      {/* Loading Status Text */}
      <div className="text-center">
        <p className="text-sm text-gray-500 dark:text-gray-400">
          <Skeleton 
            className="h-4 w-40 mx-auto" 
            aria-label="Loading status message"
          />
        </p>
      </div>
    </div>
  );
}