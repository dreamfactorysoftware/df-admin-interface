import { Metadata } from 'next';
import Link from 'next/link';
import { HomeIcon, DatabaseIcon, CogIcon, ShieldCheckIcon, HelpCircleIcon } from 'lucide-react';

// SEO-optimized metadata for 404 pages
export const metadata: Metadata = {
  title: '404 - Page Not Found | DreamFactory Admin',
  description: 'The requested page could not be found. Navigate back to the DreamFactory Admin dashboard or explore our available database API management features.',
  robots: 'noindex, nofollow', // Prevent search engines from indexing 404 pages
  openGraph: {
    title: '404 - Page Not Found | DreamFactory Admin',
    description: 'The requested page could not be found in the DreamFactory Admin interface.',
    type: 'website',
  },
  twitter: {
    card: 'summary',
    title: '404 - Page Not Found | DreamFactory Admin',
    description: 'The requested page could not be found in the DreamFactory Admin interface.',
  },
};

/**
 * Not Found Page Component
 * 
 * Next.js app router not-found page that provides user-friendly 404 messaging
 * with navigation suggestions and breadcrumb context. Implements SEO-optimized
 * 404 handling with proper meta tags and accessibility features using server-side
 * rendering capabilities.
 * 
 * Features:
 * - WCAG 2.1 AA compliant design with proper heading hierarchy
 * - SEO-optimized with Next.js metadata API
 * - User-friendly navigation suggestions grouped by feature area
 * - Responsive design with Tailwind CSS
 * - Accessible button components with proper focus management
 * - Screen reader announcements and ARIA labels
 * - Minimum 44x44px touch targets for mobile accessibility
 */
