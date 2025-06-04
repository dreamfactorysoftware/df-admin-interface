'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { useController, UseControllerProps } from 'react-hook-form';
import { Search, X, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

// Types for search functionality - these will be replaced when the actual types are created
interface SearchState {
  query: string;
  isLoading: boolean;
  results: SearchResult[];
  error?: string;
}

interface SearchResult {
  id: string;
  title: string;
  type: string;
  path: string;
  description?: string;
}

// Hook interfaces - will be replaced when actual hooks are implemented
interface UseSearchReturn {
  searchState: SearchState;
  executeSearch: (query: string) => void;
  clearSearch: () => void;
}

interface UseDebounceReturn<T> {
  debouncedValue: T;
  setValue: (value: T) => void;
  cancel: () => void;
}

// Placeholder hooks - will be replaced when actual hooks are implemented
const useSearch = (): UseSearchReturn => {
  const [searchState, setSearchState] = useState<SearchState>({
    query: '',
    isLoading: false,
    results: [],
  });

  const executeSearch = useCallback((query: string) => {
    if (!query.trim()) {
      setSearchState(prev => ({ ...prev, query: '', results: [], isLoading: false }));
      return;
    }

    setSearchState(prev => ({ ...prev, query, isLoading: true }));
    
    // Simulate API call - replace with actual implementation
    setTimeout(() => {
      setSearchState(prev => ({ 
        ...prev, 
        isLoading: false,
        results: [] // Mock results would go here
      }));
    }, 500);
  }, []);

  const clearSearch = useCallback(() => {
    setSearchState({
      query: '',
      isLoading: false,
      results: [],
    });
  }, []);

  return { searchState, executeSearch, clearSearch };
};

const useDebounce = <T,>(value: T, delay: number): UseDebounceReturn<T> => {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return {
    debouncedValue,
    setValue: setDebouncedValue,
    cancel: () => {
      setDebouncedValue(value);
    }
  };
};

// Input component interface - will be replaced when actual component is available
interface InputProps {
  className?: string;
  placeholder?: string;
  value?: string;
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onKeyDown?: (e: React.KeyboardEvent<HTMLInputElement>) => void;
  disabled?: boolean;
  autoComplete?: string;
  'aria-label'?: string;
  'aria-describedby'?: string;
  'aria-expanded'?: boolean;
  'aria-autocomplete'?: 'none' | 'inline' | 'list' | 'both';
  role?: string;
  id?: string;
  type?: string;
}

// Base Input component - will be replaced when actual component is available
const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, ...props }, ref) => {
    return (
      <input
        ref={ref}
        className={cn(
          'flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm ring-offset-white placeholder:text-gray-500',
          'focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 focus:border-primary-500',
          'disabled:cursor-not-allowed disabled:opacity-50',
          'dark:border-gray-600 dark:bg-gray-800 dark:text-white dark:placeholder:text-gray-400',
          'dark:ring-offset-gray-900 dark:focus:ring-primary-400',
          className
        )}
        {...props}
      />
    );
  }
);
Input.displayName = 'Input';

// Form data interface
interface SearchFormData {
  searchQuery: string;
}

// SearchInput component props
interface SearchInputProps extends Omit<UseControllerProps<SearchFormData>, 'name'> {
  name?: 'searchQuery';
  placeholder?: string;
  className?: string;
  onSearchExecute?: (query: string) => void;
  disabled?: boolean;
  autoFocus?: boolean;
  'aria-label'?: string;
  id?: string;
}

/**
 * Search input component with React Hook Form integration, debounced input handling, and responsive design.
 * Provides the search field UI with proper accessibility attributes, loading states, and integration 
 * with the global search functionality. Features clean styling with Tailwind CSS and proper focus management.
 * 
 * @component
 * @example
 * ```tsx
 * // Basic usage with React Hook Form
 * const { control } = useForm<SearchFormData>();
 * 
 * <SearchInput
 *   control={control}
 *   placeholder="Search databases, services, schemas..."
 *   onSearchExecute={(query) => console.log('Searching for:', query)}
 * />
 * ```
 * 
 * @example
 * ```tsx
 * // With custom styling and accessibility
 * <SearchInput
 *   control={control}
 *   className="w-full max-w-lg"
 *   placeholder="Search all resources..."
 *   aria-label="Global search input"
 *   id="global-search"
 *   autoFocus
 * />
 * ```
 */
