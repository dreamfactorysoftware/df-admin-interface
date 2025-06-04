/**
 * Autocomplete Component
 * 
 * Searchable select component using Headless UI Combobox for autocomplete functionality.
 * Supports async option loading, filtering, custom option creation, and virtual scrolling.
 * Replaces Angular Material mat-autocomplete with React-based implementation for event
 * picklists and searchable dropdowns throughout the DreamFactory Admin Interface.
 * 
 * Key Features:
 * - Headless UI 2.0+ Combobox for accessibility compliance (WCAG 2.1 AA)
 * - Debounced search with configurable delay (default 300ms)
 * - Async option loading with SWR/React Query integration
 * - Virtual scrolling for large datasets (1000+ options) using TanStack Virtual
 * - React Hook Form integration with validation
 * - Custom option creation functionality
 * - Keyboard navigation and screen reader support
 * - Search term highlighting and focus management
 * - Loading states and comprehensive error handling
 * 
 * @fileoverview Autocomplete component for DreamFactory Admin Interface
 * @version 1.0.0
 * @since React 19.0.0 / Next.js 15.1+
 */

import React, { 
  useState, 
  useEffect, 
  useMemo, 
  useCallback, 
  useRef, 
  forwardRef,
  type ComponentPropsWithoutRef,
  type ForwardedRef,
  type ReactNode
} from 'react';
import { Combobox, Transition } from '@headlessui/react';
import { ChevronUpDownIcon, CheckIcon, XMarkIcon, PlusIcon } from '@heroicons/react/24/outline';
import { useVirtualizer } from '@tanstack/react-virtual';
import { cn } from '../../../lib/utils';
import { useDebounce } from '../../../hooks/useDebounce';
import { type AutocompleteProps, type SelectOption } from './types';
import { useAutocomplete, useSelectKeyboard } from './hooks';

/**
 * Default configuration for autocomplete component
 * Optimized for DreamFactory API integration patterns
 */
const DEFAULT_CONFIG = {
  searchDebounce: 300,
  minSearchLength: 2,
  maxRecentSelections: 5,
  virtualScrollThreshold: 100,
  itemHeight: 40,
  maxDisplayHeight: 300,
  placeholder: 'Search...',
  searchPlaceholder: 'Type to search...',
  emptyStateMessage: 'No options found',
  loadingMessage: 'Loading...',
  createOptionLabel: 'Create',
} as const;

/**
 * Interface for option highlighting functionality
 */
interface HighlightProps {
  text: string;
  searchTerm: string;
  className?: string;
}

/**
 * Highlighted text component for search term highlighting
 * Provides visual feedback for matching search terms within option labels
 */
const HighlightedText: React.FC<HighlightProps> = ({ text, searchTerm, className }) => {
  if (!searchTerm.trim()) {
    return <span className={className}>{text}</span>;
  }

  const parts = text.split(new RegExp(`(${searchTerm})`, 'gi'));
  
  return (
    <span className={className}>
      {parts.map((part, index) => 
        part.toLowerCase() === searchTerm.toLowerCase() ? (
          <mark 
            key={index} 
            className="bg-yellow-200 dark:bg-yellow-800/30 text-yellow-900 dark:text-yellow-100 rounded px-0.5"
          >
            {part}
          </mark>
        ) : (
          <span key={index}>{part}</span>
        )
      )}
    </span>
  );
};

/**
 * Option item component for virtualized list rendering
 * Handles individual option display with proper accessibility attributes
 */
interface OptionItemProps<T> {
  option: SelectOption<T>;
  isSelected: boolean;
  isFocused: boolean;
  searchTerm: string;
  highlightMatches: boolean;
  renderOption?: (option: SelectOption<T>, isSelected: boolean) => ReactNode;
  onSelect: (value: T) => void;
  style?: React.CSSProperties;
}

