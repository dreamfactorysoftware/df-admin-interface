"use client";

import React, { forwardRef } from "react";
import { type VariantProps, cva } from "class-variance-authority";
import { cn } from "@/lib/utils";
import { Button, type ButtonProps } from "./button";
import { buttonVariants } from "./button-variants";

/**
 * IconButton component for the DreamFactory Admin Interface
 * 
 * Specialized button component for icon-only interactions, replacing Angular Material 
 * mat-icon-button and mat-mini-fab patterns with React 19/Tailwind CSS implementation.
 * 
 * Features:
 * - WCAG 2.1 AA compliance with mandatory ARIA labels for icon-only buttons
 * - Circular and square shape variants for different UI contexts
 * - Floating Action Button (FAB) implementation for primary actions
 * - Enhanced tooltip integration for improved user experience
 * - Lucide React icon system integration per Section 7.1.1
 * - Minimum 44x44px touch targets for accessibility compliance
 * - Optimized for toolbar actions, table actions, and floating buttons
 * 
 * @see Technical Specification Section 7.1.1 for icon system requirements
 * @see WCAG 2.1 AA Guidelines for accessibility standards
 */

/**
 * Icon button shape and variant definitions using class-variance-authority
 * Extends the base button system with specialized icon-only styling
 */
export const iconButtonVariants = cva(
  [
    // Base icon button styles
    "relative inline-flex items-center justify-center",
    "transition-all duration-200 ease-in-out",
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2",
    "disabled:pointer-events-none disabled:opacity-50",
    "select-none cursor-pointer",
    // WCAG minimum touch target compliance
    "min-h-[44px] min-w-[44px]",
    // Center icon perfectly
    "text-center",
  ],
  {
    variants: {
      /**
       * Shape variants for different UI contexts
       */
      shape: {
        // Square shape - default for toolbar and grid actions
        square: [
          "rounded-md",
        ],
        
        // Circular shape - for profile actions and primary buttons
        circular: [
          "rounded-full",
        ],
        
        // Rounded shape - balanced appearance for most contexts
        rounded: [
          "rounded-lg",
        ],
      },
      
      /**
       * Size variants maintaining accessibility standards
       * All sizes ensure minimum 44x44px touch targets
       */
      size: {
        // Small - minimum accessibility target
        sm: "h-11 w-11 p-2",
        
        // Medium - comfortable default size
        md: "h-12 w-12 p-2.5",
        
        // Large - enhanced target for important actions
        lg: "h-14 w-14 p-3",
        
        // Extra large - hero actions and primary CTAs
        xl: "h-16 w-16 p-3.5",
        
        // FAB sizes - floating action buttons
        "fab-sm": "h-14 w-14 p-3 shadow-lg hover:shadow-xl",
        "fab-md": "h-16 w-16 p-4 shadow-lg hover:shadow-xl",
        "fab-lg": "h-20 w-20 p-5 shadow-xl hover:shadow-2xl",
      },
      
      /**
       * Elevation for floating action buttons
       */
      elevation: {
        none: "",
        low: "shadow-md hover:shadow-lg",
        medium: "shadow-lg hover:shadow-xl",
        high: "shadow-xl hover:shadow-2xl",
      },
    },
    
    /**
     * Compound variants for complex styling combinations
     */
    compoundVariants: [
      // FAB sizes automatically get circular shape
      {
        size: ["fab-sm", "fab-md", "fab-lg"],
        shape: ["square", "rounded"],
        class: "rounded-full",
      },
      
      // Large FAB gets enhanced shadow
      {
        size: "fab-lg",
        class: "shadow-2xl hover:shadow-3xl",
      },
      
      // Circular buttons get optimized padding
      {
        shape: "circular",
        size: "sm",
        class: "p-2.5",
      },
      {
        shape: "circular", 
        size: "md",
        class: "p-3",
      },
      {
        shape: "circular",
        size: "lg", 
        class: "p-3.5",
      },
      {
        shape: "circular",
        size: "xl",
        class: "p-4",
      },
    ],
    
    /**
     * Default variants
     */
    defaultVariants: {
      shape: "square",
      size: "md",
      elevation: "none",
    },
  }
);

