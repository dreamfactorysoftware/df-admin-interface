"use client";

import React from "react";
import { cn } from "@/lib/utils";

/**
 * Next.js Loading UI Component for Profile Management Section
 * 
 * Implements accessible loading states with skeleton placeholders during profile data fetching.
 * Follows Next.js 15.1+ app router conventions with comprehensive WCAG 2.1 AA compliance.
 * 
 * Features:
 * - Skeleton UI placeholders for profile form tabs (Details, Security Question, Password)
 * - WCAG 2.1 AA accessibility with proper ARIA attributes and announcements
 * - Responsive design adapting to mobile, tablet, and desktop viewports
 * - Theme-aware styling matching application design system
 * - Smooth Tailwind CSS animations providing clear loading feedback
 * - Screen reader compatible with loading state announcements
 * 
 * @see Technical Specification Section 0.2.1 for Next.js app router architecture
 * @see Technical Specification Section 7.7.1 for WCAG 2.1 AA compliance requirements
 */

/**
 * Reusable skeleton component for form fields and content areas
 * Implements consistent loading animations with accessibility features
 */
interface SkeletonProps {
  /** CSS classes for custom styling */
  className?: string;
  /** Width variant for responsive design */
  width?: "full" | "3/4" | "1/2" | "1/3" | "1/4";
  /** Height variant for different content types */
  height?: "sm" | "md" | "lg" | "xl";
  /** Accessible label for screen readers */
  ariaLabel?: string;
}

function Skeleton({ 
  className, 
  width = "full", 
  height = "md",
  ariaLabel = "Loading content"
}: SkeletonProps) {
  const widthClasses = {
    full: "w-full",
    "3/4": "w-3/4",
    "1/2": "w-1/2", 
    "1/3": "w-1/3",
    "1/4": "w-1/4"
  };

  const heightClasses = {
    sm: "h-4",
    md: "h-6", 
    lg: "h-8",
    xl: "h-12"
  };

  return (
    <div
      className={cn(
        // Base skeleton styling with accessibility-compliant animations
        "animate-pulse bg-gray-200 dark:bg-gray-700 rounded-md",
        // Responsive width and height variants
        widthClasses[width],
        heightClasses[height],
        // Custom classes override
        className
      )}
      role="progressbar"
      aria-label={ariaLabel}
      aria-busy="true"
    />
  );
}

/**
 * Form field skeleton component matching profile form structure
 * Provides consistent loading placeholders for input fields and labels
 */
function FormFieldSkeleton({ 
  label, 
  required = false,
  type = "input"
}: {
  label: string;
  required?: boolean;
  type?: "input" | "textarea" | "select";
}) {
  const inputHeight = {
    input: "h-11", // 44px minimum touch target per WCAG guidelines
    textarea: "h-24",
    select: "h-11"
  };

  return (
    <div className="space-y-2" role="group" aria-label={`Loading ${label} field`}>
      {/* Label skeleton */}
      <div className="flex items-center gap-1">
        <Skeleton 
          width="1/4" 
          height="sm"
          ariaLabel={`Loading ${label} label`}
        />
        {required && (
          <div className="w-2 h-2 bg-red-400 rounded-full animate-pulse" />
        )}
      </div>
      
      {/* Input field skeleton */}
      <Skeleton 
        className={cn(
          "rounded-md border border-gray-200 dark:border-gray-600",
          inputHeight[type]
        )}
        ariaLabel={`Loading ${label} input field`}
      />
    </div>
  );
}

/**
 * Tab skeleton component for navigation tabs
 * Implements accessible tab loading with proper ARIA attributes
 */
function TabSkeleton({ 
  tabs 
}: { 
  tabs: Array<{ label: string; active?: boolean }> 
}) {
  return (
    <div 
      className="border-b border-gray-200 dark:border-gray-700 mb-6"
      role="tablist"
      aria-label="Loading profile management tabs"
    >
      <nav className="-mb-px flex space-x-8">
        {tabs.map((tab, index) => (
          <div
            key={index}
            role="tab"
            aria-selected={tab.active}
            aria-label={`Loading ${tab.label} tab`}
            className={cn(
              "py-2 px-1 border-b-2 font-medium text-sm whitespace-nowrap",
              tab.active
                ? "border-primary-500 text-primary-600 dark:text-primary-400"
                : "border-transparent text-gray-500 dark:text-gray-400"
            )}
          >
            <Skeleton 
              width="3/4" 
              height="sm"
              ariaLabel={`Loading ${tab.label} tab text`}
            />
          </div>
        ))}
      </nav>
    </div>
  );
}

/**
 * Action button skeleton for form submission buttons
 * Maintains consistent button sizing per WCAG touch target requirements
 */
function ActionButtonSkeleton({ 
  variant = "primary",
  children
}: {
  variant?: "primary" | "secondary";
  children: string;
}) {
  return (
    <Skeleton
      className={cn(
        // WCAG 2.1 AA minimum 44x44px touch targets
        "min-h-[44px] min-w-[44px] rounded-md",
        variant === "primary" 
          ? "bg-primary-200 dark:bg-primary-800" 
          : "bg-gray-200 dark:bg-gray-700",
        "px-4 py-2"
      )}
      width="1/4"
      ariaLabel={`Loading ${children} button`}
    />
  );
}

