'use client';

import React, { useCallback, useEffect, useId, useRef } from 'react';
import { useController, useFormContext } from 'react-hook-form';
import { Search, X, Loader2, Clock } from 'lucide-react';
import { useSearch } from '@/hooks/use-search';
import { useDebouncedValue } from '@/hooks/use-debounce';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

/**
 * Search input configuration options
 */
export interface SearchInputConfig {
  /** Debounce delay in milliseconds for search input */
  debounceDelay: number;
  /** Placeholder text for the search input */
  placeholder: string;
  /** Whether to show search history suggestions */
  showHistory: boolean;
  /** Whether to show loading indicators */
  showLoadingStates: boolean;
  /** Whether to show clear button when input has value */
  showClearButton: boolean;
  /** Whether to focus input on mount */
  autoFocus: boolean;
  /** Maximum length of search input */
  maxLength: number;
}

/**
 * Default search input configuration matching Angular implementation
 */
const DEFAULT_CONFIG: SearchInputConfig = {
  debounceDelay: 2000, // 2000ms delay matching original Angular implementation
  placeholder: 'Search services, databases, tables, users...',
  showHistory: true,
  showLoadingStates: true,
  showClearButton: true,
  autoFocus: false,
  maxLength: 100,
};

/**
 * Search input form field props for React Hook Form integration
 */
export interface SearchInputFormProps {
  /** Field name for React Hook Form registration */
  name: string;
  /** Optional configuration overrides */
  config?: Partial<SearchInputConfig>;
  /** Additional CSS classes */
  className?: string;
  /** Custom placeholder text */
  placeholder?: string;
  /** Whether the input is disabled */
  disabled?: boolean;
  /** Error state for the input */
  error?: boolean;
  /** Error message to display */
  errorMessage?: string;
  /** Callback when search is triggered */
  onSearch?: (query: string) => void;
  /** Callback when input value changes */
  onChange?: (value: string) => void;
  /** Callback when input is cleared */
  onClear?: () => void;
  /** Callback when input receives focus */
  onFocus?: (event: React.FocusEvent<HTMLInputElement>) => void;
  /** Callback when input loses focus */
  onBlur?: (event: React.FocusEvent<HTMLInputElement>) => void;
  /** Test ID for component testing */
  'data-testid'?: string;
}

/**
 * Search input component with React Hook Form integration, debounced input handling, 
 * and responsive design. Provides the search field UI with proper accessibility 
 * attributes, loading states, and integration with the global search functionality.
 * 
 * Features:
 * - React Hook Form integration with useController for controlled input
 * - Debounced input handling with configurable delay (default 2000ms)
 * - Tailwind CSS styling with responsive design and dark mode support
 * - Loading state indicators synchronized with React Query search operations
 * - Accessibility compliance with ARIA labels and keyboard navigation
 * - Mobile-optimized touch targets and spacing
 * - Clear button functionality and search history integration
 * 
 * @param props - Search input component properties
 * @returns JSX element with fully integrated search input
 * 
 * @example
 * ```tsx
 * // Basic usage with React Hook Form
 * function SearchForm() {
 *   const form = useForm({
 *     defaultValues: { searchQuery: '' }
 *   });
 * 
 *   return (
 *     <FormProvider {...form}>
 *       <form onSubmit={form.handleSubmit(onSubmit)}>
 *         <SearchInputForm
 *           name="searchQuery"
 *           placeholder="Search DreamFactory resources..."
 *           onSearch={(query) => console.log('Search:', query)}
 *         />
 *       </form>
 *     </FormProvider>
 *   );
 * }
 * 
 * // Advanced usage with custom configuration
 * function AdvancedSearchForm() {
 *   return (
 *     <SearchInputForm
 *       name="search"
 *       config={{
 *         debounceDelay: 1000,
 *         showHistory: true,
 *         autoFocus: true,
 *       }}
 *       onSearch={handleSearch}
 *       onClear={handleClear}
 *       data-testid="global-search-input"
 *     />
 *   );
 * }
 * ```
 */
