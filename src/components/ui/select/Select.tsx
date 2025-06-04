/**
 * Main React Select Component
 * 
 * Accessible select component built on Headless UI Listbox with comprehensive
 * theme support, form integration, and keyboard navigation. Replaces Angular
 * Material mat-select with enhanced performance and accessibility features.
 * 
 * Features:
 * - Headless UI Listbox foundation for WCAG 2.1 AA compliance
 * - React Hook Form integration with validation
 * - Tailwind CSS styling with theme variants
 * - Keyboard navigation and screen reader support
 * - Custom option rendering with icons and descriptions
 * - Loading and error states
 * - Size variants (sm, md, lg) and visual states
 * 
 * @fileoverview Primary select component for DreamFactory Admin Interface
 * @version 1.0.0
 * @since React 19.0.0 / Next.js 15.1+ / Headless UI 2.0+
 */

import React, { forwardRef, useMemo, useRef } from 'react';
import { Listbox, Transition } from '@headlessui/react';
import { ChevronUpDownIcon, CheckIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { LoaderIcon } from 'lucide-react';
import { cva, type VariantProps } from 'class-variance-authority';

import { cn } from '../../../lib/utils';
import { useSelectOptions, useSelectKeyboard } from './hooks';
import type { 
  SelectProps, 
  SelectOption, 
  SelectLoadingState, 
  SelectErrorState 
} from './types';
import type { 
  SizeVariant, 
  ColorVariant, 
  StateVariant 
} from '../../../types/ui';

/**
 * Component styling variants using class-variance-authority
 * Provides consistent theme integration across all UI states
 */
const selectVariants = cva(
  // Base styles for consistent appearance and accessibility
  [
    "relative w-full cursor-default rounded-lg bg-white text-left shadow-md",
    "focus:outline-none focus-visible:border-indigo-500 focus-visible:ring-2",
    "focus-visible:ring-white focus-visible:ring-opacity-75 focus-visible:ring-offset-2",
    "focus-visible:ring-offset-orange-300 transition-all duration-200",
    "disabled:opacity-50 disabled:cursor-not-allowed"
  ],
  {
    variants: {
      /**
       * Size variants with proper touch targets for accessibility
       * Minimum 44px height for mobile accessibility compliance
       */
      size: {
        sm: "py-2 pl-3 pr-10 text-sm min-h-[36px]",
        md: "py-2.5 pl-3 pr-10 text-base min-h-[44px]", // Default accessible height
        lg: "py-3 pl-4 pr-12 text-lg min-h-[48px]"
      },
      /**
       * Visual variants following design system color tokens
       * All variants maintain WCAG 2.1 AA contrast requirements
       */
      variant: {
        primary: [
          "border-2 border-primary-300 bg-white text-gray-900",
          "hover:border-primary-400 focus:border-primary-500",
          "dark:bg-gray-800 dark:border-primary-600 dark:text-white",
          "dark:hover:border-primary-500 dark:focus:border-primary-400"
        ],
        secondary: [
          "border-2 border-gray-300 bg-white text-gray-900",
          "hover:border-gray-400 focus:border-gray-500",
          "dark:bg-gray-800 dark:border-gray-600 dark:text-white",
          "dark:hover:border-gray-500 dark:focus:border-gray-400"
        ],
        outline: [
          "border-2 border-gray-200 bg-white text-gray-900",
          "hover:border-gray-300 focus:border-primary-500",
          "dark:bg-gray-900 dark:border-gray-700 dark:text-white",
          "dark:hover:border-gray-600 dark:focus:border-primary-400"
        ],
        ghost: [
          "border-2 border-transparent bg-gray-50 text-gray-900",
          "hover:bg-gray-100 focus:bg-white focus:border-primary-500",
          "dark:bg-gray-800 dark:text-white",
          "dark:hover:bg-gray-700 dark:focus:bg-gray-900"
        ],
        success: [
          "border-2 border-success-300 bg-success-50 text-success-900",
          "hover:border-success-400 focus:border-success-500",
          "dark:bg-success-900 dark:border-success-600 dark:text-success-100"
        ],
        warning: [
          "border-2 border-warning-300 bg-warning-50 text-warning-900",
          "hover:border-warning-400 focus:border-warning-500",
          "dark:bg-warning-900 dark:border-warning-600 dark:text-warning-100"
        ],
        error: [
          "border-2 border-error-300 bg-error-50 text-error-900",
          "hover:border-error-400 focus:border-error-500",
          "dark:bg-error-900 dark:border-error-600 dark:text-error-100"
        ]
      },
      /**
       * State variants for different component states
       */
      state: {
        default: "",
        loading: "cursor-wait",
        disabled: "opacity-50 cursor-not-allowed",
        error: "border-error-500 bg-error-50 dark:bg-error-900"
      }
    },
    defaultVariants: {
      size: "md",
      variant: "outline",
      state: "default"
    }
  }
);

/**
 * Options panel styling variants
 */
const optionsPanelVariants = cva(
  [
    "absolute z-50 mt-1 max-h-60 w-full overflow-auto rounded-md bg-white py-1",
    "text-base shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none",
    "dark:bg-gray-800 dark:ring-gray-700"
  ],
  {
    variants: {
      size: {
        sm: "text-sm max-h-48",
        md: "text-base max-h-60",
        lg: "text-lg max-h-72"
      }
    },
    defaultVariants: {
      size: "md"
    }
  }
);

/**
 * Option item styling variants
 */
const optionVariants = cva(
  [
    "relative cursor-default select-none py-2 pl-10 pr-4 transition-colors",
    "focus:outline-none"
  ],
  {
    variants: {
      state: {
        default: [
          "text-gray-900 hover:bg-primary-100 hover:text-primary-900",
          "dark:text-white dark:hover:bg-primary-900 dark:hover:text-primary-100"
        ],
        active: [
          "bg-primary-100 text-primary-900",
          "dark:bg-primary-900 dark:text-primary-100"
        ],
        selected: [
          "bg-primary-600 text-white font-medium",
          "dark:bg-primary-500"
        ],
        disabled: [
          "text-gray-400 cursor-not-allowed",
          "dark:text-gray-600"
        ]
      }
    },
    defaultVariants: {
      state: "default"
    }
  }
);

/**
 * Loading state display component
 */
interface LoadingStateProps {
  loadingState: SelectLoadingState;
  size: SizeVariant;
}

const LoadingState: React.FC<LoadingStateProps> = ({ loadingState, size }) => {
  const iconSize = size === 'sm' ? 'w-4 h-4' : size === 'lg' ? 'w-6 h-6' : 'w-5 h-5';
  
  return (
    <div className="flex items-center space-x-2 px-3 py-2 text-gray-500">
      <LoaderIcon className={cn(iconSize, "animate-spin")} />
      <span className="text-sm">
        {loadingState.message || 'Loading options...'}
      </span>
      {loadingState.progress !== undefined && (
        <div className="flex-1 bg-gray-200 rounded-full h-2 ml-2">
          <div 
            className="bg-primary-600 h-2 rounded-full transition-all duration-300"
            style={{ width: `${loadingState.progress}%` }}
          />
        </div>
      )}
    </div>
  );
};

/**
 * Error state display component
 */
interface ErrorStateProps {
  errorState: SelectErrorState;
  size: SizeVariant;
}

const ErrorState: React.FC<ErrorStateProps> = ({ errorState, size }) => {
  const iconSize = size === 'sm' ? 'w-4 h-4' : size === 'lg' ? 'w-6 h-6' : 'w-5 h-5';
  
  return (
    <div className="px-3 py-2">
      <div className="flex items-center space-x-2 text-error-600 dark:text-error-400">
        <XMarkIcon className={iconSize} />
        <span className="text-sm font-medium">Error</span>
      </div>
      <p className="text-sm text-error-700 dark:text-error-300 mt-1">
        {errorState.message}
      </p>
      {errorState.onRetry && (
        <button
          onClick={errorState.onRetry}
          className={cn(
            "mt-2 px-3 py-1 text-xs font-medium text-error-600 border border-error-600",
            "rounded hover:bg-error-50 dark:text-error-400 dark:border-error-400",
            "dark:hover:bg-error-900 transition-colors"
          )}
        >
          Retry
        </button>
      )}
    </div>
  );
};

/**
 * Option renderer component for flexible option display
 */
interface OptionRendererProps<T> {
  option: SelectOption<T>;
  isSelected: boolean;
  isActive: boolean;
  customRenderer?: (option: SelectOption<T>, isSelected: boolean) => React.ReactNode;
}

function OptionRenderer<T>({ 
  option, 
  isSelected, 
  isActive, 
  customRenderer 
}: OptionRendererProps<T>) {
  // Use custom renderer if provided
  if (customRenderer) {
    return <>{customRenderer(option, isSelected)}</>;
  }

  // Default option rendering with icon and description support
  return (
    <>
      <span className={cn(
        "block truncate",
        isSelected ? "font-medium" : "font-normal"
      )}>
        {option.label}
      </span>
      
      {/* Selection indicator */}
      {isSelected ? (
        <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-current">
          <CheckIcon className="h-5 w-5" aria-hidden="true" />
        </span>
      ) : null}
      
      {/* Option icon */}
      {option.icon && typeof option.icon === 'string' ? (
        <span className="absolute inset-y-0 left-0 flex items-center pl-3">
          <span className="text-gray-400">{option.icon}</span>
        </span>
      ) : option.icon ? (
        <span className="absolute inset-y-0 left-0 flex items-center pl-3">
          {option.icon}
        </span>
      ) : null}
      
      {/* Option description */}
      {option.description && (
        <span className="block text-xs text-gray-500 dark:text-gray-400 truncate mt-1">
          {option.description}
        </span>
      )}
    </>
  );
}

/**
 * Value display component for showing selected values
 */
interface ValueDisplayProps<T> {
  value: T | undefined;
  option: SelectOption<T> | undefined;
  placeholder: string;
  customValueRenderer?: (value: T, option?: SelectOption<T>) => React.ReactNode;
}

function ValueDisplay<T>({ 
  value, 
  option, 
  placeholder, 
  customValueRenderer 
}: ValueDisplayProps<T>) {
  // Show placeholder if no value
  if (value === undefined || value === null) {
    return (
      <span className="block truncate text-gray-500 dark:text-gray-400">
        {placeholder}
      </span>
    );
  }

  // Use custom renderer if provided
  if (customValueRenderer && value !== undefined) {
    return <>{customValueRenderer(value, option)}</>;
  }

  // Default value display
  return (
    <span className="block truncate">
      {option?.label || String(value)}
    </span>
  );
}

/**
 * Main Select Component
 * 
 * Comprehensive select component with accessibility, theming, and form integration.
 * Built on Headless UI Listbox with extensive customization options.
 */
export const Select = forwardRef<
  HTMLButtonElement,
  SelectProps & VariantProps<typeof selectVariants>
>(({
  // Basic props
  options = [],
  value,
  defaultValue,
  onChange,
  placeholder = "Select an option...",
  name,
  required = false,
  disabled = false,
  error,
  helperText,
  
  // Visual variants
  size = "md",
  variant = "outline",
  state = "default",
  
  // Features
  clearable = false,
  searchable = false,
  loadingState,
  errorState,
  
  // Custom renderers
  renderOption,
  renderValue,
  emptyStateContent,
  loadingContent,
  
  // Form integration
  register,
  rules,
  
  // Accessibility
  'aria-label': ariaLabel,
  'aria-describedby': ariaDescribedBy,
  'aria-invalid': ariaInvalid,
  announceSelection,
  
  // Additional props
  className,
  'data-testid': testId,
  
  ...rest
}, ref) => {
  // Normalize options using hook
  const { options: normalizedOptions, getOptionByValue } = useSelectOptions(options);
  
  // Get current selected option
  const selectedOption = value !== undefined ? getOptionByValue(value) : undefined;
  
  // Determine current state
  const currentState = loadingState?.isLoading ? 'loading' : 
                      errorState ? 'error' : 
                      disabled ? 'disabled' : 
                      state;
  
  // Enhanced error state with form validation
  const hasError = !!error || !!errorState || ariaInvalid === true;
  const finalVariant = hasError ? 'error' : variant;
  
  // Keyboard navigation support
  const keyboard = useSelectKeyboard(
    normalizedOptions,
    (selectedValue) => {
      const option = getOptionByValue(selectedValue);
      onChange?.(selectedValue, option);
      
      // Announce selection for screen readers
      if (announceSelection && option) {
        const announcement = announceSelection(option);
        // Create live region for announcement
        const liveRegion = document.createElement('div');
        liveRegion.setAttribute('aria-live', 'polite');
        liveRegion.setAttribute('aria-atomic', 'true');
        liveRegion.className = 'sr-only';
        liveRegion.textContent = announcement;
        document.body.appendChild(liveRegion);
        setTimeout(() => document.body.removeChild(liveRegion), 1000);
      }
    }
  );
  
  // Form registration ref
  const formRef = useRef<HTMLInputElement>(null);
  
  // Register with React Hook Form if provided
  const registration = register ? register(name!, rules) : {};
  
  // Memoized class names for performance
  const selectClasses = useMemo(() => cn(
    selectVariants({ 
      size, 
      variant: finalVariant, 
      state: currentState 
    }),
    className
  ), [size, finalVariant, currentState, className]);
  
  const panelClasses = useMemo(() => cn(
    optionsPanelVariants({ size })
  ), [size]);
  
  // Clear functionality
  const handleClear = (event: React.MouseEvent) => {
    event.stopPropagation();
    onChange?.(undefined, undefined);
    
    // Focus the select button after clearing
    if (ref && 'current' in ref && ref.current) {
      ref.current.focus();
    }
  };
  
  // Generate unique IDs for accessibility
  const selectId = `select-${name || 'unnamed'}`;
  const descriptionId = `${selectId}-description`;
  const errorId = `${selectId}-error`;
  
  // Build aria-describedby value
  const describedBy = [
    ariaDescribedBy,
    helperText ? descriptionId : undefined,
    (error || errorState) ? errorId : undefined
  ].filter(Boolean).join(' ') || undefined;

  return (
    <div className="w-full">
      {/* Hidden input for form submission */}
      <input
        ref={formRef}
        type="hidden"
        name={name}
        value={value || ''}
        {...registration}
        data-testid={`${testId}-hidden-input`}
      />
      
      <Listbox
        value={value}
        onChange={(newValue) => {
          const option = getOptionByValue(newValue);
          onChange?.(newValue, option);
        }}
        disabled={disabled || loadingState?.isLoading}
        name={name}
      >
        <div className="relative">
          {/* Select Button */}
          <Listbox.Button
            ref={ref}
            className={selectClasses}
            aria-label={ariaLabel}
            aria-describedby={describedBy}
            aria-invalid={hasError}
            aria-required={required}
            data-testid={testId}
            onKeyDown={keyboard.handleKeyDown}
            {...rest}
          >
            <div className="flex items-center">
              <div className="flex-1">
                <ValueDisplay
                  value={value}
                  option={selectedOption}
                  placeholder={placeholder}
                  customValueRenderer={renderValue}
                />
              </div>
              
              {/* Clear button */}
              {clearable && value !== undefined && !disabled && !loadingState?.isLoading && (
                <button
                  type="button"
                  onClick={handleClear}
                  className={cn(
                    "ml-2 p-1 rounded-full hover:bg-gray-200 dark:hover:bg-gray-600",
                    "focus:outline-none focus:ring-2 focus:ring-primary-500",
                    "transition-colors"
                  )}
                  aria-label="Clear selection"
                  tabIndex={-1}
                >
                  <XMarkIcon className="w-4 h-4" />
                </button>
              )}
              
              {/* Loading indicator */}
              {loadingState?.isLoading ? (
                <LoaderIcon className="ml-2 w-5 h-5 animate-spin text-gray-400" />
              ) : (
                <ChevronUpDownIcon 
                  className="ml-2 w-5 h-5 text-gray-400" 
                  aria-hidden="true" 
                />
              )}
            </div>
          </Listbox.Button>

          {/* Options Panel */}
          <Transition
            as={React.Fragment}
            leave="transition ease-in duration-100"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <Listbox.Options className={panelClasses}>
              {/* Loading State */}
              {loadingState?.isLoading && (
                <LoadingState loadingState={loadingState} size={size} />
              )}
              
              {/* Error State */}
              {errorState && !loadingState?.isLoading && (
                <ErrorState errorState={errorState} size={size} />
              )}
              
              {/* Empty State */}
              {!loadingState?.isLoading && !errorState && normalizedOptions.length === 0 && (
                <div className="relative cursor-default select-none py-2 px-4 text-gray-700 dark:text-gray-300">
                  {emptyStateContent || "No options available"}
                </div>
              )}
              
              {/* Options */}
              {!loadingState?.isLoading && !errorState && normalizedOptions.map((option, index) => (
                <Listbox.Option
                  key={`${option.value}-${index}`}
                  value={option.value}
                  disabled={option.disabled}
                  className={({ active, selected, disabled: optionDisabled }) =>
                    cn(optionVariants({
                      state: optionDisabled ? 'disabled' :
                             selected ? 'selected' :
                             active ? 'active' : 'default'
                    }))
                  }
                >
                  {({ selected, active }) => (
                    <OptionRenderer
                      option={option}
                      isSelected={selected}
                      isActive={active}
                      customRenderer={renderOption}
                    />
                  )}
                </Listbox.Option>
              ))}
            </Listbox.Options>
          </Transition>
        </div>
      </Listbox>
      
      {/* Helper Text */}
      {helperText && (
        <p 
          id={descriptionId}
          className="mt-1 text-sm text-gray-600 dark:text-gray-400"
        >
          {helperText}
        </p>
      )}
      
      {/* Error Message */}
      {(error || errorState) && (
        <p 
          id={errorId}
          className="mt-1 text-sm text-error-600 dark:text-error-400"
          role="alert"
        >
          {error || errorState?.message}
        </p>
      )}
    </div>
  );
});

Select.displayName = 'Select';

export default Select;

/**
 * Export types for external usage
 */
export type {
  SelectProps,
  SelectOption,
  SelectLoadingState,
  SelectErrorState
} from './types';

/**
 * Export variant types for style customization
 */
export type SelectVariants = VariantProps<typeof selectVariants>;