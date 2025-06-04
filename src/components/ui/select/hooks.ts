/**
 * Custom React hooks for select component logic including useSelect for basic selection,
 * useAutocomplete for search functionality, and useMultiSelect for multiple selection state management.
 * Provides reusable logic for option filtering, value transformation, and async loading.
 * 
 * @fileoverview Replaces Angular select patterns with React hooks that integrate with
 * React Hook Form, SWR/React Query caching, and Next.js middleware for comprehensive
 * select component functionality throughout the DreamFactory Admin Interface.
 */

import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useFormContext, type FieldValues, type Path } from 'react-hook-form';
import { cn } from '../../../lib/utils';

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

/**
 * Base option interface for all select variants
 */
export interface SelectOption<T = any> {
  /** Unique value for the option */
  value: T;
  /** Display label for the option */
  label: string;
  /** Optional description for additional context */
  description?: string;
  /** Optional icon component or icon name */
  icon?: React.ComponentType<any> | string;
  /** Whether the option is disabled */
  disabled?: boolean;
  /** Optional group identifier for grouped options */
  group?: string;
  /** Additional data for the option */
  data?: Record<string, any>;
}

/**
 * Group configuration for organizing options
 */
export interface SelectGroup {
  /** Group identifier */
  id: string;
  /** Group display label */
  label: string;
  /** Whether the group is collapsible */
  collapsible?: boolean;
  /** Whether the group is initially collapsed */
  defaultCollapsed?: boolean;
}

/**
 * Base select state interface
 */
interface SelectState<T = any> {
  selectedValue: T | T[] | undefined;
  isValid: boolean;
  isDirty: boolean;
  isTouched: boolean;
  error?: string;
  isLoading?: boolean;
}

/**
 * Base select actions interface
 */
interface SelectActions<T = any> {
  setValue: (value: T | T[] | undefined) => void;
  clearSelection: () => void;
  markAsTouched: () => void;
  validate: () => boolean;
}

/**
 * Autocomplete specific state
 */
interface AutocompleteState<T = any> extends SelectState<T> {
  searchTerm: string;
  isSearching: boolean;
  filteredOptions: SelectOption<T>[];
  hasMore?: boolean;
}

/**
 * Autocomplete specific actions
 */
interface AutocompleteActions<T = any> extends SelectActions<T> {
  setSearchTerm: (term: string) => void;
  loadMore: () => void;
  refresh: () => void;
}

/**
 * Multi-select specific state
 */
interface MultiSelectState<T = any> extends SelectState<T[]> {
  selectedCount: number;
  maxReached: boolean;
}

/**
 * Multi-select specific actions
 */
interface MultiSelectActions<T = any> extends SelectActions<T[]> {
  addValue: (value: T) => void;
  removeValue: (value: T) => void;
  toggleValue: (value: T) => void;
  selectAll: () => void;
  deselectAll: () => void;
  invertSelection: () => void;
}

/**
 * Keyboard navigation state
 */
interface KeyboardNavigation {
  focusedIndex: number;
  setFocusedIndex: (index: number) => void;
  handleKeyDown: (event: React.KeyboardEvent) => void;
  moveFocus: (direction: 'up' | 'down' | 'home' | 'end') => void;
}

/**
 * Validation options
 */
interface ValidationOptions {
  required?: boolean;
  customValidator?: (value: any) => { isValid: boolean; error?: string };
}

/**
 * Async loading configuration
 */
interface AsyncLoadingConfig<T = any> {
  loadOptions: (searchTerm: string, page?: number) => Promise<{ options: SelectOption<T>[]; hasMore?: boolean; total?: number }>;
  pageSize?: number;
  searchDebounceMs?: number;
  cacheResults?: boolean;
}

/**
 * HTTP verb types and configurations for verb picker integration
 */
export type HttpVerb = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
export type VerbValue = string | number | HttpVerb | HttpVerb[];

export const HTTP_VERB_BITMASKS: Record<HttpVerb, number> = {
  GET: 1,
  POST: 2,
  PUT: 4,
  PATCH: 8,
  DELETE: 16,
} as const;

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Simple debounce implementation for select functionality
 */
function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}

/**
 * Normalize option to ensure consistent structure
 */
