'use client';

import React, {
  useState,
  useEffect,
  useRef,
  useCallback,
  useMemo,
  forwardRef,
  useImperativeHandle,
} from 'react';
import { MagnifyingGlassIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { cn } from '@/lib/utils';
import { useDebounce, useDebouncedCallback } from '@/hooks/use-debounce';
import { useTheme } from '@/hooks/use-theme';

/**
 * Search input component interfaces and types
 */
export interface SearchSuggestion {
  id: string;
  label: string;
  value: string;
  category?: string;
  description?: string;
  icon?: React.ReactNode;
}

export interface RecentSearch {
  id: string;
  query: string;
  timestamp: number;
  category?: string;
}

export interface SearchInputProps {
  /** Current search value */
  value?: string;
  /** Callback fired when search value changes */
  onChange?: (value: string) => void;
  /** Callback fired when search is triggered (debounced) */
  onSearch?: (query: string) => void;
  /** Callback fired when a suggestion is selected */
  onSuggestionSelect?: (suggestion: SearchSuggestion) => void;
  /** Callback fired when search input is cleared */
  onClear?: () => void;
  /** Callback fired when search input receives focus */
  onFocus?: () => void;
  /** Callback fired when search input loses focus */
  onBlur?: () => void;
  
  /** Placeholder text for the search input */
  placeholder?: string;
  /** Whether the search input is disabled */
  disabled?: boolean;
  /** Whether to show loading state */
  loading?: boolean;
  /** Error message to display */
  error?: string;
  
  /** Debounce delay in milliseconds */
  debounceDelay?: number;
  /** Maximum number of recent searches to store */
  maxRecentSearches?: number;
  /** Key for localStorage persistence of recent searches */
  recentSearchesKey?: string;
  
  /** Array of search suggestions */
  suggestions?: SearchSuggestion[];
  /** Whether to show recent searches when input is empty */
  showRecentSearches?: boolean;
  /** Whether to enable keyboard shortcuts */
  enableKeyboardShortcuts?: boolean;
  /** Whether to show clear button when input has value */
  showClearButton?: boolean;
  /** Whether to auto-focus the input on mount */
  autoFocus?: boolean;
  
  /** Custom class name for the container */
  className?: string;
  /** Custom class name for the input element */
  inputClassName?: string;
  /** Size variant of the search input */
  size?: 'sm' | 'md' | 'lg';
  /** Visual variant of the search input */
  variant?: 'outline' | 'filled' | 'ghost';
  
  /** ARIA label for accessibility */
  'aria-label'?: string;
  /** ARIA described by for accessibility */
  'aria-describedby'?: string;
  /** Custom role for ARIA */
  role?: string;
}

export interface SearchInputRef {
  /** Focus the search input */
  focus: () => void;
  /** Blur the search input */
  blur: () => void;
  /** Clear the search input value */
  clear: () => void;
  /** Get current input value */
  getValue: () => string;
  /** Set the input value */
  setValue: (value: string) => void;
}

/**
 * Specialized search input component with debounced input handling, keyboard shortcuts,
 * autocomplete functionality, and accessibility features optimized for search workflows.
 * 
 * Features:
 * - Debounced search input to prevent excessive API calls
 * - Keyboard shortcuts (Ctrl/Cmd+K for focus, Escape to clear)
 * - WCAG 2.1 AA accessibility compliance with search-specific ARIA attributes
 * - Recent searches dropdown with keyboard navigation
 * - Loading states with proper visual feedback
 * - Autocomplete and suggestion support
 * - Theme integration with dark/light mode support
 * - Responsive design with multiple size variants
 */
export const SearchInput = forwardRef<SearchInputRef, SearchInputProps>(
  (
    {
      value = '',
      onChange,
      onSearch,
      onSuggestionSelect,
      onClear,
      onFocus,
      onBlur,
      placeholder = 'Search...',
      disabled = false,
      loading = false,
      error,
      debounceDelay = 300,
      maxRecentSearches = 10,
      recentSearchesKey = 'search-history',
      suggestions = [],
      showRecentSearches = true,
      enableKeyboardShortcuts = true,
      showClearButton = true,
      autoFocus = false,
      className,
      inputClassName,
      size = 'md',
      variant = 'outline',
      'aria-label': ariaLabel = 'Search',
      'aria-describedby': ariaDescribedBy,
      role = 'searchbox',
      ...props
    },
    ref
  ) => {
    // State management
    const [inputValue, setInputValue] = useState(value);
    const [isFocused, setIsFocused] = useState(false);
    const [showDropdown, setShowDropdown] = useState(false);
    const [selectedSuggestionIndex, setSelectedSuggestionIndex] = useState(-1);
    const [recentSearches, setRecentSearches] = useState<RecentSearch[]>([]);
    
    // Refs
    const inputRef = useRef<HTMLInputElement>(null);
    const dropdownRef = useRef<HTMLDivElement>(null);
    const suggestionRefs = useRef<(HTMLLIElement | null)[]>([]);
    const ariaLiveRef = useRef<HTMLDivElement>(null);
    
    // Hooks
    const { theme } = useTheme();
    const debouncedValue = useDebounce(inputValue, debounceDelay);
    
    // Debounced search callback
    const { debouncedCallback: debouncedSearch } = useDebouncedCallback(
      (query: string) => {
        if (onSearch && query.trim()) {
          onSearch(query.trim());
        }
      },
      debounceDelay
    );

    // Update internal value when external value changes
    useEffect(() => {
      setInputValue(value);
    }, [value]);

    // Trigger search when debounced value changes
    useEffect(() => {
      if (debouncedValue !== value && debouncedValue.trim()) {
        debouncedSearch(debouncedValue);
      }
    }, [debouncedValue, value, debouncedSearch]);

    // Load recent searches from localStorage on mount
    useEffect(() => {
      try {
        const stored = localStorage.getItem(recentSearchesKey);
        if (stored) {
          const parsed = JSON.parse(stored) as RecentSearch[];
          setRecentSearches(parsed.slice(0, maxRecentSearches));
        }
      } catch (error) {
        console.warn('Failed to load recent searches:', error);
      }
    }, [recentSearchesKey, maxRecentSearches]);

    // Auto-focus on mount if enabled
    useEffect(() => {
      if (autoFocus && inputRef.current) {
        inputRef.current.focus();
      }
    }, [autoFocus]);

    // Keyboard shortcuts
    useEffect(() => {
      if (!enableKeyboardShortcuts) return;

      const handleGlobalKeyDown = (event: KeyboardEvent) => {
        // Ctrl/Cmd + K to focus search
        if ((event.ctrlKey || event.metaKey) && event.key === 'k') {
          event.preventDefault();
          inputRef.current?.focus();
        }
      };

      document.addEventListener('keydown', handleGlobalKeyDown);
      return () => document.removeEventListener('keydown', handleGlobalKeyDown);
    }, [enableKeyboardShortcuts]);

    // Click outside handler to close dropdown
    useEffect(() => {
      const handleClickOutside = (event: MouseEvent) => {
        if (
          dropdownRef.current &&
          !dropdownRef.current.contains(event.target as Node) &&
          !inputRef.current?.contains(event.target as Node)
        ) {
          setShowDropdown(false);
          setSelectedSuggestionIndex(-1);
        }
      };

      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Memoized suggestions and recent searches for dropdown
    const dropdownItems = useMemo(() => {
      const items: (SearchSuggestion | RecentSearch)[] = [];
      
      if (inputValue.trim()) {
        // Show suggestions when there's input
        items.push(...suggestions);
      } else if (showRecentSearches) {
        // Show recent searches when input is empty
        items.push(...recentSearches);
      }
      
      return items;
    }, [inputValue, suggestions, recentSearches, showRecentSearches]);

    // Save recent search
    const saveRecentSearch = useCallback((query: string) => {
      if (!query.trim()) return;

      const newSearch: RecentSearch = {
        id: `${Date.now()}-${Math.random()}`,
        query: query.trim(),
        timestamp: Date.now(),
      };

      setRecentSearches(prev => {
        const filtered = prev.filter(search => search.query !== query.trim());
        const updated = [newSearch, ...filtered].slice(0, maxRecentSearches);
        
        try {
          localStorage.setItem(recentSearchesKey, JSON.stringify(updated));
        } catch (error) {
          console.warn('Failed to save recent search:', error);
        }
        
        return updated;
      });
    }, [maxRecentSearches, recentSearchesKey]);

    // Clear input and close dropdown
    const clearInput = useCallback(() => {
      setInputValue('');
      setShowDropdown(false);
      setSelectedSuggestionIndex(-1);
      onChange?.('');
      onClear?.();
      inputRef.current?.focus();
      
      // Announce clear action to screen readers
      if (ariaLiveRef.current) {
        ariaLiveRef.current.textContent = 'Search cleared';
      }
    }, [onChange, onClear]);

    // Handle input value change
    const handleInputChange = useCallback(
      (event: React.ChangeEvent<HTMLInputElement>) => {
        const newValue = event.target.value;
        setInputValue(newValue);
        onChange?.(newValue);
        setSelectedSuggestionIndex(-1);
        
        // Show dropdown when user types or on focus with content
        if (newValue || dropdownItems.length > 0) {
          setShowDropdown(true);
        }
      },
      [onChange, dropdownItems.length]
    );

    // Handle input focus
    const handleInputFocus = useCallback(() => {
      setIsFocused(true);
      setShowDropdown(dropdownItems.length > 0);
      onFocus?.();
    }, [onFocus, dropdownItems.length]);

    // Handle input blur
    const handleInputBlur = useCallback(() => {
      setIsFocused(false);
      onBlur?.();
      // Delay hiding dropdown to allow for suggestion clicks
      setTimeout(() => setShowDropdown(false), 200);
    }, [onBlur]);

    // Handle suggestion selection
    const handleSuggestionSelect = useCallback(
      (item: SearchSuggestion | RecentSearch) => {
        const query = 'query' in item ? item.query : item.value;
        const suggestion = 'query' in item 
          ? { id: item.id, label: item.query, value: item.query }
          : item;
        
        setInputValue(query);
        onChange?.(query);
        setShowDropdown(false);
        setSelectedSuggestionIndex(-1);
        
        // Save to recent searches and trigger search
        saveRecentSearch(query);
        onSearch?.(query);
        onSuggestionSelect?.(suggestion as SearchSuggestion);
        
        // Announce selection to screen readers
        if (ariaLiveRef.current) {
          ariaLiveRef.current.textContent = `Selected: ${query}`;
        }
      },
      [onChange, onSearch, onSuggestionSelect, saveRecentSearch]
    );

    // Handle keyboard navigation
    const handleKeyDown = useCallback(
      (event: React.KeyboardEvent<HTMLInputElement>) => {
        switch (event.key) {
          case 'Escape':
            if (showDropdown) {
              setShowDropdown(false);
              setSelectedSuggestionIndex(-1);
            } else if (inputValue) {
              clearInput();
            }
            break;

          case 'ArrowDown':
            event.preventDefault();
            if (!showDropdown && dropdownItems.length > 0) {
              setShowDropdown(true);
            }
            setSelectedSuggestionIndex(prev => 
              prev < dropdownItems.length - 1 ? prev + 1 : prev
            );
            break;

          case 'ArrowUp':
            event.preventDefault();
            setSelectedSuggestionIndex(prev => 
              prev > 0 ? prev - 1 : -1
            );
            break;

          case 'Enter':
            event.preventDefault();
            if (selectedSuggestionIndex >= 0 && dropdownItems[selectedSuggestionIndex]) {
              handleSuggestionSelect(dropdownItems[selectedSuggestionIndex]);
            } else if (inputValue.trim()) {
              saveRecentSearch(inputValue);
              onSearch?.(inputValue.trim());
              setShowDropdown(false);
            }
            break;

          case 'Tab':
            setShowDropdown(false);
            setSelectedSuggestionIndex(-1);
            break;
        }
      },
      [
        showDropdown,
        dropdownItems,
        selectedSuggestionIndex,
        inputValue,
        clearInput,
        handleSuggestionSelect,
        saveRecentSearch,
        onSearch,
      ]
    );

    // Scroll selected suggestion into view
    useEffect(() => {
      if (selectedSuggestionIndex >= 0 && suggestionRefs.current[selectedSuggestionIndex]) {
        suggestionRefs.current[selectedSuggestionIndex]?.scrollIntoView({
          block: 'nearest',
          behavior: 'smooth',
        });
      }
    }, [selectedSuggestionIndex]);

    // Expose methods via ref
    useImperativeHandle(ref, () => ({
      focus: () => inputRef.current?.focus(),
      blur: () => inputRef.current?.blur(),
      clear: clearInput,
      getValue: () => inputValue,
      setValue: (newValue: string) => {
        setInputValue(newValue);
        onChange?.(newValue);
      },
    }), [inputValue, onChange, clearInput]);

    // Dynamic class names
    const containerClasses = cn(
      'relative w-full',
      className
    );

    const inputClasses = cn(
      // Base styles
      'w-full rounded-md border bg-background text-foreground placeholder:text-muted-foreground',
      'focus:outline-none focus:ring-2 focus:ring-offset-2',
      'disabled:cursor-not-allowed disabled:opacity-50',
      'transition-colors duration-200',
      
      // Size variants
      {
        'h-8 px-3 py-1 pl-8 text-sm': size === 'sm',
        'h-10 px-3 py-2 pl-9 text-sm': size === 'md',
        'h-12 px-4 py-3 pl-10 text-base': size === 'lg',
      },
      
      // Variant styles
      {
        'border-border focus:border-primary focus:ring-primary/20': variant === 'outline',
        'border-transparent bg-muted focus:bg-background focus:ring-primary/20': variant === 'filled',
        'border-transparent bg-transparent focus:bg-muted focus:ring-primary/20': variant === 'ghost',
      },
      
      // Error state
      {
        'border-destructive focus:border-destructive focus:ring-destructive/20': error,
      },
      
      // Focus state
      {
        'ring-2 ring-primary/20 border-primary': isFocused && !error,
      },
      
      inputClassName
    );

    const iconClasses = cn(
      'absolute left-2 top-1/2 -translate-y-1/2 text-muted-foreground',
      'pointer-events-none',
      {
        'h-3 w-3': size === 'sm',
        'h-4 w-4': size === 'md',
        'h-5 w-5': size === 'lg',
      }
    );

    const clearButtonClasses = cn(
      'absolute right-2 top-1/2 -translate-y-1/2',
      'rounded-full p-1 text-muted-foreground hover:text-foreground',
      'hover:bg-muted transition-colors duration-200',
      'focus:outline-none focus:ring-2 focus:ring-primary/20',
      {
        'h-5 w-5': size === 'sm',
        'h-6 w-6': size === 'md',
        'h-7 w-7': size === 'lg',
      }
    );

    const dropdownClasses = cn(
      'absolute top-full left-0 right-0 z-50 mt-1',
      'rounded-md border bg-popover text-popover-foreground shadow-lg',
      'max-h-60 overflow-y-auto',
      'animate-in fade-in-0 zoom-in-95 slide-in-from-top-2',
      {
        'text-sm': size === 'sm' || size === 'md',
        'text-base': size === 'lg',
      }
    );

    return (
      <div className={containerClasses}>
        {/* Search input */}
        <div className="relative">
          {/* Search icon */}
          <MagnifyingGlassIcon className={iconClasses} />
          
          {/* Loading spinner */}
          {loading && (
            <div className={cn(iconClasses, 'animate-spin')}>
              <div className="h-full w-full rounded-full border-2 border-muted-foreground border-t-transparent" />
            </div>
          )}
          
          {/* Input element */}
          <input
            ref={inputRef}
            type="text"
            value={inputValue}
            onChange={handleInputChange}
            onFocus={handleInputFocus}
            onBlur={handleInputBlur}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            disabled={disabled}
            className={inputClasses}
            role={role}
            aria-label={ariaLabel}
            aria-describedby={ariaDescribedBy}
            aria-expanded={showDropdown}
            aria-haspopup="listbox"
            aria-activedescendant={
              selectedSuggestionIndex >= 0
                ? `suggestion-${selectedSuggestionIndex}`
                : undefined
            }
            aria-autocomplete="list"
            autoComplete="off"
            spellCheck={false}
            {...props}
          />
          
          {/* Clear button */}
          {showClearButton && inputValue && !loading && (
            <button
              type="button"
              onClick={clearInput}
              className={clearButtonClasses}
              aria-label="Clear search"
              tabIndex={-1}
            >
              <XMarkIcon className="h-full w-full" />
            </button>
          )}
        </div>
        
        {/* Error message */}
        {error && (
          <div className="mt-1 text-sm text-destructive" role="alert">
            {error}
          </div>
        )}
        
        {/* Dropdown with suggestions/recent searches */}
        {showDropdown && dropdownItems.length > 0 && (
          <div ref={dropdownRef} className={dropdownClasses}>
            <ul role="listbox" aria-label="Search suggestions">
              {dropdownItems.map((item, index) => {
                const isRecent = 'query' in item;
                const displayText = isRecent ? item.query : item.label;
                const isSelected = index === selectedSuggestionIndex;
                
                return (
                  <li
                    key={item.id}
                    ref={el => { suggestionRefs.current[index] = el; }}
                    role="option"
                    aria-selected={isSelected}
                    id={`suggestion-${index}`}
                    className={cn(
                      'flex items-center gap-2 px-3 py-2 cursor-pointer',
                      'hover:bg-accent hover:text-accent-foreground',
                      'focus:bg-accent focus:text-accent-foreground',
                      {
                        'bg-accent text-accent-foreground': isSelected,
                      }
                    )}
                    onClick={() => handleSuggestionSelect(item)}
                    onMouseEnter={() => setSelectedSuggestionIndex(index)}
                  >
                    {/* Icon */}
                    {!isRecent && 'icon' in item && item.icon ? (
                      item.icon
                    ) : (
                      <MagnifyingGlassIcon 
                        className={cn('flex-shrink-0', {
                          'h-3 w-3': size === 'sm',
                          'h-4 w-4': size === 'md',
                          'h-5 w-5': size === 'lg',
                        })} 
                      />
                    )}
                    
                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="truncate font-medium">{displayText}</div>
                      {!isRecent && 'description' in item && item.description && (
                        <div className="text-xs text-muted-foreground truncate">
                          {item.description}
                        </div>
                      )}
                      {!isRecent && 'category' in item && item.category && (
                        <div className="text-xs text-muted-foreground">
                          in {item.category}
                        </div>
                      )}
                    </div>
                    
                    {/* Recent search indicator */}
                    {isRecent && (
                      <div className="text-xs text-muted-foreground">Recent</div>
                    )}
                  </li>
                );
              })}
            </ul>
          </div>
        )}
        
        {/* ARIA live region for announcements */}
        <div
          ref={ariaLiveRef}
          className="sr-only"
          aria-live="polite"
          aria-atomic="true"
        />
      </div>
    );
  }
);

SearchInput.displayName = 'SearchInput';

export default SearchInput;