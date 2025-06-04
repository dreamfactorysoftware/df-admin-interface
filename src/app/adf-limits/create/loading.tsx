/**
 * Loading Component for Create Limits Route
 * 
 * Next.js loading UI component for the create limits route, providing skeleton
 * loading states while the page component and form data are being fetched.
 * Implements consistent loading patterns with Tailwind CSS animations and
 * accessibility features for screen readers during SSR hydration and data
 * loading operations.
 * 
 * Features:
 * - Next.js app router loading UI patterns for suspense boundaries
 * - Tailwind CSS 4.1+ skeleton animations with consistent theme injection
 * - WCAG 2.1 AA compliance for loading states and screen reader accessibility
 * - Visual consistency matching the limit-form component structure
 * - Proper ARIA labels and loading indicators for accessibility compliance
 * 
 * @version 1.0.0
 * @compliance WCAG 2.1 AA
 * @framework Next.js 15.1+ App Router
 */

import React from 'react';

// ============================================================================
// SKELETON COMPONENTS
// ============================================================================

/**
 * Base skeleton component with consistent Tailwind CSS animations
 * Provides foundational skeleton styling with accessibility support
 */
const Skeleton = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & {
    className?: string;
  }
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={`animate-pulse rounded-md bg-muted/50 ${className || ''}`}
    {...props}
  />
));
Skeleton.displayName = 'Skeleton';

/**
 * Card skeleton component matching the limit-form structure
 * Provides consistent card layout with proper spacing and shadows
 */
const CardSkeleton = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & {
    className?: string;
  }
>(({ className, children, ...props }, ref) => (
  <div
    ref={ref}
    className={`rounded-lg border bg-card text-card-foreground shadow-sm transition-colors ${className || ''}`}
    {...props}
  >
    {children}
  </div>
));
CardSkeleton.displayName = 'CardSkeleton';

/**
 * Form field skeleton component
 * Mimics the structure of form inputs with label and field areas
 */
const FormFieldSkeleton: React.FC<{
  hasLabel?: boolean;
  fieldHeight?: 'sm' | 'md' | 'lg';
  className?: string;
}> = ({ hasLabel = true, fieldHeight = 'md', className }) => {
  const fieldHeightClasses = {
    sm: 'h-8',
    md: 'h-10',
    lg: 'h-12',
  };

  return (
    <div className={`space-y-2 ${className || ''}`}>
      {hasLabel && <Skeleton className="h-4 w-24" />}
      <Skeleton className={`w-full ${fieldHeightClasses[fieldHeight]}`} />
    </div>
  );
};

/**
 * Select field skeleton component
 * Includes arrow indicator to match select field appearance
 */
const SelectFieldSkeleton: React.FC<{
  hasLabel?: boolean;
  className?: string;
}> = ({ hasLabel = true, className }) => (
  <div className={`space-y-2 ${className || ''}`}>
    {hasLabel && <Skeleton className="h-4 w-32" />}
    <div className="relative">
      <Skeleton className="h-10 w-full" />
      <div className="absolute right-3 top-1/2 -translate-y-1/2">
        <Skeleton className="h-4 w-4" />
      </div>
    </div>
  </div>
);

/**
 * Button skeleton component
 * Matches button sizing and positioning
 */
const ButtonSkeleton: React.FC<{
  variant?: 'primary' | 'secondary';
  size?: 'sm' | 'md' | 'lg';
  fullWidth?: boolean;
  className?: string;
}> = ({ variant = 'primary', size = 'md', fullWidth = false, className }) => {
  const sizeClasses = {
    sm: 'h-8 w-16',
    md: 'h-10 w-20',
    lg: 'h-12 w-24',
  };

  return (
    <Skeleton
      className={`
        ${fullWidth ? 'w-full' : sizeClasses[size]}
        ${variant === 'primary' ? 'bg-primary/20' : 'bg-secondary/20'}
        rounded-md
        ${className || ''}
      `}
    />
  );
};

// ============================================================================
// MAIN LOADING COMPONENT
// ============================================================================

/**
 * Create Limits Loading Component
 * 
 * Provides skeleton loading states that match the structure of the limit-form
 * component for visual consistency during loading operations. Implements
 * Next.js app router loading patterns with comprehensive accessibility support.
 */
