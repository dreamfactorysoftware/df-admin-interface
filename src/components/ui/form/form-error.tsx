/**
 * Form Error Component - React 19 Implementation
 * 
 * Form error message component that displays validation errors with proper accessibility 
 * features and consistent styling. Integrates with React Hook Form error state and provides 
 * ARIA live regions for dynamic error announcements to screen readers.
 * 
 * Features:
 * - WCAG 2.1 AA accessibility compliance with ARIA live regions for screen reader announcements
 * - React Hook Form integration for automatic error state management
 * - Error color contrast ratio of 4.5:1 minimum for accessibility compliance
 * - Support for multiple validation errors with clear priority ordering
 * - Smooth animations for error state transitions without causing motion sickness
 * - Error icon integration with proper ARIA labeling
 * - Automatic field association for screen reader context
 * 
 * @fileoverview React Form Error component for validation error display
 * @version 1.0.0
 * @see Technical Specification Section 0 - SUMMARY OF CHANGES
 * @see Technical Specification Section 7.1 - CORE UI TECHNOLOGIES
 * @see WCAG 2.1 AA Guidelines: https://www.w3.org/WAI/WCAG21/Understanding/
 */

'use client';

import React, { 
  forwardRef, 
  useEffect, 
  useRef, 
  useState,
  type HTMLAttributes,
  type ReactNode,
} from 'react';
import { ExclamationCircleIcon } from '@heroicons/react/24/outline';
import { FieldError, type FieldErrors } from 'react-hook-form';
import { cn, generateId } from '@/lib/utils';
import { type ComponentSize, type ComponentVariant } from '@/types/ui';

// =============================================================================
// FORM ERROR TYPES AND INTERFACES
// =============================================================================

/**
 * Error priority for ordering multiple validation errors
 * Higher priority errors are displayed first
 */
export type ErrorPriority = 'low' | 'medium' | 'high' | 'critical';

/**
 * Error message configuration with metadata
 */
export interface ErrorMessage {
  /** Error message text */
  message: string;
  /** Error type for categorization */
  type?: string;
  /** Priority for ordering multiple errors */
  priority?: ErrorPriority;
  /** Custom icon component */
  icon?: React.ComponentType<{ className?: string }>;
}

/**
 * Enhanced form error props interface
 * Supports both single error strings and complex error objects
 */
export interface FormErrorProps extends Omit<HTMLAttributes<HTMLDivElement>, 'children'> {
  /**
   * Field name for proper ARIA association
   * Used to generate accessible IDs and associations
   */
  fieldName?: string;
  
  /**
   * React Hook Form field error object or error message string
   * Supports both FieldError objects and simple string messages
   */
  error?: FieldError | string | null;
  
  /**
   * Multiple errors for complex validation scenarios
   * Automatically sorted by priority
   */
  errors?: ErrorMessage[] | FieldErrors<any>;
  
  /**
   * Component size affecting spacing and typography
   */
  size?: ComponentSize;
  
  /**
   * Visual variant for different contexts
   */
  variant?: ComponentVariant;
  
  /**
   * Show error icon alongside message
   */
  showIcon?: boolean;
  
  /**
   * Custom icon component
   * Defaults to ExclamationCircleIcon
   */
  icon?: React.ComponentType<{ className?: string }>;
  
  /**
   * ARIA live region politeness level
   * Controls how aggressively screen readers announce errors
   */
  liveRegion?: 'off' | 'polite' | 'assertive';
  
  /**
   * Disable fade-in animation for error appearance
   * Useful for users sensitive to motion
   */
  disableAnimation?: boolean;
  
  /**
   * Maximum number of errors to display
   * Additional errors are indicated with a count
   */
  maxErrorsDisplayed?: number;
  
  /**
   * Custom error ID for ARIA associations
   * Generated automatically if not provided
   */
  errorId?: string;
  
  /**
   * Additional ARIA describedby IDs
   * Appended to the error ID for comprehensive field description
   */
  ariaDescribedBy?: string;
  
