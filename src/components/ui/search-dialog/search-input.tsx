'use client';

import React, { forwardRef, useCallback, useEffect, useRef, useState } from 'react';
import { UseFormReturn } from 'react-hook-form';
import { Search, X, Command, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

/**
 * Search input component props interface for comprehensive search functionality
 * with debouncing, accessibility, and keyboard navigation support
 */
export interface SearchInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'onChange' | 'value'> {
  /** Form instance from React Hook Form for controlled input handling */
  form?: UseFormReturn<any>;
  /** Field name for React Hook Form registration */
  name?: string;
  /** Debounced search callback triggered after 300ms delay */
  onSearch?: (value: string) => void;
  /** Immediate change callback for real-time updates */
  onChange?: (value: string) => void;
  /** Clear callback when clear button is clicked */
  onClear?: () => void;
  /** Escape key callback for dismissing search */
  onEscape?: () => void;
  /** Current search value (controlled mode) */
  value?: string;
  /** Default value for uncontrolled mode */
  defaultValue?: string;
  /** Whether search is currently loading */
  loading?: boolean;
  /** Show clear button when input has value */
  showClear?: boolean;
  /** Show search icon in prefix position */
  showSearchIcon?: boolean;
  /** Show keyboard shortcut hint (Cmd/Ctrl+K) */
  showShortcutHint?: boolean;
  /** Debounce delay in milliseconds (default: 300ms) */
  debounceMs?: number;
  /** Size variant for responsive design */
  size?: 'sm' | 'md' | 'lg';
  /** Visual variant for different contexts */
  variant?: 'default' | 'compact' | 'floating';
  /** Recent search suggestions for autocomplete */
  suggestions?: string[];
  /** Custom placeholder text with search context */
  placeholder?: string;
  /** Additional CSS classes */
  className?: string;
  /** Accessibility label for screen readers */
  'aria-label'?: string;
  /** ARIA described by for additional context */
  'aria-describedby'?: string;
}

/**
 * Debounced search input component with comprehensive accessibility features
 * Implements WCAG 2.1 AA compliance with keyboard navigation and screen reader support
 */
export const SearchInput = forwardRef<HTMLInputElement, SearchInputProps>(({
  form,
  name = 'search',
  onSearch,
  onChange,
  onClear,
  onEscape,
  value: controlledValue,
  defaultValue = '',
  loading = false,
  showClear = true,
  showSearchIcon = true,
  showShortcutHint = false,
  debounceMs = 300,
  size = 'md',
  variant = 'default',
  suggestions = [],
  placeholder = 'Search databases, tables, users...',
  className,
  disabled,
  'aria-label': ariaLabel,
  'aria-describedby': ariaDescribedBy,
  ...props
}, ref) => {
  // Internal state for uncontrolled mode
  const [internalValue, setInternalValue] = useState(defaultValue);
  const [isFocused, setIsFocused] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedSuggestionIndex, setSelectedSuggestionIndex] = useState(-1);
  
  // Refs for DOM manipulation and cleanup
  const inputRef = useRef<HTMLInputElement>(null);
  const debounceTimeoutRef = useRef<NodeJS.Timeout>();
  const suggestionsRef = useRef<HTMLDivElement>(null);

  // Combine refs for external and internal usage
  const combinedRef = useCallback((element: HTMLInputElement | null) => {
    inputRef.current = element;
    if (typeof ref === 'function') {
      ref(element);
    } else if (ref) {
      ref.current = element;
    }
  }, [ref]);

  // Determine current value (controlled vs uncontrolled)
  const currentValue = controlledValue !== undefined ? controlledValue : internalValue;
  
  // Get form field value if using React Hook Form
  const formValue = form && name ? form.watch(name) : undefined;
  const displayValue = formValue !== undefined ? formValue : currentValue;

  /**
   * Debounced search handler with 300ms delay for optimal performance
   * Prevents excessive API calls while maintaining responsive UI
   */
  const handleDebouncedSearch = useCallback((searchValue: string) => {
    // Clear existing timeout
    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current);
    }

    // Set new timeout for debounced search
    debounceTimeoutRef.current = setTimeout(() => {
      onSearch?.(searchValue);
    }, debounceMs);
  }, [onSearch, debounceMs]);

  /**
   * Input change handler with immediate updates and debounced search
   * Supports both controlled and uncontrolled modes
   */
  const handleInputChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = event.target.value;

    // Update form value if using React Hook Form
    if (form && name) {
      form.setValue(name, newValue, { shouldValidate: true });
    }

    // Update internal state for uncontrolled mode
    if (controlledValue === undefined) {
      setInternalValue(newValue);
    }

    // Immediate change callback
    onChange?.(newValue);

    // Trigger debounced search
    handleDebouncedSearch(newValue);

    // Show suggestions if value exists and we have suggestions
    setShowSuggestions(newValue.length > 0 && suggestions.length > 0);
    setSelectedSuggestionIndex(-1);
  }, [form, name, controlledValue, onChange, handleDebouncedSearch, suggestions.length]);

  /**
   * Clear input handler with proper cleanup and callbacks
   * Ensures all state is reset and callbacks are triggered
   */
  const handleClear = useCallback(() => {
    // Clear form value if using React Hook Form
    if (form && name) {
      form.setValue(name, '', { shouldValidate: true });
    }

    // Clear internal state
    if (controlledValue === undefined) {
      setInternalValue('');
    }

    // Clear debounce timeout
    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current);
    }

    // Hide suggestions
    setShowSuggestions(false);
    setSelectedSuggestionIndex(-1);

    // Trigger callbacks
    onChange?.('');
    onClear?.();

    // Maintain focus on input after clear
    inputRef.current?.focus();
  }, [form, name, controlledValue, onChange, onClear]);

  /**
   * Keyboard navigation handler for accessibility and shortcuts
   * Implements Cmd/Ctrl+K global shortcut and arrow key navigation
   */
  const handleKeyDown = useCallback((event: React.KeyboardEvent<HTMLInputElement>) => {
    switch (event.key) {
      case 'Escape':
        // Dismiss search or clear input
        if (displayValue) {
          handleClear();
        } else {
          onEscape?.();
        }
        setShowSuggestions(false);
        break;

      case 'ArrowDown':
        if (showSuggestions && suggestions.length > 0) {
          event.preventDefault();
          setSelectedSuggestionIndex(prev => 
            prev < suggestions.length - 1 ? prev + 1 : 0
          );
        }
        break;

      case 'ArrowUp':
        if (showSuggestions && suggestions.length > 0) {
          event.preventDefault();
          setSelectedSuggestionIndex(prev => 
            prev > 0 ? prev - 1 : suggestions.length - 1
          );
        }
        break;

      case 'Enter':
        if (showSuggestions && selectedSuggestionIndex >= 0) {
          event.preventDefault();
          const selectedSuggestion = suggestions[selectedSuggestionIndex];
          if (selectedSuggestion) {
            // Update value with selected suggestion
            if (form && name) {
              form.setValue(name, selectedSuggestion, { shouldValidate: true });
            } else if (controlledValue === undefined) {
              setInternalValue(selectedSuggestion);
            }
            onChange?.(selectedSuggestion);
            onSearch?.(selectedSuggestion);
            setShowSuggestions(false);
          }
        }
        break;

      case 'k':
        // Global keyboard shortcut (Cmd/Ctrl+K)
        if ((event.metaKey || event.ctrlKey) && showShortcutHint) {
          event.preventDefault();
          inputRef.current?.focus();
        }
        break;
    }

    // Call original onKeyDown if provided
    props.onKeyDown?.(event);
  }, [displayValue, handleClear, onEscape, showSuggestions, suggestions, selectedSuggestionIndex, form, name, controlledValue, onChange, onSearch, showShortcutHint, props]);

  /**
   * Suggestion selection handler for mouse interactions
   * Provides alternative to keyboard navigation
   */
  const handleSuggestionSelect = useCallback((suggestion: string) => {
    // Update value with selected suggestion
    if (form && name) {
      form.setValue(name, suggestion, { shouldValidate: true });
    } else if (controlledValue === undefined) {
      setInternalValue(suggestion);
    }
    
    onChange?.(suggestion);
    onSearch?.(suggestion);
    setShowSuggestions(false);
    setSelectedSuggestionIndex(-1);
    
    // Return focus to input
    inputRef.current?.focus();
  }, [form, name, controlledValue, onChange, onSearch]);

  /**
   * Focus handlers for proper accessibility and UX
   * Manages focus states and suggestion visibility
   */
  const handleFocus = useCallback((event: React.FocusEvent<HTMLInputElement>) => {
    setIsFocused(true);
    if (displayValue && suggestions.length > 0) {
      setShowSuggestions(true);
    }
    props.onFocus?.(event);
  }, [displayValue, suggestions.length, props]);

  const handleBlur = useCallback((event: React.FocusEvent<HTMLInputElement>) => {
    setIsFocused(false);
    // Delay hiding suggestions to allow clicks on suggestion items
    setTimeout(() => {
      setShowSuggestions(false);
      setSelectedSuggestionIndex(-1);
    }, 150);
    props.onBlur?.(event);
  }, [props]);

  /**
   * Global keyboard shortcut listener for Cmd/Ctrl+K
   * Enables global search activation from anywhere in the app
   */
  useEffect(() => {
    if (!showShortcutHint) return;

    const handleGlobalKeyDown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key === 'k') {
        event.preventDefault();
        inputRef.current?.focus();
      }
    };

    document.addEventListener('keydown', handleGlobalKeyDown);
    return () => document.removeEventListener('keydown', handleGlobalKeyDown);
  }, [showShortcutHint]);

  /**
   * Cleanup debounce timeout on unmount
   * Prevents memory leaks and unnecessary API calls
   */
  useEffect(() => {
    return () => {
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current);
      }
    };
  }, []);

  // Base styles with WCAG 2.1 AA compliant focus indicators
  const baseStyles = cn(
    'w-full rounded-lg border transition-all duration-200',
    'bg-white dark:bg-gray-900',
    'text-gray-900 dark:text-gray-100',
    'placeholder:text-gray-500 dark:placeholder:text-gray-400',
    'focus:outline-none focus:ring-2 focus:ring-primary-600 focus:ring-offset-2',
    'focus:border-primary-600 dark:focus:border-primary-400',
    'disabled:opacity-50 disabled:cursor-not-allowed',
    'border-gray-300 dark:border-gray-700',
    isFocused && 'ring-2 ring-primary-600 ring-offset-2 border-primary-600'
  );

  // Size variants with proper touch targets for mobile
  const sizeStyles = {
    sm: 'h-10 text-sm px-3',
    md: 'h-12 text-base px-4',
    lg: 'h-14 text-lg px-5'
  };

  // Variant styles for different use contexts
  const variantStyles = {
    default: '',
    compact: 'h-10 text-sm',
    floating: 'shadow-lg border-0 ring-1 ring-gray-200 dark:ring-gray-700'
  };

  // Padding adjustments for icons
  const paddingLeft = showSearchIcon ? 'pl-10' : '';
  const paddingRight = (showClear && displayValue) || loading ? 'pr-10' : showShortcutHint ? 'pr-20' : '';

  // Filter suggestions based on current input
  const filteredSuggestions = suggestions.filter(suggestion =>
    suggestion.toLowerCase().includes(displayValue.toLowerCase()) && 
    suggestion !== displayValue
  ).slice(0, 5); // Limit to 5 suggestions for UX

  return (
    <div className="relative w-full">
      {/* Main input container */}
      <div className="relative">
        {/* Search icon */}
        {showSearchIcon && (
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search 
              className="h-5 w-5 text-gray-400 dark:text-gray-500" 
              aria-hidden="true"
            />
          </div>
        )}

        {/* Main input element */}
        <input
          ref={combinedRef}
          type="text"
          value={displayValue}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          onFocus={handleFocus}
          onBlur={handleBlur}
          disabled={disabled}
          placeholder={placeholder}
          className={cn(
            baseStyles,
            sizeStyles[size],
            variantStyles[variant],
            paddingLeft,
            paddingRight,
            className
          )}
          aria-label={ariaLabel || 'Search input'}
          aria-describedby={ariaDescribedBy}
          aria-expanded={showSuggestions}
          aria-haspopup="listbox"
          aria-autocomplete="list"
          aria-activedescendant={
            selectedSuggestionIndex >= 0 
              ? `search-suggestion-${selectedSuggestionIndex}` 
              : undefined
          }
          role="combobox"
          {...props}
        />

        {/* Right side icons and controls */}
        <div className="absolute inset-y-0 right-0 flex items-center space-x-1 pr-3">
          {/* Loading indicator */}
          {loading && (
            <Loader2 
              className="h-5 w-5 text-gray-400 dark:text-gray-500 animate-spin" 
              aria-hidden="true"
            />
          )}

          {/* Clear button */}
          {showClear && displayValue && !loading && (
            <button
              type="button"
              onClick={handleClear}
              className={cn(
                'p-1 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800',
                'focus:outline-none focus:ring-2 focus:ring-primary-600 focus:ring-offset-1',
                'transition-colors duration-150'
              )}
              aria-label="Clear search"
              tabIndex={-1} // Prevent tab focus, use Escape key instead
            >
              <X className="h-4 w-4 text-gray-400 dark:text-gray-500" />
            </button>
          )}

          {/* Keyboard shortcut hint */}
          {showShortcutHint && !displayValue && !loading && (
            <div className="flex items-center space-x-1 text-xs text-gray-400 dark:text-gray-500">
              <Command className="h-3 w-3" aria-hidden="true" />
              <span>K</span>
            </div>
          )}
        </div>
      </div>

      {/* Suggestions dropdown */}
      {showSuggestions && filteredSuggestions.length > 0 && (
        <div
          ref={suggestionsRef}
          className={cn(
            'absolute z-50 w-full mt-1 bg-white dark:bg-gray-900',
            'border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg',
            'max-h-60 overflow-auto'
          )}
          role="listbox"
          aria-label="Search suggestions"
        >
          {filteredSuggestions.map((suggestion, index) => (
            <button
              key={suggestion}
              id={`search-suggestion-${index}`}
              type="button"
              onClick={() => handleSuggestionSelect(suggestion)}
              className={cn(
                'w-full px-4 py-3 text-left text-sm',
                'hover:bg-gray-50 dark:hover:bg-gray-800',
                'focus:outline-none focus:bg-gray-50 dark:focus:bg-gray-800',
                'transition-colors duration-150',
                'border-b border-gray-100 dark:border-gray-800 last:border-b-0',
                selectedSuggestionIndex === index && 'bg-gray-50 dark:bg-gray-800'
              )}
              role="option"
              aria-selected={selectedSuggestionIndex === index}
            >
              <div className="flex items-center space-x-2">
                <Search className="h-4 w-4 text-gray-400 dark:text-gray-500" aria-hidden="true" />
                <span className="text-gray-900 dark:text-gray-100">{suggestion}</span>
              </div>
            </button>
          ))}
        </div>
      )}

      {/* Screen reader announcements for search status */}
      <div
        aria-live="polite"
        aria-atomic="true"
        className="sr-only"
      >
        {loading && 'Searching...'}
        {showSuggestions && filteredSuggestions.length > 0 && 
          `${filteredSuggestions.length} suggestions available. Use arrow keys to navigate.`
        }
      </div>
    </div>
  );
});

SearchInput.displayName = 'SearchInput';

export default SearchInput;