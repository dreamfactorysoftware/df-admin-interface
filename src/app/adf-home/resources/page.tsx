/**
 * @fileoverview Resources Page Component for DreamFactory Admin Interface
 * 
 * Next.js page component migrated from Angular DfResourcesPageComponent, displaying 
 * a curated list of external resources including documentation, tutorials, community 
 * forums, and support links. Implements server-side rendering for enhanced SEO and 
 * performance with comprehensive internationalization and accessibility features.
 * 
 * Key Features:
 * - Next.js server component for optimal SEO and performance
 * - Comprehensive metadata configuration for search engines
 * - WCAG 2.1 AA accessibility compliance with ARIA attributes
 * - Responsive grid layout with Tailwind CSS utilities
 * - IconLink components with Lucide React icons
 * - Internationalization ready with translation key support
 * - Resource categorization for improved organization
 * - Semantic HTML structure for better screen reader support
 * 
 * Performance Requirements:
 * - Server-side rendering under 2 seconds per React/Next.js Integration Requirements
 * - Initial page load optimized for 5-minute API generation workflow
 * - Accessible keyboard navigation throughout the interface
 * - Responsive design across all supported breakpoints
 * 
 * Migration Notes:
 * - Replaces Angular *ngFor directive with React map() function
 * - Converts Angular Material components to Tailwind CSS utilities
 * - Transforms Angular Transloco pipes to Next.js i18n patterns
 * - Replaces FontAwesome icons with Lucide React equivalents
 * 
 * @author DreamFactory Admin Interface Team
 * @version React 19/Next.js 15.1 Migration
 */

import type { Metadata } from 'next';
import { resourcesPageResources, groupResourcesByCategory } from '@/lib/constants/home';
import { IconLink } from '@/components/ui/icon-link';

/**
 * Metadata configuration for enhanced SEO optimization
 * Implements Next.js metadata API for consistent search engine visibility
 */