function normalizeOption<T>(option: T | SelectOption<T>): SelectOption<T> {
  if (typeof option === 'object' && option !== null && 'value' in option && 'label' in option) {
    return option as SelectOption<T>;
  }

  return {
    value: option as T,
    label: String(option),
  };
}

/**
 * Filter options based on search term
 */
function filterOptions<T>(options: SelectOption<T>[], searchTerm: string): SelectOption<T>[] {
  if (!searchTerm.trim()) {
    return options;
  }

  const term = searchTerm.toLowerCase();
  return options.filter(option => 
    option.label.toLowerCase().includes(term) ||
    option.description?.toLowerCase().includes(term) ||
    option.value?.toString().toLowerCase().includes(term)
  );
}

/**
 * Group options by their group property
 */
function groupOptions<T>(options: SelectOption<T>[]): Record<string, SelectOption<T>[]> {
  return options.reduce((groups, option) => {
    const groupKey = option.group || 'default';
    if (!groups[groupKey]) {
      groups[groupKey] = [];
    }
    groups[groupKey].push(option);
    return groups;
  }, {} as Record<string, SelectOption<T>[]>);
}

/**
 * Convert HTTP verbs array to bitmask
 */
function convertVerbsToBitmask(verbs: HttpVerb[]): number {
  return verbs.reduce((mask, verb) => mask | HTTP_VERB_BITMASKS[verb], 0);
}

/**
 * Convert bitmask to HTTP verbs array
 */
function convertBitmaskToVerbs(bitmask: number): HttpVerb[] {
  return Object.entries(HTTP_VERB_BITMASKS)
    .filter(([_, value]) => (bitmask & value) === value)
    .map(([verb]) => verb as HttpVerb);
}

/**
 * Validate selection based on requirements
 */
function validateSelection(value: any, required: boolean = false): { isValid: boolean; error?: string } {
  if (required && (value === undefined || value === null || value === '')) {
    return { isValid: false, error: 'Selection is required' };
  }

  if (Array.isArray(value) && required && value.length === 0) {
    return { isValid: false, error: 'At least one selection is required' };
  }

  return { isValid: true };
}

// ============================================================================
// CORE HOOKS
// ============================================================================

/**
 * Core single select hook for basic selection state management
 * Provides value management, validation, and reactive updates.
 * 
 * @param initialValue - Initial selected value
 * @param options - Validation and configuration options
 * @returns Select state and actions
 */
export function useSelect<T = any>(
  initialValue: T | undefined = undefined,
  options: ValidationOptions = {}
): SelectState<T> & SelectActions<T> {
  const [selectedValue, setSelectedValue] = useState<T | undefined>(initialValue);
  const [isDirty, setIsDirty] = useState(false);
  const [isTouched, setIsTouched] = useState(false);
  const [error, setError] = useState<string | undefined>();

  // Memoized validation result
  const validationResult = useMemo(() => {
    const baseValidation = validateSelection(selectedValue, options.required);
    
    if (!baseValidation.isValid) {
      return baseValidation;
    }

    // Run custom validation if provided
    if (options.customValidator) {
      return options.customValidator(selectedValue);
    }

    return baseValidation;
  }, [selectedValue, options.required, options.customValidator]);

  const isValid = validationResult.isValid;

  // Update error state when validation changes
  useEffect(() => {
    setError(validationResult.error);
  }, [validationResult.error]);

  // Action handlers
  const setValue = useCallback((value: T | undefined) => {
    setSelectedValue(value);
    setIsDirty(true);
  }, []);

  const clearSelection = useCallback(() => {
    setValue(undefined);
  }, [setValue]);

  const markAsTouched = useCallback(() => {
    setIsTouched(true);
  }, []);

  const validate = useCallback(() => {
    markAsTouched();
    return isValid;
  }, [isValid, markAsTouched]);

  return {
    selectedValue,
    isValid,
    isDirty,
    isTouched,
    error,
    setValue,
    clearSelection,
    markAsTouched,
    validate,
  };
}

/**
 * Autocomplete hook with debounced search, async loading, and option filtering
 * Provides search functionality with performance optimization and async data loading.
 * 
 * @param options - Available options for selection
 * @param config - Async loading and search configuration
 * @param validationOptions - Validation configuration
 * @returns Autocomplete state and actions
 */
