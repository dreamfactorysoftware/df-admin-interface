import { Metadata } from 'next';
import { Suspense } from 'react';
import { 
  CogIcon, 
  ServerIcon, 
  EnvelopeIcon, 
  ShieldCheckIcon,
  ClockIcon,
  DocumentTextIcon,
  CircleStackIcon,
  KeyIcon
} from '@heroicons/react/24/outline';
import { ConfigDashboardClient } from './config-dashboard-client';

/**
 * Configuration Dashboard Page Component
 * 
 * Main configuration dashboard page implementing Next.js server component architecture 
 * to provide overview and navigation to system configuration features including cache 
 * management, CORS settings, email templates, lookup keys, and system information.
 * 
 * Features:
 * - SSR-optimized server component for initial page loads under 2 seconds
 * - Central hub for all DreamFactory administrative configuration capabilities
 * - Intelligent caching with React Query through client component delegation
 * - Responsive Tailwind CSS design replacing Angular Material components
 * - Comprehensive error handling and loading states
 * - WCAG 2.1 AA compliant accessibility features
 */

// Metadata for SEO and performance optimization
export const metadata: Metadata = {
  title: 'System Configuration - DreamFactory Admin',
  description: 'Manage DreamFactory system configuration including cache, CORS, email templates, and system information',
  keywords: ['dreamfactory', 'configuration', 'admin', 'system', 'cache', 'cors', 'email'],
};

/**
 * Configuration feature definitions for dashboard navigation
 * Replaces Angular router-based navigation with Next.js app router structure
 */
const CONFIG_FEATURES = [
  {
    id: 'cache',
    title: 'Cache Management',
    description: 'Configure system cache settings and flush cache data',
    icon: CircleStackIcon,
    href: '/adf-config/df-cache',
    status: 'active' as const,
    color: 'bg-blue-500 hover:bg-blue-600',
    iconColor: 'text-blue-600',
    borderColor: 'border-blue-200 hover:border-blue-300',
    actions: ['view', 'configure', 'flush'],
  },
  {
    id: 'cors',
    title: 'CORS Configuration',
    description: 'Manage Cross-Origin Resource Sharing policies and settings',
    icon: ShieldCheckIcon,
    href: '/adf-config/df-cors',
    status: 'active' as const,
    color: 'bg-green-500 hover:bg-green-600',
    iconColor: 'text-green-600',
    borderColor: 'border-green-200 hover:border-green-300',
    actions: ['view', 'create', 'edit', 'delete'],
  },
  {
    id: 'email-templates',
    title: 'Email Templates',
    description: 'Configure email templates for system notifications and user communications',
    icon: EnvelopeIcon,
    href: '/adf-config/df-email-templates',
    status: 'active' as const,
    color: 'bg-purple-500 hover:bg-purple-600',
    iconColor: 'text-purple-600',
    borderColor: 'border-purple-200 hover:border-purple-300',
    actions: ['view', 'create', 'edit', 'delete'],
  },
  {
    id: 'global-lookup-keys',
    title: 'Global Lookup Keys',
    description: 'Manage global lookup keys for system-wide configuration values',
    icon: KeyIcon,
    href: '/adf-config/df-global-lookup-keys',
    status: 'active' as const,
    color: 'bg-orange-500 hover:bg-orange-600',
    iconColor: 'text-orange-600',
    borderColor: 'border-orange-200 hover:border-orange-300',
    actions: ['view', 'create', 'edit', 'delete'],
  },
  {
    id: 'system-info',
    title: 'System Information',
    description: 'View comprehensive system information and environment details',
    icon: ServerIcon,
    href: '/adf-config/df-system-info',
    status: 'active' as const,
    color: 'bg-gray-500 hover:bg-gray-600',
    iconColor: 'text-gray-600',
    borderColor: 'border-gray-200 hover:border-gray-300',
    actions: ['view'],
  },
] as const;

/**
 * Loading component for server-side rendering optimization
 * Provides immediate visual feedback while client components hydrate
 */
