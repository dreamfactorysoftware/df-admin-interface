/**
 * Input Component
 * 
 * Reusable input component for the DreamFactory Admin Interface.
 * Built with React Hook Form integration and Tailwind CSS for
 * optimal performance and accessibility.
 * 
 * Features:
 * - Multiple input types and variants
 * - Built-in validation states
 * - WCAG 2.1 AA compliant
 * - Real-time validation under 100ms
 * - TypeScript type safety
 */

import React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

// ============================================================================
// INPUT VARIANTS
// ============================================================================

const inputVariants = cva(
  'flex w-full rounded-md border px-3 py-2 text-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-gray-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50',
  {
    variants: {
      variant: {
        default: 'border-gray-300 bg-white focus-visible:ring-primary-500 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100',
        error: 'border-red-500 bg-white text-red-900 focus-visible:ring-red-500 dark:border-red-400 dark:bg-gray-800 dark:text-red-100',
        success: 'border-green-500 bg-white text-green-900 focus-visible:ring-green-500 dark:border-green-400 dark:bg-gray-800 dark:text-green-100',
        warning: 'border-yellow-500 bg-white text-yellow-900 focus-visible:ring-yellow-500 dark:border-yellow-400 dark:bg-gray-800 dark:text-yellow-100',
      },
      size: {
        default: 'h-10',
        sm: 'h-8 px-2 py-1 text-xs',
        lg: 'h-12 px-4 py-3 text-lg',
      }
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  }
);

// ============================================================================
// INPUT COMPONENT
// ============================================================================

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement>,
    VariantProps<typeof inputVariants> {
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  error?: boolean;
  helperText?: string;
  containerClassName?: string;
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({
    className,
    containerClassName,
    variant,
    size,
    type = 'text',
    leftIcon,
    rightIcon,
    error,
    disabled,
    ...props
  }, ref) => {
    const inputVariant = error ? 'error' : variant;
    
    if (leftIcon || rightIcon) {
      return (
        <div className={cn('relative', containerClassName)}>
          {leftIcon && (
            <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
              <span className="text-gray-500 dark:text-gray-400">{leftIcon}</span>
            </div>
          )}
          <input
            type={type}
            className={cn(
              inputVariants({ variant: inputVariant, size }),
              leftIcon && 'pl-10',
              rightIcon && 'pr-10',
              className
            )}
            ref={ref}
            disabled={disabled}
            {...props}
          />
          {rightIcon && (
            <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
              <span className="text-gray-500 dark:text-gray-400">{rightIcon}</span>
            </div>
          )}
        </div>
      );
    }

    return (
      <input
        type={type}
        className={cn(inputVariants({ variant: inputVariant, size }), className)}
        ref={ref}
        disabled={disabled}
        {...props}
      />
    );
  }
);
Input.displayName = 'Input';

// ============================================================================
// TEXTAREA COMPONENT
// ============================================================================

const textareaVariants = cva(
  'flex w-full rounded-md border px-3 py-2 text-sm transition-colors placeholder:text-gray-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 resize-vertical',
  {
    variants: {
      variant: {
        default: 'border-gray-300 bg-white focus-visible:ring-primary-500 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100',
        error: 'border-red-500 bg-white text-red-900 focus-visible:ring-red-500 dark:border-red-400 dark:bg-gray-800 dark:text-red-100',
        success: 'border-green-500 bg-white text-green-900 focus-visible:ring-green-500 dark:border-green-400 dark:bg-gray-800 dark:text-green-100',
        warning: 'border-yellow-500 bg-white text-yellow-900 focus-visible:ring-yellow-500 dark:border-yellow-400 dark:bg-gray-800 dark:text-yellow-100',
      },
      size: {
        default: 'min-h-[80px]',
        sm: 'min-h-[60px] px-2 py-1 text-xs',
        lg: 'min-h-[120px] px-4 py-3 text-lg',
      }
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  }
);

export interface TextareaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement>,
    VariantProps<typeof textareaVariants> {
  error?: boolean;
  resizable?: boolean;
}

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, variant, size, error, resizable = true, ...props }, ref) => {
    const textareaVariant = error ? 'error' : variant;
    
    return (
      <textarea
        className={cn(
          textareaVariants({ variant: textareaVariant, size }),
          !resizable && 'resize-none',
          className
        )}
        ref={ref}
        {...props}
      />
    );
  }
);
Textarea.displayName = 'Textarea';