/**
 * Enhanced IconButton props interface
 * Enforces accessibility requirements and provides comprehensive customization
 */
export interface IconButtonProps 
  extends Omit<ButtonProps, "children" | "icon" | "iconRight" | "size">,
    VariantProps<typeof iconButtonVariants> {
  /**
   * Icon element to display - required
   * Should be a Lucide React icon or similar
   */
  icon: React.ReactNode;
  
  /**
   * Accessible label for screen readers - MANDATORY for icon-only buttons
   * This requirement enforces WCAG 2.1 AA compliance
   */
  "aria-label": string;
  
  /**
   * Tooltip text to show on hover
   * Enhances user experience by providing context for icon meaning
   */
  tooltip?: string;
  
  /**
   * Tooltip position relative to the button
   */
  tooltipPosition?: "top" | "bottom" | "left" | "right";
  
  /**
   * Whether the tooltip should show immediately (for important actions)
   */
  tooltipImmediate?: boolean;
  
  /**
   * Override the button variant
   * Defaults to "ghost" for minimal icon buttons
   */
  variant?: ButtonProps["variant"];
  
  /**
   * Whether this is a floating action button
   * Automatically applies appropriate styling and behavior
   */
  fab?: boolean;
  
  /**
   * FAB position when used as floating button
   */
  fabPosition?: "bottom-right" | "bottom-left" | "top-right" | "top-left";
  
  /**
   * Whether to show a badge indicator (for notifications, etc.)
   */
  badge?: boolean;
  
  /**
   * Badge content (number or text)
   */
  badgeContent?: React.ReactNode;
  
  /**
   * Badge color variant
   */
  badgeVariant?: "primary" | "secondary" | "success" | "warning" | "error";
}

/**
 * Simple tooltip component for enhanced user experience
 * Provides contextual information for icon buttons
 */
interface TooltipProps {
  children: React.ReactNode;
  content?: string;
  position?: "top" | "bottom" | "left" | "right";
  immediate?: boolean;
}

const Tooltip: React.FC<TooltipProps> = ({ 
  children, 
  content, 
  position = "top",
  immediate = false 
}) => {
  if (!content) return <>{children}</>;
  
  const positionClasses = {
    top: "bottom-full left-1/2 transform -translate-x-1/2 mb-2",
    bottom: "top-full left-1/2 transform -translate-x-1/2 mt-2", 
    left: "right-full top-1/2 transform -translate-y-1/2 mr-2",
    right: "left-full top-1/2 transform -translate-y-1/2 ml-2"
  };
  
  const arrowClasses = {
    top: "top-full left-1/2 transform -translate-x-1/2 border-l-transparent border-r-transparent border-b-transparent border-t-gray-900",
    bottom: "bottom-full left-1/2 transform -translate-x-1/2 border-l-transparent border-r-transparent border-t-transparent border-b-gray-900",
    left: "left-full top-1/2 transform -translate-y-1/2 border-t-transparent border-b-transparent border-r-transparent border-l-gray-900", 
    right: "right-full top-1/2 transform -translate-y-1/2 border-t-transparent border-b-transparent border-l-transparent border-r-gray-900"
  };
  
  return (
    <div className="relative group">
      {children}
      <div 
        className={cn(
          "absolute z-50 px-2 py-1 text-xs text-white bg-gray-900 rounded whitespace-nowrap pointer-events-none",
          "opacity-0 group-hover:opacity-100 transition-opacity duration-200",
          immediate ? "opacity-100" : "",
          positionClasses[position]
        )}
        role="tooltip"
      >
        {content}
        <div 
          className={cn(
            "absolute w-0 h-0 border-4",
            arrowClasses[position]
          )}
        />
      </div>
    </div>
  );
};

/**
 * Badge component for notification indicators
 */
interface BadgeProps {
  content?: React.ReactNode;
  variant?: "primary" | "secondary" | "success" | "warning" | "error";
  className?: string;
}

