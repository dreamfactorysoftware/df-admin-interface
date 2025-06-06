/**
 * Select Component Utility Functions
 * 
 * Pure utility functions for select components including option filtering, value transformation,
 * group processing, and accessibility helpers. Provides optimized functions for common select
 * operations and data manipulation, supporting Angular to React migration patterns.
 * 
 * Features:
 * - Fuzzy search with performance optimization for large datasets (1000+ items)
 * - Complex value transformations from Angular component migration (arrays, bitmasks, strings)
 * - Option grouping and normalization for hierarchical data structures
 * - WCAG 2.1 AA compliance helpers for screen readers and keyboard navigation
 * - Selection validation for constraints and limits
 * 
 * @fileoverview Select utility functions for DreamFactory Admin Interface
 * @version 1.0.0
 * @since React 19.0.0 / Next.js 15.1+
 */

import { debounce } from '../../../lib/utils';
import type {
  SelectOption,
  OptionGroup,
  SelectValue,
  BitmaskValue,
  ValueTransform,
  AnySelectProps,
  MultiSelectProps
} from './types';

/**
 * Fuzzy search configuration for option filtering
 */
interface FuzzySearchOptions {
  /** Threshold for fuzzy match (0-1, lower = more strict) */
  threshold?: number;
  /** Include matches in description field */
  includeDescription?: boolean;
  /** Include matches in search keywords */
  includeKeywords?: boolean;
  /** Case sensitive matching */
  caseSensitive?: boolean;
  /** Maximum results to return (performance optimization) */
  maxResults?: number;
  /** Minimum query length before filtering */
  minQueryLength?: number;
}

/**
 * Selection validation configuration
 */
interface ValidationOptions {
  /** Minimum number of selections required */
  minSelections?: number;
  /** Maximum number of selections allowed */
  maxSelections?: number;
  /** Custom validation function */
  customValidator?: (value: SelectValue) => boolean | string;
  /** Validation messages */
  messages?: {
    minSelections?: string;
    maxSelections?: string;
    custom?: string;
  };
}

/**
 * Performance-optimized client-side option filtering with fuzzy search support.
 * 
 * Features:
 * - Fuzzy matching algorithm for flexible search
 * - Search in labels, descriptions, and keywords
 * - Virtual scrolling optimization for large datasets
 * - Debounced search for improved UX
 * - Highlighting match fragments
 * 
 * @param options - Array of options to filter
 * @param query - Search query string
 * @param config - Fuzzy search configuration
 * @returns Filtered and scored options array
 */
