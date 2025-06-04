/**
 * Select Component Utilities
 * 
 * Pure utility functions for select components including option filtering, value transformation,
 * group processing, and accessibility helpers. Optimized for performance with large option lists
 * (1000+ items) and WCAG 2.1 AA compliance.
 * 
 * @module SelectUtils
 */

import { cn } from '@/lib/utils';

// ============================================================================
// Types (inferred from Angular patterns and requirements)
// ============================================================================

export interface SelectOption<T = any> {
  value: T;
  label: string;
  description?: string;
  icon?: string;
  disabled?: boolean;
  group?: string;
  altValue?: string; // For HTTP verb transformations
  metadata?: Record<string, any>;
}

export interface SelectGroup {
  label: string;
  options: SelectOption[];
  disabled?: boolean;
}

export interface FilterOptions {
  caseSensitive?: boolean;
  fuzzySearch?: boolean;
  maxResults?: number;
  searchFields?: ('label' | 'description' | 'value')[];
}

export interface ValidationConstraints {
  required?: boolean;
  minSelections?: number;
  maxSelections?: number;
  allowedValues?: any[];
  customValidator?: (value: any) => string | null;
}

export interface AccessibilityAttributes {
  'aria-label'?: string;
  'aria-labelledby'?: string;
  'aria-describedby'?: string;
  'aria-expanded'?: boolean;
  'aria-selected'?: boolean;
  'aria-activedescendant'?: string;
  'aria-invalid'?: boolean;
  'aria-required'?: boolean;
  'aria-disabled'?: boolean;
  role?: string;
}

// ============================================================================
// Option Filtering and Search
// ============================================================================

/**
 * Filters options based on search query with fuzzy search support
 * Optimized for large datasets (1000+ options) using efficient string matching
 * 
 * @param options - Array of options to filter
 * @param query - Search query string
 * @param filterOptions - Configuration options for filtering
 * @returns Filtered array of options
 */
export function filterOptions<T>(
  options: SelectOption<T>[],
  query: string,
  filterOptions: FilterOptions = {}
): SelectOption<T>[] {
  if (!query || query.trim() === '') {
    return options.slice(0, filterOptions.maxResults);
  }

  const {
    caseSensitive = false,
    fuzzySearch = true,
    maxResults = 100,
    searchFields = ['label', 'description', 'value']
  } = filterOptions;

  const normalizedQuery = caseSensitive ? query : query.toLowerCase();
  const results: Array<{ option: SelectOption<T>; score: number }> = [];

  for (const option of options) {
    if (option.disabled) continue;

    let bestScore = 0;

    for (const field of searchFields) {
      const fieldValue = String(option[field] || '');
      const normalizedValue = caseSensitive ? fieldValue : fieldValue.toLowerCase();

      let score = 0;

      // Exact match gets highest score
      if (normalizedValue === normalizedQuery) {
        score = 100;
      }
      // Starts with query gets high score
      else if (normalizedValue.startsWith(normalizedQuery)) {
        score = 80;
      }
      // Contains query gets medium score
      else if (normalizedValue.includes(normalizedQuery)) {
        score = 60;
      }
      // Fuzzy search for partial matches
      else if (fuzzySearch && fuzzyMatch(normalizedValue, normalizedQuery)) {
        score = 40;
      }

      bestScore = Math.max(bestScore, score);
    }

    if (bestScore > 0) {
      results.push({ option, score: bestScore });
    }

    // Early exit if we have enough high-quality results
    if (results.length >= maxResults * 2) {
      break;
    }
  }

  // Sort by score (descending) and return options
  return results
    .sort((a, b) => b.score - a.score)
    .slice(0, maxResults)
    .map(result => result.option);
}

/**
 * Simple fuzzy matching algorithm for partial string matches
 * @param text - Text to search within
 * @param pattern - Pattern to search for
 * @returns Boolean indicating if pattern fuzzy matches text
 */
function fuzzyMatch(text: string, pattern: string): boolean {
  let textIndex = 0;
  let patternIndex = 0;

  while (textIndex < text.length && patternIndex < pattern.length) {
    if (text[textIndex] === pattern[patternIndex]) {
      patternIndex++;
    }
    textIndex++;
  }

  return patternIndex === pattern.length;
}

// ============================================================================
// Value Transformation Functions
// ============================================================================

/**
 * Transforms HTTP verb array to bitmask (Angular df-verb-picker pattern)
 * @param verbs - Array of HTTP verb strings
 * @returns Bitmask number representing selected verbs
 */
