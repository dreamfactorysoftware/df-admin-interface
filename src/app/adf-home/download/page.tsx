/**
 * DreamFactory Download Page Component
 * 
 * Next.js page component that renders cloud and local installer options for DreamFactory.
 * This component replaces the Angular DfDownloadPageComponent with React 19 patterns,
 * Next.js 15.1+ server-side rendering, and Tailwind CSS styling.
 * 
 * Features:
 * - Server-side rendered for enhanced SEO and initial load performance
 * - Responsive design using Tailwind CSS breakpoints and useBreakpoint hook
 * - Cloud and local installer download links with branded icons
 * - Accessibility compliant with ARIA labels and semantic HTML
 * - Modern React patterns with TypeScript strict typing
 * - Integration with DreamFactory design system and brand guidelines
 * 
 * Architecture:
 * - Static installer link data arrays for cloud and local installers
 * - React functional component with hooks for responsive behavior
 * - IconCardLink components for consistent visual presentation
 * - Next.js metadata configuration for optimal SEO
 * - Tailwind CSS utility classes for responsive grid layouts
 * 
 * Performance Considerations:
 * - Server-side rendering reduces initial page load time
 * - Static data arrays optimize bundle size and runtime performance
 * - Responsive breakpoint detection via client-side hook for progressive enhancement
 * - Image optimization through Next.js static asset serving
 * 
 * @fileoverview Next.js download page component for DreamFactory installers
 * @version 1.0.0
 * @since React 19.0.0 / Next.js 15.1+
 */

'use client';

import { Suspense } from 'react';
import type { Metadata } from 'next';
import { 
  CloudIcon, 
  ComputerDesktopIcon,
  ArrowDownTrayIcon
} from '@heroicons/react/24/outline';

// Import custom hooks and utilities
import { useBreakpoint } from '@/hooks/use-breakpoint';

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

/**
 * Interface for installer link information
 * Matches the original Angular LinkInfo interface for compatibility
 */
interface InstallerLink {
  /** Display name key for translation or direct text */
  name: string;
  /** Direct download or information URL */
  url: string;
  /** Icon filename for the installer brand/platform */
  icon: string;
  /** Optional description for accessibility */
  description?: string;
}

// ============================================================================
// INSTALLER DATA ARRAYS
// ============================================================================

/**
 * Cloud installer platforms and services
 * Maintains exact compatibility with Angular component data structure
 * while providing comprehensive cloud deployment options
 */
const CLOUD_INSTALLER_LINKS: InstallerLink[] = [
  {
    name: 'Oracle Cloud',
    url: 'https://bitnami.com/stack/dreamfactory/cloud/oracle',
    icon: 'oraclecloud.png',
    description: 'Deploy DreamFactory on Oracle Cloud Infrastructure',
  },
  {
    name: 'Bitnami Stack',
    url: 'https://bitnami.com/stack/dreamfactory/cloud',
    icon: 'new_little-bitnami.png',
    description: 'One-click DreamFactory deployment with Bitnami',
  },
  {
    name: 'Docker Hub',
    url: 'https://hub.docker.com/r/dreamfactorysoftware/df-docker/',
    icon: 'new_little-docker.png',
    description: 'Official DreamFactory Docker container',
  },
  {
    name: 'Amazon Web Services',
    url: 'https://bitnami.com/stack/dreamfactory/cloud/aws',
    icon: 'new_little-amazon.png',
    description: 'Deploy DreamFactory on AWS with Bitnami',
  },
  {
    name: 'Microsoft Azure',
    url: 'https://bitnami.com/stack/dreamfactory/cloud/azure',
    icon: 'new_little-azure.png',
    description: 'Deploy DreamFactory on Microsoft Azure',
  },
  {
    name: 'Google Cloud Platform',
    url: 'https://bitnami.com/stack/dreamfactory/cloud/google',
    icon: 'new_little-google.png',
    description: 'Deploy DreamFactory on Google Cloud Platform',
  },
  {
    name: 'VMware vSphere',
    url: 'https://bitnami.com/stack/dreamfactory/virtual-machine',
    icon: 'new_little-vmware.png',
    description: 'DreamFactory virtual machine for VMware environments',
  },
];

/**
 * Local installer options for different operating systems
 * Provides direct download links for on-premises installations
 */
const LOCAL_INSTALLER_LINKS: InstallerLink[] = [
  {
    name: 'Linux',
    url: 'https://bitnami.com/stack/dreamfactory/installer#linux',
    icon: 'linux-64x64.png',
    description: 'DreamFactory installer for Linux distributions',
  },
  {
    name: 'macOS',
    url: 'https://bitnami.com/stack/dreamfactory/installer#osx',
    icon: 'apple-64x64v2.png',
    description: 'DreamFactory installer for macOS',
  },
  {
    name: 'Windows',
    url: 'https://bitnami.com/stack/dreamfactory/installer#windows',
    icon: 'microsoft-64x64.png',
    description: 'DreamFactory installer for Windows',
  },
  {
    name: 'GitHub Source',
    url: 'https://github.com/dreamfactorysoftware/dreamfactory',
    icon: 'new_little-github.png',
    description: 'DreamFactory source code repository',
  },
];