export function useAutocomplete<T = any>(
  options: SelectOption<T>[] = [],
  config: Partial<AsyncLoadingConfig<T>> = {},
  validationOptions: ValidationOptions = {}
): AutocompleteState<T> & AutocompleteActions<T> {
  const {
    loadOptions,
    pageSize = 50,
    searchDebounceMs = 300,
    cacheResults = true
  } = config;

  // Base select functionality
  const baseSelect = useSelect<T>(undefined, validationOptions);

  // Search state
  const [searchTerm, setSearchTerm] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [asyncOptions, setAsyncOptions] = useState<SelectOption<T>[]>([]);
  const [hasMore, setHasMore] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [cache, setCache] = useState<Map<string, { options: SelectOption<T>[]; hasMore: boolean }>>(new Map());

  // Debounced search term
  const debouncedSearchTerm = useDebounce(searchTerm, searchDebounceMs);

  // Combined options (static + async)
  const allOptions = useMemo(() => {
    return [...options, ...asyncOptions];
  }, [options, asyncOptions]);

  // Filtered options based on search
  const filteredOptions = useMemo(() => {
    if (!debouncedSearchTerm && !loadOptions) {
      return allOptions;
    }

    return filterOptions(allOptions, debouncedSearchTerm);
  }, [allOptions, debouncedSearchTerm, loadOptions]);

  // Async search effect
  useEffect(() => {
    if (!loadOptions || !debouncedSearchTerm) {
      setAsyncOptions([]);
      setIsSearching(false);
      return;
    }

    // Check cache first
    const cacheKey = `${debouncedSearchTerm}-1`;
    if (cacheResults && cache.has(cacheKey)) {
      const cached = cache.get(cacheKey)!;
      setAsyncOptions(cached.options);
      setHasMore(cached.hasMore);
      setCurrentPage(1);
      return;
    }

    setIsSearching(true);
    setCurrentPage(1);

    loadOptions(debouncedSearchTerm, 1)
      .then(result => {
        setAsyncOptions(result.options);
        setHasMore(result.hasMore || false);

        // Cache results
        if (cacheResults) {
          setCache(prev => new Map(prev).set(cacheKey, {
            options: result.options,
            hasMore: result.hasMore || false
          }));
        }
      })
      .catch(error => {
        console.error('Failed to load options:', error);
        setAsyncOptions([]);
        setHasMore(false);
      })
      .finally(() => {
        setIsSearching(false);
      });
  }, [debouncedSearchTerm, loadOptions, cacheResults, cache]);

  // Load more functionality
  const loadMore = useCallback(async () => {
    if (!loadOptions || !hasMore || isSearching) {
      return;
    }

    const nextPage = currentPage + 1;
    const cacheKey = `${debouncedSearchTerm}-${nextPage}`;

    // Check cache first
    if (cacheResults && cache.has(cacheKey)) {
      const cached = cache.get(cacheKey)!;
      setAsyncOptions(prev => [...prev, ...cached.options]);
      setHasMore(cached.hasMore);
      setCurrentPage(nextPage);
      return;
    }

    setIsSearching(true);

    try {
      const result = await loadOptions(debouncedSearchTerm, nextPage);
      setAsyncOptions(prev => [...prev, ...result.options]);
      setHasMore(result.hasMore || false);
      setCurrentPage(nextPage);

      // Cache results
      if (cacheResults) {
        setCache(prev => new Map(prev).set(cacheKey, {
          options: result.options,
          hasMore: result.hasMore || false
        }));
      }
    } catch (error) {
      console.error('Failed to load more options:', error);
    } finally {
      setIsSearching(false);
    }
  }, [loadOptions, hasMore, isSearching, currentPage, debouncedSearchTerm, cacheResults, cache]);

  // Refresh functionality
  const refresh = useCallback(() => {
    setCache(new Map());
    setAsyncOptions([]);
    setCurrentPage(1);
    setHasMore(false);
    
    // Trigger reload if we have a search term
    if (debouncedSearchTerm && loadOptions) {
      setIsSearching(true);
      loadOptions(debouncedSearchTerm, 1)
        .then(result => {
          setAsyncOptions(result.options);
          setHasMore(result.hasMore || false);
        })
        .catch(error => {
          console.error('Failed to refresh options:', error);
        })
        .finally(() => {
          setIsSearching(false);
        });
    }
  }, [debouncedSearchTerm, loadOptions]);

  return {
    ...baseSelect,
    searchTerm,
    isSearching,
    filteredOptions,
    hasMore,
    setSearchTerm,
    loadMore,
    refresh,
  };
}

