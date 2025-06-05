/**
 * LicenseExpired Component
 * 
 * React 19 license expiration notice component migrated from Angular df-license-expired.
 * Displays a full-screen centered notification when the DreamFactory subscription has expired,
 * using internationalization for header and subheader messages. Implements WCAG 2.1 AA 
 * accessibility with proper semantic HTML, ARIA attributes, and keyboard navigation.
 * 
 * Features:
 * - WCAG 2.1 AA compliant with proper semantic HTML structure
 * - Responsive design with Tailwind CSS utility classes
 * - Dark/light theme support with proper color contrast ratios
 * - Internationalization support maintaining Angular translation keys
 * - TypeScript 5.8+ strict typing with React 19 forwardRef
 * - Keyboard navigation and screen reader support
 * 
 * @fileoverview License expiration notice component for DreamFactory Admin Interface
 * @version 1.0.0
 */

'use client';

import React, { forwardRef, useEffect, useState } from 'react';
import { cn } from '@/lib/utils';
import type { LicenseExpiredProps } from './types';

/**
 * Simple translation hook placeholder - can be replaced with actual i18n implementation
 * Maintains compatibility with Angular Transloco translation keys
 */
function useTranslations() {
  // This will be replaced with the actual Next.js i18n implementation
  // For now, providing fallback translations that match the Angular keys
  const translations = {
    'licenseExpired.header': 'License Expired',
    'licenseExpired.subHeader': 'Your DreamFactory license has expired. Please contact support to renew your subscription.',
  };

  return (key: string) => translations[key as keyof typeof translations] || key;
}

/**
 * LicenseExpired Component
 * 
 * Displays a centered notice when the DreamFactory license has expired.
 * Maintains exact functionality from Angular implementation while adding
 * React 19 features and WCAG 2.1 AA accessibility compliance.
 */