export function verbArrayToBitmask(verbs: string[]): number {
  const verbValues: Record<string, number> = {
    'GET': 1,
    'POST': 2,
    'PUT': 4,
    'PATCH': 8,
    'DELETE': 16
  };

  return verbs.reduce((mask, verb) => mask | (verbValues[verb] || 0), 0);
}

/**
 * Transforms bitmask to HTTP verb array (Angular df-verb-picker pattern)
 * @param bitmask - Bitmask number representing selected verbs
 * @returns Array of HTTP verb strings
 */
export function bitmaskToVerbArray(bitmask: number): string[] {
  const verbMap = [
    { value: 1, verb: 'GET' },
    { value: 2, verb: 'POST' },
    { value: 4, verb: 'PUT' },
    { value: 8, verb: 'PATCH' },
    { value: 16, verb: 'DELETE' }
  ];

  return verbMap
    .filter(item => (bitmask & item.value) === item.value)
    .map(item => item.verb);
}

/**
 * Transforms array values to comma-separated string
 * @param values - Array of values to join
 * @param separator - Separator string (default: ',')
 * @returns Comma-separated string
 */
export function arrayToString<T>(values: T[], separator: string = ','): string {
  return values.map(val => String(val)).join(separator);
}

/**
 * Transforms comma-separated string to array
 * @param value - Comma-separated string
 * @param separator - Separator string (default: ',')
 * @returns Array of trimmed string values
 */
export function stringToArray(value: string, separator: string = ','): string[] {
  if (!value || typeof value !== 'string') return [];
  return value.split(separator).map(item => item.trim()).filter(Boolean);
}

/**
 * Generic value transformer for different select types
 * @param value - Input value to transform
 * @param fromType - Source value type
 * @param toType - Target value type
 * @returns Transformed value
 */
export function transformValue(
  value: any,
  fromType: 'string' | 'array' | 'bitmask' | 'object',
  toType: 'string' | 'array' | 'bitmask' | 'object'
): any {
  if (fromType === toType) return value;

  // Handle null/undefined values
  if (value == null) {
    switch (toType) {
      case 'array': return [];
      case 'string': return '';
      case 'bitmask': return 0;
      case 'object': return null;
      default: return value;
    }
  }

  // Transform from array
  if (fromType === 'array' && Array.isArray(value)) {
    switch (toType) {
      case 'string': return arrayToString(value);
      case 'bitmask': return verbArrayToBitmask(value);
      case 'object': return { values: value };
      default: return value;
    }
  }

  // Transform from string
  if (fromType === 'string' && typeof value === 'string') {
    switch (toType) {
      case 'array': return stringToArray(value);
      case 'bitmask': return verbArrayToBitmask(stringToArray(value));
      case 'object': return { value };
      default: return value;
    }
  }

  // Transform from bitmask
  if (fromType === 'bitmask' && typeof value === 'number') {
    switch (toType) {
      case 'array': return bitmaskToVerbArray(value);
      case 'string': return arrayToString(bitmaskToVerbArray(value));
      case 'object': return { bitmask: value, verbs: bitmaskToVerbArray(value) };
      default: return value;
    }
  }

  // Transform from object
  if (fromType === 'object' && typeof value === 'object') {
    switch (toType) {
      case 'string': return value?.value || String(value);
      case 'array': return value?.values || [value];
      case 'bitmask': return value?.bitmask || 0;
      default: return value;
    }
  }

  return value;
}

// ============================================================================
// Option Processing and Grouping
// ============================================================================

/**
 * Normalizes option object structure for consistent processing
 * @param option - Raw option data (string, number, or object)
 * @returns Normalized SelectOption object
 */
export function normalizeOption<T>(option: T | SelectOption<T>): SelectOption<T> {
  // Already normalized
  if (typeof option === 'object' && option != null && 'value' in option && 'label' in option) {
    return option as SelectOption<T>;
  }

  // Primitive value
  if (typeof option === 'string' || typeof option === 'number' || typeof option === 'boolean') {
    return {
      value: option as T,
      label: String(option)
    };
  }

  // Object without proper structure
  if (typeof option === 'object' && option != null) {
    const obj = option as any;
    return {
      value: obj.value ?? obj.id ?? option,
      label: obj.label ?? obj.name ?? obj.title ?? String(obj.value ?? obj.id ?? option),
      description: obj.description ?? obj.desc,
      icon: obj.icon,
      disabled: obj.disabled ?? false,
      group: obj.group ?? obj.category,
      altValue: obj.altValue,
      metadata: obj.metadata
    };
  }

  // Fallback
  return {
    value: option as T,
    label: String(option)
  };
}

