/**
 * Next.js Loading UI Component for Event Script Edit Route
 * 
 * Displays accessible skeleton placeholders and loading indicators during script data fetching
 * and form initialization operations. Implements WCAG 2.1 AA compliant loading states with
 * proper ARIA attributes, responsive design following Tailwind CSS patterns, and theme-aware
 * styling matching the application design system.
 * 
 * Features:
 * - Skeleton UI placeholders for script edit form fields
 * - Loading indicators for script content and code editor initialization
 * - Storage service configuration loading states
 * - Responsive design adapting to different viewport sizes
 * - Accessible ARIA live regions for screen reader compatibility
 * - Smooth loading transitions with theme-aware styling
 */

'use client';

import React from 'react';

/**
 * Accessible skeleton component for individual form fields and content areas
 * Implements WCAG 2.1 AA compliant loading states with proper contrast ratios
 */
interface SkeletonProps {
  className?: string;
  height?: 'sm' | 'md' | 'lg' | 'xl';
  variant?: 'text' | 'rectangular' | 'circular';
  animate?: boolean;
}

function Skeleton({ 
  className = '', 
  height = 'md', 
  variant = 'rectangular',
  animate = true 
}: SkeletonProps) {
  const baseClasses = 'bg-gray-200 dark:bg-gray-700 rounded';
  
  const heightClasses = {
    sm: 'h-4',
    md: 'h-6', 
    lg: 'h-10',
    xl: 'h-12'
  };
  
  const variantClasses = {
    text: 'rounded-sm',
    rectangular: 'rounded-md', 
    circular: 'rounded-full'
  };
  
  const animationClass = animate ? 'animate-pulse' : '';
  
  return (
    <div 
      className={`${baseClasses} ${heightClasses[height]} ${variantClasses[variant]} ${animationClass} ${className}`}
      role="presentation"
      aria-hidden="true"
    />
  );
}

/**
 * Loading spinner component for active loading states
 * Uses WCAG compliant colors and provides screen reader announcements
 */
function LoadingSpinner({ size = 'md', className = '' }: { size?: 'sm' | 'md' | 'lg'; className?: string }) {
  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-6 w-6', 
    lg: 'h-8 w-8'
  };
  
  return (
    <div 
      className={`animate-spin rounded-full border-2 border-gray-300 dark:border-gray-600 border-t-primary-600 dark:border-t-primary-500 ${sizeClasses[size]} ${className}`}
      role="status"
      aria-label="Loading script data"
    >
      <span className="sr-only">Loading script data...</span>
    </div>
  );
}

/**
 * Main loading component for the event script edit route
 * Provides comprehensive skeleton placeholders matching the script editing form structure
 */
