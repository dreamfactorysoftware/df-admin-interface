/**
 * Select Component Library - Barrel Export
 * 
 * Centralized export file providing clean access to all select component variants
 * including Select, Autocomplete, MultiSelect, and associated TypeScript types.
 * Enables tree-shaking optimized imports for the React 19 component library.
 * 
 * Usage Examples:
 * ```typescript
 * import { Select, SelectOption } from '@/components/ui/select';
 * import { Autocomplete, useAutocomplete } from '@/components/ui/select';
 * import { MultiSelect, MultiSelectProps } from '@/components/ui/select';
 * ```
 * 
 * @fileoverview Barrel export for DreamFactory Admin Interface select components
 * @version 1.0.0
 * @since React 19.0.0 / Next.js 15.1+ / Headless UI 2.0+
 */

// ============================================================================
// MAIN COMPONENTS
// ============================================================================

/**
 * Primary select component exports with all variants
 * Supports single selection with comprehensive theming and accessibility
 */
export { 
  Select as default,
  Select,
  type SelectVariants 
} from './Select';

/**
 * Autocomplete component with search and async loading capabilities
 * Provides searchable combobox functionality with debounced search
 */
export { 
  Autocomplete,
  default as AutocompleteComponent 
} from './Autocomplete';

/**
 * Multi-select component with chip display and batch operations
 * Enables multiple selection with visual chips and advanced filtering
 */
export { 
  MultiSelect,
  default as MultiSelectComponent,
  type ChipProps,
  type SearchInputProps 
} from './MultiSelect';

// ============================================================================
// TYPESCRIPT INTERFACES AND TYPES
// ============================================================================

/**
 * Core type definitions for all select component variants
 * Comprehensive type system supporting complex data structures
 */
export type {
  // Value and option types
  SelectValue,
  SelectOption,
  OptionGroup,
  BitmaskValue,
  ValueTransform,
  
  // State interfaces
  SelectLoadingState,
  SelectErrorState,
  SelectThemeVariants,
  
  // Component props interfaces
  BaseSelectProps,
  SelectProps,
  AutocompleteProps,
  MultiSelectProps,
  AdvancedSelectProps,
  AnySelectProps,
  
  // Configuration interfaces
  SelectFieldConfig,
  SelectVariantProps,
  
  // Type guard utilities
} from './types';

/**
 * Additional type utilities and defaults
 */
export {
  // Type guard functions
  isMultiSelect,
  isAutocomplete,
  isAdvancedSelect,
  
  // Default configurations
  DEFAULT_SELECT_CONFIG,
} from './types';

// ============================================================================
// CUSTOM HOOKS
// ============================================================================

/**
 * Core selection hooks for state management and form integration
 * Provides reusable logic for different selection patterns
 */
export {
  // Basic selection hooks
  useSelect,
  useAutocomplete,
  useMultiSelect,
  
  // Option management hooks
  useSelectOptions,
  useSelectKeyboard,
  useSelectValidation,
  
  // Specialized hooks
  useVerbTransform,
  useCompleteSelect,
  
  // Hook types and interfaces
  type SelectOption as HookSelectOption,
  type SelectGroup,
  type HttpVerb,
  type VerbValue,
  HTTP_VERB_BITMASKS,
} from './hooks';

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Utility functions for option filtering and value transformation
 * Provides helpers for common select operations and data processing
 */

/**
 * Filter options based on search term with support for multiple fields
 * @param options Array of options to filter
 * @param searchTerm Search query string
 * @returns Filtered options array
 */
export function filterSelectOptions<T = any>(
  options: SelectOption<T>[], 
  searchTerm: string
): SelectOption<T>[] {
  if (!searchTerm.trim()) {
    return options;
  }

  const term = searchTerm.toLowerCase();
  return options.filter(option => 
    option.label.toLowerCase().includes(term) ||
    option.description?.toLowerCase().includes(term) ||
    option.value?.toString().toLowerCase().includes(term) ||
    option.searchKeywords?.some(keyword => keyword.toLowerCase().includes(term))
  );
}

/**
 * Group options by their group property with proper sorting
 * @param options Array of options to group
 * @returns Record of grouped options
 */