export function SearchInputForm({
  name,
  config = {},
  className,
  placeholder,
  disabled = false,
  error = false,
  errorMessage,
  onSearch,
  onChange,
  onClear,
  onFocus,
  onBlur,
  'data-testid': testId = 'search-input',
}: SearchInputFormProps) {
  // Merge configuration with defaults
  const searchConfig = { ...DEFAULT_CONFIG, ...config };
  
  // Generate unique IDs for accessibility
  const inputId = useId();
  const searchButtonId = useId();
  const clearButtonId = useId();
  const loadingId = useId();
  
  // Refs for DOM manipulation
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  
  // Get form context for React Hook Form integration
  const formContext = useFormContext();
  
  // React Hook Form controller for controlled input
  const {
    field: { value, onChange: fieldOnChange, onBlur: fieldOnBlur, ref },
    fieldState: { error: fieldError, isTouched },
  } = useController({
    name,
    control: formContext?.control,
    defaultValue: '',
  });
  
  // Global search hook integration
  const {
    query: globalQuery,
    setQuery: setGlobalQuery,
    isLoading: globalIsLoading,
    isPending: globalIsPending,
    debouncedQuery,
    results,
    history,
    addToHistory,
  } = useSearch({
    debounceDelay: searchConfig.debounceDelay,
    enableHistory: searchConfig.showHistory,
  });
  
  // Local debounced value for this specific input
  const { debouncedValue: localDebouncedValue, isPending: localIsPending } = useDebouncedValue(
    value || '',
    {
      delay: searchConfig.debounceDelay,
      trailing: true,
    }
  );
  
  // Determine loading state from global search or local debouncing
  const isLoading = searchConfig.showLoadingStates && (
    globalIsLoading || 
    globalIsPending || 
    localIsPending ||
    (localDebouncedValue !== value && value.length >= 2)
  );
  
  // Determine if we should show clear button
  const showClear = searchConfig.showClearButton && value && value.length > 0;
  
  // Determine final placeholder text
  const finalPlaceholder = placeholder || searchConfig.placeholder;
  
  // Handle input value changes
  const handleInputChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = event.target.value;
    
    // Update React Hook Form field
    fieldOnChange(newValue);
    
    // Update global search query if this is the main search input
    if (name === 'globalSearch' || name === 'searchQuery') {
      setGlobalQuery(newValue);
    }
    
    // Call custom onChange handler
    onChange?.(newValue);
  }, [fieldOnChange, setGlobalQuery, name, onChange]);
  
  // Handle input focus
  const handleFocus = useCallback((event: React.FocusEvent<HTMLInputElement>) => {
    fieldOnBlur();
    onFocus?.(event);
  }, [fieldOnBlur, onFocus]);
  
  // Handle input blur
  const handleBlur = useCallback((event: React.FocusEvent<HTMLInputElement>) => {
    fieldOnBlur();
    onBlur?.(event);
  }, [fieldOnBlur, onBlur]);
  
  // Handle clear button click
  const handleClear = useCallback(() => {
    // Clear React Hook Form field
    fieldOnChange('');
    
    // Clear global search if applicable
    if (name === 'globalSearch' || name === 'searchQuery') {
      setGlobalQuery('');
    }
    
    // Focus back to input
    inputRef.current?.focus();
    
    // Call custom clear handler
    onClear?.();
  }, [fieldOnChange, setGlobalQuery, name, onClear]);
  
  // Handle search execution when debounced value changes
  useEffect(() => {
    if (localDebouncedValue && localDebouncedValue.length >= 2) {
      // Add to search history if this resulted in results
      if (results && results.totalCount > 0) {
        addToHistory(localDebouncedValue);
      }
      
      // Call custom search handler
      onSearch?.(localDebouncedValue);
    }
  }, [localDebouncedValue, results, addToHistory, onSearch]);
  
  // Auto-focus if configured
  useEffect(() => {
    if (searchConfig.autoFocus && inputRef.current) {
      inputRef.current.focus();
    }
  }, [searchConfig.autoFocus]);
  
  // Handle keyboard shortcuts
  const handleKeyDown = useCallback((event: React.KeyboardEvent<HTMLInputElement>) => {
    switch (event.key) {
      case 'Escape':
        // Clear input and blur
        if (value) {
          event.preventDefault();
          handleClear();
        } else {
          inputRef.current?.blur();
        }
        break;
        
      case 'Enter':
        // Immediate search without waiting for debounce
        event.preventDefault();
        if (value && value.length >= 2) {
          onSearch?.(value);
          addToHistory(value);
        }
        break;
        
      default:
        // Let other keys pass through normally
        break;
    }
  }, [value, handleClear, onSearch, addToHistory]);
  
  // Calculate error state
  const hasError = error || !!fieldError || (isTouched && !!fieldError);
  const finalErrorMessage = errorMessage || fieldError?.message;
  
  return (
    <div 
      ref={containerRef}
      className={cn(
        'relative w-full',
        className
      )}
      data-testid={`${testId}-container`}
    >
      {/* Search Input */}
      <div className="relative">
        {/* Search Icon */}
        <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
          <Search 
            className={cn(
              'h-4 w-4 transition-colors',
              hasError 
                ? 'text-red-400' 
                : isLoading 
                  ? 'text-primary-500' 
                  : 'text-gray-400 dark:text-gray-500'
            )}
            aria-hidden="true"
          />
        </div>
        
        {/* Input Field */}
        <input
          ref={(node) => {
            ref(node);
            if (inputRef) {
              (inputRef as React.MutableRefObject<HTMLInputElement | null>).current = node;
            }
          }}
          id={inputId}
          type="text"
          value={value || ''}
          onChange={handleInputChange}
          onFocus={handleFocus}
          onBlur={handleBlur}
          onKeyDown={handleKeyDown}
          placeholder={finalPlaceholder}
          disabled={disabled}
          maxLength={searchConfig.maxLength}
          className={cn(
            // Base styles
            'w-full h-10 pl-10 pr-12 py-2 text-sm bg-white dark:bg-gray-800',
            'border border-gray-300 dark:border-gray-600 rounded-md',
            'placeholder:text-gray-400 dark:placeholder:text-gray-500',
            'text-gray-900 dark:text-gray-100',
            
            // Focus styles
            'focus:outline-none focus:ring-2 focus:ring-primary-500 dark:focus:ring-primary-400',
            'focus:border-transparent',
            
            // Error styles
            hasError && [
              'border-red-500 dark:border-red-400',
              'focus:ring-red-500 dark:focus:ring-red-400'
            ],
            
            // Loading styles
            isLoading && 'pr-20', // Extra space for loading indicator
            
            // Disabled styles
            disabled && [
              'cursor-not-allowed opacity-50',
              'bg-gray-50 dark:bg-gray-900'
            ],
            
            // Responsive design
            'text-base sm:text-sm', // Larger text on mobile for better usability
            'min-h-[44px] sm:min-h-[40px]', // Touch-friendly minimum height on mobile
            
            // Transition effects
            'transition-colors duration-200'
          )}
          aria-describedby={cn(
            hasError && `${inputId}-error`,
            isLoading && loadingId
          )}
          aria-invalid={hasError}
          aria-label={`Search input: ${finalPlaceholder}`}
          data-testid={testId}
        />
        
        {/* Right Side Icons */}
        <div className="absolute inset-y-0 right-0 flex items-center pr-3 space-x-1">
          {/* Loading Indicator */}
          {isLoading && (
            <div 
              id={loadingId}
              className="flex items-center space-x-1"
              aria-label="Search in progress"
              data-testid={`${testId}-loading`}
            >
              <Loader2 className="h-4 w-4 animate-spin text-primary-500" aria-hidden="true" />
              {localIsPending && (
                <Clock className="h-3 w-3 text-gray-400" aria-hidden="true" />
              )}
            </div>
          )}
          
          {/* Clear Button */}
          {showClear && !isLoading && (
            <button
              type="button"
              onClick={handleClear}
              className={cn(
                'flex items-center justify-center h-6 w-6',
                'text-gray-400 hover:text-gray-600 dark:hover:text-gray-300',
                'rounded-full hover:bg-gray-100 dark:hover:bg-gray-700',
                'transition-colors duration-200',
                'focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2',
                'focus:ring-offset-white dark:focus:ring-offset-gray-800'
              )}
              aria-label="Clear search input"
              data-testid={`${testId}-clear`}
            >
              <X className="h-4 w-4" aria-hidden="true" />
            </button>
          )}
        </div>
      </div>
      
      {/* Error Message */}
      {hasError && finalErrorMessage && (
        <div 
          id={`${inputId}-error`}
          className="mt-1 text-sm text-red-600 dark:text-red-400"
          role="alert"
          aria-live="polite"
          data-testid={`${testId}-error`}
        >
          {finalErrorMessage}
        </div>
      )}
      
      {/* Search Status for Screen Readers */}
      <div className="sr-only" aria-live="polite" aria-atomic="true">
        {isLoading && 'Searching...'}
        {localDebouncedValue && results && (
          `Found ${results.totalCount} results for "${localDebouncedValue}"`
        )}
        {hasError && `Search error: ${finalErrorMessage}`}
      </div>
      
      {/* Keyboard Shortcuts Hint */}
      <div className="sr-only">
        Press Enter to search immediately, or Escape to clear the input.
      </div>
    </div>
  );
}

