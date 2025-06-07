/**
 * Form Label Component for DreamFactory Admin Interface
 * 
 * A standardized, accessible form label component that provides consistent typography,
 * proper accessibility attributes, and styling for all form inputs. Automatically
 * associates with form controls via htmlFor attributes and supports required field
 * indicators with proper screen reader announcements.
 * 
 * Key Features:
 * - WCAG 2.1 AA accessibility compliance with proper label associations
 * - Consistent typography using Tailwind CSS design tokens
 * - Required field indicators with clear visual and screen reader distinction
 * - Dark theme support with 4.5:1 minimum contrast ratio
 * - Integration with form field components for automatic association
 * - Responsive text sizing for different viewport sizes
 * - Tooltip integration for label descriptions and help text
 * 
 * Replaces Angular Material mat-label patterns with modern React implementation.
 */

'use client';

import React, { useId, forwardRef } from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';
import { BaseComponent, ComponentSize, ComponentVariant } from '@/types/ui';

// ============================================================================
// COMPONENT VARIANTS AND STYLING
// ============================================================================

/**
 * Form label variant definitions using class-variance-authority
 * Provides consistent styling with Tailwind CSS design tokens
 */
const formLabelVariants = cva(
  // Base styles - WCAG 2.1 AA compliant typography and colors
  [
    'block font-medium leading-6 transition-colors duration-200',
    'text-gray-900 dark:text-gray-100',
    // Focus-within states for enhanced accessibility
    'group-focus-within:text-primary-700 dark:group-focus-within:text-primary-300',
    // Ensure minimum contrast ratios (4.5:1 for normal text, 3:1 for large text)
    'contrast-more:text-gray-950 contrast-more:dark:text-gray-50',
  ],
  {
    variants: {
      /**
       * Size variants - responsive text sizing following WCAG guidelines
       * Large text (18px+) requires only 3:1 contrast ratio
       */
      size: {
        xs: 'text-xs', // 12px - Small auxiliary text
        sm: 'text-sm', // 14px - Standard form labels
        md: 'text-base', // 16px - Default size, good accessibility baseline
        lg: 'text-lg', // 18px - Large text threshold for WCAG
        xl: 'text-xl', // 20px - Prominent labels
      },
      
      /**
       * Visual variants for different form contexts
       */
      variant: {
        default: '', // Standard label styling
        inline: 'inline-block mr-3', // Inline form layouts
        floating: [ // Floating label pattern
          'absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none',
          'transition-all duration-200 ease-in-out origin-left',
          'peer-placeholder-shown:scale-100 peer-placeholder-shown:translate-y-0',
          'peer-focus:scale-75 peer-focus:-translate-y-6 peer-focus:translate-x-0',
          'peer-[:not(:placeholder-shown)]:scale-75 peer-[:not(:placeholder-shown)]:-translate-y-6',
        ],
        minimal: 'text-gray-600 dark:text-gray-400 font-normal', // Subtle labels
        prominent: 'text-lg font-semibold text-gray-900 dark:text-gray-100', // Emphasized labels
      },
      
      /**
       * State variants for validation and interaction states
       */
      state: {
        default: '',
        error: 'text-red-700 dark:text-red-400',
        success: 'text-green-700 dark:text-green-400',
        warning: 'text-yellow-700 dark:text-yellow-400',
        disabled: 'text-gray-400 dark:text-gray-600 cursor-not-allowed',
      },
      
      /**
       * Required field indicator positioning
       */
      requiredPosition: {
        after: '', // Default: asterisk after label text
        before: '', // Asterisk before label text
        hidden: '', // Required but visually hidden
      },
    },
    
    /**
     * Compound variants for complex styling combinations
     */
    compoundVariants: [
      // Floating labels need different error state styling
      {
        variant: 'floating',
        state: 'error',
        className: 'peer-focus:text-red-600 dark:peer-focus:text-red-400',
      },
      // Large size with prominent variant for section headers
      {
        size: 'lg',
        variant: 'prominent',
        className: 'border-b border-gray-200 dark:border-gray-700 pb-2 mb-4',
      },
      // Inline labels need adjusted spacing
      {
        variant: 'inline',
        size: 'sm',
        className: 'min-w-[120px]',
      },
    ],
    
    /**
     * Default variant values
     */
    defaultVariants: {
      size: 'sm',
      variant: 'default',
      state: 'default',
      requiredPosition: 'after',
    },
  }
);

// ============================================================================
// COMPONENT INTERFACES
// ============================================================================

/**
 * Required field indicator configuration
 */
interface RequiredIndicatorConfig {
  /** Visual indicator (usually asterisk) */
  symbol?: string;
  /** Screen reader text for required fields */
  srText?: string;
  /** Custom styling for the indicator */
  className?: string;
  /** Position relative to label text */
  position?: 'before' | 'after' | 'hidden';
}

