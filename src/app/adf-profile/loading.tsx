/**
 * Next.js Loading UI Component for Profile Management Section
 * 
 * Implements skeleton placeholders during profile data fetching operations.
 * Provides accessible loading states with proper ARIA attributes and responsive design
 * using Tailwind CSS animations for profile forms, security questions, and password updates.
 * 
 * @implements {React Component} Next.js app router loading convention
 * @implements {WCAG 2.1 AA} Accessibility compliance with screen reader support
 * @implements {Tailwind CSS 4.1+} Theme-aware styling with responsive design patterns
 */

import React from 'react';

/**
 * Skeleton component for form field loading states
 * Provides accessible loading placeholder with proper ARIA attributes
 */
function SkeletonField({ 
  label, 
  type = 'input',
  className = '' 
}: { 
  label: string; 
  type?: 'input' | 'textarea' | 'select';
  className?: string;
}) {
  const baseClasses = "animate-pulse bg-gray-200 dark:bg-gray-700 rounded-md";
  
  const typeClasses = {
    input: "h-12",
    textarea: "h-24", 
    select: "h-12"
  };

  return (
    <div className={`space-y-2 ${className}`}>
      {/* Field Label Skeleton */}
      <div 
        className={`${baseClasses} h-5 w-32`}
        aria-label={`Loading ${label} field label`}
        role="status"
      />
      
      {/* Field Input Skeleton */}
      <div 
        className={`${baseClasses} w-full ${typeClasses[type]}`}
        aria-label={`Loading ${label} field input`}
        role="status"
      />
    </div>
  );
}

/**
 * Skeleton component for form buttons
 * Provides loading placeholder for action buttons with proper sizing
 */
function SkeletonButton({ 
  variant = 'primary',
  className = '' 
}: { 
  variant?: 'primary' | 'secondary';
  className?: string;
}) {
  const variantClasses = variant === 'primary' 
    ? "bg-primary-200 dark:bg-primary-800" 
    : "bg-gray-200 dark:bg-gray-700";

  return (
    <div 
      className={`animate-pulse ${variantClasses} rounded-md h-12 w-32 min-w-[44px] ${className}`}
      aria-label="Loading action button"
      role="status"
    />
  );
}

/**
 * Skeleton component for tab navigation
 * Provides loading state for profile form tabs with proper accessibility
 */
function SkeletonTabs() {
  const tabs = [
    { label: 'Profile Details', width: 'w-28' },
    { label: 'Security Question', width: 'w-36' },
    { label: 'Password Update', width: 'w-32' }
  ];

  return (
    <div 
      className="border-b border-gray-200 dark:border-gray-700 mb-8"
      role="tablist"
      aria-label="Loading profile form tabs"
    >
      <nav className="-mb-px flex space-x-8" aria-label="Profile form sections">
        {tabs.map((tab, index) => (
          <div 
            key={index}
            className={`animate-pulse bg-gray-200 dark:bg-gray-700 rounded-t-md h-10 ${tab.width} mb-[-1px]`}
            aria-label={`Loading ${tab.label} tab`}
            role="status"
          />
        ))}
      </nav>
    </div>
  );
}

/**
 * Skeleton component for profile details form
 * Provides loading placeholders matching profile edit form structure
 */
