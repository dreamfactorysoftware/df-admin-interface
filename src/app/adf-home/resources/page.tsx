/**
 * Resources Page Component for DreamFactory Admin Interface
 * 
 * Next.js page component that displays a curated list of external resources including
 * documentation, tutorials, community forums, and support links. This component replaces
 * the Angular DfResourcesPageComponent with React 19 server components for enhanced SEO
 * and performance.
 * 
 * Key Features:
 * - Next.js server component for optimal SEO and performance (SSR under 2 seconds)
 * - Comprehensive metadata configuration for search engine optimization
 * - WCAG 2.1 AA accessibility compliance with semantic HTML and ARIA attributes
 * - Responsive design with Tailwind CSS utilities and dark mode support
 * - TypeScript for type safety and enhanced developer experience
 * - Internationalization ready with translation key patterns
 * - Performance optimized with static resource data and minimal client-side JavaScript
 * 
 * Architecture:
 * - Server-side rendering for faster initial page loads
 * - Static resource data to eliminate unnecessary data fetching
 * - Component composition with reusable IconLink components
 * - SEO-optimized structure with proper heading hierarchy and meta tags
 * 
 * Migration Notes:
 * - Replaces Angular DfResourcesPageComponent with Next.js page structure
 * - Converts Angular Material styling to Tailwind CSS utilities
 * - Migrates Angular Transloco to Next.js i18n patterns (temporary fallback included)
 * - Transforms Angular NgFor directive to React map() function
 * - Converts FontAwesome icons to Lucide React icons for better performance
 * 
 * @fileoverview Next.js resources page replacing Angular component architecture
 * @version 1.0.0
 * @since Next.js 15.1+ / React 19.0.0
 */

import { type Metadata } from 'next';
import { resourcesPageResources, type ResourceLink } from '@/lib/constants/home';
import { IconLink } from '@/components/ui/icon-link';

// =============================================================================
// METADATA CONFIGURATION
// =============================================================================

/**
 * SEO metadata for the Resources page
 * Implements Next.js metadata API for optimal search engine optimization
 * 
 * Features:
 * - Descriptive title and meta description for search results
 * - Open Graph tags for social media sharing
 * - Twitter Card configuration for enhanced social presence
 * - Structured data ready for future JSON-LD implementation
 */