export default function NotFound() {
  // Navigation suggestions organized by feature area
  const navigationSuggestions = [
    {
      category: 'Database Management',
      icon: DatabaseIcon,
      suggestions: [
        {
          label: 'Database Services',
          href: '/api-connections/database',
          description: 'Connect and manage database services',
        },
        {
          label: 'Schema Explorer',
          href: '/adf-schema',
          description: 'Browse database tables and relationships',
        },
        {
          label: 'Create New Service',
          href: '/api-connections/database/create',
          description: 'Set up a new database connection',
        },
      ],
    },
    {
      category: 'System Administration',
      icon: CogIcon,
      suggestions: [
        {
          label: 'System Settings',
          href: '/system-settings',
          description: 'Configure system-wide preferences',
        },
        {
          label: 'User Management',
          href: '/adf-users',
          description: 'Manage users and administrators',
        },
        {
          label: 'Email Templates',
          href: '/system-settings/email-templates',
          description: 'Customize system email templates',
        },
      ],
    },
    {
      category: 'Security & Access',
      icon: ShieldCheckIcon,
      suggestions: [
        {
          label: 'API Security',
          href: '/api-security',
          description: 'Configure roles and access limits',
        },
        {
          label: 'Roles Management',
          href: '/api-security/roles',
          description: 'Define user roles and permissions',
        },
        {
          label: 'API Documentation',
          href: '/adf-api-docs',
          description: 'View generated API documentation',
        },
      ],
    },
  ];

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900">
      {/* Skip link for screen readers */}
      <a 
        href="#main-content" 
        className="skip-link sr-only focus:not-sr-only focus:absolute focus:top-6 focus:left-6 bg-primary-600 text-white px-4 py-2 rounded-md z-50"
      >
        Skip to main content
      </a>

      {/* Breadcrumb navigation for context */}
      <nav 
        className="bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-4 py-3"
        aria-label="Breadcrumb navigation"
      >
        <div className="max-w-7xl mx-auto">
          <ol className="flex items-center space-x-2 text-sm">
            <li>
              <Link 
                href="/"
                className="flex items-center text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-primary-600 focus:ring-offset-2 rounded-md px-2 py-1"
                aria-label="Return to dashboard home"
              >
                <HomeIcon className="h-4 w-4 mr-1" aria-hidden="true" />
                Dashboard
              </Link>
            </li>
            <li className="flex items-center">
              <span className="text-gray-400 dark:text-gray-600 mx-2" aria-hidden="true">/</span>
              <span className="text-gray-900 dark:text-white font-medium">Page Not Found</span>
            </li>
          </ol>
        </div>
      </nav>

      {/* Main content */}
      <main 
        id="main-content" 
        className="max-w-7xl mx-auto px-4 py-12 sm:px-6 lg:px-8"
        role="main"
      >
        <div className="text-center">
          {/* 404 Error indication */}
          <div 
            className="text-6xl sm:text-8xl font-extrabold text-primary-600 dark:text-primary-400 mb-4"
            aria-hidden="true"
          >
            404
          </div>

          {/* Main heading with proper hierarchy */}
          <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white mb-4">
            Page Not Found
          </h1>

          <p className="text-lg text-gray-600 dark:text-gray-400 mb-8 max-w-2xl mx-auto">
            The page you're looking for doesn't exist or may have been moved. 
            Use the navigation suggestions below to find what you need in the DreamFactory Admin interface.
          </p>

          {/* Primary action - return to dashboard */}
          <div className="mb-12">
            <Link
              href="/"
              className="inline-flex items-center justify-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-600 focus:ring-offset-2 transition-colors duration-200 min-h-[44px] min-w-[120px]"
              aria-describedby="dashboard-description"
            >
              <HomeIcon className="h-5 w-5 mr-2" aria-hidden="true" />
              Return to Dashboard
            </Link>
            <p id="dashboard-description" className="sr-only">
              Navigate back to the main DreamFactory Admin dashboard
            </p>
          </div>
        </div>

        {/* Navigation suggestions organized by category */}
        <div className="mt-16">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white text-center mb-8">
            Popular Destinations
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {navigationSuggestions.map((category) => {
              const IconComponent = category.icon;
              return (
                <div
                  key={category.category}
                  className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6 shadow-sm hover:shadow-md transition-shadow duration-200"
                >
                  {/* Category header */}
                  <div className="flex items-center mb-4">
                    <div className="flex items-center justify-center w-10 h-10 bg-primary-100 dark:bg-primary-900 rounded-lg mr-3">
                      <IconComponent 
                        className="h-6 w-6 text-primary-600 dark:text-primary-400" 
                        aria-hidden="true" 
                      />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                      {category.category}
                    </h3>
                  </div>

                  {/* Navigation links */}
                  <ul className="space-y-3" role="list">
                    {category.suggestions.map((suggestion) => (
                      <li key={suggestion.href}>
                        <Link
                          href={suggestion.href}
                          className="block p-3 rounded-md border border-gray-200 dark:border-gray-600 hover:border-primary-300 dark:hover:border-primary-600 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-primary-600 focus:ring-offset-2 group"
                          aria-describedby={`desc-${suggestion.href.replace(/\//g, '-')}`}
                        >
                          <div className="font-medium text-gray-900 dark:text-white group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors duration-200">
                            {suggestion.label}
                          </div>
                          <div 
                            id={`desc-${suggestion.href.replace(/\//g, '-')}`}
                            className="text-sm text-gray-600 dark:text-gray-400 mt-1"
                          >
                            {suggestion.description}
                          </div>
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              );
            })}
          </div>
        </div>

        {/* Help section */}
        <div className="mt-16 text-center">
          <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-8 border border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-center mb-4">
              <HelpCircleIcon 
                className="h-8 w-8 text-primary-600 dark:text-primary-400" 
                aria-hidden="true" 
              />
            </div>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
              Still can't find what you're looking for?
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mb-6 max-w-md mx-auto">
              Check our documentation or contact support for assistance with the DreamFactory Admin interface.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <Link
                href="/adf-api-docs"
                className="inline-flex items-center justify-center px-4 py-2 border border-gray-300 dark:border-gray-600 text-sm font-medium rounded-md text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-primary-600 focus:ring-offset-2 transition-colors duration-200 min-h-[44px] min-w-[120px]"
              >
                View Documentation
              </Link>
              <Link
                href="/adf-home"
                className="inline-flex items-center justify-center px-4 py-2 border border-gray-300 dark:border-gray-600 text-sm font-medium rounded-md text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-primary-600 focus:ring-offset-2 transition-colors duration-200 min-h-[44px] min-w-[120px]"
              >
                Get Started Guide
              </Link>
            </div>
          </div>
        </div>
      </main>

      {/* Footer with additional context */}
      <footer className="mt-16 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
        <div className="max-w-7xl mx-auto px-4 py-8 text-center">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            DreamFactory Admin Interface - Generate REST APIs from any database in under 5 minutes
          </p>
        </div>
      </footer>
    </div>
  );
}