export default function CreateLimitsLoading(): JSX.Element {
  return (
    <div
      className="container mx-auto px-4 py-6 max-w-4xl"
      role="status"
      aria-live="polite"
      aria-label="Loading create limits form"
    >
      {/* Screen reader announcement */}
      <span className="sr-only">
        Loading create limits form. Please wait while the form loads.
      </span>

      {/* Page Header Skeleton */}
      <div className="mb-8 space-y-4">
        <Skeleton className="h-8 w-48" aria-hidden="true" />
        <Skeleton className="h-4 w-96" aria-hidden="true" />
      </div>

      {/* Main Form Card Skeleton */}
      <CardSkeleton className="p-6">
        <div className="space-y-6">
          
          {/* Form Header */}
          <div className="border-b pb-4">
            <Skeleton className="h-6 w-40 mb-2" aria-hidden="true" />
            <Skeleton className="h-4 w-80" aria-hidden="true" />
          </div>

          {/* Basic Information Section */}
          <div className="space-y-4">
            <Skeleton className="h-5 w-36 mb-4" aria-hidden="true" />
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormFieldSkeleton
                hasLabel={true}
                fieldHeight="md"
                className="col-span-1"
              />
              <SelectFieldSkeleton
                hasLabel={true}
                className="col-span-1"
              />
            </div>

            <FormFieldSkeleton
              hasLabel={true}
              fieldHeight="lg"
              className="col-span-2"
            />
          </div>

          {/* Limit Configuration Section */}
          <div className="space-y-4 border-t pt-6">
            <Skeleton className="h-5 w-44 mb-4" aria-hidden="true" />
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <FormFieldSkeleton
                hasLabel={true}
                fieldHeight="md"
              />
              <SelectFieldSkeleton
                hasLabel={true}
              />
              <FormFieldSkeleton
                hasLabel={true}
                fieldHeight="md"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <SelectFieldSkeleton
                hasLabel={true}
              />
              <SelectFieldSkeleton
                hasLabel={true}
              />
            </div>
          </div>

          {/* Service and Endpoint Configuration */}
          <div className="space-y-4 border-t pt-6">
            <Skeleton className="h-5 w-52 mb-4" aria-hidden="true" />
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <SelectFieldSkeleton hasLabel={true} />
              <SelectFieldSkeleton hasLabel={true} />
            </div>

            <FormFieldSkeleton
              hasLabel={true}
              fieldHeight="md"
            />
          </div>

          {/* Access Control Section */}
          <div className="space-y-4 border-t pt-6">
            <Skeleton className="h-5 w-32 mb-4" aria-hidden="true" />
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <SelectFieldSkeleton hasLabel={true} />
              <SelectFieldSkeleton hasLabel={true} />
            </div>

            {/* Checkbox Options Skeleton */}
            <div className="space-y-3">
              {[1, 2, 3].map((index) => (
                <div key={index} className="flex items-center space-x-3">
                  <Skeleton className="h-4 w-4 rounded" aria-hidden="true" />
                  <Skeleton className="h-4 w-32" aria-hidden="true" />
                </div>
              ))}
            </div>
          </div>

          {/* Advanced Options Section */}
          <div className="space-y-4 border-t pt-6">
            <div className="flex items-center space-x-3 mb-4">
              <Skeleton className="h-4 w-4 rounded" aria-hidden="true" />
              <Skeleton className="h-5 w-36" aria-hidden="true" />
            </div>
            
            <div className="pl-7 space-y-4">
              <FormFieldSkeleton
                hasLabel={true}
                fieldHeight="lg"
              />
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormFieldSkeleton
                  hasLabel={true}
                  fieldHeight="md"
                />
                <SelectFieldSkeleton hasLabel={true} />
              </div>
            </div>
          </div>

          {/* Form Actions */}
          <div className="flex flex-col sm:flex-row justify-end space-y-2 sm:space-y-0 sm:space-x-3 pt-6 border-t">
            <ButtonSkeleton
              variant="secondary"
              size="md"
              className="sm:w-auto"
            />
            <ButtonSkeleton
              variant="primary"
              size="md"
              className="sm:w-auto"
            />
          </div>
        </div>
      </CardSkeleton>

      {/* Loading Progress Indicator */}
      <div className="mt-6 flex items-center justify-center">
        <div className="flex items-center space-x-2 text-muted-foreground">
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary" aria-hidden="true" />
          <span className="text-sm" aria-live="polite">
            Loading form data...
          </span>
        </div>
      </div>

      {/* Hidden loading announcement for screen readers */}
      <div className="sr-only" aria-live="assertive" role="status">
        Form components are loading. Estimated completion time: 2-3 seconds.
      </div>
    </div>
  );
}

// ============================================================================
// COMPONENT METADATA
// ============================================================================

/**
 * Component metadata for Next.js app router
 * Ensures proper hydration and SSR compatibility
 */
CreateLimitsLoading.displayName = 'CreateLimitsLoading';

/**
 * Export type for component props (none in this case)
 * Maintains consistency with other loading components
 */
export type CreateLimitsLoadingProps = Record<string, never>;