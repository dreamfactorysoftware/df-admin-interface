/**
 * Loading state component for service editing page
 * 
 * Next.js App Router loading component that provides animated skeleton placeholders
 * while existing service data loads and the editing wizard initializes.
 * 
 * Features:
 * - WCAG 2.1 AA accessibility compliance with proper ARIA labels
 * - Dark mode theme integration with consistent styling
 * - Tailwind CSS 4.1+ animations with shimmer effects
 * - Context-appropriate loading states for service editing workflow
 * - Performance optimized for React 19 with sub-100ms render time
 * - Progressive loading indicators for different phases
 * 
 * @see Section 7.5.1 Core Application Layout Structure - segment-level loading
 * @see React/Next.js Integration Requirements - performance standards
 * @see Section 7.7 Visual Design Considerations - accessibility compliance
 * @see Section 5.2 Database Service Management Component - theming
 */

import React from 'react';
import { LoadingSkeleton, SkeletonText, SkeletonButton, SkeletonCard } from '@/components/layout/loading/loading-skeleton';

/**
 * Service editing loading component
 * 
 * Displays appropriate loading placeholders for the service editing page including:
 * - Page header with breadcrumbs and actions
 * - Service metadata form sections
 * - Configuration wizard steps
 * - Connection testing area
 * - Security configuration panels
 */