export function groupSelectOptions<T = any>(
  options: SelectOption<T>[]
): Record<string, SelectOption<T>[]> {
  const grouped = options.reduce((groups, option) => {
    const groupKey = option.group || 'default';
    if (!groups[groupKey]) {
      groups[groupKey] = [];
    }
    groups[groupKey].push(option);
    return groups;
  }, {} as Record<string, SelectOption<T>[]>);

  // Sort options within each group by sortOrder, then by label
  Object.keys(grouped).forEach(groupKey => {
    grouped[groupKey].sort((a, b) => {
      if (a.sortOrder !== undefined && b.sortOrder !== undefined) {
        return a.sortOrder - b.sortOrder;
      }
      if (a.sortOrder !== undefined) return -1;
      if (b.sortOrder !== undefined) return 1;
      return a.label.localeCompare(b.label);
    });
  });

  return grouped;
}

/**
 * Normalize any value to SelectOption format
 * @param option Raw option data
 * @returns Normalized SelectOption
 */
export function normalizeSelectOption<T = any>(
  option: T | SelectOption<T>
): SelectOption<T> {
  if (typeof option === 'object' && option !== null && 'value' in option && 'label' in option) {
    return option as SelectOption<T>;
  }

  return {
    value: option as T,
    label: String(option),
  };
}

/**
 * Transform array of values to different formats for form submission
 * @param values Array of selected values
 * @param format Target format for transformation
 * @returns Transformed value in specified format
 */
export function transformSelectValues<T = any>(
  values: T[],
  format: 'array' | 'bitmask' | 'comma-separated' | 'json'
): any {
  switch (format) {
    case 'bitmask':
      // Convert HTTP verbs to bitmask for API configuration
      if (values.every(v => typeof v === 'string')) {
        const HTTP_VERB_BITMASKS: Record<string, number> = {
          GET: 1,
          POST: 2,
          PUT: 4,
          PATCH: 8,
          DELETE: 16,
        };
        return values.reduce((mask, verb) => 
          mask | (HTTP_VERB_BITMASKS[verb as string] || 0), 0
        );
      }
      return 0;
    
    case 'comma-separated':
      // Convert array to comma-separated string
      return values.map(v => String(v)).join(',');
    
    case 'json':
      // Convert array to JSON string
      return JSON.stringify(values);
    
    case 'array':
    default:
      // Return as array
      return values;
  }
}

/**
 * Extract HTTP verbs from bitmask value
 * @param bitmask Numeric bitmask value
 * @returns Array of HTTP verb strings
 */
export function extractVerbsFromBitmask(bitmask: number): string[] {
  const HTTP_VERB_BITMASKS: Record<string, number> = {
    GET: 1,
    POST: 2,
    PUT: 4,
    PATCH: 8,
    DELETE: 16,
  };

  return Object.entries(HTTP_VERB_BITMASKS)
    .filter(([_, value]) => (bitmask & value) === value)
    .map(([verb]) => verb);
}

/**
 * Validate selection based on common requirements
 * @param value Selected value(s)
 * @param options Validation options
 * @returns Validation result with error message if invalid
 */
export function validateSelectValue<T = any>(
  value: T | T[] | undefined,
  options: {
    required?: boolean;
    minSelections?: number;
    maxSelections?: number;
    allowedValues?: T[];
  } = {}
): { isValid: boolean; error?: string } {
  const { required = false, minSelections, maxSelections, allowedValues } = options;

  // Required validation
  if (required && (value === undefined || value === null || value === '')) {
    return { isValid: false, error: 'Selection is required' };
  }

  // Array validations for multi-select
  if (Array.isArray(value)) {
    if (required && value.length === 0) {
      return { isValid: false, error: 'At least one selection is required' };
    }

    if (minSelections !== undefined && value.length < minSelections) {
      return { 
        isValid: false, 
        error: `At least ${minSelections} selection${minSelections > 1 ? 's' : ''} required` 
      };
    }

    if (maxSelections !== undefined && value.length > maxSelections) {
      return { 
        isValid: false, 
        error: `Maximum ${maxSelections} selection${maxSelections > 1 ? 's' : ''} allowed` 
      };
    }

    // Check if all values are allowed
    if (allowedValues && value.some(v => !allowedValues.includes(v))) {
      return { isValid: false, error: 'Invalid selection detected' };
    }
  } else {
    // Single value validation
    if (allowedValues && value !== undefined && !allowedValues.includes(value)) {
      return { isValid: false, error: 'Invalid selection' };
    }
  }

  return { isValid: true };
}

/**
 * Create options from enum-like object or array
 * @param source Enum object or array of values
 * @param labelTransform Optional function to transform value to label
 * @returns Array of SelectOption objects
 */