export function filterOptions<T = SelectValue>(
  options: SelectOption<T>[],
  query: string,
  config: FuzzySearchOptions = {}
): SelectOption<T>[] {
  const {
    threshold = 0.3,
    includeDescription = true,
    includeKeywords = true,
    caseSensitive = false,
    maxResults = 100,
    minQueryLength = 0
  } = config;

  // Early return for empty query or short queries
  if (!query.trim() || query.length < minQueryLength) {
    return options.slice(0, maxResults);
  }

  const normalizedQuery = caseSensitive ? query : query.toLowerCase();
  const queryWords = normalizedQuery.split(/\s+/).filter(word => word.length > 0);

  /**
   * Calculate fuzzy match score for a string against query words
   * @param text - Text to match against
   * @param boost - Score boost multiplier (for labels vs descriptions)
   * @returns Match score (0-1, higher is better match)
   */
  const calculateMatchScore = (text: string, boost: number = 1): number => {
    if (!text) return 0;
    
    const normalizedText = caseSensitive ? text : text.toLowerCase();
    let totalScore = 0;
    let matchedWords = 0;

    for (const word of queryWords) {
      // Exact match gets highest score
      if (normalizedText.includes(word)) {
        totalScore += 1.0 * boost;
        matchedWords++;
        continue;
      }

      // Fuzzy match using simple character matching
      let maxCharScore = 0;
      for (let i = 0; i <= normalizedText.length - word.length; i++) {
        const textSegment = normalizedText.slice(i, i + word.length);
        let charMatches = 0;
        
        for (let j = 0; j < word.length; j++) {
          if (textSegment[j] === word[j]) charMatches++;
        }
        
        const charScore = charMatches / word.length;
        maxCharScore = Math.max(maxCharScore, charScore);
      }

      if (maxCharScore >= threshold) {
        totalScore += maxCharScore * boost * 0.7; // Fuzzy match penalty
        matchedWords++;
      }
    }

    // Return average score weighted by matched word percentage
    const wordMatchRatio = matchedWords / queryWords.length;
    return wordMatchRatio >= threshold ? (totalScore / queryWords.length) * wordMatchRatio : 0;
  };

  /**
   * Score and filter options based on search query
   */
  const scoredOptions = options
    .map(option => {
      let score = 0;
      let matches: string[] = [];

      // Score label (highest priority)
      const labelScore = calculateMatchScore(option.label, 2.0);
      if (labelScore > 0) {
        score += labelScore;
        matches.push('label');
      }

      // Score description (medium priority)
      if (includeDescription && option.description) {
        const descScore = calculateMatchScore(option.description, 1.0);
        if (descScore > 0) {
          score += descScore;
          matches.push('description');
        }
      }

      // Score search keywords (medium priority)
      if (includeKeywords && option.searchKeywords) {
        const keywordScore = option.searchKeywords.reduce(
          (acc, keyword) => acc + calculateMatchScore(keyword, 1.2),
          0
        ) / option.searchKeywords.length;
        if (keywordScore > 0) {
          score += keywordScore;
          matches.push('keywords');
        }
      }

      // Score metadata values (low priority)
      if (option.metadata) {
        const metadataScore = Object.values(option.metadata)
          .filter(value => typeof value === 'string')
          .reduce((acc, value) => acc + calculateMatchScore(value as string, 0.5), 0);
        if (metadataScore > 0) {
          score += metadataScore;
          matches.push('metadata');
        }
      }

      return {
        option: {
          ...option,
          // Add match metadata for highlighting
          _matchInfo: {
            score,
            matches,
            query: normalizedQuery
          }
        },
        score
      };
    })
    .filter(item => item.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, maxResults)
    .map(item => item.option);

  return scoredOptions;
}

/**
 * Create a debounced version of filterOptions for real-time search
 * @param delay - Debounce delay in milliseconds
 * @returns Debounced filter function
 */
export function createDebouncedFilter<T = SelectValue>(delay: number = 300) {
  return debounce(filterOptions<T>, delay);
}

/**
 * Transform value between different types for complex form handling.
 * Supports Angular migration patterns including array/bitmask conversions.
 * 
 * @param value - Value to transform
 * @param transform - Transformation configuration
 * @returns Transformed value
 */
export function transformValue<TInput = any, TOutput = any>(
  value: TInput,
  transform: ValueTransform<TInput, TOutput>
): TOutput {
  try {
    return transform.toFormValue(value);
  } catch (error) {
    console.warn('Value transformation failed:', error);
    return value as unknown as TOutput;
  }
}

/**
 * Reverse transform value from form value to display value
 * @param value - Form value to transform back
 * @param transform - Transformation configuration
 * @returns Display value
 */
export function reverseTransformValue<TInput = any, TOutput = any>(
  value: TOutput,
  transform: ValueTransform<TInput, TOutput>
): TInput {
  try {
    return transform.toDisplayValue(value);
  } catch (error) {
    console.warn('Reverse value transformation failed:', error);
    return value as unknown as TInput;
  }
}

/**
 * Common value transformations for Angular migration patterns
 */
