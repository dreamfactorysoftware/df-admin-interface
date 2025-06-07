"use client";

import React, { forwardRef, useState, useMemo, useCallback, useRef, useEffect } from 'react';
import { Listbox, Transition } from '@headlessui/react';
import { ChevronDownIcon, XMarkIcon, CheckIcon, MagnifyingGlassIcon } from '@heroicons/react/24/outline';
import { cn } from '@/lib/utils';
import { Button } from '../button/Button';
import { useMultiSelect, useSelectKeyboard, useVerbTransform } from './hooks';
import type { MultiSelectProps, SelectOption } from './types';

/**
 * MultiSelect Component for DreamFactory Admin Interface
 * 
 * Advanced multiple selection component using Headless UI Listbox with comprehensive
 * multi-select capability. Displays selected items as chips/tags with remove functionality.
 * Supports maximum selection limits, batch operations, search/filter, and complex value
 * transformations including HTTP verb bitmasks for API generation workflows.
 * 
 * Features:
 * - Headless UI 2.0+ Listbox with accessible multi-selection
 * - React Hook Form integration with array validation and error handling
 * - Tailwind CSS styling with consistent chip/tag design patterns
 * - Support for complex value transformations (arrays, bitmasks, comma-separated strings)
 * - Maximum selection limits with validation and user feedback
 * - Batch selection operations (select all, deselect all, invert selection)
 * - Search/filter functionality within the multi-select dropdown
 * - Proper keyboard navigation for chip removal and option selection
 * - HTTP verb bitmask support replacing Angular df-verb-picker functionality
 * - WCAG 2.1 AA accessibility compliance with screen reader support
 * 
 * @see Technical Specification Section 7.1.1 for React 19/Headless UI requirements
 * @see Angular df-verb-picker migration requirements for bitmask transformations
 * 
 * @example
 * ```tsx
 * // Basic multi-select with chips
 * <MultiSelect
 *   options={databaseOptions}
 *   value={selectedDatabases}
 *   onChange={setSelectedDatabases}
 *   placeholder="Select databases..."
 *   maxSelections={5}
 * />
 * 
 * // HTTP verb picker with bitmask transformation
 * <MultiSelect
 *   options={httpVerbOptions}
 *   value={selectedVerbs}
 *   onChange={handleVerbChange}
 *   transform={{
 *     type: 'bitmask',
 *     bitmask: {
 *       mapping: { GET: 1, POST: 2, PUT: 4, DELETE: 8 }
 *     }
 *   }}
 *   showSelectAll
 *   searchable
 * />
 * 
 * // Advanced multi-select with React Hook Form
 * <MultiSelect
 *   name="apiMethods"
 *   control={control}
 *   rules={{ required: 'At least one method is required' }}
 *   options={apiMethodOptions}
 *   maxSelections={10}
 *   showSelectionCount
 *   clearable
 * />
 * ```
 */
export interface MultiSelectProps<T = string | number> {
  /** Array of available options */
  options: SelectOption<T>[];
  
  /** Array of selected values */
  value?: T[];
  
  /** Change handler for multi-select values */
  onChange: (values: T[]) => void;
  
  /** Field name for form integration */
  name?: string;
  
  /** React Hook Form control object */
  control?: any;
  
  /** Form validation rules */
  rules?: Record<string, any>;
  
  /** Component label */
  label?: string;
  
  /** Placeholder text when no selection */
  placeholder?: string;
  
  /** Help text displayed below the component */
  helpText?: string;
  
  /** Error message */
  error?: string;
  
  /** Whether the field is required */
  required?: boolean;
  
  /** Whether the component is disabled */
  disabled?: boolean;
  
  /** Whether the component is in loading state */
  loading?: boolean;
  
  /** Maximum number of selections allowed */
  maxSelections?: number;
  
  /** Minimum number of selections required */
  minSelections?: number;
  
  /** Whether to show "Select All" option */
  showSelectAll?: boolean;
  
  /** Text for "Select All" option */
  selectAllText?: string;
  
  /** Text for "Clear All" action */
  clearAllText?: string;
  
  /** Whether to show selection count */
  showSelectionCount?: boolean;
  
  /** Format function for selection count display */
  selectionCountFormatter?: (count: number, total: number) => string;
  