  /**
   * Custom CSS classes for styling
   */
  className?: string;
  
  /**
   * Custom content renderer for complex error displays
   */
  renderError?: (error: ErrorMessage, index: number) => ReactNode;
  
  /**
   * Callback when error state changes
   * Useful for analytics or custom handling
   */
  onErrorChange?: (hasError: boolean, errorCount: number) => void;
}

// =============================================================================
// ERROR PRIORITY AND SORTING UTILITIES
// =============================================================================

/**
 * Priority values for sorting errors
 * Higher numbers indicate higher priority
 */
const PRIORITY_VALUES: Record<ErrorPriority, number> = {
  low: 1,
  medium: 2,
  high: 3,
  critical: 4,
};

/**
 * Convert various error formats to normalized ErrorMessage array
 */
const normalizeErrors = (
  error?: FieldError | string | null,
  errors?: ErrorMessage[] | FieldErrors<any>
): ErrorMessage[] => {
  const normalized: ErrorMessage[] = [];
  
  // Handle single error prop
  if (error) {
    if (typeof error === 'string') {
      normalized.push({
        message: error,
        type: 'validation',
        priority: 'medium',
      });
    } else if (error.message) {
      normalized.push({
        message: error.message,
        type: error.type || 'validation',
        priority: 'medium',
      });
    }
  }
  
  // Handle multiple errors prop
  if (errors) {
    if (Array.isArray(errors)) {
      normalized.push(...errors);
    } else {
      // Handle FieldErrors object from React Hook Form
      Object.entries(errors).forEach(([field, fieldError]) => {
        if (fieldError && typeof fieldError === 'object' && 'message' in fieldError) {
          normalized.push({
            message: fieldError.message || `Invalid ${field}`,
            type: fieldError.type || 'validation',
            priority: 'medium',
          });
        }
      });
    }
  }
  
  // Sort by priority (highest first), then by message for consistency
  return normalized.sort((a, b) => {
    const priorityDiff = PRIORITY_VALUES[b.priority || 'medium'] - PRIORITY_VALUES[a.priority || 'medium'];
    if (priorityDiff !== 0) return priorityDiff;
    return a.message.localeCompare(b.message);
  });
};

// =============================================================================
// FORM ERROR STYLING VARIANTS
// =============================================================================

/**
 * Form error styling with WCAG 2.1 AA compliant color combinations
 * Ensures minimum 4.5:1 contrast ratio for error text
 */
const formErrorVariants = {
  base: cn(
    "flex items-start gap-2 text-sm font-medium transition-all duration-200 ease-out",
    "animate-fade-in motion-reduce:animate-none"
  ),
  
  size: {
    xs: "text-xs gap-1.5",
    sm: "text-sm gap-2", 
    md: "text-sm gap-2",
    lg: "text-base gap-2.5",
    xl: "text-lg gap-3",
  },
  
  variant: {
    primary: cn(
      "text-error-700 dark:text-error-400",
      "[&>svg]:text-error-600 dark:[&>svg]:text-error-500"
    ),
    secondary: cn(
      "text-error-600 dark:text-error-300", 
      "[&>svg]:text-error-500 dark:[&>svg]:text-error-400"
    ),
    success: cn(
      "text-success-700 dark:text-success-400",
      "[&>svg]:text-success-600 dark:[&>svg]:text-success-500"
    ),
    warning: cn(
      "text-warning-700 dark:text-warning-400",
      "[&>svg]:text-warning-600 dark:[&>svg]:text-warning-500"
    ),
    error: cn(
      "text-error-700 dark:text-error-400",
      "[&>svg]:text-error-600 dark:[&>svg]:text-error-500"
    ),
    ghost: cn(
      "text-error-600 dark:text-error-400",
      "[&>svg]:text-error-500 dark:[&>svg]:text-error-400"
    ),
    outline: cn(
      "text-error-700 dark:text-error-400",
      "[&>svg]:text-error-600 dark:[&>svg]:text-error-500"
    ),
    filled: cn(
      "text-error-700 dark:text-error-400",
      "[&>svg]:text-error-600 dark:[&>svg]:text-error-500"
    ),
    minimal: cn(
      "text-error-600 dark:text-error-400",
      "[&>svg]:text-error-500 dark:[&>svg]:text-error-400"
    ),
  },
};