export function createSelectOptionsFromEnum<T = string>(
  source: Record<string, T> | T[],
  labelTransform?: (value: T, key?: string) => string
): SelectOption<T>[] {
  if (Array.isArray(source)) {
    return source.map(value => ({
      value,
      label: labelTransform ? labelTransform(value) : String(value),
    }));
  }

  return Object.entries(source).map(([key, value]) => ({
    value,
    label: labelTransform ? labelTransform(value, key) : key,
  }));
}

/**
 * Create async options loader with caching and error handling
 * @param loadFn Function to load options
 * @param options Configuration for caching and error handling
 * @returns Configured async options loader
 */
export function createAsyncOptionsLoader<T = any>(
  loadFn: (query: string, page?: number) => Promise<{ options: SelectOption<T>[]; hasMore?: boolean; total?: number }>,
  options: {
    cacheDuration?: number;
    retryAttempts?: number;
    retryDelay?: number;
  } = {}
): (query: string, page?: number) => Promise<{ options: SelectOption<T>[]; hasMore?: boolean; total?: number }> {
  const { cacheDuration = 300000, retryAttempts = 3, retryDelay = 1000 } = options;
  const cache = new Map<string, { data: any; timestamp: number }>();

  return async (query: string, page: number = 1) => {
    const cacheKey = `${query}-${page}`;
    const now = Date.now();
    
    // Check cache first
    if (cache.has(cacheKey)) {
      const cached = cache.get(cacheKey)!;
      if (now - cached.timestamp < cacheDuration) {
        return cached.data;
      }
    }

    // Load with retry logic
    let lastError: Error | null = null;
    for (let attempt = 1; attempt <= retryAttempts; attempt++) {
      try {
        const result = await loadFn(query, page);
        
        // Cache successful result
        cache.set(cacheKey, { data: result, timestamp: now });
        
        return result;
      } catch (error) {
        lastError = error as Error;
        
        if (attempt < retryAttempts) {
          // Wait before retry with exponential backoff
          await new Promise(resolve => 
            setTimeout(resolve, retryDelay * Math.pow(2, attempt - 1))
          );
        }
      }
    }

    throw lastError || new Error('Failed to load options');
  };
}

// ============================================================================
// RE-EXPORTS FOR BACKWARDS COMPATIBILITY
// ============================================================================

/**
 * Legacy exports for backwards compatibility with Angular patterns
 * Maintains compatibility during migration phase
 */

// Main component as default export
export { Select as SelectComponent };
export { Autocomplete as AutocompleteComponent };
export { MultiSelect as MultiSelectComponent };

// Type aliases for Angular migration compatibility
export type {
  SelectProps as DfSelectProps,
  AutocompleteProps as DfAutocompleteProps,
  MultiSelectProps as DfMultiSelectProps,
  SelectOption as DfSelectOption,
  SelectValue as DfSelectValue,
};

// Hook aliases for consistency
export {
  useSelect as useSelectState,
  useMultiSelect as useMultiSelectState,
  useAutocomplete as useAutocompleteState,
};

// ============================================================================
// COMPONENT COLLECTIONS
// ============================================================================

/**
 * Grouped exports for specific use cases
 */

// All components in one export for dynamic imports
export const SelectComponents = {
  Select,
  Autocomplete,
  MultiSelect,
} as const;

// All hooks in one export for dynamic usage
export const SelectHooks = {
  useSelect,
  useAutocomplete,
  useMultiSelect,
  useSelectOptions,
  useSelectKeyboard,
  useSelectValidation,
  useVerbTransform,
  useCompleteSelect,
} as const;

// All utilities in one export
export const SelectUtils = {
  filterSelectOptions,
  groupSelectOptions,
  normalizeSelectOption,
  transformSelectValues,
  extractVerbsFromBitmask,
  validateSelectValue,
  createSelectOptionsFromEnum,
  createAsyncOptionsLoader,
} as const;

// All types grouped for easy reference
export type SelectComponentTypes = {
  SelectProps: SelectProps;
  AutocompleteProps: AutocompleteProps;
  MultiSelectProps: MultiSelectProps;
  SelectOption: SelectOption;
  SelectValue: SelectValue;
  SelectLoadingState: SelectLoadingState;
  SelectErrorState: SelectErrorState;
};

/**
 * Version information for component library
 */
export const SELECT_LIBRARY_VERSION = '1.0.0';
export const SELECT_LIBRARY_DEPENDENCIES = {
  'react': '^19.0.0',
  'next': '^15.1.0',
  '@headlessui/react': '^2.0.0',
  'class-variance-authority': '^0.7.0',
  'react-hook-form': '^7.52.0',
} as const;