/**
 * Multi-select hook for multiple selection logic, chip management, and batch operations
 * Provides comprehensive multiple selection functionality with limits and batch operations.
 * 
 * @param initialValues - Initial selected values array
 * @param maxSelections - Maximum number of selections allowed
 * @param validationOptions - Validation configuration
 * @returns Multi-select state and actions
 */
export function useMultiSelect<T = any>(
  initialValues: T[] = [],
  maxSelections?: number,
  validationOptions: ValidationOptions = {}
): MultiSelectState<T> & MultiSelectActions<T> {
  // Base select functionality with array type
  const baseSelect = useSelect<T[]>(initialValues, validationOptions);
  const selectedValues = baseSelect.selectedValue || [];

  // Derived state
  const selectedCount = selectedValues.length;
  const maxReached = maxSelections ? selectedCount >= maxSelections : false;

  // Enhanced setValue to work with arrays
  const setValue = useCallback((values: T[] | undefined) => {
    const normalizedValues = values || [];
    
    // Enforce max selections
    if (maxSelections && normalizedValues.length > maxSelections) {
      return;
    }
    
    baseSelect.setValue(normalizedValues);
  }, [baseSelect, maxSelections]);

  // Add single value
  const addValue = useCallback((value: T) => {
    if (selectedValues.includes(value)) {
      return; // Already selected
    }
    
    if (maxSelections && selectedCount >= maxSelections) {
      return; // Max reached
    }
    
    setValue([...selectedValues, value]);
  }, [selectedValues, selectedCount, maxSelections, setValue]);

  // Remove single value
  const removeValue = useCallback((value: T) => {
    setValue(selectedValues.filter(v => v !== value));
  }, [selectedValues, setValue]);

  // Toggle single value
  const toggleValue = useCallback((value: T) => {
    if (selectedValues.includes(value)) {
      removeValue(value);
    } else {
      addValue(value);
    }
  }, [selectedValues, addValue, removeValue]);

  // Batch operations
  const selectAll = useCallback((availableValues: T[]) => {
    const valuesToSelect = maxSelections 
      ? availableValues.slice(0, maxSelections)
      : availableValues;
    setValue(valuesToSelect);
  }, [maxSelections, setValue]);

  const deselectAll = useCallback(() => {
    setValue([]);
  }, [setValue]);

  const invertSelection = useCallback((availableValues: T[]) => {
    const unselected = availableValues.filter(value => !selectedValues.includes(value));
    const newSelection = maxSelections 
      ? unselected.slice(0, maxSelections)
      : unselected;
    setValue(newSelection);
  }, [selectedValues, maxSelections, setValue]);

  // Clear selection override
  const clearSelection = useCallback(() => {
    setValue([]);
  }, [setValue]);

  return {
    ...baseSelect,
    selectedValue: selectedValues,
    selectedCount,
    maxReached,
    setValue,
    addValue,
    removeValue,
    toggleValue,
    selectAll,
    deselectAll,
    invertSelection,
    clearSelection,
  };
}

/**
 * Select options hook for option normalization and group processing
 * Provides utilities for organizing and managing select options with grouping support.
 * 
 * @param rawOptions - Raw option data to normalize
 * @param groups - Group configuration for organizing options
 * @returns Normalized options and group management utilities
 */
