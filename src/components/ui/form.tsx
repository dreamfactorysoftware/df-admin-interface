/**
 * Form Components
 * 
 * Reusable form components for the DreamFactory Admin Interface.
 * Built with React Hook Form, Headless UI, and Tailwind CSS for
 * optimal performance and accessibility.
 * 
 * Features:
 * - React Hook Form integration
 * - WCAG 2.1 AA compliant
 * - Real-time validation under 100ms
 * - Tailwind CSS styling
 * - TypeScript type safety
 */

import React from 'react';
import { FieldError, FieldErrorsImpl, Merge } from 'react-hook-form';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

// ============================================================================
// FORM ROOT COMPONENT
// ============================================================================

const formVariants = cva(
  'space-y-6',
  {
    variants: {
      variant: {
        default: '',
        card: 'bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6 shadow-sm',
        inline: 'space-y-4',
      },
      size: {
        default: '',
        sm: 'space-y-4',
        lg: 'space-y-8',
      }
    },
    defaultVariants: {
      variant: 'default',
      size: 'default'
    }
  }
);

export interface FormProps extends React.FormHTMLAttributes<HTMLFormElement>, VariantProps<typeof formVariants> {
  children: React.ReactNode;
}

export const Form = React.forwardRef<HTMLFormElement, FormProps>(
  ({ className, variant, size, children, ...props }, ref) => {
    return (
      <form
        ref={ref}
        className={cn(formVariants({ variant, size }), className)}
        {...props}
      >
        {children}
      </form>
    );
  }
);
Form.displayName = 'Form';

// ============================================================================
// FORM FIELD COMPONENTS
// ============================================================================

const formFieldVariants = cva(
  'space-y-2',
  {
    variants: {
      variant: {
        default: '',
        horizontal: 'flex items-center space-y-0 space-x-4',
      }
    },
    defaultVariants: {
      variant: 'default'
    }
  }
);

export interface FormFieldProps extends React.HTMLAttributes<HTMLDivElement>, VariantProps<typeof formFieldVariants> {
  children: React.ReactNode;
}

export const FormField = React.forwardRef<HTMLDivElement, FormFieldProps>(
  ({ className, variant, children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(formFieldVariants({ variant }), className)}
        {...props}
      >
        {children}
      </div>
    );
  }
);
FormField.displayName = 'FormField';

// ============================================================================
// FORM LABEL COMPONENT
// ============================================================================

const formLabelVariants = cva(
  'block text-sm font-medium leading-6',
  {
    variants: {
      variant: {
        default: 'text-gray-900 dark:text-gray-100',
        required: 'text-gray-900 dark:text-gray-100 after:content-["*"] after:ml-0.5 after:text-red-500',
        optional: 'text-gray-700 dark:text-gray-300',
      },
      size: {
        default: 'text-sm',
        sm: 'text-xs',
        lg: 'text-base',
      }
    },
    defaultVariants: {
      variant: 'default',
      size: 'default'
    }
  }
);

export interface FormLabelProps extends React.LabelHTMLAttributes<HTMLLabelElement>, VariantProps<typeof formLabelVariants> {
  children: React.ReactNode;
  required?: boolean;
}

export const FormLabel = React.forwardRef<HTMLLabelElement, FormLabelProps>(
  ({ className, variant, size, children, required, ...props }, ref) => {
    const labelVariant = required ? 'required' : variant;
    
    return (
      <label
        ref={ref}
        className={cn(formLabelVariants({ variant: labelVariant, size }), className)}
        {...props}
      >
        {children}
      </label>
    );
  }
);
FormLabel.displayName = 'FormLabel';

// ============================================================================
// FORM DESCRIPTION COMPONENT
// ============================================================================

const formDescriptionVariants = cva(
  'text-sm text-gray-600 dark:text-gray-400',
  {
    variants: {
      variant: {
        default: '',
        muted: 'text-gray-500 dark:text-gray-500',
      }
    },
    defaultVariants: {
      variant: 'default'
    }
  }
);

export interface FormDescriptionProps extends React.HTMLAttributes<HTMLParagraphElement>, VariantProps<typeof formDescriptionVariants> {
  children: React.ReactNode;
}

export const FormDescription = React.forwardRef<HTMLParagraphElement, FormDescriptionProps>(
  ({ className, variant, children, ...props }, ref) => {
    return (
      <p
        ref={ref}
        className={cn(formDescriptionVariants({ variant }), className)}
        {...props}
      >
        {children}
      </p>
    );
  }
);
FormDescription.displayName = 'FormDescription';

// ============================================================================
// FORM ERROR MESSAGE COMPONENT
// ============================================================================

const formErrorVariants = cva(
  'text-sm font-medium',
  {
    variants: {
      variant: {
        default: 'text-red-600 dark:text-red-400',
        destructive: 'text-red-600 dark:text-red-400',
        warning: 'text-yellow-600 dark:text-yellow-400',
      }
    },
    defaultVariants: {
      variant: 'default'
    }
  }
);

