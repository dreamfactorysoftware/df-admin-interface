/**
 * Form Group Component for DreamFactory Admin Interface
 * 
 * Provides semantic HTML form grouping using fieldset/legend elements for proper
 * accessibility and WCAG 2.1 AA compliance. Supports collapsible groups, responsive
 * layouts, dark theme integration, and React Hook Form validation.
 * 
 * Key Features:
 * - Semantic fieldset/legend structure for screen reader accessibility
 * - WCAG 2.1 AA compliant with proper ARIA attributes and keyboard navigation
 * - Responsive layout patterns with Tailwind CSS grid and flexbox
 * - Integration with React Hook Form for group-level validation and error display
 * - Collapsible groups with expand/collapse functionality and animation
 * - Dark theme support with consistent visual hierarchy
 * - Support for nested form groups and complex form layouts
 * - Keyboard navigation and focus management
 * 
 * @fileoverview Form group component with semantic accessibility
 * @version 1.0.0
 * @since React 19.0.0, Next.js 15.1+, TypeScript 5.8+
 */

'use client';

import React, { 
  forwardRef, 
  useId, 
  useState, 
  useCallback, 
  useRef,
  useEffect,
  KeyboardEvent,
  ComponentType,
  ReactNode,
  HTMLAttributes
} from 'react';
import { ChevronDown, ChevronRight, AlertCircle, Info } from 'lucide-react';
import { useFormContext, FieldErrors, FieldValues } from 'react-hook-form';
import { cn } from '@/lib/utils';
import { useTheme } from '@/hooks/use-theme';
import type {
  FormFieldProps,
  ComponentSize,
  ComponentVariant,
  ResponsiveValue,
  GridConfig
} from '@/components/ui/form/form.types';

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

/**
 * Form group layout configuration with responsive support
 */
export interface FormGroupLayout {
  /** Layout type for organizing form fields */
  type: 'single-column' | 'two-column' | 'three-column' | 'auto-grid' | 'custom-grid' | 'inline' | 'stacked';
  
  /** Number of columns per responsive breakpoint */
  columns?: ResponsiveValue<number>;
  
  /** Gap between form fields */
  gap?: ResponsiveValue<ComponentSize>;
  
  /** Grid configuration for custom layouts */
  grid?: GridConfig;
  
  /** Maximum width of the form group */
  maxWidth?: string;
  
  /** Content alignment within the group */
  alignment?: 'left' | 'center' | 'right';
  
  /** Field label position */
  labelPosition?: 'top' | 'left' | 'inline' | 'floating';
}

/**
 * Form group accessibility configuration
 */
export interface FormGroupAccessibility {
  /** ARIA label for the form group */
  'aria-label'?: string;
  
  /** ARIA labelledby for external labeling */
  'aria-labelledby'?: string;
  
  /** ARIA describedby for additional descriptions */
  'aria-describedby'?: string;
  
  /** Whether the group is expanded (for collapsible groups) */
  'aria-expanded'?: boolean;
  
  /** Custom role override (defaults to 'group') */
  role?: string;
  
  /** Heading level for the legend (for screen readers) */
  headingLevel?: 1 | 2 | 3 | 4 | 5 | 6;
  
  /** Whether to announce group state changes */
  announceChanges?: boolean;
}

/**
 * Form group validation configuration
 */
export interface FormGroupValidation {
  /** Whether to validate all fields in the group */
  validateGroup?: boolean;
  
  /** List of required field names within the group */
  requiredFields?: string[];
  
  /** Custom group validation function */
  customValidator?: (values: FieldValues) => string | null;
  
  /** Whether to show group-level error summary */
  showErrorSummary?: boolean;
  
  /** Position of error display */
  errorPosition?: 'top' | 'bottom' | 'inline';
}

/**
 * Form group animation configuration
 */
export interface FormGroupAnimation {
  /** Animation duration in milliseconds */
  duration?: number;
  
  /** Animation easing function */
  easing?: string;
  
  /** Whether to animate height changes */
  animateHeight?: boolean;
  
  /** Whether to animate opacity changes */
  animateOpacity?: boolean;
  
  /** Custom animation classes */
  customClasses?: {
    enter?: string;
    enterActive?: string;
    exit?: string;
    exitActive?: string;
  };
}

/**
 * Main form group component props
 */
export interface FormGroupProps extends Omit<HTMLAttributes<HTMLFieldSetElement>, 'title'> {
  /** Group title displayed in the legend */
  title: string;
  
  /** Optional description below the title */
  description?: string;
  
