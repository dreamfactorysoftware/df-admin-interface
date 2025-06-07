/**
 * Select Component - DreamFactory Admin Interface
 * 
 * Production-ready React select component built on Headless UI Listbox with comprehensive
 * Tailwind CSS styling, React Hook Form integration, and WCAG 2.1 AA accessibility compliance.
 * 
 * Replaces Angular Material mat-select with modern React patterns, providing single selection
 * with label support, error states, theme variants, size options, and advanced accessibility
 * features including ARIA labeling, keyboard navigation, and screen reader announcements.
 * 
 * Features:
 * - Headless UI Listbox foundation for accessibility compliance
 * - Tailwind CSS styling with light/dark theme support
 * - React Hook Form integration with forwardRef pattern
 * - Size variants (sm, md, lg) and state variants (error, disabled, loading)
 * - Custom option rendering with icons and descriptions
 * - Comprehensive keyboard navigation (Arrow keys, Enter, Escape)
 * - Focus management with proper focus rings
 * - ARIA labels, descriptions, and live region announcements
 * 
 * @fileoverview Main Select component for form inputs
 * @version 1.0.0
 * @since React 19.0.0 / Next.js 15.1+
 */

'use client';

import { forwardRef, Fragment, useEffect, useId, useMemo } from 'react';
import { Listbox, Transition } from '@headlessui/react';
import { CheckIcon, ChevronUpDownIcon, ExclamationTriangleIcon } from '@heroicons/react/20/solid';
import { useSelect, useSelectOptions, useSelectKeyboard, useSelectValidation } from './hooks';
import { cn } from '../../../lib/utils';
import type { SelectProps, SelectOption, SelectThemeVariants } from './types';
import type { ComponentSize, ComponentVariant, ComponentState } from '../../../types/ui';

// ============================================================================
// STYLING CONFIGURATION
// ============================================================================

/**
 * Select component style variants using class-variance-authority pattern
 * Provides consistent styling with Tailwind CSS and theme support
 */
const selectVariants = {
  base: [
    'relative',
    'w-full',
    'transition-colors',
    'duration-200',
    'focus-within:outline-none',
  ].join(' '),
  
  trigger: {
    base: [
      'relative',
      'w-full',
      'cursor-default',
      'rounded-md',
      'border',
      'bg-white',
      'py-2',
      'pl-3',
      'pr-10',
      'text-left',
      'shadow-sm',
      'focus:outline-none',
      'focus:ring-2',
      'focus:ring-offset-2',
      'transition-all',
      'duration-200',
      'disabled:cursor-not-allowed',
      'disabled:opacity-50',
      'dark:bg-gray-900',
      'dark:border-gray-700',
    ].join(' '),
    
    // Size variants following WCAG 44px minimum touch targets
    size: {
      sm: 'py-1.5 pl-2.5 pr-8 text-sm min-h-[36px]',
      md: 'py-2 pl-3 pr-10 text-sm min-h-[44px]', // WCAG minimum
      lg: 'py-2.5 pl-4 pr-12 text-base min-h-[48px]', // WCAG recommended
    },
    
    // State variants with proper contrast ratios
    state: {
      idle: [
        'border-gray-300',
        'focus:border-blue-500',
        'focus:ring-blue-500',
        'dark:border-gray-600',
        'dark:focus:border-blue-400',
        'dark:focus:ring-blue-400',
      ].join(' '),
      
      error: [
        'border-red-300',
        'focus:border-red-500',
        'focus:ring-red-500',
        'dark:border-red-600',
        'dark:focus:border-red-400',
        'dark:focus:ring-red-400',
      ].join(' '),
      
      success: [
        'border-green-300',
        'focus:border-green-500',
        'focus:ring-green-500',
        'dark:border-green-600',
        'dark:focus:border-green-400',
        'dark:focus:ring-green-400',
      ].join(' '),
      
      disabled: [
        'border-gray-200',
        'bg-gray-50',
        'text-gray-500',
        'dark:border-gray-700',
        'dark:bg-gray-800',
        'dark:text-gray-400',
      ].join(' '),
      
      loading: [
        'border-blue-200',
        'bg-blue-50',
        'dark:border-blue-800',
        'dark:bg-blue-950',
      ].join(' '),
    },
  },
  
  dropdown: {
    base: [
      'absolute',
      'z-50',
      'mt-1',
      'w-full',
      'overflow-auto',
      'rounded-md',
      'bg-white',
      'py-1',
      'text-base',
      'shadow-lg',
      'ring-1',
      'ring-black',
      'ring-opacity-5',
      'focus:outline-none',
      'dark:bg-gray-900',
      'dark:ring-gray-700',
    ].join(' '),
    
    maxHeight: 'max-h-60', // Approximately 10 options visible
  },
  
  option: {
    base: [
      'relative',
      'cursor-default',
      'select-none',
      'py-2',
      'pl-3',
      'pr-9',
      'transition-colors',
      'duration-150',
    ].join(' '),
    
    states: {
      idle: [
        'text-gray-900',
        'hover:bg-blue-50',
        'hover:text-blue-900',
        'dark:text-gray-100',
        'dark:hover:bg-blue-900',
        'dark:hover:text-blue-100',
      ].join(' '),
      
      active: [
        'bg-blue-100',
        'text-blue-900',
        'dark:bg-blue-800',
        'dark:text-blue-100',
      ].join(' '),
      
      selected: [
        'bg-blue-600',
        'text-white',
        'dark:bg-blue-500',
      ].join(' '),
      
      disabled: [
        'text-gray-400',
        'cursor-not-allowed',
        'dark:text-gray-600',
      ].join(' '),
    },
  },
  
  label: {
    base: [
      'block',
      'text-sm',
      'font-medium',
      'text-gray-700',
      'dark:text-gray-300',
      'mb-1',
    ].join(' '),
    
    required: "after:content-['*'] after:ml-0.5 after:text-red-500",
  },
  
  error: [
    'mt-1',
    'text-sm',
    'text-red-600',
    'dark:text-red-400',
    'flex',
    'items-center',
    'gap-1',
  ].join(' '),
  
  hint: [
    'mt-1',
    'text-sm',
    'text-gray-500',
    'dark:text-gray-400',
  ].join(' '),
  
  loading: [
    'absolute',
    'right-3',
    'top-1/2',
    'transform',
    '-translate-y-1/2',
    'pointer-events-none',
  ].join(' '),
};

