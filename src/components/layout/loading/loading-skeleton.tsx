"use client";

import React, { forwardRef } from "react";
import { type VariantProps } from "class-variance-authority";
import { cva } from "class-variance-authority";
import { cn } from "@/lib/utils";
import { type LoadingStateValue } from "@/types/loading";

/**
 * Loading Skeleton Component for DreamFactory Admin Interface
 * 
 * Provides placeholder content shapes during data fetching operations with improved
 * perceived performance. Integrates with TanStack React Query 5.0.0 loading states
 * for automatic display triggering and responsive design patterns.
 * 
 * Features:
 * - Shimmer animation effects using Tailwind CSS gradients and transforms
 * - Configurable skeleton variants for text, images, buttons, and table rows  
 * - Integration with React Query loading states for automatic skeleton display
 * - Responsive skeleton layouts adapting to mobile and desktop viewports
 * - WCAG 2.1 AA accessibility support with proper screen reader announcements
 * - Performance optimized with CSS-only animations
 * 
 * @see Technical Specification Section 7.1 - CORE UI TECHNOLOGIES
 * @see Technical Specification Section 4.3 - STATE MANAGEMENT WORKFLOWS
 * @see WCAG 2.1 AA Guidelines: https://www.w3.org/WAI/WCAG21/Understanding/
 */

/**
 * Base skeleton animation classes with shimmer effect
 * Uses CSS gradients and transforms for performance-optimized animations
 */
const skeletonBase = cva([
  // Base styling
  "animate-pulse",
  "bg-gradient-to-r",
  "from-gray-200",
  "via-gray-300", 
  "to-gray-200",
  "dark:from-gray-800",
  "dark:via-gray-700",
  "dark:to-gray-800",
  "rounded",
  
  // Enhanced shimmer animation using CSS transforms
  "relative",
  "overflow-hidden",
  "before:absolute",
  "before:inset-0",
  "before:-translate-x-full",
  "before:animate-[shimmer_2s_infinite]",
  "before:bg-gradient-to-r",
  "before:from-transparent",
  "before:via-white/60",
  "before:to-transparent",
  "dark:before:via-white/20",
]);

/**
 * Skeleton variant styles for different content types
 * Optimized for common DreamFactory interface patterns
 */
const skeletonVariants = cva(skeletonBase, {
  variants: {
    /**
     * Content type variants
     */
    variant: {
      // Text content skeletons
      "text": "h-4 w-full",
      "text-sm": "h-3 w-3/4",
      "text-lg": "h-5 w-5/6", 
      "text-xl": "h-6 w-4/5",
      "heading": "h-8 w-2/3",
      "subheading": "h-6 w-1/2",
      
      // UI element skeletons
      "button": "h-10 w-24 rounded-md",
      "button-sm": "h-8 w-20 rounded-md",
      "button-lg": "h-12 w-32 rounded-md",
      "input": "h-10 w-full rounded-md",
      "select": "h-10 w-48 rounded-md",
      "checkbox": "h-5 w-5 rounded",
      "radio": "h-5 w-5 rounded-full",
      "switch": "h-6 w-11 rounded-full",
      
      // Content block skeletons
      "image": "aspect-video w-full rounded-lg",
      "image-sm": "h-16 w-16 rounded-lg",
      "image-md": "h-24 w-24 rounded-lg", 
      "image-lg": "h-32 w-32 rounded-lg",
      "avatar": "h-10 w-10 rounded-full",
      "avatar-sm": "h-8 w-8 rounded-full",
      "avatar-lg": "h-12 w-12 rounded-full",
      "card": "h-48 w-full rounded-lg",
      "card-sm": "h-32 w-full rounded-lg",
      "icon": "h-6 w-6 rounded",
      
      // Database schema specific skeletons
      "table-row": "h-12 w-full",
      "table-cell": "h-6 w-full",
      "tree-node": "h-8 w-full",
      "tree-indent": "h-6 w-4/5 ml-6",
      "connection-card": "h-24 w-full rounded-lg",
      "schema-item": "h-10 w-full",
      
      // API generation specific skeletons
      "endpoint-item": "h-16 w-full rounded-md",
      "method-badge": "h-6 w-16 rounded-full",
      "parameter-row": "h-8 w-full",
      "code-block": "h-32 w-full rounded-md font-mono",
      
      // Dashboard and metrics skeletons
      "metric-card": "h-20 w-full rounded-lg",
      "chart": "h-64 w-full rounded-lg",
      "progress-bar": "h-2 w-full rounded-full",
      "badge": "h-6 w-16 rounded-full",
      
      // Form specific skeletons
      "form-group": "space-y-2",
      "form-label": "h-4 w-24",
      "form-field": "h-10 w-full rounded-md",
      "form-error": "h-3 w-48",
      
      // Navigation skeletons
      "nav-item": "h-10 w-full rounded-md",
      "breadcrumb": "h-4 w-32",
      "tab": "h-10 w-20 rounded-t-md",
      
      // Custom variant for completely custom styling
      "custom": "",
    },
    
    /**
     * Responsive size variants
     * Adapts skeleton dimensions to different screen sizes
     */
    size: {
      "sm": "scale-90 md:scale-100",
      "md": "scale-100",
      "lg": "scale-110 md:scale-125",
      "responsive": "scale-90 sm:scale-95 md:scale-100 lg:scale-105",
    },
    
    /**
     * Animation intensity variants
     */
    animation: {
      "subtle": "animate-pulse",
      "normal": "animate-pulse before:animate-[shimmer_2s_infinite]",
      "intense": "animate-pulse before:animate-[shimmer_1.5s_infinite]",
      "slow": "animate-pulse before:animate-[shimmer_3s_infinite]",
      "none": "",
    },
    
    /**
     * Corner radius variants
     */
    radius: {
      "none": "rounded-none",
      "sm": "rounded-sm",
      "md": "rounded-md", 
      "lg": "rounded-lg",
      "xl": "rounded-xl",
      "full": "rounded-full",
    },
  },
  defaultVariants: {
    variant: "text",
    size: "md",
    animation: "normal",
    radius: "md",
  },
});