const Badge: React.FC<BadgeProps> = ({ 
  content, 
  variant = "primary",
  className 
}) => {
  const badgeClasses = cn(
    "absolute -top-1 -right-1 min-w-[20px] h-5 px-1",
    "rounded-full text-xs font-medium flex items-center justify-center",
    "border-2 border-white",
    {
      "bg-primary-600 text-white": variant === "primary",
      "bg-secondary-600 text-white": variant === "secondary", 
      "bg-success-600 text-white": variant === "success",
      "bg-warning-600 text-white": variant === "warning",
      "bg-error-600 text-white": variant === "error",
    },
    className
  );
  
  if (!content && content !== 0) {
    // Show empty badge dot for boolean indicator
    return (
      <span 
        className={cn(
          "absolute -top-1 -right-1 w-3 h-3 rounded-full border-2 border-white",
          {
            "bg-primary-600": variant === "primary",
            "bg-secondary-600": variant === "secondary",
            "bg-success-600": variant === "success", 
            "bg-warning-600": variant === "warning",
            "bg-error-600": variant === "error",
          }
        )}
        aria-hidden="true"
      />
    );
  }
  
  return (
    <span className={badgeClasses} aria-hidden="true">
      {content}
    </span>
  );
};

/**
 * IconButton component implementing WCAG 2.1 AA accessibility standards
 * 
 * Key accessibility features:
 * - Mandatory aria-label prop enforces screen reader support
 * - Minimum 44x44px touch targets across all sizes
 * - Enhanced focus indicators with proper contrast ratios
 * - Tooltip integration for additional context
 * - Keyboard navigation support
 * 
 * Shape variants:
 * - Square: Default for toolbar and grid actions
 * - Circular: Profile actions and primary buttons
 * - Rounded: Balanced appearance for most contexts
 * 
 * FAB (Floating Action Button) support:
 * - Automatic circular styling and elevation
 * - Positioning utilities for fixed placement
 * - Enhanced shadow system for depth perception
 * 
 * @example
 * ```tsx
 * // Basic square icon button
 * <IconButton
 *   icon={<Edit />}
 *   aria-label="Edit database connection"
 *   tooltip="Edit this connection"
 *   onClick={handleEdit}
 * />
 * 
 * // Circular profile button
 * <IconButton
 *   icon={<User />}
 *   aria-label="User profile"
 *   shape="circular"
 *   variant="primary"
 *   tooltip="View profile"
 * />
 * 
 * // Floating action button
 * <IconButton
 *   icon={<Plus />}
 *   aria-label="Add new database connection"
 *   fab={true}
 *   fabPosition="bottom-right"
 *   size="fab-md"
 *   variant="primary"
 *   tooltip="Add connection"
 * />
 * 
 * // With notification badge
 * <IconButton
 *   icon={<Bell />}
 *   aria-label="Notifications (3 unread)"
 *   badge={true}
 *   badgeContent={3}
 *   badgeVariant="error"
 *   tooltip="3 unread notifications"
 * />
 * ```
 */