export const valueTransforms = {
  /**
   * Transform array of strings to comma-separated string
   */
  arrayToString: {
    toFormValue: (value: string[]): string => Array.isArray(value) ? value.join(',') : '',
    toDisplayValue: (value: string): string[] => value ? value.split(',').map(s => s.trim()) : [],
    validate: (value: string): boolean => typeof value === 'string'
  } as ValueTransform<string[], string>,

  /**
   * Transform array of numbers to comma-separated string
   */
  numberArrayToString: {
    toFormValue: (value: number[]): string => Array.isArray(value) ? value.join(',') : '',
    toDisplayValue: (value: string): number[] => 
      value ? value.split(',').map(s => parseInt(s.trim(), 10)).filter(n => !isNaN(n)) : [],
    validate: (value: string): boolean => typeof value === 'string'
  } as ValueTransform<number[], string>,

  /**
   * Transform bitmask to array of selected bit positions
   */
  bitmaskToArray: {
    toFormValue: (value: BitmaskValue): number[] => value.selectedBits || [],
    toDisplayValue: (value: number[]): BitmaskValue => ({
      value: value.reduce((mask, bit) => mask | (1 << bit), 0),
      selectedBits: value,
      labels: {}
    }),
    validate: (value: number[]): boolean => Array.isArray(value) && value.every(n => typeof n === 'number')
  } as ValueTransform<BitmaskValue, number[]>,

  /**
   * Transform boolean to string for form inputs
   */
  booleanToString: {
    toFormValue: (value: boolean): string => value ? 'true' : 'false',
    toDisplayValue: (value: string): boolean => value === 'true',
    validate: (value: string): boolean => value === 'true' || value === 'false'
  } as ValueTransform<boolean, string>,

  /**
   * Transform object to JSON string
   */
  objectToJson: {
    toFormValue: (value: any): string => JSON.stringify(value),
    toDisplayValue: (value: string): any => {
      try {
        return JSON.parse(value);
      } catch {
        return null;
      }
    },
    validate: (value: string): boolean => {
      try {
        JSON.parse(value);
        return true;
      } catch {
        return false;
      }
    }
  } as ValueTransform<any, string>
};

/**
 * Organize flat options array into labeled groups for hierarchical display.
 * 
 * @param options - Options to group
 * @param groupFn - Function to determine group for each option
 * @param sortGroups - Whether to sort groups alphabetically
 * @returns Array of option groups
 */
export function groupOptions<T = SelectValue>(
  options: SelectOption<T>[],
  groupFn: (option: SelectOption<T>) => string | null,
  sortGroups: boolean = true
): OptionGroup<T>[] {
  const groupMap = new Map<string, SelectOption<T>[]>();
  const ungrouped: SelectOption<T>[] = [];

  // Group options
  for (const option of options) {
    const groupKey = groupFn(option);
    
    if (groupKey === null) {
      ungrouped.push(option);
      continue;
    }

    if (!groupMap.has(groupKey)) {
      groupMap.set(groupKey, []);
    }
    groupMap.get(groupKey)!.push(option);
  }

  // Create group objects
  const groups: OptionGroup<T>[] = [];
  
  // Sort group keys if requested
  const groupKeys = Array.from(groupMap.keys());
  if (sortGroups) {
    groupKeys.sort();
  }

  // Build group objects
  for (const groupKey of groupKeys) {
    const groupOptions = groupMap.get(groupKey)!;
    
    // Sort options within group by sortOrder then label
    groupOptions.sort((a, b) => {
      if (a.sortOrder !== undefined && b.sortOrder !== undefined) {
        return a.sortOrder - b.sortOrder;
      }
      if (a.sortOrder !== undefined) return -1;
      if (b.sortOrder !== undefined) return 1;
      return a.label.localeCompare(b.label);
    });

    groups.push({
      id: groupKey.toLowerCase().replace(/\s+/g, '-'),
      label: groupKey,
      options: groupOptions,
      disabled: groupOptions.every(opt => opt.disabled)
    });
  }

  // Add ungrouped options as separate group if any exist
  if (ungrouped.length > 0) {
    ungrouped.sort((a, b) => {
      if (a.sortOrder !== undefined && b.sortOrder !== undefined) {
        return a.sortOrder - b.sortOrder;
      }
      if (a.sortOrder !== undefined) return -1;
      if (b.sortOrder !== undefined) return 1;
      return a.label.localeCompare(b.label);
    });

    groups.push({
      id: 'ungrouped',
      label: 'Other',
      options: ungrouped
    });
  }

  return groups;
}

