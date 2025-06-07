/**
 * Loading UI component for the scheduler task details page
 * 
 * This component displays skeleton states and loading indicators while scheduler task data
 * and related service information is being fetched. It implements Tailwind CSS animations
 * with skeleton layouts that match the tabbed interface structure (Basic/Log tabs) and
 * form field layout of the scheduler details page, providing smooth user experience
 * during data loading operations.
 * 
 * Features:
 * - Skeleton layouts that match actual scheduler details form layout including tabs, form fields, and action buttons
 * - WCAG 2.1 AA compliant loading animations and accessibility attributes
 * - Support for SSR and client-side navigation scenarios per Next.js patterns
 * - Progressive loading indicators for service data and component access list fetching
 * - Responsive design across all supported viewport sizes
 * - Integration with React Query loading states for seamless data fetching feedback
 * 
 * @component
 * @example
 * // Used automatically by Next.js App Router when loading.tsx is present
 * // in the same directory as page.tsx for dynamic routes like [id]
 */

import React from 'react';

/**
 * Skeleton component for form inputs with consistent animation
 * Provides reusable skeleton elements for different input types
 */
const SkeletonInput: React.FC<{
  className?: string;
  width?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | 'full';
  height?: 'sm' | 'md' | 'lg' | 'xl';
  'aria-label'?: string;
}> = ({
  className = '',
  width = 'full',
  height = 'md',
  'aria-label': ariaLabel
}) => {
  const widthClasses = {
    xs: 'w-16',      // For small inputs like frequency
    sm: 'w-24',      // For short selects
    md: 'w-32',      // For medium inputs
    lg: 'w-48',      // For larger inputs like name
    xl: 'w-64',      // For very wide inputs
    full: 'w-full'   // For flexible width
  };

  const heightClasses = {
    sm: 'h-8',       // For compact inputs
    md: 'h-10',      // For standard inputs
    lg: 'h-24',      // For textareas
    xl: 'h-64'       // For large text areas like code editor
  };

  return (
    <div
      className={`loading-skeleton rounded-md ${widthClasses[width]} ${heightClasses[height]} ${className}`}
      role="status"
      aria-label={ariaLabel || "Loading form field"}
      aria-live="polite"
    />
  );
};

/**
 * Skeleton component for form labels
 * Represents the label text above form inputs
 */
const SkeletonLabel: React.FC<{
  width?: 'xs' | 'sm' | 'md' | 'lg';
  'aria-label'?: string;
}> = ({
  width = 'md',
  'aria-label': ariaLabel
}) => {
  const widthClasses = {
    xs: 'w-12',
    sm: 'w-16',
    md: 'w-20',
    lg: 'w-24'
  };

  return (
    <div
      className={`loading-skeleton h-4 ${widthClasses[width]} mb-2`}
      role="status"
      aria-label={ariaLabel || "Loading field label"}
    />
  );
};

/**
 * Skeleton component for toggle switches
 * Represents the active/inactive toggle switch
 */
const SkeletonToggle: React.FC = () => (
  <div
    className="loading-skeleton w-11 h-6 rounded-full"
    role="status"
    aria-label="Loading toggle switch"
  />
);

/**
 * Skeleton component for action buttons
 * Represents the form action buttons (cancel, save, etc.)
 */
const SkeletonButton: React.FC<{
  variant?: 'primary' | 'secondary';
  width?: 'sm' | 'md' | 'lg';
}> = ({
  variant = 'primary',
  width = 'md'
}) => {
  const widthClasses = {
    sm: 'w-16',
    md: 'w-20',
    lg: 'w-24'
  };

  return (
    <div
      className={`loading-skeleton h-10 ${widthClasses[width]} rounded-md`}
      role="status"
      aria-label={`Loading ${variant} button`}
    />
  );
};

/**
 * Skeleton component for tab headers
 * Represents the tab navigation buttons
 */