function ConfigDashboardSkeleton() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Header skeleton */}
        <div className="mb-8">
          <div className="h-8 w-64 bg-gray-200 dark:bg-gray-700 rounded animate-pulse mb-4" />
          <div className="h-5 w-96 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
        </div>

        {/* Status overview skeleton */}
        <div className="mb-8 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, index) => (
            <div
              key={index}
              className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700"
            >
              <div className="h-4 w-20 bg-gray-200 dark:bg-gray-700 rounded animate-pulse mb-2" />
              <div className="h-6 w-16 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
            </div>
          ))}
        </div>

        {/* Configuration features skeleton */}
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, index) => (
            <div
              key={index}
              className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700"
            >
              <div className="flex items-center mb-4">
                <div className="h-8 w-8 bg-gray-200 dark:bg-gray-700 rounded animate-pulse mr-3" />
                <div className="h-6 w-32 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
              </div>
              <div className="h-4 w-full bg-gray-200 dark:bg-gray-700 rounded animate-pulse mb-2" />
              <div className="h-4 w-3/4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse mb-4" />
              <div className="h-10 w-full bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/**
 * Configuration Dashboard Page Server Component
 * 
 * Implements Next.js server component architecture with:
 * - Server-side rendering for optimal initial load performance
 * - Static configuration data rendering for immediate UI presentation
 * - Delegation to client components for interactive features and data fetching
 * - Comprehensive error boundaries and loading states
 * 
 * Performance targets:
 * - SSR page load: < 2 seconds
 * - First Contentful Paint: < 1.5 seconds
 * - Largest Contentful Paint: < 2.5 seconds
 * - Cumulative Layout Shift: < 0.1
 */
export default function ConfigDashboardPage() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Page Header */}
        <header className="mb-8">
          <div className="flex items-center space-x-3 mb-4">
            <CogIcon className="h-8 w-8 text-primary-600 dark:text-primary-400" />
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              System Configuration
            </h1>
          </div>
          <p className="text-lg text-gray-600 dark:text-gray-300 max-w-3xl">
            Manage and configure DreamFactory system settings, including cache management, 
            CORS policies, email templates, lookup keys, and system information. 
            Monitor system health and optimize performance through centralized configuration.
          </p>
        </header>

        {/* Configuration Features Grid */}
        <section className="mb-8">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">
            Configuration Areas
          </h2>
          
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {CONFIG_FEATURES.map((feature) => {
              const IconComponent = feature.icon;
              
              return (
                <div
                  key={feature.id}
                  className={`
                    bg-white dark:bg-gray-800 rounded-lg shadow-sm border-2 transition-all duration-200 hover:shadow-md
                    ${feature.borderColor} dark:border-gray-700 dark:hover:border-gray-600
                  `}
                >
                  <div className="p-6">
                    {/* Feature Header */}
                    <div className="flex items-center space-x-3 mb-4">
                      <div className={`p-2 rounded-lg bg-gray-50 dark:bg-gray-700`}>
                        <IconComponent className={`h-6 w-6 ${feature.iconColor} dark:text-current`} />
                      </div>
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                        {feature.title}
                      </h3>
                    </div>

                    {/* Feature Description */}
                    <p className="text-sm text-gray-600 dark:text-gray-300 mb-4 line-clamp-2">
                      {feature.description}
                    </p>

                    {/* Feature Actions */}
                    <div className="flex flex-wrap gap-2 mb-4">
                      {feature.actions.map((action) => (
                        <span
                          key={action}
                          className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200"
                        >
                          {action}
                        </span>
                      ))}
                    </div>

                    {/* Navigation Button */}
                    <a
                      href={feature.href}
                      className={`
                        inline-flex items-center justify-center w-full px-4 py-2 text-sm font-medium text-white rounded-md
                        transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500
                        ${feature.color} dark:bg-opacity-80 dark:hover:bg-opacity-90
                      `}
                      role="button"
                      tabIndex={0}
                    >
                      Configure {feature.title.split(' ')[0]}
                      <svg
                        className="ml-2 h-4 w-4"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                        aria-hidden="true"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M9 5l7 7-7 7"
                        />
                      </svg>
                    </a>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* Client Component for Dynamic Data and Interactions */}
        <Suspense fallback={<ConfigDashboardSkeleton />}>
          <ConfigDashboardClient />
        </Suspense>

        {/* Additional Information Section */}
        <section className="mt-12">
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-6">
            <div className="flex items-start space-x-3">
              <DocumentTextIcon className="h-6 w-6 text-blue-600 dark:text-blue-400 mt-0.5" />
              <div>
                <h3 className="text-lg font-medium text-blue-900 dark:text-blue-100 mb-2">
                  Configuration Best Practices
                </h3>
                <ul className="text-sm text-blue-800 dark:text-blue-200 space-y-1">
                  <li>• Regularly flush cache to ensure optimal performance</li>
                  <li>• Configure CORS policies to match your application's security requirements</li>
                  <li>• Customize email templates to maintain consistent branding</li>
                  <li>• Use global lookup keys for environment-specific configuration</li>
                  <li>• Monitor system information for health and capacity planning</li>
                </ul>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}

/**
 * Route segment configuration for Next.js App Router
 * Optimizes page for server-side rendering and caching
 */
export const dynamic = 'force-dynamic'; // Ensure fresh data on each request
export const revalidate = 300; // Revalidate every 5 minutes for configuration data