'use client';

import React, { forwardRef } from 'react';
import { cn } from '@/lib/utils';

/**
 * Loading skeleton types and interfaces
 * These types define the shape and behavior of skeleton components
 */
interface BaseSkeletonProps {
  /** Additional CSS classes for styling */
  className?: string;
  /** Whether to show shimmer animation effect */
  animate?: boolean;
  /** Accessibility label for screen readers */
  'aria-label'?: string;
  /** Test identifier for component testing */
  'data-testid'?: string;
}

interface SkeletonTextProps extends BaseSkeletonProps {
  /** Number of text lines to display */
  lines?: number;
  /** Width of each line (px, %, or tailwind class) */
  lineWidth?: string | string[];
  /** Height of each line */
  lineHeight?: 'sm' | 'md' | 'lg';
  /** Spacing between lines */
  spacing?: 'tight' | 'normal' | 'loose';
}

interface SkeletonImageProps extends BaseSkeletonProps {
  /** Width of the image skeleton */
  width?: string;
  /** Height of the image skeleton */
  height?: string;
  /** Shape of the image placeholder */
  shape?: 'rectangle' | 'circle' | 'rounded';
  /** Aspect ratio for responsive images */
  aspectRatio?: '1:1' | '16:9' | '4:3' | '3:2';
}

interface SkeletonTableProps extends BaseSkeletonProps {
  /** Number of rows to display */
  rows?: number;
  /** Column configuration for table structure */
  columns?: Array<{
    width?: string;
    align?: 'left' | 'center' | 'right';
  }>;
  /** Whether to show table header */
  showHeader?: boolean;
}

interface SkeletonCardProps extends BaseSkeletonProps {
  /** Include image placeholder in card */
  includeImage?: boolean;
  /** Include action buttons area */
  includeActions?: boolean;
  /** Card layout variant */
  variant?: 'default' | 'compact' | 'detailed';
}

interface LoadingSkeletonProps extends BaseSkeletonProps {
  /** Type of skeleton to display */
  variant?: 'text' | 'image' | 'button' | 'table' | 'card' | 'custom';
  /** Loading state from React Query or custom hook */
  isLoading?: boolean;
  /** Content to show when not loading */
  children?: React.ReactNode;
  /** Custom skeleton content */
  skeleton?: React.ReactNode;
  /** Props specific to the skeleton variant */
  skeletonProps?: SkeletonTextProps | SkeletonImageProps | SkeletonTableProps | SkeletonCardProps;
}

/**
 * Base skeleton component with shimmer animation
 * Provides the foundational shimmer effect used by all skeleton variants
 */
const SkeletonBase = forwardRef<HTMLDivElement, BaseSkeletonProps>(
  ({ className, animate = true, 'aria-label': ariaLabel, 'data-testid': dataTestId, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          'bg-gray-200 dark:bg-gray-700',
          animate && [
            'relative overflow-hidden',
            'before:absolute before:inset-0',
            'before:-translate-x-full',
            'before:animate-[shimmer_2s_infinite]',
            'before:bg-gradient-to-r',
            'before:from-transparent before:via-white/60 before:to-transparent',
            'dark:before:via-white/10'
          ],
          className
        )}
        role="status"
        aria-label={ariaLabel || 'Loading content'}
        aria-hidden="true"
        data-testid={dataTestId}
        {...props}
      />
    );
  }
);

SkeletonBase.displayName = 'SkeletonBase';

/**
 * Text skeleton component
 * Creates placeholder lines for text content with configurable spacing and width
 */