export interface FormErrorMessageProps extends React.HTMLAttributes<HTMLParagraphElement>, VariantProps<typeof formErrorVariants> {
  error?: FieldError | Merge<FieldError, FieldErrorsImpl<any>> | string;
  children?: React.ReactNode;
}

export const FormErrorMessage = React.forwardRef<HTMLParagraphElement, FormErrorMessageProps>(
  ({ className, variant, error, children, ...props }, ref) => {
    const errorMessage = typeof error === 'string' ? error : error?.message;
    
    if (!errorMessage && !children) return null;
    
    return (
      <p
        ref={ref}
        className={cn(formErrorVariants({ variant }), className)}
        role="alert"
        aria-live="polite"
        {...props}
      >
        {children || errorMessage}
      </p>
    );
  }
);
FormErrorMessage.displayName = 'FormErrorMessage';

// ============================================================================
// FORM CONTROL COMPONENT
// ============================================================================

export interface FormControlProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  error?: FieldError | Merge<FieldError, FieldErrorsImpl<any>> | string;
}

export const FormControl = React.forwardRef<HTMLDivElement, FormControlProps>(
  ({ className, children, error, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn('space-y-2', className)}
        {...props}
      >
        {children}
        <FormErrorMessage error={error} />
      </div>
    );
  }
);
FormControl.displayName = 'FormControl';

// ============================================================================
// FORM GROUP COMPONENT
// ============================================================================

export interface FormGroupProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  title?: string;
  description?: string;
}

export const FormGroup = React.forwardRef<HTMLDivElement, FormGroupProps>(
  ({ className, children, title, description, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          'space-y-4 p-4 border border-gray-200 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-800/50',
          className
        )}
        {...props}
      >
        {title && (
          <div className="border-b border-gray-200 dark:border-gray-700 pb-2">
            <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">
              {title}
            </h3>
            {description && (
              <FormDescription className="mt-1">
                {description}
              </FormDescription>
            )}
          </div>
        )}
        <div className="space-y-4">
          {children}
        </div>
      </div>
    );
  }
);
FormGroup.displayName = 'FormGroup';

// ============================================================================
// FORM ACTIONS COMPONENT
// ============================================================================

const formActionsVariants = cva(
  'flex gap-3',
  {
    variants: {
      justify: {
        start: 'justify-start',
        end: 'justify-end',
        center: 'justify-center',
        between: 'justify-between',
      },
      direction: {
        row: 'flex-row',
        'row-reverse': 'flex-row-reverse',
        column: 'flex-col',
      }
    },
    defaultVariants: {
      justify: 'end',
      direction: 'row'
    }
  }
);

export interface FormActionsProps extends React.HTMLAttributes<HTMLDivElement>, VariantProps<typeof formActionsVariants> {
  children: React.ReactNode;
}

export const FormActions = React.forwardRef<HTMLDivElement, FormActionsProps>(
  ({ className, justify, direction, children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          formActionsVariants({ justify, direction }),
          'pt-4 border-t border-gray-200 dark:border-gray-700',
          className
        )}
        {...props}
      >
        {children}
      </div>
    );
  }
);
FormActions.displayName = 'FormActions';

// ============================================================================
// FORM SECTION COMPONENT
// ============================================================================

export interface FormSectionProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  title?: string;
  description?: string;
  collapsible?: boolean;
  defaultExpanded?: boolean;
}

export const FormSection = React.forwardRef<HTMLDivElement, FormSectionProps>(
  ({ className, children, title, description, collapsible = false, defaultExpanded = true, ...props }, ref) => {
    const [isExpanded, setIsExpanded] = React.useState(defaultExpanded);
    
    return (
      <div
        ref={ref}
        className={cn('space-y-4', className)}
        {...props}
      >
        {title && (
          <div className="border-b border-gray-200 dark:border-gray-700 pb-3">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
                  {title}
                </h2>
                {description && (
                  <FormDescription className="mt-1">
                    {description}
                  </FormDescription>
                )}
              </div>
              {collapsible && (
                <button
                  type="button"
                  onClick={() => setIsExpanded(!isExpanded)}
                  className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                  aria-expanded={isExpanded}
                >
                  <svg
                    className={cn('w-5 h-5 transition-transform', {
                      'rotate-180': isExpanded
                    })}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
              )}
            </div>
          </div>
        )}
        {(!collapsible || isExpanded) && (
          <div className="space-y-6">
            {children}
          </div>
        )}
      </div>
    );
  }
);
FormSection.displayName = 'FormSection';

// ============================================================================
// EXPORTS
// ============================================================================

export {
  formVariants,
  formFieldVariants,
  formLabelVariants,
  formDescriptionVariants,
  formErrorVariants,
  formActionsVariants
};