const SkeletonTab: React.FC<{
  label: string;
  isActive?: boolean;
}> = ({
  label,
  isActive = false
}) => (
  <div
    className={`loading-skeleton h-8 w-16 rounded-t-md ${
      isActive ? 'opacity-100' : 'opacity-60'
    }`}
    role="status"
    aria-label={`Loading ${label} tab`}
  />
);

/**
 * Form field skeleton component
 * Represents a complete form field with label and input
 */
const SkeletonFormField: React.FC<{
  labelWidth?: 'xs' | 'sm' | 'md' | 'lg';
  inputWidth?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | 'full';
  inputHeight?: 'sm' | 'md' | 'lg' | 'xl';
  fieldName?: string;
  className?: string;
}> = ({
  labelWidth = 'md',
  inputWidth = 'full',
  inputHeight = 'md',
  fieldName = 'field',
  className = ''
}) => (
  <div className={`space-y-2 ${className}`}>
    <SkeletonLabel width={labelWidth} aria-label={`Loading ${fieldName} label`} />
    <SkeletonInput
      width={inputWidth}
      height={inputHeight}
      aria-label={`Loading ${fieldName} input`}
    />
  </div>
);

/**
 * Main loading component for the scheduler task details page
 * 
 * This component creates a skeleton layout that matches the structure of the
 * actual scheduler details page, including:
 * - Alert notification area
 * - Tabbed interface with Basic and Log tabs
 * - Form fields for task configuration
 * - Action buttons and navigation elements
 * - Code editor for log viewing
 * 
 * The skeleton layout is responsive and maintains proper accessibility attributes
 * for screen readers and other assistive technologies.
 */
