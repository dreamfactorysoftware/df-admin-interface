/**
 * Select Component
 * 
 * Reusable select component for the DreamFactory Admin Interface.
 * Built with Headless UI and Tailwind CSS for optimal performance
 * and accessibility.
 * 
 * Features:
 * - Accessible dropdown with keyboard navigation
 * - Multiple selection support
 * - Searchable options
 * - WCAG 2.1 AA compliant
 * - TypeScript type safety
 */

import React, { Fragment } from 'react';
import { Listbox, Transition } from '@headlessui/react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

// ============================================================================
// SELECT VARIANTS
// ============================================================================

const selectVariants = cva(
  'relative w-full cursor-default rounded-md border py-2 pl-3 pr-10 text-left transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50',
  {
    variants: {
      variant: {
        default: 'border-gray-300 bg-white text-gray-900 focus-visible:ring-primary-500 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100',
        error: 'border-red-500 bg-white text-red-900 focus-visible:ring-red-500 dark:border-red-400 dark:bg-gray-800 dark:text-red-100',
        success: 'border-green-500 bg-white text-green-900 focus-visible:ring-green-500 dark:border-green-400 dark:bg-gray-800 dark:text-green-100',
        warning: 'border-yellow-500 bg-white text-yellow-900 focus-visible:ring-yellow-500 dark:border-yellow-400 dark:bg-gray-800 dark:text-yellow-100',
      },
      size: {
        default: 'h-10 text-sm',
        sm: 'h-8 text-xs',
        lg: 'h-12 text-lg',
      }
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  }
);

const optionVariants = cva(
  'relative cursor-default select-none py-2 pl-3 pr-9 transition-colors',
  {
    variants: {
      active: {
        true: 'bg-primary-100 text-primary-900 dark:bg-primary-800 dark:text-primary-100',
        false: 'text-gray-900 dark:text-gray-100',
      },
      selected: {
        true: 'bg-primary-50 font-medium dark:bg-primary-900',
        false: '',
      },
      disabled: {
        true: 'cursor-not-allowed opacity-50',
        false: 'hover:bg-gray-100 dark:hover:bg-gray-700',
      }
    },
    defaultVariants: {
      active: false,
      selected: false,
      disabled: false,
    },
  }
);

// ============================================================================
// TYPES
// ============================================================================

export interface SelectOption {
  value: string | number;
  label: string;
  disabled?: boolean;
  description?: string;
  icon?: React.ReactNode;
  [key: string]: any;
}

export interface SelectProps extends VariantProps<typeof selectVariants> {
  value?: string | number | (string | number)[];
  onChange: (value: string | number | (string | number)[]) => void;
  options: SelectOption[];
  placeholder?: string;
  multiple?: boolean;
  searchable?: boolean;
  disabled?: boolean;
  error?: boolean;
  className?: string;
  optionsClassName?: string;
  name?: string;
  id?: string;
  'aria-label'?: string;
  'aria-describedby'?: string;
}

// ============================================================================
// SELECT COMPONENT
// ============================================================================

const Select = React.forwardRef<HTMLButtonElement, SelectProps>(
  ({
    value,
    onChange,
    options,
    placeholder = 'Select an option...',
    multiple = false,
    searchable = false,
    disabled = false,
    error = false,
    variant,
    size,
    className,
    optionsClassName,
    name,
    id,
    ...props
  }, ref) => {
    const [searchQuery, setSearchQuery] = React.useState('');
    
    const selectVariant = error ? 'error' : variant;
    
    // Filter options based on search query
    const filteredOptions = React.useMemo(() => {
      if (!searchable || !searchQuery) return options;
      
      return options.filter(option =>
        option.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
        option.description?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }, [options, searchQuery, searchable]);
    
    // Get selected option(s) for display
    const selectedOptions = React.useMemo(() => {
      if (multiple) {
        const values = Array.isArray(value) ? value : [];
        return options.filter(option => values.includes(option.value));
      } else {
        return options.find(option => option.value === value);
      }
    }, [value, options, multiple]);
    
    // Handle value change
    const handleChange = (newValue: string | number | (string | number)[]) => {
      onChange(newValue);
    };
    
    // Render display value
    const renderDisplayValue = () => {
      if (multiple) {
        const selected = selectedOptions as SelectOption[];
        if (selected.length === 0) return placeholder;
        if (selected.length === 1) return selected[0].label;
        return `${selected.length} items selected`;
      } else {
        const selected = selectedOptions as SelectOption | undefined;
        return selected ? selected.label : placeholder;
      }
    };
    
    return (
      <Listbox 
        value={value} 
        onChange={handleChange} 
        multiple={multiple}
        disabled={disabled}
        name={name}
      >
        <div className="relative">
          <Listbox.Button
            ref={ref}
            id={id}
            className={cn(selectVariants({ variant: selectVariant, size }), className)}
            {...props}
          >
            <span className={cn(
              'block truncate',
              !value && 'text-gray-500 dark:text-gray-400'
            )}>
              {renderDisplayValue()}
            </span>
            <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2">
              <svg
                className="h-5 w-5 text-gray-400"
                viewBox="0 0 20 20"
                fill="currentColor"
                aria-hidden="true"
              >
                <path
                  fillRule="evenodd"
                  d="M10 3a.75.75 0 01.55.24l3.25 3.5a.75.75 0 11-1.1 1.02L10 4.852 7.3 7.76a.75.75 0 01-1.1-1.02l3.25-3.5A.75.75 0 0110 3zm-3.76 9.2a.75.75 0 011.06.04L10 14.148l2.7-1.908a.75.75 0 111.1 1.02l-3.25 3.5a.75.75 0 01-1.1 0l-3.25-3.5a.75.75 0 01.04-1.06z"
                  clipRule="evenodd"
                />
              </svg>
            </span>
          </Listbox.Button>
          
          <Transition
            as={Fragment}
            leave="transition ease-in duration-100"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <Listbox.Options className={cn(
              'absolute z-10 mt-1 max-h-60 w-full overflow-auto rounded-md bg-white py-1 text-base shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none dark:bg-gray-800 dark:ring-gray-700',
              'sm:text-sm',
              optionsClassName
            )}>
              {searchable && (
                <div className="p-2 border-b border-gray-200 dark:border-gray-700">
                  <input
                    type="text"
                    placeholder="Search options..."
                    className="w-full rounded border border-gray-300 px-2 py-1 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
              )}
              
              {filteredOptions.length === 0 ? (
                <div className="px-3 py-2 text-gray-500 dark:text-gray-400">
                  {searchQuery ? 'No options found' : 'No options available'}
                </div>
              ) : (
                filteredOptions.map((option) => (
                  <Listbox.Option
                    key={option.value}
                    value={option.value}
                    disabled={option.disabled}
                    className={({ active, selected }) =>
                      optionVariants({
                        active,
                        selected,
                        disabled: option.disabled,
                      })
                    }
                  >
                    {({ selected, active }) => (
                      <>
                        <div className="flex items-center">
                          {option.icon && (
                            <span className="mr-2 flex-shrink-0">
                              {option.icon}
                            </span>
                          )}
                          <div className="flex-1">
                            <span className={cn(
                              'block truncate',
                              selected ? 'font-medium' : 'font-normal'
                            )}>
                              {option.label}
                            </span>
                            {option.description && (
                              <span className="block text-xs text-gray-500 dark:text-gray-400">
                                {option.description}
                              </span>
                            )}
                          </div>
                        </div>
                        
                        {selected ? (
                          <span className="absolute inset-y-0 right-0 flex items-center pr-3 text-primary-600 dark:text-primary-400">
                            <svg
                              className="h-5 w-5"
                              viewBox="0 0 20 20"
                              fill="currentColor"
                              aria-hidden="true"
                            >
                              <path
                                fillRule="evenodd"
                                d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z"
                                clipRule="evenodd"
                              />
                            </svg>
                          </span>
                        ) : null}
                      </>
                    )}
                  </Listbox.Option>
                ))
              )}
            </Listbox.Options>
          </Transition>
        </div>
      </Listbox>
    );
  }
);
Select.displayName = 'Select';

// ============================================================================
// SELECT GROUP COMPONENT
// ============================================================================

export interface SelectGroupProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  label?: string;
  description?: string;
  error?: string;
  required?: boolean;
}

const SelectGroup = React.forwardRef<HTMLDivElement, SelectGroupProps>(
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
SelectGroup.displayName = 'SelectGroup';

// ============================================================================
// NATIVE SELECT COMPONENT
// ============================================================================

export interface NativeSelectProps 
  extends React.SelectHTMLAttributes<HTMLSelectElement>,
    VariantProps<typeof selectVariants> {
  options: SelectOption[];
  placeholder?: string;
  error?: boolean;
}

const NativeSelect = React.forwardRef<HTMLSelectElement, NativeSelectProps>(
  ({ className, variant, size, options, placeholder, error, ...props }, ref) => {
    const selectVariant = error ? 'error' : variant;
    
    return (
      <select
        ref={ref}
        className={cn(
          selectVariants({ variant: selectVariant, size }),
          'cursor-pointer',
          className
        )}
        {...props}
      >
        {placeholder && (
          <option value="" disabled>
            {placeholder}
          </option>
        )}
        {options.map((option) => (
          <option
            key={option.value}
            value={option.value}
            disabled={option.disabled}
          >
            {option.label}
          </option>
        ))}
      </select>
    );
  }
);
NativeSelect.displayName = 'NativeSelect';

// ============================================================================
// EXPORTS
// ============================================================================

export { 
  Select, 
  SelectGroup, 
  NativeSelect,
  selectVariants,
  optionVariants
};
export type { 
  SelectProps, 
  SelectGroupProps, 
  NativeSelectProps,
  SelectOption 
};