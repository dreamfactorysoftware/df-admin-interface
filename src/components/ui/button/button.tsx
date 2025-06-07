'use client';

import React, { forwardRef, useState, useCallback } from 'react';
import { Loader2 } from 'lucide-react';
import { buttonVariants, getButtonClasses, getLoadingAriaLabel } from './button-variants';
import { cn } from '@/lib/utils';
import type { ButtonComponentProps } from '@/types/components';
import type { VariantProps } from 'class-variance-authority';

/**
 * Enhanced Button Component for DreamFactory Admin Interface
 * 
 * Replaces Angular Material button patterns (mat-button, mat-flat-button, mat-stroked-button)
 * with React 19/Tailwind CSS implementation featuring comprehensive WCAG 2.1 AA compliance.
 * 
 * Key Features:
 * - WCAG 2.1 AA accessibility compliance with 4.5:1+ contrast ratios
 * - Minimum 44x44px touch targets for mobile accessibility
 * - Focus-visible keyboard navigation with 2px outline and proper offset
 * - Loading states with spinner animation and disabled interaction
 * - Screen reader announcements with proper ARIA labeling
 * - Comprehensive variant system with design tokens from Section 7.7.1
 * - React 19 concurrent features support with forwardRef
 * - TypeScript 5.8+ strict typing with full type safety
 * 
 * @example
 * ```tsx
 * // Primary action button
 * <Button variant="primary" size="md" onClick={handleSubmit}>
 *   Save Changes
 * </Button>
 * 
 * // Loading state with announcement
 * <Button 
 *   variant="success" 
 *   loading={isSubmitting}
 *   loadingText="Saving..."
 *   announceOnPress="Database connection saved successfully"
 * >
 *   Create Connection
 * </Button>
 * 
 * // Icon button with accessibility
 * <Button 
 *   variant="ghost" 
 *   size="icon-md"
 *   aria-label="Close dialog"
 *   onClick={handleClose}
 * >
 *   <X className="h-4 w-4" />
 * </Button>
 * ```
 */

// Enhanced interface extending both variant props and accessibility requirements
export interface ButtonProps 
  extends Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, 'children'>,
          VariantProps<typeof buttonVariants> {
  
  /** Button content - can be ReactNode for complex content */
  children?: React.ReactNode;
  
  /** Button is in loading state - disables interaction and shows spinner */
  loading?: boolean;
  
  /** Custom loading text announced to screen readers */
  loadingText?: string;
  
  /** Left icon component */
  leftIcon?: React.ComponentType<{ className?: string }>;
  
  /** Right icon component */
  rightIcon?: React.ComponentType<{ className?: string }>;
  
  /** Screen reader announcement on button press */
  announceOnPress?: string;
  
  /** Enhanced ARIA label for screen readers */
  'aria-label'?: string;
  
  /** ARIA described by element IDs */
  'aria-describedby'?: string;
  
  /** ARIA labelled by element IDs */
  'aria-labelledby'?: string;
  
  /** Custom spinner component for loading state */
  loadingSpinner?: React.ComponentType<{ className?: string }>;
  
  /** Disable all accessibility features (use with caution) */
  disableAccessibility?: boolean;
  
  /** Custom focus ring color override */
  focusRingColor?: 'primary' | 'secondary' | 'success' | 'warning' | 'error';
  
  /** Priority for React 19 concurrent features */
  priority?: 'high' | 'normal' | 'low';
}

/**
 * Core Button component with comprehensive accessibility and performance optimizations
 */