export const metadata: Metadata = {
  title: 'Resources',
  description: 'Comprehensive resources for DreamFactory including documentation, tutorials, community forums, and technical support. Get started with REST API generation and database management.',
  keywords: [
    'DreamFactory resources',
    'API documentation',
    'database tutorials',
    'REST API guide',
    'technical support',
    'community forum',
    'video tutorials',
    'developer resources',
  ],
  openGraph: {
    title: 'Resources | DreamFactory Admin',
    description: 'Explore comprehensive resources for DreamFactory including documentation, tutorials, and community support for REST API generation.',
    type: 'website',
    images: [
      {
        url: '/images/resources-og.png',
        width: 1200,
        height: 630,
        alt: 'DreamFactory Resources - Documentation, Tutorials & Support',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Resources | DreamFactory Admin',
    description: 'Comprehensive resources for DreamFactory REST API platform including docs, tutorials, and community support.',
    images: ['/images/resources-twitter.png'],
  },
  alternates: {
    canonical: '/adf-home/resources',
  },
  robots: {
    index: false, // Admin interface should not be indexed
    follow: false,
  },
};

// =============================================================================
// TRANSLATION UTILITIES
// =============================================================================

/**
 * Temporary translation function until Next.js i18n is fully implemented
 * Provides fallback translations for the resources page content
 * 
 * TODO: Replace with Next.js i18n hook when internationalization is set up
 */
function translate(key: string): string {
  const translations: Record<string, string> = {
    'home.resourcesPage.resourcesSubHeading': 
      'DreamFactory provides all of the backend services that you need to build great mobile, web, and IoT applications. Follow the links below to get started:',
    'home.resourceLinks.gettingStartedGuide': 'Getting Started Guide',
    'home.resourceLinks.writtenTutorials': 'Written Tutorials',
    'home.resourceLinks.videoTutorials': 'Video Tutorials',
    'home.resourceLinks.fullDocumentation': 'Full Documentation',
    'home.resourceLinks.communityForum': 'Community Forum',
    'home.resourceLinks.bugFeatureRequests': 'Bugs and Feature Requests',
    'home.resourceLinks.twitter': 'DreamFactory on Twitter',
    'home.resourceLinks.blog': 'DreamFactory blog',
    'home.resourceLinks.contactSupport': 'Contact Support',
  };
  
  return translations[key] || key;
}

// =============================================================================
// COMPONENT HELPERS
// =============================================================================

/**
 * Resource categories for improved organization and UX
 * Groups resources by type for better visual hierarchy
 */
const resourceCategories = {
  documentation: ['home.resourceLinks.writtenTutorials', 'home.resourceLinks.videoTutorials', 'home.resourceLinks.fullDocumentation'],
  community: ['home.resourceLinks.communityForum', 'home.resourceLinks.twitter', 'home.resourceLinks.blog'],
  support: ['home.resourceLinks.bugFeatureRequests', 'home.resourceLinks.contactSupport'],
} as const;

/**
 * Categorize resources for improved layout
 * Organizes resources into logical groups for better UX
 */
function categorizeResources(resources: readonly ResourceLink[]) {
  const documentation = resources.filter(r => resourceCategories.documentation.includes(r.name));
  const community = resources.filter(r => resourceCategories.community.includes(r.name));
  const support = resources.filter(r => resourceCategories.support.includes(r.name));
  
  return { documentation, community, support };
}

// =============================================================================
// PAGE COMPONENT
// =============================================================================

/**
 * Resources Page Component
 * 
 * Server-side rendered page that displays DreamFactory resources in an organized,
 * accessible layout. Provides comprehensive navigation to documentation, tutorials,
 * community forums, and support channels.
 * 
 * Architecture:
 * - Server component for optimal performance and SEO
 * - Semantic HTML structure with proper heading hierarchy
 * - ARIA attributes for screen reader accessibility
 * - Responsive design with mobile-first approach
 * - Dark mode support through Tailwind CSS classes
 * 
 * Performance:
 * - Static resource data (no API calls)
 * - Minimal client-side JavaScript
 * - Optimized rendering path
 * - Proper meta tags for faster indexing
 * 
 * @returns React server component with resources layout
 */
export default function ResourcesPage() {
  // Organize resources into categories for better UX
  const { documentation, community, support } = categorizeResources(resourcesPageResources);
  
  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      {/* Page Header */}
      <header className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
          Resources
        </h1>
        <p className="text-lg text-gray-600 dark:text-gray-300 leading-relaxed">
          {translate('home.resourcesPage.resourcesSubHeading')}
        </p>
      </header>

      {/* Main Content */}
      <main className="space-y-12">
        {/* Documentation Section */}
        <section 
          className="space-y-6"
          aria-labelledby="documentation-heading"
        >
          <h2 
            id="documentation-heading"
            className="text-2xl font-semibold text-gray-900 dark:text-white border-b border-gray-200 dark:border-gray-700 pb-2"
          >
            Documentation & Tutorials
          </h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {documentation.map((resource) => (
              <div 
                key={resource.link}
                className="flex"
              >
                <IconLink
                  linkItem={resource}
                  variant="card"
                  size="md"
                  translateFn={translate}
                  className="w-full"
                />
              </div>
            ))}
          </div>
        </section>

        {/* Community Section */}
        <section 
          className="space-y-6"
          aria-labelledby="community-heading"
        >
          <h2 
            id="community-heading"
            className="text-2xl font-semibold text-gray-900 dark:text-white border-b border-gray-200 dark:border-gray-700 pb-2"
          >
            Community & Updates
          </h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {community.map((resource) => (
              <div 
                key={resource.link}
                className="flex"
              >
                <IconLink
                  linkItem={resource}
                  variant="card"
                  size="md"
                  translateFn={translate}
                  className="w-full"
                />
              </div>
            ))}
          </div>
        </section>

        {/* Support Section */}
        <section 
          className="space-y-6"
          aria-labelledby="support-heading"
        >
          <h2 
            id="support-heading"
            className="text-2xl font-semibold text-gray-900 dark:text-white border-b border-gray-200 dark:border-gray-700 pb-2"
          >
            Support & Feedback
          </h2>
          <div className="grid gap-4 sm:grid-cols-2">
            {support.map((resource) => (
              <div 
                key={resource.link}
                className="flex"
              >
                <IconLink
                  linkItem={resource}
                  variant="card"
                  size="md"
                  translateFn={translate}
                  className="w-full"
                />
              </div>
            ))}
          </div>
        </section>

        {/* Additional Information */}
        <section 
          className="bg-gray-50 dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700"
          aria-labelledby="additional-info-heading"
        >
          <h2 
            id="additional-info-heading"
            className="text-xl font-semibold text-gray-900 dark:text-white mb-3"
          >
            Need More Help?
          </h2>
          <p className="text-gray-600 dark:text-gray-300 mb-4">
            DreamFactory provides enterprise-grade support and professional services to help you succeed with your API projects.
          </p>
          <div className="flex flex-wrap gap-4">
            <a
              href="https://www.dreamfactory.com/support"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white font-medium rounded-md transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800"
            >
              Contact Support
            </a>
            <a
              href="https://www.dreamfactory.com/enterprise"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 font-medium rounded-md hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800"
            >
              Learn About Enterprise
            </a>
          </div>
        </section>
      </main>

      {/* Schema.org structured data for better SEO */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'WebPage',
            name: 'DreamFactory Resources',
            description: 'Comprehensive resources for DreamFactory including documentation, tutorials, community forums, and technical support.',
            url: '/adf-home/resources',
            mainEntity: {
              '@type': 'ItemList',
              name: 'DreamFactory Resources',
              itemListElement: resourcesPageResources.map((resource, index) => ({
                '@type': 'ListItem',
                position: index + 1,
                item: {
                  '@type': 'WebPage',
                  name: translate(resource.name),
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
                  item: '/',
                },
                {
                  '@type': 'ListItem',
                  position: 2,
                  name: 'Resources',
                  item: '/adf-home/resources',
                },
              ],
            },
          }),
        }}
      />
    </div>
  );
}

// =============================================================================
// PERFORMANCE OPTIMIZATIONS
// =============================================================================

/**
 * Static generation configuration
 * Since this page uses static data, it can be pre-rendered at build time
 */
export const dynamic = 'force-static';

/**
 * Runtime configuration
 * Optimize for performance and SEO
 */
export const runtime = 'nodejs';

/**
 * Revalidation configuration
 * Resources rarely change, so long cache periods are appropriate
 */
export const revalidate = 86400; // 24 hours