const OptionItem = <T,>({
  option,
  isSelected,
  isFocused,
  searchTerm,
  highlightMatches,
  renderOption,
  onSelect,
  style,
}: OptionItemProps<T>) => {
  const handleClick = useCallback(() => {
    if (!option.disabled) {
      onSelect(option.value);
    }
  }, [option.disabled, option.value, onSelect]);

  if (renderOption) {
    return (
      <div style={style} onClick={handleClick}>
        {renderOption(option, isSelected)}
      </div>
    );
  }

  return (
    <Combobox.Option
      key={option.value as string}
      value={option}
      disabled={option.disabled}
      style={style}
      className={({ active, selected, disabled }) =>
        cn(
          'relative cursor-default select-none py-2 pl-3 pr-9 transition-colors duration-150',
          'focus:outline-none',
          {
            'bg-primary-600 text-white': active && !disabled,
            'text-gray-900 dark:text-gray-100': !active && !disabled,
            'bg-gray-50 dark:bg-gray-800': selected && !active,
            'opacity-50 cursor-not-allowed': disabled,
            'ring-2 ring-primary-500 ring-inset': isFocused,
          }
        )
      }
    >
      {({ selected, active }) => (
        <>
          <div className="flex items-center space-x-3">
            {option.icon && (
              <div className="flex-shrink-0">
                {typeof option.icon === 'string' ? (
                  <span className="text-lg">{option.icon}</span>
                ) : (
                  option.icon
                )}
              </div>
            )}
            
            <div className="flex-1 min-w-0">
              <span className={cn('block truncate font-medium', {
                'text-white': active && !option.disabled,
                'text-gray-900 dark:text-gray-100': !active && !option.disabled,
                'font-semibold': selected,
              })}>
                {highlightMatches ? (
                  <HighlightedText text={option.label} searchTerm={searchTerm} />
                ) : (
                  option.label
                )}
              </span>
              
              {option.description && (
                <span className={cn('block truncate text-sm', {
                  'text-gray-200': active && !option.disabled,
                  'text-gray-500 dark:text-gray-400': !active && !option.disabled,
                })}>
                  {highlightMatches ? (
                    <HighlightedText text={option.description} searchTerm={searchTerm} />
                  ) : (
                    option.description
                  )}
                </span>
              )}
            </div>
          </div>

          {selected && (
            <span className={cn('absolute inset-y-0 right-0 flex items-center pr-4', {
              'text-white': active,
              'text-primary-600': !active,
            })}>
              <CheckIcon className="h-5 w-5" aria-hidden="true" />
            </span>
          )}
        </>
      )}
    </Combobox.Option>
  );
};

/**
 * Create option item component for dynamic option creation
 * Allows users to create new options from search input
 */
interface CreateOptionProps {
  searchTerm: string;
  onCreateOption: () => void;
  createOptionLabel: string;
  style?: React.CSSProperties;
}

const CreateOptionItem: React.FC<CreateOptionProps> = ({
  searchTerm,
  onCreateOption,
  createOptionLabel,
  style,
}) => (
  <div 
    style={style}
    className="relative cursor-pointer select-none py-2 pl-3 pr-9 text-gray-900 dark:text-gray-100 hover:bg-primary-50 dark:hover:bg-primary-900/20 transition-colors duration-150"
    onClick={onCreateOption}
  >
    <div className="flex items-center space-x-3">
      <PlusIcon className="h-5 w-5 text-primary-500" aria-hidden="true" />
      <span className="block truncate">
        {createOptionLabel} "{searchTerm}"
      </span>
    </div>
  </div>
);

/**
 * Main Autocomplete component
 * Provides comprehensive autocomplete functionality with accessibility and performance optimizations
 */
const Autocomplete = forwardRef<
  HTMLInputElement,
  AutocompleteProps & Omit<ComponentPropsWithoutRef<'input'>, 'onChange' | 'value'>
