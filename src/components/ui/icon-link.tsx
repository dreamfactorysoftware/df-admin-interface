/**
 * @fileoverview IconLink UI Component for DreamFactory Admin Interface
 * 
 * React component migrated from Angular DfIconLinkComponent to provide consistent
 * icon-based navigation links with internationalization, accessibility, and 
 * responsive design. Replaces FontAwesome icons with Lucide React for better
 * React ecosystem integration and bundle optimization.
 * 
 * Key Features:
 * - Lucide React icons with consistent styling
 * - Tailwind CSS utility classes for responsive design
 * - WCAG 2.1 AA accessibility compliance with ARIA labels
 * - TypeScript interfaces for type safety
 * - Hover and focus states with smooth transitions
 * - External link indicators for user experience
 * 
 * Performance Requirements:
 * - Component render time under 10ms
 * - Smooth hover transitions under 200ms
 * - Accessible keyboard navigation support
 * 
 * @author DreamFactory Admin Interface Team
 * @version React 19/Next.js 15.1 Migration
 */

import React from 'react';
import Link from 'next/link';
import { ExternalLink } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

/**
 * Interface for IconLink component props
 * Maintains compatibility with Angular version while adding React-specific features
 */
export interface IconLinkProps {
  /** Resource link item containing name, icon, and URL */
  linkItem: {
    name: string;
    icon: LucideIcon;
    link: string;
    description?: string;
    category?: string;
  };
  
  /** Optional custom className for styling overrides */
  className?: string;
  
  /** Size variant for the icon and text */
  size?: 'sm' | 'md' | 'lg';
  
  /** Color variant for theming */
  variant?: 'default' | 'primary' | 'secondary' | 'muted';
  
  /** Whether to show external link indicator */
  showExternalIcon?: boolean;
  
  /** Optional click handler for analytics or custom behavior */
  onClick?: (linkItem: IconLinkProps['linkItem']) => void;
  
  /** Whether to open link in new tab (default: true for external links) */
  target?: '_blank' | '_self';
  
  /** Optional aria-label override for accessibility */
  ariaLabel?: string;
}

/**
 * Size configuration mapping
 * Defines consistent sizing across component variants
 */
const sizeConfig = {
  sm: {
    icon: 'h-4 w-4',
    text: 'text-sm',
    spacing: 'gap-2',
    padding: 'px-2 py-1',
  },
  md: {
    icon: 'h-5 w-5',
    text: 'text-base',
    spacing: 'gap-3',
    padding: 'px-3 py-2',
  },
  lg: {
    icon: 'h-6 w-6',
    text: 'text-lg',
    spacing: 'gap-4',
    padding: 'px-4 py-3',
  },
} as const;

/**
 * Color variant configuration
 * Provides consistent theming across the application
 */
const variantConfig = {
  default: {
    link: 'text-gray-700 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white',
    icon: 'text-gray-600 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200',
    external: 'text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300',
  },
  primary: {
    link: 'text-primary-600 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300',
    icon: 'text-primary-500 hover:text-primary-600 dark:text-primary-400 dark:hover:text-primary-300',
    external: 'text-primary-400 hover:text-primary-500 dark:text-primary-500 dark:hover:text-primary-400',
  },
  secondary: {
    link: 'text-gray-600 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200',
    icon: 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300',
    external: 'text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300',
  },
  muted: {
    link: 'text-gray-500 hover:text-gray-700 dark:text-gray-500 dark:hover:text-gray-300',
    icon: 'text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-400',
    external: 'text-gray-300 hover:text-gray-500 dark:text-gray-600 dark:hover:text-gray-400',
  },
} as const;

/**
 * Utility function to determine if a link is external
 * Checks if the URL starts with http/https or is an absolute URL
 */
function isExternalLink(url: string): boolean {
  return url.startsWith('http://') || url.startsWith('https://') || url.startsWith('//');
}

/**
 * IconLink Component
 * 
 * Renders an accessible icon-based link with consistent styling and behavior.
 * Supports both internal Next.js navigation and external links with proper
 * accessibility attributes and visual indicators.
 * 
 * Features:
 * - Automatic external link detection and handling
 * - Accessible keyboard navigation with focus management
 * - Smooth hover and focus transitions
 * - Responsive design with size variants
 * - ARIA labels for screen reader support
 * - Optional click tracking for analytics
 * 
 * @param props - Component props including linkItem and styling options
 * @returns JSX element representing the icon link
 */
export function IconLink({
  linkItem,
  className,
  size = 'md',
  variant = 'default',
  showExternalIcon = true,
  onClick,
  target,
  ariaLabel,
}: IconLinkProps): JSX.Element {
  const { icon: Icon, name, link, description } = linkItem;
  const sizeStyles = sizeConfig[size];
  const variantStyles = variantConfig[variant];
  
  // Determine if this is an external link
  const isExternal = isExternalLink(link);
  const linkTarget = target || (isExternal ? '_blank' : '_self');
  
  // Handle click events
  const handleClick = (event: React.MouseEvent) => {
    if (onClick) {
      onClick(linkItem);
    }
    
    // Add analytics tracking for external links
    if (isExternal && typeof window !== 'undefined') {
      // Analytics tracking can be added here
      console.log('External link clicked:', link);
    }
  };
  
  // Generate accessible label
  const accessibleLabel = ariaLabel || 
    description || 
    `${name}${isExternal ? ' (opens in new tab)' : ''}`;
  
  // Common link styles
  const linkStyles = cn(
    // Base styles
    'inline-flex items-center rounded-md font-medium transition-all duration-200',
    'focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2',
    'hover:bg-gray-50 dark:hover:bg-gray-800/50',
    
    // Size-specific styles
    sizeStyles.spacing,
    sizeStyles.padding,
    
    // Variant-specific styles
    variantStyles.link,
    
    // Custom className override
    className
  );
  
  // Icon styles
  const iconStyles = cn(
    'flex-shrink-0 transition-colors duration-200',
    sizeStyles.icon,
    variantStyles.icon
  );
  
  // Text styles
  const textStyles = cn(
    'transition-colors duration-200',
    sizeStyles.text
  );
  
  // External icon styles
  const externalIconStyles = cn(
    'flex-shrink-0 ml-1 transition-colors duration-200',
    'h-3 w-3', // Always small for external indicator
    variantStyles.external
  );
  
  // Link content
  const linkContent = (
    <>
      <Icon 
        className={iconStyles}
        aria-hidden="true"
      />
      <span className={textStyles}>
        {name}
      </span>
      {isExternal && showExternalIcon && (
        <ExternalLink 
          className={externalIconStyles}
          aria-hidden="true"
        />
      )}
    </>
  );
  
  // Render internal link using Next.js Link component
  if (!isExternal) {
    return (
      <Link 
        href={link}
        className={linkStyles}
        onClick={handleClick}
        aria-label={accessibleLabel}
        title={description}
      >
        {linkContent}
      </Link>
    );
  }
  
  // Render external link with security attributes
  return (
    <a
      href={link}
      target={linkTarget}
      rel={linkTarget === '_blank' ? 'noopener noreferrer' : undefined}
      className={linkStyles}
      onClick={handleClick}
      aria-label={accessibleLabel}
      title={description}
    >
      {linkContent}
    </a>
  );
}

/**
 * Type exports for external usage
 */
export type { IconLinkProps };

/**
 * Default export for convenience
 */
export default IconLink;