// ============================================================================
// LOADING SPINNER COMPONENT
// ============================================================================

/**
 * Accessible loading spinner with proper ARIA attributes
 */
const LoadingSpinner = ({ size = 'sm' }: { size?: ComponentSize }) => {
  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-5 w-5',
    lg: 'h-6 w-6',
  };

  return (
    <div
      className={cn(
        'animate-spin rounded-full border-2 border-current border-t-transparent',
        sizeClasses[size]
      )}
      role="status"
      aria-label="Loading options"
    >
      <span className="sr-only">Loading...</span>
    </div>
  );
};

// ============================================================================
// OPTION RENDERER COMPONENT
// ============================================================================

/**
 * Enhanced option renderer with icon support and accessibility
 */
interface OptionRendererProps<T = any> {
  option: SelectOption<T>;
  selected: boolean;
  active: boolean;
  disabled?: boolean;
  size?: ComponentSize;
}

const OptionRenderer = <T,>({
  option,
  selected,
  active,
  disabled = false,
  size = 'md',
}: OptionRendererProps<T>) => {
  const Icon = option.icon;
  
  const optionClasses = cn(
    selectVariants.option.base,
    {
      [selectVariants.option.states.selected]: selected,
      [selectVariants.option.states.active]: active && !selected,
      [selectVariants.option.states.disabled]: disabled || option.disabled,
      [selectVariants.option.states.idle]: !active && !selected && !disabled && !option.disabled,
    }
  );

  return (
    <div className={optionClasses}>
      <div className="flex items-center gap-2">
        {Icon && (
          <Icon
            className={cn(
              'flex-shrink-0',
              size === 'sm' ? 'h-4 w-4' : size === 'lg' ? 'h-6 w-6' : 'h-5 w-5',
              {
                'text-white': selected,
                'text-gray-400': disabled || option.disabled,
                'text-gray-500 dark:text-gray-400': !selected && !disabled && !option.disabled,
              }
            )}
            aria-hidden="true"
          />
        )}
        
        <div className="flex-1 min-w-0">
          <div
            className={cn(
              'truncate',
              size === 'sm' ? 'text-sm' : size === 'lg' ? 'text-base' : 'text-sm'
            )}
          >
            {option.label}
          </div>
          
          {option.description && (
            <div
              className={cn(
                'text-xs truncate mt-0.5',
                {
                  'text-blue-200': selected,
                  'text-gray-300': disabled || option.disabled,
                  'text-gray-500 dark:text-gray-400': !selected && !disabled && !option.disabled,
                }
              )}
            >
              {option.description}
            </div>
          )}
        </div>
      </div>

      {selected && (
        <span className="absolute inset-y-0 right-0 flex items-center pr-4">
          <CheckIcon
            className={cn(
              'h-5 w-5',
              selected ? 'text-white' : 'text-blue-600 dark:text-blue-400'
            )}
            aria-hidden="true"
          />
        </span>
      )}
    </div>
  );
};

