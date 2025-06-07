/**
 * LicenseExpired Component for DreamFactory Admin Interface
 * 
 * React 19 component replacing Angular df-license-expired. Displays a full-screen
 * centered notification when the DreamFactory subscription has expired, using
 * Next.js i18n for translation support and Tailwind CSS for responsive design.
 * 
 * Implements WCAG 2.1 AA accessibility compliance with proper semantic HTML,
 * ARIA attributes, and keyboard navigation. Supports both light and dark themes
 * with appropriate color contrast ratios per accessibility requirements.
 * 
 * @fileoverview License expiration notice component
 * @version 2.0.0
 * @since React 19 migration
 */

'use client';

import React, { forwardRef, useEffect } from 'react';
import { LicenseExpiredProps } from './types';
import { BaseComponent } from '@/types/ui';

// ============================================================================
// TEMPORARY INTERFACE FOR useTranslation HOOK
// ============================================================================

/**
 * Temporary interface for Next.js i18n translation hook
 * Following Next.js internationalization patterns until the actual hook is implemented
 */
interface UseTranslationResult {
  t: (key: string, options?: Record<string, any>) => string;
  locale: string;
  isLoading: boolean;
}

/**
 * Temporary implementation of useTranslation hook
 * This will be replaced with the actual Next.js i18n implementation
 */
const useTranslation = (namespace?: string): UseTranslationResult => {
  // Fallback translations matching Angular Transloco keys
  const translations: Record<string, string> = {
    'licenseExpired.header': 'Your DreamFactory subscription has expired.',
    'licenseExpired.subHeader': 'Please contact dspsales@dreamfactory.com to renew your subscription.',
  };

  return {
    t: (key: string, options?: Record<string, any>) => {
      const translation = translations[key] || key;
      
      // Handle interpolation if options are provided
      if (options) {
        return Object.keys(options).reduce((result, optionKey) => {
          return result.replace(new RegExp(`{{${optionKey}}}`, 'g'), String(options[optionKey]));
        }, translation);
      }
      
      return translation;
    },
    locale: 'en',
    isLoading: false,
  };
};

// ============================================================================
// COMPONENT STYLING CONFIGURATION
// ============================================================================

/**
 * Tailwind CSS classes for license expired component
 * Replaces SCSS .notice-container flexbox layout with utility classes
 */