export function useSelectOptions<T = any>(
  rawOptions: (T | SelectOption<T>)[] = [],
  groups: SelectGroup[] = []
): {
  options: SelectOption<T>[];
  groupedOptions: Record<string, SelectOption<T>[]>;
  getOptionByValue: (value: T) => SelectOption<T> | undefined;
  getOptionsByGroup: (groupId: string) => SelectOption<T>[];
  hasGroups: boolean;
  totalOptions: number;
} {
  // Normalize all options
  const options = useMemo(() => {
    return rawOptions.map(normalizeOption);
  }, [rawOptions]);

  // Group options
  const groupedOptions = useMemo(() => {
    return groupOptions(options);
  }, [options]);

  // Utility functions
  const getOptionByValue = useCallback((value: T) => {
    return options.find(option => option.value === value);
  }, [options]);

  const getOptionsByGroup = useCallback((groupId: string) => {
    return groupedOptions[groupId] || [];
  }, [groupedOptions]);

  const hasGroups = Object.keys(groupedOptions).length > 1 || 
    (Object.keys(groupedOptions).length === 1 && !groupedOptions.default);

  return {
    options,
    groupedOptions,
    getOptionByValue,
    getOptionsByGroup,
    hasGroups,
    totalOptions: options.length,
  };
}

/**
 * Keyboard navigation hook for consistent keyboard interactions across select variants
 * Provides arrow key navigation, enter/escape handling, and focus management.
 * 
 * @param options - Available options for navigation
 * @param onSelection - Callback when an option is selected
 * @param onEscape - Callback when escape is pressed
 * @returns Keyboard navigation state and handlers
 */
export function useSelectKeyboard<T = any>(
  options: SelectOption<T>[],
  onSelection?: (value: T) => void,
  onEscape?: () => void
): KeyboardNavigation {
  const [focusedIndex, setFocusedIndex] = useState(0);

  // Clamp focused index to valid range
  const clampedFocusedIndex = useMemo(() => {
    return Math.max(0, Math.min(focusedIndex, options.length - 1));
  }, [focusedIndex, options.length]);

  // Update focused index with clamping
  const updateFocusedIndex = useCallback((newIndex: number) => {
    const clampedIndex = Math.max(0, Math.min(newIndex, options.length - 1));
    setFocusedIndex(clampedIndex);
  }, [options.length]);

  // Movement functions
  const moveFocus = useCallback((direction: 'up' | 'down' | 'home' | 'end') => {
    switch (direction) {
      case 'up':
        updateFocusedIndex(clampedFocusedIndex - 1);
        break;
      case 'down':
        updateFocusedIndex(clampedFocusedIndex + 1);
        break;
      case 'home':
        updateFocusedIndex(0);
        break;
      case 'end':
        updateFocusedIndex(options.length - 1);
        break;
    }
  }, [clampedFocusedIndex, updateFocusedIndex, options.length]);

  // Keyboard event handler
  const handleKeyDown = useCallback((event: React.KeyboardEvent) => {
    switch (event.key) {
      case 'ArrowUp':
        event.preventDefault();
        moveFocus('up');
        break;
      case 'ArrowDown':
        event.preventDefault();
        moveFocus('down');
        break;
      case 'Home':
        event.preventDefault();
        moveFocus('home');
        break;
      case 'End':
        event.preventDefault();
        moveFocus('end');
        break;
      case 'Enter':
      case ' ':
        event.preventDefault();
        if (options[clampedFocusedIndex] && onSelection) {
          onSelection(options[clampedFocusedIndex].value);
        }
        break;
      case 'Escape':
        event.preventDefault();
        if (onEscape) {
          onEscape();
        }
        break;
    }
  }, [moveFocus, clampedFocusedIndex, options, onSelection, onEscape]);

  // Reset focus when options change
  useEffect(() => {
    if (options.length > 0 && clampedFocusedIndex >= options.length) {
      setFocusedIndex(options.length - 1);
    }
  }, [options.length, clampedFocusedIndex]);

  return {
    focusedIndex: clampedFocusedIndex,
    setFocusedIndex: updateFocusedIndex,
    handleKeyDown,
    moveFocus,
  };
}

/**
 * Form integration hook for React Hook Form validation and error handling
 * Provides seamless integration with React Hook Form including validation and state sync.
 * 
 * @param name - Form field name
 * @param validationOptions - Validation configuration
 * @returns Form integration state and handlers
 */