export default function SchedulerDetailLoading(): React.JSX.Element {
  return (
    <div
      className="w-full max-w-4xl mx-auto space-y-6 animate-fade-in p-6"
      role="status"
      aria-label="Loading scheduler task details page"
      aria-live="polite"
    >
      {/* Screen reader announcement for loading state */}
      <div className="sr-only" aria-live="assertive">
        Loading scheduler task details. Please wait...
      </div>

      {/* Alert Area Skeleton */}
      <div
        className="w-full h-12 loading-skeleton rounded-md border border-gray-200 dark:border-gray-700"
        role="status"
        aria-label="Loading alert notification area"
      />

      {/* Main Content Container */}
      <div
        className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg shadow-sm overflow-hidden theme-transition"
        role="region"
        aria-label="Loading scheduler task details"
      >
        {/* Tab Navigation Skeleton */}
        <div className="border-b border-gray-200 dark:border-gray-700">
          <div className="flex space-x-1 p-4 bg-gray-50 dark:bg-gray-800">
            <SkeletonTab label="Basic" isActive={true} />
            <SkeletonTab label="Log" isActive={false} />
          </div>
        </div>

        {/* Tab Content Area */}
        <div className="p-6">
          {/* Page Subtitle Skeleton */}
          <div className="mb-6">
            <div
              className="loading-skeleton h-6 w-48 mb-4"
              role="status"
              aria-label="Loading page subtitle"
            />
          </div>

          {/* Basic Tab Content Skeleton */}
          <div
            className="space-y-6"
            role="region"
            aria-label="Loading basic task configuration form"
          >
            {/* Form Fields Container */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Left Column */}
              <div className="space-y-6">
                {/* Name Field */}
                <SkeletonFormField
                  labelWidth="sm"
                  inputWidth="full"
                  fieldName="name"
                />

                {/* Active Toggle Field */}
                <div className="space-y-2">
                  <SkeletonLabel width="sm" aria-label="Loading active label" />
                  <div className="flex items-center space-x-3">
                    <SkeletonToggle />
                    <div
                      className="loading-skeleton h-4 w-12"
                      role="status"
                      aria-label="Loading toggle label"
                    />
                  </div>
                </div>

                {/* Service Field */}
                <SkeletonFormField
                  labelWidth="md"
                  inputWidth="full"
                  fieldName="service"
                />

                {/* Frequency Field */}
                <SkeletonFormField
                  labelWidth="md"
                  inputWidth="lg"
                  fieldName="frequency"
                />

                {/* Method (Verb Picker) Field */}
                <div className="space-y-2">
                  <SkeletonLabel width="md" aria-label="Loading method label" />
                  <div className="flex space-x-2">
                    {/* HTTP Method buttons skeleton */}
                    {['GET', 'POST', 'PUT', 'DELETE'].map((method, index) => (
                      <div
                        key={method}
                        className={`loading-skeleton h-8 w-12 rounded ${
                          index === 0 ? 'opacity-100' : 'opacity-60'
                        }`}
                        role="status"
                        aria-label={`Loading ${method} method button`}
                      />
                    ))}
                  </div>
                </div>
              </div>

              {/* Right Column */}
              <div className="space-y-6">
                {/* Description Field */}
                <SkeletonFormField
                  labelWidth="lg"
                  inputWidth="full"
                  inputHeight="lg"
                  fieldName="description"
                />

                {/* Component Field */}
                <SkeletonFormField
                  labelWidth="md"
                  inputWidth="full"
                  fieldName="component"
                />

                {/* Payload Field (Conditional) */}
                <div className="space-y-2">
                  <SkeletonLabel width="md" aria-label="Loading payload label" />
                  <SkeletonInput
                    width="full"
                    height="lg"
                    aria-label="Loading payload textarea"
                  />
                  <div
                    className="loading-skeleton h-3 w-32 opacity-60"
                    role="status"
                    aria-label="Loading payload help text"
                  />
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div
              className="flex items-center justify-end space-x-3 pt-6 border-t border-gray-200 dark:border-gray-700"
              role="region"
              aria-label="Loading action buttons"
            >
              <SkeletonButton variant="secondary" width="md" />
              <SkeletonButton variant="primary" width="sm" />
            </div>
          </div>

          {/* Log Tab Content Skeleton (Hidden but structurally present) */}
          <div
            className="hidden space-y-6"
            role="region"
            aria-label="Loading log tab content"
          >
            {/* Status Code Display */}
            <div className="flex items-center space-x-2">
              <div
                className="loading-skeleton h-4 w-24"
                role="status"
                aria-label="Loading status code label"
              />
              <div
                className="loading-skeleton h-4 w-8"
                role="status"
                aria-label="Loading status code value"
              />
            </div>

            {/* Code Editor Skeleton */}
            <div
              className="loading-skeleton w-full h-64 rounded-md border border-gray-300 dark:border-gray-600"
              role="status"
              aria-label="Loading code editor"
            />

            {/* Go Back Button */}
            <div className="flex justify-start">
              <SkeletonButton variant="secondary" width="lg" />
            </div>
          </div>
        </div>
      </div>

      {/* Loading Progress Indicator for Slow Networks */}
      <div
        className="flex items-center justify-center space-x-3 p-4"
        role="status"
        aria-label="Loading progress indicator"
      >
        {/* Spinner for visual feedback */}
        <div className="w-5 h-5 loading-spinner" />

        {/* Loading text with animation */}
        <div className="text-sm text-gray-600 dark:text-gray-300 animate-pulse">
          Loading scheduler task details...
        </div>

        {/* Progress dots animation */}
        <div className="flex space-x-1">
          {Array.from({ length: 3 }, (_, index) => (
            <div
              key={`dot-${index}`}
              className="w-2 h-2 bg-primary-600 rounded-full animate-pulse"
              style={{
                animationDelay: `${index * 0.2}s`
              }}
            />
          ))}
        </div>
      </div>

      {/* Accessibility: Provide context for screen readers */}
      <div
        className="sr-only"
        aria-live="polite"
        role="status"
      >
        The scheduler task details interface is loading. This page will show
        a tabbed interface with Basic task configuration and Log viewing sections.
        The Basic tab contains form fields for configuring scheduler task properties
        including name, description, service, component, frequency, HTTP method, and payload.
        The Log tab displays execution logs and status information for the scheduled task.
        Please wait while the data is being fetched.
      </div>
    </div>
  );
}

// Export type for TypeScript support
export type SchedulerDetailLoadingProps = Record<string, never>;