export const LicenseExpired = forwardRef<HTMLDivElement, LicenseExpiredProps>(
  (
    {
      className,
      variant = 'expired',
      size = 'default',
      theme = 'system',
      dismissible = false,
      showCloseButton = false,
      position = 'center',
      licenseInfo,
      actions = [],
      content,
      onDismiss,
      onMount,
      onUnmount,
      'data-testid': testId = 'license-expired',
      ...props
    },
    ref
  ) => {
    const t = useTranslations();
    const [mounted, setMounted] = useState(false);
    const [dismissed, setDismissed] = useState(false);

    // Handle component mount lifecycle
    useEffect(() => {
      setMounted(true);
      onMount?.();
      
      // Announce to screen readers when component mounts
      const announcement = document.createElement('div');
      announcement.setAttribute('aria-live', 'assertive');
      announcement.setAttribute('aria-atomic', 'true');
      announcement.className = 'sr-only';
      announcement.textContent = `${t('licenseExpired.header')}: ${t('licenseExpired.subHeader')}`;
      document.body.appendChild(announcement);
      
      // Clean up announcement after screen reader has time to read it
      const cleanup = setTimeout(() => {
        if (document.body.contains(announcement)) {
          document.body.removeChild(announcement);
        }
      }, 1000);

      return () => {
        clearTimeout(cleanup);
        if (document.body.contains(announcement)) {
          document.body.removeChild(announcement);
        }
        onUnmount?.();
      };
    }, [t, onMount, onUnmount]);

    // Handle dismissal
    const handleDismiss = () => {
      if (dismissible && onDismiss) {
        setDismissed(true);
        onDismiss();
      }
    };

    // Handle keyboard navigation
    const handleKeyDown = (event: React.KeyboardEvent) => {
      // Allow escape key to dismiss if dismissible
      if (event.key === 'Escape' && dismissible) {
        handleDismiss();
      }
      
      // Focus management for actions
      if (event.key === 'Tab' && actions.length > 0) {
        // Let browser handle default tab behavior for now
        // More complex focus management can be added if needed
      }
    };

    // Don't render if dismissed or not mounted (prevents hydration mismatch)
    if (!mounted || dismissed) {
      return null;
    }

    // Base container classes with accessibility and responsive design
    const containerClasses = cn(
      // Layout: Flexbox with centering
      'flex flex-col items-center justify-center',
      
      // Sizing: Full viewport height by default, responsive adjustments
      position === 'center' && 'min-h-screen',
      position === 'banner' && 'py-8',
      position === 'top' && 'pt-16 pb-8',
      position === 'bottom' && 'pt-8 pb-16',
      
      // Spacing: Responsive padding
      'px-4 sm:px-6 lg:px-8',
      
      // Background: Theme-aware with proper contrast
      'bg-white dark:bg-gray-900',
      
      // Text: Default text styling
      'text-gray-900 dark:text-gray-100',
      
      // Size variants
      size === 'compact' && 'py-4',
      size === 'default' && 'py-8',
      size === 'expanded' && 'py-12',
      
      // Focus management
      'focus-within:outline-none',
      
      // Custom className override
      className
    );

    // Header styling with WCAG compliance
    const headerClasses = cn(
      // Typography: Large, bold text
      'text-2xl sm:text-3xl lg:text-4xl font-bold',
      
      // Spacing: Bottom margin
      'mb-4',
      
      // Text alignment
      'text-center',
      
      // Color: High contrast for accessibility
      'text-gray-900 dark:text-white',
      
      // Responsive adjustments
      'max-w-4xl mx-auto'
    );

    // Subheader styling with proper contrast
    const subHeaderClasses = cn(
      // Typography: Medium text, readable line height
      'text-lg sm:text-xl',
      'leading-relaxed',
      
      // Spacing: Centered with max width
      'text-center max-w-2xl mx-auto',
      
      // Color: Slightly muted but still accessible contrast
      'text-gray-700 dark:text-gray-300',
      
      // Bottom margin for actions
      actions.length > 0 && 'mb-8'
    );

    // Actions container styling
    const actionsClasses = cn(
      'flex flex-col sm:flex-row gap-4 justify-center items-center',
      'mt-8'
    );

    return (
      <main
        ref={ref}
        className={containerClasses}
        role="main"
        aria-labelledby="license-expired-heading"
        aria-describedby="license-expired-description"
        data-testid={testId}
        onKeyDown={handleKeyDown}
        {...props}
      >
        {/* Main content article for semantic structure */}
        <article className="text-center max-w-4xl mx-auto">
          {/* Primary heading with proper semantic level */}
          <h1
            id="license-expired-heading"
            className={headerClasses}
          >
            {content?.title || t('licenseExpired.header')}
          </h1>

          {/* Descriptive subheading */}
          <h2
            id="license-expired-description"
            className={subHeaderClasses}
          >
            {content?.description || t('licenseExpired.subHeader')}
          </h2>

          {/* Custom content if provided */}
          {content?.customMessage && (
            <div className="mt-6 text-center">
              {content.customMessage}
            </div>
          )}

          {/* License information if provided */}
          {licenseInfo && (
            <div className="mt-6 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <p className="text-sm text-gray-600 dark:text-gray-400">
                License: {licenseInfo.planName} - Status: {licenseInfo.status}
              </p>
              {licenseInfo.expirationDate && (
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                  Expired: {licenseInfo.expirationDate.toLocaleDateString()}
                </p>
              )}
            </div>
          )}

          {/* Action buttons if provided */}
          {actions.length > 0 && (
            <div className={actionsClasses} role="group" aria-label="License actions">
              {actions.map((action) => (
                <button
                  key={action.id}
                  type="button"
                  className={cn(
                    // Base button styling
                    'inline-flex items-center justify-center',
                    'px-6 py-3 text-base font-medium rounded-md',
                    'transition-colors duration-200',
                    
                    // WCAG compliance: minimum touch target size
                    'min-h-[44px] min-w-[44px]',
                    
                    // Focus styling for accessibility
                    'focus:outline-none focus:ring-2 focus:ring-offset-2',
                    'focus:ring-primary-500 dark:focus:ring-primary-400',
                    
                    // Action type styling
                    action.type === 'primary' && [
                      'bg-primary-600 text-white',
                      'hover:bg-primary-700 active:bg-primary-800',
                      'border border-transparent'
                    ],
                    action.type === 'secondary' && [
                      'bg-gray-100 text-gray-900 dark:bg-gray-700 dark:text-gray-100',
                      'hover:bg-gray-200 dark:hover:bg-gray-600',
                      'border border-gray-300 dark:border-gray-600'
                    ],
                    action.type === 'outline' && [
                      'bg-transparent text-primary-600 dark:text-primary-400',
                      'hover:bg-primary-50 dark:hover:bg-gray-800',
                      'border-2 border-primary-600 dark:border-primary-400'
                    ],
                    action.type === 'ghost' && [
                      'bg-transparent text-gray-700 dark:text-gray-300',
                      'hover:bg-gray-100 dark:hover:bg-gray-800',
                      'border border-transparent'
                    ],
                    
                    // Disabled state
                    action.disabled && 'opacity-50 pointer-events-none cursor-not-allowed'
                  )}
                  onClick={action.onClick}
                  disabled={action.disabled || action.loading}
                  aria-label={action.ariaLabel || action.label}
                >
                  {/* Icon if provided */}
                  {action.icon && (
                    <span className="mr-2" aria-hidden="true">
                      {action.icon}
                    </span>
                  )}
                  
                  {/* Button text */}
                  {action.loading ? 'Loading...' : action.label}
                  
                  {/* Loading indicator if needed */}
                  {action.loading && (
                    <span
                      className="ml-2 w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin"
                      aria-hidden="true"
                    />
                  )}
                </button>
              ))}
            </div>
          )}

          {/* Dismiss button if dismissible */}
          {dismissible && showCloseButton && (
            <button
              type="button"
              className={cn(
                'absolute top-4 right-4 p-2 rounded-md',
                'text-gray-400 hover:text-gray-600',
                'dark:text-gray-500 dark:hover:text-gray-300',
                'focus:outline-none focus:ring-2 focus:ring-primary-500',
                'transition-colors duration-200'
              )}
              onClick={handleDismiss}
              aria-label="Dismiss license notice"
            >
              <span className="sr-only">Close</span>
              {/* Simple X icon using CSS */}
              <span
                className="block w-6 h-6 relative"
                aria-hidden="true"
              >
                <span className="absolute inset-0 w-6 h-0.5 bg-current transform rotate-45 top-3" />
                <span className="absolute inset-0 w-6 h-0.5 bg-current transform -rotate-45 top-3" />
              </span>
            </button>
          )}

          {/* Custom footer content */}
          {content?.footer && (
            <footer className="mt-8 text-center">
              {content.footer}
            </footer>
          )}
        </article>

        {/* Skip link for keyboard users */}
        {actions.length > 0 && (
          <a
            href="#license-expired-actions"
            className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 bg-primary-600 text-white px-4 py-2 rounded-md z-50"
          >
            Skip to license actions
          </a>
        )}
      </main>
    );
  }
);

LicenseExpired.displayName = 'LicenseExpired';

export default LicenseExpired;