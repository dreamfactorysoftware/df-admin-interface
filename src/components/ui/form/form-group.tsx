/**
 * Form Group Component
 * 
 * Semantic form grouping component that uses fieldset/legend elements for proper
 * accessibility and provides visual grouping of related form fields. Supports
 * collapsible groups, group-level validation, and responsive layouts.
 * 
 * Features:
 * - Semantic HTML using fieldset/legend for screen reader accessibility
 * - WCAG 2.1 AA compliance with proper ARIA labeling and keyboard navigation
 * - Integration with React Hook Form for group-level validation and error display
 * - Collapsible groups with smooth animations and accessibility support
 * - Responsive layout patterns with Tailwind CSS
 * - Dark theme support with consistent visual hierarchy
 * - Group-level error states and validation feedback
 * 
 * @fileoverview Form group component for DreamFactory Admin Interface
 * @version 1.0.0
 */

import React, { useState, useRef, useEffect, forwardRef } from 'react';
import { type VariantProps, cva } from 'class-variance-authority';
import { ChevronDownIcon, ChevronRightIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline';

import { cn } from '../../../lib/utils';
import { useTheme } from '../../../hooks/use-theme';
import { 
  type BaseComponentProps,
  type AccessibilityProps,
  type ThemeProps,
  type ResponsiveProps,
  type AnimationProps,
  type FormSpacing,
  type SizeVariant,
  type StateVariant
} from '../../../lib/types';

/**
 * Form group styling variants using class-variance-authority
 * Provides consistent styling across different group types and states
 */
const formGroupVariants = cva(
  // Base styles for all form groups
  [
    'relative w-full transition-all duration-200 ease-in-out',
    'focus-within:ring-2 focus-within:ring-primary-500/20 focus-within:ring-offset-2',
    'dark:focus-within:ring-primary-400/20',
  ],
  {
    variants: {
      // Visual styling variants
      variant: {
        default: [
          'border border-gray-200 rounded-lg bg-white',
          'dark:border-gray-700 dark:bg-gray-800',
        ],
        card: [
          'border border-gray-200 rounded-xl bg-white shadow-sm',
          'dark:border-gray-700 dark:bg-gray-800 dark:shadow-gray-900/10',
        ],
        bordered: [
          'border-2 border-gray-300 rounded-lg bg-gray-50/50',
          'dark:border-gray-600 dark:bg-gray-700/50',
        ],
        ghost: [
          'border-none bg-transparent',
        ],
        elevated: [
          'border border-gray-200 rounded-xl bg-white shadow-md',
          'dark:border-gray-700 dark:bg-gray-800 dark:shadow-gray-900/20',
        ],
      },
      // Spacing variants for different form densities
      spacing: {
        compact: 'p-3 space-y-3',
        normal: 'p-4 space-y-4',
        relaxed: 'p-6 space-y-6',
        loose: 'p-8 space-y-8',
      },
      // Size variants affecting overall scale
      size: {
        sm: 'text-sm',
        md: 'text-base',
        lg: 'text-lg',
        xl: 'text-xl',
      },
      // State variants for validation and interaction
      state: {
        default: '',
        error: [
          'border-error-500 ring-1 ring-error-500/20',
          'dark:border-error-400 dark:ring-error-400/20',
        ],
        warning: [
          'border-warning-500 ring-1 ring-warning-500/20',
          'dark:border-warning-400 dark:ring-warning-400/20',
        ],
        success: [
          'border-success-500 ring-1 ring-success-500/20',
          'dark:border-success-400 dark:ring-success-400/20',
        ],
        disabled: [
          'opacity-50 pointer-events-none bg-gray-100',
          'dark:bg-gray-800',
        ],
      },
    },
    defaultVariants: {
      variant: 'default',
      spacing: 'normal',
      size: 'md',
      state: 'default',
    },
  }
);

/**
 * Legend (title) styling variants
 */
const legendVariants = cva(
  [
    'block px-2 font-medium text-gray-900 bg-white',
    'dark:text-gray-100 dark:bg-gray-800',
    'group-focus-within:text-primary-600 dark:group-focus-within:text-primary-400',
    'transition-colors duration-200',
  ],
  {
    variants: {
      size: {
        sm: 'text-sm',
        md: 'text-base',
        lg: 'text-lg font-semibold',
        xl: 'text-xl font-semibold',
      },
      state: {
        default: '',
        error: 'text-error-600 dark:text-error-400',
        warning: 'text-warning-600 dark:text-warning-400',
        success: 'text-success-600 dark:text-success-400',
        disabled: 'text-gray-400 dark:text-gray-500',
      },
    },
    defaultVariants: {
      size: 'md',
      state: 'default',
    },
  }
);

/**
 * Content area styling variants
 */
const contentVariants = cva(
  [
    'transition-all duration-300 ease-in-out overflow-hidden',
  ],
  {
    variants: {
      collapsible: {
        true: 'data-[collapsed=true]:max-h-0 data-[collapsed=false]:max-h-none',
        false: '',
      },
    },
    defaultVariants: {
      collapsible: false,
    },
  }
);

/**
 * Form group component props interface
 * Extends base component props with form-specific functionality
 */
export interface FormGroupProps
  extends Omit<React.FieldsetHTMLAttributes<HTMLFieldSetElement>, 'title'>,
    BaseComponentProps<HTMLFieldSetElement>,
    AccessibilityProps,
    ThemeProps,
    ResponsiveProps,
    AnimationProps,
    VariantProps<typeof formGroupVariants> {
  
  /** Group title displayed in the legend element */
  title: string;
  
  /** Optional description text displayed below the title */
  description?: string;
  
  /** Makes the group collapsible with expand/collapse functionality */
  collapsible?: boolean;
  
  /** Initial collapsed state (only applicable when collapsible=true) */
  defaultCollapsed?: boolean;
  
  /** Controlled collapsed state (overrides defaultCollapsed) */
  collapsed?: boolean;
  
  /** Callback fired when collapse state changes */
  onCollapsedChange?: (collapsed: boolean) => void;
  
  /** Group-level error message */
  error?: string;
  
  /** Group-level warning message */
  warning?: string;
  
  /** Group-level success message */
  success?: string;
  
  /** Show required indicator (*) next to title */
  required?: boolean;
  
  /** Additional help text displayed at the bottom of the group */
  helpText?: string;
  
  /** Custom icon to display next to the title */
  icon?: React.ComponentType<{ className?: string }>;
  
  /** Group form content */
  children: React.ReactNode;
  
  /** Custom CSS classes for the fieldset element */
  className?: string;
  
  /** Custom CSS classes for the legend element */
  legendClassName?: string;
  
  /** Custom CSS classes for the content area */
  contentClassName?: string;
  
  /** Test identifier for automation */
  'data-testid'?: string;
}

/**
 * Form Group Component
 * 
 * A semantic form grouping component that uses fieldset/legend elements
 * for proper accessibility and provides visual grouping of related form fields.
 * 
 * @param props - Component props
 * @param ref - Forwarded ref to the fieldset element
 * @returns JSX.Element
 */
export const FormGroup = forwardRef<HTMLFieldSetElement, FormGroupProps>(
  function FormGroup(
    {
      title,
      description,
      collapsible = false,
      defaultCollapsed = false,
      collapsed: controlledCollapsed,
      onCollapsedChange,
      error,
      warning,
      success,
      required = false,
      helpText,
      icon: Icon,
      children,
      variant = 'default',
      spacing = 'normal',
      size = 'md',
      state = 'default',
      className,
      legendClassName,
      contentClassName,
      disabled = false,
      'aria-label': ariaLabel,
      'aria-describedby': ariaDescribedBy,
      'data-testid': testId,
      ...fieldsetProps
    },
    ref
  ) {
    // Theme support
    const { resolvedTheme } = useTheme();
    
    // Internal collapsed state management
    const [internalCollapsed, setInternalCollapsed] = useState(defaultCollapsed);
    const isControlled = controlledCollapsed !== undefined;
    const isCollapsed = isControlled ? controlledCollapsed : internalCollapsed;
    
    // Content refs for height animations
    const contentRef = useRef<HTMLDivElement>(null);
    const [contentHeight, setContentHeight] = useState<number | undefined>();
    
    // Determine the effective state based on validation messages
    const effectiveState = error ? 'error' : warning ? 'warning' : success ? 'success' : disabled ? 'disabled' : state;
    
    // Generate unique IDs for accessibility
    const groupId = React.useId();
    const titleId = `${groupId}-title`;
    const descriptionId = description ? `${groupId}-description` : undefined;
    const errorId = error ? `${groupId}-error` : undefined;
    const warningId = warning ? `${groupId}-warning` : undefined;
    const successId = success ? `${groupId}-success` : undefined;
    const helpTextId = helpText ? `${groupId}-help` : undefined;
    
    // Build aria-describedby attribute
    const describedByIds = [
      ariaDescribedBy,
      descriptionId,
      errorId,
      warningId,
      successId,
      helpTextId,
    ].filter(Boolean).join(' ') || undefined;
    
    // Handle collapse toggle
    const handleToggleCollapsed = () => {
      const newCollapsed = !isCollapsed;
      
      if (!isControlled) {
        setInternalCollapsed(newCollapsed);
      }
      
      onCollapsedChange?.(newCollapsed);
    };
    
    // Handle keyboard navigation for collapsible groups
    const handleKeyDown = (event: React.KeyboardEvent) => {
      if (!collapsible) return;
      
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        handleToggleCollapsed();
      }
    };
    
    // Measure content height for smooth animations
    useEffect(() => {
      if (!collapsible || !contentRef.current) return;
      
      const resizeObserver = new ResizeObserver((entries) => {
        const entry = entries[0];
        if (entry) {
          setContentHeight(entry.contentRect.height);
        }
      });
      
      resizeObserver.observe(contentRef.current);
      
      return () => {
        resizeObserver.disconnect();
      };
    }, [collapsible]);
    
    // Render validation message
    const renderValidationMessage = () => {
      if (!error && !warning && !success) return null;
      
      const message = error || warning || success;
      const messageType = error ? 'error' : warning ? 'warning' : 'success';
      const messageId = errorId || warningId || successId;
      
      const iconColors = {
        error: 'text-error-500 dark:text-error-400',
        warning: 'text-warning-500 dark:text-warning-400',
        success: 'text-success-500 dark:text-success-400',
      };
      
      const textColors = {
        error: 'text-error-700 dark:text-error-300',
        warning: 'text-warning-700 dark:text-warning-300',
        success: 'text-success-700 dark:text-success-300',
      };
      
      return (
        <div
          id={messageId}
          className={cn(
            'flex items-start gap-2 mt-2 text-sm',
            textColors[messageType]
          )}
          role={messageType === 'error' ? 'alert' : 'status'}
          aria-live={messageType === 'error' ? 'assertive' : 'polite'}
        >
          <ExclamationTriangleIcon 
            className={cn('h-4 w-4 mt-0.5 flex-shrink-0', iconColors[messageType])}
            aria-hidden="true"
          />
          <span>{message}</span>
        </div>
      );
    };
    
    // Render help text
    const renderHelpText = () => {
      if (!helpText) return null;
      
      return (
        <div
          id={helpTextId}
          className="mt-2 text-sm text-gray-600 dark:text-gray-400"
        >
          {helpText}
        </div>
      );
    };
    
    // Render collapsible header
    const renderHeader = () => {
      if (!collapsible) {
        return (
          <legend
            id={titleId}
            className={cn(
              legendVariants({ size, state: effectiveState }),
              legendClassName
            )}
          >
            <div className="flex items-center gap-2">
              {Icon && <Icon className="h-5 w-5" aria-hidden="true" />}
              <span>{title}</span>
              {required && (
                <span className="text-error-500 dark:text-error-400" aria-label="required">
                  *
                </span>
              )}
            </div>
          </legend>
        );
      }
      
      const CollapseIcon = isCollapsed ? ChevronRightIcon : ChevronDownIcon;
      
      return (
        <legend
          id={titleId}
          className={cn(
            legendVariants({ size, state: effectiveState }),
            'cursor-pointer select-none',
            'hover:text-primary-700 dark:hover:text-primary-300',
            'focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 rounded',
            legendClassName
          )}
          onClick={handleToggleCollapsed}
          onKeyDown={handleKeyDown}
          tabIndex={0}
          role="button"
          aria-expanded={!isCollapsed}
          aria-controls={`${groupId}-content`}
        >
          <div className="flex items-center gap-2">
            <CollapseIcon 
              className="h-4 w-4 transition-transform duration-200" 
              aria-hidden="true"
            />
            {Icon && <Icon className="h-5 w-5" aria-hidden="true" />}
            <span>{title}</span>
            {required && (
              <span className="text-error-500 dark:text-error-400" aria-label="required">
                *
              </span>
            )}
          </div>
        </legend>
      );
    };
    
    return (
      <fieldset
        ref={ref}
        className={cn(
          formGroupVariants({ variant, spacing, size, state: effectiveState }),
          'group',
          className
        )}
        disabled={disabled}
        aria-labelledby={titleId}
        aria-describedby={describedByIds}
        aria-label={ariaLabel}
        data-testid={testId}
        data-theme={resolvedTheme}
        {...fieldsetProps}
      >
        {renderHeader()}
        
        {description && (
          <div
            id={descriptionId}
            className="mt-1 text-sm text-gray-600 dark:text-gray-400"
          >
            {description}
          </div>
        )}
        
        <div
          id={`${groupId}-content`}
          ref={contentRef}
          className={cn(
            contentVariants({ collapsible }),
            contentClassName
          )}
          data-collapsed={collapsible ? isCollapsed : undefined}
          style={
            collapsible && isCollapsed
              ? { maxHeight: 0, paddingTop: 0, paddingBottom: 0 }
              : collapsible
              ? { maxHeight: contentHeight }
              : undefined
          }
          aria-hidden={collapsible ? isCollapsed : false}
        >
          {children}
        </div>
        
        {renderValidationMessage()}
        {renderHelpText()}
      </fieldset>
    );
  }
);

FormGroup.displayName = 'FormGroup';

/**
 * Export form group variants for external usage
 */
export { formGroupVariants, legendVariants, contentVariants };

/**
 * Export type definitions for TypeScript support
 */
export type { FormGroupProps };