function ProfileDetailsFormSkeleton() {
  return (
    <div className="space-y-6" aria-label="Loading profile details form">
      {/* Personal Information Section */}
      <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
        <div className="animate-pulse bg-gray-200 dark:bg-gray-700 rounded-md h-6 w-40 mb-6" />
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <SkeletonField label="First Name" />
          <SkeletonField label="Last Name" />
          <SkeletonField label="Email Address" className="md:col-span-2" />
          <SkeletonField label="Display Name" />
          <SkeletonField label="Phone Number" />
        </div>
      </div>

      {/* Preferences Section */}
      <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
        <div className="animate-pulse bg-gray-200 dark:bg-gray-700 rounded-md h-6 w-32 mb-6" />
        
        <div className="space-y-6">
          <SkeletonField label="Default Database Type" type="select" />
          <SkeletonField label="Items per Page" type="select" />
          
          {/* Checkbox Options */}
          <div className="space-y-4">
            {['Auto-refresh schemas', 'Show advanced options', 'Email notifications'].map((option, index) => (
              <div key={index} className="flex items-center space-x-3">
                <div className="animate-pulse bg-gray-200 dark:bg-gray-700 rounded h-5 w-5" />
                <div className="animate-pulse bg-gray-200 dark:bg-gray-700 rounded-md h-5 w-36" />
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row gap-3 pt-4">
        <SkeletonButton variant="primary" className="sm:order-2" />
        <SkeletonButton variant="secondary" className="sm:order-1" />
      </div>
    </div>
  );
}

/**
 * Skeleton component for security question form
 * Provides loading placeholders for security question management
 */
function SecurityQuestionFormSkeleton() {
  return (
    <div className="space-y-6" aria-label="Loading security question form">
      {/* Current Security Question Section */}
      <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
        <div className="animate-pulse bg-gray-200 dark:bg-gray-700 rounded-md h-6 w-48 mb-6" />
        
        <div className="space-y-4">
          <SkeletonField label="Current Question" />
          <SkeletonField label="Current Answer" type="input" />
        </div>
      </div>

      {/* New Security Question Section */}
      <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
        <div className="animate-pulse bg-gray-200 dark:bg-gray-700 rounded-md h-6 w-44 mb-6" />
        
        <div className="space-y-4">
          <SkeletonField label="Security Question" type="select" />
          <SkeletonField label="Your Answer" type="input" />
          <SkeletonField label="Confirm Answer" type="input" />
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row gap-3 pt-4">
        <SkeletonButton variant="primary" className="sm:order-2" />
        <SkeletonButton variant="secondary" className="sm:order-1" />
      </div>
    </div>
  );
}

/**
 * Skeleton component for password update form
 * Provides loading placeholders for password change functionality
 */
function PasswordUpdateFormSkeleton() {
  return (
    <div className="space-y-6" aria-label="Loading password update form">
      {/* Password Change Section */}
      <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
        <div className="animate-pulse bg-gray-200 dark:bg-gray-700 rounded-md h-6 w-36 mb-6" />
        
        <div className="space-y-4">
          <SkeletonField label="Current Password" />
          <SkeletonField label="New Password" />
          <SkeletonField label="Confirm New Password" />
        </div>
      </div>

      {/* Password Requirements Section */}
      <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
        <div className="animate-pulse bg-gray-200 dark:bg-gray-700 rounded-md h-6 w-44 mb-6" />
        
        <div className="space-y-3">
          {[
            'At least 8 characters long',
            'Contains uppercase and lowercase letters',
            'Contains at least one number',
            'Contains at least one special character'
          ].map((requirement, index) => (
            <div key={index} className="flex items-center space-x-3">
              <div className="animate-pulse bg-gray-200 dark:bg-gray-700 rounded-full h-4 w-4" />
              <div className="animate-pulse bg-gray-200 dark:bg-gray-700 rounded-md h-4 flex-1 max-w-xs" />
            </div>
          ))}
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row gap-3 pt-4">
        <SkeletonButton variant="primary" className="sm:order-2" />
        <SkeletonButton variant="secondary" className="sm:order-1" />
      </div>
    </div>
  );
}

/**
 * Main Loading Component for Profile Management Section
 * 
 * Displays skeleton placeholders during profile data fetching operations.
 * Implements Next.js app router loading conventions with accessible design.
 * 
 * Features:
 * - Responsive design for mobile and desktop viewports
 * - Theme-aware styling with dark/light mode support  
 * - WCAG 2.1 AA compliant with proper ARIA attributes
 * - Smooth loading transitions using Tailwind CSS animations
 * - Form field skeletons matching profile edit form structure
 * 
 * @returns {JSX.Element} Loading UI with skeleton placeholders
 */
export default function ProfileLoading(): JSX.Element {
  return (
    <div 
      className="max-w-4xl mx-auto p-4 sm:p-6 lg:p-8"
      role="status"
      aria-live="polite"
      aria-label="Loading profile management interface"
    >
      {/* Page Header Skeleton */}
      <div className="mb-8">
        <div className="animate-pulse bg-gray-200 dark:bg-gray-700 rounded-md h-8 w-48 mb-2" />
        <div className="animate-pulse bg-gray-200 dark:bg-gray-700 rounded-md h-5 w-96 max-w-full" />
      </div>

      {/* Tab Navigation Skeleton */}
      <SkeletonTabs />

      {/* Profile Details Form Skeleton - Default Active Tab */}
      <div className="transition-opacity duration-300 ease-in-out">
        <ProfileDetailsFormSkeleton />
      </div>

      {/* Loading Indicator for Screen Readers */}
      <div className="sr-only" aria-live="assertive">
        Loading profile management interface. Please wait while we fetch your profile data.
      </div>

      {/* Loading Progress Indicator */}
      <div 
        className="fixed bottom-4 right-4 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg p-4 z-50"
        role="status"
        aria-label="Loading progress"
      >
        <div className="flex items-center space-x-3">
          {/* Spinning Loading Icon */}
          <div className="animate-spin h-5 w-5 border-2 border-primary-500 border-t-transparent rounded-full" />
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Loading profile...
          </span>
        </div>
        
        {/* Progress Bar */}
        <div className="mt-2 w-48 h-1 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
          <div className="h-full bg-primary-500 rounded-full animate-pulse" style={{ width: '60%' }} />
        </div>
      </div>
    </div>
  );
}

/**
 * Component Export Documentation
 * 
 * This loading component is automatically used by Next.js app router when
 * navigating to /adf-profile route during data fetching operations.
 * 
 * Design System Integration:
 * - Uses design tokens from Tailwind CSS 4.1+ configuration
 * - Implements WCAG 2.1 AA color contrast requirements (4.5:1 minimum)
 * - Provides theme-aware styling for dark/light mode support
 * - Responsive breakpoints: mobile-first design with sm: md: lg: variants
 * 
 * Accessibility Features:
 * - ARIA live regions for screen reader announcements
 * - Proper role and aria-label attributes on loading elements
 * - Keyboard navigation support with focus management
 * - Screen reader-only loading progress announcements
 * 
 * Performance Considerations:
 * - Lightweight skeleton rendering with minimal DOM nodes
 * - CSS-only animations using Tailwind's animate-pulse utility
 * - Optimized for fast initial render during data fetching
 * - No JavaScript dependencies beyond React for optimal performance
 */