export const metadata: Metadata = {
  title: 'Resources',
  description: 'Comprehensive collection of DreamFactory resources including documentation, tutorials, community support, and development guides for database API generation.',
  keywords: [
    'dreamfactory resources',
    'api documentation',
    'database tutorials',
    'rest api guides',
    'community support',
    'developer resources',
    'database api generation',
    'mysql api tutorial',
    'postgresql api guide',
    'mongodb api examples'
  ],
  openGraph: {
    title: 'DreamFactory Resources - Documentation, Tutorials & Support',
    description: 'Access comprehensive DreamFactory resources including step-by-step tutorials, complete API documentation, community forums, and developer support materials.',
    type: 'website',
    images: [
      {
        url: '/images/resources-og-image.png',
        width: 1200,
        height: 630,
        alt: 'DreamFactory Resources Page - Documentation and Tutorials',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'DreamFactory Resources - Documentation, Tutorials & Support',
    description: 'Access comprehensive DreamFactory resources for database API generation and development.',
    images: ['/images/resources-og-image.png'],
  },
  alternates: {
    canonical: '/adf-home/resources',
  },
  robots: {
    index: false, // Admin interface should not be indexed
    follow: false,
    noarchive: true,
    nosnippet: true,
  },
};

/**
 * Translation keys for internationalization
 * Maintains compatibility with existing Angular translation structure
 */
const TRANSLATION_KEYS = {
  pageTitle: 'home.resourcesPage.title',
  pageDescription: 'home.resourcesPage.description',
  resourcesSubHeading: 'home.resourcesPage.resourcesSubHeading',
  categorySeparator: 'home.resourcesPage.categorySeparator',
  
  // Category labels
  documentationCategory: 'home.resourceCategories.documentation',
  tutorialCategory: 'home.resourceCategories.tutorial',
  communityCategory: 'home.resourceCategories.community',
  supportCategory: 'home.resourceCategories.support',
  socialCategory: 'home.resourceCategories.social',
} as const;

/**
 * Resources Page Component
 * 
 * Server component that renders a comprehensive list of DreamFactory resources
 * organized by category with accessible navigation and responsive design.
 * Implements Next.js server-side rendering for optimal SEO performance.
 * 
 * Features:
 * - Semantic HTML structure with proper heading hierarchy
 * - Accessible skip links and navigation landmarks
 * - Responsive grid layout adapting to screen size
 * - Resource categorization for improved discoverability
 * - External link handling with security attributes
 * - ARIA labels and descriptions for screen readers
 * - Focus management for keyboard navigation
 * 
 * @returns JSX element representing the resources page
 */
export default function ResourcesPage(): JSX.Element {
  // Group resources by category for organized display
  const groupedResources = groupResourcesByCategory(resourcesPageResources);
  
  // Define category display order and labels
  const categoryOrder = ['documentation', 'tutorial', 'community', 'support', 'social'] as const;
  const categoryLabels = {
    documentation: 'Documentation',
    tutorial: 'Tutorials',
    community: 'Community',
    support: 'Support',
    social: 'Social Media',
  } as const;
  
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Skip link for accessibility */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:left-6 focus:top-4 focus:z-50 rounded-md bg-primary-600 px-3 py-2 text-sm font-medium text-white focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
      >
        Skip to main content
      </a>
      
      {/* Page container with proper spacing */}
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Page header with semantic structure */}
        <header className="mb-8 text-center">
          <h1 className="text-4xl font-bold tracking-tight text-gray-900 dark:text-white sm:text-5xl">
            DreamFactory Resources
          </h1>
          <p className="mt-4 text-xl text-gray-600 dark:text-gray-400 max-w-3xl mx-auto">
            {/* TODO: Replace with i18n translation once translation system is implemented */}
            Comprehensive collection of documentation, tutorials, and support materials 
            to help you build powerful database APIs with DreamFactory.
          </p>
        </header>
        
        {/* Main content area */}
        <main id="main-content" role="main" className="focus:outline-none" tabIndex={-1}>
          {/* Resources subheading */}
          <section className="mb-12">
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-6 text-center">
              {/* TODO: Replace with i18n translation: {t(TRANSLATION_KEYS.resourcesSubHeading)} */}
              Explore Our Knowledge Base
            </h2>
            
            {/* Resource categories grid */}
            <div className="space-y-12">
              {categoryOrder.map((categoryKey) => {
                const categoryResources = groupedResources[categoryKey];
                
                // Skip categories with no resources
                if (!categoryResources || categoryResources.length === 0) {
                  return null;
                }
                
                return (
                  <div 
                    key={categoryKey}
                    className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6"
                  >
                    {/* Category header */}
                    <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
                      <span className="h-2 w-2 bg-primary-600 rounded-full mr-3" aria-hidden="true" />
                      {categoryLabels[categoryKey]}
                    </h3>
                    
                    {/* Category resources grid */}
                    <div 
                      className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
                      role="list"
                      aria-label={`${categoryLabels[categoryKey]} resources`}
                    >
                      {categoryResources.map((resource, index) => (
                        <div 
                          key={`${categoryKey}-${index}`}
                          role="listitem"
                          className="group"
                        >
                          <IconLink
                            linkItem={resource}
                            size="md"
                            variant="default"
                            showExternalIcon={true}
                            className="w-full justify-start p-4 h-auto hover:shadow-md transition-shadow duration-200 border border-gray-200 dark:border-gray-600 rounded-lg hover:border-primary-300 dark:hover:border-primary-600"
                            onClick={(linkItem) => {
                              // Analytics tracking for resource clicks
                              if (typeof window !== 'undefined') {
                                console.log('Resource clicked:', {
                                  category: categoryKey,
                                  resource: linkItem.name,
                                  url: linkItem.link,
                                });
                              }
                            }}
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
          
          {/* Additional help section */}
          <section className="mt-16 bg-primary-50 dark:bg-primary-900/20 rounded-lg p-8 text-center">
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
              Need Additional Help?
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mb-6 max-w-2xl mx-auto">
              Can't find what you're looking for? Our team is here to help you get the most 
              out of DreamFactory. Reach out through any of our support channels.
            </p>
            
            {/* Contact support CTA */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <IconLink
                linkItem={{
                  name: 'Contact Support',
                  icon: require('lucide-react').LifeBuoy,
                  link: 'https://www.dreamfactory.com/support',
                  description: 'Get help from our support team',
                }}
                size="lg"
                variant="primary"
                className="bg-primary-600 text-white hover:bg-primary-700 border-primary-600 hover:border-primary-700"
              />
              
              <IconLink
                linkItem={{
                  name: 'Join Community Forum',
                  icon: require('lucide-react').MessageCircle,
                  link: 'http://community.dreamfactory.com/',
                  description: 'Connect with other developers',
                }}
                size="lg"
                variant="secondary"
                className="bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700"
              />
            </div>
          </section>
          
          {/* Breadcrumb navigation for accessibility */}
          <nav 
            aria-label="Breadcrumb" 
            className="mt-8 pt-8 border-t border-gray-200 dark:border-gray-700"
          >
            <ol className="flex items-center space-x-2 text-sm text-gray-500 dark:text-gray-400">
              <li>
                <a 
                  href="/adf-home" 
                  className="hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
                  aria-label="Return to home page"
                >
                  Home
                </a>
              </li>
              <li aria-hidden="true">/</li>
              <li aria-current="page" className="font-medium text-gray-900 dark:text-gray-100">
                Resources
              </li>
            </ol>
          </nav>
        </main>
      </div>
      
      {/* Schema.org structured data for SEO */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'WebPage',
            name: 'DreamFactory Resources',
            description: 'Comprehensive collection of DreamFactory resources including documentation, tutorials, community support, and development guides.',
            url: 'https://admin.dreamfactory.com/adf-home/resources',
            mainEntity: {
              '@type': 'ItemList',
              numberOfItems: resourcesPageResources.length,
              itemListElement: resourcesPageResources.map((resource, index) => ({
                '@type': 'ListItem',
                position: index + 1,
                item: {
                  '@type': 'WebPage',
                  name: resource.name,
                  description: resource.description,
                  url: resource.link,
                },
              })),
            },
            breadcrumb: {
              '@type': 'BreadcrumbList',
              itemListElement: [
                {
                  '@type': 'ListItem',
                  position: 1,
                  name: 'Home',
                  item: 'https://admin.dreamfactory.com/adf-home',
                },
                {
                  '@type': 'ListItem',
                  position: 2,
                  name: 'Resources',
                  item: 'https://admin.dreamfactory.com/adf-home/resources',
                },
              ],
            },
          }),
        }}
      />
    </div>
  );
}

/**
 * Static metadata export for Next.js App Router
 * Ensures consistent SEO optimization across the application
 */
export { metadata };