const componentStyles = {
  // Main container replacing .notice-container with full-screen centering
  container: [
    // Layout - Full screen flex container
    'flex',
    'flex-col',
    'h-full',
    'min-h-screen',
    'w-full',
    
    // Centering content
    'justify-center',
    'items-center',
    
    // Padding for mobile safety
    'px-4',
    'py-8',
    'sm:px-6',
    'md:px-8',
    'lg:px-12',
    
    // Background with theme support
    'bg-white',
    'dark:bg-gray-950',
    
    // Smooth transitions
    'transition-colors',
    'duration-300',
    
    // Focus management for accessibility
    'focus-within:outline-none',
  ].join(' '),
  
  // Article wrapper for semantic HTML
  article: [
    // Layout
    'flex',
    'flex-col',
    'items-center',
    'justify-center',
    'max-w-2xl',
    'w-full',
    'text-center',
    
    // Spacing
    'space-y-6',
    'sm:space-y-8',
    
    // Background and borders for card-like appearance
    'bg-white',
    'dark:bg-gray-900',
    'border',
    'border-gray-200',
    'dark:border-gray-800',
    'rounded-xl',
    'shadow-lg',
    'dark:shadow-2xl',
    
    // Padding
    'p-8',
    'sm:p-12',
    'lg:p-16',
    
    // Responsive design
    'mx-auto',
    
    // Animation
    'animate-fade-in',
    
    // Hover effects for interactivity
    'hover:shadow-xl',
    'dark:hover:shadow-3xl',
    
    // Transitions
    'transition-all',
    'duration-300',
  ].join(' '),
  
  // Warning icon container
  iconContainer: [
    // Layout
    'flex',
    'items-center',
    'justify-center',
    'w-20',
    'h-20',
    'sm:w-24',
    'sm:h-24',
    'mx-auto',
    'mb-6',
    
    // Background with warning colors
    'bg-red-100',
    'dark:bg-red-900/30',
    'border-2',
    'border-red-200',
    'dark:border-red-800',
    'rounded-full',
    
    // Animation
    'animate-pulse-slow',
    
    // Accessibility - proper contrast
    'ring-2',
    'ring-red-500/20',
    'dark:ring-red-400/30',
  ].join(' '),
  
  // Primary header styles (h1)
  header: [
    // Typography
    'text-2xl',
    'sm:text-3xl',
    'lg:text-4xl',
    'font-bold',
    'leading-tight',
    
    // Colors with proper contrast for accessibility
    'text-red-700',
    'dark:text-red-400',
    
    // Spacing
    'mb-4',
    
    // Responsive design
    'text-center',
    
    // Accessibility - large text threshold met (24px)
    'lg:text-4xl', // 36px
    
    // Animation
    'fade-in',
  ].join(' '),
  
  // Subheader styles (h2)
  subheader: [
    // Typography
    'text-base',
    'sm:text-lg',
    'lg:text-xl',
    'font-medium',
    'leading-relaxed',
    
    // Colors with proper contrast
    'text-gray-700',
    'dark:text-gray-300',
    
    // Spacing
    'mb-8',
    
    // Responsive design
    'text-center',
    'max-w-lg',
    'mx-auto',
    
    // Line height for readability
    'leading-7',
    'sm:leading-8',
  ].join(' '),
  
  // Contact information highlighting
  contactInfo: [
    // Typography
    'font-semibold',
    'text-blue-600',
    'dark:text-blue-400',
    
    // Interactive states
    'hover:text-blue-700',
    'dark:hover:text-blue-300',
    'focus:text-blue-800',
    'dark:focus:text-blue-200',
    
    // Underline for links
    'underline',
    'decoration-2',
    'underline-offset-2',
    
    // Transitions
    'transition-colors',
    'duration-200',
  ].join(' '),
};

// ============================================================================
// WARNING ICON COMPONENT
// ============================================================================

/**
 * Warning icon SVG component with accessibility features
 * Provides visual indication of license expiration status
 */
const WarningIcon: React.FC<{ className?: string }> = ({ className = '' }) => (
  <svg
    className={`w-10 h-10 sm:w-12 sm:h-12 text-red-500 dark:text-red-400 ${className}`}
    fill="currentColor"
    viewBox="0 0 24 24"
    xmlns="http://www.w3.org/2000/svg"
    aria-hidden="true"
    role="img"
  >
    <path
      fillRule="evenodd"
      d="M9.401 3.003c1.155-2 4.043-2 5.197 0l7.355 12.748c1.154 2-.29 4.5-2.599 4.5H4.645c-2.309 0-3.752-2.5-2.598-4.5L9.4 3.003zM12 8.25a.75.75 0 01.75.75v3.75a.75.75 0 01-1.5 0V9a.75.75 0 01.75-.75zm0 8.25a.75.75 0 100-1.5.75.75 0 000 1.5z"
      clipRule="evenodd"
    />
  </svg>
);

// ============================================================================
// MAIN COMPONENT
// ============================================================================

/**
 * LicenseExpired component with comprehensive accessibility and theming support
 * 
 * Replaces Angular df-license-expired component with React 19 implementation
 * using Next.js i18n, Tailwind CSS, and WCAG 2.1 AA compliance.
 */
