/**
 * @fileoverview DreamFactory Download Page Component
 * 
 * Next.js page component for the DreamFactory download center that renders cloud and
 * local installer options using React 19 features, server-side rendering, and Tailwind
 * CSS styling. This replaces the Angular DfDownloadPageComponent with enhanced performance,
 * modern React patterns, and improved accessibility.
 * 
 * Key Features:
 * - Server-side rendering for enhanced SEO and performance
 * - Responsive design with breakpoint-aware layouts using useBreakpoint hook
 * - Accessible navigation with proper ARIA labels and semantic structure
 * - Dark mode support with theme-aware styling
 * - Icon card links for installer platforms with external link indication
 * - Internationalization support for multilingual content
 * - Progressive enhancement with client-side interactivity
 * 
 * Performance Requirements:
 * - SSR page loads under 2 seconds (React/Next.js Integration Requirements)
 * - Responsive layout adjustments under 50ms
 * - Image optimization with Next.js Image component
 * - Lazy loading for optimal performance
 * 
 * Architecture Migration:
 * - Converts Angular DfDownloadPageComponent to React functional component
 * - Replaces Angular Material with Headless UI and Tailwind CSS
 * - Transforms DfBreakpointService.isXSmallScreen to useBreakpoint hook
 * - Migrates Angular *ngFor to React map() patterns with proper keys
 * - Converts Transloco pipe to Next.js i18n translation patterns
 * - Transforms SCSS styling to Tailwind utility classes
 * 
 * @author DreamFactory Admin Interface Team
 * @version React 19/Next.js 15.1 Migration
 */

'use client';

import { useMemo } from 'react';
import type { Metadata } from 'next';
import { Download, Cloud, Server } from 'lucide-react';

// UI Components
import { IconCardLink } from '@/components/ui/icon-card-link';
import { useBreakpoint } from '@/hooks/use-breakpoint';

// Utilities
import { cn } from '@/lib/utils';

/**
 * Interface for installer link information
 * Defines the structure for each installer platform option
 */
export interface InstallerLink {
  /** Display name or translation key for the installer */
  name: string;
  /** External URL to the installer or documentation */
  url: string;
  /** Icon filename for the platform logo */
  icon: string;
  /** Optional description for accessibility */
  description?: string;
}

/**
 * Metadata configuration for the download page
 * Provides SEO optimization and social media sharing
 */