export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({
    children,
    className,
    variant = 'primary',
    size = 'md',
    loading = false,
    loadingText,
    leftIcon: LeftIcon,
    rightIcon: RightIcon,
    disabled,
    onClick,
    type = 'button',
    announceOnPress,
    loadingSpinner: CustomSpinner,
    disableAccessibility = false,
    focusRingColor,
    priority = 'normal',
    'aria-label': ariaLabel,
    'aria-describedby': ariaDescribedBy,
    'aria-labelledby': ariaLabelledBy,
    fullWidth,
    ...props
  }, ref) => {
    
    // State management for loading announcements
    const [isAnnouncing, setIsAnnouncing] = useState(false);
    
    // Determine if button is actually disabled (loading or disabled prop)
    const isDisabled = disabled || loading;
    
    // Generate accessible loading label
    const accessibleLabel = getLoadingAriaLabel(
      ariaLabel || (typeof children === 'string' ? children : 'Button'),
      loading
    );
    
    // Optimized click handler with accessibility announcements
    const handleClick = useCallback((event: React.MouseEvent<HTMLButtonElement>) => {
      // Prevent interaction during loading state
      if (loading) {
        event.preventDefault();
        return;
      }
      
      // Screen reader announcement for successful actions
      if (announceOnPress && !disableAccessibility) {
        setIsAnnouncing(true);
        
        // Create temporary live region for announcement
        const announcement = document.createElement('div');
        announcement.setAttribute('aria-live', 'polite');
        announcement.setAttribute('aria-atomic', 'true');
        announcement.className = 'sr-only absolute -left-[10000px]';
        announcement.textContent = announceOnPress;
        
        document.body.appendChild(announcement);
        
        // Clean up announcement after screen readers process it
        setTimeout(() => {
          if (document.body.contains(announcement)) {
            document.body.removeChild(announcement);
          }
          setIsAnnouncing(false);
        }, 1000);
      }
      
      // Call original onClick handler
      onClick?.(event);
    }, [loading, announceOnPress, disableAccessibility, onClick]);
    
    // Generate button classes with variant system
    const buttonClasses = getButtonClasses({
      variant,
      size,
      loading,
      fullWidth,
      className: cn(
        // Custom focus ring color if specified
        focusRingColor && !disableAccessibility && {
          'focus-visible:ring-primary-600': focusRingColor === 'primary',
          'focus-visible:ring-secondary-600': focusRingColor === 'secondary',
          'focus-visible:ring-success-600': focusRingColor === 'success',
          'focus-visible:ring-warning-600': focusRingColor === 'warning',
          'focus-visible:ring-error-600': focusRingColor === 'error',
        },
        // Loading cursor state
        loading && 'cursor-wait',
        // React 19 priority classes for concurrent features
        priority === 'high' && 'priority-high',
        priority === 'low' && 'priority-low',
        className
      ),
    });
    
    // Determine loading spinner component
    const LoadingSpinner = CustomSpinner || Loader2;
    
    // Calculate if we should show text content
    const hasTextContent = children && typeof children === 'string' && children.trim() !== '';
    const showLoadingText = loading && loadingText && hasTextContent;
    
    // Accessibility attributes
    const accessibilityProps = disableAccessibility ? {} : {
      'aria-label': ariaLabel || accessibleLabel,
      'aria-describedby': ariaDescribedBy,
      'aria-labelledby': ariaLabelledBy,
      'aria-disabled': isDisabled,
      'aria-busy': loading,
      'role': 'button',
      // Enhanced keyboard navigation
      'tabIndex': isDisabled ? -1 : 0,
    };
    
    return (
      <button
        ref={ref}
        type={type}
        className={buttonClasses}
        disabled={isDisabled}
        onClick={handleClick}
        {...accessibilityProps}
        {...props}
      >
        {/* Left Icon */}
        {LeftIcon && !loading && (
          <LeftIcon 
            className={cn(
              "h-4 w-4 flex-shrink-0",
              hasTextContent && "mr-2"
            )}
            aria-hidden="true"
          />
        )}
        
        {/* Loading Spinner */}
        {loading && (
          <LoadingSpinner 
            className={cn(
              "h-4 w-4 flex-shrink-0 animate-spin",
              (hasTextContent || showLoadingText) && "mr-2"
            )}
            aria-hidden="true"
          />
        )}
        
        {/* Button Content */}
        {showLoadingText ? (
          <span className="truncate">
            {loadingText}
          </span>
        ) : children && (
          <span className={cn(
            // Ensure text is properly sized
            "inline-flex items-center",
            // Handle text truncation for long content
            typeof children === 'string' && "truncate"
          )}>
            {children}
          </span>
        )}
        
        {/* Right Icon */}
        {RightIcon && !loading && (
          <RightIcon 
            className={cn(
              "h-4 w-4 flex-shrink-0",
              hasTextContent && "ml-2"
            )}
            aria-hidden="true"
          />
        )}
        
        {/* Screen Reader Live Region for Loading State */}
        {loading && !disableAccessibility && (
          <span 
            className="sr-only absolute -left-[10000px]" 
            aria-live="polite"
            aria-atomic="true"
          >
            {loadingText || `${accessibleLabel} is loading`}
          </span>
        )}
        
        {/* Screen Reader Live Region for Announcements */}
        {isAnnouncing && !disableAccessibility && (
          <span 
            className="sr-only absolute -left-[10000px]" 
            aria-live="polite"
            aria-atomic="true"
          >
            {announceOnPress}
          </span>
        )}
      </button>
    );
  }
);

// Display name for React DevTools
Button.displayName = 'Button';

/**
 * Button Group Component for managing multiple related buttons
 * Provides consistent spacing and keyboard navigation for button collections
 */
export interface ButtonGroupProps {
  /** Button group children */
  children: React.ReactNode;
  
