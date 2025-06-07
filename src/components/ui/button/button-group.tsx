'use client';

import React, { useRef, useCallback, useEffect, KeyboardEvent } from 'react';
import { cn } from '@/lib/utils';

/**
 * ButtonGroup component for organizing related buttons with consistent spacing and visual grouping.
 * Supports horizontal and vertical layouts, proper focus management between grouped buttons,
 * and accessibility features for button collections like dialog actions and form submissions.
 * 
 * Features:
 * - Keyboard navigation between grouped buttons with arrow key support
 * - ARIA group labeling for screen reader accessibility
 * - Horizontal and vertical layout options for different UI contexts
 * - Consistent spacing and visual grouping following design system
 * - WCAG 2.1 AA compliant focus management and touch targets
 * 
 * @example
 * ```tsx
 * <ButtonGroup orientation="horizontal" label="Dialog actions">
 *   <Button variant="outline">Cancel</Button>
 *   <Button variant="primary">Save</Button>
 * </ButtonGroup>
 * ```
 */

export interface ButtonGroupProps extends React.HTMLAttributes<HTMLDivElement> {
  /**
   * Visual orientation of the button group
   * @default "horizontal"
   */
  orientation?: 'horizontal' | 'vertical';
  
  /**
   * Size variant affecting spacing and padding
   * @default "md"
   */
  size?: 'sm' | 'md' | 'lg';
  
  /**
   * Visual variant affecting appearance and styling
   * @default "default"
   */
  variant?: 'default' | 'contained' | 'separated' | 'minimal';
  
  /**
   * Accessible label for the button group (required for screen readers)
   */
  label?: string;
  
  /**
   * ID of element that describes the button group
   */
  ariaDescribedBy?: string;
  
  /**
   * Whether to enable keyboard navigation between buttons
   * @default true
   */
  enableKeyboardNavigation?: boolean;
  
  /**
   * Whether to attach buttons visually (no gaps between them)
   * @default false
   */
  attached?: boolean;
  
  /**
   * Custom class name for styling
   */
  className?: string;
  
  /**
   * Button elements to group together
   */
  children: React.ReactNode;
}

/**
 * ButtonGroup component with full accessibility and keyboard navigation support
 */
