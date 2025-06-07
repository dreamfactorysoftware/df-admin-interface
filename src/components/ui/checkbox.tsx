/**
 * Checkbox Component
 * 
 * Reusable checkbox component for the DreamFactory Admin Interface.
 * Built with Headless UI and Tailwind CSS for optimal performance
 * and accessibility.
 * 
 * Features:
 * - WCAG 2.1 AA compliant
 * - Keyboard navigation support
 * - Multiple variants and sizes
 * - React Hook Form integration
 * - TypeScript type safety
 */

import React from 'react';
import { Checkbox as HeadlessCheckbox } from '@headlessui/react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

// ============================================================================
// CHECKBOX VARIANTS
// ============================================================================

const checkboxVariants = cva(
  'group relative inline-flex items-center',
  {
    variants: {
      variant: {
        default: '',
        card: 'rounded-md border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-700 dark:bg-gray-800',
      },
      size: {
        sm: 'text-sm',
        default: 'text-base',
        lg: 'text-lg',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  }
);

const checkboxInputVariants = cva(
  'h-4 w-4 rounded border-gray-300 text-primary-600 transition-colors focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50',
  {
    variants: {
      size: {
        sm: 'h-3 w-3',
        default: 'h-4 w-4',
        lg: 'h-5 w-5',
      },
      variant: {
        default: 'border-gray-300 text-primary-600 focus:ring-primary-500 dark:border-gray-600 dark:bg-gray-800 dark:checked:bg-primary-600',
        error: 'border-red-500 text-red-600 focus:ring-red-500 dark:border-red-400 dark:checked:bg-red-600',
        success: 'border-green-500 text-green-600 focus:ring-green-500 dark:border-green-400 dark:checked:bg-green-600',
      }
    },
    defaultVariants: {
      size: 'default',
      variant: 'default',
    },
  }
);

// ============================================================================
// CHECKBOX COMPONENT
// ============================================================================

export interface CheckboxProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'size'>, VariantProps<typeof checkboxVariants> {
  label?: string;
  description?: string;
  error?: string;
  labelClassName?: string;
  descriptionClassName?: string;
  inputSize?: VariantProps<typeof checkboxInputVariants>['size'];
  inputVariant?: VariantProps<typeof checkboxInputVariants>['variant'];
}

const Checkbox = React.forwardRef<HTMLInputElement, CheckboxProps>(
  ({
    className,
    variant,
    size,
    inputSize,
    inputVariant,
    label,
    description,
    error,
    labelClassName,
    descriptionClassName,
    disabled,
    ...props
  }, ref) => {
    const isError = Boolean(error);
    const finalInputVariant = isError ? 'error' : inputVariant;

    const checkboxComponent = (
      <HeadlessCheckbox
        as="input"
        type="checkbox"
        ref={ref}
        className={cn(
          checkboxInputVariants({ 
            size: inputSize || size, 
            variant: finalInputVariant 
          })
        )}
        disabled={disabled}
        {...props}
      />
    );

    if (!label && !description) {
      return checkboxComponent;
    }

    return (
      <div className={cn(checkboxVariants({ variant, size }), className)}>
        <div className="flex items-start">
          <div className="flex h-5 items-center">
            {checkboxComponent}
          </div>
          {(label || description) && (
            <div className="ml-3 text-sm">
              {label && (
                <label 
                  htmlFor={props.id}
                  className={cn(
                    'font-medium text-gray-900 dark:text-gray-100',
                    disabled && 'opacity-50 cursor-not-allowed',
                    labelClassName
                  )}
                >
                  {label}
                </label>
              )}
              {description && (
                <p 
                  className={cn(
                    'text-gray-500 dark:text-gray-400',
                    disabled && 'opacity-50',
                    descriptionClassName
                  )}
                >
                  {description}
                </p>
              )}
              {error && (
                <p className="mt-1 text-sm text-red-600 dark:text-red-400" role="alert">
                  {error}
                </p>
              )}
            </div>
          )}
        </div>
      </div>
    );
  }
);
Checkbox.displayName = 'Checkbox';

// ============================================================================
// CHECKBOX GROUP COMPONENT
// ============================================================================

export interface CheckboxGroupProps extends React.HTMLAttributes<HTMLFieldSetElement> {
  children: React.ReactNode;
  label?: string;
  description?: string;
  error?: string;
  required?: boolean;
}

const CheckboxGroup = React.forwardRef<HTMLFieldSetElement, CheckboxGroupProps>(
  ({ className, children, label, description, error, required, ...props }, ref) => {
    return (
      <fieldset ref={ref} className={cn('space-y-3', className)} {...props}>
        {label && (
          <legend className={cn(
            'text-sm font-medium text-gray-900 dark:text-gray-100',
            required && "after:content-['*'] after:ml-0.5 after:text-red-500"
          )}>
            {label}
          </legend>
        )}
        {description && (
          <p className="text-sm text-gray-600 dark:text-gray-400">
            {description}
          </p>
        )}
        <div className="space-y-2">
          {children}
        </div>
        {error && (
          <p className="text-sm text-red-600 dark:text-red-400" role="alert">
            {error}
          </p>
        )}
      </fieldset>
    );
  }
);
CheckboxGroup.displayName = 'CheckboxGroup';

// ============================================================================
// EXPORTS
// ============================================================================

export { 
  Checkbox, 
  CheckboxGroup,
  checkboxVariants,
  checkboxInputVariants
};
export type { CheckboxProps, CheckboxGroupProps };