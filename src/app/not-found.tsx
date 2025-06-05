import { Metadata } from 'next';
import Link from 'next/link';
import { Search, Home, ArrowLeft, Database, Shield, Settings, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Breadcrumbs } from '@/components/layout/breadcrumbs';

/**
 * SEO-optimized metadata for 404 not found page
 * Implements proper meta tags using Next.js metadata API for enhanced SEO
 */
export const metadata: Metadata = {
  title: '404 - Page Not Found | DreamFactory Admin Interface',
  description: 'The page you are looking for could not be found. Navigate back to the DreamFactory Admin dashboard or use the search to find what you need.',
  robots: {
    index: false,
    follow: true,
  },
  openGraph: {
    title: '404 - Page Not Found | DreamFactory Admin Interface',
    description: 'The page you are looking for could not be found. Navigate back to the DreamFactory Admin dashboard.',
    type: 'website',
  },
  twitter: {
    card: 'summary',
    title: '404 - Page Not Found | DreamFactory Admin Interface',
    description: 'The page you are looking for could not be found. Navigate back to the DreamFactory Admin dashboard.',
  },
  alternates: {
    canonical: '/not-found',
  },
};

/**
 * Quick navigation links for common DreamFactory admin tasks
 * Provides contextual navigation based on typical user workflows
 */
const quickLinks = [
  {
    href: '/api-connections/database',
    label: 'Database Services',
    description: 'Create and manage database connections',
    icon: Database,
    color: 'text-primary-600 dark:text-primary-400',
    bgColor: 'bg-primary-50 dark:bg-primary-900/20',
  },
  {
    href: '/api-security/roles',
    label: 'API Security',
    description: 'Manage roles and permissions',
    icon: Shield,
    color: 'text-success-600 dark:text-success-400',
    bgColor: 'bg-success-50 dark:bg-success-900/20',
  },
  {
    href: '/system-settings',
    label: 'System Settings',
    description: 'Configure system preferences',
    icon: Settings,
    color: 'text-secondary-600 dark:text-secondary-400',
    bgColor: 'bg-secondary-50 dark:bg-secondary-900/20',
  },
  {
    href: '/adf-api-docs',
    label: 'API Documentation',
    description: 'View generated API documentation',
    icon: FileText,
    color: 'text-warning-600 dark:text-warning-400',
    bgColor: 'bg-warning-50 dark:bg-warning-900/20',
  },
];

/**
 * Helpful suggestions for common user scenarios
 * Provides actionable guidance for typical 404 situations
 */
const helpfulSuggestions = [
  {
    title: 'Check the URL spelling',
    description: 'Verify that the URL is correctly typed and formatted.',
  },
  {
    title: 'Use the navigation menu',
    description: 'Browse through the main navigation to find what you need.',
  },
  {
    title: 'Search for content',
    description: 'Use the search functionality to locate specific features or documentation.',
  },
  {
    title: 'Go to dashboard',
    description: 'Return to the main dashboard to access all available features.',
  },
];

/**
 * Custom 404 Not Found page component for Next.js app router
 * 
 * Provides user-friendly error handling with comprehensive navigation suggestions,
 * breadcrumb context, and accessibility features. Implements SEO optimization
 * through Next.js metadata API and server-side rendering capabilities.
 * 
 * Features:
 * - WCAG 2.1 AA accessibility compliance with proper contrast ratios and screen reader support
 * - SEO-optimized meta tags for search engine handling of 404 errors
 * - Contextual navigation suggestions based on DreamFactory workflow patterns
 * - Breadcrumb navigation for location context
 * - Responsive design with Tailwind CSS matching application design system
 * - Focus management and keyboard navigation support
 * - Screen reader announcements and ARIA labeling
 * - Quick access links to common administrative tasks
 * - Error recovery guidance and user-friendly messaging
 * 
 * @returns JSX element representing the 404 error page
 */