/**
 * Enhanced skeleton props interface
 * Provides comprehensive configuration for all skeleton variations
 */
export interface LoadingSkeletonProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof skeletonVariants> {
  /**
   * Whether to show the skeleton
   * Integrates with React Query loading states
   */
  show?: boolean;
  
  /**
   * React Query loading state integration
   * Automatically shows skeleton based on query status
   */
  queryState?: LoadingStateValue;
  
  /**
   * Number of skeleton lines to render for text variants
   * Useful for multi-line text content
   */
  lines?: number;
  
  /**
   * Custom width for text skeletons
   * Can be percentage, px, rem, or Tailwind width classes
   */
  width?: string | number;
  
  /**
   * Custom height for content skeletons
   * Can be percentage, px, rem, or Tailwind height classes
   */
  height?: string | number;
  
  /**
   * Accessibility label for screen readers
   * Defaults to "Loading content"
   */
  ariaLabel?: string;
  
  /**
   * Whether to announce loading state to screen readers
   * Defaults to true for better accessibility
   */
  announceLoading?: boolean;
  
  /**
   * Custom loading announcement text
   * Used when announceLoading is true
   */
  loadingAnnouncement?: string;
  
  /**
   * Delay before showing skeleton (in milliseconds)
   * Prevents flashing for very fast operations
   */
  delay?: number;
  
  /**
   * Whether this skeleton represents a repeated item
   * Adds appropriate ARIA attributes for screen readers
   */
  isRepeated?: boolean;
  
  /**
   * Index in a list of repeated skeletons
   * Used for accessibility with isRepeated
   */
  repeatIndex?: number;
  
  /**
   * Total count of repeated skeletons
   * Used for accessibility with isRepeated
   */
  repeatTotal?: number;
}

/**
 * Multi-line text skeleton component
 * Renders multiple skeleton lines with decreasing widths
 */
interface TextLinesSkeletonProps {
  lines: number;
  className?: string;
  variant?: "text" | "text-sm" | "text-lg" | "text-xl";
  animation?: "subtle" | "normal" | "intense" | "slow" | "none";
}

const TextLinesSkeleton: React.FC<TextLinesSkeletonProps> = ({
  lines,
  className,
  variant = "text",
  animation = "normal",
}) => {
  const lineWidths = [
    "w-full",
    "w-5/6", 
    "w-4/5",
    "w-3/4",
    "w-2/3",
    "w-3/5",
    "w-1/2",
  ];
  
  return (
    <div className={cn("space-y-2", className)} role="presentation">
      {Array.from({ length: lines }).map((_, index) => (
        <div
          key={index}
          className={cn(
            skeletonVariants({ 
              variant, 
              animation,
            }),
            lineWidths[index % lineWidths.length] || "w-1/2"
          )}
          aria-hidden="true"
        />
      ))}
    </div>
  );
};

