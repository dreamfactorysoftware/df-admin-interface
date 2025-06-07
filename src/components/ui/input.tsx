import * as React from 'react';
import { cn } from '@/lib/utils';

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  /**
   * Whether the input is in an error state
   */
  error?: boolean;
  /**
   * Error message to display
   */
  errorMessage?: string;
  /**
   * Whether to show a loading state
   */
  loading?: boolean;
}

/**
 * Input Component
 * 
 * A styled input component with error states and loading indicators.
 * Built with Tailwind CSS and supports all standard input props.
 * 
 * @param {InputProps} props - Input component props
 * @returns {JSX.Element} Input component
 */
const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type = 'text', error = false, errorMessage, loading = false, ...props }, ref) => {
    return (
      <div className="w-full">
        <input
          type={type}
          className={cn(
            // Base styles
            'flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm',
            'placeholder:text-gray-400',
            'focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent',
            'disabled:cursor-not-allowed disabled:opacity-50',
            // Error state
            error && 'border-red-500 focus:ring-red-500',
            // Loading state
            loading && 'opacity-75',
            // Dark mode support
            'dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100',
            'dark:placeholder:text-gray-500',
            'dark:focus:ring-primary-400',
            // Custom className
            className
          )}
          ref={ref}
          disabled={loading || props.disabled}
          {...props}
        />
        {error && errorMessage && (
          <p className="mt-1 text-sm text-red-600 dark:text-red-400">
            {errorMessage}
          </p>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';

export { Input };