export default function NotFoundPage() {
  return (
    <div className="min-h-screen bg-white dark:bg-gray-900">
      {/* Skip link for screen readers - WCAG 2.1 AA compliance */}
      <a
        href="#main-content"
        className="skip-link sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 bg-primary-600 text-white px-4 py-2 rounded-md z-50 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
      >
        Skip to main content
      </a>

      {/* Header with breadcrumb navigation for context */}
      <header 
        className="border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900"
        role="banner"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <Breadcrumbs 
            className="mb-2"
            showHomeIcon={true}
            maxItems={3}
          />
          <div className="flex items-center">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              Page Not Found
            </h1>
          </div>
        </div>
      </header>

      {/* Main content area with error message and navigation */}
      <main 
        id="main-content"
        className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12"
        role="main"
        aria-labelledby="error-heading"
      >
        {/* Error message section with 404 visual indicator */}
        <div className="text-center mb-12">
          {/* Large 404 visual with proper contrast ratios */}
          <div 
            className="text-6xl sm:text-8xl lg:text-9xl font-bold text-primary-100 dark:text-primary-900/30 select-none mb-4"
            aria-hidden="true"
          >
            404
          </div>
          
          {/* Primary error heading - WCAG 2.1 AA compliant */}
          <h1 
            id="error-heading"
            className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white mb-4"
          >
            Page Not Found
          </h1>
          
          {/* Descriptive error message with proper color contrast */}
          <p className="text-lg text-gray-600 dark:text-gray-300 mb-8 max-w-2xl mx-auto">
            The page you are looking for could not be found. It may have been moved, 
            deleted, or the URL might be incorrect. Let us help you get back on track.
          </p>

          {/* Screen reader announcement for error state */}
          <div 
            aria-live="polite" 
            aria-atomic="true" 
            className="sr-only"
          >
            Error: Page not found. Navigation options are available below.
          </div>
        </div>

        {/* Primary action buttons with accessibility features */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-12">
          <Button
            asChild
            variant="primary"
            size="lg"
            className="min-w-[180px]"
            aria-label="Return to dashboard home page"
          >
            <Link href="/">
              <Home className="mr-2 h-5 w-5" aria-hidden="true" />
              Go to Dashboard
            </Link>
          </Button>
          
          <Button
            asChild
            variant="outline"
            size="lg"
            className="min-w-[180px]"
            aria-label="Go back to previous page"
            onClick={() => {
              if (typeof window !== 'undefined' && window.history?.length > 1) {
                window.history.back();
              }
            }}
          >
            <Link href="javascript:history.back()">
              <ArrowLeft className="mr-2 h-5 w-5" aria-hidden="true" />
              Go Back
            </Link>
          </Button>
          
          <Button
            asChild
            variant="ghost"
            size="lg"
            className="min-w-[180px]"
            aria-label="Search for content in the application"
          >
            <Link href="/?search=true">
              <Search className="mr-2 h-5 w-5" aria-hidden="true" />
              Search
            </Link>
          </Button>
        </div>

        {/* Quick navigation links section */}
        <section 
          className="mb-12"
          aria-labelledby="quick-links-heading"
        >
          <h2 
            id="quick-links-heading"
            className="text-2xl font-semibold text-gray-900 dark:text-white text-center mb-8"
          >
            Quick Access
          </h2>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto">
            {quickLinks.map((link) => {
              const IconComponent = link.icon;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className="group block p-6 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 hover:border-primary-300 dark:hover:border-primary-600 transition-all duration-200 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 focus:ring-offset-white dark:focus:ring-offset-gray-900"
                  aria-label={`Navigate to ${link.label}: ${link.description}`}
                >
                  <div className={`inline-flex p-3 rounded-lg ${link.bgColor} mb-4`}>
                    <IconComponent 
                      className={`h-6 w-6 ${link.color}`}
                      aria-hidden="true"
                    />
                  </div>
                  
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors duration-200 mb-2">
                    {link.label}
                  </h3>
                  
                  <p className="text-sm text-gray-600 dark:text-gray-300">
                    {link.description}
                  </p>
                </Link>
              );
            })}
          </div>
        </section>

        {/* Helpful suggestions section */}
        <section 
          className="mb-12"
          aria-labelledby="suggestions-heading"
        >
          <h2 
            id="suggestions-heading"
            className="text-2xl font-semibold text-gray-900 dark:text-white text-center mb-8"
          >
            What Can You Do?
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
            {helpfulSuggestions.map((suggestion, index) => (
              <div 
                key={index}
                className="p-6 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700"
              >
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                  {suggestion.title}
                </h3>
                <p className="text-gray-600 dark:text-gray-300">
                  {suggestion.description}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* Additional help section */}
        <section 
          className="text-center p-8 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700"
          aria-labelledby="help-heading"
        >
          <h2 
            id="help-heading"
            className="text-xl font-semibold text-gray-900 dark:text-white mb-4"
          >
            Need Additional Help?
          </h2>
          
          <p className="text-gray-600 dark:text-gray-300 mb-6 max-w-2xl mx-auto">
            If you continue to experience issues or believe this is an error, 
            please check the application logs or contact your system administrator 
            for assistance with accessing the DreamFactory Admin Interface.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button
              asChild
              variant="outline"
              size="md"
              aria-label="Go to system information page for troubleshooting"
            >
              <Link href="/system-settings/system-info">
                View System Info
              </Link>
            </Button>
            
            <Button
              asChild
              variant="outline"
              size="md"
              aria-label="Access API documentation for reference"
            >
              <Link href="/adf-api-docs">
                API Documentation
              </Link>
            </Button>
          </div>
        </section>
      </main>

      {/* Footer with timestamp and additional context */}
      <footer 
        className="border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 py-8"
        role="contentinfo"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            DreamFactory Admin Interface | Error occurred on{' '}
            <time dateTime={new Date().toISOString()}>
              {new Date().toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
              })}
            </time>
          </p>
        </div>
      </footer>
    </div>
  );
}