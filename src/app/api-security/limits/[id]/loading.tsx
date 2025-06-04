/**
 * Loading Component for Edit Limit Page
 * 
 * Displays skeleton states and loading indicators while limit data and form
 * dependencies are being fetched. Provides smooth user experience during data
 * loading with accessible loading states, form field skeletons, and responsive
 * design patterns optimized for the edit workflow.
 * 
 * Features:
 * - WCAG 2.1 AA compliant skeleton UI
 * - Responsive design for all breakpoints
 * - Tailwind CSS animations for smooth transitions
 * - Form-specific loading patterns matching edit layout
 * - Accessible screen reader support
 * 
 * @author DreamFactory Admin Interface Team
 * @version React 19/Next.js 15.1 Migration
 */

import React from 'react';
import { Card, CardHeader, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';

// ============================================================================
// SKELETON COMPONENTS
// ============================================================================

/**
 * Basic skeleton component for loading states
 */
const Skeleton = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & {
    className?: string;
  }
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      'animate-pulse rounded-md bg-gray-200 dark:bg-gray-700',
      className
    )}
    {...props}
  />
));
Skeleton.displayName = 'Skeleton';

/**
 * Form field skeleton with label and input
 */
const FormFieldSkeleton: React.FC<{
  label?: boolean;
  description?: boolean;
  className?: string;
}> = ({ label = true, description = false, className }) => (
  <div className={cn('space-y-2', className)}>
    {label && <Skeleton className="h-4 w-24" />}
    <Skeleton className="h-10 w-full" />
    {description && <Skeleton className="h-3 w-32" />}
  </div>
);

/**
 * Select field skeleton with dropdown indicator
 */
const SelectFieldSkeleton: React.FC<{
  label?: boolean;
  className?: string;
}> = ({ label = true, className }) => (
  <div className={cn('space-y-2', className)}>
    {label && <Skeleton className="h-4 w-20" />}
    <div className="relative">
      <Skeleton className="h-10 w-full" />
      <Skeleton className="absolute right-3 top-3 h-4 w-4" />
    </div>
  </div>
);

/**
 * Toggle switch skeleton
 */
const ToggleSkeleton: React.FC<{
  label?: boolean;
  className?: string;
}> = ({ label = true, className }) => (
  <div className={cn('flex items-center justify-between space-x-3', className)}>
    {label && <Skeleton className="h-4 w-16" />}
    <Skeleton className="h-6 w-10 rounded-full" />
  </div>
);

/**
 * Badge skeleton for status indicators
 */
const BadgeSkeleton: React.FC<{
  className?: string;
}> = ({ className }) => (
  <Skeleton className={cn('h-6 w-16 rounded-full', className)} />
);

/**
 * Button skeleton
 */
const ButtonSkeleton: React.FC<{
  variant?: 'primary' | 'secondary' | 'outline';
  size?: 'sm' | 'default' | 'lg';
  className?: string;
}> = ({ variant = 'primary', size = 'default', className }) => {
  const sizeClasses = {
    sm: 'h-8 w-16',
    default: 'h-10 w-20',
    lg: 'h-12 w-24',
  };

  return (
    <Skeleton 
      className={cn(
        'rounded-md',
        sizeClasses[size],
        className
      )} 
    />
  );
};

// ============================================================================
// SECTION SKELETONS
// ============================================================================

/**
 * General information section skeleton
 */
const GeneralInfoSkeleton: React.FC = () => (
  <Card>
    <CardHeader>
      <div className="flex items-center justify-between">
        <Skeleton className="h-6 w-32" /> {/* Section title */}
        <BadgeSkeleton />
      </div>
    </CardHeader>
    <CardContent className="space-y-6">
      {/* Name field */}
      <FormFieldSkeleton />
      
      {/* Description field */}
      <FormFieldSkeleton description />
      
      {/* Active status toggle */}
      <ToggleSkeleton />
    </CardContent>
  </Card>
);

/**
 * Rate limiting configuration section skeleton
 */