export const IconButton = forwardRef<HTMLButtonElement, IconButtonProps>(
  (
    {
      icon,
      "aria-label": ariaLabel,
      tooltip,
      tooltipPosition = "top",
      tooltipImmediate = false,
      shape = "square",
      size = "md",
      elevation = "none",
      variant = "ghost",
      fab = false,
      fabPosition = "bottom-right",
      badge = false,
      badgeContent,
      badgeVariant = "primary",
      className,
      ...props
    },
    ref
  ) => {
    // Determine effective size and shape for FAB
    const effectiveSize = fab && !size.startsWith("fab") ? "fab-md" : size;
    const effectiveShape = fab ? "circular" : shape;
    const effectiveElevation = fab ? "medium" : elevation;
    
    // FAB positioning classes
    const fabPositionClasses = {
      "bottom-right": "fixed bottom-6 right-6 z-50",
      "bottom-left": "fixed bottom-6 left-6 z-50",
      "top-right": "fixed top-6 right-6 z-50", 
      "top-left": "fixed top-6 left-6 z-50",
    };
    
    /**
     * Compute final CSS classes
     */
    const iconButtonClasses = cn(
      // Apply icon button specific styles
      iconButtonVariants({
        shape: effectiveShape,
        size: effectiveSize,
        elevation: effectiveElevation,
      }),
      // FAB positioning
      fab && fabPositionClasses[fabPosition],
      // Custom className
      className
    );
    
    /**
     * Enhanced accessibility props
     */
    const accessibilityProps = {
      "aria-label": ariaLabel,
      // Add role="button" explicitly for icon-only buttons
      role: "button",
      // Ensure proper title for tooltip fallback
      title: tooltip || ariaLabel,
    };
    
    /**
     * Render the icon with proper accessibility
     */
    const renderIcon = () => (
      <span 
        className="flex items-center justify-center"
        aria-hidden="true"
      >
        {icon}
      </span>
    );
    
    /**
     * Create the button content with badge support
     */
    const buttonContent = (
      <div className="relative">
        {renderIcon()}
        {badge && (
          <Badge 
            content={badgeContent}
            variant={badgeVariant}
          />
        )}
      </div>
    );
    
    /**
     * Wrap with tooltip if provided
     */
    const wrappedButton = (
      <Button
        ref={ref}
        variant={variant}
        className={iconButtonClasses}
        {...accessibilityProps}
        {...props}
      >
        {buttonContent}
      </Button>
    );
    
    return (
      <Tooltip
        content={tooltip}
        position={tooltipPosition}
        immediate={tooltipImmediate}
      >
        {wrappedButton}
      </Tooltip>
    );
  }
);

IconButton.displayName = "IconButton";

/**
 * Specialized FAB component for convenience
 * Pre-configured floating action button with sensible defaults
 */
export interface FABProps extends Omit<IconButtonProps, "fab" | "shape"> {
  /**
   * FAB position - defaults to bottom-right
   */
  position?: IconButtonProps["fabPosition"];
  
  /**
   * FAB size - defaults to fab-md
   */
  size?: "fab-sm" | "fab-md" | "fab-lg";
}

export const FAB = forwardRef<HTMLButtonElement, FABProps>(
  ({ position = "bottom-right", size = "fab-md", variant = "primary", ...props }, ref) => (
    <IconButton
      ref={ref}
      fab={true}
      fabPosition={position}
      size={size}
      variant={variant}
      elevation="medium"
      {...props}
    />
  )
);

FAB.displayName = "FAB";

/**
 * IconButton group for related icon actions
 * Provides proper spacing and alignment for multiple icon buttons
 */
export interface IconButtonGroupProps {
  /**
   * IconButton elements to group
   */
  children: React.ReactNode;
  
  /**
   * Visual orientation of the group
   */
  orientation?: "horizontal" | "vertical";
  
  /**
   * Spacing between buttons
   */
  spacing?: "tight" | "normal" | "loose";
  
  /**
   * Group label for screen readers
   */
  "aria-label"?: string;
  
  /**
   * Additional CSS classes
   */
  className?: string;
}

export const IconButtonGroup: React.FC<IconButtonGroupProps> = ({
  children,
  orientation = "horizontal",
  spacing = "normal",
  "aria-label": ariaLabel,
  className,
}) => {
  const spacingClasses = {
    tight: orientation === "horizontal" ? "gap-1" : "gap-1",
    normal: orientation === "horizontal" ? "gap-2" : "gap-2", 
    loose: orientation === "horizontal" ? "gap-4" : "gap-4",
  };
  
  const groupClasses = cn(
    "inline-flex",
    orientation === "horizontal" ? "flex-row" : "flex-col",
    spacingClasses[spacing],
    className
  );
  
  return (
    <div
      className={groupClasses}
      role="group"
      aria-label={ariaLabel}
    >
      {children}
    </div>
  );
};

IconButtonGroup.displayName = "IconButtonGroup";

/**
 * Export variants and utilities for external usage
 */
export { iconButtonVariants };
export type IconButtonVariantProps = VariantProps<typeof iconButtonVariants>;

/**
 * Utility function to create icon button classes
 */
export const getIconButtonClasses = (
  props: VariantProps<typeof iconButtonVariants> & { className?: string }
): string => {
  const { className, ...variantProps } = props;
  return cn(iconButtonVariants(variantProps), className);
};