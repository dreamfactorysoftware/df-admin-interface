"use client";

import React, { forwardRef } from "react";
import { type VariantProps } from "class-variance-authority";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { buttonVariants, getLoadingAriaLabel } from "./button-variants";

/**
 * Core Button component for the DreamFactory Admin Interface
 * 
 * Implements WCAG 2.1 AA accessibility standards with comprehensive variant support.
 * Replaces all Angular Material button patterns (mat-button, mat-flat-button, mat-stroked-button)
 * with React 19/Tailwind CSS implementation.
 * 
 * Features:
 * - WCAG 2.1 AA compliance with minimum 4.5:1 contrast ratio for normal text
 * - Minimum 44x44px touch targets for mobile accessibility
 * - Focus-visible keyboard navigation with 3:1 contrast ratio for UI components
 * - Loading states and proper disabled state management
 * - Screen reader support with ARIA labels and announcements
 * - Tailwind CSS 4.1+ implementation with design tokens
 * 
 * @see Technical Specification Section 7.7.1 for design token details
 * @see WCAG 2.1 AA Guidelines: https://www.w3.org/WAI/WCAG21/Understanding/
 */

/**
 * Enhanced button props interface extending native button attributes
 * Provides comprehensive typing for all accessibility and variant features
 */
export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  /**
   * Button content - required for accessibility
   */
  children: React.ReactNode;
  
  /**
   * Loading state for async operations
   * When true, displays spinner and disables interaction
   */
  loading?: boolean;
  
  /**
   * Custom loading text for screen readers
   * Defaults to button text + " - Loading"
   */
  loadingText?: string;
  
  /**
   * Icon to display before button text
   * Automatically sized and positioned
   */
  icon?: React.ReactNode;
  
  /**
   * Icon to display after button text
   * Automatically sized and positioned  
   */
  iconRight?: React.ReactNode;
  
  /**
   * Enhanced accessibility label
   * Overrides default aria-label
   */
  ariaLabel?: string;
  
  /**
   * ID of element that describes this button
   * Used for aria-describedby attribute
   */
  ariaDescribedBy?: string;
  
  /**
   * Announcement text for screen readers on button press
   * Useful for actions that don't provide immediate visual feedback
   */
  announceOnPress?: string;
  
  /**
   * Role for the button (defaults to "button")
   * Can be "menuitem", "tab", etc. for specific contexts
   */
  role?: string;
  
  /**
   * Custom loading spinner component
   * Defaults to Lucide Loader2 icon
   */
  loadingSpinner?: React.ReactNode;
  
  /**
   * Disable focus-visible outline
   * Only use when implementing custom focus management
   */
  disableFocusRing?: boolean;
}

/**
 * Loading Spinner component for async states
 * Implements proper ARIA attributes for screen readers
 */
const LoadingSpinner = ({ 
  className,
  "aria-hidden": ariaHidden = true,
  ...props 
}: React.SVGProps<SVGSVGElement>) => (
  <Loader2 
    className={cn("animate-spin", className)} 
    aria-hidden={ariaHidden}
    {...props}
  />
);

/**
 * Button component implementing WCAG 2.1 AA accessibility standards
 * 
 * Key accessibility features:
 * - Minimum 44x44px touch targets for mobile users
 * - 4.5:1 contrast ratio for all text combinations
 * - 3:1 contrast ratio for focus indicators and UI components
 * - Focus-visible only navigation (no mouse focus rings)
 * - Proper ARIA labeling and state management
 * - Screen reader announcements for loading states
 * - Keyboard navigation support with proper event handling
 * 
 * @example
 * ```tsx
 * // Basic primary button
 * <Button>Save Changes</Button>
 * 
 * // Loading state with custom announcement
 * <Button 
 *   loading={isSubmitting}
 *   announceOnPress="Form submitted successfully"
 *   disabled={!isValid}
 * >
 *   Submit Form
 * </Button>
 * 
 * // Icon button with accessibility enhancements
 * <Button
 *   variant="outline"
 *   size="icon-md"
 *   ariaLabel="Delete database connection"
 *   ariaDescribedBy="delete-help-text"
 * >
 *   <TrashIcon />
 * </Button>
 * 
 * // Secondary action with right icon
 * <Button
 *   variant="secondary"
 *   iconRight={<ExternalLinkIcon />}
 *   onClick={openDocs}
 * >
 *   View Documentation
 * </Button>
 * ```
 */
