/**
 * Advanced Search Input Component
 * 
 * Specialized search input component with search icon, clear functionality, and debounced
 * input handling. Optimized for search interfaces with proper keyboard shortcuts and 
 * accessibility features for search workflows.
 * 
 * Features:
 * - Debounced input handling to prevent excessive API calls
 * - Keyboard shortcut support (Ctrl/Cmd+K for focus, Escape for clear)
 * - WCAG 2.1 AA accessibility compliance with search-specific ARIA attributes
 * - Loading states with clear feedback without causing layout shifts
 * - Autocomplete functionality with keyboard and mouse navigation
 * - Recent searches dropdown with keyboard navigation
 * - Search-specific visual cues and animations
 * - ARIA live regions for dynamic content updates
 * 
 * @fileoverview Search input component for DreamFactory Admin Interface
 * @version 1.0.0
 * @since React 19.0.0, Next.js 15.1+, TypeScript 5.8+
 */

'use client';

import React, { 
  useState, 
  useRef, 
  useEffect, 
  useCallback, 
  useMemo, 
  useId,
  forwardRef,
  type KeyboardEvent,
  type MouseEvent,
  type FocusEvent,
  type ChangeEvent
} from 'react';
import { 
  Search, 
  X, 
  Loader2, 
  Clock, 
  ChevronDown, 
  ChevronUp,
  Command
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useDebouncedCallback, useDebouncedValue } from '@/hooks/use-debounce';
import { useTheme } from '@/hooks/use-theme';
import type { 
  InputProps, 
  InputSize, 
  InputVariant,
  InputState
} from './input.types';

// =============================================================================
// INTERFACES AND TYPES
// =============================================================================

/**
 * Search suggestion item interface
 */
export interface SearchSuggestion {
  /** Unique identifier for the suggestion */
  id: string;
  /** Display text for the suggestion */
  label: string;
  /** Optional description or subtitle */
  description?: string;
  /** Optional category grouping */
  category?: string;
  /** Optional icon component */
  icon?: React.ComponentType<{ className?: string }>;
  /** Additional data associated with suggestion */
  data?: any;
  /** Whether suggestion is disabled */
  disabled?: boolean;
}

/**
 * Recent search item interface
 */
export interface RecentSearch {
  /** Search query text */
  query: string;
  /** Timestamp when search was performed */
  timestamp: Date;
  /** Number of results returned */
  resultCount?: number;
  /** Optional metadata */
  metadata?: Record<string, any>;
}

/**
 * Search input configuration interface
 */
export interface SearchInputConfig {
  /** Enable debounced search handling */
  enableDebounce?: boolean;
  /** Debounce delay in milliseconds (default: 300) */
  debounceDelay?: number;
  /** Enable keyboard shortcuts */
  enableKeyboardShortcuts?: boolean;
  /** Enable recent searches functionality */
  enableRecentSearches?: boolean;
  /** Maximum number of recent searches to store */
  maxRecentSearches?: number;
  /** Enable autocomplete suggestions */
  enableAutocomplete?: boolean;
  /** Maximum number of suggestions to display */
  maxSuggestions?: number;
  /** Minimum characters before showing suggestions */
  minCharsForSuggestions?: number;
  /** Storage key for recent searches */
  recentSearchesStorageKey?: string;
}

/**
 * Search input props interface
 */
export interface SearchInputProps extends Omit<InputProps, 'type' | 'prefix' | 'suffix'> {
  /** Search input configuration */
  config?: SearchInputConfig;
  /** Current search value */
  value?: string;
  /** Search value change handler with debounced capability */
  onValueChange?: (value: string, immediate?: boolean) => void;
  /** Search submission handler */
  onSearch?: (query: string) => void;
  /** Clear search handler */
  onClear?: () => void;
  /** Focus change handler */
  onFocusChange?: (focused: boolean) => void;
  /** Suggestions data source */
  suggestions?: SearchSuggestion[];
  /** Suggestion selection handler */
  onSuggestionSelect?: (suggestion: SearchSuggestion) => void;
  /** Recent searches data source */
  recentSearches?: RecentSearch[];
  /** Recent search selection handler */
  onRecentSearchSelect?: (search: RecentSearch) => void;
  /** Loading state for search operations */
  isLoading?: boolean;
  /** Results count for accessibility */
  resultsCount?: number;
  /** Custom placeholder text */
  placeholder?: string;
  /** Search input size variant */
  size?: InputSize;
  /** Search input visual variant */
  variant?: InputVariant;
  /** Search input state */
  state?: InputState;
  /** Show search shortcut hint */
  showShortcutHint?: boolean;
  /** Custom className for the container */
  containerClassName?: string;
  /** Custom className for suggestions dropdown */
  suggestionsClassName?: string;
}