  /** Whether the component is searchable */
  searchable?: boolean;
  
  /** Search placeholder text */
  searchPlaceholder?: string;
  
  /** Whether the component is clearable */
  clearable?: boolean;
  
  /** Whether chips can be removed individually */
  removable?: boolean;
  
  /** Maximum number of chips to display before showing count */
  maxChipsDisplayed?: number;
  
  /** Custom chip renderer */
  chipRenderer?: (option: SelectOption<T>, onRemove: () => void) => React.ReactNode;
  
  /** Value transformation configuration */
  transform?: {
    type: 'array' | 'bitmask' | 'comma-separated';
    bitmask?: {
      mapping: Record<string | number, number>;
    };
  };
  
  /** Size variant */
  size?: 'sm' | 'md' | 'lg';
  
  /** Visual variant */
  variant?: 'default' | 'outline' | 'filled';
  
  /** Whether to take full width */
  fullWidth?: boolean;
  
  /** Additional CSS classes */
  className?: string;
  
  /** Test ID for testing */
  'data-testid'?: string;
  
  // Accessibility props
  'aria-label'?: string;
  'aria-describedby'?: string;
}

/**
 * Individual chip component for selected items
 * Implements proper accessibility and keyboard navigation
 */
interface ChipProps<T> {
  option: SelectOption<T>;
  onRemove: () => void;
  disabled?: boolean;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const Chip = <T extends string | number>({ 
  option, 
  onRemove, 
  disabled = false,
  size = 'md',
  className 
}: ChipProps<T>) => {
  const sizeClasses = {
    sm: 'text-xs px-2 py-1',
    md: 'text-sm px-2.5 py-1.5',
    lg: 'text-base px-3 py-2',
  };

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-md bg-primary-50 text-primary-700 border border-primary-200",
        "dark:bg-primary-900/20 dark:text-primary-300 dark:border-primary-800",
        "transition-colors duration-200",
        sizeClasses[size],
        disabled && "opacity-50 cursor-not-allowed",
        className
      )}
    >
      {option.icon && (
        <span className="flex-shrink-0" aria-hidden="true">
          <option.icon className="w-4 h-4" />
        </span>
      )}
      
      <span className="flex-1 truncate">{option.label}</span>
      
      {!disabled && (
        <button
          type="button"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            onRemove();
          }}
          className={cn(
            "flex-shrink-0 rounded-sm text-primary-600 hover:text-primary-800",
            "dark:text-primary-400 dark:hover:text-primary-200",
            "focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-1",
            "transition-colors duration-200"
          )}
          aria-label={`Remove ${option.label}`}
        >
          <XMarkIcon className="w-3 h-3" />
        </button>
      )}
    </span>
  );
};

/**
 * MultiSelect component implementation
 */