export default function Loading() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* ARIA live region for screen reader announcements */}
      <div 
        aria-live="polite" 
        aria-atomic="true"
        className="sr-only"
      >
        Loading script editor...
      </div>
      
      {/* Page header skeleton */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-4 py-6 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
            {/* Breadcrumb skeleton */}
            <div className="flex items-center space-x-2">
              <Skeleton className="w-20 h-4" variant="text" />
              <span className="text-gray-400 dark:text-gray-500">/</span>
              <Skeleton className="w-32 h-4" variant="text" />
              <span className="text-gray-400 dark:text-gray-500">/</span>
              <Skeleton className="w-24 h-4" variant="text" />
            </div>
            
            {/* Action buttons skeleton */}
            <div className="flex space-x-3">
              <Skeleton className="w-20 h-10" />
              <Skeleton className="w-24 h-10" />
            </div>
          </div>
        </div>
      </div>

      {/* Main content area */}
      <div className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Main form area - takes up 2/3 on large screens */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* Script metadata form skeleton */}
            <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
              <div className="flex items-center justify-between mb-6">
                <Skeleton className="w-32 h-6" variant="text" />
                <LoadingSpinner size="sm" />
              </div>
              
              <div className="space-y-6">
                {/* Script name field skeleton */}
                <div>
                  <Skeleton className="w-20 h-4 mb-2" variant="text" />
                  <Skeleton className="w-full h-10" />
                  <Skeleton className="w-48 h-3 mt-1" variant="text" />
                </div>
                
                {/* Script type field skeleton */}
                <div>
                  <Skeleton className="w-24 h-4 mb-2" variant="text" />
                  <Skeleton className="w-full h-10" />
                </div>
                
                {/* Description field skeleton */}
                <div>
                  <Skeleton className="w-28 h-4 mb-2" variant="text" />
                  <Skeleton className="w-full h-24" />
                </div>
                
                {/* Event configuration skeleton */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <Skeleton className="w-16 h-4 mb-2" variant="text" />
                    <Skeleton className="w-full h-10" />
                  </div>
                  <div>
                    <Skeleton className="w-20 h-4 mb-2" variant="text" />
                    <Skeleton className="w-full h-10" />
                  </div>
                </div>
              </div>
            </div>

            {/* Script code editor skeleton */}
            <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
              <div className="flex items-center justify-between mb-4">
                <Skeleton className="w-28 h-6" variant="text" />
                <div className="flex items-center space-x-2">
                  <LoadingSpinner size="sm" />
                  <Skeleton className="w-16 h-4" variant="text" />
                </div>
              </div>
              
              {/* Code editor placeholder with proper dimensions */}
              <div className="border border-gray-200 dark:border-gray-600 rounded-md bg-gray-50 dark:bg-gray-900 p-4 min-h-[400px] relative">
                <div className="space-y-3">
                  {/* Simulate code lines */}
                  {Array.from({ length: 12 }).map((_, index) => (
                    <div key={index} className="flex items-center space-x-4">
                      <Skeleton className="w-6 h-4" variant="text" />
                      <Skeleton 
                        className={`h-4 ${
                          index % 3 === 0 ? 'w-3/4' : 
                          index % 3 === 1 ? 'w-1/2' : 'w-5/6'
                        }`} 
                        variant="text" 
                      />
                    </div>
                  ))}
                </div>
                
                {/* Editor loading overlay */}
                <div className="absolute inset-0 flex items-center justify-center bg-white/80 dark:bg-gray-800/80 rounded-md">
                  <div className="flex flex-col items-center space-y-2">
                    <LoadingSpinner size="lg" />
                    <span className="text-sm text-gray-600 dark:text-gray-400">
                      Initializing code editor...
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Sidebar configuration - takes up 1/3 on large screens */}
          <div className="space-y-6">
            
            {/* Storage service configuration skeleton */}
            <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
              <div className="flex items-center justify-between mb-4">
                <Skeleton className="w-32 h-5" variant="text" />
                <LoadingSpinner size="sm" />
              </div>
              
              <div className="space-y-4">
                <div>
                  <Skeleton className="w-20 h-4 mb-2" variant="text" />
                  <Skeleton className="w-full h-10" />
                </div>
                
                <div>
                  <Skeleton className="w-24 h-4 mb-2" variant="text" />
                  <Skeleton className="w-full h-10" />
                </div>
                
                {/* Storage service options */}
                <div className="space-y-2">
                  {Array.from({ length: 3 }).map((_, index) => (
                    <div key={index} className="flex items-center space-x-3">
                      <Skeleton className="w-4 h-4" variant="circular" />
                      <Skeleton className="w-20 h-4" variant="text" />
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Script settings skeleton */}
            <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
              <Skeleton className="w-28 h-5 mb-4" variant="text" />
              
              <div className="space-y-4">
                {/* Toggle settings */}
                {Array.from({ length: 4 }).map((_, index) => (
                  <div key={index} className="flex items-center justify-between">
                    <div className="space-y-1">
                      <Skeleton className="w-24 h-4" variant="text" />
                      <Skeleton className="w-32 h-3" variant="text" />
                    </div>
                    <Skeleton className="w-12 h-6" />
                  </div>
                ))}
              </div>
            </div>

            {/* Script actions skeleton */}
            <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
              <Skeleton className="w-20 h-5 mb-4" variant="text" />
              
              <div className="space-y-3">
                <Skeleton className="w-full h-10" />
                <Skeleton className="w-full h-10" />
                <div className="border-t border-gray-200 dark:border-gray-600 pt-3 mt-3">
                  <Skeleton className="w-full h-10" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Loading progress indicator - accessible to screen readers */}
      <div 
        role="progressbar" 
        aria-label="Loading script editor components"
        aria-valuetext="Loading in progress"
        className="sr-only"
      >
        Loading script editor components...
      </div>
    </div>
  );
}