  /** Icon component to display next to the title */
  icon?: ComponentType<{ className?: string }>;
  
  /** Visual variant of the form group */
  variant?: ComponentVariant;
  
  /** Size of the form group */
  size?: ComponentSize;
  
  /** Whether the group is collapsible */
  collapsible?: boolean;
  
  /** Default collapsed state for collapsible groups */
  defaultCollapsed?: boolean;
  
  /** Controlled collapsed state */
  collapsed?: boolean;
  
  /** Callback when collapse state changes */
  onCollapseChange?: (collapsed: boolean) => void;
  
  /** Whether the group is disabled */
  disabled?: boolean;
  
  /** Whether the group is required */
  required?: boolean;
  
  /** Whether to show visual grouping (border, background) */
  showGrouping?: boolean;
  
  /** Layout configuration */
  layout?: FormGroupLayout;
  
  /** Accessibility configuration */
  accessibility?: FormGroupAccessibility;
  
  /** Validation configuration */
  validation?: FormGroupValidation;
  
  /** Animation configuration */
  animation?: FormGroupAnimation;
  
  /** Form field names that belong to this group */
  fieldNames?: string[];
  
  /** Children elements (form fields) */
  children: ReactNode;
  
  /** Additional CSS classes */
  className?: string;
  
  /** Test ID for automated testing */
  'data-testid'?: string;
}

/**
 * Form group error summary props
 */
export interface FormGroupErrorSummaryProps {
  /** Errors object from React Hook Form */
  errors: FieldErrors<FieldValues>;
  
  /** Field names to check for errors */
  fieldNames: string[];
  
  /** Position of the error summary */
  position: 'top' | 'bottom' | 'inline';
  