const LicenseExpired = forwardRef<HTMLElement, LicenseExpiredProps>(
  (
    {
      // Core configuration
      theme = 'system',
      severity = 'critical',
      context = 'subscription-lapsed',
      displayMode = 'modal',
      
      // Content configuration
      title,
      message,
      
      // Visual configuration
      size = 'md',
      variant = 'error',
      showIcon = true,
      animated = true,
      
      // Behavior configuration
      dismissible = false,
      
      // Accessibility configuration
      role = 'alert',
      'aria-live': ariaLive = 'assertive',
      'aria-atomic': ariaAtomic = true,
      'aria-label': ariaLabel,
      'aria-describedby': ariaDescribedBy,
      announceToScreenReader = true,
      screenReaderText,
      
      // Styling
      className = '',
      classNames = {},
      
      // Testing and development
      'data-testid': testId = 'license-expired',
      debug = false,
      
      // Standard HTML attributes
      id,
      ...rest
    },
    ref
  ) => {
    // ========================================================================
    // HOOKS AND STATE
    // ========================================================================
    
    const { t } = useTranslation();
    
    // ========================================================================
    // COMPUTED VALUES
    // ========================================================================
    
    // Determine display texts from props or translations
    const displayTitle = title || t('licenseExpired.header');
    const displayMessage = message || t('licenseExpired.subHeader');
    
    // Generate screen reader announcement
    const screenReaderAnnouncement = screenReaderText || 
      `${displayTitle} ${displayMessage}`;
    
    // Generate unique IDs for accessibility
    const headerId = `${testId}-header`;
    const messageId = `${testId}-message`;
    const announcementId = `${testId}-announcement`;
    
    // ========================================================================
    // ACCESSIBILITY EFFECTS
    // ========================================================================
    
    /**
     * Announce license expiration to screen readers on component mount
     * Follows WCAG 2.1 guidelines for critical notifications
     */
    useEffect(() => {
      if (announceToScreenReader && screenReaderAnnouncement) {
        // Create temporary element for screen reader announcement
        const announcement = document.createElement('div');
        announcement.setAttribute('aria-live', ariaLive);
        announcement.setAttribute('aria-atomic', 'true');
        announcement.setAttribute('class', 'sr-only');
        announcement.textContent = screenReaderAnnouncement;
        
        document.body.appendChild(announcement);
        
        // Remove after announcement
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
        };
      }
    }, [announceToScreenReader, screenReaderAnnouncement, ariaLive]);
    
    /**
     * Log debug information in development mode
     */
    useEffect(() => {
      if (debug && process.env.NODE_ENV === 'development') {
        console.group('🔒 LicenseExpired Component Debug');
        console.log('Props:', {
          theme,
          severity,
          context,
          displayMode,
          title: displayTitle,
          message: displayMessage,
        });
        console.log('Accessibility:', {
          role,
          ariaLive,
          ariaAtomic,
          ariaLabel,
          ariaDescribedBy,
          announceToScreenReader,
        });
        console.groupEnd();
      }
    }, [
      debug,
      theme,
      severity,
      context,
      displayMode,
      displayTitle,
      displayMessage,
      role,
      ariaLive,
      ariaAtomic,
      ariaLabel,
      ariaDescribedBy,
      announceToScreenReader,
    ]);
    
    // ========================================================================
    // COMPONENT RENDER
    // ========================================================================
    
    return (
      <main
        ref={ref}
        id={id}
        className={`${componentStyles.container} ${classNames.container || ''} ${className}`}
        role={role}
        aria-live={ariaLive}
        aria-atomic={ariaAtomic}
        aria-label={ariaLabel || `License expiration notice: ${displayTitle}`}
        aria-describedby={ariaDescribedBy || `${headerId} ${messageId}`}
        data-testid={testId}
        data-theme={theme}
        data-severity={severity}
        data-context={context}
        data-display-mode={displayMode}
        {...rest}
      >
        {/* Screen reader only announcement element */}
        <div
          id={announcementId}
          className="sr-only"
          aria-live={ariaLive}
          aria-atomic={ariaAtomic}
        >
          {screenReaderAnnouncement}
        </div>
        
        {/* Main content article */}
        <article
          className={`${componentStyles.article} ${classNames.content || ''}`}
          aria-labelledby={headerId}
          aria-describedby={messageId}
        >
          {/* Warning icon */}
          {showIcon && (
            <div
              className={`${componentStyles.iconContainer} ${classNames.icon || ''}`}
              aria-hidden="true"
              role="presentation"
            >
              <WarningIcon />
            </div>
          )}
          
          {/* Primary header */}
          <h1
            id={headerId}
            className={`${componentStyles.header} ${classNames.title || ''}`}
            role="heading"
            aria-level={1}
          >
            {displayTitle}
          </h1>
          
          {/* Subheader with enhanced contact information */}
          <h2
            id={messageId}
            className={`${componentStyles.subheader} ${classNames.message || ''}`}
            role="heading"
            aria-level={2}
          >
            {/* Parse and enhance the message to highlight contact information */}
            {displayMessage.includes('dspsales@dreamfactory.com') ? (
              <>
                {displayMessage.split('dspsales@dreamfactory.com')[0]}
                <a
                  href="mailto:dspsales@dreamfactory.com"
                  className={componentStyles.contactInfo}
                  aria-label="Contact DreamFactory sales team via email"
                  role="link"
                  rel="noopener noreferrer"
                >
                  dspsales@dreamfactory.com
                </a>
                {displayMessage.split('dspsales@dreamfactory.com')[1]}
              </>
            ) : (
              displayMessage
            )}
          </h2>
          
          {/* Additional help text or actions could be added here */}
          
          {/* Focus trap end marker for screen readers */}
          <div
            className="sr-only"
            tabIndex={0}
            aria-label="End of license expiration notice"
          />
        </article>
      </main>
    );
  }
);