// =============================================================================
// DEFAULT CONFIGURATION
// =============================================================================

const DEFAULT_CONFIG: Required<SearchInputConfig> = {
  enableDebounce: true,
  debounceDelay: 300,
  enableKeyboardShortcuts: true,
  enableRecentSearches: true,
  maxRecentSearches: 10,
  enableAutocomplete: true,
  maxSuggestions: 8,
  minCharsForSuggestions: 2,
  recentSearchesStorageKey: 'df-admin-recent-searches',
};

// =============================================================================
// UTILITY FUNCTIONS
// =============================================================================

/**
 * Check if we're running in browser environment
 */
const isBrowser = (): boolean => typeof window !== 'undefined';

/**
 * Get stored recent searches from localStorage
 */
const getStoredRecentSearches = (storageKey: string): RecentSearch[] => {
  if (!isBrowser()) return [];
  
  try {
    const stored = localStorage.getItem(storageKey);
    if (!stored) return [];
    
    const parsed = JSON.parse(stored);
    return Array.isArray(parsed) ? parsed.map(item => ({
      ...item,
      timestamp: new Date(item.timestamp)
    })) : [];
  } catch {
    return [];
  }
};

/**
 * Store recent searches to localStorage
 */
const storeRecentSearches = (searches: RecentSearch[], storageKey: string): void => {
  if (!isBrowser()) return;
  
  try {
    localStorage.setItem(storageKey, JSON.stringify(searches));
  } catch {
    // Silently fail if localStorage is not available
  }
};

/**
 * Add a search to recent searches list
 */
const addToRecentSearches = (
  query: string,
  currentSearches: RecentSearch[],
  maxItems: number,
  resultCount?: number
): RecentSearch[] => {
  if (!query.trim()) return currentSearches;
  
  // Remove existing entry if present
  const filtered = currentSearches.filter(search => search.query !== query);
  
  // Add new entry at the beginning
  const newSearch: RecentSearch = {
    query: query.trim(),
    timestamp: new Date(),
    resultCount,
  };
  
  return [newSearch, ...filtered].slice(0, maxItems);
};

/**
 * Filter suggestions based on query
 */
const filterSuggestions = (
  suggestions: SearchSuggestion[],
  query: string,
  maxItems: number
): SearchSuggestion[] => {
  if (!query.trim()) return [];
  
  const lowerQuery = query.toLowerCase();
  
  return suggestions
    .filter(suggestion => 
      !suggestion.disabled &&
      (suggestion.label.toLowerCase().includes(lowerQuery) ||
       suggestion.description?.toLowerCase().includes(lowerQuery))
    )
    .slice(0, maxItems);
};

// =============================================================================
// MAIN COMPONENT
// =============================================================================

/**
 * Advanced Search Input Component
 */