/**
 * Standalone search input component without React Hook Form integration
 * Useful for components that don't use forms or need direct control over the search state
 */
export interface SearchInputProps {
  /** Current search value */
  value?: string;
  /** Callback when value changes */
  onChange?: (value: string) => void;
  /** Optional configuration overrides */
  config?: Partial<SearchInputConfig>;
  /** Additional CSS classes */
  className?: string;
  /** Custom placeholder text */
  placeholder?: string;
  /** Whether the input is disabled */
  disabled?: boolean;
  /** Error state for the input */
  error?: boolean;
  /** Error message to display */
  errorMessage?: string;
  /** Callback when search is triggered */
  onSearch?: (query: string) => void;
  /** Callback when input is cleared */
  onClear?: () => void;
  /** Callback when input receives focus */
  onFocus?: (event: React.FocusEvent<HTMLInputElement>) => void;
  /** Callback when input loses focus */
  onBlur?: (event: React.FocusEvent<HTMLInputElement>) => void;
  /** Test ID for component testing */
  'data-testid'?: string;
}

/**
 * Standalone search input component without React Hook Form dependency
 * 
 * @param props - Search input properties
 * @returns JSX element with search input functionality
 * 
 * @example
 * ```tsx
 * function SimpleSearch() {
 *   const [searchValue, setSearchValue] = useState('');
 * 
 *   return (
 *     <SearchInput
 *       value={searchValue}
 *       onChange={setSearchValue}
 *       onSearch={(query) => console.log('Searching for:', query)}
 *       placeholder="Search anything..."
 *     />
 *   );
 * }
 * ```
 */
