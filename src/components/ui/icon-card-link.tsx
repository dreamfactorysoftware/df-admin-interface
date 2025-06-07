/**
 * @fileoverview Icon Card Link Component for DreamFactory Admin Interface
 * 
 * React component that displays a clickable card with an icon and label,
 * designed for showcasing platform-specific SDK examples and resource links.
 * Migrated from Angular DfIconCardLinkComponent to React 19 patterns with
 * enhanced accessibility, responsive design, and Tailwind CSS styling.
 * 
 * Key Features:
 * - Accessible external link navigation with proper ARIA labels
 * - Responsive design with breakpoint-aware layouts
 * - Dark mode support with theme-aware styling
 * - Hover and focus states with smooth transitions
 * - Image optimization for SDK platform icons
 * - Support for localized link names via translation keys
 * 
 * @author DreamFactory Admin Interface Team
 * @version React 19/Next.js 15.1 Migration
 */

'use client';

import { forwardRef, type AnchorHTMLAttributes } from 'react';
import Image from 'next/image';
import { ExternalLink } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { ExampleLink } from '@/lib/constants/home';

/**
 * Interface for IconCardLink component props
 * Extends standard anchor attributes while providing structured link information
 */
interface IconCardLinkProps extends Omit<AnchorHTMLAttributes<HTMLAnchorElement>, 'href'> {
  /** Link information containing name, URL, and icon */
  linkInfo: ExampleLink;
  /** Additional CSS classes for styling customization */
  className?: string;
  /** Whether to show the external link indicator */
  showExternalIcon?: boolean;
  /** Size variant for different use cases */
  size?: 'sm' | 'md' | 'lg';
  /** Whether to use compact layout */
  compact?: boolean;
}

/**
 * Icon Card Link Component
 * 
 * Displays a visually appealing card with an icon and label that links to external
 * resources or SDK repositories. Provides consistent styling and interaction patterns
 * for platform-specific examples and documentation links.
 * 
 * Features:
 * - Responsive card layout with hover animations
 * - Optimized image loading with Next.js Image component
 * - Accessibility compliance with ARIA labels and keyboard navigation
 * - Theme-aware styling for light and dark modes
 * - External link indication for user awareness
 * - Smooth transitions and micro-interactions
 * 
 * @param props - Component props including link information and styling options
 * @returns JSX element representing an interactive card link
 */
export const IconCardLink = forwardRef<HTMLAnchorElement, IconCardLinkProps>(
  ({ 
    linkInfo, 
    className, 
    showExternalIcon = true,
    size = 'md',
    compact = false,
    ...props 
  }, ref) => {
    // Validate required link information
    if (!linkInfo || !linkInfo.url || !linkInfo.name) {
      console.warn('IconCardLink: Invalid linkInfo provided', linkInfo);
      return null;
    }

    // Size-based styling variants
    const sizeClasses = {
      sm: {
        card: 'p-3',
        image: 'h-8 w-8',
        label: 'text-xs',
        container: 'min-h-[80px]'
      },
      md: {
        card: 'p-4',
        image: 'h-12 w-12',
        label: 'text-sm',
        container: 'min-h-[120px]'
      },
      lg: {
        card: 'p-6',
        image: 'h-16 w-16',
        label: 'text-base',
        container: 'min-h-[160px]'
      }
    };

    const currentSize = sizeClasses[size];

    // Construct image path with fallback
    const imagePath = linkInfo.icon.startsWith('/')
      ? linkInfo.icon
      : `/assets/img/${linkInfo.icon}`;

    // Generate accessible label
    const accessibleLabel = `Open ${linkInfo.name} SDK documentation in new tab`;

    return (
      <a
        ref={ref}
        href={linkInfo.url}
        target="_blank"
        rel="noopener noreferrer"
        className={cn(
          // Base container styles
          'group relative flex flex-col items-center justify-center',
          'focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2',
          'transition-all duration-200 ease-in-out',
          'rounded-lg overflow-hidden',
          currentSize.container,
          // Hover and focus effects
          'hover:scale-105 hover:shadow-lg',
          'focus-visible:scale-105 focus-visible:shadow-lg',
          className
        )}
        aria-label={accessibleLabel}
        title={linkInfo.description || linkInfo.name}
        data-testid={`icon-card-link-${linkInfo.name.toLowerCase().replace(/\s+/g, '-')}`}
        {...props}
      >
        {/* Card Background */}
        <div
          className={cn(
            // Base card styles
            'w-full h-full flex flex-col items-center justify-center',
            'bg-white dark:bg-gray-800',
            'border border-gray-200 dark:border-gray-700',
            'rounded-lg shadow-sm',
            'transition-all duration-200 ease-in-out',
            // Hover effects
            'group-hover:border-primary-300 dark:group-hover:border-primary-600',
            'group-hover:shadow-md',
            // Focus effects
            'group-focus-visible:border-primary-400 dark:group-focus-visible:border-primary-500',
            currentSize.card,
            compact && 'space-y-2'
          )}
        >
          {/* Icon Container */}
          <div className="relative flex items-center justify-center">
            <Image
              src={imagePath}
              alt={`${linkInfo.name} logo`}
              width={size === 'lg' ? 64 : size === 'md' ? 48 : 32}
              height={size === 'lg' ? 64 : size === 'md' ? 48 : 32}
              className={cn(
                currentSize.image,
                'object-contain transition-transform duration-200',
                'group-hover:scale-110'
              )}
              quality={85}
              priority={false}
              loading="lazy"
              onError={(e) => {
                // Fallback to a default icon if image fails to load
                const target = e.target as HTMLImageElement;
                target.src = '/assets/img/default-sdk-icon.png';
              }}
            />

            {/* External Link Indicator */}
            {showExternalIcon && (
              <ExternalLink
                className={cn(
                  'absolute -top-1 -right-1 h-3 w-3 text-gray-400',
                  'opacity-0 group-hover:opacity-100 transition-opacity duration-200',
                  'dark:text-gray-500'
                )}
                aria-hidden="true"
              />
            )}
          </div>

          {/* Label */}
          <span
            className={cn(
              'text-center font-medium leading-tight',
              'text-gray-900 dark:text-white',
              'transition-colors duration-200',
              'group-hover:text-primary-700 dark:group-hover:text-primary-300',
              currentSize.label,
              compact ? 'mt-1' : 'mt-2'
            )}
          >
            {/* Handle translation keys or direct text */}
            {linkInfo.name.startsWith('home.') ? linkInfo.name.split('.').pop() : linkInfo.name}
          </span>

          {/* Optional Description */}
          {linkInfo.description && !compact && (
            <p className="text-xs text-gray-500 dark:text-gray-400 text-center mt-1 px-2 leading-relaxed">
              {linkInfo.description}
            </p>
          )}
        </div>

        {/* Ripple Effect on Click */}
        <div
          className="absolute inset-0 rounded-lg pointer-events-none opacity-0 
                     group-active:opacity-20 group-active:bg-primary-500 
                     transition-opacity duration-150"
          aria-hidden="true"
        />
      </a>
    );
  }
);

IconCardLink.displayName = 'IconCardLink';

/**
 * Export component and types for external usage
 */
export default IconCardLink;
export type { IconCardLinkProps };