/**
 * Main LoadingSkeleton component
 * Provides intelligent skeleton rendering with accessibility and React Query integration
 */
export const LoadingSkeleton = forwardRef<HTMLDivElement, LoadingSkeletonProps>(
  ({
    className,
    variant = "text",
    size = "md", 
    animation = "normal",
    radius = "md",
    show = true,
    queryState,
    lines = 1,
    width,
    height,
    ariaLabel,
    announceLoading = true,
    loadingAnnouncement,
    delay = 0,
    isRepeated = false,
    repeatIndex,
    repeatTotal,
    style,
    ...props
  }, ref) => {
    // Determine if skeleton should be visible
    const isVisible = React.useMemo(() => {
      if (queryState) {
        return queryState === "loading";
      }
      return show;
    }, [show, queryState]);
    
    // Handle delayed rendering
    const [showAfterDelay, setShowAfterDelay] = React.useState(delay === 0);
    
    React.useEffect(() => {
      if (delay > 0 && isVisible) {
        const timer = setTimeout(() => setShowAfterDelay(true), delay);
        return () => clearTimeout(timer);
      } else if (!isVisible) {
        setShowAfterDelay(false);
      }
    }, [delay, isVisible]);
    
    // Handle loading announcements for screen readers
    React.useEffect(() => {
      if (announceLoading && isVisible && showAfterDelay) {
        const announcement = loadingAnnouncement || "Loading content";
        
        // Create and announce to screen readers
        const announcer = document.createElement("div");
        announcer.setAttribute("aria-live", "polite");
        announcer.setAttribute("aria-atomic", "true");
        announcer.className = "sr-only";
        announcer.textContent = announcement;
        
        document.body.appendChild(announcer);
        
        // Clean up announcer element
        setTimeout(() => {
          if (document.body.contains(announcer)) {
            document.body.removeChild(announcer);
          }
        }, 1000);
      }
    }, [announceLoading, isVisible, showAfterDelay, loadingAnnouncement]);
    
    // Don't render if not visible or delay hasn't passed
    if (!isVisible || !showAfterDelay) {
      return null;
    }
    
    // Build accessibility attributes
    const accessibilityProps = {
      "aria-label": ariaLabel || "Loading content",
      "aria-busy": "true",
      "aria-live": "polite" as const,
      role: "status",
      ...(isRepeated && repeatIndex !== undefined && repeatTotal !== undefined && {
        "aria-setsize": repeatTotal,
        "aria-posinset": repeatIndex + 1,
      }),
    };
    
    // Build custom styles
    const customStyles = {
      ...style,
      ...(width && { 
        width: typeof width === "number" ? `${width}px` : width 
      }),
      ...(height && { 
        height: typeof height === "number" ? `${height}px` : height 
      }),
    };
    
    // Render multi-line text skeleton
    if (lines > 1 && variant?.startsWith("text")) {
      return (
        <div
          ref={ref}
          className={cn(className)}
          style={customStyles}
          {...accessibilityProps}
          {...props}
        >
          <TextLinesSkeleton
            lines={lines}
            variant={variant as TextLinesSkeletonProps["variant"]}
            animation={animation}
          />
        </div>
      );
    }
    
    // Render single skeleton element
    return (
      <div
        ref={ref}
        className={cn(
          skeletonVariants({
            variant,
            size,
            animation, 
            radius,
          }),
          className
        )}
        style={customStyles}
        {...accessibilityProps}
        {...props}
      />
    );
  }
);

LoadingSkeleton.displayName = "LoadingSkeleton";

/**
 * Specialized skeleton components for common patterns
 */

/**
 * Database table skeleton for schema discovery
 */
export const TableSkeleton: React.FC<{
  rows?: number;
  showHeader?: boolean;
  className?: string;
}> = ({ rows = 5, showHeader = true, className }) => (
  <div className={cn("space-y-2", className)} role="status" aria-label="Loading table data">
    {showHeader && (
      <LoadingSkeleton variant="table-row" className="bg-gray-50 dark:bg-gray-800" />
    )}
    {Array.from({ length: rows }).map((_, index) => (
      <LoadingSkeleton
        key={index}
        variant="table-row"
        isRepeated={true}
        repeatIndex={index}
        repeatTotal={rows}
      />
    ))}
  </div>
);

/**
 * Schema tree skeleton for hierarchical data
 */