export function useSelectValidation<T extends FieldValues>(
  name: Path<T>,
  validationOptions: ValidationOptions = {}
) {
  const formContext = useFormContext<T>();
  const hasFormContext = !!formContext;

  // Form field registration
  const formField = hasFormContext ? formContext.register(name, {
    required: validationOptions.required ? 'Selection is required' : false,
    validate: (value) => {
      const validation = validateSelection(value, validationOptions.required);
      if (!validation.isValid) {
        return validation.error;
      }

      // Run custom validation if provided
      if (validationOptions.customValidator) {
        const customResult = validationOptions.customValidator(value);
        if (!customResult.isValid) {
          return customResult.error;
        }
      }

      return true;
    }
  }) : null;

  const fieldState = hasFormContext ? formContext.getFieldState(name) : null;
  const fieldValue = hasFormContext ? formContext.getValues(name) : undefined;

  // Form action handlers
  const setValue = useCallback((value: any) => {
    if (hasFormContext) {
      formContext.setValue(name, value, { shouldValidate: true, shouldDirty: true });
    }
  }, [hasFormContext, formContext, name]);

  const trigger = useCallback(() => {
    if (hasFormContext) {
      return formContext.trigger(name);
    }
    return Promise.resolve(true);
  }, [hasFormContext, formContext, name]);

  const clearErrors = useCallback(() => {
    if (hasFormContext) {
      formContext.clearErrors(name);
    }
  }, [hasFormContext, formContext, name]);

  return {
    ...formField,
    value: fieldValue,
    error: fieldState?.error?.message,
    isDirty: fieldState?.isDirty || false,
    isTouched: fieldState?.isTouched || false,
    isValid: !fieldState?.error,
    setValue,
    trigger,
    clearErrors,
    hasFormContext,
  };
}

/**
 * HTTP verb transformation hook for bitmask conversions from Angular df-verb-picker
 * Handles conversion between different verb formats with comprehensive bitmask operations.
 * 
 * @param value - Current verb value
 * @param mode - Transformation mode ('verb', 'verb_multiple', 'number')
 * @returns Verb transformation utilities and state
 */
export function useVerbTransform(
  value: VerbValue | undefined,
  mode: 'verb' | 'verb_multiple' | 'number' = 'verb'
): {
  transformedValue: VerbValue | undefined;
  toBitmask: (verbs: HttpVerb[]) => number;
  fromBitmask: (bitmask: number) => HttpVerb[];
  getVerbBitmask: (verb: HttpVerb) => number;
  isVerbInBitmask: (bitmask: number, verb: HttpVerb) => boolean;
  selectedVerbs: HttpVerb[];
  originalValue: VerbValue | undefined;
  hasChanged: boolean;
} {
  // Transform value based on mode
  const transformedValue = useMemo(() => {
    if (value === undefined || value === null) {
      return undefined;
    }

    switch (mode) {
      case 'verb':
        // Single verb mode - return first verb as string
        if (Array.isArray(value)) {
          return value[0] || undefined;
        }
        if (typeof value === 'number') {
          const verbs = convertBitmaskToVerbs(value);
          return verbs[0] || undefined;
        }
        return value;

      case 'verb_multiple':
        // Multiple verb mode - return array
        if (Array.isArray(value)) {
          return value;
        }
        if (typeof value === 'number') {
          return convertBitmaskToVerbs(value);
        }
        if (typeof value === 'string') {
          return [value as HttpVerb];
        }
        return [];

      case 'number':
        // Bitmask mode - return number
        if (typeof value === 'number') {
          return value;
        }
        if (Array.isArray(value)) {
          return convertVerbsToBitmask(value as HttpVerb[]);
        }
        if (typeof value === 'string') {
          return HTTP_VERB_BITMASKS[value as HttpVerb] || 0;
        }
        return 0;

      default:
        return value;
    }
  }, [value, mode]);

  // Get selected verbs array
  const selectedVerbs = useMemo(() => {
    if (value === undefined || value === null) {
      return [];
    }

    if (Array.isArray(value)) {
      return value as HttpVerb[];
    }
    if (typeof value === 'number') {
      return convertBitmaskToVerbs(value);
    }
    if (typeof value === 'string') {
      return [value as HttpVerb];
    }

    return [];
  }, [value]);

  // Utility functions
  const toBitmask = useCallback((verbs: HttpVerb[]) => {
    return convertVerbsToBitmask(verbs);
  }, []);

  const fromBitmask = useCallback((bitmask: number) => {
    return convertBitmaskToVerbs(bitmask);
  }, []);

  const getVerbBitmask = useCallback((verb: HttpVerb) => {
    return HTTP_VERB_BITMASKS[verb] || 0;
  }, []);

  const isVerbInBitmask = useCallback((bitmask: number, verb: HttpVerb) => {
    const verbValue = HTTP_VERB_BITMASKS[verb];
    return verbValue ? (bitmask & verbValue) === verbValue : false;
  }, []);

  return {
    transformedValue,
    toBitmask,
    fromBitmask,
    getVerbBitmask,
    isVerbInBitmask,
    selectedVerbs,
    originalValue: value,
    hasChanged: transformedValue !== value,
  };
}