const SkeletonText = forwardRef<HTMLDivElement, SkeletonTextProps>(
  ({ 
    lines = 3, 
    lineWidth = '100%', 
    lineHeight = 'md',
    spacing = 'normal',
    className,
    animate = true,
    'aria-label': ariaLabel,
    'data-testid': dataTestId,
    ...props 
  }, ref) => {
    const heightClasses = {
      sm: 'h-3',
      md: 'h-4',
      lg: 'h-5'
    };

    const spacingClasses = {
      tight: 'space-y-1',
      normal: 'space-y-2',
      loose: 'space-y-3'
    };

    const widths = Array.isArray(lineWidth) ? lineWidth : Array(lines).fill(lineWidth);

    return (
      <div
        ref={ref}
        className={cn('space-y-2', spacingClasses[spacing], className)}
        role="status"
        aria-label={ariaLabel || `Loading ${lines} lines of text`}
        data-testid={dataTestId || 'skeleton-text'}
        {...props}
      >
        {Array.from({ length: lines }, (_, index) => (
          <SkeletonBase
            key={index}
            animate={animate}
            className={cn(
              'rounded',
              heightClasses[lineHeight],
              // Apply specific width or use default
              typeof widths[index] === 'string' && widths[index].includes('%') 
                ? { width: widths[index] }
                : widths[index]?.startsWith('w-') 
                  ? widths[index]
                  : 'w-full',
              // Make last line shorter for natural text appearance
              index === lines - 1 && lineWidth === '100%' && 'w-4/5'
            )}
            style={
              typeof widths[index] === 'string' && widths[index].includes('%')
                ? { width: widths[index] }
                : undefined
            }
            aria-hidden="true"
          />
        ))}
      </div>
    );
  }
);

SkeletonText.displayName = 'SkeletonText';

/**
 * Image skeleton component
 * Creates placeholder shapes for images with various aspect ratios and shapes
 */
const SkeletonImage = forwardRef<HTMLDivElement, SkeletonImageProps>(
  ({ 
    width = 'w-full', 
    height = 'h-48', 
    shape = 'rectangle',
    aspectRatio,
    className,
    animate = true,
    'aria-label': ariaLabel,
    'data-testid': dataTestId,
    ...props 
  }, ref) => {
    const shapeClasses = {
      rectangle: 'rounded',
      circle: 'rounded-full',
      rounded: 'rounded-lg'
    };

    const aspectRatioClasses = {
      '1:1': 'aspect-square',
      '16:9': 'aspect-video',
      '4:3': 'aspect-[4/3]',
      '3:2': 'aspect-[3/2]'
    };

    return (
      <SkeletonBase
        ref={ref}
        animate={animate}
        className={cn(
          width,
          aspectRatio ? aspectRatioClasses[aspectRatio] : height,
          shapeClasses[shape],
          className
        )}
        aria-label={ariaLabel || 'Loading image'}
        data-testid={dataTestId || 'skeleton-image'}
        {...props}
      />
    );
  }
);

SkeletonImage.displayName = 'SkeletonImage';

/**
 * Button skeleton component
 * Creates placeholder for button elements with proper sizing
 */
const SkeletonButton = forwardRef<HTMLDivElement, BaseSkeletonProps>(
  ({ className, animate = true, 'aria-label': ariaLabel, 'data-testid': dataTestId, ...props }, ref) => {
    return (
      <SkeletonBase
        ref={ref}
        animate={animate}
        className={cn(
          'h-10 w-24 rounded-md',
          className
        )}
        aria-label={ariaLabel || 'Loading button'}
        data-testid={dataTestId || 'skeleton-button'}
        {...props}
      />
    );
  }
);

SkeletonButton.displayName = 'SkeletonButton';

/**
 * Table skeleton component
 * Creates placeholder for table structures with configurable rows and columns
 */
