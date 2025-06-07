/**
 * Loading state component for the database service creation page
 * 
 * Provides visual feedback during initial page load and form initialization.
 * Features skeleton placeholders for the multi-step wizard interface, service type cards,
 * and configuration forms using Tailwind CSS animations. Ensures loading states meet
 * the 2-second SSR requirement while providing smooth user experience during data
 * fetching operations.
 * 
 * @author DreamFactory Team
 * @since 2024-12-19
 */

import React from 'react';

/**
 * Database Service Creation Loading Component
 * 
 * Implements Next.js app router loading UI patterns with Tailwind CSS-based
 * skeleton loading animations. Provides WCAG 2.1 AA accessibility compliance
 * with proper loading announcements and ARIA labels. Structured to match the
 * main page layout preventing layout shift.
 */
export default function CreateServiceLoading() {
  return (
    <div 
      className="max-w-4xl mx-auto space-y-6 animate-fade-in" 
      data-testid="create-service-loading"
      role="status"
      aria-live="polite"
      aria-label="Loading database service creation wizard"
    >
      {/* Screen reader announcement */}
      <span className="sr-only">
        Loading database service creation wizard. Please wait while we prepare the multi-step configuration interface.
      </span>

      {/* Page Header with Back Navigation Skeleton */}
      <div className="flex items-center space-x-4">
        {/* Back button skeleton */}
        <div 
          className="h-8 w-8 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"
          aria-hidden="true"
        />
        <div className="space-y-2">
          {/* Page title skeleton */}
          <div 
            className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-64 animate-pulse"
            aria-hidden="true"
          />
          {/* Page description skeleton */}
          <div 
            className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-96 animate-pulse"
            aria-hidden="true"
          />
        </div>
      </div>

      {/* Main Wizard Container */}
      <div 
        className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden"
        aria-hidden="true"
      >
        {/* Wizard Progress Indicator Skeleton */}
        <div className="border-b border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center justify-between mb-4">
            {/* Step indicators */}
            <div className="flex items-center space-x-4">
              {Array.from({ length: 4 }).map((_, index) => (
                <div key={index} className="flex items-center">
                  <div className="flex items-center justify-center w-8 h-8 bg-gray-200 dark:bg-gray-700 rounded-full animate-pulse">
                    <div className="w-4 h-4 bg-gray-300 dark:bg-gray-600 rounded animate-pulse" />
                  </div>
                  {index < 3 && (
                    <div className="w-16 h-0.5 bg-gray-200 dark:bg-gray-700 mx-2 animate-pulse" />
                  )}
                </div>
              ))}
            </div>
          </div>
          
          {/* Step labels skeleton */}
          <div className="flex justify-between">
            {Array.from({ length: 4 }).map((_, index) => (
              <div 
                key={index} 
                className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-20 animate-pulse"
              />
            ))}
          </div>
        </div>

        {/* Step Content Area */}
        <div className="p-6">
          {/* Step Title and Description Skeleton */}
          <div className="mb-8">
            <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-48 mb-2 animate-pulse" />
            <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded w-80 animate-pulse" />
          </div>

          {/* Service Type Selection Cards Grid (Step 1 Content) */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
            {Array.from({ length: 6 }).map((_, index) => (
              <div 
                key={index}
                className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:shadow-md transition-shadow cursor-pointer animate-pulse"
              >
                {/* Database icon skeleton */}
                <div className="flex items-center justify-center w-12 h-12 bg-gray-200 dark:bg-gray-700 rounded-lg mb-3 mx-auto" />
                
                {/* Database name skeleton */}
                <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded w-20 mx-auto mb-2" />
                
                {/* Database description skeleton */}
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-full mb-1" />
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mx-auto" />
              </div>
            ))}
          </div>

          {/* Configuration Form Skeleton (Subsequent Steps Content) */}
          <div className="space-y-6">
            {/* Connection Details Section */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Form field skeletons */}
              {Array.from({ length: 6 }).map((_, index) => (
                <div key={index} className="space-y-2">
                  {/* Field label skeleton */}
                  <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-24 animate-pulse" />
                  {/* Field input skeleton */}
                  <div className="h-10 bg-gray-100 dark:bg-gray-700 rounded border border-gray-200 dark:border-gray-600 animate-pulse" />
                </div>
              ))}
            </div>

            {/* Advanced Options Section */}
            <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
              <div className="flex items-center justify-between mb-4">
                <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded w-32 animate-pulse" />
                <div className="h-5 w-10 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
              </div>
              
              {/* Additional form fields */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {Array.from({ length: 4 }).map((_, index) => (
                  <div key={index} className="space-y-2">
                    <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-28 animate-pulse" />
                    <div className="h-10 bg-gray-100 dark:bg-gray-700 rounded border border-gray-200 dark:border-gray-600 animate-pulse" />
                  </div>
                ))}
              </div>
            </div>

            {/* Connection Testing Section */}
            <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
              <div className="flex items-center justify-between">
                <div className="space-y-2">
                  <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded w-36 animate-pulse" />
                  <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-64 animate-pulse" />
                </div>
                <div className="h-10 bg-primary-200 dark:bg-primary-700 rounded w-32 animate-pulse" />
              </div>
            </div>
          </div>
        </div>

        {/* Wizard Navigation Footer */}
        <div className="border-t border-gray-200 dark:border-gray-700 px-6 py-4">
          <div className="flex items-center justify-between">
            {/* Previous button skeleton */}
            <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded w-20 animate-pulse" />
            
            {/* Navigation info skeleton */}
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-24 animate-pulse" />
            
            {/* Next/Complete button skeleton */}
            <div className="h-10 bg-primary-200 dark:bg-primary-700 rounded w-24 animate-pulse" />
          </div>
        </div>
      </div>

      {/* Help and Documentation Section Skeleton */}
      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
        <div className="flex items-start space-x-3">
          {/* Info icon skeleton */}
          <div className="h-5 w-5 bg-blue-200 dark:bg-blue-700 rounded animate-pulse mt-0.5" />
          
          <div className="space-y-2 flex-1">
            {/* Help title skeleton */}
            <div className="h-5 bg-blue-200 dark:bg-blue-700 rounded w-32 animate-pulse" />
            
            {/* Help text skeleton */}
            <div className="space-y-1">
              <div className="h-4 bg-blue-200 dark:bg-blue-700 rounded w-full animate-pulse" />
              <div className="h-4 bg-blue-200 dark:bg-blue-700 rounded w-3/4 animate-pulse" />
            </div>
            
            {/* Help link skeleton */}
            <div className="h-4 bg-blue-300 dark:bg-blue-600 rounded w-28 animate-pulse" />
          </div>
        </div>
      </div>

      {/* Loading timeout accessibility feature */}
      <div className="sr-only" aria-live="assertive">
        {/* This will be announced if loading takes longer than expected */}
        If the wizard takes more than 10 seconds to load, please refresh the page or check your network connection.
      </div>
    </div>
  );
}

/**
 * Loading component display name for React DevTools
 */
CreateServiceLoading.displayName = 'CreateServiceLoading';