export const SearchInput: React.FC<SearchInputProps> = ({
  name = 'searchQuery',
  control,
  rules,
  defaultValue = '',
  placeholder = 'Search...',
  className,
  onSearchExecute,
  disabled = false,
  autoFocus = false,
  'aria-label': ariaLabel = 'Search input',
  id = 'search-input',
  ...controllerProps
}) => {
  // React Hook Form integration for controlled input with validation
  const {
    field: { value, onChange, onBlur, ref },
    fieldState: { error },
  } = useController({
    name,
    control,
    rules,
    defaultValue,
    ...controllerProps,
  });

  // Global search state management
  const { searchState, executeSearch, clearSearch } = useSearch();
  
  // Debounced input handling with 2000ms delay matching original Angular implementation
  const { debouncedValue } = useDebounce(value || '', 2000);

  // Execute search when debounced value changes
  useEffect(() => {
    if (debouncedValue) {
      executeSearch(debouncedValue);
      onSearchExecute?.(debouncedValue);
    } else if (debouncedValue === '') {
      clearSearch();
    }
  }, [debouncedValue, executeSearch, clearSearch, onSearchExecute]);

  // Handle input change
  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    onChange(newValue);
  }, [onChange]);

  // Handle clear search
  const handleClearSearch = useCallback(() => {
    onChange('');
    clearSearch();
    // Focus back to input after clearing
    ref.current?.focus();
  }, [onChange, clearSearch, ref]);

  // Handle keyboard navigation
  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Escape') {
      e.preventDefault();
      handleClearSearch();
    }
    // Additional keyboard handling can be added here for result navigation
  }, [handleClearSearch]);

  // Loading state indicators synchronized with React Query search operations
  const isLoading = searchState.isLoading;
  const hasValue = Boolean(value);
  const hasError = Boolean(error);

  return (
    <div className={cn('relative', className)}>
      {/* Search Input Field */}
      <div className="relative">
        {/* Search Icon */}
        <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
          <Search 
            className={cn(
              'h-4 w-4 transition-colors',
              hasError 
                ? 'text-red-500' 
                : isLoading 
                  ? 'text-primary-500' 
                  : 'text-gray-400 dark:text-gray-500'
            )}
            aria-hidden="true"
          />
        </div>

        {/* Input with Tailwind CSS form styling and responsive sizing */}
        <Input
          ref={ref}
          id={id}
          type="search"
          value={value || ''}
          onChange={handleInputChange}
          onBlur={onBlur}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          disabled={disabled}
          autoFocus={autoFocus}
          autoComplete="off"
          className={cn(
            'pl-10 pr-12', // Space for search and clear/loading icons
            'w-full',
            'transition-all duration-200',
            // Responsive sizing - mobile-optimized touch targets
            'min-h-[44px] sm:min-h-[40px]', // Touch-friendly on mobile
            'text-base sm:text-sm', // Prevent zoom on mobile
            // Error state styling
            hasError && 'border-red-500 focus:border-red-500 focus:ring-red-500',
            // Loading state styling
            isLoading && 'bg-gray-50 dark:bg-gray-800/50',
            // Focus styling with proper contrast ratio
            'focus:ring-2 focus:ring-primary-500 focus:ring-offset-2',
            // Disabled state
            disabled && 'opacity-50 cursor-not-allowed'
          )}
          // Accessibility compliance with proper ARIA labels and keyboard navigation support
          aria-label={ariaLabel}
          aria-describedby={error ? `${id}-error` : undefined}
          aria-expanded={searchState.results.length > 0}
          aria-autocomplete="list"
          role="searchbox"
        />

        {/* Loading/Clear Button Area */}
        <div className="absolute inset-y-0 right-0 flex items-center pr-3">
          {isLoading ? (
            // Loading state indicators during search operations
            <Loader2 
              className="h-4 w-4 animate-spin text-primary-500" 
              aria-hidden="true"
            />
          ) : hasValue ? (
            // Clear button when there's input
            <button
              type="button"
              onClick={handleClearSearch}
              disabled={disabled}
              className={cn(
                'flex items-center justify-center',
                'h-6 w-6 rounded-full',
                'text-gray-400 hover:text-gray-600',
                'dark:text-gray-500 dark:hover:text-gray-300',
                'transition-colors duration-200',
                'focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2',
                'disabled:opacity-50 disabled:cursor-not-allowed',
                // Mobile-optimized touch target
                'sm:h-5 sm:w-5'
              )}
              aria-label="Clear search"
            >
              <X className="h-3 w-3 sm:h-4 sm:w-4" />
            </button>
          ) : null}
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div
          id={`${id}-error`}
          className="mt-1 text-sm text-red-600 dark:text-red-400"
          role="alert"
          aria-live="polite"
        >
          {error.message}
        </div>
      )}

      {/* Screen Reader Status Updates */}
      <div
        className="sr-only"
        aria-live="polite"
        aria-atomic="true"
      >
        {isLoading && 'Searching...'}
        {searchState.results.length > 0 && 
          `Found ${searchState.results.length} result${searchState.results.length === 1 ? '' : 's'}`
        }
        {debouncedValue && searchState.results.length === 0 && !isLoading && 'No results found'}
      </div>
    </div>
  );
};

// Re-export for convenience
export default SearchInput;

// Type exports for external use
export type { SearchInputProps, SearchFormData, SearchResult, SearchState };