/**
 * Tooltip configuration for label descriptions
 */
interface TooltipConfig {
  /** Tooltip content */
  content: string;
  /** Tooltip placement */
  placement?: 'top' | 'bottom' | 'left' | 'right';
  /** Delay before showing tooltip (ms) */
  delay?: number;
  /** Custom tooltip styling */
  className?: string;
}

/**
 * Form label component props interface
 */
export interface FormLabelProps 
  extends Omit<React.LabelHTMLAttributes<HTMLLabelElement>, 'size'>,
          BaseComponent,
          VariantProps<typeof formLabelVariants> {
  /** 
   * The form control ID that this label is associated with
   * Automatically generates unique ID if not provided
   */
  htmlFor?: string;
  
  /**
   * Label text content
   */
  children: React.ReactNode;
  
  /**
   * Whether the associated field is required
   * Adds visual indicator and screen reader announcement
   */
  required?: boolean;
  
  /**
   * Required field indicator configuration
   */
  requiredConfig?: RequiredIndicatorConfig;
  
  /**
   * Optional description or help text
   * Displayed as tooltip or subtitle based on configuration
   */
  description?: string;
  
  /**
   * Tooltip configuration for additional help
   */
  tooltip?: TooltipConfig;
  
  /**
   * Whether the label should be visually hidden but remain accessible
   * Useful for screen readers when visual label isn't needed
   */
  srOnly?: boolean;
  
  /**
   * Additional ARIA attributes for enhanced accessibility
   */
  'aria-describedby'?: string;
  'aria-labelledby'?: string;
  
  /**
   * Custom ref for imperative operations
   */
  ref?: React.Ref<HTMLLabelElement>;
}

// ============================================================================
// COMPONENT IMPLEMENTATION
// ============================================================================

/**
 * FormLabel Component
 * 
 * Provides standardized, accessible form labels with consistent styling
 * and proper semantic markup for screen readers and assistive technologies.
 */
export const FormLabel = forwardRef<HTMLLabelElement, FormLabelProps>(
  (
    {
      children,
      className,
      size,
      variant,
      state,
      requiredPosition,
      htmlFor: providedHtmlFor,
      required = false,
      requiredConfig = {},
      description,
      tooltip,
      srOnly = false,
      id,
      'aria-describedby': ariaDescribedBy,
      'aria-labelledby': ariaLabelledBy,
      'data-testid': testId,
      ...props
    },
    ref
  ) => {
    // Generate unique IDs for accessibility
    const generatedId = useId();
    const labelId = id || `label-${generatedId}`;
    const controlId = providedHtmlFor || `control-${generatedId}`;
    const descriptionId = description ? `${labelId}-description` : undefined;
    const tooltipId = tooltip ? `${labelId}-tooltip` : undefined;
    
    // Configure required field indicator
    const requiredIndicator = {
      symbol: '*',
      srText: 'required',
      position: requiredPosition || 'after',
      className: 'text-red-500 dark:text-red-400 ml-1',
      ...requiredConfig,
    };
    
    // Build ARIA attributes
    const ariaAttributes = {
      'aria-describedby': [
        ariaDescribedBy,
        descriptionId,
        tooltipId,
      ].filter(Boolean).join(' ') || undefined,
      'aria-labelledby': ariaLabelledBy,
    };
    
    // Required indicator element
    const RequiredIndicator = () => {
      if (!required || requiredIndicator.position === 'hidden') return null;
      
      return (
        <span
          className={cn('select-none', requiredIndicator.className)}
          aria-label={requiredIndicator.srText}
          role="img"
          data-testid={`${testId}-required-indicator`}
        >
          {requiredIndicator.symbol}
        </span>
      );
    };
    
    // Description element for additional context
    const DescriptionElement = () => {
      if (!description) return null;
      
      return (
        <span
          id={descriptionId}
          className={cn(
            'block text-xs text-gray-600 dark:text-gray-400 mt-1',
            'leading-4'
          )}
          data-testid={`${testId}-description`}
        >
          {description}
        </span>
      );
    };
    
    // Tooltip element (simplified implementation - would integrate with tooltip library)
    const TooltipElement = () => {
      if (!tooltip) return null;
      
      return (
        <span
          id={tooltipId}
          className="sr-only"
          data-testid={`${testId}-tooltip`}
        >
          {tooltip.content}
        </span>
      );
    };
    
    return (
      <div className="space-y-1">
        <label
          ref={ref}
          id={labelId}
          htmlFor={controlId}
          className={cn(
            formLabelVariants({ size, variant, state, requiredPosition }),
            srOnly && 'sr-only',
            className
          )}
          data-testid={testId || 'form-label'}
          {...ariaAttributes}
          {...props}
        >
          {/* Required indicator before text */}
          {requiredIndicator.position === 'before' && <RequiredIndicator />}
          
          {/* Label text content */}
          <span className="select-none">
            {children}
          </span>
          
          {/* Required indicator after text */}
          {requiredIndicator.position === 'after' && <RequiredIndicator />}
          
          {/* Tooltip trigger (would be enhanced with actual tooltip library) */}
          {tooltip && (
            <button
              type="button"
              className={cn(
                'ml-2 inline-flex items-center justify-center',
                'w-4 h-4 rounded-full bg-gray-300 dark:bg-gray-600',
                'text-xs text-gray-600 dark:text-gray-400',
                'hover:bg-gray-400 dark:hover:bg-gray-500',
                'focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-1',
                'transition-colors duration-200'
              )}
              aria-label={`Show help for ${children}`}
              aria-describedby={tooltipId}
              data-testid={`${testId}-tooltip-trigger`}
            >
              ?
            </button>
          )}
          
          {/* Hidden required announcement for screen readers */}
          {required && (
            <span className="sr-only">
              {requiredIndicator.srText}
            </span>
          )}
        </label>
        
        {/* Description text */}
        <DescriptionElement />
        
        {/* Tooltip content (hidden, would be shown by tooltip library) */}
        <TooltipElement />
      </div>
    );
  }
);