/**
 * Normalize option object to ensure consistent structure.
 * Useful for handling options from various data sources.
 * 
 * @param input - Raw option data
 * @param labelKey - Key to use for label (default: 'label')
 * @param valueKey - Key to use for value (default: 'value')
 * @returns Normalized SelectOption
 */
export function normalizeOption<T = SelectValue>(
  input: any,
  labelKey: string = 'label',
  valueKey: string = 'value'
): SelectOption<T> {
  // Handle primitive values
  if (typeof input === 'string' || typeof input === 'number' || typeof input === 'boolean') {
    return {
      value: input as T,
      label: String(input),
      disabled: false
    };
  }

  // Handle null/undefined
  if (input == null) {
    return {
      value: null as T,
      label: '',
      disabled: true
    };
  }

  // Handle object input
  const option: SelectOption<T> = {
    value: input[valueKey] as T,
    label: String(input[labelKey] || input[valueKey] || ''),
    disabled: Boolean(input.disabled),
  };

  // Add optional properties if present
  if (input.description) option.description = String(input.description);
  if (input.icon) option.icon = input.icon;
  if (input.group) option.group = String(input.group);
  if (input.metadata) option.metadata = input.metadata;
  if (input.className) option.className = String(input.className);
  if (input.searchKeywords) option.searchKeywords = Array.isArray(input.searchKeywords) 
    ? input.searchKeywords.map(String) 
    : [String(input.searchKeywords)];
  if (typeof input.sortOrder === 'number') option.sortOrder = input.sortOrder;

  return option;
}

/**
 * Extract label from option or value.
 * Handles both SelectOption objects and primitive values.
 * 
 * @param optionOrValue - Option object or primitive value
 * @param options - Array of options to search in (if value is primitive)
 * @returns Display label string
 */
export function getOptionLabel<T = SelectValue>(
  optionOrValue: SelectOption<T> | T,
  options?: SelectOption<T>[]
): string {
  // Handle SelectOption object
  if (optionOrValue && typeof optionOrValue === 'object' && 'label' in optionOrValue) {
    return (optionOrValue as SelectOption<T>).label;
  }

  // Handle primitive value - search in options array
  if (options) {
    const foundOption = options.find(opt => opt.value === optionOrValue);
    if (foundOption) {
      return foundOption.label;
    }
  }

  // Fallback to string conversion
  return String(optionOrValue ?? '');
}

/**
 * Extract value from option.
 * 
 * @param option - Option object
 * @returns Option value
 */
export function getOptionValue<T = SelectValue>(option: SelectOption<T>): T {
  return option.value;
}

/**
 * Find option by value in options array.
 * 
 * @param value - Value to search for
 * @param options - Array of options to search in
 * @returns Found option or undefined
 */
export function findOptionByValue<T = SelectValue>(
  value: T,
  options: SelectOption<T>[]
): SelectOption<T> | undefined {
  return options.find(option => {
    // Handle object comparison
    if (typeof value === 'object' && value !== null && typeof option.value === 'object' && option.value !== null) {
      return JSON.stringify(value) === JSON.stringify(option.value);
    }
    
    // Handle primitive comparison
    return option.value === value;
  });
}

/**
 * Get multiple options by values array.
 * 
 * @param values - Array of values to find
 * @param options - Array of options to search in
 * @returns Array of found options
 */
export function findOptionsByValues<T = SelectValue>(
  values: T[],
  options: SelectOption<T>[]
): SelectOption<T>[] {
  if (!Array.isArray(values)) return [];
  
  return values
    .map(value => findOptionByValue(value, options))
    .filter((option): option is SelectOption<T> => option !== undefined);
}

/**
 * WCAG 2.1 AA accessibility helpers for screen readers and keyboard navigation
 */