  /** CSS classes */
  className?: string;
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Get responsive grid classes based on layout configuration
 */
const getGridClasses = (layout?: FormGroupLayout): string => {
  if (!layout) return '';
  
  const baseClasses: string[] = [];
  
  // Grid type classes
  switch (layout.type) {
    case 'single-column':
      baseClasses.push('grid', 'grid-cols-1');
      break;
    case 'two-column':
      baseClasses.push('grid', 'grid-cols-1', 'md:grid-cols-2');
      break;
    case 'three-column':
      baseClasses.push('grid', 'grid-cols-1', 'md:grid-cols-2', 'lg:grid-cols-3');
      break;
    case 'auto-grid':
      baseClasses.push('grid', 'grid-cols-1', 'sm:grid-cols-2', 'lg:grid-cols-3', 'xl:grid-cols-4');
      break;
    case 'inline':
      baseClasses.push('flex', 'flex-wrap');
      break;
    case 'stacked':
      baseClasses.push('space-y-4');
      break;
    case 'custom-grid':
      if (layout.grid) {
        baseClasses.push('grid');
        // Add custom grid configuration classes if needed
      }
      break;
  }
  
  // Gap classes
  if (layout.gap) {
    const gapClass = typeof layout.gap === 'string' 
      ? `gap-${layout.gap}` 
      : 'gap-4'; // Default gap
    baseClasses.push(gapClass);
  }
  
  // Alignment classes
  if (layout.alignment) {
    switch (layout.alignment) {
      case 'center':
        baseClasses.push('justify-center');
        break;
      case 'right':
        baseClasses.push('justify-end');
        break;
      default:
        baseClasses.push('justify-start');
    }
  }
  
  return baseClasses.join(' ');
};

/**
 * Get size-based classes for the form group
 */
const getSizeClasses = (size: ComponentSize): string => {
  switch (size) {
    case 'sm':
      return 'text-sm p-3';
    case 'lg':
      return 'text-lg p-6';
    case 'xl':
      return 'text-xl p-8';
    default:
      return 'text-base p-4';
  }
};

/**
 * Get variant-based classes for the form group
 */
const getVariantClasses = (variant: ComponentVariant, showGrouping: boolean): string => {
  if (!showGrouping) return '';
  
  const baseClasses = ['border', 'rounded-lg'];
  
  switch (variant) {
    case 'primary':
      return cn(baseClasses, 'border-primary-200 dark:border-primary-800 bg-primary-50/50 dark:bg-primary-900/10');
    case 'secondary':
      return cn(baseClasses, 'border-gray-200 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-800/10');
    case 'success':
      return cn(baseClasses, 'border-green-200 dark:border-green-800 bg-green-50/50 dark:bg-green-900/10');
    case 'warning':
      return cn(baseClasses, 'border-yellow-200 dark:border-yellow-800 bg-yellow-50/50 dark:bg-yellow-900/10');
    case 'error':
      return cn(baseClasses, 'border-red-200 dark:border-red-800 bg-red-50/50 dark:bg-red-900/10');
    default:
      return cn(baseClasses, 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900');
  }
};

/**
 * Extract field errors for the group
 */
const getGroupErrors = (errors: FieldErrors<FieldValues>, fieldNames: string[]): FieldErrors<FieldValues> => {
  const groupErrors: FieldErrors<FieldValues> = {};
  
  fieldNames.forEach(fieldName => {
    if (errors[fieldName]) {
      groupErrors[fieldName] = errors[fieldName];
    }
  });
  
  return groupErrors;
};

/**
 * Check if any fields in the group have errors
 */
const hasGroupErrors = (errors: FieldErrors<FieldValues>, fieldNames: string[]): boolean => {
  return fieldNames.some(fieldName => errors[fieldName]);
};

// ============================================================================
// FORM GROUP ERROR SUMMARY COMPONENT
// ============================================================================

/**
 * Error summary component for displaying group-level validation errors
 */
const FormGroupErrorSummary = forwardRef<HTMLDivElement, FormGroupErrorSummaryProps>(
  ({ errors, fieldNames, position, className }, ref) => {
    const summaryId = useId();
    const groupErrors = getGroupErrors(errors, fieldNames);
    const errorEntries = Object.entries(groupErrors);
    
    if (errorEntries.length === 0) {
      return null;
    }
    
    return (
      <div
        ref={ref}
        id={summaryId}
        role="alert"
        aria-live="polite"
        className={cn(
          'rounded-md border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20 p-3',
          position === 'top' && 'mb-4',
          position === 'bottom' && 'mt-4',
          className
        )}
        data-testid="form-group-error-summary"
      >
        <div className="flex items-start space-x-2">
          <AlertCircle className="h-4 w-4 text-red-500 mt-0.5 flex-shrink-0" aria-hidden="true" />
          <div className="flex-1">
            <h4 className="text-sm font-medium text-red-800 dark:text-red-200 mb-1">
              {errorEntries.length === 1 ? 'Field Error' : `${errorEntries.length} Field Errors`}
            </h4>
            <ul className="text-sm text-red-700 dark:text-red-300 space-y-1">
              {errorEntries.map(([fieldName, error]) => (
                <li key={fieldName} className="flex items-start space-x-1">
                  <span className="font-medium">{fieldName}:</span>
                  <span>{error?.message || 'Invalid value'}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    );
  }
);

FormGroupErrorSummary.displayName = 'FormGroupErrorSummary';

// ============================================================================
// MAIN FORM GROUP COMPONENT
// ============================================================================

/**
 * Form group component providing semantic grouping for related form fields
 * 
 * @example
 * ```tsx
 * <FormGroup
 *   title="Database Connection"
 *   description="Configure your database connection settings"
 *   icon={Database}
 *   collapsible
 *   validation={{
 *     requiredFields: ['host', 'database', 'username'],
 *     showErrorSummary: true
 *   }}
 *   layout={{
 *     type: 'two-column',
 *     gap: 'md'
 *   }}
 * >
 *   <FormField name="host" label="Host" />
 *   <FormField name="database" label="Database" />
 *   <FormField name="username" label="Username" />
 *   <FormField name="password" label="Password" type="password" />
 * </FormGroup>
 * ```
 */
export const FormGroup = forwardRef<HTMLFieldSetElement, FormGroupProps>(
  ({
    title,
    description,
    icon: Icon,
    variant = 'default',
    size = 'md',
    collapsible = false,
    defaultCollapsed = false,
    collapsed: controlledCollapsed,
    onCollapseChange,
    disabled = false,
    required = false,
    showGrouping = true,
    layout,
    accessibility = {},
    validation = {},
    animation = {},
    fieldNames = [],
    children,
    className,
    'data-testid': testId,
    ...props
  }, ref) => {
    // ========================================================================
    // HOOKS AND STATE
    // ========================================================================
    
    const { resolvedTheme } = useTheme();
    const formContext = useFormContext();
    const { formState } = formContext || {};
    const { errors = {} } = formState || {};
    
    // Generate stable IDs for accessibility
    const fieldsetId = useId();
    const legendId = useId();
    const descriptionId = useId();
    const errorSummaryId = useId();
    
    // Collapse state management
    const [internalCollapsed, setInternalCollapsed] = useState(defaultCollapsed);
    const isCollapsed = controlledCollapsed !== undefined ? controlledCollapsed : internalCollapsed;
    
    // Animation state
    const contentRef = useRef<HTMLDivElement>(null);
    const [isAnimating, setIsAnimating] = useState(false);
    
    // ========================================================================
    // VALIDATION AND ERROR HANDLING
    // ========================================================================
    
    const groupHasErrors = hasGroupErrors(errors, fieldNames);
    const groupErrors = getGroupErrors(errors, fieldNames);
    
    // Run custom group validation if provided
    const customValidationError = validation.customValidator && formContext 
      ? validation.customValidator(formContext.getValues()) 
      : null;
    
    // ========================================================================
    // COLLAPSE FUNCTIONALITY
    // ========================================================================
    
    const handleCollapseToggle = useCallback(() => {
      if (disabled) return;
      
      const newCollapsed = !isCollapsed;
      
      if (controlledCollapsed === undefined) {
        setInternalCollapsed(newCollapsed);
      }
      
      onCollapseChange?.(newCollapsed);
      
      // Announce state change for screen readers
      if (accessibility.announceChanges) {
        const announcement = newCollapsed ? `${title} group collapsed` : `${title} group expanded`;
        // Create a temporary live region for the announcement
        const liveRegion = document.createElement('div');
        liveRegion.setAttribute('aria-live', 'polite');
        liveRegion.setAttribute('aria-atomic', 'true');
        liveRegion.className = 'sr-only';
        liveRegion.textContent = announcement;
        document.body.appendChild(liveRegion);
        setTimeout(() => document.body.removeChild(liveRegion), 1000);
      }
    }, [isCollapsed, controlledCollapsed, onCollapseChange, disabled, title, accessibility.announceChanges]);
    
    // Handle keyboard navigation for collapse toggle
    const handleKeyDown = useCallback((event: KeyboardEvent<HTMLLegendElement>) => {
      if (!collapsible || disabled) return;
      
      switch (event.key) {
        case 'Enter':
        case ' ':
          event.preventDefault();
          handleCollapseToggle();
          break;
        case 'Escape':
          if (!isCollapsed) {
            event.preventDefault();
            handleCollapseToggle();
          }
          break;
      }
    }, [collapsible, disabled, handleCollapseToggle, isCollapsed]);
    
    // ========================================================================
    // ANIMATION EFFECTS
    // ========================================================================
    
    useEffect(() => {
      if (!collapsible || !contentRef.current || !animation.animateHeight) return;
      
      const content = contentRef.current;
      setIsAnimating(true);
      
      if (isCollapsed) {
        // Collapsing animation
        content.style.height = content.scrollHeight + 'px';
        content.offsetHeight; // Force reflow
        content.style.height = '0px';
      } else {
        // Expanding animation
        content.style.height = '0px';
        content.offsetHeight; // Force reflow
        content.style.height = content.scrollHeight + 'px';
      }
      
      const timer = setTimeout(() => {
        content.style.height = '';
        setIsAnimating(false);
      }, animation.duration || 300);
      
      return () => clearTimeout(timer);
    }, [isCollapsed, collapsible, animation.animateHeight, animation.duration]);
    
    // ========================================================================
    // ACCESSIBILITY ATTRIBUTES
    // ========================================================================
    
    const accessibilityProps = {
      'aria-label': accessibility['aria-label'],
      'aria-labelledby': accessibility['aria-labelledby'] || legendId,
      'aria-describedby': [
        description ? descriptionId : null,
        validation.showErrorSummary && groupHasErrors ? errorSummaryId : null,
        accessibility['aria-describedby']
      ].filter(Boolean).join(' ') || undefined,
      'aria-expanded': collapsible ? !isCollapsed : undefined,
      'aria-disabled': disabled || undefined,
      'aria-required': required || undefined,
      'role': accessibility.role || 'group'
    };
    
    // ========================================================================
    // CSS CLASSES
    // ========================================================================
    
    const fieldsetClasses = cn(
      'relative',
      getSizeClasses(size),
      getVariantClasses(variant, showGrouping),
      disabled && 'opacity-50 cursor-not-allowed',
      groupHasErrors && showGrouping && 'border-red-300 dark:border-red-700',
      className
    );
    
    const legendClasses = cn(
      'flex items-center space-x-2 font-medium text-gray-900 dark:text-gray-100',
      collapsible && 'cursor-pointer hover:text-primary-600 dark:hover:text-primary-400',
      disabled && 'cursor-not-allowed',
      size === 'sm' && 'text-sm',
      size === 'lg' && 'text-lg',
      size === 'xl' && 'text-xl'
    );
    
    const contentClasses = cn(
      'transition-all ease-in-out',
      animation.duration ? `duration-${animation.duration}` : 'duration-300',
      isCollapsed && collapsible && 'overflow-hidden',
      isAnimating && 'overflow-hidden',
      layout && getGridClasses(layout)
    );
    
    // ========================================================================
    // RENDER
    // ========================================================================
    
    return (
      <fieldset
        ref={ref}
        id={fieldsetId}
        className={fieldsetClasses}
        disabled={disabled}
        data-testid={testId || 'form-group'}
        {...accessibilityProps}
        {...props}
      >
        {/* Legend with collapsible toggle */}
        <legend
          id={legendId}
          className={legendClasses}
          tabIndex={collapsible && !disabled ? 0 : undefined}
          onKeyDown={handleKeyDown}
          onClick={collapsible && !disabled ? handleCollapseToggle : undefined}
          aria-label={collapsible 
            ? `${title} ${isCollapsed ? '(collapsed)' : '(expanded)'}, click to ${isCollapsed ? 'expand' : 'collapse'}`
            : title
          }
        >
          {/* Collapse indicator */}
          {collapsible && (
            <button
              type="button"
              className={cn(
                'p-1 rounded-sm hover:bg-gray-100 dark:hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-primary-500',
                disabled && 'cursor-not-allowed opacity-50'
              )}
              aria-hidden="true"
              tabIndex={-1}
              disabled={disabled}
            >
              {isCollapsed ? (
                <ChevronRight className="h-4 w-4" />
              ) : (
                <ChevronDown className="h-4 w-4" />
              )}
            </button>
          )}
          
          {/* Icon */}
          {Icon && (
            <Icon className={cn(
              'h-5 w-5',
              groupHasErrors ? 'text-red-500' : 'text-gray-500 dark:text-gray-400'
            )} />
          )}
          
          {/* Title */}
          <span className="flex-1">{title}</span>
          
          {/* Required indicator */}
          {required && (
            <span className="text-red-500 ml-1" aria-label="required">*</span>
          )}
          
          {/* Error indicator */}
          {groupHasErrors && (
            <AlertCircle className="h-4 w-4 text-red-500" aria-hidden="true" />
          )}
        </legend>
        
        {/* Description */}
        {description && (
          <div
            id={descriptionId}
            className={cn(
              'text-sm text-gray-600 dark:text-gray-400 mt-1 mb-4',
              isCollapsed && collapsible && 'hidden'
            )}
          >
            {description}
          </div>
        )}
        
        {/* Error summary */}
        {validation.showErrorSummary && groupHasErrors && validation.errorPosition === 'top' && (
          <FormGroupErrorSummary
            errors={errors}
            fieldNames={fieldNames}
            position="top"
            className={isCollapsed && collapsible ? 'hidden' : undefined}
          />
        )}
        
        {/* Custom validation error */}
        {customValidationError && (
          <div
            role="alert"
            className={cn(
              'flex items-center space-x-2 text-sm text-red-600 dark:text-red-400 mb-4 p-2 bg-red-50 dark:bg-red-900/20 rounded border border-red-200 dark:border-red-800',
              isCollapsed && collapsible && 'hidden'
            )}
          >
            <AlertCircle className="h-4 w-4 flex-shrink-0" />
            <span>{customValidationError}</span>
          </div>
        )}
        
        {/* Form group content */}
        <div
          ref={contentRef}
          className={cn(
            contentClasses,
            isCollapsed && collapsible && !isAnimating && 'hidden'
          )}
          style={{
            ...(animation.animateHeight && isAnimating ? { overflow: 'hidden' } : {}),
            ...(layout?.maxWidth ? { maxWidth: layout.maxWidth } : {})
          }}
        >
          {children}
        </div>
        
        {/* Bottom error summary */}
        {validation.showErrorSummary && groupHasErrors && validation.errorPosition === 'bottom' && (
          <FormGroupErrorSummary
            errors={errors}
            fieldNames={fieldNames}
            position="bottom"
            className={isCollapsed && collapsible ? 'hidden' : undefined}
          />
        )}
      </fieldset>
    );
  }
);

FormGroup.displayName = 'FormGroup';

// ============================================================================
// EXPORTS
// ============================================================================

export type {
  FormGroupProps,
  FormGroupLayout,
  FormGroupAccessibility,
  FormGroupValidation,
  FormGroupAnimation,
  FormGroupErrorSummaryProps
};

export default FormGroup;