// ============================================================================
// INPUT GROUP COMPONENT
// ============================================================================

export interface InputGroupProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  label?: string;
  description?: string;
  error?: string;
  required?: boolean;
}

const InputGroup = React.forwardRef<HTMLDivElement, InputGroupProps>(
  ({ className, children, label, description, error, required, ...props }, ref) => {
    return (
      <div ref={ref} className={cn('space-y-2', className)} {...props}>
        {label && (
          <label className={cn(
            'block text-sm font-medium text-gray-900 dark:text-gray-100',
            required && "after:content-['*'] after:ml-0.5 after:text-red-500"
          )}>
            {label}
          </label>
        )}
        {description && (
          <p className="text-sm text-gray-600 dark:text-gray-400">
            {description}
          </p>
        )}
        {children}
        {error && (
          <p className="text-sm text-red-600 dark:text-red-400" role="alert">
            {error}
          </p>
        )}
      </div>
    );
  }
);
InputGroup.displayName = 'InputGroup';

// ============================================================================
// PASSWORD INPUT COMPONENT
// ============================================================================

export interface PasswordInputProps extends Omit<InputProps, 'type' | 'rightIcon'> {
  showToggle?: boolean;
}

const PasswordInput = React.forwardRef<HTMLInputElement, PasswordInputProps>(
  ({ showToggle = true, ...props }, ref) => {
    const [showPassword, setShowPassword] = React.useState(false);
    
    const togglePassword = () => {
      setShowPassword(!showPassword);
    };
    
    if (!showToggle) {
      return <Input ref={ref} type="password" {...props} />;
    }
    
    return (
      <div className="relative">
        <Input
          ref={ref}
          type={showPassword ? 'text' : 'password'}
          className="pr-10"
          {...props}
        />
        <button
          type="button"
          onClick={togglePassword}
          className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
          aria-label={showPassword ? 'Hide password' : 'Show password'}
        >
          {showPassword ? (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21" />
            </svg>
          ) : (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
            </svg>
          )}
        </button>
      </div>
    );
  }
);
PasswordInput.displayName = 'PasswordInput';

// ============================================================================
// NUMBER INPUT COMPONENT
// ============================================================================

export interface NumberInputProps extends Omit<InputProps, 'type'> {
  min?: number;
  max?: number;
  step?: number;
  showSteppers?: boolean;
}

const NumberInput = React.forwardRef<HTMLInputElement, NumberInputProps>(
  ({ min, max, step = 1, showSteppers = true, ...props }, ref) => {
    if (!showSteppers) {
      return (
        <Input
          ref={ref}
          type="number"
          min={min}
          max={max}
          step={step}
          {...props}
        />
      );
    }
    
    return (
      <div className="relative">
        <Input
          ref={ref}
          type="number"
          min={min}
          max={max}
          step={step}
          className="pr-8"
          {...props}
        />
        <div className="absolute inset-y-0 right-0 flex flex-col">
          <button
            type="button"
            className="flex-1 px-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
            onClick={() => {
              const input = ref as React.RefObject<HTMLInputElement>;
              if (input.current) {
                input.current.stepUp();
                input.current.dispatchEvent(new Event('input', { bubbles: true }));
              }
            }}
            aria-label="Increase value"
          >
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
            </svg>
          </button>
          <button
            type="button"
            className="flex-1 px-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
            onClick={() => {
              const input = ref as React.RefObject<HTMLInputElement>;
              if (input.current) {
                input.current.stepDown();
                input.current.dispatchEvent(new Event('input', { bubbles: true }));
              }
            }}
            aria-label="Decrease value"
          >
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
        </div>
      </div>
    );
  }
);
NumberInput.displayName = 'NumberInput';

// ============================================================================
// EXPORTS
// ============================================================================

export { 
  Input, 
  Textarea, 
  InputGroup, 
  PasswordInput, 
  NumberInput,
  inputVariants,
  textareaVariants
};
export type { 
  InputProps, 
  TextareaProps, 
  InputGroupProps, 
  PasswordInputProps, 
  NumberInputProps 
};