// ============================================================================
// COMPOSITE HOOKS
// ============================================================================

/**
 * Complete select hook that combines all select functionality
 * Provides a comprehensive interface for components that need full select capabilities.
 * 
 * @param options - Available options for selection
 * @param config - Configuration including async loading and validation
 * @returns Complete select functionality
 */
export function useCompleteSelect<T = any>(
  options: (T | SelectOption<T>)[] = [],
  config: {
    mode?: 'single' | 'multiple' | 'autocomplete';
    initialValue?: T | T[];
    maxSelections?: number;
    async?: Partial<AsyncLoadingConfig<T>>;
    validation?: ValidationOptions;
    groups?: SelectGroup[];
    formField?: string;
  } = {}
) {
  const {
    mode = 'single',
    initialValue,
    maxSelections,
    async: asyncConfig,
    validation = {},
    groups = [],
    formField,
  } = config;

  // Normalize options
  const optionsData = useSelectOptions(options, groups);

  // Select mode specific functionality
  const singleSelect = useSelect(
    mode === 'single' ? initialValue as T : undefined,
    validation
  );

  const multiSelect = useMultiSelect(
    mode === 'multiple' ? (initialValue as T[] || []) : [],
    maxSelections,
    validation
  );

  const autocompleteSelect = useAutocomplete(
    optionsData.options,
    asyncConfig || {},
    validation
  );

  // Form integration if field name provided
  const formIntegration = formField ? useSelectValidation(formField as any, validation) : null;

  // Keyboard navigation
  const keyboard = useSelectKeyboard(
    mode === 'autocomplete' ? autocompleteSelect.filteredOptions : optionsData.options,
    (value: T) => {
      if (formIntegration) {
        if (mode === 'multiple') {
          const currentValues = Array.isArray(formIntegration.value) ? formIntegration.value : [];
          if (!currentValues.includes(value)) {
            formIntegration.setValue([...currentValues, value]);
          }
        } else {
          formIntegration.setValue(value);
        }
      } else {
        switch (mode) {
          case 'single':
            singleSelect.setValue(value);
            break;
          case 'multiple':
            multiSelect.addValue(value);
            break;
          case 'autocomplete':
            autocompleteSelect.setValue(value);
            break;
        }
      }
    }
  );

  // Select appropriate hook based on mode
  const currentSelect = mode === 'single' ? singleSelect : 
                      mode === 'multiple' ? multiSelect : 
                      autocompleteSelect;

  return {
    // Current state
    mode,
    value: formIntegration ? formIntegration.value : currentSelect.selectedValue,
    isValid: formIntegration ? formIntegration.isValid : currentSelect.isValid,
    error: formIntegration ? formIntegration.error : currentSelect.error,
    isDirty: formIntegration ? formIntegration.isDirty : currentSelect.isDirty,
    isTouched: formIntegration ? formIntegration.isTouched : currentSelect.isTouched,

    // Options data
    ...optionsData,

    // Mode-specific functionality
    single: mode === 'single' ? singleSelect : null,
    multi: mode === 'multiple' ? multiSelect : null,
    autocomplete: mode === 'autocomplete' ? autocompleteSelect : null,

    // Keyboard support
    keyboard,

    // Form integration
    hasFormContext: !!formIntegration,
    formField: formIntegration,

    // Generic actions
    setValue: formIntegration ? formIntegration.setValue : currentSelect.setValue,
    clearSelection: currentSelect.clearSelection,
    validate: formIntegration ? formIntegration.trigger : () => Promise.resolve(currentSelect.validate()),
  };
}