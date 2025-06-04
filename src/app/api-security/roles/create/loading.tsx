/**
 * @fileoverview Loading component for role creation page
 * 
 * This component displays skeleton states and loading indicators while the role
 * creation form and its dependencies are being loaded. Follows Next.js app router
 * conventions and provides accessible skeleton UI patterns with WCAG 2.1 AA compliance.
 * 
 * Features:
 * - Skeleton UI patterns using Tailwind CSS animations
 * - Responsive design for all supported breakpoints
 * - Accessible loading states with proper ARIA attributes
 * - Form-specific loading patterns for role creation structure
 * - Smooth loading transitions and animations
 * 
 * @since 2024-01-15
 * @version 1.0.0
 */

import React from 'react';

/**
 * Skeleton component for individual form fields
 * Provides accessible loading state for input fields with proper ARIA attributes
 */
const FieldSkeleton: React.FC<{ 
  labelWidth?: string; 
  fieldHeight?: string;
  hasHelper?: boolean;
}> = ({ 
  labelWidth = 'w-24', 
  fieldHeight = 'h-10',
  hasHelper = false 
}) => (
  <div className="space-y-2" role="presentation">
    {/* Field label skeleton */}
    <div 
      className={`${labelWidth} h-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse`}
      aria-hidden="true"
    />
    {/* Field input skeleton */}
    <div 
      className={`w-full ${fieldHeight} bg-gray-100 dark:bg-gray-800 rounded-md border border-gray-200 dark:border-gray-700 animate-pulse`}
      aria-hidden="true"
    />
    {/* Helper text skeleton */}
    {hasHelper && (
      <div 
        className="w-3/4 h-3 bg-gray-100 dark:bg-gray-800 rounded animate-pulse"
        aria-hidden="true"
      />
    )}
  </div>
);

/**
 * Skeleton component for service access table
 * Mimics the structure of the role service access configuration table
 */
const ServiceAccessTableSkeleton: React.FC = () => (
  <div className="space-y-4" role="presentation">
    {/* Table header skeleton */}
    <div className="grid grid-cols-5 gap-4 p-4 bg-gray-50 dark:bg-gray-900 rounded-lg">
      {Array.from({ length: 5 }).map((_, index) => (
        <div 
          key={`header-${index}`}
          className="h-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"
          aria-hidden="true"
        />
      ))}
    </div>
    
    {/* Table rows skeleton */}
    {Array.from({ length: 6 }).map((_, rowIndex) => (
      <div 
        key={`row-${rowIndex}`}
        className="grid grid-cols-5 gap-4 p-4 border border-gray-200 dark:border-gray-700 rounded-lg"
      >
        {/* Service name */}
        <div 
          className="h-4 bg-gray-100 dark:bg-gray-800 rounded animate-pulse"
          aria-hidden="true"
        />
        {/* Permission checkboxes */}
        {Array.from({ length: 4 }).map((_, colIndex) => (
          <div 
            key={`checkbox-${rowIndex}-${colIndex}`}
            className="h-4 w-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse mx-auto"
            aria-hidden="true"
          />
        ))}
      </div>
    ))}
  </div>
);

/**
 * Skeleton component for lookup keys section
 * Provides loading state for role lookup key configuration
 */
const LookupKeysSkeleton: React.FC = () => (
  <div className="space-y-4" role="presentation">
    {/* Section title skeleton */}
    <div 
      className="w-32 h-5 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"
      aria-hidden="true"
    />
    
    {/* Lookup keys grid */}
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {Array.from({ length: 9 }).map((_, index) => (
        <div 
          key={`lookup-${index}`}
          className="p-3 border border-gray-200 dark:border-gray-700 rounded-lg space-y-2"
        >
          <div 
            className="w-3/4 h-4 bg-gray-100 dark:bg-gray-800 rounded animate-pulse"
            aria-hidden="true"
          />
          <div 
            className="w-full h-8 bg-gray-50 dark:bg-gray-900 rounded animate-pulse"
            aria-hidden="true"
          />
        </div>
      ))}
    </div>
  </div>
);

/**
 * Main loading component for role creation page
 * 
 * Displays comprehensive skeleton UI that matches the role creation form structure.
 * Provides accessible loading states with proper semantic HTML and ARIA attributes.
 * Uses Tailwind CSS animations for smooth loading transitions.
 * 
 * @returns {JSX.Element} The loading skeleton UI
 */