// ============================================================================
// COMPONENT CONFIGURATION
// ============================================================================

LicenseExpired.displayName = 'LicenseExpired';

// ============================================================================
// EXPORTS
// ============================================================================

export default LicenseExpired;
export { LicenseExpired };
export type { LicenseExpiredProps };

/**
 * Default props configuration for the license expired component
 * Provides sensible defaults while maintaining flexibility
 */
export const defaultLicenseExpiredProps: Partial<LicenseExpiredProps> = {
  theme: 'system',
  severity: 'critical',
  context: 'subscription-lapsed',
  displayMode: 'modal',
  size: 'md',
  variant: 'error',
  showIcon: true,
  animated: true,
  dismissible: false,
  role: 'alert',
  'aria-live': 'assertive',
  'aria-atomic': true,
  announceToScreenReader: true,
  'data-testid': 'license-expired',
  debug: false,
};

/**
 * Component metadata for development and documentation
 */
export const LicenseExpiredMetadata = {
  name: 'LicenseExpired',
  version: '2.0.0',
  description: 'License expiration notice component for DreamFactory Admin Interface',
  framework: 'React 19',
  styling: 'Tailwind CSS 4.1+',
  accessibility: 'WCAG 2.1 AA compliant',
  i18n: 'Next.js internationalization',
  migration: {
    from: 'Angular df-license-expired component',
    translationKeys: ['licenseExpired.header', 'licenseExpired.subHeader'],
    maintainedFeatures: [
      'Full-screen centered layout',
      'Internationalization support',
      'Header and subheader display',
      'Responsive design',
    ],
    enhancedFeatures: [
      'WCAG 2.1 AA accessibility compliance',
      'Dark mode support',
      'TypeScript type safety',
      'Screen reader announcements',
      'Semantic HTML structure',
      'Enhanced contact information highlighting',
      'Comprehensive testing attributes',
    ],
  },
  dependencies: {
    react: '^19.0.0',
    'next': '^15.1.0',
    'tailwindcss': '^4.1.0',
    'typescript': '^5.8.0',
  },
  browserSupport: [
    'Chrome >= 90',
    'Firefox >= 88',
    'Safari >= 14',
    'Edge >= 90',
  ],
  testingSupport: {
    framework: 'Vitest',
    utilities: '@testing-library/react',
    mocking: 'Mock Service Worker (MSW)',
    coverage: '90%+ target',
  },
};