export function ButtonGroup({
  orientation = 'horizontal',
  size = 'md',
  variant = 'default',
  label,
  ariaDescribedBy,
  enableKeyboardNavigation = true,
  attached = false,
  className,
  children,
  role = 'group',
  ...props
}: ButtonGroupProps) {
  const groupRef = useRef<HTMLDivElement>(null);
  const buttonsRef = useRef<HTMLButtonElement[]>([]);

  // Update buttons reference when children change
  useEffect(() => {
    if (!groupRef.current) return;
    
    const buttons = Array.from(
      groupRef.current.querySelectorAll('button, [role="button"]')
    ) as HTMLButtonElement[];
    
    buttonsRef.current = buttons.filter(button => 
      !button.disabled && !button.getAttribute('aria-hidden')
    );
  }, [children]);

  /**
   * Handle keyboard navigation between grouped buttons
   * Supports arrow keys for both horizontal and vertical orientations
   */
  const handleKeyDown = useCallback((event: KeyboardEvent<HTMLDivElement>) => {
    if (!enableKeyboardNavigation || buttonsRef.current.length <= 1) return;

    const { key } = event;
    const isHorizontal = orientation === 'horizontal';
    const buttons = buttonsRef.current;
    const currentIndex = buttons.findIndex(button => button === document.activeElement);
    
    // Determine if this is a navigation key for current orientation
    const isNavigationKey = isHorizontal 
      ? ['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(key)
      : ['ArrowUp', 'ArrowDown', 'Home', 'End'].includes(key);
    
    if (!isNavigationKey || currentIndex === -1) return;

    event.preventDefault();
    event.stopPropagation();

    let nextIndex: number;

    switch (key) {
      case 'ArrowLeft':
      case 'ArrowUp':
        // Move to previous button (with wrapping)
        nextIndex = currentIndex > 0 ? currentIndex - 1 : buttons.length - 1;
        break;
      
      case 'ArrowRight':
      case 'ArrowDown':
        // Move to next button (with wrapping)
        nextIndex = currentIndex < buttons.length - 1 ? currentIndex + 1 : 0;
        break;
      
      case 'Home':
        // Move to first button
        nextIndex = 0;
        break;
      
      case 'End':
        // Move to last button
        nextIndex = buttons.length - 1;
        break;
      
      default:
        return;
    }

    // Focus the target button and announce to screen readers
    const targetButton = buttons[nextIndex];
    if (targetButton) {
      targetButton.focus();
      
      // Optional: Announce navigation to screen readers
      const announcement = `Button ${nextIndex + 1} of ${buttons.length}${
        targetButton.textContent ? `: ${targetButton.textContent}` : ''
      }`;
      
      // Create temporary live region for screen reader announcement
      const liveRegion = document.createElement('div');
      liveRegion.setAttribute('aria-live', 'polite');
      liveRegion.setAttribute('aria-atomic', 'true');
      liveRegion.className = 'sr-only';
      liveRegion.textContent = announcement;
      document.body.appendChild(liveRegion);
      
      // Clean up announcement after brief delay
      setTimeout(() => {
        if (document.body.contains(liveRegion)) {
          document.body.removeChild(liveRegion);
        }
      }, 1000);
    }
  }, [orientation, enableKeyboardNavigation]);

  /**
   * Get base styles for the button group container
   */
  const getBaseStyles = useCallback(() => {
    const baseClasses = [
      // Flexbox layout
      'inline-flex',
      
      // Focus management for keyboard navigation
      'focus-within:ring-2',
      'focus-within:ring-primary-500',
      'focus-within:ring-offset-2',
      
      // Accessibility and interaction
      'focus:outline-none',
      
      // Smooth transitions
      'transition-all',
      'duration-200',
    ];

    // Orientation-specific layout
    if (orientation === 'vertical') {
      baseClasses.push('flex-col');
    } else {
      baseClasses.push('flex-row', 'items-center');
    }

    return baseClasses.join(' ');
  }, [orientation]);

  /**
   * Get spacing styles based on size and attachment
   */
  const getSpacingStyles = useCallback(() => {
    if (attached) {
      // No spacing for attached buttons
      return '';
    }

    const spacingMap = {
      sm: orientation === 'horizontal' ? 'space-x-1' : 'space-y-1',
      md: orientation === 'horizontal' ? 'space-x-2' : 'space-y-2', 
      lg: orientation === 'horizontal' ? 'space-x-3' : 'space-y-3',
    };

    return spacingMap[size];
  }, [size, orientation, attached]);

  /**
   * Get variant-specific visual styles
   */
  const getVariantStyles = useCallback(() => {
    const variantMap = {
      default: '',
      
      contained: cn(
        // Container styling with background and border
        'bg-gray-50 dark:bg-gray-800',
        'border border-gray-200 dark:border-gray-700',
        'rounded-lg',
        'p-1',
        
        // Enhanced shadow for visual grouping
        'shadow-sm',
        
        // Hover state for interactive container
        'hover:bg-gray-100 dark:hover:bg-gray-750',
        'hover:border-gray-300 dark:hover:border-gray-600'
      ),
      
      separated: cn(
        // Visual separation with dividers
        orientation === 'horizontal' 
          ? 'divide-x divide-gray-200 dark:divide-gray-700'
          : 'divide-y divide-gray-200 dark:divide-gray-700',
        
        // Container styling
        'border border-gray-200 dark:border-gray-700',
        'rounded-lg',
        'overflow-hidden',
        
        // Background
        'bg-white dark:bg-gray-900'
      ),
      
      minimal: cn(
        // Minimal styling with subtle visual grouping
        'bg-transparent',
        
        // Slight visual indication of grouping
        'rounded-md',
        'p-0.5',
        
        // Subtle hover state
        'hover:bg-gray-50 dark:hover:bg-gray-800'
      ),
    };

    return variantMap[variant];
  }, [variant, orientation]);

  /**
   * Get attached button styles for seamless visual connection
   */
  const getAttachedStyles = useCallback(() => {
    if (!attached) return '';

    return cn(
      // Remove individual button borders and combine them
      '[&>button:not(:first-child)]:border-l-0',
      '[&>button:not(:last-child)]:border-r-0',
      
      // Handle border radius for first/middle/last buttons
      '[&>button:first-child]:rounded-r-none',
      '[&>button:last-child]:rounded-l-none', 
      '[&>button:not(:first-child):not(:last-child)]:rounded-none',
      
      // Vertical orientation adjustments
      orientation === 'vertical' && [
        '[&>button:not(:first-child)]:border-t-0',
        '[&>button:not(:last-child)]:border-b-0',
        '[&>button:first-child]:rounded-b-none',
        '[&>button:last-child]:rounded-t-none',
        '[&>button:not(:first-child):not(:last-child)]:rounded-none',
      ],
      
      // Enhanced focus handling for attached buttons
      '[&>button:focus]:relative',
      '[&>button:focus]:z-10',
      '[&>button:focus]:border-primary-500',
    );
  }, [attached, orientation]);

  // Combine all styles
  const combinedClassName = cn(
    getBaseStyles(),
    getSpacingStyles(),
    getVariantStyles(),
    getAttachedStyles(),
    className
  );

  // Determine appropriate ARIA attributes
  const ariaLabel = label || (enableKeyboardNavigation 
    ? `Button group with ${React.Children.count(children)} buttons. Use arrow keys to navigate.`
    : undefined
  );

  return (
    <div
      ref={groupRef}
      role={role}
      aria-label={ariaLabel}
      aria-describedby={ariaDescribedBy}
      aria-orientation={orientation}
      onKeyDown={handleKeyDown}
      className={combinedClassName}
      tabIndex={enableKeyboardNavigation ? 0 : undefined}
      {...props}
    >
      {children}
    </div>
  );
}

/**
 * Hook for managing button group state and behavior
 * Useful for creating custom button group implementations
 */
export function useButtonGroup(options: {
  orientation?: 'horizontal' | 'vertical';
  enableKeyboardNavigation?: boolean;
}) {
  const { orientation = 'horizontal', enableKeyboardNavigation = true } = options;
  const groupRef = useRef<HTMLDivElement>(null);
  const [focusedIndex, setFocusedIndex] = React.useState(0);

  const navigate = useCallback((direction: 'next' | 'previous' | 'first' | 'last') => {
    if (!groupRef.current || !enableKeyboardNavigation) return;

    const buttons = Array.from(
      groupRef.current.querySelectorAll('button:not(:disabled), [role="button"]:not([aria-disabled="true"])')
    ) as HTMLElement[];

    if (buttons.length === 0) return;

    let nextIndex: number;

    switch (direction) {
      case 'next':
        nextIndex = focusedIndex < buttons.length - 1 ? focusedIndex + 1 : 0;
        break;
      case 'previous':
        nextIndex = focusedIndex > 0 ? focusedIndex - 1 : buttons.length - 1;
        break;
      case 'first':
        nextIndex = 0;
        break;
      case 'last':
        nextIndex = buttons.length - 1;
        break;
      default:
        return;
    }

    setFocusedIndex(nextIndex);
    buttons[nextIndex]?.focus();
  }, [focusedIndex, enableKeyboardNavigation]);

  return {
    groupRef,
    focusedIndex,
    navigate,
    orientation,
  };
}

export default ButtonGroup;