export default function RoleCreateLoading(): JSX.Element {
  return (
    <div 
      className="container mx-auto px-4 py-6 max-w-6xl animate-fade-in"
      role="status" 
      aria-label="Loading role creation form"
      aria-live="polite"
    >
      {/* Page header skeleton */}
      <header className="mb-8 space-y-4">
        {/* Breadcrumb skeleton */}
        <nav aria-label="Loading breadcrumb navigation">
          <div className="flex items-center space-x-2">
            <div 
              className="w-16 h-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"
              aria-hidden="true"
            />
            <div 
              className="w-1 h-4 bg-gray-300 dark:bg-gray-600 rounded"
              aria-hidden="true"
            />
            <div 
              className="w-12 h-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"
              aria-hidden="true"
            />
            <div 
              className="w-1 h-4 bg-gray-300 dark:bg-gray-600 rounded"
              aria-hidden="true"
            />
            <div 
              className="w-20 h-4 bg-gray-300 dark:bg-gray-600 rounded animate-pulse"
              aria-hidden="true"
            />
          </div>
        </nav>
        
        {/* Page title skeleton */}
        <div 
          className="w-48 h-8 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"
          aria-hidden="true"
        />
        
        {/* Page description skeleton */}
        <div className="space-y-2">
          <div 
            className="w-full max-w-2xl h-4 bg-gray-100 dark:bg-gray-800 rounded animate-pulse"
            aria-hidden="true"
          />
          <div 
            className="w-3/4 max-w-xl h-4 bg-gray-100 dark:bg-gray-800 rounded animate-pulse"
            aria-hidden="true"
          />
        </div>
      </header>

      {/* Main form skeleton */}
      <main className="space-y-8">
        {/* Basic role information section */}
        <section 
          className="bg-white dark:bg-gray-950 rounded-lg border border-gray-200 dark:border-gray-800 p-6 space-y-6"
          aria-label="Loading basic role information form"
        >
          {/* Section title skeleton */}
          <div 
            className="w-40 h-6 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"
            aria-hidden="true"
          />
          
          {/* Form fields grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <FieldSkeleton labelWidth="w-20" hasHelper={true} />
            <FieldSkeleton labelWidth="w-28" />
          </div>
          
          {/* Description field */}
          <FieldSkeleton 
            labelWidth="w-24" 
            fieldHeight="h-24"
            hasHelper={true}
          />
          
          {/* Toggle switches */}
          <div className="space-y-4">
            {Array.from({ length: 3 }).map((_, index) => (
              <div key={`toggle-${index}`} className="flex items-center justify-between">
                <div 
                  className="w-32 h-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"
                  aria-hidden="true"
                />
                <div 
                  className="w-11 h-6 bg-gray-300 dark:bg-gray-600 rounded-full animate-pulse"
                  aria-hidden="true"
                />
              </div>
            ))}
          </div>
        </section>

        {/* Service access configuration section */}
        <section 
          className="bg-white dark:bg-gray-950 rounded-lg border border-gray-200 dark:border-gray-800 p-6 space-y-6"
          aria-label="Loading service access configuration"
        >
          {/* Section title skeleton */}
          <div 
            className="w-48 h-6 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"
            aria-hidden="true"
          />
          
          {/* Service filter controls */}
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <FieldSkeleton labelWidth="w-20" />
            </div>
            <div className="flex-1">
              <FieldSkeleton labelWidth="w-16" />
            </div>
            <div className="sm:self-end">
              <div 
                className="w-24 h-10 bg-primary-200 dark:bg-primary-800 rounded-md animate-pulse"
                aria-hidden="true"
              />
            </div>
          </div>
          
          {/* Service access table */}
          <ServiceAccessTableSkeleton />
        </section>

        {/* Lookup keys configuration section */}
        <section 
          className="bg-white dark:bg-gray-950 rounded-lg border border-gray-200 dark:border-gray-800 p-6 space-y-6"
          aria-label="Loading lookup keys configuration"
        >
          <LookupKeysSkeleton />
        </section>

        {/* Action buttons skeleton */}
        <footer className="flex justify-end space-x-4 pt-6 border-t border-gray-200 dark:border-gray-800">
          <div 
            className="w-20 h-10 bg-gray-200 dark:bg-gray-700 rounded-md animate-pulse"
            aria-hidden="true"
          />
          <div 
            className="w-24 h-10 bg-primary-200 dark:bg-primary-800 rounded-md animate-pulse"
            aria-hidden="true"
          />
        </footer>
      </main>

      {/* Loading announcement for screen readers */}
      <div className="sr-only" aria-live="polite" aria-atomic="true">
        Loading role creation form. Please wait while we prepare the interface for creating a new role.
      </div>
    </div>
  );
}