export const accessibilityHelpers = {
  /**
   * Generate ARIA attributes for select component
   * @param props - Select component props
   * @returns Object with ARIA attributes
   */
  getSelectAriaAttributes<T = SelectValue>(props: AnySelectProps<T>) {
    const attributes: Record<string, any> = {
      'aria-required': props.required || false,
      'aria-invalid': props['aria-invalid'] || false,
      'aria-disabled': props.disabled || false,
    };

    if (props['aria-describedby']) {
      attributes['aria-describedby'] = props['aria-describedby'];
    }

    if (props.placeholder) {
      attributes['aria-placeholder'] = props.placeholder;
    }

    return attributes;
  },

  /**
   * Generate announcement for screen readers when option is selected
   * @param option - Selected option
   * @param totalOptions - Total number of options
   * @returns Announcement string
   */
  announceSelection<T = SelectValue>(
    option: SelectOption<T>,
    totalOptions: number
  ): string {
    return `Selected ${option.label}. ${totalOptions} options available.`;
  },

  /**
   * Generate announcement for multi-select changes
   * @param selectedCount - Number of selected options
   * @param totalOptions - Total number of options
   * @param lastAction - Last action performed ('selected' | 'deselected')
   * @param optionLabel - Label of the option that was acted upon
   * @returns Announcement string
   */
  announceMultiSelection(
    selectedCount: number,
    totalOptions: number,
    lastAction: 'selected' | 'deselected',
    optionLabel: string
  ): string {
    const action = lastAction === 'selected' ? 'Added' : 'Removed';
    return `${action} ${optionLabel}. ${selectedCount} of ${totalOptions} options selected.`;
  },

  /**
   * Generate announcement for search results
   * @param resultCount - Number of search results
   * @param query - Search query
   * @returns Announcement string
   */
  announceSearchResults(resultCount: number, query: string): string {
    if (resultCount === 0) {
      return `No results found for "${query}".`;
    }
    return `${resultCount} results found for "${query}".`;
  },

  /**
   * Generate live region announcement for loading states
   * @param isLoading - Whether component is loading
   * @param message - Custom loading message
   * @returns Announcement string
   */
  announceLoading(isLoading: boolean, message?: string): string {
    if (isLoading) {
      return message || 'Loading options...';
    }
    return 'Options loaded.';
  },

  /**
   * Get keyboard navigation instructions for screen readers
   * @param isMultiSelect - Whether this is a multi-select component
   * @returns Instructions string
   */
  getKeyboardInstructions(isMultiSelect: boolean = false): string {
    const baseInstructions = 'Use arrow keys to navigate options, Enter to select';
    
    if (isMultiSelect) {
      return `${baseInstructions}, Space to toggle selection, Escape to close`;
    }
    
    return `${baseInstructions}, Escape to close`;
  }
};

/**
 * Validate selection based on constraints and rules.
 * 
 * @param value - Current selection value
 * @param options - Available options
 * @param validation - Validation configuration
 * @returns Validation result with success flag and error message
 */
export function validateSelection<T = SelectValue>(
  value: T | T[],
  options: SelectOption<T>[],
  validation: ValidationOptions = {}
): { isValid: boolean; error?: string } {
  const {
    minSelections,
    maxSelections,
    customValidator,
    messages = {}
  } = validation;

  // Handle array values (multi-select)
  if (Array.isArray(value)) {
    const selectionCount = value.length;

    // Check minimum selections
    if (minSelections !== undefined && selectionCount < minSelections) {
      return {
        isValid: false,
        error: messages.minSelections || `Please select at least ${minSelections} option${minSelections !== 1 ? 's' : ''}.`
      };
    }

    // Check maximum selections
    if (maxSelections !== undefined && selectionCount > maxSelections) {
      return {
        isValid: false,
        error: messages.maxSelections || `Please select no more than ${maxSelections} option${maxSelections !== 1 ? 's' : ''}.`
      };
    }

    // Validate each selected value exists in options
    for (const val of value) {
      const option = findOptionByValue(val, options);
      if (!option) {
        return {
          isValid: false,
          error: `Selected value "${val}" is not available in options.`
        };
      }
      
      if (option.disabled) {
        return {
          isValid: false,
          error: `Option "${option.label}" is disabled and cannot be selected.`
        };
      }
    }
  } else {
    // Handle single value
    if (value !== null && value !== undefined) {
      const option = findOptionByValue(value, options);
      
      if (!option) {
        return {
          isValid: false,
          error: `Selected value "${value}" is not available in options.`
        };
      }
      
      if (option.disabled) {
        return {
          isValid: false,
          error: `Option "${option.label}" is disabled and cannot be selected.`
        };
      }
    }

    // Check minimum for single select (basically required field)
    if (minSelections && minSelections > 0 && (value === null || value === undefined)) {
      return {
        isValid: false,
        error: messages.minSelections || 'This field is required.'
      };
    }
  }

  // Run custom validation if provided
  if (customValidator) {
    const customResult = customValidator(value);
    
    if (typeof customResult === 'string') {
      return {
        isValid: false,
        error: customResult
      };
    }
    
    if (!customResult) {
      return {
        isValid: false,
        error: messages.custom || 'Selection is not valid.'
      };
    }
  }

  return { isValid: true };
}