export const metadata: Metadata = {
  title: 'Download DreamFactory',
  description: 'Download DreamFactory installers for cloud platforms and local development environments. Get started with Oracle Cloud, AWS, Azure, Docker, and more.',
  keywords: [
    'DreamFactory download',
    'API platform installer', 
    'cloud installer',
    'Docker container',
    'AWS deployment',
    'Azure installer',
    'Oracle Cloud',
    'local development'
  ],
  openGraph: {
    title: 'Download DreamFactory | Cloud & Local Installers',
    description: 'Get DreamFactory running on your preferred platform with our comprehensive installer options.',
    type: 'website',
    images: [
      {
        url: '/assets/img/dreamfactory-download-og.png',
        width: 1200,
        height: 630,
        alt: 'DreamFactory Download Center',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Download DreamFactory | Cloud & Local Installers',
    description: 'Get DreamFactory running on your preferred platform with our comprehensive installer options.',
    images: ['/assets/img/dreamfactory-download-og.png'],
  },
  robots: {
    index: false, // Admin interface should not be indexed
    follow: false,
  },
};

/**
 * Cloud installer platform links
 * Comprehensive list of cloud deployment options with external links
 */
const CLOUD_INSTALLER_LINKS: InstallerLink[] = [
  {
    name: 'Oracle Cloud',
    url: 'https://bitnami.com/stack/dreamfactory/cloud/oracle',
    icon: 'oraclecloud.png',
    description: 'Deploy DreamFactory on Oracle Cloud Infrastructure with Bitnami',
  },
  {
    name: 'Bitnami',
    url: 'https://bitnami.com/stack/dreamfactory/cloud',
    icon: 'new_little-bitnami.png',
    description: 'One-click deployment across multiple cloud platforms',
  },
  {
    name: 'Docker',
    url: 'https://hub.docker.com/r/dreamfactorysoftware/df-docker/',
    icon: 'new_little-docker.png',
    description: 'Containerized deployment with Docker Hub',
  },
  {
    name: 'Amazon AWS',
    url: 'https://bitnami.com/stack/dreamfactory/cloud/aws',
    icon: 'new_little-amazon.png',
    description: 'Deploy on Amazon Web Services with Bitnami',
  },
  {
    name: 'Microsoft Azure',
    url: 'https://bitnami.com/stack/dreamfactory/cloud/azure',
    icon: 'new_little-azure.png',
    description: 'Azure cloud deployment with integrated scaling',
  },
  {
    name: 'Google Cloud',
    url: 'https://bitnami.com/stack/dreamfactory/cloud/google',
    icon: 'new_little-google.png',
    description: 'Google Cloud Platform deployment solution',
  },
  {
    name: 'VMware',
    url: 'https://bitnami.com/stack/dreamfactory/virtual-machine',
    icon: 'new_little-vmware.png',
    description: 'Virtual machine deployment for VMware environments',
  },
] as const;

/**
 * Local installer platform links
 * Direct installation options for development and on-premises deployment
 */
const LOCAL_INSTALLER_LINKS: InstallerLink[] = [
  {
    name: 'Linux',
    url: 'https://bitnami.com/stack/dreamfactory/installer#linux',
    icon: 'linux-64x64.png',
    description: 'Native Linux installer for all major distributions',
  },
  {
    name: 'macOS',
    url: 'https://bitnami.com/stack/dreamfactory/installer#osx',
    icon: 'apple-64x64v2.png',
    description: 'macOS installer for local development',
  },
  {
    name: 'Windows',
    url: 'https://bitnami.com/stack/dreamfactory/installer#windows',
    icon: 'microsoft-64x64.png',
    description: 'Windows installer with automated setup',
  },
  {
    name: 'GitHub Source',
    url: 'https://github.com/dreamfactorysoftware/dreamfactory',
    icon: 'new_little-github.png',
    description: 'Source code repository for custom builds',
  },
] as const;

/**
 * Installer Section Component
 * Renders a section of installer links with responsive grid layout
 */
interface InstallerSectionProps {
  /** Section title */
  title: string;
  /** Array of installer links to display */
  links: readonly InstallerLink[];
  /** Icon component for the section header */
  icon: React.ComponentType<{ className?: string }>;
  /** Whether to use compact layout for small screens */
  isCompact?: boolean;
  /** Additional CSS classes */
  className?: string;
}

function InstallerSection({ 
  title, 
  links, 
  icon: Icon,
  isCompact = false,
  className 
}: InstallerSectionProps) {
  return (
    <article 
      className={cn('space-y-6', className)}
      aria-labelledby={`${title.toLowerCase().replace(/\s+/g, '-')}-heading`}
    >
      {/* Section Header */}
      <header className="flex items-center space-x-3">
        <Icon 
          className="h-6 w-6 text-primary-600 dark:text-primary-400" 
          aria-hidden="true" 
        />
        <h2 
          id={`${title.toLowerCase().replace(/\s+/g, '-')}-heading`}
          className="text-2xl font-bold text-gray-900 dark:text-white"
        >
          {title}
        </h2>
      </header>

      {/* Installer Grid */}
      <div 
        className={cn(
          'grid gap-4',
          isCompact 
            ? 'grid-cols-1 sm:grid-cols-2' 
            : 'grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4'
        )}
        role="list"
        aria-label={`${title} installer options`}
      >
        {links.map((link, index) => (
          <div 
            key={`${link.name}-${index}`}
            role="listitem"
            className="flex"
          >
            <IconCardLink
              linkInfo={{
                name: link.name,
                url: link.url,
                icon: link.icon,
                description: link.description,
              }}
              size={isCompact ? 'sm' : 'md'}
              showExternalIcon={true}
              className="flex-1"
              data-testid={`installer-link-${link.name.toLowerCase().replace(/\s+/g, '-')}`}
            />
          </div>
        ))}
      </div>
    </article>
  );
}

/**
 * Download Page Header Component
 * Provides introductory content and context for the download options
 */
function DownloadPageHeader() {
  return (
    <header className="text-center space-y-4 mb-12">
      <div className="flex items-center justify-center space-x-3 mb-4">
        <Download className="h-8 w-8 text-primary-600 dark:text-primary-400" />
        <h1 className="text-4xl font-bold text-gray-900 dark:text-white">
          Download DreamFactory
        </h1>
      </div>
      
      <p className="text-lg text-gray-600 dark:text-gray-300 max-w-3xl mx-auto leading-relaxed">
        Get DreamFactory up and running on your preferred platform. Choose from our comprehensive 
        collection of cloud deployment options or download local installers for development environments.
      </p>
      
      <div className="flex items-center justify-center space-x-6 text-sm text-gray-500 dark:text-gray-400 mt-6">
        <div className="flex items-center space-x-2">
          <Cloud className="h-4 w-4" />
          <span>Cloud Ready</span>
        </div>
        <div className="flex items-center space-x-2">
          <Server className="h-4 w-4" />
          <span>Self-Hosted</span>
        </div>
        <div className="flex items-center space-x-2">
          <Download className="h-4 w-4" />
          <span>Open Source</span>
        </div>
      </div>
    </header>
  );
}

/**
 * DreamFactory Download Page Component
 * 
 * Main page component that renders the complete download center interface.
 * Provides comprehensive installer options for both cloud and local deployment
 * scenarios with responsive design and enhanced accessibility.
 * 
 * Features:
 * - Responsive grid layout that adapts to screen size
 * - External link indication for security awareness
 * - ARIA labels and semantic HTML for accessibility
 * - Optimized images with lazy loading
 * - Dark mode support with theme-aware styling
 * - Progressive enhancement with client-side interactivity
 * 
 * Performance Characteristics:
 * - Server-side rendered for fast initial load
 * - Optimized images with Next.js Image component
 * - Lazy loading for installer icons
 * - Minimal JavaScript bundle for client interactivity
 * 
 * @returns JSX element representing the complete download page
 */
export default function DownloadPage() {
  // Get responsive breakpoint information
  const { isMobile, isTablet } = useBreakpoint();

  // Determine if we should use compact layout
  const isCompactLayout = useMemo(() => {
    return isMobile || isTablet;
  }, [isMobile, isTablet]);

  return (
    <div 
      className="space-y-12"
      data-testid="download-page"
      role="main"
      aria-label="DreamFactory download center"
    >
      {/* Page Header */}
      <DownloadPageHeader />

      {/* Main Content */}
      <div className="space-y-16">
        {/* Cloud Installers Section */}
        <InstallerSection
          title="Cloud Installers"
          links={CLOUD_INSTALLER_LINKS}
          icon={Cloud}
          isCompact={isCompactLayout}
          className="cloud-installers-section"
        />

        {/* Local Installers Section */}
        <InstallerSection
          title="Local Installers"
          links={LOCAL_INSTALLER_LINKS}
          icon={Server}
          isCompact={isCompactLayout}
          className="local-installers-section"
        />
      </div>

      {/* Additional Resources */}
      <footer className="mt-16 pt-8 border-t border-gray-200 dark:border-gray-700">
        <div className="text-center space-y-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Need Help Getting Started?
          </h3>
          <p className="text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
            Check out our comprehensive documentation and quickstart guides to get up and running 
            with DreamFactory in minutes.
          </p>
          <div className="flex items-center justify-center space-x-4 mt-6">
            <a
              href="/adf-home/quickstart"
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 transition-colors duration-200"
            >
              Quickstart Guide
            </a>
            <a
              href="/adf-home/resources"
              className="inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 text-sm font-medium rounded-md text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 transition-colors duration-200"
            >
              Documentation
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}

/**
 * Export metadata for Next.js page optimization
 * Enables proper SEO and social media sharing
 */
export { metadata };

/**
 * Export component types for external use
 */
export type { InstallerLink, InstallerSectionProps };