// ============================================================================
// ICON CARD LINK COMPONENT
// ============================================================================

/**
 * IconCardLink Component
 * 
 * Reusable component for rendering installer download links with branded icons.
 * Replaces the Angular df-icon-card-link component with React/Tailwind implementation.
 * 
 * Features:
 * - Responsive design with mobile-optimized spacing
 * - Accessibility compliance with ARIA labels and semantic markup
 * - Brand-consistent styling with hover states
 * - External link indicators and proper target handling
 * 
 * @param linkInfo - Installer link data
 * @param className - Additional CSS classes for customization
 */
interface IconCardLinkProps {
  linkInfo: InstallerLink;
  className?: string;
}

function IconCardLink({ linkInfo, className = '' }: IconCardLinkProps) {
  return (
    <a
      href={linkInfo.url}
      target="_blank"
      rel="noopener noreferrer"
      className={`
        group flex flex-col items-center p-4 text-center transition-all duration-200
        hover:scale-105 focus:scale-105 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2
        rounded-lg ${className}
      `}
      aria-label={linkInfo.description || `Download ${linkInfo.name}`}
      title={linkInfo.description || `Download ${linkInfo.name}`}
    >
      {/* Icon Card */}
      <div className="
        w-24 h-24 bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700
        flex items-center justify-center mb-4 transition-all duration-200
        group-hover:shadow-md group-hover:border-primary-300 dark:group-hover:border-primary-600
        group-focus:shadow-md group-focus:border-primary-300 dark:group-focus:border-primary-600
      ">
        <img 
          src={`/assets/img/${linkInfo.icon}`}
          alt={`${linkInfo.name} logo`}
          className="w-12 h-12 object-contain"
          loading="lazy"
        />
      </div>
      
      {/* Label */}
      <span className="
        text-sm font-medium text-gray-900 dark:text-gray-100 leading-tight
        group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors
      ">
        {linkInfo.name}
      </span>
    </a>
  );
}

// ============================================================================
// LOADING SKELETON COMPONENT
// ============================================================================

/**
 * Loading skeleton for installer sections during hydration
 * Provides smooth visual feedback during client-side rendering
 */
function InstallerSectionSkeleton() {
  return (
    <div className="space-y-8 animate-pulse" role="status" aria-label="Loading installer options">
      {/* Section header skeleton */}
      <div className="space-y-4">
        <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
      </div>
      
      {/* Installer grid skeleton */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-6">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="flex flex-col items-center space-y-3">
            <div className="w-24 h-24 bg-gray-200 dark:bg-gray-700 rounded-lg"></div>
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-16"></div>
          </div>
        ))}
      </div>
      
      {/* Screen reader announcement */}
      <span className="sr-only">Loading DreamFactory installer options, please wait...</span>
    </div>
  );
}

// ============================================================================
// INSTALLER SECTION COMPONENT
// ============================================================================

/**
 * InstallerSection Component
 * 
 * Renders a section of installer links with responsive grid layout.
 * Handles both cloud and local installer categories with consistent styling.
 * 
 * @param title - Section title text
 * @param description - Optional section description
 * @param links - Array of installer links to display
 * @param icon - Hero icon component for section header
 * @param isSmallScreen - Responsive breakpoint state
 */
interface InstallerSectionProps {
  title: string;
  description?: string;
  links: InstallerLink[];
  icon: React.ComponentType<{ className?: string }>;
  isSmallScreen: boolean;
}

function InstallerSection({ 
  title, 
  description, 
  links, 
  icon: Icon, 
  isSmallScreen 
}: InstallerSectionProps) {
  return (
    <article className="space-y-6">
      {/* Section Header */}
      <div className="flex items-center space-x-3">
        <Icon className="h-6 w-6 text-primary-600 dark:text-primary-400" aria-hidden="true" />
        <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
          {title}
        </h3>
      </div>
      
      {/* Section Description */}
      {description && (
        <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
          {description}
        </p>
      )}
      
      {/* Installer Grid */}
      <div className={`
        grid gap-4 ${
          isSmallScreen 
            ? 'grid-cols-2 justify-items-center' 
            : 'grid-cols-2 sm:grid-cols-3 lg:grid-cols-4'
        }
      `}>
        {links.map((link, index) => (
          <IconCardLink 
            key={`${link.name}-${index}`}
            linkInfo={link}
            className={isSmallScreen ? 'mx-2' : ''}
          />
        ))}
      </div>
    </article>
  );
}

// ============================================================================
// MAIN PAGE COMPONENT
// ============================================================================

