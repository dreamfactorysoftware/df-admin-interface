'use client';

/**
 * Autocomplete Component for DreamFactory Admin Interface
 * 
 * Comprehensive searchable select component using Headless UI Combobox that replaces
 * Angular Material mat-autocomplete with React 19/Next.js 15.1 patterns. Provides
 * autocomplete functionality with async option loading, filtering, custom option creation,
 * and virtual scrolling for large datasets with accessibility compliance.
 * 
 * Features:
 * - Headless UI Combobox for accessible autocomplete functionality
 * - SWR/React Query integration for intelligent caching with sub-50ms cache hits
 * - TanStack Virtual for performance optimization with 1000+ table schemas
 * - React Hook Form integration with validation and error handling
 * - Debounced search with configurable delay (default 300ms)
 * - Custom option creation for dynamic option lists
 * - Keyboard navigation (arrow keys, enter, escape) and screen reader support
 * - Search term highlighting and focus management
 * - Virtual scrolling for large option lists using TanStack Virtual
 * 
 * @fileoverview Autocomplete select component for DreamFactory admin interface
 * @version 1.0.0
 * @since React 19.0.0 / Next.js 15.1+
 */

import React, { 
  forwardRef, 
  Fragment, 
  useCallback, 
  useEffect, 
  useMemo, 
  useRef, 
  useState,
  type ComponentPropsWithoutRef,
  type ElementRef,
  type ReactNode 
} from 'react';
import { Combobox, Transition } from '@headlessui/react';
import { ChevronUpDownIcon, CheckIcon, PlusIcon, MagnifyingGlassIcon } from '@heroicons/react/20/solid';
import { useVirtualizer } from '@tanstack/react-virtual';
import { useFormContext } from 'react-hook-form';
import { cn } from '../../../lib/utils';
import { useDebounce } from '../../../hooks/useDebounce';
import { useAutocomplete, useSelectKeyboard, useSelectValidation } from './hooks';
import type { 
  AutocompleteProps, 
  SelectOption, 
  SelectLoadingState, 
  SelectErrorState,
  ComponentSize,
  ComponentVariant 
} from './types';

/**
 * Enhanced autocomplete props interface with virtual scrolling and async loading
 */
export interface AutocompleteComponentProps<T = any> 
  extends Omit<AutocompleteProps<T>, 'register' | 'control'>,
    Omit<ComponentPropsWithoutRef<'div'>, 'onChange' | 'value'> {
  
  /** Component size variant */
  size?: ComponentSize;
  
  /** Visual variant for different contexts */
  variant?: ComponentVariant;
  
  /** Whether to show search icon */
  showSearchIcon?: boolean;
  
  /** Virtual scrolling configuration for large datasets */
  virtual?: {
    /** Enable virtual scrolling (automatically enabled for >100 options) */
    enabled?: boolean;
    /** Height of each option item in pixels */
    itemHeight?: number;
    /** Number of items to render outside visible area */
    overscan?: number;
    /** Maximum height of dropdown container */
    maxHeight?: number;
  };
  
  /** Advanced search highlighting options */
  searchHighlight?: {
    /** Enable search term highlighting */
    enabled?: boolean;
    /** CSS class for highlighted text */
    highlightClass?: string;
    /** Whether to highlight only at word boundaries */
    wholeWords?: boolean;
  };
  
  /** Performance optimization settings */
  performance?: {
    /** Minimum characters before enabling search */
    minSearchLength?: number;
    /** Search debounce delay in milliseconds */
    searchDebounce?: number;
    /** Maximum number of options to display */
    maxDisplayOptions?: number;
  };
  
  /** Loading state configuration */
  loadingConfig?: {
    /** Custom loading text */
    loadingText?: string;
    /** Show skeleton loading for options */
    showSkeleton?: boolean;
    /** Number of skeleton items to show */
    skeletonCount?: number;
  };
  
  /** Empty state configuration */
  emptyState?: {
    /** Text when no options available */
    noOptionsText?: string;
    /** Text when search returns no results */
    noResultsText?: string;
    /** Custom empty state component */
    customEmptyComponent?: ReactNode;
  };
  
  /** Advanced create option configuration */
  createOption?: {
    /** Enable option creation */
    enabled?: boolean;
    /** Custom create option text template */
    createText?: (searchTerm: string) => string;
    /** Validation for new option creation */
    validateCreate?: (searchTerm: string) => string | undefined;
    /** Custom create option renderer */
    customRenderer?: (searchTerm: string, onClick: () => void) => ReactNode;
  };
}