/**
 * Main Loading Component for Profile Management
 * 
 * Displays comprehensive loading states for all profile management sections
 * with proper accessibility and responsive design implementation
 */
export default function ProfileLoading() {
  const profileTabs = [
    { label: "Details", active: true },
    { label: "Security Question", active: false },
    { label: "Password", active: false }
  ];

  return (
    <div 
      className="max-w-4xl mx-auto p-4 sm:p-6 lg:p-8"
      role="main"
      aria-label="Loading profile management interface"
      aria-busy="true"
    >
      {/* Screen reader announcement for loading state */}
      <div 
        className="sr-only" 
        aria-live="polite" 
        aria-atomic="true"
      >
        Loading profile management interface. Please wait while we fetch your profile information.
      </div>

      {/* Page header skeleton */}
      <div className="mb-8">
        <Skeleton 
          width="1/3" 
          height="xl"
          className="mb-2"
          ariaLabel="Loading page title"
        />
        <Skeleton 
          width="1/2" 
          height="sm"
          ariaLabel="Loading page description"
        />
      </div>

      {/* Tab navigation skeleton */}
      <TabSkeleton tabs={profileTabs} />

      {/* Main content area with responsive layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8">
        
        {/* Profile form content - responsive layout */}
        <div className="lg:col-span-8">
          <div 
            className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700 p-6"
            role="region"
            aria-label="Loading profile form"
          >
            {/* Profile Details Tab Content */}
            <div className="space-y-6">
              {/* Basic Information Section */}
              <div>
                <Skeleton 
                  width="1/4" 
                  height="lg"
                  className="mb-4"
                  ariaLabel="Loading section title"
                />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormFieldSkeleton label="First Name" required />
                  <FormFieldSkeleton label="Last Name" required />
                  <FormFieldSkeleton label="Email Address" required type="input" />
                  <FormFieldSkeleton label="Phone Number" type="input" />
                </div>
              </div>

              {/* Additional Details Section */}
              <div>
                <Skeleton 
                  width="1/3" 
                  height="lg"
                  className="mb-4"
                  ariaLabel="Loading additional details section"
                />
                <div className="space-y-4">
                  <FormFieldSkeleton label="Display Name" type="input" />
                  <FormFieldSkeleton label="Default Role" type="select" />
                  <FormFieldSkeleton label="About" type="textarea" />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Profile sidebar - responsive layout */}
        <div className="lg:col-span-4">
          <div 
            className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700 p-6"
            role="complementary"
            aria-label="Loading profile information"
          >
            {/* Profile avatar section */}
            <div className="text-center mb-6">
              <Skeleton 
                className="w-24 h-24 rounded-full mx-auto mb-4"
                ariaLabel="Loading profile avatar"
              />
              <Skeleton 
                width="1/2" 
                height="md"
                className="mx-auto mb-2"
                ariaLabel="Loading user name"
              />
              <Skeleton 
                width="3/4" 
                height="sm"
                className="mx-auto"
                ariaLabel="Loading user role"
              />
            </div>

            {/* Quick actions */}
            <div className="space-y-3">
              <Skeleton 
                width="1/3" 
                height="md"
                className="mb-3"
                ariaLabel="Loading quick actions title"
              />
              <ActionButtonSkeleton variant="secondary">Change Avatar</ActionButtonSkeleton>
              <ActionButtonSkeleton variant="secondary">Download Data</ActionButtonSkeleton>
              <ActionButtonSkeleton variant="secondary">Account Settings</ActionButtonSkeleton>
            </div>
          </div>

          {/* Security overview */}
          <div 
            className="mt-6 bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700 p-6"
            role="region"
            aria-label="Loading security overview"
          >
            <Skeleton 
              width="1/2" 
              height="md"
              className="mb-4"
              ariaLabel="Loading security section title"
            />
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Skeleton width="1/2" height="sm" ariaLabel="Loading security item" />
                <Skeleton width="1/4" height="sm" ariaLabel="Loading security status" />
              </div>
              <div className="flex items-center justify-between">
                <Skeleton width="1/2" height="sm" ariaLabel="Loading security item" />
                <Skeleton width="1/4" height="sm" ariaLabel="Loading security status" />
              </div>
              <div className="flex items-center justify-between">
                <Skeleton width="1/2" height="sm" ariaLabel="Loading security item" />
                <Skeleton width="1/4" height="sm" ariaLabel="Loading security status" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Form actions */}
      <div 
        className="mt-8 flex flex-col sm:flex-row gap-3 justify-end"
        role="group"
        aria-label="Loading form actions"
      >
        <ActionButtonSkeleton variant="secondary">Cancel</ActionButtonSkeleton>
        <ActionButtonSkeleton variant="primary">Save Changes</ActionButtonSkeleton>
      </div>

      {/* Loading progress indicator for enhanced feedback */}
      <div 
        className="fixed bottom-4 right-4 bg-white dark:bg-gray-900 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 p-4 hidden sm:block"
        role="status"
        aria-live="polite"
      >
        <div className="flex items-center space-x-3">
          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-primary-600 dark:border-primary-400" />
          <span className="text-sm text-gray-600 dark:text-gray-400">
            Loading profile data...
          </span>
        </div>
      </div>
    </div>
  );
}