FormLabel.displayName = 'FormLabel';

// ============================================================================
// UTILITY FUNCTIONS AND HOOKS
// ============================================================================

/**
 * Hook to generate consistent label IDs and associations
 * Useful for complex form layouts where labels might be separated from inputs
 */
export function useFormLabelId(providedId?: string) {
  const generatedId = useId();
  const labelId = providedId || `label-${generatedId}`;
  const controlId = `control-${generatedId}`;
  const descriptionId = `${labelId}-description`;
  const errorId = `${labelId}-error`;
  
  return {
    labelId,
    controlId,
    descriptionId,
    errorId,
    getLabelProps: (props: Partial<FormLabelProps> = {}) => ({
      id: labelId,
      htmlFor: controlId,
      ...props,
    }),
    getControlProps: (props: any = {}) => ({
      id: controlId,
      'aria-labelledby': labelId,
      'aria-describedby': [
        props['aria-describedby'],
        descriptionId,
        props.error ? errorId : undefined,
      ].filter(Boolean).join(' ') || undefined,
      ...props,
    }),
  };
}

/**
 * Utility function to create accessible field groups
 * Helps with complex form layouts that need proper labeling structure
 */
export function createFieldGroup(options: {
  label: string;
  description?: string;
  required?: boolean;
  error?: string;
}) {
  const ids = useFormLabelId();
  
  return {
    ...ids,
    groupProps: {
      role: 'group',
      'aria-labelledby': ids.labelId,
      'aria-describedby': [
        options.description ? ids.descriptionId : undefined,
        options.error ? ids.errorId : undefined,
      ].filter(Boolean).join(' ') || undefined,
    },
    labelProps: ids.getLabelProps({
      required: options.required,
      description: options.description,
    }),
  };
}

// ============================================================================
// TYPE EXPORTS
// ============================================================================

export type { RequiredIndicatorConfig, TooltipConfig };
export { formLabelVariants };

// ============================================================================
// DEFAULT CONFIGURATIONS
// ============================================================================

/**
 * Default required field configuration
 * Can be imported and customized for consistent required field styling
 */
export const DEFAULT_REQUIRED_CONFIG: RequiredIndicatorConfig = {
  symbol: '*',
  srText: 'required',
  position: 'after',
  className: 'text-red-500 dark:text-red-400 ml-1 select-none',
};

/**
 * Accessible color configurations for different states
 * Ensures WCAG 2.1 AA compliance with 4.5:1 contrast ratios
 */
export const ACCESSIBLE_COLORS = {
  states: {
    default: 'text-gray-900 dark:text-gray-100',
    error: 'text-red-700 dark:text-red-400', // 4.5:1 contrast on white/dark backgrounds
    success: 'text-green-700 dark:text-green-400',
    warning: 'text-yellow-800 dark:text-yellow-300', // Enhanced contrast for yellow
    disabled: 'text-gray-400 dark:text-gray-600',
  },
  required: {
    indicator: 'text-red-500 dark:text-red-400',
    background: 'bg-red-50 dark:bg-red-900/10',
  },
} as const;

/**
 * Responsive breakpoint configurations for label sizing
 * Follows Tailwind CSS conventions with accessibility considerations
 */
export const RESPONSIVE_LABEL_SIZES = {
  mobile: 'text-sm',      // 14px - Good for mobile touch targets
  tablet: 'text-base',    // 16px - Standard desktop size
  desktop: 'text-base',   // 16px - Consistent across desktop
  large: 'text-lg',       // 18px - For important labels or large screens
} as const;