export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      children,
      className,
      variant = "primary",
      size = "md",
      loading = false,
      loadingText,
      icon,
      iconRight,
      ariaLabel,
      ariaDescribedBy,
      announceOnPress,
      role = "button",
      loadingSpinner,
      disableFocusRing = false,
      disabled,
      onClick,
      onKeyDown,
      fullWidth,
      type = "button",
      ...props
    },
    ref
  ) => {
    // Compute effective disabled state (loading OR explicitly disabled)
    const isEffectivelyDisabled = disabled || loading;
    
    // Generate accessible aria-label for loading states
    const effectiveAriaLabel = ariaLabel || (
      loading && loadingText 
        ? loadingText
        : loading && typeof children === "string"
        ? getLoadingAriaLabel(children, loading)
        : ariaLabel
    );

    /**
     * Enhanced click handler with accessibility features
     * Implements screen reader announcements and proper event management
     */
    const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
      // Prevent action if disabled or loading
      if (isEffectivelyDisabled) {
        event.preventDefault();
        event.stopPropagation();
        return;
      }

      // Announce action to screen readers if specified
      if (announceOnPress) {
        // Create temporary live region for announcement
        const announcement = document.createElement("div");
        announcement.setAttribute("aria-live", "polite");
        announcement.setAttribute("aria-atomic", "true");
        announcement.className = "sr-only absolute -top-px -left-px w-px h-px overflow-hidden";
        announcement.textContent = announceOnPress;
        
        // Add to DOM, announce, then cleanup
        document.body.appendChild(announcement);
        setTimeout(() => {
          if (document.body.contains(announcement)) {
            document.body.removeChild(announcement);
          }
        }, 1000);
      }

      // Call original click handler
      onClick?.(event);
    };

    /**
     * Enhanced keyboard handler for accessibility
     * Ensures proper keyboard interaction patterns
     */
    const handleKeyDown = (event: React.KeyboardEvent<HTMLButtonElement>) => {
      // Handle Enter and Space key activation
      if (event.key === "Enter" || event.key === " ") {
        // Prevent default scrolling on Space key
        if (event.key === " ") {
          event.preventDefault();
        }
        
        // Trigger click if not disabled
        if (!isEffectivelyDisabled) {
          event.currentTarget.click();
        }
      }
      
      // Call original keydown handler
      onKeyDown?.(event);
    };

    /**
     * Compute final CSS classes with accessibility and variant support
     * Merges variant styles with custom classes and accessibility overrides
     */
    const buttonClasses = cn(
      buttonVariants({ 
        variant, 
        size, 
        loading, 
        fullWidth 
      }),
      // Accessibility enhancements
      "relative select-none",
      "transition-all duration-200 ease-in-out",
      
      // Focus management - only show focus ring for keyboard navigation
      !disableFocusRing && [
        "focus:outline-none",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2",
        // Variant-specific focus colors for enhanced accessibility
        variant === "primary" && "focus-visible:ring-primary-600",
        variant === "secondary" && "focus-visible:ring-secondary-600", 
        variant === "success" && "focus-visible:ring-success-600",
        variant === "warning" && "focus-visible:ring-warning-600",
        variant === "error" && "focus-visible:ring-error-600",
        variant === "outline" && "focus-visible:ring-primary-600",
        variant === "ghost" && "focus-visible:ring-secondary-600",
        variant === "link" && "focus-visible:ring-primary-600 focus-visible:ring-offset-1",
      ],
      
      // Loading state visual feedback
      loading && [
        "cursor-wait",
        "pointer-events-none",
      ],
      
      // Disabled state management
      isEffectivelyDisabled && [
        "disabled:opacity-50",
        "disabled:cursor-not-allowed", 
        "disabled:pointer-events-none",
      ],
      
      // Custom className override
      className
    );

    /**
     * Render loading spinner with proper accessibility
     * Uses provided spinner or default Loader2 with screen reader support
     */
    const renderLoadingSpinner = () => {
      if (!loading) return null;
      
      const spinnerComponent = loadingSpinner || (
        <LoadingSpinner 
          className="h-4 w-4" 
          aria-hidden="true"
        />
      );
      
      return (
        <span className="absolute inset-0 flex items-center justify-center">
          {spinnerComponent}
        </span>
      );
    };

    /**
     * Render button content with icons and loading states
     * Handles icon positioning and loading state content management
     */
    const renderContent = () => (
      <>
        {/* Loading spinner overlay */}
        {renderLoadingSpinner()}
        
        {/* Main content - hidden during loading for better UX */}
        <span 
          className={cn(
            "flex items-center justify-center gap-2",
            loading && "opacity-0"
          )}
        >
          {/* Left icon */}
          {icon && !loading && (
            <span 
              className="flex-shrink-0" 
              aria-hidden="true"
            >
              {icon}
            </span>
          )}
          
          {/* Button text/content */}
          <span className="flex-1">
            {children}
          </span>
          
          {/* Right icon */}
          {iconRight && !loading && (
            <span 
              className="flex-shrink-0" 
              aria-hidden="true"
            >
              {iconRight}
            </span>
          )}
        </span>
      </>
    );

    return (
      <button
        ref={ref}
        type={type}
        role={role}
        className={buttonClasses}
        disabled={isEffectivelyDisabled}
        aria-disabled={isEffectivelyDisabled}
        aria-label={effectiveAriaLabel}
        aria-describedby={ariaDescribedBy}
        aria-busy={loading}
        onClick={handleClick}
        onKeyDown={handleKeyDown}
        {...props}
      >
        {renderContent()}
      </button>
    );
  }
);

Button.displayName = "Button";