export const MultiSelect = forwardRef<HTMLButtonElement, MultiSelectProps>(
  <T extends string | number>(
    {
      options = [],
      value = [],
      onChange,
      name,
      control,
      rules,
      label,
      placeholder = "Select options...",
      helpText,
      error,
      required = false,
      disabled = false,
      loading = false,
      maxSelections,
      minSelections = 0,
      showSelectAll = false,
      selectAllText = "Select All",
      clearAllText = "Clear All",
      showSelectionCount = false,
      selectionCountFormatter,
      searchable = false,
      searchPlaceholder = "Search options...",
      clearable = false,
      removable = true,
      maxChipsDisplayed = 3,
      chipRenderer,
      transform,
      size = 'md',
      variant = 'default',
      fullWidth = false,
      className,
      'data-testid': dataTestId,
      'aria-label': ariaLabel,
      'aria-describedby': ariaDescribedBy,
      ...props
    }: MultiSelectProps<T>,
    ref
  ) => {
    // Search state
    const [searchQuery, setSearchQuery] = useState('');
    const [isOpen, setIsOpen] = useState(false);
    const searchInputRef = useRef<HTMLInputElement>(null);

    // Use multi-select hook for state management
    const {
      selectedValues,
      selectedOptions,
      handleMultiSelect,
      removeValue,
      selectAll,
      clearAll,
      isAllSelected,
      selectionCount,
      isMaxReached,
    } = useMultiSelect({
      value,
      onChange,
      options,
      maxSelections,
      minSelections,
      name,
      control,
      rules,
    });

    // HTTP verb transformation hook if bitmask mode
    const verbTransform = transform?.type === 'bitmask' 
      ? useVerbTransform(value as number, onChange as (value: number) => void)
      : null;

    // Filter options based on search query
    const filteredOptions = useMemo(() => {
      if (!searchQuery.trim()) return options;
      
      const query = searchQuery.toLowerCase();
      return options.filter(option => 
        option.label.toLowerCase().includes(query) ||
        option.value.toString().toLowerCase().includes(query) ||
        option.description?.toLowerCase().includes(query)
      );
    }, [options, searchQuery]);

    // Keyboard navigation
    const { highlightedIndex, handleKeyDown } = useSelectKeyboard(
      filteredOptions,
      handleMultiSelect,
      isOpen,
      setIsOpen
    );

    // Handle option selection with value transformation
    const handleOptionSelect = useCallback((optionValue: T) => {
      if (transform?.type === 'bitmask' && verbTransform) {
        verbTransform.toggleVerb(optionValue as string);
      } else {
        handleMultiSelect(optionValue);
      }
    }, [transform, verbTransform, handleMultiSelect]);

    // Handle select all
    const handleSelectAll = useCallback(() => {
      if (transform?.type === 'bitmask' && verbTransform) {
        verbTransform.selectAllVerbs();
      } else {
        selectAll();
      }
    }, [transform, verbTransform, selectAll]);

    // Handle clear all
    const handleClearAll = useCallback(() => {
      if (transform?.type === 'bitmask' && verbTransform) {
        verbTransform.clearAllVerbs();
      } else {
        clearAll();
      }
    }, [transform, verbTransform, clearAll]);

    // Get effective selected values and options
    const effectiveSelectedValues = transform?.type === 'bitmask' && verbTransform 
      ? verbTransform.selectedVerbs as T[]
      : selectedValues;

    const effectiveSelectedOptions = transform?.type === 'bitmask' && verbTransform
      ? verbTransform.selectedVerbs.map(verb => 
          options.find(opt => opt.value === verb)
        ).filter(Boolean) as SelectOption<T>[]
      : selectedOptions;

    // Check if option is selected
    const isOptionSelected = useCallback((optionValue: T) => {
      if (transform?.type === 'bitmask' && verbTransform) {
        return verbTransform.isVerbSelected(optionValue as string);
      }
      return effectiveSelectedValues.includes(optionValue);
    }, [transform, verbTransform, effectiveSelectedValues]);

    // Format selection count
    const formatSelectionCount = useCallback((count: number, total: number) => {
      if (selectionCountFormatter) {
        return selectionCountFormatter(count, total);
      }
      return `${count}/${total} selected`;
    }, [selectionCountFormatter]);

    // Handle search input change
    const handleSearchChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
      setSearchQuery(e.target.value);
    }, []);

    // Focus search input when dropdown opens
    useEffect(() => {
      if (isOpen && searchable && searchInputRef.current) {
        setTimeout(() => {
          searchInputRef.current?.focus();
        }, 100);
      }
    }, [isOpen, searchable]);

    // Size classes
    const sizeClasses = {
      sm: {
        trigger: 'text-sm px-3 py-2 min-h-[36px]',
        dropdown: 'text-sm',
        chip: 'text-xs',
      },
      md: {
        trigger: 'text-sm px-3 py-2.5 min-h-[40px]',
        dropdown: 'text-sm',
        chip: 'text-sm',
      },
      lg: {
        trigger: 'text-base px-4 py-3 min-h-[44px]',
        dropdown: 'text-base',
        chip: 'text-base',
      },
    };

    // Variant classes
    const variantClasses = {
      default: {
        trigger: 'border-gray-300 bg-white hover:border-gray-400 focus:border-primary-500 focus:ring-primary-500',
        dropdown: 'border-gray-200 bg-white shadow-lg',
      },
      outline: {
        trigger: 'border-2 border-gray-300 bg-transparent hover:border-gray-400 focus:border-primary-500 focus:ring-primary-500',
        dropdown: 'border-2 border-gray-200 bg-white shadow-lg',
      },
      filled: {
        trigger: 'border-transparent bg-gray-50 hover:bg-gray-100 focus:bg-white focus:border-primary-500 focus:ring-primary-500',
        dropdown: 'border-gray-200 bg-white shadow-lg',
      },
    };

    // Render selected chips
    const renderSelectedChips = () => {
      if (effectiveSelectedOptions.length === 0) return null;

      const visibleChips = effectiveSelectedOptions.slice(0, maxChipsDisplayed);
      const hiddenCount = effectiveSelectedOptions.length - maxChipsDisplayed;

      return (
        <div className="flex flex-wrap gap-1 min-h-0">
          {visibleChips.map((option) => {
            const chipElement = chipRenderer ? (
              chipRenderer(option, () => removeValue(option.value))
            ) : (
              <Chip
                key={option.value}
                option={option}
                onRemove={() => removeValue(option.value)}
                disabled={disabled}
                size={size}
              />
            );
            
            return chipElement;
          })}
          
          {hiddenCount > 0 && (
            <span className={cn(
              "inline-flex items-center px-2 py-1 rounded-md bg-gray-100 text-gray-600 text-xs",
              "dark:bg-gray-800 dark:text-gray-400"
            )}>
              +{hiddenCount} more
            </span>
          )}
        </div>
      );
    };

    // Render dropdown content
    const renderDropdownContent = () => (
      <div className="max-h-60 overflow-auto">
        {/* Search input */}
        {searchable && (
          <div className="sticky top-0 bg-white border-b border-gray-200 p-2">
            <div className="relative">
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                ref={searchInputRef}
                type="text"
                placeholder={searchPlaceholder}
                value={searchQuery}
                onChange={handleSearchChange}
                className={cn(
                  "w-full pl-9 pr-3 py-2 border border-gray-300 rounded-md",
                  "focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500",
                  "text-sm placeholder-gray-500"
                )}
              />
            </div>
          </div>
        )}

        {/* Batch actions */}
        {(showSelectAll || clearable) && (
          <div className="sticky top-0 bg-white border-b border-gray-200 p-2 flex gap-2">
            {showSelectAll && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={handleSelectAll}
                disabled={disabled || isAllSelected}
                className="flex-1"
              >
                {selectAllText}
              </Button>
            )}
            
            {clearable && effectiveSelectedValues.length > 0 && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={handleClearAll}
                disabled={disabled}
                className="flex-1"
              >
                {clearAllText}
              </Button>
            )}
          </div>
        )}

        {/* Selection count */}
        {showSelectionCount && (
          <div className="px-3 py-2 text-xs text-gray-500 border-b border-gray-200">
            {formatSelectionCount(effectiveSelectedValues.length, filteredOptions.length)}
          </div>
        )}

        {/* Options list */}
        <div className="py-1">
          {filteredOptions.length === 0 ? (
            <div className="px-3 py-2 text-sm text-gray-500 text-center">
              {searchQuery ? 'No options found' : 'No options available'}
            </div>
          ) : (
            filteredOptions.map((option, index) => {
              const isSelected = isOptionSelected(option.value);
              const isHighlighted = index === highlightedIndex;
              const isDisabledOption = option.disabled || (isMaxReached && !isSelected);

              return (
                <Listbox.Option
                  key={option.value}
                  value={option.value}
                  disabled={isDisabledOption}
                  className={({ active }) =>
                    cn(
                      "relative cursor-pointer select-none py-2 pl-3 pr-9",
                      "transition-colors duration-150",
                      active || isHighlighted
                        ? "bg-primary-50 text-primary-900"
                        : "text-gray-900",
                      isDisabledOption
                        ? "opacity-50 cursor-not-allowed"
                        : "hover:bg-primary-50 hover:text-primary-900",
                      "dark:text-gray-100 dark:hover:bg-primary-900/20"
                    )
                  }
                  onClick={() => !isDisabledOption && handleOptionSelect(option.value)}
                >
                  {({ selected, active }) => (
                    <>
                      <div className="flex items-center gap-2">
                        {option.icon && (
                          <span className="flex-shrink-0" aria-hidden="true">
                            <option.icon className="w-4 h-4" />
                          </span>
                        )}
                        
                        <div className="flex-1 min-w-0">
                          <span
                            className={cn(
                              "block truncate",
                              isSelected ? "font-medium" : "font-normal"
                            )}
                          >
                            {option.label}
                          </span>
                          
                          {option.description && (
                            <span className="block text-xs text-gray-500 truncate">
                              {option.description}
                            </span>
                          )}
                        </div>
                      </div>

                      {isSelected && (
                        <span
                          className={cn(
                            "absolute inset-y-0 right-0 flex items-center pr-3",
                            active ? "text-primary-600" : "text-primary-600"
                          )}
                        >
                          <CheckIcon className="w-4 h-4" aria-hidden="true" />
                        </span>
                      )}
                    </>
                  )}
                </Listbox.Option>
              );
            })
          )}
        </div>
      </div>
    );

    return (
      <div className={cn("w-full", fullWidth && "flex-1", className)}>
        {/* Label */}
        {label && (
          <label
            className={cn(
              "block text-sm font-medium text-gray-700 mb-1",
              "dark:text-gray-300",
              required && "after:content-['*'] after:ml-0.5 after:text-red-500"
            )}
          >
            {label}
          </label>
        )}

        {/* Multi-select component */}
        <Listbox
          value={effectiveSelectedValues}
          onChange={() => {}} // Handled in individual option selection
          multiple
          disabled={disabled}
        >
          <div className="relative">
            {/* Trigger button */}
            <Listbox.Button
              ref={ref}
              className={cn(
                "relative w-full cursor-pointer rounded-md border",
                "focus:outline-none focus:ring-2 focus:ring-offset-2",
                "transition-all duration-200",
                sizeClasses[size].trigger,
                variantClasses[variant].trigger,
                disabled && "opacity-50 cursor-not-allowed",
                error && "border-red-500 focus:border-red-500 focus:ring-red-500",
                fullWidth && "w-full"
              )}
              onClick={() => !disabled && setIsOpen(!isOpen)}
              onKeyDown={handleKeyDown}
              aria-label={ariaLabel}
              aria-describedby={ariaDescribedBy}
              data-testid={dataTestId}
              {...props}
            >
              <div className="flex items-center justify-between gap-2 min-h-0">
                <div className="flex-1 min-w-0">
                  {effectiveSelectedOptions.length > 0 ? (
                    renderSelectedChips()
                  ) : (
                    <span className="block truncate text-gray-500">
                      {placeholder}
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-1 flex-shrink-0">
                  {loading && (
                    <div className="animate-spin w-4 h-4 border-2 border-gray-300 border-t-primary-600 rounded-full" />
                  )}
                  
                  {clearable && effectiveSelectedValues.length > 0 && !disabled && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        handleClearAll();
                      }}
                      className={cn(
                        "p-1 text-gray-400 hover:text-gray-600 rounded",
                        "focus:outline-none focus:ring-2 focus:ring-primary-500"
                      )}
                      aria-label="Clear all selections"
                    >
                      <XMarkIcon className="w-4 h-4" />
                    </button>
                  )}

                  <ChevronDownIcon
                    className={cn(
                      "w-4 h-4 text-gray-400 transition-transform duration-200",
                      isOpen && "transform rotate-180"
                    )}
                    aria-hidden="true"
                  />
                </div>
              </div>
            </Listbox.Button>

            {/* Dropdown */}
            <Transition
              show={isOpen}
              enter="transition ease-out duration-100"
              enterFrom="transform opacity-0 scale-95"
              enterTo="transform opacity-100 scale-100"
              leave="transition ease-in duration-75"
              leaveFrom="transform opacity-100 scale-100"
              leaveTo="transform opacity-0 scale-95"
            >
              <Listbox.Options
                static
                className={cn(
                  "absolute z-10 mt-1 w-full rounded-md border py-1",
                  "focus:outline-none",
                  sizeClasses[size].dropdown,
                  variantClasses[variant].dropdown
                )}
                onBlur={() => setIsOpen(false)}
              >
                {renderDropdownContent()}
              </Listbox.Options>
            </Transition>
          </div>
        </Listbox>

        {/* Help text and error message */}
        {(helpText || error) && (
          <div className="mt-1">
            {error && (
              <p className="text-sm text-red-600 dark:text-red-400">
                {error}
              </p>
            )}
            {helpText && !error && (
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {helpText}
              </p>
            )}
          </div>
        )}
      </div>
    );
  }
);

MultiSelect.displayName = "MultiSelect";

export default MultiSelect;