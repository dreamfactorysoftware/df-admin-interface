'use client';

/**
 * Search Input Component
 * 
 * Specialized search input component with debouncing, keyboard shortcuts, and accessibility features.
 * Integrates with React Hook Form for optimal form handling and validation, supporting the DreamFactory
 * admin interface search functionality with WCAG 2.1 AA compliance.
 * 
 * Features:
 * - React Hook Form integration for debounced search input handling
 * - Keyboard shortcut support for global search trigger (Cmd/Ctrl+K)
 * - WCAG 2.1 AA accessibility with proper input labeling and focus management
 * - Debouncing implementation for performance optimization under 300ms delay
 * - Mobile-responsive design with appropriate touch targets and input behavior
 * - Clear button functionality with keyboard accessibility
 * - Loading indicator integration for search API calls
 * - Context-aware placeholder text with search suggestions
 * 
 * @fileoverview Search input component for React 19/Next.js 15.1 search dialog
 * @version 1.0.0
 * @author DreamFactory Admin Interface Team
 */

import React, { 
  useCallback, 
  useEffect, 
  useRef, 
  useState, 
  forwardRef, 
  useImperativeHandle,
  type KeyboardEvent,
  type ChangeEvent,
  type FocusEvent,
  type MouseEvent
} from 'react';
import { useController, type Control, type FieldPath, type FieldValues } from 'react-hook-form';
import { MagnifyingGlassIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { CommandLineIcon } from '@heroicons/react/24/solid';

import { useDebouncedCallback } from '@/hooks/use-debounce';
import { cn } from '@/lib/utils';
import type { SearchDialogState } from './types';

/**
 * Search input component props interface
 */
export interface SearchInputProps<TFieldValues extends FieldValues = FieldValues> {
  /** React Hook Form control instance */
  control?: Control<TFieldValues>;
  /** Field name for React Hook Form integration */
  name?: FieldPath<TFieldValues>;
  /** Placeholder text for the input */
  placeholder?: string;
  /** Whether the input is in loading state */
  loading?: boolean;
  /** Whether the input is disabled */
  disabled?: boolean;
  /** Whether to auto-focus the input when mounted */
  autoFocus?: boolean;
  /** Custom class names */
  className?: string;
  /** Search query change handler with debouncing */
  onSearch?: (query: string) => void;
  /** Input value change handler (immediate, not debounced) */
  onChange?: (value: string) => void;
  /** Clear input handler */
  onClear?: () => void;
  /** Focus event handler */
  onFocus?: (event: FocusEvent<HTMLInputElement>) => void;
  /** Blur event handler */
  onBlur?: (event: FocusEvent<HTMLInputElement>) => void;
  /** Keyboard event handler for shortcuts */
  onKeyDown?: (event: KeyboardEvent<HTMLInputElement>) => void;
  /** Debounce delay in milliseconds (default: 300) */
  debounceDelay?: number;
  /** Minimum query length to trigger search (default: 1) */
  minQueryLength?: number;
  /** Whether to show keyboard shortcut hint */
  showKeyboardHint?: boolean;
  /** Whether to show clear button */
  showClearButton?: boolean;
  /** Search suggestions to show in placeholder */
  suggestions?: string[];
  /** Current suggestion index for rotation */
  suggestionIndex?: number;
  /** ARIA label for accessibility */
  ariaLabel?: string;
  /** ARIA describedby for additional context */
  ariaDescribedBy?: string;
  /** Size variant */
  size?: 'sm' | 'md' | 'lg';
  /** Visual variant */
  variant?: 'default' | 'ghost' | 'outline';
  /** Test ID for testing */
  'data-testid'?: string;
}

/**
 * Search input ref interface for imperative control
 */
export interface SearchInputRef {
  /** Focus the input element */
  focus: () => void;
  /** Blur the input element */
  blur: () => void;
  /** Clear the input value */
  clear: () => void;
  /** Get the current input value */
  getValue: () => string;
  /** Set the input value */
  setValue: (value: string) => void;
  /** Select all text in the input */
  selectAll: () => void;
  /** Get the input element reference */
  getElement: () => HTMLInputElement | null;
}

/**
 * Default search suggestions for context-aware placeholders
 */
const DEFAULT_SUGGESTIONS = [
  'Search tables, fields, users...',
  'Find database connections...',
  'Look up API endpoints...',
  'Search system settings...',
  'Find user roles...',
  'Search applications...'
];

/**
 * Search Input Component
 * 
 * Provides a comprehensive search input with debouncing, accessibility features,
 * and React Hook Form integration for the DreamFactory admin interface.
 */
export const SearchInput = forwardRef<SearchInputRef, SearchInputProps>(
  ({
    control,
    name = 'search' as any,
    placeholder,
    loading = false,
    disabled = false,
    autoFocus = false,
    className,
    onSearch,
    onChange,
    onClear,
    onFocus,
    onBlur,
    onKeyDown,
    debounceDelay = 300,
    minQueryLength = 1,
    showKeyboardHint = true,
    showClearButton = true,
    suggestions = DEFAULT_SUGGESTIONS,
    suggestionIndex = 0,
    ariaLabel = 'Search DreamFactory resources',
    ariaDescribedBy,
    size = 'md',
    variant = 'default',
    'data-testid': testId = 'search-input',
  }, ref) => {
    
    // Input element reference
    const inputRef = useRef<HTMLInputElement>(null);
    
    // Internal state for non-form controlled usage
    const [internalValue, setInternalValue] = useState('');
    
    // React Hook Form integration
    const { field, fieldState } = control ? useController({
      control,
      name,
      defaultValue: '' as any,
    }) : { field: null, fieldState: null };
    
    // Current input value (from form or internal state)
    const currentValue = field?.value ?? internalValue;
    
    // Debounced search handler
    const debouncedSearch = useDebouncedCallback(
      (query: string) => {
        if (query.length >= minQueryLength && onSearch) {
          onSearch(query);
        } else if (query.length === 0 && onSearch) {
          // Clear search results when query is empty
          onSearch('');
        }
      },
      { delay: debounceDelay, trailing: true }
    );
    
    // Handle input value changes
    const handleInputChange = useCallback((event: ChangeEvent<HTMLInputElement>) => {
      const value = event.target.value;
      
      // Update form field or internal state
      if (field) {
        field.onChange(value);
      } else {
        setInternalValue(value);
      }
      
      // Call immediate change handler
      onChange?.(value);
      
      // Trigger debounced search
      debouncedSearch(value);
    }, [field, onChange, debouncedSearch]);
    
    // Handle clear button click
    const handleClear = useCallback((event?: MouseEvent<HTMLButtonElement>) => {
      event?.preventDefault();
      event?.stopPropagation();
      
      const newValue = '';
      
      // Update form field or internal state
      if (field) {
        field.onChange(newValue);
      } else {
        setInternalValue(newValue);
      }
      
      // Cancel any pending debounced search
      debouncedSearch.cancel();
      
      // Trigger immediate search clearing
      onSearch?.(newValue);
      onChange?.(newValue);
      onClear?.();
      
      // Focus the input after clearing
      inputRef.current?.focus();
    }, [field, debouncedSearch, onSearch, onChange, onClear]);
    
    // Handle keyboard shortcuts and navigation
    const handleKeyDown = useCallback((event: KeyboardEvent<HTMLInputElement>) => {
      // Handle Escape key to clear input
      if (event.key === 'Escape') {
        if (currentValue) {
          // Clear input if it has content
          handleClear();
          event.preventDefault();
          event.stopPropagation();
        }
        // If input is empty, let the event bubble up to close dialog
      }
      
      // Handle Cmd/Ctrl+K to focus (useful when focus moves away)
      if ((event.metaKey || event.ctrlKey) && event.key === 'k') {
        event.preventDefault();
        inputRef.current?.focus();
      }
      
      // Handle Cmd/Ctrl+A to select all
      if ((event.metaKey || event.ctrlKey) && event.key === 'a') {
        event.preventDefault();
        inputRef.current?.select();
      }
      
      // Handle Enter to trigger immediate search (bypass debounce)
      if (event.key === 'Enter') {
        event.preventDefault();
        debouncedSearch.cancel();
        if (currentValue.length >= minQueryLength && onSearch) {
          onSearch(currentValue);
        }
      }
      
      // Call external keyboard handler
      onKeyDown?.(event);
    }, [currentValue, handleClear, debouncedSearch, minQueryLength, onSearch, onKeyDown]);
    
    // Handle focus events
    const handleFocus = useCallback((event: FocusEvent<HTMLInputElement>) => {
      // Select all text on focus for easy replacement
      if (currentValue) {
        setTimeout(() => {
          event.target.select();
        }, 0);
      }
      
      onFocus?.(event);
    }, [currentValue, onFocus]);
    
    // Handle blur events
    const handleBlur = useCallback((event: FocusEvent<HTMLInputElement>) => {
      // Trigger any pending debounced search on blur
      debouncedSearch.flush();
      
      onBlur?.(event);
    }, [debouncedSearch, onBlur]);
    
    // Auto-focus on mount if requested
    useEffect(() => {
      if (autoFocus && inputRef.current) {
        // Use setTimeout to ensure the element is fully rendered
        setTimeout(() => {
          inputRef.current?.focus();
        }, 0);
      }
    }, [autoFocus]);
    
    // Cleanup debounced function on unmount
    useEffect(() => {
      return () => {
        debouncedSearch.cancel();
      };
    }, [debouncedSearch]);
    
    // Dynamic placeholder with suggestions
    const dynamicPlaceholder = placeholder || 
      (suggestions.length > 0 ? suggestions[suggestionIndex % suggestions.length] : 'Search...');
    
    // Imperative ref methods
    useImperativeHandle(ref, () => ({
      focus: () => {
        inputRef.current?.focus();
      },
      blur: () => {
        inputRef.current?.blur();
      },
      clear: () => {
        handleClear();
      },
      getValue: () => {
        return currentValue;
      },
      setValue: (value: string) => {
        if (field) {
          field.onChange(value);
        } else {
          setInternalValue(value);
        }
        debouncedSearch(value);
      },
      selectAll: () => {
        inputRef.current?.select();
      },
      getElement: () => {
        return inputRef.current;
      },
    }), [currentValue, field, handleClear, debouncedSearch]);
    
    // Style variants
    const sizeClasses = {
      sm: 'h-8 px-3 text-sm',
      md: 'h-10 px-4 text-base',
      lg: 'h-12 px-6 text-lg',
    };
    
    const variantClasses = {
      default: 'bg-white border-gray-300 focus:border-primary-500 focus:ring-primary-500',
      ghost: 'bg-transparent border-transparent focus:border-gray-300 focus:ring-gray-300',
      outline: 'bg-transparent border-gray-300 focus:border-primary-500 focus:ring-primary-500',
    };
    
    // Determine if we should show the clear button
    const shouldShowClearButton = showClearButton && currentValue && !loading;
    
    return (
      <div className={cn(
        'relative flex items-center w-full',
        className
      )}>
        {/* Search icon */}
        <div className="absolute left-3 flex items-center pointer-events-none">
          {loading ? (
            <div 
              className="animate-spin h-4 w-4 text-gray-400"
              aria-hidden="true"
            >
              <svg className="w-full h-full" viewBox="0 0 24 24">
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                  fill="none"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                />
              </svg>
            </div>
          ) : (
            <MagnifyingGlassIcon 
              className="h-4 w-4 text-gray-400" 
              aria-hidden="true"
            />
          )}
        </div>
        
        {/* Search input */}
        <input
          ref={inputRef}
          type="text"
          value={currentValue}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          onFocus={handleFocus}
          onBlur={handleBlur}
          disabled={disabled}
          placeholder={dynamicPlaceholder}
          aria-label={ariaLabel}
          aria-describedby={ariaDescribedBy}
          aria-invalid={fieldState?.invalid}
          aria-busy={loading}
          autoComplete="off"
          autoCorrect="off"
          autoCapitalize="off"
          spellCheck="false"
          data-testid={testId}
          className={cn(
            // Base styles
            'w-full pl-10 pr-12 border rounded-lg transition-all duration-200',
            'placeholder:text-gray-400 text-gray-900',
            'focus:outline-none focus:ring-1',
            
            // Size variant
            sizeClasses[size],
            
            // Visual variant
            variantClasses[variant],
            
            // State styles
            disabled && 'opacity-50 cursor-not-allowed',
            fieldState?.invalid && 'border-red-300 focus:border-red-500 focus:ring-red-500',
            
            // Dark mode support
            'dark:bg-gray-800 dark:border-gray-600 dark:text-gray-100',
            'dark:placeholder:text-gray-400',
            'dark:focus:border-primary-400 dark:focus:ring-primary-400',
            
            // Mobile optimizations
            'touch-manipulation', // Optimize for touch
            'text-base sm:text-sm', // Prevent zoom on iOS
          )}
          style={{
            // Ensure minimum touch target size (44px) on mobile
            minHeight: size === 'sm' ? '44px' : undefined,
          }}
        />
        
        {/* Right side content */}
        <div className="absolute right-3 flex items-center space-x-2">
          {/* Clear button */}
          {shouldShowClearButton && (
            <button
              type="button"
              onClick={handleClear}
              disabled={disabled}
              aria-label="Clear search"
              data-testid={`${testId}-clear`}
              className={cn(
                'flex items-center justify-center w-5 h-5 rounded-full',
                'text-gray-400 hover:text-gray-600 hover:bg-gray-100',
                'focus:outline-none focus:ring-1 focus:ring-primary-500 focus:ring-offset-1',
                'transition-all duration-150',
                'dark:hover:text-gray-300 dark:hover:bg-gray-700',
                disabled && 'opacity-50 cursor-not-allowed',
                // Ensure touch target is large enough
                'min-w-[44px] min-h-[44px] sm:min-w-[20px] sm:min-h-[20px]'
              )}
            >
              <XMarkIcon className="w-4 h-4" aria-hidden="true" />
            </button>
          )}
          
          {/* Keyboard shortcut hint */}
          {showKeyboardHint && !currentValue && !loading && (
            <div 
              className="hidden sm:flex items-center space-x-1 text-xs text-gray-400 pointer-events-none"
              aria-hidden="true"
            >
              <CommandLineIcon className="w-3 h-3" />
              <span>K</span>
            </div>
          )}
        </div>
        
        {/* Loading indicator overlay */}
        {loading && (
          <div 
            className="absolute inset-0 bg-white/50 dark:bg-gray-800/50 rounded-lg pointer-events-none"
            aria-hidden="true"
          />
        )}
        
        {/* Screen reader announcements */}
        <div className="sr-only" aria-live="polite" aria-atomic="true">
          {loading && 'Searching...'}
          {fieldState?.invalid && 'Search query is invalid'}
          {debouncedSearch.isPending() && 'Search will begin shortly'}
        </div>
      </div>
    );
  }
);

SearchInput.displayName = 'SearchInput';

export default SearchInput;