/**
 * Button compound components for advanced compositions
 * Provides specialized button patterns for common use cases
 */

/**
 * Icon-only button with enhanced accessibility
 * Ensures proper labeling for screen readers
 */
export interface IconButtonProps extends Omit<ButtonProps, "children"> {
  /**
   * Icon element to display
   */
  icon: React.ReactNode;
  
  /**
   * Required accessible label for screen readers
   */
  ariaLabel: string;
  
  /**
   * Optional tooltip text
   */
  tooltip?: string;
}

export const IconButton = forwardRef<HTMLButtonElement, IconButtonProps>(
  ({ icon, ariaLabel, tooltip, size = "icon-md", ...props }, ref) => (
    <Button
      ref={ref}
      size={size}
      ariaLabel={ariaLabel}
      title={tooltip || ariaLabel}
      {...props}
    >
      <span aria-hidden="true">{icon}</span>
    </Button>
  )
);

IconButton.displayName = "IconButton";

/**
 * Loading button with predefined loading behavior
 * Simplifies common async operation patterns
 */
export interface LoadingButtonProps extends ButtonProps {
  /**
   * Promise or async function to execute on click
   */
  asyncAction?: () => Promise<void> | void;
  
  /**
   * Success message to announce on completion
   */
  successMessage?: string;
  
  /**
   * Error message to announce on failure
   */
  errorMessage?: string;
}

export const LoadingButton = forwardRef<HTMLButtonElement, LoadingButtonProps>(
  ({ 
    asyncAction, 
    successMessage = "Action completed successfully",
    errorMessage = "Action failed",
    onClick,
    ...props 
  }, ref) => {
    const [isLoading, setIsLoading] = React.useState(false);

    const handleAsyncClick = async (event: React.MouseEvent<HTMLButtonElement>) => {
      if (asyncAction) {
        setIsLoading(true);
        try {
          await asyncAction();
          
          // Announce success
          if (successMessage) {
            const announcement = document.createElement("div");
            announcement.setAttribute("aria-live", "polite");
            announcement.setAttribute("aria-atomic", "true");
            announcement.className = "sr-only";
            announcement.textContent = successMessage;
            document.body.appendChild(announcement);
            setTimeout(() => document.body.removeChild(announcement), 1000);
          }
        } catch (error) {
          // Announce error
          if (errorMessage) {
            const announcement = document.createElement("div");
            announcement.setAttribute("aria-live", "assertive");
            announcement.setAttribute("aria-atomic", "true");
            announcement.className = "sr-only";
            announcement.textContent = errorMessage;
            document.body.appendChild(announcement);
            setTimeout(() => document.body.removeChild(announcement), 1000);
          }
          
          console.error("Button async action failed:", error);
        } finally {
          setIsLoading(false);
        }
      }
      
      onClick?.(event);
    };

    return (
      <Button
        ref={ref}
        loading={isLoading}
        onClick={handleAsyncClick}
        {...props}
      />
    );
  }
);

LoadingButton.displayName = "LoadingButton";

/**
 * Button group for related actions
 * Implements proper ARIA relationships and keyboard navigation
 */
export interface ButtonGroupProps {
  /**
   * Button elements to group together
   */
  children: React.ReactNode;
  
  /**
   * Visual orientation of the group
   */
  orientation?: "horizontal" | "vertical";
  
  /**
   * Group label for screen readers
   */
  ariaLabel?: string;
  
  /**
   * Additional CSS classes
   */
  className?: string;
  
  /**
   * Whether buttons should have equal width
   */
  fullWidth?: boolean;
}

export const ButtonGroup = ({ 
  children, 
  orientation = "horizontal",
  ariaLabel,
  className,
  fullWidth = false
}: ButtonGroupProps) => {
  const groupClasses = cn(
    "inline-flex",
    orientation === "horizontal" ? "flex-row" : "flex-col",
    orientation === "horizontal" ? "-space-x-px" : "-space-y-px",
    fullWidth && "w-full",
    className
  );

  return (
    <div 
      className={groupClasses}
      role="group"
      aria-label={ariaLabel}
    >
      {React.Children.map(children, (child, index) => {
        if (React.isValidElement(child)) {
          const isFirst = index === 0;
          const isLast = index === React.Children.count(children) - 1;
          
          return React.cloneElement(child, {
            className: cn(
              child.props.className,
              // Remove rounded corners for middle buttons
              !isFirst && !isLast && "rounded-none",
              // First button - round left corners only
              isFirst && orientation === "horizontal" && "rounded-r-none",
              isFirst && orientation === "vertical" && "rounded-b-none",
              // Last button - round right corners only  
              isLast && orientation === "horizontal" && "rounded-l-none",
              isLast && orientation === "vertical" && "rounded-t-none",
              // Full width support
              fullWidth && "flex-1"
            ),
          });
        }
        return child;
      })}
    </div>
  );
};

ButtonGroup.displayName = "ButtonGroup";

// Export all variants and utilities for external usage
export { buttonVariants, type VariantProps } from "./button-variants";
export type { ButtonVariantProps } from "./button-variants";