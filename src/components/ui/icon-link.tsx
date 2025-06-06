/**
 * IconLink Component for DreamFactory Admin Interface
 * 
 * A reusable React component that renders an external link with an icon and translated label.
 * Replaces the Angular DfIconLinkComponent with React patterns and Tailwind CSS styling.
 * Provides accessibility features, external link handling, and responsive design.
 * 
 * Key Features:
 * - Lucide React icons instead of FontAwesome for smaller bundle size
 * - Next.js internationalization for translated labels
 * - Tailwind CSS for consistent styling with theme support
 * - WCAG 2.1 AA accessibility compliance with proper ARIA attributes
 * - External link security with rel="noopener noreferrer"
 * - Hover and focus states for enhanced UX
 * - TypeScript for type safety and developer experience
 * 
 * @fileoverview Icon-based external link component
 * @version 1.0.0
 * @since Next.js 15.1+ / React 19.0.0
 */

'use client';

import { type ComponentProps, forwardRef } from 'react';
import { type LucideIcon, ExternalLink } from 'lucide-react';
import { cn } from '@/lib/utils';

// =============================================================================
// TYPE DEFINITIONS
// =============================================================================

/**
 * Resource link item interface
 * Matches the structure used in home constants
 */
export interface ResourceLink {
  /** Translation key for the resource name */
  name: string;
  /** Lucide React icon component */
  icon: LucideIcon;
  /** External URL for the resource */
  link: string;
}

/**
 * IconLink component props
 * Extends anchor element props for additional HTML attributes
 */
export interface IconLinkProps extends Omit<ComponentProps<'a'>, 'href' | 'children'> {
  /** Resource link data with icon, name, and URL */
  linkItem: ResourceLink;
  /** Optional variant for different visual styles */
  variant?: 'default' | 'compact' | 'card';
  /** Optional size for icon and text scaling */
  size?: 'sm' | 'md' | 'lg';
  /** Whether to show external link indicator */
  showExternalIcon?: boolean;
  /** Custom CSS class names */
  className?: string;
  /** For internationalization - will be replaced with Next.js i18n hook */
  translateFn?: (key: string) => string;
}

// =============================================================================
// STYLE VARIANTS
// =============================================================================

/**
 * Base styles for all variants
 */
const baseStyles = `
  inline-flex items-center gap-2 
  text-primary-600 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300
  transition-colors duration-200 ease-in-out
  focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 
  dark:focus:ring-offset-gray-900
  rounded-md
`;

/**
 * Variant-specific styles
 */
const variantStyles = {
  default: `
    text-base font-medium
    hover:underline hover:decoration-2 hover:underline-offset-4
    px-1 py-1
  `,
  compact: `
    text-sm font-normal
    px-0.5 py-0.5
  `,
  card: `
    text-base font-semibold
    p-3 border border-gray-200 dark:border-gray-700 rounded-lg
    hover:bg-gray-50 dark:hover:bg-gray-800
    hover:border-primary-300 dark:hover:border-primary-600
    hover:no-underline
    shadow-sm hover:shadow-md
    transition-all duration-200
  `,
};

/**
 * Size-specific styles for icons
 */
const iconSizes = {
  sm: 'h-4 w-4',
  md: 'h-5 w-5',
  lg: 'h-6 w-6',
};

/**
 * Size-specific styles for text
 */
const textSizes = {
  sm: 'text-sm',
  md: 'text-base',
  lg: 'text-lg',
};

// =============================================================================
// COMPONENT IMPLEMENTATION
// =============================================================================

/**
 * IconLink Component
 * 
 * Renders an accessible external link with an icon and translated label.
 * Supports multiple variants and sizes for different use cases.
 * 
 * @param linkItem - Resource link data with icon, name, and URL
 * @param variant - Visual style variant
 * @param size - Icon and text size
 * @param showExternalIcon - Whether to show external link indicator
 * @param className - Additional CSS classes
 * @param translateFn - Translation function (temporary until Next.js i18n is set up)
 * @param ...props - Additional anchor element props
 */
export const IconLink = forwardRef<HTMLAnchorElement, IconLinkProps>(({
  linkItem,
  variant = 'default',
  size = 'md',
  showExternalIcon = true,
  className,
  translateFn,
  ...props
}, ref) => {
  // Temporary translation function until Next.js i18n is implemented
  const translate = translateFn || ((key: string) => {
    // Basic fallback translations for development
    const translations: Record<string, string> = {
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
  });

  const IconComponent = linkItem.icon;
  const linkText = translate(linkItem.name);

  // Construct CSS classes
  const linkClasses = cn(
    baseStyles,
    variantStyles[variant],
    className
  );

  const iconClasses = cn(
    iconSizes[size],
    'shrink-0'
  );

  const textClasses = cn(
    textSizes[size],
    variant === 'card' ? 'font-semibold' : 'font-medium'
  );

  return (
    <a
      ref={ref}
      href={linkItem.link}
      target="_blank"
      rel="noopener noreferrer"
      className={linkClasses}
      aria-label={`${linkText} (opens in new tab)`}
      {...props}
    >
      {/* Main Icon */}
      <IconComponent 
        className={iconClasses}
        aria-hidden="true"
      />
      
      {/* Link Text */}
      <span className={textClasses}>
        {linkText}
      </span>
      
      {/* External Link Indicator */}
      {showExternalIcon && (
        <ExternalLink 
          className={cn(iconSizes[size === 'lg' ? 'md' : 'sm'], 'shrink-0 opacity-60')}
          aria-hidden="true"
        />
      )}
    </a>
  );
});

IconLink.displayName = 'IconLink';

// =============================================================================
// COMPONENT VARIANTS
// =============================================================================

/**
 * Compact IconLink variant
 * Smaller size for secondary navigation or dense layouts
 */
export const CompactIconLink = forwardRef<HTMLAnchorElement, Omit<IconLinkProps, 'variant' | 'size'>>(
  (props, ref) => (
    <IconLink 
      ref={ref} 
      variant="compact" 
      size="sm" 
      showExternalIcon={false}
      {...props} 
    />
  )
);

CompactIconLink.displayName = 'CompactIconLink';

/**
 * Card IconLink variant
 * Card-style layout for featured links and landing pages
 */
export const CardIconLink = forwardRef<HTMLAnchorElement, Omit<IconLinkProps, 'variant'>>(
  (props, ref) => (
    <IconLink 
      ref={ref} 
      variant="card" 
      {...props} 
    />
  )
);

CardIconLink.displayName = 'CardIconLink';

// =============================================================================
// UTILITY FUNCTIONS
// =============================================================================

/**
 * Helper function to validate resource link structure
 * Useful for runtime validation and development
 */
export function isValidResourceLink(item: any): item is ResourceLink {
  return (
    typeof item === 'object' &&
    item !== null &&
    typeof item.name === 'string' &&
    typeof item.link === 'string' &&
    typeof item.icon === 'function'
  );
}

/**
 * Helper function to extract domain from resource link
 * Useful for analytics and security validation
 */
export function getResourceDomain(link: string): string {
  try {
    return new URL(link).hostname;
  } catch {
    return '';
  }
}

/**
 * Helper function to determine if link is secure (HTTPS)
 * Useful for security validation and mixed content warnings
 */
export function isSecureLink(link: string): boolean {
  try {
    return new URL(link).protocol === 'https:';
  } catch {
    return false;
  }
}

// =============================================================================
// DEFAULT EXPORT
// =============================================================================

export default IconLink;