// ============================================================================
// MAIN SELECT COMPONENT
// ============================================================================

/**
 * Main Select component with comprehensive functionality
 * 
 * @example
 * ```tsx
 * <Select
 *   label="Database Type"
 *   options={databaseOptions}
 *   value={selectedDb}
 *   onChange={setSelectedDb}
 *   placeholder="Select a database..."
 *   error={errors.database?.message}
 *   required
 *   size="md"
 * />
 * ```
 */
export interface SelectComponentProps<T = string | number> extends SelectProps<T> {
  /** Additional CSS classes */
  className?: string;
  /** Theme variants for styling */
  variants?: SelectThemeVariants;
  /** Custom option renderer */
  renderOption?: (option: SelectOption<T>, props: OptionRendererProps<T>) => React.ReactNode;
}

const Select = forwardRef<HTMLButtonElement, SelectComponentProps>(
  <T extends string | number = string>(
    {
      // Core props
      label,
      options = [],
      value,
      defaultValue,
      onChange,
      onBlur,
      onFocus,
      
      // Form integration
      name,
      required = false,
      disabled = false,
      error,
      placeholder = 'Select an option...',
      
      // Component configuration
      size = 'md',
      clearable = false,
      loading = false,
      className,
      variants,
      renderOption,
      
      // Accessibility
      'aria-label': ariaLabel,
      'aria-describedby': ariaDescribedBy,
      'aria-labelledby': ariaLabelledBy,
      'aria-required': ariaRequired,
      'aria-invalid': ariaInvalid,
      
      // Additional props
      ...props
    }: SelectComponentProps<T>,
    ref: React.ForwardedRef<HTMLButtonElement>
  ) => {
    // Generate unique IDs for accessibility
    const baseId = useId();
    const labelId = `${baseId}-label`;
    const errorId = `${baseId}-error`;
    const hintId = `${baseId}-hint`;
    
    // Use custom hooks for functionality
    const {
      selectedValue,
      selectedOption,
      handleSelect,
      clearSelection,
      isOpen,
      setIsOpen,
      error: validationError,
      isRequired,
      register,
    } = useSelect({
      value,
      defaultValue,
      onChange,
      options,
      name,
      disabled,
      required,
    });

    const { flatOptions, findOption, getDisplayLabel } = useSelectOptions(options);
    
    const {
      highlightedIndex,
      setHighlightedIndex,
      handleKeyDown,
    } = useSelectKeyboard(
      flatOptions,
      handleSelect,
      isOpen,
      setIsOpen
    );

    // Determine current state for styling
    const currentState: ComponentState = useMemo(() => {
      if (disabled) return 'disabled';
      if (loading) return 'loading';
      if (error || validationError) return 'error';
      return 'idle';
    }, [disabled, loading, error, validationError]);

    // Get final error message
    const finalError = error || validationError;

    // Build accessibility attributes
    const accessibilityProps = {
      'aria-labelledby': ariaLabelledBy || labelId,
      'aria-describedby': cn(
        ariaDescribedBy,
        finalError && errorId,
        props.hint && hintId
      ).trim() || undefined,
      'aria-required': ariaRequired ?? isRequired,
      'aria-invalid': ariaInvalid ?? Boolean(finalError),
      'aria-expanded': isOpen,
      'aria-haspopup': 'listbox' as const,
    };

    // Handle selection with accessibility announcements
    const handleOptionSelect = (option: SelectOption<T>) => {
      handleSelect(option.value, option);
      
      // Announce selection to screen readers
      if (typeof window !== 'undefined' && window.speechSynthesis) {
        const announcement = `Selected ${option.label}`;
        const utterance = new SpeechSynthesisUtterance(announcement);
        utterance.volume = 0.1;
        utterance.rate = 1.2;
        window.speechSynthesis.speak(utterance);
      }
    };

    // Handle clear selection
    const handleClear = (event: React.MouseEvent) => {
      event.preventDefault();
      event.stopPropagation();
      clearSelection();
    };

    // Get display value for trigger
    const displayValue = selectedOption?.label || placeholder;

    return (
      <div className={cn(selectVariants.base, className)}>
        {/* Label */}
        {label && (
          <label
            id={labelId}
            htmlFor={baseId}
            className={cn(
              selectVariants.label.base,
              required && selectVariants.label.required
            )}
          >
            {label}
          </label>
        )}

        <Listbox
          value={selectedValue}
          onChange={handleOptionSelect}
          disabled={disabled}
          by="value"
        >
          <div className="relative">
            <Listbox.Button
              ref={ref}
              id={baseId}
              className={cn(
                selectVariants.trigger.base,
                selectVariants.trigger.size[size],
                selectVariants.trigger.state[currentState]
              )}
              onKeyDown={handleKeyDown}
              {...accessibilityProps}
              {...register}
            >
              <span
                className={cn(
                  'block truncate',
                  !selectedOption && 'text-gray-500 dark:text-gray-400'
                )}
              >
                {displayValue}
              </span>
              
              <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2">
                {loading ? (
                  <LoadingSpinner size={size} />
                ) : (
                  <>
                    {clearable && selectedOption && !disabled && (
                      <button
                        type="button"
                        onClick={handleClear}
                        className="pointer-events-auto mr-1 p-0.5 rounded hover:bg-gray-200 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1"
                        aria-label="Clear selection"
                      >
                        <svg
                          className="h-4 w-4 text-gray-400"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                          aria-hidden="true"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M6 18L18 6M6 6l12 12"
                          />
                        </svg>
                      </button>
                    )}
                    
                    <ChevronUpDownIcon
                      className="h-5 w-5 text-gray-400"
                      aria-hidden="true"
                    />
                  </>
                )}
              </span>
            </Listbox.Button>

            <Transition
              as={Fragment}
              show={isOpen}
              enter="transition ease-out duration-100"
              enterFrom="transform opacity-0 scale-95"
              enterTo="transform opacity-100 scale-100"
              leave="transition ease-in duration-75"
              leaveFrom="transform opacity-100 scale-100"
              leaveTo="transform opacity-0 scale-95"
            >
              <Listbox.Options
                className={cn(
                  selectVariants.dropdown.base,
                  selectVariants.dropdown.maxHeight
                )}
                onMouseLeave={() => setHighlightedIndex(-1)}
              >
                {flatOptions.length === 0 ? (
                  <div className="relative cursor-default select-none py-2 px-4 text-gray-700 dark:text-gray-300">
                    No options available
                  </div>
                ) : (
                  flatOptions.map((option, index) => (
                    <Listbox.Option
                      key={`${option.value}-${index}`}
                      value={option}
                      disabled={option.disabled}
                      className="focus:outline-none"
                      onMouseEnter={() => setHighlightedIndex(index)}
                    >
                      {({ selected, active }) => {
                        const isHighlighted = highlightedIndex === index;
                        const optionProps: OptionRendererProps<T> = {
                          option,
                          selected,
                          active: active || isHighlighted,
                          disabled: option.disabled,
                          size,
                        };

                        return renderOption ? (
                          renderOption(option, optionProps)
                        ) : (
                          <OptionRenderer {...optionProps} />
                        );
                      }}
                    </Listbox.Option>
                  ))
                )}
              </Listbox.Options>
            </Transition>
          </div>
        </Listbox>

        {/* Error Message */}
        {finalError && (
          <div
            id={errorId}
            className={selectVariants.error}
            role="alert"
            aria-live="polite"
          >
            <ExclamationTriangleIcon
              className="h-4 w-4 flex-shrink-0"
              aria-hidden="true"
            />
            <span>{finalError}</span>
          </div>
        )}

        {/* Hint Text */}
        {props.hint && !finalError && (
          <div
            id={hintId}
            className={selectVariants.hint}
          >
            {props.hint}
          </div>
        )}
      </div>
    );
  }
) as <T extends string | number = string>(
  props: SelectComponentProps<T> & { ref?: React.ForwardedRef<HTMLButtonElement> }
) => React.ReactElement;

Select.displayName = 'Select';

// ============================================================================
// EXPORTS
// ============================================================================

export default Select;
export { Select };
export type { SelectComponentProps };

// Re-export types for convenience
export type {
  SelectOption,
  SelectProps,
  SelectThemeVariants,
} from './types';