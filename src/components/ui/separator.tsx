/**
 * @fileoverview Separator Component for DreamFactory Admin Interface
 * 
 * React component that provides visual separation between content sections,
 * replacing Angular Material's mat-divider with Tailwind CSS implementation.
 * Supports horizontal and vertical orientations with customizable styling
 * and accessibility features.
 * 
 * Key Features:
 * - Horizontal and vertical orientation support
 * - Customizable color, thickness, and spacing
 * - Dark mode compatibility with theme-aware colors
 * - Semantic HTML with proper ARIA roles
 * - Responsive design with breakpoint-aware visibility
 * - Consistent with design system spacing patterns
 * 
 * @author DreamFactory Admin Interface Team
 * @version React 19/Next.js 15.1 Migration
 */

'use client';

import { forwardRef, type HTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

/**
 * Interface for Separator component props
 * Extends standard div attributes with separator-specific options
 */
interface SeparatorProps extends HTMLAttributes<HTMLDivElement> {
  /** Orientation of the separator */
  orientation?: 'horizontal' | 'vertical';
  /** Visual style variant */
  variant?: 'default' | 'muted' | 'strong' | 'dashed' | 'dotted';
  /** Size/thickness of the separator */
  size?: 'sm' | 'md' | 'lg';
  /** Whether the separator should span full width/height */
  fullSpan?: boolean;
  /** Additional spacing around the separator */
  spacing?: 'none' | 'sm' | 'md' | 'lg' | 'xl';
  /** Custom color override */
  color?: string;
  /** Whether to add decorative elements */
  decorative?: boolean;
}

/**
 * Separator Component
 * 
 * Provides visual separation between content sections with consistent styling
 * and accessibility support. Replaces Angular Material mat-divider with a more
 * flexible and customizable Tailwind CSS implementation.
 * 
 * Features:
 * - Multiple orientation and style variants
 * - Theme-aware colors for light and dark modes
 * - Responsive spacing and sizing options
 * - Semantic HTML with proper accessibility attributes
 * - Customizable appearance with CSS custom properties
 * - Performance-optimized with minimal DOM footprint
 * 
 * @param props - Component props including orientation, variant, and styling options
 * @returns JSX element representing a visual separator
 */
export const Separator = forwardRef<HTMLDivElement, SeparatorProps>(
  ({
    orientation = 'horizontal',
    variant = 'default',
    size = 'md',
    fullSpan = true,
    spacing = 'md',
    color,
    decorative = false,
    className,
    style,
    ...props
  }, ref) => {
    // Base classes for all separators
    const baseClasses = 'flex-shrink-0';

    // Orientation-specific classes
    const orientationClasses = {
      horizontal: cn(
        'w-full h-px',
        fullSpan ? 'self-stretch' : 'max-w-full'
      ),
      vertical: cn(
        'h-full w-px',
        fullSpan ? 'self-stretch' : 'max-h-full',
        'inline-block'
      )
    };

    // Variant-specific styling
    const variantClasses = {
      default: 'bg-gray-200 dark:bg-gray-700',
      muted: 'bg-gray-100 dark:bg-gray-800',
      strong: 'bg-gray-300 dark:bg-gray-600',
      dashed: 'border-dashed border-t border-gray-200 dark:border-gray-700 bg-transparent',
      dotted: 'border-dotted border-t border-gray-200 dark:border-gray-700 bg-transparent'
    };

    // Size-specific thickness
    const sizeClasses = {
      sm: orientation === 'horizontal' ? 'h-px' : 'w-px',
      md: orientation === 'horizontal' ? 'h-px' : 'w-px',
      lg: orientation === 'horizontal' ? 'h-0.5' : 'w-0.5'
    };

    // Spacing classes for margin
    const spacingClasses = {
      none: '',
      sm: orientation === 'horizontal' ? 'my-2' : 'mx-2',
      md: orientation === 'horizontal' ? 'my-4' : 'mx-4',
      lg: orientation === 'horizontal' ? 'my-6' : 'mx-6',
      xl: orientation === 'horizontal' ? 'my-8' : 'mx-8'
    };

    // Handle dashed and dotted variants that use borders instead of background
    const isDashedOrDotted = variant === 'dashed' || variant === 'dotted';
    
    // Adjust classes for dashed/dotted variants
    const finalVariantClasses = isDashedOrDotted 
      ? cn(
          variantClasses[variant],
          orientation === 'vertical' && 'border-t-0 border-l border-r-0 border-b-0'
        )
      : variantClasses[variant];

    // Custom style object
    const customStyle: React.CSSProperties = {
      ...style,
      ...(color && !isDashedOrDotted && { backgroundColor: color }),
      ...(color && isDashedOrDotted && { borderColor: color })
    };

    return (
      <div
        ref={ref}
        role={decorative ? 'presentation' : 'separator'}
        aria-orientation={orientation}
        className={cn(
          baseClasses,
          orientationClasses[orientation],
          finalVariantClasses,
          sizeClasses[size],
          spacingClasses[spacing],
          className
        )}
        style={customStyle}
        data-testid={`separator-${orientation}-${variant}`}
        {...props}
      />
    );
  }
);

Separator.displayName = 'Separator';

/**
 * Convenience components for common separator patterns
 */

/**
 * Section Separator - for major content divisions
 */
export const SectionSeparator = forwardRef<HTMLDivElement, Omit<SeparatorProps, 'variant' | 'spacing'>>(
  (props, ref) => (
    <Separator
      ref={ref}
      variant="default"
      spacing="lg"
      {...props}
    />
  )
);

SectionSeparator.displayName = 'SectionSeparator';

/**
 * Content Separator - for minor content divisions
 */
export const ContentSeparator = forwardRef<HTMLDivElement, Omit<SeparatorProps, 'variant' | 'spacing'>>(
  (props, ref) => (
    <Separator
      ref={ref}
      variant="muted"
      spacing="md"
      {...props}
    />
  )
);

ContentSeparator.displayName = 'ContentSeparator';

/**
 * Menu Separator - for navigation and menu contexts
 */
export const MenuSeparator = forwardRef<HTMLDivElement, Omit<SeparatorProps, 'variant' | 'spacing' | 'fullSpan'>>(
  (props, ref) => (
    <Separator
      ref={ref}
      variant="muted"
      spacing="sm"
      fullSpan={false}
      {...props}
    />
  )
);

MenuSeparator.displayName = 'MenuSeparator';

/**
 * Export component and types for external usage
 */
export default Separator;
export type { SeparatorProps };