  /** Orientation of button group */
  orientation?: 'horizontal' | 'vertical';
  
  /** Size for all buttons in group */
  size?: VariantProps<typeof buttonVariants>['size'];
  
  /** Variant for all buttons in group */
  variant?: VariantProps<typeof buttonVariants>['variant'];
  
  /** Additional CSS classes */
  className?: string;
  
  /** ARIA label for the button group */
  'aria-label'?: string;
  
  /** Enable keyboard navigation between buttons */
  enableKeyboardNavigation?: boolean;
}

export const ButtonGroup = forwardRef<HTMLDivElement, ButtonGroupProps>(
  ({
    children,
    orientation = 'horizontal',
    size,
    variant,
    className,
    'aria-label': ariaLabel,
    enableKeyboardNavigation = true,
    ...props
  }, ref) => {
    
    // Enhanced keyboard navigation for button groups
    const handleKeyDown = useCallback((event: React.KeyboardEvent<HTMLDivElement>) => {
      if (!enableKeyboardNavigation) return;
      
      const buttons = Array.from(
        event.currentTarget.querySelectorAll('button:not([disabled])')
      ) as HTMLButtonElement[];
      
      const currentIndex = buttons.findIndex(button => button === document.activeElement);
      
      if (currentIndex === -1) return;
      
      let nextIndex = currentIndex;
      
      switch (event.key) {
        case 'ArrowRight':
        case 'ArrowDown':
          event.preventDefault();
          nextIndex = orientation === 'horizontal' 
            ? (currentIndex + 1) % buttons.length
            : Math.min(currentIndex + 1, buttons.length - 1);
          break;
          
        case 'ArrowLeft':
        case 'ArrowUp':
          event.preventDefault();
          nextIndex = orientation === 'horizontal'
            ? (currentIndex - 1 + buttons.length) % buttons.length
            : Math.max(currentIndex - 1, 0);
          break;
          
        case 'Home':
          event.preventDefault();
          nextIndex = 0;
          break;
          
        case 'End':
          event.preventDefault();
          nextIndex = buttons.length - 1;
          break;
          
        default:
          return;
      }
      
      buttons[nextIndex]?.focus();
    }, [enableKeyboardNavigation, orientation]);
    
    // Clone children to inject size and variant props
    const enhancedChildren = React.Children.map(children, (child) => {
      if (React.isValidElement(child) && child.type === Button) {
        return React.cloneElement(child, {
          size: child.props.size || size,
          variant: child.props.variant || variant,
        } as Partial<ButtonProps>);
      }
      return child;
    });
    
    return (
      <div
        ref={ref}
        role="group"
        aria-label={ariaLabel}
        className={cn(
          // Base group styles
          "inline-flex",
          // Orientation-specific spacing
          orientation === 'horizontal' 
            ? "flex-row space-x-2" 
            : "flex-col space-y-2",
          // WCAG focus management
          "focus-within:ring-2 focus-within:ring-primary-600 focus-within:ring-offset-2 rounded-md",
          className
        )}
        onKeyDown={handleKeyDown}
        {...props}
      >
        {enhancedChildren}
      </div>
    );
  }
);

ButtonGroup.displayName = 'ButtonGroup';

/**
 * Icon Button variant for icon-only buttons with enhanced accessibility
 */
export interface IconButtonProps extends Omit<ButtonProps, 'children' | 'leftIcon' | 'rightIcon'> {
  /** Icon component to display */
  icon: React.ComponentType<{ className?: string }>;
  
  /** Required accessibility label for icon buttons */
  'aria-label': string;
  
  /** Optional tooltip text */
  tooltip?: string;
}

export const IconButton = forwardRef<HTMLButtonElement, IconButtonProps>(
  ({
    icon: Icon,
    size = 'icon-md',
    'aria-label': ariaLabel,
    tooltip,
    className,
    ...props
  }, ref) => {
    
    return (
      <Button
        ref={ref}
        size={size}
        aria-label={ariaLabel}
        title={tooltip || ariaLabel}
        className={cn(
          // Ensure square aspect ratio for icon buttons
          "aspect-square p-0",
          className
        )}
        {...props}
      >
        <Icon 
          className="h-4 w-4" 
          aria-hidden="true" 
        />
      </Button>
    );
  }
);

IconButton.displayName = 'IconButton';

// Export the variant types for external use
export type ButtonVariant = VariantProps<typeof buttonVariants>['variant'];
export type ButtonSize = VariantProps<typeof buttonVariants>['size'];

// Re-export utilities for convenience
export { buttonVariants, getButtonClasses, getLoadingAriaLabel };

// Default export for common usage patterns
export default Button;