/**
 * Check if option can be selected based on current state and constraints.
 * 
 * @param option - Option to check
 * @param currentValue - Current selection value
 * @param maxSelections - Maximum allowed selections (for multi-select)
 * @returns Whether option can be selected
 */
export function canSelectOption<T = SelectValue>(
  option: SelectOption<T>,
  currentValue: T | T[],
  maxSelections?: number
): boolean {
  // Option is disabled
  if (option.disabled) {
    return false;
  }

  // For multi-select, check if we're at max capacity and option isn't already selected
  if (Array.isArray(currentValue) && maxSelections !== undefined) {
    const isAlreadySelected = currentValue.some(val => {
      if (typeof val === 'object' && val !== null && typeof option.value === 'object' && option.value !== null) {
        return JSON.stringify(val) === JSON.stringify(option.value);
      }
      return val === option.value;
    });
    
    if (!isAlreadySelected && currentValue.length >= maxSelections) {
      return false;
    }
  }

  return true;
}

/**
 * Utility for performance optimization with large option lists.
 * Creates virtual scrolling window for options.
 * 
 * @param options - All options
 * @param startIndex - Start index of visible window
 * @param windowSize - Number of options to show in window
 * @returns Windowed options with metadata
 */
export function createVirtualWindow<T = SelectValue>(
  options: SelectOption<T>[],
  startIndex: number,
  windowSize: number
): {
  items: SelectOption<T>[];
  totalCount: number;
  startIndex: number;
  endIndex: number;
  hasMore: boolean;
} {
  const endIndex = Math.min(startIndex + windowSize, options.length);
  const items = options.slice(startIndex, endIndex);
  
  return {
    items,
    totalCount: options.length,
    startIndex,
    endIndex,
    hasMore: endIndex < options.length
  };
}

/**
 * Default configurations for common select use cases
 */
export const defaultConfigurations = {
  /** Basic select with minimal features */
  basic: {
    searchable: false,
    clearable: false,
    maxResults: 50
  },

  /** Database field select with search and performance optimization */
  database: {
    searchable: true,
    clearable: true,
    maxResults: 100,
    fuzzySearch: {
      threshold: 0.3,
      includeDescription: true,
      includeKeywords: true,
      minQueryLength: 2
    }
  },

  /** Large dataset optimization for 1000+ options */
  largeDataset: {
    searchable: true,
    clearable: true,
    maxResults: 50,
    fuzzySearch: {
      threshold: 0.4,
      includeDescription: false,
      includeKeywords: true,
      minQueryLength: 3
    },
    virtualScrolling: {
      windowSize: 50,
      itemHeight: 40
    }
  },

  /** Multi-select with validation */
  multiSelect: {
    searchable: true,
    clearable: true,
    maxResults: 100,
    validation: {
      maxSelections: 10,
      messages: {
        maxSelections: 'Maximum 10 selections allowed'
      }
    }
  }
};

/**
 * Export all utility functions and configurations
 */
export {
  type FuzzySearchOptions,
  type ValidationOptions
};