export default function ServiceEditingLoading() {
  return (
    <div 
      className="space-y-8 animate-fade-in"
      role="status"
      aria-label="Loading service editing interface"
      aria-live="polite"
      data-testid="service-editing-loading"
    >
      {/* Skip link for accessibility */}
      <a 
        href="#main-content" 
        className="skip-link focus:not-sr-only"
        aria-label="Skip to main content when loaded"
      >
        Skip to service editing form
      </a>

      {/* Page Header Loading */}
      <div 
        className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
        data-testid="page-header-loading"
        aria-label="Loading page header"
      >
        {/* Breadcrumbs Loading */}
        <div className="flex items-center space-x-2 mb-2 sm:mb-0">
          <SkeletonText 
            lines={1} 
            lineWidth="120px" 
            lineHeight="sm"
            className="h-4"
            aria-label="Loading breadcrumb navigation"
          />
          <div className="text-gray-400 dark:text-gray-600" aria-hidden="true">/</div>
          <SkeletonText 
            lines={1} 
            lineWidth="80px" 
            lineHeight="sm"
            className="h-4"
            aria-label="Loading current page"
          />
        </div>

        {/* Page Title and Actions */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-4">
          <div className="space-y-2">
            <LoadingSkeleton
              variant="text"
              skeletonProps={{
                lines: 1,
                lineWidth: "240px",
                lineHeight: "lg"
              }}
              className="h-8"
              aria-label="Loading service name"
            />
            <SkeletonText 
              lines={1} 
              lineWidth="180px" 
              lineHeight="sm"
              className="h-5"
              aria-label="Loading service description"
            />
          </div>
          
          {/* Action Buttons */}
          <div className="flex items-center space-x-3">
            <SkeletonButton 
              className="h-10 w-24"
              aria-label="Loading save button"
            />
            <SkeletonButton 
              className="h-10 w-20"
              aria-label="Loading cancel button"
            />
          </div>
        </div>
      </div>

      {/* Service Status Banner Loading */}
      <div 
        className="p-4 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800"
        data-testid="status-banner-loading"
        aria-label="Loading service status"
      >
        <div className="flex items-center space-x-3">
          <div className="w-4 h-4 rounded-full bg-gray-300 dark:bg-gray-600 animate-pulse" aria-hidden="true" />
          <SkeletonText 
            lines={1} 
            lineWidth="160px" 
            lineHeight="sm"
            aria-label="Loading connection status"
          />
        </div>
      </div>

      {/* Main Content Grid */}
      <div 
        className="grid grid-cols-1 lg:grid-cols-3 gap-8"
        id="main-content"
        data-testid="main-content-loading"
      >
        {/* Service Configuration Form - Left Column */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Basic Information Section */}
          <SkeletonCard
            variant="default"
            includeImage={false}
            includeActions={false}
            className="p-6"
            data-testid="basic-info-loading"
            aria-label="Loading basic service information form"
          >
            <div className="space-y-6">
              {/* Section Header */}
              <div className="border-b border-gray-200 dark:border-gray-700 pb-3">
                <SkeletonText 
                  lines={1} 
                  lineWidth="180px" 
                  lineHeight="lg"
                  className="h-6 font-medium"
                  aria-label="Loading section title"
                />
              </div>

              {/* Form Fields Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Service Name Field */}
                <div className="space-y-2">
                  <SkeletonText 
                    lines={1} 
                    lineWidth="100px" 
                    lineHeight="sm"
                    className="h-4"
                    aria-label="Loading field label"
                  />
                  <div className="h-11 bg-gray-100 dark:bg-gray-700 rounded-md animate-pulse" aria-hidden="true" />
                </div>

                {/* Service Label Field */}
                <div className="space-y-2">
                  <SkeletonText 
                    lines={1} 
                    lineWidth="80px" 
                    lineHeight="sm"
                    className="h-4"
                    aria-label="Loading field label"
                  />
                  <div className="h-11 bg-gray-100 dark:bg-gray-700 rounded-md animate-pulse" aria-hidden="true" />
                </div>

                {/* Description Field - Full Width */}
                <div className="md:col-span-2 space-y-2">
                  <SkeletonText 
                    lines={1} 
                    lineWidth="90px" 
                    lineHeight="sm"
                    className="h-4"
                    aria-label="Loading field label"
                  />
                  <div className="h-20 bg-gray-100 dark:bg-gray-700 rounded-md animate-pulse" aria-hidden="true" />
                </div>
              </div>
            </div>
          </SkeletonCard>

          {/* Connection Configuration Section */}
          <SkeletonCard
            variant="default"
            includeImage={false}
            includeActions={false}
            className="p-6"
            data-testid="connection-config-loading"
            aria-label="Loading database connection configuration"
          >
            <div className="space-y-6">
              {/* Section Header */}
              <div className="flex items-center justify-between border-b border-gray-200 dark:border-gray-700 pb-3">
                <SkeletonText 
                  lines={1} 
                  lineWidth="200px" 
                  lineHeight="lg"
                  className="h-6"
                  aria-label="Loading connection section title"
                />
                <SkeletonButton 
                  className="h-9 w-28"
                  aria-label="Loading test connection button"
                />
              </div>

              {/* Connection Fields */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Database Type */}
                <div className="space-y-2">
                  <SkeletonText 
                    lines={1} 
                    lineWidth="110px" 
                    lineHeight="sm"
                    className="h-4"
                    aria-label="Loading database type field"
                  />
                  <div className="h-11 bg-gray-100 dark:bg-gray-700 rounded-md animate-pulse" aria-hidden="true" />
                </div>

                {/* Host Field */}
                <div className="space-y-2">
                  <SkeletonText 
                    lines={1} 
                    lineWidth="60px" 
                    lineHeight="sm"
                    className="h-4"
                    aria-label="Loading host field"
                  />
                  <div className="h-11 bg-gray-100 dark:bg-gray-700 rounded-md animate-pulse" aria-hidden="true" />
                </div>

                {/* Port Field */}
                <div className="space-y-2">
                  <SkeletonText 
                    lines={1} 
                    lineWidth="50px" 
                    lineHeight="sm"
                    className="h-4"
                    aria-label="Loading port field"
                  />
                  <div className="h-11 bg-gray-100 dark:bg-gray-700 rounded-md animate-pulse" aria-hidden="true" />
                </div>

                {/* Database Name */}
                <div className="space-y-2">
                  <SkeletonText 
                    lines={1} 
                    lineWidth="120px" 
                    lineHeight="sm"
                    className="h-4"
                    aria-label="Loading database name field"
                  />
                  <div className="h-11 bg-gray-100 dark:bg-gray-700 rounded-md animate-pulse" aria-hidden="true" />
                </div>
              </div>

              {/* Authentication Section */}
              <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
                <SkeletonText 
                  lines={1} 
                  lineWidth="130px" 
                  lineHeight="md"
                  className="h-5 mb-4"
                  aria-label="Loading authentication section"
                />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <SkeletonText 
                      lines={1} 
                      lineWidth="80px" 
                      lineHeight="sm"
                      className="h-4"
                      aria-label="Loading username field"
                    />
                    <div className="h-11 bg-gray-100 dark:bg-gray-700 rounded-md animate-pulse" aria-hidden="true" />
                  </div>
                  <div className="space-y-2">
                    <SkeletonText 
                      lines={1} 
                      lineWidth="70px" 
                      lineHeight="sm"
                      className="h-4"
                      aria-label="Loading password field"
                    />
                    <div className="h-11 bg-gray-100 dark:bg-gray-700 rounded-md animate-pulse" aria-hidden="true" />
                  </div>
                </div>
              </div>
            </div>
          </SkeletonCard>

          {/* Advanced Options Section */}
          <SkeletonCard
            variant="default"
            includeImage={false}
            includeActions={false}
            className="p-6"
            data-testid="advanced-options-loading"
            aria-label="Loading advanced configuration options"
          >
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <SkeletonText 
                  lines={1} 
                  lineWidth="160px" 
                  lineHeight="lg"
                  className="h-6"
                  aria-label="Loading advanced options title"
                />
                <div className="w-6 h-6 bg-gray-300 dark:bg-gray-600 rounded animate-pulse" aria-hidden="true" />
              </div>
              
              {/* Collapsed state indication */}
              <SkeletonText 
                lines={2} 
                lineWidth={["100%", "80%"]} 
                lineHeight="sm"
                spacing="tight"
                aria-label="Loading advanced options description"
              />
            </div>
          </SkeletonCard>
        </div>

        {/* Right Sidebar */}
        <div className="space-y-6">
          
          {/* Connection Status Card */}
          <SkeletonCard
            variant="compact"
            includeImage={false}
            includeActions={false}
            className="p-4"
            data-testid="connection-status-loading"
            aria-label="Loading connection status information"
          >
            <div className="space-y-3">
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 rounded-full bg-gray-300 dark:bg-gray-600 animate-pulse" aria-hidden="true" />
                <SkeletonText 
                  lines={1} 
                  lineWidth="140px" 
                  lineHeight="sm"
                  className="h-4"
                  aria-label="Loading connection status text"
                />
              </div>
              <SkeletonText 
                lines={2} 
                lineWidth={["100%", "75%"]} 
                lineHeight="sm"
                spacing="tight"
                aria-label="Loading status details"
              />
            </div>
          </SkeletonCard>

          {/* Quick Actions Card */}
          <SkeletonCard
            variant="compact"
            includeImage={false}
            includeActions={false}
            className="p-4"
            data-testid="quick-actions-loading"
            aria-label="Loading quick actions panel"
          >
            <div className="space-y-4">
              <SkeletonText 
                lines={1} 
                lineWidth="100px" 
                lineHeight="md"
                className="h-5"
                aria-label="Loading quick actions title"
              />
              <div className="space-y-2">
                <SkeletonButton className="w-full h-9" aria-label="Loading action button" />
                <SkeletonButton className="w-full h-9" aria-label="Loading action button" />
                <SkeletonButton className="w-full h-9" aria-label="Loading action button" />
              </div>
            </div>
          </SkeletonCard>

          {/* Help Documentation Card */}
          <SkeletonCard
            variant="compact"
            includeImage={false}
            includeActions={false}
            className="p-4"
            data-testid="help-docs-loading"
            aria-label="Loading help documentation"
          >
            <div className="space-y-3">
              <SkeletonText 
                lines={1} 
                lineWidth="90px" 
                lineHeight="md"
                className="h-5"
                aria-label="Loading help section title"
              />
              <SkeletonText 
                lines={3} 
                lineWidth={["100%", "90%", "85%"]} 
                lineHeight="sm"
                spacing="tight"
                aria-label="Loading help content"
              />
              <SkeletonButton 
                className="w-full h-8 mt-3"
                aria-label="Loading documentation link"
              />
            </div>
          </SkeletonCard>
        </div>
      </div>

      {/* Loading Progress Indicator */}
      <div 
        className="fixed bottom-4 right-4 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 p-4 max-w-sm"
        data-testid="loading-progress"
        aria-label="Service data loading progress"
        role="status"
        aria-live="polite"
      >
        <div className="flex items-center space-x-3">
          <div className="flex-shrink-0">
            <div className="w-5 h-5 border-2 border-primary-600 border-t-transparent rounded-full animate-spin" aria-hidden="true" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
              Loading service data...
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Retrieving configuration and connection details
            </p>
          </div>
        </div>
      </div>

      {/* Screen Reader Announcements */}
      <div 
        className="sr-only" 
        aria-live="polite" 
        aria-atomic="true"
        data-testid="screen-reader-status"
      >
        Loading service editing interface. Please wait while we retrieve the service configuration, 
        connection details, and prepare the editing form. This may take a few moments.
      </div>

      {/* Reduced Motion Alternative */}
      <style jsx>{`
        @media (prefers-reduced-motion: reduce) {
          .animate-pulse,
          .animate-spin,
          .animate-fade-in {
            animation: none !important;
          }
          
          [data-testid="service-editing-loading"] * {
            transition: none !important;
          }
        }
      `}</style>
    </div>
  );
}

// Add display name for better debugging
ServiceEditingLoading.displayName = 'ServiceEditingLoading';