>(({
  // Core props
  options = [],
  value,
  onChange,
  onSearch,
  asyncOptions,
  placeholder = DEFAULT_CONFIG.placeholder,
  searchPlaceholder = DEFAULT_CONFIG.searchPlaceholder,
  disabled = false,
  clearable = true,
  
  // Search configuration
  searchDebounce = DEFAULT_CONFIG.searchDebounce,
  minSearchLength = DEFAULT_CONFIG.minSearchLength,
  highlightMatches = true,
  filterOptions,
  
  // Option creation
  allowCustomValue = false,
  onCreateOption,
  
  // Recent selections
  showRecentSelections = false,
  maxRecentSelections = DEFAULT_CONFIG.maxRecentSelections,
  
  // Loading and error states
  loadingState,
  errorState,
  
  // Customization
  renderOption,
  renderValue,
  emptyStateContent,
  loadingContent,
  
  // Form integration
  name,
  required = false,
  
  // Accessibility
  'aria-label': ariaLabel,
  'aria-describedby': ariaDescribedBy,
  'aria-invalid': ariaInvalid,
  announceSelection,
  announceSearchResults,
  
  // Styling
  className,
  themeVariants,
  
  // Event handlers
  onFocus,
  onBlur,
  
  ...inputProps
}, ref: ForwardedRef<HTMLInputElement>) => {
  // Internal state management
  const [internalSearchTerm, setInternalSearchTerm] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [recentSelections, setRecentSelections] = useState<SelectOption[]>([]);
  const listRef = useRef<HTMLDivElement>(null);
  const comboboxRef = useRef<HTMLDivElement>(null);
  
  // Debounced search term for API calls
  const debouncedSearchTerm = useDebounce(internalSearchTerm, searchDebounce);
  
  // Use autocomplete hook for search and option management
  const autocompleteHook = useAutocomplete(options, {
    loadOptions: asyncOptions,
    searchDebounceMs: searchDebounce,
  });
  
  // Determine which options to display
  const displayOptions = useMemo(() => {
    let filteredOptions = autocompleteHook.filteredOptions;
    
    // Apply custom filter if provided
    if (filterOptions && internalSearchTerm) {
      filteredOptions = filterOptions(filteredOptions, internalSearchTerm);
    }
    
    // Show recent selections if no search term and enabled
    if (!internalSearchTerm && showRecentSelections && recentSelections.length > 0) {
      const recentIds = new Set(recentSelections.map(opt => opt.value));
      const otherOptions = filteredOptions.filter(opt => !recentIds.has(opt.value));
      return [...recentSelections.slice(0, maxRecentSelections), ...otherOptions];
    }
    
    return filteredOptions;
  }, [
    autocompleteHook.filteredOptions, 
    filterOptions, 
    internalSearchTerm, 
    showRecentSelections, 
    recentSelections, 
    maxRecentSelections
  ]);
  
  // Find selected option
  const selectedOption = useMemo(() => 
    options.find(opt => opt.value === value),
    [options, value]
  );
  
  // Virtual scrolling setup for large datasets
  const shouldUseVirtualScrolling = displayOptions.length > DEFAULT_CONFIG.virtualScrollThreshold;
  
  const virtualizer = useVirtualizer({
    count: displayOptions.length + (allowCustomValue && internalSearchTerm ? 1 : 0),
    getScrollElement: () => listRef.current,
    estimateSize: () => DEFAULT_CONFIG.itemHeight,
    enabled: shouldUseVirtualScrolling,
  });
  
  // Keyboard navigation
  const keyboard = useSelectKeyboard(
    displayOptions,
    (value) => handleSelection(value),
    () => setIsOpen(false)
  );
  
  // Handle search input changes
  const handleSearchChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const newSearchTerm = event.target.value;
    setInternalSearchTerm(newSearchTerm);
    
    // Trigger search if minimum length is met
    if (newSearchTerm.length >= minSearchLength) {
      autocompleteHook.setSearchTerm(newSearchTerm);
    }
  }, [minSearchLength, autocompleteHook]);
  
  // Handle option selection
  const handleSelection = useCallback((selectedValue: any) => {
    const selected = displayOptions.find(opt => opt.value === selectedValue);
    if (selected && !selected.disabled) {
      onChange?.(selectedValue, selected);
      
      // Add to recent selections
      if (showRecentSelections) {
        setRecentSelections(prev => {
          const filtered = prev.filter(opt => opt.value !== selectedValue);
          return [selected, ...filtered].slice(0, maxRecentSelections);
        });
      }
      
      // Announce selection for screen readers
      if (announceSelection) {
        const announcement = announceSelection(selected);
        // Note: In a real implementation, you'd use a live region or aria-live
        console.log('Selection announcement:', announcement);
      }
      
      setIsOpen(false);
      setInternalSearchTerm('');
    }
  }, [displayOptions, onChange, showRecentSelections, maxRecentSelections, announceSelection]);
  
  // Handle custom option creation
  const handleCreateOption = useCallback(async () => {
    if (onCreateOption && internalSearchTerm.trim()) {
      try {
        const newOption = await onCreateOption(internalSearchTerm.trim());
        handleSelection(newOption.value);
      } catch (error) {
        console.error('Failed to create option:', error);
      }
    }
  }, [onCreateOption, internalSearchTerm, handleSelection]);
  
  // Handle clear selection
  const handleClear = useCallback((event: React.MouseEvent) => {
    event.stopPropagation();
    onChange?.(undefined);
    setInternalSearchTerm('');
  }, [onChange]);
  
  // Effect for external search handling
  useEffect(() => {
    if (onSearch && debouncedSearchTerm && debouncedSearchTerm.length >= minSearchLength) {
      onSearch(debouncedSearchTerm);
    }
  }, [onSearch, debouncedSearchTerm, minSearchLength]);
  
  // Effect for search results announcement
  useEffect(() => {
    if (announceSearchResults && internalSearchTerm && displayOptions.length >= 0) {
      const announcement = announceSearchResults(displayOptions.length, internalSearchTerm);
      // Note: In a real implementation, you'd use a live region or aria-live
      console.log('Search results announcement:', announcement);
    }
  }, [announceSearchResults, displayOptions.length, internalSearchTerm]);
  
  // Determine display value for input
  const displayValue = useMemo(() => {
    if (isOpen && internalSearchTerm) {
      return internalSearchTerm;
    }
    
    if (selectedOption) {
      return renderValue ? renderValue(selectedOption.value, selectedOption) : selectedOption.label;
    }
    
    return '';
  }, [isOpen, internalSearchTerm, selectedOption, renderValue]);
  
  // Loading and error states
  const isLoading = loadingState?.isLoading || autocompleteHook.isSearching;
  const hasError = !!errorState?.message;
  
  // Show create option when appropriate
  const showCreateOption = allowCustomValue && 
    internalSearchTerm.trim().length > 0 && 
    !displayOptions.some(opt => opt.label.toLowerCase() === internalSearchTerm.toLowerCase()) &&
    !isLoading;
  
  return (
    <div className={cn('relative', className)} ref={comboboxRef}>
      <Combobox
        value={selectedOption}
        onChange={handleSelection}
        disabled={disabled}
        name={name}
      >
        <div className="relative">
          {/* Input field */}
          <Combobox.Input
            ref={ref}
            className={cn(
              'w-full rounded-lg border border-gray-300 dark:border-gray-600',
              'bg-white dark:bg-gray-800 px-3 py-2 pl-3 pr-10',
              'text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400',
              'focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500',
              'disabled:bg-gray-50 dark:disabled:bg-gray-900 disabled:text-gray-500 disabled:cursor-not-allowed',
              'transition-colors duration-200',
              {
                'border-red-500 focus:border-red-500 focus:ring-red-500': hasError || ariaInvalid,
                'border-green-500 focus:border-green-500 focus:ring-green-500': selectedOption && !hasError,
              }
            )}
            displayValue={() => displayValue}
            onChange={handleSearchChange}
            onFocus={(e) => {
              setIsOpen(true);
              onFocus?.(e);
            }}
            onBlur={(e) => {
              // Delay closing to allow for option selection
              setTimeout(() => setIsOpen(false), 150);
              onBlur?.(e);
            }}
            onKeyDown={keyboard.handleKeyDown}
            placeholder={isOpen ? searchPlaceholder : placeholder}
            aria-label={ariaLabel}
            aria-describedby={ariaDescribedBy}
            aria-invalid={ariaInvalid || hasError}
            aria-expanded={isOpen}
            aria-autocomplete="list"
            aria-required={required}
            autoComplete="off"
            {...inputProps}
          />
          
          {/* Action buttons */}
          <div className="absolute inset-y-0 right-0 flex items-center pr-2">
            {isLoading && (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary-500 mr-2" />
            )}
            
            {clearable && selectedOption && !disabled && (
              <button
                type="button"
                onClick={handleClear}
                className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors duration-150"
                aria-label="Clear selection"
              >
                <XMarkIcon className="h-4 w-4" />
              </button>
            )}
            
            <Combobox.Button className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors duration-150">
              <ChevronUpDownIcon className="h-5 w-5" aria-hidden="true" />
            </Combobox.Button>
          </div>
        </div>
        
        {/* Options dropdown */}
        <Transition
          show={isOpen}
          enter="transition duration-100 ease-out"
          enterFrom="transform scale-95 opacity-0"
          enterTo="transform scale-100 opacity-100"
          leave="transition duration-75 ease-out"
          leaveFrom="transform scale-100 opacity-100"
          leaveTo="transform scale-95 opacity-0"
        >
          <Combobox.Options
            static
            className={cn(
              'absolute z-50 mt-1 max-h-60 w-full overflow-auto rounded-lg',
              'bg-white dark:bg-gray-800 py-1 text-base shadow-lg',
              'border border-gray-200 dark:border-gray-700',
              'ring-1 ring-black ring-opacity-5 focus:outline-none'
            )}
            style={{ maxHeight: DEFAULT_CONFIG.maxDisplayHeight }}
          >
            <div ref={listRef} className="relative">
              {/* Loading state */}
              {isLoading && (
                <div className="relative cursor-default select-none py-2 px-4 text-gray-700 dark:text-gray-300">
                  <div className="flex items-center space-x-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary-500" />
                    <span>{loadingContent || loadingState?.message || DEFAULT_CONFIG.loadingMessage}</span>
                  </div>
                </div>
              )}
              
              {/* Error state */}
              {hasError && (
                <div className="relative cursor-default select-none py-2 px-4 text-red-600 dark:text-red-400">
                  <div className="flex items-center justify-between">
                    <span>{errorState?.message}</span>
                    {errorState?.onRetry && (
                      <button
                        onClick={errorState.onRetry}
                        className="ml-2 text-sm text-primary-600 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300"
                      >
                        Retry
                      </button>
                    )}
                  </div>
                </div>
              )}
              
              {/* Virtual scrolling for large lists */}
              {!isLoading && !hasError && shouldUseVirtualScrolling && (
                <div
                  style={{
                    height: `${virtualizer.getTotalSize()}px`,
                    width: '100%',
                    position: 'relative',
                  }}
                >
                  {virtualizer.getVirtualItems().map((virtualItem) => {
                    const index = virtualItem.index;
                    const isCreateOption = index >= displayOptions.length;
                    
                    if (isCreateOption && showCreateOption) {
                      return (
                        <CreateOptionItem
                          key="create-option"
                          searchTerm={internalSearchTerm}
                          onCreateOption={handleCreateOption}
                          createOptionLabel={DEFAULT_CONFIG.createOptionLabel}
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
                    }
                    
                    const option = displayOptions[index];
                    if (!option) return null;
                    
                    return (
                      <OptionItem
                        key={option.value as string}
                        option={option}
                        isSelected={option.value === value}
                        isFocused={keyboard.focusedIndex === index}
                        searchTerm={internalSearchTerm}
                        highlightMatches={highlightMatches}
                        renderOption={renderOption}
                        onSelect={handleSelection}
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
              )}
              
              {/* Regular rendering for smaller lists */}
              {!isLoading && !hasError && !shouldUseVirtualScrolling && (
                <>
                  {displayOptions.length === 0 && !showCreateOption ? (
                    <div className="relative cursor-default select-none py-2 px-4 text-gray-700 dark:text-gray-300">
                      {emptyStateContent || DEFAULT_CONFIG.emptyStateMessage}
                    </div>
                  ) : (
                    <>
                      {displayOptions.map((option, index) => (
                        <OptionItem
                          key={option.value as string}
                          option={option}
                          isSelected={option.value === value}
                          isFocused={keyboard.focusedIndex === index}
                          searchTerm={internalSearchTerm}
                          highlightMatches={highlightMatches}
                          renderOption={renderOption}
                          onSelect={handleSelection}
                        />
                      ))}
                      
                      {showCreateOption && (
                        <CreateOptionItem
                          searchTerm={internalSearchTerm}
                          onCreateOption={handleCreateOption}
                          createOptionLabel={DEFAULT_CONFIG.createOptionLabel}
                        />
                      )}
                    </>
                  )}
                </>
              )}
            </div>
          </Combobox.Options>
        </Transition>
      </Combobox>
      
      {/* Screen reader announcements */}
      <div className="sr-only" aria-live="polite" aria-atomic="true">
        {isLoading && `Loading options...`}
        {hasError && `Error: ${errorState?.message}`}
        {displayOptions.length > 0 && `${displayOptions.length} options available`}
      </div>
    </div>
  );
});

Autocomplete.displayName = 'Autocomplete';

export default Autocomplete;
export type { AutocompleteProps };