export const SearchInput = forwardRef<HTMLInputElement, SearchInputProps>(({
  config: userConfig,
  value = '',
  onValueChange,
  onSearch,
  onClear,
  onFocusChange,
  suggestions = [],
  onSuggestionSelect,
  recentSearches: externalRecentSearches,
  onRecentSearchSelect,
  isLoading = false,
  resultsCount,
  placeholder = 'Search...',
  size = 'md',
  variant = 'outline',
  state = 'default',
  showShortcutHint = true,
  containerClassName,
  suggestionsClassName,
  disabled = false,
  className,
  id: externalId,
  'aria-label': ariaLabel,
  'aria-describedby': ariaDescribedBy,
  'data-testid': testId,
  ...restProps
}, ref) => {
  // =============================================================================
  // HOOKS AND STATE
  // =============================================================================
  
  const config = useMemo(() => ({ ...DEFAULT_CONFIG, ...userConfig }), [userConfig]);
  const { theme, resolvedTheme } = useTheme();
  
  // Generate unique IDs for accessibility
  const componentId = useId();
  const inputId = externalId || `search-input-${componentId}`;
  const listboxId = `${inputId}-listbox`;
  const liveRegionId = `${inputId}-live-region`;
  const descriptionId = `${inputId}-description`;
  
  // Refs
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const suggestionRefs = useRef<Record<string, HTMLLIElement>>({});
  
  // State management
  const [internalValue, setInternalValue] = useState(value);
  const [isFocused, setIsFocused] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [activeSuggestionIndex, setActiveSuggestionIndex] = useState(-1);
  const [showingSuggestions, setShowingSuggestions] = useState(true);
  const [internalRecentSearches, setInternalRecentSearches] = useState<RecentSearch[]>(() =>
    externalRecentSearches || getStoredRecentSearches(config.recentSearchesStorageKey)
  );
  
  // Imperative handle for ref forwarding
  React.useImperativeHandle(ref, () => inputRef.current!, []);
  
  // =============================================================================
  // DEBOUNCED HANDLERS
  // =============================================================================
  
  // Debounced value change handler
  const { debouncedValue: debouncedInternalValue, isPending } = useDebouncedValue(
    internalValue,
    { delay: config.enableDebounce ? config.debounceDelay : 0 }
  );
  
  // Debounced search callback
  const debouncedOnValueChange = useDebouncedCallback(
    (newValue: string) => {
      onValueChange?.(newValue, false);
    },
    { delay: config.enableDebounce ? config.debounceDelay : 0 }
  );
  
  // =============================================================================
  // COMPUTED VALUES
  // =============================================================================
  
  // Filter suggestions based on current input
  const filteredSuggestions = useMemo(() => {
    if (!config.enableAutocomplete || internalValue.length < config.minCharsForSuggestions) {
      return [];
    }
    return filterSuggestions(suggestions, internalValue, config.maxSuggestions);
  }, [suggestions, internalValue, config.enableAutocomplete, config.minCharsForSuggestions, config.maxSuggestions]);
  
  // Recent searches to display
  const displayRecentSearches = useMemo(() => {
    if (!config.enableRecentSearches || internalValue.length > 0) return [];
    return (externalRecentSearches || internalRecentSearches).slice(0, config.maxRecentSearches);
  }, [externalRecentSearches, internalRecentSearches, internalValue, config.enableRecentSearches, config.maxRecentSearches]);
  
  // Combined dropdown items
  const dropdownItems = useMemo(() => {
    const items: Array<{ type: 'suggestion' | 'recent'; data: SearchSuggestion | RecentSearch; index: number }> = [];
    
    if (showingSuggestions && filteredSuggestions.length > 0) {
      filteredSuggestions.forEach((suggestion, index) => {
        items.push({ type: 'suggestion', data: suggestion, index });
      });
    } else if (!showingSuggestions && displayRecentSearches.length > 0) {
      displayRecentSearches.forEach((search, index) => {
        items.push({ type: 'recent', data: search, index });
      });
    }
    
    return items;
  }, [showingSuggestions, filteredSuggestions, displayRecentSearches]);
  
  // Should show dropdown
  const shouldShowDropdown = useMemo(() => {
    return isFocused && showDropdown && dropdownItems.length > 0;
  }, [isFocused, showDropdown, dropdownItems.length]);
  
  // =============================================================================
  // EVENT HANDLERS
  // =============================================================================
  
  /**
   * Handle input value changes
   */
  const handleInputChange = useCallback((event: ChangeEvent<HTMLInputElement>) => {
    const newValue = event.target.value;
    setInternalValue(newValue);
    setActiveSuggestionIndex(-1);
    setShowingSuggestions(true);
    setShowDropdown(true);
    
    // Call immediate value change if provided
    onValueChange?.(newValue, true);
    
    // Trigger debounced callback
    debouncedOnValueChange(newValue);
  }, [onValueChange, debouncedOnValueChange]);
  
  /**
   * Handle input focus
   */
  const handleInputFocus = useCallback((event: FocusEvent<HTMLInputElement>) => {
    setIsFocused(true);
    setShowDropdown(true);
    setShowingSuggestions(internalValue.length >= config.minCharsForSuggestions);
    onFocusChange?.(true);
    restProps.onFocus?.(event);
  }, [internalValue.length, config.minCharsForSuggestions, onFocusChange, restProps]);
  
  /**
   * Handle input blur
   */
  const handleInputBlur = useCallback((event: FocusEvent<HTMLInputElement>) => {
    // Delay hiding dropdown to allow for suggestion clicks
    setTimeout(() => {
      setIsFocused(false);
      setShowDropdown(false);
      setActiveSuggestionIndex(-1);
      onFocusChange?.(false);
    }, 150);
    restProps.onBlur?.(event);
  }, [onFocusChange, restProps]);
  
  /**
   * Handle search submission
   */
  const handleSearch = useCallback((query: string = internalValue) => {
    if (!query.trim()) return;
    
    // Add to recent searches
    if (config.enableRecentSearches) {
      const updatedSearches = addToRecentSearches(
        query,
        externalRecentSearches || internalRecentSearches,
        config.maxRecentSearches,
        resultsCount
      );
      
      if (!externalRecentSearches) {
        setInternalRecentSearches(updatedSearches);
        storeRecentSearches(updatedSearches, config.recentSearchesStorageKey);
      }
    }
    
    setShowDropdown(false);
    setActiveSuggestionIndex(-1);
    onSearch?.(query);
  }, [internalValue, config.enableRecentSearches, config.maxRecentSearches, config.recentSearchesStorageKey, externalRecentSearches, internalRecentSearches, resultsCount, onSearch]);
  
  /**
   * Handle clear action
   */
  const handleClear = useCallback(() => {
    setInternalValue('');
    setActiveSuggestionIndex(-1);
    setShowDropdown(false);
    onValueChange?.('', true);
    onClear?.();
    inputRef.current?.focus();
  }, [onValueChange, onClear]);
  
  /**
   * Handle suggestion selection
   */
  const handleSuggestionSelect = useCallback((suggestion: SearchSuggestion) => {
    setInternalValue(suggestion.label);
    setShowDropdown(false);
    setActiveSuggestionIndex(-1);
    onValueChange?.(suggestion.label, true);
    onSuggestionSelect?.(suggestion);
    handleSearch(suggestion.label);
  }, [onValueChange, onSuggestionSelect, handleSearch]);
  
  /**
   * Handle recent search selection
   */
  const handleRecentSearchSelect = useCallback((search: RecentSearch) => {
    setInternalValue(search.query);
    setShowDropdown(false);
    setActiveSuggestionIndex(-1);
    onValueChange?.(search.query, true);
    onRecentSearchSelect?.(search);
    handleSearch(search.query);
  }, [onValueChange, onRecentSearchSelect, handleSearch]);
  
  /**
   * Handle keyboard navigation
   */
  const handleKeyDown = useCallback((event: KeyboardEvent<HTMLInputElement>) => {
    switch (event.key) {
      case 'ArrowDown':
        event.preventDefault();
        if (!shouldShowDropdown) {
          setShowDropdown(true);
          setShowingSuggestions(internalValue.length >= config.minCharsForSuggestions);
        } else {
          setActiveSuggestionIndex(prev => 
            prev < dropdownItems.length - 1 ? prev + 1 : 0
          );
        }
        break;
        
      case 'ArrowUp':
        event.preventDefault();
        if (shouldShowDropdown) {
          setActiveSuggestionIndex(prev => 
            prev > 0 ? prev - 1 : dropdownItems.length - 1
          );
        }
        break;
        
      case 'Enter':
        event.preventDefault();
        if (shouldShowDropdown && activeSuggestionIndex >= 0) {
          const item = dropdownItems[activeSuggestionIndex];
          if (item.type === 'suggestion') {
            handleSuggestionSelect(item.data as SearchSuggestion);
          } else {
            handleRecentSearchSelect(item.data as RecentSearch);
          }
        } else {
          handleSearch();
        }
        break;
        
      case 'Escape':
        event.preventDefault();
        if (shouldShowDropdown) {
          setShowDropdown(false);
          setActiveSuggestionIndex(-1);
        } else {
          handleClear();
        }
        break;
        
      case 'Tab':
        if (shouldShowDropdown && activeSuggestionIndex >= 0) {
          event.preventDefault();
          const item = dropdownItems[activeSuggestionIndex];
          if (item.type === 'suggestion') {
            setInternalValue((item.data as SearchSuggestion).label);
            onValueChange?.((item.data as SearchSuggestion).label, true);
          } else {
            setInternalValue((item.data as RecentSearch).query);
            onValueChange?.((item.data as RecentSearch).query, true);
          }
          setShowDropdown(false);
          setActiveSuggestionIndex(-1);
        }
        break;
        
      default:
        break;
    }
    
    restProps.onKeyDown?.(event);
  }, [shouldShowDropdown, activeSuggestionIndex, dropdownItems, internalValue.length, config.minCharsForSuggestions, handleSuggestionSelect, handleRecentSearchSelect, handleSearch, handleClear, onValueChange, restProps]);
  
  // =============================================================================
  // KEYBOARD SHORTCUTS
  // =============================================================================
  
  useEffect(() => {
    if (!config.enableKeyboardShortcuts) return;
    
    const handleGlobalKeyDown = (event: globalThis.KeyboardEvent) => {
      // Focus search input with Cmd/Ctrl + K
      if ((event.metaKey || event.ctrlKey) && event.key === 'k') {
        // Don't trigger if user is already typing in an input
        const target = event.target as HTMLElement;
        if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.contentEditable === 'true') {
          return;
        }
        
        event.preventDefault();
        inputRef.current?.focus();
        setShowDropdown(true);
        setShowingSuggestions(internalValue.length >= config.minCharsForSuggestions);
      }
    };
    
    document.addEventListener('keydown', handleGlobalKeyDown);
    return () => document.removeEventListener('keydown', handleGlobalKeyDown);
  }, [config.enableKeyboardShortcuts, internalValue.length, config.minCharsForSuggestions]);
  
  // =============================================================================
  // EFFECTS
  // =============================================================================
  
  // Sync external value changes
  useEffect(() => {
    if (value !== internalValue) {
      setInternalValue(value);
    }
  }, [value, internalValue]);
  
  // Sync debounced value changes
  useEffect(() => {
    if (config.enableDebounce && debouncedInternalValue !== value) {
      onValueChange?.(debouncedInternalValue, false);
    }
  }, [debouncedInternalValue, value, config.enableDebounce, onValueChange]);
  
  // Scroll active suggestion into view
  useEffect(() => {
    if (activeSuggestionIndex >= 0 && dropdownItems[activeSuggestionIndex]) {
      const activeItem = dropdownItems[activeSuggestionIndex];
      const elementId = activeItem.type === 'suggestion' 
        ? (activeItem.data as SearchSuggestion).id 
        : `recent-${activeItem.index}`;
      const element = suggestionRefs.current[elementId];
      element?.scrollIntoView({ block: 'nearest' });
    }
  }, [activeSuggestionIndex, dropdownItems]);
  
  // =============================================================================
  // SIZE AND VARIANT STYLES
  // =============================================================================
  
  const sizeStyles = {
    sm: {
      input: 'h-8 px-3 text-sm',
      icon: 'h-3.5 w-3.5',
      container: 'text-sm',
    },
    md: {
      input: 'h-10 px-3 text-sm',
      icon: 'h-4 w-4',
      container: 'text-sm',
    },
    lg: {
      input: 'h-11 px-4 text-base',
      icon: 'h-5 w-5',
      container: 'text-base',
    },
    xl: {
      input: 'h-12 px-4 text-base',
      icon: 'h-5 w-5',
      container: 'text-base',
    },
  };
  
  const variantStyles = {
    outline: 'border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800',
    filled: 'border-0 bg-gray-100 dark:bg-gray-700',
    ghost: 'border-0 bg-transparent hover:bg-gray-100 dark:hover:bg-gray-800',
    underlined: 'border-0 border-b-2 border-gray-300 dark:border-gray-600 bg-transparent rounded-none',
    floating: 'border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800',
  };
  
  const stateStyles = {
    default: '',
    focused: 'ring-2 ring-primary-500 border-primary-500',
    error: 'border-red-500 ring-2 ring-red-500',
    success: 'border-green-500 ring-2 ring-green-500',
    warning: 'border-yellow-500 ring-2 ring-yellow-500',
    disabled: 'opacity-50 cursor-not-allowed',
    readonly: 'bg-gray-50 dark:bg-gray-700',
    loading: 'cursor-wait',
  };
  
  const currentSizeStyles = sizeStyles[size];
  const currentVariantStyles = variantStyles[variant];
  const currentStateStyles = stateStyles[isFocused ? 'focused' : state];
  
  // =============================================================================
  // RENDER
  // =============================================================================
  
  return (
    <div 
      ref={containerRef}
      className={cn(
        'relative w-full',
        currentSizeStyles.container,
        containerClassName
      )}
      data-testid={testId ? `${testId}-container` : 'search-input-container'}
    >
      {/* Search Input */}
      <div className="relative">
        {/* Search Icon */}
        <div className={cn(
          'absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500 pointer-events-none',
          isLoading && 'hidden'
        )}>
          <Search className={currentSizeStyles.icon} />
        </div>
        
        {/* Loading Spinner */}
        {isLoading && (
          <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-primary-500">
            <Loader2 className={cn(currentSizeStyles.icon, 'animate-spin')} />
          </div>
        )}
        
        {/* Input Element */}
        <input
          ref={inputRef}
          id={inputId}
          type="text"
          value={internalValue}
          onChange={handleInputChange}
          onFocus={handleInputFocus}
          onBlur={handleInputBlur}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          disabled={disabled}
          className={cn(
            // Base styles
            'w-full rounded-md transition-all duration-200 ease-in-out',
            'text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400',
            'focus:outline-none focus:ring-2 focus:ring-offset-0',
            // Size styles
            currentSizeStyles.input,
            // Variant styles
            currentVariantStyles,
            // State styles
            currentStateStyles,
            // Padding adjustments for icons
            'pl-10 pr-16',
            // Custom className
            className
          )}
          role="searchbox"
          aria-label={ariaLabel || 'Search input'}
          aria-describedby={cn(
            ariaDescribedBy,
            descriptionId,
            shouldShowDropdown && listboxId
          )}
          aria-expanded={shouldShowDropdown}
          aria-autocomplete="list"
          aria-controls={shouldShowDropdown ? listboxId : undefined}
          aria-activedescendant={
            shouldShowDropdown && activeSuggestionIndex >= 0
              ? dropdownItems[activeSuggestionIndex]?.type === 'suggestion'
                ? (dropdownItems[activeSuggestionIndex].data as SearchSuggestion).id
                : `recent-${dropdownItems[activeSuggestionIndex].index}`
              : undefined
          }
          data-testid={testId}
          {...restProps}
        />
        
        {/* Right Side Icons */}
        <div className="absolute right-2 top-1/2 transform -translate-y-1/2 flex items-center space-x-1">
          {/* Clear Button */}
          {internalValue && (
            <button
              type="button"
              onClick={handleClear}
              className={cn(
                'p-1 rounded-full text-gray-400 hover:text-gray-600 dark:hover:text-gray-300',
                'focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-1',
                'transition-colors duration-150'
              )}
              aria-label="Clear search"
              data-testid={testId ? `${testId}-clear-button` : 'search-clear-button'}
            >
              <X className={currentSizeStyles.icon} />
            </button>
          )}
          
          {/* Keyboard Shortcut Hint */}
          {showShortcutHint && !internalValue && !isFocused && (
            <div className={cn(
              'hidden sm:flex items-center space-x-1 px-2 py-1 rounded',
              'bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400',
              'text-xs font-medium'
            )}>
              <Command className="h-3 w-3" />
              <span>K</span>
            </div>
          )}
        </div>
      </div>
      
      {/* Dropdown */}
      {shouldShowDropdown && (
        <div className={cn(
          'absolute z-50 w-full mt-1 max-h-64 overflow-auto',
          'bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700',
          'rounded-md shadow-lg ring-1 ring-black ring-opacity-5',
          'focus:outline-none',
          suggestionsClassName
        )}>
          <ul
            id={listboxId}
            role="listbox"
            aria-label={showingSuggestions ? 'Search suggestions' : 'Recent searches'}
            className="py-1"
            data-testid={testId ? `${testId}-suggestions` : 'search-suggestions'}
          >
            {/* Section Header */}
            {dropdownItems.length > 0 && (
              <li className="px-3 py-2 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide border-b border-gray-100 dark:border-gray-700">
                {showingSuggestions ? 'Suggestions' : 'Recent Searches'}
              </li>
            )}
            
            {/* Dropdown Items */}
            {dropdownItems.map((item, index) => {
              const isActive = index === activeSuggestionIndex;
              const itemData = item.data;
              
              if (item.type === 'suggestion') {
                const suggestion = itemData as SearchSuggestion;
                return (
                  <li
                    key={suggestion.id}
                    ref={el => {
                      if (el) suggestionRefs.current[suggestion.id] = el;
                    }}
                    id={suggestion.id}
                    role="option"
                    aria-selected={isActive}
                    className={cn(
                      'flex items-center px-3 py-2 cursor-pointer text-sm',
                      'hover:bg-gray-100 dark:hover:bg-gray-700',
                      isActive && 'bg-primary-50 dark:bg-primary-900/20 text-primary-900 dark:text-primary-100'
                    )}
                    onClick={() => handleSuggestionSelect(suggestion)}
                    data-testid={`suggestion-${suggestion.id}`}
                  >
                    {suggestion.icon && (
                      <suggestion.icon className={cn(currentSizeStyles.icon, 'mr-3 text-gray-400')} />
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="font-medium truncate">{suggestion.label}</div>
                      {suggestion.description && (
                        <div className="text-xs text-gray-500 dark:text-gray-400 truncate">
                          {suggestion.description}
                        </div>
                      )}
                    </div>
                    {suggestion.category && (
                      <span className="ml-2 px-2 py-1 text-xs bg-gray-100 dark:bg-gray-700 rounded-full">
                        {suggestion.category}
                      </span>
                    )}
                  </li>
                );
              } else {
                const recentSearch = itemData as RecentSearch;
                return (
                  <li
                    key={`recent-${index}`}
                    ref={el => {
                      if (el) suggestionRefs.current[`recent-${index}`] = el;
                    }}
                    id={`recent-${index}`}
                    role="option"
                    aria-selected={isActive}
                    className={cn(
                      'flex items-center px-3 py-2 cursor-pointer text-sm',
                      'hover:bg-gray-100 dark:hover:bg-gray-700',
                      isActive && 'bg-primary-50 dark:bg-primary-900/20 text-primary-900 dark:text-primary-100'
                    )}
                    onClick={() => handleRecentSearchSelect(recentSearch)}
                    data-testid={`recent-search-${index}`}
                  >
                    <Clock className={cn(currentSizeStyles.icon, 'mr-3 text-gray-400')} />
                    <div className="flex-1 min-w-0">
                      <div className="font-medium truncate">{recentSearch.query}</div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">
                        {recentSearch.resultCount !== undefined && (
                          <span>{recentSearch.resultCount} results • </span>
                        )}
                        {recentSearch.timestamp.toLocaleDateString()}
                      </div>
                    </div>
                  </li>
                );
              }
            })}
            
            {/* Toggle between suggestions and recent searches */}
            {config.enableAutocomplete && config.enableRecentSearches && (
              <li className="border-t border-gray-100 dark:border-gray-700">
                <button
                  type="button"
                  className="w-full flex items-center justify-center px-3 py-2 text-xs text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700"
                  onClick={() => setShowingSuggestions(!showingSuggestions)}
                  data-testid="toggle-suggestions-recent"
                >
                  {showingSuggestions ? (
                    <>
                      <Clock className="h-3 w-3 mr-1" />
                      Show Recent Searches
                    </>
                  ) : (
                    <>
                      <Search className="h-3 w-3 mr-1" />
                      Show Suggestions
                    </>
                  )}
                  {showingSuggestions ? <ChevronDown className="h-3 w-3 ml-1" /> : <ChevronUp className="h-3 w-3 ml-1" />}
                </button>
              </li>
            )}
          </ul>
        </div>
      )}
      
      {/* Screen Reader Description */}
      <div
        id={descriptionId}
        className="sr-only"
        aria-live="polite"
        aria-atomic="true"
      >
        {isFocused && (
          <>
            Search input is focused. 
            {config.enableKeyboardShortcuts && 'Press Escape to clear. '}
            {shouldShowDropdown && 'Use arrow keys to navigate suggestions. Press Enter to select. '}
            {isPending && 'Search is being processed. '}
            {resultsCount !== undefined && `${resultsCount} results available.`}
          </>
        )}
      </div>
      
      {/* Live Region for Dynamic Updates */}
      <div
        id={liveRegionId}
        className="sr-only"
        aria-live="polite"
        aria-atomic="false"
        data-testid={testId ? `${testId}-live-region` : 'search-live-region'}
      >
        {isLoading && 'Searching...'}
        {shouldShowDropdown && dropdownItems.length > 0 && (
          `${dropdownItems.length} ${showingSuggestions ? 'suggestions' : 'recent searches'} available`
        )}
        {resultsCount !== undefined && !isLoading && `Search completed. ${resultsCount} results found.`}
      </div>
    </div>
  );
});

SearchInput.displayName = 'SearchInput';

// =============================================================================
// EXPORTS
// =============================================================================

export default SearchInput;
export type { SearchInputProps, SearchSuggestion, RecentSearch, SearchInputConfig };