const SkeletonTable = forwardRef<HTMLDivElement, SkeletonTableProps>(
  ({ 
    rows = 5, 
    columns = [{ width: 'w-1/4' }, { width: 'w-1/2' }, { width: 'w-1/4' }],
    showHeader = true,
    className,
    animate = true,
    'aria-label': ariaLabel,
    'data-testid': dataTestId,
    ...props 
  }, ref) => {
    return (
      <div
        ref={ref}
        className={cn('space-y-3', className)}
        role="status"
        aria-label={ariaLabel || `Loading table with ${rows} rows`}
        data-testid={dataTestId || 'skeleton-table'}
        {...props}
      >
        {/* Table header */}
        {showHeader && (
          <div className="flex space-x-3" data-testid="skeleton-table-header">
            {columns.map((column, index) => (
              <SkeletonBase
                key={`header-${index}`}
                animate={animate}
                className={cn(
                  'h-4 rounded',
                  column.width || 'flex-1'
                )}
                aria-hidden="true"
              />
            ))}
          </div>
        )}

        {/* Table rows */}
        <div className="space-y-2" data-testid="skeleton-table-rows">
          {Array.from({ length: rows }, (_, rowIndex) => (
            <div key={`row-${rowIndex}`} className="flex space-x-3">
              {columns.map((column, colIndex) => (
                <SkeletonBase
                  key={`cell-${rowIndex}-${colIndex}`}
                  animate={animate}
                  className={cn(
                    'h-4 rounded',
                    column.width || 'flex-1'
                  )}
                  aria-hidden="true"
                />
              ))}
            </div>
          ))}
        </div>
      </div>
    );
  }
);

SkeletonTable.displayName = 'SkeletonTable';

/**
 * Card skeleton component
 * Creates placeholder for card layouts with optional image and actions
 */
const SkeletonCard = forwardRef<HTMLDivElement, SkeletonCardProps>(
  ({ 
    includeImage = true,
    includeActions = true,
    variant = 'default',
    className,
    animate = true,
    'aria-label': ariaLabel,
    'data-testid': dataTestId,
    ...props 
  }, ref) => {
    const variantSpacing = {
      default: 'p-4 space-y-4',
      compact: 'p-3 space-y-2',
      detailed: 'p-6 space-y-6'
    };

    return (
      <div
        ref={ref}
        className={cn(
          'border border-gray-200 dark:border-gray-700 rounded-lg',
          variantSpacing[variant],
          className
        )}
        role="status"
        aria-label={ariaLabel || 'Loading card content'}
        data-testid={dataTestId || 'skeleton-card'}
        {...props}
      >
        {/* Card image */}
        {includeImage && (
          <SkeletonImage
            animate={animate}
            aspectRatio="16:9"
            shape="rounded"
            className="w-full"
            data-testid="skeleton-card-image"
          />
        )}

        {/* Card content */}
        <div className="space-y-3" data-testid="skeleton-card-content">
          {/* Title */}
          <SkeletonBase
            animate={animate}
            className="h-6 w-3/4 rounded"
            aria-hidden="true"
          />
          
          {/* Description */}
          <SkeletonText
            animate={animate}
            lines={variant === 'compact' ? 2 : variant === 'detailed' ? 4 : 3}
            spacing={variant === 'compact' ? 'tight' : 'normal'}
          />
        </div>

        {/* Card actions */}
        {includeActions && (
          <div className="flex space-x-2 pt-2" data-testid="skeleton-card-actions">
            <SkeletonButton animate={animate} className="w-20" />
            <SkeletonButton animate={animate} className="w-16" />
          </div>
        )}
      </div>
    );
  }
);

SkeletonCard.displayName = 'SkeletonCard';

/**
 * Main LoadingSkeleton component
 * Provides conditional rendering based on loading state with React Query integration
 */