/**
 * Internal option rendering component with virtual scrolling support
 */
interface OptionRendererProps<T> {
  option: SelectOption<T>;
  index: number;
  isSelected: boolean;
  isHighlighted: boolean;
  searchTerm: string;
  onSelect: (option: SelectOption<T>) => void;
  highlightConfig?: AutocompleteComponentProps<T>['searchHighlight'];
  virtual?: boolean;
  style?: React.CSSProperties;
}

/**
 * Search term highlighting utility function
 */
function highlightSearchTerm(
  text: string,
  searchTerm: string,
  options: { wholeWords?: boolean; highlightClass?: string } = {}
): ReactNode {
  if (!searchTerm || !text) return text;
  
  const { wholeWords = false, highlightClass = 'bg-yellow-200 dark:bg-yellow-800' } = options;
  
  try {
    const flags = 'gi';
    const pattern = wholeWords 
      ? new RegExp(`\\b(${searchTerm.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})\\b`, flags)
      : new RegExp(`(${searchTerm.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, flags);
    
    const parts = text.split(pattern);
    
    return parts.map((part, index) => {
      const isMatch = pattern.test(part);
      return isMatch ? (
        <span key={index} className={cn('font-medium', highlightClass)}>
          {part}
        </span>
      ) : (
        part
      );
    });
  } catch (error) {
    // Fallback to original text if regex fails
    console.warn('Failed to highlight search term:', error);
    return text;
  }
}

/**
 * Option renderer component with search highlighting and virtual scrolling support
 */
function OptionRenderer<T>({
  option,
  index,
  isSelected,
  isHighlighted,
  searchTerm,
  onSelect,
  highlightConfig,
  virtual = false,
  style,
}: OptionRendererProps<T>) {
  const handleSelect = useCallback(() => {
    if (!option.disabled) {
      onSelect(option);
    }
  }, [option, onSelect]);

  const displayLabel = useMemo(() => {
    if (highlightConfig?.enabled && searchTerm) {
      return highlightSearchTerm(option.label, searchTerm, {
        wholeWords: highlightConfig.wholeWords,
        highlightClass: highlightConfig.highlightClass,
      });
    }
    return option.label;
  }, [option.label, searchTerm, highlightConfig]);

  return (
    <Combobox.Option
      key={`${option.value}-${index}`}
      value={option}
      disabled={option.disabled}
      style={virtual ? style : undefined}
      className={({ active }) =>
        cn(
          'relative cursor-default select-none py-2 pl-3 pr-9 transition-colors duration-150',
          {
            'bg-primary-500 text-white': active || isHighlighted,
            'text-gray-900 dark:text-gray-100': !active && !isHighlighted,
            'opacity-50 cursor-not-allowed': option.disabled,
          }
        )
      }
      onClick={handleSelect}
    >
      {({ selected, active }) => (
        <div className="flex items-center space-x-3">
          {/* Option icon if provided */}
          {option.icon && (
            <div className={cn('flex-shrink-0', {
              'text-white': active || isHighlighted,
              'text-gray-500 dark:text-gray-400': !active && !isHighlighted,
            })}>
              <option.icon size="sm" />
            </div>
          )}
          
          {/* Option content */}
          <div className="flex-1 min-w-0">
            <div className={cn('block truncate font-medium', {
              'text-white': active || isHighlighted,
              'text-gray-900 dark:text-gray-100': !active && !isHighlighted,
            })}>
              {displayLabel}
            </div>
            
            {/* Option description */}
            {option.description && (
              <div className={cn('block text-sm truncate', {
                'text-gray-200': active || isHighlighted,
                'text-gray-500 dark:text-gray-400': !active && !isHighlighted,
              })}>
                {option.description}
              </div>
            )}
            
            {/* Option metadata badge */}
            {option.metadata?.badge && (
              <span className={cn(
                'inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium mt-1',
                {
                  'bg-white/20 text-white': active || isHighlighted,
                  'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200': !active && !isHighlighted,
                }
              )}>
                {option.metadata.badge}
              </span>
            )}
          </div>
          
          {/* Selection indicator */}
          {(selected || isSelected) && (
            <span className={cn('absolute inset-y-0 right-0 flex items-center pr-4', {
              'text-white': active || isHighlighted,
              'text-primary-600': !active && !isHighlighted,
            })}>
              <CheckIcon className="h-5 w-5" aria-hidden="true" />
            </span>
          )}
        </div>
      )}
    </Combobox.Option>
  );
}

/**
 * Loading skeleton component for async loading states
 */
function LoadingSkeleton({ count = 3 }: { count?: number }) {
  return (
    <>
      {Array.from({ length: count }, (_, index) => (
        <div
          key={index}
          className="flex items-center space-x-3 py-2 pl-3 pr-9 animate-pulse"
        >
          <div className="h-4 w-4 bg-gray-300 dark:bg-gray-600 rounded"></div>
          <div className="flex-1 space-y-1">
            <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded w-3/4"></div>
            <div className="h-3 bg-gray-300 dark:bg-gray-600 rounded w-1/2"></div>
          </div>
        </div>
      ))}
    </>
  );
}

/**
 * Create option component for dynamic option creation
 */
function CreateOptionComponent<T>({
  searchTerm,
  onCreateOption,
  createConfig,
}: {
  searchTerm: string;
  onCreateOption: () => void;
  createConfig?: AutocompleteComponentProps<T>['createOption'];
}) {
  const createText = createConfig?.createText 
    ? createConfig.createText(searchTerm)
    : `Create "${searchTerm}"`;

  if (createConfig?.customRenderer) {
    return createConfig.customRenderer(searchTerm, onCreateOption);
  }

  return (
    <div
      onClick={onCreateOption}
      className="relative cursor-pointer select-none py-2 pl-3 pr-9 text-gray-900 dark:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors duration-150"
    >
      <div className="flex items-center space-x-3">
        <PlusIcon className="h-5 w-5 text-primary-500" />
        <span className="block truncate font-medium">
          {createText}
        </span>
      </div>
    </div>
  );
}

/**
 * Autocomplete component implementation with comprehensive feature set
 */
const Autocomplete = forwardRef<
  ElementRef<'div'>,
  AutocompleteComponentProps
>(({
  // Core props
  options = [],
  value,
  onChange,
  onBlur,
  onFocus,
  disabled = false,
  placeholder = 'Search...',
  name,
  
  // Search configuration
  searchable = true,
  asyncOptions,
  onSearch,
  searchTerm: controlledSearchTerm,
  minSearchLength = 2,
  searchDebounce = 300,
  
  // Option creation
  allowCreate = false,
  onCreateOption,
  createOptionRenderer,
  
  // Visual configuration
  size = 'md',
  variant = 'default',
  showSearchIcon = true,
  
  // Virtual scrolling
  virtual = {
    enabled: false,
    itemHeight: 48,
    overscan: 5,
    maxHeight: 320,
  },
  
  // Search highlighting
  searchHighlight = {
    enabled: true,
    highlightClass: 'bg-yellow-200 dark:bg-yellow-800',
    wholeWords: false,
  },
  
  // Performance optimization
  performance = {
    minSearchLength: 2,
    searchDebounce: 300,
    maxDisplayOptions: 1000,
  },
  
  // Loading configuration
  loadingConfig = {
    loadingText: 'Searching...',
    showSkeleton: true,
    skeletonCount: 3,
  },
  
  // Empty state configuration
  emptyState = {
    noOptionsText: 'No options available',
    noResultsText: 'No results found',
  },
  
  // Create option configuration
  createOption = {
    enabled: allowCreate,
    createText: (term: string) => `Create "${term}"`,
  },
  
  // Form integration
  error,
  required = false,
  'aria-label': ariaLabel,
  'aria-describedby': ariaDescribedBy,
  
  // Standard HTML props
  className,
  id,
  ...rest
}, ref) => {
  // Form context integration
  const formContext = useFormContext();
  
  // Use autocomplete hook for comprehensive state management
  const {
    selectedValue,
    selectedOption,
    handleSelect,
    searchQuery,
    setSearchQuery,
    debouncedSearchQuery,
    filteredOptions,
    isSearching,
    handleSearchChange,
    handleCreateOption,
    canCreateOption,
    isOpen,
    setIsOpen,
    error: hookError,
    isRequired,
  } = useAutocomplete({
    value,
    onChange,
    options,
    asyncOptions,
    onSearch,
    searchQuery: controlledSearchTerm,
    searchDebounce: performance.searchDebounce || searchDebounce,
    minSearchLength: performance.minSearchLength || minSearchLength,
    allowCustomValue: createOption.enabled,
    onCreateOption,
    name,
    disabled,
    required,
  });

  // Virtual scrolling setup for large datasets
  const parentRef = useRef<HTMLDivElement>(null);
  const virtualEnabled = useMemo(() => {
    return virtual.enabled || filteredOptions.length > 100;
  }, [virtual.enabled, filteredOptions.length]);

  // TanStack Virtual for performance with large option lists
  const virtualizer = useVirtualizer({
    count: filteredOptions.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => virtual.itemHeight || 48,
    overscan: virtual.overscan || 5,
    enabled: virtualEnabled,
  });

  // Keyboard navigation integration
  const {
    highlightedIndex,
    handleKeyDown,
    selectHighlighted,
    resetHighlight,
  } = useSelectKeyboard(
    filteredOptions,
    (value, option) => handleSelect(value, option),
    isOpen,
    setIsOpen
  );

  // Form validation integration
  const {
    error: validationError,
    isValid,
    register,
  } = useSelectValidation(name, { required }, undefined);

  // Computed display values
  const displayError = error || hookError || validationError;
  const displayValue = selectedOption?.label || '';
  
  // Compute limited options for performance
  const displayOptions = useMemo(() => {
    const maxOptions = performance.maxDisplayOptions || 1000;
    return filteredOptions.slice(0, maxOptions);
  }, [filteredOptions, performance.maxDisplayOptions]);

  // Handle search input changes with debouncing
  const handleSearchInputChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const newQuery = event.target.value;
    handleSearchChange(newQuery);
  }, [handleSearchChange]);

  // Handle option selection
  const handleOptionSelect = useCallback((option: SelectOption) => {
    handleSelect(option.value, option);
    setIsOpen(false);
    resetHighlight();
  }, [handleSelect, setIsOpen, resetHighlight]);

  // Handle create option
  const handleCreateOptionClick = useCallback(async () => {
    if (canCreateOption && createOption.validateCreate) {
      const validationError = createOption.validateCreate(searchQuery);
      if (validationError) {
        console.warn('Create option validation failed:', validationError);
        return;
      }
    }
    
    await handleCreateOption();
    setIsOpen(false);
    resetHighlight();
  }, [canCreateOption, createOption.validateCreate, searchQuery, handleCreateOption, setIsOpen, resetHighlight]);

  // Style calculations based on size and variant
  const triggerClasses = cn(
    'relative w-full cursor-default rounded-md bg-white dark:bg-gray-800 py-1.5 pl-3 pr-10 text-left shadow-sm ring-1 ring-inset ring-gray-300 dark:ring-gray-600 focus:outline-none focus:ring-2 focus:ring-primary-500 sm:text-sm',
    {
      // Size variants
      'py-1 text-xs': size === 'xs',
      'py-1.5 text-sm': size === 'sm',
      'py-2 text-base': size === 'lg',
      'py-3 text-lg': size === 'xl',
      
      // State variants
      'ring-red-500 focus:ring-red-500': displayError,
      'opacity-50 cursor-not-allowed': disabled,
      'ring-primary-500': isOpen && !displayError,
    },
    className
  );

  const dropdownClasses = cn(
    'absolute z-10 mt-1 max-h-80 w-full overflow-auto rounded-md bg-white dark:bg-gray-800 py-1 text-base shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none sm:text-sm',
    {
      [`max-h-[${virtual.maxHeight}px]`]: virtualEnabled,
    }
  );

  return (
    <div ref={ref} className="relative" {...rest}>
      <Combobox value={selectedOption} onChange={handleOptionSelect} disabled={disabled}>
        {/* Hidden input for form integration */}
        {name && (
          <input
            type="hidden"
            {...register}
            value={selectedValue || ''}
            name={name}
          />
        )}
        
        <div className="relative">
          <Combobox.Input
            className={triggerClasses}
            displayValue={(option: SelectOption) => option?.label || ''}
            onChange={handleSearchInputChange}
            onKeyDown={handleKeyDown}
            onFocus={() => {
              setIsOpen(true);
              onFocus?.({} as React.FocusEvent<HTMLElement>);
            }}
            onBlur={() => {
              // Delay blur to allow for option selection
              setTimeout(() => {
                setIsOpen(false);
                onBlur?.({} as React.FocusEvent<HTMLElement>);
              }, 150);
            }}
            placeholder={placeholder}
            autoComplete="off"
            aria-label={ariaLabel}
            aria-describedby={ariaDescribedBy}
            aria-invalid={!!displayError}
            aria-required={isRequired}
            aria-expanded={isOpen}
            aria-haspopup="listbox"
            disabled={disabled}
          />
          
          {/* Search icon */}
          {showSearchIcon && (
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
              <MagnifyingGlassIcon
                className="h-5 w-5 text-gray-400"
                aria-hidden="true"
              />
            </div>
          )}
          
          {/* Dropdown toggle button */}
          <Combobox.Button className="absolute inset-y-0 right-0 flex items-center pr-2">
            <ChevronUpDownIcon
              className="h-5 w-5 text-gray-400"
              aria-hidden="true"
            />
          </Combobox.Button>
        </div>

        {/* Dropdown options */}
        <Transition
          as={Fragment}
          show={isOpen}
          leave="transition ease-in duration-100"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <Combobox.Options className={dropdownClasses} static>
            {/* Loading state */}
            {isSearching && loadingConfig.showSkeleton && (
              <LoadingSkeleton count={loadingConfig.skeletonCount} />
            )}
            
            {/* Options list with virtual scrolling support */}
            {!isSearching && (
              <>
                {virtualEnabled ? (
                  <div
                    ref={parentRef}
                    style={{ height: `${virtual.maxHeight}px` }}
                    className="overflow-auto"
                  >
                    <div
                      style={{
                        height: `${virtualizer.getTotalSize()}px`,
                        width: '100%',
                        position: 'relative',
                      }}
                    >
                      {virtualizer.getVirtualItems().map((virtualItem) => {
                        const option = displayOptions[virtualItem.index];
                        return (
                          <OptionRenderer
                            key={virtualItem.key}
                            option={option}
                            index={virtualItem.index}
                            isSelected={selectedValue === option.value}
                            isHighlighted={highlightedIndex === virtualItem.index}
                            searchTerm={searchQuery}
                            onSelect={handleOptionSelect}
                            highlightConfig={searchHighlight}
                            virtual={true}
                            style={{
                              position: 'absolute',
                              top: 0,
                              left: 0,
                              width: '100%',
                              height: `${virtualItem.size}px`,
                              transform: `translateY(${virtualItem.start}px)`,
                            }}
                          />
                        );
                      })}
                    </div>
                  </div>
                ) : (
                  displayOptions.map((option, index) => (
                    <OptionRenderer
                      key={`${option.value}-${index}`}
                      option={option}
                      index={index}
                      isSelected={selectedValue === option.value}
                      isHighlighted={highlightedIndex === index}
                      searchTerm={searchQuery}
                      onSelect={handleOptionSelect}
                      highlightConfig={searchHighlight}
                      virtual={false}
                    />
                  ))
                )}
                
                {/* Create option */}
                {canCreateOption && createOption.enabled && searchQuery && (
                  <CreateOptionComponent
                    searchTerm={searchQuery}
                    onCreateOption={handleCreateOptionClick}
                    createConfig={createOption}
                  />
                )}
                
                {/* Empty state */}
                {displayOptions.length === 0 && !canCreateOption && (
                  <div className="relative cursor-default select-none py-2 px-4 text-gray-700 dark:text-gray-300">
                    {emptyState.customEmptyComponent || (
                      searchQuery 
                        ? emptyState.noResultsText 
                        : emptyState.noOptionsText
                    )}
                  </div>
                )}
              </>
            )}
          </Combobox.Options>
        </Transition>
      </Combobox>
      
      {/* Error message */}
      {displayError && (
        <div className="mt-1 text-sm text-red-600 dark:text-red-400">
          {displayError}
        </div>
      )}
    </div>
  );
});

Autocomplete.displayName = 'Autocomplete';

export { Autocomplete };
export type { AutocompleteComponentProps };
export default Autocomplete;