/**
 * Download Page Component
 * 
 * Main page component that renders the complete download experience for DreamFactory.
 * Implements server-side rendering with client-side hydration for optimal performance
 * and progressive enhancement patterns.
 * 
 * Architecture:
 * - Server-rendered initial content for SEO and performance
 * - Client-side responsive behavior through useBreakpoint hook
 * - Accessible markup with proper semantic structure
 * - Error boundary integration for graceful error handling
 * 
 * @returns Complete download page with installer options
 */
export default function DownloadPage() {
  // Get responsive breakpoint state for adaptive layout
  const { isXSmallScreen } = useBreakpoint();
  
  return (
    <div className="min-h-full space-y-12" data-testid="download-page">
      {/* Page Header */}
      <header className="text-center space-y-4">
        <div className="flex justify-center">
          <ArrowDownTrayIcon className="h-12 w-12 text-primary-600 dark:text-primary-400" />
        </div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
          Download DreamFactory
        </h1>
        <p className="text-lg text-gray-600 dark:text-gray-400 max-w-3xl mx-auto leading-relaxed">
          Get started with DreamFactory by choosing from our cloud-hosted solutions or 
          download the installer for your preferred platform. Generate REST APIs from 
          your databases in under 5 minutes.
        </p>
      </header>
      
      {/* Main Content */}
      <main className="space-y-16">
        {/* Cloud Installers Section */}
        <Suspense fallback={<InstallerSectionSkeleton />}>
          <InstallerSection
            title="Cloud Deployments"
            description="Deploy DreamFactory instantly on your preferred cloud platform with pre-configured environments and automatic scaling."
            links={CLOUD_INSTALLER_LINKS}
            icon={CloudIcon}
            isSmallScreen={isXSmallScreen}
          />
        </Suspense>
        
        {/* Local Installers Section */}
        <Suspense fallback={<InstallerSectionSkeleton />}>
          <InstallerSection
            title="Local Installations"
            description="Download DreamFactory for on-premises deployment on Windows, macOS, Linux, or build from source code."
            links={LOCAL_INSTALLER_LINKS}
            icon={ComputerDesktopIcon}
            isSmallScreen={isXSmallScreen}
          />
        </Suspense>
      </main>
      
      {/* Footer Call-to-Action */}
      <footer className="bg-gray-50 dark:bg-gray-800 rounded-lg p-8 text-center border border-gray-200 dark:border-gray-700">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
          Need Help Getting Started?
        </h2>
        <p className="text-gray-600 dark:text-gray-400 mb-6 max-w-2xl mx-auto">
          Check out our comprehensive documentation, quickstart guides, and video tutorials 
          to get up and running with DreamFactory quickly.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <a
            href="/adf-home/quickstart"
            className="
              inline-flex items-center px-6 py-3 bg-primary-600 text-white rounded-md
              hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2
              transition-colors font-medium
            "
          >
            View Quickstart Guide
          </a>
          <a
            href="/adf-home/resources"
            className="
              inline-flex items-center px-6 py-3 border border-gray-300 dark:border-gray-600 
              text-gray-700 dark:text-gray-300 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700
              focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2
              transition-colors font-medium
            "
          >
            Browse Resources
          </a>
        </div>
      </footer>
      
      {/* Accessibility Announcements */}
      <div 
        id="download-aria-live" 
        aria-live="polite" 
        aria-atomic="true" 
        className="sr-only"
        role="status"
      />
    </div>
  );
}

// ============================================================================
// METADATA EXPORT FOR NEXT.JS
// ============================================================================

/**
 * Page metadata configuration for optimal SEO
 * Implements Next.js metadata API for server-side rendering benefits
 */
export const metadata: Metadata = {
  title: 'Download DreamFactory',
  description: 'Download DreamFactory for cloud deployment or local installation. Get started with REST API generation from your databases in under 5 minutes.',
  keywords: [
    'DreamFactory download',
    'REST API generator',
    'database API',
    'cloud deployment',
    'Docker container',
    'Bitnami stack',
    'AWS deployment',
    'Azure deployment',
    'Google Cloud',
    'local installation',
  ],
  openGraph: {
    title: 'Download DreamFactory | REST API Generation Platform',
    description: 'Choose from cloud deployments or local installers to get started with DreamFactory REST API generation.',
    type: 'website',
    images: [
      {
        url: '/assets/img/dreamfactory-logo-social.png',
        width: 1200,
        height: 630,
        alt: 'DreamFactory Download Options',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Download DreamFactory | REST API Generation Platform',
    description: 'Choose from cloud deployments or local installers to get started with DreamFactory.',
    images: ['/assets/img/dreamfactory-logo-social.png'],
  },
  robots: {
    index: false, // Admin interface should not be indexed
    follow: false,
    nocache: true,
  },
  alternates: {
    canonical: '/adf-home/download',
  },
};