const LoadingSkeleton = forwardRef<HTMLDivElement, LoadingSkeletonProps>(
  ({ 
    variant = 'text',
    isLoading = true,
    children,
    skeleton,
    skeletonProps = {},
    className,
    animate = true,
    'aria-label': ariaLabel,
    'data-testid': dataTestId,
    ...props 
  }, ref) => {
    // If not loading, render children
    if (!isLoading) {
      return <>{children}</>;
    }

    // If custom skeleton provided, use it
    if (skeleton) {
      return (
        <div
          ref={ref}
          className={className}
          role="status"
          aria-label={ariaLabel || 'Loading content'}
          data-testid={dataTestId || 'loading-skeleton'}
          {...props}
        >
          {skeleton}
        </div>
      );
    }

    // Render appropriate skeleton variant
    const commonProps = {
      ref,
      animate,
      className,
      'aria-label': ariaLabel,
      'data-testid': dataTestId || `skeleton-${variant}`,
      ...props
    };

    switch (variant) {
      case 'text':
        return <SkeletonText {...commonProps} {...(skeletonProps as SkeletonTextProps)} />;
      
      case 'image':
        return <SkeletonImage {...commonProps} {...(skeletonProps as SkeletonImageProps)} />;
      
      case 'button':
        return <SkeletonButton {...commonProps} />;
      
      case 'table':
        return <SkeletonTable {...commonProps} {...(skeletonProps as SkeletonTableProps)} />;
      
      case 'card':
        return <SkeletonCard {...commonProps} {...(skeletonProps as SkeletonCardProps)} />;
      
      default:
        return <SkeletonText {...commonProps} />;
    }
  }
);

LoadingSkeleton.displayName = 'LoadingSkeleton';

/**
 * Hook for React Query integration
 * Provides skeleton loading states for data fetching operations
 */
export function useSkeletonLoader<T>(
  queryResult: { isLoading: boolean; isError: boolean; data: T },
  skeletonConfig?: Omit<LoadingSkeletonProps, 'isLoading' | 'children'>
) {
  const { isLoading, isError, data } = queryResult;

  const renderSkeleton = (children: React.ReactNode) => (
    <LoadingSkeleton
      isLoading={isLoading && !isError}
      {...skeletonConfig}
    >
      {children}
    </LoadingSkeleton>
  );

  return {
    isLoading: isLoading && !isError,
    data,
    isError,
    renderSkeleton
  };
}

/**
 * Responsive skeleton utilities
 * Provides responsive skeleton patterns for different screen sizes
 */
export const ResponsiveSkeletonGrid = forwardRef<HTMLDivElement, {
  items?: number;
  columns?: {
    sm?: number;
    md?: number;
    lg?: number;
    xl?: number;
  };
  skeletonType?: 'card' | 'text' | 'image';
  className?: string;
  animate?: boolean;
  'data-testid'?: string;
}>(({ 
  items = 6, 
  columns = { sm: 1, md: 2, lg: 3, xl: 4 },
  skeletonType = 'card',
  className,
  animate = true,
  'data-testid': dataTestId,
  ...props 
}, ref) => {
  const gridClasses = [
    'grid gap-4',
    columns.sm && `grid-cols-${columns.sm}`,
    columns.md && `md:grid-cols-${columns.md}`,
    columns.lg && `lg:grid-cols-${columns.lg}`,
    columns.xl && `xl:grid-cols-${columns.xl}`
  ].filter(Boolean).join(' ');

  return (
    <div
      ref={ref}
      className={cn(gridClasses, className)}
      role="status"
      aria-label={`Loading ${items} items in grid layout`}
      data-testid={dataTestId || 'skeleton-grid'}
      {...props}
    >
      {Array.from({ length: items }, (_, index) => (
        <LoadingSkeleton
          key={index}
          variant={skeletonType}
          animate={animate}
          data-testid={`skeleton-grid-item-${index}`}
        />
      ))}
    </div>
  );
});

ResponsiveSkeletonGrid.displayName = 'ResponsiveSkeletonGrid';

// Export all components and utilities
export {
  LoadingSkeleton as default,
  LoadingSkeleton,
  SkeletonText,
  SkeletonImage,
  SkeletonButton,
  SkeletonTable,
  SkeletonCard,
  SkeletonBase,
  useSkeletonLoader,
  ResponsiveSkeletonGrid
};

// Export types for TypeScript consumers
export type {
  LoadingSkeletonProps,
  SkeletonTextProps,
  SkeletonImageProps,
  SkeletonTableProps,
  SkeletonCardProps,
  BaseSkeletonProps
};