/**
 * Groups options by their group property
 * @param options - Array of options to group
 * @param ungroupedLabel - Label for ungrouped options (default: 'Other')
 * @returns Array of grouped options
 */
export function groupOptions<T>(
  options: SelectOption<T>[],
  ungroupedLabel: string = 'Other'
): SelectGroup[] {
  const groups = new Map<string, SelectOption<T>[]>();
  const ungrouped: SelectOption<T>[] = [];

  for (const option of options) {
    if (option.group) {
      if (!groups.has(option.group)) {
        groups.set(option.group, []);
      }
      groups.get(option.group)!.push(option);
    } else {
      ungrouped.push(option);
    }
  }

  const result: SelectGroup[] = [];

  // Add grouped options
  for (const [groupLabel, groupOptions] of groups.entries()) {
    result.push({
      label: groupLabel,
      options: groupOptions
    });
  }

  // Add ungrouped options if any
  if (ungrouped.length > 0) {
    result.push({
      label: ungroupedLabel,
      options: ungrouped
    });
  }

  return result;
}

/**
 * Flattens grouped options back to a single array
 * @param groups - Array of grouped options
 * @returns Flattened array of options
 */
export function flattenGroups<T>(groups: SelectGroup[]): SelectOption<T>[] {
  return groups.flatMap(group => group.options);
}

// ============================================================================
// Option Helper Functions
// ============================================================================

/**
 * Gets the display label for an option
 * @param option - Option object or value
 * @returns Display label string
 */
export function getOptionLabel<T>(option: T | SelectOption<T>): string {
  if (typeof option === 'object' && option != null && 'label' in option) {
    return (option as SelectOption<T>).label;
  }
  return String(option);
}

/**
 * Gets the value from an option
 * @param option - Option object or value
 * @returns Option value
 */
export function getOptionValue<T>(option: T | SelectOption<T>): T {
  if (typeof option === 'object' && option != null && 'value' in option) {
    return (option as SelectOption<T>).value;
  }
  return option as T;
}

/**
 * Finds option by value
 * @param options - Array of options to search
 * @param value - Value to find
 * @returns Found option or undefined
 */
export function findOptionByValue<T>(
  options: SelectOption<T>[],
  value: T
): SelectOption<T> | undefined {
  return options.find(option => option.value === value);
}

/**
 * Checks if option is selected
 * @param option - Option to check
 * @param selectedValues - Array of selected values or single value
 * @returns Boolean indicating if option is selected
 */
export function isOptionSelected<T>(
  option: SelectOption<T>,
  selectedValues: T | T[]
): boolean {
  if (Array.isArray(selectedValues)) {
    return selectedValues.includes(option.value);
  }
  return option.value === selectedValues;
}

// ============================================================================
// Accessibility Helpers
// ============================================================================

/**
 * Generates ARIA attributes for select components
 * @param config - Configuration object for ARIA attributes
 * @returns ARIA attributes object
 */
export function generateAriaAttributes(config: {
  label?: string;
  labelledBy?: string;
  describedBy?: string;
  expanded?: boolean;
  selected?: boolean;
  activeDescendant?: string;
  invalid?: boolean;
  required?: boolean;
  disabled?: boolean;
  role?: string;
}): AccessibilityAttributes {
  const attrs: AccessibilityAttributes = {};

  if (config.label) attrs['aria-label'] = config.label;
  if (config.labelledBy) attrs['aria-labelledby'] = config.labelledBy;
  if (config.describedBy) attrs['aria-describedby'] = config.describedBy;
  if (config.expanded !== undefined) attrs['aria-expanded'] = config.expanded;
  if (config.selected !== undefined) attrs['aria-selected'] = config.selected;
  if (config.activeDescendant) attrs['aria-activedescendant'] = config.activeDescendant;
  if (config.invalid !== undefined) attrs['aria-invalid'] = config.invalid;
  if (config.required !== undefined) attrs['aria-required'] = config.required;
  if (config.disabled !== undefined) attrs['aria-disabled'] = config.disabled;
  if (config.role) attrs.role = config.role;

  return attrs;
}

/**
 * Generates unique IDs for select component elements
 * @param baseId - Base ID string
 * @returns Object with generated IDs for various elements
 */