export const SchemaTreeSkeleton: React.FC<{
  nodes?: number;
  maxDepth?: number;
  className?: string;
}> = ({ nodes = 8, maxDepth = 3, className }) => {
  const generateTreeNodes = (count: number, depth = 0): React.ReactNode[] => {
    if (depth >= maxDepth) return [];
    
    return Array.from({ length: count }).map((_, index) => {
      const hasChildren = depth < maxDepth - 1 && Math.random() > 0.5;
      const childCount = hasChildren ? Math.floor(Math.random() * 3) + 1 : 0;
      
      return (
        <div key={`${depth}-${index}`} className="space-y-1">
          <LoadingSkeleton
            variant={depth === 0 ? "tree-node" : "tree-indent"}
            isRepeated={true}
            repeatIndex={index}
            repeatTotal={count}
          />
          {childCount > 0 && (
            <div className="ml-4 space-y-1">
              {generateTreeNodes(childCount, depth + 1)}
            </div>
          )}
        </div>
      );
    });
  };
  
  return (
    <div className={cn("space-y-2", className)} role="status" aria-label="Loading schema tree">
      {generateTreeNodes(nodes)}
    </div>
  );
};

/**
 * API endpoint list skeleton
 */
export const EndpointListSkeleton: React.FC<{
  endpoints?: number;
  className?: string;
}> = ({ endpoints = 6, className }) => (
  <div className={cn("space-y-3", className)} role="status" aria-label="Loading API endpoints">
    {Array.from({ length: endpoints }).map((_, index) => (
      <div key={index} className="flex items-center space-x-3">
        <LoadingSkeleton variant="method-badge" />
        <LoadingSkeleton 
          variant="endpoint-item" 
          className="flex-1"
          isRepeated={true}
          repeatIndex={index}
          repeatTotal={endpoints}
        />
      </div>
    ))}
  </div>
);

/**
 * Service connection card skeleton
 */
export const ServiceCardSkeleton: React.FC<{
  count?: number;
  className?: string;
}> = ({ count = 3, className }) => (
  <div className={cn("grid gap-4 md:grid-cols-2 lg:grid-cols-3", className)}>
    {Array.from({ length: count }).map((_, index) => (
      <div key={index} className="space-y-3 p-4 border rounded-lg">
        <div className="flex items-center space-x-3">
          <LoadingSkeleton variant="icon" />
          <LoadingSkeleton variant="heading" className="flex-1" />
        </div>
        <LoadingSkeleton variant="text" lines={2} />
        <div className="flex space-x-2">
          <LoadingSkeleton variant="button-sm" />
          <LoadingSkeleton variant="button-sm" />
        </div>
      </div>
    ))}
  </div>
);

/**
 * Form skeleton for configuration interfaces
 */
export const FormSkeleton: React.FC<{
  fields?: number;
  showButtons?: boolean;
  className?: string;
}> = ({ fields = 5, showButtons = true, className }) => (
  <div className={cn("space-y-6", className)} role="status" aria-label="Loading form">
    {Array.from({ length: fields }).map((_, index) => (
      <div key={index} className="space-y-2">
        <LoadingSkeleton variant="form-label" />
        <LoadingSkeleton variant="form-field" />
        {Math.random() > 0.7 && (
          <LoadingSkeleton variant="form-error" />
        )}
      </div>
    ))}
    {showButtons && (
      <div className="flex space-x-3 pt-4">
        <LoadingSkeleton variant="button" />
        <LoadingSkeleton variant="button" />
      </div>
    )}
  </div>
);

/**
 * Utility function to create React Query skeleton integration
 */
export const withSkeletonQuery = <T,>(
  query: { isLoading: boolean; data?: T; error?: unknown },
  skeletonComponent: React.ReactNode,
  children: (data: T) => React.ReactNode
): React.ReactNode => {
  if (query.isLoading) {
    return skeletonComponent;
  }
  
  if (query.error) {
    return null; // Error handling should be done by error boundaries or explicit error components
  }
  
  if (query.data) {
    return children(query.data);
  }
  
  return null;
};

/**
 * Hook for managing skeleton display with React Query integration
 */
export const useSkeletonState = (
  queryState: LoadingStateValue,
  delay = 200
) => {
  const [shouldShow, setShouldShow] = React.useState(false);
  
  React.useEffect(() => {
    if (queryState === "loading") {
      const timer = setTimeout(() => setShouldShow(true), delay);
      return () => clearTimeout(timer);
    } else {
      setShouldShow(false);
    }
  }, [queryState, delay]);
  
  return shouldShow;
};

// Export types for external usage
export type { LoadingSkeletonProps };

// Export variants for external composition
export { skeletonVariants };