// =============================================================================
// FORM ERROR COMPONENT
// =============================================================================

/**
 * FormError component with comprehensive accessibility and React Hook Form integration
 * 
 * Displays validation errors with proper ARIA live regions for screen reader announcements.
 * Supports multiple error messages with priority ordering and smooth animations.
 * 
 * @example
 * ```tsx
 * // Basic usage with React Hook Form
 * <FormError 
 *   fieldName="email"
 *   error={errors.email}
 *   errorId="email-error"
 * />
 * 
 * // Multiple errors with custom priority
 * <FormError 
 *   fieldName="password"
 *   errors={[
 *     { message: "Password is required", priority: "critical" },
 *     { message: "Must be at least 8 characters", priority: "high" }
 *   ]}
 *   maxErrorsDisplayed={2}
 * />
 * 
 * // Custom styling and icon
 * <FormError 
 *   error="Invalid input"
 *   variant="warning"
 *   size="lg"
 *   showIcon={true}
 *   icon={CustomWarningIcon}
 * />
 * ```
 */
export const FormError = forwardRef<HTMLDivElement, FormErrorProps>(
  (
    {
      fieldName,
      error,
      errors,
      size = 'md',
      variant = 'error',
      showIcon = true,
      icon: IconComponent = ExclamationCircleIcon,
      liveRegion = 'polite',
      disableAnimation = false,
      maxErrorsDisplayed = 3,
      errorId: providedErrorId,
      ariaDescribedBy,
      className,
      renderError,
      onErrorChange,
      ...props
    },
    ref
  ) => {
    // =======================================================================
    // STATE AND REFS
    // =======================================================================
    
    const [mounted, setMounted] = useState(false);
    const [previousErrorCount, setPreviousErrorCount] = useState(0);
    const errorIdRef = useRef<string>(
      providedErrorId || (fieldName ? `${fieldName}-error` : generateId('error'))
    );
    const liveRegionRef = useRef<HTMLDivElement>(null);
    
    // =======================================================================
    // ERROR PROCESSING
    // =======================================================================
    
    const normalizedErrors = normalizeErrors(error, errors);
    const hasErrors = normalizedErrors.length > 0;
    const displayedErrors = normalizedErrors.slice(0, maxErrorsDisplayed);
    const hiddenErrorCount = Math.max(0, normalizedErrors.length - maxErrorsDisplayed);
    
    // =======================================================================
    // EFFECTS
    // =======================================================================
    
    // Handle component mounting for animation
    useEffect(() => {
      setMounted(true);
    }, []);
    
    // Handle error state changes
    useEffect(() => {
      const currentErrorCount = normalizedErrors.length;
      if (currentErrorCount !== previousErrorCount) {
        onErrorChange?.(hasErrors, currentErrorCount);
        setPreviousErrorCount(currentErrorCount);
      }
    }, [normalizedErrors.length, hasErrors, onErrorChange, previousErrorCount]);
    
    // Announce errors to screen readers when they appear
    useEffect(() => {
      if (hasErrors && liveRegion !== 'off' && liveRegionRef.current) {
        // Brief delay to ensure the DOM is updated before announcement
        const timer = setTimeout(() => {
          const errorText = displayedErrors.map(err => err.message).join('. ');
          const announcement = `Validation error${displayedErrors.length > 1 ? 's' : ''}: ${errorText}`;
          
          // Update the live region content
          if (liveRegionRef.current) {
            liveRegionRef.current.textContent = announcement;
            
            // Clear after announcement to avoid repeated announcements
            setTimeout(() => {
              if (liveRegionRef.current) {
                liveRegionRef.current.textContent = '';
              }
            }, 1000);
          }
        }, 100);
        
        return () => clearTimeout(timer);
      }
    }, [hasErrors, displayedErrors, liveRegion]);
    
    // =======================================================================
    // RENDER GUARDS
    // =======================================================================
    
    // Don't render if no errors
    if (!hasErrors) {
      return null;
    }
    
    // =======================================================================
    // STYLING
    // =======================================================================
    
    const errorClasses = cn(
      formErrorVariants.base,
      formErrorVariants.size[size],
      formErrorVariants.variant[variant],
      disableAnimation && "animate-none",
      !mounted && "opacity-0",
      className
    );
    
    const iconClasses = cn(
      "flex-shrink-0 mt-0.5",
      size === 'xs' && "w-3 h-3",
      size === 'sm' && "w-4 h-4", 
      size === 'md' && "w-4 h-4",
      size === 'lg' && "w-5 h-5",
      size === 'xl' && "w-6 h-6"
    );
    
    // =======================================================================
    // ARIA ATTRIBUTES
    // =======================================================================
    
    const ariaDescribedByList = [
      errorIdRef.current,
      ariaDescribedBy,
    ].filter(Boolean).join(' ');
    
    // =======================================================================
    // RENDER
    // =======================================================================
    
    return (
      <>
        {/* Main error display */}
        <div
          ref={ref}
          id={errorIdRef.current}
          role="alert"
          aria-live={liveRegion}
          aria-atomic="true"
          aria-describedby={ariaDescribedBy}
          className={errorClasses}
          {...props}
        >
          {/* Error icon */}
          {showIcon && (
            <IconComponent 
              className={iconClasses}
              aria-hidden="true"
              role="img"
              aria-label="Error"
            />
          )}
          
          {/* Error messages */}
          <div className="flex-1 min-w-0">
            {displayedErrors.map((errorMsg, index) => (
              <div 
                key={`${errorMsg.message}-${index}`}
                className={cn(
                  "block",
                  index > 0 && "mt-1"
                )}
              >
                {renderError ? (
                  renderError(errorMsg, index)
                ) : (
                  <span className="block break-words">
                    {errorMsg.message}
                  </span>
                )}
              </div>
            ))}
            
            {/* Hidden error count indicator */}
            {hiddenErrorCount > 0 && (
              <div className="mt-1 text-xs opacity-75">
                +{hiddenErrorCount} more error{hiddenErrorCount !== 1 ? 's' : ''}
              </div>
            )}
          </div>
        </div>
        
        {/* Hidden live region for screen reader announcements */}
        <div
          ref={liveRegionRef}
          aria-live={liveRegion}
          aria-atomic="true"
          className="sr-only"
          role="status"
        />
      </>
    );
  }
);

FormError.displayName = 'FormError';

// =============================================================================
// EXPORTS
// =============================================================================

export default FormError;

export type {
  FormErrorProps,
  ErrorMessage,
  ErrorPriority,
};

// =============================================================================
// UTILITY EXPORTS
// =============================================================================

/**
 * Utility function to generate error ID for form field association
 */
export const getFormErrorId = (fieldName: string): string => {
  return `${fieldName}-error`;
};

/**
 * Utility function to format React Hook Form errors for display
 */
export const formatFieldErrors = (
  fieldError: FieldError | undefined
): ErrorMessage[] => {
  if (!fieldError) return [];
  
  return [{
    message: fieldError.message || 'Invalid input',
    type: fieldError.type || 'validation',
    priority: 'medium' as ErrorPriority,
  }];
};

/**
 * Utility function to get aria-describedby value including error ID
 */
export const getFormErrorAriaDescribedBy = (
  fieldName: string,
  hasError: boolean,
  additionalDescribedBy?: string
): string => {
  const errorId = hasError ? getFormErrorId(fieldName) : '';
  return [errorId, additionalDescribedBy].filter(Boolean).join(' ');
};