export function generateSelectIds(baseId: string) {
  return {
    select: baseId,
    label: `${baseId}-label`,
    description: `${baseId}-description`,
    error: `${baseId}-error`,
    listbox: `${baseId}-listbox`,
    option: (index: number) => `${baseId}-option-${index}`,
    group: (index: number) => `${baseId}-group-${index}`
  };
}

/**
 * Creates screen reader announcement for selection changes
 * @param selectedCount - Number of selected items
 * @param totalCount - Total number of available items
 * @param itemLabel - Label for individual items (default: 'item')
 * @returns Announcement string for screen readers
 */
export function createSelectionAnnouncement(
  selectedCount: number,
  totalCount: number,
  itemLabel: string = 'item'
): string {
  if (selectedCount === 0) {
    return `No ${itemLabel}s selected`;
  }
  
  if (selectedCount === 1) {
    return `1 ${itemLabel} selected`;
  }
  
  return `${selectedCount} ${itemLabel}s selected out of ${totalCount}`;
}

/**
 * Gets accessible name for option element
 * @param option - Option object
 * @param index - Option index
 * @param isSelected - Whether option is selected
 * @returns Accessible name string
 */
export function getAccessibleOptionName<T>(
  option: SelectOption<T>,
  index: number,
  isSelected: boolean
): string {
  let name = option.label;
  
  if (option.description) {
    name += `, ${option.description}`;
  }
  
  if (isSelected) {
    name += ', selected';
  }
  
  if (option.disabled) {
    name += ', disabled';
  }
  
  return name;
}

// ============================================================================
// Validation Functions
// ============================================================================

/**
 * Validates selection against constraints
 * @param value - Selected value(s)
 * @param constraints - Validation constraints
 * @returns Validation error message or null if valid
 */
export function validateSelection<T>(
  value: T | T[] | null | undefined,
  constraints: ValidationConstraints
): string | null {
  const {
    required = false,
    minSelections = 0,
    maxSelections = Infinity,
    allowedValues,
    customValidator
  } = constraints;

  // Check required
  if (required && (value == null || (Array.isArray(value) && value.length === 0))) {
    return 'Selection is required';
  }

  // If no value and not required, validation passes
  if (value == null || (Array.isArray(value) && value.length === 0)) {
    return null;
  }

  const values = Array.isArray(value) ? value : [value];

  // Check minimum selections
  if (values.length < minSelections) {
    return `At least ${minSelections} selection${minSelections !== 1 ? 's' : ''} required`;
  }

  // Check maximum selections
  if (values.length > maxSelections) {
    return `Maximum ${maxSelections} selection${maxSelections !== 1 ? 's' : ''} allowed`;
  }

  // Check allowed values
  if (allowedValues && allowedValues.length > 0) {
    const invalidValues = values.filter(v => !allowedValues.includes(v));
    if (invalidValues.length > 0) {
      return `Invalid selection: ${invalidValues.join(', ')}`;
    }
  }

  // Custom validation
  if (customValidator) {
    const customError = customValidator(value);
    if (customError) {
      return customError;
    }
  }

  return null;
}

/**
 * Checks if selection has reached maximum limit
 * @param currentSelection - Current selected values
 * @param maxSelections - Maximum allowed selections
 * @returns Boolean indicating if limit is reached
 */
export function isSelectionLimitReached<T>(
  currentSelection: T[],
  maxSelections: number
): boolean {
  return currentSelection.length >= maxSelections;
}

/**
 * Gets remaining selection slots
 * @param currentSelection - Current selected values
 * @param maxSelections - Maximum allowed selections
 * @returns Number of remaining slots
 */
export function getRemainingSelections<T>(
  currentSelection: T[],
  maxSelections: number
): number {
  return Math.max(0, maxSelections - currentSelection.length);
}

// ============================================================================
// Performance Optimization Helpers
// ============================================================================

/**
 * Creates a memoized version of option filtering for performance
 * @param options - Array of options
 * @param filterFn - Custom filter function
 * @returns Memoized filter function
 */
export function createMemoizedFilter<T>(
  options: SelectOption<T>[],
  filterFn?: (option: SelectOption<T>, query: string) => boolean
) {
  const cache = new Map<string, SelectOption<T>[]>();
  
  return (query: string, filterOptions?: FilterOptions): SelectOption<T>[] => {
    const cacheKey = `${query}:${JSON.stringify(filterOptions)}`;
    
    if (cache.has(cacheKey)) {
      return cache.get(cacheKey)!;
    }
    
    const result = filterFn 
      ? options.filter(option => filterFn(option, query))
      : filterOptions(options, query, filterOptions);
    
    // Limit cache size to prevent memory leaks
    if (cache.size > 100) {
      const firstKey = cache.keys().next().value;
      cache.delete(firstKey);
    }
    
    cache.set(cacheKey, result);
    return result;
  };
}