const RateLimitConfigSkeleton: React.FC = () => (
  <Card>
    <CardHeader>
      <Skeleton className="h-6 w-40" /> {/* Section title */}
    </CardHeader>
    <CardContent className="space-y-6">
      {/* Limit type selection */}
      <SelectFieldSkeleton />
      
      {/* Rate and period configuration */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <FormFieldSkeleton />
        <SelectFieldSkeleton />
      </div>
    </CardContent>
  </Card>
);

/**
 * Target configuration section skeleton
 */
const TargetConfigSkeleton: React.FC = () => (
  <Card>
    <CardHeader>
      <Skeleton className="h-6 w-36" /> {/* Section title */}
    </CardHeader>
    <CardContent className="space-y-6">
      {/* Service selection */}
      <SelectFieldSkeleton />
      
      {/* Role/User selection (conditional) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <SelectFieldSkeleton />
        <SelectFieldSkeleton />
      </div>
      
      {/* Endpoint and verb configuration */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="md:col-span-2">
          <FormFieldSkeleton />
        </div>
        <SelectFieldSkeleton />
      </div>
    </CardContent>
  </Card>
);

/**
 * Cache and advanced settings section skeleton
 */
const AdvancedSettingsSkeleton: React.FC = () => (
  <Card>
    <CardHeader>
      <Skeleton className="h-6 w-44" /> {/* Section title */}
    </CardHeader>
    <CardContent className="space-y-6">
      {/* Cache configuration */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <FormFieldSkeleton />
        <FormFieldSkeleton />
      </div>
      
      {/* Additional settings */}
      <div className="space-y-4">
        <ToggleSkeleton />
        <ToggleSkeleton />
      </div>
    </CardContent>
  </Card>
);

/**
 * Action buttons section skeleton
 */
const ActionButtonsSkeleton: React.FC = () => (
  <Card>
    <CardContent className="pt-6">
      <div className="flex flex-col sm:flex-row sm:justify-end gap-3">
        <ButtonSkeleton variant="secondary" />
        <ButtonSkeleton variant="outline" />
        <ButtonSkeleton variant="primary" />
      </div>
    </CardContent>
  </Card>
);

// ============================================================================
// MAIN LOADING COMPONENT
// ============================================================================

/**
 * Loading component for the edit limit page
 * 
 * Displays comprehensive skeleton states for all form sections while
 * limit data and dependencies are being fetched. Optimized for edit
 * workflow with pre-populated field patterns.
 */
export default function LimitEditLoading() {
  return (
    <div 
      className="container mx-auto py-6 px-4 space-y-6"
      role="status"
      aria-live="polite"
      aria-label="Loading limit details..."
    >
      {/* Page header skeleton */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <div className="space-y-2">
          <Skeleton className="h-8 w-48" /> {/* Page title */}
          <Skeleton className="h-4 w-72" /> {/* Page description */}
        </div>
        <div className="flex items-center gap-2">
          <BadgeSkeleton />
          <Skeleton className="h-4 w-24" /> {/* Last modified info */}
        </div>
      </div>

      {/* Navigation breadcrumb skeleton */}
      <div className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-400 mb-6">
        <Skeleton className="h-4 w-20" />
        <Skeleton className="h-4 w-4" />
        <Skeleton className="h-4 w-16" />
        <Skeleton className="h-4 w-4" />
        <Skeleton className="h-4 w-24" />
      </div>

      {/* Form sections grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main form content */}
        <div className="lg:col-span-2 space-y-6">
          {/* General information section */}
          <GeneralInfoSkeleton />
          
          {/* Rate limiting configuration */}
          <RateLimitConfigSkeleton />
          
          {/* Target configuration */}
          <TargetConfigSkeleton />
        </div>

        {/* Sidebar content */}
        <div className="space-y-6">
          {/* Advanced settings */}
          <AdvancedSettingsSkeleton />
          
          {/* Current usage stats skeleton */}
          <Card>
            <CardHeader>
              <Skeleton className="h-6 w-28" />
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <Skeleton className="h-4 w-16" />
                  <Skeleton className="h-4 w-12" />
                </div>
                <Skeleton className="h-2 w-full rounded-full" />
              </div>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <Skeleton className="h-4 w-20" />
                  <Skeleton className="h-4 w-16" />
                </div>
                <Skeleton className="h-2 w-full rounded-full" />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Action buttons */}
      <ActionButtonsSkeleton />

      {/* Loading spinner overlay for critical actions */}
      <div className="sr-only" aria-live="assertive">
        Loading limit configuration data...
      </div>
    </div>
  );
}

// ============================================================================
// ACCESSIBILITY ENHANCEMENTS
// ============================================================================

/**
 * Enhanced loading component with reduced motion support
 */
export function LimitEditLoadingAccessible() {
  return (
    <div 
      className="container mx-auto py-6 px-4 space-y-6"
      role="status"
      aria-live="polite"
      aria-label="Loading limit editing interface"
    >
      {/* Reduced motion CSS class for accessibility */}
      <style jsx>{`
        @media (prefers-reduced-motion: reduce) {
          .animate-pulse {
            animation: none;
            opacity: 0.6;
          }
        }
      `}</style>
      
      <LimitEditLoading />
    </div>
  );
}

// ============================================================================
// COMPONENT VARIANTS
// ============================================================================

/**
 * Compact loading variant for mobile or constrained spaces
 */
export function LimitEditLoadingCompact() {
  return (
    <div 
      className="space-y-4 p-4"
      role="status"
      aria-live="polite"
      aria-label="Loading limit details..."
    >
      {/* Compact header */}
      <div className="space-y-2">
        <Skeleton className="h-6 w-40" />
        <Skeleton className="h-4 w-56" />
      </div>

      {/* Compact form sections */}
      <div className="space-y-4">
        <Card>
          <CardContent className="pt-6 space-y-4">
            <FormFieldSkeleton />
            <div className="grid grid-cols-2 gap-3">
              <FormFieldSkeleton />
              <SelectFieldSkeleton />
            </div>
            <ToggleSkeleton />
          </CardContent>
        </Card>
      </div>

      {/* Compact actions */}
      <div className="flex gap-2">
        <ButtonSkeleton size="sm" />
        <ButtonSkeleton size="sm" variant="outline" />
      </div>
    </div>
  );
}

// ============================================================================
// EXPORT TYPES
// ============================================================================

export type {
  // Export component props for potential customization
};