export function SearchInput({
  value = '',
  onChange,
  config = {},
  className,
  placeholder,
  disabled = false,
  error = false,
  errorMessage,
  onSearch,
  onClear,
  onFocus,
  onBlur,
  'data-testid': testId = 'search-input-standalone',
}: SearchInputProps) {
  // Merge configuration with defaults
  const searchConfig = { ...DEFAULT_CONFIG, ...config };
  
  // Generate unique IDs for accessibility
  const inputId = useId();
  const loadingId = useId();
  
  // Refs for DOM manipulation
  const inputRef = useRef<HTMLInputElement>(null);
  
  // Local debounced value for search triggering
  const { debouncedValue, isPending } = useDebouncedValue(value, {
    delay: searchConfig.debounceDelay,
    trailing: true,
  });
  
  // Global search integration for loading states
  const { isLoading: globalIsLoading, addToHistory } = useSearch();
  
  // Determine loading state
  const isLoading = searchConfig.showLoadingStates && (
    globalIsLoading || 
    isPending ||
    (debouncedValue !== value && value.length >= 2)
  );
  
  // Determine if we should show clear button
  const showClear = searchConfig.showClearButton && value && value.length > 0;
  
  // Determine final placeholder text
  const finalPlaceholder = placeholder || searchConfig.placeholder;
  
  // Handle input value changes
  const handleInputChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = event.target.value;
    onChange?.(newValue);
  }, [onChange]);
  
  // Handle clear button click
  const handleClear = useCallback(() => {
    onChange?.('');
    inputRef.current?.focus();
    onClear?.();
  }, [onChange, onClear]);
  
  // Handle search execution when debounced value changes
  useEffect(() => {
    if (debouncedValue && debouncedValue.length >= 2) {
      onSearch?.(debouncedValue);
      addToHistory(debouncedValue);
    }
  }, [debouncedValue, onSearch, addToHistory]);
  
  // Auto-focus if configured
  useEffect(() => {
    if (searchConfig.autoFocus && inputRef.current) {
      inputRef.current.focus();
    }
  }, [searchConfig.autoFocus]);
  
  // Handle keyboard shortcuts
  const handleKeyDown = useCallback((event: React.KeyboardEvent<HTMLInputElement>) => {
    switch (event.key) {
      case 'Escape':
        if (value) {
          event.preventDefault();
          handleClear();
        } else {
          inputRef.current?.blur();
        }
        break;
        
      case 'Enter':
        event.preventDefault();
        if (value && value.length >= 2) {
          onSearch?.(value);
          addToHistory(value);
        }
        break;
        
      default:
        break;
    }
  }, [value, handleClear, onSearch, addToHistory]);
  
  return (
    <div 
      className={cn('relative w-full', className)}
      data-testid={`${testId}-container`}
    >
      {/* Search Input */}
      <div className="relative">
        {/* Search Icon */}
        <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
          <Search 
            className={cn(
              'h-4 w-4 transition-colors',
              error 
                ? 'text-red-400' 
                : isLoading 
                  ? 'text-primary-500' 
                  : 'text-gray-400 dark:text-gray-500'
            )}
            aria-hidden="true"
          />
        </div>
        
        {/* Input Field */}
        <input
          ref={inputRef}
          id={inputId}
          type="text"
          value={value}
          onChange={handleInputChange}
          onFocus={onFocus}
          onBlur={onBlur}
          onKeyDown={handleKeyDown}
          placeholder={finalPlaceholder}
          disabled={disabled}
          maxLength={searchConfig.maxLength}
          className={cn(
            // Base styles
            'w-full h-10 pl-10 pr-12 py-2 text-sm bg-white dark:bg-gray-800',
            'border border-gray-300 dark:border-gray-600 rounded-md',
            'placeholder:text-gray-400 dark:placeholder:text-gray-500',
            'text-gray-900 dark:text-gray-100',
            
            // Focus styles
            'focus:outline-none focus:ring-2 focus:ring-primary-500 dark:focus:ring-primary-400',
            'focus:border-transparent',
            
            // Error styles
            error && [
              'border-red-500 dark:border-red-400',
              'focus:ring-red-500 dark:focus:ring-red-400'
            ],
            
            // Loading styles
            isLoading && 'pr-20',
            
            // Disabled styles
            disabled && [
              'cursor-not-allowed opacity-50',
              'bg-gray-50 dark:bg-gray-900'
            ],
            
            // Responsive design
            'text-base sm:text-sm',
            'min-h-[44px] sm:min-h-[40px]',
            
            // Transition effects
            'transition-colors duration-200'
          )}
          aria-describedby={cn(
            error && `${inputId}-error`,
            isLoading && loadingId
          )}
          aria-invalid={error}
          aria-label={`Search input: ${finalPlaceholder}`}
          data-testid={testId}
        />
        
        {/* Right Side Icons */}
        <div className="absolute inset-y-0 right-0 flex items-center pr-3 space-x-1">
          {/* Loading Indicator */}
          {isLoading && (
            <div 
              id={loadingId}
              className="flex items-center space-x-1"
              aria-label="Search in progress"
              data-testid={`${testId}-loading`}
            >
              <Loader2 className="h-4 w-4 animate-spin text-primary-500" aria-hidden="true" />
              {isPending && (
                <Clock className="h-3 w-3 text-gray-400" aria-hidden="true" />
              )}
            </div>
          )}
          
          {/* Clear Button */}
          {showClear && !isLoading && (
            <button
              type="button"
              onClick={handleClear}
              className={cn(
                'flex items-center justify-center h-6 w-6',
                'text-gray-400 hover:text-gray-600 dark:hover:text-gray-300',
                'rounded-full hover:bg-gray-100 dark:hover:bg-gray-700',
                'transition-colors duration-200',
                'focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2',
                'focus:ring-offset-white dark:focus:ring-offset-gray-800'
              )}
              aria-label="Clear search input"
              data-testid={`${testId}-clear`}
            >
              <X className="h-4 w-4" aria-hidden="true" />
            </button>
          )}
        </div>
      </div>
      
      {/* Error Message */}
      {error && errorMessage && (
        <div 
          id={`${inputId}-error`}
          className="mt-1 text-sm text-red-600 dark:text-red-400"
          role="alert"
          aria-live="polite"
          data-testid={`${testId}-error`}
        >
          {errorMessage}
        </div>
      )}
      
      {/* Search Status for Screen Readers */}
      <div className="sr-only" aria-live="polite" aria-atomic="true">
        {isLoading && 'Searching...'}
        {error && `Search error: ${errorMessage}`}
      </div>
      
      {/* Keyboard Shortcuts Hint */}
      <div className="sr-only">
        Press Enter to search immediately, or Escape to clear the input.
      </div>
    </div>
  );
}

export default SearchInputForm;