/**
 * Debounces option filtering for better performance with large datasets
 * @param filterFn - Filter function to debounce
 * @param delay - Debounce delay in milliseconds (default: 300ms)
 * @returns Debounced filter function
 */
export function debounceFilter<T>(
  filterFn: (query: string) => SelectOption<T>[],
  delay: number = 300
) {
  let timeoutId: NodeJS.Timeout;
  let lastResolve: ((value: SelectOption<T>[]) => void) | null = null;
  
  return (query: string): Promise<SelectOption<T>[]> => {
    return new Promise((resolve) => {
      // Cancel previous timeout and resolve
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
      
      // If there's a pending resolve, resolve it with empty array
      if (lastResolve) {
        lastResolve([]);
      }
      
      lastResolve = resolve;
      
      timeoutId = setTimeout(() => {
        const result = filterFn(query);
        resolve(result);
        lastResolve = null;
      }, delay);
    });
  };
}

// ============================================================================
// CSS Class Utilities
// ============================================================================

/**
 * Generates CSS classes for select component states
 * @param config - State configuration
 * @returns Merged CSS class string
 */
export function getSelectStateClasses(config: {
  isOpen?: boolean;
  isDisabled?: boolean;
  hasError?: boolean;
  isFocused?: boolean;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'default' | 'outlined' | 'filled';
}): string {
  const {
    isOpen = false,
    isDisabled = false,
    hasError = false,
    isFocused = false,
    size = 'md',
    variant = 'default'
  } = config;

  return cn(
    // Base classes
    'relative inline-flex items-center justify-between rounded-md border transition-colors duration-200',
    'focus-within:ring-2 focus-within:ring-offset-2',
    
    // Size variants
    {
      'h-9 px-3 text-sm': size === 'sm',
      'h-11 px-4 text-base': size === 'md',
      'h-13 px-5 text-lg': size === 'lg'
    },
    
    // Style variants
    {
      'bg-white border-gray-300 focus-within:border-primary-500 focus-within:ring-primary-500/20': 
        variant === 'default' && !hasError,
      'bg-transparent border-2 border-gray-300 focus-within:border-primary-500 focus-within:ring-primary-500/20': 
        variant === 'outlined' && !hasError,
      'bg-gray-50 border-gray-200 focus-within:bg-white focus-within:border-primary-500 focus-within:ring-primary-500/20': 
        variant === 'filled' && !hasError
    },
    
    // State classes
    {
      'border-red-500 focus-within:border-red-500 focus-within:ring-red-500/20': hasError,
      'opacity-50 cursor-not-allowed': isDisabled,
      'ring-2 ring-primary-500/20': isFocused && !hasError,
      'border-primary-500': isOpen && !hasError
    },
    
    // Dark mode support
    'dark:bg-gray-900 dark:border-gray-600 dark:focus-within:border-primary-400',
    'dark:focus-within:ring-primary-400/20'
  );
}

/**
 * Generates CSS classes for option elements
 * @param config - Option state configuration
 * @returns Merged CSS class string
 */
export function getOptionClasses(config: {
  isSelected?: boolean;
  isHighlighted?: boolean;
  isDisabled?: boolean;
  isGrouped?: boolean;
}): string {
  const {
    isSelected = false,
    isHighlighted = false,
    isDisabled = false,
    isGrouped = false
  } = config;

  return cn(
    // Base classes
    'relative cursor-pointer select-none py-2 px-3 text-sm transition-colors duration-150',
    
    // Indent for grouped options
    { 'pl-6': isGrouped },
    
    // State classes
    {
      'bg-primary-50 text-primary-700 dark:bg-primary-900/20 dark:text-primary-300': isSelected && !isDisabled,
      'bg-gray-100 text-gray-900 dark:bg-gray-700 dark:text-gray-100': isHighlighted && !isSelected && !isDisabled,
      'text-gray-400 cursor-not-allowed dark:text-gray-600': isDisabled,
      'text-gray-900 hover:bg-gray-50 dark:text-gray-100 dark:hover:bg-gray-800': !isSelected && !isHighlighted && !isDisabled
    }
  );
}